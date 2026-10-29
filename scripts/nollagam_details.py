"""Owner-supplied Nollagam prices and complete brochure facts; seven slugs only."""
import json,re,html,copy
from pathlib import Path
from collections import defaultdict
from bs4 import BeautifulSoup
from project_image_labels import apply_image_label_policy
from project_amenities import apply_amenities
ROOT=Path(__file__).resolve().parents[1]
CSS='/assets/css/nollagam-detail.css?v=20261028-1'
JS='/assets/js/nollagam-detail.mjs?v=20261028-1'
esc=lambda x:html.escape(str(x),quote=True)
def read(name):return json.loads((ROOT/name).read_text())
def write(name,data):(ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def dec(x):return str(x).replace('.',',')
def uf(x):return f'{x:,}'.replace(',','.')
def typ(b):return 'Estudio' if b==0 else '1 dormitorio' if b==1 else f'{b} dormitorios'
def section(id,eye,title,body):return f'<section id="{id}" class="detail-section pj-block"><p class="eyebrow">{eye}</p><h2>{title}</h2>{body}</section>'
def fragment(s):return BeautifulSoup(s,'html.parser')
def offers_for(facts,commercial):
    result=[]
    for b in sorted(set(m['beds'] for m in facts['models'])):
        models=[m for m in facts['models'] if m['beds']==b]
        baths=sorted(set(m['baths'] for m in models if m['baths'] is not None))
        total=min((m['total'] for m in models if m['total'] is not None and not m['issues']),key=float,default=None)
        result.append({'bedrooms':b,'label':typ(b),'priceUF':commercial['prices'].get(str(b)),'bathrooms':baths,'minDocumentedTotalM2':total})
    return sorted(result,key=lambda o:(o['priceUF'] is None,o['bedrooms']))

def plan_cards(facts,media,commercial):
    pages=defaultdict(list)
    for m in facts['models']:pages[m['page']].append(m)
    groups=defaultdict(list)
    for page,models in pages.items():
        asset=next(x for x in media['plans'] if x['page']==page)
        title='Modelo '+models[0]['name'];b=models[0]['beds'];bath=models[0]['baths']
        bh=typ(b)+(f' · {bath} '+('baño' if bath==1 else 'baños') if bath is not None else '')
        variants=[]
        for m in models:
            rows=[(m['interior_label'],m['interior'])]
            if m.get('terraces'):rows += [(x['name'],x['area']) for x in m['terraces']]
            elif m['terrace'] is not None:rows.append(('Terraza',m['terrace']))
            rows.append(('Superficie total',m['total']))
            if m['garden'] is not None:rows.append(('Jardín privado (separado del total)',m['garden']))
            ref='Numeración del plano: '+m['units'] if m['units'] else ''
            if m['floors']:ref+=' · Pisos '+m['floors']
            notes=''.join(f'<p class="ng-note">{esc(i)}</p>' for i in m['issues'])
            variants.append(f'<div class="ng-variant" data-model-id="{m["id"]}"><p class="ng-model-ref">{esc(ref)}</p><dl>'+''.join(f'<dt>{esc(k)}</dt><dd>{dec(v)} m²</dd>' for k,v in rows if v is not None)+f'</dl>{notes}</div>')
        groups[b].append(f'<article class="ng-plan" data-plan-page="{page}"><h3>{esc(title)}</h3><p>{bh}</p><a class="ng-plan-image" href="{asset["src"]}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano {esc(models[0]["name"])} de {esc(facts["name"])} — página {page}"><img src="{asset["thumb"]}" alt="Plano {esc(models[0]["name"])} de {esc(facts["name"])}. Lámina {page} completa con distribución y medidas." width="{asset["thumbWidth"]}" height="{asset["thumbHeight"]}" loading="lazy" decoding="async"></a><a class="pj-text-link" href="{asset["src"]}" target="_blank" rel="noopener noreferrer">Ampliar plano ↗</a>'+''.join(variants)+'</article>')
    content='<p>Explora las distribuciones y compara sus superficies exactas. La numeración identifica modelos del plano; no acredita unidades disponibles. Los jardines se muestran por separado.</p>'
    content+='<p class="ng-note">Disponibilidad por confirmar al cotizar. Los sellos «AGOTADO» de algunas láminas pertenecen al documento original y no representan el stock vigente. Se conservan los valores impresos; las diferencias detectadas se indican junto al modelo.</p>'
    for b,cards in sorted(groups.items()):
        content+=f'<details class="ng-plan-group" id="planos-{b}"'+(' open' if b==min(map(int,commercial['prices'])) else '')+f'><summary data-scroll-static>{typ(b)} · {len(cards)} '+('plano' if len(cards)==1 else 'planos')+'</summary><div class="ng-plan-grid">'+''.join(cards)+'</div></details>'
    return section('planos','Distribuciones y superficies','Encuentra tu distribución',content)

def apply_nollagam(page,project):
    slug=project['slug'];commercials=read('data/nollagam-commercial.json')['projects']
    if slug not in commercials:return page
    c=commercials[slug];facts=read('data/nollagam-brochures.json')['projects'][slug];media=read('data/nollagam-media.json')['projects'][slug]
    offers=offers_for(facts,c);price=min(c['prices'].values());soup=BeautifulSoup(page,'html.parser');main=soup.main
    main['data-nollagam-detail']='20261028-1'
    # Preserve existing B composition and approved shared motion owners.
    main.select_one('.ci-market strong').string='UF '+uf(price)
    main.select_one('.ci-market .price-note').string='Valores por tipología. Confirma unidad, disponibilidad e inclusiones al solicitar tu cotización.'
    main.select_one('.ci-details').clear()
    main.select_one('.ci-details').append(fragment('<p>Residencial · '+esc(', '.join(o['label'] for o in offers))+'</p><p>'+esc(('En blanco · '+c['delivery']) if c.get('building') else 'Entrega inmediata · En recepción final')+'</p>'))
    cover=media['cover'];img=main.select_one('.ci-visual img')
    for key,val in {'src':cover['src'],'alt':cover['alt'],'width':cover['width'],'height':cover['height']}.items():img[key]=str(val)
    img.attrs.pop('srcset',None)
    # Add facts to the current overview, retaining its established summary layout.
    overview=main.select_one('#proyecto');lead=overview.select_one('.lead')
    if lead:lead.string=c['description']
    detail=overview.select_one('[data-nollagam-description]')
    if detail:detail.decompose()
    if lead:lead.insert_after(fragment('<p data-nollagam-description>'+esc(c['detail'])+'</p>'))
    totals=[float(m['total']) for m in facts['models'] if m['total'] is not None]
    totalrange=dec(f'{min(totals):.2f}')+' a '+dec(f'{max(totals):.2f}')+' m²'
    def replace_fact(scope,key,val):
        for dt in scope.find_all('dt'):
            if dt.get_text(strip=True)==key:
                dd=dt.find_next_sibling('dd')
                if dd:dd.clear();dd.append(fragment(esc(val)))
    replace_fact(overview,'Tipologías',' · '.join(o['label'] for o in offers));replace_fact(overview,'Superficie total',totalrange)
    old=main.select_one('#tipologias')
    if old:old.decompose()
    cards=[]
    for o in offers:
        b=o['bedrooms'];bath=' o '.join(map(str,o['bathrooms']))+' baños' if len(o['bathrooms'])>1 else (str(o['bathrooms'][0])+' '+('baño' if o['bathrooms'][0]==1 else 'baños') if o['bathrooms'] else 'Baños según plano')
        area=f'<p>Modelos desde {dec(o["minDocumentedTotalM2"])} m² totales</p>' if o['minDocumentedTotalM2'] else ''
        value='Desde UF '+uf(o['priceUF']) if o['priceUF'] else 'Consultar valor'
        cards.append(f'<article class="ng-type"><h3>{o["label"]}</h3><p>{bath}</p>{area}<strong class="ng-price">{value}</strong><a class="pj-text-link" href="#planos-{b}" data-open-plan-group="{b}">Ver planos</a><a class="button button-green" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-nollagam-type="{b}" aria-label="Solicitar cotización de {o["label"]}">Solicitar cotización</a></article>')
    overview.insert_after(fragment(section('tipologias','Opciones para comparar','Tipologías y valores','<div class="ng-types" data-scroll-static>'+''.join(cards)+'</div><p class="ng-note">Valores desde por tipología proporcionados a Sollahms. La superficie desde corresponde a los modelos documentados y no identifica la unidad asociada al precio. Disponibilidad, estacionamientos, bodegas e inclusiones se confirman al cotizar.</p>')))
    old=main.select_one('#planos')
    if old:old.decompose()
    main.select_one('#tipologias').insert_after(fragment(plan_cards(facts,media,c)))
    gallery=main.select_one('#galeria')
    # Retain existing verified photos; use source identity and visual duplicate audit.
    originals=[]
    for f in gallery.select('figure'):
        if f.img and not '/nollagam-20261028/' in f.img.get('src',''): originals.append(copy.copy(f))
    images=[]
    for a in media['gallery']:
        if a.get('duplicateOfExisting'):continue
        images.append(fragment(f'<figure><a href="{a["src"]}" target="_blank" rel="noopener noreferrer"><span class="s-parallax-frame"><img src="{a["src"]}" alt="{esc(a["alt"])}" width="{a["width"]}" height="{a["height"]}" loading="lazy" decoding="async"></span></a><figcaption>{esc(a["caption"])}</figcaption></figure>').figure)
    figures=images+originals
    for node in list(gallery.select('.gallery-grid,.pj-disclosure')):node.decompose()
    gallery.append(fragment('<div class="gallery-grid">'+''.join(map(str,figures[:3]))+'</div>'))
    if len(figures)>3:gallery.append(fragment(f'<details class="pj-disclosure"><summary data-scroll-static>Ver {len(figures)-3} imágenes más</summary><div class="gallery-grid">'+''.join(map(str,figures[3:]))+'</div></details>'))
    details=main.select_one('#caracteristicas')
    replace_fact(details,'Estado','En blanco' if c.get('building') else 'En recepción final')
    replace_fact(details,'Entrega',c.get('delivery','Inmediata'))
    for dt in details.find_all('dt'):
        if dt.get_text(strip=True)=='Tipologías disponibles':dt.string='Tipologías documentadas'
    replace_fact(details,'Tipologías documentadas',' · '.join(o['label'] for o in offers))
    replace_fact(details,'Superficie total',totalrange)
    replace_fact(details,'Precio desde','UF '+uf(price))
    replace_fact(details,'Dormitorios',', '.join(o['label'] for o in offers))
    replace_fact(details,'Baños','1 o 2, según modelo')
    interiors=[float(m['interior']) for m in facts['models'] if m['interior'] is not None]
    newlabel=facts['interior_label']
    for dt in details.find_all('dt'):
        if dt.get_text(strip=True)=='Superficie útil':dt.string=newlabel
    replace_fact(details,newlabel,dec(f'{min(interiors):.2f}')+' a '+dec(f'{max(interiors):.2f}')+' m², según plano')
    equip=main.select_one('#equipamiento')
    if not equip:
        details.insert_after(fragment(section('equipamiento','Vida cotidiana','Equipamiento del proyecto','<ul class="amenity-list"></ul>')));equip=main.select_one('#equipamiento')
    if not equip.select_one('ul'):
        for node in list(equip.select('.pending')):node.decompose()
        equip.append(fragment('<ul class="amenity-list"></ul>'))
    for node in list(equip.select('.pending-panel')):node.decompose()
    if slug=='alto-goycolea':
        for node in list(equip.select('li')):
            if node.get_text(strip=True) in ['Quinchos','Salones multiuso']:node.decompose()
    existing=[x.get_text(strip=True) for x in equip.select('li')]
    for item in c['extraAmenities']:
        if item not in existing:equip.select_one('ul').append(fragment('<li>'+esc(item)+'</li>'))
    old=main.select_one('#terminaciones')
    if old:old.decompose()
    equip.insert_after(fragment(section('terminaciones','Dentro de tu departamento','Terminaciones y equipamiento interior','<ul class="amenity-list">'+''.join('<li>'+esc(x)+'</li>' for x in c['finishes'])+'</ul><p class="ng-note">Confirma las especificaciones e inclusiones de la unidad al cotizar.</p>')))
    # Add links without losing existing tour/navigation targets.
    nav=main.select_one('.pj-nav .container')
    for target,label in [('tipologias','Tipologías y valores'),('planos','Planos')]:
        if not nav.select_one(f'a[href="#{target}"]'):nav.select_one('a[href="#galeria"]').insert_before(fragment(f'<a href="#{target}">{label}</a>'))
    if not main.select_one('#nollagam-selection'):
        main.select_one('#advisory-project-context').insert_after(fragment('<div class="ng-selection" id="nollagam-selection" data-scroll-static hidden><p id="nollagam-selected" role="status" aria-live="polite"></p><button type="button" id="nollagam-clear">Quitar selección de tipología</button></div>'))
    if main.select_one('#nollagam-commercial'):main.select_one('#nollagam-commercial').decompose()
    record={'slug':slug,'name':project['nombre'],'building':c.get('building'),'offers':offers}
    main.append(fragment('<script type="application/json" id="nollagam-commercial">'+json.dumps(record,ensure_ascii=False).replace('<','\\u003c')+'</script>'))
    page=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:str(main),page,count=1,flags=re.S)
    if CSS not in page:page=page.replace('<link rel="stylesheet" href="/assets/css/sollahms-theme.css',f'<link rel="stylesheet" href="{CSS}">\n<link rel="stylesheet" href="/assets/css/sollahms-theme.css',1)
    if JS not in page:page=page.replace('</head>',f'<script type="module" src="{JS}"></script>\n</head>',1)
    return apply_image_label_policy(apply_amenities(page, project))

