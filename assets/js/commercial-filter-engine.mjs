/**
 * Local commercial evidence evaluator. A reference is documentary evidence, never
 * a stock item. Every active option predicate must have the same witness.
 */
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL').trim();
const present=value=>value!==undefined&&value!==null&&value!=='';
const numeric=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const same=(a,b)=>present(a)&&fold(a)===fold(b);
const values=value=>Array.isArray(value)?value:present(value)?[value]:[];
const selected=(actual,wanted,all=false)=>!wanted.length||(all?wanted.every(x=>actual.includes(x)):wanted.some(x=>actual.includes(x)));
const propertyAliases={departamento:'departamento',departamentos:'departamento',depto:'departamento',casa:'casa',casas:'casa',duplex:'duplex',estudio:'estudio',local:'local','local comercial':'local',oficina:'oficina',terreno:'terreno',terrenos:'terreno'};
export const normalizePropertyType=value=>propertyAliases[fold(value)]??null;
const assetAliases={residencial:'Residencial',comercial:'Comercial',terreno:'Terreno',mixto:'Mixto'};
export const normalizeAssetType=value=>assetAliases[fold(value)]??null;
const assetOf=property=>['departamento','casa','duplex','estudio'].includes(property)?'Residencial':['local','oficina'].includes(property)?'Comercial':property==='terreno'?'Terreno':null;
const metricAliases={useful:'usefulM2',util:'usefulM2',total:'totalM2',interior:'interiorM2',terrace:'terraceM2',terraza:'terraceM2',garden:'gardenM2',jardin:'gardenM2',land:'landM2',terreno:'landM2'};
const amenityAliases={piscina:'pool',gimnasio:'gym',quinchos:'barbecue',cowork:'cowork',lavanderia:'laundry',bicicleteros:'bikeParking','areas-verdes':'greenAreas','juegos-infantiles':'playground','salon-multiuso':'multipurposeRoom',seguridad:'security','terraza-comun':'commonTerrace','terraza-panoramica':'commonTerrace',mascotas:'pets',lounge:'lounge'};
const amenityKey=value=>amenityAliases[value]??value;
export const normalizeAmenityKey=amenityKey;

