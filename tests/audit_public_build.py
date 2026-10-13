#!/usr/bin/env python3
"""Read-only audit of an offline public build and its protected Preview twin.

No deployment, network access, message or reservation is performed. Receipts
must be written outside the source checkout and both public output directories.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.parse
import xml.etree.ElementTree as ET


INGEVEC = {'centenario-1', 'tocornal', 'vivaceta', 'coronel-godoy',
    'diagonal-paraguay', 'el-aromo', 'los-lilenes', 'matta-016',
    'nueva-esmeralda', 'vicuna-mackenna-7589', 'abdon-cifuentes',
    'don-ignacio', 'terrazzo', 'vima', 'los-alerces', 'valle-los-ingleses-iii'}
REMOVED = {'brasil', 'vespucio-capital', 'edificio-serrano-capital',
    'edificio-carrera-capital', 'edificio-froilan-roa', 'hacienda-lo-errazuriz',
    'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center'}
ECASA = {'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
    'terratolten-1', 'wayra', 'alto-san-joaquin-3', 'enlace-mackenna',
    'ferroparque-2', 'espacio-victoria', 'lamara', 'terratolten-3',
    'lomas-de-puyai-3', 'cumbres-de-penuelas', 'aires-la-florida-2',
    'conecta-huechuraba', 'urban-la-florida', 'alto-san-joaquin',
    'alto-san-joaquin-2', 'nucleo-costanera', 'terratolten-2', 'nucleo-costanera-2'}
PAGES = {'404.html', 'agenda-asesoria.html', 'comparador-hipotecario.html',
    'contacto.html', 'index.html', 'privacidad.html', 'proyectos.html'}
PUBLIC_DATA = {'data/proyectos.json', 'data/hipotecario.json'}
NOTICE = '<div role="note" style="padding:14px 24px;background:#003229;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">Vista previa de revisión. Los formularios no envían mensajes ni crean reservas.</div>'
HIDDEN_AUDIT = re.compile(r'fuentes oficiales|fecha de verificaci[oó]n|procedencia documental|registro de investigaci[oó]n|auditor[ií]a|\bsha256\b|\bhash(?:es)?\b|Yapo/IRIS', re.I)


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.metas, self.links = [], set(), {}, []
        self.visible, self.h1, self.hidden = [], 0, 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {'head', 'script', 'style'}:
            self.hidden += 1
        if tag == 'h1':
            self.h1 += 1
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'meta':
            self.metas[attrs.get('name', attrs.get('property', ''))] = attrs.get('content', '')
        if tag == 'link':
            self.links.append(attrs)
        for key in ['src', 'href', 'poster', 'data-embed-src']:
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == 'meta' and attrs.get('property') == 'og:image':
            self.refs.append(attrs.get('content', ''))

    def handle_endtag(self, tag):
        if tag in {'head', 'script', 'style'}:
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden:
            self.visible.append(data)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized_preview(text):
    return re.sub(r'<meta name="robots" content="noindex, nofollow">\s*', '', text).replace(NOTICE, '')


def selected_ecasa_html(text, included):
    """Project only the two reviewed Ecasa branches; preserve every other byte."""
    remove, keep = ('PUBLIC', 'PREVIEW') if included else ('PREVIEW', 'PUBLIC')
    text = re.sub(r'<!--ECASA_' + remove + r'_START-->[\s\S]*?<!--ECASA_' + remove + r'_END-->', '', text)
    return re.sub(r'<!--ECASA_' + keep + r'_(?:START|END)-->', '', text)


def audit(source, public, preview, protected_review=False):
    errors, warnings = [], []
    counts = {'projects': 0, 'ingevec': 0, 'ecasa': 0, 'pages': 0, 'localReferences': 0,
              'brochureImages': 0, 'brochurePlans': 0, 'brochureMedia': 0,
              'brochureCovers': 0, 'canonicalFiches': 0, 'sitemapUrls': 0,
              'ecasaImages': 0, 'ecasaPlans': 0, 'ecasaMedia': 0, 'ecasaCovers': 0}

    def require(condition, issue):
        if not condition:
            errors.append(issue)

    catalogue = json.loads((public / 'data/proyectos.json').read_text())
    slugs = {p['slug'] for p in catalogue}
    counts['projects'] = len(catalogue)
    counts['ingevec'] = sum(p['inmobiliaria'] == 'Ingevec' for p in catalogue)
    counts['ecasa'] = sum(p['inmobiliaria'].lower() == 'ecasa' for p in catalogue)
    require(len(catalogue) == len(slugs) == 143, 'Catalogue must contain exactly 143 distinct projects')
    require({p['slug'] for p in catalogue if p['inmobiliaria'] == 'Ingevec'} == INGEVEC,
            'The sixteen approved Ingevec identities must remain exact')
    require({p['slug'] for p in catalogue if p['inmobiliaria'].lower() == 'ecasa'} == ECASA,
            'The 22 approved Ecasa identities must remain exact')
    require(not REMOVED & slugs, 'A retired project re-entered the catalogue')
    expected_pages = PAGES | {slug + '.html' for slug in slugs}
    files = {str(p.relative_to(public)) for p in public.rglob('*') if p.is_file()}
    require({f for f in files if '/' not in f and f.endswith('.html')} == expected_pages,
            'Public HTML routes differ from the approved catalogue and seven global pages')
    require(not any(slug + '.html' in files for slug in REMOVED), 'Retired project route must return 404')
    for path in sorted(files):
        require(path in expected_pages | PUBLIC_DATA | {'robots.txt', 'sitemap.xml'} or path.startswith('assets/'),
                'Unexpected public file: ' + path)
        require(not (public / path).is_symlink(), 'Symbolic public resource: ' + path)
        require(not re.search(r'(^|/)(?:\.[^/]+|brochure-candidates)(/|$)|\.(?:pdf|zip|docx?|xlsx?|toml|env)$', path, re.I),
                'Private document or candidate leaked: ' + path)
    require({f for f in files if f.startswith('data/')} == PUBLIC_DATA,
            'Only catalogue and public mortgage reference data may be static JSON routes')

    documents = {page: Document((public / page).read_text()) for page in expected_pages if page in files}
    counts['pages'] = len(documents)
    missing_social = []
    for project in catalogue:
        page = project['slug'] + '.html'
        if page not in documents:
            errors.append('Missing fiche: ' + page)
            continue
        doc = documents[page]
        canonical = [a.get('href') for a in doc.links if a.get('rel') == 'canonical']
        good_canonical = canonical == ['https://sollahms.cl/' + page]
        require(good_canonical, 'Incorrect canonical: ' + page)
        counts['canonicalFiches'] += good_canonical
        require(doc.h1 == 1 and bool(doc.metas.get('description')), 'Missing or ambiguous SEO heading/description: ' + page)
        require('noindex' not in doc.metas.get('robots', ''), 'Public fiche unexpectedly noindex: ' + page)
        require(not HIDDEN_AUDIT.search(' '.join(doc.visible)), 'Research/contractual audit displayed to visitors: ' + page)
        if not doc.metas.get('og:image'):
            missing_social.append(page)
        require(project.get('detalleUrl') == '/' + page, 'Catalogue route mismatch: ' + page)
        for route in ['contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html']:
            require(any(ref.startswith('/' + route + '?proyecto=' + project['slug']) for ref in doc.refs),
                    'Missing contextual action ' + route + ': ' + page)
        require(any(ref == '/proyectos.html' for ref in doc.refs), 'Missing catalogue navigation: ' + page)
    if missing_social:
        warnings.append({'optionalSocialImageMissing': missing_social})

    def local_reference(page, ref):
        nonlocal counts
        url = urllib.parse.urlsplit(ref)
        if url.scheme in {'data', 'mailto', 'tel', 'javascript'}:
            require(url.scheme != 'javascript', 'Unsafe JavaScript URL: ' + page)
            return
        if url.netloc and url.netloc != 'sollahms.cl':
            require(url.scheme == 'https' or ref.startswith('//'), 'Insecure external reference: ' + page)
            return
        if url.path.startswith('/api/'):
            return  # Functions are deployed separately; their source never belongs to dist.
        target = urllib.parse.unquote(urllib.parse.urljoin('/' + page, url.path or '/' + page)).lstrip('/') or 'index.html'
        require(target in files, 'Missing local reference: ' + page + ' -> ' + target)
        counts['localReferences'] += 1
        if url.fragment and target in documents:
            require(urllib.parse.unquote(url.fragment) in documents[target].ids,
                    'Missing local anchor: ' + page + ' -> ' + target + '#' + url.fragment)

    for page, doc in documents.items():
        for ref in doc.refs:
            local_reference(page, ref)
    for path in sorted(f for f in files if f.endswith(('.js', '.mjs', '.css'))):
        text = (public / path).read_text()
        pattern = r'(?:\bfrom\s*|\bimport\s*\(?\s*)[\"\']([^\"\']+)[\"\']' if path.endswith(('.js', '.mjs')) else r'url\(\s*[\"\']?([^\"\')\s]+)'
        for ref in re.findall(pattern, text):
            local_reference(path, ref)

    chosen = set()
    catalogue_by_slug = {p['slug']: p for p in catalogue}
    for manifest_name in ['brochures-aj-urbana.json', 'brochures-ingevec.json']:
        review = json.loads((source / 'data' / manifest_name).read_text())
        for record in review['projects']:
            page = record['slug'] + '.html'
            html = (public / page).read_text()
            cover = record['catalogueCover']['localPath']
            require(catalogue_by_slug[record['slug']]['imagenPrincipal'] == cover,
                    'Brochure catalogue cover lost: ' + record['slug'])
            counts['brochureCovers'] += 1
            counts['brochureImages'] += len(record['images'])
            counts['brochurePlans'] += len(record['models'])
            for asset in [*record['images'], *(model['plan'] for model in record['models'])]:
                path = asset['localPath'].lstrip('/')
                require(path not in chosen, 'Duplicate selected brochure media: ' + path)
                chosen.add(path)
                require(path in files, 'Selected brochure image or plan missing: ' + path)
                if path in files:
                    require(digest(public / path) == asset['sha256'], 'Selected brochure resource bytes changed: ' + path)
                require(asset['localPath'] in html, 'Selected resource absent from its fiche: ' + path)
    counts['brochureMedia'] = len(chosen)
    require((counts['brochureImages'], counts['brochurePlans'], counts['brochureMedia'], counts['brochureCovers']) == (127, 142, 269, 21),
            'The public batch must preserve 127 images, 142 plans and 21 covers')
    public_chosen = {f for f in files if f.startswith(('assets/propiedades/aj-urbana-preview/', 'assets/propiedades/ingevec-preview/'))}
    require(public_chosen == chosen, 'Unselected candidate or omitted brochure resource in public output')

    urls = [node.text for node in ET.parse(public / 'sitemap.xml').iter() if node.tag.endswith('}loc')]
    sitemap_expected = {'https://sollahms.cl/' + p for p in expected_pages - {'404.html', 'index.html'}} | {'https://sollahms.cl/'}
    require(set(urls) == sitemap_expected and len(urls) == len(set(urls)) == 149, 'Sitemap does not match the 149 indexable public pages')
    counts['sitemapUrls'] = len(urls)
    robots = (public / 'robots.txt').read_text()
    require('Allow: /' in robots and 'Disallow: /' not in robots and 'Sitemap: https://sollahms.cl/sitemap.xml' in robots,
            'Production robots must allow indexing and declare the canonical sitemap')
    require('noindex' in documents['404.html'].metas.get('robots', ''), 'The 404 document must remain noindex')

    ecasa_review = json.loads((source / 'data/brochures-ecasa.json').read_text())
    ecasa_rights = ecasa_review.get('publicationRights', {})
    require(ecasa_rights.get('sourceChannel') == 'Ecasa/user_supplied' and
            ecasa_rights.get('protectedPreview') == 'authorized_by_user' and
            ecasa_rights.get('productionPolicy') == 'requires_verified_contract_scope',
            'Independent Ecasa protected review authorization is missing')
    expected_scope = 'pending_contract_scope_verification' if protected_review else 'verified_contract'
    require(ecasa_rights.get('contractScope', {}).get('status') == expected_scope,
            'Ecasa contractual scope does not match the requested audit profile')
    ecasa_records = ecasa_review['projects']
    require(len(ecasa_records) == 22 and {record['slug'] for record in ecasa_records} == ECASA,
            'Ecasa documentary inventory must contain the 22 authorized entries')
    preview_files = {str(p.relative_to(preview)) for p in preview.rglob('*') if p.is_file()}
    preview_catalogue = json.loads((preview / 'data/proyectos.json').read_text())
    preview_by_slug = {p['slug']: p for p in preview_catalogue}
    ecasa_chosen = set()
    for record in ecasa_records:
        page = record['slug'] + '.html'
        target = preview if protected_review else public
        target_files = preview_files if protected_review else files
        html = (target / page).read_text() if page in target_files else ''
        cover = record.get('catalogueCover')
        if cover:
            require(preview_by_slug.get(record['slug'], {}).get('imagenPrincipal') == cover['localPath'],
                    'Ecasa reviewed catalogue cover lost: ' + record['slug'])
            require(any(asset['localPath'] == cover['localPath'] for asset in record['images']),
                    'Ecasa cover is not a selected image: ' + record['slug'])
            counts['ecasaCovers'] += 1
        counts['ecasaImages'] += len(record['images'])
        counts['ecasaPlans'] += len(record['models'])
        for asset in [*record['images'], *(model['plan'] for model in record['models'])]:
            path = asset['localPath'].lstrip('/')
            prefix = 'assets/propiedades/ecasa-preview/' + record['slug'] + '/'
            require(path.startswith(prefix) and path.count('/') == prefix.count('/'),
                    'Ecasa resource belongs to another entry: ' + path)
            require(path not in ecasa_chosen and path not in chosen, 'Duplicate selected Ecasa resource: ' + path)
            ecasa_chosen.add(path)
            require(path in target_files, 'Selected Ecasa image or plan missing: ' + path)
            if path in target_files:
                require(digest(target / path) == asset['sha256'], 'Selected Ecasa resource bytes changed: ' + path)
                require(not (target / path).is_symlink(), 'Symbolic Ecasa resource: ' + path)
            require(asset['localPath'] in html, 'Selected Ecasa resource absent from its fiche: ' + path)
    counts['ecasaMedia'] = len(ecasa_chosen)
    actual_ecasa_preview = {f for f in preview_files if f.startswith('assets/propiedades/ecasa-preview/')}
    require(actual_ecasa_preview == ecasa_chosen, 'Unselected candidate or omitted Ecasa resource in protected Preview')
    actual_ecasa_public = {f for f in files if f.startswith('assets/propiedades/ecasa-preview/')}
    require(actual_ecasa_public == (set() if protected_review else ecasa_chosen),
            'Ecasa media public eligibility does not match the requested audit profile')
    expected_preview_files = files | ecasa_chosen if protected_review else files
    require(preview_files == expected_preview_files, 'Protected Preview and public build contain unexpected different files')
    expected_preview_catalogue = json.loads(json.dumps(catalogue))
    if protected_review:
        expected_by_slug = {p['slug']: p for p in expected_preview_catalogue}
        for record in ecasa_records:
            cover = record.get('catalogueCover')
            if cover and record['slug'] in expected_by_slug:
                expected_by_slug[record['slug']]['imagenPrincipal'] = cover['localPath']
                expected_by_slug[record['slug']]['imagenAlt'] = cover['alt']
    require(preview_catalogue == expected_preview_catalogue, 'Ecasa Preview changed commercial data beyond reviewed covers')
    preview_documents = {page: Document((preview / page).read_text()) for page in expected_pages & preview_files}
    for page, doc in preview_documents.items():
        for ref in doc.refs:
            url = urllib.parse.urlsplit(ref)
            if url.scheme in {'data', 'mailto', 'tel', 'javascript'}:
                require(url.scheme != 'javascript', 'Unsafe JavaScript URL in Preview: ' + page)
                continue
            if url.netloc and url.netloc != 'sollahms.cl' or url.path.startswith('/api/'):
                continue
            target = urllib.parse.unquote(urllib.parse.urljoin('/' + page, url.path or '/' + page)).lstrip('/') or 'index.html'
            require(target in preview_files, 'Missing Preview local reference: ' + page + ' -> ' + target)
            if url.fragment and target in preview_documents:
                require(urllib.parse.unquote(url.fragment) in preview_documents[target].ids,
                        'Missing Preview local anchor: ' + page + ' -> ' + target + '#' + url.fragment)
        if page.removesuffix('.html') in slugs:
            require(not HIDDEN_AUDIT.search(' '.join(doc.visible)), 'Research/contractual audit displayed in Preview: ' + page)
    for path in sorted(files & preview_files):
        if path == 'robots.txt':
            require((preview / path).read_text() == 'User-agent: *\nDisallow: /\n', 'Protected Preview robots must block indexing')
        elif path.endswith('.html'):
            text = (preview / path).read_text()
            require('<meta name="robots" content="noindex, nofollow">' in text, 'Preview page missing noindex: ' + path)
            if protected_review and path.removesuffix('.html') in ECASA:
                original = (source / path).read_text()
                require(normalized_preview(text) == selected_ecasa_html(original, True), 'Ecasa Preview differs from selected source: ' + path)
                require((public / path).read_text() == selected_ecasa_html(original, False), 'Ecasa public fallback differs from selected source: ' + path)
            else:
                require(normalized_preview(text) == (public / path).read_text(), 'Preview/public commercial content differs: ' + path)
        elif protected_review and path == 'data/proyectos.json':
            pass  # Exact allowed cover changes were validated as objects above.
        else:
            require(digest(preview / path) == digest(public / path), 'Preview/public asset or data differs: ' + path)
    return {'ok': not errors, 'networkRequests': 0, 'realMessages': 0, 'realReservations': 0,
            'counts': counts, 'errors': errors, 'warnings': warnings,
            'auditProfile': 'protected_ecasa_review' if protected_review else 'public_web_parity',
            'allowedPreviewDifferences': ['noindex meta', 'robots Disallow', 'read-only forms notice'] +
                (['documented Ecasa brochure blocks, covers and selected derivatives'] if protected_review else []),
            'ecasaPublicWebParityVerified': not protected_review and not errors,
            'productionDeploymentAuthorized': False,
            'providerAvailabilityVerified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--public', required=True, type=Path)
    parser.add_argument('--preview', required=True, type=Path)
    parser.add_argument('--receipt', type=Path)
    parser.add_argument('--protected-review', action='store_true',
                        help='Verify the complete protected Ecasa review and its public fallbacks; grants no publication rights')
    args = parser.parse_args()
    source, public, preview = (value.resolve() for value in [args.source, args.public, args.preview])
    result = audit(source, public, preview, args.protected_review)
    if args.receipt:
        receipt = args.receipt.resolve()
        assert not any(receipt == root or root in receipt.parents for root in [source, public, preview]), 'Receipt must remain outside public source/output'
        receipt.parent.mkdir(parents=True, exist_ok=True)
        receipt.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['ok'] else 1)


if __name__ == '__main__':
    main()
