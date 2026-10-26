from pathlib import Path
import hashlib,json,shutil,subprocess
root=Path('/workspace/scratch/2bf2025ce132/map-source');docs=root/'docs/catalog-map-20261026';prior=root/'docs/catalog-views-20261026'
base='06a87c59b0e8c77596e50f18644a8e41fd49eea1';old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime={k:dict(v) for k,v in refs.items()}
static=Path('/workspace/scratch/2bf2025ce132/map-verification-static');shutil.copytree('/workspace/scratch/2bf2025ce132/catalog-verification-static',static,dirs_exist_ok=True)
for p in ['proyectos.html','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/css/catalog-map.css','assets/js/catalog-map.mjs','assets/js/catalog-map-model.mjs','data/map-provider.json','data/project-locations.json','assets/vendor/leaflet-1.9.4/leaflet.js','assets/vendor/leaflet-1.9.4/leaflet.css','assets/vendor/leaflet-1.9.4/LICENSE']:
 key='static/'+p;content=(root/p).read_bytes()
 if key in old:assert hashlib.sha256(subprocess.check_output(['git','show',base+':'+p],cwd=root)).hexdigest()==old[key]
 expected[key]=hashlib.sha256(content).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(content).hexdigest(),'size':len(content)};runtime['release/'+key]={'file':'release/'+key,'data':content.decode()};dest=static/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(content)
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
config={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':json.loads((root/'vercel.json').read_text())['git']}
def package(files):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(config)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(docs/'deployment-files.json').write_text(json.dumps(package(refs)))
items=package(runtime);Path('/workspace/scratch/2bf2025ce132/map-files.json').write_text(json.dumps(items));groups=[[]];size=0
for item in items:
 n=len(json.dumps(item))
 if size+n>180000:groups.append([]);size=0
 groups[-1].append(item);size+=n
for i,g in enumerate(groups):Path('/workspace/scratch/2bf2025ce132/map-part-'+str(i)+'.json').write_text(json.dumps(g))
changed=[k for k,v in old.items() if expected[k]!=v];assert set(changed)=={'static/proyectos.html','static/assets/js/catalog.mjs','static/assets/js/catalog-model.mjs'},changed
report={'baseline':'dpl_6NyvfFF8TH3734zmPLLKbkpCoTP6','baselineCode':'1302c57b14b596253fc35964632a8204ecad9847','sourceBase':base,'files':len(expected),'changedExisting':changed,'added':[k for k in expected if k not in old],'unchanged':sum(expected[k]==v for k,v in old.items()),'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'groups':len(groups)}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
