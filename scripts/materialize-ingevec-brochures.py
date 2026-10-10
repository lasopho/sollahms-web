#!/usr/bin/env python3
"""Materialize reviewed media without copying original PDFs into the repository.

Only the three existing fichas are eligible. Candidate projects are maintained
in private storage outside this repository and outside the deploy allowlist.
Requires pypdf, Pillow and Poppler. Full pages 1-3 of Centenario are forbidden.
The reviewed manifest is immutable input: a renderer/encoder change must fail,
not silently approve a new asset hash. All media is verified before installation.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
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
PREFIX = '/assets/propiedades/ingevec-preview/'
SLUGS = {'centenario-1', 'tocornal', 'vivaceta'}
SELECTION = {
    'centenario-1': (9, {10, 11, 12, 13, 14}),
    'tocornal': (8, {10, 11, 12, 13, 14}),
    'vivaceta': (5, {9, 10, 11, 12}),
}
# The first page contains vector overlays. Only its separately reviewed bare
# facade image is eligible; pages 2 and 3 must never be extracted or rendered.
CENTENARIO_FACADE = '5af64f402e804a3be87a774e56aa8756cd54575136a8ada3c06422502bb7fe8d'


class MaterializationError(ValueError):
    pass


def digest(data):
    return sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise MaterializationError(message)


def positive_integer(value):
    return type(value) is int and value > 0


def valid_hash(value):
    return isinstance(value, str) and re.fullmatch(r'[a-f0-9]{64}', value)


def validate_manifest(manifest):
    """Return the exact approved output inventory without changing metadata."""
    records = manifest.get('projects', [])
    require(len(records) == len(SLUGS) and {p.get('slug') for p in records} == SLUGS,
            'Only the three reviewed existing projects are eligible')
    assets = {}
    for record in manifest['projects']:
        slug = record['slug']
        document = record['document']
        filename = document['fileName']
        require(isinstance(filename, str) and Path(filename).name == filename
                and '/' not in filename and '\\' not in filename
                and filename.lower().endswith('.pdf'), f'{slug}: invalid source filename')
        require(valid_hash(document['sha256']) and positive_integer(document['pageCount']),
                f'{slug}: source evidence is missing')
        image_count, plan_pages = SELECTION[slug]
        require(len(record['images']) == image_count and len(record['models']) == len(plan_pages),
                f'{slug}: reviewed media/model count changed')
        native_sources = set()

        def approve(asset, filename):
            expected = PREFIX + slug + '/' + filename
            require(asset.get('localPath') == expected, f'{slug}: asset path is outside its approved destination')
            require(expected not in assets, f'{slug}: duplicate asset destination')
            require(valid_hash(asset.get('sha256')) and positive_integer(asset.get('width'))
                    and positive_integer(asset.get('height')), f'{slug}: approved output fingerprint is missing')
            require(asset.get('sourceSha256') == document['sha256'], f'{slug}: asset source hash mismatch')
            require(positive_integer(asset.get('sourcePage'))
                    and asset['sourcePage'] <= document['pageCount'], f'{slug}: invalid source page')
            assets[expected] = asset

        for image in record['images']:
            require(image.get('visuallyVerified') is True and image.get('privacySafe') is True,
                    f'{slug}: an unreviewed or unsafe image cannot be materialized')
            require(isinstance(image.get('assetName'), str)
                    and re.fullmatch(r'[a-z0-9-]+', image['assetName']), f'{slug}: invalid asset name')
            require(type(image.get('imageIndex')) is int and image['imageIndex'] >= 0
                    and valid_hash(image.get('originalSha256')), f'{slug}: native image evidence is missing')
            approve(image, image['assetName'] + '.webp')
            identity = (image['sourcePage'], image['imageIndex'])
            require(identity not in native_sources, f'{slug}: repeated native image')
            native_sources.add(identity)
            if slug == 'centenario-1':
                require(image['sourcePage'] not in {2, 3}, 'Centenario: excluded private page')
                if image['sourcePage'] == 1:
                    require(image['imageIndex'] == 0 and image['originalSha256'] == CENTENARIO_FACADE,
                            'Centenario: only the reviewed bare facade is eligible on page 1')
        gallery_paths = {image['localPath'] for image in record['images']}
        require(record.get('hero') in gallery_paths
                and record.get('catalogueCover', {}).get('localPath') in gallery_paths,
                f'{slug}: cover must reference a reviewed project image')
        pages = set()
        for model in record['models']:
            page = model['pagina_brochure']
            require(type(page) is int and page in plan_pages and page not in pages,
                    f'{slug}: only the exact reviewed plan pages are eligible')
            pages.add(page)
            require(isinstance(model.get('modelo'), str) and re.fullmatch(r'[a-z0-9-]+', model['modelo']),
                    f'{slug}: invalid model identifier')
            require(model.get('visuallyVerified') is True and model.get('approximate') is True,
                    f'{slug}: model visual review is missing')
            require(model.get('sourcePages') == [page], f'{slug}: model source pages changed')
            require(model.get('orientacion') is None and model.get('pisos') is None,
                    f'{slug}: undocumented orientation/floor must remain unknown')
            if slug == 'tocornal' and page == 12:
                require(model.get('banos') is None, 'Tocornal: disputed bathroom count must remain unknown')
            plan = model['plan']
            approve(plan, f'plano-{model["modelo"]}.webp')
            require(plan['sourcePage'] == page, f'{slug}: plan/model page mismatch')
    require(len(assets) == 36, 'The exact reviewed inventory must contain 36 assets')
    return assets


def output_inventory(approved):
    """Missing approved outputs may be regenerated; extras/symlinks are errors."""
    folder = ROOT / PREFIX.lstrip('/')
    for path in [folder, *folder.parents]:
        if path == ROOT.parent:
            break
        require(not path.is_symlink(), 'Output destination must not contain symbolic links')
    actual = set()
    if folder.exists():
        require(folder.is_dir(), 'Output destination must be a directory')
        for path in folder.rglob('*'):
            require(not path.is_symlink(), 'Output inventory contains a symbolic link')
            relative = '/' + path.relative_to(ROOT).as_posix()
            if path.is_dir():
                require(path.parent == folder and path.name in SLUGS,
                        'Output inventory contains an unapproved directory')
            else:
                require(path.is_file() and relative in approved,
                        'Output inventory contains an unapproved file')
                actual.add(relative)
    return actual


def verify_generated(path, asset):
    require(digest(path.read_bytes()) == asset['sha256'],
            'Generated media differs from the approved hash; manifest was not modified')
    with Image.open(path) as picture:
        require(picture.format == 'WEBP' and picture.size == (asset['width'], asset['height']),
                'Generated media differs from the approved format/dimensions')
        require(not any(key in picture.info for key in ('exif', 'xmp', 'icc_profile')),
                'Generated media contains unapproved embedded metadata')


def materialize(input_directory, pdftoppm):
    require(pdftoppm, 'Poppler pdftoppm is required')
    manifest_path = ROOT / 'data/brochures-ingevec.json'
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    approved = validate_manifest(manifest)
    output_inventory(approved)
    with tempfile.TemporaryDirectory(prefix='sollahms-ingevec-reviewed-') as temporary:
        staging = Path(temporary)
        jobs = []
        for record in manifest['projects']:
            slug = record['slug']
            original = input_directory / record['document']['fileName']
            require(original.is_file() and not original.is_symlink(), f'{slug}: source must be a regular PDF')
            source_bytes = original.read_bytes()
            require(digest(source_bytes) == record['document']['sha256'], f'{slug}: source PDF changed')
            reader = PdfReader(BytesIO(source_bytes))
            require(len(reader.pages) == record['document']['pageCount'], f'{slug}: source page count changed')
            # Snapshot the verified bytes only in private temporary storage so a
            # changed original cannot race the subsequent Poppler rendering.
            source = staging / (slug + '.pdf')
            source.write_bytes(source_bytes)
            for image in record['images']:
                native_images = list(reader.pages[image['sourcePage'] - 1].images)
                require(image['imageIndex'] < len(native_images), f'{slug}: native image index is absent')
                native = native_images[image['imageIndex']]
                require(digest(native.data) == image['originalSha256'], f'{slug}: native image changed')
                destination = staging / image['localPath'].lstrip('/')
                destination.parent.mkdir(parents=True, exist_ok=True)
                picture = native.image.convert('RGB')
                picture.thumbnail((2200, 2200), Image.Resampling.LANCZOS)
                # A fresh raster strips source EXIF/text metadata.
                picture.save(destination, 'WEBP', quality=94, method=6)
                verify_generated(destination, image)
            for model in record['models']:
                jobs.append((source, model))

        def render(job):
            source, model = job
            page = model['pagina_brochure']
            plan = model['plan']
            destination = staging / plan['localPath'].lstrip('/')
            with tempfile.TemporaryDirectory(prefix='plan-', dir=staging) as render_directory:
                output = Path(render_directory) / 'page'
                subprocess.run([str(pdftoppm), '-f', str(page), '-l', str(page), '-singlefile',
                    '-scale-to', '3000', '-png', str(source), str(output)],
                    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                with Image.open(output.with_suffix('.png')) as picture:
                    picture.convert('RGB').save(destination, 'WEBP', quality=96, method=6)
            verify_generated(destination, plan)

        with ThreadPoolExecutor(max_workers=3) as executor:
            list(executor.map(render, jobs))
        staged = {('/' + path.relative_to(staging).as_posix()) for path in
                  (staging / PREFIX.lstrip('/')).rglob('*') if path.is_file()}
        require(staged == set(approved), 'Generated inventory differs from the exact approved selection')
        require(manifest_path.read_bytes() == manifest_bytes,
                'Reviewed manifest changed during generation; no outputs were installed')
        output_inventory(approved)
        # Replacements happen only after every output has passed its approved
        # fingerprint. A failed renderer never changes the existing assets.
        for local_path in sorted(approved):
            destination = ROOT / local_path.lstrip('/')
            destination.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(prefix='.reviewed-', dir=destination.parent, delete=False) as install:
                pending = Path(install.name)
                try:
                    install.write((staging / local_path.lstrip('/')).read_bytes())
                    install.flush()
                    os.fsync(install.fileno())
                    os.replace(pending, destination)
                finally:
                    pending.unlink(missing_ok=True)
        require(output_inventory(approved) == set(approved), 'Installed inventory must contain exactly the reviewed media')
        for local_path, asset in approved.items():
            verify_generated(ROOT / local_path.lstrip('/'), asset)
    return {'projects': len(SLUGS), 'plans': len(jobs),
        'imageAssets': sum(len(p['images']) for p in manifest['projects']), 'previewOnly': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-directory', required=True, type=Path)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    args = parser.parse_args()
    try:
        result = materialize(args.input_directory, args.pdftoppm)
    except MaterializationError as error:
        parser.exit(1, f'Materialization rejected: {error}\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
