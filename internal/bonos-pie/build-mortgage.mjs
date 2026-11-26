import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, '.vercel/bonos-pie-20261125/stage/.vercel/output');
const source = join(root, 'internal/bonos-pie');
const protectedPrefix = 'functions/api/interno-bonos-pie.func/';
const destination = join(output, protectedPrefix);
const proofDir = join(root, 'docs/mortgage-private-20261125');
const baseline = JSON.parse(await readFile(join(proofDir, 'baseline-manifest.json'), 'utf8'));
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symbolic link in release output');
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(join(dir, entry.name), path + '/'));
    else {
      const body = await readFile(join(dir, entry.name));
      result.push({ path, bytes: body.length, sha256: hash(body), sha1: hash(body, 'sha1') });
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
await mkdir(destination, { recursive: true });
execFileSync(process.execPath, [join(source, 'node_modules/esbuild/bin/esbuild'), join(source, 'server.mjs'), '--bundle', '--platform=node', '--format=esm', '--target=node24',
  '--banner:js=import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  '--outfile=' + join(destination, 'index.mjs')], { stdio: 'inherit' });
await copyFile(join(source, 'payment-plan.mjs'), join(destination, 'payment-plan.mjs'));
for (const file of ['panel.html', 'panel.css', 'payment-ui.js']) await copyFile(join(source, 'ui', file), join(destination, 'ui', file));
const inventory = await files(output);
const before = new Map(baseline.inventory.map(row => [row.path, row]));
const current = new Map(inventory.map(row => [row.path, row]));
const removed = baseline.inventory.filter(row => !current.has(row.path));
const modified = inventory.filter(row => before.has(row.path) && before.get(row.path).sha256 !== row.sha256);
const added = inventory.filter(row => !before.has(row.path));
if (removed.length || [...modified, ...added].some(row => !row.path.startsWith(protectedPrefix))) throw new Error('Change outside authorized private panel');
const allowed = new Set(['index.mjs', 'payment-plan.mjs', 'ui/panel.html', 'ui/panel.css', 'ui/payment-ui.js'].map(path => protectedPrefix + path));
if ([...modified, ...added].some(row => !allowed.has(row.path))) throw new Error('Unexpected protected artifact changed');
const proof = { schemaVersion: 1, preparedAt: new Date().toISOString(), baselineDeployment: baseline.deploymentId,
  baselineCommit: baseline.sourceCommit, baselineFiles: before.size, modifiedPaths: modified.map(r => r.path), addedPaths: added.map(r => r.path),
  publicFilesByteIdentical: true, otherFunctionFilesByteIdentical: true, routesByteIdentical: true, privateRecordsBundled: false,
  inventory, inventorySHA256: hash(inventory.map(r => `${r.path}\t${r.bytes}\t${r.sha256}\n`).join('')) };
await writeFile(join(proofDir, 'candidate-manifest.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, files: inventory.length, modifiedPaths: proof.modifiedPaths, addedPaths: proof.addedPaths, inventorySHA256: proof.inventorySHA256 }));
