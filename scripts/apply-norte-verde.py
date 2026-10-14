#!/usr/bin/env python3
"""Scoped catalogue update and fiche generation; all non-Norte Verde objects stay exact."""
import json,html,re,hashlib,shutil
from pathlib import Path
from norte_verde_fiche import render,typology
ROOT=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((ROOT/p).read_text())
write=lambda p,v:(ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def main():
 review=read('data/brochures-norte-verde.json');by={r['slug']:r for r in review['projects']};assert len(by)==17
 old=read('data/proyectos.json');research=read('data/fichas-proyectos.json');ledger=read('data/registro-fichas.json');retired={x['slug'] for x in review['excluded']}
 projects=[];updatedResearch={};updatedLedger={}
 for p in old:
  if p['inmobiliaria']!='Norte Verde':projects.append(p);continue
  if p['slug'] in retired:continue
  r=by[p['slug']];s=r['slug'];loc=r['location'];types=list(dict.fromkeys('Estudio' if m['bedrooms']==0 else str(m['bedrooms'])+' dormitorio'+('s' if m['bedrooms']!=1 else '') for m in r['models'] if m['bedrooms'] is not None));fields=['nombre','inmobiliaria','tipoActivo','tipologias','amenities','descripcionLarga','imagenPrincipal']+[k for k,l in [('direccion','address'),('comuna','commune'),('region','region')] if loc.get(l)]
  np={'slug':s,'nombre':r['name'],'inmobiliaria':'Norte Verde','tipoActivo':'Residencial','comuna':loc.get('commune'),'region':loc.get('region'),'direccion':loc.get('address'),'precioDesdeUF':None,'estado':None,'entrega':None,'tipologias':types,'amenities':[x['label'] for x in r['amenities']],'descripcionLarga':r['description'],'superficieDesdeM2':None,'mapQuery':None,'imagenPrincipal':r['cover'],'imagenAlt':next(i['caption'] for i in r['images'] if i['localPath']==r['cover']),'detalleUrl':'/'+s+'.html','verificacion':{'fecha':review['reviewDate'],'fuente':r['document']['localPath'],'estadoFuente':'verified','camposVerificados':fields}}
  page,mapped=render(r);(ROOT/(s+'.html')).write_text(page)
  if mapped:np['mapQuery']=', '.join(v for v in [loc['address'],loc['commune'],loc.get('region'),'Chile'] if v);fields.append('mapQuery')
  projects.append(np)
  rr={'slug':s,'sourceStatus':'verified','sourceUrl':r['document']['localPath'],'checkedAt':review['reviewDate'],'verifiedFields':fields,'updates':{k:v for k,v in np.items() if k in fields},'specs':{},'images':[{'url':i['localPath'],'localPath':i['localPath'],'sourceUrl':r['document']['localPath'],'alt':i['caption'],'sourcePage':i['sourcePage']} for i in r['images']],'virtualTours':[],'pendingFields':r['pending'],'documentSha256':r['document']['sha256'],'brochureModels':r['models']}
  updatedResearch[s]=rr;updatedLedger[s]={'slug':s,'nombre':r['name'],'inmobiliaria':'Norte Verde','detalleUrl':'/'+s+'.html','fichaDesarrollada':True,'destacadaExistente':False,'estadoFuente':'verified','fuente':r['document']['localPath'],'fechaRevision':review['reviewDate'],'mapa':mapped,'matterport':False,'recorridosOficiales':0,'pendientes':r['pending'],'controlCalidad':'datos_documentales_verificados_pendientes_comerciales','brochureSha256':r['document']['sha256'],'imagenes':len(r['images']),'planos':len(r['models'])}
 write('data/proyectos.json',projects);write('data/fichas-proyectos.json',[updatedResearch.get(r['slug'],r) for r in research if r['slug'] not in retired]);write('data/registro-fichas.json',[updatedLedger.get(r['slug'],r) for r in ledger if r['slug'] not in retired])
 # Remove only the three retired project entries from sitemap and project context.
 sitemap=(ROOT/'sitemap.xml').read_text()
 for s in retired:sitemap=re.sub(r'\s*<url><loc>https://sollahms.cl/'+re.escape(s)+r'\.html</loc></url>','',sitemap)
 (ROOT/'sitemap.xml').write_text(sitemap)
 context=(ROOT/'lib/project-context.mjs').read_text();match=re.search(r'(export const projects = Object\.freeze\()(.*?)(\);)',context,re.S);obj=json.loads(match[2]);obj={s:({'name':by[s]['name'],'url':'/'+s+'.html'} if s in by else v) for s,v in obj.items() if s not in retired};context=context[:match.start(2)]+json.dumps(obj,ensure_ascii=False,indent=2)+context[match.end(2):];(ROOT/'lib/project-context.mjs').write_text(context)
 archive=ROOT/'docs/archive/norte-verde';archive.mkdir(parents=True,exist_ok=True)
 for s in retired:
  p=ROOT/(s+'.html')
  if p.exists():shutil.move(p,archive/p.name)
 assert len(projects)==134 and len([p for p in projects if p['inmobiliaria']=='Norte Verde'])==17
 print(json.dumps({'catalogue':134,'updated':17,'added':0,'excluded':list(sorted(retired)),'preservedOthers':117}))
if __name__=='__main__':main()
