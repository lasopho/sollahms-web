#!/usr/bin/env python3
"""Audit cover provenance and preserve the 148 existing property details.

This is a structural/file integrity check, not a substitute for browser QA.
Baseline 1465b49 is the reviewed catalogue before the requested final adjustments.
"""
import argparse
import hashlib
import json
import re
import subprocess
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}
COVER_FIELDS = {'imagenPrincipal', 'imagenAlt'}
CAPTION = re.compile(r'<figcaption\b[^>]*>.*?</figcaption>', re.S | re.I)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def baseline(path, ref):
    return git('show', f'{ref}:{path}')


def check(condition, message):
    if not condition:
        raise AssertionError(message)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.images, self.links, self.embeds, self.iframes = [], [], [], []
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == 'img':
            self.images.append(attrs)
        if tag == 'a':
            self.links.append(attrs)
        if attrs.get('data-embed-src'):
            self.embeds.append(attrs)
        if tag == 'iframe':
            self.iframes.append(attrs)


def with_current_navigation(text):
    """Allow only the later approved main-nav relabel/removal in old baselines."""
    def update(match):
        header = re.sub(r'<a\b[^>]*href="(?:/)?#portfolio"[^>]*>Asset Portfolio</a>\n?',
                        '', match[0], flags=re.S)
        return re.sub(r'(<a\b[^>]*href="/proyectos\.html"[^>]*>)Proyectos(</a>)',
                      r'\1Asset Portafolio\2', header)
    return re.sub(r'<header\b[^>]*>.*?</header>', update, text, flags=re.S)


