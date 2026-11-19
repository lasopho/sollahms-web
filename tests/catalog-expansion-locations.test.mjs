import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {appendCatalogExpansion,parseCatalogExpansion,isCatalogExpansionProject} from '../assets/js/catalog-expansion.mjs';
import {parseExpansionLocations,loadExpansionLocations,validateExpansionLocations,bindExpansionLocations,mergeExpansionLocations,hasVerifiedExpansionLocation,expansionLocationLabels} from '../assets/js/catalog-expansion-locations.mjs';
import {locateProjects,locationGroups,validMapState} from '../assets/js/catalog-map-model.mjs';
import {metroMatches,metroSummary,geographicMeters} from '../assets/js/metro-model.mjs';
import {defaults,advancedFilterAndSort,readQuery,writeQuery} from '../assets/js/catalog-filter-engine.mjs';
import {facetOptions} from '../assets/js/catalog-filter-controls.mjs';
import {projectOffer} from '../assets/js/catalog-model.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const original=JSON.parse(await read('data/proyectos.json'));
const facets=JSON.parse(await read('data/catalog-facets.json'));
const originalLocations=JSON.parse(await read('data/project-locations.json'));
const originalMetro=JSON.parse(await read('data/project-metro.json'));
const networkText=await read('data/metro-network.json'),network=JSON.parse(networkText);
const input=JSON.parse(await read('data/catalog-expansion-locations-20261119.json'));
const commercialText=await read('data/catalog-expansion-iris-20261118.json');
const commercialSource=await parseCatalogExpansion(commercialText,{cryptoImpl:webcrypto});
const base=original.map(p=>({...p,_facets:facets.projects[p.slug],_metro:originalMetro.projects[p.slug]}));
const projects=appendCatalogExpansion(base,commercialSource),newSlugs=projects.filter(isCatalogExpansionProject).map(p=>p.slug);
const clone=value=>JSON.parse(JSON.stringify(value));
const state=patch=>({...defaults(),...patch});
const hash=text=>createHash('sha256').update(text).digest('hex');
function pending(){const value=clone(input);for(const row of Object.values(value.locations)){Object.assign(row,{status:'pending',lat:null,lng:null,checkedOn:null,source:null,provenance:null});for(const k of ['siteAddress','addressContext','publicNote'])delete row[k];}return value;}
// Synthetic coordinates/proofs below exist ONLY in memory inside these tests.
// They are not primary evidence and are never written to the public dataset.
function verified(row,i=0){
  const url='https://example.test/synthetic-fixtures/'+row.projectId;
  return {...row,status:'verified',lat:-33.44-i/10000,lng:-70.64,checkedOn:'2026-11-19',source:url,
    provenance:{role:'official-project-marker',precision:'representative-project-point',sourceAddress:row.address,notSalesOffice:true,
      primaryProofs:[{url,label:'SYNTHETIC TEST FIXTURE, NOT PROJECT EVIDENCE',confirmsProject:true,confirmsAddress:true}],sameProjectAddress:null}};
}
function fixture(count){const value=pending();for(const [i,slug] of newSlugs.entries())if(i<count)value.locations[slug]=verified(value.locations[slug],i);return value;}
async function parsed(value){const text=JSON.stringify(value);return parseExpansionLocations(text,{sourceSHA256:hash(text),cryptoImpl:webcrypto});}
const bind=async value=>bindExpansionLocations(projects,await parsed(value),{networkText,cryptoImpl:webcrypto});

