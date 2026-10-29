"""Idempotent, narrowly scoped logo integration for pages and generators."""
import re
from footer_links import apply_footer_links
from guide_navigation import apply_guide_navigation
from purchase_stage_links import apply_stage_footer

CSS = '<link rel="stylesheet" href="/assets/css/sollahms-brand.css?v=20261026-1">'
SHARE = 'https://sollahms.cl/assets/branding/og-sollahms-square-v3.png'

def image(light=False, decorative=True):
    name = 'sollahms-logo-light.svg' if light else 'sollahms-logo.svg'
    return '<img class="sollahms-brand__image" src="/assets/branding/' + name + '" width="114" height="22" alt="' + ('' if decorative else 'Sollahms') + '" decoding="async">'

def apply_brand_identity(page):
    footer = page.find('<footer')
    def logo(match):
        opening, content = match.group(1), match.group(2)
        if re.sub(r'<[^>]+>', '', content).strip() not in ['Sollahms', 'Sollahms.']:
            return match[0]
        if not re.search(r'href=[\"\']/[\"\']', opening):
            return match[0]
        light = footer >= 0 and match.start() > footer and 'class="site-footer"' in page[footer:page.find('>', footer)]
        if 'class=' in opening:
            opening = re.sub(r'class="([^"]*)"', lambda m: 'class="' + m[1] + ' sollahms-brand"', opening)
        else:
            opening += ' class="sollahms-brand"'
        opening = re.sub(r' aria-label="[^"]*"', '', opening) + ' aria-label="Sollahms"'
        return '<a' + opening + '>' + image(light) + '</a>'
    page = re.sub(r'<a([^>]+)>(.*?)</a>', logo, page, flags=re.S)
    page = page.replace('<span class="text-xl font-black text-emerald-950">Sollahms</span>', '<span class="sollahms-brand">' + image(decorative=False) + '</span>')
    page = page.replace('https://sollahms.cl/assets/branding/og-sollahms-square-v2.jpg', SHARE)
    page = page.replace('content="image/jpeg"', 'content="image/png"') if SHARE in page else page
    page = page.replace('href="/assets/branding/favicon.svg"', 'href="/assets/branding/favicon.svg?v=20261026-logo-1"')
    # Identity schema is the transparent master; social composition stays a
    # distinct image with its existing text and layout.
    page = re.sub(r'("logo"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject",\s*"url"\s*:\s*)"' + re.escape(SHARE) + r'",\s*"width"\s*:\s*1254,\s*"height"\s*:\s*1254', r'\1"https://sollahms.cl/assets/branding/sollahms-logo.svg",\n        "width": 860,\n        "height": 162', page)
    if CSS not in page:
        page = page.replace('</head>', CSS + '\n</head>', 1)
    return apply_stage_footer(apply_guide_navigation(apply_footer_links(page)))

if __name__ == '__main__':
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    pages = list(root.glob('*.html')) + list((root / 'templates').glob('*.html'))
    for path in pages:
        before = path.read_text()
        after = apply_brand_identity(before)
        assert apply_brand_identity(after) == after, path
        if after != before:
            path.write_text(after)
    print('Updated logo references in', len(pages), 'public pages/templates')
