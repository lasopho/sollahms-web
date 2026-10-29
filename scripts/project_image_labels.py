"""Owner-approved image labels; keep source/alt text and commercial notices.

This is a static rendering policy, not a client-side hiding rule. It touches only
image captions and standalone hero image badges. Plans and substantive notices
outside these labels are deliberately excluded.
"""
import re
from bs4 import BeautifulSoup, NavigableString

QUALIFIER = re.compile(r'\b(?:renders?|im[aá]genes?|imagen|representaci[oó]n(?:es)?)\b', re.I)

def caption_text(text):
    """Retain the useful scene description without a generic image-type label."""
    if not QUALIFIER.search(text):
        return text
    original = text
    text = re.sub(r'\s*[·—–]\s*(?:renders?|im[aá]genes?|imagen)\s+(?:referencial(?:es)?|ilustrativ[oa]s?)(?:\s+de\s+.*)?\s*$', '', text, flags=re.I)
    text = re.sub(r'^\s*(?:renders?|im[aá]genes?|imagen|representaci[oó]n(?:es)?)(?:\s+(?:referencial(?:es)?|ilustrativ[oa]s?|oficial(?:es)?))?\s*', '', text, flags=re.I)
    text = re.sub(r'^(exterior)\s+referencial\b', r'\1', text, flags=re.I)
    text = re.sub(r'^de (?:la |las |los |el )?', '', text, flags=re.I)
    text = re.sub(r'^del\s+', '', text, flags=re.I)
    text = re.sub(r'^a[eé]reo\b', 'Vista aérea', text, flags=re.I)
    text = re.sub(r'^nocturno\b', 'Vista nocturna', text, flags=re.I)
    text = re.sub(r'\s*[·—–]\s*Brochure\b.*$', '', text, flags=re.I)
    text = text.strip(' ·—–')
    return (text[:1].upper() + text[1:]) if text != original else original

def apply_image_label_policy(page):
    # Gallery introductions sometimes repeat the same generic visual label.
    # Retain facts needed to identify shared stages or residential/commercial areas.
    def image_notice(match):
        raw = match[0]
        node = BeautifulSoup(raw, 'html.parser').p
        text = node.get_text(' ', strip=True)
        if 'compartidas entre sus etapas y edificios' in text:
            node.string = 'Imágenes del conjunto, compartidas entre sus etapas y edificios. Abre cada imagen para verla completa.'
        elif text.startswith('Render identificado por Euro'):
            node.string = 'Vista exterior identificada por Euro para esta torre en su material oficial. Las imágenes del conjunto se conservan en su sección de contexto.'
        elif 'Verne residencial' in text:
            node.string = 'Vistas del brochure de Verne residencial, en un edificio de uso mixto. El documento distingue el acceso residencial del área comercial.'
        elif re.search(r'\b(?:render|referencial|ilustrativ)', text, re.I):
            return ''
        else:
            return raw
        return str(node)
    page = re.sub(r'<p\b[^>]*class="[^"]*\bimage-credit\b[^"]*"[^>]*>.*?</p>', image_notice, page, flags=re.S)
    for notice in (
        'Renders ilustrativos. Consulta fotografías del estado actual del proyecto.',
        'Representaciones ilustrativas del proyecto. No acreditan su estado actual ni la disponibilidad de una unidad.',
    ):
        page = re.sub(r'<p\b[^>]*>\s*'+re.escape(notice)+r'\s*</p>', '', page)
    page = page.replace('Imágenes referenciales del conjunto Froilán Roa 5731;', 'Imágenes del conjunto Froilán Roa 5731;')

    def caption(match):
        raw = match[0]
        soup = BeautifulSoup(raw, 'html.parser')
        node = soup.figcaption
        # A caption inside a plan card is not an image-type label: preserve it.
        if not QUALIFIER.search(node.get_text(' ', strip=True)):
            return raw
        changed = False
        for text in list(node.find_all(string=True, recursive=False)):
            result = caption_text(str(text))
            if result != str(text):
                text.replace_with(NavigableString(result))
                changed = True
        if not changed:
            return raw
        if not node.get_text(strip=True):
            return ''
        return str(node)
    page = re.sub(r'<figcaption\b[^>]*>.*?</figcaption>', caption, page, flags=re.S)

    # These are purely visual badges, not substantive commercial/legal prose.
    def hero_group(match):
        raw = match[0]
        return re.sub(r'<(?:p|span)\b[^>]*>\s*(?:Renders?|Im[aá]genes?|Imagen)\s+(?:referencial(?:es)?|ilustrativ[oa]s?)(?:\s+del conjunto)?\s*</(?:p|span)>', '', raw, flags=re.I)
    page = re.sub(r'<div\b[^>]*class="[^"]*\b(?:ci-details|hero-badges)\b[^"]*"[^>]*>.*?</div>', hero_group, page, flags=re.S)
    page = re.sub(r'<div\b[^>]*class="[^"]*\b(?:ci-details|hero-badges)\b[^"]*"[^>]*>\s*</div>', '', page)
    return page
