// Test-only reverse projection to the exact P2 UX/embed predecessor.
// Release validators never import this module or accept these changes implicitly.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const bytes = readFileSync(new URL('./p2-media-scope.json', import.meta.url));
assert.equal(sha(bytes), 'b638cbba10b1282dbd12067027b020e24f147efaad56ed9b3a83ada584ba6f9e', 'Unreviewed P2 media scope');
export const P2_MEDIA_SCOPE = JSON.parse(bytes).files;
assert.equal(Object.keys(P2_MEDIA_SCOPE).length, 95);
export const P2_MEDIA_FILES = Object.freeze(Object.keys(P2_MEDIA_SCOPE));
const originals = new Map();
export function projectP2MediaFile(path, current) {
  const record = P2_MEDIA_SCOPE[path];
  if (!record) return current;
  const digest = sha(current);
  if (digest === record.beforeSha256) return current;
  assert.equal(digest, record.afterSha256, 'Unreviewed P2 media file: ' + path);
  if (!originals.has(path)) {
    const original = execFileSync('git', ['cat-file', 'blob', record.beforeBlob], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
    assert.equal(original.length, record.beforeBytes, 'P2 media predecessor size differs: ' + path);
    assert.equal(sha(original), record.beforeSha256, 'P2 media predecessor differs: ' + path);
    originals.set(path, original);
  }
  return originals.get(path);
}
