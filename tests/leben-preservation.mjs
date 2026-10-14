import assert from 'node:assert/strict';
import { projectNorteVerdeFile } from './norte-verde-preservation.mjs';

export const NORDICO_SLUG = 'edificio-nordico';
export function originalLebenHtml(bytes) {
  const text = bytes.toString();
  for (const kind of ['PREVIEW', 'PUBLIC']) {
    assert.equal((text.match(new RegExp('<!--LEBEN_' + kind + '_START-->', 'g')) ?? []).length,
      (text.match(new RegExp('<!--LEBEN_' + kind + '_END-->', 'g')) ?? []).length, 'Unpaired Leben source marker');
  }
  return Buffer.from(text.replace(/<!--LEBEN_PREVIEW_START-->[\s\S]*?<!--LEBEN_PREVIEW_END-->/g, '')
    .replace(/<!--LEBEN_PUBLIC_START-->([\s\S]*?)<!--LEBEN_PUBLIC_END-->/g, '$1'));
}
export function assertPreservedSource(path, current, baseline) {
  current = projectNorteVerdeFile(path, current);
  if (['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json'].includes(path)) {
    const rows = JSON.parse(current);
    assert.equal(rows.filter(row => row.slug === NORDICO_SLUG).length, 1);
    assert.equal(rows.length, 137);
    assert.deepEqual(rows.filter(row => row.slug !== NORDICO_SLUG), JSON.parse(baseline), path + ': the 136 existing objects must remain exact');
  } else if (path === 'data/fuentes-imagenes.json') {
    const entries = Object.entries(JSON.parse(current));
    const added = entries.filter(([url]) => url.startsWith('https://nordico.ileben.cl/'));
    assert.equal(added.length, 3);
    for (const [, image] of added) assert.equal(image.sourceUrl, 'https://nordico.ileben.cl/');
    assert.deepEqual(Object.fromEntries(entries.filter(([url]) => !url.startsWith('https://nordico.ileben.cl/'))), JSON.parse(baseline));
  } else if (path === 'sitemap.xml') {
    const urls = bytes => [...bytes.toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    const locations = urls(current);
    assert.equal(locations.filter(url => url === 'https://sollahms.cl/edificio-nordico.html').length, 1);
    assert.deepEqual(locations.filter(url => url !== 'https://sollahms.cl/edificio-nordico.html'), urls(baseline));
  } else if (path === 'vercel.json') {
    const configuration = JSON.parse(current);
    assert.equal(configuration.git.deploymentEnabled['codex/leben-brochures-nordico'], false);
    delete configuration.git.deploymentEnabled['codex/leben-brochures-nordico'];
    assert.deepEqual(configuration, JSON.parse(baseline), 'Only the manual Leben deployment gate may extend the reviewed configuration');
  } else if (path.endsWith('.html')) {
    assert.deepEqual(originalLebenHtml(current), baseline, path + ': content outside the complementary Leben block changed');
  } else assert.deepEqual(current, baseline, path);
}
