import {matchProjectFilters,queryFromCatalogState,normalizeAmenityKey} from './commercial-filter-engine.mjs';

export const EURO_OWNER_SOURCE_PATH='/data/catalog-euro-owner-quotes.json';
export const EURO_OWNER_SOURCE_SHA256='0e8df1048d5ed5e1c6e2e3fff764d9fd6a4bb8ba78a73dcfc77b6ea108eb2272';
export const EURO_OWNER_ORIGINAL_SOURCE_PATH='data/euro-commercial.json';
export const EURO_OWNER_ORIGINAL_SOURCE_SHA256='21f208654034769b7d4575b798cd6dfbede5b638080cc722512091d2010c4ef2';
const sourceDate='2026-10-29';
const projectionKind='catalog-euro-owner-quotes-v1';
const projectPriceKeys={
  'mapocho-3521':['2','3'],'mapocho-3521-edificio-a':['2','3'],
  'plaza-de-lourdes':['1','2','3'],'rosas-1444':['2'],'diagonal-vicuna':[],
  'santa-elena-1670-mbi':['1','2'],'independencia-4745':['2','local'],
  'froilan-roa-5731-torre-sur':['1','2'],'entre-vicunas':['1','2'],
  'froilan-roa-5731-torre-norte':['1','2'],'edificio-don-pepe-154':['1','2'],
  'guillermo-mann-1401':['2']};
const sources=new WeakSet(),contexts=new WeakSet(),matches=new WeakSet();
const priced=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const present=value=>value!==''&&value!==null&&value!==undefined;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const privateIds=new Set(['terraza-privada','jardin-privado']);
const fail=message=>{throw new TypeError('Euro owner quotes: '+message);};
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const exactKeys=(value,keys)=>object(value)&&Object.keys(value).length===keys.length
  &&keys.every(key=>Object.hasOwn(value,key));
function validateProjection(evidence){
  if(!exactKeys(evidence,['schemaVersion','projectionKind','source','projects'])
    ||evidence.schemaVersion!==1||evidence.projectionKind!==projectionKind
    ||!exactKeys(evidence.source,['type','date','originalPath','originalSHA256'])
    ||evidence.source.type!=='owner-supplied'||evidence.source.date!==sourceDate
    ||evidence.source.originalPath!==EURO_OWNER_ORIGINAL_SOURCE_PATH
    ||evidence.source.originalSHA256!==EURO_OWNER_ORIGINAL_SOURCE_SHA256
    ||!exactKeys(evidence.projects,Object.keys(projectPriceKeys)))fail('projection identity or fields');
  for(const [slug,keys] of Object.entries(projectPriceKeys)){
    const owner=evidence.projects[slug];
    if(!exactKeys(owner,['developer','commune','region','prices','priceStrings','projectFromUF','priceScope'])
      ||owner.developer!=='Euro'||typeof owner.commune!=='string'||!owner.commune.trim()
      ||typeof owner.region!=='string'||!owner.region.trim()
      ||owner.priceScope!=='typology; not a unit offer'
      ||!exactKeys(owner.prices,keys)||!exactKeys(owner.priceStrings,keys)
      ||owner.projectFromUF!==(keys.length?Math.min(...Object.values(owner.prices)):null)
      ||keys.some(key=>!priced(owner.prices[key])||typeof owner.priceStrings[key]!=='string'
        ||!/^\d+(?:\.\d{1,2})?$/.test(owner.priceStrings[key])
        ||Number(owner.priceStrings[key])!==owner.prices[key]))fail('projection project or price fields');
  }
}

