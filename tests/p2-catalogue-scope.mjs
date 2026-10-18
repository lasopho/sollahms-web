// Test-only reverse projection; publication validators never import this file.
// Both complete reviewed files are pinned. Unknown edits cannot be normalized.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BEFORE_BLOB = 'dfbe29121c1bd7587867d890f20339d5661de9a0';
const BEFORE_SHA256 = 'eec0893eddff1ee3030081e0314dd1347f80892c88484f3291b9f845a840175c';
const AFTER_SHA256 = '0be2a843f53ac9b909abfa1a297e728fc5b90cbfd56abbeba39d8cad8179b324';
const digest = value => createHash('sha256').update(value).digest('hex');

export function projectP2CatalogueFile(file, value) {
  if (file !== 'proyectos.html') return value;
  const hash = digest(value);
  if (hash === BEFORE_SHA256) return value;
  assert.equal(hash, AFTER_SHA256, 'Unreviewed P2 catalogue change: ' + file);
  const before = execFileSync('git', ['cat-file', 'blob', BEFORE_BLOB], { cwd: ROOT, maxBuffer: 2 * 1024 * 1024 });
  assert.equal(digest(before), BEFORE_SHA256, 'P2 catalogue baseline blob changed');
  return before;
}
