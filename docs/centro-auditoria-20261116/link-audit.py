"""Read-only Centre link and preservation audit. No forms or API requests.

Run with --http to perform bounded public GETs of linked pages. HTTPS errors,
access denials and bot challenges remain reported; TLS is never disabled.
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
BASE = Path('/private/tmp/sollahms-contacto-baseline-20261116/.vercel/contacto-production-release-20261116/stage/.vercel/output')
STAGE = ROOT / '.vercel/centro-auditoria-20261116/stage/.vercel/output'
OVERLAY = {'static/centro-orientacion.html', 'static/assets/css/orientacion.css', 'static/assets/js/orientacion.mjs'}
SOURCE_SHA = '534bf362b8960e275f5b8b42b5c786027906a4cb'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save(name, data):
    (DOCS / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.controls, self.forms, self.meta = set(), [], [], [], []
        self.current_form = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a':
            self.links.append(attrs.get('href'))
        if tag == 'form':
            self.current_form = attrs.get('id')
            self.forms.append({k: v for k, v in attrs.items() if k not in {'class', 'style', 'data-scroll-static'}})
        if tag in {'input', 'select', 'textarea', 'option'}:
            self.controls.append({'tag': tag, 'form': self.current_form, 'attrs': {k: v for k, v in attrs.items() if k not in {'class', 'style', 'data-scroll-static'}}})
        if tag == 'meta' or (tag == 'link' and attrs.get('rel') == 'canonical'):
            self.meta.append({'tag': tag, 'attrs': attrs})

    def handle_endtag(self, tag):
        if tag == 'form':
            self.current_form = None


def tree(root):
    return {p.relative_to(root).as_posix(): {'bytes': p.stat().st_size, 'sha256': digest(p.read_bytes())} for p in root.rglob('*') if p.is_file()}


def preserve():
    prior_report = DOCS / 'source-preservation.json'
    prior_regression = json.loads(prior_report.read_text()).get('regression') if prior_report.exists() else None
    before = (BASE / 'static/centro-orientacion.html').read_text()
    after = (ROOT / 'centro-orientacion.html').read_text()
    bp, ap = Page(before), Page(after)
    source_protected = []
    paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', SOURCE_SHA], cwd=ROOT, text=True).splitlines()
    financial = {'assets/js/orientation-engine.mjs', 'assets/js/mortgage-engine.mjs', 'assets/js/official-uf.mjs', 'assets/js/project-finance.mjs', 'assets/js/mortgage-data.mjs', 'assets/js/commercial-fields.mjs', 'assets/js/rut-field.mjs', 'assets/js/form-operation.mjs', 'assets/js/scroll-presence.js', 'assets/css/sollahms-theme.css', 'scripts/scroll_presence.py', 'contacto.html', 'data/proyectos.json'}
    for path in paths:
        if path.startswith(('api/', 'lib/')) or path in financial:
            original = subprocess.check_output(['git', 'show', SOURCE_SHA + ':' + path], cwd=ROOT)
            actual = (ROOT / path).read_bytes()
            source_protected.append({'path': path, 'same': original == actual, 'bytes': len(actual), 'sha256': digest(actual)})
    bt, at = tree(BASE), tree(STAGE)
    added, removed = sorted(at.keys() - bt.keys()), sorted(bt.keys() - at.keys())
    changed = sorted(p for p in bt.keys() & at.keys() if bt[p] != at[p])
    function_paths = [p for p in bt if p.startswith('functions/')]
    html_paths = [p for p in bt if p.startswith('static/') and p.endswith('.html')]
    rows = json.loads((BASE / 'static/data/proyectos.json').read_text())
    fiche_paths = ['static/' + row['slug'] + '.html' for row in rows]
    same = lambda p: bt.get(p) == at.get(p)
    result = {
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'productionDeployment': 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w', 'productionSourceSha': SOURCE_SHA,
        'metadataExact': bp.meta == ap.meta,
        'titleExact': re.search(r'<title>.*?</title>', before, re.S).group() == re.search(r'<title>.*?</title>', after, re.S).group(),
        'jsonLdExact': re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>.*?</script>', before, re.S) == re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>.*?</script>', after, re.S),
        'formsExact': bp.forms == ap.forms, 'controlsExact': bp.controls == ap.controls,
        'controlCount': len(ap.controls), 'formCount': len(ap.forms),
        'sourceProtectedFiles': source_protected,
        'stage': {'filesBefore': len(bt), 'filesAfter': len(at), 'added': added, 'removed': removed, 'changed': changed,
                  'outsideOverlayChanged': sorted(set(changed) - OVERLAY),
                  'functions': len(function_paths), 'functionBundles': len(list((BASE / 'functions/api').glob('*.func'))),
                  'functionsByteIdentical': all(same(p) for p in function_paths),
                  'htmlPages': len(html_paths), 'otherHtmlByteIdentical': all(same(p) for p in html_paths if p != 'static/centro-orientacion.html'),
                  'activeProjects': len(rows), 'all131FichesByteIdentical': len(rows) == 131 and all(same(p) for p in fiche_paths),
                  'contactoByteIdentical': same('static/contacto.html'), 'configByteIdentical': same('config.json'),
                  'sourceOverlayMatchesStage': all((ROOT / p.removeprefix('static/')).read_bytes() == (STAGE / p).read_bytes() for p in OVERLAY)},
    }
    result['status'] = 'PASS' if all([result['metadataExact'], result['titleExact'], result['jsonLdExact'], result['formsExact'], result['controlsExact'], all(p['same'] for p in source_protected), not added, not removed, not result['stage']['outsideOverlayChanged'], result['stage']['functionsByteIdentical'], result['stage']['otherHtmlByteIdentical'], result['stage']['all131FichesByteIdentical'], result['stage']['configByteIdentical'], result['stage']['sourceOverlayMatchesStage']]) else 'FAIL'
    if prior_regression:
        result['regression'] = prior_regression
    save('source-preservation.json', result)
    return result


def request_public(url):
    parsed = urllib.parse.urlsplit(url)
    assert parsed.scheme == 'https' and not parsed.username and not parsed.password
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Sollahms link audit', 'Accept': 'text/html,application/xhtml+xml'}, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read(262144)
            final_https = urllib.parse.urlsplit(response.url).scheme == 'https'
            return {'url': url, 'status': response.status, 'finalUrl': response.url, 'bytesSampled': len(body), 'tlsVerified': final_https, 'result': ('PASS' if final_https else 'PASS_HTTP_DOWNGRADE') if response.status < 400 else 'BROKEN_HTTP'}
    except urllib.error.HTTPError as error:
        return {'url': url, 'status': error.code, 'finalUrl': error.url, 'tlsVerified': urllib.parse.urlsplit(error.url).scheme == 'https', 'result': 'ACCESS_RESTRICTED' if error.code in {401, 403, 429} else 'BROKEN_HTTP'}
    except Exception as error:
        return {'url': url, 'status': None, 'error': str(error), 'result': 'UNVERIFIED_NETWORK'}


def links(http=False):
    current = Page((ROOT / 'centro-orientacion.html').read_text())
    hrefs = sorted(set(h for h in current.links if h is not None))
    engine = (ROOT / 'assets/js/orientation-engine.mjs').read_text()
    journey_hrefs = re.findall(r"href:\s*'([^']+)'", engine)
    local, external, communication = [], [], []
    for href in sorted(set(hrefs + journey_hrefs)):
        if href.startswith(('mailto:', 'tel:')):
            communication.append({'href': href, 'result': 'VALID_SCHEME_NOT_SENT'})
            continue
        parsed = urllib.parse.urlsplit(href)
        if parsed.scheme or parsed.netloc:
            external.append(href)
            continue
        path = parsed.path or '/centro-orientacion.html'
        if path == '/':
            path = '/index.html'
        file = ROOT / path.lstrip('/') if path == '/centro-orientacion.html' else BASE / 'static' / path.lstrip('/')
        exists = file.is_file()
        fragment = not parsed.fragment or (exists and parsed.fragment in Page(file.read_text()).ids)
        local.append({'href': href, 'fileExists': exists, 'fragmentExists': fragment, 'result': 'PASS' if exists and fragment else 'FAIL'})
    if http:
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            external_results = sorted(pool.map(request_public, external), key=lambda row: row['url'])
    else:
        external_results = [{'url': url, 'result': 'PENDING_HTTP'} for url in external]
    result = {'createdAt': datetime.now(timezone.utc).isoformat(), 'method': 'HTML parser + exact local static file/ID resolution; bounded HTTPS entry-point GET with server redirects followed; no forms, API calls or messages', 'anchorCount': len(current.links), 'uniqueHtmlHrefs': len(hrefs), 'dynamicJourneyHrefs': journey_hrefs, 'local': local, 'external': external_results, 'communication': communication, 'emptyHrefs': [h for h in current.links if not h], 'localPass': all(row['result'] == 'PASS' for row in local), 'externalSummary': {state: sum(row['result'] == state for row in external_results) for state in sorted(set(row['result'] for row in external_results))}}
    save('link-audit.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--http', action='store_true')
    parser.add_argument('--source-only', action='store_true', help='Refresh only preservation proof; retain certified link results.')
    args = parser.parse_args()
    proof = preserve()
    summary = {'preservation': proof['status'], 'sourceProtectedFiles': len(proof['sourceProtectedFiles']), 'changedStageFiles': proof['stage']['changed'], 'stageOverlayCurrent': proof['stage']['sourceOverlayMatchesStage']}
    if not args.source_only:
        audit = links(args.http)
        summary.update({'localLinks': len(audit['local']), 'localPass': audit['localPass'], 'externalSummary': audit['externalSummary'], 'emptyHrefs': audit['emptyHrefs']})
    print(json.dumps(summary, ensure_ascii=False))
    if proof['status'] != 'PASS':
        raise SystemExit(1)
