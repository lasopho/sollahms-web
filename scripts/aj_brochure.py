"""Documentary additions, isolated from commercial data and public releases."""
import html
import json
import re
from pathlib import Path

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
    if not MANIFEST.is_file():
        return page
    record = next((p for p in json.loads(MANIFEST.read_text())['projects'] if p['slug'] == slug), None)
    if not record:
        return page
    page = page.replace('</head>', preview('<link rel="stylesheet" href="/assets/css/aj-brochure-preview.css?v=20261010">') + '</head>')
    page = page.replace('<a href="#recorrido">', preview('<a href="#modelos">Modelos y planos</a>') + '<a href="#recorrido">', 1)
    if record.get('hero'):
        # These two fichas previously had no official image. The fallback page
        # remains byte-identical after removing the preview block.
        hero = f'<img class="hero-image aj-hero" src="{esc(record["hero"])}" alt="Fachada de {esc(record["name"])} — render ilustrativo del brochure" fetchpriority="high" decoding="async">'
        page = page.replace('<div class="hero-shade">', preview(hero) + '<div class="hero-shade">', 1)
    images = '<div class="gallery-grid aj-gallery">'
    for image in record['images']:
        caption = f'{image["caption"]} · Brochure, pág. {image["sourcePage"]}'
        images += f'<figure><a href="{esc(image["localPath"])}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar: {esc(image["caption"])}"><img src="{esc(image["localPath"])}" alt="{esc(image["caption"])}" width="{image["width"]}" height="{image["height"]}" loading="lazy" decoding="async"></a><figcaption>{esc(caption)}</figcaption></figure>'
    images += '</div>'
    gallery = re.search(r'(<section id="galeria"[^>]*>)(.*?)(</section>)', page, re.S)
    old = gallery[2]
    if 'gallery-grid' in old:
        new = old + '<div class="aj-gallery-heading"><h3>Imágenes del brochure</h3><p>Representaciones ilustrativas del proyecto. No acreditan su estado actual ni la disponibilidad de una unidad.</p></div>' + images
    else:
        heading = '<p class="eyebrow">Imágenes del proyecto</p><h2>Galería del proyecto</h2>'
        new = heading + '<p>Renders ilustrativos del brochure. Consulta con la inmobiliaria las fotografías del estado actual del proyecto.</p>' + images
    page = page[:gallery.start()] + gallery[1] + public(old) + preview(new) + gallery[3] + page[gallery.end():]
    groups = {}
    for model in record['models']:
        groups.setdefault(model['tipologia'], []).append(model)
    content = '<section id="modelos" class="detail-section aj-models" aria-labelledby="modelos-title"><p class="eyebrow">Diseño y distribución</p><h2 id="modelos-title">Modelos y planos</h2>'
    content += f'<p class="lead">{len(record["models"])} modelos documentados en el brochure de {esc(record["name"])}.</p><div class="aj-scope"><p>Información referencial del brochure, con superficies aproximadas. Estos modelos no acreditan disponibilidad actual. Los precios, el estado comercial y la entrega se consultan en la información vigente de la ficha.</p></div>'
    for typology, models in groups.items():
        content += f'<details class="aj-typology"><summary><span>{esc(typology)}</span><span class="aj-count">{len(models)} {"modelo" if len(models) == 1 else "modelos"}</span></summary><div class="aj-model-list">'
        for model in models:
            plan = model['plan']
            name = 'Modelo ' + model['modelo']
            content += f'<details class="aj-model" id="modelo-{esc(model["modelo"].lower())}"><summary><span>{esc(name)}<small>{esc(model["orientacion"])} · Pisos {esc(model["pisos"])}</small></span><span class="aj-total">{area(model["superficie_total_m2"])}<small>Total según brochure</small></span></summary><div class="aj-model-content">'
            content += '<dl class="aj-metrics">' + ''.join(f'<div><dt>{esc(label)}</dt><dd>{value}</dd></div>' for label, value in [('Útil', area(model['superficie_util_m2'])), ('Terraza', area(model['terraza_m2'])), ('Total impreso', area(model['superficie_total_m2']))]) + '</dl>'
            notes = model.get('notes', []) + [model[key] for key in ['advertencia', 'excepcion'] if model.get(key)]
            if notes:
                content += '<div class="aj-model-note">' + ''.join(f'<p>{esc(note)}</p>' for note in dict.fromkeys(notes)) + '</div>'
            content += f'<a class="aj-plan-link" href="{esc(plan["localPath"])}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano de {esc(name)}"><img src="{esc(plan["localPath"])}" alt="Plano referencial de {esc(name)}, {esc(typology)}, {esc(record["name"])} — página {model["pagina_brochure"]}" width="{plan["width"]}" height="{plan["height"]}" loading="lazy" decoding="async"></a><div class="aj-plan-caption"><span>Brochure · pág. {model["pagina_brochure"]}</span><a href="{esc(plan["localPath"])}" target="_blank" rel="noopener noreferrer">Ampliar plano ↗</a></div></div></details>'
        content += '</div></details>'
    content += '</section>'
    page = page.replace('<section id="equipamiento"', preview(content) + '<section id="equipamiento"', 1)
    equipment = re.search(r'(<section id="equipamiento"[^>]*>)(.*?)(</section>)', page, re.S)
    old = equipment[2]
    heading = old.split('</h2>')[0] + '</h2>'
    new = old if 'amenity-list' in old else heading
    new += '<div class="aj-equipment"><h3>Equipamiento documentado en el brochure</h3><p>Características del documento de referencia, sujetas a confirmación para la unidad y etapa que consultes.</p>' + documentary_list(record['amenities'])
    new += '<h3>Terminaciones y características</h3>' + documentary_list(record['finishes'] + record['features']) + '</div>'
    page = page[:equipment.start()] + equipment[1] + public(old) + preview(new) + equipment[3] + page[equipment.end():]
    sources = '<div class="aj-source"><h3>Fuente documental de modelos e imágenes</h3>'
    sources += f'<p>{esc(record["document"]["fileName"])} · AJ Urbana. Revisado el <time datetime="2026-10-10">2026-10-10</time>. Las superficies, orientaciones y planos se contrastaron con sus páginas originales; no se utilizan como oferta comercial vigente.</p>'
    sources += '<details><summary>Observaciones del brochure y datos por confirmar</summary><ul>' + ''.join(f'<li>{esc(note)}</li>' for note in record['warnings']) + '</ul></details></div>'
    page = page.replace('</section>\n        <a class="back-link"', preview(sources) + '</section>\n        <a class="back-link"', 1)
    return page
