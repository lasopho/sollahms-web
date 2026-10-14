"""Independent exact scope for the requested automatic map/tour migration.

The approved main snapshot defines every published resource. This checker does
not import the production renderer and never strips arbitrary markup to make a
historical test pass. Only the fixed iframe/duplicate-tour changes below can
restore historical bytes.
"""
import functools
from leon_main_scope import read_pre_leon
import hashlib
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from sento_scope import original_data, historical_file
from urllib.parse import parse_qs, urlencode, urlparse
from map_cleanup_scope import transform_map_cleanup
from ecasa_scope import restore_ecasa_page, restore_successor_data

ROOT = Path(__file__).resolve().parents[1]
MAIN = 'f342ae969b53d3e9460803d024b34b06574b294c'
FEATURED = {'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes', 'distrito-centro'}
STYLESHEET = '<link rel="stylesheet" href="/assets/css/project-embeds.css?v=20261012">'
VISTA_UNAVAILABLE_URL = ('https://data.sentiovr.com/spaces/19805/space_1600948559/vtour/tour.html'
                         '?showme=true?showme=true&_ga=2.18944824.1839358211.1767707268-1601151291.1753297916')
# These exact current digests are populated after reviewing the final JS/CSS
# changes. Original main bytes remain the historical comparison input.
REVIEWED_ASSETS = {
    'assets/js/project-embeds.js': (
        '11f2ff3ea00eb8a6c928502dc9feca66e0df2a8db8cbd82fa82133d56e3645e3',
        '6cadb78a917134a654eed695c93d7afe04f629f0fb5bf57d839d74406d11d6bb',
    ),
}


@functools.lru_cache(maxsize=None)
def main_bytes(path):
    return subprocess.check_output(['git', 'show', f'{MAIN}:{path}'], cwd=ROOT)


@functools.lru_cache(maxsize=1)
def records():
    baseline = main_bytes('data/fichas-proyectos.json')
    assert restore_successor_data('data/fichas-proyectos.json', (ROOT / 'data/fichas-proyectos.json').read_bytes()) == json.loads(baseline), 'Historical tour research changed outside the Ecasa successor'
    rows = json.loads(baseline)
    assert len(rows) == 144
    return {row['slug']: row for row in rows}


def retained_tours(slug):
    # The published main has exactly these two historical exclusions. A new
    # provider exception must be separately documented and pinned here.
    tours = [] if slug == 'irarrazaval' else records()[slug]['virtualTours']
    return [tour for tour in tours if (slug, tour['url']) != ('vista-bulnes', VISTA_UNAVAILABLE_URL)]


def esc(value):
    return html.escape(str(value), quote=True)


def approved_frame(url, title, kind):
    parsed = urlparse(url)
    assert parsed.scheme == 'https' and parsed.hostname and not parsed.username and not parsed.password
    if kind == 'map':
        assert parsed.hostname == 'www.google.com' and parsed.path.startswith('/maps')
        query = parse_qs(parsed.query).get('q', [''])[0]
        fallback = 'https://www.google.com/maps/search/?' + urlencode({'api': 1, 'query': query}) if query else url
        wrapper, permission = 'project-embed project-embed-map', 'fullscreen'
    else:
        fallback, wrapper = url, 'project-embed'
        # Preserve the exact four permissions granted by main's original
        # project-embeds.js after activation. Native-lazy scheduling changes
        # when the iframe exists, not the provider's approved capabilities.
        permission = 'fullscreen; xr-spatial-tracking; gyroscope; accelerometer'
        if parsed.hostname == 'panoraven.com':
            permission += '; magnetometer'
    return (f'<div class="{wrapper}"><iframe src="{esc(url)}" title="{esc(title)}" loading="lazy" '
            'referrerpolicy="strict-origin-when-cross-origin" '
            f'allow="{permission}" allowfullscreen data-project-embed="{kind}" '
            f'data-embed-fallback="{esc(fallback)}"></iframe></div>')


def approved_tour_section(slug):
    tours = retained_tours(slug)
    if not tours:
        return ''
    articles = []
    for tour in tours:
        url, title = tour['url'], tour['title']
        if tour['embedStatus'] == 'allowed':
            media = approved_frame(url, title, 'tour')
        else:
            assert slug == 'endemico' and url == 'https://mybakerlab.com/endemico/'
            assert tour['embedStatus'] == 'visual_pending'
            media = ('<p class="project-embed-fallback">'
                     f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">'
                     'Abrir experiencia externa ↗</a></p>')
        articles.append(f'<article class="tour-card"><h3>{esc(title)}</h3>{media}</article>')
    return ('<section id="recorrido" class="detail-section project-tour-section">'
            '<p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>' + ''.join(articles) + '</section>')


def attributes(tag):
    return {key: html.unescape(value) for key, value in re.findall(r'([\w-]+)="([^"]*)"', tag)}


@functools.lru_cache(maxsize=None)
def expected_automatic_file(path):
    original = main_bytes(path).decode()
    if path == 'templates/project-detail.html':
        anchor = '<link rel="stylesheet" href="/assets/css/project-detail.css?v=20261009">\n'
        assert STYLESHEET not in original and original.count(anchor) == 1
        return original.replace(anchor, anchor + '  ' + STYLESHEET + '\n', 1).encode()
    slug = path.removesuffix('.html')
    return transform_automatic_markup(original, slug).encode()


