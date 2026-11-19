"""Read-only MIME and byte checks; never persists authenticated headers."""
import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--url', required=True)
p.add_argument('--static-root', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
paths = {'assets/js/site-measurement.mjs': ('application/javascript', 'text/javascript'),
         'assets/css/site-measurement.css': ('text/css',),
         'data/site-measurement.json': ('application/json',),
         'assets/branding/favicon.png': ('image/png',)}
rows = []
for path, allowed in paths.items():
    r = subprocess.run(['/Users/luissandoval/.npm-global/bin/vercel', 'curl', a.url.rstrip('/') + '/' + path,
                        '--scope', 'team_A9VNIW2f2K1IJpd2pGdvDmEN', '--',
                        '--silent', '--show-error', '--include'], capture_output=True, check=True)
    header, separator, body = r.stdout.partition(b'\r\n\r\n')
    if not separator:
        raise ValueError('Missing HTTP headers')
    status = int(header.splitlines()[0].split()[1])
    mime = next((line.split(b':', 1)[1].strip().decode().split(';')[0] for line in header.splitlines()
                 if line.lower().startswith(b'content-type:')), '')
    expected = (a.static_root / path).read_bytes()
    rows.append({'path': path, 'status': status, 'contentType': mime, 'bytes': len(body),
                 'sha256': hashlib.sha256(body).hexdigest(), 'exactCandidate': body == expected,
                 'passed': status == 200 and mime in allowed and body == expected})
receipt = {'observedAtUTC': datetime.now(timezone.utc).isoformat(), 'method': 'Authenticated GETs using existing Vercel CLI auth',
           'url': a.url, 'passed': sum(r['passed'] for r in rows), 'failed': sum(not r['passed'] for r in rows),
           'formsSubmitted': 0, 'providerBeaconsSent': 0, 'secretsStored': False, 'results': rows}
a.output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({k: receipt[k] for k in ('passed', 'failed')}))
if receipt['failed']:
    raise SystemExit('Preview asset verification failed')
