import {test} from 'node:test';
import assert from 'node:assert/strict';
import projects from '../data/proyectos.json' with {type:'json'};
import {filterAndSort,selectedOffer,validPrice,projectFacts,assetTypes,safeReturnFilters,validFilterState,validView} from '../assets/js/catalog-model.mjs';
const defaults={version:1,search:'',assetType:'',region:'',commune:'',state:'',maxPriceInput:'',sortOrder:'original'};
test('all 132 source records and original ordering survive without mutation or duplicates',()=>{
 const before=JSON.stringify(projects),rows=filterAndSort(projects,defaults);
 assert.equal(rows.length,132);assert.equal(new Set(rows.map(p=>p.slug)).size,132);assert.deepEqual(rows.map(p=>p.slug),projects.map(p=>p.slug));
 assert.equal(JSON.stringify(projects),before);
});
test('both numeric directions preserve stable ties, decimals and unknown prices last',()=>{
 for(const sortOrder of ['price-asc','price-desc']){
  const rows=filterAndSort(projects,{...defaults,sortOrder});let missing=false,last=sortOrder==='price-asc'?-Infinity:Infinity;
  for(const p of rows){const value=selectedOffer(p).value;if(!validPrice(value)){missing=true;continue;}assert.equal(missing,false);assert.ok(sortOrder==='price-asc'?value>=last:value<=last);last=value;}
 }
 const fixtures=[{slug:'a',precioDesdeUF:3000.2},{slug:'b',precioDesdeUF:null},{slug:'c',precioDesdeUF:3000.02},{slug:'d',precioDesdeUF:3000.02},{slug:'e',precioDesdeUF:0}];
 assert.deepEqual(filterAndSort(fixtures,{sortOrder:'price-asc'}).map(p=>p.slug),['c','d','a','b','e']);
 assert.deepEqual(filterAndSort(fixtures,{sortOrder:'price-desc'}).map(p=>p.slug),['a','c','d','b','e']);
});
test('search covers names, communes and developers with accent-insensitive matching',()=>{
 for(const [search,expected] of [['cicarelli',3],['Ñuñoa',filterAndSort(projects,{search:'nunoa'}).length],['norte verde',18]])assert.equal(filterAndSort(projects,{search}).length,expected);
 assert.ok(filterAndSort(projects,{search:'Coquimbo'}).length>0);assert.equal(filterAndSort(projects,{search:'zzzz-inexistente'}).length,0);
});
test('combined filters and maximum price exclude unavailable amounts, never use zero',()=>{
 const rows=filterAndSort(projects,{...defaults,region:'Región Metropolitana',commune:'Santiago',maxPriceInput:'3400',sortOrder:'price-asc'});
 assert.ok(rows.length>0);for(const p of rows){assert.equal(p.comuna,'Santiago');assert.equal(p.region,'Región Metropolitana');assert.ok(selectedOffer(p).value>0&&selectedOffer(p).value<=3400);}
 assert.equal(filterAndSort(projects,{maxPriceInput:'0'}).length,0);
});
test('mixed and commercial offers keep the exact selected typology and decimal amount',()=>{
 const dual=projects.find(p=>p.slug==='edificio-dual-390-lto');
 assert.deepEqual(selectedOffer(dual,'Comercial'),{value:18386.36,typology:'Local'});
 assert.deepEqual(selectedOffer(dual,'Residencial'),{value:7337.21,typology:'1 dormitorio'});
 assert.ok(!projectFacts(dual,'Comercial').some(f=>f.value.includes('dormitorio')));
 const commercial=filterAndSort(projects,{assetType:'Comercial'});assert.ok(commercial.length>0);
 for(const p of commercial)assert.equal(selectedOffer(p,'Comercial').typology,'Local');
 assert.deepEqual(assetTypes(projects.find(p=>p.slug==='reserva-mayor-2')),['Terreno']);
 assert.ok(assetTypes(projects.find(p=>p.slug==='pintor-cicarelli-i')).includes('Residencial'));
 assert.deepEqual(assetTypes({tipologias:[]}),[]);
});
test('facts distinguish reception state from delivery and do not fill absent data',()=>{
 const verne=projectFacts(projects.find(p=>p.slug==='edificio-verne'));
 assert.ok(verne.some(f=>f.label==='Estado'&&f.value==='En recepción final'));assert.ok(verne.some(f=>f.label==='Entrega'&&f.value==='Inmediata'));
 const pintor=projectFacts(projects.find(p=>p.slug==='pintor-cicarelli-i'));assert.equal(pintor.filter(f=>['Estado','Entrega'].includes(f.label)).length,1);
 assert.deepEqual(projectFacts({tipologias:[],estado:null,entrega:null}),[]);
 assert.ok(projectFacts(projects.find(p=>p.slug==='terratolten')).some(f=>f.label==='Etapa'&&f.value==='3'));
});
test('return state is bounded to catalogue values; view persists only as an enum',()=>{
 assert.equal(validView('cards'),true);assert.equal(validView('list'),true);assert.equal(validView('qa@example.invalid'),false);
 const valid={...defaults,search:'norte verde',commune:'Santiago',sortOrder:'price-desc'};assert.deepEqual(safeReturnFilters(valid,projects),valid);
 const unsafe={...valid,search:'qa@example.invalid',commune:'unrelated private text'};const safe=safeReturnFilters(unsafe,projects);assert.equal(safe.search,'');assert.equal(safe.commune,'');
 assert.equal(validFilterState({...valid,income:1}),false);assert.equal(safeReturnFilters({...valid,income:1},projects),null);
 assert.equal(validFilterState({...valid,maxPriceInput:'Infinity'}),false);
});
