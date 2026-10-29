import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {selectedTypologyMessage} from '../assets/js/nollagam-detail.mjs';
import {composeProjectRequest} from '../assets/js/project-request.mjs';
import {selectedOffer,filterAndSort} from '../assets/js/catalog-model.mjs';
const catalogue=JSON.parse(readFileSync(new URL('../data/proyectos.json',import.meta.url)));
const expected={'edificio-liverpool':{2:4151,3:4457},'barrio-zenteno':{1:2784,2:3202,3:3508},'alto-goycolea':{0:2264,1:2601,2:2886},'edificio-santa-maria':{1:3090,2:3355,3:4029},'eleuterio-ramirez':{2:3825,3:4400},'costanera-coquimbo-a':{2:4210,3:5070},'costanera-coquimbo-b':{2:3880,3:5460}};
for(const [slug,prices]of Object.entries(expected))test(slug+': prices, filters and isolated request context',()=>{
 const p=catalogue.find(p=>p.slug===slug),html=readFileSync(new URL('../'+slug+'.html',import.meta.url),'utf8');
 const record=JSON.parse(html.match(/<script id="nollagam-commercial" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(p.precioDesdeUF,Math.min(...Object.values(prices)));assert.equal(selectedOffer(p).value,p.precioDesdeUF);
 assert.equal(record.offers.filter(o=>o.priceUF).length,Object.keys(prices).length);
 for(const [beds,price]of Object.entries(prices)){
  const offer=record.offers.find(o=>String(o.bedrooms)===beds);assert.equal(offer.priceUF,price);
  const message=selectedTypologyMessage(record,beds,'Necesito más información.');assert.match(message,/Inmobiliaria: Nollagam/);assert.ok(message.includes(record.name));assert.ok(message.includes(new Intl.NumberFormat('es-CL').format(price)));assert.match(message,/por tipología/);
  const payload=composeProjectRequest({values:{nombre:'Prueba Local',rut:'11111111-1',correo:'qa@example.com',telefono:'+56912345678',mensaje:message,consent:true},project:{bodyProjectSlug:slug,detalleUrl:p.detalleUrl},intent:'cotizacion',startedAt:0});assert.equal(payload.proyecto,slug);assert.ok(payload.mensaje.includes(message));assert.ok(payload.mensaje.length<=2000);
  if(record.building)assert.match(payload.mensaje,new RegExp('Edificio: '+record.building));
 }
 assert.equal(selectedTypologyMessage(record,'999','texto'),'texto');assert.equal(selectedTypologyMessage(record,null,'texto'),'texto');
 for(const o of record.offers.filter(o=>!o.priceUF))assert.match(selectedTypologyMessage(record,o.bedrooms),/Consultar valor/);
 assert.ok(filterAndSort([p],{maxPriceInput:String(p.precioDesdeUF-1)}).length===0);
});
