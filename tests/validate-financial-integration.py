#!/usr/bin/env python3
"""Check catalogue and source integrity across the financial branch integration.

This is a structural/file audit; it does not claim browser, external-viewer or
bank approval verification. Baselines are the reviewed fichas and comparador
commits. Existing detail pages may add only a simulation CTA and, for the four
featured pages, its dedicated stylesheet.
"""
import argparse
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}
SIM_LABEL = 'Simular crédito hipotecario'
SIM_LINK = re.compile(r'<a\b[^>]*href="/comparador-hipotecario\.html\?proyecto=([^"&]+)"[^>]*>Simular crédito hipotecario</a>')
FEATURED_CSS = '<link rel="stylesheet" href="/assets/css/project-finance.css">\n'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def baseline(path, ref):
    return git('show', f'{ref}:{path}')


def check(condition, message):
    if not condition:
        raise AssertionError(message)


class Node:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, attrs or {}, []

    def all(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.all()

    def text(self):
        return ''.join(child.text() if isinstance(child, Node) else child for child in self.children)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        node = Node(tag, dict(pairs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, pairs):
        self.stack[-1].children.append(Node(tag, dict(pairs)))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, text):
        self.stack[-1].children.append(text)

    def nodes(self, tag):
        return [node for node in self.root.all() if node.tag == tag]


def anchors(node):
    return [(a.attrs.get('href', ''), a.text().strip()) for a in node.all() if a.tag == 'a']


def audit_navigation(text, name):
    page = Page(text)
    headers = page.nodes('header')
    check(len(headers) == 1, f'{name}: expected one shared header')
    header = headers[0]
    primary = [node for node in header.all() if node.tag == 'nav' and node.attrs.get('aria-label') == 'Navegación principal']
    check(len(primary) == 1, f'{name}: primary navigation missing')
    desktop = [node for node in primary[0].all() if node.tag == 'div' and (
        'desktop-nav' in node.attrs.get('class', '').split() or {'hidden', 'md:flex'} <= set(node.attrs.get('class', '').split()))]
    check(len(desktop) == 1, f'{name}: desktop menu container missing or duplicated')
    mobile = [node for node in header.all() if node.tag == 'nav' and node.attrs.get('aria-label') == 'Navegación móvil']
    check(len(mobile) == 1, f'{name}: mobile menu missing or duplicated')
    expertise = '#expertise' if name == 'index.html' else '/#expertise'
    expected = [(expertise, 'Expertise'), ('/proyectos.html', 'Asset Portafolio'), ('/contacto.html', 'Contacto')]
    for mode, container in [('desktop', desktop[0]), ('mobile', mobile[0])]:
        check(anchors(container) == expected, f'{name}: {mode} menu differs from the three approved links: {anchors(container)}')
    # The booking page itself has never shown a link back to its own form.
    if name != 'agenda-asesoria.html':
        check(any(urlparse(href).path == '/agenda-asesoria.html' and 'Agendar Asesoría' in label for href, label in anchors(header)),
              f'{name}: existing booking action missing')
    return page


def git_blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def audit_assets(ref):
    protected = []
    for line in git('ls-tree', '-r', ref, '--', 'assets').decode().splitlines():
        metadata, path = line.split('\t', 1)
        expected_blob = metadata.split()[2]
        current = ROOT / path
        check(current.is_file(), f'Existing asset missing: {path}')
        check(git_blob(current.read_bytes()) == expected_blob, f'Existing asset changed: {path}')
        protected.append(path)
    property_paths = [p for p in protected if p.startswith('assets/propiedades/')]
    current_properties = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'assets/propiedades').rglob('*') if p.is_file())
    check(current_properties == sorted(property_paths), 'Official photograph set gained/lost a file')
    return len(protected), len(property_paths)


