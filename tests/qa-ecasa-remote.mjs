// Read-only authenticated verification against the exact private build receipt.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { ECASA_RETIRED_SLUGS } from '../scripts/ecasa-publication.mjs';
const base = new URL(process.argv[2]);
const metadataPath = resolve(process.argv[3]);
const output = resolve(process.argv[4] || '/private/tmp/sollahms-ecasa-remote');
if (base.protocol !== 'https:' || !base.hostname.endsWith('.vercel.app')) throw new Error('Unexpected Preview origin');
if (!process.env.VERCEL_OIDC_TOKEN) throw new Error('Short-lived Preview authentication is required');
const metadata = JSON.parse(await readFile(metadataPath));
const deploymentConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));
const quality = JSON.parse(await readFile(new URL('../data/ecasa-image-quality.json', import.meta.url)));
const official = JSON.parse(await readFile(new URL('../data/ecasa-official-originals.json', import.meta.url)));
let manual = null;
try { manual = JSON.parse(await readFile(new URL('../data/ecasa-manual-quality.json', import.meta.url))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
let ownerCover = null;
try { ownerCover = JSON.parse(await readFile(new URL('../data/ecasa-owner-cover.json', import.meta.url))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const ownerCoverProjects = ownerCover ? (ownerCover.schemaVersion === 2 ? ownerCover.projects : [ownerCover]) : [];
if (metadata.target !== 'preview' || metadata.contentProfile !== 'protected_ecasa_review') throw new Error('Protected Ecasa build receipt required');
const auth = { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN };
const results = [], checks = [];
let cursor = 0;
await mkdir(output, { recursive: true });
const publicResponse = await fetch(base, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
checks.push({ label: 'Unauthenticated Preview is protected', passed: [302, 307, 401, 403].includes(publicResponse.status), status: publicResponse.status });
await Promise.all(Array.from({ length: 8 }, async () => {
  for (;;) {
    const index = cursor++;
    if (index >= metadata.publicOutput.length) return;
    const file = metadata.publicOutput[index];
    try {
      const response = await fetch(new URL('/' + file.file, base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
      const digest = createHash('sha256').update(new Uint8Array(await response.arrayBuffer())).digest('hex');
      results.push({ file: file.file, status: response.status, matches: response.status === 200 && digest === file.sha256 });
    } catch (error) { results.push({ file: file.file, matches: false, error: error.message }); }
  }
}));
for (const path of [...ECASA_RETIRED_SLUGS.flatMap(slug => ['/' + slug, '/' + slug + '.html']), '/data/brochures-ecasa.json', '/data/fichas-proyectos.json', '/data/ecasa-image-quality.json', '/data/ecasa-official-originals.json', '/data/ecasa-manual-quality.json', '/data/fuentes-imagenes.json', '/docs/ecasa-preview-reproducible.md', '/03_CAPTURAS_CARTERA_PRIVADAS/', '/01_PDF_ORIGINALES_PRIVADOS/', '/.env',
  ...official.projects.flatMap(project => project.images.map(image => image.original.localPath)),
  ...(ownerCoverProjects.length ? ['/data/ecasa-owner-cover.json'] : []),
  ...ownerCoverProjects.flatMap(project => [project.original.localPath, ...(project.supersededCoverOnly ? [project.supersededCoverOnly.localPath] : [])])]) {
  const response = await fetch(new URL(path, base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  checks.push({ label: 'Excluded ' + path, status: response.status, passed: response.status === 404 });
}
for (const image of (manual ?? quality).projects.flatMap(project => project.images).filter(image => image.decision === 'exclude' && !image.coverOnly)) {
  const response = await fetch(new URL(image.localPath, base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  checks.push({ label: 'Visually excluded image ' + image.localPath, status: response.status, passed: response.status === 404 });
}
for (const project of ownerCoverProjects) {
  const selected = results.find(file => file.file === project.selected.localPath.slice(1));
  const approved = metadata.publicOutput.find(file => file.file === project.selected.localPath.slice(1));
  checks.push({ label: 'Selected owner cover matches approved SHA ' + project.projectSlug,
    status: selected?.status ?? null, passed: selected?.matches === true && approved?.sha256 === project.selected.sha256 });
}
for (const rule of deploymentConfig.redirects.filter(rule => rule.permanent)) {
  const response = await fetch(new URL(rule.source, base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const location = response.headers.get('location');
  checks.push({ label: 'Permanent stage redirect ' + rule.source, status: response.status, location,
    passed: response.status === 308 && location !== null && new URL(location, base).href === new URL(rule.destination, base).href });
}
const ufResponse = await fetch(new URL('/api/uf', base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
const uf = await ufResponse.json();
const businessDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
checks.push({ label: 'Official UF endpoint', status: ufResponse.status, passed: ufResponse.status === 200 &&
  uf.uf?.date === businessDate && uf.uf.valueClp > 0 && uf.uf.source?.url?.startsWith('https://www.sii.cl/') });
const summary = { origin: base.origin, sourceCommit: metadata.reviewCommit,
  files: results.length, matchingFiles: results.filter(row => row.matches).length,
  pages: results.filter(row => row.file.endsWith('.html')).length,
  selectedMedia: results.filter(row => /assets\/propiedades\/(ingevec|aj-urbana|ecasa)-preview\//.test(row.file)).length,
  ecasaMedia: results.filter(row => row.file.startsWith('assets/propiedades/ecasa-preview/')).length,
  officialMedia: results.filter(row => row.file.startsWith('assets/propiedades/ecasa-official-review/')).length,
  ownerCoverMedia: results.filter(row => row.file.startsWith('assets/propiedades/ecasa-owner-review/')).length,
  checks, uf, failures: results.filter(row => !row.matches), noApplicationWrites: true };
summary.passed = !summary.failures.length && checks.every(check => check.passed);
await writeFile(resolve(output, 'report.json'), JSON.stringify({ summary, results }, null, 2) + '\n');
console.log(JSON.stringify(summary));
if (!summary.passed) process.exitCode = 1;
