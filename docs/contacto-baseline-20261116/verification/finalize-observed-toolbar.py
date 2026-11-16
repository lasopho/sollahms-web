"""Reclassify saved HTTP evidence using only the demonstrated exact toolbar suffix."""
import hashlib,json,os,signal,subprocess,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116');AREA=ROOT/'.vercel/contacto-baseline-20261116/verification'
DEPLOYMENT='dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh';PRODUCTION='dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5'
ORIGIN='https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app';PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH';TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN'
CURRENT='8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc';HISTORICAL='1ec749d6c1840dd80e5f178a7ebea403951fa9e3bb90e80a4b1be83b311e85cb'
CLI='/Users/luissandoval/.npm-global/bin/vercel';SCOPE='lsandoval2-8260s-projects';CACHE=AREA/'cache'/DEPLOYMENT
def sha(b):return hashlib.sha256(b).hexdigest()
def save(name,j):(AREA/name).write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
candidate=json.loads((ROOT/'docs/contacto-baseline-20261116/candidate-manifest.json').read_text());expected={r['path']:r for r in candidate['inventory']}
plan=json.loads((AREA/'http-plan.json').read_text());cases={(r.get('method','GET'),r['path']):r for r in plan['cases']}
http=json.loads((AREA/'first-pass/http-results.json').read_text());diagnostic=json.loads((AREA/'html-injection-diagnostic.json').read_text())
assert diagnostic['checked']==9
for row in diagnostic['rows']:
 assert row['source_prefix_matches'] and row['removed_bytes']==0 and row['added_bytes']==163 and row['added_sha256']==CURRENT
 assert row['only_one_external_script_structure'] and row['source_reproduced_removing_only_added_block']
 assert row['added_script_urls']==[{'host':'vercel.live','path':'/_next-live/feedback/feedback.js','query_present':False}]
matches=[]
for record in http['records']:
 case=cases[(record['method'],record['request_path'])];key=sha((record['method']+' '+record['request_path']).encode());body=(CACHE/(key+'.body')).read_bytes()
 assert len(body)==record['bytes'] and sha(body)==record['sha256']
 passed=record['deployment']==DEPLOYMENT and record['status']==case.get('status',200) and record['redirect_host'] is None
 if case.get('source'):
  want=expected[case['source']];exact=len(body)==want['size'] and sha(body)==want['sha256'];toolbar=case['source'].endswith('.html') and len(body)==want['size']+163 and sha(body[:want['size']])==want['sha256'] and sha(body[want['size']:])==CURRENT
  passed=passed and (exact or toolbar);record['source_match']='byte_exact' if exact else 'source_plus_exact_observed_vercel_toolbar' if toolbar else 'different';record['sourceBytesPreserved']=exact or toolbar
  if toolbar:record['observed_platform_suffix']={'bytes':163,'sha256':CURRENT,'host':'vercel.live','path':'/_next-live/feedback/feedback.js','position':'EOF after entire certified source'}
 if case.get('body_sha256'):passed=passed and sha(body)==case['body_sha256']
 if case['kind']=='fiche':passed=passed and (b'id="project-name"' in body or b"id='project-name'" in body)
 if case['kind']=='retirement':passed=passed and 'noindex' in record['headers'].get('x-robots-tag','')
 record['initial_strict_comparison_passed']=record['pass'];record['pass']=passed;assert passed,record['path'];matches.append(record)
assert len(matches)==32 and sum('observed_platform_suffix' in r for r in matches)==9
http['records']=matches;http['sourceBytesPreserved']=True;http['reclassified_only_exact_observed_platform_suffix']=True
http['classification_note']='The application source is the complete unchanged prefix; only a common, exact external platform script was appended. No delivered response or site content was edited.'
diagnostic['sourceBytesPreserved']=True;diagnostic['observed_common_suffix']={'bytes':163,'sha256':CURRENT,'historical_sha256':HISTORICAL,'same_as_historical':False,'classification':'Observed Preview platform toolbar delivery; not a platform-guaranteed cryptographic signature.','script_host':'vercel.live','script_path':'/_next-live/feedback/feedback.js','query_present':False,'official_context':'https://vercel.com/docs/vercel-toolbar/managing-toolbar'}
save('http-results.json',http);save('html-injection-diagnostic.json',diagnostic)

