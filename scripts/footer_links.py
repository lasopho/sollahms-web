"""Keep the public collaboration entry in the existing shared footer."""
import re

def apply_footer_links(page):
    start=page.find('<footer'); end=page.find('</footer>',start)
    if start<0 or end<0:return page
    footer=page[start:end]
    if 'href="/trabaja-con-nosotros.html"' in footer:return page
    match=re.search(r'<a\b[^>]*href="/privacidad.html"[^>]*>.*?</a>',footer,re.S)
    if match:
        link=match.group().replace('href="/privacidad.html"','href="/trabaja-con-nosotros.html"')
        link=re.sub(r' aria-current="page"','',link)
        link=re.sub(r'>.*?</a>','>Trabaja con nosotros</a>',link,flags=re.S)
        pos=start+match.start()
    else:
        link='<a href="/trabaja-con-nosotros.html">Trabaja con nosotros</a>';pos=end
    return page[:pos]+link+'\n'+page[pos:]
