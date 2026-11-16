#!/usr/bin/env python3
"""Public, anonymous GET proof of the promoted footer artifact; no arguments.

Execution is forbidden until root's created.json and promotion-confirmed.json
explicitly identify the same verified new Production and the pinned artifact.
Only the three existing HTTPS Sollahms hosts are permitted. Curl never follows
redirects automatically, invokes APIs, sends forms, loads providers or bypasses
SSO. Bodies stay in ignored .vercel storage; reports contain curated metadata.
"""
import concurrent.futures
import hashlib
import html
import json
import posixpath
import re
import signal
import subprocess
import sys
import threading
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

DOCS = Path(__file__).resolve().parent
RELEASE = DOCS.parent
FOOTER = RELEASE.parent
ROOT = FOOTER.parents[1]
OUTPUT = ROOT / '.vercel/footer-sin-frase-20261116/stage/.vercel/output'
STATIC = OUTPUT / 'static'
CACHE = ROOT / '.vercel/footer-production-release-20261116/public-http'
PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
SOURCE_HEAD = 'b761ddeaea2fa526870e6af25658046e31b571d7'
BASELINE = 'dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
PREVIEW = 'dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF'
ORIGIN = 'https://sollahms.cl'
HOSTS = {'sollahms.cl', 'www.sollahms.cl', 'sollhams.cl'}
CORPORATE = ['/', '/proyectos.html', '/contacto.html', '/centro-orientacion.html']
MAX_BYTES = 8 * 1024 * 1024
STOP = threading.Event()
NETWORK_STARTED = threading.Event()
LOCK = threading.Lock()
ACTIVE = set()
INTERRUPTED = []
PHRASE = re.compile(r'precision[\W_]*transparency[\W_]*strategy', re.I)
TOURS = re.compile(rb'data-project-embed=["\x27]tour|id=["\x27]recorrido|class=["\x27]tour-card|<iframe\b[^>]*matterport|my\.matterport\.com', re.I)
JS_IMPORT = re.compile(r'''(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']''')
STATIC_FETCH = re.compile(r'''\bfetch\s*\(\s*["']((?:/data/|/assets/)[^"']+)["']''')
CSS_REF = re.compile(r'''(?:url\(\s*|@import\s*)["']?([^\s)"';]+)''')


def sha(body):
    return hashlib.sha256(body).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def save(name, value):
    path = DOCS / name
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)


def normalized(text):
    for _ in range(2):
        text = html.unescape(text)
    text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m[1], 16)), text)
    text = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m[1], 16)), text)
    text = re.sub(r'\\[nrt]', ' ', text)
    text = re.sub(r'<[!/a-zA-Z][^>]*>', ' ', text)
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))


