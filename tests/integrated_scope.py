"""Read-only fixture projection after checking both immutable merge inputs.

These helpers never generate deployment data. Every current Ecasa row must be
the reviewed a99 row; every other row must be the concurrent f66 main row.
"""
import copy
import functools
import json
import os
import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ECASA_COMMIT = 'a99d1c8d077698f78d9824ca96d47cb19e515dcd'
MAIN_COMMIT = 'f66fbec15f1f4b30be3a70e94644a29212402a63'
DATA = {'data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json'}

@functools.lru_cache(maxsize=None)
def git_bytes(commit, path):
    return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)

@functools.lru_cache(maxsize=1)
def ecasa_slugs():
    rows = json.loads(git_bytes(ECASA_COMMIT, 'data/proyectos.json'))
    result = {row['slug'] for row in rows if row['inmobiliaria'] == 'Ecasa'}
    assert len(result) == 15
    return result

def expected_data(path):
    assert path in DATA
    ecasa = json.loads(git_bytes(ECASA_COMMIT, path))
    main = json.loads(git_bytes(MAIN_COMMIT, path))
    main_ecasa = {row['slug'] for row in json.loads(git_bytes(MAIN_COMMIT, 'data/proyectos.json'))
                  if row['inmobiliaria'] == 'Ecasa'}
    foreign = {row['slug']: row for row in main if row['slug'] not in main_ecasa}
    result = [copy.deepcopy(row if row['slug'] in ecasa_slugs() else foreign[row['slug']])
              for row in ecasa if row['slug'] in ecasa_slugs() or row['slug'] in foreign]
    assert len(foreign) == 118 and len(result) == 133
    assert [row['slug'] for row in result if row['slug'] not in ecasa_slugs()] == list(foreign)
    return result

def validate_data(path, payload=None):
    current = json.loads(payload if payload is not None else (ROOT / path).read_bytes())
    assert len(current) == len({row['slug'] for row in current}) == 133, 'Expected 133 unique merged projects'
    assert current == expected_data(path), path + ': changes exceed exact Ecasa a99 / other developers f66 scope'
    return current

def predecessor_data(path, commit):
    validate_data(path)
    return git_bytes(commit, path)

def historical_merged_data(path):
    """Keep current canonical identities and only restore fixed foreign fixtures."""
    current = validate_data(path)
    base = {row['slug']: row for row in json.loads(git_bytes(
        'f1e9bf1715cc99d095a367eba9028a9a1ad2b026', path))}
    return [row if row['slug'] in ecasa_slugs() else copy.deepcopy(base[row['slug']]) for row in current]

def validate_page(path, payload):
    slug = path.removesuffix('.html')
    commit = ECASA_COMMIT if slug in ecasa_slugs() or path in {'proyectos.html','contacto.html','agenda-asesoria.html'} else MAIN_COMMIT
    assert payload == git_bytes(commit, path), path + ': merged source page differs from its reviewed owner baseline'
    return payload

if __name__ == '__main__':
    import sys
    if sys.argv[1] == '--data':
        validate_data(sys.argv[2], sys.stdin.buffer.read())
        sys.stdout.buffer.write(git_bytes(sys.argv[3], sys.argv[2]))
    elif sys.argv[1] == '--canonical-history':
        sys.stdout.write(json.dumps(historical_merged_data(sys.argv[2]), ensure_ascii=False))
    else:
        path = sys.argv[1]
        validate_page(path, sys.stdin.buffer.read())
        sys.stdout.buffer.write(git_bytes(MAIN_COMMIT, path))


def verify_runtime_fixture(path, payload):
    assert path in {'vercel.json', 'scripts/package-vercel.mjs'}
    policy=json.loads((ROOT/'data/ecasa-main-integration.json').read_bytes())
    old_sha=policy['sharedMainSha256'][path]
    verify_shared(path, old_sha)
    stages=[MAIN_COMMIT, ECASA_COMMIT,
            json.loads((ROOT/'data/leon-main-baseline.json').read_bytes())['mainCommit'],
            json.loads((ROOT/'data/sento-main-baseline.json').read_bytes())['sourceCommit']]
    current=(ROOT/path).read_bytes()
    assert payload==current or any(payload==git_bytes(commit,path) for commit in stages), 'Unapproved historical shared fixture bytes'


def verify_shared(path, old_sha):
    import shutil
    node=os.environ.get('SOLLAHMS_CI_NODE') or shutil.which('node') or '/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
    code="import{assertEcasaMainIntegration,assertIntegratedSharedSuccessor}from'./scripts/ecasa-main-integration.mjs';const x=assertEcasaMainIntegration(process.cwd());if(!x||!assertIntegratedSharedSuccessor(process.argv[1],process.argv[2],{root:process.cwd(),integration:x}))throw Error('Unreviewed shared successor');"
    subprocess.check_call([node,'--input-type=module','-e',code,path,old_sha],cwd=ROOT)