def gallery_without_source_captions(text):
    def remove(match):
        caption = match[0]
        # Only the existing repetitive provenance captions may be removed.
        # A distinct explicit copyright/licence attribution remains protected.
        if 'Fuente oficial' in caption and not re.search(
                r'copyright|licen[sc]|atribuci[óo]n|©|creative commons', caption, re.I):
            return ''
        return caption
    return CAPTION.sub(remove, text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', default='1465b49')
    args = parser.parse_args()
    ref = args.baseline
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    old_projects = json.loads(baseline('data/proyectos.json', ref))
    research_bytes = (ROOT / 'data/fichas-proyectos.json').read_bytes()
    research = json.loads(research_bytes)
    records = {item['slug']: item for item in research}
    old_by_slug = {item['slug']: item for item in old_projects}
    check(len(projects) == len(records) == len(old_projects) == 148, 'Expected all 148 projects')
    check([item['slug'] for item in projects] == [item['slug'] for item in old_projects],
          'Catalogue identity/order changed')
    check(research_bytes == baseline('data/fichas-proyectos.json', ref),
          'Research, provenance, tours, pending data or commercial facts changed')
    protected_files = [
        'data/registro-fichas.json', 'docs/registro-fichas-proyectos.md',
        'docs/verificacion-fichas.md', 'docs/catalogo-22-validacion-2026-10-01.md',
        'agenda-asesoria.html', 'api/booking-create.mjs', 'api/booking-availability.mjs',
        'lib/booking-server.mjs', 'assets/js/project-embeds.js', 'assets/js/project-detail.js',
        'sitemap.xml',
    ]
    for name in protected_files:
        current_bytes = (ROOT / name).read_bytes()
        old_bytes = baseline(name, ref)
        if name == 'agenda-asesoria.html':
            old_bytes = with_current_navigation(old_bytes.decode()).encode()
        check(current_bytes == old_bytes, f'Protected file changed: {name}')

    covers, placeholders, captions_removed, gallery_images = [], [], 0, 0
    maps, tours, attribution_fields = 0, 0, []
    for project in projects:
        slug = project['slug']
        previous = old_by_slug[slug]
        check({k: v for k, v in project.items() if k not in COVER_FIELDS}
              == {k: v for k, v in previous.items() if k not in COVER_FIELDS},
              f'{slug}: fields outside cover metadata changed')
        path = slug + '.html'
        current_text = (ROOT / path).read_text()
        old_text = baseline(path, ref).decode()
        check(current_text == with_current_navigation(gallery_without_source_captions(old_text)),
              f'{slug}: detail changed beyond gallery captions and approved main navigation')
        check(not any('Fuente oficial' in caption for caption in CAPTION.findall(current_text)),
              f'{slug}: repetitive visible gallery source caption remains')
        captions_removed += len(CAPTION.findall(old_text)) - len(CAPTION.findall(current_text))
        current, old = Page(current_text), Page(old_text)
        check(current.images == old.images, f'{slug}: a detail photograph/alt/loading attribute changed')
        check(current.embeds == old.embeds and current.iframes == old.iframes,
              f'{slug}: map or virtual-tour configuration changed')
        check(any(a.get('href') == '/contacto.html?proyecto=' + slug for a in current.links),
              f'{slug}: consultation context missing')
        check(any(a.get('href') == '/agenda-asesoria.html?proyecto=' + slug for a in current.links),
              f'{slug}: booking context missing')
        for image in current.images:
            if image.get('src', '').startswith('/'):
                check((ROOT / image['src'].lstrip('/')).is_file(), f'{slug}: broken local photo')
        official = [image for image in records[slug].get('images', []) if image.get('localPath')]
        gallery_images += len(official)
        for image in official:
            check(image.get('sourceUrl', '').startswith('https://'), f'{slug}: image origin lost')
            for key in image:
                if re.search(r'licen[sc]|attribution|copyright|credit', key, re.I):
                    attribution_fields.append({'slug': slug, 'key': key})
        cover = project.get('imagenPrincipal')
        if official:
            check(isinstance(cover, str) and cover.startswith('/assets/propiedades/'),
                  f'{slug}: no local official catalogue cover')
            check(project.get('imagenAlt'), f'{slug}: cover has no accessible alternative')
            if slug in FEATURED:
                check(cover == previous.get('imagenPrincipal'), f'{slug}: featured hero was replaced')
                check(any(image.get('src') == cover for image in old.images),
                      f'{slug}: featured cover does not belong to its detail')
            else:
                check(cover == official[0]['localPath'], f'{slug}: cover mismatches first official photo')
                check(any(image.get('src') == cover for image in current.images),
                      f'{slug}: catalogue cover does not belong to its detail')
            local = ROOT / cover.lstrip('/')
            check(local.is_file(), f'{slug}: cover file missing')
            image_bytes = local.read_bytes()
            check(image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP', f'{slug}: invalid WebP cover')
            covers.append({'slug': slug, 'path': cover, 'sha256': hashlib.sha256(image_bytes).hexdigest()})
        else:
            check(cover is None, f'{slug}: invented photo where none was verified')
            placeholders.append(slug)
        rendered = [x['data-embed-src'] for x in current.embeds] + [x.get('src', '') for x in current.iframes]
        maps += sum('www.google.com/maps' in url for url in rendered)
        tours += sum('www.google.com/maps' not in url for url in rendered)

    asset_changes = git('diff', '--name-only', ref, '--', 'assets/propiedades').decode().splitlines()
    untracked_assets = git('ls-files', '--others', '--exclude-standard', '--', 'assets/propiedades').decode().splitlines()
    check(not asset_changes and not untracked_assets, 'Existing official asset set changed or photos were downloaded again')
    asset_paths = git('ls-tree', '-r', '--name-only', ref, 'assets/propiedades').decode().splitlines()
    check(all((ROOT / path).is_file() for path in asset_paths), 'An existing property asset was removed')
    catalog = (ROOT / 'proyectos.html').read_text()
    match = re.search(r'const card = project => \{(.*?)\n    \};', catalog, re.S)
    check(match, 'Catalogue card renderer missing')
    renderer = match[1]
    check('Consultar proyecto' not in renderer and '/contacto.html' not in renderer,
          'Catalogue still renders consultation CTA')
    check(renderer.count("'Ver detalles'") == 1, 'Catalogue must render exactly one details CTA')
    for required in ['project.imagenPrincipal', 'project.imagenAlt', 'catalog-cover-image',
                     'catalog-cover-placeholder', 'catalog-details-link', 'project.detalleUrl', "'lazy'"]:
        check(required in renderer, f'Catalogue render contract missing: {required}')
    css = catalog + ''.join((ROOT / path).read_text() for path in ['assets/css/catalog.css'] if (ROOT / path).is_file())
    check(re.search(r'aspect-ratio\s*:\s*16\s*/\s*9', css), 'Uniform 16:9 catalogue cover styling missing')
    check(re.search(r'object-fit\s*:\s*cover', css), 'Catalogue object-fit cover missing')
    # Filters are tested in-browser; their markup and sort algorithms must survive this focused change.
    for required in ['asset-type', 'max-price', 'region', 'commune', 'state', 'sort-order',
                     "sortOrder.value === 'price-asc'", "sortOrder.value === 'price-desc'",
                     'Number.isFinite', 'grid.replaceChildren(...sorted.map(card))']:
        check(required in catalog, f'Catalogue filter/sorting contract missing: {required}')
    return {
        'result': 'passed', 'scope': 'structural and baseline file integrity; browser checks separate',
        'baselineCommit': git('rev-parse', ref).decode().strip(), 'projects': len(projects),
        'officialCovers': len(covers), 'placeholders': len(placeholders), 'placeholderSlugs': placeholders,
        'detailPagesPreserved': len(projects), 'captionsRemoved': captions_removed,
        'researchImageRecordsPreserved': gallery_images, 'originalAssetFilesPreserved': len(asset_paths),
        'mapsPreserved': maps, 'embeddedTourInstancesPreserved': tours,
        'researchMetadataUnchanged': True, 'commercialDataUnchanged': True,
        'bookingUnchanged': True, 'requiredAttributionFieldsInStoredMetadata': attribution_fields,
        'attributionScope': 'No explicit licence/credit metadata is stored; no external licence determination is implied',
        'covers': covers,
    }


if __name__ == '__main__':
    print(json.dumps(main(), ensure_ascii=False, indent=2))
