#!/usr/bin/env python3
"""Apply the owner's authorized catalogue to the exact 710a602 production source.

Run once on that baseline. Public output contains no internal remuneration data.
Historical records live only in docs, outside the deployed static allowlist.
"""
import json, re, shutil, html
from pathlib import Path
from urllib.parse import quote_plus
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-25'
DOC = ROOT / 'docs/norte-verde-18-20261026'
DOC.mkdir(parents=True, exist_ok=True)
def read(name): return json.loads((ROOT/name).read_text())
def write(name, value): (ROOT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
def esc(s): return html.escape(str(s), quote=True)
def uf(n):
    return (f'{n:,.0f}' if float(n).is_integer() else f'{n:,.2f}').replace(',', 'X').replace('.', ',').replace('X', '.')

# Authorized commercial values, not an inferred inventory or a live stock feed.
rows = [
 ('edificio-verne','Edificio Verne','Av. Videla 810','Coquimbo','Coquimbo','Inmediata','En recepción final', [('Estudio',1937)]),
 ('edificio-ecuador','Ecuador','Coronel Godoy 0157','Estación Central','Región Metropolitana','Inmediata','En recepción final',[('1 dormitorio',2658.23),('2 dormitorios',3291.14)]),
 ('vicuna-mackenna-6896','Vicuña Mackenna 6896','Vicuña Mackenna 6896','La Florida','Región Metropolitana','Inmediata','En recepción final',[('Estudio',3259.49)]),
 ('playa-serena','Playa Serena','Avenida del Mar 3500','La Serena','Coquimbo','Inmediata','En recepción final',[('1 dormitorio',4222),('2 dormitorios',5878),('3 dormitorios',8065)]),
 ('playa-penuelas','Playa Peñuelas','Av. Peñuelas 118','Coquimbo','Coquimbo','Junio de 2028','En blanco',[('1 dormitorio',3544),('2 dormitorios',4361)]),
 ('irarrazaval','Irarrázaval','Irarrázaval 1970','Ñuñoa','Región Metropolitana','Inmediata','En recepción final',[('Estudio',3589.29)]),
 ('edificio-dual-390-lto','Edificio Dual 390 LTO','Av. Luis Thayer Ojeda 390','Providencia','Región Metropolitana','Noviembre de 2027','En blanco',[('Local',18386.36),('1 dormitorio',7337.21),('2 dormitorios',10232.56)]),
 ('bordevivo','Bordevivo','San Isidro 513','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Local',3318.19)]),
 ('parque-quinta','Parque Quinta','Calle Santo Domingo 3916','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Local',3194.45),('Estudio',3101.27),('1 dormitorio',3164.56)]),
 ('quintavista','Quintavista','Av. Santo Domingo 3810','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Estudio',3417.72)]),
 ('vista-bulnes','Vista Bulnes','Calle Cóndor 1152','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Estudio',3148.10)]),
 ('vergara-domeyko','Vergara Domeyko','Calle Vergara 701','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Local',7587.50)]),
 ('parque-panama','Parque Panamá','Av. Martínez de Rozas 2262','Santiago','Región Metropolitana','Inmediata','En recepción final',[('Local',2575.45)]),
 ('edificio-san-francisco-1204','Edificio San Francisco 1204','Calle San Francisco 1204, esquina Marina de Gaette','Santiago','Región Metropolitana','Enero de 2027','En verde',[('1 dormitorio',3197.67)]),
 ('edificio-lira-622','Edificio Lira 622','Calle Lira 622','Santiago','Región Metropolitana','Mayo de 2027','En blanco',[('Estudio',3372.09),('1 dormitorio',3313.95)]),
 ('edif-origen-atacama-3008','Edificio Origen Atacama','Calle Maipú 1196','Santiago','Región Metropolitana','Marzo de 2028','En verde',[('Estudio',2534.88),('Local',2697.78),('1 dormitorio',2534.88),('2 dormitorios',4360.47)]),
 ('edificio-plaza-nova','Edificio Plaza Nova','Calle Roberto Espinoza 670','Santiago','Región Metropolitana','Segundo semestre de 2028','En verde',[('Estudio',2035.23),('Local',6910.23),('1 dormitorio',3275.14)]),
 ('carmen-marin','Carmen Marín','Calle Carmen 318','Santiago','Región Metropolitana','Segundo semestre de 2029','En blanco',[('Estudio',2932.56),('1 dormitorio',3476.74),('2 dormitorios',4552.33)]),
]
notes = {
 'edificio-verne':['Esta ficha corresponde a la oferta residencial de Verne en Av. Videla 810, Coquimbo. No corresponde a Verne Oficinas.'],
 'playa-penuelas':['La dirección oficial corresponde a Coquimbo. La entrega y el estado informados para esta oferta están pendientes de conciliación: el sitio de Norte Verde señala segundo semestre de 2028 y en verde.'],
 'edificio-dual-390-lto':['La tipología estudio y su precio están pendientes de validación; no se incluyen en los valores publicados ni en el precio destacado. La entrega informada para esta oferta difiere del primer semestre de 2028 indicado en el sitio de Norte Verde.'],
 'parque-quinta':['Se utiliza Santo Domingo 3916, dirección de la ficha oficial y sus bases, en Santiago. La numeración 3902 informada para esta oferta sigue pendiente de conciliación; el brochure también identifica el proyecto en Santo Domingo 3898.'],
 'quintavista':['Santo Domingo 3810 está identificado en el brochure oficial. La ficha y las bases de Norte Verde también identifican el proyecto con el número 3816, comuna de Santiago.'],
 'parque-panama':['Martínez de Rozas 2262 identifica Parque Panamá en la memoria oficial de Norte Verde. La ficha actual utiliza el acceso de Pasaje Delfina 890. Confirma el acceso específico del local al consultar.'],
 'edif-origen-atacama-3008':['Origen Atacama está identificado oficialmente en Maipú 1196. El sufijo «3008» del listado suministrado sigue pendiente de respaldo documental y no se presenta como dirección. La entrega y el estado informados para esta oferta difieren del primer semestre de 2029 y en blanco publicados por Norte Verde.'],
 'edificio-plaza-nova':['Estado informado para esta oferta: en verde. El sitio oficial consultado anteriormente indicaba en blanco; confirmar el avance vigente al cotizar.'],
 'edificio-lira-622':['Estado informado para esta oferta: en blanco. La referencia oficial anterior indicaba en verde; confirmar el avance vigente al cotizar.'],
}
retired = {'atelier-prat-oficinas','corrientes-oficinas'}
projects = read('data/proyectos.json')
assert len(projects)==134
old = {p['slug']:p for p in projects}
assert len([p for p in projects if p['inmobiliaria']=='Norte Verde'])==20
write('docs/norte-verde-18-20261026/baseline-norte-verde.json',[p for p in projects if p['inmobiliaria']=='Norte Verde'])
for slug in retired:
    shutil.move(ROOT/(slug+'.html'),DOC/(slug+'.html'))

