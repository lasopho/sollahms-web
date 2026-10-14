// Explicit owner web authorization is separate from permission to execute a release.
// Acquisition URLs and source hashes do not prove identical delivery through Yapo.
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const BASELINE = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026';
const REVIEW = 'fb11f3fb466f7362cb20e99fa89b2abc610683c5';
const BRANCHES = ['main', 'codex/ecasa-publicacion-independiente'];
const PROJECTS = ['aires-la-florida-2', 'alto-san-joaquin', 'conecta-huechuraba',
  'cumbres-de-penuelas', 'edificio-bezanilla', 'endemico', 'enlace-mackenna',
  'espacio-victoria', 'ferroparque', 'lamara', 'lomas-de-puyai', 'nucleo-costanera',
  'terratolten', 'urban-la-florida', 'wayra'];
const INPUTS = {
  'data/brochures-ecasa.json': 'fd37681006e965e83241dccd88b7b532dba5411733219dbdc152aef1e4f5017c',
  'data/ecasa-image-quality.json': 'b4562d1dfbe729520a270039df347b8e3e62f5cff7c3b62d99355d784b0bfb34',
  'data/ecasa-manual-quality.json': '68f3187f03062d83fcc294d77bda83d7094b249bd50e60e3823ed3687317fe14',
  'data/ecasa-official-originals.json': '3fce8acf5d4c6e5e2585e2a4f7087f739db2125bc198fab9a5d19be0a9907cdf',
  'data/ecasa-owner-cover.json': 'e2b8a85a2721bee343ec6ff50689713864fc9973191018aebe46c84ed4270b4a',
};
const RESOURCE_DIGEST = '681a24ac70069e53225ef5215319c128b526ef761ff1532aa739802d3dc50eec';
const AUTHORIZATION_DIGEST = '8b2a5b05e263c78b8c51f5df5926e56b3f88f2b02fb81e3421f32f0dc80fdc65';
const SUMMARY_DIGEST = 'd6ad23575b6cd6110a1eadcbeb3f02487c2f728b46c020c864ddf98f817b521e';
const TOP_KEYS = ['schemaVersion', 'scope', 'baselineCommit', 'reviewCommit', 'allowedBranches',
  'projectSlugs', 'contentAuthorization', 'actionAuthorization', 'frozenInputs', 'selectedResources', 'selectionSummary'];
const ROW_KEYS = ['localPath', 'sha256', 'bytes', 'width', 'height', 'kind', 'projectSlug', 'originCommercialSlug'];
const fail = message => { throw new Error('Ecasa publication candidate: ' + message); };
const check = (value, message) => { if (!value) fail(message); };
const exactKeys = (object, keys) => object && !Array.isArray(object) &&
  Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' :
  value !== null && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const digest = value => hash(canonical(value));
const same = (value, expected) => canonical(value) === canonical(expected);

function webpDimensions(bytes) {
  check(bytes.length >= 26 && bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' && bytes.readUInt32LE(4) + 8 === bytes.length,
  'selected resource is not a complete WebP container');
  let offset = 12, frame = null, canvas = null;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    check(start + length + length % 2 <= bytes.length && !['ANIM', 'ANMF'].includes(type),
      'invalid or animated WebP is outside this selection');
    if (type === 'VP8X') {
      check(!canvas && length === 10 && !(bytes[start] & 2), 'invalid or animated WebP canvas');
      canvas = { width: bytes.readUIntLE(start + 4, 3) + 1, height: bytes.readUIntLE(start + 7, 3) + 1 };
    } else if (type === 'VP8L') {
      check(!frame && length >= 5 && bytes[start] === 0x2f, 'invalid WebP lossless frame');
      const bits = bytes.readUInt32LE(start + 1);
      check(bits >>> 29 === 0, 'unsupported WebP lossless version');
      frame = { width: (bits & 0x3fff) + 1, height: (bits >>> 14 & 0x3fff) + 1 };
    } else if (type === 'VP8 ') {
      check(!frame && length >= 10 && !(bytes[start] & 1) &&
        bytes.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a])), 'invalid WebP frame');
      frame = { width: bytes.readUInt16LE(start + 6) & 0x3fff, height: bytes.readUInt16LE(start + 8) & 0x3fff };
    }
    offset = start + length + length % 2;
  }
  check(offset === bytes.length && frame && frame.width > 0 && frame.height > 0 &&
    (!canvas || same(canvas, frame)), 'missing frame or mismatched native dimensions');
  return frame;
}

async function regularBytes(root, relative) {
  const path = resolve(root, relative);
  check(path.startsWith(root + sep), 'resource escapes the source root');
  const info = await lstat(path);
  check(info.isFile() && !info.isSymbolicLink() && await realpath(path) === path,
    'only regular files without symbolic parent paths are allowed');
  return readFile(path);
}

