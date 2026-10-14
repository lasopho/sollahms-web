import { assertPreservedSource, originalLebenHtml } from './leben-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, cpSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeFicheCopy } from '../scripts/public-fiche-copy.mjs';
import { validateEcasaImageQuality, selectEcasaPublishedAssets, transformEcasaImageQuality,
  applyEcasaCatalogueImageQuality, ecasaExcludedImagePaths } from '../scripts/ecasa-image-quality.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASELINE='2d34997f8fd82b775c0697b20493674773e7fdc2';
const read=path=>readFileSync(resolve(ROOT,path));
const json=path=>JSON.parse(read(path));
const original=path=>execFileSync('git',['show',BASELINE+':'+path],{cwd:ROOT,maxBuffer:8*1024*1024});
const hash=value=>createHash('sha256').update(value).digest('hex');
const review=json('data/brochures-ecasa.json'),research=json('data/fichas-proyectos.json'),catalogue=json('data/proyectos.json');
const policy=json('data/ecasa-image-quality.json'),official=json('data/fuentes-imagenes.json');
const validated=validateEcasaImageQuality(review,research,catalogue,policy,official);
const EXCLUDED=[
  '/assets/propiedades/ecasa-preview/enlace-mackenna/imagen-01-p01.webp',
  '/assets/propiedades/ecasa-preview/ferroparque/imagen-04-p01.webp',
  '/assets/propiedades/ecasa-preview/terratolten-1/imagen-03-p01.webp',
  '/assets/propiedades/ecasa-preview/terratolten-1/imagen-04-p01.webp',
];
const IMPROVED_COVERS={
  'lomas-de-puyai':'/assets/propiedades/catalogo/631c41f5f80e53b3e145ecd4.webp',
  lamara:'/assets/propiedades/ecasa-preview/lamara/imagen-02-p01.webp',
  ferroparque:'/assets/propiedades/ecasa-preview/ferroparque/imagen-02-p01.webp',
  terratolten:'/assets/propiedades/catalogo/d0f387ee40a79c8749e79cfa.webp',
  'nucleo-costanera':'/assets/propiedades/ecasa-preview/nucleo-costanera/imagen-02-p01.webp',
  'alto-san-joaquin':'/assets/propiedades/ecasa-preview/alto-san-joaquin/imagen-03-p01.webp',
  'enlace-mackenna':'/assets/propiedades/catalogo/c009ee5d70d184dc5b01cfc5.webp',
};
const projected=(slug,preview=true)=>normalizeFicheCopy(read(slug+'.html').toString()
  .replace(new RegExp('<!--ECASA_'+(preview?'PUBLIC':'PREVIEW')+'_START-->[\\s\\S]*?<!--ECASA_'+(preview?'PUBLIC':'PREVIEW')+'_END-->','g'),'')
  .replace(/<!--ECASA_(?:PUBLIC|PREVIEW)_(?:START|END)-->/g,''));
