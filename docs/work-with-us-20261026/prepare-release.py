from pathlib import Path
import hashlib,json,subprocess,re
root=Path('/workspace/scratch/e9abb65be658/sollahms-web');docs=root/'docs/work-with-us-20261026';prior=root/'docs/catalog-map-20261026'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime={k:dict(v) for k,v in refs.items()}
base='b28104f60e94a6a5b1a1e76396f7977e85624624'
def replace(key,content):
 b=content.encode();expected[key]=hashlib.sha256(b).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(b).hexdigest(),'size':len(b)};runtime['release/'+key]={'file':'release/'+key,'data':content}
changed=subprocess.check_output(['git','diff','--name-only',base],cwd=root,text=True).splitlines()
static=[p for p in changed if p.endswith('.html') and '/' not in p]+['sitemap.xml','trabaja-con-nosotros.html','assets/css/collaboration.css','assets/js/collaboration.mjs','assets/js/collaboration-fields.mjs']
for p in static:
 key='static/'+p
 if key in old:
  previous=subprocess.check_output(['git','show',base+':'+p],cwd=root);assert hashlib.sha256(previous).hexdigest()==old[key],p+' differs from published base'
  if p.endswith('.html') and p!='privacidad.html':
   current=(root/p).read_text();strip=lambda s:re.sub(r'<a\b[^>]*href="/trabaja-con-nosotros.html"[^>]*>Trabaja con nosotros</a>\n','',s)
   assert strip(current)==previous.decode(),p+' changes beyond footer'
 replace(key,(root/p).read_text())
func='functions/api/collaboration.func/'
for p in ['api/collaboration.mjs','assets/js/collaboration-fields.mjs','assets/js/commercial-fields.mjs','assets/js/rut.mjs','lib/form-operation-server.mjs']:replace(func+p,(root/p).read_text())
config=json.loads(Path('/workspace/scratch/2bf2025ce132/scroll-intense-baseline/.vercel/output/functions/api/advisory.func/.vc-config.json').read_text());config['handler']='api/collaboration.mjs';config['shouldDisableAutomaticFetchInstrumentation']=True
replace(func+'.vc-config.json',json.dumps(config))
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
vc={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':json.loads((root/'vercel.json').read_text())['git']}
def package(files,hashes):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(hashes,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(vc)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(docs/'deployment-files.json').write_text(json.dumps(package(refs,expected)))
prod=package(runtime,expected);qa=dict(runtime);qhash=dict(expected)
fixture="""import {createCollaborationHandler} from './collaboration.mjs';
// Protected isolated transport: this module can never call a real provider.
const seen=new Map();
export default createCollaborationHandler({getEnvironment:()=> 'production',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',fetchImpl:async(url,opts)=>{
 const e=JSON.parse(opts.body);
 if(url!=='https://api.resend.com/emails'||e.reply_to!=='qa@example.invalid'||!e.text.includes('Nombre completo: QA')||!e.text.includes('1000005-K')||!e.text.includes('+56900000000')||!e.text.includes('Página de origen: https://sollahms.cl/trabaja-con-nosotros.html')||e.to.join()!=='contacto@sollahms.cl')return Response.json({}, {status:400});
 if(e.text.includes('ERROR AISLADO'))return Response.json({}, {status:503});
 if(e.text.includes('VALIDACION AISLADA'))throw Error('Isolated transport failure');
 const key=opts.headers['Idempotency-Key'];if(seen.has(key)&&seen.get(key)!==opts.body)return Response.json({name:'invalid_idempotent_request'},{status:409});seen.set(key,opts.body);
 return Response.json({id:'synthetic-collaboration-reception-only'});
}});
"""
(root/'tests/collaboration-preview-fixture.mjs').write_text(fixture)
qcfg=dict(config);qcfg['handler']='api/collaboration-fixture.mjs'
for key,content in [(func+'.vc-config.json',json.dumps(qcfg)),(func+'api/collaboration-fixture.mjs',fixture)]:qa['release/'+key]={'file':'release/'+key,'data':content};qhash[key]=hashlib.sha256(content.encode()).hexdigest()
for mode,items in [('prod',prod),('qa',package(qa,qhash))]:
 Path('/workspace/scratch/e9abb65be658/'+mode+'-files.json').write_text(json.dumps(items));groups=[[]];size=0
 for item in items:
  n=len(json.dumps(item))
  if size+n>180000:groups.append([]);size=0
  groups[-1].append(item);size+=n
 for i,g in enumerate(groups):Path('/workspace/scratch/e9abb65be658/'+mode+'-part-'+str(i)+'.json').write_text(json.dumps(g))
 print(mode,'groups',len(groups))
report={'baseline':'dpl_3oonHWwYJWRJgA3x7iFVnE9UKdkk','baselineCode':'608f72c7523f95b5b721d56d42adf11a05ec3341','files':len(expected),'unchanged':sum(expected[k]==v for k,v in old.items()),'changedExisting':[k for k,v in old.items() if expected[k]!=v],'added':[k for k in expected if k not in old],'aggregate':hashlib.sha256(json.dumps(expected,separators=(',',':')).encode()).hexdigest(),'allPriorFunctionsUnchanged':all(expected[k]==v for k,v in old.items() if k.startswith('functions/'))}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print({k:v if not isinstance(v,list) else len(v) for k,v in report.items()})
