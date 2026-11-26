"""Certify only the requested private address changed in Build Output routing."""
from pathlib import Path
from release_common import read, require, sha

DOCS = Path(__file__).resolve().parent
OLD = ['^/bonos-pie/acceso/?$', '^/bonos-pie/?$', '^/interno/bonos-pie/acceso/?$', '^/interno/bonos-pie/?$']

def validate_routes(output, baseline):
    saved = DOCS / 'baseline-routes.json'
    before, current = read(saved), read(output / 'config.json')
    row = next(r for r in baseline if r['path'] == 'config.json')
    require(sha(saved.read_bytes()) == row['sha256'], 'Saved configuration is not the current baseline')
    require([r['src'] for r in before['routes'][:4]] == OLD, 'Unexpected prior private routes')
    require(current['routes'][:2] == [
        {'src': '^/metadatos/acceso/?$', 'dest': '/api/interno-bonos-pie?op=login'},
        {'src': '^/metadatos/?$', 'dest': '/api/interno-bonos-pie'}], 'Wrong new private destinations')
    for route, old in zip(current['routes'][2:6], OLD):
        headers = route.get('headers', {})
        require(route['src'] == old and route.get('status') == 308 and 'dest' not in route and
                headers.get('Location') == ('/metadatos/acceso' if 'acceso' in old else '/metadatos') and
                'no-store' in headers.get('Cache-Control', '') and 'noindex' in headers.get('X-Robots-Tag', ''),
                'Legacy private redirect changed')
    require({**current, 'routes': current['routes'][6:]} == {**before, 'routes': before['routes'][4:]},
            'Public routes or another configuration field changed')
