import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {withSelectedUnit,initializePlaza} from '../assets/js/plaza-las-condes.mjs';
import {composeProjectRequest,validateProjectRequest} from '../assets/js/project-request.mjs';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import {createAdvisoryHandler} from '../api/advisory.mjs';

const catalogue=JSON.parse(await readFile(new URL('../data/proyectos.json',import.meta.url)));
const person={nombre:'Prueba sintética',rut:'1000005-K',correo:'qa@example.invalid',telefono:'+56 9 0000 0000',mensaje:'Deseo conocer las condiciones.',consent:true,website:''};
globalThis.fetch=()=>{throw Error('External transport is forbidden');};

test('selected unit and all contact fields reach the existing destination in isolation',async()=>{
  const emails=[];
  const handler=createAdvisoryHandler({getApiKey:()=> 'isolated-test',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production',fetchImpl:async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');emails.push(JSON.parse(options.body));return Response.json({id:'isolated'});}});
  for(const unit of ['213','313']){
    const values={...person,mensaje:withSelectedUnit(person.mensaje,unit)};
    assert.deepEqual(validateProjectRequest(values,'cotizacion'),{});
    const body=composeProjectRequest({values,project:resolveProjectIdentity(catalogue,'plaza-las-condes'),intent:'cotizacion',startedAt:Date.now()-5000});
    const response=await handler.fetch(new Request('https://sollahms.cl/api/advisory',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://sollahms.cl','Idempotency-Key':`sollahms-v1-${Date.now()}-${randomUUID()}`},body:JSON.stringify(body)}));
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,providerAccepted:true,deliveryConfirmed:false});
    const email=emails.at(-1);assert.deepEqual(email.to,['contacto@sollahms.cl']);
    for(const content of [`Unidad de interés: ${unit}.`,'plaza-las-condes','1000005-K','qa@example.invalid','+56900000000',person.mensaje])assert.ok(email.text.includes(content),content);
  }
});

test('missing identity, invalid RUT and message overflow still fail before transport',()=>{
  for(const field of ['nombre','rut','correo','telefono'])assert.ok(validateProjectRequest({...person,[field]:'',mensaje:withSelectedUnit(person.mensaje,'213')},'cotizacion')[field]);
  assert.ok(validateProjectRequest({...person,rut:'12345678-0'},'cotizacion').rut);
  const tooLong=withSelectedUnit('x'.repeat(1600),'313');assert.ok(validateProjectRequest({...person,mensaje:tooLong},'cotizacion').mensaje);
  assert.equal(withSelectedUnit('Consulta sin unidad','unverified'),'Consulta sin unidad');
});

test('switching, clearing and resetting unit context preserves the typed message',()=>{
  const node=()=>({listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});
  const root=node(),form=node(),clear=node(),filter=node(),panel={hidden:true},label={},message={value:'Mi texto',maxLength:1600};
  form.elements={mensaje:message};form.querySelector=()=>({disabled:false});form.hasAttribute=()=>false;filter.closest=()=>({hidden:true});
  const nodes={'form[data-project-request]':form,'#plc-unit-context':panel,'#plc-unit-selected':label,'#plc-unit-clear':clear,'#plc-plan-filter':filter};
  root.querySelector=s=>nodes[s];root.querySelectorAll=()=>[];initializePlaza(root);
  const click=unit=>root.listeners.click({target:{closest:()=>({dataset:{plazaUnit:unit}})}});
  const submitted=()=>{const data=new FormData();data.set('mensaje',message.value);form.listeners.formdata({formData:data});return data.get('mensaje');};
  click('213');assert.match(submitted(),/Unidad de interés: 213/);assert.equal(panel.hidden,false);
  click('313');assert.match(submitted(),/Unidad de interés: 313/);assert.ok(!submitted().includes('213'));assert.equal(message.value,'Mi texto');
  clear.listeners.click();assert.equal(submitted(),'Mi texto');assert.equal(panel.hidden,true);
  click('213');form.listeners.reset();assert.equal(submitted(),'Mi texto');assert.equal(message.maxLength,1600);
});
