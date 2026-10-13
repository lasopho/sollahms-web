import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, mkdtempSync, rmSync,
  unlinkSync, symlinkSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ecasaPublication, validateEcasaReview, ECASA_SLUGS, ecasaAssetDigest } from '../scripts/ecasa-publication.mjs';

const H1 = '1'.repeat(64), H2 = '2'.repeat(64), H3 = '3'.repeat(64);
function fixture() {
  const record = slug => ({ slug, nombre: slug, images: [], models: [], documents: [] });
  const review = { publicationRights: { sourceChannel: 'Ecasa/user_supplied',
    protectedPreview: 'authorized_by_user', productionPolicy: 'requires_verified_contract_scope',
    contractScope: { status: 'pending_contract_scope_verification' } }, projects: ECASA_SLUGS.map(record) };
  const r = review.projects.find(r=>r.slug==='edificio-bezanilla');
  const document = { fileName: 'Bezanilla.pdf', sha256: H1, pageCount: 4, sourceChannel: 'Ecasa/user_supplied', assetScope: 'named_development' };
  r.document = document; r.documents = [document];
  const image = { localPath: '/assets/propiedades/ecasa-preview/edificio-bezanilla/photo.webp',
    sourceSha256: H1, sourcePage: 1, sha256: H2, width: 1600, height: 900, privacySafe: true,
    visuallyVerified: true, assetScope: 'named_development', sourceChannel: 'Ecasa/user_supplied' };
  r.images = [image]; r.catalogueCover = { localPath: image.localPath, alt: 'Render ilustrativo' };
  r.models = [{ modelo: '2d-p2', pagina_brochure: 2, sourceSha256: H1,
    superficie_util_m2: 45, terraza_m2: 5, superficie_total_m2: 50, dormitorios: 2, banos: 1,
    visuallyVerified: true, approximate: true, orientacion: null, pisos: null,
    plan: { ...image, localPath: '/assets/propiedades/ecasa-preview/edificio-bezanilla/plan.webp', sha256: H3, sourcePage: 2 } }];
  return review;
}

test('Ecasa grants protected review independently while its promotional web scope stays pending', () => {
  assert.deepEqual(ecasaPublication(fixture()), { protectedReview: true, publicWeb: false });
  assert.equal(validateEcasaReview(fixture()).length, 2);
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
  const missing=fixture(); missing.projects.pop(); assert.throws(()=>validateEcasaReview(missing), /22 authorized identities/);
  const duplicate=fixture(); duplicate.projects[0]=duplicate.projects[1]; assert.throws(()=>validateEcasaReview(duplicate), /22 authorized identities/);
  const crossed=fixture(); crossed.projects.find(r=>r.slug==='edificio-bezanilla').images[0].localPath='/assets/propiedades/ecasa-preview/ferroparque/photo.webp';
  assert.throws(()=>validateEcasaReview(crossed), /invalid selected path/);
});

test('a duplicated parent PDF cannot authorize plans or photographs for an undocumented numbered stage', () => {
  for (const slug of ['alto-san-joaquin-2','alto-san-joaquin-3','nucleo-costanera-2','lomas-de-puyai-3','terratolten-2']) {
    const review=fixture(), stage=review.projects.find(r=>r.slug===slug), original=review.projects.find(r=>r.slug==='edificio-bezanilla');
    stage.documents=structuredClone(original.documents);
    stage.images=[{...original.images[0],localPath:'/assets/propiedades/ecasa-preview/'+slug+'/photo.webp'}];
    assert.throws(()=>validateEcasaReview(review), /stage-specific evidence remains pending/);
  }
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
  for (const path of ['scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs', 'scripts/ecasa-publication.mjs',
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
  const fichePath=join(root,'edificio-bezanilla.html');
  let fiche=readFileSync(fichePath,'utf8');
  // Add only the synthetic selected paths needed by this isolated build.
  fiche=fiche.replace('</body>',record.images.concat(record.models.map(m=>m.plan)).map(a=>'<img src="'+a.localPath+'" alt="Synthetic fixture">').join('')+'</body>');
  writeFileSync(fichePath,fiche);
  const run=extra=>spawnSync(process.execPath,[join(root,'scripts/package-vercel.mjs')],{cwd:root,
    env:{...process.env,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/ecasa-cartera-definitiva',...extra},encoding:'utf8',timeout:15000});
  return {root,record,run};
}

test('protected Preview fails closed when a selected Ecasa derivative is absent or symbolic', () => {
  for(const symbolic of [false,true]) {
    const f=packagingFixture();
    try {
      const selected=join(f.root,f.record.images[0].localPath.slice(1)); unlinkSync(selected);
      if(symbolic) symlinkSync(join(f.root,f.record.models[0].plan.localPath.slice(1)),selected);
      const result=f.run(); assert.notEqual(result.status,0);
      assert.match(result.stderr,/Incomplete Ecasa protected Preview media batch/);
      assert.equal(existsSync(join(f.root,'dist')),false);
    } finally { rmSync(f.root,{recursive:true,force:true}); }
  }
});

test('a changed derivative hash blocks Preview and the explicit public web profile requires Ecasa rights', () => {
  const f=packagingFixture();
  try {
    writeFileSync(join(f.root,f.record.images[0].localPath.slice(1)),'Changed synthetic bytes');
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
