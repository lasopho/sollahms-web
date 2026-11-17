#!/usr/bin/env python3
"""Offline byte-copy packaging only. Never generates content, builds or deploys."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

if not __debug__:
    raise RuntimeError('Optimization disables required integrity gates; run Python without -O/PYTHONOPTIMIZE')

MERGE = '9e8212264e0bac24f392d8340d6e55eabb17499a'
TECHNICAL = '165f918aba402a0eb3313c85e144af2b4a7e8651'
BASELINE_DEPLOYMENT = 'dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu'
BASELINE_PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
BASELINE_MANIFEST_SHA256 = '727b0533e54435577e21d98bad33854e3c60931b07976d618c154bad2a792753'
PROTECTED_MANIFEST_SHA256 = '40cec8f95102baaf7b8de826c31c4d52df3e41b7e4f914cca6f427a1e40c529f'
SOURCE = Path('/private/tmp/sollahms-filtros-comerciales-fase10-20261117')
EVIDENCE = Path('/private/tmp/sollahms-release-preparation-evidence')
STAGE = Path('/private/tmp/sollahms-pr32-release-20261117/stage')
OUTPUT = STAGE / '.vercel/output'
PROTECTED = Path('/private/tmp/sollahms-auditoria-leben-20261116/docs/catalog-data-completeness-20261116/leben/fase10-filtros-20261117/ARCHIVOS-PROTEGIDOS.json')
F13 = Path('/private/tmp/sollahms-auditoria-leben-20261116/docs/catalog-data-completeness-20261116/leben/fase13-correcciones-pr32-20261117/MANIFIESTO-HASHES-FASE13.json')
RUNTIME = (
    'assets/css/catalog-filters.css',
    'assets/js/catalog-filter-controls.mjs',
    'assets/js/catalog-filter-engine.mjs',
    'assets/js/catalog-map.mjs',
    'assets/js/catalog-model.mjs',
    'assets/js/catalog.mjs',
    'assets/js/commercial-filter-data.mjs',
    'assets/js/commercial-filter-engine.mjs',
    'data/commercial-filter-evidence-leben.json',
    'proyectos.html',
)
FUNCTIONS = {'advisory.func', 'booking-availability.func', 'booking-create.func',
             'collaboration.func', 'contact.func', 'orientation-contact.func', 'uf.func'}
LINK = {'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH',
        'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectName': 'project-wrapp'}

def digest(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()

def record(path, body):
    return {'path': path, 'size': len(body), 'sha1': digest(body, 'sha1'), 'sha256': digest(body)}

def inventory(path):
    assert path.is_dir() and not path.is_symlink(), 'Baseline/output directory is missing or a symlink'
    rows = []
    for file in sorted(path.rglob('*')):
        assert not file.is_symlink(), f'Symlink rejected: {file}'
        if file.is_file():
            rows.append(record(file.relative_to(path).as_posix(), file.read_bytes()))
    return rows

def pin(rows):
    canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n"
                        for r in sorted(rows, key=lambda row: row['path']))
    return digest(canonical.encode())

def git(*args):
    return subprocess.check_output(['/usr/bin/git', '-C', str(SOURCE), *args],
                                   env={'PATH': '/usr/bin:/bin', 'GIT_NO_LAZY_FETCH': '1'})

def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def prepare(baseline_output):
    assert not STAGE.exists(), 'Refuse to replace an existing stage; inspect it manually'
    baseline_output = baseline_output.resolve()
    stage_resolved = STAGE.resolve()
    if (baseline_output == stage_resolved or baseline_output in stage_resolved.parents
            or stage_resolved in baseline_output.parents):
        raise RuntimeError('Baseline and stage must be disjoint; neither may contain the other')
    manifest_bytes = (EVIDENCE / 'baseline-candidate-manifest.json').read_bytes()
    assert digest(manifest_bytes) == BASELINE_MANIFEST_SHA256
    manifest = json.loads(manifest_bytes)
    before = sorted(manifest['inventory'], key=lambda row: row['path'])
    assert len(before) == 1660 and pin(before) == manifest['outputInventorySha256'] == BASELINE_PIN
    assert inventory(baseline_output) == before, 'Recover all exact baseline bytes first; do not reconstruct them'
    baseline_by_path = {row['path']: row for row in before}
    assert baseline_by_path['config.json']['sha256'] == 'ef32ad5c7a069d7de482a7a92f5022a0c852cd0b9b896a735a48bd12bae71f05'
    assert json.loads((baseline_output / 'config.json').read_text())['version'] == 3
    assert git('rev-parse', 'HEAD').decode().strip() == TECHNICAL
    protected_bytes = PROTECTED.read_bytes()
    assert digest(protected_bytes) == PROTECTED_MANIFEST_SHA256
    protected = json.loads(protected_bytes)
    assert len(protected['files']) == protected['verifiedProtectedFiles'] == 155
    for row in protected['files']:
        file = SOURCE / row['path']
        assert file.is_file() and not file.is_symlink()
        assert digest(file.read_bytes()) == row['sha256'], f"Protected source mismatch: {row['path']}"
    expected_sources = {row['path']: row['sha256'] for row in json.loads(F13.read_text())['PRFiles']}
    entries = git('ls-tree', '-r', '-z', MERGE, '--', *RUNTIME).split(b'\0')
    merge_blobs = {}
    for entry in entries:
        if entry:
            metadata, name = entry.split(b'\t', 1)
            mode, kind, blob = metadata.decode().split()
            assert kind == 'blob' and mode == '100644'
            merge_blobs[name.decode()] = blob
    assert set(merge_blobs) == set(RUNTIME)
    payloads = {}
    for path in RUNTIME:
        file = SOURCE / path
        assert file.is_file() and not file.is_symlink()
        body = file.read_bytes()
        assert digest(body) == expected_sources[path]
        assert digest(b'blob ' + str(len(body)).encode() + b'\0' + body, 'sha1') == merge_blobs[path]
        payloads[path] = body
    assert git('ls-tree', '-r', MERGE, '--', 'api', 'lib') == git('ls-tree', '-r', TECHNICAL, '--', 'api', 'lib')
    projects = json.loads((SOURCE / 'data/proyectos.json').read_text())
    fiche_paths = {'static/' + project['slug'] + '.html' for project in projects}
    assert len(projects) == len(fiche_paths) == 131 and fiche_paths.issubset(baseline_by_path)
    expected = json.loads((EVIDENCE / 'expected-candidate-manifest.json').read_text())
    expected_rows = sorted(expected['inventory'], key=lambda row: row['path'])
    assert len(expected_rows) == 1663 and pin(expected_rows) == expected['outputInventorySha256']
    # Only after every source and baseline gate passes do we create this isolated folder.
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    shutil.copytree(baseline_output, OUTPUT, symlinks=False)
    save(STAGE / '.vercel/project.json', LINK)
    for source, body in payloads.items():
        target = OUTPUT / 'static' / source
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
    after = inventory(OUTPUT)
    assert after == expected_rows and pin(after) == expected['outputInventorySha256']
    after_by_path = {row['path']: row for row in after}
    changed = sorted(path for path in baseline_by_path if baseline_by_path[path] != after_by_path[path])
    added = sorted(set(after_by_path) - set(baseline_by_path))
    assert set(changed) | set(added) == {'static/' + path for path in RUNTIME}
    assert len(changed) == 7 and len(added) == 3 and len(after) == 1663
    assert all(after_by_path[path] == baseline_by_path[path] for path in fiche_paths)
    function_paths = {path for path in baseline_by_path if path.startswith('functions/')}
    assert len(function_paths) == 57 and all(after_by_path[path] == baseline_by_path[path] for path in function_paths)
    assert {p.name for p in (OUTPUT / 'functions/api').iterdir() if p.is_dir()} == FUNCTIONS
    assert after_by_path['config.json'] == baseline_by_path['config.json']
    assert inventory(baseline_output) == before, 'Read-only baseline changed during preparation'
    receipt = {'prepared': True, 'sourceCommit': MERGE, 'technicalSourceCommit': TECHNICAL,
               'baselineDeployment': BASELINE_DEPLOYMENT, 'baselineInventorySha256': BASELINE_PIN,
               'candidateInventorySha256': pin(after), 'output': str(OUTPUT),
               'files': 1663, 'changedExisting': changed, 'added': added,
               'baselineFilesIdentical': 1653, 'protectedSourceHashesMatched': 155,
               'projectFichesUnchanged': 131, 'functionFilesUnchanged': 57, 'functionBundlesUnchanged': 7,
               'configV3ByteIdentical': True, 'projectBinding': LINK,
               'generatorsExecuted': 0, 'buildsExecuted': 0, 'deploymentsCreated': 0, 'promotions': 0,
               'baselineBytesModified': False}
    save(STAGE.parent / 'artifact-receipt.json', receipt)
    print(json.dumps(receipt, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-output', type=Path, required=True)
    args = parser.parse_args()
    prepare(args.baseline_output)
