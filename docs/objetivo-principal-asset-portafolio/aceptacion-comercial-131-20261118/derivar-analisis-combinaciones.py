import json, pathlib, hashlib, datetime, collections, math

ROOT = pathlib.Path('/private/tmp/sollahms-referencias-documentales-131-20261117')
DOC = pathlib.Path('/private/tmp/sollahms-auditoria-leben-20261116')
PUB = pathlib.Path('/private/tmp/sollahms-fuentes-publicadas-875-20261118')
OUT = pathlib.Path('/private/tmp/sollahms-consolidacion-comercial-131-20261118')
read = lambda p: json.loads(p.read_text())
projects = read(ROOT/'data/proyectos.json')
facets = read(ROOT/'data/catalog-facets.json')['projects']
leben = read(ROOT/'data/commercial-filter-evidence-leben.json')
euro = read(ROOT/'data/euro-commercial.json')
noll = read(ROOT/'data/nollagam-commercial.json')
axes = {
 'precio':['priceUF'], 'precio_D':['priceUF','bedrooms'],
 'precio_D_B':['priceUF','bedrooms','bathrooms'],
 'precio_util':['priceUF','usefulM2'], 'precio_total':['priceUF','totalM2'],
 'precio_D_B_util':['priceUF','bedrooms','bathrooms','usefulM2'],
 'precio_D_B_total':['priceUF','bedrooms','bathrooms','totalM2'],
 'D_B':['bedrooms','bathrooms'], 'D_B_util':['bedrooms','bathrooms','usefulM2'],
 'D_B_total':['bedrooms','bathrooms','totalM2'],
 'B_util':['bathrooms','usefulM2'], 'B_total':['bathrooms','totalM2'],
 'precio_tipo':['priceUF','propertyType'],
}
numeric = lambda x: type(x) in (int,float) and math.isfinite(x) and x >= 0
priced = lambda x: numeric(x) and x > 0
def present(a,k):
 return isinstance(a.get(k),str) and bool(a[k]) if k=='propertyType' else (priced(a.get(k)) if k=='priceUF' else numeric(a.get(k)))
def witness(refid, source, pointer, attributes, scope, **extra):
 return dict(id=refid,source=source,pointer=pointer,attributes=attributes,scope=scope,**extra)
