import { readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, '.vercel/bonos-pie-20261125/stage/.vercel/output');
const source = join(root, 'internal/bonos-pie');
const prefix = 'functions/api/interno-bonos-pie.func/';
const destination = join(output, prefix);
const docs = join(root, 'docs/metadatos-private-20261125');
const baseline = JSON.parse(await readFile(join(docs, 'baseline-manifest.json'), 'utf8'));
const priorConfig = JSON.parse(await readFile(join(docs, 'baseline-routes.json'), 'utf8'));
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const priorRoutes = [
  '^/bonos-pie/acceso/?$', '^/bonos-pie/?$',
  '^/interno/bonos-pie/acceso/?$', '^/interno/bonos-pie/?$',
];
const redirect = (src, location) => ({ src, status: 308, headers: { Location: location,
  'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'Referrer-Policy': 'no-referrer' } });
const panelRoutes = [
  { src: '^/metadatos/acceso/?$', dest: '/api/interno-bonos-pie?op=login' },
  { src: '^/metadatos/?$', dest: '/api/interno-bonos-pie' },
  ...priorRoutes.map(src => redirect(src, src.includes('acceso') ? '/metadatos/acceso' : '/metadatos')),
];
if (JSON.stringify(priorConfig.routes.slice(0, 4).map(r => r.src)) !== JSON.stringify(priorRoutes))
  throw new Error('Unexpected current private routing; reconcile first');
const config = { ...priorConfig, routes: [...panelRoutes, ...priorConfig.routes.slice(4)] };
// Only these six private routes replace the four old ones; every other field is exact.
if (JSON.stringify({ ...config, routes: config.routes.slice(6) }) !== JSON.stringify({ ...priorConfig, routes: priorConfig.routes.slice(4) }))
  throw new Error('Public routing changed');
execFileSync(process.execPath, [join(source, 'node_modules/esbuild/bin/esbuild'), join(source, 'server.mjs'), '--bundle', '--platform=node', '--format=esm', '--target=node24',
  '--banner:js=import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  '--outfile=' + join(destination, 'index.mjs')], { stdio: 'inherit' });
for (const name of ['panel.html', 'panel.js', 'login.html', 'login.js', 'payment-ui.js'])
  await copyFile(join(source, 'ui', name), join(destination, 'ui', name));
await writeFile(join(output, 'config.json'), JSON.stringify(config, null, 2) + '\n');
async function files(dir, parent = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('No artifact symlinks');
    const path = parent + entry.name;
    if (entry.isDirectory()) result.push(...await files(join(dir, entry.name), path + '/'));
    else { const bytes = await readFile(join(dir, entry.name)); result.push({ path, bytes: bytes.length, sha1: hash(bytes, 'sha1'), sha256: hash(bytes) }); }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
const inventory = await files(output), current = new Map(inventory.map(r => [r.path, r]));
const before = new Map(baseline.inventory.map(r => [r.path, r]));
const changed = inventory.filter(r => before.get(r.path)?.sha256 !== r.sha256);
const allowed = new Set(['config.json', ...['index.mjs', 'ui/panel.html', 'ui/panel.js', 'ui/login.html', 'ui/login.js', 'ui/payment-ui.js'].map(p => prefix + p)]);
if (inventory.length !== before.size || baseline.inventory.some(r => !current.has(r.path)) || changed.some(r => !allowed.has(r.path))) throw new Error('Unauthorized artifact change');
const proof = { schemaVersion: 1, preparedAt: new Date().toISOString(), baselineDeployment: baseline.deploymentId,
  baselineCommit: baseline.sourceCommit, baselineFiles: before.size, modifiedPaths: changed.map(r => r.path), addedPaths: [],
  newPrivateRoute: '/metadatos', previousPrivateRoutesRedirect: true, publicFilesByteIdentical: true,
  otherFunctionFilesByteIdentical: true, onlyPrivateRoutesChanged: true, privateRecordsBundled: false,
  inventory, inventorySHA256: hash(inventory.map(r => `${r.path}\t${r.bytes}\t${r.sha256}\n`).join('')) };
await writeFile(join(docs, 'candidate-manifest.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, files: inventory.length, modifiedPaths: proof.modifiedPaths, inventorySHA256: proof.inventorySHA256 }));
