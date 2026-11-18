import {matchProjectFilters,queryFromCatalogState,normalizePropertyType,normalizeAmenityKey} from './commercial-filter-engine.mjs';

// This separate projection never rewrites the 131 published identities/prices.
export const CATALOG_EXPANSION_URL='/data/catalog-expansion-iris-20261118.json';
export const CATALOG_EXPANSION_SOURCE_SHA256='33ca3e27f847eca939e8ce3ce9032328a9288c1ff38ed12cf4cd6eddbe3401bb';
export const CATALOG_EXPANSION_FAILURE='Los 21 proyectos nuevos de Iris no pudieron validarse. Se conservan los 131 proyectos del catálogo anterior; la ampliación no está disponible.';
const allowedIds=new Set(['299','315','1549','1556','1557','1558','1559','1560','1561','1562','1563','1566','1573','1575','1579','1582','1585','1586','1588','1589','1590']);
const ownerPrices={'1549':{'0':2050,'1':2190,'2':2600,'3':4280},'315':{'2':4550}};
const sources=new WeakSet(),contexts=new WeakSet(),matches=new WeakSet();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.trim().length>0;
const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const priced=v=>number(v)&&v>0;
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CL').trim();
const fail=message=>{throw new TypeError('Catalog expansion: '+message);};
const require=(condition,message)=>{if(!condition)fail(message);};
const clone=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function keys(v,allowed,label){require(object(v)&&Object.keys(v).every(k=>allowed.includes(k)),'unexpected '+label+' field');}
function nullable(v,label){require(v===null,'unknown '+label+' must stay null');}
function timestamp(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));}
function irisURL(v,id){try{const u=new URL(v);return u.origin==='https://iris.yapo.cl'&&u.pathname==='/proyecto/'+id&&!u.hash&&!u.username&&!u.password&&[...u.searchParams].every(([k,val])=>k==='operation'&&val==='Venta');}catch{return false;}}
const canonical=p=>p===null||normalizePropertyType(p)===p;
const nullOptionKeys=['bathrooms','usefulM2','totalM2','interiorM2','terraceM2'];
function delivery(literal){
  const label=text(literal)?literal:null;if(!label)return null;
  if(/^inmediata$/i.test(label))return {category:'immediate',immediate:true,label,reported:true};
  const years=label.match(/\b20\d{2}\b/g);return years?.length===1?{category:'estimated',year:Number(years[0]),label,reported:true}:null;
}
const safeMedia=p=>p===null||typeof p==='string'&&/^\/assets\/[a-z0-9/._-]+\.(?:webp|avif|jpe?g|png|svg)$/i.test(p)&&!p.split('/').includes('..');

function validateUnit(r,id,ids){
  keys(r,['id','sourceKind','sourceURL','observedAtUTC','sourceDocumentDate','stock','availability','notOffer','scope','attributes','surfaceEvidence','sourcePriceKind','sourceLabel','priceField','priceKind','listPriceUF','finalPriceUF','priceValidityConfirmed','financialBaselineCompatible'],'exact reference');
  require(text(r.id)&&/^[a-z0-9:_-]{8,100}$/i.test(r.id)&&!ids.has(r.id),'invalid or duplicate exact reference');ids.add(r.id);
  require(r.sourceKind==='IRIS_EXACT_UNIT'&&irisURL(r.sourceURL,id)&&timestamp(r.observedAtUTC),'exact reference source');
  nullable(r.sourceDocumentDate,'source date');nullable(r.stock,'stock');
  if(own(r,'availability'))nullable(r.availability,'availability');
  require(!own(r,'notOffer')||r.notOffer===true,'exact reference is not an active offer');
  const a=r.attributes;
  keys(a,['propertyType','priceUF','bedrooms','bathrooms','usefulM2','totalM2','interiorM2','terraceM2','internalM2'],'exact attributes');
  require(canonical(a.propertyType),'exact property type');
  require(a.priceUF===null||priced(a.priceUF),'exact price');
  require(['listPriceUF','finalPriceUF'].includes(r.priceField)&&r.priceKind===(r.priceField==='listPriceUF'?'listPrice':'finalPrice')&&a.priceUF===r[r.priceField],'price must come from its own labelled field');
  require((r.listPriceUF===null||priced(r.listPriceUF))&&(r.finalPriceUF===null||priced(r.finalPriceUF))&&r.priceValidityConfirmed===false&&r.financialBaselineCompatible===false,'external reference price/validity');
  for(const k of ['bedrooms','bathrooms'])require(a[k]===null||Number.isInteger(a[k])&&a[k]>=0&&a[k]<=20,'exact room count');
  // Free-text Estudio is not an explicit zero-bedroom count in this source.
  require(a.bedrooms!==0,'Iris studio cannot manufacture zero bedrooms');
  for(const k of ['usefulM2','totalM2','interiorM2','terraceM2','internalM2']){
    require(a[k]==null||number(a[k]),'exact area');
    if(a[k]==null)continue;
    const e=r.surfaceEvidence?.[k],label=fold(e?.sourceLabel).replace(/\./g,'').replace(/\s+/g,' ');
    const labels={usefulM2:['superficie util','superficie util depto','sup util','sup util depto','util'],totalM2:['superficie total','sup total','total'],interiorM2:['superficie interior','sup interior','interior'],terraceM2:['superficie terraza','sup terraza','terraza','sup de terraza'],internalM2:['internos']};
    require(object(e)&&labels[k].includes(label)&&e.valueM2===a[k]&&e.unit==='m²'&&e.explicitlyPrinted===true&&e.calculated===false,'area needs its own printed label');
    require(!['usefulM2','totalM2','interiorM2'].includes(k)||['departamento','casa'].includes(a.propertyType),'residential area needs explicit product scope');
  }
}

