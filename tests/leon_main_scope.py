"""Strict León successor projection for independently scoped Python audits."""
import functools, hashlib, json, subprocess, os, shutil, base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PIN='2a5a315c3a63073a01e38f4fb68c0dbb83d5481b7c90aea6f19616e328edf64c'
NODE=os.environ.get('SOLLAHMS_CI_NODE') or shutil.which('node') or '/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
BRIDGE="""
import {readFileSync} from 'node:fs';
import {projectLeonFile,readPreLeonFile} from './tests/leon-main-preservation.mjs';
const r=JSON.parse(readFileSync(0,'utf8'));
const result=r.bytes===undefined?readPreLeonFile(r.path):projectLeonFile(r.path,Buffer.from(r.bytes,'base64'));
process.stdout.write(result.toString('base64'));
"""
@functools.lru_cache(maxsize=1)
def baseline():
    payload=(ROOT/'data/leon-main-baseline.json').read_bytes()
    assert hashlib.sha256(payload).hexdigest()==PIN
    return json.loads(payload)
@functools.lru_cache(maxsize=None)
def before(path):
    return subprocess.check_output(['git','show',baseline()['mainCommit']+':'+path],cwd=ROOT)
@functools.lru_cache(maxsize=256)
def project_leon_file(path,payload):
    result=subprocess.check_output([NODE,'--input-type=module','-e',BRIDGE],cwd=ROOT,input=json.dumps({'path':path,'bytes':base64.b64encode(payload).decode()}).encode())
    return base64.b64decode(result)
@functools.lru_cache(maxsize=256)
def read_pre_leon(path):
    result=subprocess.check_output([NODE,'--input-type=module','-e',BRIDGE],cwd=ROOT,input=json.dumps({'path':path}).encode())
    return base64.b64decode(result)
