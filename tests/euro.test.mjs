import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults} from '../assets/js/catalog-filter-engine.mjs';
import {projectOffer} from '../assets/js/catalog-model.mjs';
import {guideProjectContext,calculateGuide} from '../assets/js/mortgage-guide-engine.mjs';
import {brochureSelectionMessage} from '../assets/js/project-brochure.mjs';
import {publicOrigin,adviceContext} from '../assets/js/commercial-context.mjs';
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const catalogue=json('data/proyectos.json'),facets=json('data/catalog-facets.json').projects;
const rows=catalogue.map(p=>({...p,_facets:facets[p.slug]}));
const euro=json('data/euro-commercial.json').projects;
const prices={'mapocho-3521':[3092,3246],'mapocho-3521-edificio-a':[3194.03,3324.18],'plaza-de-lourdes':[2647,3199,4276],'rosas-1444':[4141.63],'diagonal-vicuna':[],'santa-elena-1670-mbi':[2920,3024],'independencia-4745':[3146.65,8440.85],'froilan-roa-5731-torre-sur':[3216,3294],'entre-vicunas':[3098,3696],'froilan-roa-5731-torre-norte':[3145,3414],'edificio-don-pepe-154':[3306.18,3562],'guillermo-mann-1401':[3998.31]};
const row=slug=>rows.find(p=>p.slug===slug);
const matching=s=>advancedFilterAndSort(rows,{...defaults(),...s});
test('exact 21 owner prices and all 12 stable records, with unknown Diagonal',()=>{
 assert.equal(Object.keys(euro).length,12);assert.equal(Object.values(prices).flat().length,21);
 for(const [slug,want] of Object.entries(prices)){
  assert.deepEqual(row(slug).commercialOffers.map(o=>o.priceUF).filter(v=>v!==null),want,slug);
  assert.equal(row(slug).precioDesdeUF,want[0]??null,slug);
 }
 assert.equal(catalogue.length,131);assert.equal(new Set(catalogue.map(p=>p.slug)).size,131);
});
test('local offer matches its own exact price without inheriting residential facts',()=>{
 const p=row('independencia-4745');
 assert.equal(projectOffer(p).value,3146.65);assert.equal(projectOffer(p,{propertyType:'local'}).value,8440.85);
 assert.ok(!matching({propertyType:'local',maxPriceInput:'8440.84'}).includes(p));
 assert.ok(matching({propertyType:'local',minPriceInput:'8440.85',maxPriceInput:'8440.85'}).includes(p));
 for(const fields of [{bedrooms:'2'},{bathrooms:'1'},{amenities:['piscina']},{features:['termopanel']},{minArea:'1'}])assert.ok(!matching({propertyType:'local',...fields}).includes(p));
 assert.ok(matching({propertyType:'departamento',bedrooms:'2',maxPriceInput:'4000',amenities:['piscina','gimnasio'],amenitiesAll:true}).includes(p));
});
test('La Florida example uses documented features, excludes unverified tower amenities',()=>{
 const found=matching({commune:'La Florida',propertyType:'departamento',bedrooms:'2',amenities:['piscina','gimnasio'],amenitiesAll:true,maxPriceInput:'4000'}).map(p=>p.slug);
 assert.ok(found.includes('edificio-don-pepe-154'));assert.ok(!found.includes('entre-vicunas'));assert.ok(!found.includes('froilan-roa-5731-torre-norte'));assert.ok(!found.includes('froilan-roa-5731-torre-sur'));
});
test('unknown price is discoverable without false numerical matches',()=>{
 assert.ok(matching({search:'Diagonal Vicuña'}).includes(row('diagonal-vicuna')));
 assert.ok(!matching({search:'Diagonal Vicuña',maxPriceInput:'999999'}).includes(row('diagonal-vicuna')));
});
test('reception states and conflicting construction never enter automatic stage recommendations',()=>{
 for(const slug of Object.keys(euro))if(euro[slug].state==='En recepción final'||euro[slug].stageConflict)assert.equal(facets[slug].purchaseStage.eligible,false,slug);
 for(const slug of ['plaza-de-lourdes','entre-vicunas','edificio-don-pepe-154'])assert.equal(facets[slug].purchaseStage.mode,'blanco');
});
test('models retain scoped unknowns, approximate averages are not exact areas',()=>{
 const models=json('data/euro-brochures.json').projects;
 assert.equal(Object.values(models).reduce((n,p)=>n+p.variants.length,0),42);
 assert.equal(models['mapocho-3521-edificio-a'].variants.length,0);
 assert.ok(facets['mapocho-3521'].variants.every(v=>!v.areas?.total));
 const kc=models['guillermo-mann-1401'].variants.find(v=>v.modelCode==='KC');assert.equal(kc.bathrooms,null);
 assert.ok(facets['rosas-1444'].variants.some(v=>v.bedrooms===1&&v.areas.total===31.07));
});
test('mortgage transfer resolves all commercial offers; never accepts URL prices',()=>{
 for(const p of rows.filter(p=>euro[p.slug]))for(const offer of p.commercialOffers){
  const ctx=guideProjectContext('?proyecto='+p.slug+'&oferta='+offer.id+'&precio=1',catalogue);
  assert.equal(ctx.propertyUf,offer.priceUF);assert.equal(ctx.typology,offer.label);assert.equal(ctx.propertyType,offer.propertyType);
 }
 assert.equal(guideProjectContext('?proyecto=independencia-4745&oferta=unknown',catalogue),null);
 assert.equal(guideProjectContext('?proyecto=independencia-4745&oferta=2d&oferta=local',catalogue),null);
 const input={propertyUf:8440.85,downMode:'percent',downValue:20,annualRatePercent:4,rateConvention:'nominal',years:20};
 const calc=calculateGuide(input);assert.ok(Math.abs(calc.principalUf-6752.68)<1e-8);assert.equal(calc.monthlyWithInsuranceUf,null);
});
test('quote and advisory use existing messages, stable product identifiers and bounded origins',()=>{
 const p=row('independencia-4745'),record={name:p.nombre,developer:'Euro',offers:p.commercialOffers};
 const body=brochureSelectionMessage(record,'local','Consulta');assert.match(body,/Local comercial/);assert.match(body,/8\.440,85/);assert.ok(!body.includes('3.146'));
 const message=adviceContext(p,'?oferta=local&origen=simulador&ingresos=999999','Consulta');assert.match(message,/Simulador educativo/);assert.match(message,/8\.440,85/);assert.ok(!message.includes('999999'));
 assert.equal(publicOrigin('?origen=https://evil.example','ficha'),'ficha');
});
