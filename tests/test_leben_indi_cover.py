"""Private Indi hero regeneration keeps the original public fiche byte exact."""
import copy
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('indi_cover_generator', ROOT / 'scripts/leben_brochure.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)
PUBLIC_PAGE = '<html><head><title>Indi</title></head><body><section class="project-hero "><img class="hero-image" src="/assets/propiedades/catalogo/old.webp" alt="Original official image" fetchpriority="high" decoding="async"><div class="hero-shade"></div><div class="hero-content"><h1>Edificio Indi</h1><p>Entrega inmediata</p></div></section><section id="galeria"><figure><img src="/assets/propiedades/catalogo/old.webp" alt="Original gallery"></figure></section><section id="ubicacion"><iframe src="https://maps.example/indi"></iframe></section><a href="/contacto.html?proyecto=edificio-indi">Consultar</a><strong>UF 2.560</strong></body></html>'


def record_fixture():
    image = {'localPath': '/assets/propiedades/leben-preview/edificio-indi/imagen-01-p02.webp',
             'sourcePage': 2, 'width': 1800, 'height': 1137, 'nativeWidth': 2113, 'nativeHeight': 1335,
             'qualityDecision': 'keep', 'visuallyVerified': True, 'privacySafe': True,
             'caption': 'Fachada y acceso · Imagen referencial'}
    return {'slug': 'edificio-indi', 'images': [image], 'models': [], 'documentarySurfaces': [],
            'amenities': [], 'finishes': [], 'features': [],
            'catalogueCover': {'localPath': image['localPath'], 'alt': 'Fachada y acceso de Edificio Indi · Imagen referencial'}}


def preview(page):
    page = re.sub(r'<!--LEBEN_PUBLIC_START-->.*?<!--LEBEN_PUBLIC_END-->', '', page, flags=re.S)
    return re.sub(r'<!--LEBEN_PREVIEW_(?:START|END)-->', '', page)


class IndiCoverTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / 'data').mkdir()
        (self.root / 'data/proyectos.json').write_text(json.dumps([{'slug': 'edificio-indi', 'amenities': []}]))
        self.record = record_fixture()
        self.manifest = self.root / 'data/brochures-leben.json'
        self.write_manifest()

    def tearDown(self):
        self.temporary.cleanup()

    def write_manifest(self):
        self.manifest.write_text(json.dumps({'projects': [self.record]}))

    def augment(self, page=PUBLIC_PAGE):
        with patch.object(generator, 'ROOT', self.root), patch.object(generator, 'MANIFEST', self.manifest):
            return generator.augment_leben_page(page, 'edificio-indi')

    def test_preview_cover_and_public_fallback_use_independent_hero_fragments(self):
        source = self.augment()
        self.assertEqual(generator.public_leben_page(source), PUBLIC_PAGE)
        rendered = preview(source)
        hero = re.search(r'<section\b[^>]*project-hero\b.*?</section>', rendered, re.S)[0]
        self.assertIn('project-hero-indi-preview', hero)
        self.assertIn('hero-image-indi-preview', hero)
        self.assertIn(self.record['catalogueCover']['localPath'], hero)
        self.assertIn('data-brochure-page="2"', hero)
        self.assertNotIn('/catalogo/old.webp', hero)
        self.assertIn('<h1>Edificio Indi</h1><p>Entrega inmediata</p>', hero)
        for unchanged in ['<section id="galeria"><figure><img src="/assets/propiedades/catalogo/old.webp" alt="Original gallery"></figure></section>', '<iframe src="https://maps.example/indi"></iframe>', '/contacto.html?proyecto=edificio-indi', '<strong>UF 2.560</strong>']:
            self.assertIn(unchanged, rendered)

    def test_regeneration_and_updated_native_dimensions_are_idempotent(self):
        first = self.augment()
        self.assertEqual(self.augment(first), first)
        self.record['images'][0].update(width=2113, height=1335)
        self.write_manifest()
        updated = self.augment(first)
        self.assertEqual(generator.public_leben_page(updated), PUBLIC_PAGE)
        self.assertEqual(self.augment(updated), updated)
        self.assertIn('width="2113" height="1335"', preview(updated))
        self.assertEqual(updated.count('project-hero-indi-preview'), 1)
        self.assertEqual(updated.count('<!--LEBEN_PUBLIC_START-->'), 1)

    def test_unselected_rejected_foreign_or_unreviewed_cover_fails_closed(self):
        for mutation in ['unselected', 'rejected', 'foreign', 'private', 'unreviewed', 'empty_alt', 'another_project']:
            record = copy.deepcopy(self.record)
            if mutation == 'unselected': record['catalogueCover']['localPath'] = '/assets/propiedades/leben-preview/edificio-indi/not-selected.webp'
            elif mutation == 'rejected': record['images'][0]['qualityDecision'] = 'reject'
            elif mutation == 'foreign':
                record['images'][0]['localPath'] = record['catalogueCover']['localPath'] = '/assets/propiedades/leben-preview/edificio-mood/borrowed.webp'
            elif mutation == 'private': record['images'][0]['privacySafe'] = False
            elif mutation == 'unreviewed': record['images'][0]['visuallyVerified'] = False
            elif mutation == 'empty_alt': record['catalogueCover']['alt'] = ''
            else: record['slug'] = 'edificio-mood'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                generator.private_indi_hero(PUBLIC_PAGE, record)
        original = copy.deepcopy(self.record); original.pop('catalogueCover')
        self.assertEqual(generator.private_indi_hero(PUBLIC_PAGE, original), PUBLIC_PAGE)

    def test_malformed_source_markers_or_missing_unique_hero_cannot_regenerate(self):
        with self.assertRaisesRegex(ValueError, 'Unpaired'):
            generator.public_leben_page('<!--LEBEN_PUBLIC_START-->' + PUBLIC_PAGE)
        for malformed in ['<html><head></head><body></body></html>', PUBLIC_PAGE + PUBLIC_PAGE]:
            with self.subTest(source=malformed), self.assertRaisesRegex(ValueError, 'exactly one original hero'):
                generator.private_indi_hero(malformed, self.record)


if __name__ == '__main__':
    unittest.main()
