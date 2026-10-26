#!/usr/bin/env python3
"""Check identity coverage and the narrowly scoped differences from production."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
from brand_identity import apply_brand_identity, CSS, SHARE

ROOT = Path(__file__).resolve().parents[1]
BASE = 'fce795b8c4694e9b17ebb79b0119399fa38370e3'
checks = []
def check(name, condition):
    checks.append({'check': name, 'ok': bool(condition)})
    if not condition:
        raise AssertionError(name)

pages = sorted(ROOT.glob('*.html'))
count = 0
for path in pages:
    source = path.read_text()
    soup = BeautifulSoup(source, 'html.parser')
    logos = soup.select('a.sollahms-brand')
    count += len(logos)
    check(path.name + ': shared header/footer', len(logos) == (1 if path.name == '404.html' else 2))
    check(path.name + ': no text logo variants', all(a.get_text(strip=True) not in ['Sollahms','Sollahms.'] for a in soup.find_all('a')))
    check(path.name + ': shared styles and identity', CSS in source and all(a.get('aria-label') == 'Sollahms' and a.get('href') == '/' and a.img and a.img.get('src') in ['/assets/branding/sollahms-logo.svg','/assets/branding/sollahms-logo-light.svg'] for a in logos))
    check(path.name + ': social/favicon references', 'og-sollahms-square-v2.jpg' not in source and 'favicon.svg?v=20261026-logo-1' in source)
    check(path.name + ': idempotent generator', apply_brand_identity(source) == source)
    old = subprocess.check_output(['git','show',BASE + ':' + path.name],cwd=ROOT,text=True)
    expected = apply_brand_identity(old)
    if path.name == 'proyectos.html':
        expected = expected.replace("placeholder.append(element('strong', 'Sollahms'), element('span', 'Fotografía oficial pendiente'));", "const brand = element('img', undefined, 'sollahms-brand__image');\n            brand.src = '/assets/branding/sollahms-logo-light.svg';\n            brand.alt = 'Sollahms';\n            brand.width = 114; brand.height = 22;\n            placeholder.append(brand, element('span', 'Fotografía oficial pendiente'));")
    check(path.name + ': only authorized logo changes', source == expected)
    # Metadata text, headings, commercial content and forms are preserved by
    # the exact constrained transformation above, not regenerated or serialized.

ns = {'s':'http://www.w3.org/2000/svg'}
variants = [ET.parse(ROOT / 'assets/branding' / p).getroot() for p in ['sollahms-logo.svg','sollahms-logo-light.svg']]
check('same exact outlines in both contrast variants', [p.attrib['d'] for p in variants[0].findall('.//s:path',ns)] == [p.attrib['d'] for p in variants[1].findall('.//s:path',ns)])
check('outlined logo without font dependency', all(not v.findall('.//s:text',ns) for v in variants))
check('approved colors and inseparable dot', variants[0].find('s:g',ns).get('fill') == '#003229' and all(v.findall('s:path',ns)[0].get('fill') == '#E9C176' for v in variants))
for path in ['data/proyectos.json','data/hipotecario.json','assets/js/scroll-presence.js','assets/css/sollahms-theme.css','assets/css/project-header-b.css','sitemap.xml','robots.txt']:
    old=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
    check(path + ': exact published bytes', old == (ROOT/path).read_bytes())
config=json.loads((ROOT/'vercel.json').read_text())
check('manual deploys only', config['git']['deploymentEnabled']['main'] is False and config['git']['deploymentEnabled']['codex/unified-logo-20261026'] is False)
report={'base':BASE,'publicPages':len(pages),'projectDetails':len(json.loads((ROOT/'data/proyectos.json').read_text())),'headerFooterLogos':count,'checks':checks}
(ROOT/'docs/unified-logo-20261026/local-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pages':len(pages),'logos':count,'checksPassed':len(checks)}))
