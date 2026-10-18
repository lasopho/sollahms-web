import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('leon_pending_register', ROOT / 'scripts/build-leon-pending-register.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class LeonPendingRegisterTests(unittest.TestCase):
    def test_derived_ledger_matches_all_36_rendered_plans_without_closing_source_discrepancies(self):
        actual = MODULE.build(ROOT)
        stored = json.loads((ROOT / 'data/leon-pendientes-vigentes.json').read_text())
        self.assertEqual(actual, stored)
        self.assertEqual(actual['summary']['statusCounts'], {'confirmado': 29, 'discrepante': 5, 'pendiente': 2})
        self.assertEqual(actual['summary']['incompleteSurfaceSets'], 6)
        gregorio = next(row for row in actual['plans'] if row['id'] == 'gregorio-de-la-fuente-a-03')
        self.assertTrue(gregorio['complete'])
        self.assertEqual(gregorio['status'], 'discrepante')

    def test_absence_and_unidentified_variant_remain_distinct_from_numeric_zero(self):
        rows = {row['id']: row for row in MODULE.build(ROOT)['plans']}
        terrace = next(area for area in rows['bcome-01']['areas'] if area['kind'] == 'terrace')
        self.assertIsNone(terrace['valueM2'])
        self.assertIs(terrace['applicable'], False)
        self.assertNotIn('terrace', rows['bcome-01']['pendingFields'])
        self.assertIn('terrace', rows['bcome-02']['pendingFields'])
        self.assertIn('identity', rows['bcome-02']['pendingFields'])
        self.assertIn('bathrooms', rows['bcome-01']['pendingFields'])

    def test_historical_project_pending_is_preserved_verbatim(self):
        register = {row['slug']: row['pendientes'] for row in json.loads((ROOT / 'data/registro-fichas.json').read_text())}
        for slug, pending in MODULE.build(ROOT)['historicalProjectPending'].items():
            self.assertEqual(pending, register[slug])

    def fixture(self, root):
        (root / 'data').mkdir()
        for name in ['leon-plan-surfaces.json', 'brochures-leon.json', 'registro-fichas.json']:
            shutil.copyfile(ROOT / 'data' / name, root / 'data' / name)
        slugs = {row['projectSlug'] for row in json.loads((root / 'data/leon-plan-surfaces.json').read_text())['plans']}
        for slug in slugs:
            shutil.copyfile(ROOT / (slug + '.html'), root / (slug + '.html'))

    def test_changed_rendered_measurement_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.fixture(root)
            path = root / 'bcome.html'
            path.write_text(path.read_text().replace('24,78 m²', '24,79 m²', 1))
            with self.assertRaisesRegex(ValueError, 'Rendered surface/path mismatch'):
                MODULE.build(root)

    def test_source_metadata_change_requires_a_new_review(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.fixture(root)
            path = root / 'data/leon-plan-surfaces.json'
            path.write_text(path.read_text().replace('24.78', '24.79', 1))
            with self.assertRaisesRegex(ValueError, 'Unreviewed source'):
                MODULE.build(root)


if __name__ == '__main__':
    unittest.main()
