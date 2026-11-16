"""Deploy exactly the verified prebuilt artifact as Preview; never promote."""
import datetime
import hashlib
import json
import os
import subprocess
from pathlib import Path

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[1]
WORK=ROOT/'.vercel/centro-auditoria-20261116'
STAGE=WORK/'stage'
OUTPUT=STAGE/'.vercel/output'
manifest=json.loads((DOCS/'candidate-manifest.json').read_text())
receipt=json.loads((DOCS/'stage-receipt.json').read_text())
assert receipt['passed'] and receipt['fileCount']==1660 and receipt['changedFiles']==3
assert receipt['identicalFiles']==1657 and receipt['functionFiles']==57
assert receipt['contactoUnchanged'] and receipt['allOtherRuntimeFilesIdentical']
assert json.loads((DOCS/'after/uf-reset.json').read_text())['passed']
rows=manifest['inventory']
canonical=''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows,key=lambda r:r['path'])).encode()
pin=hashlib.sha256(canonical).hexdigest()
assert pin==receipt['candidateInventorySha256']
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob('*') if p.is_file()}=={r['path'] for r in rows}
for row in rows:
 body=(OUTPUT/row['path']).read_bytes()
 assert len(body)==row['size'] and hashlib.sha256(body).hexdigest()==row['sha256']
for path in ['centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs']:
 assert (ROOT/path).read_bytes()==(OUTPUT/'static'/path).read_bytes()
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
assert not subprocess.check_output(['git','diff','HEAD','--','centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs','vercel.json'],cwd=ROOT)
assert json.loads((ROOT/'vercel.json').read_text())['git']['deploymentEnabled']['codex/centro-auditoria-integral-20261116'] is False
attempt=WORK/'preview-create-attempt.json'
record={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'target':'preview','productionAuthorized':False,'sourceCommit':head,'candidateInventorySha256':pin,'baselineDeployment':receipt['baselineDeployment'],'state':'started'}
with attempt.open('x') as f:json.dump(record,f,indent=2)
env=dict(os.environ)
for k in ['NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VC_DEBUG','VERCEL_LOG_LEVEL','VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID']:env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
args=['/Users/luissandoval/.npm-global/bin/vercel','deploy','--prebuilt','--environment=preview','--project','prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','--scope','lsandoval2-8260s-projects','--yes','--json','--meta','githubCommitRef=codex/centro-auditoria-integral-20261116','--meta','githubCommitSha='+head,'--meta','candidateInventorySha256='+pin,'--meta','baselineDeployment='+receipt['baselineDeployment']]
proc=subprocess.run(args,cwd=STAGE,env=env,capture_output=True,timeout=300)
if proc.returncode:
 record.update(state='failed-check-remote-before-any-retry',exitCode=proc.returncode,stdoutBytes=len(proc.stdout),stderrBytes=len(proc.stderr))
 attempt.write_text(json.dumps(record,indent=2)+'\n')
 print(json.dumps(record,indent=2));raise RuntimeError('Preview failed; inspect remote before any retry')
data=json.loads(proc.stdout);result=data.get('deployment',data)
record.update(state='created',deploymentId=result.get('id') or result.get('uid') or result.get('deploymentId'),url=result.get('url'),readyState=result.get('readyState') or result.get('state'),reportedTarget=result.get('target'))
assert record['deploymentId'] and record['url']
attempt.write_text(json.dumps(record,indent=2)+'\n');(DOCS/'preview-created.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
