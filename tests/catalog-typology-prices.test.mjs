import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';
import {projectOffer,offerPriceLabel} from '../assets/js/catalog-model.mjs';
import {catalogReference} from '../assets/js/project-offers.mjs';
import {verifiedProjectPrice} from '../assets/js/project-finance.mjs';
import {catalogTypologyRecord,matchCatalogTypologyPrices,hasCatalogTypologyPrices,catalogTypologyOffer} from '../assets/js/catalog-typology-prices.mjs';
import {matchProjectFilters} from '../assets/js/commercial-filter-engine.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const published=read('../data/proyectos.json');
const facets=read('../data/catalog-facets.json');
const project=slug=>{const p=published.find(project=>project.slug===slug);return {...p,_facets:facets.projects[slug]};};
const origen=project('edif-origen-atacama-3008');
const plazaNova=project('edificio-plaza-nova');
const state=input=>({...defaults(),...input});
const filter=(p,input)=>advancedFilterAndSort([p],state(input));
const match=(p,input)=>{const m=matchCatalogTypologyPrices(p,state(input));assert.deepEqual(m.issues,[]);return m;};

test('regression: selecting Origen Local presents its own owner price, not Estudio',()=>{
  const s=state({propertyType:'local'});
  const rows=advancedFilterAndSort([origen],s);
  assert.equal(rows.length,1);
  assert.deepEqual(projectOffer(rows[0],s),{value:2697.78,typology:'Local',financialBaselineCompatible:false});
});

test('regression: Origen Local in UF2600–2800 remains a match',()=>{
  const s=state({propertyType:'local',minPriceInput:'2600',maxPriceInput:'2800'});
  const rows=advancedFilterAndSort([origen],s);
  assert.equal(rows.length,1);
  assert.equal(projectOffer(rows[0],s).value,2697.78);
});

test('regression: selecting commercial use presents and filters Origen Local',()=>{
  const s=state({assetType:'Comercial',minPriceInput:'2600',maxPriceInput:'2800'});
  const rows=advancedFilterAndSort([origen],s);
  assert.equal(rows.length,1);
  assert.equal(projectOffer(rows[0],s).value,2697.78);
  assert.equal(projectOffer(rows[0],s).typology,'Local');
});

test('real Origen and Plaza Nova rows preserve exact owner dates, prices and category labels',()=>{
  for(const p of [origen,plazaNova]){
    const record=catalogTypologyRecord(p);
    assert.equal(record.sourceLayer,'published-typology-prices');
    assert.equal(record.references.length,p.preciosPorTipologia.length);
    for(const [index,reference] of record.references.entries()){
      assert.equal(reference.label,p.preciosPorTipologia[index].tipologia);
      assert.equal(reference.attributes.priceUF,p.preciosPorTipologia[index].precioDesdeUF);
      assert.equal(reference.sourceKind,'owner-published-typology');assert.equal(reference.sourceDate,'2026-10-25');
      assert.equal(reference.sourcePointer,'/preciosPorTipologia/'+index);
      assert.equal(reference.sourceProjectSlug,p.slug);assert.equal(reference.stock,null);
      for(const key of ['bathrooms','usefulM2','totalM2','interiorM2','terraceM2','privateTerrace','parkingIncluded','storageIncluded'])assert.equal(reference.attributes[key],null);
    }
  }
});

test('Plaza Nova Local displays and filters UF6910.23, not the Estudio minimum',()=>{
  for(const input of [{propertyType:'local'},{assetType:'Comercial'},
    {propertyType:'local',minPriceInput:'6800',maxPriceInput:'7000'}]){
    const s=state(input),rows=advancedFilterAndSort([plazaNova],s);
    assert.equal(rows.length,1);assert.deepEqual(projectOffer(rows[0],s),{value:6910.23,typology:'Local',financialBaselineCompatible:false});
    assert.equal(rows[0]._publishedPriceMatch.references.length,1);
    assert.equal(rows[0]._publishedPriceMatch.references[0].attributes.propertyType,'local');
  }
});

