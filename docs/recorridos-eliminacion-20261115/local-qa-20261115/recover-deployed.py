"""Recover existing certified deployment source bytes only. No build or generation."""
import base64, concurrent.futures, hashlib, json, os, re, subprocess, time
from pathlib import Path

ROOT=Path('/private/tmp/sollahms-recorridos-recovery')
DEPLOYMENT='dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi'
CLI='/Users/luissandoval/.npm-global/bin/vercel'
SCOPE='lsandoval2-8260s-projects'
EXPECTED='f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
os.umask(0o077)
cert=json.loads((ROOT/'verification-certified.json').read_text())
assert cert['outputInventorySha256']==EXPECTED and cert['files']==1660
rows=cert['inventory'];assert len(rows)==1660
blobs=ROOT/'blobs';blobs.mkdir(exist_ok=True)
output=ROOT/'output';output.mkdir(exist_ok=True)
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VC_DEBUG','VERCEL_LOG_LEVEL']:
 env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
unique={}
for r in rows:
 assert re.fullmatch('[0-9a-f]{40}',r['sha1']) and re.fullmatch('[0-9a-f]{64}',r['sha256'])
 p=Path(r['path']);assert not p.is_absolute() and '..' not in p.parts and p.parts[0] in ['config.json','static','functions']
 if r['sha1'] in unique:assert (r['size'],r['sha256'])==(unique[r['sha1']]['size'],unique[r['sha1']]['sha256'])
 unique[r['sha1']]=r

def verify(b,r):
 assert len(b)==r['size'] and hashlib.sha1(b).hexdigest()==r['sha1'] and hashlib.sha256(b).hexdigest()==r['sha256'],'Recovered source differs from certified bytes.'

def recover(r):
 p=blobs/r['sha1']
 if p.exists():verify(p.read_bytes(),r);return {'sha1':r['sha1'],'size':r['size'],'cache':True}
 for attempt in range(3):
  proc=subprocess.run([CLI,'api','/v8/deployments/'+DEPLOYMENT+'/files/'+r['sha1'],'--method','GET','--scope',SCOPE,'--raw'],cwd=ROOT,env=env,capture_output=True,timeout=90)
  if proc.returncode==0:
   try:
    j=json.loads(proc.stdout);b=base64.b64decode(j['data'],validate=True);verify(b,r)
    p.write_bytes(b);return {'sha1':r['sha1'],'size':r['size'],'cache':False}
   except Exception:pass
  if attempt<2:time.sleep(2*(attempt+1))
 raise RuntimeError('Source recovery failed for SHA1 '+r['sha1']+'; no raw CLI response retained or printed.')

records=[];started=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for fut in concurrent.futures.as_completed([pool.submit(recover,r) for r in unique.values()]):
  records.append(fut.result())
  if len(records)%50==0:print(json.dumps({'recovered_blobs':len(records),'total_unique':len(unique),'elapsed_seconds':round(time.time()-started)}),flush=True)

for r in rows:
 b=(blobs/r['sha1']).read_bytes();verify(b,r)
 p=output/r['path'];p.parent.mkdir(parents=True,exist_ok=True);assert not p.is_symlink();p.write_bytes(b)
actual={p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
assert actual=={r['path'] for r in rows}
canonical=''.join(str(r['path'])+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in sorted(rows,key=lambda r:r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest()==EXPECTED
for r in rows:verify((output/r['path']).read_bytes(),r)
report={'deployment':DEPLOYMENT,'source':'Vercel authenticated source API v8 GET, existing deployment only','recovered_files':len(rows),'unique_blobs':len(unique),'output':str(output),'outputInventorySha256':EXPECTED,'bytes':sum(r['size'] for r in rows),'static_files':1602,'function_files':57,'function_bundles':7,'config_files':1,'changed_from_historical_production':66,'preserved_from_historical_production':1594,'builds_executed':0,'generators_executed':0,'prepare_scripts_executed':0,'deployments_created':0,'credentials_or_protections_modified':False,'historical_tests_repeated':False,'elapsed_seconds':round(time.time()-started),'blob_records':sorted(records,key=lambda r:r['sha1'])}
(ROOT/'recovery-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='blob_records'}),flush=True)
