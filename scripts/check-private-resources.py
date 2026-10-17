#!/usr/bin/env python3
"""Read-only verification of the reviewed source transport, including private files.

No downloads, extraction, materialization, publication or rights changes occur.
An external asset root may contain an unpacked, authorized private package; its
paths must mirror the checkout. The report is evidence, never a release receipt.
"""
import sys
sys.dont_write_bytecode = True

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import re

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(name):
    """Require canonical manifest-relative paths before reading any file."""
    path = PurePosixPath(name)
    if (not isinstance(name, str) or not name.startswith('assets/') or
            '\\' in name or path.is_absolute() or '..' in path.parts or
            path.as_posix() != name):
        raise ValueError('Unsafe asset path')
    return path


def selected_inventory(root):
    """Reuse existing release selectors; do not traverse rejected/historical rows."""
    spec = importlib.util.spec_from_file_location('private_resource_release', root / 'scripts/prepare-release.py')
    release = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(release)
    inventory, manifests, rights = {}, {}, {}

    def read(name):
        content = (root / name).read_bytes()
        manifests[name] = sha(content)
        manifest = json.loads(content)
        if 'publicationRights' in manifest:
            rights[name] = manifest['publicationRights']
        elif 'rights' in manifest:
            rights[name] = manifest['rights']
        return manifest

    def add(name, publisher, asset, manifest):
        safe_path(name)
        if (not re.fullmatch(r'[a-f0-9]{64}', asset.get('sha256', '')) or
                asset.get('path', '/' + name) != '/' + name):
            raise ValueError('Incomplete asset identity: ' + name)
        item = {key: value for key, value in asset.items()
                if key in {'sha256', 'width', 'height', 'bytes', 'pageCount', 'kind'}}
        item.update(path=name, publisher=publisher, manifest=manifest)
        if name in inventory and item != inventory[name]:
            raise ValueError('Conflicting selected asset: ' + name)
        inventory[name] = item

    for publisher, folder in [('AJ Urbana', 'aj-urbana-preview'), ('Ingevec', 'ingevec-preview'), ('Ecasa', 'ecasa-preview')]:
        name = 'data/brochures-' + {'AJ Urbana': 'aj-urbana', 'Ingevec': 'ingevec', 'Ecasa': 'ecasa'}[publisher] + '.json'
        for project in read(name)['projects']:
            assets = [(image, 'image') for image in project.get('images', [])]
            assets += [(model['plan'], 'plan') for model in project.get('models', [])]
            for asset, kind in assets:
                path = asset['localPath'].lstrip('/')
                if not path.startswith('assets/propiedades/' + folder + '/'):
                    raise ValueError('Selected asset belongs to another portfolio')
                add(path, publisher, dict(asset, kind=kind), name)

    selectors = [
        ('Leben', release.LEBEN_MANIFEST, release.leben_manifest_inventory),
        ('Sento', release.SENTO_MANIFEST, release.sento_manifest_inventory),
        ('León', release.LEON_MANIFEST, release.leon_manifest_inventory),
        ('Ecasa oficiales', release.OFFICIAL_MANIFEST, release.official_manifest_inventory),
    ]
    for publisher, name, select in selectors:
        manifest = read(name)
        selected = select(manifest)
        if isinstance(selected, tuple):
            selected = selected[0]  # Retain originals as well as selected derivatives.
        documents = {p['document']['localPath'].lstrip('/'): p['document']
                     for p in manifest['projects'] if (p.get('document') or {}).get('localPath')}
        for path, asset in selected.items():
            if path in documents:
                asset = dict(asset, pageCount=documents[path]['pageCount'])
            add(path, publisher, asset, name)
    return inventory, manifests, rights


def inspect_asset(asset_root, item):
    name = item['path']
    relative = safe_path(name)
    path = asset_root / relative
    # Reject linked files or directories before reading: a package cannot make
    # verification traverse outside its asset root, even to matching bytes.
    current = asset_root
    for part in relative.parts:
        current /= part
        if current.is_symlink():
            return dict(item, status='unsafe_symlink')
    if not path.is_file():
        return dict(item, status='missing')
    data = path.read_bytes()
    row = dict(item, actualSha256=sha(data), actualBytes=len(data))
    errors = []
    if row['actualSha256'] != item['sha256']:
        errors.append('sha256_mismatch')
    if 'bytes' in item and len(data) != item['bytes']:
        errors.append('size_mismatch')
    if path.suffix.lower() == '.pdf':
        try:
            pages = len(PdfReader(path, strict=True).pages)
            row['actualPageCount'] = pages
            if pages != item.get('pageCount'):
                errors.append('page_count_mismatch')
        except Exception:
            errors.append('invalid_pdf')
    else:
        try:
            with Image.open(path) as image:
                row.update(actualWidth=image.width, actualHeight=image.height)
                image.verify()
            if (row['actualWidth'], row['actualHeight']) != (item.get('width'), item.get('height')):
                errors.append('dimensions_mismatch')
        except Exception:
            errors.append('invalid_image')
    return dict(row, status='invalid' if errors else 'verified', errors=errors)


def report(root, asset_root):
    inventory, manifests, rights = selected_inventory(root)
    rows = [inspect_asset(asset_root, inventory[name]) for name in sorted(inventory)]
    counts = Counter(row['status'] for row in rows)
    by_publisher = {}
    for row in rows:
        group = by_publisher.setdefault(row['publisher'], Counter())
        group['required'] += 1
        group[row['status']] += 1
    return {'schemaVersion': 1, 'findings': ['MED-001', 'SRC-002'],
            'scope': 'reviewed_source_transport_not_publication_authorization',
            'summary': {'required': len(rows), **dict(counts)},
            'portfolios': by_publisher, 'manifestSha256': manifests,
            'rightsAsRecorded': rights, 'assets': rows,
            'releaseApproved': False, 'publicationApproved': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Checkout containing reviewed manifests/selectors')
    parser.add_argument('--asset-root', type=Path, help='Unpacked authorized assets outside Git, mirroring checkout paths')
    parser.add_argument('--output', type=Path, help='JSON report outside the checkout; stdout always gives the summary')
    args = parser.parse_args()
    root = args.root.resolve()
    asset_root = (args.asset_root or root).absolute()
    if asset_root.is_symlink() or asset_root.resolve() != asset_root:
        parser.error('Asset root must be a canonical directory without symlink ancestors')
    if not asset_root.is_dir():
        parser.error('Asset root does not exist')
    if args.output:
        output = args.output.absolute()
        if output.is_symlink() or output.resolve() != output or output.is_relative_to(root):
            parser.error('Report must be outside the checkout and have no symlink ancestors')
    result = report(root, asset_root)
    if args.output:
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open('x') as stream:
            stream.write(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'summary': result['summary'], 'portfolios': result['portfolios'],
                      'releaseApproved': False, 'publicationApproved': False}, ensure_ascii=False))
    return 0 if result['summary'].get('verified') == result['summary']['required'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
