import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isP3AgendaLabelSuccessor, restoreP3AgendaLabels } from './p3-agenda-labels-scope.mjs';
import { restoreP1IdempotencyFile } from './p1-idempotency-preservation.mjs';

const ROOT = new URL('../', import.meta.url);
const FILE = 'agenda-asesoria.html';
const actual = readFileSync(new URL(FILE, ROOT));
const html = actual.toString('utf8');
const original = execFileSync('git', ['show', 'e3b66f806ebdbc032b704f9bf53ea0f33df7cb2a:' + FILE], { cwd: ROOT });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('UX-003 gives all six booking labels an existing 12px style and preserves their accessible control bindings', () => {
  const targets = ['booking-date', 'booking-time', 'booking-nombre', 'booking-apellido', 'booking-correo', 'booking-telefono'];
  const visibleLabels = [...html.matchAll(/<label\b([^>]+)>([^<]+)<\/label>/g)].filter(match => !match[1].includes('booking-website'));
  assert.equal(visibleLabels.length, 6);
  assert.deepEqual(visibleLabels.map(match => match[1].match(/\bfor="([^"]+)"/)[1]), targets);
  for (const [, attributes] of visibleLabels) {
    assert.match(attributes, /\bclass="[^"]*\btext-\[12px\]/);
    assert.doesNotMatch(attributes, /text-\[9px\]/);
    const id = attributes.match(/\bfor="([^"]+)"/)[1];
    assert.equal([...html.matchAll(new RegExp('<(?:input|select)\\b[^>]*\\bid="' + id + '"', 'g'))].length, 1, id);
  }
  const css = readFileSync(new URL('assets/css/agenda-asesoria.tailwind.css', ROOT), 'utf8');
  assert.ok(css.includes('.text-\\[12px\\]{font-size:12px}'), 'The local stylesheet must render the larger labels without a network build');
});

test('UX-003 changes exactly six label sizes while every booking script, control, identity and source byte stays exact', () => {
  assert.equal(sha(original), 'a94cdf089701c5c94c54643c02f09f05d9973a41f5e5c3f4b25473697351ada4');
  assert.equal(sha(actual), '052ccebaa414dcd9a84db148fe296214068d5312fb7ddbd5a7120a517e81c465');
  assert.equal(isP3AgendaLabelSuccessor(FILE, actual), true);
  assert.deepEqual(restoreP3AgendaLabels(FILE, actual), original);
  assert.deepEqual(restoreP3AgendaLabels(FILE, original), original);
  assert.deepEqual(restoreP1IdempotencyFile(FILE, actual), restoreP1IdempotencyFile(FILE, original));
  const beforeLines = original.toString().split('\n');
  const afterLines = html.split('\n');
  assert.equal(beforeLines.length, afterLines.length);
  const changed = beforeLines.flatMap((line, index) => line === afterLines[index] ? [] : [[line, afterLines[index]]]);
  assert.equal(changed.length, 6);
  for (const [before, after] of changed) {
    assert.match(before, /^<label /);
    assert.equal(after, before.replace('text-[9px]', 'text-[12px]'));
  }
});

test('UX-003 and the frozen FUN-001 guard reject extra changes to labels, booking behavior, identity and historical bytes', () => {
  const mutations = [
    html.replace('for="booking-date">Fecha', 'for="booking-time">Fecha'),
    html.replace('>Correo electrónico</label>', '>Correo</label>'),
    html.replace('text-[12px]', 'text-[13px]'),
    html.replace('type="date"', 'type="text"'),
    html.replace("'/api/booking-create'", "'/api/booking-create-unreviewed'"),
    html.replace('createFormOperation', 'createUnreviewedOperation'),
    html.replace('resolveProjectIdentity', 'resolveUnreviewedIdentity'),
    html.replace('Lunes a viernes', 'Lunes a domingo'),
    html + '\n<!-- unreviewed change -->',
  ];
  for (const mutated of mutations) {
    assert.notEqual(mutated, html, 'Every canary must change the page');
    const bytes = Buffer.from(mutated);
    assert.equal(isP3AgendaLabelSuccessor(FILE, bytes), false);
    assert.throws(() => restoreP3AgendaLabels(FILE, bytes), /exceeds the exact reviewed UX-003 labels/);
    assert.throws(() => restoreP1IdempotencyFile(FILE, bytes), /exceeds the exact FUN-001 correction/);
  }
  assert.throws(() => restoreP3AgendaLabels(FILE, Buffer.concat([original, Buffer.from('\n<!-- historical mutation -->')])), /exceeds the exact reviewed UX-003 labels/);
  const unrelated = Buffer.from('unrelated source');
  assert.equal(restoreP3AgendaLabels('vercel.json', unrelated), unrelated);
  assert.equal(isP3AgendaLabelSuccessor('vercel.json', actual), false);
});
