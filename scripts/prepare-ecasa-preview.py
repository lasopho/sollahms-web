#!/usr/bin/env python3
"""Pin a PRIVATE protected-review reference to a committed source bundle.

Verifies the archive, exact Git bytes, private derivative allowlist and local
builds. Writes a Preview-only API request template; never uploads, deploys,
merges, aliases, changes access controls or authorizes public Ecasa use.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_FOLDERS = {'brochures-aj-urbana.json': 'aj-urbana-preview',
                    'brochures-ingevec.json': 'ingevec-preview', 'brochures-ecasa.json': 'ecasa-preview'}
ECASA_PROJECTS = {'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
    'terratolten', 'wayra', 'enlace-mackenna', 'espacio-victoria', 'lamara',
    'cumbres-de-penuelas', 'aires-la-florida-2', 'conecta-huechuraba',
    'urban-la-florida', 'alto-san-joaquin', 'nucleo-costanera'}
ECASA_PROJECT_BY_COMMERCIAL_SLUG = {slug: slug for slug in ECASA_PROJECTS if slug != 'terratolten'}
ECASA_PROJECT_BY_COMMERCIAL_SLUG.update({
    'terratolten-1': 'terratolten', 'terratolten-2': 'terratolten', 'terratolten-3': 'terratolten',
    'lomas-de-puyai-3': 'lomas-de-puyai', 'ferroparque-2': 'ferroparque',
    'alto-san-joaquin-2': 'alto-san-joaquin', 'alto-san-joaquin-3': 'alto-san-joaquin',
    'nucleo-costanera-2': 'nucleo-costanera'})
spec = importlib.util.spec_from_file_location('release_preparation', ROOT / 'scripts/prepare-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def make_reference(metadata, platform, files, commit):
    release.require(metadata.get('target') == 'preview' and
                    metadata.get('contentProfile') == 'protected_ecasa_review', 'A protected Preview bundle is required')
    release.require(metadata.get('reviewCommit') == commit, 'Bundle review commit differs from current HEAD')
    release.require(metadata.get('branch') == 'codex/ecasa-cartera-definitiva', 'Unexpected protected Ecasa review branch')
    release.require(metadata.get('catalogueProjects') == 136 and metadata.get('ecasaProjects') == 15 and
                    metadata.get('ecasaCommercialEntries') == 22 and metadata.get('ecasaLegacyRoutes') == 8,
                    'Incorrect Ecasa catalogue composition')
    tools = metadata.get('verificationTools', [])
    release.require(isinstance(tools, list) and len(tools) == 3 and
                    {tool.get('file') for tool in tools} == release.VERIFICATION_TOOLS,
                    'The three private QA tools must be pinned in the review receipt')
    tracked_names = set(release.git(ROOT, 'ls-tree', '-rz', '--name-only', commit).decode().split('\0'))
    tracked = sum(name in tracked_names for name in files)
    return {'schemaVersion': 1, 'contentProfile': 'protected_ecasa_review',
            'approvedAppCommit': commit, 'preparedCommitForReview': commit,
            'developmentBranch': metadata['branch'],
            **{key: platform[key] for key in ['projectId', 'teamId', 'teamSlug', 'projectName', 'productionOrigin']},
            'archiveSha256': metadata['archive']['sha256'], 'archiveBytes': metadata['archive']['size'],
            'sourceFiles': metadata['sourceFileCount'], 'sourceBytes': metadata['sourceBytes'],
            'trackedSourceFiles': tracked, 'privateSourceFiles': len(files) - tracked,
            'privateMediaFolders': ['ingevec-preview', 'ecasa-preview'],
            'catalogueProjects': 136, 'ecasaProjects': 15, 'ecasaCommercialEntries': 22,
            'ecasaLegacyRoutes': 8, 'ingevecProjects': 16,
            'htmlPages': 143, 'selectedBrochureMedia': len(metadata['selectedBrochureMedia']),
            'preservedBrochureMedia': 269, 'ingevecReviewMedia': 165,
            'ecasaPublicWebRights': 'pending_contract_scope_verification',
            'verificationTools': tools,
            'publicationAuthorized': False, 'integrationAuthorized': False}


def preview_request(policy, metadata):
    # Vercel expands native source archive chunks before the build command.
    # The platform receipt must still confirm READY, the team/project/commit,
    # Preview environment and enabled Vercel Authentication after dispatch.
    return {'teamId': policy['teamId'], 'requestBody': {
        'name': policy['projectName'], 'project': policy['projectId'], 'target': 'preview',
        'files': [{'file': chunk['file'], 'sha': chunk['sha'], 'size': chunk['size']}
                  for chunk in metadata['chunks']],
        'gitMetadata': {'commitRef': policy['developmentBranch'],
                        'commitSha': policy['preparedCommitForReview'], 'dirty': False},
        'meta': {'githubCommitRef': policy['developmentBranch'],
                 'githubCommitSha': policy['preparedCommitForReview'],
                 'privateSourceArchiveSha256': policy['archiveSha256'],
                 'sollahmsContentProfile': 'protected_ecasa_review'},
        'projectSettings': {'framework': None, 'buildCommand': 'node scripts/package-vercel.mjs',
                            'outputDirectory': 'dist', 'nodeVersion': '24.x'}}}


def manifest_media(manifests):
    selected = {}
    for name, folder in MANIFEST_FOLDERS.items():
        for record in manifests[name]['projects']:
            for asset in [*record['images'], *(model['plan'] for model in record['models'])]:
                origin = asset.get('originCommercialSlug') if folder == 'ecasa-preview' else record['slug']
                if folder == 'ecasa-preview':
                    release.require(origin in record.get('commercialSourceSlugs', []) and
                                    ECASA_PROJECT_BY_COMMERCIAL_SLUG.get(origin) == record['slug'],
                                    'Selected media belongs to another project directory')
                prefix = 'assets/propiedades/' + folder + '/' + str(origin) + '/'
                path = asset['localPath'].lstrip('/')
                release.require(path.startswith(prefix) and path.count('/') == prefix.count('/'),
                                'Selected media belongs to another project directory')
                release.require(path not in selected, 'Duplicate selected media path')
                selected[path] = asset['sha256']
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle-directory', required=True, type=Path)
    parser.add_argument('--platform-reference', type=Path, default=ROOT / 'docs/release-reference.json',
                        help='Read only the verified project/team identities; never changes this historical reference')
    parser.add_argument('--output-directory', type=Path,
                        help='Fresh private directory for verified source, offline builds and receipts')
    parser.add_argument('--node', required=True)
    args = parser.parse_args()
    bundle = args.bundle_directory.expanduser().resolve()
    release.require(bundle != ROOT and ROOT not in bundle.parents, 'Private bundle must remain outside source')
    metadata = json.loads((bundle / 'metadata.json').read_text())
    platform = json.loads(args.platform_reference.read_text())
    commit = release.git(ROOT, 'rev-parse', 'HEAD').decode().strip()
    archive = bundle / 'source.tgz'
    initial_policy = {'archiveBytes': metadata['archive']['size'], 'archiveSha256': metadata['archive']['sha256'],
                      'sourceFiles': metadata['sourceFileCount'], 'sourceBytes': metadata['sourceBytes']}
    files = release.verify_archive(archive, initial_policy)
    reference = make_reference(metadata, platform, files, commit)
    release.verify_git_reference(ROOT, files, reference)
    release.verify_worktree(ROOT, files, reference)
    release.verify_verification_tools(ROOT, reference)
    # No original documents or credentials are needed to restore the selected
    # media. Manifest hashes are checked again by the staged local builds.
    selected_inventory = {item['path'].lstrip('/'): item['sha256'] for item in metadata['selectedBrochureMedia']}
    release.require(len(selected_inventory) == len(metadata['selectedBrochureMedia']), 'Duplicate brochure media receipt')
    with tarfile.open(archive, 'r:gz') as source_archive:
        manifests = {name: json.loads(source_archive.extractfile('data/' + name).read()) for name in MANIFEST_FOLDERS}
    expected_media = manifest_media(manifests)
    release.require(selected_inventory == expected_media, 'Brochure receipt differs from the exact manifest selection')
    archived_derivatives = {name for name in files if any(name.startswith('assets/propiedades/' + folder + '/')
                                                        for folder in MANIFEST_FOLDERS.values())}
    release.require(archived_derivatives == expected_media.keys(), 'Unselected derivative or omitted resource in source archive')
    release.require(all(files.get(name, {}).get('sha256') == digest for name, digest in selected_inventory.items()),
                    'Selected brochure media differs from source archive')
    transport_digest = hashlib.sha256()
    for index, chunk in enumerate(metadata['chunks'], 1):
        release.require(chunk['file'] == '.vercel/source.tgz.part' + str(index), 'Unexpected archive transport path')
        chunk_path = bundle / Path(chunk['file']).name
        release.require(chunk_path.is_file() and not chunk_path.is_symlink(), 'Missing or symbolic source archive chunk')
        data = chunk_path.read_bytes()
        release.require(chunk_path.stat().st_size == chunk['size'] and
                        release.digest(data) == chunk['sha256'] and
                        hashlib.sha1(data).hexdigest() == chunk['sha'], 'Source archive chunk differs from receipt')
        transport_digest.update(data)
    release.require(transport_digest.hexdigest() == reference['archiveSha256'], 'Chunks do not reconstruct the exact source archive')
    for name, content in [('review-reference.json', reference), ('preview-deployment-request.json', preview_request(reference, metadata))]:
        path = bundle / name
        release.require(not path.exists(), 'Review output already exists: ' + name)
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
        os.chmod(path, 0o600)
    preparation = None
    if args.output_directory:
        preparation = release.prepare(archive, args.output_directory, str(Path(args.node).resolve()), reference, protected_review=True)
    print(json.dumps({'preparedCommitForReview': commit, 'privateReference': str(bundle / 'review-reference.json'),
                      'previewRequestTemplate': str(bundle / 'preview-deployment-request.json'),
                      'localPreparation': preparation, 'networkUsed': False, 'deploymentPerformed': False,
                      'productionPublicationAuthorized': False}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, AssertionError, OSError, subprocess.CalledProcessError, tarfile.TarError,
            KeyError, json.JSONDecodeError) as error:
        print(json.dumps({'preparationPassed': False, 'error': str(error), 'deploymentPerformed': False}), file=sys.stderr)
        sys.exit(1)
