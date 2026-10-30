"""Render ECasa commercial data exclusively from existing central stage records.
No source prices live in this renderer. Other developers are a strict no-op.
"""
import copy,html,json,re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def esc(s):return html.escape(str(s),quote=True)
def price(n):return 'Desde UF '+format(n,',.0f').replace(',','.') if isinstance(n,(int,float)) and n>0 else 'Consultar precio'
def facets_for(project,baseline):
 taxonomy=read('data/amenities.json');labels={x['source']:x for x in taxonomy['labels']};labels.update({x['label']:x for x in taxonomy['labels']});defs={x['id']:x for x in taxonomy['filters']}
 feature_source=read('data/project-features.json')['projects'][project['slug']]
 brochure=next((x for x in read('data/brochures-ecasa.json')['projects'] if x['slug']==project['slug']),{})
 stages={}
 for s in project['etapasComerciales']:
  isref=s['slug']==project['etapaReferenciaSlug'];base=copy.deepcopy(baseline) if isref else {'variants':[],'features':[],'propertyTypes':[],'propertyLabels':[],'assetTypes':['Residencial'],'typologyLabels':[]}
  base.pop('stages',None)
  if not isref:
   for m in brochure.get('models',[]):
    if m.get('originCommercialSlug')!=s['slug']:continue
    beds=m.get('dormitorios');baths=m.get('banos');areas={k:m.get(v) for k,v in [('util','superficie_util_m2'),('total','superficie_total_m2'),('interior','superficie_interior_m2'),('terraza','terraza_m2')] if isinstance(m.get(v),(int,float))}
    base['variants'].append({'propertyType':'departamento','bedrooms':beds,'bathrooms':baths,'areas':areas,'typology':('estudio' if beds==0 else str(beds)+'d')+('-'+str(baths)+'b' if baths else '')})
   ids={}
   for group in feature_source['groups']:
    if group.get('stageSlug')!=s['slug']:continue
    for item in group['items']:
     if item.get('filterEligible'):
      for id_ in labels.get(item['label'],{}).get('filterIds',[]):ids[id_]={'id':id_,'label':defs[id_]['label'],'scope':'residential'}
   base['features']=list(ids.values())
  # Existing documented models retain their typed dimensions and bathrooms.
  for o in s.get('commercialOffers',[]):
   if not any(v.get('propertyType')==o['propertyType'] and v.get('bedrooms')==o['bedrooms'] for v in base['variants']):
    base['variants'].append({'propertyType':o['propertyType'],'bedrooms':o['bedrooms'],'areas':{},**({'typology':'estudio' if o['bedrooms']==0 else str(o['bedrooms'])+'d'} if o['bedrooms'] is not None else {})})
  base['propertyTypes']=list(dict.fromkeys(v['propertyType'] for v in base['variants'] if v.get('propertyType')))
  base['propertyLabels']=[{'departamento':'Departamento','casa':'Casa','local':'Local comercial'}.get(x,x) for x in base['propertyTypes']]
  if 'local' in base['propertyTypes']:base['assetTypes']=['Residencial','Comercial','Mixto'];base['features']=[{**x,'scope':'residential'} for x in base['features']]
  base['states']=[s['estado']];year=re.search(r'20\d{2}',s.get('entrega') or '')
  base['delivery']={'label':s['entrega'],'precision':'semester' if 'semestre' in s['entrega'] else 'year' if year else 'unspecified',**({'year':int(year[0])} if year else {})}
  # Reception final is not proof of legally enabled immediate delivery.
  if s['estado']=='En recepción final':base['delivery']['immediate']=False
  mode={'En verde':'verde','En blanco':'blanco'}.get(s['estado'])
  base['purchaseStage']={'mode':mode,'eligible':bool(mode),'referenceStage':s['slug'],'reason':'Estado comercial suministrado por Sollahms' if mode else 'Recepción final pendiente: no equivale a entrega inmediata'}
  stages[s['slug']]=base
 out=copy.deepcopy(stages[project['etapaReferenciaSlug']]);out['stages']=stages
 return out

def sync_facets(data,projects):
 for p in projects:
  if p['inmobiliaria']=='Ecasa' and p.get('commercialSource',{}).get('date')=='2026-10-30':data['projects'][p['slug']]=facets_for(p,data['projects'][p['slug']])
 return data