def transform_automatic_markup(original, slug):
    """Apply the fixed edit to a historical expected packaging/fallback page.

    Real current pages separately require exact comparison with main through
    restore_automatic_file; this function only transforms expected fixtures.
    """
    assert slug in records(), 'Only the 144 catalogue fichas are eligible'
    text = original
    # Replace the original map nodes before adding any tour iframe. Query,
    # accessible title and adjacent address/navigation bytes come from main.
    map_patterns = [r'<div class="embed-shell map-shell"><button\b[^>]*>.*?</button></div>',
                    r'<iframe\b(?![^>]*data-project-embed=)[^>]*src="https://www\.google\.com/maps[^>]*>\s*</iframe>']
    for pattern in map_patterns:
        for match in reversed(list(re.finditer(pattern, text, re.S))):
            attrs = attributes(match[0])
            url = attrs.get('data-embed-src') or attrs['src']
            title = attrs.get('data-embed-title') or attrs['title']
            text = text[:match.start()] + approved_frame(url, title, 'map') + text[match.end():]
    section = approved_tour_section(slug)
    if slug in FEATURED:
        # INN/Suecia have one original standalone Matterport container. Its
        # exact bytes can be replaced; mixed galleries/specifications survive.
        marker = 'Recorrido virtual 360°</h2>'
        if marker in text:
            assert slug in {'inn-puerto-chico', 'edificio-suecia'} and text.count(marker) == 1
            start = text.rfind('<div class="space-y-6">', 0, text.index(marker))
            end = text.index('</div>', text.index('</iframe>', start)) + len('</div>')
            block = text[start:end]
            assert start >= 0 and block.count('<iframe') == 1 and '<img' not in block
            assert 'https://my.matterport.com/show/' in block
            text = text[:start] + section + text[end:]
        elif section:
            assert slug == 'plaza-las-condes'
            location = '<div class="space-y-6"><h2 class="label-blue-print text-primary">Ubicación</h2>'
            assert text.count(location) == 1
            text = text.replace(location, section + '\n' + location, 1)
        tour_heading = '<h2>Recorridos y experiencias oficiales</h2>'
        if tour_heading in text:
            assert text.count(tour_heading) == 1
            start = text.index(tour_heading)
            end = text.index('</section>', start)
            block = text[start:end]
            assert '<img' not in block and 'google.com/maps' not in block
            text = text[:start] + text[end:]
    else:
        start_marker = '<section id="recorrido" class="detail-section">'
        if section:
            assert text.count(start_marker) == 1
            start = text.index(start_marker)
            end = text.index('</section>', start) + len('</section>')
            block = text[start:end]
            assert '<img' not in block and 'google.com/maps' not in block
            text = text[:start] + section + text[end:]
        else:
            assert start_marker not in text
    assert STYLESHEET not in text and text.count('</head>') == 1
    preview_end = '<meta name="robots" content="noindex, nofollow">\n</head>'
    if preview_end in text:
        text = text.replace(preview_end, STYLESHEET + '\n' + preview_end, 1)
    else:
        text = text.replace('</head>', STYLESHEET + '\n</head>', 1)
    permitted = sorted({'www.google.com'} | {urlparse(tour['url']).hostname for tour in retained_tours(slug)
                                          if tour['embedStatus'] == 'allowed'})
    host_script = '<script type="application/json" id="project-embed-hosts">' + json.dumps(permitted) + '</script>'
    pattern = r'<script type="application/json" id="project-embed-hosts">.*?</script>'
    assert len(re.findall(pattern, text, re.S)) == 1
    text = re.sub(pattern, lambda _: host_script, text, count=1, flags=re.S)
    return transform_map_cleanup(text, slug)


def restore_automatic_file(path, current):
    """Return main bytes only after validating the actual exact authorized edit."""
    if path.endswith('.html'):
        current = restore_ecasa_page(path, current)
    expected = expected_automatic_file(path)
    assert current == expected, f'{path}: bytes outside exact automatic map/tour scope changed'
    return main_bytes(path)


def restore_automatic_asset(path, current):
    assert path in REVIEWED_ASSETS, 'Unrecognized automatic embed asset'
    before, after = REVIEWED_ASSETS[path]
    original = main_bytes(path)
    assert hashlib.sha256(original).hexdigest() == before, f'{path}: unrecognized original embed asset'
    assert hashlib.sha256(current).hexdigest() == after, f'{path}: unreviewed embed asset mutation'
    return original


if __name__ == '__main__':
    path = sys.argv[1]
    current = historical_file(sys.argv[1], sys.stdin.buffer.read())
    if path == '--transform':
        sys.stdout.buffer.write(transform_automatic_markup(current.decode(), sys.argv[2]).encode())
        sys.exit(0)
    sys.stdout.buffer.write(restore_automatic_asset(path, current) if path in REVIEWED_ASSETS
                            else restore_automatic_file(path, current))
