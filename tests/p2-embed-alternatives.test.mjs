import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { P2_EMBED_SCOPE, restoreP2EmbedFile } from './p2-embed-scope.mjs';
import { projectP2MediaFile } from './p2-media-scope.mjs';

const runtime = readFileSync(new URL('../assets/js/project-embeds.js', import.meta.url), 'utf8');
const mapUrl = 'https://www.google.com/maps?output=embed&q=Published+address';
const mapFallback = 'https://www.google.com/maps/search/?api=1&query=Published+address';
function fixture({ kind = 'map', src = mapUrl, fallback = mapFallback, href = fallback, hosts = ['www.google.com'] } = {}) {
  const events = new Map();
  const created = [];
  const alternative = { removed: false, matches: selector => selector === 'p[data-project-embed-alternative]',
    querySelector: selector => { assert.equal(selector, 'a'); return { getAttribute: name => name === 'href' ? href : null }; },
    remove() { this.removed = true; } };
  const shell = { removed: false, nextElementSibling: alternative,
    remove() { this.removed = true; }, replaceWith(node) { this.removed = true; this.replacement = node; } };
  const attrs = { src, title: 'Published project location', loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin' };
  const frame = { dataset: { projectEmbed: kind, embedFallback: fallback },
    getAttribute: name => attrs[name] ?? null,
    closest: selector => { assert.equal(selector, '.project-embed'); return shell.removed ? null : shell; },
    addEventListener: (name, handler, options) => events.set(name, { handler, options }) };
  const document = { getElementById: () => ({ textContent: JSON.stringify(hosts) }),
    querySelectorAll: () => [frame],
    createElement: tag => { const node = { tag, children: [], append(child) { this.children.push(child); } }; created.push(node); return node; } };
  const rejectScheduling = () => { throw new Error('Timers cannot establish cross-origin visual success or failure'); };
  runInNewContext(runtime, { document, URL, setTimeout: rejectScheduling, setInterval: rejectScheduling, IntersectionObserver: rejectScheduling });
  return { alternative, shell, created, attrs, events, dispatch(name) {
    const event = events.get(name); if (!event) return;
    if (event.options?.once) events.delete(name);
    event.handler();
  } };
}

test('P2 a silent blocked map keeps its static keyboard link without a load or error event', () => {
  const page = fixture();
  assert.equal(page.alternative.removed, false);
  assert.equal(page.shell.removed, false);
  assert.equal(page.created.length, 0);
  assert.deepEqual([...page.events.keys()], ['error']);
  assert.equal(page.attrs.loading, 'lazy');
});

test('P2 a network error removes only the failed frame and preserves exactly its static alternative', () => {
  const page = fixture();
  page.dispatch('error');
  page.dispatch('error');
  assert.equal(page.shell.removed, true);
  assert.equal(page.alternative.removed, false);
  assert.equal(page.created.length, 0);
  assert.equal(page.shell.replacement, undefined);
});

test('P2 a tour load never certifies a scene and its alternative survives the later error', () => {
  const url = 'https://my.matterport.com/show/?m=registered';
  const page = fixture({ kind: 'tour', src: url, fallback: url, hosts: ['my.matterport.com'] });
  page.dispatch('load');
  assert.equal(page.alternative.removed, false);
  assert.equal(page.shell.removed, false);
  page.dispatch('error');
  assert.equal(page.alternative.removed, false);
  assert.equal(page.shell.removed, true);
  assert.equal(page.created.length, 0);
});

test('P2 runtime rejects a tampered static link and uses only the approved error fallback', () => {
  const tourUrl = 'https://my.matterport.com/show/?m=registered';
  for (const href of ['http://my.matterport.com/show/', 'javascript:alert(1)', 'https://unapproved.test/tour',
    'https://user:pass@my.matterport.com/show/', tourUrl + '&m=Other']) {
    const page = fixture({ kind: 'tour', src: tourUrl, fallback: tourUrl, hosts: ['my.matterport.com'], href });
    assert.equal(page.alternative.removed, true, href);
    page.dispatch('error');
    assert.equal(page.shell.replacement.children[0].href, tourUrl, href);
    assert.equal(page.shell.replacement.children[0].rel, 'noopener noreferrer');
  }
});

test('P2 invalid iframe sources remove both the iframe and adjacent static action', () => {
  for (const src of ['http://www.google.com/maps', 'javascript:alert(1)', 'https://unapproved.test/map']) {
    const page = fixture({ src });
    assert.equal(page.shell.removed, true);
    assert.equal(page.alternative.removed, true);
    assert.equal(page.created.length, 0);
  }
});

test('P2 exact historical projection rejects edits to every reviewed HTML and source file', () => {
  for (const file of Object.keys(P2_EMBED_SCOPE)) {
    const actual = projectP2MediaFile(file, readFileSync(new URL('../' + file, import.meta.url)));
    const before = restoreP2EmbedFile(file, actual);
    assert.notDeepEqual(actual, before, file);
    assert.deepEqual(restoreP2EmbedFile(file, before), before, file);
    assert.throws(() => restoreP2EmbedFile(file, Buffer.concat([actual, Buffer.from('\n')])), /Unreviewed P2 embed file/, file);
  }
  const fiche = projectP2MediaFile('bcome.html', readFileSync(new URL('../bcome.html', import.meta.url))).toString();
  for (const [before, after] of [['Paicav', 'Other-address'],
    ['/contacto.html?proyecto=bcome', '/contacto.html?proyecto=other-project'],
    ['loading="lazy"', 'loading="eager"']]) {
    assert.ok(fiche.includes(before));
    assert.throws(() => restoreP2EmbedFile('bcome.html', Buffer.from(fiche.replace(before, after))), /Unreviewed P2 embed file/);
  }
});
