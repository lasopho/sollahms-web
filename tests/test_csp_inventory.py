"""Bounded synthetic safety/byte tests; no browser, network or policy activation."""
import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('csp_inventory', ROOT / 'scripts/inventory-csp.py')
CSP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CSP)


class CSPInventoryTests(unittest.TestCase):
    def fixture(self, files):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        for name, value in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(value if isinstance(value, bytes) else value.encode('utf-8'))
        return root

    def test_inline_hash_matches_browser_preprocessed_utf8_without_entity_decoding(self):
        body = '\r\nconst s = "&amp;&#39;é";\r\n//x\r\x00'
        root = self.fixture({'index.html': ('<SCRIPT type="module">' + body + '</SCRIPT>').encode('utf-8')})
        result = CSP.prepare_inventory(root)
        normalized = '\nconst s = "&amp;&#39;é";\n//x\n\ufffd'
        expected = "'sha256-" + base64.b64encode(hashlib.sha256(normalized.encode('utf-8')).digest()).decode('ascii') + "'"
        row = result['inlineScripts'][0]
        self.assertEqual(row['cspSource'], expected)
        self.assertEqual(row['bodyUtf8Bytes'], len(normalized.encode('utf-8')))
        self.assertEqual(result['files'][0]['sha256'], hashlib.sha256((root / 'index.html').read_bytes()).hexdigest())
        self.assertIn(expected, result['proposal']['perRouteCandidates'][0]['headerValueCandidate'])

    def test_attributes_decode_entities_once_and_canonical_navigation_does_not_widen_policy(self):
        root = self.fixture({'index.html': '<link rel="canonical" href="https://nav.example/page">'
                            '<script src="https://code.example/x.js?a=1&amp;b=2"></script>'
                            '<link rel="stylesheet" href="https://css.example/f?a=1&amp;amp;b=2">'
                            '<a href="https://other.example/">Link</a>'})
        result = CSP.prepare_inventory(root)
        urls = {row.get('url') for row in result['references']}
        self.assertIn('https://code.example/x.js?a=1&b=2', urls)
        self.assertIn('https://css.example/f?a=1&amp;b=2', urls)
        self.assertEqual(result['externalOriginCandidates']['script'], ['https://code.example'])
        self.assertNotIn('https://nav.example', json.dumps(result['externalOriginCandidates']))
        self.assertNotIn('https://other.example', json.dumps(result['externalOriginCandidates']))

    def test_data_scripts_and_external_bodies_are_recorded_without_authorizing_them_as_inline_code(self):
        root = self.fixture({'index.html': '<script type="application/ld+json">{"name":"a"}</script>'
                            '<script src="https://code.example/app.js">ignored()</script>'
                            '<script type=" TEXT/JAVASCRIPT ">run()</script><script src="">alsoIgnored()</script>'})
        result = CSP.prepare_inventory(root)
        policy = result['proposal']['perRouteCandidates'][0]['headerValueCandidate']
        rows = result['inlineScripts']
        self.assertEqual(rows[0]['executionKind'], 'data-or-unrecognized-type')
        self.assertNotIn(rows[0]['cspSource'], policy)
        self.assertNotIn(rows[1]['cspSource'], policy)
        self.assertIn(rows[2]['cspSource'], policy)
        self.assertNotIn(rows[3]['cspSource'], policy)
        self.assertTrue(rows[3]['hasSrc'])
        self.assertEqual(rows[2]['executionKind'], 'executable')
        self.assertIn('unfetched-external-script', {i['code'] for i in result['issues']})

    def test_html_end_script_sequence_and_unclosed_body_are_not_silently_certified(self):
        root = self.fixture({'index.html': '<script>const x="</script>";</script><script>notClosed()'})
        result = CSP.prepare_inventory(root)
        self.assertEqual(len(result['inlineScripts']), 1)
        self.assertEqual(result['inlineScripts'][0]['cspSource'], CSP.csp_hash('const x="'))
        self.assertIn('unclosed-raw-element', {i['code'] for i in result['issues']})
        self.assertFalse(result['proposal']['readyToApply'])
        malformed = CSP.prepare_inventory(self.fixture({'index.html': '<script/>ambiguous()'}))
        self.assertEqual(malformed['inlineScripts'], [])
        self.assertIn('self-closing-raw-element', {i['code'] for i in malformed['issues']})
        ambiguous = CSP.prepare_inventory(self.fixture({'index.html': '<script><!--<script>foo</script>bar</script>'}))
        self.assertIsNone(ambiguous['inlineScripts'][0]['cspSource'])
        self.assertIn('ambiguous-script-tokenization', {i['code'] for i in ambiguous['issues']})

    def test_module_graph_tracks_literal_requests_and_marks_computed_runtime_uncertainty(self):
        root = self.fixture({'index.html': '<script type="module" src="/js/main.mjs"></script>',
                            'js/main.mjs': "import {\nx\n} from './child.mjs'; import('./lazy.mjs'); fetch(target); document.createElement('script').src = value;",
                            'js/child.mjs': "fetchImpl('https://api.example/check'); export {x} from './value.mjs';",
                            'js/value.mjs': 'export const x=1;', 'js/lazy.mjs': "fetch('/api/test')"})
        result = CSP.prepare_inventory(root)
        self.assertEqual(result['externalOriginCandidates']['connect'], ['https://api.example'])
        self.assertEqual(result['proposal']['perRouteCandidates'][0]['reachableStaticFiles'],
                         ['index.html', 'js/child.mjs', 'js/lazy.mjs', 'js/main.mjs', 'js/value.mjs'])
        codes = {i['code'] for i in result['issues']}
        self.assertTrue({'runtime-request', 'dynamic-import', 'dynamic-script-loader', 'runtime-resource-assignment'} <= codes)
        self.assertFalse(result['execution']['javascriptExecuted'])

    def test_css_resources_inline_styles_frames_forms_and_hints_have_separate_kinds(self):
        root = self.fixture({'index.html': '<link rel="stylesheet" href="/styles/main.css">'
                            '<style>.hero{background:url(https://img.example/hero.webp)}</style>'
                            '<p style="background:url(/local.webp)">x</p>'
                            '<iframe src="https://frames.example/tour" srcdoc="&lt;p&gt;x&lt;/p&gt;"></iframe>'
                            '<button data-embed-src="https://lazy.example/tour" formaction="https://forms.example/send">x</button>'
                            '<link rel="preconnect" href="https://hint.example"><embed src="https://plugin.example/x">'
                            '<meta http-equiv="Content-Security-Policy" content="default-src none"><meta charset="iso-8859-1">',
                            'styles/main.css': '/* url(https://comment.example/x) */ @import "./nested.css"; @import url(https://css.example/app.css); @font-face{src:url(https://font.example/a.woff2)}',
                            'styles/nested.css': '.a{background:url("https://img.example/a.png")}'})
        result = CSP.prepare_inventory(root)
        self.assertEqual(result['externalOriginCandidates']['font'], ['https://font.example'])
        self.assertEqual(result['externalOriginCandidates']['style'], ['https://css.example'])
        self.assertNotIn('https://css.example', result['externalOriginCandidates']['img'])
        self.assertEqual(result['externalOriginCandidates']['frame'], ['https://frames.example', 'https://lazy.example'])
        self.assertEqual(result['externalOriginCandidates']['form'], ['https://forms.example'])
        self.assertEqual(result['externalOriginCandidates']['connect'], ['https://hint.example'])
        self.assertNotIn('https://plugin.example', result['externalOriginCandidates']['media'])
        self.assertNotIn('comment.example', json.dumps(result['references']))
        self.assertEqual(len(result['inlineStyles']), 1)
        self.assertTrue({'inline-style-attribute', 'iframe-srcdoc', 'embed-element', 'existing-document-csp', 'meta-charset-unverified'} <= {i['code'] for i in result['issues']})

    def test_malformed_urls_and_obfuscated_javascript_do_not_become_allowlist_sources(self):
        invalid = ['https://user:secret@example.test/x', 'https://[broken/', 'https://example.test:70000/x',
                   'https://example.test:bad/x', 'https://exa mple.test/x', 'https:\\example.test/x', '///ambiguous.test/x']
        for value in invalid:
            self.assertEqual(CSP.classify_url(value, 'index.html')['disposition'], 'invalid', value)
        root = self.fixture({'index.html': '<a href="java&#x09;script:run()" onclick="go()">x</a>'})
        result = CSP.prepare_inventory(root)
        self.assertEqual(result['summary']['eventHandlers'], 1)
        self.assertIn('javascript-url', {i['code'] for i in result['issues']})
        self.assertNotIn('run()', json.dumps(result))
        self.assertNotIn('unsafe-hashes', result['proposal']['perRouteCandidates'][0]['headerValueCandidate'])

    def test_url_traversal_never_reads_outside_input_and_nested_relative_resources_stay_local(self):
        root = self.fixture({'index.html': '<script src="../secret.js"></script><script src="/%2e%2e/secret.js"></script>'
                            '<script src="/%252e%252e/secret.js"></script><script src="/js/start.js"></script>',
                            'js/start.js': "import '../shared.js';", 'shared.js': 'safe();'})
        result = CSP.prepare_inventory(root)
        self.assertEqual(sorted(row['path'] for row in result['files']), ['index.html', 'js/start.js', 'shared.js'])
        self.assertEqual(sum(i['code'] == 'invalid-url' for i in result['issues']), 3)
        self.assertEqual(CSP.classify_url('../shared.js', 'js/start.js')['path'], 'shared.js')

    def test_symlinked_html_or_local_dependency_and_artifact_directory_are_rejected(self):
        root = self.fixture({'index.html': '<script src="/js/alias.js"></script>', 'js/real.js': 'safe();'})
        (root / 'js/alias.js').symlink_to(root / 'js/real.js')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            CSP.prepare_inventory(root)
        (root / 'js/alias.js').unlink()
        (root / 'linked').symlink_to(root / 'js', target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            CSP.prepare_inventory(root, 'artifact')

    def test_source_and_artifact_scopes_are_explicit_and_profile_label_is_never_certification(self):
        root = self.fixture({'index.html': '<h1>Root</h1>', 'docs/archive.html': '<h1>Archive</h1>'})
        source = CSP.prepare_inventory(root, 'source', 'production')
        artifact = CSP.prepare_inventory(root, 'artifact', 'production')
        self.assertEqual(source['summary']['htmlRoutes'], 1)
        self.assertEqual(artifact['summary']['htmlRoutes'], 2)
        for result in (source, artifact):
            self.assertEqual(result['scope']['declaredProfileLabel'], 'production')
            self.assertFalse(result['scope']['profileVerified'])
            self.assertFalse(result['scope']['artifactProvenanceVerified'])
            self.assertFalse(result['scope']['deployedBytesVerified'])
            self.assertFalse(result['proposal']['readyToApply'])

    def test_inventory_is_deterministic_and_protocol_relative_is_not_guessed(self):
        files = {'z.html': '<img srcset="https://images.example/a.png 1x, /b.png 2x">',
                 'index.html': '<script src="//code.example/x.js"></script><img src="data:image/png;base64,AA==">'}
        first = CSP.prepare_inventory(self.fixture(files))
        second = CSP.prepare_inventory(self.fixture(dict(reversed(list(files.items())))))
        self.assertEqual(json.dumps(first, sort_keys=True), json.dumps(second, sort_keys=True))
        self.assertEqual(first['externalOriginCandidates']['script'], [])
        self.assertIn('protocol-relative-url', {i['code'] for i in first['issues']})
        self.assertIn('data:', first['proposal']['perRouteCandidates'][0]['headerValueCandidate'])
        self.assertEqual(CSP.classify_url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E", 'index.html')['disposition'], 'data')
        self.assertIsNone(first['proposal']['reportingEndpoint'])

    def test_output_is_new_and_outside_both_input_tree_and_repository(self):
        root = self.fixture({'index.html': '<h1>x</h1>'})
        result = CSP.prepare_inventory(root)
        for target in (root / 'inventory.json', ROOT / 'inventory.json'):
            with self.assertRaisesRegex(ValueError, 'outside'):
                CSP.write_output(target, result, root)
        destination = self.fixture({}) / 'result.json'
        CSP.write_output(destination, result, root)
        self.assertEqual(json.loads(destination.read_text()), result)
        with self.assertRaises(FileExistsError):
            CSP.write_output(destination, result, root)


if __name__ == '__main__':
    unittest.main()
