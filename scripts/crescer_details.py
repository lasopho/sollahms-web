"""Crescer brochure enrichment and owner prices. Only the two approved slugs."""
import copy, html, json, re
from pathlib import Path
from collections import defaultdict
from bs4 import BeautifulSoup
import project_amenities
from project_navigation import apply_navigation, price_from
from project_image_labels import apply_image_label_policy

ROOT=Path(__file__).resolve().parents[1]
VERSION='20261029-crescer-1'
def read(path):return json.loads((ROOT/path).read_text())
def write(path,data):(ROOT/path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def fragment(value):return BeautifulSoup(value,'html.parser')
def esc(value):return html.escape(str(value),quote=True)
def typ(n):return 'Estudio' if n==0 else f'{n} dormitorio'+('s' if n!=1 else '')
def dec(value):return str(value).replace('.',',')
def issue_text(issue):return issue['message'] if isinstance(issue,dict) else issue
def offers_for(c):return [{'bedrooms':int(k),'label':typ(int(k)),'priceUF':v} for k,v in c['prices'].items()]
def replace_fact(scope,key,value):
    for dt in scope.find_all('dt'):
        if dt.get_text(strip=True)==key:
            dd=dt.find_next_sibling('dd')
            if dd:dd.string=value
def group_key(models):return '-'.join(str(n) for n in sorted({m['bedrooms'] for m in models if m['filterEligible']}))

def plans_html(slug,facts,media):
    groups=defaultdict(list);targets={}
    for asset in media['plans']:
        page=asset['page'];models=[m for m in facts['models'] if m['page']==page]
        illustrated=asset['kind']=='illustrated'
        key='ilustrados' if illustrated else group_key(models)
        title='Lámina '+str(page)
        body=''
        for model in models:
            conflict=not model['filterEligible']
            label='Distribución por confirmar' if conflict else typ(model['bedrooms'])+f' · {model["bathrooms"]} '+('baño' if model['bathrooms']==1 else 'baños')
            body+=f'<div class="pb-model" data-model-id="{esc(model["id"])}"><h4>{esc(model["label"])}</h4><p>{esc(label)}</p>'
            body+='<p class="pb-note">Referencia documental: '+esc(', '.join(model['referenceNumbers']))+'. No identifica disponibilidad.</p>'
            if conflict:
                body+='<p class="pb-note">El dibujo muestra dos dormitorios y un baño, pero el título indica estudio y las superficies repiten las del plano vecino. Tipología y superficies por confirmar; no se utilizan para comparar superficies.</p>'
            else:
                rows=[('Departamento',model['departmentM2']),('Shaft',model['shaftM2']),('Total departamento',model['departmentTotalM2']),('Superficie interior',model['interiorM2']),('Terraza',model['terraceM2'])]
                body+='<dl>'+''.join(f'<dt>{k}</dt><dd>{dec(v)} m²</dd>' for k,v in rows if v is not None)+'</dl>'
                for issue in model['issues']:
                    if issue.get('code') not in ['explicit_zero_terrace','multiple_references_one_model']:
                        body+='<p class="pb-note">'+esc(issue_text(issue))+'</p>'
            body+='</div>'
        if illustrated:
            item=next(i for i in facts['illustrativePlans'] if i['page']==page)
            title=item['label'];body='<p class="pb-note">Distribución ilustrada sin superficies publicadas ni correspondencia exacta confirmada con los modelos técnicos.</p>'
        thumb=asset['thumbnail']
        card=f'<article class="pb-plan" data-plan-page="{page}"><h3>{esc(title)}</h3><a href="{asset["src"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano de {esc(facts["name"])} — página {page}"><img src="{asset["thumb"]}" alt="{esc(asset["alt"])}" width="{thumb["width"]}" height="{thumb["height"]}" loading="lazy" decoding="async"></a><a class="pj-text-link" href="{asset["src"]}" target="_blank" rel="noopener noreferrer">Ampliar plano ↗</a>{body}</article>'
        groups[key].append(card)
        for m in models:
            if m['filterEligible']:targets.setdefault(m['bedrooms'],'planos-'+key)
    note='Se conserva la denominación «Total departamento» del folleto, con Departamento y Shaft por separado. No equivale a superficie útil o interior; la terraza se muestra aparte.' if slug=='don-tomas' else 'Las superficies interiores y de terraza se muestran por separado. El folleto no publica superficie útil ni un total que incluya la terraza; no se suman.'
    content='<p>Compara las distribuciones documentadas y amplía cada lámina para revisar sus medidas. Las referencias de los planos no constituyen un inventario ni confirman disponibilidad.</p><p class="pb-note">'+note+'</p>'
    if slug=='don-rafael':content+='<p class="pb-note">La tipología de 2 dormitorios y 1 baño está documentada en la presentación del proyecto. Su plano técnico en la lámina 12 tiene datos contradictorios; sus superficies quedan por confirmar.</p>'
    for index,(key,cards) in enumerate(groups.items()):
        label='Distribuciones ilustradas' if key=='ilustrados' else ' / '.join(typ(int(n)) for n in key.split('-'))
        content+=f'<details class="pb-plan-group" id="planos-{key}"'+(' open' if index==0 else '')+f'><summary data-scroll-static>{label} · {len(cards)} '+('lámina' if len(cards)==1 else 'láminas')+'</summary><div class="pb-plans">'+''.join(cards)+'</div></details>'
    content+=f'<a class="pj-text-link" href="/assets/brochures/crescer/{slug}.pdf" target="_blank" rel="noopener noreferrer">Ver folleto original completo ↗</a>'
    return '<section id="planos" class="detail-section pj-block"><p class="eyebrow">Distribuciones documentadas</p><h2>Planos</h2>'+content+'</section>',targets

def apply_crescer(page,project):
    slug=project['slug'];commercials=read('data/crescer-commercial.json')['projects']
    if slug not in commercials:return page
    c=commercials[slug];facts=read('data/crescer-brochures.json')['projects'][slug];media=read('docs/crescer-20261029/asset-manifest.json')['projects'][slug]
    soup=fragment(page);main=soup.main;main['data-project-brochure']=VERSION
    description=main.select_one('.jn-summary-description')
    if not description:
        description=fragment('<p class="jn-summary-description"></p>').p
        main.select_one('.ci-action').insert_after(description)
        old_lead=main.select_one('#proyecto > .lead')
        if old_lead:old_lead.decompose()
    description.string=c['description']
    main.select_one('.ci-details').clear()
    main.select_one('.ci-details').append(fragment('<p>Residencial · '+esc(' · '.join(typ(int(n)) for n in c['prices']))+'</p><p>Entrega informada: Inmediata · En recepción final</p>'))
    note=main.select_one('.ci-market .price-note')
    if note:note.string='Precios por tipología. Disponibilidad e inclusiones por confirmar al cotizar.'
    overview=main.find(id='proyecto')
    for old in overview.select('[data-brochure-content]'):old.decompose()
    overview.find('h2').insert_after(fragment('<p data-brochure-content>'+esc(c['detail'])+'</p>'))
    replace_fact(overview,'Tipologías',' · '.join(project['tipologias']))
    replace_fact(overview,'Equipamiento informado','Gimnasio · Salón multiuso · Quinchos')
    old=main.find(id='planos')
    if old:old.decompose()
    plans,targets=plans_html(slug,facts,media)
    main.select_one('#caracteristicas').insert_after(fragment(plans))
    cards=[]
    for offer in offers_for(c):
        b=offer['bedrooms'];target=targets.get(b,'planos-0' if slug=='don-rafael' else 'planos')
        cards.append(f'<article class="pb-offer"><h3>{offer["label"]}</h3><strong class="pb-price">{price_from(offer["priceUF"],2)}</strong><a class="pj-text-link" href="#{target}" data-brochure-plan-group="{target}">Ver planos</a><a class="button button-green" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-brochure-type="{b}">Solicitar cotización</a></article>')
    overview.append(fragment('<div data-brochure-content><h3>Tipologías y precios desde</h3><div class="pb-offers" data-scroll-static>'+''.join(cards)+'</div><p class="pb-note">Valores proporcionados a Sollahms por tipología. No corresponden a una unidad específica. Disponibilidad, estacionamientos, bodegas e inclusiones se confirman al cotizar.</p></div>'))
    features=main.find(id='caracteristicas');dl=features.find('dl',recursive=False)
    pairs=[('Tipologías documentadas','Estudio · 1D1B · 2D1B'+(' · 2D2B · 3D2B' if slug=='don-tomas' else '')),('Pisos',str(facts['general']['floors']['value'])),('Departamentos',str(facts['general']['apartmentCount']['value'])),('Estado comercial',c['state']),('Entrega informada',c['delivery']),('Precio desde',price_from(c['projectFromUF'],2))]
    dl.clear();dl.append(fragment(''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k,v in pairs)))
    replace_fact(features,'Dirección',c['address'])
    if slug=='don-tomas' and not main.find(id='arquitectura'):
        features.append(fragment('<section id="arquitectura" class="jn-subsection am-section"><h3>Características constructivas</h3><ul class="am-grid" data-amenity-group="finishes"></ul></section>'))
    gallery=main.find(id='galeria');originals=[copy.copy(f) for f in gallery.select('figure') if f.img and '/propiedades/crescer/' not in f.img.get('src','')]
    for a in media['gallery']:
        if a.get('duplicateOfExisting'):continue
        th=a['thumbnail'];originals.append(fragment(f'<figure><a href="{a["src"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar: {esc(a["alt"])}"><span class="s-parallax-frame"><img src="{a["thumb"]}" alt="{esc(a["alt"])}" width="{th["width"]}" height="{th["height"]}" loading="lazy" decoding="async"></span></a></figure>').figure)
    for n in list(gallery.select('.gallery-grid,.pj-disclosure')):n.decompose()
    gallery.append(fragment('<div class="gallery-grid">'+''.join(map(str,originals[:3]))+'</div>'))
    if len(originals)>3:gallery.append(fragment(f'<details class="pj-disclosure"><summary data-scroll-static>Ver {len(originals)-3} imágenes más</summary><div class="gallery-grid">'+''.join(map(str,originals[3:]))+'</div></details>'))
    location=main.find(id='ubicacion');location.select_one('.lead').string=c['address']+', '+c['commune']+', '+c['region']+', Chile'
    for old in location.select('[data-brochure-context]'):old.decompose()
    context='Conectividad hacia Avenida Independencia y el entorno de Metro Conchalí y Vivaceta.' if slug=='don-tomas' else 'Domeyko, esquina O. Edwards. Entorno de Metro Toesca, establecimientos educacionales, universidades, comercio y Parque O’Higgins.'
    location.select_one('.lead').insert_after(fragment('<p data-brochure-context>'+context+'</p>'))
    if not main.find(id='pb-selection'):
        main.find(id='advisory-project-context').insert_after(fragment('<div class="pb-selection" id="pb-selection" data-scroll-static hidden><p id="pb-selected" role="status" aria-live="polite"></p><button type="button" id="pb-clear-selection">Quitar selección de tipología</button></div>'))
    old=main.find(id='project-brochure-data')
    if old:old.decompose()
    record={'slug':slug,'name':project['nombre'],'developer':'Crescer','offers':offers_for(c)}
    main.append(fragment('<script type="application/json" id="project-brochure-data">'+json.dumps(record,ensure_ascii=False).replace('<','\\u003c')+'</script>'))
    page=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:str(main),page,count=1,flags=re.S)
    if '/assets/css/project-brochure.css' not in page:page=page.replace('<link rel="stylesheet" href="/assets/css/sollahms-theme.css',f'<link rel="stylesheet" href="/assets/css/project-brochure.css?v={VERSION}">\n<link rel="stylesheet" href="/assets/css/sollahms-theme.css',1)
    if '/assets/js/project-brochure.mjs' not in page:page=page.replace('</head>',f'<script type="module" src="/assets/js/project-brochure.mjs?v={VERSION}"></script>\n</head>',1)
    page=re.sub(r'(project-request\.mjs\?v=)[^"\s]+',r'\g<1>'+VERSION,page)
    return apply_image_label_policy(apply_navigation(project_amenities.apply_amenities(page,project),project))

