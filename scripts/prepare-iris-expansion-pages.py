#!/usr/bin/env python3
"Create only the 21 newly authorized pages; never run legacy fiche generators."
from pathlib import Path
import datetime
import hashlib
import html
import json
import math
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/catalog-expansion-iris-20261118.json'
MARKER = 'data-catalog-expansion="iris-20261118"'

def esc(value):
    return html.escape(str(value if value is not None else ''), quote=True)

def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    return value

def amount(value):
    text = f'{value:,.2f}'.rstrip('0').rstrip('.')
    return text.replace(',', '|').replace('.', ',').replace('|', '.')

def date_label(value):
    if not value:
        return 'fecha documental no informada'
    try:
        day = datetime.date.fromisoformat(value[:10])
        return day.strftime('%d/%m/%Y')
    except (ValueError, TypeError):
        return 'fecha por confirmar'

def ref_price(ref):
    values = ref.get('attributes', ref)
    for key in ['priceUF', 'finalPriceUF', 'listPriceUF']:
        value = number(values.get(key, ref.get(key)))
        if value is not None and value > 0:
            return value
    return None

def ref_summary(ref):
    ref = ref.get('attributes', ref)
    parts = []
    for key, label in [('bedrooms', 'dormitorios'), ('bathrooms', 'baños')]:
        value = number(ref.get(key))
        if value is not None:
            parts.append(f'{amount(value)} {label}')
    for key, label in [('usefulM2', 'útiles'), ('totalM2', 'totales'), ('internalM2', 'Internos'), ('terraceM2', 'de terraza')]:
        value = number(ref.get(key))
        if value is not None:
            parts.append(f'{amount(value)} m² {label}')
    return ' · '.join(parts)

