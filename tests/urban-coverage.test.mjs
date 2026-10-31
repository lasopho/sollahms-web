import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {publicWorks,relationshipsFor} from '../assets/js/urban-works-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const projects=read('data/proyectos.json');
const data={...read('data/urban-development.json'),projects,locations:read('data/project-locations.json')};
const coverage=read('docs/entorno-20261031/catalog-coverage.json');
test('each active project has exactly one completed documentary review',()=>{
 const slugs=coverage.projects.map(r=>r.slug);
 assert.equal(new Set(slugs).size,slugs.length);
 assert.deepEqual([...slugs].sort(),projects.map(p=>p.slug).sort());
 assert.equal(coverage.reviewedProjects,projects.length);
 assert.equal(data.research.reviewedProjects,projects.length);
 for(const r of coverage.projects){
  assert.ok(['reviewed_verified','reviewed_no_verified','location_blocked'].includes(r.outcome));
  assert.ok(r.queries.length);assert.ok(r.sources.length);assert.ok(r.rationale);assert.ok(r.locationReview);
  assert.equal(r.reviewedOn,data.cutoff);
  for(const source of r.sources)assert.match(source.url,/^https:\/\//);
 }
});
test('review report and runtime publish exactly the same project relationships',()=>{
 const actual=new Map(projects.map(p=>[p.slug,[]]));
 for(const work of publicWorks(data))for(const r of relationshipsFor(data,work.id))actual.get(r.projectSlug).push(work.id);
 for(const r of coverage.projects){
  assert.deepEqual([...r.publishedWorkIds].sort(),actual.get(r.slug).sort());
  if(r.outcome==='location_blocked')assert.equal(actual.get(r.slug).length,0);
  if(r.outcome==='reviewed_verified')assert.ok(actual.get(r.slug).length);
 }
 assert.equal(data.research.projectsWithRelationships,[...actual.values()].filter(v=>v.length).length);
});
