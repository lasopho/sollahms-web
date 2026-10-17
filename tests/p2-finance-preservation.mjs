// Exact FUN-004 successors for historical tests only; production release guards are unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const REVIEWED = {
  "assets/js/purchase-capacity.mjs": {
    "beforeBlob": "a50f2a1c0541779bada09fc3dc41ffdedb6a6f44",
    "beforeSha256": "0b13badba793d190afecc6ef4e7a40563448342deaed9dafdc17bb44e0df9f11",
    "afterSha256": "26ab74149300e08a557b3266b531b553b619d661ec03988e8009291688e4635d"
  },
  "assets/js/purchase-capacity-ui.mjs": {
    "beforeBlob": "767e04e3d6fd4df030bf19c2543773b6ccbd2f72",
    "beforeSha256": "bdec9e59215c9b2116122dbded8e7604e380654defb3ef69f9d364c38556f724",
    "afterSha256": "408727ad81908ad1ef3fc2db62eaa6fc4973965e84a171141bce8d86cd2d9744"
  }
};

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const originals = new Map();
export const P2_FINANCE_FILES = Object.freeze(Object.keys(REVIEWED));
export function restoreP2FinanceFile(file, actual) {
  const review = REVIEWED[file];
  if (!review) return actual;
  const digest = sha256(actual);
  if (digest === review.beforeSha256) return actual;
  assert.equal(digest, review.afterSha256, file + ': change exceeds the exact FUN-004 correction');
  if (!originals.has(file)) {
    const before = execFileSync('git', ['cat-file', 'blob', review.beforeBlob], { cwd: ROOT, maxBuffer: 2 * 1024 * 1024 });
    assert.equal(sha256(before), review.beforeSha256, file + ': pinned P1 source blob changed');
    originals.set(file, before);
  }
  return originals.get(file);
}