def page(project, icons):
    identity = project['identity']
    source = project['source']
    name, developer, slug = identity['name'], identity['developer'], project['slug']
    url = source['projectUrl']
    assert re.fullmatch(r'https://iris\.yapo\.cl/proyecto/\d+\?operation=Venta', url)
    media = project['media']
    cover = media.get('coverPath')
    alt = media.get('coverAlt') or f'Vista del proyecto {name} publicada en Iris.'
    owners = project.get('ownerReferences', [])
    units = project.get('exactUnitReferences', [])
    priced_owners = [ref for ref in owners if ref_price(ref) is not None]
    if priced_owners:
        chosen = min(priced_owners, key=ref_price)
        price = ref_price(chosen)
        price_source = 'Precio informado a Sollahms'
        price_context = chosen.get('label') or ref_summary(chosen) or 'Otros atributos por confirmar'
        price_date = date_label(chosen.get('sourceContextDate') or chosen.get('sourceDocumentDate'))
        note = f'Registro de antecedentes del propietario: {price_date}. Confirma valor y condiciones al consultar.'
    else:
        priced_units = [ref for ref in units if ref_price(ref) is not None]
        chosen = min(priced_units, key=ref_price) if priced_units else project['externalIris']
        price = ref_price(chosen) if priced_units else number(chosen.get('projectFromPriceUF'))
        price_source = 'Precio final de referencia Iris' if priced_units else 'Precio desde de referencia Iris'
        price_context = ref_summary(chosen) if priced_units else ''
        price_date = date_label(chosen.get('observedAtUTC'))
        note = f'Consultado el {price_date}. Es una referencia externa, no una cotización de Sollahms ni stock confirmado.'
    price_text = 'UF ' + amount(price) if price is not None else 'Consultar precio'
    price_context_html = f'<p class="price-note">Referencia: {esc(price_context)}</p>' if price_context else ''
    typology = project['headerBedroomProfile']['literal'] or 'Por confirmar'
    delivery = project['projectFacts'].get('deliveryLiteral') or 'Por confirmar'
    state = project['projectFacts'].get('state') or 'Por confirmar'
    type_label = {'casa':'Casa', 'departamento':'Departamento'}.get(identity['propertyType'], 'Por confirmar')
    visual = f'<figure class="ci-visual"><span class="s-parallax-frame"><img class="ci-image" src="{esc(cover)}" alt="{esc(alt)}" decoding="async" loading="eager" fetchpriority="high"></span></figure>' if cover else f'<div class="ci-visual ci-no-image"><p>{esc(name)}</p></div>'
    logo = f'<img src="{esc(media["logoPath"])}" alt="{esc(developer)}" loading="lazy" decoding="async">' if media.get('logoPath') else ''
    summary_rows = [('Tipo de propiedad', type_label), ('Tipologías informadas', typology), ('Entrega informada', delivery), ('Estado comercial', state)]
    for key, label in [('bathrooms','Baños en referencia consultada'), ('usefulM2','Útil de referencia consultada'), ('totalM2','Total de referencia consultada'), ('internalM2','Internos de referencia consultada'), ('terraceM2','Terraza de referencia consultada')]:
        values = sorted({ref.get('attributes', ref)[key] for ref in units if number(ref.get('attributes', ref).get(key)) is not None})
        value = ' · '.join(amount(v) + (' m²' if key.endswith('M2') else '') for v in values) if values else 'Por confirmar'
        summary_rows.append((label, value))
    surface = project['unclassifiedSurfaceSummary'].get('literal')
    if surface:
        summary_rows.append(('Superficie general Iris, clasificación por confirmar', surface))
    facts = ''.join(f'<div><dt>{esc(label)}</dt><dd>{esc(value)}</dd></div>' for label, value in summary_rows)
    amenity_items = project['commonAmenities'].get('descriptors', [])
    amenity_html = ''
    for item in amenity_items:
        icon, label = item.get('icon'), item.get('label')
        if icon not in icons or not label:
            continue
        amenity_html += f'<li class="am-item" data-amenity-icon="{esc(icon)}"><svg class="am-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icons[icon]}</svg><span class="am-copy"><span class="am-label">{esc(label)}</span></span></li>'
    if not amenity_html:
        amenity_html = ''.join(f'<li>{esc(label)}</li>' for label in project['commonAmenities'].get('literals', []) if len(label) < 55)
        amenities = f'<ul class="expansion-source-list">{amenity_html}</ul>'
    else:
        amenities = f'<ul class="am-grid">{amenity_html}</ul>'
    refs = []
    for ref in owners:
        value = ref_price(ref)
        if value is not None:
            refs.append(f'<li><strong>{esc(ref.get("label") or "Referencia del propietario")}: UF {amount(value)}</strong><p>Antecedente del propietario, registro del {esc(date_label(ref.get("sourceContextDate")))}.</p><p>Sin asociación acreditada con baños o superficies de otra referencia.</p></li>')
    for ref in units:
        value, description = ref_price(ref), ref_summary(ref)
        if value is not None:
            refs.append(f'<li><strong>Precio final de referencia Iris: UF {amount(value)}</strong><p>{esc(description or "Atributos por confirmar")}</p><p>Consultado el {esc(date_label(ref.get("observedAtUTC")))}. No acredita disponibilidad ni aplicación a otras unidades.</p></li>')
    references = '<details class="pj-disclosure"><summary>Referencias de precio y características</summary><ul class="expansion-ref-list">' + ''.join(refs) + '</ul></details>' if refs else ''
    gallery_link = '<a href="#galeria">Galería</a>' if cover else ''
    gallery = f'<section class="detail-section pj-block" id="galeria"><p class="eyebrow">El proyecto</p><h2>Galería</h2><div class="gallery-grid"><figure><a href="{esc(cover)}" target="_blank" rel="noopener"><img src="{esc(cover)}" alt="{esc(alt)}" loading="lazy" decoding="async"></a></figure></div></section>' if cover else ''
    return f'''<!doctype html>
<html lang="es" data-project-header="b" {MARKER}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(name)} | Sollahms</title>
<meta name="description" content="Conoce {esc(name)}, proyecto de {esc(developer)} en {esc(identity['commune'])}. Consulta sus antecedentes comerciales y fuente de información.">
<link rel="canonical" href="https://sollahms.cl/{esc(slug)}.html"><link rel="icon" type="image/svg+xml" href="/assets/branding/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/project-detail.css"><link rel="stylesheet" href="/assets/css/project-header-b.css"><link rel="stylesheet" href="/assets/css/project-journey.css"><link rel="stylesheet" href="/assets/css/project-navigation.css"><link rel="stylesheet" href="/assets/css/project-amenities.css"><link rel="stylesheet" href="/assets/css/image-parallax.css"><link rel="stylesheet" href="/assets/css/sollahms-brand.css"><link rel="stylesheet" href="/assets/css/catalog-expansion.css"><link rel="stylesheet" href="/assets/css/sollahms-theme.css">
<script src="/assets/js/project-detail.js" defer></script><script src="/assets/js/scroll-presence.js" defer></script><script src="/assets/js/image-parallax.js" defer></script></head>
<body class="expansion-project"><a class="skip-link" href="#contenido-principal">Saltar al contenido</a>
<header class="site-header"><nav class="header-inner" aria-label="Navegación principal"><a class="brand sollahms-brand" href="/" aria-label="Sollahms"><img class="sollahms-brand__image" src="/assets/branding/sollahms-logo.svg" width="114" height="22" alt=""></a><div class="desktop-nav"><a href="/#expertise">Expertise</a><a href="/proyectos.html">Asset Portafolio</a><a href="/guia-hipotecaria.html">Guía hipotecaria</a><a href="/contacto.html">Contacto</a></div><div class="header-actions"><a class="button button-gold header-booking" href="#solicitar-cotizacion">Solicitar cotización</a><button class="menu-toggle" type="button" aria-controls="mobile-menu" aria-expanded="false" aria-label="Abrir menú de navegación"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></nav><nav class="mobile-menu" id="mobile-menu" hidden aria-label="Navegación móvil"><a href="/#expertise">Expertise</a><a href="/proyectos.html">Asset Portafolio</a><a href="/guia-hipotecaria.html">Guía hipotecaria</a><a href="/contacto.html">Contacto</a></nav></header>
<main id="contenido-principal" data-project-journey="1"><section class="ci-hero" id="resumen" aria-labelledby="project-name"><div class="container ci-shell"><nav class="ci-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/proyectos.html">Asset Portafolio</a><span aria-hidden="true">/</span><span aria-current="page">{esc(name)}</span></nav><div class="ci-composition"><div class="ci-copy"><div class="ci-identity"><p class="ci-developer">{esc(developer)}</p><h1 id="project-name">{esc(name)}</h1><p class="ci-location">{esc(identity['commune'])} · {esc(identity['region'])}</p></div><div class="ci-details"><p>Proyecto: {esc(type_label)} · {esc(typology)}</p><p>Entrega informada: {esc(delivery)}</p></div><div class="ci-market" data-scroll-static><span class="expansion-price-source">{esc(price_source)}</span><strong>{esc(price_text)}</strong>{price_context_html}<p class="price-note">{esc(note)}</p></div><div class="ci-action" data-scroll-static><a class="button ci-advisory" href="#solicitar-cotizacion">Solicitar cotización <span aria-hidden="true">↗</span></a><a class="pj-call" href="/contacto.html">Quiero que me llamen</a></div></div>{visual}</div></div></section>
<nav class="section-nav pj-nav" aria-label="Secciones del proyecto" data-scroll-static><div class="container"><a href="#resumen">Resumen</a><a href="#caracteristicas">Características</a>{gallery_link}<a href="#ubicacion">Ubicación</a><a href="#solicitar-cotizacion">Cotización</a></div></nav>
<div class="container pj-content"><section class="detail-section pj-block" id="caracteristicas"><p class="eyebrow">El proyecto en detalle</p><h2>Características</h2><div class="expansion-developer">{logo}<span>{esc(developer)}</span></div><dl class="spec-grid">{facts}</dl><p class="expansion-scope">Las características corresponden a los antecedentes consultados. Las referencias de precio y sus atributos conservan su propio alcance; no confirman stock. Una superficie general sin clasificación no se considera útil o total.</p>{references}<h3>Equipamiento informado</h3>{amenities}<p class="expansion-scope">Equipamiento general publicado por Iris. La inclusión de estacionamiento o bodega y sus condiciones se confirman al cotizar.</p></section>
{gallery}<section class="detail-section pj-block" id="ubicacion"><p class="eyebrow">Dónde está</p><h2>Ubicación</h2><address class="expansion-location">{esc(identity['address'])}<br>{esc(identity['commune'])} · {esc(identity['region'])}, Chile</address><p class="expansion-scope">Dirección publicada en la fuente consultada.</p><a class="expansion-source-link" href="{esc(url)}" target="_blank" rel="noopener noreferrer">Consultar ubicación y antecedentes en Iris ↗</a></section>
<section class="detail-section pj-block" id="solicitar-cotizacion"><p class="eyebrow">Asesoría Sollahms</p><h2>Consulta por {esc(name)}</h2><p>Indica el nombre del proyecto al contactar al equipo y si prefieres recibir una cotización o una llamada.</p><div class="expansion-actions"><a class="button button-gold" href="/contacto.html">Solicitar cotización</a><a class="pj-text-link" href="/contacto.html">Quiero que me llamen</a></div><p class="expansion-scope">Confirma el precio vigente, la disponibilidad y las condiciones de la propiedad antes de tomar una decisión.</p></section>
<section class="detail-section pj-block source-section" id="fuentes"><h2>Fuente de información</h2><p>Identidad, ubicación e información general: Iris de Yapo, consultada el {esc(date_label(source.get('observedAtUTC')))}. Los precios de Iris son referencias externas y no constituyen una cotización propia de Sollahms. Los antecedentes informados por el propietario conservan la fecha indicada en cada referencia.</p><a class="expansion-source-link" href="{esc(url)}" target="_blank" rel="noopener noreferrer">Ver ficha del proyecto en Iris ↗</a></section></div></main>
<footer class="site-footer"><div class="container"><a class="brand sollahms-brand" href="/" aria-label="Sollahms"><img class="sollahms-brand__image" src="/assets/branding/sollahms-logo-light.svg" width="114" height="22" alt="" decoding="async"></a><a href="/proyectos.html">Ver Asset Portafolio</a><a href="/guia-hipotecaria.html">Guía hipotecaria</a><a href="/cuando-comprar-propiedad.html">Cuándo comprar</a><a href="/contacto.html">Contacto</a><a href="/trabaja-con-nosotros.html">Trabaja con nosotros</a><a href="/privacidad.html#informacion-inmobiliaria-material-grafico">Privacidad</a><p>©2026 Sollahms. Todos los derechos reservados.</p></div></footer></body></html>
'''

