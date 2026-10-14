import hashlib
import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch
import zlib
from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, EncodedStreamObject, NameObject, NumberObject

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('leben_materializer', ROOT / 'scripts/materialize-leben-brochures.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LebenMaterializerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def native_fixture(self, size=(2501, 4001)):
        image = Image.new('RGB', size, '#557766')
        output = io.BytesIO(); image.save(output, 'JPEG')
        data = output.getvalue()
        native = SimpleNamespace(name='X1.jpg', data=data)
        reader = SimpleNamespace(pages=[SimpleNamespace(images=[native])])
        expected = image.copy(); expected.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        asset = {'sourcePage': 1, 'sourceImageIndex': 0, 'sourceImageName': 'X1.jpg',
                 'sourceImageSha256': hashlib.sha256(data).hexdigest(), 'extractionMethod': 'pdf_image_object',
                 'crop': [0, 0, 1, 1], 'nativeWidth': size[0], 'nativeHeight': size[1],
                 'width': expected.width, 'height': expected.height}
        return reader, asset

    def test_portrait_thumbnail_preserves_reviewed_rounding_and_native_limits(self):
        reader, asset = self.native_fixture()
        destination = self.root / 'portrait.webp'
        module.render_asset(self.root / 'private.pdf', reader, asset, destination, self.root, 'unused', 'unused')
        with Image.open(destination) as image:
            self.assertEqual(image.size, (1125, 1800))
            self.assertLessEqual(image.width, asset['nativeWidth'])
            self.assertLessEqual(image.height, asset['nativeHeight'])

    def test_foreign_native_object_and_upscale_never_write_a_derivative(self):
        reader, original = self.native_fixture((320, 240))
        for mutation in ['foreign_object', 'upscale']:
            asset = dict(original)
            if mutation == 'foreign_object': asset['sourceImageSha256'] = '0' * 64
            else: asset['width'] = 640
            destination = self.root / (mutation + '.webp')
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                module.render_asset(self.root / 'private.pdf', reader, asset, destination, self.root, 'unused', 'unused')
            self.assertFalse(destination.exists())

    def test_original_hash_mismatch_leaves_existing_private_output_untouched(self):
        originals = self.root / 'originals'; originals.mkdir()
        target = self.root / 'output'; target.mkdir()
        previous = target / 'approved.webp'; previous.write_bytes(b'previously approved media')
        documents, records = [], []
        for index in range(12):
            name = f'{index}.pdf'; content = b'%PDF-1.7\n' + str(index).encode()
            (originals / name).write_bytes(content)
            document = {'fileName': name, 'sha256': hashlib.sha256(content).hexdigest(), 'pageCount': 1}
            documents.append(document)
            records.append({'slug': f'project-{index}', 'document': document, 'images': [], 'models': []})
        (originals / '11.pdf').write_bytes(b'changed source')
        manifest = self.root / 'manifest.json'
        manifest.write_text(json.dumps({'schemaVersion': 1, 'sourceDocuments': documents, 'projects': records}))
        frozen = manifest.read_bytes()
        with patch.object(module, 'PdfReader', return_value=SimpleNamespace(pages=[object()])):
            with self.assertRaisesRegex(ValueError, 'Original SHA-256'):
                module.materialize(manifest, originals, target)
        self.assertEqual(previous.read_bytes(), b'previously approved media')
        self.assertEqual(manifest.read_bytes(), frozen)
        self.assertEqual(list(target.iterdir()), [previous])

    def test_opted_in_original_jpeg_copy_keeps_exact_bytes_and_rejects_invalid_stream_evidence(self):
        image = Image.new('RGB', (320, 240), '#557766')
        encoded = io.BytesIO(); image.save(encoded, 'JPEG', quality=88); data = encoded.getvalue()
        writer = PdfWriter(); page = writer.add_blank_page(width=320, height=240)
        stream = EncodedStreamObject(); stream._data = zlib.compress(data)
        stream.update({NameObject('/Type'): NameObject('/XObject'), NameObject('/Subtype'): NameObject('/Image'),
                       NameObject('/Width'): NumberObject(320), NameObject('/Height'): NumberObject(240),
                       NameObject('/BitsPerComponent'): NumberObject(8), NameObject('/ColorSpace'): NameObject('/DeviceRGB'),
                       NameObject('/Filter'): ArrayObject([NameObject('/FlateDecode'), NameObject('/DCTDecode')])})
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/XObject'): DictionaryObject({NameObject('/X2'): writer._add_object(stream)})})
        pdf = self.root / 'private.pdf'
        with pdf.open('wb') as output: writer.write(output)
        reader = PdfReader(pdf); native = reader.pages[0].images[0]
        sha = hashlib.sha256(data).hexdigest()
        asset = {'sourcePage': 1, 'sourceImageIndex': 0, 'sourceImageName': native.name,
                 'sourceImageSha256': hashlib.sha256(native.data).hexdigest(), 'extractionMethod': 'pdf_image_object',
                 'crop': [0, 0, 1, 1], 'nativeWidth': 320, 'nativeHeight': 240, 'width': 320, 'height': 240,
                 'sha256': sha, 'sourceEncodedStream': {'resourceName': 'X2', 'sha256': sha, 'format': 'JPEG'},
                 'encoderMethod': 'original_embedded_jpeg_no_reencoding'}
        destination = self.root / 'original.jpg'
        module.render_asset(pdf, reader, asset, destination, self.root, 'unused', 'unused')
        self.assertEqual(destination.read_bytes(), data)
        for mutation in ['malformed', 'hash', 'crop', 'resize', 'native', 'quality', 'resource', 'mapping', 'rgb', 'not_jpeg']:
            changed = json.loads(json.dumps(asset)); local_reader = PdfReader(pdf); page = local_reader.pages[0]; native = page.images[0]
            obj = page['/Resources']['/XObject']['/X2']
            if mutation == 'malformed': changed['sourceEncodedStream'] = {}
            elif mutation == 'hash': changed['sourceEncodedStream']['sha256'] = '0' * 64
            elif mutation == 'crop': changed['crop'] = [0, 0, .9, 1]
            elif mutation == 'resize': changed['width'] = 160
            elif mutation == 'native': changed['nativeHeight'] = 241
            elif mutation == 'quality': changed['encoderQuality'] = 90
            elif mutation == 'resource': changed['sourceEncodedStream']['resourceName'] = 'Foreign'
            elif mutation == 'mapping': obj[NameObject('/Decode')] = ArrayObject([NumberObject(0), NumberObject(1)])
            elif mutation == 'rgb': obj[NameObject('/ColorSpace')] = NameObject('/DeviceCMYK')
            else:
                png = io.BytesIO(); image.save(png, 'PNG'); payload = png.getvalue()
                with patch.object(obj, 'get_data', return_value=payload):
                    changed['sha256'] = changed['sourceEncodedStream']['sha256'] = hashlib.sha256(payload).hexdigest()
                    with self.assertRaisesRegex(ValueError, 'native RGB JPEG'):
                        module.copy_encoded_jpeg(page, native, changed, self.root / 'not_jpeg.jpg', changed['crop'])
                self.assertFalse((self.root / 'not_jpeg.jpg').exists()); continue
            target = self.root / (mutation + '.jpg')
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                module.copy_encoded_jpeg(page, native, changed, target, changed['crop'])
            self.assertFalse(target.exists())


if __name__ == '__main__':
    unittest.main()
