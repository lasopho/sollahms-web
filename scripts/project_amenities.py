"""One static, accessible amenity component for every project renderer.

Editorial facts stay in their project sources. This catalogue only normalizes
display labels and assigns reviewed SVGs. Unknown labels fail the build instead
of silently introducing a different icon family or an invented amenity.
"""
import argparse
import html
import json
import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CSS = '/assets/css/project-amenities.css?v=20261029-1'
CATALOG = json.loads((ROOT / 'data/amenities.json').read_text())

def key(value):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value)).strip().casefold()

LABELS = {}
for record in CATALOG['labels']:
    LABELS[key(record['source'])] = record
for record in CATALOG['labels']:
    LABELS.setdefault(key(record['label']), record)

def entry(label):
    try:
        return LABELS[key(label)]
    except KeyError:
        raise ValueError(f'Amenity without a reviewed icon: {label!r}. Add it to data/amenities.json.') from None

def icon(kind):
    return ('<svg class="am-icon" viewBox="0 0 24 24" width="26" height="26" fill="none" '
            'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" '
            f'aria-hidden="true" focusable="false">{CATALOG["icons"][kind]}</svg>')

def render_items(items, kind='amenities'):
    """items: source label strings, or {label, description}; no comma splitting."""
    rows = []
    seen = set()
    for item in items:
        source = item if isinstance(item, str) else item['label']
        description = '' if isinstance(item, str) else item.get('description', '')
        record = entry(source)
        label = record['label']
        identity = (key(label), key(description))
        if identity in seen:
            continue
        seen.add(identity)
        detail = f'<span class="am-description">{html.escape(description)}</span>' if description else ''
        rows.append(f'<li class="am-item" data-amenity-icon="{record["icon"]}">{icon(record["icon"])}'
                    f'<span class="am-copy"><span class="am-label">{html.escape(label)}</span>{detail}</span></li>')
    return f'<ul class="am-grid" data-amenity-group="{kind}">' + ''.join(rows) + '</ul>'

class SourceRanges(HTMLParser):
    """Replace only touched blocks; preserve unrelated HTML byte for byte."""
    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.offsets = [0]
        self.offsets.extend(m.end() for m in re.finditer('\n', source))
        self.stack = []
        self.ranges = {}
        self.feed(source)
    def position(self):
        line, col = self.getpos()
        return self.offsets[line - 1] + col
    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append((tag, self.position()))
    def handle_startendtag(self, tag, attrs):
        pass
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                _, start = self.stack[i]
                self.ranges[start] = self.position() + len(tag) + 3
                del self.stack[i:]
                break