def main():
    data = json.loads(SOURCE.read_text())
    projects = data['projects']
    original = json.loads((ROOT / 'data/proyectos.json').read_text())
    assert len(projects) == 21 and len({p['slug'] for p in projects}) == 21
    assert not {p['slug'] for p in projects} & {p['slug'] for p in original}
    icons = json.loads((ROOT / 'data/amenities.json').read_text())['icons']
    outputs = []
    for project in projects:
        target = ROOT / (project['slug'] + '.html')
        assert not target.exists() or MARKER in target.read_text(), 'Refuse to overwrite an existing fiche'
        target.write_text(page(project, icons))
        outputs.append({'path': target.name, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    catalogue = ROOT / 'proyectos.html'
    text = catalogue.read_text()
    css = '<link rel="stylesheet" href="/assets/css/catalog-expansion.css?v=20261118-1">'
    if css not in text:
        marker = '<link rel="stylesheet" href="/assets/css/sollahms-theme.css'
        assert marker in text
        text = text.replace(marker, css + '\n' + marker, 1)
    start, end = '<!--IRIS_EXPANSION_DIRECTORY_START-->', '<!--IRIS_EXPANSION_DIRECTORY_END-->'
    items = '\n'.join(f'    <li><a href="/{esc(p["slug"])}.html">{esc(p["identity"]["name"])}</a> — <span>{esc(p["identity"]["developer"])} · {esc(p["identity"]["commune"])}</span></li>' for p in projects)
    block = start + '\n' + items + '\n' + end
    if start in text:
        text = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, text, flags=re.S)
    else:
        marker = '<!--CATALOG_DIRECTORY_END-->'
        assert marker in text
        before, after = text.split(marker, 1)
        pos = before.rfind('</ul>')
        assert pos >= 0
        text = before[:pos] + block + '\n' + before[pos:] + marker + after
    catalogue.write_text(text)
    print(json.dumps({'createdNewFiches': len(outputs), 'sourceSHA256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'existingFichesTouched': 0, 'outputs': outputs}, ensure_ascii=False))

if __name__ == '__main__':
    main()
