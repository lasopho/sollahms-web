// Bind the approved Ecasa successor to the independently reviewed current main.
// Historical projections are copies used by assertions, never catalogue output.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const INTEGRATION_MANIFEST = 'data/ecasa-main-integration.json';
export const INTEGRATION_MANIFEST_SHA256 = '3272d97c81cc01ce8a186be683ec10ea405356241fb2de65ddf70561cceb0fb7';
const known = new WeakSet();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => [key, canonical(item)])) : value;
export const integrationFingerprint = value => sha(JSON.stringify(canonical(value)));
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
};
function bytes(root, name) {
  assert.match(name, /^[a-zA-Z0-9][a-zA-Z0-9/._-]+$/);
  assert.ok(!name.split('/').includes('..'), 'Unsafe integration resource');
  const path = resolve(root, name);
  assert.ok(lstatSync(path).isFile() && realpathSync(path) === path, 'Nonregular integration source: ' + name);
  return readFileSync(path);
}
function verifyFile(root, item) {
  const data = bytes(root, item.file);
  assert.equal(data.length, item.bytes, 'Integration resource size changed: ' + item.file);
  assert.equal(sha(data), item.sha256, 'Integration resource changed: ' + item.file);
}
function context(root, integration) {
  if (!integration) return assertEcasaMainIntegration(root);
  assert.ok(known.has(integration) && integration.root === resolve(root), 'Unvalidated integration context');
  return integration;
}
export function assertEcasaMainIntegration(root = ROOT, { requirePrivateDocuments = false } = {}) {
  root = resolve(root);
  if (!existsSync(resolve(root, INTEGRATION_MANIFEST))) return null;
  const data = bytes(root, INTEGRATION_MANIFEST);
  assert.equal(sha(data), INTEGRATION_MANIFEST_SHA256, 'Unreviewed Ecasa/main integration manifest');
  const policy = JSON.parse(data);
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.scope, 'ecasa_main_exact_integration');
  assert.equal(policy.protectedPreviewOnly, true);
  assert.deepEqual(policy.counts, { projects: 133, ecasa: 15, otherDevelopers: 118 });
  const ecasa = new Set(policy.ecasaSlugs);
  for (const [file, record] of Object.entries(policy.datasets)) {
    const rows = JSON.parse(bytes(root, file));
    assert.equal(rows.length, 133, 'Integrated dataset must contain exactly133 projects: ' + file);
    assert.equal(new Set(rows.map(row => row.slug)).size, 133, 'Duplicate integration identity: ' + file);
    const selected = rows.filter(row => ecasa.has(row.slug));
    const other = rows.filter(row => !ecasa.has(row.slug));
    assert.equal(selected.length, 15);
    assert.equal(other.length, 118);
    assert.equal(integrationFingerprint(selected), record.reviewEcasaSha256, 'Ecasa differs from approved a99: ' + file);
    assert.equal(integrationFingerprint(other), record.mainOtherSha256, 'Other developers differ from current f66 main: ' + file);
    assert.ok(!policy.retiredLeonSlugs.some(slug => rows.some(row => row.slug === slug)), 'Retired León project returned');
  }
  for (const item of [...policy.mainFiches, ...policy.ecasaFiches, ...policy.mainResources, ...policy.reviewResources,
    ...policy.sourceInputs]) verifyFile(root, item);
  let privateDocumentsVerified = 0;
  for (const item of policy.privateDocuments) {
    if (!requirePrivateDocuments && !existsSync(resolve(root, item.file))) continue;
    verifyFile(root, item);
    privateDocumentsVerified++;
  }
  const integration = freeze({ root, policy, projects: 133, ecasaProjects: 15,
    otherDeveloperProjects: 118, manifestSha256: sha(data), mainCommit: policy.mainCommit,
    ecasaCommit: policy.ecasaCommit, protectedPreviewOnly: true, privateDocumentsVerified });
  known.add(integration);
  return integration;
}
export function restoreEcasaMainRows(rows, file = 'data/proyectos.json', { root = ROOT, integration } = {}) {
  integration = context(root, integration);
  if (!integration) return rows;
  const record = integration.policy.datasets[file];
  assert.ok(record, 'Unapproved integration dataset projection');
  const slugs = new Set([...integration.policy.ecasaSlugs, ...integration.policy.mainEcasaSlugs]);
  const actual = rows.filter(row => slugs.has(row.slug));
  const fingerprint = integrationFingerprint(actual);
  if (fingerprint === record.originalEcasaSha256) return rows;
  assert.equal(fingerprint, record.reviewEcasaSha256, 'Unapproved Ecasa historical projection: ' + file);
  const result = rows.filter(row => !slugs.has(row.slug)).concat(structuredClone(record.originalEcasaRows));
  const order = new Map(integration.policy.projectionOrder.map((slug, index) => [slug, index]));
  assert.ok(result.every(row => order.has(row.slug)), 'Unknown project in historical projection');
  return result.sort((a, b) => order.get(a.slug) - order.get(b.slug));
}
export function assertEcasaIntegratedDataset(rows, file = 'data/proyectos.json', { root = ROOT, integration } = {}) {
  integration = context(root, integration);
  if (!integration) return false;
  const record = integration.policy.datasets[file];
  assert.ok(record && Array.isArray(rows) && rows.length === 133, 'Unapproved integrated dataset');
  const ecasa = new Set(integration.policy.ecasaSlugs);
  assert.equal(new Set(rows.map(row => row.slug)).size, 133);
  assert.equal(integrationFingerprint(rows.filter(row => ecasa.has(row.slug))), record.reviewEcasaSha256);
  assert.equal(integrationFingerprint(rows.filter(row => !ecasa.has(row.slug))), record.mainOtherSha256);
  return true;
}
export function verifyHistoricalEcasaFiche(item, { root = ROOT, integration } = {}) {
  integration = context(root, integration);
  if (!integration) return false;
  const old = [...integration.policy.originalEcasaFiches, ...integration.policy.originalSharedEcasaFiches]
    .find(record => record.file === item.path);
  if (!old) return false;
  assert.deepEqual({ file: item.path, bytes: item.bytes, sha256: item.sha256 }, old,
    'Unapproved historical Ecasa fiche exemption');
  return true;
}
export function assertIntegratedSharedSuccessor(file, expectedSha256, { root = ROOT, integration } = {}) {
  integration = context(root, integration);
  if (!integration || !Object.hasOwn(integration.policy.sharedMainSha256, file)) return false;
  assert.equal(expectedSha256, integration.policy.sharedMainSha256[file], 'Unapproved shared predecessor: ' + file);
  const current = integration.policy.sourceInputs.find(item => item.file === file);
  assert.ok(current, 'Missing pinned shared integration successor');
  verifyFile(root, current);
  return true;
}