test('explicit bedrooms select that category and the same price witness, including tied Origen values',()=>{
  for(const [p,bedrooms,price,label] of [[origen,'1',2534.88,'1 dormitorio'],[origen,'2',4360.47,'2 dormitorios'],
    [plazaNova,'1',3275.14,'1 dormitorio']]){
    const s=state({bedrooms,minPriceInput:String(price),maxPriceInput:String(price)});
    const rows=advancedFilterAndSort([p],s);assert.equal(rows.length,1);
    assert.deepEqual(projectOffer(rows[0],s),{value:price,typology:label,financialBaselineCompatible:false});
    assert.ok(rows[0]._publishedPriceMatch.references.every(reference=>reference.attributes.bedrooms===Number(bedrooms)));
  }
  assert.deepEqual(filter(origen,{bedrooms:'1',minPriceInput:'4360.47',maxPriceInput:'4360.47'}),[]);
  assert.deepEqual(filter(origen,{propertyType:'local',bedrooms:'1',minPriceInput:'2600',maxPriceInput:'2800'}),[]);
});

test('owner residential category is explicit use, but does not invent apartment property type',()=>{
  const s=state({assetType:'Residencial',bedrooms:'2',minPriceInput:'4300',maxPriceInput:'4400'});
  const rows=advancedFilterAndSort([origen],s);assert.equal(rows.length,1);
  assert.equal(projectOffer(rows[0],s).value,4360.47);
  const reference=rows[0]._publishedPriceMatch.references[0];
  assert.equal(reference.attributes.assetType,'Residencial');assert.equal(reference.attributes.propertyType,null);
  assert.deepEqual(filter(origen,{...s,propertyType:'departamento'}),[]);
});

test('published universal project type preserves Vista Bulnes and Ecuador apartment prices',()=>{
  for(const slug of ['vista-bulnes','edificio-ecuador']){
    const p=project(slug),s=state({propertyType:'departamento',minPriceInput:'1'});
    const rows=advancedFilterAndSort([p],s);assert.equal(rows.length,1,slug);
    assert.ok(rows[0]._publishedPriceMatch.references.every(reference=>reference.attributes.propertyType==='departamento'));
    assert.equal(projectOffer(rows[0],s).value,p.precioDesdeUF);
    for(const reference of rows[0]._publishedPriceMatch.references){
      assert.equal(reference.universalProjectContext.propertyType.sourcePath,'data/catalog-facets.json');
      assert.equal(reference.universalProjectContext.propertyType.sourcePointer,'/projects/'+slug+'/propertyTypes');
      assert.equal(reference.universalProjectContext.propertyType.scope,'published-project-universal');
      assert.equal(reference.attributes.bathrooms,null);assert.equal(reference.attributes.usefulM2,null);
    }
  }
});

test('published property text keeps Vista Bulnes Departamento and Origen Local price witnesses',()=>{
  for(const search of ['Departamento','Departamentos']){
    const p=project('vista-bulnes'),s=state({search,minPriceInput:'1'}),rows=advancedFilterAndSort([p],s);
    assert.equal(rows.length,1);assert.equal(projectOffer(rows[0],s).value,3148.1);
  }
  for(const search of ['Local','Locales comerciales']){
    const s=state({search,minPriceInput:'1'}),rows=advancedFilterAndSort([origen],s);
    assert.equal(rows.length,1);assert.equal(projectOffer(rows[0],s).value,2697.78);
    assert.deepEqual(rows[0]._publishedPriceMatch.references.map(reference=>reference.label),['Local']);
  }
});

test('property words cannot be borrowed from another price reference or unknown-use project labels',()=>{
  const record={slug:'scope-check',sourceProject:{nombre:'Scope check'},projectFacts:{},references:[
    {id:'local-price',attributes:{propertyType:'local',priceUF:2697.78}},
    {id:'apartment-price',attributes:{propertyType:'departamento',priceUF:4000}},
  ]};
  const query={text:'Departamento',minPrice:2600,maxPrice:2800};
  const result=matchProjectFilters(record,query);assert.deepEqual(result.issues,[]);assert.equal(result.matches,false);
  assert.deepEqual(filter(origen,{search:'Departamento',minPriceInput:'2600',maxPriceInput:'2800'}),[]);
  const ecuador=project('edificio-ecuador');
  const unknown={...ecuador,preciosPorTipologia:[{tipologia:'Uso sin confirmar',precioDesdeUF:3000}]};
  assert.equal(unknown._facets.propertyLabels.includes('Departamento'),true);
  assert.deepEqual(filter(unknown,{search:'Departamento',minPriceInput:'1'}),[]);
});

