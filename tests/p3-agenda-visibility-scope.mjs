// Test-only reverse delta for the booking confirmation visibility correction.
// Both complete page hashes bound one CSS rule; runtime/publication code never
// imports this module and all previous preservation pins remain unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const FILE = 'agenda-asesoria.html';
const BEFORE = '052ccebaa414dcd9a84db148fe296214068d5312fb7ddbd5a7120a517e81c465';
const AFTER = '23308485a1073e76b97d093d83e8a289ffebaf499169afd79d0b1b93e3872b58';
const RULE = '        #booking-status {\n            scroll-margin-top: 6rem;\n        }\n';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// Historical callers project only the exact complete successor. All other
// bytes still reach their unchanged frozen guards; validation errors are never
// caught and there is no generic HTML or style fallback.
export function isP3AgendaVisibilitySuccessor(file, bytes) {
  return file === FILE && sha(bytes) === AFTER;
}

export function restoreP3AgendaVisibility(file, bytes) {
  if (file !== FILE) return bytes;
  const digest = sha(bytes);
  if (digest === BEFORE) return bytes;
  assert.equal(digest, AFTER, 'Agenda change exceeds the exact reviewed confirmation visibility correction');
  const source = Buffer.from(bytes).toString('utf8');
  assert.equal(source.split(RULE).length - 1, 1, 'The reviewed booking-status rule must occur exactly once');
  const predecessor = Buffer.from(source.replace(RULE, ''));
  assert.equal(sha(predecessor), BEFORE, 'The visibility predecessor must preserve every other byte');
  return predecessor;
}
