"""Owner prices are stored on the existing project/stage records; this is the one-time import."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
raw='''aires-la-florida-2|0:2350,1:3230,2:3600|Inmediata|En recepción final
conecta-huechuraba|3:4340|Inmediata|En recepción final
urban-la-florida|0:4400,1:3240,2:4230|Inmediata|En recepción final
alto-san-joaquin|2:5900,3:9250|Entrega futura|En verde
alto-san-joaquin-2|2:5900,3:8300|Entrega futura|En verde
nucleo-costanera|1:3100,2:3840,3:5520|Segundo semestre de 2027|En verde
nucleo-costanera-2|1:3100,2:3920,3:5600|Entrega futura|En verde
alto-san-joaquin-3|2:5900,3:8300|Entrega futura|En verde
enlace-mackenna|local:4800,1:3260,2:3570|Entrega futura|En blanco
ferroparque-2|0:2240,1:2740,2:2980|Entrega futura|En verde
espacio-victoria|0:2410,1:2890,2:3260|Entrega futura|En blanco
lamara|2:4540,3:7510|Entrega futura|En verde
terratolten-3|2:2780,3:3840|Entrega futura|En verde
wayra|2:7300,3:8300|Inmediata|En recepción final
nuevo-vivaceta|0:2050,1:2190,2:2600,3:4280|Julio de 2027|En verde
lomas-de-puyai-3|2:4220,3:5040|Entrega futura|En verde
cumbres-de-penuelas|3:5700|Inmediata|En recepción final
lomas-de-puyai|3:5260|Inmediata|En recepción final
ferroparque|1:2360,2:3500,3:3510|Inmediata|En recepción final
edificio-bezanilla|1:2620,2:3570|Inmediata|En recepción final
endemico|4:11343|Inmediata|En recepción final
terratolten-1|2:3750,3:4370|Próxima entrega|En verde
terratolten-2||Entrega futura|En verde'''
def label(k):return 'Local' if k=='local' else 'Estudio' if k=='0' else k+' dormitorio'+('s' if k!='1' else '')
records={}
for line in raw.splitlines():
 slug,prices,delivery,state=line.split('|');records[slug]={'prices':{k:int(v) for k,v in (pair.split(':') for pair in prices.split(',') if pair)},'delivery':delivery,'state':state}
assert sum(len(r['prices']) for r in records.values())==50
p=json.loads((R/'data/proyectos.json').read_text());f=json.loads((R/'data/fichas-proyectos.json').read_text());before=copy.deepcopy(p)
fields=['precioDesdeUF','precioDecimales','commercialOffers','preciosPorTipologia','tipologias','estado','estadoInformado','entrega','commercialSource','catalogPricePolicy','precioDesdeTipologia']
for project in p:
 if project['inmobiliaria']!='Ecasa':continue
 for stage in project['etapasComerciales']:
  c=records[stage['slug']];prices=c['prices'];oldtypes=stage.get('tipologias',[])
  offers=[{'id':k+'d' if k!='local' else k,'label':label(k),'bedrooms':None if k=='local' else int(k),'propertyType':'local' if k=='local' else 'casa' if stage['slug']=='endemico' else 'departamento','priceUF':v,'priceDecimals':0} for k,v in prices.items()]
  residential=[o for o in offers if o['propertyType']!='local'];low=min(residential,key=lambda o:o['priceUF']) if residential else None
  stage.update(precioDesdeUF=low['priceUF'] if low else stage.get('precioDesdeUF'),precioDecimales=0,commercialOffers=offers,preciosPorTipologia=[{'tipologia':o['label'],'precioDesdeUF':o['priceUF']} for o in offers],tipologias=list(dict.fromkeys(oldtypes+[o['label'] for o in offers])),estado=c['state'],estadoInformado=c['state'],entrega=c['delivery'],commercialSource={'type':'owner-supplied','date':'2026-10-30','priceStatus':'confirmed' if prices else 'pending','source':'Capturas comerciales ECasa suministradas por Sollahms; tabla del propietario','priority':'owner-authorized','priceScope':'typology-not-unit'},precioDesdeTipologia=low['label'] if low else None)
  stage['verificacion']['camposVerificados']=list(dict.fromkeys(stage['verificacion']['camposVerificados']+['tipologias','estado','entrega']+(['precioDesdeUF'] if prices else [])))
  if stage['slug']=='enlace-mackenna':stage.update(catalogPricePolicy='by-product',tipoActivo='Mixto',tiposActivos=['Residencial','Comercial','Mixto'])
 ref=next(s for s in project['etapasComerciales'] if s['slug']==project['etapaReferenciaSlug'])
 for key in fields:
  if key in ref:project[key]=copy.deepcopy(ref[key])
 if project['slug']=='enlace-mackenna':project.update(tipoActivo='Mixto',tiposActivos=['Residencial','Comercial','Mixto'])
 project['verificacion']['camposVerificados']=list(dict.fromkeys(project['verificacion']['camposVerificados']+['precioDesdeUF','estado','entrega','tipologias']))
 research=next(x for x in f if x['slug']==project['slug'])
 for k in fields:
  if k in project:research['updates'][k]=copy.deepcopy(project[k])
 research['verifiedFields']=list(dict.fromkeys(research['verifiedFields']+['precioDesdeUF','estado','entrega','tipologias']))
 for e in research.get('etapasComerciales',[]):
  st=next(s for s in project['etapasComerciales'] if s['slug']==e['slug']);e['catalogo']=copy.deepcopy(st)
  for k in fields:
   if k in st:e['investigacion'].setdefault('updates',{})[k]=copy.deepcopy(st[k])
  e['investigacion']['verifiedFields']=list(dict.fromkeys(e['investigacion'].get('verifiedFields',[])+['estado','entrega','tipologias']+(['precioDesdeUF'] if st['precioDesdeUF'] else [])))
assert [x for x in p if x['inmobiliaria']!='Ecasa']==[x for x in before if x['inmobiliaria']!='Ecasa']
for name,data in [('proyectos.json',p),('fichas-proyectos.json',f)]: (R/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
d=R/'docs/ecasa-commercial-20261030';d.mkdir(parents=True,exist_ok=True)
(d/'owner-input.json').write_text(json.dumps({'records':records,'counts':{'pricedStagesProvided':22,'pricesProvided':50,'existingStagesWithPrices':21,'existingPrices':46},'pending':{'nuevo-vivaceta':'No ECasa record/ficha in active catalogue. Do not associate with Ingevec Vivaceta. Owner prices retained here pending new-project integration.','terratolten-2':'No authorized price found in existing stage records.'}},ensure_ascii=False,indent=2)+'\n')
print('Updated 15 project records / 22 stage records / 46 prices. New ECasa Vivaceta identity pending; four prices preserved internally.')
