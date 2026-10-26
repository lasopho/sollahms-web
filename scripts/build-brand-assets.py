#!/usr/bin/env python3
"""Reproduce the approved wordmark from the original bundled font, never a substitute.

Asset-maintenance tool only; deployment serves the committed SVGs without font or
Python dependencies. Requires fonttools[woff], brotli and uharfbuzz.
"""
import hashlib
import io
import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/branding'
FONT = ROOT / 'assets/fonts/home/manrope-latin-variable.woff2'

def build():
    font = instantiateVariableFont(TTFont(FONT), {'wght': 800})
    font.flavor = None
    binary = io.BytesIO()
    font.save(binary)
    buffer = hb.Buffer()
    buffer.add_str('Sollahms.')
    buffer.guess_segment_properties()
    hb.shape(hb.Font(hb.Face(binary.getvalue())), buffer)
    glyphs = font.getGlyphSet()
    x = 0
    paths = []
    for info, position in zip(buffer.glyph_infos, buffer.glyph_positions):
        pen = SVGPathPen(glyphs)
        glyphs[font.getGlyphName(info.codepoint)].draw(TransformPen(pen, (1, 0, 0, -1, x + position.x_offset, 1530 - position.y_offset)))
        paths.append(pen.getCommands())
        x += position.x_advance - 130  # Original tracking: -.065em, 2000 UPM.
    # 60 units clear space around the original ink (including the gold period).
    for name, color in [('sollahms-logo.svg', '#003229'), ('sollahms-logo-light.svg', '#EEF3EE')]:
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="860" height="162" viewBox="20 0 8600 1620" role="img" aria-label="Sollahms">\n'
        svg += '<g fill="' + color + '">' + ''.join('<path d="' + p + '"/>' for p in paths[:-1]) + '</g>\n'
        svg += '<path fill="#E9C176" d="' + paths[-1] + '"/>\n</svg>\n'
        (OUT / name).write_text(svg)
    # The favicon uses the very same S outline, not an unrelated font/glyph.
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="40" fill="#003229"/><path fill="#EEF3EE" transform="translate(112 67) scale(.215)" d="' + paths[0] + '"/></svg>\n'
    (OUT / 'favicon.svg').write_text(icon)
    return {'font': str(FONT.relative_to(ROOT)), 'fontSha256': hashlib.sha256(FONT.read_bytes()).hexdigest(), 'weight': 800, 'trackingEm': -.065, 'unitsPerEm': 2000, 'viewBox': [20, 0, 8600, 1620], 'colors': {'green': '#003229', 'gold': '#E9C176', 'contrast': '#EEF3EE'}, 'source': 'Approved screenshot 2026-10-26 09:55:21, matched against the published .brand in project details.'}

if __name__ == '__main__':
    result = build()
    print(json.dumps(result, ensure_ascii=False, indent=2))
