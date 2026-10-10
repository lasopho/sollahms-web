import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// This reviewed commit contains all eight brochure integrations, their actual
// scope status and the 148-page financial integration. The request changes
// visitor-facing presentation; these tests independently protect the content.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = '7a2732ae333b6a4d119cc2b651583daacbab8755';
const git = (...args) => execFileSync('git', args, { cwd: ROOT });
const current = (path) => readFileSync(resolve(ROOT, path));
const old = (path) => git('show', `${BASELINE}:${path}`);
const projects = JSON.parse(current('data/proyectos.json'));
const snapshots = projects.map(({ slug }) => ({ slug, before: old(`${slug}.html`).toString(), after: current(`${slug}.html`).toString() }));
const decode = (value) => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[a-f0-9]+);/gi, (entity) => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  return named[entity.toLowerCase()] ?? String.fromCodePoint(entity[2].toLowerCase() === 'x'
    ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10));
});
function elements(html) {
  return [...html.matchAll(/<([a-z][a-z0-9:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi)].map((match) => {
    const attrs = {};
    for (const attr of match[0].slice(match[1].length + 1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    return { tag: match[1].toLowerCase(), attrs };
  });
}
function visible(html) {
  return decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(?:script|style|head)\b[^>]*>[\s\S]*?<\/(?:script|style|head)>/gi, '')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const byTag = (html, tag) => elements(html).filter((item) => item.tag === tag);
const head = (html) => html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];
const numericSpecs = (html) => [...html.matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
  .map((item) => (decode(item[1].replace(/<[^>]+>/g, ' ')).match(/\d+(?:[.,]\d+)*/g) ?? []));
const blobHash = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('commercial presentation preserves all 148 ordered identities and private source records byte for byte', () => {
  assert.equal(projects.length, 148);
  assert.equal(new Set(projects.map((item) => item.slug)).size, 148);
  assert.deepEqual(current('data/proyectos.json'), old('data/proyectos.json'));
  for (const path of git('ls-tree', '-r', '--name-only', BASELINE, '--', 'data').toString().trim().split('\n')) {
    assert.deepEqual(current(path), old(path), path);
  }
  for (const path of ['docs/registro-fichas-proyectos.md', 'docs/verificacion-fichas.md',
    'docs/catalogo-22-validacion-2026-10-01.md', 'docs/brochures-yapo-iris-publicacion.md']) {
    assert.deepEqual(current(path), old(path), path);
  }
});

test('all 148 visitor-facing fichas omit research sections, contract provenance and audit captions', () => {
  const forbidden = /\b(?:Yapo|IRIS|SHA-?256|hash(?:es)?|auditor[ií]a|procedencia documental|verificaci[oó]n|documentad[oa]s?)\b|(?:fuentes? oficiales?|fecha de verificaci[oó]n|[uú]ltima revisi[oó]n|revisado el|fuentes y verificaci[oó]n|brochure\s*·\s*p[aá]g|registrado en el cat[aá]logo)/i;
  for (const { slug, after } of snapshots) {
    const nodes = elements(after);
    assert.equal(nodes.filter(({ attrs }) => ['fuentes', 'fuentes-verificadas'].includes(attrs.id)).length, 0, slug);
    assert.equal(nodes.filter(({ attrs }) => ['#fuentes', '#fuentes-verificadas'].includes(attrs.href)).length, 0, slug);
    assert.doesNotMatch(visible(after), forbidden, slug);
    const ids = nodes.flatMap(({ attrs }) => attrs.id ? [attrs.id] : []);
    assert.equal(new Set(ids).size, ids.length, `${slug}: duplicated ids`);
    for (const { attrs } of nodes.filter(({ tag }) => tag === 'a')) {
      if (attrs.href?.startsWith('#')) assert.ok(ids.includes(attrs.href.slice(1)), `${slug}: stale anchor ${attrs.href}`);
    }
  }
});

test('every fiche retains exact SEO, scripts, image resources, enlarged plans, embeds and numerical specifications', () => {
  let images = 0;
  let models = 0;
  for (const { slug, before, after } of snapshots) {
    assert.equal(head(after), head(before), `${slug}: SEO changed`);
    assert.deepEqual([...after.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((match) => match[0]),
      [...before.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((match) => match[0]), `${slug}: scripts/host configuration changed`);
    const oldImages = byTag(before, 'img').map(({ attrs }) => without(attrs, ['alt']));
    const newImages = byTag(after, 'img').map(({ attrs }) => without(attrs, ['alt']));
    assert.deepEqual(newImages, oldImages, `${slug}: image resource/dimension/loading changed`);
    for (const { attrs } of byTag(after, 'img')) assert.ok(attrs.alt?.trim(), `${slug}: accessible description missing`);
    images += newImages.length;
    const embeds = (html) => elements(html).filter(({ tag, attrs }) => tag === 'iframe' || attrs['data-embed-src'])
      .map(({ tag, attrs }) => ({ tag, attrs: without(attrs, ['title', 'data-embed-title', 'aria-label']) }));
    assert.deepEqual(embeds(after), embeds(before), `${slug}: map/tour/security changed`);
    const plansAndMaps = (html) => byTag(html, 'a').filter(({ attrs }) => attrs.href?.startsWith('/assets/') || attrs.href?.includes('google.com/maps'))
      .map(({ attrs }) => without(attrs, ['aria-label']));
    assert.deepEqual(plansAndMaps(after), plansAndMaps(before), `${slug}: enlarged-plan/image/map link changed`);
    const modelIds = (html) => elements(html).flatMap(({ attrs }) => attrs.id?.startsWith('modelo-') ? [attrs.id] : []);
    assert.deepEqual(modelIds(after), modelIds(before), `${slug}: model identification changed`);
    models += modelIds(after).length;
    assert.deepEqual(numericSpecs(after), numericSpecs(before), `${slug}: commercial/model figures changed`);
  }
  assert.ok(images > 600, '148-fiche image audit unexpectedly incomplete');
  assert.equal(models, 92, 'All 78 AJ and 14 Ingevec models must remain');
});

test('all styles, financial references, catalogue controls, backend and form/action contexts stay exact', () => {
  for (const directory of ['assets', 'api', 'lib']) {
    for (const line of git('ls-tree', '-r', BASELINE, '--', directory).toString().trim().split('\n').filter(Boolean)) {
      const [meta, path] = line.split('\t');
      assert.equal(blobHash(current(path)), meta.split(' ')[2], path);
    }
  }
  for (const path of ['proyectos.html', 'index.html', 'contacto.html', 'agenda-asesoria.html',
    'comparador-hipotecario.html', 'sitemap.xml', 'robots.txt', 'vercel.json']) {
    assert.deepEqual(current(path), old(path), path);
  }
  for (const { slug, before, after } of snapshots) {
    const controls = (html) => elements(html).filter(({ tag }) => ['form', 'input', 'select', 'textarea'].includes(tag));
    assert.deepEqual(controls(after), controls(before), `${slug}: form changed`);
    const actions = (html) => byTag(html, 'a').filter(({ attrs }) => /^\/(?:contacto|agenda-asesoria|comparador-hipotecario)\.html(?:\?|$)/.test(attrs.href ?? ''));
    assert.deepEqual(actions(after), actions(before), `${slug}: contextual action changed`);
    for (const route of ['contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html']) {
      assert.ok(actions(after).some(({ attrs }) => attrs.href === `/${route}?proyecto=${slug}`), `${slug}: ${route} project context missing`);
    }
  }
});

test('all 140 supplied media derivatives retain approved identity, hashes and contractual scope status', () => {
  let checked = 0;
  for (const manifestPath of ['data/brochures-aj-urbana.json', 'data/brochures-ingevec.json']) {
    const manifest = JSON.parse(current(manifestPath));
    assert.equal(manifest.publicationRights.contractScope.status, 'pending_contract_scope_verification');
    for (const record of manifest.projects) {
      for (const image of record.images) {
        assert.equal(sha256(current(image.localPath.slice(1))), image.sha256, image.localPath);
        checked++;
      }
      for (const model of record.models) {
        assert.equal(sha256(current(model.plan.localPath.slice(1))), model.plan.sha256, model.plan.localPath);
        checked++;
      }
    }
  }
  assert.equal(checked, 140);
});

test('direct commercial cautions survive alongside current prices, referential plans and ambiguous alternatives', () => {
  const records = new Map(JSON.parse(current('data/fichas-proyectos.json')).map((record) => [record.slug, record]));
  let priced = 0;
  let enquire = 0;
  for (const { slug, after } of snapshots) {
    const project = projects.find((item) => item.slug === slug);
    const record = records.get(slug);
    const price = record.verifiedFields?.includes('precioDesdeUF')
      ? (Object.hasOwn(record.updates ?? {}, 'precioDesdeUF') ? record.updates.precioDesdeUF : project.precioDesdeUF) : null;
    const text = visible(after);
    if (Number.isFinite(price) && price > 0) {
      const amount = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(price);
      assert.ok(text.includes(`UF ${amount}`), `${slug}: verified public price missing`);
      assert.match(text, /Precio(?: y disponibilidad sujetos| sujeto) a (?:condiciones comerciales|disponibilidad y condiciones comerciales)/, `${slug}: price caution missing`);
      priced++;
    } else {
      assert.match(text, /Consultar precio/, `${slug}: uncertain price marketed as confirmed`);
      enquire++;
    }
  }
  assert.equal(priced + enquire, 148);
  assert.ok(priced > 100 && enquire > 20);
  const find = (slug) => snapshots.find((item) => item.slug === slug).after;
  for (const slug of ['downtown-san-martin', 'edificio-teatinos-750', 'edificio-vista-amunategui',
    'monjitas-690', 'vista-morande', 'centenario-1', 'tocornal', 'vivaceta']) {
    assert.match(find(slug), /class="aj-scope aj-commercial-note"/, `${slug}: unit/stage caution lost`);
    assert.match(visible(find(slug)), /referenciales|referencial|unidad y etapa/);
  }
  for (const [slug, id] of [['downtown-san-martin', 'modelo-3'], ['edificio-teatinos-750', 'modelo-4']]) {
    const model = find(slug).match(new RegExp(`<details class="aj-model" id="${id}">([\\s\\S]*?)<\\/details>`))?.[1];
    assert.ok(model, `${slug}: discrepant model missing`);
    assert.match(visible(model), /superficie total indicada difiere de la suma de superficie útil y terraza/i, `${slug}: meaningful surface discrepancy lost`);
    assert.match(visible(model), /Confirma las medidas de la unidad/, `${slug}: model caution missing`);
  }
  const downtown13 = find('downtown-san-martin').match(/<details class="aj-model" id="modelo-13">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(downtown13, 'Downtown model 13 missing');
  assert.match(visible(downtown13), /Confirma la tipología de la unidad disponible/, 'Downtown model 13 commercial caution missing');
  assert.match(visible(find('mapocho-3521-edificio-a')), /conjunto Mapocho 3521/);
  for (const slug of ['froilan-roa-5731-torre-norte', 'froilan-roa-5731-torre-sur']) {
    assert.match(visible(find(slug)), /conjunto Froilán Roa 5731/);
    assert.match(visible(find(slug)), /cada torre deben confirmarse/);
  }
  assert.match(visible(find('edificio-verne')), /corresponden exclusivamente a oficinas/);
});

test('future English rendering applies the same audit exclusion while preserving plans, SEO and direct cautions', () => {
  const fixture = '<!doctype html><html lang="en"><head><title>Example | Sollahms</title><link rel="canonical" href="https://sollahms.cl/example.html"></head><body>'
    + '<nav><a href="#sources">Sources</a><a href="#gallery">Gallery</a></nav>'
    + '<section id="sources"><h2>Official sources</h2><p>Verification date: 2026-10-10</p><p>Document provenance: Yapo/IRIS</p><p>SHA256: synthetic-evidence</p></section>'
    + '<section id="audit-record"><h2>Document provenance</h2><p>Internal research records.</p></section>'
    + '<section id="gallery"><h2>Brochure images</h2><img src="/assets/example.webp" alt="Illustrative architectural render" width="1600" height="900"></section>'
    + '<div class="aj-scope"><p>Indicative layouts. Confirm the available unit.</p></div>'
    + '<details class="aj-model" id="modelo-estudio-p10"><summary>Model Studio · page 10</summary><p>Total according to brochure</p><a href="/assets/plan.webp" target="_blank" rel="noopener noreferrer">Enlarge plan</a><div class="aj-plan-caption"><span>Brochure · page 10</span></div></details>'
    + '<p>Prices and availability must be confirmed when enquiring.</p></body></html>';
  const python = 'import sys; sys.path.insert(0, "scripts"); from fiche_presentation import commercialize_fiche; print(commercialize_fiche(sys.stdin.read(), "centenario-1", "en"), end="")';
  const render = (input) => execFileSync('python3', ['-c', python], { cwd: ROOT, input, encoding: 'utf8' });
  const output = render(fixture);
  assert.equal(head(output), head(fixture));
  assert.deepEqual(byTag(output, 'img'), byTag(fixture, 'img'));
  assert.ok(output.includes('href="/assets/plan.webp"'));
  assert.ok(output.includes('id="modelo-estudio-p10"'));
  assert.doesNotMatch(visible(output), /Sources|Verification date|Document provenance|Yapo|IRIS|SHA256|page 10/i);
  assert.ok(!output.includes('href="#sources"'));
  assert.match(visible(output), /Indicative total floor area/);
  assert.match(visible(output), /Plan layouts and floor areas are indicative/);
  assert.match(visible(output), /Prices and availability must be confirmed/);
  assert.equal(render(output), output, 'English presentation must be idempotent');
});

test('privacy notice is additive, generic and paired with the documented future English presentation policy', () => {
  const html = current('privacidad.html').toString();
  const added = /<section\b[^>]*aria-labelledby="informacion-inmobiliaria-material-grafico"[^>]*>[\s\S]*?<\/section>\n/g;
  const sections = [...html.matchAll(added)];
  assert.equal(sections.length, 1);
  assert.equal(html.replace(added, ''), old('privacidad.html').toString(), 'Existing privacy policy changed');
  const text = visible(sections[0][0]);
  assert.match(text, /Información inmobiliaria y material gráfico/);
  assert.match(text, /canales de comercialización autorizados/);
  assert.match(text, /fotografías, renders y planos pueden ser referenciales/i);
  assert.match(text, /Desde UF/);
  assert.match(text, /Consultar precio/);
  assert.match(text, /no constituye por sí sola una oferta comercial vigente/);
  assert.doesNotMatch(text, /Yapo|IRIS|SHA-?256|hash|comisi[oó]n|contrato|descuento/i);
  const policy = current('docs/fichas-presentacion-comercial.md').toString();
  assert.match(policy, /Property information and visual material/);
  for (const label of ['Sources', 'Official sources', 'Verification date', 'Document provenance']) assert.ok(policy.includes(label), label);
  assert.match(policy, /comparador y la referencia de UF/);
  const englishPages = git('ls-tree', '-r', '--name-only', BASELINE).toString().split('\n')
    .filter((path) => path.endsWith('.html')).filter((path) => /<html\b[^>]*lang="en(?:-[^"]+)?"/i.test(current(path).toString()));
  assert.deepEqual(englishPages, [], 'An existing English route requires the same visitor-facing regression checks');
});
