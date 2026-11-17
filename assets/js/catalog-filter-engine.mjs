import {metroDefaults,metroMatches} from './metro-model.mjs';
import {catalogReference} from './project-offers.mjs?v=20261029-euro-1';
import {hasCatalogTypologyPrices,matchCatalogTypologyPrices,catalogTypologyOffer,catalogTypologyFeatureIds} from './catalog-typology-prices.mjs';
import {matchProjectFilters,queryFromCatalogState,normalizePropertyType,normalizeAmenityKey} from './commercial-filter-engine.mjs';
/** Pure, bounded filtering of documented project facts. Unknown is never false. */
export const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL');
export const FILTER_VERSION=2;
export const FILTER_STORAGE='sollahmsCatalogFiltersV2';
export const defaults=()=>({...metroDefaults(),version:2,search:'',region:'',commune:'',minPriceInput:'',maxPriceInput:'',propertyType:'',bedrooms:'',delivery:'',bathrooms:'',areaType:'',minArea:'',maxArea:'',purchaseModes:[],typologies:[],amenities:[],features:[],developers:[],amenitiesAll:false,featuresAll:false,state:'',assetType:'',parking:'',storage:'',evidenceMode:'published',sortOrder:'original'});
const arrays=['metroLines','purchaseModes','amenities','features','developers','typologies'];
const numbers=['minPriceInput','maxPriceInput','minArea','maxArea'];
const fields={metroNetwork:'metro_red',metroLines:'metro_linea',metroStation:'metro_estacion',metroDistance:'metro_distancia',metroMinutes:'metro_minutos',metroMethod:'metro_medida',metroFutureState:'metro_estado',purchaseModes:'modalidad',search:'q',region:'region',commune:'comuna',minPriceInput:'precio_min',maxPriceInput:'precio_max',propertyType:'tipo',bedrooms:'dormitorios',delivery:'entrega',bathrooms:'banos',areaType:'superficie',minArea:'m2_min',maxArea:'m2_max',typologies:'tipologia',amenities:'amenity',features:'caracteristica',developers:'inmobiliaria',amenitiesAll:'amenities_todas',featuresAll:'caracteristicas_todas',state:'estado',assetType:'uso',parking:'estacionamiento',storage:'bodega',evidenceMode:'evidencia',sortOrder:'orden'};
export const validNumber=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export const bound=value=>value===''||value==null?null:/^\d{1,9}(?:\.\d{1,2})?$/.test(String(value))?Number(value):NaN;
export function rangeIssue(s){
  for(const [low,high,label] of [['minPriceInput','maxPriceInput','precio'],['minArea','maxArea','superficie']]){
    const a=bound(s[low]),b=bound(s[high]);if(Number.isNaN(a)||Number.isNaN(b))return 'Revisa el rango de '+label+'. Usa números positivos con hasta dos decimales.';
    if(a!==null&&b!==null&&a>b)return 'El mínimo de '+label+' debe ser menor o igual que el máximo.';
  }
  if((bound(s.minArea)!==null||bound(s.maxArea)!==null)&&!['util','total','interior','terraza','jardin','terreno'].includes(s.areaType))return 'Selecciona una métrica de superficie: útil o total.';
  return '';
}
export function inRange(value,low,high){const a=bound(low),b=bound(high);return a===null&&b===null?true:validNumber(value)&&(a===null||value>=a)&&(b===null||value<=b);}
const numberChoice=(value,selected)=>selected===''||selected==null||validNumber(value)&&(String(selected).endsWith('+')?value>=Number(String(selected).slice(0,-1)):value===Number(selected));
export function eligibleFeatures(project,state){
  const commercial=['local','oficina'].includes(state.propertyType)||state.assetType==='Comercial';
  return (project._facets?.features??[]).filter(f=>!(commercial&&f.scope==='residential'))
    .filter(f=>!['terraza-privada','jardin-privado'].includes(f.id)||(project._facets?.variants??[]).some(v=>variantFits(v,state)&&v[f.id==='terraza-privada'?'privateTerrace':'privateGarden']===true)).map(f=>f.id);
}
function variantFits(v,s){const property=normalizePropertyType(v.propertyType);return (!s.propertyType||property===normalizePropertyType(s.propertyType)&&property!==null)
  &&(!s.assetType||s.assetType==='Mixto'||(s.assetType==='Comercial'?['local','oficina'].includes(property):s.assetType==='Terreno'?property==='terreno':s.assetType==='Residencial'&&['departamento','casa','duplex','estudio'].includes(property)))
  &&numberChoice(v.bedrooms,s.bedrooms)&&numberChoice(v.bathrooms,s.bathrooms)
  &&(!s.typologies?.length||s.typologies.includes(v.typology))&&inRange(v.areas?.[s.areaType],s.minArea,s.maxArea);}
