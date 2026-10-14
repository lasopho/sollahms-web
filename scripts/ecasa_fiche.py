"""A single development page, preserving independently accredited stage facts."""
import html
import re
from urllib.parse import urlencode
from project_embed_policy import embed_hosts, map_markup, tour_articles, unique_tours
from public_copy import natural_caption

def esc(value):
    return html.escape(str(value), quote=True)

def presentation_research(research):
    entries = research.get('etapasComerciales', [])
    return dict(research, virtualTours=[tour for stage in entries for tour in stage['investigacion'].get('virtualTours', [])]) if entries else research

def consolidated_embed_hosts(research):
    return sorted({host for stage in research.get('etapasComerciales', []) for host in embed_hosts(stage['investigacion'])}) or embed_hosts(research)

def value(stage, key):
    evidence = stage['investigacion']
    return evidence.get('updates', {}).get(key, stage['catalogo'].get(key)) if key in evidence.get('verifiedFields', []) else None

def number(stage):
    return stage.get('etapa') or 1

def has_facts(stage):
    return any(value(stage, key) not in (None, '', []) for key in ['precioDesdeUF', 'estado', 'entrega', 'tipologias', 'direccion', 'amenities', 'descripcionLarga']) or bool(stage['investigacion'].get('images')) or any(stage['investigacion'].get('specs', {}).values())

def stage_content(project, stage):
    evidence = stage['investigacion']
    content = '<p>' + esc(value(stage, 'descripcionLarga')) + '</p>' if value(stage, 'descripcionLarga') else ''
    cells = []
    for key, label in [('estado', 'Estado'), ('entrega', 'Entrega'), ('direccion', 'Dirección'), ('tipologias', 'Tipologías disponibles')]:
        item = value(stage, key)
        if item not in (None, '', []):
            cells.append((label, '<br>'.join(esc(x) for x in item) if isinstance(item, list) else esc(item)))
    for key, label in [('utilM2', 'Superficie útil'), ('totalM2', 'Superficie total'), ('terrenoM2', 'Terreno'), ('dormitorios', 'Dormitorios'), ('banos', 'Baños')]:
        item = evidence.get('specs', {}).get(key)
        if item not in (None, ''):
            cells.append((label, esc(item) + (' m²' if key.endswith('M2') and not re.search(r'm[²2]', str(item)) else '')))
    price = value(stage, 'precioDesdeUF')
    if isinstance(price, (int, float)) and price > 0:
        cells.append(('Precio desde', 'UF ' + format(price, ',.0f').replace(',', '.')))
    content += '<dl class="spec-grid">' + ''.join('<div><dt>' + esc(label) + '</dt><dd>' + item + '</dd></div>' for label, item in cells) + '</dl>' if cells else ''
    if value(stage, 'amenities'):
        content += '<h3>Equipamiento</h3><ul class="amenity-list">' + ''.join('<li>' + esc(x) + '</li>' for x in value(stage, 'amenities')) + '</ul>'
    if evidence.get('images'):
        content += '<h3>Imágenes de esta etapa</h3><div class="gallery-grid">'
        for image in evidence['images']:
            path = image.get('localPath') or image['url']
            caption = natural_caption(image.get('alt') or stage['nombre'])
            content += f'<figure data-commercial-stage="{esc(stage["slug"])}"><a href="{esc(path)}" target="_blank" rel="noopener noreferrer"><img src="{esc(path)}" alt="{esc(caption)}" loading="lazy" decoding="async"></a></figure>'
        content += '</div>'
    if value(stage, 'direccion') and value(stage, 'comuna') and value(stage, 'mapQuery'):
        query = ', '.join(str(x) for x in [value(stage, 'direccion'), value(stage, 'comuna'), value(stage, 'region'), 'Chile'] if x)
        content += '<h3>Ubicación de esta etapa</h3>' + map_markup('https://www.google.com/maps?' + urlencode({'output': 'embed', 'q': query}), 'Mapa de ' + query)
    query = esc(urlencode({'proyecto': project['slug'], 'etapa': number(stage)}))
    content += '<p class="price-note">Información correspondiente a esta etapa. Confirma la unidad, las condiciones comerciales y la disponibilidad al consultar.</p><div class="ecasa-stage-actions">'
    for route, label in [('contacto', 'Consultar esta etapa'), ('comparador-hipotecario', 'Simular esta etapa'), ('agenda-asesoria', 'Agendar asesoría')]:
        content += f'<a class="button button-outline" href="/{route}.html?{query}">{label}</a>'
    return content + '</div>'

