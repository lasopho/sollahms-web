import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateEcasaImageQuality, selectEcasaPublishedAssets, transformEcasaImageQuality,
  applyEcasaCatalogueImageQuality, ecasaExcludedImagePaths } from '../scripts/ecasa-image-quality.mjs';
import { normalizeFicheCopy } from '../scripts/public-fiche-copy.mjs';
import { validateEcasaManualQuality, effectiveEcasaManualQuality, transformEcasaManualGallery } from '../scripts/ecasa-manual-quality.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASELINE='fd9f238685ed59e03716ccef10f40ab8b0a9a1c5';
const read=path=>readFileSync(join(ROOT,path));
const json=path=>JSON.parse(read(path));
const catalogue=json('data/proyectos.json'),documents=json('data/brochures-ecasa.json'),research=json('data/fichas-proyectos.json');
const base=validateEcasaImageQuality(documents,research,catalogue,json('data/ecasa-image-quality.json'),json('data/fuentes-imagenes.json'));
const policy=json('data/ecasa-manual-quality.json'),manual=validateEcasaManualQuality(base,policy),effective=effectiveEcasaManualQuality(base,manual);
const official=json('data/ecasa-official-originals.json');
const removedProjects=['nucleo-costanera','lamara','edificio-bezanilla','endemico','ferroparque','terratolten',
  'urban-la-florida','aires-la-florida-2','conecta-huechuraba','alto-san-joaquin'];
const newCovers={
  'edificio-bezanilla':'/assets/propiedades/ecasa-preview/edificio-bezanilla/imagen-02-p01.webp',
  'espacio-victoria':'/assets/propiedades/ecasa-preview/espacio-victoria/imagen-03-p01.webp',
  'urban-la-florida':'/assets/propiedades/ecasa-preview/urban-la-florida/imagen-03-p02.webp',
  'aires-la-florida-2':'/assets/propiedades/ecasa-preview/aires-la-florida-2/imagen-02-p01.webp',
  'conecta-huechuraba':'/assets/propiedades/ecasa-preview/conecta-huechuraba/imagen-02-p01.webp',
};
const snapshot=value=>JSON.stringify(value,(_,item)=>item instanceof Map?[...item]:item instanceof Set?[...item]:item);
const project=slug=>policy.projects.find(value=>value.slug===slug);
const source=slug=>normalizeFicheCopy(read(slug+'.html').toString().replace(/<!--ECASA_PUBLIC_START-->[\s\S]*?<!--ECASA_PUBLIC_END-->/g,'')
  .replace(/<!--ECASA_(?:PUBLIC|PREVIEW)_(?:START|END)-->/g,''));
const fragments=html=>[...html.matchAll(/<iframe\b[^>]*>[\s\S]*?<\/iframe>|<dl\b[^>]*>[\s\S]*?<\/dl>|<details\b[^>]*class="aj-model"[^>]*>[\s\S]*?<\/details>|<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g)].map(match=>match[0]);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;');
function officialPhotoBlock(slug) {
  const image=official.projects.find(record=>record.slug===slug).images[0];
  return '<!--ECASA_OFFICIAL_ORIGINALS_START--><div class="aj-gallery-heading" data-commercial-stage="'+slug+'" data-official-scope="development_general"><h3>Fotografías del desarrollo</h3></div>'+
    '<div class="gallery-grid" data-commercial-stage="'+slug+'" data-official-scope="development_general" style="grid-template-columns:minmax(0,1fr)">'+
    '<figure data-commercial-stage="'+slug+'" data-official-scope="development_general"><a href="'+image.localPath+'" target="_blank" rel="noopener noreferrer"><img src="'+image.localPath+
    '" alt="'+esc(image.alt)+'" width="'+image.width+'" height="'+image.height+'" loading="lazy" decoding="async" style="aspect-ratio:'+image.width+'/'+image.height+'"></a><figcaption>'+esc(image.alt)+
    '</figcaption></figure></div><!--ECASA_OFFICIAL_ORIGINALS_END-->';
}
function withOfficialPhoto(html,slug) {
  const start=html.indexOf('id="galeria"'),end=html.indexOf('</section>',start);
  assert.ok(start>=0&&end>=0);return html.slice(0,end)+officialPhotoBlock(slug)+html.slice(end);
}
function rejected(change){const altered=structuredClone(policy);change(altered);assert.throws(()=>validateEcasaManualQuality(base,altered),/Ecasa manual quality:/);}

