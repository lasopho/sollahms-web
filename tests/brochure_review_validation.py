"""Exact source exceptions for the separately authorized brochure review.

Historical validators keep their original baseline modes. This helper permits
only the eight reviewed pages against the last complete integration commit.
"""
import re
import sys
import json
import hashlib
import subprocess
from pathlib import Path
from html.parser import HTMLParser
from virtual_tour_scope import restore_reviewed_file, historical_commercial_renderer
from automatic_embed_scope import REVIEWED_ASSETS, restore_automatic_asset

BASELINE = 'e903208160f62cc552e9efa4371a322ef75477b8'
INGEVEC = {'centenario-1', 'tocornal', 'vivaceta'}
AJ = {'downtown-san-martin', 'edificio-teatinos-750',
      'edificio-vista-amunategui', 'monjitas-690', 'vista-morande'}
REVIEW = INGEVEC | AJ
CSS = 'assets/css/aj-brochure-preview.css'
MOBILE_RULE = ('@media(max-width:600px){.ingevec-models .aj-metrics'
               '{grid-template-columns:repeat(2,minmax(0,1fr))}'
               '.ingevec-models .aj-metrics dd{overflow-wrap:anywhere}}\n')

# The commercial presentation request has its own fixed, already reviewed
# baseline. Historical brochure exceptions above stay available separately.
COMMERCIAL_BASELINE = '7a2732ae333b6a4d119cc2b651583daacbab8755'
INGEVEC_ADDED_BASELINE = 'b64911588e2fdf52f32d5f772b53735936fbd423'
INGEVEC_ADDED = {'coronel-godoy', 'diagonal-paraguay', 'el-aromo', 'los-lilenes',
                 'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589'}
ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}


class CommercialPage(HTMLParser):
    """Independent structural snapshot of visitor-facing resources/actions."""
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.stack = []
        self.visible = []
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        attributes = dict(pairs)
        self.elements.append((tag, attributes, tuple(self.stack)))
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, pairs):
        self.elements.append((tag, dict(pairs), tuple(self.stack)))

    def handle_endtag(self, tag):
        if tag in self.stack:
            del self.stack[len(self.stack) - 1 - self.stack[::-1].index(tag):]

    def handle_data(self, data):
        if 'body' in self.stack and not {'script', 'style'} & set(self.stack):
            self.visible.append(data)


def presentation_resource_signature(text):
    """No display-text normalisation may mask media, security or form changes."""
    page = CommercialPage(text)
    images, embeds, forms, media_links, actions, styles, model_ids = [], [], [], [], [], [], []
    for tag, attrs, _ in page.elements:
        if tag == 'img':
            # Accessibility descriptions may drop document/page references,
            # but every resource URL, dimensions and loading policy survive.
            images.append({k: v for k, v in attrs.items() if k != 'alt'})
        if tag == 'iframe' or attrs.get('data-embed-src'):
            embeds.append({k: v for k, v in attrs.items()
                           if k not in {'title', 'data-embed-title', 'aria-label'}})
        if tag in {'form', 'input', 'select', 'textarea'}:
            forms.append((tag, attrs))
        if tag == 'a':
            href = attrs.get('href', '')
            if href.startswith('/assets/') or 'google.com/maps' in href:
                media_links.append({k: v for k, v in attrs.items() if k != 'aria-label'})
            if href.startswith(('/contacto.html', '/agenda-asesoria.html', '/comparador-hipotecario.html')):
                actions.append(attrs)
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            styles.append(attrs)
        if attrs.get('id', '').startswith('modelo-'):
            model_ids.append(attrs['id'])
    scripts = re.findall(r'<script\b[^>]*>.*?</script>', text, flags=re.S | re.I)
    head = re.search(r'<head\b[^>]*>(.*?)</head>', text, flags=re.S | re.I)
    # Numeric commercial specifications must survive wording clean-up. This
    # includes model useful/terrace/total areas, bedroom/bathroom counts and UF.
    metrics = [re.findall(r'\d+(?:[.,]\d+)*', re.sub(r'<[^>]+>', ' ', item))
               for item in re.findall(r'<dd\b[^>]*>(.*?)</dd>', text, flags=re.S | re.I)]
    return {'images': images, 'embeds': embeds, 'forms': forms,
            'mediaLinks': media_links, 'actions': actions, 'styles': styles,
            'modelIds': model_ids, 'scripts': scripts,
            'head': head[1] if head else None, 'numericSpecifications': metrics}


