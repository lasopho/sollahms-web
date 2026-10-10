"""Exact source exceptions for the separately authorized brochure review.

Historical validators keep their original baseline modes. This helper permits
only the eight reviewed pages against the last complete integration commit.
"""
import re

BASELINE = 'e903208160f62cc552e9efa4371a322ef75477b8'
INGEVEC = {'centenario-1', 'tocornal', 'vivaceta'}
AJ = {'downtown-san-martin', 'edificio-teatinos-750',
      'edificio-vista-amunategui', 'monjitas-690', 'vista-morande'}
REVIEW = INGEVEC | AJ
CSS = 'assets/css/aj-brochure-preview.css'
MOBILE_RULE = ('@media(max-width:600px){.ingevec-models .aj-metrics'
               '{grid-template-columns:repeat(2,minmax(0,1fr))}'
               '.ingevec-models .aj-metrics dd{overflow-wrap:anywhere}}\n')


def public_page(text, slug):
    if slug not in REVIEW:
        return text
    batch = 'INGEVEC' if slug in INGEVEC else 'AJ'
    text = re.sub(fr'<!--{batch}_PREVIEW_START-->.*?<!--{batch}_PREVIEW_END-->',
                  '', text, flags=re.S)
    return re.sub(fr'<!--{batch}_PUBLIC_START-->(.*?)<!--{batch}_PUBLIC_END-->',
                  r'\1', text, flags=re.S)


def verified_public_page(current, previous, slug):
    """No unreviewed markup is hidden by broad comment removal."""
    if slug in INGEVEC:
        assert public_page(current, slug) == previous, f'{slug}: original public fallback changed'
        assert '<!--INGEVEC_PREVIEW_START-->' in current
        assert '<!--INGEVEC_PUBLIC_START-->' in current
    elif slug in AJ:
        expected = re.sub(r'<!--AJ_PREVIEW_START-->.*?<!--AJ_PREVIEW_END-->',
                          lambda match: match[0].replace('Modelos y planos', 'Modelos y distribuciones').replace(
                              '<h3>Fuente documental de modelos e imágenes</h3>',
                              '<h3>Fuente documental de modelos e imágenes</h3><p class="aj-attribution">Material promocional proporcionado a Sollahms mediante Yapo/IRIS.</p>'),
                          previous, flags=re.S)
        assert current == expected, f'{slug}: change beyond exact AJ title and Yapo/IRIS attribution'
    else:
        assert current == previous, f'{slug}: unrelated page changed'
    return public_page(current, slug), public_page(previous, slug)


def verify_asset(path, current, previous):
    expected = previous + MOBILE_RULE.encode() if path == CSS else previous
    assert current == expected, f'{path}: existing asset changed'
