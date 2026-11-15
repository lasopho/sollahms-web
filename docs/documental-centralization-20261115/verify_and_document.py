from pathlib import Path
from lxml import html
import json,re,hashlib,csv,difflib,collections
P=Path(__file__).parent;D=P/'evidence';D.mkdir(exist_ok=True)
refs=json.loads((P/'master-references.json').read_text());hub=html.fromstring((P/'site/fuentes-respaldo-documental.html').read_text());ids=hub.xpath('//@id');assert len(ids)==len(set(ids))
qa=[];patch=[]
for f in sorted((P/'base').glob('*.html')):
 b=f.read_text();c=(P/'site'/f.name).read_text();bd=html.fromstring(b);cd=html.fromstring(c)
 for xp in ['//head','//header','//h1','//form','//script']:
  assert [html.tostring(x) for x in bd.xpath(xp)]==[html.tostring(x) for x in cd.xpath(xp)],(f.name,xp)
 assert set(bd.xpath('//@id'))<=set(cd.xpath('//@id'))
 assert len(cd.xpath('//footer//a[@href="/fuentes-respaldo-documental.html"]'))==1
 old=bd.xpath('//footer//a/@href');new=cd.xpath('//footer//a/@href')
 assert all(new.count(x)>=old.count(x) for x in old)
 for href in cd.xpath('//a/@href'):
  if href.startswith('/fuentes-respaldo-documental.html#'):assert href.split('#')[1] in ids
 def unaffected(s):
  s=re.sub(r'<footer\b.*?</footer>','',s,flags=re.S)
  s=re.sub(r'<section\b[^>]*\bid="fuentes".*?</section>','',s,flags=re.S)
  if f.name=='guia-hipotecaria.html':s=re.sub(r'<p><strong>Fuente:</strong>.*?</p>','',s,count=1,flags=re.S)
  s=re.sub(r'href="(?:/fuentes-respaldo-documental.html#ref-[a-f0-9]+|#fuente-[^"]+)"','href="CONTEXTUAL_CITATION"',s)
  return s
 assert unaffected(b)==unaffected(c),f.name
 qa.append({'page':f.name,'title':bd.xpath('string(//h1)').strip(),'canonical':bd.xpath('//link[@rel="canonical"]/@href'),'headHeaderH1FormsScriptsIdentical':True,'allOtherContentIdentical':True,'footerOriginalDestinationsPreserved':True,'allHistoricIdsPreserved':True,'references':sum(f.name in x['pages'] for x in refs),'sha1Before':hashlib.sha1(f.read_bytes()).hexdigest(),'sha1After':hashlib.sha1((P/'site'/f.name).read_bytes()).hexdigest(),'sha256After':hashlib.sha256((P/'site'/f.name).read_bytes()).hexdigest()})
 patch.extend(difflib.unified_diff(b.splitlines(True),c.splitlines(True),fromfile='production/'+f.name,tofile='candidate/'+f.name))