def apply_amenities(page, project=None):
    project = project or {}
    soup = BeautifulSoup(page, 'html.parser')
    if not soup.main:
        return page
    ranges = SourceRanges(page)
    blocks = {}
    def touch(node):
        block = node if 'pj-block' in node.get('class', []) else node.find_parent(class_='pj-block')
        block = block or node.find_parent('section') or node
        start = ranges.offsets[block.sourceline-1] + block.sourcepos
        blocks[start] = block
        block['class'] = list(dict.fromkeys([*block.get('class', []), 'am-section']))
        return block

    # Project-specific duplicate source lists: retain all enriched conditions.
    consolidations = CATALOG.get('projectConsolidations', {}).get(project.get('slug'), {})
    equipment = soup.select_one('#equipamiento')
    if consolidations and equipment and equipment.select('ul.amenity-list'):
        lists = equipment.select('ul.amenity-list')
        if len(lists) >= 3:
            originals = [li.get_text(' ', strip=True) for li in lists[0].find_all('li', recursive=False)]
            enriched = [li.get_text(' ', strip=True) for li in lists[1].find_all('li', recursive=False)]
            if all(label in enriched or consolidations.get(label) in enriched for label in originals):
                touch(lists[0])
                lists[0].decompose()
                for li in lists[1].find_all('li', recursive=False):
                    if li.get_text(' ', strip=True) == 'Piscina templada y terrazas panorámicas':
                        li.string = 'Piscina panorámica templada y terrazas panorámicas'

    for ul in list(soup.main.select('ul.amenity-list,ul.plc-amenities,ul.plc-finishes,ul.am-grid')):
        section = ul.find_parent('section')
        heading = next((s for s in ul.previous_siblings if getattr(s, 'name', '') in ('h2','h3','h4')), None)
        title = heading.get_text(' ',strip=True) if heading else ''
        finishes = ul.get('data-amenity-group') == 'finishes' or 'plc-finishes' in ul.get('class',[]) or (section and section.get('id')=='terminaciones') or bool(re.search('terminaciones|características',title,re.I))
        kind = 'finishes' if finishes else 'amenities'
        items = []
        for li in ul.find_all('li', recursive=False):
            label = li.select_one('.am-label')
            source = label.get_text(' ', strip=True) if label else li.get_text(' ', strip=True)
            description = li.select_one('.am-description') if label else li.find('span') if li.find('strong') else None
            items.append({'label':source,'description':description.get_text(' ',strip=True) if description else ''})
        block = touch(ul)
        ul.replace_with(BeautifulSoup(render_items(items,kind),'html.parser').ul)
        if kind == 'amenities' and block.get('id') in ('equipamiento','caracteristicas') and block.get('data-nav-section') != 'caracteristicas':
            h2 = block.find('h2', recursive=False)
            if h2:
                h2.string = 'Equipamiento y áreas comunes'

    for heading in list(soup.main.find_all('h2')):
        title = heading.get_text(' ',strip=True)
        if title == 'Espacios y servicios':
            grid = heading.find_next_sibling('div')
            if grid and 'grid' in grid.get('class',[]):
                items = [x.get_text(' ',strip=True) for x in grid.find_all('div',recursive=False)]
                touch(grid)
                grid.replace_with(BeautifulSoup(render_items(items),'html.parser').ul)
                heading.string = 'Equipamiento y áreas comunes'
        elif title == 'Equipamiento y terminaciones':
            para = heading.find_next_sibling('p')
            if para:
                touch(para)
                para['class'] = list(dict.fromkeys([*para.get('class',[]),'am-prose']))

    # Pending sections remain pending: never fabricate a list from other projects.
    for section in soup.main.select('#equipamiento'):
        block = touch(section)
        heading = block.find('h2',recursive=False)
        if heading and block.get('data-nav-section') != 'caracteristicas':
            heading.string = 'Equipamiento y áreas comunes'

    for block in blocks.values():
        if block.get('data-nav-section') == 'caracteristicas':
            continue
        if block.get('id') in ('equipamiento','caracteristicas') or block.find('h2',string='Equipamiento y áreas comunes'):
            eyebrow = block.find('p',class_='eyebrow',recursive=False)
            if not eyebrow:
                eyebrow = soup.new_tag('p',attrs={'class':'eyebrow'})
                heading = block.find('h2',recursive=False)
                if heading:heading.insert_before(eyebrow)
            eyebrow.string = 'Características'

    for start, block in sorted(blocks.items(),reverse=True):
        page = page[:start] + str(block) + page[ranges.ranges[start]:]
    if '/assets/css/project-amenities.css' not in page:
        theme = re.search(r'<link\b[^>]*href=["\']/assets/css/sollahms-theme\.css[^>]*>',page)
        if not theme:
            raise ValueError('Shared theme must be present and last in the cascade')
        page = page[:theme.start()] + f'<link rel="stylesheet" href="{CSS}">\n' + page[theme.start():]
    return page

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true',help='Fail if generated fiches need updating')
    args=parser.parse_args()
    projects=json.loads((ROOT/'data/proyectos.json').read_text())
    changed=[]
    for project in projects:
        path=ROOT/project['detalleUrl'].split('#')[0].lstrip('/')
        old=path.read_text();new=apply_amenities(old,project)
        if old != new:
            changed.append(project['slug'])
            if not args.check:path.write_text(new)
    print(json.dumps({'projects':len(projects),'changed':changed},ensure_ascii=False))
    if args.check and changed:raise SystemExit(1)

if __name__=='__main__':main()
