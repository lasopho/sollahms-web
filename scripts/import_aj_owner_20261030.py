"""Historical one-time import. Do not rerun over later owner instructions."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
rows={'downtown-san-martin':({'0':2635.3,'1':3517.7},'San Martín 70','Primer semestre 2027','En verde'),'vista-morande':({'1':3399},'Morandé 808','Primer semestre 2027','En verde'),'monjitas-690':({'0':2645.9,'1':3351.8},'Monjitas 690','Primer semestre 2029','En verde'),'edificio-teatinos-750':({'0':2491.2,'1':3315},'Teatinos 750','Inmediata','En recepción final'),'edificio-vista-amunategui':({'0':2596.2,'1':3308.2,'2':3888},'Amunátegui 743','Inmediata','En recepción final')}
p=json.loads((R/'data/proyectos.json').read_text());f=json.loads((R/'data/fichas-proyectos.json').read_text());loc=json.loads((R/'data/project-locations.json').read_text())
for x in p:
 if x['slug'] not in rows:continue
 prices,address,delivery,state=rows[x['slug']];old=x['direccion']
 offers=[{'id':k+'d','label':'Estudio' if k=='0' else k+' dormitorio'+('s' if k!='1' else ''),'bedrooms':int(k),'propertyType':'departamento','priceUF':v,'priceDecimals':1 if v%1 else 0} for k,v in prices.items()]
 low=min(offers,key=lambda o:o['priceUF'])
 x.update(precioDesdeUF=low['priceUF'],precioDesdeTipologia=low['label'],commercialOffers=offers,catalogPricePolicy='owner-typology',estado=state,entrega=delivery,direccion=address,mapQuery=address+', Santiago, Región Metropolitana, Chile',commercialSource={'type':'owner-supplied','date':'2026-10-30','priority':'owner-authorized','priceScope':'typology-not-unit','source':'Captura 2026-10-30 19:32:42 y tabla autorizada por Sollahms'})
 x['descripcionLarga']=x['descripcionLarga'].replace(old,address)
 if old!=address:
  l=loc['locations'][x['slug']];l['previousAddress']=old;l['address']=address;l['addressSource']='Owner supplied commercial screenshot 2026-10-30; same existing project/building';l['checkedOn']='2026-10-30'
 research=next(q for q in f if q['slug']==x['slug'])
 for k in ['precioDesdeUF','precioDesdeTipologia','commercialOffers','catalogPricePolicy','estado','entrega','direccion','mapQuery','commercialSource','descripcionLarga']:research['updates'][k]=copy.deepcopy(x[k])
 research['verifiedFields']=list(dict.fromkeys(research['verifiedFields']+['precioDesdeUF','estado','entrega','direccion']))
 research['pendingFields']=[a for a in research.get('pendingFields',[]) if a not in ['Precio vigente y disponibilidad','Fecha de entrega']]+['Disponibilidad de unidades por confirmar']
 research['sourceEvidence'].append('Actualización comercial del propietario 30/10/2026: precios por tipología, estado, entrega y dirección. Prevalece sobre campañas e información histórica; no acredita stock.')
for name,data in [('proyectos.json',p),('fichas-proyectos.json',f),('project-locations.json',loc)]: (R/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(R/'docs/aj-urbana-20261030').mkdir(parents=True,exist_ok=True)
(R/'docs/aj-urbana-20261030/owner-input.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
