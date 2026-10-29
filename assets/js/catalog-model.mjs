import {advancedFilterAndSort} from './catalog-filter-engine.mjs?v=20261029-euro-1';
import {catalogReference} from './project-offers.mjs?v=20261029-euro-1';
// Public catalogue facts only. This module never changes source records.
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL');
export const validPrice = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
export const priceFromLabel = (value,decimals=0) => validPrice(value) ? 'Desde UF '+value.toLocaleString('es-CL',{minimumFractionDigits:decimals===2?2:0,maximumFractionDigits:2}) : 'Desde: consultar precio';
export const stages = project => project.inmobiliaria === 'Ecasa' && Array.isArray(project.etapasComerciales) && project.etapasComerciales.length > 1
  ? project.etapasComerciales : Array.isArray(project.etapas) ? project.etapas : [];
export const commercialReference = project => project.inmobiliaria === 'Ecasa' && stages(project).length > 1
  ? stages(project).find(stage => stage.slug === project.etapaReferenciaSlug) : null;
export const projectStates = project => [project.estado, ...stages(project).map(stage => stage.estado)].filter(value => typeof value === 'string' && value.length);
export function assetTypes(project) {
  const explicit=[...(project.tiposActivos??[]),project.tipoActivo].filter(Boolean);
  if(explicit.length)return [...new Set(explicit)];
  // Existing residential typologies establish use, without inventing house/apartment characteristics.
  const typologies=project.tipologias??[];
  const residential=typologies.some(value=>/^(?:Estudio|\d+ dormitorios?)$/i.test(value));
  const commercial=typologies.includes('Local');
  return [...(residential?['Residencial']:[]),...(commercial?['Comercial']:[]),...(residential&&commercial?['Mixto']:[])];
}
export function selectedOffer(project, selectedType='') {
  if(!Array.isArray(project.preciosPorTipologia))return {value:validPrice(project.precioDesdeUF)?project.precioDesdeUF:null,typology:project.precioDesdeTipologia??null};
  const offers=project.preciosPorTipologia.filter(row=>validPrice(row.precioDesdeUF)&&(selectedType==='Comercial'?row.tipologia==='Local':selectedType==='Residencial'?row.tipologia!=='Local':true));
  const lowest=offers.reduce((best,row)=>!best||row.precioDesdeUF<best.precioDesdeUF?row:best,null);
  return {value:lowest?.precioDesdeUF??null,typology:lowest?.tipologia??null};
}
export const projectOffer=(project,state={})=>catalogReference(project,state);
export const searchableValues = project => [...['nombre','inmobiliaria','comuna','region','direccion','slug'].map(key=>project[key]),...stages(project).map(stage=>stage.nombre)];
export function filterAndSort(projects, filters={}) {
  if(filters.version===2)return advancedFilterAndSort(projects,filters);
  const query=normalize((filters.search??'').trim());
  const max=filters.maxPriceInput===''||filters.maxPriceInput==null?null:Number(filters.maxPriceInput);
  const hasMax=max!==null&&Number.isFinite(max)&&max>=0;
  const rows=projects.filter(project=>(!filters.assetType||assetTypes(project).includes(filters.assetType))
    &&(!filters.region||project.region===filters.region)&&(!filters.commune||project.comuna===filters.commune)
    &&(!filters.state||projectStates(project).some(s=>normalize(s)===normalize(filters.state)))
    &&(!hasMax||(validPrice(selectedOffer(project,filters.assetType).value)&&selectedOffer(project,filters.assetType).value<=max))
    &&(!query||searchableValues(project).some(value=>normalize(value).includes(query))));
  if(['price-asc','price-desc'].includes(filters.sortOrder))rows.sort((a,b)=>{
    const av=selectedOffer(a,filters.assetType).value,bv=selectedOffer(b,filters.assetType).value;
    if(!validPrice(av)||!validPrice(bv))return validPrice(av)?-1:validPrice(bv)?1:0;
    return (filters.sortOrder==='price-asc'?1:-1)*(av-bv);
  });
  return rows;
}
export function projectFacts(project, selectedType='') {
  const facts=[];
  const typologies=(project.tipologias?.length?project.tipologias:project._facets?.typologyLabels??[]).filter(t=>!project.preciosPorTipologia||(selectedType==='Comercial'?t==='Local':selectedType==='Residencial'?t!=='Local':true));
  if(typologies.length)facts.push({label:typologies.some(t=>/^Parcelas/.test(t))?'Terreno':'Tipologías',value:typologies.join(' · ')});
  const delivery=project._facets?project._facets.delivery?.label:project.entrega, state=project.estado;
  const duplicateDelivery=delivery&&[normalize(delivery),normalize('Entrega '+delivery)].includes(normalize(state));
  if(state&&!duplicateDelivery)facts.push({label:'Estado',value:state});
  if(delivery)facts.push({label:'Entrega',value:delivery});
  const reference=commercialReference(project);
  if(reference)facts.push({label:'Etapa',value:String(reference.etapa)});
  return facts;
}
export const VIEW_KEY='sollahmsCatalogViewV1';
export const FILTER_KEY='sollahmsCatalogFiltersV1';
export const SESSION_KEY='sollahmsCatalogReturnV1';
export const validView=value=>['cards','list','map'].includes(value);
export function validFilterState(value) {
  const keys=['search','assetType','region','commune','state','maxPriceInput','sortOrder'];
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&value.version===1&&Object.keys(value).length===8
    &&keys.every(key=>typeof value[key]==='string')&&value.search.length<=200&&!/[<>\u0000-\u001f\u007f]/.test(value.search)
    &&['assetType','region','commune','state','sortOrder'].every(key=>value[key].length<=100)
    &&value.maxPriceInput.length<=32&&(value.maxPriceInput===''||(/^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?$/.test(value.maxPriceInput)&&Number.isFinite(Number(value.maxPriceInput))&&Number(value.maxPriceInput)>=0));
}
export function safeReturnFilters(value,projects) {
  if(!validFilterState(value))return null;
  const next={...value},query=normalize(value.search.trim());
  // Only a query found in existing public project facts may enter tab storage.
  // Arbitrary free text and all financial/contact inputs are excluded.
  if(query&&!projects.some(p=>searchableValues(p).some(v=>normalize(v).includes(query))))next.search='';
  for(const [key,allowed] of Object.entries({assetType:projects.flatMap(assetTypes),region:projects.map(p=>p.region),commune:projects.map(p=>p.comuna),state:projects.flatMap(projectStates),sortOrder:['original','price-asc','price-desc']})){
    if(next[key]&&!allowed.includes(next[key]))next[key]=key==='sortOrder'?'original':'';
  }
  return next;
}
