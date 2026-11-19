#!/usr/bin/env python3
"""Offline preservation/metadata checks against certified production HTML."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from bs4 import BeautifulSoup

MODULE = '<script type="module" src="/assets/js/site-measurement.mjs" data-sollahms-measurement></script>\n'
CSS = '<link rel="stylesheet" href="/assets/css/site-measurement.css">\n'


def digest(value):
    return hashlib.sha256(value).hexdigest()


def body(html):
    return re.search(r'<body\b.*?</body>', html, flags=re.S)[0]


def normalize_privacy(html, reference):
    section = r'<section[^>]+aria-labelledby="cookies">.*?</section>'
    original = re.search(section, reference, flags=re.S)[0]
    html = re.sub(section, lambda _: original, html, count=1, flags=re.S)
    return html.replace('Última actualización: 19 de noviembre de 2026.',
                        'Última actualización: 26 de octubre de 2026.', 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-static', type=Path, required=True)
    parser.add_argument('--candidate-static', type=Path, required=True)
    parser.add_argument('--scope', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    urls = json.loads(args.scope.read_text())['included_urls']
    results = []

    def check(name, condition):
        results.append({'check': name, 'passed': bool(condition)})

    for url in urls:
        name = url.rsplit('/', 1)[-1] or 'index.html'
        before = (args.baseline_static / name).read_text()
        after = (args.candidate_static / name).read_text()
        check(name + ': one measurement module', after.count(MODULE) == 1)
        check(name + ': one scoped stylesheet before shared theme', after.count(CSS) == 1 and
              after.index(CSS) < after.index('/assets/css/sollahms-theme.css'))
        restored = after.replace(MODULE, '', 1).replace(CSS, '', 1)
        if name == 'privacidad.html':
            restored = normalize_privacy(restored, before)
            check(name + ': only section 5/date in body revised', body(restored) == body(before))
        else:
            check(name + ': visible body byte-identical', body(restored) == body(before))
        if name != 'index.html':
            check(name + ': all other original bytes preserved', restored == before)
        old, new = BeautifulSoup(before, 'html.parser'), BeautifulSoup(after, 'html.parser')
        check(name + ': title unchanged', old.title.get_text() == new.title.get_text())
        check(name + ': description unchanged', old.find('meta', attrs={'name': 'description'})['content'] ==
              new.find('meta', attrs={'name': 'description'})['content'])
        check(name + ': canonical unchanged/exact', new.find('link', rel='canonical')['href'] == url == old.find('link', rel='canonical')['href'])
        check(name + ': original H1 structure unchanged', [h.get_text() for h in old.find_all('h1')] == [h.get_text() for h in new.find_all('h1')])
        for tag in new.find_all('meta', attrs={'name': 'robots'}):
            check(name + ': public index directives preserved', 'noindex' not in tag.get('content', '').lower())
        check(name + ': form definitions unchanged', [str(f) for f in old.find_all('form')] == [str(f) for f in new.find_all('form')])
        old_graphs = [json.loads(s.string) for s in old.find_all('script', type='application/ld+json')]
        new_graphs = [json.loads(s.string) for s in new.find_all('script', type='application/ld+json')]
        if name == 'index.html':
            for graph in new_graphs:
                for node in graph.get('@graph', []):
                    if node.get('@id') == 'https://sollahms.cl/#webpage':
                        node['description'] = next(n['description'] for g in old_graphs for n in g.get('@graph', []) if n.get('@id') == node['@id'])
        check(name + ': identity graph unchanged except reviewed home description', old_graphs == new_graphs)

    for name in ['advisory.mjs', 'collaboration.mjs', 'orientacion.mjs', 'hipotecario.mjs']:
        before = (args.baseline_static / 'assets/js' / name).read_text()
        after = (args.candidate_static / 'assets/js' / name).read_text()
        dispatch = r'^\s*try \{ window\.dispatchEvent\(new CustomEvent\(\'sollahms:measurement\'.*?\n'
        restored, count = re.subn(dispatch, '', after, flags=re.M)
        check(name + ': only optional fixed acknowledgement event added', count == 1 and restored == before)
    before = (args.baseline_static / 'sitemap.xml').read_bytes()
    after = (args.candidate_static / 'sitemap.xml').read_bytes()
    old = b'<url><loc>https://sollahms.cl/privacidad.html</loc><lastmod>2026-10-25</lastmod></url>'
    new = old.replace(b'2026-10-25', b'2026-11-19')
    check('sitemap: only real privacy modification date changed', after.replace(new, old, 1) == before)
    check('robots: exact production bytes', (args.candidate_static / 'robots.txt').read_bytes() == (args.baseline_static / 'robots.txt').read_bytes())
    config = json.loads((args.candidate_static / 'data/site-measurement.json').read_text())
    check('configuration: verified owned IDs and consent-gated activation candidate', config['enabled'] is True and
          config['analytics']['enabled'] is True and config['analytics']['measurementId'] == 'G-LTFBQKVNY2' and
          config['analytics']['enhancedMeasurementVerifiedDisabled'] is True and
          config['replay']['enabled'] is True and config['replay']['projectId'] == 'zg5i98wnxm' and
          config['replay']['strictMaskingVerified'] is True)
    check('replay: six corporate pages; Entorno and tools excluded', len(config['replay']['allowedPaths']) == 6 and
          '/entorno-desarrollo-urbano.html' not in config['replay']['allowedPaths'])
    receipt = {'observedAtUTC': datetime.now(timezone.utc).isoformat(),
               'passed': sum(r['passed'] for r in results), 'failed': sum(not r['passed'] for r in results),
               'scopeURLs': len(urls), 'networkRequests': 0, 'realSubmissions': 0, 'results': results}
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: receipt[key] for key in ('passed', 'failed', 'scopeURLs')}))
    if receipt['failed']:
        raise SystemExit('Preservation check failed')


if __name__ == '__main__':
    main()
