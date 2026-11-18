import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import {parseCatalogExpansion,validateCatalogExpansion,appendCatalogExpansion,loadCatalogExpansion,
  CATALOG_EXPANSION_SOURCE_SHA256,CATALOG_EXPANSION_FAILURE,isCatalogExpansionProject,
  catalogExpansionOffer,catalogExpansionPriceLabel,catalogExpansionFacts,catalogExpansionSourceLabel,
  publishedFinancialProjects,onlyExpansionResults,sortWithPublishedFinancials} from '../assets/js/catalog-expansion.mjs';
import {advancedFilterAndSort,defaults} from '../assets/js/catalog-filter-engine.mjs';
import {projectOffer,offerPriceLabel,projectFacts} from '../assets/js/catalog-model.mjs';
import {facetOptions} from '../assets/js/catalog-filter-controls.mjs';
import {financialReferenceCompatible} from '../assets/js/catalog-financial-witness.mjs';
import {locateProjects} from '../assets/js/catalog-map-model.mjs';

globalThis.crypto??=webcrypto;
const content=await readFile(new URL('../data/catalog-expansion-iris-20261118.json',import.meta.url),'utf8');
const sourceData=JSON.parse(content);
const registered=JSON.parse(await readFile(new URL('../data/proyectos.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../data/catalog-facets.json',import.meta.url),'utf8'));
const original=registered.map(p=>({...p,_facets:index.projects[p.slug]}));
const source=await parseCatalogExpansion(content,{cryptoImpl:webcrypto});
const expanded=appendCatalogExpansion(original,source),added=expanded.slice(original.length);
const state=patch=>({...defaults(),...patch});
const find=(slug,patch={})=>advancedFilterAndSort(added,state(patch)).find(p=>p.slug===slug);

test('152 identities append without rewriting or reordering any existing project',()=>{
  assert.equal(original.length,131);assert.equal(added.length,21);assert.equal(expanded.length,152);
  for(let i=0;i<original.length;i++)assert.equal(expanded[i],original[i]);
  assert.equal(new Set(expanded.map(p=>p.slug)).size,152);
  assert.equal(advancedFilterAndSort(added,defaults()).length,21);
  assert.ok(added.every(p=>p.precioDesdeUF===null&&isCatalogExpansionProject(p)));
});

test('project from-price and type share only their own project block, not rooms',()=>{
  const p=find('alameda-4719',{propertyType:'departamento',minPriceInput:'2400',maxPriceInput:'2400'});
  assert.ok(p);assert.equal(projectOffer(p,state({propertyType:'departamento',minPriceInput:'2400',maxPriceInput:'2400'})).value,2400);
  assert.equal(find('alameda-4719',{propertyType:'departamento',bathrooms:'1',maxPriceInput:'2400'}),undefined);
  assert.equal(advancedFilterAndSort(added,state({bedrooms:'0'})).length,0);
});

test('Iris header ranges and literal Estudio cannot manufacture a zero or a room category',()=>{
  assert.equal(find('alameda-4719',{bedrooms:'0'}),undefined);
  assert.equal(find('alameda-4719',{bedrooms:'1'}),undefined);
  const changed=structuredClone(sourceData);changed.projects[0].headerBedroomProfile.bedroomsExact=1;
  assert.throws(()=>validateCatalogExpansion(changed),/range cannot expand/);
});

test('a project without owner prices presents its exact external 2D/2B/UF2771 witness',()=>{
  const s=state({maxPriceInput:'4000',bedrooms:'2',bathrooms:'2'}),p=find('condominio-altos-del-penon',s);
  assert.ok(p);const offer=projectOffer(p,s);
  assert.equal(offer.value,2771);assert.equal(offer.origin,'iris-exact-reference');
  assert.match(offerPriceLabel(p,s),/Referencia Iris UF 2\.771/);
  assert.equal(offer.sourceURL,'https://iris.yapo.cl/proyecto/1556?operation=Venta');
  assert.match(catalogExpansionSourceLabel(p,s),/Iris · consulta 18\/11\/2026/);
  assert.equal(offer.financialBaselineCompatible,false);
  assert.ok(projectFacts(p,'',s).some(f=>f.value==='2D / 2B'));
});

