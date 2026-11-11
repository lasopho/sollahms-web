import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createContactHandler} from '../api/contact.mjs';
import {createOrientationContactHandler} from '../api/orientation-contact.mjs';

const now=Date.now();
const base={nombre:'QA Persona Sintética',rut:'1.000.005-K',correo:'qa@example.invalid',telefono:'900000000',mensaje:'Prueba aislada, sin transporte.',consent:true,website:'',startedAt:now-5000};
const mortgage={propertyUf:3000,downPaymentPercent:20,years:25,annualRatePercent:4.5,rateConvention:'effective',bankId:null,simulatedAt:new Date(now-1000).toISOString(),location:'unknown',propertyValueOrigin:'visitor'};
for(const [name,factory,payload,path] of [
 ['Centro',createOrientationContactHandler,base,'orientation-contact'],
 ['Comparador',createContactHandler,{...base,mortgage},'contact'],
])test(name+': Preview config reaches guard with zero credential/provider/CRM/UF access',async()=>{
 const old={mode:process.env.CONTACT_DELIVERY_MODE,environment:process.env.VERCEL_ENV};
 let keys=0,provider=0,crm=0,uf=0;
 const handler=factory({now:()=>now,getApiKey:()=>{keys++;throw Error('key forbidden');},fetchImpl:()=>{provider++;throw Error('provider forbidden');},persistCrmLead:()=>{crm++;throw Error('CRM forbidden');},resolveUf:()=>{uf++;throw Error('UF forbidden');}});
 const send=()=>handler.fetch(new Request('https://preview.invalid/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://preview.invalid'},body:JSON.stringify(payload)}));
 try{
  process.env.VERCEL_ENV='preview';delete process.env.CONTACT_DELIVERY_MODE;
  assert.equal((await (await send()).json()).code,'contact_configuration_unavailable');
  process.env.CONTACT_DELIVERY_MODE='resend';const response=await send();assert.equal(response.status,503);assert.equal((await response.json()).code,'preview_read_only');
  assert.deepEqual({keys,provider,crm,uf},{keys:0,provider:0,crm:0,uf:0});
 }finally{for(const [key,value] of [['CONTACT_DELIVERY_MODE',old.mode],['VERCEL_ENV',old.environment]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});

test('module initialization + internal navigation preserve acquisition without transport before a form',()=>{
 const source=`import assert from 'node:assert/strict';
 const entries=new Map(), storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
 let calls=0;const forbidden=()=>{calls++;throw Error('network forbidden');};
 globalThis.fetch=forbidden;globalThis.XMLHttpRequest=class{constructor(){forbidden()}};globalThis.WebSocket=class{constructor(){forbidden()}};
 Object.defineProperty(globalThis,'navigator',{value:{sendBeacon:forbidden},configurable:true});
 globalThis.window={sessionStorage:storage};globalThis.document={referrer:''};
 globalThis.location={origin:'https://preview.invalid',pathname:'/',search:'?utm_source=test&utm_medium=organic&utm_campaign=qa'};
 await import('./assets/js/acquisition.mjs?entry');
 const first=storage.getItem('sollahms:acquisition:v1');
 globalThis.document={referrer:'https://preview.invalid/'};globalThis.location={origin:'https://preview.invalid',pathname:'/contacto.html',search:'?utm_source=other'};
 await import('./assets/js/acquisition.mjs?navigation');
 assert.equal(storage.getItem('sollahms:acquisition:v1'),first);
 const a=JSON.parse(first).context;assert.equal(a.landing_path,'/');assert.equal(a.utm_source,'test');assert.equal(a.utm_medium,'organic');assert.equal(a.utm_campaign,'qa');assert.equal(a.referrer_origin,null);assert.equal(calls,0);
 console.log(JSON.stringify({passed:true,networkCalls:0,scope:'isolated module, not browser evidence'}));`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8',env:{PATH:process.env.PATH}});
 assert.equal(child.status,0,child.stderr);assert.equal(JSON.parse(child.stdout).networkCalls,0);
});
