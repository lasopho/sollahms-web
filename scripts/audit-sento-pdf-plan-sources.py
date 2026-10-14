#!/usr/bin/env python3
"""Capture current official Sento plan cards, native images and linked PDFs.

Scope: the six brochure projects. This script does not mutate the published
review, catalogue, renderer or HTML. Originals and HTTP evidence remain private
in docs/qa/sento-final/plan-pdf-sources for a model-by-model audit.
"""
import concurrent.futures,datetime,hashlib,html,json,re,time,urllib.request,urllib.parse
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/qa/sento-final/plan-pdf-sources'
RESEARCH=ROOT/'data/sento-official-research.json'
HEADERS={'User-Agent':'Mozilla/5.0 (Sollahms documentary audit)'}
def sha(b):return hashlib.sha256(b).hexdigest()
def plain(t):return ' '.join(html.unescape(re.sub('<[^>]*>',' ',t)).split())
def number(t):
 m=re.search(r'\d+(?:[.,]\d+)?',t or '')
 return float(m[0].replace(',','.')) if m else None
def code(t):return re.sub(r'\s+','',t.replace('–','-').replace('−','-')).upper()
def fetch(url,destination):
 assert urllib.parse.urlsplit(url).hostname in {'sento.cl','www.sento.cl'},url
 started=time.time()
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=60) as r:
   assert urllib.parse.urlsplit(r.url).hostname in {'sento.cl','www.sento.cl'}
   body=r.read();destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(body)
   return {'sourceUrl':url,'finalUrl':r.url,'status':r.status,'bytes':len(body),'sha256':sha(body),'localPath':str(destination.relative_to(ROOT)),'contentType':r.headers.get('Content-Type'),'lastModified':r.headers.get('Last-Modified'),'httpDate':r.headers.get('Date'),'elapsedSeconds':round(time.time()-started,3)}
 except Exception as e:return {'sourceUrl':url,'error':str(e),'elapsedSeconds':round(time.time()-started,3)}
def inspect_project(p):
 slug=p['slugExistente'];record={'slug':slug,'officialUrl':p['urlOficial']};dest=OUT/(slug+'.html');proof=fetch(p['urlOficial'],dest);record['html']=proof
 if proof.get('error'):record['planCards']=[];return record
 raw=dest.read_text();record['linkedPdfs']=[];record['planCards']=[]
 for match in re.finditer(r'<div class="plantas-bloque">([\s\S]*?)<!-- plantas-bloque -->',raw):
  block=match[1];label=re.search(r'<h4[^>]*>([\s\S]*?)</h4>',block);image=re.search(r'<img[^>]+src=["\']([^"\']+)["\']',block)
  if not label or not image:continue
  title=plain(label[1]);c=code(re.sub(r'^Departamento\s+(?:tipo\s+)?','',title,flags=re.I))
  fields={plain(k):plain(v) for k,v in re.findall(r'<div class="row data">[\s\S]*?<span[^>]*>([\s\S]*?)</span>[\s\S]*?<strong[^>]*>([\s\S]*?)</strong>',block)}
  tabs=list(re.finditer(r'id="tab2-([^"]+)"',raw[:match.start()]));category=tabs[-1][1] if tabs else None
  row={'code':c,'officialTitle':title,'category':category,'imageUrl':html.unescape(image[1]),'printedHtmlFields':fields,'usefulM2':number(fields.get('Superficie útil')),'terraceM2':number(fields.get('Terraza')),'totalM2':number(fields.get('Superficie total')),'bedroomsField':number(fields.get('Dormitorios')),'bathroomsField':number(fields.get('Baños')),'cardHtmlSha256':sha(block.encode()),'cardSourceLocalPath':str(dest.relative_to(ROOT)),'cardByteOffset':match.start()}
  record['planCards'].append(row)
  (OUT/slug).mkdir(parents=True,exist_ok=True);(OUT/slug/(c+'-card.html')).write_text(block)
 links=sorted(set(html.unescape(u) for u in re.findall(r'href=["\']([^"\']+\.pdf(?:[?#][^"\']*)?)["\']',raw,re.I)))
 for i,url in enumerate(links):
  url=urllib.parse.urljoin(p['urlOficial'],url)
  if urllib.parse.urlsplit(url).hostname not in {'sento.cl','www.sento.cl'}:record['linkedPdfs'].append({'sourceUrl':url,'status':'external_official_link_not_downloaded'});continue
  proof=fetch(url,OUT/slug/f'linked-brochure-{i+1:02d}.pdf')
  if not proof.get('error'):
   try:
    reader=PdfReader(ROOT/proof['localPath']);proof['pages']=len(reader.pages);text='\n\n'.join('PAGE '+str(j+1)+'\n'+page.extract_text() for j,page in enumerate(reader.pages));(ROOT/proof['localPath']).with_suffix('.txt').write_text(text)
   except Exception as e:proof['parseError']=str(e)
  record['linkedPdfs'].append(proof)
 # Commercial text is retained for a separate no-publication comparison.
 text=plain(raw);price=re.search(r'UF\s*([\d.]+)\s*\*?\s*Precio desde',text,re.I)
 record['observedPriceFromUF']=int(price[1].replace('.','')) if price else None
 states=[s for s in ['Venta en verde','Venta en blanco','Entrega inmediata','Próxima entrega','Proyecto Entregado','100% vendido'] if s.casefold() in text.casefold()]
 record['observedStateTokens']=states
 print(json.dumps({'captured':slug,'cards':len(record['planCards']),'pdfs':len(record['linkedPdfs']),'state':states,'price':record['observedPriceFromUF']}),flush=True)
 return record

def main():
 OUT.mkdir(parents=True,exist_ok=True);previous=json.loads(RESEARCH.read_text());projects=[p for p in previous['proyectos'] if p['slugExistente']!='angamos'];records=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  futures=[pool.submit(inspect_project,p) for p in projects]
  for f in futures:records.append(f.result())
 jobs=[(r['slug'],card) for r in records for card in r['planCards']]
 def image_job(job):
  slug,card=job;ext=Path(urllib.parse.urlsplit(card['imageUrl']).path).suffix or '.jpg';proof=fetch(card['imageUrl'],OUT/slug/(card['code']+'-official'+ext))
  if not proof.get('error'):
   try:
    with Image.open(ROOT/proof['localPath']) as im:proof.update(width=im.width,height=im.height,format=im.format)
   except Exception as e:proof['parseError']=str(e)
  card['image']=proof
  return {'slug':slug,'code':card['code'],'status':proof.get('status'),'error':proof.get('error')}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for done in pool.map(image_job,jobs):print(json.dumps(done),flush=True)
 result={'schemaVersion':1,'verifiedOn':'2026-10-14','method':'Fresh anonymous HTTPS captures of each official project page, original linked plan image and offered PDF. No commercial updates and no inferred areas.','previousResearchSha256':sha(RESEARCH.read_bytes()),'projects':records,'counts':{'projectPages':len(records),'planCards':len(jobs),'linkedPDFs':sum(len(r.get('linkedPdfs',[])) for r in records)}}
 (OUT/'capture.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result['counts']),flush=True)
if __name__=='__main__':main()
