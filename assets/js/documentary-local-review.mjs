import {createDocumentaryReferenceLayer,DOCUMENTARY_REVIEW_MODE} from './documentary-reference-data.mjs';

// Fixtures are read only after loopback opt-in. These are documentary witnesses,
// not an inventory feed, a public overlay, or a current-price assertion.
const irisSource={url:'/tests/fixtures/iris-documentary-15.json',sha256:'3706bac50a2aa70a6d6cb8483f8f13a62615d6f2ce461b82dfe1774601794b71'};
const plazaSource={url:'/tests/fixtures/plaza-213-reference.json',sha256:'94c2ebc3e78c68e29addec501cbd329cec3b7619f78f164b11f8870739e7d865'};
const plazaId='DOC-SENTO-PLC-U213-C7-OBS20261117';
const clone=value=>JSON.parse(JSON.stringify(value));
const require=(condition,message)=>{if(!condition)throw new TypeError('Local documentary review: '+message);};
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

function enabled(location){
  if(!location||!['localhost','127.0.0.1','[::1]'].includes(location.hostname))return false;
  if(!['http:','https:'].includes(location.protocol))return false;
  const values=new URLSearchParams(location.search).getAll('revision_documental');
  return values.length===1&&values[0]==='1';
}

async function fetchPinned(source,fetchImpl){
  const response=await fetchImpl(source.url,{cache:'no-store',credentials:'omit',redirect:'error'});
  require(response?.ok===true,'source fetch failed: '+source.url);
  const text=await response.text();
  require(typeof text==='string'&&globalThis.crypto?.subtle,'UTF-8 source and WebCrypto are required');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  const hash=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
  require(hash===source.sha256,'source SHA-256 mismatch: '+source.url);
  return text;
}

/** Validate custody restrictions which the pure predicate evaluator cannot enforce. */
export function validatePlazaDocumentaryContract(source,projects){
  const usage=source?.usage,record=source?.record,reference=record?.references?.[0];
  require(source?.schemaVersion===1&&source.stableReferenceId===plazaId,'unexpected Plaza contract');
  require(usage?.localReviewOnly===true&&usage.documentaryPredicateSupport===true
    &&usage.useAsActiveOffer===false&&usage.publishAsUnitInventory===false
    &&usage.countAsStock===false&&usage.stock===null&&usage.availability===null
    &&usage.commercialValidityCertified===false&&usage.IrisPriceAdopted===false
    &&usage.projectFromPriceCreated===false&&usage.interiorEqualsUsefulInferred===false
    &&usage.totalCalculated===false&&usage.drawingIssueDate===null&&usage.drawingRevision===null,
  'Plaza scope must remain documentary, dated and without stock');
  require(source.identity?.projectSlug==='plaza-las-condes'&&source.identity.developer==='Sento'
    &&source.identity.unit==='213'&&source.identity.model==='C7','Plaza unit/model identity mismatch');
  const project=projects.find(project=>project.slug==='plaza-las-condes');
  require(project&&project.nombre===record?.name&&project.inmobiliaria==='Sento'
    &&project.direccion===source.identity.address&&record.slug===project.slug
    &&record.sourceProject?.slug===project.slug&&record.sourceProject.nombre===project.nombre,
  'Plaza registered identity mismatch');
  require(Object.keys(record.sourceProject).every(key=>['slug','nombre'].includes(key)),
    'unauthorized Plaza sourceProject field');
  require(record.sourceLayer==='documentary-reviewed-no-stock'&&source.sourceLayer===record.sourceLayer
    &&record.references.length===1&&reference.id===plazaId
    &&reference.sourceKind==='documentary-unit-association'&&reference.sourceLayer===record.sourceLayer
    &&reference.stock===null&&reference.availability===null&&reference.sourceDate===null,
  'Plaza reference scope mismatch');
  const facts=record.projectFacts;
  require(facts.region===project.region&&facts.commune===project.comuna&&facts.developer===project.inmobiliaria,
    'Plaza location/developer mismatch');
  require(Object.entries(facts).every(([key,value])=>['region','commune','developer'].includes(key)||value===null),
    'Plaza project attributes must remain unknown');
  const expected={propertyType:'departamento',assetType:'Residencial',priceUF:11119,bedrooms:2,bathrooms:2,
    usefulM2:69.85,totalM2:83.82,terraceM2:13.97,interiorM2:null,gardenM2:null,landM2:null,
    state:null,delivery:null,privateTerrace:null,privateGarden:null,parkingIncluded:null,
    parkingAvailable:null,storageIncluded:null,storageAvailable:null};
  require(Object.keys(reference.attributes).length===Object.keys(expected).length
    &&Object.entries(expected).every(([key,value])=>reference.attributes[key]===value),
  'Plaza contains unsupported commercial attributes');
  const price=source.fieldProvenance?.['/record/references/0/attributes/priceUF'];
  require(price?.value===11119&&price.authority==='owner-authorized-list-price'
    &&price.sourceDate==='2026-10-28'&&price.priceScope==='exact unit 213'&&price.notProjectFromPrice===true,
  'Plaza owner price authority/date mismatch');
  for(const [key,value] of Object.entries({usefulM2:69.85,totalM2:83.82,terraceM2:13.97})){
    const provenance=source.fieldProvenance?.['/record/references/0/attributes/'+key];
    require(provenance?.value===value&&provenance.explicitlyPrinted===true&&provenance.calculated===false
      &&provenance.convertedFromInterior===false&&provenance.sourceDate===null
      &&provenance.scope?.project===project.slug&&provenance.scope.unit==='213'&&provenance.scope.model==='C7',
    'Plaza exact printed surface provenance mismatch');
  }
}

