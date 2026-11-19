from pathlib import Path
import json,hashlib,shutil
r=Path('/private/tmp/sollahms-mapa-21-20261119');old=Path('/private/tmp/sollahms-fichas-iris-release-20261119');base=old/'stage/.vercel/output';stage=r/'release/stage';out=stage/'.vercel/output';app=Path('/private/tmp/sollahms-mapa-filtros-21-20261119')
h=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads((old/'MANIFIESTO-CANDIDATO-SIN-CITAS-IRIS.json').read_text());expected={x['path']:x for x in m['inventory']}
actual={str(p.relative_to(base)):p for p in base.rglob('*') if p.is_file()}
assert len(actual)==1721 and set(actual)==set(expected)
assert all(h(p.read_bytes())==expected[k]['sha256'] for k,p in actual.items())
if not out.exists():shutil.copytree(base,out)
allowed=['assets/js/catalog.mjs','assets/js/catalog-map.mjs','assets/js/catalog-expansion-locations.mjs','data/catalog-expansion-locations-20261119.json']
for path in allowed:
 target=out/'static'/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(app/path,target)
(stage/'.vercel/project.json').write_text(json.dumps({'projectId':'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','orgId':'team_A9VNIW2f2K1IJpd2pGdvDmEN','projectName':'project-wrapp'},indent=2)+'\n')
rows=[]
for p in sorted(out.rglob('*')):
 if p.is_file():
  b=p.read_bytes();rows.append({'path':str(p.relative_to(out)),'bytes':len(b),'sha256':h(b),'sha1':hashlib.sha1(b).hexdigest()})
new={x['path']:x for x in rows};added=sorted(set(new)-set(expected));removed=sorted(set(expected)-set(new));changed=sorted(k for k in set(new)&set(expected) if new[k]['sha256']!=expected[k]['sha256'])
assert added==['static/assets/js/catalog-expansion-locations.mjs','static/data/catalog-expansion-locations-20261119.json'] and not removed
assert changed==['static/assets/js/catalog-map.mjs','static/assets/js/catalog.mjs']
assert len(rows)==1723
manifest={'schemaVersion':1,'baseSourceCommit':'49312fd708ccd9e319511432e4b657788f5734f9','baseDeploymentId':'dpl_FhxqQpX3EZNDBg2AFPSsK3mJNhwr','baseFiles':1721,'files':len(rows),'bytes':sum(x['bytes'] for x in rows),'added':added,'changed':changed,'removed':removed,'unchanged':1719,'original131FichesUnchanged':True,'all152FichesUnchanged':True,'functionFilesUnchanged':57,'functionBundlesUnchanged':7,'configurationUnchanged':True,'inventorySHA256':h(''.join(x['path']+'\t'+str(x['bytes'])+'\t'+x['sha256']+'\n' for x in rows).encode()),'inventory':rows}
(r/'release/MANIFIESTO-PAQUETE-MAPA.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in manifest.items() if k!='inventory'},ensure_ascii=False))
