"""Reorder verified project content without regenerating commercial data/media.

The B hero is retained. Each original content node is moved, not rewritten;
only navigation, summaries, disclosure and the existing contact flow are added.
"""
import copy
import html
import json
import re
from pathlib import Path
from string import Template
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
STYLE = '/assets/css/project-journey.css?v=20261026-1'
SCRIPT = '/assets/js/project-request.mjs?v=20261026-rut-1'
UNKNOWN = re.compile(r'confirmar|consultar|pendiente|no disponible', re.I)

def fragment(value):
    return BeautifulSoup(value, 'html.parser')

def text(node):
    return node.get_text(' ', strip=True) if node else ''

def summary_pairs(project, soup):
    verified = set(project.get('verificacion', {}).get('camposVerificados', []))
    result = []
    if 'tipologias' in verified and project.get('tipologias'):
        result.append(('Tipologías', ' · '.join('Local comercial' if t == 'Local' else t for t in project['tipologias'])))
    if 'comuna' in verified and project.get('comuna'):
        result.append(('Ubicación', project['comuna']))
    for dt in soup.select('#caracteristicas dt'):
        label, value = text(dt), text(dt.find_next_sibling('dd'))
        if label.startswith('Superficie') and value and not UNKNOWN.search(value):
            # Reuse the published qualification, including useful/total/unknown
            # classification; never promote a brochure area to confirmed stock.
            if 'superficieDesdeM2' in verified or any(k in verified for k in ['utilM2','totalM2']):
                result.append((label, value)); break
    if len(result) < 4 and 'amenities' in verified and project.get('amenities'):
        result.append(('Equipamiento informado', ' · '.join(project['amenities'][:2])))
    if len(result) < 3 and 'inmobiliaria' in verified:
        result.append(('Inmobiliaria', project['inmobiliaria']))
    return result[:4]

def disclosure_grid(soup, grid, keep, noun):
    figures = grid.find_all('figure', recursive=False)
    if len(figures) <= keep:
        return
    more = soup.new_tag('details', attrs={'class':'pj-disclosure'})
    summary = soup.new_tag('summary', attrs={'data-scroll-static':''})
    count = len(figures)-keep
    label = {'imágenes':'imagen','planos':'plano'}.get(noun,noun) if count == 1 else noun
    summary.string = f'Ver {count} {label} más'
    more.append(summary)
    rest = soup.new_tag('div', attrs={'class':grid.get('class', [])})
    for figure in figures[keep:]:
        rest.append(figure.extract())
    more.append(rest); grid.insert_after(more)

