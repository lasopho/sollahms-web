#!/usr/bin/env python3
"""Read-only release checks; never submits a commercial or financial request."""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, urllib.request, urllib.error

ap = argparse.ArgumentParser()
ap.add_argument('--output', required=True)
ap.add_argument('--report', required=True)
args = ap.parse_args()
out = Path(args.output)
paths = {p: 200 for p in [
    '/', '/proyectos.html', '/assets/css/catalog.css', '/assets/js/catalog.mjs',
    '/assets/js/catalog-model.mjs', '/data/proyectos.json', '/sitemap.xml',
    '/assets/js/scroll-presence.js', '/assets/css/sollahms-theme.css',
    '/assets/branding/sollahms-logo.svg', '/assets/branding/og-sollahms-square-v3.png',
    '/assets/css/project-header-b.css', '/contacto.html', '/agenda-asesoria.html',
    '/pintor-cicarelli-i.html', '/reserva-mayor-2.html', '/edificio-dual-390-lto.html',
    '/assets/js/commercial-fields.mjs', '/assets/js/project-request.mjs',
    '/assets/js/purchase-capacity-ui.mjs', '/data/hipotecario.json', '/api/uf'
]}
paths.update({'/api/contact': 405, '/api/advisory': 405,
              '/docs/catalog-views-20261026/candidate-hashes.json': 404})
projects = json.loads((out/'data/proyectos.json').read_text())
for slug in ['distrito-centro', 'reserva-mayor-2', 'edificio-dual-390-lto', 'pintor-cicarelli-i']:
    paths[next(p['imagenPrincipal'] for p in projects if p['slug'] == slug)] = 200

def check(pair):
    path, expected = pair
    try:
        try:
            response = urllib.request.urlopen('https://sollahms.cl'+path, timeout=35)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read()
        result = {'path': path, 'status': response.code, 'expected': expected, 'ok': response.code == expected}
        if expected == 200 and path != '/api/uf':
            local = out/('index.html' if path == '/' else path[1:])
            result['matchesArtifact'] = body == local.read_bytes()
            result['sha256'] = hashlib.sha256(body).hexdigest()
            result['ok'] &= result['matchesArtifact']
        if path == '/api/uf':
            result['uf'] = json.loads(body)
        if path == '/data/proyectos.json':
            records = json.loads(body)
            result['count'] = len(records)
            result['unique'] = len({p['slug'] for p in records})
            result['ok'] &= result['count'] == result['unique'] == 132
        return result
    except Exception as error:
        return {'path': path, 'ok': False, 'error': str(error)}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(check, paths.items()))
report = {'domain': 'https://sollahms.cl', 'deployment': 'dpl_6NyvfFF8TH3734zmPLLKbkpCoTP6',
          'codeCommit': '1302c57b14b596253fc35964632a8204ecad9847', 'checks': len(results),
          'passed': sum(x['ok'] for x in results), 'results': results}
Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k != 'results'}))
print(json.dumps([x for x in results if not x['ok'] or x['path'] == '/api/uf'], ensure_ascii=False))
assert all(x['ok'] for x in results)
