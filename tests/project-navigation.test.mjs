import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeSection} from '../assets/js/project-navigation.mjs';
import {priceFromLabel} from '../assets/js/catalog-model.mjs';
import {composeProjectRequest} from '../assets/js/project-request.mjs';
test('active navigation follows reading position across optional sections',()=>{
 assert.equal(activeSection([0,600,900,1500,2000],160),0);
 assert.equal(activeSection([-800,-200,100,700,1200],160),2);
 assert.equal(activeSection([-2000,-1600,-1400,-800,0],160),4);
});
test('price formatting preserves numeric values and has one unknown label',()=>{
 assert.equal(priceFromLabel(11073),'Desde UF 11.073');assert.equal(priceFromLabel(2784.5),'Desde UF 2.784,5');
 for(const value of [null,undefined,NaN,Infinity,0,-1,'2784'])assert.equal(priceFromLabel(value),'Desde: consultar precio');
});
test('quote receives project, developer and a reference price without a unit-price promise',()=>{
 const body=composeProjectRequest({values:{nombre:'Prueba sintética',rut:'1000005-K',correo:'qa@example.invalid',telefono:'+56900000000',mensaje:'Me interesa',consent:true},project:{bodyProjectSlug:'plaza-las-condes',detalleUrl:'/plaza-las-condes.html',nombre:'Plaza Las Condes',inmobiliaria:'Sento',precioDesdeUF:11073},intent:'cotizacion',startedAt:1});
 assert.match(body.mensaje,/Proyecto: Plaza Las Condes/);assert.match(body.mensaje,/Inmobiliaria: Sento/);assert.match(body.mensaje,/Desde UF 11.073/);assert.match(body.mensaje,/No es el precio definitivo de una unidad/);assert.equal(body.proyecto,'plaza-las-condes');
});
