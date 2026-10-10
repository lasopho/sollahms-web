import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync,
  rmSync, copyFileSync, cpSync, existsSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative, join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { evaluateProject } from '../assets/js/purchase-capacity.mjs';
import { createContactHandler } from '../api/contact.mjs';
import booking from '../api/booking-create.mjs';
import { assertCommercialBytes, commercialPage } from './commercial-html.mjs';

// Supplied brochures enrich only these protected Preview pages and covers.
// They never replace the live source, catalogue, financial or contact data.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = 'e903208160f62cc552e9efa4371a322ef75477b8';
const ORIGINAL_ASSETS = '045fe182ef5d2ad2206df303ba74330aa747050d';
const DATE = '2026-10-10';
const NOW = Date.parse('2026-10-10T15:00:00Z');
const SLUGS = ['centenario-1', 'tocornal', 'vivaceta'];
const FOCUS = new Set(SLUGS);
const AJ_SLUGS = ['downtown-san-martin', 'edificio-teatinos-750',
  'edificio-vista-amunategui', 'monjitas-690', 'vista-morande'];
const REVIEW_PAGES = new Set([...SLUGS, ...AJ_SLUGS]);
const ASSETS = '/assets/propiedades/ingevec-preview/';
const AJ_ASSETS = '/assets/propiedades/aj-urbana-preview/';
const CSS = 'assets/css/aj-brochure-preview.css';
const MANIFEST = 'data/brochures-ingevec.json';
const SOURCE_DOCUMENTS = {
  'centenario-1': { sha256: '958572a482d1af3a5c287a86eb3eba9e6d1c3cd72aa4b68e4aadad1444e0da77', pages: 16, models: 5 },
  'tocornal': { sha256: '04850e397134f55836374b5fd78bfd645a4998459bea406a87b2d5e0f7896fea', pages: 16, models: 5 },
  'vivaceta': { sha256: 'c90fce264f9991b68d3c2bbdb87442a71fe31f75b70244ced236ef5ca0970dfd', pages: 14, models: 4 },
};
// Original embedded image hashes and native geometry independently inventoried
// outside the repository. WebP derivatives may reduce dimensions; no image is
// enlarged or attributed to another document/page.
const NATIVE_IMAGES = {
  'centenario-1': [
    [1, 0, '5af64f402e804a3be87a774e56aa8756cd54575136a8ada3c06422502bb7fe8d', 2712, 1806],
    [6, 0, '4c4afedc167d982386e0c792ffdecee3917a6af7048e64f2e37303d9e72f443a', 3500, 1517],
    [7, 6, 'b066d260ef362286581d3e56cf8fbac5d6280622ec1b7109412b3c83d718c66d', 1052, 592],
    [7, 8, 'f92634c2833eb812dd4901a73ddeecc993c4e1023bdadb91aebae3845a98969a', 1073, 596],
    [8, 0, '5c9b189cfbeb601414c1204a3d8a341b5340fe9a635ec3ed835e97046e89c52d', 2000, 1000],
    [9, 5, '8f546b981a0928dd6010beb7072ce1cb090afcb99669a3a515eba0347856955e', 1062, 589],
    [9, 6, '726b81a28ec931467ee36839208cd8422036ef0eb33d77d63c1127f934892dc1', 1052, 584],
    [9, 7, '0373ecd784a25f2946aa75b0a044bf63dcbe6de0ba635d9e9c6f8f67510fcafc', 952, 595],
    [9, 8, '4597904ba257632dda7be494f20a6b4aded8714d5451f8a4bd0bcada4ad592e0', 1052, 584],
  ],
  'tocornal': [
    [1, 0, '4b64ffe36460b51f3c3668a5cbd773e3e232d16a293e545a2e240862313d6fe1', 2835, 1593],
    [6, 0, 'dee5cbb547df2c31b025fb9b20501c31f4023e59b32b38ec3e777f152f22446e', 2835, 1454],
    [7, 6, 'b6209aa80cffc54cb7c3eb1f2cfb971a5be4db8f8751ef535b0c280a5a7ef83d', 1184, 592],
    [7, 7, 'e1a6f9cc47875a50bc6b2549f1c4c6ac37e0b28902ba9db6614a00be452a7ddd', 969, 758],
    [8, 0, '51f02aa7b4378fb4f920777a61e6ce0b3a5c67b1c24ee261712727e8a36e7ad6', 6000, 2280],
    [9, 5, 'c0127d2232a8a1bd2b11d7e583d73187a47494e724f7267fe65d10905a0e4c3d', 1413, 587],
    [9, 7, '512acb7bac93541d07adecea252a7fd1ab53e4e5a402113ffa82cde19581b358', 1038, 584],
    [9, 8, 'a92e366ebd31e5d5adf1a086c1bb7f48987d7374eec142ec9a2164816b8d4375', 960, 639],
  ],
  'vivaceta': [
    [5, 0, 'c1f1e16dde0a8a48936927caf288f5a8a04b3a35924880519d54900120606e86', 3623, 2002],
    [6, 0, 'e79bcfbed7f0ca7c552f0a3c644af01d0a4ba907e370492bb0f447df6203eb49', 4000, 2250],
    [7, 6, '70cef14fe4ed294cfc203a1541eb23520c5721b9a33b8c62f1281423bc125ce2', 1081, 608],
    [7, 7, '61c209c6f8372ab05bf36e15f24a3aa53b0d69aeea818fbe91fc4583020390d7', 1404, 589],
    [9, 0, '850d000e4fab041380aaad80b21713e24e7b026b9f62c060344d2d8fccbd5be8', 2000, 2000],
  ],
};
// Fixed independently from the rendered source pages. Tocornal's page 12
// prints conflicting bathroom counts, so the website must preserve unknown.
const PRINTED_MODELS = {
  'centenario-1': [
    [10, 'Estudio', 25.37, 0, 25.37, 0, 1],
    [11, '1 dormitorio / 1 baño', 31.94, 3.34, 35.28, 1, 1],
    [12, '2 dormitorios / 2 baños', 41.26, 3.30, 44.56, 2, 2],
    [13, '2 dormitorios / 2 baños', 47.80, 3.08, 50.88, 2, 2],
    [14, '2 dormitorios / 2 baños', 49.01, 3.48, 52.49, 2, 2],
  ],
  'tocornal': [
    [10, 'Estudio', 20.21, 0, 20.21, 0, 1],
    [11, '1 dormitorio / 1 baño', 32.59, 3.95, 36.54, 1, 1],
    [12, '2 dormitorios / baños por confirmar', 43.35, 5.03, 48.38, 2, null],
    [13, '2 dormitorios / 2 baños', 43.83, 4.19, 48.02, 2, 2],
    [14, '2 dormitorios / 2 baños', 46.38, 3.96, 50.34, 2, 2],
  ],
  'vivaceta': [
    [9, '1 dormitorio / 1 baño', 33.09, 2.65, 35.74, 1, 1],
    [10, '2 dormitorios / 1 baño', 42.03, 4.53, 46.56, 2, 1],
    [11, '2 dormitorios / 2 baños', 44.80, 3.14, 47.94, 2, 2],
    [12, '2 dormitorios / 2 baños', 48.74, 5.83, 54.57, 2, 2],
  ],
};
const git = (...args) => execFileSync('git', args, { cwd: ROOT });
const old = (path, ref = BASELINE) => git('show', ref + ':' + path);
const current = (path) => readFileSync(resolve(ROOT, path));
const json = (path) => JSON.parse(current(path));
const catalogue = json('data/proyectos.json');
const financial = json('data/hipotecario.json');
const review = json(MANIFEST);
const ajReview = json('data/brochures-aj-urbana.json');
const records = new Map(review.projects.map(record => [record.slug, record]));
const projectFor = slug => catalogue.find(project => project.slug === slug);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const blobHash = bytes => createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
const tree = (ref, path = '') => git('ls-tree', '-r', ref, ...(path ? ['--', path] : [])).toString().trim().split('\n').filter(Boolean)
  .map(line => { const [meta, file] = line.split('\t'); return { file, hash: meta.split(' ')[2] }; });