updated = {}
for slug,name,address,commune,region,delivery,state,prices in rows:
    p=dict(old[slug]); previous_name=p['nombre']
    local=any(t=='Local' for t,v in prices); residential=any(t!='Local' for t,v in prices)
    asset='Mixto' if local and residential else 'Comercial' if local else 'Residencial'
    cheapest=min(prices,key=lambda x:x[1])
    label='Local comercial' if cheapest[0]=='Local' else cheapest[0]
    detail_url='https://sollahms.cl/'+slug+'.html'
    statement='Precios desde por tipología informados por Sollahms. Confirma disponibilidad, precio y condiciones de la unidad al cotizar.'
    p.update(nombre=name,direccion=address,comuna=commune,region=region,entrega=delivery,estado=state,
             tipoActivo=asset,tiposActivos=(['Residencial','Comercial'] if asset=='Mixto' else [asset]),
             tipologias=[t for t,v in prices],precioDesdeUF=cheapest[1],precioDesdeTipologia=cheapest[0],
             preciosPorTipologia=[{'tipologia':t,'precioDesdeUF':v} for t,v in prices],
             commercialSource={'type':'owner-supplied','verifiedOn':DATE,'url':detail_url+'#oferta-comercial','note':statement},
             observacionesComerciales=notes.get(slug,[]),mapQuery=address+', '+commune+', Chile')
    if asset=='Comercial': p['superficieDesdeM2']=None
    p['descripcionLarga']=f'{name} es un proyecto de Norte Verde en {address}, {commune}. La oferta de Sollahms comprende '+', '.join('local comercial' if t=='Local' else t.lower() for t,v in prices)+'.'
    p['identitySource']=old[slug]['verificacion']['fuente']
    p['verificacion']={'fecha':DATE,'fuente':detail_url+'#oferta-comercial','estadoFuente':'verified','camposVerificados':['nombre','inmobiliaria','comuna','region','precioDesdeUF','tipologias'],'criterio':'Identidad contrastada con Norte Verde; valores comerciales cotejados con el listado autorizado del propietario de Sollahms, sin confirmar stock ni recepción final.'}
    updated[slug]=p
    path=ROOT/(slug+'.html'); text=path.read_text()
    # Preserve layout, scripts, media and embeds; replace only the commercial blocks.
    text=text.replace(previous_name,name)
    text=re.sub(r'<section id="contexto-oficial"[\s\S]*?</section>','',text)
    text=re.sub(r'<div class="hero-badges">[\s\S]*?</div>',f'<div class="hero-badges"><span>{asset}</span><span>{esc(state)}</span></div>',text,count=1)
    text=re.sub(r'<p class="hero-location">.*?</p>',f'<p class="hero-location">{esc(commune)}, {esc(region)}</p>',text,count=1)
    intro=f'<section id="proyecto" class="detail-section"><p class="eyebrow">El proyecto</p><h2>{esc(name)}</h2><p class="lead">{esc(p["descripcionLarga"])}</p></section>'
    text,n=re.subn(r'<section id="proyecto"[\s\S]*?</section>',lambda _:intro,text,count=1);assert n==1,slug
    def item(k,v): return '<div><dt>'+esc(k)+'</dt><dd>'+v+'</dd></div>'
    # Keep documented model surfaces as references, never attribute apartment areas to a local.
    soup=BeautifulSoup(text,'html.parser')
    specs={d.dt.get_text():d.dd.decode_contents() for d in soup.select('#caracteristicas .spec-grid > div')}
    common=[('Inmobiliaria','Norte Verde'),('Tipo de activo',asset),('Comuna',commune),('Región',region),('Dirección',address),('Estado informado',state),('Entrega informada',delivery)]
    spec_html=''.join(item(k,esc(v)) for k,v in common)
    spec_html+=item('Tipologías de la oferta','<br>'.join(esc(t) for t,v in prices))
    for key in ['Superficie útil','Superficie total','Dormitorios','Baños']:
        if asset=='Comercial': val='Por confirmar para el local' if key.startswith('Superficie') else 'No informado para el local'
        else: val=specs.get(key,'Por confirmar')
        spec_html+=item(key+(' · referencia residencial' if asset=='Mixto' else ''),val)
    text,n=re.subn(r'<dl class="spec-grid">[\s\S]*?</dl>',lambda _:'<dl class="spec-grid">'+spec_html+'</dl>',text,count=1);assert n==1
    table='<section id="oferta-comercial" class="detail-section"><p class="eyebrow">Oferta de Sollahms</p><h2>Precios desde por tipología</h2><dl class="spec-grid">'+''.join(item('Local comercial' if t=='Local' else t,'UF '+uf(v)) for t,v in prices)+'</dl><p class="price-note">'+statement+'</p><p class="price-note">Referencia revisada el '+DATE+'. Entrega y estado son campos separados; «en recepción final» no acredita una recepción municipal obtenida.</p>'
    if asset in ['Comercial','Mixto']:
        table+='<p class="price-note">Las fotografías, recorridos, planos y áreas comunes conservados son referencias del proyecto. Confirma qué espacios y superficies corresponden a la unidad o local de interés.</p>'
    if notes.get(slug): table+='<div class="commercial-identity-notice" role="note">'+''.join('<p>'+esc(n)+'</p>' for n in notes[slug])+'</div>'
    table+='</section>'
    text=text.replace('<section id="caracteristicas"',table+'\n        <section id="caracteristicas"',1)
    priceblock=f'<div class="price-block"><span class="price-label">{esc(label)} desde</span><strong>UF {uf(cheapest[1])}</strong><p class="price-note">{statement}</p><a href="#oferta-comercial">Ver precios por tipología</a></div>'
    text,n=re.subn(r'<div class="price-block">[\s\S]*?</div>',lambda _:priceblock,text,count=1);assert n==1
    text=re.sub(r'(<div class="contact-card"><p class="eyebrow">Norte Verde</p><h2>.*?</h2><p>).*?(</p>)',lambda m:m[1]+esc(commune+', '+region)+m[2],text,count=1)
    # Preserve existing embedded map. Verne gets its now documented residential address.
    query=quote_plus(p['mapQuery']);maphtml=f'<div class="project-embed project-embed-map"><iframe src="https://www.google.com/maps?output=embed&amp;q={query}" title="Mapa de {esc(p["mapQuery"])}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen" allowfullscreen data-project-embed="map" data-embed-fallback="https://www.google.com/maps/search/?api=1&amp;query={query}"></iframe></div>'
    loc=f'<section id="ubicacion" class="detail-section"><p class="eyebrow">Ubicación</p><h2>{esc(commune)}</h2><p class="lead">{esc(p["mapQuery"])}</p>{maphtml}</section>'
    text,n=re.subn(r'<section id="ubicacion"[\s\S]*?</section>',lambda _:loc,text,count=1);assert n==1
    if slug=='edificio-verne':
        text=re.sub(r'(<script type="application/json" id="project-embed-hosts">).*?(</script>)',r'\1["www.google.com"]\2',text)
    path.write_text(text)

