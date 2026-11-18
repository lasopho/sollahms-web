import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {financialReferenceCompatible} from '../assets/js/catalog-financial-witness.mjs';
import {projectOffer} from '../assets/js/catalog-model.mjs';
import {verifiedProjectPrice} from '../assets/js/project-finance.mjs';
import {advancedFilterAndSort,defaults} from '../assets/js/catalog-filter-engine.mjs';

const projects=JSON.parse(readFileSync(new URL('../data/proyectos.json',import.meta.url)));
const bcome=projects.find(project=>project.slug==='bcome');
const facets=JSON.parse(readFileSync(new URL('../data/catalog-facets.json',import.meta.url)));

test('a selected Bcome2D price never displays the financial baseline for Estudio',()=>{
  const baseline=verifiedProjectPrice(bcome,'2026-11-17');
  const selected=projectOffer(bcome,{bedrooms:'2'});
  assert.equal(baseline.valueUf,2930);
  assert.equal(baseline.typology,'Estudio');
  assert.equal(selected.value,3855);
  assert.equal(selected.typology,'2 dormitorios');
  assert.equal(financialReferenceCompatible(bcome,selected),false);
});

test('the original Bcome Estudio retains its compatible financial baseline',()=>{
  assert.equal(financialReferenceCompatible(bcome,projectOffer(bcome)),true);
});

test('an equal amount never identifies a different typology as the same financial scenario',()=>{
  // Deliberately synthetic test clone, never a source or catalogue amendment.
  const copy=structuredClone(bcome);
  copy.commercialOffers.find(offer=>offer.id==='2d').priceUF=2930;
  const selected=projectOffer(copy,{bedrooms:'2'});
  assert.equal(selected.value,2930);
  assert.equal(financialReferenceCompatible(copy,selected),false);
});

test('a source without a typology preserves its original amount without null/undefined mismatch',()=>{
  const project=projects.find(project=>project.slug==='distrito-centro');
  assert.equal(project.precioDesdeTipologia,undefined);
  assert.equal(projectOffer(project).value,project.precioDesdeUF);
  assert.equal(financialReferenceCompatible(project,projectOffer(project)),true);
});

test('Plaza213 typology price cannot display the separate public313 baseline',()=>{
  const project=projects.find(project=>project.slug==='plaza-las-condes');
  const selected=projectOffer(project,{bedrooms:'2'});
  assert.equal(project.precioDesdeUF,11073);
  assert.equal(selected.value,11119);
  assert.equal(financialReferenceCompatible(project,selected),false);
});

test('AJ selected1D keeps its own price and hides its Estudio financial scenario',()=>{
  const project=projects.find(project=>project.slug==='edificio-teatinos-750');
  assert.equal(financialReferenceCompatible(project,projectOffer(project)),true);
  const selected=projectOffer(project,{bedrooms:'1'});
  assert.equal(selected.value,3315);
  assert.equal(financialReferenceCompatible(project,selected),false);
});

for(const [slug,bedrooms,price,baseline,stage] of [
  ['ferroparque','0',2240,2360,'ferroparque-2'],
  ['lomas-de-puyai','2',4220,5260,'lomas-de-puyai-3'],
  ['terratolten','2',3750,2780,'terratolten-1']
])test('Ecasa '+stage+' keeps the original project financial baseline separate',()=>{
  const source=projects.find(project=>project.slug===slug),before=JSON.stringify(source);
  const query={...defaults(),bedrooms,minPriceInput:String(price),maxPriceInput:String(price)};
  const matches=advancedFilterAndSort([{...source,_facets:facets.projects[slug]}],query);
  assert.equal(matches.length,1);
  assert.equal(matches[0]._ecasaStageSlug,stage);
  const selected=projectOffer(matches[0],query);
  assert.equal(source.precioDesdeUF,baseline);
  assert.equal(selected.value,price);
  assert.equal(financialReferenceCompatible(source,selected),false);
  assert.equal(JSON.stringify(source),before);
});

test('Ecasa reference stage remains compatible when its amount and typology are unchanged',()=>{
  const source=projects.find(project=>project.slug==='ferroparque');
  const matches=advancedFilterAndSort([{...source,_facets:facets.projects.ferroparque}],defaults());
  assert.equal(matches.length,1);
  assert.equal(matches[0]._ecasaStageSlug,'ferroparque');
  assert.equal(financialReferenceCompatible(source,projectOffer(matches[0])),true);
});

test('an explicit incompatible source flag always suppresses the cached scenario',()=>{
  assert.equal(financialReferenceCompatible(bcome,{value:2930,typology:'Estudio',financialBaselineCompatible:false}),false);
});

test('missing identity and unknown, zero or invalid amounts never authorize decoration',()=>{
  assert.equal(financialReferenceCompatible(null,{value:2930,typology:'Estudio'}),false);
  for(const value of [null,undefined,0,NaN,Infinity,'2930']){
    assert.equal(financialReferenceCompatible(bcome,{value,typology:'Estudio'}),false);
  }
});

test('a compatible flag does not override a different amount or typology',()=>{
  for(const offer of [{value:3855,typology:'2 dormitorios'},{value:2930,typology:'2 dormitorios'}]){
    assert.equal(financialReferenceCompatible(bcome,{...offer,financialBaselineCompatible:true}),false);
  }
});
