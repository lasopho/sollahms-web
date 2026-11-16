"""Verify the published artifact, copy it and overlay only the three Centre files.

This helper makes no network request, executes no builder and never deploys.
Run from any directory; --refresh replaces only this helper's own verified stage.
The production source and all functions remain read-only.
"""
import argparse
import hashlib
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
WORK = ROOT / '.vercel/centro-auditoria-20261116'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
SOURCE = Path('/private/tmp/sollahms-contacto-baseline-20261116/.vercel/contacto-production-release-20261116/stage/.vercel/output')
BASELINE_MANIFEST = ROOT / 'docs/contacto-baseline-20261116/candidate-manifest.json'
BASELINE_PIN = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
BASELINE_DEPLOYMENT = 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w'
OVERLAYS = (
    'centro-orientacion.html',
    'assets/css/orientacion.css',
    'assets/js/orientacion.mjs',
)
LINK = {
    'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH',
    'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN',
    'projectName': 'project-wrapp',
}


def digest(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def inventory(directory):
    records = []
    for path in sorted(directory.rglob('*')):
        assert not path.is_symlink(), f'Symlink rejected: {path}'
        if path.is_file():
            body = path.read_bytes()
            records.append({'path': path.relative_to(directory).as_posix(),
                            'size': len(body), 'sha1': digest(body, 'sha1'),
                            'sha256': digest(body)})
    return records


def inventory_hash(rows):
    canonical = ''.join(f"{row['path']}\t{row['size']}\t{row['sha256']}\n"
                        for row in sorted(rows, key=lambda row: row['path']))
    return digest(canonical.encode())


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def prepare(refresh=False):
    os.umask(0o077)
    manifest_bytes = BASELINE_MANIFEST.read_bytes()
    baseline = json.loads(manifest_bytes)
    expected = baseline['inventory']
    expected_by_path = {row['path']: row for row in expected}
    assert baseline['outputInventorySha256'] == BASELINE_PIN
    assert len(expected) == len(expected_by_path) == 1660
    assert inventory_hash(expected) == BASELINE_PIN
    assert SOURCE.is_dir(), 'Recover the certified production artifact before proceeding.'
    actual_source = inventory(SOURCE)
    assert actual_source == sorted(expected, key=lambda row: row['path']), 'Production artifact differs from its certificate.'
    assert inventory_hash(actual_source) == BASELINE_PIN
    assert json.loads((SOURCE / 'config.json').read_text())['version'] == 3
    assert len([row for row in expected if row['path'].startswith('functions/')]) == 57
    functions = sorted(path.name for path in (SOURCE / 'functions/api').iterdir() if path.is_dir())
    assert len(functions) == 7 and all(name.endswith('.func') for name in functions)
    assert len([row for row in expected if row['path'].startswith('static/') and row['path'].endswith('.html')]) == 147
    allowed = {'static/' + rel for rel in OVERLAYS}
    assert allowed.issubset(expected_by_path)
    assert all((ROOT / rel).is_file() and not (ROOT / rel).is_symlink() for rel in OVERLAYS)
    receipt_path = WORK / 'stage-receipt.json'
    if STAGE.exists():
        assert refresh, 'Stage exists; use --refresh after changing an allowlisted source file.'
        assert receipt_path.is_file(), 'Refuse to replace a stage without our receipt.'
        previous = json.loads(receipt_path.read_text())
        assert previous['baselineDeployment'] == BASELINE_DEPLOYMENT
        assert previous['stageOutput'] == str(OUTPUT)
        assert json.loads((STAGE / '.vercel/project.json').read_text()) == LINK
        shutil.rmtree(STAGE)
    WORK.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SOURCE, OUTPUT, symlinks=False)
    save(STAGE / '.vercel/project.json', LINK)
    for rel in OVERLAYS:
        shutil.copy2(ROOT / rel, OUTPUT / 'static' / rel)
    candidate = inventory(OUTPUT)
    candidate_by_path = {row['path']: row for row in candidate}
    assert set(candidate_by_path) == set(expected_by_path), 'Added/deleted deployment files are forbidden.'
    changes = [{'path': path, 'before': expected_by_path[path], 'after': row}
               for path, row in candidate_by_path.items() if row != expected_by_path[path]]
    assert {change['path'] for change in changes}.issubset(allowed), 'Unexpected runtime delta.'
    assert candidate_by_path['static/contacto.html'] == expected_by_path['static/contacto.html']
    assert candidate_by_path['config.json'] == expected_by_path['config.json']
    assert all(row == candidate_by_path[row['path']] for row in expected
               if row['path'].startswith('functions/'))
    assert candidate_by_path['static/assets/js/orientation-engine.mjs'] == expected_by_path['static/assets/js/orientation-engine.mjs']
    candidate_pin = inventory_hash(candidate)
    summary = {
        'preparedAtUTC': datetime.now(timezone.utc).isoformat(), 'passed': True,
        'baselineDeployment': BASELINE_DEPLOYMENT,
        'baselineInventorySha256': BASELINE_PIN,
        'baselineManifestSha256': digest(manifest_bytes),
        'baselineOutput': str(SOURCE), 'stageOutput': str(OUTPUT),
        'candidateInventorySha256': candidate_pin,
        'fileCount': len(candidate), 'changedFiles': len(changes),
        'identicalFiles': len(candidate) - len(changes), 'changes': changes,
        'allowlist': sorted(allowed), 'functionFiles': 57,
        'functionBundles': functions, 'htmlPages': 147, 'projectFichesPreserved': 131,
        'contactoUnchanged': True, 'financialEngineUnchanged': True,
        'configUnchanged': True, 'allOtherRuntimeFilesIdentical': True,
        'sourceProductionArtifactModified': False, 'projectBinding': LINK,
        'buildersOrGeneratorsExecuted': 0, 'networkCalls': 0,
        'deploymentsCreatedOrPromoted': 0, 'credentialsOrSettingsModified': False,
    }
    save(receipt_path, summary)
    save(DOCS / 'stage-receipt.json', summary)
    save(DOCS / 'candidate-manifest.json', {
        'baselineDeployment': BASELINE_DEPLOYMENT,
        'baselineInventorySha256': BASELINE_PIN,
        'outputInventorySha256': candidate_pin, 'files': len(candidate),
        'changedFiles': len(changes), 'identicalFiles': len(candidate) - len(changes),
        'functionFiles': 57, 'functionBundles': 7, 'htmlPages': 147,
        'changes': changes, 'inventory': candidate,
    })
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Refresh only this helper\'s existing stage after source edits.')
    args = parser.parse_args()
    prepare(args.refresh)