/** Query bounds accept form strings; source values must remain actual numbers. */
function bound(value){
  if(!present(value))return null;
  if(typeof value==='number')return numeric(value)?value:NaN;
  return typeof value==='string'&&/^\d{1,9}(?:\.\d{1,2})?$/.test(value)?Number(value):NaN;
}
function range(value,min,max){
  const low=bound(min),high=bound(max);
  if(low===null&&high===null)return true;
  return numeric(value)&&!Number.isNaN(low)&&!Number.isNaN(high)&&(low===null||value>=low)&&(high===null||value<=high);
}
function numberChoice(value,choice){
  if(!present(choice))return true;
  if(!numeric(value))return false;
  const text=String(choice);
  if(/^\d\+$/.test(text))return value>=Number(text.slice(0,-1));
  return /^\d+$/.test(text)&&value===Number(text);
}
function typologyMatches(attributes,choices){
  return !choices.length||choices.some(choice=>{
    if(attributes.typology===choice)return true;
    const key=fold(choice),parts=/^(\d+)d(?:-(\d+)b)?$/.exec(key);
    if(parts)return numberChoice(attributes.bedrooms,parts[1])&&(!parts[2]||numberChoice(attributes.bathrooms,parts[2]));
    const studio=/^estudio(?:-(\d+)b)?$/.exec(key);
    return !!studio&&numberChoice(attributes.bedrooms,0)&&(!studio[1]||numberChoice(attributes.bathrooms,studio[1]));
  });
}
function stateKey(value){
  const key=fold(value);
  return ({'venta en blanco':'en blanco','venta en verde':'en verde','en recepcion final':'recepcion final'})[key]??key;
}
function deliveryChoice(value){
  if(!present(value))return null;
  if(typeof value==='object'&&!Array.isArray(value))return value;
  const key=fold(value);
  if(['inmediata','immediate','entrega inmediata'].includes(key))return {category:'immediate'};
  if(['estimated','estimada'].includes(key))return {category:'estimated'};
  if(['delivered','entregado'].includes(key))return {category:'delivered'};
  if(/^20\d{2}$/.test(key))return {year:Number(key)};
  return {category:key};
}
function deliveryMatches(actual,wanted){
  const requested=deliveryChoice(wanted);
  if(!requested)return true;
  if(!actual||typeof actual!=='object')return false;
  return ['category','year','semester'].every(key=>!present(requested[key])||
    (key==='category'?same(actual[key],requested[key]):numeric(actual[key])&&actual[key]===Number(requested[key])));
}
function featureKeys(facts){
  if(Array.isArray(facts.features))return facts.features.map(item=>typeof item==='string'?item:item?.value===true?item.id:null).filter(Boolean);
  return Object.entries(facts.features??{}).filter(([,value])=>value===true).map(([key])=>key);
}
function surfaceRanges(query){
  const requested=[];
  if(present(query.minSurface)||present(query.maxSurface))requested.push([metricAliases[query.surfaceMetric]??null,query.minSurface,query.maxSurface]);
  // Multiple explicitly named metrics are useful for documentary regression cases.
  for(const [metric,limits] of Object.entries(query.surfaces??{}))requested.push([metricAliases[metric]??null,limits?.min,limits?.max]);
  return requested;
}
function queryIssues(query){
  const issues=[];
  for(const [name,min,max] of [['precio',query.minPrice,query.maxPrice],...surfaceRanges(query).map(([metric,min,max])=>[metric,min,max])]){
    const low=bound(min),high=bound(max);
    if(name===null)issues.push('Selecciona una métrica de superficie explícita.');
    if(Number.isNaN(low)||Number.isNaN(high))issues.push('Revisa el rango de '+(name??'superficie')+'.');
    if(low!==null&&high!==null&&low>high)issues.push('El mínimo debe ser menor o igual que el máximo.');
  }
  return issues;
}
function optionNeeded(query,facts){
  return ['propertyType','bedrooms','bathrooms','minPrice','maxPrice'].some(key=>present(query[key]))||
    (present(query.assetType)&&normalizeAssetType(query.assetType)!=='Mixto')||surfaceRanges(query).length>0||
    query.privateTerrace===true||query.privateGarden===true||values(query.typologies).length>0||
    values(query.features).some(key=>['terraza-privada','jardin-privado'].includes(key))||
    ['included','available'].includes(query.parking)&&facts.parking?.[query.parking]!==true||
    ['included','available'].includes(query.storage)&&facts.storage?.[query.storage]!==true||
    present(query.state)&&!present(facts.state)||present(query.delivery)&&!facts.delivery;
}
function extraMatches(kind,wanted,attributes,facts){
  if(!present(wanted))return true;
  if(wanted==='additional')return facts[kind]?.generalAdditional===true;
  if(!['included','available'].includes(wanted))return false;
  return facts[kind]?.[wanted]===true||attributes[kind+(wanted==='included'?'Included':'Available')]===true;
}
function referenceMatches(reference,query,facts){
  const a=reference.attributes??{},property=normalizePropertyType(a.propertyType),asset=normalizeAssetType(a.assetType)??assetOf(property);
  if(present(query.propertyType)&&(!property||property!==normalizePropertyType(query.propertyType)))return false;
  if(present(query.assetType)&&normalizeAssetType(query.assetType)!=='Mixto'&&(!asset||asset!==normalizeAssetType(query.assetType)))return false;
  if(!numberChoice(a.bedrooms,query.bedrooms)||!numberChoice(a.bathrooms,query.bathrooms))return false;
  if((present(query.minPrice)||present(query.maxPrice))&&(!(numeric(a.priceUF)&&a.priceUF>0)||!range(a.priceUF,query.minPrice,query.maxPrice)))return false;
  if(!surfaceRanges(query).every(([metric,min,max])=>metric&&range(a[metric],min,max)))return false;
  if(!typologyMatches(a,values(query.typologies)))return false;
  if(query.privateTerrace===true&&a.privateTerrace!==true||query.privateGarden===true&&a.privateGarden!==true)return false;
  const features=[...featureKeys(facts),...(a.privateTerrace===true?['terraza-privada']:[]),...(a.privateGarden===true?['jardin-privado']:[])];
  if(!selected(features,values(query.features),query.featuresAll))return false;
  if(!extraMatches('parking',query.parking,a,facts)||!extraMatches('storage',query.storage,a,facts))return false;
  // Project facts are usable here only when the adapter established universal scope.
  const state=present(facts.state)?facts.state:a.state;
  const delivery=facts.delivery??a.delivery;
  return (!present(query.state)||present(state)&&stateKey(state)===stateKey(query.state))&&deliveryMatches(delivery,query.delivery);
}

