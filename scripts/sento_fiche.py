"""Sento presentation, using the existing Sollahms and featured Plaza designs."""
import html
import json
import re
from pathlib import Path
from string import Template
from urllib.parse import urlencode, urlparse
from project_embed_policy import map_markup, iframe_markup

ROOT = Path(__file__).resolve().parents[1]
def esc(value): return html.escape(str(value), quote=True)
def number(value): return f'{value:,.2f}'.replace(',', '_').replace('.', ',').replace('_', '.')
def typology(model):
    if model.get('typologyLabel'): return model['typologyLabel']
    beds, baths = model.get('bedrooms'), model.get('bathrooms')
    name = 'Estudio' if beds == 0 else (f'{beds} dormitorio' + ('s' if beds != 1 else '')) if beds is not None else 'Tipología según plano'
    return name + (f' · {baths} baño' + ('s' if baths != 1 else '') if baths is not None else '')
def label(row):
    text = row if isinstance(row, str) else row.get('label', row.get('caption', ''))
    return text.replace('(referencia del brochure)', '(aprox.)')
def facts(rows): return '<ul class="amenity-list">' + ''.join('<li>' + esc(label(row)) + '</li>' for row in rows) + '</ul>'
def srcset(asset):
    variants = asset.get('variants', [])
    if isinstance(variants, dict): variants = list(variants.values())
    variants = [v for v in variants if isinstance(v, dict) and v.get('localPath') and v.get('width')]
    variants += [asset]
    unique = {v['width']: v for v in variants}
    return ', '.join(esc(v['localPath']) + ' ' + str(w) + 'w' for w, v in sorted(unique.items()))
def image(asset, caption, hero=False):
    native_style = 'style="max-width:' + str(asset['width']) + 'px;margin-inline:auto" ' if asset.get('kind') == 'plan' else ''
    return ('<img ' + native_style + ('class="hero-image" ' if hero else '') + 'src="' + esc(asset['localPath']) + '" srcset="' + srcset(asset) + '" sizes="' + ('100vw' if hero else '(max-width: 600px) 90vw, (max-width: 900px) 45vw, 420px') + '" alt="' + esc(caption) + '" width="' + str(asset['width']) + '" height="' + str(asset['height']) + '" ' + ('fetchpriority="high"' if hero else 'loading="lazy"') + ' decoding="async">')
def caption(asset, record=None):
    text = asset.get('displayCaption') or asset.get('caption') or asset.get('label') or asset.get('alt')
    text = re.sub(r'\s*·\s*imagen referencial del brochure\s*$', '', text or '', flags=re.I)
    text = text.replace(', imagen oficial ambientada', '')
    if record and asset.get('kind') == 'facade': return 'Fachada de ' + record['name']
    return text

def model_code(model):
    return model.get('code') or re.sub(r'^Departamento\s+tipo\s+', '', model['label'], flags=re.I)

def commercial_typology(model):
    if model.get('displayTypology'): return model['displayTypology'].replace(' · ', ' / ')
    beds, baths = model.get('bedrooms'), model.get('bathrooms')
    text = 'Estudio' if beds == 0 or model.get('typologyLabel', '').startswith('Estudio') else (f'{beds} dormitorio' + ('s' if beds != 1 else '')) if beds is not None else ''
    if baths is not None: text += (' / ' if text else '') + f'{baths} baño' + ('s' if baths != 1 else '')
    return text

def commercial_areas(model):
    # Missing values and conflicting versions stay in the internal audit.
    # Absence of a terrace value never establishes that there is no terrace.
    return [area for area in model['areas'] if area.get('publishable', True) and area.get('valueM2') is not None and not (area.get('kind') == 'terrace' and area['valueM2'] == 0)]

def consumer_notes(record, model):
    if model.get('consumerNotes') is not None: return model['consumerNotes']
    code = model_code(model)
    if record['slug'] == 'mirador-la-florida' and code == 'A4':
        return ['La imagen incluye la marca «Agotado». Consulta la disponibilidad actual de esta tipología.']
    if record['slug'] == 'angamos' and code in ['A2', 'A4']:
        return ['La imagen incluye la marca «Reservado». Consulta la distribución y disponibilidad de esta tipología.']
    if record['slug'] == 'angamos' and code == 'C6':
        return ['Confirma las superficies de la unidad antes de reservar.']
    if record['slug'] == 'san-ignacio' and code in ['A3', 'D1']:
        return ['Las superficies pueden variar según la versión de la unidad. Confírmalas al consultar.']
    return []

