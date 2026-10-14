// Historical suites continue auditing their original developer scope. The new
// Norte Verde suite independently audits every replacement and all 117 others.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORTE_VERDE_SLUGS, NORTE_VERDE_RETIRED_SLUGS, NORTE_VERDE_PACKAGER_SHA256, NORTE_VERDE_ECASA_QUALITY_SHA256, readNorteVerdeBaseline } from '../scripts/norte-verde-publication.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const baseline = readNorteVerdeBaseline();
const oldSlugs = new Set([...NORTE_VERDE_SLUGS, ...NORTE_VERDE_RETIRED_SLUGS]);
const originals = new Map();
const original = file => {
  if (!originals.has(file)) originals.set(file, execFileSync('git', ['show', baseline.commit + ':' + file], { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 }));
  return originals.get(file);
};
export function restoreNorteVerdeData(value, file = 'data/proyectos.json') {
  const rows = typeof value === 'string' || Buffer.isBuffer(value) ? JSON.parse(value) : value;
  if (rows.length !== 134) return rows;
  const oldRows = file === 'data/proyectos.json' ? baseline.projects : JSON.parse(original(file)).filter(row => oldSlugs.has(row.slug));
  const bySlug = new Map(rows.filter(row => !oldSlugs.has(row.slug)).map(row => [row.slug, row]));
  assert.equal(bySlug.size, 117, file + ': projection must preserve 117 other identities');
  for (const row of oldRows) bySlug.set(row.slug, structuredClone(row));
  return baseline.catalogueOrder.map(slug => bySlug.get(slug));
}

