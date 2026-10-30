"""Overlay the proven current production artifact; never rebuild protected assets."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/leon-commercial-20261030'
base=json.loads((D/'baseline-deployment-files.json').read_text());files={x['file']:dict(x) for x in base};hashes=json.loads(files['release-hashes.json']['data'])
assert hashlib.sha1(files['release-hashes.json']['data'].encode()).hexdigest()=='7f8954cee91e4a047aa8a66c5592446d1eb28d43','Baseline must match live Sento artifact receipt'
slugs=list(json.loads((D/'owner-input.json').read_text()))
paths=[s+'.html' for s in slugs]+['proyectos.html','data/proyectos.json','data/catalog-facets.json','data/project-locations.json','assets/js/project-offers.mjs','assets/js/catalog.mjs','assets/js/catalog-map.mjs','assets/js/catalog-filter-engine.mjs']
for p in paths:
 raw=(R/p).read_text();key='release/static/'+p;assert key in files
 files[key]={'file':key,'data':raw};hashes['static/'+p]=hashlib.sha256(raw.encode()).hexdigest()
# One bounded commercial projection, preserving the pinned Sento/León evidence.
key='release/functions/api/contact.func/lib/public-project-view.mjs'
assert files[key]['sha']=='1e711ebdc6e1583ff10f3d17b146358756f59c9e'
raw=(R/'lib/public-project-view.mjs').read_text();files[key]={'file':key,'data':raw};hashes[key[8:]]=hashlib.sha256(raw.encode()).hexdigest()
prepare=files['prepare-output.mjs']['data'];start=prepare.index('const synchronizedSlugs=new Set(')+len('const synchronizedSlugs=new Set(');end=prepare.index(');',start)
previous=json.loads(prepare[start:end]);assert len(previous)==48 and not set(previous)&set(slugs)
prepare=prepare[:start]+json.dumps(previous+slugs,ensure_ascii=False)+prepare[end:]
prepare=prepare.replace('replacement.size!==48','replacement.size!==53').replace('untouchedServerProjects:83','untouchedServerProjects:78')
assert 'replacement.size!==53' in prepare
files['prepare-output.mjs']={'file':'prepare-output.mjs','data':prepare}
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
allowed={'release/static/'+p for p in paths}|{key,'prepare-output.mjs','release-hashes.json'}
assert all(files[x['file']]==x for x in base if x['file'] not in allowed)
assert len(files)==len(base) and len(hashes)==sum(x.startswith('release/') for x in files)
assert json.loads(files['vercel.json']['data'])==json.loads((R/'vercel.json').read_text()),'Automatic deploy settings cannot change'
(D/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
report={'baselineDeployment':'dpl_DqeEbUHFWijsXgRuvCSh4kHAqsuW','baselineCommit':'f6980e3c374b2c56c5053191513d0d4ad34a30ae','files':len(files),'runtimeOverlay':paths+[key],'newAssets':0,'otherRuntimeFilesUnchanged':len(hashes)-len(paths)-1,'protectedSourceAssets':'unchanged','contactCatalogueSynchronized':53,'otherServerCatalogueRowsUnchanged':78,'mainAndAutomaticDeploymentSettings':'unchanged','sourceBranch':'codex/sento-commercial-20261030'}
(D/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
