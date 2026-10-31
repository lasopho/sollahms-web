import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {haversine,segmentDistance,geometryDistance,publicWorks,relationshipsFor,distanceLabel,STATES} from '../assets/js/urban-works-model.mjs';
const json=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url)));
const data={...json('data/urban-development.json'),projects:json('data/proyectos.json'),locations:json('data/project-locations.json')};
test('geographic distances and segment projection have independent numerical controls',()=>{
 assert.equal(haversine({lat:-33,lng:-70},{lat:-33,lng:-70}),0);
 assert.ok(Math.abs(haversine({lat:-33,lng:-70},{lat:-34,lng:-70})-111195.080)<.01);
 assert.equal(haversine({lat:NaN,lng:-70},{lat:-34,lng:-70}),null);
 assert.ok(segmentDistance({lat:-33,lng:-70},{lat:-34,lng:-70},{lat:-32,lng:-70})<.001);
 assert.ok(Math.abs(segmentDistance({lat:-31,lng:-70},{lat:-34,lng:-70},{lat:-32,lng:-70})-111195.080)<.01);
 assert.equal(geometryDistance({lat:-33,lng:-70},null),null);
});
test('every published work carries state, primary evidence, reviewed dates and limitations',()=>{
 assert.equal(new Set(data.works.map(w=>w.id)).size,data.works.length);
 for(const w of publicWorks(data)){
  assert.ok(STATES[w.status]);assert.ok(w.sources.length);assert.ok(w.responsible);assert.ok(w.cautions.length);assert.ok(w.uncertainties.length);
  for(const s of w.sources)assert.ok(/^https:\/\//.test(s.url));
  assert.ok(w.informationDate<=data.cutoff);assert.ok(w.reviewedOn<=data.cutoff);
  if(w.geometry){assert.ok(w.geometrySource.url);assert.ok(w.geometryLabel);}
 }
 assert.equal(publicWorks({...data,works:[{...data.works[0],publish:false}]}).length,0);
 assert.equal(publicWorks({...data,works:[{...data.works[0],informationDate:'2027-01-01'}]}).length,0);
 assert.equal(publicWorks({...data,works:[{...data.works[0],sources:[{url:'javascript:alert(1)'}]}]}).length,0);
});
test('relations are distinct, independently reviewed, active and calculated from retained locations',()=>{
 const seen=new Set();let count=0;
 for(const w of publicWorks(data))for(const r of relationshipsFor(data,w.id)){
  const key=w.id+':'+r.projectSlug;assert.ok(!seen.has(key));seen.add(key);count++;
  assert.ok(data.projects.some(p=>p.slug===r.projectSlug));assert.ok(r.distanceM>=0);assert.match(distanceLabel(r),/en línea recta/);
  assert.ok(r.reviewed);assert.ok(r.rationale);assert.ok(r.cautions.length);
 }
 assert.equal(count,data.relationships.length);assert.equal(count,11);
});
test('changed project address/coordinate and unreviewed relations fail closed',()=>{
 const w='tren-puerto-varas',copy=structuredClone(data);
 copy.locations.locations['edificio-nordico'].lat+=.001;
 assert.equal(relationshipsFor(copy,w).some(r=>r.projectSlug==='edificio-nordico'),false);
 const changed=structuredClone(data);changed.projects.find(p=>p.slug==='edificio-nordico').direccion='New address';
 assert.equal(relationshipsFor(changed,w).some(r=>r.projectSlug==='edificio-nordico'),false);
 const pending=structuredClone(data);pending.relationships.forEach(r=>r.reviewed=false);
 assert.equal(relationshipsFor(pending,w).length,0);
});
test('track geometry and future station centers cannot create rail proximity',()=>{
 const copy=structuredClone(data);copy.works.find(w=>w.id==='tren-puerto-varas').geometryRole='track';
 assert.equal(relationshipsFor(copy,'tren-puerto-varas').length,0);
 for(const id of ['metro-linea-7','metro-linea-8','linea-9-santa-rosa-alameda'])assert.equal(relationshipsFor(data,id).length,0);
});
