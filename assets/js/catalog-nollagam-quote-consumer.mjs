import {createNollagamOwnerQuoteLayer,NOLLAGAM_OWNER_SOURCE_PATH} from './catalog-nollagam-owner-quotes.mjs';
import {matchProjectFilters,queryFromCatalogState} from './commercial-filter-engine.mjs';
import {metroMatches} from './metro-model.mjs';

export const NOLLAGAM_OWNER_SOURCE_SHA256='d3a2ae475efb7f070a8ca09e7d526cdf13d678ebbc002fd9f69019cf3ea5a27b';
export const NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH='/data/catalog-nollagam-owner-quotes.json';
export const NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256='12412065e8aa418b148795ca1af2cf5edbdd67a583de0f2569256cd953051eee';
const projectionKind='catalog-nollagam-owner-quotes';
const sourceDate='2026-10-28';
const priceSource='Tabla proporcionada por el propietario de Sollahms; prevalece sobre campañas del proveedor';
const priceKeys=new Map([
  ['edificio-liverpool',['2','3']],['barrio-zenteno',['1','2','3']],
  ['alto-goycolea',['0','1','2']],['edificio-santa-maria',['1','2','3']],
  ['eleuterio-ramirez',['2','3']],['costanera-coquimbo-a',['2','3']],['costanera-coquimbo-b',['2','3']],
]);
const slugs=[...priceKeys.keys()];
const knownSlugs=new Set(slugs),trustedContexts=new WeakSet();
const present=value=>value!==undefined&&value!==null&&value!=='';
const priced=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const identityKeys=['slug','nombre','inmobiliaria','comuna','region','direccion'];
const failure=code=>{const error=new Error(code);error.code=code;throw error;};
const exactKeys=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)
  &&[Object.prototype,null].includes(Object.getPrototypeOf(value))
  &&Reflect.ownKeys(value).length===keys.length&&Reflect.ownKeys(value).every(key=>keys.includes(key));

/** Independent of the byte pin: a later pin cannot authorize extra raw fields. */
export function validateNollagamOwnerQuoteProjection(source){
  if(!exactKeys(source,['schemaVersion','projectionKind','originalSourcePath','originalSourceSHA256',
    'checkedOn','priceSource','projects'])||source.schemaVersion!==1||source.projectionKind!==projectionKind
    ||source.originalSourcePath!==NOLLAGAM_OWNER_SOURCE_PATH||source.originalSourceSHA256!==NOLLAGAM_OWNER_SOURCE_SHA256
    ||source.checkedOn!==sourceDate||source.priceSource!==priceSource||!exactKeys(source.projects,slugs)){
    failure('source-schema-invalid');
  }
  for(const [slug,keys] of priceKeys){
    const project=source.projects[slug];
    if(!exactKeys(project,['prices'])||!exactKeys(project.prices,keys)
      ||!Object.values(project.prices).every(priced))failure('source-schema-invalid');
  }
  return source;
}

export const isNollagamQuoteProject=project=>knownSlugs.has(project?.slug);

function unavailableContext(slug,reason='source-unavailable'){
  return Object.freeze({status:'unavailable',slug,reason,record:null,
    source:Object.freeze({path:NOLLAGAM_OWNER_SOURCE_PATH,sha256:NOLLAGAM_OWNER_SOURCE_SHA256,date:null,
      publicSourcePath:NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH,publicSourceSHA256:NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256})});
}
function unavailableLayer(reason){
  return Object.freeze({status:'unavailable',bySlug:Object.freeze(Object.fromEntries(
    slugs.map(slug=>[slug,unavailableContext(slug,reason)])))});
}