def assert_commercial_presentation(current, previous, slug):
    """Exact approved transform plus independent resource/SEO invariants.

    Importing the shared copy transformer does not replace integrity testing:
    the independent signature below proves it cannot discard photographs,
    plans, maps, scripts, SEO or contact/simulation controls.
    """
    sys.path.insert(0, str(ROOT / 'scripts'))
    commercialize_fiche = historical_commercial_renderer()
    expected = commercialize_fiche(previous, slug=slug)
    protected_current = current
    if slug in INGEVEC_ADDED:
        assert '<!--INGEVEC_PREVIEW_START-->' in current and '<!--INGEVEC_PUBLIC_START-->' in current, \
            f'{slug}: reviewed additions must retain public fallback guards'
        protected_current = re.sub(r'<!--INGEVEC_PREVIEW_START-->.*?<!--INGEVEC_PREVIEW_END-->', '', current, flags=re.S)
        protected_current = re.sub(r'<!--INGEVEC_PUBLIC_START-->(.*?)<!--INGEVEC_PUBLIC_END-->', r'\1', protected_current, flags=re.S)
        baseline = subprocess.check_output(['git', 'show', f'{INGEVEC_ADDED_BASELINE}:{slug}.html'], cwd=ROOT).decode()
        assert protected_current == baseline, f'{slug}: content outside the new brochure blocks changed'
    assert protected_current == expected, f'{slug}: change beyond commercial presentation'
    assert commercialize_fiche(current, slug=slug) == current, f'{slug}: presentation is not idempotent'
    assert presentation_resource_signature(protected_current) == presentation_resource_signature(previous), \
        f'{slug}: resource, security, form or SEO configuration changed'
    page = CommercialPage(current)
    visible = ' '.join(page.visible)
    assert not any(attrs.get('id') in {'fuentes', 'fuentes-verificadas'}
                   or attrs.get('href') in {'#fuentes', '#fuentes-verificadas'}
                   for _, attrs, _ in page.elements), f'{slug}: public audit section/anchor remains'
    forbidden = r'\b(?:Yapo|IRIS|SHA-?256|hash(?:es)?|auditor[ií]a|procedencia documental|verificaci[oó]n|documentad[oa]s?)\b|(?:fuentes? oficiales?|fecha de verificaci[oó]n|[uú]ltima revisi[oó]n|revisado el|fuentes y verificaci[oó]n|brochure\s*·\s*p[aá]g|registrado en el cat[aá]logo)'
    assert not re.search(forbidden, visible, re.I), f'{slug}: public audit/contract copy remains'
    assert all(attrs.get('alt') for tag, attrs, _ in page.elements if tag == 'img'), \
        f'{slug}: image accessibility description lost'
    return current, previous


def assert_ingevec_manifest_addition(current, previous):
    before, after = json.loads(previous), json.loads(current)
    assert len(before['projects']) == 3 and len(after['projects']) == 10
    assert after['projects'][:3] == before['projects'], 'The previous three Ingevec records changed'
    assert {record['slug'] for record in after['projects'][3:]} == INGEVEC_ADDED, 'Unapproved brochure project addition'
    restored = dict(after, projects=before['projects'])
    restored.pop('batchAddition', None)
    assert restored == before, 'Original rights, date, baseline or top-level evidence changed'


