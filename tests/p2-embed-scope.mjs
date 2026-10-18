// Test-only reverse projection. Release validators never import this module.
// Both full file digests are pinned; arbitrary markup cannot be normalized.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const scopeBytes = readFileSync(new URL('./p2-embed-scope.json', import.meta.url));
assert.equal(sha(scopeBytes), '3af4037b7e9f6b1a79e1cc0fdfef643a453d38135bce10996de28043c4aa0cca', 'P2 embed review scope changed');
export const P2_EMBED_SCOPE = JSON.parse(scopeBytes).files;
assert.equal(Object.keys(P2_EMBED_SCOPE).length, 135);
const originals = new Map();
export function restoreP2EmbedFile(path, current) {
  const record = P2_EMBED_SCOPE[path];
  if (!record) return current;
  const digest = sha(current);
  if (digest === record.beforeSha256) return current;
  assert.equal(digest, record.afterSha256, 'Unreviewed P2 embed file: ' + path);
  if (!originals.has(path)) {
    const before = execFileSync('git', ['cat-file', 'blob', record.beforeBlob], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
    assert.equal(sha(before), record.beforeSha256, 'P2 embed original blob differs: ' + path);
    originals.set(path, before);
  }
  return originals.get(path);
}
