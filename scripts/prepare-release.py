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
    require(policy.get('contentProfile') == 'protected_ecasa_review' and
            policy.get('officialSourceMedia') == 4 and policy.get('officialPublishedMedia') == 2 and
            policy.get('ecasaGalleryImages') == 116, 'Official originals require the protected review profile')
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
    files, total, official_manifest = {}, 0, None
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
    return files


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)


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
    require(not set(official) & set(tree), 'Official review images must remain outside public Git source')
    tracked = 0
    for name, info in files.items():
        if name in tree:
            mode, kind, oid = tree[name]
            require(kind == 'blob' and mode in {'100644', '100755'} and oid == info['gitBlob'],
                    'Source differs from approved Git commit: ' + name)
            tracked += 1
        else:
            folders = policy.get('privateMediaFolders', ['ingevec-preview'])
            require(bool(folders) and set(folders) <= {'ingevec-preview', 'ecasa-preview', OFFICIAL_FOLDER},
                    'Unapproved private media folder policy')
            if name.startswith('assets/propiedades/' + OFFICIAL_FOLDER + '/'):
                require(OFFICIAL_FOLDER in folders and name in official,
                        'Official private source is not in its exact manifest inventory')
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
                'scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs',
                'vercel.json', 'robots.txt', 'sitemap.xml', ':(top)*.html']
    require(not git(root, 'diff', '--name-only', policy['approvedAppCommit'], '--', *relevant).strip(),
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
    require(policy.get('contentProfile') != 'protected_ecasa_review',
            'A protected Ecasa review reference cannot authorize a staged Production release')
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
               'contentProfile': 'protected_ecasa_review' if protected_review else 'public_web_parity',
               'verificationTools': policy.get('verificationTools', []),
               'sourceBrochureMedia': policy.get('sourceBrochureMedia'),
               'ecasaSourceMedia': policy.get('ecasaSourceMedia'),
               'ecasaPublishedMedia': policy.get('ecasaPublishedMedia'),
               'imageQuality': policy.get('imageQuality'),
               'officialSourceMedia': policy.get('officialSourceMedia', 0),
               'officialPublishedMedia': policy.get('officialPublishedMedia', 0),
               'ecasaGalleryImages': policy.get('ecasaGalleryImages', 114),
               'officialOriginals': policy.get('officialOriginals'),
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