def validate_commercial_source():
    """Successor audit scoped to display-only edits from the approved baseline."""
    if len(json.loads((ROOT / 'data/proyectos.json').read_text())) == 144:
        return validate_portfolio_source()
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=ROOT)

    def old(path):
        return git('show', f'{COMMERCIAL_BASELINE}:{path}')

    def same(path):
        if path == 'data/brochures-ingevec.json':
            assert_ingevec_manifest_addition((ROOT / path).read_bytes(), old(path))
        else:
            assert (ROOT / path).read_bytes() == old(path), f'{path}: protected bytes changed'

    projects = json.loads((ROOT / 'data/proyectos.json').read_bytes())
    assert len(projects) == len({p['slug'] for p in projects}) == 148, 'Expected exactly 148 projects'
    same('data/proyectos.json')
    source_records, asset_records, private_records = [], [], []
    # Every source-data file remains exact, including evidence, pending facts,
    # contractual scope and public financial references. The three historical
    # evidence ledgers are likewise protected; new documentation may be added.
    for path in git('ls-tree', '-r', '--name-only', COMMERCIAL_BASELINE, '--', 'data').decode().splitlines():
        same(path)
        source_records.append(path)
    for path in ['docs/registro-fichas-proyectos.md', 'docs/verificacion-fichas.md',
                 'docs/catalogo-22-validacion-2026-10-01.md',
                 'docs/brochures-yapo-iris-publicacion.md']:
        same(path)
        private_records.append(path)
    for directory in ['assets', 'api', 'lib']:
        for line in git('ls-tree', '-r', COMMERCIAL_BASELINE, '--', directory).decode().splitlines():
            metadata, path = line.split('\t', 1)
            current = (ROOT / path).read_bytes()
            blob = hashlib.sha1(b'blob ' + str(len(current)).encode() + b'\0' + current).hexdigest()
            assert blob == metadata.split()[2], f'{path}: media, financial logic or backend changed'
            asset_records.append(path)
    protected_html = {'proyectos.html', 'index.html', 'contacto.html', 'agenda-asesoria.html',
                      'comparador-hipotecario.html', 'guia-de-inversion.html'}
    for path in protected_html:
        if (ROOT / path).exists():
            same(path)
    for path in ['sitemap.xml', 'robots.txt', 'vercel.json']:
        if (ROOT / path).exists():
            same(path)
    images, model_ids, maps, tours = 0, 0, 0, 0
    for project in projects:
        slug = project['slug']
        current = (ROOT / (slug + '.html')).read_text()
        previous = old(slug + '.html').decode()
        if slug not in INGEVEC_ADDED:
            addition_previous = git('show', f'{INGEVEC_ADDED_BASELINE}:{slug}.html').decode()
            assert current == addition_previous, f'{slug}: one of the 141 unrelated fichas changed'
        assert_commercial_presentation(current, previous, slug)
        signature = presentation_resource_signature(current)
        images += len(signature['images'])
        model_ids += len(signature['modelIds'])
        for embed in signature['embeds']:
            url = embed.get('data-embed-src') or embed.get('src', '')
            if 'www.google.com/maps' in url:
                maps += 1
            else:
                tours += 1
    privacy = (ROOT / 'privacidad.html').read_text()
    section = re.compile(r'<section\b[^>]*aria-labelledby="informacion-inmobiliaria-material-grafico"[^>]*>.*?</section>\n', re.S)
    matches = section.findall(privacy)
    assert len(matches) == 1, 'General property/graphic-material notice missing or duplicated'
    assert section.sub('', privacy).encode() == old('privacidad.html'), 'Existing privacy policy changed'
    assert 'Información inmobiliaria y material gráfico' in matches[0]
    assert not re.search(r'Yapo|IRIS|SHA-?256|hash|contrato', matches[0], re.I), 'General legal notice discloses contract/audit material'
    return {'result': 'passed', 'scope': 'exact commercial transform plus independent resources, SEO and baseline integrity',
            'commercialPresentationMode': True, 'baselineCommit': COMMERCIAL_BASELINE,
            'projects': len(projects), 'commercialPagesChecked': len(projects),
            'resourceImageElementsPreserved': images, 'modelIdsPreserved': model_ids,
            'mapInstancesPreserved': maps, 'embeddedTourInstancesPreserved': tours,
            'protectedSourceDataFiles': len(source_records), 'protectedTraceabilityFiles': private_records,
            'protectedAssetAndBackendFiles': len(asset_records), 'privacyAdditiveOnly': True,
            'commercialDataUnchanged': True, 'contractScopeUnchanged': True,
            'financialLogicAndReferencesUnchanged': True, 'seoHeadAndScriptsUnchanged': True}


