import test from 'node:test';
import { prepareHistoricalNorteVerdePackagingFixture } from './norte-verde-preservation.mjs';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, mkdtempSync, rmSync,
  unlinkSync, symlinkSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ecasaPublication, validateEcasaReview, ECASA_SLUGS, ECASA_COMMERCIAL_SLUGS,
  ECASA_PROJECT_BY_COMMERCIAL_SLUG, ecasaAssetDigest } from '../scripts/ecasa-publication.mjs';

const H1 = '1'.repeat(64), H2 = '2'.repeat(64), H3 = '3'.repeat(64);
function fixture() {
  const stage = slug => /-(1|2|3)$/.test(slug) ? 'Etapa ' + slug.at(-1) : null;
  const sources = ECASA_COMMERCIAL_SLUGS.map(slug => ({ slug, name: slug,
    projectSlug: ECASA_PROJECT_BY_COMMERCIAL_SLUG[slug], etapa: stage(slug),
    documents: [], stageScope: 'named_development_only', selectedImagePaths: [], selectedPlanPaths: [] }));
  const record = slug => ({ slug, name: slug, images: [], models: [], documents: [],
    stageScope: 'named_development_only',
    commercialSourceSlugs: sources.filter(source => source.projectSlug === slug).map(source => source.slug),
    sourceAssetSlugs: [] });
  const review = { schemaVersion: 2, publicationRights: { sourceChannel: 'Ecasa/user_supplied',
    protectedPreview: 'authorized_by_user', productionPolicy: 'requires_verified_contract_scope',
    contractScope: { status: 'pending_contract_scope_verification' } },
    projects: ECASA_SLUGS.map(record), commercialSources: sources };
  const r = review.projects.find(r=>r.slug==='edificio-bezanilla');
  const source = sources.find(source=>source.slug===r.slug);
  const document = { fileName: 'Bezanilla.pdf', sha256: H1, pageCount: 4, sourceChannel: 'Ecasa/user_supplied', assetScope: 'named_development' };
  r.document = document; r.documents = [document];
  source.documents = [document];
  const image = { localPath: '/assets/propiedades/ecasa-preview/edificio-bezanilla/photo.webp',
    sourceSha256: H1, sourcePage: 1, sha256: H2, width: 1600, height: 900, privacySafe: true,
    visuallyVerified: true, assetScope: 'named_development', sourceChannel: 'Ecasa/user_supplied',
    originCommercialSlug: r.slug, etapa: null, kind: 'render', caption: 'Imagen según brochure',
    displayCaption: 'Imagen referencial' };
  r.images = Array.from({length:56},(_,i)=>({...image,
    localPath:'/assets/propiedades/ecasa-preview/edificio-bezanilla/photo-'+i+'.webp'}));
  r.catalogueCover = { localPath: r.images[0].localPath, alt: 'Render ilustrativo' };
  const model = { modelo: '2d-p2', pagina_brochure: 2, sourceSha256: H1,
    superficie_util_m2: 45, terraza_m2: 5, superficie_total_m2: 50, dormitorios: 2, banos: 1,
    visuallyVerified: true, approximate: true, orientacion: null, pisos: null,
    originCommercialSlug: r.slug, etapa: null, stageScope: 'named_development_only',
    plan: { ...image, kind: 'plan', caption: 'Plano referencial', displayCaption: 'Plano referencial',
      localPath: '/assets/propiedades/ecasa-preview/edificio-bezanilla/plan.webp', sha256: H3, sourcePage: 2 } };
  r.models = Array.from({length:74},(_,i)=>({...model,modelo:model.modelo+'-'+i,
    plan:{...model.plan,localPath:'/assets/propiedades/ecasa-preview/edificio-bezanilla/plan-'+i+'.webp'}}));
  source.selectedImagePaths=r.images.map(image=>image.localPath);
  source.selectedPlanPaths=r.models.map(model=>model.plan.localPath);
  r.sourceAssetSlugs=[r.slug];
  return review;
}

test('Ecasa grants protected review independently while its promotional web scope stays pending', () => {
  assert.deepEqual(ecasaPublication(fixture()), { protectedReview: true, publicWeb: false });
  assert.equal(validateEcasaReview(fixture()).length, 130);
  const actual = JSON.parse(readFileSync(new URL('../data/brochures-ecasa.json', import.meta.url)));
  assert.deepEqual(ecasaPublication(actual), { protectedReview: true, publicWeb: false });
});