def commercial_map_note(record):
    if not record['location'].get('mapNote'): return ''
    if record['slug'] == 'mirador-la-florida':
        return 'Ubicación referencial en Calle Eugenia. Confirma la dirección y el acceso exactos al consultar.'
    return 'Confirma la numeración y el acceso exacto de la unidad al consultar.'

def commercial_price_note(record):
    evidence = record['commercial'].get('evidence', {})
    if record['commercial'].get('precioDesdeUF') is None:
        return 'Proyecto vendido. Consulta otras alternativas disponibles.' if evidence.get('vendido100Porcentaje') else 'Consulta disponibilidad y condiciones comerciales.'
    unit = evidence.get('departamentoPrecio')
    text = ('Precio de referencia para departamento ' + str(unit) + (' (' + evidence['tipologiaPrecio'] + ')' if evidence.get('tipologiaPrecio') else '') + '. ') if unit else ''
    if evidence.get('descuentoAplicadoPorcentaje') is not None:
        text += 'Incluye ' + str(evidence['descuentoAplicadoPorcentaje']) + '% de descuento. '
    return text + 'Excluye estacionamiento y bodega. Sujeto a disponibilidad; confirma la cotización vigente.'

def blocks(record):
    name, location = record['name'], record['location']
    hero = next(i for i in record['images'] if i['localPath'] == record['cover'])
    overview = '<p class="lead">' + esc(record['description']) + '</p>'
    for key, title in [('architecture', 'Arquitectura'), ('connectivity', 'Entorno y conectividad')]:
        if record.get(key): overview += '<h3>' + title + '</h3>' + facts(record[key])
    cells = [('Inmobiliaria', 'Sento'), ('Dirección publicada', location['address']), ('Comuna', location['commune'])]
    cells += [('Tipologías', ', '.join(dict.fromkeys(commercial_typology(m) for m in record['models'] if commercial_typology(m))))]
    for key, title in [('estado', 'Estado comercial'), ('entrega', 'Entrega')]:
        if record['commercial'].get(key): cells.append((title, record['commercial'][key]))
    specs = ''.join('<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>' for k, v in cells)
    gallery = '<p>Fotografías y renders referenciales del proyecto. Selecciona una imagen para ampliarla.</p>'
    if record['slug'] == 'angamos': gallery += '<p class="sento-consumer-note">El mobiliario y la decoración del departamento piloto son referenciales. Consulta el equipamiento incluido en tu unidad.</p>'
    kinds = [('facade', 'Fachada'), ('common', 'Áreas comunes'), ('interior', 'Interiores')]
    claimed = set()
    for kind, title in kinds + [('other', 'Otros espacios del proyecto')]:
        assets = [i for i in record['images'] if (i.get('kind') == kind if kind != 'other' else i['localPath'] not in claimed)]
        if not assets: continue
        gallery += '<h3>' + title + '</h3><div class="gallery-grid">'
        for asset in assets:
            claimed.add(asset['localPath'])
            gallery += '<figure><a href="' + esc(asset.get('enlargePath', asset['localPath'])) + '" target="_blank" rel="noopener noreferrer" aria-label="Ampliar ' + esc(caption(asset, record)) + '">' + image(asset, caption(asset, record)) + '</a><figcaption>' + esc(caption(asset, record)) + '</figcaption></figure>'
        gallery += '</div>'
    plans = '<section id="planos" class="detail-section"><p class="eyebrow">Diseño y distribución</p><h2>Tipologías, planos y superficies</h2><p class="sento-consumer-note">Imágenes y superficies referenciales. Confirma la distribución, las medidas y la disponibilidad de la unidad al consultar.</p><div class="sento-models">'
    for model in record['models']:
        plan = model['plan']
        code, distribution = model_code(model), commercial_typology(model)
        heading = 'Tipología ' + code + (' — ' + distribution if distribution else '')
        plans += '<article class="sento-model" data-model-code="' + esc(code) + '"><h3>' + esc(heading) + '</h3><a href="' + esc(plan['localPath']) + '" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano ' + esc(code) + '">' + image(plan, 'Plano de tipología ' + code + ' de ' + name).replace('(max-width: 600px) 90vw, (max-width: 900px) 45vw, 420px', '(max-width: 900px) 90vw, 820px') + '</a><dl class="sento-areas">'
        for area in commercial_areas(model):
            total = area.get('kind') == 'total' if area.get('kind') else area['label'].lower().startswith('superficie total')
            value = number(area['valueM2']) + ' m²'
            plans += '<div' + (' class="sento-area-total"' if total else '') + '><dt>' + esc(area.get('displayLabel', area['label'])) + '</dt><dd>' + esc(value) + '</dd></div>'
        plans += '</dl>'
        for note in consumer_notes(record, model): plans += '<p class="sento-consumer-note">' + esc(note) + '</p>'
        plans += '</article>'
    plans += '</div></section>'
    amenities = facts(record['amenities'])
    if record.get('finishes'): amenities += '<h3>Terminaciones</h3>' + facts(record['finishes'])
    tours = ''
    hosts = {'www.google.com'}
    for tour in record.get('virtualTours', []):
        title = tour.get('title', 'Recorrido virtual oficial')
        url = tour['url']
        if tour.get('embedStatus') == 'allowed':
            host = urlparse(url).hostname; hosts.add(host)
            media = iframe_markup(url, title, permitted_hosts={host})
        else: media = '<a class="button button-outline" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Abrir recorrido oficial ↗</a>'
        tours += '<article class="tour-card"><h3>' + esc(title) + '</h3>' + media + '</article>'
    if tours: tours = '<section id="recorrido" class="detail-section"><p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>' + tours + '</section>'
    query = ', '.join([location['address'], location['commune'], location.get('region', 'Región Metropolitana'), 'Chile'])
    maphtml = '<p>' + esc(query) + '</p>' + map_markup('https://www.google.com/maps?' + urlencode({'q': query, 'output': 'embed'}), 'Mapa de ' + name)
    if commercial_map_note(record): maphtml += '<p class="map-note">' + esc(commercial_map_note(record)) + '</p>'
    value = record['commercial'].get('precioDesdeUF')
    price = 'UF ' + f'{value:,}'.replace(',', '.') if value else 'Consultar precio'
    note = commercial_price_note(record)
    price_note = '<p class="price-note">' + esc(note) + '</p>'
    return dict(hero=hero, overview=overview, specs=specs, gallery=gallery, plans=plans, amenities=amenities, tours=tours, hosts=sorted(hosts), maphtml=maphtml, price=price, price_note=price_note)

