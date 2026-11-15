from pathlib import Path
from lxml import html
import re,json,hashlib,html as esc
from urllib.parse import urlparse
P=Path(__file__).parent; O=P/'site';O.mkdir(exist_ok=True)
refs=json.loads((P/'references-checked.json').read_text());byurl={r['url']:r for r in refs}
cats={'financiamiento':'Financiamiento hipotecario','tributacion':'Tributación inmobiliaria','empresas':'Inversión empresarial','normativa':'Normativa inmobiliaria','entorno':'Entorno y desarrollo urbano'}
pages={f.name:html.fromstring(f.read_text()).xpath('string(//h1)').strip() for f in (P/'base').glob('*.html')}
catsby={'guia-hipotecaria.html':'financiamiento','cuando-comprar-propiedad.html':'normativa','inversion-inmobiliaria-empresas.html':'empresas','beneficios-tributarios-inmobiliarios.html':'tributacion'}
E=lambda s:esc.escape(str(s),quote=True)
official={'www.bcn.cl':'Biblioteca del Congreso Nacional de Chile','nuevo.leychile.cl':'Biblioteca del Congreso Nacional de Chile','www.sii.cl':'Servicio de Impuestos Internos','www4.sii.cl':'Servicio de Impuestos Internos','www.minvu.gob.cl':'Ministerio de Vivienda y Urbanismo','www.bcentral.cl':'Banco Central de Chile','www.cmfchile.cl':'Comisión para el Mercado Financiero','www.cmfeduca.cl':'Comisión para el Mercado Financiero','servicios.cmfchile.cl':'Comisión para el Mercado Financiero','www.sernac.cl':'Servicio Nacional del Consumidor','www.sernac.gob.cl':'Servicio Nacional del Consumidor','www.sernac.gov.cl':'Servicio Nacional del Consumidor','educacion.dedecon.cl':'Defensoría del Contribuyente','fogaes.cl':'FOGAES / BancoEstado','www.diariooficial.interior.gob.cl':'Diario Oficial','nwm.bancoestado.cl':'BancoEstado'}
private={'www.puenteindustrial.cl':'Sociedad Concesionaria Puente Industrial','www.bci.cl':'Banco Bci','www.ceaza.cl':'CEAZA','eha.cl':'El Heraldo Austral','www.diarioconcepcion.cl':'Diario Concepción','noticias.unab.cl':'Universidad Andrés Bello','infraestructura.uc.cl':'Pontificia Universidad Católica de Chile','www.viaschile.cl':'VíasChile'}
municipal={'www.camara.cl':'Cámara de Diputadas y Diputados','dprlosrios.dpr.gob.cl':'Delegación Presidencial Regional de Los Ríos','www.dprcoquimbo.dpr.gob.cl':'Delegación Presidencial Regional de Coquimbo','interior.gob.cl':'Ministerio del Interior','mtt.gov.cl':'Ministerio de Transportes y Telecomunicaciones','loslagos.transporteinforma.cl':'Transporte Informa Los Lagos / MTT','ssconce.redsalud.gob.cl':'Servicio de Salud Concepción','ssms.gob.cl':'Servicio de Salud Metropolitano Sur','www.ptovaras.cl':'Municipalidad de Puerto Varas','concepcion.cl':'Municipalidad de Concepción','www.munistgo.cl':'Municipalidad de Santiago','municipalidaddevalparaiso.cl':'Municipalidad de Valparaíso','www.cisterna.cl':'Municipalidad de La Cisterna','www.sanbernardo.cl':'Municipalidad de San Bernardo','www.independencia.cl':'Municipalidad de Independencia','coresantiago.cl':'Consejo Regional Metropolitano','www.gobiernosantiago.cl':'Gobierno de Santiago','www.gorecoquimbo.cl':'Gobierno Regional de Coquimbo','goreohiggins.cl':'Gobierno Regional de O’Higgins','www.red.cl':'Red Movilidad','www.panelconcesiones.cl':'Panel Técnico de Concesiones','www.mercadopublico.cl':'ChileCompra / Mercado Público','tribunalambiental.cl':'Tribunal Ambiental','ind.cl':'Instituto Nacional de Deportes','parqueestadionacional.cl':'Parque Estadio Nacional'}
for r in refs:
 host=urlparse(r['url']).hostname;r['institution']=official.get(host) or private.get(host) or municipal.get(host)
 if 'openstreetmap.org' in host:r['institution']='OpenStreetMap — colaboradores';r['kind']='Técnica colaborativa'
 elif host=='www.google.com':r['institution']='Google Maps / mapa enlazado por DGC';r['kind']='Técnica cartográfica'
 elif host in private:r['kind']='Privada / académica o informativa'
 elif r['institution'] or '.minsal.cl' in host or '.gob.cl' in host or host in ['mtt.gov.cl','interior.gob.cl','ssconce.redsalud.gob.cl','loslagos.transporteinforma.cl','transparencia.lascondes.cl']:r['kind']='Institucional pública'
 else:r['kind']='Clasificación por confirmar'
 if not r['institution']:
  r['institution']=('Ministerio de Obras Públicas' if '.mop.gob.cl' in host else 'Ministerio de Salud' if '.minsal.cl' in host else 'Servicio de Evaluación Ambiental' if '.sea.gob.cl' in host else host)
 if host=='www.camara.cl':r['institution']='Instituto Nacional de Deportes — documento alojado por la Cámara de Diputadas y Diputados'
 ps=r['pages'];r['category']='entorno' if ps==['entorno-desarrollo-urbano.html'] else 'tributacion' if 'beneficios-tributarios-inmobiliarios.html' in ps else 'empresas' if ps==['inversion-inmobiliaria-empresas.html'] else 'normativa' if ps==['cuando-comprar-propiedad.html'] else 'financiamiento'
 r['validity']='Vigencia normativa no recertificada en esta centralización; consulta la versión y el período del documento.'
 if r['category']=='entorno':r['validity']='Información fechada de contexto; no confirma el estado actual de la obra. Revisión histórica del registro: 31/10/2026.'
 if host=='www.bci.cl' or 'bancoestado' in host:r['validity']='Información del emisor; condiciones sujetas a evaluación y cambios. No constituye oferta de Sollahms.'

