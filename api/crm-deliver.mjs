import {timingSafeEqual} from 'node:crypto';
import {configuredCrmDelivery} from '../lib/crm-runtime.mjs';
export function createCrmWorkerHandler({delivery=configuredCrmDelivery(),getToken=()=>process.env.CRM_WORKER_TOKEN}={}){
 return{async fetch(request){
  const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(request.method!=='POST')return json({error:'Método no permitido.'},405);
  const expected=getToken(),provided=request.headers.get('authorization');
  if(typeof expected!=='string'||expected.length<32||!delivery)return json({error:'Procesamiento no configurado.'},503);
  const wanted=Buffer.from('Bearer '+expected),actual=Buffer.from(provided??'');
  if(actual.length!==wanted.length||!timingSafeEqual(actual,wanted))return json({error:'No autorizado.'},401);
  try{return json(await delivery.tick(),200);}catch{return json({error:'Procesamiento temporalmente no disponible.'},503);}
 }};
}
export default createCrmWorkerHandler();