const unchanged = file => assertCommercialBytes(file, current(file), old(file));
const listFiles = path => readdirSync(resolve(ROOT, path)).flatMap(name => {
  const file = resolve(ROOT, path, name);
  return statSync(file).isDirectory() ? listFiles(relative(ROOT, file)) : [relative(ROOT, file)];
}).sort();
const htmlFor = slug => current(slug + '.html').toString();
const previewBlocks = html => [...html.matchAll(/<!--INGEVEC_PREVIEW_START-->([\s\S]*?)<!--INGEVEC_PREVIEW_END-->/g)]
  .map(match => match[1]).join('\n');
const publicVersion = html => html.replace(/<!--INGEVEC_PREVIEW_START-->[\s\S]*?<!--INGEVEC_PREVIEW_END-->/g, '')
  .replace(/<!--INGEVEC_PUBLIC_START-->([\s\S]*?)<!--INGEVEC_PUBLIC_END-->/g, '$1');
const attributes = (html, tag) => [...html.matchAll(new RegExp('<' + tag + '\\b[^>]*>', 'gi'))].map(match => {
  const attrs = {};
  for (const item of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[item[1]] = item[2] ?? item[3];
  return attrs;
});
const structuredData = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g)]
  .map(match => match[0]);

function imageDimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const bits = bytes.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
    if (kind === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset < bytes.length;) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      let markerOffset = offset + 1;
      while (bytes[markerOffset] === 0xff) markerOffset++;
      const marker = bytes[markerOffset]; offset = markerOffset + 1;
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(offset);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      }
      offset += length;
    }
  }
  assert.fail('Unsupported or unreadable review image');
}
function assetBytes(slug, asset) {
  assert.ok(asset.localPath.startsWith(ASSETS + slug + '/'), asset.localPath + ': image belongs to a different project');
  assert.match(asset.localPath, /^\/[a-z0-9/_.-]+\.(?:webp|png|jpe?g)$/i);
  assert.ok(!asset.localPath.includes('..'));
  const bytes = current(asset.localPath.slice(1));
  assert.equal(sha256(bytes), asset.sha256, asset.localPath + ': asset hash mismatch');
  assert.deepEqual(imageDimensions(bytes), { width: asset.width, height: asset.height }, asset.localPath);
  assert.equal(asset.sourceSha256, SOURCE_DOCUMENTS[slug].sha256);
  assert.ok(Number.isInteger(asset.sourcePage) && asset.sourcePage >= 1 && asset.sourcePage <= SOURCE_DOCUMENTS[slug].pages);
  return bytes;
}

