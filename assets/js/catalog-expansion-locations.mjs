import {isCatalogExpansionProject,CATALOG_EXPANSION_SOURCE_SHA256} from './catalog-expansion.mjs';
import {validCoordinate} from './catalog-map-model.mjs';
import {geographicMeters} from './metro-model.mjs';

// This reviewed geography is separate from commercial facts and the original registries.
export const EXPANSION_LOCATIONS_URL='/data/catalog-expansion-locations-20261119.json';
export const EXPANSION_LOCATIONS_SHA256='d2d6e8b196063797a262c5f7796d12c6e88c1755cee137f44502495916acf90e';
export const METRO_NETWORK_SOURCE_SHA256='bb40e98c6f5530c657ea2ba7e9651d980f21a94b08dea57315a107fe5d477ce7';
export const EXPANSION_LOCATIONS_FAILURE='Las ubicaciones adicionales no pudieron validarse. Sus fichas siguen disponibles en Tarjetas y Listado.';
const sources=new WeakSet(),registries=new WeakSet();
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.trim().length>0;
const require=(ok,message)=>{if(!ok)throw Error('expansion geography: '+message);};
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const clone=v=>JSON.parse(JSON.stringify(v));
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const keys=(v,allowed,name)=>require(object(v)&&Object.keys(v).length===allowed.length&&Object.keys(v).every(k=>allowed.includes(k)),name+' schema');
const optionalKeys=(v,required,optional,name)=>require(object(v)&&required.every(k=>Object.prototype.hasOwnProperty.call(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k)),name+' schema');
function https(value){
  try{const u=new URL(value);return typeof value==='string'&&value.length<=4096&&u.protocol==='https:'&&!u.username&&!u.password&&![...u.searchParams.keys()].some(k=>/^(?:key|token|access_token|auth|authorization|signature)$/i.test(k));}catch{return false;}
}
async function digest(text,cryptoImpl){
  require(typeof text==='string'&&cryptoImpl?.subtle,'transport crypto');
  return [...new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function parseExpansionLocations(text,{sourceSHA256=EXPANSION_LOCATIONS_SHA256,cryptoImpl=globalThis.crypto}={}){
  require(typeof text==='string'&&text.length>0&&text.length<1000000&&/^[a-f0-9]{64}$/.test(sourceSHA256),'transport');
  require(await digest(text,cryptoImpl)===sourceSHA256,'source hash');
  const source=freeze({data:JSON.parse(text),sha256:sourceSHA256});sources.add(source);return source;
}
export async function loadExpansionLocations(fetchImpl=globalThis.fetch,options={}){
  require(typeof fetchImpl==='function','fetch unavailable');
  const response=await fetchImpl(EXPANSION_LOCATIONS_URL,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(10000)});
  require(response?.ok===true&&response.redirected!==true,'source unavailable');return parseExpansionLocations(await response.text(),options);
}
export function validateExpansionLocations(data,projects){
  keys(data,['schemaVersion','kind','checkedOn','sourceCatalogSHA256','metroNetworkSourceSHA256','locations'],'root');
  require(data.schemaVersion===1&&data.kind==='catalog-expansion-locations'&&day(data.checkedOn),'root values');
  require(data.sourceCatalogSHA256===CATALOG_EXPANSION_SOURCE_SHA256&&data.metroNetworkSourceSHA256===METRO_NETWORK_SOURCE_SHA256,'source dependency');
  require(Array.isArray(projects)&&new Set(projects.map(p=>p.slug)).size===projects.length,'catalogue identity');
  const expanded=projects.filter(isCatalogExpansionProject),bySlug=new Map(expanded.map(p=>[p.slug,p]));
  require(expanded.length===21&&object(data.locations)&&Object.keys(data.locations).length===21&&Object.keys(data.locations).every(slug=>bySlug.has(slug)),'location identities');
  const ids=new Set();
  for(const [slug,row] of Object.entries(data.locations)){
    optionalKeys(row,['projectId','status','address','commune','region','lat','lng','checkedOn','source','provenance'],['siteAddress','addressContext','publicNote'],'location');
    const p=bySlug.get(slug),input=p._catalogExpansion.input;
    require(row.projectId===input.source.projectId&&!ids.has(row.projectId),'project ID');ids.add(row.projectId);
    require(row.address===p.direccion&&row.commune===p.comuna&&row.region===p.region,'published address/commune/region');
    if(row.status==='pending'){
      require(['lat','lng','checkedOn','source','provenance'].every(k=>row[k]===null),'pending coordinates');continue;
    }
    require(row.status==='verified'&&validCoordinate(row)&&day(row.checkedOn)&&row.checkedOn<=data.checkedOn&&https(row.source),'verified coordinates');
    const v=row.provenance;optionalKeys(v,['role','precision','sourceAddress','notSalesOffice','primaryProofs','sameProjectAddress'],['sourceHouseNumber','sourceStreet','sourceCommune','geometryRole','pointScope','sourcePublishedMapSection','exactEntranceCertified','numbersOrEntrancesDeclaredEquivalent'],'provenance');
    require(['official-project-marker','verified-building-poi','verified-address-marker','official-project-reference'].includes(v.role)&&v.precision==='representative-project-point'&&text(v.sourceAddress),'coordinate scope');
    if(Object.prototype.hasOwnProperty.call(v,'exactEntranceCertified'))require(v.exactEntranceCertified===false,'no exact entrance claim');
    if(Object.prototype.hasOwnProperty.call(v,'numbersOrEntrancesDeclaredEquivalent'))require(v.numbersOrEntrancesDeclaredEquivalent===false,'no inferred address or entrance equivalence');
    if(v.role==='verified-address-marker')require(text(v.sourceHouseNumber)&&text(v.sourceStreet)&&v.sourceCommune===row.commune&&v.sourceAddress.includes(v.sourceHouseNumber)&&v.sourceAddress.includes(v.sourceStreet)&&v.geometryRole==='selected-address-entity'&&v.exactEntranceCertified===false,'selected address entity');
    const officeContext=slug==='condominio-reserva-santa-clara'&&row.region==='Coquimbo'&&v.role==='official-project-reference'&&v.notSalesOffice===null&&row.addressContext==='published-sales-office'&&text(row.siteAddress)&&row.siteAddress===v.sourceAddress&&text(row.publicNote)&&v.sourcePublishedMapSection==='project-location'&&(v.geometryRole==='official-project-reference'||v.pointScope==='official-project-reference')&&v.exactEntranceCertified===false;
    require(officeContext||v.notSalesOffice===true&&v.role!=='official-project-reference','not sales office or explicitly disclosed project reference');
    require(Array.isArray(v.primaryProofs)&&v.primaryProofs.length>0&&v.primaryProofs.length<=6,'primary proof');
    for(const proof of v.primaryProofs){keys(proof,['url','label','confirmsProject','confirmsAddress'],'primary proof');require(https(proof.url)&&text(proof.label)&&proof.confirmsProject===true&&proof.confirmsAddress===true,'primary identity/address proof');}
    if(v.sourceAddress===row.address)require(v.sameProjectAddress===null,'unneeded address equivalence');
    else{
      const q=v.sameProjectAddress;optionalKeys(q,['publishedAddress','sourceAddress','proofUrls'],['relation'],'address equivalence');
      require(q.publishedAddress===row.address&&q.sourceAddress===v.sourceAddress&&Array.isArray(q.proofUrls)&&q.proofUrls.length>0&&q.proofUrls.every(url=>v.primaryProofs.some(proof=>proof.url===url)),'same-project address proof');
      if(q.relation==='same-project-different-address-contexts')require(['condominio-reserva-santa-clara','condominio-hacienda-santa-clara'].includes(slug)&&text(row.siteAddress)&&row.siteAddress===v.sourceAddress&&text(row.publicNote)&&(officeContext||slug==='condominio-hacienda-santa-clara'&&row.addressContext==='project-location'),'explicit separate address contexts');
      else require(q.relation===undefined||q.relation==='same-project-primary-address','address relation');
    }
    if(officeContext)require(v.sameProjectAddress?.relation==='same-project-different-address-contexts','separate sales office/project contexts');
    if(row.addressContext!==undefined)require(row.addressContext==='project-location'||officeContext,'address display context');
  }
  return data;
}
async function verifiedNetwork(sourceText,cryptoImpl){
  require(await digest(sourceText,cryptoImpl)===METRO_NETWORK_SOURCE_SHA256,'station source hash');
  const network=JSON.parse(sourceText);
  require(network.schemaVersion===1&&day(network.checkedOn)&&network.walkingAvailable===false&&Array.isArray(network.stations)&&network.stations.length===126,'station registry');
  require(new Set(network.stations.map(s=>s.id)).size===126,'station identities');
  for(const s of network.stations)require(text(s.id)&&text(s.name)&&validCoordinate(s)&&s.status==='operational'&&Array.isArray(s.lines)&&s.lines.length>0&&s.source==='openstreetmap','reviewed station');
  return network;
}
export async function bindExpansionLocations(projects,source,{networkText=null,cryptoImpl=globalThis.crypto}={}){
  require(sources.has(source),'verified location transport');const data=validateExpansionLocations(source.data,projects);
  let network=null;try{if(typeof networkText==='string')network=await verifiedNetwork(networkText,cryptoImpl);}catch{}
  const locations={},metroProjects={};
  for(const [slug,row] of Object.entries(data.locations)){
    if(row.status!=='verified')continue;
    locations[slug]=clone(row);
    if(network&&/Metropolitana/i.test(row.region)){
      const connections=network.stations.map(s=>({stationId:s.id,name:s.name,lines:[...s.lines],status:s.status,geographicM:Math.round(geographicMeters(row,s)),source:s.source,route:null}))
        .filter(c=>Number.isFinite(c.geographicM)&&c.geographicM<=5000).sort((a,b)=>a.geographicM-b.geographicM).filter((c,i)=>i===0||c.geographicM<=1000);
      metroProjects[slug]={status:'verified-geographic',address:row.address,commune:row.commune,lat:row.lat,lng:row.lng,locationSource:row.source,checkedOn:row.checkedOn,stationSourceCheckedOn:network.checkedOn,walkingStatus:'pending-access-and-route',connections};
    }
  }
  freeze(locations);registries.add(locations);freeze(metroProjects);
  return {projects:projects.map(p=>isCatalogExpansionProject(p)?{...p,_metro:metroProjects[p.slug]}:p),locations,metroProjects,verifiedLocationCount:Object.keys(locations).length,pendingLocationCount:21-Object.keys(locations).length,metroAvailable:network!==null};
}
export function mergeExpansionLocations(registry,extra=null){
  if(extra===null)return registry;
  require(object(registry?.locations)&&registries.has(extra),'verified map registry');
  require(Object.keys(extra).every(slug=>!Object.prototype.hasOwnProperty.call(registry.locations,slug)),'original location collision');
  return {...registry,locations:{...registry.locations,...extra}};
}
export function hasVerifiedExpansionLocation(project,extra=null){
  return isCatalogExpansionProject(project)&&registries.has(extra)&&Object.prototype.hasOwnProperty.call(extra,project.slug);
}
export function expansionLocationLabels(project,location){
  if(location?.addressContext==='published-sales-office'&&project.slug==='condominio-reserva-santa-clara')return ['Ubicación del proyecto informada: '+location.siteAddress,'Sala de ventas publicada: '+project.direccion];
  if(location?.addressContext==='project-location'&&location.siteAddress&&project.slug==='condominio-hacienda-santa-clara')return ['Ubicación del proyecto informada: '+location.siteAddress,'Dirección publicada de referencia: '+project.direccion];
  return [];
}
