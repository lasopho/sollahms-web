"""Create exactly one prebuilt private Preview; Production is outside this task."""
import datetime
import hashlib
import json
import os
import signal
import subprocess
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
DOCS = Path(__file__).resolve().parent
WORK = ROOT / '.vercel/contacto-baseline-20261116'
STAGE = WORK / 'preview'
OUTPUT = STAGE / '.vercel/output'
MANIFEST = DOCS / 'candidate-manifest.json'
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
manifest = json.loads(MANIFEST.read_text())
assert manifest['targetAuthorized'] == 'preview' and manifest['productionAuthorized'] is False
assert manifest['changedFiles'] == 1 and manifest['identicalFiles'] == 1659
assert manifest['changes'][0]['path'] == 'static/contacto.html'
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
assert head == manifest['sourceCommit']
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--', 'contacto.html', 'vercel.json'], cwd=ROOT)
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()} == {r['path'] for r in manifest['inventory']}
for r in manifest['inventory']:
    path = OUTPUT / r['path']
    assert not path.is_symlink()
    data = path.read_bytes()
    assert len(data) == r['size'] and hashlib.sha256(data).hexdigest() == r['sha256'], r['path']
attempt = WORK / 'preview-create-attempt.json'
receipt = {'requestedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(), 'target': 'preview', 'sourceCommit': head, 'artifactInventorySha256': manifest['outputInventorySha256'], 'productionAuthorized': False, 'state': 'started'}
with attempt.open('x') as f:
    json.dump(receipt, f, indent=2)
env = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID']:
    env.pop(key, None)
env['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
# Native CLI rejects --skip-domain for Preview. Target preview never promotes Production.
args = [NODE, CLI, 'deploy', '--prebuilt', '--environment=preview', '--project', 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', '--scope', 'lsandoval2-8260s-projects', '--yes', '--json', '--meta', 'githubCommitRef=codex/contacto-baseline-productivo-20261116', '--meta', 'githubCommitSha=' + head, '--meta', 'baselineDeployment=dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5', '--meta', 'artifactInventorySha256=' + manifest['outputInventorySha256']]
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
    receipt.update(state='failed-check-remote-before-any-retry', exitCode=proc.returncode, stdoutBytes=len(out), stderrBytes=len(err))
    attempt.write_text(json.dumps(receipt, indent=2) + '\n')
    raise RuntimeError('Preview command failed; inspect remote records before retrying. No raw credentials or output persisted.')
data = json.loads(out)
result = data.get('deployment', data)
receipt.update(state='created', completedAt=datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(), deploymentId=result.get('id') or result.get('uid') or result.get('deploymentId'), url=result.get('url'), readyState=result.get('readyState') or result.get('state'), responseKeys=sorted(result))
assert receipt['url'], 'Find the existing deployment by commit metadata; never rerun blindly'
attempt.write_text(json.dumps(receipt, indent=2) + '\n')
(DOCS / 'preview-created.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
