#!/usr/bin/env python3
"""Create a deterministic PRIVATE source bundle for an authorized web build.

No original PDF, contract, candidate, environment file or Git directory enters
the bundle. It includes the exact selected derivatives, so materialization is
not a build dependency. This command does not upload or deploy anything.
"""
import argparse
import gzip
import hashlib
import io
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('review_release_inventory', ROOT / 'scripts/prepare-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
MEDIA_FOLDERS = ('aj-urbana-preview', 'ingevec-preview', 'ecasa-preview')
MANIFESTS = ('brochures-aj-urbana.json', 'brochures-ingevec.json', 'brochures-ecasa.json')
VERIFICATION_TOOLS = ('tests/qa-ecasa.mjs', 'tests/qa-ecasa-remote.mjs', 'tests/qa-preview-server.mjs')
PUBLIC_EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.svg', '.webp',
                     '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.txt', '.xml'}
APPROVED_PROJECTS = {
    'brochures-aj-urbana.json': {'downtown-san-martin', 'edificio-teatinos-750',
        'edificio-vista-amunategui', 'monjitas-690', 'vista-morande'},
    'brochures-ingevec.json': {'centenario-1', 'tocornal', 'vivaceta',
        'coronel-godoy', 'diagonal-paraguay', 'el-aromo', 'los-lilenes',
        'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589',
        'abdon-cifuentes', 'don-ignacio', 'terrazzo', 'vima',
        'los-alerces', 'valle-los-ingleses-iii'},
    'brochures-ecasa.json': {'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla',
        'endemico', 'terratolten', 'wayra',
        'enlace-mackenna', 'espacio-victoria', 'lamara', 'cumbres-de-penuelas',
        'aires-la-florida-2', 'conecta-huechuraba', 'urban-la-florida',
        'alto-san-joaquin', 'nucleo-costanera'},
}
ECASA_LEGACY_TARGETS = {
    'nucleo-costanera-2': ('nucleo-costanera', 2),
    'ferroparque-2': ('ferroparque', 2),
    'terratolten-1': ('terratolten', 1), 'terratolten-2': ('terratolten', 2),
    'terratolten-3': ('terratolten', 3), 'lomas-de-puyai-3': ('lomas-de-puyai', 3),
    'alto-san-joaquin-2': ('alto-san-joaquin', 2), 'alto-san-joaquin-3': ('alto-san-joaquin', 3),
}
ECASA_COMMERCIAL_PROJECTS = {slug: slug for slug in APPROVED_PROJECTS['brochures-ecasa.json'] if slug != 'terratolten'}
ECASA_COMMERCIAL_PROJECTS.update({slug: target[0] for slug, target in ECASA_LEGACY_TARGETS.items()})
REMOVED_PROJECTS = {'brasil', 'vespucio-capital', 'edificio-serrano-capital',
                    'edificio-carrera-capital', 'edificio-froilan-roa', 'hacienda-lo-errazuriz',
                    'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real',
                    'edificio-ha-strip-center'}
# Keep the 121 non-Ecasa catalogue objects from main f1e9bf1 byte-equivalent
# as canonical values, and preserve the complete previously approved manifests.
NON_ECASA_SHA256 = '2c4b8aec0bd36c289aa51e4303d80344c0796f917d1ecff93b33f56736f07dbf'
PRESERVED_MANIFESTS = {
    'brochures-aj-urbana.json': 'b23e5730201768f4be2d83eabdcfdbfa648d8b5906df188e7ae8de7ca42ac42c',
    'brochures-ingevec.json': 'ce57d1e608aae4e11edd9c224fb7593c7aa2ae0604eddf5ba4f279be75a08c03',
}
ECASA_REVIEW_SHA256 = 'fd37681006e965e83241dccd88b7b532dba5411733219dbdc152aef1e4f5017c'
ECASA_MEDIA_SHA256 = 'adc94ac87d8d7d6068fc2fd46117bd5a1d600307fd938d15767a391a519345ab'
QUALITY_ORIGINALS = {
    'data/fichas-proyectos.json': '3f23035e8ef82d20970d1ed10dc0606e3c91b81f232d4119c3599039bc33a235',
    'data/fuentes-imagenes.json': 'c16009d0ed27e342441529f81c9e065f1a15ea9499ddf00388ff75681152c49b',
}
VISUAL_EXCLUDED = {
    '/assets/propiedades/ecasa-preview/enlace-mackenna/imagen-01-p01.webp',
    '/assets/propiedades/ecasa-preview/ferroparque/imagen-04-p01.webp',
    '/assets/propiedades/ecasa-preview/terratolten-1/imagen-03-p01.webp',
    '/assets/propiedades/ecasa-preview/terratolten-1/imagen-04-p01.webp',
}
PUBLIC_PAGES = {'404.html', 'agenda-asesoria.html', 'comparador-hipotecario.html',
                'contacto.html', 'index.html', 'privacidad.html', 'proyectos.html'}
