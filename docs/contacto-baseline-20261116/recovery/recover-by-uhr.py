"""Recover existing ByUhr bytes. No generators, builds, env pulls or deployments."""
import argparse,base64,concurrent.futures,hashlib,json,os,re,signal,subprocess,threading,time
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116')
AREA=ROOT/'.vercel/contacto-baseline-20261116'
RECOVERY=AREA/'recovery';CACHE=AREA/'cache';OUTPUT=AREA/'baseline/output'
DOCS=ROOT/'docs/contacto-baseline-20261116/recovery'
OLD=Path('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/recuperacion-originales-20261115/originales/production-source')
CERT=ROOT/'docs/recorridos-eliminacion-20261115/local-qa-20261115/production/verification/expected.json'
SOURCE_MAP=ROOT/'docs/recorridos-eliminacion-20261115/packaging-20261115/source-map.json'
DEPLOYMENT='dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5'
PIN='f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
RUNTIME='c97bfa5aba80329f18e3db8058ec5c3fada80cc4'
TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN';PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
SCOPE='lsandoval2-8260s-projects';CLI='/Users/luissandoval/.npm-global/bin/vercel'
os.umask(0o077)
for p in [RECOVERY,CACHE,DOCS]:p.mkdir(parents=True,exist_ok=True)
cert=json.loads(CERT.read_text());rows=cert['inventory'];by_path={r['path']:r for r in rows}
assert len(rows)==len(by_path)==1660 and cert['artifact_inventory_sha256']==PIN
canonical=''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in sorted(rows,key=lambda r:r['path'])).encode()
assert hashlib.sha256(canonical).hexdigest()==PIN
source_map={r['file'][8:]:r['source'] for r in json.loads(SOURCE_MAP.read_text())}
assert set(source_map)==set(by_path)
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG']:
 env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