/** Load only the pinned public projection; provenance retains the private original. */
export async function parseEuroOwnerSource(text){
  if(typeof text!=='string'||text.length>1000000||!globalThis.crypto?.subtle)fail('invalid source transport');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  const hash=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
  if(hash!==EURO_OWNER_SOURCE_SHA256)fail('source SHA-256 mismatch');
  const evidence=JSON.parse(text);
  validateProjection(evidence);
  const source=freeze({evidence,path:EURO_OWNER_ORIGINAL_SOURCE_PATH,
    sha256:EURO_OWNER_ORIGINAL_SOURCE_SHA256,publicPath:EURO_OWNER_SOURCE_PATH,
    publicSHA256:hash,date:sourceDate});
  sources.add(source);return source;
}
export async function loadEuroOwnerSource(fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=='function')fail('fetch unavailable');
  const response=await fetchImpl(EURO_OWNER_SOURCE_PATH,{signal:AbortSignal.timeout(10000),credentials:'same-origin',redirect:'error'});
  if(!response?.ok)fail('source unavailable');
  return parseEuroOwnerSource(await response.text());
}

const candidate=project=>project.inmobiliaria==='Euro'&&project.commercialSource?.file==='data/euro-commercial.json';
const labelFor=key=>key==='local'?'Local comercial':key==='1'?'1 dormitorio':key+' dormitorios';
function identity(project){return {slug:project.slug,nombre:project.nombre,direccion:project.direccion,
  inmobiliaria:project.inmobiliaria,comuna:project.comuna,region:project.region};}
