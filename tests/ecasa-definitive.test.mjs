import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { assertBrochureCatalogue, BROCHURE_ECASA_SLUGS,
  BROCHURE_ECASA_REMOVED_SLUGS } from '../scripts/brochure-publication.mjs';
import { projects as trustedContexts } from '../lib/project-context.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026';
const read = path => readFileSync(resolve(ROOT, path));
const json = path => JSON.parse(read(path));
const before = path => execFileSync('git', ['show', `${BASELINE}:${path}`], { cwd: ROOT });
const baseline = JSON.parse(before('data/proyectos.json'));
const catalogue = json('data/proyectos.json');
const research = json('data/fichas-proyectos.json');
const ledger = json('data/registro-fichas.json');
// This inventory is independent of the packaging allowlist.
const authorized = {
  'lomas-de-puyai': 'Lomas de Puyai', 'ferroparque': 'FerroParque',
  'edificio-bezanilla': 'Bezanilla', 'endemico': 'Endémico',
  'terratolten-1': 'Terratoltén 1', 'wayra': 'Edificio Wayra',
  'alto-san-joaquin-3': 'Alto San Joaquín 3', 'enlace-mackenna': 'Enlace Mackenna',
  'ferroparque-2': 'Ferroparque 2', 'espacio-victoria': 'Espacio Victoria',
  'lamara': 'Lamara', 'terratolten-3': 'Terratoltén 3',
  'lomas-de-puyai-3': 'Lomas de Puyai 3', 'cumbres-de-penuelas': 'Cumbres de Peñuelas',
  'aires-la-florida-2': 'Aires La Florida 2', 'conecta-huechuraba': 'Conecta Huechuraba',
  'urban-la-florida': 'Urban La Florida', 'alto-san-joaquin': 'Alto San Joaquín',
  'alto-san-joaquin-2': 'Alto San Joaquín 2', 'nucleo-costanera': 'Núcleo Costanera',
  'terratolten-2': 'Terratoltén 2', 'nucleo-costanera-2': 'Núcleo Costanera 2',
};
const retired = ['bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center'];
const added = ['alto-san-joaquin-2', 'alto-san-joaquin-3', 'terratolten-2', 'nucleo-costanera-2'];
const groups = {
  'lomas-de-puyai': ['lomas-de-puyai', 'lomas-de-puyai-3'],
  ferroparque: ['ferroparque', 'ferroparque-2'],
  'terratolten-1': ['terratolten-1', 'terratolten-2', 'terratolten-3'],
  'alto-san-joaquin': ['alto-san-joaquin', 'alto-san-joaquin-2', 'alto-san-joaquin-3'],
  'nucleo-costanera': ['nucleo-costanera', 'nucleo-costanera-2'],
};

test('definitive Ecasa portfolio contains the exact 22 commercial identities and 143 unique projects', () => {
  assert.equal(catalogue.length, 143);
  assert.equal(new Set(catalogue.map(p => p.slug)).size, 143);
  assert.deepEqual(new Set(BROCHURE_ECASA_SLUGS), new Set(Object.keys(authorized)));
  assert.deepEqual(new Set(BROCHURE_ECASA_REMOVED_SLUGS), new Set(retired));
  const ecasa = catalogue.filter(p => p.inmobiliaria === 'Ecasa');
  assert.equal(ecasa.length, 22);
  assert.deepEqual(Object.fromEntries(ecasa.map(p => [p.slug, p.nombre])), authorized);
  assert.equal(catalogue.filter(p => p.inmobiliaria === 'Ingevec').length, 16);
  assertBrochureCatalogue(catalogue);
});

