import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNollagamOwnerQuoteLayer,NOLLAGAM_OWNER_SOURCE_PATH} from '../assets/js/catalog-nollagam-owner-quotes.mjs';
import {matchProjectFilters} from '../assets/js/commercial-filter-engine.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const published=read('../data/proyectos.json'),owner=read('../data/nollagam-commercial.json');
const layer=createNollagamOwnerQuoteLayer(published,owner);
const bySlug=new Map(layer.records.map(record=>[record.slug,record]));
const clone=value=>structuredClone(value);
const evaluate=(record,query)=>{
  const result=matchProjectFilters(record,query);assert.deepEqual(result.issues,[]);return result;
};
const resolve=(root,pointer)=>pointer.split('/').slice(1).reduce((value,key)=>{
  assert.ok(value!==null&&Object.hasOwn(value,key),'unresolved source pointer '+pointer);return value[key];
},root);

test('real owner source produces seven identities, seventeen prices and five explicit unknown categories',()=>{
  assert.deepEqual(layer.counts,{projects:7,references:22,priced:17,unknownPrice:5});
  assert.deepEqual(layer.records.map(record=>record.slug),
    published.filter(project=>Object.hasOwn(owner.projects,project.slug)).map(project=>project.slug));
  const unknown=layer.records.flatMap(record=>record.references
    .filter(reference=>reference.attributes.priceUF===null).map(reference=>record.slug+':'+reference.label));
  assert.deepEqual(unknown.sort(),['alto-goycolea:3 dormitorios','barrio-zenteno:Estudio',
    'edificio-liverpool:1 dormitorio','edificio-liverpool:Estudio','eleuterio-ramirez:1 dormitorio'].sort());
});

test('specific Costanera A regression has a same-reference 3D UF5070 witness inside UF5000–5100',()=>{
  const record=bySlug.get('costanera-coquimbo-a');
  const result=evaluate(record,{bedrooms:'3',minPrice:'5000',maxPrice:'5100'});
  assert.equal(result.matches,true);assert.equal(result.references.length,1);
  assert.equal(result.references[0].attributes.priceUF,5070);
  assert.equal(result.references[0].attributes.bedrooms,3);
  assert.equal(result.references[0].id,'nollagam-owner:costanera-coquimbo-a:3d');
  assert.equal(evaluate(record,{bedrooms:'2',minPrice:'5000',maxPrice:'5100'}).matches,false);
});

test('all seventeen real owner prices match only their explicit bedroom category with valid exact bounds',()=>{
  let checked=0;
  for(const record of layer.records)for(const reference of record.references){
    const {priceUF,bedrooms}=reference.attributes;if(priceUF===null)continue;
    const result=evaluate(record,{bedrooms:String(bedrooms),minPrice:String(priceUF),maxPrice:String(priceUF)});
    assert.equal(result.matches,true,reference.id);assert.deepEqual(result.matchedReferenceIds,[reference.id]);checked++;
  }
  assert.equal(checked,17);
});

test('all five unknown-price categories retain known D and fail an active valid price range',()=>{
  let checked=0;
  for(const record of layer.records)for(const reference of record.references){
    if(reference.attributes.priceUF!==null)continue;
    const isolated={...record,references:[reference]},bedrooms=String(reference.attributes.bedrooms);
    assert.equal(evaluate(isolated,{bedrooms}).matches,true,reference.id);
    assert.equal(evaluate(isolated,{bedrooms,minPrice:'0',maxPrice:'99999'}).matches,false,reference.id);checked++;
  }
  assert.equal(checked,5);
});

test('original date and authority retain their declared meaning, with every source pointer resolving',()=>{
  assert.equal(layer.source.path,NOLLAGAM_OWNER_SOURCE_PATH);
  assert.equal(layer.source.date,'2026-10-28');assert.equal(layer.source.dateField,'/checkedOn');
  assert.equal(layer.source.authority,owner.priceSource);
  for(const record of layer.records)for(const reference of record.references){
    assert.equal(reference.sourceDate,resolve(owner,reference.sourceDateField));
    assert.equal(reference.scope,'typology-not-unit');assert.equal(record.asOf,'2026-10-28');
    assert.equal(resolve(published,reference.publishedCategory.sourcePointer),reference.label);
    const sourceValue=resolve(owner,reference.sourcePointer);
    if(reference.sourcePresence==='category-declared'){
      assert.equal(sourceValue,reference.attributes.priceUF);assert.equal(reference.missingSourceKey,null);
    }else{
      assert.equal(reference.sourcePresence,'category-not-listed');
      assert.equal(Object.hasOwn(sourceValue,reference.missingSourceKey),false);
      assert.equal(resolve(published,reference.publishedCategory.unknownPricePointer),null);
    }
  }
});

