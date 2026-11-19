import {loadCommercialEvidence,buildCommercialProjects} from './commercial-filter-data.mjs';
import {financialReferenceCompatible} from './catalog-financial-witness.mjs';
import {loadEuroOwnerSource,bindEuroOwnerQuotes,unavailableEuroOwnerQuotes,euroOwnerQuoteLoadFailed} from './catalog-euro-owner-quotes.mjs';
import {loadNollagamOwnerQuoteContexts} from './catalog-nollagam-quote-consumer.mjs';
import {loadLocalDocumentaryReview} from './documentary-local-review.mjs';
import {loadCatalogExpansion,appendCatalogExpansion,hasCatalogExpansionMarker,catalogExpansionSourceLabel,publishedFinancialProjects,onlyExpansionResults,sortWithPublishedFinancials,CATALOG_EXPANSION_FAILURE} from './catalog-expansion.mjs';
import {loadExpansionLocations,bindExpansionLocations,hasVerifiedExpansionLocation,EXPANSION_LOCATIONS_FAILURE} from './catalog-expansion-locations.mjs';
import {metroSummary} from './metro-model.mjs';
import {leonCatalogOfferId} from './project-offers.mjs?v=20261030-leon';
import {publicOrigin} from './commercial-context.mjs?v=20261029-euro-1';
import {priceFromLabel,offerPriceLabel,commercialLayerNote,validPrice,projectOffer as selectedOffer,projectFacts,filterAndSort,VIEW_KEY} from './catalog-model.mjs?v=20261029-euro-1';
import {createFilterControls} from './catalog-filter-controls.mjs?v=20261029-euro-1';
import {defaults,matchedLabels} from './catalog-filter-engine.mjs?v=20261029-euro-1';
const entryOrigin=publicOrigin(location.search,null);
const $=id=>document.getElementById(id);
const controls={assetType:$('asset-type'),sortOrder:$('sort-order')};
const grid=$('project-grid'),count=$('project-count'),message=$('catalog-message');
const viewButtons=[...document.querySelectorAll('[data-catalog-view]')];
let projects=[],capacitySearch=null,view='cards',mapInstance=null,mapPromise=null,mapResults=[],filterControls=null,expansionLocations=null;
const mapHost=$('catalog-map');
const element=(tag,text,classes)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(classes)e.className=classes;return e;};
const values=()=>filterControls?.values()??defaults();
const remember=()=>filterControls?.remember();
function ensureMap(){
  if(mapInstance){mapInstance.show();mapInstance.update(mapResults,{assetType:controls.assetType.value,filters:values()});return;}
  if(mapPromise)return;
  mapHost.setAttribute('aria-busy','true');mapHost.replaceChildren(element('p','Cargando mapa…','catalog-map-status'));
  mapPromise=import('./catalog-map.mjs?v=20261029-euro-1').then(({createCatalogMap})=>createCatalogMap({host:mapHost,origin:entryOrigin,additionalLocations:expansionLocations})).then(instance=>{
    mapInstance=instance;if((view==='map'||view==='split')){instance.show();instance.update(mapResults,{assetType:controls.assetType.value,filters:values()});}else instance.hide();
  }).catch(error=>{
    mapHost.setAttribute('aria-busy','false');const note=element('p','El mapa no pudo cargar. Puedes seguir explorando todos los resultados en Tarjetas o Listado.');note.setAttribute('role','status');
    const fallback=element('button','Continuar en Listado','catalog-text-button');fallback.type='button';fallback.addEventListener('click',()=>viewButtons.find(b=>b.dataset.catalogView==='list').click());mapHost.replaceChildren(note,fallback);
  });
}
function applyView(){
  grid.dataset.view=view;grid.hidden=view==='map';grid.dataset.view=view==='split'?'list':view;grid.closest('main').classList.toggle('catalog-split-active',view==='split');mapHost.hidden=!['map','split'].includes(view);
  viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.catalogView===view)));
  if((view==='map'||view==='split')){if(view==='map')grid.replaceChildren();ensureMap();}else mapInstance?.hide();
}
viewButtons.forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.catalogView===view)return;
  view=button.dataset.catalogView;applyView();render();remember();
  try{localStorage.setItem(VIEW_KEY,view);}catch{}
  // The same DOM items changed geometry. Refresh the unchanged shared scroll helper.
  window.dispatchEvent(new Event('resize'));
}));
function card(project){
  const article=element('article',undefined,'catalog-item');article.dataset.project=project.slug;
  const group=element('div',undefined,'catalog-card');
  const cover=element('div',undefined,'catalog-cover s-parallax-frame');
  const placeholder=()=>{const box=element('div',undefined,'catalog-cover-placeholder');const brand=element('img');brand.src='/assets/branding/sollahms-logo-light.svg';brand.alt='Sollahms';brand.width=114;brand.height=22;box.append(brand,element('span','Imagen no disponible'));cover.replaceChildren(box);};
  if(typeof project.imagenPrincipal==='string'&&(/^\/assets\/propiedades\/[a-z0-9/._-]+\.(?:webp|jpe?g|png)$/i.test(project.imagenPrincipal)||hasCatalogExpansionMarker(project)&&/^\/assets\/iris-expansion-20261118\/[a-f0-9]{64}\.(?:webp|avif|jpe?g|png)$/i.test(project.imagenPrincipal))){
    const img=element('img',undefined,'catalog-cover-image');img.src=project.imagenPrincipal;img.alt=project.imagenAlt||'Imagen del proyecto '+project.nombre;img.width=1600;img.height=900;img.loading='lazy';img.decoding='async';img.addEventListener('error',placeholder,{once:true});cover.append(img);
  }else placeholder();
  const summary=element('div',undefined,'catalog-summary');
  const identity=element('div',undefined,'catalog-identity');const title=element('h2',project.nombre,'catalog-card-title');title.id='catalog-'+project.slug;article.setAttribute('aria-labelledby',title.id);
  identity.append(title,element('p',[project.comuna,project.region].filter(Boolean).join(' · '),'catalog-location'));
  if(project.inmobiliaria)identity.append(element('p',project.inmobiliaria,'catalog-builder'));
  summary.append(identity);const metro=metroSummary(project,values());if(metro){const line=element('p',metro.station+' · '+metro.lines+' · '+metro.distance,'catalog-metro-summary');line.title=metro.note;summary.append(line);}
  const facts=projectFacts(project,controls.assetType.value||(values().propertyType==='local'?'Comercial':''),values());
  if(facts.length){const dl=element('dl',undefined,'catalog-facts');for(const fact of facts){const row=element('div');row.append(element('dt',fact.label),element('dd',fact.value));dl.append(row);}summary.append(dl);}
  const matches=matchedLabels(project,values());
  if(matches.length){const badges=element('ul',undefined,'cf-match-list');badges.setAttribute('aria-label','Coincidencias verificadas');for(const label of matches.slice(0,3))badges.append(element('li',label));if(matches.length>3)badges.append(element('li','+'+(matches.length-3)+' coincidencias'));summary.append(badges);}
  group.append(cover,summary);article.append(group);
  // Action area is deliberately outside the opacity group; finance controls stay static too.
  const body=element('div',undefined,'catalog-card-body');body.dataset.scrollStatic='';
  const actions=element('div',undefined,'catalog-actions'),price=element('div',undefined,'catalog-price');const offer=selectedOffer(project,values());
  if(validPrice(offer.value)){
    price.append(element('p',offerPriceLabel(project,values()),'catalog-price-value'));
    if(offer.typology)price.append(element('p',offer.typology==='Local'?'Local comercial':offer.typology,'catalog-price-type'));
  }else price.append(element('p',offerPriceLabel(project,values()),'catalog-price-unavailable'));
  if(offer.expansion){const source=element(offer.sourceURL?'a':'span',catalogExpansionSourceLabel(project,values()),'catalog-expansion-source');if(offer.sourceURL){source.href=offer.sourceURL;source.target='_blank';source.rel='noopener noreferrer';}price.append(source);}
  if(commercialLayerNote(project,values()))price.append(element('p',commercialLayerNote(project,values()),'catalog-price-type'));
  actions.append(price);
  if(typeof project.detalleUrl==='string'&&/^\/[a-z0-9-]+\.html$/.test(project.detalleUrl)){
    const link=element('a','Ver detalles','catalog-details-link');const current=values(),base=defaults(),filtered=Object.keys(base).some(k=>k!=='version'&&JSON.stringify(current[k])!==JSON.stringify(base[k]));const source=entryOrigin??(filtered?'buscador':'catalogo');link.href=project.detalleUrl+'?origen='+source+(project.catalogPricePolicy==='by-product'&&(current.assetType==='Comercial'||current.propertyType==='local'||offer.euroOwnerQuote&&offer.propertyType==='local')?'&oferta=local':'')+(['AJ Urbana','Sento'].includes(project.inmobiliaria)&&/^[012]$/.test(current.bedrooms)&&project.commercialOffers?.some(o=>o.id===current.bedrooms+'d')?'&oferta='+current.bedrooms+'d':'')+(leonCatalogOfferId(project,current)?'&oferta='+leonCatalogOfferId(project,current):'')+(project._ecasaStageNumber?'#etapa-'+project._ecasaStageNumber:'');link.setAttribute('aria-label','Ver detalles de '+project.nombre);actions.append(link);
    if(current.evidenceMode==='documentary'){link.textContent='Ver ficha publicada';link.href=project.detalleUrl+'?origen='+source;link.setAttribute('aria-label','Ver ficha publicada de '+project.nombre);}
  }
  if(view==='split'&&hasCatalogExpansionMarker(project)&&!hasVerifiedExpansionLocation(project,expansionLocations))actions.append(element('span','Coordenadas por verificar','catalog-expansion-note'));
  else if(view==='split'){const b=element('button','Ubicar en mapa','catalog-text-button');b.type='button';b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('catalog-list-selection',{detail:{slug:project.slug}})));actions.append(b);}
  body.append(actions);article.append(body);
  if(values().evidenceMode==='published'&&financialReferenceCompatible(projects.find(original=>original.slug===project.slug),offer)&&!(project.preciosPorTipologia&&(controls.assetType.value==='Comercial'||values().propertyType==='local')))capacitySearch?.decorateCard(article,project);
  const financial=body.querySelector('.capacity-result');
  if(financial){
    // Review dates remain in the source data; the financial scenario keeps all amounts/conditions.
    financial.querySelectorAll('dt').forEach(dt=>{if(dt.textContent==='Revisión del precio')dt.parentElement.remove();});
    const details=element('details',undefined,'catalog-finance');details.dataset.scrollStatic='';
    details.append(element('summary','Ver escenario financiero'),financial);article.append(details);
  }
  return article;
}
function render(){
  let sorted=filterAndSort(projects,values());
  const expansionOnly=onlyExpansionResults(projects,sorted,values().developers);
  const referenceMode=values().evidenceMode!=='published'||expansionOnly;
  const capacitySection=$('capacity-toggle').closest('.capacity-search');if(capacitySection)capacitySection.hidden=expansionOnly;
  $('capacity-toggle').hidden=referenceMode;
  $('capacity-summary').hidden=referenceMode;
  if(referenceMode){$('capacity-form').hidden=true;$('capacity-toggle').setAttribute('aria-expanded','false');}
  if(!referenceMode&&controls.sortOrder.value==='original')sorted=sortWithPublishedFinancials(sorted,list=>capacitySearch?.sortProjects(list));
  mapResults=sorted;
  if((view==='map'||view==='split')){grid.replaceChildren(...(view==='split'?sorted.map(card):[]));if(mapInstance)mapInstance.update(sorted,{assetType:controls.assetType.value,filters:values()});else ensureMap();}
  else grid.replaceChildren(...sorted.map(card));
  count.textContent=sorted.length===projects.length?projects.length+' proyectos':sorted.length+' de '+projects.length+' proyectos';
  message.textContent=filterControls?.issue()||(sorted.length?'':'No encontramos coincidencias documentadas con esta combinación. Puedes quitar una característica, ampliar el rango o modificar la ubicación.');
  $('catalog-feedback').hidden=!!sorted.length;$('empty-reset').hidden=!!sorted.length;
  filterControls?.updateCount(sorted.length);remember();
}
async function load(){
  try{
    const response=await fetch('/data/proyectos.json',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('catalogue unavailable');
    const data=await response.json();if(!Array.isArray(data)||new Set(data.map(p=>p.slug)).size!==data.length)throw Error('catalogue identity');
    data.forEach(project=>{if(!project||typeof project.slug!=='string'||typeof project.nombre!=='string'||!/^\/[a-z0-9-]+\.html$/.test(project.detalleUrl))throw Error('catalogue identity');});
    const euroOwnerSource=loadEuroOwnerSource().then(source=>({source}),()=>({unavailable:true}));
    const nollagamOwnerContexts=loadNollagamOwnerQuoteContexts(data);
    const expansionSource=loadCatalogExpansion().then(source=>({source}),()=>({unavailable:true}));
    const expansionLocationSource=loadExpansionLocations().then(source=>({source}),()=>({unavailable:true}));
    const metroData=Promise.all(['/data/metro-network.json','/data/project-metro.json'].map(async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('metro');const text=await r.text();return {data:JSON.parse(text),text};})).catch(()=>null);
    let index={projects:{},filters:[],typologies:[]};
    try{const response=await fetch('/data/catalog-facets.json?v=20261029-euro-1',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('facets unavailable');index=await response.json();if(index.schemaVersion!==1||!index.projects)throw Error('facets schema');}
    catch{const note=$('advanced-data-status');note.hidden=false;note.textContent='Los filtros por características no pudieron cargar. Puedes seguir buscando por ubicación, nombre y precio.';}
    try{const [networkSource,connectionsSource]=await metroData,network=networkSource.data,connections=connectionsSource.data;if(network.schemaVersion!==1||connections.schemaVersion!==1)throw Error('metro schema');index.metro=network;index.metroProjects=connections.projects;index.metroSourceText=networkSource.text;}catch{document.getElementById('metro-filter-section').hidden=true;document.getElementById('metro-load-status').hidden=false;}
    projects=data.map(p=>({...p,_metro:index.metroProjects?.[p.slug],_facets:index.projects[p.slug]??{assetTypes:p.tiposActivos??[p.tipoActivo].filter(Boolean),states:[p.estado].filter(Boolean)}}));
    try{projects=buildCommercialProjects(projects,await loadCommercialEvidence(),index);}
    catch{const note=$('advanced-data-status');note.hidden=false;note.textContent='Las referencias Leben no pudieron cargar. Se muestran los datos publicados.';index.preparedUnavailable=true;}
    const euroOwner=await euroOwnerSource;
    try{projects=euroOwner.source?bindEuroOwnerQuotes(projects,euroOwner.source):unavailableEuroOwnerQuotes(projects);}
    catch{projects=unavailableEuroOwnerQuotes(projects);}
    if(projects.some(euroOwnerQuoteLoadFailed)){const note=$('advanced-data-status');note.hidden=false;note.textContent+=(note.textContent?' ':'')+'Las cotizaciones Euro por tipología no pudieron validarse. Sus consultas con precio quedan limitadas; las consultas sin precio siguen disponibles.';}
    const nollagamOwner=await nollagamOwnerContexts;
    projects=projects.map(project=>nollagamOwner.bySlug[project.slug]?{...project,_nollagamOwnerQuoteContext:nollagamOwner.bySlug[project.slug]}:project);
    if(nollagamOwner.status!=='ready'){const note=$('advanced-data-status');note.hidden=false;note.textContent+=(note.textContent?' ':'')+'Las referencias Nollagam por tipología no pudieron validarse. Sus consultas con precio quedan limitadas; las consultas sin precio siguen disponibles.';}
    try{const localReview=await loadLocalDocumentaryReview(projects,{location,fetchImpl:fetch});if(localReview){projects=localReview.projects;Object.assign(index,localReview.index);}}
    catch{const note=$('advanced-data-status');note.hidden=false;note.textContent+=(note.textContent?' ':'')+'La revisión documental local no pudo cargar. Se muestran los datos publicados; la fuente documental no está disponible.';index.documentaryReviewEnabled=false;index.documentaryUnavailable=true;}
    const expansion=await expansionSource;
    try{if(!expansion.source)throw Error('expansion unavailable');projects=appendCatalogExpansion(projects,expansion.source);index.expansionCount=21;}
    catch{let note=$('catalog-expansion-status');if(!note){note=element('p',undefined,'catalog-expansion-note');note.id='catalog-expansion-status';note.setAttribute('role','status');note.setAttribute('aria-live','polite');count.parentElement.insertBefore(note,count);}note.hidden=false;note.textContent=CATALOG_EXPANSION_FAILURE;index.expansionUnavailable=true;}
    if(index.expansionCount===21){
      try{const source=await expansionLocationSource;if(!source.source)throw Error('locations unavailable');const geography=await bindExpansionLocations(projects,source.source,{networkText:index.metroSourceText});projects=geography.projects;expansionLocations=geography.locations;}
      catch{const note=element('p',EXPANSION_LOCATIONS_FAILURE,'catalog-expansion-note');note.id='catalog-expansion-location-status';note.setAttribute('role','status');note.setAttribute('aria-live','polite');count.parentElement.insertBefore(note,count);}
    }
    filterControls=createFilterControls({projects,index,onChange:render,getView:()=>view,setView:next=>{view=next;applyView();}});applyView();render();
    $('catalog-static-directory').hidden=true;
    viewButtons.forEach(c=>c.disabled=false);
    import('/assets/js/purchase-capacity-ui.mjs').then(({initializeCapacitySearch})=>{capacitySearch=initializeCapacitySearch({projects:publishedFinancialProjects(projects),onChange:render});$('capacity-toggle').disabled=false;render();}).catch(()=>{$('capacity-summary').textContent='El buscador financiero no pudo cargar. Puedes seguir utilizando los filtros del catálogo.';});
  }catch(error){
    grid.replaceChildren();count.textContent='';$('catalog-feedback').hidden=false;$('empty-reset').hidden=true;
    message.textContent=['TimeoutError','AbortError'].includes(error.name)?'La carga tardó demasiado. Puedes explorar las fichas en el directorio siguiente.':'No pudimos cargar el catálogo. Puedes explorar las fichas en el directorio siguiente.';
  }finally{grid.setAttribute('aria-busy','false');}
}
window.addEventListener('catalog-map-selection',e=>{for(const item of grid.querySelectorAll('[data-project]')){const selected=item.dataset.project===e.detail?.slug;item.classList.toggle('is-map-selected',selected);item.querySelector('button.catalog-text-button')?.setAttribute('aria-pressed',String(selected));if(selected&&e.detail.revealList&&view==='split'&&innerWidth>=1100){const rect=item.getBoundingClientRect();if(rect.top<100||rect.bottom>innerHeight)item.scrollIntoView({block:'nearest',behavior:'instant'});}}});
load();


