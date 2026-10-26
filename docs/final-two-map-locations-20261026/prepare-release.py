from pathlib import Path
import json,hashlib,subprocess
root=Path(__file__).resolve().parents[2];docs=Path(__file__).resolve().parent;prior=root/'docs/official-project-addresses-20261026'
base='96eefe1bcb437816a4d47e0a4b7378b1d108c640'
old=json.loads((prior/'candidate-hashes.json').read_text());expected=dict(old)
refs={f['file']:f for f in json.loads((prior/'deployment-files.json').read_text()) if f['file'].startswith('release/')};runtime={k:dict(v) for k,v in refs.items()}
changed=['data/project-locations.json','data/proyectos.json','mirador-la-florida.html']
for p in changed:
 key='static/'+p;content=(root/p).read_bytes();previous=subprocess.check_output(['git','show',base+':'+p],cwd=root)
 assert hashlib.sha256(previous).hexdigest()==old[key],p
 expected[key]=hashlib.sha256(content).hexdigest();refs['release/'+key]={'file':'release/'+key,'sha':hashlib.sha1(content).hexdigest(),'size':len(content)};runtime['release/'+key]={'file':'release/'+key,'data':content.decode()}
copy=(prior/'copy-build.mjs').read_text();(docs/'copy-build.mjs').write_text(copy)
config={'version':2,'framework':None,'buildCommand':'node prepare-output.mjs','installCommand':'','git':json.loads((root/'vercel.json').read_text())['git']}
def package(files):return list(files.values())+[{'file':'prepare-output.mjs','data':copy},{'file':'release-hashes.json','data':json.dumps(expected,ensure_ascii=False)},{'file':'vercel.json','data':json.dumps(config)}]
(docs/'candidate-hashes.json').write_text(json.dumps(expected,indent=2)+'\n');(docs/'deployment-files.json').write_text(json.dumps(package(refs)))
scratch=root.parent/'final-two-map-package';scratch.mkdir(exist_ok=True)
(scratch/'payload.json').write_text(json.dumps(package(runtime)))
report={'baseline':'dpl_HphMyTm2PcfiYJdy8CvE41ThKRj1','baselineSource':base,'files':len(expected),'changedExisting':['static/'+p for p in changed],'unchanged':sum(expected[k]==v for k,v in old.items()),'allFunctionsUnchanged':all(expected[k]==v for k,v in old.items() if k.startswith('functions/')),'aggregate':hashlib.sha256(json.dumps(expected,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
(docs/'package-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
