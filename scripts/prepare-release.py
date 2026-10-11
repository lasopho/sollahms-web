#!/usr/bin/env python3
"""Verify and prepare a private release locally. Never deploys or changes Git.

The approved archive is immutable. These operational tools are not included
in it. No credentials, original documents or audit receipts enter source/.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'docs/release-reference.json'
EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.svg', '.webp',
              '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.txt', '.xml'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name):
    parts = PurePosixPath(name).parts
    require(bool(parts) and not name.startswith('/') and '\\' not in name and
            all(part not in {'.', '..'} and not part.startswith('.') for part in parts) and
            str(PurePosixPath(name)) == name, 'Unsafe archive path')
    require(PurePosixPath(name).suffix.lower() in EXTENSIONS, 'Private or unexpected file type')
    require(not any(part in {'docs', 'tests', 'contracts', 'node_modules',
                             'brochure-candidates', 'inventarios', 'originals'} for part in parts),
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
    files, total = {}, 0
    with tarfile.open(archive, 'r:gz') as bundle:
        for member in bundle:
            name = safe_name(member.name)
            require(member.isfile() and not member.issym() and not member.islnk(), 'Nonregular archive member')
            require(name not in files, 'Duplicate archive member')
            require(0 <= member.size <= policy['sourceBytes'] - total, 'Archive exceeds approved uncompressed size')
            require(len(files) < policy['sourceFiles'], 'Archive exceeds approved file count')
            data = bundle.extractfile(member).read()
            require(len(data) == member.size, 'Truncated archive member')
            files[name] = {'size': len(data), 'sha256': digest(data),
                           'gitBlob': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()}
            total += len(data)
    require(len(files) == policy['sourceFiles'] and total == policy['sourceBytes'], 'Incomplete source archive')
    return files


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)


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
    tracked = 0
    for name, info in files.items():
        if name in tree:
            mode, kind, oid = tree[name]
            require(kind == 'blob' and mode in {'100644', '100755'} and oid == info['gitBlob'],
                    'Source differs from approved Git commit: ' + name)
            tracked += 1
        else:
            require(name.startswith('assets/propiedades/ingevec-preview/'), 'Unapproved non-Git source file: ' + name)
    require(tracked == policy['trackedSourceFiles'] and len(files) - tracked == policy['privateSourceFiles'],
            'Tracked/private source inventory differs from approval')
    return tracked


def verify_worktree(root, files, policy):
    # Recovery from archive + a clean Git clone must not depend on local
    # ignored Ingevec files. Their exact approved bytes are verified in tar.
    tracked = set(git(root, 'ls-tree', '-rz', '--name-only', policy['approvedAppCommit']).decode().split('\0'))
    relevant = ['assets', 'api', 'lib', 'data/proyectos.json', 'data/hipotecario.json',
                'data/brochures-aj-urbana.json', 'data/brochures-ingevec.json',
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
            name = safe_name(member.name)
            require(member.isfile() and name in files and name not in seen, 'Archive changed after verification')
            seen.add(name)
            data = bundle.extractfile(member).read()
            require(digest(data) == files[name]['sha256'], 'Archive changed after verification')
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    require(seen == files.keys(), 'Archive changed after verification')


def build(source, node, environment, branch):
    # Local packaging requires no provider credentials or environment download.
    env = {'PATH': str(Path(node).parent) + os.pathsep + os.defpath,
           'VERCEL_ENV': environment, 'VERCEL_GIT_COMMIT_REF': branch,
           'SOLLAHMS_BROCHURE_PROFILE': 'public-web'}
    result = subprocess.run([node, str(source / 'scripts/package-vercel.mjs')],
                            cwd=source, env=env, check=True, capture_output=True, text=True)
    return json.loads(result.stdout.strip())


def verify_staged_deployment(snapshot, policy):
    """Validate a SANITIZED real platform receipt; never calls Vercel.

    Presence of these fields is required, not guessed from omitted API fields.
    The operator records runtime/build evidence after authorized staging.
    """
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


def prepare(archive, output, node, policy):
    files = verify_archive(archive, policy)
    tracked = verify_git_reference(ROOT, files, policy)
    verify_worktree(ROOT, files, policy)
    destination = outside_source(output, ROOT)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.mkdir(mode=0o700)
    source = destination / 'source'
    extract_verified(archive, source, files)
    public, preview = destination / 'production-local', destination / 'preview-local'
    shutil.copytree(source, public)
    shutil.copytree(source, preview)
    public_result = build(public, node, 'production', 'main')
    preview_result = build(preview, node, 'preview', policy['developmentBranch'])
    for result in (public_result, preview_result):
        require(result['pages'] == policy['htmlPages'] and
                result['selectedBrochureMedia'] == policy['selectedBrochureMedia'] and
                result['ingevecReviewMedia'] == policy['privateSourceFiles'] and
                result['contractualCoverageVerified'] is True, 'Build omitted approved source content')
    require(public_result['environment'] == 'production' and not public_result['noindex'] and
            preview_result['environment'] == 'preview' and preview_result['noindex'], 'Build environment mismatch')
    audit_path = destination / 'public-preview-audit.json'
    subprocess.run([sys.executable, str(ROOT / 'tests/audit_public_build.py'), '--source', str(source),
                    '--public', str(public / 'dist'), '--preview', str(preview / 'dist'),
                    '--receipt', str(audit_path)], check=True, capture_output=True, text=True)
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
    args = parser.parse_args()
    policy = json.loads(args.reference.read_text())
    require(policy['schemaVersion'] == 1, 'Unknown release reference version')
    if args.staged_receipt:
        require(not args.archive and not args.output_directory, 'Select one operation')
        identifier = verify_staged_deployment(json.loads(args.staged_receipt.read_text()), policy)
        print(json.dumps({'deploymentId': identifier, 'stagedReceiptPassed': True, 'promoted': False}))
    else:
        require(args.archive and args.output_directory and args.node, 'Archive, private output and Node are required')
        print(json.dumps(prepare(args.archive.expanduser().absolute(), args.output_directory,
                                 str(Path(args.node).resolve()), policy)))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, AssertionError, OSError, subprocess.CalledProcessError, tarfile.TarError,
            KeyError, json.JSONDecodeError) as error:
        # Do not print subprocess output: it may contain unrelated environment data.
        print(json.dumps({'localPreparationPassed': False, 'error': str(error),
                          'deploymentPerformed': False}), file=sys.stderr)
        sys.exit(1)
