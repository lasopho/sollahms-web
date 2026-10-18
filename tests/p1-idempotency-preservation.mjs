// Exact FUN-001 successor, projected only for historical byte-preservation audits.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isP3AgendaLabelSuccessor, restoreP3AgendaLabels } from './p3-agenda-labels-scope.mjs';
import { isP3AgendaVisibilitySuccessor, restoreP3AgendaVisibility } from './p3-agenda-visibility-scope.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASE = '3866095';
const REVIEWED = {
  "agenda-asesoria.html": [
    "2cdda24895d3547a5264b11ccb90988cba232d6f7ebf09af7229abdc707fb769",
    "a94cdf089701c5c94c54643c02f09f05d9973a41f5e5c3f4b25473697351ada4"
  ],
  "api/booking-create.mjs": [
    "e910a2ad7d218fcbb30665ab911026f859c097a5869a790236a80e98472f123c",
    "c297382256eb9b426248a07757ab493ab8bf2c2dbb8232e2569e921e1fe854d5"
  ],
  "api/contact.mjs": [
    "b2d518743172e4a695fe00c859c103e6d9805b9ae57a8ea21c2c44620ceb9ba0",
    "0ac9a7b8fe0f51606f8bbd0bdba3d49e96461668a8a7fc48627f294db276c0ab"
  ],
  "assets/js/hipotecario.mjs": [
    "18f6070de614671c4d69f1771da636fa9d033ee3bf5136be613b2531c916554d",
    "1e2663e319eebfa8ac723afb171b27a869297a281d43a8184e94f7e6a4c9678e"
  ],
  "contacto.html": [
    "8d73a220b1e43b9b01899bb91b5a17123f54b365979626b56ef3aa417aa0cfde",
    "23f28e34c3b25cf195cfff7d383c441a4859ba599355b37b9eab79e66a1fd638"
  ]
};
const sha = value => createHash('sha256').update(value).digest('hex');
const originals = new Map();
export function restoreP1IdempotencyFile(file, actual) {
  if (isP3AgendaVisibilitySuccessor(file, actual)) actual = restoreP3AgendaVisibility(file, actual);
  if (isP3AgendaLabelSuccessor(file, actual)) actual = restoreP3AgendaLabels(file, actual);
  if (!Object.hasOwn(REVIEWED, file)) return actual;
  const [before, after] = REVIEWED[file];
  const digest = sha(actual);
  if (digest === before) return actual;
  assert.equal(digest, after, file + ': change exceeds the exact FUN-001 correction');
  if (!originals.has(file)) {
    const source = execFileSync('git', ['show', BASE + ':' + file], { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 });
    assert.equal(sha(source), before, 'The pinned historical FUN-001 baseline changed');
    originals.set(file, source);
  }
  return originals.get(file);
}
export const P1_IDEMPOTENCY_FILES = Object.freeze(Object.keys(REVIEWED));
export const P1_IDEMPOTENCY_ASSET = 'assets/js/form-operation.mjs';
export function assertP1IdempotencyAsset(actual) {
  assert.equal(sha(actual), '187042e1039d7e64c5cf8e14b3f007e8f2e11142ed7d50a80d677cee1b97c4b4', 'The new FUN-001 browser asset must match its exact reviewed bytes');
}
