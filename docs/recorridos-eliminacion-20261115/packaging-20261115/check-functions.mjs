// Isolated import/early-rejection smoke test. Never submits forms or calls providers.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = resolve(process.argv[2], '.vercel/output');
let outboundAttempts = 0;
globalThis.fetch = async () => { outboundAttempts++; throw new Error('Outbound network forbidden'); };
assert.equal(process.env.VERCEL_ENV, 'preview');
const results = [];
for (const name of readdirSync(join(output, 'functions/api')).sort()) {
  const bundle = join(output, 'functions/api', name);
  const config = JSON.parse(readFileSync(join(bundle, '.vc-config.json')));
  const module = await import(pathToFileURL(join(bundle, config.handler)));
  assert.equal(typeof module.default.fetch, 'function', name);
  const endpoint = '/api/' + name.slice(0, -5);
  // GET for contact methods, PUT for UF. Booking defaults always fail closed.
  const method = name === 'uf.func' ? 'PUT' : 'GET';
  const response = await module.default.fetch(new Request('https://qa.invalid' + endpoint, { method }));
  const expected = name.startsWith('booking-') ? 503 : 405;
  assert.equal(response.status, expected, name);
  results.push({ endpoint, method, status: response.status, importPassed: true });
}
assert.equal(results.length, 7);
assert.equal(outboundAttempts, 0);
const result = { node: process.version, results, outboundAttempts, formsSubmitted: 0,
  scope: 'Imports and early rejection only; not Vercel registration or provider integration.' };
writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
