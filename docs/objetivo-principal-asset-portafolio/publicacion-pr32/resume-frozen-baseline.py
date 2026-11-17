#!/usr/bin/env python3
"""Resume verified reads after observing index.html -> / (HTTP308).
Only missing bytes are fetched. The first recovery receipt remains unchanged.
"""
import importlib.util,json,base64,hashlib,time,threading,urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,wait,FIRST_COMPLETED

P=Path('/private/tmp/sollahms-release-preparation-evidence')
spec=importlib.util.spec_from_file_location('frozen_recovery',P/'recover-frozen-baseline.py')
R=importlib.util.module_from_spec(spec);spec.loader.exec_module(R)

def resume():
 original_receipt=R.RECOVERY/'RECOVERY.json'
 original_bytes=original_receipt.read_bytes();prior=json.loads(original_bytes)
 R.require(prior.get('passed') is False and prior.get('failure',{}).get('message')=='unexpected HTTP status for static/index.html: 308','unexpected earlier stop; inspect before resuming')
 R.require(R.sha(R.MANIFEST.read_bytes())==R.MANIFEST_SHA256,'manifest changed')
 rows=json.loads(R.MANIFEST.read_bytes())['inventory'];expected={r['path']:r for r in rows}
 R.require(len(rows)==1660 and R.inventory_pin(rows)==R.PIN,'invalid frozen inventory')
 remote={r['path'].removeprefix('src/.vercel/output/'):r['uid'] for r in json.loads(R.TREE.read_text())}
 R.require(set(remote)==set(expected) and all(remote[p]==r['sha1'] for p,r in expected.items()),'remote frozen mapping changed')
 alias=json.loads(R.ALIAS_BEFORE.read_text())
 R.require(alias['id']==R.DEPLOYMENT and alias['sha']=='b761ddeaea2fa526870e6af25658046e31b571d7' and alias['state']=='READY' and alias['target']=='production','invalid alias preflight')
 age=(R.datetime.now(R.timezone.utc)-R.datetime.fromisoformat(alias['observedAtUTC'].replace('Z','+00:00'))).total_seconds()
 R.require(0<=age<1800,'alias preflight older than30minutes')
 existing=set()
 for p in R.OUTPUT.rglob('*'):
  R.require(not p.is_symlink(),'symlink rejected')
  if p.is_file():
   rel=p.relative_to(R.OUTPUT).as_posix();R.require(rel in expected,'unexpected partial file');R.validate(p.read_bytes(),expected[rel]);existing.add(rel)
 R.require(len(existing)==1528,'partial state changed; inspect')
 target=R.RECOVERY/'RECOVERY-RESUMED.json';R.require(not target.exists(),'resume receipt already exists; inspect first')
 report={'startedAtUTC':R.now(),'passed':False,'priorReceiptSHA256':R.sha(original_bytes),'reusedVerifiedFiles':len(existing),'newCondition':'HEAD observed HTTP308 Location https://sollahms.cl/ for index.html; fetch that canonical GET only, without retrying the failed URL.','retriesOfFailedURL':0,'newRecords':[],'builders':0,'generators':0,'deployments':0,'promotions':0}
 missing=[r for r in rows if r['path'] not in existing]
 groups={}
 for row in missing:
  if not row['path'].startswith('static/'):groups.setdefault(row['sha1'],[]).append(row)
 def canonical_index(row):
  req=urllib.request.Request('https://sollahms.cl/',method='GET',headers={'Accept-Encoding':'identity','User-Agent':'Sollahms-Immutable-Artifact-Recovery/1.0'})
  with urllib.request.build_opener(R.SameOriginRedirect()).open(req,timeout=45) as response:
   R.require(response.getcode()==200 and response.geturl()=='https://sollahms.cl/','canonical index changed')
   R.require(response.headers.get('Content-Encoding','').lower() in ('','identity'),'unexpected encoding')
   body=response.read(row['size']+1)
  R.validate(body,row);R.write_verified(body,row)
  return [{'path':row['path'],'source':'public-HTTPS-canonical-GET','url':'https://sollahms.cl/','observedAtUTC':R.now(),'sha1':row['sha1'],'sha256':row['sha256'],'size':len(body)}]
 jobs=[];pool=ThreadPoolExecutor(max_workers=8)
 try:
  for row in missing:
   if row['path'].startswith('static/'):
    jobs.append(pool.submit(canonical_index if row['path']=='static/index.html' else R.public_get,row))
  jobs += [pool.submit(R.cli_get,uid,group) for uid,group in groups.items()]
  pending=set(jobs);completed=0;last=time.monotonic()
  while pending:
   ready,pending=wait(pending,timeout=2,return_when=FIRST_COMPLETED)
   for f in ready:
    report['newRecords'].extend(f.result());completed=len(report['newRecords'])
   if completed and (completed%20==0 or time.monotonic()-last>30):
    print(json.dumps({'reused':len(existing),'newRecovered':completed,'missingInitially':len(missing)}),flush=True);last=time.monotonic()
  pool.shutdown(wait=True)
  actual=[]
  for p in sorted(R.OUTPUT.rglob('*')):
   R.require(not p.is_symlink(),'symlink rejected')
   if p.is_file():
    rel=p.relative_to(R.OUTPUT).as_posix();R.require(rel in expected,'unexpected file');R.validate(p.read_bytes(),expected[rel]);actual.append(expected[rel])
  R.require(len(actual)==1660 and R.inventory_pin(actual)==R.PIN,'final inventory mismatch')
  R.require({p.name for p in (R.OUTPUT/'functions/api').iterdir() if p.is_dir()}==R.FUNCTIONS,'bundle mismatch')
  R.require(sum(r['path'].startswith('functions/') for r in actual)==57,'function file mismatch')
  R.require(original_receipt.read_bytes()==original_bytes,'original receipt changed')
  report.update(passed=True,recoveredFiles=1660,inventorySha256=R.PIN,functionFiles=57,functionBundles=7,totalBytes=sum(r['size'] for r in actual),aliasAfterRecheckRequiredByRoot=True)
 except Exception as err:
  R.STOP.set()
  for f in jobs:f.cancel()
  pool.shutdown(wait=True,cancel_futures=True)
  report['failure']={'type':type(err).__name__,'message':str(err) if isinstance(err,RuntimeError) else 'Read failed; no retry performed.'}
  raise
 finally:
  report['finishedAtUTC']=R.now();R.save_json(target,report);print(json.dumps({k:report.get(k) for k in ['passed','recoveredFiles','inventorySha256','failure']}),flush=True)

if __name__=='__main__':resume()