def update_all():
    configs=read('data/crescer-commercial.json')['projects'];facts=read('data/crescer-brochures.json')['projects'];projects=read('data/proyectos.json');research=read('data/fichas-proyectos.json');features=read('data/project-features.json')
    for p in projects:
        slug=p['slug']
        if slug not in configs:continue
        c=configs[slug];f=facts[slug];r=next(r for r in research if r['slug']==slug)
        p.update({'precioDesdeUF':c['projectFromUF'],'precioDecimales':2,'preciosPorTipologia':[{'tipologia':o['label'],'precioDesdeUF':o['priceUF']} for o in offers_for(c)],'tipologias':[o['label'] for o in offers_for(c)],'tipoActivo':'Residencial','estado':c['state'],'estadoInformado':c['state'],'entrega':c['delivery'],'direccion':c['address'],'descripcionLarga':c['description']+' '+c['detail'],'commercialSource':{'type':'owner-supplied','file':'data/crescer-commercial.json','date':'2026-10-29'}})
        group=features['projects'][slug]['groups'][0];items=group['items']
        replacements={'Quincho':'Quinchos'} if slug=='don-tomas' else {'Quincho':'Quincho en piso 9','Terraza':'Terraza común en altura'}
        for item in items:
            if item['label'] in replacements:
                item['label']=replacements[item['label']];item['filterEligible']=True;item['exclusionReasons']=[]
        labels=['Estacionamientos de visitas','Escalera vidriada','Patio interior'] if slug=='don-tomas' else ['Estacionamientos de visitas','Terraza común en altura','Quincho en piso 9']
        def newitem(label,scope='project'):
            eligible=bool(project_amenities.entry(label).get('filterIds'))
            return {'label':label,'description':'','filterEligible':eligible,'scope':scope,'exclusionReasons':[] if eligible else ['Atributo documental sin categoría de filtro equivalente.'],'source':{'file':'data/crescer-brochures.json','pointer':'/projects/'+slug,'pages':[2,3]}}
        for label in labels:
            if label not in [i['label'] for i in items]:items.append(newitem(label))
        if slug=='don-tomas':
            features['projects'][slug]['groups']=[group,{'sectionId':'arquitectura','ordinal':0,'kind':'finishes','stageSlug':None,'items':[newitem('Edificio completamente eléctrico'),newitem('Altura interior de 2,4 metros')]}]
        p['amenities']=[i['label'] for i in items]
        verified=['precioDesdeUF','estado','entrega','tipologias','tipoActivo','direccion','amenities','descripcionLarga']
        p['verificacion'].update({'fecha':'2026-10-29','fuentePrecios':'data/crescer-commercial.json','fuentePlanos':'data/crescer-brochures.json','disponibilidad':'Por confirmar; planos documentales'})
        p['verificacion']['camposVerificados']=sorted(set(p['verificacion']['camposVerificados']+verified))
        r['checkedAt']='2026-10-29';r.setdefault('historicalSourceNotes',r['sourceNotes']);r['sourceNotes']='Precios, entrega y estado proporcionados por Sollahms. PDF revisados completos. Superficies con denominación original y sin inferir stock. Ver data/crescer-brochures.json para evidencia y contradicciones.'
        r['verifiedFields']=sorted(set(r['verifiedFields']+verified));r['updates'].update({k:copy.deepcopy(p[k]) for k in verified+['precioDecimales','preciosPorTipologia','estadoInformado','commercialSource']})
        r['brochureModels']=f['models'];r['specs'].update({'dormitorios':' / '.join(p['tipologias']),'banos':'1 a 2' if slug=='don-tomas' else '1','utilM2':None,'totalM2':None})
        r['pendingFields']=['Disponibilidad e inclusiones por unidad','Superficie útil no publicada','Superficie total con terraza no publicada']+c.get('confirmationNotes',[])+[issue_text(i) for m in f['models'] if not m['filterEligible'] for i in m['issues']]
    write('data/proyectos.json',projects);write('data/fichas-proyectos.json',research);write('data/project-features.json',features)
    project_amenities.FEATURE_REGISTRY=features['projects']
    for p in projects:
        if p['slug'] in configs:
            path=ROOT/(p['slug']+'.html');path.write_text(apply_crescer(path.read_text(),p))
if __name__=='__main__':update_all()
