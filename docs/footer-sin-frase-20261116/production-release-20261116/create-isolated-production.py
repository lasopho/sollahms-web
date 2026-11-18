"""Execute the owner's one authorized prebuilt Production, without domains."""
import hashlib
import json
import os
import re
import signal
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[2]
STAGE = ROOT / '.vercel/footer-sin-frase-20261116/stage'
OUTPUT = STAGE / '.vercel/output'
WORK = ROOT / '.vercel/footer-production-release-20261116'
PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
HEAD = 'b761ddeaea2fa526870e6af25658046e31b571d7'
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
def read(name):
    return json.loads((DOCS / name).read_text())
auth = read('authorization.json')
local = read('local-artifact-verification.json')
connected = read('preflight-connected.json')
preflight = read('verification/preflight.json')
assert auth['explicitAuthorization'] and auth['productionCreationAuthorized'] and auth['maximumNewProductionDeployments'] == 1
assert auth['candidateInventorySha256'] == PIN and auth['sourceHead'] == HEAD
assert local.get('passed', local.get('status') == 'PASS')
assert connected['status'] == 'PASS' and preflight['passed']
assert (datetime.now(ZoneInfo('America/Santiago')) - datetime.fromisoformat(preflight['checkedAt'])).total_seconds() < 1800
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == HEAD
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == auth['branch']
changes = subprocess.check_output(['git', 'diff', HEAD, '--name-only'], cwd=ROOT, text=True).splitlines()
assert all(p == 'NEXT-PROMPT.md' or p.startswith('docs/footer-sin-frase-20261116/') for p in changes), changes
assert not subprocess.check_output(['git', 'diff', 'd4d67bc298bbb8e78e7ba91867b49c1e4fd09772', '--', 'index.html', 'proyectos.html', 'vercel.json', 'assets', 'api', 'lib', 'data'], cwd=ROOT)
manifest = json.loads((DOCS.parent / 'candidate-manifest.json').read_text())
rows = manifest['inventory']
canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest() == manifest['outputInventorySha256'] == PIN
assert len(rows) == 1660 and manifest['changedFiles'] == 2 and manifest['identicalFiles'] == 1658
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()} == {r['path'] for r in rows}
for row in rows:
    path = OUTPUT / row['path']
    assert not path.is_symlink()
    body = path.read_bytes()
    assert (len(body), hashlib.sha1(body).hexdigest(), hashlib.sha256(body).hexdigest()) == (row['size'], row['sha1'], row['sha256'])
assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
assert json.loads((STAGE / '.vercel/project.json').read_text()) == {'projectId': auth['projectId'], 'orgId': auth['teamId'], 'projectName': 'project-wrapp'}
record = {'requestedAt': datetime.now(ZoneInfo('America/Santiago')).isoformat(), 'target': 'production', 'skipDomain': True,
          'prebuilt': True, 'sourceCommit': HEAD, 'implementationCommit': auth['implementationCommit'],
          'candidateInventorySha256': PIN, 'baselineDeployment': auth['baselineDeployment'],
          'sourcePreviewDeployment': auth['candidateDeployment'], 'authorizationSha256': hashlib.sha256((DOCS / 'authorization.json').read_bytes()).hexdigest(),
          'state': 'started', 'artifactOutput': str(OUTPUT), 'nodeVersion': '24.22.3', 'vercelCliVersion': '65.16.0'}
WORK.mkdir(parents=True, exist_ok=True)
attempt = WORK / 'production-create-attempt.json'
with attempt.open('x') as handle:
    json.dump(record, handle, indent=2)
env = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL', 'VERCEL_PROJECT_ID',
            'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID', 'VERCEL_AUTOMATION_BYPASS_SECRET']:
    env.pop(key, None)
env['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
args = [NODE, CLI, 'deploy', '--prebuilt', '--environment=production', '--skip-domain', '--project', auth['projectId'],
        '--scope', 'lsandoval2-8260s-projects', '--yes', '--json', '--meta', 'githubCommitRef=' + auth['branch'],
        '--meta', 'githubCommitSha=' + HEAD, '--meta', 'candidateInventorySha256=' + PIN,
        '--meta', 'baselineDeployment=' + auth['baselineDeployment'], '--meta', 'sourcePreviewDeployment=' + auth['candidateDeployment']]
process = subprocess.Popen(args, cwd=STAGE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
try:
    out, err = process.communicate(timeout=300)
except BaseException:
    os.killpg(process.pid, signal.SIGTERM)
    try:
        process.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.communicate(timeout=5)
    record['state'] = 'interrupted-check-remote-before-any-retry'
    attempt.write_text(json.dumps(record, indent=2) + '\n')
    raise
if process.returncode:
    diagnostic = '\n'.join(line for line in err.decode(errors='replace').splitlines() if line.startswith(('Error:', 'error:')))
    diagnostic = re.sub(r'https?://\S+', '[URL]', diagnostic)[:800]
    diagnostic = re.sub(r'(?i)(bearer\s+|token[=: ]+)[^\s]+', r'\1[REDACTED]', diagnostic)
    record.update(state='failed-check-remote-before-any-retry', exitCode=process.returncode, diagnostic=diagnostic)
    attempt.write_text(json.dumps(record, indent=2) + '\n')
    (DOCS / 'CREATION-STOPPED.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record, indent=2))
    raise RuntimeError('Creation failed; stop and inspect remote state. Do not create a second Production.')
data = json.loads(out)
deployment = data.get('deployment', data)
record.update(state='created', completedAt=datetime.now(ZoneInfo('America/Santiago')).isoformat(),
              deploymentId=deployment.get('id') or deployment.get('uid') or deployment.get('deploymentId'), url=deployment.get('url'),
              readyState=deployment.get('readyState') or deployment.get('state'), reportedTarget=deployment.get('target'))
assert record['deploymentId'] and record['url'] and record['reportedTarget'] == 'production'
attempt.write_text(json.dumps(record, indent=2) + '\n')
(DOCS / 'created.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
