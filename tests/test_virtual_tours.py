"""Real catalogue regressions and future rendering of absent/invalid tours."""
import copy
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
BASE = '3f7b7e481e632e06d36702f556f6f2bca61bc55b'
sys.path.insert(0, str(ROOT / 'scripts'))
from virtual_tour_policy import usable_virtual_tours, virtual_tours_to_render, hide_absent_virtual_tours
spec = importlib.util.spec_from_file_location('details', ROOT / 'scripts/build-project-details.py')
details = importlib.util.module_from_spec(spec)
spec.loader.exec_module(details)
PROJECTS = json.loads((ROOT / 'data/proyectos.json').read_text())
RECORDS = {r['slug']: r for r in json.loads((ROOT / 'data/fichas-proyectos.json').read_text())}
TEMPLATE = Template((ROOT / 'templates/project-detail.html').read_text())

def original(path):
    return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)

class Nodes(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.nodes = []
        self.feed(page)
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

class VirtualTours(unittest.TestCase):
    def test_source_records_and_prices_stay_exact(self):
        for path in ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json',
                     'data/brochures-aj-urbana.json', 'data/brochures-ingevec.json']:
            self.assertEqual((ROOT / path).read_bytes(), original(path), path)
        self.assertEqual(len(PROJECTS), 144)
        self.assertEqual(sum(bool(r['virtualTours']) for r in RECORDS.values()), 62)
        self.assertEqual(sum(len(r['virtualTours']) for r in RECORDS.values()), 100)

    def test_61_tour_pages_are_byte_identical(self):
        preserved = [r for r in RECORDS.values() if r['virtualTours'] and r['slug'] != 'irarrazaval']
        self.assertEqual(len(preserved), 61)
        self.assertEqual(sum(len(r['virtualTours']) for r in preserved), 99)
        for r in preserved:
            self.assertEqual((ROOT / (r['slug'] + '.html')).read_bytes(), original(r['slug'] + '.html'))
        self.assertEqual(sum(t.get('provider') == 'Matterport' for r in preserved for t in r['virtualTours']), 23)

    def test_all_83_absent_or_unassociated_sections_are_removed(self):
        hidden = [r for r in RECORDS.values() if not r['virtualTours'] or r['slug'] == 'irarrazaval']
        self.assertEqual(len(hidden), 83)
        for r in hidden:
            page = (ROOT / (r['slug'] + '.html')).read_text()
            self.assertNotRegex(page, r'id=["\']recorrido["\']|href=["\']#recorrido["\']')
            self.assertNotIn('Recorridos y experiencias oficiales', page)
            self.assertNotIn('Consulta la disponibilidad de un recorrido virtual', page)
            if 'id="modelos"' in page:
                self.assertIn('href="#modelos"', page, r['slug'] + ': plan navigation missing')
            for t in r['virtualTours']:
                self.assertNotIn(t['url'], page)

    def test_internal_fragments_resolve_on_all_144_pages(self):
        for p in PROJECTS:
            nodes = Nodes((ROOT / (p['slug'] + '.html')).read_text()).nodes
            ids = [a['id'] for _, a in nodes if a.get('id')]
            self.assertEqual(len(ids), len(set(ids)), p['slug'])
            for tag, attrs in nodes:
                href = attrs.get('href', '')
                if tag == 'a' and href.startswith('#'):
                    self.assertIn(href[1:], ids, p['slug'] + ':' + href)

    def test_all_269_resources_and_142_plans_keep_hashes(self):
        resources = plans = 0
        for name in ['brochures-aj-urbana.json', 'brochures-ingevec.json']:
            for record in json.loads((ROOT / 'data' / name).read_text())['projects']:
                plans += len(record['models'])
                for item in record['images'] + [m['plan'] for m in record['models']]:
                    path = ROOT / item['localPath'].lstrip('/')
                    if path.is_file():
                        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item['sha256'])
                    else:
                        # Public Git CI has no private Ingevec derivatives.
                        # Packaging separately requires every one of these bytes.
                        self.assertTrue(item['localPath'].startswith('/assets/propiedades/ingevec-preview/'))
                        self.assertEqual(subprocess.run(['git', 'check-ignore', '-q', '--', str(path)], cwd=ROOT).returncode, 0)
                    resources += 1
        self.assertEqual((resources, plans), (269, 142))

    def test_photos_and_plan_elements_are_unchanged(self):
        for p in PROJECTS:
            path = p['slug'] + '.html'
            images = lambda html: [a for tag, a in Nodes(html).nodes if tag == 'img']
            self.assertEqual(images((ROOT / path).read_text()), images(original(path).decode()), path)

    def test_search_and_mortgage_comparator_sources_are_unchanged(self):
        paths = ['index.html', 'proyectos.html', 'comparador-hipotecario.html',
                 'data/hipotecario.json', 'api/uf.mjs', 'assets/js/hipotecario.mjs',
                 'assets/js/purchase-capacity-ui.mjs', 'assets/js/project-finance.mjs']
        for path in paths:
            self.assertEqual((ROOT / path).read_bytes(), original(path), path)

    def test_future_rendering_of_all_144_pages_matches_policy(self):
        sections = tours = 0
        for p in PROJECTS:
            page, _, count = details.render(p, RECORDS[p['slug']], TEMPLATE)
            if 'id="modelos"' in page:
                self.assertIn('href="#modelos"', page, p['slug'] + ': plan navigation missing')
            expected = bool(RECORDS[p['slug']]['virtualTours']) and p['slug'] != 'irarrazaval'
            self.assertEqual('id="recorrido"' in page, expected, p['slug'])
            self.assertEqual('href="#recorrido"' in page, expected, p['slug'])
            self.assertNotIn('Consulta la disponibilidad de un recorrido virtual', page)
            self.assertEqual(count, len(RECORDS[p['slug']]['virtualTours']) if expected else 0)
            sections += expected
            tours += count
        self.assertEqual((sections, tours), (61, 99))

    def test_future_empty_record_never_renders_a_tour(self):
        record = copy.deepcopy(RECORDS['endemico'])
        record['virtualTours'] = []
        self.assertEqual(virtual_tours_to_render(record), [])
        p = next(p for p in PROJECTS if p['slug'] == 'endemico')
        page, _, count = details.render(p, record, TEMPLATE)
        self.assertEqual(count, 0)
        self.assertNotIn('id="recorrido"', page)
        self.assertNotIn('href="#recorrido"', page)
        self.assertIn('id="ubicacion"', page)

    def test_future_photos_plans_videos_and_maps_are_not_tours(self):
        record = copy.deepcopy(RECORDS['endemico'])
        tour = copy.deepcopy(record['virtualTours'][0])
        for url in ['https://example.test/photo.jpg', 'https://example.test/plan.pdf',
                    'https://example.test/video.mp4', 'https://www.youtube.com/embed/example',
                    'https://www.google.com/maps?output=embed&q=Chile',
                    'https://maps.apple.com/?q=Chile', 'https://www.bing.com/maps?q=Chile',
                    'https://www.openstreetmap.org/?mlat=-33', 'https://www.waze.com/live-map/']:
            with self.subTest(url=url):
                record['virtualTours'] = [dict(tour, url=url)]
                self.assertEqual(virtual_tours_to_render(record), [])
        for kind in ['photograph', 'floorplan', 'video', 'map']:
            record['virtualTours'] = [dict(tour, resourceType=kind)]
            self.assertEqual(virtual_tours_to_render(record), [])

    def test_future_unsafe_or_unverified_links_are_rejected(self):
        record = copy.deepcopy(RECORDS['endemico'])
        tour = copy.deepcopy(record['virtualTours'][0])
        for values in [{'url': 'http://example.test/tour'}, {'url': 'javascript:alert(1)'},
                       {'url': 'https://user:pass@example.test/tour'}, {'sourceUrl': ''},
                       {'url': 'https://[invalid'}, {'visualVerification': {}},
                       {'embedStatus': 'visual_pending'}, {'verificationStatus': 'unavailable'}]:
            with self.subTest(values=values):
                record['virtualTours'] = [dict(tour, **values)]
                self.assertEqual(usable_virtual_tours(record), [])
                self.assertEqual(virtual_tours_to_render(record), [])

    def test_future_identity_conflicts_are_rejected(self):
        record = copy.deepcopy(RECORDS['endemico'])
        tour = copy.deepcopy(record['virtualTours'][0])
        for values in [{'identityLimitation': 'Association unconfirmed'}, {'identityStatus': 'mismatch'},
                       {'projectSlug': 'other-project'}]:
            record['virtualTours'] = [dict(tour, **values)]
            self.assertEqual(virtual_tours_to_render(record), [])
        self.assertEqual(virtual_tours_to_render(RECORDS['irarrazaval']), [])

    def test_alternate_registered_links_survive_with_one_usable_tour(self):
        for slug in ['endemico', 'vista-bulnes']:
            self.assertTrue(usable_virtual_tours(RECORDS[slug]))
            self.assertEqual(virtual_tours_to_render(RECORDS[slug]), RECORDS[slug]['virtualTours'])

    def test_legacy_mixed_sections_keep_images_specs_and_maps(self):
        empty = {'slug': 'example', 'virtualTours': []}
        page = '<section id="detalle-adicional"><h2>Galería oficial</h2><img src="/photo.webp">' \
               '<h2>Superficies y distribución</h2><ul><li>54 m²</li></ul>' \
               '<h2>Recorridos y experiencias oficiales</h2><p>Recorrido virtual oficial específico pendiente de verificación.</p></section>' \
               '<section id="ubicacion"><iframe src="https://www.google.com/maps?q=Chile"></iframe></section>'
        result = hide_absent_virtual_tours(page, empty)
        self.assertIn('<img src="/photo.webp">', result)
        self.assertIn('<li>54 m²</li>', result)
        self.assertIn('https://www.google.com/maps?q=Chile', result)
        self.assertNotIn('Recorridos y experiencias oficiales', result)
        self.assertEqual(hide_absent_virtual_tours(result, empty), result)
        for slug in ['inn-puerto-chico', 'edificio-suecia']:
            result = hide_absent_virtual_tours((ROOT / (slug + '.html')).read_text(), empty)
            self.assertNotIn('Recorrido virtual 360°', result)
            self.assertNotIn('my.matterport.com/show/', result)
            self.assertIn('https://www.google.com/maps', result)

if __name__ == '__main__':
    unittest.main()
