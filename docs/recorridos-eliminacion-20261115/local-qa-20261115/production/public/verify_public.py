"""Public, unauthenticated checks. No network runs without a promotion receipt."""
import argparse, concurrent.futures, datetime, hashlib, json, os, re, signal, subprocess, threading
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit, urlunsplit

ROOT=Path('/private/tmp/sollahms-recorridos-public-verify')
DOMAINS=('sollahms.cl','www.sollahms.cl')
ORIGINS=tuple(scheme+'://'+host for scheme in ('http','https') for host in DOMAINS)
PREVIEW_ID='dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi'
CURL='/usr/bin/curl'
MARKER='__SOLLAHMS_PUBLIC_META__'
STOP=threading.Event(); LOCK=threading.Lock(); ACTIVE={}
# Deliberately inherit no account, token, proxy, cookie, CA-override or debug env.
CURL_ENV={'PATH':'/usr/bin:/bin:/usr/sbin:/sbin','LANG':'C','LC_ALL':'C'}

def digest(data):return hashlib.sha256(data).hexdigest()
def safe_url(url):
 u=urlsplit(url);return urlunsplit((u.scheme,u.hostname or '',u.path or '/','',''))
def allowed(url):
 u=urlsplit(url)
 return u.scheme in ('http','https') and u.hostname in DOMAINS and u.port in (None,80,443) and not u.username and not u.password and not u.query and not u.fragment
def terminate(process):
 if process.poll() is not None:return
 try:os.killpg(process.pid,signal.SIGTERM)
 except ProcessLookupError:return
 try:process.wait(timeout=0.8)
 except subprocess.TimeoutExpired:
  try:os.killpg(process.pid,signal.SIGKILL)
  except ProcessLookupError:pass
def stop_handler(signum,frame):
 STOP.set()
 with LOCK:processes=list(ACTIVE.values())
 for p in processes:terminate(p)

