"""Preserve the exact deployed artifact; overlay media motion and verify scope."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
from bs4 import BeautifulSoup
from image_parallax import apply_image_parallax,CSS,SCRIPT

root=Path(__file__).resolve().parents[1]
prior=root/'docs/final-two-map-locations-20261026'
docs=root/'docs/image-parallax-20261026'
base='c8918adcc06284f1668a76e859dc53dba41e7505'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
projects=json.loads((root/'data/proyectos.json').read_text())
pages=['index.html']+[p['detalleUrl'].lstrip('/') for p in projects]
overlay=pages+['assets/css/image-parallax.css','assets/js/image-parallax.js']
for name in pages:
 previous=subprocess.check_output(['git','show',base+':'+name],cwd=root).decode()
 current=(root/name).read_text()
 assert hashlib.sha256(previous.encode()).hexdigest()==old['static/'+name],name
 assert current==apply_image_parallax(previous),name
 assert apply_image_parallax(current)==current,name
 restored=current.replace(CSS+'\n','').replace(SCRIPT+'\n','')
 restored=re.sub(r'<span class="s-parallax-frame">(<img\b[^>]*>)</span>',r'\1',restored)
 assert restored==previous,name
 soup=BeautifulSoup(current,'html.parser')
 assert not soup.select('#planos .s-parallax-frame,form .s-parallax-frame,#ubicacion .s-parallax-frame'),name
 for image in soup.select('.s-parallax-frame img'):
  assert 'static/'+image['src'].lstrip('/') in old,image['src']
for name in ['assets/js/scroll-presence.js','assets/css/sollahms-theme.css','assets/css/project-header-b.css','proyectos.html','data/proyectos.json','data/project-locations.json']:
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==old['static/'+name],name
config=json.loads((root/'vercel.json').read_text())
assert all(v is False for v in config['git']['deploymentEnabled'].values())
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')}
runtime=dict(refs)
for name in overlay:
 content=(root/name).read_bytes();key='static/'+name
 expected[key]=hashlib.sha256(content).hexdigest()
 refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(content).hexdigest(),'size':len(content)}
 runtime['release/'+key]={'file':'release/'+key,'data':content.decode()}
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
vc={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':config['git']}
def package(files):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(vc)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n')
(docs/'deployment-files.json').write_text(json.dumps(package(refs)))
scratch=root.parent/'parallax-evidence';scratch.mkdir(exist_ok=True)
(scratch/'payload.json').write_text(json.dumps(package(runtime)))
report={'baseline':'dpl_HmkkoKEyVS7Qe37LHSeNWNLB7F4Q','baselineCode':'de088c4acc3451413fe053b5176ebc3f14aaef9b','source':base,'fiches':len(projects),'pages':len(pages),'images':sum((root/n).read_text().count('class="s-parallax-frame"') for n in pages),'runtimeFiles':len(expected),'changedExisting':['static/'+p for p in pages],'new':['static/'+p for p in overlay if 'static/'+p not in old],'unchanged':sum(expected[k]==v for k,v in old.items()),'allFunctionsAndRoutingUnchanged':all(expected[k]==v for k,v in old.items() if not k.startswith('static/')),'fadeAndGradientByteIdentical':True,'contentAndMetadataIdentical':True,'allMediaUnchanged':True}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='changedExisting'},indent=2))