test('all 121 other developers retain exact catalogue, research, ledger and public fiche bytes from main', () => {
  const keep = new Set(baseline.filter(p => p.inmobiliaria !== 'Ecasa').map(p => p.slug));
  assert.equal(keep.size, 121);
  for (const path of ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json']) {
    const current = json(path).filter(p => keep.has(p.slug));
    const original = JSON.parse(before(path)).filter(p => keep.has(p.slug));
    assert.deepEqual(current, original, path);
  }
  for (const slug of keep) assert.deepEqual(read(slug + '.html'), before(slug + '.html'), slug);
  for (const path of ['data/brochures-aj-urbana.json', 'data/brochures-ingevec.json']) {
    assert.deepEqual(read(path), before(path), path + ': existing private approvals');
  }
});

test('only the five named Ecasa retirements disappear from public navigation and trusted form contexts', () => {
  const expected = new Set([...baseline.map(p => p.slug).filter(slug => !retired.includes(slug)), ...added]);
  assert.deepEqual(new Set(catalogue.map(p => p.slug)), expected);
  for (const rows of [research, ledger]) {
    assert.equal(rows.length, 143);
    assert.deepEqual(new Set(rows.map(row => row.slug)), expected);
  }
  assert.deepEqual(new Set(Object.keys(trustedContexts)), expected);
  const sitemap = read('sitemap.xml').toString();
  for (const slug of retired) {
    assert.equal(existsSync(resolve(ROOT, slug + '.html')), false, slug + ': retired public route');
    assert.ok(!sitemap.includes('/' + slug + '.html'), slug + ': sitemap');
    assert.equal(trustedContexts[slug], undefined, slug + ': form context');
  }
  for (const p of catalogue) {
    const html = read(p.slug + '.html').toString();
    for (const slug of retired) assert.ok(!html.includes('/' + slug + '.html'), p.slug + ': retired recommendation');
    assert.ok(sitemap.includes('https://sollahms.cl/' + p.slug + '.html'), p.slug + ': missing sitemap route');
    assert.deepEqual(trustedContexts[p.slug], { name: p.nombre, url: p.detalleUrl });
  }
});

test('stages keep independent routes and explicit matrix links without transferring commercial characteristics', () => {
  for (const [parent, slugs] of Object.entries(groups)) for (const slug of slugs) {
    const p = catalogue.find(p => p.slug === slug);
    const record = research.find(r => r.slug === slug);
    assert.equal(p.proyectoMatrizSlug, parent);
    assert.ok(Number.isInteger(p.etapa) && p.etapa > 0);
    assert.deepEqual(p.etapasRelacionadas.map(stage => stage.slug), slugs);
    assert.ok(record.verifiedFields.includes('etapasRelacionadas'));
    assert.equal(p.etapas, undefined, slug + ': links cannot become a combined commercial offer');
    const html = read(slug + '.html').toString();
    assert.ok(html.includes('data-project-matrix="' + parent + '"'), slug);
    for (const related of slugs) assert.ok(html.includes('href="/' + related + '.html"'), slug + ': ' + related);
    assert.ok(html.includes('href="/' + slug + '.html" aria-current="page"'), slug + ': current stage');
  }
  const matrix=research.find(r=>r.slug==='nucleo-costanera');
  const stage=research.find(r=>r.slug==='nucleo-costanera-2');
  const prior=JSON.parse(before('data/fichas-proyectos.json')).find(r=>r.slug==='nucleo-costanera');
  assert.deepEqual(matrix.virtualTours,[]);
  assert.equal(stage.virtualTours.length,1);
  const {stageVerification,...preservedTour}=stage.virtualTours[0];
  assert.deepEqual(preservedTour,{...prior.virtualTours[0],title:'Piloto virtual oficial · Núcleo Costanera 2'},'Only the verified stage identity and label may change');
  assert.equal(stageVerification.verifiedStageSlug,stage.slug);
  assert.equal(stageVerification.scope,'virtual_tour_only');
  assert.equal(stageVerification.providerTitle,'Nucleo Costanera 2');
  assert.equal(stageVerification.visibleLabel,'NÚCLEO COSTANERA 2');
  assert.equal(stageVerification.screenshotSha256,'6ece36e317446c208542438c1c25c924c322e388a956763b7529bd85ec1511c2');
  const previousTour=before('nucleo-costanera.html').toString().match(/<section id="recorrido".*?<\/section>/s)[0].replaceAll('Piloto virtual oficial · Núcleo Costanera','Piloto virtual oficial · Núcleo Costanera 2');
  assert.ok(read('nucleo-costanera-2.html').toString().includes(previousTour),'Exact approved iframe attributes and automatic loading');
  assert.ok(!read('nucleo-costanera.html').toString().includes('https://tourvirtuales360.cl/pano/ecasa_/nucleo_pilotos/'));
  assert.deepEqual(stage.images,[],'Tour attribution does not transfer photographs');
  assert.equal(ledger.find(r=>r.slug===matrix.slug).recorridosOficiales,0);
  assert.equal(ledger.find(r=>r.slug===stage.slug).recorridosOficiales,1);
});