/** Critical scope validation is independent of the transport hash. */
export function validateCatalogExpansion(source){
  keys(source,['schemaVersion','kind','asOf','country','projects','policy'],'source');
  require(source.schemaVersion===1&&source.kind==='CATALOG_EXPANSION_IRIS_CHILE_LOCAL_CANDIDATE'&&source.country==='Chile'&&/^\d{4}-\d{2}-\d{2}$/.test(source.asOf),'source identity');
  require(source.policy?.availableStockCertified===false&&source.policy.financialBaselineCompatible===false&&source.policy.referencesMayBeJoined===false,'source policy');
  require(Array.isArray(source.projects)&&source.projects.length===21,'exactly 21 approved projects');
  const ids=new Set(),slugs=new Set(),referenceIds=new Set();
  for(const p of source.projects){
    keys(p,['slug','identity','source','projectFacts','externalIris','headerBedroomProfile','unclassifiedSurfaceSummary','commonAmenities','ownerReferences','exactUnitReferences','media','location','detailUrl','financialBaselineCompatible','unclassifiedSummaryDoesNotProvideTypedAreas'],'project');
    require(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&p.slug.length<=100&&!slugs.has(p.slug),'project slug');slugs.add(p.slug);
    const i=p.identity,s=p.source,id=String(s?.projectId);
    require(allowedIds.has(id)&&!ids.has(id),'unapproved or duplicate project ID');ids.add(id);
    require(s.kind==='IRIS'&&irisURL(s.projectUrl,id)&&timestamp(s.observedAtUTC)&&s.sourceDocumentDate===null,'project source');
    require(i?.country==='Chile'&&['name','developer','commune','region'].every(k=>text(i[k]))&&(i.address===null||text(i.address))&&canonical(i.propertyType),'project identity fields');
    require(p.detailUrl==='/'+p.slug+'.html'&&p.financialBaselineCompatible===false&&p.unclassifiedSummaryDoesNotProvideTypedAreas===true,'public/financial scope');
    const f=p.projectFacts;
    require(f?.propertyType===i.propertyType&&f.developer===i.developer&&f.commune===i.commune&&f.region===i.region&&f.legalDeliveryCertified===false&&f.stock===null,'identity facts binding');
    require(f.state===null||text(f.state)&&['OWNER_EXISTING','IRIS_EXPLICIT'].includes(f.stateSourceKind),'project state needs an explicit source');
    const e=p.externalIris;
    require(e?.notOwnerPrice===true&&e.stock===null&&e.sourceDocumentDate===null&&e.correlatedWithBedroomOrSurfaceSummary===false&&irisURL(e.sourceURL,id)&&timestamp(e.observedAtUTC),'external price scope');
    require(e.projectFromPriceUF===null||priced(e.projectFromPriceUF),'external price must be numeric or null');
    const h=p.headerBedroomProfile;
    require(h?.correlatedWithPrice===false&&h.rangeExpandedToCategories===false&&h.bathrooms===null&&irisURL(h.sourceURL,id)&&timestamp(h.observedAtUTC),'header is not a price/room tuple');
    if(h.bedroomsExact!==null){const m=/^(\d+)\s+dormitorios?$/i.exec(h.literal??'');require(m&&Number(m[1])===h.bedroomsExact&&Number.isInteger(h.bedroomsExact)&&h.bedroomsExact>0,'header range cannot expand into bedrooms');}
    const u=p.unclassifiedSurfaceSummary;
    require(object(u)&&['usefulM2','totalM2','interiorM2','terraceM2'].every(k=>u[k]===null),'generic area cannot become a typed surface');
    const c=p.commonAmenities;
    require(Array.isArray(c?.literals)&&c.literals.every(text)&&c.scope==='project-general'&&c.privateOrUnitAssignment===false&&irisURL(c.sourceURL,id),'common amenity scope');
    for(const k of ['parkingIncluded','parkingAvailable','storageIncluded','storageAvailable'])nullable(c[k],k);
    if(c.descriptors!==undefined)require(Array.isArray(c.descriptors)&&c.descriptors.every(d=>text(d.label)&&Array.isArray(d.filterIds)&&d.filterIds.every(text)),'amenity descriptors');
    require(Array.isArray(p.ownerReferences)&&Array.isArray(p.exactUnitReferences),'references arrays');
    const ownerKeys=new Set();
    for(const r of p.ownerReferences){
      keys(r,['categoryKey','label','priceUF','bedrooms','bathrooms','usefulM2','totalM2','interiorM2','terraceM2','sourceKind','sourceLabel','sourceContextDate','sourceDocumentDate','dateKind','stock','scope','modelAssociation','unitAssociation','newOwnerConfirmation','financialBaselineCompatible'],'owner reference');
      const key=String(r.categoryKey),expected=ownerPrices[id]?.[key];
      require(expected!==undefined&&r.priceUF===expected&&!ownerKeys.has(key),'owner source/category authority');ownerKeys.add(key);
      require(r.sourceKind==='OWNER_EXISTING'&&r.sourceContextDate==='2026-10-30'&&r.sourceDocumentDate===null&&r.stock===null&&r.newOwnerConfirmation===false&&r.financialBaselineCompatible===false,'owner scope/date');
      require(r.bedrooms===(key==='0'?null:Number(key))&&nullOptionKeys.every(k=>r[k]===null)&&r.modelAssociation===null&&r.unitAssociation===null,'owner categories cannot borrow model facts');
    }
    require(ownerKeys.size===Object.keys(ownerPrices[id]??{}).length,'preserve existing owner categories');
    for(const r of p.exactUnitReferences)validateUnit(r,id,referenceIds);
    require(safeMedia(p.media?.coverPath)&&safeMedia(p.media?.logoPath),'media path');
    require(p.location?.latitude===null&&p.location.longitude===null,'no unverified coordinates');
  }
  require(ids.size===allowedIds.size,'approved ID set');return source;
}