assert len(refs)==140
for x in refs:assert x['url'] in hub.xpath('//a/@href')
base=json.loads((P/'base-manifest.json').read_text());new=json.loads((P/'candidate-manifest.json').read_text());bm={x['file']:x for x in base};nm={x['file']:x for x in new}
changed=[x for x in bm if bm[x]!=nm[x]];assert len(changed)==12;assert set(nm)-set(bm)=={'release/static/fuentes-respaldo-documental.html'};assert not set(bm)-set(nm)
for path in changed:assert path in {'release/static/'+x['page'] for x in qa}
for path in ['release/static/proyectos.html','release/static/sitemap.xml','release/static/robots.txt']:assert bm[path]==nm[path]
for f in (P/'site').glob('*.html'):assert hashlib.sha1(f.read_bytes()).hexdigest()==nm['release/static/'+f.name]['sha']
assert all(x['kind']!='Clasificación por confirmar' for x in refs)
preservation={'baseDeployment':'dpl_GqikSrihY6ETwsVJtkF6uB6y4Dsw','baseCommit':'f0e8bd59a9589e7d1b5a737778c6bf4783e89e88','baseCount':1659,'candidateCount':1660,'unchanged':1647,'changed':changed,'added':['release/static/fuentes-respaldo-documental.html'],'removed':[],'allProjectCatalogAndFicheFilesIdentical':True,'sitemapAndRobotsIdentical':True,'taxCtaPreserved':True}
(D/'preservation.json').write_text(json.dumps(preservation,ensure_ascii=False,indent=2));(D/'pages-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2));(D/'changes.patch').write_text(''.join(patch))
with (D/'matrix-source-page.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['reference','title','institution','kind','category','original_url','related_page','retrieval_confirmed','checked_at'])
 for x in refs:
  for page in x['pages']:w.writerow([x['id'],x['titles'][0],x['institution'],x['kind'],x['category'],x['url'],page,x.get('http')==200 or bool(x.get('retrievedViaWeb')),x['checkedAt']])
pending=[x for x in refs if x.get('http')!=200 and not x.get('retrievedViaWeb')]
(D/'pending-sources.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2))
table='\n'.join('| `'+x['page']+'` | '+str(x['references'])+' | '+('Lista centralizada + pie' if x['page'] in ['guia-hipotecaria.html','cuando-comprar-propiedad.html','inversion-inmobiliaria-empresas.html','beneficios-tributarios-inmobiliarios.html'] else 'Solo pie; citas contextuales intactas')+' |' for x in qa)
report='''# Centralización documental corporativa — revisión privada

Fecha de cierre de revisión: 15/11/2026, America/Santiago. No constituye fecha de publicación.

## Estado y procedencia

- Producción inicial comprobada: `dpl_9wtwmxsxawGBf9XGb6yK1hWKUuqC`, SHA `4bea6abcb3fbc663c0f3a559e0086d70a5b977a2`.
- Durante el trabajo se publicó legítimamente el CTA tributario. Producción final comprobada: `dpl_GqikSrihY6ETwsVJtkF6uB6y4Dsw`, SHA `f0e8bd59a9589e7d1b5a737778c6bf4783e89e88`. Se recuperó su manifiesto completo de la rama de publicación y se conservó su HTML, estilos y CTA. El único cambio entre bases era ese HTML.
- Rama independiente: `codex/documental-centralization-20261115`.
- Código final: `00ce536094556338a20c7221c168f4e4e0b6ff8c`.
- Preview READY: `dpl_AqkpTTnQjTmqva3CyEgu3nqjMBEc`.
- [Vista previa](https://project-wrapp-5e04l8qt5-lsandoval2-8260s-projects.vercel.app/fuentes-respaldo-documental.html).
- Target Preview, sin asignación de dominio productivo. El build exige VERCEL_ENV=preview, verifica todos los hashes y copia únicamente el artefacto autorizado. No se promociona este paquete a producción.

## Páginas e implementación

Se auditó la navegación corporativa y sus referencias. Doce páginas existentes cambian; se añade el centro documental. El catálogo y las fichas están excluidos del registro y de cualquier modificación.

| Archivo | Referencias únicas relacionadas | Cambio |
| --- | ---: | --- |
'''+table+'''

Nuevo archivo: `fuentes-respaldo-documental.html`. No se añade ni modifica CSS/JS externo. La nueva página reutiliza la cabecera y pie corporativos y añade estilos aislados en su propio HTML. Los 12 heads existentes son idénticos.

Los cuatro listados extensos se sustituyen por un bloque breve y un enlace a la materia correspondiente. Se mantienen avisos, fechas históricas, notas de cálculo y citas contextuales. Las citas tributarias apuntan a la referencia concreta del centro, con anclas históricas conservadas. Los enlaces por obra de Entorno permanecen junto al contexto geográfico; no se modifica su data ni sus scripts.

En los 12 pies se incorpora una sola entrada documental bajo Legal. En pies planos se agrupan Privacidad y el nuevo enlace; Entorno recibe el grupo Legal con Privacidad. Los demás destinos, contactos y orden relativo permanecen. No se corrigen nomenclaturas ajenas a este encargo.

## Inventario y trazabilidad

140 referencias únicas: 15 de financiamiento, 18 tributarias, 8 empresariales, 8 normativas y 91 de entorno. Se distinguen fuentes públicas, privadas/académicas, cartográficas y colaborativas. No hay categorías vacías.

- `master-references.json`: institución, títulos/etiquetas originales, URL, categoría, tipo, fecha de acceso, vigencia/alcance y todas las ocurrencias.
- `matrix-source-page.csv`: correspondencia de cada fuente con sus páginas.
- `moved.json`: 46 ocurrencias trasladadas desde listados.
- `contextual-retained.json`: 107 ocurrencias contextuales inventariadas; conservadas junto a sus afirmaciones o con destino documental específico.
- `excluded-references.json`: 14 referencias comerciales excluidas deliberadamente del registro central; no eliminadas de la producción original ni editadas en archivos de proyectos.

No se pierde ninguna de las 140 referencias incluidas. El acceso de 132 pudo recuperarse: 126 mediante HTTP y 6 por recuperación web complementaria. Ocho no permitieron confirmar el acceso. Esto no prueba que estén rotas para todos los visitantes. Las pendientes se muestran expresamente en la vista previa y en `pending-sources.json`.

La comprobación de acceso no certifica vigencia jurídica. Se reutilizan las auditorías financieras/tributarias previas, no se reescribe ni se recertifica el contenido. Los documentos urbanos se presentan con alcance histórico; no acreditan avance actual de las obras. La identificación del oficio IND se contrastó con el PDF alojado por la Cámara.

## QA y preservación

- 13 rutas de la vista previa: HTTP 200 y X-Robots-Tag: noindex. Los canonicals existentes se verifican mediante DOM estático; el nuevo apunta a su URL definitiva futura.
- 52 comprobaciones de disposición: 12 HTML existentes y el centro, a 320/390/768/1440 px. Sin desbordamiento horizontal. Se reutilizaron las pruebas de 11 HTML sin cambios entre revisiones; la guía tributaria se repitió tras incorporar el CTA concurrente. Las últimas correcciones de etiquetas/clasificación del centro no cambiaron su CSS ni estructura.
- Menú móvil del centro abierto/cerrado con Enter. Categorías activadas por teclado. Details abiertos/cerrados con Enter, foco visible de 3 px, Tab hacia la fuente original; Shift+Tab en el pie y Enter hacia el centro. Enlace de la guía tributaria llega a #tributacion.
- Sin errores de consola capturados en las pestañas de QA. No se afirma certificación WCAG ni prueba de lector de pantalla.
- Prueba estática estricta de heads, cabeceras, H1, formularios, scripts y contenido ajeno a fuentes/pies: idénticos. Destinos previos del pie preservados. Anclas del centro y de citas válidas, IDs únicos y todos los IDs históricos presentes.
- Calculadoras y formularios conservados por comparación de HTML/scripts y hashes. No se enviaron formularios ni se repitieron sus suites funcionales. El formulario empresarial no fue activado.
- Manifiesto: 1.659 → 1.660 archivos; 1.647 idénticos, 12 HTML modificados, 1 nuevo. Sin eliminaciones. Catálogo, fichas, imágenes, brochures, plantillas, APIs, CRM y recursos comerciales sin cambios.
- Sitemap y robots idénticos por hash. No se añade la nueva URL al sitemap en esta fase.

Evidencias: `pages-qa.json`, `preservation.json`, manifiestos completos, `changes.patch`, `qa-browser-http.json` y capturas. Los documentos de auditoría quedan en GitHub, fuera del artefacto desplegado.

## SEO/GEO

Se mantienen title, description, canonical, H1, JSON-LD y Open Graph de las páginas existentes. El centro tiene metadatos propios y CollectionPage, pero solo está en Preview con noindex HTTP.

Evento independiente: preparación documental de 15/11/2026; todavía sin T0 de publicación. Se conservan corporate-education-v2 (09/11/2026 20:11:23 America/Santiago), corporate-enterprise-v1 (14/11/2026 21:03:45.065) y los registros tributarios existentes. No se modifica atribución, buscadores, sitemap ni robots; no se solicita indexación.

## Pendientes y dictamen

REQUIERE COMPLETAR VERIFICACIÓN DOCUMENTAL ANTES DE PUBLICAR.

La implementación y vista previa están listas para revisión. Quedan ocho accesos externos sin confirmar; no se declara verificado lo que no pudo recuperarse. Antes de una autorización de publicación, resolver o aceptar explícitamente el tratamiento de esas referencias, comprobar otra vez la producción vigente y preparar un paquete publicable independiente. Este artefacto lleva una protección de build exclusiva para Preview.

No se publicó, no se fusionó ningún PR y no se ejecutaron intervenciones de indexación. La revisión visual del usuario y cualquier autorización de publicación siguen pendientes.

### Fuentes con acceso pendiente

'''+''.join('- ['+x['titles'][0]+']('+x['url']+') — '+x['access']+'\n' for x in pending)+'''
### Capturas

![Centro documental en escritorio](docFinalDesktop.png)

![Centro documental móvil](docFinalMobile.png)

![Bloque tributario abreviado](docFinalTax.png)

![Pie corporativo móvil](docFooterMobile.png)
'''
(D/'REVISION.md').write_text(report)
print(json.dumps({'pages':len(qa),'references':len(refs),'pending':len(pending),'changed':len(changed),'preserved':1647,'docBytes':len(report.encode())}))
