"""Scoped León commercial projection. Prices live only in data/proyectos.json.

Keep documented plans, media, features and unknown typology prices intact.
"""
import copy, html, json, re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT = Path(__file__).resolve().parents[1]
SLUGS = {'bcome', 'condominio-uruguay', 'gregorio-de-la-fuente-a', 'condominio-parque-don-lautaro', 'jardines-de-ramon-cruz'}
OWNER_FIELDS = ('precioDesdeUF', 'precioDesdeTipologia', 'commercialOffers', 'catalogPricePolicy', 'commercialSource', 'estado', 'entrega', 'direccion', 'comuna', 'region', 'mapQuery', 'tipoActivo')
def authorized(p):
    return p['slug'] in SLUGS and p.get('inmobiliaria') == 'León' and p.get('commercialSource', {}).get('priority') == 'owner-authorized'
def price(v):
    return 'Desde UF ' + format(v, ',.0f').replace(',', '.') if isinstance(v, (int, float)) else 'Consultar precio'
def guard_import(project, research):
    """Historical research may enrich technical evidence, never replace owner commerce."""
    if not authorized(project): return
    updates = research.setdefault('updates', {})
    for key in OWNER_FIELDS:
        if key in updates and key in project and updates[key] != project[key]:
            raise ValueError('León owner-authorized field cannot be overwritten by research: ' + project['slug'] + '/' + key)
    for key in OWNER_FIELDS:
        if key in project: updates[key] = copy.deepcopy(project[key])
    research['verifiedFields'] = list(dict.fromkeys(research.get('verifiedFields', []) + [k for k in OWNER_FIELDS if k in project]))
def sync_facets(data, projects):
    for p in projects:
        if not authorized(p): continue
        f = data['projects'][p['slug']]
        f['states'] = [p['estado']]
        f['delivery'] = {'label': p['entrega'], 'immediate': False, 'reportedImmediate': p['entrega'] == 'Inmediata', 'precision': 'unspecified'}
        if p['slug'] == 'bcome': f['delivery'].update(year=2027, semester=1, precision='semester')
        if p['slug'] == 'condominio-parque-don-lautaro': f['delivery'].update(year=2028, month=10, precision='month')
        mode = {'En blanco': 'blanco', 'En verde': 'verde'}.get(p['estado'])
        f['purchaseStage'] = {'mode': mode, 'eligible': bool(mode), 'referenceStage': None, 'reason': 'Estado comercial informado por Sollahms el 30/10/2026' if mode else 'En recepción final no acredita entrega legalmente habilitada'}
    return data
