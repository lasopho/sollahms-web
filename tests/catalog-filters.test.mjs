import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import catalogue from '../data/proyectos.json' with {type:'json'};
import index from '../data/catalog-facets.json' with {type:'json'};
import {defaults,advancedFilterAndSort as filter,readQuery,writeQuery,sanitizeState,safePublicState,rangeIssue,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';
import {facetOptions} from '../assets/js/catalog-filter-controls.mjs';
import {projectOffer} from '../assets/js/catalog-model.mjs';
const projects=catalogue.map(p=>({...p,_facets:index.projects[p.slug]}));
const options=facetOptions(projects,index),state=patch=>({...defaults(),...patch});
const fixture=(slug,variants,features=[],price=3000)=>({slug,nombre:slug,comuna:'Concepción',region:'Biobío',inmobiliaria:'Ejemplo',precioDesdeUF:price,_facets:{propertyTypes:['departamento'],variants,features:features.map(id=>({id,label:id,scope:'project'})),delivery:{year:2027},states:['En construcción'],assetTypes:['Residencial']}});
test('no filters retain all projects, owner amounts, order and unknown data',()=>{
 const before=JSON.stringify(projects);assert.equal(filter(projects,defaults()).length,131);assert.deepEqual(filter(projects,defaults()).map(p=>p.slug),catalogue.map(p=>p.slug));assert.equal(JSON.stringify(projects),before);
 assert.equal(filter(projects,state({minPriceInput:'0'})).length,93);assert.equal(filter(projects,state({maxPriceInput:'0'})).length,0);
});
test('categories intersect; selections within amenities use OR or explicit ALL',()=>{
 const a=fixture('A',[],['piscina']),b=fixture('B',[],['gimnasio']),c=fixture('C',[],['piscina','gimnasio']),unknown=fixture('unknown',[]);
 assert.deepEqual(filter([a,b,c,unknown],state({amenities:['piscina','gimnasio']})).map(p=>p.slug),['A','B','C']);
 assert.deepEqual(filter([a,b,c,unknown],state({amenities:['piscina','gimnasio'],amenitiesAll:true})).map(p=>p.slug),['C']);
 assert.equal(filter([a,b,c],state({commune:'Santiago',amenities:['piscina']})).length,0);
 assert.equal(filter([unknown],defaults()).length,1);
});
test('bedrooms, bathrooms, private spaces and typed surfaces must fit one documented option',()=>{
 const p=fixture('coherent',[{propertyType:'departamento',bedrooms:1,bathrooms:1,areas:{util:40,total:50},privateGarden:true},{propertyType:'departamento',bedrooms:2,bathrooms:2,areas:{util:70,total:80},privateTerrace:true}],['jardin-privado','terraza-privada','termopanel']);
 assert.equal(filter([p],state({bedrooms:'2',bathrooms:'1'})).length,0);
 assert.equal(filter([p],state({bedrooms:'2',areaType:'util',maxArea:'60'})).length,0);
 assert.equal(filter([p],state({bedrooms:'2',areaType:'total',minArea:'80',maxArea:'80'})).length,1);
 assert.equal(filter([p],state({areaType:'terreno',minArea:'1'})).length,0);
 assert.equal(filter([p],state({bedrooms:'2',features:['jardin-privado']})).length,0);
 assert.equal(filter([p],state({features:['jardin-privado','terraza-privada'],featuresAll:true})).length,0);
 assert.equal(filter([p],state({bedrooms:'2',features:['jardin-privado','termopanel']})).length,1);
 assert.deepEqual(matchedLabels(p,state({bedrooms:'2',features:['jardin-privado','termopanel']})),['termopanel']);
});
test('exact ranges are inclusive and invalid ranges never broaden results',()=>{
 const p=fixture('boundary',[],[],3000.25);assert.equal(filter([p],state({minPriceInput:'3000.25',maxPriceInput:'3000.25'})).length,1);
 for(const patch of [{minPriceInput:'4000',maxPriceInput:'3000'},{minArea:'50',maxArea:'40'},{maxPriceInput:'NaN'},{minPriceInput:'-1'}]){assert.ok(rangeIssue(state(patch)));assert.equal(filter([p],state(patch)).length,0);}
});
test('project desde stays authoritative regardless of selected property or old typology prices',()=>{
 const p={...fixture('mixed',[{propertyType:'local',areas:{total:60}}],[],2000),preciosPorTipologia:[{tipologia:'Local',precioDesdeUF:8000}]};p._facets.propertyTypes=['local'];p._facets.assetTypes=['Comercial'];
 assert.equal(filter([p],state({propertyType:'local',maxPriceInput:'2500'})).length,1);
 assert.equal(filter([p],state({minPriceInput:'2100'})).length,0);
 assert.equal(projectOffer(p).value,2000);
});
test('residential-only common spaces do not become local amenities; stage references remain separate',()=>{
 const p=projects.find(p=>p.slug==='edificio-dual-390-lto');assert.ok(p._facets.features.some(f=>f.id==='quinchos'));
 assert.equal(filter([p],state({propertyType:'local',amenities:['quinchos']})).length,0);
 assert.equal(filter([p],state({propertyType:'departamento',amenities:['quinchos']})).length,1);
 assert.equal(filter(projects.filter(p=>p.slug==='ferroparque'),state({amenities:['piscina']})).length,0);
 const ter=index.projects.terratolten;assert.ok(!ter.variants.some(v=>v.areas?.total===45.33));
});
test('keywords include only registered features; sorting is deterministic with unknowns last',()=>{
 const rows=filter(projects,state({search:'piscina Santiago'}));assert.ok(rows.length);for(const p of rows){assert.equal(p.comuna,'Santiago');assert.ok(p._facets.features.some(f=>f.id==='piscina'));}
 for(const order of ['price-asc','price-desc']){const rows=filter(projects,state({sortOrder:order}));let unknown=false;for(const p of rows){if(p.precioDesdeUF==null)unknown=true;else assert.equal(unknown,false);}}
 const verne=projects.find(p=>p.slug==='edificio-verne');assert.equal(filter([verne],state({delivery:'inmediata'})).length,0);
});
test('URL round trip is bounded, shareable, uses allowlists and excludes unrelated or private state',()=>{
 const s=sanitizeState(state({commune:'Concepción',minPriceInput:'2500.25',amenities:['piscina','gimnasio'],amenitiesAll:true,developers:['Sento'],sortOrder:'price-asc'}),options);
 const parsed=readQuery('?'+writeQuery(s,'map'),options);assert.deepEqual(parsed.state,s);assert.equal(parsed.view,'map');
 const bad=readQuery('?amenity=%3Cscript%3E&precio_max=Infinity&orden=__proto__&inmobiliaria=private%40email.invalid&superficie=wrong&q=%3Cimg%3E',options);
 assert.deepEqual(bad.state.amenities,[]);assert.deepEqual(bad.state.developers,[]);assert.equal(bad.state.maxPriceInput,'');assert.ok(!/[<>]/.test(bad.state.search));
 assert.equal(readQuery('?q='+'x'.repeat(6500),options).present,false);
 const privateQuery=state({search:'private@example.invalid'});assert.equal(safePublicState(privateQuery,projects).search,'');assert.equal(privateQuery.search,'private@example.invalid');
 assert.ok(!writeQuery({...s,income:2000000,phone:'123'}).includes('income'));
});
test('projection is complete without unit inventory, empty facets, generated absences or schema drift',()=>{
 assert.deepEqual(Object.keys(index.projects).sort(),catalogue.map(p=>p.slug).sort());
 for(const f of index.filters)assert.ok(f.count>0);assert.ok(!index.filters.some(f=>f.id==='climatizacion'));
 assert.ok(!JSON.stringify(index).includes('priceUF'));assert.ok(!JSON.stringify(index).includes('unitNumber'));
 assert.ok(index.projects.endemico.propertyTypes.includes('casa'));assert.ok(index.projects['reserva-mayor-2'].propertyTypes.includes('terreno'));
 assert.deepEqual(index.projects['alto-buzeta'].propertyTypes,[]);
 assert.equal(filter(projects.filter(p=>p.slug==='alto-buzeta'),state({propertyType:'departamento'})).length,0);
 assert.ok(!options.states.includes('Venta en verde'));assert.ok(options.states.includes('En verde'));
 assert.ok(filter(projects,state({search:'casa'})).some(p=>p.slug==='endemico'));
 assert.ok(index.typologies.every(t=>!t.label.startsWith(' · ')));
 for(const p of Object.values(index.projects))for(const v of p.variants)for(const [metric,amount] of Object.entries(v.areas))assert.ok(['util','interior','total','terreno','terraza','jardin'].includes(metric)&&Number.isFinite(amount)&&amount>0);
});
test('current catalogue filtering stays responsive without network or mutation',()=>{
 const start=performance.now();for(let i=0;i<200;i++)filter(projects,state({bedrooms:'2',amenities:['piscina'],maxPriceInput:'4500',sortOrder:'price-asc'}));
 const ms=performance.now()-start;assert.ok(ms<2500,'200 queries: '+ms+'ms');console.log('200 combined filters: '+ms.toFixed(1)+'ms');
});
