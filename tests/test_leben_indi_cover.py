"""Shared private headers regenerate without modifying their public/body fragments."""
import copy
import importlib.util
import json
from pathlib import Path
import re
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('leben_header_generator', ROOT / 'scripts/leben_brochure.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)
PUBLIC_PAGE = '<html><head><title>Indi</title></head><body><section class="project-hero "><img class="hero-image" src="/assets/propiedades/catalogo/old.webp" alt="Original official image"><div class="hero-shade"></div><div class="hero-content"><h1>Edificio Indi</h1><p>Entrega inmediata</p></div></section><section id="galeria"><figure><img src="/assets/propiedades/catalogo/old.webp" alt="Original gallery"></figure></section><section id="ubicacion"><iframe src="https://maps.example/indi"></iframe></section><a href="/contacto.html?proyecto=edificio-indi">Consultar</a><strong>UF 2.560</strong></body></html>'


def preview(page):
    page = re.sub(r'<!--LEBEN_PUBLIC_START-->.*?<!--LEBEN_PUBLIC_END-->', '', page, flags=re.S)
    return re.sub(r'<!--LEBEN_PREVIEW_(?:START|END)-->', '', page)


class SharedLebenHeaderTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / 'data').mkdir()
        self.catalogue = [{'slug': 'edificio-indi', 'inmobiliaria': 'Leben', 'amenities': []}]
        image = {'localPath': '/assets/propiedades/leben-preview/edificio-indi/fachada-p02.jpg', 'sourcePage': 2,
                 'width': 2113, 'height': 1335, 'nativeWidth': 2113, 'nativeHeight': 1335, 'sha256': 'a' * 64,
                 'qualityDecision': 'keep', 'visuallyVerified': True, 'privacySafe': True, 'caption': 'Fachada referencial'}
        self.record = {'slug': 'edificio-indi', 'images': [image], 'models': [], 'documentarySurfaces': [], 'amenities': [], 'finishes': [], 'features': []}
        self.row = {'slug': 'edificio-indi', 'image': {key: image[key] for key in ['localPath', 'width', 'height', 'sha256']},
                    'focal': {'desktop': [50, 50], 'tablet': [50, 50], 'mobile': [50, 50]},
                    'photoWidthPercent': 76, 'solidUntilPercent': 40, 'fadeUntilPercent': 80}
        self.row['image']['alt'] = 'Render referencial de la fachada y el acceso de Edificio Indi'
        self.manifest = self.root / 'data/brochures-leben.json'
        self.config = self.root / 'data/leben-headers.json'
        self.write_fixture()

    def tearDown(self):
        self.temporary.cleanup()

    def write_fixture(self, rows=None):
        (self.root / 'data/proyectos.json').write_text(json.dumps(self.catalogue))
        self.manifest.write_text(json.dumps({'projects': [self.record]}))
        self.config.write_text(json.dumps({'schemaVersion': 1, 'protectedPreviewOnly': True, 'projects': rows or [self.row]}))

    def augment(self, page=PUBLIC_PAGE, slug='edificio-indi'):
        with patch.object(generator, 'ROOT', self.root), patch.object(generator, 'MANIFEST', self.manifest), patch.object(generator.header, 'ROOT', self.root), patch.object(generator.header, 'CONFIG', self.config):
            return generator.augment_leben_page(page, slug)

    def test_preview_and_public_headers_are_independent_with_original_body_exact(self):
        source = self.augment()
        self.assertEqual(generator.public_leben_page(source), PUBLIC_PAGE)
        rendered = preview(source)
        hero = generator.header.HERO.search(rendered)[0]
        self.assertIn('leben-project-hero', hero)
        self.assertIn(self.row['image']['localPath'], hero)
        self.assertIn('width="2113" height="1335"', hero)
        self.assertIn('<h1>Edificio Indi</h1><p>Entrega inmediata</p>', hero)
        self.assertNotIn('/catalogo/old.webp', hero)
        without_additions = re.sub(r'<div class="leben-complement".*?</div>(?=<section id="ubicacion")', '', rendered, flags=re.S)
        self.assertEqual(without_additions.split('</section>', 1)[1], PUBLIC_PAGE.split('</section>', 1)[1])

    def test_regeneration_is_idempotent_and_config_update_changes_only_private_header(self):
        first = self.augment()
        self.assertEqual(self.augment(first), first)
        self.row['focal']['mobile'] = [35, 60]
        self.write_fixture()
        updated = self.augment(first)
        self.assertEqual(generator.public_leben_page(updated), PUBLIC_PAGE)
        self.assertEqual(self.augment(updated), updated)
        self.assertIn('--leben-focus-mobile:35% 60%', preview(updated))
        self.assertEqual(first.split('</section>', 1)[1], updated.split('</section>', 1)[1])
        self.assertEqual(updated.count('data-leben-header='), 1)

    def test_configuration_rejects_unknown_duplicate_or_invalid_geometry(self):
        for mutation in ['unknown', 'duplicate', 'focal', 'gradient', 'path', 'dimension', 'alt']:
            row = copy.deepcopy(self.row)
            rows = [row]
            if mutation == 'unknown': row['slug'] = 'foreign-project'
            elif mutation == 'duplicate': rows.append(copy.deepcopy(row))
            elif mutation == 'focal': row['focal']['mobile'] = [50, 101]
            elif mutation == 'gradient': row['fadeUntilPercent'] = 42
            elif mutation == 'path': row['image']['localPath'] = '/assets/propiedades/../private.jpg'
            elif mutation == 'dimension': row['image']['width'] = 0
            else: row['image']['alt'] = ''
            self.write_fixture(rows)
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): self.augment()

    def test_unpaired_markers_missing_or_duplicate_heroes_cannot_regenerate(self):
        with self.assertRaisesRegex(ValueError, 'Unpaired'):
            self.augment('<!--LEBEN_PUBLIC_START-->' + PUBLIC_PAGE)
        for malformed in ['<html><head></head><body></body></html>', PUBLIC_PAGE + PUBLIC_PAGE]:
            with self.subTest(source=malformed), self.assertRaisesRegex(ValueError, 'exactly one unwrapped original header'):
                self.augment(malformed)

    def test_own_without_brochure_gets_header_and_preserves_vendido_and_gallery(self):
        own = PUBLIC_PAGE.replace('Edificio Indi', 'Own').replace('edificio-indi', 'own').replace('Entrega inmediata', 'Vendido')
        self.catalogue = [{'slug': 'own', 'inmobiliaria': 'Leben'}]
        self.row['slug'] = 'own'
        self.row['image']['localPath'] = '/assets/propiedades/catalogo/old.webp'
        self.write_fixture()
        source = self.augment(own, 'own')
        self.assertEqual(generator.public_leben_page(source), own)
        self.assertIn('<p>Vendido</p>', preview(source))
        self.assertNotIn('leben-complement', source)
        self.assertEqual(preview(source).split('</section>', 1)[1], own.split('</section>', 1)[1])
        self.assertEqual(self.augment(source, 'own'), source)

    def test_featured_contents_and_non_leben_page_survive_shared_augmentation(self):
        old = generator.header.HERO.search(PUBLIC_PAGE)[0]
        featured = '<section class="relative h-[620px] w-full overflow-hidden"><img class="property-hero-image" src="/assets/propiedades/catalogo/old.webp"><div class="absolute bottom-12 left-6 md:left-12 max-w-4xl"><div class="label-blue-print text-tertiary-fixed mb-4">Leben</div><h1>Edificio Indi</h1><div class="flex items-center text-white/90"><span>Ubicación original</span></div></div></section>'
        page = PUBLIC_PAGE.replace(old, featured)
        source = self.augment(page)
        self.assertEqual(generator.public_leben_page(source), page)
        self.assertIn('<h1>Edificio Indi</h1>', preview(source))
        self.assertIn('<span>Ubicación original</span>', preview(source))
        self.assertEqual(self.augment(source), source)
        self.assertEqual(self.augment(page, 'foreign-project'), page)


if __name__ == '__main__':
    unittest.main()
