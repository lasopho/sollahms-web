"""Automatic, native-lazy embeds without changing historical research.

Only registered HTTPS experiences whose embedding was accredited are inserted.
Cross-origin iframe load events cannot prove that a scene rendered, so runtime
code never infers success or failure from a timer or a generic load event.
"""
import html
import json
import re
from urllib.parse import parse_qs, urlencode, urlparse

from virtual_tour_policy import secure_url, virtual_tours_to_render


SHARED_STYLESHEET = '<link rel="stylesheet" href="/assets/css/project-embeds.css?v=20261012">'
SHARED_SCRIPT = '<script src="/assets/js/project-embeds.js" defer></script>'
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}
MATTERPORT_HOSTS = {'my.matterport.com', 'mpembed.com'}


def esc(value):
    return html.escape(str(value), quote=True)


def permitted_tour(tour):
    """An allowed research decision is required; HTTPS alone is insufficient."""
    return bool(secure_url(tour.get('url')) and secure_url(tour.get('sourceUrl'))
                and tour.get('embedStatus') == 'allowed')


def iframe_permissions(url, kind='tour'):
    if kind == 'map':
        return 'fullscreen'
    host = urlparse(url).hostname
    # Preserve the original site's tour permissions: providers may consult XR
    # even when the visible scene does not expose a VR control. Panoraven's
    # official embed additionally delegates its mobile/VR compass sensor.
    # Camera, microphone and autoplay are not delegated.
    return ('fullscreen; xr-spatial-tracking; gyroscope; accelerometer' +
            ('; magnetometer' if host == 'panoraven.com' else ''))


def iframe_markup(url, title, *, kind='tour', permitted_hosts=(), fallback_url=None):
    url = secure_url(url)
    if not url or urlparse(url).hostname not in set(permitted_hosts):
        raise ValueError('An embed must use an explicitly permitted HTTPS host')
    fallback_url = secure_url(fallback_url) or url
    modifier = ' project-embed-map' if kind == 'map' else ''
    return (f'<div class="project-embed{modifier}"><iframe src="{esc(url)}" '
            f'title="{esc(title)}" loading="lazy" '
            'referrerpolicy="strict-origin-when-cross-origin" '
            f'allow="{iframe_permissions(url, kind)}" allowfullscreen '
            f'data-project-embed="{kind}" data-embed-fallback="{esc(fallback_url)}">'
            '</iframe></div>')


def map_markup(url, title):
    parsed = urlparse(secure_url(url) or '')
    if parsed.hostname != 'www.google.com' or not parsed.path.startswith('/maps'):
        raise ValueError('Maps must use the registered Google Maps embed endpoint')
    query = parse_qs(parsed.query).get('q', [''])[0]
    fallback = ('https://www.google.com/maps/search/?' +
                urlencode({'api': 1, 'query': query})) if query else url
    return iframe_markup(url, title, kind='map', permitted_hosts={'www.google.com'}, fallback_url=fallback)


def tour_identity(url):
    parsed = urlparse(url)
    model = parse_qs(parsed.query).get('m', [None])[0]
    return ('matterport', model) if parsed.hostname in MATTERPORT_HOSTS and model else ('url', url)


def unique_tours(research):
    seen = set()
    for tour in virtual_tours_to_render(research):
        identity = tour_identity(tour['url'])
        if identity not in seen:
            seen.add(identity)
            yield tour


def tour_articles(research):
    articles = []
    for tour in unique_tours(research):
        url = tour['url']
        title = tour.get('title') or 'Recorrido virtual oficial'
        if permitted_tour(tour):
            media = iframe_markup(url, title, permitted_hosts={urlparse(url).hostname})
        else:
            # A registered alternative may still await visual accreditation.
            # Preserve it outside an empty iframe while the verified tour works.
            media = ('<p class="project-embed-fallback">'
                     f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">'
                     'Abrir experiencia externa ↗</a></p>')
        articles.append(f'<article class="tour-card"><h3>{esc(title)}</h3>{media}</article>')
    return ''.join(articles)


