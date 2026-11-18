import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {EURO_OWNER_SOURCE_PATH,EURO_OWNER_SOURCE_SHA256,EURO_OWNER_ORIGINAL_SOURCE_PATH,
  EURO_OWNER_ORIGINAL_SOURCE_SHA256,parseEuroOwnerSource,loadEuroOwnerSource,
  bindEuroOwnerQuotes,unavailableEuroOwnerQuotes,euroOwnerQuoteLoadFailed,usesEuroOwnerQuotes,
  matchEuroOwnerQuotes,euroOwnerQuoteOffer} from '../assets/js/catalog-euro-owner-quotes.mjs';
import {advancedFilterAndSort,defaults,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';
import {projectOffer,offerPriceLabel,projectFacts,commercialLayerNote} from '../assets/js/catalog-model.mjs';

const text=await readFile(new URL('../data/catalog-euro-owner-quotes.json',import.meta.url),'utf8');
const source=await parseEuroOwnerSource(text),owner=JSON.parse(text);
const originalText=await readFile(new URL('../data/euro-commercial.json',import.meta.url),'utf8');
const originalOwner=JSON.parse(originalText);
const catalogue=JSON.parse(await readFile(new URL('../data/proyectos.json',import.meta.url),'utf8'));
const facets=JSON.parse(await readFile(new URL('../data/catalog-facets.json',import.meta.url),'utf8'));
const original=catalogue.map(project=>({...project,_facets:facets.projects[project.slug]??{}}));
const bound=bindEuroOwnerQuotes(original,source);
const bySlug=new Map(bound.map(project=>[project.slug,project]));
const state=patch=>({...defaults(),...patch});
const run=(project,patch)=>advancedFilterAndSort([project],state(patch));
const donPepe=bySlug.get('edificio-don-pepe-154');
const q1={minPriceInput:'3306.18',maxPriceInput:'3306.18',bedrooms:'1'};
const q2={minPriceInput:'3562',maxPriceInput:'3562',bedrooms:'2'};

for(const [slug,projectOwner] of Object.entries(owner.projects))for(const [key,price] of Object.entries(projectOwner.prices)){
  test(slug+' uses its exact owner '+key+' price reference',()=>{
    const patch={minPriceInput:String(price),maxPriceInput:String(price),
      ...(key==='local'?{propertyType:'local',assetType:'Comercial'}:{bedrooms:key})};
    const rows=run(bySlug.get(slug),patch);
    assert.equal(rows.length,1);
    const match=rows[0]._euroOwnerQuoteMatch;
    assert.deepEqual(match.issues,[]);
    assert.deepEqual(match.matchedReferenceIds,[slug+':owner-price:'+key]);
    const reference=match.references[0];
    assert.equal(reference.sourceDate,'2026-10-29');
    assert.equal(reference.sourcePath,EURO_OWNER_ORIGINAL_SOURCE_PATH);
    assert.equal(reference.sourceSHA256,EURO_OWNER_ORIGINAL_SOURCE_SHA256);
    assert.equal(reference.publicSourcePath,EURO_OWNER_SOURCE_PATH);
    assert.equal(reference.publicSourceSHA256,EURO_OWNER_SOURCE_SHA256);
    assert.equal(reference.attributes.priceUF,price);
    assert.equal(reference.attributes.bathrooms,null);
    assert.equal(reference.attributes.usefulM2,null);
    assert.equal(reference.attributes.totalM2,null);
    assert.equal(reference.attributes.propertyType,key==='local'?'local':null);
    assert.equal(reference.attributes.assetType,key==='local'?'Comercial':null);
    assert.equal(reference.unit,null);assert.equal(reference.model,null);assert.equal(reference.stock,null);
    assert.equal(projectOffer(rows[0],state(patch)).value,price);
  });
}

test('source transport is pinned before records can be constructed',async()=>{
  const calls=[];
  const loaded=await loadEuroOwnerSource(async(path,options)=>{calls.push({path,options});return {ok:true,text:async()=>text};});
  assert.equal(calls.length,1);assert.equal(calls[0].path,'/data/catalog-euro-owner-quotes.json');
  assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.redirect,'error');
  assert.equal(bindEuroOwnerQuotes(original,loaded).length,131);
  await assert.rejects(parseEuroOwnerSource(text+' '),/SHA-256 mismatch/);
  assert.throws(()=>bindEuroOwnerQuotes(original,{...source}),/verified source required/);
});

