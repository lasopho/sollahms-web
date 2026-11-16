"""Read-only verification of the exact private Centre Preview; no deployments.

Uses existing Vercel CLI authentication. Only GET requests are permitted.
Secrets and raw project/deployment responses are never saved or printed.
"""
import hashlib
import json
import os
import signal
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

AREA = Path(__file__).resolve().parent
DOCS = AREA.parent
ROOT = DOCS.parents[1]
DEPLOYMENT = 'dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS'
ORIGIN = 'https://project-wrapp-9uq44evdh-lsandoval2-8260s-projects.vercel.app'
PRODUCTION = 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w'
COMMIT = 'e9d7393148bf1e209f6a8e2210ed4c5a973ceb41'
BRANCH = 'codex/centro-auditoria-integral-20261116'
PIN = 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
NODE_PATH = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin'
FUNCTIONS = {'api/advisory', 'api/booking-availability', 'api/booking-create',
             'api/collaboration', 'api/contact', 'api/orientation-contact', 'api/uf'}
os.umask(0o077)
env = dict(os.environ)
for key in ['VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID',
            'VERCEL_AUTOMATION_BYPASS_SECRET', 'VERCEL_USE_EXPERIMENTAL_SERVICES',
            'NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VERCEL_LOG_LEVEL', 'VC_DEBUG']:
    env.pop(key, None)
env['PATH'] = NODE_PATH + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
checks, failures = [], []
active = set()
uf_attempted = False


