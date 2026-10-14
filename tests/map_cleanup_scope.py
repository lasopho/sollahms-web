"""Independent exact successor scope for the 144-fiche map cleanup.

The automatic embed and older commercial freezes remain in force. Only an
adjacent registered map anchor, its exact generic caution and obsolete noscript
paragraph may disappear. Address and identity-specific cautions are retained.
"""
import functools
import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'bb69615d03230cbab76bdc2678938cc741f80e86'
FEATURED = {'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes', 'distrito-centro'}
RELATED = {'mapocho-3521-edificio-a', 'froilan-roa-5731-torre-norte',
           'froilan-roa-5731-torre-sur', 'edificio-verne'}
GENERIC_NOTES = (
    'Google Maps determina el marcador por dirección. Confirma el acceso exacto al consultar.',
    'El mapa busca la dirección publicada por la inmobiliaria. La ubicación del marcador la determina Google Maps; confirma el acceso exacto en la fuente oficial.',
    'Mapa de búsqueda de la dirección oficial. Google Maps determina el marcador; confirma el acceso en la fuente original.',
)
NOSCRIPT = '<noscript><p>El enlace a Google Maps permite consultar la ubicación sin JavaScript.</p></noscript>'
FINAL_MAP_MARGIN = b'.project-embed-map:last-child{margin-bottom:0}\n'
MAP_MARGIN_ANCHOR = b'.project-embed-map{aspect-ratio:16/9;min-height:280px;max-height:420px}\n'
GATE_ANCHOR = b'"codex/mapas-recorridos-auto": false'
GATE_ADDITION = b', "codex/limpieza-mapas-fichas": false'


@functools.lru_cache(maxsize=None)
def baseline_bytes(path):
    return subprocess.check_output(['git', 'show', f'{BASELINE}:{path}'], cwd=ROOT)


@functools.lru_cache(maxsize=1)
def catalogue_slugs():
    source = baseline_bytes('data/proyectos.json')
    assert (ROOT / 'data/proyectos.json').read_bytes() == source, 'Map cleanup cannot edit catalogue evidence'
    slugs = {row['slug'] for row in json.loads(source)}
    assert len(slugs) == 144
    return slugs


def transform_map_cleanup(original, slug):
    """Apply only exact adjacent removable nodes to an expected HTML fixture."""
    assert slug in catalogue_slugs(), 'Cleanup applies only to the approved 144 fichas'
    shell_pattern = r'<div class="project-embed project-embed-map"><iframe\b[^>]*></iframe></div>'
    text = original
    for match in reversed(list(re.finditer(shell_pattern, text))):
        frame = match[0]
        fallback = re.search(r'\bdata-embed-fallback="([^"]+)"', frame)
        assert fallback and 'data-project-embed="map"' in frame
        assert html.unescape(fallback[1]).startswith('https://www.google.com/maps/search/?api=1&query=')
        label = 'Abrir dirección relacionada en Google Maps ↗' if slug in RELATED else 'Abrir en Google Maps ↗'
        attributes = (f'href="{fallback[1]}" target="_blank" rel="noopener noreferrer"')
        if slug in FEATURED:
            anchor = f'<p class="text-secondary"><a {attributes}>{label}</a></p>'
            note_class = 'text-secondary text-sm'
        else:
            anchor = f'<a class="button button-outline" {attributes}>{label}</a>'
            note_class = 'map-note'
        suffix = text[match.end():]
        # These are literal complete nodes. A changed destination, title,
        # attribute or wrapper is never silently normalized by the audit.
        removed = 0
        if suffix.startswith(anchor):
            removed += len(anchor)
        remainder = suffix[removed:]
        for note in GENERIC_NOTES:
            paragraph = f'<p class="{note_class}">{note}</p>'
            if remainder.startswith(paragraph):
                removed += len(paragraph)
                break
        if suffix[removed:].startswith(NOSCRIPT):
            removed += len(NOSCRIPT)
        text = text[:match.end()] + text[match.end() + removed:]
    return text


def expected_cleanup_file(path):
    assert path.endswith('.html') and path.removesuffix('.html') in catalogue_slugs()
    return transform_map_cleanup(baseline_bytes(path).decode(), path.removesuffix('.html')).encode()


def restore_map_cleanup_asset(path, current):
    """Restore only after byte-exact verification of the tiny style/gate edits."""
    if path == 'scripts/package-vercel.mjs':
        from norte_verde_hero_scope import restore_norte_verde_hero_packager
        current = restore_norte_verde_hero_packager(current)
    if path == 'vercel.json':
        gate = b', \"codex/norte-verde-hero-merge\": false'
        assert current.count(gate) == 1, 'Protected hero review deployment gate must remain false'
        current = current.replace(gate, b'', 1)
    original = baseline_bytes(path)
    if path == 'assets/css/project-embeds.css':
        assert original.count(MAP_MARGIN_ANCHOR) == 1 and FINAL_MAP_MARGIN not in original
        expected = original.replace(MAP_MARGIN_ANCHOR, MAP_MARGIN_ANCHOR + FINAL_MAP_MARGIN, 1)
    elif path == 'vercel.json':
        assert original.count(GATE_ANCHOR) == 1 and GATE_ADDITION not in original
        expected = original.replace(GATE_ANCHOR, GATE_ANCHOR + GATE_ADDITION, 1)
    elif path == 'scripts/package-vercel.mjs':
        anchor = b"'codex/mapas-recorridos-auto'"
        addition = b", 'codex/limpieza-mapas-fichas'"
        assert original.count(anchor) == 1 and addition not in original
        expected = original.replace(anchor, anchor + addition, 1)
    else:
        raise AssertionError('Unrecognized cleanup asset')
    assert current == expected, f'{path}: bytes outside the exact map cleanup changed'
    return original


if __name__ == '__main__':
    sys.stdout.buffer.write(restore_map_cleanup_asset(sys.argv[1], sys.stdin.buffer.read()))
