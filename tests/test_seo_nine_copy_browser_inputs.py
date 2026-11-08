"""Checks for isolated package input selection; no browser, API or provider calls."""

import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.request import urlopen


SPEC = importlib.util.spec_from_file_location(
    "seo_nine_copy_browser", Path(__file__).with_name("seo-nine-copy-browser.py")
)
QA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QA)


class PackageInputTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="nine-copy-inputs-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.baseline = self.root / "baseline"
        self.candidate = self.root / "candidate"
        for root in (self.baseline, self.candidate):
            root.mkdir()
            for name in QA.PAGES:
                (root / name).write_text("<!doctype html><p>Synthetic test page</p>")

    def arguments(self, output=None):
        args = ["--baseline-static-root", str(self.baseline),
                "--candidate-static-root", str(self.candidate)]
        return args if output is None else args + ["--output", str(output)]

    def rejected(self, arguments):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            QA.parse_arguments(arguments)
        self.assertEqual(error.exception.code, 2)

    def test_repository_defaults_are_preserved(self):
        args = QA.parse_arguments([])
        self.assertIsNone(args.baseline_static_root)
        self.assertIsNone(args.candidate_static_root)
        self.assertIsNone(args.output)

    def test_packaged_roots_must_be_paired_and_require_output(self):
        self.rejected(["--baseline-static-root", str(self.baseline)])
        self.rejected(["--candidate-static-root", str(self.candidate)])
        self.rejected(self.arguments())

    def test_packaged_output_must_not_overwrite_any_existing_evidence(self):
        for name, is_directory in (("previous-evidence", True), ("previous-results.json", False)):
            output = self.root / name
            if is_directory:
                output.mkdir()
            else:
                output.write_text("retain")
            self.rejected(self.arguments(output))
        self.rejected(self.arguments(QA.HISTORICAL_OUTPUT))

    def test_evidence_cannot_be_written_inside_either_public_tree(self):
        for root in (self.baseline, self.candidate):
            output = root / "internal-evidence"
            self.rejected(self.arguments(output))
            self.assertFalse(output.exists())

    def test_valid_package_arguments_only_select_paths_without_creating_output(self):
        output = self.root / "new-evidence"
        args = QA.parse_arguments(self.arguments(output))
        self.assertEqual(args.baseline_static_root, self.baseline.resolve())
        self.assertEqual(args.candidate_static_root, self.candidate.resolve())
        self.assertFalse(output.exists())

    def test_static_servers_serve_their_own_packaged_asset_bytes(self):
        origins, journals = [], []
        for root, expected in ((self.baseline, b"baseline asset"),
                               (self.candidate, b"candidate asset")):
            (root / "assets").mkdir()
            (root / "assets" / "isolated.js").write_bytes(expected)
            journal = []
            server = QA.ThreadingHTTPServer(
                ("127.0.0.1", 0), QA.handler_for({}, journal, root)
            )
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            self.addCleanup(server.server_close)
            self.addCleanup(server.shutdown)
            origins.append((f"http://127.0.0.1:{server.server_port}", expected))
            journals.append(journal)
        for origin, expected in origins:
            with urlopen(origin + "/assets/isolated.js", timeout=5) as response:
                self.assertEqual(response.read(), expected)
                self.assertEqual(response.headers["Content-Type"], "text/javascript")
        self.assertTrue(all(journal == [{"method": "GET", "path": "/assets/isolated.js"}]
                            for journal in journals))


if __name__ == "__main__":
    unittest.main()