def apply_project_journey(page, project):
    if 'data-project-journey="1"' in page:
        return page
    # Serialize only main: head metadata and all surrounding page code stay exact.
    match = re.search(r'<main\b[^>]*>.*?</main>', page, re.S)
    assert match, project['slug']
    soup = fragment(match[0]); main = soup.main
    main['data-project-journey'] = '1'
    hero = main.select_one('.ci-hero'); assert hero and hero.h1, project['slug']
    before_images = [(i.get('src'),i.get('srcset'),i.get('alt')) for i in main.select('img')]
    before_frames = [(i.get('src'),i.get('title')) for i in main.select('iframe')]
    pairs = summary_pairs(project, main)
    aside = main.select_one('aside'); assert aside, project['slug']
    mortgage = next((copy.copy(a) for a in aside.select('a[href]') if a['href'].startswith('/comparador-hipotecario.html')), None)
    # Move the exact existing price and qualifications to the first view.
    price = aside.select_one('.price-block')
    if price:
        price = price.extract(); price['class'] = ['ci-market']
    else:
        label = next((n for n in aside.select('div') if text(n) == 'Precio desde'), None)
        assert label, project['slug']
        value = label.find_next_sibling('div')
        price = fragment('<div class="ci-market"><span class="price-label">Precio desde</span><strong>'+html.escape(text(value))+'</strong></div>').div
        note = aside.select_one('.price-commercial-note')
        if note:
            note = note.extract();note['class']=['price-note'];price.append(note)
    price['data-scroll-static'] = ''
    hero.select_one('.ci-details').insert_after(price)
    # Delivery is separate from state and retains the wording already published.
    delivery = project.get('entrega')
    if delivery and not UNKNOWN.search(str(delivery)) and str(delivery).lower() not in text(hero.select_one('.ci-details')).lower():
        found = next((dt for dt in main.select('#caracteristicas dt') if text(dt)=='Entrega'),None)
        published = text(found.find_next_sibling('dd')) if found else str(delivery) if str(delivery) in text(main) else ''
        if published and not UNKNOWN.search(published):
            p=soup.new_tag('p');p.string='Entrega informada: '+published;hero.select_one('.ci-details').append(p)
    action = hero.select_one('.ci-action'); action.clear();action['data-scroll-static']=''
    action.append(fragment('<a class="button ci-advisory" href="#solicitar-cotizacion" data-request-intent="cotizacion">Solicitar cotización <span aria-hidden="true">↗</span></a><a class="pj-call" href="#solicitar-cotizacion" data-request-intent="llamada">Quiero que me llamen</a>'))
    body = main.select_one('.project-body')
    featured = body is None
    if featured:
        body = main.select_one('#proyecto').parent
    nodes = [e.extract() for e in list(body.children) if getattr(e,'name',None)]
    # Split the featured gallery from its following factual block, preserving IDs.
    expanded=[]
    for node in nodes:
        if node.get('id')=='detalle-adicional':
            gallery_h=node.find(id='galeria'); assert gallery_h
            gallery=soup.new_tag('section',attrs={'id':'galeria','class':'detail-section'})
            gallery_h.attrs.pop('id',None)
            for child in list(node.children):
                if getattr(child,'name',None)=='h2' and child is not gallery_h and text(child)!='Galería oficial':break
                gallery.append(child.extract())
            expanded.append(gallery)
            if text(node):expanded.append(node)
        else:expanded.append(node)
    nodes=expanded
    intro=next(n for n in nodes if n.get('id')=='proyecto')
    intro['class']=list(intro.get('class',[]))+['pj-overview']
    if intro.h2:intro.h2.string='Una mirada al proyecto'
    if pairs:
        summary=soup.new_tag('dl',attrs={'class':'spec-grid pj-summary'})
        for label,value in pairs:
            item=soup.new_tag('div');dt=soup.new_tag('dt');dt.string=label;dd=soup.new_tag('dd');dd.string=value;item.extend([dt,dd]);summary.append(item)
        intro.append(summary)
    intro.append(fragment('<a class="pj-text-link" href="#caracteristicas">Ver detalles <span aria-hidden="true">↓</span></a>'))
    for node in nodes:
        if node.get('id')=='caracteristicas':
            if node.h2:node.h2.string='Detalles para comparar'
            grid=node.select_one('.spec-grid')
            if grid:
                secondary=[d for d in grid.find_all('div',recursive=False) if text(d.dt) in ['Inmobiliaria','Tipo de activo','Comuna','Región','Dirección']]
                if secondary:
                    extra=soup.new_tag('details',attrs={'class':'pj-disclosure'})
                    title=soup.new_tag('summary',attrs={'data-scroll-static':''});title.string='Más información del proyecto';extra.append(title)
                    rest=soup.new_tag('dl',attrs={'class':'spec-grid'})
                    for d in secondary:rest.append(d.extract())
                    extra.append(rest);grid.insert_after(extra)
        for grid in list(node.select('.gallery-grid,.featured-gallery')):
            disclosure_grid(soup,grid,3,'imágenes')
        for grid in list(node.select('.brochure-plan-grid')):
            disclosure_grid(soup,grid,3,'planos')
    # All non-empty original blocks/anchors are retained, including stage records.
    order={'proyecto':0,'galeria':1,'planos':2,'modelos':2,'planos-pendientes':2,'recorrido':3,'oferta-comercial':4,'caracteristicas':5,'detalle-adicional':6,'equipamiento':7,'contexto-oficial':8,'etapas':9,'ubicacion':10}
    def rank(n):
        if n.name=='a':return 12
        if n.get('id','').startswith('etapa-'):return 9
        return order.get(n.get('id'),7)
    content=soup.new_tag('div',attrs={'class':'container pj-content'})
    for node in sorted(nodes,key=rank):
        if node.name not in ['a','span']:
            node['class']=list(node.get('class',[]))+['pj-block']
        content.append(node)
    if mortgage:
        finance=soup.new_tag('details',attrs={'class':'pj-disclosure pj-finance'})
        heading=soup.new_tag('summary',attrs={'data-scroll-static':''});heading.string='Evaluar financiamiento';finance.append(heading)
        mortgage['class']=['pj-text-link'];finance.append(mortgage);content.append(finance)
    form=Template((ROOT/'templates/project-contact.html').read_text()).substitute(slug=html.escape(project['slug'],quote=True),name=html.escape(project['nombre'],quote=True))
    contact=fragment('<section class="pj-contact" data-scroll-static="" aria-labelledby="pj-contact-title"><div class="container pj-contact-layout"><div class="pj-contact-copy"><p class="eyebrow">EL SIGUIENTE PASO</p><h2 id="pj-contact-title">Recibe información para decidir</h2><p>Solicita una cotización o pide que te llamemos sobre '+html.escape(project['nombre'])+'. Usaremos el medio elegido para revisar tu consulta y coordinar el siguiente paso.</p><details class="pj-disclosure"><summary>¿Qué pasa después de enviar?</summary><p>La solicitud se dirige al equipo de Sollahms con el nombre del proyecto. Revisaremos los antecedentes y los datos que necesites confirmar. No se genera una cotización instantánea ni se garantiza disponibilidad.</p></details><details class="pj-disclosure"><summary>¿La solicitud reserva una propiedad o una cita?</summary><p>No. Es una solicitud de contacto; los precios, las condiciones y cualquier coordinación deben confirmarse posteriormente.</p></details></div>'+form+'</div></section>').section
    for old in aside.select('[id]'):
        if not main.find(id=old['id']) or old.find_parent('aside'):
            contact.insert(0,soup.new_tag('span',attrs={'id':old['id'],'class':'pj-legacy-anchor'}))
    nav=soup.new_tag('nav',attrs={'class':'section-nav pj-nav','aria-label':'Secciones del proyecto'})
    navinner=soup.new_tag('div',attrs={'class':'container'})
    destinations=[('proyecto','Resumen'),('galeria','Fotografías'),('planos','Planos'),('modelos','Distribuciones'),('caracteristicas','Detalles'),('ubicacion','Ubicación')]
    for target,label in destinations:
        if content.find(id=target):
            a=soup.new_tag('a',href='#'+target);a.string=label;navinner.append(a)
    a=soup.new_tag('a',href='#solicitar-cotizacion');a.string='Cotización y contacto';navinner.append(a);nav.append(navinner)
    main.clear();main.extend([hero,nav,content,contact])
    assert sorted(before_images)==sorted((i.get('src'),i.get('srcset'),i.get('alt')) for i in main.select('img'))
    assert sorted(before_frames)==sorted((i.get('src'),i.get('title')) for i in main.select('iframe'))
    page=page[:match.start()]+str(main)+page[match.end():]
    # The persistent header carries the primary action; no bottom overlay needed.
    header=re.search(r'<header\b.*?</header>',page,re.S)
    if header:
        h=fragment(header[0])
        for a in h.select('a[href]'):
            if a['href'].startswith('/agenda-asesoria.html'):
                a['href']='#solicitar-cotizacion';a['data-request-intent']='cotizacion';a.string='Solicitar cotización'
        page=page[:header.start()]+str(h)+page[header.end():]
    additions=f'<link rel="stylesheet" href="/assets/css/advisory.css?v=20261025-visual-1">\n<link rel="stylesheet" href="{STYLE}">\n<script type="module" src="{SCRIPT}"></script>\n'
    page=page.replace('</head>',additions+'</head>',1)
    return page

if __name__=='__main__':
    projects=json.loads((ROOT/'data/proyectos.json').read_text())
    for project in projects:
        path=ROOT/(project['slug']+'.html');path.write_text(apply_project_journey(path.read_text(),project))
    print('Reorganized',len(projects),'project details')