export function matchesVariant(project,s){
  const f=project._facets??{};
  if(s.propertyType&&!(f.propertyTypes??[]).includes(s.propertyType))return false;
  const privateIds=['terraza-privada','jardin-privado'],base=eligibleFeatures(project,s).filter(id=>!privateIds.includes(id));
  const needs=s.bedrooms!==''&&s.bedrooms!=null||s.bathrooms!==''&&s.bathrooms!=null||s.typologies?.length||s.minArea!==''||s.maxArea!==''||!selectedMatch(base,s.features,s.featuresAll);
  if(!needs)return true;
  return (f.variants??[]).some(v=>variantFits(v,s)&&selectedMatch([...base,...(v.privateTerrace?['terraza-privada']:[]),...(v.privateGarden?['jardin-privado']:[])],s.features,s.featuresAll));
}
/**
 * A published desde value is not a price for every documented model. Preserve
 * the current price policy, but require an explicit matching commercial offer
 * when price is combined with option facts. No model area is lent to an offer.
 */
function optionQuery(project,s){
  const query=queryFromCatalogState(s);
  for(const key of ['text','region','commune','developers','state','delivery','amenities'])delete query[key];
  const privateIds=['terraza-privada','jardin-privado'];
  const common=eligibleFeatures(project,s).filter(id=>!privateIds.includes(id));
  query.features=!s.featuresAll&&(s.features??[]).some(id=>!privateIds.includes(id)&&common.includes(id))?[]:(s.features??[]).filter(id=>privateIds.includes(id));
  return query;
}
export function matchesPublishedPriceReference(project,s){
  if(bound(s.minPriceInput)===null&&bound(s.maxPriceInput)===null)return true;
  if(hasCatalogTypologyPrices(project))return matchCatalogTypologyPrices(project,s).matches;
  const f=project._facets??{},price=catalogReference(project,s).value;
  const propertyTypes=[...new Set((f.propertyTypes??[]).map(normalizePropertyType).filter(Boolean))];
  const references=[];
  // The project price can carry only a documented universal property type.
  if(price===project.precioDesdeUF)references.push({id:'published-project-price',attributes:{priceUF:price,propertyType:propertyTypes.length===1?propertyTypes[0]:null}});
  const typedPricePolicy=['owner-typology','by-product'].includes(project.catalogPricePolicy)||
    project.inmobiliaria==='Ecasa'&&project.commercialSource?.date==='2026-10-30';
  for(const offer of typedPricePolicy?project.commercialOffers??[]:[]){
    if(offer.priceUF!==price)continue;
    references.push({id:'published-offer:'+offer.id,attributes:{
      priceUF:offer.priceUF,propertyType:offer.propertyType,bedrooms:offer.bedrooms,bathrooms:offer.bathrooms,
      usefulM2:offer.usefulM2,totalM2:offer.totalM2,interiorM2:offer.interiorM2,
      terraceM2:offer.terraceM2,gardenM2:offer.gardenM2,landM2:offer.landM2,
      privateTerrace:offer.privateTerrace,privateGarden:offer.privateGarden,typology:offer.typology,
      parkingIncluded:offer.parkingIncluded,parkingAvailable:offer.parkingAvailable,
      storageIncluded:offer.storageIncluded,storageAvailable:offer.storageAvailable,
    }});
  }
  const query=optionQuery(project,s);
  // Region, developer, state, delivery and common amenities are evaluated by
  // the established project/stage path. Keep only option predicates here.
  return matchProjectFilters({slug:project.slug,projectFacts:{assetTypes:f.assetTypes??[],parking:f.parking,storage:f.storage},references},query).matches;
}
function publishedExtraMatches(project,state){
  if(!state.parking&&!state.storage)return true;
  // With an active price, the commercial witness check already included extras.
  if(bound(state.minPriceInput)!==null||bound(state.maxPriceInput)!==null)return true;
  const f=project._facets??{},references=(f.variants??[]).map((variant,index)=>({id:'published-model:'+index,attributes:{
    ...variant,usefulM2:variant.areas?.util,totalM2:variant.areas?.total,interiorM2:variant.areas?.interior,
    terraceM2:variant.areas?.terraza,gardenM2:variant.areas?.jardin,landM2:variant.areas?.terreno,
  }}));
  return matchProjectFilters({slug:project.slug,projectFacts:{assetTypes:f.assetTypes??[],parking:f.parking,storage:f.storage},references},optionQuery(project,state)).matches;
}
const matchingPrice=match=>{
  const prices=match?.references?.map(reference=>reference.attributes?.priceUF).filter(value=>validNumber(value)&&value>0)??[];
  return prices.length?Math.min(...prices):null;
};
const resultPrice=(project,state)=>state.evidenceMode==='documentary'?matchingPrice(project._documentaryMatch):
  project._commercialMatch?matchingPrice(project._commercialMatch):hasCatalogTypologyPrices(project)?
    catalogTypologyOffer(project,state).value:catalogReference(project,state).value;
