#!/usr/bin/env python3
"""Recreate private Leben review assets from SHA-256 verified local brochures.

Native image objects retain their real pixel dimensions; page crops also carry
native source dimensions and never enlarge raster content. The manifest is read
only and assets are staged and hash-checked before any destination is written.
"""
import argparse
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/assets/propiedades/leben-preview/'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def valid_crop(crop):
    return isinstance(crop, list) and len(crop) == 4 and all(type(n) in (int, float) for n in crop) and 0 <= crop[0] < crop[2] <= 1 and 0 <= crop[1] < crop[3] <= 1


def render_asset(source, reader, asset, destination, temporary, pdftoppm, pdfimages):
    crop = asset.get('crop', [0, 0, 1, 1])
    require(valid_crop(crop), 'Invalid normalized crop')
    method = asset.get('extractionMethod', 'pdf_page_crop')
    if method == 'pdf_image_object':
        native = reader.pages[asset['sourcePage'] - 1].images[asset['sourceImageIndex']]
        require(native.name == asset['sourceImageName'] and sha256(native.data).hexdigest() == asset['sourceImageSha256'], 'Native image object differs from review')
        if native.name.lower().endswith('.jp2'):
            # Poppler decodes JPEG2000 efficiently and consistently with the PDF.
            require(pdfimages, 'Poppler pdfimages is required for selected JPEG2000 resources')
            prefix = temporary / 'native'
            subprocess.run([pdfimages, '-f', str(asset['sourcePage']), '-l', str(asset['sourcePage']), '-png', str(source), str(prefix)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            image = Image.open(temporary / f'native-{asset["popplerImageIndex"]:03d}.png').convert('RGB')
        else:
            image = Image.open(io.BytesIO(native.data)).convert('RGB')
        require(image.size == (asset['nativeWidth'], asset['nativeHeight']), 'Native image dimensions changed')
    elif method == 'pdf_page_crop':
        page = temporary / 'page.png'
        subprocess.run([pdftoppm, '-f', str(asset['sourcePage']), '-l', str(asset['sourcePage']), '-singlefile', '-scale-to-x', str(asset.get('renderWidth', 3400)), '-scale-to-y', '-1', '-png', str(source), str(page.with_suffix(''))], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        image = Image.open(page).convert('RGB')
    else:
        raise ValueError('Unsupported reviewed extraction method')
    box = tuple(round(v * (image.width if i % 2 == 0 else image.height)) for i, v in enumerate(crop))
    image = image.crop(box)
    # Reviewed output size is an explicit upper bound, never a resize upwards.
    require(image.width >= asset['width'] and image.height >= asset['height'], 'Reviewed dimensions would enlarge crop')
    require(asset['nativeWidth'] >= asset['width'] and asset['nativeHeight'] >= asset['height'], 'Raster upscaling is forbidden')
    image.thumbnail(tuple(asset.get('thumbnailMaxSize', [1800, 1800])), Image.Resampling.LANCZOS)
    require(image.size == (asset['width'], asset['height']), 'Reviewed output aspect ratio changed')
    image.save(destination, 'WEBP', quality=asset.get('encoderQuality', 93), method=6)


def verify_asset(path, asset):
    require(digest(path) == asset['sha256'], 'Derivative differs from reviewed SHA-256')
    with Image.open(path) as image:
        require(image.size == (asset['width'], asset['height']), 'Derivative dimensions differ from review')
        image.verify()


def materialize(manifest_path, input_directory, root=ROOT, pdftoppm='pdftoppm', pdfimages='pdfimages'):
    manifest_path, input_directory, root = map(Path, (manifest_path, input_directory, root))
    frozen = manifest_path.read_bytes()
    manifest = json.loads(frozen)
    require(manifest.get('schemaVersion') == 1 and len(manifest['sourceDocuments']) == 12 and len(manifest['projects']) == 12, 'Expected twelve original brochures and twelve existing project records')
    require(len({p['slug'] for p in manifest['projects']}) == 12, 'Duplicate project record')
    sources = {}
    for doc in manifest['sourceDocuments']:
        name = doc['fileName']
        require(Path(name).name == name and '\\' not in name and name.lower().endswith('.pdf'), 'Unsafe source filename')
        path = input_directory / name
        require(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(input_directory.resolve()), 'Private source missing or escapes input directory')
        require(re.fullmatch(r'[a-f0-9]{64}', doc['sha256']) and digest(path) == doc['sha256'], 'Original SHA-256 differs from review')
        reader = PdfReader(path)
        require(len(reader.pages) == doc['pageCount'], 'Source page count differs from review')
        sources[doc['sha256']] = (path, reader)
    jobs, paths = [], set()
    for record in manifest['projects']:
        for asset in record.get('images', []) + [m['plan'] for m in record.get('models', [])]:
            path = asset['localPath']
            prefix = PREFIX + record['slug'] + '/'
            require(path.startswith(prefix) and re.fullmatch(r'[a-z0-9_.-]+\.webp', path[len(prefix):]), 'Unsafe derivative path or wrong project scope')
            require(path not in paths, 'Duplicate derivative path')
            paths.add(path)
            require(asset.get('privacySafe') is True and asset.get('visuallyVerified') is True and asset.get('qualityDecision') == 'keep', 'Missing visual and quality review')
            require(asset.get('sourceKind') in ('raster', 'vector'), 'Missing source kind')
            require(asset['sourceSha256'] == record['document']['sha256'], 'Asset belongs to another brochure')
            source, reader = sources[asset['sourceSha256']]
            require(type(asset['sourcePage']) is int and 1 <= asset['sourcePage'] <= len(reader.pages), 'Invalid source page')
            destination = root / path.lstrip('/')
            require(destination.resolve() == root.resolve() / path.lstrip('/') and not destination.is_symlink(), 'Derivative destination contains symlink')
            jobs.append((source, reader, asset, destination))
    staged = []
    with tempfile.TemporaryDirectory(prefix='sollahms-leben-materialize-') as folder:
        temporary = Path(folder)
        for index, (source, reader, asset, destination) in enumerate(jobs):
            work = temporary / str(index); work.mkdir()
            candidate = work / 'asset.webp'
            render_asset(source, reader, asset, candidate, work, pdftoppm, pdfimages)
            verify_asset(candidate, asset)
            staged.append((candidate, destination, asset))
        require(manifest_path.read_bytes() == frozen, 'Manifest changed during materialization')
        for candidate, destination, asset in staged:
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists() or digest(destination) != asset['sha256']:
                shutil.copyfile(candidate, destination)
            verify_asset(destination, asset)
    return {'documents': 12, 'projects': 12, 'images': sum(len(p['images']) for p in manifest['projects']), 'plans': sum(len(p['models']) for p in manifest['projects']), 'assets': len(jobs), 'manifestUnchanged': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'data/brochures-leben.json')
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    parser.add_argument('--pdfimages', default=shutil.which('pdfimages'))
    args = parser.parse_args()
    require(args.pdftoppm, 'Poppler pdftoppm is required for page-crop resources')
    print(json.dumps(materialize(args.manifest, args.input, args.root, args.pdftoppm, args.pdfimages)))


if __name__ == '__main__':
    main()