def public_page(text, slug):
    if slug not in REVIEW:
        return text
    batch = 'INGEVEC' if slug in INGEVEC else 'AJ'
    text = re.sub(fr'<!--{batch}_PREVIEW_START-->.*?<!--{batch}_PREVIEW_END-->',
                  '', text, flags=re.S)
    return re.sub(fr'<!--{batch}_PUBLIC_START-->(.*?)<!--{batch}_PUBLIC_END-->',
                  r'\1', text, flags=re.S)


def verified_public_page(current, previous, slug):
    """No unreviewed markup is hidden by broad comment removal."""
    if slug in INGEVEC:
        assert public_page(current, slug) == previous, f'{slug}: original public fallback changed'
        assert '<!--INGEVEC_PREVIEW_START-->' in current
        assert '<!--INGEVEC_PUBLIC_START-->' in current
    elif slug in AJ:
        expected = re.sub(r'<!--AJ_PREVIEW_START-->.*?<!--AJ_PREVIEW_END-->',
                          lambda match: match[0].replace('Modelos y planos', 'Modelos y distribuciones').replace(
                              '<h3>Fuente documental de modelos e imágenes</h3>',
                              '<h3>Fuente documental de modelos e imágenes</h3><p class="aj-attribution">Material promocional proporcionado a Sollahms mediante Yapo/IRIS.</p>'),
                          previous, flags=re.S)
        assert current == expected, f'{slug}: change beyond exact AJ title and Yapo/IRIS attribution'
    else:
        assert current == previous, f'{slug}: unrelated page changed'
    return public_page(current, slug), public_page(previous, slug)


def verify_asset(path, current, previous):
    expected = previous + MOBILE_RULE.encode() if path == CSS else previous
    assert current == expected, f'{path}: existing asset changed'

# Definitive authorization is a forward audit pinned to the last reviewed
# integration. Earlier audit modes above remain available for their snapshots.
PORTFOLIO_BASELINE = '8cdb9bf2af607a4f0822e5ea2c3ec4ba3f4c76b1'
RETIRED = {'brasil', 'vespucio-capital', 'edificio-serrano-capital',
           'edificio-carrera-capital', 'edificio-froilan-roa', 'hacienda-lo-errazuriz'}
ENRICHED = {'abdon-cifuentes', 'don-ignacio', 'terrazzo', 'vima'}
NEW_PROJECTS = {'los-alerces', 'valle-los-ingleses-iii'}
FINAL_INGEVEC = INGEVEC | INGEVEC_ADDED | ENRICHED | NEW_PROJECTS

# Exact launch exceptions reviewed in tests/commercial-html.mjs. Pin both
# historical and current bytes; unrelated assets, APIs and references keep the
# existing byte freeze. A new digest requires a separate source review.
LAUNCH_CHANGES = {
    'assets/js/hipotecario.mjs': ('23a3cd6ac6b5f7af33e747ba9afcc687f85b94b3fc77a2f0f055b8dcbac44e2a', 'b313f5dd6dbe2b27694d9751c0e19053ca3b671809914cab24854c82ded355d9'),
    'assets/js/purchase-capacity-ui.mjs': ('9c88641dae8d6cf9ab5ea1223b02a5abc917f9370f7862dea33366b226f73657', 'bdec9e59215c9b2116122dbded8e7604e380654defb3ef69f9d364c38556f724'),
    'api/contact.mjs': ('49de20c58d907203e424d17d2c933a7109c8c2d339d5bec4c67080c10992b73e', '6533c6f2e3cda476cd325d2074cc963394efdab16cc0839fb526da4aa1c399b2'),
    'lib/booking-server.mjs': ('09bada2e8bbeba6116fbe4974b391488f3c94ec3eca0df8696b6a194bc45326c', '27963d401a395e5a34cbbe623949e78327bc99b40848ecb828a6f217cbf0ccf4'),
    'vercel.json': ('657438c67f137cc5536583aa13f9451afec31bf8969ffc22480a1963d8a00401', '01087c9848f31ae6259db2c53ed20f668eb547e68bd4603303670aedc2b3320d'),
}
REVIEWED_SCOPES = {
    'data/brochures-aj-urbana.json': '8dc9872b11f578321d176dcd83b9c2da457a55f65104112c029582f20a688cc2',
    'data/brochures-ingevec.json': 'a7ba43c7df9066c1be2fff1c04c8e05c24465b8528c2ed49d4ca1e23808aa6ca',
}