test('same-origin authentication barrier serves only the pinned Euro public fixture',async()=>{
  const calls=[];
  const loaded=await loadEuroOwnerSource(async(path,options)=>{
    calls.push({path,credentials:options.credentials,redirect:options.redirect});
    if(options.credentials!=='same-origin')throw new TypeError('simulated authentication redirect blocked');
    assert.equal(options.redirect,'error');assert.equal(Object.hasOwn(options,'headers'),false);
    return {ok:true,text:async()=>text};
  });
  assert.deepEqual(calls,[{path:EURO_OWNER_SOURCE_PATH,credentials:'same-origin',redirect:'error'}]);
  assert.equal(loaded.publicSHA256,EURO_OWNER_SOURCE_SHA256);
  for(const respond of [
    async()=>{throw new TypeError('simulated authentication redirect blocked');},
    async()=>({ok:false,status:302}),
  ]){
    const paths=[];
    await assert.rejects(loadEuroOwnerSource(async(path,options)=>{
      paths.push(path);assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');
      return respond();
    }),/simulated authentication redirect blocked|source unavailable/);
    assert.deepEqual(paths,[EURO_OWNER_SOURCE_PATH]);
  }
});

test('public projection contains exactly the original21 owner prices and permitted identity fields',()=>{
  assert.equal(createHash('sha256').update(originalText).digest('hex'),EURO_OWNER_ORIGINAL_SOURCE_SHA256);
  assert.equal(createHash('sha256').update(text).digest('hex'),EURO_OWNER_SOURCE_SHA256);
  assert.deepEqual(Object.keys(owner).sort(),['projectionKind','projects','schemaVersion','source']);
  assert.equal(owner.projectionKind,'catalog-euro-owner-quotes-v1');
  assert.deepEqual(owner.source,{type:'owner-supplied',date:'2026-10-29',
    originalPath:EURO_OWNER_ORIGINAL_SOURCE_PATH,originalSHA256:EURO_OWNER_ORIGINAL_SOURCE_SHA256});
  assert.deepEqual(Object.keys(owner.projects),Object.keys(originalOwner.projects));
  const fields=['developer','commune','region','prices','priceStrings','projectFromUF','priceScope'];
  for(const [slug,project] of Object.entries(owner.projects)){
    assert.deepEqual(Object.keys(project),fields);
    assert.deepEqual(project,Object.fromEntries(fields.map(key=>[key,originalOwner.projects[slug][key]])));
  }
  assert.equal(Object.keys(owner.projects).length,12);
  assert.equal(Object.values(owner.projects).reduce((count,project)=>count+Object.keys(project.prices).length,0),21);
  assert.deepEqual(owner.projects['diagonal-vicuna'].prices,{});
  assert.deepEqual(owner.projects['diagonal-vicuna'].priceStrings,{});
  assert.equal(owner.projects['diagonal-vicuna'].projectFromUF,null);
  assert.equal(JSON.stringify(owner).includes('inheritedPriceReview'),false);
});

test('raw owner payload is rejected without retrying the private original endpoint',async()=>{
  const paths=[];
  await assert.rejects(parseEuroOwnerSource(originalText),/SHA-256 mismatch/);
  await assert.rejects(loadEuroOwnerSource(async path=>{
    paths.push(path);return {ok:true,text:async()=>originalText};
  }),/SHA-256 mismatch/);
  assert.deepEqual(paths,['/data/catalog-euro-owner-quotes.json']);
});

for(const [scope,change] of [
  ['root',projection=>{projection.notes='Private notes';}],
  ['source',projection=>{projection.source.screenshots=['private.png'];}],
  ['project history',projection=>{projection.projects['diagonal-vicuna'].inheritedPriceReview={priceUF:3184};}],
  ['project state',projection=>{projection.projects['edificio-don-pepe-154'].state='Private state';}],
  ['price key',projection=>{projection.projects['edificio-don-pepe-154'].prices['3']=3562;
    projection.projects['edificio-don-pepe-154'].priceStrings['3']='3562';}]
])test('public projection rejects unapproved '+scope+' fields before normalization',async()=>{
  const before=JSON.stringify(owner),altered=structuredClone(owner);change(altered);
  await assert.rejects(parseEuroOwnerSource(JSON.stringify(altered)),/SHA-256 mismatch/);
  assert.equal(JSON.stringify(owner),before);
});

test('Diagonal has no owner price and never acquires a historical campaign amount',()=>{
  const project=bySlug.get('diagonal-vicuna');
  assert.equal(project.precioDesdeUF,null);
  assert.equal(euroOwnerQuoteLoadFailed(project),false);
  assert.equal(run(project,{minPriceInput:'0'}).length,0);
  assert.equal(run(project,{minPriceInput:'1',bedrooms:'1'}).length,0);
  assert.equal(euroOwnerQuoteOffer(project,state({minPriceInput:'1'})).value,null);
});

test('1D and2D prices never cross between the existing DonPepe quotes',()=>{
  assert.equal(run(donPepe,{...q1,bedrooms:'2'}).length,0);
  assert.equal(run(donPepe,{...q2,bedrooms:'1'}).length,0);
});

