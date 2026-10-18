import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isP3AgendaVisibilitySuccessor, restoreP3AgendaVisibility } from './p3-agenda-visibility-scope.mjs';
import { restoreP3AgendaLabels } from './p3-agenda-labels-scope.mjs';
import { restoreP1IdempotencyFile } from './p1-idempotency-preservation.mjs';

const ROOT = new URL('../', import.meta.url);
const FILE = 'agenda-asesoria.html';
const actual = readFileSync(new URL(FILE, ROOT));
const html = actual.toString('utf8');
const before = execFileSync('git', ['show', 'b03668dfe593fadabf995ee45283c729618a19aa:' + FILE], { cwd: ROOT });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('booking confirmation receives a scoped 6rem scroll margin while retaining live-region focus and the fixed header', () => {
  const style = html.match(/<head>[\s\S]*?<style>([\s\S]*?)<\/style>/)[1];
  const rule = style.match(/#booking-status\s*\{([^}]+)\}/g);
  assert.equal(rule.length, 1);
  assert.match(rule[0], /^#booking-status\s*\{\s*scroll-margin-top:\s*6rem;\s*\}$/);
  assert.match(html, /<header class="fixed top-0 [^"]+">\s*<nav class="[^"]*\bh-20"/);
  assert.match(html, /<p id="booking-status"[^>]*role="status" aria-live="polite" tabindex="-1"><\/p>/);
  assert.match(html, /status\.textContent = `Tu asesoría quedó reservada[^\n]+\n\s*status\.focus\(\);/);
  assert.equal((html.match(/scroll-margin-top/g) ?? []).length, 1, 'The offset applies only to the existing booking confirmation target');
});

test('booking visibility successor preserves every prior byte outside the three-line CSS rule and retains frozen label and FUN guards', () => {
  assert.equal(sha(before), '052ccebaa414dcd9a84db148fe296214068d5312fb7ddbd5a7120a517e81c465');
  assert.equal(sha(actual), '23308485a1073e76b97d093d83e8a289ffebaf499169afd79d0b1b93e3872b58');
  const rule = '        #booking-status {\n            scroll-margin-top: 6rem;\n        }\n';
  assert.equal(html, before.toString().replace('    </style>', rule + '    </style>'));
  assert.equal(isP3AgendaVisibilitySuccessor(FILE, actual), true);
  assert.deepEqual(restoreP3AgendaVisibility(FILE, actual), before);
  assert.deepEqual(restoreP3AgendaVisibility(FILE, before), before);
  assert.equal(sha(restoreP3AgendaLabels(FILE, restoreP3AgendaVisibility(FILE, actual))), 'a94cdf089701c5c94c54643c02f09f05d9973a41f5e5c3f4b25473697351ada4');
  assert.deepEqual(restoreP1IdempotencyFile(FILE, actual), restoreP1IdempotencyFile(FILE, before));
});

test('booking visibility scope rejects altered offsets, broader selectors, script and source mutations without bypassing prior guards', () => {
  const mutations = [
    html.replace('scroll-margin-top: 6rem;', 'scroll-margin-top: 0;'),
    html.replace('#booking-status {', 'p {'),
    html.replace('#booking-status {', '#booking-form {'),
    html.replace('scroll-margin-top: 6rem;', 'scroll-margin-top: 6rem;\n            position: fixed;'),
    html.replace('status.focus();', 'status.blur();'),
    html.replace('text-[12px]', 'text-[9px]'),
    html.replace('resolveProjectIdentity', 'resolveUnreviewedIdentity'),
    html.replace('Lunes a viernes', 'Lunes a domingo'),
    html + '\n<!-- unrelated mutation -->',
  ];
  for (const mutated of mutations) {
    assert.notEqual(mutated, html, 'Every canary must change the source');
    const bytes = Buffer.from(mutated);
    assert.equal(isP3AgendaVisibilitySuccessor(FILE, bytes), false);
    assert.throws(() => restoreP3AgendaVisibility(FILE, bytes), /exceeds the exact reviewed confirmation visibility correction/);
    assert.throws(() => restoreP3AgendaLabels(FILE, bytes), /exceeds the exact reviewed UX-003 labels/);
    assert.throws(() => restoreP1IdempotencyFile(FILE, bytes), /exceeds the exact FUN-001 correction/);
  }
  assert.throws(() => restoreP3AgendaVisibility(FILE, Buffer.concat([before, Buffer.from('\n<!-- historical mutation -->')])), /exceeds the exact reviewed confirmation visibility correction/);
  const unrelated = Buffer.from('unrelated source');
  for (const file of ['vercel.json', 'scripts/package-vercel.mjs', 'contacto.html']) {
    assert.equal(restoreP3AgendaVisibility(file, unrelated), unrelated);
    assert.equal(isP3AgendaVisibilitySuccessor(file, actual), false);
  }
});
