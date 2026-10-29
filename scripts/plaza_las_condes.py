"""Verified, project-scoped enhancement; run after shared fiche renderers.

The source record retains provenance and unresolved commercial discrepancies.
This module never renders another project or changes the shared contact contract.
"""
import copy
import html
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from project_image_labels import apply_image_label_policy
from project_navigation import apply_navigation
from project_amenities import apply_amenities, icon

ROOT = Path(__file__).resolve().parents[1]
SLUG = 'plaza-las-condes'
CSS = '/assets/css/plaza-las-condes.css?v=20261028-1'
JS = '/assets/js/plaza-las-condes.mjs?v=20261029-structure-1'
DESCRIPTION = 'Plaza Las Condes de Sento, en Avenida Las Condes 7083. Conoce sus áreas comunes, terminaciones, planos y unidades, y solicita una cotización con Sollahms.'

def esc(value):
    return html.escape(str(value), quote=True)

def number(value):
    return f'{value:,.2f}'.replace(',', '_').replace('.', ',').replace('_', '.')

def section(id_, eyebrow, title, body):
    return f'<section class="detail-section pj-block" id="{id_}" aria-labelledby="{id_}-heading"><p class="eyebrow">{eyebrow}</p><h2 id="{id_}-heading">{title}</h2>{body}</section>'

