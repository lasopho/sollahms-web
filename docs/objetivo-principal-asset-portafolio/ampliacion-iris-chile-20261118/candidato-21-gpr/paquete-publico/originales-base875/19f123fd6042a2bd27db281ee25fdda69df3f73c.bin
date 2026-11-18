import {locateProjects, validCoordinate} from './catalog-map-model.mjs';

export const STATES = Object.freeze({idea:'Idea o anuncio preliminar',study:'En estudio o evaluación',approved:'Aprobada',funded:'Con financiamiento confirmado',tender:'En licitación',awarded:'Adjudicada',construction:'En construcción',operational:'Operativa',suspended:'Suspendida',cancelled:'Cancelada'});
export const statusLabel = status => STATES[status] || 'Estado pendiente de verificar';
const rad = n => n * Math.PI / 180;
export function haversine(a,b) {
  if(!validCoordinate(a)||!validCoordinate(b)) return null;
  const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);
  const q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));
}
const bearing=(a,b)=>Math.atan2(Math.sin(rad(b.lng-a.lng))*Math.cos(rad(b.lat)),Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(rad(b.lng-a.lng)));
export function segmentDistance(p,a,b) {
  const length=haversine(a,b),pa=haversine(a,p),pb=haversine(b,p);
  if(length===null||pa===null||pb===null) return null;
  if(!length)return pa;
  const delta=pa/6371008.8,theta=bearing(a,p)-bearing(a,b);
  const along=Math.atan2(Math.sin(delta)*Math.cos(theta),Math.cos(delta))*6371008.8;
  return along<0||along>length?Math.min(pa,pb):Math.abs(Math.asin(Math.max(-1,Math.min(1,Math.sin(delta)*Math.sin(theta))))*6371008.8);
}
export function geometryDistance(location,geometry) {
  if(!geometry)return null;
  const point=c=>({lng:c?.[0],lat:c?.[1]});
  if(geometry.type==='Point')return haversine(location,point(geometry.coordinates));
  const paths=geometry.type==='LineString'?[geometry.coordinates]:['MultiLineString','Polygon'].includes(geometry.type)?geometry.coordinates:geometry.type==='MultiPolygon'?geometry.coordinates.flat():[];
  const distances=paths.flatMap(path=>path.slice(1).map((b,i)=>segmentDistance(location,point(path[i]),point(b)))).filter(Number.isFinite);
  return distances.length?Math.min(...distances):null;
}
export const safeSource=url=>{try{return new URL(url).protocol==='https:';}catch{return false;}};
export function publicWorks(data) {
  return data.works.filter(w=>w.publish===true && STATES[w.status] && w.sources?.length && w.sources.every(s=>safeSource(s.url)) && /^\d{4}-\d{2}-\d{2}$/.test(w.informationDate) && /^\d{4}-\d{2}-\d{2}$/.test(w.reviewedOn) && w.informationDate<=data.cutoff && w.reviewedOn<=data.cutoff);
}
export function relationshipsFor(data,workId) {
  const work=publicWorks(data).find(w=>w.id===workId);
  if(!work?.geometry || !work.geometrySource?.url || !safeSource(work.geometrySource.url))return [];
  // Rail proximity is admitted only to a documented entrance, never a track/stop-position.
  if(work.type==='Metro y trenes' && work.geometryRole!=='entrance')return [];
  const verified=new Map(locateProjects(data.projects,data.locations).located.map(r=>[r.project.slug,r]));
  const seen=new Set();
  return data.relationships.filter(r=>r.workId===workId&&r.reviewed===true).flatMap(r=>{
    const row=verified.get(r.projectSlug);
    if(!row||data.research?.blockedProjectSlugs?.includes(r.projectSlug)||seen.has(r.projectSlug)||!r.rationale||!r.benefit)return [];
    // Changed source locations invalidate an individually reviewed relationship.
    const expected=r.projectLocation;
    if(!expected||typeof expected.address!=='string'||!expected.address.trim()||expected.lat!==row.location.lat||expected.lng!==row.location.lng||expected.address!==row.location.address||expected.commune!==row.location.commune)return [];
    const distanceM=geometryDistance(row.location,work.geometry);
    if(!Number.isFinite(distanceM))return [];
    seen.add(r.projectSlug);
    return [{...r,distanceM,method:'haversine',targetLabel:work.geometryLabel}];
  });
}
export function distanceLabel(rel) {
  if(!Number.isFinite(rel.distanceM))return 'Distancia pendiente de verificación';
  const rounded=Math.round(rel.distanceM/10)*10;
  const number=rounded<1000?`${rounded} m`:`${new Intl.NumberFormat('es-CL',{maximumFractionDigits:2}).format(rounded/1000)} km`;
  return `Aprox. ${number} en línea recta · ${rel.targetLabel}`;
}
let pending;
export async function loadUrbanData() {
  if(pending)return pending;
  pending=Promise.all(['/data/urban-development.json','/data/proyectos.json','/data/project-locations.json'].map(async url=>{
    const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('urban-data');return r.json();
  })).then(([data,projects,locations])=>({...data,projects,locations})).catch(error=>{pending=null;throw error;});
  return pending;
}
