"""Catalogue-wide narrow cleanup and regeneration regressions."""
import copy
from leon_main_scope import read_pre_leon
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from sento_scope import original_data, historical_file, original_html
from string import Template

from automatic_embed_scope import restore_automatic_file
from map_cleanup_scope import (ROOT, FEATURED, RELATED, GENERIC_NOTES, NOSCRIPT,
                               baseline_bytes, expected_cleanup_file,
                               transform_map_cleanup, restore_map_cleanup_asset)

sys.path.insert(0, str(ROOT / 'scripts'))
from project_embed_policy import normalize_page_embeds, remove_redundant_map_details
from fiche_presentation import commercialize_fiche

spec = importlib.util.spec_from_file_location('map_cleanup_details', ROOT / 'scripts/build-project-details.py')
details = importlib.util.module_from_spec(spec)
spec.loader.exec_module(details)
PROJECTS = original_data(json.loads(read_pre_leon('data/proyectos.json').decode()))
RECORDS = {row['slug']: row for row in original_data(json.loads(read_pre_leon('data/fichas-proyectos.json').decode()), 'data/fichas-proyectos.json')}


class Nodes(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.nodes = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


class MapCleanup(unittest.TestCase):
    def assert_clean(self, page, slug):
        self.assertNotIn('Abrir en Google Maps ↗', page, slug)
        self.assertNotIn('Abrir dirección relacionada en Google Maps ↗', page, slug)
        for note in GENERIC_NOTES:
            self.assertNotIn(note, page, slug)
        self.assertNotIn(NOSCRIPT, page, slug)
        for tag, attrs in Nodes(page).nodes:
            if tag == 'a':
                self.assertNotRegex(attrs.get('href', ''), r'https://www\.google\.com/maps', slug)
        self.assertNotRegex(page, r'</iframe></div><p\b[^>]*>\s*</p>', slug)

    def test_all_144_fichas_match_exact_main_cleanup_with_137_changes(self):
        changed = 0
        for project in PROJECTS:
            path = project['slug'] + '.html'
            current = historical_file(path, read_pre_leon(path))
            self.assertEqual(current, expected_cleanup_file(path), path)
            restore_automatic_file(path, current)
            changed += current != baseline_bytes(path)
        self.assertEqual((len(PROJECTS), changed, len(PROJECTS) - changed), (144, 137, 7))

    def test_137_maps_97_tours_and_all_images_actions_remain_exact(self):
        maps = tours = plans = 0
        for project in PROJECTS:
            path = project['slug'] + '.html'
            before = Nodes(baseline_bytes(path).decode()).nodes
            after = Nodes(original_html(read_pre_leon(path).decode())).nodes
            for tag in ['iframe', 'img', 'script', 'form', 'input', 'button']:
                self.assertEqual([a for t, a in after if t == tag], [a for t, a in before if t == tag], path + ':' + tag)
            actions = lambda nodes: [a for t, a in nodes if t == 'a' and not a.get('href', '').startswith('https://www.google.com/maps')]
            self.assertEqual(actions(after), actions(before), path + ': navigation, plans, finance, contact or booking changed')
            frames = [a for t, a in after if t == 'iframe']
            maps += sum(a.get('data-project-embed') == 'map' for a in frames)
            tours += sum(a.get('data-project-embed') == 'tour' for a in frames)
            for frame in frames:
                self.assertEqual(frame.get('loading'), 'lazy', path)
            # Each brochure model still has its own original displayed plan.
            plans += original_html(read_pre_leon(path).decode()).count('class="aj-model"')
        self.assertEqual((maps, tours, plans), (137, 97, 142))

    def test_no_persistent_map_links_generic_notes_or_empty_remnants(self):
        related = 0
        for project in PROJECTS:
            slug = project['slug']
            text = original_html(read_pre_leon(slug+'.html').decode())
            self.assert_clean(text, slug)
            if slug in RELATED:
                note = re.search(r'<p class="map-note">.*?</p>', baseline_bytes(slug + '.html').decode())[0]
                self.assertEqual(text.count(note), 1, slug + ': specific address/identity caution must survive')
                related += 1
        self.assertEqual(related, 4)

    def test_future_standard_render_and_existing_normalizer_cannot_restore_controls(self):
        template = Template(read_pre_leon('templates/project-detail.html').decode())
        for project in PROJECTS:
            slug = project['slug']
            page, _, _ = details.render(project, copy.deepcopy(RECORDS[slug]), template)
            self.assert_clean(page, slug)
            before = baseline_bytes(slug + '.html').decode()
            current = original_html(read_pre_leon(slug+'.html').decode())
            self.assertEqual(normalize_page_embeds(before, RECORDS[slug], featured=slug in FEATURED), current, slug)
            self.assertEqual(normalize_page_embeds(current, RECORDS[slug], featured=slug in FEATURED), current, slug + ': repeated regeneration')

    def test_future_featured_generator_is_checked_in_an_isolated_fixture(self):
        with tempfile.TemporaryDirectory(prefix='sollahms-featured-map-cleanup-') as directory:
            fixture = Path(directory)
            for name in ['scripts', 'data', 'templates']:
                shutil.copytree(ROOT / name, fixture / name)
            for path in ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json']:
                (fixture / path).write_bytes(historical_file(path, read_pre_leon(path)))
            for slug in FEATURED:
                (fixture / (slug + '.html')).write_bytes(baseline_bytes(slug + '.html'))
            result = subprocess.run([sys.executable, str(fixture / 'scripts/update-featured-verification.py')],
                                    cwd=fixture, text=True, capture_output=True, check=True)
            self.assertIn('Updated sourced featured facts', result.stdout)
            for slug in FEATURED:
                page = (fixture / (slug + '.html')).read_text()
                self.assert_clean(page, slug)
                self.assertEqual(page.count('data-project-embed="map"'), 1, slug)

    def test_literal_legacy_cleanup_preserves_other_content_and_specific_cautions(self):
        page = baseline_bytes('bcome.html').decode()
        expected = expected_cleanup_file('bcome.html').decode()
        for note in GENERIC_NOTES:
            legacy = page.replace(GENERIC_NOTES[0], note)
            self.assertEqual(remove_redundant_map_details(legacy), expected)
            self.assertEqual(transform_map_cleanup(legacy, 'bcome'), expected)
        unrelated = '<p class="lead">Private road: request the exact entrance.</p><p class="map-note">Site-specific access restriction.</p>'
        self.assertEqual(remove_redundant_map_details(unrelated), unrelated)
        self.assert_clean(commercialize_fiche(page, 'bcome', research=RECORDS['bcome']), 'bcome')
        for path in ['assets/css/project-embeds.css', 'vercel.json', 'scripts/package-vercel.mjs']:
            self.assertEqual(restore_map_cleanup_asset(path, historical_file(path, read_pre_leon(path))), baseline_bytes(path))
        self.assertEqual(read_pre_leon('assets/js/project-embeds.js'), baseline_bytes('assets/js/project-embeds.js'), 'Native controls/error-only runtime must remain exact')

    def test_exact_cleanup_scope_rejects_unrelated_markup_assets_and_missing_removals(self):
        path = 'bcome.html'
        page = expected_cleanup_file(path)
        for mutation in [page + b'\n', baseline_bytes(path), page.replace(b'Paicav', b'Other location', 1),
                         page.replace(b'loading="lazy"', b'loading="eager"', 1),
                         page.replace(b'data-embed-fallback="https://www.google.com', b'data-embed-fallback="https://unapproved.test', 1)]:
            with self.assertRaises(AssertionError):
                restore_automatic_file(path, mutation)
        for path in ['assets/css/project-embeds.css', 'vercel.json', 'scripts/package-vercel.mjs']:
            current = historical_file(path, read_pre_leon(path))
            for mutation in [current + b'\n', baseline_bytes(path)]:
                with self.assertRaises(AssertionError):
                    restore_map_cleanup_asset(path, mutation)


if __name__ == '__main__':
    unittest.main()