const protectedParts=html=>[
  ...html.matchAll(/<details class="aj-model"[^>]*>[\s\S]*?<\/details>/g),
  ...html.matchAll(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/g),
  ...html.matchAll(/<dl\b[^>]*>[\s\S]*?<\/dl>/g),
  ...html.matchAll(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g),
].map(match=>match[0]);
const visible=html=>html.replace(/<head\b[^>]*>[\s\S]*?<\/head>|<script\b[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('quality review preserves 118 source photographs and explicitly excludes only four reviewed documentary images',()=>{
  const pinned=json('tests/ecasa-reviewed-output.json');
  assert.equal(hash(read('scripts/package-vercel.mjs')),pinned.packageSha256);
  assert.equal(hash(read('scripts/ecasa-image-quality.mjs')),pinned.imageQualityModuleSha256);
  assert.equal(hash(read('data/ecasa-image-quality.json')),pinned.imageQualityPolicySha256);
  assert.equal(policy.baselineCommit,BASELINE);assert.equal(policy.projects.length,15);
  assert.deepEqual(validated.summary,{reviewedImages:118,officialImages:62,documentaryImages:56,plansPreserved:74,
    keptImages:114,excludedImages:4,coverOnlyImages:0});
  assert.deepEqual([...ecasaExcludedImagePaths(validated)].sort(),EXCLUDED.toSorted());
  assert.ok(policy.projects.flatMap(project=>project.images).filter(image=>image.kind==='official').every(image=>image.decision==='keep'));
  for(const [slug,path] of Object.entries(IMPROVED_COVERS)) {
    const project=policy.projects.find(project=>project.slug===slug);
    assert.equal(project.covers.preview.hero,path);assert.equal(project.covers.preview.catalogue,path);
  }
});

test('source catalogue, 22 stage snapshots, documentary manifests and all 136 fiche files remain exact',()=>{
  for(const file of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json','data/fuentes-imagenes.json',
    'data/brochures-ecasa.json','data/brochures-aj-urbana.json','data/brochures-ingevec.json','sitemap.xml','vercel.json'])
    assertPreservedSource(file,read(file),original(file));
  for(const project of catalogue.filter(project => project.slug !== 'edificio-nordico')) assertPreservedSource(project.slug+'.html', read(project.slug+'.html'), original(project.slug+'.html'));
  const stages=research.flatMap(record=>record.etapasComerciales??[]);
  assert.equal(stages.length,22);assert.equal(catalogue.filter(project=>project.inmobiliaria!=='Ecasa').length,122);
});

test('published selection removes four photographs while preserving all 74 original models and their stage-bound plans',()=>{
  const assets=selectEcasaPublishedAssets(review,validated);
  assert.equal(assets.length,126);assert.equal(assets.filter(asset=>asset.kind==='plan').length,74);
  assert.equal(assets.filter(asset=>asset.kind!=='plan').length,52);
  assert.equal(review.projects.reduce((sum,record)=>sum+record.images.length+record.models.length,0),130);
  assert.deepEqual(assets.filter(asset=>asset.kind==='plan'),review.projects.flatMap(record=>record.models.map(model=>model.plan)));
  for(const path of EXCLUDED)assert.ok(!assets.some(asset=>asset.localPath===path));
  assert.deepEqual(selectEcasaPublishedAssets(review,validated,{preview:false}),[]);
});

test('quality filtering is idempotent in both profiles and preserves every plan, map, specification and runtime fragment',()=>{
  let profiles=0,plans=0;
  for(const record of review.projects)for(const preview of [true,false]) {
    const before=projected(record.slug,preview),after=transformEcasaImageQuality(before,record.slug,validated,{preview});
    assert.deepEqual(protectedParts(after),protectedParts(before),record.slug);
    assert.equal(transformEcasaImageQuality(after,record.slug,validated,{preview}),after,record.slug+': idempotency');
    for(const path of EXCLUDED)assert.ok(!after.includes(path),record.slug+': excluded path remains');
    for(const model of record.models)if(preview){assert.ok(after.includes(model.plan.localPath));plans++;}
    const cover=policy.projects.find(project=>project.slug===record.slug).covers[preview?'preview':'public'].hero;
    assert.ok(after.includes('src="'+cover+'"'),record.slug+': approved hero');
    assert.ok(after.includes('content="https://sollahms.cl'+cover+'"'),record.slug+': social image');
    const ld=JSON.parse(after.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld.image,'https://sollahms.cl'+cover);profiles++;
  }
  assert.equal(profiles,30);assert.equal(plans,74);
});

test('only Ecasa display image fields change while financial values, source references and 121 other projects stay exact',()=>{
  const source=JSON.stringify(catalogue),output=applyEcasaCatalogueImageQuality(catalogue,validated);
  assert.equal(JSON.stringify(catalogue),source,'source input was mutated');
  const other=rows=>rows.filter(project=>project.inmobiliaria!=='Ecasa');assert.deepEqual(other(output),other(catalogue));
  for(const before of catalogue.filter(project=>project.inmobiliaria==='Ecasa')) {
    const after=output.find(project=>project.slug===before.slug),restored=structuredClone(after);
    for(const field of ['imagenPrincipal','imagenAlt','imagenEtapa']) {
      if(Object.hasOwn(before,field))restored[field]=before[field];else delete restored[field];
    }
    assert.deepEqual(restored,before,before.slug+': non-image field changed');
    assert.deepEqual(after.etapasComerciales,before.etapasComerciales,before.slug+': original stage snapshots');
    assert.equal(after.imagenPrincipal,policy.projects.find(project=>project.slug===before.slug).covers.preview.catalogue);
  }
  assert.equal(output.filter(project=>project.precioDesdeUF>0).length,107);assert.equal(output.filter(project=>project.precioDesdeUF===null).length,30);
  for(const file of ['data/hipotecario.json','api/uf.mjs','assets/js/mortgage-engine.mjs','assets/js/project-finance.mjs',
    'assets/js/purchase-capacity.mjs','assets/js/purchase-capacity-ui.mjs','assets/js/hipotecario.mjs','privacidad.html'])
    assertPreservedSource(file,read(file),original(file));
});

test('quality decisions reject missing inventories, wrong bytes, borrowed stages, plan removal and unauthorized cover substitutions',()=>{
  for(const mutate of [
    value=>value.projects.pop(),value=>value.projects[0].images.pop(),
    value=>value.projects[0].images.push(structuredClone(value.projects[0].images[0])),
    value=>value.projects[0].images[0].sha256='a'.repeat(64),value=>value.projects[0].images[0].width+=1,
    value=>value.projects[0].images[0].originCommercialSlug='alto-san-joaquin-3',
    value=>value.projects[0].images[0].localPath=review.projects.find(record=>record.models.length).models[0].plan.localPath,
    value=>value.projects[0].images[0].kind='plan',value=>value.projects[0].images[0].coverOnly=true,
    value=>value.projects[0].images[0].reason='',
    value=>value.projects[0].covers.preview.hero=value.projects[1].covers.preview.hero,
    value=>{const project=value.projects.find(project=>project.images.some(image=>image.kind==='documentary'));
      project.covers.public.hero=project.images.find(image=>image.kind==='documentary').localPath;},
  ]) {
    const changed=structuredClone(policy);mutate(changed);
    assert.throws(()=>validateEcasaImageQuality(review,research,catalogue,changed,official),/Ecasa image quality:/);
  }
});

test('explicit cover-only and no-cover fixtures cannot leak excluded gallery images or leave empty gallery navigation',()=>{
  for(const coverOnly of [false,true]) {
    const changed=structuredClone(policy);
    for(const project of changed.projects) {
      const covers=new Set(Object.values(project.covers).flatMap(profile=>Object.values(profile)));
      for(const image of project.images){image.decision='exclude';image.coverOnly=coverOnly&&covers.has(image.localPath);image.reason='Synthetic explicit review decision';}
      if(!coverOnly)project.covers={preview:{hero:null,catalogue:null},public:{hero:null,catalogue:null}};
    }
    const selection=validateEcasaImageQuality(review,research,catalogue,changed,official);
    for(const project of changed.projects)for(const preview of [true,false]) {
      const before=projected(project.slug,preview),after=transformEcasaImageQuality(before,project.slug,selection,{preview});
      assert.deepEqual(protectedParts(after),protectedParts(before));
      assert.ok(!after.includes('id="galeria"'));assert.ok(!after.includes('href="#galeria"'));
      assert.ok(!/class="gallery-grid(?:\s|"|$)/.test(after));
      assert.equal(transformEcasaImageQuality(after,project.slug,selection,{preview}),after);
      if(!coverOnly){assert.ok(!after.includes('class="hero-image'));assert.ok(!after.includes('property="og:image"'));}
    }
    assert.equal(selectEcasaPublishedAssets(review,selection).filter(asset=>asset.kind==='plan').length,74);
  }
});

