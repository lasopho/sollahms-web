"""Shared, idempotent guide navigation. Only header/footer and its CSS link change."""
import re
from html import escape
CSS='<link rel="stylesheet" href="/assets/css/guide-navigation.css?v=20261029-1">'
def apply_guide_navigation(page,project=None):
    url='/guia-hipotecaria.html'
    if project and re.fullmatch(r'[a-z0-9-]+',project['slug']):url+='?proyecto='+project['slug']+'#simulador'
    def area(match):
        region=match[0]
        if 'data-guide-nav' in region:
            if project:region=re.sub(r'(<a\b[^>]*data-guide-nav[^>]*href=)[\"\'][^\"\']*[\"\']',lambda m:m[1]+'\"'+escape(url,quote=True)+'\"',region)
            return region
        def anchor(m):
            old=m[0]
            if re.search(r'href=[\"\']/contacto.html[\"\']',old) is None:return old
            link=re.sub(r'href=[\"\']/contacto.html[\"\']','href="'+escape(url,quote=True)+'"',old)
            link=re.sub(r' aria-current=[\"\'][^\"\']*[\"\']','',link)
            link=re.sub(r'>\s*Contacto\s*</a>', '>Guía hipotecaria</a>',link)
            if link==old or '>Guía hipotecaria</a>' not in link:return old
            link=link.replace('<a ','<a data-guide-nav="" ',1)
            return link+'\n'+old
        # Preserve list structure in homepage footer.
        region=re.sub(r'<li\b[^>]*>\s*<a\b[^>]*href=[\"\']/contacto.html[\"\'][^>]*>\s*Contacto\s*</a>\s*</li>',lambda m: re.sub(r'<a\b.*?</a>',lambda a: anchor(a).replace('</a>\n<a','</a></li>\n<li><a'),m[0],flags=re.S),region,flags=re.S)
        if 'data-guide-nav' not in region:region=re.sub(r'<a\b[^>]*>\s*Contacto\s*</a>',anchor,region)
        if 'data-guide-nav' not in region and region.startswith('<footer'):
            region=re.sub(r'<a\b[^>]*href="/trabaja-con-nosotros.html"[^>]*>Trabaja con nosotros</a>',lambda m:m[0].replace('<a ','<a data-guide-nav="" ',1).replace('/trabaja-con-nosotros.html',escape(url,quote=True)).replace('Trabaja con nosotros','Guía hipotecaria')+'\n'+m[0],region,count=1)
        return region
    page=re.sub(r'<(?:header|footer)\b[^>]*>.*?</(?:header|footer)>',area,page,flags=re.S)
    if 'data-guide-nav' in page and CSS not in page:
        # Theme remains last among page-specific styles.
        marker=re.search(r'<link[^>]+href=[\"\']/assets/css/sollahms-theme.css[^>]*>',page)
        page=page[:marker.start()]+CSS+'\n'+page[marker.start():] if marker else page.replace('</head>',CSS+'\n</head>',1)
    return page
