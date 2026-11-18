import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {isNollagamQuoteProject,loadNollagamOwnerQuoteContexts,nollagamOwnerQuoteContext,
  matchNollagamOwnerQuotes,nollagamOwnerQuoteWitness,nollagamOwnerQuoteOffer,
  nollagamOwnerQuoteFacts,nollagamOwnerQuoteNote,NOLLAGAM_OWNER_SOURCE_SHA256,
  NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH,NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256,validateNollagamOwnerQuoteProjection}
  from '../assets/js/catalog-nollagam-quote-consumer.mjs';

const published=JSON.parse(readFileSync(new URL('../data/proyectos.json',import.meta.url),'utf8'));
const ownerBytes=readFileSync(new URL('../data/catalog-nollagam-owner-quotes.json',import.meta.url));
const projection=JSON.parse(ownerBytes);
const originalBytes=readFileSync(new URL('../data/nollagam-commercial.json',import.meta.url));
const original=JSON.parse(originalBytes);
const body=bytes=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const sourceFetch=async()=>({ok:true,redirected:false,arrayBuffer:async()=>body(ownerBytes)});
const loaded=await loadNollagamOwnerQuoteContexts(published,{fetchImpl:sourceFetch,cryptoImpl:webcrypto});
const attach=(slug,layer=loaded)=>({...published.find(project=>project.slug===slug),
  _nollagamOwnerQuoteContext:layer.bySlug[slug]});
const evaluate=(project,state)=>{
  const result=matchNollagamOwnerQuotes(project,{evidenceMode:'published',...state});
  assert.ok(result!==null);assert.deepEqual(result.issues,[]);return result;
};

test('loader verifies the public projection pin and retains private-original provenance and dates',async()=>{
  assert.equal(createHash('sha256').update(ownerBytes).digest('hex'),NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256);
  const calls=[];
  const result=await loadNollagamOwnerQuoteContexts(published,{cryptoImpl:webcrypto,
    fetchImpl:async(url,options)=>{calls.push({url,options});return sourceFetch();}});
  assert.equal(calls.length,1);assert.equal(calls[0].url,NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH);
  assert.equal(calls[0].url,'/data/catalog-nollagam-owner-quotes.json');
  assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.credentials,'omit');
  assert.equal(calls[0].options.redirect,'error');assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal(result.status,'ready');assert.equal(Object.keys(result.bySlug).length,7);
  for(const [slug,context] of Object.entries(result.bySlug)){
    assert.equal(context.status,'ready');assert.equal(context.slug,slug);
    assert.equal(context.source.sha256,NOLLAGAM_OWNER_SOURCE_SHA256);assert.equal(context.source.date,'2026-10-28');
    assert.equal(context.source.path,'data/nollagam-commercial.json');
    assert.equal(context.source.publicSourcePath,NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH);
    assert.equal(context.source.publicSourceSHA256,NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256);
    assert.equal(context.record.sourceProject.slug,slug);assert.ok(Object.isFrozen(context));
    for(const reference of context.record.references){
      assert.equal(reference.sourcePath,'data/nollagam-commercial.json');
      assert.equal(reference.sourceSHA256,NOLLAGAM_OWNER_SOURCE_SHA256);
      assert.equal(reference.publicSourcePath,NOLLAGAM_OWNER_PUBLIC_SOURCE_PATH);
      assert.equal(reference.publicSourceSHA256,NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256);
    }
  }
});

