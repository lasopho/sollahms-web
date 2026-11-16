"""Read-only release checks: preflight, then an explicitly supplied isolated Production.

No deploy, promotion, aliases/settings writes, form calls or UF provider lookup.
Existing CLI authentication stays in memory. Raw API secrets are never saved.
"""
import argparse
import hashlib
import json
import os
import signal
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

AREA = Path(__file__).resolve().parent
DOCS = AREA.parents[1]
ROOT = DOCS.parents[1]
OUTPUT = ROOT / '.vercel/centro-auditoria-20261116/stage/.vercel/output'
BASELINE = 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w'
HEAD = '42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9'
BRANCH = 'codex/centro-auditoria-integral-20261116'
PIN = 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
BASE_PIN = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
FUNCTIONS = {'api/advisory', 'api/booking-availability', 'api/booking-create',
             'api/collaboration', 'api/contact', 'api/orientation-contact', 'api/uf'}
ALLOWED = {'static/centro-orientacion.html', 'static/assets/css/orientacion.css', 'static/assets/js/orientacion.mjs'}
env = dict(os.environ)
for key in ['VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID',
            'VERCEL_AUTOMATION_BYPASS_SECRET', 'VERCEL_USE_EXPERIMENTAL_SERVICES',
            'NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VERCEL_LOG_LEVEL', 'VC_DEBUG']:
    env.pop(key, None)
env['PATH'] = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
active = set()


