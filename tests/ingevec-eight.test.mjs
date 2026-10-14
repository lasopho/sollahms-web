import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ECASA_NEW_SLUGS, ECASA_SLUGS, restoreEcasaData, assertCommercialBytes, restoreReviewedScope, INGEVEC_NEW_SLUGS, readCommercialFile } from './commercial-html.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASE = 'b64911588e2fdf52f32d5f772b53735936fbd423';
const read = readCommercialFile;
const old = path => execFileSync('git',['show',`${BASE}:${path}`],{cwd:ROOT});
const manifest = JSON.parse(read('data/brochures-ingevec.json'));
const slugs = ['coronel-godoy','diagonal-paraguay','el-aromo','los-lilenes','matta-016','nueva-esmeralda','vicuna-mackenna-7589'];
const records = slugs.map(slug => manifest.projects.find(p => p.slug===slug));
const html = slug => read(slug+'.html').toString();
const preview = page => page.replace(/<!--INGEVEC_PUBLIC_START-->[\s\S]*?<!--INGEVEC_PUBLIC_END-->/g,'');
const fallback = page => page.replace(/<!--INGEVEC_PREVIEW_START-->[\s\S]*?<!--INGEVEC_PREVIEW_END-->/g,'').replace(/<!--INGEVEC_PUBLIC_START-->([\s\S]*?)<!--INGEVEC_PUBLIC_END-->/g,'$1');
const nums = [
 [[15,29.04,3.65,32.69,0,1],[16,32.73,3.04,35.77,1,1],[17,42.55,4.76,47.31,2,1],[18,49.95,6.09,56.04,2,2]],
 [[9,33.29,2.82,36.11,1,1],[10,47.97,2.64,50.61,2,2],[11,49.75,5.62,55.37,2,2]],
 [[13,31.47,4.27,35.74,1,1],[14,39.13,4.12,43.25,2,1],[15,31.66,4.22,35.88,1,1]],
 [[15,32.49,3.04,35.53,1,1],[16,42.58,4.66,47.24,2,1],[17,47.20,5.42,52.62,2,2]],
 [[17,20.25,3.65,23.90,0,1],[18,33.03,2.84,35.87,1,1],[19,43.14,2.67,45.81,2,1],[20,46.25,5.58,51.83,2,2]],
 [[16,23.20,2.87,26.07,0,1],[17,30.66,3.13,33.79,1,1],[18,49.14,3.41,52.55,2,1],[19,50.35,3.47,53.82,2,2]],
 [[9,33.12,2.99,36.11,1,1],[10,47.42,5.60,53.02,2,2],[11,49.04,5.97,55.01,2,2],[9,33.21,3.00,36.21,1,1],[10,47.53,5.56,53.09,2,2],[11,49.04,5.97,55.01,2,2]],
];
test('eight originals enrich exactly seven of the 136 fichas while non-Ecasa financial data remain exact',()=>{
 const catalogue=JSON.parse(read('data/proyectos.json'));assert.equal(catalogue.length,137);
 for(const path of ['data/proyectos.json','data/fichas-proyectos.json','data/hipotecario.json','data/brochures-aj-urbana.json','proyectos.html','comparador-hipotecario.html','contacto.html','agenda-asesoria.html','privacidad.html','sitemap.xml','vercel.json']) assertCommercialBytes(path,read(path),old(path));
 for(const p of catalogue) if(p.slug !== 'edificio-nordico' && !slugs.includes(p.slug) && !INGEVEC_NEW_SLUGS.has(p.slug) && !ECASA_NEW_SLUGS.has(p.slug)) assertCommercialBytes(p.slug+'.html',read(p.slug+'.html'),old(p.slug+'.html'));
 const previous=JSON.parse(old('data/brochures-ingevec.json'));
 assert.deepEqual(manifest.projects.slice(0,3),previous.projects);
 const restored=restoreReviewedScope(manifest,previous,'data/brochures-ingevec.json');
 for(const [key,value] of Object.entries(previous)) if(key!=='projects') assert.deepEqual(restored[key],value,key);
 assert.deepEqual(manifest.batchAddition.projects,slugs);assert.equal(manifest.batchAddition.originalPdfsReviewed,8);assert.equal(manifest.batchAddition.candidateImagesReviewed,48);
 assert.equal(manifest.batchAddition.modelsAndPlansReviewed,27);
 for(const r of records) assert.equal(fallback(html(r.slug)),old(r.slug+'.html').toString(),r.slug);
});
test('all 27 distributions reproduce independent printed surfaces and visible room counts without stock assumptions',()=>{
 for(const [index,r] of records.entries()){
  assert.deepEqual(r.models.map(m=>[m.pagina_brochure,m.superficie_util_m2,m.terraza_m2,m.superficie_total_m2,m.dormitorios,m.banos]),nums[index],r.slug);
  const docs=r.documents||[r.document];
  for(const m of r.models){assert.equal(m.plan.sourceSha256,m.sourceSha256);assert.ok(docs.some(d=>d.sha256===m.sourceSha256));assert.equal(m.plan.sourcePage,m.pagina_brochure);assert.equal(m.orientacion,null);assert.equal(m.pisos,null);assert.equal(m.approximate,true);assert.equal(m.visuallyVerified,true);assert.equal(Math.round((m.superficie_util_m2+m.terraza_m2)*100),Math.round(m.superficie_total_m2*100));
   for(const key of ['precioDesdeUF','precioUF','availability','stock','entrega','fechaEntrega']) assert.equal(key in m,false,`${r.slug}/${m.modelo} ${key}`);
  }
 }
});
test('Vicuña Mackenna keeps six unique plans grouped by stage with stage-specific source documents',()=>{
 const r=records.at(-1);assert.equal(r.documents.length,2);assert.equal(r.models.length,6);
 for(const [index,stage] of ['Etapa 1','Etapa 2'].entries()){
  const source=r.documents[index];assert.equal(source.etapa,stage);
  const models=r.models.filter(m=>m.etapa===stage);assert.equal(models.length,3);assert.ok(models.every(m=>m.sourceSha256===source.sha256));
 }
 assert.equal(new Set(r.models.map(m=>m.modelo)).size,6);assert.equal(new Set(r.models.map(m=>m.plan.localPath)).size,6);
 assert.equal(r.stageCommercialVerification.status,'pending_stage_availability');
 const page=preview(html(r.slug));assert.equal((page.match(/class="aj-stage"/g)||[]).length,2);assert.match(page,/data-stage="Etapa 1"/);assert.match(page,/data-stage="Etapa 2"/);
 for(const m of r.models) assert.ok(page.includes(`id="modelo-${m.modelo}"`));
});
test('reviewed images include seven distinct catalogue/hero covers without duplicate gallery renders or confidential Matta attribution',()=>{
 assert.deepEqual(records.map(r=>r.images.length),[6,4,4,6,11,7,5]);
 for(const r of records){
  const hero=r.images.find(i=>i.localPath===r.hero);assert.ok(hero);assert.equal(hero.gallery,false);assert.equal(r.catalogueCover.localPath,r.hero);
  assert.equal(new Set(r.images.map(i=>i.originalSha256)).size,r.images.length,r.slug);
  const page=preview(html(r.slug));const gallery=page.match(/<section id="galeria"[^>]*>([\s\S]*?)<\/section>/)[1];assert.ok(!gallery.includes(`src="${r.hero}"`),r.slug);
  for(const asset of [...r.images,...r.models.map(m=>m.plan)]) assert.equal(createHash('sha256').update(read(asset.localPath.slice(1))).digest('hex'),asset.sha256,asset.localPath);
  for(const i of r.images){assert.equal(i.privacySafe,true);assert.equal(i.visuallyVerified,true);assert.ok(page.includes(`src="${i.localPath}"`));}
 }
 const matta=records[4];assert.ok(matta.images.every(i=>i.sourcePage!==5));assert.doesNotMatch(preview(html('matta-016')),/Centenario/i);
});
test('seven enriched fichas retain SEO, contextual financial/contact actions, maps and tours without visible audit labels',()=>{
 for(const r of records){
  const page=preview(html(r.slug)),before=old(r.slug+'.html').toString();
  const scripts=x=>[...x.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);assert.deepEqual(scripts(page),scripts(before));
  const metadata=x=>[...x.matchAll(/<(?:meta|title|link)\b[^>]*(?:canonical|description|og:|twitter:)[^>]*>/g)].map(m=>m[0]);assert.deepEqual(metadata(page),metadata(before));
  const embeds=x=>[...x.matchAll(/(?:data-embed-src|src)="([^"]*(?:google\.com\/maps|matterport|kuula|360)[^"]*)"/g)].map(m=>m[0]);assert.deepEqual(embeds(page),embeds(before));
  for(const route of ['contacto','agenda-asesoria','comparador-hipotecario']) assert.ok(page.includes(`/${route}.html?proyecto=${r.slug}`));
  const text=page.replace(/<!--[\s\S]*?-->|<head\b[^>]*>[\s\S]*?<\/head>|<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>/g,' ');
  assert.doesNotMatch(text,/Yapo|IRIS|SHA-?256|auditor[ií]a|procedencia|fecha de verificaci[oó]n|fuentes oficiales|p[aá]g\./i);
  assert.equal((page.match(/class="aj-model"/g)||[]).length,r.models.length);assert.match(text,/referencial|referenciales/);
 }
});
