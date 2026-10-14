#!/usr/bin/env node
/** Verify the opt-in cloud transport against real local subprocesses. */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { normalizeFicheCopy } from './public-fiche-copy.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const checks = [];
const leftovers = () => readdirSync(tmpdir()).filter(name => name.startsWith('sollahms-cloud-stdio-' + process.pid + '-')).sort();
const before = leftovers();
assert.equal(execFileSync[Symbol.for('sollahms.cloud-sync-stdio')], true, 'Preload scripts/cloud-sync-stdio.mjs with --import.');

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.match(head, /^[a-f\d]{40}$/);
checks.push('Git HEAD captured without discarding subprocess errors');

const source = '<body>' + '<figcaption>Piscina según brochure · Vista de Peñuelas ↗</figcaption>'.repeat(3000) + '</body>';
const projection = execFileSync(process.execPath, ['scripts/public-fiche-copy.mjs', '--stdin'], {
  cwd: root, input: Buffer.from(source), encoding: 'utf8', maxBuffer: 2_000_000,
});
assert.equal(projection, normalizeFicheCopy(source));
assert.ok(!projection.includes('\uFFFD'));
checks.push('Existing CLI preserves exact 3000-caption UTF-8 input/output');

const binaryInput = new Uint8Array([0, 1, 127, 128, 255]);
const binaryOutput = execFileSync(process.execPath, ['-e', "process.stdout.write(require('node:fs').readFileSync(0))"], { input: binaryInput });
assert.deepEqual(binaryOutput, Buffer.from(binaryInput));
checks.push('TypedArray input and Buffer output retain every byte');

const failure = spawnSync(process.execPath, ['-e', "console.log('stdout retained');console.error('stderr retained');process.exitCode=7"], { encoding: 'utf8' });
assert.equal(failure.status, 7);
assert.equal(failure.stdout, 'stdout retained\n');
assert.equal(failure.stderr, 'stderr retained\n');
assert.equal(failure.error, undefined);
assert.throws(() => execFileSync(process.execPath, ['-e', "console.error('expected failure');process.exitCode=9"], { stdio: 'pipe' }), error => error.status === 9 && error.stderr.toString() === 'expected failure\n');
checks.push('Nonzero status and stderr remain visible and execFileSync throws');

const timeout = spawnSync(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 100, encoding: 'utf8' });
assert.equal(timeout.error?.code, 'ETIMEDOUT');
assert.equal(timeout.status, null);
assert.equal(timeout.signal, 'SIGTERM');
checks.push('Timeout fails with ETIMEDOUT and retains termination signal');

const overflow = spawnSync(process.execPath, ['-e', "process.stdout.write('a'.repeat(100))"], { maxBuffer: 10, encoding: 'utf8' });
assert.equal(overflow.error?.code, 'ENOBUFS');
assert.equal(overflow.status, 0);
assert.equal(overflow.stdout.length, 100);
assert.throws(() => execFileSync(process.execPath, ['-e', "process.stdout.write('b'.repeat(100))"], { maxBuffer: 10 }), error => error.code === 'ENOBUFS');
for (const maxBuffer of [null, undefined, 0]) {
  const unlimited = spawnSync(process.execPath, ['-e', "process.stdout.write('c'.repeat(1_100_000))"], { maxBuffer });
  assert.equal(unlimited.error, undefined);
  assert.equal(unlimited.stdout.length, 1_100_000);
}
checks.push('maxBuffer fails closed after completion instead of reporting success');

const missing = spawnSync('/sollahms-nonexistent-executable', [], { encoding: 'utf8' });
assert.equal(missing.error?.code, 'ENOENT');
assert.equal(missing.status, null);
assert.throws(() => execFileSync('/sollahms-nonexistent-executable'), error => error.code === 'ENOENT');
assert.throws(() => spawnSync(process.execPath, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }), /does not support IPC/);
for (const input of [0, false]) {
  const ignoredFalsy = spawnSync(process.execPath, ['-e', "process.stdout.write(require('node:fs').readFileSync(0))"], { input });
  assert.equal(ignoredFalsy.status, 0);
  assert.deepEqual(ignoredFalsy.stdout, Buffer.alloc(0));
}
assert.throws(() => spawnSync(process.execPath, [], { input: {}, stdio: 'ignore' }), error => error.code === 'ERR_INVALID_ARG_TYPE');
assert.throws(() => spawnSync(process.execPath, [], { input: {}, stdio: 'inherit' }), error => error.code === 'ERR_INVALID_ARG_TYPE');
const extraIgnored = spawnSync(process.execPath, ['-e', "console.log('extra fd ignored')"], { stdio: ['ignore', 'pipe', 'pipe', null], encoding: 'utf8' });
assert.equal(extraIgnored.error, undefined);
assert.equal(extraIgnored.output.length, 4);
assert.equal(extraIgnored.output[3], null);
assert.equal(extraIgnored.stdout, 'extra fd ignored\n');
checks.push('Missing executables, unsupported IPC, and invalid input remain explicit errors');

assert.deepEqual(leftovers(), before);
checks.push('Private temporary files are removed after success and failure');
console.log(JSON.stringify({ allPassed: true, checks, maxBufferEnforced: 'after-child-completion' }));
