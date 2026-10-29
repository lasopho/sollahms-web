import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {orient,choices,catalogUrl} from '../assets/js/purchase-stage-engine.mjs';
import {defaults,advancedFilterAndSort,readQuery,writeQuery} from '../assets/js/catalog-filter-engine.mjs';
const catalogue=JSON.parse(fs.readFileSync(new URL('../data/proyectos.json',import.meta.url))),facets=JSON.parse(fs.readFileSync(new URL('../data/catalog-facets.json',import.meta.url))).projects;
const rows=catalogue.map(p=>({...p,_facets:facets[p.slug]}));
const scenario={timing:'flexible',down:'disponible',priority:'precio',purpose:'vivir'};
test('all 72 combinations return bounded modes, reasons, warnings; purpose never ranks investment',()=>{
 let n=0;for(const timing of choices.timing)for(const down of choices.down)for(const priority of choices.priority){
 const a=orient({timing,down,priority,purpose:'vivir'}),b=orient({timing,down,priority,purpose:'invertir'});assert.deepEqual(a.modes,b.modes);assert.ok(a.reasons.length);assert.notEqual(a.context,b.context);assert.ok(a.modes.length>=1&&a.modes.length<=3);if(timing==='pronto')assert.deepEqual(a.modes,['inmediata']);n+=2;}
 assert.equal(n,72);
});
test('conflict between urgent timing and pie is explicit',()=>{const r=orient({...scenario,timing:'pronto',down:'cuotas'});assert.equal(r.conditional,true);assert.ok(r.warnings.some(x=>x.includes('no confirma que puedas comprar ahora')));});
test('ties and clear priorities are explained',()=>{assert.deepEqual(orient(scenario).modes,['blanco']);assert.deepEqual(orient({...scenario,priority:'avance'}).modes,['verde']);assert.deepEqual(orient({...scenario,priority:'terminada'}).modes,['inmediata']);assert.deepEqual(orient({...scenario,priority:'equilibrio'}).modes,['blanco','verde','inmediata']);assert.deepEqual(orient({...scenario,priority:'equilibrio',down:'cuotas'}).modes,['blanco','verde']);});
test('incomplete or invalid inputs cannot produce a recommendation',()=>{for(const bad of [null,{}, {...scenario,purpose:'<script>'},{...scenario,down:''}])assert.equal(orient(bad),null);});
test('guided URLs round-trip multiple modes without retaining answers',()=>{const url=catalogUrl(['blanco','verde','blanco','injected']);assert.equal(url,'/proyectos.html?modalidad=blanco&modalidad=verde');const state=readQuery(url.split('?')[1],{}).state;assert.deepEqual(state.purchaseModes,['blanco','verde']);assert.equal(writeQuery(state),'modalidad=blanco&modalidad=verde');assert.equal(state.search,'');});
test('guided filtering fails closed when facets are unavailable',()=>{assert.equal(advancedFilterAndSort(catalogue,{...defaults(),purchaseModes:['blanco','verde','inmediata']}).length,0);});
test('no reception pending, sold, unverified availability or another stage enters immediate results',()=>{const hits=advancedFilterAndSort(rows,{...defaults(),purchaseModes:['inmediata']});assert.deepEqual(hits.map(p=>p.slug).sort(),['angamos','centenario-1','domeyko-2055','san-ignacio']);for(const p of hits){assert.equal(p.estado,'Entrega inmediata');assert.ok(p._facets.purchaseStage.sourceUrl);assert.equal(p._facets.purchaseStage.checkedAt,'2026-10-29');}assert.ok(!hits.some(p=>['don-tomas','don-rafael','bordevivo','plaza-las-condes'].includes(p.slug)));});
test('mode unions remain compatible with existing location/price criteria and immutable price source',()=>{const before=JSON.stringify(rows);for(const m of ['blanco','verde','inmediata']){const hits=advancedFilterAndSort(rows,{...defaults(),purchaseModes:[m]});assert.ok(hits.length);for(const p of hits){assert.equal(p._facets.purchaseStage.mode,m);assert.equal(p.precioDesdeUF,catalogue.find(x=>x.slug===p.slug).precioDesdeUF);}}
 const s={...defaults(),purchaseModes:['verde','inmediata'],maxPriceInput:'5000',region:'Región Metropolitana'};for(const p of advancedFilterAndSort(rows,s)){assert.equal(p.region,s.region);assert.ok(p.precioDesdeUF>0&&p.precioDesdeUF<=5000);}assert.equal(JSON.stringify(rows),before);
});
