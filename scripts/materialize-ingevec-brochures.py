#!/usr/bin/env python3
"""Materialize reviewed media without copying original PDFs into the repository.

Only the ten explicitly reviewed existing fichas are eligible. Candidate projects are maintained
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
OLD_SLUGS = {'centenario-1', 'tocornal', 'vivaceta'}
NEW_SLUGS = {'coronel-godoy', 'diagonal-paraguay', 'el-aromo', 'los-lilenes',
             'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589'}
SLUGS = OLD_SLUGS | NEW_SLUGS
SELECTION = {
    'centenario-1': (9, {10, 11, 12, 13, 14}),
    'tocornal': (8, {10, 11, 12, 13, 14}),
    'vivaceta': (5, {9, 10, 11, 12}),
}
# The first page contains vector overlays. Only its separately reviewed bare
# facade image is eligible; pages 2 and 3 must never be extracted or rendered.
CENTENARIO_FACADE = '5af64f402e804a3be87a774e56aa8756cd54575136a8ada3c06422502bb7fe8d'
# Each added source is bound to its reviewed PDF and exact plan pages. A page
# number alone cannot identify a model when two stages use the same numbers.
NEW_DOCUMENTS = {
    'coronel-godoy': {'86e7bcd761a1037a460ae58c23f3c5f19ab047dde162f46c2f61c5ad38ad1085': (21, {15, 16, 17, 18}, None)},
    'diagonal-paraguay': {'4b86d9b13723b7e12edf9b44e7c5616284f2e81b8f7f81d177ca0dfa3bd94f3f': (13, {9, 10, 11}, None)},
    'el-aromo': {'2f5ee0fee2dc93ece339756b705030861a9c7c133b78307327b8d1401baeeefc': (18, {13, 14, 15}, None)},
    'los-lilenes': {'5890a3c98ef2e130f5a91bd30073203314039741cbd68d7a8f10a294c026dda0': (20, {15, 16, 17}, None)},
    'matta-016': {'1718596161846470541f7eb1f103c0dd550b52fc6b8c93507adb2c8b53af07e8': (23, {17, 18, 19, 20}, None)},
    'nueva-esmeralda': {'d5cfa2a624f441173a6ec27c1091c5cff2b7c37e45782d84fbbc866966112e08': (22, {16, 17, 18, 19}, None)},
    'vicuna-mackenna-7589': {
        'ded2b0d73122c2160791e4dc1575e18a73dfc784fb397aad313638cab05c8cdc': (13, {9, 10, 11}, 'Etapa 1'),
        'ea21b26f8fc2df546b06faf9eeb8cdafbce76edbb37b0922e8a4cf13acdcfc94': (13, {9, 10, 11}, 'Etapa 2'),
    },
}
NEW_IMAGE_COUNTS = {'coronel-godoy': 6, 'diagonal-paraguay': 4, 'el-aromo': 4,
                    'los-lilenes': 6, 'matta-016': 11, 'nueva-esmeralda': 7,
                    'vicuna-mackenna-7589': 5}


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


def documents_for(record):
    documents = record.get('documents', [record['document']])
    require(isinstance(documents, list) and documents, f'{record["slug"]}: source documents are missing')
    require(record['document'] in documents, f'{record["slug"]}: primary source is outside the document batch')
    return documents


def validate_manifest(manifest):
    """Return the exact approved output inventory without changing metadata."""
    records = manifest.get('projects', [])
    require(len(records) == len(SLUGS) and {p.get('slug') for p in records} == SLUGS,
            'Only the ten reviewed existing projects are eligible')
    assets = {}
    for record in manifest['projects']:
        slug = record['slug']
        documents = documents_for(record)
        sources = {}
        filenames = set()
        for document in documents:
            filename = document['fileName']
            require(isinstance(filename, str) and Path(filename).name == filename
                    and '/' not in filename and '\\' not in filename
                    and filename.lower().endswith('.pdf'), f'{slug}: invalid source filename')
            require(valid_hash(document['sha256']) and positive_integer(document['pageCount']),
                    f'{slug}: source evidence is missing')
            require(document['sha256'] not in sources and filename not in filenames,
                    f'{slug}: duplicate source document')
            sources[document['sha256']] = document
            filenames.add(filename)
        if slug in OLD_SLUGS:
            image_count, plan_pages = SELECTION[slug]
            require(len(documents) == 1 and len(record['images']) == image_count
                    and len(record['models']) == len(plan_pages), f'{slug}: reviewed media/model count changed')
            plan_selection = {record['document']['sha256']: (record['document']['pageCount'], plan_pages, None)}
        else:
            plan_selection = NEW_DOCUMENTS[slug]
            require(set(sources) == set(plan_selection), f'{slug}: reviewed source document batch changed')
            require(all(sources[key]['pageCount'] == evidence[0] for key, evidence in plan_selection.items()),
                    f'{slug}: reviewed source page count changed')
            require(len(record['models']) == sum(len(evidence[1]) for evidence in plan_selection.values())
                    and len(record['images']) == NEW_IMAGE_COUNTS[slug], f'{slug}: reviewed media/model count changed')
        native_sources = set()

        def approve(asset, filename):
            expected = PREFIX + slug + '/' + filename
            require(asset.get('localPath') == expected, f'{slug}: asset path is outside its approved destination')
            require(expected not in assets, f'{slug}: duplicate asset destination')
            require(valid_hash(asset.get('sha256')) and positive_integer(asset.get('width'))
                    and positive_integer(asset.get('height')), f'{slug}: approved output fingerprint is missing')
            source = sources.get(asset.get('sourceSha256'))
            require(source is not None, f'{slug}: asset source hash mismatch')
            require(positive_integer(asset.get('sourcePage'))
                    and asset['sourcePage'] <= source['pageCount'], f'{slug}: invalid source page')
            assets[expected] = asset

        for image in record['images']:
            require(image.get('visuallyVerified') is True and image.get('privacySafe') is True,
                    f'{slug}: an unreviewed or unsafe image cannot be materialized')
            require(isinstance(image.get('assetName'), str)
                    and re.fullmatch(r'[a-z0-9-]+', image['assetName']), f'{slug}: invalid asset name')
            require(type(image.get('imageIndex')) is int and image['imageIndex'] >= 0
                    and valid_hash(image.get('originalSha256')), f'{slug}: native image evidence is missing')
            approve(image, image['assetName'] + '.webp')
            identity = (image['sourceSha256'], image['sourcePage'], image['imageIndex'])
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
        model_ids = set()
        for model in record['models']:
            page = model['pagina_brochure']
            source_hash = model.get('sourceSha256', record['document']['sha256'] if slug in OLD_SLUGS else None)
            selection = plan_selection.get(source_hash)
            identity = (source_hash, page)
            require(selection is not None and type(page) is int and page in selection[1] and identity not in pages,
                    f'{slug}: only the exact reviewed plan pages are eligible')
            pages.add(identity)
            require(isinstance(model.get('modelo'), str) and re.fullmatch(r'[a-z0-9-]+', model['modelo']),
                    f'{slug}: invalid model identifier')
            require(model['modelo'] not in model_ids, f'{slug}: repeated model identifier')
            model_ids.add(model['modelo'])
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
            require(plan['sourceSha256'] == source_hash, f'{slug}: plan/model source mismatch')
            require(model.get('etapa') == selection[2] and plan.get('etapa') == selection[2],
                    f'{slug}: source stage is missing or inconsistent')
            if selection[2] is not None:
                prefix = 'e1-' if selection[2] == 'Etapa 1' else 'e2-'
                require(model['modelo'].startswith(prefix), f'{slug}: model identifier does not match its source stage')
        require(pages == {(source_hash, page) for source_hash, selection in plan_selection.items()
                          for page in selection[1]}, f'{slug}: reviewed plan selection is incomplete')
    require(sum(len(record['models']) for record in records) == 41,
            'The exact reviewed inventory must contain 41 plans')
    require(len(assets) == 106, 'The exact reviewed Ingevec inventory must contain 106 assets')
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
            readers = {}
            source_files = {}
            for document in documents_for(record):
                original = input_directory / document['fileName']
                require(original.is_file() and not original.is_symlink()
                        and original.resolve() == original, f'{slug}: source must be a regular PDF')
                source_bytes = original.read_bytes()
                require(digest(source_bytes) == document['sha256'], f'{slug}: source PDF changed')
                reader = PdfReader(BytesIO(source_bytes))
                require(len(reader.pages) == document['pageCount'], f'{slug}: source page count changed')
                # Verified source snapshots stay private and eliminate a race
                # with the original PDF while Poppler renders the exact page.
                source = staging / (slug + '-' + document['sha256'] + '.pdf')
                source.write_bytes(source_bytes)
                readers[document['sha256']] = reader
                source_files[document['sha256']] = source
            for image in record['images']:
                reader = readers[image['sourceSha256']]
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
                jobs.append((source_files[model['plan']['sourceSha256']], model))

        def render(job):
            source, model = job
            page = model['pagina_brochure']
            plan = model['plan']
            destination = staging / plan['localPath'].lstrip('/')
            destination.parent.mkdir(parents=True, exist_ok=True)
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
