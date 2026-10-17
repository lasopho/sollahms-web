// CAT-001 historical-document notices, projected only for frozen source tests.
// Both complete states and the portable remote-P1 predecessor blobs are pinned.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const scopeBytes = readFileSync(new URL('./p2-register-scope.json', import.meta.url));
assert.equal(sha(scopeBytes), '0ba22b001af3ed05a9aa72583baa277135bd7273550b67682a568eee045cc3fd', 'Unreviewed P2 register-document scope');
export const P2_REGISTER_SCOPE = JSON.parse(scopeBytes).files;
export const P2_REGISTER_FILES = Object.freeze(Object.keys(P2_REGISTER_SCOPE));
assert.equal(P2_REGISTER_FILES.length, 23);
const originals = new Map();

export function projectP2RegisterFile(file, actual) {
  const record = P2_REGISTER_SCOPE[file];
  if (!record) return actual;
  const digest = sha(actual);
  if (digest === record.beforeSha256) return actual;
  assert.equal(digest, record.afterSha256, 'Unreviewed P2 register-document change: ' + file);
  assert.equal(actual.length, record.afterBytes, 'P2 register-document size changed: ' + file);
  if (!originals.has(file)) {
    const before = execFileSync('git', ['cat-file', 'blob', record.beforeBlob], { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 });
    assert.equal(before.length, record.beforeBytes, 'P2 register-document predecessor size changed: ' + file);
    assert.equal(sha(before), record.beforeSha256, 'P2 register-document predecessor changed: ' + file);
    originals.set(file, before);
  }
  return originals.get(file);
}