projects=[updated.get(p['slug'],p) for p in projects if p['slug'] not in retired]
write('data/proyectos.json',projects)
# Retain full pre-update source records outside the public bundle.
for file in ['fichas-proyectos','registro-fichas']:
    data=read('data/'+file+'.json');write('docs/norte-verde-18-20261026/baseline-'+file+'.json',[r for r in data if r['slug'] in updated or r['slug'] in retired])
    data=[r for r in data if r['slug'] not in retired]
    for r in data:
        if r['slug'] not in updated: continue
        p=updated[r['slug']]
        if file=='fichas-proyectos':
            r['updates']={k:p[k] for k in ['nombre','inmobiliaria','comuna','region','direccion','mapQuery','precioDesdeUF','estado','entrega','tipologias','amenities','superficieDesdeM2','descripcionLarga','tipoActivo','preciosPorTipologia']}
            r.update(commercialSource=p['commercialSource'],commercialNotes=p['observacionesComerciales'])
            if p['tipoActivo']=='Comercial': r['specs']={k:None for k in r.get('specs',{})}
        else:
            r['nombre']=p['nombre'];r['ofertaComercialRevisada']=DATE
    write('data/'+file+'.json',data)
advisory=read('data/advisory-projects.json')
for slug in retired: advisory.pop(slug,None)
for slug,p in updated.items(): advisory[slug]=p['nombre']
write('data/advisory-projects.json',advisory)
path=ROOT/'lib/project-context.mjs';text=path.read_text()
for slug in retired: text,n=re.subn(r'  "'+slug+r'": \{[\s\S]*?\n  \},?\n','',text);assert n==1
for slug,p in updated.items():
    text,n=re.subn(r'("'+slug+r'": \{\s*"name": )"[^"]*"',lambda m:m[1]+json.dumps(p['nombre'],ensure_ascii=False),text);assert n==1