export async function parseCatalogExpansion(text,{sourceSHA256=CATALOG_EXPANSION_SOURCE_SHA256,cryptoImpl=globalThis.crypto}={}){
  require(typeof text==='string'&&text.length>0&&text.length<2000000&&/^[a-f0-9]{64}$/.test(sourceSHA256)&&cryptoImpl?.subtle,'source transport/pin');
  const digest=await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(text));
  const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');require(hash===sourceSHA256,'source SHA-256 mismatch');
  const source=freeze({evidence:clone(validateCatalogExpansion(JSON.parse(text))),sha256:hash});sources.add(source);return source;
}
export async function loadCatalogExpansion(fetchImpl=globalThis.fetch){
  require(typeof fetchImpl==='function','fetch unavailable');
  const response=await fetchImpl(CATALOG_EXPANSION_URL,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(10000)});
  require(response?.ok===true&&response.redirected!==true,'source unavailable');return parseCatalogExpansion(await response.text());
}

const identity=p=>Object.fromEntries(['slug','nombre','inmobiliaria','comuna','region','direccion','detalleUrl'].map(k=>[k,p[k]??null]));
function context(p){const c=p?._catalogExpansion;return c&&contexts.has(c)&&Object.entries(c.identity).every(([k,v])=>(p[k]??null)===v)?c:null;}
export const isCatalogExpansionProject=p=>!!context(p);
export const hasCatalogExpansionMarker=p=>!!p&&own(p,'_catalogExpansion');
const attr=input=>({priceUF:null,propertyType:null,assetType:null,bedrooms:null,bathrooms:null,usefulM2:null,totalM2:null,interiorM2:null,terraceM2:null,privateTerrace:null,privateGarden:null,parkingIncluded:null,parkingAvailable:null,storageIncluded:null,storageAvailable:null,...input});
function normalizedReferences(input){
  const id=String(input.source.projectId),references=[],metadata={};
  const ownerPricePolicy=input.ownerReferences.length>0;
  const add=(key,attributes,origin,extra={})=>{references.push({id:key,sourceKind:'catalog-expansion-reference',stock:null,notOffer:true,attributes:attr(attributes)});metadata[key]={origin,...extra};};
  // The portal's project block explicitly carries its own product/from-price.
  // Its type never migrates to a separate unit, owner category or room profile.
  if(priced(input.externalIris.projectFromPriceUF))add('iris-from:'+id,{priceUF:ownerPricePolicy?null:input.externalIris.projectFromPriceUF,propertyType:input.identity.propertyType},'iris-project-from',{sourceURL:input.externalIris.sourceURL,date:input.externalIris.observedAtUTC,priceMaskedByOwnerPolicy:ownerPricePolicy});
  if(input.identity.propertyType)add('iris-type:'+id,{propertyType:input.identity.propertyType},'iris-project-type',{sourceURL:input.source.projectUrl,date:input.source.observedAtUTC});
  if(input.headerBedroomProfile.bedroomsExact!==null)add('iris-header:'+id,{bedrooms:input.headerBedroomProfile.bedroomsExact},'iris-header-profile',{sourceURL:input.headerBedroomProfile.sourceURL,date:input.headerBedroomProfile.observedAtUTC});
  for(const r of input.ownerReferences)add('owner-category:'+id+':'+r.categoryKey,{priceUF:r.priceUF,bedrooms:r.bedrooms},'owner-existing',{label:r.label,date:r.sourceContextDate});
  for(const r of input.exactUnitReferences)add(r.id,{...r.attributes,priceUF:ownerPricePolicy?null:r.attributes.priceUF},'iris-exact-reference',{sourceURL:r.sourceURL,date:r.observedAtUTC,sourcePriceKind:r.priceKind??r.sourcePriceKind??null,priceMaskedByOwnerPolicy:ownerPricePolicy});
  return {references,metadata};
}
function amenityFacts(input){
  const amenities={},amenityEvidence={};
  // Only taxonomy-reviewed descriptors can create filter predicates. Original
  // literals remain in the source projection and never become private rights.
  for(const d of input.commonAmenities.descriptors??[])for(const id of d.filterIds){const key=normalizeAmenityKey(id);amenities[key]=true;if(canonical(input.commonAmenities.propertyTypeScope)&&input.commonAmenities.propertyTypeScope)amenityEvidence[key]={propertyTypes:[input.commonAmenities.propertyTypeScope]};}
  return {amenities,amenityEvidence};
}
export function appendCatalogExpansion(publishedProjects,source){
  require(Array.isArray(publishedProjects)&&sources.has(source),'verified source and catalogue required');
  const slugs=new Set(publishedProjects.map(p=>p.slug));require(slugs.size===publishedProjects.length,'duplicate existing identity');
  const additions=source.evidence.projects.map(input=>{
    require(!slugs.has(input.slug),'new/existing identity collision');slugs.add(input.slug);
    const {references,metadata}=normalizedReferences(input),reportedDelivery=delivery(input.projectFacts.deliveryLiteral),property=input.identity.propertyType;
    const p={slug:input.slug,nombre:input.identity.name,inmobiliaria:input.identity.developer,comuna:input.identity.commune,region:input.identity.region,direccion:input.identity.address,detalleUrl:input.detailUrl,
      precioDesdeUF:null,precioDesdeTipologia:null,tipologias:[],tipoActivo:null,estado:input.projectFacts.state,entrega:input.projectFacts.deliveryLiteral,
      imagenPrincipal:input.media.coverPath,imagenAlt:input.media.coverAlt??'Imagen del proyecto '+input.identity.name,amenities:[]};
    const record={slug:p.slug,name:p.nombre,sourceLayer:'catalog-expansion-iris',notOffer:true,sourceProject:{slug:p.slug,nombre:p.nombre,direccion:p.direccion},
      projectFacts:{region:p.region,commune:p.comuna,developer:p.inmobiliaria,state:p.estado,delivery:reportedDelivery,...amenityFacts(input)},references};
    const c=freeze({identity:identity(p),record,metadata,input,sourceSHA256:source.sha256});contexts.add(c);
    p._catalogExpansion=c;
    p._facets={propertyTypes:property?[property]:[],propertyLabels:property?[property]:[],assetTypes:[],states:p.estado?[p.estado]:[],delivery:reportedDelivery??{},
      variants:references.map(r=>({...r.attributes,areas:{...(r.attributes.usefulM2===null?{}:{util:r.attributes.usefulM2}),...(r.attributes.totalM2===null?{}:{total:r.attributes.totalM2})}})),
      features:(input.commonAmenities.descriptors??[]).flatMap(d=>d.filterIds.map(id=>({id,label:d.label,scope:input.commonAmenities.scope,propertyTypeScope:input.commonAmenities.propertyTypeScope})))};
    return p;
  });return [...publishedProjects,...additions];
}

