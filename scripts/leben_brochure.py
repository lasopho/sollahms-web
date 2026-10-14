"""Additive documentary sections; removing their markers restores each fiche."""
import html
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data/brochures-leben.json'
MARKERS = re.compile(r'<!--LEBEN_PREVIEW_START-->.*?<!--LEBEN_PREVIEW_END-->', re.S)
INDI_SLUG = 'edificio-indi'


def esc(value):
    return html.escape(str(value), quote=True)


def block(value):
    return '<!--LEBEN_PREVIEW_START-->' + value + '<!--LEBEN_PREVIEW_END-->'


def public_leben_page(page):
    """Restore the exact public fragment before adding a fresh private overlay."""
    for kind in ['PREVIEW', 'PUBLIC']:
        if page.count('<!--LEBEN_' + kind + '_START-->') != page.count('<!--LEBEN_' + kind + '_END-->'):
            raise ValueError('Unpaired Leben source marker')
    page = MARKERS.sub('', page)
    return re.sub(r'<!--LEBEN_PUBLIC_(?:START|END)-->', '', page)


def private_indi_hero(page, record):
    cover = record.get('catalogueCover')
    if not cover:
        return page
    if record['slug'] != INDI_SLUG:
        raise ValueError('Only the reviewed Indi cover may change a Leben hero')
    image = next((image for image in record['images'] if image['localPath'] == cover.get('localPath')), None)
    prefix = '/assets/propiedades/leben-preview/' + INDI_SLUG + '/'
    if not image or not image['localPath'].startswith(prefix) or not re.fullmatch(r'[a-z0-9_.-]+\.(?:webp|jpe?g|png)', image['localPath'][len(prefix):]) or image.get('qualityDecision') != 'keep' or image.get('visuallyVerified') is not True or image.get('privacySafe') is not True or not isinstance(cover.get('alt'), str) or not cover['alt'].strip():
        raise ValueError('Indi hero must use a visually reviewed selected same-project image')
    hero_pattern = re.compile(r'<section\b[^>]*class=["\'][^"\']*\bproject-hero\b[^"\']*["\'][^>]*>.*?</section>', re.S)
    heroes = list(hero_pattern.finditer(page))
    if len(heroes) != 1:
        raise ValueError('Indi requires exactly one original hero')
    original = heroes[0].group(0)
    preview = re.sub(r'(\bclass=["\'])([^"\']*)(["\'])', lambda match: match[1] + match[2] + ' project-hero-indi-preview' + match[3], original, count=1)
    image_pattern = re.compile(r'<img\b[^>]*class=["\'][^"\']*\bhero-image\b[^"\']*["\'][^>]*>')
    if len(image_pattern.findall(preview)) != 1:
        raise ValueError('Indi requires exactly one original hero image')
    selected_image = '<img class="hero-image hero-image-indi-preview" src="' + esc(image['localPath']) + '" alt="' + esc(cover['alt']) + '" width="' + str(image['width']) + '" height="' + str(image['height']) + '" fetchpriority="high" decoding="async" data-brochure-page="' + str(image['sourcePage']) + '">'
    preview = image_pattern.sub(lambda _: selected_image, preview, count=1)
    replacement = block(preview) + '<!--LEBEN_PUBLIC_START-->' + original + '<!--LEBEN_PUBLIC_END-->'
    return page[:heroes[0].start()] + replacement + page[heroes[0].end():]


def area(value):
    return 'No indicada' if value is None else ('%.2f' % value).replace('.', ',') + ' m²'


def facts(items):
    return '<ul class="leben-facts">' + ''.join(
        '<li data-brochure-pages="' + esc(','.join(map(str, item['pages']))) + '">' +
        esc(item.get('displayLabel', item['label'])) + '</li>' for item in items) + '</ul>'


def complementary_amenities(record):
    project = next(project for project in json.loads((ROOT / 'data/proyectos.json').read_text()) if project['slug'] == record['slug'])
    def key(label):
        label = ''.join(character for character in unicodedata.normalize('NFD', label.casefold()) if not unicodedata.combining(character))
        label = re.sub(r'[^a-z0-9]+', ' ', label).strip()
        return re.sub(r'^quinchos\b', 'quincho', label)
    existing = [key(label) for label in project.get('amenities', [])]
    return [item for item in record['amenities'] if not any(old == key(item['label']) or old.startswith(key(item['label']) + ' ') for old in existing)]


