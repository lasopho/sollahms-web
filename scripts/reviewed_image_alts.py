"""Apply only visually reviewed descriptions to their exact existing images.

The source markup is never serialized: only the quoted alt value is replaced.
Catalogue attribution, descriptive captions and source media stay unchanged.
"""
from collections import Counter
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REGISTER = 'data/reviewed-image-alts.json'
REGISTER_SHA256 = '392be9fba624263c3e907bbd2b07cb2fe4f0729578f10d75ceea3cdd0e7d9867'
ATTRIBUTE_VALUE = re.compile(r'''(?P<name>[^\s"'<>/=]+)\s*=\s*(?:(?P<quote>["'])(?P<value>.*?)(?P=quote)|(?P<bare>[^\s"'=<>`]+))''', re.S)


class ImageTags(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=False)
        self.images = []
        self.line_starts = [0]
        self.line_starts.extend(match.end() for match in re.finditer('\n', page))
        self.feed(page)

    def handle_starttag(self, tag, attrs):
        if tag != 'img':
            return
        line, column = self.getpos()
        self.images.append({'start': self.line_starts[line - 1] + column,
                            'tag': self.get_starttag_text(), 'attrs': attrs})


def load_register(root=ROOT):
    raw = (Path(root) / REGISTER).read_bytes()
    if hashlib.sha256(raw).hexdigest() != REGISTER_SHA256:
        raise ValueError('Unreviewed image-description register')
    register = json.loads(raw)
    assert register['schemaVersion'] == 1
    assert register['summary']['imagesReviewed'] == len(register['images']) == 331
    assert register['summary']['altOccurrences'] == sum(row['occurrences'] for row in register['replacements']) == 512
    assert register['summary']['fiches'] == len({row['slug'] for row in register['replacements']}) == 94
    assert len({row['src'] for row in register['images']}) == 331
    return register


def verify_image(root, record):
    src = record['src']
    if not re.fullmatch(r'/assets/propiedades/(?:catalogo/[0-9a-f]{24}\.webp|inn-puerto-chico-principal\.webp|suecia-principal\.webp)', src):
        raise ValueError('Unreviewed image path')
    path = Path(root).resolve() / src.lstrip('/')
    if path.resolve() != path or not path.is_file():
        raise ValueError('Reviewed image must be a regular local file: ' + src)
    if hashlib.sha256(path.read_bytes()).hexdigest() != record['sha256']:
        raise ValueError('Reviewed image SHA-256 mismatch: ' + src)


def apply_reviewed_image_alts(page, slug, root=ROOT, strict=False):
    """Preserve every byte except approved alt values; repeated calls are stable.

    Strict mode checks the complete reviewed occurrence inventory for a current
    fiche. Renderers can produce a subset without inventing new associations.
    """
    register = load_register(root)
    if slug not in register['catalogueSlugs']:
        raise ValueError('Unknown catalogue slug for reviewed images: ' + str(slug))
    scope = {row['src']: row for row in register['replacements'] if row['slug'] == slug}
    if not scope:
        return page
    images = {row['src']: row for row in register['images']}
    edits, seen, verified = [], Counter(), set()
    for image in ImageTags(page).images:
        attrs = dict(image['attrs'])
        src, old_alt = attrs.get('src'), attrs.get('alt')
        target = scope.get(src)
        if target is None:
            continue
        description = images[src]['description']
        if old_alt not in (target['oldAlt'], description):
            # Existing descriptive alternatives are not part of this batch.
            continue
        if any(sum(key == name for key, _ in image['attrs']) != 1 for name in ('src', 'alt')):
            raise ValueError('Ambiguous image attributes: ' + src)
        if src not in verified:
            verify_image(root, images[src])
            verified.add(src)
        seen[src] += 1
        if old_alt == description:
            continue
        matches = [match for match in ATTRIBUTE_VALUE.finditer(image['tag']) if match['name'].lower() == 'alt']
        if len(matches) != 1 or not matches[0]['quote'] or html.unescape(matches[0]['value']) != old_alt:
            raise ValueError('Image alt is not a unique quoted attribute: ' + src)
        match = matches[0]
        edits.append((image['start'] + match.start('value'),
                      image['start'] + match.end('value'), html.escape(description, quote=True)))
    if strict and dict(seen) != {src: row['occurrences'] for src, row in scope.items()}:
        raise ValueError('Reviewed image occurrence inventory differs: ' + slug)
    for start, end, replacement in reversed(edits):
        page = page[:start] + replacement + page[end:]
    return page
