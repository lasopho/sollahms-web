import {defaults,FILTER_STORAGE,sanitizeState,readQuery,writeQuery,safePublicState,rangeIssue} from './catalog-filter-engine.mjs?v=20261029-stage-1';
import {assetTypes,projectStates,VIEW_KEY,SESSION_KEY} from './catalog-model.mjs?v=20261029-stage-1';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const unique=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es-CL',{numeric:true}));
const propertyLabels={departamento:'Departamento',casa:'Casa',terreno:'Terreno o parcela',local:'Local comercial',oficina:'Oficina'};
const areaLabels={util:'Útil',interior:'Interior',total:'Total',departamento:'Departamento (según plano)',terreno:'Terreno',terraza:'Terraza',jardin:'Jardín privado'};
const arrayFields=['purchaseModes','amenities','features','developers','typologies'];
const controlIds={search:'search',region:'region',commune:'commune',minPriceInput:'min-price',maxPriceInput:'max-price',propertyType:'property-type',bedrooms:'bedrooms',delivery:'delivery',bathrooms:'bathrooms',areaType:'area-type',minArea:'min-area',maxArea:'max-area',state:'state',assetType:'asset-type',sortOrder:'sort-order'};
const captions={purchaseModes:'Modalidad',search:'Búsqueda',region:'Región',commune:'Comuna',minPriceInput:'Desde UF',maxPriceInput:'Hasta UF',propertyType:'Propiedad',bedrooms:'Dormitorios',delivery:'Entrega',bathrooms:'Baños',minArea:'Desde m²',maxArea:'Hasta m²',state:'Estado',assetType:'Uso',amenities:'Amenity',features:'Vivienda',developers:'Inmobiliaria',typologies:'Tipología'};
export function facetOptions(projects,index){
  const f=projects.flatMap(p=>p._facets?.stages?Object.values(p._facets.stages):[p._facets??{}]),types=unique(f.flatMap(x=>x.propertyTypes??[])),metrics=unique(f.flatMap(x=>(x.variants??[]).flatMap(v=>Object.keys(v.areas??{}))));
  return {regions:unique(projects.map(p=>p.region)),communes:unique(projects.map(p=>p.comuna)),developers:unique(projects.map(p=>p.inmobiliaria)),states:unique(f.flatMap((x,i)=>x.states??[])),assetTypes:unique(projects.flatMap(assetTypes)),propertyTypes:types.map(id=>({id,label:propertyLabels[id]??id})),areaTypes:metrics.filter(id=>areaLabels[id]).map(id=>({id,label:areaLabels[id]})),deliveries:[...(f.some(x=>x.delivery?.immediate)?[{id:'inmediata',label:'Entrega inmediata'}]:[]),...unique(f.map(x=>x.delivery?.year).filter(Boolean)).map(y=>({id:String(y),label:String(y)}))],filters:index.filters??[],typologies:index.typologies??[]};
}
export function createFilterControls({projects,index,onChange,getView,setView}){
  const form=document.getElementById('catalog-filters'),controls=Object.fromEntries(Object.entries(controlIds).map(([k,id])=>[k,document.getElementById(id)]));
  const options=facetOptions(projects,index),checks={},labels={};let state=defaults(),timer,ready=false;
  const advanced=document.getElementById('catalog-more'),panel=document.getElementById('catalog-options'),status=document.getElementById('filter-range-error');
  const groups={purchaseModes:[{id:'blanco',label:'Compra en blanco'},{id:'verde',label:'Compra en verde'},{id:'inmediata',label:'Entrega inmediata'}].map(x=>({...x,count:projects.filter(p=>p._facets?.purchaseStage?.eligible&&p._facets.purchaseStage.mode===x.id).length})),amenities:options.filters.filter(x=>x.group==='amenities'),features:options.filters.filter(x=>x.group==='features'),developers:options.developers.map(id=>({id,label:id,count:projects.filter(p=>p.inmobiliaria===id).length})),typologies:options.typologies};
  const populate=(key,values,empty)=>{const c=controls[key];c.replaceChildren(...(empty!==null?[new Option(empty,'')]:[]),...values.map(v=>new Option(typeof v==='string'?v:v.label,typeof v==='string'?v:v.id)));};
  populate('region',options.regions,'Todas');populate('commune',options.communes,'Todas');populate('propertyType',options.propertyTypes,'Todas');populate('delivery',options.deliveries,'Cualquier entrega');populate('state',options.states,'Todos');populate('assetType',options.assetTypes,'Todos');populate('areaType',options.areaTypes,null);
  const variants=projects.flatMap(p=>p._facets?.stages?Object.values(p._facets.stages).flatMap(s=>s.variants??[]):p._facets?.variants??[]);
  populate('bedrooms',[{id:'0',label:'Estudio'},{id:'1',label:'1 dormitorio'},{id:'2',label:'2 dormitorios'},{id:'3',label:'3 dormitorios'},{id:'4+',label:'4 o más'}].filter(o=>variants.some(v=>Number.isInteger(v.bedrooms)&&(o.id==='4+'?v.bedrooms>=4:v.bedrooms===Number(o.id)))),'Cualquiera');
  populate('bathrooms',[{id:'1',label:'1 baño'},{id:'2',label:'2 baños'},{id:'3+',label:'3 o más'}].filter(o=>variants.some(v=>Number.isInteger(v.bathrooms)&&(o.id==='3+'?v.bathrooms>=3:v.bathrooms===Number(o.id)))),'Cualquiera');
  for(const [key,rows] of Object.entries(groups)){
    const host=document.getElementById('filter-'+key);checks[key]=[];labels[key]=new Map(rows.map(x=>[x.id,x.label]));
    for(const row of rows){const label=el('label',undefined,'cf-choice'),input=el('input');input.type='checkbox';input.value=row.id;input.name=key;
      label.append(input,el('span',row.label),el('span',String(row.count??''),'cf-option-count'));host.append(label);checks[key].push(input);
    }
    if(!rows.length)host.closest('fieldset').hidden=true;
  }
  for(const key of ['propertyType','delivery','areaType'])labels[key]=new Map(options[key==='propertyType'?'propertyTypes':key==='delivery'?'deliveries':'areaTypes'].map(x=>[x.id,x.label]));
  labels.bedrooms=new Map([['0','Estudio'],['1','1 dormitorio'],['2','2 dormitorios'],['3','3 dormitorios'],['4+','4 o más dormitorios']]);labels.bathrooms=new Map([['1','1 baño'],['2','2 baños'],['3+','3 o más baños']]);
  function communes(){const allowed=unique(projects.filter(p=>!state.region||p.region===state.region).map(p=>p.comuna));populate('commune',allowed,'Todas');if(state.commune&&!allowed.includes(state.commune))state.commune='';controls.commune.value=state.commune;}
  function writeControls(){for(const [key,c] of Object.entries(controls))c.value=state[key];communes();for(const key of arrayFields)for(const c of checks[key])c.checked=state[key].includes(c.value);document.getElementById('amenities-all').checked=state.amenitiesAll;document.getElementById('features-all').checked=state.featuresAll;}
  function readControls(){for(const [key,c] of Object.entries(controls))state[key]=c.type==='number'&&c.validity.badInput?'invalid':c.value;for(const key of arrayFields)state[key]=checks[key].filter(c=>c.checked).map(c=>c.value);state.amenitiesAll=document.getElementById('amenities-all').checked;state.featuresAll=document.getElementById('features-all').checked;}
  function remember(){const safe=safePublicState(state,projects),query=writeQuery(safe,getView());try{const next=history.state&&typeof history.state==='object'?{...history.state}:{};next[FILTER_STORAGE]=safe;next[VIEW_KEY]=getView();history.replaceState(next,'',location.pathname+(query?'?'+query:'')+location.hash);sessionStorage.setItem(FILTER_STORAGE,JSON.stringify(safe));}catch{}}
  function chips(){const host=document.getElementById('applied-filters');host.replaceChildren();let n=0;
    for(const [key,caption] of Object.entries(captions)){const selected=arrayFields.includes(key)?state[key]:state[key]?[state[key]]:[];for(const value of selected){let label=labels[key]?.get(value)??value;if(key==='minArea'||key==='maxArea')label+=' ('+(labels.areaType.get(state.areaType)??state.areaType)+')';const button=el('button',caption+': '+label+' ×','catalog-filter-tag');button.type='button';button.setAttribute('aria-label','Quitar filtro '+caption+': '+label);button.addEventListener('click',()=>{if(arrayFields.includes(key))state[key]=state[key].filter(x=>x!==value);else state[key]='';writeControls();update();document.getElementById('project-count').focus({preventScroll:true});});host.append(button);n++;}}
    host.hidden=!n;document.getElementById('catalog-filter-count').textContent=n?' ('+n+')':'';
    document.getElementById('purchase-stage-filter-note').hidden=!state.purchaseModes.length;
    const advancedCount=state.purchaseModes.length+state.amenities.length+state.features.length+state.developers.length+state.typologies.length+['bathrooms','minArea','maxArea','state','assetType'].filter(k=>state[k]).length;
    document.getElementById('catalog-more-count').textContent=advancedCount?' ('+advancedCount+')':'';
  }
  function update(){clearTimeout(timer);readControls();const issue=rangeIssue(state);status.textContent=issue;status.hidden=!issue;chips();remember();if(ready)onChange();}
  function restore(){
    const query=readQuery(location.search,options);let saved=query.present?query.state:null;
    if(!saved)try{saved=history.state?.[FILTER_STORAGE]??JSON.parse(sessionStorage.getItem(FILTER_STORAGE));}catch{}
    // Migrate the prior public catalogue preferences without retaining financial inputs.
    if(!saved)try{const old=JSON.parse(sessionStorage.getItem(SESSION_KEY));if(old?.version===1)saved=old;}catch{}
    state=sanitizeState(saved??defaults(),options);writeControls();
    let view=query.view;try{view??=history.state?.[VIEW_KEY]??localStorage.getItem(VIEW_KEY);}catch{}if(['cards','list','map'].includes(view))setView(view);
    if(state.purchaseModes.length||state.amenities.length||state.features.length||state.developers.length||state.bathrooms||state.minArea||state.maxArea||state.typologies.length)advanced.open=true;
  }
  function clear(){state=defaults();writeControls();advanced.open=false;update();controls.search.focus({preventScroll:true});}
  form.addEventListener('submit',e=>{e.preventDefault();update();showResults();});
  form.addEventListener('input',event=>{if(event.target===controls.search){clearTimeout(timer);timer=setTimeout(update,140);}else if(event.target.type==='number')update();});
  form.addEventListener('change',event=>{readControls();if(event.target===controls.region)communes();update();});
  controls.sortOrder.addEventListener('change',update);
  document.getElementById('clear-filters').addEventListener('click',clear);document.getElementById('empty-reset').addEventListener('click',clear);
  function showResults(){update();if(rangeIssue(state)){status.focus();return;}if(matchMedia('(max-width:767px)').matches){advanced.open=false;panel.open=false;}document.getElementById('project-count').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});document.getElementById('project-count').focus({preventScroll:true});}
  document.querySelectorAll('[data-show-results]').forEach(b=>b.addEventListener('click',showResults));
  document.getElementById('modify-search').addEventListener('click',()=>{panel.open=true;controls.search.focus();form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});});
  window.addEventListener('popstate',()=>{restore();chips();onChange();});
  matchMedia('(max-width:767px)').addEventListener('change',event=>{if(!event.matches)panel.open=true;});
  restore();ready=true;form.querySelectorAll('input,select,button').forEach(c=>c.disabled=false);controls.sortOrder.disabled=false;chips();remember();
  return {values:()=>structuredClone(state),remember,clear,options,updateCount(count){document.querySelectorAll('[data-show-results]').forEach(b=>b.textContent='Ver '+count+' proyecto'+(count===1?'':'s'));},issue:()=>rangeIssue(state)};
}