test('148 source objects and historical financial/research ledgers remain exact; 140 other fichas receive only the approved presentation', () => {
  assert.equal(git('rev-parse', BASELINE).toString().trim(), BASELINE);
  assert.equal(catalogue.length, 148);
  assert.equal(new Set(catalogue.map(project => project.slug)).size, 148);
  for (const file of ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json',
    'data/fuentes-imagenes.json', 'data/hipotecario.json', 'data/catalogo-original-fichas.json',
    'lib/project-context.mjs', 'sitemap.xml', 'robots.txt', 'vercel.json']) unchanged(file);
  const manifestWithoutRights = value => {
    const document = structuredClone(value);
    delete document.publicationRights;
    for (const record of document.projects) {
      delete record.document.sourceChannel;
      for (const image of record.imageReview) delete image.publicationRights;
    }
    return document;
  };
  assert.deepEqual(manifestWithoutRights(ajReview), manifestWithoutRights(JSON.parse(old('data/brochures-aj-urbana.json'))),
    'AJ models, geometry, descriptions and original media hashes remain exact; only provenance/rights change');
  let protectedPages = 0;
  for (const project of catalogue) {
    if (REVIEW_PAGES.has(project.slug)) continue;
    unchanged(project.slug + '.html'); protectedPages++;
  }
  assert.equal(protectedPages, 140);
  for (const { file } of tree(BASELINE)) {
    if (/^[^/]+\.html$/.test(file) && !REVIEW_PAGES.has(file.slice(0, -5))) unchanged(file);
  }
  for (const prefix of ['api', 'lib']) for (const { file } of tree(BASELINE, prefix)) unchanged(file);
});

test('531 original assets and every prior AJ/official asset preserve hashes; only the new scoped image folder is added', () => {
  const historical = tree(ORIGINAL_ASSETS, 'assets');
  assert.equal(historical.length, 531);
  for (const { file, hash } of historical) assert.equal(blobHash(current(file)), hash, file);
  const prior = tree(BASELINE, 'assets');
  for (const { file, hash } of prior) if (file !== CSS) assert.equal(blobHash(current(file)), hash, file);
  const mobileMetrics = '@media(max-width:600px){.ingevec-models .aj-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ingevec-models .aj-metrics dd{overflow-wrap:anywhere}}\n';
  assert.equal(current(CSS).toString(), old(CSS).toString() + mobileMetrics,
    'The shared review CSS may add only the narrow-screen metric wrapping rule');
  assert.deepEqual(listFiles('assets').filter(file => !file.startsWith(ASSETS.slice(1))),
    prior.map(({ file }) => file).sort());
});

test('three public fallbacks retain original content and JSON-LD; five AJ fichas receive only their previously approved additions and commercial presentation', () => {
  for (const slug of SLUGS) {
    const html = htmlFor(slug);
    assert.equal(publicVersion(html), commercialPage(old(slug + '.html'), slug), slug + ': public fallback');
    assert.deepEqual(structuredData(html), structuredData(old(slug + '.html').toString()), slug + ': structured residential offer');
    assert.match(previewBlocks(html), /Modelos y distribuciones/);
    assert.doesNotMatch(previewBlocks(html), /<h2[^>]*>[^<]*(?:Modelos y planos|Plantas)/);
  }
  for (const slug of AJ_SLUGS) {
    const prior = old(slug + '.html').toString();
    const expected = prior.replace(/<!--AJ_PREVIEW_START-->[\s\S]*?<!--AJ_PREVIEW_END-->/g,
      block => block.replaceAll('Modelos y planos', 'Modelos y distribuciones')
        .replace('<h3>Fuente documental de modelos e imágenes</h3>', '<h3>Fuente documental de modelos e imágenes</h3><p class="aj-attribution">Material promocional proporcionado a Sollahms mediante Yapo/IRIS.</p>'));
    assert.equal(htmlFor(slug), commercialPage(expected, slug),
      slug + ': no content changes beyond the earlier brochure additions and approved commercial presentation');
  }
  assert.match(htmlFor('centenario-1'), /Centenario 1151/);
});

test('three supplied sources and fourteen unique models retain document/page evidence and unknown values', () => {
  assert.equal(review.reviewDate, DATE);
  assert.ok(review.baseline === BASELINE || review.baseline === BASELINE.slice(0, 7));
  assert.equal(review.publicationRights.sourceChannel, 'Yapo/IRIS');
  assert.equal(review.publicationRights.protectedPreview, 'authorized_by_user');
  assert.equal(review.publicationRights.individualAssetLicense, 'not_required_when_contract_covered');
  assert.equal(review.publicationRights.contractScope.status, 'pending_contract_scope_verification');
  assert.equal(review.publicationRights.productionPolicy, 'requires_verified_contract_scope');
  assert.deepEqual(review.projects.map(record => record.slug), SLUGS);
  assert.equal(review.projects.reduce((count, record) => count + record.models.length, 0), 14);
  const ids = new Set();
  for (const record of review.projects) {
    const source = SOURCE_DOCUMENTS[record.slug];
    assert.equal(record.name, projectFor(record.slug).nombre);
    assert.equal(record.document.sha256, source.sha256);
    assert.equal(record.document.pageCount, source.pages);
    assert.equal(record.models.length, source.models);
    assert.match(record.document.fileName, /\.pdf$/i);
    const blocks = previewBlocks(htmlFor(record.slug));
    for (const model of record.models) {
      const id = record.slug + ':' + model.modelo;
      assert.ok(!ids.has(id)); ids.add(id);
      assert.equal(model.visuallyVerified, true, id);
      assert.equal(model.approximate, true, id);
      assert.ok(model.sourcePages.includes(model.pagina_brochure));
      for (const page of model.sourcePages) assert.ok(Number.isInteger(page) && page >= 1 && page <= source.pages);
      assert.ok(typeof model.modelo === 'string' && model.modelo.trim());
      assert.ok(typeof model.tipologia === 'string' && model.tipologia.trim());
      for (const key of ['superficie_util_m2', 'superficie_total_m2']) assert.ok(Number.isFinite(model[key]) && model[key] > 0 && model[key] < 150, id + ':' + key);
      assert.ok(model.terraza_m2 === null || Number.isFinite(model.terraza_m2) && model.terraza_m2 >= 0);
      for (const key of ['pisos', 'orientacion']) assert.ok(model[key] === null || typeof model[key] === 'string' && model[key].trim());
      assert.equal(model.plan.sourcePage, model.pagina_brochure);
      assetBytes(record.slug, model.plan);
      assert.ok(model.plan.width >= 1200 && model.plan.height >= 600, id + ': readable enlarged plan');
      const images = attributes(blocks, 'img');
      const image = images.find(image => image.src === model.plan.localPath);
      assert.ok(image && image.alt?.trim(), id + ': labelled plan');
      assert.equal(image.loading, 'lazy');
      assert.ok(attributes(blocks, 'a').some(anchor => anchor.href === model.plan.localPath), id + ': enlargement link');
      assert.ok(attributes(blocks, 'details').some(node => node.id === 'modelo-' + model.modelo.toLowerCase()), id + ': model identifier');
    }
    assert.match(blocks, /referencial|aproximad|ilustrativ/i);
    assert.match(blocks, /disponibilidad/i);
    assert.match(blocks, /por confirmar|pendiente|confirmaci[oó]n/i);
    assert.doesNotMatch(blocks, /href\s*=\s*["'][^"']*\.pdf(?:[?#][^"']*)?["']/i,
      record.slug + ': an original supplied PDF must not become public');
  }
  assert.equal(ids.size, 14);
});

