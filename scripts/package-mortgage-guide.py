"""Frozen static overlay; all existing server functions and commercial data preserved."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DOC=ROOT/'docs/mortgage-guide-20261029';BRANCH='codex/mortgage-guide-20261029'
base=json.loads((ROOT/'docs/crescer-20261029/deployment-files.json').read_text());files={f['file']:f for f in base};hashes=json.loads(files['release-hashes.json']['data'])
paths=json.loads((DOC/'navigation-pages.json').read_text())+['guia-hipotecaria.html','assets/css/guide-navigation.css','assets/css/mortgage-guide.css','assets/js/mortgage-guide.mjs','assets/js/mortgage-guide-engine.mjs','sitemap.xml']
for p in paths:
 raw=(ROOT/p).read_bytes();files['release/static/'+p]={'file':'release/static/'+p,'data':raw.decode()};hashes['static/'+p]=hashlib.sha256(raw).hexdigest()
for kind in ['manifest','source']:
 cfg=json.loads(files['vercel.json']['data'] if kind=='manifest' else (ROOT/'vercel.json').read_text());assert cfg['git']['deploymentEnabled']['main'] is False;cfg['git']['deploymentEnabled'][BRANCH]=False
 if kind=='manifest':files['vercel.json']={'file':'vercel.json','data':json.dumps(cfg)}
 else:(ROOT/'vercel.json').write_text(json.dumps(cfg,indent=2)+'\n')
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
overlay=set('release/static/'+p for p in paths)|{'vercel.json','release-hashes.json'}
for x in base:
 if x['file'] not in overlay:assert files[x['file']]==x,x['file']
assert len(hashes)==sum(k.startswith('release/') for k in files)
(DOC/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
report={'baselineProduction':'dpl_JAYMooKS6Sa8mSTjyPfbazAo6aqT','baseline':'docs/crescer-20261029/deployment-files.json','files':len(files),'artifactFiles':len(hashes),'navigationPages':len(paths)-6,'functionsUnchanged':True,'prepareOutputUnchanged':True,'commercialDataUnchanged':True,'overlay':paths}
(DOC/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print({k:v for k,v in report.items() if k!='overlay'})