/** Fetch only the public allowlist projection; the original path is provenance. */
export async function loadNollagamOwnerQuoteContexts(publishedProjects,{fetchImpl=globalThis.fetch,cryptoImpl=globalThis.crypto}={}){
  try{
    if(typeof fetchImpl!=='function'||!cryptoImpl?.subtle?.digest)failure('loader-unavailable');
    const response=await fetchImpl(NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH,
      {cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(10000)});
    if(response?.ok!==true||response.redirected===true)failure('source-unavailable');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!bytes.length||bytes.byteLength>100000)failure('source-size-invalid');
    const digest=await cryptoImpl.subtle.digest('SHA-256',bytes);
    const sha256=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
    if(sha256!==NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256)failure('source-pin-mismatch');
    const source=validateNollagamOwnerQuoteProjection(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
    const layer=createNollagamOwnerQuoteLayer(publishedProjects,source);
    const bySlug={};
    for(const normalized of layer.records){
      const references=normalized.references.map(reference=>Object.freeze({...reference,
        sourceSHA256:NOLLAGAM_OWNER_SOURCE_SHA256,publicSourcePath:NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH,
        publicSourceSHA256:sha256}));
      const record=Object.freeze({...normalized,references:Object.freeze(references)});
      const context=Object.freeze({status:'ready',slug:record.slug,record,
        source:Object.freeze({...layer.source,sha256:NOLLAGAM_OWNER_SOURCE_SHA256,
          publicSourcePath:NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH,publicSourceSHA256:sha256})});
      trustedContexts.add(context);bySlug[record.slug]=context;
    }
    return Object.freeze({status:'ready',bySlug:Object.freeze(bySlug)});
  }catch(error){
    const code=['loader-unavailable','source-unavailable','source-size-invalid','source-pin-mismatch','source-schema-invalid'].includes(error?.code)
      ?error.code:'source-invalid';
    return unavailableLayer(code);
  }
}

/** An invalid bound context cannot fall back for an active price. */
export function nollagamOwnerQuoteContext(project){
  if(!isNollagamQuoteProject(project))return null;
  const context=Object.hasOwn(project,'_nollagamOwnerQuoteContext')?project._nollagamOwnerQuoteContext:null;
  const record=context?.record;
  if(context?.status==='ready'&&trustedContexts.has(context)&&context.slug===project.slug
    &&context.source?.sha256===NOLLAGAM_OWNER_SOURCE_SHA256
    &&context.source.publicSourcePath===NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH
    &&context.source.publicSourceSHA256===NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256&&record?.slug===project.slug
    &&record.sourceLayer==='nollagam-owner-typology'&&record.sourceProject?.inmobiliaria==='Nollagam'
    &&identityKeys.every(key=>(project[key]??null)===record.sourceProject[key]))return context;
  return unavailableContext(project.slug,context?.status==='unavailable'?context.reason:'context-unavailable');
}

/** Missing own context delegates the previous pipeline; a bound failure does not. */
export function matchNollagamOwnerQuotes(project,state={}){
  if(!isNollagamQuoteProject(project)||(state.evidenceMode??'published')!=='published'
    ||!Object.hasOwn(project,'_nollagamOwnerQuoteContext')
    ||!present(state.minPriceInput)&&!present(state.maxPriceInput))return null;
  const context=nollagamOwnerQuoteContext(project),query=queryFromCatalogState(state);
  const result=matchProjectFilters(context.record,query);
  const unsupported=['unit','model','stock','availability'].some(key=>present(state[key]));
  // No legal purchase-stage evidence exists in these price/D records. Metro is
  // checked independently with its existing address/provenance guard.
  const stage=context.record?.projectFacts?.purchaseStage;
  const purchaseMatches=!state.purchaseModes?.length||stage?.eligible===true&&state.purchaseModes.includes(stage.mode);
  const matches=context.status==='ready'&&result.matches&&!unsupported&&purchaseMatches&&metroMatches(project,state);
  return {...result,matches,context,references:matches?result.references:[],
    matchedReferenceIds:matches?result.matchedReferenceIds:[]};
}

/** Select only among references that satisfied every active predicate. */
export function nollagamOwnerQuoteWitness(match){
  if(match?.matches!==true||match.context?.status!=='ready'||!trustedContexts.has(match.context)
    ||match.record!==match.context.record)return null;
  const references=(match.references??[]).filter(reference=>match.record?.references?.includes(reference)
    &&priced(reference.attributes?.priceUF));
  return references.length?references.reduce((best,reference)=>
    best.attributes.priceUF<=reference.attributes.priceUF?best:reference):null;
}

export function nollagamOwnerQuoteOffer(match){
  if(match==null)return null;
  const reference=nollagamOwnerQuoteWitness(match);
  return {value:reference?.attributes.priceUF??null,typology:reference?.label??null,
    referenceId:reference?.id??null,date:match.context?.source?.date??null,financialBaselineCompatible:false};
}

export function nollagamOwnerQuoteFacts(match){
  const reference=nollagamOwnerQuoteWitness(match);
  return reference?[{label:'Tipologías',value:reference.label}]:[];
}

export function nollagamOwnerQuoteNote(match){
  if(!nollagamOwnerQuoteWitness(match))return '';
  const date=match.context.source.date.split('-').reverse().join('/');
  return 'Referencia del propietario · '+date+' · Por tipología; no acredita unidad ni stock.';
}
