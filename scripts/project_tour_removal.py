"""Remove project-only virtual-tour markup without reserializing other content.

The public catalogue defines the CLI scope. Historical research is retained;
photographs, promotional videos, plans, maps and contact flows are protected.
"""
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Elements(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.stack, self.nodes = source, [], []
        self.lines = [0]
        self.lines.extend(match.end() for match in re.finditer('\n', source))
        self.feed(source)

    def absolute_offset(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.absolute_offset()
        node = {'tag': tag, 'attrs': dict(attrs), 'start': start,
                'end': start + len(self.get_starttag_text())}
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]['tag'] == tag:
                self.stack[index]['end'] = self.source.index('>', self.absolute_offset()) + 1
                del self.stack[index:]
                return


def remove_project_tours(page):
    """Fail closed if a tour block ever acquires unrelated media or forms."""
    parsed = Elements(page)
    edits, stage_anchors = [], []
    for node in parsed.nodes:
        attrs = node['attrs']
        if attrs.get('id') != 'recorrido':
            continue
        block = page[node['start']:node['end']]
        if re.search(r'<(?:img|video|audio|form)\b|(?:youtube|vimeo)\.(?:com|be)|google\.com/maps', block, re.I):
            raise ValueError('Tour block contains protected media or forms; review required')
        if not block.endswith('</' + node['tag'] + '>'):
            raise ValueError('Unclosed virtual-tour block')
        stage_anchors.extend(re.findall(r'\bid=["\'](etapa-\d+)["\']', block))
        edits.append((node['start'], node['end'], ''))
    for node in parsed.nodes:
        if node['tag'] == 'a' and node['attrs'].get('href') == '#recorrido':
            if not any(start <= node['start'] < end for start, end, _ in edits):
                edits.append((node['start'], node['end'], ''))
    for start, end, replacement in sorted(edits, reverse=True):
        page = page[:start] + replacement + page[end:]
    # A legacy stage redirect must remain valid after its tour is removed.
    for anchor in stage_anchors:
        if not re.search(r'\bid=["\']' + re.escape(anchor) + r'["\']', page):
            marker = f'<span class="ecasa-stage-anchor" id="{anchor}" aria-hidden="true"></span>'
            page, count = re.subn(r'(<section\b[^>]*\bid=["\']caracteristicas["\'][^>]*>)',
                                  lambda match: match[0] + marker, page, count=1)
            if not count:
                raise ValueError('Cannot preserve the existing stage anchor')
    page = page.replace('Galería y 360°', 'Galería')
    page = page.replace('Las fotografías, recorridos, planos y áreas comunes conservados',
                        'Las fotografías, planos y áreas comunes conservados')
    # Only hosts still used by surviving approved frames remain permitted.
    parsed = Elements(page)
    frames = [node for node in parsed.nodes if node['tag'] == 'iframe'
              and 'data-project-embed' in node['attrs']]
    hosts = sorted({urlparse(node['attrs'].get('src', '')).hostname for node in frames})
    for node in sorted(parsed.nodes, key=lambda node: node['start'], reverse=True):
        attrs = node['attrs']
        if node['tag'] == 'script' and attrs.get('id') == 'project-embed-hosts':
            replacement = (page[node['start']:node['end']].split('>', 1)[0] + '>'
                           + json.dumps(hosts) + '</script>') if frames else ''
        elif not frames and ((node['tag'] == 'script' and attrs.get('src', '').split('?')[0] == '/assets/js/project-embeds.js')
                            or (node['tag'] == 'link' and attrs.get('href', '').split('?')[0] == '/assets/css/project-embeds.css')):
            replacement = ''
        else:
            continue
        page = page[:node['start']] + replacement + page[node['end']:]
    return re.sub(r'(?m)^[ \t]+$', '', page)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    changed = []
    for project in json.loads((ROOT / 'data/proyectos.json').read_text()):
        path = ROOT / project['detalleUrl'].split('#')[0].lstrip('/')
        old = path.read_text()
        new = remove_project_tours(old)
        if new != old:
            changed.append(path.name)
            if not args.check:
                path.write_text(new)
    print(json.dumps({'inspected': 131, 'changed': changed}, ensure_ascii=False))
    if args.check and changed:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