# Prefer documentary titles over action labels, preserving all original labels in the inventory.
for r in refs:
 if r['id']=='ref-b70ea50ee7':r['titles'].insert(0,'Valor diario de la Unidad de Fomento (UF), 2026')
 elif r['id']=='ref-20327ee159':r['titles'].insert(0,'Simulador hipotecario de la CMF')
 elif r['titles'][0].startswith(('Conocer ','Consultar ','Revisar ')) and r.get('observedTitle'):r['titles'].insert(0,r['observedTitle'])

changes=[];moved=[];context=[]
for f in (P/'base').glob('*.html'):
 s=f.read_text();original=s;doc=html.fromstring(s)
 for r in refs:
  for x in r['occurrences']:
   if x['page']==f.name:(moved if x['move'] else context).append({'reference':r['id'],'url':r['url'],**x})
 if f.name in catsby:
  match=re.search(r'<section\b[^>]*\bid="fuentes".*?</section>',s,re.S);assert match,f.name
  old=match.group();new=old
  new=re.sub(r'<ul\b.*?</ul>','',new,flags=re.S)
  # Keep essential notices, dates and attribution paragraphs; relocate the long list only.
  brief='<p data-documental-context>Consulta las fuentes oficiales y referencias utilizadas para elaborar este contenido. <a href="/fuentes-respaldo-documental.html#'+catsby[f.name]+'">Consultar fuentes y respaldo documental</a>.</p>'
  new=re.sub(r'(<h2\b[^>]*>).*?(</h2>)',r'\1Respaldo documental\2'+brief,new,count=1,flags=re.S)
  # Keep historic deep-link targets, while current citations point to the exact central record.
  ids=html.fromstring(old).xpath('//li[@id]/@id')
  new=new.replace(brief,''.join('<span id="'+i+'"></span>' for i in ids)+brief,1)
  s=s[:match.start()]+new+s[match.end():]
  for r in refs:
   for x in r['occurrences']:
    if x['page']==f.name and x.get('sourceId'):s=s.replace('href="#'+x['sourceId']+'"','href="/fuentes-respaldo-documental.html#'+r['id']+'"')
  # Centralize the guide bibliography's lead citation; preserve the UF and CMF tool next to their use.
  if f.name=='guia-hipotecaria.html':
   s=re.sub(r'<p><strong>Fuente:</strong>.*?</p>','',s,count=1,flags=re.S)
 footer=re.search(r'<footer\b.*?</footer>',s,re.S);assert footer
 old=footer.group();new=old
 link='<a href="/fuentes-respaldo-documental.html">Fuentes y respaldo documental</a>'
 privacy=re.search(r'<a\b[^>]*href="/privacidad.html"[^>]*>Privacidad</a>',old)
 if re.search(r'>Legal</h[234]>',old):
  assert privacy
  end=old.index('</li>',privacy.end())+5
  cls=re.search(r'class="([^"]*)"',privacy.group())
  if cls:link=link.replace('<a ','<a class="'+cls.group(1)+'" ')
  new=old[:end]+'<li>'+link+'</li>'+old[end:]
 else:
  legal='<span data-documental-legal style="display:inline-flex;flex-wrap:wrap;align-items:baseline;gap:12px;max-width:100%"><strong>Legal</strong>'+(privacy.group() if privacy else '<a href="/privacidad.html">Privacidad</a>')+link+'</span>'
  if privacy:new=old[:privacy.start()]+legal+old[privacy.end():]
  else:new=old.replace('</nav>','</nav>'+legal,1)
 s=s[:footer.start()]+new+s[footer.end():]
 assert re.search(r'<head>.*?</head>',s,re.S).group()==re.search(r'<head>.*?</head>',original,re.S).group(),f.name
 (O/f.name).write_text(s)
 changes.append({'file':f.name,'before':hashlib.sha1(original.encode()).hexdigest(),'after':hashlib.sha1(s.encode()).hexdigest(),'size':len(s.encode()),'sourcesMoved':f.name in catsby,'footerOnly':f.name not in catsby})

