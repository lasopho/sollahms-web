from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit

TECH=Path('/private/tmp/sollahms-referencias-documentales-131-20261117')
BASE=Path('/private/tmp/sollahms-cotizaciones-mismo-origen-release-20261117/stage/.vercel/output/static')
FILES=['assets/js/catalog-model.mjs','assets/js/commercial-filter-engine.mjs','assets/js/documentary-local-review.mjs','assets/js/documentary-reference-data.mjs','tests/fixtures/iris-documentary-15.json','tests/fixtures/plaza-213-reference.json','tests/fixtures/iris-documentary-additions-2.json']
OVERRIDES={'/'+name:str(TECH/name) for name in FILES}
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        return OVERRIDES.get(urlsplit(path).path) or super().translate_path(path)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def log_message(self,format,*args):
        pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BASE)))
print('LOCAL_REVIEW_URL=http://127.0.0.1:'+str(server.server_port)+'/proyectos.html?revision_documental=1&evidencia=documentary',flush=True)
server.serve_forever()
