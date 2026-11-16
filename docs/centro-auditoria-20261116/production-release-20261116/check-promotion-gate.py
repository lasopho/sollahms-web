"""Recheck live aliases/settings with native GET, then record one promotion request."""
import hashlib
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[2]
ID='dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
env=dict(os.environ)
for k in ['NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VC_DEBUG','VERCEL_LOG_LEVEL','VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET']:env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
def api(path):
 r=subprocess.run(['/Users/luissandoval/.npm-global/bin/vercel','api',path,'--method','GET','--scope','lsandoval2-8260s-projects','--raw'],cwd=DOCS,env=env,capture_output=True,timeout=55)
 assert r.returncode==0,'Native read failed; no promotion requested.'
 return json.loads(r.stdout)
auth=json.loads((DOCS/'authorization.json').read_text());created=json.loads((DOCS/'created.json').read_text())
remote=json.loads((DOCS/'verification/isolated-summary.json').read_text());browser=json.loads((DOCS/'browser/isolated/results.json').read_text())
assert auth['explicitAuthorization'] and auth['promotionAuthorized']
assert remote['passed'] and not remote['failures'] and len(remote['checks'])==33 and all(c['pass']for c in remote['checks'])
assert browser['passed'] and len(browser['widths'])==5 and all(w['passed']for w in browser['widths'])
assert sum(len(w['cases'])for w in browser['widths'])==48 and not browser['blockedMutations'] and browser['contactSubmitEvents']==0
assert created['deploymentId']==remote['deployment']==browser['deployment']==ID
assert created['reportedTarget']=='production' and created['prebuilt'] and created['skipDomain']
assert not (DOCS/'BLOCKED.json').exists()
aliases=[api('/v4/aliases/'+h)for h in ['sollahms.cl','www.sollahms.cl']]
project=api('/v9/projects/prj_URomRRU0MAy4etGKP5gWv3Qv4DGH')
assert all(a['deploymentId']==auth['baselineDeployment']for a in aliases),'Concurrent production change; STOP.'
assert aliases[1]['redirect']=='sollahms.cl' and aliases[1]['redirectStatusCode']==308
assert project['id']=='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH' and project['ssoProtection']['deploymentType']=='all_except_custom_domains'
assert project['autoAssignCustomDomains'] is False and project['previewDeploymentsDisabled'] is True
now=datetime.now(ZoneInfo('America/Santiago'))
state={'checkedAt':now.isoformat(),'passed':True,'aliases':[{k:a.get(k)for k in ['alias','deploymentId','projectId','updatedAt','redirect','redirectStatusCode']}for a in aliases],'project':{k:project.get(k)for k in ['id','ssoProtection','autoAssignCustomDomains','previewDeploymentsDisabled','nodeVersion']},'deploymentToPromote':ID,'candidateInventorySha256':created['candidateInventorySha256'],'readMethod':'Native Vercel API GET; MCP project projection omits automatic-state fields. The initial connector-only check stopped before request due to missing fields, not a failed artifact/control or changed setting.'}
(DOCS/'promotion-preflight-connected.json').write_text(json.dumps(state,indent=2)+'\n')
request={'requestedAt':now.isoformat(),'deploymentId':ID,'projectId':project['id'],'candidateInventorySha256':created['candidateInventorySha256'],'sameVerifiedDeployment':True,'rebuild':False,'authorizationSha256':hashlib.sha256((DOCS/'authorization.json').read_bytes()).hexdigest(),'isolatedSummarySha256':hashlib.sha256((DOCS/'verification/isolated-summary.json').read_bytes()).hexdigest(),'browserSummarySha256':hashlib.sha256((DOCS/'browser/isolated/results.json').read_bytes()).hexdigest()}
with (DOCS/'promotion-request.json').open('x')as f:json.dump(request,f,indent=2)
print(json.dumps({'gate':'PASS','deployment':ID,'remoteChecks':33,'browserCases':48,'freshNativeAliasesAndSettings':True}))