def save(name, value):
    (AREA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def digest(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def pin(rows):
    body = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path']))
    return digest(body.encode())


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


def api(path):
    assert path.startswith('/') and not any(word in path for word in ['secrets', '/env'])
    return json.loads(run([CLI, 'api', path, '--method', 'GET', '--scope', SCOPE, '--raw']))


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
            yield {'path': path, 'type': value.get('type'), 'uid': value.get('uid', value.get('sha1', value.get('sha'))), 'size': value.get('size')}


class Verification:
    def __init__(self, phase):
        self.phase, self.checks, self.failures = phase, [], []
        self.alias_target = BASELINE

    def check(self, name, passed, detail=None):
        row = {'check': name, 'pass': bool(passed), 'detail': detail}
        self.checks.append(row)
        if not passed:
            self.failures.append(row)
            raise RuntimeError('BLOCK_' + name.upper())

    def artifact(self):
        candidate = json.loads((DOCS / 'candidate-manifest.json').read_text())
        baseline = json.loads((ROOT / 'docs/contacto-baseline-20261116/candidate-manifest.json').read_text())
        rows, prior = candidate['inventory'], baseline['inventory']
        expected, old = {r['path']: r for r in rows}, {r['path']: r for r in prior}
        self.check('candidate_manifest_pin', pin(rows) == PIN == candidate['outputInventorySha256'])
        self.check('baseline_manifest_pin', pin(prior) == BASE_PIN == baseline['outputInventorySha256'])
        self.check('1660_identical_path_set', len(expected) == 1660 and set(expected) == set(old))
        changes = sorted(path for path in expected if expected[path] != old[path])
        self.check('exactly_three_authorized_changes', set(changes) == ALLOWED and len(changes) == 3, changes)
        self.check('1657_preserved_entries', sum(expected[path] == old[path] for path in expected) == 1657)
        actual = []
        for path in sorted(OUTPUT.rglob('*')):
            self.check('no_source_symlink_' + str(len(actual)), not path.is_symlink()) if path.is_symlink() else None
            if path.is_file():
                body = path.read_bytes()
                actual.append({'path': path.relative_to(OUTPUT).as_posix(), 'size': len(body), 'sha1': digest(body, 'sha1'), 'sha256': digest(body)})
        self.check('local_artifact_all_hashes', actual == sorted(rows, key=lambda r: r['path']) and pin(actual) == PIN,
                   {'files': len(actual), 'sha256': pin(actual)})
        self.check('config_v3_unchanged', json.loads((OUTPUT / 'config.json').read_text())['version'] == 3 and expected['config.json'] == old['config.json'])
        functions = [row for row in rows if row['path'].startswith('functions/')]
        bundles = {row['path'].split('/')[2] for row in functions}
        self.check('7_functions_57_files_unchanged', len(functions) == 57 and len(bundles) == 7 and all(row == old[row['path']] for row in functions),
                   {'bundles': sorted(bundles), 'files': len(functions)})
        self.check('contacto_unchanged', expected['static/contacto.html'] == old['static/contacto.html'])
        self.check('financial_engine_unchanged', expected['static/assets/js/orientation-engine.mjs'] == old['static/assets/js/orientation-engine.mjs'])
        save(self.phase + '-artifact.json', {'candidatePin': PIN, 'baselinePin': BASE_PIN, 'paths': len(rows), 'changed': changes,
                                           'preserved': 1657, 'localOutput': str(OUTPUT), 'allPathSizeSha1Sha256Match': True,
                                           'functions': len(bundles), 'functionFiles': len(functions), 'noRebuild': True})
        return expected

    def project(self, moment):
        raw = api('/v9/projects/' + PROJECT)
        keys = ['id', 'accountId', 'ssoProtection', 'autoExposeSystemEnvs', 'nodeVersion',
                'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'paused']
        safe = {key: raw.get(key) for key in keys}
        safe['gitIntegration'] = {key: (raw.get('link') or {}).get(key) for key in ['type', 'productionBranch', 'repo']}
        save(self.phase + '-project-' + moment + '.json', safe)
        prior = json.loads((DOCS / 'remote-verification/project-after.json').read_text())
        self.check(moment + '_project_identity', safe['id'] == PROJECT and safe['accountId'] == TEAM)
        self.check(moment + '_project_settings_unchanged', safe == prior, safe)
        rules = json.loads((ROOT / 'vercel.json').read_text())['git']['deploymentEnabled']
        required = ['main', BRANCH, 'codex/contacto-baseline-productivo-20261116', 'codex/eliminar-recorridos-global-20261115']
        self.check(moment + '_repository_automatic_deployments_disabled', all(rules.get(key) is False for key in required),
                   {key: rules.get(key) for key in required})
        return safe

    def aliases(self, moment):
        result = []
        for host in ['sollahms.cl', 'www.sollahms.cl']:
            raw = api('/v4/aliases/' + host)
            safe = {'host': host, 'deploymentId': raw.get('deploymentId', (raw.get('deployment') or {}).get('id')),
                    'projectId': raw.get('projectId'), 'redirect': raw.get('redirect'),
                    'redirectStatusCode': raw.get('redirectStatusCode'), 'updatedAt': raw.get('updatedAt')}
            result.append(safe)
            self.check(moment + '_expected_alias_' + host, safe['deploymentId'] == self.alias_target and safe['projectId'] == PROJECT, safe)
        self.check(moment + '_www_redirect_preserved', result[1]['redirect'] == 'sollahms.cl' and result[1]['redirectStatusCode'] == 308)
        save(self.phase + '-aliases-' + moment + '.json', result)
        return result

    def execute(self, arguments):
        try:
            if self.phase == 'postpromotion':
                self.alias_target = arguments.deployment
            expected = self.artifact()
            project_before, aliases_before = self.project('before'), self.aliases('before')
            if self.phase == 'preflight':
                github = json.loads((AREA / 'preflight-github.json').read_text())
                self.check('github_heads_and_draft_pr', github['passed'] and github['workingBranch']['sha'] == HEAD and
                           github['baseBranch']['sha'] == 'dffbd310fe0cb34d952bda493140504ec4e1241c' and
                           github['pullRequest30']['state'] == 'open' and github['pullRequest30']['draft'] and not github['pullRequest30']['merged'])
                actual_head = run(['git', '-C', str(ROOT), 'rev-parse', 'HEAD']).decode().strip()
                self.check('local_head_matches_verified_remote', actual_head == HEAD, actual_head)
                runtime_diff = run(['git', '-C', str(ROOT), 'diff', 'HEAD', '--', 'centro-orientacion.html', 'assets/css/orientacion.css', 'assets/js/orientacion.mjs', 'vercel.json'])
                self.check('runtime_sources_clean', not runtime_diff)
                recent = api('/v6/deployments?projectId=' + PROJECT + '&target=production&limit=5')
                safe_recent = [{'id': row.get('uid', row.get('id')), 'state': row.get('state'), 'target': row.get('target'),
                                'created': row.get('created'), 'sourceSha': (row.get('meta') or {}).get('githubCommitSha')}
                               for row in recent['deployments']]
                save('preflight-recent-production.json', safe_recent)
                self.check('latest_production_still_baseline', safe_recent[0]['id'] == BASELINE, safe_recent)
            else:
                deployment, origin, commit = arguments.deployment, arguments.origin, arguments.commit
                self.check('explicit_isolated_identity_arguments', bool(deployment and deployment.startswith('dpl_') and deployment != BASELINE
                                                                      and urlsplit(origin).scheme == 'https' and urlsplit(origin).hostname.endswith('.vercel.app')
                                                                      and len(commit) == 40))
                raw = api('/v13/deployments/' + deployment)
                safe = {key: raw.get(key) for key in ['id', 'url', 'name', 'readyState', 'target', 'prebuilt', 'projectId', 'teamId', 'ownerId', 'source', 'alias', 'autoAssignCustomDomains']}
                safe['meta'] = {key: (raw.get('meta') or {}).get(key) for key in ['githubCommitSha', 'githubCommitRef', 'candidateInventorySha256', 'baselineDeployment']}
                save(self.phase + '-deployment.json', safe)
                self.check('ready_exact_production', safe['id'] == deployment and safe['readyState'] == 'READY' and
                           safe['target'] == 'production' and safe['prebuilt'] is True and origin == 'https://' + safe['url'])
                self.check('deployment_project_team', safe['projectId'] == PROJECT and TEAM in [safe['teamId'], safe['ownerId']])
                self.check('deployment_commit_and_pin', safe['meta']['githubCommitSha'] == commit and safe['meta']['githubCommitRef'] == BRANCH and
                           safe['meta']['candidateInventorySha256'] == PIN and safe['meta']['baselineDeployment'] == BASELINE)
                if self.phase == 'isolated':
                    self.check('production_skip_domain', safe['alias'] == [] and safe['autoAssignCustomDomains'] is False)
                else:
                    prior = json.loads((AREA / 'isolated-deployment.json').read_text())
                    self.check('same_immutable_deployment_promoted_without_rebuild',
                               all(safe[key] == prior[key] for key in ['id', 'url', 'readyState', 'target', 'prebuilt', 'projectId', 'teamId', 'ownerId', 'source', 'meta']))
                    self.check('auto_assign_custom_domains_stays_false', safe['autoAssignCustomDomains'] is False)
                raw_aliases = api('/v2/deployments/' + deployment + '/aliases')
                names = [row.get('alias', row.get('hostname')) for row in raw_aliases.get('aliases', [])]
                self.check('expected_deployment_aliases', names == [] if self.phase == 'isolated' else {'sollahms.cl', 'www.sollahms.cl'}.issubset(names), names)
                save(self.phase + '-aliases.json', {'deployment': deployment, 'aliases': names})
                tree = list(flatten(api('/v6/deployments/' + deployment + '/files')))
                prefix = 'src/.vercel/output/'
                remote = {row['path'][len(prefix):]: row for row in tree if row['path'].startswith(prefix)}
                comparisons = []
                for path, want in sorted(expected.items()):
                    got = remote.get(path)
                    passed = bool(got and got['uid'] == want['sha1'] and (not isinstance(got.get('size'), int) or got['size'] == want['size']))
                    comparisons.append({'path': path, 'expectedSha1': want['sha1'], 'remoteSha1': got.get('uid') if got else None,
                                        'certifiedBytes': want['size'], 'remoteExplicitBytes': got.get('size') if got else None, 'pass': passed})
                save(self.phase + '-source-comparison.json', {'deployment': deployment, 'candidatePin': PIN, 'records': len(remote),
                                                        'matched': sum(row['pass'] for row in comparisons), 'comparisons': comparisons,
                                                        'noSourceBodiesDownloaded': True,
                                                        'sizeLimitation': 'Explicit API sizes checked when present; otherwise bound to identical remote SHA1 content addresses.'})
                self.check('1660_remote_source_paths_sha1', set(remote) == set(expected) and all(row['pass'] for row in comparisons),
                           {'expected': len(expected), 'remote': len(remote), 'matched': sum(row['pass'] for row in comparisons)})
                lambdas = [row for row in tree if row['type'] == 'lambda' and row['path'].startswith('out/api/')]
                save(self.phase + '-functions.json', {'deployment': deployment, 'registeredFunctions': lambdas, 'certifiedSourceFiles': 57})
                self.check('seven_registered_functions', len(lambdas) == 7 and {row['path'][4:] for row in lambdas} == FUNCTIONS)
                anonymous = json.loads(run(['/usr/bin/curl', '-q', '--silent', '--show-error', '--max-time', '45',
                                            '--output', '/dev/null', '--write-out', '%{json}', origin + '/']))
                safe_anonymous = {'status': anonymous.get('http_code', anonymous.get('response_code')),
                                  'locationHost': urlsplit(anonymous.get('redirect_url') or '').hostname,
                                  'sslVerifyResult': anonymous.get('ssl_verify_result'), 'redirectFollowed': False,
                                  'authenticationCookiesOrBypassUsed': False}
                save(self.phase + '-anonymous-sso.json', safe_anonymous)
                self.check('anonymous_sso_and_tls', safe_anonymous['status'] == 302 and safe_anonymous['locationHost'] == 'vercel.com'
                           and safe_anonymous['sslVerifyResult'] == 0)
                if self.phase == 'postpromotion':
                    github = json.loads((AREA / 'postpromotion-github.json').read_text())
                    self.check('postpromotion_pr_still_draft_unmerged', github['passed'])
                    preflight = json.loads((AREA / 'preflight.json').read_text())
                    since = int(datetime.fromisoformat(preflight['checkedAt']).timestamp() * 1000)
                    recent = api('/v6/deployments?projectId=' + PROJECT + '&target=production&since=' + str(since) + '&limit=100')
                    new = [{'id': row.get('uid', row.get('id')), 'state': row.get('state'), 'target': row.get('target'),
                            'created': row.get('created'), 'sourceSha': (row.get('meta') or {}).get('githubCommitSha')}
                           for row in recent['deployments']]
                    save('postpromotion-new-productions.json', {'sinceUTC': preflight['checkedAt'], 'productions': new, 'pagination': recent.get('pagination')})
                    self.check('only_one_new_production_created', len(new) == 1 and new[0]['id'] == deployment and
                               not (recent.get('pagination') or {}).get('next'), new)
            project_after, aliases_after = self.project('after'), self.aliases('after')
            self.check('project_stable_during_phase', project_before == project_after)
            self.check('aliases_stable_during_phase', aliases_before == aliases_after)
        except Exception as exc:
            self.failures.append({'check': 'execution', 'detail': str(exc) if isinstance(exc, RuntimeError) else type(exc).__name__})
        finally:
            summary = {'verifiedAtUTC': datetime.now(timezone.utc).isoformat(), 'phase': self.phase, 'passed': not self.failures,
                       'baselineDeployment': BASELINE, 'candidateInventorySha256': PIN,
                       'deployment': arguments.deployment, 'origin': arguments.origin, 'sourceCommit': arguments.commit,
                       'checks': self.checks, 'failures': self.failures,
                       'sourceBodiesDownloaded': 0, 'formsSubmitted': 0, 'providerLookups': 0, 'apiWrites': 0,
                       'buildsOrGenerators': 0, 'deploymentsCreatedOrPromoted': 0, 'settingsOrCredentialsModified': False,
                       'activeOwnProcessGroups': sorted(active)}
            save(self.phase + '-summary.json', summary)
            print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
            if self.failures:
                raise SystemExit(1)


if __name__ == '__main__':
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase', choices=['preflight', 'isolated', 'postpromotion'])
    parser.add_argument('--deployment')
    parser.add_argument('--origin')
    parser.add_argument('--commit')
    arguments = parser.parse_args()
    Verification(arguments.phase).execute(arguments)
