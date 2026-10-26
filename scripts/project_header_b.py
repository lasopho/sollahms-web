"""Shared, static rendition of the approved Cicarelli B header.

Only replaces the first project header. Commercial sections, media, head metadata,
forms and scripts remain byte-for-byte unchanged. Used by the detail generator
and by the guarded release overlay, without rebuilding historical content.
"""
import copy, html, re
from bs4 import BeautifulSoup

CSS = '/assets/css/project-header-b.css?v=20261026-b-1'
LABELS = {
    'Proyectos': 'Asset Portafolio',
    'Todos los proyectos': 'Ver Asset Portafolio',
    'Ver proyectos': 'Ver Asset Portafolio',
    'Ver todos los proyectos': 'Ver Asset Portafolio',
    'Explorar proyectos': 'Ver Asset Portafolio',
    'catálogo de proyectos': 'Asset Portafolio',
    'Volver a proyectos': 'Volver a Asset Portafolio',
    '← Volver al catálogo de proyectos': '← Volver a Asset Portafolio',
}

def catalog_labels(page):
    def replace(m):
        node=BeautifulSoup(m[0], 'html.parser').a
        href=node.get('href','')
        if href.split('?')[0].split('#')[0] not in ['/proyectos.html','proyectos.html'] and href not in ['/#portfolio','#portfolio']:
            return m[0]
        result=m[0]
        for old,new in LABELS.items():
            result=re.sub(r'(?<=>)(\s*)'+re.escape(old)+r'(\s*)(?=<)',lambda x:x[1]+new+x[2],result)
        return result
    return re.sub(r'<a\b[^>]*>.*?</a>',replace,page,flags=re.S)

def apply_header(page, project):
    if 'data-project-header="b"' in page:
        return catalog_labels(page)
    main=re.search(r'<main\b[^>]*>',page)
    assert main, project['slug']
    match=re.search(r'<section\b[^>]*>.*?</section>',page[main.end():],re.S)
    assert match, project['slug']
    start,end=main.end()+match.start(),main.end()+match.end()
    old=BeautifulSoup(page[start:end],'html.parser')
    assert old.h1, project['slug']
    whole=BeautifulSoup(page,'html.parser')
    name=old.h1.get_text(' ',strip=True)
    assert name==project['nombre'], (name,project['nombre'])
    image=old.select_one('img')
    if image:
        image=copy.copy(image)
        image['class']='ci-image'
        image.attrs.pop('style',None)
        image['sizes']='(max-width: 680px) 280px, (max-width: 1000px) 300px, 360px'
        image['loading']='eager'
        visual=f'<figure class="ci-visual">{image}</figure>'
    else:
        visual='<div class="ci-visual ci-no-image"><p>Imagen del proyecto no disponible</p></div>'
    location=old.select_one('.hero-location')
    location=location.get_text(' ',strip=True) if location else f"{project['direccion']}, {project['comuna']}"
    badges=[x.get_text(' ',strip=True) for x in old.select('.hero-badges > span')]
    asset=project.get('tipoActivo') or next((b for b in badges if b in ['Residencial','Comercial','Mixto']), '')
    dorm=None
    for dt in whole.select('dt'):
        if dt.get_text(strip=True)=='Dormitorios':
            dd=dt.find_next_sibling('dd'); dorm=dd.get_text(' ',strip=True) if dd else None
    types=project.get('tipologias') or []
    typology=(f'{dorm} dormitorios' if dorm and dorm!='Por confirmar' and all('dormitorio' in t.lower() for t in types) else ', '.join(types))
    essential=' <span aria-hidden="true">·</span> '.join(html.escape(x) for x in [asset,typology] if x)
    status=project.get('estado') or ''
    extra=[b for b in badges if b not in [asset,status]]
    details=''.join(f'<p>{x}</p>' for x in [essential,html.escape(status),*[html.escape(b) for b in extra]] if x)
    esc=lambda x:html.escape(x,quote=True)
    header=f'''<section class="ci-hero" aria-labelledby="project-name">
      <div class="container ci-shell">
        <nav class="ci-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/proyectos.html">Asset Portafolio</a><span aria-hidden="true">/</span><span aria-current="page">{esc(name)}</span></nav>
        <div class="ci-composition">
          <div class="ci-copy"><div class="ci-identity"><div class="ci-name"><p class="ci-developer">{esc(project['inmobiliaria'])}</p><h1 id="project-name">{esc(name)}</h1></div><p class="ci-location">{esc(location)}</p></div><div class="ci-details">{details}</div><div class="ci-action"><a class="button ci-advisory" href="/agenda-asesoria.html?proyecto={esc(project['slug'])}">Solicitar asesoría <span aria-hidden="true">↗</span></a></div></div>
          {visual}
        </div>
      </div>
    </section>'''
    page=page[:start]+header+page[end:]
    page=re.sub(r'<html\b', '<html data-project-header="b"',page,count=1)
    # Approved shared theme remains last in the cascade.
    theme='<link rel="stylesheet" href="/assets/css/sollahms-theme.css'
    assert theme in page
    page=page.replace(theme,f'<link rel="stylesheet" href="{CSS}">\n'+theme,1)
    return catalog_labels(page)