test('current accredited Ecasa commercial values and every financial engine remain exact', () => {
  const current = new Map(catalogue.map(p => [p.slug, p]));
  for (const p of baseline.filter(p => p.inmobiliaria === 'Ecasa' && !retired.includes(p.slug))) {
    for (const key of ['precioDesdeUF', 'estado', 'entrega']) assert.deepEqual(current.get(p.slug)[key], p[key], p.slug + ': ' + key);
  }
  for (const path of ['data/hipotecario.json', 'assets/js/hipotecario.mjs',
    'assets/js/purchase-capacity-ui.mjs', 'assets/js/mortgage-engine.mjs',
    'api/uf.mjs', 'api/contact.mjs', 'lib/booking-server.mjs',
    'comparador-hipotecario.html', 'contacto.html', 'agenda-asesoria.html']) {
    assert.deepEqual(read(path), before(path), path);
  }
});

test('new stages show only accredited prices, surfaces and media with contextual consultation and booking', () => {
  for (const slug of added) {
    const p = catalogue.find(p => p.slug === slug);
    const r = research.find(r => r.slug === slug);
    const html = read(slug + '.html').toString();
    assert.ok(html.includes('/contacto.html?proyecto=' + slug));
    assert.ok(html.includes('/agenda-asesoria.html?proyecto=' + slug));
    assert.ok(html.includes('/comparador-hipotecario.html?proyecto=' + slug));
    if (p.precioDesdeUF !== null) assert.ok(r.verifiedFields.includes('precioDesdeUF') && r.sourceEvidence.length, slug + ': price evidence');
    if (p.superficieDesdeM2 !== null) assert.ok(r.verifiedFields.includes('superficieDesdeM2') && r.sourceEvidence.length, slug + ': surface evidence');
    if (!r.images.length) assert.equal(p.imagenPrincipal, null, slug + ': invented cover');
    for (const image of r.images) assert.ok(image.sourceUrl || image.sourceSha256, slug + ': image provenance');
    assert.doesNotMatch(html, /\b(?:undefined|NaN)\b/, slug);
  }
});

test('packaging rejects resurrection, wrong developers, duplicate stages and unrelated data mutation', () => {
  const resurrection = structuredClone(catalogue);
  resurrection.push(baseline.find(p => p.slug === retired[0]));
  assert.throws(() => assertBrochureCatalogue(resurrection), /143 projects/);
  const duplicate = structuredClone(catalogue); duplicate[0] = duplicate.find(p => p.slug === added[0]);
  assert.throws(() => assertBrochureCatalogue(duplicate), /143 projects/);
  const wrong = structuredClone(catalogue); wrong.find(p => p.slug === 'wayra').inmobiliaria = 'Otra inmobiliaria';
  assert.throws(() => assertBrochureCatalogue(wrong), /143 projects/);
  const mutation = structuredClone(catalogue); mutation.find(p => p.inmobiliaria !== 'Ecasa').precioDesdeUF += 1;
  assert.throws(() => assertBrochureCatalogue(mutation), /121 projects/);
});

