"""Synthetic offline checks; never import proprietary media or call providers."""
import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('private_resource_inventory', ROOT / 'scripts/check-private-resources.py')
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)


class PrivateResourceInventoryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-resource-check-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.path = self.root / 'assets/propiedades/example/image.webp'
        self.path.parent.mkdir(parents=True)
        Image.new('RGB', (8, 6), (20, 40, 80)).save(self.path, 'WEBP', lossless=True)
        self.item = {'path': self.path.relative_to(self.root).as_posix(),
                     'sha256': hashlib.sha256(self.path.read_bytes()).hexdigest(),
                     'bytes': self.path.stat().st_size, 'width': 8, 'height': 6}

    def test_exact_raster_is_verified_without_changing_bytes(self):
        before = self.path.read_bytes()
        row = CHECK.inspect_asset(self.root, self.item)
        self.assertEqual(row['status'], 'verified')
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(row['actualSha256'], self.item['sha256'])

    def test_missing_file_remains_missing_without_creating_placeholder(self):
        self.path.unlink()
        self.assertEqual(CHECK.inspect_asset(self.root, self.item)['status'], 'missing')
        self.assertFalse(self.path.exists())

    def test_changed_hash_size_and_dimensions_are_rejected(self):
        item = dict(self.item, sha256='0' * 64, bytes=1, width=9)
        row = CHECK.inspect_asset(self.root, item)
        self.assertEqual(row['status'], 'invalid')
        self.assertEqual(row['errors'], ['sha256_mismatch', 'size_mismatch'])
        row = CHECK.inspect_asset(self.root, dict(self.item, width=9))
        self.assertEqual(row['errors'], ['dimensions_mismatch'])

    def test_untrusted_pdf_and_image_never_reach_decoders(self):
        pdf = self.root / 'assets/brochures/untrusted.pdf'
        pdf.parent.mkdir(parents=True)
        pdf.write_bytes(b'not reviewed PDF bytes')
        cases = [
            {'path': pdf.relative_to(self.root).as_posix(), 'sha256': '0' * 64, 'pageCount': 1},
            dict(self.item, sha256='0' * 64),
            dict(self.item, bytes=1),
        ]
        for item in cases:
            with self.subTest(path=item['path'], sha=item['sha256']), \
                    patch.object(CHECK, 'PdfReader') as pdf_reader, \
                    patch.object(CHECK.Image, 'open') as image_reader:
                row = CHECK.inspect_asset(self.root, item)
                self.assertEqual(row['status'], 'invalid')
                self.assertTrue(set(row['errors']) <= {'sha256_mismatch', 'size_mismatch'})
                pdf_reader.assert_not_called()
                image_reader.assert_not_called()

    def test_corrupt_image_is_rejected_even_with_matching_digest(self):
        self.path.write_bytes(b'not an image')
        item = dict(self.item, sha256=CHECK.sha(self.path.read_bytes()), bytes=self.path.stat().st_size)
        self.assertIn('invalid_image', CHECK.inspect_asset(self.root, item)['errors'])

    def test_symlink_file_and_directory_are_rejected(self):
        self.path.unlink()
        original = self.root / 'outside.webp'
        original.write_bytes(b'never read')
        self.path.symlink_to(original)
        self.assertEqual(CHECK.inspect_asset(self.root, self.item)['status'], 'unsafe_symlink')
        self.path.unlink()
        self.path.parent.rmdir()
        self.path.parent.symlink_to(self.root)
        self.assertEqual(CHECK.inspect_asset(self.root, self.item)['status'], 'unsafe_symlink')

    def test_noncanonical_paths_are_rejected(self):
        for name in ['../secret', '/assets/image.webp', 'assets/../secret',
                     'assets//image.webp', 'assets/./image.webp', 'assets\\secret']:
            with self.subTest(path=name), self.assertRaises(ValueError):
                CHECK.inspect_asset(self.root, dict(self.item, path=name))

    def test_pdf_digest_and_page_count_are_verified(self):
        path = self.root / 'assets/brochures/example.pdf'
        path.parent.mkdir(parents=True)
        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        writer.write(path)
        item = {'path': path.relative_to(self.root).as_posix(),
                'sha256': CHECK.sha(path.read_bytes()), 'pageCount': 1}
        self.assertEqual(CHECK.inspect_asset(self.root, item)['status'], 'verified')
        self.assertIn('page_count_mismatch', CHECK.inspect_asset(self.root, dict(item, pageCount=2))['errors'])

    def test_inventory_uses_only_current_reviewed_transport_and_preserves_rights(self):
        inventory, manifests, rights = CHECK.selected_inventory(ROOT)
        self.assertEqual(len(inventory), 1039)
        self.assertEqual(len(manifests), 7)
        self.assertNotIn('assets/propiedades/sento/domeyko-2055/plano-01-960.webp', inventory)
        self.assertEqual(sum(path.startswith('assets/propiedades/ingevec-preview/') for path in inventory), 165)
        self.assertEqual(sum(path.startswith('assets/propiedades/ecasa-preview/') for path in inventory), 130)
        self.assertEqual(sum(path.startswith('assets/propiedades/leben-preview/') for path in inventory), 43)
        self.assertEqual(rights['data/brochures-ecasa.json']['contractScope']['status'], 'pending_contract_scope_verification')
        self.assertFalse(rights['data/brochures-leben.json']['publicPublicationApproved'])
        self.assertFalse(rights['data/ecasa-official-originals.json']['publicWeb'])


if __name__ == '__main__':
    unittest.main()