class Html(HTMLParser):
    def __init__(self, body):
        super().__init__(convert_charrefs=True)
        self.ids, self.resources, self.footer_links = set(), set(), []
        self.footer_depth = 0
        self.feed(body.decode('utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'footer':
            self.footer_depth += 1
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a' and attrs.get('name'):
            self.ids.add(attrs['name'])
        if tag == 'a' and self.footer_depth and attrs.get('href'):
            self.footer_links.append(attrs['href'])
        if tag in {'script', 'img', 'source'} and attrs.get('src'):
            self.resources.add(attrs['src'])
        if tag in {'img', 'source'} and attrs.get('srcset'):
            self.resources.update(item.strip().split()[0] for item in attrs['srcset'].split(',') if item.strip())
        if tag == 'link' and set(attrs.get('rel', '').split()) & {'stylesheet', 'icon', 'preload', 'modulepreload'}:
            if attrs.get('href'):
                self.resources.add(attrs['href'])
        if attrs.get('style'):
            self.resources.update(CSS_REF.findall(attrs['style']))

    def handle_endtag(self, tag):
        if tag == 'footer':
            self.footer_depth = max(0, self.footer_depth - 1)


def guard(url):
    p = urlsplit(url)
    assert p.scheme == 'https' and p.netloc in HOSTS, 'Only existing HTTPS Sollahms hosts allowed'
    assert not p.username and not p.password and not p.query and not p.fragment
    decoded = unquote(p.path)
    assert decoded.startswith('/') and '..' not in decoded.split('/')
    assert not decoded.lower().startswith('/api'), 'API/provider requests forbidden'
    return p


def safe_location(value):
    p = urlsplit(value)
    return urlunsplit((p.scheme, p.hostname or '', p.path, '', '')) if value else None


def artifact_and_gate():
    manifest = json.loads((FOOTER / 'candidate-manifest.json').read_text())
    rows = manifest['inventory']
    canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path']))
    assert sha(canonical.encode()) == manifest['outputInventorySha256'] == PIN
    assert manifest['baselineDeployment'] == BASELINE and len(rows) == 1660
    assert manifest['changedFiles'] == 2 and manifest['identicalFiles'] == 1658
    records = {r['path']: r for r in rows}
    assert len(records) == len(rows)
    actual_paths = set()
    for path in OUTPUT.rglob('*'):
        assert not path.is_symlink(), 'Artifact symlink forbidden'
        if path.is_file():
            rel = path.relative_to(OUTPUT).as_posix()
            actual_paths.add(rel)
            body = path.read_bytes()
            assert rel in records and len(body) == records[rel]['size'] and sha(body) == records[rel]['sha256'], 'Artifact bytes differ from pin'
    assert actual_paths == set(records), 'Artifact paths differ from pin'
    created = json.loads((RELEASE / 'created.json').read_text())
    promoted = json.loads((RELEASE / 'promotion-confirmed.json').read_text())
    deployment = created['deploymentId']
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+', deployment) and deployment not in {BASELINE, PREVIEW}
    assert created['target'] == created['reportedTarget'] == 'production'
    assert created['prebuilt'] is True and created['skipDomain'] is True
    assert created['candidateInventorySha256'] == PIN
    assert created['sourceCommit'] == SOURCE_HEAD
    assert promoted['passed'] is True and promoted['deploymentId'] == deployment
    assert promoted['sameVerifiedDeployment'] is True and promoted['rebuild'] is False
    assert promoted['candidateInventorySha256'] == PIN and promoted['authorizedSourceHead'] == SOURCE_HEAD
    return records, manifest, deployment


def local_resource(reference, base):
    p = urlsplit(urljoin(ORIGIN + base, reference))
    if p.scheme != 'https' or p.netloc != 'sollahms.cl':
        return None
    path = unquote(p.path)
    if not path.startswith(('/assets/', '/data/')):
        return None
    assert '..' not in path.split('/')
    return path


def static_file(path):
    return STATIC / ('index.html' if path == '/' else path.lstrip('/'))


def prepare(records, manifest, deployment):
    jobs, links, external_links = {}, [], []
    baseline = {r['path']: r for r in manifest['baselineInventory']}

    def add(path, category, origin=ORIGIN, status=200, file=None):
        url = origin + path
        guard(url)
        expected_file = file or ('static/index.html' if path == '/' else 'static' + path)
        assert expected_file in records, 'Requested source absent from pinned artifact'
        if url not in jobs:
            row = records[expected_file]
            jobs[url] = {'url': url, 'path': path, 'categories': [], 'expectedStatus': status,
                         'expectedFile': expected_file, 'sourceSha256': row['sha256'], 'sourceBytes': row['size'],
                         'canonicalUrl': ORIGIN + path, 'initial308Required': origin != ORIGIN}
        jobs[url]['categories'].append(category)

    for path in CORPORATE:
        add(path, 'corporate-preservation' if path not in {'/', '/proyectos.html'} else 'footer-changed-page')
    add('/', 'explicit-canonical-root')
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    assert len(projects) == 131 and len({p['slug'] for p in projects}) == 131
    assert (ROOT / 'data/proyectos.json').read_bytes() == (STATIC / 'data/proyectos.json').read_bytes()
    for project in projects:
        slug = project['slug']
        assert re.fullmatch(r'[a-z0-9-]+', slug)
        path = '/' + slug + '.html'
        record = records['static' + path]
        assert record['sha256'] == baseline['static' + path]['sha256'], 'Fiche differs from production baseline'
        assert not TOURS.search((STATIC / path.lstrip('/')).read_bytes()), 'Tour present in expected baseline'
        add(path, 'project-fiche')

    pending = []
    for path in CORPORATE:
        parsed = Html(static_file(path).read_bytes())
        if path in {'/', '/proyectos.html'}:
            pending.extend((reference, path) for reference in parsed.resources)
        for href in parsed.footer_links:
            p = urlsplit(urljoin(ORIGIN + path, href))
            if p.scheme in {'mailto', 'tel'} or p.netloc not in HOSTS:
                if p.netloc == 'wa.me':
                    assert p.scheme == 'https' and p.path == '/56948502440', 'Unexpected WhatsApp destination'
                external_links.append({'from': path, 'href': href, 'method': 'offline-preservation-only', 'requested': False})
                continue
            assert p.scheme == 'https' and not p.query
            route = p.path or '/'
            add(route, 'footer-link-destination')
            links.append({'from': path, 'href': href, 'route': route, 'fragment': unquote(p.fragment)})

    resources = set()
    while pending:
        reference, base = pending.pop()
        path = local_resource(reference, base)
        if not path or path in resources:
            continue
        assert 'static' + path in records and (STATIC / path.lstrip('/')).is_file()
        resources.add(path)
        body = (STATIC / path.lstrip('/')).read_bytes()
        if path.endswith(('.js', '.mjs')):
            text = body.decode('utf-8')
            pending.extend((reference, path) for reference in JS_IMPORT.findall(text) if reference.startswith(('.', '/')))
            pending.extend((reference, path) for reference in STATIC_FETCH.findall(text))
        elif path.endswith('.css'):
            pending.extend((reference, path) for reference in CSS_REF.findall(body.decode('utf-8')))
    for path in sorted(resources):
        add(path, 'changed-page-static-resource')
    for origin in ['https://www.sollahms.cl', 'https://sollhams.cl']:
        for path in ['/', '/proyectos.html']:
            add(path, 'www-explicit-url' if 'www.' in origin else 'alternate-domain-308', origin)
    for origin in [ORIGIN, 'https://www.sollahms.cl', 'https://sollhams.cl']:
        for path in ['/patio-brasil', '/patio-brasil.html', '/patio-brasil/', '/patio-brasil.html/']:
            add(path, 'retired-patio-brasil-410', origin, 410, 'static/410.html')
    return {'preparedAtUtc': now(), 'deploymentId': deployment, 'candidateInventorySha256': PIN,
            'methods': ['GET'], 'anonymous': True, 'TLSVerificationRequired': True, 'bypassUsed': False,
            'maxConcurrency': 4, 'maxRedirects': 2, 'apiCalls': 0, 'ufLookups': 0, 'formSubmits': 0,
            'resources': sorted(resources), 'footerLinks': links, 'externalFooterLinksNotRequested': external_links,
            'requests': sorted(jobs.values(), key=lambda r: r['url'])}


def interrupt(signum, _frame):
    INTERRUPTED.append(signum)
    STOP.set()
    with LOCK:
        for process in list(ACTIVE):
            if process.poll() is None:
                process.terminate()


def curl_get(url, cache_key):
    guard(url)
    destination = CACHE / (cache_key + '.body')
    temporary = CACHE / (cache_key + '.part')
    command = ['/usr/bin/curl', '-q', '--silent', '--show-error', '--request', 'GET',
               '--max-time', '30', '--connect-timeout', '10', '--max-filesize', str(MAX_BYTES),
               '--proto', '=https', '--header', 'Accept-Encoding: identity',
               '--user-agent', 'Mozilla/5.0 Sollahms publication verification',
               '--output', str(temporary), '--write-out',
               '%{http_code}\t%{ssl_verify_result}\t%{redirect_url}\t%{num_redirects}\t%{url_effective}', url]
    with LOCK:
        if STOP.is_set():
            raise RuntimeError('Stopped before public request')
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   env={'PATH': '/usr/bin:/bin', 'LANG': 'C'})
        NETWORK_STARTED.set()
        ACTIVE.add(process)
    try:
        try:
            stdout, _stderr = process.communicate(timeout=35)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate()
            raise RuntimeError('Bounded curl timeout')
        values = stdout.decode('utf-8', errors='replace').split('\t')
        status, ssl_result, location, redirects, effective = values if len(values) == 5 else ('0', '-1', '', '0', '')
        body = temporary.read_bytes() if temporary.is_file() else b''
        assert len(body) <= MAX_BYTES
        hop = {'url': url, 'method': 'GET', 'status': int(status), 'sslVerifyResult': int(ssl_result),
               'tlsVerified': process.returncode == 0 and int(ssl_result) == 0 and int(status) > 0,
               'curlExitCode': process.returncode, 'location': safe_location(location), 'effectiveUrl': safe_location(effective),
               'followedRedirects': int(redirects), 'bytes': len(body), 'sha256': sha(body)}
        if temporary.exists():
            temporary.replace(destination)
        hop['bodyCache'] = destination.relative_to(ROOT).as_posix()
        return hop, body, location
    finally:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=5)
        with LOCK:
            ACTIVE.discard(process)
        if temporary.exists():
            temporary.unlink()


