"""Scope and preservation risks of the current three-page SEO overlay."""
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from corporate_seo import apply_corporate_seo

spec = importlib.util.spec_from_file_location(
    'review_release', ROOT / 'scripts/prepare-corporate-seo-review.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class CorporateReviewTests(unittest.TestCase):
    def test_metadata_has_stable_identity_without_changing_visible_content(self):
        for page in ('centro-orientacion.html', 'entorno-desarrollo-urbano.html'):
            text = (ROOT / page).read_text()
            result = apply_corporate_seo(text, page)
            self.assertEqual(text, result, page + ' must be idempotent')
            self.assertEqual(text.split('<body', 1)[1], result.split('<body', 1)[1])
            self.assertIn('https://sollahms.cl/#organization', result)
            self.assertIn('https://sollahms.cl/#website', result)
            self.assertNotIn('"alternateName"', result)

    def test_renderer_rejects_all_excluded_page_families(self):
        for page in ('proyectos.html', 'plaza-las-condes.html',
                     'fuentes-respaldo-documental.html'):
            with self.assertRaises(ValueError):
                apply_corporate_seo('', page)

    def test_release_rejects_changed_exclusions_functions_and_routes(self):
        before = {path: 'original' for path in release.ALLOWED}
        for path in ('static/proyectos.html', 'static/fuentes-respaldo-documental.html',
                     'static/alameda-4719.html', 'functions/api/contact.func/index.mjs',
                     'config.json', 'static/assets/js/catalog.mjs', 'static/robots.txt'):
            before[path] = 'original'
        candidate = dict(before, **{path: 'reviewed' for path in release.ALLOWED})
        self.assertEqual(release.compare(before, candidate), sorted(release.ALLOWED))
        for path in set(before) - release.ALLOWED:
            changed = dict(candidate, **{path: 'unexpected'})
            with self.assertRaises(ValueError, msg=path):
                release.compare(before, changed)

    def test_release_rejects_missing_and_added_artifacts(self):
        before = {path: 'original' for path in release.ALLOWED}
        candidate = {path: 'reviewed' for path in release.ALLOWED}
        candidate['static/private-document.pdf'] = 'unexpected'
        with self.assertRaises(ValueError):
            release.compare(before, candidate)
        candidate.pop('static/private-document.pdf')
        candidate.pop(next(iter(release.ALLOWED)))
        with self.assertRaises(ValueError):
            release.compare(before, candidate)

    def test_sitemap_preserves_existing_entries_and_dates_byte_for_byte(self):
        before = b'<urlset><url><loc>https://sollahms.cl/proyectos.html</loc><lastmod>2026-10-29</lastmod></url>\n</urlset>'
        after = before.replace(b'</urlset>', release.SITEMAP_ADDITION + b'</urlset>')
        release.validate_sitemap(before, after)
        with self.assertRaises(ValueError):
            release.validate_sitemap(before, after.replace(b'2026-10-29', b'2026-11-19'))
        with self.assertRaises(ValueError):
            release.validate_sitemap(before, after.replace(b'proyectos.html', b'catalogo.html'))


if __name__ == '__main__':
    unittest.main()
