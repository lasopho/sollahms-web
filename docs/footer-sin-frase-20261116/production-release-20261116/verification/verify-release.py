#!/usr/bin/env python3
"""Read-only release gates. Native authenticated Vercel GETs only; never deploy.

The connected preflight supplies the separately checked GitHub HEAD/PR facts.
Native file trees are required because the connected tree is truncated.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
PHASE = HERE.parent
DOCS = PHASE.parent
ROOT = DOCS.parents[1]
spec = importlib.util.spec_from_file_location('footer_readonly_integrity', DOCS / 'remote-integrity.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
api, flatten, ENV = native.api, native.flatten, native.ENV
PROJECT, TEAM = native.PROJECT, native.TEAM
BASELINE = 'dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
PREVIEW = 'dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF'
SOURCE_COMMIT = 'b761ddeaea2fa526870e6af25658046e31b571d7'
IMPLEMENTATION = 'd4d67bc298bbb8e78e7ba91867b49c1e4fd09772'
BRANCH = 'codex/footer-sin-frase-20261116'
PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
BASE_PIN = 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
HOSTS = ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl']
FUNCTIONS = ['out/api/' + name for name in ['advisory', 'booking-availability', 'booking-create',
             'collaboration', 'contact', 'orientation-contact', 'uf']]


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def load(path):
    return json.loads(path.read_text())


def digest(body):
    return hashlib.sha256(body).hexdigest()


def inventory_hash(rows):
    return digest(''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n"
                         for r in sorted(rows, key=lambda row: row['path'])).encode())


def safe_deployment(raw):
    result = {key: raw.get(key) for key in ['id', 'url', 'name', 'readyState', 'target', 'prebuilt',
              'projectId', 'teamId', 'ownerId', 'source', 'createdAt', 'alias']}
    result['meta'] = {key: (raw.get('meta') or {}).get(key) for key in ['githubCommitSha',
        'githubCommitRef', 'candidateInventorySha256', 'baselineDeployment', 'sourcePreviewDeployment']}
    return result


def safe_project(raw):
    return {key: raw.get(key) for key in ['id', 'name', 'accountId', 'ssoProtection',
            'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'nodeVersion', 'paused']}


def anonymous_sso(raw):
    host = raw['url']
    assert urlsplit('https://' + host).hostname == host and host.endswith('.vercel.app')
    result = subprocess.run(['/usr/bin/curl', '-q', '--silent', '--show-error', '--max-time', '40',
             '--output', '/dev/null', '--write-out', '%{json}', 'https://' + host + '/'],
             capture_output=True, timeout=45, env=ENV)
    assert result.returncode == 0, 'Anonymous TLS GET failed; response omitted.'
    data = json.loads(result.stdout)
    return {'hostname': host, 'status': data.get('http_code', data.get('response_code')),
            'locationHost': urlsplit(data.get('redirect_url') or '').hostname,
            'sslVerifyResult': data.get('ssl_verify_result'), 'followedRedirects': False}


def verify(mode):
    now = datetime.now(timezone.utc)
    report = {'mode': mode, 'checkedAt': now.astimezone(ZoneInfo('America/Santiago')).isoformat(),
              'checkedAtUTC': now.isoformat(),
              'checkedAtTimezone': now.astimezone(ZoneInfo('America/Santiago')).isoformat(),
              'timezone': 'America/Santiago', 'passed': False, 'checks': [],
              'baselineDeployment': BASELINE, 'sourcePreviewDeployment': PREVIEW,
              'sourceCommit': SOURCE_COMMIT, 'outputInventorySha256': PIN,
              'baselineInventorySha256': BASE_PIN, 'apiMethod': 'GET',
              'networkWrites': 0, 'formsSubmitted': 0, 'ufRequests': 0,
              'deploymentsCreated': 0, 'promotions': 0, 'buildersOrGeneratorsExecuted': 0}
    checks = report['checks']
    comparisons = {}

    def check(name, passed, detail=None):
        checks.append({'name': name, 'passed': bool(passed), 'detail': detail})
        assert passed, name

    def metadata_check(raw, deployment, production=True):
        check('identity/project/team: ' + deployment, raw.get('id') == deployment
              and raw.get('projectId') == PROJECT and TEAM in [raw.get('ownerId'), raw.get('teamId')])
        check('READY, prebuilt, intended environment: ' + deployment,
              raw.get('readyState') == 'READY' and raw.get('prebuilt') is True
              and (raw.get('target') == 'production' if production else raw.get('target') in [None, 'preview']))

    def compare_tree(raw_tree, expected_rows, label):
        tree = list(flatten(raw_tree))
        prefix = 'src/.vercel/output/'
        source = [row for row in tree if row['path'].startswith(prefix)]
        remote = {row['path'][len(prefix):]: row for row in source}
        expected = {row['path']: row for row in expected_rows}
        rows = [{'path': path, 'expectedSha1': row['sha1'],
                 'remoteSha1': (remote.get(path) or {}).get('uid'), 'sha256': row['sha256'],
                 'size': row['size'], 'remoteSize': (remote.get(path) or {}).get('size'),
                 'passed': (remote.get(path) or {}).get('uid') == row['sha1']
                 and (remote.get(path) or {}).get('size') in [None, row['size']]}
                for path, row in sorted(expected.items())]
        comparisons[label] = rows
        check(label + ': all 1660 source paths/SHA1/available sizes exact', len(source) == len(remote) == 1660
              and set(remote) == set(expected) and all(row['passed'] for row in rows),
              {'expected': len(expected), 'actual': len(remote), 'matching': sum(row['passed'] for row in rows)})
        functions = sorted(row['path'] for row in tree if row['type'] == 'lambda' and row['path'].startswith('out/api/'))
        check(label + ': seven registered functions, 57 exact function files', functions == FUNCTIONS
              and sum(path.startswith('functions/') for path in remote) == 57,
              {'functions': functions, 'functionFiles': sum(path.startswith('functions/') for path in remote)})
        return remote

    try:
        manifest = load(DOCS / 'candidate-manifest.json')
        candidate, baseline = manifest['inventory'], manifest['baselineInventory']
        check('complete pinned inventories', len(candidate) == len(baseline) == 1660
              and inventory_hash(candidate) == PIN and inventory_hash(baseline) == BASE_PIN
              and manifest['outputInventorySha256'] == PIN and manifest['baselineInventorySha256'] == BASE_PIN)
        connected = load(PHASE / 'preflight-connected.json')
        gh = connected['github']
        expected_gh = connected['expected']
        check('connected GitHub source HEAD and open unmerged Draft PR #31',
              connected.get('status') == 'PASS' and all(row.get('pass', row.get('passed')) for row in connected['checks'])
              and expected_gh['sourceHead'] == SOURCE_COMMIT
              and gh['head']['sha'] == gh['pullRequest']['head']['sha'] == SOURCE_COMMIT
              and gh['pullRequest']['head']['ref'] == BRANCH and gh['pullRequest']['number'] == 31
              and gh['pullRequest']['state'] == 'open' and gh['pullRequest']['draft'] is True
              and gh['pullRequest']['merged'] is False and gh['pullRequest'].get('autoMerge') is None)
        head = git('rev-parse', 'HEAD').decode().strip()
        runtime_changes = git('diff', '--name-only', IMPLEMENTATION, head, '--',
                              ':(exclude)docs/**', ':(exclude)NEXT-PROMPT.md').decode().splitlines()
        dirty_runtime = git('diff', '--name-only', 'HEAD', '--',
                            ':(exclude)docs/**', ':(exclude)NEXT-PROMPT.md').decode().splitlines()
        check('local HEAD allowed; runtime equals certified implementation and is clean',
              not runtime_changes and not dirty_runtime and git('merge-base', '--is-ancestor', SOURCE_COMMIT, head) == b'',
              {'localHead': head, 'declaredSourceCommit': SOURCE_COMMIT,
               'runtimeChangesSinceImplementation': runtime_changes, 'workingRuntimeChanges': dirty_runtime})
        report['headAndPr'] = {'connectedCheckedAtUTC': connected['checkedAtUtc'],
                              'sourceHead': SOURCE_COMMIT, 'localHead': head, 'pullRequest': gh['pullRequest']}
        target = BASELINE
        created = None
        preflight = None
        if mode != 'preflight':
            preflight = load(HERE / 'preflight-summary.json')
            check('preflight gate approved before creation', preflight.get('passed') is True
                  and preflight['outputInventorySha256'] == PIN and preflight['sourceCommit'] == SOURCE_COMMIT)
            created = load(PHASE / 'created.json')
            target = created['deploymentId']
            check('creation receipt is a new isolated prebuilt Production of exact approved source',
                  target not in [BASELINE, PREVIEW] and created.get('state') == 'created'
                  and created.get('target') == 'production' and created.get('skipDomain') is True
                  and created.get('prebuilt') is True and created.get('sourceCommit') == SOURCE_COMMIT
                  and created.get('candidateInventorySha256') == PIN
                  and created.get('baselineDeployment') == BASELINE
                  and created.get('sourcePreviewDeployment') == PREVIEW)
            if mode == 'postpromotion':
                confirmation = load(PHASE / 'promotion-confirmed.json')
                check('promoted exactly the same isolated verified deployment',
                      confirmation.get('deploymentId') == target
                      and confirmation.get('sameVerifiedDeployment') is True and confirmation.get('rebuild') is False
                      and confirmation.get('candidateInventorySha256') == PIN)
        report['deployment'] = target
        requests = {
            'baseline': '/v13/deployments/' + BASELINE,
            'project': '/v9/projects/' + PROJECT,
            'recent': '/v6/deployments?projectId=' + PROJECT + '&target=production&limit=20',
            'defaultDomain': '/v13/deployments/project-wrapp.vercel.app',
            **{'alias:' + host: '/v4/aliases/' + host for host in HOSTS},
        }
        if mode == 'preflight':
            requests.update(preview='/v13/deployments/' + PREVIEW,
                            baselineTree='/v6/deployments/' + BASELINE + '/files',
                            previewTree='/v6/deployments/' + PREVIEW + '/files')
        else:
            requests.update(target='/v13/deployments/' + target,
                            targetTree='/v6/deployments/' + target + '/files')
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {name: pool.submit(api, path) for name, path in requests.items()}
            raw = {name: future.result() for name, future in futures.items()}
        metadata_check(raw['baseline'], BASELINE)
        report['baselineMetadata'] = safe_deployment(raw['baseline'])
        settings = safe_project(raw['project'])
        check('native project/team/node24/SSO/automatic deployment settings preserved',
              settings['id'] == PROJECT and settings['accountId'] == TEAM and settings['nodeVersion'] == '24.x'
              and (settings['ssoProtection'] or {}).get('deploymentType') == 'all_except_custom_domains'
              and settings['autoAssignCustomDomains'] is False and settings['previewDeploymentsDisabled'] is True)
        if preflight:
            check('native settings exactly equal pre-creation gate', settings == preflight['safeProject'])
        report['safeProject'] = settings
        aliases = []
        expected_alias_target = target if mode == 'postpromotion' else BASELINE
        for host in HOSTS:
            alias = raw['alias:' + host]
            safe = {'host': host, **{key: alias.get(key) for key in ['deploymentId', 'projectId',
                    'redirect', 'redirectStatusCode', 'updatedAt']}}
            aliases.append(safe)
            check('custom alias correct with original redirect: ' + host,
                  safe['deploymentId'] == expected_alias_target and safe['projectId'] == PROJECT
                  and (safe['redirect'] in [None, ''] if host == 'sollahms.cl'
                       else safe['redirect'] == 'sollahms.cl' and safe['redirectStatusCode'] == 308))
        report['productionAliases'] = aliases
        default_domain = raw['defaultDomain']
        check('Vercel default domain resolves intended production deployment',
              default_domain.get('id') == expected_alias_target and default_domain.get('projectId') == PROJECT
              and default_domain.get('readyState') == 'READY')
        report['defaultDomain'] = {'hostname': 'project-wrapp.vercel.app',
                                  'deployment': safe_deployment(default_domain)}
        if mode == 'preflight':
            metadata_check(raw['preview'], PREVIEW, production=False)
            check('Preview remains bound to certified implementation, branch and pin',
                  (raw['preview'].get('meta') or {}).get('githubCommitSha') == IMPLEMENTATION
                  and (raw['preview'].get('meta') or {}).get('githubCommitRef') == BRANCH
                  and (raw['preview'].get('meta') or {}).get('candidateInventorySha256') == PIN
                  and (raw['preview'].get('meta') or {}).get('baselineDeployment') == BASELINE)
            report['previewMetadata'] = safe_deployment(raw['preview'])
            compare_tree(raw['baselineTree'], baseline, 'baseline')
            compare_tree(raw['previewTree'], candidate, 'preview')
        else:
            metadata_check(raw['target'], target)
            report['metadata'] = safe_deployment(raw['target'])
            expected_meta = {'githubCommitSha': SOURCE_COMMIT, 'githubCommitRef': BRANCH,
                             'candidateInventorySha256': PIN, 'baselineDeployment': BASELINE,
                             'sourcePreviewDeployment': PREVIEW}
            check('Production exact source/branch/pin/baseline/Preview metadata',
                  report['metadata']['meta'] == expected_meta)
            remote = compare_tree(raw['targetTree'], candidate, mode)
            baseline_by_path = {row['path']: row for row in baseline}
            candidate_by_path = {row['path']: row for row in candidate}
            identical = [path for path in baseline_by_path if baseline_by_path[path] == candidate_by_path[path]]
            projects = load(ROOT / 'data/proyectos.json')
            fiches = ['static/' + project['slug'] + '.html' for project in projects]
            check('1658 unchanged baseline files including all 131 fiches', len(identical) == 1658
                  and len(set(fiches)) == len(fiches) == 131 and all(path in identical for path in fiches)
                  and all(remote[path]['uid'] == baseline_by_path[path]['sha1'] for path in identical))
            report['baselineIdenticalFiles'] = 1658
            report['projectFichesIdentical'] = 131
            anon = anonymous_sso(raw['target'])
            check('new immutable hostname remains protected by SSO with valid TLS',
                  anon['status'] == 302 and anon['locationHost'] == 'vercel.com'
                  and anon['sslVerifyResult'] == 0, anon)
            report['anonymousProtection'] = anon
        recent = raw['recent'].get('deployments', [])
        recent_safe = [{'id': row.get('uid', row.get('id')), 'target': row.get('target'),
                        'state': row.get('readyState', row.get('state')),
                        'createdAt': row.get('createdAt', row.get('created'))} for row in recent]
        ids = [row['id'] for row in recent_safe]
        check('recent native Production window bounded, unique, includes HWs',
              0 < len(ids) <= 20 and len(ids) == len(set(ids)) and BASELINE in ids)
        inflight = [row for row in recent_safe if row['state'] not in ['READY', 'ERROR', 'CANCELED', 'CANCELLED']]
        check('no in-flight Production deployment', not inflight, inflight)
        baseline_time = raw['baseline']['createdAt']
        newer = [row['id'] for row in recent_safe if row['createdAt'] > baseline_time]
        if mode == 'preflight':
            check('no Production newer than current HWs', not newer, newer)
            new_ids = []
        else:
            new_ids = sorted(set(ids) - set(preflight['recentProductionIDs']))
            check('only our one new Production exists since preflight', new_ids == [target]
                  and set(newer) == {target}, {'newProductionIDs': new_ids, 'newerThanHWs': newer})
        report['recentProductionIDs'] = ids
        report['recentProduction'] = recent_safe
        report['newProductionIDsSincePreflight'] = new_ids
        authorization = load(PHASE / 'authorization.json')
        authorization_time = datetime.fromisoformat(authorization['recordedAt']).timestamp() * 1000
        since_authorization = [row['id'] for row in recent_safe if row['createdAt'] > authorization_time]
        check('authorized window contains zero preflight or exactly our one subsequent Production',
              not since_authorization if mode == 'preflight' else set(since_authorization) == {target},
              {'authorizationRecordedAt': authorization['recordedAt'],
               'productionIDsSinceAuthorization': since_authorization})
        report['productionIDsSinceAuthorization'] = since_authorization
        report['passed'] = True
    except Exception as error:
        report['passed'] = False
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        report['finishedAtUTC'] = datetime.now(timezone.utc).isoformat()
        report['sizeLimitation'] = 'Remote SHA1 content addresses bind the certified local SHA256 and size; explicit remote sizes checked when supplied.'
        for name, rows in comparisons.items():
            save(HERE / (mode + '-' + name + '-source-comparison.json'), rows)
        save(HERE / (mode + '-summary.json'), report)
        if mode == 'preflight':
            save(HERE / 'preflight.json', report)
        print(json.dumps({'mode': mode, 'passed': report['passed'], 'checks': len(checks),
              'passedChecks': sum(check['passed'] for check in checks),
              'summary': str(HERE / (mode + '-summary.json')),
              'recentProductionIDs': report.get('recentProductionIDs'),
              'failures': [check for check in checks if not check['passed']], 'error': report.get('error')}))
    assert report['passed'], 'Read-only release gate failed; inspect summary before proceeding.'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--preflight', action='store_true')
    group.add_argument('--isolated', action='store_true')
    group.add_argument('--postpromotion', action='store_true')
    args = parser.parse_args()
    verify('preflight' if args.preflight else 'isolated' if args.isolated else 'postpromotion')
