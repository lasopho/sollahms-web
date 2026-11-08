"""Fixtures sintéticas; nunca se incorporan a las métricas reales."""
import importlib.util
import json
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

spec = importlib.util.spec_from_file_location('measurement', Path(__file__).resolve().parents[1]/'scripts/seo_measurement.py')
m = importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class MeasurementTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root = Path(self.tmp.name)
        self.manifest = dict(source='google_search_console', property='sc-domain:sollahms.cl', report='search_performance',
            dimension='date', filters={}, country='all', search_type='web', timezone='America/Los_Angeles',
            period_start='2026-05-01', period_end='2026-11-07', extracted_at='2026-11-08T12:00:00Z',
            coverage_complete=True, locale='en', origin='synthetic_test')
    def parse(self, text, **changes):
        self.manifest.update(changes);p=self.root/'source.csv';p.write_text(text)
        q=self.root/'manifest.json';q.write_text(json.dumps(self.manifest));return m.import_performance(p,q)
    def test_gsc_spanish_locale_and_weighted_ctr(self):
        r=self.parse('Fecha;Clics;Impresiones;CTR;Posición\n2026-11-01;10;1.000;1%;5,0\n2026-11-02;9;10;90%;2,0\n',locale='es')
        a=m.aggregate(r['rows']);self.assertAlmostEqual(a['ctr'],19/1010);self.assertAlmostEqual(a['position'],5020/1010)
    def test_bing_headers_and_bom(self):
        r=self.parse('\ufeffDate,Clicks,Impressions,CTR,Avg. Click Position\n2026-11-01,5,100,5%,4.5\n',source='bing_webmaster_tools')
        self.assertEqual(r['rows'][0]['position'],4.5)
    def test_zero_impressions_has_null_ctr_position(self):
        r=self.parse('Date,Clicks,Impressions,Position\n2026-11-01,0,0,0\n');self.assertIsNone(r['rows'][0]['ctr']);self.assertIsNone(r['rows'][0]['position'])
    def test_missing_days_not_filled_with_zero(self):
        r=self.parse('Date,Clicks,Impressions\n2026-11-01,1,2\n');p=self.root/'n.json';p.write_text(json.dumps(r))
        x=m.compare([p],'2026-11-07');self.assertEqual(x['windows']['30']['status'],'insufficient_coverage');self.assertIsNone(x['windows']['90']['current'])
    def test_30_and_90_windows_and_zero_denominator(self):
        rows=[];last=date(2026,11,7)
        for i in range(180):
            d=last-timedelta(days=179-i);rows.append(f'{d},'+('0,0' if i<90 else '10,100'))
        r=self.parse('Date,Clicks,Impressions\n'+'\n'.join(rows)+'\n');p=self.root/'n.json';p.write_text(json.dumps(r));x=m.compare([p],last.isoformat())
        self.assertEqual(x['windows']['90']['current']['clicks'],900);self.assertIsNone(x['windows']['90']['delta']['clicks']['relative'])
        self.assertEqual(x['windows']['30']['current']['clicks'],300)
    def test_no_merge_sources_scopes_or_overlapping_days(self):
        r=self.parse('Date,Clicks,Impressions\n2026-11-01,1,2\n');a=self.root/'a.json';a.write_text(json.dumps(r))
        with self.assertRaises(ValueError):m.compare([a,a],'2026-11-07')
        r['manifest']['filters']={'country':'CHL'};b=self.root/'b.json';b.write_text(json.dumps(r))
        with self.assertRaises(ValueError):m.compare([a,b],'2026-11-07')
    def test_query_rows_not_used_as_property_totals(self):
        r=self.parse('Top queries,Clicks,Impressions\ndepartamentos Chile,1,20\n',dimension='query');p=self.root/'n.json';p.write_text(json.dumps(r))
        self.assertTrue(r['warnings'])
        with self.assertRaises(ValueError):m.compare([p],'2026-11-07')
    def test_reject_duplicates_bad_counts_nan_and_outside_dates(self):
        cases=['2026-11-01,1,2\n2026-11-01,1,2','2026-11-01,3,2','2026-11-01,NaN,2','2026-11-09,1,2','2026-11-01,,2']
        for text in cases:
            with self.subTest(text=text),self.assertRaises(ValueError):self.parse('Date,Clicks,Impressions\n'+text+'\n')
    def test_reject_personal_query_parameters_on_pages(self):
        with self.assertRaises(ValueError):self.parse('Page,Clicks,Impressions\nhttps://sollahms.cl/contacto.html?email=test@example.invalid,1,2\n',dimension='page')
    def test_history_not_overwritten_and_idempotent(self):
        p=self.root/'result.json';m.save({'a':1},p);m.save({'a':1},p)
        with self.assertRaises(ValueError):m.save({'a':2},p)
    def ai_csv(self, rows):
        p=self.root/'ai.csv';header='run_id,platform,prompt_id,prompt_version,country,account_context,mode,status,observed_at,model,evidence_file,evidence_sha256,mention,link,citation,recommendation,linked_urls,cited_urls\n'
        p.write_text(header+'\n'.join(rows)+'\n');return p
    def test_blocked_ai_is_not_zero_visibility(self):
        p=self.ai_csv(['r1,gemini,Q1,1,CL,signed_out,web,blocked,,,,,,,,,,'])
        x=m.ai_summary(p)['groups'][0];self.assertEqual(x['measured_runs'],0);self.assertIsNone(x['rates']['mention'])
    def test_ai_requires_evidence_and_three_dates(self):
        e=self.root/'answer.txt';e.write_text('SYNTHETIC TEST');h=m.digest(e.read_bytes())
        rows=[f'r{i},gemini,Q1,1,CL,signed_out,web,executed,2026-11-0{i}T12:00:00Z,test,answer.txt,{h},1,0,0,0,,' for i in range(1,4)]
        p=self.ai_csv(rows);self.assertTrue(m.ai_summary(p)['groups'][0]['repeat_sample_complete'])
        e.write_text('CHANGED')
        with self.assertRaises(ValueError):m.ai_summary(p)
    def test_indexation_is_separate_and_requires_evidence(self):
        p=self.root/'coverage.csv';p.write_text('url,status,reason,last_crawl,selected_canonical,evidence_reference\nhttps://sollahms.cl/,unknown,,,,\n')
        q=self.root/'i.json';q.write_text(json.dumps(dict(source='google_search_console',property='sc-domain:sollahms.cl',extracted_at='2026-11-08T12:00:00Z',origin='synthetic_test',report='indexation',scope='sample',coverage_complete=False)))
        with self.assertRaises(ValueError):m.import_indexation(p,q)
        p.write_text('url,status,reason,last_crawl,selected_canonical,evidence_reference\nhttps://sollahms.cl/,indexed,,2026-11-07,https://sollahms.cl/,fixture.csv#row2\n')
        self.assertEqual(m.import_indexation(p,q)['rows'][0]['status'],'indexed')

if __name__ == '__main__':unittest.main()
