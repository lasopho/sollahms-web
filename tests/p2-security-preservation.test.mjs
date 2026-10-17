import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectP2SecurityFile, P2_SECURITY_FILES } from './p2-security-scope.mjs';

test('security historical projection accepts only reviewed source and its exact predecessor', () => {
  for (const file of P2_SECURITY_FILES) {
    const actual = readFileSync(new URL('../' + file, import.meta.url));
    const predecessor = projectP2SecurityFile(file, actual);
    assert.notDeepEqual(predecessor, actual);
    assert.deepEqual(projectP2SecurityFile(file, predecessor), predecessor);
    assert.throws(() => projectP2SecurityFile(file, Buffer.concat([actual, Buffer.from('<!-- unexpected delta -->')])));
    assert.throws(() => projectP2SecurityFile(file, Buffer.concat([predecessor, Buffer.from('<!-- unexpected delta -->')])));
  }
});

test('security projection passes unrelated bytes through without creating a broad exception', () => {
  const actual = Buffer.from('unrelated source');
  assert.equal(projectP2SecurityFile('distrito-centro.html', actual), actual);
  assert.equal(projectP2SecurityFile('vercel.json', actual), actual);
});
