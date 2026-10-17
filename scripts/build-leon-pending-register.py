#!/usr/bin/env python3
"""Reconcile retained León metadata and rendered fields; never recertify originals."""
import argparse
from collections import Counter, defaultdict
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER_SHA256 = '0c3465d7e6f2f623378c7e295c2e0f9cf72b586dd60a3c45b18a78985d3400dc'
MANIFEST_SHA256 = '962ed948e818a6c27046657bea5835d54e1e885f88c14775b5567b1c6c3ec28d'


class RenderedPlans(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.plans, self.current, self.kind, self.capture = {}, None, None, False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article' and attrs.get('data-plan-id'):
            self.current = attrs['data-plan-id']
            if self.current in self.plans:
                raise ValueError('Duplicate HTML plan identifier')
            self.plans[self.current] = {'areas': {}, 'path': None}
        if self.current and tag == 'img':
            self.plans[self.current]['path'] = attrs.get('src')
        if self.current and attrs.get('data-surface-kind'):
            self.kind = attrs['data-surface-kind']
        if self.current and tag == 'dd' and self.kind:
            self.capture = True
            if self.kind in self.plans[self.current]['areas']:
                raise ValueError('Duplicate HTML surface kind')
            self.plans[self.current]['areas'][self.kind] = ''

    def handle_data(self, text):
        if self.capture:
            self.plans[self.current]['areas'][self.kind] += text

    def handle_endtag(self, tag):
        if tag == 'dd':
            self.capture = False
        if tag == 'article':
            self.current, self.kind, self.capture = None, None, False


def expected_surface(area):
    if area['applicable'] is False:
        return 'No incluye'
    if area['valueM2'] is None:
        return 'Por confirmar'
    return f'{area["valueM2"]:.2f}'.replace('.', ',') + ' m²'


def build(root=ROOT):
    root = Path(root)
    raw = (root / 'data/leon-plan-surfaces.json').read_bytes()
    manifest = (root / 'data/brochures-leon.json').read_bytes()
    if hashlib.sha256(raw).hexdigest() != REGISTER_SHA256 or hashlib.sha256(manifest).hexdigest() != MANIFEST_SHA256:
        raise ValueError('Unreviewed source register or document manifest')
    review = json.loads(raw)
    historic = {row['slug']: row['pendientes'] for row in json.loads((root / 'data/registro-fichas.json').read_text())}
    rendered = {}
    for slug in sorted({plan['projectSlug'] for plan in review['plans']}):
        project_plans = RenderedPlans((root / (slug + '.html')).read_text()).plans
        if set(rendered) & set(project_plans):
            raise ValueError('Duplicate HTML plan identifier across projects')
        rendered.update(project_plans)
    ids = [plan['id'] for plan in review['plans']]
    if len(ids) != 36 or len(set(ids)) != 36 or set(ids) != set(rendered):
        raise ValueError('The rendered plan set differs from the 36 reviewed diagrams')
    rows, by_project = [], defaultdict(lambda: {'plans': 0, 'completeSurfaceSets': 0, 'incompleteSurfaceSets': 0})
    for plan in review['plans']:
        actual = rendered[plan['id']]
        expected = {area['kind']: expected_surface(area) for area in plan['areas']}
        if actual['path'] != plan['planPath'] or actual['areas'] != expected:
            raise ValueError('Rendered surface/path mismatch: ' + plan['id'])
        pending = [area['kind'] for area in plan['areas'] if area['applicable'] is not False and area['valueM2'] is None]
        if not plan['identityConfirmed']:
            pending.append('identity')
        if plan['bathrooms'] is None:
            pending.append('bathrooms')
        row = {key: plan[key] for key in ['id', 'projectSlug', 'planPath', 'planSha256', 'status', 'complete',
                                         'identityConfirmed', 'bedrooms', 'bathrooms', 'areas', 'pdf', 'officialUrl', 'checkedOn']}
        row.update({'pendingFields': pending, 'renderedFieldsMatch': True,
                    'evidenceStatus': 'Conciliación de metadata retenida; originales privados no recertificados en P2.'})
        rows.append(row)
        group = by_project[plan['projectSlug']]
        group['plans'] += 1
        group['completeSurfaceSets' if plan['complete'] else 'incompleteSurfaceSets'] += 1
    summary = {'plans': len(rows), 'statusCounts': dict(sorted(Counter(plan['status'] for plan in rows).items())),
               'completeSurfaceSets': sum(plan['complete'] for plan in rows),
               'incompleteSurfaceSets': sum(not plan['complete'] for plan in rows),
               'bathroomsPending': sum(plan['bathrooms'] is None for plan in rows),
               'identityPending': sum(not plan['identityConfirmed'] for plan in rows),
               'byProject': dict(by_project)}
    return {'schemaVersion': 1, 'finding': 'CAT-004', 'reconciledOn': '2026-10-17',
            'specializedReviewDate': review['checkedOn'],
            'sourceSha256': {'data/leon-plan-surfaces.json': REGISTER_SHA256,
                             'data/brochures-leon.json': MANIFEST_SHA256,
                             'data/registro-fichas.json': hashlib.sha256((root / 'data/registro-fichas.json').read_bytes()).hexdigest()},
            'scope': 'Pendientes derivados por campo y plano; no cambia áreas, imágenes, oferta ni pendientes históricos.',
            'summary': summary,
            'historicalProjectPending': {slug: historic[slug] for slug in sorted(by_project)}, 'plans': rows}


def markdown(register):
    summary = register['summary']
    lines = ['# León: conciliación vigente de planos y pendientes', '',
             'CAT-004. Conciliación de metadata: 17/10/2026. Revisión especializada retenida: 14/10/2026.', '',
             'El [registro vigente](registro-vigente.md) conserva las 134 fichas. Esta capa describe sólo los 36 planos León '
             'ya revisados. No modifica los textos históricos de `data/registro-fichas.json`, ni vuelve a certificar '
             'los originales privados ausentes. No acredita disponibilidad comercial.', '',
             '**36 planos: 29 confirmados, 5 discrepantes y 2 pendientes según la revisión retenida.** '
             'Hay 30 conjuntos de superficies completos y 6 incompletos; 3 planos tienen baños pendientes y 1 '
             'tiene identidad de variante pendiente. Son dimensiones distintas: un conjunto completo puede conservar '
             'una discrepancia de fuente, como Gregorio 03.', '',
             'Las 36 rutas y todos los campos de superficies coinciden exactamente con el HTML. Se conserva '
             '`interior` frente a `útil`, la ausencia explícita de terraza y cada valor nulo. No se calcula '
             'terraza por diferencia ni se cierra un pendiente comercial a partir de una superficie.', '',
             'Fuentes y hashes: [ledger derivado](../data/leon-pendientes-vigentes.json), '
             '[registro especializado](../data/leon-plan-surfaces.json) y [manifiesto](../data/brochures-leon.json). '
             'El ledger conserva íntegros los pendientes históricos por proyecto para consultar su alcance anterior.', '',
             '## Estado por proyecto', '', '| Proyecto | Planos | Superficies completas | Incompletas |',
             '| --- | ---: | ---: | ---: |']
    for slug, row in summary['byProject'].items():
        lines.append(f'| [{slug}](../{slug}.html#planos) | {row["plans"]} | {row["completeSurfaceSets"]} | {row["incompleteSurfaceSets"]} |')
    lines += ['', '## Estado por plano', '', '| Plano | Estado retenido | Pendientes actuales por campo | Fuente |',
              '| --- | --- | --- | --- |']
    for row in register['plans']:
        pending = ', '.join(row['pendingFields']) or 'Sin campos pendientes en esta revisión'
        lines.append(f'| {row["id"]} | {row["status"]} | {pending} | [Oficial]({row["officialUrl"]}), PDF p. {row["pdf"]["page"]} |')
    lines += ['', '## Insumos externos para recertificar', '',
              'Solicitar los cinco PDF originales con SHA-256 del manifiesto y las plantas oficiales asociadas '
              'a los 36 identificadores, con acceso a los archivos de evidencia de la revisión. Para los seis '
              'conjuntos incompletos, confirmar explícitamente cada campo listado; para B.Come 02, la variante '
              'exacta; para los tres estudios, el número de baños. La confirmación debe conservar página, '
              'identificador oficial y fecha. Los cinco estados discrepantes no se convierten en confirmados '
              'por coincidir con el HTML.', '',
              'Regenerar: `python scripts/build-leon-pending-register.py`; verificar sin escribir: añadir `--check`.', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    register = build()
    outputs = {'data/leon-pendientes-vigentes.json': json.dumps(register, ensure_ascii=False, indent=2) + '\n',
               'docs/leon-planos-vigentes.md': markdown(register)}
    for path, text in outputs.items():
        if args.check:
            if (ROOT / path).read_text() != text:
                raise SystemExit('Outdated derived ledger: ' + path)
        else:
            (ROOT / path).write_text(text)
    print(json.dumps(register['summary'], ensure_ascii=False))


if __name__ == '__main__':
    main()
