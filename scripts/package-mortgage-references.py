"""Narrow frozen overlay: final mortgage attribution only; no function rebuild."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/mortgage-references-20261029'
base=json.loads((R/'docs/mortgage-guide-20261029/deployment-files.json').read_text());files={f['file']:dict(f) for f in base};hs=json.loads(files['release-hashes.json']['data'])
for p in ['guia-hipotecaria.html','assets/css/mortgage-guide.css']:
 raw=(R/p).read_bytes();files['release/static/'+p]={'file':'release/static/'+p,'data':raw.decode()};hs['static/'+p]=hashlib.sha256(raw).hexdigest()
files['release-hashes.json']={'file':'release-hashes.json','data':json.dumps(hs,separators=(',',':'))}
allowed={'release/static/guia-hipotecaria.html','release/static/assets/css/mortgage-guide.css','release-hashes.json'}
assert all(files[f['file']]==f for f in base if f['file'] not in allowed)
assert json.loads(files['vercel.json']['data'])['git']['deploymentEnabled']['codex/mortgage-guide-20261029'] is False
(D/'deployment-files.json').write_text(json.dumps(list(files.values()),ensure_ascii=False,separators=(',',':')))
print('Only guide HTML/CSS overlaid; all other artifact records preserved.')
