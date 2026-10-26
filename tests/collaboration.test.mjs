import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {createCollaborationHandler} from '../api/collaboration.mjs';
import {createFormOperation} from '../assets/js/form-operation.mjs';
import {validateCollaboration,normalizeCollaboration,COLLABORATION_SOURCE} from '../assets/js/collaboration-fields.mjs';
const received=new Map();let calls=0;
const receiver=createServer(async(req,res)=>{
 let payload='';for await(const part of req)payload+=part;
 const key=req.headers['idempotency-key'];calls++;
 if(received.has(key)&&received.get(key).payload!==payload){res.writeHead(409,{'Content-Type':'application/json'});return res.end(JSON.stringify({name:'invalid_idempotent_request'}));}
 if(!received.has(key))received.set(key,{id:randomUUID(),payload});
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:received.get(key).id}));
});
await new Promise(done=>receiver.listen(0,'127.0.0.1',done));
const options={getEnvironment:()=> 'production',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic',fetchImpl:(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');return fetch('http://127.0.0.1:'+receiver.address().port,opts);}};
const key=()=>`sollahms-v1-${Date.now()}-${randomUUID()}`;
const base={nombre:'QA María-José Prueba',rut:'1.000.005-k',correo:'qa@example.invalid',telefono:'900000000',consent:true,website:'',startedAt:Date.now()-5000};
const body=(tipo,extra={})=>({...base,tipo,...(tipo==='inmobiliaria'?{empresa:'Inmobiliaria QA Sintética',sitio:'https://example.invalid',zona:'Comuna sintética',mensaje:'Propuesta sintética'}:{area:'Área sintética',ciudad:'Ciudad sintética',mensaje:'Experiencia sintética',enlace:'https://example.invalid/cv'}),...extra});
const request=(data,k=key(),headers={})=>new Request('https://sollahms.cl/api/collaboration',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':k,...headers},body:JSON.stringify(data)});
const handler=createCollaborationHandler(options);
after(async()=>{await new Promise(done=>receiver.close(done));await writeFile(new URL('../docs/work-with-us-20261026/controlled-reception.json',import.meta.url),JSON.stringify({transport:'Isolated HTTP receiver on 127.0.0.1. No real email or application.',requests:calls,unique:received.size,subjects:[...received.values()].map(r=>JSON.parse(r.payload).subject),destinationVerified:'contacto@sollahms.cl',allSubmittedFieldsVerified:true,providerDeliveryNotTested:true},null,2));});
for(const tipo of ['inmobiliaria','persona']) {
 test(tipo+': all normalized data, type, origin and consent reach isolated HTTP receiver',async()=>{
  const k=key(),data=body(tipo),response=await handler.fetch(request(data,k));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
  const email=JSON.parse(received.get('collaboration/'+k).payload);assert.deepEqual(email.to,['contacto@sollahms.cl']);assert.equal(email.from,'Sollahms Web <formularios@forms.sollahms.cl>');assert.equal(email.reply_to,base.correo);assert.equal(email.subject,tipo==='inmobiliaria'?'Colaboración con inmobiliaria':'Postulación de persona');
  for(const [name,value]of Object.entries(normalizeCollaboration(data)))if(!['tipo','consent'].includes(name))assert.ok(email.text.includes(value),name);
  assert.ok(email.text.includes(COLLABORATION_SOURCE));assert.ok(email.text.includes('Sin autorización de marketing'));assert.ok(!email.subject.includes(base.nombre));
 });
 test(tipo+': required fields, DV, K, email, phone, bounds, URLs and consent fail before transport',async()=>{
  const before=calls;
  for(const patch of [{nombre:''},{nombre:'QA\nBcc: x'},{rut:''},{rut:'1000005-1'},{rut:'1.00.005-K'},{correo:'bad'},{telefono:'123'},{consent:false},{mensaje:'x'.repeat(2001)},{mensaje:'bad\u0000'},...(tipo==='inmobiliaria'?[{empresa:''},{sitio:'javascript:alert(1)'},{sitio:'https://user:pass@example.invalid'}]:[{enlace:'file:///tmp/cv'},{area:'x'.repeat(121)}])]){
   const data=body(tipo,patch);assert.ok(Object.keys(validateCollaboration(data)).length);const r=await handler.fetch(request(data));assert.equal(r.status,400);const reply=JSON.stringify(await r.json());assert.ok(!reply.includes(base.correo));assert.ok(!reply.includes(base.rut));
  }
  assert.equal(calls,before);
 });
 test(tipo+': minimal submission needs no optional data',async()=>{const data={...base,tipo,...(tipo==='inmobiliaria'?{empresa:'QA Empresa'}:{})};assert.equal((await handler.fetch(request(data))).status,200);});
}
test('same operation across instances/retries deduplicates; changed body conflicts',async()=>{const k=key(),data=body('persona'),before=received.size;const rs=await Promise.all([handler.fetch(request(data,k)),createCollaborationHandler(options).fetch(request(data,k))]);assert.deepEqual(rs.map(r=>r.status),[200,200]);assert.equal(received.size,before+1);assert.equal((await handler.fetch(request({...data,mensaje:'Different'},k))).status,409);assert.equal(received.size,before+1);});
test('request shape, honeypot, timing, origin, size and methods are protected',async()=>{
 const before=calls;
 for(const patch of [{tipo:'unknown'},{website:'bot'},{startedAt:Date.now()+1000},{startedAt:Date.now()-86400001},{startedAt:'bad'},{unknown:'x'},{nombre:{}},{empresa:'wrong branch'}])assert.equal((await handler.fetch(request(body('persona',patch)))).status,400);
 assert.equal((await handler.fetch(request(body('persona'),key(),{Origin:'https://example.invalid'}))).status,403);
 assert.equal((await handler.fetch(request(body('persona',{mensaje:'x'.repeat(20000)})))).status,413);
 assert.equal((await handler.fetch(new Request('https://sollahms.cl/api/collaboration'))).status,405);
 assert.equal((await handler.fetch(request(body('persona'),key(),{'Content-Type':'text/plain'}))).status,415);
 assert.equal(calls,before);
});
test('preview and misconfigured channel fail closed without provider',async()=>{for(const extra of [{getEnvironment:()=> 'preview'},{getDeliveryMode:()=> 'crm'},{getApiKey:()=> ''}])assert.equal((await createCollaborationHandler({...options,...extra,fetchImpl:()=>{throw Error('Network forbidden');}}).fetch(request(body('persona')))).status,503);});
test('timeout, rejection, malformed/missing provider acknowledgement never claim delivery',async()=>{for(const fetchImpl of [async()=>{throw Error('synthetic');},async()=>Response.json({},{status:500}),async()=>Response.json({}),async()=>new Response('not json')]){const r=await createCollaborationHandler({...options,fetchImpl}).fetch(request(body('persona')));assert.equal(r.status,502);assert.equal((await r.json()).code,'contact_outcome_unknown');}});
test('untrusted content escaped, subject fixed and no link fetched',async()=>{const k=key();await handler.fetch(request(body('inmobiliaria',{empresa:'<script>QA</script>',mensaje:'<img src=x onerror=x>'}),k));const e=JSON.parse(received.get('collaboration/'+k).payload);assert.ok(!e.html.includes('<script>'));assert.ok(!e.html.includes('<img'));assert.equal(e.subject,'Colaboración con inmobiliaria');});
test('operation state stores no personal fields; uncertain retries preserve original request',async()=>{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};const op=createFormOperation({name:'collaboration-persona',storage}),payload=body('persona'),a=await op.prepare(payload);op.uncertain();const b=await op.prepare({...payload,startedAt:Date.now()});assert.equal(a.key,b.key);assert.equal(a.body,b.body);assert.ok(!JSON.stringify([...values]).includes(base.correo));assert.ok(!JSON.stringify([...values]).includes(base.rut));await assert.rejects(op.prepare({...payload,mensaje:'Changed'}));});
