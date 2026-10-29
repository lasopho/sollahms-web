import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {brochureSelectionMessage} from '../assets/js/project-brochure.mjs';
import {priceFromLabel} from '../assets/js/catalog-model.mjs';
import {advancedFilterAndSort,defaults} from '../assets/js/catalog-filter-engine.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../data/'+name,import.meta.url),'utf8'));
const commercial=read('crescer-commercial.json').projects,index=read('catalog-facets.json');
const projects=read('proyectos.json').map(p=>({...p,_facets:index.projects[p.slug]}));
test('two decimals are presentation only and other formats remain unchanged',()=>{
 assert.equal(priceFromLabel(2360.1,2),'Desde UF 2.360,10');assert.equal(priceFromLabel(3292.89,2),'Desde UF 3.292,89');assert.equal(priceFromLabel(3000),'Desde UF 3.000');
});
test('all seven selections preserve project, developer, exact price and the visitor message',()=>{
 for(const c of Object.values(commercial))for(const [bedrooms,priceUF] of Object.entries(c.prices)){
  const record={name:c.name,developer:'Crescer',offers:[{bedrooms:Number(bedrooms),label:bedrooms==='0'?'Estudio':bedrooms+' dormitorios',priceUF}]};
  const message=brochureSelectionMessage(record,bedrooms,'Consulta sintética');
  assert.ok(message.includes(c.name)&&message.includes('Crescer')&&message.includes(priceFromLabel(priceUF,2))&&message.endsWith('Consulta sintética'));
  assert.equal(brochureSelectionMessage(record,null,'Mensaje conservado'),'Mensaje conservado');
  const budget=1600-brochureSelectionMessage(record,bedrooms,'').length;
  assert.equal(brochureSelectionMessage(record,bedrooms,'x'.repeat(budget)).length,1600);
 }
});
test('new filters keep the conflicting Rafael areas out of 2-bedroom matches',()=>{
 const rows=state=>advancedFilterAndSort(projects,{...defaults(),developers:['Crescer'],...state}).map(p=>p.slug);
 assert.deepEqual(rows({bedrooms:'3',bathrooms:'2',areaType:'departamento',minArea:'1'}),['don-tomas']);
 assert.deepEqual(rows({bedrooms:'2',bathrooms:'1',areaType:'interior',minArea:'1'}),[]);
 assert.deepEqual(rows({amenities:['terraza-comun'],delivery:'inmediata',state:'En recepción final'}),['don-rafael']);
 assert.deepEqual(rows({minPriceInput:'2360.10',maxPriceInput:'2360.10'}),['don-tomas']);
});
