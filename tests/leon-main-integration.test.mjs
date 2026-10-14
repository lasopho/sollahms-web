import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assertLeonMainScope, verifyLeonAssets, readMainBaseline, restoreLeonRows, LEON_SLUGS, LEON_RETIRED_SLUGS } from '../scripts/leon-main-publication.mjs';
import { assertBrochureCatalogue } from '../scripts/brochure-publication.mjs';
import { projects } from '../lib/project-context.mjs';
const json=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const review=json('data/brochures-leon.json'),register=json('data/leon-plan-surfaces.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('León integrates five fiches while all 136 other main records and 143 other pages remain exact',()=>{
 const result=assertLeonMainScope();assert.equal(result.otherProjects,136);assert.equal(result.otherHtml,143);assert.equal(result.existingAssets,641);
 const rows=json('data/proyectos.json');assert.equal(rows.length,141);assert.equal(Object.keys(projects).length,141);assertBrochureCatalogue(rows);
 const b=readMainBaseline();
 for(const [slug,value] of Object.entries(b.originalContexts))if(![...LEON_SLUGS,...LEON_RETIRED_SLUGS].includes(slug))assert.deepEqual(projects[slug],value);
 for(const row of review.catalogue)assert.deepEqual(projects[row.slug],{name:row.nombre,url:row.detalleUrl});
 for(const slug of LEON_RETIRED_SLUGS){assert.equal(projects[slug],undefined);assert.equal(existsSync(new URL('../'+slug+'.html',import.meta.url)),false);}
});
test('historical projection rejects wrong León data and retains other developer checks',()=>{
 const rows=json('data/proyectos.json'),b=readMainBaseline(),old=restoreLeonRows(rows);assert.equal(old.length,144);
 assert.deepEqual(old.filter(p=>p.inmobiliaria==='León'),b.originalRows['data/proyectos.json']);
 const altered=structuredClone(rows);altered.find(p=>p.slug==='bcome').direccion='Incorrect';assert.throws(()=>assertBrochureCatalogue(altered));
 const other=structuredClone(rows);other.find(p=>p.inmobiliaria!=='León').precioDesdeUF=999999;assert.throws(()=>assertBrochureCatalogue(other));
});
test('all 310 original media and 36 individually bound plans retain their verified payloads',()=>{
 const assets=verifyLeonAssets(review);assert.equal(assets.length,310);assert.equal(register.plans.length,36);assert.equal(register.summary.completeSurfaceSets,30);assert.equal(register.summary.pendingSurfaceSets,6);
 assert.equal(sha(readFileSync(new URL('../data/brochures-leon.json',import.meta.url))),register.documentManifestSha256);
 for(const p of register.plans){assert.equal(sha(readFileSync(new URL('../'+p.planPath.slice(1),import.meta.url))),p.planSha256);assert.ok(p.areas.every(a=>a.derived===false));}
 for(const project of review.projects){const html=readFileSync(new URL('../'+project.slug+'.html',import.meta.url),'utf8');assert.ok(!html.includes('Documentación del proyecto'));assert.ok(!html.includes('Ver material de referencia original'));assert.ok(!html.includes('Ver proyecto en Inmobiliaria León'));for(const p of register.plans.filter(p=>p.projectSlug===project.slug))assert.ok(html.includes('data-plan-id="'+p.id+'"'));}
});
test('main and integration automatic deploy gates remain disabled',()=>{
 const config=json('vercel.json');assert.equal(config.git.deploymentEnabled.main,false);assert.equal(config.git.deploymentEnabled['codex/leon-main-integration'],false);assert.equal(config.git.deploymentEnabled['codex/leon-cartera-preview'],false);
});
