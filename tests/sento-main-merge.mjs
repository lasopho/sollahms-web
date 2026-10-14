// Current main integration checks; historical fixtures retain their exact old pins.
import test from 'node:test';
import { readPreLeonFile } from './leon-main-preservation.mjs';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { SENTO_SLUGS, SENTO_DOCUMENTS, sentoMainBaseline, sentoFingerprint,
  assertSentoCatalogue, sentoAssets, verifySentoAssets, historicalSentoAssetFiles } from '../scripts/sento-publication.mjs';
import { projects as contexts } from '../lib/project-context.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readPreLeonFile(path);
const json = path => JSON.parse(read(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const review = json('data/sento-review.json');
const audit = json('data/sento-plan-audit.json');
const htmlPins = {
  angamos: '5921af48e73609d102d13186f3d15281e17b255ca442ddc3371ecb855e13bcf3',
  'curico-77': 'e901b0be1c42d747ec0d452d1da699663567f4ac3a7e24e12afbf35ca4220dd1',
  'domeyko-2055': '35bdc47bd418989b100b0ea717b7ea2dd0f28ebe4bb19aea7d599fae6aec681d',
  'jofre-135': '50b8145aa50a1eb0071a8afc136a871d429fa08e479a03bd6c613c276bf386df',
  'mirador-la-florida': 'a65bdc9678aa8f009f326ddf5ce43921d06ae9b8f7f7f435d03bada15c132ed7',
  'plaza-las-condes': '284267bf313b28e89d365bc9ca3d5000e203e2e1b680e7631c24e825367cb9d0',
  'san-ignacio': 'aae00dbd858bd9282086ff168a85f7fe14a7d04469bb273de6dade0fd1ce943c',
};
const git = (...args) => execFileSync('git', args, { cwd: root });

test('main retains 144 identities and all 137 foreign records, HTML, contexts and original assets', () => {
  assert.equal(hash(read('data/sento-main-baseline.json')), 'b97c7de6fded5cc25ed726192e9a0de1ef5c6a68e016b5afe63bb9a332557326');
  assertSentoCatalogue(json('data/proyectos.json'));
  for (const [file, key] of [['data/proyectos.json','catalogue'], ['data/fichas-proyectos.json','research'], ['data/registro-fichas.json','ledger']]) {
    const rows = json(file);
    assert.equal(rows.length, 144);
    assert.equal(rows.filter(row => !SENTO_SLUGS.includes(row.slug)).length, 137);
    assert.equal(sentoFingerprint(rows.filter(row => !SENTO_SLUGS.includes(row.slug))), sentoMainBaseline.otherRowsSha256[file]);
    assert.deepEqual(rows.filter(row => SENTO_SLUGS.includes(row.slug)), review[key]);
  }
  for (const row of sentoMainBaseline.otherHtml) assert.equal(hash(read(row.path)), row.sha256, row.path);
  assert.deepEqual(Object.fromEntries(Object.entries(JSON.parse(read('lib/project-context.mjs').toString().match(/Object\.freeze\(([\s\S]*?)\);/)[1])).filter(([slug]) => !SENTO_SLUGS.includes(slug))), sentoMainBaseline.otherContexts);
  for (const line of git('ls-tree', '-r', sentoMainBaseline.sourceCommit, 'assets').toString().trim().split('\n')) {
    const match = line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/); assert.ok(match);
    const bytes = read(match[2]);
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), match[1], match[2]);
  }
});

