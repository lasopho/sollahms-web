#!/usr/bin/env python3
"""Rebuild only approved AJ media, never changing the reviewed manifest.

Requires Pillow, pypdf and Poppler's pdftoppm. Originals remain private: no PDF,
ZIP or source inventory is copied to the public assets. All output is staged
and checked against the approved hashes and dimensions before promotion. A
changed renderer/encoder must fail rather than silently approve new bytes.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/assets/propiedades/aj-urbana-preview/'
SLUGS = {
    'downtown-san-martin', 'edificio-teatinos-750',
    'edificio-vista-amunategui', 'monjitas-690', 'vista-morande',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def valid_hash(value):
    return isinstance(value, str) and re.fullmatch(r'[a-f0-9]{64}', value)


def input_file(directory, relative):
    require(isinstance(relative, str) and '\\' not in relative,
            'Invalid private input path')
    path = Path(relative)
    require(not path.is_absolute() and '..' not in path.parts,
            'Private input must remain inside the supplied directory')
    source = directory / path
    require(source.resolve().is_relative_to(directory.resolve()),
            'Private input escapes the supplied directory')
    require(source.is_file(), 'Required original or candidate is missing')
    return source


def asset_path(root, record, metadata, expected_name=None):
    local_path = metadata.get('localPath')
    prefix = PREFIX + record['slug'] + '/'
    require(isinstance(local_path, str) and local_path.startswith(prefix),
            'Approved asset belongs to a different project')
    name = local_path[len(prefix):]
    require(re.fullmatch(r'[a-z0-9_.-]+\.(?:webp|png|jpe?g)', name),
            'Approved asset must be a single safe raster filename')
    require(expected_name is None or name == expected_name,
            'Approved asset filename differs from its source/model')
    destination = root / local_path.lstrip('/')
    require(destination.resolve().is_relative_to(root.resolve()),
            'Approved asset destination escapes the repository')
    require(destination.resolve() == root.resolve() / local_path.lstrip('/'),
            'Approved asset destination contains a symlink')
    require(not destination.is_symlink(), 'Approved asset cannot be a symlink')
    require(valid_hash(metadata.get('sha256')), 'Missing approved asset SHA256')
    for field in ['width', 'height']:
        require(type(metadata.get(field)) is int and metadata[field] > 0,
                'Missing approved raster dimensions')
    return destination


def verify_image(path, metadata):
    require(digest(path) == metadata['sha256'],
            'Materialized bytes differ from the approved asset SHA256')
    with Image.open(path) as image:
        require(image.size == (metadata['width'], metadata['height']),
                'Materialized dimensions differ from the approved asset')
        image.verify()


def render_plan(pdftoppm, source, page, destination):
    with tempfile.TemporaryDirectory(prefix='sollahms-aj-plan-') as temporary:
        output = Path(temporary) / 'page'
        subprocess.run([
            pdftoppm, '-f', str(page), '-l', str(page), '-singlefile',
            '-scale-to', '3000', '-png', str(source), str(output),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        with Image.open(output.with_suffix('.png')) as image:
            image.convert('RGB').save(destination, 'WEBP', quality=96, method=6)


def promote(staged, temporary):
    """Keep valid assets untouched and roll back an interrupted promotion."""
    changes = []
    for index, (source, destination, metadata) in enumerate(staged):
        if destination.is_file() and digest(destination) == metadata['sha256']:
            verify_image(destination, metadata)
            continue
        require(not destination.exists() or destination.is_file(),
                'Approved asset destination is not a regular file')
        backup = None
        if destination.exists():
            backup = temporary / f'backup-{index}'
            shutil.copy2(destination, backup)
        changes.append((source, destination, backup))

    promoted = []
    created_directories = []
    try:
        for source, destination, backup in changes:
            missing = []
            parent = destination.parent
            while not parent.exists():
                missing.append(parent)
                parent = parent.parent
            destination.parent.mkdir(parents=True, exist_ok=True)
            created_directories.extend(reversed(missing))
            os.replace(source, destination)
            promoted.append((destination, backup))
    except BaseException:
        for destination, backup in reversed(promoted):
            if backup is None:
                destination.unlink()
            else:
                os.replace(backup, destination)
        for directory in reversed(created_directories):
            directory.rmdir()
        raise
    return len(promoted)


def materialize(manifest_path, input_directory, pdftoppm, root=ROOT):
    require(bool(pdftoppm), 'Poppler pdftoppm is required')
    root = Path(root)
    manifest_path = Path(manifest_path)
    input_directory = Path(input_directory)
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    records = manifest['projects']
    require(len(records) == len(SLUGS) and {p['slug'] for p in records} == SLUGS,
            'Only the five reviewed AJ projects can be materialized')
    jobs = []
    destinations = set()
    for record in records:
        document = record['document']
        name = document['fileName']
        require(isinstance(name, str) and Path(name).name == name and
                '/' not in name and '\\' not in name and name.lower().endswith('.pdf'),
                'Original document must be a PDF basename')
        require(valid_hash(document.get('sha256')), 'Missing original PDF SHA256')
        source = input_file(input_directory, 'brochures/' + name)
        require(digest(source) == document['sha256'], 'The original document has changed')
        require(type(document.get('pageCount')) is int and document['pageCount'] > 0,
                'Invalid approved PDF page count')
        require(len(PdfReader(source).pages) == document['pageCount'],
                'Original PDF page count differs from its approved provenance')
        for image in record['images']:
            candidate = input_file(input_directory, image['originalFile'])
            require(Path(image['originalFile']).parent == Path('imagenes_para_revision'),
                    'Candidate must come from the reviewed image directory')
            destination = asset_path(root, record, image, candidate.name)
            require(valid_hash(image.get('originalSha256')) and
                    digest(candidate) == image['originalSha256'], 'The candidate has changed')
            require(image['originalSha256'] == image['sha256'],
                    'Copied candidate differs from its approved output SHA256')
            require(type(image.get('sourcePage')) is int and
                    1 <= image['sourcePage'] <= document['pageCount'] and
                    image.get('sourceSha256') == document['sha256'],
                    'Candidate source provenance differs from its project PDF')
            verify_image(candidate, image)
            jobs.append(('image', source, candidate, image['sourcePage'], destination, image))
        for model in record['models']:
            model_id = model['modelo']
            page = model['pagina_brochure']
            require(isinstance(model_id, str) and re.fullmatch(r'[0-9]+[A-C]?', model_id),
                    'Invalid reviewed model identifier')
            require(type(page) is int and 1 <= page <= document['pageCount'],
                    'Model source page is outside its original PDF')
            plan = model['plan']
            require(plan.get('sourcePage') == page and
                    plan.get('sourceSha256') == document['sha256'],
                    'Plan source provenance differs from its approved model')
            expected_name = f'plano-{model_id.lower()}-p{page:02d}.webp'
            destination = asset_path(root, record, plan, expected_name)
            jobs.append(('plan', source, None, page, destination, plan))
    for job in jobs:
        destination = job[4]
        require(destination not in destinations, 'Duplicate approved output asset path')
        destinations.add(destination)

    with tempfile.TemporaryDirectory(prefix='sollahms-aj-staging-', dir=root.parent) as temporary_name:
        temporary = Path(temporary_name)
        def stage(indexed_job):
            index, (kind, source, candidate, page, destination, metadata) = indexed_job
            staged_path = temporary / f'{index}{destination.suffix}'
            if kind == 'image':
                shutil.copyfile(candidate, staged_path)
            else:
                render_plan(pdftoppm, source, page, staged_path)
            verify_image(staged_path, metadata)
            return staged_path, destination, metadata

        with ThreadPoolExecutor(max_workers=3) as executor:
            staged = list(executor.map(stage, enumerate(jobs)))
        require(manifest_path.read_bytes() == manifest_bytes,
                'Approved manifest changed while materializing; nothing was promoted')
        written = promote(staged, temporary)
    return {
        'projects': len(records), 'uniquePlans': sum(len(p['models']) for p in records),
        'addedImages': sum(len(p['images']) for p in records),
        'writtenAssets': written, 'manifestUnchanged': True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    args = parser.parse_args()
    result = materialize(ROOT / 'data/brochures-aj-urbana.json', args.input, args.pdftoppm)
    print(json.dumps(result))


if __name__ == '__main__':
    main()