active=set();lock=threading.RLock();stopped=threading.Event()
def digest(b,kind='sha256'):return hashlib.new(kind,b).hexdigest()
def save(name,obj):(RECOVERY/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def kill_group(pid):
 try:os.killpg(pid,signal.SIGTERM)
 except ProcessLookupError:return
 time.sleep(.5)
 try:os.killpg(pid,signal.SIGKILL)
 except ProcessLookupError:pass
def on_signal(sig,frame):
 stopped.set()
 with lock:pids=list(active)
 for pid in pids:kill_group(pid)
 raise SystemExit(128+sig)
for sig in [signal.SIGINT,signal.SIGTERM]:signal.signal(sig,on_signal)
def cli(arguments):
 if stopped.is_set():raise RuntimeError('Recovery interrupted.')
 proc=subprocess.Popen([CLI,*arguments],cwd=RECOVERY,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 with lock:active.add(proc.pid)
 timeout=False
 try:
  try:out,err=proc.communicate(timeout=55)
  except subprocess.TimeoutExpired:timeout=True;kill_group(proc.pid);out,err=proc.communicate(timeout=2)
 finally:
  try:os.killpg(proc.pid,0)
  except ProcessLookupError:pass
  else:kill_group(proc.pid)
  with lock:active.discard(proc.pid)
 if timeout or proc.returncode!=0:
  m=re.search(rb'\((\d{3})\)',err);raise RuntimeError('Read-only Vercel API failed: '+('timeout' if timeout else m.group(1).decode() if m else 'exit '+str(proc.returncode))+'. Raw output was not retained.')
 return out
def api(path):return json.loads(cli(['api',path,'--method','GET','--scope',SCOPE,'--raw']))
def flatten(value,parent=''):
 if isinstance(value,list):
  for x in value:yield from flatten(x,parent)
 elif isinstance(value,dict):
  if 'files' in value and not ('name' in value or 'path' in value):yield from flatten(value['files'],parent);return
  name=value.get('path',value.get('file',value.get('name','')))
  path=name if value.get('path') or value.get('file') or name.startswith('src/') or name.startswith('out/') else '/'.join(x for x in [parent,name] if x)
  if isinstance(value.get('children'),list):yield from flatten(value['children'],path)
  elif path:yield {'path':path,'type':value.get('type'),'uid':value.get('uid',value.get('sha1',value.get('sha'))),'size':value.get('size'),'mode':value.get('mode')}
def valid(b,row):return len(b)==row['size'] and digest(b,'sha1')==row['sha1'] and digest(b)==row['sha256']
def local_bytes(path,row):
 if not path.is_file() or path.is_symlink() or path.stat().st_size!=row['size']:return None
 b=path.read_bytes();return b if valid(b,row) else None

start=time.time()
raw=api('/v13/deployments/'+DEPLOYMENT)
metadata={k:raw.get(k) for k in ['id','url','name','readyState','target','prebuilt','projectId','teamId','ownerId','source','alias']}
metadata['meta']={k:(raw.get('meta') or {}).get(k) for k in ['githubCommitSha','githubCommitRef']}
assert metadata['id']==DEPLOYMENT and metadata['readyState']=='READY' and metadata['target']=='production' and metadata['prebuilt'] is True
assert metadata['projectId']==PROJECT and TEAM in [metadata.get('teamId'),metadata.get('ownerId')]
assert metadata['meta']['githubCommitSha']==RUNTIME
save('by-uhr-metadata.json',metadata)
tree=list(flatten(api('/v6/deployments/'+DEPLOYMENT+'/files')))
source={r['path'][len('src/.vercel/output/'):]:r for r in tree if r['path'].startswith('src/.vercel/output/')}
assert set(source)==set(by_path) and len(source)==1660
for path,want in by_path.items():
 got=source[path];assert got['uid']==want['sha1'],path
 if isinstance(got.get('size'),int):assert got['size']==want['size'],path
lambdas=[r for r in tree if r['type']=='lambda' and r['path'].startswith('out/api/')]
assert {r['path'][3:] for r in lambdas}=={r['endpoint'] for r in cert['functions']} and len(lambdas)==7
save('by-uhr-source-index.json',{'deployment':DEPLOYMENT,'remote_sources':len(source),'all_source_sha1_match':True,'remote_explicit_sizes':sum(isinstance(r.get('size'),int) for r in source.values()),'size_limit':'Where API sizes are not exposed, the certified byte count is bound to equality of the remote SHA1 content address. Every recovered byte sequence is separately checked by size/SHA1/SHA256.','registered_lambdas':lambdas,'sources':[source[p] for p in sorted(source)]})

provenance=[];missing=[];counts={'production_source_local_verified':0,'documented_checkout_source_local_verified':0,'by_uhr_api_blob':0,'api_cache_verified':0}
OUTPUT.mkdir(parents=True,exist_ok=True)
def write_output(row,b,kind,relative_source):
 assert valid(b,row),row['path']
 rel=Path(row['path']);assert not rel.is_absolute() and '..' not in rel.parts
 target=OUTPUT/rel;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert not target.is_symlink() and target.read_bytes()==b,'Existing output differs; do not overwrite.'
 else:target.write_bytes(b)
 counts[kind]+=1;provenance.append({'path':row['path'],'bytes':row['size'],'sha1':row['sha1'],'sha256':row['sha256'],'source_kind':kind,'source_relative':relative_source})
for row in rows:
 b=local_bytes(OLD/row['path'],row)
 if b is not None:write_output(row,b,'production_source_local_verified',row['path']);continue
 mapped=Path(source_map[row['path']]);candidate=ROOT/mapped
 assert candidate.resolve().is_relative_to(ROOT.resolve()),'Documented source escaped checkout.'
 b=local_bytes(candidate,row)
 if b is not None:write_output(row,b,'documented_checkout_source_local_verified',mapped.as_posix());continue
 cached=CACHE/row['sha1'];b=local_bytes(cached,row)
 if b is not None:write_output(row,b,'api_cache_verified',row['sha1']);continue
 missing.append(row)
print(json.dumps({'phase':'local_recovery','completed':len(provenance),'missing_blobs':len({r['sha1'] for r in missing}),'sources':counts}),flush=True)

def download(row):
 data=api('/v8/deployments/'+DEPLOYMENT+'/files/'+row['sha1']);b=base64.b64decode(data['data'],validate=True);assert valid(b,row)
 (CACHE/row['sha1']).write_bytes(b);return row['sha1'],b
unique={r['sha1']:r for r in missing};downloads={}
if unique:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for sha,b in pool.map(download,unique.values()):downloads[sha]=b
 for row in missing:write_output(row,downloads[row['sha1']],'by_uhr_api_blob',row['sha1'])

actual=[]
for p in sorted(OUTPUT.rglob('*')):
 assert not p.is_symlink()
 if p.is_file():
  rel=p.relative_to(OUTPUT).as_posix();assert rel in by_path
  b=p.read_bytes();assert valid(b,by_path[rel]);actual.append({'path':rel,'size':len(b),'sha1':digest(b,'sha1'),'sha256':digest(b)})
assert len(actual)==1660 and {r['path'] for r in actual}==set(by_path)
actual_canonical=''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in actual).encode()
assert digest(actual_canonical)==PIN
configs=[]
for p in sorted((OUTPUT/'functions').rglob('.vc-config.json')):
 cfg=json.loads(p.read_text());assert cfg['runtime']=='nodejs24.x' and cfg.get('environment')=={}
 handler=p.parent/cfg['handler'];assert handler.is_file() and handler.resolve().is_relative_to(p.parent.resolve())
 configs.append({'bundle':p.parent.relative_to(OUTPUT/'functions').as_posix(),'handler':cfg['handler'],'runtime':cfg['runtime'],'environment_empty':True,'files':sum(x.is_file() for x in p.parent.rglob('*'))})
assert len(configs)==7 and sum(x['files'] for x in configs)==57
cfg=json.loads((OUTPUT/'config.json').read_text());assert cfg['version']==3 and cfg['crons']==[]
report={'deployment':DEPLOYMENT,'runtime_sha':RUNTIME,'recoveredAtUTC':datetime.now(timezone.utc).isoformat(),'output':str(OUTPUT),'output_files':1660,'output_bytes':sum(x['size'] for x in actual),'canonical_inventory_sha256':PIN,'static_files':1602,'function_files':57,'function_bundles':configs,'config_version':3,'api_source_hashes_verified':1660,'remote_explicit_size_records':sum(isinstance(x.get('size'),int) for x in source.values()),'local_sources':counts,'body_blobs_downloaded':len(downloads),'source_preview_used':False,'root_contacto_html_modified':False,'builds_executed':0,'generators_executed':0,'env_pulls_executed':0,'deployments_created':0,'production_modified':False,'historical_suites_repeated':False,'credentials_read_or_logged':False,'active_own_process_groups':sorted(active),'elapsed_seconds':round(time.time()-start,2),'contacto_baseline':by_path['static/contacto.html']}
save('recovery-report.json',report);save('recovered-inventory.json',{'inventory_sha256':PIN,'files':actual});save('file-provenance.json',{'deployment':DEPLOYMENT,'files':sorted(provenance,key=lambda r:r['path'])})
print(json.dumps(report,ensure_ascii=False),flush=True)
