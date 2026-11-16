"""Read-only public HTTP proof for the exact approved Centro artifact.

Default operation prepares the plan offline. --run additionally requires a
root-authored go.json confirming the promotion and matching deployment ID.
Only GET requests to the two existing Sollahms domains are permitted. No API
route, form, UF service, provider or communication link is ever requested.
"""
import argparse
import concurrent.futures
import hashlib
import json
import posixpath
import re
import ssl
import threading
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

DOCS = Path(__file__).resolve().parent
RELEASE = DOCS.parent
CENTRO = RELEASE.parent
ROOT = CENTRO.parents[1]
OUTPUT = ROOT / '.vercel/centro-auditoria-20261116/stage/.vercel/output'
PIN = 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
CONTACT_PIN = '02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1'
PLATFORM_SUFFIX_BYTES = 163
PLATFORM_SUFFIX_PIN = '8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc'
ORIGINS = ('https://sollahms.cl', 'https://www.sollahms.cl', 'http://sollahms.cl', 'http://www.sollahms.cl')
MAX_BYTES = 4 * 1024 * 1024
TOURS = re.compile(rb'data-project-embed=["\']tour|id=["\']recorrido|class=["\']tour-card', re.I)


def sha(body):
    return hashlib.sha256(body).hexdigest()


def save(name, value):
    (DOCS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


class Html(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.resources = set(), set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag in {'script', 'img'} and attrs.get('src', '').startswith('/assets/'):
            self.resources.add(urllib.parse.urlsplit(attrs['src']).path)
        if tag == 'link' and attrs.get('rel') in {'stylesheet', 'icon', 'preload'} and attrs.get('href', '').startswith('/assets/'):
            self.resources.add(urllib.parse.urlsplit(attrs['href']).path)


def guard(url):
    parts = urllib.parse.urlsplit(url)
    assert parts.scheme in {'https', 'http'}
    assert parts.netloc in {'sollahms.cl', 'www.sollahms.cl'}
    assert not parts.username and not parts.password and not parts.query
    assert not parts.path.startswith('/api')
    assert not parts.fragment
    return parts


def artifact():
    manifest = json.loads((CENTRO / 'candidate-manifest.json').read_text())
    rows = manifest['inventory']
    computed = sha(''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode())
    assert computed == manifest['outputInventorySha256'] == PIN
    assert len(rows) == 1660 and manifest['changedFiles'] == 3
    records = {r['path']: r for r in rows}
    assert records['static/contacto.html']['sha256'] == CONTACT_PIN
    assert json.loads((RELEASE / 'authorization.json').read_text())['publicQaAuthorized']
    return records


def prepare():
    records = artifact()
    center = (OUTPUT / 'static/centro-orientacion.html').read_bytes()
    assert sha(center) == records['static/centro-orientacion.html']['sha256']
    source = Html(center.decode())
    resources, pending = set(), list(source.resources)
    while pending:
        path = pending.pop()
        if path in resources:
            continue
        assert path.startswith('/assets/') and '..' not in path
        file = OUTPUT / 'static' / path.lstrip('/')
        assert file.is_file() and sha(file.read_bytes()) == records['static' + path]['sha256']
        resources.add(path)
        if path.endswith(('.js', '.mjs')):
            text = file.read_text()
            for dependency in re.findall(r"(?:from\s*|import\s*)['\"]([^'\"]+)['\"]", text):
                if dependency.startswith('.'):
                    pending.append(posixpath.normpath(posixpath.join(posixpath.dirname(path), dependency)))
        elif path.endswith('.css'):
            pending.extend(urllib.parse.urlsplit(v).path for v in re.findall(r"url\(['\"]?(/assets/[^)'\"]+)", file.read_text()))
    projects = json.loads((OUTPUT / 'static/data/proyectos.json').read_text())
    assert len(projects) == 131
    links = json.loads((CENTRO / 'link-audit.json').read_text())['local']
    assert len(links) == 23 and all(row['result'] == 'PASS' for row in links)
    jobs = {}

    def add(path, category, origin=ORIGINS[0], status=200, expected_file=None):
        url = origin + path
        guard(url)
        file_path = expected_file or ('static/index.html' if path == '/' else 'static' + path)
        assert file_path in records
        job = {'url': url, 'path': path, 'expectedStatus': status, 'expectedFile': file_path,
               'expectedSha256': records[file_path]['sha256'], 'expectedBytes': records[file_path]['size'],
               'canonicalUrl': ORIGINS[0] + path, 'categories': [category],
               'expectFirstRedirect308': origin != ORIGINS[0]}
        if url in jobs:
            jobs[url]['categories'].append(category)
        else:
            jobs[url] = job

    add('/centro-orientacion.html', 'center')
    for path in ['/centro-orientacion.html', '/assets/css/orientacion.css', '/assets/js/orientacion.mjs']:
        add(path, 'certified-overlay')
    add('/contacto.html', 'contacto-preservation')
    for row in projects:
        add('/' + row['slug'] + '.html', 'project-fiche')
    for row in links:
        parts = urllib.parse.urlsplit(row['href'])
        add(parts.path or '/centro-orientacion.html', 'center-local-destination')
    for path in sorted(resources):
        add(path, 'center-resource')
    for origin in ORIGINS:
        for path in ['/', '/centro-orientacion.html', '/contacto.html']:
            add(path, 'domain-redirect-matrix', origin)
        for path in ['/patio-brasil', '/patio-brasil.html', '/patio-brasil/', '/patio-brasil.html/']:
            add(path, 'retired-410', origin, 410, 'static/410.html')
    plan = {'preparedAt': datetime.now(timezone.utc).isoformat(), 'deploymentAwaitingRootGo': True,
            'candidateInventorySha256': PIN, 'productionRequestsExecuted': 0,
            'methods': ['GET'], 'maxConcurrency': 4, 'maxRedirects': 6, 'timeoutSecondsPerRequest': 20,
            'apiCallsAllowed': False, 'formSubmitsAllowed': False, 'ufLookupsAllowed': False,
            'TLSVerificationEnabled': True, 'projectFiches': 131, 'localFragmentCases': links,
            'resources': sorted(resources), 'requests': sorted(jobs.values(), key=lambda r: r['url'])}
    save('plan.json', plan)
    return plan


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        return None


def public_get(job):
    chain = []
    url = job['url']
    opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPSHandler(context=ssl.create_default_context()))
    try:
        for _ in range(7):
            parts = guard(url)
            request = urllib.request.Request(url, method='GET', headers={'Accept-Encoding': 'identity', 'User-Agent': 'Mozilla/5.0 Sollahms publication verification'})
            try:
                response = opener.open(request, timeout=20)
            except urllib.error.HTTPError as error:
                response = error
            status, headers = response.code, response.headers
            body = response.read(MAX_BYTES + 1)
            response.close()
            assert len(body) <= MAX_BYTES, 'Response exceeds bounded static body limit'
            hop = {'url': url, 'method': 'GET', 'status': status, 'bytes': len(body), 'sha256': sha(body),
                   'tlsVerified': parts.scheme == 'https', 'location': headers.get('Location')}
            chain.append(hop)
            if status in {301, 302, 303, 307, 308}:
                assert headers.get('Location'), 'Missing redirect Location'
                next_url = urllib.parse.urljoin(url, headers['Location'])
                next_parts = guard(next_url)
                assert next_parts.scheme == 'https', 'Redirect fails to enforce HTTPS'
                url = next_url
                continue
            break
        else:
            raise AssertionError('Too many redirects')
        assert status == job['expectedStatus'], f'Expected HTTP {job["expectedStatus"]}, got {status}'
        assert url == job['canonicalUrl'], 'Final canonical URL differs'
        assert urllib.parse.urlsplit(url).scheme == 'https', 'Final response is not HTTPS'
        if job['expectFirstRedirect308']:
            assert len(chain) > 1 and chain[0]['status'] == 308, 'Expected initial canonicalizing 308'
        expected = (OUTPUT / job['expectedFile']).read_bytes()
        assert sha(expected) == job['expectedSha256'] and len(expected) == job['expectedBytes']
        exact = body == expected
        suffix = body[len(expected):] if body.startswith(expected) else b''
        known_suffix = (not exact and job['expectedFile'].endswith('.html') and len(suffix) == PLATFORM_SUFFIX_BYTES and sha(suffix) == PLATFORM_SUFFIX_PIN)
        assert exact or known_suffix, f'Static body differs from certified artifact: {sha(body)}'
        if 'project-fiche' in job['categories']:
            assert not TOURS.search(body), 'Virtual-tour UI reappeared'
        if 'retired-410' in job['categories']:
            assert 'noindex' in headers.get('X-Robots-Tag', '').lower(), 'Retired route lacks noindex'
        proof = {**job, 'result': 'PASS' if exact else 'PASS_WITH_VERIFIED_PLATFORM_SUFFIX',
                 'chain': chain, 'finalStatus': status, 'finalUrl': url, 'deliveredBytes': len(body),
                 'deliveredSha256': sha(body), 'sourceBytesExactlyIdentical': exact,
                 'certifiedSourcePrefixIdentical': body.startswith(expected),
                 'platformSuffixBytes': len(suffix), 'platformSuffixSha256': sha(suffix) if suffix else None,
                 'virtualTourUiAbsent': not TOURS.search(body) if 'project-fiche' in job['categories'] else None}
        return proof, body
    except Exception as error:
        return {**job, 'result': 'BLOCK', 'error': str(error), 'chain': chain}, None


def run(deployment):
    plan = prepare()
    go = json.loads((DOCS / 'go.json').read_text())
    assert go['promotionConfirmedByRoot'] is True and go['authorizedPublicQa'] is True
    assert go['deploymentId'] == deployment and go['candidateInventorySha256'] == PIN
    assert deployment.startswith('dpl_')
    rows, bodies = [], {}
    report = {'startedAt': datetime.now(timezone.utc).isoformat(), 'deploymentId': deployment,
              'candidateInventorySha256': PIN, 'status': 'RUNNING', 'methods': ['GET'],
              'maxConcurrency': 4, 'formSubmits': 0, 'apiRequests': 0, 'ufLookups': 0,
              'commercialDataSent': False, 'results': rows}
    save('results.json', report)
    stop = threading.Event()

    def guarded_get(job):
        if stop.is_set():
            return {**job, 'result': 'SKIPPED_AFTER_BLOCK', 'chain': []}, None
        result = public_get(job)
        if result[0]['result'] == 'BLOCK':
            stop.set()
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(guarded_get, job): job for job in plan['requests']}
        for future in concurrent.futures.as_completed(futures):
            row, body = future.result()
            rows.append(row)
            if body is not None:
                bodies[row['url']] = body
            save('results.json', report)
            if row['result'] == 'BLOCK':
                print(json.dumps({'event': 'BLOCK', 'url': row['url'], 'error': row['error']}, ensure_ascii=False), flush=True)
    fragment_results = []
    for case in plan['localFragmentCases']:
        parts = urllib.parse.urlsplit(case['href'])
        route = parts.path or '/centro-orientacion.html'
        delivered = bodies.get(ORIGINS[0] + route)
        passed = delivered is not None and (not parts.fragment or parts.fragment in Html(delivered.decode()).ids)
        fragment_results.append({'href': case['href'], 'route': route, 'fragment': parts.fragment,
                                 'result': 'PASS' if passed else 'BLOCK'})
    report['fragmentResults'] = fragment_results
    report['results'] = sorted(rows, key=lambda r: r['url'])
    report['finishedAt'] = datetime.now(timezone.utc).isoformat()
    report['summary'] = {'plannedRequests': len(plan['requests']), 'completedRequests': len(rows),
                         'passedRequests': sum(r['result'].startswith('PASS') for r in rows),
                         'blockedRequests': sum(r['result'] == 'BLOCK' for r in rows),
                         'skippedAfterBlock': sum(r['result'] == 'SKIPPED_AFTER_BLOCK' for r in rows),
                         'transactions': sum(len(r['chain']) for r in rows),
                         'verifiedTlsTransactions': sum(h['tlsVerified'] for r in rows for h in r['chain']),
                         'redirects308': sum(h['status'] == 308 for r in rows for h in r['chain']),
                         'platformSuffixResponses': sum(r['result'] == 'PASS_WITH_VERIFIED_PLATFORM_SUFFIX' for r in rows),
                         'projectFichesPassed': sum('project-fiche' in r['categories'] and r['result'].startswith('PASS') for r in rows),
                         'localFragmentsPassed': sum(r['result'] == 'PASS' for r in fragment_results)}
    report['status'] = 'PASS' if (not report['summary']['blockedRequests'] and report['summary']['localFragmentsPassed'] == 23 and report['summary']['projectFichesPassed'] == 131) else 'BLOCK'
    save('results.json', report)
    save('summary.json', {k: v for k, v in report.items() if k not in {'results', 'fragmentResults'}})
    print(json.dumps({'status': report['status'], 'deploymentId': deployment, **report['summary']}, ensure_ascii=False), flush=True)
    return report['status'] == 'PASS'


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', action='store_true')
    parser.add_argument('--deployment')
    options = parser.parse_args()
    if options.run:
        assert options.deployment, '--deployment is required after root confirms promotion'
        raise SystemExit(0 if run(options.deployment) else 1)
    plan = prepare()
    print(json.dumps({'mode': 'PREPARED_OFFLINE', 'candidateInventorySha256': PIN,
                      'plannedRequests': len(plan['requests']), 'resources': len(plan['resources']),
                      'projectFiches': 131, 'networkRequests': 0, 'awaitingRootPromotionGo': True}))
