#!/usr/bin/env python3
"""Rebuild review assets from the supplied originals, never from remote stock.

Requires Pillow and Poppler's pdftoppm. No original PDF, ZIP or source inventory
is copied to the public output. The approved review manifest is private data.
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

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/assets/propiedades/aj-urbana-preview/'


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
    args = parser.parse_args()
    assert args.pdftoppm, 'Poppler pdftoppm is required'
    manifest_path = ROOT / 'data/brochures-aj-urbana.json'
    manifest = json.loads(manifest_path.read_text())
    jobs = []
    for project in manifest['projects']:
        source = args.input / 'brochures' / project['document']['fileName']
        assert digest(source) == project['document']['sha256'], 'The original document has changed'
        folder = ROOT / PREFIX.lstrip('/') / project['slug']
        folder.mkdir(parents=True, exist_ok=True)
        for image in project['images']:
            candidate = args.input / image['originalFile']
            assert digest(candidate) == image['originalSha256'], 'The candidate has changed'
            destination = ROOT / image['localPath'].lstrip('/')
            assert image['localPath'].startswith(PREFIX) and destination.parent == folder
            shutil.copyfile(candidate, destination)
            image['sha256'] = digest(destination)
        for model in project['models']:
            assert re.fullmatch(r'[0-9]+[A-C]?', model['modelo'])
            jobs.append((source, project, model))

    def render(job):
        source, project, model = job
        page = model['pagina_brochure']
        destination = ROOT / PREFIX.lstrip('/') / project['slug'] / f'plano-{model["modelo"].lower()}-p{page:02d}.webp'
        with tempfile.TemporaryDirectory(prefix='sollahms-aj-plan-') as temporary:
            output = Path(temporary) / 'page'
            subprocess.run([args.pdftoppm, '-f', str(page), '-l', str(page), '-singlefile', '-scale-to', '3000', '-png', str(source), str(output)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            with Image.open(output.with_suffix('.png')) as image:
                image.convert('RGB').save(destination, 'WEBP', quality=96, method=6)
                width, height = image.size
        model['plan'] = {'localPath': '/' + str(destination.relative_to(ROOT)), 'sha256': digest(destination), 'width': width, 'height': height, 'sourcePage': page, 'sourceSha256': project['document']['sha256']}

    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(render, jobs))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'projects': len(manifest['projects']), 'uniquePlans': len(jobs), 'addedImages': sum(len(p['images']) for p in manifest['projects']), 'reviewOnly': True}))


if __name__ == '__main__':
    main()
