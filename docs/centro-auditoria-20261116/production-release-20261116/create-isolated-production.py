"""Create the owner's authorized Production from certified bytes without aliases."""
import hashlib
import json
import os
import re
import signal
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[2]
WORK=ROOT/'.vercel/centro-production-release-20261116'
STAGE=WORK/'stage'
OUTPUT=STAGE/'.vercel/output'
PIN='ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
HEAD='42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9'
NODE='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI='/Users/luissandoval/.npm-global/bin/vercel'
auth=json.loads((DOCS/'authorization.json').read_text())
local=json.loads((DOCS/'local-artifact-verification.json').read_text())
preflight=json.loads((DOCS/'verification/preflight.json').read_text())
assert auth['explicitAuthorization'] and auth['productionCreationAuthorized'] and auth['maximumNewProductionDeployments']==1
assert auth['candidateInventorySha256']==PIN and local['passed'] and preflight['passed']
assert local['runtimeChanged']==3 and local['identicalToBaseline']==1657 and local['functionFiles']==57
assert (datetime.now(ZoneInfo('America/Santiago'))-datetime.fromisoformat(preflight['checkedAt'])).total_seconds()<1800
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==HEAD
assert not subprocess.check_output(['git','diff',HEAD,'--','centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs','vercel.json','contacto.html'],cwd=ROOT)
rows=json.loads((DOCS.parent/'candidate-manifest.json').read_text())['inventory']
canonical=''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n"for r in sorted(rows,key=lambda r:r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest()==PIN
assert {p.relative_to(OUTPUT).as_posix()for p in OUTPUT.rglob('*')if p.is_file()}=={r['path']for r in rows}
for r in rows:
 path=OUTPUT/r['path'];assert not path.is_symlink();body=path.read_bytes()
 assert (len(body),hashlib.sha1(body).hexdigest(),hashlib.sha256(body).hexdigest())==(r['size'],r['sha1'],r['sha256']),r['path']
assert json.loads((OUTPUT/'config.json').read_text())['version']==3
record={'requestedAt':datetime.now(ZoneInfo('America/Santiago')).isoformat(),'target':'production','skipDomain':True,'prebuilt':True,'sourceCommit':HEAD,'implementationCommit':'e9d7393148bf1e209f6a8e2210ed4c5a973ceb41','candidateInventorySha256':PIN,'baselineDeployment':auth['baselineDeployment'],'sourcePreviewDeployment':auth['candidateDeployment'],'authorizationSha256':hashlib.sha256((DOCS/'authorization.json').read_bytes()).hexdigest(),'state':'started'}
attempt=WORK/'production-create-attempt.json'
with attempt.open('x')as f:json.dump(record,f,indent=2)
env=dict(os.environ)
for k in ['NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VC_DEBUG','VERCEL_LOG_LEVEL','VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET']:env.pop(k,None)
env['PATH']=str(Path(NODE).parent)+':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
args=[NODE,CLI,'deploy','--prebuilt','--environment=production','--skip-domain','--project','prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','--scope','lsandoval2-8260s-projects','--yes','--json','--meta','githubCommitRef=codex/centro-auditoria-integral-20261116','--meta','githubCommitSha='+HEAD,'--meta','candidateInventorySha256='+PIN,'--meta','baselineDeployment='+auth['baselineDeployment'],'--meta','sourcePreviewDeployment='+auth['candidateDeployment']]
proc=subprocess.Popen(args,cwd=STAGE,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
try:out,err=proc.communicate(timeout=300)
except BaseException:
 os.killpg(proc.pid,signal.SIGTERM);proc.wait(timeout=10)
 record['state']='interrupted-publication-stopped-check-remote-before-any-retry'
 attempt.write_text(json.dumps(record,indent=2)+'\n');raise
if proc.returncode:
 diagnostic='\n'.join(x for x in err.decode(errors='replace').splitlines()if x.startswith(('Error:','error:')))
 diagnostic=re.sub(r'https?://\S+','[URL]',diagnostic)[:1000]
 diagnostic=re.sub(r'(?i)(bearer\s+|token[=: ]+)[^\s]+',r'\1[REDACTED]',diagnostic)
 record.update(state='failed-publication-stopped',exitCode=proc.returncode,diagnostic=diagnostic)
 attempt.write_text(json.dumps(record,indent=2)+'\n');(DOCS/'BLOCKED.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2));raise RuntimeError('Production creation failed; publication stopped.')
data=json.loads(out);d=data.get('deployment',data)
record.update(state='created',completedAt=datetime.now(ZoneInfo('America/Santiago')).isoformat(),deploymentId=d.get('id')or d.get('uid')or d.get('deploymentId'),url=d.get('url'),readyState=d.get('readyState')or d.get('state'),reportedTarget=d.get('target'),reportedEnvironment=d.get('environment'))
assert record['deploymentId'] and record['url']
attempt.write_text(json.dumps(record,indent=2)+'\n');(DOCS/'created.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