result={p['slug']:{'name':p['nombre'],'developer':p['inmobiliaria'],'layers':{}} for p in projects}
published={p['slug']:[] for p in projects}
modelsets={p['slug']:[] for p in projects}
eurokeys={'mapocho-3521':['2','3'],'mapocho-3521-edificio-a':['2','3'],'plaza-de-lourdes':['1','2','3'],'rosas-1444':['2'],'diagonal-vicuna':[],'santa-elena-1670-mbi':['1','2'],'independencia-4745':['2','local'],'froilan-roa-5731-torre-sur':['1','2'],'entre-vicunas':['1','2'],'froilan-roa-5731-torre-norte':['1','2'],'edificio-don-pepe-154':['1','2'],'guillermo-mann-1401':['2']}
labels={'Estudio':0,'1 dormitorio':1,'2 dormitorios':2,'3 dormitorios':3,'4 dormitorios':4}
for pi,p in enumerate(projects):
 slug=p['slug']; f=facets.get(slug,{})
 stages=p.get('etapasComerciales') if p['inmobiliaria']=='Ecasa' and f.get('stages') else None
 candidates=[(stage,f['stages'].get(stage['slug'],{}),f'/{pi}/etapasComerciales/{si}',f'/projects/{slug}/stages/{stage["slug"]}') for si,stage in enumerate(stages)] if stages else [(p,f,f'/{pi}',f'/projects/{slug}')]
 for cp,cf,pp,fp in candidates:
  # Canonical model profiles already admitted to public facets; no raw brochure
  # field or generic project surface is converted here.
  for vi,v in enumerate(cf.get('variants',[])):
   a={k:v.get(k) for k in ['propertyType','bedrooms','bathrooms']}
   a.update({k:v.get('areas',{}).get(key) for k,key in [('usefulM2','util'),('totalM2','total')]})
   modelsets[slug].append(witness('published-model:'+str(vi),'data/catalog-facets.json',fp+'/variants/'+str(vi),a,'modelo publicado; etapa exacta si corresponde',stage=cp.get('slug') if stages else None))
  is_euro=p['inmobiliaria']=='Euro' and p.get('commercialSource',{}).get('file')=='data/euro-commercial.json' and slug in eurokeys
  if is_euro:
   for key in eurokeys[slug]:
    val=euro['projects'][slug]['prices'][key]
    a={'priceUF':val,'bedrooms':None if key=='local' else int(key),'propertyType':'local' if key=='local' else None}
    published[slug].append(witness(slug+':owner-price:'+key,'data/euro-commercial.json','/projects/'+slug+'/prices/'+key,a,'tipología del propietario; no unidad/modelo',adapter='Euro',assetType='Comercial' if key=='local' else None))
   continue
  if slug in noll['projects']:
   for ri,row in enumerate(p.get('preciosPorTipologia',[])):
    d=labels[row['tipologia']]; key=str(d); val=noll['projects'][slug]['prices'].get(key)
    a={'priceUF':val,'bedrooms':d,'propertyType':None}
    published[slug].append(witness('nollagam-owner:'+slug+':'+key+'d','data/nollagam-commercial.json','/projects/'+slug+'/prices/'+key,a,'categoría propietaria; sin tipo, uso, baño, superficie, estado, entrega ni amenities prestados',adapter='Nollagam'))
   continue
  cs=cp.get('commercialSource',{}); table=cp.get('preciosPorTipologia')
  table_ok=bool(table) and cs.get('type')=='owner-supplied' and bool(cs.get('verifiedOn') or cs.get('date')) and cp.get('priceStatus') in (None,'confirmed') and cs.get('priceStatus') in (None,'confirmed') and 'commercialOffers' not in cp and cp.get('catalogPricePolicy')!='owner-typology' and not(cp['inmobiliaria']=='Ecasa' and cs.get('date')=='2026-10-30')
  if table_ok:
   types=cf.get('propertyTypes',[]); universal=types[0] if len(set(types))==1 and types[0] in ['departamento','casa','duplex','estudio'] and cf.get('assetTypes') and all(x=='Residencial' for x in cf['assetTypes']) else None
   for ri,row in enumerate(table):
    local=row['tipologia']=='Local'; a={'priceUF':row.get('precioDesdeUF'),'bedrooms':None if local else labels.get(row['tipologia']),'propertyType':'local' if local else universal}
    published[slug].append(witness('published-typology:'+slug+':'+str(ri),'data/proyectos.json',pp+'/preciosPorTipologia/'+str(ri),a,'tipología publicada del propietario; tipo universal sólo con contexto explícito de facets',adapter='owner-published-typology',stage=cp.get('slug') if stages else None))
   continue
  # A price summary lends no bedrooms, bathrooms or areas to model variants.
  types=cf.get('propertyTypes',[]); one_type=types[0] if len(set(types))==1 and types else None
  if priced(cp.get('precioDesdeUF')):
   published[slug].append(witness('published-project-price','data/proyectos.json',pp+'/precioDesdeUF',{'priceUF':cp['precioDesdeUF'],'propertyType':one_type},'precio desde del proyecto/etapa; sin préstamo de modelos',adapter='published-project-price',stage=cp.get('slug') if stages else None))
  typed=cp.get('catalogPricePolicy') in ['owner-typology','by-product'] or cp['inmobiliaria']=='Ecasa' and cs.get('date')=='2026-10-30'
  if typed:
   offers=cp.get('commercialOffers',[])
   for oi,o in enumerate(offers):
    # catalogReference selects the least price within a product/bedroom label.
    peers=[q for q in offers if q.get('propertyType')==o.get('propertyType') and q.get('bedrooms')==o.get('bedrooms') and priced(q.get('priceUF'))]
    if not priced(o.get('priceUF')) or o['priceUF']!=min((q['priceUF'] for q in peers),default=None): continue
    a={k:o.get(k) for k in ['priceUF','propertyType','bedrooms','bathrooms','usefulM2','totalM2']}
    published[slug].append(witness('published-offer:'+str(o['id']),'data/proyectos.json',pp+'/commercialOffers/'+str(oi),a,'oferta pública por producto/tipología de esta etapa; no modelo enlazado',adapter='commercialOffers',stage=cp.get('slug') if stages else None))

prepared={p['slug']:[] for p in projects}
for pi,p in enumerate(leben['projects']):
 for ri,r in enumerate(p['references']):
  prepared[p['slug']].append(witness(r['id'],'data/commercial-filter-evidence-leben.json',f'/projects/{pi}/references/{ri}',r['attributes'],r.get('scope'),maskedFields=r.get('maskedFields',[]),conflictIds=r.get('conflictIds',[])))