# New hub reuses the corporate shell; no calculator or commercial handler is loaded.
shell=(O/'inversion-inmobiliaria-empresas.html').read_text();head=shell[:shell.index('<main')];footer=shell[shell.index('</main>')+7:]
title='Fuentes y respaldo documental | Sollahms';desc='Consulta las referencias oficiales, privadas y técnicas de las guías corporativas de Sollahms, organizadas por materia y página educativa.'
head=re.sub(r'<title>.*?</title>','<title>'+title+'</title>',head)
head=re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*',lambda m:m[1]+desc,head)
head=re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m[1]+title,head)
head=head.replace('https://sollahms.cl/inversion-inmobiliaria-empresas.html','https://sollahms.cl/fuentes-respaldo-documental.html')
head=head.replace('<script type="module" src="/assets/js/inversion-empresas.mjs"></script>','')
schema={'@context':'https://schema.org','@type':'CollectionPage','@id':'https://sollahms.cl/fuentes-respaldo-documental.html#webpage','url':'https://sollahms.cl/fuentes-respaldo-documental.html','name':title,'description':desc,'inLanguage':'es-CL','isPartOf':{'@id':'https://sollahms.cl/#website'},'publisher':{'@id':'https://sollahms.cl/#organization'}}
head=re.sub(r'<script type="application/ld\+json">.*?</script>','<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False)+'</script>',head,flags=re.S)
css='''<style>.doc-main{line-height:1.7}.doc-hero{padding:64px 0;background:var(--s-hero);color:var(--s-white)}.doc-hero h1{font:700 clamp(2rem,5vw,3.5rem)/1.1 Manrope,sans-serif;margin:16px 0}.doc-wrap{max-width:1120px;margin:auto;padding:0 24px}.doc-nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.doc-nav a{padding:8px 12px;background:var(--s-soft);color:var(--s-green);border-radius:8px}.doc-main a{text-decoration:underline;text-underline-offset:4px}.doc-section{padding:40px 0;scroll-margin-top:100px}.doc-section h2{font:700 1.8rem/1.25 Manrope,sans-serif}.doc-reference{border-bottom:1px solid var(--s-line);padding:16px 0;scroll-margin-top:100px;overflow-wrap:anywhere}.doc-reference summary{cursor:pointer;font-weight:700;padding:8px 0}.doc-reference dl{display:grid;grid-template-columns:140px 1fr;gap:8px;margin:16px 0}.doc-reference dt{font-weight:700}.doc-reference dd{margin:0}.doc-kind{font-size:.8rem;color:var(--s-muted)}.doc-note{background:var(--s-soft);padding:24px;border-left:4px solid var(--s-gold);margin:24px 0}.doc-main :focus-visible{outline:3px solid var(--s-green);outline-offset:4px}.doc-related{display:flex;flex-wrap:wrap;gap:8px 20px}.doc-top{display:inline-block;margin-top:24px}@media(max-width:480px){.doc-wrap{padding:0 20px}.doc-reference dl{display:block}.doc-reference dt{margin-top:12px}.doc-hero{padding:40px 0}}@media print{.doc-reference>*{display:block!important}}</style>'''
head=head.replace('<link rel="stylesheet" href="/assets/css/sollahms-theme.css">',css+'<link rel="stylesheet" href="/assets/css/sollahms-theme.css">')
body='<main id="contenido-principal" class="doc-main"><section class="doc-hero"><div class="doc-wrap"><p>TRANSPARENCIA / CONTENIDO EDUCATIVO</p><h1>Fuentes y respaldo documental</h1><p>El origen de la información, en un solo lugar.</p><p>Consulta las referencias de nuestras guías y vuelve al contenido que estás revisando.</p></div></section><div class="doc-wrap"><nav class="doc-nav" aria-label="Materias documentales">'+''.join('<a href="#'+k+'">'+v+'</a>' for k,v in cats.items())+'</nav><aside class="doc-note"><p>Distinguimos fuentes institucionales públicas, privadas y técnicas. Su inclusión no implica patrocinio ni certificación de Sollahms.</p><p>La fecha de comprobación del enlace no acredita vigencia jurídica. Conservamos las fechas y el ámbito de los documentos; la aplicación de cada norma depende de la operación. Los registros con acceso pendiente se identifican expresamente.</p><p>Las referencias geográficas y por obra que requieren contexto permanecen también en Entorno. Se excluye la documentación comercial de proyectos inmobiliarios.</p></aside>'
for k,label in cats.items():
 rows=[r for r in refs if r['category']==k];assert rows
 body+='<section id="'+k+'" class="doc-section"><h2>'+label+'</h2><p>'+str(len(rows))+' referencias. Abre cada título para consultar su origen y las páginas relacionadas.</p>'
 for r in rows:
  date=r['checkedAt'][:10];access='Acceso al documento comprobado' if r.get('http')==200 or r.get('retrievedViaWeb') else 'Verificación de acceso pendiente'
  related=' · '.join('<a href="/'+n+'">'+E(pages[n])+'</a>' for n in r['pages'])
  body+='<details id="'+r['id']+'" class="doc-reference"><summary>'+E(r['titles'][0])+'</summary><p class="doc-kind">'+E(r['kind'])+'</p><dl><dt>Institución</dt><dd>'+E(r['institution'])+'</dd><dt>Materia</dt><dd>'+label+'</dd><dt>Documento</dt><dd><a href="'+E(r['url'])+'" target="_blank" rel="noopener noreferrer">Abrir fuente original <span aria-hidden="true">↗</span></a><br><small>'+E(r['url'])+'</small></dd><dt>Comprobación</dt><dd><time datetime="'+date+'">'+date+'</time> · '+access+'</dd><dt>Vigencia y alcance</dt><dd>'+E(r['validity'])+'</dd><dt>Contenido relacionado</dt><dd>'+related+'</dd></dl>'
  dates=list(dict.fromkeys(x.get('sourceDate') for x in r['occurrences'] if x.get('sourceDate')))
  if dates:body+='<p><strong>Fecha del documento registrada:</strong> '+E(' / '.join(dates))+'</p>'
  notes=list(dict.fromkeys(x['text'] for x in r['occurrences'] if x['move']))
  if notes:body+='<p><strong>Referencia conservada de las guías:</strong> '+E(' / '.join(notes))+'</p>'
  body+='</details>'
 body+='<a class="doc-top" href="#contenido-principal">Volver a las materias ↑</a></section>'
body+='</div></main>'
(O/'fuentes-respaldo-documental.html').write_text(head+body+footer)
(P/'master-references.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2));(P/'moved.json').write_text(json.dumps(moved,ensure_ascii=False,indent=2));(P/'contextual-retained.json').write_text(json.dumps(context,ensure_ascii=False,indent=2));(P/'changes.json').write_text(json.dumps(changes,indent=2));print('Built',len(changes),'modified HTML, one new hub;',len(refs),'unique references')