function exactSourceIdentities(resources, documents) {
  const expected = new Map();
  for (const project of documents['data/brochures-ecasa.json'].projects) {
    for (const image of project.images) expected.set(image.localPath,
      { ...image, projectSlug: project.slug, kind: 'documentary_photo' });
    for (const model of project.models) expected.set(model.plan.localPath,
      { ...model.plan, projectSlug: project.slug, kind: 'plan' });
  }
  for (const project of documents['data/ecasa-official-originals.json'].projects) {
    for (const image of project.images) expected.set(image.localPath,
      { ...image, projectSlug: project.slug, originCommercialSlug: project.slug, kind: 'official_photo' });
  }
  for (const project of documents['data/ecasa-owner-cover.json'].projects) expected.set(project.selected.localPath,
    { ...project.selected, projectSlug: project.projectSlug, originCommercialSlug: project.projectSlug, kind: 'owner_cover' });
  for (const resource of resources) {
    const original = expected.get(resource.localPath);
    check(original && ['sha256', 'width', 'height', 'projectSlug', 'originCommercialSlug', 'kind'].every(key =>
      original[key] === resource[key]), 'resource changed its approved project, commercial origin or source fingerprint');
    const folder = resource.kind === 'owner_cover' ? 'ecasa-owner-review' :
      resource.kind === 'official_photo' ? 'ecasa-official-review' : 'ecasa-preview';
    check(resource.localPath.startsWith('/assets/propiedades/' + folder + '/' + resource.originCommercialSlug + '/') &&
      resource.localPath.split('/').length === 6, 'resource crossed its exact project namespace');
  }
}

export async function validateEcasaPublicationCandidate(manifest, { root } = {}) {
  check(typeof root === 'string' && root.length > 0, 'source root is required');
  check(exactKeys(manifest, TOP_KEYS) && manifest.schemaVersion === 1 &&
    manifest.scope === 'ecasa_independent_public_candidate' && manifest.baselineCommit === BASELINE &&
    manifest.reviewCommit === REVIEW && same(manifest.allowedBranches, BRANCHES) &&
    same(manifest.projectSlugs, PROJECTS), 'unrecognized baseline, review or project scope');
  check(exactKeys(manifest.actionAuthorization, ['production', 'mergeMain']) &&
    manifest.actionAuthorization.production === false && manifest.actionAuthorization.mergeMain === false,
  'content eligibility cannot authorize Production or a merge');
  check(digest(manifest.contentAuthorization) === AUTHORIZATION_DIGEST &&
    digest(manifest.selectionSummary) === SUMMARY_DIGEST && same(manifest.frozenInputs, INPUTS),
  'owner attestation, approved counts or historical evidence changed');
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  check(!branch || BRANCHES.includes(branch), 'unexpected build branch for the independent candidate');
  const resources = manifest.selectedResources;
  check(Array.isArray(resources) && resources.length === 92 && digest(resources) === RESOURCE_DIGEST,
    'exact ninety-two selected resource fingerprints are required');
  check(new Set(resources.map(resource => resource.localPath)).size === resources.length &&
    resources.every((resource, index) => exactKeys(resource, ROW_KEYS) &&
      /^\/assets\/propiedades\/ecasa-(?:preview|official-review|owner-review)\/[a-z0-9-]+\/[a-z0-9_.-]+\.webp$/.test(resource.localPath) &&
      !resource.localPath.includes('..') && /^[a-f0-9]{64}$/.test(resource.sha256) &&
      ['bytes', 'width', 'height'].every(key => Number.isSafeInteger(resource[key]) && resource[key] > 0) &&
      PROJECTS.includes(resource.projectSlug) && (index === 0 || resources[index - 1].localPath < resource.localPath)),
  'invalid, raw, extra, duplicate or unsorted selected resource');
  const base = await realpath(resolve(root)), documents = {};
  for (const [name, expected] of Object.entries(INPUTS)) {
    const bytes = await regularBytes(base, name);
    check(hash(bytes) === expected, 'frozen historical input changed: ' + name);
    documents[name] = JSON.parse(bytes.toString('utf8'));
  }
  exactSourceIdentities(resources, documents);
  const counts = resources.reduce((result, resource) => {
    result[resource.kind] = (result[resource.kind] ?? 0) + 1; return result;
  }, {});
  check(same(counts, { documentary_photo: 11, plan: 74, official_photo: 2, owner_cover: 5 }),
    'selected photos, plans, official supplements or covers changed cardinality');
  for (const resource of resources) {
    const bytes = await regularBytes(base, resource.localPath.slice(1)), dimensions = webpDimensions(bytes);
    check(bytes.length === resource.bytes && hash(bytes) === resource.sha256 &&
      dimensions.width === resource.width && dimensions.height === resource.height,
    'selected bytes, SHA256 or native dimensions changed: ' + resource.localPath);
  }
  const manifestBytes = await regularBytes(base, 'data/ecasa-publication-candidate.json');
  check(same(JSON.parse(manifestBytes.toString('utf8')), manifest), 'validated manifest differs from the source file');
  return {
    eligible: true, manifestSha256: hash(manifestBytes), selectedResources: structuredClone(resources),
    baselineCommit: BASELINE, reviewCommit: REVIEW, projectSlugs: [...PROJECTS],
    contentAuthorization: structuredClone(manifest.contentAuthorization),
    actionAuthorization: { production: false, mergeMain: false }, summary: structuredClone(manifest.selectionSummary),
    technicalYapoFileIdentityVerified: false,
    verification: 'selected_encoded_bytes_sha256_and_header_dimensions; historical inputs immutable; owner declaration recorded',
  };
}