def consolidate_page(page, project, research):
    entries = research.get('etapasComerciales', [])
    if not entries:
        return page
    reference = next(stage for stage in entries if stage['slug'] == project['etapaReferenciaSlug'])
    multiple, ref_number, origin = len(entries) > 1, number(reference), reference['slug']
    # Original official heroes remain attributable when no documentary cover
    # replaces them. The brochure cover keeps its own explicit asset origin.
    page = re.sub(r'(<img class="hero-image"[^>]*)(>)', lambda match: match[1] +
                  ' data-commercial-stage="' + esc(origin) + '"' + match[2], page, count=1)
    for section_id in ['proyecto', 'caracteristicas', 'galeria', 'equipamiento', 'ubicacion']:
        def annotate(match):
            opening = match[1][:-1] + ' data-commercial-stage="' + esc(origin) + '">'
            content = ('<p class="ecasa-stage-note">Etapa ' + str(ref_number) + '</p>' if multiple else '') + match[2]
            if section_id == 'caracteristicas':
                content = '<span class="ecasa-stage-anchor" id="etapa-' + str(ref_number) + '"></span>' + content
            return opening + content + match[3]
        page = re.sub(r'(<section id="' + section_id + r'"[^>]*>)(.*?)(</section>)', annotate, page, count=1, flags=re.S)
    if multiple:
        state = value(reference, 'estado')
        if state:
            page = page.replace('<span>' + esc(state) + '</span>', '<span>' + esc(state) + ' · Etapa ' + str(ref_number) + '</span>', 1)
        page = page.replace('<span class="price-label">Precio desde</span>', '<span class="price-label">Precio desde · Etapa ' + str(ref_number) + '</span>')
        for route in ['contacto', 'agenda-asesoria', 'comparador-hipotecario']:
            old = '/' + route + '.html?proyecto=' + project['slug']
            page = page.replace('href="' + old + '"', 'href="' + old + '&amp;etapa=' + str(ref_number) + '"')
    tours, tour_anchors = [], set()
    for stage in entries:
        if not list(unique_tours(stage['investigacion'])):
            continue
        anchor = ''
        if stage['slug'] != origin and not has_facts(stage):
            anchor = f' id="etapa-{number(stage)}"'
            tour_anchors.add(number(stage))
        heading = f'<h3>Etapa {number(stage)}</h3>' if multiple else ''
        tours.append(f'<div class="ecasa-tour-stage" data-commercial-stage="{esc(stage["slug"])}"{anchor}>' + heading + tour_articles(stage['investigacion']) + '</div>')
    tour_html = '<section id="recorrido" class="detail-section project-tour-section"><p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>' + ''.join(tours) + '</section>' if tours else ''
    if re.search(r'<section id="recorrido"', page):
        page = re.sub(r'<section id="recorrido"[^>]*>.*?</section>', tour_html, page, count=1, flags=re.S)
    elif tour_html:
        page = page.replace('<section id="ubicacion"', tour_html + '<section id="ubicacion"', 1)
    if tour_html and 'href="#recorrido"' not in page:
        page = page.replace('<a href="#ubicacion">', '<a href="#recorrido">Recorrido virtual</a><a href="#ubicacion">', 1)
    panels, empty_anchors = [], []
    for stage in entries:
        if stage['slug'] == origin:
            continue
        n = number(stage)
        if has_facts(stage):
            state = value(stage, 'estado') or 'Características'
            panels.append(f'<details class="ecasa-stage" id="etapa-{n}" data-commercial-stage="{esc(stage["slug"])}"><summary><span>Etapa {n}</span><small>{esc(state)}</small></summary><div class="ecasa-stage-content">' + stage_content(project, stage) + '</div></details>')
        elif n not in tour_anchors:
            empty_anchors.append(f'<span class="ecasa-stage-anchor" id="etapa-{n}" aria-hidden="true"></span>')
    if panels:
        section = '<section id="etapas" class="detail-section ecasa-stage-section"><p class="eyebrow">Opciones del desarrollo</p><h2>Información por etapa</h2>' + ''.join(panels) + '</section>'
        page = page.replace('<section id="galeria"', section + '<section id="galeria"', 1)
        page = page.replace('<a href="#galeria">', '<a href="#etapas">Etapas</a><a href="#galeria">', 1)
    page = page.replace('<section id="caracteristicas"', ''.join(empty_anchors) + '<section id="caracteristicas"', 1)
    return page.replace('</head>', '<link rel="stylesheet" href="/assets/css/ecasa-stages.css?v=20261013"><script src="/assets/js/ecasa-stages.js" defer></script></head>')
