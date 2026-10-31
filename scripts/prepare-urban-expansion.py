"""Package only the reviewed expansion over the frozen published release."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/entorno-ampliacion-20261031'
base=json.loads((R/'docs/entorno-20261031/deployment-files.json').read_text());entries={f['file']:dict(f) for f in base}
hashes=json.loads(entries['release-hashes.json']['data']); changed=[]
for path in ['data/urban-development.json','entorno-desarrollo-urbano.html']:
 raw=(R/path).read_bytes();key='release/static/'+path
 entries[key]={'file':key,'data':raw.decode(),'encoding':'utf-8'};hashes['static/'+path]=hashlib.sha256(raw).hexdigest();changed.append(path)
entries['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':')),'encoding':'utf-8'}
assert all(entries[f['file']]==f for f in base if f['file'].startswith('release/functions/'))
assert entries['release/config.json']==next(f for f in base if f['file']=='release/config.json')
(D/'deployment-files.json').write_text(json.dumps(list(entries.values()),ensure_ascii=False))
(D/'package-checks.json').write_text(json.dumps({'baseDeployment':'dpl_72BPGbcxhuj55cztQnAJ7fohvcvq','target':'preview only','sourceFiles':len(entries),'artifactFiles':len(hashes),'changedPublicFiles':changed,'functionsAndRoutesPreserved':True},indent=2)+'\n')
for path in changed:
 dest=R/'dist'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes((R/path).read_bytes())
print('Packaged',len(entries),'entries; only',changed)
