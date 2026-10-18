import test from 'node:test';
import assert from 'node:assert/strict';
import { projectP1CommercialFile, projectP1CommercialRows } from './p1-commercial-scope.mjs';
import { restoreP1IdempotencyFile } from './p1-idempotency-preservation.mjs';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { assertLeonMainScope, assertLeonCombinedScope, readLeonCombinedBaseline, projectLeonFile, restoreLeonContexts, verifyLeonAssets, readMainBaseline, restoreLeonRows, LEON_SLUGS, LEON_RETIRED_SLUGS } from '../scripts/leon-main-publication.mjs';
import { assertBrochureCatalogue } from '../scripts/brochure-publication.mjs';
import { projects } from '../lib/project-context.mjs';
const json=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const review=json('data/brochures-leon.json'),register=json('data/leon-plan-surfaces.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('the immutable 141-project León main guard and the separately approved 134-project composition both remain exact',()=>{
 const b=readMainBaseline(), fixture=mkdtempSync(join(tmpdir(),'leon-main-history-'));
 try {
  const paths=new Set(['data/leon-main-baseline.json','data/brochures-leon.json','data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json',...b.otherHtml.map(row=>row.path),...b.existingAssets.map(row=>row.path),...Object.keys(b.approvedFiles)]);
  for(const path of paths){const target=join(fixture,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,execFileSync('git',['show','f66fbec15f1f4b30be3a70e94644a29212402a63:'+path],{maxBuffer:16*1024*1024}));}
  const result=assertLeonMainScope(fixture);assert.equal(result.otherProjects,136);assert.equal(result.otherHtml,143);assert.equal(result.existingAssets,919);
 } finally {rmSync(fixture,{recursive:true,force:true});}
 const combined=readLeonCombinedBaseline();
 const tracked=new Set(execFileSync('git',['ls-files','-z']).toString().split('\0'));
 for(const item of combined.otherHtml){const bytes=projectP1CommercialFile(item.path,restoreP1IdempotencyFile(item.path,readFileSync(new URL('../'+item.path,import.meta.url))));assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256,item.path);}
 for(const item of combined.existingAssets.filter(item=>tracked.has(item.path))){const bytes=projectP1CommercialFile(item.path,restoreP1IdempotencyFile(item.path,readFileSync(new URL('../'+item.path,import.meta.url))));assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256,item.path);}
 const rows=json('data/proyectos.json');assert.equal(rows.length,134);assert.equal(Object.keys(projects).length,134);assertBrochureCatalogue(rows);
 assert.equal(rows.filter(row=>row.inmobiliaria==='Ecasa').length,15);assert.equal(rows.filter(row=>row.inmobiliaria==='Leben').length,14);assert.equal(rows.filter(row=>row.inmobiliaria==='Sento').length,7);
 const prior=JSON.parse(execFileSync('git',['show','73a16a34846aebc9f551f63241d8f2abeef5ca15:lib/project-context.mjs'],{maxBuffer:16*1024*1024}).toString().match(/export const projects = Object\.freeze\(([\s\S]*?)\);/)[1]);
 for(const [slug,value] of Object.entries(prior))if(![...LEON_SLUGS,...LEON_RETIRED_SLUGS].includes(slug))assert.deepEqual(projects[slug],value);
 for(const row of review.catalogue)assert.deepEqual(projects[row.slug],{name:row.nombre,url:row.detalleUrl});
 for(const slug of LEON_RETIRED_SLUGS){assert.equal(projects[slug],undefined);assert.equal(existsSync(new URL('../'+slug+'.html',import.meta.url)),false);}
});
test('historical projection rejects wrong León data and retains other developer checks',()=>{
 const rows=json('data/proyectos.json'),b=readMainBaseline(),old=restoreLeonRows(rows);assert.equal(old.length,137);
 assert.deepEqual(old.filter(p=>p.inmobiliaria==='León'),b.originalRows['data/proyectos.json']);
 const altered=structuredClone(rows);altered.find(p=>p.slug==='bcome').direccion='Incorrect';assert.throws(()=>assertBrochureCatalogue(altered));
 const other=structuredClone(rows);other.find(p=>p.inmobiliaria!=='León').precioDesdeUF=999999;assert.throws(()=>assertBrochureCatalogue(other));
});
test('all 310 original media and 36 individually bound plans retain their verified payloads',()=>{
 assertLeonCombinedScope();
 const assets=verifyLeonAssets(review);assert.equal(assets.length,310);assert.equal(register.plans.length,36);assert.equal(register.summary.completeSurfaceSets,30);assert.equal(register.summary.pendingSurfaceSets,6);
 assert.equal(sha(readFileSync(new URL('../data/brochures-leon.json',import.meta.url))),register.documentManifestSha256);
 for(const p of register.plans){assert.equal(sha(readFileSync(new URL('../'+p.planPath.slice(1),import.meta.url))),p.planSha256);assert.ok(p.areas.every(a=>a.derived===false));}
 for(const project of review.projects){const html=readFileSync(new URL('../'+project.slug+'.html',import.meta.url),'utf8');assert.ok(!html.includes('Documentación del proyecto'));assert.ok(!html.includes('Ver material de referencia original'));assert.ok(!html.includes('Ver proyecto en Inmobiliaria León'));for(const p of register.plans.filter(p=>p.projectSlug===project.slug))assert.ok(html.includes('data-plan-id="'+p.id+'"'));}
});
test('main and integration automatic deploy gates remain disabled',()=>{
 const config=json('vercel.json');assert.equal(config.git.deploymentEnabled.main,false);assert.equal(config.git.deploymentEnabled['codex/leon-main-integration'],false);assert.equal(config.git.deploymentEnabled['codex/leon-cartera-preview'],false);
});

test('León predecessor projection preserves all 129 foreign current objects and is idempotent without restoring public retirements',()=>{
 for(const file of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json']){
  const current=projectP1CommercialRows(json(file),file),old=restoreLeonRows(current,file);
  assert.equal(current.length,134);assert.equal(old.length,137);
  const foreign=rows=>rows.filter(row=>![...LEON_SLUGS,...LEON_RETIRED_SLUGS].includes(row.slug));
  assert.equal(foreign(current).length,129);assert.deepEqual(foreign(old),foreign(current));
  assert.deepEqual(restoreLeonRows(old,file),old);
 }
 const restored=restoreLeonContexts(projects);assert.equal(Object.keys(restored).length,137);
 for(const slug of LEON_RETIRED_SLUGS){assert.ok(restored[slug]);assert.equal(projects[slug],undefined);assert.equal(existsSync(new URL('../'+slug+'.html',import.meta.url)),false);}
});
test('strict León history rejects changed successor payloads, borrowed HTML and enabled gates instead of returning a foreign snapshot',()=>{
 const rows=json('data/proyectos.json');
 const changed=structuredClone(rows);changed.find(row=>row.slug==='bcome').precioDesdeUF=1;assert.throws(()=>restoreLeonRows(changed));
 const retired=structuredClone(rows);retired.push(readMainBaseline().originalRows['data/proyectos.json'].find(row=>row.slug==='box-santiago'));assert.throws(()=>restoreLeonRows(retired));
 for(const slug of LEON_SLUGS){const text=readFileSync(new URL('../'+slug+'.html',import.meta.url));assert.throws(()=>projectLeonFile(slug+'.html',Buffer.concat([text,Buffer.from('\n')])));}
 const config=json('vercel.json');config.git.deploymentEnabled['codex/leon-main-integration']=true;assert.throws(()=>projectLeonFile('vercel.json',Buffer.from(JSON.stringify(config))));
});