def sitemap_locations(data):
    root = ET.fromstring(data)
    return [element.text for element in root.findall('{*}url/{*}loc')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fichas-baseline', default='bd42519')
    parser.add_argument('--comparador-baseline', default='fb01839')
    args = parser.parse_args()
    fichas, comparador = args.fichas_baseline, args.comparador_baseline
    catalogue_bytes = (ROOT / 'data/proyectos.json').read_bytes()
    check(catalogue_bytes == baseline('data/proyectos.json', fichas), 'Catalogue/commercial data or cover metadata changed')
    projects = json.loads(catalogue_bytes)
    check(len(projects) == len({p['slug'] for p in projects}) == 148, '148 unique projects required')
    protected = ['data/fichas-proyectos.json', 'data/registro-fichas.json', 'lib/project-context.mjs',
                 'api/booking-create.mjs', 'api/booking-availability.mjs', 'lib/booking-server.mjs',
                 'agenda-asesoria.html', 'contacto.html', 'docs/registro-fichas-proyectos.md',
                 'docs/verificacion-fichas.md', 'docs/catalogo-22-validacion-2026-10-01.md']
    for path in protected:
        check((ROOT / path).read_bytes() == baseline(path, fichas), f'Protected fichas file changed: {path}')
    total_assets, property_assets = audit_assets(fichas)
    simulations, maps, tours, photographs, featured_styles = 0, 0, 0, 0, 0
    for project in projects:
        slug = project['slug']
        path = slug + '.html'
        current = (ROOT / path).read_text()
        previous = baseline(path, fichas).decode()
        matches = SIM_LINK.findall(current)
        check(matches == [slug], f'{slug}: exactly one simulation action for its own verified identifier required')
        stripped = SIM_LINK.sub('', current)
        if slug in FEATURED:
            check(stripped.count(FEATURED_CSS) == 1, f'{slug}: dedicated featured simulation stylesheet missing/duplicated')
            stripped = stripped.replace(FEATURED_CSS, '', 1)
            featured_styles += 1
        else:
            check(FEATURED_CSS not in stripped, f'{slug}: unexpected featured styling added')
        check(stripped == previous, f'{slug}: detail changed beyond its simulation action and approved featured stylesheet')
        page = audit_navigation(current, path)
        old_page = Page(previous)
        images = [node.attrs for node in page.nodes('img')]
        check(images == [node.attrs for node in old_page.nodes('img')], f'{slug}: image attributes changed')
        embeds = [node.attrs for node in page.root.all() if node.attrs.get('data-embed-src')]
        old_embeds = [node.attrs for node in old_page.root.all() if node.attrs.get('data-embed-src')]
        iframes = [node.attrs for node in page.nodes('iframe')]
        check(embeds == old_embeds and iframes == [node.attrs for node in old_page.nodes('iframe')], f'{slug}: map/tour configuration changed')
        links = [(node.attrs.get('href', ''), node.text().strip()) for node in page.nodes('a')]
        check(any(href == '/contacto.html?proyecto=' + slug and label == 'Consultar proyecto' for href, label in links), f'{slug}: consultation action/context missing')
        check(any(href == '/agenda-asesoria.html?proyecto=' + slug and 'Agendar Asesoría' in label for href, label in links), f'{slug}: booking action/context missing')
        sim = [node for node in page.nodes('a') if node.text().strip() == SIM_LABEL]
        check(len(sim) == 1, f'{slug}: simulation label duplicated/missing')
        query = parse_qs(urlparse(sim[0].attrs['href']).query)
        check(query == {'proyecto': [slug]}, f'{slug}: simulation link contains financial or personal query data')
        rendered = [node['data-embed-src'] for node in embeds] + [node.get('src', '') for node in iframes]
        maps += sum('www.google.com/maps' in url for url in rendered)
        tours += sum('www.google.com/maps' not in url for url in rendered)
        photographs += len(images)
        simulations += 1
    template = (ROOT / 'templates/project-detail.html').read_text()
    check(SIM_LINK.findall(template) == ['$slug'], 'Reusable detail template simulation context missing/duplicated')
    check(SIM_LINK.sub('', template).encode() == baseline('templates/project-detail.html', fichas), 'Detail template changed beyond simulation action')
    old_locations = sitemap_locations(baseline('sitemap.xml', fichas))
    locations = sitemap_locations((ROOT / 'sitemap.xml').read_bytes())
    check(len(old_locations) == 153, 'Reviewed baseline must contain 153 sitemap locations')
    check(len(locations) == len(set(locations)) == 154, 'Integrated sitemap must contain 154 unique pages')
    check(set(locations) == set(old_locations) | {'https://sollahms.cl/comparador-hipotecario.html'}, 'Integrated sitemap lost pages or adds unexpected URLs')
    public_pages = ['index.html' if urlparse(loc).path == '/' else urlparse(loc).path.lstrip('/') for loc in locations]
    for path in public_pages:
        check((ROOT / path).is_file(), f'Public page missing: {path}')
        audit_navigation((ROOT / path).read_text(), path)
    # Only the independently checked UF value/date/review may change financial
    # source records; bank metadata, rates, conditions and evidence dates survive.
    financial = json.loads((ROOT / 'data/hipotecario.json').read_bytes())
    old_financial = json.loads(baseline('data/hipotecario.json', comparador))
    check(financial['uf']['date'] == financial['uf']['source']['verifiedAt'] == '2026-10-10', 'Official UF date/review mismatch')
    check(financial['uf']['valueClp'] == 41136.24, 'UF differs from checked official SII value')
    restored_financial = json.loads(json.dumps(financial))
    for key in ['date', 'valueClp']:
        restored_financial['uf'][key] = old_financial['uf'][key]
    restored_financial['uf']['source']['verifiedAt'] = old_financial['uf']['source']['verifiedAt']
    check(restored_financial == old_financial, 'Bank/reference/source data changed beyond the approved official UF update')
    for path in ['assets/js/mortgage-engine.mjs', 'assets/js/mortgage-data.mjs', 'docs/cmf-fuentes-hipotecarias-2026-10-09.md']:
        check((ROOT / path).read_bytes() == baseline(path, comparador), f'Existing financial engine/source evidence changed: {path}')
    data_changes = git('diff', '--name-only', fichas, '--', 'data').decode().splitlines()
    check(all(path == 'data/hipotecario.json' for path in data_changes), 'An unapproved data source changed')
    catalog = (ROOT / 'proyectos.html').read_text()
    check('>ASSET PORTAFOLIO<' in catalog and '>Catálogo inmobiliario<' in catalog, 'Approved catalogue titles missing')
    check('Explora las alternativas disponibles y filtra el catálogo según ubicación o estado del proyecto.' in catalog, 'Exact catalogue description changed')
    return {
        'result': 'passed', 'scope': 'structural and baseline byte/file integrity; browser QA separate',
        'fichasBaseline': git('rev-parse', fichas).decode().strip(),
        'comparadorBaseline': git('rev-parse', comparador).decode().strip(),
        'projects': len(projects), 'simulationActions': simulations,
        'detailPagesOtherwiseByteIdentical': simulations, 'featuredStylesheetLinksAdded': featured_styles,
        'mapsPreserved': maps, 'embeddedTourInstancesPreserved': tours,
        'detailImageElementsPreserved': photographs, 'originalAssetFilesPreserved': total_assets,
        'officialPhotographFilesPreserved': property_assets, 'publicPagesWithBothMenusChecked': len(public_pages),
        'sitemapPagesPreserved': len(old_locations), 'sitemapPagesIntegrated': len(locations),
        'commercialDataUnchanged': True, 'researchSourcesUnchanged': True, 'bookingUnchanged': True,
        'optionalRutContactUnchanged': True, 'mortgageMathAndBankReferencesUnchanged': True,
        'approvedUf': financial['uf'],
    }


if __name__ == '__main__':
    print(json.dumps(main(), ensure_ascii=False, indent=2))
