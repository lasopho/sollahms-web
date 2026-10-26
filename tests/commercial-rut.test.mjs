import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {normalizeRut,formatRut,RUT_ERROR} from '../assets/js/rut.mjs';
import {bindRutField} from '../assets/js/rut-field.mjs';
import {createAdvisoryHandler} from '../api/advisory.mjs';
import {createContactHandler} from '../api/contact.mjs';
import {composeProjectRequest,validateProjectRequest} from '../assets/js/project-request.mjs';
import {createFormOperation} from '../assets/js/form-operation.mjs';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import catalogue from '../data/proyectos.json' with {type:'json'};
import dataset from '../data/hipotecario.json' with {type:'json'};

// Synthetic vectors only. No real identifiers or outgoing network transport.
globalThis.fetch=()=>{throw Error('External network forbidden');};
const valid=['10.000.000-8','10000000-8','100000008','1.000.005-K','1000005-k','1000005K',' 1000005-k ','14-0'];
const invalid=['10.000.000-1','1000005-X','0-0','10..000.000-8','1.00.005-K','10000000--8','K','999999999-9','<script>','1000005-K\nBcc: x'];
const base={nombre:'QA Rut Sintetico',rut:'1000005-K',correo:'qa@example.invalid',telefono:'+56 9 0000 0000',mensaje:'Solicitud sintética',objetivo:'',consent:true,website:'',startedAt:Date.now()-5000};
const identity=resolveProjectIdentity(catalogue,'pintor-cicarelli-i');
const req=(path,body,key=`sollahms-v1-${Date.now()}-${randomUUID()}`)=>new Request('https://sollahms.cl'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':key},body:JSON.stringify(body)});
const captured=[];
const options={getEnvironment:()=> 'production',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',persistCrmLead:()=>{throw Error('CRM must remain unused');},resolveUf:async()=>dataset.uf,fetchImpl:async(url,o)=>{assert.equal(url,'https://api.resend.com/emails');captured.push({email:JSON.parse(o.body),key:o.headers['Idempotency-Key']});return Response.json({id:'synthetic-only'});}};
const advisory=createAdvisoryHandler(options),contact=createContactHandler(options);
const quote=values=>composeProjectRequest({values:{...base,...values},project:identity,intent:'cotizacion',startedAt:base.startedAt});
test('decimal and K verifier branches; canonical and display formats',()=>{
 for(const v of valid){assert.ok(normalizeRut(v));assert.equal(normalizeRut(formatRut(v)),normalizeRut(v));}
 assert.equal(normalizeRut('1000005k'),'1000005-K');assert.equal(formatRut('1000005k'),'1.000.005-K');
 for(const v of ['', '  '])assert.equal(normalizeRut(v),'');
 for(const v of [...invalid,null,{},123])assert.equal(normalizeRut(v),null);
});
test('both server routes receive normalized required RUT in authorized email body only',async()=>{
 for(const v of valid)for(const [path,handler,body] of [['/api/advisory',advisory,{...base,rut:v,proyecto:identity.bodyProjectSlug}],['/api/contact',contact,{...base,medio:undefined,objetivo:undefined,rut:v,proyecto:identity.bodyProjectSlug}]]){
  const r=await handler.fetch(req(path,body));assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
  const e=captured.at(-1).email;assert.deepEqual(e.to,['contacto@sollahms.cl']);assert.equal(e.from,'Sollahms Web <formularios@forms.sollahms.cl>');
  if(v){const n=normalizeRut(v);assert.ok(e.text.includes('RUT: '+n));assert.ok(e.html.includes(n));assert.ok(!e.subject.includes(n));assert.ok(!captured.at(-1).key.includes(n));}
  else assert.ok(!e.text.includes('RUT:'));
  assert.ok(e.text.includes('Pintor Cicarelli I'));assert.ok(e.text.includes(base.nombre));
 }
});
test('server invalid RUT is rejected without transport, value echo or loss of caller data',async()=>{
 const before=captured.length;
 for(const v of [undefined,'',...invalid,null,{},123])for(const [path,handler,body] of [['/api/advisory',advisory,{...base}],['/api/contact',contact,{...base,medio:undefined,objetivo:undefined}]]){
  const r=await handler.fetch(req(path,{...body,rut:v}));assert.equal(r.status,400);const response=await r.text();if(typeof v==='string'&&v.length>3)assert.ok(!response.includes(v));assert.equal(body.nombre,base.nombre);
 }
 assert.equal(captured.length,before);
});
test('quote and call require RUT and retain both contact channels',async()=>{
 for(const intent of ['cotizacion','llamada']){
  const body=composeProjectRequest({values:{...base,rut:valid[3]},project:identity,intent,startedAt:base.startedAt});
  assert.equal(body.rut,normalizeRut(valid[3]));assert.equal(body.correo,base.correo);assert.equal(body.telefono,'+56900000000');
  assert.equal((await advisory.fetch(req('/api/advisory',body))).status,200);assert.deepEqual(validateProjectRequest({...base,rut:valid[3]},intent),{});
  assert.ok(validateProjectRequest({...base,rut:''},intent).rut);
 }
 assert.equal(validateProjectRequest({...base,rut:invalid[0]},'llamada').rut,RUT_ERROR);
});
test('mortgage receives RUT with its existing simulation and never launches CRM or a credit lookup',async()=>{
 const body={...base,medio:undefined,objetivo:undefined,rut:valid[3],mortgage:{propertyUf:10000,downPaymentPercent:25,years:25,annualRatePercent:4.5,rateConvention:'nominal',bankId:null,simulatedAt:new Date(Date.now()-1000).toISOString(),location:'santiago-metropolitana',propertyValueOrigin:'visitor'}};
 assert.equal((await contact.fetch(req('/api/contact',body))).status,200);
 assert.match(captured.at(-1).email.text,/RUT: 1000005-K/);assert.match(captured.at(-1).email.text,/Dividendo/);
});
test('RUT does not bypass consent, origin, preview, key or channel protections',async()=>{
 const before=captured.length;
 assert.equal((await createAdvisoryHandler({...options,getEnvironment:()=> 'preview'}).fetch(req('/api/advisory',quote({rut:valid[0]})))).status,503);
 assert.equal((await createContactHandler({...options,getEnvironment:()=> 'preview'}).fetch(req('/api/contact',{...base,medio:undefined,objetivo:undefined,rut:valid[0]}))).status,503);
 assert.equal((await advisory.fetch(req('/api/advisory',{...quote({rut:valid[0]}),consent:false}))).status,400);
 assert.equal((await contact.fetch(req('/api/contact',{...base,medio:undefined,objetivo:undefined,rut:valid[0],consent:false}))).status,400);
 const body=quote({rut:valid[0]});const cross=req('/api/advisory',body);cross.headers.set('Origin','https://example.invalid');assert.equal((await advisory.fetch(cross)).status,403);
 const contactBody={...base,medio:undefined,objetivo:undefined,rut:valid[0]};const crossContact=req('/api/contact',contactBody);crossContact.headers.set('Origin','https://example.invalid');assert.equal((await contact.fetch(crossContact)).status,403);
 const noKey=req('/api/advisory',body);noKey.headers.delete('Idempotency-Key');assert.equal((await advisory.fetch(noKey)).status,400);
 assert.equal((await createAdvisoryHandler({...options,getDeliveryMode:()=>undefined}).fetch(req('/api/advisory',body))).status,503);
 assert.equal((await createContactHandler({...options,getDeliveryMode:()=>undefined}).fetch(req('/api/contact',contactBody))).status,503);
 assert.equal(captured.length,before);
});
test('retries retain fingerprint without retaining raw personal fields in browser storage',async()=>{
 const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 const op=createFormOperation({name:'rut-test',storage}),body=quote({rut:valid[3]}),first=await op.prepare(body);op.uncertain();const retry=await op.prepare({...body,startedAt:Date.now()});
 assert.equal(retry.key,first.key);assert.equal(retry.body,first.body);assert.ok(!JSON.stringify([...saved]).includes(body.rut));assert.ok(!JSON.stringify([...saved]).includes(base.correo));await assert.rejects(op.prepare(quote({rut:valid[0]})));
});
test('field normalizes on blur, flags invalid verifier and clears errors while editing',()=>{
 const listeners={},attrs={},input={required:true,value:valid[4],addEventListener:(k,v)=>listeners[k]=v,setAttribute:(k,v)=>attrs[k]=v,setCustomValidity(v){this.validity=v;}},error={};
 const field=bindRutField(input,error);listeners.blur();assert.equal(input.value,'1.000.005-K');assert.equal(field.value(),'1000005-K');
 input.value=invalid[0];assert.equal(field.validate(),false);assert.equal(attrs['aria-invalid'],'true');assert.equal(error.textContent,RUT_ERROR);
 listeners.input();assert.equal(error.hidden,true);assert.equal(input.validity,'');input.value='';assert.equal(field.validate(),false);input.value=valid[0];assert.equal(field.validate(),true);
});