test('selected original images/plans are project scoped, source hashed and exhaust the new asset directory', () => {
  const referenced = new Set();
  const imageHashes = new Set();
  for (const record of review.projects) {
    const blocks = previewBlocks(htmlFor(record.slug));
    const images = attributes(blocks, 'img');
    assert.ok(record.images.length >= 1, record.slug + ': selected gallery');
    for (const asset of record.images) {
      assetBytes(record.slug, asset);
      const native = NATIVE_IMAGES[record.slug].find(row => row[0] === asset.sourcePage && row[1] === asset.imageIndex);
      assert.ok(native, asset.localPath + ': native source page/image');
      assert.equal(asset.originalSha256, native[2], asset.localPath + ': original embedded image hash');
      assert.ok(asset.width <= native[3] && asset.height <= native[4], asset.localPath + ': no native image enlargement');
      assert.ok(Math.abs(asset.width / asset.height - native[3] / native[4]) < 0.003,
        asset.localPath + ': original aspect ratio');
      assert.equal(asset.visuallyVerified, true);
      assert.equal(asset.privacySafe, true);
      assert.ok(asset.width >= 700 && asset.height >= 450 && asset.width * asset.height >= 500_000, asset.localPath);
      assert.ok(!imageHashes.has(asset.sha256), asset.localPath + ': duplicate native image'); imageHashes.add(asset.sha256);
      assert.ok(asset.caption?.trim());
      assert.ok(images.some(image => image.src === asset.localPath && image.alt?.trim()), asset.localPath + ': selected image missing');
      if (asset.replaces) {
        const previous = imageDimensions(current(asset.replaces.slice(1)));
        assert.ok(asset.width * asset.height > previous.width * previous.height, asset.localPath + ': replacement must improve native resolution');
        assert.ok(old(record.slug + '.html').includes(Buffer.from(asset.replaces)), asset.replaces + ': only this project image may be upgraded');
      }
      referenced.add(asset.localPath.slice(1));
    }
    for (const model of record.models) referenced.add(model.plan.localPath.slice(1));
    const cover = record.catalogueCover;
    assert.ok(record.images.some(image => image.localPath === cover.localPath));
    assert.match(cover.alt, /render ilustrativo/i);
    for (const original of attributes(old(record.slug + '.html').toString(), 'img').map(image => image.src).filter(Boolean)) {
      assert.ok(attributes(htmlFor(record.slug), 'img').some(image => image.src === original), original + ': original public image fallback');
      assert.ok(blocks.includes(original) || record.images.some(image => image.replaces === original), original + ': omitted image needs a documented resolution upgrade');
    }
  }
  assert.deepEqual(listFiles(ASSETS.slice(1)), [...referenced].sort(), 'Only selected images and fourteen verified plans belong in the Preview asset directory');
  assert.deepEqual(readdirSync(resolve(ROOT, ASSETS.slice(1))).sort(), [...SLUGS].sort(), 'Candidate identities must stay outside repository and deployment media');
});

test('fourteen independently reviewed printed areas remain exact, editorial identifiers do not invent missing floors/orientations, and Tocornal contradictions stay visible', () => {
  const fields = ['pagina_brochure', 'tipologia', 'superficie_util_m2', 'terraza_m2',
    'superficie_total_m2', 'dormitorios', 'banos'];
  for (const [slug, expected] of Object.entries(PRINTED_MODELS)) {
    const record = records.get(slug);
    assert.deepEqual(record.models.map(model => fields.map(field => model[field])), expected, slug);
    for (const model of record.models) {
      assert.match(model.modelo, new RegExp('-p0?' + model.pagina_brochure + '$'));
      assert.equal(model.pisos, null);
      assert.equal(model.orientacion, null);
      assert.equal(Number((model.superficie_util_m2 + model.terraza_m2).toFixed(2)), model.superficie_total_m2,
        slug + ': independently printed area sum');
    }
  }
  const tocornal = records.get('tocornal');
  for (const page of [10, 12]) {
    const model = tocornal.models.find(model => model.pagina_brochure === page);
    const disclosure = JSON.stringify([model.notes, model.advertencia, model.excepcion, tocornal.warnings]);
    assert.match(disclosure, /inconsisten|discrepan|contradic|no coincide|difiere|confirmar/i, 'Tocornal page ' + page);
  }
  assert.match(previewBlocks(htmlFor('tocornal')), /baños por confirmar/);
});

