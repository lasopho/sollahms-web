"""Commercial presentation of project details, independent of research evidence.

Research records and brochure manifests remain the source of truth. This helper
only prepares the rendered HTML; it never alters evidence or commercial values.
The same policy applies to a future English rendering without creating routes.
"""
import html
import re


ES_COPY = {
    'Pendiente de verificación en la fuente oficial actual.': 'Consulta las terminaciones disponibles para la unidad que te interesa.',
    'Fotografías oficiales pendientes de verificación. Puedes solicitar material del proyecto al consultar.': 'Solicita imágenes del proyecto al consultar.',
    'Equipamiento y áreas comunes pendientes de verificación.': 'Consulta el equipamiento y las áreas comunes del proyecto.',
    'No se ha verificado un recorrido virtual oficial para este proyecto. Su disponibilidad está pendiente de confirmación.': 'Consulta la disponibilidad de un recorrido virtual del proyecto.',
    'Recorrido virtual oficial específico pendiente de verificación.': 'Consulta la disponibilidad de un recorrido virtual del proyecto.',
    'Dirección exacta pendiente de verificación. Incorporaremos el mapa cuando la ubicación del proyecto se confirme en una fuente oficial.': 'Consulta la dirección y el acceso exacto al proyecto.',
    'Las características detalladas de este proyecto están pendientes de verificación con la inmobiliaria.': 'Consulta las características y alternativas disponibles para este proyecto.',
    'El mapa busca la dirección publicada por la inmobiliaria. La ubicación del marcador la determina Google Maps; confirma el acceso exacto en la fuente oficial.': 'Google Maps determina el marcador por dirección. Confirma el acceso exacto al consultar.',
    'Mapa de búsqueda de la dirección oficial. Google Maps determina el marcador; confirma el acceso en la fuente original.': 'Google Maps determina el marcador por dirección. Confirma el acceso exacto al consultar.',
    'Consulta la ubicación publicada por la inmobiliaria en el mapa y en la fuente oficial.': 'Consulta la ubicación del proyecto en el mapa y confirma el acceso exacto al consultar.',
    'La dirección está publicada en la fuente oficial. Falta confirmar la comuna administrativa para incorporar un mapa sin ambigüedad.': 'Confirma la comuna y el acceso exacto al consultar.',
    'La dirección está publicada en la fuente oficial. La ubicación exacta o el acceso presenta referencias pendientes de aclaración. Confirma el punto de acceso con la inmobiliaria.': 'Confirma el acceso exacto al proyecto al consultar.',
    'Superficie desde (tipo por verificar)': 'Superficie desde (clasificación por confirmar)',
    ' (tipo por verificar)': ' (clasificación por confirmar)',
    'Ubicación pendiente de verificación': 'Ubicación por confirmar',
    'Dirección por verificar': 'Dirección por confirmar',
    'Pendiente de verificación': 'Por confirmar',
    'Información oficial relacionada': 'Alternativa relacionada',
    'Fuente oficial relacionada': 'Conjunto o alternativa relacionada',
    'Imágenes oficiales relacionadas': 'Imágenes de la alternativa relacionada',
    'Ubicación publicada en esta fuente': 'Ubicación de la alternativa relacionada',
    'Mostrar mapa de la fuente relacionada': 'Mostrar mapa de la alternativa relacionada',
    'Imágenes del brochure': 'Imágenes del proyecto',
    'Renders ilustrativos del brochure. Consulta con la inmobiliaria las fotografías del estado actual del proyecto.': 'Renders ilustrativos. Consulta fotografías del estado actual del proyecto.',
    'Información referencial del brochure, con superficies aproximadas. Estos modelos no acreditan disponibilidad actual. Los precios, el estado comercial y la entrega se consultan en la información vigente de la ficha.': 'Planos y superficies referenciales, sujetos a confirmación para la unidad que consultes. Confirma disponibilidad, precio y entrega al consultar.',
    'Total según brochure': 'Superficie total referencial',
    'Total impreso': 'Total referencial',
    'Equipamiento documentado en el brochure': 'Equipamiento del proyecto',
    'Características del documento de referencia, sujetas a confirmación para la unidad y etapa que consultes.': 'Confirma el equipamiento y las terminaciones correspondientes a la unidad y etapa que consultes.',
    'El total impreso no coincide con la suma de superficie útil y terraza. La cifra del brochure se conserva como referencia, pendiente de confirmación.': 'La superficie total indicada difiere de la suma de superficie útil y terraza. Confirma las medidas de la unidad al consultar.',
    'El brochure no informa la superficie de terraza por separado.': 'Superficie de terraza por confirmar.',
    'Los pisos 2 al 16 corresponden al brochure. La web oficial actual publica pisos 2 al 6; disponibilidad y correspondencia pendientes de confirmación.': 'Los pisos indicados son referenciales. Confirma el piso y la distribución de la unidad disponible al consultar.',
    'Este brochure identifica el modelo 26; la web actual identifica el modelo 36 con las mismas superficies principales. No se presume que sean la misma unidad disponible.': 'Confirma la correspondencia de esta distribución con la unidad y el modelo comercial disponibles.',
    'Piso 2 sin terraza: el brochure publica 30,88 m² útiles. La superficie total específica de esa variante no está indicada.': 'Piso 2 sin terraza: 30,88 m² útiles referenciales; superficie total de esta variante por confirmar.',
    'El título de la planta dice «Depto Estudio» y el dibujo representa un espacio único; el rótulo 1D de la banda es discrepante. Se identifica como Estudio, sin afirmar disponibilidad actual.': 'Esta distribución se presenta como estudio referencial. Confirma la tipología y disponibilidad de la unidad al consultar.',
    'El dibujo representa un baño, pero el rótulo de la banda indica 2B. El número de baños de una unidad comercial requiere confirmación.': 'Número de baños por confirmar para la unidad que consultes.',
    'Orientación, pisos y unidades no están documentados de forma visible; permanecen pendientes.': 'Orientación, piso y unidad por confirmar al consultar.',
    'Orientación no indicada en la página original.': 'Orientación por confirmar.',
    'El brochure no asigna un código comercial; el identificador corresponde a su tipología y página.': '',
    'El brochure no publica un código de modelo; se identifica por su tipología y página.': '',
    'Tipologías documentadas: Estudio, 1 y 2 dormitorios': 'Tipologías referenciales: Estudio, 1 y 2 dormitorios',
    '285 unidades según brochure': '285 unidades referenciales; no representa disponibilidad actual',
    '331 departamentos según brochure; no representa stock disponible': '331 departamentos referenciales; no representa disponibilidad actual',
    '165 departamentos según brochure; no representa stock disponible': '165 departamentos referenciales; no representa disponibilidad actual',
    'Audio y WiFi en amenities según brochure': 'Audio y WiFi en áreas comunes; confirma las condiciones al consultar',
    'La fuente oficial informa entrega inmediata.': 'Entrega inmediata.',
    'La página oficial presenta': 'Tipologías:',
    'La ficha oficial anuncia últimas unidades desde UF 2.450.': 'Últimas unidades desde UF 2.450, sujetas a disponibilidad.',
    'La página oficial de Maestra identifica Plaza Cervantes Torre A en La Cisterna y lo anuncia con entrega inmediata.': 'Plaza Cervantes Torre A es un proyecto de Maestra en La Cisterna, con entrega inmediata.',
    'La ficha oficial publica departamentos de 1 a 2 dormitorios y 1 a 2 baños, con fecha de entrega pendiente de confirmación.': 'Departamentos de 1 a 2 dormitorios y 1 a 2 baños; confirma la fecha de entrega al consultar.',
    ', registrado en el catálogo Sollahms por': ', proyecto de',
    'Visor 360 oficial — contexto por confirmar': 'Recorrido 360 — contexto referencial',
    'La URL y el título oficial identifican Edificio Irarrázaval 1970, pero el visor incluye un panorama de 2021 con nombre interno «Albora». La correspondencia del entorno mostrado con este proyecto está pendiente de confirmación; no se incorporan sus imágenes ni sus coordenadas como ubicación del edificio.': 'Recorrido de contexto referencial; la correspondencia del entorno con este proyecto debe confirmarse al consultar. No representa una unidad disponible.',
    'La fuente oficial describe Mapocho 3521 en conjunto y no identifica «Edificio A». Los datos e imágenes de este apartado corresponden al conjunto; su equivalencia con esta etapa y su oferta específica siguen pendientes de verificación.': 'Los datos e imágenes de este apartado corresponden al conjunto Mapocho 3521. La oferta, el acceso y la entrega específicos de Edificio A deben confirmarse al consultar.',
    'La fuente oficial describe el conjunto Froilán Roa 5731 y no distingue Torre Norte ni Torre Sur. Estos datos e imágenes corresponden al conjunto; identidad, precios, acceso y entrega de cada torre siguen pendientes de verificación.': 'Los datos e imágenes de este apartado corresponden al conjunto Froilán Roa 5731. La oferta, el acceso y la entrega específicos de cada torre deben confirmarse al consultar.',
    'Representaciones oficiales del conjunto Froilán Roa 5731. La fuente no identifica las torres Norte y Sur ni una unidad disponible.': 'Imágenes referenciales del conjunto Froilán Roa 5731; no identifican una torre ni una unidad disponible.',
    'La fuente describe Verne Oficinas, un producto comercial con ascensores y escaleras independientes. Estos precios y superficies corresponden a oficinas. La identidad y disponibilidad residencial de Edificio Verne siguen pendientes de confirmación.': 'Verne Oficinas es una alternativa comercial con ascensores y escaleras independientes. Sus precios, imágenes y superficies corresponden exclusivamente a oficinas; la oferta residencial de Edificio Verne debe consultarse por separado.',
    '21 a 57,96 m²; la fuente no precisa si este rango es útil o total': '21 a 57,96 m²; clasificación de superficie por confirmar',
    'Entrega inmediata; la fuente no publica una fecha de entrega': 'Entrega inmediata; confirma la fecha exacta al consultar',
    'Pendiente de verificación: la fuente no publica un visor funcional.': 'Consulta la disponibilidad de un recorrido virtual de oficinas.',
    'La dirección Av. Videla 810 corresponde a la ficha vigente de oficinas. El brochure relacionado indica Videla 812; no se atribuye ninguna de estas direcciones al producto residencial sin confirmación. Google Maps determina el marcador por dirección.': 'Este mapa corresponde exclusivamente a Verne Oficinas, en Av. Videla 810. La dirección y el acceso del producto residencial deben consultarse por separado. Google Maps determina el marcador por dirección.',
    'Segundo semestre de 2027, según la ficha oficial; no confirma la entrega de una torre específica': 'Segundo semestre de 2027 para el conjunto; confirma la entrega de la torre que consultes',
    'Edificio Irarrázaval 1970 es un proyecto de Norte Verde en Irarrázaval 1970, Ñuñoa. Su identidad y ubicación constan en el brochure oficial. La disponibilidad comercial, los precios y las superficies vigentes están pendientes de verificación.': 'Edificio Irarrázaval 1970 es un proyecto de Norte Verde en Irarrázaval 1970, Ñuñoa. Consulta disponibilidad, precios y superficies de las unidades.',
    'Mínimo anunciado en la tarjeta oficial de Torre A: UF 2.327. También publica UF 2.527 sin identificar las tipologías correspondientes. Confirma stock y condiciones específicas con Maestra; la ficha detallada de la torre no está disponible.': 'Desde UF 2.327 para Torre A, sujeto a disponibilidad y condiciones comerciales. Confirma el precio de la tipología que consultes con Maestra.',
}

