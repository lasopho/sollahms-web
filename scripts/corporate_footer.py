"""Render the one approved homepage footer without touching the page body.

This helper does not generate pages, read content registries or build assets.
It replaces exactly one complete footer and includes only its isolated CSS.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'templates/corporate-footer.html'
CSS = '<link rel="stylesheet" href="/assets/css/corporate-footer.css">'
FOOTER = re.compile(r'<footer\b[^>]*>[\s\S]*?</footer>', re.I)
CSS_LINK = re.compile(
    r'<link\b(?=[^>]*\bhref=["\']/assets/css/corporate-footer\.css(?:\?[^"\']*)?["\'])'
    r'[^>]*>(?:\r?\n)?', re.I)


def render_corporate_footer():
    return TEMPLATE.read_bytes().decode('utf-8').rstrip('\r\n')


def apply_corporate_footer(page):
    """Return one canonical footer and one final stylesheet; preserve other bytes."""
    assert len(FOOTER.findall(page)) == 1, 'Exactly one complete footer is required.'
    assert page.count('</head>') == 1, 'Exactly one head closing tag is required.'
    page, count = FOOTER.subn(lambda _: render_corporate_footer(), page)
    assert count == 1
    page, links = CSS_LINK.subn('', page)
    assert links <= 1, 'Duplicate corporate footer stylesheet links are not accepted.'
    eol = '\r\n' if '\r\n' in page else '\n'
    return page.replace('</head>', CSS + eol + '</head>', 1)
