#!/usr/bin/env python3
"""Overlay the homepage and its exact official PNG favicon on current Production.

All other deployed files remain byte-identical. No legacy build, network,
deployment, provider operation, secret reading or indexing request is performed.
"""
import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_DEPLOYMENT = 'dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH'
BASE_INVENTORY_SHA256 = 'c4b1a07527291aa020ebef549aa32f0bb2f2858f9f55312482584f333b14319b'
CHANGED = {'static/index.html'}
ADDED = {'static/assets/branding/favicon.png'}


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def inventory(root):
    result = {}
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlink in runtime artifact')
        if path.is_file():
            data = path.read_bytes()
            result[path.relative_to(root).as_posix()] = {
                'bytes': len(data), 'sha1': hashlib.sha1(data).hexdigest(),
                'sha256': sha256(data)}
    return result


def compare(before, after):
    added = after.keys() - before.keys()
    removed = before.keys() - after.keys()
    changed = {path for path in before.keys() & after.keys() if before[path] != after[path]}
    if added != ADDED or removed or changed != CHANGED:
        raise ValueError('Unexpected runtime delta: ' + str((added, removed, changed)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-output', type=Path, required=True)
    parser.add_argument('--baseline-inventory', type=Path, required=True)
    parser.add_argument('--output-directory', type=Path, required=True)
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    baseline = args.baseline_output.resolve()
    output = args.output_directory.resolve()
    if output.exists() or output.is_relative_to(ROOT) or output.is_relative_to(baseline):
        raise ValueError('Use a new private directory outside checkout and baseline')
    raw = args.baseline_inventory.read_bytes()
    if sha256(raw) != BASE_INVENTORY_SHA256:
        raise ValueError('Unrecognized production inventory')
    before = inventory(baseline)
    if before != json.loads(raw)['files']:
        raise ValueError('Local baseline differs from certified Production')
    target = output / '.vercel/output'
    shutil.copytree(baseline, target)
    for relative in CHANGED | ADDED:
        source_path = relative.removeprefix('static/')
        shutil.copyfile(ROOT / source_path, target / relative)
    after = inventory(target)
    compare(before, after)
    manifest = {'productionBaseDeployment': BASE_DEPLOYMENT, 'files': after}
    manifest_bytes = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode()
    manifest_path = output.parent / (output.name + '-inventory.json')
    if manifest_path.exists():
        raise ValueError('Private inventory destination already exists')
    manifest_path.write_bytes(manifest_bytes)
    receipt = {
        'recordedAtUTC': datetime.now(timezone.utc).isoformat(),
        'productionBaseDeployment': BASE_DEPLOYMENT,
        'productionBaseInventorySHA256': BASE_INVENTORY_SHA256,
        'candidateInventorySHA256': sha256(manifest_bytes),
        'baseFiles': len(before), 'candidateFiles': len(after),
        'changed': [{'path': path, 'before': before[path], 'after': after[path]}
                    for path in sorted(CHANGED)],
        'added': [{'path': path, 'after': after[path]} for path in sorted(ADDED)],
        'removed': [], 'unchangedFiles': len(before) - len(CHANGED),
        'otherCorporatePagesByteIdentical': True,
        'catalogueAll152FichesDocumentaryCenterByteIdentical': True,
        'functionsConfigRobotsSitemapSharedAssetsByteIdentical': True,
        'officialSVGAndOrganizationLogoPreserved': True,
        'productionDeploymentPerformed': False, 'indexingRequests': 0,
        'realProviderCalls': 0, 'method': 'Pinned complete production inventory and all-file SHA1/SHA256 comparison; homepage + one exact favicon PNG overlay only.'}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({key: receipt[key] for key in ('baseFiles', 'candidateFiles', 'unchangedFiles', 'candidateInventorySHA256')}))


if __name__ == '__main__':
    main()
