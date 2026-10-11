"""Failure-path tests use disposable PDFs/rasters, never private originals."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image
from pypdf import PdfWriter

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/materialize-aj-brochures.py'
SPEC = importlib.util.spec_from_file_location('materialize_aj_brochures', SCRIPT)
AJ = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AJ)


class MaterializeAjTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-aj-test-')
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.root = self.base / 'repo'
        self.root.mkdir()
        self.input = self.base / 'private-input'
        (self.input / 'brochures').mkdir(parents=True)
        (self.input / 'imagenes_para_revision').mkdir()
        self.manifest_path = self.root / 'review.json'
        self.plan_sources = {}
        self.manifest = {'projects': []}
        for index, slug in enumerate(sorted(AJ.SLUGS)):
            source = self.input / 'brochures' / (slug + '.pdf')
            writer = PdfWriter()
            writer.add_blank_page(width=100, height=100)
            writer.write(source)
            source_hash = AJ.digest(source)
            candidate_name = slug + '.png'
            candidate = self.input / 'imagenes_para_revision' / candidate_name
            image = Image.new('RGB', (8, 6), (index * 40, 30, 80))
            image.save(candidate, 'PNG')
            plan_source = self.base / (slug + '.webp')
            image.save(plan_source, 'WEBP', quality=96, method=6)
            self.plan_sources[source.name] = plan_source
            prefix = AJ.PREFIX + slug + '/'
            self.manifest['projects'].append({
                'slug': slug,
                'document': {'fileName': source.name, 'sha256': source_hash, 'pageCount': 1},
                'images': [{
                    'localPath': prefix + candidate_name,
                    'originalFile': 'imagenes_para_revision/' + candidate_name,
                    'originalSha256': AJ.digest(candidate), 'sha256': AJ.digest(candidate),
                    'width': 8, 'height': 6, 'sourcePage': 1, 'sourceSha256': source_hash,
                }],
                'models': [{'modelo': '1', 'pagina_brochure': 1, 'plan': {
                    'localPath': prefix + 'plano-1-p01.webp',
                    'sha256': AJ.digest(plan_source), 'width': 8, 'height': 6,
                    'sourcePage': 1, 'sourceSha256': source_hash,
                }}],
            })
        self.write_manifest()

    def write_manifest(self):
        self.manifest_path.write_text(json.dumps(self.manifest, ensure_ascii=False, indent=1))
        self.original_manifest = self.manifest_path.read_bytes()

    def render(self, _pdftoppm, source, _page, destination):
        shutil.copyfile(self.plan_sources[source.name], destination)

    def run_materializer(self, render=None):
        with patch.object(AJ, 'render_plan', side_effect=render or self.render):
            return AJ.materialize(self.manifest_path, self.input, 'unused-poppler', self.root)

    def assets(self):
        directory = self.root / AJ.PREFIX.lstrip('/')
        return sorted(directory.rglob('*')) if directory.exists() else []

    def asset_bytes(self):
        return {path: path.read_bytes() for path in self.assets() if path.is_file()}

    def test_success_preserves_manifest_and_second_run_leaves_verified_files_untouched(self):
        result = self.run_materializer()
        self.assertEqual(result, {
            'projects': 5, 'uniquePlans': 5, 'addedImages': 5,
            'writtenAssets': 10, 'manifestUnchanged': True,
        })
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)
        files = self.asset_bytes()
        self.assertEqual(len(files), 10)
        self.assertTrue(all(path.suffix in ['.png', '.webp'] for path in files))
        timestamps = {path: path.stat().st_mtime_ns for path in files}
        self.assertEqual(self.run_materializer()['writtenAssets'], 0)
        self.assertEqual(self.asset_bytes(), files)
        self.assertEqual({path: path.stat().st_mtime_ns for path in files}, timestamps)
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)

    def test_changed_render_bytes_do_not_overwrite_any_existing_asset_or_manifest(self):
        self.run_materializer()
        files = self.asset_bytes()
        def changed(_pdftoppm, _source, _page, destination):
            destination.write_bytes(b'changed renderer result')
        with self.assertRaisesRegex(ValueError, 'approved asset SHA256'):
            self.run_materializer(changed)
        self.assertEqual(self.asset_bytes(), files)
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)

    def test_late_stage_failure_leaves_no_partial_asset_batch(self):
        last = self.manifest['projects'][-1]['document']['fileName']
        def changed_last(pdftoppm, source, page, destination):
            if source.name == last:
                destination.write_bytes(b'changed last plan')
            else:
                self.render(pdftoppm, source, page, destination)
        with self.assertRaisesRegex(ValueError, 'approved asset SHA256'):
            self.run_materializer(changed_last)
        self.assertEqual(self.assets(), [])
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)

    def test_source_pdf_hash_change_is_rejected_before_rendering(self):
        source = self.input / 'brochures' / self.manifest['projects'][-1]['document']['fileName']
        source.write_bytes(source.read_bytes() + b'changed')
        with patch.object(AJ, 'render_plan') as render:
            with self.assertRaisesRegex(ValueError, 'original document has changed'):
                AJ.materialize(self.manifest_path, self.input, 'unused-poppler', self.root)
            render.assert_not_called()
        self.assertEqual(self.assets(), [])

    def test_candidate_hash_change_is_rejected(self):
        row = self.manifest['projects'][-1]['images'][0]
        (self.input / row['originalFile']).write_bytes(b'changed candidate')
        with self.assertRaisesRegex(ValueError, 'candidate has changed'):
            self.run_materializer()
        self.assertEqual(self.assets(), [])

    def test_wrong_dimensions_are_rejected_even_when_hash_matches(self):
        self.manifest['projects'][-1]['images'][0]['width'] = 7
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'dimensions differ'):
            self.run_materializer()
        self.assertEqual(self.assets(), [])
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)

    def test_traversal_cross_project_and_pdf_destinations_are_rejected(self):
        original = copy.deepcopy(self.manifest)
        for local_path in [
            AJ.PREFIX + 'vista-morande/../copied.png',
            AJ.PREFIX + 'vista-morande/wrong-project.png',
            AJ.PREFIX + original['projects'][0]['slug'] + '/source.pdf',
        ]:
            with self.subTest(local_path=local_path):
                self.manifest = copy.deepcopy(original)
                self.manifest['projects'][0]['images'][0]['localPath'] = local_path
                self.write_manifest()
                with self.assertRaises(ValueError):
                    self.run_materializer()
                self.assertEqual(self.assets(), [])

    def test_duplicate_plan_destinations_are_rejected(self):
        record = self.manifest['projects'][0]
        record['models'].append(copy.deepcopy(record['models'][0]))
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'Duplicate approved output'):
            self.run_materializer()
        self.assertEqual(self.assets(), [])

    def test_source_page_and_hash_provenance_must_match_model(self):
        original = copy.deepcopy(self.manifest)
        for update in [{'sourcePage': 2}, {'sourceSha256': '0' * 64}]:
            with self.subTest(update=update):
                self.manifest = copy.deepcopy(original)
                self.manifest['projects'][0]['models'][0]['plan'].update(update)
                self.write_manifest()
                with self.assertRaisesRegex(ValueError, 'source provenance'):
                    self.run_materializer()
                self.assertEqual(self.assets(), [])

    def test_page_count_mismatch_and_unknown_project_are_rejected(self):
        original = copy.deepcopy(self.manifest)
        self.manifest['projects'][0]['document']['pageCount'] = 2
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'page count'):
            self.run_materializer()
        self.manifest = original
        self.manifest['projects'][0]['slug'] = 'unknown-project'
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'five reviewed AJ projects'):
            self.run_materializer()
        self.assertEqual(self.assets(), [])

    def test_manifest_change_during_staging_aborts_before_promotion(self):
        last = self.manifest['projects'][-1]['document']['fileName']
        def change_manifest(pdftoppm, source, page, destination):
            self.render(pdftoppm, source, page, destination)
            if source.name == last:
                self.manifest_path.write_bytes(self.original_manifest + b'\n')
        with self.assertRaisesRegex(ValueError, 'manifest changed while materializing'):
            self.run_materializer(change_manifest)
        self.assertEqual(self.assets(), [])
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest + b'\n')

    def test_symlink_project_folder_cannot_redirect_approved_outputs(self):
        assets = self.root / AJ.PREFIX.lstrip('/')
        assets.mkdir(parents=True)
        alternate = self.root / 'other-public-directory'
        alternate.mkdir()
        (assets / self.manifest['projects'][0]['slug']).symlink_to(alternate, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'contains a symlink'):
            self.run_materializer()
        self.assertEqual(list(alternate.iterdir()), [])

    def test_interrupted_promotion_rolls_back_existing_bytes(self):
        self.run_materializer()
        for path in self.asset_bytes():
            path.write_bytes(b'original damaged asset')
        originals = self.asset_bytes()
        original_replace = AJ.os.replace
        count = 0
        def interrupted(source, destination):
            nonlocal count
            count += 1
            if count == 3:
                raise OSError('Simulated filesystem interruption')
            return original_replace(source, destination)
        with patch.object(AJ.os, 'replace', side_effect=interrupted):
            with self.assertRaisesRegex(OSError, 'filesystem interruption'):
                self.run_materializer()
        self.assertEqual(self.asset_bytes(), originals)
        self.assertEqual(self.manifest_path.read_bytes(), self.original_manifest)

    def test_interrupted_first_promotion_removes_partial_files_and_directories(self):
        original_replace = AJ.os.replace
        count = 0
        def interrupted(source, destination):
            nonlocal count
            count += 1
            if count == 3:
                raise OSError('Simulated filesystem interruption')
            return original_replace(source, destination)
        with patch.object(AJ.os, 'replace', side_effect=interrupted):
            with self.assertRaises(OSError):
                self.run_materializer()
        self.assertEqual(self.assets(), [])
        self.assertFalse((self.root / 'assets').exists())


if __name__ == '__main__':
    unittest.main()
