"""Documentary additions, isolated from commercial data and public releases."""
import html
import json
import re
import unicodedata
from pathlib import Path
from fiche_presentation import commercialize_fiche

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data/brochures-aj-urbana.json'


def esc(value):
    return html.escape(str(value), quote=True)


def preview(value):
    return '<!--AJ_PREVIEW_START-->' + value + '<!--AJ_PREVIEW_END-->'


def public(value):
    return '<!--AJ_PUBLIC_START-->' + value + '<!--AJ_PUBLIC_END-->'


def area(value):
    return 'No indicada' if value is None else f'{value:.2f}'.replace('.', ',') + ' m²'


def documentary_list(items):
    return '<ul class="amenity-list aj-facts">' + ''.join(
        f'<li>{esc(item["label"])}<span class="aj-page">Brochure · pág. {esc(", ".join(map(str, item["pages"])))}</span></li>'
        for item in items) + '</ul>'


def augment_page(page, slug):
    for manifest, namespace, builder in [(MANIFEST, 'AJ', 'AJ Urbana'),
            (ROOT / 'data/brochures-ingevec.json', 'INGEVEC', 'Ingevec Inmobiliaria')]:
        if not manifest.is_file():
            continue
        record = next((p for p in json.loads(manifest.read_text())['projects'] if p['slug'] == slug), None)
        if record:
            return augment_record(page, record, namespace, builder)
    return page