test('manual review retains all 118 source photographs and 74 plans while selecting 70 gallery images and seven explicit cover-only exceptions',()=>{
  assert.equal(policy.baselineCommit,BASELINE);assert.equal(policy.projects.length,15);
  assert.deepEqual(effective.summary,{reviewedImages:118,officialImages:62,documentaryImages:56,plansPreserved:74,
    keptImages:70,excludedImages:48,coverOnlyImages:7,documentaryGalleryImages:8,documentaryPublishedImages:15});
  assert.deepEqual(manual.summary,effective.summary);
  assert.ok([...effective.images.values()].filter(image=>image.kind==='official').every(image=>image.decision==='keep'&&!image.coverOnly));
  for(const slug of removedProjects)assert.ok([...effective.images.values()].filter(image=>image.projectSlug===slug&&image.kind==='documentary').every(image=>image.decision==='exclude'));
  for(const slug of ['wayra','lomas-de-puyai','enlace-mackenna']) {
    assert.deepEqual(effective.projects.get(slug).covers,base.projects.get(slug).covers);
    for(const image of base.images.values())if(image.projectSlug===slug)assert.equal(effective.images.get(image.localPath).decision,image.decision);
  }
  for(const [slug,path] of Object.entries(newCovers))assert.deepEqual(effective.projects.get(slug).covers.preview,{hero:path,catalogue:path});
});

test('scope, identity coverage and nine-field choices reject any additional caption, stage, commercial or source mutation',()=>{
  for(const change of [p=>p.baselineCommit='0'.repeat(40),p=>p.schemaVersion=2,p=>p.scope='public_all_images',p=>p.protectedPreviewOnly=false,
    p=>p.projects.pop(),p=>p.projects.push(structuredClone(p.projects[0])),p=>p.projects[0].slug='lomas-de-puyai-3',
    p=>p.projects[0].instruction='',p=>p.projects[0].images.pop(),p=>p.projects[0].images.push(structuredClone(p.projects[0].images[0])),
    p=>p.projects[0].images[0].sha256='f'.repeat(64),p=>p.projects[0].images[0].width++,p=>p.projects[0].images[0].height++,
    p=>p.projects[0].images[0].originCommercialSlug='ferroparque',p=>p.projects[0].images[0].kind='plan',
    p=>p.projects[0].images[0].localPath='/assets/propiedades/ecasa-official-review/ferroparque/new.webp'])rejected(change);
  for(const key of ['alt','caption','stage','etapa','price','precioDesdeUF','projectSlug','url'])rejected(p=>{p.projects[0].images[0][key]='unreviewed';});
});

test('manual decisions cannot remove official images, reintroduce the four discarded photos or reverse the project-specific instructions',()=>{
  rejected(p=>{p.projects[0].images[0].decision='exclude';});
  rejected(p=>{const i=p.projects.find(x=>x.slug==='enlace-mackenna').images.find(x=>x.kind==='documentary');i.decision='keep';});
  rejected(p=>{p.projects.find(x=>x.slug==='wayra').images.find(x=>x.kind==='documentary').decision='exclude';});
  rejected(p=>{p.projects.find(x=>x.slug==='ferroparque').images.find(x=>x.kind==='documentary'&&!x.coverOnly).decision='keep';});
  rejected(p=>{p.projects.find(x=>x.slug==='cumbres-de-penuelas').images.find(x=>x.localPath.endsWith('imagen-02-p03.webp')).decision='keep';});
  rejected(p=>{p.projects.find(x=>x.slug==='espacio-victoria').images.find(x=>x.localPath.endsWith('imagen-02-p01.webp')).decision='exclude';});
  rejected(p=>{p.projects.find(x=>x.slug==='ferroparque').officialGalleryMode='unchanged';});
  rejected(p=>{p.projects.find(x=>x.slug==='alto-san-joaquin').officialGalleryMode='integrate_into_official';});
});