local={p['slug']:[] for p in projects}; local_limits={}
fixture_names=['iris-documentary-15.json','iris-documentary-additions-2.json','iris-documentary-r018-vicuna-1103.json']
for fn in fixture_names:
 for pi,p in enumerate(read(ROOT/'tests/fixtures'/fn)['records']):
  local_limits[p['slug']]=p.get('bindingLimit')
  for ri,r in enumerate(p['references']):
   local[p['slug']].append(witness(r['id'],'tests/fixtures/'+fn,f'/records/{pi}/references/{ri}',r['attributes'],r.get('scope'),constraints=r.get('constraints',[]),bindingLimit=p.get('bindingLimit'),metadataNotFilterable=['externalPriceMetadata','internalM2','lotTotalM2','modelLabel','unitLabel','literalDescription']))
plaza=read(ROOT/'tests/fixtures/plaza-213-reference.json')
r=plaza['record']['references'][0]
local['plaza-las-condes'].append(witness(r['id'],'tests/fixtures/plaza-213-reference.json','/record/references/0',r['attributes'],'Sólo unidad213/modeloC7; precio owner28/10 y superficies explícitas del plano; no inventario ni desde del proyecto',constraints=['No extender a313/C6/C8 ni otras unidades.','Local review only; commercial validity and stock unconfirmed.']))
all_refs={'published875':published,'preparedLeben':prepared,'documentaryLocal24a':local}
summaries={}
for layer,by in all_refs.items():
 counts=collections.Counter({axis:0 for axis in axes})
 for p in projects:
  slug=p['slug']; refs=by[slug]
  profile_refs=refs+modelsets[slug] if layer=='published875' else refs
  combos={}
  for axis,fields in axes.items():
   pool=refs if 'priceUF' in fields else profile_refs
   hits=[r for r in pool if all(present(r['attributes'],k) for k in fields)]
   if hits: counts[axis]+=1
   combos[axis]={'status':('PERFIL_DOCUMENTAL_LOCAL' if layer=='documentaryLocal24a' else 'TESTIGO_CONJUNTO_EN_CONTRATO') if hits else 'SIN_TESTIGO_CONJUNTO_EN_ESTA_CAPA','witnessCount':len(hits),'witnesses':[{'id':r['id'],'source':r['source'],'pointer':r['pointer'],**({'stage':r['stage']} if r.get('stage') else {})} for r in hits[:1]]}
  result[slug]['layers'][layer]={'referencesInScope':len(profile_refs),'priceReferenceCount':sum(priced(r['attributes'].get('priceUF')) for r in refs),'combinations':combos}
  if layer=='documentaryLocal24a':
   result[slug]['layers'][layer].update({'publication':'NO_PUBLICADO; loopback y opt-in explícito; no oferta ni stock','identityOnly':not bool(refs),'bindingLimit':local_limits.get(slug),'referenceConstraints':[{'id':r['id'],'scope':r['scope'],'constraints':r.get('constraints',[]),'attributesAdmitted':{k:v for k,v in r['attributes'].items() if v is not None},'notFilterable':['internalM2','lotTotalM2','externalPriceMetadata','modelLabel','unitLabel']} for r in refs]})
 summaries[layer]={'projectsWithAnyLayerReferences':sum(bool(by[p['slug']]+modelsets[p['slug']] if layer=='published875' else by[p['slug']]) for p in projects),'projectsWithPricedReferences':sum(any(priced(r['attributes'].get('priceUF')) for r in by[p['slug']]) for p in projects),'supportedProjectCountsByAxis':dict(counts),'countsAreNotUniqueStockOrNewFacts':True}

for p in result.values():
 for layer in p['layers'].values():
  layer['unsupportedAxes']=[axis for axis,c in layer['combinations'].items() if c['witnessCount']==0]
  layer['combinations']={axis:c for axis,c in layer['combinations'].items() if c['witnessCount']>0}
 for r in p['layers']['documentaryLocal24a']['referenceConstraints']:
  attributes=r.pop('attributesAdmitted')
  r['storedAttributes']=attributes
  r['predicateAttributes']={k:v for k,v in attributes.items() if k not in ['internalM2','lotTotalM2']}
