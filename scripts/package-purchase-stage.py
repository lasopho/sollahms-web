"""Freeze only reviewed static additions over the approved production artifact."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/purchase-stage-20261029';BRANCH='codex/purchase-stage-guide-20261029'
base=json.loads((R/'docs/mortgage-references-20261029/deployment-files.json').read_text());files={f['file']:dict(f) for f in base};hs=json.loads(files['release-hashes.json']['data'])
paths=json.loads((D/'navigation-pages.json').read_text())+['assets/css/purchase-stage.css','assets/css/purchase-stage-entry.css','assets/js/purchase-stage-engine.mjs','assets/js/purchase-stage-guide.mjs','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-filter-engine.mjs','assets/js/catalog-filter-controls.mjs','data/catalog-facets.json','sitemap.xml']
changed=[]
for p in paths:
 raw=(R/p).read_bytes();key='release/static/'+p;row={'file':key,'data':raw.decode()}
 if files.get(key)!=row:changed.append(p)
 files[key]=row;hs['static/'+p]=hashlib.sha256(raw).hexdigest()
for kind in ['manifest','source']:
 cfg=json.loads(files['vercel.json']['data'] if kind=='manifest' else (R/'vercel.json').read_text());assert cfg['git']['deploymentEnabled']['main'] is False;cfg['git']['deploymentEnabled'][BRANCH]=False
 if kind=='manifest':files['vercel.json']={'file':'vercel.json','data':json.dumps(cfg)}
 else:(R/'vercel.json').write_text(json.dumps(cfg,indent=2)+'\n')
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hs,separators=(',',':'))}
allowed={'release/static/'+p for p in paths}|{'vercel.json','release-hashes.json'}
assert all(files[x['file']]==x for x in base if x['file'] not in allowed)
assert len(hs)==sum(k.startswith('release/') for k in files)
(D/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
report={'baselineProduction':'dpl_He1qR2FMycizNdYjqENpRxudU6HN','baseline':'docs/mortgage-references-20261029/deployment-files.json','files':len(files),'artifactFiles':len(hs),'functionsUnchanged':True,'prepareOutputUnchanged':True,'commercialDataUnchanged':True,'patioBrasil410Unchanged':True,'autoDeploymentDisabled':True,'overlay':changed}
(D/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({k:v for k,v in report.items() if k!='overlay'})
