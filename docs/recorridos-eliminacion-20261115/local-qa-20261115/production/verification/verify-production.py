"""Read-only isolated Production verification. Requires explicit deployment ID; no deploy/promotion."""
import argparse,concurrent.futures,hashlib,json,os,re,signal,subprocess,tempfile,time,threading
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import unquote,urlsplit

ROOT=Path('/private/tmp/sollahms-recorridos-production-verify')
CLI='/Users/luissandoval/.npm-global/bin/vercel'
CWD=Path('/private/tmp/sollahms-recorridos-access')
EXPECTED=json.loads((ROOT/'expected.json').read_text())
KNOWN_TOOLBAR_SHA='1ec749d6c1840dd80e5f178a7ebea403951fa9e3bb90e80a4b1be83b311e85cb'
SELECTED_HEADERS={'content-type','content-security-policy','content-security-policy-report-only','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','strict-transport-security','cross-origin-opener-policy','cross-origin-resource-policy','cache-control','content-language'}
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--deployment',required=True)
parser.add_argument('--workers',type=int,default=2,choices=[1,2])
args=parser.parse_args()
assert re.fullmatch(r'dpl_[A-Za-z0-9]+',args.deployment)
assert args.deployment not in ['dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi','dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN'],'Only the new Production ID is permitted.'
gate=json.loads((CWD/'qa-gate.json').read_text())
assert gate['eligibleForProductionPreparation'] is True and gate['failures']==[]
assert gate['artifactInventorySha256']==EXPECTED['artifact_inventory_sha256']
os.umask(0o077)
AREA=ROOT/args.deployment;AREA.mkdir(exist_ok=True)
CACHE=AREA/'http-cache';CACHE.mkdir(exist_ok=True)
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG']:
 env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
assert not (CWD/'.vercel/project.json').exists() and not (CWD/'.now/project.json').exists(),'CLI cwd must remain unlinked.'
failures=[];checks=[];source_rows=[];http_records=[]
active_groups=set();group_lock=threading.RLock();stopped=threading.Event()

