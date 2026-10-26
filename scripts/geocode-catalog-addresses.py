"""One-off structured address review. Single thread, persistent cache, <=1 req/s.

This collects candidates only. A human review must approve each registry entry.
Never run from the website or treat street-only results as project coordinates.
"""
import json, re, time, urllib.request, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs/catalog-address-pins-20261026'
DEST.mkdir(exist_ok=True)
CACHE = DEST / 'structured-geocoding.json'
records = json.loads(CACHE.read_text()) if CACHE.exists() else {}
projects = json.loads((ROOT / 'data/proyectos.json').read_text())
locations = json.loads((ROOT / 'data/project-locations.json').read_text())['locations']
last_request = 0
failures = 0
for project in projects:
    slug = project['slug']
    if slug in locations or slug in records or not project.get('direccion'):
        continue
    address = project['direccion'].split(',')[0]
    if not re.search(r'\d', address):
        continue
    street = re.sub(r'^(?:Calle|Av\.?|Avda\.?|Avenida)\s+', '', address, flags=re.I)
    street = re.sub(r'\s+N[.º°o]*\s*', ' ', street, flags=re.I)
    match = re.match(r'(.+?)\s+(\d+)\s*$', street)
    if match:
        street = match[2] + ' ' + match[1]
    params = {'street': street, 'city': project['comuna'], 'country': 'Chile',
              'format': 'jsonv2', 'addressdetails': 1, 'limit': 5}
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(params)
    time.sleep(max(0, 1.2 - (time.monotonic() - last_request)))
    last_request = time.monotonic()
    record = {'address': project['direccion'], 'commune': project['comuna'],
              'query': params, 'url': url, 'checkedOn': '2026-10-26'}
    try:
        request = urllib.request.Request(url, headers={
            'User-Agent': 'SollahmsCatalogueAddressReview/1.0 (+https://sollahms.cl/contacto.html)'})
        with urllib.request.urlopen(request, timeout=15) as response:
            record['results'] = json.load(response)
        failures = 0
    except Exception as error:
        record['error'] = str(error)
        failures += 1
    records[slug] = record
    CACHE.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    print(slug, len(record.get('results', [])), record.get('error', ''), flush=True)
    if failures >= 3:
        print('Stopped after three errors; cached responses preserved.', flush=True)
        break
