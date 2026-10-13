#!/usr/bin/env python3
"""Rebuild selected Ecasa derivatives from private, hash-verified originals.

The reviewed manifest is immutable. Originals, captures and inventories are
never copied into public assets. Crops use normalized top-left coordinates.
The PDF renderer and WebP encoder must reproduce reviewed hashes exactly.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/assets/propiedades/ecasa-preview/'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def valid_hash(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[a-f0-9]{64}', value))


def render_page(pdftoppm, source, page, destination, width=3400):
    subprocess.run([pdftoppm, '-f', str(page), '-l', str(page), '-singlefile',
                    '-scale-to-x', str(width), '-scale-to-y', '-1', '-png',
                    str(source), str(destination.with_suffix(''))], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def render_asset(page_path, asset, destination):
    crop = asset.get('crop', [0, 0, 1, 1])
    require(isinstance(crop, list) and len(crop) == 4 and
            all(isinstance(n, (int, float)) for n in crop) and
            0 <= crop[0] < crop[2] <= 1 and 0 <= crop[1] < crop[3] <= 1,
            'Invalid normalized crop')
    with Image.open(page_path) as page:
        box = (round(crop[0] * page.width), round(crop[1] * page.height),
               round(crop[2] * page.width), round(crop[3] * page.height))
        image = page.crop(box).convert('RGB')
        if asset.get('kind') != 'plan':
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        image.save(destination, 'WEBP', quality=96 if asset.get('kind') == 'plan' else 93,
                   method=6)


def verify_image(path, metadata):
    require(digest(path) == metadata['sha256'], 'Derivative differs from reviewed SHA256')
    with Image.open(path) as image:
        require(image.size == (metadata['width'], metadata['height']),
                'Derivative dimensions differ from review')
        image.verify()


def materialize(manifest_path, input_directory, root=ROOT, pdftoppm='pdftoppm'):
    manifest_path, input_directory, root = map(Path, (manifest_path, input_directory, root))
    original_manifest = manifest_path.read_bytes()
    manifest = json.loads(original_manifest)
    records = manifest['projects']
    require(len(records) == 22 and len({p['slug'] for p in records}) == 22,
            'Ecasa manifest must have 22 distinct entries')
    require(manifest['publicationRights']['sourceChannel'] == 'Ecasa/user_supplied',
            'Ecasa source channel must remain independent')
    sources = {}
    for doc in manifest['sourceDocuments']:
        name = doc['fileName']
        require(Path(name).name == name and '\\' not in name and name.lower().endswith('.pdf'),
                'Original filename must be a PDF basename')
        source = input_directory / name
        require(source.is_file() and not source.is_symlink() and
                source.resolve().is_relative_to(input_directory.resolve()),
                'Private source is missing or escapes input directory')
        require(valid_hash(doc['sha256']) and digest(source) == doc['sha256'],
                'Private original SHA256 mismatch')
        require(len(PdfReader(source).pages) == doc['pageCount'], 'PDF page count mismatch')
        sources.setdefault(doc['sha256'], (source, doc['pageCount']))
    jobs = []
    paths = set()
    for record in records:
        assets = list(record.get('images', [])) + [m['plan'] for m in record.get('models', [])]
        for asset in assets:
            path = asset['localPath']
            prefix = PREFIX + record['slug'] + '/'
            require(path.startswith(prefix) and
                    re.fullmatch(r'[a-z0-9_.-]+\.webp', path[len(prefix):]),
                    'Derivative belongs to another entry or has an unsafe path')
            destination = root / path.lstrip('/')
            require(destination.resolve() == root.resolve() / path.lstrip('/') and
                    not destination.is_symlink(), 'Derivative path contains a symlink')
            require(path not in paths, 'Duplicate selected asset path')
            paths.add(path)
            require(asset.get('privacySafe') is True and asset.get('visuallyVerified') is True and
                    asset.get('assetScope') == 'named_development', 'Missing selected-media review')
            require(valid_hash(asset.get('sha256')), 'Missing reviewed SHA256')
            source, count = sources[asset['sourceSha256']]
            page = asset['sourcePage']
            require(type(page) is int and 1 <= page <= count, 'Invalid source page')
            jobs.append((source, page, destination, asset))
    staged = []
    with tempfile.TemporaryDirectory(prefix='sollahms-ecasa-materialize-') as temporary:
        temporary = Path(temporary)
        cached = {}
        for index, (source, page, destination, asset) in enumerate(jobs):
            identity = (asset['sourceSha256'], page)
            if identity not in cached:
                page_path = temporary / f'page-{len(cached)}.png'
                render_page(pdftoppm, source, page, page_path)
                cached[identity] = page_path
            candidate = temporary / f'asset-{index}.webp'
            render_asset(cached[identity], asset, candidate)
            verify_image(candidate, asset)
            staged.append((candidate, destination, asset))
        require(manifest_path.read_bytes() == original_manifest, 'Review changed during materialization')
        for candidate, destination, asset in staged:
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists() or digest(destination) != asset['sha256']:
                shutil.copyfile(candidate, destination)
            verify_image(destination, asset)
    return {'entries': 22, 'documents': len(manifest['sourceDocuments']),
            'uniqueDocuments': len(sources), 'images': sum(len(p['images']) for p in records),
            'plans': sum(len(p['models']) for p in records), 'assets': len(jobs),
            'manifestUnchanged': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'data/brochures-ecasa.json')
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    args = parser.parse_args()
    require(args.pdftoppm, 'Poppler pdftoppm is required')
    print(json.dumps(materialize(args.manifest, args.input, args.root, args.pdftoppm)))


if __name__ == '__main__':
    main()
