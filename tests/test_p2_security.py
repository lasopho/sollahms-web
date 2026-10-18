"""Source inventory and computed color checks, without claiming browser QA."""
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('privacy_embed_audit', ROOT / 'scripts/audit-privacy-embeds.py')
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


def contrast(a, b):
    def luminance(color):
        color = color.lstrip('#')
        if len(color) == 3:
            color = ''.join(c * 2 for c in color)
        channels = [int(color[n:n + 2], 16) / 255 for n in (0, 2, 4)]
        channels = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
        return sum(c * weight for c, weight in zip(channels, (.2126, .7152, .0722)))
    light, dark = sorted((luminance(a), luminance(b)), reverse=True)
    return (light + .05) / (dark + .05)


class PrivacyInventoryTests(unittest.TestCase):
    def fixture(self, source, disclosed):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        (root / 'data').mkdir()
        (root / 'data/proyectos.json').write_text('[{"slug":"example"}]')
        (root / 'example.html').write_text(source)
        (root / 'privacidad.html').write_text(disclosed)
        return root

    def test_real_134_fiches_match_all_disclosed_hosts(self):
        result = AUDIT.inventory()
        self.assertEqual(result['ficheCount'], 134)
        self.assertEqual(len(result['tourHosts']), 17)
        self.assertEqual(len(result['hosts']), 18)
        self.assertTrue(result['policyMatchesSource'], result)
        self.assertEqual(result['scope'], 'tracked-html-source-not-browser-or-deployment')
        self.assertNotIn('Las fichas de INN Puerto Chico y Edificio Suecia', (ROOT / 'privacidad.html').read_text())

    def test_direct_lazy_and_button_embeds_are_detected_but_links_are_not_loaded_embeds(self):
        parser = AUDIT.EmbedParser()
        parser.feed('<iframe src="https://first.example/1" loading="lazy"></iframe>'
                    '<button data-embed-src="https://second.example/2?a=1&amp;b=2">Open</button>'
                    '<a href="https://link.example/">External</a><img src="https://image.example/i.jpg">'
                    '<iframe src="/local.html"></iframe>')
        self.assertEqual([row['host'] for row in parser.embeds], ['first.example', 'second.example'])
        self.assertTrue(parser.embeds[1]['url'].endswith('?a=1&b=2'))

    def test_maps_and_protocol_relative_external_frames_have_distinct_inventory_kinds(self):
        parser = AUDIT.EmbedParser()
        parser.feed('<iframe src="https://www.google.com/maps?q=1"></iframe>'
                    '<iframe src="//tour.example/view" data-embed-src="//tour.example/view"></iframe>')
        self.assertEqual([row['kind'] for row in parser.embeds], ['map', 'tour'])
        self.assertEqual(len(parser.embeds), 2)

    def test_undeclared_new_provider_fails_the_policy_comparison(self):
        root = self.fixture('<iframe src="https://new.example/tour"></iframe>', '')
        result = AUDIT.inventory(root)
        self.assertFalse(result['policyMatchesSource'])
        self.assertEqual(result['missingTourHosts'], ['new.example'])

    def test_stale_duplicate_or_mislabelled_disclosure_cannot_satisfy_the_comparison(self):
        root = self.fixture('<iframe src="https://new.example/tour"></iframe>',
                            '<span data-privacy-tour-host="new.example">Old provider</span>'
                            '<span data-privacy-tour-host="new.example">new.example</span>'
                            '<span data-privacy-tour-host="old.example">old.example</span>')
        result = AUDIT.inventory(root)
        self.assertFalse(result['policyMatchesSource'])
        self.assertEqual(result['staleTourHosts'], ['old.example'])
        self.assertEqual(result['duplicateDisclosures'], ['new.example'])
        self.assertEqual(result['mislabelledDisclosures'], ['new.example'])

    def test_unsafe_or_duplicate_catalogue_slug_cannot_escape_or_bias_the_audit(self):
        root = self.fixture('', '')
        for catalogue in ([{'slug': '../privacidad'}], [{'slug': 'example'}, {'slug': 'example'}]):
            (root / 'data/proyectos.json').write_text(json.dumps(catalogue))
            with self.assertRaises(ValueError):
                AUDIT.inventory(root)


class FocusContrastTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.css = (ROOT / 'assets/css/project-detail.css').read_text()
        cls.colors = dict(re.findall(r'--([a-z-]+):(#[a-fA-F0-9]+)', cls.css))

    def test_two_ring_indicator_contrasts_with_declared_light_and_dark_surfaces(self):
        rule = re.search(r'a:focus-visible,button:focus-visible,summary:focus-visible\{([^}]+)\}', self.css)[1]
        outer = re.search(r'outline:([\d.]+)px solid (#[a-fA-F0-9]+)', rule)
        inner = re.search(r'box-shadow:0 0 0 ([\d.]+)px var\(--([a-z-]+)\)', rule)
        self.assertIsNotNone(outer)
        self.assertIsNotNone(inner)
        colors = (outer[2], self.colors[inner[2]])
        self.assertGreaterEqual(float(outer[1]), 3)
        self.assertGreaterEqual(float(inner[1]), 3)
        self.assertGreaterEqual(contrast(*colors), 3)
        for background in ('#fff', self.colors['paper'], self.colors['soft'], self.colors['green']):
            self.assertGreaterEqual(max(contrast(color, background) for color in colors), 3, background)

    def test_navigation_focus_is_inset_and_compensated_spacing_keeps_text_positions(self):
        nav = re.search(r'\.section-nav a\{([^}]+)\}', self.css)[1]
        self.assertIn('padding:20px 6px', nav)
        self.assertIn('margin:0 -6px', nav)
        focused = re.search(r'\.section-nav a:focus-visible\{([^}]+)\}', self.css)[1]
        self.assertIn('outline-offset:-6px', focused)
        self.assertIn('box-shadow:inset 0 0 0 3px var(--green)', focused)

    def test_clipped_leben_gallery_links_have_a_ring_on_the_focus_container(self):
        # The clipped image link cannot paint outside its figure; the outer
        # figure receives the two-color indicator without changing its size.
        rule = re.search(r'\.leben-gallery figure:focus-within\{([^}]+)\}', self.css)[1]
        self.assertIn('outline:3px solid #fff', rule)
        self.assertIn('box-shadow:0 0 0 3px var(--green)', rule)
        self.assertNotIn('padding', rule)
        self.assertNotIn('margin', rule)

    def test_shared_fallback_focus_covers_fiches_without_the_detail_stylesheet(self):
        css = (ROOT / 'assets/css/project-embeds.css').read_text()
        rule = re.search(r'\.project-embed-fallback a:focus-visible\{([^}]+)\}', css)[1]
        self.assertIn('outline:3px solid #fff', rule)
        self.assertIn('box-shadow:0 0 0 3px #003229', rule)
        self.assertGreaterEqual(contrast('#003229', '#fff'), 3)
        self.assertRegex(css, r'@media\(forced-colors:active\)\{\.project-embed-fallback a:focus-visible\{outline:3px solid Highlight;box-shadow:none\}\}')

    def test_brand_gold_is_preserved_and_no_longer_the_only_focus_indicator(self):
        self.assertEqual(self.colors['gold'].lower(), '#e9c176')
        self.assertLess(contrast(self.colors['gold'], '#fff'), 3)
        rule = re.search(r'a:focus-visible,button:focus-visible,summary:focus-visible\{([^}]+)\}', self.css)[1]
        self.assertNotIn('var(--gold)', rule)

    def test_forced_colors_preserves_a_system_outline(self):
        self.assertRegex(self.css, r'@media\(forced-colors:active\)\{[^}]*\{outline:3px solid Highlight;box-shadow:none\}\}')
        self.assertNotIn('forced-color-adjust:none', self.css)
        self.assertNotIn('outline:none', self.css)


if __name__ == '__main__':
    unittest.main()
