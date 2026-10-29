"""Small idempotent insertions; never regenerate existing fiche bodies or forms."""
import re
from html import escape as e
from purchase_stage import project_stages
URL='/cuando-comprar-propiedad.html'
CSS='<link rel="stylesheet" href="/assets/css/purchase-stage-entry.css?v=20261029-1">'
def with_css(page):
    if CSS in page:return page
    marker=re.search(r'<link[^>]+href=[\"\']/assets/css/sollahms-theme.css[^>]*>',page)
    assert marker,'Shared theme required'
    return page[:marker.start()]+CSS+'\n'+page[marker.start():]
def apply_stage_footer(page):
    def footer(m):
        area=m[0]
        if 'data-purchase-guide-footer' in area:return area
        pattern=r'<a\b[^>]*data-guide-nav[^>]*>.*?</a>'
        a=re.search(pattern,area,re.S)
        if not a:return area
        new=re.sub(r'href=[\"\'][^\"\']*[\"\']','href="'+URL+'"',a[0]);new=re.sub(r' aria-current="[^"]*"','',new)
        new=new.replace('data-guide-nav','data-purchase-guide-footer').replace('Guía hipotecaria','Cuándo comprar')
        # Preserve <ul>/<li> semantics in the homepage footer.
        item=re.search(r'<li\b[^>]*>\s*'+re.escape(a[0])+r'\s*</li>',area,re.S)
        if item:return area[:item.end()]+'<li>'+new+'</li>'+area[item.end():]
        return area[:a.end()]+'\n'+new+area[a.end():]
    return re.sub(r'<footer\b.*?</footer>',footer,page,flags=re.S)
def apply_stage_project(page,project):
    stage=project_stages()[project['slug']]
    anchor=stage['mode'] if stage['eligible'] else 'verificar-etapa'
    note='' if stage['eligible'] else '<span>Confirma el estado y la disponibilidad de esta unidad antes de decidir.</span>'
    link='<p class="purchase-stage-context" data-purchase-stage-link data-scroll-static><a href="'+URL+'#'+anchor+'">Conoce las ventajas de comprar en esta etapa <span aria-hidden="true">↗</span></a>'+note+'</p>'
    if 'data-purchase-stage-link' in page:
        page=re.sub(r'<p\b[^>]*data-purchase-stage-link[^>]*>.*?</p>',lambda m:link,page,count=1,flags=re.S)
    else:
        pattern=r'<div class="ci-details">.*?</div>';m=re.search(pattern,page,re.S);assert m,project['slug']
        page=page[:m.end()]+link+page[m.end():]
    return apply_stage_footer(with_css(page))
def guide_card():
    return '<section class="purchase-guide-entry" aria-labelledby="purchase-guide-card-title" data-scroll-static><div><p class="purchase-guide-eyebrow">COMPARA LAS ETAPAS DE COMPRA</p><h2 id="purchase-guide-card-title">¿Cuándo te conviene comprar una propiedad?</h2><p>Descubre las diferencias entre comprar en blanco, en verde o con entrega inmediata y conoce qué alternativa puede ajustarse mejor a tus objetivos.</p></div><a href="'+URL+'">Comparar modalidades <span aria-hidden="true">↗</span></a></section>'