test('owner UF4550 remains a separate 2D reference and never borrows the external two bathrooms',()=>{
  const s=state({minPriceInput:'4550',maxPriceInput:'4550',bedrooms:'2'}),p=find('compania-1735',s);
  assert.ok(p);assert.equal(projectOffer(p,s).value,4550);assert.equal(projectOffer(p,s).origin,'owner-existing');
  assert.equal(find('compania-1735',{minPriceInput:'4550',maxPriceInput:'4550',bedrooms:'2',bathrooms:'2'}),undefined);
  assert.equal(find('compania-1735',{maxPriceInput:'4000',bedrooms:'2',bathrooms:'2'}),undefined);
  assert.equal(find('compania-1735',{maxPriceInput:'4000'}),undefined);
  const unpriced=find('compania-1735',{bedrooms:'2',bathrooms:'2'});
  assert.ok(unpriced);assert.equal(projectOffer(unpriced,state({bedrooms:'2',bathrooms:'2'})).value,null);
  assert.match(offerPriceLabel(unpriced,state({bedrooms:'2',bathrooms:'2'})),/Sin precio del propietario/);
  assert.equal(find('compania-1735',{maxPriceInput:'4000',bedrooms:'2',bathrooms:'2',propertyType:'departamento'}),undefined);
});

test('Nuevo Vivaceta owner category does not borrow the external studio bathroom or Internos',()=>{
  const s=state({bedrooms:'2',minPriceInput:'2600',maxPriceInput:'2600'}),p=find('nuevo-vivaceta',s);
  assert.ok(p);assert.equal(projectOffer(p,s).origin,'owner-existing');
  assert.equal(find('nuevo-vivaceta',{...s,bathrooms:'1'}),undefined);
  assert.equal(find('nuevo-vivaceta',{bedrooms:'0'}),undefined);
});

test('canonical surface filters remain negative for all unlabelled Internos summaries',()=>{
  for(const areaType of ['util','total','interior']){
    assert.equal(advancedFilterAndSort(added,state({areaType,minArea:'0',maxArea:'10000'})).length,0);
    assert.equal(advancedFilterAndSort(added,state({areaType,minArea:'0',maxPriceInput:'100000'})).length,0);
  }
  const p=find('nuevo-vivaceta',{bathrooms:'1'});
  assert.ok(catalogExpansionFacts(p,state({bathrooms:'1'})).some(f=>f.label==='Internos (rótulo Iris)'));
});

test('explicit terrace quantities do not establish private terrace rights or included extras',()=>{
  const zeros=advancedFilterAndSort(added,state({areaType:'terraza',minArea:'0',maxArea:'0'}));
  assert.ok(zeros.length>0);
  assert.equal(advancedFilterAndSort(added,state({features:['terraza-privada']})).length,0);
  for(const kind of ['parking','storage'])for(const value of ['included','available','additional'])assert.equal(advancedFilterAndSort(added,state({[kind]:value})).length,0);
});

test('project amenities never lend residential use to a separately unknown unit reference',()=>{
  assert.ok(find('alameda-4719',{amenities:['piscina']}));
  assert.ok(find('alameda-4719',{maxPriceInput:'2400',amenities:['piscina']}));
  assert.equal(find('alameda-4719',{maxPriceInput:'2400',bathrooms:'1',amenities:['piscina']}),undefined);
  assert.equal(find('alameda-4719',{maxPriceInput:'2400',bathrooms:'1',assetType:'Residencial'}),undefined);
});

test('unavailable stock, legal purchase stages and unit/model selectors stay negative',()=>{
  assert.equal(advancedFilterAndSort(added,state({purchaseModes:['inmediata']})).length,0);
  for(const k of ['unit','model','stock','availability'])assert.equal(advancedFilterAndSort(added,state({[k]:'requested'})).length,0);
  assert.equal(find('alameda-4719',{state:'En recepción final'}),undefined);
  assert.deepEqual(advancedFilterAndSort(added,state({state:'En recepción final'})).map(p=>p.slug),['compania-1735']);
});

test('GPR and new geography come from the composed catalogue options, without synthetic areas',()=>{
  const options=facetOptions(expanded,{...index,expansionCount:21});
  assert.ok(options.developers.includes('GPR'));
  assert.equal(advancedFilterAndSort(added,state({developers:['GPR']})).length,9);
  assert.deepEqual(options.areaTypes.map(x=>x.id),['util','total']);
  for(const p of added){assert.ok(options.regions.includes(p.region));assert.ok(options.communes.includes(p.comuna));}
});

test('the existing Los Lagos region includes both new GPR projects without a duplicate option',()=>{
  const rows=advancedFilterAndSort(added,state({region:'Los Lagos',developers:['GPR']}));
  assert.deepEqual(rows.map(p=>p.slug).sort(),['condominio-hacienda-volcanes','terrazas-del-mirador']);
  const regions=facetOptions(expanded,{...index,expansionCount:21}).regions;
  assert.ok(regions.includes('Los Lagos'));assert.ok(!regions.includes('De los Lagos'));
});

