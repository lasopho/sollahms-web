"""One protected-review header component for the complete Leben catalogue.

The commercial header contents are copied from each original fiche. Only its
presentation and the reviewed image configuration change; public fragments are
retained byte for byte by the existing Leben publication markers.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'data/leben-headers.json'
HEADER_CSS = '/assets/css/leben-project-hero.css?v=20261014'
HERO = re.compile(r'<section\b[^>]*class=["\'][^"\']*(?:\bproject-hero\b|\brelative h-\[620px\])[^"\']*["\'][^>]*>.*?</section>', re.S)


def configuration():
    if not CONFIG.is_file():
        return {}
    config = json.loads(CONFIG.read_text())
    catalogue = json.loads((ROOT / 'data/proyectos.json').read_text())
    expected = {project['slug'] for project in catalogue if project['inmobiliaria'] == 'Leben'}
    rows = config['projects']
    if config.get('schemaVersion') != 1 or config.get('protectedPreviewOnly') is not True or len(rows) != len(expected) or {row['slug'] for row in rows} != expected:
        raise ValueError('Header configuration must bind exactly the current Leben catalogue')
    for row in rows:
        image = row['image']
        if not re.fullmatch(r'/assets/propiedades/[a-z0-9_./-]+\.(?:webp|jpg|jpeg|png)', image['localPath']) or '..' in image['localPath'] or not re.fullmatch(r'[a-f0-9]{64}', image['sha256']) or not image['alt'].strip() or any(type(image[key]) is not int or image[key] <= 0 for key in ['width', 'height']):
            raise ValueError('Invalid reviewed header image: ' + row['slug'])
        for device in ['desktop', 'tablet', 'mobile']:
            if len(row['focal'][device]) != 2 or any(type(value) not in [int, float] or not 0 <= value <= 100 for value in row['focal'][device]):
                raise ValueError('Invalid source-specific focal point')
        if not 55 <= row['photoWidthPercent'] <= 85 or not 30 <= row['solidUntilPercent'] <= 48 or not row['solidUntilPercent'] + 20 <= row['fadeUntilPercent'] <= 95:
            raise ValueError('Invalid continuous gradient configuration')
    return {row['slug']: row for row in rows}


def header_contents(original):
    generic = re.search(r'<div class="hero-content(?: container)?">(.*?)</div>\s*</section>$', original, re.S)
    featured = re.search(r'<div class="absolute bottom-12 left-6 md:left-12 max-w-4xl">(.*?)</div>\s*</section>$', original, re.S)
    match = generic or featured
    if not match or len(re.findall(r'<h1\b', match[1])) != 1:
        raise ValueError('Unsupported or nonunique original Leben header content')
    content = match[1]
    content = content.replace('class="breadcrumb"', 'class="leben-hero-breadcrumb"')
    content = content.replace('class="eyebrow"', 'class="leben-hero-label"')
    content = content.replace('class="hero-location"', 'class="leben-hero-location"')
    content = content.replace('class="hero-badges"', 'class="leben-hero-badges"')
    if featured:
        content = content.replace('class="label-blue-print text-tertiary-fixed mb-4"', 'class="leben-hero-label"')
        content = content.replace('class="flex items-center text-white/90"', 'class="leben-hero-location"')
    return content


def apply_leben_header(page, slug):
    row = configuration().get(slug)
    if row is None:
        return page
    heroes = list(HERO.finditer(page))
    if len(heroes) != 1:
        raise ValueError('Leben requires exactly one unwrapped original header: ' + slug)
    original = heroes[0][0]
    image = row['image']
    esc = lambda value: html.escape(str(value), quote=True)
    properties = ['--leben-photo-width:' + str(row['photoWidthPercent']) + '%', '--leben-solid:' + str(row['solidUntilPercent']) + '%', '--leben-fade:' + str(row['fadeUntilPercent']) + '%', '--leben-image-ratio:' + str(round(image['width'] / image['height'], 8))]
    for device, position in row['focal'].items():
        properties += ['--leben-focus-' + device + ':' + ' '.join(str(value) + '%' for value in position)]
    preview = '<section class="project-hero leben-project-hero" data-leben-header="' + esc(slug) + '" style="' + ';'.join(properties) + '">'
    preview += '<img class="hero-image leben-hero-image" src="' + esc(image['localPath']) + '" alt="' + esc(image['alt']) + '" width="' + str(image['width']) + '" height="' + str(image['height']) + '" fetchpriority="high" decoding="async">'
    preview += '<div class="leben-hero-shade" aria-hidden="true"></div><div class="leben-hero-content">' + header_contents(original) + '</div></section>'
    replacement = '<!--LEBEN_PREVIEW_START-->' + preview + '<!--LEBEN_PREVIEW_END--><!--LEBEN_PUBLIC_START-->' + original + '<!--LEBEN_PUBLIC_END-->'
    page = page[:heroes[0].start()] + replacement + page[heroes[0].end():]
    return page.replace('</head>', '<!--LEBEN_PREVIEW_START--><link rel="stylesheet" href="' + HEADER_CSS + '"><!--LEBEN_PREVIEW_END--></head>', 1)