def request_once(url,method,max_bytes):
 assert allowed(url) and method in ('GET','HEAD')
 args=[CURL,'--disable','--silent','--show-error','--globoff','--compressed',
  '--connect-timeout','12','--max-time','40','--max-filesize',str(max_bytes),
  '--proto','=http,https','--proto-redir','=http,https','--max-redirs','0',
  '--noproxy','*','--header','Authorization:','--header','Cookie:','--header','Proxy-Authorization:',
  '--output','/dev/null' if method=='HEAD' else '-',
  '--write-out','%{stderr}\n'+MARKER+'\n%{http_code}\n%{ssl_verify_result}\n%{redirect_url}\n']
 args+=['--head'] if method=='HEAD' else ['--request','GET']
 args+=['--url',url]
 if STOP.is_set():return {'status':0,'error':'interrupted'},b'',None
 p=subprocess.Popen(args,env=CURL_ENV,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 with LOCK:ACTIVE[p.pid]=p
 timed_out=False
 try:
  try:body,metadata=p.communicate(timeout=45)
  except subprocess.TimeoutExpired:
   timed_out=True;terminate(p);body,metadata=p.communicate(timeout=5)
 finally:
  with LOCK:ACTIVE.pop(p.pid,None)
 # stderr is never written or printed. It contains only curl diagnostics and
 # selected write-out values, not response headers; discard it after parsing.
 values=metadata.decode('utf8','replace').rsplit(MARKER+'\n',1)[-1].splitlines()
 try:status=int(values[0]);ssl_result=int(values[1]);location=values[2] if len(values)>2 else ''
 except (ValueError,IndexError):status=0;ssl_result=None;location=''
 is_https=urlsplit(url).scheme=='https'
 record={'url':safe_url(url),'method':method,'status':status,'curlExit':p.returncode,'watchdogExpired':timed_out,
  'tlsVerified':ssl_result==0 if is_https else None,'sslVerifyResult':ssl_result if is_https else None,
  'bytes':len(body),'sha256':digest(body)}
 if location:
  target=urljoin(url,location);record['location']=safe_url(target)
 else:target=None
 if p.returncode or timed_out or not status or (is_https and ssl_result!=0):record['error']='transport-or-tls-failure'
 return record,body,target

class Media(HTMLParser):
 def __init__(self):super().__init__();self.images=[];self.plans=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and a.get('src','').startswith(('/assets/propiedades/','/assets/euro/')):self.images.append(urlsplit(a['src']).path)
  if tag=='a' and a.get('href','').startswith('/assets/') and ('data-plan-full' in a or re.search('plan|plano|planta',a.get('aria-label','')+' '+a['href'],re.I)):
   self.plans.append(urlsplit(a['href']).path)

def tasks_and_sources(output,certificate):
 inventory={e['path']:e for e in certificate['inventory']}
 cache={}
 def source(path):
  if path not in cache:
   entry=inventory[path];data=(output/path).read_bytes()
   if len(data)!=entry['size'] or digest(data)!=entry['sha256']:raise ValueError('certified-source-integrity-failure')
   cache[path]=data
  return cache[path]
 catalogue=json.loads(source('static/data/proyectos.json'))
 if len(catalogue)!=131 or len({p['slug'] for p in catalogue})!=131:raise ValueError('catalogue-is-not-the-certified-131-fiches')
 tasks=[]
 def add(origin,path,kind,expected,source_path=None,method='GET'):
  tasks.append({'id':origin+' '+method+' '+path,'origin':origin,'path':path,'kind':kind,'method':method,'expectedStatus':expected,'sourcePath':source_path})
  if source_path:source(source_path)
 for origin in ORIGINS:
  add(origin,'/','home',200,'static/index.html')
  for p in catalogue:add(origin,'/'+p['slug']+'.html','fiche',200,'static/'+p['slug']+'.html')
 resources={'/assets/css/project-detail.css','/assets/css/project-embeds.css','/assets/css/project-header-b.css',
  '/assets/css/sollahms-theme.css','/assets/js/project-navigation.mjs','/assets/js/project-request.mjs',
  '/assets/js/project-embeds.js','/assets/js/project-brochure.mjs','/assets/branding/sollahms-logo.svg','/data/proyectos.json'}
 for slug in ('inn-puerto-chico','plaza-las-condes','bcome','nucleo-costanera','bordevivo','distrito-centro'):
  m=Media();m.feed(source('static/'+slug+'.html').decode('utf8'))
  resources.update(m.images[:1]);resources.update(m.plans[:1])
 safe_functions=[('/api/advisory',405,'GET'),('/api/booking-availability',503,'GET'),('/api/booking-create',503,'GET'),
  ('/api/collaboration',405,'GET'),('/api/contact',405,'GET'),('/api/orientation-contact',405,'GET'),('/api/uf',405,'HEAD')]
 internals=['/AGENTS.md','/NEXT-PROMPT.md','/lib/project-context.mjs','/scripts/prepare-isolated.py','/.vercel/output/config.json']
 for host in DOMAINS:
  origin='https://'+host
  for path in sorted(resources):
   if 'static'+path not in inventory:raise ValueError('representative-resource-missing-from-certificate')
   add(origin,path,'resource',200,'static'+path)
  for path,status,method in safe_functions:add(origin,path,'safe-function',status,method=method)
  for path in internals:add(origin,path,'internal-source-denied',404,'static/404.html')
  add(origin,'/api/contact.mjs','internal-api-rewrite-without-source',405)
 for origin in ORIGINS:
  for path in ('/patio-brasil','/patio-brasil/','/patio-brasil.html','/patio-brasil.html/'):
   add(origin,path,'retired-410',410,'static/410.html')
 return tasks,cache

def safe_json(body,booking):
 try:value=json.loads(body)
 except (ValueError,UnicodeError):return {'validJson':False,'matchesExpectedShape':False}
 if not isinstance(value,dict):return {'validJson':True,'matchesExpectedShape':False}
 if booking:
  match=set(value)=={'ok','code','mode','error'} and value.get('ok') is False and value.get('code')=='booking_not_certified' and value.get('mode')=='request-only'
  return {'validJson':True,'matchesExpectedShape':match,'requestOnlyConfirmed':match,'keys':sorted(set(value)&{'ok','code','mode','error'})}
 match=set(value)=={'error'} and value.get('error')=='Método no permitido.'
 return {'validJson':True,'matchesExpectedShape':match,'keys':sorted(set(value)&{'error'})}

def check(task,sources,deployment):
 row={k:v for k,v in task.items() if k!='sourcePath'};row['expectedProductionId']=deployment;row['hops']=[];row['pass']=False
 url=task['origin']+quote(task['path'],safe='/%.-_');visited=set();body=b''
 expected=sources.get(task.get('sourcePath'));limit=max(524288,(len(expected) if expected else 0)+65536)
 for index in range(7):
  if STOP.is_set():row['error']='interrupted';return row
  if not allowed(url) or url in visited:row['error']='redirect-not-allowed-or-loop';return row
  visited.add(url);hop,body,target=request_once(url,task['method'],limit);row['hops'].append(hop)
  if hop.get('error'):row['error']=hop['error'];return row
  if hop['status'] in (301,302,303,307,308):
   if not target or not allowed(target):row['error']='redirect-left-approved-query-free-domains';return row
   if urlsplit(url).scheme=='https' and urlsplit(target).scheme!='https':row['error']='https-downgrade';return row
   url=target;continue
  break
 else:row['error']='too-many-redirects';return row
 row['status']=row['hops'][-1]['status'];row['finalUrl']=safe_url(url);row['bytes']=len(body);row['sha256']=digest(body)
 row['redirectCount']=len(row['hops'])-1
 row['checks']={'statusExpected':row['status']==task['expectedStatus'],'finalHttps':urlsplit(url).scheme=='https',
  'allHttpsTlsVerified':all(h['tlsVerified'] for h in row['hops'] if h['url'].startswith('https://'))}
 if expected is not None:
  suffix=('<script async data-explicit-opt-in="true" data-deployment-id="'+deployment+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()
  exact=body==expected
  suffix_ok=task['sourcePath'].endswith('.html') and body==expected+suffix
  row['contentMatch']='exact' if exact else 'exact-plus-known-vercel-suffix' if suffix_ok else 'mismatch'
  row['certifiedSha256']=digest(expected);row['checks']['certifiedContentMatches']=exact or suffix_ok
 elif task['method']=='GET':
  row['safeJson']=safe_json(body,task['path'] in ('/api/booking-availability','/api/booking-create'))
  row['checks']['safeJsonExpected']=row['safeJson']['matchesExpectedShape']
 row['pass']=all(row['checks'].values());return row

def promotion_receipt(path,expected):
 if not expected or not re.fullmatch(r'dpl_[A-Za-z0-9]+',expected) or expected==PREVIEW_ID:raise ValueError('exact-production-deployment-id-required')
 data=path.read_bytes();j=json.loads(data)
 if j.get('deploymentId')!=expected or j.get('target')!='production' or j.get('promoted') is not True or j.get('aliasesApiVerified') is not True or set(j.get('domains',[]))!=set(DOMAINS):raise ValueError('matching-confirmed-promotion-receipt-required')
 stamp=datetime.datetime.fromisoformat(j['confirmedAtUtc'].replace('Z','+00:00'))
 if stamp.tzinfo is None:raise ValueError('promotion-receipt-needs-utc-offset')
 age=(datetime.datetime.now(datetime.timezone.utc)-stamp).total_seconds()
 if age < -60 or age > 1800:raise ValueError('promotion-receipt-must-be-current-within-30-minutes')
 return {'deploymentId':expected,'target':'production','promoted':True,'aliasesApiVerifiedByParent':True,'confirmedAtUtc':j['confirmedAtUtc'],'receiptSha256':digest(data)}

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--expected-production-id');parser.add_argument('--promotion-signal',type=Path,default=ROOT/'promotion-confirmed.json')
 parser.add_argument('--certified-output',type=Path,default=Path('/private/tmp/sollahms-recorridos-recovery/output'))
 parser.add_argument('--certificate',type=Path,default=Path('/private/tmp/sollahms-recorridos-recovery/verification-certified.json'))
 parser.add_argument('--concurrency',type=int,choices=(2,3,4),default=3)
 args=parser.parse_args()
 # This gate precedes all subprocess creation and all network operations.
 receipt=promotion_receipt(args.promotion_signal,args.expected_production_id)
 cert=json.loads(args.certificate.read_text());tasks,sources=tasks_and_sources(args.certified_output,cert)
 ROOT.mkdir(exist_ok=True);(ROOT/'runner.pid').write_text(str(os.getpid())+'\n')
 for sig in (signal.SIGINT,signal.SIGTERM,signal.SIGHUP):signal.signal(sig,stop_handler)
 results=[]
 def save():
  failures=[r['id'] for r in results if not r['pass']]
  report={'expectedProductionId':args.expected_production_id,'promotionReceipt':receipt,'aliasVerification':'Parent verifies Vercel aliases separately; this runner checks only public HTTP.',
   'expectedChecks':len(tasks),'completedChecks':len(results),'passedChecks':len(results)-len(failures),'complete':len(results)==len(tasks) and not STOP.is_set(),
   'failures':failures,'concurrency':args.concurrency,'publicUnauthenticated':True,'methods':['GET','HEAD'],'authHeadersSent':False,'cookiesSentOrStored':False,
   'rawHeadersStored':False,'responseBodiesStored':False,'formSubmissions':0,'tlsValidationDisabled':False,'results':results}
  temp=ROOT/'public-verification-results.tmp';temp.write_text(json.dumps(report,indent=2)+'\n');temp.replace(ROOT/'public-verification-results.json')
 try:
  with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
   futures={pool.submit(check,t,sources,args.expected_production_id):t for t in tasks}
   for future in concurrent.futures.as_completed(futures):
    task=futures[future]
    try:row=future.result()
    except Exception:row={'id':task['id'],'origin':task['origin'],'path':task['path'],'method':task['method'],'kind':task['kind'],'pass':False,'error':'verification-worker-failed'}
    results.append(row)
    if len(results)%10==0 or not row['pass']:save()
    if len(results)%25==0 or not row['pass']:print(json.dumps({'completed':len(results),'expected':len(tasks),'failed':sum(not r['pass'] for r in results),'last':row['id'],'pass':row['pass']}),flush=True)
 finally:
  with LOCK:processes=list(ACTIVE.values())
  for p in processes:terminate(p)
  save()
 failures=sum(not r['pass'] for r in results)
 print(json.dumps({'completed':len(results),'expected':len(tasks),'failures':failures,'stopped':STOP.is_set(),'expectedProductionId':args.expected_production_id}),flush=True)
 return 0 if not STOP.is_set() and len(results)==len(tasks) and failures==0 else 1

if __name__=='__main__':
 try:raise SystemExit(main())
 except (ValueError,KeyError,FileNotFoundError):
  # Do not print receipts, exception values, headers, URLs with queries or bodies.
  print(json.dumps({'networkExecuted':False,'error':'valid-current-production-promotion-signal-and-certified-inputs-required'}),flush=True)
  raise SystemExit(2)