test('importer department and residential defaults are not quote evidence',()=>{
  assert.equal(donPepe.commercialOffers[0].propertyType,'departamento');
  assert.equal(run(donPepe,{...q1,propertyType:'departamento'}).length,0);
  assert.equal(run(donPepe,{...q1,assetType:'Residencial'}).length,0);
  assert.equal(run(donPepe,{...q1,propertyType:'local'}).length,0);
});

test('bathrooms, generic surfaces and private spaces are not lent to a priced quote',()=>{
  assert.equal(run(donPepe,{...q1,bathrooms:'1'}).length,0);
  for(const areaType of ['util','total','interior','terraza','jardin','terreno']){
    assert.equal(run(donPepe,{...q1,areaType,minArea:'29',maxArea:'29'}).length,0,areaType);
  }
  for(const features of [['terraza-privada'],['jardin-privado']])assert.equal(run(donPepe,{...q1,features}).length,0);
});

test('unknown extras and residential amenities cannot complete an unknown-use quote',()=>{
  assert.equal(run(donPepe,{...q1,parking:'included'}).length,0);
  assert.equal(run(donPepe,{...q1,storage:'available'}).length,0);
  assert.equal(run(donPepe,{...q1,amenities:['piscina']}).length,0);
  const result=run(donPepe,q1)[0];
  assert.deepEqual(matchedLabels(result,state({...q1,amenities:['piscina']})),[]);
});

test('Independencia Local stays separate from residential categories and amenities',()=>{
  const project=bySlug.get('independencia-4745');
  const local={minPriceInput:'8440.85',maxPriceInput:'8440.85',propertyType:'local',assetType:'Comercial'};
  assert.equal(project.catalogPricePolicy,'by-product');
  assert.equal(project.precioDesdeUF,3146.65);
  assert.equal(run(project,local).length,1);
  assert.equal(run(project,{...local,bedrooms:'2'}).length,0);
  assert.equal(run(project,{...local,bathrooms:'1'}).length,0);
  assert.equal(run(project,{...local,amenities:['piscina']}).length,0);
  assert.equal(run(project,{...local,minPriceInput:'3146.65',maxPriceInput:'3146.65'}).length,0);
  assert.equal(projectOffer(run(project,local)[0],state(local)).financialBaselineCompatible,false);
});

test('2D projection uses only that price typology, its owner date and non-stock scope',()=>{
  const project=run(donPepe,q2)[0],input=state(q2),offer=projectOffer(project,input);
  assert.equal(offer.value,3562);assert.equal(offer.typology,'2 dormitorios');
  assert.equal(offer.financialBaselineCompatible,false);
  assert.equal(offerPriceLabel(project,input),'Desde UF 3.562');
  const facts=projectFacts(project,'',input);
  assert.ok(facts.some(fact=>fact.label==='Tipología del precio'&&fact.value==='2 dormitorios'));
  assert.ok(!facts.some(fact=>/1 dormitorio|1D/.test(fact.value)));
  assert.ok(!facts.some(fact=>/Superficie|Baños/.test(fact.label)));
  assert.match(commercialLayerNote(project,input),/29\/10\/2026/);
  assert.match(commercialLayerNote(project,input),/sin asignación a unidad o modelo/);
  assert.match(commercialLayerNote(project,input),/disponibilidad por confirmar; no acredita stock/);
  assert.equal(project.precioDesdeUF,3306.18);
});

test('price sorting uses the matching2D amount rather than the global minimum',()=>{
  const input=state({bedrooms:'2',minPriceInput:'0',sortOrder:'price-asc'});
  const projects=bound.filter(project=>Object.hasOwn(owner.projects,project.slug));
  const rows=advancedFilterAndSort(projects,input);
  const expected=Object.entries(owner.projects).filter(([,row])=>row.prices['2']!==undefined)
    .map(([slug,row])=>({slug,price:row.prices['2']})).sort((a,b)=>a.price-b.price);
  assert.deepEqual(rows.map(project=>({slug:project.slug,price:projectOffer(project,input).value})),expected);
});

test('a previous query witness is not reused after the selected bedroom changes',()=>{
  const first=run(donPepe,q1)[0];
  assert.equal(projectOffer(first,state(q2)).value,3562);
  assert.equal(run(first,q2)[0]._euroOwnerQuoteMatch.matchedReferenceIds[0],'edificio-don-pepe-154:owner-price:2');
});

test('a forged matching result cannot substitute another quote or manufacture a local type',()=>{
  const input=state(q1),legitimate=matchEuroOwnerQuotes(donPepe,input);
  const foreign=matchEuroOwnerQuotes(donPepe,state(q2)).references[0];
  const forged={...legitimate,references:[foreign],matchedReferenceIds:[foreign.id]};
  const offer=euroOwnerQuoteOffer(donPepe,input,forged);
  assert.equal(offer.value,3306.18);
  assert.equal(offer.referenceId,'edificio-don-pepe-154:owner-price:1');
  assert.equal(offer.propertyType,null);
  const local=bySlug.get('independencia-4745');
  const localOffer=euroOwnerQuoteOffer(local,state({minPriceInput:'8440.85',maxPriceInput:'8440.85',propertyType:'local'}));
  assert.equal(localOffer.propertyType,'local');
});