def apply_leon(page, p):
    if not authorized(p): return page
    m = re.search(r'<main\b[^>]*>.*?</main>', page, re.S)
    soup = BeautifulSoup(m[0], 'html.parser'); main = soup.main
    for node in main.select('[data-leon-commercial]'): node.decompose()
    main.select_one('.ci-market strong').string = price(p['precioDesdeUF'])
    main.select_one('.ci-location').string = p['direccion'] + ', ' + p['comuna'] + ', ' + p['region']
    detail = main.select_one('.ci-details'); detail.clear()
    detail.append(BeautifulSoup('<p>Departamento · ' + html.escape(' · '.join(p['tipologias'])) + '</p><p>Estado: ' + p['estado'] + '</p><p>Entrega informada: ' + p['entrega'] + '</p>', 'html.parser'))
    values = {'Precio desde': price(p['precioDesdeUF']), 'Estado': p['estado'], 'Estado informado': p['estado'], 'Entrega': p['entrega'], 'Entrega informada': p['entrega'], 'Dirección': p['direccion'], 'Comuna': p['comuna'], 'Región': p['region']}
    for dt in main.select('dt'):
        dd = dt.find_next_sibling('dd'); key = dt.get_text(' ', strip=True)
        if dd and key in values: dd.string = values[key]
    dl = main.select_one('#caracteristicas > dl')
    for label, value in [('Precio desde', price(p['precioDesdeUF'])), ('Estado informado', p['estado']), ('Entrega informada', p['entrega'])]:
        if not any(dt.get_text(' ', strip=True) == label for dt in dl.select('dt')):
            dl.append(BeautifulSoup('<div><dt>' + label + '</dt><dd>' + value + '</dd></div>', 'html.parser'))
    rows = []
    for o in p['commercialOffers']:
        rows.append('<div><dt>' + o['label'] + '</dt><dd>' + price(o['priceUF']) + ' · <a class="pj-text-link" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="' + o['id'] + '">Solicitar cotización</a> · <a class="pj-text-link" href="/guia-hipotecaria.html?proyecto=' + p['slug'] + '&amp;oferta=' + o['id'] + '&amp;origen=ficha#simulador">Simular financiamiento</a></dd></div>')
    note = 'Valores desde por tipología informados por Sollahms el 30/10/2026. Precio de la unidad, disponibilidad e inclusiones por confirmar al cotizar. Las fechas informadas no son una garantía de entrega.'
    if p['estado'] == 'En recepción final': note += ' La entrega informada como inmediata está sujeta a confirmar la recepción final y las condiciones legales de entrega.'
    if len(p['tipologias']) > len(p['commercialOffers']): note += ' Los modelos documentados sin precio autorizado se conservan para consulta.'
    main.find(id='proyecto').append(BeautifulSoup('<section class="jn-subsection" data-leon-commercial data-scroll-static><h3>Precios por tipología</h3><dl class="spec-grid">' + ''.join(rows) + '</dl><p class="price-note">' + note + '</p></section>', 'html.parser'))
    main['data-project-brochure'] = 'leon-commercial-20261030'
    old = main.find(id='project-brochure-data')
    if old: old.decompose()
    record = {'slug': p['slug'], 'name': p['nombre'], 'developer': p['inmobiliaria'], 'offers': p['commercialOffers']}
    main.append(BeautifulSoup('<script type="application/json" id="project-brochure-data" data-leon-commercial>' + json.dumps(record, ensure_ascii=False).replace('<', '\\u003c') + '</script>', 'html.parser'))
    if not main.find(id='pb-selection'):
        main.find(id='advisory-project-context').insert_after(BeautifulSoup('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>', 'html.parser'))
    result = page[:m.start()] + str(main) + page[m.end():]
    if '/assets/js/project-brochure.mjs' not in result: result = result.replace('</head>', '<script type="module" src="/assets/js/project-brochure.mjs?v=20261030-leon"></script></head>')
    from purchase_stage_links import apply_stage_project
    return apply_stage_project(result, p)
def main():
    projects = json.loads((ROOT/'data/proyectos.json').read_text())
    facets = sync_facets(json.loads((ROOT/'data/catalog-facets.json').read_text()), projects)
    (ROOT/'data/catalog-facets.json').write_text(json.dumps(facets, ensure_ascii=False, separators=(',', ':')) + '\n')
    path = ROOT/'proyectos.html'; page = path.read_text()
    for p in projects:
        if not authorized(p): continue
        target = ROOT/(p['slug'] + '.html'); target.write_text(apply_leon(target.read_text(), p))
        page = re.sub(r'(<li><a href="/' + re.escape(p['slug']) + r'\.html">[^<]*</a> — <span>)[^<]*(</span></li>)', lambda m: m[1] + price(p['precioDesdeUF']) + m[2], page)
    page = page.replace('Precio desde del proyecto · UF', 'Precio desde · UF').replace('El precio desde corresponde al proyecto; las ofertas comerciales identificadas por separado usan el precio de ese producto.', 'El rango usa el precio desde del proyecto o de la tipología, etapa o producto seleccionado cuando tiene un valor autorizado.')
    path.write_text(page)
if __name__ == '__main__': main()
