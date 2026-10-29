"""Single reusable final attribution block; educational provenance stays in sourceIds."""
from html import escape as e

def render_references(content):
    config=content['references'];registry={s['id']:s for s in content['sources']}
    def link(source):return '<a href="'+e(source['url'],quote=True)+'" target="_blank" rel="noopener">'+e(source['title'])+' ↗</a>'
    others=''.join('<li>'+link(registry[key])+'<span>'+e(registry[key]['publisher'])+'</span></li>' for key in config['otherSourceIds'])
    return '<section class="gh-references" id="fuentes" aria-labelledby="gh-references-title" data-scroll-static><div class="gh-wrap"><h2 id="gh-references-title">'+e(config['title'])+'</h2><p>'+e(config['attribution'])+'</p><p><strong>Fuente:</strong> '+link(registry[config['primarySourceId']])+'</p><ul class="gh-reference-list" aria-label="Otras fuentes oficiales">'+others+'</ul><p>'+e(config['independence'])+'</p><p>'+e(config['ownCalculations'])+'</p><p id="herramientas-oficiales">Herramienta externa: '+link(config['officialSimulator'])+'</p><p class="gh-reference-date">Revisión del contenido: <time datetime="'+e(content['researchDate'])+'">29 de octubre de 2026</time>. '+e(config['maintenance'])+'</p></div></section>'
