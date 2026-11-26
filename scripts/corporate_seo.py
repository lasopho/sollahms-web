"""Scoped corporate metadata and entity links; never process catalogue/fiches.

Apply after a corporate page renderer. Canonicals stay on the public origin,
including protected previews. No runtime dependencies or new tracking.
"""
import json
import re
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://sollahms.cl'
CONFIG = ROOT / 'data/corporate-seo.json'


class Metadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.values = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.values[attrs.get('name') or attrs.get('property')] = attrs.get('content', '')


def meta_pattern(attr, key):
    return r'<meta\b(?=[^>]*\b' + attr + r'="' + re.escape(key) + r'")[^>]*>'


def align_homepage_graph(html, title, description, identity=None):
    """Align verified descriptions without replacing the existing identity graph."""
    found = 0
    identity = identity or {}
    allowed = {
        'Organization': ('/#organization', {'description'}),
        'WebSite': ('/#website', {'description'}),
        'Service': ('/#asesoria-inmobiliaria', {'serviceType', 'description'}),
    }
    for kind, fields in identity.items():
        if kind not in allowed or set(fields) - allowed[kind][1]:
            raise ValueError('Unsupported homepage identity fields: ' + kind)
    identity_found = {kind: 0 for kind in identity}

    def align(match):
        nonlocal found
        payload = json.loads(match[1])
        nodes = payload.get('@graph', [])
        changed = False
        for node in nodes:
            if node.get('@id') == ORIGIN + '/#webpage' and node.get('@type') == 'WebPage':
                found += 1
                if node.get('name') != title or node.get('description') != description:
                    node['name'] = title
                    node['description'] = description
                    changed = True
            kind = node.get('@type')
            if isinstance(kind, str) and kind in identity and node.get('@id') == ORIGIN + allowed[kind][0]:
                identity_found[kind] += 1
                for key, value in identity[kind].items():
                    if node.get(key) != value:
                        node[key] = value
                        changed = True
        if not changed:
            return match[0]
        return '<script type="application/ld+json">\n' + json.dumps(payload, ensure_ascii=False, indent=2) + '\n</script>'

    result = re.sub(r'<script type="application/ld\+json">(.*?)</script>', align, html, flags=re.S)
    if found != 1:
        raise ValueError('Expected exactly one existing homepage WebPage identity')
    if any(count != 1 for count in identity_found.values()):
        raise ValueError('Expected one existing node for each homepage identity update')
    return result


def align_identity_copy(html, filename, copy):
    """Reuse the existing FAQ or introductory paragraph; no new sections/forms."""
    if not copy:
        return html
    official = ' El sitio web oficial de Sollahms es <a href="' + ORIGIN + '/">sollahms.cl</a>.'
    paragraph = '<p>' + escape(copy['description']) + official + '</p>'
    if filename == 'index.html':
        paragraph += '<p>' + escape(copy['catalogue']) + ' Puedes <a href="/agenda-asesoria.html">solicitar asesoría</a> para conversar sobre lo que necesitas evaluar.</p>'
        pattern = r'(<details open><summary>¿Qué hace Sollahms\?</summary>).*?(</details>)'
        replacement = lambda match: match[1] + paragraph + match[2]
    elif filename in ('agenda-asesoria.html', 'contacto.html'):
        pattern = r'(<section class="advisory-page-heading"><div>.*?<h1>.*?</h1>)<p>.*?</p>'
        replacement = lambda match: match[1] + paragraph
    else:
        raise ValueError('Identity copy outside its three-page scope: ' + filename)
    result, count = re.subn(pattern, replacement, html, flags=re.S)
    if count != 1:
        raise ValueError('Expected one existing identity copy location: ' + filename)
    return result


def add_homepage_png_favicon(html, href):
    """Add one raster alternative before the approved, unchanged SVG icon."""
    svg_pattern = r'<link\b(?=[^>]*\brel="icon")(?=[^>]*\bhref="/assets/branding/favicon\.svg(?:\?[^"]*)?")[^>]*>'
    svg_matches = list(re.finditer(svg_pattern, html))
    if len(svg_matches) != 1:
        raise ValueError('Expected exactly one existing homepage SVG favicon')
    png_pattern = r'<link\b(?=[^>]*\brel="icon")(?=[^>]*\bhref="' + re.escape(href) + r'")[^>]*>'
    png_matches = list(re.finditer(png_pattern, html))
    if len(png_matches) > 1:
        raise ValueError('Duplicate homepage PNG favicon')
    tag = '<link rel="icon" type="image/png" sizes="512x512" href="' + escape(href, quote=True) + '">'
    if png_matches:
        if png_matches[0].start() > svg_matches[0].start():
            raise ValueError('Homepage PNG favicon must precede the existing SVG')
        return re.sub(png_pattern, lambda _: tag, html, count=1)
    position = svg_matches[0].start()
    return html[:position] + tag + '\n' + html[position:]


