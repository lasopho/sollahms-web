#!/usr/bin/env python3
"""Documentary-only reconciliation. Reads immutable Git objects; never edits app files."""
import argparse
import csv
import hashlib
import io
import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

GIT = '/Users/luissandoval/Documents/sollahms-web/.git'
TECH = '24a11df1a62898a06b408a729bb20ce1b1de4e87'
AUDIT = 'e9e256511987a638072b2ddca827df5acba68c3f'
UNIVERSE_HASH = 'aff5a08f8abe9f4bafa2924a29a2f5f79e6a5724767d15f6b4b059dba2e4b59b'
DEFAULT_OUT = Path('/private/tmp/sollahms-parking-storage-131-20261118')
INVENTORY = 'docs/objetivo-principal-asset-portafolio/INVENTARIO-DE-FUENTES.json'
CSV_PATH = 'docs/catalog-data-completeness-20261116/leben/fase4-20261116/PRECIOS-PROPIETARIO-LEBEN.csv'
OWNER_MD = 'docs/catalog-data-completeness-20261116/leben/fase4-20261116/COM-F4-001-RESPUESTA-PROPIETARIO.md'
DATA_PROJECTS = 'data/proyectos.json'
DATA_FEATURES = 'data/project-features.json'
DATA_LEBEN = 'data/commercial-filter-evidence-leben.json'
CONCEPTS = {'parking': ('estacionamiento', 'condicion_estacionamiento', 'estacionamiento_incluido_en_precio'),
            'storage': ('bodega', 'condicion_bodega', 'bodega_incluida_en_precio')}
SOURCE_BYTES = {}
SOURCE_JSON = {}
SOURCE_META = {}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(commit, path, role):
    raw = subprocess.check_output(['git', '--git-dir=' + GIT, 'show', commit + ':' + path])
    SOURCE_BYTES[path] = raw
    if path.endswith('.json'):
        SOURCE_JSON[path] = json.loads(raw)
    SOURCE_META[path] = {'path': path, 'commit': commit, 'sha256': digest(raw), 'bytes': len(raw), 'role': role}
    return SOURCE_JSON.get(path, raw.decode('utf-8-sig'))


def json_pointer(value, pointer):
    for part in pointer.split('/')[1:] if pointer else []:
        key = part.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def escape(value):
    return str(value).replace('~', '~0').replace('/', '~1')


def evidence(path, locator, scope, source_date=None, source_id=None):
    meta = SOURCE_META[path]
    item = {'sourceFile': path, 'sourceCommit': meta['commit'], 'sourceSHA256': meta['sha256'],
            'locator': locator, 'sourceDate': source_date, 'scope': scope}
    if source_id:
        item['sourceId'] = source_id
    return item


def unknown(reason):
    return {'state': 'desconocido', 'value': None, 'reason': reason, 'evidence': []}


def blank_concept():
    return {'productMention': unknown('No declaración específica de producto acreditada en estas fuentes.'),
            'excludedServiceMentions': [],
            'inclusion': {'state': 'desconocido', 'projectWideValue': None, 'byPriceReference': [],
                          'reason': 'Una mención general no acredita inclusión en una referencia o en todas las unidades.'},
            'availability': {'state': 'desconocido', 'value': None, 'byExactReference': [],
                             'reason': 'No se acredita disponibilidad o asignación actual a una referencia exacta.'},
            'additionalCost': {'generalOffer': unknown('No oferta adicional expresa acreditada.'),
                               'amounts': [], 'assignableToUnit': None,
                               'amountIsPartOfPropertyPrice': None},
            'preparedProjection': None}


def leaf_matches(value, pointer=''):
    found = []
    if isinstance(value, dict):
        for key, child in value.items():
            path = pointer + '/' + escape(key)
            if re.search('parking|storage|estacion|bodega', key, re.I):
                found.append(path)
            found.extend(leaf_matches(child, path))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(leaf_matches(child, pointer + '/' + str(index)))
    elif isinstance(value, str) and re.search('parking|storage|estacion|bodega', value, re.I):
        found.append(pointer)
    return found


