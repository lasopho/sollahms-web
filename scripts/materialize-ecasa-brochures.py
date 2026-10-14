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
COMMERCIAL_SLUGS = (
    'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
    'terratolten-1', 'wayra', 'alto-san-joaquin-3', 'enlace-mackenna',
    'ferroparque-2', 'espacio-victoria', 'lamara', 'terratolten-3',
    'lomas-de-puyai-3', 'cumbres-de-penuelas', 'aires-la-florida-2',
    'conecta-huechuraba', 'urban-la-florida', 'alto-san-joaquin',
    'alto-san-joaquin-2', 'nucleo-costanera', 'terratolten-2', 'nucleo-costanera-2',
)
CONSOLIDATED_PROJECTS = {
    'terratolten-1': 'terratolten', 'terratolten-2': 'terratolten', 'terratolten-3': 'terratolten',
    'lomas-de-puyai-3': 'lomas-de-puyai', 'ferroparque-2': 'ferroparque',
    'alto-san-joaquin-2': 'alto-san-joaquin', 'alto-san-joaquin-3': 'alto-san-joaquin',
    'nucleo-costanera-2': 'nucleo-costanera',
}
PROJECT_BY_ORIGIN = {slug: CONSOLIDATED_PROJECTS.get(slug, slug) for slug in COMMERCIAL_SLUGS}


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
    require(manifest.get('schemaVersion') == 2 and len(records) == 15 and
            {p['slug'] for p in records} == set(PROJECT_BY_ORIGIN.values()),
            'Ecasa manifest must have 15 distinct projects')
    commercial_sources = manifest.get('commercialSources', [])
    require(len(commercial_sources) == 22 and {source['slug'] for source in commercial_sources} ==
            set(COMMERCIAL_SLUGS), 'Ecasa manifest must retain 22 private commercial origins')
    for source in commercial_sources:
        require(source['projectSlug'] == PROJECT_BY_ORIGIN[source['slug']] and
                source['stageScope'] == 'named_development_only', 'Commercial origin mapping changed')
    origins = {source['slug']: source for source in commercial_sources}
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
            origin_slug = asset.get('originCommercialSlug')
            origin = origins.get(origin_slug)
            prefix = PREFIX + str(origin_slug) + '/'
            require(origin and origin['projectSlug'] == record['slug'] and
                    asset.get('etapa') == origin['etapa'] and path.startswith(prefix) and
                    re.fullmatch(r'[a-z0-9_.-]+\.webp', path[len(prefix):]),
                    'Derivative belongs to another commercial origin or has an unsafe path')
            inventory = origin['selectedPlanPaths'] if asset.get('kind') == 'plan' else origin['selectedImagePaths']
            require(path in inventory and asset['sourceSha256'] in
                    {document['sha256'] for document in origin['documents']},
                    'Derivative is outside its original commercial selection or document scope')
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
    require(len(jobs) == 130 and sum(len(p['images']) for p in records) == 56 and
            sum(len(p['models']) for p in records) == 74, 'All 130 reviewed derivatives must be retained')
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
    return {'entries': 15, 'commercialSources': 22, 'documents': len(manifest['sourceDocuments']),
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