EN_COPY = {
    'Pending verification': 'Please enquire',
    'Official source pending verification': 'Please enquire about project information',
    'Official project sources': 'Project information',
    'Documented equipment': 'Project amenities',
    'Approximate brochure areas': 'Indicative floor areas',
    'Total according to brochure': 'Indicative total floor area',
    'Brochure images': 'Project images',
}

# These concise cautions preserve commercially relevant scope which formerly
# appeared only in research/source blocks. No confidential conditions are used.
COMMERCIAL_NOTES = {
    'downtown-san-martin': 'Los modelos son referenciales y no acreditan disponibilidad actual. Confirma la inclusión de bicicletero para la tipología que consultes.',
    'edificio-teatinos-750': 'Los renders y modelos son referenciales. La opción de instalar lavadora excluye la línea 9 y no implica que se incluya una lavadora. Confirma las superficies de la unidad disponible.',
    'edificio-vista-amunategui': 'Confirma las terminaciones, el material de cubierta de cocina y el uso de la sala común para la unidad y etapa que consultes.',
    'monjitas-690': 'Confirma los pisos, la correspondencia de los modelos, la cantidad de quinchos y las dimensiones de la unidad disponible. Las imágenes y planos son referenciales.',
    'vista-morande': 'Los modelos, incluidos los estudios, son referenciales y no acreditan disponibilidad actual. Confirma precio, entrega, terminaciones y equipamiento al consultar.',
    'centenario-1': 'Las distribuciones y superficies de los planos son referenciales y pueden diferir de la oferta comercial vigente. Confirma la unidad disponible, sus dimensiones, orientación y piso al consultar.',
    'tocornal': 'Los planos incluyen un estudio referencial; su disponibilidad no está confirmada. Las superficies y distribuciones pueden diferir de la oferta vigente. Confirma tipología, baños, orientación y piso de la unidad al consultar.',
    'vivaceta': 'Las superficies y distribuciones de los planos son referenciales y pueden diferir de la oferta vigente. El modelo de 54,57 m² no acredita disponibilidad actual. Confirma dimensiones, orientación y entrega al consultar.',
}

