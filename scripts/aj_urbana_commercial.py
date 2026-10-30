"""Scoped AJ Urbana rendering from the authoritative central catalogue."""
import json,re,html,copy
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def authorized(p):return p.get('inmobiliaria')=='AJ Urbana' and p.get('commercialSource',{}).get('priority')=='owner-authorized'
def price(v):
 if not isinstance(v,(int,float)):return 'Consultar precio'
 return 'Desde UF '+format(v,',.1f' if v%1 else ',.0f').replace(',','X').replace('.',',').replace('X','.')
def sync_facets(data,projects):
 for p in projects:
  if not authorized(p):continue
  f=data['projects'][p['slug']];f['states']=[p['estado']]
  f['propertyTypes']=['departamento'];f['propertyLabels']=['Departamento']
  for v in f['variants']:
   if not v.get('propertyType'):v['propertyType']='departamento'
  year=re.search(r'20\d{2}',p['entrega'])
  f['delivery']={'label':p['entrega'],'precision':'semester' if year else 'unspecified','immediate':False,**({'year':int(year[0]),'semester':1} if year else {})}
  f['purchaseStage']={'mode':'verde' if year else None,'eligible':bool(year),'referenceStage':None,'reason':'Estado comercial informado por Sollahms' if year else 'En recepción final no acredita entrega legalmente habilitada'}
 return data

def apply_aj(page,p):
 if not authorized(p):return page
 # Only replace the owner-corrected street number, including existing map queries.
 for old,new in [('San Martín 74','San Martín 70'),('Amunátegui 745','Amunátegui 743')]:
  if new==p['direccion']:
   page=page.replace(old,new).replace(old.replace(' ','+'),new.replace(' ','+')).replace(old.replace(' ','%20'),new.replace(' ','%20'))
 m=re.search(r'<main\b[^>]*>.*?</main>',page,re.S);s=BeautifulSoup(m[0],'html.parser');main=s.main
 for node in main.select('[data-aj-commercial]'):node.decompose()
 main.select_one('.ci-market strong').string=price(p['precioDesdeUF'])
 detail=main.select_one('.ci-details');detail.clear();detail.append(BeautifulSoup('<p>Departamento · '+html.escape(' · '.join(p['tipologias']))+'</p><p>Estado: '+p['estado']+'</p><p>Entrega informada: '+p['entrega']+'</p>','html.parser'))
 dl=main.select_one('#caracteristicas > dl');found=set()
 for dt in dl.select('dt'):
  key=dt.get_text(' ',strip=True);dd=dt.find_next_sibling('dd')
  vals={'Precio desde':price(p['precioDesdeUF']),'Estado':p['estado'],'Entrega':p['entrega']}
  if key in vals:dd.string=vals[key];found.add(key)
 if 'Entrega' not in found:dl.append(BeautifulSoup('<div><dt>Entrega</dt><dd>'+p['entrega']+'</dd></div>','html.parser'))
 rows=[]
 for o in p['commercialOffers']:
  rows.append('<div><dt>'+o['label']+'</dt><dd>'+price(o['priceUF'])+' · <a class="pj-text-link" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="'+o['id']+'">Solicitar cotización</a> · <a class="pj-text-link" href="/guia-hipotecaria.html?proyecto='+p['slug']+'&amp;oferta='+o['id']+'&amp;origen=ficha#simulador">Simular financiamiento</a></dd></div>')
 block='<section class="jn-subsection" data-aj-commercial data-scroll-static><h3>Precios por tipología</h3><dl class="spec-grid">'+''.join(rows)+'</dl><p class="price-note">Valores desde por tipología informados por Sollahms el 30/10/2026. Precio de la unidad, disponibilidad y condiciones por confirmar al cotizar. La recepción final debe confirmarse.</p></section>'
 main.find(id='proyecto').append(BeautifulSoup(block,'html.parser'))
 main['data-project-brochure']='aj-urbana-commercial-20261030'
 old=main.find(id='project-brochure-data')
 if old:old.decompose()
 main.append(BeautifulSoup('<script type="application/json" id="project-brochure-data" data-aj-commercial>'+json.dumps({'slug':p['slug'],'name':p['nombre'],'developer':p['inmobiliaria'],'offers':p['commercialOffers']},ensure_ascii=False).replace('<','\\u003c')+'</script>','html.parser'))
 if not main.find(id='pb-selection'):main.find(id='advisory-project-context').insert_after(BeautifulSoup('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>','html.parser'))
 result=page[:m.start()]+str(main)+page[m.end():]
 if '/assets/js/project-brochure.mjs' not in result:result=result.replace('</head>','<script type="module" src="/assets/js/project-brochure.mjs?v=20261030-aj"></script></head>')
 return result

def main():
 projects=read('data/proyectos.json');f=sync_facets(read('data/catalog-facets.json'),projects)
 (ROOT/'data/catalog-facets.json').write_text(json.dumps(f,ensure_ascii=False,separators=(',',':'))+'\n')
 path=ROOT/'proyectos.html';page=path.read_text()
 for p in projects:
  if not authorized(p):continue
  target=ROOT/(p['slug']+'.html');target.write_text(apply_aj(target.read_text(),p))
  page=re.sub(r'(<li><a href="/'+re.escape(p['slug'])+r'\.html">[^<]*</a> — <span>)[^<]*(</span></li>)',lambda m:m[1]+price(p['precioDesdeUF'])+m[2],page)
 path.write_text(page)
if __name__=='__main__':main()
