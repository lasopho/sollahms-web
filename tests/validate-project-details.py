#!/usr/bin/env python3
"""Catalogue-wide navigation, internal provenance and safe public fallback checks."""
import argparse
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from virtual_tour_policy import virtual_tours_to_render
from sento_scope import original_data as restore_sento_rows, historical_file as validate_sento_file, SLUGS as SENTO_SLUGS
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--site-root', type=Path,
                    help='Check the actual packaged public DOM/assets while retaining repository provenance')
args = parser.parse_args()
SITE_ROOT = args.site_root.resolve() if args.site_root else ROOT
FEATURED = {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'}

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.images, self.ids, self.embeds, self.iframes = [], [], [], [], []
        self.sections, self.embed_sections, self.iframe_sections = [], [], []
        self.current_stage, self.stage_stack, self.iframe_stages = None, [], []
        self.headings = 0
        self.feed(text)
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        previous_stage = self.current_stage
        self.current_stage = attrs.get('data-commercial-stage', self.current_stage)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stage_stack.append((tag, previous_stage))
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
            self.iframe_stages.append(self.current_stage)
        if tag in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.current_stage = previous_stage
    def handle_endtag(self, tag):
        if tag == 'section' and self.sections:
            self.sections.pop()
        for index in range(len(self.stage_stack)-1, -1, -1):
            if self.stage_stack[index][0] == tag:
                self.current_stage = self.stage_stack[index][1]
                del self.stage_stack[index:]
                break

projects = json.loads((ROOT / 'data/proyectos.json').read_text())
research = json.loads((ROOT / 'data/fichas-proyectos.json').read_text())
ledger = json.loads((ROOT / 'data/registro-fichas.json').read_text())
# Validate the current seven approved successor rows before using their
# distinct PDF/page provenance schema in the catalogue-wide DOM checks.
restore_sento_rows(research, 'data/fichas-proyectos.json')
restore_sento_rows(ledger, 'data/registro-fichas.json')
sento_review_bytes = (ROOT / 'data/sento-review.json').read_bytes()
assert hashlib.sha256(sento_review_bytes).hexdigest() == 'e44ae176a8fe3384ba33df0306e0a97594fc2a1c692aa423310e9b4b6a1bea5f'
sento_sources = {entry['slug']: entry for entry in json.loads(sento_review_bytes)['projects']}
records = {r['slug']: r for r in research}
slugs = {p['slug'] for p in projects}
assert len(slugs) == len(projects) == 137, 'Catalogue has lost or duplicated projects'
assert len([p for p in projects if p['inmobiliaria'] == 'Ecasa']) == 15
assert len([p for p in projects if p['inmobiliaria'] != 'Ecasa']) == 122
assert len([p for p in projects if p['inmobiliaria'] == 'Ingevec']) == 16
assert slugs == set(records) == {x['slug'] for x in ledger}, 'Incomplete inventory or research'
assert len(research) == len(ledger) == len(projects), 'Duplicated audit records'
assert all(r['fichaDesarrollada'] for r in ledger), 'A detail page is missing'
baseline = json.loads((ROOT / 'tests/fixtures/nordico-catalogue-baseline.json').read_text())
def canonical_digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
# Restore only the seven independently approved Sento successor rows before
# checking the fixed 136-project Nórdico integration boundary. Current Sento
# data and HTML retain their independent assertions in sento-main-merge.mjs.
historical_projects = restore_sento_rows(projects)
previous_projects = [project for project in historical_projects if project['slug'] != 'edificio-nordico']
assert len(previous_projects) == baseline['count'] == 136
assert canonical_digest(previous_projects) == baseline['projectsSha256'], 'Nórdico integration changed an existing commercial catalogue row'
assert canonical_digest([project for project in previous_projects if project['inmobiliaria'] == 'Ecasa']) == baseline['ecasaSha256'], 'The 15 approved Ecasa projects changed'
assert sum(project['slug'] == 'own' for project in projects) == 1, 'Own must remain in the catalogue'
assert sum(project['slug'] == 'parque-germania' for project in projects) == 1, 'Parque Germania must remain one project'
nordico = next(project for project in projects if project['slug'] == 'edificio-nordico')
nordico_record = records[nordico['slug']]
assert nordico['inmobiliaria'] == 'Leben' and nordico['comuna'] == 'Puerto Varas'
assert nordico['precioDesdeUF'] == 4746 and nordico['superficieDesdeM2'] == 42
assert nordico['estado'] == 'Venta en blanco' and nordico['entrega'] is None
assert nordico_record['specs']['utilM2'] is None and nordico_record['specs']['totalM2'] is None, 'An unclassified range must not invent useful or total areas'
assert nordico_record['specs']['banos'] is None, 'The 1D1B unit 101 does not establish bathrooms for all layouts'
assert nordico_record['verifiedFeatures']['terminaciones'] == []
assert nordico_record.get('planPendingNote') and not nordico_record.get('sourceDocument'), 'Nórdico has no supplied brochure or accredited model plans'
assert not nordico_record.get('virtualTours'), 'The unverified location viewer must not become an accredited interior tour'
image_sources = json.loads((ROOT / 'data/fuentes-imagenes.json').read_text())
assert len(nordico_record['images']) == 3
for image in nordico_record['images']:
    provenance = image_sources[image['url']]
    assert image['sourceUrl'] == provenance['sourceUrl'] == 'https://nordico.ileben.cl/'
    assert image['width'] >= 1200 and image['height'] >= 588
    assert provenance.get('qualityStatus') == 'approved'
    assert hashlib.sha256((SITE_ROOT / image['localPath'].lstrip('/')).read_bytes()).hexdigest() == provenance['localSha256'], 'Nórdico official derivative does not match its reviewed hash'
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
    path = SITE_ROOT / (slug + '.html')
    assert project['detalleUrl'] == '/' + slug + '.html'
    assert path.is_file(), f'{slug}: missing detail'
    text = path.read_text()
    if slug in SENTO_SLUGS:
        # The packaged Preview adds noindex and the shared caption policy;
        # bind its source to the exact approved HTML, then check real DOM below.
        validate_sento_file(slug + '.html', (ROOT / (slug + '.html')).read_bytes())
    page = Page(text)
    assert page.headings == 1, f'{slug}: expected one main heading'
    assert len(page.ids) == len(set(page.ids)), f'{slug}: duplicated element IDs'
    assert '<html' in text and 'lang="es"' in text
    assert 'name="viewport"' in text and f'https://sollahms.cl/{slug}.html' in text
    assert not re.search(r'\b(?:undefined|NaN)\b', text), f'{slug}: missing value leaks to page'
    multiple_stages = len(project.get('etapasComerciales', [])) > 1
    reference_stage = next((stage for stage in project.get('etapasComerciales', []) if stage['slug'] == project.get('etapaReferenciaSlug')), None)
    action_query = '?proyecto=' + slug + ('&etapa=' + str(reference_stage['etapa']) if multiple_stages else '')
    contact = [a for a in page.links if a.get('href') == '/contacto.html' + action_query]
    booking = [a for a in page.links if a.get('href') == '/agenda-asesoria.html' + action_query]
    assert contact and booking, f'{slug}: contextual consultation or booking missing'
    for link in page.links:
        href = link.get('href', '')
        if href.startswith('#'):
            assert href[1:] in page.ids, f'{slug}: broken anchor {href}'
        elif href.startswith('/'):
            parsed = urlparse(href)
            dest = SITE_ROOT / (unquote(parsed.path).lstrip('/') or 'index.html')
            assert dest.is_file(), f'{slug}: broken internal link {href}'
            checked_links += 1
        elif href.startswith('https:'):
            assert link.get('target') != '_blank' or 'noopener' in link.get('rel', ''), f'{slug}: unsafe new tab'
    for img in page.images:
        assert img.get('alt'), f'{slug}: image without accessible description'
        if img.get('src', '').startswith('/'):
            assert (SITE_ROOT / img['src'].lstrip('/')).is_file(), f'{slug}: missing local image'
    record = records[slug]
    stage_entries = record.get('etapasComerciales', [])
    stage_records = {stage['slug']: stage['investigacion'] for stage in stage_entries}
    all_records = list(stage_records.values()) if stage_records else [record]
    for image in record.get('images', []):
        document = sento_sources.get(slug, {}).get('document')
        if document:
            assert image['sourceSha256'] == document['sha256'], f'{slug}: image assigned to another PDF'
            assert isinstance(image['sourcePage'], int) and 1 <= image['sourcePage'] <= document['pageCount'], f'{slug}: undocumented image page'
            assert image in sento_sources[slug]['images'], f'{slug}: image differs from the pinned Sento review'
            assert hashlib.sha256((SITE_ROOT / image['localPath'].lstrip('/')).read_bytes()).hexdigest() == image['sha256'], f'{slug}: changed reviewed Sento image'
        else:
            assert image.get('sourceUrl', '').startswith('https://'), f'{slug}: official image without provenance'
    for tour in [tour for source in all_records for tour in source.get('virtualTours', [])]:
        assert tour.get('sourceUrl', '').startswith('https://'), f'{slug}: tour without provenance'
    host_config = re.search(r'<script type="application/json" id="project-embed-hosts">(.*?)</script>', text, re.S)
    assert host_config, f'{slug}: missing iframe host configuration'
    permitted_hosts = json.loads(host_config[1])
    assert isinstance(permitted_hosts, list) and all(isinstance(host, str) for host in permitted_hosts)
    embedded_urls = [(entry['data-embed-src'], section, None) for entry, section in zip(page.embeds, page.embed_sections)] + [(entry.get('src', ''), section, stage) for entry, section, stage in zip(page.iframes, page.iframe_sections, page.iframe_stages)]
    project_maps = []
    reference_maps = []
    for embedded_url, sections, origin_stage in embedded_urls:
        if stage_records:
            assert origin_stage in stage_records, f'{slug}: iframe lacks its exact commercial origin'
        source_record = stage_records.get(origin_stage, record)
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
                assert all(key in source_record['verifiedFields'] for key in ['direccion', 'comuna', 'mapQuery']), f'{slug}: map without verified location'
                official_address = source_record.get('updates', {}).get('direccion', project.get('direccion'))
                assert query and official_address in query, f'{slug}: map diverges from official address'
            assert not re.search(r'-\d{2}\.\d+\s*,\s*-\d{2}\.\d+', query), f'{slug}: approximate coordinates'
        else:
            backed = [tour for tour in source_record.get('virtualTours', []) if same_tour(embedded_url, tour['url'])]
            assert backed, f'{slug}: embedded tour is not backed by project research'
            assert any(tour.get('embedStatus') == 'allowed' for tour in backed), f'{slug}: tour embedding permission is not verified'
    assert len(project_maps) <= max(1, len(stage_records)), f'{slug}: duplicated map'
    if stage_records:
        for stage_slug in stage_records:
            own_maps = [frame for frame, origin in zip(page.iframes, page.iframe_stages) if origin == stage_slug and frame.get('data-project-embed') == 'map']
            assert len(own_maps) <= 1, f'{slug}/{stage_slug}: duplicated stage map'
    assert len(reference_maps) <= 1, f'{slug}: duplicated contextual reference map'
    context_reference_maps += len(reference_maps)
    maps += len(project_maps)
    if slug not in FEATURED:
        new_maps += len(project_maps)
    assert ledger_by_slug[slug]['mapa'] == bool(project_maps), f'{slug}: map audit differs from rendered page'
    context_ledger = ledger_by_slug[slug].get('contextoOficial', {})
    assert context_ledger.get('mapaDeReferencia', False) == bool(reference_maps), f'{slug}: reference-map audit differs from rendered page'
    published_links = {entry.get('href') for entry in page.links}
    published_frames = {entry.get('src') for entry in page.iframes}
    assert not page.embeds, f'{slug}: activation-only embeds remain'
    for frame in page.iframes:
        assert frame.get('loading') == 'lazy' and frame.get('title'), f'{slug}: iframe must load automatically and have an accessible title'
        assert frame.get('referrerpolicy') == 'strict-origin-when-cross-origin', f'{slug}: iframe referrer policy changed'
    # The seven pinned Sento fiches preserve their approved external viewer
    # alternatives as links; they use sento_fiche's independently reviewed
    # policy. All other developers keep the existing usable-tour policy.
    rendered_tours = ([tour for source in all_records for tour in source.get('virtualTours', [])]
                      if slug in SENTO_SLUGS else
                      [tour for source in all_records for tour in virtual_tours_to_render(source)])
    for tour in rendered_tours:
        if tour.get('embedStatus') == 'allowed':
            assert tour['url'] in published_frames, f'{slug}: automatic tour frame missing'
            assert tour['url'] not in published_links, f'{slug}: redundant external tour link remains'
        else:
            if slug in SENTO_SLUGS:
                assert tour in records[slug]['virtualTours'] and tour.get('embedStatus') == 'link', f'{slug}: unreviewed Sento provider alternative'
            else:
                assert slug == 'endemico' and tour['url'] == 'https://mybakerlab.com/endemico/', f'{slug}: unreviewed provider fallback'
            assert tour['url'] in published_links and tour['url'] not in published_frames, f'{slug}: documented external alternative missing'
    for tour in [tour for source in all_records for tour in source.get('virtualTours', [])]:
        if tour not in rendered_tours:
            assert tour['url'] not in published_links, f'{slug}: unavailable or unassociated tour still published'
            assert tour['url'] not in published_frames, f'{slug}: unavailable or unassociated tour still embedded'
    assert 'La disponibilidad de esta experiencia está pendiente de confirmación con el proveedor.' not in text, f'{slug}: stale tour availability notice'
    if not rendered_tours:
        assert 'recorrido' not in page.ids, f'{slug}: empty or unassociated tour section'
        assert '#recorrido' not in published_links, f'{slug}: stale tour navigation'
        assert 'Recorridos y experiencias oficiales' not in text, f'{slug}: empty legacy tour block'
        assert 'Consulta la disponibilidad de un recorrido virtual' not in text, f'{slug}: absent-tour placeholder'
    actual_matterport = any((tour.get('provider') == 'Matterport' or slug in SENTO_SLUGS and urlparse(tour['url']).hostname in {'my.matterport.com', 'mpembed.com'}) and tour['url'] in published_frames for source in all_records for tour in source.get('virtualTours', []))
    assert ledger_by_slug[slug]['matterport'] == actual_matterport, f'{slug}: Matterport audit differs from rendered page'
    assert ledger_by_slug[slug]['recorridosOficiales'] == sum(len(source.get('virtualTours', [])) for source in all_records), f'{slug}: official tour count differs from research'
    if slug not in FEATURED:
        assert all(x in page.ids for x in ['proyecto', 'caracteristicas', 'galeria', 'ubicacion'])
        assert ('recorrido' in page.ids) == bool(rendered_tours), f'{slug}: conditional tour section disagrees with registered usable tours'
        if 'precioDesdeUF' not in record.get('verifiedFields', []) or record.get('updates', {}).get('precioDesdeUF', project.get('precioDesdeUF')) is None:
            if slug in SENTO_SLUGS:
                assert project['precioDesdeUF'] is None and re.search(r'<span class="price-label">Precio desde</span><strong>Consultar precio</strong>', text), f'{slug}: unconfirmed Sento price shown as current'
            else:
                assert re.search(r'Precio desde(?: · Etapa [1-3])?</span><strong><span class="pending">', text), f'{slug}: historical price shown as current'
            assert 'Consultar precio' in text, f'{slug}: unconfirmed commercial price must invite consultation'
        actual_schema = [json.loads(ld) for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S)]
        if slug in SENTO_SLUGS:
            source_schema = [json.loads(ld) for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', (ROOT / (slug + '.html')).read_text(), re.S)]
            assert actual_schema == source_schema, f'{slug}: approved Sento structured data changed in packaging'
        else:
            assert all(ld['@type'] == 'WebPage' for ld in actual_schema)
    if slug == 'edificio-nordico':
        assert 'planos-pendientes' in page.ids and 'Planos y superficies por modelo' in text
        assert 'unidad 101' in text and 'No incluye estacionamiento ni bodega' in text, 'Nórdico price must preserve its unit and exclusions'
        assert 'https://www.lanube360.com/ileben/edificio-nordico/' not in text
    assert not any(x in page.ids for x in ['fuentes', 'fuentes-verificadas']), f'{slug}: audit section remains visitor-facing'
    assert not any(x.get('href') in ['#fuentes', '#fuentes-verificadas'] for x in page.links), f'{slug}: stale audit navigation anchor'
sitemap = ET.fromstring((SITE_ROOT / 'sitemap.xml').read_text())
urls = [x.text for x in sitemap.findall('.//{*}loc')]
assert len(urls) == len(set(urls))
assert all('https://sollahms.cl' + p['detalleUrl'] in urls for p in projects)
assert 'fetch(\'/data/proyectos.json\')' in (SITE_ROOT / 'agenda-asesoria.html').read_text(), 'Booking still has a limited hardcoded project list'
print(json.dumps({'projects': len(projects), 'pages': len(ledger), 'internalLinksChecked': checked_links, 'newVerifiedMaps': new_maps, 'verifiedMaps': maps, 'officialContextReferenceMaps': context_reference_maps, 'sitemapUrls': len(urls), 'siteRoot': str(SITE_ROOT), 'result': 'passed'}))
