import test from 'node:test';
import assert from 'node:assert/strict';
import { orientBudget, compareQuotes, benefitGuide, cleanChecklist, CHECKLIST, JOURNEY } from '../assets/js/orientation-engine.mjs';
import { calculateMortgage } from '../assets/js/mortgage-engine.mjs';
import { createOrientationContactHandler } from '../api/orientation-contact.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const base={income:2000000,debt:100000,savings:20000000,monthlySavings:200000,horizon:12,uf:40000,burden:25,down:20,years:25,rate:4.5,convention:'effective'};
test('budget is the minimum of independent savings and monthly-payment constraints',()=>{
 const r=orientBudget(base),m=calculateMortgage({propertyUf:r.maxPriceUf,downPaymentPercent:20,years:25,annualRatePercent:4.5,rateConvention:'effective'});
 assert.equal(r.monthlyBudget,400000);assert.equal(r.savingsUf,560);assert.equal(r.maxBySavings,2800);
 assert.ok(m.monthlyPaymentUf*40000<=400000.000001);assert.ok(m.downPaymentUf<=560.000001);
 assert.equal(r.maxPriceUf,Math.min(r.maxByPayment,2800));
});
test('zero-rate inversion agrees with independent capital-over-months arithmetic',()=>{
 const r=orientBudget({...base,rate:0,savings:100000000,monthlySavings:0});assert.equal(r.maxByPayment,3750);
 assert.equal(r.maxPriceUf,3750);assert.equal(r.paymentUf,10);assert.equal(r.downUf,750);
});
test('zero savings and debt beyond the budget fail safely without NaN',()=>{
 for(const input of [{...base,savings:0,monthlySavings:0},{...base,debt:1000000}]){const r=orientBudget(input);assert.equal(r.maxPriceUf,0);assert.equal(r.paymentUf,0);assert.ok(Object.values(r).filter(v=>typeof v==='number').every(Number.isFinite));}
});
test('budget rejects malformed, negative, nonfinite, wrong conventions and fractional month inputs',()=>{
 for(const [key,value] of [['income',0],['debt',-1],['savings',NaN],['monthlySavings',Infinity],['horizon',1.5],['uf',0],['burden',50],['rate',26],['years',5.5],['down',0],['convention','guess']]) assert.throws(()=>orientBudget({...base,[key]:value}),RangeError);
});
test('greater debt cannot increase affordability and greater savings cannot lower it',()=>{
 const normal=orientBudget(base);assert.ok(orientBudget({...base,debt:200000}).maxPriceUf<=normal.maxPriceUf);assert.ok(orientBudget({...base,savings:40000000}).maxPriceUf>=normal.maxPriceUf);
});
test('quote comparison matches engine and treats negative differences and zero rate correctly',()=>{
 const r=compareQuotes({price:3000,down:20,years:25,convention:'nominal',rateA:0,rateB:5});assert.equal(r.a.monthlyPaymentUf,8);assert.equal(r.a.totalInterestUf,0);assert.ok(r.monthlyDifferenceUf<0);assert.equal(r.interestDifferenceUf,-r.b.totalInterestUf);
});
const benefit={price:6000,condition:'new',promise:'2024-12-31',novation:'no'};
test('benefit guide uses revised 6000 UF boundary and never grants eligibility',()=>{
 assert.equal(benefitGuide(benefit,'2026-10-31').state,'potential');assert.equal(benefitGuide({...benefit,price:6000.01},'2026-10-31').state,'outside');
 assert.match(benefitGuide(benefit,'2026-10-31').message,/no confirma elegibilidad/);
});
test('used housing, early promises, novations and unknown conditions remain distinct',()=>{
 for(const diff of [{condition:'used'},{promise:'2024-12-30'},{novation:'yes'}]) assert.equal(benefitGuide({...benefit,...diff},'2026-10-31').state,'outside');
 for(const diff of [{condition:'unknown'},{promise:''},{novation:'unknown'}]) assert.equal(benefitGuide({...benefit,...diff},'2026-10-31').state,'pending');
});
test('benefit freshness fails closed before review, after expiry and after programme end',()=>{
 for(const day of ['2026-10-30','2026-12-01','2028-06-01'])assert.equal(benefitGuide(benefit,day).state,'review');assert.equal(benefitGuide(benefit,'2026-11-30').state,'potential');
});
test('benefit dates reject nonexistent, future and malformed calendar dates',()=>{
 for(const promise of ['2026-02-30','2026-11-01','bad','2026-13-01'])assert.throws(()=>benefitGuide({...benefit,promise},'2026-10-31'));
 assert.throws(()=>benefitGuide(benefit,'2026-02-30'));assert.throws(()=>benefitGuide({...benefit,price:NaN},'2026-10-31'));
});
test('checklist sanitization accepts only unique known IDs and journey routes are local',()=>{
 assert.deepEqual(cleanChecklist(['budget','budget','<script>','renta','delivery',null]),['budget','delivery']);assert.deepEqual(cleanChecklist({}),[]);assert.equal(CHECKLIST.length,8);assert.equal(JOURNEY.length,6);assert.ok(JOURNEY.every(s=>/^[/#]/.test(s.href)));
});
const now=Date.parse('2026-10-31T18:00:00Z');
const payload={nombre:'Persona de prueba',correo:'prueba@example.invalid',telefono:'+56900000000',rut:'12.345.678-5',mensaje:'Consulta sintética, no enviar.',website:'',consent:true,startedAt:now-10000};
function request(body=payload,headers={},method='POST'){return new Request('https://sollahms.cl/api/orientation-contact',{method,headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});}
function fixture(extra={}){let calls=0;const handler=createOrientationContactHandler({getDeliveryMode:()=> 'resend',now:()=>now,getEnvironment:()=> 'preview',getApiKey:()=>{throw new Error('Preview must not read a key');},fetchImpl:async()=>{calls++;throw new Error('No real provider');},...extra});return {handler,calls:()=>calls};}
test('orientation endpoint requires positive consent and timing before transport',async()=>{
 const f=fixture();for(const diff of [{consent:false},{consent:undefined},{consent:'true'},{startedAt:now},{startedAt:now+1},{startedAt:now-86400001}])assert.equal((await f.handler.fetch(request({...payload,...diff}))).status,400);assert.equal(f.calls(),0);
});
test('orientation endpoint inherits Preview read-only and never reads credentials',async()=>{
 const f=fixture();const r=await f.handler.fetch(request());assert.equal(r.status,503);assert.equal((await r.json()).code,'preview_read_only');assert.equal(f.calls(),0);
});
test('orientation endpoint rejects cross origin, non JSON, wrong methods and malformed bodies',async()=>{
 const f=fixture();for(const [r,expected] of [[request(payload,{Origin:'https://evil.invalid'}),403],[request(payload,{'Content-Type':'text/plain'}),415],[request(payload,{},'GET'),405],[request('{'),400],[request('null'),400],[request('x'.repeat(32769)),413]]) assert.equal((await f.handler.fetch(r)).status,expected);assert.equal(f.calls(),0);
});
test('orientation endpoint rejects financial context and unknown fields',async()=>{
 const f=fixture();for(const diff of [{mortgage:{}},{proyecto:'foo'},{renta:10000},{income:1000}])assert.equal((await f.handler.fetch(request({...payload,...diff}))).status,400);assert.equal(f.calls(),0);
});
test('orientation endpoint delegates synthetic success with the existing idempotency key',async()=>{
 let received;const f=fixture({getEnvironment:()=> 'local-qa',getApiKey:()=> 'synthetic-only',fetchImpl:async(url,options)=>{received={url,options};return Response.json({id:'synthetic-only'});}});
 const r=await f.handler.fetch(request(payload,{'Idempotency-Key':`sollahms-v1-${now}-12345678-1234-4123-8123-123456789abc`}));
 assert.equal(r.status,200);assert.equal((await r.json()).ok,true);assert.ok(received);assert.equal(received.url,'https://api.resend.com/emails');assert.ok(!JSON.stringify(received).includes('monthlySavings'));
});
test('new page and endpoint contain explicit consent, no inline scripts and shared mathematics',()=>{
 const html=readFileSync(new URL('../centro-orientacion.html',import.meta.url),'utf8'),script=readFileSync(new URL('../assets/js/orientacion.mjs',import.meta.url),'utf8');
 assert.match(html,/name="consent" required/);assert.equal((html.match(/<fieldset disabled data-interactive>/g)||[]).length,4);assert.match(html,/action="\/api\/orientation-contact"/);assert.doesNotMatch(html,/<script(?![^>]*src=)[^>]*>/);assert.doesNotMatch(script,/\.innerHTML\s*=/);assert.match(script,/attempt\.key/);assert.match(script,/operation\.uncertain/);
});


test('current four-field commercial policy rejects missing or invalid identification without transport',async()=>{const f=fixture();for(const field of ['nombre','rut','correo','telefono'])assert.equal((await f.handler.fetch(request({...payload,[field]:''}))).status,400);for(const diff of [{rut:'12.345.678-9'},{telefono:'123'},{nombre:'<script>'}])assert.equal((await f.handler.fetch(request({...payload,...diff}))).status,400);assert.equal(f.calls(),0);});
