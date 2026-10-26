"""Idempotently include shared scroll motion without rewriting page contents."""
import re

SCRIPT = '<script src="/assets/js/scroll-presence.js?v=20261026-2" defer></script>'
THEME = '/assets/css/sollahms-theme.css?v=20261026-scroll-2'

def apply_scroll_presence(page):
    page = re.sub(r'/assets/css/sollahms-theme\.css(?:\?[^"\s>]*)?', THEME, page)
    page = re.sub(r'/assets/js/scroll-presence\.js(?:\?[^\"\s>]*)?', '/assets/js/scroll-presence.js?v=20261026-2', page)
    if '/assets/js/scroll-presence.js' not in page:
        assert '</head>' in page
        page = page.replace('</head>', SCRIPT + '\n</head>', 1)
    return page
