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
import shutil
import subprocess
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
    'terratolten', 'wayra', 'enlace-mackenna',
    'espacio-victoria', 'lamara', 'cumbres-de-penuelas', 'aires-la-florida-2',
    'conecta-huechuraba', 'urban-la-florida', 'alto-san-joaquin',
    'nucleo-costanera'}
LEGACY_TARGETS = {'nucleo-costanera-2': ('nucleo-costanera', 2),
    'ferroparque-2': ('ferroparque', 2), 'terratolten-1': ('terratolten', 1),
    'terratolten-2': ('terratolten', 2), 'terratolten-3': ('terratolten', 3),
    'lomas-de-puyai-3': ('lomas-de-puyai', 3),
    'alto-san-joaquin-2': ('alto-san-joaquin', 2), 'alto-san-joaquin-3': ('alto-san-joaquin', 3)}
COMMERCIAL_PROJECTS = {slug: slug for slug in ECASA if slug != 'terratolten'}
COMMERCIAL_PROJECTS.update({slug: target for slug, (target, stage) in LEGACY_TARGETS.items()})
VISUAL_EXCLUDED = {
    '/assets/propiedades/ecasa-preview/enlace-mackenna/imagen-01-p01.webp',
    '/assets/propiedades/ecasa-preview/ferroparque/imagen-04-p01.webp',
    '/assets/propiedades/ecasa-preview/terratolten-1/imagen-03-p01.webp',
    '/assets/propiedades/ecasa-preview/terratolten-1/imagen-04-p01.webp',
}
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


def apply_copy_rules(text, rules):
    # JavaScript's word boundaries use ASCII word characters. Keep Unicode
    # whitespace/case matching while reproducing that boundary explicitly.
    boundary = r'(?:(?<![A-Za-z0-9_])(?=[A-Za-z0-9_])|(?<=[A-Za-z0-9_])(?![A-Za-z0-9_]))'
    for rule in rules:
        pattern = rule['pattern'].replace(r'\b', boundary)
        text = re.sub(pattern, lambda match: rule['replacement'], text, flags=re.I)
    return text


def natural_caption(text, policy):
    return re.sub(r'\s{2,}', ' ', apply_copy_rules(str(text), policy['captionRules'])).strip()


def normalize_fiche_copy(text, policy):
    if policy is None:
        return text
    if re.search(r'\bid=[\"\']informacion-inmobiliaria-material-grafico[\"\']', text, re.I):
        return text
    body = re.search(r'<body\b[^>]*>', text, re.I)
    if not body:
        return text
    prefix = text[:body.end()]
    prefix = re.sub(r'(<meta\b[^>]*property="og:image:alt"[^>]*content=")([^"]*)(")',
                    lambda match: match[1] + natural_caption(match[2], policy) + match[3], prefix, flags=re.I)
    tokens = re.split(r'(<(?:[^>"\']|"[^"]*"|\'[^\']*\')+>)', text[body.end():])
    protected_tag, caption_depth = None, 0
    for index, token in enumerate(tokens):
        if token.startswith('<'):
            start = re.match(r'<(script|style)\b', token, re.I)
            if start:
                protected_tag = start[1].lower()
            elif protected_tag and re.match(r'</' + protected_tag + r'\b', token, re.I):
                protected_tag = None
            elif not protected_tag:
                if re.match(r'<figcaption\b', token, re.I):
                    caption_depth += 1
                if re.match(r'</figcaption\b', token, re.I):
                    caption_depth -= 1
                tokens[index] = re.sub(r'\b(alt|aria-label|data-embed-title)=(["\'])(.*?)(\2)',
                    lambda match: match[1] + '=' + match[2] + natural_caption(match[3], policy) + match[4], token, flags=re.I)
        elif not protected_tag:
            tokens[index] = natural_caption(token, policy) if caption_depth > 0 else apply_copy_rules(token, policy['textRules'])
    return prefix + ''.join(tokens)


