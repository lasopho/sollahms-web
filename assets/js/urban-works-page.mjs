import {loadUrbanData, publicWorks, relationshipsFor, distanceLabel, statusLabel} from './urban-works-model.mjs';

const byId=id=>document.getElementById(id);
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):value||'No documentada';
const external=url=>{try{const parsed=new URL(url);return parsed.protocol==='https:'?parsed.href:null;}catch{return null;}};
const keys={region:'uw-region',comuna:'uw-commune',tipo:'uw-type',estado:'uw-state'};
const controls=Object.fromEntries(Object.entries(keys).map(([key,id])=>[key,byId(id)]));
const defaults={region:'Todas las regiones',comuna:'Todas las comunas',tipo:'Todos los tipos',estado:'Todos los estados'};
let data,works=[],visible=[],projectScope='',selected='',map=null,layer=null,mapPromise=null,mapVisible=false,baseTiles=null,baseVisible=true;
const mapLayers=new Map();
const state=()=>Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value]));
const sort=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));

function options(key,values){
  const current=controls[key].value;controls[key].replaceChildren(new Option(defaults[key],''));
  sort(values).forEach(value=>controls[key].append(new Option(key==='estado'?statusLabel(value):value,value)));
  if([...controls[key].options].some(o=>o.value===current))controls[key].value=current;
}
function updateCommunes(){options('comuna',[...works.filter(w=>!controls.region.value||w.region===controls.region.value).flatMap(w=>w.communes||[]),...data.projects.filter(p=>!controls.region.value||p.region===controls.region.value).map(p=>p.comuna)]);}
function writeUrl(){
  const url=new URL(location.href);for(const [key,value] of Object.entries(state()))value?url.searchParams.set(key,value):url.searchParams.delete(key);
  projectScope?url.searchParams.set('proyecto',projectScope):url.searchParams.delete('proyecto');
  selected?url.searchParams.set('obra',selected):url.searchParams.delete('obra');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function restoreUrl(){
  const params=new URL(location.href).searchParams;
  for(const key of ['region','tipo','estado'])controls[key].value=[...controls[key].options].some(o=>o.value===params.get(key))?params.get(key):'';
  updateCommunes();controls.comuna.value=[...controls.comuna.options].some(o=>o.value===params.get('comuna'))?params.get('comuna'):'';
  projectScope=data.projects.some(p=>p.slug===params.get('proyecto'))?params.get('proyecto'):'';
  selected=works.some(w=>w.id===params.get('obra'))?params.get('obra'):'';
}
function sourceLink(source){
  const li=node('li'),url=external(source.url);
  if(url){const a=node('a',source.title||'Fuente oficial');a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);}else li.append(node('span',source.title||'Fuente pendiente de enlace'));
  if(source.date)li.append(node('small','Fecha de la fuente: '+date(source.date)));
  return li;
}
function details(work){
  const box=node('details',undefined,'uw-details');box.append(node('summary','Consultar detalles y fuentes'));
  box.append(node('p','Responsable: '+work.responsible));
  if(work.locationText)box.append(node('p','Ubicación: '+work.locationText));
  if(work.estimatedStart)box.append(node('p','Inicio estimado documentado: '+date(work.estimatedStart)));
  if(work.estimatedEnd)box.append(node('p','Término estimado documentado: '+date(work.estimatedEnd)+'. Sujeto a cambios.'));
  for(const [title,items] of [['Aspectos a considerar',work.cautions],['Incertidumbres y alcance',work.uncertainties]]){
    if(items?.length){box.append(node('h3',title));const list=node('ul');items.forEach(x=>list.append(node('li',x)));box.append(list);}
  }
  box.append(node('h3','Fuentes de la información'));const sources=node('ul',undefined,'uw-source-list');(work.sources||[]).forEach(s=>sources.append(sourceLink(s)));box.append(sources);
  if(work.geometrySource?.url){box.append(node('h3','Referencia geográfica'));const geo=node('ul',undefined,'uw-source-list');geo.append(sourceLink(work.geometrySource));box.append(geo);}
  box.append(node('p','Última revisión: '+date(work.reviewedOn)+'. La revisión no implica que la fuente haya sido publicada en esa fecha.'));
  return box;
}
function related(work){
  const relations=relationshipsFor(data,work.id);
  if(!relations.length)return node('p','Sin asociación a proyectos validada en esta revisión.','uw-pending');
  const section=node('section',undefined,'uw-related');section.append(node('h3','Proyectos relacionados'));const list=node('ul');
  relations.forEach(rel=>{
    const project=data.projects.find(p=>p.slug===rel.projectSlug);if(!project)return;
    const li=node('li'),a=node('a',project.nombre);a.href='/'+project.slug+'.html#entorno-obras';li.append(a,node('small',distanceLabel(rel)));
    if(rel.benefit||rel.cautions?.length||rel.rationale){
      const explanation=node('details',undefined,'uw-relation-details');explanation.append(node('summary','Ver relación con '+project.nombre));
      for(const text of [...new Set([rel.benefit,rel.rationale,...(rel.cautions||[])].filter(Boolean))])explanation.append(node('p',text));
      li.append(explanation);
    }
    list.append(li);
  });section.append(list);return section;
}
function card(work){
  const article=node('article',undefined,'uw-card');article.id='obra-'+work.id;article.dataset.workId=work.id;article.dataset.selected=String(selected===work.id);article.tabIndex=-1;
  const top=node('div',undefined,'uw-card-top'),badge=node('span',statusLabel(work.status),'uw-status');badge.dataset.state=work.status;
  top.append(node('span',work.type,'uw-type'),badge);article.append(top,node('h2',work.name));
  article.append(node('p',[work.region,(work.communes||[]).join(' · ')].filter(Boolean).join(' / '),'uw-location'));
  article.append(node('p',work.description,'uw-description'));
  if(work.statusDetail)article.append(node('p',work.statusDetail,'uw-card-meta'));
  if(work.benefit)article.append(node('p',work.benefit,'uw-benefit'));
  if(work.estimatedEnd)article.append(node('p','Fecha estimada: '+date(work.estimatedEnd),'uw-card-meta'));
  article.append(node('p','Información: '+date(work.informationDate)+' · Revisada: '+date(work.reviewedOn),'uw-card-meta'));
  if(work.informationDateBasis)article.append(node('p',work.informationDateBasis,'uw-card-meta'));
  const primary=work.sources?.find(source=>external(source.url));
  if(primary){const p=node('p',undefined,'uw-card-meta'),a=node('a','Consultar fuente oficial');a.href=external(primary.url);a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Consultar fuente: '+primary.title);p.append(a);article.append(p);}
  article.append(related(work));
  if(work.geometry){
    const actions=node('div',undefined,'uw-card-actions'),button=node('button','Ubicar en el mapa','uw-text-button');button.type='button';button.setAttribute('aria-label','Ubicar '+work.name+' en el mapa');
    button.addEventListener('click',async()=>{select(work.id);await openMap();focusGeometry(work.id);if(innerWidth<=1000)byId('uw-map-panel').scrollIntoView({block:'start',behavior:'instant'});});actions.append(button);article.append(actions);
  }else article.append(node('p','Ubicación precisa pendiente: esta obra no tiene marcador ni distancia.','uw-pending'));
  article.append(details(work));return article;
}
function render(){
  const s=state();visible=works.filter(w=>(!s.region||w.region===s.region)&&(!s.comuna||w.communes?.includes(s.comuna))&&(!s.tipo||w.type===s.tipo)&&(!s.estado||w.status===s.estado)&&(!projectScope||relationshipsFor(data,w.id).some(r=>r.projectSlug===projectScope)));
  if(selected&&!visible.some(w=>w.id===selected))selected='';
  byId('uw-list').replaceChildren(...visible.map(card));byId('uw-empty').hidden=visible.length>0;
  byId('uw-count').textContent=visible.length+(visible.length===1?' obra verificada':' obras verificadas')+' · '+works.length+' en esta revisión';
  const scope=byId('uw-project-scope');scope.replaceChildren();scope.hidden=!projectScope;
  if(projectScope){const p=data.projects.find(p=>p.slug===projectScope);scope.append(node('span','Mostrando obras relacionadas con '+p.nombre));const button=node('button','Ver todas las obras','uw-text-button');button.type='button';button.addEventListener('click',()=>{projectScope='';render();});scope.append(button);}
  writeUrl();updateMap();
}
function select(id,{reveal=false}={}){
  selected=id;document.querySelectorAll('.uw-card').forEach(c=>c.dataset.selected=String(c.dataset.workId===id));writeUrl();
  for(const [workId,geometry]of mapLayers)geometry.setStyle({weight:workId===id?6:4});
  if(reveal){const article=byId('obra-'+id);article?.querySelector(':scope > .uw-details')?.setAttribute('open','');article?.scrollIntoView({block:'nearest',behavior:'instant'});article?.focus({preventScroll:true});}
}
let leafletPromise;
function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);
  if(leafletPromise)return leafletPromise;
  leafletPromise=Promise.all([
    new Promise((resolve,reject)=>{const css=node('link');css.rel='stylesheet';css.href='/assets/vendor/leaflet-1.9.4/leaflet.css';css.onload=resolve;css.onerror=reject;document.head.insertBefore(css,document.querySelector('link[href*="sollahms-theme.css"]'));}),
    new Promise((resolve,reject)=>{const script=node('script');script.src='/assets/vendor/leaflet-1.9.4/leaflet.js';script.onload=resolve;script.onerror=reject;document.head.append(script);})
  ]).then(()=>{if(!window.L)throw Error('map-library');return window.L;});
  return leafletPromise;
}
async function createMap(){
  const [L,response]=await Promise.all([loadLeaflet(),fetch('/data/map-provider.json',{signal:AbortSignal.timeout(12000)})]);
  if(!response.ok)throw Error('map-config');const provider=await response.json();
  if(provider.tileUrl!=='https://tile.openstreetmap.org/{z}/{x}/{y}.png')throw Error('map-provider');
  map=L.map('uw-map',{scrollWheelZoom:false,dragging:false,touchZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:true,inertia:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,minZoom:4,maxZoom:19});
  map.setView([-34.5,-71],5);map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · Fuentes por obra');
  baseTiles=L.tileLayer(provider.tileUrl,{maxZoom:19,keepBuffer:0,updateWhenIdle:true,updateWhenZooming:false,noWrap:true,referrerPolicy:'strict-origin-when-cross-origin'});
  baseTiles.on('tileerror',()=>{if(!baseVisible)return;setBaseMap(false);const error=byId('uw-map-error');error.textContent='El mapa base no pudo cargar y se ha ocultado. Las geometrías verificadas, los controles y el listado siguen disponibles.';error.hidden=false;});
  baseTiles.addTo(map);byId('uw-basemap').disabled=false;
  const zin=byId('uw-map').querySelector('.leaflet-control-zoom-in'),zout=byId('uw-map').querySelector('.leaflet-control-zoom-out');zin?.setAttribute('aria-label','Acercar mapa');zout?.setAttribute('aria-label','Alejar mapa');
  layer=L.featureGroup().addTo(map);updateMap();fit();
}
async function openMap(){
  mapVisible=true;byId('uw-map-panel').hidden=false;byId('uw-results-layout').classList.add('uw-map-open');byId('uw-map-toggle').setAttribute('aria-expanded','true');byId('uw-map-toggle').textContent='Ocultar mapa';
  try{if(!mapPromise)mapPromise=createMap();await mapPromise;requestAnimationFrame(()=>map.invalidateSize());}
  catch{const error=byId('uw-map-error');error.hidden=false;error.textContent='No pudimos cargar el mapa. El listado, los filtros y las fuentes siguen disponibles.';byId('uw-map-status').textContent='Mapa no disponible';}
}
function updateMap(){
  if(!map||!layer)return;const L=window.L;layer.clearLayers();mapLayers.clear();
  const colors=getComputedStyle(document.documentElement),green=colors.getPropertyValue('--s-green').trim(),gold=colors.getPropertyValue('--s-gold-ink').trim(),muted=colors.getPropertyValue('--s-muted').trim();
  const projectIds=new Set();let count=0;
  visible.forEach(work=>{
    if(!work.geometry)return;
    const color=work.status==='operational'?green:work.status==='construction'?gold:muted;
    try{
      const geometry=L.geoJSON(work.geometry,{style:{color,weight:selected===work.id?6:4,fillOpacity:.15,dashArray:work.status==='operational'?null:work.status==='construction'?'10 6':'3 6'},pointToLayer:(_,ll)=>L.circleMarker(ll,{radius:8,color,weight:selected===work.id?6:3,fillOpacity:.7})});
      geometry.eachLayer(part=>{const popup=node('div');popup.append(node('strong',work.name),node('p',statusLabel(work.status)));const button=node('button','Ver detalles','uw-text-button');button.type='button';button.addEventListener('click',()=>select(work.id,{reveal:true}));popup.append(button);part.bindPopup(popup);part.on('click',()=>select(work.id));});
      geometry.addTo(layer);mapLayers.set(work.id,geometry);count++;
      relationshipsFor(data,work.id).forEach(r=>projectIds.add(r.projectSlug));
    }catch{/* Invalid geography never receives a fabricated replacement. */}
  });
  projectIds.forEach(slug=>{
    const p=data.projects.find(x=>x.slug===slug),loc=data.locations.locations?.[slug];
    if(!p||loc?.status!=='verified'||loc.address!==p.direccion||loc.commune!==p.comuna||!Number.isFinite(loc.lat)||!Number.isFinite(loc.lng))return;
    const popup=node('div'),link=node('a',p.nombre);link.href='/'+p.slug+'.html#entorno-obras';popup.append(link);
    L.circleMarker([loc.lat,loc.lng],{radius:5,color:green,weight:2,fillColor:'#fff',fillOpacity:1}).bindPopup(popup).addTo(layer);
  });
  byId('uw-map-status').textContent=count+' de '+visible.length+' obras con ubicación cartográfica verificada.'+(count<visible.length?' Las demás permanecen disponibles en el listado.':'');
}
function fit(){if(layer?.getLayers().length){const bounds=layer.getBounds();if(bounds.isValid())map.fitBounds(bounds,{padding:[24,24],maxZoom:15,animate:false});}}
function focusGeometry(id){const geo=mapLayers.get(id);if(geo){const bounds=geo.getBounds();if(bounds.isValid())map.fitBounds(bounds,{padding:[40,40],maxZoom:16,animate:false});}}
function setBaseMap(show){
  if(!map||!baseTiles)return;baseVisible=show;
  if(show){baseTiles.addTo(map);byId('uw-map-error').hidden=true;}else if(map.hasLayer(baseTiles))map.removeLayer(baseTiles);
  byId('uw-basemap').setAttribute('aria-pressed',String(show));byId('uw-basemap').textContent=show?'Ocultar mapa base':'Mostrar mapa base';byId('uw-basemap-status').hidden=show;
}
byId('uw-map-toggle').addEventListener('click',()=>{
  if(!mapVisible){openMap();return;}mapVisible=false;byId('uw-map-panel').hidden=true;byId('uw-results-layout').classList.remove('uw-map-open');byId('uw-map-toggle').setAttribute('aria-expanded','false');byId('uw-map-toggle').textContent='Ver mapa';
});
byId('uw-fit').addEventListener('click',fit);
byId('uw-basemap').addEventListener('click',()=>setBaseMap(!baseVisible));
byId('uw-pan').addEventListener('click',()=>{if(!map)return;const enabled=!map.dragging.enabled();enabled?map.dragging.enable():map.dragging.disable();byId('uw-pan').setAttribute('aria-pressed',String(enabled));byId('uw-pan').textContent=enabled?'Desactivar movimiento del mapa':'Activar movimiento del mapa';});
byId('uw-filters').addEventListener('submit',event=>event.preventDefault());
for(const [key,control]of Object.entries(controls))control.addEventListener('change',()=>{if(key==='region')updateCommunes();render();});
byId('uw-reset').addEventListener('click',()=>{Object.values(controls).forEach(c=>c.value='');projectScope='';selected='';updateCommunes();render();});
window.addEventListener('popstate',()=>{if(data){restoreUrl();render();}});
try{
  data=await loadUrbanData();works=publicWorks(data);
  options('region',[...works.map(w=>w.region),...data.projects.map(p=>p.region)]);options('tipo',works.map(w=>w.type));options('estado',works.map(w=>w.status));updateCommunes();restoreUrl();render();
  byId('uw-cutoff').textContent='Investigación al '+date(data.cutoff);
  if(data.research)byId('uw-coverage').textContent=data.research.reviewedProjects+' de '+data.research.totalProjects+' proyectos revisados documentalmente. Las asociaciones requieren ubicación suficiente; esta revisión no garantiza identificar todas las inversiones existentes.';
  [...Object.values(controls),byId('uw-reset'),byId('uw-map-toggle')].forEach(c=>c.disabled=false);
  if(selected){byId('obra-'+selected)?.querySelector(':scope > .uw-details')?.setAttribute('open','');}
}catch{byId('uw-count').textContent='No pudimos cargar la información de obras.';byId('uw-empty').textContent='Intenta recargar esta página. El catálogo inmobiliario sigue disponible.';byId('uw-empty').hidden=false;}
finally{byId('uw-list').setAttribute('aria-busy','false');}
