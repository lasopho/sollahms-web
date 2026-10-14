/**
 * Opt-in synchronous stdio transport for the restricted Codex Cloud sandbox.
 * Load only for development checks: node --import ./scripts/cloud-sync-stdio.mjs …
 *
 * This uses ordinary private temporary files instead of Node's socket pairs.
 * It does not change permissions, networking, asynchronous child processes, or
 * the default runtime when this module is not preloaded. maxBuffer is checked
 * after completion: it fails closed, but cannot stop a child at the first byte
 * above the limit. Use this only for trusted, bounded development commands.
 */
import childProcess from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const nativeSpawnSync = childProcess.spawnSync;
const nativeExecFileSync = childProcess.execFileSync;
const marker = Symbol.for('sollahms.cloud-sync-stdio');

function normalizeArgs(args, options) {
  if (Array.isArray(args)) return { args, options: options ?? {} };
  if (args == null) return { args: [], options: options ?? {} };
  return { args: [], options: args };
}

function stdioEntries(stdio) {
  if (!stdio || stdio === 'pipe') return ['pipe', 'pipe', 'pipe'];
  if (stdio === 'ignore' || stdio === 'inherit') return [stdio, stdio, stdio];
  if (!Array.isArray(stdio)) {
    throw new TypeError('Cloud stdio accepts pipe, ignore, inherit, or a stdio array.');
  }
  const entries = [...stdio];
  for (let index = 0; index < 3; index++) entries[index] ??= 'pipe';
  for (let index = 3; index < entries.length; index++) entries[index] ??= 'ignore';
  if (entries.some((entry, index) => entry === 'ipc' || (index > 2 && entry === 'pipe'))) {
    throw new TypeError('Cloud synchronous stdio does not support IPC or additional pipe descriptors.');
  }
  return entries;
}

function inputBytes(input, encoding) {
  if (typeof input === 'string') return Buffer.from(input, encoding);
  if (ArrayBuffer.isView(input)) return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  throw Object.assign(new TypeError('Cloud stdio input must be a string, Buffer, TypedArray, or DataView.'), { code: 'ERR_INVALID_ARG_TYPE' });
}

function decode(bytes, encoding) {
  return encoding && encoding !== 'buffer' ? bytes.toString(encoding) : bytes;
}

function cloudSpawnSync(file, args, options) {
  const normalized = normalizeArgs(args, options);
  args = normalized.args;
  options = normalized.options;
  if (typeof options !== 'object' || Array.isArray(options)) {
    return nativeSpawnSync(file, args, options);
  }
  const maxBuffer = Object.hasOwn(options, 'maxBuffer') ? options.maxBuffer : 1024 * 1024;
  if (maxBuffer != null && (typeof maxBuffer !== 'number' || maxBuffer < 0 || Number.isNaN(maxBuffer))) {
    throw new TypeError('Cloud stdio maxBuffer must be a nonnegative number.');
  }
  const entries = stdioEntries(options.stdio);
  // Native spawnSync ignores falsy input, but validates truthy input even when
  // stdin is inherited or ignored. Preserve both behaviours before removing it.
  const input = options.input ? inputBytes(options.input, options.encoding) : Buffer.alloc(0);
  const captures = new Map();
  const fds = [];
  const directory = mkdtempSync(join(tmpdir(), 'sollahms-cloud-stdio-' + process.pid + '-'));
  try {
    for (let index = 0; index < 3; index++) {
      if (entries[index] !== 'pipe') continue;
      const path = join(directory, String(index));
      if (index === 0) {
        writeFileSync(path, input, { mode: 0o600 });
        entries[index] = openSync(path, 'r');
      } else {
        entries[index] = openSync(path, 'w', 0o600);
        captures.set(index, path);
      }
      fds.push(entries[index]);
    }
    const nativeOptions = { ...options, stdio: entries };
    delete nativeOptions.input;
    const result = nativeSpawnSync(file, args, nativeOptions);
    const output = Array(entries.length).fill(null);
    let byteCount = 0;
    for (const [index, path] of captures) {
      const bytes = readFileSync(path);
      byteCount += bytes.length;
      output[index] = decode(bytes, options.encoding);
    }
    result.output = output;
    result.stdout = output[1];
    result.stderr = output[2];
    if (!result.error && maxBuffer > 0 && byteCount > maxBuffer) {
      const error = new Error('Cloud synchronous stdio exceeded maxBuffer after child completion.');
      Object.assign(error, { code: 'ENOBUFS', errno: -105, syscall: 'spawnSync ' + file, path: file, spawnargs: args });
      result.error = error;
    }
    return result;
  } finally {
    try {
      for (const fd of fds) closeSync(fd);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}

function cloudExecFileSync(file, args, options) {
  const normalized = normalizeArgs(args, options);
  args = normalized.args;
  options = normalized.options;
  if (typeof options !== 'object' || Array.isArray(options)) {
    return nativeExecFileSync(file, args, options);
  }
  const result = cloudSpawnSync(file, args, options);
  if (!options.stdio && result.stderr?.length) process.stderr.write(result.stderr);
  if (result.error) throw Object.assign(result.error, result);
  if (result.status !== 0) {
    const message = 'Command failed: ' + [options.argv0 || file, ...args].join(' ') +
      (result.stderr?.length ? '\n' + result.stderr.toString() : '');
    throw Object.assign(new Error(message), result);
  }
  return result.stdout;
}

if (!childProcess.spawnSync[marker]) {
  cloudSpawnSync[marker] = true;
  cloudExecFileSync[marker] = true;
  childProcess.spawnSync = cloudSpawnSync;
  childProcess.execFileSync = cloudExecFileSync;
  syncBuiltinESMExports();
}