def save(name, value):
    (AREA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def check(name, passed, detail=None):
    record = {'check': name, 'pass': bool(passed), 'detail': detail}
    checks.append(record)
    if not passed:
        failures.append(record)


def digest(body):
    return hashlib.sha256(body).hexdigest()


def run(command):
    proc = subprocess.Popen(command, cwd=AREA, env=env, stdin=subprocess.DEVNULL,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    active.add(proc.pid)
    try:
        try:
            out, err = proc.communicate(timeout=55)
        except BaseException:
            os.killpg(proc.pid, signal.SIGTERM)
            try:
                proc.communicate(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.communicate(timeout=3)
            raise RuntimeError('TRANSPORT_TIMEOUT_OR_INTERRUPTED')
        if proc.returncode:
            raise RuntimeError('TRANSPORT_EXIT_' + str(proc.returncode))
        return out
    finally:
        active.discard(proc.pid)


def cli(arguments):
    return run([CLI, *arguments])


def api(path):
    assert path.startswith('/') and not any(word in path for word in ['secrets', '/env'])
    return json.loads(cli(['api', path, '--method', 'GET', '--scope', SCOPE, '--raw']))


def flatten(value, parent=''):
    if isinstance(value, list):
        for item in value:
            yield from flatten(item, parent)
    elif isinstance(value, dict):
        if 'files' in value and not ('name' in value or 'path' in value):
            yield from flatten(value['files'], parent)
            return
        name = value.get('path', value.get('file', value.get('name', '')))
        path = name if value.get('path') or value.get('file') or name.startswith(('src/', 'out/')) else '/'.join(x for x in [parent, name] if x)
        if isinstance(value.get('children'), list):
            yield from flatten(value['children'], path)
        elif path:
            yield {'path': path, 'type': value.get('type'),
                   'uid': value.get('uid', value.get('sha1', value.get('sha'))),
                   'size': value.get('size'), 'mode': value.get('mode')}


def project_snapshot(phase):
    raw = api('/v9/projects/' + PROJECT)
    keys = ['id', 'accountId', 'ssoProtection', 'autoExposeSystemEnvs', 'nodeVersion',
            'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'paused']
    safe = {key: raw.get(key) for key in keys}
    safe['gitIntegration'] = {key: (raw.get('link') or {}).get(key)
                              for key in ['type', 'productionBranch', 'repo']}
    save('project-' + phase + '.json', safe)
    prior = json.loads((ROOT / 'docs/contacto-baseline-20261116/production-release-20261116/preflight-native.json').read_text())
    check(phase + '_project_identity', safe['id'] == PROJECT and safe['accountId'] == TEAM)
    check(phase + '_sso_preserved', (safe['ssoProtection'] or {}).get('deploymentType') == 'all_except_custom_domains')
    checked_keys = ['id', 'accountId', 'nodeVersion', 'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'paused']
    check(phase + '_project_automatic_states_preserved',
          all(safe.get(key) == prior['project'].get(key) for key in checked_keys),
          {key: safe.get(key) for key in checked_keys})
    check(phase + '_git_integration_preserved', safe['gitIntegration'] == prior['gitIntegration'])
    rules = json.loads((ROOT / 'vercel.json').read_text())['git']['deploymentEnabled']
    required = dict(prior['repositoryAutomaticDeploymentRules'], **{BRANCH: False})
    check(phase + '_repository_deployments_disabled',
          all(rules.get(key) == value for key, value in required.items()), required)
    return safe


def alias_snapshot(phase):
    aliases = []
    for host in ['sollahms.cl', 'www.sollahms.cl']:
        raw = api('/v4/aliases/' + host)
        safe = {'host': host, 'deploymentId': raw.get('deploymentId', (raw.get('deployment') or {}).get('id')),
                'projectId': raw.get('projectId'), 'redirect': raw.get('redirect'),
                'redirectStatusCode': raw.get('redirectStatusCode'), 'updatedAt': raw.get('updatedAt')}
        aliases.append(safe)
        check(phase + '_production_alias_' + host,
              safe['deploymentId'] == PRODUCTION and safe['projectId'] == PROJECT, safe)
    check(phase + '_www_redirect_preserved', aliases[1]['redirect'] == 'sollahms.cl' and aliases[1]['redirectStatusCode'] == 308)
    save('production-aliases-' + phase + '.json', aliases)
    return aliases


try:
    manifest = json.loads((DOCS / 'candidate-manifest.json').read_text())
    rows = manifest['inventory']
    canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda row: row['path'])).encode()
    assert digest(canonical) == manifest['outputInventorySha256'] == PIN
    assert len(rows) == 1660 and manifest['changedFiles'] == 3 and manifest['identicalFiles'] == 1657
    expected = {row['path']: row for row in rows}
    raw = api('/v13/deployments/' + DEPLOYMENT)
    safe = {key: raw.get(key) for key in ['id', 'url', 'name', 'readyState', 'target', 'prebuilt',
                                         'projectId', 'teamId', 'ownerId', 'source', 'alias', 'autoAssignCustomDomains']}
    safe['meta'] = {key: (raw.get('meta') or {}).get(key)
                    for key in ['githubCommitSha', 'githubCommitRef', 'candidateInventorySha256', 'baselineDeployment']}
    save('deployment-metadata.json', safe)
    check('ready_private_preview_identity', safe['id'] == DEPLOYMENT and ORIGIN == 'https://' + safe['url']
          and safe['readyState'] == 'READY' and safe['target'] in [None, 'preview'] and safe['prebuilt'] is True)
    check('preview_project_team', safe['projectId'] == PROJECT and TEAM in [safe['teamId'], safe['ownerId']])
    check('preview_source_commit', safe['meta']['githubCommitSha'] == COMMIT and safe['meta']['githubCommitRef'] == BRANCH)
    check('preview_candidate_pin', safe['meta']['candidateInventorySha256'] == PIN and safe['meta']['baselineDeployment'] == PRODUCTION)
    before_project = project_snapshot('before')
    before_aliases = alias_snapshot('before')
    tree = list(flatten(api('/v6/deployments/' + DEPLOYMENT + '/files')))
    prefix = 'src/.vercel/output/'
    remote = {row['path'][len(prefix):]: row for row in tree if row['path'].startswith(prefix)}
    comparisons = []
    for path, want in sorted(expected.items()):
        got = remote.get(path)
        passed = bool(got and got['uid'] == want['sha1'] and
                      (not isinstance(got.get('size'), int) or got['size'] == want['size']))
        comparisons.append({'path': path, 'expectedSha1': want['sha1'],
                            'remoteSha1': got.get('uid') if got else None,
                            'certifiedBytes': want['size'], 'remoteExplicitBytes': got.get('size') if got else None,
                            'pass': passed})
    check('all_1660_remote_source_paths_sha1', set(remote) == set(expected) and all(row['pass'] for row in comparisons),
          {'expected': len(expected), 'remote': len(remote), 'matched': sum(row['pass'] for row in comparisons)})
    save('source-comparison.json', {'deployment': DEPLOYMENT, 'candidateInventorySha256': PIN,
                                   'sourceRecords': len(remote), 'matched': sum(row['pass'] for row in comparisons),
                                   'remoteExplicitSizeRecords': sum(isinstance(row.get('size'), int) for row in remote.values()),
                                   'sizeLimitation': 'API sizes checked when exposed; otherwise certified sizes are bound to identical remote SHA1 content addresses. No source bodies downloaded.',
                                   'comparisons': comparisons})
    lambdas = [row for row in tree if row['type'] == 'lambda' and row['path'].startswith('out/api/')]
    check('seven_registered_functions', len(lambdas) == 7 and {row['path'][4:] for row in lambdas} == FUNCTIONS,
          [row['path'] for row in lambdas])
    save('registered-functions.json', {'deployment': DEPLOYMENT, 'registeredFunctions': lambdas,
                                     'certifiedFunctionSourceFiles': 57})
    anonymous = json.loads(run(['/usr/bin/curl', '-q', '--silent', '--show-error', '--max-time', '45',
                                '--output', '/dev/null', '--write-out', '%{json}', ORIGIN + '/']))
    safe_anonymous = {'status': anonymous.get('http_code', anonymous.get('response_code')),
                      'locationHost': urlsplit(anonymous.get('redirect_url') or '').hostname,
                      'sslVerifyResult': anonymous.get('ssl_verify_result'), 'redirectFollowed': False,
                      'authenticationHeadersCookiesOrBypassUsed': False}
    check('anonymous_https_sso', safe_anonymous['status'] == 302 and
          safe_anonymous['locationHost'] == 'vercel.com' and safe_anonymous['sslVerifyResult'] == 0,
          safe_anonymous)
    save('anonymous-https-sso.json', safe_anonymous)
    uf_receipt = AREA / 'uf-get.json'
    assert not uf_receipt.exists(), 'UF observation already executed; do not repeat by routine.'
    uf_attempted = True
    with tempfile.TemporaryDirectory(prefix='centro-uf-', dir=AREA) as temporary:
        headers_path, body_path = Path(temporary) / 'headers', Path(temporary) / 'body'
        cli(['curl', '/api/uf', '--deployment', DEPLOYMENT, '--scope', SCOPE, '--',
             '--silent', '--show-error', '--max-time', '45', '--request', 'GET',
             '--dump-header', str(headers_path), '--output', str(body_path)])
        header_lines = headers_path.read_text().splitlines()
        statuses = [int(line.split()[1]) for line in header_lines if line.startswith('HTTP/')]
        status = statuses[-1]
        headers = {line.split(':', 1)[0].lower(): line.split(':', 1)[1].strip()
                   for line in header_lines if ':' in line and not line.startswith('HTTP/')}
        body = body_path.read_bytes()
        value = json.loads(body)
        today = datetime.now(ZoneInfo('America/Santiago')).date().isoformat()
        uf = value.get('uf') or {}
        source = uf.get('source') or {}
        usable = status == 200 and uf.get('date') == today and source.get('verifiedAt') == today and isinstance(uf.get('valueClp'), (int, float)) and 1 <= uf['valueClp'] <= 1_000_000 and urlsplit(source.get('url', '')).hostname in ['www.sii.cl', 'sii.cl', 'www.cmfchile.cl', 'cmfchile.cl']
        unavailable = status == 503 and value.get('code') == 'uf_unavailable' and value.get('date') == today and 'uf' not in value
        safe_uf = {'deployment': DEPLOYMENT, 'method': 'GET', 'path': '/api/uf', 'query': False,
                   'status': status, 'bodySha256': digest(body), 'bodyBytes': len(body),
                   'observationDateSantiago': today, 'usableOfficialUf': bool(usable),
                   'gracefulUnavailable': bool(unavailable), 'publicResponse': value,
                   'cacheControl': headers.get('cache-control'), 'retryAfter': headers.get('retry-after'),
                   'syntheticInputsTransmitted': False, 'requests': 1}
        check('live_uf_usable_or_fail_closed', usable or unavailable, {'status': status, 'usable': usable, 'gracefulUnavailable': unavailable})
        save('uf-get.json', safe_uf)
    after_project = project_snapshot('after')
    after_aliases = alias_snapshot('after')
    check('project_settings_stable_during_verification', before_project == after_project)
    check('production_aliases_stable_during_verification', before_aliases == after_aliases)
except Exception as exc:
    failures.append({'check': 'execution', 'detail': str(exc) if isinstance(exc, RuntimeError) else type(exc).__name__})
finally:
    summary = {'verifiedAtUTC': datetime.now(timezone.utc).isoformat(), 'passed': not failures,
               'deployment': DEPLOYMENT, 'origin': ORIGIN, 'sourceCommit': COMMIT,
               'candidateInventorySha256': PIN, 'expectedSourceFiles': 1660,
               'preservedBaselineFiles': 1657, 'approvedChangedFiles': 3,
               'functionBundles': 7, 'functionSourceFiles': 57,
               'checks': checks, 'failures': failures, 'ufProviderLookupAttempted': uf_attempted,
               'browserTestsRepeated': False, 'sourceBodiesDownloaded': 0,
               'formsSubmitted': 0, 'apiWrites': 0, 'deploymentsCreatedOrPromoted': 0,
               'credentialsOrProtectionsModified': False, 'activeOwnProcessGroups': sorted(active)}
    save('verification-summary.json', summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    if failures:
        raise SystemExit(1)