def quality_images(review, research, catalogue, policy, official_sources, require):
    """Rebuild every image identity from original evidence, not policy claims."""
    originals, project_info = {}, {}
    by_slug = {record['slug']: record for record in research}
    by_project = {record['slug']: record for record in catalogue}
    for record in review['projects']:
        stages = by_slug.get(record['slug'], {}).get('etapasComerciales', [])
        origins = {stage['slug']: stage for stage in stages}
        require(set(origins) == set(record['commercialSourceSlugs']), 'Original commercial image origins changed: ' + record['slug'])
        project_info[record['slug']] = {'multiple': len(origins) > 1}
        def add(image, origin, kind, sha):
            path = image['localPath']
            require(path not in originals, 'Duplicated original visual image: ' + path)
            source = origins.get(origin, {}).get('catalogo', {})
            stage = image.get('etapa')
            if not isinstance(stage, str) or not stage.strip():
                number = source.get('etapa')
                stage = 'Etapa ' + str(number) if isinstance(number, int) and re.search(r'\s' + str(number) + r'$', source.get('nombre', '')) else None
            originals[path] = {**image, 'sha256': sha, 'kind': kind, 'originCommercialSlug': origin,
                'projectSlug': record['slug'], 'displayStage': stage,
                'displayAlt': (image.get('displayCaption') or image.get('caption')) if kind == 'documentary' else image.get('alt', by_project[record['slug']]['nombre'])}
        for stage in stages:
            for image in stage.get('investigacion', {}).get('images', []):
                source = official_sources.get(image.get('url'), {})
                require(source.get('status') == 'downloaded' and source.get('localPath') == image['localPath'] and
                        source.get('width') == image['width'] and source.get('height') == image['height'],
                        'Official image provenance changed: ' + image['localPath'])
                add(image, stage['slug'], 'official', source.get('localSha256'))
        for image in record['images']:
            add(image, image['originCommercialSlug'], 'documentary', image['sha256'])
    projects = {project['slug']: project for project in policy['projects']}
    require(set(projects) == {record['slug'] for record in review['projects']}, 'Visual policy changed development identities')
    choices = {}
    for project in policy['projects']:
        expected = {path for path, image in originals.items() if image['projectSlug'] == project['slug']}
        require(len(project['images']) == len(expected) and {image['localPath'] for image in project['images']} == expected,
                'Visual review omitted or added a source image: ' + project['slug'])
        for choice in project['images']:
            path = choice['localPath'];original = originals.get(path, {})
            require(path not in choices, 'Duplicated visual decision: ' + path)
            require(all(choice.get(key) == original.get(key) for key in ['sha256', 'width', 'height', 'kind', 'originCommercialSlug']),
                    'Visual decision changed source bytes, dimensions or origin: ' + path)
            require(choice.get('decision') in {'keep', 'exclude'} and choice.get('coverOnly') is False and bool(choice.get('reason')),
                    'Unreviewed visual decision or cover-only exception: ' + path)
            choices[path] = {**original, **choice}
        for profile in ['public', 'preview']:
            for role in ['hero', 'catalogue']:
                path = project.get('covers', {}).get(profile, {}).get(role)
                image = choices.get(path) if path else None
                require(path is None or image and image.get('projectSlug') == project['slug'] and image.get('decision') == 'keep' and
                        (profile == 'preview' or image.get('kind') == 'official'),
                        'Visual cover is excluded, unrelated or ineligible: ' + project['slug'] + '/' + profile + '/' + role)
    return choices, projects, project_info


def quality_catalogue(catalogue, images, projects, project_info, caption_policy, preview):
    result = json.loads(json.dumps(catalogue))
    for project in result:
        selection = projects.get(project['slug'])
        if not selection:
            continue
        path = selection['covers']['preview' if preview else 'public']['catalogue']
        image = images.get(path)
        project['imagenPrincipal'] = path
        project.pop('imagenEtapa', None)
        if image:
            project['imagenAlt'] = natural_caption(image['displayAlt'], caption_policy)
            if project_info[project['slug']]['multiple'] and image.get('displayStage'):
                project['imagenEtapa'] = image['displayStage']
        else:
            project.pop('imagenAlt', None)
        for stage in project.get('etapasComerciales', []):
            candidate = images.get(stage.get('imagenPrincipal'))
            if candidate and candidate['decision'] == 'exclude':
                stage['imagenPrincipal'] = None
                stage.pop('imagenAlt', None);stage.pop('imagenEtapa', None)
    return result


