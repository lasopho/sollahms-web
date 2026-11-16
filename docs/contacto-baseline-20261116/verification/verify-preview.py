"""Bounded, read-only verification of the approved Contacto Preview. No deployments."""
import concurrent.futures,hashlib,json,os,re,signal,subprocess,tempfile,threading,time
from collections import Counter
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlsplit,unquote

ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116')
AREA=ROOT/'.vercel/contacto-baseline-20261116/verification'
DEPLOYMENT='dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh'
ORIGIN='https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app'
PRODUCTION='dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5'
COMMIT='a1f2930475e23ebb87bac1f8443877b06883fe60'
PIN='de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH';TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN';SCOPE='lsandoval2-8260s-projects'
CLI='/Users/luissandoval/.npm-global/bin/vercel'
TOOLBAR_SHA='8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc'
ERROR_SHA='29b2b6080bf977ba877db84d0eb04cd4ede4cfab3c4b29dd71637a8a6c37e3f8'
BOOKING_SHA='baf2d3f4ba4eb406ecc1b43c99890be6c25d2053847e8258db4fe88f08be25d1'
HEADERS={'content-type','content-security-policy','content-security-policy-report-only','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','strict-transport-security','cross-origin-opener-policy','cross-origin-resource-policy','cache-control','content-language','x-robots-tag','allow'}
os.umask(0o077);AREA.mkdir(parents=True,exist_ok=True);CACHE=AREA/'cache'/DEPLOYMENT;CACHE.mkdir(parents=True,exist_ok=True)
candidate=json.loads((ROOT/'docs/contacto-baseline-20261116/candidate-manifest.json').read_text());expected={r['path']:r for r in candidate['inventory']}
canonical=''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in sorted(expected.values(),key=lambda x:x['path'])).encode()
assert len(expected)==1660 and hashlib.sha256(canonical).hexdigest()==candidate['outputInventorySha256']==PIN
assert candidate['sourceCommit']==COMMIT and candidate['changedFiles']==1 and candidate['identicalFiles']==1659 and candidate['productionAuthorized'] is False
assert [r['path'] for r in candidate['changes']]==['static/contacto.html']
baseline=json.loads((ROOT/'docs/recorridos-eliminacion-20261115/local-qa-20261115/production/verification/expected.json').read_text());old={r['path']:r for r in baseline['inventory']}
assert sum(expected[p]==old[p] for p in expected)==1659
assert all(expected[p]==old[p] for p in expected if p.startswith('functions/') or p=='config.json')
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG']:env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
active=set();lock=threading.RLock();stopped=threading.Event();checks=[];failures=[];http_results=[];anonymous_executed=False

