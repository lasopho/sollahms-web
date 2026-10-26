import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {locateProjects,locationGroups} from '../assets/js/catalog-map-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const projects=read('data/proyectos.json'),registry=read('data/project-locations.json');
const base='e9e533071effc5da44112e3fda9ec34b276dc9bd';
test('all commercial records and previously published points are preserved exactly',()=>{
 assert.deepEqual(projects,JSON.parse(execFileSync('git',['show',base+':data/proyectos.json'],{encoding:'utf8'})));
 const old=JSON.parse(execFileSync('git',['show',base+':data/project-locations.json'],{encoding:'utf8'}));
 for(const [slug,point] of Object.entries(old.locations))assert.deepEqual(registry.locations[slug],point,slug);
});
test('every new marker has reviewed provenance and an explicit reference precision',()=>{
 const accepted=read('docs/catalog-address-pins-20261026/accepted-locations.json');
 const {located,pending}=locateProjects(projects,registry);
 assert.equal(located.length,64+Object.keys(accepted).length);assert.equal(located.length+pending.length,132);
 for(const [slug,entry] of Object.entries(accepted)){
  assert.deepEqual(registry.locations[slug],entry);assert.ok(entry.source.startsWith('https://'));
  assert.ok(['address_estimate','building_center','project_reference'].includes(entry.precision));assert.ok(entry.corroboration.length>50);
 }
});
test('shared complexes expose each stage without shifting their geographic points',()=>{
 for(const slugs of [['plaza-cervantes','plaza-cervantes-b'],['mapocho-3521','mapocho-3521-edificio-a'],['froilan-roa-5731-torre-norte','froilan-roa-5731-torre-sur']]){
  const groups=locationGroups(locateProjects(projects.filter(p=>slugs.includes(p.slug)),registry).located);
  assert.equal(groups.length,1);assert.equal(groups[0].rows.length,2);
 }
});
test('conflicting homonyms and camera centers are not used as project locations',()=>{
 assert.equal(registry.locations['carmen-marin'].lat,-33.44773);
 assert.equal(registry.locations['matta-016'].commune,'Santiago');assert.ok(registry.locations['matta-016'].lat < -33.45);
 assert.equal(registry.locations['centenario-1'].source,'https://www.openstreetmap.org/way/1154369481');
 assert.notEqual(registry.locations.bcome.lng,-73.0516714);
 assert.equal(registry.locations['mirador-la-florida'],undefined);
});