test('another developer contract, Yapo attestation and an invented Ecasa web verification cannot grant rights', () => {
  for (const change of [r=>{r.sourceChannel='Yapo/IRIS';},
    r=>{r.contractScope.status='verified_contract';},
    r=>{r.protectedPreview='not_authorized';},
    r=>{r.productionPolicy='automatic_publication';}]) {
    const review=fixture(); change(review.publicationRights);
    assert.throws(()=>ecasaPublication(review), /Ecasa:/);
  }
});

test('review rejects missing identities, duplicate projects and cross-project selected paths', () => {
  const missing=fixture(); missing.projects.pop(); assert.throws(()=>validateEcasaReview(missing), /15 project identities/);
  const duplicate=fixture(); duplicate.projects[0]=duplicate.projects[1]; assert.throws(()=>validateEcasaReview(duplicate), /15 project identities/);
  const crossed=fixture(); crossed.projects.find(r=>r.slug==='edificio-bezanilla').images[0].localPath='/assets/propiedades/ecasa-preview/ferroparque/photo.webp';
  assert.throws(()=>validateEcasaReview(crossed), /invalid selected path/);
});

test('a duplicated parent PDF cannot authorize plans or photographs for an undocumented numbered stage', () => {
  for (const slug of ['alto-san-joaquin-2','alto-san-joaquin-3','nucleo-costanera-2','lomas-de-puyai-3','terratolten-2']) {
    const review=fixture(), stage=review.commercialSources.find(r=>r.slug===slug), original=review.projects.find(r=>r.slug==='edificio-bezanilla');
    stage.documents=structuredClone(original.documents);
    stage.selectedImagePaths=['/assets/propiedades/ecasa-preview/'+slug+'/photo.webp'];
    assert.throws(()=>validateEcasaReview(review), /stage-specific evidence remains pending/);
  }
});

test('consolidation retains 22 exact origins and cannot declare a numbered stage common to the parent', () => {
  const missing=fixture(); missing.commercialSources.pop();
  assert.throws(()=>validateEcasaReview(missing), /22 commercial source identities/);
  for(const change of [source=>{source.projectSlug='terratolten';},
    source=>{source.etapa='Etapa 1';},source=>{source.stageScope='all_stages';}]) {
    const review=fixture(); change(review.commercialSources.find(source=>source.slug==='alto-san-joaquin'));
    assert.throws(()=>validateEcasaReview(review), /commercial origin mapping or scope/);
  }
  const borrowed=fixture(), record=borrowed.projects.find(record=>record.slug==='edificio-bezanilla');
  record.images[0].originCommercialSlug='nucleo-costanera';
  assert.throws(()=>validateEcasaReview(borrowed), /invalid selected path/);
  const shared=fixture(); shared.projects.find(record=>record.slug==='terratolten').commercialSourceSlugs=['terratolten-1'];
  assert.throws(()=>validateEcasaReview(shared), /project origin inventory or scope/);
});

test('display captions are natural while documentary captions and asset scope remain private evidence', () => {
  const review=fixture(), image=review.projects.find(record=>record.slug==='edificio-bezanilla').images[0];
  assert.equal(image.caption,'Imagen según brochure');
  assert.equal(image.displayCaption,'Imagen referencial');
  for(const displayCaption of ['Imagen según brochure','Documento, página 3','Distribución documentada']) {
    image.displayCaption=displayCaption;
    assert.throws(()=>validateEcasaReview(review), /invalid display caption/);
  }
});

test('all 130 reviewed selections are required and cannot silently disappear during consolidation', () => {
  const review=fixture(), record=review.projects.find(record=>record.slug==='edificio-bezanilla');
  record.images.pop();
  assert.throws(()=>validateEcasaReview(review), /130 reviewed derivatives/);
});

