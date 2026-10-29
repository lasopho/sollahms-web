"""Owner-authorized Euro enrichment. Central data; existing fiche composition retained."""
import copy, html, json, re, subprocess, sys
from pathlib import Path
from bs4 import BeautifulSoup
import project_amenities
from project_navigation import price_from
ROOT=Path(__file__).resolve().parents[1]
VERSION='20261029-euro-1'
def validate_prices(projects):
 configs=read('data/euro-commercial.json')['projects']
 for p in projects:
  if p['slug'] not in configs:continue
  c=configs[p['slug']]
  assert p.get('precioDesdeUF')==c['projectFromUF'],'Euro owner price mismatch: '+p['slug']
  offers={o['id']:o.get('priceUF') for o in p.get('commercialOffers',[])}
  for key,value in c['prices'].items():
   assert offers.get('local' if key=='local' else key+'d')==value,'Euro owner typology price mismatch: '+p['slug']
def read(p):return json.loads((ROOT/p).read_text())
def write(p,d):(ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def esc(s):return html.escape(str(s),quote=True)
def frag(s):return BeautifulSoup(s,'html.parser')
def typ(n):return 'Estudio' if n==0 else str(n)+' dormitorio'+('s' if n!=1 else '')
def set_fact(scope,key,value):
 for dt in scope.find_all('dt'):
  if dt.get_text(' ',strip=True)==key:
   dd=dt.find_next_sibling('dd')
   if dd:dd.string=str(value)
def offers_for(c,brochure,old):
 keys=set(c['prices'])
 keys.update(str(m['bedrooms']) for m in brochure.get('variants',[]) if m['bedrooms'] is not None)
 for t in old.get('tipologias',[]):
  m=re.fullmatch(r'(\d+) dormitorios?',t)
  if m:keys.add(m[1])
 if not keys:keys={'1','2'} if c['name']=='Diagonal Vicuña' else set()
 return [{'id':'local' if k=='local' else k+'d','bedrooms':None if k=='local' else int(k),'label':'Local comercial' if k=='local' else typ(int(k)),'propertyType':'local' if k=='local' else 'departamento','priceUF':c['prices'].get(k),'priceDecimals':2 if '.' in c.get('priceStrings',{}).get(k,'') else 0} for k in sorted(keys,key=lambda k:99 if k=='local' else int(k))]
def register_taxonomy():
 d=read('data/amenities.json');existing={x['source']:x for x in d['labels']}
 # Semantically distinct material filters; no blanket inference from developer identity.
 filters=[('piso-spc','Piso vinílico SPC','floor'),('piso-porcelanato','Piso de porcelanato','floor'),('cortinas-roller','Cortinas roller','curtains'),('iluminacion-led','Iluminación LED','light'),('conexion-lavadora','Conexión para lavadora','wash'),('cubierta-granito','Cubierta de granito','kitchen')]
 for id_,label,icon in filters:
  if not any(x['id']==id_ for x in d['filters']):d['filters'].append({'id':id_,'label':label,'icon':icon,'group':'features'})
 mappings={
 'Ventanas PVC termopanel':('Ventanas PVC termopanel','window',['termopanel']),
 'Ventanas de PVC blanco con termopanel':('Ventanas PVC termopanel','window',['termopanel']),
 'Ventanas en marco de PVC con vidrio termopanel':('Ventanas PVC termopanel','window',['termopanel']),
 'Cocina equipada con encimera vitrocerámica, horno eléctrico y campana':('Cocina equipada','kitchen',['cocina-equipada']),
 'Cubierta de granito':('Cubierta de granito','kitchen',['cubierta-granito']),
 'Piso vinílico SPC':('Piso vinílico SPC','floor',['piso-spc']),
 'Piso porcelanato':('Piso de porcelanato','floor',['piso-porcelanato']),
 'Piso gres porcelanato':('Piso de porcelanato','floor',['piso-porcelanato']),
 'Piso gres porcelanato en todo el departamento':('Piso de porcelanato','floor',['piso-porcelanato']),
 'Conexión para lavadora':('Conexión para lavadora','wash',['conexion-lavadora']),
 'Espacio para instalación de lavadora':('Espacio para lavadora','wash',[]),
 'Cortinas roller':('Cortinas roller','curtains',['cortinas-roller']),
 'Iluminación LED':('Iluminación LED','light',['iluminacion-led']),
 'Alarma de seguridad en la puerta de acceso':('Alarma en acceso a la vivienda','security',['seguridad']),
 'Alarma en todos los departamentos':('Alarma en la vivienda','security',['seguridad']),
 'Vigilancia por circuito cerrado':('Cámaras de vigilancia','camera',['seguridad']),
 'Accesos controlados con torniquetes y sistema biométrico en espacios comunes':('Control de acceso biométrico','digital',['seguridad','tecnologia']),
 'Ascensores Mitsubishi':('Ascensores Mitsubishi','elevator',[]),
 'Caldera para generación de agua caliente':('Caldera de agua caliente','water',[]),
 'Sala de niños':('Salón infantil','play',[]),
 'Salones multiuso':('Salón multiuso','social',['salon-multiuso']),
 'Gimnasio equipado':('Gimnasio','fitness',['gimnasio']),
 'Gimnasio Youtrain':('Gimnasio','fitness',['gimnasio']),
 'Quinchos panorámicos abiertos':('Quinchos panorámicos','bbq',['quinchos']),
 '2 quinchos':('Quinchos','bbq',['quinchos']),
 'Quincho cerrado con terraza':('Quincho cerrado con terraza','bbq',['quinchos','terraza-comun']),
 'Plaza interior':('Plaza interior','garden',['areas-verdes']),
 'Terrazas comunes':('Terrazas comunes','terrace',['terraza-comun']),
 'Juegos infantiles exteriores':('Juegos infantiles al aire libre','play',['juegos-infantiles']),
 'Lockers':('Lockers','storage',[]),'Camarines':('Camarines','shower',[]),
 'Horno eléctrico':('Horno eléctrico','kitchen',[]),'Campana':('Campana','kitchen',[]),'Encimera vitrocerámica':('Encimera vitrocerámica','kitchen',[])}
 for source,(label,icon,ids) in mappings.items():
  if source in existing:
   # Preserve approved spelling/icon; add only semantically exact filter mappings.
   existing[source]['filterIds']=list(dict.fromkeys(existing[source].get('filterIds',[])+ids))
  else:d['labels'].append({'source':source,'label':label,'icon':icon,'filterIds':ids})
 write('data/amenities.json',d)
 project_amenities.CATALOG=d;project_amenities.LABELS={}
 for x in d['labels']:project_amenities.LABELS[project_amenities.key(x['source'])]=x
 for x in d['labels']:project_amenities.LABELS.setdefault(project_amenities.key(x['label']),x)

def update_data():
 register_taxonomy()
 configs=read('data/euro-commercial.json')['projects'];brochures=read('data/euro-brochures.json')['projects'];official=read('data/euro-official-review.json');projects=read('data/proyectos.json');fiches=read('data/fichas-proyectos.json');features=read('data/project-features.json')
 locations=read('data/project-locations.json')
 for p in projects:
  slug=p['slug']
  if slug not in configs:continue
  c=configs[slug];b=brochures.get(slug,{});f=next(f for f in fiches if f['slug']==slug);offers=offers_for(c,b,p)
  p.update(precioDesdeUF=c['projectFromUF'],precioDecimales=c['priceDecimals'],commercialOffers=offers,preciosPorTipologia=[{'tipologia':'Local' if o['id']=='local' else o['label'],'precioDesdeUF':o['priceUF']} for o in offers],tipologias=['Local' if o['id']=='local' else o['label'] for o in offers],estado=c['state'],estadoInformado=c['state'],entrega=c['delivery'],tipoActivo='Mixto' if slug=='independencia-4745' else 'Residencial',commercialSource={'type':'owner-supplied','file':'data/euro-commercial.json','date':'2026-10-29','priceStatus':'pending' if c['projectFromUF'] is None else 'confirmed'})
  if c.get('stageConflict'):p['stageConflict']=c['stageConflict']
  if slug=='independencia-4745':p.update(tiposActivos=['Residencial','Comercial','Mixto'],catalogPricePolicy='by-product',precioDesdeTipologia='2 dormitorios')
  if slug.startswith('froilan-roa-5731'):
   p['direccion']='Froilán Roa 5731';p['mapQuery']='Froilán Roa 5731, La Florida, Región Metropolitana, Chile'
   # Same previously verified complex point; never infer or move a tower entrance.
   loc=locations['locations'][slug];assert loc['siteAddress']==p['direccion'];loc['address']=p['direccion'];loc['publicNote']='Punto de referencia del conjunto; acceso específico de la torre por confirmar.'
  description=b.get('description')
  if not description:
   description=f"{p['nombre']} es un proyecto de departamentos de Euro en {p['comuna']}. "+('La información de esta ficha corresponde a la torre indicada.' if slug.startswith('froilan') else 'Las características propias de Edificio A se confirman al cotizar.' if slug.endswith('edificio-a') else 'Combina departamentos de uno y dos dormitorios con espacios comunes de recreación y trabajo.')
  p['descripcionLarga']=description+' Entrega informada: '+c['delivery']+'. Estado comercial informado: '+c['state']+'.'
  groups=features['projects'][slug]['groups'];amenities=next((g for g in groups if g['kind']=='amenities'),None)
  extra_amenities=b.get('amenities',[]);extra_finishes=b.get('finishes',[])+b.get('technology',[])
  if slug=='diagonal-vicuna':extra_amenities=[{'label':s,'sourceUrl':'https://www.euroinmobiliaria.cl/proyectos/diagonal-vicuna'} for s in official['diagonalVicuna']['amenities']];extra_finishes=[{'label':s,'sourceUrl':'https://www.euroinmobiliaria.cl/proyectos/diagonal-vicuna'} for s in official['diagonalVicuna']['features']]
  def item(raw):
   label=raw['label'];mapping=project_amenities.entry(label);detail=''
   if label.startswith('Cocina equipada con'):detail='Encimera vitrocerámica, horno eléctrico y campana.'
   if label=='2 quinchos':detail='Dos quinchos documentados.'
   if label=='Piso gres porcelanato en todo el departamento':detail='En todo el departamento, según folleto.'
   if label=='Gimnasio Youtrain':detail='Equipamiento Youtrain documentado en el folleto.'
   return {'label':label,'description':detail,'filterEligible':bool(mapping.get('filterIds')),'scope':'residential','exclusionReasons':[] if mapping.get('filterIds') else ['Sin categoría de filtro equivalente; se conserva en ficha.'],'source':{'file':'data/euro-brochures.json' if b else 'data/euro-official-review.json','pointer':'/projects/'+slug if b else '/diagonalVicuna','pages':[raw['sourcePage']] if raw.get('sourcePage') else [],**({'url':raw['sourceUrl']} if raw.get('sourceUrl') else {})}}
  if extra_amenities:
   if amenities is None:amenities={'sectionId':'equipamiento','ordinal':0,'kind':'amenities','stageSlug':None,'items':[]};groups.append(amenities)
   for raw in extra_amenities:
    new=item(raw);canonical=project_amenities.entry(new['label'])['label'];old=next((i for i in amenities['items'] if project_amenities.entry(i['label'])['label']==canonical),None)
    if old:
     if not old.get('description'):old['description']=new['description']
     old['scope']='residential';old['filterEligible']=bool(project_amenities.entry(old['label']).get('filterIds'));old['additionalEvidence']=new['source']
    else:amenities['items'].append(new)
  if extra_finishes:
   groups[:]=[g for g in groups if g['sectionId']!='euro-terminaciones'];groups.append({'sectionId':'euro-terminaciones','ordinal':0,'kind':'finishes','stageSlug':None,'items':[item(raw) for raw in extra_finishes]})
  if slug=='independencia-4745':
   for g in groups:
    for x in g['items']:x['scope']='residential'
   for x in features['projects'][slug].get('prose',[]):x['eligibleForFiltering']=False
  p['amenities']=list(dict.fromkeys(i['label'] for g in groups if g['kind']=='amenities' for i in g['items']))
  verified=['nombre','inmobiliaria','comuna','region','tipologias','estado','entrega','tipoActivo','descripcionLarga']+(['direccion','mapQuery'] if slug.startswith('froilan') else [])+(['precioDesdeUF'] if c['projectFromUF'] is not None else [])+(['amenities'] if p['amenities'] else [])
  p['verificacion']['camposVerificados']=sorted(set(p['verificacion'].get('camposVerificados',[])+verified)-({'precioDesdeUF'} if c['projectFromUF'] is None else set()))
  p['verificacion'].update(fecha='2026-10-29',fuentePrecios='data/euro-commercial.json',fuenteBrochures='data/euro-brochures.json',disponibilidad='Por confirmar por modelo; no hay inventario de unidades.')
  f.setdefault('historicalSourceNotes',f.get('sourceNotes'));f.setdefault('preEuroReview',{'checkedAt':f['checkedAt'],'updates':copy.deepcopy(f['updates'])})
  f['checkedAt']='2026-10-29';f['sourceNotes']='Departamentos documentados para este registro. Precios, entrega y estado comercial según fuente Sollahms del 29/10/2026. Los antecedentes de brochure no confirman stock. Ver fuentes Euro centralizadas para métricas y discrepancias.'
  f['verifiedFields']=sorted(set(f['verifiedFields']+verified)-({'precioDesdeUF'} if c['projectFromUF'] is None else set()))
  for key in verified+['precioDesdeUF','precioDecimales','preciosPorTipologia','commercialOffers','commercialSource','estadoInformado']:
   f['updates'][key]=copy.deepcopy(p[key])
  f['pendingFields']=list(dict.fromkeys(['Disponibilidad, inclusiones y condiciones de la unidad al cotizar']+c['confirmationNotes']+b.get('unknowns',[])+(['Precio desde pendiente de confirmación comercial Sollahms'] if c['projectFromUF'] is None else [])))
  f['euroBrochureSource']='data/euro-brochures.json';f['euroOfficialReview']='data/euro-official-review.json'
 write('data/proyectos.json',projects);write('data/fichas-proyectos.json',fiches);write('data/project-features.json',features);write('data/project-locations.json',locations);project_amenities.FEATURE_REGISTRY=features['projects']
 return projects

def plans_html(p,b,media):
 cards=[];beds=sorted({m['bedrooms'] for m in b['variants'] if m['bedrooms'] is not None})
 for page in media.get('planPages',[]):
  models=[m for m in b['variants'] if m['sourcePage']==page['sourcePage']];thumb=page['thumbnail'];body=''
  for m in models:
   body+=f'<div class="pb-model" data-model-id="{esc(m["id"])}"><h4>{esc(m["sourceLabel"])}</h4>'
   if m['bathrooms'] is None:body+='<p class="pb-note">El rótulo indica un baño y el dibujo muestra dos. Cantidad de baños por confirmar; no se usa en el filtro de baños.</p>'
   if m['areas']:
    body+='<dl>'+''.join(f'<dt>{esc(a["label"])}</dt><dd>{str(a["value"]).replace(".",",")} m²</dd>' for a in m['areas'])+'</dl>'
   else:body+='<p class="pb-note">Superficies no publicadas en este plano.</p>'
   body+=f'<a class="pj-text-link" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="{m["bedrooms"]}d">Cotizar esta tipología</a></div>'
  card=f'<article class="pb-plan" data-plan-bedrooms="{" ".join(map(str,sorted({m["bedrooms"] for m in models})))}"><h3>Lámina {page["sourcePage"]} · {esc(" / ".join(typ(n) for n in sorted({m["bedrooms"] for m in models})))}</h3><a data-plan-full href="{page["url"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano de {esc(p["nombre"])} · lámina {page["sourcePage"]}"><img src="{thumb["url"]}" alt="{esc(page["alt"])}" width="{thumb["width"]}" height="{thumb["height"]}" loading="lazy" decoding="async"></a><a class="pj-text-link" href="{page["url"]}" target="_blank" rel="noopener noreferrer">Ampliar lámina completa ↗</a>{body}<label class="pb-compare-choice"><input type="checkbox" data-compare-plan="{page["sourcePage"]}">Comparar lámina {page["sourcePage"]}</label></article>'
  cards.append(card)
 if not cards:return ''
 notes='Las láminas documentan distribuciones y no representan disponibilidad. Las superficies útiles, interiores y de terraza se mantienen separadas; no se calculan a partir del dibujo.'
 if p['slug']=='mapocho-3521':notes+=' Este folleto corresponde al conjunto sin identificar edificio. Sus superficies totales son promedios aproximados; no se usan como medidas exactas en los filtros.'
 if p['slug']=='rosas-1444':notes+=' El folleto original contiene planos de baja resolución; se conserva la lámina completa. Las superficies totales son aproximadas.'
 controls='<div class="pb-tools" data-scroll-static><label>Mostrar modelos<select data-plan-filter><option value="">Todos los dormitorios</option>'+''.join(f'<option value="{n}">{typ(n)}</option>' for n in beds)+'</select></label><button type="button" data-plan-compare disabled>Comparar dos láminas</button><p role="status" data-plan-compare-status>0 de 2 láminas seleccionadas.</p></div>'
 return '<section id="planos" class="detail-section pj-block" data-euro-plans><p class="eyebrow">Explora las distribuciones</p><h2>Planos</h2><p>'+esc(notes)+'</p>'+controls+'<div class="pb-plans">'+''.join(cards)+'</div><dialog class="pb-compare-dialog" data-plan-dialog aria-labelledby="pb-compare-title" data-scroll-static><button type="button" data-plan-close>Cerrar comparación</button><h2 id="pb-compare-title">Comparar distribuciones</h2><p>Amplía cada lámina desde la ficha para revisar sus detalles originales.</p><div class="pb-comparison" data-plan-comparison></div></dialog></section>'

def apply_euro(page,p):
 configs=read('data/euro-commercial.json')['projects'];slug=p['slug']
 if slug not in configs:return page
 c=configs[slug];b=read('data/euro-brochures.json')['projects'].get(slug,{});media=read('data/euro-media.json')['projects'].get(slug,{})
 soup=frag(page);main=soup.main;main['data-project-brochure']=VERSION
 desc=main.select_one('.jn-summary-description')
 if desc:desc.string=p['descripcionLarga']
 else:
  main.select_one('.ci-action').insert_after(frag('<p class="jn-summary-description">'+esc(p['descripcionLarga'])+'</p>'))
 details=main.select_one('.ci-details');details.clear();details.append(frag('<p>'+esc('Departamentos · '+', '.join(o['label'] for o in p['commercialOffers'] if o['id']!='local'))+'</p><p>Estado comercial informado: '+esc(c['state'])+'</p><p>Entrega informada: '+esc(c['delivery'])+'</p>'))
 if c.get('stageConflict'):details.append(frag('<p class="pb-note">Etapa constructiva por confirmar: existe una discrepancia con el avance de obras publicado.</p>'))
 note=main.select_one('.ci-market .price-note')
 if note:note.string='Precio desde residencial. Disponibilidad e inclusiones por confirmar.' if slug=='independencia-4745' else 'Precio por tipología, sin asignación a una unidad. Confirma disponibilidad al cotizar.' if p['precioDesdeUF'] else 'Precio pendiente de confirmación comercial.'
 overview=main.find(id='proyecto')
 for pending in overview.select('.pending-panel,.missing-note'):
  pending.decompose()
 for pending in main.select('.pending-panel,.missing-note'):
  text=pending.get_text(' ',strip=True)
  if 'La oferta, el acceso y la entrega específicos' in text:
   pending.clear();pending.append('Material del conjunto. La identificación de los espacios, planos y acceso específicos de esta torre o edificio debe confirmarse. Los precios y la entrega informados por Sollahms se muestran en el resumen.')
 for old in main.select('[data-euro-content],[data-euro-gallery],[data-euro-models]'):old.decompose()
 for old in main.select('[data-euro-plans]'):old.decompose()
 cards=[]
 for o in p['commercialOffers']:
  key=o['id'];planlink='<a class="pj-text-link" href="#planos">Explorar planos</a>' if media.get('planPages') and key!='local' else ''
  simulation=f'<a class="pj-text-link" href="/guia-hipotecaria.html?proyecto={slug}&amp;oferta={key}&amp;origen=ficha#simulador">Simular financiamiento</a>' if o['priceUF'] is not None else ''
  cards.append(f'<article class="pb-offer"><h3>{esc(o["label"])}</h3><strong class="pb-price">{price_from(o["priceUF"],o["priceDecimals"])}</strong>{planlink}{simulation}<a class="button button-green" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="{key}">Solicitar cotización</a></article>')
 overview.append(frag('<div data-euro-content><h3>Tipologías y precios desde</h3><div class="pb-offers" data-scroll-static>'+''.join(cards)+'</div><p class="pb-note">Precios proporcionados por Sollahms. Los modelos documentados sin valor se muestran para consulta; no se confirma stock ni un precio para una unidad específica.</p>'+('<p class="pb-note">El local comercial es un producto independiente. Los planos, superficies y amenities residenciales no describen ni se incluyen automáticamente en el local.</p>' if slug=='independencia-4745' else '')+'</div>'))
 features=main.find(id='caracteristicas')
 top=features.find('dl',recursive=False)
 if top:
  for dt in top.find_all('dt'):
   if dt.get_text(' ',strip=True)=='Tipologías disponibles':dt.string='Tipologías documentadas'
  existing={dt.get_text(' ',strip=True) for dt in top.find_all('dt')}
  for key,value in [('Estado',c['state']),('Entrega',c['delivery']),('Tipologías documentadas',' · '.join(p['tipologias']))]:
   if key not in existing:top.append(frag('<div><dt>'+key+'</dt><dd>'+esc(value)+'</dd></div>'))
 bedrooms=sorted({o['bedrooms'] for o in p['commercialOffers'] if o['bedrooms'] is not None})
 for key,val in [('Estado',c['state']),('Entrega',c['delivery']),('Tipologías documentadas',' · '.join(p['tipologias'])),('Tipologías',' · '.join(p['tipologias'])),('Dormitorios',' · '.join(map(str,bedrooms))),('Precio desde',price_from(p['precioDesdeUF'],p['precioDecimales']))]:set_fact(main,key,val)
 if top and b.get('variants') and any(not m['areas'] for m in b['variants']) and any('Superficie' in dt.get_text() for dt in top.find_all('dt')):
  top.insert_after(frag('<p class="pb-note" data-euro-content>Las superficies del resumen corresponden a antecedentes publicados del proyecto; no asignan superficie a cada modelo. Revisa los datos de cada plano.</p>'))
 for group in project_amenities.project_feature_groups(slug):
  if not main.find(id=group['sectionId']):features.append(frag(f'<section id="{group["sectionId"]}" class="jn-subsection am-section"><h3>{"Terminaciones y tecnología" if group["kind"]=="finishes" else "Equipamiento y áreas comunes"}</h3></section>'))
 if b.get('buildingFacts'):
  features.append(frag('<div data-euro-content><h3>Características del edificio</h3><dl class="fact-grid">'+''.join(f'<div><dt>{esc(x["label"])}</dt><dd>{esc(x["value"])}</dd></div>' for x in b['buildingFacts'])+'</dl><p class="pb-note">Cantidades del diseño documentado; no constituyen inventario ni implican estacionamiento o bodega incluidos.</p></div>'))
 if c['confirmationNotes']:features.append(frag('<div data-euro-content>'+''.join('<p class="pb-note">'+esc(n)+'</p>' for n in c['confirmationNotes'])+'</div>'))
 plans=plans_html(p,b,media) if b.get('variants') else ''
 if plans:
  old=main.find(id='planos')
  if old:old.decompose()
  features.insert_after(frag(plans))
 if slug=='diagonal-vicuna':
  models=read('data/euro-official-review.json')['diagonalVicuna']['variants']
  features.append(frag('<details class="pj-disclosure" data-euro-models><summary data-scroll-static>Modelos documentados y superficies</summary><div class="pb-offers">'+''.join('<article class="pb-offer"><h4>'+esc(m['label'])+'</h4><p>Superficie útil: '+str(m['areas']['util'])+' m² · total: '+str(m['areas']['total'])+' m².</p></article>' for m in models)+'</div><p class="pb-note">Modelos del proyecto, sin asignación a una torre o unidad disponible. Planos gráficos y valor comercial pendientes de confirmación.</p></details>'))
 gallery=main.find(id='galeria');new=media.get('gallery',[])
 if new:
  figures=''.join(f'<figure><a href="{a["url"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar {esc(a["alt"])}"><span class="s-parallax-frame"><img src="{a.get("thumbnail",{}).get("url",a["url"])}" alt="{esc(a["alt"])}" width="{a["width"]}" height="{a["height"]}" loading="lazy" decoding="async"></span></a><figcaption>{esc(a["caption"])}</figcaption></figure>' for a in new)
  gallery.append(frag(f'<details class="pj-disclosure" data-euro-gallery><summary data-scroll-static>Explorar {len(new)} imágenes del folleto</summary><div class="gallery-grid">{figures}</div></details>'))
  for notice in media.get('legalNotices',[]):gallery.append(frag('<p class="pb-note" data-euro-content>'+esc(notice['text'] if isinstance(notice,dict) else notice)+'</p>'))
 location=main.find(id='ubicacion')
 if slug.startswith('froilan-roa-5731'):
  pending=location.select_one('.pending-panel')
  if pending:pending.clear();pending.append('Dirección del conjunto: Froilán Roa 5731, La Florida. Confirma el acceso específico de esta torre al cotizar.')
 if b.get('connectivity'):location.append(frag('<div data-euro-content><h3>Entorno y conectividad</h3><p>'+esc('. '.join(x['label'].rstrip('.') for x in b['connectivity']))+'.</p></div>'))
 if not main.find(id='pb-selection'):main.find(id='advisory-project-context').insert_after(frag('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>'))
 old=main.find(id='project-brochure-data')
 if old:old.decompose()
 record={'slug':slug,'name':p['nombre'],'developer':'Euro','offers':p['commercialOffers']};main.append(frag('<script type="application/json" id="project-brochure-data">'+json.dumps(record,ensure_ascii=False).replace('<','\\u003c')+'</script>'))
 page=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:str(main),page,count=1,flags=re.S)
 for asset in ['project-brochure.css']:
  if '/assets/css/'+asset not in page:page=page.replace('<link rel="stylesheet" href="/assets/css/sollahms-theme.css',f'<link rel="stylesheet" href="/assets/css/{asset}?v={VERSION}">\n<link rel="stylesheet" href="/assets/css/sollahms-theme.css',1)
 if '/assets/js/project-brochure.mjs' not in page:page=page.replace('</head>',f'<script type="module" src="/assets/js/project-brochure.mjs?v={VERSION}"></script>\n</head>',1)
 page=re.sub(r'(project-request\.mjs\?v=)[^"\s]+',r'\g<1>'+VERSION,page)
 page=re.sub(r'(<meta name="description" content=")[^"]*(")',lambda m:m[1]+esc(p['descripcionLarga'])+m[2],page,count=1)
 if slug=='independencia-4745':
  page=page.replace('<h3>Equipamiento y áreas comunes</h3>','<h3>Equipamiento residencial y áreas comunes</h3>')
 return page

if __name__=='__main__':
 projects=update_data()
 if '--data-only' not in sys.argv:
  subprocess.run([sys.executable,str(ROOT/'scripts/build-catalog-facets.py')],check=True)
  from project_header_b import apply_header
  for p in projects:
   if p['slug'] in read('data/euro-commercial.json')['projects']:
    path=ROOT/(p['slug']+'.html');path.write_text(apply_header(path.read_text(),p))
