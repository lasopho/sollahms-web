"""Create one prebuilt Production without aliases after the owner's explicit grant."""
import datetime
import hashlib
import json
import os
import re
import signal
import subprocess
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[2]
WORK = ROOT / '.vercel/contacto-production-release-20261116'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
EXPECTED = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
manifest = json.loads((DOCS.parent / 'candidate-manifest.json').read_text())
auth = json.loads((DOCS / 'authorization.json').read_text())
preflight = json.loads((DOCS / 'preflight-native.json').read_text())
connected = json.loads((DOCS / 'preflight-connected.json').read_text())
assert auth['explicitAuthorization'] and auth['productionCreationAuthorized']
assert auth['maximumNewProductionDeployments'] == 1 and auth['candidateInventorySha256'] == EXPECTED
assert preflight['passed'] and all(preflight['checks'].values())
checked = datetime.datetime.fromisoformat(preflight['checkedAt'])
assert (datetime.datetime.now(ZoneInfo('America/Santiago')) - checked).total_seconds() < 1800
assert all(a['deploymentId'] == auth['baselineDeployment'] for a in connected['aliases'])
assert connected['recentProductionDeployments'][0]['id'] == auth['baselineDeployment']
assert all(p['state'] == 'open' and p['draft'] and not p['merged'] for p in connected['pullRequests'])
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
assert head == preflight['localHead'] == '534bf362b8960e275f5b8b42b5c786027906a4cb'
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--', 'contacto.html', 'vercel.json'], cwd=ROOT)
rows = manifest['inventory']
canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest() == manifest['outputInventorySha256'] == EXPECTED
assert len(rows) == 1660 and manifest['changedFiles'] == 1 and manifest['identicalFiles'] == 1659
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()} == {r['path'] for r in rows}
for row in rows:
    path = OUTPUT / row['path']
    assert not path.is_symlink()
    body = path.read_bytes()
    assert (len(body), hashlib.sha1(body).hexdigest(), hashlib.sha256(body).hexdigest()) == (row['size'], row['sha1'], row['sha256']), row['path']
assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
attempt = WORK / 'production-create-attempt.json'
receipt = {'requestedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(), 'target': 'production', 'skipDomain': True, 'state': 'started', 'sourceCommit': head, 'candidateInventorySha256': EXPECTED, 'sourcePreviewDeploymentId': auth['candidateDeployment'], 'baselineDeploymentId': auth['baselineDeployment'], 'authorizationSha256': hashlib.sha256((DOCS / 'authorization.json').read_bytes()).hexdigest()}
with attempt.open('x') as f:
    json.dump(receipt, f, indent=2)
env = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID']:
    env.pop(key, None)
env['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
args = [NODE, CLI, 'deploy', '--prebuilt', '--environment=production', '--skip-domain', '--project', 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', '--scope', 'lsandoval2-8260s-projects', '--yes', '--json', '--meta', 'githubCommitRef=codex/contacto-baseline-productivo-20261116', '--meta', 'githubCommitSha=' + head, '--meta', 'baselineDeployment=' + auth['baselineDeployment'], '--meta', 'candidateInventorySha256=' + EXPECTED]
proc = subprocess.Popen(args, cwd=STAGE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
try:
    out, err = proc.communicate(timeout=300)
except BaseException:
    os.killpg(proc.pid, signal.SIGTERM)
    proc.wait(timeout=10)
    receipt['state'] = 'interrupted-check-remote-before-any-retry'
    attempt.write_text(json.dumps(receipt, indent=2) + '\n')
    raise
if proc.returncode:
    lines = [line for line in err.decode(errors='replace').splitlines() if line.startswith(('Error:', 'error:'))]
    diagnostic = re.sub(r'https?://\S+', '[URL]', '\n'.join(lines))[:1000]
    diagnostic = re.sub(r'(?i)(bearer\s+|token[=: ]+)[^\s]+', r'\1[REDACTED]', diagnostic)
    receipt.update(state='failed-check-remote-before-any-retry', exitCode=proc.returncode, stdoutBytes=len(out), stderrBytes=len(err), diagnostic=diagnostic)
    attempt.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))
    raise RuntimeError('Production creation failed; inspect remote records before any retry.')
data = json.loads(out)
result = data.get('deployment', data)
receipt.update(state='created', completedAt=datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(), deploymentId=result.get('id') or result.get('uid') or result.get('deploymentId'), url=result.get('url'), readyState=result.get('readyState') or result.get('state'), reportedTarget=result.get('target'), reportedEnvironment=result.get('environment'))
assert receipt['deploymentId'] and receipt['url']
attempt.write_text(json.dumps(receipt, indent=2) + '\n')
(DOCS / 'created.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
