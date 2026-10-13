"""Exact Ecasa successor to the historical map/tour/commercial freezes.

Brochure blocks retain an exact public fallback. Reviewed names, linked stages,
locality and the Núcleo stage-2 tour relocation are exact exceptions; all other
developers stay byte-identical.
"""
import functools
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026'
REVIEWED_OUTPUT = ROOT / 'tests/ecasa-reviewed-output.json'
RETIRED = {'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center'}
ADDED = {'alto-san-joaquin-2', 'alto-san-joaquin-3', 'terratolten-2', 'nucleo-costanera-2'}
RENAMES = {'edificio-bezanilla': ('Edificio Bezanilla', 'Bezanilla'),
           'wayra': ('Wayra', 'Edificio Wayra'), 'endemico': ('Endémico Pichilemu', 'Endémico')}
GROUPS = {'lomas-de-puyai': ['lomas-de-puyai', 'lomas-de-puyai-3'],
          'ferroparque': ['ferroparque', 'ferroparque-2'],
          'terratolten-1': ['terratolten-1', 'terratolten-2', 'terratolten-3'],
          'alto-san-joaquin': ['alto-san-joaquin', 'alto-san-joaquin-2', 'alto-san-joaquin-3'],
          'nucleo-costanera': ['nucleo-costanera', 'nucleo-costanera-2']}

@functools.lru_cache(maxsize=None)
def main_bytes(path):
    return subprocess.check_output(['git', 'show', f'{MAIN}:{path}'], cwd=ROOT)

def validate_successor_data(path, actual=None):
    current = json.loads(actual if actual is not None else (ROOT / path).read_bytes())
    base = json.loads(main_bytes(path))
    projects = json.loads((ROOT / 'data/proyectos.json').read_bytes())
    old_projects = json.loads(main_bytes('data/proyectos.json'))
    others = {p['slug'] for p in old_projects if p['inmobiliaria'] != 'Ecasa'}
    expected = {p['slug'] for p in old_projects} - RETIRED | ADDED
    assert len(current) == len({r['slug'] for r in current}) == 143
    assert {r['slug'] for r in current} == expected
    assert [r for r in current if r['slug'] in others] == [r for r in base if r['slug'] in others], path + ': non-Ecasa evidence changed'
    assert len([p for p in projects if p['inmobiliaria'] == 'Ecasa']) == 22
    lookup = {p['slug']: p for p in projects}
    for p in old_projects:
        if p['inmobiliaria'] == 'Ecasa' and p['slug'] not in RETIRED:
            for key in ['precioDesdeUF', 'estado', 'entrega']:
                assert lookup[p['slug']].get(key) == p.get(key), p['slug'] + ': current commercial value changed'
    for slug in ADDED:
        for key in ['precioDesdeUF', 'estado', 'entrega']:
            assert lookup[slug].get(key) is None, slug + ': no accredited commercial source received'
    return current

def restore_successor_data(path, actual):
    current = validate_successor_data(path, actual)
    base = json.loads(main_bytes(path))
    old_ecasa = {p['slug'] for p in json.loads(main_bytes('data/proyectos.json')) if p['inmobiliaria'] == 'Ecasa'}
    by_slug = {row['slug']: row for row in current}
    return [row if row['slug'] in old_ecasa else by_slug[row['slug']] for row in base]

def public_fallback(text):
    for start, end in [('ECASA_PREVIEW_START', 'ECASA_PREVIEW_END'), ('ECASA_PUBLIC_START', 'ECASA_PUBLIC_END')]:
        assert text.count('<!--' + start + '-->') == text.count('<!--' + end + '-->'), 'Unpaired Ecasa packaging marker'
    text = re.sub(r'<!--ECASA_PREVIEW_START-->.*?<!--ECASA_PREVIEW_END-->', '', text, flags=re.S)
    return re.sub(r'<!--ECASA_PUBLIC_START-->(.*?)<!--ECASA_PUBLIC_END-->', lambda m: m[1], text, flags=re.S)

