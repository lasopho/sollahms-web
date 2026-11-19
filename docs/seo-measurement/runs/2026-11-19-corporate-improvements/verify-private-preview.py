"""Read-only check of the private preview using existing Vercel authentication.

Headers/tokens/cookies and raw authenticated responses are never written.
"""
import argparse
import hashlib
import json
import re
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

URL = 'https://project-wrapp-rn92204ce-lsandoval2-8260s-projects.vercel.app'
DEPLOYMENT = 'dpl_ArP1s3VmT6pFfjRumb9JZXdcfPvF'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
TOOLBAR = ('<script async data-explicit-opt-in="true" data-deployment-id="' + DEPLOYMENT + '" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--static-root', type=Path, required=True)
    parser.add_argument('--scope-registry', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--vercel', default='vercel')
    parser.add_argument('--url', default=URL)
    parser.add_argument('--deployment', default=DEPLOYMENT)
    args = parser.parse_args()
    toolbar = ('<script async data-explicit-opt-in="true" data-deployment-id="' + args.deployment + '" src="https://vercel.live/_next-live/feedback/feedback.js"></script>').encode()
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *_):
            return None
    anonymous_login_redirect = False
    anonymous_location = None
    try:
        response = urllib.request.build_opener(NoRedirect).open(args.url, timeout=30)
        anonymous_status = response.status
        response.close()
    except urllib.error.HTTPError as error:
        anonymous_status = error.code
        location = urlsplit(error.headers.get('Location', ''))
        anonymous_location = {'host': location.hostname, 'path': location.path}
        anonymous_login_redirect = anonymous_status in (302, 307) and location.hostname == 'vercel.com' and location.path in ('/sso-api', '/login')
        error.close()
    pages = json.loads(args.scope_registry.read_text())['included_urls']
    paths = [('index.html' if url.endswith('.cl/') else url.rsplit('/', 1)[1]) for url in pages]
    results = []
    for path in paths + ['sitemap.xml', 'robots.txt']:
        request_path = '/' if path == 'index.html' else '/' + path
        process = subprocess.run([args.vercel, 'curl', args.url + request_path, '--scope', TEAM,
                                  '--', '--silent', '--show-error', '--include'],
                                 capture_output=True, check=True)
        header, separator, body = process.stdout.partition(b'\r\n\r\n')
        if not separator:
            raise ValueError('Missing HTTP headers')
        status = int(header.splitlines()[0].split()[1])
        # The service's standard preview toolbar is the only permitted runtime
        # addition. Keep raw and normalized digests separate in the receipt.
        toolbar_count = body.count(toolbar)
        normalized = body.replace(toolbar, b'') if toolbar_count == 1 else body
        expected = (args.static_root / path).read_bytes()
        robots = [line.split(b':', 1)[1].strip().decode() for line in header.splitlines()
                  if line.lower().startswith(b'x-robots-tag:')]
        html = path.endswith('.html')
        passed = status == 200 and normalized == expected and (not html or any('noindex' in value for value in robots))
        results.append({'path': path, 'status': status, 'xRobotsTag': robots,
                        'rawSHA256': digest(body), 'candidateSHA256': digest(expected),
                        'withoutVercelToolbarSHA256': digest(normalized),
                        'vercelToolbarCount': toolbar_count, 'exactCandidateAfterServiceToolbar': normalized == expected,
                        'passed': passed})
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'timezone': 'America/Santiago',
              'deployment': args.deployment, 'url': args.url, 'environment': 'preview',
              'anonymousStatus': anonymous_status, 'anonymousLoginRedirect': anonymous_location,
              'anonymousProtected': anonymous_status in (401, 403) or anonymous_login_redirect,
              'passed': sum(row['passed'] for row in results), 'failed': sum(not row['passed'] for row in results),
              'results': results, 'method': 'One anonymous GET, authenticated Vercel CLI GETs; exact candidate bytes after removal of exactly one known Vercel Preview toolbar script where present.',
              'providerCalls': 0, 'formsSubmitted': 0, 'indexingRequests': 0,
              'protectionSettingsChanged': False, 'secretsStored': False}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ('anonymousStatus', 'anonymousProtected', 'passed', 'failed')}))
    if report['failed'] or not report['anonymousProtected']:
        raise SystemExit('Preview verification failed')


if __name__ == '__main__':
    main()
