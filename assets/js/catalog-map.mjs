import {leonCatalogOfferId} from './project-offers.mjs?v=20261030-leon';
import {publicOrigin} from './commercial-context.mjs?v=20261029-euro-1';
import {matchedLabels,defaults} from './catalog-filter-engine.mjs?v=20261029-euro-1';
import {priceFromLabel,projectOffer as selectedOffer,projectFacts,validPrice} from './catalog-model.mjs?v=20261029-euro-1';
import {locateProjects,locationGroups,clusterLocations,validMapState,MAP_STATE_KEY} from './catalog-map-model.mjs';
const el=(tag,text,classes)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(classes)node.className=classes;return node;};
const price=value=>new Intl.NumberFormat('es-CL',{maximumFractionDigits:2,minimumFractionDigits:Number.isInteger(value)?0:2}).format(value);
const json=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('map-resource');return r.json();};
let libraryPromise;
function leaflet(){
  if(libraryPromise)return libraryPromise;
  libraryPromise=new Promise((resolve,reject)=>{
    const script=el('script');script.src='/assets/vendor/leaflet-1.9.4/leaflet.js';script.id='catalog-leaflet';
    const timer=setTimeout(()=>reject(Error('map-library-timeout')),12000);
    script.onload=()=>{clearTimeout(timer);window.L?.map?resolve(window.L):reject(Error('map-library'));};
    script.onerror=()=>{clearTimeout(timer);reject(Error('map-library'));};document.head.append(script);
  });return libraryPromise;
}
async function styles(url,id){
  if(document.getElementById(id))return;
  await new Promise((resolve,reject)=>{const link=el('link');link.rel='stylesheet';link.href=url;link.id=id;
    const timer=setTimeout(()=>reject(Error('map-style-timeout')),12000);
    link.onload=()=>{clearTimeout(timer);resolve();};link.onerror=()=>{clearTimeout(timer);reject(Error('map-style'));};
    // Preserve the shared theme as the final stylesheet.
    const theme=document.querySelector('link[href*="sollahms-theme.css"]');document.head.insertBefore(link,theme);
  });
}
export async function createCatalogMap({host,onAlternative,origin=null}){
  const [L,registry,provider]=await Promise.all([leaflet(),json('/data/project-locations.json'),json('/data/map-provider.json'),styles('/assets/vendor/leaflet-1.9.4/leaflet.css','catalog-leaflet-style'),styles('/assets/css/catalog-map.css','catalog-map-style')]);
  if(!registry.locations||!/^https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png$/.test(provider.tileUrl))throw Error('map-config');
  host.replaceChildren();host.setAttribute('aria-busy','false');
  const toolbar=el('div',undefined,'catalog-map-toolbar'),status=el('p',undefined,'catalog-map-status');status.id='map-result-status';status.setAttribute('role','status');
  const fit=el('button','Mostrar todos los resultados','catalog-map-button');fit.type='button';
  toolbar.append(status,fit);
  const note=el('p',undefined,'catalog-map-note'),pending=el('details',undefined,'catalog-map-pending'),pendingSummary=el('summary'),pendingList=el('ul');pending.append(pendingSummary,pendingList);
  const layout=el('div',undefined,'catalog-map-layout'),mapColumn=el('div',undefined,'catalog-map-column'),canvas=el('div',undefined,'catalog-map-canvas');canvas.id='catalog-map-canvas';canvas.setAttribute('aria-label','Mapa de proyectos. Usa los controles para acercar o alejar y las flechas del teclado para desplazarte.');canvas.setAttribute('role','region');
  const help=el('div',undefined,'catalog-map-help'),panToggle=el('button','Activar movimiento del mapa','catalog-text-button');panToggle.type='button';panToggle.setAttribute('aria-pressed','false');
  help.append(el('span','Usa + y − para acercar o alejar. El desplazamiento de la página permanece libre.'),panToggle);
  const tileError=el('p','El mapa base no pudo cargar. Puedes seguir eligiendo proyectos o usar Tarjetas y Listado.','catalog-map-warning');tileError.hidden=true;tileError.setAttribute('role','status');
  const precisionNote=el('p','Ubicaciones referenciales; el acceso puede variar.','catalog-map-note');
  mapColumn.append(canvas,help,precisionNote,tileError);
  const panel=el('div',undefined,'catalog-map-panel'),label=el('label','Proyecto en el mapa'),select=el('select',undefined,'catalog-control');select.id='map-project-choice';label.htmlFor=select.id;
  const selectionStatus=el('p',undefined,'catalog-map-selection-status');selectionStatus.setAttribute('role','status');
  const detail=el('div',undefined,'catalog-map-detail');detail.id='map-project-detail';
  const nearby=el('div',undefined,'catalog-map-nearby');nearby.hidden=true;
  panel.append(label,select,selectionStatus,nearby,detail);layout.append(mapColumn,panel);host.append(toolbar,note,pending,layout);
  const coarse=matchMedia('(pointer:coarse)').matches||innerWidth<768;
  const map=L.map(canvas,{zoomControl:true,scrollWheelZoom:false,dragging:!coarse,touchZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:true,inertia:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,minZoom:4,maxZoom:19,maxBounds:[[-58,-80],[-15,-64]],maxBoundsViscosity:1});
  map.zoomControl.setPosition('topleft');map.zoomControl.options.zoomInTitle='Acercar';map.zoomControl.options.zoomOutTitle='Alejar';
  const zin=canvas.querySelector('.leaflet-control-zoom-in'),zout=canvas.querySelector('.leaflet-control-zoom-out');
  zin?.setAttribute('aria-label','Acercar mapa');zin?.setAttribute('title','Acercar mapa');zout?.setAttribute('aria-label','Alejar mapa');zout?.setAttribute('title','Alejar mapa');
  map.attributionControl.setPrefix(false);
  const tiles=L.tileLayer(provider.tileUrl,{attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',maxZoom:19,keepBuffer:0,updateWhenIdle:true,updateWhenZooming:false,noWrap:true,referrerPolicy:'strict-origin-when-cross-origin'}).addTo(map);
  tiles.on('tileerror',()=>{tileError.hidden=false;});
  const markers=L.layerGroup().addTo(map);
  let rows=[],locations=[],selected=null,type='',initial=true,active=true,currentKey='',restored=null,filterState=defaults();
  try{const v=JSON.parse(sessionStorage.getItem(MAP_STATE_KEY));if(validMapState(v))restored=v;}catch{}
  function remember(){if(!map._loaded)return;const c=map.getCenter(),v={version:1,lat:c.lat,lng:c.lng,zoom:map.getZoom(),selected};if(validMapState(v))try{sessionStorage.setItem(MAP_STATE_KEY,JSON.stringify(v));}catch{}}
  function togglePan(enabled){enabled?map.dragging.enable():map.dragging.disable();panToggle.setAttribute('aria-pressed',String(enabled));panToggle.textContent=enabled?'Desactivar movimiento del mapa':'Activar movimiento del mapa';canvas.classList.toggle('map-pan-enabled',enabled);}
  togglePan(!coarse);panToggle.addEventListener('click',()=>togglePan(!map.dragging.enabled()));
  function fitAll(){if(!locations.length)return;const bounds=L.latLngBounds(locations.map(p=>[p.lat,p.lng]));map.fitBounds(bounds,{padding:[32,32],maxZoom:15,animate:false});}
  fit.addEventListener('click',fitAll);
  function showSelection(slug,{reveal=false,announce=true}={}){
    const row=rows.find(r=>r.project.slug===slug);selected=row?slug:null;select.value=selected||'';detail.replaceChildren();
    if(!row){selectionStatus.textContent='Selecciona un marcador o un proyecto para ver su información.';detail.append(el('p','Los grupos muestran cuántos proyectos hay en cada zona. Acércate para explorar sus ubicaciones.','catalog-map-empty'));redraw();remember();return;}
    const p=row.project;selectionStatus.textContent=announce?'Seleccionado: '+p.nombre:'';
    const figure=el('div',undefined,'catalog-map-image');if(p.imagenPrincipal){const image=el('img');image.src=p.imagenPrincipal;image.alt=p.imagenAlt||'Imagen del proyecto '+p.nombre;image.width=480;image.height=300;image.decoding='async';image.addEventListener('error',()=>figure.replaceChildren(el('span','Imagen no disponible')),{once:true});figure.append(image);}
    const title=el('h2',p.nombre),location=el('p',[p.comuna,p.region].filter(Boolean).join(' · '),'catalog-location');
    const facts=el('dl',undefined,'catalog-facts');for(const fact of projectFacts(p,type||(filterState.propertyType==='local'?'Comercial':''))){const item=el('div');item.append(el('dt',fact.label),el('dd',fact.value));facts.append(item);}
    const offer=selectedOffer(p,filterState),amount=el('p',priceFromLabel(offer.value,p.precioDecimales),'catalog-price-value');
    const link=el('a','Ver ficha','catalog-details-link');link.href=p.detalleUrl+'?origen='+(origin??publicOrigin(location.search,'buscador'))+(p.catalogPricePolicy==='by-product'&&(type==='Comercial'||filterState.propertyType==='local')?'&oferta=local':'')+(['AJ Urbana','Sento'].includes(p.inmobiliaria)&&/^[012]$/.test(filterState.bedrooms)&&p.commercialOffers?.some(o=>o.id===filterState.bedrooms+'d')?'&oferta='+filterState.bedrooms+'d':'')+(leonCatalogOfferId(p,filterState)?'&oferta='+leonCatalogOfferId(p,filterState):'')+(p._ecasaStageNumber?'#etapa-'+p._ecasaStageNumber:'');link.setAttribute('aria-label','Ver ficha de '+p.nombre);
    detail.append(figure,title,location);const address=p.direccion||row.location.siteAddress;if(address)detail.append(el('p',address+(row.location.siteAddress?' · conjunto':''),'catalog-location'));if(row.location.publicNote)detail.append(el('p',row.location.publicNote,'catalog-location'));detail.append(facts,amount);if(offer.typology)detail.append(el('p',offer.typology==='Local'?'Local comercial':offer.typology,'catalog-price-type'));detail.append(link);
    const matches=matchedLabels(p,filterState);if(matches.length){const list=el('ul',undefined,'cf-match-list');list.setAttribute('aria-label','Coincidencias verificadas');for(const label of matches.slice(0,3))list.append(el('li',label));detail.append(list);}
    if(reveal){map.setView([row.location.lat,row.location.lng],Math.max(15,map.getZoom()),{animate:false});}
    redraw();remember();
  }
  function chooseGroup(group){
    const slugs=new Set(group.flatMap(g=>g.rows.map(r=>r.project.slug)));const choices=rows.filter(r=>slugs.has(r.project.slug));
    if(choices.length===1){nearby.hidden=true;showSelection(choices[0].project.slug);return;}
    const bounds=L.latLngBounds(group.map(p=>[p.lat,p.lng]));
    if(group.length>1&&map.getZoom()<18){map.fitBounds(bounds,{padding:[48,48],maxZoom:Math.min(18,map.getZoom()+3),animate:false});}
    nearby.replaceChildren(el('p',choices.length+' proyectos en esta ubicación o grupo. Elige uno:'));
    for(const row of choices){const button=el('button',row.project.nombre,'catalog-map-choice');button.type='button';button.setAttribute('aria-pressed',String(row.project.slug===selected));button.addEventListener('click',()=>{showSelection(row.project.slug);for(const b of nearby.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));});nearby.append(button);}
    nearby.hidden=false;selectionStatus.textContent=choices.length+' proyectos agrupados. Puedes elegirlos debajo.';
  }
  function redraw(){
    if(!map._loaded||!active)return;const focused=document.activeElement?.dataset?.mapMarker;markers.clearLayers();
    const clustered=clusterLocations(locations,p=>map.latLngToLayerPoint([p.lat,p.lng]));
    for(const group of clustered){
      const all=group.flatMap(p=>p.rows),containsSelected=all.some(r=>r.project.slug===selected),multi=all.length>1;
      const bounds=L.latLngBounds(group.map(p=>[p.lat,p.lng]));const point=group.length===1?[group[0].lat,group[0].lng]:bounds.getCenter();
      const label=multi?all.length+' proyectos agrupados':all[0].project.nombre;
      const icon=L.divIcon({className:'catalog-map-marker'+(multi?' is-cluster':'')+(containsSelected?' is-selected':''),html:'<span aria-hidden="true">'+(multi?all.length:'')+'</span>',iconSize:[40,40],iconAnchor:[20,20]});
      const marker=L.marker(point,{icon,keyboard:true,title:label,alt:label,riseOnHover:false});
      marker.on('add',()=>{
        const dom=marker.getElement();if(!dom)return;
        dom.dataset.mapMarker=group.map(p=>p.lat+','+p.lng).join('|');dom.setAttribute('role','button');dom.setAttribute('aria-label',label+(containsSelected?' · seleccionado':''));dom.setAttribute('aria-pressed',String(containsSelected));
        dom.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();event.stopPropagation();chooseGroup(group);}});
      });
      marker.on('click',()=>chooseGroup(group));marker.addTo(markers);
    }
    if(focused){const replacement=[...canvas.querySelectorAll('[data-map-marker]')].find(e=>e.dataset.mapMarker===focused);(replacement||canvas).focus({preventScroll:true});}
  }
  select.addEventListener('change',()=>{nearby.hidden=true;showSelection(select.value,{reveal:true});});
  map.on('moveend',()=>{redraw();remember();});
  function update(projects,options={}){
    type=options.assetType||'';filterState=options.filters??defaults();const result=locateProjects(projects,registry);rows=result.located;locations=locationGroups(rows);
    const key=projects.map(p=>p.slug).join('|')+'|'+type;
    status.textContent=rows.length+' de '+projects.length+' resultados disponibles en el mapa';
    note.textContent=result.pending.length?result.pending.length+' '+(result.pending.length===1?'proyecto conserva':'proyectos conservan')+' su ficha en Tarjetas y Listado. Sus coordenadas están pendientes de verificación.':'';note.hidden=!result.pending.length;
    pending.hidden=!result.pending.length;pendingSummary.textContent='Ver direcciones y coordenadas pendientes ('+result.pending.length+')';pendingList.replaceChildren();
    for(const project of result.pending){const li=el('li'),link=el('a',project.nombre);link.href=project.detalleUrl;li.append(link,el('span',' — '+(project.direccion?project.direccion+', '+project.comuna+'. '+(registry.addressNotes?.[project.slug]||'Coordenadas por confirmar.'):'Dirección y coordenadas por confirmar.')));pendingList.append(li);}
    const previous=selected;select.replaceChildren(new Option('Elige un proyecto',''));for(const row of rows)select.append(new Option(row.project.nombre+' · '+row.project.comuna,row.project.slug));
    select.disabled=!rows.length;fit.disabled=!rows.length;
    if(key!==currentKey){nearby.hidden=true;currentKey=key;}
    if(initial){initial=false;if(restored){map.setView([restored.lat,restored.lng],restored.zoom,{animate:false});selected=restored.selected;}else if(locations.length)fitAll();else map.setView([-33.45,-70.65],5,{animate:false});}
    else selected=previous;
    if(!rows.some(r=>r.project.slug===selected))selected=null;
    showSelection(selected,{announce:true});
    if(!rows.length)selectionStatus.textContent=projects.length?'No hay ubicaciones verificadas para estos filtros. Explora las fichas en Tarjetas o Listado.':'No hay resultados para estos filtros. Puedes limpiarlos para continuar.';
    if(active)map.invalidateSize({pan:false});
  }
  return {update,show(){active=true;map.invalidateSize({pan:false});redraw();},hide(){remember();active=false;}};
}

