#!/usr/bin/env python3
"""Update sourced facts without replacing the four featured page designs."""
import importlib.util
import json
import re
from pathlib import Path
from urllib.parse import urlencode, urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('details', ROOT / 'scripts/build-project-details.py')
details = importlib.util.module_from_spec(spec)
spec.loader.exec_module(details)
records = json.loads((ROOT / 'data/fichas-proyectos.json').read_text())
projects = {p['slug']: p for p in json.loads((ROOT / 'data/proyectos.json').read_text())}
esc = details.esc

for research in records:
    slug = research['slug']
    if slug not in details.FEATURED:
        continue
    project = projects[slug]
    path = ROOT / (slug + '.html')
    page = path.read_text()
    page = re.sub(r'<!-- verified-featured-start -->.*?<!-- verified-featured-end -->\n?', '', page, flags=re.S)
    updates = research.get('updates', {})
    old = research.get('reviewedOriginal', {})
    features = research.get('verifiedFeatures', {})
    # Replace only the old address, including the historical longer display form.
    if updates.get('direccion'):
        variants = [old.get('direccion')]
        if slug == 'distrito-centro':
            variants.insert(0, "Avenida O'Higgins 1125")
        for address in variants:
            if address and address != updates['direccion']:
                page = page.replace(esc(address), esc(updates['direccion']))
                page = page.replace(address, updates['direccion'])
    field = lambda key: details.field(project, research, key)
    description = f'Conoce {project["nombre"]} de {project["inmobiliaria"]}. Consulta características verificadas, imágenes oficiales, ubicación y disponibilidad en Sollahms.'
    page = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)', lambda match: match[1] + esc(description) + match[2], page)
    surface = field('superficieDesdeM2')
    cells = {
        'Inmobiliaria': esc(project['inmobiliaria']),
        'Comuna / región': esc(', '.join(x for x in [field('comuna'), field('region')] if x)),
        'Tipologías': details.text_value(field('tipologias')),
        'Dormitorios': details.text_value(research.get('specs', {}).get('dormitorios')),
        'Estado': details.text_value(field('estado')),
        'Entrega': details.text_value(field('entrega')),
        'Precio desde': details.uf(field('precioDesdeUF')),
        'Superficie desde': esc(str(surface).replace('.', ',')) + ' m² (tipo por verificar)' if surface else details.PENDING,
        'Edificio': details.text_value(features.get('edificio')),
        'Departamentos': details.text_value(features.get('departamentos')),
        'Equipamiento edificio': details.text_value(features.get('equipamientoEdificio')),
    }
    for label, value in cells.items():
        pattern = r'(<div class="text-\[10px\][^"]*">' + re.escape(label) + r'</div><div class="[^"]*">).*?(</div>)'
        page = re.sub(pattern, lambda match: match[1] + value + match[2], page, flags=re.S)
    if field('descripcionLarga'):
        pattern = r'(<div class="label-blue-print text-primary font-bold">El proyecto</div><h2[^>]*>.*?</h2><p[^>]*>).*?(</p>)'
        page = re.sub(pattern, lambda match: match[1] + esc(field('descripcionLarga')) + match[2], page, count=1, flags=re.S)
    amenities = field('amenities') or []
    spaces = '<div class="space-y-8"><h2 class="label-blue-print text-primary">Espacios y servicios</h2><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">' + ''.join('<div class="bg-surface-container-lowest p-5 shadow-sm text-sm font-bold text-primary">' + esc(value) + '</div>' for value in amenities) + '</div></div>'
    page = re.sub(r'<div class="space-y-8"><h2 class="label-blue-print text-primary">Espacios y servicios</h2><div class="grid[^"]*">.*?</div></div></div>', lambda _: spaces, page, count=1, flags=re.S)
    if 'Equipamiento y terminaciones' in page:
        finishes = features.get('terminaciones')
        content = '<div class="space-y-8"><h2 class="label-blue-print text-primary">Equipamiento y terminaciones</h2><p class="text-secondary">' + (esc(', '.join(finishes)) if finishes else 'Pendiente de verificación en la fuente oficial actual.') + '</p></div>'
        page = re.sub(r'<div class="space-y-8"><h2 class="label-blue-print text-primary">Equipamiento y terminaciones</h2><div class="grid[^"]*">.*?</div></div></div>', lambda _: content, page, count=1, flags=re.S)
    if slug == 'plaza-las-condes':
        page = re.sub(r'Aproximadamente 8 minutos caminando.*?según la ficha comercial\.', 'Consulta la ubicación publicada por la inmobiliaria en el mapa y en la fuente oficial.', page)
    query = field('mapQuery')
    if query:
        embed = 'https://www.google.com/maps?' + urlencode({'output': 'embed', 'q': query})
        link = 'https://www.google.com/maps/search/?' + urlencode({'api': 1, 'query': query})
        replacement = f'<iframe class="w-full shadow-sm" src="{esc(embed)}" height="400" style="border:0" loading="lazy" title="Mapa de {esc(query)}"></iframe><p class="text-secondary"><a href="{esc(link)}" target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a></p><p class="text-secondary text-sm">Mapa de búsqueda de la dirección oficial. Google Maps determina el marcador; confirma el acceso en la fuente original.</p>'
        # Include previous appended links when rerunning; preserve idempotence.
        pattern = r'<iframe\b[^>]*src="https://www.google.com/maps[^>]*></iframe>(?:<p class="text-secondary"><a href="https://www.google.com/maps/search/.*?</p><p class="text-secondary text-sm">.*?</p>)?'
        page = re.sub(pattern, lambda _: replacement, page, count=1, flags=re.S)
    def update_ld(match):
        value = json.loads(match[1])
        if value.get('@type') == 'ApartmentComplex':
            value['address'] = {'@type': 'PostalAddress', 'streetAddress': field('direccion'), 'addressLocality': field('comuna'), 'addressRegion': field('region'), 'addressCountry': 'CL'}
            value['citation'] = research['sourceUrl']
            value['description'] = description
        return '<script type="application/ld+json">\n' + json.dumps(value, ensure_ascii=False, indent=2).replace('<', '\\u003c') + '\n</script>'
    page = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update_ld, page, flags=re.S)
    gallery = '<h2>Galería oficial</h2><div class="featured-gallery">' + ''.join(f'<figure><a href="{esc(i["localPath"])}" target="_blank" rel="noopener noreferrer"><img src="{esc(i["localPath"])}" alt="{esc(i["alt"])}" loading="lazy" width="{i["width"]}" height="{i["height"]}"></a><figcaption><a href="{esc(i["sourceUrl"])}" target="_blank" rel="noopener noreferrer">Fuente oficial · {esc(i["alt"])}</a></figcaption></figure>' for i in research.get('images', []) if i.get('localPath')) + '</div>'
    specs = '<h2>Superficies y distribución</h2><ul>'
    for key in ['utilM2', 'totalM2', 'dormitorios', 'banos']:
        value = research.get('specs', {}).get(key)
        text = details.text_value(value)
        if value and key.endswith('M2'):
            text += ' m²'
        specs += '<li>' + esc(details.LABELS[key]) + ': ' + text + '</li>'
    specs += '</ul>'
    original_models = {parse_qs(urlparse(escaped.replace('&amp;', '&')).query).get('m', [None])[0] for escaped in re.findall(r'src="(https://my\.matterport\.com[^"]*)"', page)}
    tours = '<h2>Recorridos y experiencias oficiales</h2>'
    permitted = {'www.google.com', 'my.matterport.com', 'mpembed.com'}
    for tour in research.get('virtualTours', []):
        model = parse_qs(urlparse(tour['url']).query).get('m', [None])[0]
        if model and model in original_models:
            tours += f'<p><a href="{esc(tour["url"])}" target="_blank" rel="noopener noreferrer">Abrir {esc(tour["title"])} en su experiencia original ↗</a></p>'
            continue
        tours += f'<h3>{esc(tour["title"])}</h3>'
        if tour.get('embedStatus') == 'allowed':
            permitted.add(urlparse(tour['url']).hostname)
            tours += f'<div class="featured-embed"><button type="button" data-embed-src="{esc(tour["url"])}" data-embed-title="{esc(tour["title"])}">Iniciar recorrido interactivo</button></div>'
        tours += f'<p><a href="{esc(tour["url"])}" target="_blank" rel="noopener noreferrer">Abrir recorrido original ↗</a></p>'
    if not research.get('virtualTours'):
        tours += '<p>Recorrido virtual oficial específico pendiente de verificación.</p>'
    for key, label in [('edificio', 'Cantidad de pisos'), ('departamentos', 'Cantidad de departamentos')]:
        verified_count = bool(re.search(r'\d+\s*pisos?', str(features.get(key) or ''), re.I)) if key == 'edificio' else isinstance(features.get(key), int) and features[key] > 0
        if not verified_count and label not in research['pendingFields']:
            research['pendingFields'].append(label)
    audit = '<!-- verified-featured-start --><section class="featured-verification" id="fuentes-verificadas">' + gallery + specs + tours + '<h2>Fuentes y verificación</h2>' + details.source_content(project, research) + '</section><!-- verified-featured-end -->'
    anchor = '</div>\n<aside class="lg:col-span-4">'
    assert anchor in page, slug + ': featured layout anchor missing'
    page = page.replace(anchor, audit + '\n' + anchor, 1)
    if '/assets/css/featured-verification.css' not in page:
        page = page.replace('</head>', '<link rel="stylesheet" href="/assets/css/featured-verification.css">\n<script src="/assets/js/project-embeds.js" defer></script>\n</head>')
    page = re.sub(r'<script type="application/json" id="project-embed-hosts">.*?</script>\n?', '', page, flags=re.S)
    page = page.replace('</head>', '<script type="application/json" id="project-embed-hosts">' + json.dumps(sorted(permitted)) + '</script>\n</head>')
    path.write_text(page)
(ROOT / 'data/fichas-proyectos.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print('Updated only sourced featured facts, official media, maps and verification sections')
