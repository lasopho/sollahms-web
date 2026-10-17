#!/usr/bin/env python3
"""Build a dated, commit-bound catalogue register without changing source data."""
import argparse
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE_PATHS = {'/', '/proyectos.html', '/agenda-asesoria.html', '/contacto.html',
              '/privacidad.html', '/comparador-hipotecario.html'}
INPUTS = ('data/proyectos.json', 'data/fichas-proyectos.json',
          'data/registro-fichas.json', 'lib/project-context.mjs', 'sitemap.xml')


class Source:
    def __init__(self, root, commit=None):
        self.root, self.commit = Path(root), commit

    def read(self, path):
        if self.commit:
            return subprocess.check_output(['git', 'show', self.commit + ':' + path], cwd=self.root)
        return (self.root / path).read_bytes()

    def json(self, path):
        return json.loads(self.read(path))


class Media(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.images, self.plans, self.maps = [], [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        item = dict(attrs)
        if tag == 'img':
            self.images.append(item)
            # Require a resource identifier or a label for an architectural
            # diagram. Scene descriptions may mention plants or foregrounds.
            name = urlsplit(item.get('src', '')).path.rsplit('/', 1)[-1]
            marked_path = re.match(r'^(?:planos?(?:[-_.\d]|$)|floor[-_]?plans?(?:[-_.\d]|$)|plantas?[-_]arquitect[oó]nicas?(?:[-_.\d]|$))', name, re.I)
            marked_alt = re.match(r'^\s*(?:planos?\b|plantas?\s+(?:arquitect[oó]nicas?|de\s+distribuci[oó]n|tipo)\b|floor[\s_-]*plans?\b)', item.get('alt', ''), re.I)
            if marked_path or marked_alt:
                self.plans.append(item)
        if tag == 'iframe' and 'google.com/maps' in item.get('src', ''):
            self.maps.append(item['src'])


def unique_slugs(rows, label):
    slugs = [row['slug'] for row in rows]
    if len(slugs) != len(set(slugs)):
        raise ValueError('Duplicate slugs in ' + label)
    return set(slugs)


def unique_object(pairs):
    result = dict(pairs)
    if len(result) != len(pairs):
        raise ValueError('Duplicate key in form context')
    return result


def build(source, commit, checked_on):
    projects = source.json(INPUTS[0])
    research = source.json(INPUTS[1])
    register = source.json(INPUTS[2])
    context_text = source.read(INPUTS[3]).decode()
    match = re.search(r'export const projects = Object\.freeze\((\{.*?\})\);', context_text, re.S)
    if not match:
        raise ValueError('Project form context is not the expected generated JSON object')
    context = json.loads(match[1], object_pairs_hook=unique_object)
    sitemap = ET.fromstring(source.read(INPUTS[4]))
    locations = [node.text for node in sitemap.findall('{*}url/{*}loc')]
    if any(urlsplit(url).scheme != 'https' or urlsplit(url).netloc != 'sollahms.cl' for url in locations):
        raise ValueError('Unexpected sitemap origin')
    project_paths = [urlsplit(url).path for url in locations if urlsplit(url).path not in SITE_PATHS]
    if len(project_paths) != len(set(project_paths)):
        raise ValueError('Duplicate project paths in sitemap')
    paths = [project['detalleUrl'] for project in projects]
    if len(paths) != len(set(paths)):
        raise ValueError('Duplicate catalogue detail paths')
    slugs = unique_slugs(projects, 'catalogue')
    comparisons = {}
    for label, actual in [('research', unique_slugs(research, 'research')),
                          ('register', unique_slugs(register, 'register')),
                          ('formContext', set(context)),
                          ('sitemap', {path.removeprefix('/').removesuffix('.html') for path in project_paths})]:
        comparisons[label] = {'count': len(actual), 'missing': sorted(slugs - actual), 'extra': sorted(actual - slugs)}
        if actual != slugs:
            raise ValueError('Catalogue slug mismatch: ' + label)
    by_register = {item['slug']: item for item in register}
    rows = []
    for project in projects:
        slug, path = project['slug'], project['detalleUrl']
        if path != '/' + slug + '.html' or context[slug]['url'] != path:
            raise ValueError('Unexpected project route: ' + slug)
        media = Media(source.read(path.lstrip('/')).decode())
        record = by_register[slug]
        rows.append({'slug': slug, 'name': project['nombre'], 'developer': project['inmobiliaria'],
                     'detailUrl': path, 'htmlPresent': True,
                     'retainedReviewDate': record.get('fechaRevision'),
                     'retainedSource': record.get('fuente'),
                     'historicalPending': record.get('pendientes', []),
                     'htmlImages': len(media.images), 'htmlPlanImages': len(media.plans),
                     'htmlMaps': media.maps})
    return {'schemaVersion': 1, 'finding': 'CAT-001', 'checkedOn': checked_on,
            'sourceCommit': commit,
            'scope': 'Identidades y DOM del commit fuente; no certifica vigencia comercial, derechos ni publicación.',
            'sourceSha256': {path: hashlib.sha256(source.read(path)).hexdigest() for path in INPUTS},
            'summary': {'projects': len(rows), 'developers': dict(sorted(Counter(row['developer'] for row in rows).items())),
                        'htmlFiles': len(rows), 'withHistoricalPending': sum(bool(row['historicalPending']) for row in rows),
                        'withPlanImages': sum(bool(row['htmlPlanImages']) for row in rows),
                        'withoutPlanImages': sum(not row['htmlPlanImages'] for row in rows),
                        'withMaps': sum(bool(row['htmlMaps']) for row in rows),
                        'mapIframes': sum(len(row['htmlMaps']) for row in rows)},
            'slugComparisons': comparisons, 'projects': rows}


def markdown(register):
    summary = register['summary']
    lines = ['# Registro vigente de fichas Sollahms', '',
             f'Corte: {register["checkedOn"]} (America/Santiago). Commit fuente: `{register["sourceCommit"]}`.', '',
             'El commit fuente local contiene el árbol revisado en P1; su SHA no debe confundirse con el '
             'commit remoto del PR #9, creado mediante GitHub. La entrega P1 conserva la correspondencia de árboles.', '',
             f'**{summary["projects"]} proyectos, {summary["htmlFiles"]} HTML y {len(summary["developers"])} inmobiliarias.** '
             'Los conjuntos de slugs de catálogo, investigación, registro, contexto de formularios y sitemap coinciden sin duplicados.', '',
             'Este inventario reemplaza únicamente los conteos de cabecera históricos de 148/144/137. '
             'Las auditorías y evidencias anteriores se conservan. Las etapas comerciales agrupadas no son fichas adicionales.', '',
             f'{summary["withHistoricalPending"]} fichas conservan pendientes históricos. Una ficha sin pendientes históricos no '
             'demuestra precio, stock, entrega o derechos vigentes. No se cambian datos comerciales ni se cierran pendientes de fuente.', '',
             'La [conciliación vigente de planos León](leon-planos-vigentes.md) separa la revisión especializada del 14/10 '
             'de los textos genéricos anteriores. Los [insumos multimedia pendientes](p2-insumos-multimedia.md) '
             'describen MED-003 y MED-004.', '',
             'Fuente máquina y hashes: [data/registro-vigente.json](../data/registro-vigente.json). '
             'Regeneración desde el commit fuente: `python scripts/build-current-register.py '
             f'--source-commit {register["sourceCommit"]} --checked-on {register["checkedOn"]}`.', '',
             '## Conteos por inmobiliaria', '', '| Inmobiliaria | Fichas |', '| --- | ---: |']
    lines.extend(f'| {name} | {count} |' for name, count in summary['developers'].items())
    lines += ['', '## Inventario', '', '| Slug / ficha | Inmobiliaria | Revisión retenida | Pendientes históricos |',
              '| --- | --- | --- | ---: |']
    for row in register['projects']:
        lines.append(f'| [{row["slug"]}](..{row["detailUrl"]}) | {row["developer"]} | '
                     f'{row["retainedReviewDate"] or "Sin fecha"} | {len(row["historicalPending"])} |')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--checked-on', required=True)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.source_commit):
        parser.error('Use a complete immutable commit SHA')
    register = build(Source(ROOT, args.source_commit), args.source_commit, args.checked_on)
    outputs = {'data/registro-vigente.json': json.dumps(register, ensure_ascii=False, indent=2) + '\n',
               'docs/registro-vigente.md': markdown(register)}
    for name, value in outputs.items():
        if args.check:
            if (ROOT / name).read_text() != value:
                raise SystemExit('Outdated derived register: ' + name)
        else:
            (ROOT / name).write_text(value)
    print(json.dumps({'sourceCommit': args.source_commit, 'summary': register['summary']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
