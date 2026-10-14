"""Restore historical evidence only after checking the exact authorized addition."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NORDICO = 'edificio-nordico'


def original_html(text):
    for kind in ['PREVIEW', 'PUBLIC']:
        assert text.count('<!--LEBEN_' + kind + '_START-->') == text.count('<!--LEBEN_' + kind + '_END-->'), 'Unpaired Leben source marker'
    text = re.sub(r'<!--LEBEN_PREVIEW_START-->[\s\S]*?<!--LEBEN_PREVIEW_END-->', '', text)
    text = re.sub(r'<!--LEBEN_PUBLIC_START-->([\s\S]*?)<!--LEBEN_PUBLIC_END-->', lambda match: match[1], text)
    from sento_scope import original_html as original_sento_html
    return original_sento_html(text)


def original_context(data):
    text = data.decode()
    pattern = r'(export const projects = Object\.freeze\()([\s\S]*?)(\);)'
    match = re.search(pattern, text)
    assert match, 'Trusted project context registry is missing'
    entries = json.loads(match[2])
    nordico = entries.pop(NORDICO, None)
    if nordico is None:
        return data
    assert nordico == {'name': 'Edificio Nórdico', 'url': '/edificio-nordico.html'}, 'Unexpected Nórdico context'
    return (text[:match.start(2)] + json.dumps(entries, ensure_ascii=False, indent=2) + text[match.end(2):]).encode()


def assert_base_records(current, expected, path):
    nordico = [row for row in current if row['slug'] == NORDICO]
    assert len(nordico) == 1 and len(current) == 137 and len({row['slug'] for row in current}) == 137, path + ': expected the 136 preserved identities plus Nórdico'
    row = nordico[0]
    if path == 'data/proyectos.json':
        assert row['inmobiliaria'] == 'Leben' and row['detalleUrl'] == '/edificio-nordico.html'
        assert row['verificacion']['fuente'] == 'https://nordico.ileben.cl/' and row['verificacion']['estadoFuente'] == 'verified'
    elif path == 'data/fichas-proyectos.json':
        assert row['sourceUrl'] == 'https://nordico.ileben.cl/' and row['sourceStatus'] == 'verified'
    else:
        assert row['nombre'] == 'Edificio Nórdico' and row['detalleUrl'] == '/edificio-nordico.html'
    preserved = [row for row in current if row['slug'] != NORDICO]
    assert preserved == expected, path + ': existing 136 source objects changed'
    return current


def original_image_sources(current, expected):
    sources = json.loads(current)
    nordico = {url: item for url, item in sources.items() if url.startswith('https://nordico.ileben.cl/')}
    assert len(nordico) == 3 and all(item['sourceUrl'] == 'https://nordico.ileben.cl/' for item in nordico.values())
    assert {url: item for url, item in sources.items() if url not in nordico} == json.loads(expected), 'Historical official image evidence changed'
    return expected