function sameIdentity(project,registered){return Object.keys(registered).every(key=>project[key]===registered[key]);}
function projectAmenities(project){
  const amenities={},amenityScopes={};
  for(const feature of project._facets?.features??[]){
    if(typeof feature?.id!=='string'||privateIds.has(feature.id))continue;
    const key=normalizeAmenityKey(feature.id);amenities[key]=true;
    if(['residential','commercial','all','Residencial','Comercial','Terreno'].includes(feature.scope))amenityScopes[key]=feature.scope;
  }
  return {amenities,amenityScopes};
}
function recordForSource(project,source){
  const owner=source.evidence.projects[project.slug],commercial=project.commercialSource;
  if(!object(owner)||owner.developer!=='Euro'||owner.commune!==project.comuna||owner.region!==project.region
    ||commercial.type!=='owner-supplied'||commercial.date!==source.date
    ||!['confirmed','pending'].includes(commercial.priceStatus)
    ||owner.priceScope!=='typology; not a unit offer'||!object(owner.prices)
    ||project.precioDesdeUF!==owner.projectFromUF)return null;
  const entries=Object.entries(owner.prices);
  if(commercial.priceStatus!==(entries.length?'confirmed':'pending'))return null;
  const references=[];
  for(const [key,value] of entries){
    if(!/^(?:[1-9]\d?|local)$/.test(key)||!priced(value))return null;
    const tableLabel=key==='local'?'Local':labelFor(key);
    if(!(project.preciosPorTipologia??[]).some(row=>row.tipologia===tableLabel&&row.precioDesdeUF===value))return null;
    const local=key==='local';
    references.push({id:project.slug+':owner-price:'+key,label:labelFor(key),
      sourceKind:'owner-euro-typology',sourceDate:source.date,sourcePath:source.path,
      sourcePointer:'/projects/'+project.slug+'/prices/'+key,sourceSHA256:source.sha256,
      publicSourcePath:source.publicPath,publicSourceSHA256:source.publicSHA256,
      scope:owner.priceScope,stock:null,availability:null,unit:null,model:null,notOffer:true,
      priceDecimals:String(owner.priceStrings?.[key]??'').includes('.')?2:0,
      attributes:{priceUF:value,bedrooms:local?null:Number(key),
        // The literal owner key local establishes that product. A bedroom
        // category never adopts the importer's apartment/residential defaults.
        propertyType:local?'local':null,assetType:local?'Comercial':null,
        typology:local?'local':key+'d',bathrooms:null,usefulM2:null,totalM2:null,interiorM2:null,
        terraceM2:null,gardenM2:null,landM2:null,privateTerrace:null,privateGarden:null,
        parkingIncluded:null,parkingAvailable:null,storageIncluded:null,storageAvailable:null}});
  }
  return freeze({slug:project.slug,name:project.nombre,sourceLayer:'published-owner-euro-quotes',
    sourceProject:identity(project),asOf:source.date,notOffer:true,
    projectFacts:{region:project.region,commune:project.comuna,developer:'Euro',
      // Mixto is an explicit project class, not an inferred use of a quotation.
      assetTypes:project.tiposActivos?.includes('Mixto')?['Mixto']:[],...projectAmenities(project)},references});
}
function attach(project,status,record=null){
  const context=freeze({status,identity:identity(project),record});contexts.add(context);
  return {...project,_euroOwnerQuoteContext:context};
}
export function bindEuroOwnerQuotes(projects,source){
  if(!Array.isArray(projects)||!sources.has(source))fail('verified source required');
  return projects.map(project=>{
    if(!candidate(project))return project;
    const record=recordForSource(project,source);
    return attach(project,record?'ready':'unavailable',record);
  });
}
export const unavailableEuroOwnerQuotes=projects=>projects.map(project=>candidate(project)?attach(project,'unavailable'):project);
function context(project){
  const current=project._euroOwnerQuoteContext;
  return project.inmobiliaria==='Euro'&&current&&contexts.has(current)?current:null;
}
function record(project){const current=context(project);return current?.status==='ready'&&sameIdentity(project,current.identity)?current.record:null;}
export const euroOwnerQuoteLoadFailed=project=>context(project)?.status==='unavailable';
export function usesEuroOwnerQuotes(project,state={}){
  return !!context(project)&&(!state.evidenceMode||state.evidenceMode==='published')
    &&(present(state.minPriceInput)||present(state.maxPriceInput));
}
const queryKey=state=>JSON.stringify(queryFromCatalogState(state));
export function matchEuroOwnerQuotes(project,state={}){
  if(!usesEuroOwnerQuotes(project,state))return null;
  const current=record(project),query=queryFromCatalogState(state);
  // Existing registered-project/stage selectors retain their catalogue path.
  for(const key of ['region','commune','developers','state','delivery'])delete query[key];
  query.features=[];
  const match=matchProjectFilters(current,query);
  const references=match.references.filter(reference=>matchProjectFilters({...current,references:[reference]},
    {amenities:state.features??[],amenitiesAll:state.featuresAll===true}).matches);
  const result=freeze({...match,matches:references.length>0,references,
    matchedReferenceIds:references.map(reference=>reference.id),queryKey:queryKey(state)});
  matches.add(result);return result;
}
function currentMatch(project,state,provided=project._euroOwnerQuoteMatch){
  return provided&&matches.has(provided)&&provided.record===record(project)&&provided.queryKey===queryKey(state)?provided:matchEuroOwnerQuotes(project,state);
}
function witness(project,state,provided){
  const references=currentMatch(project,state,provided)?.references??[];
  return references.reduce((best,reference)=>!best||reference.attributes.priceUF<best.attributes.priceUF?reference:best,null);
}
export function euroOwnerQuoteOffer(project,state={},provided){
  if(!usesEuroOwnerQuotes(project,state))return null;
  const reference=witness(project,state,provided),value=reference?.attributes.priceUF??null,typology=reference?.label??null;
  return {value,typology,euroOwnerQuote:true,date:reference?.sourceDate??null,
    propertyType:reference?.attributes.propertyType??null,
    referenceId:reference?.id??null,priceDecimals:reference?.priceDecimals??0,
    financialBaselineCompatible:priced(value)&&value===project.precioDesdeUF
      &&typeof typology==='string'&&typology===project.precioDesdeTipologia};
}
export function euroOwnerQuoteFeatureIds(project,state={},provided){
  const match=currentMatch(project,state,provided),reference=witness(project,state,match);
  if(!reference)return [];
  return (project._facets?.features??[]).filter(feature=>!privateIds.has(feature.id)
    &&matchProjectFilters({...match.record,references:[reference]},{amenities:[feature.id]}).matches).map(feature=>feature.id);
}
