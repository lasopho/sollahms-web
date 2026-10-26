from pathlib import Path
import hashlib,json,subprocess,re,sys
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[2];docs=Path(__file__).resolve().parent;prior=root/'docs/catalog-address-pins-20261026'
base='84fb2ce7f7f12cc407831fce852eccb7da1d06e7'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime={k:dict(v) for k,v in refs.items()}
def replace(key,content):
 b=content.encode();expected[key]=hashlib.sha256(b).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(b).hexdigest(),'size':len(b)};runtime['release/'+key]={'file':'release/'+key,'data':content}
changed=subprocess.check_output(['git','diff','--name-only',base],cwd=root,text=True).splitlines()
static=[p for p in changed if p.endswith('.html') and '/' not in p]+['assets/js/collaboration.mjs','assets/js/collaboration-fields.mjs']
for p in static:
 previous=subprocess.check_output(['git','show',base+':'+p],cwd=root);key='static/'+p
 assert hashlib.sha256(previous).hexdigest()==old[key],p+' differs from current publication'
 current=(root/p).read_text()
 if p.endswith('.html') and p not in ['trabaja-con-nosotros.html','privacidad.html']:
  strip=lambda s: re.sub(r'\s+','',re.sub(r'<a\b[^>]*href="/trabaja-con-nosotros.html"[^>]*>Trabaja con nosotros</a>','',s))
  assert strip(current)==strip(previous.decode()),p+' changes beyond footer'
 replace(key,current)
func='functions/api/collaboration.func/'
for p in ['api/collaboration.mjs','assets/js/collaboration-fields.mjs']:
 previous=subprocess.check_output(['git','show',base+':'+p],cwd=root)
 assert hashlib.sha256(previous).hexdigest()==old[func+p]
 replace(func+p,(root/p).read_text())
# Every deployed HTML footer retains exactly one entry, inside its section container.
footers=0
for key in old:
 if not key.startswith('static/') or not key.endswith('.html'):continue
 p=root/key.removeprefix('static/')
 if not p.exists():continue
 soup=BeautifulSoup(p.read_text(),'html.parser');footer=soup.find('footer')
 if not footer:continue
 links=footer.select('a[href="/trabaja-con-nosotros.html"]');assert len(links)==1,str(p)
 assert links[0].parent!=footer,str(p)
 footers+=1
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
vc={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':json.loads((root/'vercel.json').read_text())['git']}
def package(files,hashes):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(hashes,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(vc)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(docs/'deployment-files.json').write_text(json.dumps(package(refs,expected)))
qa=dict(runtime);qhash=dict(expected)
# Recover the unchanged function config from the preceding collaboration deployment package.
config=json.loads((docs/'function-config.json').read_text())
assert hashlib.sha256(json.dumps(config).encode()).hexdigest()==old[func+'.vc-config.json']
config['handler']='api/collaboration-fixture.mjs'
for key,content in [(func+'.vc-config.json',json.dumps(config)),(func+'api/collaboration-fixture.mjs',(root/'tests/collaboration-preview-fixture.mjs').read_text())]:
 qa['release/'+key]={'file':'release/'+key,'data':content};qhash[key]=hashlib.sha256(content.encode()).hexdigest()
for mode,items in [('contact-prod',package(runtime,expected)),('contact-qa',package(qa,qhash))]:
 (root.parent/(mode+'-files.json')).write_text(json.dumps(items));groups=[[]];size=0
 for item in items:
  n=len(json.dumps(item))
  if size+n>180000:groups.append([]);size=0
  groups[-1].append(item);size+=n
 for i,g in enumerate(groups):(root.parent/(mode+'-part-'+str(i)+'.json')).write_text(json.dumps(g))
 print(mode,'groups',len(groups))
report={'baseline':'dpl_B5M5RA5Jxh8aoAEo1EQUezyAhLVW','baselineSource':base,'files':len(expected),'changedExisting':[k for k,v in old.items() if expected[k]!=v],'unchanged':sum(expected[k]==v for k,v in old.items()),'allOtherFunctionsUnchanged':all(expected[k]==v for k,v in old.items() if k.startswith('functions/') and not k.startswith(func)),'allMapAndCatalogueFilesUnchanged':all(expected[k]==v for k,v in old.items() if k.startswith(('static/data/','static/assets/js/catalog','static/assets/css/catalog')) or k=='static/proyectos.html'),'footerPagesChecked':footers,'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print({k:(len(v) if isinstance(v,list) else v)for k,v in report.items()})