def complement(record):
    images = record['images']
    result = '<div class="leben-complement" data-brochure-project="' + esc(record['slug']) + '">'
    if images:
        result += '<section id="espacios-complementarios" class="leben-section" aria-labelledby="leben-images-title"><p class="leben-eyebrow">Diseño y espacios</p><h2 id="leben-images-title">Más espacios del proyecto</h2><p>Imágenes referenciales del proyecto; confirma las características de la unidad que te interesa.</p><div class="leben-gallery">'
        for image in images:
            caption = image.get('displayCaption', image['caption'])
            result += '<figure data-brochure-page="' + str(image['sourcePage']) + '"><a href="' + esc(image['localPath']) + '" target="_blank" rel="noopener noreferrer" aria-label="Ampliar: ' + esc(caption) + '"><img src="' + esc(image['localPath']) + '" alt="' + esc(caption) + '" width="' + str(image['width']) + '" height="' + str(image['height']) + '" loading="lazy" decoding="async"></a><figcaption>' + esc(caption) + '</figcaption></figure>'
        result += '</div></section>'
    surfaces = record.get('documentarySurfaces', [])
    if surfaces:
        result += '<section id="superficies-documentadas" class="leben-section" aria-labelledby="leben-surfaces-title"><p class="leben-eyebrow">Distribución y superficies</p><h2 id="leben-surfaces-title">Superficies referenciales</h2><p>Valores impresos en el brochure. Los modelos pueden diferir de la oferta disponible; confirma las superficies, orientación y piso de la unidad que consultes. La segunda superficie impresa no indica si corresponde a terraza o total; su clasificación está pendiente.</p><div class="leben-table-wrap" tabindex="0" role="region" aria-label="Tabla de superficies referenciales"><table><thead><tr><th scope="col">Modelo</th><th scope="col">Tipología</th><th scope="col">Útil</th><th scope="col">Otra superficie publicada</th></tr></thead><tbody>'
        for model in surfaces:
            result += '<tr data-brochure-page="' + str(model['pagina_brochure']) + '"><th scope="row">' + esc(model.get('label', model['modelo'])) + '</th><td>' + esc(model['tipologia']) + '</td><td>' + area(model.get('superficie_util_m2')) + '</td><td>' + area(model.get('superficie_publicada_sin_etiqueta_m2')) + '</td></tr>'
        result += '</tbody></table></div></section>'
    groups = [(complementary_amenities(record), 'Equipamiento complementario'), (record['finishes'], 'Terminaciones'), (record['features'], 'Características y diseño')]
    if any(items for items, title in groups):
        result += '<section id="detalles-complementarios" class="leben-section" aria-labelledby="leben-facts-title"><p class="leben-eyebrow">Vida cotidiana</p><h2 id="leben-facts-title">Equipamiento y terminaciones</h2><p>Características referenciales. Confirma el equipamiento y las terminaciones de la unidad que consultes.</p>'
        for items, title in groups:
            if items:
                result += '<h3>' + title + '</h3>' + facts(items)
        result += '</section>'
    relationship = record.get('developerRelationship')
    if relationship:
        result += '<section id="comercializacion-proyecto" class="leben-section" aria-labelledby="leben-relationship-title"><h2 id="leben-relationship-title">Comercialización del proyecto</h2><p>' + esc(relationship['displayNote']) + '</p><p>' + ' · '.join('<a href="' + esc(source['url']) + '" target="_blank" rel="noopener noreferrer">' + esc(source['label']) + '</a>' for source in relationship['sources']) + '</p></section>'
    if not record['models']:
        result += '<section id="planos-complementarios" class="leben-section leben-pending" aria-labelledby="leben-plans-title"><h2 id="leben-plans-title">Planos de las unidades</h2><p>Planos individuales nítidos pendientes de incorporación. Solicita el plano y las superficies de la unidad que te interesa.</p></section>'
    return result + '</div>'


def augment_leben_page(page, slug):
    if not MANIFEST.is_file():
        return page
    record = next((record for record in json.loads(MANIFEST.read_text())['projects'] if record['slug'] == slug), None)
    if not record:
        return page
    page = public_leben_page(page)
    page = private_indi_hero(page, record)
    styles = block('<link rel="stylesheet" href="/assets/css/leben-brochure-preview.css?v=20261013">')
    page = page.replace('</head>', styles + '</head>', 1)
    content = block(complement(record))
    if '<section id="ubicacion"' in page:
        page = page.replace('<section id="ubicacion"', content + '<section id="ubicacion"', 1)
    elif '<!-- featured-details-end -->' in page:
        page = page.replace('<!-- featured-details-end -->', '<!-- featured-details-end -->' + content, 1)
    else:
        raise ValueError('No existing project body insertion point: ' + slug)
    return page


def main():
    review = json.loads(MANIFEST.read_text())
    for record in review['projects']:
        path = ROOT / (record['slug'] + '.html')
        path.write_text(augment_leben_page(path.read_text(), record['slug']))
    print(json.dumps({'complementedExistingFiches': len(review['projects'])}))


if __name__ == '__main__':
    main()
