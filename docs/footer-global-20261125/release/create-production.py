"""Create one prebuilt isolated Production after the complete current footer audit."""
import hashlib
import json
import os
import signal
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[2]
WORK = ROOT / '.vercel/footer-global-20261125'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
SCOPE = 'lsandoval2-8260s-projects'
def read(path):
    return json.loads(path.read_text())
auth = read(DOCS / 'authorization.json')
manifest = read(DOCS.parent / 'candidate-manifest.json')
qa = read(DOCS.parent / 'audit-matrix.json')
http = read(DOCS.parent / 'qa/http-baseline/results.json')
reference = read(DOCS.parent / 'qa/baseline-home.json')
preflight = read(DOCS / 'verification/preflight-summary.json')
assert auth['explicitAuthorization'] and auth['productionCreationAuthorized'] and auth['maximumNewProductionDeployments'] == 1
assert preflight['passed'] and qa['passed']
assert http['passed'] and http['summary']['htmlPagesVerified'] == 168
assert reference['passed'] and [r['width'] for r in reference['widths']] == [1440,1280,768,390,320]
assert qa['inventorySHA256'] == http['artifactPin'] == manifest['inventorySHA256']
assert reference['baselineInventorySHA256'] == manifest['inventorySHA256']
pin = manifest['inventorySHA256']
rows = manifest['inventory']
assert len(rows) == 1729 and manifest['baselineDeployment'] == auth['baselineDeployment']
canonical = ''.join(f"{r['path']}\t{r['bytes']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest() == pin
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()} == {r['path'] for r in rows}
for row in rows:
    path = OUTPUT / row['path']
    assert not path.is_symlink()
    body = path.read_bytes()
    assert (len(body), hashlib.sha1(body).hexdigest(), hashlib.sha256(body).hexdigest()) == (row['bytes'], row['sha1'], row['sha256'])
assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
assert branch == auth['branch']
assert not subprocess.check_output(['git', 'diff', '--name-only', 'HEAD', '--', ':(exclude)docs/**', ':(exclude)NEXT-PROMPT.md'], cwd=ROOT)
assert json.loads((ROOT / 'vercel.json').read_text())['git']['deploymentEnabled'][branch] is False
binding = read(STAGE / '.vercel/project.json')
assert binding['projectId'] == auth['projectId'] and binding['orgId'] == auth['teamId']
env = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL',
            'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID', 'VERCEL_AUTOMATION_BYPASS_SECRET']:
    env.pop(key, None)
env['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
def api(path):
    assert path.startswith('/') and '/env' not in path and 'secrets' not in path
    path += ('&' if '?' in path else '?') + 'teamId=' + auth['teamId']
    proc = subprocess.run([NODE, CLI, 'api', path, '--method', 'GET', '--scope', SCOPE, '--raw'], cwd=STAGE, env=env, capture_output=True, timeout=50)
    assert proc.returncode == 0, 'Fresh read failed; no deployment created.'
    return json.loads(proc.stdout)
project = api('/v9/projects/' + auth['projectId'])
assert project['id'] == auth['projectId'] and project['accountId'] == auth['teamId']
assert project['ssoProtection']['deploymentType'] == 'all_except_custom_domains'
assert project['autoAssignCustomDomains'] is False and project['previewDeploymentsDisabled'] is True
since = int(datetime.fromisoformat(auth['recordedAt']).timestamp() * 1000)
recent = api('/v6/deployments?projectId=' + auth['projectId'] + '&target=production&since=' + str(since) + '&limit=100')
assert not recent['deployments'], 'Concurrent Production exists; reconcile before creating the candidate.'
aliases = [api('/v4/aliases/' + host) for host in ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl']]
assert all(row['deploymentId'] == auth['baselineDeployment'] for row in aliases), 'Production advanced; reconcile first.'
assert all(row.get('redirect') == 'sollahms.cl' and row.get('redirectStatusCode') == 308 for row in aliases[1:])
record = {'requestedAt': datetime.now(ZoneInfo('America/Santiago')).isoformat(), 'target': 'production', 'prebuilt': True,
    'skipDomain': True, 'sourceCommit': head, 'branch': branch, 'baselineDeployment': auth['baselineDeployment'],
    'candidateInventorySHA256': pin, 'files': 1729, 'htmlPages': 168, 'state': 'started',
    'authorizationSHA256': hashlib.sha256((DOCS / 'authorization.json').read_bytes()).hexdigest(),
    'baselineAuditSHA256': hashlib.sha256((DOCS.parent / 'audit-matrix.json').read_bytes()).hexdigest(),
    'baselineHTTPSHA256': hashlib.sha256((DOCS.parent / 'qa/http-baseline/results.json').read_bytes()).hexdigest(),
    'referenceSHA256': hashlib.sha256((DOCS.parent / 'qa/baseline-home.json').read_bytes()).hexdigest()}
attempt = WORK / 'production-create-attempt.json'
with attempt.open('x') as handle:
    json.dump(record, handle, indent=2)
args = [NODE, CLI, 'deploy', '--prebuilt', '--environment=production', '--skip-domain', '--project', auth['projectId'],
    '--scope', SCOPE, '--yes', '--json', '--meta', 'githubCommitRef=' + branch, '--meta', 'githubCommitSha=' + head,
    '--meta', 'githubOrg=lasopho', '--meta', 'githubRepo=sollahms-web',
    '--meta', 'candidateInventorySHA256=' + pin, '--meta', 'baselineDeployment=' + auth['baselineDeployment']]
proc = subprocess.Popen(args, cwd=STAGE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
try:
    out, err = proc.communicate(timeout=300)
except BaseException:
    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.communicate(timeout=5)
    record['state'] = 'interrupted-inspect-remote-before-any-retry'
    attempt.write_text(json.dumps(record, indent=2) + '\n')
    raise
if proc.returncode:
    record.update(state='failed-inspect-remote-before-any-retry', exitCode=proc.returncode, stdoutBytes=len(out), stderrBytes=len(err))
    attempt.write_text(json.dumps(record, indent=2) + '\n')
    raise RuntimeError('Creation failed; inspect remote. Do not create a second Production blindly.')
data = json.loads(out)
deployment = data.get('deployment', data)
record.update(state='created', completedAt=datetime.now(ZoneInfo('America/Santiago')).isoformat(),
    deploymentId=deployment.get('id') or deployment.get('uid') or deployment.get('deploymentId'),
    url=deployment.get('url'), readyState=deployment.get('readyState') or deployment.get('state'), reportedTarget=deployment.get('target'))
assert record['deploymentId'] and record['url'] and record['reportedTarget'] == 'production'
attempt.write_text(json.dumps(record, indent=2) + '\n')
(DOCS / 'created.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