def build():
    inventory = load(AUDIT, INVENTORY, 'Existing source inventory/hash baseline; not a new commercial source.')
    projects = load(TECH, DATA_PROJECTS, 'Exact131 identity universe only; no published prices imported.')
    features = load(TECH, DATA_FEATURES, 'Existing authored mentions and their own scope/provenance.')
    leben = load(TECH, DATA_LEBEN, 'Existing prepared12Leben;10general additional declarations,2unknown.')
    load(AUDIT, CSV_PATH, 'Existing F049 quote exclusions and separate Suecia additional amounts.')
    load(AUDIT, OWNER_MD, 'Existing owner communication16Nov; no new reception.')
    owner_reviews = []
    for folder in ['aj-urbana-20261030', 'ecasa-commercial-20261030', 'leon-commercial-20261030', 'sento-commercial-20261030']:
        for filename in ['owner-input.json', 'verification.json']:
            path = 'docs/' + folder + '/' + filename
            data = load(TECH, path, 'Bounded review of existing owner/verification JSON for parking/storage declarations.')
            matches = leaf_matches(data)
            assert not matches, (path, matches)
            owner_reviews.append({'sourceFile': path, 'matchingLocators': [], 'matchingCount': 0,
                                  'conclusion': 'No relevant declaration located in this bounded JSON review; not physical absence.'})
    assert digest(SOURCE_BYTES[DATA_PROJECTS]) == UNIVERSE_HASH
    assert len(projects) == 131 and len({p['slug'] for p in projects}) == 131
    baseline = dict(inventory['fuentes_existentes'])
    baseline.update(inventory['documentos_comerciales_existentes'])
    for path, meta in SOURCE_META.items():
        if path in baseline and baseline[path].get('sha256'):
            meta['expectedInventorySHA256'] = baseline[path]['sha256']
            assert meta['sha256'] == meta['expectedInventorySHA256'], path
    assert digest(SOURCE_BYTES[CSV_PATH]) == leben['source']['additionalCostsSha256']
    rows = list(csv.DictReader(io.StringIO(SOURCE_BYTES[CSV_PATH].decode('utf-8-sig'))))
    by_id = {row['id_precio_normalizado']: (index + 2, row) for index, row in enumerate(rows)}
    assert len(by_id) == len(rows) == 22
    output = []
    by_slug = {}
    for index, project in enumerate(projects):
        row = {'slug': project['slug'], 'name': project['nombre'], 'developer': project['inmobiliaria'],
               'identitySourcePointer': '/' + str(index), 'parking': blank_concept(), 'storage': blank_concept()}
        output.append(row)
        by_slug[row['slug']] = row
    feature_count = 0
    feature_slugs = set()
    for slug, project in features['projects'].items():
        assert slug in by_slug
        for gi, group in enumerate(project['groups']):
            for ii, item in enumerate(group['items']):
                label = item.get('label', '')
                if not re.search('estacion|bodega', label + ' ' + item.get('description', ''), re.I):
                    continue
                feature_count += 1
                feature_slugs.add(slug)
                concept = 'parking' if re.search('estacion', label, re.I) else 'storage'
                target = by_slug[slug][concept]
                pointer = '/projects/' + escape(slug) + '/groups/' + str(gi) + '/items/' + str(ii)
                proof = evidence(DATA_FEATURES, {'kind': 'json-pointer', 'pointer': pointer},
                                 {'literalScope': item.get('scope'), 'groupStageSlug': group.get('stageSlug'),
                                  'referenceStage': project.get('referenceStage'), 'productAppliesTo': None})
                proof['originalProvenance'] = item.get('source')
                proof['sourceFilterEligible'] = item.get('filterEligible')
                literal = {'literal': label, 'description': item.get('description', ''), 'evidence': [proof]}
                if label.strip().lower() in ['estacionamientos', 'bodegas']:
                    target['productMention'] = {'state': 'parcial', 'value': 'mencion_general_de_proyecto',
                                                'literal': label, 'privateOrAssignedProductConfirmed': None,
                                                'evidence': [proof]}
                else:
                    literal['state'] = 'parcial'
                    literal['excludedFromPrivateProductPredicates'] = True
                    literal['reason'] = 'Visitas o servicio/encomiendas/mudanzas/maletas/náutica no acredita producto privado.'
                    target['excludedServiceMentions'].append(literal)
    assert feature_count == 27 and len(feature_slugs) == 19
    for index, prepared in enumerate(leben['projects']):
        assert prepared['slug'] in by_slug
        for concept in CONCEPTS:
            value = prepared['projectFacts'][concept]
            pointer = '/projects/' + str(index) + '/projectFacts/' + concept
            by_slug[prepared['slug']][concept]['preparedProjection'] = {
                'state': 'parcial' if value['generalAdditional'] is not None else 'desconocido',
                'literalValues': value,
                'notAnExactUnitAssignment': True,
                'evidence': [evidence(DATA_LEBEN, {'kind': 'json-pointer', 'pointer': pointer},
                                      value.get('scope'), value.get('sourceDate'), value.get('sourceId'))]}
    general_slugs = set()
    quoted_ids = []
    for reference_id, (line, source_row) in by_id.items():
        if source_row['tipo_registro'] != 'INMUEBLE':
            continue
        assert source_row['id_fuente'] == 'F049' and source_row['fecha_comunicacion'] == '2026-11-16'
        quoted_ids.append(reference_id)
        slug = source_row['slug']
        general_slugs.add(slug)
        for concept, (_, condition_key, included_key) in CONCEPTS.items():
            assert source_row[condition_key] == 'adicional' and source_row[included_key] == 'false'
            assert source_row['origen_condicion_exclusion'].startswith('Declaración expresa:')
            target = by_slug[slug][concept]
            proof = evidence(CSV_PATH, {'kind': 'csv-id', 'column': 'id_precio_normalizado',
                                        'id': reference_id, 'lineIncludingHeader': line},
                             {'kind': 'owner_price_reference', 'categoryLiteral': source_row['categoria_literal'],
                              'modelLiteral': source_row['modelo_declarado_literal'] or None,
                              'unitLiteral': source_row['unidad_declarada_literal'] or None,
                              'physicalAssetAssignment': None}, '2026-11-16', 'F049')
            target['inclusion']['state'] = 'parcial'
            target['inclusion']['byPriceReference'].append({
                'referenceId': reference_id, 'state': 'confirmado', 'includedInDeclaredPropertyPrice': False,
                'literalReason': source_row['origen_condicion_exclusion'], 'evidence': [proof]})
            target['additionalCost']['generalOffer'] = {'state': 'confirmado', 'value': True,
                'literal': 'Estacionamiento y bodega adicionales.', 'evidence': [proof],
                'limit': 'Declaración comercial fechada; no disponibilidad, stock ni asignación a cada unidad.'}
            target['productMention'] = {'state': 'confirmado', 'value': 'oferta_adicional_general_declarada',
                                       'privateOrAssignedProductConfirmed': None, 'evidence': [proof]}
    assert len(quoted_ids) == 20 and len(general_slugs) == 10
    for index, cost in enumerate(leben['additionalCosts']):
        reference_id = cost['id']
        assert reference_id in by_id
        line, source_row = by_id[reference_id]
        assert source_row['tipo_registro'] == 'ADICIONAL'
        assert float(source_row['precio_uf_decimal']) == cost['priceUF']
        assert cost['slug'] == 'edificio-suecia'
        assert (reference_id, cost['concept'], cost['priceUF']) in [
            ('OWN4-AD001', 'parking', 510.0), ('OWN4-AD002', 'storage', 75.0)]
        proofs = [evidence(DATA_LEBEN, {'kind': 'json-pointer', 'pointer': '/additionalCosts/' + str(index)},
                           cost['scope'], cost['sourceDate'], cost['sourceId']),
                  evidence(CSV_PATH, {'kind': 'csv-id', 'column': 'id_precio_normalizado', 'id': reference_id,
                                     'lineIncludingHeader': line}, 'Costo adicional general separado del inmueble.',
                           source_row['fecha_comunicacion'], source_row['id_fuente'])]
        by_slug[cost['slug']][cost['concept']]['additionalCost']['amounts'].append({
            'referenceId': reference_id, 'state': 'confirmado', 'amountUF': cost['priceUF'],
            'literal': cost['literal'], 'assignedUnitOrAsset': None, 'stock': None,
            'sumWithPropertyPriceAllowed': False, 'evidence': proofs})
    summary = {}
    for concept in CONCEPTS:
        values = [row[concept] for row in output]
        summary[concept] = {
            'productMentionStates': dict(Counter(value['productMention']['state'] for value in values)),
            'generalAdditionalOfferConfirmedProjects': sum(value['additionalCost']['generalOffer']['value'] is True for value in values),
            'excludedPriceReferences': sum(len(value['inclusion']['byPriceReference']) for value in values),
            'confirmedIncludedTrueReferences': 0,
            'projectWideInclusionUnknown': sum(value['inclusion']['projectWideValue'] is None for value in values),
            'exactAvailabilityUnknownProjects': sum(value['availability']['value'] is None for value in values),
            'separateAmountReferences': sum(len(value['additionalCost']['amounts']) for value in values),
            'excludedServiceMentionItems': sum(len(value['excludedServiceMentions']) for value in values)}
    result = {'schemaVersion': 1, 'classificationDate': '2026-11-18',
        'kind': 'Overlay documental de dos campos a partir de fuentes ya conservadas; no auditoría repetida ni recepción nueva.',
        'universe': {'count': 131, 'uniqueSlugs': 131, 'sourceFile': DATA_PROJECTS, 'commit': TECH,
                     'sha256': UNIVERSE_HASH, 'use': 'Identidad exacta; no precios ni atributos nuevos.'},
        'policy': ['Los otros nueve campos no se editan ni recertifican.',
                   'Estado confirmado es local a una declaración fechada y alcance citado, no vigencia actual o stock.',
                   'Una mención general no acredita inclusión, disponibilidad o asignación privada.',
                   'Los servicios y estacionamientos de visitas no acreditan estacionamiento/bodega privados.',
                   'Las exclusiones del precio se conservan por ID de cotización, sin extenderlas a todas las unidades.',
                   'Suecia OWN4-AD001/2 permanece separado: UF510/75, nunca suma al inmueble.',
                   'Ningún desconocido se convierte en false/no aplicable. Ningún dato implica stock.'],
        'sourceReview': {'ownerJSONReviewed': owner_reviews, 'featureMentionsReviewed': 27,
                         'featureMentionProjects': 19, 'preparedLebenProjects': 12,
                         'LebenGeneralAdditionalDeclaredProjects': 10,
                         'LebenPreparedUnknownProjects': ['edificio-santo', 'edificio-baum']},
        'summary': summary, 'projects': output,
        'operations': {'newOwnerReceptions': 0, 'newFactIDs': 0, 'historical313Closed': 0,
                       'applicationEdits': 0, 'testsOfApplication': 0, 'IrisOrNetworkQueries': 0,
                       'candidate24aChanged': False, 'productionChanged': False,
                       'allSourceScopesPreserved': True}}
    validate(result, rows)
    return result


