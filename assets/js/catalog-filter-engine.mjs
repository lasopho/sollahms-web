/** Pure, bounded filtering of documented project facts. Unknown is never false. */
export const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL');
export const FILTER_VERSION=2;
export const FILTER_STORAGE='sollahmsCatalogFiltersV2';
export const defaults=()=>({version:2,search:'',region:'',commune:'',minPriceInput:'',maxPriceInput:'',propertyType:'',bedrooms:'',delivery:'',bathrooms:'',areaType:'util',minArea:'',maxArea:'',purchaseModes:[],typologies:[],amenities:[],features:[],developers:[],amenitiesAll:false,featuresAll:false,state:'',assetType:'',sortOrder:'original'});
const arrays=['purchaseModes','amenities','features','developers','typologies'];
const numbers=['minPriceInput','maxPriceInput','minArea','maxArea'];
const fields={purchaseModes:'modalidad',search:'q',region:'region',commune:'comuna',minPriceInput:'precio_min',maxPriceInput:'precio_max',propertyType:'tipo',bedrooms:'dormitorios',delivery:'entrega',bathrooms:'banos',areaType:'superficie',minArea:'m2_min',maxArea:'m2_max',typologies:'tipologia',amenities:'amenity',features:'caracteristica',developers:'inmobiliaria',amenitiesAll:'amenities_todas',featuresAll:'caracteristicas_todas',state:'estado',assetType:'uso',sortOrder:'orden'};
export const validNumber=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export const bound=value=>value===''||value==null?null:/^\d{1,9}(?:\.\d{1,2})?$/.test(String(value))?Number(value):NaN;
export function rangeIssue(s){
  for(const [low,high,label] of [['minPriceInput','maxPriceInput','precio'],['minArea','maxArea','superficie']]){
    const a=bound(s[low]),b=bound(s[high]);if(Number.isNaN(a)||Number.isNaN(b))return 'Revisa el rango de '+label+'. Usa números positivos con hasta dos decimales.';
    if(a!==null&&b!==null&&a>b)return 'El mínimo de '+label+' debe ser menor o igual que el máximo.';
  }return '';
}
export function inRange(value,low,high){const a=bound(low),b=bound(high);return a===null&&b===null?true:validNumber(value)&&(a===null||value>=a)&&(b===null||value<=b);}
const numberChoice=(value,selected)=>!selected||validNumber(value)&&(selected.endsWith('+')?value>=Number(selected.slice(0,-1)):value===Number(selected));
export function eligibleFeatures(project,state){
  const commercial=['local','oficina'].includes(state.propertyType)||state.assetType==='Comercial';
  return (project._facets?.features??[]).filter(f=>!(commercial&&f.scope==='residential'))
    .filter(f=>!['terraza-privada','jardin-privado'].includes(f.id)||(project._facets?.variants??[]).some(v=>variantFits(v,state)&&v[f.id==='terraza-privada'?'privateTerrace':'privateGarden']===true)).map(f=>f.id);
}
function variantFits(v,s){return (!s.propertyType||v.propertyType===s.propertyType)
  &&(!s.assetType||s.assetType==='Mixto'||(s.assetType==='Comercial'?['local','oficina'].includes(v.propertyType):s.assetType==='Terreno'?v.propertyType==='terreno':!['local','oficina','terreno'].includes(v.propertyType)))
  &&numberChoice(v.bedrooms,s.bedrooms)&&numberChoice(v.bathrooms,s.bathrooms)
  &&(!s.typologies?.length||s.typologies.includes(v.typology))&&inRange(v.areas?.[s.areaType],s.minArea,s.maxArea);}
