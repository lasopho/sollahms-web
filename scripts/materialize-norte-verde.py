#!/usr/bin/env python3
"""Materialize reviewed PDF objects and readable plan crops; bind every output to SHA-256."""
import argparse,copy,hashlib,io,json,subprocess,tempfile
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
def digest(b): return hashlib.sha256(b).hexdigest()
def box(c,w,h):
 if isinstance(c,dict): c=[c['x'],c['y'],c['x']+c['width'],c['y']+c['height']]
 c=c or [0,0,1,1]
 assert len(c)==4 and 0<=c[0]<c[2]<=1 and 0<=c[1]<c[3]<=1
 return tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(c))
def materialize(records,inputdir,pdftoppm,root=ROOT):
 projects=[]
 with tempfile.TemporaryDirectory(prefix='nv-plans-') as td:
  cache={}; native_cache={}
  for item in records:
   r=copy.deepcopy(item); slug=r['slug']; doc=r['document']; src=Path(inputdir)/doc['fileName']; original=src.read_bytes(); assert digest(original)==doc['sha256']
   reader=PdfReader(src); assert len(reader.pages)==doc['pageCount']
   pdfpath=root/doc['localPath'].lstrip('/'); pdfpath.parent.mkdir(parents=True,exist_ok=True); pdfpath.write_bytes(original)
   doc.update(bytes=len(original),sourceSha256=doc['sha256'],sourcePage=1)
   candidates_cover=r['cover']; used=set(); outputimages=[]
   for n,a in enumerate(r['images']):
    key=(slug,a['sourcePage'])
    if key not in native_cache: native_cache[key]=list(reader.pages[a['sourcePage']-1].images)
    native=native_cache[key][a['imageIndex']]; assert digest(native.data)==a['originalSha256']
    im=Image.open(io.BytesIO(native.data)).convert('RGB'); assert im.size==(a['nativeWidth'],a['nativeHeight']); im=im.crop(box(a.get('crop'),*im.size)); im.thumbnail((1800,1800),Image.Resampling.LANCZOS)
    local=f'/assets/propiedades/norte-verde/{slug}/imagen-{n+1:02d}.webp'; dest=root/local.lstrip('/'); dest.parent.mkdir(parents=True,exist_ok=True); im.save(dest,'WEBP',quality=92,method=6)
    sha=digest(dest.read_bytes())
    if sha in used: dest.unlink(); continue
    used.add(sha)
    a.update(localPath=local,sha256=sha,width=im.width,height=im.height,sourceSha256=doc['sha256'],extractionMethod='pdf_image_object',visuallyVerified=True,bytes=dest.stat().st_size)
    if a.get('candidate', a.get('localPath'))==candidates_cover: r['cover']=local
    a.pop('candidate',None); outputimages.append(a)
   r['images']=outputimages; assert str(r['cover']).startswith('/assets/')
   for n,m in enumerate(r['models']):
    key=(slug,m['sourcePage']); prefix=Path(td)/(slug+'-'+str(m['sourcePage']))
    if key not in cache:
     subprocess.run([pdftoppm,'-f',str(m['sourcePage']),'-l',str(m['sourcePage']),'-singlefile','-scale-to','3000','-png',str(src),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
     cache[key]=prefix.with_suffix('.png')
    im=Image.open(cache[key]).convert('RGB'); im=im.crop(box(m.get('planCrop'),*im.size)); local=f'/assets/propiedades/norte-verde/{slug}/plano-{n+1:02d}.webp'; dest=root/local.lstrip('/'); im.save(dest,'WEBP',lossless=True,method=6)
    m['plan']={'localPath':local,'sha256':digest(dest.read_bytes()),'width':im.width,'height':im.height,'sourcePage':m['sourcePage'],'sourceSha256':doc['sha256'],'extractionMethod':'pdf_page_crop','renderMaxSide':3000,'crop':m.get('planCrop'),'visuallyVerified':True,'bytes':dest.stat().st_size}
   projects.append(r)
   print(json.dumps({'materialized':slug,'images':len(r['images']),'plans':len(r['models'])}),flush=True)
 return projects
if __name__=='__main__':
 p=argparse.ArgumentParser(); p.add_argument('--records',type=Path);p.add_argument('--manifest',type=Path);p.add_argument('--input',type=Path,required=True);p.add_argument('--pdftoppm',required=True);p.add_argument('--slugs',default='');p.add_argument('--output',type=Path,default=ROOT/'data/brochures-norte-verde.json');args=p.parse_args()
 assert bool(args.records) != bool(args.manifest)
 records=([json.loads(f.read_text()) for f in sorted(args.records.glob('*.json'))] if args.records else json.loads(args.manifest.read_text())['projects'])
 if args.slugs: records=[r for r in records if r['slug'] in args.slugs.split(',')]
 assert len({r['slug'] for r in records})==len(records)
 if not args.slugs: assert len(records)==17
 rows=materialize(records,args.input,args.pdftoppm)
 if args.slugs:
  changed={r['slug']:r for r in rows};rows=[changed.get(r['slug'],r) for r in json.loads(args.output.read_text())['projects']]
 baseline=json.loads((ROOT/'data/norte-verde-baseline.json').read_text())
 result={'schemaVersion':1,'sourcePolicy':'user_supplied_brochures_only','reviewDate':'2026-10-13','projects':rows,'baseline':baseline,'excluded':[{'slug':s,'reason':'Fuera de la lista definitiva autorizada'} for s in ['vergara-domeyko','atelier-prat-oficinas','corrientes-oficinas']]}
 args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'projects':len(rows),'images':sum(len(r['images']) for r in rows),'plans':sum(len(r['models']) for r in rows)}))
