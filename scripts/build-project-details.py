#!/usr/bin/env python3
"""Generate all non-featured static details and an auditable catalogue ledger.

No network and no build dependencies. Run from any directory:
    python3 scripts/build-project-details.py
Research is kept separately from historical catalogue data. Unknown fields never
become a map, a commercial offer, an invented description or an invented tour.
"""
import argparse
import html
import json
import re
from pathlib import Path
from string import Template
from urllib.parse import urlencode, urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}
LABELS = {'direccion': 'Dirección', 'region': 'Región', 'comuna': 'Comuna', 'precioDesdeUF': 'Precio actual en UF', 'tipologias': 'Tipologías disponibles', 'estado': 'Estado', 'entrega': 'Entrega', 'amenities': 'Equipamiento y áreas comunes', 'descripcionLarga': 'Características del proyecto', 'images': 'Fotografías oficiales', 'virtualTours': 'Recorrido virtual oficial', 'utilM2': 'Superficie útil', 'totalM2': 'Superficie total', 'terrenoM2': 'Superficie de terreno', 'dormitorios': 'Dormitorios', 'banos': 'Baños'}
PENDING = '<span class="pending">Pendiente de verificación</span>'

def esc(value):
    return html.escape(str(value), quote=True)

def secure_url(value):
    if not isinstance(value, str):
        return None
    parsed = urlparse(value)
    return value if parsed.scheme == 'https' and parsed.hostname and not parsed.username and not parsed.password else None