test('owner zero-bedroom category is explicit and does not convert unknown to zero',()=>{
  const record=bySlug.get('alto-goycolea'),result=evaluate(record,{bedrooms:'0',minPrice:'2264',maxPrice:'2264'});
  assert.equal(result.matches,true);assert.equal(result.references[0].label,'Estudio');
  assert.equal(result.references[0].attributes.bedrooms,0);
  assert.equal(result.references[0].sourcePointer,'/projects/alto-goycolea/prices/0');
  assert.equal(bySlug.get('edificio-liverpool').references.find(reference=>reference.label==='Estudio').attributes.priceUF,null);
});

test('price witnesses never acquire property type, use, bathrooms or surfaces from the published project',()=>{
  const unknown=['propertyType','assetType','bathrooms','typology','usefulM2','totalM2','interiorM2',
    'terraceM2','gardenM2','landM2','privateTerrace','privateGarden','parkingIncluded',
    'parkingAvailable','storageIncluded','storageAvailable','state','delivery'];
  for(const record of layer.records)for(const reference of record.references){
    for(const field of unknown)assert.equal(reference.attributes[field],null,reference.id+':'+field);
    assert.equal(reference.stock,null);assert.equal(reference.availability,null);
  }
  const record=bySlug.get('costanera-coquimbo-a'),base={bedrooms:'3',minPrice:'5000',maxPrice:'5100'};
  for(const query of [{propertyType:'departamento'},{assetType:'Residencial'},{bathrooms:'2'},
    ...['util','total','interior','terraza','jardin','terreno'].map(surfaceMetric=>({surfaceMetric,minSurface:'0',maxSurface:'9999'})),
    {privateTerrace:true},{privateGarden:true},{parking:'included'},{storage:'available'}]){
    assert.equal(evaluate(record,{...base,...query}).matches,false,JSON.stringify(query));
  }
});

test('unused unknowns do not remove identities or the seven price/D records',()=>{
  for(const record of layer.records){
    assert.equal(evaluate(record,{}).matches,true);
    assert.equal(evaluate(record,{commune:record.projectFacts.commune,developers:['Nollagam']}).matches,true);
  }
});

test('identity projection reads no project minimum, model facets, offers, stage or stock fields',()=>{
  const projects=clone(published);
  for(const project of projects.filter(project=>Object.hasOwn(owner.projects,project.slug))){
    for(const field of ['precioDesdeUF','commercialOffers','commercialSource','tipoActivo','tiposActivos',
      '_facets','models','estado','entrega','stock','unit','_commercial']){
      Object.defineProperty(project,field,{configurable:true,get(){throw Error('forbidden read '+field);}});
    }
  }
  const result=createNollagamOwnerQuoteLayer(projects,owner);
  assert.deepEqual(result.counts,layer.counts);
  assert.deepEqual(Object.keys(result.records[0].sourceProject),['slug','nombre','inmobiliaria','comuna','region','direccion']);
});

test('known owner amounts never borrow or consult an inconsistent legacy typology amount',()=>{
  const projects=clone(published),project=projects.find(project=>project.slug==='costanera-coquimbo-a');
  for(const row of project.preciosPorTipologia)Object.defineProperty(row,'precioDesdeUF',{
    configurable:true,get(){throw Error('known owner category read a legacy amount');}});
  const result=createNollagamOwnerQuoteLayer(projects,owner);
  assert.deepEqual(result.records.find(record=>record.slug===project.slug).references.map(reference=>reference.attributes.priceUF),[4210,5070]);
});

test('an explicit unknown owner price stays null despite a populated published amount',()=>{
  const source=clone(owner);source.projects['costanera-coquimbo-a'].prices['2']=null;
  const result=createNollagamOwnerQuoteLayer(published,source);
  const record=result.records.find(record=>record.slug==='costanera-coquimbo-a');
  const reference=record.references.find(reference=>reference.attributes.bedrooms===2);
  assert.equal(reference.attributes.priceUF,null);assert.equal(reference.sourcePresence,'category-declared');
  assert.equal(evaluate({...record,references:[reference]},{minPrice:'0',maxPrice:'99999'}).matches,false);
});