const identityRecord=project=>({slug:project.slug,name:project.nombre,
  sourceLayer:'documentary-local-only-not-offer',notOffer:true,commercialAdoptionAllowed:false,
  sourceProject:Object.fromEntries(['slug','nombre','inmobiliaria','comuna','region'].map(key=>[key,project[key]])),
  projectFacts:{region:project.region,commune:project.comuna,developer:project.inmobiliaria},references:[]});

// External Iris prices and raw unit-dialog text stay out of the search record
// and presentation metadata. Original pinned fixtures retain documentary custody.
function irisMetadata(reference){
  const keys=['id','sourceKind','sourceId','sourceURL','sourceFile','sourceSHA256','sourcePointer',
    'sourceRegistryPointer','sourceDocumentDate','sourceDate','dateKind','observedAtUTC','scope',
    'unitLabel','modelLabel','modelCodePolicy','sourceMetrics','sourceFieldPointers','constraints','unknownPolicy'];
  return {...Object.fromEntries(keys.filter(key=>Object.hasOwn(reference,key)).map(key=>[key,clone(reference[key])])),
    sourceLabel:'Iris · referencia documental',inputSHA256:irisSource.sha256};
}

/** Explicit loopback consumer. Returns null before fetching outside its gate. */
export async function loadLocalDocumentaryReview(projects,{location,fetchImpl=globalThis.fetch}={}){
  if(!enabled(location))return null;
  require(Array.isArray(projects)&&new Set(projects.map(project=>project.slug)).size===projects.length,
    'registered catalogue identities are required');
  require(typeof fetchImpl==='function','fetch implementation is required');
  const irisText=await fetchPinned(irisSource,fetchImpl);
  const iris=await createDocumentaryReferenceLayer(projects,irisText,{mode:DOCUMENTARY_REVIEW_MODE,
    sourceGuard:{sha256:irisSource.sha256}});
  const plaza=JSON.parse(await fetchPinned(plazaSource,fetchImpl));
  validatePlazaDocumentaryContract(plaza,projects);
  const records=new Map(iris.records.map(record=>[record.slug,record]));
  require(!records.has(plaza.record.slug),'documentary source overlap requires explicit reconciliation');
  records.set(plaza.record.slug,freeze({...clone(plaza.record),notOffer:true,commercialAdoptionAllowed:false}));
  const metadata=Object.fromEntries(Object.entries(iris.documentary.byReferenceId)
    .map(([id,reference])=>[id,irisMetadata(reference)]));
  const plan=plaza.sources.find(source=>source.id==='plan-original-bytes');
  metadata[plazaId]={id:plazaId,sourceKind:'documentary-unit-association',sourceLabel:'Precio propietario y plano C7/213',
    sourceURL:plan.url,sourceFile:plazaSource.url,sourceSHA256:plazaSource.sha256,sourceDate:null,sourceRevision:null,
    observedAtUTC:plan.observedAtUTC,ownerPriceDate:'2026-10-28',priceAuthority:'owner-authorized-list-price',
    planObservedAtUTC:plan.observedAtUTC,planSourceURL:plan.url,planSourceSHA256:plan.sha256,
    unitLabel:'213',modelLabel:'C7',scope:{project:'plaza-las-condes',unit:'213',model:'C7',usage:'local-review',
      stock:null,commercialValidityCertified:false,drawingIssueDate:null,drawingRevision:null},
    usage:clone(plaza.usage),sources:clone(plaza.sources),fieldProvenance:clone(plaza.fieldProvenance)};
  const reviewed=projects.map(project=>{
    const record=records.get(project.slug)??freeze(identityRecord(project));
    return {...project,_documentaryReviewEnabled:true,_documentaryRecord:record,
      _documentaryMetadata:freeze({byReferenceId:Object.fromEntries(record.references.map(reference=>[
        reference.id,metadata[reference.id]])),mode:DOCUMENTARY_REVIEW_MODE,notOffer:true,
      commercialAdoptionAllowed:false,publicConsumption:false})};
  });
  return {projects:reviewed,index:freeze({documentaryReviewEnabled:true,documentaryReferenceCount:16,
    documentaryProjectCount:records.size,documentaryIdentityCount:projects.length,
    documentarySources:[irisSource,plazaSource].map(source=>({...source})),
    documentaryUsage:'local-review',documentaryStockCertified:false})};
}