/** Bridge the existing catalogue state; no personal data or persisted state is read. */
export function queryFromCatalogState(state={}){
  return {text:state.search,region:state.region,commune:state.commune,developers:state.developers??[],
    state:state.state,delivery:state.delivery,propertyType:state.propertyType,assetType:state.assetType,
    minPrice:state.minPriceInput,maxPrice:state.maxPriceInput,bedrooms:state.bedrooms,bathrooms:state.bathrooms,
    surfaceMetric:state.areaType,minSurface:state.minArea,maxSurface:state.maxArea,
    typologies:state.typologies??[],amenities:(state.amenities??[]).map(amenityKey),amenitiesAll:state.amenitiesAll===true,
    features:state.features??[],featuresAll:state.featuresAll===true,parking:state.parking,storage:state.storage};
}

/** Return the exact witnesses. Unknown active fields fail; unused fields do not. */
export function matchProjectFilters(record,query={}){
  const facts=record?.projectFacts??{},project=record?.sourceProject??{},issues=queryIssues(query);
  const result={matches:false,record,project,references:[],matchedReferenceIds:[],issues};
  if(!record||issues.length)return result;
  if(!['region','commune','developer'].every(key=>!present(query[key])||same(facts[key],query[key])))return result;
  if(values(query.developers).length&&!values(query.developers).some(value=>same(facts.developer,value)))return result;
  if(present(query.assetType)&&!normalizeAssetType(query.assetType))return result;
  if(normalizeAssetType(query.assetType)==='Mixto'&&!values(facts.assetTypes).some(value=>normalizeAssetType(value)==='Mixto'))return result;
  const commercial=['local','oficina'].includes(normalizePropertyType(query.propertyType))||normalizeAssetType(query.assetType)==='Comercial';
  const amenities=Object.entries(facts.amenities??{}).filter(([key,value])=>{
    if(value!==true)return false;
    if(!commercial)return true;
    const evidence=facts.amenityEvidence?.[key]??{},scope=facts.amenityScopes?.[key];
    return evidence.universal===true||['all','commercial'].includes(scope)||values(evidence.propertyTypes).some(type=>['local','oficina'].includes(normalizePropertyType(type)));
  }).map(([key])=>amenityKey(key));
  if(!selected(amenities,values(query.amenities).map(amenityKey),query.amenitiesAll))return result;
  const words=fold(query.text).split(/\s+/).filter(Boolean).slice(0,30);
  const haystack=fold([project.nombre,record.name,record.slug,facts.region,facts.commune,facts.developer,...amenities,...featureKeys(facts)].filter(Boolean).join(' '));
  if(!words.every(word=>haystack.includes(word)))return result;
  const references=(record.references??[]).filter(reference=>referenceMatches(reference,query,facts));
  const needs=optionNeeded(query,facts);
  // An empty reference set can satisfy only predicates that are all project facts.
  const projectOnly=referenceMatches({attributes:{}},query,facts);
  const matches=references.length>0||!needs&&projectOnly;
  return {...result,matches,references:matches?references:[],matchedReferenceIds:matches?references.map(reference=>reference.id):[]};
}

export const filterCommercialProjects=(records,query={})=>records.map(record=>matchProjectFilters(record,query)).filter(result=>result.matches);
