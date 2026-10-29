"""Apply owner-confirmed shared-stage project images without changing commercial data."""
from project_image_labels import apply_image_label_policy
import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import fitz
from bs4 import BeautifulSoup
from PIL import Image


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def apply(root, supplied_pdf, official_pdf):
    catalog_path = root / 'data/proyectos.json'
    catalog = json.loads(catalog_path.read_text())
    projects = {p['slug']: p for p in catalog}
    folder = 'assets/propiedades/shared-stages-20261025'
    (root / folder).mkdir(parents=True, exist_ok=True)
    records = {}
    slug = 'gregorio-de-la-fuente-a'
    pdfs = [fitz.open(official_pdf), fitz.open(supplied_pdf)]
    sources = [official_pdf, supplied_pdf]
    selection = [
        (0, 6, 'Fachada y acceso junto a la piscina'),
        (1, 282, 'Living y comedor del departamento piloto'),
        (1, 104, 'Dormitorio del departamento piloto'),
        (1, 20, 'Terraza del departamento piloto'),
        (1, 383, 'Cocina del departamento piloto'),
        (1, 425, 'Dormitorio principal del departamento piloto'),
        (1, 427, 'Baño del departamento piloto'),
        (1, 466, 'Dormitorio secundario del departamento piloto'),
        (1, 568, 'Salón de uso común'),
        (1, 569, 'Piscina exterior'),
        (1, 570, 'Quincho y comedor de uso común'),
        (1, 571, 'Hall de acceso'),
        (1, 572, 'Gimnasio'),
    ]
    images = []
    for i, (doc_index, xref, scene) in enumerate(selection, 1):
        doc = pdfs[doc_index]
        pix = fitz.Pixmap(doc, xref)
        if pix.alpha:
            pix = fitz.Pixmap(pix, 0)
        if pix.colorspace.n != 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        rel = f'{folder}/{slug}-{i:02d}.webp'
        im.save(root / rel, 'WEBP', quality=84, method=6)
        page = next(p.number + 1 for p in doc if any(x[0] == xref for x in p.get_images()))
        images.append({'path': '/' + rel, 'alt': f'Fotografía: {scene.lower()} de Condominio Gregorio de la Fuente',
                       'scene': scene, 'kind': 'fotografía', 'width': im.width, 'height': im.height,
                       'sha256': digest(root / rel), 'sourceFile': sources[doc_index].name,
                       'sourceSha256': digest(sources[doc_index]), 'page': page, 'xref': xref,
                       'method': 'native PDF image; optimized without generative alteration'})
    records[slug] = {'images': images, 'newGalleryImages': len(images)}

    for target, source, preserve in [('mapocho-3521-edificio-a', 'mapocho-3521', False),
                                     ('plaza-cervantes', 'plaza-cervantes-b', True)]:
        images = []
        for source_slug in ([target, source] if preserve else [source]):
            soup = BeautifulSoup((root / (source_slug + '.html')).read_text(), 'html.parser')
            for tag in soup.select('#galeria img'):
                path = tag['src']
                if any(i['path'] == path for i in images):
                    continue
                kind = 'render' if target.startswith('mapocho') else 'fotografía'
                scene = tag.get('alt', 'Imagen del conjunto')
                images.append({'path': path, 'alt': scene, 'scene': scene, 'kind': kind,
                               'width': int(tag['width']), 'height': int(tag['height']),
                               'sha256': digest(root / path.lstrip('/')),
                               'sourceProjectPage': '/' + source_slug + '.html',
                               'method': 'reuse existing verified project image'})
        records[target] = {'images': images, 'newGalleryImages': len(images) - int(preserve)}

    for slug, record in records.items():
        page = root / (slug + '.html')
        content = page.read_text()
        css = '<link rel="stylesheet" href="/assets/css/project-photos.css">'
        if css not in content:
            content = content.replace('</head>', css + '\n</head>')
        images = record['images']
        cover = images[0]
        if slug != 'plaza-cervantes':
            projects[slug]['imagenPrincipal'] = cover['path']
            projects[slug]['imagenAlt'] = cover['alt']
            hero = '<section class="project-hero photo-project-hero" aria-labelledby="project-name">\n'
            hero += f'<img class="hero-image" src="{cover["path"]}" alt="{html.escape(cover["alt"], quote=True)}" width="{cover["width"]}" height="{cover["height"]}" fetchpriority="high" decoding="async">\n'
            content, count = re.subn(r'<section class="project-hero hero-without-image" aria-labelledby="project-name">\s*',
                                     lambda m: hero, content, count=1)
            assert count == 1, slug
            label = 'Render referencial del conjunto' if cover['kind'] == 'render' else 'Fotografía del conjunto'
            content = content.replace('<div class="hero-badges">', '<div class="hero-badges"><span>' + label + '</span>', 1)
        figures = []
        for im in images:
            label = 'Render referencial' if im['kind'] == 'render' else 'Fotografía'
            caption = im['scene'] if im['scene'].lower().startswith('render referencial') else im['scene'] + ' · ' + label
            figures.append(f'<figure><a href="{im["path"]}" target="_blank" rel="noopener noreferrer"><img src="{im["path"]}" alt="{html.escape(im["alt"], quote=True)}" loading="lazy" decoding="async" width="{im["width"]}" height="{im["height"]}"></a><figcaption>{html.escape(caption)}</figcaption></figure>')
        note = 'Imágenes referenciales del conjunto, compartidas entre sus etapas y edificios. Abre cada imagen para verla completa.'
        if slug.startswith('mapocho'):
            note += ' Los renders son ilustrativos y no acreditan el estado actual de la obra.'
        gallery = '<section id="galeria" class="detail-section" aria-labelledby="project-gallery-heading"><p class="eyebrow">Imágenes del proyecto</p><h2 id="project-gallery-heading">Galería del proyecto</h2><p class="image-credit">' + note + '</p><div class="gallery-grid brochure-gallery">' + ''.join(figures) + '</div></section>'
        content, count = re.subn(r'<section id="galeria".*?</section>', lambda m: gallery, content, count=1, flags=re.S)
        assert count == 1, slug
        page.write_text(apply_image_label_policy(content))
        record['name'] = projects[slug]['nombre']
        record['url'] = 'https://sollahms.cl/' + slug + '.html'

    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    report = {'date': '2026-10-25', 'basis': 'User confirms photographs are shared across stages 1/2/3 and buildings A/B/C of the same project.',
              'userConfirmation': 'las fotos de la etapas son iguañes ya sea primera segunda o tercera o a, b o c',
              'scope': 'Project images only; no stage-specific commercial facts inferred.', 'projects': records,
              'newImageFiles': 13, 'reusedExistingImagesAddedToGalleries': 10, 'newGalleryImages': 23,
              'remainingImagePendingItems': []}
    docs = root / 'docs/shared-stage-photos-20261025'
    docs.mkdir(parents=True, exist_ok=True)
    (docs / 'image-provenance.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    config = json.loads((root / 'vercel.json').read_text())
    config['git']['deploymentEnabled']['codex/shared-stage-photos-20261025'] = False
    (root / 'vercel.json').write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: len(v['images']) for k, v in records.items()}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--supplied-pdf', type=Path, required=True)
    parser.add_argument('--official-pdf', type=Path, required=True)
    args = parser.parse_args()
    apply(args.root, args.supplied_pdf, args.official_pdf)
