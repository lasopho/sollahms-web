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
for (const path of [...ECASA_RETIRED_SLUGS.flatMap(slug => ['/' + slug, '/' + slug + '.html']), '/data/brochures-ecasa.json', '/data/fichas-proyectos.json', '/docs/ecasa-preview-reproducible.md', '/03_CAPTURAS_CARTERA_PRIVADAS/', '/01_PDF_ORIGINALES_PRIVADOS/', '/.env']) {
  const response = await fetch(new URL(path, base), { headers: auth, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  checks.push({ label: 'Excluded ' + path, status: response.status, passed: response.status === 404 });
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
  checks, uf, failures: results.filter(row => !row.matches), noApplicationWrites: true };
summary.passed = !summary.failures.length && checks.every(check => check.passed);
await writeFile(resolve(output, 'report.json'), JSON.stringify({ summary, results }, null, 2) + '\n');
console.log(JSON.stringify(summary));
if (!summary.passed) process.exitCode = 1;