test('public allowlist preserves exactly the seventeen original owner amounts and no project descriptions or URLs',()=>{
  assert.equal(createHash('sha256').update(originalBytes).digest('hex'),NOLLAGAM_OWNER_SOURCE_SHA256);
  assert.equal(projection.originalSourceSHA256,NOLLAGAM_OWNER_SOURCE_SHA256);
  assert.equal(projection.originalSourcePath,'data/nollagam-commercial.json');
  assert.equal(projection.checkedOn,original.checkedOn);assert.equal(projection.priceSource,original.priceSource);
  assert.deepEqual(Object.keys(projection.projects),Object.keys(original.projects));
  assert.deepEqual(Object.keys(projection),['schemaVersion','projectionKind','originalSourcePath',
    'originalSourceSHA256','checkedOn','priceSource','projects']);
  let count=0;
  for(const [slug,project] of Object.entries(projection.projects)){
    assert.deepEqual(Object.keys(project),['prices']);
    assert.deepEqual(project.prices,original.projects[slug].prices);count+=Object.keys(project.prices).length;
  }
  assert.equal(count,17);assert.doesNotMatch(ownerBytes.toString('utf8'),/https?:\/\//);
  assert.equal(validateNollagamOwnerQuoteProjection(projection),projection);
});

test('strict public schema rejects raw payloads, history, screenshots and brochure URLs at every data level',()=>{
  assert.throws(()=>validateNollagamOwnerQuoteProjection(original),/source-schema-invalid/);
  for(const field of ['history','commercialHistory','notes','screenshots','brochureURL','sourceUrl']){
    const root=structuredClone(projection);root[field]='https://private.invalid/document';
    assert.throws(()=>validateNollagamOwnerQuoteProjection(root),/source-schema-invalid/);
    const project=structuredClone(projection);project.projects['costanera-coquimbo-a'][field]='https://private.invalid/document';
    assert.throws(()=>validateNollagamOwnerQuoteProjection(project),/source-schema-invalid/);
    const prices=structuredClone(projection);prices.projects['costanera-coquimbo-a'].prices[field]='https://private.invalid/document';
    assert.throws(()=>validateNollagamOwnerQuoteProjection(prices),/source-schema-invalid/);
  }
  const wrappedRaw=structuredClone(projection);wrappedRaw.projects=original.projects;
  assert.throws(()=>validateNollagamOwnerQuoteProjection(wrappedRaw),/source-schema-invalid/);
});

test('strict projection identity and exact numeric price-key allowlists reject new facts or substituted source proof',()=>{
  for(const change of [{schemaVersion:2},{projectionKind:'raw-owner-data'},
    {originalSourcePath:'data/other-owner.json'},{originalSourceSHA256:'0'.repeat(64)},
    {checkedOn:'2026-11-17'},{priceSource:'Provider campaign'}]){
    assert.throws(()=>validateNollagamOwnerQuoteProjection({...projection,...change}),/source-schema-invalid/);
  }
  const unknown=structuredClone(projection);unknown.projects['foreign-project']={prices:{'2':4210}};
  assert.throws(()=>validateNollagamOwnerQuoteProjection(unknown),/source-schema-invalid/);
  for(const key of ['1','4','02','constructor']){
    const changed=structuredClone(projection);changed.projects['costanera-coquimbo-a'].prices[key]=4210;
    assert.throws(()=>validateNollagamOwnerQuoteProjection(changed),/source-schema-invalid/);
  }
  for(const value of [null,'4210',0,-1,NaN,Infinity]){
    const changed=structuredClone(projection);changed.projects['costanera-coquimbo-a'].prices['2']=value;
    assert.throws(()=>validateNollagamOwnerQuoteProjection(changed),/source-schema-invalid/);
  }
  const missing=structuredClone(projection);delete missing.projects['costanera-coquimbo-a'].prices['2'];
  assert.throws(()=>validateNollagamOwnerQuoteProjection(missing),/source-schema-invalid/);
  const hidden=structuredClone(projection);Object.defineProperty(hidden,'history',{value:'private',enumerable:false});
  assert.throws(()=>validateNollagamOwnerQuoteProjection(hidden),/source-schema-invalid/);
});

test('schema rejection remains independent of a transport digest that is accepted by the pin guard',async()=>{
  // Stub only the digest to exercise the schema gate independently. Production
  // keeps the fixed public pin and default WebCrypto; no pin override is added.
  const acceptedDigest={subtle:{digest:async()=>body(Buffer.from(NOLLAGAM_OWNER_PUBLIC_SOURCE_SHA256,'hex'))}};
  for(const source of [original,{...projection,history:['not public']},
    {...projection,projects:{...projection.projects,'costanera-coquimbo-a':original.projects['costanera-coquimbo-a']}}]){
    let reads=0;const poisoned=[new Proxy({},{get(){reads++;throw Error('normalizer must not run');}})];
    const bytes=Buffer.from(JSON.stringify(source));
    const result=await loadNollagamOwnerQuoteContexts(poisoned,{cryptoImpl:acceptedDigest,
      fetchImpl:async()=>({ok:true,arrayBuffer:async()=>body(bytes)})});
    assert.equal(result.status,'unavailable');assert.equal(reads,0);
    for(const context of Object.values(result.bySlug))assert.equal(context.reason,'source-schema-invalid');
  }
});

test('failed public projection loading makes exactly one request and never falls back to the private original',async()=>{
  const calls=[];
  const result=await loadNollagamOwnerQuoteContexts(published,{cryptoImpl:webcrypto,
    fetchImpl:async url=>{calls.push(url);return {ok:false,status:404};}});
  assert.deepEqual(calls,['/data/catalog-nollagam-owner-quotes.json']);
  assert.equal(calls.includes('/data/nollagam-commercial.json'),false);assert.equal(result.status,'unavailable');
  const project=attach('costanera-coquimbo-a',result);
  assert.equal(evaluate(project,{bedrooms:'3',minPriceInput:'1'}).matches,false);
});

test('Costanera A3D UF5070 survives the previously failing UF5000–5100 query',()=>{
  const result=evaluate(attach('costanera-coquimbo-a'),{bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'});
  assert.equal(result.matches,true);assert.equal(result.references.length,1);
  assert.deepEqual(nollagamOwnerQuoteOffer(result),{value:5070,typology:'3 dormitorios',
    referenceId:'nollagam-owner:costanera-coquimbo-a:3d',date:'2026-10-28',financialBaselineCompatible:false});
  assert.equal(evaluate(attach('costanera-coquimbo-a'),{bedrooms:'2',minPriceInput:'5000',maxPriceInput:'5100'}).matches,false);
});

test('all seventeen existing owner prices match exact price+D without source coercion or model fields',()=>{
  let count=0;
  for(const [slug,context] of Object.entries(loaded.bySlug))for(const reference of context.record.references){
    const {priceUF,bedrooms}=reference.attributes;if(priceUF===null)continue;
    const result=evaluate(attach(slug),{bedrooms:String(bedrooms),minPriceInput:String(priceUF),maxPriceInput:String(priceUF)});
    assert.equal(result.matches,true,reference.id);assert.deepEqual(result.matchedReferenceIds,[reference.id]);
    assert.equal(nollagamOwnerQuoteOffer(result).value,priceUF);count++;
  }
  assert.equal(count,17);
});

test('the five unknown-price categories fail a valid active range and never acquire a project minimum',()=>{
  let count=0;
  for(const [slug,context] of Object.entries(loaded.bySlug))for(const reference of context.record.references){
    if(reference.attributes.priceUF!==null)continue;
    const result=evaluate(attach(slug),{bedrooms:String(reference.attributes.bedrooms),minPriceInput:'0',maxPriceInput:'99999'});
    assert.equal(result.matches,false,reference.id);assert.equal(nollagamOwnerQuoteWitness(result),null);
    assert.equal(nollagamOwnerQuoteOffer(result).value,null);assert.deepEqual(nollagamOwnerQuoteFacts(result),[]);count++;
  }
  assert.equal(count,5);
});

test('inactive price, unbound legacy projects and prepared/documentary modes delegate with null',()=>{
  const project=attach('costanera-coquimbo-a');
  for(const state of [{},{bedrooms:'3'},{evidenceMode:'prepared',minPriceInput:'1'},
    {evidenceMode:'documentary',minPriceInput:'1'}])assert.equal(matchNollagamOwnerQuotes(project,state),null);
  assert.equal(matchNollagamOwnerQuotes(published.find(project=>project.slug==='bcome'),{minPriceInput:'1'}),null);
  const unbound=published.find(project=>project.slug==='costanera-coquimbo-a');
  assert.equal(matchNollagamOwnerQuotes(unbound,{minPriceInput:'0'}),null);
  const inherited=Object.assign(Object.create({_nollagamOwnerQuoteContext:loaded.bySlug[unbound.slug]}),unbound);
  assert.equal(matchNollagamOwnerQuotes(inherited,{minPriceInput:'0'}),null);
  assert.equal(isNollagamQuoteProject(project),true);assert.equal(isNollagamQuoteProject({slug:'bcome'}),false);
  assert.equal(nollagamOwnerQuoteContext({slug:'bcome'}),null);
  assert.equal(nollagamOwnerQuoteOffer(null),null);assert.deepEqual(nollagamOwnerQuoteFacts(null),[]);
});

test('price queries preserve known identity, name and exact published address predicates',()=>{
  const project=attach('costanera-coquimbo-a'),base={bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'};
  for(const state of [{search:project.nombre},{search:project.direccion},
    {region:project.region,commune:project.comuna,developers:['Nollagam']}]){
    assert.equal(evaluate(project,{...base,...state}).matches,true,JSON.stringify(state));
  }
  for(const state of [{region:'Región Metropolitana'},{commune:'Santiago'},
    {developers:['AJ Urbana']},{search:'gimnasio'}])assert.equal(evaluate(project,{...base,...state}).matches,false);
});

test('unknown D, B, property/use, typed surfaces, private features, extras and amenities do not pass',()=>{
  const project=attach('costanera-coquimbo-a'),base={bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'};
  for(const state of [{bedrooms:'4+'},{bathrooms:'2'},{propertyType:'departamento'},{assetType:'Residencial'},
    ...['util','total','interior','terraza','jardin','terreno'].map(areaType=>({areaType,minArea:'0',maxArea:'9999'})),
    {features:['terraza-privada']},{features:['cocina-equipada']},
    {parking:'included'},{parking:'additional'},{storage:'available'},
    {amenities:['gimnasio']},{amenities:['piscina']},{amenities:['piscina','gimnasio'],amenitiesAll:true}]){
    assert.equal(evaluate(project,{...base,...state}).matches,false,JSON.stringify(state));
  }
});

test('state, delivery, purchase stage and unsupported unit/model/stock selectors are not silently removed',()=>{
  const project=attach('costanera-coquimbo-a'),base={bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'};
  for(const state of [{state:'En blanco'},{delivery:'2027'},{purchaseModes:['blanco']},
    {unit:'101'},{model:'3D'},{stock:true},{availability:false},
    {metroNetwork:'current'},{metroLines:['L1']}]){
    assert.equal(evaluate(project,{...base,...state}).matches,false,JSON.stringify(state));
  }
});

test('the witness is the lowest price among matching references only',()=>{
  const project=attach('costanera-coquimbo-a');
  const all=evaluate(project,{minPriceInput:'1'}),filtered=evaluate(project,{minPriceInput:'5000',maxPriceInput:'5100'});
  assert.equal(nollagamOwnerQuoteWitness(all).attributes.priceUF,4210);
  assert.equal(nollagamOwnerQuoteWitness(filtered).attributes.priceUF,5070);
  const foreign=loaded.bySlug['costanera-coquimbo-b'].record.references[0];
  assert.equal(nollagamOwnerQuoteWitness({...filtered,references:[foreign]}),null);
  assert.equal(nollagamOwnerQuoteWitness({...filtered,record:loaded.bySlug['costanera-coquimbo-b'].record}),null);
  assert.equal(nollagamOwnerQuoteWitness({...filtered,matches:false}),null);
});

test('projection shows only the matching typology, original owner date and explicit scope notice',()=>{
  const result=evaluate(attach('costanera-coquimbo-a'),{bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'});
  assert.deepEqual(nollagamOwnerQuoteFacts(result),[{label:'Tipologías',value:'3 dormitorios'}]);
  const note=nollagamOwnerQuoteNote(result);
  assert.match(note,/propietario/);assert.match(note,/28\/10\/2026/);assert.match(note,/no acredita unidad ni stock/);
  assert.equal(nollagamOwnerQuoteOffer(result).financialBaselineCompatible,false);
  assert.equal(nollagamOwnerQuoteNote(null),'');
});

test('pin mismatch is rejected before normalization and gives seven unavailable contexts',async()=>{
  let reads=0;const poisoned=[new Proxy({},{get(){reads++;throw Error('should not normalize');}})];
  const badBytes=Buffer.concat([ownerBytes,Buffer.from('\n')]);
  const result=await loadNollagamOwnerQuoteContexts(poisoned,{cryptoImpl:webcrypto,
    fetchImpl:async()=>({ok:true,arrayBuffer:async()=>body(badBytes)})});
  assert.equal(reads,0);assert.equal(result.status,'unavailable');assert.equal(Object.keys(result.bySlug).length,7);
  for(const context of Object.values(result.bySlug)){
    assert.equal(context.status,'unavailable');assert.equal(context.reason,'source-pin-mismatch');assert.equal(context.record,null);
  }
});

test('HTTP, fetch, crypto, redirect and identity-normalization failures never reactivate legacy prices',async()=>{
  const cases=[
    {fetchImpl:async()=>({ok:false,status:503})},
    {fetchImpl:async()=>{throw Error('network unavailable');}},
    {fetchImpl:sourceFetch,cryptoImpl:{}},
    {fetchImpl:async()=>({ok:true,redirected:true})},
  ];
  for(const options of cases){
    const result=await loadNollagamOwnerQuoteContexts(published,{cryptoImpl:webcrypto,...options});
    assert.equal(result.status,'unavailable');assert.equal(Object.keys(result.bySlug).length,7);
    const project=attach('costanera-coquimbo-a',result),match=evaluate(project,{bedrooms:'3',minPriceInput:'1'});
    assert.equal(match.matches,false);assert.equal(match.context.status,'unavailable');
    assert.equal(nollagamOwnerQuoteOffer(match).value,null);assert.equal(nollagamOwnerQuoteOffer(match).date,null);
    assert.equal(matchNollagamOwnerQuotes(project,{bedrooms:'3'}),null);
  }
  const missing=published.filter(project=>project.slug!=='costanera-coquimbo-a');
  const result=await loadNollagamOwnerQuoteContexts(missing,{cryptoImpl:webcrypto,fetchImpl:sourceFetch});
  assert.equal(result.status,'unavailable');assert.equal(result.bySlug['costanera-coquimbo-a'].reason,'source-invalid');
});

test('bound empty, crossed, copied and mismatched identities close the active-price route',()=>{
  const original=published.find(project=>project.slug==='costanera-coquimbo-a');
  const ready=loaded.bySlug[original.slug];
  for(const project of [{...original,_nollagamOwnerQuoteContext:undefined},{...original,_nollagamOwnerQuoteContext:null},
    {...original,_nollagamOwnerQuoteContext:loaded.bySlug['costanera-coquimbo-b']},
    {...original,_nollagamOwnerQuoteContext:{...ready}},
    {...original,inmobiliaria:'Euro',_nollagamOwnerQuoteContext:ready},
    {...original,direccion:'Different address',_nollagamOwnerQuoteContext:ready}]){
    assert.equal(nollagamOwnerQuoteContext(project).status,'unavailable');
    assert.equal(evaluate(project,{bedrooms:'3',minPriceInput:'1'}).matches,false);
  }
});

test('loading, matching and projecting do not mutate published data or trusted records',()=>{
  const before=JSON.stringify(published),context=loaded.bySlug['costanera-coquimbo-a'],recordBefore=JSON.stringify(context.record);
  const project=attach('costanera-coquimbo-a'),projectBefore=JSON.stringify(project);
  const result=evaluate(project,{bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'});
  nollagamOwnerQuoteOffer(result);nollagamOwnerQuoteFacts(result);nollagamOwnerQuoteNote(result);
  assert.equal(JSON.stringify(published),before);assert.equal(JSON.stringify(project),projectBefore);
  assert.equal(JSON.stringify(context.record),recordBefore);assert.ok(Object.isFrozen(context.record.references[0].attributes));
});
