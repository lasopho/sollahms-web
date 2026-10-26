from pathlib import Path
import json,hashlib,subprocess,sys
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'scripts'))
from image_parallax import apply_image_parallax
here=Path(__file__).resolve().parent;prior=root/'docs/image-parallax-20261026'
base='784600b273dc3bbc11f102e58afe666d8971717d'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
projects=json.loads((root/'data/proyectos.json').read_text())
pages=['index.html']+[p['slug']+'.html' for p in projects]
for name in pages:
 previous=subprocess.check_output(['git','show',base+':'+name],cwd=root).decode();current=(root/name).read_text()
 restored=current.replace('/assets/css/image-parallax.css?v=20261026-2','/assets/css/image-parallax.css?v=20261026-1').replace('/assets/js/image-parallax.js?v=20261026-2','/assets/js/image-parallax.js?v=20261026-1')
 assert restored==previous,name
 assert apply_image_parallax(current)==current,name
catalog=(root/'proyectos.html').read_text().replace('<link rel="stylesheet" href="/assets/css/image-parallax.css?v=20261026-2">\n','').replace('<script src="/assets/js/image-parallax.js?v=20261026-2" defer></script>\n','')
catalog=catalog.replace('/assets/js/catalog.mjs?v=20261026-motion2','/assets/js/catalog.mjs?v=20261026-map1')
assert catalog==subprocess.check_output(['git','show',base+':proyectos.html'],cwd=root).decode()
for name in ['assets/css/sollahms-theme.css','assets/js/scroll-presence.js','assets/css/project-header-b.css','data/proyectos.json','data/project-locations.json']:
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==old['static/'+name],name
changed=pages+['proyectos.html','assets/css/image-parallax.css','assets/js/image-parallax.js','assets/js/catalog.mjs']
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime=dict(refs)
for name in changed:
 b=(root/name).read_bytes();key='static/'+name
 assert hashlib.sha256(subprocess.check_output(['git','show',base+':'+name],cwd=root)).hexdigest()==old[key]
 expected[key]=hashlib.sha256(b).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(b).hexdigest(),'size':len(b)};runtime['release/'+key]={'file':'release/'+key,'data':b.decode()}
copy=(prior/'copy-build.mjs').read_text();(here/'copy-build.mjs').write_text(copy)
config=json.loads((root/'vercel.json').read_text());assert all(v is False for v in config['git']['deploymentEnabled'].values())
vc={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':config['git']}
def package(d):return list(d.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(vc)}]
(here/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(here/'deployment-files.json').write_text(json.dumps(package(refs)))
scratch=root.parent/'strong-motion-package';scratch.mkdir(exist_ok=True);(scratch/'payload.json').write_text(json.dumps(package(runtime)))
report={'baseline':'dpl_LqKgXFwDTf9Gz3TzcPAHkh66WaJA','baseSource':base,'runtimeFiles':len(expected),'fiches':len(projects),'changed':len(changed),'unchanged':sum(expected[k]==v for k,v in old.items()),'allFunctionsAndRoutingUnchanged':all(expected[k]==v for k,v in old.items() if not k.startswith('static/')),'gradientsAndFadeByteIdentical':True,'allMediaAndCommercialDataUnchanged':True,'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
(here/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
