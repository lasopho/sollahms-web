"""Small local PDFs exercise tooling extraction and the patched JPEG boundary."""
import io
import unittest
from unittest.mock import Mock, patch

from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    DecodedStreamObject, DictionaryObject, EncodedStreamObject, NameObject,
    NumberObject,
)


def image_pdf(payload):
    writer = PdfWriter()
    page = writer.add_blank_page(width=72, height=72)
    image = EncodedStreamObject()
    image._data = payload
    image.update({
        NameObject('/Type'): NameObject('/XObject'),
        NameObject('/Subtype'): NameObject('/Image'),
        NameObject('/Width'): NumberObject(2),
        NameObject('/Height'): NumberObject(2),
        NameObject('/BitsPerComponent'): NumberObject(8),
        NameObject('/ColorSpace'): NameObject('/DeviceRGB'),
        NameObject('/Filter'): NameObject('/DCTDecode'),
    })
    page[NameObject('/Resources')] = DictionaryObject({
        NameObject('/XObject'): DictionaryObject({NameObject('/Sample'): writer._add_object(image)}),
        NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(DictionaryObject({
            NameObject('/Type'): NameObject('/Font'),
            NameObject('/Subtype'): NameObject('/Type1'),
            NameObject('/BaseFont'): NameObject('/Helvetica'),
        }))}),
    })
    text = DecodedStreamObject()
    text.set_data(b'BT /F1 12 Tf 5 30 Td (Local PDF fixture) Tj ET')
    page[NameObject('/Contents')] = writer._add_object(text.flate_encode())
    writer.add_blank_page(width=72, height=72)
    target = io.BytesIO()
    writer.write(target)
    target.seek(0)
    return target


class PdfDependencyCompatibilityTests(unittest.TestCase):
    def test_reader_preserves_page_text_and_native_jpeg_extraction(self):
        source = io.BytesIO()
        Image.new('RGB', (2, 2), '#557766').save(source, 'JPEG', quality=88)
        reader = PdfReader(image_pdf(source.getvalue()))
        self.assertEqual(len(reader.pages), 2)
        self.assertEqual(reader.pages[0].extract_text(), 'Local PDF fixture')
        native = reader.pages[0].images[0]
        self.assertEqual(native.name, 'Sample.jpg')
        self.assertEqual(native.image.size, (2, 2))
        self.assertEqual(native.image.format, 'JPEG')
        # Native extraction retains the encoded JPEG rather than changing its identity.
        self.assertEqual(native.data, source.getvalue())

    def test_dctdecode_rejects_non_jpeg_without_dispatching_the_png_parser(self):
        # A harmless 2x2 PNG with a false JPEG label exercises GHSA-5hx5-vpf9-5wcv.
        # No decompression bomb, external PDF, network or large allocation is used.
        source = io.BytesIO()
        Image.new('RGB', (2, 2), '#557766').save(source, 'PNG')
        reader = PdfReader(image_pdf(source.getvalue()))
        Image.init()
        factory, accepts = Image.OPEN['PNG']
        png_parser = Mock(wraps=factory)
        with patch.dict(Image.OPEN, {'PNG': (png_parser, accepts)}):
            with self.assertRaises(UnidentifiedImageError):
                reader.pages[0].images[0]
        png_parser.assert_not_called()


if __name__ == '__main__':
    unittest.main()
