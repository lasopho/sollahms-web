"""Shared commercial structure, derived from real published project content.

The current catalogue owns price/state identity; historical brochure records
may enrich descriptive content but never overwrite those commercial fields.
"""
import argparse
import copy
import html
import json
import math
import re
from pathlib import Path
from bs4 import BeautifulSoup
from project_amenities import apply_amenities, render_items

ROOT = Path(__file__).resolve().parents[1]
CSS = '/assets/css/project-navigation.css?v=20261029-1'
JS = '/assets/js/project-navigation.mjs?v=20261029-1'
ESSENTIAL = [('resumen','Resumen'),('caracteristicas','Características'),('galeria','Galería'),('ubicacion','Ubicación'),('solicitar-cotizacion','Cotización')]
PENDING = re.compile(r'^(?:por confirmar|consultar precio|consultar valor|pendiente|no disponible)$',re.I)

def fragment(value):return BeautifulSoup(value,'html.parser')
def text(node):return node.get_text(' ',strip=True) if node else ''
def escape(value):return html.escape(str(value),quote=True)
def price_from(value):
    if not isinstance(value,(int,float)) or isinstance(value,bool) or not math.isfinite(value) or value<=0:
        return 'Desde: consultar precio'
    n=f'{value:,.2f}'.rstrip('0').rstrip('.').replace(',','_').replace('.',',').replace('_','.')
    return 'Desde UF '+n

def section(soup,id_,title):
    node=soup.new_tag('section',attrs={'id':id_,'class':'detail-section pj-block'})
    h=soup.new_tag('h2');h.string=title;node.append(h)
    return node

def demote(node):
    node['class']=[c for c in node.get('class',[]) if c not in ('pj-block','detail-section')]+['jn-subsection']
    for h in node.find_all('h2',recursive=False):h.name='h3'
    for eyebrow in node.find_all('p',class_='eyebrow',recursive=False):eyebrow.decompose()
    return node

def valid_plans(node):
    return bool(node and (node.select('img') or node.select('a[href$=".pdf"]')))

def valid_tour(node):
    if not node:return False
    return any(re.match(r'^https://',x.get('src') or x.get('data-src') or x.get('href') or '')
               for x in node.select('iframe[src],iframe[data-src],a[href]'))

def add_documented_content(soup,project):
    """Source-scoped additions are prepared from audited brochure pointers."""
    path=ROOT/'data/project-content-additions.json'
    if not path.exists():return
    record=json.loads(path.read_text()).get('projects',{}).get(project['slug'])
    if not record:return
    content=soup.select_one('.pj-content')
    for key,title in [('amenities','Equipamiento y áreas comunes'),('finishes','Terminaciones y equipamiento interior'),('architecture','Arquitectura')]:
        rows=record.get(key,[])
        if not rows:continue
        id_={'amenities':'equipamiento','finishes':'terminaciones','architecture':'arquitectura'}[key]
        node=soup.find(id=id_)
        if node and node.get('data-content-source')=='reviewed-brochures-20261029':continue
        if node and node.select('.am-grid'):
            continue  # A richer existing implementation takes precedence.
        node=node or section(soup,id_,title)
        if not node.parent:content.append(node)
        for p in node.select('.missing-note,.pending-panel'):p.decompose()
        node['data-content-source']='reviewed-brochures-20261029'
        scope=record.get('scopeNote') or 'Equipamiento descrito en la documentación del proyecto. Confirma las especificaciones y su alcance para la unidad que cotices.'
        note=soup.new_tag('p',attrs={'class':'jn-source-note'});note.string=scope;node.append(note)
        node.append(fragment(render_items([{'label':r['label'],'description':r.get('description') or ''} for r in rows], 'finishes' if key=='finishes' else 'amenities')).ul)
    if record.get('connectivity') and not soup.find(id='entorno'):
        node=section(soup,'entorno','Entorno y conectividad')
        p=soup.new_tag('p');p.string='Referencias de la documentación del proyecto. Los tiempos de traslado son aproximados y dependen de la ruta.';node.append(p)
        ul=soup.new_tag('ul',attrs={'class':'jn-context-list'})
        for row in record['connectivity']:
            li=soup.new_tag('li');li.string=row['label'];ul.append(li)
        node.append(ul);content.append(node)
    if record.get('plansHtml') and not valid_plans(soup.find(id='planos')):
        pending=soup.find(id='planos-pendientes')
        if pending:pending.decompose()
        content.append(fragment(record['plansHtml']).section)
    return record