test('reviewed Ecasa manifest and all 22 public fiche outputs match their independently pinned SHA inventory', () => {
  const reviewed=json('tests/ecasa-reviewed-output.json');
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(reviewed.baselineCommit,BASELINE);
  assert.equal(sha(read('data/brochures-ecasa.json')),reviewed.manifestSha256);
  assert.deepEqual(new Set(Object.keys(reviewed.htmlSha256)),new Set(Object.keys(authorized).map(slug=>slug+'.html')));
  for(const [path,digest] of Object.entries(reviewed.htmlSha256)) assert.equal(sha(read(path)),digest,path);
});

test('brochure stage bindings preserve 17 originals, 15 distinct sources and independently checked printed geometry', () => {
  const review=json('data/brochures-ecasa.json');
  assert.equal(review.sourceDocuments.length,17);
  assert.equal(new Set(review.sourceDocuments.map(d=>d.sha256)).size,15);
  const bySlug=new Map(review.projects.map(r=>[r.slug,r]));
  for(const slug of ['alto-san-joaquin-2','alto-san-joaquin-3','nucleo-costanera-2','lomas-de-puyai-3','terratolten-2']) {
    assert.deepEqual(bySlug.get(slug).images,[],slug);
    assert.deepEqual(bySlug.get(slug).models,[],slug);
  }
  const cumbres=bySlug.get('cumbres-de-penuelas');
  const expected=[[17,39.54,4.35,null,43.89,2,1],[18,39.54,7.39,49.36,96.29,2,1],
    [19,45.9,4.77,null,50.67,2,2],[20,45.9,9,57.57,112.47,2,2],
    [21,64.55,5.92,null,70.47,3,2],[22,64.55,10.8,45.04,120.39,3,2],
    [23,39.44,3.64,null,43.08,2,1],[24,72.77,7.24,null,80.01,3,2],[25,72.77,13.16,52.14,138.07,3,2]];
  assert.deepEqual(cumbres.models.map(m=>[m.pagina_brochure,m.superficie_util_m2,m.terraza_m2,
    m.terraza_cubierta_m2??null,m.superficie_total_m2,m.dormitorios,m.banos]),expected);
  const endemico=bySlug.get('endemico');
  assert.deepEqual(endemico.models.map(m=>[m.pagina_brochure,m.superficie_util_m2,m.superficie_interior_m2,m.terraza_m2,
    m.superficie_total_m2,m.dormitorios,m.banos]),[[8,null,72,33,105,2,2],[10,null,84,35,119,3,2],[13,null,102,41,143,3,2],[15,null,119,41,160,4,3]]);
  for(const record of review.projects) {
    const sources=new Map((record.documents??(record.document?[record.document]:[])).map(d=>[d.sha256,d]));
    for(const model of record.models) {
      assert.ok(sources.has(model.sourceSha256),record.slug);
      assert.equal(model.plan.sourceSha256,model.sourceSha256);
      assert.equal(model.plan.sourcePage,model.pagina_brochure);
      assert.equal(model.plan.assetScope,'named_development');
      assert.equal(model.orientacion,null); assert.equal(model.pisos,null);
      assert.equal(model.visuallyVerified,true); assert.equal(model.approximate,true);
    }
  }
});

test('all 130 selected Ecasa photos and plans keep their reviewed hashes and enlarged fiche references', () => {
  const review=json('data/brochures-ecasa.json');
  const assets=review.projects.flatMap(r=>[...r.images,...r.models.map(m=>m.plan)]);
  assert.equal(assets.length,130);
  assert.equal(new Set(assets.map(a=>a.localPath)).size,130);
  for(const record of review.projects) {
    const html=read(record.slug+'.html').toString();
    for(const asset of [...record.images,...record.models.map(m=>m.plan)]) {
      assert.equal(createHash('sha256').update(read(asset.localPath.slice(1))).digest('hex'),asset.sha256,asset.localPath);
      assert.ok(html.includes('href="'+asset.localPath+'"'),asset.localPath+': enlarged view');
      assert.equal(asset.privacySafe,true); assert.equal(asset.visuallyVerified,true);
    }
  }
});
