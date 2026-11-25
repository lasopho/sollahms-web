#!/usr/bin/env python3
"""Verify certified footer responses using GET only, with TLS validation.

--baseline verifies all currently published ADQD HTML before a new deployment.
--isolated uses the existing authenticated Vercel CLI for the exact new ID.
--public requires the same ID's promotion receipt and uses anonymous curl.
--plan validates local inputs and prints the bounded plan without requests.
No application APIs, external providers, forms, environments or secrets are read.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlsplit
from zoneinfo import ZoneInfo

QA = Path(__file__).resolve().parent
DOCS = QA.parent
ROOT = DOCS.parents[1]
RELEASE = DOCS / 'release'
WORK = ROOT / '.vercel/footer-global-20261125'
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
SCOPE = 'lsandoval2-8260s-projects'
BASE = 'dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be'
BASE_SOURCE = 'e866ce7ac0d7b6df968ecd011fa78d6aec335828'
PIN = 'fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79'
PUBLIC = 'https://sollahms.cl'
MAX_WORKERS = 4
MARKER = '__SOLLAHMS_FOOTER_HTTP_META__'
FOOTER = re.compile(rb'<footer\b[^>]*>.*?</footer>', re.S | re.I)
CSS_LINK = re.compile(rb'<link\b[^>]*href=["\x27]/assets/css/corporate-footer\.css(?:\?[^"\x27]*)?["\x27][^>]*>\n?', re.I)
ENV = dict(os.environ)
for _key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG',
             'VERCEL_LOG_LEVEL', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID',
             'NOW_PROJECT_ID', 'NOW_ORG_ID', 'VERCEL_AUTOMATION_BYPASS_SECRET']:
    ENV.pop(_key, None)
ENV['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'


def sha(body):
    return hashlib.sha256(body).hexdigest()


def read(path):
    return json.loads(path.read_text())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.current = set(), [], None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a':
            self.current = {'href': attrs.get('href'), 'text': '',
                            'accessibleLabel': attrs.get('aria-label')}

    def handle_data(self, text):
        if self.current is not None:
            self.current['text'] += text

    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.current['text'] = ' '.join(self.current['text'].split())
            self.links.append(self.current)
            self.current = None


def bytes_count(row):
    return row.get('bytes', row.get('size'))


def plan():
    manifest_path = DOCS / 'candidate-manifest.json'
    manifest = read(manifest_path)
    rows = manifest['inventory']
    canonical = ''.join(f"{r['path']}\t{bytes_count(r)}\t{r['sha256']}\n"
                        for r in sorted(rows, key=lambda item: item['path'])).encode()
    assert manifest['passed'] is True and len(rows) == 1729
    assert sha(canonical) == manifest['inventorySHA256'] == PIN
    assert manifest['changedHtmlFiles'] == 0 and manifest['identicalFiles'] == 1729
    assert manifest['baselineDeployment'] == BASE
    output = Path(manifest['stageOutput']).resolve()
    assert output == (WORK / 'stage/.vercel/output').resolve()
    expected = {row['path']: row for row in rows}
    assert len(expected) == len(rows)
    preservation_path = DOCS / 'html-preservation.json'
    preservation = read(preservation_path)
    assert preservation['passed'] is True and preservation['outsideFooterByteIdentical'] is True
    guards = {row['path']: row for row in preservation['pages']}
    assert len(guards) == 168
    template = (ROOT / 'templates/corporate-footer.html').read_bytes().strip()
    template_sha = sha(template)
    assert manifest['footerTemplateSHA256'] == template_sha
    links = Document(template.decode('utf-8')).links
    assert len(links) == 11
    config_body = (output / 'config.json').read_bytes()
    assert sha(config_body) == expected['config.json']['sha256']
    config = json.loads(config_body)
    assert config['version'] == 3
    assert any(route.get('dest') == '/410.html' and route.get('status') == 410
               and re.match(route['src'], '/patio-brasil') for route in config['routes'])
    assert any(route.get('dest') == '/404.html' and route.get('status') == 404
               for route in config['routes'])
    assert any(route.get('status') == 308 and route.get('headers', {}).get('Location') == '/'
               and re.match(route['src'], '/index.html') for route in config['routes'])
    jobs = []
    for path, row in sorted(expected.items()):
        if not (path.startswith('static/') and path.endswith('.html')):
            continue
        body = (output / path).read_bytes()
        assert len(body) == bytes_count(row) and sha(body) == row['sha256']
        footers = FOOTER.findall(body)
        assert footers == [template] and len(CSS_LINK.findall(body)) == 1
        assert sha(CSS_LINK.sub(b'', FOOTER.sub(b'', body))) == guards[path]['outsideFooterSha256']
        route, status = '/' + path.removeprefix('static/'), 200
        if path == 'static/index.html':
            route = '/'
        elif path == 'static/404.html':
            route, status = '/__footer-global-not-found-20261125__', 404
        elif path == 'static/410.html':
            route, status = '/patio-brasil', 410
        jobs.append({'kind': 'html', 'path': route, 'expectedFile': path, 'expectedStatus': status})
    assert len(jobs) == 168 and {job['expectedFile'] for job in jobs} == set(guards)
    for path in ['static/assets/css/corporate-footer.css',
                 'static/assets/fonts/home/inter-latin-variable.woff2',
                 'static/assets/branding/sollahms-logo.svg']:
        body = (output / path).read_bytes()
        assert path in expected and len(body) == bytes_count(expected[path]) and sha(body) == expected[path]['sha256']
        jobs.append({'kind': 'asset', 'path': '/' + path.removeprefix('static/'),
                     'expectedFile': path, 'expectedStatus': 200})
    assert len({job['path'] for job in jobs}) == 171
    return {'manifest': manifest, 'manifestFileSha256': sha(manifest_path.read_bytes()),
            'preservationFileSha256': sha(preservation_path.read_bytes()), 'output': output,
            'expected': expected, 'guards': guards, 'template': template,
            'templateSha256': template_sha, 'links': links, 'jobs': jobs}


def target(mode, artifact_pin):
    if mode == 'baseline':
        assert artifact_pin == PIN
        return {'deploymentId': BASE, 'sourceCommit': BASE_SOURCE}, PUBLIC
    created = read(RELEASE / 'created.json')
    deployment = created['deploymentId']
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+', deployment) and deployment != BASE
    assert created['state'] == 'created' and created['readyState'] == 'READY'
    assert created['target'] == created['reportedTarget'] == 'production'
    assert created['prebuilt'] is True and created['skipDomain'] is True
    assert created['baselineDeployment'] == BASE and created['candidateInventorySHA256'] == artifact_pin
    assert re.fullmatch(r'[0-9a-f]{40}', created['sourceCommit'])
    parsed = urlsplit(created['url'] if created['url'].startswith('https://') else 'https://' + created['url'])
    assert parsed.scheme == 'https' and parsed.hostname and parsed.hostname.endswith('.vercel.app')
    assert parsed.path in ['', '/'] and not parsed.query and not parsed.fragment and not parsed.username
    source_guard = subprocess.check_output(['git', 'diff', '--name-only', created['sourceCommit'], '--',
                    ':(exclude)docs/**', ':(exclude)NEXT-PROMPT.md'], cwd=ROOT)
    assert source_guard == b'', 'Working runtime changed after the declared deployment source.'
    if mode == 'public':
        promotion = read(RELEASE / 'promotion-confirmed.json')
        assert promotion['passed'] is True and promotion['deploymentId'] == deployment
        assert promotion.get('candidateInventorySHA256', promotion.get('artifactPin')) == artifact_pin
        assert promotion.get('rebuild', False) is False
    return created, PUBLIC if mode == 'public' else 'https://' + parsed.hostname


def safe_location(value):
    if not value:
        return None
    parsed = urlsplit(value)
    # Authentication query strings and raw response headers never enter evidence.
    return (parsed.scheme + '://' + parsed.netloc if parsed.netloc else '') + parsed.path


class Transport:
    def __init__(self, mode, deployment, origin, pin):
        self.mode, self.deployment, self.origin, self.pin = mode, deployment, origin, pin
        self.cache = WORK / 'http' / mode / deployment / pin
        self.cache.mkdir(parents=True, exist_ok=True, mode=0o700)

    def get(self, job):
        path = job['path']
        assert path.startswith('/') and not path.startswith('//') and not path.startswith('/api')
        host = job.get('host')
        assert host in [None, 'www.sollahms.cl', 'sollhams.cl']
        assert not host or self.mode in ['baseline', 'public']
        url = ('https://' + host if host else self.origin) + path
        request_key = sha((self.deployment + ' ' + self.pin + ' GET ' + url).encode())
        with tempfile.TemporaryDirectory(prefix='request-', dir=self.cache) as temporary:
            folder = Path(temporary)
            body_path, headers_path = folder / 'body', folder / 'headers'
            arguments = ['--silent', '--show-error', '--request', 'GET', '--max-time', '30',
                         '--connect-timeout', '10', '--max-filesize', str(16 * 1024 * 1024),
                         '--proto', '=https', '--header', 'Accept-Encoding: identity',
                         '--user-agent', 'SollahmsFooterHTTPVerification/20261125',
                         '--output', str(body_path), '--dump-header', str(headers_path),
                         '--write-out', '\n' + MARKER + '\t%{http_code}\t%{ssl_verify_result}'
                         '\t%{redirect_url}\t%{num_redirects}\t%{url_effective}\n']
            command = ([NODE, CLI, 'curl', path, '--deployment', self.deployment, '--scope', SCOPE, '--']
                       + arguments if self.mode == 'isolated' else ['/usr/bin/curl', '-q'] + arguments + [url])
            process = subprocess.Popen(command, cwd=ROOT, env=ENV, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            try:
                stdout, _ = process.communicate(timeout=65)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
                raise AssertionError('Bounded read-only HTTP timeout.') from None
            finally:
                if process.poll() is None:
                    process.kill()
                    process.wait(timeout=5)
            assert process.returncode == 0, 'Read-only curl transport failed; diagnostic output omitted.'
            assert MARKER.encode() in stdout, 'Missing curl TLS verification receipt.'
            values = stdout.rsplit(MARKER.encode(), 1)[1].decode().strip('\r\n\t').split('\t')
            assert len(values) == 5, 'Malformed curl TLS verification receipt.'
            status, tls, location, redirects, effective = values
            assert int(tls) == 0 and int(redirects) == 0, 'TLS/redirect invariant failed.'
            effective_parts, expected_parts = urlsplit(effective), urlsplit(url)
            assert effective_parts.scheme == expected_parts.scheme == 'https'
            assert effective_parts.hostname == expected_parts.hostname and effective_parts.path == expected_parts.path
            body = body_path.read_bytes()
            header_blocks = [block for block in re.split(rb'\r?\n\r?\n', headers_path.read_bytes()) if block.startswith(b'HTTP/')]
            assert header_blocks, 'Missing final HTTP header block.'
            header_status = re.match(rb'HTTP/\S+\s+(\d+)', header_blocks[-1])
            assert header_status and int(header_status[1]) == int(status), 'Final status mismatch.'
            receipt = {'url': url, 'method': 'GET', 'status': int(status), 'sslVerifyResult': int(tls),
                       'followedRedirects': int(redirects), 'location': safe_location(location),
                       'effectiveUrl': safe_location(effective), 'bytes': len(body), 'sha256': sha(body),
                       'curlExitCode': process.returncode, 'cacheKey': request_key}
            return receipt, body, location

    def cache_verified(self, receipt, body):
        key = receipt['cacheKey']
        path = self.cache / (key + '.body')
        path.write_bytes(body)
        path.chmod(0o600)
        return path.relative_to(ROOT).as_posix()


def verify_job(job, transport, context):
    receipt = None
    try:
        receipt, body, location = transport.get(job)
        assert receipt['status'] == job['expectedStatus'], 'Unexpected HTTP status.'
        if job['kind'] == 'redirect':
            expected = job['expectedLocation']
            assert urljoin(receipt['url'], location) == expected, '308 Location differs from exact canonical destination.'
            return {**job, 'passed': True, 'transport': receipt, 'result': 'PASS'}, None
        assert not location, 'Unexpected redirect Location on a content response.'
        expected = (context['output'] / job['expectedFile']).read_bytes()
        source = context['expected'][job['expectedFile']]
        assert sha(expected) == source['sha256'] and len(expected) == bytes_count(source)
        exact = body == expected
        suffix = ('<script async data-explicit-opt-in="true" data-deployment-id="' + transport.deployment
                  + '" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()
        platform_suffix = transport.mode == 'isolated' and job['kind'] == 'html' and body == expected + suffix
        assert exact or platform_suffix, 'HTTP bytes differ from certified candidate; no unrecognized suffix is allowed.'
        content = body[:len(expected)]
        result = {**job, 'passed': True, 'result': 'PASS', 'transport': receipt,
                  'sourceSha256': source['sha256'], 'sourceBytes': bytes_count(source),
                  'sourceBytesExactlyIdentical': exact, 'sourceSha256Verified': sha(content) == source['sha256'],
                  'knownDeploymentSpecificToolbarSuffixOnly': not exact and platform_suffix,
                  'bodyCache': transport.cache_verified(receipt, body)}
        if job['kind'] == 'html':
            footers = FOOTER.findall(content)
            assert footers == [context['template']], 'Footer differs from the single canonical template.'
            assert len(CSS_LINK.findall(content)) == 1
            links = Document(footers[0].decode('utf-8')).links
            assert links == context['links'] and len(links) == 11, 'Canonical footer destinations differ.'
            outside = CSS_LINK.sub(b'', FOOTER.sub(b'', content))
            outside_sha = sha(outside)
            assert outside_sha == context['guards'][job['expectedFile']]['outsideFooterSha256'], 'Outside-footer content changed.'
            mains = re.findall(rb'<main\b[^>]*>.*?</main>', content, re.S | re.I)
            expected_mains = re.findall(rb'<main\b[^>]*>.*?</main>', expected, re.S | re.I)
            assert mains == expected_mains
            result.update(footerSha256=sha(footers[0]), footerLinks=11,
                          outsideFooterSha256=outside_sha, outsideFooterByteIdentical=True,
                          mainSha256=sha(b''.join(mains)), mainByteIdentical=True)
        return result, content
    except Exception as error:
        return {**job, 'passed': False, 'result': 'FAIL', 'transport': receipt,
                'error': {'type': type(error).__name__, 'message': str(error)}}, None


def destinations(context, verified_bodies):
    results = []
    routes = {job['path']: job for job in context['jobs'] if job['kind'] == 'html'}
    for link in context['links']:
        href, parsed = link['href'], urlsplit(link['href'])
        if parsed.scheme == 'mailto':
            assert parsed.path == 'contacto@sollahms.cl' and not parsed.query
            results.append({**link, 'passed': True, 'verification': 'Exact mailto destination; no message sent or provider contacted.'})
        elif parsed.scheme == 'https' and parsed.hostname == 'wa.me':
            assert parsed.path == '/56948502440' and len(parse_qs(parsed.query).get('text', [])) == 1
            results.append({**link, 'passed': True, 'verification': 'Exact canonical WhatsApp deep link; no provider request or message sent.'})
        else:
            assert not parsed.scheme and not parsed.netloc and parsed.path in routes
            assert parsed.path in verified_bodies
            body = verified_bodies[parsed.path]
            if parsed.fragment:
                assert parsed.fragment in Document(body.decode('utf-8')).ids, 'Footer fragment target is absent.'
            results.append({**link, 'passed': True, 'verification': 'Destination HTTP source verified once and fragment present when supplied.',
                            'verifiedRoute': parsed.path, 'fragment': parsed.fragment or None, 'duplicateNetworkRequest': False})
    assert len(results) == 11
    return results


def run(mode):
    context = plan()
    manifest = context['manifest']
    pin = manifest['inventorySHA256']
    created, origin = target(mode, pin)
    deployment = created['deploymentId']
    jobs = list(context['jobs'])
    jobs.append({'kind': 'redirect', 'path': '/index.html', 'expectedStatus': 308,
                 'expectedLocation': origin + '/'})
    if mode in ['baseline', 'public']:
        for host in ['www.sollahms.cl', 'sollhams.cl']:
            jobs.append({'kind': 'redirect', 'host': host, 'path': '/', 'expectedStatus': 308,
                         'expectedLocation': PUBLIC + '/'})
    transport = Transport(mode, deployment, origin, pin)
    now = datetime.now(timezone.utc)
    report = {'startedAtUTC': now.isoformat(), 'checkedAt': now.astimezone(ZoneInfo('America/Santiago')).isoformat(),
              'timezone': 'America/Santiago', 'mode': mode, 'deployment': deployment, 'deploymentId': deployment,
              'origin': origin, 'sourceCommit': created['sourceCommit'], 'artifactPin': pin,
              'candidateInventorySHA256': pin, 'manifestFileSha256': context['manifestFileSha256'],
              'htmlPreservationFileSha256': context['preservationFileSha256'],
              'footerTemplateSha256': context['templateSha256'], 'maxConcurrency': MAX_WORKERS,
              'passed': False, 'results': [], 'footerDestinations': [],
              'applicationAPIRequests': 0, 'providerRequests': 0, 'formsSubmitted': 0,
              'networkWrites': 0, 'mutations': 0, 'credentialsOrRawHeadersRecorded': False,
              'tlsVerificationDisabled': False, 'sourceEnvironmentsRead': 0,
              'separateNativeVerification': 'release/verify-release.py owns five aliases/default-domain resolution, SSO, settings and function registration.'}
    verified_bodies = {}
    try:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            pending = {pool.submit(verify_job, job, transport, context): job for job in jobs}
            for future in as_completed(pending):
                result, body = future.result()
                report['results'].append(result)
                if body is not None and result['kind'] == 'html':
                    verified_bodies[result['path']] = body
                if len(report['results']) % 20 == 0:
                    print(json.dumps({'mode': mode, 'completed': len(report['results']), 'planned': len(jobs),
                                      'failed': sum(not row['passed'] for row in report['results'])}), flush=True)
        report['results'].sort(key=lambda row: (row.get('host', ''), row['path']))
        assert all(row['passed'] for row in report['results']), 'One or more bounded HTTP checks failed.'
        assert len(verified_bodies) == 168
        report['footerDestinations'] = destinations(context, verified_bodies)
        report['passed'] = True
    except Exception as error:
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        rows = report['results']
        html_rows = [row for row in rows if row['kind'] == 'html']
        report['summary'] = {'plannedRequests': len(jobs), 'completedRequests': len(rows),
              'passedRequests': sum(row['passed'] for row in rows), 'htmlPages': len(html_rows),
              'htmlPassed': sum(row['passed'] for row in html_rows),
              'htmlPagesVerified': sum(row['passed'] for row in html_rows),
              'sourceBytesExact': sum(row.get('sourceBytesExactlyIdentical', False) for row in html_rows),
              'exactToolbarSuffixOnly': sum(row.get('knownDeploymentSpecificToolbarSuffixOnly', False) for row in html_rows),
              'outsideFooterExact': sum(row.get('outsideFooterByteIdentical', False) for row in html_rows),
              'mainExact': sum(row.get('mainByteIdentical', False) for row in html_rows),
              'assetRequests': sum(row['kind'] == 'asset' for row in rows),
              'redirectRequests': sum(row['kind'] == 'redirect' for row in rows),
              'tlsVerifiedRequests': sum(row.get('transport', {}).get('sslVerifyResult') == 0 for row in rows if row.get('transport')),
              'footerDestinations': len(report['footerDestinations']), 'networkConcurrencyLimit': MAX_WORKERS}
        report['finishedAtUTC'] = datetime.now(timezone.utc).isoformat()
        destination = QA / ('http-' + mode) / 'results.json'
        save(destination, report)
        print(json.dumps({'mode': mode, 'passed': report['passed'], 'deploymentId': deployment,
                          'artifactPin': pin, 'summary': report['summary'], 'report': str(destination)}), flush=True)
    assert report['passed'], 'HTTP verification failed; inspect the sanitized result before proceeding.'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--baseline', action='store_true')
    group.add_argument('--isolated', action='store_true')
    group.add_argument('--public', action='store_true')
    group.add_argument('--plan', action='store_true')
    args = parser.parse_args()
    if args.plan:
        context = plan()
        print(json.dumps({'passed': True, 'mode': 'offline-plan', 'networkRequests': 0,
                          'artifactPin': context['manifest']['inventorySHA256'], 'htmlPages': 168,
                          'localAssets': 3, 'footerDestinations': 11, 'maxConcurrency': MAX_WORKERS}))
    else:
        run('baseline' if args.baseline else 'isolated' if args.isolated else 'public')
