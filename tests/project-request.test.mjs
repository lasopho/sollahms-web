import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {composeProjectRequest,validateProjectRequest} from '../assets/js/project-request.mjs';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import {createFormOperation} from '../assets/js/form-operation.mjs';
import {createAdvisoryHandler} from '../api/advisory.mjs';

const catalogue=JSON.parse(await readFile(new URL('../data/proyectos.json',import.meta.url)));
const captured=[];
globalThis.fetch=()=>{throw Error('External transport is forbidden in this isolated test');};
const handler=createAdvisoryHandler({getApiKey:()=> 'isolated-test',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production',fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');captured.push({key:options.headers['Idempotency-Key'],email:JSON.parse(options.body)});
  return Response.json({id:'isolated-'+captured.length});
}});
const synthetic={nombre:'Prueba sintética',medio:'correo',correo:'qa@example.invalid',telefono:'+56 9 0000 0000',objetivo:'',mensaje:'Consulta de prueba',consent:true,website:''};
const identity=slug=>resolveProjectIdentity(catalogue,slug);
const payload=(options={})=>composeProjectRequest({values:synthetic,project:identity('pintor-cicarelli-i'),intent:'cotizacion',startedAt:Date.now()-5000,...options});
const request=(body)=>new Request('https://sollahms.cl/api/advisory',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':`sollahms-v1-${Date.now()}-${randomUUID()}`},body:JSON.stringify(body)});

test('all live projects retain a server-recognized identity and canonical origin',async()=>{
  for(const item of catalogue){
    const project=identity(item.slug),body=payload({project});
    const result=await handler.fetch(request(body));assert.equal(result.status,200,item.slug);
    assert.deepEqual(await result.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
    const email=captured.at(-1).email;assert.deepEqual(email.to,['contacto@sollahms.cl']);assert.equal(email.from,'Sollahms Web <formularios@forms.sollahms.cl>');
    assert.ok(email.text.includes('Ficha de origen: https://sollahms.cl'+project.detalleUrl));assert.ok(email.text.includes('Identificador: '+body.proyecto));
    assert.equal(email.reply_to,synthetic.correo);assert.ok(!email.text.includes('Teléfono:'));
  }
});
test('explicit commercial stages stay associated with their own published context',async()=>{
  for(const item of catalogue)for(const stage of item.etapasComerciales||[]){
    const number=stage.etapa??Number(stage.detalleUrl.split('#etapa-')[1]);
    const project=resolveProjectIdentity(catalogue,item.slug,number),body=payload({project});
    assert.equal(body.proyecto,stage.slug);assert.ok(body.mensaje.includes(stage.detalleUrl));
    assert.equal((await handler.fetch(request(body))).status,200);
  }
});
test('call collects name and phone only; time is explicitly a preference',async()=>{
  const body=payload({intent:'llamada',values:{...synthetic,franja:'Tardes'}});
  assert.equal(body.correo,undefined);assert.equal(body.medio,'telefono');assert.match(body.mensaje,/Horario preferido \(no es una reserva\): Tardes/);
  assert.equal((await handler.fetch(request(body))).status,200);assert.equal(captured.at(-1).email.reply_to,undefined);
});
test('quote may also use phone without email',()=>{const body=payload({values:{...synthetic,medio:'telefono'}});assert.equal(body.correo,undefined);assert.equal(body.telefono,synthetic.telefono);});
test('optional goal/message/time may be omitted',()=>{const body=payload({values:{...synthetic,mensaje:'',objetivo:''}});assert.equal(body.objetivo,'');assert.match(body.mensaje,/Solicitar cotización/);assert.ok(!body.mensaje.includes('Horario'));});
test('name, chosen contact and consent are required, without asking for RUT',()=>{
  for(const [field,values,intent] of [['nombre',{...synthetic,nombre:''},'cotizacion'],['correo',{...synthetic,correo:'incorrecto'},'cotizacion'],['telefono',{...synthetic,telefono:'123'},'llamada'],['consent',{...synthetic,consent:false},'cotizacion']])assert.ok(validateProjectRequest(values,intent)[field]);
  assert.deepEqual(validateProjectRequest(synthetic,'cotizacion'),{});assert.ok(!('rut' in payload()));
});
test('server validation and preview protections still reject without sending',async()=>{
  const before=captured.length;
  for(const patch of [{proyecto:'no-existe'},{consent:false},{nombre:''},{website:'spam'},{rut:'123'}])assert.equal((await handler.fetch(request({...payload(),...patch}))).status,400);
  const preview=createAdvisoryHandler({getEnvironment:()=> 'preview',fetchImpl:()=>{throw Error('Must not send');}});
  assert.equal((await preview.fetch(request(payload()))).status,503);assert.equal(captured.length,before);
});
test('an uncertain result cannot be presented as successful delivery',async()=>{
  const uncertain=createAdvisoryHandler({getApiKey:()=> 'isolated',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production',fetchImpl:async()=>{throw Error('isolated timeout');}});
  const result=await uncertain.fetch(request(payload()));assert.equal(result.status,502);assert.equal((await result.json()).ok,false);
});
test('retry keeps identity and payload; changing intent after uncertainty is blocked',async()=>{
  const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  const first=createFormOperation({name:'project-request:test',storage}),body=payload(),one=await first.prepare(body);first.uncertain();
  const two=await createFormOperation({name:'project-request:test',storage}).prepare({...body,startedAt:Date.now()});assert.equal(one.key,two.key);assert.equal(one.body,two.body);
  await assert.rejects(first.prepare(payload({intent:'llamada'})));assert.ok(!JSON.stringify([...saved]).includes('qa@example.invalid'));
});
test('bounded message cannot overflow the existing contract',()=>{
  assert.ok(payload({values:{...synthetic,mensaje:'x'.repeat(1600),franja:'y'.repeat(100)},intent:'llamada'}).mensaje.length<=2000);
  assert.throws(()=>payload({values:{...synthetic,mensaje:'x'.repeat(1601)}}));
  assert.throws(()=>payload({project:null}));
});