export function restoreNorteVerdeContext(file, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const source = bytes.toString();
  if (file === 'lib/project-context.mjs') {
    const oldSource = original(file).toString();
    const object = text => JSON.parse(text.match(/export const projects = Object\.freeze\(([\s\S]*?)\);/)[1]);
    const rows = object(source);
    if (Object.keys(rows).length !== 134) return bytes;
    const historical = object(oldSource);
    const others = value => Object.fromEntries(Object.entries(value).filter(([slug]) => !oldSlugs.has(slug)));
    assert.deepEqual(others(rows), others(historical), file + ': other project contexts must remain exact');
    for (const name of ['projectAliases', 'projectStages']) {
      const registry = text => JSON.parse(text.match(new RegExp('export const ' + name + ' = Object\\.freeze\\(([\\s\\S]*?)\\);'))[1]);
      assert.deepEqual(registry(source), registry(oldSource), file + ': stage/alias contexts must remain exact');
    }
    return Buffer.from(source.replace(/(export const projects = Object\.freeze\()[\s\S]*?(\);)/,
      (_, begin, end) => begin + JSON.stringify(historical, null, 2) + end));
  }
  if (file === 'sitemap.xml') {
    const urls = text => [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    const current = urls(source), previous = urls(original(file).toString());
    if (current.length !== 140) return bytes;
    assert.deepEqual(current, previous.filter(url => !NORTE_VERDE_RETIRED_SLUGS.some(slug => url.endsWith('/' + slug + '.html'))),
      'Only the three Norte Verde retirements may change historical sitemap routes');
    return original(file);
  }
  if (file === 'docs/registro-fichas-proyectos.md' && source.includes('Catálogo real: 134 proyectos')) {
    const oldSource = original(file).toString();
    const inventory = text => text.split('## Inventario completo')[1].split('\n## ')[0].split('\n').filter(line => line.startsWith('| ['));
    const oldRows = inventory(oldSource), currentRows = inventory(source);
    const other = line => !line.includes('| Norte Verde |');
    assert.deepEqual(currentRows.filter(other), oldRows.filter(other), 'Other developer ledger report rows must remain exact');
    return Buffer.from(source.replace(/(## Inventario completo[\s\S]*?\n\| ---[^\n]*\n)[\s\S]*?(?=\n## |$)/,
      (_, heading) => heading + oldRows.join('\n') + '\n').replace('Catálogo real: 134 proyectos', 'Catálogo real: 137 proyectos'));
  }
  if (file === 'vercel.json') {
    const configuration = JSON.parse(source);
    if (Object.hasOwn(configuration.git?.deploymentEnabled ?? {}, 'codex/norte-verde-cartera-definitiva')) {
      assert.equal(configuration.git.deploymentEnabled['codex/norte-verde-cartera-definitiva'], false);
      delete configuration.git.deploymentEnabled['codex/norte-verde-cartera-definitiva'];
      return Buffer.from(JSON.stringify(configuration, null, 2) + '\n');
    }
  }
  return bytes;
}

export function readHistoricalNorteVerdeFile(file) {
  if (oldSlugs.has(file.replace(/\.html$/, ''))) return original(file);
  return readFileSync(new URL('../' + file, import.meta.url));
}

export function restoreNorteVerdeContexts(contexts) {
  if (Object.keys(contexts).length !== 134) return contexts;
  const oldContexts = Object.fromEntries(baseline.projects.map(row => [row.slug, { name: row.nombre, url: row.detalleUrl }]));
  const projected = { ...contexts, ...oldContexts };
  return Object.fromEntries(baseline.catalogueOrder.map(slug => [slug, projected[slug]]));
}

export function projectNorteVerdeFile(file, value) {
  if (file === 'scripts/ecasa-image-quality.mjs') {
    assert.equal(createHash('sha256').update(value).digest('hex'), NORTE_VERDE_ECASA_QUALITY_SHA256,
      'Only the exact guarded134project extension may change the historical Ecasa validator');
    return original(file);
  }
  if (file === 'scripts/package-vercel.mjs') {
    assert.equal(createHash('sha256').update(value).digest('hex'), NORTE_VERDE_PACKAGER_SHA256,
      'Only the independently pinned Preview-only Norte Verde packager may extend the historical publication code');
    return original(file);
  }
  if (oldSlugs.has(file.replace(/\.html$/, ''))) return original(file);
  if (['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json'].includes(file)) {
    const rows = JSON.parse(value);
    return rows.length === 134 ? Buffer.from(JSON.stringify(restoreNorteVerdeData(rows, file), null, 2) + '\n') : value;
  }
  return restoreNorteVerdeContext(file, value);
}

// These synthetic fixtures exercise the prior AJ/Ingevec/Ecasa release policy.
// Real Norte Verde release tests always execute the actual Preview-only packager.
export function prepareHistoricalNorteVerdePackagingFixture(destination, { packager = true } = {}) {
  const install = (file, bytes) => { const path = resolve(destination, file); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes); };
  // The guarded brochure/Ecasa modules may import this successor even when
  // the synthetic fixture exercises its archived137project release policy.
  for (const file of ['scripts/norte-verde-publication.mjs', 'data/norte-verde-baseline.json']) {
    install(file, readFileSync(resolve(ROOT, file)));
  }
  if (packager) install('scripts/package-vercel.mjs', original('scripts/package-vercel.mjs'));
  const cataloguePath = resolve(destination, 'data/proyectos.json');
  if (!existsSync(cataloguePath)) return;
  const rows = JSON.parse(readFileSync(cataloguePath));
  if (rows.length !== 134) return;
  for (const file of ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json']) {
    if (existsSync(resolve(destination, file))) install(file, projectNorteVerdeFile(file, readFileSync(resolve(destination, file))));
  }
  for (const slug of oldSlugs) install(slug + '.html', original(slug + '.html'));
  for (const file of ['lib/project-context.mjs', 'sitemap.xml', 'vercel.json']) {
    if (existsSync(resolve(destination, file))) install(file, projectNorteVerdeFile(file, readFileSync(resolve(destination, file))));
  }
  for (const file of ['data/brochures-norte-verde.json', 'assets/brochures/norte-verde', 'assets/propiedades/norte-verde']) {
    rmSync(resolve(destination, file), { recursive: true, force: true });
  }
}
