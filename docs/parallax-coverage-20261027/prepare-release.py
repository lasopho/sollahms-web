from pathlib import Path
import json,hashlib,subprocess,re,sys
root=Path(__file__).resolve().parents[2];here=Path(__file__).resolve().parent;prior=root/'docs/strong-parallax-hover-20261026';base='dd44a38303bcaa559fc4add937fb5d3a13845577'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
previous=lambda p:subprocess.check_output(['git','show',base+':'+p],cwd=root)
changed=subprocess.check_output(['git','diff','--name-only',base],cwd=root).decode().splitlines()
allowed={'data/proyectos.json','assets/js/image-parallax.js'}
overrides=json.loads((root/'data/project-cover-overrides.json').read_text())
for p in changed:
 if p.endswith('.html'):
  oldpage=previous(p).decode();newpage=(root/p).read_text().replace('image-parallax.js?v=20261027-1','image-parallax.js?v=20261026-2')
  if p[:-5] in overrides:
   pattern=r'(<figure\b[^>]*class="ci-visual"[^>]*>\s*(?:<span\b[^>]*>)?)(<img\b[^>]*>)'
   oldtag=re.search(pattern,oldpage)[2];newpage=re.sub(pattern,lambda m:m[1]+oldtag,newpage,count=1)
  assert newpage==oldpage,('Unexpected HTML change',p)
  allowed.add(p)
olddata=json.loads(previous('data/proyectos.json'));newdata=json.loads((root/'data/proyectos.json').read_text());assert len(newdata)==132
for a,b in zip(olddata,newdata):
 assert a['slug']==b['slug']
 for key in set(a)|set(b):
  if a['slug'] in overrides and key in ['imagenPrincipal','imagenAlt']:continue
  assert a.get(key)==b.get(key),(a['slug'],key)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime=dict(refs)
for p in changed:
 key='static/'+p
 if key not in old:continue
 assert p in allowed,p
 b=(root/p).read_bytes();assert hashlib.sha256(previous(p)).hexdigest()==old[key]
 expected[key]=hashlib.sha256(b).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(b).hexdigest(),'size':len(b)};runtime['release/'+key]={'file':'release/'+key,'data':b.decode()}
for p in ['assets/css/sollahms-theme.css','assets/js/scroll-presence.js','assets/css/image-parallax.css','assets/css/project-header-b.css','assets/js/catalog.mjs','data/project-locations.json']:
 assert hashlib.sha256((root/p).read_bytes()).hexdigest()==old['static/'+p],p
copy=(prior/'copy-build.mjs').read_text();(here/'copy-build.mjs').write_text(copy)
cfg=json.loads((root/'vercel.json').read_text());assert all(v is False for v in cfg['git']['deploymentEnabled'].values())
vc={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':cfg['git']}
def package(d):return list(d.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(vc)}]
(here/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(here/'deployment-files.json').write_text(json.dumps(package(refs)))
out=root.parent/'parallax-coverage-package';out.mkdir(exist_ok=True);(out/'payload.json').write_text(json.dumps(package(runtime)))
report={'baselineDeployment':'dpl_8iNWfR2uLFXvpxTLmc8EMBCrapsF','baseSource':base,'runtimeFiles':len(expected),'changed':sum(expected[k]!=v for k,v in old.items()),'unchanged':sum(expected[k]==v for k,v in old.items()),'fiches':132,'coversReplaced':list(overrides),'commercialDataUnchanged':True,'allFunctionsRoutingMediaUnchanged':True,'fadeGradientsHoverUnchanged':True,'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
(here/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
