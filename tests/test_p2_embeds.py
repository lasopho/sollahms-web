"""Current P2 embed behavior; independent of frozen historical presentations."""
import copy
import hashlib
import json
import re
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from project_embed_policy import normalize_page_embeds, add_persistent_embed_alternatives, iframe_markup, map_markup
from p2_embed_scope import SCOPE, restore_p2_embed_file, restore_generated_embed_alternatives
from p2_scope import restore_p2_file, restore_p2_media_file
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


class Nodes(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.nodes = []
        self.feed(page)
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


class P2PersistentAlternatives(unittest.TestCase):
    def test_all_220_alternatives_keep_exact_iframes_destinations_and_other_bytes(self):
        projects = json.loads((ROOT / 'data/proyectos.json').read_text())
        frames = links = changed = 0
        for row in projects:
            path = row['slug'] + '.html'
            actual = (ROOT / path).read_bytes()
            # Full composition checks raw Media/UX bytes before the historical
            # comparison. Behavior assertions below still inspect raw nodes.
            before = restore_p2_file(path, actual)
            current_nodes = Nodes(actual.decode()).nodes
            prior_nodes = Nodes(before.decode()).nodes
            self.assertEqual([attrs for tag, attrs in current_nodes if tag == 'iframe'],
                             [attrs for tag, attrs in prior_nodes if tag == 'iframe'], path)
            # MED-008 modifies only alt attributes. Validate its exact reverse
            # delta separately before comparing the immutable UX embed scope.
            ux_stage = restore_p2_media_file(path, actual)
            self.assertEqual(restore_p2_embed_file(path, ux_stage), before, path)
            self.assertEqual(restore_generated_embed_alternatives(ux_stage.decode()).encode(), before, path)
            host_match = re.search(r'id="project-embed-hosts">(.*?)</script>', actual.decode())
            permitted = json.loads(host_match[1]) if host_match else []
            for i, (tag, attrs) in enumerate(current_nodes):
                if tag != 'iframe' or 'data-project-embed' not in attrs:
                    continue
                frame, paragraph, link = attrs, current_nodes[i + 1], current_nodes[i + 2]
                self.assertEqual(paragraph[0], 'p', path)
                self.assertIn('data-project-embed-alternative', paragraph[1], path)
                self.assertEqual(link[0], 'a', path)
                self.assertEqual(link[1]['href'], frame['data-embed-fallback'], path)
                self.assertEqual(link[1]['target'], '_blank', path)
                self.assertEqual(link[1]['rel'], 'noopener noreferrer', path)
                self.assertIn('(nueva pestaña)', link[1]['aria-label'], path)
                self.assertNotIn('tabindex', link[1], path)
                self.assertEqual(urlparse(link[1]['href']).scheme, 'https', path)
                self.assertIn(urlparse(link[1]['href']).hostname, permitted, path)
                frames += 1
                links += 1
            changed += before != ux_stage
        self.assertEqual((frames, links, changed), (220, 220, 132))

    def test_future_map_and_tour_markup_provides_static_access_without_javascript(self):
        for markup in [map_markup('https://www.google.com/maps?q=Published+address&output=embed', 'Published map'),
                       iframe_markup('https://viewer.example.test/scene', 'Registered scene', permitted_hosts={'viewer.example.test'})]:
            nodes = Nodes(markup).nodes
            frame = next(attrs for tag, attrs in nodes if tag == 'iframe')
            link = next(attrs for tag, attrs in nodes if tag == 'a')
            self.assertEqual(link['href'], frame['data-embed-fallback'])
            self.assertEqual(link['rel'], 'noopener noreferrer')
            self.assertEqual(frame['loading'], 'lazy')
            self.assertNotIn('<script', markup)
        with self.assertRaises(ValueError):
            iframe_markup('https://viewer.example.test/scene', 'Scene', permitted_hosts={'viewer.example.test'},
                          fallback_url='https://unapproved.test/scene')

    def test_narrow_migration_is_idempotent_over_all_134_without_writing(self):
        result = subprocess.run([sys.executable, '-B', 'scripts/migrate-embed-alternatives.py'], cwd=ROOT,
                                capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(result.stdout), {'mode': 'dry-run', 'projects': 134, 'changed': 0, 'persistentAlternatives': 220})

    def test_narrow_migration_rejects_unsafe_destinations_and_changed_existing_links(self):
        page = (ROOT / 'bcome.html').read_text()
        for mutated in [page.replace('data-embed-fallback="https://www.google.com', 'data-embed-fallback="https://unapproved.test', 1),
                        page.replace('data-embed-fallback="https://www.google.com', 'data-embed-fallback="javascript:alert(1)//', 1),
                        page.replace('aria-label="Abrir en Google Maps (', 'aria-label="Unreviewed:', 1)]:
            with self.assertRaises(ValueError):
                add_persistent_embed_alternatives(mutated)
        self.assertEqual(add_persistent_embed_alternatives(page), page)


if __name__ == '__main__':
    unittest.main()
