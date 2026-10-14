#!/usr/bin/env python3
"""Independently re-extract original image objects and reproduce every plan crop."""
import hashlib
import json
import re
import subprocess
import tempfile
import argparse
from pathlib import Path
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
POPPLER = '/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm'
def digest(data): return hashlib.sha256(data).hexdigest()
def crop(image, box): return image.crop(tuple(round(value * (image.width if i % 2 == 0 else image.height)) for i, value in enumerate(box)))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT/'data/brochures-leon.json')
    manifest = json.loads(parser.parse_args().manifest.read_text())
    photos = plans = surface_values = 0
    with tempfile.TemporaryDirectory(prefix='leon-source-proof-') as temporary:
        for record in manifest['projects']:
            source = ROOT/record['document']['localPath'].lstrip('/')
            assert digest(source.read_bytes()) == record['document']['sha256']
            reader = PdfReader(source)
            assert len(reader.pages) == record['document']['pageCount']
            for photo in record['images']:
                original = ROOT/photo['original']['localPath'].lstrip('/')
                assert digest(original.read_bytes()) == photo['original']['sha256']
                if photo['sourceSha256'] is not None:
                    objects = reader.pages[photo['sourcePage'] - 1].images
                    native = next(image for image in objects if image.name == photo['imageName'])
                    native_hash = digest(native.data)
                    raw = reader.pages[photo['sourcePage'] - 1]['/Resources']['/XObject']['/' + photo['imageName'].split('.')[0]].get_object().get_data()
                    assert photo['original']['sha256'] in [native_hash, digest(raw)], record['slug'] + ' original image stream'
                with Image.open(original) as native, Image.open(ROOT/photo['localPath'].lstrip('/')) as displayed:
                    assert displayed.width <= native.width and displayed.height <= native.height
                    assert abs(displayed.width / displayed.height - native.width / native.height) < .01
                photos += 1
            cache = {}
            for model in record['models']:
                plan = model['plan']; page = plan['sourcePage']
                if page not in cache:
                    prefix = Path(temporary)/(record['slug'] + '-' + str(page))
                    subprocess.run([POPPLER, '-f', str(page), '-l', str(page), '-singlefile', '-r', str(plan.get('renderDpi', 200)), '-png', str(source), str(prefix)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                    cache[page] = prefix.with_suffix('.png')
                with Image.open(cache[page]) as rendered:
                    rendered = rendered.convert('RGB')
                    expected = crop(rendered, plan['crop'])
                    if plan.get('labelCrops'):
                        labels = [crop(rendered, box) for box in plan['labelCrops']]
                        width = max(label.width for label in labels)
                        height = sum(label.height for label in labels) + 30 * (len(labels) - 1)
                        composed = Image.new('RGB', (width + expected.width + 90, max(height, expected.height) + 60), 'white')
                        top = 30
                        for label in labels:
                            composed.paste(label, (30, top)); top += label.height + 30
                        composed.paste(expected, (width + 60, 30)); expected = composed
                    with Image.open(ROOT/plan['localPath'].lstrip('/')) as actual:
                        assert actual.size == expected.size, record['slug'] + ' ' + model['label'] + ' plan dimensions'
                        assert actual.convert('RGB').tobytes() == expected.tobytes(), record['slug'] + ' ' + model['label'] + ' authentic crop pixels'
                    for variant in plan.get('variants', []):
                        resized = expected.resize((variant['width'], round(variant['width'] * expected.height / expected.width)), Image.Resampling.LANCZOS)
                        with Image.open(ROOT/variant['localPath'].lstrip('/')) as actual:
                            assert actual.convert('RGB').tobytes() == resized.tobytes(), record['slug'] + ' responsive plan pixels'
                page_text = re.sub(r'\s+', '', reader.pages[page - 1].extract_text()).replace(',', '.')
                for area in model.get('areas') or []:
                    if area['valueM2'] is not None:
                        assert format(area['valueM2'], 'g') in page_text, record['slug'] + ' surface absent from original page'
                        surface_values += 1
                plans += 1
            for table in record.get('unassignedAreas', []):
                page_text = re.sub(r'\s+', '', reader.pages[table['sourcePage'] - 1].extract_text()).replace(',', '.')
                for row in table['rows']:
                    for area in row['areas']:
                        if area['valueM2'] is not None:
                            assert format(area['valueM2'], 'g') in page_text, record['slug'] + ' unassigned surface absent from original page'
                            surface_values += 1
    print(json.dumps({'sourcePhotos': photos, 'faithfulLosslessPlans': plans, 'documentedSurfaceValues': surface_values, 'originalPdfs': len(manifest['projects'])}))

if __name__ == '__main__': main()
