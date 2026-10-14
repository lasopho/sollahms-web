#!/usr/bin/env python3
"""Verify and prepare a private release locally. Never deploys or changes Git.

The approved archive is immutable. These operational tools are not included
in it. No credentials, original PDF documents or audit receipts enter source/.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'docs/release-reference.json'
EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.svg', '.webp',
              '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.txt', '.xml'}
VERIFICATION_TOOLS = {'tests/qa-ecasa.mjs', 'tests/qa-ecasa-remote.mjs', 'tests/qa-preview-server.mjs'}
OFFICIAL_FOLDER = 'ecasa-official-review'
OFFICIAL_MANIFEST = 'data/ecasa-official-originals.json'
OFFICIAL_MODULE = 'scripts/ecasa-official-originals.mjs'
OFFICIAL_SLUGS = {'ferroparque', 'alto-san-joaquin'}
MANUAL_MANIFEST = 'data/ecasa-manual-quality.json'
MANUAL_MODULE = 'scripts/ecasa-manual-quality.mjs'
BASE_QUALITY_MANIFEST = 'data/ecasa-image-quality.json'
BASE_QUALITY_SHA256 = 'b4562d1dfbe729520a270039df347b8e3e62f5cff7c3b62d99355d784b0bfb34'
LEBEN_MANIFEST = 'data/brochures-leben.json'
LEBEN_MODULE = 'scripts/leben-publication.mjs'
LEBEN_FOLDER = 'leben-preview'
PROTECTED_PROFILES = {'protected_ecasa_review', 'protected_leben_review'}
LEBEN_SLUGS = {'edificio-living-town', 'edificio-mood', 'edificio-santo', 'edificio-baum',
    'edificio-suecia', 'parque-germania', 'capitanes', 'edificio-bold', 'edificio-argomedo',
    'edificio-indi', 'edificio-indigo', 'inn-puerto-chico'}
MANUAL_IMAGE_FIELDS = ('localPath', 'sha256', 'width', 'height', 'originCommercialSlug',
                       'kind', 'decision', 'coverOnly', 'reason')


def manual_quality_selection(manual, base, official=None):
    """Derive the effective selection independently from the frozen image identities."""
    require(manual.get('schemaVersion') == 1 and manual.get('baselineCommit') ==
            'fd9f238685ed59e03716ccef10f40ab8b0a9a1c5' and
            manual.get('scope') == 'ecasa_manual_images_only' and manual.get('protectedPreviewOnly') is True,
            'Unrecognized manual Ecasa review scope or baseline')
    baseline = {project['slug']: project for project in base['projects']}
    projects = manual.get('projects', [])
    require(len(projects) == len(baseline) == 15 and len({project.get('slug') for project in projects}) == 15 and
            {project.get('slug') for project in projects} == set(baseline), 'Manual review changed project identities')
    final_official_covers = {project['slug']: project.get('previewCover') for project in (official or {}).get('projects', [])}
    images, choices, covers = {}, [], {}
    remove_doc = {'nucleo-costanera', 'lamara', 'edificio-bezanilla', 'endemico', 'ferroparque', 'terratolten',
                  'urban-la-florida', 'aires-la-florida-2', 'conecta-huechuraba', 'alto-san-joaquin'}
    unchanged = {'wayra', 'lomas-de-puyai', 'enlace-mackenna'}
    for project in projects:
        slug = project['slug']; previous = baseline[slug]
        originals = {image['localPath']: image for image in previous['images']}
        rows = project.get('images', [])
        require(len(rows) == len(originals) and {image.get('localPath') for image in rows} == set(originals),
                'Manual review omitted or added a source photograph: ' + slug)
        mode = project.get('officialGalleryMode')
        expected_mode = 'integrate_into_official' if slug == 'ferroparque' else 'retain_development_photo' if slug == 'alto-san-joaquin' else 'unchanged'
        require(mode == expected_mode, 'Manual gallery mode belongs to another development')
        require(isinstance(project.get('instruction'), str) and bool(project['instruction'].strip()),
                'Manual instruction is missing')
        cover = project.get('previewCover')
        require(cover is None or cover in originals, 'Manual cover belongs to another project or source')
        selected_covers = dict(previous['covers']['preview']) if cover is None else {'hero': cover, 'catalogue': cover}
        covers[slug] = selected_covers
        final_covers = {'hero': final_official_covers[slug], 'catalogue': final_official_covers[slug]} if final_official_covers.get(slug) else selected_covers
        for row in rows:
            path = row['localPath']; original = originals[path]
            require(set(row) == set(MANUAL_IMAGE_FIELDS), 'Manual choice contains unreviewed fields')
            require(path not in images and all(row.get(key) == original.get(key) for key in
                    ['sha256', 'width', 'height', 'originCommercialSlug', 'kind']),
                    'Manual decision changed source bytes, dimensions or commercial origin')
            require(row.get('decision') in {'keep', 'exclude'} and type(row.get('coverOnly')) is bool and
                    isinstance(row.get('reason'), str) and bool(row['reason'].strip()), 'Incomplete manual image decision')
            require(original.get('decision') != 'exclude' or row['decision'] == 'exclude' and not row['coverOnly'],
                    'Manual review resurrected an original quality exclusion')
            require(row['kind'] != 'official' or row['decision'] == 'keep' and not row['coverOnly'],
                    'Manual review must preserve all historical official images')
            require(not row['coverOnly'] or row['kind'] == 'documentary' and row['decision'] == 'exclude' and
                    path in final_covers.values(), 'Manual cover-only resource is not a final same-project cover')
            if row['kind'] == 'documentary':
                if slug in remove_doc:
                    require(row['decision'] == 'exclude', 'Manual instruction removes this documentary gallery')
                if slug in unchanged:
                    require(row['decision'] == original['decision'] and row['coverOnly'] == original['coverOnly'],
                            'Manual review changed an untouched documentary gallery')
                if slug in {'cumbres-de-penuelas', 'espacio-victoria'}:
                    removed = '/assets/propiedades/ecasa-preview/' + slug + '/' + (
                        'imagen-02-p03.webp' if slug == 'cumbres-de-penuelas' else 'imagen-01-p01.webp')
                    require(row['decision'] == ('exclude' if path == removed else 'keep') and not row['coverOnly'],
                            'Manual review changed the specifically retained documentary photographs')
            images[path] = {key: row[key] for key in MANUAL_IMAGE_FIELDS}
            images[path]['projectSlug'] = slug
        require(all(path is None or images[path]['decision'] == 'keep' or images[path]['coverOnly']
                    for path in selected_covers.values()), 'Excluded manual cover has no explicit cover-only permission')
        require(slug not in unchanged or selected_covers == previous['covers']['preview'],
                'Manual review changed an untouched project cover')
        choices.append({'slug': slug, 'previewCover': cover, 'officialGalleryMode': mode})
    require(len(images) == 118, 'Manual review must preserve all 118 original image identities')
    return {'effectiveImages': [images[path] for path in sorted(images)],
            'projects': sorted(choices, key=lambda project: project['slug']), 'covers': covers,
            'summary': manual_summary(images.values())}


def manual_summary(images):
    images = list(images)
    return {'reviewedImages': len(images), 'officialImages': sum(image['kind'] == 'official' for image in images),
            'documentaryImages': sum(image['kind'] == 'documentary' for image in images), 'plansPreserved': 74,
            'keptImages': sum(image['decision'] == 'keep' for image in images),
            'excludedImages': sum(image['decision'] == 'exclude' for image in images),
            'coverOnlyImages': sum(image['coverOnly'] for image in images),
            'documentaryGalleryImages': sum(image['kind'] == 'documentary' and image['decision'] == 'keep' for image in images),
            'documentaryPublishedImages': sum(image['kind'] == 'documentary' and (image['decision'] == 'keep' or image['coverOnly']) for image in images)}


def manual_published_media(originals, selection):
    images = {image['localPath'].lstrip('/'): image for image in selection['effectiveImages']}
    require(all(path in originals and originals[path] == image['sha256'] for path, image in images.items()
                if image['kind'] == 'documentary'), 'Manual documentary selection differs from the source manifest')
    return {path: value for path, value in originals.items() if path not in images or
            images[path]['decision'] == 'keep' or images[path]['coverOnly']}


def manual_policy_inventory(policy, files):
    review = policy.get('manualQuality')
    if review is None:
        require(MANUAL_MANIFEST not in files and MANUAL_MODULE not in files,
                'Manual source inputs require their own review receipt')
        return None
    require(policy.get('contentProfile') in PROTECTED_PROFILES and
            files.get(MANUAL_MANIFEST, {}).get('sha256') == review.get('manifestSha256') and MANUAL_MODULE in files,
            'Manual manifest or consumer differs from the private review receipt')
    images = review.get('effectiveImages', []); projects = review.get('projects', [])
    require(len(images) == 118 and len({image.get('localPath') for image in images}) == 118 and
            len(projects) == 15 and len({project.get('slug') for project in projects}) == 15,
            'Manual receipt image/project inventory is incomplete or duplicated')
    summary = manual_summary(images)
    require(all(review.get('summary', {}).get(key) == value for key, value in summary.items()),
            'Manual summary differs from its exact effective image inventory')
    require(policy.get('ecasaPublishedMedia') == 74 + summary['documentaryPublishedImages'] and
            policy.get('ecasaGalleryImages') == summary['keptImages'] + policy.get('officialPublishedMedia', 0),
            'Manual publication counts differ from selected photographs and preserved plans')
    return summary


def official_manifest_inventory(manifest):
    """Bind the four private files to the two exact reviewed project origins."""
    require(manifest.get('schemaVersion') == 1 and
            manifest.get('baselineCommit') == '0117cc546cc75183f73cae07c90dd093937a819f' and
            manifest.get('scope') == 'two_named_ecasa_projects' and
            manifest.get('protectedPreviewOnly') is True, 'Unrecognized official-original review scope')
    rights = manifest.get('rights', {})
    require(rights.get('status') == 'pending_explicit_ecasa_authorization' and
            rights.get('publicWeb') is False and rights.get('irisYapo') is False,
            'Independent official Ecasa public rights must remain pending')
    projects = manifest.get('projects', [])
    require(len(projects) == 2 and {project.get('slug') for project in projects} == OFFICIAL_SLUGS,
            'Official originals must cover only the two named developments')
    sources, published = {}, {}
    for project in projects:
        slug = project['slug']
        require(project.get('sourcePageUrl') == 'https://ecasa.cl/proyecto/' + slug,
                'Official source page belongs to another development')
        images = project.get('images', [])
        require(len(images) == 1, 'The exact official review contains one photograph per development')
        selected = {image.get('localPath') for image in images}
        require(project.get('previewCover') in selected and project.get('gallery') == [project['previewCover']],
                'Official publication selection differs from the two reviewed images')
        for image in images:
            require(image.get('originCommercialSlug') == slug and image.get('scope') == 'development_general',
                    'Official image origin transferred to another project or stage')
            original = image.get('original', {})
            require(re.fullmatch(r'https://ecasa\.cl/uploads/images/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)',
                                 original.get('url', '')) is not None and '..' not in original['url'],
                    'Official resource URL is outside the authorized Ecasa host')
            for kind, asset in [('original', original), ('selected', image)]:
                prefix = 'assets/propiedades/' + OFFICIAL_FOLDER + '/' + ('originals/' if kind == 'original' else '') + slug + '/'
                path = asset.get('localPath', '').lstrip('/')
                require(asset.get('localPath') == '/' + path and path.startswith(prefix) and
                        re.fullmatch(r'[a-zA-Z0-9_.-]+\.(?:webp|png|jpe?g)', path[len(prefix):]) is not None and
                        '..' not in path, 'Official private path belongs to another project or directory')
                require(path not in sources and re.fullmatch(r'[a-f0-9]{64}', asset.get('sha256', '')) is not None and
                        all(type(asset.get(key)) is int and asset[key] > 0 for key in ['bytes', 'width', 'height']),
                        'Duplicate or incomplete official asset inventory')
                item = {'path': '/' + path, 'sha256': asset['sha256'], 'bytes': asset['bytes'],
                        'width': asset['width'], 'height': asset['height'], 'kind': kind}
                sources[path] = item
                if kind == 'selected':
                    published[path] = item
    require(len(sources) == 4 and len(published) == 2, 'Official source/publication inventories are incomplete')
    return sources, published


def official_policy_inventory(policy, files):
    review = policy.get('officialOriginals')
    official_files = {name for name in files if name.startswith('assets/propiedades/' + OFFICIAL_FOLDER + '/')}
    if review is None:
        require(not official_files, 'Official private files require an exact review inventory')
        return {}
    require(policy.get('contentProfile') in PROTECTED_PROFILES and
            policy.get('officialSourceMedia') == 4 and policy.get('officialPublishedMedia') == 2 and
            (policy.get('manualQuality') is not None or policy.get('ecasaGalleryImages') == 116),
            'Official originals require the protected review profile')
    require(files.get(OFFICIAL_MANIFEST, {}).get('sha256') == review.get('manifestSha256'),
            'Official manifest differs from private review receipt')
    sources = review.get('sourceAssets', [])
    published = review.get('publishedAssets', [])
    require(len(sources) == 4 and len(published) == 2, 'Official private receipt inventory is incomplete')
    inventory = {item.get('path', '').lstrip('/'): item for item in sources}
    require(len(inventory) == 4 and set(inventory) == official_files,
            'Official private archive differs from exact review inventory')
    for name, item in inventory.items():
        require(item.get('path') == '/' + name and
                files[name].get('sha256') == item.get('sha256') and files[name].get('size') == item.get('bytes'),
                'Official private bytes differ from reviewed manifest')
    require({item.get('path') for item in published} == {item.get('path') for item in sources if item.get('kind') == 'selected'} and
            all(item in sources for item in published), 'Official published inventory includes an original or unreviewed file')
    return inventory


def require(condition, message):
    if not condition:
        raise ValueError(message)


def leben_manifest_inventory(manifest):
    """Select derivatives only; the twelve source PDFs never enter an archive."""
    rights = manifest.get('publicationRights', {})
    source_package = manifest.get('sourcePackage', {})
    require(source_package.get('sourceMode') == 'regenerated_from_local_originals' and
            re.fullmatch(r'[a-f0-9]{64}', source_package.get('inventorySha256', '')) is not None and
            source_package.get('status') == 'reviewed' and source_package.get('originalPdfCount') == 12 and
            source_package.get('originalsValidatedBySha256') == 12 and
            source_package.get('instructions', {}).get('fileName') == 'INSTRUCCIONES_CODEX.md' and
            re.fullmatch(r'[a-f0-9]{64}', source_package.get('instructions', {}).get('sha256', '')) is not None,
            'Leben local originals, regenerated SHA inventory and instructions must be reviewed first')
    require(manifest.get('schemaVersion') == 1 and manifest.get('inmobiliaria') == 'Leben' and
            manifest.get('protectedPreviewOnly') is True and rights.get('sourceChannel') == 'Leben/user_supplied' and
            rights.get('protectedPreview') == 'authorized_by_user' and
            rights.get('productionPolicy') == 'requires_verified_contract_scope' and
            rights.get('contractScope', {}).get('status') == 'pending_contract_scope_verification',
            'Leben supplement requires its independent protected review permission')
    projects = manifest.get('projects', [])
    require(len(projects) == 12 and {project.get('slug') for project in projects} == LEBEN_SLUGS,
            'Leben supplement must complement exactly twelve existing identities')
    inventory, documents = {}, {}
    for project in projects:
        document = project.get('document')
        require(project.get('documents', [document]) == [document] and isinstance(document, dict) and
                document.get('sourceChannel') == 'Leben/user_supplied' and
                re.fullmatch(r'[a-f0-9]{64}', document.get('sha256', '')) is not None and
                re.fullmatch(r'[^/\\]+\.pdf', document.get('fileName', ''), re.I) is not None and
                type(document.get('pageCount')) is int and document['pageCount'] > 0 and
                document['sha256'] not in documents, 'Invalid or duplicate Leben PDF evidence')
        documents[document['sha256']] = document
        require(isinstance(project.get('images'), list) and isinstance(project.get('models'), list),
                'Leben selection arrays are missing')
        prefix = '/assets/propiedades/' + LEBEN_FOLDER + '/' + project['slug'] + '/'
        images = project['images']; models = project['models']
        for asset in images + [model.get('plan', {}) for model in models]:
            path = asset.get('localPath', '')
            require(path.startswith(prefix) and '..' not in path and
                    re.fullmatch(r'[a-z0-9_.-]+\.(?:webp|jpe?g|png)', path[len(prefix):], re.I) is not None and
                    path.lstrip('/') not in inventory and re.fullmatch(r'[a-f0-9]{64}', asset.get('sha256', '')) is not None and
                    asset.get('sourceSha256') == document['sha256'] and type(asset.get('sourcePage')) is int and
                    1 <= asset['sourcePage'] <= document['pageCount'] and
                    all(type(asset.get(key)) is int and asset[key] > 0 for key in ['width', 'height']) and
                    asset.get('visuallyVerified') is True and asset.get('privacySafe') is True,
                    'Leben resource lacks exact project, source or review evidence')
            if asset in images:
                require(asset.get('qualityDecision') == 'keep' and
                        type(asset.get('nativeWidth')) is int and asset['nativeWidth'] >= asset['width'] and
                        type(asset.get('nativeHeight')) is int and asset['nativeHeight'] >= asset['height'],
                        'An excluded, enlarged or unreviewed Leben photograph cannot be selected')
            inventory[path.lstrip('/')] = {'path': path, 'sha256': asset['sha256'],
                'width': asset['width'], 'height': asset['height']}
        identities = set()
        for model in models:
            identity = (model.get('sourceSha256'), model.get('modelo'))
            plan = model.get('plan', {})
            require(isinstance(model.get('modelo'), str) and model['modelo'].strip() and identity not in identities and
                    model.get('visuallyVerified') is True and model.get('sourceSha256') == document['sha256'] and
                    model.get('pagina_brochure') == plan.get('sourcePage') and
                    model.get('sourcePages') == [model.get('pagina_brochure')] and
                    plan.get('sourceSha256') == model.get('sourceSha256'), 'Leben plan must have individual source evidence')
            identities.add(identity)
            require(plan.get('sourceKind') in {'vector', 'raster'} and
                    (plan['sourceKind'] == 'vector' or type(plan.get('nativeWidth')) is int and
                     plan['nativeWidth'] >= plan['width'] and type(plan.get('nativeHeight')) is int and
                     plan['nativeHeight'] >= plan['height']), 'Leben raster plans cannot be enlarged')
        cover = project.get('catalogueCover')
        require(cover is None or any(image['localPath'] == cover.get('localPath') for image in images) and
                isinstance(cover.get('alt'), str) and cover['alt'].strip(), 'Leben cover is not a selected same-project photograph')
    sources = manifest.get('sourceDocuments', [])
    require(len(sources) == 12 and len({source.get('sha256') for source in sources}) == 12 and
            all(source == documents.get(source.get('sha256')) for source in sources), 'Leben source inventory must bind twelve PDFs exactly')
    return inventory


def leben_policy_inventory(policy, files):
    review = policy.get('lebenReview')
    private = {name for name in files if name.startswith('assets/propiedades/' + LEBEN_FOLDER + '/')}
    if review is None:
        require(not private and LEBEN_MANIFEST not in files, 'Leben private sources require their exact review receipt')
        return {}
    require(policy.get('contentProfile') == 'protected_leben_review' and LEBEN_MODULE in files and
            files.get(LEBEN_MANIFEST, {}).get('sha256') == review.get('manifestSha256'),
            'Leben manifest or consumer differs from the protected review receipt')
    assets = review.get('assets', [])
    inventory = {item.get('path', '').lstrip('/'): item for item in assets}
    require(len(inventory) == len(assets) == policy.get('lebenReviewMedia') and set(inventory) == private,
            'Leben private archive differs from its exact selected inventory')
    require(all(files[name]['sha256'] == item.get('sha256') and files[name]['size'] == item.get('bytes')
                for name, item in inventory.items()), 'Leben private bytes differ from the selected manifest')
    return inventory


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name, official_original_paths=()):
    parts = PurePosixPath(name).parts
    require(bool(parts) and not name.startswith('/') and '\\' not in name and
            all(part not in {'.', '..'} and not part.startswith('.') for part in parts) and
            str(PurePosixPath(name)) == name, 'Unsafe archive path')
    require(PurePosixPath(name).suffix.lower() in EXTENSIONS, 'Private or unexpected file type')
    require(not any(part in {'docs', 'tests', 'contracts', 'node_modules',
                             'brochure-candidates', 'inventarios'} for part in parts),
            'Private or operational directory in deployment source')
    require('originals' not in parts or name in official_original_paths and
            parts[:4] == ('assets', 'propiedades', OFFICIAL_FOLDER, 'originals') and
            len(parts) == 6 and parts[4] in OFFICIAL_SLUGS,
            'Private or operational directory in deployment source')
    return name


def verify_archive(archive, policy):
    require(archive.is_file() and not archive.is_symlink(), 'Original private archive is missing or symbolic')
    require(archive.stat().st_size == policy['archiveBytes'], 'Archive size differs from approval')
    hasher = hashlib.sha256()
    with archive.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(block)
    require(hasher.hexdigest() == policy['archiveSha256'], 'Archive SHA-256 differs from approval')
    files, total, official_manifest, manual_manifest, base_quality, leben_manifest = {}, 0, None, None, None, None
    official_original_paths = {item.get('path', '').lstrip('/')
        for item in (policy.get('officialOriginals') or {}).get('sourceAssets', []) if item.get('kind') == 'original'}
    with tarfile.open(archive, 'r:gz') as bundle:
        for member in bundle:
            name = safe_name(member.name, official_original_paths)
            require(member.isfile() and not member.issym() and not member.islnk(), 'Nonregular archive member')
            require(name not in files, 'Duplicate archive member')
            require(0 <= member.size <= policy['sourceBytes'] - total, 'Archive exceeds approved uncompressed size')
            require(len(files) < policy['sourceFiles'], 'Archive exceeds approved file count')
            data = bundle.extractfile(member).read()
            require(len(data) == member.size, 'Truncated archive member')
            files[name] = {'size': len(data), 'sha256': digest(data),
                           'gitBlob': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()}
            if name == OFFICIAL_MANIFEST:
                official_manifest = json.loads(data)
            elif name == MANUAL_MANIFEST:
                manual_manifest = json.loads(data)
            elif name == BASE_QUALITY_MANIFEST:
                base_quality = json.loads(data)
            elif name == LEBEN_MANIFEST:
                leben_manifest = json.loads(data)
            total += len(data)
    require(len(files) == policy['sourceFiles'] and total == policy['sourceBytes'], 'Incomplete source archive')
    if policy.get('officialOriginals') is not None:
        require(official_manifest is not None and OFFICIAL_MODULE in files,
                'Official review manifest or overlay is missing from source archive')
        source_assets, published_assets = official_manifest_inventory(official_manifest)
        review = policy['officialOriginals']
        require(review.get('sourceAssets') == [source_assets[name] for name in sorted(source_assets)] and
                review.get('publishedAssets') == [published_assets[name] for name in sorted(published_assets)],
                'Official source receipt differs from exact archived manifest')
        official_policy_inventory(policy, files)
    manual_policy_inventory(policy, files)
    leben_policy_inventory(policy, files)
    if policy.get('lebenReview') is not None:
        require(leben_manifest is not None, 'Leben selected manifest is missing')
        selected = leben_manifest_inventory(leben_manifest)
        expected = [{**selected[name], 'bytes': files.get(name, {}).get('size')} for name in sorted(selected)]
        require(policy['lebenReview'].get('assets') == expected,
                'Leben receipt differs from the exact archived selection')
    if policy.get('manualQuality') is not None:
        require(manual_manifest is not None and base_quality is not None and
                files[BASE_QUALITY_MANIFEST]['sha256'] == BASE_QUALITY_SHA256,
                'Manual review changed or omitted the frozen base quality policy')
        derived = manual_quality_selection(manual_manifest, base_quality, official_manifest)
        require(policy['manualQuality'].get('effectiveImages') == derived['effectiveImages'] and
                policy['manualQuality'].get('projects') == derived['projects'],
                'Manual receipt differs from the exact archived selection')
    return files


def git(root, *args):
    return subprocess.check_output(['git', '--no-pager', '-C', str(root), *args], stderr=subprocess.PIPE)


def verify_verification_tools(root, policy):
    tools = policy.get('verificationTools')
    if tools is None:
        return
    require(isinstance(tools, list) and len(tools) == len(VERIFICATION_TOOLS) and
            {tool.get('file') for tool in tools} == VERIFICATION_TOOLS,
            'Private verification tool inventory differs from the reviewed QA selection')
    for tool in tools:
        name = tool['file']
        path = root / name
        require(path.is_file() and not path.is_symlink(), 'Missing or symbolic verification tool: ' + name)
        data = path.read_bytes()
        require(len(data) == tool.get('size') and digest(data) == tool.get('sha256'),
                'Verification tool differs from private receipt: ' + name)
        require(data == git(root, 'show', policy['approvedAppCommit'] + ':' + name),
                'Verification tool differs from prepared Git commit: ' + name)


def verify_git_reference(root, files, policy):
    commit = policy['approvedAppCommit']
    require(git(root, 'rev-parse', commit + '^{commit}').decode().strip() == commit, 'Approved application commit is unavailable')
    require(git(root, 'rev-parse', '--show-object-format').decode().strip() == 'sha1', 'Unsupported Git object format')
    tree = {}
    for record in git(root, 'ls-tree', '-rz', commit).split(b'\0'):
        if record:
            fields, name = record.split(b'\t', 1)
            mode, kind, oid = fields.decode().split()
            tree[name.decode()] = (mode, kind, oid)
    official = official_policy_inventory(policy, files)
    leben = leben_policy_inventory(policy, files)
    manual_policy_inventory(policy, files)
    require(not set(official) & set(tree), 'Official review images must remain outside public Git source')
    require(not set(leben) & set(tree), 'Leben review images must remain outside public Git source')
    tracked = 0
    for name, info in files.items():
        if name in tree:
            mode, kind, oid = tree[name]
            require(kind == 'blob' and mode in {'100644', '100755'} and oid == info['gitBlob'],
                    'Source differs from approved Git commit: ' + name)
            tracked += 1
        else:
            folders = policy.get('privateMediaFolders', ['ingevec-preview'])
            require(bool(folders) and set(folders) <= {'ingevec-preview', 'ecasa-preview', OFFICIAL_FOLDER, LEBEN_FOLDER},
                    'Unapproved private media folder policy')
            if name.startswith('assets/propiedades/' + OFFICIAL_FOLDER + '/'):
                require(OFFICIAL_FOLDER in folders and name in official,
                        'Official private source is not in its exact manifest inventory')
            if name.startswith('assets/propiedades/' + LEBEN_FOLDER + '/'):
                require(LEBEN_FOLDER in folders and name in leben, 'Leben private source is not in its exact manifest inventory')
            require(any(name.startswith('assets/propiedades/' + folder + '/') for folder in folders),
                    'Unapproved non-Git source file: ' + name)
    require(tracked == policy['trackedSourceFiles'] and len(files) - tracked == policy['privateSourceFiles'],
            'Tracked/private source inventory differs from approval')
    return tracked


def verify_worktree(root, files, policy):
    # Recovery from archive + a clean Git clone must not depend on local
    # ignored Ingevec files. Their exact approved bytes are verified in tar.
    tracked = set(git(root, 'ls-tree', '-rz', '--name-only', policy['approvedAppCommit']).decode().split('\0'))
    relevant = ['assets', 'api', 'lib', 'data/proyectos.json', 'data/hipotecario.json',
                'data/brochures-aj-urbana.json', 'data/brochures-ingevec.json',
                'data/brochures-ecasa.json', 'scripts/ecasa-publication.mjs',
                'data/public-caption-policy.json', 'scripts/public-fiche-copy.mjs',
                'scripts/ecasa-image-quality.mjs', 'data/ecasa-image-quality.json',
                'data/fichas-proyectos.json', 'data/fuentes-imagenes.json',
                OFFICIAL_MANIFEST, OFFICIAL_MODULE,
                MANUAL_MANIFEST, MANUAL_MODULE,
                'scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs',
                'vercel.json', 'robots.txt', 'sitemap.xml', ':(top)*.html']
    require(not git(root, 'diff', '--no-ext-diff', '--name-only', policy['approvedAppCommit'], '--', *relevant).strip(),
            'Current deployable tracked source differs from approval')
    require(not git(root, 'ls-files', '--others', '--exclude-standard', '--', *relevant).strip(),
            'Untracked application changes require a new reviewed release')
    for name, info in files.items():
        path = root / name
        if name in tracked or path.exists():
            require(path.is_file() and path.resolve() == path and digest(path.read_bytes()) == info['sha256'],
                    'Current deployable file differs from approval: ' + name)


def outside_source(destination, root):
    destination, root = destination.resolve(), root.resolve()
    require(destination != root and root not in destination.parents,
            'Private output must remain outside the checkout')
    require(not destination.exists(), 'Use a new empty private output path')
    return destination


def extract_verified(archive, destination, files):
    destination.mkdir(mode=0o700)
    seen = set()
    with tarfile.open(archive, 'r:gz') as bundle:
        for member in bundle:
            name = safe_name(member.name, files)
            require(member.isfile() and name in files and name not in seen, 'Archive changed after verification')
            seen.add(name)
            data = bundle.extractfile(member).read()
            require(digest(data) == files[name]['sha256'], 'Archive changed after verification')
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    require(seen == files.keys(), 'Archive changed after verification')


def build(source, node, environment, branch, public_profile=True):
    # Local packaging requires no provider credentials or environment download.
    env = {'PATH': str(Path(node).parent) + os.pathsep + os.defpath,
           'VERCEL_ENV': environment, 'VERCEL_GIT_COMMIT_REF': branch}
    if public_profile:
        env['SOLLAHMS_BROCHURE_PROFILE'] = 'public-web'
    result = subprocess.run([node, str(source / 'scripts/package-vercel.mjs')],
                            cwd=source, env=env, check=True, capture_output=True, text=True)
    return json.loads(result.stdout.strip())


def verify_staged_deployment(snapshot, policy):
    """Validate a SANITIZED real platform receipt; never calls Vercel.

    Presence of these fields is required, not guessed from omitted API fields.
    The operator records runtime/build evidence after authorized staging.
    """
    require(policy.get('contentProfile') not in PROTECTED_PROFILES,
            'A protected Ecasa review or protected Leben review reference cannot authorize a staged Production release')
    require(snapshot.get('projectId') == policy['projectId'] and snapshot.get('teamId') == policy['teamId'],
            'Staged deployment belongs to another or unverified project/team')
    require(snapshot.get('target') == 'production' and snapshot.get('readyState') == 'READY',
            'A READY Production build is required; a Preview cannot be published unchanged')
    require(snapshot.get('aliases') == [], 'Staged deployment has already assigned a domain or alias')
    require(snapshot.get('archiveSha256') == policy['archiveSha256'] and
            snapshot.get('approvedAppCommit') == policy['approvedAppCommit'], 'Staged source is not approved')
    require(snapshot.get('runtimeEnvironment') == 'production' and snapshot.get('systemEnvironmentVerified') is True,
            'Production system environment has not been verified')
    require(snapshot.get('publicBuildAuditPassed') is True and snapshot.get('providerMocksPassed') is True and
            snapshot.get('realProviderWrites') == 0, 'Staged verification is incomplete or sent real requests')
    require(isinstance(snapshot.get('deploymentId'), str) and snapshot['deploymentId'].startswith('dpl_'),
            'Staged deployment identifier is missing')
    return snapshot['deploymentId']


def prepare(archive, output, node, policy, protected_review=False):
    files = verify_archive(archive, policy)
    tracked = verify_git_reference(ROOT, files, policy)
    verify_worktree(ROOT, files, policy)
    verify_verification_tools(ROOT, policy)
    destination = outside_source(output, ROOT)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.mkdir(mode=0o700)
    source = destination / 'source'
    extract_verified(archive, source, files)
    public, preview = destination / 'production-local', destination / 'preview-local'
    shutil.copytree(source, public)
    shutil.copytree(source, preview)
    public_result = build(public, node, 'production', 'main', public_profile=not protected_review)
    preview_result = build(preview, node, 'preview', policy['developmentBranch'], public_profile=not protected_review)
    for result in (public_result, preview_result):
        expected_media = (policy.get('preservedBrochureMedia', 269) if protected_review and result['environment'] == 'production'
                          else policy['selectedBrochureMedia'])
        expected_ingevec = policy.get('ingevecReviewMedia', policy['privateSourceFiles'])
        require(result['pages'] == policy['htmlPages'] and
                result['selectedBrochureMedia'] == expected_media and
                result['ingevecReviewMedia'] == expected_ingevec,
                'Build omitted approved source content')
        require(result.get('preservedContractualCoverageVerified', result['contractualCoverageVerified']) is True
                if protected_review else result['contractualCoverageVerified'] is True,
                'Contractual scope for the selected public batches is unverified')
        if policy.get('officialOriginals') is not None:
            require(result.get('officialPublishedMedia') == (policy['officialPublishedMedia'] if result['environment'] == 'preview' else 0),
                    'Build omitted official review images or leaked them to the public profile')
        if policy.get('manualQuality') is not None and result['environment'] == 'preview':
            require(result.get('ecasaReviewMedia') == policy['ecasaPublishedMedia'] and
                    result.get('ecasaGalleryImages') == policy['ecasaGalleryImages'],
                    'Manual build publication differs from the reviewed image/plan inventory')
        if policy.get('lebenReview') is not None:
            require(result.get('lebenReviewMedia') == (policy['lebenReviewMedia'] if result['environment'] == 'preview' else 0),
                    'Leben build omitted selected resources or leaked them to the public profile')
    require(public_result['environment'] == 'production' and not public_result['noindex'] and
            preview_result['environment'] == 'preview' and preview_result['noindex'], 'Build environment mismatch')
    audit_path = destination / 'public-preview-audit.json'
    audit_command = [sys.executable, str(ROOT / 'tests/audit_public_build.py'), '--source', str(source),
                    '--public', str(public / 'dist'), '--preview', str(preview / 'dist'),
                    '--receipt', str(audit_path), '--node', node]
    if protected_review:
        audit_command.append('--protected-review')
    subprocess.run(audit_command, check=True, capture_output=True, text=True)
    audit = json.loads(audit_path.read_text())
    require(not audit['errors'], 'Public/Preview audit failed')
    # Local linkage is metadata only. It does not contact or modify Vercel.
    link = source / '.vercel'
    link.mkdir(mode=0o700)
    (link / 'project.json').write_text(json.dumps({'projectId': policy['projectId'],
        'orgId': policy['teamId'], 'projectName': policy['projectName']}, indent=2) + '\n')
    os.chmod(link / 'project.json', 0o600)
    receipt = {'approvedAppCommit': policy['approvedAppCommit'],
               'preparationHead': git(ROOT, 'rev-parse', 'HEAD').decode().strip(),
               'archiveSha256': policy['archiveSha256'], 'archiveBytes': policy['archiveBytes'],
               'sourceFiles': len(files), 'trackedSourceFiles': tracked,
               'privateSourceFiles': len(files) - tracked, 'source': str(source),
               'publicBuild': public_result, 'previewBuild': preview_result,
               'auditReceipt': str(audit_path), 'deployableSourceInventory': files,
               'localPreparationPassed': True, 'networkUsed': False, 'deploymentPerformed': False,
               'contentProfile': policy.get('contentProfile', 'protected_ecasa_review') if protected_review else 'public_web_parity',
               'verificationTools': policy.get('verificationTools', []),
               'sourceBrochureMedia': policy.get('sourceBrochureMedia'),
               'ecasaSourceMedia': policy.get('ecasaSourceMedia'),
               'ecasaPublishedMedia': policy.get('ecasaPublishedMedia'),
               'imageQuality': policy.get('imageQuality'),
               'officialSourceMedia': policy.get('officialSourceMedia', 0),
               'officialPublishedMedia': policy.get('officialPublishedMedia', 0),
               'ecasaGalleryImages': policy.get('ecasaGalleryImages', 114),
               'officialOriginals': policy.get('officialOriginals'),
               **({'manualQuality': policy['manualQuality']} if policy.get('manualQuality') is not None else {}),
               **({'lebenReview': policy['lebenReview'], 'lebenReviewMedia': policy['lebenReviewMedia']}
                  if policy.get('lebenReview') is not None else {}),
               **({'lebenPublicWebRights': 'pending_contract_scope_verification'}
                  if policy.get('lebenReview') is not None else {}),
               'ecasaPublicWebParityVerified': not protected_review,
               'publicationAuthorized': False, 'integrationAuthorized': False}
    (destination / 'release-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    os.chmod(destination / 'release-receipt.json', 0o600)
    os.chmod(audit_path, 0o600)
    return {key: value for key, value in receipt.items() if key != 'deployableSourceInventory'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', type=Path, default=REFERENCE)
    parser.add_argument('--archive', type=Path)
    parser.add_argument('--output-directory', type=Path)
    parser.add_argument('--node', default=shutil.which('node'))
    parser.add_argument('--staged-receipt', type=Path,
                        help='Verify a sanitized future staged deployment receipt locally; never promotes')
    parser.add_argument('--protected-review', action='store_true',
                        help='Prepare only the protected Ecasa review and offline public fallbacks; never verifies production eligibility')
    args = parser.parse_args()
    policy = json.loads(args.reference.read_text())
    require(policy['schemaVersion'] == 1, 'Unknown release reference version')
    if args.staged_receipt:
        require(not args.archive and not args.output_directory and not args.protected_review, 'Select one operation')
        identifier = verify_staged_deployment(json.loads(args.staged_receipt.read_text()), policy)
        print(json.dumps({'deploymentId': identifier, 'stagedReceiptPassed': True, 'promoted': False}))
    else:
        require(args.archive and args.output_directory and args.node, 'Archive, private output and Node are required')
        print(json.dumps(prepare(args.archive.expanduser().absolute(), args.output_directory,
                                 str(Path(args.node).resolve()), policy, args.protected_review)))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, AssertionError, OSError, subprocess.CalledProcessError, tarfile.TarError,
            KeyError, json.JSONDecodeError) as error:
        # Do not print subprocess output: it may contain unrelated environment data.
        print(json.dumps({'localPreparationPassed': False, 'error': str(error),
                          'deploymentPerformed': False}), file=sys.stderr)
        sys.exit(1)
