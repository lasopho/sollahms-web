// Test-only composition of independently pinned P2 reverse deltas.
// Runtime and publication guards never import this module.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { projectP2CatalogueFile } from './p2-catalogue-scope.mjs';
import { restoreP2FinanceFile, P2_FINANCE_FILES } from './p2-finance-preservation.mjs';
import { projectP2SecurityFile, P2_SECURITY_FILES } from './p2-security-scope.mjs';
import { restoreP2EmbedFile, P2_EMBED_SCOPE } from './p2-embed-scope.mjs';
import { projectP2MediaFile, P2_MEDIA_FILES } from './p2-media-scope.mjs';
import { projectP2RegisterFile, P2_REGISTER_FILES } from './p2-register-scope.mjs';

const ROOT = new URL('../', import.meta.url);
export const P2_FILE_PATHS = Object.freeze([...new Set([
  'proyectos.html', ...P2_FINANCE_FILES, ...P2_SECURITY_FILES, ...Object.keys(P2_EMBED_SCOPE), ...P2_MEDIA_FILES, ...P2_REGISTER_FILES,
])].sort());
const paths = new Set(P2_FILE_PATHS);

/** Strict boundary for actual current source, before any historical projection. */
export function projectP2File(file, bytes) {
  // The final P1 predecessor is also accepted idempotently. For overlapping
  // HTML it predates both MED-008 and UX-001 and is independently pinned by
  // the immutable embed scope; all other inputs must validate Media first.
  const embed = P2_EMBED_SCOPE[file];
  const isEmbedPredecessor = embed && createHash('sha256').update(bytes).digest('hex') === embed.beforeSha256;
  const beforeMedia = isEmbedPredecessor ? bytes : projectP2MediaFile(file, bytes);
  return restoreP2EmbedFile(file,
    projectP2SecurityFile(file,
      restoreP2FinanceFile(file,
        projectP2CatalogueFile(file, projectP2RegisterFile(file, beforeMedia)))));
}

/** Older audit stages sometimes receive already-projected ancestors.
 * Only the exact current source enters the strict P2 boundary here. Every
 * other input remains intact for the caller's original frozen assertions.
 * This is not a fallback after failed validation: errors are never caught.
 */
export function projectP2CurrentFile(file, bytes) {
  if (!paths.has(file)) return bytes;
  const source = new URL(file, ROOT);
  if (!existsSync(source)) return bytes;
  const current = readFileSync(source);
  return Buffer.from(bytes).equals(current) ? projectP2File(file, bytes) : bytes;
}