EN_COMMERCIAL_NOTES = {
    'downtown-san-martin': 'Models are indicative and do not establish current availability. Please confirm bicycle storage for the layout you enquire about.',
    'edificio-teatinos-750': 'Renders and layouts are indicative. The washing machine installation option excludes line 9 and does not include a washing machine. Please confirm the available unit\'s floor areas.',
    'edificio-vista-amunategui': 'Please confirm finishes, kitchen worktop material and the shared room\'s use for the unit and phase you enquire about.',
    'monjitas-690': 'Please confirm floors, model correspondence, the number of barbecue areas and the available unit\'s dimensions. Images and plans are indicative.',
    'vista-morande': 'Models, including studios, are indicative and do not establish current availability. Please confirm price, handover, finishes and amenities.',
    'centenario-1': 'Plan layouts and floor areas are indicative and may differ from the current commercial offer. Please confirm the available unit, dimensions, orientation and floor.',
    'tocornal': 'Plans include an indicative studio whose availability is unconfirmed. Floor areas and layouts may differ from the current offer. Please confirm layout, bathrooms, orientation and floor.',
    'vivaceta': 'Plan floor areas and layouts are indicative and may differ from the current offer. The 54.57 m² model does not establish current availability. Please confirm dimensions, orientation and handover.',
}

