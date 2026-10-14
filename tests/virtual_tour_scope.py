"""Independent, byte-exact exception for the authorized virtual-tour removal.

Historical audits may restore their approved source only after checking the real
file against the exact removal. No production renderer is imported here.
"""
import functools
from leon_main_scope import read_pre_leon
import json
import re
import subprocess
import sys
from pathlib import Path
from sento_scope import original_data, historical_file
from automatic_embed_scope import restore_automatic_file

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '3f7b7e481e632e06d36702f556f6f2bca61bc55b'
VISTA_UNAVAILABLE_URL = ('https://data.sentiovr.com/spaces/19805/space_1600948559/vtour/tour.html'
                         '?showme=true?showme=true&_ga=2.18944824.1839358211.1767707268-1601151291.1753297916')
VISTA_UNAVAILABLE_CARD = (
    '<article class="tour-card"><h3>Recorrido virtual de Vista Bulnes</h3>'
    '<div class="pending-panel"><p>La disponibilidad de esta experiencia está pendiente de confirmación con el proveedor.</p>'
    '<a class="button button-outline" href="' + VISTA_UNAVAILABLE_URL.replace('&', '&amp;') + '" target="_blank" rel="noopener noreferrer">Consultar experiencia oficial ↗</a></div>'
    '<div class="embed-caption"><a href="' + VISTA_UNAVAILABLE_URL.replace('&', '&amp;') + '" target="_blank" rel="noopener noreferrer">Abrir recorrido original ↗</a></div></article>'
)
ENDEMICO_EXTERNAL_BUTTON = ('<a class="button button-outline" href="https://mybakerlab.com/endemico/" '
                           'target="_blank" rel="noopener noreferrer">Consultar experiencia oficial ↗</a>')
ENDEMICO_PENDING_CONTAINER = (
    '<div class="pending-panel"><p>La disponibilidad de esta experiencia está pendiente de confirmación con el proveedor.</p>'
    + ENDEMICO_EXTERNAL_BUTTON + '</div>'
)


@functools.lru_cache(maxsize=None)
def approved_bytes(path):
    return subprocess.check_output(['git', 'show', f'{BASELINE}:{path}'], cwd=ROOT)


@functools.lru_cache(maxsize=1)
def removal_slugs():
    original = approved_bytes('data/fichas-proyectos.json')
    assert historical_file('data/fichas-proyectos.json', read_pre_leon('data/fichas-proyectos.json')) == original, 'Tour research must remain byte exact'
    records = json.loads(original)
    absent = {row['slug'] for row in records if not row.get('virtualTours')}
    assert len(records) == 144 and len(absent) == 82
    irarrazaval = next(row for row in records if row['slug'] == 'irarrazaval')
    assert len(irarrazaval['virtualTours']) == 1 and irarrazaval['virtualTours'][0].get('identityLimitation')
    return absent | {'irarrazaval'}


def exact_removed_page(original, slug):
    removed = removal_slugs()
    # These two literal exceptions preserve every other byte in the 61 tour
    # fichas. Neither the production policy nor its renderer defines this scope.
    if slug == 'endemico':
        expected = original.decode()
        assert expected.count(ENDEMICO_PENDING_CONTAINER) == 1
        return expected.replace(ENDEMICO_PENDING_CONTAINER, ENDEMICO_EXTERNAL_BUTTON, 1).encode()
    if slug == 'vista-bulnes':
        expected = original.decode()
        assert expected.count(VISTA_UNAVAILABLE_CARD) == 1
        return expected.replace(VISTA_UNAVAILABLE_CARD, '', 1).encode()
    if slug not in removed:
        return original
    text = original.decode()
    if slug == 'distrito-centro':
        pattern = r'<h2\b[^>]*>\s*Recorridos y experiencias oficiales\s*</h2>.*?(?=<h2\b|</section>)'
        matches = list(re.finditer(pattern, text, re.S | re.I))
        assert len(matches) == 1 and not re.search(r'<(?:iframe|img)\b', matches[0][0], re.I)
        text = text[:matches[0].start()] + text[matches[0].end():]
    else:
        # The only whitespace exception is the exact eight-space indent of
        # the removed section's dedicated line. Its newline remains intact.
        section = list(re.finditer(r'(?:^ {8})?<section\b[^>]*\bid=["\']recorrido["\'][^>]*>.*?</section>', text, re.S | re.I | re.M))
        nav = list(re.finditer(r'<a\b[^>]*\bhref=["\']#recorrido["\'][^>]*>.*?</a>', text, re.S | re.I))
        assert len(section) == len(nav) == 1, f'{slug}: fixed approved tour block/navigation required'
        block = section[0][0]
        assert not re.search(r'<img\b|google\.com/maps|/assets/[^"\']+\.(?:pdf|webp|jpg|png)', block, re.I), f'{slug}: other media cannot enter removal scope'
        if slug != 'irarrazaval':
            assert not re.search(r'<iframe\b|data-embed-src|https://', block, re.I), f'{slug}: absent tour block contains a resource'
        for match in sorted([section[0], nav[0]], key=lambda item: item.start(), reverse=True):
            text = text[:match.start()] + text[match.end():]
        if slug == 'edificio-verne':
            office_row = ('<div><dt>Recorrido virtual de oficinas</dt>'
                          '<dd>Consulta la disponibilidad de un recorrido virtual de oficinas.</dd></div>')
            assert text.count(office_row) == 1
            text = text.replace(office_row, '', 1)
    return text.encode()


def restore_reviewed_file(path, current):
    """Return approved bytes only after exact authorized-diff verification."""
    current = restore_automatic_file(path, current)
    original = approved_bytes(path)
    if path == 'templates/project-detail.html':
        nav = b'<a href="#recorrido">Recorrido virtual</a>'
        section = b'<section id="recorrido" class="detail-section"><p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>$tours</section>'
        assert original.count(nav) == original.count(section) == 1
        expected = original.replace(nav, b'$tour_navigation').replace(section, b'$tour_section')
    else:
        expected = exact_removed_page(original, path.removesuffix('.html'))
    assert current == expected, f'{path}: bytes outside the exact authorized virtual-tour removal changed'
    return original


@functools.lru_cache(maxsize=1)
def historical_commercial_renderer():
    namespace = {}
    exec(compile(approved_bytes('scripts/fiche_presentation.py'), 'approved-fiche-presentation.py', 'exec'), namespace)
    return namespace['commercialize_fiche']


if __name__ == '__main__':
    content = historical_file(sys.argv[1], sys.stdin.buffer.read())
    sys.stdout.buffer.write(exact_removed_page(content, sys.argv[2]) if sys.argv[1] == '--remove'
                            else restore_reviewed_file(sys.argv[1], content))
