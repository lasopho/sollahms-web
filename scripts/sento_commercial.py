"""Scoped Sento rendering from the authoritative central catalogue."""
import json,re,html,copy
from urllib.parse import quote_plus,quote
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def authorized(p):return p.get('inmobiliaria')=='Sento' and p.get('commercialSource',{}).get('priority')=='owner-authorized'
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
  f['delivery']={'label':p['entrega'],'precision':'semester' if 'semestre' in p['entrega'] else 'month' if year else 'unspecified','immediate':False,**({'year':int(year[0])} if year else {})}
  f['purchaseStage']={'mode':{'En verde':'verde','En blanco':'blanco'}.get(p['estado']),'eligible':p['estado'] in ['En verde','En blanco'],'referenceStage':None,'reason':'Estado comercial informado por Sollahms' if year else 'En recepción final no acredita entrega legalmente habilitada'}
 return data

def apply_sento(page,p):
 if not authorized(p):return page
 m=re.search(r'<main\b[^>]*>.*?</main>',page,re.S);s=BeautifulSoup(m[0],'html.parser');main=s.main
 for node in main.select('[data-sento-commercial]'):node.decompose()
 main.select_one('.ci-market strong').string=price(p['precioDesdeUF'])
 detail=main.select_one('.ci-details')
 if detail:
  for child in detail.find_all('p',recursive=False):
   if child.get_text(' ',strip=True) in ['Próxima entrega','Entrega inmediata','Venta en blanco','Venta en verde','Vendido','Entrega informada: Proyecto entregado'] or child.has_attr('data-sento-status'):child.decompose()
  detail.append(BeautifulSoup('<p data-sento-status>Estado: '+p['estado']+'</p><p data-sento-status>Entrega informada: '+p['entrega']+'</p>','html.parser'))
 dl=main.select_one('#caracteristicas > dl')
 if dl is None:
  dl=s.new_tag('dl',attrs={'class':'spec-grid'});main.find(id='caracteristicas').append(dl)
 found=set()
 for dt in dl.select('dt'):
  key=dt.get_text(' ',strip=True).replace(' informado','').replace(' informada','');dd=dt.find_next_sibling('dd')
  vals={'Precio desde':price(p['precioDesdeUF']),'Estado':p['estado'],'Entrega':p['entrega']}
  if key in vals:dd.string=vals[key];found.add(key)
 if 'Estado' not in found:dl.append(BeautifulSoup('<div><dt>Estado</dt><dd>'+p['estado']+'</dd></div>','html.parser'))
 if 'Entrega' not in found:dl.append(BeautifulSoup('<div><dt>Entrega</dt><dd>'+p['entrega']+'</dd></div>','html.parser'))
 rows=[]
 for o in p['commercialOffers']:
  rows.append('<div><dt>'+o['label']+'</dt><dd>'+price(o['priceUF'])+' · <a class="pj-text-link" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="'+o['id']+'">Solicitar cotización</a> · <a class="pj-text-link" href="/guia-hipotecaria.html?proyecto='+p['slug']+'&amp;oferta='+o['id']+'&amp;origen=ficha#simulador">Simular financiamiento</a></dd></div>')
 block='<section class="jn-subsection" data-sento-commercial data-scroll-static><h3>Precios por tipología</h3><dl class="spec-grid">'+''.join(rows)+'</dl><p class="price-note">Valores desde por tipología informados por Sollahms el 30/10/2026. Precio de la unidad, disponibilidad y condiciones por confirmar al cotizar. La recepción final debe confirmarse.</p></section>'
 if p['slug']=='plaza-las-condes':block=block.replace('</section>','<p class="price-note">Se conserva el precio de lista desde UF 11.073 autorizado anteriormente; el valor informado para la tipología 2 dormitorios es UF 11.119. Confirma la alternativa aplicable al cotizar.</p></section>')
 if not rows:block=block.replace('<dl class="spec-grid"></dl>','<p>Consultar precio. No se ha informado un valor comercial autorizado.</p>')
 main.find(id='proyecto').append(BeautifulSoup(block,'html.parser'))
 main['data-project-brochure']='sento-commercial-20261030'
 old=main.find(id='project-brochure-data')
 if old:old.decompose()
 main.append(BeautifulSoup('<script type="application/json" id="project-brochure-data" data-sento-commercial>'+json.dumps({'slug':p['slug'],'name':p['nombre'],'developer':p['inmobiliaria'],'offers':p['commercialOffers']},ensure_ascii=False).replace('<','\\u003c')+'</script>','html.parser'))
 if not main.find(id='pb-selection'):main.find(id='advisory-project-context').insert_after(BeautifulSoup('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>','html.parser'))
 result=page[:m.start()]+str(main)+page[m.end():]
 if '/assets/js/project-brochure.mjs' not in result:result=result.replace('</head>','<script type="module" src="/assets/js/project-brochure.mjs?v=20261030-sento"></script></head>')
 return result

def main():
 projects=read('data/proyectos.json');f=sync_facets(read('data/catalog-facets.json'),projects)
 (ROOT/'data/catalog-facets.json').write_text(json.dumps(f,ensure_ascii=False,separators=(',',':'))+'\n')
 path=ROOT/'proyectos.html';page=path.read_text()
 for p in projects:
  if not authorized(p):continue
  target=ROOT/(p['slug']+'.html');target.write_text(apply_sento(target.read_text(),p))
  page=re.sub(r'(<li><a href="/'+re.escape(p['slug'])+r'\.html">[^<]*</a> — <span>)[^<]*(</span></li>)',lambda m:m[1]+price(p['precioDesdeUF'])+m[2],page)
 path.write_text(page)
if __name__=='__main__':main()
