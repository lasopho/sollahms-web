#!/usr/bin/env python3
"""Reproducible, owner-supplied Maestra media integration; never changes commercial facts.

Inputs remain private. Run once against the recorded baseline with --inventory PATH.
No downloaded brochure, internal file or source manifest belongs in the public bundle.
"""
from project_image_labels import apply_image_label_policy
import argparse, collections, hashlib, html, io, json, re
from pathlib import Path
import fitz
from PIL import Image
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs/maestra-brochures-20261025'
ESC = html.escape

# Page numbers are one-based. Tower labels were read in the page, not the filename.
PROJECTS = {
 '01': ('alto-buzeta', [(3,'1 dormitorio · 1 baño'),(4,'2 dormitorios · 1 baño · 37 m² útiles aprox.'),(5,'2 dormitorios · 1 baño · 42 m² útiles aprox.'),(6,'3 dormitorios · 1 baño')]),
 '02': ('caceres', [(3,'2 dormitorios · 1 baño · 36 m² útiles aprox.'),(4,'2 dormitorios · 1 baño · 42 m² útiles aprox.')]),
 '03': ('campus-llacolen', [(6,'Estudio · 25,04 m² útiles aprox.'),(7,'1 dormitorio · 1 baño · 32,13 m² útiles aprox.')]),
 '04': ('distrito-centro', [(6,'1 dormitorio · 1 baño'),(7,'Tipo A · 2 dormitorios · 1 baño'),(8,'Tipo G · 2 dormitorios · 1 baño'),(9,'Mariposa · 2 dormitorios · 2 baños')]),
 '05': ('jardines-de-alvarado', [(p,f'Torre {"A" if p<13 else "B"} · Tipo {chr(65+(p-6)%7)}') for p in range(6,20)]+[(21,'Emplazamiento · Torres A y B'),(22,'Distribución de modelos · Torre A'),(23,'Distribución de modelos · Torre B')]),
 '07': ('mirador-mapocho', [(4,'1 dormitorio · 1 baño'),(5,'2 dormitorios · 1 baño · 36 m² útiles aprox.'),(6,'2 dormitorios · 1 baño · 42 m² útiles aprox.'),(7,'2 dormitorios · 2 baños')]),
 '09': ('pintor-cicarelli-i', [(4,'Etapa I · 2 dormitorios · 1 baño · 36 m² útiles aprox.'),(5,'Etapa I · 2 dormitorios · 1 baño · 42 m² útiles aprox.'),(6,'Etapa I · 2 dormitorios · 2 baños'),(7,'Etapa I · 3 dormitorios · 1 baño')]),
 '10': ('plaza-quilicura', [(p,f'Torres A, B, C, E, F y G · Tipo {chr(65+p-7)}') for p in range(7,11)]+[(p,f'Torres D y H · Tipo {chr(65+p-11)}') for p in range(11,14)]+[(15,'Emplazamiento del conjunto'),(16,'Emplazamiento · Torres C–D y G–H'),(17,'Distribución de modelos · Torres A, B, C, E, F y G'),(18,'Distribución de modelos · Torres D y H')]),
 '11': ('serrano-torre-a', [(4,'Emplazamiento general · Torres A y B'),(6,'Torre A · Subterráneo'),(7,'Torre A · Piso 1'),(8,'Torre A · Piso 2'),(9,'Torre A · Pisos 3 a 9'),(10,'Torre A · Piso 10'),(11,'Torre A · Piso 11'),(12,'Torre A · Piso 12 · Bicicleteros'),(13,'Torre A · 1 dormitorio · 1 baño'),(14,'Torre A · 2 dormitorios · 1 baño'),(15,'Torre A · 2 dormitorios grandes · 1 baño'),(16,'Torre A · 2 dormitorios · 2 baños'),(17,'Torre A · 3 dormitorios · 1 baño')]),
 '12': ('trinidad-iii', [(p,f'Torres A y B · Tipo {chr(65+p-6)}') for p in range(6,13)]+[(14,'Distribución de modelos · Torres A y B')]),
 '13': ('vista-costanera', [(p,f'Tipo {chr(65+p-7)}') for p in range(7,11)]+[(12,'Distribución de modelos del edificio')]),
 '14': ('vista-llacolen-b', [(3,'Etapa B · Estudio'),(4,'Etapa B · 1 dormitorio · 1 baño'),(5,'Etapa B · 2 dormitorios · 1 baño'),(6,'Etapa B · 2 dormitorios · 2 baños')]),
 '16': ('vista-reloncavi', [(3,'2 dormitorios · 1 baño · 36 m² útiles aprox.'),(4,'2 dormitorios · 1 baño · 42 m² útiles aprox.'),(5,'3 dormitorios · 1 baño')]),
 '17': ('vistamar', [(6,'2 dormitorios · 1 baño · 39 m² útiles aprox.'),(7,'2 dormitorios · 1 baño · 43 m² útiles aprox.'),(8,'2 dormitorios · 2 baños'),(9,'3 dormitorios · 1 baño')]),
}
# key, PDF page, original image xref, descriptive label, replaced gallery basename, use as cover
PHOTOS = [
 ('01',2,86,'Render referencial de las fachadas de Alto Buzeta',None,True),
 ('02',2,12,'Render referencial de Cáceres y su entorno en Rancagua',None,True),
 ('03',1,195,'Render referencial de Campus Llacolén al atardecer','fb2df78dac5621e1ed0035bf',False),
 ('04',1,9,'Render referencial de la fachada y el entorno de Distrito Centro','5ce3c9cc5a3ad99433eb6976',False),
 ('04',2,19,'Render referencial del patio y las fachadas interiores de Distrito Centro','30a323dfad8d6a9feb2b5a72',False),
 ('05',1,34,'Render referencial del conjunto Jardines de Alvarado, etapas A y B',None,True),
 ('07',3,24,'Render referencial del conjunto Mirador Mapocho, etapas A y B',None,True),
 ('09',2,3,'Render referencial nocturno de Pintor Cicarelli I',None,False),
 ('09',3,10,'Render referencial aéreo de Pintor Cicarelli I',None,True),
 ('10',1,16,'Render referencial aéreo del conjunto Plaza Quilicura',None,False),
 ('11',3,26,'Maqueta digital de Serrano: distribución general de las torres A y B',None,False),
 ('11',5,32,'Maqueta digital de Serrano Torre A',None,False),
 ('12',1,25,'Render referencial de las fachadas de Trinidad III',None,False),
 ('13',1,16,'Imagen exterior referencial de Vista Costanera en el brochure de Maestra','916ebff38fb672d900d3736e',True),
 ('14',2,33,'Render referencial del conjunto Vista Llacolén y su entorno en Concepción',None,False),
 ('16',2,25,'Render referencial del patio interior de Vista Reloncaví','e34f6eb30a29f5304b0972e8',False),
 ('17',2,43,'Render referencial de VistaMar y su entorno en Coquimbo',None,False),
 ('17',3,91,'Render referencial del living comedor de VistaMar',None,False),
 ('17',3,92,'Render referencial de la cocina de VistaMar',None,False),
 ('17',3,93,'Render referencial del baño de VistaMar',None,False),
 ('17',3,94,'Render referencial del dormitorio de VistaMar',None,False),
]

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def save_webp(im,path,width,quality):
 im=im.convert('RGB');im.thumbnail((width,width),Image.Resampling.LANCZOS)
 path.parent.mkdir(parents=True,exist_ok=True)
 encoded=io.BytesIO();im.save(encoded,'WEBP',quality=quality,method=6)
 temporary=path.with_suffix('.tmp');temporary.write_bytes(encoded.getvalue());temporary.replace(path)
 return {'path':'/'+str(path.relative_to(ROOT)),'width':im.width,'height':im.height,'bytes':path.stat().st_size,'sha256':digest(path)}
