"""Read-only HTTP verification of staged Production or the four public URLs.

Uses existing CLI authentication for staging. No tokens, cookies or raw
authenticated bodies are saved. Public mode requests only the follow-up URLs,
robots.txt and sitemap.xml. Requires BeautifulSoup in the QA environment.
"""
import argparse
import hashlib
import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
ORIGIN = 'https://sollahms.cl'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=('staged', 'public'), required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--deployment', required=True)
    parser.add_argument('--static-root', type=Path, required=True)
    parser.add_argument('--scope-registry', type=Path, required=True)
    parser.add_argument('--measurement-plan', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--vercel', default='/Users/luissandoval/.npm-global/bin/vercel')
    args = parser.parse_args()
    toolbar = ('<script async data-explicit-opt-in="true" data-deployment-id="' + args.deployment + '" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()
    if args.mode == 'staged':
        urls = json.loads(args.scope_registry.read_text())['included_urls']
    else:
        urls = json.loads(args.measurement_plan.read_text())['postpublication_public_urls']
    paths = [urlsplit(url).path.lstrip('/') or 'index.html' for url in urls]
    results = []
    for path in paths + ['robots.txt', 'sitemap.xml']:
        request_path = '/' if path == 'index.html' else '/' + path
        if args.mode == 'staged':
            process = subprocess.run([args.vercel, 'curl', args.url + request_path,
                '--scope', TEAM, '--', '--silent', '--show-error', '--include'],
                capture_output=True, check=True)
            headers_raw, separator, body = process.stdout.partition(b'\r\n\r\n')
            if not separator:
                raise ValueError('Missing HTTP response headers')
            status = int(headers_raw.splitlines()[0].split()[1])
            headers = {}
            for line in headers_raw.splitlines()[1:]:
                key, separator, value = line.partition(b':')
                if separator:
                    headers[key.decode().lower()] = value.strip().decode()
            final_url = args.url + request_path
        else:
            request = urllib.request.Request(args.url + request_path, headers={
                'User-Agent': 'Sollahms-authorized-publication-verification/1.0',
                'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(request, timeout=30) as response:
                status, body, final_url = response.status, response.read(), response.url
                headers = {key.lower(): value for key, value in response.headers.items()}
        count = body.count(toolbar)
        normalized = body.replace(toolbar, b'') if count == 1 else body
        expected = (args.static_root / path).read_bytes()
        robots_header = headers.get('x-robots-tag', '')
        checks = {'status200': status == 200, 'exactCandidate': normalized == expected}
        details = {}
        if path.endswith('.html'):
            soup = BeautifulSoup(body, 'html.parser')
            canonical = soup.select('link[rel=canonical]')
            canonical_url = ORIGIN + ('/' if path == 'index.html' else '/' + path)
            checks['canonical'] = len(canonical) == 1 and canonical[0]['href'] == canonical_url
            checks['oneH1'] = len(soup.select('h1')) == 1
            checks['noMetaNoindex'] = all('noindex' not in tag.get('content', '').lower() for tag in soup.select('meta[name=robots]'))
            if args.mode == 'public':
                checks['noHeaderNoindex'] = 'noindex' not in robots_header.lower()
                checks['publicCanonicalResponse'] = final_url == canonical_url
            schemas = []
            for tag in soup.select('script[type="application/ld+json"]'):
                data = json.loads(tag.string)
                schemas.extend(node.get('@type') for node in data.get('@graph', [data]))
            details = {'canonical': canonical_url, 'schemas': schemas,
                       'mainTextChars': len(soup.main.get_text(' ', strip=True))}
        if path == 'sitemap.xml':
            sitemap = BeautifulSoup(body, 'xml')
            locations = [tag.text for tag in sitemap.select('loc')]
            checks['benefitsURLIncludedOnce'] = locations.count(ORIGIN + '/beneficios-tributarios-inmobiliarios.html') == 1
        results.append({'path': path, 'status': status, 'finalUrl': final_url,
            'xRobotsTag': robots_header, 'rawSHA256': digest(body),
            'withoutServiceToolbarSHA256': digest(normalized),
            'candidateSHA256': digest(expected), 'vercelToolbarCount': count,
            'checks': checks, 'details': details, 'passed': all(checks.values())})
    report = {'observedAt': datetime.now(ZoneInfo('America/Santiago')).isoformat(),
        'timezone': 'America/Santiago', 'mode': args.mode, 'deployment': args.deployment,
        'url': args.url, 'passed': sum(row['passed'] for row in results),
        'failed': sum(not row['passed'] for row in results), 'results': results,
        'formsSubmitted': 0, 'providerCalls': 0, 'indexingRequests': 0,
        'secretsStored': False,
        'measurementLimits': 'HTTP and indexability checks only; no engine crawl, index inclusion, ranking or AI citation measurement.'}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ('observedAt', 'mode', 'passed', 'failed')}))
    if report['failed']:
        raise SystemExit('HTTP verification failed: ' + str([row['path'] for row in results if not row['passed']]))


if __name__ == '__main__':
    main()
