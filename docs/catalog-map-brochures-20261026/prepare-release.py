from pathlib import Path
import json,hashlib,subprocess
root=Path(__file__).resolve().parents[2];docs=root/'docs/catalog-map-brochures-20261026';prior=root/'docs/work-with-us-20261026';base='895205da75b89908b8fc2c5033ff4852f6018ca6'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime={k:dict(v) for k,v in refs.items()}
changed=['assets/js/catalog-map.mjs','data/project-locations.json','data/proyectos.json','condominio-uruguay.html','jardines-de-ramon-cruz.html','mirador-la-florida.html']
for p in changed:
 key='static/'+p;content=(root/p).read_bytes();previous=subprocess.check_output(['git','show',base+':'+p],cwd=root);assert hashlib.sha256(previous).hexdigest()==old[key],p
 expected[key]=hashlib.sha256(content).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(content).hexdigest(),'size':len(content)};runtime['release/'+key]={'file':'release/'+key,'data':content.decode()}
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
config={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':json.loads((root/'vercel.json').read_text())['git']}
def package(files):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(config)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(docs/'deployment-files.json').write_text(json.dumps(package(refs)))
items=package(runtime);groups=[[]];size=0
for item in items:
 n=len(json.dumps(item))
 if size+n>160000:groups.append([]);size=0
 groups[-1].append(item);size+=n
scratch=root.parent/'brochure-map-review'
for i,g in enumerate(groups):(scratch/('release-part-'+str(i)+'.json')).write_text(json.dumps(g))
report={'baseline':'dpl_C8mXXxqLqMg75K9XYvXLdhAwPotb','baselineCode':base,'files':len(expected),'changedExisting':['static/'+p for p in changed],'unchanged':sum(expected[k]==v for k,v in old.items()),'allFunctionsUnchanged':all(expected[k]==v for k,v in old.items() if k.startswith('functions/')),'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'groups':len(groups)}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
