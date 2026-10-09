#!/usr/bin/env python3
"""Catalogue-wide navigation, provenance and safe fallback checks."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.images, self.ids, self.embeds = [], [], [], []
        self.headings = 0
        self.feed(text)
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.headings += 1
        if tag == 'a':
            self.links.append(attrs)
        if tag == 'img':
            self.images.append(attrs)
        if attrs.get('data-embed-src'):
            self.embeds.append(attrs)

projects = json.loads((ROOT / 'data/proyectos.json').read_text())
research = json.loads((ROOT / 'data/fichas-proyectos.json').read_text())
ledger = json.loads((ROOT / 'data/registro-fichas.json').read_text())
records = {r['slug']: r for r in research}
slugs = {p['slug'] for p in projects}
assert len(slugs) == len(projects) == 148, 'Catalogue has lost or duplicated projects'
assert slugs == set(records) == {x['slug'] for x in ledger}, 'Incomplete inventory or research'
assert len(research) == len(ledger) == len(projects), 'Duplicated audit records'
assert all(r['fichaDesarrollada'] for r in ledger), 'A detail page is missing'
checked_links = 0
maps = 0
for project in projects:
    slug = project['slug']
    path = ROOT / (slug + '.html')
    assert project['detalleUrl'] == '/' + slug + '.html'
    assert path.is_file(), f'{slug}: missing detail'
    text = path.read_text()
    page = Page(text)
    assert page.headings == 1, f'{slug}: expected one main heading'
    assert len(page.ids) == len(set(page.ids)), f'{slug}: duplicated element IDs'
    assert '<html' in text and 'lang="es"' in text
    assert 'name="viewport"' in text and f'https://sollahms.cl/{slug}.html' in text
    assert not re.search(r'\b(?:undefined|NaN)\b', text), f'{slug}: missing value leaks to page'
    contact = [a for a in page.links if a.get('href') == '/contacto.html?proyecto=' + slug]
    booking = [a for a in page.links if a.get('href') == '/agenda-asesoria.html?proyecto=' + slug]
    assert contact and booking, f'{slug}: contextual consultation or booking missing'
    for link in page.links:
        href = link.get('href', '')
        if href.startswith('#'):
            assert href[1:] in page.ids, f'{slug}: broken anchor {href}'
        elif href.startswith('/'):
            parsed = urlparse(href)
            dest = ROOT / (unquote(parsed.path).lstrip('/') or 'index.html')
            assert dest.is_file(), f'{slug}: broken internal link {href}'
            checked_links += 1
        elif href.startswith('https:'):
            assert link.get('target') != '_blank' or 'noopener' in link.get('rel', ''), f'{slug}: unsafe new tab'
    for img in page.images:
        assert img.get('alt'), f'{slug}: image without accessible description'
        if img.get('src', '').startswith('/'):
            assert (ROOT / img['src'].lstrip('/')).is_file(), f'{slug}: missing local image'
    record = records[slug]
    for image in record.get('images', []):
        assert image.get('sourceUrl', '').startswith('https://'), f'{slug}: official image without provenance'
    for tour in record.get('virtualTours', []):
        assert tour.get('sourceUrl', '').startswith('https://'), f'{slug}: tour without provenance'
    if slug not in FEATURED:
        assert all(x in page.ids for x in ['proyecto', 'caracteristicas', 'galeria', 'recorrido', 'ubicacion', 'fuentes'])
        for embed in page.embeds:
            url = urlparse(embed['data-embed-src'])
            approved = ['my.matterport.com', 'mpembed.com', 'www.google.com', 'www.youtube.com', 'player.vimeo.com']
            approved += [urlparse(t['url']).hostname for t in record.get('virtualTours', []) if t.get('embedStatus') == 'allowed']
            assert url.scheme == 'https' and url.hostname in approved
            if url.hostname == 'www.google.com':
                maps += 1
                assert 'direccion' in record['verifiedFields'] and 'comuna' in record['verifiedFields'], f'{slug}: map without verified address and commune'
                official_address = record.get('updates', {}).get('direccion', project.get('direccion'))
                assert official_address in parse_qs(url.query)['q'][0], f'{slug}: map diverges from official address'
                assert not re.search(r'-\d{2}\.\d+\s*,\s*-\d{2}\.\d+', parse_qs(url.query)['q'][0]), f'{slug}: approximate coordinates'
            else:
                assert embed['data-embed-src'] in [t['url'] for t in record.get('virtualTours', [])], f'{slug}: tour is not backed by research'
        if 'precioDesdeUF' not in record.get('verifiedFields', []) or record.get('updates', {}).get('precioDesdeUF', project.get('precioDesdeUF')) is None:
            assert 'Precio desde</span><strong><span class="pending">' in text, f'{slug}: historical price shown as current'
        for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
            assert json.loads(ld)['@type'] == 'WebPage'
sitemap = ET.fromstring((ROOT / 'sitemap.xml').read_text())
urls = [x.text for x in sitemap.findall('.//{*}loc')]
assert len(urls) == len(set(urls))
assert all('https://sollahms.cl' + p['detalleUrl'] in urls for p in projects)
assert 'fetch(\'/data/proyectos.json\')' in (ROOT / 'agenda-asesoria.html').read_text(), 'Booking still has a limited hardcoded project list'
print(json.dumps({'projects': len(projects), 'pages': len(ledger), 'internalLinksChecked': checked_links, 'newVerifiedMaps': maps, 'sitemapUrls': len(urls), 'result': 'passed'}))