def validate(result, csv_rows):
    allowed = {'confirmado', 'parcial', 'historico', 'contradictorio', 'desconocido', 'no_aplicable'}
    source_csv = {row['id_precio_normalizado']: row for row in csv_rows}
    counts = Counter()
    def walk(value):
        if isinstance(value, dict):
            if 'state' in value:
                assert value['state'] in allowed
                if value['state'] == 'desconocido' and 'value' in value:
                    assert value['value'] is None
            if 'sourceFile' in value and 'locator' in value:
                meta = SOURCE_META[value['sourceFile']]
                assert value['sourceSHA256'] == meta['sha256'] and value['sourceCommit'] == meta['commit']
                loc = value['locator']
                if loc['kind'] == 'json-pointer':
                    json_pointer(SOURCE_JSON[value['sourceFile']], loc['pointer'])
                elif loc['kind'] == 'csv-id':
                    assert loc['id'] in source_csv
                    assert csv_rows[loc['lineIncludingHeader'] - 2]['id_precio_normalizado'] == loc['id']
                else:
                    raise AssertionError(loc)
                counts['evidenceLocatorsResolved'] += 1
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    walk(result)
    assert len(result['projects']) == len({p['slug'] for p in result['projects']}) == 131
    for row in result['projects']:
        for concept in CONCEPTS:
            item = row[concept]
            assert item['availability']['value'] is None
            assert item['inclusion']['projectWideValue'] is None
            assert item['additionalCost']['assignableToUnit'] is None
    result['validation'] = dict(counts, universeRows=131, uniqueSlugs=131,
                                sourceFiles=len(SOURCE_META), inheritedQuoteIds=20, inheritedAdditionalIds=2,
                                newIdsAssigned=0, unknownAvailabilityRowsPerConcept=131,
                                existingNineFieldsModified=0, sourceHashesMatch=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=DEFAULT_OUT)
    parser.add_argument('--write', action='store_true', help='Write documentary outputs only into --out.')
    args = parser.parse_args()
    result = build()
    raw = (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode()
    target = args.out / 'CLASIFICACION-ESTACIONAMIENTO-BODEGA-131.json'
    if args.write:
        args.out.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        receipt = {'schemaVersion': 1, 'recordedAtUTC': datetime.now(timezone.utc).isoformat(),
                   'kind': 'Recibo de reutilización y validación estructural; no nueva recepción comercial.',
                   'derivationScript': Path(__file__).name,
                   'derivationScriptSHA256': digest(Path(__file__).read_bytes()),
                   'output': {'path': target.name, 'bytes': len(raw), 'sha256': digest(raw)},
                   'sources': list(SOURCE_META.values()), 'validation': result['validation'],
                   'applicationTestsExecuted': 0, 'newOwnerReceptions': 0, 'historical313Closed': 0}
        (args.out / 'RECIBO-FUENTES-Y-VALIDACION.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    else:
        assert target.read_bytes() == raw, 'Existing overlay differs from deterministic source derivation.'
        receipt = json.loads((args.out / 'RECIBO-FUENTES-Y-VALIDACION.json').read_text())
        assert receipt['derivationScriptSHA256'] == digest(Path(__file__).read_bytes())
        assert receipt['output']['sha256'] == digest(raw)
    print(json.dumps({'output': str(target), 'sha256': digest(raw), 'summary': result['summary'],
                      'validation': result['validation'], 'mode': 'written' if args.write else 'verified'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