def tour_section(research):
    articles = tour_articles(research)
    return ('<section id="recorrido" class="detail-section project-tour-section">'
            '<p class="eyebrow">Explora los espacios</p><h2>Recorrido virtual</h2>' +
            articles + '</section>') if articles else ''


def embed_hosts(research):
    return sorted({'www.google.com'} | {urlparse(tour['url']).hostname
                  for tour in unique_tours(research) if permitted_tour(tour)})


def attributes(tag):
    return {key.lower(): html.unescape(value) for key, _, value in
            re.findall(r'([\w-]+)\s*=\s*(["\'])(.*?)\2', tag, re.S)}


def normalize_page_embeds(page, research, featured=False):
    """Migrate just map/tour markup and the shared stylesheet, idempotently.

    Never regenerate other fiche content, galleries, prices, forms or ledgers.
    The caller validates catalogue/research coverage before writing HTML.
    """
    section = tour_section(research)
    if featured:
        # The original INN/Suecia block and appended tour links describe the same
        # registered experiences. Keep every unique title in one section.
        legacy = (r'<div\b[^>]*\bclass=["\']space-y-6["\'][^>]*>\s*'
                  r'<h2\b[^>]*>\s*Recorrido virtual 360(?:°|&deg;)\s*</h2>\s*'
                  r'<iframe\b[^>]*>.*?</iframe>\s*</div>')
        page, replaced = re.subn(legacy, lambda _: section, page, count=1, flags=re.S | re.I)
        page = re.sub(r'<h2\b[^>]*>\s*Recorridos y experiencias oficiales\s*</h2>.*?(?=</section>)',
                      '', page, flags=re.S | re.I)
        if not replaced:
            existing = r'<section\b[^>]*\bid=["\']recorrido["\'][^>]*>.*?</section>'
            if re.search(existing, page, flags=re.S | re.I):
                page = re.sub(existing, lambda _: section, page, count=1, flags=re.S | re.I)
            elif section:
                location = r'(?=<div class="space-y-6">\s*<h2\b[^>]*>Ubicación</h2>)'
                page, inserted = re.subn(location, lambda _: section + '\n', page, count=1, flags=re.S)
                if inserted != 1:
                    raise ValueError(research['slug'] + ': featured location anchor missing')
    else:
        current = r'<section\b[^>]*\bid=["\']recorrido["\'][^>]*>.*?</section>'
        page, replaced = re.subn(current, lambda _: section, page, count=1, flags=re.S | re.I)
        if section and replaced != 1:
            raise ValueError(research['slug'] + ': registered tour section missing')

    # Maps formerly required a click. Keep their published queries and labels.
    def map_loader(match):
        attrs = attributes(match[0])
        return map_markup(attrs['data-embed-src'], attrs['data-embed-title'])
    page = re.sub(r'<div class="embed-shell map-shell"><button\b[^>]*data-embed-src=["\'][^>]*>.*?</button></div>',
                  map_loader, page, flags=re.S)
    # The four featured pages already embed maps. Give them the same sizing and
    # security attributes without modifying address text or navigation links.
    def featured_map(match):
        attrs = attributes(match[0])
        return map_markup(attrs['src'], attrs.get('title') or 'Mapa de ubicación')
    page = re.sub(r'<iframe\b(?![^>]*data-project-embed=)(?=[^>]*src=["\']https://www\.google\.com/maps)[^>]*>\s*</iframe>',
                  featured_map, page, flags=re.S)
    if SHARED_STYLESHEET not in page:
        page = page.replace('</head>', SHARED_STYLESHEET + '\n</head>', 1)
    if '/assets/js/project-embeds.js' not in page:
        page = page.replace('</head>', SHARED_SCRIPT + '\n</head>', 1)
    host_script = ('<script type="application/json" id="project-embed-hosts">' +
                   json.dumps(embed_hosts(research)) + '</script>')
    page, hosts_replaced = re.subn(r'<script type="application/json" id="project-embed-hosts">.*?</script>',
                                  lambda _: host_script, page, flags=re.S)
    if not hosts_replaced:
        page = page.replace('</head>', host_script + '\n</head>', 1)
    if 'data-embed-src=' in page:
        raise ValueError(research['slug'] + ': an activation loader remains')
    return page
