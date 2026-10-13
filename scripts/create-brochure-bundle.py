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
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MEDIA_FOLDERS = ('aj-urbana-preview', 'ingevec-preview', 'ecasa-preview')
MANIFESTS = ('brochures-aj-urbana.json', 'brochures-ingevec.json', 'brochures-ecasa.json')
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
        'endemico', 'terratolten-1', 'wayra', 'alto-san-joaquin-3',
        'enlace-mackenna', 'ferroparque-2', 'espacio-victoria', 'lamara',
        'terratolten-3', 'lomas-de-puyai-3', 'cumbres-de-penuelas',
        'aires-la-florida-2', 'conecta-huechuraba', 'urban-la-florida',
        'alto-san-joaquin', 'alto-san-joaquin-2', 'nucleo-costanera',
        'terratolten-2', 'nucleo-costanera-2'},
}
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
ECASA_REVIEW_SHA256 = 'a8a9d0609f6420e2582d6f91c5eb217322a2eaec151da1a563edbf5193c13987'
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


def selected_source_files(root):
    catalogue = json.loads((root / 'data/proyectos.json').read_text())
    slugs = {project['slug'] for project in catalogue}
    assert len(catalogue) == 143 and len(slugs) == 143, 'The exact final catalogue must contain 143 projects'
    assert APPROVED_PROJECTS['brochures-ingevec.json'] <= slugs and not REMOVED_PROJECTS & slugs
    assert all(p['inmobiliaria'] == 'Ingevec' for p in catalogue if p['slug'] in APPROVED_PROJECTS['brochures-ingevec.json'])
    assert {p['slug'] for p in catalogue if p['inmobiliaria'].lower() == 'ecasa'} == APPROVED_PROJECTS['brochures-ecasa.json'], 'The 22 Ecasa commercial identities must remain exact'
    untouched = [p for p in catalogue if p['inmobiliaria'].lower() != 'ecasa']
    assert len(untouched) == 121 and sha(json.dumps(untouched, ensure_ascii=False, sort_keys=True,
        separators=(',', ':')).encode()) == NON_ECASA_SHA256, 'Other developers changed'
    pages = {p.name for p in root.glob('*.html')}
    assert pages <= PUBLIC_PAGES | {slug + '.html' for slug in slugs}, 'Unapproved or retired public route'
    assert {slug + '.html' for slug in slugs} <= pages, 'Missing approved public route'
    page_text = '\n'.join((root / name).read_text() for name in pages)
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
        for record in manifest['projects']:
            prefix = f'assets/propiedades/{folder}/{record["slug"]}/'
            if name in PRESERVED_MANIFESTS:
                preserved_model_count += len(record['models'])
                preserved_media_count += len(record['images']) + len(record['models'])
            for asset in [*record['images'], *(m['plan'] for m in record['models'])]:
                path = asset['localPath'].lstrip('/')
                assert path.startswith(prefix) and path.count('/') == prefix.count('/'), 'Media belongs to another project or directory'
                assert path not in media, 'Duplicate selected media destination'
                media[path] = asset['sha256']
    assert preserved_model_count == 142, 'The previously approved AJ/Ingevec batch must preserve 142 plans'
    assert preserved_media_count == 269, 'The previously approved AJ/Ingevec batch must preserve 269 resources'
    files = set(media)
    files.update(pages)
    files.update(('vercel.json', 'robots.txt', 'sitemap.xml', 'data/proyectos.json',
                  'data/hipotecario.json', *(f'data/{name}' for name in MANIFESTS),
                  'scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs'))
    if (root / 'scripts/ecasa-publication.mjs').exists():
        files.add('scripts/ecasa-publication.mjs')
    for folder in ('api', 'lib'):
        files.update(str(p.relative_to(root)) for p in (root / folder).rglob('*')
                     if p.is_file() and p.suffix in {'.js', '.mjs'})
    for path in (root / 'assets').rglob('*'):
        relative = str(path.relative_to(root))
        if not path.is_file() or '/brochure-candidates/' in relative or relative in retired_exclusive:
            continue
        if any(f'/propiedades/{folder}/' in relative for folder in MEDIA_FOLDERS):
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
    files = selected_source_files(ROOT)
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
        expected_media = sum(len(json.loads((stage / 'data' / name).read_text())['projects'][index][key])
            for name in MANIFESTS for index in range(len(APPROVED_PROJECTS[name])) for key in ['images', 'models'])
        assert len(receipt['media']) == expected_media, 'The build omitted or added selected brochure resources'
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
                'reviewCommit': subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD']).decode().strip(),
                'contentProfile': 'protected_ecasa_review',
                'publicationAuthorized': False,
                'integrationAuthorized': False,
                'catalogueProjects': 143, 'ecasaProjects': 22,
                'preservedBrochureMedia': 269, 'ingevecReviewMedia': 165,
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