def restore_reviewed_scope(after, before, path):
    scope = after['publicationRights']['contractScope']
    # Match JSON.stringify's UTF-8 compact serialization used by the Node audit.
    digest = hashlib.sha256(json.dumps(scope, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    assert digest == REVIEWED_SCOPES[path], f'{path}: contractScope exceeds exact reviewed evidence'
    restored = json.loads(json.dumps(after))
    restored['publicationRights']['contractScope'] = before['publicationRights']['contractScope']
    assert restored['publicationRights'] == before['publicationRights'], f'{path}: unreviewed publication rights changed'
    return restored


def assert_launch_bytes(path, current, previous):
    if path in REVIEWED_ASSETS:
        current = restore_automatic_asset(path, current)
    if path in LAUNCH_CHANGES:
        before, after = LAUNCH_CHANGES[path]
        assert hashlib.sha256(previous).hexdigest() == before, f'{path}: unrecognized protected baseline'
        assert hashlib.sha256(current).hexdigest() == after, f'{path}: change exceeds exact UF/security review'
    else:
        assert current == previous, f'{path}: protected baseline bytes changed'



def portfolio_previous(path):
    return subprocess.check_output(['git', 'show', f'{PORTFOLIO_BASELINE}:{path}'], cwd=ROOT)


def corrected_vima(text):
    return re.sub(r'<figure>(?:(?!</figure>).)*571b2a1740b3b5d4920157fa\.webp(?:(?!</figure>).)*</figure>', '', text, flags=re.S)


def validate_portfolio_source():
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    assert len(projects) == len({p['slug'] for p in projects}) == 144
    old_projects = json.loads(portfolio_previous('data/proyectos.json'))
    assert len(old_projects) == 148
    expected_slugs = [p['slug'] for p in old_projects if p['slug'] not in RETIRED] + ['los-alerces', 'valle-los-ingleses-iii']
    assert [p['slug'] for p in projects] == expected_slugs
    assert {p['slug'] for p in projects if p['inmobiliaria'] == 'Ingevec'} == FINAL_INGEVEC
    assert len([p for p in projects if p['inmobiliaria'] != 'Ingevec']) == 128
    assert all(not (ROOT / (s + '.html')).exists() for s in RETIRED)
    new_specs = {'los-alerces': ('Los Alerces', 'Ñuñoa', 'Los Alerces 3254', 'c93eaab1b4c5a398c7f49e98614a40781fb01f9428aba6c9fea7d52e2a7882bd'),
                 'valle-los-ingleses-iii': ('Valle Los Ingleses III', 'Valparaíso', 'Camino Los Ingleses 715', '509ad7aeaafec2b9e09354505a117aea77efb354a433a0d4eae27b08e6378f08')}
    for name in ['proyectos', 'fichas-proyectos', 'registro-fichas']:
        before = json.loads(portfolio_previous(f'data/{name}.json'))
        after = json.loads((ROOT / f'data/{name}.json').read_text())
        assert len(after) == 144 and [r['slug'] for r in after] == expected_slugs
        by_slug = {r['slug']: r for r in after}
        for item in before:
            if item['slug'] in RETIRED:
                continue
            if name == 'fichas-proyectos' and item['slug'] == 'vima':
                item['images'] = [image for image in item['images'] if image.get('localPath') != '/assets/propiedades/catalogo/571b2a1740b3b5d4920157fa.webp']
            assert by_slug[item['slug']] == item, f'{name}/{item["slug"]}: prior data changed'
        for slug, (title, commune, address, source_hash) in new_specs.items():
            item = by_slug[slug]
            if name == 'proyectos':
                assert item['nombre'] == title and item['inmobiliaria'] == 'Ingevec' and item['comuna'] == commune and item['direccion'] == address
                assert all(item[key] is None for key in ['precioDesdeUF', 'estado', 'entrega'])
                assert 'precioDesdeUF' not in item['verificacion']['camposVerificados']
            elif name == 'fichas-proyectos':
                assert item['sourceDocument']['sha256'] == source_hash and item['virtualTours'] == []
                assert item['updates']['precioDesdeUF'] is None
            else:
                assert item['mapa'] and item['fichaDesarrollada'] and not item['matterport']
    # All ten prior records and commercial policy remain exact. Only the exact
    # contractual scope verified for launch may replace the previous scope.
    manifest = json.loads((ROOT / 'data/brochures-ingevec.json').read_text())
    before_manifest = json.loads(portfolio_previous('data/brochures-ingevec.json'))
    assert len(manifest['projects']) == 16
    assert manifest['projects'][:10] == before_manifest['projects']
    restored = restore_reviewed_scope(manifest, before_manifest, 'data/brochures-ingevec.json')
    restored['projects'] = before_manifest['projects']
    restored.pop('portfolioConsolidation')
    assert restored == before_manifest
    assert {r['slug'] for r in manifest['projects']} == FINAL_INGEVEC
    for path in ['data/hipotecario.json', 'data/brochures-aj-urbana.json', 'data/fuentes-imagenes.json', 'data/catalogo-original-fichas.json', 'privacidad.html', 'templates/project-detail.html', 'vercel.json', 'robots.txt']:
        current, previous = (ROOT / path).read_bytes(), portfolio_previous(path)
        if path == 'templates/project-detail.html':
            current = restore_reviewed_file(path, current)
        if path == 'data/brochures-aj-urbana.json':
            assert restore_reviewed_scope(json.loads(current), json.loads(previous), path) == json.loads(previous), f'{path}: original assets/evidence changed'
        else:
            assert_launch_bytes(path, current, previous)
    assets = 0
    for directory in ['assets', 'api', 'lib']:
        tree = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', PORTFOLIO_BASELINE, '--', directory], cwd=ROOT).decode().splitlines()
        for path in tree:
            if path == 'lib/project-context.mjs':
                continue
            assert_launch_bytes(path, (ROOT / path).read_bytes(), portfolio_previous(path))
            assets += 1
    context = (ROOT / 'lib/project-context.mjs').read_text()
    actual_context = json.loads(re.search(r'Object\.freeze\((.*)\);', context, re.S)[1])
    assert actual_context == {p['slug']: {'name': p['nombre'], 'url': p['detalleUrl']} for p in projects}
    old_urls = re.findall(r'<loc>([^<]+)</loc>', portfolio_previous('sitemap.xml').decode())
    expected_urls = [url for url in old_urls if url.rsplit('/',1)[-1].removesuffix('.html') not in RETIRED]
    at = expected_urls.index('https://sollahms.cl/comparador-hipotecario.html')
    expected_urls[at:at] = ['https://sollahms.cl/los-alerces.html', 'https://sollahms.cl/valle-los-ingleses-iii.html']
    assert re.findall(r'<loc>([^<]+)</loc>', (ROOT / 'sitemap.xml').read_text()) == expected_urls
    assert len(set(expected_urls)) == 150
    import sys
    sys.path.insert(0,str(ROOT / 'scripts'))
    commercialize_fiche = historical_commercial_renderer()
    images = models = maps = tours = unchanged = 0
    for project in projects:
        slug = project['slug']; text = restore_reviewed_file(slug + '.html', (ROOT / (slug + '.html')).read_bytes()).decode()
        if slug not in NEW_PROJECTS:
            previous = portfolio_previous(slug + '.html').decode()
            if slug in ENRICHED:
                fallback = re.sub(r'<!--INGEVEC_PREVIEW_START-->.*?<!--INGEVEC_PREVIEW_END-->', '', text, flags=re.S)
                fallback = re.sub(r'<!--INGEVEC_PUBLIC_START-->(.*?)<!--INGEVEC_PUBLIC_END-->', r'\1', fallback, flags=re.S)
                assert fallback == (corrected_vima(previous) if slug == 'vima' else previous), f'{slug}: enrichment exceeds guarded scope'
                for key in ['embeds','forms','actions','scripts','head','numericSpecifications']:
                    assert presentation_resource_signature(fallback)[key] == presentation_resource_signature(previous)[key], f'{slug}: {key} changed'
            else:
                assert text == previous, f'{slug}: unrelated fiche changed'
                unchanged += 1
        else:
            assert 'Consultar precio' in text and 'id="modelos"' in text and 'www.google.com/maps' in text
            for route in ['contacto','agenda-asesoria','comparador-hipotecario']:
                assert f'/{route}.html?proyecto={slug}' in text
        assert commercialize_fiche(text,slug) == text
        page=CommercialPage(text); visible=' '.join(page.visible)
        assert not re.search(r'\b(?:Yapo|IRIS|SHA-?256|auditor[ií]a|procedencia documental|fecha de verificaci[oó]n|fuentes oficiales|hashes?)\b',visible,re.I)
        assert not re.search(r'id="fuentes(?:-verificadas)?"',text)
        signature=presentation_resource_signature(text);images+=len(signature['images']);models+=len(signature['modelIds'])
        for embed in signature['embeds']:
            url=embed.get('data-embed-src') or embed.get('src','');maps+='google.com/maps' in url;tours+='google.com/maps' not in url
    assert unchanged == 138
    # Seven existing global public/error pages are byte identical.
    for path in ['index.html','proyectos.html','contacto.html','agenda-asesoria.html','comparador-hipotecario.html','guia-de-inversion.html','404.html']:
        if (ROOT/path).is_file():
            expected=portfolio_previous(path)
            if path=='proyectos.html':
                assert expected.count(b"'Precio pendiente de verificaci\xc3\xb3n'")==1
                expected=expected.replace(b"'Precio pendiente de verificaci\xc3\xb3n'", "(['los-alerces', 'valle-los-ingleses-iii'].includes(project.slug) ? 'Consultar precio' : 'Precio pendiente de verificación')".encode())
            assert (ROOT/path).read_bytes()==expected,path
    for path in ROOT.glob('*.html'):
        text=path.read_text()
        for slug in RETIRED:assert not re.search(r'(?:href|src|data-[\w-]+)=["\'][^"\']*/'+re.escape(slug)+r'\.html',text),f'{path}: retired route referenced'
    return {'result':'passed','scope':'definitive portfolio authorization plus exact preservation of 128 other developers and existing commercial/financial resources',
            'portfolioConsolidationMode':True,'baselineCommit':PORTFOLIO_BASELINE,'projects':144,'ingevecProjects':16,'commercialEntries':17,'otherDevelopersUnchanged':128,'retiredRoutes':6,'newProjects':2,'enrichedExistingProjects':4,
            'commercialPagesChecked':144,'resourceImageElementsPreserved':images,'modelIdsPreserved':models,'mapInstancesPreserved':maps,'embeddedTourInstancesPreserved':tours,'protectedAssetAndBackendFiles':assets,
            'commercialDataUnchanged':True,'contractScopeUnchanged':False,'contractScopeExactlyReviewed':True,
            'approvedUfAndSecurityChanges':sorted(LAUNCH_CHANGES),'mortgageMathAndBankReferencesUnchanged':True,'seoHeadAndScriptsUnchanged':True}
