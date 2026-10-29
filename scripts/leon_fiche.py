"""León fiches from the supplied brochures and dated official commercial evidence."""
import html
import json
from pathlib import Path
from string import Template
from urllib.parse import urlencode
from project_embed_policy import map_markup
from leon_surfaces import reviewed_surface_plans, room_counts, surface_value

ROOT = Path(__file__).resolve().parents[1]

def esc(value):
    return html.escape(str(value), quote=True)

def facts(rows):
    return '<ul class="amenity-list">' + ''.join('<li>' + esc(r if isinstance(r, str) else r['label']) + '</li>' for r in rows) + '</ul>'

def typology(model):
    bedrooms, bathrooms = model.get('bedrooms'), model.get('bathrooms')
    name = 'Estudio' if bedrooms == 0 else str(bedrooms) + ' dormitorio' + ('s' if bedrooms != 1 else '') if bedrooms is not None else 'Tipología del brochure'
    return name + (' · ' + str(bathrooms) + ' baño' + ('s' if bathrooms != 1 else '') if bathrooms is not None else '')

def image(asset, caption, hero=False, plan=False):
    variants = asset.get('variants', [])
    if isinstance(variants, dict): variants = list(variants.values())
    variants = [v for v in variants if isinstance(v, dict)] + [asset]
    sources = {v['width']: v for v in variants}
    srcset = ', '.join(esc(v['localPath']) + ' ' + str(width) + 'w' for width, v in sorted(sources.items()))
    sizes = '100vw' if hero else '(max-width: 900px) 90vw, 820px' if plan else '(max-width: 600px) 90vw, (max-width: 900px) 45vw, 420px'
    position = ' style="object-position:' + esc(asset['objectPosition']) + '"' if hero and asset.get('objectPosition') else ''
    return '<img ' + ('class="hero-image" ' if hero else '') + 'src="' + esc(asset['localPath']) + '" srcset="' + srcset + '" sizes="' + sizes + '" alt="' + esc(caption) + '" width="' + str(asset['width']) + '" height="' + str(asset['height']) + '"' + position + ' ' + ('fetchpriority="high"' if hero else 'loading="lazy"') + ' decoding="async">'

def render_plans(record):
    name = record['name']
    plans = '<section id="planos" class="detail-section"><p class="eyebrow">Diseño y distribución</p><h2>Tipologías, planos y superficies</h2><p>Planos de referencia. Las superficies se conservan por modelo y no acreditan disponibilidad actual.</p><div class="leon-models">'
    surface_plans = reviewed_surface_plans(record)
    for model in record['models']:
        plan = model['plan']
        reviewed = surface_plans[plan['localPath']] if surface_plans else None
        label = reviewed['typology'] if reviewed else model['label']
        counts = room_counts(reviewed) if reviewed else typology(model)
        plan_id = ' data-plan-id="' + esc(reviewed['id']) + '"' if reviewed else ''
        plans += '<article class="leon-model" data-source-page="' + str(model['sourcePage']) + '"' + plan_id + '><h3>' + esc(label) + '</h3><p class="leon-room-counts">' + esc(counts) + '</p><a href="' + esc(plan['localPath']) + '" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano ' + esc(label) + '">' + image(plan, 'Plano ' + label + ' de ' + name, plan=True) + '</a><dl class="leon-areas">'
        for area in (reviewed['areas'] if reviewed else model.get('areas') or []):
            value = surface_value(area) if reviewed else 'Por confirmar' if area['valueM2'] is None else f"{area['valueM2']:.2f}".replace('.', ',') + ' m²'
            field = ' data-surface-kind="' + esc(area['kind']) + '"' if reviewed else ''
            plans += '<div' + field + '><dt>' + esc(area['label']) + '</dt><dd>' + esc(value) + '</dd></div>'
        plans += '</dl>'
        if reviewed and not reviewed['complete']:
            plans += '<p class="leon-source-note">Consulta las superficies de esta tipología al cotizar.</p>'
        elif not reviewed:
            for note in model.get('notes', []): plans += '<p class="leon-source-note">' + esc(note) + '</p>'
        plans += '</article>'
    plans += '</div>'
    for table in ([] if surface_plans else record.get('unassignedAreas', [])):
        plans += '<article class="leon-surface-table" data-source-page="' + str(table['sourcePage']) + '"><h3>Superficies del brochure · ' + esc(table['typology']) + ' · página ' + str(table['sourcePage']) + '</h3><p>' + esc(table['note']) + '</p><table><thead><tr><th scope="col">Útil</th><th scope="col">Terraza</th><th scope="col">Total</th></tr></thead><tbody>'
        for row in table['rows']:
            plans += '<tr>'
            for area in row['areas']:
                value = 'No informada' if area['valueM2'] is None else area.get('displayValue', f"{area['valueM2']:.2f}".replace('.', ',')) + ' m²'
                plans += '<td>' + esc(value) + '</td>'
            plans += '</tr>'
            if row.get('notes'): plans += '<tr><td colspan="3">' + esc(' '.join(row['notes'])) + '</td></tr>'
        plans += '</tbody></table></article>'
    plans += '</section>'
    return plans

