import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAdvisoryHandler} from '../api/advisory.mjs';
import {createFormOperation} from '../assets/js/form-operation.mjs';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import projectIndex from '../data/advisory-projects.json' with {type:'json'};

const received=new Map();let totalRequests=0;
// Actual isolated HTTP receiver. It stores only synthetic requests and cannot send mail.
const receiver=createServer(async(req,res)=>{
 let bytes='';for await(const c of req)bytes+=c;
 const key=req.headers['idempotency-key'];totalRequests++;
 const old=received.get(key);
 if(old&&old.payload!==bytes){res.writeHead(409,{'Content-Type':'application/json'});return res.end(JSON.stringify({name:'invalid_idempotent_request'}));}
 if(!old)received.set(key,{id:randomUUID(),payload:bytes});
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:received.get(key).id}));
});
await new Promise(resolve=>receiver.listen(0,'127.0.0.1',resolve));
const receiverUrl='http://127.0.0.1:'+receiver.address().port;
const safeFetch=(url,options)=>{assert.equal(url,'https://api.resend.com/emails');return fetch(receiverUrl,options);};
const options={fetchImpl:safeFetch,getApiKey:()=> 'synthetic-test-key',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production'};
const handler=createAdvisoryHandler(options);
const key=()=>`sollahms-v1-${Date.now()}-${randomUUID()}`;
const payload=(changes={})=>({nombre:'Prueba QA sintética',medio:'correo',correo:'qa@example.invalid',objetivo:'diversificar',mensaje:'',consent:true,website:'',startedAt:Date.now()-4000,...changes});
const request=(body,k=key(),extra={})=>new Request('https://sollahms.cl/api/advisory',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':k,...extra},body:JSON.stringify(body)});
after(async()=>{
 await mkdir(new URL('../docs/captacion-20261025/',import.meta.url),{recursive:true});
 await writeFile(new URL('../docs/captacion-20261025/controlled-reception.json',import.meta.url),JSON.stringify({receiver:'Isolated HTTP server on 127.0.0.1; no external email',requests:totalRequests,uniqueAccepted:received.size,receipts:[...received.values()].map(r=>({id:r.id,email:JSON.parse(r.payload)})),limit:'Verifies application validation, HTTP transport and controlled reception. Does not prove Resend acceptance or delivery to the production mailbox.'},null,2));
 await new Promise(resolve=>receiver.close(resolve));
});
test('email-only request reaches authorized payload in controlled receiver',async()=>{
 const k=key(),r=await handler.fetch(request(payload(),k));assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
 const email=JSON.parse(received.get('advisory/'+k).payload);assert.deepEqual(email.to,['contacto@sollahms.cl']);assert.equal(email.from,'Sollahms Web <formularios@forms.sollahms.cl>');assert.equal(email.reply_to,'qa@example.invalid');assert.ok(email.text.includes('Diversificar mis inversiones'));assert.ok(!email.text.includes('RUT:'));
});
test('phone-only accepts no email and omits reply_to',async()=>{
 const k=key(),r=await handler.fetch(request(payload({medio:'telefono',correo:undefined,telefono:'+56 9 0000 0000'}),k));assert.equal(r.status,200);const email=JSON.parse(received.get('advisory/'+k).payload);assert.equal(email.reply_to,undefined);assert.match(email.text,/Llamada telefónica/);
});
test('same key and payload across handler instances is a single received message',async()=>{
 const k=key(),body=payload(),before=received.size;
 const rs=await Promise.all([handler.fetch(request(body,k)),createAdvisoryHandler(options).fetch(request(body,k))]);assert.deepEqual(rs.map(r=>r.status),[200,200]);assert.equal(received.size,before+1);
 const conflict=await handler.fetch(request({...body,nombre:'Prueba QA distinta'},k));assert.equal(conflict.status,409);assert.equal(received.size,before+1);
});
for(const [label,changes] of [['empty name',{nombre:''}],['invalid email',{correo:'incorrecto'}],['invalid phone',{medio:'telefono',correo:undefined,telefono:'123'}],['missing consent',{consent:false}],['sensitive field rejected',{rut:'123'}],['unknown project',{proyecto:'no-existe'}],['honeypot',{website:'spam'}],['fast spam',{startedAt:Date.now()+1000}],['unknown goal',{objetivo:'inventado'}],['both contacts',{telefono:'+56900000000'}]])test(label,async()=>{const before=received.size;const r=await handler.fetch(request(payload(changes)));assert.equal(r.status,400);assert.equal(received.size,before);});
test('cross-origin request blocked',async()=>{assert.equal((await handler.fetch(request(payload(),key(),{Origin:'https://example.invalid'}))).status,403);});
test('preview and missing/other delivery configuration never call a provider',async()=>{
 for(const change of [{getEnvironment:()=> 'preview'},{getDeliveryMode:()=> 'crm'},{getApiKey:()=> ''}]){const h=createAdvisoryHandler({...options,...change,fetchImpl:()=>{throw Error('Must not send');}});assert.equal((await h.fetch(request(payload()))).status,503);}
});
test('provider rejection, missing acknowledgement and timeout cannot report success',async()=>{
 for(const fetchImpl of [async()=>new Response('{}',{status:500}),async()=>new Response('{}'),async()=>{throw Error('timeout');}]){const r=await createAdvisoryHandler({...options,fetchImpl}).fetch(request(payload()));assert.equal(r.status,502);assert.equal((await r.json()).ok,false);}
});
test('input HTML is escaped and no body enters subject',async()=>{const k=key();await handler.fetch(request(payload({nombre:'<script>Prueba QA</script>',mensaje:'<img src=x onerror=x>'}),k));const email=JSON.parse(received.get('advisory/'+k).payload);assert.ok(!email.html.includes('<script>'));assert.ok(!email.html.includes('<img'));assert.equal(email.subject,'Solicitud de asesoría desde Sollahms');});
test('oversized body rejected before transport',async()=>{assert.equal((await handler.fetch(request(payload({mensaje:'x'.repeat(9000)})))).status,413);});
test('client operation survives retries without retaining personal data in storage',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const op=createFormOperation({name:'advisory',storage}),body=payload();const first=await op.prepare(body),next=await createFormOperation({name:'advisory',storage}).prepare({...body,startedAt:Date.now()});assert.equal(next.key,first.key);assert.equal(next.body,first.body);assert.ok(!JSON.stringify([...data]).includes('qa@example.invalid'));await assert.rejects(op.prepare({...body,nombre:'Different'}));
});
test('project context uses only server-owned published names',async()=>{const slug=Object.keys(projectIndex)[0],k=key();assert.equal((await handler.fetch(request(payload({proyecto:slug}),k))).status,200);assert.ok(JSON.parse(received.get('advisory/'+k).payload).text.includes(projectIndex[slug]));});
