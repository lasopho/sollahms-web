#!/usr/bin/env python3
"""Rebuild Angamos media from hash-verified official originals.

No network access, image synthesis, cropping or upscaling is performed. Photos
receive responsive WebP derivatives. Plans retain every source pixel, including
the source's RESERVADO annotations, through lossless WebP encoding.
"""
import argparse
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import shutil
import tempfile

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/assets/propiedades/sento/angamos/'


def digest(data):
    return sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def destination(root, value):
    require(isinstance(value, str) and value.startswith(PREFIX), 'Unexpected output directory')
    name = value[len(PREFIX):]
    require(bool(re.fullmatch(r'[a-z0-9-]+\.(webp|png)', name)), 'Unsafe output filename')
    path = root / value.lstrip('/')
    require(not path.is_symlink() and path.resolve().is_relative_to(root.resolve()),
            'Output path escapes repository')
    return path


def output_metadata(path, image):
    data = path.read_bytes()
    return {'sha256': digest(data), 'bytes': len(data),
            'width': image.width, 'height': image.height}


def materialize(manifest_path, input_directory, root=ROOT, initialize=False):
    manifest_path, input_directory, root = map(Path, (manifest_path, input_directory, root))
    original_manifest = manifest_path.read_bytes()
    manifest = json.loads(original_manifest)
    record = manifest['project']
    require(record['slug'] == 'angamos-205', 'Unexpected development')
    assets = record['images'] + [model['plan'] for model in record['models']]
    require(len(record['images']) == 17 and len(record['models']) == 6,
            'Angamos requires 17 reviewed images and six faithful plans')
    seen = set()
    staged = []
    with tempfile.TemporaryDirectory(prefix='sento-angamos-materialize-') as temporary:
        temporary = Path(temporary)
        for asset in assets:
            original = asset['original']
            source = input_directory / original['fileName']
            require(Path(original['fileName']).name == original['fileName'] and
                    not source.is_symlink() and source.resolve().is_relative_to(input_directory.resolve()),
                    'Original path escapes input directory')
            data = source.read_bytes()
            require(digest(data) == original['sha256'], 'Official original SHA-256 differs')
            with Image.open(io.BytesIO(data)) as native:
                require(native.size == (original['width'], original['height']),
                        'Official original dimensions differ')
                native.verify()
            require(asset['visuallyVerified'] is True and asset.get('crop') == [0, 0, 1, 1],
                    'Reviewed full-frame media required')
            image = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
            outputs = [asset] + asset.get('variants', [])
            for output in outputs:
                path = destination(root, output['localPath'])
                require(str(path) not in seen, 'Duplicate output')
                seen.add(str(path))
                candidate = temporary / f'asset-{len(staged)}.webp'
                derivative = image.copy()
                target_width = output['targetWidth']
                require(isinstance(target_width, int) and 1 <= target_width <= image.width,
                        'Upscaling is prohibited')
                derivative.thumbnail((target_width, image.height), Image.Resampling.LANCZOS)
                if asset['kind'] == 'plan':
                    derivative.save(candidate, 'WEBP', lossless=True, method=6)
                else:
                    derivative.save(candidate, 'WEBP', quality=92, method=6)
                metadata = output_metadata(candidate, derivative)
                if initialize:
                    output.update(metadata)
                else:
                    require(all(output.get(key) == value for key, value in metadata.items()),
                            'Derivative differs from reviewed image metadata')
                staged.append((candidate, path))
            if asset.get('originalLocalPath'):
                path = destination(root, asset['originalLocalPath'])
                require(str(path) not in seen, 'Duplicate original output')
                seen.add(str(path))
                candidate = temporary / f'asset-{len(staged)}.png'
                candidate.write_bytes(data)
                staged.append((candidate, path))
        require(manifest_path.read_bytes() == original_manifest, 'Review changed during materialization')
        for candidate, path in staged:
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists() or digest(path.read_bytes()) != digest(candidate.read_bytes()):
                shutil.copyfile(candidate, path)
        if initialize:
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    return {'images': 17, 'plans': 6, 'files': len(staged),
            'manifestUnchanged': not initialize,
            'upscaling': False, 'planEncoding': 'lossless WebP'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'data/sento-angamos.json')
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--initialize', action='store_true',
                        help='Record reviewed output hashes during first materialization')
    args = parser.parse_args()
    print(json.dumps(materialize(args.manifest, args.input, args.root, args.initialize)))