def apply_navigation(page,project):
    match=re.search(r'<main\b[^>]*>.*?</main>',page,re.S)
    if not match:raise ValueError('Project main is required: '+project['slug'])
    soup=fragment(match[0]);main=soup.main
    content=main.select_one('.pj-content');hero=main.select_one('.ci-hero')
    if not content or not hero:raise ValueError('Apply the shared B/journey renderer first')
    addition=add_documented_content(soup,project)
    hero['id']='resumen';hero['data-nav-section']='resumen'
    market=hero.select_one('.ci-market')
    if not market:
        market=fragment('<div class="ci-market" data-scroll-static><strong></strong></div>').div
        hero.select_one('.ci-details').insert_after(market)
    if not market.strong:market.append(soup.new_tag('strong'))
    market.strong.clear();market.strong.string=price_from(project.get('precioDesdeUF'))
    market['data-reference-price']=str(project['precioDesdeUF']) if project.get('precioDesdeUF') else ''
    for label in market.select('.price-label'):
        if text(label).casefold() in ('precio desde','desde','precio'):label.decompose()
    delivery=project.get('entrega')
    details=hero.select_one('.ci-details')
    if delivery and str(delivery).casefold() not in text(details).casefold():
        p=soup.new_tag('p');p.string='Entrega informada: '+str(delivery);details.append(p)
    if addition and addition.get('documentedTypologies') and not project.get('tipologias'):
        types=details.select_one('.jn-documented-types') or soup.new_tag('p',attrs={'class':'jn-documented-types'})
        types.string='Tipologías documentadas: '+' · '.join(addition['documentedTypologies'])
        if not types.parent:details.append(types)
    overview=main.find(id='proyecto')
    if overview and hero.select_one('.jn-summary-description'):
        for p in list(overview.find_all('p',recursive=False)):
            if text(p)==text(hero.select_one('.jn-summary-description')):p.decompose()
    if overview and not hero.select_one('.jn-summary-description'):
        description=next((p for p in overview.find_all('p',recursive=False) if 'eyebrow' not in p.get('class',[])),None)
        if description:
            description=description.extract();description['class']=['jn-summary-description']
            hero.select_one('.ci-action').insert_after(description)
    if addition and addition.get('description') and hero.select_one('.jn-summary-description'):
        hero.select_one('.jn-summary-description').string=addition['description']

    # No public inventory; the legacy anchor lands in the quote flow.
    units=main.find(id='unidades')
    if units and units.name!='span':units.decompose()
    contact=main.select_one('.pj-contact');assert contact
    if project['slug']=='plaza-las-condes':
        if not main.find(id='unidades'):
            contact.insert(0,soup.new_tag('span',attrs={'id':'unidades','class':'jn-legacy-target','aria-hidden':'true'}))
        for note in market.select('.price-note'):
            if re.search(r'\bUnidad\s+(?:213|313)\b',text(note),re.I):
                note.string='2 dormitorios · 2 baños. Disponibilidad y condiciones al cotizar.'
        for link in main.select('a[href="#unidades"]'):
            link['href']='#solicitar-cotizacion';link['data-request-intent']='cotizacion';link.string='Solicitar cotización'
        form=contact.select_one('form[data-project-request]')
        if form and not form.find(id='plc-unit-interest'):
            extra=form.find('details') or form.select_one('fieldset')
            field=fragment('<div class="jn-unit-interest"><label for="plc-unit-interest">Unidad de interés (opcional)</label><input id="plc-unit-interest" name="unidadInteres" type="text" maxlength="16" autocomplete="off" aria-describedby="plc-unit-help"><p id="plc-unit-help">Si ya conoces una unidad, puedes indicarla aquí. Su existencia, precio y disponibilidad se confirman al cotizar.</p></div>').div
            extra.append(field)

    features=main.find(id='caracteristicas')
    if not features:
        features=section(soup,'caracteristicas','Características');content.append(features)
    features['data-nav-section']='caracteristicas'
    h=features.find('h2',recursive=False)
    if not h:h=soup.new_tag('h2');features.insert(0,h)
    h.string='Características'
    if not h.get('id'):h['id']='caracteristicas-heading'
    features['aria-labelledby']=h['id']
    features['class']=list(dict.fromkeys([*features.get('class',[]),'jn-features','pj-block','am-section']))
    for eyebrow in features.find_all('p',class_='eyebrow',recursive=False):eyebrow.string='El proyecto en detalle'
    # Remove empty factual rows while keeping substantive qualifiers and notices.
    for dt in list(features.select('dt')):
        dd=dt.find_next_sibling('dd')
        if dd and PENDING.fullmatch(text(dd)) and 'precio' not in text(dt).casefold():
            if dt.parent.name=='div' and len(dt.parent.find_all('dt',recursive=False))==1:dt.parent.decompose()
        elif dd and 'precio desde' in text(dt).casefold():dd.clear();dd.string=price_from(project.get('precioDesdeUF'))
    for child in list(content.find_all(recursive=False)):
        if child is features:continue
        title=text(child.find('h2',recursive=False))
        if child.get('id') in ('equipamiento','terminaciones','arquitectura','detalle-adicional') or title in ('Equipamiento y áreas comunes','Equipamiento y terminaciones'):
            features.append(demote(child.extract()))
    if addition and addition.get('documentedTypologies') and not features.select_one('[data-documentary-types]'):
        dl=features.find('dl',recursive=False)
        if not dl:dl=soup.new_tag('dl',attrs={'class':'spec-grid'});h.insert_after(dl)
        row=soup.new_tag('div',attrs={'data-documentary-types':''});dt=soup.new_tag('dt');dt.string='Tipologías documentadas';dd=soup.new_tag('dd');dd.string=' · '.join(addition['documentedTypologies']);row.extend([dt,dd]);dl.append(row)
    # Every characteristics section contains documented basic project facts.
    if not features.select('dt,.am-item'):
        pairs=[('Inmobiliaria',project['inmobiliaria']),('Ubicación',', '.join(filter(None,[project.get('comuna'),project.get('region')])))]
        if project.get('tipologias'):pairs.append(('Tipologías',' · '.join(project['tipologias'])))
        if project.get('estado'):pairs.append(('Estado',project['estado']))
        dl=fragment('<dl class="spec-grid">'+''.join(f'<div><dt>{escape(k)}</dt><dd>{escape(v)}</dd></div>' for k,v in pairs if v)+'</dl>').dl
        h.insert_after(dl)

    gallery=main.find(id='galeria')
    if not gallery:
        gallery=section(soup,'galeria','Galería');content.append(gallery)
    if not gallery.select('img'):
        source=hero.find('img')
        if source:
            grid=soup.new_tag('div',attrs={'class':'gallery-grid'});figure=soup.new_tag('figure')
            link=soup.new_tag('a',href=source['src'],attrs={'target':'_blank','rel':'noopener noreferrer','aria-label':'Ampliar imagen de '+project['nombre']})
            image=copy.copy(source);image.attrs.pop('id',None);image.attrs.pop('fetchpriority',None);image['loading']='lazy';link.append(image);figure.append(link);grid.append(figure);gallery.append(grid)
        elif not gallery.select('p'):
            p=soup.new_tag('p');p.string='Consulta las imágenes disponibles del proyecto al solicitar información.';gallery.append(p)
    tour=main.find(id='recorrido')
    has_tour=valid_tour(tour)
    if tour and tour.parent is not gallery:gallery.append(demote(tour.extract()))
    gallery['data-nav-section']='galeria'
    if gallery.find('h2',recursive=False):gallery.find('h2',recursive=False).string='Galería y 360°' if has_tour else 'Galería'

    location=main.find(id='ubicacion')
    if not location:
        location=section(soup,'ubicacion','Ubicación')
        p=soup.new_tag('p');p.string=', '.join(filter(None,[project.get('direccion'),project.get('comuna'),project.get('region')])) or 'Consulta la ubicación y el acceso al cotizar.'
        location.append(p);content.append(location)
    location['data-nav-section']='ubicacion'
    if location.find('h2',recursive=False):
        lh=location.find('h2',recursive=False)
        # Preserve the actual address in its paragraph and map, only normalize heading.
        lh.string='Ubicación'

    plan=next((main.find(id=k) for k in ('planos','modelos') if valid_plans(main.find(id=k))),None)
    typology=main.find(id='tipologias')
    offer=main.find(id='oferta-comercial')
    if not typology and offer and len(offer.select('tbody tr, .offer-card, .price-card, .spec-grid > div'))>=2:typology=offer
    if plan:
        plan['data-nav-section']='planos'
        if plan.find('h2',recursive=False):plan.find('h2',recursive=False).string='Planos y tipologías' if plan.get('id')=='modelos' else 'Planos'
    if typology:
        typology['data-nav-section']='tipologias'
        if typology.find('h2',recursive=False):typology.find('h2',recursive=False).string='Tipologías y precios desde'
    environment=main.find(id='entorno')
    if environment:environment['data-nav-section']='entorno'
    order={'proyecto':0,'caracteristicas':1,'tipologias':2,'oferta-comercial':2,'planos':3,'modelos':3,'planos-pendientes':3,'galeria':4,'entorno':5,'contexto-oficial':5,'etapas':5,'ubicacion':6}
    def rank(node):
        if node.name=='a' or 'pj-finance' in node.get('class',[]):return 8
        if node.get('id','').startswith('etapa-'):return 5
        return order.get(node.get('id'),5)
    nodes=[n.extract() for n in list(content.children) if getattr(n,'name',None)]
    for node in sorted(nodes,key=rank):content.append(node)

    links=[('resumen','Resumen'),('caracteristicas','Características')]
    if typology:links.append((typology['id'],'Tipologías'))
    if plan:links.append((plan['id'],'Planos'))
    links.append(('galeria','Galería y 360°' if has_tour else 'Galería'))
    if environment:links.append(('entorno','Entorno'))
    links.extend([('ubicacion','Ubicación'),('solicitar-cotizacion','Cotización')])
    for old in main.select('.pj-nav'):old.decompose()
    nav=fragment('<nav class="section-nav pj-nav" data-project-navigation="1" data-scroll-static aria-label="Secciones del proyecto"><div class="container">'+''.join('<a href="#'+id_+'"'+(' aria-current="location"' if i==0 else '')+'>'+escape(label)+'</a>' for i,(id_,label) in enumerate(links))+'</div></nav>').nav
    hero.insert_after(nav)
    main['data-commercial-journey']='1'
    page=page[:match.start()]+str(main)+page[match.end():]
    if '/assets/css/project-navigation.css' not in page:
        theme=re.search(r'<link\b[^>]*href=["\']/assets/css/sollahms-theme\.css[^>]*>',page)
        assert theme,'Shared theme must remain last'
        page=page[:theme.start()]+f'<link rel="stylesheet" href="{CSS}">\n<script type="module" src="{JS}"></script>\n'+page[theme.start():]
    return page

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    from project_image_labels import apply_image_label_policy
    changed=[]
    for project in json.loads((ROOT/'data/proyectos.json').read_text()):
        path=ROOT/project['detalleUrl'].split('#')[0].lstrip('/');old=path.read_text()
        new=apply_image_label_policy(apply_navigation(apply_amenities(old,project),project))
        if new!=old:
            changed.append(project['slug'])
            if not args.check:path.write_text(new)
    print(json.dumps({'projects':131,'changed':changed},ensure_ascii=False))
    if args.check and changed:raise SystemExit(1)

if __name__=='__main__':main()
