"""Render this run's reviewed Markdown locally; reuse the 19-Nov report CSS method.

No APIs, packages, external resources or account writes. Only report.html is written.
"""
import argparse
import html
import re
import unicodedata
from pathlib import Path


def inline(value):
    value = html.escape(value)
    value = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
                   lambda m: '<a href="' + m[2] + '" target="_blank" rel="noopener">' + m[1] + '</a>', value)
    value = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', value)
    return re.sub(r'`([^`]+)`', r'<code>\1</code>', value)


def slug(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')


def render(markdown):
    lines = markdown.splitlines()
    title = lines.pop(0).removeprefix('# ')
    parts, headings = [], []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        heading = re.fullmatch(r'(#{2,3}) (.+)', line)
        if heading:
            level, text = len(heading[1]), heading[2]
            ident = slug(text)
            parts.append(f'<h{level} id="{ident}">{inline(text)}</h{level}>')
            if level == 2:
                headings.append((ident, text))
            i += 1
        elif line.startswith('|'):
            table = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table.append([s.strip() for s in lines[i].strip().strip('|').split('|')])
                i += 1
            if len(table) < 3 or not all(re.fullmatch(r':?-+:?', c) for c in table[1]):
                raise ValueError('Malformed controlled report table')
            headers, rows = table[0], table[2:]
            if len(headers) > 5 or any(len(r) != len(headers) for r in rows):
                raise ValueError('Report tables must have at most five consistent columns')
            numeric = [all(re.fullmatch(r'[+−-]?\d+(?:\s*→\s*\d+)?', row[j]) for row in rows)
                       for j in range(len(headers))]
            cells = lambda row, tag: ''.join('<' + tag + (' class="n"' if numeric[j] else '') + '>' + inline(cell) + '</' + tag + '>' for j, cell in enumerate(row))
            parts.append('<div class="tw"><table><thead><tr>' + cells(headers, 'th') + '</tr></thead><tbody>'
                         + ''.join('<tr>' + cells(row, 'td') + '</tr>' for row in rows) + '</tbody></table></div>')
        else:
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].startswith(('#', '|')):
                paragraph.append(lines[i].strip())
                i += 1
            parts.append('<p>' + inline(' '.join(paragraph)) + '</p>')
    return title, headings, '\n'.join(parts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report-skill', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    title, headings, article = render((root / 'report.md').read_text())
    # Same extraction as the 19-Nov generator; never import its obsolete prose/data.
    starter = args.report_skill.read_text().split('## Starter template', 1)[1]
    match = re.search(r'<style>(.*?)</style>', starter, re.S)
    if match is None:
        raise ValueError('No report starter CSS found')
    toc = ''.join(f'<li><a href="#{ident}">{html.escape(text)}</a></li>' for ident, text in headings)
    document = '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + html.escape(title) + '</title><style>' + match[1] + '</style></head><body><div class="shell"><header><h1>' + html.escape(title) + '</h1><p class="byline">Sollahms · 25 de noviembre de 2026 · Comparación anterior a la publicación de hoy</p></header><div class="body"><aside class="rail"><div class="sticky"><p class="toc-label">Contenido</p><nav class="toc" aria-label="Contenido"><ol>' + toc + '</ol></nav></div></aside><article>' + article + '</article></div><footer>Datos de GSC hasta el 23/11/2026. Informe local; publicación del 25/11 medida por separado.</footer></div></body></html>'
    if '<script' in document.lower() or '`' in document or '${' in document:
        raise ValueError('Unexpected executable or template syntax')
    (root / 'report.html').write_text(document)
    print(f'Wrote report.html: {len(document.encode())} bytes; no network requests')


if __name__ == '__main__':
    main()
