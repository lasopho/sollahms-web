import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID,createHmac} from 'node:crypto';
import {createCrmDelivery} from '../lib/crm-delivery.mjs';
const key=randomBytes(32), event=()=>({requestId:randomUUID(),message:'Consulta sintética'});
function fixture(transport){const rows=new Map();return{rows,options:{key,transport,store:{async put(id,payload){if(rows.has(id)&&JSON.stringify(rows.get(id).payload)!==JSON.stringify(payload))throw new Error('Conflict');rows.set(id,{id,payload,lease:'fixture',state:'pending'});return{durable:true};},async claim(){return [...rows.values()].find(r=>r.state==='pending');},async complete(id,lease,result){const row=rows.get(id);if(row.lease!==lease)return false;row.state='recorded';row.result=result;return true;},async retry(id,lease,error){const row=rows.get(id);assert.equal(row.lease,lease);row.error=error;}}}};}
test('Receiving never invokes transport and rejects a non-durable acknowledgement',async()=>{let calls=0;const f=fixture(async()=>{calls++;});const delivery=createCrmDelivery(f.options);assert.equal((await delivery.receive(event())).delivery,'pending');assert.equal(calls,0);f.options.store.put=async()=>({durable:false});await assert.rejects(createCrmDelivery(f.options).receive(event()));});
test('Restarted delivery retries outages with the same request id and signs exact bytes',async()=>{let online=false;const f=fixture(async({body,headers})=>{const expected='v1='+createHmac('sha256',key).update(headers['X-Sollahms-Timestamp']+'.').update(body).digest('hex');assert.equal(headers['X-Sollahms-Signature'],expected);if(!online)throw new Error('Synthetic outage');return{requestId:JSON.parse(body).requestId,state:'recorded'};});const e=event();const first=createCrmDelivery(f.options);await first.receive(e);assert.equal((await first.tick()).state,'pending');online=true;assert.equal((await createCrmDelivery(f.options).tick()).state,'recorded');assert.equal(f.rows.size,1);});
test('A successful HTTP call without matching CRM receipt never marks delivery complete',async()=>{const f=fixture(async()=>({ok:true,state:'recorded',requestId:randomUUID()}));const d=createCrmDelivery(f.options);await d.receive(event());assert.equal((await d.tick()).state,'pending');});

test('Delivery worker schedules automatically, coalesces manual ticks and drains on close',async()=>{
 const {createDeliveryWorker}=await import('../lib/crm-delivery.mjs');
 let calls=0,finish,next,cleared=0;
 const worker=createDeliveryWorker({delivery:{tick(){calls++;return new Promise(r=>{finish=r;});}},setTimer(fn){next=fn;return 7;},clearTimer(){cleared++;}});
 worker.start();const manual=worker.runOnce();assert.equal(calls,1);finish({state:'pending'});await manual;await Promise.resolve();assert.equal(typeof next,'function');await worker.close();assert.equal(cleared,1);await assert.rejects(worker.runOnce());
});