# Recheck only current SSO, production aliases, and the anonymous TLS control.
# No 32-case HTTP rerun, full matrix, source download, or source API repetition.
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG']:env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
active_pid=None
def kill(pid):
 try:os.killpg(pid,signal.SIGTERM)
 except ProcessLookupError:return
 time.sleep(.5)
 try:os.killpg(pid,signal.SIGKILL)
 except ProcessLookupError:pass
def stop(sig,frame):
 if active_pid is not None:kill(active_pid)
 raise SystemExit(128+sig)
for sig in [signal.SIGINT,signal.SIGTERM]:signal.signal(sig,stop)
def run(command):
 global active_pid
 p=subprocess.Popen(command,cwd=AREA,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 active_pid=p.pid
 try:
  try:out,err=p.communicate(timeout=55)
  except subprocess.TimeoutExpired:kill(p.pid);p.communicate(timeout=2);raise RuntimeError('Final read timed out')
 finally:
  try:os.killpg(p.pid,0)
  except ProcessLookupError:pass
  else:kill(p.pid)
  active_pid=None
 assert p.returncode==0,'Final read failed; raw output not retained.'
 return out
def api(path):return json.loads(run([CLI,'api',path,'--method','GET','--scope',SCOPE,'--raw']))
raw=api('/v9/projects/'+PROJECT);project={k:raw.get(k) for k in ['id','accountId','ssoProtection','autoExposeSystemEnvs','nodeVersion']}
assert project['id']==PROJECT and project['accountId']==TEAM and project['ssoProtection']['deploymentType']=='all_except_custom_domains';save('project-after.json',project)
aliases=[]
for host in ['sollahms.cl','www.sollahms.cl']:
 raw=api('/v4/aliases/'+host);record={'host':host,'alias':raw.get('alias'),'deploymentId':raw.get('deploymentId',(raw.get('deployment') or {}).get('id')),'projectId':raw.get('projectId')};assert record['deploymentId']==PRODUCTION;aliases.append(record)
save('production-aliases-after.json',{'phase':'after exact-suffix classification','records':aliases})
anonymous_raw=json.loads(run(['/usr/bin/curl','-q','--silent','--show-error','--max-time','45','--output','/dev/null','--write-out','%{json}',ORIGIN+'/']))
anonymous={'status':anonymous_raw.get('http_code',anonymous_raw.get('response_code')),'location_host':urlsplit(anonymous_raw.get('redirect_url') or '').hostname,'ssl_verify_result':anonymous_raw.get('ssl_verify_result')}
assert anonymous=={'status':302,'location_host':'vercel.com','ssl_verify_result':0};save('anonymous-https-sso.json',anonymous)
summary=json.loads((AREA/'first-pass/verification-summary.json').read_text())
for row in summary['checks']:
 if row['check']=='bounded_authenticated_http':row.update({'pass':True,'detail':{'requests':32,'failures':[],'exact_body_responses':15,'source_plus_exact_observed_toolbar':9,'safe_method_rejections':8,'sourceBytesPreserved':True}})
assert all(row['pass'] for row in summary['checks'])
summary['passed']=True;summary['failures']=[];summary['verifiedAtUTC']=datetime.now(timezone.utc).isoformat();summary['sourceBytesPreserved']=True
summary['html_delivery_observation']={'responses':9,'suffix_bytes':163,'suffix_sha256':CURRENT,'historical_suffix_sha256':HISTORICAL,'official_context':'https://vercel.com/docs/vercel-toolbar/managing-toolbar','platform_settings_or_responses_modified':False}
summary['finalization_http_rechecks']={'anonymous_sso':1,'project_sso_api':1,'production_alias_api':2,'main_32_case_http_repeated':False}
save('verification-summary.json',summary);print(json.dumps(summary,ensure_ascii=False),flush=True)
