import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createAcquisitionSession, ACQUISITION_KEY } from '../assets/js/acquisition.mjs';
import { normalizeAcquisition, UTM_FIELDS, UUID } from '../assets/js/acquisition-contract.mjs';
import { createFormOperation } from '../assets/js/form-operation.mjs';
import { acquisitionTags, crmAcquisitionContext } from '../lib/acquisition-server.mjs';
import { createAdvisoryHandler } from '../api/advisory.mjs';
import { createCollaborationHandler } from '../api/collaboration.mjs';
import { createContactHandler } from '../api/contact.mjs';
import { createOrientationContactHandler } from '../api/orientation-contact.mjs';
import { decodeAcquisitionTags as decode } from '../scripts/decode-acquisition-tags.mjs';

const memory = () => { const map = new Map(); return { getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map }; };
const loc = (path='/guia-hipotecaria.html', search='') => ({ origin:'https://sollahms.cl',pathname:path,search });
const time = Date.now();
const query = '?utm_source=google&utm_medium=organic&utm_campaign=educación&utm_content=guia&utm_term=primera+casa&secret=PRIVATE#fragment';
function session(extra={}) { return createAcquisitionSession({ storage:memory(),location:loc(),now:()=>time,...extra }); }
test('no UTM/referrer remains null; no inference of direct traffic',()=>{
  const a=session().snapshot('/contacto.html',randomUUID());assert.equal(a.referrer_origin,null);
  for(const key of UTM_FIELDS)assert.equal(a[key],null);assert.equal(a.landing_path,'/guia-hipotecaria.html');
});
for(const host of ['www.google.com','www.bing.com','chatgpt.com','www.perplexity.ai','gemini.google.com'])test('external origin only: '+host,()=>{
  const storage=memory(),a=session({storage,referrer:`https://${host}/private?q=secret#fragment`}).snapshot('/contacto.html',randomUUID());
  assert.equal(a.referrer_origin,'https://'+host);assert.ok(!storage.getItem(ACQUISITION_KEY).includes('secret'));
});
test('five UTMs preserved; arbitrary query and fragments never stored',()=>{
  const storage=memory(),a=session({storage,location:loc('/guia-hipotecaria.html',query.split('#')[0])}).snapshot('/contacto.html',randomUUID());
  assert.deepEqual(UTM_FIELDS.map(k=>a[k]),['google','organic','educación','guia','primera casa']);
  assert.ok(!JSON.stringify([...storage.map]).includes('PRIVATE'));assert.equal(a.landing_path,'/guia-hipotecaria.html');
});
test('internal navigation, reload and later campaigns cannot overwrite first touch',()=>{
  const storage=memory();session({storage,location:loc('/', '?utm_source=google'),referrer:'https://www.google.com/search?q=x'});
  const a=session({storage,location:loc('/contacto.html','?utm_source=other'),referrer:'https://sollahms.cl/'}).snapshot('/contacto.html',randomUUID());
  assert.equal(a.landing_path,'/');assert.equal(a.utm_source,'google');assert.equal(a.referrer_origin,'https://www.google.com');assert.equal(a.submission_path,'/contacto.html');
});
test('new session does not reuse prior acquisition',()=>{
  session({location:loc('/','?utm_source=old')});const a=session().snapshot('/contacto.html',randomUUID());assert.equal(a.utm_source,null);assert.equal(a.landing_path,'/guia-hipotecaria.html');
});
test('internal referrer is null, including www alias',()=>{
  for(const referrer of ['https://sollahms.cl/','https://www.sollahms.cl/contacto.html'])assert.equal(session({referrer}).snapshot('/',randomUUID()).referrer_origin,null);
});
test('invalid strings, nested values, secrets, duplicate parameters and paths are discarded',()=>{
  for(const value of ['x'.repeat(97),'<script>bad</script>','a@example.com','token\nvalue','12345678-9','https://evil.invalid',{blob:'x'}])assert.equal(normalizeAcquisition({utm_source:value}).utm_source,null);
  const a=normalizeAcquisition({landing_path:'/contacto.html?token=secret',submission_path:'//evil.invalid',referrer_origin:'javascript:alert(1)',gclid:'<bad>',msclkid:'no',captured_at:'2026-02-30T00:00:00.000Z',unknown:'secret'});
  for(const k of ['landing_path','submission_path','referrer_origin','gclid','msclkid','captured_at'])assert.equal(a[k],null);assert.ok(!Object.hasOwn(a,'unknown'));
  assert.equal(session({location:loc('/','?utm_source=one&utm_source=two')}).snapshot('/',randomUUID()).utm_source,null);
});
test('blocked/malformed acquisition storage falls back without preventing capture',()=>{
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(session({storage:blocked}).snapshot('/contacto.html',randomUUID()).landing_path,'/guia-hipotecaria.html');
  const storage=memory();storage.setItem(ACQUISITION_KEY,'invalid');assert.equal(session({storage}).snapshot('/',randomUUID()).landing_path,'/guia-hipotecaria.html');
});
test('one UUID per request, stable retry body after reload/navigation, new UUID after completion',async()=>{
  const storage=memory(),first=session({location:loc('/','?utm_source=google')});const options={name:'test',storage,acquire:id=>first.snapshot('/contacto.html',id)};
  const op=createFormOperation(options),body={nombre:'Synthetic',startedAt:time-5000};const a=await op.prepare(body);
  const id=JSON.parse(a.body).acquisition.request_id;assert.match(id,UUID);assert.ok(a.key.endsWith(id));
  const replay=createFormOperation({...options,acquire:()=>{throw Error('must not recapture');}});const b=await replay.prepare({...body,startedAt:time});assert.equal(a.body,b.body);assert.equal(a.key,b.key);
  replay.complete();const c=await replay.prepare(body);assert.notEqual(JSON.parse(c.body).acquisition.request_id,id);
});
test('failed attribution and unavailable storage still permit sending with in-memory retries',async()=>{
  const storage={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
  const op=createFormOperation({name:'test',storage,acquire(){throw Error('attribution failure');}});const a=await op.prepare({startedAt:time});const b=await op.prepare({startedAt:time});assert.equal(a.body,b.body);assert.match(JSON.parse(a.body).acquisition.request_id,UUID);
});
test('corrupt retained operation never silently creates a second request',async()=>{
  const storage=memory();storage.setItem('sollahms:operation:v1:test','invalid');
  const op=createFormOperation({name:'test',storage});await assert.rejects(op.prepare({startedAt:time}),/pendiente/);
});
test('legacy contact gets a secure technical UUID and can explicitly reuse it',async()=>{
  const emails=[];const h=createContactHandler({getEnvironment:()=> 'local-qa',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',fetchImpl:async(u,o)=>{emails.push({email:JSON.parse(o.body),key:o.headers['Idempotency-Key']});return Response.json({id:'synthetic'});}});
  const send=acquisition=>h.fetch(new Request('https://sollahms.cl/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...contact,acquisition})}));
  const one=await send(),two=await send();assert.equal(one.status,200);assert.equal(two.status,200);const id=one.headers.get('X-Sollahms-Request-Id');assert.match(id,UUID);assert.notEqual(id,two.headers.get('X-Sollahms-Request-Id'));
  const again=await send({request_id:id});assert.equal(again.headers.get('X-Sollahms-Request-Id'),id);assert.equal(emails[0].key,emails[2].key);assert.deepEqual(emails[0].email,emails[2].email);
});
test('Resend tags round-trip bounded Unicode/context and stay within published limits',()=>{
  const a=normalizeAcquisition({landing_path:'/',submission_path:'/contacto.html',referrer_origin:'https://chatgpt.com',...Object.fromEntries(UTM_FIELDS.map(k=>[k,'界'.repeat(96)])),gclid:'A'.repeat(160),msclkid:'a'.repeat(32),captured_at:new Date(time).toISOString()},{requestId:randomUUID()});
  const tags=acquisitionTags(a);assert.ok(tags.length<=75);for(const t of tags){assert.ok(t.name.length<=256&&t.value.length<=256);assert.match(t.value,/^[A-Za-z0-9_-]+$/);}
  assert.deepEqual(decode(tags),a);assert.deepEqual(crmAcquisitionContext(a),{requestId:a.request_id,acquisition:a});
});

const contact={nombre:'Persona Sintética QA',rut:'12.345.678-5',correo:'qa@example.invalid',telefono:'+56900000000',mensaje:'Solo ensayo aislado.',consent:true,website:'',startedAt:time-5000};
for(const [name,factory,payload] of [
  ['advisory',createAdvisoryHandler,contact],['contact',createContactHandler,contact],['orientation-contact',createOrientationContactHandler,contact],
  ['collaboration',createCollaborationHandler,{tipo:'persona',correo:'qa@example.invalid',telefono:'',consent:true,website:'',startedAt:time-5000}],
]) {
  test(name+': browser→form→validated backend→Resend tags→technical receipt share UUID',async()=>{
    let email,providerKey;const a=session({location:loc('/guia-hipotecaria.html',query.split('#')[0]),referrer:'https://chatgpt.com/private?q=secret'});
    const op=createFormOperation({name,storage:memory(),acquire:id=>a.snapshot('/contacto.html',id)});const attempt=await op.prepare(payload);
    const h=factory({now:()=>time,getDeliveryMode:()=> 'resend',getEnvironment:()=> 'local-qa',getApiKey:()=> 'synthetic-only',fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');email=JSON.parse(opts.body);providerKey=opts.headers['Idempotency-Key'];return Response.json({id:'synthetic-provider-id'});}});
    const r=await h.fetch(new Request('https://sollahms.cl/api/'+name,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':attempt.key},body:attempt.body}));
    assert.equal(r.status,200);const id=JSON.parse(attempt.body).acquisition.request_id;assert.equal(r.headers.get('X-Sollahms-Request-Id'),id);assert.ok(providerKey.endsWith(id));assert.deepEqual(decode(email.tags),JSON.parse(attempt.body).acquisition);assert.ok(!email.text.includes('utm_source'));assert.equal((await r.json()).deliveryConfirmed,false);
  });
  test(name+': missing/malformed acquisition never changes contact acceptance; backend overrides forged UUID',async()=>{
    for(const acquisition of [undefined,null,[],false,'malformed',{request_id:randomUUID(),utm_source:'<script>',landing_path:'https://evil.invalid',arbitrary:'secret'}]){
      let email;const id=randomUUID(),key=`sollahms-v1-${time}-${id}`;const h=factory({now:()=>time,getDeliveryMode:()=> 'resend',getEnvironment:()=> 'local-qa',getApiKey:()=> 'synthetic-only',fetchImpl:async(u,o)=>{email=JSON.parse(o.body);return Response.json({id:'synthetic'});}});
      const r=await h.fetch(new Request('https://sollahms.cl/api/'+name,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({...payload,acquisition})}));
      assert.equal(r.status,200);assert.equal(decode(email.tags).request_id,id);assert.ok(!JSON.stringify(email.tags).includes('secret'));assert.equal(decode(email.tags).utm_source,null);
    }
  });
  test(name+': preview remains read-only, never reads credentials or calls provider',async()=>{
    const h=factory({now:()=>time,getDeliveryMode:()=> 'resend',getEnvironment:()=> 'preview',getApiKey:()=>{throw Error('credential read');},fetchImpl:()=>{throw Error('external call');}});
    const r=await h.fetch(new Request('https://preview.invalid/api/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}));assert.equal(r.status,503);assert.equal((await r.json()).code,'preview_read_only');
  });
}
test('all eleven corporate pages load capture before any internal navigation; no tracker cookies',()=>{
  const names=['index','centro-orientacion','guia-hipotecaria','comparador-hipotecario','cuando-comprar-propiedad','entorno-desarrollo-urbano','proyectos','contacto','agenda-asesoria','trabaja-con-nosotros','privacidad'];
  for(const name of names)assert.equal((readFileSync(new URL('../'+name+'.html',import.meta.url),'utf8').match(/src="\/assets\/js\/acquisition.mjs"/g)||[]).length,1);
  const source=readFileSync(new URL('../assets/js/acquisition.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/document\.cookie|localStorage|fetch\(|sendBeacon/);
});