def digest(b):return hashlib.sha256(b).hexdigest()
def save(name,obj):(AREA/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def check(name,passed,detail=None):
 checks.append({'check':name,'pass':bool(passed),'detail':detail})
 if not passed:failures.append({'check':name,'detail':detail})
def kill_group(pid):
 try:os.killpg(pid,signal.SIGTERM)
 except ProcessLookupError:return
 time.sleep(.5)
 try:os.killpg(pid,signal.SIGKILL)
 except ProcessLookupError:pass
def on_signal(sig,frame):
 stopped.set();failures.append({'check':'interrupted','detail':signal.Signals(sig).name})
 with lock:pids=list(active)
 for pid in pids:kill_group(pid)
 raise SystemExit(128+sig)
for sig in [signal.SIGINT,signal.SIGTERM]:signal.signal(sig,on_signal)
def run(command):
 if stopped.is_set():raise RuntimeError('VERIFICATION_INTERRUPTED')
 p=subprocess.Popen(command,cwd=AREA,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 with lock:active.add(p.pid)
 timeout=False
 try:
  try:out,err=p.communicate(timeout=55)
  except subprocess.TimeoutExpired:timeout=True;kill_group(p.pid);out,err=p.communicate(timeout=2)
 finally:
  try:os.killpg(p.pid,0)
  except ProcessLookupError:pass
  else:kill_group(p.pid)
  with lock:active.discard(p.pid)
 if timeout or p.returncode!=0:raise RuntimeError('TRANSPORT_TIMEOUT' if timeout else 'TRANSPORT_EXIT_'+str(p.returncode))
 return out
def cli(arguments):return run([CLI,*arguments])
def api(path):return json.loads(cli(['api',path,'--method','GET','--scope',SCOPE,'--raw']))
def auth_guard():
 assert not (AREA/'.vercel/project.json').exists() and not (AREA/'.now/project.json').exists()
 assert not (ROOT/'.vercel/repo.json').exists()
 current=AREA
 while current.is_relative_to(ROOT):
  for name in ['vercel.json','vercel.toml','now.json']:
   p=current/name
   if p.exists():
    assert p.suffix=='.json' and not p.is_symlink()
    c=json.loads(p.read_text());assert 'services' not in c and 'experimentalServices' not in c
  if current==ROOT:break
  current=current.parent
def flatten(value,parent=''):
 if isinstance(value,list):
  for x in value:yield from flatten(x,parent)
 elif isinstance(value,dict):
  if 'files' in value and not ('name' in value or 'path' in value):yield from flatten(value['files'],parent);return
  name=value.get('path',value.get('file',value.get('name','')));path=name if value.get('path') or value.get('file') or name.startswith('src/') or name.startswith('out/') else '/'.join(x for x in [parent,name] if x)
  if isinstance(value.get('children'),list):yield from flatten(value['children'],path)
  elif path:yield {'path':path,'type':value.get('type'),'uid':value.get('uid',value.get('sha1',value.get('sha'))),'size':value.get('size'),'mode':value.get('mode')}
def alias_snapshot(phase):
 records=[]
 for host in ['sollahms.cl','www.sollahms.cl']:
  raw=api('/v4/aliases/'+host);dep=raw.get('deployment') or {};record={'host':host,'alias':raw.get('alias'),'deploymentId':raw.get('deploymentId',dep.get('id')),'projectId':raw.get('projectId')};records.append(record)
  check(phase+'_alias_'+host,record['deploymentId']==PRODUCTION,record)
 save('production-aliases-'+phase+'.json',{'phase':phase,'records':records})
def project_snapshot(phase):
 raw=api('/v9/projects/'+PROJECT);safe={k:raw.get(k) for k in ['id','accountId','ssoProtection','autoExposeSystemEnvs','nodeVersion']};save('project-'+phase+'.json',safe)
 check(phase+'_sso',(safe.get('ssoProtection') or {}).get('deploymentType')=='all_except_custom_domains')
 check(phase+'_project_team',safe.get('id')==PROJECT and safe.get('accountId')==TEAM)
 return safe
def http(row):
 path=row['path'];method=row.get('method','GET');status_expected=row.get('status',200);url=urlsplit(urljoin(ORIGIN,path))
 assert url.scheme=='https' and url.netloc==urlsplit(ORIGIN).netloc and method in ['GET','HEAD']
 assert not url.fragment and (not url.query or all(x.split('=',1)[0]=='v' for x in url.query.split('&')))
 auth_guard();key=digest((method+' '+path).encode());mp=CACHE/(key+'.json');bp=CACHE/(key+'.body')
 try:
  old_meta=json.loads(mp.read_text());body=bp.read_bytes()
  if old_meta.get('pass') is True and old_meta.get('deployment')==DEPLOYMENT and old_meta.get('method')==method and old_meta.get('request_path')==path and old_meta.get('sha256')==digest(body) and old_meta.get('bytes')==len(body):return dict(old_meta,cached=True)
 except (FileNotFoundError,json.JSONDecodeError):pass
 with tempfile.TemporaryDirectory(prefix='request-',dir=CACHE) as td:
  td=Path(td);head=td/'headers';body_file=td/'body';opts=['--silent','--show-error','--max-time','50','--dump-header',str(head)]
  opts+=['--head','--output','/dev/null'] if method=='HEAD' else ['--request','GET','--output',str(body_file)]
  cli(['curl',path,'--deployment',DEPLOYMENT,'--scope',SCOPE,'--',*opts])
  blocks=[b for b in re.split(r'\r?\n\r?\n',head.read_text()) if b.startswith('HTTP/')];lines=(blocks[-1] if blocks else '').splitlines();m=re.match(r'HTTP/\S+\s+(\d+)',lines[0] if lines else '');status=int(m.group(1)) if m else 0;headers={};redirect=None
  for line in lines[1:]:
   if ':' not in line:continue
   k,v=line.split(':',1);k=k.lower();v=v.strip()
   if k in HEADERS:headers[k]=v
   if k=='location':u=urlsplit(urljoin(ORIGIN,v));redirect=u.hostname
  body=body_file.read_bytes() if method=='GET' and body_file.exists() else b''
  record={'deployment':DEPLOYMENT,'path':url.path,'request_path':path,'method':method,'kind':row['kind'],'status':status,'expected_status':status_expected,'bytes':len(body),'sha256':digest(body),'headers':headers,'redirect_host':redirect,'cached':False,'pass':status==status_expected and redirect is None}
  relative=row.get('source')
  if relative:
   want=expected[relative];exact=len(body)==want['size'] and digest(body)==want['sha256'];toolbar=relative.endswith('.html') and len(body)==want['size']+163 and digest(body[:want['size']])==want['sha256'] and digest(body[want['size']:])==TOOLBAR_SHA
   record.update({'certified_source':relative,'certified_bytes':want['size'],'certified_sha256':want['sha256'],'source_match':'byte_exact' if exact else 'source_plus_known_vercel_toolbar' if toolbar else 'different'});record['pass']=record['pass'] and (exact or toolbar)
  if row['kind']=='fiche':record['project_marker']=b'id="project-name"' in body or b"id='project-name'" in body;record['pass']=record['pass'] and record['project_marker']
  if row.get('body_sha256'):record['safe_body_matches']=digest(body)==row['body_sha256'];record['pass']=record['pass'] and record['safe_body_matches']
  if row['kind']=='retirement':record['robots_noindex']='noindex' in headers.get('x-robots-tag','');record['pass']=record['pass'] and record['robots_noindex']
  if record['pass']:bp.write_bytes(body)
  mp.write_text(json.dumps(record,ensure_ascii=False)+'\n')
  if status in [401,403] or redirect is not None:raise RuntimeError('AUTHENTICATED_PREVIEW_ACCESS_BLOCKED')
  return record

try:
 cli_root=Path('/Users/luissandoval/.npm-global/lib/node_modules/vercel');assert json.loads((cli_root/'package.json').read_text())['version']=='65.16.0'
 helper_pins={'chunk-YWP266LP.js':'c7fd95099d0622c25f2861cb4a2952a1dc8f851433c1a69b48695ac9e8256a3a','chunk-W73OWT3V.js':'95ae68a792a79f3bcf265f4afbe8fdf45b8a68f3aea897aebeeff745aa2bc1bb','chunk-TTUCLAE5.js':'7ab957095f009450bdfd106f0533f39572238bf540f82d51601b4c2fa3da423e','chunk-FI7KYR23.js':'0359e23de1a387b1f622d649e1665a930be5510576d4d38256de766f0629d57c'}
 for name,pin in helper_pins.items():assert digest((cli_root/'node_modules/@vercel/cli-support/dist/chunks'/name).read_bytes())==pin
 auth_guard()
 raw=api('/v13/deployments/'+DEPLOYMENT);metadata={k:raw.get(k) for k in ['id','url','name','readyState','target','prebuilt','projectId','teamId','ownerId','source','alias']};metadata['meta']={k:(raw.get('meta') or {}).get(k) for k in ['githubCommitSha','githubCommitRef']};save('deployment-metadata.json',metadata)
 check('deployment_identity',metadata['id']==DEPLOYMENT and 'https://'+metadata['url']==ORIGIN)
 check('ready_private_preview',metadata['readyState']=='READY' and metadata['target'] is None and metadata['prebuilt'] is True)
 check('project_team',metadata['projectId']==PROJECT and TEAM in [metadata.get('teamId'),metadata.get('ownerId')])
 check('source_commit',metadata['meta']['githubCommitSha']==COMMIT)
 project_snapshot('before');alias_snapshot('before')
 tree=list(flatten(api('/v6/deployments/'+DEPLOYMENT+'/files')));source={r['path'][len('src/.vercel/output/'):]:r for r in tree if r['path'].startswith('src/.vercel/output/')}
 comparisons=[]
 for path,want in sorted(expected.items()):
  got=source.get(path);passed=bool(got and got['uid']==want['sha1'] and (not isinstance(got.get('size'),int) or got['size']==want['size']));comparisons.append({'path':path,'expected_sha1':want['sha1'],'actual_sha1':got.get('uid') if got else None,'certified_bytes':want['size'],'remote_explicit_bytes':got.get('size') if got else None,'pass':passed})
 check('all_1660_paths_hashes',set(source)==set(expected) and all(r['pass'] for r in comparisons))
 lambdas=[r for r in tree if r['type']=='lambda' and r['path'].startswith('out/api/')]
 check('seven_registered_functions',len(lambdas)==7 and {r['path'][3:] for r in lambdas}=={r['endpoint'] for r in baseline['functions']})
 save('source-comparison.json',{'deployment':DEPLOYMENT,'candidate_inventory_sha256':PIN,'source_records':len(source),'matched':sum(r['pass'] for r in comparisons),'remote_explicit_size_records':sum(isinstance(r.get('size'),int) for r in source.values()),'size_limit':'API sizes are checked if exposed; otherwise certified sizes are bound to identical remote SHA1 content addresses. No source body was downloaded.','preserved_against_by_uhr':1659,'approved_contacto_delta':1,'comparisons':comparisons})
 save('registered-functions.json',{'deployment':DEPLOYMENT,'lambdas':lambdas})
 if failures:raise RuntimeError('API_INTEGRITY_GATE_FAILED')
 raw_contact=(ROOT/'contacto.html').read_bytes();assert len(raw_contact)==expected['static/contacto.html']['size'] and digest(raw_contact)==expected['static/contacto.html']['sha256']
 class ContactResources(HTMLParser):
  def __init__(self):super().__init__();self.paths=[]
  def handle_starttag(self,tag,attrs):
   a=dict(attrs);ref=a.get('src') if tag in ['img','script'] else a.get('href') if tag=='link' and 'stylesheet' in a.get('rel','').split() else None
   if ref:
    u=urlsplit(urljoin(ORIGIN+'/contacto.html',ref))
    if u.scheme=='https' and u.netloc==urlsplit(ORIGIN).netloc:self.paths.append(u.path+('?' +u.query if u.query else ''))
 parser=ContactResources();parser.feed(raw_contact.decode())
 resources=list(dict.fromkeys(parser.paths));assert all('static'+urlsplit(p).path in expected for p in resources)
 work=[{'path':'/contacto.html','kind':'contacto','source':'static/contacto.html'},{'path':'/','kind':'home','source':'static/index.html'}]
 work += [{'path':p,'kind':'contact_resource','source':'static'+urlsplit(p).path} for p in resources]
 work += [{'path':'/'+slug+'.html','kind':'fiche','source':'static/'+slug+'.html'} for slug in ['inn-puerto-chico','plaza-las-condes','bcome','nucleo-costanera','bordevivo','distrito-centro']]
 work += [{'path':'/api/'+name,'kind':'safe_function','status':405,'body_sha256':ERROR_SHA} for name in ['advisory','contact','collaboration','orientation-contact']]
 work += [{'path':'/api/'+name,'kind':'safe_function','status':503,'body_sha256':BOOKING_SHA} for name in ['booking-availability','booking-create']]
 work += [{'path':'/api/uf','kind':'safe_function','method':'HEAD','status':405}]
 work += [{'path':p,'kind':'internal_source_denied','status':404,'source':'static/404.html'} for p in ['/AGENTS.md','/NEXT-PROMPT.md','/config.json','/functions/api/contact.func/api/contact.mjs']]
 work += [{'path':'/api/contact.mjs','kind':'function_suffix_execution_not_source','status':405,'body_sha256':ERROR_SHA},{'path':'/patio-brasil.html','kind':'retirement','status':410,'source':'static/410.html'}]
 save('http-plan.json',{'deployment':DEPLOYMENT,'requests':len(work),'contact_resources':resources,'cases':work,'previous_full_524_or_1485_repeated':False})
 pool=concurrent.futures.ThreadPoolExecutor(max_workers=2);futures=[pool.submit(http,row) for row in work]
 try:
  for future in concurrent.futures.as_completed(futures):
   record=future.result();http_results.append(record)
   if len(http_results)%10==0:print(json.dumps({'http_completed':len(http_results),'planned':len(work),'failures':sum(not r['pass'] for r in http_results)}),flush=True)
 except BaseException:
  for future in futures:future.cancel()
  pool.shutdown(wait=True,cancel_futures=True);raise
 finally:pool.shutdown(wait=True,cancel_futures=True)
 check('bounded_authenticated_http',len(http_results)==len(work) and all(r['pass'] for r in http_results),{'requests':len(work),'failures':[{'path':r['path'],'status':r['status'],'source_match':r.get('source_match')} for r in http_results if not r['pass']]})
 save('http-results.json',{'deployment':DEPLOYMENT,'candidate_inventory_sha256':PIN,'requests':len(http_results),'records':http_results,'source_match_counts':dict(Counter(r.get('source_match','method_rejection') for r in http_results))})
 # One unauthenticated GET: no curlrc, credentials, custom headers, cookies or redirects.
 anonymous_raw=json.loads(run(['/usr/bin/curl','-q','--silent','--show-error','--max-time','45','--output','/dev/null','--write-out','%{json}',ORIGIN+'/']))
 anonymous={'status':anonymous_raw.get('http_code',anonymous_raw.get('response_code')),'location_host':urlsplit(anonymous_raw.get('redirect_url') or '').hostname,'ssl_verify_result':anonymous_raw.get('ssl_verify_result')};anonymous_executed=True
 check('anonymous_https_sso',anonymous['status']==302 and anonymous['location_host']=='vercel.com' and anonymous['ssl_verify_result']==0,anonymous);save('anonymous-https-sso.json',anonymous)
 project_snapshot('after');alias_snapshot('after')
except Exception as exc:
 failures.append({'check':'execution','detail':str(exc) if isinstance(exc,RuntimeError) and re.fullmatch(r'[A-Z0-9_-]+',str(exc)) else type(exc).__name__})
finally:
 summary={'deployment':DEPLOYMENT,'url':ORIGIN,'verifiedAtUTC':datetime.now(timezone.utc).isoformat(),'passed':not failures,'candidate_inventory_sha256':PIN,'source_commit':COMMIT,'expected_source_files':1660,'baseline_preserved_files':1659,'changed_file':'static/contacto.html','function_bundles':7,'function_files':57,'http_authenticated_completed':len(http_results),'anonymous_sso_control_executed':anonymous_executed,'checks':checks,'failures':failures,'full_524_or_1485_repeated':False,'source_bodies_downloaded':0,'real_forms_submitted':0,'uf_provider_lookup_attempted':False,'api_writes':0,'deployments_created_or_promoted':0,'credentials_or_protections_modified':False,'active_own_process_groups':sorted(active),'watchdog_seconds':55}
 save('verification-summary.json',summary);print(json.dumps(summary,ensure_ascii=False),flush=True)
 if failures:raise SystemExit(1)
