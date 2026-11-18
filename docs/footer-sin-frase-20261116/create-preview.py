"""Upload the certified frozen artifact as one private Preview. Never production."""
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
WORK = ROOT / '.vercel/footer-sin-frase-20261116'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
manifest = json.loads((DOCS / 'candidate-manifest.json').read_text())
receipt = json.loads((DOCS / 'stage-receipt.json').read_text())
assert receipt['passed'] and receipt['fileCount'] == 1660 and receipt['changedFiles'] == 2
assert receipt['identicalFiles'] == 1658 and receipt['functionFiles'] == 57
assert receipt['projectFichesPreserved'] == 131 and receipt['configUnchanged']
assert receipt['contactoUnchanged'] and receipt['centroUnchanged']
assert json.loads((DOCS / 'verification/production-summary.json').read_text())['passed']
assert json.loads((DOCS / 'local/results.json').read_text())['passed']
rows = manifest['inventory']
canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest() == manifest['outputInventorySha256'] == PIN
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()} == {r['path'] for r in rows}
for row in rows:
    path = OUTPUT / row['path']
    assert not path.is_symlink()
    body = path.read_bytes()
    assert len(body) == row['size'] and hashlib.sha256(body).hexdigest() == row['sha256']
for rel in ['index.html', 'proyectos.html']:
    assert (ROOT / rel).read_bytes() == (OUTPUT / 'static' / rel).read_bytes()
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
assert branch == 'codex/footer-sin-frase-20261116'
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--', 'index.html', 'proyectos.html', 'vercel.json'], cwd=ROOT)
assert json.loads((ROOT / 'vercel.json').read_text())['git']['deploymentEnabled'][branch] is False
assert json.loads((STAGE / '.vercel/project.json').read_text()) == receipt['projectBinding']
record = {'createdAt': datetime.now(timezone.utc).isoformat(), 'target': 'preview', 'productionAuthorized': False,
          'sourceCommit': head, 'sourceBranch': branch, 'candidateInventorySha256': PIN,
          'baselineDeployment': receipt['baselineDeployment'], 'state': 'started', 'prebuilt': True}
attempt = WORK / 'preview-create-attempt.json'
with attempt.open('x') as handle:
    json.dump(record, handle, indent=2)
env = dict(os.environ)
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL',
            'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NOW_PROJECT_ID', 'NOW_ORG_ID']:
    env.pop(key, None)
env['PATH'] = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
args = ['/Users/luissandoval/.npm-global/bin/vercel', 'deploy', '--prebuilt', '--environment=preview',
        '--project', receipt['projectBinding']['projectId'], '--scope', 'lsandoval2-8260s-projects', '--yes', '--json',
        '--meta', 'githubCommitRef=' + branch, '--meta', 'githubCommitSha=' + head,
        '--meta', 'candidateInventorySha256=' + PIN, '--meta', 'baselineDeployment=' + receipt['baselineDeployment']]
process = subprocess.run(args, cwd=STAGE, env=env, capture_output=True, timeout=300)
if process.returncode:
    record.update(state='failed-inspect-remote-before-retry', exitCode=process.returncode,
                  stdoutBytes=len(process.stdout), stderrBytes=len(process.stderr))
    attempt.write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record))
    raise RuntimeError('Preview creation failed; inspect remote state before any retry.')
data = json.loads(process.stdout)
deployment = data.get('deployment', data)
record.update(state='created', deploymentId=deployment.get('id') or deployment.get('uid') or deployment.get('deploymentId'),
              url=deployment.get('url'), readyState=deployment.get('readyState') or deployment.get('state'),
              reportedTarget=deployment.get('target'))
assert record['deploymentId'] and record['url']
assert record['reportedTarget'] in [None, 'preview']
attempt.write_text(json.dumps(record, indent=2) + '\n')
(DOCS / 'preview-created.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