test('the seven published fiches retain exactly the validated Preview source and 125 confirmed surface rows', () => {
  assert.equal(hash(read('data/sento-review.json')), 'e44ae176a8fe3384ba33df0306e0a97594fc2a1c692aa423310e9b4b6a1bea5f');
  assert.equal(audit.models.length, 45);
  let models = 0, areas = 0;
  for (const record of review.projects) {
    const html = read(record.slug + '.html').toString(); assert.equal(hash(html), htmlPins[record.slug]);
    const body = html.replace(/<(?:head|script|style)\b[^>]*>[\s\S]*?<\/(?:head|script|style)>/gi, '');
    assert.doesNotMatch(body, /Documentación del proyecto|Ver proyecto en Sento|id="fuentes"|href="#fuentes"|href="[^"]+\.pdf"|13 de octubre de 2026|\bbrochure\b/i);
    for (const model of record.models) {
      const panel = html.match(new RegExp('<article class="sento-model" data-model-code="' + model.code + '">([\\s\\S]*?)</article>'));
      assert.ok(panel, record.slug + ':' + model.code); models++;
      const source = audit.models.find(row => row.slug === record.slug && row.code === model.code);
      assert.ok(source); assert.deepEqual(model.areas, source.areas);
      const visible = source.areas.filter(a => a.publishable !== false && a.valueM2 !== null && !(a.kind === 'terrace' && a.valueM2 === 0));
      const dl = panel[1].match(/<dl class="sento-areas">([\s\S]*?)<\/dl>/)[1];
      assert.equal((dl.match(/<dd>/g) || []).length, visible.length);
      for (const area of visible) assert.ok(dl.includes(new Intl.NumberFormat('es-CL', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(area.valueM2) + ' m²'));
      assert.ok(dl.includes('class="sento-area-total"')); areas += visible.length;
    }
    assert.deepEqual(contexts[record.slug], { name: record.name, url: '/' + record.slug + '.html' });
  }
  assert.equal(models, 45); assert.equal(areas, 125);
});

test('all 277 published image resources retain their verified hashes and independent plan authorities', () => {
  assert.equal(hash(read('data/sento-plan-audit-pdf.json')), '4eff4766ed0a523028787fab5d2be2e372453579a8f4e28840039821759c2ee8');
  assert.equal(hash(read('data/sento-plan-audit-angamos.json')), 'b52d42bc6567614503812e21b5c537d1d2fa4a6ea9305bb8fea3f09a0c5e24ae');
  const assets = sentoAssets(review); assert.equal(assets.length, 283);
  const images = assets.filter(asset => !asset.localPath.endsWith('.pdf')); assert.equal(images.length, 277);
  for (const asset of images) assert.equal(hash(read(asset.localPath.slice(1))), asset.sha256, asset.localPath);
  for (const record of review.projects.filter(row => row.document)) assert.deepEqual([record.document.sha256, record.document.pageCount], SENTO_DOCUMENTS[record.slug]);
});

test('arbitrary price, foreign developer, recalculated C6, borrowed code and source URL changes fail closed', () => {
  const rows = json('data/proyectos.json');
  for (const slug of ['angamos', rows.find(row => row.inmobiliaria !== 'Sento').slug]) {
    const changed = structuredClone(rows); changed.find(row => row.slug === slug).precioDesdeUF = 1;
    assert.throws(() => assertSentoCatalogue(changed), /another main developer|differs from reviewed/);
  }
  const computed = structuredClone(review); computed.projects.find(row => row.slug === 'angamos').models.find(row => row.code === 'C6').areas.find(row => row.kind === 'total').valueM2 = 51.26;
  assert.throws(() => verifySentoAssets(computed), /unverified or recalculated plan surface/);
  const foreign = structuredClone(review); foreign.projects[0].models[0].plan.localPath = '/assets/propiedades/sento/san-ignacio/plano-01.webp';
  assert.throws(() => verifySentoAssets(foreign), /duplicate or foreign model/);
  const wrong = structuredClone(review); wrong.projects.find(row => row.slug === 'mirador-la-florida').models.find(row => row.code === 'A4').plan.sourceUrl = 'https://sento.cl/wp-content/uploads/2025/10/PLANTAS-MIRADOR_A3.jpg';
  assert.throws(() => verifySentoAssets(wrong), /unapproved official plan URL/);
  assert.deepEqual(historicalSentoAssetFiles(['assets/css/unrelated.css']), ['assets/css/unrelated.css']);
});

test('main and Sento automatic deployments remain disabled and source originals stay outside Git', () => {
  const config = json('vercel.json'); assert.equal(config.git.deploymentEnabled.main, false);
  assert.equal(config.git.deploymentEnabled['codex/sento-cartera-documentada'], false);
  assert.equal(git('ls-files', '*.pdf').toString().trim(), '');
  for (const record of review.projects.filter(row => row.document)) assert.ok(git('check-ignore', record.document.localPath.slice(1)).toString().trim());
});

test('a Production build rejects the merged Sento source before creating public output', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'sento-production-gate-'));
  try {
    for (const path of ['scripts/package-vercel.mjs','scripts/brochure-publication.mjs','scripts/sento-publication.mjs','data/sento-baseline.json','data/sento-main-baseline.json','data/sento-review.json']) {
      const target = join(fixture,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readPreLeonFile(path));
    }
    const result = spawnSync(process.execPath,[join(fixture,'scripts/package-vercel.mjs')],{cwd:fixture,env:{...process.env,VERCEL_ENV:'production'},encoding:'utf8'});
    assert.notEqual(result.status,0);assert.match(result.stderr,/The Sento update is authorized for Preview only/);
    assert.ok(!readdirSync(fixture).includes('dist'));
  } finally {rmSync(fixture,{recursive:true,force:true});}
});

