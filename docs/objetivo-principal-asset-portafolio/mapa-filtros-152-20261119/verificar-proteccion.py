from pathlib import Path
import subprocess,json,hashlib
r=Path('/private/tmp/sollahms-mapa-21-20261119');app=Path('/private/tmp/sollahms-mapa-filtros-21-20261119');base='49312fd708ccd9e319511432e4b657788f5734f9';doc='5e69b22eee46914b1a3a47d772ca0f9b47836c75'
def git(*a):return subprocess.check_output(['git',*a],cwd=app)
def sha(b):return hashlib.sha256(b).hexdigest()
manifest=json.loads(git('show',doc+':docs/catalog-data-completeness-20261116/leben/fase10-filtros-20261117/ARCHIVOS-PROTEGIDOS.json'));checks=[]
for row in manifest['files']:
 body=git('show','HEAD:'+row['path']);assert sha(body)==row['sha256'],row['path'];p=app/row['path'];assert not p.exists() or sha(p.read_bytes())==row['sha256'],row['path'];checks.append(row)
assert len(checks)==155
old=json.loads(git('show',base+':data/proyectos.json'));extra=json.loads(git('show',base+':data/catalog-expansion-iris-20261118.json'))['projects'];fiches=[p['detalleUrl'].lstrip('/') for p in old]+[p['detailUrl'].lstrip('/') for p in extra]
assert len(set(fiches))==152
for path in fiches:assert git('show','HEAD:'+path)==git('show',base+':'+path)
for path in ['data/proyectos.json','data/catalog-expansion-iris-20261118.json','data/project-locations.json','data/project-metro.json','data/metro-network.json','assets/js/metro-model.mjs','assets/js/catalog-filter-engine.mjs','assets/js/commercial-filter-engine.mjs','assets/js/catalog-model.mjs']:
 assert (app/path).read_bytes()==git('show',base+':'+path),path
allowed={'assets/js/catalog.mjs','assets/js/catalog-map.mjs','assets/js/catalog-expansion-locations.mjs','data/catalog-expansion-locations-20261119.json','tests/catalog-expansion-locations.test.mjs','vercel.json'}
status=git('status','--porcelain','--untracked-files=all').decode().splitlines();assert {s[3:] for s in status}==allowed,status
v=json.loads((app/'vercel.json').read_text());before=json.loads(git('show',base+':vercel.json'));before['git']['deploymentEnabled']['codex/mapa-filtros-21-proyectos-20261119']=False;assert v==before
res={'baseSourceCommit':base,'protectedHistoricalSourceFiles':len(checks),'protectedAllMatched':True,'all152FichesUnchanged':True,'original131FichesUnchanged':True,'originalCommercialJSONByteExact':True,'originalLocationRegistry131ByteExact':True,'originalMetroProjects100ByteExact':True,'originalStations126ByteExact':True,'sourceDeltaAllowlist':sorted(allowed),'automaticDeploymentExcluded':True,'sourceProtectedFiles':checks}
(r/'PRESERVACION-MAPA-152.json').write_text(json.dumps(res,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in res.items() if k!='sourceProtectedFiles'}))
