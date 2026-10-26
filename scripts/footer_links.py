"""Keep the public collaboration entry with section links, preserving list semantics."""
import re

def apply_footer_links(page):
    start=page.find('<footer'); end=page.find('</footer>',start)
    if start<0 or end<0:return page
    footer=page[start:end]
    # Repair old fiche links accidentally appended after the shared container.
    repaired=re.sub(r'(</div>)\s*<a href="/trabaja-con-nosotros.html">Trabaja con nosotros</a>\s*$',r'\1',footer)
    if repaired!=footer:
        page=page[:start]+repaired+page[end:]
        end=start+len(repaired);footer=repaired
    if 'href="/trabaja-con-nosotros.html"' in footer:return page
    # A section list gets its own item after Contacto, never in the Legal group.
    item=re.search(r'<li\b[^>]*>\s*<a\b[^>]*href="/contacto.html"[^>]*>Contacto</a>\s*</li>',footer,re.S)
    anchor=re.search(r'<a\b[^>]*href="/contacto.html"[^>]*>Contacto</a>',footer,re.S)
    match=item or anchor
    if match:
        link=match.group().replace('href="/contacto.html"','href="/trabaja-con-nosotros.html"').replace('>Contacto</a>','>Trabaja con nosotros</a>')
        link=re.sub(r' aria-current="page"','',link)
        pos=start+match.end()
        return page[:pos]+'\n'+link+page[pos:]
    match=re.search(r'<a\b[^>]*href="/privacidad.html(?:#[^"]*)?"[^>]*>.*?</a>',footer,re.S)
    if match:
        link=re.sub(r'href="/privacidad.html(?:#[^"]*)?"','href="/trabaja-con-nosotros.html"',match.group())
        link=re.sub(r' aria-current="page"','',link)
        link=re.sub(r'>.*?</a>','>Trabaja con nosotros</a>',link,flags=re.S)
        pos=start+match.start()
    else:
        link='<a href="/trabaja-con-nosotros.html">Trabaja con nosotros</a>';pos=end
    return page[:pos]+link+'\n'+page[pos:]