def render_content(record, original_gallery):
    overview = section('proyecto', 'El proyecto', 'Vida urbana, con la cordillera de fondo', '''
      <p>Plaza Las Condes, de Inmobiliaria Sento, es un edificio residencial de 10 pisos más azotea en Avenida Las Condes 7083, en la esquina donde funcionaba el café Tavelli. Su arquitectura contemporánea y sus espacios en altura proponen una forma de vivir conectada con el entorno de Las Condes.</p>
      <p>Está a aproximadamente ocho minutos caminando de Metro Hernando de Magallanes, según Sento. Su ubicación permite acceder a comercio, restaurantes, parques y centros deportivos; las vistas hacia la cordillera dependen de la orientación y del piso de cada departamento.</p>
      <dl class="spec-grid pj-summary"><div><dt>Diseño residencial</dt><dd>10 pisos + azotea</dd></div><div><dt>Tipologías del proyecto</dt><dd>Estudio, 1 y 2 dormitorios</dd></div><div><dt>Conectividad</dt><dd>Metro Hernando de Magallanes</dd></div><div><dt>Estado informado</dt><dd>Próxima entrega</dd></div></dl>
      <a class="pj-text-link" href="#unidades">Ver unidades y condiciones <span aria-hidden="true">↓</span></a>''')
    amenities = [('social','Family & Social Club y Salón Lounge'),('roof','Quinchos, terrazas y Sky Bar'),('pool','Piscina en azotea'),('coffee','Cafetería'),('lobby','Hall de acceso y lobby'),('mail','E-commerce / Mail Room'),('bike','Bicicleteros'),('wash','Lavandería'),('parking','Estacionamientos')]
    facts = section('caracteristicas', 'Características', 'Espacios para compartir y disfrutar',
        '<p>Áreas comunes y equipamiento descritos por Sento. Confirma las condiciones y el valor de los estacionamientos al cotizar.</p><ul class="plc-amenities">'+''.join(f'<li>{icon(kind)}<span>{label}</span></li>' for kind,label in amenities)+'</ul>')
    finishes = section('terminaciones', 'Dentro de tu departamento', 'Terminaciones y equipamiento interior', '''
      <ul class="plc-finishes"><li><strong>Acceso digital</strong><span>Cerradura digital en la puerta de acceso del departamento.</span></li><li><strong>Ventanas termopanel</strong><span>Marcos de PVC y doble vidrio.</span></li><li><strong>Pisos por recinto</strong><span>SPC y porcelanato, según especificación.</span></li><li><strong>Cocina equipada</strong><span>Horno, campana, encimera de dos o tres platos y microondas, según tipología.</span></li><li><strong>Cubiertas de cuarzo</strong><span>En la cocina, según las especificaciones de Sento.</span></li><li><strong>Baño principal</strong><span>Ducha en obra según unidad y especificación vigente.</span></li></ul>
      <p class="plc-note">Confirma las terminaciones, el equipamiento y su alcance en la especificación de la unidad que cotices.</p>''')
    unit_rows = []
    for unit in record['units']:
        price = 'UF '+number(unit['priceUF']).removesuffix(',00') if unit['priceUF'] else 'Consultar valor'
        note = 'Precio de lista' if unit['priceUF'] else 'Precio por confirmar'
        unit_rows.append(f'''<article class="plc-unit" aria-labelledby="unit-{unit['number']}"><div><h3 id="unit-{unit['number']}">Unidad {unit['number']}</h3><p>2 dormitorios · 2 baños</p></div><dl><dt>Superficie interior informada*</dt><dd>{number(unit['interiorM2'])} m²</dd></dl><div class="plc-unit-price"><strong>{price}</strong><p>{note}</p></div><a class="button button-green plc-quote" href="#solicitar-cotizacion" data-request-intent="cotizacion" data-plaza-unit="{unit['number']}" aria-label="Solicitar cotización de la unidad {unit['number']}">Solicitar cotización</a></article>''')
    units = section('unidades', 'Unidades para consultar', 'Una cotización para tu elección', '''
      <p>Compara las unidades de 2 dormitorios informadas a Sollahms. Las tipologías Estudio y 1 dormitorio forman parte del diseño del proyecto; su disponibilidad actual requiere confirmación.</p>'''+
      '<div class="plc-units" data-scroll-static>'+''.join(unit_rows)+'</div>'+'''
      <p class="plc-note">*Superficies interiores aportadas a Sollahms para estas unidades, pendientes de confirmación documental por unidad. No equivalen a superficie total con terraza.</p>
      <details class="pj-disclosure"><summary data-scroll-static>Precios y condiciones de cotización</summary><p>Precios de lista proporcionados a Sollahms y actualizados el 28 de octubre de 2026: unidad 213, UF 11.119; unidad 313, UF 11.073.</p><p>No se han aplicado descuentos automáticamente. Confirma disponibilidad, inclusiones y condiciones comerciales al solicitar una cotización. La solicitud no constituye una reserva.</p></details>''')
    plan_cards = []
    for plan in record['plans']:
        total = f"{number(plan['totalM2'])} m² totales" if plan['totalM2'] else 'Consultar superficie'
        note = '' if plan['totalM2'] else '<p class="plc-note">Superficie pendiente de aclaración entre documentos.</p>'
        plan_cards.append(f'''<article class="plc-plan" data-plan-type="{esc(plan['typology'])}"><h3>Modelo {plan['model']}</h3><p>{plan['typology']} · {plan['baths']} baño{'s' if plan['baths']>1 else ''}</p><a class="plc-plan-image" href="{plan['src']}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar plano del modelo {plan['model']}"><img src="{plan['src']}" width="{plan['width']}" height="{plan['height']}" alt="Plano referencial del modelo {plan['model']}: {plan['typology']}, {plan['baths']} baño{'s' if plan['baths']>1 else ''}, Plaza Las Condes" loading="lazy" decoding="async"></a><p class="plc-plan-total">{total}</p>{note}<a class="pj-text-link" href="{plan['src']}" target="_blank" rel="noopener noreferrer">Ampliar plano <span class="sr-only">{plan['model']}</span><span aria-hidden="true">↗</span></a></article>''')
    plans = section('planos', 'Distribuciones', 'Explora las tipologías', '''
      <p>Planos oficiales del proyecto; no acreditan disponibilidad. Las superficies totales incluyen terraza y no deben compararse directamente con las superficies interiores de las unidades.</p>
      <details class="pj-disclosure plc-plans-disclosure"><summary data-scroll-static>Ver los 9 planos por tipología</summary><div class="plc-plan-controls" data-scroll-static hidden><label for="plc-plan-filter">Tipología del plano</label><select id="plc-plan-filter"><option value="">Todas</option><option>Estudio</option><option>1 dormitorio</option><option>2 dormitorios</option></select><span id="plc-plan-count" role="status" aria-live="polite">9 planos</span></div><div class="plc-plans">'''+''.join(plan_cards)+'''</div><p class="plc-note">Los modelos B5, C2 y C4 tienen superficies discordantes entre el brochure y la web de Sento; se muestran sus planos sin presentar una cifra como confirmada. No se ha asociado un modelo a las unidades 213 o 313 sin respaldo específico.</p></details>''')
    gallery = BeautifulSoup('<section id="galeria" class="detail-section pj-block" aria-labelledby="project-gallery-heading"><p class="eyebrow">Imágenes del proyecto</p><h2 id="project-gallery-heading">Arquitectura, áreas comunes e interiores</h2><p class="image-credit">Renders ilustrativos de Sento: no acreditan el estado actual de la obra. Abre cada imagen para verla completa.</p></section>','html.parser').section
    figures = []
    for item in record['existingImages']:
        figures.append(BeautifulSoup(f'<figure><a href="{item["src"]}" target="_blank" rel="noopener noreferrer"><span class="s-parallax-frame"><img src="{item["src"]}" alt="{esc(item["alt"])}" width="{item["width"]}" height="{item["height"]}" loading="lazy" decoding="async"></span></a><figcaption>{item["caption"]}</figcaption></figure>','html.parser').figure)
    for figure in figures:
        if figure.img and figure.img['src'].endswith('-05.webp'):
            figure.img['alt'] = 'Render referencial: cocina del espacio social de Plaza Las Condes'
            figure.figcaption.string = 'Cocina del espacio social · Render referencial'
    for item in record['newImages']:
        figures.append(BeautifulSoup(f'''<figure><a href="{item['src']}" target="_blank" rel="noopener noreferrer"><span class="s-parallax-frame"><img src="{item['src']}" alt="{esc(item['alt'])}" width="{item['width']}" height="{item['height']}" loading="lazy" decoding="async"></span></a><figcaption>{item['caption']} · Render referencial</figcaption></figure>''','html.parser').figure)
    # Three distinct views lead; preserve all seven approved images, then reveal the rest.
    figures = [figures[0], figures[8], figures[7], *figures[1:7], *figures[9:]]
    for node in list(gallery.select('.gallery-grid,.pj-disclosure')):
        node.decompose()
    gallery.append(BeautifulSoup('<div class="gallery-grid brochure-gallery">'+''.join(str(f) for f in figures[:3])+'</div><details class="pj-disclosure"><summary data-scroll-static>Ver 9 imágenes más</summary><div class="gallery-grid brochure-gallery">'+''.join(str(f) for f in figures[3:])+'</div></details>','html.parser'))
    tour = section('recorrido', 'Visita virtual', 'Recorre el interior', '''
      <p>El recorrido oficial de Sento identifica el departamento 213 como modelo C7, de 2 dormitorios y 2 baños. Explora su distribución como referencia; el recorrido no confirma disponibilidad ni condiciones de venta.</p>
      <details class="pj-disclosure" data-scroll-static><summary>Cargar recorrido virtual 360°</summary><div class="project-embed plc-tour"><iframe src="https://sento.cl/360-plc/213/" title="Recorrido virtual referencial de Plaza Las Condes, publicado por Sento" loading="lazy" allow="fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-pointer-lock" referrerpolicy="strict-origin-when-cross-origin" data-project-embed="tour" data-embed-fallback="https://sento.cl/360-plc/213/"></iframe></div><p data-project-embed-alternative><a href="https://sento.cl/360-plc/213/" target="_blank" rel="noopener noreferrer">Abrir el recorrido oficial en otra pestaña ↗</a></p><p class="plc-note">La experiencia pertenece a Sento. Para consultar precio o cotizar, utiliza el formulario de Sollahms en esta ficha.</p></details>''')
    location = section('ubicacion', 'Ubicación y entorno', 'Avenida Las Condes 7083', '''
      <p><strong>Dirección del edificio:</strong> Avenida Las Condes 7083, Las Condes, Región Metropolitana.</p><p>El entorno conecta con Alto Las Condes, Apumanque y Parque Arauco, además de restaurantes, parques, Estadio Italiano y Estadio Israelita. El tiempo a pie al metro es aproximado y depende de la ruta.</p>
      <div class="project-embed project-embed-map" data-scroll-static><iframe src="https://www.google.com/maps?q=-33.4052083%2C-70.5576861&amp;z=17&amp;output=embed" title="Ubicación del edificio Plaza Las Condes en Avenida Las Condes 7083" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" data-project-embed="map" data-embed-fallback="https://www.google.com/maps?q=-33.4052083%2C-70.5576861"></iframe></div>
      <p class="plc-note"><strong>Sala de ventas informada por Sento:</strong> General Carol Urzúa 7060. Es una referencia distinta de la dirección del edificio; confirma el acceso y la atención antes de visitar.</p>''')
    return overview+facts+finishes+units+plans+str(gallery)+tour+location