def apply_corporate_seo(html, filename):
    config = json.loads(CONFIG.read_text())
    if filename not in config['pages']:
        raise ValueError('Page outside the corporate SEO allowlist: ' + filename)
    page = config['pages'][filename]
    html = align_identity_copy(html, filename, page.get('identityCopy'))
    align_homepage = filename == 'index.html' and page.get('alignHomepageMetadata', False)
    metadata = Metadata(html).values
    if filename == 'comparador-hipotecario.html' and 'id="corporate-seo-layout"' not in html:
        html = html.replace('</head>', '<style id="corporate-seo-layout">\n.footer-inner > div { flex-wrap: wrap; min-width: 0; max-width: 100%; }\n</style>\n</head>', 1)
    if filename == 'comparador-hipotecario.html':
        html = re.sub(r'<footer\b.*?</footer>', lambda m: m[0].replace('/assets/branding/sollahms-logo-light.svg', '/assets/branding/sollahms-logo.svg'), html, flags=re.S)
    url = ORIGIN + ('/' if filename == 'index.html' else '/' + filename)
    title = page.get('title') or unescape(re.search(r'<title>(.*?)</title>', html, re.S)[1])
    description = page.get('description') or metadata['description']
    if page.get('title'):
        html = re.sub(r'<title>.*?</title>', '<title>' + escape(title) + '</title>', html, count=1, flags=re.S)
    if page.get('description'):
        html = re.sub(meta_pattern('name', 'description'), '<meta name="description" content="' + escape(description, quote=True) + '">', html, count=1)

    # Keep all existing social artwork and valid homepage metadata. Complete
    # missing guide tags and align changed titles/descriptions without new media.
    social = {'og:site_name': 'Sollahms', 'og:image:alt': 'Sollahms — información y asesoría inmobiliaria',
              'twitter:card': 'summary_large_image', 'twitter:image:alt': 'Sollahms — información y asesoría inmobiliaria'}
    image = metadata.get('og:image') or page['socialImage']
    social.update({'og:type': 'website', 'og:locale': 'es_CL',
                   'og:url': url, 'og:title': title, 'og:description': description,
                   'og:image': image})
    social.update({'twitter:image': image, 'twitter:title': title, 'twitter:description': description,
                   'og:image:secure_url': image, 'og:image:type': 'image/png',
                   'og:image:width': metadata.get('og:image:width') or page.get('socialImageWidth', '1254'),
                   'og:image:height': metadata.get('og:image:height') or page.get('socialImageHeight', '1254')})
    if page.get('title'):
        social['og:title'] = title
    if page.get('description'):
        social['og:description'] = description
    additions = []
    for key, value in social.items():
        attr = 'property' if key.startswith('og:') else 'name'
        pattern = meta_pattern(attr, key)
        tag = '<meta ' + attr + '="' + key + '" content="' + escape(value, quote=True) + '">'
        if re.search(pattern, html):
            if (key in ('og:title', 'twitter:title') and (page.get('title') or align_homepage)
                    or key in ('og:description', 'twitter:description') and (page.get('description') or align_homepage)):
                html = re.sub(pattern, tag, html, count=1)
        else:
            additions.append(tag)
    html = html.replace('</head>', '\n'.join(additions) + ('\n' if additions else '') + '</head>', 1)

    if filename == 'index.html':
        # The homepage is the authoritative Organization/WebSite/Service graph.
        if align_homepage:
            html = align_homepage_graph(html, title, description, page.get('identityGraph'))
        if page.get('faviconPng'):
            html = add_homepage_png_favicon(html, page['faviconPng'])
        return html
    entity = {'@type': page['type'], '@id': url + page.get('fragment', '#webpage'),
              'url': url, 'name': title, 'description': description, 'inLanguage': 'es-CL',
              'isPartOf': {'@id': ORIGIN + '/#website'},
              'publisher': {'@id': ORIGIN + '/#organization'},
              'about': [{'@id': ORIGIN + '/#organization'}] + [{'@type': 'Thing', 'name': topic} for topic in page.get('topics', [])]}
    if page.get('service'):
        entity['mainEntity'] = {'@id': ORIGIN + '/#asesoria-inmobiliaria'}
    if page.get('related'):
        entity['relatedLink'] = [ORIGIN + path for path in page['related']]
    entity['primaryImageOfPage'] = {'@type': 'ImageObject', 'url': image}
    payload = {'@context': 'https://schema.org', '@graph': [entity]}
    script = '<script type="application/ld+json">\n' + json.dumps(payload, ensure_ascii=False, indent=2) + '\n</script>'
    pattern = r'<script type="application/ld\+json">.*?</script>'
    if re.search(pattern, html, re.S):
        html = re.sub(pattern, lambda _: script, html, count=1, flags=re.S)
    else:
        html = html.replace('</head>', script + '\n</head>', 1)
    return html


if __name__ == '__main__':
    for filename in json.loads(CONFIG.read_text())['pages']:
        path = ROOT / filename
        previous = path.read_text()
        current = apply_corporate_seo(previous, filename)
        if current != previous:
            path.write_text(current)
            print(filename)