test('brochure surfaces/typologies do not change existing prices, source confidence or financial categories', () => {
  const input = { incomeClp: 10_000_000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
    savings: 100_000_000, savingsCurrency: 'CLP', monthlySavingsClp: 1_000_000, horizonMonths: 24,
    downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25 };
  const prior = JSON.parse(old('data/proyectos.json'));
  assert.equal(catalogue.filter(project => verifiedProjectPrice(project, DATE)).length, 115);
  for (const slug of SLUGS) {
    const project = projectFor(slug);
    const previous = prior.find(row => row.slug === slug);
    assert.deepEqual(project, previous, slug);
    for (const candidate of [project, { ...project, brochure: records.get(slug) }]) {
      assert.deepEqual(verifiedProjectPrice(candidate, DATE), verifiedProjectPrice(previous, DATE), slug);
      assert.deepEqual(evaluateProject(candidate, input, financial, DATE), evaluateProject(previous, input, financial, DATE), slug);
    }
    for (const [path, label] of [['/contacto.html', 'Consultar proyecto'], ['/agenda-asesoria.html', 'Agendar Asesoría'],
      ['/comparador-hipotecario.html', 'Simular crédito hipotecario']]) {
      const actions = attributes(htmlFor(slug), 'a').filter(anchor => anchor.href?.startsWith(path + '?'));
      assert.ok(actions.length > 0, slug + ': ' + label);
      for (const anchor of actions) assert.deepEqual([...new URL(anchor.href, 'https://sollahms.cl').searchParams], [['proyecto', slug]]);
    }
  }
});

test('Preview consultation and booking guards reject all three synthetic submissions before accessing any provider', async t => {
  let calls = 0, keys = 0;
  const handler = createContactHandler({ projectDataset: catalogue, mortgageDataset: financial, now: () => NOW,
    getEnvironment: () => 'preview', getApiKey: () => { keys++; return 'synthetic-test-key'; },
    fetchImpl: async () => { calls++; throw new Error('Protected Preview must not contact a provider.'); } });
  const previousFetch = globalThis.fetch;
  const previousEnv = process.env.VERCEL_ENV;
  globalThis.fetch = async () => { calls++; throw new Error('Protected Preview must not create a real booking.'); };
  process.env.VERCEL_ENV = 'preview';
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previousEnv;
  });
  for (const slug of SLUGS) {
    const body = { nombre: 'Prueba de brochure', correo: 'qa@ingevec.test.invalid', telefono: '+56900000000',
      mensaje: 'Prueba sintética sin envío real.', proyecto: slug, website: '', consent: true, startedAt: NOW - 5000 };
    const contactResponse = await handler.fetch(new Request('https://ingevec.test.invalid/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://ingevec.test.invalid' }, body: JSON.stringify(body),
    }));
    assert.equal(contactResponse.status, 503, slug + ': consultation');
    assert.equal((await contactResponse.json()).code, 'preview_read_only');
    const bookingResponse = await booking.fetch(new Request('https://ingevec.test.invalid/api/booking-create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2030-01-07', time: '10:00', nombre: 'Cliente', apellido: 'Prueba',
        correo: 'qa@ingevec.test.invalid', telefono: '+56900000000', website: '', proyecto: slug }),
    }));
    assert.equal(bookingResponse.status, 503, slug + ': booking');
    assert.equal((await bookingResponse.json()).code, 'preview_read_only');
  }
  assert.equal(calls, 0);
  assert.equal(keys, 0);
});

function createPackagingFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'sollahms-ingevec-build-'));
  for (const folder of ['scripts', 'data', 'assets/css', 'assets/js']) mkdirSync(join(fixture, folder), { recursive: true });
  copyFileSync(resolve(ROOT, 'scripts/package-vercel.mjs'), join(fixture, 'scripts/package-vercel.mjs'));
  copyFileSync(resolve(ROOT, 'scripts/brochure-publication.mjs'), join(fixture, 'scripts/brochure-publication.mjs'));
  for (const path of ['data/proyectos.json', 'data/hipotecario.json', MANIFEST, 'data/brochures-aj-urbana.json',
    CSS, 'sitemap.xml', 'robots.txt']) copyFileSync(resolve(ROOT, path), join(fixture, path));
  for (const folder of [ASSETS, AJ_ASSETS]) {
    cpSync(resolve(ROOT, folder.slice(1)), join(fixture, folder.slice(1)), { recursive: true });
  }
  for (const project of catalogue) copyFileSync(resolve(ROOT, project.slug + '.html'), join(fixture, project.slug + '.html'));
  const sentinel = '/* historical public asset */';
  writeFileSync(join(fixture, 'assets/js/unchanged.js'), sentinel);
  return fixture;
}
function packageFixture(fixture, environment, extraEnv = {}) {
  const env = { ...process.env, VERCEL_GIT_COMMIT_REF: 'codex/integracion-financiera-sollahms' };
  Object.assign(env, extraEnv);
  if (environment === undefined) delete env.VERCEL_ENV; else env.VERCEL_ENV = environment;
  return execFileSync(process.execPath, [join(fixture, 'scripts/package-vercel.mjs')], { cwd: fixture, env, stdio: 'pipe' });
}