const key=state=>JSON.stringify([queryFromCatalogState(state),state.purchaseModes??[],...['unit','model','stock','availability'].map(k=>state[k]??null)]);
export function matchCatalogExpansion(project,state={}){
  const c=context(project);if(!c)return null;
  // This source records property labels, not an explicit asset-use class.
  // Do not let the shared evaluator derive Residencial from Casa/Departamento.
  if(state.assetType!==undefined&&state.assetType!==null&&state.assetType!==''){
    const match={matches:false,record:c.record,project:c.record.sourceProject,references:[],matchedReferenceIds:[],issues:[],queryKey:key(state)};matches.add(match);return match;
  }
  const query=queryFromCatalogState(state);query.features=[];
  const result=matchProjectFilters(c.record,query);
  const references=result.references.filter(r=>matchProjectFilters({...c.record,references:[r]},
    {amenities:state.features??[],amenitiesAll:state.featuresAll===true}).matches);
  const unsupported=['unit','model','stock','availability'].some(k=>state[k]!==undefined&&state[k]!==null&&state[k]!=='');
  const matched=!unsupported&&!state.purchaseModes?.length&&result.matches&&(references.length>0||result.references.length===0&&!state.features?.length);
  const match={...result,matches:matched,references:matched?references:[],matchedReferenceIds:matched?references.map(r=>r.id):[],queryKey:key(state)};matches.add(match);return match;
}
function currentMatch(p,state){const c=context(p),m=p?._catalogExpansionMatch;return c&&m&&matches.has(m)&&m.record===c.record&&m.queryKey===key(state)?m:matchCatalogExpansion(p,state);}
export function catalogExpansionWitness(project,state={}){
  const c=context(project),refs=currentMatch(project,state)?.references??[];if(!c||!refs.length)return null;
  const priority={'owner-existing':0,'iris-exact-reference':1,'iris-project-from':2};
  const prices=refs.filter(r=>priced(r.attributes.priceUF));
  if(prices.length)return [...prices].sort((a,b)=>(priority[c.metadata[a.id].origin]??9)-(priority[c.metadata[b.id].origin]??9)||a.attributes.priceUF-b.attributes.priceUF)[0];
  return refs.reduce((a,b)=>Object.values(a.attributes).filter(v=>v!==null).length>=Object.values(b.attributes).filter(v=>v!==null).length?a:b);
}
export function catalogExpansionOffer(project,state={}){
  const c=context(project);if(!c)return null;
  const r=catalogExpansionWitness(project,state),m=r?c.metadata[r.id]:null;
  return {value:r?.attributes.priceUF??null,typology:m?.label??null,referenceId:r?.id??null,expansion:true,financialBaselineCompatible:false,
    sourceLabel:m?.origin==='owner-existing'?'Referencia del propietario':'Referencia Iris',sourceURL:m?.sourceURL??(r?null:c.input.source.projectUrl),date:m?.date??(r?null:c.input.source.observedAtUTC),origin:m?.origin??null,externalPriceMaskedByOwnerPolicy:m?.priceMaskedByOwnerPolicy===true};
}
export function catalogExpansionPriceLabel(project,state={}){
  const offer=catalogExpansionOffer(project,state);if(!priced(offer?.value))return offer?.externalPriceMaskedByOwnerPolicy?'Sin precio del propietario vinculado a este perfil':'Sin precio vinculado a esta referencia';
  const value=offer.value.toLocaleString('es-CL',{maximumFractionDigits:2});
  return offer.origin==='owner-existing'?'Referencia del propietario UF '+value:offer.origin==='iris-project-from'?'Referencia Iris desde UF '+value:'Referencia Iris UF '+value;
}
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10).split('-').reverse().join('/'):'';
export function catalogExpansionSourceLabel(project,state={}){const o=catalogExpansionOffer(project,state);return o?[o.origin==='owner-existing'?'Propietario':'Iris',day(o.date)?(o.origin==='owner-existing'?'contexto ':'consulta ')+day(o.date):null].filter(Boolean).join(' · '):'';}
export function catalogExpansionNote(project,state={}){const o=catalogExpansionOffer(project,state);return o?.externalPriceMaskedByOwnerPolicy?'La campaña Iris no sustituye el precio del propietario. No se combinan perfiles distintos.':o?.origin==='iris-project-from'?'Precio desde externo; sin asociación a tipología o superficie. Vigencia y disponibilidad por confirmar.':'Vigencia y disponibilidad por confirmar; no acredita stock.';}
export function catalogExpansionFacts(project,state={}){
  const c=context(project),a=catalogExpansionWitness(project,state)?.attributes??{},facts=[];if(!c)return facts;
  if(a.bedrooms!==null&&a.bedrooms!==undefined||a.bathrooms!==null&&a.bathrooms!==undefined)facts.push({label:'Perfil de la referencia',value:[a.bedrooms==null?null:a.bedrooms+'D',a.bathrooms==null?null:a.bathrooms+'B'].filter(Boolean).join(' / ')});
  for(const [k,label] of [['usefulM2','Superficie útil'],['totalM2','Superficie total'],['interiorM2','Superficie interior'],['terraceM2','Terraza de la referencia'],['internalM2','Internos (rótulo Iris)']])if(number(a[k]))facts.push({label,value:a[k].toLocaleString('es-CL')+' m²'});
  if(c.record.projectFacts.state)facts.push({label:c.input.projectFacts.stateSourceKind==='OWNER_EXISTING'?'Estado informado por el propietario':'Estado informado por Iris',value:c.record.projectFacts.state});
  if(c.record.projectFacts.delivery?.label)facts.push({label:c.input.projectFacts.deliverySourceKind==='OWNER_EXISTING'?'Entrega informada por el propietario':'Entrega informada por Iris',value:c.record.projectFacts.delivery.label});return facts;
}
export function catalogExpansionMatchedLabels(project,state={}){
  const c=context(project),r=catalogExpansionWitness(project,state);if(!c||!r)return [];
  const selected=new Set([...(state.amenities??[]),...(state.features??[])]);
  return [...new Set((c.input.commonAmenities.descriptors??[]).filter(d=>d.filterIds.some(id=>selected.has(id)&&matchProjectFilters({...c.record,references:[r]},{amenities:[id]}).matches)).map(d=>d.label))];
}
/** Never pass an unregistered new project into the financial scenario cache. */
export const publishedFinancialProjects=projects=>projects.filter(p=>!hasCatalogExpansionMarker(p));
export function onlyExpansionResults(projects,results,developers=[]){
  return results.length>0?results.every(hasCatalogExpansionMarker):developers.length>0&&!publishedFinancialProjects(projects).some(p=>developers.includes(p.inmobiliaria));
}
export function sortWithPublishedFinancials(projects,sorter){
  const base=publishedFinancialProjects(projects),unknown=projects.filter(hasCatalogExpansionMarker);if(base.length)sorter?.(base);return [...base,...unknown];
}
