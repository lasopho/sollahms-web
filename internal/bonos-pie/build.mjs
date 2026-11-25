import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, '.vercel/bonos-pie-20261125/stage/.vercel/output');
const source = join(root, 'internal/bonos-pie');
const destination = join(output, 'functions/api/interno-bonos-pie.func');
const proofDir = join(root, 'docs/bonos-pie-20261125');
const baseline = JSON.parse(await readFile(join(proofDir, 'baseline-manifest.json'), 'utf8'));
const esbuild = join(source, 'node_modules/esbuild/bin/esbuild');
const sha = body => createHash('sha256').update(body).digest('hex');

async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('No symbolic links in release artifacts');
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(join(dir, entry.name), path + '/'));
    else {
      const body = await readFile(join(dir, entry.name));
      result.push({ path, bytes: body.length, sha256: sha(body), sha1: createHash('sha1').update(body).digest('hex') });
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

await mkdir(destination, { recursive: true });
execFileSync(esbuild, [join(source, 'server.mjs'), '--bundle', '--platform=node', '--format=esm', '--target=node24',
  '--banner:js=import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  '--outfile=' + join(destination, 'index.mjs')], { stdio: 'inherit' });
await copyFile(join(source, 'inventory.json'), join(destination, 'inventory.json'));
await mkdir(join(destination, 'ui'), { recursive: true });
for (const file of ['panel.html', 'panel.css', 'panel.js', 'login.html', 'login.js', 'login.css'])
  await copyFile(join(source, 'ui', file), join(destination, 'ui', file));
await writeFile(join(destination, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs24.x', handler: 'index.mjs',
  launcherType: 'Nodejs', architecture: 'x86_64', shouldAddHelpers: true, shouldAddSourcemapSupport: false,
  shouldDisableAutomaticFetchInstrumentation: false, environment: {}, awsLambdaHandler: '' }, null, 2) + '\n');

const configFile = join(output, 'config.json');
const original = baseline.inventory.find(r => r.path === 'config.json');
let config = JSON.parse(await readFile(configFile, 'utf8'));
// Rebuilding this isolated overlay is idempotent; existing public routes stay exact.
config.routes = config.routes.filter(r => !['^/interno/bonos-pie(?:/acceso)?/?$', '^/interno/bonos-pie/acceso/?$', '^/interno/bonos-pie/?$'].includes(r.src));
config.routes.unshift({ src: '^/interno/bonos-pie/acceso/?$', dest: '/api/interno-bonos-pie?op=login' },
  { src: '^/interno/bonos-pie/?$', dest: '/api/interno-bonos-pie' });
await writeFile(configFile, JSON.stringify(config, null, 2) + '\n');
const inventory = await files(output);
const current = new Map(inventory.map(r => [r.path, r]));
const before = baseline.inventory;
const modified = before.filter(row => current.get(row.path)?.sha256 !== row.sha256);
if (modified.length !== 1 || modified[0].path !== 'config.json') throw new Error('An existing public file or function changed');
const reconstructed = JSON.parse(JSON.stringify(config));
reconstructed.routes.shift();
reconstructed.routes.shift();
const prior = JSON.parse(await readFile(join(proofDir, 'baseline-routes.json'), 'utf8'));
if (JSON.stringify(reconstructed) !== JSON.stringify(prior)) throw new Error('Existing routes changed');
const added = inventory.filter(r => !before.some(p => p.path === r.path));
if (added.some(r => !r.path.startsWith('functions/api/interno-bonos-pie.func/'))) throw new Error('New files escaped protected function');
const prohibited = inventory.filter(r => /private|records\.json|data\.json|\.env|cookies|storage.state/i.test(r.path) && r.path.startsWith('static/'));
if (prohibited.length) throw new Error('Unexpected private data in public output');
await mkdir(proofDir, { recursive: true });
const proof = { schemaVersion: 1, preparedAt: new Date().toISOString(), baselineDeployment: baseline.deploymentId,
  baselineCommit: baseline.sourceCommit, baselineFiles: before.length,
  existingFilesUnchanged: before.length - 1, modifiedPaths: modified.map(r => r.path), addedPaths: added.map(r => r.path),
  publicFilesByteIdentical: true, existingFunctionFilesByteIdentical: true, originalRoutesPreserved: true,
  privateRecordsBundled: false, newRoute: '/interno/bonos-pie', inventory,
  inventorySHA256: sha(inventory.map(r => `${r.path}\t${r.bytes}\t${r.sha256}\n`).join('')) };
await writeFile(join(proofDir, 'candidate-manifest.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, files: inventory.length, newFiles: added.length, publicFilesByteIdentical: true,
  existingFunctionFilesByteIdentical: true, inventorySHA256: proof.inventorySHA256 }));