function verifySyntheticContract(fixture) {
  // Test-only evidence: this function never changes the repository manifests.
  for (const name of ['brochures-aj-urbana.json', 'brochures-ingevec.json']) {
    const path = join(fixture, 'data', name);
    const manifest = JSON.parse(readFileSync(path));
    Object.assign(manifest.publicationRights.contractScope, {
      status: 'verified_contract', evidenceSha256: 'a'.repeat(64), verifiedOn: DATE,
      permittedOrigins: ['https://sollahms.cl'], permittedUses: ['web_promotion'],
      coveredDocuments: manifest.projects.map(record => record.document.sha256),
    });
    writeFileSync(path, JSON.stringify(manifest));
  }
}

test('a verified contract yields identical 148 fichas, covers and 140 media in Preview and an offline public web build', () => {
  const fixture = createPackagingFixture();
  try {
    assert.throws(() => packageFixture(fixture, 'preview', { SOLLAHMS_BROCHURE_PROFILE: 'public-web' }), /requires verified/);
    verifySyntheticContract(fixture);
    packageFixture(fixture, 'preview', { SOLLAHMS_BROCHURE_PROFILE: 'public-web' });
    const pages = new Map(catalogue.map(project => [project.slug,
      readFileSync(join(fixture, 'dist', project.slug + '.html'), 'utf8')
        .replace('<meta name="robots" content="noindex, nofollow">\n', '')]));
    const previewCatalogue = readFileSync(join(fixture, 'dist/data/proyectos.json'));
    const previewInventory = readFileSync(join(fixture, '.vercel/brochure-build-inventory.json'));
    assert.equal(JSON.parse(previewInventory).media.length, 140);
    assert.equal(JSON.parse(previewInventory).contractualCoverageVerified, true);
    // This is a local fixture build, never a deployment or Production action.
    packageFixture(fixture, 'production', { SOLLAHMS_BROCHURE_PROFILE: 'public-web' });
    assert.ok(readFileSync(join(fixture, 'dist/data/proyectos.json')).equals(previewCatalogue));
    assert.ok(readFileSync(join(fixture, '.vercel/brochure-build-inventory.json')).equals(previewInventory));
    for (const [slug, html] of pages) assert.equal(readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8'), html, slug);
    for (const asset of JSON.parse(previewInventory).media) {
      assert.equal(sha256(readFileSync(join(fixture, 'dist', asset.path.slice(1)))), asset.sha256);
    }
    assert.equal(existsSync(join(fixture, 'dist/data/brochures-ingevec.json')), false);
    assert.equal(existsSync(join(fixture, 'dist/data/brochures-aj-urbana.json')), false);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('covered media missing after a merge blocks the build instead of silently dropping galleries, plans and covers', () => {
  const fixture = createPackagingFixture();
  try {
    verifySyntheticContract(fixture);
    rmSync(join(fixture, ASSETS.slice(1)), { recursive: true });
    for (const environment of ['preview', 'production', undefined]) {
      assert.throws(() => packageFixture(fixture, environment), /reproducible source package required/);
    }
    assert.equal(existsSync(join(fixture, 'dist')), false);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('contract-covered output copies only selected derivatives and rejects symbolic selected media', () => {
  const fixture = createPackagingFixture();
  try {
    verifySyntheticContract(fixture);
    const folder = join(fixture, ASSETS.slice(1), SLUGS[0]);
    for (const name of ['unselected.webp', 'contract.pdf', 'internal.xlsx']) writeFileSync(join(folder, name), 'synthetic unapproved content');
    packageFixture(fixture, 'production');
    for (const name of ['unselected.webp', 'contract.pdf', 'internal.xlsx']) {
      assert.equal(existsSync(join(fixture, 'dist', ASSETS.slice(1), SLUGS[0], name)), false, name);
    }
    const selected = join(fixture, review.projects[0].catalogueCover.localPath.slice(1));
    const target = join(fixture, 'synthetic-outside-cover.webp');
    copyFileSync(selected, target);
    rmSync(selected);
    symlinkSync(target, selected);
    assert.throws(() => packageFixture(fixture, 'preview'), /regular local file|Symbolic links/);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('real Preview packaging changes only eight authorized card covers, publishes fourteen Ingevec models, and hides all private manifests/documents', () => {
  const fixture = createPackagingFixture();
  try {
    packageFixture(fixture, 'preview');
    const published = JSON.parse(readFileSync(join(fixture, 'dist/data/proyectos.json')));
    assert.equal(published.length, 148);
    assert.deepEqual(published.map(project => project.slug), catalogue.map(project => project.slug));
    let changed = 0;
    for (let index = 0; index < catalogue.length; index++) {
      const before = catalogue[index], after = published[index];
      if (!REVIEW_PAGES.has(before.slug)) { assert.deepEqual(after, before); continue; }
      const record = records.get(before.slug) ?? ajReview.projects.find(record => record.slug === before.slug);
      assert.equal(after.imagenPrincipal, record.catalogueCover.localPath);
      assert.equal(after.imagenAlt, record.catalogueCover.alt);
      assert.ok(existsSync(join(fixture, 'dist', after.imagenPrincipal.slice(1))));
      assert.deepEqual({ ...after, imagenPrincipal: before.imagenPrincipal, imagenAlt: before.imagenAlt }, before,
        before.slug + ': cover selection must not change financial, commercial, source or navigation data');
      assert.notEqual(after.imagenPrincipal, before.imagenPrincipal); changed++;
    }
    assert.equal(changed, 8);
    for (const slug of SLUGS) {
      const html = readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8');
      const expected = htmlFor(slug).replace(/<!--INGEVEC_PUBLIC_START-->[\s\S]*?<!--INGEVEC_PUBLIC_END-->/g, '')
        .replace(/<!--INGEVEC_PREVIEW_(?:START|END)-->/g, '').replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
      assert.equal(html, expected, slug);
      assert.match(html, /Modelos y distribuciones/);
      assert.doesNotMatch(html, /<!--INGEVEC_(?:PUBLIC|PREVIEW)_(?:START|END)-->/);
      for (const model of records.get(slug).models) assert.ok(html.includes(model.plan.localPath));
    }
    for (const manifest of [MANIFEST, 'data/brochures-aj-urbana.json']) assert.equal(existsSync(join(fixture, 'dist', manifest)), false);
    assert.deepEqual(readdirSync(join(fixture, 'dist/data')).sort(), ['hipotecario.json', 'proyectos.json']);
    assert.deepEqual(readdirSync(join(fixture, 'dist', ASSETS.slice(1))).sort(), [...SLUGS].sort());
    assert.ok(listFiles(ASSETS.slice(1)).every(path => !path.endsWith('.pdf')));
    assert.equal(readFileSync(join(fixture, 'dist/robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('Production and unspecified environment exclude both brochure folders/CSS and reproduce all 148 original source objects plus eight public fallbacks', () => {
  const fixture = createPackagingFixture();
  try {
    // First package Preview so the next builds must actively remove any old
    // review output rather than merely leave an initially empty directory.
    packageFixture(fixture, 'preview');
    for (const environment of ['production', undefined]) {
      packageFixture(fixture, environment);
      assert.ok(readFileSync(join(fixture, 'dist/data/proyectos.json')).equals(old('data/proyectos.json')));
      for (const slug of SLUGS) assert.equal(readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8'), commercialPage(old(slug + '.html'), slug), slug);
      for (const slug of AJ_SLUGS) {
        const original = old(slug + '.html').toString().replace(/<!--AJ_PREVIEW_START-->[\s\S]*?<!--AJ_PREVIEW_END-->/g, '')
          .replace(/<!--AJ_PUBLIC_START-->([\s\S]*?)<!--AJ_PUBLIC_END-->/g, '$1');
        assert.equal(readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8'), commercialPage(original, slug), slug);
      }
      for (const folder of [ASSETS, AJ_ASSETS]) assert.equal(existsSync(join(fixture, 'dist', folder.slice(1))), false);
      assert.equal(existsSync(join(fixture, 'dist', CSS)), false);
      assert.equal(readFileSync(join(fixture, 'dist/assets/js/unchanged.js'), 'utf8'), '/* historical public asset */');
      for (const manifest of [MANIFEST, 'data/brochures-aj-urbana.json']) assert.equal(existsSync(join(fixture, 'dist', manifest)), false);
      assert.ok(readFileSync(join(fixture, 'dist/robots.txt')).equals(current('robots.txt')));
    }
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('real packaging fails closed for absent authorization, unrelated branch, cross-project covers and altered image bytes', () => {
  const fixture = createPackagingFixture();
  try {
    assert.throws(() => packageFixture(fixture, 'preview', { VERCEL_GIT_COMMIT_REF: 'codex/unapproved-brochure-test' }), /Unexpected branch/);
    rmSync(join(fixture, MANIFEST));
    assert.throws(() => packageFixture(fixture, 'preview'), /ENOENT|manifest|authorization/i,
      'A missing brochure manifest must not publish unreviewed covers');
    const unauthorized = structuredClone(review);
    unauthorized.publicationRights.protectedPreview = 'pending';
    writeFileSync(join(fixture, MANIFEST), JSON.stringify(unauthorized));
    assert.throws(() => packageFixture(fixture, 'preview'), /authorization.*(?:missing|invalid)|authoriz/i);
    const crossProject = structuredClone(review);
    crossProject.projects[0].catalogueCover.localPath = crossProject.projects[1].catalogueCover.localPath;
    writeFileSync(join(fixture, MANIFEST), JSON.stringify(crossProject));
    assert.throws(() => packageFixture(fixture, 'preview'), /Unverified.*catalogue cover/i);
    writeFileSync(join(fixture, MANIFEST), current(MANIFEST));
    writeFileSync(join(fixture, review.projects[0].catalogueCover.localPath.slice(1)), 'altered synthetic cover bytes');
    assert.throws(() => packageFixture(fixture, 'preview'), /does not match.*verified gallery|hash|sha/i);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('real packager checks non-cover galleries/plans and privacy flags, and rejects both unapproved candidate identities', () => {
  const fixture = createPackagingFixture();
  try {
    const crossProjectPlan = structuredClone(review);
    crossProjectPlan.projects[0].models[0].plan = crossProjectPlan.projects[1].models[0].plan;
    writeFileSync(join(fixture, MANIFEST), JSON.stringify(crossProjectPlan));
    assert.throws(() => packageFixture(fixture, 'preview'), /does not match.*verified gallery or plan/i);
    const unsafe = structuredClone(review);
    unsafe.projects[0].images[0].privacySafe = false;
    writeFileSync(join(fixture, MANIFEST), JSON.stringify(unsafe));
    assert.throws(() => packageFixture(fixture, 'preview'), /privacy review.*missing/i);
    writeFileSync(join(fixture, MANIFEST), current(MANIFEST));
    const first = review.projects[0];
    const gallery = first.images.find(image => image.localPath !== first.catalogueCover.localPath);
    assert.ok(gallery, 'A non-cover gallery image is needed to test complete media validation');
    for (const asset of [gallery, first.models[0].plan]) {
      const path = join(fixture, asset.localPath.slice(1));
      const before = readFileSync(path);
      writeFileSync(path, 'altered synthetic non-cover media');
      assert.throws(() => packageFixture(fixture, 'preview'), /does not match.*verified gallery/i,
        asset.localPath + ': every published media asset must be hash checked');
      writeFileSync(path, before);
    }
    for (const slug of ['los-alerces', 'valle-los-ingleses-iii']) {
      const expanded = [...catalogue, { slug, nombre: 'Candidato sintético de prueba' }];
      writeFileSync(join(fixture, 'data/proyectos.json'), JSON.stringify(expanded));
      assert.throws(() => packageFixture(fixture, 'preview'), /exactly 148 existing projects/);
      writeFileSync(join(fixture, 'data/proyectos.json'), current('data/proyectos.json'));
      writeFileSync(join(fixture, slug + '.html'), '<!doctype html><p>Candidato privado de prueba</p>');
      for (const environment of ['preview', 'production', undefined]) {
        assert.throws(() => packageFixture(fixture, environment), /candidate pages.*outside.*deployment/i,
          slug + ': candidate pages must not enter any deployment environment');
      }
      rmSync(join(fixture, slug + '.html'));
    }
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});


test('new supplied brochure plaintext remains ignored and absent from the public Git index', () => {
  const files = listFiles(ASSETS.slice(1));
  assert.equal(files.length, 36);
  assert.equal(git('ls-files', '--', ASSETS.slice(1)).toString().trim(), '',
    'New supplied images must not enter the public repository as plaintext');
  const ignored = git('check-ignore', '--', ...files).toString().trim().split('\n').sort();
  assert.deepEqual(ignored, files, 'Every new plan/photo must remain excluded from Git');
  assert.match(current('.gitignore').toString(), /^\/assets\/propiedades\/ingevec-preview\/$/m);
});

test('Git Preview without all 36 private Ingevec assets preserves the three exact public fichas and all five AJ reviews', () => {
  const fixture = createPackagingFixture();
  try {
    rmSync(join(fixture, ASSETS.slice(1)), { recursive: true, force: true });
    packageFixture(fixture, 'preview');
    const published = JSON.parse(readFileSync(join(fixture, 'dist/data/proyectos.json')));
    assert.equal(published.length, 148);
    assert.deepEqual(published.map(project => project.slug), catalogue.map(project => project.slug));
    let changedCovers = 0;
    for (let index = 0; index < catalogue.length; index++) {
      const before = catalogue[index], after = published[index];
      if (!AJ_SLUGS.includes(before.slug)) { assert.deepEqual(after, before, before.slug); continue; }
      const record = ajReview.projects.find(record => record.slug === before.slug);
      assert.equal(after.imagenPrincipal, record.catalogueCover.localPath);
      assert.equal(after.imagenAlt, record.catalogueCover.alt);
      assert.deepEqual({ ...after, imagenPrincipal: before.imagenPrincipal, imagenAlt: before.imagenAlt }, before);
      assert.ok(existsSync(join(fixture, 'dist', after.imagenPrincipal.slice(1))));
      assert.notEqual(after.imagenPrincipal, before.imagenPrincipal); changedCovers++;
    }
    assert.equal(changedCovers, 5, 'Only the five existing AJ cover overrides survive a Git-only build');
    for (const slug of SLUGS) {
      const html = readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8');
      const expected = commercialPage(old(slug + '.html'), slug).replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
      assert.equal(html, expected, slug + ': old images, maps, tours, navigation and forms must remain exact');
      assert.doesNotMatch(html, /ingevec-preview|Modelos y distribuciones|INGEVEC_(?:PUBLIC|PREVIEW)/);
    }
    for (const slug of AJ_SLUGS) {
      const html = readFileSync(join(fixture, 'dist', slug + '.html'), 'utf8');
      const expected = htmlFor(slug).replace(/<!--AJ_PUBLIC_START-->[\s\S]*?<!--AJ_PUBLIC_END-->/g, '')
        .replace(/<!--AJ_PREVIEW_(?:START|END)-->/g, '').replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
      assert.equal(html, expected, slug + ': absent Ingevec media must not disable the existing AJ review');
      assert.match(html, /Modelos y distribuciones/);
    }
    assert.equal(existsSync(join(fixture, 'dist', ASSETS.slice(1))), false);
    assert.ok(existsSync(join(fixture, 'dist', AJ_ASSETS.slice(1))));
    assert.ok(existsSync(join(fixture, 'dist', CSS)));
    assert.equal(existsSync(join(fixture, 'dist', MANIFEST)), false);
    assert.equal(readFileSync(join(fixture, 'dist/robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('Preview rejects partial Ingevec uploads instead of publishing a mixture of incomplete review fichas', () => {
  const first = review.projects[0];
  const gallery = first.images.find(image => image.localPath !== first.catalogueCover.localPath);
  assert.ok(gallery);
  for (const absent of [first.catalogueCover, gallery, first.models[0].plan]) {
    const fixture = createPackagingFixture();
    try {
      rmSync(join(fixture, absent.localPath.slice(1)));
      assert.throws(() => packageFixture(fixture, 'preview'), /Ingevec.*(?:missing|partial|incomplete)|(?:partial|incomplete).*Ingevec|ENOENT/i,
        absent.localPath + ': one missing reviewed asset must block the whole build');
      assert.equal(existsSync(join(fixture, 'dist')), false, 'An incomplete upload cannot create public output');
    } finally { rmSync(fixture, { recursive: true, force: true }); }
  }
  const fixture = createPackagingFixture();
  try {
    // Even a complete single project is still only a partial batch; all three
    // reviewed identities and their full assets must travel together.
    for (const slug of SLUGS.slice(1)) rmSync(join(fixture, ASSETS.slice(1), slug), { recursive: true });
    assert.throws(() => packageFixture(fixture, 'preview'), /Ingevec.*(?:missing|partial|incomplete)|(?:partial|incomplete).*Ingevec|ENOENT/i);
    assert.equal(existsSync(join(fixture, 'dist')), false);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
