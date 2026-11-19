#!/usr/bin/env python3
"""Read-only release proofs for the 19 November global home-footer release.

Every Vercel API call uses GET, explicit project/team scope and existing CLI
authentication. Raw project/alias responses are never persisted or printed.
Only environment names, target names and types are selected; no decryption is
requested. This tool cannot create, promote or modify a deployment or setting.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

RELEASE = Path(__file__).resolve().parent
DOCS = RELEASE.parent
ROOT = DOCS.parents[1]
VERIFY = RELEASE / 'verification'
OUTPUT = ROOT / '.vercel/footer-global-home-20261119/stage/.vercel/output'
BASE_MANIFEST = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate-inventory.json')
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
BASE = 'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn'
BASE_SOURCE = 'd7ad0795a561a9b69999b421fd9eef519adfee26'
BASE_BRANCH = 'codex/cobertura-asesoria-20261119'
BASE_HEAD = '9f43dc0a20dbd8711609ea4e5461eb0aaab8c142'
BASE_PIN = 'f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e'
BRANCH = 'codex/footer-global-home-20261119'
HOSTS = ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app',
         'project-wrapp-lsandoval2-8260s-projects.vercel.app']
DOMAIN_NAMES = {'sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app'}
FUNCTIONS = ['advisory', 'booking-availability', 'booking-create', 'collaboration',
             'contact', 'orientation-contact', 'uf']
ENV = dict(os.environ)
for _key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG',
             'VERCEL_LOG_LEVEL', 'VERCEL_AUTOMATION_BYPASS_SECRET']:
    ENV.pop(_key, None)
ENV['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
ENV['GIT_OPTIONAL_LOCKS'] = '0'


def now():
    return datetime.now(timezone.utc).isoformat()


def sha(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def save(name, value):
    VERIFY.mkdir(parents=True, exist_ok=True)
    path = VERIFY / name
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text())


def api(endpoint):
    assert endpoint.startswith(('/v4/aliases/', '/v6/deployments', '/v9/projects/', '/v13/deployments/'))
    assert not re.search(r'/(?:env|secrets)(?:/|\?|$)', endpoint), 'Environment-value endpoint forbidden'
    assert 'decrypt' not in endpoint.lower() and 'teamId=' not in endpoint
    endpoint += ('&' if '?' in endpoint else '?') + 'teamId=' + TEAM
    result = subprocess.run([NODE, CLI, 'api', endpoint, '--method', 'GET', '--scope', SCOPE, '--raw', '--non-interactive'],
                            cwd=ROOT, env=ENV, capture_output=True, timeout=55)
    if result.returncode:
        raise RuntimeError('Authenticated read-only API failed: ' + endpoint.split('?')[0] + '; exit=' + str(result.returncode) + '; raw response omitted')
    return json.loads(result.stdout)


def fetch_all(endpoints):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {key: pool.submit(api, endpoint) for key, endpoint in endpoints.items()}
        return {key: future.result() for key, future in futures.items()}


def id_of(deployment):
    return deployment.get('id') or deployment.get('uid')


def selected_deployment(d):
    return {'id': id_of(d), **{key: d.get(key) for key in ['url', 'readyState', 'state', 'target',
            'source', 'createdAt', 'created', 'ready', 'productionUrl', 'isRollbackCandidate', 'prebuilt', 'projectId', 'teamId', 'ownerId']},
            'meta': {key: d.get('meta', {}).get(key) for key in ['githubCommitSha', 'githubCommitRef',
                     'githubOrg', 'githubRepo', 'candidateInventorySHA256', 'baselineDeployment']}}


def settings(p):
    return {key: p.get(key) for key in ['id', 'name', 'accountId', 'live', 'ssoProtection',
            'passwordProtection', 'trustedIps', 'autoAssignCustomDomains', 'previewDeploymentsDisabled',
            'autoExposeSystemEnvs', 'gitProviderOptions', 'buildCommand', 'outputDirectory',
            'installCommand', 'rootDirectory', 'framework', 'nodeVersion']} | {
            'repository': {key: p.get('link', {}).get(key) for key in ['org', 'repo', 'productionBranch']}}


def environment_metadata(project):
    # Do not access values, request decryption or persist raw env records.
    rows = [{'name': row['key'], 'targets': sorted(row.get('target') or []), 'type': row.get('type')}
            for row in project.get('env', []) if isinstance(row, dict) and row.get('key')]
    return sorted(rows, key=lambda row: (row['name'], json.dumps(row['targets']), row['type'] or ''))


def selected_alias(a):
    return {key: a.get(key) for key in ['alias', 'projectId', 'redirect', 'redirectStatusCode', 'updatedAt', 'createdAt']} | {
            'deploymentId': a.get('deploymentId') or (a.get('deployment') or {}).get('id')}


def selected_domains(data):
    return sorted([{key: row.get(key) for key in ['name', 'projectId', 'verified', 'redirect',
                 'redirectStatusCode', 'gitBranch', 'customEnvironmentId', 'createdAt']}
                 for row in data['domains']], key=lambda row: row['name'])


def normalized_rows(rows):
    result = []
    for row in rows:
        path = row['path']
        assert path and not path.startswith('/') and '..' not in PurePosixPath(path).parts
        size = row.get('bytes', row.get('size'))
        assert isinstance(size, int) and size >= 0
        assert re.fullmatch(r'[0-9a-f]{40}', row['sha1']) and re.fullmatch(r'[0-9a-f]{64}', row['sha256'])
        result.append({'path': path, 'bytes': size, 'sha1': row['sha1'], 'sha256': row['sha256']})
    assert len({row['path'] for row in result}) == len(result), 'Duplicate manifest path'
    return sorted(result, key=lambda row: row['path'])


def inventory_pin(rows):
    return sha(''.join(f"{row['path']}\t{row['bytes']}\t{row['sha256']}\n" for row in rows).encode())


def baseline():
    manifest = read(BASE_MANIFEST)
    rows = normalized_rows(manifest['inventory'])
    assert len(rows) == 1728 and inventory_pin(rows) == manifest['inventorySHA256'] == BASE_PIN
    return rows


def candidate():
    manifest = read(DOCS / 'candidate-manifest.json')
    rows = normalized_rows(manifest['inventory'])
    before = baseline()
    assert manifest['baselineDeployment'] == BASE and manifest['baselineInventorySHA256'] == BASE_PIN
    assert normalized_rows(manifest['baselineInventory']) == before
    assert len(rows) == 1729 and inventory_pin(rows) == manifest['inventorySHA256']
    expected, old = {r['path']: r for r in rows}, {r['path']: r for r in before}
    assert set(expected) - set(old) == {'static/assets/css/corporate-footer.css'}
    assert not (set(old) - set(expected))
    changed = [path for path in old if expected[path] != old[path]]
    assert changed and all(path.startswith('static/') and path.endswith('.html') for path in changed)
    assert expected['config.json'] == old['config.json'], 'Build-output configuration changed'
    functions = [path for path in old if path.startswith('functions/')]
    assert len(functions) == 57 and all(expected[path] == old[path] for path in functions)
    actual = []
    for path in sorted(OUTPUT.rglob('*')):
        assert not path.is_symlink(), 'Artifact symlink rejected'
        if path.is_file():
            body = path.read_bytes()
            actual.append({'path': path.relative_to(OUTPUT).as_posix(), 'bytes': len(body),
                           'sha1': sha(body, 'sha1'), 'sha256': sha(body)})
    assert sorted(actual, key=lambda row: row['path']) == rows, 'Local candidate output differs from pinned manifest'
    assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
    return rows, manifest['inventorySHA256']


def flatten(nodes, parent=''):
    assert isinstance(nodes, list), 'Native complete file tree must be a list'
    for node in nodes:
        name = node['name']
        assert name and not name.startswith('/') and '..' not in PurePosixPath(name).parts
        path = '/'.join(part for part in [parent, name] if part)
        if node['type'] == 'directory':
            yield from flatten(node['children'], path)
        else:
            yield path, node


def remote_inventory(tree, rows, phase, checks):
    expected = {row['path']: row for row in rows}
    observed, lambdas, unexpected = {}, [], []
    for path, node in flatten(tree):
        if node['type'] == 'lambda' and path.startswith('out/api/'):
            lambdas.append(path)
        elif node['type'] == 'file' and path.startswith('src/.vercel/output/'):
            relative = path[len('src/.vercel/output/'):]
            assert relative not in observed, 'Duplicate remote source path'
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
    correct = not missing and not extra and not unexpected and all(row['passed'] for row in comparisons)
    check(checks, 'complete_remote_inventory_and_content_addresses', correct,
          {'expected': len(expected), 'actual': len(observed), 'matched': sum(row['passed'] for row in comparisons),
           'missing': missing, 'extra': extra, 'unexpected': unexpected})
    expected_lambdas = ['out/api/' + name for name in FUNCTIONS]
    check(checks, 'seven_registered_functions', sorted(lambdas) == sorted(expected_lambdas), {'paths': sorted(lambdas)})
    check(checks, '57_function_source_files_unchanged', sum(path.startswith('functions/') for path in expected) == 57)
    check(checks, 'config_v3_source_identity', comparisons[[r['path'] for r in comparisons].index('config.json')]['passed'])
    save(phase + '-source-comparisons.json', comparisons)
    return {'expected': len(expected), 'matched': sum(row['passed'] for row in comparisons),
            'functionFiles': 57, 'functionBundles': len(lambdas), 'configurationMatched': correct,
            'inventorySHA256': inventory_pin(rows),
            'sizeEvidence': 'Remote sizes checked where supplied; UID SHA1 binds the locally certified SHA256 and byte count'}


def check(checks, name, passed, detail=None):
    checks.append({'name': name, 'passed': bool(passed), 'detail': detail})


def read_created(pin):
    created = read(RELEASE / 'created.json')
    deployment = created['deploymentId']
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+', deployment) and deployment != BASE
    assert created['target'] == created['reportedTarget'] == 'production'
    assert created['prebuilt'] is True and created['skipDomain'] is True
    assert created['baselineDeployment'] == BASE and created['candidateInventorySHA256'] == pin
    assert re.fullmatch(r'[0-9a-f]{40}', created['sourceCommit'])
    origin = created['url']
    p = urlsplit(origin if origin.startswith('https://') else 'https://' + origin)
    assert p.scheme == 'https' and p.hostname and p.hostname.endswith('.vercel.app') and not p.query and not p.fragment
    return created


def authorization_epoch():
    authorization = read(RELEASE / 'authorization.json')
    value = authorization.get('recordedAt') or authorization.get('recordedAtUTC') or authorization.get('recordedAtUtc')
    assert isinstance(value, str), 'Authorization must record a timestamp'
    timestamp = datetime.fromisoformat(value.replace('Z', '+00:00'))
    assert timestamp.tzinfo is not None
    return int(timestamp.timestamp() * 1000)


def baseline_remote_head():
    result = subprocess.run(['/usr/bin/git', 'ls-remote', '--exit-code', 'https://github.com/lasopho/sollahms-web.git',
                             'refs/heads/' + BASE_BRANCH], cwd=ROOT, env=ENV, capture_output=True, timeout=45)
    assert result.returncode == 0, 'Read-only baseline Git remote HEAD lookup failed; response omitted'
    line = result.stdout.decode().strip().split('\t')
    assert len(line) == 2 and line[1] == 'refs/heads/' + BASE_BRANCH
    return line[0]


def anonymous_sso(hostname):
    assert hostname.endswith('.vercel.app') and re.fullmatch(r'[a-z0-9.-]+', hostname)
    result = subprocess.run(['/usr/bin/curl', '-q', '--silent', '--show-error', '--max-time', '35',
                             '--proto', '=https', '--output', '/dev/null', '--write-out',
                             '%{http_code}\t%{ssl_verify_result}\t%{redirect_url}\t%{num_redirects}',
                             'https://' + hostname + '/'], cwd=ROOT, capture_output=True, timeout=40,
                            env={'PATH': '/usr/bin:/bin', 'LANG': 'C'})
    assert result.returncode == 0, 'Anonymous TLS check failed; raw response omitted'
    status, ssl_result, location, redirects = result.stdout.decode().split('\t')
    return {'status': int(status), 'sslVerifyResult': int(ssl_result), 'locationHost': urlsplit(location).hostname,
            'followedRedirects': int(redirects), 'authenticated': False, 'bypassUsed': False}


def qa_gate(pin, deployment, checks):
    receipts = []
    for mode in ['local', 'isolated']:
        path = DOCS / 'qa' / mode / 'results.json'
        raw = path.read_bytes()
        proof = json.loads(raw)
        cases = proof['cases']
        correct = (proof['passed'] is True and proof['mode'] == mode and proof['artifactPin'] == pin
                   and len(cases) == 840 and all(case.get('passed') is True for case in cases))
        if mode == 'isolated':
            correct = correct and proof['deployment'] == deployment
        receipt = {'mode': mode, 'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(raw),
                   'artifactPin': proof.get('artifactPin'), 'deployment': proof.get('deployment'),
                   'cases': len(cases), 'passedCases': sum(case.get('passed') is True for case in cases), 'passed': correct}
        receipts.append(receipt)
        check(checks, '840_' + mode + '_browser_cases_and_exact_artifact', correct, receipt)
    http_path = DOCS / 'qa/http-isolated/results.json'
    raw = http_path.read_bytes()
    proof = json.loads(raw)
    pins = [proof[key] for key in ['artifactPin', 'candidateInventorySHA256'] if key in proof]
    correct = (proof['passed'] is True and proof['deploymentId'] == deployment and bool(pins)
               and all(value == pin for value in pins))
    if isinstance(proof.get('results'), list):
        correct = correct and bool(proof['results']) and all(row.get('passed') is True for row in proof['results'])
    receipt = {'mode': 'http-isolated', 'path': http_path.relative_to(ROOT).as_posix(),
               'sha256': sha(raw), 'deploymentId': proof.get('deploymentId'),
               'artifactPin': pins[0] if pins else None, 'passed': correct}
    receipts.append(receipt)
    check(checks, 'isolated_HTTP_proof_matches_candidate', correct, receipt)
    return receipts


def main(phase):
    started = now()
    checks = []
    created = None
    if phase == 'preflight':
        rows, pin, deployment = baseline(), BASE_PIN, BASE
        since = 1795117979620
    else:
        rows, pin = candidate()
        created = read_created(pin)
        deployment = created['deploymentId']
        since = authorization_epoch()
    endpoints = {'project': '/v9/projects/' + PROJECT,
                 'domains': '/v9/projects/' + PROJECT + '/domains?limit=100',
                 'deployment': '/v13/deployments/' + deployment,
                 'baseline': '/v13/deployments/' + BASE,
                 'recent': '/v6/deployments?projectId=' + PROJECT + '&target=production&since=' + str(since) + '&limit=100'}
    endpoints.update({'alias_' + str(i): '/v4/aliases/' + host for i, host in enumerate(HOSTS)})
    if phase != 'gate':
        endpoints['tree'] = '/v6/deployments/' + deployment + '/files'
    if phase != 'preflight':
        endpoints['baselineEligibility'] = '/v6/deployments?projectId=' + PROJECT + '&target=production&sha=' + BASE_SOURCE + '&limit=100'
    data = fetch_all(endpoints)
    project = settings(data['project'])
    env = environment_metadata(data['project'])
    aliases = [selected_alias(data['alias_' + str(i)]) for i in range(len(HOSTS))]
    domains = selected_domains(data['domains'])
    raw = data['deployment']
    metadata = selected_deployment(raw)
    old = selected_deployment(data['baseline'])
    check(checks, 'project_and_owner', project['id'] == PROJECT and project['accountId'] == TEAM and project['name'] == 'project-wrapp')
    check(checks, 'SSO_and_manual_domain_assignment', (project['ssoProtection'] or {}).get('deploymentType') == 'all_except_custom_domains' and project['autoAssignCustomDomains'] is False)
    check(checks, 'automatic_previews_disabled', project['previewDeploymentsDisabled'] is True)
    check(checks, 'live_flag_false', project['live'] is False)
    check(checks, 'repository_binding', project['repository'] == {'org': 'lasopho', 'repo': 'sollahms-web', 'productionBranch': 'main'})
    check(checks, 'deployment_identity_ready_production_prebuilt', metadata['id'] == deployment and metadata['readyState'] == 'READY'
          and metadata['target'] == 'production' and metadata['prebuilt'] is True and metadata['projectId'] == PROJECT
          and TEAM in [metadata['teamId'], metadata['ownerId']])
    check(checks, 'four_existing_domains_verified', {r['name'] for r in domains} == DOMAIN_NAMES
          and all(r['projectId'] == PROJECT and r['verified'] is True for r in domains))
    expected_alias = deployment if phase == 'postpromotion' else BASE
    check(checks, 'all_five_aliases_on_expected_deployment', len(aliases) == 5 and all(a['deploymentId'] == expected_alias and a['projectId'] == PROJECT for a in aliases), {'expectedDeployment': expected_alias})
    for alias in aliases:
        redirect = alias['alias'] in {'www.sollahms.cl', 'sollhams.cl'}
        check(checks, 'redirect_preserved_' + alias['alias'],
              (alias['redirect'] == 'sollahms.cl' and alias['redirectStatusCode'] == 308) if redirect else alias['redirect'] is None)
    recent = data['recent']
    recent_rows = recent.get('deployments', [])
    assert isinstance(recent_rows, list)
    safe_recent = [selected_deployment(d) for d in recent_rows]
    check(checks, 'production_window_complete', not (recent.get('pagination') or {}).get('next'))
    report = {'phase': phase, 'startedAtUtc': started, 'checkedAtUtc': now(), 'timezone': 'America/Santiago',
              'mutations': 0, 'apiMethods': ['GET'], 'projectSettings': project, 'environmentMetadata': env,
              'requestedEnvironmentDecryption': False, 'environmentValuesStored': False,
              'aliases': aliases, 'domains': domains, 'deployment': metadata, 'baseline': old,
              'candidateInventorySHA256': pin, 'recentProduction': safe_recent, 'productionWindowSinceEpochMs': since,
              'checks': checks}
    if phase == 'preflight':
        check(checks, 'published_baseline_source_commit_and_branch', metadata['meta']['githubCommitSha'] == BASE_SOURCE and metadata['meta']['githubCommitRef'] == BASE_BRANCH)
        remote_head = baseline_remote_head()
        report['remoteBaselineHead'] = remote_head
        check(checks, 'remote_baseline_HEAD_reconciled', remote_head == BASE_HEAD)
        check(checks, 'no_concurrent_new_production', {id_of(d) for d in recent_rows} == {BASE}
              and all(d.get('state', d.get('readyState')) == 'READY' for d in recent_rows))
    else:
        before = read(VERIFY / 'preflight-summary.json')
        assert before['passed'] is True and before['candidateInventorySHA256'] == BASE_PIN
        check(checks, 'project_settings_unchanged', project == before['projectSettings'])
        check(checks, 'environment_metadata_unchanged', env == before['environmentMetadata'])
        check(checks, 'project_domains_unchanged', domains == before['domains'])
        before_alias = {r['alias']: r for r in before['aliases']}
        check(checks, 'alias_creation_dates_and_redirects_preserved', all(all(a.get(k) == before_alias[a['alias']].get(k)
              for k in ['projectId', 'redirect', 'redirectStatusCode', 'createdAt']) for a in aliases))
        check(checks, 'exact_authorized_source_and_artifact_metadata', metadata['meta'] == {
              'githubCommitSha': created['sourceCommit'], 'githubCommitRef': BRANCH,
              'githubOrg': 'lasopho', 'githubRepo': 'sollahms-web',
              'candidateInventorySHA256': pin, 'baselineDeployment': BASE})
        check(checks, 'one_authorized_new_production_only', {id_of(d) for d in recent_rows} == {deployment}
              and all(d.get('state', d.get('readyState')) == 'READY' for d in recent_rows), {'expected': deployment})
        eligibility_rows = [row for row in data['baselineEligibility'].get('deployments', []) if id_of(row) == BASE]
        report['baselineRollbackEligibility'] = [selected_deployment(row) for row in eligibility_rows]
        check(checks, 'old_production_retained_and_rollback_eligible', old['id'] == BASE and old['readyState'] == 'READY'
              and old['target'] == 'production' and len(eligibility_rows) == 1 and eligibility_rows[0].get('isRollbackCandidate') is True)
        if phase in {'isolated', 'gate'}:
            check(checks, 'candidate_not_assigned_production_domains', metadata['productionUrl'] is None)
        if phase in {'gate', 'postpromotion'}:
            report['qaReceipts'] = qa_gate(pin, deployment, checks)
        if phase == 'gate':
            staged = read(VERIFY / 'isolated-summary.json')
            check(checks, 'previous_complete_isolated_proof_matches_candidate', staged['passed'] is True
                  and staged['deployment']['id'] == deployment and staged['candidateInventorySHA256'] == pin
                  and staged['fullInventory']['matched'] == 1729)
        if phase == 'postpromotion':
            apex = next(a for a in aliases if a['alias'] == 'sollahms.cl')
            t0 = datetime.fromtimestamp(apex['updatedAt'] / 1000, timezone.utc)
            report['t0Utc'] = t0.isoformat()
            report['t0AmericaSantiago'] = t0.astimezone(ZoneInfo('America/Santiago')).isoformat()
    if phase != 'gate':
        report['fullInventory'] = remote_inventory(data['tree'], rows, phase, checks)
    if phase in {'isolated', 'postpromotion'}:
        sso = anonymous_sso(metadata['url'])
        report['anonymousSSO'] = sso
        check(checks, 'immutable_deployment_hostname_requires_SSO_with_valid_TLS', sso['status'] == 302 and sso['sslVerifyResult'] == 0 and sso['locationHost'] == 'vercel.com' and sso['followedRedirects'] == 0)
    report['passed'] = all(row['passed'] for row in checks)
    report['status'] = 'PASS' if report['passed'] else 'BLOCK'
    report['finishedAtUtc'] = now()
    save(phase + '-summary.json', report)
    print(json.dumps({'phase': phase, 'status': report['status'], 'deploymentId': deployment,
                      'checks': len(checks), 'passedChecks': sum(c['passed'] for c in checks),
                      'matchedFiles': report.get('fullInventory', {}).get('matched'),
                      'environmentMetadataEntries': len(env), 'failedChecks': [c['name'] for c in checks if not c['passed']]}), flush=True)
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group(required=True)
    for name in ['preflight', 'isolated', 'gate', 'postpromotion']:
        modes.add_argument('--' + name, action='store_true')
    arguments = parser.parse_args()
    phase = next(name for name in ['preflight', 'isolated', 'gate', 'postpromotion'] if getattr(arguments, name))
    try:
        raise SystemExit(main(phase))
    except (AssertionError, FileNotFoundError, KeyError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        failure = {'phase': phase, 'status': 'BLOCK', 'passed': False, 'checkedAtUtc': now(),
                   'mutations': 0, 'environmentValuesStored': False, 'reason': str(error)}
        save(phase + '-failure.json', failure)
        print(json.dumps(failure), flush=True)
        raise SystemExit(1)