SOURCE_IDS = r'(?:fuentes|sources|official-sources|project-sources|fuentes-oficiales|provenance|verification|verification-date|document-provenance|source-provenance|research)'
TAG = re.compile(r'(<(?:[^>\"\']|\"[^\"]*\"|\'[^\']*\')+>)')


def _visible_copy(value, language):
    copies = EN_COPY if language.startswith('en') else ES_COPY
    for before, after in sorted(copies.items(), key=lambda item: len(item[0]), reverse=True):
        value = value.replace(before, after)
    if language.startswith('en'):
        value = re.sub(r'\s*[·—–-]?\s*Brochure,?\s*(?:p\.|page)\s*\d+(?:,\s*\d+)*', '', value, flags=re.I)
        value = re.sub(r'Brochure\s*[·:]\s*(?:p\.|page)\s*\d+(?:,\s*\d+)*', 'Indicative plan', value, flags=re.I)
        value = re.sub(r'\s*[·—–]\s*(?:p\.|page)\s*\d+', '', value, flags=re.I)
    else:
        value = re.sub(r'\s*[·—–-]?\s*Brochure,?\s*pág\.\s*\d+(?:,\s*\d+)*', '', value, flags=re.I)
        value = re.sub(r'Brochure\s*[·:]\s*pág\.\s*\d+(?:,\s*\d+)*', 'Plano referencial', value, flags=re.I)
        value = re.sub(r'\s*—\s*página\s+\d+', '', value, flags=re.I)
        value = re.sub(r'(\d+) modelos documentados en el brochure de', r'\1 modelos referenciales de', value)
        value = value.replace('render ilustrativo del brochure', 'render ilustrativo').replace('render del brochure', 'render ilustrativo')
        value = value.replace(' — fuente relacionada', ' — alternativa relacionada')
        value = re.sub(r'\b(?:La fuente oficial|La inmobiliaria) informa venta en verde\.', 'Venta en verde.', value)
        value = value.replace(' (asociación por verificar)', ' (por confirmar)')
        value = re.sub(r'Precio publicado en la fuente oficial, revisado el \d{4}-\d{2}-\d{2}\. Sujeto a disponibilidad y condiciones de la inmobiliaria\.', 'Precio sujeto a disponibilidad y condiciones comerciales. Confirma el valor vigente al consultar.', value)
    return value