test('canonical type text never adds bedroom counts or area values to the searchable quote',()=>{
  const p=project('vista-bulnes');
  for(const search of ['0 dormitorios','27.9','desconocido'])assert.deepEqual(filter(p,{search,minPriceInput:'1'}),[]);
});

test('universal type context never completes a mixed, unknown-use, contradictory or explicit Local row',()=>{
  assert.equal(catalogTypologyRecord(origen).references.find(reference=>reference.label==='1 dormitorio').attributes.propertyType,null);
  const ecuador=project('edificio-ecuador');
  const unknown={...ecuador,preciosPorTipologia:[{tipologia:'Uso sin confirmar',precioDesdeUF:3000}]};
  const unknownRef=catalogTypologyRecord(unknown).references[0];
  assert.equal(unknownRef.attributes.propertyType,null);assert.equal(unknownRef.universalProjectContext,undefined);
  assert.deepEqual(filter(unknown,{propertyType:'departamento',minPriceInput:'1'}),[]);
  assert.deepEqual(filter(unknown,{amenities:['gimnasio'],minPriceInput:'1'}),[]);
  for(const f of [{...ecuador._facets,propertyTypes:['departamento','desconocido']},
    {...ecuador._facets,propertyTypes:['local']},{...ecuador._facets,assetTypes:['Comercial']}]){
    assert.equal(catalogTypologyRecord({...ecuador,_facets:f}).references[0].attributes.propertyType,null);
  }
  const local={...ecuador,preciosPorTipologia:[{tipologia:'Local',precioDesdeUF:3000}]};
  const localRef=catalogTypologyRecord(local).references[0];
  assert.equal(localRef.attributes.propertyType,'local');assert.equal(localRef.universalProjectContext,undefined);
});

test('Estudio zero-bedroom convention is restricted to the published owner enum',()=>{
  const s=state({bedrooms:'0',minPriceInput:'2000',maxPriceInput:'2100'});
  const rows=advancedFilterAndSort([plazaNova],s);assert.equal(rows.length,1);
  assert.deepEqual(projectOffer(rows[0],s),{value:2035.23,typology:'Estudio',financialBaselineCompatible:true});
  for(const label of ['studio','estudio','1D','2 dormitorios con terraza','Producto desconocido','constructor','toString']){
    const synthetic={...origen,preciosPorTipologia:[{tipologia:label,precioDesdeUF:2697.78}]};
    const attrs=catalogTypologyRecord(synthetic).references[0].attributes;
    assert.equal(attrs.bedrooms,null);assert.equal(attrs.assetType,null);assert.equal(attrs.propertyType,null);
  }
  const unconfirmed={...origen,commercialSource:undefined,verificacion:{},preciosPorTipologia:[{tipologia:'Estudio',precioDesdeUF:2697.78}]};
  assert.equal(catalogTypologyRecord(unconfirmed),null);
});

test('a legacy table without explicit owner authority cannot replace the published project price',()=>{
  const p={...origen,precioDesdeUF:2000,precioDesdeTipologia:null,commercialSource:undefined,
    preciosPorTipologia:[{tipologia:'Local',precioDesdeUF:8000}],
    _facets:{...origen._facets,propertyTypes:['local'],assetTypes:['Comercial'],variants:[{propertyType:'local',areas:{total:60}}]}};
  assert.equal(hasCatalogTypologyPrices(p),false);assert.equal(catalogTypologyRecord(p),null);
  assert.equal(filter(p,{propertyType:'local',maxPriceInput:'2500'}).length,1);
  assert.deepEqual(filter(p,{minPriceInput:'2100'}),[]);
  assert.deepEqual(projectOffer(p,state({propertyType:'local'})),{value:2000,typology:null});
});

test('owner authority needs an explicit valid source date and no unresolved price status',()=>{
  for(const commercialSource of [undefined,{type:'official',date:'2026-10-25'},
    {type:'owner-supplied'},{type:'owner-supplied',verifiedOn:'2026-02-30'},
    {type:'owner-supplied',date:'25/10/2026'},{type:'owner-supplied',date:'2026-10-25',priceStatus:'pending'},
    {type:'owner-supplied',date:'2026-10-25',priceStatus:'unknown'}]){
    assert.equal(hasCatalogTypologyPrices({...origen,commercialSource}),false);
  }
  assert.equal(hasCatalogTypologyPrices({...origen,priceStatus:'pending'}),false);
  assert.equal(hasCatalogTypologyPrices(origen),true);
});