def figure(a,thumb=False):
 t=a.get('thumbnail',a); label=a['label'];kind='plano' if a['kind']=='plan' else 'imagen'
 return f'<figure class="brochure-resource"><a href="{a["path"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar {kind}: {ESC(label,quote=True)} (nueva pestaña)"><img src="{t["path"]}" alt="{ESC(a["alt"],quote=True)}" width="{t["width"]}" height="{t["height"]}" loading="lazy" decoding="async"></a><figcaption>{ESC(label)}<span>Brochure Maestra · página {a["page"]}</span><a href="{a["path"]}" target="_blank" rel="noopener noreferrer">Ampliar {kind}<span class="sr-only">: {ESC(label)} (nueva pestaña)</span></a></figcaption></figure>'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--inventory',required=True);args=ap.parse_args()
 inv=json.loads(Path(args.inventory).read_text());bykey={d['key']:d for d in inv}
 DOCS.mkdir(parents=True,exist_ok=True)
 data=json.loads((ROOT/'data/proyectos.json').read_text());catalog={p['slug']:p for p in data}
 manifest={'baselineCommit':'e6e326032e3f1948996ab4408bf68b5c0da0e8fd','rollbackDeployment':'dpl_CrKWwLe6pvGgR1VwYt9LQA9Usfjw','date':'2026-10-25','documents':[], 'assets':[],'projects':{},'sharedStagePolicy':'Owner confirms A/B/C are stages of the same project. General imagery may be shared with explicit conjunto captions; plans retain document-specific stage labels.'}
 for d in inv:
  manifest['documents'].append({k:d[k] for k in ['key','library_file_id','file_name','sha256','bytes','metadata']})
  manifest['documents'][-1]['pageCount']=len(d['pages'])
 for key,(slug,plans) in PROJECTS.items():
  d=bykey[key];doc=fitz.open(d['workspace_path']);name=catalog[slug]['nombre'];records=[]
  folder=ROOT/'assets/propiedades/maestra-brochures'/slug
  for pn,label in plans:
   p=doc[pn-1];scale=(3200 if key=='11' and pn<13 else 2600)/p.rect.width
   pix=p.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False,annots=False)
   im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
   a=save_webp(im,folder/f'plano-p{pn:02}.webp',3200,92)
   a.update({'kind':'plan','project':slug,'page':pn,'label':label,'alt':f'Plano referencial de {name}: {label}. Medidas y etiquetas del brochure Maestra.','documentKey':key,'sourceSHA256':d['sha256'],'sourceLibraryId':d['library_file_id'],'method':'full page rendered without annotations; all drawing labels preserved'})
   a['thumbnail']=save_webp(im,folder/f'plano-p{pn:02}-vista.webp',960,84)
   records.append(a);manifest['assets'].append(a)
  manifest['projects'][slug]={'name':name,'plans':records,'images':[],'documentKey':key}
 for key,pn,x,label,replaces,cover in PHOTOS:
  d=bykey[key];doc=fitz.open(d['workspace_path']);slug=PROJECTS[key][0];raw=doc.extract_image(x);im=Image.open(io.BytesIO(raw['image']))
  a=save_webp(im,ROOT/'assets/propiedades/maestra-brochures'/slug/f'imagen-p{pn:02}-x{x}.webp',1800,86)
  a.update({'kind':'image','project':slug,'page':pn,'label':label,'alt':label,'documentKey':key,'sourceSHA256':d['sha256'],'sourceLibraryId':d['library_file_id'],'xref':x,'sourceImageSHA256':hashlib.sha256(raw['image']).hexdigest(),'sourceWidth':im.width,'sourceHeight':im.height,'method':'original embedded image, no generated or retouched content','replaces':('/assets/propiedades/catalogo/'+replaces+'.webp') if replaces else None,'cover':cover})
  a['thumbnail']=save_webp(im,ROOT/'assets/propiedades/maestra-brochures'/slug/f'imagen-p{pn:02}-x{x}-vista.webp',960,80)
  manifest['assets'].append(a);manifest['projects'][slug]['images'].append(a)
 # Identical model pages can legitimately occur in different project brochures.
 # Keep the per-document references, but store one binary and thumbnail per exact hash.
 groups=collections.defaultdict(list)
 for a in manifest['assets']:groups[a['sha256']].append(a)
 for group in groups.values():
  if len(group)<2:continue
  for field in [None,'thumbnail']:
   first=group[0] if field is None else group[0][field]
   target=ROOT/'assets/propiedades/maestra-brochures/planos-compartidos'/(first['sha256'][:20]+('.webp' if field is None else '-vista.webp'))
   target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((ROOT/first['path'].lstrip('/')).read_bytes())
   for a in group:
    media=a if field is None else a[field];oldpath=ROOT/media['path'].lstrip('/');media['path']='/'+str(target.relative_to(ROOT));oldpath.unlink()
    if field is None:a['sharedContentWith']=[{'project':b['project'],'documentKey':b['documentKey'],'page':b['page']} for b in group if b is not a]
 # The new owner clarification permits this general view, explicitly labeled as shared.
 common=next(a for a in manifest['assets'] if a['kind']=='image' and a['project']=='vista-llacolen-b')
 shared={**common,'project':'vista-llacolen-a','sharedFrom':'vista-llacolen-b','label':common['label']+' · imagen general compartida entre etapas','alt':common['alt']+'; imagen general del conjunto, no un plano de la etapa A.'}
 manifest['projects']['vista-llacolen-a']={'name':catalog['vista-llacolen-a']['nombre'],'plans':[],'images':[shared],'documentKey':'14'}
 for slug,p in manifest['projects'].items():
  path=ROOT/(slug+'.html');text=path.read_text();soup=BeautifulSoup(text,'html.parser');gallery=soup.select_one('.gallery-grid,.featured-gallery');assert gallery is not None
  old=str(gallery);new=old
  for a in p['images']:
   if a.get('replaces'):
    matched=[f for f in gallery.select('figure') if f.select_one('img') and f.select_one('img').get('src')==a['replaces']];assert len(matched)==1,(slug,a['replaces'])
    new=new.replace(str(matched[0]),figure(a))
   else:new=new[:-6]+figure(a)+'</div>'
   if a.get('cover'):
    before=catalog[slug]['imagenPrincipal'];catalog[slug]['imagenPrincipal']=a['thumbnail']['path'];catalog[slug]['imagenAlt']=a['alt']
    hero=soup.select_one('.hero-image');assert hero is not None
    oldhero=str(hero);hero['src']=a['path'];hero['alt']=a['alt'];hero['width']=str(a['width']);hero['height']=str(a['height'])
    if a['width']>a['thumbnail']['width']:
     hero['srcset']=f"{a['thumbnail']['path']} {a['thumbnail']['width']}w, {a['path']} {a['width']}w";hero['sizes']='100vw'
    # Exact local substring replacement keeps all unrelated markup, SEO and maps intact.
    match=re.search(r'<img\b[^>]*class="hero-image"[^>]*>',text);assert match
    text=text[:match.start()]+str(hero)+text[match.end():]
  # BeautifulSoup normalizes attribute order, so locate only the gallery subtree in raw HTML.
  gstart=text.index('<div class="'+('featured-gallery' if slug=='distrito-centro' else 'gallery-grid')+'"');gend=text.index('</div>',gstart)+6
  text=text[:gstart]+new+text[gend:]
  if p['plans']:
   note='Planos referenciales del brochure de Maestra. Las medidas son aproximadas y las tipologías ilustradas no acreditan disponibilidad actual. Confirma el plano definitivo y las condiciones de la unidad al consultar.'
   if slug=='mirador-mapocho':note+=' El documento presenta el conjunto A y B sin asignar estos modelos a una etapa específica.'
   if slug in ['jardines-de-alvarado','plaza-quilicura','trinidad-iii']:note+=' Las letras de tipo identifican modelos de departamento; las torres se indican por separado.'
   section='<section id="planos" class="detail-section documented-plans" aria-labelledby="planos-titulo"><p class="eyebrow">Distribuciones del proyecto</p><h2 id="planos-titulo">Planos y tipologías</h2><p class="brochure-note">'+note+'</p><div class="brochure-plan-grid">'+''.join(figure(a,True) for a in p['plans'])+'</div></section>'
   marker='<!-- featured-details-end -->' if slug=='distrito-centro' else '<section id="equipamiento"'
   assert marker in text;text=text.replace(marker,marker+section if slug=='distrito-centro' else section+'\n        '+marker,1)
   text=text.replace('<a href="#galeria">Galería</a>','<a href="#galeria">Galería</a><a href="#planos">Planos</a>',1)
  theme=re.search(r'<link[^>]*href="/assets/css/sollahms-theme.css[^>]*>',text);assert theme
  text=text[:theme.start()]+'<link rel="stylesheet" href="/assets/css/brochure-media.css?v=20261025-maestra-1">\n'+text[theme.start():]
  path.write_text(apply_image_label_policy(text))
 # Only cover/alt fields change in the live catalogue. All other fields are retained.
 (ROOT/'data/proyectos.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 internal=json.loads((ROOT/'data/fichas-proyectos.json').read_text())
 for f in internal:
  if f['slug'] in manifest['projects']:
   p=manifest['projects'][f['slug']];f['ownerBrochureMedia']={'checkedOn':'2026-10-25','sourceManifest':'docs/maestra-brochures-20261025/manifest.json','plans':[a['path'] for a in p['plans']],'images':[a['path'] for a in p['images']],'commercialFieldsUnchanged':True}
 (ROOT/'data/fichas-proyectos.json').write_text(json.dumps(internal,ensure_ascii=False,indent=2)+'\n')
 config=json.loads((ROOT/'vercel.json').read_text());config['git']['deploymentEnabled']['codex/maestra-brochures-20261025']=False;(ROOT/'vercel.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
 (DOCS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({slug:{'plans':len(p['plans']),'newImages':sum(not bool(a.get('replaces')) for a in p['images']),'improvedImages':sum(bool(a.get('replaces')) for a in p['images'])} for slug,p in manifest['projects'].items()},indent=2))

if __name__=='__main__':main()
