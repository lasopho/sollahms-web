#!/usr/bin/env python3
"""Materialize reviewed media from local originals, without copying any PDF.

Only the three existing fichas are eligible. Candidate projects are maintained
in private storage outside this repository and outside the deploy allowlist.
Requires pypdf, Pillow and Poppler. Full pages 1-3 of Centenario are forbidden.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
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
PREFIX = '/assets/propiedades/ingevec-preview/'
SLUGS = {'centenario-1', 'tocornal', 'vivaceta'}


def digest(data):
    return sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-directory', required=True, type=Path)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    args = parser.parse_args()
    assert args.pdftoppm, 'Poppler pdftoppm is required'
    manifest_path = ROOT / 'data/brochures-ingevec.json'
    manifest = json.loads(manifest_path.read_text())
    assert {p['slug'] for p in manifest['projects']} == SLUGS
    jobs = []
    for record in manifest['projects']:
        source = args.input_directory / record['document']['fileName']
        assert digest(source.read_bytes()) == record['document']['sha256'], 'Source PDF changed'
        reader = PdfReader(source)
        assert len(reader.pages) == record['document']['pageCount']
        folder = ROOT / PREFIX.lstrip('/') / record['slug']
        folder.mkdir(parents=True, exist_ok=True)
        for image in record['images']:
            assert image['visuallyVerified'] and image['privacySafe']
            assert re.fullmatch(r'[a-z0-9-]+', image['assetName'])
            native = list(reader.pages[image['sourcePage'] - 1].images)[image['imageIndex']]
            assert digest(native.data) == image['originalSha256'], 'Native image changed'
            destination = folder / (image['assetName'] + '.webp')
            picture = native.image.convert('RGB')
            picture.thumbnail((2200, 2200), Image.Resampling.LANCZOS)
            # Encoding a fresh raster also strips original EXIF/text metadata.
            picture.save(destination, 'WEBP', quality=94, method=6)
            image.update(localPath='/' + str(destination.relative_to(ROOT)),
                sha256=digest(destination.read_bytes()), width=picture.width, height=picture.height)
        record['hero'] = record['images'][0]['localPath']
        record['catalogueCover'] = {'localPath': record['hero'],
            'alt': record['images'][0]['caption'],
            'selectionReason': 'Fachada nativa correspondiente al proyecto, revisada sin superposiciones de texto; formato adecuado para tarjeta.'}
        for model in record['models']:
            page = model['pagina_brochure']
            assert re.fullmatch(r'[a-z0-9-]+', model['modelo'])
            assert record['slug'] != 'centenario-1' or page in [10, 11, 12, 13, 14]
            jobs.append((source, record, model))

    def render(job):
        source, record, model = job
        page = model['pagina_brochure']
        destination = ROOT / PREFIX.lstrip('/') / record['slug'] / f'plano-{model["modelo"]}.webp'
        with tempfile.TemporaryDirectory(prefix='sollahms-ingevec-plan-') as temporary:
            output = Path(temporary) / 'page'
            subprocess.run([args.pdftoppm, '-f', str(page), '-l', str(page), '-singlefile',
                '-scale-to', '3000', '-png', str(source), str(output)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            with Image.open(output.with_suffix('.png')) as picture:
                picture.convert('RGB').save(destination, 'WEBP', quality=96, method=6)
                width, height = picture.size
        model['plan'] = {'localPath': '/' + str(destination.relative_to(ROOT)),
            'sha256': digest(destination.read_bytes()), 'width': width, 'height': height,
            'sourcePage': page, 'sourceSha256': record['document']['sha256']}

    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(render, jobs))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'projects': len(SLUGS), 'plans': len(jobs),
        'imageAssets': sum(len(p['images']) for p in manifest['projects']), 'previewOnly': True}))


if __name__ == '__main__':
    main()
