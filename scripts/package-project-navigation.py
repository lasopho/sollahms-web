"""Overlay the validated frozen artifact; never rebuild historical server functions."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs/project-journey-20261029'
base=json.loads((ROOT/'docs/amenities-20261028/deployment-files.json').read_text())
files={x['file']:x for x in base}
hashes=json.loads(files['release-hashes.json']['data'])
projects=json.loads((ROOT/'data/proyectos.json').read_text())
paths=[p['detalleUrl'].lstrip('/') for p in projects]+['proyectos.html','assets/css/project-navigation.css','assets/js/project-navigation.mjs','assets/js/project-request.mjs','assets/js/plaza-las-condes.mjs','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-map.mjs']
for path in paths:
    raw=(ROOT/path).read_bytes();files['release/static/'+path]={'file':'release/static/'+path,'data':raw.decode()};hashes['static/'+path]=hashlib.sha256(raw).hexdigest()
assets=json.loads((DOCS/'plan-assets.json').read_text())
if isinstance(assets,dict):assets=assets['assets']
for a in assets:
    raw=(ROOT/a['path']).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==a['sha256']
    assert hashlib.sha1(raw).hexdigest()==a['sha'] and len(raw)==a['size']
    key='release/static/'+a['path'];assert key not in files
    files[key]={'file':key,'sha':a['sha'],'size':a['size']};hashes['static/'+a['path']]=a['sha256']
config=json.loads(files['vercel.json']['data']);config['git']['deploymentEnabled']['codex/intelligent-project-fiches-20261029']=False
files['vercel.json']={'file':'vercel.json','data':json.dumps(config,ensure_ascii=False)}
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
overlay=set('release/static/'+p for p in paths)|set('release/static/'+a['path'] for a in assets)|{'release-hashes.json','vercel.json'}
for item in base:
    if item['file'] not in overlay:assert files[item['file']]==item
assert len(hashes)==sum(k.startswith('release/') for k in files)
(DOCS/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
report={'baseline':'docs/amenities-20261028/deployment-files.json','baselineProduction':'dpl_CnuKzaYFf7im7nGHb4LPDHG7FZV4','files':len(files),'artifactFiles':len(hashes),'changedTextFiles':len(paths),'addedPlans':len(assets),'allOtherRecordsUnchanged':True,'overlay':sorted(overlay)}
(DOCS/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='overlay'}))
