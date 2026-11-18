"""Read-only Vercel integrity checks. Uses existing CLI auth, never publishes."""
import argparse
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
PRODUCTION = 'dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
ENV = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG',
            'VERCEL_LOG_LEVEL', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID',
            'NOW_PROJECT_ID', 'NOW_ORG_ID', 'VERCEL_AUTOMATION_BYPASS_SECRET']:
    ENV.pop(key, None)
ENV['PATH'] = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'

def api(path):
    assert path.startswith('/') and '/env' not in path and 'secrets' not in path
    path += ('&' if '?' in path else '?') + 'teamId=' + TEAM
    response = subprocess.run([CLI, 'api', path, '--method', 'GET', '--scope', SCOPE, '--raw'],
                              cwd=DOCS, env=ENV, capture_output=True, timeout=55)
    assert response.returncode == 0, 'Authenticated read failed (response omitted).'
    return json.loads(response.stdout)

def flatten(value, parent=''):
    if isinstance(value, list):
        for row in value:
            yield from flatten(row, parent)
    elif isinstance(value, dict):
        if 'files' in value and not ('name' in value or 'path' in value):
            yield from flatten(value['files'], parent)
            return
        name = value.get('path', value.get('file', value.get('name', '')))
        path = name if value.get('path') or value.get('file') or name.startswith(('src/', 'out/')) else '/'.join(filter(None, [parent, name]))
        if isinstance(value.get('children'), list):
            yield from flatten(value['children'], path)
        elif path:
            yield {'path': path, 'type': value.get('type'), 'uid': value.get('uid', value.get('sha1', value.get('sha'))), 'size': value.get('size')}

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def main(baseline):
    created = {} if baseline else json.loads((DOCS / 'preview-created.json').read_text())
    deployment = PRODUCTION if baseline else created['deploymentId']
    manifest = json.loads((ROOT / ('docs/centro-auditoria-20261116/candidate-manifest.json' if baseline else 'docs/footer-sin-frase-20261116/candidate-manifest.json')).read_text())
    expected = {r['path']: r for r in manifest['inventory']}
    canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(expected.values(), key=lambda r: r['path'])).encode()
    pin = hashlib.sha256(canonical).hexdigest()
    assert len(expected) == 1660 and pin == manifest['outputInventorySha256']
    if baseline:
        assert pin == 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
    checks = []
    def check(name, passed, detail=None):
        checks.append({'name': name, 'passed': bool(passed), 'detail': detail})
    raw = api('/v13/deployments/' + deployment)
    metadata = {k: raw.get(k) for k in ['id', 'url', 'name', 'readyState', 'target', 'prebuilt', 'projectId', 'teamId', 'ownerId', 'source', 'alias']}
    metadata['meta'] = {k: (raw.get('meta') or {}).get(k) for k in ['githubCommitSha', 'githubCommitRef', 'candidateInventorySha256', 'baselineDeployment']}
    check('deployment identity / project / team', raw['id'] == deployment and raw['projectId'] == PROJECT and TEAM in [raw.get('teamId'), raw.get('ownerId')])
    check('ready and intended environment', raw['readyState'] == 'READY' and (raw.get('target') == 'production' if baseline else raw.get('target') in [None, 'preview']))
    check('prebuilt artifact', raw.get('prebuilt') is True)
    if not baseline:
        check('exact source commit and artifact metadata', metadata['meta'] == {'githubCommitSha': created['sourceCommit'], 'githubCommitRef': 'codex/footer-sin-frase-20261116', 'candidateInventorySha256': pin, 'baselineDeployment': PRODUCTION})
    project = api('/v9/projects/' + PROJECT)
    settings = {k: project.get(k) for k in ['id', 'accountId', 'ssoProtection', 'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'nodeVersion', 'paused']}
    check('SSO and disabled automatic deployment preserved', settings['id'] == PROJECT and settings['accountId'] == TEAM and settings['ssoProtection']['deploymentType'] == 'all_except_custom_domains' and settings['autoAssignCustomDomains'] is False and settings['previewDeploymentsDisabled'] is True)
    aliases = []
    for host in ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl']:
        alias = api('/v4/aliases/' + host)
        safe = {'host': host, **{k: alias.get(k) for k in ['deploymentId', 'projectId', 'redirect', 'redirectStatusCode', 'updatedAt']}}
        aliases.append(safe)
        check('production unchanged: ' + host, safe['deploymentId'] == PRODUCTION and safe['projectId'] == PROJECT and (host == 'sollahms.cl' or (safe['redirect'] == 'sollahms.cl' and safe['redirectStatusCode'] == 308)))
    tree = list(flatten(api('/v6/deployments/' + deployment + '/files')))
    prefix = 'src/.vercel/output/'
    remote = {r['path'][len(prefix):]: r for r in tree if r['path'].startswith(prefix)}
    comparisons = [{'path': path, 'expectedSha1': want['sha1'], 'remoteSha1': (remote.get(path) or {}).get('uid'), 'sha256': want['sha256'], 'size': want['size'], 'passed': (remote.get(path) or {}).get('uid') == want['sha1'] and ((remote.get(path) or {}).get('size') in [None, want['size']])} for path, want in sorted(expected.items())]
    check('complete remote inventory matches all 1660 paths and SHA1', set(remote) == set(expected) and all(r['passed'] for r in comparisons), {'expected': len(expected), 'actual': len(remote), 'matching': sum(r['passed'] for r in comparisons)})
    lambdas = sorted(r['path'] for r in tree if r['type'] == 'lambda' and r['path'].startswith('out/api/'))
    check('seven functions registered unchanged', lambdas == ['out/api/' + n for n in ['advisory', 'booking-availability', 'booking-create', 'collaboration', 'contact', 'orientation-contact', 'uf']])
    if not baseline:
        result = subprocess.run(['/usr/bin/curl', '-q', '--silent', '--show-error', '--max-time', '40', '--output', '/dev/null', '--write-out', '%{json}', 'https://' + raw['url'] + '/'], capture_output=True, timeout=45)
        assert result.returncode == 0, 'Anonymous TLS check failed.'
        anonymous = json.loads(result.stdout)
        sso = {'status': anonymous.get('http_code', anonymous.get('response_code')), 'locationHost': urlsplit(anonymous.get('redirect_url') or '').hostname, 'sslVerifyResult': anonymous.get('ssl_verify_result'), 'followedRedirects': False}
        check('anonymous Preview requires Vercel SSO with valid TLS', sso['status'] == 302 and sso['locationHost'] == 'vercel.com' and sso['sslVerifyResult'] == 0, sso)
    label = 'production' if baseline else 'preview'
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'passed': all(c['passed'] for c in checks), 'deployment': deployment, 'outputInventorySha256': pin, 'metadata': metadata, 'projectSettings': settings, 'productionAliases': aliases, 'functions': lambdas, 'checks': checks, 'fullSourceFileCount': len(remote), 'functionSourceFiles': sum(p.startswith('functions/') for p in remote), 'sizeLimitation': 'Remote SHA1 content addresses bind the certified local SHA256 and size; explicit remote sizes checked when supplied.', 'formsSubmitted': 0, 'apiWrites': 0, 'promotions': 0}
    save(DOCS / 'verification' / (label + '-source-comparison.json'), comparisons)
    save(DOCS / 'verification' / (label + '-summary.json'), report)
    print(json.dumps({'mode': label, 'passed': report['passed'], 'checks': len(checks), 'matchedFiles': sum(r['passed'] for r in comparisons), 'failures': [c for c in checks if not c['passed']]}))
    assert report['passed'], 'Integrity check failed; inspect report before proceeding.'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', action='store_true')
    main(parser.parse_args().baseline)