test('every declared modern offer route takes precedence, including empty or null-priced offers',()=>{
  for(const inmobiliaria of ['Euro','Crescer','Nollagam'])for(const commercialOffers of [[],null,
    [{id:'local',propertyType:'local',priceUF:null}],[{id:'local',propertyType:'local',priceUF:7777}]]){
    const p={...origen,inmobiliaria,commercialOffers};
    assert.equal(hasCatalogTypologyPrices(p),false);
    for(const input of [{propertyType:'local'},{bedrooms:'1'},{maxPriceInput:'2800'}]){
      assert.deepEqual(projectOffer(p,state(input)),catalogReference(p,state(input)));
    }
  }
});

test('real pending Diagonal offers cannot be replaced by populated legacy typology rows',()=>{
  const original=project('diagonal-vicuna');assert.equal(original.commercialSource.priceStatus,'pending');
  const p={...original,preciosPorTipologia:[{tipologia:'1 dormitorio',precioDesdeUF:1000}]};
  assert.equal(hasCatalogTypologyPrices(p),false);
  assert.equal(projectOffer(p,state({bedrooms:'1'})).value,null);
  assert.deepEqual(filter(p,{bedrooms:'1',minPriceInput:'0',maxPriceInput:'99999'}),[]);
});

test('Local-only range cannot borrow residential gym with or without an explicit type',()=>{
  for(const p of [origen,plazaNova])for(const type of [{},{propertyType:'local'},{assetType:'Comercial'}]){
    const price=p.preciosPorTipologia.find(row=>row.tipologia==='Local').precioDesdeUF;
    const input={...type,minPriceInput:String(price),maxPriceInput:String(price),amenities:['gimnasio']};
    assert.equal(match(p,input).matches,false);assert.deepEqual(filter(p,input),[]);
  }
});

test('amenities and features retain independent AND/OR groups on a single price witness',()=>{
  for(const key of ['amenities','features'])for(const all of [false,true]){
    const input={minPriceInput:'2600',maxPriceInput:'2800',[key]:['gimnasio','quinchos'],[key+'All']:all};
    assert.equal(match(origen,input).matches,false);assert.deepEqual(filter(origen,input),[]);
  }
  const base={bedrooms:'1',maxPriceInput:'2800',amenities:['gimnasio','no-documentado']};
  assert.equal(filter(origen,base).length,1);
  assert.deepEqual(filter(origen,{...base,amenitiesAll:true}),[]);
  assert.equal(filter(origen,{bedrooms:'1',maxPriceInput:'2800',amenities:['gimnasio'],features:['cowork']}).length,1);
  assert.deepEqual(filter(origen,{...base,features:['no-documentado'],featuresAll:true}),[]);
});

test('residential gym can match a residential owner price, with only supported badges',()=>{
  const s=state({maxPriceInput:'2800',amenities:['gimnasio','no-documentado']});
  const rows=advancedFilterAndSort([origen],s);assert.equal(rows.length,1);
  assert.equal(projectOffer(rows[0],s).value,2534.88);
  assert.deepEqual(matchedLabels(rows[0],s),['Gimnasio']);
  const local=filter(origen,{minPriceInput:'2600',maxPriceInput:'2800'})[0];
  assert.deepEqual(matchedLabels(local,state({minPriceInput:'2600',maxPriceInput:'2800',amenities:['gimnasio']})),[]);
});

test('unknown-use price remains usable alone and cannot acquire residential amenities or use',()=>{
  const unknown={...origen,preciosPorTipologia:[{tipologia:'Uso no documentado',precioDesdeUF:2697.78}]};
  const base={minPriceInput:'2600',maxPriceInput:'2800'};
  assert.equal(filter(unknown,base).length,1);
  for(const input of [{amenities:['gimnasio']},{features:['gimnasio']},{assetType:'Residencial'},
    {propertyType:'local'},{bedrooms:'0'},{search:'gimnasio'}]){
    assert.equal(match(unknown,{...base,...input}).matches,false);assert.deepEqual(filter(unknown,{...base,...input}),[]);
  }
});

