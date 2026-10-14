#!/usr/bin/env python3
"""Propose original diagram replacements; never mutate published Sento assets."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/qa/sento-final/plan-crops'
OUT.mkdir(parents=True, exist_ok=True)
capture = json.loads((ROOT / 'docs/qa/sento-final/plan-pdf-sources/capture.json').read_text())
projects = {p['slug']: p for p in capture['projects']}
brochures = {p['slug']: p for p in json.loads((ROOT / 'data/brochures-sento.json').read_text())['projects']}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def rgb_white(im):
    rgba = im.convert('RGBA')
    background = Image.new('RGBA', im.size, 'white')
    background.alpha_composite(rgba)
    return background.convert('RGB')


def asset(path):
    im = Image.open(path)
    return {'localPath': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes()),
            'width': im.width, 'height': im.height, 'bytes': path.stat().st_size}


specs = [('domeyko-2055', 'A5', 5, 2), ('domeyko-2055', 'B5', 5, 1),
         ('san-ignacio', 'A3', 5, 2), ('san-ignacio', 'D1', 5, 1),
         ('plaza-las-condes', 'C4', 8, 3)]
rows = []
for slug, code, page, index in specs:
    brochure = brochures[slug]
    source = ROOT / brochure['document']['localPath'].lstrip('/')
    assert sha(source.read_bytes()) == brochure['document']['sha256']
    image = list(PdfReader(source).pages[page - 1].images)[index]
    # Preserve the entire image object, including all walls, terraces and room fixtures.
    im = rgb_white(image.image)
    stem = f'{slug}-{code}-native-diagram'
    png = OUT / f'{stem}.png'
    webp = OUT / f'{stem}.webp'
    original = OUT / f'{slug}-{code}-original-{image.name}'
    original.write_bytes(image.data)
    im.save(png, format='PNG')
    im.save(webp, format='WEBP', lossless=True, method=6, exact=True)
    assert Image.open(webp).convert('RGB').tobytes() == im.tobytes()
    assert Image.open(png).convert('RGB').tobytes() == im.tobytes()
    rows.append({'id': f'{slug}:{code}', 'slug': slug, 'code': code,
                 'purpose': 'Remove conflicting brochure editorial total by selecting the untouched full original drawing image object; no drawing pixels removed or reconstructed.',
                 'extractionMethod': 'pdf_image_object', 'sourcePage': page,
                 'imageIndex': index, 'imageName': image.name,
                 'sourcePdfLocalPath': brochure['document']['localPath'],
                 'sourceSha256': brochure['document']['sha256'],
                 'originalSha256': sha(image.data), 'original': asset(original),
                 'nativeWidth': im.width, 'nativeHeight': im.height,
                 'crop': [0, 0, 1, 1], 'resized': False, 'upscaled': False,
                 'alphaComposition': 'white background; otherwise unchanged decoded RGB pixels',
                 'decodedRgbSha256': sha(im.tobytes()), 'png': asset(png), 'webp': asset(webp),
                 'losslessDecodedPixelEquality': True,
                 'geometryEdited': False, 'publicationApplied': False,
                 'visuallyVerified': True,
                 'manualVisualReview': '2026-10-14: native originals and six-proposal contact sheet inspected; complete architectural perimeter, rooms and terraces preserved.'})

slug, code = 'mirador-la-florida', 'A4'
card = next(x for x in projects[slug]['planCards'] if x['code'] == code)
source = ROOT / card['image']['localPath']
assert sha(source.read_bytes()) == card['image']['sha256']
im = rgb_white(Image.open(source))
png = OUT / f'{slug}-{code}-official-full.png'
webp = OUT / f'{slug}-{code}-official-full.webp'
im.save(png, format='PNG')
im.save(webp, format='WEBP', lossless=True, method=6, exact=True)
assert Image.open(webp).convert('RGB').tobytes() == im.tobytes()
rows.append({'id': f'{slug}:{code}', 'slug': slug, 'code': code,
             'purpose': 'Offer the exact official A4 drawing without the historical AGOTADO band, retaining the entire native image.',
             'extractionMethod': 'official_native_image', 'sourceUrl': card['imageUrl'],
             'sourceRef': f'official:{slug}:{code}', 'sourcePage': 18,
             'sourceSha256': card['image']['sha256'], 'originalSha256': card['image']['sha256'],
             'original': card['image'], 'nativeWidth': im.width, 'nativeHeight': im.height,
             'crop': [0, 0, 1, 1], 'resized': False, 'upscaled': False,
             'decodedRgbSha256': sha(im.tobytes()), 'png': asset(png), 'webp': asset(webp),
             'losslessDecodedPixelEquality': True, 'geometryEdited': False,
             'publicationApplied': False, 'visuallyVerified': True,
             'matchEvidence': ['Same project and exact A4 code.', 'Same printed brochure total 33.98 m2 and coherent current fields 31.11 + 2.87 = 33.98 m2.',
                               'Visible perimeter, terrace, bath, kitchen, bedroom and living-room arrangement match the supplied drawing outside its band.'],
             'comparisonLimit': 'The historical AGOTADO band obscures central drawing pixels. Identity is supported by exact project/code, matching total and visible layout, not full pixel equality with that covered region.'})

sheet = Image.new('RGB', (1300, 1500), 'white')
draw = ImageDraw.Draw(sheet)
for i, row in enumerate(rows):
    x, y = (i % 2) * 650, (i // 2) * 500
    draw.text((x + 12, y + 12), f"{row['slug']} / {row['code']} / {row['nativeWidth']} x {row['nativeHeight']}", fill='black')
    im = Image.open(ROOT / row['png']['localPath']).convert('RGB')
    im.thumbnail((626, 450), Image.Resampling.LANCZOS)
    sheet.paste(im, (x + (650-im.width)//2, y + 42 + (450-im.height)//2))
sheet.save(OUT / 'proposals-contact-sheet.jpg', quality=94)
manifest = {'schemaVersion': 1, 'verifiedOn': '2026-10-14', 'policy': 'Proposals only. No published assets changed. Full original objects; no AI edits, drawing erasure or upscaling.',
            'planReplacements': rows, 'contactSheet': asset(OUT / 'proposals-contact-sheet.jpg')}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'count': len(rows), 'manifest': str(OUT / 'manifest.json'), 'proposals': [(r['id'], r['nativeWidth'], r['nativeHeight']) for r in rows]}, ensure_ascii=False))