test('image filtering preserves financial stage labels and rejects remote-image escapes and stage reassignment',()=>{
  const source=projected('terratolten'),after=transformEcasaImageQuality(source,'terratolten',validated);
  assert.match(after,/Etapa 3 · Imagen referencial/);assert.match(visible(after),/Precio desde · Etapa 3.*UF 2\.390/);
  const output=applyEcasaCatalogueImageQuality(catalogue,validated);
  assert.equal(output.find(project=>project.slug==='terratolten').imagenEtapa,'Etapa 3');
  for(const slug of ['nucleo-costanera','alto-san-joaquin','ferroparque','lomas-de-puyai']) {
    assert.equal(output.find(project=>project.slug===slug).imagenEtapa,undefined,slug+': technical default cannot invent exclusive phase');
    assert.ok(!transformEcasaImageQuality(projected(slug),slug,validated).includes('class="ecasa-media-label"'),slug);
  }
  assert.throws(()=>transformEcasaImageQuality(source.replaceAll('data-commercial-stage="terratolten-1"','data-commercial-stage="terratolten-3"'),
    'terratolten',validated),/commercial-stage attribution/);
  const unreviewed=source.replace('</body>','<div class="gallery-grid"><figure><img src="https://ecasa.cl/unreviewed-photo.jpg"></figure></div></body>');
  assert.throws(()=>transformEcasaImageQuality(unreviewed,'terratolten',validated),/unknown property image/);
});

