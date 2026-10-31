"""Overlay the reviewed urban module on the retained production artifact. No deploy."""
import hashlib,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
D=R/'docs/entorno-20261031'
manifest=json.loads((R/'docs/metro-20261030/l9-deployment-files.json').read_text())
entries={f['file']:f for f in manifest}
# This build helper was independently matched to current production via Vercel.
assert hashlib.sha1(entries['prepare-output.mjs']['data'].encode()).hexdigest()=='1734701404b611c39e456c658e277e53fa0d3b98'
hashes=json.loads(entries['release-hashes.json']['data'])
changed=[]
for key,f in list(entries.items()):
 if not key.startswith('release/static/'):continue
 p=R/key.removeprefix('release/static/')
 if not p.is_file():raise ValueError('Missing reviewed public resource: '+key)
 content=p.read_bytes();oldsha=f.get('sha') or hashlib.sha1(f.get('data','').encode()).hexdigest()
 if hashlib.sha1(content).hexdigest()!=oldsha:
  # Only text differences in the current approved source are admitted.
  assert p.suffix in ['.html','.css','.mjs','.js','.json'],str(p)
  entries[key]={'file':key,'data':content.decode()};hashes[key.removeprefix('release/')]=hashlib.sha256(content).hexdigest();changed.append(key)
added=['entorno-desarrollo-urbano.html','assets/css/urban-works.css','assets/css/urban-fiche.css','assets/js/urban-works-page.mjs','assets/js/urban-works-model.mjs','assets/js/project-urban-works.mjs','data/urban-development.json']
for path in added:
 key='release/static/'+path;assert key not in entries
 content=(R/path).read_bytes();entries[key]={'file':key,'data':content.decode()};hashes['static/'+path]=hashlib.sha256(content).hexdigest()
entries['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
config=json.loads(entries['vercel.json']['data']);config.setdefault('git',{}).setdefault('deploymentEnabled',{})['codex/entorno-obras-20261031']=False
assert config['git']['deploymentEnabled']['main'] is False
entries['vercel.json']={'file':'vercel.json','data':json.dumps(config,ensure_ascii=False,indent=2)}
assert all(entries[f['file']]==f for f in manifest if f['file'].startswith('release/functions/'))
assert entries['release/config.json']==next(f for f in manifest if f['file']=='release/config.json')
# Reuse already-uploaded immutable blobs rather than resending old inline assets.
for original in manifest:
 current=entries[original['file']]
 if current==original and 'data' in current:
  raw=current['data'].encode()
  entries[original['file']]={'file':original['file'],'sha':hashlib.sha1(raw).hexdigest(),'size':len(raw)}
(D/'deployment-files.json').write_text(json.dumps(list(entries.values()),ensure_ascii=False))
report={'baseDeployment':'dpl_8rAgvVQSGPF9WbbDHsgeCHV3dkn5','baseSource':'c9b66b6e9ff44bf7eb91ff9502f1e858438856f8','target':'preview only','artifactFiles':len(hashes),'sourceFiles':len(entries),'allFunctionArtifactsPreserved':True,'routeConfigurationPreserved':True,'approvedSourceOverlays':changed,'newFiles':added,'mainDeploymentDisabled':True,'branchDeploymentDisabled':True}
(D/'package-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
