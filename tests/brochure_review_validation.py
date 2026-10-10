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
    from fiche_presentation import commercialize_fiche
    expected = commercialize_fiche(previous, slug=slug)
    assert current == expected, f'{slug}: change beyond commercial presentation'
    assert commercialize_fiche(current, slug=slug) == current, f'{slug}: presentation is not idempotent'
    assert presentation_resource_signature(current) == presentation_resource_signature(previous), \
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


def validate_commercial_source():
    """Successor audit scoped to display-only edits from the approved baseline."""
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=ROOT)

    def old(path):
        return git('show', f'{COMMERCIAL_BASELINE}:{path}')

    def same(path):
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
