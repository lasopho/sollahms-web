#!/usr/bin/env python3
"""Overlay reviewed public changes on the exact preceding production artifact."""
from pathlib import Path
import argparse,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--baseline',required=True);ap.add_argument('--destination',required=True);args=ap.parse_args()
base=Path(args.baseline);dest=Path(args.destination)
assert not dest.exists(), 'Use a fresh destination, never overwrite a deployment package'
shutil.copytree(base,dest)
manifest=json.loads((ROOT/'docs/maestra-brochures-20261025/manifest.json').read_text())
paths={slug+'.html' for slug in manifest['projects']}|{'data/proyectos.json','assets/css/brochure-media.css'}
for a in manifest['assets']:
 paths.add(a['path'].lstrip('/'))
 if 'thumbnail' in a:paths.add(a['thumbnail']['path'].lstrip('/'))
for path in paths:
 target=dest/'.vercel/output/static'/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/path,target)
shutil.copy2(ROOT/'vercel.json',dest/'vercel.json')
def hashes(root):return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
before=hashes(base/'.vercel/output');after=hashes(dest/'.vercel/output')
changed=[p for p in before if before[p]!=after.get(p)];added=[p for p in after if p not in before];removed=[p for p in before if p not in after]
assert not removed
assert set(changed+added)=={'static/'+p for p in paths}
assert all(before[p]==after[p] for p in before if p.startswith('functions/'))
assert sorted(p.name for p in (dest/'.vercel/output/static/data').iterdir())==['hipotecario.json','proyectos.json']
report={'baselineDeployment':manifest['rollbackDeployment'],'unchanged':len(before)-len(changed),'changed':changed,'added':added,'removed':removed,'functionsIdentical':True,'outputFiles':len(after),'sha256':after}
(ROOT/'docs/maestra-brochures-20261025/package-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['sha256','changed','added'] }));print('changed',len(changed),'added',len(added))
