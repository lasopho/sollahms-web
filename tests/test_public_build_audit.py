"""Negative controls for the independent, offline launch audit."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest


MODULE = Path(__file__).with_name('audit_public_build.py')
spec = importlib.util.spec_from_file_location('public_build_audit', MODULE)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


class PublicBuildAuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-public-audit-negative-')
        self.base = Path(self.temporary.name)
        self.source, self.public, self.preview = [self.base / p for p in ['source', 'public', 'preview']]
        (self.source / 'data').mkdir(parents=True)
        (self.public / 'data').mkdir(parents=True)
        aj = ['downtown-san-martin', 'edificio-teatinos-750', 'edificio-vista-amunategui', 'monjitas-690', 'vista-morande']
        slugs = sorted(audit_module.INGEVEC) + aj + ['other-' + str(n) for n in range(123)]
        catalogue = [{'slug': slug, 'inmobiliaria': 'Ingevec' if slug in audit_module.INGEVEC else 'Other',
                      'detalleUrl': '/' + slug + '.html', 'imagenPrincipal': '/assets/generic.webp'} for slug in slugs]
        by_slug = {p['slug']: p for p in catalogue}
        references = {slug: [] for slug in slugs}
        for name, batch, folder in [('brochures-aj-urbana.json', aj, 'aj-urbana-preview'),
                                     ('brochures-ingevec.json', sorted(audit_module.INGEVEC), 'ingevec-preview')]:
            records = []
            for index, slug in enumerate(batch):
                prefix = '/assets/propiedades/' + folder + '/' + slug + '/'
                image_count = 107 if folder == 'aj-urbana-preview' and index == 0 else 1
                plan_count = 122 if folder == 'aj-urbana-preview' and index == 0 else 1
                images, models = [], []
                for kind, count in [('image', image_count), ('plan', plan_count)]:
                    for n in range(count):
                        path = prefix + kind + '-' + str(n) + '.webp'
                        payload = ('fixture-' + path).encode()
                        file = self.public / path.lstrip('/')
                        file.parent.mkdir(parents=True, exist_ok=True)
                        file.write_bytes(payload)
                        asset = {'localPath': path, 'sha256': hashlib.sha256(payload).hexdigest()}
                        if kind == 'image': images.append(asset)
                        else: models.append({'plan': asset})
                        references[slug].append(path)
                cover = {'localPath': images[0]['localPath']}
                by_slug[slug]['imagenPrincipal'] = cover['localPath']
                records.append({'slug': slug, 'catalogueCover': cover, 'images': images, 'models': models})
            (self.source / 'data' / name).write_text(json.dumps({'projects': records}))
        (self.public / 'assets/generic.webp').write_bytes(b'generic-fixture-image')
        (self.public / 'data/proyectos.json').write_text(json.dumps(catalogue))
        (self.public / 'data/hipotecario.json').write_text('{}')
        for slug in slugs:
            page = slug + '.html'
            html = '<html><head><link rel="canonical" href="https://sollahms.cl/' + page + '"><meta name="description" content="Fixture"></head><body><h1>' + slug + '</h1>'
            html += '<a href="/proyectos.html">Asset Portafolio</a>'
            html += ''.join('<a href="/' + route + '?proyecto=' + slug + '">Contextual action</a>' for route in ['contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html'])
            html += ''.join('<img src="' + path + '">' for path in references[slug]) + '</body></html>'
            (self.public / page).write_text(html)
        for page in audit_module.PAGES:
            (self.public / page).write_text('<html><head>' + ('<meta name="robots" content="noindex,follow">' if page == '404.html' else '') + '</head><body></body></html>')
        pages = audit_module.PAGES | {s + '.html' for s in slugs}
        urls = ['https://sollahms.cl/' + page for page in pages - {'index.html', '404.html'}] + ['https://sollahms.cl/']
        (self.public / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + url + '</loc></url>' for url in urls) + '</urlset>')
        (self.public / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://sollahms.cl/sitemap.xml\n')
        shutil.copytree(self.public, self.preview)
        for page in pages:
            path = self.preview / page
            text = path.read_text().replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>')
            if page in {'contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html'}:
                text = text.replace('<body>', '<body>' + audit_module.NOTICE)
            path.write_text(text)
        (self.preview / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')

    def tearDown(self):
        self.temporary.cleanup()

    def result(self):
        return audit_module.audit(self.source, self.public, self.preview)

    def test_complete_public_and_preview_twins_pass(self):
        result = self.result()
        self.assertTrue(result['ok'], result['errors'])
        self.assertEqual(result['counts']['brochureMedia'], 269)
        self.assertEqual(result['counts']['brochurePlans'], 142)
        self.assertEqual(result['counts']['canonicalFiches'], 144)
        self.assertEqual(result['networkRequests'], 0)

    def test_missing_selected_image_is_rejected(self):
        for root in [self.public, self.preview]:
            next(root.glob('assets/propiedades/ingevec-preview/*/image-0.webp')).unlink()
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Selected brochure image or plan missing' in e for e in result['errors']))

    def test_private_contract_or_candidate_is_rejected(self):
        for root in [self.public, self.preview]:
            (root / 'assets/internal-contract.pdf').write_bytes(b'PRIVATE-TEST-FIXTURE')
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Private document or candidate leaked' in e for e in result['errors']))

    def test_changed_catalogue_identity_is_rejected(self):
        for root in [self.public, self.preview]:
            path = root / 'data/proyectos.json'
            catalogue = json.loads(path.read_text())
            catalogue[0]['inmobiliaria'] = 'Unrelated'
            path.write_text(json.dumps(catalogue))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('sixteen approved Ingevec identities' in e for e in result['errors']))

    def test_visible_audit_is_rejected(self):
        page = sorted(audit_module.INGEVEC)[0] + '.html'
        for root in [self.public, self.preview]:
            path = root / page
            path.write_text(path.read_text().replace('</body>', '<h2>Procedencia documental</h2></body>'))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('audit displayed to visitors' in e for e in result['errors']))

    def test_real_content_difference_is_rejected(self):
        path = self.preview / 'assets/generic.webp'
        path.write_bytes(b'CHANGED-PREVIEW-FIXTURE')
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Preview/public asset or data differs' in e for e in result['errors']))

    def test_incorrect_canonical_is_rejected(self):
        page = sorted(audit_module.INGEVEC)[0] + '.html'
        for root in [self.public, self.preview]:
            path = root / page
            path.write_text(path.read_text().replace('https://sollahms.cl/' + page, 'https://unrelated.invalid/' + page))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Incorrect canonical' in e for e in result['errors']))


if __name__ == '__main__':
    unittest.main()
