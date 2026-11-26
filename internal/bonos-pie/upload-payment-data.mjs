// Operational import only: the private source file and connected credential stay
// outside Git. Run with the existing project's production `vercel env run`.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { get, put } from '@vercel/blob';
import { presentPaymentData } from './payment-data.mjs';

if (![3, 4].includes(process.argv.length)) throw new Error('Expected private dataset and optional current SHA256');
const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
const inventory = JSON.parse(await readFile(new URL('./inventory.json', import.meta.url), 'utf8'));
const { refresh, ...validated } = presentPaymentData(input, inventory);
const bytes = Buffer.from(JSON.stringify(validated));
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Existing connected private store credential required');
let etag;
if (process.argv[3]) {
  if (!/^[a-f0-9]{64}$/.test(process.argv[3])) throw new Error('Invalid expected current SHA256');
  const prior = await get('bonos-pie/v1/payment-plans.json', { access: 'private', useCache: false,
    token: process.env.BLOB_READ_WRITE_TOKEN, headers: { 'Accept-Encoding': 'identity' } });
  if (!prior?.stream || prior.statusCode !== 200) throw new Error('Current private dataset unavailable');
  const previous = Buffer.from(await new Response(prior.stream).arrayBuffer());
  if (createHash('sha256').update(previous).digest('hex') !== process.argv[3]) throw new Error('Private dataset changed; reconcile first');
  if (validated.version !== JSON.parse(previous).version + 1) throw new Error('Incremental version required');
  etag = prior.blob.etag;
  if (!etag || etag.startsWith('W/')) throw new Error('Strong private storage version required');
}
await put('bonos-pie/v1/payment-plans.json', bytes, { token: process.env.BLOB_READ_WRITE_TOKEN,
  access: 'private', contentType: 'application/json', cacheControlMaxAge: 60, addRandomSuffix: false,
  allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}) });
console.log(JSON.stringify({ uploaded: true, access: 'private', version: validated.version,
  projects: validated.projects.length, units: validated.projects.reduce((sum, p) => sum + p.units.length, 0),
  bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }));
