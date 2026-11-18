import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadLocalDocumentaryReview,validatePlazaDocumentaryContract} from '../assets/js/documentary-local-review.mjs';
import {advancedFilterAndSort,defaults,readQuery,sanitizeState,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';
import {matchProjectFilters,queryFromCatalogState} from '../assets/js/commercial-filter-engine.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const published=JSON.parse(read('../data/proyectos.json'));
const facets=JSON.parse(read('../data/catalog-facets.json'));
const irisText=read('./fixtures/iris-documentary-15.json');
const plazaText=read('./fixtures/plaza-213-reference.json');
const plaza=JSON.parse(plazaText),iris=JSON.parse(irisText);
const pins={
  '/tests/fixtures/iris-documentary-15.json':'3706bac50a2aa70a6d6cb8483f8f13a62615d6f2ce461b82dfe1774601794b71',
  '/tests/fixtures/plaza-213-reference.json':'94c2ebc3e78c68e29addec501cbd329cec3b7619f78f164b11f8870739e7d865',
};
const texts={'/tests/fixtures/iris-documentary-15.json':irisText,'/tests/fixtures/plaza-213-reference.json':plazaText};
const location=new URL('http://localhost/proyectos.html?revision_documental=1');
const calls=[];
const fetchImpl=async(url,options)=>{calls.push({url,options});assert.ok(Object.hasOwn(texts,url));return{ok:true,text:async()=>texts[url]};};
const loaded=await loadLocalDocumentaryReview(published,{location,fetchImpl});
const bySlug=new Map(loaded.projects.map(project=>[project.slug,project]));
const record=slug=>bySlug.get(slug)._documentaryRecord;
const docState=state=>({...defaults(),evidenceMode:'documentary',...state});
const filter=(state={},projects=loaded.projects)=>advancedFilterAndSort(projects,docState(state));
const evaluate=(record,query)=>{const match=matchProjectFilters(record,query);assert.deepEqual(match.issues,[]);return match;};
const assertValidState=state=>{
  const query=queryFromCatalogState(docState(state));
  assert.deepEqual(matchProjectFilters(record('plaza-las-condes'),query).issues,[]);
};

test('reviewed fixture bytes, local-only requests and stable identity counts',()=>{
  for(const [url,text] of Object.entries(texts))assert.equal(createHash('sha256').update(text).digest('hex'),pins[url]);
  assert.equal(calls.length,2);
  calls.forEach(({url,options})=>{assert.ok(url.startsWith('/tests/fixtures/'));assert.deepEqual(options,{cache:'no-store',credentials:'omit',redirect:'error'});});
  assert.equal(loaded.index.documentaryReviewEnabled,true);
  assert.equal(loaded.index.documentaryReferenceCount,16);
  assert.equal(loaded.index.documentaryProjectCount,15);
  assert.equal(loaded.projects.length,131);
  assert.equal(loaded.projects.filter(project=>!project._documentaryRecord.references.length).length,116);
  assert.deepEqual(loaded.projects.map(project=>project.slug),published.map(project=>project.slug));
});

test('fetch gate rejects production, non-loopback, inactive and duplicate flags before transport',async()=>{
  let calls=0;const fetchImpl=()=>{calls++;throw Error('must not fetch');};
  for(const url of ['https://sollahms.cl/?revision_documental=1','http://localhost.evil/?revision_documental=1',
    'http://0.0.0.0/?revision_documental=1','http://localhost/','http://localhost/?revision_documental=0',
    'http://127.0.0.1/?revision_documental=true','http://localhost/?revision_documental=1&revision_documental=1',
    'http://localhost/?revision_documental=1&revision_documental=0','ftp://localhost/?revision_documental=1']){
    assert.equal(await loadLocalDocumentaryReview(null,{location:new URL(url),fetchImpl}),null,url);
  }
  assert.equal(await loadLocalDocumentaryReview(null,{fetchImpl}),null);
  assert.equal(calls,0);
});

test('each supported loopback host explicitly admits both pinned fixtures',async()=>{
  for(const host of ['localhost','127.0.0.1','[::1]']){
    const result=await loadLocalDocumentaryReview(published,{location:new URL('http://'+host+'/?revision_documental=1'),fetchImpl});
    assert.equal(result.index.documentaryReferenceCount,16);
  }
});

test('fetch and both pin failures throw without a documentary fallback',async()=>{
  await assert.rejects(loadLocalDocumentaryReview(published,{location,fetchImpl:async()=>({ok:false})}),/source fetch failed/);
  for(const bad of Object.keys(texts))await assert.rejects(loadLocalDocumentaryReview(published,{location,
    fetchImpl:async url=>({ok:true,text:async()=>texts[url]+(url===bad?'\n':'')})}),/SHA-256 mismatch/);
  const wrong=structuredClone(published);wrong.find(project=>project.slug==='plaza-las-condes').comuna='Providencia';
  await assert.rejects(loadLocalDocumentaryReview(wrong,{location,fetchImpl}),/location\/developer mismatch/);
});

test('scope and exact unit/model guards remain independent of byte pinning',()=>{
  assert.equal(validatePlazaDocumentaryContract(plaza,published),undefined);
  for(const mutate of [
    x=>{x.usage.localReviewOnly=false;},x=>{x.usage.useAsActiveOffer=true;},
    x=>{x.usage.stock=1;},x=>{x.usage.IrisPriceAdopted=true;},
    x=>{x.identity.unit='313';},x=>{x.identity.model='C6';},
    x=>{x.record.references[0].stock=0;},x=>{x.record.projectFacts.state='En verde';},
    x=>{x.record.references[0].attributes.priceUF=11073;},
    x=>{x.record.sourceProject.precioDesdeUF=11073;},
    x=>{x.fieldProvenance['/record/references/0/attributes/priceUF'].sourceDate='2026-11-17';},
    x=>{x.fieldProvenance['/record/references/0/attributes/usefulM2'].scope.unit='313';},
  ]){const changed=structuredClone(plaza);mutate(changed);assert.throws(()=>validatePlazaDocumentaryContract(changed,published),TypeError);}
});

test('loading does not mutate catalogue, source fixture, or reuse published commercial fields',async()=>{
  const projects=structuredClone(published),before=JSON.stringify(projects);
  const snapshot={iris:irisText,plaza:plazaText};
  const result=await loadLocalDocumentaryReview(projects,{location,fetchImpl});
  assert.equal(JSON.stringify(projects),before);
  assert.equal(read('./fixtures/iris-documentary-15.json'),snapshot.iris);
  assert.equal(read('./fixtures/plaza-213-reference.json'),snapshot.plaza);
  result.projects.forEach((project,index)=>{
    for(const [key,value] of Object.entries(projects[index]))assert.deepEqual(project[key],value);
    assert.equal(project._documentaryRecord.notOffer,true);
    assert.equal(project._documentaryRecord.commercialAdoptionAllowed,false);
    assert.ok(Object.keys(project._documentaryRecord.sourceProject).every(key=>['slug','nombre','inmobiliaria','comuna','region'].includes(key)));
    assert.ok(Object.isFrozen(project._documentaryRecord));
  });
});

test('no predicates keeps all 131 with a documentary match, including identity-only and Ecasa',()=>{
  const rows=filter();assert.equal(rows.length,131);
  assert.deepEqual(rows.map(project=>project.slug),published.map(project=>project.slug));
  rows.forEach(project=>{assert.ok(project._documentaryMatch.matches);assert.deepEqual(project._documentaryMatch.issues,[]);assert.equal(project._commercialMatch,undefined);});
  const empty=rows.find(project=>!project._documentaryRecord.references.length);
  assert.deepEqual(filter({search:empty.nombre}).map(project=>project.slug).includes(empty.slug),true);
  assert.ok(filter({region:empty.region,commune:empty.comuna,developers:[empty.inmobiliaria]}).some(project=>project.slug===empty.slug));
  assert.deepEqual(filter({propertyType:'departamento'},[empty]),[]);
  assert.deepEqual(filter({minPriceInput:'0'},[empty]),[]);
});

test('documentary mode cannot fall through to unregistered published or prepared facts',()=>{
  assert.deepEqual(filter({},published),[]);
  const empty=loaded.projects.find(project=>!project._documentaryRecord.references.length);
  const tainted={...empty,precioDesdeUF:1,estado:'En verde',_facets:{delivery:{immediate:true},features:[{id:'piscina',label:'Piscina'}]},
    _commercial:{sourceLayer:'prepared',references:[{id:'borrowed',attributes:{priceUF:1,usefulM2:99}}]},
    _commercialMatch:{references:[{id:'borrowed',attributes:{priceUF:1}}]}};
  assert.deepEqual(filter({minPriceInput:'1'},[tainted]),[]);
  assert.equal(filter({},[tainted])[0]._commercialMatch,undefined);
  assert.deepEqual(filter({},[{...tainted,_documentaryRecord:record('plaza-las-condes')}]),[]);
  assert.deepEqual(filter({},[{...tainted,_documentaryRecord:{...tainted._documentaryRecord,notOffer:false}}]),[]);
  assert.deepEqual(matchedLabels({...tainted,_documentaryMatch:filter({},[tainted])[0]._documentaryMatch},docState({amenities:['piscina']})),[]);
  for(const key of ['unit','model','stock','availability'])assert.deepEqual(filter({[key]:'213'},[bySlug.get('plaza-las-condes')]),[]);
});

test('documentary URL source is allowed only by an explicitly enabled option index',()=>{
  for(const enabled of [undefined,false,'true',1]){
    const options={documentaryReviewEnabled:enabled};
    assert.equal(sanitizeState({evidenceMode:'documentary'},options).evidenceMode,'published');
    assert.equal(readQuery('?evidencia=documentary&revision_documental=1',options).state.evidenceMode,'published');
  }
  assert.equal(readQuery('?evidencia=documentary',{documentaryReviewEnabled:true}).state.evidenceMode,'documentary');
  assert.equal(sanitizeState({evidenceMode:'prepared'},{}).evidenceMode,'prepared');
});

test('Iris15 room and terrace positives keep the exact witness and original metric labels',()=>{
  let positives=0;
  for(const source of iris.records)for(const reference of source.references){
    const attrs=reference.attributes,project=bySlug.get(source.slug);
    const admitted=record(source.slug).references.find(ref=>ref.id===reference.id);
    assert.equal(admitted.attributes.priceUF,null);assert.equal(admitted.stock,null);
    assert.equal(admitted.attributes.internalM2,attrs.internalM2);
    assert.equal(admitted.attributes.lotTotalM2,attrs.lotTotalM2);
    for(const key of ['interiorM2','usefulM2','totalM2','landM2'])assert.equal(admitted.attributes[key],null);
    const metadata=project._documentaryMetadata.byReferenceId[reference.id];
    assert.equal(metadata.externalPriceMetadata,undefined);assert.equal(metadata.literalDescription,undefined);
    assert.deepEqual(metadata.scope,reference.scope);assert.deepEqual(metadata.sourceMetrics,reference.sourceMetrics);
    if(attrs.bedrooms===null||attrs.bathrooms===null)continue;
    const state={propertyType:attrs.propertyType,bedrooms:String(attrs.bedrooms),bathrooms:String(attrs.bathrooms),
      areaType:'terraza',minArea:String(attrs.terraceM2),maxArea:String(attrs.terraceM2)};
    assertValidState(state);
    const rows=filter(state,[project]);assert.equal(rows.length,1);
    assert.ok(rows[0]._documentaryMatch.matchedReferenceIds.includes(reference.id));positives++;
  }
  assert.equal(positives,14);
});

test('Iris active price/useful/total/interior/land unknowns fail valid queries; inactive unknowns survive',()=>{
  const projects=loaded.projects.filter(project=>iris.records.some(source=>source.slug===project.slug));
  for(const state of [{minPriceInput:'0',maxPriceInput:'1000000'},...['util','total','interior','terreno'].map(areaType=>({areaType,minArea:'0',maxArea:'1000000'}))]){
    assertValidState(state);assert.deepEqual(filter(state,projects),[]);
  }
  assert.equal(filter({},projects).length,14);
});

test('state, delivery, purchase stage, amenities and extras never borrow public facts',()=>{
  const tainted=loaded.projects.map(project=>({...project,estado:'En verde',
    _facets:{states:['En verde'],delivery:{immediate:true,year:2026},purchaseStage:{eligible:true,mode:'verde'},
      parking:{included:true},storage:{available:true},features:[{id:'piscina',label:'Piscina'}]}}));
  for(const state of [{state:'En verde'},{delivery:'inmediata'},{delivery:'2026'},
    {purchaseModes:['verde']},{amenities:['piscina']},{features:['terraza-privada']},
    {parking:'included'},{storage:'available'}]){assertValidState(state);assert.deepEqual(filter(state,tainted),[]);}
});

test('verified same-project metro is an independent geographic predicate and unknown does not match',()=>{
  const base=bySlug.get('plaza-las-condes');
  const project={...base,_metro:{status:'verified-geographic',address:base.direccion,commune:base.comuna,
    connections:[{status:'operational',stationId:'verified-station',lines:['L1'],geographicM:400}]}};
  const state={metroNetwork:'current',metroLines:['L1'],metroDistance:'500',bedrooms:'2',bathrooms:'2'};
  assert.equal(filter(state,[project]).length,1);
  assert.deepEqual(filter(state,[{...project,_metro:undefined}]),[]);
  assert.deepEqual(filter(state,[{...project,_metro:{...project._metro,address:'another address'}}]),[]);
  assert.deepEqual(filter({...state,metroDistance:'300'},[project]),[]);
});

test('Alto Buzeta references cannot lend their terrace to each other',()=>{
  const source=iris.records.find(record=>record.references.length===2),project=bySlug.get(source.slug);
  const [first,second]=source.references;
  const state={bedrooms:String(first.attributes.bedrooms),bathrooms:String(first.attributes.bathrooms),
    areaType:'terraza',minArea:String(second.attributes.terraceM2),maxArea:String(second.attributes.terraceM2)};
  assertValidState(state);assert.deepEqual(filter(state,[project]),[]);
});

test('Plaza213 metadata separates owner date and observed undated drawing without certifying stock',()=>{
  const metadata=bySlug.get('plaza-las-condes')._documentaryMetadata.byReferenceId[plaza.stableReferenceId];
  assert.equal(metadata.ownerPriceDate,'2026-10-28');
  assert.equal(metadata.observedAtUTC,'2026-11-17T20:01:25.753Z');
  assert.equal(metadata.sourceDate,null);assert.equal(metadata.sourceRevision,null);
  assert.equal(metadata.unitLabel,'213');assert.equal(metadata.modelLabel,'C7');
  assert.equal(metadata.scope.stock,null);assert.equal(metadata.usage.useAsActiveOffer,false);
  assert.deepEqual(record('plaza-las-condes').references,plaza.record.references);
});

test('Plaza213 same-reference price+D/B+useful+total+terrace is supported by the exact contract',()=>{
  const match=evaluate(record('plaza-las-condes'),plaza.verificationPlan.positiveExample.query);
  assert.equal(match.matches,true);assert.deepEqual(match.matchedReferenceIds,[plaza.stableReferenceId]);
  for(const [areaType,value] of [['util','69.85'],['total','83.82'],['terraza','13.97']]){
    const state={minPriceInput:'11119',maxPriceInput:'11119',bedrooms:'2',bathrooms:'2',areaType,minArea:value,maxArea:value};
    assertValidState(state);const rows=filter(state);assert.equal(rows.length,1);
    assert.deepEqual(rows[0]._documentaryMatch.matchedReferenceIds,[plaza.stableReferenceId]);
  }
});

for(const scenario of plaza.verificationPlan.negativeCases)test('Plaza213 contract: '+scenario.id,()=>{
  const match=evaluate(record('plaza-las-condes'),scenario.query);
  assert.equal(match.matches,false);assert.deepEqual(match.matchedReferenceIds,[]);
});

test('price ordering uses documentary witnesses only; delivery unknown retains original order',()=>{
  const projects=loaded.projects.map((project,index)=>({...project,precioDesdeUF:index===0?1:999999,
    _facets:{delivery:{year:2000+index,immediate:index===0}}}));
  for(const sortOrder of ['price-asc','price-desc'])assert.equal(filter({sortOrder},projects)[0].slug,'plaza-las-condes');
  assert.deepEqual(filter({sortOrder:'delivery'},projects).map(project=>project.slug),projects.map(project=>project.slug));
});

test('documentary additions leave normal published and prepared modes unchanged',()=>{
  const inputs=published.map(project=>({...project,_facets:facets.projects[project.slug]}));
  const enriched=loaded.projects.map(project=>({...project,_facets:facets.projects[project.slug]}));
  for(const evidenceMode of ['published','prepared'])for(const state of [{},{propertyType:'departamento'},
    {bedrooms:'2',minPriceInput:'3000',maxPriceInput:'12000'},{areaType:'total',minArea:'50'},
    {developers:['Ecasa'],sortOrder:'price-asc'},{amenities:['piscina'],amenitiesAll:false}]){
    const input={...defaults(),...state,evidenceMode};
    assert.deepEqual(advancedFilterAndSort(enriched,input).map(project=>project.slug),
      advancedFilterAndSort(inputs,input).map(project=>project.slug));
  }
  const normal={...published[0],_commercial:{slug:published[0].slug,sourceLayer:'prepared',
    projectFacts:{region:published[0].region},references:[{id:'prepared',attributes:{priceUF:4444,bedrooms:2}}]}};
  const prepared={...defaults(),evidenceMode:'prepared',bedrooms:'2',maxPriceInput:'4500'};
  const result=advancedFilterAndSort([{...normal,...Object.fromEntries(Object.entries(loaded.projects[0]).filter(([key])=>key.startsWith('_documentary')))}],prepared);
  assert.equal(result.length,1);assert.deepEqual(result[0]._commercialMatch.matchedReferenceIds,['prepared']);
  assert.equal(result[0]._documentaryMatch,undefined);
});