path.write_text(text)
path=ROOT/'sitemap.xml';text=path.read_text()
for slug in retired: text=re.sub(r'  <url><loc>https://sollahms.cl/'+slug+r'.html</loc></url>\n','',text)
path.write_text(text)
path=ROOT/'proyectos.html';text=path.read_text()
for slug in retired: text=re.sub(r'    <li><a href="/'+slug+r'.html">.*?</a></li>\n','',text)
for slug,p in updated.items():text=re.sub(r'(<li><a href="/'+slug+r'.html">).*?(</a></li>)',lambda m:m[1]+esc(p['nombre'])+m[2],text)
text=text.replace(", 'edificio-verne'].includes(project.slug)","].includes(project.slug)")
text=text.replace("project.slug === 'edificio-verne'\n                ? 'La oferta residencial vigente sigue sin confirmar. Verne Oficinas se presenta por separado como alternativa comercial.'\n                : ","")
text=text.replace('<option value="Comercial">Comercial</option>','<option value="Comercial">Comercial</option>\n<option value="Mixto">Mixto</option>')
text=text.replace("(project.tipoActivo ?? 'Por confirmar') === assetType.value","((project.tiposActivos ?? [project.tipoActivo]).includes(assetType.value) || project.tipoActivo === assetType.value)")
text=text.replace("project.tipologias.forEach(value => list.append(element('li', value, 'text-sm text-secondary')));","project.tipologias.forEach(value => {\n                const price = project.preciosPorTipologia?.find(row => row.tipologia === value);\n                const amount = price ? new Intl.NumberFormat('es-CL', {minimumFractionDigits: Number.isInteger(price.precioDesdeUF) ? 0 : 2, maximumFractionDigits: 2}).format(price.precioDesdeUF) : '';\n                list.append(element('li', value + (price ? ': desde UF ' + amount : ''), 'text-sm text-secondary'));\n            });")
text=text.replace("'Desde UF ' + numberFormat.format(project.precioDesdeUF)","(project.precioDesdeTipologia ? (project.precioDesdeTipologia === 'Local' ? 'Local comercial' : project.precioDesdeTipologia) + ' desde UF ' : 'Desde UF ') + (project.preciosPorTipologia ? new Intl.NumberFormat('es-CL', {minimumFractionDigits: Number.isInteger(project.precioDesdeUF) ? 0 : 2, maximumFractionDigits: 2}).format(project.precioDesdeUF) : numberFormat.format(project.precioDesdeUF))")
text=text.replace("if (project.estado != null) detail('Estado', project.estado);","if (project.tipoActivo && project.preciosPorTipologia) detail('Tipo de oferta', project.tipoActivo);\n        if (project.estado != null) detail(project.preciosPorTipologia ? 'Estado informado' : 'Estado', project.estado);")
text=text.replace("if (project.entrega != null) detail('Entrega', project.entrega);","if (project.entrega != null) detail(project.preciosPorTipologia ? 'Entrega informada' : 'Entrega', project.entrega);")
path.write_text(text)
config=read('vercel.json');config['git']['deploymentEnabled']['codex/norte-verde-18-20261025']=False;write('vercel.json',config)
# Count guard still rejects unexpected identities; never change other developers.
path=ROOT/'lib/public-project-view.mjs';text=path.read_text().replace('!== 134','!== 132').replace('current 134 routes','current 132 routes').replace("'box-santiago']","'box-santiago', 'atelier-prat-oficinas', 'corrientes-oficinas']");path.write_text(text)
write('docs/norte-verde-18-20261026/decision-register.json',{'date':DATE,'baseCommit':'710a60262004ccbc524b7dfb8cc75866d9e01f08','rollbackDeployment':'dpl_31y1i14ip3X7n1bufX4YchkBawfJ','active':list(updated),'retired':sorted(retired),'notes':notes,'withheld':[{'slug':'edificio-dual-390-lto','typology':'Estudio','ownerAmountUf':1877.27,'reason':'Official project and brochure identify 1- and 2-bedroom apartments; correspondence of this amount to a residential studio is unverified.'}],'retiredHttpStatus':404})
print(json.dumps({'total':len(projects),'norteVerde':len(updated),'retired':sorted(retired)},ensure_ascii=False))