def render(record):
    b = blocks(record)
    name, slug = record['name'], record['slug']
    location = record['location']['commune'] + ', Región Metropolitana'
    badges = '<span>Residencial</span>' + ('<span>' + esc(record['commercial']['estado']) + '</span>' if record['commercial'].get('estado') else '')
    nav = '<a href="#planos">Planos</a>' + ('<a href="#recorrido">Recorrido virtual</a>' if b['tours'] else '')
    structured = {'@context': 'https://schema.org', '@type': 'ApartmentComplex', 'name': name, 'url': 'https://sollahms.cl/' + slug + '.html', 'description': record['description'], 'image': 'https://sollahms.cl' + b['hero']['localPath'], 'citation': record['officialUrl']}
    page = Template((ROOT/'templates/project-detail.html').read_text()).substitute(title=esc(name), description=esc(record['description']), slug=slug, builder='Sento', location=esc(location), badges=badges, hero_class='sento-hero', hero_image=image(b['hero'], caption(b['hero'], record), True), social_image='<meta property="og:image" content="https://sollahms.cl' + b['hero']['localPath'] + '"><meta property="og:image:alt" content="' + esc(caption(b['hero'], record)) + '"><meta name="twitter:card" content="summary_large_image">', structured_data=json.dumps(structured, ensure_ascii=False).replace('<', '\\u003c'), embed_hosts=json.dumps(b['hosts']), overview=b['overview'], official_context='', specs=b['specs'], stages='', gallery=b['gallery'], amenities=b['amenities'], tour_navigation=nav, tour_section=b['tours'], location_heading=esc(record['location']['commune']), map=b['maphtml'], sources='', price=b['price'], price_note=b['price_note'], official_link='')
    page = page.replace('<section id="equipamiento"', b['plans'] + '<section id="equipamiento"', 1).replace('<h2>Galería oficial</h2>', '<h2>Galería</h2>')
    if slug == 'plaza-las-condes': page = render_featured(record, b, nav)
    page = page.replace('características verificadas', 'características')
    page = page.replace('</head>', '<link rel="stylesheet" href="/assets/css/sento.css?v=20261014"></head>', 1)
    return page

