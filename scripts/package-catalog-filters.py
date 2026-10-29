"""Overlay the frozen production artifact; preserve all server functions exactly."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DOCS=ROOT/'docs/advanced-filters-20261029'
BRANCH='codex/advanced-project-filters-20261029'
base=json.loads((ROOT/'docs/project-journey-20261029/deployment-files.json').read_text())
files={x['file']:x for x in base};hashes=json.loads(files['release-hashes.json']['data'])
paths=['proyectos.html','data/catalog-facets.json','assets/css/catalog-filters.css','assets/js/catalog-filter-engine.mjs','assets/js/catalog-filter-controls.mjs','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-map.mjs']
for path in paths:
    raw=(ROOT/path).read_bytes();files['release/static/'+path]={'file':'release/static/'+path,'data':raw.decode()};hashes['static/'+path]=hashlib.sha256(raw).hexdigest()
config=json.loads(files['vercel.json']['data']);assert config['git']['deploymentEnabled']['main'] is False
config['git']['deploymentEnabled'][BRANCH]=False
files['vercel.json']={'file':'vercel.json','data':json.dumps(config,ensure_ascii=False)}
local=json.loads((ROOT/'vercel.json').read_text());local['git']['deploymentEnabled'][BRANCH]=False
(ROOT/'vercel.json').write_text(json.dumps(local,indent=2)+'\n')
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
overlay=set('release/static/'+p for p in paths)|{'release-hashes.json','vercel.json'}
for item in base:
    if item['file'] not in overlay:assert files[item['file']]==item
assert len(hashes)==sum(k.startswith('release/') for k in files)
(DOCS/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
report={'baseline':'docs/project-journey-20261029/deployment-files.json','baselineProduction':'dpl_3QCEfBraJUKqYUpyUFoKv69kxW7N','files':len(files),'artifactFiles':len(hashes),'changedTextFiles':len(paths),'allOtherRecordsUnchanged':True,'overlay':sorted(overlay)}
(DOCS/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report))
