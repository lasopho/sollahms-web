"""Offline HTTP/static mapping and negative integrity tests, not a Vercel router emulator."""
import functools
import hashlib
import http.server
import importlib.util
import json
import subprocess
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('assembler', HERE / 'prepare-isolated.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
work = Path(sys.argv[1]).resolve()
report_path = Path(sys.argv[2]).resolve()
assert not report_path.exists(), 'Use a new report path; preserve historical evidence'
output = work / '.vercel/output'
proof = module.verify(output)
projects = json.loads((module.ROOT / 'data/proyectos.json').read_text())
assert len(projects) == 131
assert all((output / 'static' / (p['slug'] + '.html')).is_file() for p in projects)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(output / 'static')))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}'
checks = []
try:
    routes = [('/', output / 'static/index.html')]
    routes += [('/' + p.relative_to(output / 'static').as_posix(), p)
               for p in sorted((output / 'static').rglob('*')) if p.is_file()]
    for route, path in routes:
        with urllib.request.urlopen(base + urllib.parse.quote(route), timeout=5) as response:
            data = response.read()
            assert response.status == 200 and data == path.read_bytes(), route
            checks.append({'route': route, 'status': 200, 'sha256': hashlib.sha256(data).hexdigest()})
    for route in ['/static/inn-puerto-chico.html', '/functions/api/contact.func/api/contact.mjs', '/config.json']:
        try:
            urllib.request.urlopen(base + route, timeout=5)
            raise AssertionError('Internal artifact served: ' + route)
        except urllib.error.HTTPError as error:
            assert error.code == 404
finally:
    server.shutdown()
    server.server_close()

negative = []
target = output / 'static/inn-puerto-chico.html'
original = target.read_bytes()
try:
    target.write_bytes(original + b'\n')
    try:
        module.verify(output)
        raise RuntimeError('Mutation incorrectly accepted')
    except AssertionError:
        negative.append('changed-byte-rejected')
finally:
    target.write_bytes(original)
extra = output / 'unexpected.txt'
try:
    extra.write_text('unexpected')
    try:
        module.verify(output)
        raise RuntimeError('Extra file incorrectly accepted')
    except AssertionError:
        negative.append('extra-file-rejected')
finally:
    extra.unlink()
cfg = output / 'functions/api/contact.func/.vc-config.json'
saved = cfg.read_bytes()
try:
    cfg.unlink()
    try:
        module.verify(output)
        raise RuntimeError('Missing function config incorrectly accepted')
    except AssertionError:
        negative.append('missing-function-config-rejected')
finally:
    cfg.write_bytes(saved)
after = module.verify(output)
assert after == proof
report = {'staticHttpChecks': len(checks), 'internalPathsNotServed': 3,
          'fichesIncludedInStaticHttpChecks': 131,
          'negativeChecks': negative, 'outputUnchangedAfterTests': True,
          'remoteQa': False, 'scope': 'Python static root mapping only; not complete Vercel routing.',
          'checks': checks}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'checks'}, indent=2))
