import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const workflow = read('.github/workflows/git-checkout-regression.yml');
const hash = text => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0').update(text).digest('hex');
const originalWorkflow = '92ac4a35489524753b018de543470fce9eed136b';

function assertTargets(source) {
  const section = source.match(/^  pull_request:\n([\s\S]*?)(?=^\S)/m)?.[1];
  assert.ok(section);
  assert.deepEqual([...section.matchAll(/^      - (.+)$/gm)].map(row => row[1]),
    ['main', 'codex/leon-cartera-preview', 'codex/p2-revision-sin-deploy-20261017']);
  assert.doesNotMatch(source, /^  pull_request_target:/m);
}

test('P2 draft review runs against the exact P1 base without broadening PR targets', () => {
  assertTargets(workflow);
  for (const source of [workflow.replace('      - codex/leon-cartera-preview\n', ''),
    workflow.replace('      - codex/leon-cartera-preview', '      - "*"'),
    workflow.replace('      - codex/p2-revision-sin-deploy-20261017\n', ''),
    workflow.replace('      - codex/p2-revision-sin-deploy-20261017', '      - "*"'),
    workflow.replace('  pull_request:', '  pull_request_target:')]) {
    assert.throws(() => assertTargets(source));
  }
});

test('P2 draft opening and subsequent head updates trigger the unchanged review events', () => {
  assert.match(workflow, /^    types: \[opened, synchronize, reopened, ready_for_review\]$/m);
  assert.doesNotMatch(workflow, /github\.event\.pull_request\.draft|workflow_dispatch|workflow_run/);
});

test('P2 CI checks the published head with complete history and no persisted credentials', () => {
  function check(source) {
    assert.match(source, /^          ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}$/m);
    assert.match(source, /^          fetch-depth: 0$/m);
    assert.match(source, /^          persist-credentials: false$/m);
  }
  check(workflow);
  for (const source of [workflow.replace('head.sha', 'base.sha'),
    workflow.replace('fetch-depth: 0', 'fetch-depth: 1'),
    workflow.replace('persist-credentials: false', 'persist-credentials: true')]) {
    assert.throws(() => check(source));
  }
});

test('P2 workflow retains read-only permissions and the reviewed immutable action pins', () => {
  assert.match(workflow, /^permissions:\n  contents: read\n\n/m);
  const actions = [...workflow.matchAll(/^        uses: (.+)$/gm)].map(row => row[1]);
  assert.deepEqual(actions, [
    'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6',
    'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6',
    'actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1 # v6',
  ]);
  assert.doesNotMatch(workflow, /secrets\.|write-all|id-token:|contents: write/);
});

test('P2 technical workflow delta preserves every native test step and introduces no deployment', () => {
  const restored = workflow.replace('      - codex/leon-cartera-preview\n', '')
    .replace('      - codex/p2-revision-sin-deploy-20261017\n', '')
    .replace('          ref: ${{ github.event.pull_request.head.sha || github.sha }}\n', '');
  assert.equal(hash(restored), originalWorkflow,
    'Only the stacked PR base and exact source checkout may change');
  assert.match(workflow, /run: python scripts\/run-git-ci\.py --output/);
  assert.match(workflow, /run: node --test --test-reporter=tap tests\/sento-main-merge\.mjs/);
});

test('P2 review preserves exact Vercel configuration, release guards and private rights', () => {
  const blobs = {
    'vercel.json': '470459fa3e10fff13ddfe1d935f830c85b7000e2',
    'scripts/package-vercel.mjs': '7671f87f3e5c34c24c52d2ad13cac1161f47d248',
    'scripts/prepare-release.py': '37d1c7fe6eed9b657a4b8d9e27298b877a182e6b',
    'scripts/leon-combined-scope.mjs': 'bc12b5104d3bbac522cf8a0edf5f9d956babccc6',
    'docs/release-reference.json': '220114127af17fe14acfa5e3eea97b895455e0db',
    'data/brochures-ecasa.json': '2671ce3e3b3f053fd17991b7c606c851dabdfe12',
    'data/brochures-leben.json': 'c1cdd694090b37613f97ca7cebb760ecb135e89c',
  };
  for (const [path, expected] of Object.entries(blobs)) assert.equal(hash(read(path)), expected, path);
  const config = JSON.parse(read('vercel.json'));
  assert.equal(config.git.deploymentEnabled.main, false);
  assert.equal(config.git.deploymentEnabled['codex/leon-cartera-preview'], false);
  assert.equal(Object.hasOwn(config.git.deploymentEnabled, 'codex/p2-revision-sin-deploy-20261017'), false);
});
