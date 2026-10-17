"""Current P2 embed behavior; independent of frozen historical presentations."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from project_embed_policy import normalize_page_embeds
from virtual_tour_policy import usable_virtual_tours, virtual_tours_to_render


def research(verification=None, *, missing=False):
    tour = {'url': 'https://viewer.example.test/tour',
            'sourceUrl': 'https://official.example.test/project',
            'title': 'Official scene', 'embedStatus': 'allowed'}
    if not missing:
        tour['visualVerification'] = verification
    return {'slug': 'fixture', 'virtualTours': [tour]}


class P2EmbedMigration(unittest.TestCase):
    def test_null_or_missing_verification_never_accredits_a_scene(self):
        for record in [research(None), research(missing=True), research({})]:
            with self.subTest(record=record):
                before = copy.deepcopy(record)
                self.assertEqual(usable_virtual_tours(record), [])
                self.assertEqual(virtual_tours_to_render(record), [])
                self.assertEqual(record, before)

    def test_null_alternative_is_retained_only_alongside_a_usable_scene(self):
        record = research({'result': 'valid_scene'})
        alternate = research(None)['virtualTours'][0]
        alternate.update(url='https://alternative.example.test/tour', embedStatus='visual_pending')
        record['virtualTours'].append(alternate)
        before = copy.deepcopy(record)
        self.assertEqual(usable_virtual_tours(record), record['virtualTours'][:1])
        self.assertEqual(virtual_tours_to_render(record), record['virtualTours'])
        self.assertEqual(record, before)
        record['virtualTours'].pop(0)
        self.assertEqual(virtual_tours_to_render(record), [])

    def test_normalization_is_idempotent_and_preserves_bytes_outside_tour_block(self):
        record = research(None)
        prefix = '<html><head></head><body><h1>Unchanged commercial facts 17.5 m²</h1>'
        suffix = '<section id="ubicacion"><p>Unchanged exact address</p></section><footer>keep</footer></body></html>'
        page = prefix + '<section id="recorrido"><p>Prior placeholder</p></section>' + suffix
        result = normalize_page_embeds(page, record)
        self.assertIn('<h1>Unchanged commercial facts 17.5 m²</h1>', result)
        self.assertTrue(result.endswith(suffix))
        self.assertNotIn('id="recorrido"', result)
        self.assertEqual(normalize_page_embeds(result, record), result)
        self.assertIsNone(record['virtualTours'][0]['visualVerification'])

    def test_all_134_projects_dry_run_succeeds_without_writing(self):
        projects = json.loads((ROOT / 'data/proyectos.json').read_text())
        self.assertEqual(len(projects), 134)
        paths = [ROOT / (row['slug'] + '.html') for row in projects]
        paths += [ROOT / ('data/' + name) for name in ['proyectos.json', 'fichas-proyectos.json', 'registro-fichas.json']]
        before = {path: hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}
        result = subprocess.run([sys.executable, '-B', 'scripts/migrate-project-embeds.py'],
                                cwd=ROOT, capture_output=True, text=True, check=True)
        report = json.loads(result.stdout)
        self.assertEqual(report['mode'], 'dry-run')
        self.assertEqual(report['projects'], 134)
        self.assertEqual({path: hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}, before)


if __name__ == '__main__':
    unittest.main()
