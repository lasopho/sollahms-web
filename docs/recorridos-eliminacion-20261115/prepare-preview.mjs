import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// An isolated frozen overlay; never run a historical project/content packager.
assert.equal(process.env.VERCEL_ENV, 'preview', 'This candidate is private Preview only');
const baselineBytes = readFileSync('production-manifest.json');
assert.equal(createHash('sha1').update(baselineBytes).digest('hex'),
  'e557204aa1ea36c5216ec5b8271393f037770bf0', 'Current production source manifest');
const baseline = JSON.parse(baselineBytes);
const candidate = JSON.parse(readFileSync('candidate-manifest.json'));
const changes = JSON.parse(readFileSync('runtime-changes.json'));
assert.equal(baseline.length, 1660);
assert.equal(candidate.length, baseline.length);
assert.equal(changes.length, 66);
const changed = new Map(changes.map(row => [row.file, row]));
assert.equal(changed.size, changes.length);
const actual = [];
function scan(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name), stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink(), 'Symlinks are forbidden');
    if (stat.isDirectory()) scan(path); else actual.push(path);
  }
}
scan('release');
assert.deepEqual(actual.sort(), candidate.map(row => row.file).sort());
const paths = new Set();
for (const [index, row] of candidate.entries()) {
  assert.equal(row.file, baseline[index].file, 'No added, removed or reordered runtime paths');
  assert.ok(row.file.startsWith('release/') && !row.file.includes('..'));
  assert.ok(!paths.has(row.file)); paths.add(row.file);
  const change = changed.get(row.file);
  if (change) {
    assert.equal(baseline[index].sha, change.beforeSha1);
    assert.equal(row.sha, change.afterSha1);
    assert.equal(row.size, change.afterBytes);
    assert.ok(/^release\/static\/(?:[a-z0-9-]+\.html|assets\/css\/project-(?:detail|embeds)\.css)$/.test(row.file));
  } else assert.deepEqual(row, baseline[index], 'Unrelated runtime content must be exact');
  const bytes = readFileSync(row.file);
  assert.equal(createHash('sha1').update(bytes).digest('hex'), row.sha, row.file);
  if (row.size !== undefined) assert.equal(bytes.length, row.size, row.file);
  const output = '.vercel/output/' + row.file.slice('release/'.length);
  mkdirSync(dirname(output), { recursive: true }); copyFileSync(row.file, output);
}
console.log(JSON.stringify({ previewOnly: true, total: candidate.length,
  changed: changed.size, preserved: candidate.length - changed.size,
  baselineDeployment: 'dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN' }));