test('a legitimate matching result and its reference arrays are immutable',()=>{
  const input=state(q1),legitimate=matchEuroOwnerQuotes(donPepe,input);
  const foreign=matchEuroOwnerQuotes(donPepe,state(q2)).references[0];
  assert.equal(Object.isFrozen(legitimate),true);
  assert.equal(Object.isFrozen(legitimate.references),true);
  assert.equal(Object.isFrozen(legitimate.matchedReferenceIds),true);
  assert.throws(()=>legitimate.references.push(foreign),TypeError);
  assert.throws(()=>{legitimate.references[0]=foreign;},TypeError);
  assert.throws(()=>legitimate.matchedReferenceIds.push(foreign.id),TypeError);
  assert.equal(euroOwnerQuoteOffer(donPepe,input,legitimate).value,3306.18);
});

test('source transport failure does not revert owner Euro price queries to legacy matching',async()=>{
  await assert.rejects(loadEuroOwnerSource(async()=>({ok:false})),/source unavailable/);
  const failed=unavailableEuroOwnerQuotes(original),local=failed.find(project=>project.slug==='independencia-4745');
  assert.equal(failed.filter(euroOwnerQuoteLoadFailed).length,12);
  assert.equal(run(failed.find(project=>project.slug===donPepe.slug),q1).length,0);
  assert.equal(run(local,{minPriceInput:'8440.85',maxPriceInput:'8440.85',propertyType:'local'}).length,0);
  assert.equal(projectOffer(local,state({minPriceInput:'8440.85',propertyType:'local'})).value,null);
});

test('a mismatched published amount/date or registered identity closes only that context',()=>{
  for(const patch of [{precioDesdeUF:1},{commercialSource:{...donPepe.commercialSource,date:'2026-10-30'}},
    {comuna:'Otra comuna'}]){
    const altered=bindEuroOwnerQuotes([{...donPepe,...patch}],source)[0];
    assert.equal(euroOwnerQuoteLoadFailed(altered),true);
    assert.equal(run(altered,q1).length,0);
  }
  assert.equal(run({...donPepe,slug:'other-project'},q1).length,0);
});

test('source normalization and matching do not mutate original catalogue values',()=>{
  const before=JSON.stringify(original),raw=JSON.stringify(source.evidence);
  const rebound=bindEuroOwnerQuotes(original,source);
  advancedFilterAndSort(rebound,state({minPriceInput:'0',bedrooms:'2'}));
  assert.equal(JSON.stringify(original),before);assert.equal(JSON.stringify(source.evidence),raw);
  assert.equal(Object.isFrozen(source.evidence),true);
});

test('queries without price keep the previous model/facet route, even if source loading fails',()=>{
  const failed=unavailableEuroOwnerQuotes(original);
  for(const patch of [{},{bedrooms:'1'},{bedrooms:'2',bathrooms:'1'},{propertyType:'departamento'},
    {areaType:'util',minArea:'1'}]){
    const input=state(patch),base=advancedFilterAndSort(original,input).map(project=>project.slug);
    assert.deepEqual(advancedFilterAndSort(bound,input).map(project=>project.slug),base);
    assert.deepEqual(advancedFilterAndSort(failed,input).map(project=>project.slug),base);
    assert.equal(usesEuroOwnerQuotes(donPepe,input),false);
  }
});

test('prepared and documentary queries never consume the new published owner context',()=>{
  for(const evidenceMode of ['prepared','documentary']){
    const input=state({...q1,evidenceMode});
    assert.equal(usesEuroOwnerQuotes(donPepe,input),false);
    assert.deepEqual(advancedFilterAndSort(bound,input).map(project=>project.slug),advancedFilterAndSort(original,input).map(project=>project.slug));
  }
});

for(const developer of ['AJ Urbana','Sento','León','Ecasa'])test(developer+' keeps its previous commercial route',()=>{
  const before=original.filter(project=>project.inmobiliaria===developer),after=bound.filter(project=>project.inmobiliaria===developer);
  assert.deepEqual(after,before);after.forEach((project,index)=>assert.equal(project,before[index]));
  const input=state({bedrooms:'2',minPriceInput:'0',sortOrder:'price-asc'});
  const view=rows=>rows.map(project=>({slug:project.slug,price:projectOffer(project,input).value}));
  assert.deepEqual(view(advancedFilterAndSort(after,input)),view(advancedFilterAndSort(before,input)));
});
