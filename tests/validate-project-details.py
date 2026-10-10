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
        self.links, self.images, self.ids, self.embeds, self.iframes = [], [], [], [], []
        self.sections, self.embed_sections, self.iframe_sections = [], [], []
        self.headings = 0
        self.feed(text)
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == 'section':
            self.sections.append(attrs.get('id'))
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
            self.embed_sections.append(tuple(self.sections))
        if tag == 'iframe':
            self.iframes.append(attrs)
            self.iframe_sections.append(tuple(self.sections))
    def handle_endtag(self, tag):
        if tag == 'section' and self.sections:
            self.sections.pop()

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
new_maps = 0
context_reference_maps = 0
ledger_by_slug = {entry['slug']: entry for entry in ledger}

def same_tour(rendered, official):
    """Matterport presentation parameters may differ; the model must match."""
    current, published = urlparse(rendered), urlparse(official)
    if current.hostname == published.hostname and current.hostname in {'my.matterport.com', 'mpembed.com'}:
        current_model = parse_qs(current.query).get('m', [None])[0]
        published_model = parse_qs(published.query).get('m', [None])[0]
        return bool(current_model) and current_model == published_model
    return rendered == official
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
    host_config = re.search(r'<script type="application/json" id="project-embed-hosts">(.*?)</script>', text, re.S)
    assert host_config, f'{slug}: missing iframe host configuration'
    permitted_hosts = json.loads(host_config[1])
    assert isinstance(permitted_hosts, list) and all(isinstance(host, str) for host in permitted_hosts)
    embedded_urls = [(entry['data-embed-src'], section) for entry, section in zip(page.embeds, page.embed_sections)] + [(entry.get('src', ''), section) for entry, section in zip(page.iframes, page.iframe_sections)]
    project_maps = []
    reference_maps = []
    for embedded_url, sections in embedded_urls:
        url = urlparse(embedded_url)
        assert url.scheme == 'https' and url.hostname in permitted_hosts and not url.username and not url.password, f'{slug}: unsafe or unapproved iframe host'
        if url.hostname == 'www.google.com':
            query = parse_qs(url.query).get('q', [None])[0]
            if 'contexto-oficial' in sections:
                context = record.get('officialContext')
                assert isinstance(context, dict) and context.get('sourceStatus') == 'verified', f'{slug}: reference map without verified contextual source'
                assert context.get('scope') in {'conjunto_sin_etapa', 'oficinas'}, f'{slug}: unapproved reference-map scope'
                source = urlparse(context.get('sourceUrl', ''))
                assert source.scheme == 'https' and source.hostname and not source.username and not source.password, f'{slug}: reference map without official-source provenance'
                assert isinstance(context.get('mapQuery'), str) and context['mapQuery'].strip(), f'{slug}: reference map without official contextual address'
                assert url.path == '/maps' and parse_qs(url.query) == {'output': ['embed'], 'q': [context['mapQuery']]}, f'{slug}: reference map diverges from exact contextual address'
                reference_maps.append(embedded_url)
            else:
                project_maps.append(embedded_url)
                assert all(key in record['verifiedFields'] for key in ['direccion', 'comuna', 'mapQuery']), f'{slug}: map without verified location'
                official_address = record.get('updates', {}).get('direccion', project.get('direccion'))
                assert query and official_address in query, f'{slug}: map diverges from official address'
            assert not re.search(r'-\d{2}\.\d+\s*,\s*-\d{2}\.\d+', query), f'{slug}: approximate coordinates'
        else:
            backed = [tour for tour in record.get('virtualTours', []) if same_tour(embedded_url, tour['url'])]
            assert backed, f'{slug}: embedded tour is not backed by project research'
            assert any(tour.get('embedStatus') == 'allowed' for tour in backed), f'{slug}: tour embedding permission is not verified'
    assert len(project_maps) <= 1, f'{slug}: duplicated map'
    assert len(reference_maps) <= 1, f'{slug}: duplicated contextual reference map'
    context_reference_maps += len(reference_maps)
    maps += len(project_maps)
    if slug not in FEATURED:
        new_maps += len(project_maps)
    assert ledger_by_slug[slug]['mapa'] == bool(project_maps), f'{slug}: map audit differs from rendered page'
    context_ledger = ledger_by_slug[slug].get('contextoOficial', {})
    assert context_ledger.get('mapaDeReferencia', False) == bool(reference_maps), f'{slug}: reference-map audit differs from rendered page'
    published_links = {entry.get('href') for entry in page.links}
    for tour in record.get('virtualTours', []):
        assert tour['url'] in published_links, f'{slug}: original tour link missing'
    actual_matterport = any(tour.get('provider') == 'Matterport' and tour['url'] in published_links for tour in record.get('virtualTours', []))
    assert ledger_by_slug[slug]['matterport'] == actual_matterport, f'{slug}: Matterport audit differs from rendered page'
    assert ledger_by_slug[slug]['recorridosOficiales'] == len(record.get('virtualTours', [])), f'{slug}: official tour count differs from research'
    if slug not in FEATURED:
        assert all(x in page.ids for x in ['proyecto', 'caracteristicas', 'galeria', 'recorrido', 'ubicacion', 'fuentes'])
        if 'precioDesdeUF' not in record.get('verifiedFields', []) or record.get('updates', {}).get('precioDesdeUF', project.get('precioDesdeUF')) is None:
            assert 'Precio desde</span><strong><span class="pending">' in text, f'{slug}: historical price shown as current'
        for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
            assert json.loads(ld)['@type'] == 'WebPage'
sitemap = ET.fromstring((ROOT / 'sitemap.xml').read_text())
urls = [x.text for x in sitemap.findall('.//{*}loc')]
assert len(urls) == len(set(urls))
assert all('https://sollahms.cl' + p['detalleUrl'] in urls for p in projects)
assert 'fetch(\'/data/proyectos.json\')' in (ROOT / 'agenda-asesoria.html').read_text(), 'Booking still has a limited hardcoded project list'
print(json.dumps({'projects': len(projects), 'pages': len(ledger), 'internalLinksChecked': checked_links, 'newVerifiedMaps': new_maps, 'verifiedMaps': maps, 'officialContextReferenceMaps': context_reference_maps, 'sitemapUrls': len(urls), 'result': 'passed'}))
