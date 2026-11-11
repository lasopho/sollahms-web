#!/usr/bin/env python3
"""Construct a frozen overlay and CAS source references; no deploy/provider mutation.

The base is authenticated by the prior exact provider registry, production config,
live four-copy hashes and current sitemap. Never package the checkout wholesale.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/attribution/2026-11-11'
BASE='6b2aabc1e80f09f850850d8458cfe0ab67a2a1a2'
PAGES=['index.html','centro-orientacion.html','guia-hipotecaria.html','comparador-hipotecario.html','cuando-comprar-propiedad.html','entorno-desarrollo-urbano.html','proyectos.html','contacto.html','agenda-asesoria.html','trabaja-con-nosotros.html','privacidad.html']
def digest(b,algorithm='sha256'): return hashlib.new(algorithm,b).hexdigest()
def git(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--work-dir',type=Path,required=True);args=ap.parse_args();work=args.work_dir.resolve()
 assert not work.exists() and not work.is_relative_to(ROOT),'Use a new work directory outside Git'
 expected=json.loads((DOC/'production-runtime-hashes.json').read_text())
 original=json.loads((ROOT/'docs/centro-orientacion-20261031/deployment-files.json').read_text())
 entries={x['file'][8:]:dict(x) for x in original if x['file'].startswith('release/')}
 for path in entries:
  if path.startswith('static/') and path.endswith('.html'): entries[path]={'file':'release/'+path,'data':git(path[7:]).decode(),'encoding':'utf-8'}
 entries['static/sitemap.xml']={'file':'release/static/sitemap.xml','data':git('sitemap.xml').decode(),'encoding':'utf-8'}
 entries['config.json']={'file':'release/config.json','data':(DOC/'production-output-config.json').read_text(),'encoding':'utf-8'}
 assert len(entries)==1648 and set(entries)==set(expected)
 for path,entry in entries.items():
  if 'data' in entry: assert digest(entry['data'].encode())==expected[path],path
 baseline=dict(expected);overlays={}
 for path in PAGES+['assets/js/form-operation.mjs','assets/js/acquisition.mjs','assets/js/acquisition-contract.mjs']:
  b=(ROOT/path).read_bytes()
  if path in PAGES:
   assert b.replace(b'<script type="module" src="/assets/js/acquisition.mjs"></script>\n',b'')==git(path),'HTML change exceeds the module loader: '+path
  overlays['static/'+path]=b
 for handler in ['advisory','collaboration','contact','orientation-contact']:
  api='contact' if handler=='orientation-contact' else handler
  path=f'functions/api/{handler}.func/api/{api}.mjs';b=(ROOT/f'api/{api}.mjs').read_text()
  if api=='contact':
   # Keep the already-public runtime catalogue projection exactly as production.
   production=entries[path]['data']
   for marker in ['IMPORT','DEFAULT']:
    start=f'// CONTACT_PUBLIC_CATALOGUE_{marker}_START';end=f'// CONTACT_PUBLIC_CATALOGUE_{marker}_END'
    old=b[b.index(start):b.index(end)+len(end)]
    if marker=='IMPORT': replacement='// Runtime catalogue is the exact verified public production projection.'
    else: replacement=production[production.index(start):production.index(end)+len(end)]
    b=b.replace(old,replacement)
   assert 'public-project-view' not in b
  overlays[path]=b.encode()
  for module in ['lib/acquisition-server.mjs','assets/js/acquisition-contract.mjs']:
   overlays[f'functions/api/{handler}.func/'+module]=(ROOT/module).read_bytes()
 for path,b in overlays.items():entries[path]={'file':'release/'+path,'data':b.decode(),'encoding':'utf-8'};expected[path]=digest(b)
 changed=sorted(p for p in baseline if expected[p]!=baseline[p]);added=sorted(set(expected)-set(baseline))
 assert len(changed)==16 and len(added)==10,(changed,added)
 assert all(expected[p]==baseline[p] for p in baseline if p not in changed)
 work.mkdir(parents=True);sources=[];uploads=[];unmaterialized=[]
 for path,entry in entries.items():
  b=entry.get('data');b=b.encode() if b is not None else None
  if b is None:
   local=path[7:] if path.startswith('static/') else path.split('.func/',1)[1] if '.func/' in path else ''
   source=ROOT/local
   if source.is_file() and digest(source.read_bytes(),'sha1')==entry['sha']:b=source.read_bytes()
  if b is not None:
   assert digest(b)==expected[path],path
   target=work/'release'/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
   row={'file':'release/'+path,'sha':digest(b,'sha1'),'size':len(b)}
  else:
   row={k:v for k,v in entry.items() if k in ['file','sha','size']};unmaterialized.append(path)
  sources.append(row)
  if path in overlays: uploads.append({'path':str(work/'release'/path),**row})
 generated={'runtime-hashes.json':json.dumps(expected,separators=(',',':')).encode(),
  'prepare-attribution-preview.mjs':(ROOT/'scripts/prepare-attribution-preview.mjs').read_bytes(),
  'vercel.json':json.dumps({'version':2,'framework':None,'buildCommand':'node prepare-attribution-preview.mjs','installCommand':'','git':{'deploymentEnabled':False}},separators=(',',':')).encode()}
 for name,b in generated.items():
  (work/name).write_bytes(b);row={'file':name,'sha':digest(b,'sha1'),'size':len(b)};sources.append(row);uploads.append({'path':str(work/name),**row})
 (work/'source-files.json').write_text(json.dumps(sources));(work/'uploads.json').write_text(json.dumps(uploads));(work/'baseline-source-files.json').write_text(json.dumps(original))
 (work/'summary.json').write_text(json.dumps({'baselineDeployment':'dpl_3LEibLxqAhX4bgak99HKNXNyhXuW','baseCommit':BASE,'baseFiles':len(baseline),'candidateFiles':len(expected),'changed':changed,'added':added,'unchanged':len(baseline)-len(changed),'localUnmaterialized':unmaterialized,'privatePreviewOnly':True},indent=2)+'\n')
 print(json.dumps({'workDir':str(work),'changed':len(changed),'added':len(added),'unchanged':len(baseline)-len(changed),'sources':len(sources),'uploads':len(uploads),'localUnmaterialized':len(unmaterialized)}))
if __name__=='__main__':main()