def augment_record(page, record, namespace, builder):
    # Both batches share the existing premium presentation. Their separate
    # markers allow the packager to reproduce the original public fallback.
    def preview(value):
        return f'<!--{namespace}_PREVIEW_START-->' + value + f'<!--{namespace}_PREVIEW_END-->'

    def public(value):
        return f'<!--{namespace}_PUBLIC_START-->' + value + f'<!--{namespace}_PUBLIC_END-->'

    page = page.replace('</head>', preview('<link rel="stylesheet" href="/assets/css/aj-brochure-preview.css?v=20261010">') + '</head>')
    if not re.search(r'\bhref=[\"\']#modelos[\"\']', page):
        navigation_anchor = '<a href="#recorrido">' if '<a href="#recorrido">' in page else '<a href="#ubicacion">'
        page = page.replace(navigation_anchor, preview('<a href="#modelos">Modelos y distribuciones</a>') + navigation_anchor, 1)
    if record.get('hero'):
        # A better reviewed hero is isolated from the original public image.
        # Removing preview blocks reconstructs the public fallback exactly.
        hero_caption = record.get('heroCaption', f'Fachada de {record["name"]} — render ilustrativo del brochure')
        hero = f'<img class="hero-image aj-hero" src="{esc(record["hero"])}" alt="{esc(hero_caption)}" fetchpriority="high" decoding="async">'
        original = re.search(r'<img class="hero-image"[^>]*>', page)
        if original:
            page = page[:original.start()] + public(original[0]) + preview(hero) + page[original.end():]
        else:
            page = page.replace('<div class="hero-shade">', preview(hero) + '<div class="hero-shade">', 1)
    images = '<div class="gallery-grid aj-gallery">'
    for image in record['images']:
        if image.get('gallery') is False:
            continue
        caption = f'{image["caption"]} · Brochure, pág. {image["sourcePage"]}'
        images += f'<figure><a href="{esc(image["localPath"])}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar: {esc(image["caption"])}"><img src="{esc(image["localPath"])}" alt="{esc(image["caption"])}" width="{image["width"]}" height="{image["height"]}" loading="lazy" decoding="async"></a><figcaption>{esc(caption)}</figcaption></figure>'
    images += '</div>'
    gallery = re.search(r'(<section id="galeria"[^>]*>)(.*?)(</section>)', page, re.S)
    old = gallery[2]
    if 'gallery-grid' in old:
        retained = old
        for image in record['images']:
            if image.get('replaces'):
                replaced_paths = image['replaces'] if isinstance(image['replaces'], list) else [image['replaces']]
                for replaced_path in replaced_paths:
                    retained = re.sub(r'<figure>(?:(?!</figure>).)*' + re.escape(esc(replaced_path)) + r'(?:(?!</figure>).)*</figure>', '', retained, flags=re.S)
        new = retained + '<div class="aj-gallery-heading"><h3>Imágenes del brochure</h3><p>Representaciones ilustrativas del proyecto. No acreditan su estado actual ni la disponibilidad de una unidad.</p></div>' + images
    else:
        heading = '<p class="eyebrow">Imágenes del proyecto</p><h2>Galería del proyecto</h2>'
        image_note = ('Fotografías y renders referenciales del proyecto. Consulta con la inmobiliaria las imágenes del estado actual.'
                      if any(image.get('kind') in {'photo', 'brochure_photo'} for image in record['images'])
                      else 'Renders ilustrativos del brochure. Consulta con la inmobiliaria las fotografías del estado actual del proyecto.')
        new = heading + '<p>' + image_note + '</p>' + images
    page = page[:gallery.start()] + gallery[1] + public(old) + preview(new) + gallery[3] + page[gallery.end():]
    groups = {}
    for model in record['models']:
        groups.setdefault((model.get('etapa'), model['tipologia']), []).append(model)
    model_class = 'detail-section aj-models' + (' ingevec-models' if namespace == 'INGEVEC' else '')
    content = f'<section id="modelos" class="{model_class}" aria-labelledby="modelos-title"><p class="eyebrow">Diseño y distribución</p><h2 id="modelos-title">Modelos y distribuciones</h2>'
    content += f'<p class="lead">{len(record["models"])} modelos documentados en el brochure de {esc(record["name"])}.</p><div class="aj-scope"><p>Información referencial del brochure, con superficies aproximadas. Estos modelos no acreditan disponibilidad actual. Los precios, el estado comercial y la entrega se consultan en la información vigente de la ficha.</p></div>'
    active_stage = None
    for (stage, typology), models in groups.items():
        if stage != active_stage:
            if active_stage:
                content += '</div>'
            if stage:
                content += f'<div class="aj-stage" data-stage="{esc(stage)}"><h3>{esc(stage)}</h3><p>Distribuciones referenciales de esta etapa. Confirma su comercialización y la unidad disponible al consultar.</p>'
            active_stage = stage
        content += f'<details class="aj-typology"><summary><span>{esc(typology)}</span><span class="aj-count">{len(models)} {"modelo" if len(models) == 1 else "modelos"}</span></summary><div class="aj-model-list">'
        for model in models:
            plan = model['plan']
            name = 'Modelo ' + model.get('label', model['modelo'])
            accessible_name = name + (' · ' + stage if stage else '')
            orientation = model.get('orientacion') or 'Orientación no indicada'
            floor = ' · Pisos ' + str(model['pisos']) if model.get('pisos') else ''
            content += f'<details class="aj-model" id="modelo-{esc(model["modelo"].lower())}"><summary><span>{esc(name)}<small>{esc(orientation + floor)}</small></span><span class="aj-total">{area(model["superficie_total_m2"])}<small>Total según brochure</small></span></summary><div class="aj-model-content">'
            typology_numbers = re.search(r'(\d+) dormitorio.*?(\d+) baño', typology)
            bedrooms = model.get('dormitorios', int(typology_numbers[1]) if typology_numbers else None)
            bathrooms = model.get('banos', int(typology_numbers[2]) if typology_numbers else None)
            bedrooms_text = 'Estudio' if typology == 'Estudio' or bedrooms == 0 else str(bedrooms) if bedrooms is not None else 'Por confirmar'
            bathrooms_text = str(bathrooms) if bathrooms is not None else 'Por confirmar'
            metrics = [('Útil', area(model['superficie_util_m2'])), ('Terraza', area(model['terraza_m2'])), ('Total impreso', area(model['superficie_total_m2']))]
            if namespace == 'INGEVEC':
                metrics += [('Dormitorios', bedrooms_text), ('Baños', bathrooms_text), ('Orientación', model.get('orientacion') or 'No indicada')]
            content += '<dl class="aj-metrics">' + ''.join(f'<div><dt>{esc(label)}</dt><dd>{esc(value)}</dd></div>' for label, value in metrics) + '</dl>'
            notes = model.get('notes', []) + [model[key] for key in ['advertencia', 'excepcion'] if model.get(key)]
            if notes:
                content += '<div class="aj-model-note">' + ''.join(f'<p>{esc(note)}</p>' for note in dict.fromkeys(notes)) + '</div>'
            content += f'<a class="aj-plan-link" href="{esc(plan["localPath"])}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano de {esc(accessible_name)}"><img src="{esc(plan["localPath"])}" alt="Plano referencial de {esc(accessible_name)}, {esc(typology)}, {esc(record["name"])} — página {model["pagina_brochure"]}" width="{plan["width"]}" height="{plan["height"]}" loading="lazy" decoding="async"></a><div class="aj-plan-caption"><span>Brochure · pág. {model["pagina_brochure"]}</span><a href="{esc(plan["localPath"])}" target="_blank" rel="noopener noreferrer">Ampliar plano ↗</a></div></div></details>'
        content += '</div></details>'
    if active_stage:
        content += '</div>'
    content += '</section>'
    page = page.replace('<section id="equipamiento"', preview(content) + '<section id="equipamiento"', 1)
    equipment = re.search(r'(<section id="equipamiento"[^>]*>)(.*?)(</section>)', page, re.S)
    old = equipment[2]
    heading = old.split('</h2>')[0] + '</h2>'
    new = old if 'amenity-list' in old else heading
    amenities = record['amenities']
    if record.get('mergeEquipment'):
        # Combine the seven newly enriched fichas with their verified existing
        # amenities. The public fallback remains byte identical.
        aliases = {'quincho': 'quinchos', 'sala cowork': 'cowork', 'sala co work': 'cowork',
                   'sala gourmet': 'gourmet', 'salon gourmet': 'gourmet',
                   'salon multiuso': 'multiuso', 'sala multiuso': 'multiuso'}
        def key(label):
            normalized = ''.join(c for c in unicodedata.normalize('NFD', label.lower()) if not unicodedata.combining(c))
            normalized = ' '.join(normalized.split())
            return aliases.get(normalized, normalized)
        amenities = list(amenities)
        seen = {key(item['label']) for item in amenities}
        old_list = re.search(r'<ul class="amenity-list"[^>]*>(.*?)</ul>', old, re.S)
        if old_list:
            for item in re.findall(r'<li>(.*?)</li>', old_list[1], re.S):
                label = html.unescape(re.sub(r'<[^>]+>', '', item)).strip()
                if key(label) not in seen:
                    amenities.append({'label': label, 'pages': []})
                    seen.add(key(label))
            new = old[:old_list.start()] + old[old_list.end():]
    new += '<div class="aj-equipment"><h3>Equipamiento documentado en el brochure</h3><p>Características del documento de referencia, sujetas a confirmación para la unidad y etapa que consultes.</p>' + documentary_list(amenities)
    new += '<h3>Terminaciones y características</h3>' + documentary_list(record['finishes'] + record['features']) + '</div>'
    page = page[:equipment.start()] + equipment[1] + public(old) + preview(new) + equipment[3] + page[equipment.end():]
    # Documentary provenance stays in the immutable manifests. The shared
    # presentation policy retains the relevant brief cautions next to models.
    return commercialize_fiche(page, record['slug'])
