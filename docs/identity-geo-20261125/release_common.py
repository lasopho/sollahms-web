"""Read-only release evidence. Never retrieves secret values or performs mutations."""
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from urllib.parse import parse_qsl, urlencode, urlsplit

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
PRIVATE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-identity-geo-20261125')
OUTPUT = PRIVATE / 'candidate/.vercel/output'
BASE = 'dpl_9M5yUF3GzFK2aWy34Qn4en7y8tA7'
BASE_SOURCE = '2327ed4324b0d56af04d9f6db8f50b4f54ca33b4'
BASE_PIN = '001fdacf9410338353d7a5867231b599aff89592e1eeb7e8c29f5055f6d1e1f3'
EXPECTED_FILES = 1741
EXPECTED_FUNCTION_FILES = 68
ALLOWED_STATIC = ['static/agenda-asesoria.html', 'static/contacto.html', 'static/index.html', 'static/sitemap.xml']
BASE_CONFIG = 'e1cba5f87d73032fd8b31545a03d7cafd129801566213304764c49f493bb5089'
BASE_MANIFEST = ROOT / 'docs/payment-plans-20261125/candidate-manifest.json'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
BRANCH = 'codex/seo-geo-20261125'
HOSTS = ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app',
         'project-wrapp-lsandoval2-8260s-projects.vercel.app']
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
    return json.loads(Path(path).read_text())


def sha(body, algorithm='sha256'):
    return hashlib.new(algorithm, body).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def save(name, value):
    path = DOCS / name
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def api(endpoint):
    """Only fixed scoped GET metadata/file-index endpoints. Raw JSON stays in memory."""
    split = urlsplit(endpoint)
    require(not split.scheme and not split.netloc and not split.fragment, 'Relative API endpoint required')
    allowed = [r'/v4/aliases', r'/v4/aliases/[A-Za-z0-9.-]+', r'/v7/deployments',
               r'/v9/projects/' + PROJECT, r'/v9/projects/' + PROJECT + r'/domains',
               r'/v13/deployments/dpl_[A-Za-z0-9]+',
               r'/v6/deployments/dpl_[A-Za-z0-9]+/files', r'/v2/teams/' + TEAM]
    require(any(re.fullmatch(pattern, split.path) for pattern in allowed), 'Endpoint outside the read-only audit')
    query = parse_qsl(split.query, keep_blank_values=True)
    require(all(k in {'projectId', 'limit', 'rollbackInfo', 'until', 'sha', 'target'} for k, _ in query), 'Query outside metadata audit')
    require(all(v == PROJECT for k, v in query if k == 'projectId'), 'Project filter differs')
    require(all(v == 'true' for k, v in query if k == 'rollbackInfo'), 'Invalid rollback metadata query')
    require(all(v == '100' for k, v in query if k == 'limit'), 'Unexpected pagination limit')
    require(all(re.fullmatch(r'[0-9]{1,16}', v) for k, v in query if k == 'until'), 'Unsafe pagination cursor')
    require(all(v == BASE_SOURCE for k, v in query if k == 'sha'), 'Unexpected deployment source filter')
    require(all(v == 'production' for k, v in query if k == 'target'), 'Unexpected environment filter')
    scoped = split.path + '?' + urlencode(query + [('teamId', TEAM)])
    p = subprocess.run([NODE, CLI, 'api', scoped, '--method', 'GET', '--scope', SCOPE,
                        '--raw', '--non-interactive'], cwd=ROOT, env=ENV,
                       capture_output=True, timeout=60)
    if p.returncode:
        # Neither authentication payloads nor provider responses are emitted.
        error = p.stderr.decode(errors='replace').lower()
        category = ('network-resolution' if any(t in error for t in ['enotfound', 'eai_again', 'getaddrinfo'])
                    else 'authentication-or-network')
        raise RuntimeError('Authenticated GET failed: ' + split.path + '; category=' + category)
    try:
        return json.loads(p.stdout)
    except Exception as error:
        raise RuntimeError('Complete JSON response required; raw output omitted') from error


def fetch_all(endpoints):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {name: pool.submit(api, endpoint) for name, endpoint in endpoints.items()}
        return {name: future.result() for name, future in jobs.items()}


