"""Shared rendering policy for registered, project-specific virtual tours.

Research remains unchanged. A section needs at least one usable tour; legitimate
registered alternatives can keep their original links alongside that tour.
"""
import re
from urllib.parse import unquote, urlparse


VISUAL_RESULTS = {'valid_scene', 'valid_interface', 'interactive_viewer'}
TOUR_TYPES = {'tour', 'virtual_tour', 'virtual-tour', 'virtualtour', '360', 'panorama', 'matterport'}
# Rechecked 2026-10-12: this exact Vista Bulnes URL has an expired TLS certificate.
# Keep the historical research record; omit its unusable card from rendering.
UNAVAILABLE_TOURS = {
    ('vista-bulnes',
     'https://data.sentiovr.com/spaces/19805/space_1600948559/vtour/tour.html?showme=true?showme=true&_ga=2.18944824.1839358211.1767707268-1601151291.1753297916'),
}
NON_TOUR_SUFFIXES = {
    '.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.tif', '.tiff',
    '.webp', '.pdf', '.mp4', '.m4v', '.mov', '.webm', '.avi', '.m3u8', '.mp3', '.wav',
}
NON_TOUR_HOSTS = {
    'youtube.com', 'www.youtube.com', 'youtube-nocookie.com',
    'www.youtube-nocookie.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com',
    'player.vimeo.com', 'maps.app.goo.gl', 'maps.google.com', 'www.google.com',
    'google.com',
}
MAP_DOMAINS = {'maps.apple.com', 'bing.com', 'openstreetmap.org', 'openstreetmap.fr', 'osm.org', 'waze.com'}
MAP_PROVIDERS = {'map', 'maps', 'mapa', 'mapas', 'google maps', 'googlemaps',
                 'apple maps', 'applemaps', 'bing', 'bing maps', 'bingmaps',
                 'openstreetmap', 'open street map', 'waze', 'mapbox', 'leaflet'}


def secure_url(value):
    if not isinstance(value, str) or any(char.isspace() or ord(char) < 32 or char in '\\<>\"\'' for char in value):
        return None
    try:
        parsed = urlparse(value)
        # Accessing these properties also validates IPv6 syntax and port range.
        host, port = parsed.hostname, parsed.port
    except ValueError:
        return None
    if any(ord(char) < 32 for char in unquote(value)):
        return None
    return value if parsed.scheme == 'https' and host and '%' not in host and not parsed.username and not parsed.password else None


def registered_virtual_tours(research):
    """Reject other media and explicit identity conflicts without editing data."""
    registered = []
    for tour in research.get('virtualTours', []):
        if not isinstance(tour, dict):
            continue
        url = secure_url(tour.get('url'))
        if not url or not secure_url(tour.get('sourceUrl')):
            continue
        if (research.get('slug'), url) in UNAVAILABLE_TOURS:
            continue
        parsed = urlparse(url)
        host = parsed.hostname.lower()
        path = unquote(parsed.path).lower().rstrip('/')
        google_map = host.startswith('maps.google.') or ('google.' in host and path.startswith('/maps'))
        map_host = any(host == domain or host.endswith('.' + domain) for domain in MAP_DOMAINS)
        provider = re.sub(r'[_-]+', ' ', str(tour.get('provider', '')).strip().lower())
        map_provider = provider in MAP_PROVIDERS or bool(re.search(r'\b(?:map|maps|mapa|mapas)\b', provider))
        if host in NON_TOUR_HOSTS or google_map or map_host or map_provider or any(path.endswith(suffix) for suffix in NON_TOUR_SUFFIXES):
            continue
        resource_types = [tour[key] for key in ('type', 'kind', 'resourceType') if tour.get(key)]
        if any(str(kind).strip().lower() not in TOUR_TYPES for kind in resource_types):
            continue
        unassociated = {'unverified', 'pending', 'mismatch', 'rejected'}
        if tour.get('identityLimitation') or any(tour.get(key) in unassociated for key in ('identityStatus', 'associationStatus')):
            continue
        if tour.get('projectSlug') and tour['projectSlug'] != research.get('slug'):
            continue
        registered.append(tour)
    return registered


def usable_virtual_tours(research):
    """Require a rendered scene/interface, not an HTTP response or blank frame."""
    return [tour for tour in registered_virtual_tours(research)
            if tour.get('visualVerification', {}).get('result') in VISUAL_RESULTS
            and tour.get('embedStatus') != 'visual_pending'
            and tour.get('verificationStatus') not in {'visualization_pending', 'invalid', 'rejected', 'unavailable'}]


def virtual_tours_to_render(research):
    """Keep registered alternatives only when one associated tour is usable."""
    return registered_virtual_tours(research) if usable_virtual_tours(research) else []


def hide_absent_virtual_tours(page, research):
    """Remove the tour block and navigation while keeping mixed legacy content.

    The featured legacy block shares its section with photographs and specs, so
    remove its tour heading/content rather than the surrounding section.
    """
    # A related office fact can share a grid with otherwise useful facts/maps.
    # Its explicit unavailable-viewer placeholder does not establish a tour,
    # even when the main project happens to have another usable experience.
    page = re.sub(r'<div>\s*<dt>\s*Recorrido virtual de oficinas\s*</dt>\s*<dd>\s*(?:Consulta la disponibilidad de un recorrido virtual de oficinas\.|Pendiente de verificación: la fuente no publica un visor funcional\.)\s*</dd>\s*</div>', '', page, flags=re.I)
    if usable_virtual_tours(research):
        return page
    page = re.sub(r'(?:^[ \t]*)?<section\b[^>]*\bid=[\"\']recorrido[\"\'][^>]*>.*?</section>', '', page, flags=re.S | re.I | re.M)
    page = re.sub(r'<a\b[^>]*\bhref=[\"\']#recorrido[\"\'][^>]*>.*?</a>', '', page, flags=re.S | re.I)
    # These two older featured templates keep their original Matterport iframe
    # in a standalone div, outside the additional photographs/specs section.
    page = re.sub(r'<div\b[^>]*\bclass=[\"\']space-y-6[\"\'][^>]*>\s*<h2\b[^>]*>\s*Recorrido virtual 360(?:°|&deg;)\s*</h2>\s*<iframe\b[^>]*>.*?</iframe>\s*</div>', '', page, flags=re.S | re.I)
    page = re.sub(r'<h2\b[^>]*>\s*Recorridos y experiencias oficiales\s*</h2>.*?(?=<h2\b|</section>)', '', page, flags=re.S | re.I)
    page = re.sub(r'<p\b[^>]*>\s*(?:Consulta la disponibilidad de un recorrido virtual del proyecto\.|No se ha verificado un recorrido virtual oficial para este proyecto\. Su disponibilidad está pendiente de confirmación\.|Recorrido virtual oficial específico pendiente de verificación\.)\s*</p>', '', page, flags=re.I)
    return page