def apply_plaza_las_condes(page, project):
    if project.get('slug') != SLUG:
        return page
    record = json.loads((ROOT/'data/plaza-las-condes-verified.json').read_text())
    soup = BeautifulSoup(page,'html.parser')
    main = soup.main
    main['class'] = list(dict.fromkeys([*main.get('class',[]),'plaza-detail']))
    main['data-plaza-version'] = '20261028-1'
    main.select_one('.ci-location').string = 'Avenida Las Condes 7083 · Las Condes'
    main.select_one('.ci-market .price-label').string = 'Precio de lista'
    lowest = min((u for u in record['units'] if u.get('priceUF')), key=lambda u: u['priceUF'])
    main.select_one('.ci-market strong').string = 'Desde UF '+number(lowest['priceUF']).removesuffix(',00')
    main.select_one('.ci-market .price-note').string = f"Unidad {lowest['number']} · 2D / 2B. Disponibilidad y condiciones al cotizar."
    nav = main.select_one('.pj-nav .container'); nav.clear()
    nav.append(BeautifulSoup(''.join(f'<a href="#{a}">{b}</a>' for a,b in [('proyecto','Resumen'),('caracteristicas','Características'),('unidades','Unidades'),('planos','Planos'),('galeria','Galería y 360°'),('ubicacion','Ubicación'),('solicitar-cotizacion','Cotización')]),'html.parser'))
    content = main.select_one('.pj-content')
    gallery = content.select_one('#galeria')
    tail = ''.join(str(x) for x in content.select(':scope > .back-link,:scope > .pj-finance'))
    content.clear(); content.append(BeautifulSoup(render_content(record,gallery)+tail,'html.parser'))
    context = main.select_one('#advisory-project-context')
    if not main.select_one('#plc-unit-context'):
        context.insert_after(BeautifulSoup('<div class="plc-unit-context" id="plc-unit-context" data-scroll-static hidden><p role="status" aria-live="polite" id="plc-unit-selected"></p><button type="button" id="plc-unit-clear">Quitar selección de unidad</button></div>','html.parser'))
    # Keep head, header, footer, forms and shared assets unchanged except scoped data.
    page = re.sub(r'<main\b[^>]*>.*?</main>',lambda _:str(main),page,count=1,flags=re.S)
    old = 'Información de Plaza Las Condes. Consulta con Sollahms los antecedentes y condiciones vigentes del proyecto.'
    page = page.replace(old,DESCRIPTION)
    page = re.sub(r'(<script[^>]*id="project-embed-hosts"[^>]*>).*?(</script>)',r'\1["www.google.com","sento.cl"]\2',page,flags=re.S)
    if CSS not in page:
        marker = '<link rel="stylesheet" href="/assets/css/sollahms-theme.css'
        page = page.replace(marker,f'<link rel="stylesheet" href="{CSS}">\n'+marker,1)
    if JS not in page:
        page = page.replace('</head>',f'<script type="module" src="{JS}"></script>\n</head>',1)
    return apply_image_label_policy(apply_navigation(apply_amenities(page, project), project))

if __name__ == '__main__':
    file=ROOT/(SLUG+'.html')
    file.write_text(apply_plaza_las_condes(file.read_text(),{'slug':SLUG}))
