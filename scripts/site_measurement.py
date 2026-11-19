"""Final authoring step, restricted to the twelve corporate measurement pages."""
import re

PAGES = frozenset({'index.html', 'agenda-asesoria.html', 'contacto.html', 'privacidad.html',
                   'comparador-hipotecario.html', 'trabaja-con-nosotros.html',
                   'guia-hipotecaria.html', 'cuando-comprar-propiedad.html',
                   'centro-orientacion.html', 'entorno-desarrollo-urbano.html',
                   'inversion-inmobiliaria-empresas.html', 'beneficios-tributarios-inmobiliarios.html'})
CSS = '<link rel="stylesheet" href="/assets/css/site-measurement.css">\n'
MODULE = '<script type="module" src="/assets/js/site-measurement.mjs" data-sollahms-measurement></script>\n'


def apply_site_measurement(html, filename):
    if filename not in PAGES:
        raise ValueError('Outside the positive corporate measurement scope: ' + filename)
    if html.count('src="/assets/js/site-measurement.mjs"') > 1 or html.count('href="/assets/css/site-measurement.css"') > 1:
        raise ValueError('Duplicate measurement assets')
    if CSS not in html:
        theme = re.search(r'<link[^>]+href="/assets/css/sollahms-theme\.css[^>]*>', html)
        if not theme:
            raise ValueError('Missing shared theme')
        html = html[:theme.start()] + CSS + html[theme.start():]
    if MODULE not in html:
        if html.count('</body>') != 1:
            raise ValueError('Expected one body closing tag')
        html = html.replace('</body>', MODULE + '</body>', 1)
    return html
