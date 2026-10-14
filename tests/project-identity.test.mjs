import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import catalogue from '../data/proyectos.json' with { type: 'json' };
import financial from '../data/hipotecario.json' with { type: 'json' };
import { resolveProjectIdentity } from '../assets/js/project-identity.mjs';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { normalizeRut, RUT_ERROR } from '../assets/js/rut.mjs';
import { createContactHandler } from '../api/contact.mjs';
import booking from '../api/booking-create.mjs';
import { projects, projectAliases } from '../lib/project-context.mjs';

const NOW = Date.parse('2026-10-13T15:00:00Z');
const RETIRED = ['bosquemar','altos-del-wayra','robles-del-aconcagua','el-real','edificio-ha-strip-center'];
const ALIASES = ['nucleo-costanera-2','ferroparque-2','terratolten-1','terratolten-2',
  'terratolten-3','lomas-de-puyai-3','alto-san-joaquin-2','alto-san-joaquin-3'];
const contactBody = {nombre:'Cliente de prueba',correo:'qa@identity.test.invalid',telefono:'+56900000000',
  rut:'1.000.005-K',mensaje:'Consulta de prueba sobre una etapa.',website:''};
const bookingBody = {date:'2030-01-07',time:'10:00',nombre:'Cliente',apellido:'Prueba',
  correo:'qa@identity.test.invalid',telefono:'+56900000000',website:''};
