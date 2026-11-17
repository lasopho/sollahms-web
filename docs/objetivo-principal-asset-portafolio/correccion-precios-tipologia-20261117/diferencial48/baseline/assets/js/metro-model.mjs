/** Objective proximity only. Geographic distances never become walking estimates. */
export const metroDefaults=()=>({metroNetwork:'',metroLines:[],metroStation:'',metroDistance:'1000',metroMinutes:'',metroMethod:'geographic',metroFutureState:''});
export const metroActive=s=>!!(s.metroNetwork||s.metroLines?.length||s.metroStation||s.metroMinutes||s.metroFutureState);
export function geographicMeters(a,b){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r,h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function metroMatches(project,state){
 if(!metroActive(state))return true;
 return metroConnections(project,state).length>0;
}
export function metroConnections(project,state={}){
 const s={...metroDefaults(),...state},r=project._metro;
 if(!r||r.status!=='verified-geographic'||r.address!==project.direccion||r.commune!==project.comuna)return [];
 return (r.connections??[]).filter(c=>{
  if((s.metroNetwork||'current')!==(c.status==='operational'?'current':'future'))return false;
  if(s.metroStation?c.stationId!==s.metroStation:s.metroLines.length&&!s.metroLines.some(l=>c.lines.includes(l)))return false;
  if(s.metroFutureState&&c.status!==s.metroFutureState)return false;
  const walking=s.metroMethod==='walking'||!!s.metroMinutes;
  if(walking&&(!c.route||c.route.status!=='verified'||c.route.mode!=='foot'||!c.route.source||!c.route.checkedOn||!c.route.accessVerified||!Number.isFinite(c.route.distanceM)||c.route.distanceM<0))return false;
  const distance=walking?c.route.distanceM:c.geographicM;
  if(!Number.isFinite(distance)||distance<0||distance>Number(s.metroDistance||1000))return false;
  if(s.metroMinutes&&(!Number.isFinite(c.route?.durationMinutes)||c.route.durationMinutes<=0||c.route.durationMinutes>Number(s.metroMinutes)))return false;
  return true;
 }).sort((a,b)=>(s.metroMethod==='walking'||s.metroMinutes?a.route.distanceM-b.route.distanceM:a.geographicM-b.geographicM));
}
export function metroSummary(project,state={}){
 const rows=metroConnections(project,metroActive(state)?state:{metroDistance:'5000'}),c=rows[0];if(!c)return null;
 const walking=state.metroMethod==='walking'||!!state.metroMinutes;
 return {station:c.name,lines:c.lines.join(' / '),distance:walking?Math.round(c.route.distanceM)+' m caminando':new Intl.NumberFormat('es-CL').format(Math.round(c.geographicM/10)*10)+' m en línea recta',note:walking?'Tiempo estimado: '+Math.ceil(c.route.durationMinutes)+' min':'Distancia geográfica al punto de estación; no es un recorrido peatonal.',stationId:c.stationId};
}
