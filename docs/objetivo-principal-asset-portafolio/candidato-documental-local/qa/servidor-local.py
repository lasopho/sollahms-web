from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
import posixpath
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8766)
parser.add_argument('--fail-fixture', action='store_true')
options = parser.parse_args()

WORKTREE = Path('/private/tmp/sollahms-referencias-documentales-131-20261117')
FROZEN = Path('/private/tmp/sollahms-pr32-release-20261117/stage/.vercel/output/static')

class ReviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if options.fail_fixture and urlsplit(self.path).path == '/tests/fixtures/iris-documentary-15.json':
            self.send_error(503, 'Intentional local fixture failure for fallback verification')
            return
        super().do_GET()

    def translate_path(self, path):
        relative = posixpath.normpath(unquote(urlsplit(path).path)).lstrip('/')
        parts = [p for p in relative.split('/') if p not in ('', '.', '..')]
        candidate = WORKTREE.joinpath(*parts)
        if candidate.exists():
            return str(candidate)
        return str(FROZEN.joinpath(*parts))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, format, *args):
        if args and str(args[1] if len(args) > 1 else '') not in ('200', '304'):
            super().log_message(format, *args)

server = ThreadingHTTPServer(('127.0.0.1', options.port), ReviewHandler)
print('Review server: http://127.0.0.1:'+str(options.port)+'; T2 sources plus frozen production assets; no build or deployment; intentional fixture failure='+str(options.fail_fixture), flush=True)
server.serve_forever()
