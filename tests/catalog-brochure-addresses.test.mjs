import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {locateProjects,locationGroups} from '../assets/js/catalog-map-model.mjs';
import {beforeOfficialAddressReview} from './helpers/official-address-baseline.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const projects=read('data/proyectos.json'),registry=read('data/project-locations.json'),research=read('data/fichas-proyectos.json');
const changed=['condominio-uruguay','jardines-de-ramon-cruz','mirador-la-florida'];
test('documented addresses reach catalogue and fiche without changing commercial records',()=>{
 const before=JSON.parse(execFileSync('git',['show','895205da75b89908b8fc2c5033ff4852f6018ca6:data/proyectos.json'],{encoding:'utf8'}));
 assert.equal(projects.length,132);
 for(const p of beforeOfficialAddressReview(projects)){const old=before.find(x=>x.slug===p.slug);assert.ok(old);
  if(!changed.includes(p.slug)){assert.deepEqual(p,old);continue;}
  const r=research.find(x=>x.slug===p.slug);assert.equal(projects.find(x=>x.slug===p.slug).direccion,r.updates.direccion);assert.ok(r.verifiedFields.includes('direccion'));
  const html=fs.readFileSync(new URL('../'+p.slug+'.html',import.meta.url),'utf8');assert.ok(html.includes('<p>'+r.updates.direccion+', '+p.comuna+', '+p.region+'</p>'));
  const copy=structuredClone(p);delete copy.direccion;delete copy.mapQuery;copy.verificacion=old.verificacion;assert.deepEqual(copy,old);
 }
});
test('Llacolén stages share the verified site and retain two selectable records',()=>{
 const {located,pending}=locateProjects(projects,registry);assert.ok(located.length>=64);assert.equal(located.length+pending.length,132);
 const group=locationGroups(located.filter(x=>x.project.slug.startsWith('vista-llacolen-')));assert.equal(group.length,1);assert.equal(group[0].rows.length,2);
 for(const row of group[0].rows)assert.equal(row.location.address,'Las Heras Poniente 77');
});
test('owner-confirmed address and reviewed estimates retain provenance',()=>{
 assert.equal(registry.locations['mirador-la-florida'].ownerConfirmed,true);
 const located=registry.locations['jardines-de-ramon-cruz'];assert.equal(located.precision,'address_estimate');assert.equal(located.address,'Ramón Cruz Montt 3291');assert.match(located.corroboration,/sin precisión métrica garantizada/);
 assert.equal(registry.addressNotes['mirador-la-florida'],undefined);
});
