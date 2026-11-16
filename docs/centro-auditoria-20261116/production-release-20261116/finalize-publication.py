"""Close the authorized release using existing certificates; no network/build/tests."""
import hashlib
import json
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[2]
ID='dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
PIN='ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
def read(path):return json.loads((DOCS/path).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
auth=read('authorization.json');created=read('created.json');promotion=read('promotion-confirmed.json')
preflight=read('verification/preflight-summary.json');isolated=read('verification/isolated-summary.json');post=read('verification/postpromotion-summary.json')
before_browser=read('browser/isolated/results.json');public_browser=read('browser/public/results.json');http=read('public-http/summary.json')
assert auth['explicitAuthorization'] and auth['promotionAuthorized'] and not auth['mergeAuthorized']
assert created['deploymentId']==promotion['deploymentId']==isolated['deployment']==post['deployment']==public_browser['deployment']==http['deploymentId']==ID
assert created['candidateInventorySha256']==isolated['candidateInventorySha256']==post['candidateInventorySha256']==http['candidateInventorySha256']==PIN
assert created['reportedTarget']=='production' and created['prebuilt'] and created['skipDomain']
for certificate,count in [(preflight,28),(isolated,33),(post,36)]:
 assert certificate['passed'] and len(certificate['checks'])==count and not certificate['failures'] and all(c['pass']for c in certificate['checks'])
for certificate in [before_browser,public_browser]:
 assert certificate['passed'] and len(certificate['widths'])==5 and all(w['passed']for w in certificate['widths'])
 assert sum(len(w['cases'])for w in certificate['widths'])==48
 assert not certificate['pageErrors'] and not certificate['failedResources'] and not certificate['unexpectedConsole']
 assert not certificate['blockedMutations'] and not certificate['blockedAPIs'] and certificate['contactSubmitEvents']==0
assert http['status']=='PASS' and http['summary']['completedRequests']==http['summary']['passedRequests']==190
assert http['summary']['blockedRequests']==http['summary']['skippedAfterBlock']==0
assert http['summary']['projectFichesPassed']==131 and http['formSubmits']==http['apiRequests']==http['ufLookups']==0
assert not http['commercialDataSent'] and promotion['sameVerifiedDeployment'] and not promotion['rebuild']
assert not(DOCS/'BLOCKED.json').exists()
runtime=['centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs','vercel.json','contacto.html']
assert not subprocess.check_output(['git','diff','42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9','--',*runtime],cwd=ROOT)
for width in [1440,1024,768,390,320]:
 for phase in ['isolated','public']:assert (DOCS/f'browser/{phase}/page-{width}.png').is_file()
now=datetime.now(ZoneInfo('America/Santiago'))
closure={'closedAt':now.isoformat(),'status':'COMPLETE','authorizationExecutedCompletely':True,'publicationPending':False,'deploymentId':ID,'target':'production','readyState':'READY','sourceCommit':created['sourceCommit'],'implementationCommit':created['implementationCommit'],'candidateInventorySha256':PIN,'baselineDeployment':created['baselineDeployment'],'promotionCompletedAtSantiago':promotion['promotionCompletedAtSantiago'],'promotionCompletedAtUTC':promotion['promotionCompletedAtUTC'],'sameDeploymentVerifiedThenPromoted':True,'rebuilt':False,'buildersOrGeneratorsExecuted':0,'newProductionDeployments':1,'publicUrl':'https://sollahms.cl/centro-orientacion.html','immutableProtectedUrl':created['url']+'/centro-orientacion.html','domainsVerified':['sollahms.cl','www.sollahms.cl'],'wwwRedirect':308,'runtimeFiles':1660,'runtimeChangedFromBaseline':3,'runtimeIdenticalToBaseline':1657,'functionBundles':7,'functionFiles':57,'projectFichesPreserved':131,'contactoSha256':'02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1','certificates':{'preflight':28,'isolatedRemote':33,'isolatedBrowserCases':48,'publicUrls':190,'publicBrowserCases':48,'postpromotion':36,'browserWidths':[1440,1024,768,390,320],'newScreenshots':40},'commercialFormsSubmitted':0,'contactSubmitEvents':0,'commercialDataSent':False,'ufProviderLookupsInProductionPhase':0,'ssoPreserved':True,'automaticSettingsPreserved':True,'pr30Draft':True,'pr30Merged':False,'knownBlockingIssues':[],'ownQaProcessesClosed':True,'previousPreviewCertificates':'Historical source commit42ee1d1 and production-release history; current release SHA256SUMS is authoritative for updated documentation.'}
(DOCS/'publication-closure.json').write_text(json.dumps(closure,ensure_ascii=False,indent=2)+'\n')
promotion['state']='promoted-public-qa-complete';promotion['publicQaPassed']=True;promotion['postpromotionVerificationPassed']=True
(DOCS/'promotion-confirmed.json').write_text(json.dumps(promotion,indent=2)+'\n')
external=['NEXT-PROMPT.md','docs/centro-auditoria-20261116/INFORME-AUDITORIA.md','docs/centro-auditoria-20261116/INFORME-CIERRE.md','docs/centro-auditoria-20261116/SIGUIENTE-PROMPT.md',*runtime]
paths=set(external)
paths.update(p.relative_to(ROOT).as_posix()for p in DOCS.rglob('*')if p.is_file() and p not in [DOCS/'SHA256SUMS',DOCS/'modified-files.json'] and '__pycache__'not in p.parts)
records=[{'path':p,'bytes':(ROOT/p).stat().st_size,'sha256':sha(ROOT/p),'role':'preserved runtime source'if p in runtime else 'publication documentation or evidence'}for p in sorted(paths)]
manifest={'sourceCommit':created['sourceCommit'],'deployment':ID,'candidateInventorySha256':PIN,'runtimeModifiedDuringProductionPhase':[],'records':records,'selfReferencePolicy':'Manifest excludes its own hash and SHA256SUMS; SHA256SUMS includes this manifest and excludes only itself. Historical certificates remain tied to source commit42ee1d1.'}
(DOCS/'modified-files.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
paths.add((DOCS/'modified-files.json').relative_to(ROOT).as_posix())
(DOCS/'SHA256SUMS').write_text(''.join(sha(ROOT/p)+'  '+p+'\n'for p in sorted(paths)))
for line in (DOCS/'SHA256SUMS').read_text().splitlines():
 digest,path=line.split('  ',1);assert sha(ROOT/path)==digest,path
print(json.dumps({'status':'COMPLETE','deployment':ID,'promotedAt':closure['promotionCompletedAtSantiago'],'publicUrls':190,'publicBrowserCases':48,'postpromotionChecks':36,'hashesVerified':len(paths),'certifiedTestsRepeated':0,'networkCalls':0}))