test('the existing Biobío region includes Junquillar GPR without a duplicate option',()=>{
  const rows=advancedFilterAndSort(added,state({region:'Biobío',developers:['GPR']}));
  assert.deepEqual(rows.map(p=>p.slug),['condominio-hacienda-junquillar']);
  const regions=facetOptions(expanded,{...index,expansionCount:21}).regions;
  assert.ok(regions.includes('Biobío'));assert.ok(!regions.includes('Del Biobío'));
});

test('an explicit Casa label does not manufacture residential use for the GPR source',()=>{
  const typed=state({developers:['GPR'],propertyType:'casa'});
  assert.equal(advancedFilterAndSort(added,typed).length,7);
  assert.equal(advancedFilterAndSort(added,{...typed,assetType:'Residencial'}).length,0);
  assert.equal(advancedFilterAndSort(added,state({developers:['GPR'],assetType:'Residencial'})).length,0);
  assert.ok(facetOptions(expanded,{...index,expansionCount:21}).assetTypes.includes('Residencial'));
  assert.ok(added.every(p=>p.tipoActivo===null&&p._facets.assetTypes.length===0));
  assert.ok(added.every(p=>p._facets.features.every(f=>f.scope==='project-general'&&['casa','departamento'].includes(f.propertyTypeScope))));
});

test('price sorting uses exactly the reference value selected for each displayed new result',()=>{
  for(const [sortOrder,sign] of [['price-asc',1],['price-desc',-1]]){
    const s=state({sortOrder}),rows=advancedFilterAndSort(added,s),prices=rows.map(p=>projectOffer(p,s).value).filter(v=>v!==null);
    for(let i=1;i<prices.length;i++)assert.ok(sign*(prices[i]-prices[i-1])>=0);
  }
});

test('financial sorting only receives the registered cache universe and leaves new results unknown',()=>{
  const base=original.slice(0,2),mixed=[...base,...added],seen=[];
  const sorted=sortWithPublishedFinancials(mixed,list=>{seen.push(...list);list.reverse();});
  assert.deepEqual(seen,base);assert.deepEqual(sorted.slice(0,2),[base[1],base[0]]);assert.deepEqual(sorted.slice(2),added);
  assert.deepEqual(publishedFinancialProjects(expanded),original);
  assert.deepEqual(sortWithPublishedFinancials(added,()=>assert.fail('no financial cache lookup for GPR/new only')),added);
  assert.equal(onlyExpansionResults(expanded,added,['GPR']),true);
  assert.equal(onlyExpansionResults(expanded,[],['GPR']),true);
  assert.equal(onlyExpansionResults(expanded,original),false);
  assert.equal(onlyExpansionResults(expanded,mixed),false);
  assert.equal(onlyExpansionResults(expanded,[],['Maestra']),false);
  for(const p of added)assert.equal(financialReferenceCompatible(p,catalogExpansionOffer(p,defaults())),false);
});

test('unknown coordinates remain pending; no fabricated map marker or Metro match',()=>{
  const result=locateProjects(added,{locations:{}});
  assert.equal(result.located.length,0);assert.deepEqual(result.pending,added);
  assert.equal(advancedFilterAndSort(added,state({metroNetwork:'current',metroDistance:'1000'})).length,0);
});

test('pin and scope guard reject corrupt data rather than creating partial new-project positives',async()=>{
  assert.equal(createHash('sha256').update(content).digest('hex'),CATALOG_EXPANSION_SOURCE_SHA256);
  await assert.rejects(parseCatalogExpansion(content+' ',{cryptoImpl:webcrypto}),/SHA-256 mismatch/);
  const changed=structuredClone(sourceData);changed.projects[0].unclassifiedSurfaceSummary.usefulM2=25.11;
  assert.throws(()=>validateCatalogExpansion(changed),/generic area/);
  const locations=structuredClone(sourceData);locations.projects[0].location.latitude=-33.4;
  assert.throws(()=>validateCatalogExpansion(locations),/coordinates/);
  assert.throws(()=>appendCatalogExpansion([added[0]],source),/collision/);
});

test('same-origin protected loading and an explicit failure preserve the original 131 fallback',async()=>{
  const calls=[];
  const loaded=await loadCatalogExpansion(async(url,options)=>{calls.push([url,options]);return {ok:true,redirected:false,text:async()=>content};});
  assert.equal(appendCatalogExpansion(original,loaded).length,152);
  assert.equal(calls[0][1].credentials,'same-origin');assert.equal(calls[0][1].redirect,'error');
  await assert.rejects(loadCatalogExpansion(async()=>({ok:false})),/unavailable/);
  assert.equal(original.length,131);assert.match(CATALOG_EXPANSION_FAILURE,/21 proyectos nuevos de Iris/);assert.match(CATALOG_EXPANSION_FAILURE,/131 proyectos/);
});
