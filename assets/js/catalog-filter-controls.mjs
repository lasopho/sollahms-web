import {defaults,FILTER_STORAGE,sanitizeState,readQuery,writeQuery,safePublicState,rangeIssue} from './catalog-filter-engine.mjs?v=20261029-stage-1';
import {assetTypes,VIEW_KEY,SESSION_KEY} from './catalog-model.mjs?v=20261029-stage-1';
import {AMENITY_KEY_MAP,AMENITY_LABELS} from './commercial-filter-data.mjs?v=20261117-local-1';
import {hasCatalogExpansionMarker} from './catalog-expansion.mjs';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const unique=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es-CL',{numeric:true}));
const propertyLabels={departamento:'Departamento',casa:'Casa',terreno:'Terreno o parcela',local:'Local comercial',oficina:'Oficina',duplex:'Dúplex',estudio:'Estudio'};
const propertyId=value=>({Departamento:'departamento',Casa:'casa',Terreno:'terreno','Local Comercial':'local','Local comercial':'local',Oficina:'oficina','Dúplex':'duplex',Estudio:'estudio'}[value]??value);
const decorativeFilters=new Set(['piso-spc','piso-porcelanato','cortinas-roller','iluminacion-led','cubierta-granito']);
const scopedSpaceFilters=new Set(['estacionamientos','bodegas']);
const mergeOptions=rows=>[...rows.reduce((map,row)=>map.set(row.id,{...map.get(row.id),...row}),new Map()).values()];
const commercialRows=(projects,records=[])=>[...new Map([...projects.map(p=>p._commercial),...records].filter(Boolean).map(row=>[row.slug??row.projectSlug,row])).values()];
const arrayFields=['metroLines','purchaseModes','amenities','features','developers','typologies'];
const controlIds={metroNetwork:'metro-network',metroStation:'metro-station',metroDistance:'metro-distance',metroMinutes:'metro-minutes',metroMethod:'metro-method',metroFutureState:'metro-future-state',search:'search',region:'region',commune:'commune',minPriceInput:'min-price',maxPriceInput:'max-price',propertyType:'property-type',bedrooms:'bedrooms',delivery:'delivery',bathrooms:'bathrooms',areaType:'area-type',minArea:'min-area',maxArea:'max-area',state:'state',assetType:'asset-type',sortOrder:'sort-order',parking:'parking',storage:'storage',evidenceMode:'evidence-mode'};
const captions={metroNetwork:'Red Metro',metroLines:'Línea Metro',metroStation:'Estación Metro',metroDistance:'Radio geográfico (m)',metroMinutes:'Caminata (min)',metroFutureState:'Estado futuro',purchaseModes:'Modalidad',search:'Búsqueda',region:'Región',commune:'Comuna',minPriceInput:'Desde UF',maxPriceInput:'Hasta UF',propertyType:'Propiedad',bedrooms:'Dormitorios',delivery:'Entrega',bathrooms:'Baños',minArea:'Desde m²',maxArea:'Hasta m²',state:'Estado',assetType:'Uso',amenities:'Amenity',features:'Vivienda',developers:'Inmobiliaria',typologies:'Tipología',parking:'Estacionamiento',storage:'Bodega',evidenceMode:'Datos'};
export function facetOptions(projects,index,commercialRecords=[]){
  const facets=projects.flatMap(p=>p._facets?.stages?Object.values(p._facets.stages):[p._facets??{}]);
  const prepared=commercialRows(projects,commercialRecords),facts=prepared.map(row=>row.projectFacts??{});
  const variants=[...prepared,...(index.documentaryReviewEnabled?projects.map(p=>p._documentaryRecord).filter(Boolean):[])].flatMap(row=>(row.references??[]).map(ref=>ref.attributes??{}));
  const types=unique([...facets.flatMap(f=>f.propertyTypes??[]),...facts.flatMap(f=>f.propertyTypes??[]),...variants.map(v=>v.propertyType)].map(propertyId));
  const years=unique([...facets.map(f=>f.delivery?.year),...facts.map(f=>f.delivery?.year)].filter(Boolean));
  const preparedFilters=Object.entries(AMENITY_KEY_MAP).filter(([,key])=>facts.some(f=>f.amenities?.[key]===true)).map(([id,key])=>({id,label:AMENITY_LABELS[key]??id,group:'amenities'}));
  const filters=mergeOptions([...(index.filters??[]),...preparedFilters]).filter(row=>!decorativeFilters.has(row.id)&&!scopedSpaceFilters.has(row.id))
    .map(row=>index.expansionCount?{...row,count:(row.count??0)+projects.filter(p=>hasCatalogExpansionMarker(p)&&p._facets?.features?.some(f=>f.id===row.id)).length}:row);
  const immediate=facets.some(f=>f.delivery?.immediate)||facts.some(f=>f.delivery?.category==='immediate');
  return {
    regions:unique(projects.map(p=>p.region)),communes:unique(projects.map(p=>p.comuna)),developers:unique(projects.map(p=>p.inmobiliaria)),
    states:unique([...facets.flatMap(f=>f.states??[]),...facts.flatMap(f=>f.states??[f.state])]),
    assetTypes:unique([...projects.flatMap(assetTypes),...facts.flatMap(f=>f.assetTypes??[]),...variants.map(v=>v.assetType)]),
    propertyTypes:types.map(id=>({id,label:propertyLabels[id]??id})),
    areaTypes:[{id:'util',label:'Útil'},{id:'total',label:'Total'}],
    deliveries:[...(immediate?[{id:'inmediata',label:'Entrega inmediata'}]:[]),...years.map(year=>({id:String(year),label:String(year)}))],
    metroLines:(index.metro?.lines??[]).map(l=>l.id),metroStations:(index.metro?.stations??[]).map(s=>s.id),walkingAvailable:!!index.metro?.walkingAvailable,
    filters,typologies:index.typologies??[],documentaryReviewEnabled:index.documentaryReviewEnabled===true
  };
}
export function createFilterControls({projects,index,commercialRecords=[],onChange,getView,setView}){
  const form=document.getElementById('catalog-filters'),controls=Object.fromEntries(Object.entries(controlIds).map(([key,id])=>[key,document.getElementById(id)]));
  const options=facetOptions(projects,index,commercialRecords),checks={},labels={};let state=defaults(),timer,ready=false;
  const preparedUnavailable=index.preparedUnavailable===true||!commercialRows(projects,commercialRecords).length;
  controls.evidenceMode.querySelector('[value="prepared"]').disabled=preparedUnavailable;
  const documentaryEnabled=index.documentaryReviewEnabled===true;
  controls.evidenceMode.querySelector('[value="documentary"]')?.remove();
  if(documentaryEnabled)controls.evidenceMode.append(new Option('Revisión documental local · sin stock','documentary'));
  const advanced=document.getElementById('catalog-more'),panel=document.getElementById('catalog-options'),status=document.getElementById('filter-range-error');
  const evidenceHelp=document.getElementById('evidence-mode-help'),publishedHelp=evidenceHelp.textContent+(index.expansionCount?' Los 21 proyectos nuevos identifican sus referencias Iris con fuente y fecha. Los precios externos no sustituyen precios Sollahms ni acreditan stock.':'');
  if(index.expansionCount)controls.evidenceMode.querySelector('[value="published"]').textContent='Catálogo y referencias Iris';
  const groups={metroLines:(index.metro?.lines??[]).map(l=>({id:l.id,label:l.name})),purchaseModes:[{id:'blanco',label:'Compra en blanco'},{id:'verde',label:'Compra en verde'},{id:'inmediata',label:'Entrega inmediata'}].map(x=>({...x,count:projects.filter(p=>p._facets?.purchaseStage?.eligible&&p._facets.purchaseStage.mode===x.id).length})),amenities:options.filters.filter(x=>x.group==='amenities'),features:options.filters.filter(x=>x.group==='features'),developers:options.developers.map(id=>({id,label:id,count:projects.filter(p=>p.inmobiliaria===id).length})),typologies:options.typologies};
  const populate=(key,values,empty)=>{const c=controls[key];c.replaceChildren(...(empty!==null?[new Option(empty,'')]:[]),...values.map(v=>new Option(typeof v==='string'?v:v.label,typeof v==='string'?v:v.id)));};
  populate('metroStation',(index.metro?.stations??[]).map(s=>({id:s.id,label:s.name+' · '+s.lines.join('/')})).sort((a,b)=>a.label.localeCompare(b.label,'es')),'Cualquier estación');
  labels.metroStation=new Map((index.metro?.stations??[]).map(s=>[s.id,s.name]));labels.metroNetwork=new Map([['current','Actual'],['future','Futura']]);
  populate('region',options.regions,'Todas');populate('commune',options.communes,'Todas');populate('propertyType',options.propertyTypes,'Todas');populate('delivery',options.deliveries,'Cualquier entrega');populate('state',options.states,'Todos');populate('assetType',options.assetTypes,'Todos');populate('areaType',options.areaTypes,'Elige útil o total');
  const variants=[...projects.flatMap(p=>p._facets?.stages?Object.values(p._facets.stages).flatMap(s=>s.variants??[]):p._facets?.variants??[]),...[...commercialRows(projects,commercialRecords),...(documentaryEnabled?projects.map(p=>p._documentaryRecord).filter(Boolean):[])].flatMap(row=>(row.references??[]).map(ref=>ref.attributes??{}))];
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
  labels.evidenceMode=new Map([['published',index.expansionCount?'Catálogo y referencias Iris':'Datos publicados'],['prepared','Referencias Leben · 16 nov 2026'],['documentary','Revisión documental local · sin stock']]);
  labels.parking=new Map([['additional','Costo adicional documentado'],['included','Incluido en la referencia'],['available','Disponibilidad confirmada']]);
  labels.storage=new Map([['additional','Costo adicional documentado'],['included','Incluida en la referencia'],['available','Disponibilidad confirmada']]);
  labels.bedrooms=new Map([['0','Estudio'],['1','1 dormitorio'],['2','2 dormitorios'],['3','3 dormitorios'],['4+','4 o más dormitorios']]);labels.bathrooms=new Map([['1','1 baño'],['2','2 baños'],['3+','3 o más baños']]);
  function communes(){const allowed=unique(projects.filter(p=>!state.region||p.region===state.region).map(p=>p.comuna));populate('commune',allowed,'Todas');if(state.commune&&!allowed.includes(state.commune))state.commune='';controls.commune.value=state.commune;}
  function writeControls(){for(const [key,c] of Object.entries(controls))c.value=state[key];communes();for(const key of arrayFields)for(const c of checks[key])c.checked=state[key].includes(c.value);document.getElementById('amenities-all').checked=state.amenitiesAll;document.getElementById('features-all').checked=state.featuresAll;}
  function readControls(){for(const [key,c] of Object.entries(controls))state[key]=c.type==='number'&&c.validity.badInput?'invalid':c.value;if(preparedUnavailable&&state.evidenceMode==='prepared'||!documentaryEnabled&&state.evidenceMode==='documentary')state.evidenceMode=controls.evidenceMode.value='published';for(const key of arrayFields)state[key]=checks[key].filter(c=>c.checked).map(c=>c.value);state.amenitiesAll=document.getElementById('amenities-all').checked;state.featuresAll=document.getElementById('features-all').checked;}
  function remember(){const safe=safePublicState(state,projects),params=new URLSearchParams(writeQuery(safe,getView()));if(documentaryEnabled)params.set('revision_documental','1');const query=params.toString();try{const next=history.state&&typeof history.state==='object'?{...history.state}:{};next[FILTER_STORAGE]=safe;next[VIEW_KEY]=getView();history.replaceState(next,'',location.pathname+(query?'?'+query:'')+location.hash);sessionStorage.setItem(FILTER_STORAGE,JSON.stringify(safe));localStorage.setItem(VIEW_KEY,getView());}catch{}}
  function chips(){document.getElementById('metro-filter-section').hidden=!index.metro||(!!state.region&&!/Metropolitana/i.test(state.region)&&!state.metroNetwork&&!state.metroStation&&!state.metroLines.length);const host=document.getElementById('applied-filters');host.replaceChildren();let n=0;
    for(const [key,caption] of Object.entries(captions)){const metroActive=!!(state.metroNetwork||state.metroLines.length||state.metroStation);const selected=key==='metroDistance'&&!metroActive||key==='evidenceMode'&&state.evidenceMode==='published'?[]:arrayFields.includes(key)?state[key]:state[key]?[state[key]]:[];for(const value of selected){let label=labels[key]?.get(value)??value;if(key==='minArea'||key==='maxArea')label+=' ('+(labels.areaType.get(state.areaType)??'elige métrica')+')';const button=el('button',caption+': '+label+' ×','catalog-filter-tag');button.type='button';button.setAttribute('aria-label','Quitar filtro '+caption+': '+label);button.addEventListener('click',()=>{if(arrayFields.includes(key))state[key]=state[key].filter(x=>x!==value);else state[key]=key==='metroDistance'?'1000':key==='evidenceMode'?'published':'';writeControls();update();document.getElementById('project-count').focus({preventScroll:true});});host.append(button);n++;}}
    host.hidden=!n;document.getElementById('catalog-filter-count').textContent=n?' ('+n+')':'';
    document.getElementById('purchase-stage-filter-note').hidden=!state.purchaseModes.length;
    const advancedCount=state.metroLines.length+(state.metroNetwork?1:0)+(state.metroStation?1:0)+state.purchaseModes.length+state.amenities.length+state.features.length+state.developers.length+state.typologies.length+['delivery','minArea','maxArea','state','assetType','parking','storage'].filter(k=>state[k]).length+(state.evidenceMode!=='published'?1:0);
    const priceLegend=form.querySelector('.cf-price > legend');if(priceLegend)priceLegend.textContent=state.evidenceMode!=='published'||index.expansionCount?'Precio de referencia · UF':'Precio desde · UF';
    evidenceHelp.textContent=state.evidenceMode==='documentary'?'Revisión documental local: '+index.documentaryReferenceCount+' referencias conservadas con su fuente y alcance. Sólo se combinan atributos de una misma referencia. Los proyectos sin evidencia conservan únicamente su identidad; no se toman precios ni características del catálogo publicado. Las referencias no acreditan stock ni vigencia comercial.':state.evidenceMode==='prepared'?'Leben usa referencias revisadas al 16/11/2026; los otros proyectos conservan sus datos publicados. La fecha y el alcance se indican en los resultados de Leben. Las referencias no acreditan stock disponible.':publishedHelp;
    for(const count of form.querySelectorAll('.cf-option-count'))count.hidden=state.evidenceMode!=='published';
    document.getElementById('catalog-more-count').textContent=advancedCount?' ('+advancedCount+')':'';
  }
  function update(){clearTimeout(timer);readControls();const metroHost=document.getElementById('metro-filter-section');metroHost.hidden=!!state.region&&!/Metropolitana/i.test(state.region)&&!state.metroNetwork&&!state.metroStation&&!state.metroLines.length;const issue=rangeIssue(state);status.textContent=issue;status.hidden=!issue;chips();remember();if(ready)onChange();}
  function restore(){
    const query=readQuery(location.search,options);let saved=query.present?query.state:null;
    if(!saved)try{saved=history.state?.[FILTER_STORAGE]??JSON.parse(sessionStorage.getItem(FILTER_STORAGE));}catch{}
    // Migrate the prior public catalogue preferences without retaining financial inputs.
    if(!saved)try{const old=JSON.parse(sessionStorage.getItem(SESSION_KEY));if(old?.version===1)saved=old;}catch{}
    state=sanitizeState(saved??defaults(),options);
    // Restore only metrics that the current controls can display. Keep bounds
    // intact so an unsupported legacy metric asks for an explicit selection.
    if(!options.areaTypes.some(option=>option.id===state.areaType))state.areaType='';
    if(index.documentaryUnavailable||preparedUnavailable&&state.evidenceMode==='prepared')state.evidenceMode='published';writeControls();
    const issue=rangeIssue(state);status.textContent=issue;status.hidden=!issue;
    let view=query.view;try{view??=history.state?.[VIEW_KEY]??localStorage.getItem(VIEW_KEY);}catch{}if(['cards','list','map','split'].includes(view))setView(view);
    if(state.metroNetwork||state.metroLines.length||state.metroStation||state.purchaseModes.length||state.amenities.length||state.features.length||state.developers.length||state.delivery||state.minArea||state.maxArea||state.typologies.length||state.parking||state.storage||state.evidenceMode!=='published')advanced.open=true;
  }
  function clear(){state=defaults();writeControls();advanced.open=false;update();controls.search.focus({preventScroll:true});}
  form.addEventListener('submit',e=>{e.preventDefault();update();showResults();});
  form.addEventListener('input',event=>{if(event.target===controls.search){clearTimeout(timer);timer=setTimeout(update,140);}else if(event.target.type==='number')update();});
  form.addEventListener('change',event=>{if(event.target===controls.metroDistance)controls.metroNetwork.value='current';readControls();if(event.target===controls.region)communes();update();});
  controls.sortOrder.addEventListener('change',update);
  document.getElementById('clear-filters').addEventListener('click',clear);document.getElementById('empty-reset').addEventListener('click',clear);
  function showResults(){update();if(rangeIssue(state)){status.focus();return;}if(matchMedia('(max-width:767px)').matches){advanced.open=false;panel.open=false;}document.getElementById('project-count').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});document.getElementById('project-count').focus({preventScroll:true});}
  document.querySelectorAll('[data-show-results]').forEach(b=>b.addEventListener('click',showResults));
  document.getElementById('modify-search').addEventListener('click',()=>{panel.open=true;controls.search.focus();form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});});
  window.addEventListener('popstate',()=>{restore();chips();onChange();});
  matchMedia('(max-width:767px)').addEventListener('change',event=>{if(!event.matches)panel.open=true;});
  window.addEventListener('catalog-metro-station',e=>{if(!options.metroStations.includes(e.detail?.id))return;state.metroStation=e.detail.id;state.metroNetwork='current';state.metroMethod='geographic';state.metroMinutes='';writeControls();update();});
  restore();ready=true;form.querySelectorAll('input,select,button').forEach(c=>c.disabled=false);controls.sortOrder.disabled=false;for(const c of form.querySelectorAll('[data-metro-unavailable]'))c.disabled=true;chips();remember();
  return {values:()=>structuredClone(state),remember,clear,options,updateCount(count){document.querySelectorAll('[data-show-results]').forEach(b=>b.textContent='Ver '+count+' proyecto'+(count===1?'':'s'));},issue:()=>rangeIssue(state)};
}