RETIRED_ASSETS = {
    'assets/propiedades/catalogo/a563beb6adb19f55406aff15.webp',
    'assets/propiedades/catalogo/045681ecf683fff01b6c662e.webp',
    'assets/propiedades/catalogo/ff0e16740bb921f587be6864.webp',
    'assets/propiedades/catalogo/1c8afdcef4daab70c27ecb01.webp',
    'assets/propiedades/catalogo/ae7bcf577b09a561c3359867.webp',
    'assets/propiedades/catalogo/2e0af89ee3298d9791639ae2.webp',
    'assets/propiedades/catalogo/883af11703388c0dba211491.webp',
    'assets/propiedades/catalogo/70413545b58983da8e24825a.webp',
    'assets/propiedades/catalogo/5ec72b840d3cb985b609df36.webp',
    'assets/propiedades/catalogo/cc5c4d04b4f258731931d6eb.webp',
    'assets/propiedades/catalogo/81adaf07bdbd2fab601a093c.webp',
    'assets/propiedades/catalogo/da691207ca6c24621740a2e4.webp',
    'assets/propiedades/catalogo/204406fdd4ac3e04f45dcd19.webp',
    'assets/propiedades/catalogo/9521654e9d91c2fac363344a.webp',
    'assets/propiedades/catalogo/22dad05519d3b294ee0d70f5.webp',
    'assets/propiedades/catalogo/a773e94159c8ca452f77aabb.webp',
    'assets/propiedades/catalogo/a35bc3797ca9f594152f5de1.webp',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verification_tools(root, commit):
    inventory = []
    for name in VERIFICATION_TOOLS:
        path = root / name
        assert path.is_file() and not path.is_symlink(), 'Missing or symbolic verification tool: ' + name
        data = path.read_bytes()
        committed = subprocess.check_output(['git', '-C', str(root), 'show', commit + ':' + name])
        assert data == committed, 'Verification tool differs from prepared commit: ' + name
        inventory.append({'file': name, 'size': len(data), 'sha256': sha(data)})
    return inventory


def assert_legacy_redirects(root, page_texts):
    expected = {'/' + slug + suffix: '/' + target + '.html#etapa-' + str(stage)
                for slug, (target, stage) in ECASA_LEGACY_TARGETS.items() for suffix in ['', '.html']}
    selected = {}
    rules = json.loads((root / 'vercel.json').read_text()).get('redirects', [])
    assert len(rules) == 16, 'Only the sixteen authorized legacy path rules may change routing'
    for rule in rules:
        source = rule.get('source')
        assert source in expected, 'Unrelated public route redirect'
        assert source not in selected, 'Duplicate legacy route redirect'
        assert not rule.get('has') and not rule.get('missing'), 'Legacy route redirect must be unconditional'
        assert (rule.get('permanent') is True and 'statusCode' not in rule) or ('permanent' not in rule and rule.get('statusCode') in {301, 308}), 'Legacy route redirect must be unambiguously permanent'
        assert rule.get('destination') == expected[source], 'Legacy route redirect has an unrelated target or wrong stage'
        selected[source] = rule['destination']
    assert selected == expected, 'All eight legacy routes require bare and .html permanent redirects'
    for slug, (target, stage) in ECASA_LEGACY_TARGETS.items():
        assert slug + '.html' not in page_texts, 'A legacy route still has a duplicate HTML fiche'
        assert re.search(r'\bid=["\']etapa-' + str(stage) + r'["\']', page_texts[target + '.html']), 'Legacy redirect stage anchor is absent'
    return selected


def selected_source_files(root):
    official_manifest = json.loads((root / release.OFFICIAL_MANIFEST).read_text())
    official_sources, _ = release.official_manifest_inventory(official_manifest)
    assert sha((root / release.BASE_QUALITY_MANIFEST).read_bytes()) == release.BASE_QUALITY_SHA256, 'Frozen base quality evidence changed'
    release.manual_quality_selection(json.loads((root / release.MANUAL_MANIFEST).read_text()),
        json.loads((root / release.BASE_QUALITY_MANIFEST).read_text()), official_manifest)
    for name, digest in QUALITY_ORIGINALS.items():
        assert sha((root / name).read_bytes()) == digest, 'Original research/commercial image evidence changed: ' + name
    quality = json.loads((root / 'data/ecasa-image-quality.json').read_text())
    decisions = [image for project in quality['projects'] for image in project['images']]
    assert len(decisions) == 118 and sum(image['decision'] == 'keep' for image in decisions) == 114
    assert {image['localPath'] for image in decisions if image['decision'] == 'exclude'} == VISUAL_EXCLUDED
    assert not any(image.get('coverOnly') for image in decisions), 'Unexpected cover-only quality exception'
    catalogue = json.loads((root / 'data/proyectos.json').read_text())
    slugs = {project['slug'] for project in catalogue}
    assert len(catalogue) == 136 and len(slugs) == 136, 'The exact final catalogue must contain 136 projects'
    assert APPROVED_PROJECTS['brochures-ingevec.json'] <= slugs and not REMOVED_PROJECTS & slugs
    assert all(p['inmobiliaria'] == 'Ingevec' for p in catalogue if p['slug'] in APPROVED_PROJECTS['brochures-ingevec.json'])
    assert {p['slug'] for p in catalogue if p['inmobiliaria'].lower() == 'ecasa'} == APPROVED_PROJECTS['brochures-ecasa.json'], 'The 15 Ecasa development identities must remain exact'
    assert not ECASA_LEGACY_TARGETS.keys() & slugs, 'A commercial stage remains a duplicate catalogue project'
    untouched = [p for p in catalogue if p['inmobiliaria'].lower() != 'ecasa']
    assert len(untouched) == 121 and sha(json.dumps(untouched, ensure_ascii=False, sort_keys=True,
        separators=(',', ':')).encode()) == NON_ECASA_SHA256, 'Other developers changed'
    pages = {p.name for p in root.glob('*.html')}
    assert pages <= PUBLIC_PAGES | {slug + '.html' for slug in slugs}, 'Unapproved or retired public route'
    assert {slug + '.html' for slug in slugs} <= pages, 'Missing approved public route'
    page_texts = {name: (root / name).read_text() for name in pages}
    assert_legacy_redirects(root, page_texts)
    page_text = '\n'.join(page_texts.values())
    catalogue_text = (root / 'data/proyectos.json').read_text()
    retired_exclusive = {path for path in RETIRED_ASSETS
                         if '/' + path not in page_text and '/' + path not in catalogue_text}
    media = {}
    preserved_model_count = 0
    preserved_media_count = 0
    for name, folder in zip(MANIFESTS, MEDIA_FOLDERS):
        if name in PRESERVED_MANIFESTS:
            assert sha((root / 'data' / name).read_bytes()) == PRESERVED_MANIFESTS[name], 'Previously approved brochure evidence changed'
        else:
            assert sha((root / 'data' / name).read_bytes()) == ECASA_REVIEW_SHA256, 'Final Ecasa documentary review changed'
        manifest = json.loads((root / 'data' / name).read_text())
        assert len(manifest['projects']) == len(APPROVED_PROJECTS[name])
        assert {record['slug'] for record in manifest['projects']} == APPROVED_PROJECTS[name], 'Unapproved brochure project'
        if name == 'brochures-ecasa.json':
            commercial = manifest.get('commercialSources', [])
            assert manifest.get('schemaVersion') == 2 and len(commercial) == 22, 'The internal Ecasa inventory must preserve 22 commercial sources'
            assert {record['slug']: record['projectSlug'] for record in commercial} == ECASA_COMMERCIAL_PROJECTS, 'Ecasa commercial stage identities changed'
        for record in manifest['projects']:
            if name == 'brochures-ecasa.json':
                assert len(record.get('commercialSourceSlugs', [])) == len(set(record.get('commercialSourceSlugs', []))) and set(record.get('commercialSourceSlugs', [])) == {slug for slug, project in ECASA_COMMERCIAL_PROJECTS.items() if project == record['slug']}, 'Ecasa matrix lost or duplicated a commercial stage'
            if name in PRESERVED_MANIFESTS:
                preserved_model_count += len(record['models'])
                preserved_media_count += len(record['images']) + len(record['models'])
            for asset in [*record['images'], *(m['plan'] for m in record['models'])]:
                origin = asset.get('originCommercialSlug') if name == 'brochures-ecasa.json' else record['slug']
                if name == 'brochures-ecasa.json':
                    assert ECASA_COMMERCIAL_PROJECTS.get(origin) == record['slug'], 'Ecasa media transferred to another development'
                prefix = f'assets/propiedades/{folder}/{origin}/'
                path = asset['localPath'].lstrip('/')
                assert path.startswith(prefix) and path.count('/') == prefix.count('/'), 'Media belongs to another project or directory'
                assert path not in media, 'Duplicate selected media destination'
                media[path] = asset['sha256']
    assert preserved_model_count == 142, 'The previously approved AJ/Ingevec batch must preserve 142 plans'
    assert preserved_media_count == 269, 'The previously approved AJ/Ingevec batch must preserve 269 resources'
    ecasa_media = sorted([['/' + path, digest] for path, digest in media.items() if path.startswith('assets/propiedades/ecasa-preview/')])
    assert len(ecasa_media) == 130 and sha(json.dumps(ecasa_media, ensure_ascii=False, separators=(',', ':')).encode()) == ECASA_MEDIA_SHA256, 'The exact 130 Ecasa resource paths and bytes must be preserved'
    files = set(media) | set(official_sources)
    files.update(pages)
    files.update(('vercel.json', 'robots.txt', 'sitemap.xml', 'data/proyectos.json',
                  'data/hipotecario.json', *(f'data/{name}' for name in MANIFESTS),
                  'scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs'))
    if (root / 'scripts/ecasa-publication.mjs').exists():
        files.add('scripts/ecasa-publication.mjs')
    files.update(('scripts/public-fiche-copy.mjs', 'data/public-caption-policy.json'))
    files.update(('scripts/ecasa-image-quality.mjs', 'data/ecasa-image-quality.json', *QUALITY_ORIGINALS))
    files.update((release.OFFICIAL_MANIFEST, release.OFFICIAL_MODULE))
    files.update((release.MANUAL_MANIFEST, release.MANUAL_MODULE))
    for folder in ('api', 'lib'):
        files.update(str(p.relative_to(root)) for p in (root / folder).rglob('*')
                     if p.is_file() and p.suffix in {'.js', '.mjs'})
    for path in (root / 'assets').rglob('*'):
        relative = str(path.relative_to(root))
        if not path.is_file() or '/brochure-candidates/' in relative or relative in retired_exclusive:
            continue
        if any(f'/propiedades/{folder}/' in relative for folder in (*MEDIA_FOLDERS, release.OFFICIAL_FOLDER)):
            continue  # Only the exact manifest above can select these assets.
        if path.suffix.lower() in PUBLIC_EXTENSIONS:
            files.add(relative)
    for relative in sorted(files):
        path = root / relative
        assert path.is_file() and path.resolve() == path, f'Nonregular or symbolic source: {relative}'
        assert path.suffix.lower() in PUBLIC_EXTENSIONS
        assert '..' not in Path(relative).parts and not relative.startswith('.')
        if relative in media:
            assert sha(path.read_bytes()) == media[relative], f'Changed selected media: {relative}'
        if relative in official_sources:
            assert path.stat().st_size == official_sources[relative]['bytes'] and sha(path.read_bytes()) == official_sources[relative]['sha256'], f'Changed official review source: {relative}'
    return sorted(files)


def archive_bytes(root, files):
    output = io.BytesIO()
    with gzip.GzipFile(fileobj=output, mode='wb', filename='', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w', format=tarfile.USTAR_FORMAT) as archive:
            for name in files:
                data = (root / name).read_bytes()
                info = tarfile.TarInfo(name)
                info.size, info.mode, info.mtime = len(data), 0o644, 0
                info.uid = info.gid = 0
                info.uname = info.gname = ''
                archive.addfile(info, io.BytesIO(data))
    return output.getvalue()


def public_files(root):
    return {str(path.relative_to(root)): path.read_bytes()
            for path in sorted(root.rglob('*')) if path.is_file()}


def comparable_review_html(data):
    # These are the only intentional differences in the protected review.
    # Do not strip arbitrary notices, metadata, content or financial values.
    text = data.decode('utf-8')
    text = text.replace('<meta name="robots" content="noindex, nofollow">\n', '')
    notice = '<div role="note" style="padding:14px 24px;background:#003229;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">Vista previa de revisión. Los formularios no envían mensajes ni crean reservas.</div>'
    return text.replace(notice, '').encode('utf-8')


def assert_public_parity(preview, public):
    assert preview.keys() == public.keys(), 'Protected Preview and public build have different routes/resources'
    for name, content in public.items():
        if name == 'robots.txt':
            assert preview[name] == b'User-agent: *\nDisallow: /\n'
            assert b'Allow: /' in content and b'https://sollahms.cl/sitemap.xml' in content
        elif name.endswith('.html'):
            assert comparable_review_html(preview[name]) == content, f'Preview differs from public content: {name}'
            assert b'noindex, nofollow' not in content, f'Public route cannot be indexed: {name}'
        else:
            assert preview[name] == content, f'Preview differs from public resource: {name}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-directory', required=True, type=Path)
    parser.add_argument('--node', default=shutil.which('node'))
    parser.add_argument('--branch', default='codex/ecasa-cartera-definitiva',
                        help='Authorized review branch recorded in the private package')
    parser.add_argument('--verify-public-web', action='store_true',
                        help='Require real contractual web coverage and compare an offline Production build; never deploys')
    args = parser.parse_args()
    assert args.node, 'Node is required to verify the source package'
    destination = args.output_directory.expanduser().resolve()
    assert destination != ROOT and ROOT not in destination.parents, 'Bundle must remain outside public source'
    destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(destination, 0o700)
    review_commit = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD']).decode().strip()
    tool_inventory = verification_tools(ROOT, review_commit)
    files = selected_source_files(ROOT)
    official_sources, official_published = release.official_manifest_inventory(json.loads((ROOT / release.OFFICIAL_MANIFEST).read_text()))
    manual = release.manual_quality_selection(json.loads((ROOT / release.MANUAL_MANIFEST).read_text()),
        json.loads((ROOT / release.BASE_QUALITY_MANIFEST).read_text()),
        json.loads((ROOT / release.OFFICIAL_MANIFEST).read_text()))
    inventory = [{'file': name, 'size': (ROOT / name).stat().st_size,
                  'sha256': sha((ROOT / name).read_bytes())} for name in files]
    with tempfile.TemporaryDirectory(prefix='sollahms-reproducible-review-') as temporary:
        stage = Path(temporary)
        for name in files:
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        env = {'PATH': str(Path(args.node).resolve().parent) + os.pathsep + os.defpath,
               'VERCEL_ENV': 'preview', 'VERCEL_GIT_COMMIT_REF': args.branch}
        subprocess.run([args.node, str(stage / 'scripts/package-vercel.mjs')],
                       cwd=stage, env=env, check=True, stdout=subprocess.PIPE)
        receipt = json.loads((stage / '.vercel/brochure-build-inventory.json').read_text())
        source_media = sum(len(json.loads((stage / 'data' / name).read_text())['projects'][index][key])
            for name in MANIFESTS for index in range(len(APPROVED_PROJECTS[name])) for key in ['images', 'models'])
        assert source_media == 399, 'The original brochure sources must remain exact'
        source_inventory = {asset['localPath']: asset['sha256']
            for name in MANIFESTS for record in json.loads((stage / 'data' / name).read_text())['projects']
            for asset in [*record['images'], *(model['plan'] for model in record['models'])]}
        expected_publication = release.manual_published_media({path.lstrip('/'): value for path, value in source_inventory.items()}, manual)
        assert {asset['path'].lstrip('/'): asset['sha256'] for asset in receipt['media']} == expected_publication, 'Published media differs from the exact manual selection'
        assert len(expected_publication) == 269 + 74 + manual['summary']['documentaryPublishedImages'], 'Manual publication omitted a plan or preserved brochure resource'
        assert receipt['manualQuality']['effectiveImages'] == manual['effectiveImages'] and receipt['manualQuality']['projects'] == manual['projects'], 'Manual build receipt differs from the reviewed policy'
        assert all(receipt['manualQuality']['summary'].get(key) == value for key, value in manual['summary'].items()), 'Manual build counts differ from the effective image inventory'
        assert receipt['officialOriginals']['sourceAssets'] == [official_sources[name] for name in sorted(official_sources)] and receipt['officialOriginals']['publishedAssets'] == [official_published[name] for name in sorted(official_published)], 'Official transport/publication differs from the exact reviewed selection'
        preview_output = public_files(stage / 'dist')
        public_inventory = [{'file': name, 'sha256': sha(content)}
                            for name, content in preview_output.items()]
        production_inventory = None
        if args.verify_public_web:
            assert receipt['contractualCoverageVerified'], 'The actual website contract scope must be verified before public parity can be asserted'
            public_env = dict(env, VERCEL_ENV='production', SOLLAHMS_BROCHURE_PROFILE='public-web')
            subprocess.run([args.node, str(stage / 'scripts/package-vercel.mjs')],
                           cwd=stage, env=public_env, check=True, stdout=subprocess.PIPE)
            public_receipt = json.loads((stage / '.vercel/brochure-build-inventory.json').read_text())
            assert public_receipt == receipt, 'The public build changed the reviewed selected-media inventory'
            production_output = public_files(stage / 'dist')
            assert_public_parity(preview_output, production_output)
            production_inventory = [{'file': name, 'sha256': sha(content)}
                                    for name, content in production_output.items()]
        data = archive_bytes(stage, files)
    archive = destination / 'source.tgz'
    archive.write_bytes(data)
    chunks = []
    size = 2 * 1024 * 1024
    for index, start in enumerate(range(0, len(data), size), 1):
        fragment = data[start:start + size]
        target = destination / f'source.tgz.part{index}'
        target.write_bytes(fragment)
        chunks.append({'file': f'.vercel/source.tgz.part{index}', 'privatePath': str(target),
                       'sha': hashlib.sha1(fragment).hexdigest(), 'sha256': sha(fragment), 'size': len(fragment)})
    metadata = {'transport': 'native_source_archive', 'target': 'preview',
                'branch': args.branch,
                'reviewCommit': review_commit, 'verificationTools': tool_inventory,
                'contentProfile': 'protected_ecasa_review',
                'publicationAuthorized': False,
                'integrationAuthorized': False,
                'catalogueProjects': 136, 'ecasaProjects': 15, 'ecasaCommercialEntries': 22,
                'ecasaLegacyRoutes': 8,
                'preservedBrochureMedia': 269, 'ingevecReviewMedia': 165,
                'sourceBrochureMedia': 399, 'ecasaSourceMedia': 130,
                'ecasaPublishedMedia': 74 + manual['summary']['documentaryPublishedImages'],
                'imageQuality': receipt['ecasaImageQuality'],
                'officialSourceMedia': len(official_sources), 'officialPublishedMedia': len(official_published),
                'ecasaGalleryImages': manual['summary']['keptImages'] + len(official_published),
                'manualQuality': {'manifestSha256': sha((ROOT / release.MANUAL_MANIFEST).read_bytes()),
                    'summary': manual['summary'], 'effectiveImages': manual['effectiveImages'], 'projects': manual['projects']},
                'officialOriginals': {'manifestSha256': sha((ROOT / release.OFFICIAL_MANIFEST).read_bytes()),
                    'sourceAssets': [official_sources[name] for name in sorted(official_sources)],
                    'publishedAssets': [official_published[name] for name in sorted(official_published)],
                    'summary': receipt['officialOriginals']['summary']},
                'contractualCoverageVerified': receipt['contractualCoverageVerified'],
                'sourceFileCount': len(files), 'sourceBytes': sum(f['size'] for f in inventory),
                'archive': {'privatePath': str(archive), 'sha256': sha(data), 'size': len(data)},
                'chunks': chunks, 'files': inventory, 'publicOutput': public_inventory,
                'offlineProductionOutput': production_inventory,
                'publicWebParityVerified': bool(args.verify_public_web),
                'selectedBrochureMedia': receipt['media']}
    (destination / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    for path in destination.iterdir():
        if path.is_file():
            os.chmod(path, 0o600)
    print(json.dumps({'sourceFiles': len(files), 'selectedBrochureMedia': len(receipt['media']),
                      'archiveSha256': sha(data), 'archiveBytes': len(data),
                      'contractualCoverageVerified': receipt['contractualCoverageVerified'],
                      'publicWebParityVerified': bool(args.verify_public_web),
                      'uploaded': False}))


if __name__ == '__main__':
    main()
