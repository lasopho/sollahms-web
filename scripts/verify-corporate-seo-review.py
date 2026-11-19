#!/usr/bin/env python3
"""Verify the current corporate overlay against actual packaged production HTML.

Requires BeautifulSoup in the QA environment only; never makes network requests.
"""
import argparse
import hashlib
import json
import re
import struct
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://sollahms.cl'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-static-root', type=Path, required=True)
    parser.add_argument('--candidate-static-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    urls = json.loads((ROOT / 'docs/seo-measurement/scope-v3.json').read_text())['included_urls']
    checks, pages, titles, descriptions = [], [], [], []

    def check(name, passed):
        checks.append({'check': name, 'passed': bool(passed)})

    sitemap = BeautifulSoup((args.candidate_static_root / 'sitemap.xml').read_text(), 'xml')
    locations = {tag.text for tag in sitemap.select('loc')}
    for url in urls:
        filename = urlsplit(url).path.lstrip('/') or 'index.html'
        before = (args.baseline_static_root / filename).read_text()
        after = (args.candidate_static_root / filename).read_text()
        old = BeautifulSoup(before, 'html.parser')
        soup = BeautifulSoup(after, 'html.parser')
        prefix = filename + ': '
        canonical = soup.select('link[rel=canonical]')
        check(prefix + 'canonical', len(canonical) == 1 and canonical[0]['href'] == url)
        check(prefix + 'in sitemap', url in locations)
        check(prefix + 'one title, description, H1 and main', all(len(soup.select(s)) == 1 for s in ('title', 'meta[name=description]', 'h1', 'main')))
        check(prefix + 'indexable', all('noindex' not in tag.get('content', '').lower() for tag in soup.select('meta[name=robots]')))
        titles.append(soup.title.text)
        descriptions.append(soup.select_one('meta[name=description]')['content'])
        check(prefix + 'forms unchanged', re.findall(r'<form\b.*?</form>', before, re.S) == re.findall(r'<form\b.*?</form>', after, re.S))
        scripts = lambda s: [str(tag) for tag in s.select('script') if tag.get('type') != 'application/ld+json']
        check(prefix + 'functional scripts unchanged', scripts(old) == scripts(soup))
        check(prefix + 'navigation unchanged', str(old.header) == str(soup.header) and str(old.footer) == str(soup.footer))
        check(prefix + 'styles unchanged', [str(tag) for tag in old.select('style,link[rel=stylesheet]')] == [str(tag) for tag in soup.select('style,link[rel=stylesheet]')])
        whatsapp = lambda s: [tag['href'] for tag in s.select('a[href]') if 'wa.me/' in tag['href']]
        check(prefix + 'WhatsApp messages unchanged', whatsapp(old) == whatsapp(soup))
        broken = []
        for tag in soup.select('a[href],link[rel=canonical]'):
            link = urlsplit(tag['href'])
            if link.scheme in ('mailto', 'tel') or link.netloc and link.netloc != 'sollahms.cl':
                continue
            target = link.path.lstrip('/') or (filename if not link.path else 'index.html')
            path = args.candidate_static_root / target
            valid = path.is_file()
            if valid and link.fragment and path.suffix == '.html':
                valid = BeautifulSoup(path.read_text(), 'html.parser').find(id=unquote(link.fragment)) is not None
            if not valid:
                broken.append(tag['href'])
        check(prefix + 'internal links and anchors', not broken)
        graphs = []
        for tag in soup.select('script[type="application/ld+json"]'):
            obj = json.loads(tag.string)
            graphs.extend(obj.get('@graph', [obj]))
        if filename in ('centro-orientacion.html', 'entorno-desarrollo-urbano.html'):
            check(prefix + 'body byte identical', before.split('<body', 1)[1] == after.split('<body', 1)[1])
            check(prefix + 'page identity and publisher', len(graphs) == 1 and graphs[0]['url'] == url and graphs[0]['publisher']['@id'] == ORIGIN + '/#organization' and graphs[0]['isPartOf']['@id'] == ORIGIN + '/#website')
            check(prefix + 'social URL', soup.select_one('meta[property="og:url"]')['content'] == url)
            image = soup.select_one('meta[property="og:image"]')['content']
            size = struct.unpack('>II', (args.candidate_static_root / urlsplit(image).path.lstrip('/')).read_bytes()[16:24])
            check(prefix + 'actual social image dimensions', size == (int(soup.select_one('meta[property="og:image:width"]')['content']), int(soup.select_one('meta[property="og:image:height"]')['content'])))
        pages.append({'url': url, 'sha256': hashlib.sha256(after.encode()).hexdigest(), 'schemas': [g.get('@type') for g in graphs], 'brokenLinks': broken})
    check('unique corporate titles', len(set(titles)) == len(urls))
    check('unique corporate descriptions', len(set(descriptions)) == len(urls))
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'pages': pages,
              'passed': sum(c['passed'] for c in checks), 'failed': sum(not c['passed'] for c in checks),
              'checks': checks, 'realSubmissions': 0, 'networkRequests': 0}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ('passed', 'failed', 'realSubmissions', 'networkRequests')}))
    if report['failed']:
        raise SystemExit('Failed checks: ' + str([c['check'] for c in checks if not c['passed']]))


if __name__ == '__main__':
    main()