export function matchesVariant(project,s){
  const f=project._facets??{};
  if(s.propertyType&&!(f.propertyTypes??[]).includes(s.propertyType))return false;
  const privateIds=['terraza-privada','jardin-privado'],base=eligibleFeatures(project,s).filter(id=>!privateIds.includes(id));
  const needs=s.bedrooms||s.bathrooms||s.typologies?.length||s.minArea!==''||s.maxArea!==''||!selectedMatch(base,s.features,s.featuresAll);
  if(!needs)return true;
  return (f.variants??[]).some(v=>variantFits(v,s)&&selectedMatch([...base,...(v.privateTerrace?['terraza-privada']:[]),...(v.privateGarden?['jardin-privado']:[])],s.features,s.featuresAll));
}
function selectedMatch(actual,selected,all){return !selected.length||(all?selected.every(id=>actual.includes(id)):selected.some(id=>actual.includes(id)));}
export function keywords(project,s){const f=project._facets??{};const allowed=new Set(eligibleFeatures(project,s));return [project.nombre,project.comuna,project.region,project.direccion,project.inmobiliaria,...(f.propertyLabels??[]),...(f.features??[]).filter(x=>allowed.has(x.id)).map(x=>x.label),...(f.typologyLabels??[])].filter(Boolean).join(' ');}
export function searchTokens(query){return fold(query).trim().split(/\s+/).filter(Boolean).slice(0,30);}
export function advancedFilterAndSort(projects,input={}){
  const s={...defaults(),...input};if(rangeIssue(s))return [];
  const words=searchTokens(s.search);
  const rows=projects.filter(p=>{
    const f=p._facets??{},ids=eligibleFeatures(p,s);
    return (!s.region||p.region===s.region)&&(!s.commune||p.comuna===s.commune)
      &&(!s.developers.length||s.developers.includes(p.inmobiliaria))
      &&(!s.state||(f.states??[p.estado]).some(x=>fold(x)===fold(s.state)))
      &&(!s.assetType||(f.assetTypes??[]).includes(s.assetType))
      &&(!s.purchaseModes.length||(f.purchaseStage?.eligible===true&&s.purchaseModes.includes(f.purchaseStage.mode)))
      &&(!s.delivery||(s.delivery==='inmediata'?f.delivery?.immediate===true:String(f.delivery?.year)===s.delivery))
      &&inRange(p.precioDesdeUF>0?p.precioDesdeUF:null,s.minPriceInput,s.maxPriceInput)&&matchesVariant(p,s)
      &&selectedMatch(ids,s.amenities,s.amenitiesAll)&&selectedMatch(ids,s.features,s.featuresAll)
      &&(!words.length||words.every(w=>fold(keywords(p,s)).includes(w)));
  });
  if(s.sortOrder==='price-asc'||s.sortOrder==='price-desc')rows.sort((a,b)=>{
    const av=a.precioDesdeUF,bv=b.precioDesdeUF,ak=validNumber(av)&&av>0,bk=validNumber(bv)&&bv>0;
    return !ak||!bk?ak?-1:bk?1:0:(s.sortOrder==='price-asc'?1:-1)*(av-bv);
  });
  if(s.sortOrder==='delivery')rows.sort((a,b)=>deliveryRank(a)-deliveryRank(b));
  if(s.sortOrder==='name')rows.sort((a,b)=>a.nombre.localeCompare(b.nombre,'es-CL'));
  if(s.sortOrder==='relevance'&&words.length)rows.sort((a,b)=>relevance(b,words)-relevance(a,words));
  return rows;
}
const deliveryRank=p=>p._facets?.delivery?.immediate?0:p._facets?.delivery?.year??9999;
const relevance=(p,words)=>words.reduce((n,w)=>n+(fold(p.nombre).includes(w)?3:0)+(fold(p.comuna).includes(w)?2:0)+(fold(p.inmobiliaria).includes(w)?1:0),0);
export function sanitizeState(input,options){
  const s=defaults();if(!input||typeof input!=='object'||Array.isArray(input))return s;
  const allowed={purchaseModes:['blanco','verde','inmediata'],region:options.regions,commune:options.communes,propertyType:options.propertyTypes?.map(x=>x.id),bedrooms:['0','1','2','3','4+'],bathrooms:['1','2','3+'],delivery:options.deliveries?.map(x=>x.id),areaType:options.areaTypes?.map(x=>x.id),state:options.states,assetType:options.assetTypes,sortOrder:['original','price-asc','price-desc','delivery','name','relevance'],amenities:options.filters?.filter(x=>x.group==='amenities').map(x=>x.id),features:options.filters?.filter(x=>x.group==='features').map(x=>x.id),developers:options.developers,typologies:options.typologies?.map(x=>x.id)};
  for(const key of arrays)if(Array.isArray(input[key]))s[key]=[...new Set(input[key].filter(x=>typeof x==='string'&&(allowed[key]??[]).includes(x)))].sort().slice(0,50);
  for(const key of Object.keys(allowed).filter(k=>!arrays.includes(k)))if(typeof input[key]==='string'&&(allowed[key]??[]).includes(input[key]))s[key]=input[key];
  for(const key of numbers)if(typeof input[key]==='string'&&input[key].length<=12&&!Number.isNaN(bound(input[key])))s[key]=input[key];
  for(const key of ['amenitiesAll','featuresAll'])s[key]=input[key]===true;
  if(typeof input.search==='string')s.search=input.search.slice(0,200).replace(/[<>\u0000-\u001f\u007f]/g,'');
  return s;
}
export function readQuery(search,options){
  if(typeof search!=='string'||search.length>6000)return {present:false,state:defaults()};
  const params=new URLSearchParams(search),raw={};let present=false;
  for(const [key,name] of Object.entries(fields))if(params.has(name)){present=true;raw[key]=arrays.includes(key)?params.getAll(name).slice(0,50):['amenitiesAll','featuresAll'].includes(key)?params.get(name)==='1':params.get(name);}
  return {present:present||params.has('vista'),state:sanitizeState(raw,options),view:['cards','list','map'].includes(params.get('vista'))?params.get('vista'):null};
}
export function safePublicState(state,projects){
  const s={...state};const words=searchTokens(s.search);
  for(const key of numbers)if(Number.isNaN(bound(s[key])))s[key]='';
  // Persist only words found in public project facts, never arbitrary personal text.
  if(words.length&&!projects.some(p=>words.every(w=>fold(keywords(p,s)).includes(w))))s.search='';
  return s;
}
export function writeQuery(state,view='cards'){
  const params=new URLSearchParams(),empty=defaults();
  for(const [key,name] of Object.entries(fields)){
    const value=state[key];if(arrays.includes(key)){for(const v of [...(value??[])].sort())params.append(name,v);}
    else if(value!==empty[key]&&value!==''&&value!==false&&value!=null)params.set(name,value===true?'1':String(value));
  }
  if(view!=='cards')params.set('vista',view);return params.toString();
}
export function matchedLabels(project,state){const actual=new Set(eligibleFeatures(project,state)),selected=new Set([...state.amenities,...state.features]);return (project._facets?.features??[]).filter(x=>selected.has(x.id)&&actual.has(x.id)).map(x=>x.label);}
