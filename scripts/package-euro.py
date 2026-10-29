"""Frozen Euro overlay; no rebuild or provider changes. New assets are content-addressed."""
import base64,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/euro-20261029';BRANCH='codex/euro-brochures-20261029'
base=json.loads((R/'docs/purchase-stage-20261029/deployment-files.json').read_text());files={x['file']:dict(x) for x in base};hs=json.loads(files['release-hashes.json']['data'])
slugs=list(json.loads((R/'data/euro-commercial.json').read_text())['projects'])
paths=[s+'.html' for s in slugs]+['proyectos.html','contacto.html','agenda-asesoria.html','guia-hipotecaria.html','cuando-comprar-propiedad.html','data/proyectos.json','data/catalog-facets.json','data/project-locations.json','assets/css/project-brochure.css','assets/js/project-brochure.mjs','assets/js/project-request.mjs','assets/js/project-offers.mjs','assets/js/commercial-context.mjs','assets/js/advisory.mjs','assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-filter-engine.mjs','assets/js/catalog-map.mjs','assets/js/mortgage-guide.mjs','assets/js/mortgage-guide-engine.mjs','assets/js/purchase-stage-guide.mjs']
paths.append('sitemap.xml')
for name in ['data/amenities.json','data/project-features.json','data/fichas-proyectos.json']:
 if 'release/static/'+name in files:paths.append(name)
for p in paths:
 raw=(R/p).read_bytes();key='release/static/'+p;files[key]={'file':key,'data':raw.decode()};hs['static/'+p]=hashlib.sha256(raw).hexdigest()
assets=[];seen=set()
for p in json.loads((R/'data/euro-media.json').read_text())['projects'].values():
 for a in p.get('gallery',[])+p.get('planPages',[]):
  for item in [a]+([a['thumbnail']] if a.get('thumbnail') else []):
   path=item['url'].lstrip('/')
   if path in seen:continue
   seen.add(path);raw=(R/path).read_bytes();row={'path':path,'sha':hashlib.sha1(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw)};assets.append(row)
   assert row['sha256']==item['sha256']
   key='release/static/'+path;assert key not in files;files[key]={'file':key,'sha':row['sha'],'size':row['size']};hs['static/'+path]=row['sha256']
assert len(assets)==111
prepare=files['prepare-output.mjs']['data'];needle='"don-rafael"]';assert needle in prepare
prepare=prepare.replace(needle,'"don-rafael", '+', '.join(json.dumps(s) for s in slugs)+']').replace('replacement.size!==9','replacement.size!==21').replace('untouchedServerProjects:122','untouchedServerProjects:110')
assert 'replacement.size!==21' in prepare
files['prepare-output.mjs']={'file':'prepare-output.mjs','data':prepare}
for kind in ['source','manifest']:
 cfg=json.loads((R/'vercel.json').read_text() if kind=='source' else files['vercel.json']['data']);assert cfg['git']['deploymentEnabled']['main'] is False;cfg['git']['deploymentEnabled'][BRANCH]=False
 if kind=='source':(R/'vercel.json').write_text(json.dumps(cfg,indent=2)+'\n')
 else:files['vercel.json']={'file':'vercel.json','data':json.dumps(cfg)}
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hs,separators=(',',':'))}
allowed={'release/static/'+p for p in paths}|{'vercel.json','prepare-output.mjs','release-hashes.json'}
assert all(files[x['file']]==x for x in base if x['file'] not in allowed)
assert len(hs)==sum(k.startswith('release/') for k in files)
(D/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
(D/'upload-assets.json').write_text(json.dumps(assets,indent=2)+'\n')
report={'baselineProduction':'dpl_CwKecmoAPWkxhdbheFWEWfx3nntF','baselineCommit':'f8999fe8afa5962ae82c562d596e90c2a4099b6d','baseline':'docs/purchase-stage-20261029/deployment-files.json','files':len(files),'artifactFiles':len(hs),'newBinaryAssets':len(assets),'functionSourceUnchanged':True,'patioBrasil410Unchanged':True,'contactCatalogueSync':{'retainedPrevious':9,'addedEuro':12,'untouchedOtherProjects':110},'autoDeploymentDisabled':True,'overlay':paths,'manifestSha256':hashlib.sha256((D/'deployment-files.json').read_bytes()).hexdigest()}
(D/'packaging.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print({k:v for k,v in report.items() if k!='overlay'})
