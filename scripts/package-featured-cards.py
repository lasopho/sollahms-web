"""Overlay only four reviewed runtime files on the exact production manifest."""
import copy,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/featured-cards-20261029'
B=R/'docs/seo-corporate-20261029/deployment-files.json'
if not B.exists():B=R.parent/'seo-corporate-source/docs/seo-corporate-20261029/deployment-files.json'
assert hashlib.sha256(B.read_bytes()).hexdigest()=='e5169c9928f8f0b3cc02b9318830c7dab28ec17af8f1c9e692b4eefd33c0cf96'
a=json.loads(B.read_text());m={x['file']:x for x in a};original=copy.deepcopy(m)
allowed=['index.html','inn-puerto-chico.html','data/proyectos.json','data/catalog-facets.json']
h=json.loads(m['release-hashes.json']['data'])
for p in allowed:
 content=(R/p).read_text();m['release/static/'+p]={'file':'release/static/'+p,'data':content};h['static/'+p]=hashlib.sha256(content.encode()).hexdigest()
m['release-hashes.json']['data']=json.dumps(h,separators=(',',':'))
c=json.loads(m['vercel.json']['data']);c['git']['deploymentEnabled']['codex/featured-card-facts-20261029']=False;assert c['git']['deploymentEnabled']['main'] is False
m['vercel.json']['data']=json.dumps(c,separators=(',',':'))
changed=[p for p in m if m[p]!=original[p]]
assert set(changed)=={'release/static/'+p for p in allowed}|{'release-hashes.json','vercel.json'}
assert all(m[p]==original[p] for p in m if p.startswith('release/functions/'))
output=list(m.values());(D/'deployment-files.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
(R/'vercel.json').write_text(json.dumps({**json.loads((R/'vercel.json').read_text()),'git':c['git']},ensure_ascii=False,indent=2)+'\n')
(D/'package-check.json').write_text(json.dumps({'baselineDeployment':'dpl_Atu9RTqZT7ShuPDpmfuK4yGqQxN8','baselineManifestSha256':hashlib.sha256(B.read_bytes()).hexdigest(),'files':len(output),'changed':changed,'unchanged':len(output)-len(changed),'allFunctionInputsUnchanged':True,'candidateSha256':hashlib.sha256((D/'deployment-files.json').read_bytes()).hexdigest()},indent=2)+'\n')
print((D/'package-check.json').read_text())