def apply_ecasa(page,p):
 if p.get('inmobiliaria')!='Ecasa' or p.get('commercialSource',{}).get('date')!='2026-10-30':return page
 match=re.search(r'<main\b[^>]*>.*?</main>',page,re.S);soup=BeautifulSoup(match[0],'html.parser');main=soup.main
 for old in main.select('[data-ecasa-commercial]'):old.decompose()
 market=main.select_one('.ci-market strong');market.string=price(p['precioDesdeUF'])
 # Main facts refer only to the established reference stage.
 for dt in main.select('#caracteristicas > dl dt'):
  key=dt.get_text(' ',strip=True);dd=dt.find_next_sibling('dd')
  if dd and key in ['Precio desde','Estado','Entrega','Tipologías disponibles']:
   dd.string={'Precio desde':price(p['precioDesdeUF']),'Estado':p['estado'],'Entrega':p['entrega'],'Tipologías disponibles':' · '.join(p['tipologias'])}[key]
 detail=main.select_one('.ci-details')
 if detail:
  detail.clear()
  detail.append(BeautifulSoup('<p>'+esc(' · '.join(p['tipologias']))+'</p><p>Estado: '+esc(p['estado'])+'</p><p>Entrega informada: '+esc(p['entrega'])+'</p>','html.parser'))
 blocks=[];offers=[]
 for st in p['etapasComerciales']:
  n=int(st.get('etapa') or st['detalleUrl'].split('#etapa-')[-1]);rows=[]
  for o in st.get('commercialOffers',[]):
   key=st['slug']+'--'+o['id'];offers.append({**o,'id':key,'stageSlug':st['slug'],'stageNumber':n,'stageName':st['nombre']})
   rows.append('<div><dt>'+esc(o['label'])+'</dt><dd>'+price(o['priceUF'])+' · <a class="pj-text-link" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-request-stage="'+str(n)+'" data-brochure-type="'+key+'">Solicitar cotización</a> · <a class="pj-text-link" href="/guia-hipotecaria.html?proyecto='+st['slug']+'&amp;oferta='+o['id']+'&amp;origen=ficha#simulador">Simular financiamiento</a></dd></div>')
  anchor='ecasa-precios-'+str(n)
  blocks.append('<div id="'+anchor+'" data-commercial-stage="'+st['slug']+'"><h3>'+esc(st['nombre'])+'</h3><p>Estado: '+esc(st['estado'])+' · Entrega informada: '+esc(st['entrega'])+'</p><dl class="spec-grid">'+''.join(rows)+'</dl>'+('' if rows else '<p>Consultar precio. Esta etapa no tiene un valor autorizado informado.</p>')+'</div>')
 block='<section class="jn-subsection" data-ecasa-commercial data-scroll-static><h3>Precios por tipología y etapa</h3>'+''.join(blocks)+'<p class="price-note">Valores desde por tipología informados por Sollahms el 30/10/2026. No corresponden a una unidad específica ni confirman disponibilidad. Estado y entrega son antecedentes comerciales; la recepción final debe confirmarse.</p>'+('<p class="price-note">Local comercial: producto independiente de los departamentos. No hereda sus superficies, baños ni equipamiento residencial.</p>' if p['slug']=='enlace-mackenna' else '')+'</section>'
 main.find(id='proyecto').append(BeautifulSoup(block,'html.parser'))
 # Update existing secondary stage facts, without replacing any galleries/maps/plans.
 for dt in main.select('[data-commercial-stage] dt'):
  owner=dt.find_parent(attrs={'data-commercial-stage':True});st=next((x for x in p['etapasComerciales'] if x['slug']==owner.get('data-commercial-stage')),None)
  if not st:continue
  dd=dt.find_next_sibling('dd');key=dt.get_text(' ',strip=True)
  if dd and key in ['Estado','Entrega','Precio desde']:dd.string={'Estado':st['estado'],'Entrega':st['entrega'],'Precio desde':price(st['precioDesdeUF'])}[key]
 main['data-project-brochure']='ecasa-commercial-20261030'
 existing=main.find(id='project-brochure-data')
 if existing:existing.decompose()
 main.append(BeautifulSoup('<script type="application/json" id="project-brochure-data" data-ecasa-commercial>'+json.dumps({'slug':p['slug'],'name':p['nombre'],'developer':'Ecasa','offers':offers},ensure_ascii=False).replace('<','\\u003c')+'</script>','html.parser'))
 if not main.find(id='pb-selection'):
  main.find(id='advisory-project-context').insert_after(BeautifulSoup('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>','html.parser'))
 result=page[:match.start()]+str(main)+page[match.end():]
 if '/assets/js/project-brochure.mjs' not in result:result=result.replace('</head>','<script type="module" src="/assets/js/project-brochure.mjs?v=20261030-ecasa"></script></head>')
 return result

def main():
 p=read('data/proyectos.json');facets=sync_facets(read('data/catalog-facets.json'),p)
 (ROOT/'data/catalog-facets.json').write_text(json.dumps(facets,ensure_ascii=False,separators=(',',':'))+'\n')
 for x in p:
  if x['inmobiliaria']=='Ecasa':
   path=ROOT/(x['slug']+'.html');path.write_text(apply_ecasa(path.read_text(),x))
 # Only scoped directory prices; no full rebuild or protected asset import.
 path=ROOT/'proyectos.html';page=path.read_text()
 for x in p:
  if x['inmobiliaria']=='Ecasa':page=re.sub(r'(<li><a href="/'+re.escape(x['slug'])+r'\.html">[^<]*</a> — <span>)[^<]*(</span></li>)',lambda m:m[1]+price(x['precioDesdeUF'])+m[2],page)
 path.write_text(page)
if __name__=='__main__':main()
