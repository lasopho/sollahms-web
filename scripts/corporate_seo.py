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


def apply_corporate_seo(html, filename):
    config = json.loads(CONFIG.read_text())
    if filename not in config['pages']:
        raise ValueError('Page outside the corporate SEO allowlist: ' + filename)
    page = config['pages'][filename]
    metadata = Metadata(html).values
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
    image = metadata['og:image']
    social.update({'twitter:image': image, 'twitter:title': title, 'twitter:description': description,
                   'og:image:secure_url': image, 'og:image:type': 'image/png', 'og:image:width': '1254', 'og:image:height': '1254'})
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
            if key in ('og:title', 'twitter:title') and page.get('title') or key in ('og:description', 'twitter:description') and page.get('description'):
                html = re.sub(pattern, tag, html, count=1)
        else:
            additions.append(tag)
    html = html.replace('</head>', '\n'.join(additions) + ('\n' if additions else '') + '</head>', 1)

    if filename == 'index.html':
        # The homepage is the authoritative Organization/WebSite/Service graph.
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
