import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('current_register', ROOT / 'scripts/build-current-register.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class Overlay(MODULE.Source):
    def __init__(self, changes):
        super().__init__(ROOT)
        self.changes = changes

    def read(self, path):
        return self.changes[path] if path in self.changes else super().read(path)


class CurrentRegisterTests(unittest.TestCase):
    def test_current_identity_sets_and_documentary_counts_match_committed_register(self):
        stored = json.loads((ROOT / 'data/registro-vigente.json').read_text())
        actual = MODULE.build(MODULE.Source(ROOT), stored['sourceCommit'], stored['checkedOn'])
        self.assertEqual(stored, actual)
        self.assertEqual(actual['summary']['projects'], 134)
        self.assertEqual(len(actual['summary']['developers']), 13)
        self.assertTrue(all(not row['missing'] and not row['extra'] for row in actual['slugComparisons'].values()))

    def test_duplicate_catalogue_slug_is_rejected(self):
        rows = json.loads((ROOT / 'data/proyectos.json').read_text())
        rows.append(rows[0])
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            MODULE.build(Overlay({'data/proyectos.json': json.dumps(rows).encode()}), 'fixture', '2026-10-17')

    def test_missing_form_project_is_rejected(self):
        text = (ROOT / 'lib/project-context.mjs').read_text()
        text = text.replace('"distrito-centro":', '"unknown-project":', 1)
        with self.assertRaisesRegex(ValueError, 'formContext'):
            MODULE.build(Overlay({'lib/project-context.mjs': text.encode()}), 'fixture', '2026-10-17')

    def test_duplicate_form_key_is_rejected_before_json_collapses_it(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate key'):
            MODULE.unique_object([('slug', 1), ('slug', 2)])

    def test_unknown_sitemap_project_is_rejected(self):
        text = (ROOT / 'sitemap.xml').read_text().replace('</urlset>', '<url><loc>https://sollahms.cl/extra.html</loc></url></urlset>')
        with self.assertRaisesRegex(ValueError, 'sitemap'):
            MODULE.build(Overlay({'sitemap.xml': text.encode()}), 'fixture', '2026-10-17')

    def test_foreign_sitemap_origin_is_rejected(self):
        text = (ROOT / 'sitemap.xml').read_text().replace('https://sollahms.cl/distrito-centro.html', 'https://example.com/distrito-centro.html')
        with self.assertRaisesRegex(ValueError, 'origin'):
            MODULE.build(Overlay({'sitemap.xml': text.encode()}), 'fixture', '2026-10-17')


if __name__ == '__main__':
    unittest.main()
