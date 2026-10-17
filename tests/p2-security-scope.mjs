// Exact SEC-002 / UX-002 review deltas for historical tests only.
// Immutable Git object identity works on the equivalent public P1 tree too.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const sha = value => createHash('sha256').update(value).digest('hex');
const REVIEW = {
  "privacidad.html": {
    "beforeGitBlob": "b107c089a68d0a5083f471200e9a843cb519ca40",
    "beforeSha256": "758d445e3970dce4eafb89bc919894b718cd15e30f28dc225b3b792c277554d4",
    "afterSha256": "171b924c05cacbf3686581e0d09ec86a3b51d5d954c4651185dae9ec01d5d41e"
  },
  "assets/css/project-detail.css": {
    "beforeGitBlob": "5ef81f67b7e5d8bb06daf25cbf1ca4acbf973faf",
    "beforeSha256": "cd9c235848336515b2b45c8d911dab8abdf1abbc4c385d78cb9aa438d2ee40f7",
    "afterSha256": "855ee4f53a761625fc8f5b67702aefa1f5de28b13d4c4a0e68cea95df9db256f"
  },
  "assets/css/project-embeds.css": {
    "beforeGitBlob": "2abebcac0983725999aac8e9bf562ce08221bf4e",
    "beforeSha256": "c51370ca14c38974d6ccf81fb4a11e12d1a54af5ac37bd53ee6e324bc3642dd2",
    "afterSha256": "4ab4549a74063ae923de662835870d0320af7895b0f2f5a5adf9bf9c16cee323"
  }
};
const originals = new Map();
export function projectP2SecurityFile(file, actual) {
  if (!Object.hasOwn(REVIEW, file)) return actual;
  const spec = REVIEW[file], digest = sha(actual);
  if (digest === spec.beforeSha256) return actual;
  assert.equal(digest, spec.afterSha256, file + ': change exceeds exact SEC-002 / UX-002 correction');
  if (!originals.has(file)) {
    const original = execFileSync('git', ['cat-file', 'blob', spec.beforeGitBlob], { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 });
    assert.equal(sha(original), spec.beforeSha256, 'Immutable P1 source blob changed');
    originals.set(file, original);
  }
  return originals.get(file);
}
export const P2_SECURITY_FILES = Object.freeze(Object.keys(REVIEW));
