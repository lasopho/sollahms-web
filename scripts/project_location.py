"""Keep reviewed address attribution in regenerated fiches; no commercial edits."""
import html
import re

def apply_project_location(page, project):
    evidence = project.get('addressVerification')
    if not evidence:
        return page
    esc = lambda value: html.escape(value, quote=True)
    note = '<p class="price-note" data-address-source="official">Dirección informada por <a href="'+esc(evidence['source'])+'" target="_blank" rel="noopener noreferrer">'+esc(evidence['publisher'])+'</a>.'
    if evidence.get('publicNote'):
        note += ' '+esc(evidence['publicNote'])
    note += '</p>'
    match = re.search(r'<section\b[^>]*\bid="ubicacion"[^>]*>.*?</section>', page, re.S)
    if not match:
        raise ValueError('Missing location section: '+project['slug'])
    section = re.sub(r'<p\b[^>]*\bdata-address-source="official"[^>]*>.*?</p>', '', match[0], flags=re.S)
    section = section.replace('</section>', note+'</section>')
    return page[:match.start()]+section+page[match.end():]
