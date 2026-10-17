"""Synthetic tests for local candidate preparation; no real project media or network."""
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from PIL import Image, __version__ as PILLOW_VERSION, features

SPEC = importlib.util.spec_from_file_location(
    'prepare_cover_variants', Path(__file__).resolve().parents[1] / 'scripts/prepare-cover-variants.py')
TOOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TOOL)


class CoverVariantTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name).resolve()
        self.root = self.base / 'repo'
        self.root.mkdir()
        self.git('init', '-q')
        self.git('config', 'user.email', 'synthetic@example.invalid')
        self.git('config', 'user.name', 'Synthetic test')
        self.name = '/assets/propiedades/catalogo/' + 'a' * 24 + '.webp'
        self.source = self.root / self.name[1:]
        self.source.parent.mkdir(parents=True)
        Image.new('RGB', (1200, 750), (40, 90, 130)).save(self.source, 'WEBP', lossless=True)
        self.original = self.source.read_bytes()
        self.git('add', '--', self.name[1:])
        self.git('commit', '-qm', 'Synthetic cover')
        self.recipe = {'schemaVersion': 1, 'expectedCount': 1,
                       'encoding': {'pillowVersion': PILLOW_VERSION,
                                    'webpVersion': features.version('webp'),
                                    'quality': 82, 'method': 6, 'widths': [480, 960]},
                       'sources': [{'slug': 'synthetic-cover', 'source': {
                           'path': self.name, 'sha256': hashlib.sha256(self.original).hexdigest(),
                           'bytes': len(self.original), 'width': 1200, 'height': 750},
                           'provenance': {'evidence': 'synthetic fixture only'},
                           'inheritedScope': {'rights': 'unverified; no publication grant'}}]}
        self.shortlist = self.base / 'shortlist.json'

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.DEVNULL)

    def run_recipe(self, output=None):
        self.shortlist.write_text(json.dumps(self.recipe))
        return TOOL.prepare(self.root, self.shortlist, output or self.base / 'candidates')

    def test_deterministic_full_frame_candidates_preserve_source_and_scope(self):
        first = self.run_recipe()
        second = self.run_recipe(self.base / 'second')
        self.assertEqual(first, second)
        self.assertFalse(first['publicationAuthorized'])
        self.assertFalse(first['runtimeIntegrated'])
        self.assertEqual(first['visualAcceptance'], 'pending')
        self.assertEqual(first['sources'][0]['inheritedScope'], self.recipe['sources'][0]['inheritedScope'])
        for variant in first['sources'][0]['variants']:
            path = self.base / 'candidates' / variant['candidatePath']
            self.assertEqual(path.read_bytes(), (self.base / 'second' / variant['candidatePath']).read_bytes())
            with Image.open(path) as image:
                self.assertEqual(image.size, (variant['width'], round(750 * variant['width'] / 1200)))
        self.assertEqual(self.source.read_bytes(), self.original)
        self.assertEqual(self.git('status', '--porcelain'), b'')

    def test_bad_hash_dimensions_and_untracked_sources_fail_before_output(self):
        for field, bad in [('sha256', '0' * 64), ('bytes', 1), ('width', 1201)]:
            with self.subTest(field=field):
                saved = self.recipe['sources'][0]['source'][field]
                self.recipe['sources'][0]['source'][field] = bad
                with self.assertRaisesRegex(ValueError, 'mismatch'):
                    self.run_recipe()
                self.assertFalse((self.base / 'candidates').exists())
                self.recipe['sources'][0]['source'][field] = saved
        Image.new('RGB', (1200, 750), (130, 90, 40)).save(self.source, 'WEBP', lossless=True)
        changed = self.source.read_bytes()
        self.recipe['sources'][0]['source'].update(
            bytes=len(changed), sha256=hashlib.sha256(changed).hexdigest())
        with self.assertRaisesRegex(ValueError, 'committed HEAD bytes'):
            self.run_recipe()
        self.source.write_bytes(self.original)
        self.recipe['sources'][0]['source'].update(
            bytes=len(self.original), sha256=hashlib.sha256(self.original).hexdigest())
        self.git('rm', '--cached', '--', self.name[1:])
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_recipe()
        self.assertEqual(self.source.read_bytes(), self.original)

    def test_source_traversal_symlinks_and_private_paths_are_rejected(self):
        for unsafe in [self.name.replace('/catalogo/', '/catalogo/../catalogo/'),
                       '/assets/propiedades/leon/private.webp', '/tmp/private.webp']:
            self.recipe['sources'][0]['source']['path'] = unsafe
            with self.assertRaisesRegex(ValueError, 'source path'):
                self.run_recipe()
        self.recipe['sources'][0]['source']['path'] = self.name
        self.source.unlink()
        external = self.base / 'external.webp'
        external.write_bytes(self.original)
        self.source.symlink_to(external)
        with self.assertRaisesRegex(ValueError, 'Symbolic'):
            self.run_recipe()
        self.assertFalse((self.base / 'candidates').exists())

    def test_output_worktrees_ancestors_symlinks_and_overwrites_are_rejected(self):
        other = self.base / 'second-worktree'
        self.git('worktree', 'add', '-q', '--detach', str(other))
        unrelated = self.base / 'unrelated-repo'
        subprocess.check_call(['git', 'init', '-q', str(unrelated)])
        alias = self.base / 'output-alias'
        alias.symlink_to(self.base, target_is_directory=True)
        existing = self.base / 'existing'
        existing.mkdir()
        for unsafe in [self.root / 'candidates', other / 'candidates', self.base,
                       unrelated / 'candidates', alias / 'candidates', existing,
                       self.base / 'safe' / '..' / 'candidates', Path('relative-output')]:
            with self.subTest(output=str(unsafe)), self.assertRaises(ValueError):
                self.run_recipe(unsafe)
        self.assertEqual(self.source.read_bytes(), self.original)

    def test_recipe_versions_count_duplicates_and_missing_scope_fail_closed(self):
        for mutate in [lambda r: r['encoding'].update(pillowVersion='unreviewed'),
                       lambda r: r.update(expectedCount=23),
                       lambda r: (r['sources'].append(r['sources'][0]), r.update(expectedCount=2)),
                       lambda r: r['sources'][0].pop('inheritedScope')]:
            original_recipe = json.loads(json.dumps(self.recipe))
            mutate(self.recipe)
            with self.assertRaises(ValueError):
                self.run_recipe()
            self.assertFalse((self.base / 'candidates').exists())
            self.recipe = original_recipe

    def test_upscaling_and_batch_partial_output_are_forbidden(self):
        Image.new('RGB', (640, 400), (90, 80, 70)).save(self.source, 'WEBP', lossless=True)
        data = self.source.read_bytes()
        self.git('add', '--', self.name[1:])
        self.git('commit', '-qm', 'Synthetic small cover')
        self.recipe['sources'][0]['source'].update(
            width=640, height=400, bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        with self.assertRaisesRegex(ValueError, 'Upscaling'):
            self.run_recipe()
        self.assertFalse((self.base / 'candidates').exists())
        self.assertEqual(self.source.read_bytes(), data)


if __name__ == '__main__':
    unittest.main()
