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
