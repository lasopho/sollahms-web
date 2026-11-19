import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import catalogue from '../data/proyectos.json' with {type:'json'};
import projectIndex from '../data/advisory-projects.json' with {type:'json'};
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import {resolveAdvisoryProject} from '../assets/js/advisory-project-context.mjs';
import {parseCatalogExpansion,loadCatalogExpansion} from '../assets/js/catalog-expansion.mjs';
import {createAdvisoryHandler} from '../api/advisory.mjs';
import {createFormOperation} from '../assets/js/form-operation.mjs';
import {validateCommercialFields,normalizedCommercialFields,focusCommercialField} from '../assets/js/commercial-fields.mjs';
import {bindRutField} from '../assets/js/rut-field.mjs';
import {adviceContext} from '../assets/js/commercial-context.mjs';

// All identities/contact details are synthetic test inputs. Provider transport is
// injected in memory: these tests certify no real acceptance, delivery or booking.
const NOW=Date.parse('2026-11-19T16:00:00.000Z');
const expansionText=await readFile(new URL('../data/catalog-expansion-iris-20261118.json',import.meta.url),'utf8');
const expansion=JSON.parse(expansionText).projects;
const source=await parseCatalogExpansion(expansionText);
const loadExpansion=async()=>source;
const controller=(await readFile(new URL('../assets/js/advisory.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const base={nombre:'QA Contexto Sintético',rut:'1000005-K',correo:'qa@example.invalid',telefono:'+56 9 0000 0000',
  objetivo:'',mensaje:'Consulta sintética sin envío real.',consent:true,website:'',startedAt:NOW-5000};
const identityKeys=['slug','nombre','inmobiliaria','comuna','region','detalleUrl','canonicalSlug','originCommercialSlug',
  'requestedSlug','explicitStage','bodyProjectSlug','contextQuery'].sort();
const legacySlugs=[...new Set(catalogue.flatMap(project=>[project.slug,...(project.inmobiliaria==='Ecasa'
  ?(project.etapasComerciales??[]).map(stage=>stage.slug):[])]))];
const key=()=>`sollahms-v1-${NOW}-${randomUUID()}`;
function request(body,operation=key(),headers={}){
  return new Request('https://sollahms.cl/api/advisory',{method:'POST',headers:{'Content-Type':'application/json',
    Origin:'https://sollahms.cl',...(operation===null?{}:{'Idempotency-Key':operation}),...headers},body:JSON.stringify(body)});
}
function providerHarness(overrides={}){
  const calls=[],accepted=new Map();
  const options={now:()=>NOW,getApiKey:()=> 'synthetic-only',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production',
    fetchImpl:async(url,options)=>{
      assert.equal(url,'https://api.resend.com/emails');
      const operation=options.headers['Idempotency-Key'];
      calls.push({operation,body:options.body,email:JSON.parse(options.body)});
      if(accepted.has(operation)&&accepted.get(operation).body!==options.body)return Response.json({name:'invalid_idempotent_request'},{status:409});
      if(!accepted.has(operation))accepted.set(operation,{body:options.body,id:'synthetic-'+accepted.size});
      return Response.json({id:accepted.get(operation).id});
    },...overrides};
  return {handler:createAdvisoryHandler(options),calls,accepted};
}

test('advisory whitelist adds exactly the 21 published expansion identities and preserves all 139 legacy labels',()=>{
  assert.equal(catalogue.length,131);assert.equal(legacySlugs.length,139);assert.equal(expansion.length,21);
  const expected=Object.fromEntries(legacySlugs.map(slug=>[slug,resolveProjectIdentity(catalogue,slug).nombre]));
  for(const project of expansion){assert.ok(!Object.hasOwn(expected,project.slug));expected[project.slug]=project.identity.name;}
  assert.deepEqual(projectIndex,expected);assert.equal(Object.keys(projectIndex).length,160);
  for(const slug of ['__proto__','constructor','prototype','patio-brasil'])assert.ok(!Object.hasOwn(projectIndex,slug));
});

test('all legacy identities and explicit stages resolve unchanged without loading expansion, including invalid-stage failures',async()=>{
  const forbidden=async()=>{throw Error('Legacy context must not load expansion');};
  for(const slug of legacySlugs)assert.deepEqual(await resolveAdvisoryProject(catalogue,slug,null,{loadExpansion:forbidden}),resolveProjectIdentity(catalogue,slug));
  for(const project of catalogue.filter(project=>project.inmobiliaria==='Ecasa'))for(const stage of project.etapasComerciales??[]){
    const number=String(stage.etapa??stage.detalleUrl.match(/#etapa-(\d+)$/)?.[1]);
    assert.deepEqual(await resolveAdvisoryProject(catalogue,project.slug,number,{loadExpansion:forbidden}),resolveProjectIdentity(catalogue,project.slug,number));
  }
  for(const [slug,stage] of [['terratolten','99'],['terratolten-2','3'],['pintor-cicarelli-i','1'],['terratolten','01']])
    assert.equal(await resolveAdvisoryProject(catalogue,slug,stage,{loadExpansion:forbidden}),null);
});

test('all 21 contexts resolve from the pinned validated expansion using identity only and never mutate the financial catalogue',async()=>{
  const before=JSON.stringify(catalogue);
  for(const project of expansion){
    const identity=await resolveAdvisoryProject(catalogue,project.slug,null,{loadExpansion});
    assert.deepEqual(Object.keys(identity).sort(),identityKeys);
    assert.equal(identity.nombre,project.identity.name);assert.equal(identity.comuna,project.identity.commune);
    assert.equal(identity.inmobiliaria,project.identity.developer);assert.equal(identity.bodyProjectSlug,project.slug);
    assert.equal(identity.detalleUrl,project.detailUrl);assert.equal(identity.contextQuery,'?proyecto='+project.slug);
    assert.equal(identity.explicitStage,false);
    assert.doesNotMatch(JSON.stringify(identity),/precio|price|stock|Reference|_catalogExpansion|projectId|iris\.yapo/i);
    const message=adviceContext(identity,'?origen=ficha&oferta=2d','Consulta sintética');
    assert.match(message,/Precio desde mostrado: Consultar precio/);assert.doesNotMatch(message,/UF [0-9]/);
  }
  assert.equal(JSON.stringify(catalogue),before);
});

test('unknown or reserved identities, stages, broken transport and unregistered expansion data fail closed',async()=>{
  let loads=0;const counted=async()=>{loads++;return source;};
  for(const slug of ['','__proto__','constructor','prototype','<script>',' alameda-4719 ',null,42])
    assert.equal(await resolveAdvisoryProject(catalogue,slug,null,{loadExpansion:counted}),null);
  assert.equal(await resolveAdvisoryProject(catalogue,'alameda-4719','1',{loadExpansion:counted}),null);assert.equal(loads,0);
  for(const slug of ['no-existe','patio-brasil'])assert.equal(await resolveAdvisoryProject(catalogue,slug,null,{loadExpansion:counted}),null);
  assert.equal(loads,2);
  await assert.rejects(resolveAdvisoryProject(catalogue,'alameda-4719',null,{loadExpansion:async()=>{throw Error('Synthetic source unavailable');}}),/Synthetic source unavailable/);
  await assert.rejects(resolveAdvisoryProject(catalogue,'alameda-4719',null,{loadExpansion:async()=>JSON.parse(expansionText)}),/verified source/);
  await assert.rejects(parseCatalogExpansion(expansionText.replace('Alameda 4719','Nombre alterado')),/SHA-256 mismatch/);
});

test('actual API derives all 160 trusted labels and acknowledges only simulated provider acceptance',async()=>{
  const harness=providerHarness();
  for(const [slug,name] of Object.entries(projectIndex)){
    const response=await harness.handler.fetch(request({...base,proyecto:slug}));
    assert.equal(response.status,200,slug);assert.deepEqual(await response.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
    const email=harness.calls.at(-1).email;
    assert.ok(email.text.includes('Proyecto: '+name+'\nIdentificador: '+slug));
    assert.deepEqual(email.to,['contacto@sollahms.cl']);assert.equal(email.from,'Sollahms Web <formularios@forms.sollahms.cl>');
    assert.equal(email.reply_to,base.correo);assert.equal(email.subject,'Solicitud de asesoría desde Sollahms');
    assert.doesNotMatch(email.text,/precioDesdeUF|priceUF|stock|IRIS_EXACT_UNIT|iris-ref-/);
  }
  assert.equal(harness.accepted.size,160);
});

test('new context cannot bypass identification, consent, origin, timing, accepted keys or anti-prototype controls',async()=>{
  const harness=providerHarness();const body={...base,proyecto:'alameda-4719'};
  for(const patch of [{nombre:''},{rut:''},{rut:'1000005-1'},{correo:''},{telefono:''},{consent:false},{website:'spam'},
    {startedAt:NOW-1999},{startedAt:NOW-86_400_001},{nombreProyecto:'Nombre falsificado'},{priceUF:2400},{stock:1}]){
    const response=await harness.handler.fetch(request({...body,...patch}));assert.equal(response.status,400);
    const result=await response.text();assert.ok(!result.includes(base.correo));assert.ok(!result.includes(base.rut));
  }
  for(const proyecto of ['__proto__','constructor','prototype','patio-brasil','no-existe','',null,{},['alameda-4719']])
    assert.equal((await harness.handler.fetch(request({...body,proyecto}))).status,400);
  assert.equal((await harness.handler.fetch(request(body,key(),{Origin:'https://example.invalid'}))).status,403);
  assert.equal((await harness.handler.fetch(request(body,null))).status,400);
  assert.equal((await harness.handler.fetch(request(body,'invalid'))).status,400);
  assert.equal((await harness.handler.fetch(request(body,key(),{'Content-Type':'text/plain'}))).status,415);
  assert.equal(harness.calls.length,0);
  for(const overrides of [{getEnvironment:()=> 'preview'},{getDeliveryMode:()=> 'crm'},{getApiKey:()=> ''}]){
    let calls=0;const isolated=providerHarness({...overrides,fetchImpl:async()=>{calls++;throw Error('Forbidden provider access');}});
    assert.equal((await isolated.handler.fetch(request(body))).status,503);assert.equal(calls,0);
  }
});

function element(value=''){
  return {value,textContent:'',hidden:false,disabled:false,dataset:{},listeners:{},attributes:{},required:false,
    addEventListener(name,listener){this.listeners[name]=listener;},setAttribute(name,value){this.attributes[name]=value;},
    removeAttribute(name){delete this.attributes[name];},setCustomValidity(){},scrollIntoView(){},focus(){this.focused=true;}};
}
async function browserHarness(search,{expansionUnavailable=false,providerOptions={},loseFirstResponse=false}={}){
  const harness=providerHarness(providerOptions),inputs=Object.fromEntries(Object.entries(base).filter(([key])=>key!=='startedAt').map(([name,value])=>[name,element(value)]));
  inputs.rut.required=true;inputs.consent.checked=true;
  const form=element();form.elements=inputs;const button=element(),fields=element(),status=element(),label=element();label.hidden=true;
  form.querySelector=()=>button;form.reset=()=>{form.resetCalled=true;};
  const elements={'advisory-form':form,'advisory-fields':fields,'advisory-status':status,'advisory-project-context':label,'advisory-unavailable':element()};
  for(const id of ['name','rut','email','phone','message','consent'])elements['advisory-'+id+'-error']=element();
  const links=[{href:'/agenda-asesoria.html'},{href:'/contacto.html'}],events=[],requests=[],loaded=[],storageMap=new Map();
  const storage={getItem:key=>storageMap.get(key)??null,setItem:(key,value)=>storageMap.set(key,value),removeItem:key=>storageMap.delete(key)};
  let clock=NOW-5000,lose=loseFirstResponse;
  const fetchImpl=async(url,options)=>{
    loaded.push(url);
    if(url==='/data/proyectos.json')return Response.json(catalogue);
    if(url==='/data/catalog-expansion-iris-20261118.json'){
      if(expansionUnavailable)throw Error('Synthetic expansion unavailable');
      return new Response(expansionText);
    }
    assert.equal(url,'/api/advisory');requests.push(options);
    const response=await harness.handler.fetch(new Request('https://sollahms.cl'+url,{...options,headers:{...options.headers,Origin:'https://sollahms.cl'}}));
    if(lose){lose=false;throw new TypeError('Synthetic lost response');}
    return response;
  };
  class FormDataDouble{
    constructor(form){this.data=new Map(Object.entries(form.elements).filter(([name,input])=>name!=='consent'||input.checked).map(([name,input])=>[name,String(input.value)]));}
    [Symbol.iterator](){return this.data[Symbol.iterator]();}
  }
  const sandbox={document:{getElementById:id=>elements[id],querySelectorAll:()=>links},location:{search},URLSearchParams,
    Date:class extends Date{static now(){return clock;}},AbortSignal,FormData:FormDataDouble,
    validateCommercialFields,normalizedCommercialFields,focusCommercialField,bindRutField,adviceContext,
    resolveAdvisoryProject:(catalogue,slug,stage)=>resolveAdvisoryProject(catalogue,slug,stage,{loadExpansion:()=>loadCatalogExpansion(fetchImpl)}),
    createFormOperation:options=>createFormOperation({...options,storage,now:()=>clock}),fetch:fetchImpl,
    window:{dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
  runInNewContext(controller,sandbox,{filename:'assets/js/advisory.mjs'});
  // Wait only for local catalogue/hash promises; no network or real form is used.
  if(new URLSearchParams(search).has('proyecto')){
    const deadline=Date.now()+5000;
    while(label.hidden&&!status.textContent){assert.ok(Date.now()<deadline,'Synthetic context did not settle');await new Promise(resolve=>setTimeout(resolve,1));}
  }
  clock=NOW;
  return {...harness,form,fields,status,label,links,events,requests,loaded,storageMap,
    submit:()=>form.listeners.submit({preventDefault(){}})};
}

test('actual browser controller labels all 21 contexts, preserves cross-page links and sends identity only through the existing contract',async()=>{
  for(const project of expansion){
    const browser=await browserHarness('?proyecto='+project.slug+'&origen=ficha&oferta=2d');
    assert.equal(browser.label.textContent,'Tu consulta sobre '+project.identity.name);assert.equal(browser.label.hidden,false);
    assert.deepEqual(browser.links.map(link=>link.href),['/agenda-asesoria.html?proyecto='+project.slug,'/contacto.html?proyecto='+project.slug]);
    await browser.submit();assert.equal(browser.requests.length,1);assert.equal(browser.accepted.size,1);
    const payload=JSON.parse(browser.requests[0].body);assert.equal(payload.proyecto,project.slug);
    assert.deepEqual(Object.keys(payload).sort(),[...Object.keys(base),'proyecto','solicitud'].sort());
    assert.doesNotMatch(payload.mensaje,/UF [0-9]|stock|IRIS_EXACT_UNIT|iris-ref-/);
    assert.match(browser.status.textContent,/no confirma entrega al buzón ni una cita/);assert.equal(browser.status.dataset.state,'success');
    assert.equal(browser.events.length,1);assert.equal(browser.events[0].type,'sollahms:measurement');
    assert.equal(JSON.stringify(browser.events[0].detail),JSON.stringify({name:'contact_request_accepted',parameters:{form_kind:'advisory',acceptance_kind:'provider_accepted'}}));
    assert.equal(browser.storageMap.size,0);
  }
});

test('browser rejects unknown, duplicate, staged and unavailable new contexts while legacy and general consultation remain independent',async()=>{
  for(const search of ['?proyecto=no-existe','?proyecto=constructor','?proyecto=alameda-4719&proyecto=prat',
    '?proyecto=alameda-4719&etapa=1','?proyecto=alameda-4719&etapa=1&etapa=2']){
    const browser=await browserHarness(search);await browser.submit();assert.equal(browser.requests.length,0);assert.equal(browser.events.length,0);
    assert.match(browser.status.textContent,/No pudimos identificar el proyecto/);
  }
  const unavailable=await browserHarness('?proyecto=alameda-4719',{expansionUnavailable:true});
  await unavailable.submit();assert.equal(unavailable.requests.length,0);assert.equal(unavailable.events.length,0);
  for(const search of ['','?proyecto=terratolten&etapa=2']){
    const browser=await browserHarness(search,{expansionUnavailable:true});await browser.submit();assert.equal(browser.requests.length,1);
    assert.ok(!browser.loaded.includes('/data/catalog-expansion-iris-20261118.json'));
    const payload=JSON.parse(browser.requests[0].body);
    if(search)assert.equal(payload.proyecto,'terratolten-2');else assert.ok(!Object.hasOwn(payload,'proyecto'));
  }
});

test('browser emits no acceptance measurement for an unconfirmed provider result and retains the operation across a lost response',async()=>{
  for(const fetchImpl of [async()=>Response.json({}),async()=>Response.json({error:base.correo},{status:400})]){
    const browser=await browserHarness('?proyecto=alameda-4719',{providerOptions:{fetchImpl}});
    await browser.submit();assert.equal(browser.events.length,0);assert.equal(browser.form.resetCalled,undefined);
    assert.equal(browser.status.dataset.state,'error');assert.equal(browser.storageMap.size,1);
    assert.ok(!browser.status.textContent.includes(base.correo));
  }
  const browser=await browserHarness('?proyecto=alameda-4719',{loseFirstResponse:true});
  await browser.submit();assert.equal(browser.events.length,0);assert.equal(browser.storageMap.size,1);assert.equal(browser.form.resetCalled,undefined);
  await browser.submit();assert.equal(browser.events.length,1);assert.equal(browser.requests.length,2);assert.equal(browser.accepted.size,1);
  assert.equal(browser.requests[0].body,browser.requests[1].body);
  assert.equal(browser.requests[0].headers['Idempotency-Key'],browser.requests[1].headers['Idempotency-Key']);
});
