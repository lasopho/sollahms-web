"""Inspect only the nine failed HTML transport comparisons; retain no raw headers."""
import concurrent.futures,hashlib,json,os,re,signal,subprocess,time
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116')
AREA=ROOT/'.vercel/contacto-baseline-20261116/verification'
DEPLOYMENT='dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh';CACHE=AREA/'cache'/DEPLOYMENT
CLI='/Users/luissandoval/.npm-global/bin/vercel';SCOPE='lsandoval2-8260s-projects'
env=dict(os.environ)
for k in ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG']:env.pop(k,None)
env['PATH']='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
def sha(b):return hashlib.sha256(b).hexdigest()
def kill(pid):
 try:os.killpg(pid,signal.SIGTERM)
 except ProcessLookupError:return
 time.sleep(.5)
 try:os.killpg(pid,signal.SIGKILL)
 except ProcessLookupError:pass
def inspect(record):
 key=sha(('GET '+record['request_path']).encode());path=CACHE/(key+'.body');command=[CLI,'curl',record['request_path'],'--deployment',DEPLOYMENT,'--scope',SCOPE,'--','--silent','--show-error','--request','GET','--max-time','50','--output',str(path)]
 p=subprocess.Popen(command,cwd=AREA,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 try:
  try:p.communicate(timeout=55)
  except subprocess.TimeoutExpired:kill(p.pid);p.communicate(timeout=2);raise RuntimeError('Diagnostic transport timed out')
 finally:
  try:os.killpg(p.pid,0)
  except ProcessLookupError:pass
  else:kill(p.pid)
 assert p.returncode==0
 body=path.read_bytes();assert len(body)==record['bytes'] and sha(body)==record['sha256'],'Response changed; do not classify against another body.'
 relative=record['certified_source'];source_path=ROOT/'contacto.html' if relative=='static/contacto.html' else ROOT/'.vercel/contacto-baseline-20261116/baseline/output'/relative
 source=source_path.read_bytes();assert len(source)==record['certified_bytes'] and sha(source)==record['certified_sha256']
 prefix=0
 while prefix<min(len(source),len(body)) and source[prefix]==body[prefix]:prefix+=1
 suffix=0
 while suffix<min(len(source)-prefix,len(body)-prefix) and source[-1-suffix]==body[-1-suffix]:suffix+=1
 added=body[prefix:len(body)-suffix if suffix else len(body)];removed=source[prefix:len(source)-suffix if suffix else len(source)]
 urls=[]
 for raw in re.findall(rb'<script\b[^>]*\bsrc=[\"\x27]([^\"\x27]+)',added):
  u=urlsplit(raw.decode());urls.append({'host':u.hostname,'path':u.path,'query_present':bool(u.query)})
 return {'path':record['path'],'status':record['status'],'source_bytes':len(source),'served_bytes':len(body),'source_prefix_matches':body.startswith(source),'first_difference_offset':prefix,'common_suffix_bytes':suffix,'added_bytes':len(added),'removed_bytes':len(removed),'added_sha256':sha(added),'removed_sha256':sha(removed),'added_script_tags':len(re.findall(rb'<script\b',added)),'added_script_urls':urls,'only_one_external_script_structure':bool(re.fullmatch(rb'\s*<script\b[^>]*>\s*</script>\s*',added)),'source_reproduced_removing_only_added_block':body[:prefix]+(body[-suffix:] if suffix else b'')==source,'cached_response_body_unchanged':True}
all_records=json.loads((AREA/'http-results.json').read_text())['records'];failed=[r for r in all_records if not r['pass']];assert len(failed)==9 and all(r.get('source_match')=='different' for r in failed)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(inspect,failed))
report={'deployment':DEPLOYMENT,'checked':len(rows),'rows':rows,'api_or_application_mutations':0,'raw_headers_retained':False,'attribute_values_or_queries_logged':False}
(AREA/'html-injection-diagnostic.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