def render_featured(record, b, nav):
    page = (ROOT/'templates/sento-plaza-las-condes.html').read_text()
    page = page.replace('/assets/propiedades/plaza-las-condes-principal.webp', b['hero']['localPath'])
    page = page.replace('Vista principal del proyecto Plaza Las Condes en Avenida Las Condes', esc(caption(b['hero'], record)))
    for key in ['width', 'height']:
        page = re.sub(r'(<meta property="og:image:' + key + r'" content=")[^"]+', lambda match: match[1] + str(b['hero'][key]), page)
    page = re.sub(r'(<meta[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")[^"]+', r'\g<1>https://sollahms.cl' + b['hero']['localPath'], page)
    hero = image(b['hero'], caption(b['hero'], record), True).replace('class="hero-image"', 'class="absolute inset-0 w-full h-full object-cover property-hero-image"')
    sections = ''
    for section_id, title, body in [('proyecto', record['name'], b['overview']), ('caracteristicas', 'Características', '<dl class="spec-grid">' + b['specs'] + '</dl>'), ('galeria', 'Galería', b['gallery']), ('equipamiento', 'Equipamiento y terminaciones', b['amenities'])]:
        sections += '<section id="' + section_id + '" class="detail-section"><h2>' + title + '</h2>' + body + '</section>'
        if section_id == 'galeria': sections += b['plans']
    sections += b['tours'] + '<section id="ubicacion" class="detail-section"><h2>Ubicación</h2>' + b['maphtml'] + '</section>'
    side = '<aside class="lg:col-span-4"><div class="sticky top-32 bg-white p-8 md:p-12 shadow-2xl border-t-4 border-primary space-y-6"><div class="label-blue-print text-primary">Sento</div><h2 class="text-2xl font-headline font-extrabold text-primary">Plaza Las Condes</h2><p>' + esc(record['location']['address']) + ', Las Condes</p><div class="price-block"><span class="price-label">Precio desde</span><strong>' + b['price'] + '</strong>' + b['price_note'] + '</div>'
    for target, title in [('contacto', 'Consultar proyecto'), ('agenda-asesoria', 'Agendar Asesoría'), ('comparador-hipotecario', 'Simular crédito hipotecario')]: side += '<a class="sento-featured-button" href="/' + target + '.html?proyecto=plaza-las-condes">' + title + '</a>'
    side += '</div></aside>'
    main = '<main id="contenido-principal" class="pt-20 sento-featured"><section class="relative h-[620px] w-full overflow-hidden">' + hero + '<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div><div class="absolute bottom-12 left-6 md:left-12 max-w-4xl"><div class="label-blue-print text-tertiary-fixed mb-4">Sento</div><h1 class="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">Plaza Las Condes</h1><p class="text-lg text-white">' + esc(record['location']['address']) + ', Las Condes</p></div></section><nav class="sento-featured-nav" aria-label="Secciones del proyecto"><a href="#proyecto">El proyecto</a><a href="#caracteristicas">Características</a><a href="#galeria">Galería</a>' + nav + '<a href="#ubicacion">Ubicación</a></nav><section class="px-6 md:px-12 py-20 max-w-screen-2xl mx-auto"><div class="grid grid-cols-1 lg:grid-cols-12 gap-12"><div class="lg:col-span-8 space-y-16">' + sections + '</div>' + side + '</div></section></main>'
    return re.sub(r'<main\b[\s\S]*?</main>', lambda _: main, page, count=1)
