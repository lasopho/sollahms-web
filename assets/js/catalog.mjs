import {normalize,validPrice,stages,projectStates,selectedOffer,projectFacts,filterAndSort,validFilterState,safeReturnFilters,validView,VIEW_KEY,FILTER_KEY,SESSION_KEY} from './catalog-model.mjs';

const $=id=>document.getElementById(id);
const controls={search:$('search'),assetType:$('asset-type'),region:$('region'),commune:$('commune'),state:$('state'),maxPriceInput:$('max-price'),sortOrder:$('sort-order')};
const grid=$('project-grid'),form=$('catalog-filters'),count=$('project-count'),message=$('catalog-message');
const viewButtons=[...document.querySelectorAll('[data-catalog-view]')];
let projects=[],capacitySearch=null,view='cards',mapInstance=null,mapPromise=null,mapResults=[];
const mapHost=$('catalog-map');
const element=(tag,text,classes)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(classes)e.className=classes;return e;};
const formatPrice=value=>new Intl.NumberFormat('es-CL',{minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value);
const values=()=>Object.fromEntries(Object.entries(controls).map(([key,control])=>[key,control.value]));
function appendOptions(select,values){
  const seen=new Set();
  values.filter(v=>typeof v==='string'&&v.length).sort((a,b)=>a.localeCompare(b,'es-CL')).forEach(value=>{
    if(seen.has(normalize(value)))return;seen.add(normalize(value));select.append(new Option(value,value));
  });
}
function updateCommunes(){
  const selected=controls.commune.value;controls.commune.replaceChildren(new Option('Todas las comunas',''));
  appendOptions(controls.commune,projects.filter(p=>!controls.region.value||p.region===controls.region.value).map(p=>p.comuna));
  if([...controls.commune.options].some(o=>o.value===selected))controls.commune.value=selected;
}
function restore(){
  let saved,preferred;
  try{saved=history.state?.[FILTER_KEY];preferred=history.state?.[VIEW_KEY];}catch{}
  if(!validFilterState(saved))try{saved=JSON.parse(sessionStorage.getItem(SESSION_KEY));}catch{}
  if(validFilterState(saved)){
    const set=(key,fallback='')=>{const c=controls[key];c.value=[...c.options].some(o=>o.value===saved[key])?saved[key]:fallback;};
    controls.search.value=saved.search;set('assetType');set('region');updateCommunes();set('commune');set('state');controls.maxPriceInput.value=saved.maxPriceInput;set('sortOrder','original');
    $('catalog-more').open=!!(controls.assetType.value||controls.state.value);
  }
  if(!validView(preferred))try{preferred=localStorage.getItem(VIEW_KEY);}catch{}
  view=validView(preferred)?preferred:'cards';applyView();
}
function remember(){
  const state={version:1,...values()};
  try{const previous=history.state;const next=previous&&typeof previous==='object'&&!Array.isArray(previous)?{...previous}:{};
    if(validFilterState(state))next[FILTER_KEY]=state;else delete next[FILTER_KEY];next[VIEW_KEY]=view;history.replaceState(next,'');}catch{}
  try{const safe=safeReturnFilters(state,projects);if(safe)sessionStorage.setItem(SESSION_KEY,JSON.stringify(safe));else sessionStorage.removeItem(SESSION_KEY);}catch{}
}
function ensureMap(){
  if(mapInstance){mapInstance.show();mapInstance.update(mapResults,{assetType:controls.assetType.value});return;}
  if(mapPromise)return;
  mapHost.setAttribute('aria-busy','true');mapHost.replaceChildren(element('p','Cargando mapa…','catalog-map-status'));
  mapPromise=import('./catalog-map.mjs').then(({createCatalogMap})=>createCatalogMap({host:mapHost})).then(instance=>{
    mapInstance=instance;if(view==='map'){instance.show();instance.update(mapResults,{assetType:controls.assetType.value});}else instance.hide();
  }).catch(error=>{
    mapHost.setAttribute('aria-busy','false');const note=element('p','El mapa no pudo cargar. Puedes seguir explorando todos los resultados en Tarjetas o Listado.');note.setAttribute('role','status');
    const fallback=element('button','Continuar en Listado','catalog-text-button');fallback.type='button';fallback.addEventListener('click',()=>viewButtons.find(b=>b.dataset.catalogView==='list').click());mapHost.replaceChildren(note,fallback);
  });
}
function applyView(){
  grid.dataset.view=view;grid.hidden=view==='map';mapHost.hidden=view!=='map';
  viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.catalogView===view)));
  if(view==='map'){grid.replaceChildren();ensureMap();}else mapInstance?.hide();
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
  const cover=element('div',undefined,'catalog-cover');
  const placeholder=()=>{const box=element('div',undefined,'catalog-cover-placeholder');const brand=element('img');brand.src='/assets/branding/sollahms-logo-light.svg';brand.alt='Sollahms';brand.width=114;brand.height=22;box.append(brand,element('span','Imagen no disponible'));cover.replaceChildren(box);};
  if(typeof project.imagenPrincipal==='string'&&/^\/assets\/propiedades\/[a-z0-9/._-]+\.(?:webp|jpe?g|png)$/i.test(project.imagenPrincipal)){
    const img=element('img',undefined,'catalog-cover-image');img.src=project.imagenPrincipal;img.alt=project.imagenAlt||'Imagen del proyecto '+project.nombre;img.width=1600;img.height=900;img.loading='lazy';img.decoding='async';img.addEventListener('error',placeholder,{once:true});cover.append(img);
  }else placeholder();
  const summary=element('div',undefined,'catalog-summary');
  const identity=element('div',undefined,'catalog-identity');const title=element('h2',project.nombre,'catalog-card-title');title.id='catalog-'+project.slug;article.setAttribute('aria-labelledby',title.id);
  identity.append(title,element('p',[project.comuna,project.region].filter(Boolean).join(' · '),'catalog-location'));
  if(project.inmobiliaria)identity.append(element('p',project.inmobiliaria,'catalog-builder'));
  summary.append(identity);
  const facts=projectFacts(project,controls.assetType.value);
  if(facts.length){const dl=element('dl',undefined,'catalog-facts');for(const fact of facts){const row=element('div');row.append(element('dt',fact.label),element('dd',fact.value));dl.append(row);}summary.append(dl);}
  group.append(cover,summary);article.append(group);
  // Action area is deliberately outside the opacity group; finance controls stay static too.
  const body=element('div',undefined,'catalog-card-body');body.dataset.scrollStatic='';
  const actions=element('div',undefined,'catalog-actions'),price=element('div',undefined,'catalog-price');const offer=selectedOffer(project,controls.assetType.value);
  if(validPrice(offer.value)){
    price.append(element('p','Desde UF '+formatPrice(offer.value),'catalog-price-value'));
    if(offer.typology)price.append(element('p',offer.typology==='Local'?'Local comercial':offer.typology,'catalog-price-type'));
  }else price.append(element('p','Consultar precio','catalog-price-unavailable'));
  actions.append(price);
  if(typeof project.detalleUrl==='string'&&/^\/[a-z0-9-]+\.html$/.test(project.detalleUrl)){
    const link=element('a','Ver detalles','catalog-details-link');link.href=project.detalleUrl;link.setAttribute('aria-label','Ver detalles de '+project.nombre);actions.append(link);
  }
  body.append(actions);article.append(body);
  if(!(project.preciosPorTipologia&&controls.assetType.value==='Comercial'))capacitySearch?.decorateCard(article,project);
  const financial=body.querySelector('.capacity-result');
  if(financial){
    // Review dates remain in the source data; the financial scenario keeps all amounts/conditions.
    financial.querySelectorAll('dt').forEach(dt=>{if(dt.textContent==='Revisión del precio')dt.parentElement.remove();});
    const details=element('details',undefined,'catalog-finance');details.dataset.scrollStatic='';
    details.append(element('summary','Ver escenario financiero'),financial);article.append(details);
  }
  return article;
}
function appliedFilters(){
  const container=$('applied-filters');container.replaceChildren();
  const labels={search:'Búsqueda',assetType:'Tipo',region:'Región',commune:'Comuna',state:'Estado',maxPriceInput:'Máximo UF'};
  for(const [key,label] of Object.entries(labels))if(controls[key].value){
    const button=element('button',label+': '+controls[key].value+' ×','catalog-filter-tag');button.type='button';button.setAttribute('aria-label','Quitar filtro '+label+': '+controls[key].value);
    button.addEventListener('click',()=>{controls[key].value='';if(key==='region')updateCommunes();render();controls[key].focus({preventScroll:true});});container.append(button);
  }
  container.hidden=!container.children.length;
  const active=Number(!!controls.assetType.value)+Number(!!controls.state.value);$('catalog-more-count').textContent=active?' ('+active+')':'';
}
function render(){
  const sorted=filterAndSort(projects,values());
  if(controls.sortOrder.value==='original')capacitySearch?.sortProjects(sorted);
  mapResults=sorted;
  if(view==='map'){grid.replaceChildren();if(mapInstance)mapInstance.update(sorted,{assetType:controls.assetType.value});else ensureMap();}
  else grid.replaceChildren(...sorted.map(card));
  count.textContent=sorted.length===projects.length?projects.length+' proyectos':sorted.length+' de '+projects.length+' proyectos';
  message.textContent=sorted.length?'':'No encontramos propiedades con esos filtros. Prueba otra ubicación o amplía el precio máximo.';
  $('catalog-feedback').hidden=!!sorted.length;$('empty-reset').hidden=!!sorted.length;
  appliedFilters();remember();
}
function clearFilters(){form.reset();updateCommunes();$('catalog-more').open=false;render();controls.search.focus({preventScroll:true});}
form.addEventListener('submit',e=>e.preventDefault());
controls.search.addEventListener('input',render);controls.maxPriceInput.addEventListener('input',render);
controls.region.addEventListener('change',()=>{updateCommunes();render();});
for(const key of ['assetType','commune','state','sortOrder'])controls[key].addEventListener('change',render);
$('clear-filters').addEventListener('click',clearFilters);$('empty-reset').addEventListener('click',clearFilters);
async function load(){
  try{
    const response=await fetch('/data/proyectos.json',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('catalogue unavailable');
    const data=await response.json();if(!Array.isArray(data)||new Set(data.map(p=>p.slug)).size!==data.length)throw Error('catalogue identity');
    data.forEach(project=>{if(!project||typeof project.slug!=='string'||typeof project.nombre!=='string'||!/^\/[a-z0-9-]+\.html$/.test(project.detalleUrl))throw Error('catalogue identity');});
    projects=data;appendOptions(controls.region,projects.map(p=>p.region));appendOptions(controls.state,projects.flatMap(projectStates));updateCommunes();restore();render();
    $('catalog-static-directory').hidden=true;
    [...Object.values(controls),$('clear-filters'),...viewButtons].forEach(c=>c.disabled=false);
    import('/assets/js/purchase-capacity-ui.mjs').then(({initializeCapacitySearch})=>{capacitySearch=initializeCapacitySearch({projects,onChange:render});$('capacity-toggle').disabled=false;}).catch(()=>{$('capacity-summary').textContent='El buscador financiero no pudo cargar. Puedes seguir utilizando los filtros del catálogo.';});
  }catch(error){
    grid.replaceChildren();count.textContent='';$('catalog-feedback').hidden=false;$('empty-reset').hidden=true;
    message.textContent=['TimeoutError','AbortError'].includes(error.name)?'La carga tardó demasiado. Puedes explorar las fichas en el directorio siguiente.':'No pudimos cargar el catálogo. Puedes explorar las fichas en el directorio siguiente.';
  }finally{grid.setAttribute('aria-busy','false');}
}
load();
