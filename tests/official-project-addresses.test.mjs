import {beforeFinalLocationHtml} from './helpers/final-location-baseline.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {beforeOfficialAddressReview} from './helpers/official-address-baseline.mjs';
const base='15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
const records=read('docs/official-project-addresses-20261026/reviewed-addresses.json');
const projects=read('data/proyectos.json'),registry=read('data/project-locations.json');
test('all 132 commercial records survive the official address review',()=>{
 assert.deepEqual(beforeOfficialAddressReview(projects),JSON.parse(old('data/proyectos.json')));
 assert.equal(projects.filter(p=>p.addressVerification).length,6);
});
test('four documented points extend 126 existing points without moving any',()=>{
 const prior=JSON.parse(old('data/project-locations.json')).locations;
 assert.equal(Object.keys(prior).length,126);assert.equal(Object.keys(registry.locations).length,132);
 for(const [slug,point]of Object.entries(prior))assert.deepEqual(registry.locations[slug],point);
 for(const r of records){const point=registry.locations[r.slug];if(r.point){
  assert.equal(point.lat,r.point.lat);assert.equal(point.lng,r.point.lng);assert.equal(point.addressSource,r.source);
  if(point.precision==='intersection_reference')assert.match(point.publicNote,/esquina/);
 }else assert.equal(point.status,'verified');}
});
test('six fiches gain official attribution while preserving all other HTML',()=>{
 for(const r of records){
  const page=beforeFinalLocationHtml(fs.readFileSync(r.slug+'.html','utf8'),r.slug);
  assert.equal((page.match(/data-address-source="official"/g)||[]).length,1);
  assert.ok(page.includes(r.source.replaceAll('&','&amp;')));
  let clean=page.replace(/<p class="price-note" data-address-source="official">[\s\S]*?<\/p>/,'');
  if(r.slug==='edificio-ecuador')clean=clean.replaceAll('Coronel Godoy 0157, esquina Av. Ecuador','Coronel Godoy 0157').replaceAll('Coronel+Godoy+0157%2C+esquina+Av.+Ecuador','Coronel+Godoy+0157');
  assert.equal(clean,old(r.slug+'.html'),r.slug);
 }
});
test('attribution helper is idempotent and leaves unrelated projects untouched',()=>{
 execFileSync('python',['-c',`import sys,json;sys.path.insert(0,'scripts');from project_location import apply_project_location
from pathlib import Path
for p in json.loads(Path('data/proyectos.json').read_text()):
 page=Path(p['slug']+'.html').read_text()
 assert apply_project_location(page,p)==page,p['slug']`]);
});