def render(record):
    name, slug, loc = record['name'], record['slug'], record['location']
    hero = next(i for i in record['images'] if i['localPath'] == record['cover'])
    commercial = record['commercial']
    location = ', '.join([loc['address'], loc['commune']])
    overview = '<p class="lead">' + esc(record['description'].replace('El brochure presenta', 'El proyecto presenta')) + '</p>'
    for key, title in [('architecture', 'Arquitectura'), ('connectivity', 'Entorno y conectividad')]:
        if record.get(key): overview += '<h3>' + title + '</h3>' + facts(record[key])
    cells = [('Inmobiliaria', 'Inmobiliaria León'), ('Dirección', loc['address']), ('Comuna', loc['commune']), ('Región', loc['region']), ('Tipologías', ', '.join(dict.fromkeys(typology(m) for m in record['models'])))]
    for key, label in [('estado', 'Estado comercial'), ('entrega', 'Entrega')]:
        if commercial.get(key): cells.append((label, commercial[key]))
    specs = ''.join('<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>' for label, value in cells)
    gallery = '<p>Imágenes referenciales del proyecto. Selecciona una imagen para ampliarla.</p>'
    selected = set()
    for kind, title in [('facade', 'Fachada y arquitectura'), ('common', 'Áreas comunes'), ('interior', 'Interiores'), ('other', 'Otros espacios')]:
        assets = [i for i in record['images'] if (i.get('kind') == kind if kind != 'other' else i['localPath'] not in selected)]
        if not assets: continue
        gallery += '<h3>' + title + '</h3><div class="gallery-grid">'
        for asset in assets:
            selected.add(asset['localPath'])
            caption = asset['caption']
            gallery += '<figure data-source-page="' + str(asset['sourcePage']) + '"><a href="' + esc(asset['localPath']) + '" target="_blank" rel="noopener noreferrer" aria-label="Ampliar ' + esc(caption) + '">' + image(asset, caption) + '</a><figcaption>' + esc(caption) + '</figcaption></figure>'
        gallery += '</div>'
    plans = render_plans(record)
    amenities = facts(record.get('amenities', [])) if record.get('amenities') else '<p>Consulta el equipamiento del proyecto.</p>'
    if record.get('finishes'): amenities += '<h3>Terminaciones y equipamiento</h3>' + facts(record['finishes'])
    tours = ''.join('<article class="tour-card"><h3>' + esc(tour.get('title', 'Recorrido virtual oficial')) + '</h3><a class="button button-outline" href="' + esc(tour['url']) + '" target="_blank" rel="noopener noreferrer">Abrir recorrido oficial ↗</a></article>' for tour in record.get('virtualTours', []))
    if tours: tours = '<section id="recorrido" class="detail-section"><p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>' + tours + '</section>'
    query = ', '.join([loc['address'], loc['commune'], loc['region'], 'Chile'])
    maphtml = '<p>' + esc(query) + '</p>' + map_markup('https://www.google.com/maps?' + urlencode({'q': query, 'output': 'embed'}), 'Mapa de ' + name) + '<p class="map-note">Mapa de búsqueda por la dirección del proyecto. El marcador lo determina Google Maps.</p>'
    price = 'UF ' + f"{commercial['precioDesdeUF']:,.0f}".replace(',', '.') if commercial.get('precioDesdeUF') else 'Consultar precio'
    structured = {'@context': 'https://schema.org', '@type': 'ApartmentComplex', 'name': name, 'url': 'https://sollahms.cl/' + slug + '.html', 'description': record['description'], 'image': 'https://sollahms.cl' + hero['localPath'], 'citation': ['https://sollahms.cl' + record['document']['localPath'], record['officialUrl']]}
    page = Template((ROOT/'templates/project-detail.html').read_text()).substitute(title=esc(name), description=esc(record['description']), slug=slug, builder='Inmobiliaria León', location=esc(location), badges='<span>Residencial</span>', hero_class='leon-hero', hero_image=image(hero, hero['caption'], hero=True), social_image='<meta property="og:image" content="https://sollahms.cl' + hero['localPath'] + '"><meta property="og:image:alt" content="' + esc(hero['caption']) + '"><meta name="twitter:card" content="summary_large_image">', structured_data=json.dumps(structured, ensure_ascii=False).replace('<', '\\u003c'), embed_hosts='["www.google.com"]', overview=overview, official_context='', specs=specs, stages='', gallery=gallery, amenities=amenities, tour_navigation='<a href="#planos">Planos</a>' + ('<a href="#recorrido">Recorrido</a>' if tours else ''), tour_section=tours, location_heading=esc(loc['commune']), map=maphtml, sources='', price=price, price_note='<p class="price-note">Consulta disponibilidad y condiciones comerciales vigentes.</p>', official_link='')
    if hero['width'] / hero['height'] < 1.2:
        page = page.replace('class="project-hero leon-hero"', 'class="project-hero leon-hero leon-hero-portrait"', 1)
    page = page.replace('</head>', '<link rel="stylesheet" href="/assets/css/leon.css?v=20261013"></head>', 1).replace('<section id="equipamiento"', plans + '<section id="equipamiento"', 1)
    from project_header_b import apply_header
    project = next(p for p in json.loads((ROOT/'data/proyectos.json').read_text()) if p['slug'] == record['slug'])
    return apply_header(page, project)