const request = (path,body) => new Request('https://sollahms.cl/api/'+path,
  {method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl'},body:JSON.stringify(body)});

test('118 other projects and the ten single Ecasa projects preserve their catalogue context', () => {
  const unchanged=catalogue.filter(project=>project.inmobiliaria!=='Ecasa'||project.etapasComerciales.length===1);
  assert.equal(unchanged.length,128);
  for(const project of unchanged) {
    const identity=resolveProjectIdentity(catalogue,project.slug);
    for(const [key,value] of Object.entries(project)) assert.deepEqual(identity[key],value,project.slug+': '+key);
    assert.equal(identity.bodyProjectSlug,project.slug);
    assert.equal(identity.contextQuery,'?proyecto='+project.slug);
    assert.doesNotMatch(identity.nombre,/ · Etapa 1$/);
  }
});

test('all eight old stage URLs resolve to the same snapshot as canonical project plus etapa', () => {
  assert.deepEqual(Object.keys(projectAliases).sort(),ALIASES.slice().sort());
  for(const alias of ALIASES) {
    const root=catalogue.find(project=>project.etapasComerciales?.some(stage=>stage.slug===alias));
    const stage=root.etapasComerciales.find(stage=>stage.slug===alias);
    const legacy=resolveProjectIdentity(catalogue,alias);
    const canonical=resolveProjectIdentity(catalogue,root.slug,String(stage.etapa));
    assert.equal(legacy.nombre,root.nombre+' · Etapa '+stage.etapa);
    assert.equal(legacy.detalleUrl,stage.detalleUrl);
    assert.equal(legacy.bodyProjectSlug,alias);
    assert.equal(legacy.requestedSlug,alias);
    assert.equal(legacy.contextQuery,'?proyecto='+root.slug+'&etapa='+stage.etapa);
    for(const key of ['precioDesdeUF','verificacion','estado','entrega','tipologias','amenities','direccion','superficieDesdeM2']) {
      assert.deepEqual(legacy[key],stage[key],alias+': own '+key);
      assert.deepEqual(canonical[key],stage[key],alias+': canonical '+key);
    }
    assert.equal(canonical.requestedSlug,root.slug);
    assert.equal(canonical.bodyProjectSlug,alias);
  }
});

test('Terratoltén defaults to its verified third stage while stages one and two never inherit its price', () => {
  const root=resolveProjectIdentity(catalogue,'terratolten');
  assert.equal(root.nombre,'Terratoltén · Etapa 3');
  assert.equal(root.precioDesdeUF,2390);
  assert.equal(root.bodyProjectSlug,'terratolten');
  assert.equal(root.originCommercialSlug,'terratolten-3');
  assert.equal(root.detalleUrl,'/terratolten.html#etapa-3');
  assert.equal(verifiedProjectPrice(root,new Date(NOW)).valueUf,2390);
  for(const etapa of [1,2]) {
    const identity=resolveProjectIdentity(catalogue,'terratolten',etapa);
    assert.equal(identity.precioDesdeUF,null);
    assert.equal(verifiedProjectPrice(identity,new Date(NOW)),null);
    assert.equal(identity.bodyProjectSlug,'terratolten-'+etapa);
  }
  for(const project of catalogue.filter(project=>project.etapasComerciales?.length>1&&project.slug!=='terratolten')) {
    const identity=resolveProjectIdentity(catalogue,project.slug);
    assert.equal(identity.originCommercialSlug,project.etapaReferenciaSlug);
    assert.equal(identity.nombre,project.nombre+' · Etapa 1');
    assert.equal(identity.bodyProjectSlug,project.slug);
  }
});

test('retired names, arbitrary slugs, malformed stages and conflicting alias stages cannot resolve', () => {
  for(const slug of [...RETIRED,'unknown-project','__proto__','constructor',' Terratolten','terratolten/3']) {
    assert.equal(resolveProjectIdentity(catalogue,slug),null,slug);
  }
  for(const etapa of ['',0,-1,'01','3x','99',false,{},NaN]) {
    assert.equal(resolveProjectIdentity(catalogue,'terratolten',etapa),null,String(etapa));
  }
  assert.equal(resolveProjectIdentity(catalogue,'terratolten-1','3'),null);
  assert.equal(resolveProjectIdentity(catalogue,'wayra','2'),null);
  const changed=structuredClone(catalogue);
  changed.find(project=>project.slug==='terratolten').etapasComerciales[0].detalleUrl='https://untrusted.invalid/';
  assert.equal(resolveProjectIdentity(changed,'terratolten-1'),null);
});

test('canonical identities win over alias lookup and resolution does not mutate the catalogue', () => {
  const before=JSON.stringify(catalogue);
  const ordinary={slug:'terratolten-1',nombre:'Proyecto de otra inmobiliaria',inmobiliaria:'Otra',
    detalleUrl:'/terratolten-1.html',precioDesdeUF:7000};
  const result=resolveProjectIdentity([...catalogue,ordinary],ordinary.slug);
  assert.equal(result.nombre,ordinary.nombre);
  assert.equal(result.precioDesdeUF,7000);
  assert.equal(result.canonicalSlug,ordinary.slug);
  assert.equal(result.explicitStage,false);
  ALIASES.forEach(alias=>resolveProjectIdentity(catalogue,alias));
  assert.equal(JSON.stringify(catalogue),before);
});

test('contact derives trusted stage names from its public snapshots and rejects withdrawn identities', async () => {
  const calls=[];
  const names={
    'nucleo-costanera-2':'Núcleo Costanera · Etapa 2', 'ferroparque-2':'FerroParque · Etapa 2',
    'terratolten-1':'Terratoltén · Etapa 1', 'terratolten-2':'Terratoltén · Etapa 2',
    'terratolten-3':'Terratoltén · Etapa 3', 'lomas-de-puyai-3':'Lomas de Puyai · Etapa 3',
    'alto-san-joaquin-2':'Alto San Joaquín · Etapa 2', 'alto-san-joaquin-3':'Alto San Joaquín · Etapa 3',
    'terratolten':'Terratoltén · Etapa 3', 'nucleo-costanera':'Núcleo Costanera · Etapa 1',
  };
  const handler=createContactHandler({now:()=>NOW,getEnvironment:()=> 'test',getApiKey:()=> 'synthetic-key',
    fetchImpl:async(_url,options)=>{calls.push(JSON.parse(options.body));return new Response('{"id":"synthetic-accepted"}',{status:200});}});
  for(const proyecto of [...ALIASES,'terratolten','nucleo-costanera']) {
    assert.equal((await handler.fetch(request('contact',{...contactBody,proyecto}))).status,200);
    assert.equal(calls.at(-1).subject,'Consulta sobre '+names[proyecto]);
    assert.ok(calls.at(-1).text.includes('Identificador: '+proyecto));
  }
  const count=calls.length;
  for(const proyecto of [...RETIRED,'arbitrary-stage']) {
    const response=await handler.fetch(request('contact',{...contactBody,proyecto}));
    assert.equal(response.status,400);
    assert.equal((await response.json()).code,'invalid_project');
  }
  assert.equal(calls.length,count);
});

test('the contact API refuses a parent catalogue quote for an unpriced stage, before any provider access', async () => {
  let providerCalls=0;
  const handler=createContactHandler({now:()=>NOW,mortgageDataset:financial,getEnvironment:()=> 'preview',
    getApiKey:()=>{throw new Error('Preview must not read credentials');},
    fetchImpl:async()=>{providerCalls++;throw new Error('No external write allowed');}});
  const body={...contactBody,consent:true,startedAt:NOW-5000,
    mortgage:{propertyUf:2390,downPaymentPercent:20,years:25,annualRatePercent:4.5,rateConvention:'nominal',
      bankId:null,simulatedAt:new Date(NOW-1000).toISOString(),location:'other',propertyValueOrigin:'catalogue'}};
  for(const proyecto of ['terratolten-1','terratolten-2']) {
    const response=await handler.fetch(request('contact',{...body,proyecto}));
    assert.equal(response.status,400);
    assert.match((await response.json()).error,/precio del catálogo no está verificado/);
  }
  for(const proyecto of ['terratolten','terratolten-3']) {
    const response=await handler.fetch(request('contact',{...body,proyecto}));
    assert.equal(response.status,503);
    assert.equal((await response.json()).code,'preview_read_only');
  }
  assert.equal(providerCalls,0);
});

test('booking forwards the eight trusted legacy names and preserves canonical names without new payload keys', async t => {
  const previous={fetch:globalThis.fetch,url:process.env.BOOKING_BACKEND_URL,secret:process.env.BOOKING_SECRET,environment:process.env.VERCEL_ENV};
  const calls=[];
  process.env.BOOKING_BACKEND_URL='https://booking.identity.test.invalid';
  process.env.BOOKING_SECRET='synthetic-key';
  delete process.env.VERCEL_ENV;
  globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return new Response('{"ok":true,"booked":true,"available":true}',{status:200});};
  t.after(()=>{
    globalThis.fetch=previous.fetch;
    for(const [key,value] of [['BOOKING_BACKEND_URL',previous.url],['BOOKING_SECRET',previous.secret],['VERCEL_ENV',previous.environment]]) {
      if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
  });
  for(const proyecto of [...ALIASES,'terratolten']) {
    assert.equal((await booking.fetch(request('booking-create',{...bookingBody,proyecto}))).status,200);
    assert.equal(calls.at(-1).proyecto,proyecto);
    assert.equal(calls.at(-1).nombreProyecto,(projects[proyecto]??projectAliases[proyecto]).name);
    assert.deepEqual(Object.keys(calls.at(-1)).sort(),['action','date','time','nombre','apellido','correo','telefono','proyecto','nombreProyecto','secret'].sort());
  }
  const count=calls.length;
  for(const proyecto of [...RETIRED,'arbitrary-stage','__proto__']) {
    assert.equal((await booking.fetch(request('booking-create',{...bookingBody,proyecto}))).status,400);
  }
  assert.equal(calls.length,count);
  process.env.VERCEL_ENV='preview';
  const response=await booking.fetch(request('booking-create',{...bookingBody,proyecto:'nucleo-costanera-2'}));
  assert.equal(response.status,503);
  assert.equal((await response.json()).code,'preview_read_only');
  assert.equal(calls.length,count);
});

test('contact page preserves the selected stage in its canonical agenda link and POST identity', async () => {
  const html=readFileSync(new URL('../contacto.html',import.meta.url),'utf8');
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import[^\n]+\n/gm,'');
  class Element {
    constructor(){this.listeners={};this.value='';this.hidden=false;}
    addEventListener(event,listener){this.listeners[event]=listener;}
    setCustomValidity(){} setAttribute(){} focus(){}
  }
  for(const query of ['?proyecto=terratolten-1','?proyecto=terratolten&etapa=1']) {
    const fields=Object.fromEntries(Object.entries(contactBody).map(([key,value])=>[key,Object.assign(new Element(),{value})]));
    const button=new Element(),status=new Element(),context=new Element(),error=new Element(),form=new Element();
    form.querySelector=()=>button; form.reset=()=>{};
    const agenda=[new Element(),new Element()];
    const elements={'contact-form':form,'form-status':status,rut:fields.rut,'rut-error':error,'contact-project-context':context};
    const posts=[];
    class MockFormData { [Symbol.iterator](){return Object.entries(fields).map(([key,field])=>[key,field.value])[Symbol.iterator]();} }
    vm.runInNewContext(script,{document:{getElementById:id=>elements[id],querySelectorAll:()=>agenda},
      window:{location:{search:query}},URLSearchParams,FormData:MockFormData,normalizeRut,RUT_ERROR,resolveProjectIdentity,
      fetch:async(url,options)=>url==='/data/proyectos.json'?{ok:true,json:async()=>catalogue}
        :(posts.push(JSON.parse(options.body)),{ok:false,json:async()=>({code:'preview_read_only',error:'Preview de prueba'})})});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(context.textContent,'Estás consultando por Terratoltén · Etapa 1.');
    assert.ok(agenda.every(link=>link.href==='/agenda-asesoria.html?proyecto=terratolten&etapa=1'));
    await form.listeners.submit({preventDefault(){}});
    assert.equal(posts[0].proyecto,'terratolten-1');
    assert.equal(status.textContent,'Preview de prueba');
  }
});
