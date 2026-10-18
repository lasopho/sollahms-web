import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { P2_FILE_PATHS, projectP2File, projectP2CurrentFile } from './p2-preservation.mjs';
import { projectP1CommercialFile } from './p1-commercial-scope.mjs';
import { P2_REGISTER_FILES } from './p2-register-scope.mjs';

test('P2 composition validates complete current files before restoring exact predecessors and rejects extra bytes', () => {
  assert.equal(P2_FILE_PATHS.length, 166);
  assert.equal(P2_REGISTER_FILES.length, 23);
  for (const file of P2_FILE_PATHS) {
    const actual = readFileSync(new URL('../' + file, import.meta.url));
    const before = projectP2File(file, actual);
    assert.notDeepEqual(before, actual, file);
    assert.deepEqual(projectP2File(file, before), before, file);
    assert.deepEqual(projectP2CurrentFile(file, actual), before, file);
    assert.throws(() => projectP2File(file, Buffer.concat([actual, Buffer.from('\n// unreviewed extra bytes')])));
    assert.throws(() => projectP2File(file, Buffer.concat([before, Buffer.from('\n// unreviewed extra bytes')])));
    if (P2_REGISTER_FILES.includes(file)) {
      const text = actual.toString();
      const notice = text.split('\n').find(line => line.startsWith('> Conteos históricos:'));
      assert.ok(notice, file);
      assert.equal(text.replace(notice + '\n\n', ''), before.toString(), file + ': original historical body stays exact');
      assert.throws(() => projectP2File(file, Buffer.from(text.replace('Conteos históricos:', 'Conteos vigentes:'))));
      assert.throws(() => projectP2File(file, Buffer.from(text.replace(text.split('\n')[0], '# Unreviewed historical title'))));
    }
  }
});

test('older historical inputs keep their bytes and still require the original pinned P1 validation', () => {
  const file = 'proyectos.html';
  const p1 = projectP2File(file, readFileSync(new URL('../' + file, import.meta.url)));
  const historical = projectP1CommercialFile(file, p1);
  assert.throws(() => projectP2File(file, historical), /Unreviewed P2 catalogue/);
  assert.deepEqual(projectP2CurrentFile(file, historical), historical);
  assert.deepEqual(projectP1CommercialFile(file, historical), historical);
  const tampered = Buffer.concat([historical, Buffer.from('\n<!-- historical mutation -->')]);
  assert.deepEqual(projectP2CurrentFile(file, tampered), tampered);
  assert.throws(() => projectP1CommercialFile(file, tampered), /Unreviewed P1/);
});

test('Python and JavaScript P2 bridge whitelists agree and publication controls receive no projection', () => {
  const result = execFileSync('python3', ['-B', '-c',
    'import json,sys;sys.path.insert(0,"tests");from p2_scope import P2_PATHS;print(json.dumps(sorted(P2_PATHS)))'],
  { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
  assert.deepEqual(JSON.parse(result), P2_FILE_PATHS);
  execFileSync('python3', ['-B', '-c', `
import sys
sys.path.insert(0, 'tests')
from p2_scope import ROOT, restore_p2_file, restore_current_p2_file
from map_cleanup_scope import restore_map_cleanup_asset, baseline_bytes
path = 'assets/css/project-embeds.css'
raw = (ROOT / path).read_bytes()
before = restore_p2_file(path, raw)
assert before != raw
assert restore_current_p2_file(path, before) == before
assert restore_map_cleanup_asset(path, before) == baseline_bytes(path)
mutated = before + b'\\n/* unauthorized historical mutation */'
assert restore_current_p2_file(path, mutated) == mutated
try:
    restore_map_cleanup_asset(path, mutated)
except AssertionError:
    pass
else:
    raise AssertionError('Historical CSS mutation bypassed the original frozen guard')
`], { cwd: new URL('../', import.meta.url) });
  for (const file of ['vercel.json', 'scripts/package-vercel.mjs', 'scripts/leon-combined-scope.mjs', '.github/workflows/git-checkout-regression.yml']) {
    assert.equal(P2_FILE_PATHS.includes(file), false, file);
    const actual = readFileSync(new URL('../' + file, import.meta.url));
    assert.equal(projectP2File(file, actual), actual);
    assert.equal(projectP2CurrentFile(file, actual), actual);
  }
});