def expected_ecasa_page(slug):
    text = main_bytes(slug + '.html').decode()
    if slug in RENAMES:
        old, new = RENAMES[slug]
        text = re.sub(r'(?<![\w/-])Wayra(?![\w/-])', new, text) if slug == 'wayra' else text.replace(old, new)
    if slug in {'endemico', 'lomas-de-puyai-3'}:
        assert text.count('Ecasa (por confirmar)') == (3 if slug == 'endemico' else 4)
        text = text.replace('Ecasa (por confirmar)', 'Ecasa')
    if slug == 'lomas-de-puyai-3':
        text = text.replace('<p class="hero-location">Ubicación por confirmar</p>', '<p class="hero-location">Papudo, Valparaíso</p>')
        for label, value in [('Comuna', 'Papudo'), ('Región', 'Valparaíso')]:
            old = '<div><dt>' + label + '</dt><dd><span class="pending">Por confirmar</span></dd></div>'
            assert text.count(old) == 1
            text = text.replace(old, '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>')
        text = text.replace('<h2>Dirección por confirmar</h2>', '<h2>Papudo</h2>')
        text = text.replace('<p>Ubicación por confirmar</p>', '<p>Papudo, Valparaíso</p>')
    if slug == 'nucleo-costanera':
        # The live provider title and the native Play scene identify stage 2.
        # Remove exactly this existing tour; its bytes remain on the new route.
        tour = re.search(r'<section id="recorrido".*?</section>', text, re.S)
        assert tour and 'https://tourvirtuales360.cl/pano/ecasa_/nucleo_pilotos/' in tour[0]
        text = text.replace('        ' + tour[0], '', 1)
        assert text.count('<a href="#recorrido">Recorrido virtual</a>') == 1
        text = text.replace('<a href="#recorrido">Recorrido virtual</a>', '', 1)
        text = text.replace('["tourvirtuales360.cl", "www.google.com"]', '["www.google.com"]', 1)
    for parent, stages in GROUPS.items():
        if slug not in stages:
            continue
        base_names = {p['slug']: p['nombre'] for p in json.loads(main_bytes('data/proyectos.json'))}
        base_names.update({'alto-san-joaquin-2': 'Alto San Joaquín 2', 'alto-san-joaquin-3': 'Alto San Joaquín 3', 'terratolten-2': 'Terratoltén 2', 'nucleo-costanera-2': 'Núcleo Costanera 2'})
        links = '<div class="project-stages" data-project-matrix="' + parent + '"><h3>Etapas de este desarrollo</h3><ul>'
        for stage in stages:
            current = ' aria-current="page"' if stage == slug else ''
            links += '<li><a href="/' + stage + '.html"' + current + '>' + base_names[stage] + '</a></li>'
        links += '</ul><p>Consulta los precios, la disponibilidad y las características de cada etapa en su ficha.</p></div>'
        match = re.search(r'<section id="caracteristicas"[^>]*>.*?</section>', text, re.S)
        assert match
        text = text[:match.start()] + match[0].replace('</section>', links + '</section>') + text[match.end():]
    return text.encode()

def restore_ecasa_page(path, current):
    slug = path.removesuffix('.html')
    old_ecasa = {p['slug'] for p in json.loads(main_bytes('data/proyectos.json')) if p['inmobiliaria'] == 'Ecasa'}
    if slug not in old_ecasa:
        return current
    assert slug not in RETIRED, slug + ': retired route returned'
    if REVIEWED_OUTPUT.is_file():
        reviewed = json.loads(REVIEWED_OUTPUT.read_text())
        assert hashlib.sha256((ROOT / 'data/brochures-ecasa.json').read_bytes()).hexdigest() == reviewed['manifestSha256'], 'Ecasa reviewed manifest changed'
        assert hashlib.sha256(current).hexdigest() == reviewed['htmlSha256'][path], slug + ': reviewed Ecasa output changed'
    expected = expected_ecasa_page(slug)
    assert public_fallback(current.decode()).encode() == expected, slug + ': bytes outside authorized Ecasa names/stages/brochure blocks changed'
    return main_bytes(path)

if __name__ == '__main__':
    import sys
    content = sys.stdin.buffer.read()
    if sys.argv[1] == '--data':
        sys.stdout.write(json.dumps(restore_successor_data(sys.argv[2], content), ensure_ascii=False))
    else:
        sys.stdout.buffer.write(restore_ecasa_page(sys.argv[1], content))