def public_get(job, deployment):
    chain = []
    if STOP.is_set():
        return {**job, 'passed': False, 'result': 'SKIPPED_AFTER_STOP', 'chain': chain}, None
    try:
        url = job['url']
        for index in range(3):
            hop, body, location = curl_get(url, sha((job['url'] + ':' + str(index)).encode()))
            chain.append(hop)
            assert hop['curlExitCode'] == 0, 'Curl transport failed; stderr intentionally omitted'
            assert hop['sslVerifyResult'] == 0 and hop['effectiveUrl'] == url and hop['followedRedirects'] == 0, 'TLS or redirect invariant failed'
            if hop['status'] in {301, 302, 303, 307, 308}:
                assert job['initial308Required'] and index == 0 and hop['status'] == 308, 'Unexpected redirect'
                assert location == job['canonicalUrl'], '308 Location differs from exact canonical URL'
                guard(location)
                url = location
                continue
            break
        else:
            raise AssertionError('Too many redirects')
        assert hop['status'] == job['expectedStatus'] and url == job['canonicalUrl'], 'Unexpected final status or URL'
        if job['initial308Required']:
            assert len(chain) == 2 and chain[0]['status'] == 308
        expected = (OUTPUT / job['expectedFile']).read_bytes()
        assert sha(expected) == job['sourceSha256'] and len(expected) == job['sourceBytes']
        suffix = ('<script async data-explicit-opt-in="true" data-deployment-id="' + deployment +
                  '" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()
        exact = body == expected
        known_suffix = job['expectedFile'].endswith('.html') and body == expected + suffix
        assert exact or known_suffix, 'Response differs from certified source and exact deployment-specific platform suffix'
        phrase_absent = None
        if job['expectedFile'].endswith(('.html', '.css', '.js', '.mjs', '.json')):
            phrase_absent = not PHRASE.search(normalized(body.decode('utf-8')))
            assert phrase_absent, 'Equivalent corporate phrase reappeared'
        tour_absent = None
        if 'project-fiche' in job['categories']:
            tour_absent = not TOURS.search(body)
            assert tour_absent, 'Virtual tour reappeared'
        return {**job, 'passed': True, 'result': 'PASS', 'chain': chain, 'finalStatus': hop['status'],
                'finalUrl': url, 'responseSha256': sha(body), 'responseBytes': len(body),
                'sourceBytesExactlyIdentical': exact, 'sourcePrefixExactlyIdentical': body.startswith(expected),
                'sourceSha256Verified': sha(body[:len(expected)]) == job['sourceSha256'],
                'knownPlatformSuffixOnly': not exact and known_suffix,
                'platformSuffixSha256': sha(suffix) if not exact else None,
                'platformSuffixBytes': len(suffix) if not exact else 0,
                'phraseAbsent': phrase_absent, 'virtualTourAbsent': tour_absent}, body
    except Exception as error:
        STOP.set()
        return {**job, 'passed': False, 'result': 'BLOCK', 'error': str(error), 'chain': chain}, None


def main():
    assert len(sys.argv) == 1, 'This fixed release script accepts no arguments'
    records, manifest, deployment = artifact_and_gate()
    plan = prepare(records, manifest, deployment)
    CACHE.mkdir(parents=True, exist_ok=True)
    save('plan.json', plan)
    signal.signal(signal.SIGINT, interrupt)
    signal.signal(signal.SIGTERM, interrupt)
    report = {'startedAtUtc': now(), 'deploymentId': deployment, 'candidateInventorySha256': PIN,
              'status': 'RUNNING', 'methods': ['GET'], 'anonymous': True, 'bypassUsed': False,
              'apiRequests': 0, 'formSubmits': 0, 'ufLookups': 0, 'providerRequests': 0,
              'maxConcurrency': 4, 'results': []}
    save('results.json', report)
    bodies = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(public_get, job, deployment) for job in plan['requests']]
        for future in concurrent.futures.as_completed(futures):
            row, body = future.result()
            report['results'].append(row)
            if body is not None:
                bodies[row['url']] = body
            save('results.json', report)
    anchors = []
    for case in plan['footerLinks']:
        body = bodies.get(ORIGIN + case['route'])
        passed = body is not None and (not case['fragment'] or case['fragment'] in Html(body).ids)
        anchors.append({**case, 'passed': bool(passed), 'result': 'PASS' if passed else 'BLOCK'})
    rows = sorted(report['results'], key=lambda r: r['url'])
    transactions = [h for row in rows for h in row['chain']]
    source_rows = [row for row in rows if row.get('passed')]
    summary = {'plannedRequests': len(plan['requests']), 'completedRequests': len(rows),
               'passedRequests': len(source_rows), 'blockedRequests': sum(row['result'] == 'BLOCK' for row in rows),
               'skippedAfterStop': sum(row['result'] == 'SKIPPED_AFTER_STOP' for row in rows),
               'transactions': len(transactions), 'verifiedTlsTransactions': sum(h['tlsVerified'] for h in transactions),
               'redirects308': sum(h['status'] == 308 for h in transactions),
               'sourceByteExact': sum(row['sourceBytesExactlyIdentical'] for row in source_rows),
               'sourceWithExactDeploymentToolbar': sum(row['knownPlatformSuffixOnly'] for row in source_rows),
               'sourceSha256Verified': sum(row['sourceSha256Verified'] for row in source_rows),
               'projectFichesPassed': sum('project-fiche' in row['categories'] for row in source_rows),
               'projectFichesSourceByteExact': sum('project-fiche' in row['categories'] and row['sourceBytesExactlyIdentical'] for row in source_rows),
               'projectFichesTourAbsent': sum(row.get('virtualTourAbsent') is True for row in source_rows),
               'footerLinkCases': len(anchors), 'footerLinkCasesPassed': sum(case['passed'] for case in anchors),
               'resourcesPassed': sum('changed-page-static-resource' in row['categories'] for row in source_rows),
               'wwwExplicitCasesPassed': sum('www-explicit-url' in row['categories'] for row in source_rows),
               'patioBrasil410CasesPassed': sum('retired-patio-brasil-410' in row['categories'] for row in source_rows)}
    passed = (not INTERRUPTED and len(source_rows) == len(plan['requests']) and all(c['passed'] for c in anchors)
              and summary['projectFichesPassed'] == summary['projectFichesTourAbsent'] == 131
              and summary['verifiedTlsTransactions'] == summary['transactions']
              and summary['wwwExplicitCasesPassed'] == 2 and summary['patioBrasil410CasesPassed'] == 12)
    report.update({'finishedAtUtc': now(), 'status': 'PASS' if passed else 'BLOCK', 'passed': passed,
                   'signalsReceived': INTERRUPTED, 'results': rows, 'footerLinkResults': anchors, 'summary': summary})
    save('results.json', report)
    save('source-comparisons.json', [{'url': row['url'], 'sourceFile': row['expectedFile'],
         'sourceSha256': row['sourceSha256'], 'sourceBytes': row['sourceBytes'],
         **{key: row.get(key) for key in ['passed', 'result', 'responseSha256', 'responseBytes',
             'sourceBytesExactlyIdentical', 'sourceSha256Verified', 'knownPlatformSuffixOnly']}} for row in rows])
    save('summary.json', {key: value for key, value in report.items() if key not in {'results', 'footerLinkResults'}})
    print(json.dumps({'status': report['status'], 'deploymentId': deployment, **summary}), flush=True)
    return 0 if passed else 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (AssertionError, FileNotFoundError, KeyError, ValueError) as error:
        print(json.dumps({'status': 'BLOCK', 'reason': str(error), 'publicNetworkStarted': NETWORK_STARTED.is_set()}), flush=True)
        raise SystemExit(1)
