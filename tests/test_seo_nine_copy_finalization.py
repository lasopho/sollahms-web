"""Finalization gates using synthetic runtime bytes; no builders or providers."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    'nine_copy_prep', Path(__file__).resolve().parents[1] / 'scripts/prepare-nine-copy-local.py')
PREP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PREP)


def digest(data):
    return hashlib.sha256(data).hexdigest()


class FinalizationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='nine-copy-finalization-')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.source, self.work, self.repo = [self.root / name for name in ['source', 'work', 'repo']]
        self.repo.mkdir()
        self.runtime = {'config.json': b'original configuration', 'static/assets/retained.js': b'original asset',
                        'functions/api/example.func/index.mjs': b'original function'}
        pages = {}
        for name in PREP.PAGES:
            old, new = ('baseline ' + name).encode(), ('approved ' + name).encode()
            pages[name] = digest(old), digest(new)
            self.runtime['static/' + name] = old
            (self.repo / name).write_bytes(new)
        self.expected = {name: digest(data) for name, data in self.runtime.items()}
        builder = b'// synthetic builder; never executed'
        for label in ['baseline', 'candidate']:
            target = self.work / label
            hashes = dict(self.expected)
            if label == 'candidate':
                hashes.update({'static/' + name: pair[1] for name, pair in pages.items()})
            target.mkdir(parents=True)
            (target / PREP.BUILDER).write_bytes(builder)
            (target / 'orientation-output-hashes.json').write_text(json.dumps(hashes))
            for tree in ['release', '.vercel/output']:
                for name, data in self.runtime.items():
                    if label == 'candidate' and name.startswith('static/') and name[7:] in pages:
                        data = (self.repo / name[7:]).read_bytes()
                    if tree == '.vercel/output' and name == 'config.json':
                        data = b'original builder compiled configuration'
                    path = target / tree / name
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(data)
        self.addCleanup(patch.stopall)
        patch.object(PREP, 'PAGES', pages).start()
        patch.object(PREP, 'REPO', self.repo).start()
        patch.object(PREP, 'BUILDER_SHA256', digest(builder)).start()
        # Certified export pins are tested by the existing source checks; isolate
        # this fixture to the post-build gates without a production export.
        self.source_check = patch.object(PREP, 'validate_source', return_value=self.expected).start()
        base, candidate, changed = PREP.verify_outputs(self.work, self.expected)
        self.inventory = {'baseline': base, 'candidate': candidate}
        (self.work / 'package-inventory.json').write_text(json.dumps(self.inventory))
        logs = {label: {'command': ['node', PREP.BUILDER], 'exit_code': 0, 'stdout': '', 'stderr': ''}
                for label in self.inventory}
        for label, log in logs.items():
            (self.work / (label + '-build.json')).write_text(json.dumps(log))
        summary = {'status': 'built_requires_browser_qa', 'production_deployment': PREP.DEPLOYMENT,
                   'build_completed_at_utc': '2026-11-08T20:00:00+00:00', 'builds': logs,
                   'files': len(candidate), 'changed': changed, 'artifact': None, 'artifact_sha256': None}
        (self.work / 'summary.json').write_text(json.dumps(summary))
        comparisons = []
        for viewport in ['desktop', 'mobile']:
            for name in pages:
                comparisons.append(dict.fromkeys([
                    'completed', 'passed', 'numbersIdentical', 'initialFormsControlsConsentContactIdentical',
                    'exercisedFormsControlsConsentContactIdentical', 'noNewPageErrors', 'consoleErrorsIdentical',
                    'remoteResourcesBlockedIdentically', 'noInitialHorizontalOverflow',
                    'noExercisedHorizontalOverflow', 'emptyCommercialFormsInvalid'], True)
                    | {'viewport': viewport, 'page': name})
        self.report = {'passed': True, 'sourceMode': 'packaged-static',
                       'startedAtUtc': '2026-11-08T20:01:00+00:00', 'completedAtUtc': '2026-11-08T20:02:00+00:00',
                       'staticRoots': {label: str(self.work / label / '.vercel/output/static') for label in self.inventory},
                       'htmlSha256': {label: {name: pair[index] for name, pair in pages.items()}
                                      for index, label in enumerate(self.inventory)},
                       'isolation': {'localStaticOnly': True, 'realSubmissions': False},
                       'comparisons': comparisons,
                       'cases': [{'page': name, 'version': label, 'viewport': {'width': width, 'height': height}, 'completed': True}
                                 for name in pages for label in self.inventory for width, height in [(1440, 1000), (390, 844)]]}
        self.qa = self.root / 'results.json'
        self.archive = self.work / 'sollahms-nine-copy.vercel-output.tar.gz'

    def finalize(self, report=None):
        self.qa.write_text(json.dumps(self.report if report is None else report))
        return PREP.finalize(self.source, self.work, self.qa)

    def test_missing_or_inappropriate_qa_cannot_create_an_archive(self):
        with self.assertRaisesRegex(ValueError, 'results file is required'):
            PREP.finalize(self.source, self.work, self.qa)
        changes = [lambda r: r.update(passed=False), lambda r: r.update(sourceMode='repository'),
                   lambda r: r['staticRoots'].update(candidate=str(self.repo)),
                   lambda r: r['htmlSha256']['candidate'].update({'index.html': 'wrong'}),
                   lambda r: r.update(startedAtUtc='2026-11-08T19:00:00+00:00'),
                   lambda r: r['comparisons'][0].update(numbersIdentical=False),
                   lambda r: r['cases'].pop(),
                   lambda r: r['isolation'].update(realSubmissions=True)]
        for change in changes:
            report = copy.deepcopy(self.report)
            change(report)
            with self.subTest(change=changes.index(change)), self.assertRaises(ValueError):
                self.finalize(report)
            self.assertFalse(self.archive.exists())

    def test_changed_inputs_or_outputs_cannot_be_archived(self):
        paths = ['baseline/release/static/assets/retained.js',
                 'candidate/.vercel/output/static/assets/retained.js',
                 'baseline/.vercel/output/config.json',
                 'candidate/' + PREP.BUILDER]
        for name in paths:
            path = self.work / name
            original = path.read_bytes()
            path.write_bytes(b'unapproved bytes')
            try:
                with self.subTest(path=name), self.assertRaises(ValueError):
                    self.finalize()
                self.assertFalse(self.archive.exists())
            finally:
                path.write_bytes(original)

    def test_runtime_injection_is_rejected_even_if_both_outputs_match(self):
        for label in self.inventory:
            path = self.work / label / '.vercel/output/static/internal-review.md'
            path.write_bytes(b'must never ship')
        with self.assertRaisesRegex(ValueError, 'path set changed'):
            self.finalize()
        self.assertFalse(self.archive.exists())

    def test_only_verified_runtime_bytes_are_archived_after_packaged_qa(self):
        (self.work / 'internal-note.md').write_text('private orchestration evidence')
        summary = self.finalize()
        self.source_check.assert_called_once_with(self.source)
        self.assertEqual(summary['status'], 'built_browser_qa_passed_requires_owner_authorization')
        self.assertEqual(summary['browser_qa']['sha256'], PREP.sha(self.qa))
        with tarfile.open(self.archive) as archive:
            members = archive.getmembers()
            self.assertEqual({member.name for member in members},
                             {'.vercel/output/' + name for name in self.inventory['candidate']})
            for member in members:
                name = member.name.removeprefix('.vercel/output/')
                self.assertEqual(digest(archive.extractfile(member).read()), self.inventory['candidate'][name])
                self.assertEqual((member.uid, member.gid, member.mtime), (0, 0, 0))
        first_hash = PREP.sha(self.archive)
        with self.assertRaises(ValueError):
            self.finalize()
        self.assertEqual(PREP.sha(self.archive), first_hash)


if __name__ == '__main__':
    unittest.main()