test('an absent owner amount cannot activate a populated legacy category',()=>{
  const source=clone(owner);delete source.projects['costanera-coquimbo-a'].prices['3'];
  assert.throws(()=>createNollagamOwnerQuoteLayer(published,source),/unbacked published category price/);
});

test('authority and original date are required, without deriving them from project verification',()=>{
  for(const change of [{priceSource:undefined},{priceSource:'Provider campaign'},
    {checkedOn:undefined},{checkedOn:'28/10/2026'},{checkedOn:'2026-02-30'}]){
    assert.throws(()=>createNollagamOwnerQuoteLayer(published,{...owner,...change}),/owner authority|checkedOn/);
  }
});

test('numeric strings, zero, negative values and nonfinite owner prices are rejected without coercion',()=>{
  for(const price of ['5070',undefined,0,-1,NaN,Infinity]){
    const source=clone(owner);source.projects['costanera-coquimbo-a'].prices['3']=price;
    assert.throws(()=>createNollagamOwnerQuoteLayer(published,source),/positive numbers or explicit null/);
  }
});

test('foreign, missing, duplicate or mismatched public identities cannot be joined',()=>{
  const source=clone(owner);source.projects.foreign=source.projects['costanera-coquimbo-a'];
  assert.throws(()=>createNollagamOwnerQuoteLayer(published,source),/seven existing/);
  assert.throws(()=>createNollagamOwnerQuoteLayer(published.filter(project=>project.slug!=='costanera-coquimbo-a'),owner),/missing published identity/);
  const duplicated=[...published,published.find(project=>project.slug==='costanera-coquimbo-a')];
  assert.throws(()=>createNollagamOwnerQuoteLayer(duplicated,owner),/duplicate published identity/);
  const projects=clone(published);projects.find(project=>project.slug==='costanera-coquimbo-a').inmobiliaria='Euro';
  assert.throws(()=>createNollagamOwnerQuoteLayer(projects,owner),/unmatched Nollagam identity/);
});

test('unknown labels, duplicate categories and owner keys without published correspondence are rejected',()=>{
  for(const label of ['3D','3 dormitorios con terraza','Local','desconocido','constructor']){
    const projects=clone(published);projects.find(project=>project.slug==='costanera-coquimbo-a').preciosPorTipologia[1].tipologia=label;
    assert.throws(()=>createNollagamOwnerQuoteLayer(projects,owner),/unrecognized category label/);
  }
  const projects=clone(published),project=projects.find(project=>project.slug==='costanera-coquimbo-a');
  project.preciosPorTipologia.push({...project.preciosPorTipologia[0]});
  assert.throws(()=>createNollagamOwnerQuoteLayer(projects,owner),/duplicate bedroom category/);
  const source=clone(owner);source.projects['costanera-coquimbo-a'].prices['4']=6000;
  assert.throws(()=>createNollagamOwnerQuoteLayer(published,source),/lacks a matching published category/);
});

test('reference IDs remain stable when published category order changes',()=>{
  const projects=clone(published);projects.find(project=>project.slug==='costanera-coquimbo-a').preciosPorTipologia.reverse();
  const result=createNollagamOwnerQuoteLayer(projects,owner);
  assert.deepEqual(result.records.find(record=>record.slug==='costanera-coquimbo-a').references.map(reference=>reference.id).sort(),
    bySlug.get('costanera-coquimbo-a').references.map(reference=>reference.id).sort());
});

test('normalization and matching preserve both input datasets and return isolated frozen records',()=>{
  const projects=clone(published),source=clone(owner),before=[JSON.stringify(projects),JSON.stringify(source)];
  const result=createNollagamOwnerQuoteLayer(projects,source);
  for(const record of result.records)evaluate(record,{bedrooms:'2',minPrice:'1'});
  assert.deepEqual([JSON.stringify(projects),JSON.stringify(source)],before);
  assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.records[0].references[0].attributes));
  assert.throws(()=>{result.records[0].references[0].attributes.priceUF=1;},TypeError);
  source.projects['costanera-coquimbo-a'].prices['2']=1;
  assert.equal(result.records.find(record=>record.slug==='costanera-coquimbo-a').references[0].attributes.priceUF,4210);
});