def uf(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
        integer, _, decimal = ('%.2f' % value).partition('.')
        result = format(int(integer), ',').replace(',', '.')
        return 'UF ' + result + (',' + decimal.rstrip('0') if decimal != '00' else '')
    return PENDING

def text_value(value):
    if value is None or value == '' or value == []:
        return PENDING
    if isinstance(value, list):
        return '<br>'.join(esc(x) for x in value)
    return esc(value)

def field(project, research, key):
    if key not in research.get('verifiedFields', []):
        return None
    return research.get('updates', {}).get(key, project.get(key))

def pending_fields(project, research):
    fields = [label for key, label in LABELS.items() if key not in {'images', 'virtualTours', 'utilM2', 'totalM2', 'terrenoM2', 'dormitorios', 'banos'} and field(project, research, key) in (None, '', [])]
    specs = research.get('specs', {})
    for key in ['utilM2', 'totalM2', 'dormitorios', 'banos']:
        if project.get('tipoActivo') == 'Terreno' and key in ['utilM2', 'totalM2', 'dormitorios', 'banos']:
            continue
        if project.get('tipoActivo') == 'Comercial' and key == 'dormitorios':
            continue
        if specs.get(key) in (None, ''):
            fields.append(LABELS[key])
    if project.get('tipoActivo') == 'Terreno' and not specs.get('terrenoM2'):
        fields.append(LABELS['terrenoM2'])
    if not research.get('images'):
        fields.append(LABELS['images'])
    if not research.get('virtualTours'):
        fields.append('Existencia de recorrido virtual oficial')
    return list(dict.fromkeys(fields + research.get('pendingFields', [])))

def source_content(project, research):
    url = secure_url(research.get('sourceUrl'))
    date = esc(research.get('checkedAt') or 'Pendiente')
    source = f'<p><a href="{esc(url)}" target="_blank" rel="noopener noreferrer">Consultar la fuente oficial de {esc(project["inmobiliaria"])}</a></p>' if url else '<p>Fuente oficial específica pendiente de identificación.</p>'
    source += f'<p>Última revisión: <time datetime="{date}">{date}</time>. Los precios y la disponibilidad pueden cambiar; confirma las condiciones al consultar.</p>'
    if research.get('sourceNotes'):
        source += f'<p>{esc(research["sourceNotes"])}</p>'
    fields = pending_fields(project, research)
    if fields:
        source += '<details><summary>Datos pendientes de verificación (' + str(len(fields)) + ')</summary><ul>' + ''.join('<li>' + esc(x) + '</li>' for x in fields) + '</ul></details>'
    return source

def render(project, research, template):
    name = project['nombre']
    slug = project['slug']
    builder = project['inmobiliaria']
    images = [i for i in research.get('images', []) if secure_url(i.get('url')) and secure_url(i.get('sourceUrl'))]
    # Prefer local official images after successful download; no stock fallback.
    def image_url(img):
        local = img.get('localPath')
        return local if isinstance(local, str) and local.startswith('/assets/propiedades/catalogo/') and (ROOT / local.lstrip('/')).is_file() else img['url']
    hero = images[0] if images else None
    src = image_url(hero) if hero else None
    location = ', '.join(str(x) for x in [field(project, research, 'comuna'), field(project, research, 'region')] if x) or 'Ubicación pendiente de verificación'
    address = field(project, research, 'direccion')
    overview = field(project, research, 'descripcionLarga')
    if overview:
        overview_html = f'<p class="lead">{esc(overview)}</p>'
    else:
        overview_html = f'<p class="lead">Conoce {esc(name)}, registrado en el catálogo Sollahms por {esc(builder)}.</p><div class="pending-panel"><p>Las características detalladas de este proyecto están pendientes de verificación con la inmobiliaria.</p></div>'
    cells = [('Inmobiliaria', esc(builder)), ('Tipo de activo', esc(project.get('tipoActivo', 'Residencial')))]
    cells += [(LABELS[key], text_value(field(project, research, key))) for key in ['comuna', 'region', 'direccion', 'estado', 'entrega', 'tipologias']]
    published_area = field(project, research, 'superficieDesdeM2')
    if published_area and not research.get('specs', {}).get('utilM2') and not research.get('specs', {}).get('totalM2'):
        cells.append(('Superficie desde (tipo por verificar)', esc(str(published_area).replace('.', ',')) + ' m²'))
    for key in ['utilM2', 'totalM2', 'terrenoM2', 'dormitorios', 'banos']:
        if project.get('tipoActivo') != 'Terreno' and key == 'terrenoM2' and not research.get('specs', {}).get(key):
            continue
        if project.get('tipoActivo') == 'Terreno' and key != 'terrenoM2':
            continue
        if project.get('tipoActivo') == 'Comercial' and key == 'dormitorios':
            continue
        specification = research.get('specs', {}).get(key)
        if specification not in (None, '') and key.endswith('M2') and not re.search(r'm[²2]', str(specification)):
            specification = str(specification) + ' m²'
        cells.append((LABELS[key], text_value(specification)))
    price = uf(field(project, research, 'precioDesdeUF'))
    cells.append(('Precio desde', price))
    specs = ''.join(f'<div><dt>{esc(label)}</dt><dd>{value}</dd></div>' for label, value in cells)
    gallery = '<div class="gallery-grid">' + ''.join(f'<figure><a href="{esc(image_url(i))}" target="_blank" rel="noopener noreferrer"><img src="{esc(image_url(i))}" alt="{esc(i.get("alt") or name)}" loading="lazy" decoding="async"></a><figcaption>{esc(i.get("alt") or name)} · <a href="{esc(i["sourceUrl"])}" target="_blank" rel="noopener noreferrer">Fuente oficial</a></figcaption></figure>' for i in images[:6]) + '</div>' if images else '<div class="pending-panel"><p>Fotografías oficiales pendientes de verificación. Puedes solicitar material del proyecto al consultar.</p></div>'
    amenities = field(project, research, 'amenities')
    amenities_html = '<ul class="amenity-list">' + ''.join(f'<li>{esc(x)}</li>' for x in amenities) + '</ul>' if isinstance(amenities, list) and amenities else '<div class="pending-panel"><p>Equipamiento y áreas comunes pendientes de verificación.</p></div>'
    tours = []
    for tour in research.get('virtualTours', []):
        url = secure_url(tour.get('url'))
        source = secure_url(tour.get('sourceUrl'))
        if not url or not source:
            continue
        title = tour.get('title') or f'Recorrido de {name}'
        parsed = urlparse(url)
        can_embed = tour.get('embedStatus') == 'allowed' or parsed.hostname in ['my.matterport.com', 'mpembed.com', 'www.youtube.com', 'player.vimeo.com']
        embed = f'<div class="embed-shell"><button type="button" class="button button-gold embed-loader" data-embed-src="{esc(url)}" data-embed-title="{esc(title)}">Iniciar recorrido interactivo</button></div>' if can_embed else f'<p><a class="button button-outline" href="{esc(url)}" target="_blank" rel="noopener noreferrer">Abrir experiencia virtual oficial ↗</a></p>'
        tours.append(f'<article class="tour-card"><h3>{esc(title)}</h3>{embed}<div class="embed-caption"><a href="{esc(url)}" target="_blank" rel="noopener noreferrer">Abrir recorrido original ↗</a><a href="{esc(source)}" target="_blank" rel="noopener noreferrer">Fuente oficial</a></div></article>')
    tours_html = ''.join(tours) or '<div class="pending-panel"><p>No se ha verificado un recorrido virtual oficial para este proyecto. Su disponibilidad está pendiente de confirmación.</p></div>'
    query = ', '.join(str(x) for x in [address, field(project, research, 'comuna'), field(project, research, 'region'), 'Chile'] if x)
    # An address requires both official address and official commune. No approximate coordinates.
    mapped = bool(address and field(project, research, 'comuna'))
    if mapped:
        maps_link = 'https://www.google.com/maps/search/?' + urlencode({'api': 1, 'query': query})
        embed_link = 'https://www.google.com/maps?' + urlencode({'output': 'embed', 'q': query})
        map_html = f'<p class="lead">{esc(query)}</p><div class="embed-shell map-shell"><button type="button" class="button button-gold embed-loader" data-embed-src="{esc(embed_link)}" data-embed-title="Mapa de {esc(query)}">Mostrar mapa interactivo</button></div><a class="button button-outline" href="{esc(maps_link)}" target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a><p class="map-note">El mapa busca la dirección publicada por la inmobiliaria. La ubicación del marcador la determina Google Maps; confirma el acceso exacto en la fuente oficial.</p><noscript><p>El enlace a Google Maps permite consultar la ubicación sin JavaScript.</p></noscript>'
    else:
        if address:
            map_html = f'<p class="lead">{esc(address)}</p><div class="pending-panel"><p>La dirección está publicada en la fuente oficial. Falta confirmar la comuna administrativa para incorporar un mapa sin ambigüedad.</p></div>'
        else:
            map_html = '<div class="pending-panel"><p>Dirección exacta pendiente de verificación. Incorporaremos el mapa cuando la ubicación del proyecto se confirme en una fuente oficial.</p></div>'
    source_url = secure_url(research.get('sourceUrl'))
    official_link = f'<a class="official-link" href="{esc(source_url)}" target="_blank" rel="noopener noreferrer">Ver fuente oficial ↗</a>' if source_url else ''
    badges = f'<span>{esc(project.get("tipoActivo", "Residencial"))}</span>'
    if field(project, research, 'estado'):
        badges += f'<span>{esc(field(project, research, "estado"))}</span>'
    desc = f'Conoce {name} de {builder}. Consulta características verificadas, imágenes oficiales, ubicación y disponibilidad en Sollahms.'
    structured = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': name + ' | Sollahms', 'url': f'https://sollahms.cl/{slug}.html', 'description': desc, 'breadcrumb': {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://sollahms.cl/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Proyectos', 'item': 'https://sollahms.cl/proyectos.html'}, {'@type': 'ListItem', 'position': 3, 'name': name, 'item': f'https://sollahms.cl/{slug}.html'}]}}
    if source_url:
        structured['citation'] = source_url
    if src:
        structured['image'] = f'https://sollahms.cl{src}' if src.startswith('/') else src
    # Escape script delimiters as well as all HTML text and URL attributes.
    json_ld = json.dumps(structured, ensure_ascii=False).replace('<', '\\u003c')
    social_image = f'<meta property="og:image" content="{esc(structured["image"])}"><meta property="og:image:alt" content="{esc(hero.get("alt") or name)}"><meta name="twitter:card" content="summary_large_image">' if src else '<meta name="twitter:card" content="summary">'
    stages = ''
    if 'etapas' in research.get('verifiedFields', []) and project.get('etapas'):
        stages = '<h3>Etapas del proyecto</h3><ul>' + ''.join('<li>' + esc(s.get('nombre', '')) + ': ' + esc(s.get('estado', 'Pendiente')) + '</li>' for s in project['etapas']) + '</ul>'
    page = template.substitute(title=esc(name), description=esc(desc), slug=slug, builder=esc(builder), location=esc(location), badges=badges, hero_class='' if hero else 'hero-without-image', hero_image=f'<img class="hero-image" src="{esc(src)}" alt="{esc(hero.get("alt") or name)}" fetchpriority="high" decoding="async">' if hero else '', social_image=social_image, structured_data=json_ld, overview=overview_html, specs=specs, stages=stages, gallery=gallery, amenities=amenities_html, tours=tours_html, location_heading=esc(field(project, research, 'comuna') or 'Dirección por verificar'), map=map_html, sources=source_content(project, research), price=price, price_note=f'<p class="price-note">Precio publicado en la fuente oficial, revisado el {esc(research.get("checkedAt", ""))}. Sujeto a disponibilidad y condiciones de la inmobiliaria.</p>' if price != PENDING else '', official_link=official_link)
    return page, mapped, len(tours)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', help='Comma-separated builders to regenerate; ledger always covers entire catalogue')
    args = parser.parse_args()
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    records = json.loads((ROOT / 'data/fichas-proyectos.json').read_text())
    by_slug = {r['slug']: r for r in records}
    assert len(by_slug) == len(records), 'Duplicate research slug'
    assert set(by_slug) == {p['slug'] for p in projects}, 'Every catalogue project needs a research record'
    template = Template((ROOT / 'templates/project-detail.html').read_text())
    selected = set(args.batch.split(',')) if args.batch else None
    ledger = []
    for project in projects:
        slug = project['slug']
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug), 'Unsafe slug'
        research = by_slug[slug]
        page, mapped, tours = render(project, research, template)
        if slug not in FEATURED and (selected is None or project['inmobiliaria'] in selected):
            (ROOT / (slug + '.html')).write_text(page)
        project['detalleUrl'] = '/' + slug + '.html'
        actual = (ROOT / (slug + '.html')).read_text() if (ROOT / (slug + '.html')).exists() else ''
        matterport = any(t.get('provider') == 'Matterport' for t in research.get('virtualTours', [])) if slug not in FEATURED else bool('my.matterport.com' in actual or 'mpembed.com' in actual)
        if slug in FEATURED:
            mapped = 'www.google.com/maps' in actual
        pending = pending_fields(project, research)
        ledger.append({'slug': slug, 'nombre': project['nombre'], 'inmobiliaria': project['inmobiliaria'], 'detalleUrl': project['detalleUrl'], 'fichaDesarrollada': bool(actual), 'destacadaExistente': slug in FEATURED, 'estadoFuente': research.get('sourceStatus', 'research_pending'), 'fuente': research.get('sourceUrl'), 'fechaRevision': research.get('checkedAt'), 'mapa': mapped, 'matterport': matterport, 'recorridosOficiales': tours, 'pendientes': pending, 'controlCalidad': 'pendiente' if pending else 'datos_verificados'})
    (ROOT / 'data/proyectos.json').write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'data/registro-fichas.json').write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n')
    # Keep the existing global destinations and append all details exactly once.
    urls = ['/', '/proyectos.html', '/agenda-asesoria.html', '/contacto.html', '/privacidad.html'] + [p['detalleUrl'] for p in projects]
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>https://sollahms.cl' + esc(url) + '</loc></url>\n' for url in dict.fromkeys(urls)) + '</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(sitemap)
    def cell(value):
        return str(value or '—').replace('|', '\\|').replace('\n', ' ')
    developed = sum(r['fichaDesarrollada'] for r in ledger)
    maps = sum(r['mapa'] for r in ledger)
    matterports = sum(r['matterport'] for r in ledger)
    unverified = sum(bool(r['pendientes']) for r in ledger)
    report = f'# Registro de fichas Sollahms — 2026-10-09\n\nRama: `codex/fichas-proyectos-completas`. Sin merge ni despliegue de producción.\n\n- Catálogo real: {len(projects)} proyectos.\n- Fichas desarrolladas: {developed} ({len(FEATURED)} destacadas preexistentes, {developed-len(FEATURED)} nuevas).\n- Fichas por desarrollar: {len(projects)-developed}.\n- Proyectos con Matterport integrado: {matterports}.\n- Proyectos con apartado de mapa: {maps}.\n- Proyectos con al menos un dato pendiente: {unverified}.\n\nUna ficha desarrollada no implica que todos sus datos comerciales estén verificados. Las fuentes pueden omitir campos, restringir acceso o agrupar varias etapas. `controlCalidad` registra esta diferencia; ningún dato faltante se inventa. Las cuatro destacadas conservan su estructura. Los mapas nuevos usan direcciones oficiales como búsqueda, sin coordenadas estimadas; el marcador lo determina Google. Los recorridos se cargan a petición y tienen un enlace al original.\n\n## Inventario completo\n\n| Proyecto / ficha | Inmobiliaria | Fuente oficial | Estado de fuente | Mapa | Matterport | Pendientes |\n| --- | --- | --- | --- | --- | --- | --- |\n'
    for r in ledger:
        source = f'[Oficial]({r["fuente"]})' if secure_url(r.get('fuente')) else 'Por identificar'
        report += f'| [{cell(r["nombre"])}](../{r["slug"]}.html) | {cell(r["inmobiliaria"])} | {source} | {r["estadoFuente"]} | {"Sí" if r["mapa"] else "Pendiente"} | {"Sí" if r["matterport"] else "No verificado"} | {cell(", ".join(r["pendientes"]))} |\n'
    report += '\n## Continuación reproducible\n\nEditar `data/fichas-proyectos.json` con nuevas evidencias, incorporando campos en `verifiedFields` únicamente cuando exista respaldo oficial. Actualizar `data/proyectos.json` solo con valores respaldados. Ejecutar `python3 scripts/build-project-details.py` y `python3 tests/validate-project-details.py`. Para un lote: `python3 scripts/build-project-details.py --batch Maestra,Ecasa`. El registro y sitemap siempre cubren todo el catálogo. Revisar `docs/verificacion-fichas.md` para pruebas de navegador y límites.\n'
    (ROOT / 'docs/registro-fichas-proyectos.md').write_text(report)
    print(json.dumps({'total': len(projects), 'developed': developed, 'maps': maps, 'matterport': matterports, 'withPendingData': unverified}, ensure_ascii=False))

if __name__ == '__main__':
    main()
