"""Exact successor: 15 Ecasa projects preserve 22 independent commercial origins.

Every non-Ecasa object remains exact. Historical HTML guards can recover an
older Ecasa page only after proving its independently reviewed current SHA;
commercial source snapshots are checked against the immutable 22-fiche base.
"""
import copy
import functools
import hashlib
import json
import subprocess
from pathlib import Path
from leben_scope import original_html, original_context, assert_base_records
from sento_scope import original_data as restore_sento_data, historical_file

ROOT = Path(__file__).resolve().parents[1]
MAIN = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026'
CONSOLIDATION_BASE = 'f8e1c848998d5ed9c0eef7cd5f3424b1d908a155'
REVIEWED_OUTPUT = ROOT / 'tests/ecasa-reviewed-output.json'
CONTEXT_REVIEW = ROOT / 'tests/ecasa-context-reviewed-output.json'
RETIRED = {'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center'}
ADDED = {'alto-san-joaquin-2', 'alto-san-joaquin-3', 'terratolten-2', 'nucleo-costanera-2', 'terratolten'}
GROUPS = {'nucleo-costanera': ['nucleo-costanera', 'nucleo-costanera-2'],
          'ferroparque': ['ferroparque', 'ferroparque-2'],
          'terratolten': ['terratolten-1', 'terratolten-2', 'terratolten-3'],
          'lomas-de-puyai': ['lomas-de-puyai', 'lomas-de-puyai-3'],
          'alto-san-joaquin': ['alto-san-joaquin', 'alto-san-joaquin-2', 'alto-san-joaquin-3']}
REFERENCES = {'terratolten': 'terratolten-3'}
ALIASES = {'nucleo-costanera-2': ('nucleo-costanera', 2), 'ferroparque-2': ('ferroparque', 2),
           'terratolten-1': ('terratolten', 1), 'terratolten-2': ('terratolten', 2),
           'terratolten-3': ('terratolten', 3), 'lomas-de-puyai-3': ('lomas-de-puyai', 3),
           'alto-san-joaquin-2': ('alto-san-joaquin', 2), 'alto-san-joaquin-3': ('alto-san-joaquin', 3)}

@functools.lru_cache(maxsize=None)
def main_bytes(path):
    return subprocess.check_output(['git', 'show', f'{MAIN}:{path}'], cwd=ROOT)

@functools.lru_cache(maxsize=None)
def consolidation_bytes(path):
    return subprocess.check_output(['git', 'show', f'{CONSOLIDATION_BASE}:{path}'], cwd=ROOT)

