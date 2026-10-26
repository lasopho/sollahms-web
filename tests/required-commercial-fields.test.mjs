import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateCommercialFields,normalizedCommercialFields,normalizeName,normalizeEmail,normalizePhone} from '../assets/js/commercial-fields.mjs';
import {createAdvisoryHandler} from '../api/advisory.mjs';
import {createContactHandler} from '../api/contact.mjs';

// Deliberately synthetic; transport is injected and never uses the network.
globalThis.fetch=()=>{throw Error('External network forbidden');};
const base={nombre:"QA María-José O’Prueba",rut:'1.000.005-k',correo:'qa+four@example.invalid',telefono:'9 0000 0000',mensaje:'Prueba sintética sin entrega real.',consent:true,website:'',startedAt:Date.now()-5000};
const sent=[];
const opts={getEnvironment:()=> 'production',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',persistCrmLead:()=>{throw Error('CRM forbidden');},fetchImpl:async(url,o)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(JSON.parse(o.body));return Response.json({id:'synthetic'});}};
const routes=[['advisory',createAdvisoryHandler(opts)],['contact',createContactHandler(opts)]];
const req=(route,body)=>new Request('https://sollahms.cl/api/'+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':`sollahms-v1-${Date.now()}-${randomUUID()}`},body:JSON.stringify(body)});
test('real-name characters, diverse email providers and local/international phone formats',()=>{
 for(const name of ['María-José O’Prueba',"QA D'Ensayo",'  José   Muñoz  ','李 明','QA J. Prueba'])assert.ok(normalizeName(name));
 for(const email of ['qa+tag@example.invalid','qa@example.technology','qa@sub.example.cl',"qa.o'prueba@example.test"])assert.ok(normalizeEmail(email));
 for(const value of ['900000000','9 0000 0000','+56 (9) 0000-0000','56900000000','0056 9 0000 0000'])assert.equal(normalizePhone(value),'+56900000000');
 for(const value of ['+1 202 555 0100','+44 1632 960000','0034 600 000 000','+354 555 0100'])assert.ok(normalizePhone(value));
 assert.deepEqual(validateCommercialFields(base),{});
});
test('each missing or malformed field is rejected by both actual API handlers before transport',async()=>{
 const invalid={nombre:[undefined,'',' ','12345','<svg>','A','QA\nBcc: test'],rut:[undefined,'','1000005-1','1.00.005-K','K'],correo:[undefined,'','qa','qa@@example.invalid','qa..test@example.invalid','qa@-example.cl','qa@example.invalid\nBcc:x'],telefono:[undefined,'','123','+56 123','++56900000000','56+900000000','abc','+1234567890123456']};
 const before=sent.length;
 for(const [field,values] of Object.entries(invalid))for(const value of values){
  const payload={...base,[field]:value},copy=JSON.stringify(payload);assert.ok(validateCommercialFields(payload)[field]);
  for(const [route,handler] of routes){const response=await handler.fetch(req(route,payload));assert.equal(response.status,400,route+':'+field);const result=await response.json();assert.ok(result.fieldErrors[field]);assert.ok(!JSON.stringify(result).includes(base.correo));assert.ok(!JSON.stringify(result).includes(base.rut));}
  assert.equal(JSON.stringify(payload),copy);
 }
 assert.equal(sent.length,before);
});
test('correction preserves all four normalized fields in existing destination without PII in acknowledgement',async()=>{
 for(const [route,handler] of routes){
  const bad=await handler.fetch(req(route,{...base,rut:'1000005-1'}));assert.equal(bad.status,400);
  const response=await handler.fetch(req(route,base));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
  const email=sent.at(-1),fields=normalizedCommercialFields(base);
  for(const value of Object.values(fields)){assert.ok(email.text.includes(value));assert.ok(!email.subject.includes(value));}
  assert.equal(email.reply_to,base.correo);assert.deepEqual(email.to,['contacto@sollahms.cl']);
 }
});
test('all advisory intents retain the four fields and no obsolete selector can bypass required data',async()=>{
 for(const solicitud of ['asesoria','informacion','cotizacion','llamada']){
  const response=await routes[0][1].fetch(req('advisory',{...base,solicitud,proyecto:'pintor-cicarelli-i'}));assert.equal(response.status,200);
  const text=sent.at(-1).text;assert.ok(text.includes('Pintor Cicarelli I'));assert.ok(text.includes('Tipo de solicitud:'));assert.ok(text.includes('Correo:'));assert.ok(text.includes('Teléfono:'));
 }
 const before=sent.length;
 for(const medio of ['correo','telefono'])for(const patch of [{rut:''},{correo:''},{telefono:''}])assert.equal((await routes[0][1].fetch(req('advisory',{...base,...patch,medio}))).status,400);
 assert.equal(sent.length,before);
});