function preparedPurchaseMatches(record,state){
  if(!state.purchaseModes.length)return true;
  const stage=record.projectFacts?.purchaseStage;
  // The published educational classification is a different dated source.
  // Neither F049 commercial state nor reported immediate delivery establishes it.
  return stage?.eligible===true&&state.purchaseModes.includes(stage.mode);
}
function selectedMatch(actual,selected,all){return !selected.length||(all?selected.every(id=>actual.includes(id)):selected.some(id=>actual.includes(id)));}
export function keywords(project,s){const f=project._facets??{};const allowed=new Set(eligibleFeatures(project,s));return [project.nombre,project.comuna,project.region,project.direccion,project.inmobiliaria,...(f.propertyLabels??[]),...(f.features??[]).filter(x=>allowed.has(x.id)).map(x=>x.label),...(f.typologyLabels??[])].filter(Boolean).join(' ');}
export function searchTokens(query){return fold(query).trim().split(/\s+/).filter(Boolean).slice(0,30);}
export function advancedFilterAndSort(projects,input={}){
  const s={...defaults(),...input};if(rangeIssue(s))return [];
  const words=searchTokens(s.search);
  // ECasa stages are independent candidates; one best matching stage per existing card.
  const candidates=projects.flatMap(p=>{
    if(s.evidenceMode==='documentary'||p.inmobiliaria!=='Ecasa'||!p._facets?.stages)return [p];
    const stages=[...p.etapasComerciales].sort((a,b)=>(a.slug===p.etapaReferenciaSlug?-1:0)-(b.slug===p.etapaReferenciaSlug?-1:0));
    return stages.map(t=>({...p,...t,slug:p.slug,detalleUrl:p.detalleUrl,
      imagenPrincipal:p.imagenPrincipal,imagenAlt:p.imagenAlt,
      _ecasaStageNumber:t.etapa??Number(t.detalleUrl.split('#etapa-')[1]),
      _ecasaStageSlug:t.slug,_facets:p._facets.stages[t.slug]}));
  });
  const rows=candidates.flatMap(p=>{
    if(s.evidenceMode==='documentary'){
      const record=p._documentaryRecord;
      if(p._documentaryReviewEnabled!==true||record?.slug!==p.slug||record.sourceProject?.slug!==p.slug
        ||record.notOffer!==true||record.commercialAdoptionAllowed!==false
        ||!['documentary-local-only-not-offer','documentary-reviewed-no-stock'].includes(record.sourceLayer))return [];
      // These selectors have no predicate contract. Never silently treat a
      // request for a unit, model or available stock as a successful search.
      if(['unit','model','stock','availability'].some(key=>input[key]!==undefined&&input[key]!==null&&input[key]!==''))return [];
      const match=matchProjectFilters(record,queryFromCatalogState(s));
      // Geography is verified separately against this project's identity. No
      // published stage, price, status, delivery or amenities can satisfy it.
      if(!match.matches||!metroMatches(p,s)||!preparedPurchaseMatches(record,s))return [];
      const {_commercialMatch,...project}=p;
      return [{...project,_documentaryMatch:match}];
    }
    if(s.evidenceMode==='prepared'&&p._commercialStatus?.active===false)return [];
    if(s.evidenceMode==='prepared'&&p._commercial?.sourceLayer==='prepared'){
      const match=matchProjectFilters(p._commercial,queryFromCatalogState(s));
      return match.matches&&metroMatches(p,s)&&preparedPurchaseMatches(p._commercial,s)
        ?[{...p,_commercialMatch:match}]:[];
    }
    const publishedPriceMatch=hasCatalogTypologyPrices(p)?matchCatalogTypologyPrices(p,s):null;
    const hasPrice=bound(s.minPriceInput)!==null||bound(s.maxPriceInput)!==null;
    const f=p._facets??{},ids=publishedPriceMatch&&hasPrice?catalogTypologyFeatureIds(p,s,publishedPriceMatch):eligibleFeatures(p,s);
    const matches=metroMatches(p,s)&&(!s.region||p.region===s.region)&&(!s.commune||p.comuna===s.commune)
      &&(!s.developers.length||s.developers.includes(p.inmobiliaria))
      &&(!s.state||(f.states??[p.estado]).some(x=>fold(x)===fold(s.state)))
      &&(!s.assetType||(f.assetTypes??[]).includes(s.assetType))
      &&(!s.purchaseModes.length||(f.purchaseStage?.eligible===true&&s.purchaseModes.includes(f.purchaseStage.mode)))
      &&(!s.delivery||(s.delivery==='inmediata'?(f.delivery?.immediate===true||p.inmobiliaria==='León'&&f.delivery?.reportedImmediate===true):String(f.delivery?.year)===s.delivery))
      &&(publishedPriceMatch&&hasPrice?publishedPriceMatch.matches:
        inRange(catalogReference(p,s).value,s.minPriceInput,s.maxPriceInput)&&matchesVariant(p,s)&&matchesPublishedPriceReference(p,s)&&publishedExtraMatches(p,s))
      &&selectedMatch(ids,s.amenities,s.amenitiesAll)&&selectedMatch(ids,s.features,s.featuresAll)
      &&(publishedPriceMatch&&hasPrice||!words.length||words.every(w=>fold(keywords(p,s)).includes(w)));
    return matches?[publishedPriceMatch?{...p,_publishedPriceMatch:publishedPriceMatch}:p]:[];
  });
  if(s.sortOrder==='price-asc'||s.sortOrder==='price-desc')rows.sort((a,b)=>{
    const av=resultPrice(a,s),bv=resultPrice(b,s),ak=validNumber(av)&&av>0,bk=validNumber(bv)&&bv>0;
    return !ak||!bk?ak?-1:bk?1:0:(s.sortOrder==='price-asc'?1:-1)*(av-bv);
  });
  if(s.sortOrder==='delivery')rows.sort((a,b)=>deliveryRank(a,s)-deliveryRank(b,s));
  if(s.sortOrder==='name')rows.sort((a,b)=>a.nombre.localeCompare(b.nombre,'es-CL'));
  if(s.sortOrder==='relevance'&&words.length)rows.sort((a,b)=>relevance(b,words)-relevance(a,words));
  return rows.filter((p,i,a)=>a.findIndex(x=>x.slug===p.slug)===i);
}
const deliveryRank=(p,s)=>s.evidenceMode==='documentary'?9999:p._commercialMatch?(p._commercialMatch.record.projectFacts.delivery?.category==='immediate'?0:p._commercialMatch.record.projectFacts.delivery?.year??9999):p._facets?.delivery?.immediate?0:p._facets?.delivery?.year??9999;
const relevance=(p,words)=>words.reduce((n,w)=>n+(fold(p.nombre).includes(w)?3:0)+(fold(p.comuna).includes(w)?2:0)+(fold(p.inmobiliaria).includes(w)?1:0),0);
export function sanitizeState(input,options={}){
  const s=defaults();if(!input||typeof input!=='object'||Array.isArray(input))return s;
  const allowed={metroNetwork:['current','future'],metroLines:options.metroLines??[],metroStation:options.metroStations??[],metroDistance:['300','500','800','1000'],metroMinutes:options.walkingAvailable?['5','10','15']:[],metroMethod:options.walkingAvailable?['geographic','walking']:['geographic'],metroFutureState:['construction','planned','study'],purchaseModes:['blanco','verde','inmediata'],region:options.regions,commune:options.communes,propertyType:options.propertyTypes?.map(x=>x.id),bedrooms:['0','1','2','3','4+'],bathrooms:['1','2','3+'],delivery:options.deliveries?.map(x=>x.id),areaType:[...(options.areaTypes?.map(x=>x.id)??[]),'util','total','interior','terraza','jardin','terreno'],state:options.states,assetType:options.assetTypes,parking:['additional','included','available'],storage:['additional','included','available'],evidenceMode:options.documentaryReviewEnabled===true?['published','prepared','documentary']:['published','prepared'],sortOrder:['original','price-asc','price-desc','delivery','name','relevance'],amenities:options.filters?.filter(x=>x.group==='amenities').map(x=>x.id),features:options.filters?.filter(x=>x.group==='features').map(x=>x.id),developers:options.developers,typologies:options.typologies?.map(x=>x.id)};
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
  return {present:present||params.has('vista'),state:sanitizeState(raw,options),view:['cards','list','map','split'].includes(params.get('vista'))?params.get('vista'):null};
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
export function matchedLabels(project,state){
  const selected=new Set([...(state.amenities??[]),...(state.features??[])]);
  if(state.evidenceMode==='documentary'||project._documentaryMatch)return [];
  if(project._publishedPriceMatch&&!project._commercialMatch
    &&(bound(state.minPriceInput)!==null||bound(state.maxPriceInput)!==null)){
    const actual=new Set(catalogTypologyFeatureIds(project,state));
    return (project._facets?.features??[]).filter(feature=>selected.has(feature.id)&&actual.has(feature.id)).map(feature=>feature.label);
  }
  if(project._commercialMatch){
    const match=project._commercialMatch,facts=match.record.projectFacts;
    return (project._facets?.features??[]).filter(feature=>selected.has(feature.id)&&(
      facts.amenities?.[normalizeAmenityKey(feature.id)]===true||
      feature.id==='terraza-privada'&&match.references.some(reference=>reference.attributes?.privateTerrace===true)||
      feature.id==='jardin-privado'&&match.references.some(reference=>reference.attributes?.privateGarden===true)
    )).map(feature=>feature.label);
  }
  const actual=new Set(eligibleFeatures(project,state));
  return (project._facets?.features??[]).filter(feature=>selected.has(feature.id)&&actual.has(feature.id)).map(feature=>feature.label);
}