test('the real consolidated manifest retains the exact reviewed crops, captions, hashes and model surfaces', () => {
  const actual=JSON.parse(readFileSync(new URL('../data/brochures-ecasa.json',import.meta.url)));
  const selected=validateEcasaReview(actual);
  const fingerprint=selected.slice().sort((a,b)=>a.localPath.localeCompare(b.localPath)).map(asset=>[
    asset.localPath,asset.sha256,asset.sourceSha256,asset.sourcePage,asset.crop,
    asset.width,asset.height,asset.kind,asset.caption,asset.assetScope,asset.privacySafe,asset.visuallyVerified]);
  assert.equal(ecasaAssetDigest(JSON.stringify(fingerprint)),
    'e763d5a3964e9f2c127a17a16a1a0fdd2ea128fc97124faa70cddb3884e66431');
  const models=actual.projects.flatMap(project=>project.models.map(model=>[
    model.originCommercialSlug,model.modelo,model.tipologia,model.dormitorios,model.banos,
    model.superficie_util_m2,model.superficie_interior_m2??null,model.terraza_m2,
    model.terraza_cubierta_m2??null,model.superficie_total_m2,model.pagina_brochure,
    model.sourceSha256,model.stageScope])).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.equal(ecasaAssetDigest(JSON.stringify(models)),
    'faeed6976e0390fa8224b71823bb35ca36c348478b3034ca518187d26f8546cf');
  const terratolten=actual.projects.find(project=>project.slug==='terratolten');
  assert.deepEqual(terratolten.sourceAssetSlugs,['terratolten-1']);
  for(const asset of [...terratolten.images,...terratolten.models.map(model=>model.plan)]) {
    assert.equal(asset.originCommercialSlug,'terratolten-1');
    assert.equal(asset.etapa,'Etapa 1');
    assert.ok(asset.localPath.startsWith('/assets/propiedades/ecasa-preview/terratolten-1/'));
  }
  for(const slug of ['nucleo-costanera','alto-san-joaquin','ferroparque']) {
    const project=actual.projects.find(project=>project.slug===slug);
    assert.ok([...project.images,...project.models.map(model=>model.plan)].every(asset=>asset.etapa===null));
  }
});

test('consolidation cannot lend matrix equipment to an undocumented stage', () => {
  const review=fixture(), project=review.projects.find(project=>project.slug==='nucleo-costanera');
  project.amenities=[{label:'Piscina',displayLabel:'Piscina',pages:[1],
    originCommercialSlug:'nucleo-costanera-2',etapa:'Etapa 2'}];
  assert.throws(()=>validateEcasaReview(review), /feature origin or display label/);
});

test('a plan cannot change its document or printed page, inherit availability, or contain an invented surface', () => {
  for (const change of [m=>{m.plan.sourceSha256=H2;},m=>{m.plan.sourcePage=3;},
    m=>{m.superficie_util_m2=NaN;},m=>{m.stock=1;},m=>{m.precioDesdeUF=3000;},m=>{m.visuallyVerified=false;}]) {
    const review=fixture(); change(review.projects.find(r=>r.slug==='edificio-bezanilla').models[0]);
    assert.throws(()=>validateEcasaReview(review), /Ecasa:/);
  }
});

test('selected media requires reviewed bytes, positive dimensions, safe privacy flags and valid source pages', () => {
  for (const change of [i=>{i.sha256='invalid';},i=>{i.width=0;},i=>{i.privacySafe=false;},
    i=>{i.visuallyVerified=false;},i=>{i.sourcePage=5;},i=>{i.sourceSha256=H2;},i=>{i.localPath='../photo.webp';}]) {
    const review=fixture(); change(review.projects.find(r=>r.slug==='edificio-bezanilla').images[0]);
    assert.throws(()=>validateEcasaReview(review), /Ecasa:/);
  }
});