sources=[ROOT/'data/proyectos.json',ROOT/'data/catalog-facets.json',ROOT/'data/commercial-filter-evidence-leben.json',ROOT/'data/euro-commercial.json',ROOT/'data/nollagam-commercial.json',ROOT/'data/crescer-brochures.json',ROOT/'assets/js/commercial-filter-engine.mjs',ROOT/'assets/js/documentary-reference-data.mjs',ROOT/'assets/js/documentary-local-review.mjs']+[ROOT/'tests/fixtures'/n for n in fixture_names]+[ROOT/'tests/fixtures/plaza-213-reference.json',PUB/'RECIBO-FUENTES-875.json']+list((PUB/'assets/js').glob('*.mjs'))
source_manifest=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sources]
output={'schemaVersion':1,'createdAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'kind':'ANALISIS_ESTATICO_DE_CONTRATOS_Y_TESTIGOS_EXISTENTES_NO_EJECUCION_DE_MOTOR','universe':131,'productionSHA':'875bd80ddb650b376cb3dd53af4ffae066fcd48f','localSupplementSHA':'24a11df1a62898a06b408a729bb20ce1b1de4e87','method':{'newIrisQueries':0,'appModulesExecuted':0,'testsExecuted':0,'newFacts':0,'definition':'Cada eje enumera familias de predicados para las que existe un único registro con todos los campos numéricos/tipo admitidos por su contrato. No se ejecutaron búsquedas ni se certificó toda combinación cruzada. Los rangos concretos deben contener los valores del mismo testigo; otros filtros activos también deben cumplir su propio alcance.','partialReference':'Un registro puede respaldar D/B o terraza sin precio, y un precio por tipología puede respaldar P+D sin baño o superficie. La presencia de ambos en un proyecto no autoriza unirlos.','not1700Combinations':'Los1700localizadores del índice de aceptación son punteros a registros/fuentes, no1700consultas validadas.','noLayerUnion':True,'dataFreshness':'Fechas originales conservadas; fecha de análisis no renueva vigencia comercial ni acredita disponibilidad.'},'axisDefinitions':axes,'statusDefinitions':{'TESTIGO_CONJUNTO_EN_CONTRATO':'Testigo estático explícito admitido en esa capa, sujeto a su política/contexto y carga de fuente. No garantiza stock, vigencia o toda consulta cruzada.','PERFIL_DOCUMENTAL_LOCAL':'Tupla de referencia documental local, no adopción comercial ni publicación. Debe conservar unidad/modelo/edificio/fecha y todas las limitaciones.','SIN_TESTIGO_CONJUNTO_EN_ESTA_CAPA':'No hay un mismo registro admitido con todos los campos; no significa que el proyecto esté ausente o deba bloquearse sin ese filtro.'},'summaries':summaries,'unknownReasonCodes':{'SOURCE_FIELD_ABSENT':'El atributo no está explícito en el testigo.','METADATA_ONLY':'Campos como externalPriceMetadata, literalDescription, unitLabel/modelLabel, fieldsPresent y literalFields localizan/protegen procedencia; no son predicados comerciales.','METRIC_NOT_CANONICAL':'Internos no es interior/útil/total; total del lote no es superficie total residencial ni landM2 sin mapeo.','REFERENCE_UNLINKED':'Precio propietario por tipología no tiene asociación acreditada a un modelo/unidad/plano.','MASKED_OR_CONFLICT':'Un campo en maskedFields/contradicción no debe recuperarse del literal como positivo.','SCOPE_NOT_UNIVERSAL':'Hecho general de proyecto, edificio o uso no implica aplicación a cada referencia.','LAYER_NOT_PUBLIC':'Suplemento24a no se ha publicado;113identidades sin referencia adicional no equivalen a proyectos no auditados.','RUNTIME_SOURCE_REQUIRED':'Euro/Nollagam exigen contexto verificado por hash/identidad; falla de carga no autoriza fallback positivo.','NO_STOCK_OR_VALIDITY':'Fuente y números no acreditan stock/vigencia actuales.'},'criticalContractNotes':['Campos desconocidos activos fallan; campos no consultados no excluyen por sí mismos.','En publicado, variantes admitidas pueden respaldar D/B/superficie sin precio; precio de resumen nunca se presta a esas variantes.','Precios Euro por dormitorio no establecen departamento ni uso residencial. Local literal sí establece local/Comercial.','Nollagam:17precios y22categorías existentes,5conprecio desconocido; sólo precio+D, sin tipo/uso/baño/superficies/amenities/estado/entrega prestados.','Enum propietario publicado Estudio puede significar0D en su contrato; texto libre estudio de Iris no establece0D.','Amenities deben cumplir alcance/uso del mismo testigo. Números de terraza no implican terraza privada; extras adicionales no implican incluidos/disponibles.','Publicado estado/entrega y etapas conservan alcance de proyecto/etapa. En Nollagam el testigo price/D mantiene esos atributos desconocidos y no los toma del resumen.','R003 PlazaCervantes conserva building-scope-conflict;2D1B es perfil local909A, sin asociación comercial/global conTorreA ni equivalencia conTorreB/Iris1451.','R018 permite B+útil o B+total23.69 y terraza0 sólo1103/planoC2 mostrado; no0D, no uso, no precio ni extrapolaciónC2(VM).','Plaza213/C7 es el único testigo de precio propietario+DB+útil/total en la capa local19; no significa oferta activa ni desde del proyecto.'],'certificateReuse':{'F10':'84Node y16Chrome históricos; no repetidos ni sumados a subconjuntos. COBERTURA-FUNCIONAL.json documenta preparadoLebenP+D10,P+D+B5,P+útil0,P+total0.','supplement24a':'30pruebasNode distintas y9controlesChrome dirigidos según CANDIDATO-SUPLEMENTO-DOCUMENTAL-LOCAL.json; no se ejecutaron de nuevo.','newCertification':False},'projectsBySlug':result,'sourceManifest':source_manifest}
output['method']['compactSchema']='combinations contiene sólo ejes respaldados; unsupportedAxes enumera explícitamente todos los demás con estado SIN_TESTIGO_CONJUNTO_EN_ESTA_CAPA. witnesses contiene como máximo un ejemplo verificable por eje; witnessCount cuenta todos los registros estáticos de ese eje, no stock. Fuentes y script conservan la derivación completa.'
output['surfaceUiPolicy']='Útil y total son métricas explícitas alternativas de la UI: cada eje util o total analiza una consulta independiente con una sola métrica seleccionada. No se inventa una selección simultánea útil+total ni se suman métricas.'
output['sourceEligibilityPolicy']='Se usan únicamente variants y áreas canónicas ya admitidas en catalog-facets, no cualquier número de los brochures. No se recuperan campos enmascarados de literalAttributes, ni modelos filterEligible:false, ni Interior/Departamento/Internos como útil o total.'
crescer=read(ROOT/'data/crescer-brochures.json')
output['sourceEligibilityExamples']=[{'slug':'don-rafael','source':'data/crescer-brochures.json','pointer':'/projects/don-rafael/models/'+str(i),'id':m['id'],'filterEligible':m.get('filterEligible'),'classificationStatus':m.get('classificationStatus'),'result':'Excluido como testigo; los perfiles válidos restantes conservan Interior y Terraza, sin útil ni total.'} for i,m in enumerate(crescer['projects']['don-rafael']['models']) if m.get('filterEligible') is False]
output['sourceEligibilityExamples'].extend([{'slug':'don-tomas','source':'data/catalog-facets.json','pointer':'/projects/don-tomas/variants','result':'areas.departamento se conserva con ese rótulo; no útil ni total.'},{'slug':'reserva-mayor-2','source':'tests/fixtures/iris-documentary-15.json','referenceId':'IRIS-131-R006','result':'lotTotalM2=1500 permanece documental del lote; no útil/total residencial ni landM2.'}])
output['criticalContractNotes'].extend(['Own vendido se excluye sólo de la oferta preparada; este análisis no lo elimina del universo publicado131.','Los dos adicionales Suecia permanecen separados; no se suman a priceUF del inmueble.','No se suman los conteos de capas; son fuentes y criterios distintos para las mismas identidades.'])
output['criticalContractNotes'].append('preparedLeben describe sólo el overlay de12proyectos; no es el conteo de toda la vista evidencia=prepared, que mantiene la ruta publicada para los demás. Las capas no se suman para inferir cobertura global de esa vista.')
(OUT/'ANALISIS-COMBINACIONES.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'summaries':summaries,'bytes':(OUT/'ANALISIS-COMBINACIONES.json').stat().st_size,'sha256':hashlib.sha256((OUT/'ANALISIS-COMBINACIONES.json').read_bytes()).hexdigest()},ensure_ascii=False,indent=2))