test('cover exceptions require a real retained cover role and cannot borrow from another development or stage declaration',()=>{
  rejected(p=>{p.projects.find(x=>x.slug==='lamara').images.find(x=>x.coverOnly).coverOnly=false;});
  rejected(p=>{p.projects.find(x=>x.slug==='lamara').images.find(x=>x.coverOnly).decision='keep';});
  rejected(p=>{const x=p.projects.find(x=>x.slug==='lamara');x.previewCover=project('wayra').previewCover;});
  rejected(p=>{const x=p.projects.find(x=>x.slug==='urban-la-florida');x.images.find(i=>i.kind==='documentary'&&!i.coverOnly).coverOnly=true;});
  rejected(p=>{p.projects.find(x=>x.slug==='lomas-de-puyai').previewCover=p.projects.find(x=>x.slug==='lomas-de-puyai').images[1].localPath;});
  const withNull=structuredClone(policy);withNull.projects.find(x=>x.slug==='lomas-de-puyai').previewCover=null;
  const accepted=effectiveEcasaManualQuality(base,validateEcasaManualQuality(base,withNull));
  assert.deepEqual(accepted.projects.get('lomas-de-puyai').covers,base.projects.get('lomas-de-puyai').covers);
});

test('effective Preview maps are independent and the public profile returns the exact frozen base',()=>{
  const before=snapshot(base),policyBefore=JSON.stringify(policy),fresh=validateEcasaManualQuality(base,policy);
  const selection=effectiveEcasaManualQuality(base,fresh);
  assert.notEqual(selection.images,base.images);assert.notEqual(selection.projects,base.projects);assert.notEqual(selection.aliases,base.aliases);
  assert.notEqual(selection.planPaths,base.planPaths);assert.notEqual(selection.planOwners,base.planOwners);
  assert.equal(effectiveEcasaManualQuality(base,fresh,{preview:false}),base);
  assert.deepEqual(selection.planPaths,base.planPaths);assert.deepEqual(selection.planOwners,base.planOwners);
  for(const [path,old] of base.images)for(const field of ['sha256','width','height','originCommercialSlug','projectSlug','alt','caption','displayStage'])assert.equal(selection.images.get(path)[field],old[field],path+'/'+field);
  const caller=selection.images.values().next().value;caller.sha256='bad';
  assert.equal(snapshot(base),before);assert.equal(JSON.stringify(policy),policyBefore);
  fresh.images.clear();assert.equal(effectiveEcasaManualQuality(base,fresh).images.size,118,'caller-visible maps do not alter the private validated copy');
  assert.throws(()=>effectiveEcasaManualQuality(base,{...fresh}),/validated manual review/);
  const changed=structuredClone(base);changed.images.values().next().value.sha256='mutated';
  assert.throws(()=>effectiveEcasaManualQuality(changed,fresh),/base quality review was mutated/);
});

test('published selection keeps all plans and exactly fifteen documentary files, excluding 37 additional unused documentary routes',()=>{
  const selected=selectEcasaPublishedAssets(documents,effective),previous=selectEcasaPublishedAssets(documents,base);
  assert.equal(selected.length,89);assert.equal(selected.filter(asset=>asset.kind!=='plan').length,15);
  assert.deepEqual(selected.filter(asset=>asset.kind==='plan'),documents.projects.flatMap(project=>project.models.map(model=>model.plan)));
  assert.equal(previous.length-selected.length,37);
  const removed=previous.filter(asset=>!selected.some(current=>current.localPath===asset.localPath));
  assert.equal(removed.length,37);assert.ok(removed.every(asset=>asset.kind!=='plan'));
  assert.equal(ecasaExcludedImagePaths(effective).size,41);
  for(const source of [...base.images.values()].filter(image=>image.decision==='exclude'))assert.ok(ecasaExcludedImagePaths(effective).has(source.localPath));
  for(const choice of effective.images.values())if(choice.coverOnly)assert.ok(selected.some(asset=>asset.localPath===choice.localPath));
  assert.deepEqual(selectEcasaPublishedAssets(documents,effective,{preview:false}),[]);
});

