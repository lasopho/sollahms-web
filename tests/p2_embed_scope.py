"""Exact test-only restoration before frozen historical embed assertions."""
import functools
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SCOPE_BYTES = (ROOT / 'tests/p2-embed-scope.json').read_bytes()
assert hashlib.sha256(SCOPE_BYTES).hexdigest() == '3af4037b7e9f6b1a79e1cc0fdfef643a453d38135bce10996de28043c4aa0cca', 'P2 embed review scope changed'
SCOPE = json.loads(SCOPE_BYTES)['files']
assert len(SCOPE) == 135


@functools.lru_cache(maxsize=256)
def restore_p2_embed_file(path, current):
    record = SCOPE.get(path)
    if not record:
        return current
    digest = hashlib.sha256(current).hexdigest()
    if digest == record['beforeSha256']:
        return current
    assert digest == record['afterSha256'], 'Unreviewed P2 embed file: ' + path
    before = subprocess.check_output(['git', 'cat-file', 'blob', record['beforeBlob']], cwd=ROOT)
    assert hashlib.sha256(before).hexdigest() == record['beforeSha256'], 'P2 embed original blob differs: ' + path
    return before


def restore_generated_embed_alternatives(page):
    """Validate each exact inserted link before older generator assertions.

    Real files always use full-file hash validation above. For generated
    fixtures only this literal adjacent addition is projected; all remaining
    markup is retained for the historical assertions, including iframe attrs.
    """
    wrapper = r'(<div class="project-embed(?: project-embed-map)?"><iframe\b[^>]*data-project-embed=["\'][^>]*></iframe></div>)'
    alternative = r'(<p class="project-embed-fallback project-embed-alternative" data-project-embed-alternative>.*?</p>)'
    def restore(match):
        attrs = {key: html.unescape(value) for key, value in re.findall(r'([\w-]+)="([^"]*)"', match[1])}
        assert attrs['data-project-embed'] in {'map', 'tour'}
        label = 'Abrir en Google Maps' if attrs['data-project-embed'] == 'map' else 'Abrir experiencia externa'
        esc = lambda value: html.escape(value, quote=True)
        expected = ('<p class="project-embed-fallback project-embed-alternative" data-project-embed-alternative>'
                    f'<a href="{esc(attrs["data-embed-fallback"])}" target="_blank" rel="noopener noreferrer" '
                    f'aria-label="{esc(label + " (nueva pestaña)")}">{label} ↗</a></p>')
        assert match[2] == expected, 'Generated P2 alternative differs from its iframe destination'
        return match[1]
    projected = re.sub(wrapper + alternative, restore, page)
    assert 'data-project-embed-alternative' not in projected, 'Unpaired P2 alternative'
    return projected
