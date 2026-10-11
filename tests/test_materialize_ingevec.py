"""Focused safety/regeneration checks; no originals, deploys or provider calls."""
from copy import deepcopy
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('materialize_ingevec',
    ROOT / 'scripts/materialize-ingevec-brochures.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
APPROVED = json.loads((ROOT / 'data/brochures-ingevec.json').read_bytes())


class MaterializerSafetyTests(unittest.TestCase):
    def setUp(self):
        self.manifest = deepcopy(APPROVED)

    def rejected(self, mutate):
        mutate(self.manifest)
        with self.assertRaises(MODULE.MaterializationError):
            MODULE.validate_manifest(self.manifest)

    def test_current_inventory_is_exact_and_validation_does_not_mutate_manifest(self):
        before = deepcopy(self.manifest)
        assets = MODULE.validate_manifest(self.manifest)
        self.assertEqual(len(assets), sum(len(r['images']) + len(r['models']) for r in self.manifest['projects']))
        self.assertEqual(sum(len(r['models']) for r in self.manifest['projects']), 41)
        historic = [r for r in self.manifest['projects'] if r['slug'] in MODULE.OLD_SLUGS]
        self.assertEqual(sum(len(r['images']) + len(r['models']) for r in historic), 36)
        self.assertEqual(self.manifest, before)

    def test_missing_duplicate_or_candidate_projects_are_rejected(self):
        for slugs in [['centenario-1', 'tocornal'], ['centenario-1', 'tocornal', 'tocornal'],
                      ['centenario-1', 'tocornal', 'unverified-candidate']]:
            with self.subTest(slugs=slugs):
                self.manifest = deepcopy(APPROVED)
                records = self.manifest['projects'][:len(slugs)]
                for record, slug in zip(records, slugs):
                    record['slug'] = slug
                self.manifest['projects'] = records
                with self.assertRaises(MODULE.MaterializationError):
                    MODULE.validate_manifest(self.manifest)

    def test_unsafe_paths_missing_fingerprints_and_duplicate_outputs_are_rejected(self):
        mutations = [
            lambda m: m['projects'][0]['document'].update(fileName='../source.pdf'),
            lambda m: m['projects'][0]['images'][0].update(localPath='/assets/other/facade.webp'),
            lambda m: m['projects'][0]['images'][0].update(assetName='../facade'),
            lambda m: m['projects'][0]['images'][0].update(sha256=''),
            lambda m: m['projects'][0]['images'][0].update(width=True),
            lambda m: m['projects'][0]['images'][0].update(sourceSha256='0' * 64),
            lambda m: m['projects'][0]['images'].__setitem__(1, deepcopy(m['projects'][0]['images'][0])),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(case=index):
                self.manifest = deepcopy(APPROVED)
                self.rejected(mutate)

    def test_centenario_private_pages_and_unreviewed_images_are_rejected(self):
        for page in [2, 3]:
            with self.subTest(page=page):
                self.manifest = deepcopy(APPROVED)
                self.rejected(lambda m: m['projects'][0]['images'][1].update(sourcePage=page))
        for change in [dict(imageIndex=1), dict(originalSha256='0' * 64),
                       dict(privacySafe=False), dict(visuallyVerified=False)]:
            with self.subTest(change=change):
                self.manifest = deepcopy(APPROVED)
                self.rejected(lambda m: m['projects'][0]['images'][0].update(change))

    def test_exact_plan_pages_and_unknown_values_cannot_be_reinterpreted(self):
        mutations = [
            lambda m: m['projects'][0]['models'][0].update(pagina_brochure=1),
            lambda m: m['projects'][0]['models'][0]['plan'].update(sourcePage=11),
            lambda m: m['projects'][0]['models'][0].update(sourcePages=[10, 2]),
            lambda m: m['projects'][0]['models'][0].update(orientacion='Norte'),
            lambda m: m['projects'][0]['models'][0].update(pisos='5'),
            lambda m: m['projects'][1]['models'][2].update(banos=2),
            lambda m: m['projects'][2]['models'].pop(),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(case=index):
                self.manifest = deepcopy(APPROVED)
                self.rejected(mutate)

    def test_output_inventory_rejects_extras_nested_folders_and_symlinks(self):
        assets = MODULE.validate_manifest(self.manifest)
        for kind in ['extra-file', 'nested-directory', 'symlink']:
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary).resolve()
                folder = root / MODULE.PREFIX.lstrip('/') / 'centenario-1'
                folder.mkdir(parents=True)
                with patch.object(MODULE, 'ROOT', root):
                    self.assertEqual(MODULE.output_inventory(assets), set())
                    if kind == 'extra-file':
                        (folder / 'unreviewed.jpg').write_bytes(b'unreviewed')
                    elif kind == 'nested-directory':
                        (folder / 'unreviewed').mkdir()
                    else:
                        target = root / 'private-fixture.txt'
                        target.write_bytes(b'private fixture')
                        (folder / 'fachada.webp').symlink_to(target)
                    with self.assertRaises(MODULE.MaterializationError):
                        MODULE.output_inventory(assets)

    def test_encoder_drift_rejects_output_and_preserves_manifest_and_existing_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            (root / 'data').mkdir()
            inputs = root / 'inputs'
            inputs.mkdir()
            record = self.manifest['projects'][0]
            original = b'synthetic PDF fixture: no personal or project information'
            record['document']['sha256'] = sha256(original).hexdigest()
            for image in record['images']:
                image['sourceSha256'] = record['document']['sha256']
            for model in record['models']:
                model['plan']['sourceSha256'] = record['document']['sha256']
            (inputs / record['document']['fileName']).write_bytes(original)
            native_bytes = b'synthetic native image'
            native_hash = sha256(native_bytes).hexdigest()
            record['images'][0]['originalSha256'] = native_hash
            manifest_path = root / 'data/brochures-ingevec.json'
            manifest_bytes = json.dumps(self.manifest).encode()
            manifest_path.write_bytes(manifest_bytes)
            existing = root / record['images'][0]['localPath'].lstrip('/')
            existing.parent.mkdir(parents=True)
            existing.write_bytes(b'existing approved destination must remain untouched on failure')
            before = existing.read_bytes()
            native = SimpleNamespace(data=native_bytes, image=Image.new('RGB', (16, 12), 'blue'))
            reader = SimpleNamespace(pages=[SimpleNamespace(images=[native])] * record['document']['pageCount'])
            with patch.object(MODULE, 'ROOT', root), patch.object(MODULE, 'CENTENARIO_FACADE', native_hash), \
                    patch.object(MODULE, 'PdfReader', return_value=reader), \
                    patch.object(MODULE.subprocess, 'run') as render:
                with self.assertRaisesRegex(MODULE.MaterializationError, 'approved hash'):
                    MODULE.materialize(inputs, '/synthetic/pdftoppm')
                render.assert_not_called()
            self.assertEqual(manifest_path.read_bytes(), manifest_bytes)
            self.assertEqual(existing.read_bytes(), before)
            self.assertEqual(list(existing.parent.iterdir()), [existing])

    def test_output_hash_dimensions_and_metadata_must_match_approved_media(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'image.webp'
            image = Image.new('RGB', (24, 16), 'green')
            image.save(path, 'WEBP', quality=94, method=6)
            approved = {'sha256': sha256(path.read_bytes()).hexdigest(), 'width': 24, 'height': 16}
            MODULE.verify_generated(path, approved)
            with self.assertRaises(MODULE.MaterializationError):
                MODULE.verify_generated(path, {**approved, 'width': 25})
            image.save(path, 'WEBP', quality=94, method=6, xmp=b'synthetic private metadata')
            approved['sha256'] = sha256(path.read_bytes()).hexdigest()
            with self.assertRaisesRegex(MODULE.MaterializationError, 'metadata'):
                MODULE.verify_generated(path, approved)

    def test_new_pdf_evidence_and_exact_twenty_seven_plan_selection_cannot_be_replaced(self):
        added = [record for record in self.manifest['projects'] if record['slug'] in MODULE.NEW_SLUGS]
        self.assertEqual(len(added), 7)
        self.assertEqual(sum(len(record['models']) for record in added), 27)
        for kind in ['unknown-pdf', 'missing-model-source', 'wrong-plan-source', 'duplicate-page', 'missing-page', 'unknown-orientation', 'unknown-floor']:
            with self.subTest(kind=kind):
                self.manifest = deepcopy(APPROVED)
                record = next(record for record in self.manifest['projects'] if record['slug'] == 'coronel-godoy')
                if kind == 'unknown-pdf':
                    record['document']['sha256'] = '0' * 64
                elif kind == 'missing-model-source':
                    record['models'][0].pop('sourceSha256')
                elif kind == 'wrong-plan-source':
                    record['models'][0]['plan']['sourceSha256'] = '0' * 64
                elif kind == 'duplicate-page':
                    record['models'][1]['pagina_brochure'] = record['models'][0]['pagina_brochure']
                elif kind == 'unknown-orientation':
                    record['models'][0]['orientacion'] = 'Norte'
                elif kind == 'unknown-floor':
                    record['models'][0]['pisos'] = '5'
                else:
                    record['models'].pop()
                with self.assertRaises(MODULE.MaterializationError):
                    MODULE.validate_manifest(self.manifest)

    def test_vicuna_two_stages_remain_distinct_even_for_visually_identical_plans(self):
        record = next(record for record in self.manifest['projects'] if record['slug'] == 'vicuna-mackenna-7589')
        self.assertEqual(len(record['documents']), 2)
        self.assertEqual(len(record['models']), 6)
        self.assertEqual({model['etapa'] for model in record['models']}, {'Etapa 1', 'Etapa 2'})
        self.assertEqual(len({(model['sourceSha256'], model['pagina_brochure']) for model in record['models']}), 6)
        self.assertEqual(len({model['plan']['localPath'] for model in record['models']}), 6)
        for kind in ['missing-stage-document', 'duplicate-document', 'wrong-model-stage', 'wrong-plan-stage', 'wrong-model-stage-identifier']:
            with self.subTest(kind=kind):
                self.manifest = deepcopy(APPROVED)
                record = next(record for record in self.manifest['projects'] if record['slug'] == 'vicuna-mackenna-7589')
                if kind == 'missing-stage-document':
                    record['documents'].pop()
                elif kind == 'duplicate-document':
                    record['documents'][1] = deepcopy(record['documents'][0])
                elif kind == 'wrong-model-stage':
                    record['models'][0]['etapa'] = 'Etapa 2'
                elif kind == 'wrong-plan-stage':
                    record['models'][0]['plan']['etapa'] = 'Etapa 2'
                else:
                    record['models'][0]['modelo'] = 'e2-source-mismatch'
                    record['models'][0]['plan']['localPath'] = MODULE.PREFIX + 'vicuna-mackenna-7589/plano-e2-source-mismatch.webp'
                with self.assertRaises(MODULE.MaterializationError):
                    MODULE.validate_manifest(self.manifest)

    def test_source_symlink_is_rejected_before_reading_or_rendering_the_pdf(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            (root / 'data').mkdir()
            manifest = root / 'data/brochures-ingevec.json'
            manifest.write_text(json.dumps(self.manifest))
            inputs = root / 'inputs'
            inputs.mkdir()
            target = root / 'synthetic-source.pdf'
            target.write_bytes(b'synthetic source that must not be read as a linked input')
            source = inputs / self.manifest['projects'][0]['document']['fileName']
            source.symlink_to(target)
            with patch.object(MODULE, 'ROOT', root), patch.object(MODULE, 'PdfReader') as read, \
                    patch.object(MODULE.subprocess, 'run') as render:
                with self.assertRaisesRegex(MODULE.MaterializationError, 'regular PDF'):
                    MODULE.materialize(inputs, '/synthetic/pdftoppm')
                read.assert_not_called()
                render.assert_not_called()
            self.assertFalse((root / MODULE.PREFIX.lstrip('/')).exists())


if __name__ == '__main__':
    unittest.main()
