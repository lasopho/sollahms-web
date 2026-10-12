import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const runtime = readFileSync(new URL('../assets/js/project-embeds.js', import.meta.url), 'utf8');
const source = 'https://www.google.com/maps?output=embed&q=Paicav%C3%AD+1485';
const fallback = 'https://www.google.com/maps/search/?api=1&query=Paicav%C3%AD+1485';

function viewer({ src = source, recovery = fallback, kind = 'map', hosts = ['www.google.com'] } = {}) {
  const events = new Map();
  const created = [];
  let replacement;
  let removed = false;
  let timerCalls = 0;
  const attrs = { src, loading: 'lazy', title: 'Mapa de la dirección publicada' };
  const shell = {
    replaceWith(panel) { replacement = panel; removed = true; },
    remove() { removed = true; },
  };
  const frame = {
    dataset: { embedFallback: recovery, projectEmbed: kind },
    getAttribute(name) { return attrs[name] ?? null; },
    closest(selector) { assert.equal(selector, '.project-embed'); return removed ? null : shell; },
    addEventListener(name, handler, options) { events.set(name, { handler, options }); },
  };
  const document = {
    getElementById(id) { assert.equal(id, 'project-embed-hosts'); return { textContent: JSON.stringify(hosts) }; },
    querySelectorAll(selector) { assert.equal(selector, 'iframe[data-project-embed]'); return [frame]; },
    createElement(tag) {
      const element = { tag, children: [], append(child) { this.children.push(child); } };
      created.push(element);
      return element;
    },
  };
  const unsupportedScheduling = () => { timerCalls++; throw new Error('Generic scheduling cannot establish a map failure'); };
  runInNewContext(runtime, { document, URL, setTimeout: unsupportedScheduling,
    setInterval: unsupportedScheduling, IntersectionObserver: unsupportedScheduling });
  return {
    attrs, created, events,
    get replacement() { return replacement; },
    get removed() { return removed; },
    get timerCalls() { return timerCalls; },
    dispatch(name) {
      const event = events.get(name);
      if (!event) return;
      if (event.options?.once) events.delete(name);
      event.handler({ type: name, target: frame });
    },
  };
}

test('a healthy native-lazy map creates no external link and generic load cannot activate recovery', () => {
  const map = viewer();
  assert.equal(map.created.length, 0);
  assert.equal(map.replacement, undefined);
  assert.equal(map.removed, false);
  assert.deepEqual([...map.events.keys()], ['error']);
  assert.equal(map.events.get('error').options.once, true);
  map.dispatch('load');
  assert.equal(map.replacement, undefined);
  assert.equal(map.timerCalls, 0);
  assert.deepEqual(map.attrs, { src: source, loading: 'lazy', title: 'Mapa de la dirección publicada' });
});

test('an actual map error replaces the failed viewer with exactly one secure recovery link', () => {
  const map = viewer();
  map.dispatch('error');
  assert.equal(map.removed, true);
  assert.equal(map.replacement.tag, 'p');
  assert.equal(map.replacement.className, 'project-embed-fallback');
  assert.equal(map.replacement.children.length, 1);
  const link = map.replacement.children[0];
  assert.equal(link.tag, 'a');
  assert.equal(link.href, fallback);
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(link.textContent, 'Abrir en Google Maps ↗');
  map.dispatch('error');
  assert.equal(map.created.length, 2);
});

test('map recovery rejects unsafe and unregistered fallback URLs even after an error', () => {
  for (const recovery of ['http://www.google.com/maps', 'javascript:alert(1)',
    'https://user:password@www.google.com/maps', 'https://unapproved.test/maps', 'not a URL']) {
    const map = viewer({ recovery });
    map.dispatch('error');
    assert.equal(map.replacement, undefined, recovery);
    assert.equal(map.removed, false, recovery);
    assert.equal(map.created.length, 0, recovery);
  }
});

test('an invalid iframe source is removed without creating a redundant external action', () => {
  for (const src of ['http://www.google.com/maps', 'javascript:alert(1)',
    'https://user:password@www.google.com/maps', 'https://unapproved.test/maps', 'not a URL']) {
    const map = viewer({ src });
    assert.equal(map.removed, true, src);
    assert.equal(map.created.length, 0, src);
    assert.equal(map.events.size, 0, src);
  }
});

test('registered tour recovery keeps its existing behavior without healthy-viewer external links', () => {
  const tourUrl = 'https://my.matterport.com/show/?m=example';
  const tour = viewer({ src: tourUrl, recovery: tourUrl, kind: 'tour', hosts: ['my.matterport.com'] });
  assert.equal(tour.created.length, 0);
  tour.dispatch('load');
  assert.equal(tour.replacement, undefined);
  tour.dispatch('error');
  assert.equal(tour.replacement.children[0].href, tourUrl);
  assert.equal(tour.replacement.children[0].textContent, 'Abrir experiencia externa ↗');
});
