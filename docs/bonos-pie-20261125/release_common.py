"""Read-only helpers for the isolated bonus-panel release; never handles secrets."""
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
STAGE = ROOT / '.vercel/bonos-pie-20261125/stage'
OUTPUT = STAGE / '.vercel/output'
SOURCE = ROOT / 'internal/bonos-pie'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
BRANCH = 'codex/bonos-pie-privado-20261125'
BASE = 'dpl_4tBq9YFz3BKoiXiJE5G5hBjPXMwW'
BASE_SOURCE = '3f02788b971c2691afbe5c21e269077f00c1ce14'
HOSTS = ['sollahms.cl', 'www.sollahms.cl']
FUNCTIONS = ['advisory', 'booking-availability', 'booking-create', 'collaboration',
             'contact', 'orientation-contact', 'uf', 'interno-bonos-pie']
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
ENV = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG',
            'VERCEL_LOG_LEVEL', 'VERCEL_AUTOMATION_BYPASS_SECRET', 'VERCEL_PROJECT_ID',
            'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID']:
    ENV.pop(key, None)
ENV['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
ENV['GIT_OPTIONAL_LOCKS'] = '0'


def require(value, message):
    if not value:
        raise RuntimeError(message)


def read(path):
    return json.loads(path.read_text())


def sha(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def git(*args):
    return subprocess.check_output(['/usr/bin/git', *args], cwd=ROOT, env=ENV, text=True).strip()


def api(endpoint):
    """Existing CLI authentication; GET only, complete raw JSON captured in memory."""
    require(endpoint.startswith(('/v4/aliases/', '/v6/deployments', '/v9/projects/', '/v13/deployments/')),
            'Endpoint outside the read-only release audit')
    require(not re.search(r'/(?:env|secrets)(?:/|\?|$)', endpoint) and
            'decrypt' not in endpoint.lower() and 'teamId=' not in endpoint,
            'Environment-value and unscoped endpoints are forbidden')
    scoped = endpoint + ('&' if '?' in endpoint else '?') + 'teamId=' + TEAM
    result = subprocess.run([NODE, CLI, 'api', scoped, '--method', 'GET', '--scope', SCOPE,
                             '--raw', '--non-interactive'], cwd=ROOT, env=ENV,
                            capture_output=True, timeout=60)
    require(result.returncode == 0, 'Authenticated GET failed: ' + endpoint.split('?')[0] + '; raw response omitted')
    try:
        return json.loads(result.stdout)
    except Exception as error:
        raise RuntimeError('Complete JSON response required; truncated/non-JSON output rejected') from error


def fetch_all(endpoints):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {name: pool.submit(api, endpoint) for name, endpoint in endpoints.items()}
        return {name: future.result() for name, future in futures.items()}


def selected_alias(value):
    return {key: value.get(key) for key in ['alias', 'projectId', 'redirect', 'redirectStatusCode', 'updatedAt']} | {
        'deploymentId': value.get('deploymentId') or (value.get('deployment') or {}).get('id')}


def settings(project):
    keys = ['id', 'name', 'accountId', 'live', 'ssoProtection', 'passwordProtection', 'trustedIps',
            'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'autoExposeSystemEnvs',
            'gitProviderOptions', 'buildCommand', 'outputDirectory', 'installCommand', 'rootDirectory',
            'framework', 'nodeVersion']
    return {key: project.get(key) for key in keys} | {
        'repository': {key: project.get('link', {}).get(key) for key in ['org', 'repo', 'productionBranch']}}


def environment_metadata(project):
    # Values, IDs, raw records and decrypted endpoints are never written or printed.
    rows = [{'name': row['key'], 'targets': sorted(row.get('target') or []), 'type': row.get('type')}
            for row in project.get('env', []) if isinstance(row, dict) and row.get('key')]
    return sorted(rows, key=lambda row: (row['name'], json.dumps(row['targets']), row['type'] or ''))


def normalize_env(rows):
    return sorted([{'name': row['name'], 'targets': sorted(row.get('targets') or []), 'type': row.get('type')}
                   for row in rows], key=lambda row: (row['name'], json.dumps(row['targets']), row['type'] or ''))


def validate_project(project):
    require(project.get('id') == PROJECT and project.get('accountId') == TEAM, 'Wrong project/team')
    require(project.get('ssoProtection', {}).get('deploymentType') == 'all_except_custom_domains', 'SSO protection changed')
    require(project.get('autoAssignCustomDomains') is False, 'Automatic production domain assignment must remain disabled')
    reference = read(DOCS / 'remote-baseline-proof.json')
    baseline_settings = reference['projectSettings']
    current = settings(project)
    # This historic snapshot is used only for preserved settings/environment names,
    # never as proof that its old aliases are still current.
    for key, expected in baseline_settings.items():
        if key == 'ssoProtection':
            require(expected.get('deploymentType') == current[key].get('deploymentType'), 'SSO changed')
        else:
            require(current.get(key) == expected, 'Existing project setting changed: ' + key)
    actual_env = environment_metadata(project)
    expected_env = normalize_env(reference['environmentMetadata'])
    require(actual_env == expected_env, 'Environment metadata differs from the frozen expected state')
    required = {'BONOS_ADMIN_EMAIL', 'BONOS_AUTH_SECRET', 'BONOS_STORE_ID', 'BLOB_READ_WRITE_TOKEN'}
    require(required.issubset({row['name'] for row in actual_env}), 'Bonus-panel environment configuration incomplete')
    for row in actual_env:
        if row['name'].startswith('BONOS_'):
            require(row['targets'] == ['production'], 'Bonus authentication must use the production configuration')
    return current, actual_env


def manifest_rows(manifest):
    rows = []
    for row in manifest['inventory']:
        path = row['path']
        require(path and not path.startswith('/') and '..' not in PurePosixPath(path).parts, 'Unsafe manifest path')
        require(isinstance(row['bytes'], int) and row['bytes'] >= 0 and
                re.fullmatch(r'[0-9a-f]{40}', row['sha1']) and re.fullmatch(r'[0-9a-f]{64}', row['sha256']),
                'Invalid source hashes')
        rows.append({key: row[key] for key in ['path', 'bytes', 'sha1', 'sha256']})
    require(len({row['path'] for row in rows}) == len(rows), 'Duplicate manifest path')
    canonical = ''.join(f"{row['path']}\t{row['bytes']}\t{row['sha256']}\n" for row in rows).encode()
    require(sha(canonical) == manifest['inventorySHA256'], 'Manifest inventory checksum mismatch')
    return rows


def local_candidate():
    baseline_manifest = read(DOCS / 'baseline-manifest.json')
    candidate_manifest = read(DOCS / 'candidate-manifest.json')
    require(baseline_manifest['deploymentId'] == candidate_manifest['baselineDeployment'] == BASE and
            baseline_manifest['sourceCommit'] == candidate_manifest['baselineCommit'] == BASE_SOURCE,
            'Candidate must preserve the current reconciled SEO baseline')
    baseline = manifest_rows(baseline_manifest)
    candidate = manifest_rows(candidate_manifest)
    require(len(baseline) == 1730 and len(candidate) == 1739, 'Unexpected baseline/candidate file count')
    expected = {row['path']: row for row in candidate}
    actual = {}
    for path in OUTPUT.rglob('*'):
        require(not path.is_symlink(), 'Artifact symlinks are forbidden')
        if path.is_file():
            body = path.read_bytes()
            relative = path.relative_to(OUTPUT).as_posix()
            actual[relative] = {'path': relative, 'bytes': len(body), 'sha1': sha(body, 'sha1'), 'sha256': sha(body)}
    require(actual == expected, 'Current artifact differs from the candidate manifest')
    previous = {row['path']: row for row in baseline}
    require(set(previous).issubset(expected), 'An existing production file was removed')
    modified = [path for path in previous if previous[path] != expected[path]]
    require(modified == ['config.json'], 'Only additive private routing may change an existing source file')
    added = sorted(set(expected) - set(previous))
    require(len(added) == 9 and all(path.startswith('functions/api/interno-bonos-pie.func/') for path in added),
            'New sources escaped the protected function')
    require(sum(path.startswith('functions/') for path in previous) == 57 and
            sum(path.startswith('functions/') for path in expected) == 66, 'Existing function bundles changed')
    config = read(OUTPUT / 'config.json')
    prior_config = read(DOCS / 'baseline-routes.json')
    require(config.get('version') == prior_config.get('version') == 3, 'Build Output API v3 required')
    expected_routes = [
        {'src': '^/bonos-pie/acceso/?$', 'dest': '/api/interno-bonos-pie?op=login'},
        {'src': '^/bonos-pie/?$', 'dest': '/api/interno-bonos-pie'},
        {'src': '^/interno/bonos-pie/acceso/?$', 'dest': '/api/interno-bonos-pie?op=login'},
        {'src': '^/interno/bonos-pie/?$', 'dest': '/api/interno-bonos-pie'},
    ]
    require(config['routes'][:len(expected_routes)] == expected_routes, 'Private route destinations differ')
    reconstructed = dict(config)
    reconstructed['routes'] = config['routes'][len(expected_routes):]
    require(reconstructed == prior_config, 'An original production route was modified')
    require(sha((DOCS / 'baseline-routes.json').read_bytes()) == previous['config.json']['sha256'],
            'Saved baseline routing file differs from the baseline source')
    for name in ['panel.html', 'panel.css', 'panel.js', 'login.html', 'login.css', 'login.js']:
        require((SOURCE / 'ui' / name).read_bytes() == (OUTPUT / 'functions/api/interno-bonos-pie.func/ui' / name).read_bytes(),
                'The staged UI differs from its reviewed source')
    require((SOURCE / 'inventory.json').read_bytes() ==
            (OUTPUT / 'functions/api/interno-bonos-pie.func/inventory.json').read_bytes(), 'Inventory source differs from stage')
    return baseline, candidate, candidate_manifest['inventorySHA256']


def source_pin():
    rows = []
    for path in SOURCE.rglob('*'):
        relative = path.relative_to(SOURCE)
        # Operational upload/release helpers are not part of the deployed runtime.
        # Pin all reviewed runtime/dependency inputs and synthetic tests explicitly.
        if ('node_modules' in path.parts or not path.is_file() or
                (relative.parts[0] not in {'ui', 'tests'} and relative.as_posix() not in
                 {'server.mjs', 'build.mjs', 'inventory.json', 'package.json', 'package-lock.json'})):
            continue
        body = path.read_bytes()
        rows.append({'path': path.relative_to(ROOT).as_posix(), 'bytes': len(body), 'sha256': sha(body)})
    return sorted(rows, key=lambda row: row['path'])


def validate_source_and_qa():
    snapshot = read(DOCS / 'runtime-verification.json')
    require(snapshot.get('passed') and snapshot.get('sourceFiles') == source_pin(),
            'Runtime changed since security verification; run the appropriate checks again')
    qa = read(DOCS / 'qa/results.json')
    require(qa.get('syntheticOnly') and len(qa.get('checks', [])) >= 10 and
            [row['width'] for row in qa['widths']] == [1440, 1024, 768, 390, 320], 'Responsive/function QA missing')
    require(all(row['body'] <= row['width'] for row in qa['widths']), 'Responsive page overflow detected')
    require(snapshot.get('securityTests', {}).get('passed') == 9 and
            snapshot.get('compiledSourceMatchesArtifact') is True, 'Security tests/compiled source verification missing')
    require(snapshot.get('candidateInventorySHA256') == read(DOCS / 'candidate-manifest.json')['inventorySHA256'],
            'Runtime verification belongs to a different candidate artifact')
    return snapshot, qa


def flatten(nodes, parent=''):
    require(isinstance(nodes, list), 'Complete native deployment file tree required')
    for node in nodes:
        name = node['name']
        require(name and not name.startswith('/') and '..' not in PurePosixPath(name).parts, 'Unsafe remote path')
        path = '/'.join(part for part in [parent, name] if part)
        if node['type'] == 'directory':
            require('children' in node, 'Truncated directory listing rejected')
            yield from flatten(node['children'], path)
        else:
            yield path, node


def remote_inventory(tree, rows, expected_functions):
    expected = {row['path']: row for row in rows}
    observed, lambdas, unexpected = {}, [], []
    for path, node in flatten(tree):
        if node['type'] == 'lambda' and path.startswith('out/api/'):
            lambdas.append(path)
        elif node['type'] == 'file' and path.startswith('src/.vercel/output/'):
            relative = path[len('src/.vercel/output/'):]
            require(relative not in observed, 'Duplicate remote source path')
            observed[relative] = node
        else:
            unexpected.append(path)
    comparisons = [{'path': path, 'bytes': row['bytes'], 'sourceSha256': row['sha256'],
                    'expectedSha1': row['sha1'], 'remoteUid': (observed.get(path) or {}).get('uid'),
                    'remoteBytes': (observed.get(path) or {}).get('size'),
                    'passed': (observed.get(path) or {}).get('uid') == row['sha1'] and
                    ((observed.get(path) or {}).get('size') is None or (observed.get(path) or {}).get('size') == row['bytes'])}
                   for path, row in sorted(expected.items())]
    missing, extra = sorted(set(expected) - set(observed)), sorted(set(observed) - set(expected))
    require(not missing and not extra and not unexpected and all(row['passed'] for row in comparisons),
            'Complete remote source inventory/content-address comparison failed')
    require(sorted(lambdas) == sorted('out/api/' + name for name in expected_functions), 'Registered function set differs')
    summary = {'expected': len(expected), 'matched': len(comparisons), 'missing': missing, 'extra': extra,
               'differentUID': [row['path'] for row in comparisons if not row['passed']],
               'functionFiles': sum(path.startswith('functions/') for path in expected),
               'functionBundles': len(lambdas), 'configurationMatched': True,
               'sourceUIDAlgorithm': 'SHA1 of the complete uploaded source; local SHA256/bytes certified by manifest'}
    return summary, comparisons


def selected_deployment(value):
    return {'id': value.get('id') or value.get('uid'),
            **{key: value.get(key) for key in ['url', 'readyState', 'state', 'target', 'source',
                                              'createdAt', 'ready', 'prebuilt', 'projectId', 'ownerId']},
            'meta': {key: value.get('meta', {}).get(key) for key in ['githubCommitSha', 'githubCommitRef',
                     'githubOrg', 'githubRepo', 'candidateInventorySHA256', 'baselineDeployment']}}