test('every non-Ecasa HTML string is unchanged by the quality transform in both publication profiles',()=>{
  let checked=0;
  for(const project of catalogue.filter(project=>project.inmobiliaria!=='Ecasa')) {
    const source=read(project.slug+'.html').toString();
    for(const preview of [true,false])assert.equal(transformEcasaImageQuality(source,project.slug,validated,{preview}),source,project.slug);
    checked++;
  }
  assert.equal(checked,122);
});

test('real private packaging publishes 395 selected resources, keeps 74 Ecasa plans and excludes four source photographs',()=>{
  const fixture=mkdtempSync(join(tmpdir(),'sollahms-quality-release-'));
  const copy=path=>{const target=join(fixture,path);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(ROOT,path),target);};
  try {
    cpSync(resolve(ROOT,'assets'),join(fixture,'assets'),{recursive:true});
    for(const path of ['scripts/package-vercel.mjs','scripts/ecasa-publication.mjs','scripts/ecasa-image-quality.mjs','scripts/brochure-publication.mjs', 'scripts/leben-publication.mjs',
      'scripts/public-fiche-copy.mjs','data/public-caption-policy.json','data/ecasa-image-quality.json','data/fichas-proyectos.json','data/fuentes-imagenes.json',
      'data/proyectos.json','data/hipotecario.json','data/brochures-ecasa.json','data/brochures-aj-urbana.json','data/brochures-ingevec.json',
      'vercel.json','robots.txt','sitemap.xml','404.html','agenda-asesoria.html','comparador-hipotecario.html','contacto.html','index.html','privacidad.html','proyectos.html',
      ...catalogue.map(project=>project.slug+'.html')])copy(path);
    const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('VERCEL_')&&!key.startsWith('BOOKING_')&&
      !key.startsWith('RESEND_')&&!key.startsWith('SMTP_')&&key!=='GITHUB_TOKEN'));
    const env={...environment,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/ecasa-cartera-definitiva'};
    const script=join(fixture,'scripts/package-vercel.mjs');
    writeFileSync(script,original('scripts/package-vercel.mjs'));
    execFileSync(process.execPath,[script],{cwd:fixture,env,stdio:'pipe'});
    const beforeCatalogue=JSON.parse(readFileSync(join(fixture,'dist/data/proyectos.json')));
    const beforePages=new Map(catalogue.filter(project=>project.inmobiliaria!=='Ecasa').map(project=>
      [project.slug,originalLebenHtml(readFileSync(join(fixture,'dist',project.slug+'.html')))]));
    copy('scripts/package-vercel.mjs');
    execFileSync(process.execPath,[script],{cwd:fixture,env,stdio:'pipe'});
    const inventory=JSON.parse(readFileSync(join(fixture,'.vercel/brochure-build-inventory.json')));
    assert.equal(inventory.media.length,395);assert.equal(inventory.ecasaReviewMedia,126);
    assert.equal(inventory.media.filter(asset=>!asset.path.includes('/ecasa-preview/')).length,269);
    assert.equal(inventory.ecasaImageQuality.policySha256,hash(read('data/ecasa-image-quality.json')));
    for(const path of EXCLUDED){assert.equal(existsSync(join(fixture,'dist',path.slice(1))),false);assert.ok(existsSync(join(fixture,path.slice(1))));}
    for(const record of review.projects)for(const model of record.models)
      assert.equal(hash(readFileSync(join(fixture,'dist',model.plan.localPath.slice(1)))),model.plan.sha256);
    const afterCatalogue=JSON.parse(readFileSync(join(fixture,'dist/data/proyectos.json')));
    assert.deepEqual(afterCatalogue.filter(project=>project.inmobiliaria!=='Ecasa'),beforeCatalogue.filter(project=>project.inmobiliaria!=='Ecasa'));
    for(const [slug,before] of beforePages)assert.deepEqual(readFileSync(join(fixture,'dist',slug+'.html')),before,slug);
    for(const file of ['data/ecasa-image-quality.json','data/fichas-proyectos.json','data/fuentes-imagenes.json','scripts/ecasa-image-quality.mjs'])
      assert.equal(existsSync(join(fixture,'dist',file)),false,file+': private policy/evidence escaped');
  } finally {rmSync(fixture,{recursive:true,force:true});}
});