def update_all():
    configs=read('data/nollagam-commercial.json')['projects'];facts=read('data/nollagam-brochures.json')['projects'];media=read('data/nollagam-media.json')['projects']
    projects=read('data/proyectos.json');research=read('data/fichas-proyectos.json');overrides=read('data/project-cover-overrides.json')
    for project in projects:
        slug=project['slug']
        if slug not in configs:continue
        c=configs[slug];f=facts[slug];m=media[slug];offers=offers_for(f,c)
        project.update({'precioDesdeUF':min(c['prices'].values()),'preciosPorTipologia':[{'tipologia':o['label'],'precioDesdeUF':o['priceUF']} for o in offers], 'tipologias':[o['label'] for o in offers], 'estado':'En blanco' if c.get('building') else 'Entrega inmediata','estadoInformado':'En blanco' if c.get('building') else 'En recepción final','entrega':c.get('delivery','Inmediata'),'descripcionLarga':c['description']+' '+c['detail'], 'imagenPrincipal':m['cover']['src'],'imagenAlt':m['cover']['alt'],'superficieDesdeM2':min(float(x['total']) for x in f['models'] if x['total'] is not None and not x['issues'])})
        existing_amenities=project.get('amenities',[])
        if slug=='alto-goycolea':existing_amenities=[x for x in existing_amenities if x not in ['Quinchos','Salones multiuso']]
        project['amenities']=list(dict.fromkeys(existing_amenities+c['extraAmenities']))
        project['verificacion'].update({'fecha':'2026-10-28','fuentePrecios':'data/nollagam-commercial.json','fuentePlanos':'data/nollagam-brochures.json','disponibilidad':'Por confirmar; planos documentales'})
        r=next(r for r in research if r['slug']==slug);r['checkedAt']='2026-10-28';r['sourceNotes']='Precios y estados proporcionados por Sollahms. Modelos y superficies exactos de los brochures, sin deducir stock de sellos históricos. Equipamiento y terminaciones contrastados en la ficha oficial. Ver data/nollagam-brochures.json para discrepancias.'
        r['updates'].update({k:copy.deepcopy(project[k]) for k in ['precioDesdeUF','tipologias','estado','entrega','descripcionLarga','amenities','superficieDesdeM2','preciosPorTipologia','estadoInformado']})
        r['brochureModels']=f['models'];r['pendingFields']=['Disponibilidad actual por unidad', 'Inclusiones y condiciones por unidad']+[i for model in f['models'] for i in model['issues']]
        r['specs']['dormitorios']=' / '.join(o['label'] for o in offers);r['specs']['banos']='1 a 2'
        totals=[float(x['total']) for x in f['models'] if x['total'] is not None];r['specs']['totalM2']=dec(f'{min(totals):.2f}')+' a '+dec(f'{max(totals):.2f}')
        if f['interior_label']=='Superficie útil':
            vals=[float(x['interior']) for x in f['models'] if x['interior'] is not None];r['specs']['utilM2']=dec(f'{min(vals):.2f}')+' a '+dec(f'{max(vals):.2f}')
        cover=m['cover'];overrides[slug]={'slug':slug,'path':cover['src'],'alt':cover['alt'],'width':cover['width'],'height':cover['height'],'source':'data/nollagam-media.json','previousCover':overrides.get(slug,{}).get('previousCover',next((i['localPath'] for i in r['images'] if i.get('localPath')),None))}
        path=ROOT/(slug+'.html');path.write_text(apply_nollagam(path.read_text(),project))
    write('data/proyectos.json',projects);write('data/fichas-proyectos.json',research);write('data/project-cover-overrides.json',overrides)

if __name__=='__main__':update_all()