test('all fifteen Preview galleries prune documentary images and empty groups without changing plans, specifications, maps or runtime',()=>{
  let retainedDocumentaryFigures=0,retainedPlanImages=0;
  for(const record of documents.projects) {
    const original=source(record.slug),filtered=transformEcasaImageQuality(original,record.slug,effective);
    assert.deepEqual(fragments(filtered),fragments(original),record.slug);
    assert.equal(transformEcasaImageQuality(filtered,record.slug,effective),filtered,record.slug+': idempotent');
    for(const model of record.models){assert.ok(filtered.includes(model.plan.localPath));retainedPlanImages++;}
    for(const image of record.images) {
      const choice=effective.images.get(image.localPath),figures=[...filtered.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].filter(m=>m[0].includes(image.localPath));
      assert.equal(figures.length,choice.decision==='keep'?1:0,image.localPath+': gallery use');
      if(choice.decision==='keep')retainedDocumentaryFigures++;
      if(choice.decision==='exclude'&&!choice.coverOnly)assert.ok(!filtered.includes(image.localPath));
    }
    assert.ok(!/<div[^>]*class="gallery-grid(?: aj-gallery)?"[^>]*>\s*<\/div>/.test(filtered),record.slug+': empty grid');
    if(removedProjects.includes(record.slug))assert.ok(!filtered.includes('class="aj-gallery-heading"'),record.slug+': empty documentary heading');
  }
  assert.equal(retainedDocumentaryFigures,8);assert.equal(retainedPlanImages,74);
});

test('FerroParque integrates its existing photograph first in the official grid while keeping previous figures ordered and Alto unchanged',()=>{
  const filtered=transformEcasaImageQuality(source('ferroparque'),'ferroparque',effective),original=withOfficialPhoto(filtered,'ferroparque');
  const integrated=transformEcasaManualGallery(original,'ferroparque',manual),image=official.projects.find(p=>p.slug==='ferroparque').images[0];
  assert.equal(transformEcasaManualGallery(integrated,'ferroparque',manual),integrated);
  assert.deepEqual(fragments(integrated),fragments(original));
  assert.ok(!integrated.includes('<!--ECASA_OFFICIAL_ORIGINALS_START-->'));assert.ok(!integrated.includes('Fotografías del desarrollo'));
  const grid=integrated.slice(integrated.indexOf('<div class="gallery-grid"',integrated.indexOf('id="galeria"')));
  assert.ok(grid.indexOf(image.localPath)<grid.indexOf('/assets/propiedades/catalogo/91ff04bbcf904896681228e0.webp'));
  assert.ok(grid.indexOf('/assets/propiedades/catalogo/91ff04bbcf904896681228e0.webp')<grid.indexOf('/assets/propiedades/catalogo/3960bdffb2bc4851f247ed6e.webp'));
  assert.ok(grid.includes('style="grid-column:1/-1"'));assert.ok(grid.includes('aspect-ratio:'+image.width+'/'+image.height));
  assert.ok(grid.includes('data-commercial-stage="ferroparque"'));assert.ok(grid.includes('data-official-scope="development_general"'));
  const alto=withOfficialPhoto(transformEcasaImageQuality(source('alto-san-joaquin'),'alto-san-joaquin',effective),'alto-san-joaquin');
  assert.equal(transformEcasaManualGallery(alto,'alto-san-joaquin',manual),alto);
  assert.equal(transformEcasaManualGallery(original,'ferroparque',manual,{preview:false}),original);
  assert.throws(()=>transformEcasaManualGallery(filtered,'ferroparque',manual),/selected official photograph block is missing/);
  assert.throws(()=>transformEcasaManualGallery(original.replace(/<figure data-commercial-stage="ferroparque" data-official-scope="development_general">/,
    '<figure data-commercial-stage="ferroparque-2" data-official-scope="development_general">'),'ferroparque',manual),/general origin/);
  assert.throws(()=>transformEcasaManualGallery(original.replace('<!--ECASA_OFFICIAL_ORIGINALS_END-->','<!--ECASA_OFFICIAL_ORIGINALS_END-->'.repeat(2)),'ferroparque',manual),/duplicate official photograph/);
});