test('price-witness search keeps the registered identity/address without borrowing gym text',()=>{
  const base={minPriceInput:'2600',maxPriceInput:'2800'};
  for(const search of ['Maipú 1196','Origen Santiago'])assert.equal(filter(origen,{...base,propertyType:'local',search}).length,1);
  assert.deepEqual(filter(origen,{...base,search:'gimnasio'}),[]);
  assert.equal(filter(origen,{maxPriceInput:'2800',bedrooms:'1',search:'gimnasio'}).length,1);
  for(const [selection,price] of [[{propertyType:'local'},2697.78],[{},2534.88]]){
    const s=state({search:'Maipú',...selection}),rows=advancedFilterAndSort([origen],s);
    assert.equal(rows.length,1);assert.equal(projectOffer(rows[0],s).value,price);
  }
});

test('price and unknown bathrooms, surfaces, private features and inclusions cannot borrow model facets',()=>{
  for(const p of [origen,plazaNova])for(const predicate of [{bathrooms:'1'},{bathrooms:'2'},
    ...['util','total','interior','terraza','jardin','terreno'].map(areaType=>({areaType,minArea:'0',maxArea:'9999'})),
    {features:['terraza-privada']},{parking:'included'},{storage:'available'}]){
    const input={minPriceInput:'1',maxPriceInput:'99999',...predicate};
    assert.equal(match(p,input).matches,false);assert.deepEqual(filter(p,input),[]);
  }
});

test('an unpriced surface profile can still match without displaying an unrelated typology price',()=>{
  const p={...origen,_facets:{...origen._facets,variants:[{propertyType:'departamento',bedrooms:1,bathrooms:1,areas:{util:30},typology:'1d-1b'}]}};
  const s=state({bedrooms:'1',bathrooms:'1',areaType:'util',minArea:'30',maxArea:'30'});
  const rows=advancedFilterAndSort([p],s);assert.equal(rows.length,1);
  assert.deepEqual(projectOffer(rows[0],s),{value:null,typology:null,financialBaselineCompatible:false});
  assert.deepEqual(advancedFilterAndSort([p],{...s,maxPriceInput:'2800'}),[]);
});

test('unpriced bathroom/model searches retain their documented residential amenity badge',()=>{
  const s=state({bathrooms:'1',amenities:['gimnasio']});
  const rows=advancedFilterAndSort([origen],s);assert.equal(rows.length,1);
  assert.deepEqual(rows[0]._publishedPriceMatch.references,[]);
  assert.equal(projectOffer(rows[0],s).value,null);
  assert.deepEqual(matchedLabels(rows[0],s),['Gimnasio']);
});

test('null or nonnumeric row prices stay unknown and cannot borrow the global project minimum',()=>{
  for(const precioDesdeUF of [null,'2697.78',0,-1]){
    const p={...origen,preciosPorTipologia:[{tipologia:'Local',precioDesdeUF}]};
    assert.equal(catalogTypologyRecord(p).references[0].attributes.priceUF,null);
    assert.deepEqual(catalogTypologyOffer(p,state({propertyType:'local'})),{value:null,typology:'Local',financialBaselineCompatible:false});
    assert.deepEqual(filter(p,{propertyType:'local',minPriceInput:'0',maxPriceInput:'99999'}),[]);
  }
});

test('no-selection defaults preserve the published global price and original row/project order',()=>{
  for(const p of [origen,plazaNova]){
    const rows=filter(p,{});assert.equal(rows.length,1);
    assert.deepEqual(projectOffer(rows[0],state({})),{...catalogReference(p,state({})),financialBaselineCompatible:true});
  }
  const changed={...origen,precioDesdeUF:9999,precioDesdeTipologia:'Owner global scope'};
  assert.deepEqual(projectOffer(filter(changed,{})[0],state({})),{value:9999,typology:'Owner global scope',financialBaselineCompatible:true});
  assert.deepEqual(advancedFilterAndSort([origen,plazaNova],state({})).map(p=>p.slug),[origen.slug,plazaNova.slug]);
  assert.deepEqual(catalogTypologyRecord(origen).references.map(r=>r.label),origen.preciosPorTipologia.map(r=>r.tipologia));
});