test('two real Sento regenerations preserve the validated presentation and all 137 other projects', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'sento-main-regenerate-'));
  try {
    const paths = ['scripts/apply-sento.py','scripts/sento_fiche.py','scripts/project_embed_policy.py','scripts/virtual_tour_policy.py','templates/project-detail.html','templates/sento-plaza-las-condes.html','lib/project-context.mjs',
      ...readdirSync(resolve(root,'data')).filter(name => name.startsWith('sento') || name === 'brochures-sento.json').map(name => 'data/'+name),
      'data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json',...sentoMainBaseline.otherHtml.map(row => row.path),...SENTO_SLUGS.map(slug => slug+'.html')];
    for (const path of paths) {const target=join(fixture,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readPreLeonFile(path));}
    const before = Object.fromEntries(sentoMainBaseline.otherHtml.map(row=>[row.path,hash(read(row.path))]));
    const python=process.env.SOLLAHMS_CI_PYTHON || 'python3';
    for(let i=0;i<2;i++) {
      const result=spawnSync(python,[join(fixture,'scripts/apply-sento.py')],{cwd:fixture,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).preservedOthers,137);
      for(const slug of SENTO_SLUGS)assert.equal(hash(readFileSync(join(fixture,slug+'.html'))),htmlPins[slug]);
      for(const [path,sha] of Object.entries(before))assert.equal(hash(readFileSync(join(fixture,path))),sha);
      for(const file of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json'])assert.equal(sentoFingerprint(JSON.parse(readFileSync(join(fixture,file))).filter(row=>!SENTO_SLUGS.includes(row.slug))),sentoMainBaseline.otherRowsSha256[file]);
    }
  } finally {rmSync(fixture,{recursive:true,force:true});}
});

test('generic and featured generators use the validated Sento presentation without documentation blocks', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'sento-main-generators-'));
  try {
    const paths = [...readdirSync(resolve(root,'scripts')).filter(name=>name.endsWith('.py')).map(name=>'scripts/'+name),
      ...readdirSync(resolve(root,'data')).filter(name=>name.endsWith('.json')).map(name=>'data/'+name),
      'templates/project-detail.html','templates/sento-plaza-las-condes.html',...SENTO_SLUGS.map(slug=>slug+'.html'),'distrito-centro.html','inn-puerto-chico.html','edificio-suecia.html'];
    for (const path of paths) {const target=join(fixture,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readPreLeonFile(path));}
    const python=process.env.SOLLAHMS_CI_PYTHON || 'python3';
    const script = "import importlib.util,json\nfrom pathlib import Path\np=Path('scripts/build-project-details.py')\nspec=importlib.util.spec_from_file_location('details',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nrows=json.loads(Path('data/proyectos.json').read_text());research={r['slug']:r for r in json.loads(Path('data/fichas-proyectos.json').read_text())}\nfor r in rows:\n if r['inmobiliaria']=='Sento':\n  rendered,_,_=m.render(r,research[r['slug']],None);assert rendered==Path(r['slug']+'.html').read_text(),r['slug']\n";
    const generic=spawnSync(python,['-c',script],{cwd:fixture,env:{...process.env,PYTHONPATH:join(fixture,'scripts')},encoding:'utf8'});
    assert.equal(generic.status,0,generic.stderr);
    const featured=spawnSync(python,[join(fixture,'scripts/update-featured-verification.py')],{cwd:fixture,encoding:'utf8'});
    assert.equal(featured.status,0,featured.stderr);
    for(const slug of SENTO_SLUGS)assert.equal(hash(readFileSync(join(fixture,slug+'.html'))),htmlPins[slug]);
  } finally {rmSync(fixture,{recursive:true,force:true});}
});
