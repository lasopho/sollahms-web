#!/usr/bin/env python3
"""Record an offline Git/Production declaration comparison; never build or deploy.

Vercel metadata is a declaration, not proof of the deployed bytes. This command
does not access the network, providers, credentials, private packages or APIs.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess


GUARDS = (
    'vercel.json', 'scripts/package-vercel.mjs', 'scripts/prepare-release.py',
    'docs/release-reference.json', '.github/workflows/git-checkout-regression.yml',
)
CATALOGUE = 'data/proyectos.json'
SHA = re.compile(r'^[0-9a-f]{40}$')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git(root, *arguments):
    return subprocess.check_output(['git', '--no-pager', *arguments], cwd=root, stderr=subprocess.PIPE)


def commit(root, value):
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise ValueError('A full 40-character lowercase commit SHA is required')
    actual = git(root, 'rev-parse', '--verify', '--end-of-options', value + '^{commit}').decode().strip()
    if actual != value:
        raise ValueError('Commit identity mismatch')
    return actual


def validate_metadata(metadata):
    if not isinstance(metadata, dict) or metadata.get('schemaVersion') != 1:
        raise ValueError('Unsupported metadata schema')
    try:
        observed = datetime.fromisoformat(metadata['observedAt'].replace('Z', '+00:00'))
        if observed.utcoffset() is None:
            raise ValueError('Observation time must include a timezone')
        alias, deployment = metadata['alias'], metadata['deployment']
        if alias['hostname'] != 'sollahms.cl' or deployment['repository'] != 'lasopho/sollahms-web':
            raise ValueError('Unexpected alias or repository')
        for alias_key, deployment_key in [('deploymentId', 'id'), ('projectId', 'projectId'), ('url', 'url')]:
            if not alias[alias_key] or alias[alias_key] != deployment[deployment_key]:
                raise ValueError('Alias/deployment metadata mismatch: ' + alias_key)
        if deployment['target'] != 'production' or deployment['readyState'] != 'READY':
            raise ValueError('Metadata does not describe a READY Production deployment')
        for value in [deployment['declaredCommitSha'], metadata['remoteMain']['sha']]:
            if not isinstance(value, str) or not SHA.fullmatch(value):
                raise ValueError('A full commit SHA is required in metadata')
        if not isinstance(metadata['remoteMain']['protected'], bool):
            raise ValueError('Remote main protection must be an observed boolean')
        if not all(isinstance(deployment[key], str) and deployment[key] for key in ['source', 'declaredCommitRef']):
            raise ValueError('Missing deployment source or declared ref')
    except (KeyError, TypeError, AttributeError) as error:
        raise ValueError('Incomplete metadata') from error
    # Copy only operational identities, never arbitrary provider responses/secrets.
    return {
        'observedAt': metadata['observedAt'],
        'alias': {key: alias[key] for key in ['hostname', 'deploymentId', 'projectId', 'url']},
        'deployment': {key: deployment[key] for key in [
            'id', 'projectId', 'url', 'target', 'readyState', 'source',
            'repository', 'declaredCommitSha', 'declaredCommitRef']},
        'remoteMain': {'sha': metadata['remoteMain']['sha'], 'protected': metadata['remoteMain'].get('protected')},
    }


def output_outside_repository(root, output):
    root, output = root.resolve(), output.resolve()
    common = Path(git(root, 'rev-parse', '--git-common-dir').decode().strip())
    common = (root / common).resolve() if not common.is_absolute() else common.resolve()
    if any(output == boundary or output.is_relative_to(boundary) for boundary in [root, common]):
        raise ValueError('Output must be outside the checkout and Git directory')
    if output.exists():
        raise ValueError('Output must be a new directory; existing evidence is preserved')
    # Reject a sibling/parent inside any other linked checkout as well.
    worktrees = git(root, 'worktree', 'list', '--porcelain', '-z').split(b'\0')
    for entry in worktrees:
        if entry.startswith(b'worktree '):
            boundary = Path(entry[len(b'worktree '):].decode()).resolve()
            if output == boundary or output.is_relative_to(boundary):
                raise ValueError('Output must be outside every linked checkout')
    return output


def manifest(root, revision):
    """Hash immutable Git blobs without executing or extracting repository code."""
    entries, retained, cache = {}, {}, {}
    rows = git(root, 'ls-tree', '-r', '-z', '--full-tree', revision).split(b'\0')
    with subprocess.Popen(['git', 'cat-file', '--batch'], cwd=root, stdin=subprocess.PIPE,
                          stdout=subprocess.PIPE) as reader:
        for row in filter(None, rows):
            identity, name = row.split(b'\t', 1)
            mode, kind, oid = identity.decode().split()
            path = name.decode('utf-8')
            if kind != 'blob':
                raise ValueError('Unsupported Git tree entry: ' + path)
            if oid not in cache:
                reader.stdin.write(oid.encode() + b'\n')
                reader.stdin.flush()
                header = reader.stdout.readline().decode().strip().split()
                if len(header) != 3 or header[:2] != [oid, 'blob']:
                    raise ValueError('Cannot read expected Git blob')
                remaining, hasher, chunks = int(header[2]), hashlib.sha256(), []
                keep = path == CATALOGUE
                size = remaining
                while remaining:
                    chunk = reader.stdout.read(min(remaining, 1024 * 1024))
                    if not chunk:
                        raise ValueError('Incomplete Git blob')
                    hasher.update(chunk)
                    if keep:
                        chunks.append(chunk)
                    remaining -= len(chunk)
                if reader.stdout.read(1) != b'\n':
                    raise ValueError('Invalid Git blob separator')
                cache[oid] = {'gitBlob': oid, 'sha256': hasher.hexdigest(), 'bytes': size}
                if keep:
                    retained[path] = b''.join(chunks)
            elif path == CATALOGUE:
                retained[path] = git(root, 'show', revision + ':' + path)
            entries[path] = {**cache[oid], 'mode': mode}
        reader.stdin.close()
        if reader.wait() != 0:
            raise ValueError('Git blob reader failed')
    catalogue = json.loads(retained[CATALOGUE])
    if not isinstance(catalogue, list):
        raise ValueError('Expected a catalogue array')
    slugs = [project['slug'] for project in catalogue]
    if len(slugs) != len(set(slugs)):
        raise ValueError('Duplicate catalogue identity')
    return {'commit': revision, 'tree': git(root, 'rev-parse', revision + '^{tree}').decode().strip(),
            'catalogueCount': len(slugs), 'catalogueSlugs': sorted(slugs), 'files': entries}


def create_receipt(root, base, metadata, metadata_bytes):
    observation = validate_metadata(metadata)
    base = commit(root, base)
    declared = commit(root, observation['deployment']['declaredCommitSha'])
    baseline, source = manifest(root, base), manifest(root, declared)
    differences = []
    for path in sorted(set(baseline['files']) | set(source['files'])):
        before, after = source['files'].get(path), baseline['files'].get(path)
        if before != after:
            differences.append({'path': path, 'declaredGitSource': before, 'baseGitSource': after})
    guards = []
    for path in GUARDS:
        tracked = baseline['files'].get(path)
        working = root / path
        current = digest(working.read_bytes()) if working.is_file() and not working.is_symlink() else None
        guards.append({'path': path, 'baseSha256': tracked['sha256'] if tracked else None,
                       'workingSha256': current, 'unchangedFromBase': tracked is not None and current == tracked['sha256']})
    gate_path = root / 'vercel.json'
    gate = json.loads(gate_path.read_text()) if not gate_path.is_symlink() else {}
    receipt = {
        'schemaVersion': 1, 'scope': 'OPS-01-offline-Git-declaration-comparison',
        'generatedAt': datetime.now(timezone.utc).isoformat(), 'observation': observation,
        'metadataSha256': digest(metadata_bytes), 'baseCommit': base, 'declaredProductionCommit': declared,
        'remoteMainMatchesBase': observation['remoteMain']['sha'] == base,
        'declaredGitCatalogueCount': source['catalogueCount'], 'baseGitCatalogueCount': baseline['catalogueCount'],
        'gitFilesDifferent': len(differences),
        'differenceCounting': 'Git paths without rename detection; a rename has an old and a new path',
        'differences': differences, 'publicationGuards': guards,
        'workingMainGitDeploymentDisabled': gate.get('git', {}).get('deploymentEnabled', {}).get('main') is False,
        'artifactBytesVerified': False, 'httpBytesFetched': 0, 'packageBuilt': False,
        'deploymentsCreated': 0, 'providerWrites': 0,
        'status': 'BLOCKED-deployed-bytes-and-authorized-private-package-required',
        'limitations': [
            'Hashes describe Git blobs, not the bytes served by Vercel or a private release package.',
            'Metadata is supplied read-only evidence; this command cannot authenticate its source or freshness.',
            'Equal Git files or unchanged guards do not authorize a push, merge, Preview or Production.',
            'OPS-02 remains external until rules are applied administratively and effective rules are re-read.',
        ],
    }
    return receipt, baseline, source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--base', required=True, help='Full approved Git base SHA')
    parser.add_argument('--metadata', required=True, type=Path, help='Read-only observation JSON described in docs/p1-operaciones.md')
    parser.add_argument('--output', required=True, type=Path, help='New evidence directory outside every linked checkout')
    args = parser.parse_args()
    try:
        root = args.root.resolve()
        output = output_outside_repository(root, args.output)
        metadata_bytes = args.metadata.read_bytes()
        receipt, baseline, source = create_receipt(root, args.base, json.loads(metadata_bytes), metadata_bytes)
        output.mkdir(parents=True, exist_ok=False)
        for name, value in [('receipt.json', receipt), ('base-git-manifest.json', baseline), ('declared-source-git-manifest.json', source)]:
            (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({key: receipt[key] for key in ['status', 'baseCommit', 'declaredProductionCommit', 'gitFilesDifferent', 'artifactBytesVerified']}))
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        parser.exit(2, str(error) + '\n')


if __name__ == '__main__':
    main()