test('Cumbres retains only its facade at full width and natural aspect without changing other project layout or imagery',()=>{
  const filtered=transformEcasaImageQuality(source('cumbres-de-penuelas'),'cumbres-de-penuelas',effective);
  const after=transformEcasaManualGallery(filtered,'cumbres-de-penuelas',manual),image=effective.images.get('/assets/propiedades/ecasa-preview/cumbres-de-penuelas/imagen-01-p01.webp');
  assert.equal(transformEcasaManualGallery(after,'cumbres-de-penuelas',manual),after);assert.deepEqual(fragments(after),fragments(filtered));
  assert.ok(after.includes('grid-template-columns:minmax(0,1fr)'));assert.ok(after.includes('aspect-ratio:'+image.width+'/'+image.height));
  assert.ok(!after.includes('/assets/propiedades/ecasa-preview/cumbres-de-penuelas/imagen-02-p03.webp'));
  for(const slug of ['wayra','lomas-de-puyai','enlace-mackenna']) {
    const html=transformEcasaImageQuality(source(slug),slug,effective);assert.equal(transformEcasaManualGallery(html,slug,manual),html);
    assert.equal(html,transformEcasaImageQuality(source(slug),slug,base));
  }
  assert.equal(transformEcasaManualGallery(filtered,'cumbres-de-penuelas',manual,{preview:false}),filtered);
  assert.throws(()=>transformEcasaManualGallery(filtered.replaceAll('src="'+image.localPath+'"','src="/assets/propiedades/ecasa-preview/cumbres-de-penuelas/imagen-02-p03.webp"'),'cumbres-de-penuelas',manual),/single-photo layout/);
});

test('source files, 136 identities, financial values, 22 stage snapshots and public projection remain exact',()=>{
  for(const path of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json','data/fuentes-imagenes.json',
    'data/brochures-ecasa.json','data/brochures-aj-urbana.json','data/brochures-ingevec.json','data/ecasa-image-quality.json',
    'data/ecasa-official-originals.json','sitemap.xml','vercel.json',...catalogue.map(project=>project.slug+'.html')])
    assert.deepEqual(read(path),execFileSync('git',['show',BASELINE+':'+path],{cwd:ROOT,maxBuffer:8*1024*1024}),path);
  const output=applyEcasaCatalogueImageQuality(catalogue,effective);
  assert.equal(output.length,136);assert.equal(output.filter(project=>project.inmobiliaria!=='Ecasa').length,121);
  assert.equal(output.filter(project=>Number.isFinite(project.precioDesdeUF)&&project.precioDesdeUF>0).length,106);
  for(let i=0;i<catalogue.length;i++) {
    const a=structuredClone(output[i]),b=structuredClone(catalogue[i]);for(const key of ['imagenPrincipal','imagenAlt','imagenEtapa']){delete a[key];delete b[key];}
    assert.deepEqual(a,b);assert.deepEqual(output[i].etapasComerciales,catalogue[i].etapasComerciales);
    if(catalogue[i].inmobiliaria!=='Ecasa')assert.deepEqual(output[i],catalogue[i]);
  }
  assert.equal(research.flatMap(project=>project.etapasComerciales??[]).length,22);
  const publicQuality=effectiveEcasaManualQuality(base,manual,{preview:false});
  assert.deepEqual(applyEcasaCatalogueImageQuality(catalogue,publicQuality,{preview:false}),applyEcasaCatalogueImageQuality(catalogue,base,{preview:false}));
  for(const record of documents.projects)assert.equal(transformEcasaImageQuality(source(record.slug),record.slug,publicQuality,{preview:false}),
    transformEcasaImageQuality(source(record.slug),record.slug,base,{preview:false}));
  for(const [slug,path] of Object.entries(newCovers))assert.equal(output.find(project=>project.slug===slug).imagenAlt,base.images.get(path).alt);
});