@functools.lru_cache(maxsize=1)
def original_data():
    return {path: json.loads(consolidation_bytes(path)) for path in
            ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json']}

def stage_groups():
    groups = copy.deepcopy(GROUPS)
    for project in original_data()['data/proyectos.json']:
        if project['inmobiliaria'] == 'Ecasa' and not any(project['slug'] in slugs for slugs in groups.values()):
            groups[project['slug']] = [project['slug']]
    assert len(groups) == 15 and sum(map(len, groups.values())) == 22
    return groups

def stage_number(project):
    return project.get('etapa', 2 if project['slug'] == 'aires-la-florida-2' else 1)

def expected_consolidation(path):
    originals = original_data()
    projects = {row['slug']: row for row in originals['data/proyectos.json']}
    research = {row['slug']: row for row in originals['data/fichas-proyectos.json']}
    ledger = {row['slug']: row for row in originals['data/registro-fichas.json']}
    groups = stage_groups()
    references = {REFERENCES.get(canonical, slugs[0]): canonical for canonical, slugs in groups.items()}
    expected = []
    for project in originals['data/proyectos.json']:
        slug = project['slug']
        if project['inmobiliaria'] != 'Ecasa':
            expected.append(copy.deepcopy(next(row for row in originals[path] if row['slug'] == slug)))
            continue
        if slug not in references:
            continue
        canonical = references[slug]
        name = 'Terratoltén' if canonical == 'terratolten' else project['nombre']
        slugs = groups[canonical]
        private = [{'slug': stage, 'nombre': projects[stage]['nombre'], 'etapa': stage_number(projects[stage]),
                    'catalogo': copy.deepcopy(projects[stage]), 'investigacion': copy.deepcopy(research[stage]),
                    'registro': copy.deepcopy(ledger[stage])} for stage in slugs]
        row = copy.deepcopy(next(row for row in originals[path] if row['slug'] == slug))
        row.update(slug=canonical, etapaReferenciaSlug=slug)
        if path == 'data/proyectos.json':
            row.update(nombre=name, detalleUrl='/' + canonical + '.html')
            for field in ['proyectoMatrizSlug', 'etapa', 'etapasRelacionadas']:
                row.pop(field, None)
            row['etapasComerciales'] = []
            for stage in slugs:
                public = copy.deepcopy(projects[stage])
                public['detalleUrl'] = '/' + canonical + '.html#etapa-' + str(stage_number(public))
                row['etapasComerciales'].append(public)
        elif path == 'data/fichas-proyectos.json':
            row['etapasComerciales'] = private
            row['verifiedFields'] = [field for field in row['verifiedFields'] if field not in ['proyectoMatrizSlug', 'etapa', 'etapasRelacionadas']]
            row['verifiedFields'] = list(dict.fromkeys(row['verifiedFields'] + ['etapaReferenciaSlug', 'etapasComerciales']))
            for field in ['proyectoMatrizSlug', 'etapa', 'etapasRelacionadas']:
                row['updates'].pop(field, None)
            row['updates'].update(nombre=name, etapaReferenciaSlug=slug)
            row['portfolioConsolidation'] = {'basis': 'user_authorized_project_consolidation', 'reviewedOn': '2026-10-13',
                'baselineCommit': CONSOLIDATION_BASE, 'referenceStageSlug': slug, 'commercialStageSlugs': slugs,
                'scope': 'project_identity_with_independent_commercial_stages'}
            row['recorridosPorEtapa'] = [{'etapaSlug': item['slug'], 'nombre': item['nombre'],
                'virtualTours': copy.deepcopy(item['investigacion']['virtualTours'])} for item in private if item['investigacion'].get('virtualTours')]
        else:
            row.update(nombre=name, detalleUrl='/' + canonical + '.html')
            row['etapasComerciales'] = [{'slug': item['slug'], 'nombre': item['nombre'], 'etapa': item['etapa'],
                                       'registro': copy.deepcopy(item['registro'])} for item in private]
            row['mapa'] = any(item['registro']['mapa'] for item in private)
            row['matterport'] = any(item['registro']['matterport'] for item in private)
            row['recorridosOficiales'] = sum(item['registro']['recorridosOficiales'] for item in private)
        expected.append(row)
    return expected

def validate_successor_data(path, actual=None):
    current = restore_sento_data(json.loads(actual if actual is not None else (ROOT / path).read_bytes()), path)
    expected = expected_consolidation(path)
    if any(row['slug'] == 'edificio-nordico' for row in current):
        assert_base_records(current, expected, path)
    else:
        assert len(current) == len({row['slug'] for row in current}) == 136, path + ': expected 136 unique canonical projects'
        assert current == expected, path + ': changes exceed the exact 15-project/22-origin Ecasa consolidation'
    return current

def restore_successor_data(path, actual):
    current = validate_successor_data(path, actual)
    base = json.loads(main_bytes(path))
    old_ecasa = {p['slug'] for p in json.loads(main_bytes('data/proyectos.json')) if p['inmobiliaria'] == 'Ecasa'}
    lookup = {row['slug']: row for row in current}
    return [row if row['slug'] in old_ecasa else lookup[row['slug']] for row in base]

def public_fallback(text):
    text = original_html(text)
    import re
    for start, end in [('ECASA_PREVIEW_START', 'ECASA_PREVIEW_END'), ('ECASA_PUBLIC_START', 'ECASA_PUBLIC_END')]:
        assert text.count('<!--' + start + '-->') == text.count('<!--' + end + '-->'), 'Unpaired Ecasa packaging marker'
    text = re.sub(r'<!--ECASA_PREVIEW_START-->.*?<!--ECASA_PREVIEW_END-->', '', text, flags=re.S)
    return re.sub(r'<!--ECASA_PUBLIC_START-->(.*?)<!--ECASA_PUBLIC_END-->', lambda match: match[1], text, flags=re.S)

def validate_reviewed_page(path, current):
    reviewed = json.loads(REVIEWED_OUTPUT.read_text())
    assert reviewed['baselineCommit'] == CONSOLIDATION_BASE, 'Ecasa consolidated HTML review is not frozen'
    assert hashlib.sha256((ROOT / 'data/brochures-ecasa.json').read_bytes()).hexdigest() == reviewed['manifestSha256'], 'Ecasa reviewed manifest changed'
    assert hashlib.sha256(current).hexdigest() == reviewed['htmlSha256'][path], path + ': reviewed consolidated Ecasa output changed'

def validate_alias_route(slug):
    assert slug in ALIASES
    assert not (ROOT / (slug + '.html')).exists(), slug + ': alias cannot remain an independent fiche'
    reviewed = json.loads(REVIEWED_OUTPUT.read_text())
    assert reviewed['baselineCommit'] == CONSOLIDATION_BASE, 'Ecasa consolidated route review is not frozen'
    config = historical_file('vercel.json', (ROOT / 'vercel.json').read_bytes())
    gates = json.loads(config).get('git', {}).get('deploymentEnabled', {})
    if 'codex/norte-verde-hero-merge' in gates:
        assert all(gates.get(branch) is False for branch in ['main', 'codex/ecasa-cartera-definitiva',
                   'codex/leben-brochures-nordico', 'codex/norte-verde-hero-merge']), 'The combined private review deployment gates must remain false'
        addition = b',\n      "codex/norte-verde-hero-merge": false'
        assert config.count(addition) == 1, 'Only the literal disabled Norte Verde gate may extend the pinned Ecasa routes'
        config = config.replace(addition, b'', 1)
    assert hashlib.sha256(config).hexdigest() == reviewed['redirectConfigSha256'], 'Ecasa reviewed route configuration changed'
    canonical, number = ALIASES[slug]
    destination = '/' + canonical + '.html#etapa-' + str(number)
    rules = json.loads(config).get('redirects', [])
    for source in ['/' + slug, '/' + slug + '.html']:
        matches = [rule for rule in rules if rule.get('source') == source]
        assert matches == [{'source': source, 'destination': destination, 'permanent': True}], source + ': exact canonical stage redirect missing'

def restore_context_file(path, current):
    current = historical_file(path, current)
    if path == 'lib/project-context.mjs':
        current = original_context(current)
    review = json.loads(CONTEXT_REVIEW.read_text())
    assert review['baselineCommit'] == CONSOLIDATION_BASE and review['scope'] == 'canonical_and_commercial_stage_context_only'
    if path not in review['files']:
        return current
    checked = review['files'][path]
    assert hashlib.sha256(current).hexdigest() == checked['afterSha256'], path + ': reviewed stage-context bytes changed'
    if checked['beforeSha256'] is None:
        assert path == 'assets/js/project-identity.mjs', 'Unreviewed context asset addition'
        return b''
    original = consolidation_bytes(path)
    assert hashlib.sha256(original).hexdigest() == checked['beforeSha256'], path + ': unrecognized pre-context baseline'
    return original


def restore_ecasa_page(path, current):
    slug = path.removesuffix('.html')
    canonical = stage_groups()
    commercial = {source for sources in canonical.values() for source in sources}
    if slug in RETIRED:
        raise AssertionError(slug + ': retired public route returned')
    if slug not in canonical and slug not in commercial:
        return current
    if slug in ALIASES:
        validate_alias_route(slug)
    else:
        validate_reviewed_page(path, current)
    legacy = 'terratolten-1' if slug == 'terratolten' else slug
    old_slugs = {project['slug'] for project in json.loads(main_bytes('data/proyectos.json'))}
    return main_bytes(legacy + '.html') if legacy in old_slugs else consolidation_bytes(legacy + '.html')

if __name__ == '__main__':
    import sys
    data = sys.stdin.buffer.read()
    if sys.argv[1] == '--data':
        sys.stdout.write(json.dumps(restore_successor_data(sys.argv[2], data), ensure_ascii=False))
    elif sys.argv[1] == '--context':
        sys.stdout.buffer.write(restore_context_file(sys.argv[2], data))
    else:
        sys.stdout.buffer.write(restore_ecasa_page(sys.argv[1], data))
