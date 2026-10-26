"""Opt in only the homepage photographs and active project media, byte-preserving."""
import re
from bs4 import BeautifulSoup

CSS = '<link rel="stylesheet" href="/assets/css/image-parallax.css?v=20261026-1">'
SCRIPT = '<script src="/assets/js/image-parallax.js?v=20261026-1" defer></script>'

def apply_image_parallax(page):
    # Regeneration can replace a gallery while retaining its head resources.
    # Re-apply the opt-in instead of skipping newly generated photographs.
    page = page.replace(CSS + '\n', '').replace(SCRIPT + '\n', '')
    page = re.sub(r'<span class="s-parallax-frame">(<img\b[^>]*>)</span>', r'\1', page)
    soup = BeautifulSoup(page, 'html.parser')
    fiche = soup.html and soup.html.get('data-project-header') == 'b'
    home = soup.body and 'home-fluid-b2' in soup.body.get('class', [])
    if not (fiche or home):
        return page
    selector = '.ci-visual img, #galeria .gallery-grid img, #galeria .featured-gallery img' if fiche else '#portfolio img'
    selected = {str(i.get('src', '')) for i in soup.select(selector)}
    def wrap(m):
        img = BeautifulSoup(m[0], 'html.parser').img
        if img.get('src', '') not in selected or 'sollahms-brand__image' in img.get('class', []):
            return m[0]
        return '<span class="s-parallax-frame">' + m[0] + '</span>'
    page = re.sub(r'<img\b[^>]*>', wrap, page)
    # The existing shared theme still has final say; its gradients/fades are untouched.
    marker = '<link rel="stylesheet" href="/assets/css/sollahms-theme.css'
    if marker in page:
        page = page.replace(marker, CSS + '\n' + marker, 1)
    else:
        page = page.replace('</head>', CSS + '\n</head>', 1)
    return page.replace('</head>', SCRIPT + '\n</head>', 1)
