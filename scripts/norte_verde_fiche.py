"""Render the seventeen Norte Verde fiches solely from reviewed brochure records."""
import html,json
from pathlib import Path
from string import Template
from functools import lru_cache
from urllib.parse import urlencode
from project_embed_policy import map_markup
ROOT=Path(__file__).resolve().parents[1]
@lru_cache(maxsize=1)
def template(): return Template((ROOT/'templates/project-detail.html').read_text())
def esc(v): return html.escape(str(v),quote=True)
def facts(rows):
 return '<ul class="amenity-list">'+''.join('<li data-brochure-pages="'+','.join(map(str,r['pages']))+'">'+esc(r['label'])+'</li>' for r in rows)+'</ul>'
def typology(m):
 b=m.get('bedrooms'); bath=m.get('bathrooms')
 return ('Estudio' if b==0 else str(b)+' dormitorio'+('s' if b!=1 else '') if b is not None else 'Tipología por confirmar')+(' · '+str(bath)+' baño'+('s' if bath!=1 else '') if bath is not None else '')
def render(r):
 slug,name=r['slug'],r['name']; loc=r['location']; hero=next(i for i in r['images'] if i['localPath']==r['cover'])
 location=', '.join(x for x in [loc.get('commune'),loc.get('region')] if x) or 'Ubicación por confirmar'
 overview='<p class="lead">'+esc(r['description'])+'</p>'
 for rows,title in [(r.get('architecture',[]),'Arquitectura'),(r.get('connectivity',[]),'Entorno y conectividad')]:
  if rows: overview+='<h3>'+title+'</h3>'+facts(rows)
 cells=[('Inmobiliaria','Norte Verde'),('Tipologías del brochure',', '.join(dict.fromkeys(typology(m) for m in r['models'])))]+[(label,loc[key]) for key,label in [('address','Dirección'),('commune','Comuna'),('region','Región')] if loc.get(key)]
 specs=''.join('<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>' for k,v in cells)
 gallery='<p>Renders e imágenes referenciales del proyecto incluidos en su brochure.</p><div class="gallery-grid">'+''.join('<figure data-brochure-page="'+str(i['sourcePage'])+'"><a href="'+i['localPath']+'" target="_blank" rel="noopener noreferrer" aria-label="Ampliar '+esc(i['caption'])+'"><img src="'+i['localPath']+'" alt="'+esc(i['caption'])+'" width="'+str(i['width'])+'" height="'+str(i['height'])+'" loading="lazy" decoding="async"></a><figcaption>'+esc(i['caption'])+'</figcaption></figure>' for i in r['images'])+'</div>'
 amenities=facts(r['amenities']) if r.get('amenities') else '<p>Consulta el equipamiento del proyecto.</p>'
 if r.get('finishes'): amenities+='<h3>Terminaciones</h3>'+facts(r['finishes'])
 plans='<section id="planos" class="detail-section"><p class="eyebrow">Diseño y distribución</p><h2>Tipologías, planos y superficies</h2><p>Modelos y superficies referenciales del brochure. Las superficies municipales y construidas se muestran por separado, tal como están publicadas. Confirma el plano, orientación y superficies de la unidad que consultes.</p><div class="nv-models">'
 for m in r['models']:
  a=m['plan']; plans+='<article class="nv-model" data-brochure-page="'+str(m['sourcePage'])+'"><h3>'+esc(m['label'])+'</h3><p>'+esc(typology(m))+'</p><a href="'+a['localPath']+'" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano '+esc(m['label'])+'"><img src="'+a['localPath']+'" alt="Plano '+esc(m['label'])+' de '+esc(name)+'" width="'+str(a['width'])+'" height="'+str(a['height'])+'" loading="lazy" decoding="async"></a><dl class="nv-areas">'+''.join('<div><dt>'+esc(v['label'])+'</dt><dd>'+('%0.2f'%v['valueM2']).replace('.',',')+' m²</dd></div>' for v in m['areas'])+'</dl></article>'
 plans+='</div></section><section id="brochure" class="detail-section"><h2>Brochure del proyecto</h2><a class="button button-outline" href="'+r['document']['localPath']+'" target="_blank" rel="noopener noreferrer">Ver brochure original (PDF)</a><p class="nv-source-note">Información e imágenes extraídas exclusivamente del brochure de '+esc(name)+'. Los modelos ilustrados no acreditan disponibilidad actual.</p>'
 if r.get('pending'): plans+='<details class="nv-pending"><summary>Información por confirmar</summary><ul>'+''.join('<li>'+esc(p)+'</li>' for p in r['pending'])+'</ul></details>'
 plans+='</section>'
 if loc.get('address') and loc.get('commune') and loc.get('mapVerified',True):
  query=', '.join(x for x in [loc['address'],loc['commune'],loc.get('region'),'Chile'] if x)
  mapped=True; maphtml='<p>'+esc(query)+'</p>'+map_markup('https://www.google.com/maps?'+urlencode({'q':query,'output':'embed'}),'Mapa de '+name)+'<p class="map-note">Dirección indicada en el brochure; el marcador lo determina Google Maps.</p>'
 else: mapped=False; maphtml='<p>La dirección exacta no está documentada en este brochure. Consulta la ubicación y el acceso del proyecto.</p>'
 structured={'@context':'https://schema.org','@type':'ApartmentComplex','name':name,'url':'https://sollahms.cl/'+slug+'.html','description':r['description'],'image':'https://sollahms.cl'+hero['localPath'],'citation':'https://sollahms.cl'+r['document']['localPath']}
 page=template().substitute(title=esc(name),description=esc(r['description']),slug=slug,builder='Norte Verde',location=esc(location),badges='<span>Residencial</span>',hero_class='nv-hero',hero_image='<img class="hero-image" src="'+hero['localPath']+'" alt="'+esc(hero['caption'])+'" width="'+str(hero['width'])+'" height="'+str(hero['height'])+'" fetchpriority="high" decoding="async">',social_image='<meta property="og:image" content="https://sollahms.cl'+hero['localPath']+'"><meta property="og:image:alt" content="'+esc(hero['caption'])+'"><meta name="twitter:card" content="summary_large_image">',structured_data=json.dumps(structured,ensure_ascii=False).replace('<','\\u003c'),embed_hosts=json.dumps(['www.google.com'] if mapped else []),overview=overview,official_context='',specs=specs,stages='',gallery=gallery,amenities=amenities,tour_navigation='<a href="#planos">Planos</a><a href="#brochure">Brochure</a>',tour_section='',location_heading=esc(loc.get('commune') or 'Ubicación del proyecto'),map=maphtml,sources='',price='Consultar precio',price_note='<p class="price-note">Consulta disponibilidad y condiciones comerciales vigentes.</p>',official_link='')
 page=page.replace('</head>','<link rel="stylesheet" href="/assets/css/norte-verde.css?v=20261013"></head>',1)
 page=page.replace('<section id="equipamiento"',plans+'<section id="equipamiento"',1)
 return '\n'.join(line.rstrip() for line in page.splitlines())+'\n',mapped
