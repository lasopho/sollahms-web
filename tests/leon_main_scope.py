"""Exact León predecessor projection for independently scoped historical audits."""
import functools, hashlib, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PIN='2a5a315c3a63073a01e38f4fb68c0dbb83d5481b7c90aea6f19616e328edf64c'
@functools.lru_cache(maxsize=1)
def baseline():
    payload=(ROOT/'data/leon-main-baseline.json').read_bytes()
    assert hashlib.sha256(payload).hexdigest()==PIN
    return json.loads(payload)
@functools.lru_cache(maxsize=None)
def before(path):
    return subprocess.check_output(['git','show',baseline()['mainCommit']+':'+path],cwd=ROOT)
def read_pre_leon(path):
    b=baseline()
    if any(path==s+'.html' for s in b['retiredSlugs']):
        assert not (ROOT/path).exists()
        result=before(path)
        assert (ROOT/'docs/archive/leon'/path).read_bytes()==result
        return result
    payload=(ROOT/path).read_bytes()
    if path in b['originalRows']:
        actual=json.loads(payload);original=json.loads(before(path))
        slugs=set(b['authorizedSlugs']+b['retiredSlugs'])
        assert [p for p in actual if p['slug'] not in slugs]==[p for p in original if p['slug'] not in slugs]
        review=json.loads((ROOT/'data/brochures-leon.json').read_bytes())
        key={'data/proyectos.json':'catalogue','data/fichas-proyectos.json':'research','data/registro-fichas.json':'ledger'}[path]
        assert [p for p in actual if p['slug'] in slugs]==review[key]
        assert [p['slug'] for p in actual]==[p['slug'] for p in original if p['slug'] not in b['retiredSlugs']]
        return before(path)
    if path in b['approvedFiles'] and path!='assets/css/leon.css':
        assert hashlib.sha256(payload).hexdigest()==b['approvedFiles'][path],path
        return before(path)
    return payload
