import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectOffer,offerPriceLabel,projectFacts,commercialLayerNote} from '../assets/js/catalog-model.mjs';

const reference=(id,attributes)=>({id,attributes});
const project=references=>({slug:'example',precioDesdeUF:1111,_commercial:{asOf:'2026-11-16',projectFacts:{}},_commercialMatch:{references}});

test('a matching unpriced plan cannot display the unrelated published price',()=>{
  const p=project([reference('plan',{bedrooms:2,bathrooms:2,totalM2:80})]);
  assert.equal(projectOffer(p).value,null);
  assert.equal(offerPriceLabel(p),'Precio de esta referencia por confirmar');
  assert.ok(projectFacts(p).some(f=>f.label==='Superficie total'&&f.value==='80 m²'));
});
test('a displayed quote and facts share the same reference, without borrowing model areas',()=>{
  const p=project([reference('quote',{priceUF:3949,bedrooms:1,bathrooms:1}),reference('plan',{bedrooms:2,totalM2:80})]);
  assert.equal(projectOffer(p).referenceId,'quote');
  assert.equal(projectOffer(p).value,3949);
  assert.equal(projectFacts(p).find(f=>f.label==='Tipología de referencia').value,'1D / 1B');
  assert.ok(!projectFacts(p).some(f=>f.label.includes('Superficie')));
  assert.ok(offerPriceLabel(p).startsWith('Referencia UF '));
  assert.ok(commercialLayerNote(p).includes('16/11/2026'));
  assert.ok(commercialLayerNote(p).includes('disponibilidad por confirmar'));
});
test('published records retain their existing price presentation',()=>{
  const p={slug:'published',precioDesdeUF:3000.25};
  assert.equal(projectOffer(p).value,3000.25);
  assert.equal(offerPriceLabel(p),'Desde UF 3.000,25');
  assert.equal(commercialLayerNote(p),'');
});
