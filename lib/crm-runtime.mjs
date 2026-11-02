import {createCrmDelivery} from './crm-delivery.mjs';
import {createPostgresOutbox} from './crm-outbox-postgres.mjs';
// Disabled unless explicitly configured by the host. No connection on import.
export function configuredCrmDelivery({environment=process.env,loadPg=()=>import('pg'),fetchImpl=(...args)=>fetch(...args)}={}){
 const mode=environment.CRM_INTEGRATION_MODE;
 if(mode===undefined||mode==='disabled')return null;
 if(mode!=='postgres')throw new Error('Invalid CRM integration mode');
 const required=name=>{const value=environment[name];if(typeof value!=='string'||!value.trim())throw new Error('CRM runtime configuration incomplete');return value;};
 const host=required('CRM_PG_HOST'),database=required('CRM_PG_DATABASE'),user=required('CRM_PG_USER'),password=required('CRM_PG_PASSWORD');
 const port=Number(environment.CRM_PG_PORT??5432);if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('Invalid CRM database port');
 const target=new URL(required('CRM_RECEIVER_URL'));
 if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/api/inbound/sollahms')throw new Error('Explicit HTTPS CRM receiver required');
 const encoded=required('CRM_SIGNING_KEY');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new Error('Invalid CRM signing key');
 const key=Buffer.from(encoded,'base64');if(key.length<32||key.length>128)throw new Error('Invalid CRM signing key');
 let initialization;
 async function get(){
  if(!initialization)initialization=(async()=>{
   const pg=await loadPg(),Pool=pg.Pool??pg.default?.Pool;
   const pool=new Pool({host,database,user,password:()=>Promise.resolve(password),port,ssl:{rejectUnauthorized:true,...(environment.CRM_PG_CA?{ca:environment.CRM_PG_CA}:{})},max:3,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,query_timeout:15000,statement_timeout:10000});
   pool.on('error',()=>{});
   const store=createPostgresOutbox({pool,maxAttempts:Number(environment.CRM_MAX_ATTEMPTS??12),retrySeconds:Number(environment.CRM_RETRY_SECONDS??60)});
   return createCrmDelivery({store,key,transport:async({body,headers,signal})=>{
    const response=await fetchImpl(target.href,{method:'POST',body,headers,signal,redirect:'error'});
    if(!response.ok)throw new Error('CRM receipt unavailable');return response.json();
   }});
  })().catch(()=>{initialization=null;throw new Error('CRM runtime unavailable');});
  return initialization;
 }
 return{receive:async event=>(await get()).receive(event),tick:async()=>(await get()).tick()};
}