def selected_alias(value):
    return {key: value.get(key) for key in ['alias', 'projectId', 'redirect', 'redirectStatusCode',
                                           'updatedAt', 'createdAt']} | {
        'deploymentId': value.get('deploymentId') or (value.get('deployment') or {}).get('id')}


def selected_deployment(value):
    return {'id': value.get('id') or value.get('uid'),
            **{key: value.get(key) for key in ['url', 'readyState', 'target', 'source', 'createdAt',
                                              'ready', 'prebuilt', 'projectId', 'ownerId',
                                              'productionUrl', 'isRollbackCandidate']},
            'meta': {key: value.get('meta', {}).get(key) for key in
                     ['githubCommitSha', 'githubCommitRef', 'githubOrg', 'githubRepo',
                      'candidateInventorySHA256', 'baselineDeployment']}}


def project_settings(project):
    keys = ['id', 'name', 'accountId', 'live', 'ssoProtection', 'autoAssignCustomDomains',
            'previewDeploymentsDisabled', 'autoExposeSystemEnvs', 'gitProviderOptions',
            'buildCommand', 'outputDirectory', 'installCommand', 'rootDirectory', 'framework', 'nodeVersion']
    return {key: project.get(key) for key in keys} | {
        'repository': {key: project.get('link', {}).get(key) for key in ['org', 'repo', 'productionBranch']},
        'passwordProtectionConfigured': project.get('passwordProtection') is not None,
        'trustedIpsConfigured': project.get('trustedIps') is not None}


def environment_metadata(project):
    # Do not select, decrypt, write, or print values, IDs, or raw environment records.
    rows = [{'name': row['key'], 'targets': sorted(row.get('target') or []), 'type': row.get('type')}
            for row in project.get('env', []) if isinstance(row, dict) and row.get('key')]
    return sorted(rows, key=lambda row: (row['name'], json.dumps(row['targets']), row['type'] or ''))


def validate_project(project):
    selected = project_settings(project)
    require(selected['id'] == PROJECT and selected['accountId'] == TEAM and selected['name'] == 'project-wrapp',
            'Wrong project/team')
    require(selected['ssoProtection'] == {'deploymentType': 'all_except_custom_domains'}, 'SSO configuration changed')
    require(selected['autoAssignCustomDomains'] is False, 'Automatic domain assignment must remain disabled')
    require(selected['repository'] == {'org': 'lasopho', 'repo': 'sollahms-web', 'productionBranch': 'main'},
            'Repository binding changed')
    enabled = read(ROOT / 'vercel.json')['git']['deploymentEnabled']
    require(enabled.get(BRANCH) is False, 'Existing branch automatic-deployment guard must remain false')
    return selected, environment_metadata(project)


def aliases_for(data):
    rows = [selected_alias(data[host]) for host in HOSTS]
    require(all(row['projectId'] == PROJECT and row['alias'] == host for row, host in zip(rows, HOSTS)),
            'An alias belongs to another project')
    for row in rows:
        redirect = 'sollahms.cl' if row['alias'] in ['www.sollahms.cl', 'sollhams.cl'] else None
        require(row['redirect'] == redirect and row['redirectStatusCode'] == (308 if redirect else None),
                'An existing redirect changed')
        require(isinstance(row['createdAt'], int), 'Alias creation metadata missing')
    return rows


def alias_configuration(rows):
    return [{key: row[key] for key in ['alias', 'projectId', 'redirect', 'redirectStatusCode', 'createdAt']}
            for row in rows]


def complete_alias_listing(first):
    """Read all metadata pages; never persist raw aliases or provider responses."""
    names, cursors, pages = set(), set(), 0
    current = first
    while True:
        rows = current.get('aliases')
        require(isinstance(rows, list), 'Complete alias listing required')
        for row in rows:
            require(row.get('projectId') in [None, PROJECT], 'Alias listing project filter failed')
            if isinstance(row.get('alias'), str):
                names.add(row['alias'])
        pages += 1
        cursor = (current.get('pagination') or {}).get('next')
        if cursor is None:
            return names, pages
        require(pages < 20 and str(cursor) not in cursors, 'Alias pagination exceeded safe audit bounds')
        cursors.add(str(cursor))
        current = api('/v4/aliases?projectId=' + PROJECT + '&limit=100&until=' + str(cursor))


