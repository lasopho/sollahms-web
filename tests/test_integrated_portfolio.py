import copy
import json
import unittest
from integrated_scope import DATA, expected_data, validate_data, ecasa_slugs

class IntegratedPortfolioTests(unittest.TestCase):
    def test_all_three_datasets_keep_exact_15_ecasa_and_118_concurrent_main_records(self):
        for path in sorted(DATA):
            rows = validate_data(path)
            self.assertEqual(len(rows), 133)
            self.assertEqual(sum(row['slug'] in ecasa_slugs() for row in rows), 15)

    def test_ecasa_commercial_mutation_is_rejected(self):
        rows = expected_data('data/proyectos.json')
        next(row for row in rows if row['slug'] in ecasa_slugs())['precioDesdeUF'] = 999999
        with self.assertRaises(AssertionError): validate_data('data/proyectos.json', json.dumps(rows))

    def test_other_developer_commercial_mutation_is_rejected(self):
        rows = expected_data('data/proyectos.json')
        next(row for row in rows if row['slug'] not in ecasa_slugs())['precioDesdeUF'] = 999999
        with self.assertRaises(AssertionError): validate_data('data/proyectos.json', json.dumps(rows))

    def test_missing_duplicate_and_reordered_identities_are_rejected(self):
        original = expected_data('data/proyectos.json')
        for rows in [original[:-1], original[:-1] + [copy.deepcopy(original[0])], list(reversed(original))]:
            with self.subTest(), self.assertRaises(AssertionError): validate_data('data/proyectos.json', json.dumps(rows))