function packagingFixture() {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const root = mkdtempSync(join(tmpdir(), 'sollahms-ecasa-synthetic-build-'));
  const copy = path => {
    const destination = join(root, path); mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(resolve(source, path), destination);
  };
  for (const path of ['scripts/package-vercel.mjs', 'scripts/public-fiche-copy.mjs', 'scripts/ecasa-image-quality.mjs',
    'scripts/brochure-publication.mjs', 'scripts/norte-verde-publication.mjs', 'data/norte-verde-baseline.json', 'scripts/leben-publication.mjs', 'scripts/ecasa-publication.mjs', 'data/public-caption-policy.json',
    'data/ecasa-image-quality.json', 'data/fichas-proyectos.json', 'data/fuentes-imagenes.json',
    'data/proyectos.json', 'data/hipotecario.json', 'data/brochures-aj-urbana.json', 'data/brochures-ingevec.json',
    'assets/css/aj-brochure-preview.css', 'sitemap.xml', 'robots.txt']) copy(path);
  // A pending synthetic Ingevec scope exercises the approved fallback without
  // requiring private derivatives in a normal Git checkout.
  const ingevecPath=join(root,'data/brochures-ingevec.json');
  const ingevec=JSON.parse(readFileSync(ingevecPath));
  ingevec.publicationRights.contractScope={status:'pending_contract_scope_verification'};
  writeFileSync(ingevecPath,JSON.stringify(ingevec));
  const aj=JSON.parse(readFileSync(join(root,'data/brochures-aj-urbana.json')));
  for(const record of aj.projects) for(const asset of [...record.images,...record.models.map(m=>m.plan)]) copy(asset.localPath.slice(1));
  const projects=JSON.parse(readFileSync(join(root,'data/proyectos.json')));
  for(const path of ['404.html','agenda-asesoria.html','comparador-hipotecario.html','contacto.html','index.html','privacidad.html','proyectos.html',...projects.map(p=>p.slug+'.html')]) copy(path);
  const review=fixture(), record=review.projects.find(r=>r.slug==='edificio-bezanilla');
  const bytes=Buffer.from('Synthetic fixture bytes; never a publishable image.');
  for(const asset of [...record.images,...record.models.map(m=>m.plan)]) {
    asset.sha256=ecasaAssetDigest(bytes);
    const path=join(root,asset.localPath.slice(1)); mkdirSync(dirname(path),{recursive:true}); writeFileSync(path,bytes);
  }
  writeFileSync(join(root,'data/brochures-ecasa.json'),JSON.stringify(review));
  const researchPath=join(root,'data/fichas-proyectos.json');
  const research=JSON.parse(readFileSync(researchPath));
  const officialPath=join(root,'data/fuentes-imagenes.json');
  const official=JSON.parse(readFileSync(officialPath));
  const policyPath=join(root,'data/ecasa-image-quality.json');
  const policy=JSON.parse(readFileSync(policyPath));
  policy.projects=[];
  let officialCount=0;
  // Preserve the fixture's 22 commercial origins, but replace every Ecasa
  // photograph with local synthetic bytes. No private real image is required.
  for(const project of review.projects) {
    const evidence=research.find(row=>row.slug===project.slug);
    const officialImages=[];
    for(const stage of evidence.etapasComerciales) {
      stage.investigacion.images=(stage.investigacion.images??[]).map((image,index)=> {
        const localPath='/assets/propiedades/catalogo/synthetic-'+stage.slug+'-'+index+'.webp';
        const url='https://ecasa.example.invalid/synthetic/'+stage.slug+'/'+index+'.webp';
        const fake={...image,url,localPath,width:1600,height:900,alt:'Imagen referencial'};
        const destination=join(root,localPath.slice(1));mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,bytes);
        official[url]={status:'downloaded',localPath,localSha256:ecasaAssetDigest(bytes),width:1600,height:900};
        officialImages.push({...fake,sha256:ecasaAssetDigest(bytes),originCommercialSlug:stage.slug,kind:'official'});
        officialCount++;
        return fake;
      });
    }
    const documentary=project.images.map(image=>({...image,kind:'documentary'}));
    const choices=[...officialImages,...documentary].map(image=>({
      localPath:image.localPath,sha256:image.sha256,width:image.width,height:image.height,
      originCommercialSlug:image.originCommercialSlug,kind:image.kind,
      decision:'keep',coverOnly:false,reason:'Synthetic reviewed fixture image.'
    }));
    const previewCover=documentary[0]??officialImages[0]??null;
    const publicCover=officialImages[0]??null;
    policy.projects.push({slug:project.slug,images:choices,covers:{
      preview:{hero:previewCover?.localPath??null,catalogue:previewCover?.localPath??null},
      public:{hero:publicCover?.localPath??null,catalogue:publicCover?.localPath??null}
    }});
    const figure=image=>'<figure data-commercial-stage="'+image.originCommercialSlug+'"><a href="'+image.localPath+'"><img src="'+image.localPath+'" alt="Imagen referencial"></a></figure>';
    const hero=previewCover?'<img class="hero-image" data-commercial-stage="'+previewCover.originCommercialSlug+'" src="'+previewCover.localPath+'" alt="Imagen referencial">':'';
    const plans=project.models.map(model=>'<article class="aj-model" data-commercial-stage="'+model.originCommercialSlug+'"><h3>Modelo '+model.modelo+'</h3><a href="'+model.plan.localPath+'"><img src="'+model.plan.localPath+'" alt="Plano referencial"></a></article>').join('');
    const imageMetadata=previewCover?'<meta property="og:image" content="https://sollahms.cl'+previewCover.localPath+'">':'';
    const structured={name:project.name,...(previewCover?{image:'https://sollahms.cl'+previewCover.localPath}:{})};
    // Construct the entire Ecasa fiche from this fixture. A real fiche would
    // reference unrelated reviewed paths and could conceal a missing binding.
    writeFileSync(join(root,project.slug+'.html'),'<!doctype html><html lang="es"><head><title>'+project.name+'</title>'+imageMetadata+
      '<script type="application/ld+json">'+JSON.stringify(structured)+'</script></head><body><main>'+
      '<section class="project-hero">'+hero+'<div class="hero-shade"></div><h1>'+project.name+'</h1></section>'+
      '<section id="galeria"><div class="gallery-grid">'+[...officialImages,...documentary].map(figure).join('')+'</div></section>'+plans+'</main></body></html>');
  }
  assert.equal(officialCount,62,'fixture must exercise every original official image slot');
  writeFileSync(researchPath,JSON.stringify(research));
  writeFileSync(officialPath,JSON.stringify(official));
  writeFileSync(policyPath,JSON.stringify(policy));
  prepareHistoricalNorteVerdePackagingFixture(root);
  const run=extra=>spawnSync(process.execPath,[join(root,'scripts/package-vercel.mjs')],{cwd:root,
    env:{...process.env,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/ecasa-cartera-definitiva',...extra},encoding:'utf8',timeout:15000});
  return {root,record,run};
}

test('protected Preview fails closed when a selected Ecasa derivative is absent or symbolic', () => {
  for(const symbolic of [false,true]) {
    const f=packagingFixture();
    try {
      const selected=join(f.root,f.record.models[0].plan.localPath.slice(1)); unlinkSync(selected);
      if(symbolic) symlinkSync(join(f.root,f.record.models[1].plan.localPath.slice(1)),selected);
      const result=f.run(); assert.notEqual(result.status,0);
      assert.match(result.stderr,/Incomplete Ecasa protected Preview media batch/);
      assert.equal(existsSync(join(f.root,'dist')),false);
    } finally { rmSync(f.root,{recursive:true,force:true}); }
  }
});

test('a changed derivative hash blocks Preview and the explicit public web profile requires Ecasa rights', () => {
  const f=packagingFixture();
  try {
    writeFileSync(join(f.root,f.record.models[0].plan.localPath.slice(1)),'Changed synthetic bytes');
    const changed=f.run(); assert.notEqual(changed.status,0); assert.match(changed.stderr,/Ecasa selected media bytes differ from review/);
    const publicWeb=f.run({SOLLAHMS_BROCHURE_PROFILE:'public-web'});
    assert.notEqual(publicWeb.status,0); assert.match(publicWeb.stderr,/Public web content requires|Ecasa public web content requires/);
  } finally { rmSync(f.root,{recursive:true,force:true}); }
});

test('Preview output excludes private manifests, original documents and unselected commercial captures', () => {
  const f=packagingFixture();
  try {
    writeFileSync(join(f.root,'data/private-contract.pdf'),'Private synthetic contract');
    const capture=join(dirname(join(f.root,f.record.images[0].localPath.slice(1))),'cartera_ecasa_captura_01.png');
    writeFileSync(capture,'Private synthetic commercial capture');
    const result=f.run(); assert.equal(result.status,0,result.stderr);
    assert.equal(existsSync(join(f.root,'dist/data/brochures-ecasa.json')),false);
    assert.equal(existsSync(join(f.root,'dist/data/private-contract.pdf')),false);
    assert.equal(existsSync(join(f.root,'dist',capture.slice(f.root.length+1))),false);
  } finally { rmSync(f.root,{recursive:true,force:true}); }
});
