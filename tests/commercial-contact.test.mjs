import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { applyCommercialContact, whatsappUrl } from '../scripts/commercial-contact.mjs';

test('all source pages have the correct static WhatsApp contact and project context', async () => {
  const projects = JSON.parse(await readFile(new URL('../data/proyectos.json', import.meta.url)));
  let pages = 0, fiches = 0;
  for (const name of await readdir(new URL('../', import.meta.url))) {
    if (!name.endsWith('.html')) continue;
    const html = await readFile(new URL('../' + name, import.meta.url), 'utf8');
    const project = projects.find(p => p.slug + '.html' === name);
    if (html.includes('<footer')) {
      assert.ok(html.includes(`href="${whatsappUrl(project?.nombre)}"`), name);
      assert.ok(html.includes('WhatsApp: +56 9 4850 2440'), name);
      pages++; if (project) fiches++;
    }
    assert.ok(!/tel:\+?569(?:48502440|96253757)/.test(html), name);
    assert.ok(!/9\s*9625\s*3757/.test(html), name);
    for (const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(script[1]);
  }
  assert.ok(pages > 100); assert.ok(fiches > 100);
  console.log({ pages, fiches });
});

test('third party phones are preserved, names encoded, rendering idempotent', () => {
  const third = '<a href="tel:+56912345678">Tercero</a>';
  assert.equal(applyCommercialContact(third), third);
  const name = 'Ñuñoa & Sol';
  const rendered = applyCommercialContact('<footer></footer>', name);
  assert.equal(applyCommercialContact(rendered, name), rendered);
  assert.ok(new URL(whatsappUrl(name)).searchParams.get('text').includes(name));
  assert.ok(!applyCommercialContact('<a href="tel:+56996253757">+56 9 9625 3757</a>').includes('tel:'));
});