def manifest_rows(manifest):
    rows = []
    for row in manifest['inventory']:
        path = row['path']
        require(path and not path.startswith('/') and '..' not in PurePosixPath(path).parts, 'Unsafe manifest path')
        require(isinstance(row['bytes'], int) and row['bytes'] >= 0 and
                re.fullmatch(r'[0-9a-f]{40}', row['sha1']) and re.fullmatch(r'[0-9a-f]{64}', row['sha256']),
                'Invalid manifest hashes')
        rows.append({key: row[key] for key in ['path', 'bytes', 'sha1', 'sha256']})
    require(len({row['path'] for row in rows}) == len(rows), 'Duplicate manifest paths')
    canonical = ''.join(f"{row['path']}\t{row['bytes']}\t{row['sha256']}\n" for row in rows).encode()
    require(sha(canonical) == manifest['inventorySHA256'], 'Manifest checksum mismatch')
    return rows


def baseline_rows():
    durable = DOCS / 'baseline-manifest.json'
    manifest = read(durable if durable.exists() else BASE_MANIFEST)
    require(manifest['inventorySHA256'] == BASE_PIN, 'Baseline must be the complete latest 9M artifact')
    rows = manifest_rows(manifest)
    require(len(rows) == EXPECTED_FILES, 'Latest baseline file count differs')
    return rows


def local_candidate():
    manifest = read(PRIVATE / 'candidate-manifest.json')
    require(manifest.get('baselineDeployment') == BASE, 'Candidate manifest baseline is stale')
    rows = manifest_rows(manifest)
    previous = {row['path']: row for row in baseline_rows()}
    expected = {row['path']: row for row in rows}
    require(len(rows) == EXPECTED_FILES and set(expected) == set(previous), 'Candidate must preserve every latest production path')
    require(sorted(path for path in expected if expected[path] != previous[path]) == ALLOWED_STATIC,
            'Only the four reviewed public static paths may differ')
    require(expected['config.json']['sha256'] == previous['config.json']['sha256'] == BASE_CONFIG,
            'Latest production routing/configuration changed')
    functions = [row for row in rows if row['path'].startswith('functions/')]
    require(len(functions) == EXPECTED_FUNCTION_FILES and all(row == previous[row['path']] for row in functions),
            'One of the eight existing function bundles changed')
    actual = {}
    for path in OUTPUT.rglob('*'):
        require(not path.is_symlink(), 'Artifact symlinks forbidden')
        if path.is_file():
            body = path.read_bytes()
            relative = path.relative_to(OUTPUT).as_posix()
            actual[relative] = {'path': relative, 'bytes': len(body), 'sha1': sha(body, 'sha1'), 'sha256': sha(body)}
    require(actual == expected, 'Complete artifact differs from the candidate manifest')
    return rows, manifest['inventorySHA256']


def remote_inventory(tree, rows):
    expected = {row['path']: row for row in rows}
    observed, functions = {}, []
    def walk(nodes, parent=''):
        require(isinstance(nodes, list), 'Complete native file tree required')
        for node in nodes:
            name = node['name']
            require(name and not name.startswith('/') and '..' not in PurePosixPath(name).parts, 'Unsafe remote path')
            path = '/'.join(part for part in [parent, name] if part)
            if node['type'] == 'directory':
                require('children' in node, 'Truncated directory rejected')
                walk(node['children'], path)
            elif node['type'] == 'lambda' and path.startswith('out/api/'):
                functions.append(path)
            else:
                require(node['type'] == 'file' and path.startswith('src/.vercel/output/'), 'Unexpected remote entry')
                relative = path[len('src/.vercel/output/'):]
                require(relative not in observed, 'Duplicate remote path')
                observed[relative] = node
    walk(tree)
    require(set(observed) == set(expected), 'Complete remote source path set differs')
    require(all(observed[path].get('uid') == row['sha1'] and
                (observed[path].get('size') is None or observed[path]['size'] == row['bytes'])
                for path, row in expected.items()), 'Remote source content-address comparison failed')
    require(sorted(functions) == sorted('out/api/' + name for name in FUNCTIONS), 'Registered function set differs')
    return {'expected': EXPECTED_FILES, 'matched': len(expected), 'missing': [], 'extra': [], 'differentUID': [],
            'functionFiles': EXPECTED_FUNCTION_FILES, 'functionBundles': 8, 'configurationMatched': True,
            'sourceUIDAlgorithm': 'SHA1 of all uploaded sources; local bytes/SHA256 certified by manifest'}
