#!/usr/bin/env python3
"""Update only the seven existing Sento identities from reviewed sources."""
import copy
import hashlib
import json
import re
from pathlib import Path
from sento_fiche import render, typology, caption

ROOT = Path(__file__).resolve().parents[1]
def read(path): return json.loads((ROOT/path).read_text())
def write(path, data): (ROOT/path).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')

def main():
    baseline = read('data/sento-baseline.json')
    brochures = read('data/brochures-sento.json')
    angamos = read('data/sento-angamos.json')
    official = {r['slugExistente']: r for r in read('data/sento-official-research.json')['proyectos']}
    records = copy.deepcopy(brochures['projects'])
    a = copy.deepcopy(angamos['project']); a['slug'] = 'angamos'
    a['location'] = {'address': a['address'], 'commune': a['comuna'], 'region': 'Región Metropolitana', 'mapNote': 'Mapa de búsqueda por la dirección comercial Angamos 205. El mapa de Sento señala Angamos 215; confirma el acceso exacto al consultar.'}
    a['connectivity'] = [a['locationDescription']]
    a['pending'] = angamos['limitations']
    for asset in a['images']:
        if asset.get('originalLocalPath'):
            asset['original']['localPath'] = asset['originalLocalPath']
            asset['enlargePath'] = asset['originalLocalPath']
    for model in a['models']:
        if model.get('bedrooms') is None: model['typologyLabel'] = 'Estudio según pestaña oficial · 1 baño (clasificación por confirmar)'
    records.append(a)
    plan_audit = read('data/sento-plan-audit.json') if (ROOT/'data/sento-plan-audit.json').exists() else None
    audited_models = {(m['slug'], m['originalLabel']): m for m in plan_audit['models']} if plan_audit else {}
    if plan_audit:
        assert plan_audit['schemaVersion'] == 1 and plan_audit['internalOnly'] is True
        assert len(audited_models) == 45
        source_models = {}
        for file, sha256 in [('data/sento-plan-audit-pdf.json', '4eff4766ed0a523028787fab5d2be2e372453579a8f4e28840039821759c2ee8'), ('data/sento-plan-audit-angamos.json', 'b52d42bc6567614503812e21b5c537d1d2fa4a6ea9305bb8fea3f09a0c5e24ae')]:
            assert hashlib.sha256((ROOT/file).read_bytes()).hexdigest() == sha256, 'Independent plan audit changed'
            source_models.update({(m['slug'], m['originalLabel']): m for m in read(file)['models']})
        fields = ['label', 'kind', 'valueM2', 'publishable', 'sourceRef']
        for key, model in audited_models.items():
            source = source_models[key]
            assert model['bedrooms'] == source['bedrooms'] and model['bathrooms'] == source['bathrooms']
            assert [{f:a.get(f) for f in fields} for a in model['areas']] == [{f:a.get(f) for f in fields} for a in source['areas']], 'Unverified or recalculated plan surfaces'
    source_projects = read('data/proyectos.json')
    old = {r['slug']: r for r in baseline['originalRows']['data/proyectos.json']}
    old_research = {r['slug']: r for r in baseline['originalRows']['data/fichas-proyectos.json']}
    old_ledger = {r['slug']: r for r in baseline['originalRows']['data/registro-fichas.json']}
    catalogue, research, ledger = {}, {}, {}
    for record in records:
        slug = record['slug']; current = old[slug]; web = official[slug]; commercial = web['comercial']
        record['name'] = 'Angamos 205' if slug == 'angamos' else current['nombre']
        record['officialUrl'] = web['urlOficial']
        for asset in record['images']:
            if asset.get('kind') in ['amenity', 'common_area']: asset['kind'] = 'common'
        record['pending'] = list(dict.fromkeys(record.get('pending', []) + web['limitaciones']))
        record['location']['address'] = current.get('direccion') or record['location'].get('address')
        if slug == 'mirador-la-florida':
            record['location']['address'] = 'Calle Eugenia'
            record['location']['mapNote'] = 'Ubicación referencial de la calle publicada por Sento, sin numeración. La dirección y el acceso exactos están por confirmar.'
        if slug == 'jofre-135':
            record['identityNote'] = 'El brochure identifica este desarrollo como Jofré 135. Sento lo presenta actualmente como Jofré 157, entregado y 100% vendido. La fachada y los cuatro planos coinciden con el brochure oficial; se conserva esta ficha.'
            record['location']['mapNote'] = 'Sento publica la dirección Jofré 157 y su mapa señala General Jofré 135. Confirma el acceso exacto.'
        if slug == 'san-ignacio':
            record['identityNote'] = 'El brochure y el mapa oficial utilizan San Ignacio de Loyola 270. La página comercial actual utiliza San Ignacio 280 para el mismo desarrollo. Se conserva la ficha y la dirección comercial actual.'
            record['location']['mapNote'] = 'Mapa de búsqueda por San Ignacio 280. El brochure y el mapa oficial de Sento señalan 270; confirma el acceso exacto.'
        if slug == 'plaza-las-condes':
            record['identityNote'] = 'El brochure identifica Avenida Las Condes 7083. La web de Sento publica el acceso por Av. General Carol Urzúa 7060 para el mismo proyecto.'
        if slug == 'curico-77': record['location']['mapNote'] = 'Mapa de búsqueda por Curicó 77. El mapa del sitio oficial señala Curicó 55; confirma el acceso exacto.'
        record['commercial'] = {'precioDesdeUF': commercial['precioDesdeUF'], 'estado': 'Vendido' if commercial['vendido100Porcentaje'] else commercial['estado'], 'entrega': 'Proyecto entregado' if commercial['vendido100Porcentaje'] else 'Inmediata' if commercial['estado'] == 'Entrega inmediata' else commercial['entregaEstimada'], 'sourceUrl': web['urlOficial'], 'verifiedOn': '2026-10-13', 'evidence': commercial}
        if commercial['precioDesdeUF']:
            record['commercial']['note'] = f"Valor publicado por Sento para departamento {commercial['departamentoPrecio']} ({commercial['tipologiaPrecio']}), con {commercial['descuentoAplicadoPorcentaje']}% de descuento aplicado. Publicidad octubre de 2026. Excluye estacionamiento y bodega; sujeto a disponibilidad. Confirma la cotización vigente."
        else: record['commercial']['note'] = 'Sento informa 100% vendido. No hay precio ni disponibilidad de venta publicados.'
        previous_tours = {t['url']: t for t in old_research[slug].get('virtualTours', [])}
        record['virtualTours'] = []
        for tour in web['recursos']['tours']:
            prior = previous_tours.get(tour['url'], {})
            record['virtualTours'].append({'url': tour['url'], 'title': ('Entorno 360 oficial' if 'Entorno' in tour['clase'] else 'Recorrido oficial · ' + tour['clase']), 'sourceUrl': web['urlOficial'], 'httpStatus': tour['httpStatus'], 'checkedAt': '2026-10-13', 'embedStatus': prior.get('embedStatus', 'link'), 'visualVerification': prior.get('visualVerification'), 'currentVerification': tour['verificacion']})
        if slug == 'angamos':
            for tour in record['virtualTours']:
                if tour['url'] == a['virtualTour']['url'] and a['virtualTour'].get('browserVerification'):
                    tour['embedStatus'] = 'allowed'
                    tour['visualVerification'] = a['virtualTour']['browserVerification']
                    tour['currentVerification'] = 'Escena Matterport de Piloto 1 dormitorio comprobada en Chrome el 13 de octubre de 2026, con canvas 3D visible y sin errores de script.'
        for model in record['models']:
            if isinstance(model.get('notes'), str): model['notes'] = [model['notes']]
            model.setdefault('notes', [])
            if slug == 'san-ignacio':
                code = model['label'].split()[-1]
                web_model = next((m for m in web['planosOficiales'] if m['tipo'] == code), None)
                if web_model and code in ['A3', 'D1']: model['notes'].append('La versión web actual publica ' + str(web_model['totalM2']).replace('.', ',') + ' m² totales. Aquí se conserva la superficie del brochure; confirma la versión de la unidad.')
            if plan_audit:
                audited = audited_models[(slug, model['label'])]
                for key in ['code', 'bedrooms', 'bathrooms', 'displayTypology', 'areas', 'consumerNotes']:
                    if key in audited: model[key] = copy.deepcopy(audited[key])
                model['planAudit'] = copy.deepcopy(audited)
        hero = next(image for image in record['images'] if image['localPath'] == record['cover'])
        cards = [v for v in hero.get('variants', []) if v['width'] >= 600]
        card = min(cards, key=lambda v:v['width']) if cards else hero
        types = list(dict.fromkeys('Estudio' if m.get('bedrooms') == 0 or m.get('typologyLabel', '').startswith('Estudio') else str(m['bedrooms']) + ' dormitorio' + ('s' if m['bedrooms'] != 1 else '') for m in record['models'] if m.get('bedrooms') is not None or m.get('typologyLabel')))
        p = {'slug': slug, 'nombre': record['name'], 'inmobiliaria': 'Sento', 'tipoActivo': 'Residencial', 'comuna': record['location']['commune'], 'region': 'Región Metropolitana', 'direccion': record['location']['address'], 'estado': record['commercial']['estado'], 'entrega': record['commercial']['entrega'], 'tipologias': types, 'precioDesdeUF': record['commercial']['precioDesdeUF'], 'detalleUrl': '/' + slug + '.html', 'descripcionLarga': record['description'], 'mapQuery': ', '.join([record['location']['address'], record['location']['commune'], 'Región Metropolitana', 'Chile']), 'amenities': [x if isinstance(x, str) else x['label'] for x in record['amenities']], 'superficieDesdeM2': None, 'imagenPrincipal': card['localPath'], 'imagenAlt': caption(hero, record), 'commercialSource': {'sourceUrl': web['urlOficial'], 'verifiedOn': '2026-10-13', 'unit': commercial['departamentoPrecio'], 'typology': commercial['tipologiaPrecio'], 'discountPercent': commercial['descuentoAplicadoPorcentaje'], 'note': record['commercial']['note']}}
        fields = [key for key in p if key not in ['superficieDesdeM2', 'commercialSource', 'slug', 'detalleUrl']]
        p['verificacion'] = {'fecha': '2026-10-13', 'fuente': web['urlOficial'], 'estadoFuente': 'verified', 'camposVerificados': fields, 'documentoPrincipal': record.get('document', {}).get('localPath'), 'tipologiasReferencialesSinStock': True}
        catalogue[slug] = p
        research[slug] = {'slug': slug, 'sourceUrl': web['urlOficial'], 'checkedAt': '2026-10-13', 'sourceStatus': 'verified', 'verifiedFields': fields, 'updates': {k:v for k,v in p.items() if k in fields}, 'specs': {'utilM2': None, 'totalM2': None}, 'images': record['images'], 'brochureModels': record['models'], 'virtualTours': record['virtualTours'], 'pendingFields': record['pending'], 'identityEvidence': web['identidad'], 'commercialEvidence': commercial, 'officialPlantEvidence': web['planosOficiales'], 'document': record.get('document')}
        ledger[slug] = {'slug': slug, 'nombre': p['nombre'], 'inmobiliaria': 'Sento', 'detalleUrl': p['detalleUrl'], 'fichaDesarrollada': True, 'destacadaExistente': old_ledger[slug]['destacadaExistente'], 'estadoFuente': 'verified', 'fuente': web['urlOficial'], 'fechaRevision': '2026-10-13', 'mapa': True, 'mapaAccesoExactoPendiente': bool(record['location'].get('mapNote')), 'matterport': any('matterport' in t['url'] for t in record['virtualTours']), 'recorridosOficiales': len(record['virtualTours']), 'pendientes': record['pending'], 'controlCalidad': 'documentado_datos_comerciales_contrastados', 'imagenes': len(record['images']), 'planos': len(record['models'])}
        (ROOT/(slug + '.html')).write_text(render(record))
    order = [r['slug'] for r in source_projects if r['slug'] in catalogue]
    review = {'schemaVersion': 1, 'protectedPreviewOnly': True, 'reviewDate': '2026-10-13', 'projects': records, 'catalogue': [catalogue[s] for s in order], 'research': [research[s] for s in order], 'ledger': [ledger[s] for s in order], 'sourceManifests': ['data/brochures-sento.json', 'data/sento-angamos.json', 'data/sento-official-research.json'], 'baseline': 'data/sento-baseline.json'}
    if plan_audit:
        review['planAuditCheckedOn'] = plan_audit['checkedOn']
        review['sourceManifests'] += ['data/sento-plan-audit.json'] + plan_audit['sourceAudits']
    write('data/sento-review.json', review)
    for file, replacements in [('data/proyectos.json', catalogue), ('data/fichas-proyectos.json', research), ('data/registro-fichas.json', ledger)]:
        rows = read(file); write(file, [replacements.get(row['slug'], row) for row in rows])
    context = (ROOT/'lib/project-context.mjs').read_text(); pattern = r'(export const projects = Object\.freeze\()([\s\S]*?)(\);)'; match = re.search(pattern, context); contexts = json.loads(match[2])
    for slug, p in catalogue.items(): contexts[slug] = {'name': p['nombre'], 'url': p['detalleUrl']}
    (ROOT/'lib/project-context.mjs').write_text(context[:match.start(2)] + json.dumps(contexts, ensure_ascii=False, indent=2) + context[match.end(2):])
    print(json.dumps({'updated': len(records), 'added': 0, 'images': sum(len(r['images']) for r in records), 'plans': sum(len(r['models']) for r in records), 'preservedOthers': len([p for p in source_projects if p['slug'] not in catalogue])}))

if __name__ == '__main__': main()
