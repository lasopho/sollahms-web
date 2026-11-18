import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {loadNollagamOwnerQuoteContexts} from '../assets/js/catalog-nollagam-quote-consumer.mjs';
import {advancedFilterAndSort,defaults,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';
import {projectOffer,projectFacts,commercialLayerNote} from '../assets/js/catalog-model.mjs';

const catalogue=JSON.parse(readFileSync(new URL('../data/proyectos.json',import.meta.url)));
const facets=JSON.parse(readFileSync(new URL('../data/catalog-facets.json',import.meta.url)));
const ownerBytes=readFileSync(new URL('../data/catalog-nollagam-owner-quotes.json',import.meta.url));
const owner=JSON.parse(ownerBytes);
const originals=catalogue.map(project=>({...project,_facets:facets.projects[project.slug]}));
const layer=await loadNollagamOwnerQuoteContexts(originals,{cryptoImpl:webcrypto,fetchImpl:async()=>({
  ok:true,redirected:false,arrayBuffer:async()=>ownerBytes.buffer.slice(ownerBytes.byteOffset,ownerBytes.byteOffset+ownerBytes.byteLength)
})});
const attach=(projects,context=layer)=>projects.map(project=>context.bySlug[project.slug]
  ?{...project,_nollagamOwnerQuoteContext:context.bySlug[project.slug]}:project);
const bound=attach(originals),query=patch=>({...defaults(),...patch});
const one=slug=>bound.filter(project=>project.slug===slug);

for(const [slug,record] of Object.entries(owner.projects))for(const [bedrooms,price] of Object.entries(record.prices)){
  test('Nollagam application correlates '+slug+' '+bedrooms+'D with owner UF'+price,()=>{
    const state=query({bedrooms,minPriceInput:String(price),maxPriceInput:String(price)});
    const rows=advancedFilterAndSort(one(slug),state);
    assert.equal(rows.length,1);
    assert.equal(projectOffer(rows[0],state).value,price);
    assert.equal(projectOffer(rows[0],state).referenceId,'nollagam-owner:'+slug+':'+bedrooms+'d');
    assert.deepEqual(projectFacts(rows[0],'',state),[{label:'Tipologías',value:bedrooms==='0'?'Estudio':bedrooms==='1'?'1 dormitorio':bedrooms+' dormitorios'}]);
    assert.match(commercialLayerNote(rows[0],state),/28\/10\/2026/);
    assert.match(commercialLayerNote(rows[0],state),/no acredita unidad ni stock/);
    assert.deepEqual(matchedLabels(rows[0],state),[]);
  });
}

test('Nollagam never borrows bathroom, type, surface, amenities or extras for its price',()=>{
  for(const extra of [{bathrooms:'2'},{propertyType:'departamento'},{assetType:'Residencial'},
    {minArea:'1',areaType:'util'},{amenities:['piscina']},{features:['termopanel']},
    {parking:'included'},{storage:'available'}]){
    assert.equal(advancedFilterAndSort(one('costanera-coquimbo-a'),query({
      bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100',...extra
    })).length,0);
  }
});

test('Nollagam default identities and published prices remain unchanged when price is inactive',()=>{
  const before=JSON.stringify(originals);
  const rows=advancedFilterAndSort(bound,defaults());
  assert.equal(rows.length,131);
  assert.deepEqual(rows.map(project=>project.slug),originals.map(project=>project.slug));
  for(const source of originals){
    const selected=rows.find(project=>project.slug===source.slug);
    assert.deepEqual(projectOffer(selected),projectOffer(source));
  }
  assert.equal(JSON.stringify(originals),before);
});

test('five unknown-price categories cannot borrow another category or the project minimum',()=>{
  let unknowns=0;
  for(const project of bound.filter(project=>layer.bySlug[project.slug])){
    for(const reference of layer.bySlug[project.slug].record.references.filter(reference=>reference.attributes.priceUF===null)){
      unknowns++;
      assert.equal(advancedFilterAndSort([project],query({bedrooms:String(reference.attributes.bedrooms),minPriceInput:'1'})).length,0);
    }
  }
  assert.equal(unknowns,5);
});

test('price projection recomputes a changed query rather than borrowing a previous match',()=>{
  const previous=query({bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'});
  const [result]=advancedFilterAndSort(one('costanera-coquimbo-a'),previous);
  assert.equal(projectOffer(result,previous).value,5070);
  const next=query({bedrooms:'2',minPriceInput:'4200',maxPriceInput:'4220'});
  assert.equal(projectOffer(result,next).value,4210);
});

test('an attached failed owner source closes active price queries and retains inactive identities',async()=>{
  const unavailable=await loadNollagamOwnerQuoteContexts(originals,{cryptoImpl:webcrypto,
    fetchImpl:async()=>({ok:false})});
  const failed=attach(originals,unavailable);
  assert.equal(advancedFilterAndSort(failed,defaults()).length,131);
  assert.equal(advancedFilterAndSort(failed.filter(project=>project.slug==='costanera-coquimbo-a'),query({minPriceInput:'1'})).length,0);
});

test('price sorting uses selected3D quotes rather than project minima',()=>{
  const state=query({bedrooms:'3',minPriceInput:'1',sortOrder:'price-asc'});
  const rows=advancedFilterAndSort(bound.filter(project=>layer.bySlug[project.slug]),state);
  assert.ok(rows.length>1);
  const prices=rows.map(project=>projectOffer(project,state).value);
  assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));
});
