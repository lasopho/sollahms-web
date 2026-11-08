"""Pruebas de alcance con datos sintéticos; no son resultados de Sollahms."""
import copy
import csv
import importlib.util
import json
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

spec = importlib.util.spec_from_file_location('seo_scope', Path(__file__).resolve().parents[1] / 'scripts/seo_scope.py')
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.included = 'https://sollahms.cl/guia-hipotecaria.html'
        self.project = 'https://sollahms.cl/proyecto-sintetico.html'
        self.scope = dict(scope_id='corporate-education-v2', scope_version=2,
                          ai_prompt_ids=['C01'],
                          included_urls=['https://sollahms.cl/', self.included],
                          excluded_project_urls=[self.project],
                          technical_noncontent_urls=['https://sollahms.cl/404.html'])
        self.scope_path = self.write_json('scope.json', self.scope)
        self.manifest = dict(source='google_search_console', property='sc-domain:sollahms.cl',
                             report='search_performance', dimension='date', filters={}, country='all',
                             search_type='web', timezone='America/Los_Angeles', period_start='2026-05-01',
                             period_end='2026-11-07', extracted_at='2026-11-08T12:00:00Z',
                             coverage_complete=True, locale='en', origin='synthetic_test')

    def write_json(self, name, data):
        path = self.root / name
        path.write_text(json.dumps(data))
        return path

    def record(self, dimension='date', rows=None, **manifest):
        m = copy.deepcopy(self.manifest)
        m.update(dimension=dimension, **manifest)
        return dict(schema_version=1, kind='performance_export', manifest=m,
                    csv_sha256='a' * 64, manifest_sha256='b' * 64,
                    rows=rows if rows is not None else [dict(dimension_value='2026-11-07', clicks=1, impressions=10, ctr=.1, position=2)])

    def proof(self, **changes):
        evidence = self.root / 'native-report.txt'
        evidence.write_text('SYNTHETIC native-filter evidence; not an authentic report')
        proof = dict(source=self.manifest['source'], property=self.manifest['property'],
                     method='native_exact_allowlist', included_urls=self.scope['included_urls'],
                     reviewed_by_operator=True, evidence_file=evidence.name,
                     evidence_sha256=s.legacy.digest(evidence.read_bytes()))
        proof.update(changes)
        return self.write_json('proof.json', proof)

    def test_page_segment_excludes_without_reporting_project_metrics(self):
        unknown = 'https://sollahms.cl/nueva-pagina.html'
        urls = [self.included, self.project, 'https://sollahms.cl/404.html', unknown]
        rows = [dict(dimension_value=url, clicks=10 + i, impressions=100 + i, ctr=.1, position=i + 1) for i, url in enumerate(urls)]
        source = self.write_json('pages.json', self.record('page', rows))
        before = source.read_bytes()
        result = s.segment(source, self.scope_path)
        self.assertEqual([r['dimension_value'] for r in result['rows']], [self.included])
        self.assertEqual(result['selection']['row_counts'], dict(included=1, excluded_project=1, technical_noncontent=1, unknown=1))
        self.assertEqual(result['selection']['unknown_urls'], [unknown])
        self.assertNotIn(self.project, json.dumps(result))
        self.assertFalse(result['selection']['native_scoped_total'])
        self.assertFalse(result['selection']['daily_comparison_eligible'])
        self.assertNotIn('totals', result)
        self.assertEqual(result['csv_sha256'], 'a' * 64)
        self.assertEqual(result['normalized_input_sha256'], s.legacy.digest(before))
        self.assertEqual(source.read_bytes(), before)

    def test_unknown_fails_closed_strict_host_query_and_fragments(self):
        scope, _ = s.load_scope(self.scope_path)
        self.assertEqual(s.classify(self.included + '#fuentes', scope), 'included')
        for url in (self.included + '?utm_source=test', self.included.replace('https:', 'http:'),
                    self.included.replace('sollahms.cl', 'www.sollahms.cl'),
                    self.included.replace('sollahms.cl', 'evil.example'), 'https://sollahms.cl/desconocido.html'):
            with self.subTest(url=url):
                self.assertEqual(s.classify(url, scope), 'unknown')

    def test_empty_selection_is_unknown_and_indexation_is_separate(self):
        record = self.record(rows=[dict(url=self.project, status='indexed', evidence_reference='synthetic.csv#2')])
        record['kind'] = 'indexation_export'
        record['manifest']['report'] = 'indexation'
        path = self.write_json('indexation.json', record)
        result = s.segment(path, self.scope_path)
        self.assertEqual(result['rows'], [])
        self.assertEqual(result['selection']['metrics_status'], 'unknown')
        self.assertNotIn('indexed', result['selection'])
        with self.assertRaises(ValueError):
            s.segment(self.write_json('daily.json', self.record()), self.scope_path)

    def test_scope_registry_rejects_overlap_duplicates_and_noncanonical(self):
        for change in ({'excluded_project_urls': [self.included]},
                       {'included_urls': [self.included, self.included]},
                       {'included_urls': [self.included + '#x']}):
            candidate = dict(self.scope, **change)
            with self.subTest(change=change), self.assertRaises(ValueError):
                s.load_scope(self.write_json('bad-scope.json', candidate))

    def test_binding_requires_exact_reviewed_proof_and_hash(self):
        source = self.write_json('daily.json', self.record())
        before = source.read_bytes()
        for changes in ({'source': 'bing_webmaster_tools'}, {'property': 'https://elsewhere.invalid/'},
                        {'included_urls': [self.included]}, {'included_urls': self.scope['included_urls'] + [self.project]},
                        {'included_urls': self.scope['included_urls'] * 2}, {'reviewed_by_operator': False},
                        {'method': 'subtract_project_series'}, {'evidence_sha256': '0' * 64},
                        {'evidence_file': 'missing.txt'}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                s.bind_daily(source, self.scope_path, self.proof(**changes))
        result = s.bind_daily(source, self.scope_path, self.proof())
        self.assertEqual(result['measurement_scope']['scope_id'], self.scope['scope_id'])
        self.assertEqual(result['manifest']['filters'][s.SCOPE_FILTER_HASH], s.legacy.digest(self.scope_path.read_bytes()))
        self.assertEqual(result['scope_binding']['normalized_input_sha256'], s.legacy.digest(before))
        self.assertEqual(source.read_bytes(), before)

    def test_global_daily_and_scope_mismatch_cannot_compare(self):
        source = self.write_json('daily.json', self.record())
        with self.assertRaises(ValueError):
            s.compare([source], '2026-11-07', self.scope_path)
        bound = s.bind_daily(source, self.scope_path, self.proof())
        for field in ('scope_id', 'scope_sha256'):
            bad = copy.deepcopy(bound)
            bad['measurement_scope'][field] = 'wrong'
            with self.subTest(field=field), self.assertRaises(ValueError):
                s.compare([self.write_json('wrong.json', bad)], '2026-11-07', self.scope_path)
        bad = copy.deepcopy(bound)
        bad['manifest']['filters'].pop(s.SCOPE_FILTER_ID)
        with self.assertRaises(ValueError):
            s.compare([self.write_json('bad-filters.json', bad)], '2026-11-07', self.scope_path)
        self.scope_path.write_text(json.dumps(self.scope, indent=2))
        with self.assertRaises(ValueError):
            s.compare([self.write_json('old-registry.json', bound)], '2026-11-07', self.scope_path)

    def test_bound_windows_keep_original_coverage_and_real_zero_rules(self):
        rows = []
        for i in range(180):
            day = date(2026, 11, 7) - timedelta(days=179 - i)
            clicks, impressions = (0, 0) if i < 90 else (1, 10)
            rows.append(dict(dimension_value=day.isoformat(), clicks=clicks, impressions=impressions,
                             ctr=.1 if impressions else None, position=2 if impressions else None))
        source = self.write_json('daily.json', self.record(rows=rows))
        bound = s.bind_daily(source, self.scope_path, self.proof())
        path = self.write_json('bound.json', bound)
        result = s.compare([path], '2026-11-07', self.scope_path)
        self.assertEqual(result['windows']['90']['current']['clicks'], 90)
        self.assertEqual(result['windows']['90']['previous']['clicks'], 0)
        self.assertIsNone(result['windows']['90']['delta']['clicks']['relative'])
        bound['rows'] = bound['rows'][-1:]
        result = s.compare([self.write_json('partial.json', bound)], '2026-11-07', self.scope_path)
        self.assertEqual(result['windows']['30']['status'], 'insufficient_coverage')
        self.assertIsNone(result['windows']['90']['current'])

    def ai_csv(self, rows):
        fields = ['run_id', 'platform', 'prompt_id', 'prompt_version', 'country', 'account_context', 'mode',
                  'status', 'observed_at', 'model', 'evidence_file', 'evidence_sha256', 'mention', 'link',
                  'citation', 'recommendation', 'linked_urls', 'cited_urls', 'measurement_scope_id',
                  'mention_context', 'recommendation_context', 'competitors', 'source_urls']
        path = self.root / 'observations.csv'
        with path.open('w', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def observation(self, run='r1', **changes):
        evidence = self.root / 'answer.txt'
        evidence.write_text('SYNTHETIC response; not a real platform test')
        result = dict(run_id=run, platform='chatgpt_search', prompt_id='C01', prompt_version='2', country='CL',
                      account_context='signed_out', mode='search', status='executed', observed_at='2026-11-08T12:00:00Z',
                      model='synthetic_test', evidence_file=evidence.name, evidence_sha256=s.legacy.digest(evidence.read_bytes()),
                      mention='1', link='1', citation='1', recommendation='1', linked_urls=self.included,
                      cited_urls=self.included, measurement_scope_id=self.scope['scope_id'],
                      mention_context='corporate', recommendation_context='corporate', competitors='raw competitor',
                      source_urls='https://unrelated.invalid/raw-source')
        result.update(changes)
        return result

    def test_ai_corporate_only_flags_links_and_originals_unchanged(self):
        first = self.observation(mention_context='project_only', recommendation_context='project_only',
                                 linked_urls=self.project, cited_urls='https://sollahms.cl/desconocido.html')
        second = self.observation('r2', linked_urls=self.project + ' | ' + self.included,
                                  cited_urls=self.included + '#fuentes')
        path = self.ai_csv([first, second])
        before, evidence = path.read_bytes(), (self.root / 'answer.txt').read_bytes()
        result = s.ai_summary(path, self.scope_path)
        group = result['groups'][0]
        self.assertEqual([group[k] for k in ('mention', 'link', 'citation', 'recommendation')], [1, 1, 1, 1])
        self.assertEqual(group['rates']['mention'], .5)
        self.assertNotIn('raw competitor', json.dumps(result))
        self.assertNotIn(self.project, json.dumps(result))
        self.assertEqual(result['original_csv_sha256'], s.legacy.digest(before))
        self.assertEqual(path.read_bytes(), before)
        self.assertEqual((self.root / 'answer.txt').read_bytes(), evidence)

    def test_ai_unclear_context_is_unknown_not_a_measured_zero(self):
        path = self.ai_csv([self.observation(mention_context='unclear', recommendation_context='unclear')])
        group = s.ai_summary(path, self.scope_path)['groups'][0]
        self.assertEqual(group['unknown_context_runs'], dict(mention=1, recommendation=1))
        self.assertEqual(group['classified_runs']['mention'], 0)
        self.assertIsNone(group['rates']['mention'])
        self.assertIsNone(group['rates']['recommendation'])

    def test_ai_unknown_references_are_unknown_until_classified(self):
        unknown = 'https://sollahms.cl/futura-pagina.html'
        path = self.ai_csv([self.observation(linked_urls=unknown, cited_urls=self.project + ' | ' + unknown)])
        group = s.ai_summary(path, self.scope_path)['groups'][0]
        self.assertEqual(group['unknown_reference_runs'], dict(link=1, citation=1))
        self.assertEqual(group['classified_runs']['link'], 0)
        self.assertIsNone(group['rates']['link'])
        self.assertIsNone(group['rates']['citation'])
        path = self.ai_csv([self.observation(linked_urls=self.project, cited_urls=self.project)])
        group = s.ai_summary(path, self.scope_path)['groups'][0]
        self.assertEqual(group['rates']['link'], 0)
        self.assertEqual(group['rates']['citation'], 0)

    def test_ai_blocked_and_empty_are_unmeasured_not_zero(self):
        row = self.observation(status='blocked', observed_at='', model='', evidence_file='', evidence_sha256='',
                               mention='', link='', citation='', recommendation='', linked_urls='', cited_urls='',
                               mention_context='', recommendation_context='')
        group = s.ai_summary(self.ai_csv([row]), self.scope_path)['groups'][0]
        self.assertEqual(group['measured_runs'], 0)
        self.assertEqual(group['unmeasured_runs'], 1)
        self.assertTrue(all(value is None for value in group['rates'].values()))
        self.assertEqual(s.ai_summary(self.ai_csv([]), self.scope_path)['groups'], [])

    def test_ai_rejects_historical_wrong_scope_context_and_tampered_evidence(self):
        for changes in ({'prompt_version': '1'}, {'measurement_scope_id': 'other'},
                        {'prompt_id': 'C99'},
                        {'mention_context': ''}, {'recommendation_context': 'unsupported'},
                        {'evidence_sha256': '0' * 64}, {'link': '1', 'linked_urls': ''}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                s.ai_summary(self.ai_csv([self.observation(**changes)]), self.scope_path)
        for prompts in (None, [], [''], ['C01', 'C01']):
            scope = dict(self.scope)
            if prompts is None:
                scope.pop('ai_prompt_ids')
            else:
                scope['ai_prompt_ids'] = prompts
            path = self.write_json('invalid-prompts-scope.json', scope)
            with self.subTest(prompts=prompts), self.assertRaises(ValueError):
                s.ai_summary(self.ai_csv([self.observation()]), path)


if __name__ == '__main__':
    unittest.main()