test('all 131 original default offers preserve the protected baseline value and typology without mutation',()=>{
  const before=JSON.stringify(published);assert.equal(published.length,131);
  for(const p of published){
    const offer=projectOffer(p,defaults()),baseline=catalogReference(p,defaults());
    assert.deepEqual({value:offer.value,typology:offer.typology},baseline,p.slug);
  }
  assert.equal(JSON.stringify(published),before);
});

test('price sorting and price label both use the selected Local reference',()=>{
  const s=state({propertyType:'local',sortOrder:'price-desc'});
  const rows=advancedFilterAndSort([origen,plazaNova],s);
  assert.deepEqual(rows.map(p=>p.slug),[plazaNova.slug,origen.slug]);
  assert.match(offerPriceLabel(rows[1],s),/2[.]697,78/);
  assert.equal(projectOffer(rows[1],s).typology,'Local');
});

test('financial card compatibility is false for a different row, including a tied amount with another label',()=>{
  const cases=[
    [{},true,2534.88,'Estudio'],
    [{minPriceInput:'2600',maxPriceInput:'2800'},false,2697.78,'Local'],
    [{bedrooms:'1'},false,2534.88,'1 dormitorio'],
    [{bedrooms:'0'},true,2534.88,'Estudio'],
    [{bedrooms:'2'},false,4360.47,'2 dormitorios'],
  ];
  const originalBaseline=verifiedProjectPrice(origen,new Date('2026-11-17T12:00:00Z'));
  assert.equal(originalBaseline.valueUf,2534.88);assert.equal(originalBaseline.typology,'Estudio');
  for(const [input,compatible,value,typology] of cases){
    const s=state(input),[row]=advancedFilterAndSort([origen],s),offer=projectOffer(row,s);
    assert.equal(offer.financialBaselineCompatible,compatible);
    assert.equal(offer.value,value);assert.equal(offer.typology,typology);
  }
  const unknown={...origen,preciosPorTipologia:[{tipologia:'Local',precioDesdeUF:null}]};
  assert.equal(catalogTypologyOffer(unknown,state({propertyType:'local'})).financialBaselineCompatible,false);
  assert.equal(projectOffer(project('edificio-suecia'),state({})).financialBaselineCompatible,undefined);
});

test('AJ, Sento, Leon and each Ecasa stage keep their established commercialOffers policy',()=>{
  for(const slug of ['san-martin-70','plaza-las-condes','uruguay','alto-san-joaquin']){
    const p=published.find(project=>project.slug===slug)||published.find(project=>
      (slug==='san-martin-70'&&project.inmobiliaria==='AJ Urbana')||(slug==='uruguay'&&project.inmobiliaria==='León'));
    assert.ok(p);assert.equal(hasCatalogTypologyPrices(p),false);
    for(const input of [{},{bedrooms:'2'},{propertyType:'local'}])assert.deepEqual(projectOffer(p,state(input)),catalogReference(p,state(input)));
  }
});

test('prepared and documentary source precedence never changes to the published table',()=>{
  const p={...origen,_commercialMatch:{references:[{id:'own',attributes:{priceUF:7777,bedrooms:1}}]},_commercial:{asOf:'2026-11-16'}};
  assert.equal(projectOffer(p,state({propertyType:'local'})).value,7777);
  const documentary={...p,_documentaryMatch:{references:[{id:'doc',attributes:{priceUF:null,bedrooms:1}}]}};
  assert.equal(projectOffer(documentary,state({evidenceMode:'documentary'})).value,null);
});

test('no-table public prices and Suecia additional costs remain untouched',()=>{
  const suecia=project('edificio-suecia');assert.equal(hasCatalogTypologyPrices(suecia),false);
  assert.equal(catalogTypologyRecord(suecia),null);
  assert.deepEqual(projectOffer(suecia,state({})),catalogReference(suecia,state({})));
});

test('filtering and presentation never mutate published tables, facets or policy records',()=>{
  const p=structuredClone(origen),before=JSON.stringify(p);
  for(const input of [{},{propertyType:'local'},{bedrooms:'2',maxPriceInput:'4500'},
    {maxPriceInput:'2800',amenities:['gimnasio']}]){
    const s=state(input);for(const row of advancedFilterAndSort([p],s)){projectOffer(row,s);matchedLabels(row,s);}
  }
  assert.equal(JSON.stringify(p),before);
});
