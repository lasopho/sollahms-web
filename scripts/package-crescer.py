"""Frozen production overlay: two fiches and scoped shared data, no server rebuild."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DOCS=ROOT/'docs/crescer-20261029';BRANCH='codex/crescer-brochures-20261029'
base=json.loads((ROOT/'docs/advanced-filters-20261029/deployment-files.json').read_text());files={x['file']:x for x in base};hashes=json.loads(files['release-hashes.json']['data'])
paths=['don-tomas.html','don-rafael.html','proyectos.html','data/proyectos.json','data/catalog-facets.json','assets/css/project-brochure.css','assets/js/project-brochure.mjs','assets/js/project-request.mjs','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-map.mjs','assets/js/catalog-filter-controls.mjs']
for path in ['data/amenities.json','data/project-features.json','data/fichas-proyectos.json']:
    if 'release/static/'+path in files:paths.append(path)
for path in paths:
    raw=(ROOT/path).read_bytes();files['release/static/'+path]={'file':'release/static/'+path,'data':raw.decode()};hashes['static/'+path]=hashlib.sha256(raw).hexdigest()
assets=[];media=json.loads((DOCS/'asset-manifest.json').read_text())
for slug,project in media['projects'].items():
    source=ROOT/'assets/brochures/crescer'/f'{slug}.pdf';assets.append({'path':str(source.relative_to(ROOT))})
    for asset in project['plans']+project['gallery']:
        assets.extend({'path':a['path'][1:]} for a in [asset,asset['thumbnail']])
for asset in assets:
    raw=(ROOT/asset['path']).read_bytes();asset.update(sha=hashlib.sha1(raw).hexdigest(),sha256=hashlib.sha256(raw).hexdigest(),size=len(raw))
    key='release/static/'+asset['path'];assert key not in files
    files[key]={'file':key,'sha':asset['sha'],'size':asset['size']};hashes['static/'+asset['path']]=asset['sha256']
assert len(assets)==58
prepare=files['prepare-output.mjs']['data'].replace('nollagamSlugs','synchronizedSlugs').replace('"costanera-coquimbo-b"]','"costanera-coquimbo-b", "don-tomas", "don-rafael"]').replace('replacement.size!==7','replacement.size!==9').replace('Missing Nollagam identity','Missing approved commercial identity').replace('untouchedServerProjects:124','untouchedServerProjects:122')
assert 'replacement.size!==9' in prepare and '"don-rafael"' in prepare
files['prepare-output.mjs']={'file':'prepare-output.mjs','data':prepare}
config=json.loads(files['vercel.json']['data']);assert config['git']['deploymentEnabled']['main'] is False
config['git']['deploymentEnabled'][BRANCH]=False;files['vercel.json']={'file':'vercel.json','data':json.dumps(config,ensure_ascii=False)}
local=json.loads((ROOT/'vercel.json').read_text());local['git']['deploymentEnabled'][BRANCH]=False;(ROOT/'vercel.json').write_text(json.dumps(local,indent=2)+'\n')
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hashes,separators=(',',':'))}
overlay=set('release/static/'+p for p in paths)|{'release-hashes.json','vercel.json','prepare-output.mjs'}
for item in base:
    if item['file'] not in overlay:assert files[item['file']]==item
assert len(hashes)==sum(k.startswith('release/') for k in files)
(DOCS/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
(DOCS/'upload-assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
report={'baseline':'docs/advanced-filters-20261029/deployment-files.json','baselineProduction':'dpl_24fFPj7gmpr41spEjfj9JpRN3rJY','files':len(files),'artifactFiles':len(hashes),'changedTextFiles':len(paths),'addedBinaryAssets':len(assets),'allOtherRecordsUnchanged':True,'contactCatalogueSync':{'retainedNollagam':7,'addedCrescer':2,'untouchedOtherProjects':122},'overlay':sorted(overlay)}
(DOCS/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='overlay'}))
