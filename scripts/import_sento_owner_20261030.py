"""One-time owner commercial import, independent of protected review materials."""
import json,copy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
rows={'san-ignacio':({'0':3670,'1':3625,'2':4495},'Inmediata','En recepción final'),'angamos':({},'Inmediata','En recepción final'),'curico-77':({'0':3262,'1':3778,'2':5050},'Enero 2029','En blanco'),'mirador-la-florida':({'0':2978,'1':3561,'2':4352},'Primer semestre 2029','En blanco'),'plaza-las-condes':({'2':11119},'Diciembre 2026','En verde'),'jofre-135':({'1':3969},'Inmediata','En recepción final'),'domeyko-2055':({'0':2700,'1':3193,'2':4112},'Inmediata','En recepción final')}
p=json.loads((R/'data/proyectos.json').read_text());f=json.loads((R/'data/fichas-proyectos.json').read_text())
for x in p:
 if x['slug'] not in rows:continue
 prices,delivery,state=rows[x['slug']]
 offers=[{'id':k+'d','label':'Estudio' if k=='0' else k+' dormitorio'+('s' if k!='1' else ''),'bedrooms':int(k),'propertyType':'departamento','priceUF':v,'priceDecimals':0} for k,v in prices.items()]
 x.update(commercialOffers=offers,catalogPricePolicy='owner-typology',estado=state,entrega=delivery,commercialSource={'type':'owner-supplied','date':'2026-10-30','priority':'owner-authorized','priceScope':'typology-not-unit','source':'Captura comercial Sento 30/10/2026 19:48:04 y tabla autorizada por Sollahms'})
 x['tipologias']=list(dict.fromkeys(x.get('tipologias',[])+[o['label'] for o in offers]))
 if prices and x['slug']!='plaza-las-condes':
  low=min(offers,key=lambda o:o['priceUF']);x.update(precioDesdeUF=low['priceUF'],precioDesdeTipologia=low['label'])
 if x['slug']=='plaza-las-condes':x['commercialSource']['conflict']='UF11119 corresponde al nuevo valor por tipología2D; se conserva mínimo de listaUF11073 autorizado anteriormente paraunidad313. No consta revocación.'
 research=next(q for q in f if q['slug']==x['slug'])
 for k in ['precioDesdeUF','precioDesdeTipologia','tipologias','commercialOffers','catalogPricePolicy','estado','entrega','commercialSource']:
  if k in x:research.setdefault('updates',{})[k]=copy.deepcopy(x[k])
 research['commercialOwnerUpdate']=copy.deepcopy(x['commercialSource'])
for name,data in [('proyectos.json',p),('fichas-proyectos.json',f)]: (R/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
d=R/'docs/sento-commercial-20261030';d.mkdir(parents=True,exist_ok=True)
(d/'owner-input.json').write_text(json.dumps({'existing':rows,'pending':{'compania-1735':{'prices':{'2':4550},'delivery':'Inmediata','state':'En recepción final','reason':'No ficha in production. Official cotizador names Compañía1735, commercial site Compañía1703; no new fiche or protected media copied.'}},'addresses':'Preserve verified addresses: San Ignacio280,Angamos205,Curicó77,Jofré157,Eugenia8; supplied alternate numbers kept as unresolved commercial aliases.'},ensure_ascii=False,indent=2)+'\n')