def quality_html_projections(source, review, node):
    # Use the same reviewed, private overlay consumer to replay its byte-level
    # HTML transformation, then independently audit provenance and eligibility.
    script = r"""import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const root=process.argv[1];const load=async name=>JSON.parse(await readFile(root+'/'+name,'utf8'));
const {validateEcasaImageQuality,transformEcasaImageQuality}=await import(pathToFileURL(root+'/scripts/ecasa-image-quality.mjs'));
const {normalizeFicheCopy}=await import(pathToFileURL(root+'/scripts/public-fiche-copy.mjs'));
const review=await load('data/brochures-ecasa.json');const verified=validateEcasaImageQuality(review,await load('data/fichas-proyectos.json'),await load('data/proyectos.json'),await load('data/ecasa-image-quality.json'),await load('data/fuentes-imagenes.json'));
const output={public:{},preview:{}};for(const record of review.projects){const original=await readFile(root+'/'+record.slug+'.html','utf8');for(const profile of ['public','preview']){const remove=profile==='preview'?'PUBLIC':'PREVIEW';const keep=profile==='preview'?'PREVIEW':'PUBLIC';let html=original.replace(new RegExp('<!--ECASA_'+remove+'_START-->[\\s\\S]*?<!--ECASA_'+remove+'_END-->','g'),'').replace(new RegExp('<!--ECASA_'+keep+'_(?:START|END)-->','g'),'');html=transformEcasaImageQuality(html,record.slug,verified,{preview:profile==='preview'});output[profile][record.slug+'.html']=normalizeFicheCopy(html);}}process.stdout.write(JSON.stringify(output));"""
    result = subprocess.run([node, '--input-type=module', '-e', script, str(source)], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def audit(source, public, preview, protected_review=False, node=None):
    errors, warnings = [], []
    counts = {'projects': 0, 'ingevec': 0, 'ecasa': 0, 'pages': 0, 'localReferences': 0,
              'brochureImages': 0, 'brochurePlans': 0, 'brochureMedia': 0,
              'brochureCovers': 0, 'canonicalFiches': 0, 'sitemapUrls': 0,
              'ecasaImages': 0, 'ecasaPlans': 0, 'ecasaMedia': 0, 'ecasaCovers': 0,
              'ecasaCommercialSources': 0, 'legacyRoutes': 0, 'permanentRouteRules': 0}

    def require(condition, issue):
        if not condition:
            errors.append(issue)

    policy_path = source / 'data/public-caption-policy.json'
    caption_policy = json.loads(policy_path.read_text()) if policy_path.exists() else None
    if caption_policy is not None:
        require(caption_policy.get('schemaVersion') == 1 and
                (source / 'scripts/public-fiche-copy.mjs').is_file(), 'The reviewed display-copy policy or its consumer is missing')

    catalogue = json.loads((public / 'data/proyectos.json').read_text())
    slugs = {p['slug'] for p in catalogue}
    counts['projects'] = len(catalogue)
    counts['ingevec'] = sum(p['inmobiliaria'] == 'Ingevec' for p in catalogue)
    counts['ecasa'] = sum(p['inmobiliaria'].lower() == 'ecasa' for p in catalogue)
    require(len(catalogue) == len(slugs) == 136, 'Catalogue must contain exactly 136 distinct projects')
    require({p['slug'] for p in catalogue if p['inmobiliaria'] == 'Ingevec'} == INGEVEC,
            'The sixteen approved Ingevec identities must remain exact')
    require({p['slug'] for p in catalogue if p['inmobiliaria'].lower() == 'ecasa'} == ECASA,
            'The 15 approved Ecasa developments must remain exact')
    require(not LEGACY_TARGETS.keys() & slugs, 'A commercial stage remains a duplicate public project')
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
    expected_redirects = {'/' + slug + suffix: '/' + target + '.html#etapa-' + str(stage)
                          for slug, (target, stage) in LEGACY_TARGETS.items() for suffix in ['', '.html']}
    route_rules = {}
    redirects = json.loads((source / 'vercel.json').read_text()).get('redirects', [])
    require(len(redirects) == 16, 'Only the sixteen authorized legacy path rules may change routing')
    for rule in redirects:
        old_path = rule.get('source')
        if old_path not in expected_redirects:
            require(False, 'Unrelated public route redirect: ' + str(old_path))
            continue
        require(old_path not in route_rules, 'Duplicate legacy redirect: ' + old_path)
        require(not rule.get('has') and not rule.get('missing'), 'Conditional legacy route redirect: ' + old_path)
        require((rule.get('permanent') is True and 'statusCode' not in rule) or ('permanent' not in rule and rule.get('statusCode') in {301, 308}), 'Legacy redirect is not unambiguously permanent: ' + old_path)
        require(rule.get('destination') == expected_redirects[old_path], 'Wrong development, stage or loop in legacy redirect: ' + old_path)
        route_rules[old_path] = rule.get('destination')
    require(route_rules == expected_redirects, 'All eight legacy routes require exact bare and .html redirects')
    counts['legacyRoutes'] = len(LEGACY_TARGETS)
    counts['permanentRouteRules'] = len(route_rules)
    for legacy, (target, stage) in LEGACY_TARGETS.items():
        require(legacy + '.html' not in files, 'Duplicate HTML fiche for a redirected commercial stage: ' + legacy)
        require('etapa-' + str(stage) in documents.get(target + '.html', Document('')).ids,
                'Legacy redirect anchor is missing from its public development: ' + legacy)
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
    require(set(urls) == sitemap_expected and len(urls) == len(set(urls)) == 142, 'Sitemap does not match the 142 indexable public pages')
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
    require(ecasa_review.get('schemaVersion') == 2 and len(ecasa_records) == 15 and {record['slug'] for record in ecasa_records} == ECASA,
            'Ecasa documentary inventory must contain the 15 authorized developments')
    quality_path = source / 'data/ecasa-image-quality.json'
    quality_policy = json.loads(quality_path.read_text()) if quality_path.is_file() else None
    quality_choices, quality_projects, quality_project_info, quality_projections = {}, {}, {}, None
    if quality_policy:
        require(quality_policy.get('schemaVersion') == 1 and quality_policy.get('baselineCommit') == '2d34997f8fd82b775c0697b20493674773e7fdc2' and
                quality_policy.get('scope') == 'ecasa_images_only', 'Unexpected visual review baseline or scope')
        research = json.loads((source / 'data/fichas-proyectos.json').read_text())
        official_sources = json.loads((source / 'data/fuentes-imagenes.json').read_text())
        source_catalogue = json.loads((source / 'data/proyectos.json').read_text())
        quality_choices, quality_projects, quality_project_info = quality_images(ecasa_review, research, source_catalogue, quality_policy, official_sources, require)
        require(len(quality_choices) == 118 and sum(image['kind'] == 'official' for image in quality_choices.values()) == 62 and
                sum(image['kind'] == 'documentary' for image in quality_choices.values()) == 56,
                'Original visual inventory must contain 62 official and 56 documentary images')
        excluded = {path for path, image in quality_choices.items() if image['decision'] == 'exclude'}
        require(excluded == VISUAL_EXCLUDED, 'The four reviewed image exclusions changed or a plan was excluded')
        counts['ecasaOriginalImages'] = 56
        counts['ecasaReviewedImages'] = 118
        counts['ecasaGalleryImages'] = sum(image['decision'] == 'keep' for image in quality_choices.values())
        counts['ecasaExcludedImages'] = len(excluded)
        require(counts['ecasaGalleryImages'] == 114, 'The 114 approved Ecasa gallery photographs must remain exact')
        try:
            quality_projections = quality_html_projections(source, ecasa_review, node or shutil.which('node'))
        except (OSError, subprocess.CalledProcessError, json.JSONDecodeError, TypeError) as error:
            require(False, 'Reviewed visual HTML projection failed: ' + str(error))
    commercial_sources = ecasa_review.get('commercialSources', [])
    counts['ecasaCommercialSources'] = len(commercial_sources)
    require(len(commercial_sources) == 22 and {record['slug']: record['projectSlug'] for record in commercial_sources} == COMMERCIAL_PROJECTS,
            'The 22 internal Ecasa commercial sources must retain their exact development binding')
    preview_files = {str(p.relative_to(preview)) for p in preview.rglob('*') if p.is_file()}
    preview_catalogue = json.loads((preview / 'data/proyectos.json').read_text())
    preview_by_slug = {p['slug']: p for p in preview_catalogue}
    ecasa_chosen = set()
    for record in ecasa_records:
        require(len(record.get('commercialSourceSlugs', [])) == len(set(record.get('commercialSourceSlugs', []))) and set(record.get('commercialSourceSlugs', [])) == {slug for slug, matrix in COMMERCIAL_PROJECTS.items() if matrix == record['slug']},
                'Ecasa development lost or acquired an unrelated commercial stage: ' + record['slug'])
        page = record['slug'] + '.html'
        target = preview if protected_review else public
        target_files = preview_files if protected_review else files
        html = (target / page).read_text() if page in target_files else ''
        cover = record.get('catalogueCover')
        if cover and not quality_policy:
            require(preview_by_slug.get(record['slug'], {}).get('imagenPrincipal') == cover['localPath'],
                    'Ecasa reviewed catalogue cover lost: ' + record['slug'])
            require(any(asset['localPath'] == cover['localPath'] for asset in record['images']),
                    'Ecasa cover is not a selected image: ' + record['slug'])
            counts['ecasaCovers'] += 1
        counts['ecasaImages'] += sum(not quality_policy or quality_choices.get(asset['localPath'], {}).get('decision') == 'keep' for asset in record['images'])
        counts['ecasaPlans'] += len(record['models'])
        for asset in [*record['images'], *(model['plan'] for model in record['models'])]:
            path = asset['localPath'].lstrip('/')
            origin = asset.get('originCommercialSlug')
            require(origin in record.get('commercialSourceSlugs', []) and COMMERCIAL_PROJECTS.get(origin) == record['slug'],
                    'Ecasa resource belongs to an unrelated commercial stage: ' + path)
            prefix = 'assets/propiedades/ecasa-preview/' + str(origin) + '/'
            require(path.startswith(prefix) and path.count('/') == prefix.count('/'),
                    'Ecasa resource belongs to another entry: ' + path)
            if quality_policy:
                original = source / path
                require(original.is_file() and not original.is_symlink() and digest(original) == asset['sha256'],
                        'Visual filtering changed or omitted original documentary evidence: ' + path)
                if asset['localPath'] in VISUAL_EXCLUDED:
                    require(path not in files and path not in preview_files and asset['localPath'] not in html,
                            'Excluded Ecasa photograph survived as a published resource: ' + path)
                    continue
            require(path not in ecasa_chosen and path not in chosen, 'Duplicate selected Ecasa resource: ' + path)
            ecasa_chosen.add(path)
            require(path in target_files, 'Selected Ecasa image or plan missing: ' + path)
            if path in target_files:
                require(digest(target / path) == asset['sha256'], 'Selected Ecasa resource bytes changed: ' + path)
                require(not (target / path).is_symlink(), 'Symbolic Ecasa resource: ' + path)
            require(asset['localPath'] in html, 'Selected Ecasa resource absent from its fiche: ' + path)
    counts['ecasaMedia'] = len(ecasa_chosen)
    if quality_policy:
        require(counts['ecasaMedia'] == 126 and counts['ecasaImages'] == 52 and counts['ecasaPlans'] == 74,
                'Visual publication must preserve 52 documentary photographs and all 74 plans')
        counts['ecasaCovers'] = sum(project['covers']['preview']['catalogue'] is not None for project in quality_projects.values())
        for path, image in quality_choices.items():
            if image['kind'] != 'official':
                continue
            original = source / path.lstrip('/')
            require(original.is_file() and not original.is_symlink() and digest(original) == image['sha256'],
                    'Original official visual evidence changed: ' + path)
            for output in [public, preview]:
                require((output / path.lstrip('/')).is_file() and digest(output / path.lstrip('/')) == image['sha256'],
                        'Reviewed official photograph missing or changed: ' + path)
    for commercial in commercial_sources:
        matrix = next((record for record in ecasa_records if record['slug'] == commercial['projectSlug']), None)
        if matrix is None:
            continue
        expected_images = {asset['localPath'] for asset in matrix['images'] if asset.get('originCommercialSlug') == commercial['slug']}
        expected_plans = {model['plan']['localPath'] for model in matrix['models'] if model['plan'].get('originCommercialSlug') == commercial['slug']}
        require(set(commercial.get('selectedImagePaths', [])) == expected_images and
                set(commercial.get('selectedPlanPaths', [])) == expected_plans,
                'Consolidated Ecasa matrix lost or transferred a selected commercial resource: ' + commercial['slug'])
    actual_ecasa_preview = {f for f in preview_files if f.startswith('assets/propiedades/ecasa-preview/')}
    require(actual_ecasa_preview == ecasa_chosen, 'Unselected candidate or omitted Ecasa resource in protected Preview')
    actual_ecasa_public = {f for f in files if f.startswith('assets/propiedades/ecasa-preview/')}
    require(actual_ecasa_public == (set() if protected_review else ecasa_chosen),
            'Ecasa media public eligibility does not match the requested audit profile')
    expected_preview_files = files | ecasa_chosen if protected_review else files
    require(preview_files == expected_preview_files, 'Protected Preview and public build contain unexpected different files')
    expected_preview_catalogue = json.loads(json.dumps(catalogue))
    if quality_policy:
        expected_preview_catalogue = quality_catalogue(catalogue, quality_choices, quality_projects, quality_project_info, caption_policy, True)
        expected_public_catalogue = quality_catalogue(source_catalogue, quality_choices, quality_projects, quality_project_info, caption_policy, False)
        require([project for project in catalogue if project['slug'] in ECASA] ==
                [project for project in expected_public_catalogue if project['slug'] in ECASA],
                'Visual public build changed Ecasa commercial data beyond reviewed image fields')
    elif protected_review:
        expected_by_slug = {p['slug']: p for p in expected_preview_catalogue}
        for record in ecasa_records:
            cover = record.get('catalogueCover')
            if cover and record['slug'] in expected_by_slug:
                expected_by_slug[record['slug']]['imagenPrincipal'] = cover['localPath']
                display_alt = cover.get('displayAlt', cover['alt'])
                expected_by_slug[record['slug']]['imagenAlt'] = natural_caption(display_alt, caption_policy) if caption_policy else display_alt
                image = next((asset for asset in record['images'] if asset['localPath'] == cover['localPath']), None)
                if image and image.get('etapa') and len(record['commercialSourceSlugs']) > 1:
                    require(record['slug'] == 'terratolten' and image['etapa'] == 'Etapa 1',
                            'The reviewed catalogue cover acquired an unaccredited stage: ' + record['slug'])
                    expected_by_slug[record['slug']]['imagenEtapa'] = image['etapa']
    require(preview_catalogue == expected_preview_catalogue, 'Ecasa Preview changed commercial data beyond reviewed covers')
    preview_documents = {page: Document((preview / page).read_text()) for page in expected_pages & preview_files}
    for legacy, (target, stage) in LEGACY_TARGETS.items():
        require('etapa-' + str(stage) in preview_documents.get(target + '.html', Document('')).ids,
                'Legacy redirect anchor is missing from its protected development: ' + legacy)
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
                expected_preview_html = quality_projections['preview'][path] if quality_projections else normalize_fiche_copy(selected_ecasa_html(original, True), caption_policy)
                expected_public_html = quality_projections['public'][path] if quality_projections else normalize_fiche_copy(selected_ecasa_html(original, False), caption_policy)
                require(normalized_preview(text) == expected_preview_html, 'Ecasa Preview differs from selected source and reviewed display/visual policy: ' + path)
                require((public / path).read_text() == expected_public_html, 'Ecasa public fallback differs from selected source and reviewed display/visual policy: ' + path)
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
            'displayCopyPolicySha256': digest(policy_path) if caption_policy is not None else None,
            'imageQualityPolicySha256': digest(quality_path) if quality_policy is not None else None,
            'providerAvailabilityVerified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--public', required=True, type=Path)
    parser.add_argument('--preview', required=True, type=Path)
    parser.add_argument('--receipt', type=Path)
    parser.add_argument('--protected-review', action='store_true',
                        help='Verify the complete protected Ecasa review and its public fallbacks; grants no publication rights')
    parser.add_argument('--node', default=shutil.which('node'), help='Node runtime for the reviewed visual HTML projection')
    args = parser.parse_args()
    source, public, preview = (value.resolve() for value in [args.source, args.public, args.preview])
    result = audit(source, public, preview, args.protected_review, args.node)
    if args.receipt:
        receipt = args.receipt.resolve()
        assert not any(receipt == root or root in receipt.parents for root in [source, public, preview]), 'Receipt must remain outside public source/output'
        receipt.parent.mkdir(parents=True, exist_ok=True)
        receipt.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['ok'] else 1)


if __name__ == '__main__':
    main()