def digest(b,kind='sha256'):return hashlib.new(kind,b).hexdigest()
def save(name,value):(AREA/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def check(name,passed,detail=None):
 checks.append({'check':name,'pass':bool(passed),'detail':detail})
 if not passed:failures.append({'check':name,'detail':detail})
def kill_group(pid):
 try:os.killpg(pid,signal.SIGTERM)
 except ProcessLookupError:return
 time.sleep(.5)
 try:os.killpg(pid,signal.SIGKILL)
 except ProcessLookupError:pass
def stop_on_signal(signum,frame):
 stopped.set();failures.append({'check':'interrupted','detail':signal.Signals(signum).name})
 with group_lock:pids=list(active_groups)
 for pid in pids:kill_group(pid)
 raise SystemExit(128+signum)
for sig in [signal.SIGINT,signal.SIGTERM]:signal.signal(sig,stop_on_signal)
def run_cli(arguments):
 if stopped.is_set():raise RuntimeError('VERIFICATION_INTERRUPTED')
 # Own process group includes the CLI launcher/native binary/curl descendants.
 p=subprocess.Popen([CLI,*arguments],cwd=CWD,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 with group_lock:active_groups.add(p.pid)
 timed_out=False
 try:
  try:stdout,stderr=p.communicate(timeout=55)
  except subprocess.TimeoutExpired:
   timed_out=True;kill_group(p.pid);stdout,stderr=p.communicate(timeout=2)
 finally:
  # Remove any descendants still in this command's group, never other groups.
  try:os.killpg(p.pid,0)
  except ProcessLookupError:pass
  else:kill_group(p.pid)
  with group_lock:active_groups.discard(p.pid)
 if timed_out or p.returncode!=0:
  status=re.search(rb'\((\d{3})\)',stderr)
  raise RuntimeError('CLI_READ_FAILED_'+('TIMEOUT' if timed_out else status.group(1).decode() if status else str(p.returncode)))
 return stdout
def api(endpoint):return json.loads(run_cli(['api',endpoint,'--method','GET','--scope',EXPECTED['scope'],'--raw']))
def safe_meta(raw):
 meta=raw.get('meta') or {};project=raw.get('project') or {};team=raw.get('team') or {}
 return {'id':raw.get('id'),'url':raw.get('url'),'name':raw.get('name'),'readyState':raw.get('readyState',raw.get('state')),'target':raw.get('target'),'prebuilt':raw.get('prebuilt'),'projectId':raw.get('projectId',project.get('id')),'teamId':raw.get('teamId',team.get('id')),'ownerId':raw.get('ownerId'),'userId':raw.get('userId'),'autoAssignCustomDomains':raw.get('autoAssignCustomDomains'),'alias':raw.get('alias',[]),'aliasAssigned':raw.get('aliasAssigned'),'source':raw.get('source'),'meta':{k:meta[k] for k in ['githubCommitSha','githubCommitRef','sourceCommit','sourceBranch','certifiedArtifactSha256','artifactInventorySha256','outputInventorySha256'] if k in meta}}
def flatten(value,parent=''):
 if isinstance(value,list):
  for child in value:yield from flatten(child,parent)
 elif isinstance(value,dict):
  if 'files' in value and not ('name' in value or 'path' in value):yield from flatten(value['files'],parent);return
  if 'result' in value and not ('name' in value or 'path' in value):yield from flatten(value['result'],parent);return
  name=value.get('path',value.get('file',value.get('name','')))
  path=name if value.get('path') or value.get('file') or name.startswith('src/') or name.startswith('out/') else '/'.join(x for x in [parent,name] if x)
  children=value.get('children')
  if isinstance(children,list):yield from flatten(children,path)
  elif path:yield {'path':path,'type':value.get('type'),'uid':value.get('uid',value.get('sha1',value.get('sha'))),'mode':value.get('mode'),'size':value.get('size')}

try:
 metadata=safe_meta(api('/v13/deployments/'+args.deployment));save('metadata.json',metadata)
 raw_project=api('/v9/projects/'+EXPECTED['project'])
 project={'id':raw_project.get('id'),'accountId':raw_project.get('accountId'),'ssoProtection':raw_project.get('ssoProtection'),'autoExposeSystemEnvs':raw_project.get('autoExposeSystemEnvs'),'nodeVersion':raw_project.get('nodeVersion')}
 save('project-protection.json',project)
 check('deployment_id',metadata['id']==args.deployment)
 check('ready',metadata['readyState']=='READY',metadata['readyState'])
 check('production_target',metadata['target']=='production',metadata['target'])
 check('prebuilt',metadata['prebuilt'] is True,metadata['prebuilt'])
 check('project',metadata['projectId']==EXPECTED['project'],metadata['projectId'])
 ownership=[metadata.get(k) for k in ['teamId','ownerId','userId']]+[project.get('accountId') if project.get('id')==EXPECTED['project'] else None]
 check('team',EXPECTED['team'] in ownership,{'matching_team_field_present':EXPECTED['team'] in ownership})
 check('sso_preserved',(project.get('ssoProtection') or {}).get('deploymentType')=='all_except_custom_domains')
 check('system_runtime_envs_preserved',project.get('autoExposeSystemEnvs') is True)
 declared=metadata['meta'];check('runtime_metadata',EXPECTED['runtime_sha'] in [declared.get('githubCommitSha'),declared.get('sourceCommit')])
 check('branch_metadata',EXPECTED['branch'] in [declared.get('githubCommitRef'),declared.get('sourceBranch')])
 check('canonical_vercel_hostname',bool(re.fullmatch(r'[a-zA-Z0-9.-]+\.vercel\.app',metadata.get('url') or '')))
 aliases=api('/v2/deployments/'+args.deployment+'/aliases')
 alias_rows=aliases.get('aliases',[]) if isinstance(aliases,dict) else aliases
 names=[x.get('alias',x.get('hostname','')) if isinstance(x,dict) else x for x in alias_rows]
 check('no_custom_domains_assigned',not any(x and not x.endswith('.vercel.app') for x in names),names)
 check('apex_www_not_assigned',not any(x in ['sollahms.cl','www.sollahms.cl'] for x in names),names)
 check('skip_domain_flag_preserved',metadata.get('autoAssignCustomDomains') is not True,metadata.get('autoAssignCustomDomains'))
 save('deployment-aliases.json',{'deployment':args.deployment,'aliases':names,'custom_aliases':[] if not any(x and not x.endswith('.vercel.app') for x in names) else [x for x in names if x and not x.endswith('.vercel.app')]})
 try:tree=api('/v6/deployments/'+args.deployment+'/files')
 except RuntimeError as e:
  if str(e)!='CLI_READ_FAILED_410':raise
  tree=api('/v8/deployments/'+args.deployment+'/files')
 flat=list(flatten(tree));save('deployment-tree.json',{'deployment':args.deployment,'entries':flat})
 remote={}
 for row in flat:
  if row['path'].startswith('src/.vercel/output/'):
   relative=row['path'][len('src/.vercel/output/'):];remote[relative]=row
 expected={r['path']:r for r in EXPECTED['inventory']}
 check('source_path_count',len(remote)==1660,{'remote':len(remote),'expected':1660})
 check('source_paths_exact',set(remote)==set(expected),{'missing':sorted(set(expected)-set(remote)),'extra':sorted(set(remote)-set(expected))})
 explicit_sizes=0
 for rel,want in expected.items():
  got=remote.get(rel);passed=bool(got and got['uid']==want['sha1'])
  if got and isinstance(got.get('size'),int):explicit_sizes+=1;passed=passed and got['size']==want['size']
  source_rows.append({'path':rel,'sha1':got.get('uid') if got else None,'certified_sha1':want['sha1'],'certified_bytes':want['size'],'remote_explicit_bytes':got.get('size') if got else None,'pass':passed})
 check('all_1660_content_hashes',len(source_rows)==1660 and all(r['pass'] for r in source_rows))
 source_summary={'deployment':args.deployment,'files':len(remote),'matched':sum(r['pass'] for r in source_rows),'remote_explicit_size_records':explicit_sizes,'size_validation':'Explicit size checked wherever exposed; otherwise certified byte count is bound to equality of the deployment source SHA1 content address, not represented as a separately fetched remote size.','artifact_inventory_sha256':EXPECTED['artifact_inventory_sha256'],'files_redownloaded':0,'rows':source_rows}
 save('source-manifest-comparison.json',source_summary)
 lambdas=[r for r in flat if r['type']=='lambda' and r['path'].startswith('out/api/')]
 expected_functions={x['endpoint'] for x in EXPECTED['functions']}
 check('seven_registered_lambdas',len(lambdas)==7 and {r['path'][3:] for r in lambdas}==expected_functions,{'lambdas':[r['path'] for r in lambdas]})
 save('registered-functions.json',{'deployment':args.deployment,'lambdas':lambdas})
 if failures:raise RuntimeError('METADATA_OR_SOURCE_GATE_FAILED')
 origin='https://'+metadata['url']
 wanted_static={r['path'][7:]:r for r in EXPECTED['inventory'] if r['path'].startswith('static/')}

 def http(path,method='GET',expected_status=200,static_relative=None):
  assert path.startswith('/') and not path.startswith('//') and '?' not in path and '\\' not in path
  assert method in ['GET','HEAD']
  key=digest((method+' '+path).encode());mp=CACHE/(key+'.json');bp=CACHE/(key+'.body')
  try:
   old=json.loads(mp.read_text());body=bp.read_bytes()
   if old.get('pass') is True and old.get('deployment')==args.deployment and old.get('method')==method and old.get('path')==path and old.get('status')==expected_status and old.get('sha256')==digest(body) and old.get('bytes')==len(body):return dict(old,cached=True)
  except (FileNotFoundError,json.JSONDecodeError):pass
  with tempfile.TemporaryDirectory(prefix='http-',dir=CACHE) as td:
   tmp=Path(td);head=tmp/'headers';body_path=tmp/'body'
   options=['--silent','--show-error','--max-time','50','--dump-header',str(head)]
   options+=['--head','--output','/dev/null'] if method=='HEAD' else ['--request','GET','--output',str(body_path)]
   run_cli(['curl',path,'--deployment',args.deployment,'--scope',EXPECTED['scope'],'--',*options])
   raw=head.read_text();blocks=[x for x in re.split(r'\r?\n\r?\n',raw) if x.startswith('HTTP/')];lines=(blocks[-1] if blocks else '').splitlines();m=re.match(r'HTTP/\S+\s+(\d+)',lines[0] if lines else '');status=int(m.group(1)) if m else 0;headers={};redirect_origin=None
   for line in lines[1:]:
    if ':' not in line:continue
    k,v=line.split(':',1);k=k.lower();v=v.strip()
    if k in SELECTED_HEADERS:headers[k]=v
    if k=='location':u=urlsplit(v);redirect_origin=u.scheme+'://'+u.netloc if u.netloc else 'same_origin'
   body=body_path.read_bytes() if method=='GET' and body_path.exists() else b''
   record={'deployment':args.deployment,'path':path,'method':method,'status':status,'expected_status':expected_status,'bytes':len(body),'sha256':digest(body),'headers':headers,'cached':False,'redirect_origin':redirect_origin}
   record['pass']=status==expected_status and redirect_origin is None
   if static_relative:
    wanted=wanted_static[static_relative];exact=len(body)==wanted['size'] and digest(body)==wanted['sha256'];suffix=body[wanted['size']:];toolbar=static_relative.endswith('.html') and len(body)==wanted['size']+163 and digest(body[:wanted['size']])==wanted['sha256'] and digest(suffix)==KNOWN_TOOLBAR_SHA
    record['certified_size']=wanted['size'];record['certified_sha256']=wanted['sha256'];record['source_match']='byte_exact' if exact else 'source_plus_known_vercel_toolbar' if toolbar else 'different';record['pass']=record['pass'] and (exact or toolbar)
   if path.endswith('.html') and status==200:record['project_name_marker']=b'id="project-name"' in body or b"id='project-name'" in body;record['pass']=record['pass'] and record['project_name_marker']
   if path.startswith('/api/') and method=='GET':
    expected_body_sha='baf2d3f4ba4eb406ecc1b43c99890be6c25d2053847e8258db4fe88f08be25d1' if path in ['/api/booking-availability','/api/booking-create'] else '29b2b6080bf977ba877db84d0eb04cd4ede4cfab3c4b29dd71637a8a6c37e3f8'
    record['safe_response_matches_verified_preview']=digest(body)==expected_body_sha
    record['pass']=record['pass'] and record['safe_response_matches_verified_preview']
   if status in [401,403] or redirect_origin is not None:record['authentication_blocked']=True
   # Never retain authentication pages or raw headers/cookies.
   if record['pass']:bp.write_bytes(body)
   mp.write_text(json.dumps(record,ensure_ascii=False)+'\n')
   if record.get('authentication_blocked'):raise RuntimeError('PRODUCTION_AUTHENTICATION_BLOCKED')
   return record

 work=[{'path':'/','static_relative':'index.html'}]+[{'path':'/'+slug+'.html','static_relative':slug+'.html'} for slug in EXPECTED['slugs']]+[{'path':p,'static_relative':p.lstrip('/')} for p in EXPECTED['representative_resources']]
 pool=concurrent.futures.ThreadPoolExecutor(max_workers=args.workers)
 futures=[pool.submit(http,**row) for row in work]
 try:
  for future in concurrent.futures.as_completed(futures):
   record=future.result();http_records.append(record)
   if len(http_records)%20==0:save('http-progress.json',{'deployment':args.deployment,'completed':len(http_records),'planned':len(work),'failures':sum(not r.get('pass') for r in http_records),'records':http_records});print(json.dumps({'http_completed':len(http_records),'planned':len(work),'failures':sum(not r.get('pass') for r in http_records)}),flush=True)
 except BaseException:
  for future in futures:future.cancel()
  pool.shutdown(wait=True,cancel_futures=True)
  raise
 finally:pool.shutdown(wait=True,cancel_futures=True)
 for item in EXPECTED['safe_endpoints']:http_records.append(http(item['path'],method=item['method'],expected_status=item['status']))
 check('root_131_fiches_resources_http',all(r.get('pass') for r in http_records),{'requests':len(http_records),'failures':[{'path':r['path'],'method':r['method'],'status':r['status'],'source_match':r.get('source_match')} for r in http_records if not r.get('pass')]})
 save('http-results.json',{'deployment':args.deployment,'origin':origin,'requests':len(http_records),'records':http_records,'real_forms_submitted':0,'mutating_requests':0})
except Exception as exc:
 failures.append({'check':'verification_execution','detail':str(exc) if isinstance(exc,RuntimeError) and re.fullmatch(r'[A-Z0-9_]+',str(exc)) else type(exc).__name__})
finally:
 summary={'deployment':args.deployment,'verifiedAtUTC':datetime.now(timezone.utc).isoformat(),'passed':not failures,'checks':checks,'failures':failures,'source_files_compared':len(source_rows),'http_requests_completed':len(http_records),'expected_http_requests':132+len(EXPECTED['representative_resources'])+7,'read_only':True,'source_files_redownloaded':0,'api_writes':0,'real_forms_submitted':0,'credentials_or_protections_modified':False,'watchdog_seconds':55,'active_own_process_groups':sorted(active_groups),'process_group_cleanup':'Own CLI process groups only; SIGTERM then SIGKILL if necessary, including runner SIGINT/SIGTERM.'}
 save('verification-summary.json',summary);print(json.dumps(summary,ensure_ascii=False),flush=True)
 if failures:raise SystemExit(1)
