// Run via `vercel env run` so the existing store credential stays in process
// memory. Commercial input and authentication material must never enter Git.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { get, put } from '@vercel/blob';

if (![3, 4].includes(process.argv.length)) throw new Error('Expected a private dataset file and optional expected current SHA256');
const value = await readFile(process.argv[2]);
const state = JSON.parse(value);
if (state.schemaVersion !== 1 || !Array.isArray(state.projects) || state.projects.length !== Object.keys(state.records ?? {}).length)
  throw new Error('Invalid private dataset');
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('The connected private store credential is unavailable');
let etag;
if (process.argv[3]) {
  if (!/^[a-f0-9]{64}$/.test(process.argv[3])) throw new Error('Expected current SHA256 is required');
  const prior = await get('bonos-pie/v1/data.json', { access: 'private', useCache: false,
    token: process.env.BLOB_READ_WRITE_TOKEN, headers: { 'Accept-Encoding': 'identity' } });
  if (!prior?.stream || prior.statusCode !== 200) throw new Error('Current private dataset unavailable');
  const bytes = Buffer.from(await new Response(prior.stream).arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== process.argv[3]) throw new Error('The private dataset changed; reconcile first');
  if (state.version !== JSON.parse(bytes).version + 1) throw new Error('Incremental version required');
  etag = prior.blob.etag;
  if (!etag || etag.startsWith('W/')) throw new Error('Strong private storage version required');
}
await put('bonos-pie/v1/data.json', value, {
  token: process.env.BLOB_READ_WRITE_TOKEN, access: 'private', contentType: 'application/json',
  cacheControlMaxAge: 60, addRandomSuffix: false, allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
});
console.log(JSON.stringify({ uploaded: true, access: 'private', projects: state.projects.length,
  bytes: value.length, sha256: createHash('sha256').update(value).digest('hex') }));
