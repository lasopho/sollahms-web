// Exercise the exact certified function bundles locally with synthetic data.
// No environment secrets, listener, remote request or provider write is used.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const output = resolve(process.argv[2] || '/private/tmp/sollahms-fichas-iris-release-20261119/stage/.vercel/output');
const functions = join(output, 'functions/api');
const now = Date.parse('2026-11-19T10:00:00Z');
let providerCalls = 0, secretReads = 0;
const forbidden = () => { providerCalls++; throw Error('External transport is forbidden in this verification.'); };
globalThis.fetch = forbidden;
const credentials = () => { secretReads++; throw Error('Credentials must not be read.'); };
const options = { now: () => now, getEnvironment: () => 'preview', getApiKey: credentials,
  getDeliveryMode: () => 'resend', fetchImpl: forbidden, persistCrmLead: forbidden,
  resolveUf: forbidden, callBackend: forbidden };
const load = (name) => import(pathToFileURL(join(functions, `${name}.func/api/${name}.mjs`)));
async function inventory(dir, base = dir) {
  const rows = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink());
    if (entry.isDirectory()) rows.push(...await inventory(path, base));
    else rows.push({ path: path.slice(base.length + 1), sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
  }
  return rows.sort((a,b) => a.path.localeCompare(b.path));
}
const before = await inventory(join(output, 'functions'));
const configBefore = await readFile(join(output, 'config.json'));
const payload = { nombre: 'Prueba QA Sintética', rut: '1000005-K', correo: 'qa@example.invalid',
  telefono: '+56900000000', mensaje: 'Consulta sintética sin envío real.', consent: true,
  website: '', startedAt: now - 5000 };
const request = (name, body) => new Request('https://preview.example.invalid/api/' + name, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://preview.example.invalid' },
  body: JSON.stringify(body),
});
const results = [];
async function verify(name, handler, body, expected = 'preview_read_only', label = name) {
  const response = await handler.fetch(request(name, body));
  const result = await response.json();
  assert.equal(response.status, 503, label + ': status');
  assert.equal(result.code, expected, label + ': code');
  assert.ok(!JSON.stringify(result).includes(payload.correo), label + ': private response');
  results.push({ test: label, status: response.status, code: result.code, passed: true });
}
const contact = await load('contact');
await verify('contact', contact.createContactHandler(options), payload, 'preview_read_only', 'contact/resend');
await verify('contact', contact.createContactHandler({ ...options, getDeliveryMode: () => 'crm' }), payload, 'preview_read_only', 'contact/crm');
const orientation = await load('orientation-contact');
await verify('orientation-contact', orientation.createOrientationContactHandler(options), payload);
const advisory = await load('advisory');
await verify('advisory', advisory.createAdvisoryHandler(options), { ...payload, objetivo: 'orientacion', solicitud: 'asesoria' });
const collaboration = await load('collaboration');
for (const tipo of ['persona', 'inmobiliaria']) {
  await verify('collaboration', collaboration.createCollaborationHandler(options), {
    tipo, correo: payload.correo, telefono: '', consent: true, website: '', startedAt: now - 5000,
  }, 'preview_read_only', 'collaboration/' + tipo);
}
const booking = await load('booking-create');
await verify('booking-create', booking.default, {}, 'booking_not_certified', 'booking-create/current-default');
await verify('booking-create', booking.createBookingHandler(options), {
  date: '2026-11-20', time: '10:00', nombre: 'Prueba', apellido: 'Sintética',
  correo: payload.correo, telefono: payload.telefono, website: '',
}, 'preview_read_only', 'booking-create/legacy-factory-preview');
const availability = await load('booking-availability');
await verify('booking-availability', availability.default, {}, 'booking_not_certified', 'booking-availability/current-default');
assert.equal(providerCalls, 0);
assert.equal(secretReads, 0);
assert.deepEqual(await inventory(join(output, 'functions')), before);
assert.deepEqual(await readFile(join(output, 'config.json')), configBefore);
const observedAtUTC = new Date().toISOString();
const localParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset' }).formatToParts(new Date(observedAtUTC)).map(p => [p.type, p.value]));
const observedAt = `${localParts.year}-${localParts.month}-${localParts.day}T${localParts.hour}:${localParts.minute}:${localParts.second}${localParts.timeZoneName.replace('GMT','')}`;
const report = { observedAt, observedAtUTC, timezone: 'America/Santiago', method: 'Local runtime mocks using exact certified deployed function bundles; global fetch and injected providers fail on invocation.',
  artifact: output, results, tests: results.length, passed: true, providerCalls, secretReads,
  remoteRequests: 0, realFormSubmissions: 0, realReservations: 0,
  functionFiles: before.length, functionsUnchanged: true, configurationUnchanged: true,
  limitation: 'Verifies application runtime guard and current request-only booking policy locally. Preview authentication and remote runtime environment are checked separately.' };
await writeFile(new URL('./preview-runtime-mocks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, tests: results.length, providerCalls, secretReads, functionFiles: before.length }));