def commercialize_fiche(page, slug=None, language=None):
    """Remove visitor-facing audit content while preserving resources and SEO.

    This is intentionally idempotent and leaves the head/scripts unchanged.
    Packaging markers remain functional; hidden copies of removed audit/source
    content are not retained in the public HTML.
    """
    match = re.search(r'<body\b[^>]*>', page, re.I)
    if not match:
        return page
    prefix, body = page[:match.end()], page[match.end():]
    lang = language or (re.search(r'<html\b[^>]*\blang=[\"\']([^\"\']+)', page, re.I)[1] if re.search(r'<html\b[^>]*\blang=[\"\']([^\"\']+)', page, re.I) else 'es')
    # Source sections contain audit records only; the four featured pages need a
    # narrower removal because their commercial gallery/specs/tours share a box.
    body = re.sub(r'<section\b[^>]*\bid=[\"\']' + SOURCE_IDS + r'[\"\'][^>]*>.*?</section>\s*', '', body, flags=re.S | re.I)
    # English templates may use a different section ID. Match the audit heading
    # only within a section containing no gallery, plan, map or tour resources.
    audit_heading = r'(?:Sources|Official sources|Verification date|Document provenance|Audit records|Research records|Fuentes|Fuentes oficiales|Fecha de verificación|Procedencia documental)'
    def remove_audit_section(match):
        block = match[0]
        if re.search(r'<h[2-4]\b[^>]*>\s*' + audit_heading + r'\s*</h[2-4]>', block, re.I) and not re.search(r'<(?:img|iframe)\b|data-embed-src=', block, re.I):
            return ''
        return block
    body = re.sub(r'<section\b[^>]*>.*?</section>', remove_audit_section, body, flags=re.S)
    body = re.sub(r'(<section\b[^>]*\bid=[\"\']fuentes-verificadas[\"\'][^>]*>)(.*?)(</section>)', lambda m: m[1].replace('fuentes-verificadas', 'detalle-adicional') + re.sub(r'<h2>Fuentes y verificación</h2>.*', '', m[2], flags=re.S) + m[3], body, flags=re.S)
    body = body.replace('<!-- verified-featured-start -->', '<!-- featured-details-start -->').replace('<!-- verified-featured-end -->', '<!-- featured-details-end -->')
    body = re.sub(r'<a\b[^>]*\bhref=[\"\']#' + SOURCE_IDS + r'[\"\'][^>]*>.*?</a>', '', body, flags=re.S | re.I)
    body = re.sub(r'<a\b[^>]*>\s*(?:Ver fuente oficial\s*↗?|Fuente oficial|Consultar la fuente oficial del proyecto|Official source|View official source\s*↗?)\s*</a>', '', body, flags=re.S | re.I)
    body = re.sub(r'<p>\s*<a\b[^>]*>Consultar esta fuente oficial\s*↗?</a>.*?</p>', '', body, flags=re.S)
    body = re.sub(r'<p\b[^>]*>\s*(?:Verification date|Date verified|Document provenance|Last verified|Last reviewed|Procedencia documental|Fecha de verificación|Última revisión)\s*:?.*?</p>', '', body, flags=re.S | re.I)
    body = re.sub(r'<p\b[^>]*>[^<]*(?:Yapo/IRIS|Yapo &amp; IRIS)[^<]*</p>', '', body, flags=re.I)
    # Technical plan IDs stay stable. Human labels distinguish each layout
    # without exposing an original PDF page number.
    labels = {
        'estudio-p10': ('Modelo ESTUDIO · pág. 10', 'Modelo Estudio'),
        '1d1b-p11': ('Modelo 1D1B · pág. 11', 'Modelo 1D1B'),
        '2d-p12': ('Modelo 2D · pág. 12', 'Modelo 2D'),
        '2d2b-p12': ('Modelo 2D2B · pág. 12', 'Modelo 2D2B · Distribución 1'),
        '2d2b-p13': ('Modelo 2D2B · pág. 13', 'Modelo 2D2B · Distribución 2' if slug == 'centenario-1' else 'Modelo 2D2B · Distribución 1'),
        '2d2b-p14': ('Modelo 2D2B · pág. 14', 'Modelo 2D2B · Distribución 3' if slug == 'centenario-1' else 'Modelo 2D2B · Distribución 2'),
        '1d1b-p9': ('Modelo 1D1B · pág. 9', 'Modelo 1D1B'),
        '2d1b-p10': ('Modelo 2D1B · pág. 10', 'Modelo 2D1B'),
        '2d2b-a-p11': ('Modelo 2D2B-A · pág. 11', 'Modelo 2D2B-A'),
        '2d2b-b-p12': ('Modelo 2D2B-B · pág. 12', 'Modelo 2D2B-B'),
    }
    for identifier, (before, after) in labels.items():
        pattern = r'(<details class="aj-model" id="modelo-' + re.escape(identifier) + r'">)(.*?)(</details>)'
        body = re.sub(pattern, lambda m: m[1] + m[2].replace(before, after) + m[3], body, flags=re.S)
    # Apply prose/accessible-label changes without altering URLs, structural
    # attributes, embedded data, scripts or commercial numbers.
    tokens = TAG.split(body)
    protected = None
    for index, token in enumerate(tokens):
        if token.startswith('<'):
            opening = re.match(r'<(script|style)\b', token, re.I)
            closing = re.match(r'</(script|style)\b', token, re.I)
            if opening:
                protected = opening[1].lower()
            elif closing:
                protected = None
            elif not protected:
                tokens[index] = re.sub(r'\b(alt|aria-label|data-embed-title)=([\"\'])(.*?)(\2)', lambda m: m[1] + '=' + m[2] + _visible_copy(m[3], lang) + m[4], token)
        elif not protected:
            tokens[index] = _visible_copy(token, lang)
    body = ''.join(tokens)
    # Empty text nodes/notices left by removal add no useful visitor content.
    body = re.sub(r'<p>\s*</p>', '', body)
    body = re.sub(r'<div class="aj-model-note">\s*</div>', '', body)
    body = re.sub(r'<span class="aj-page">.*?</span>', '', body, flags=re.S)
    body = re.sub(r'<div class="aj-plan-caption"><span>\s*</span>', '<div class="aj-plan-caption"><span>' + ('Indicative plan' if lang.startswith('en') else 'Plano referencial') + '</span>', body)
    if slug in COMMERCIAL_NOTES and 'aj-commercial-note' not in body:
        note = (EN_COMMERCIAL_NOTES if lang.startswith('en') else COMMERCIAL_NOTES)[slug]
        body = re.sub(r'(<div class="aj-scope"><p>.*?</p></div>)', lambda m: m[1] + '<div class="aj-scope aj-commercial-note"><p>' + html.escape(note) + '</p></div>', body, count=1, flags=re.S)
    if slug == 'downtown-san-martin' and 'aj-commercial-model-note' not in body:
        note = 'This indicative layout is presented with one bedroom and one bathroom. Please confirm the available unit\'s layout.' if lang.startswith('en') else 'Esta distribución referencial se presenta con un dormitorio y un baño. Confirma la tipología de la unidad disponible al consultar.'
        body = re.sub(r'(<details class="aj-model" id="modelo-13">.*?<dl class="aj-metrics">.*?</dl>)', lambda m: m[1] + '<div class="aj-model-note aj-commercial-model-note"><p>' + html.escape(note) + '</p></div>', body, count=1, flags=re.S)
    if slug in {'distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'plaza-las-condes'} and 'price-commercial-note' not in body:
        note = 'Price and availability are subject to commercial terms. Please confirm the current price when enquiring.' if lang.startswith('en') else 'Precio y disponibilidad sujetos a condiciones comerciales. Confirma el valor vigente al consultar.'
        body = re.sub(r'(<aside\b[^>]*>.*?)(<a\b[^>]*href="/contacto\.html\?proyecto=' + re.escape(slug) + '")', lambda m: m[1] + '<p class="price-commercial-note text-sm text-secondary">' + note + '</p>' + m[2], body, count=1, flags=re.S)
    # Unknown prices retain uncertainty with an actionable commercial label.
    body = re.sub(r'(<(?:strong|div class="price[^\"]*")>)<span class="pending">Por confirmar</span>', r'\1<span class="pending">Consultar precio</span>', body)
    body = body.replace('href="/privacidad.html"', 'href="/privacidad.html#informacion-inmobiliaria-material-grafico"')
    return prefix + body
