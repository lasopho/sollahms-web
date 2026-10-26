"""Idempotently include shared scroll motion without rewriting page contents."""
import re
from brand_identity import apply_brand_identity

SCRIPT = '<script src="/assets/js/scroll-presence.js?v=20261026-3" defer></script>'
THEME = '/assets/css/sollahms-theme.css?v=20261026-scroll-3'

def apply_scroll_presence(page):
    page = re.sub(r'/assets/css/sollahms-theme\.css(?:\?[^"\s>]*)?', THEME, page)
    page = re.sub(r'/assets/js/scroll-presence\.js(?:\?[^\"\s>]*)?', '/assets/js/scroll-presence.js?v=20261026-3', page)
    if '/assets/js/scroll-presence.js' not in page:
        assert '</head>' in page
        page = page.replace('</head>', SCRIPT + '\n</head>', 1)
    return apply_brand_identity(page)
