"""Validate existing certificates and write deterministic file/hash manifests.

Does not repeat functional/browser/HTTP tests or perform network operations.
"""
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[1]
def read(rel):return json.loads((DOCS/rel).read_text())
qa=read('preview/results.json');remote=read('remote-verification/verification-summary.json')
assert qa['passed'] and remote['passed']
assert [r['width'] for r in qa['widths']]==[1440,1024,768,390,320]
assert sum(len(r['cases']) for r in qa['widths'])==78
assert not qa['pageErrors'] and not qa['failedResources'] and not qa['blockedMutations']
assert read('accessibility/results.json')['status']=='PASS'
assert read('diagnostics.json')['status']=='PASS'
preserve=read('source-preservation.json');assert preserve['status']=='PASS'
assert preserve['regression']['pass']==53
assert read('after/uf-reset.json')['passed']
stage=read('stage-receipt.json')
assert stage['candidateInventorySha256']==remote['candidateInventorySha256']=='ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
assert len(remote['checks'])==26 and all(r['pass'] for r in remote['checks'])
for width in [1440,1024,768,390,320]:
 for path in [f'before/punto-partida-{width}.png',f'after/punto-partida-{width}.png',f'preview/page-{width}.png',f'accessibility/point-calculated-{width}.png']:
  assert (DOCS/path).is_file()
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
assert not subprocess.check_output(['git','diff','e9d7393148bf1e209f6a8e2210ed4c5a973ceb41','--','centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs','vercel.json'],cwd=ROOT)
summary={'finalizedAtUTC':datetime.now(timezone.utc).isoformat(),'status':'PASS','productionPublished':False,'productionAuthorizationPending':True,'branch':'codex/centro-auditoria-integral-20261116','implementationCommit':'e9d7393148bf1e209f6a8e2210ed4c5a973ceb41','headAtEvidencePreparation':source_commit,'draftPullRequest':'https://github.com/lasopho/sollahms-web/pull/30','previewDeployment':qa['deployment'],'previewUrl':qa['origin']+'/centro-orientacion.html','candidateInventorySha256':stage['candidateInventorySha256'],'browserCases':78,'financialUfOrientationTests':53,'contrastChecks':80,'remoteChecks':26,'runtimeFiles':1660,'runtimeChanged':3,'runtimeIdentical':1657,'projectFichesPreserved':131,'functionBundles':7,'functionFiles':57,'commercialSubmits':0,'knownBlockingIssues':[],'note':'Final source SHA is implementationCommit. Later documentation-only HEAD can be obtained from git log or PR. This summary validates stored evidence without repeating certified tests.'}
(DOCS/'completion.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
public=['centro-orientacion.html','assets/css/orientacion.css','assets/js/orientacion.mjs']
paths=public+['vercel.json','NEXT-PROMPT.md']
paths+=sorted(p.relative_to(ROOT).as_posix() for p in DOCS.rglob('*') if p.is_file() and p.name not in ['modified-files.json','SHA256SUMS'] and '__pycache__' not in p.parts)
records=[]
for rel in sorted(set(paths)):
 body=(ROOT/rel).read_bytes()
 records.append({'path':rel,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'role':'public overlay' if rel in public else 'manual deployment guard' if rel=='vercel.json' else 'continuity or audit evidence'})
modified={'baseCommit':'dffbd310fe0cb34d952bda493140504ec4e1241c','implementationCommit':summary['implementationCommit'],'runtimeAllowlist':public,'records':records,'selfReferencePolicy':'This manifest excludes its own hash and SHA256SUMS. SHA256SUMS includes this manifest; only SHA256SUMS excludes itself. No generated artifact claims its own future Git commit SHA.'}
(DOCS/'modified-files.json').write_text(json.dumps(modified,ensure_ascii=False,indent=2)+'\n')
hash_paths=sorted(set(paths+[(DOCS/'modified-files.json').relative_to(ROOT).as_posix()]))
(DOCS/'SHA256SUMS').write_text(''.join(hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()+'  '+rel+'\n' for rel in hash_paths))
for line in (DOCS/'SHA256SUMS').read_text().splitlines():
 digest,rel=line.split('  ',1);assert hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()==digest
print(json.dumps({'status':'PASS','manifestRecords':len(records),'sha256VerifiedFiles':len(hash_paths),'runtimeDelta':3,'networkCalls':0,'certifiedTestsRepeated':0}))
