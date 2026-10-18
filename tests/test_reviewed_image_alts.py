from collections import Counter
import copy
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import re
import shutil
from string import Template
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import reviewed_image_alts as ALTS


def original(blob):
    return subprocess.check_output(['git', 'cat-file', 'blob', blob], cwd=ROOT).decode()


def without_alt_values(page):
    # Independent scope check against the actual batch, whose attributes use
    # quoted values. Images are parsed separately to compare every other field.
    return re.sub(r'(<img\b[^>]*?\balt\s*=\s*").*?("[^>]*>)', r'\1REVIEWED_ALT\2', page, flags=re.S | re.I)


class ReviewedImageAltsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.register = ALTS.load_register()
        cls.images = {row['src']: row for row in cls.register['images']}
        cls.slugs = list(dict.fromkeys(row['slug'] for row in cls.register['replacements']))

    def test_all_512_occurrences_use_the_reviewed_scene_and_all_331_images_retain_their_bytes(self):
        expected = Counter({(row['slug'], row['src'], self.images[row['src']]['description']): row['occurrences']
                            for row in self.register['replacements']})
        actual = Counter()
        allowed = {(row['slug'], row['src']): row for row in self.register['replacements']}
        for slug in self.slugs:
            for image in ALTS.ImageTags((ROOT / (slug + '.html')).read_text()).images:
                attrs = dict(image['attrs'])
                if (slug, attrs.get('src')) in allowed:
                    self.assertNotEqual(attrs.get('alt'), allowed[(slug, attrs['src'])]['oldAlt'])
                    if attrs.get('alt') == self.images[attrs['src']]['description']:
                        actual[(slug, attrs['src'], attrs['alt'])] += 1
        self.assertEqual(actual, expected)
        self.assertEqual(sum(actual.values()), 512)
        for image in self.images.values():
            ALTS.verify_image(ROOT, image)
            if image['kind'] == 'render':
                self.assertIn('referencial', image['description'].lower())

    def test_the_94_html_files_change_only_the_512_approved_alt_values(self):
        scope = json.loads((ROOT / 'tests/p2-media-scope.json').read_text())['files']
        changed = 0
        for slug in self.slugs:
            path = slug + '.html'
            before = original(scope[path]['beforeBlob'])
            after = (ROOT / path).read_text()
            self.assertEqual(without_alt_values(before), without_alt_values(after), path)
            old_images, new_images = ALTS.ImageTags(before).images, ALTS.ImageTags(after).images
            self.assertEqual(len(old_images), len(new_images), path)
            for previous, current in zip(old_images, new_images):
                old, new = dict(previous['attrs']), dict(current['attrs'])
                if old.get('alt') != new.get('alt'):
                    changed += 1
                    row = next(row for row in self.register['replacements'] if row['slug'] == slug and row['src'] == old['src'])
                    self.assertEqual(old['alt'], row['oldAlt'])
                    self.assertEqual(new['alt'], self.images[row['src']]['description'])
                old.pop('alt', None)
                new.pop('alt', None)
                self.assertEqual(old, new, path)
        self.assertEqual(changed, 512)

    def test_a_second_application_is_exactly_idempotent(self):
        for slug in self.slugs:
            page = (ROOT / (slug + '.html')).read_text()
            self.assertEqual(ALTS.apply_reviewed_image_alts(page, slug, strict=True), page)

    def test_changed_image_bytes_are_rejected_before_using_the_scene_description(self):
        target = self.register['replacements'][0]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            shutil.copyfile(ROOT / ALTS.REGISTER, root / ALTS.REGISTER)
            image = root / target['src'].lstrip('/')
            image.parent.mkdir(parents=True)
            image.write_bytes(b'changed original image')
            page = '<img src="' + target['src'] + '" alt="' + target['oldAlt'] + '">'
            with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
                ALTS.apply_reviewed_image_alts(page, target['slug'], root=root)

    def test_unknown_slug_and_unreviewed_or_traversing_paths_cannot_acquire_a_description(self):
        with self.assertRaisesRegex(ValueError, 'Unknown catalogue slug'):
            ALTS.apply_reviewed_image_alts('<img src="/assets/unknown.webp" alt="Generic">', 'unknown-slug')
        target = self.register['replacements'][0]
        for src in ['/assets/unknown.webp', '/assets/propiedades/catalogo/../../private.webp', 'https://example.com/photo.webp']:
            page = '<img src="' + src + '" alt="' + target['oldAlt'] + '">'
            self.assertEqual(ALTS.apply_reviewed_image_alts(page, target['slug']), page)

    def test_quotes_markup_and_entities_are_escaped_without_touching_neighboring_attributes(self):
        register = copy.deepcopy(self.register)
        target = register['replacements'][0]
        scene = 'Vista "interior" de una sala & cocina <referencial>, con puerta \'abierta\'.'
        next(row for row in register['images'] if row['src'] == target['src'])['description'] = scene
        page = '<img title=\'alt="preservado"\' src="' + target['src'] + '" alt=\'' + target['oldAlt'] + '\' width="800">'
        with patch.object(ALTS, 'load_register', return_value=register):
            result = ALTS.apply_reviewed_image_alts(page, target['slug'])
        self.assertEqual(result, page.replace("alt='" + target['oldAlt'] + "'", "alt='" + html.escape(scene, quote=True) + "'"))
        attrs = dict(ALTS.ImageTags(result).images[0]['attrs'])
        self.assertEqual(attrs['alt'], scene)
        self.assertEqual(attrs['title'], 'alt="preservado"')

    def test_existing_descriptive_alts_are_preserved(self):
        target = self.register['replacements'][0]
        page = '<img src="' + target['src'] + '" alt="Descripción específica conservada.">'
        self.assertEqual(ALTS.apply_reviewed_image_alts(page, target['slug']), page)

    def test_changed_review_dataset_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            (root / ALTS.REGISTER).write_bytes((ROOT / ALTS.REGISTER).read_bytes() + b'\n')
            with self.assertRaisesRegex(ValueError, 'Unreviewed image-description register'):
                ALTS.load_register(root)

    def test_the_future_detail_renderer_keeps_the_reviewed_alts_without_writing_pages(self):
        spec = importlib.util.spec_from_file_location('build_details_for_alt_test', ROOT / 'scripts/build-project-details.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        project = next(row for row in json.loads((ROOT / 'data/proyectos.json').read_text()) if row['slug'] == 'vista-llacolen-b')
        research = next(row for row in json.loads((ROOT / 'data/fichas-proyectos.json').read_text()) if row['slug'] == project['slug'])
        page, _, _ = builder.render(project, research, Template((ROOT / 'templates/project-detail.html').read_text()))
        reviewed = {row['src']: row for row in self.register['replacements'] if row['slug'] == project['slug']}
        checked = 0
        for image in ALTS.ImageTags(page).images:
            attrs = dict(image['attrs'])
            if attrs.get('src') in reviewed:
                self.assertEqual(attrs['alt'], self.images[attrs['src']]['description'])
                checked += 1
        self.assertGreater(checked, 0)

    def test_media_history_restores_the_exact_ux_predecessor_and_rejects_unreviewed_mutations(self):
        program = """
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { projectP2MediaFile, P2_MEDIA_SCOPE } from './tests/p2-media-scope.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
for (const [path, record] of Object.entries(P2_MEDIA_SCOPE)) {
  const current = readFileSync(path), before = projectP2MediaFile(path, current);
  assert.equal(sha(before), record.beforeSha256);
  assert.equal(projectP2MediaFile(path, before), before);
  assert.throws(() => projectP2MediaFile(path, Buffer.concat([current, Buffer.from('CANARY')])));
}
const untouched = Buffer.from('unreviewed file');
assert.equal(projectP2MediaFile('unknown.html', untouched), untouched);
console.log(JSON.stringify({ restored: Object.keys(P2_MEDIA_SCOPE).length }));
"""
        result = subprocess.check_output(['node', '--input-type=module', '-e', program], cwd=ROOT, text=True)
        self.assertEqual(json.loads(result), {'restored': 95})


if __name__ == '__main__':
    unittest.main()
