// Test-only reverse delta for UX-003. Runtime and publication guards never
// import this module; both complete page hashes bound the six substitutions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const FILE = 'agenda-asesoria.html';
const BEFORE = 'a94cdf089701c5c94c54643c02f09f05d9973a41f5e5c3f4b25473697351ada4';
const AFTER = '052ccebaa414dcd9a84db148fe296214068d5312fb7ddbd5a7120a517e81c465';
const LABELS = Object.freeze([
  ['booking-date', 'Fecha'],
  ['booking-time', 'Hora'],
  ['booking-nombre', 'Nombre'],
  ['booking-apellido', 'Apellido'],
  ['booking-correo', 'Correo electrónico'],
  ['booking-telefono', 'Número de teléfono'],
].map(Object.freeze));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const label = (id, text, size) => `<label class="font-label text-[${size}px] tracking-[0.25em] uppercase text-secondary font-bold block mb-2" for="${id}">${text}</label>`;

// The existing frozen FUN-001 guard receives every other input unchanged and
// still rejects it. There is no catch or fallback after failed validation.
export function isP3AgendaLabelSuccessor(file, bytes) {
  return file === FILE && sha(bytes) === AFTER;
}

export function restoreP3AgendaLabels(file, bytes) {
  if (file !== FILE) return bytes;
  const digest = sha(bytes);
  if (digest === BEFORE) return bytes;
  assert.equal(digest, AFTER, 'Agenda change exceeds the exact reviewed UX-003 labels');
  let source = Buffer.from(bytes).toString('utf8');
  for (const [id, text] of LABELS) {
    const after = label(id, text, 12);
    assert.equal(source.split(after).length - 1, 1, `${id}: reviewed label must occur exactly once`);
    source = source.replace(after, label(id, text, 9));
  }
  const predecessor = Buffer.from(source);
  assert.equal(sha(predecessor), BEFORE, 'The exact UX-003 predecessor must preserve every other byte');
  return predecessor;
}