test('the final public geography is hash-pinned, admits its 21 reviewed points and preserves source registries',async()=>{
  const source=await parseExpansionLocations(await read('data/catalog-expansion-locations-20261119.json'),{cryptoImpl:webcrypto});
  const result=await bindExpansionLocations(projects,source,{networkText,cryptoImpl:webcrypto});
  assert.equal(result.verifiedLocationCount,21);assert.equal(result.pendingLocationCount,0);assert.equal(result.metroAvailable,true);
  assert.equal(hash(commercialText),'33ca3e27f847eca939e8ce3ce9032328a9288c1ff38ed12cf4cd6eddbe3401bb');
  assert.equal(hash(await read('data/project-locations.json')),'e15ac90bc84227a5cff148c17ed7737ac247e8cae60a38652e5e603dd27fdd6d');
  assert.equal(hash(await read('data/project-metro.json')),'1a68aafcae7e2ac7097ab24de8828a2e6029c9e25cfbfc3367c36440e3592f49');
  const reserva=result.projects.find(p=>p.slug==='condominio-reserva-santa-clara');
  const labels=expansionLocationLabels(reserva,result.locations[reserva.slug]);
  assert.match(labels[0],/2001/);assert.match(labels[1],/1855/);assert.equal(reserva._metro,undefined);
});
test('zero verified additions preserve all 152 identities and every original location/Metro object',async()=>{
  const before=JSON.stringify({originalLocations,originalMetro});const result=await bind(pending());
  assert.equal(result.verifiedLocationCount,0);assert.equal(result.pendingLocationCount,21);assert.equal(result.projects.length,152);
  for(let i=0;i<131;i++)assert.equal(result.projects[i],base[i]);
  const registry=mergeExpansionLocations(originalLocations,result.locations),mapped=locateProjects(result.projects,registry);
  assert.equal(mapped.located.length,131);assert.equal(mapped.pending.length,21);
  for(const slug of Object.keys(originalLocations.locations))assert.equal(registry.locations[slug],originalLocations.locations[slug]);
  assert.equal(JSON.stringify({originalLocations,originalMetro}),before);
});
test('all 21 admitted points become selectable without changing the commercial coordinate guard',async()=>{
  const result=await bind(fixture(21)),mapped=locateProjects(result.projects,mergeExpansionLocations(originalLocations,result.locations));
  assert.equal(mapped.located.length,152);assert.equal(mapped.pending.length,0);assert.equal(result.verifiedLocationCount,21);
  assert.deepEqual(mapped.located.slice(131).map(r=>r.project.slug),newSlugs);
  assert.ok(locationGroups(mapped.located).every(group=>group.rows.every(row=>Number.isFinite(row.location.lat))));
  for(const p of result.projects.filter(isCatalogExpansionProject)){assert.equal(p._catalogExpansion.input.location.latitude,null);assert.equal(p._catalogExpansion.input.location.longitude,null);}
});
test('partial geography leaves only its unsupported points pending and keeps inactive unknowns',async()=>{
  const result=await bind(fixture(7)),mapped=locateProjects(result.projects,mergeExpansionLocations(originalLocations,result.locations));
  assert.equal(mapped.located.length,138);assert.equal(mapped.pending.length,14);
  assert.equal(advancedFilterAndSort(result.projects,defaults()).length,152);
  assert.equal(result.projects.filter(p=>isCatalogExpansionProject(p)&&!result.locations[p.slug]).length,14);
});
test('split-view locate eligibility distinguishes admitted points from pending, forged or stale identities',async()=>{
  const result=await bind(fixture(1)),located=result.projects.find(p=>p.slug===newSlugs[0]),pending=result.projects.find(p=>p.slug===newSlugs[1]);
  assert.equal(hasVerifiedExpansionLocation(located,result.locations),true);
  assert.equal(hasVerifiedExpansionLocation(pending,result.locations),false);
  assert.equal(hasVerifiedExpansionLocation(located,null),false);
  assert.equal(hasVerifiedExpansionLocation(located,{...result.locations}),false);
  assert.equal(hasVerifiedExpansionLocation({...located,direccion:located.direccion+' changed'},result.locations),false);
  const filtered=advancedFilterAndSort(result.projects,state({search:located.nombre}));
  assert.equal(filtered.length,1);assert.equal(hasVerifiedExpansionLocation(filtered[0],result.locations),true);
});
test('transport hash and redirected/unavailable loads cannot admit geographic facts',async()=>{
  const value=JSON.stringify(pending());await assert.rejects(parseExpansionLocations(value,{sourceSHA256:'0'.repeat(64),cryptoImpl:webcrypto}),/hash/);
  await assert.rejects(loadExpansionLocations(async()=>({ok:true,redirected:true,text:async()=>value})),/unavailable/);
  await assert.rejects(bindExpansionLocations(projects,{data:pending()}),/verified location transport/);
});
test('wrong slug, ID or published identity fails closed without any partial registry',()=>{
  for(const change of [v=>{v.locations[newSlugs[0]].projectId='wrong';},v=>{v.locations.unknown=v.locations[newSlugs[0]];delete v.locations[newSlugs[0]];},v=>{v.locations[newSlugs[0]].address+=' changed';},v=>{v.locations[newSlugs[0]].commune='Wrong';}]){
    const value=fixture(1);change(value);assert.throws(()=>validateExpansionLocations(value,projects));
  }
});
test('swapped coordinates, nonnumeric values and points outside Chile fail closed',()=>{
  for(const patch of [{lat:-70.64,lng:-33.44},{lat:-15},{lng:-80},{lat:'-33.44'},{lat:null},{lng:NaN}]){
    const value=fixture(1);Object.assign(value.locations[newSlugs[0]],patch);assert.throws(()=>validateExpansionLocations(value,projects),/coordinates/);
  }
  const value=pending();value.locations[newSlugs[0]].lat=0;assert.throws(()=>validateExpansionLocations(value,projects),/pending/);
});
test('street centres, sales offices and absent primary identity proofs are rejected',()=>{
  for(const change of [v=>{v.role='street-centre';},v=>{v.notSalesOffice=false;},v=>{v.primaryProofs=[];},v=>{v.primaryProofs[0].confirmsProject=false;}]){
    const value=fixture(1);change(value.locations[newSlugs[0]].provenance);assert.throws(()=>validateExpansionLocations(value,projects));
  }
});
test('a different source address requires an explicit same-project primary proof',async()=>{
  const value=fixture(1),row=value.locations[newSlugs[0]],proof=row.provenance;proof.sourceAddress='A primary-address alternative';
  assert.throws(()=>validateExpansionLocations(value,projects),/equivalence/);
  proof.sameProjectAddress={publishedAddress:row.address,sourceAddress:proof.sourceAddress,proofUrls:[proof.primaryProofs[0].url]};
  const result=await bind(value);assert.equal(result.locations[newSlugs[0]].address,projects[131].direccion);
  proof.sameProjectAddress.proofUrls=['https://example.test/not-in-primary-proof'];assert.throws(()=>validateExpansionLocations(value,projects),/same-project/);
});
test('selected address entities need the exact source house number/street/commune and cannot be camera centres',()=>{
  const value=fixture(1),row=value.locations[newSlugs[0]],v=row.provenance;
  Object.assign(v,{role:'verified-address-marker',sourceHouseNumber:'4719',sourceStreet:'Alameda',sourceCommune:row.commune,geometryRole:'selected-address-entity',exactEntranceCertified:false});
  assert.equal(validateExpansionLocations(value,projects),value);
  for(const patch of [{sourceHouseNumber:'1703'},{sourceStreet:'Another street'},{sourceCommune:'Wrong'},{geometryRole:'camera-centre'},{exactEntranceCertified:true}]){
    const changed=clone(value);Object.assign(changed.locations[newSlugs[0]].provenance,patch);assert.throws(()=>validateExpansionLocations(changed,projects));
  }
});
function separateContext(slug,salesOffice){
  const value=fixture(21),row=value.locations[slug],v=row.provenance;
  row.siteAddress='Calle Waldo Alcalde N° 2001, Coquimbo';row.addressContext=salesOffice?'published-sales-office':'project-location';row.publicNote='SYNTHETIC disclosure: distinct address contexts, no exact entrance claim.';
  Object.assign(v,{role:salesOffice?'official-project-reference':'official-project-marker',sourceAddress:row.siteAddress,notSalesOffice:salesOffice?null:true,geometryRole:'official-project-reference',sourcePublishedMapSection:'project-location',exactEntranceCertified:false,numbersOrEntrancesDeclaredEquivalent:false});
  v.sameProjectAddress={publishedAddress:row.address,sourceAddress:v.sourceAddress,proofUrls:[v.primaryProofs[0].url],relation:'same-project-different-address-contexts'};return value;
}
test('Reserva distinguishes project reference2001 from published sales office1855 without certifying either access',async()=>{
  const slug='condominio-reserva-santa-clara',value=separateContext(slug,true),result=await bind(value),p=result.projects.find(p=>p.slug===slug),row=result.locations[slug];
  assert.equal(p.direccion,value.locations[slug].address);assert.equal(row.provenance.notSalesOffice,null);assert.equal(row.provenance.exactEntranceCertified,false);
  assert.deepEqual(expansionLocationLabels(p,row),['Ubicación del proyecto informada: '+row.siteAddress,'Sala de ventas publicada: '+p.direccion]);assert.equal(p._metro,undefined);
  assert.deepEqual(expansionLocationLabels(base[0],row),[]);
  for(const change of [r=>{delete r.addressContext;},r=>{r.provenance.notSalesOffice=false;},r=>{r.provenance.sourcePublishedMapSection='sales-office';},r=>{r.provenance.sameProjectAddress.relation='same-project-primary-address';},r=>{r.provenance.exactEntranceCertified=true;}]){
    const wrong=clone(value);change(wrong.locations[slug]);assert.throws(()=>validateExpansionLocations(wrong,projects));
  }
});
test('Hacienda retains published1847 separately from the official map reference2001',async()=>{
  const slug='condominio-hacienda-santa-clara',value=separateContext(slug,false),result=await bind(value),p=result.projects.find(p=>p.slug===slug);
  assert.deepEqual(expansionLocationLabels(p,result.locations[slug]),['Ubicación del proyecto informada: '+value.locations[slug].siteAddress,'Dirección publicada de referencia: '+p.direccion]);
  assert.equal(p.direccion,value.locations[slug].address);assert.equal(result.locations[slug].provenance.numbersOrEntrancesDeclaredEquivalent,false);
});
test('forged geography cannot override any old registry row',async()=>{
  assert.throws(()=>mergeExpansionLocations(originalLocations,{[newSlugs[0]]:{status:'verified'}}),/verified map registry/);
  const result=await bind(fixture(1)),collision={...originalLocations,locations:{...originalLocations.locations,[newSlugs[0]]:{}}};
  assert.throws(()=>mergeExpansionLocations(collision,result.locations),/collision/);
});
test('a station-source hash mismatch preserves valid map points but grants no new Metro match',async()=>{
  const result=await bindExpansionLocations(projects,await parsed(fixture(21)),{networkText:networkText+' ',cryptoImpl:webcrypto});
  assert.equal(result.verifiedLocationCount,21);assert.equal(result.metroAvailable,false);assert.deepEqual(result.metroProjects,{});
  assert.ok(result.projects.filter(isCatalogExpansionProject).every(p=>!metroMatches(p,state({metroNetwork:'current'}))));
  for(let i=0;i<131;i++)assert.equal(result.projects[i]._metro,base[i]._metro);
});
test('new Metro badges and radius use the reviewed station point, never a walking route or future geometry',async()=>{
  const value=fixture(1),row=value.locations[newSlugs[0]],station=network.stations[0];row.lat=station.lat+.0001;row.lng=station.lng;
  const result=await bind(value),p=result.projects.find(p=>p.slug===newSlugs[0]);const s=state({metroStation:station.id,metroDistance:'300'});
  const connection=p._metro.connections.find(c=>c.stationId===station.id);assert.ok(connection);
  assert.equal(connection.geographicM,Math.round(geographicMeters(row,station)));assert.equal(connection.route,null);
  assert.equal(metroMatches(p,s),true);assert.equal(metroMatches(p,{...s,metroDistance:'0'}),false);
  assert.equal(metroMatches(p,{...s,metroMinutes:'5'}),false);assert.equal(metroMatches(p,{...s,metroNetwork:'future'}),false);
  assert.match(metroSummary(p,s).distance,/línea recta/);assert.equal(metroSummary(p,s).stationId,station.id);
  assert.ok(p._metro.connections.every((c,i)=>c.geographicM<=5000&&(i===0||c.geographicM<=1000)));
});
test('map rows keep the exact filtered and ordered subset rather than all 152 registry points',async()=>{
  const result=await bind(fixture(21)),query=state({developers:['GPR'],region:'Los Lagos',sortOrder:'price-asc'});
  const rows=advancedFilterAndSort(result.projects,query),mapped=locateProjects(rows,mergeExpansionLocations(originalLocations,result.locations));
  assert.equal(rows.length,2);assert.deepEqual(mapped.located.map(r=>r.project.slug),rows.map(p=>p.slug));assert.equal(mapped.pending.length,0);
  const values=rows.map(p=>projectOffer(p,query).value);assert.ok(values[0]<=values[1]);
});
test('new slug selection and Metro URL round-trip preserve current filters and cannot enable walking',async()=>{
  const value=fixture(1),row=value.locations[newSlugs[0]],station=network.stations[0];row.lat=station.lat+.0001;row.lng=station.lng;
  const result=await bind(value),options=facetOptions(result.projects,{...facets,metro:network,expansionCount:21});
  const query=state({search:'Alameda 4719',metroNetwork:'current',metroStation:station.id,metroDistance:'300',sortOrder:'price-asc'});
  const restored=readQuery('?'+writeQuery(query,'split'),options);assert.equal(restored.view,'split');assert.equal(restored.state.metroStation,station.id);assert.equal(restored.state.metroMethod,'geographic');
  assert.deepEqual(advancedFilterAndSort(result.projects,restored.state).map(p=>p.slug),advancedFilterAndSort(result.projects,query).map(p=>p.slug));
  assert.equal(advancedFilterAndSort(result.projects,restored.state).length,1);
  assert.equal(validMapState({version:1,lat:row.lat,lng:row.lng,zoom:15,selected:newSlugs[0]}),true);
});
