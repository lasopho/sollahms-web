"""Verify recovered PR #7 bytes and preservation of the current source tree."""
import hashlib
import json
from pathlib import Path
import subprocess
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

class EcasaRecovery(unittest.TestCase):
    def test_recovered_assets_match_git_and_decode(self):
        manifest = json.loads((ROOT / 'data/ecasa-pr7-recovery.json').read_text())
        self.assertEqual(len(manifest['assets']), 92)
        self.assertEqual(sum('/plano-' in a['path'] for a in manifest['assets']), 74)
        for asset in manifest['assets']:
            with self.subTest(path=asset['path']):
                path = ROOT / asset['path']
                data = path.read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), asset['sha256'])
                self.assertEqual(len(data), asset['bytes'])
                original = subprocess.check_output(['git', 'show', manifest['pr7Commit'] + ':' + asset['path']], cwd=ROOT)
                self.assertEqual(data, original)
                with Image.open(path) as image:
                    image.load()
                    self.assertEqual(image.size, (asset['width'], asset['height']))

    def test_owner_cover_provenance_and_preview_restriction(self):
        policy = json.loads((ROOT / 'data/ecasa-owner-cover.json').read_text())
        self.assertTrue(policy['protectedPreviewOnly'])
        self.assertEqual(len(policy['projects']), 5)
        for project in policy['projects']:
            selected = project['selected']
            path = ROOT / selected['localPath'].lstrip('/')
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), selected['sha256'])

    def test_preserve_main_commercial_data_and_deployment_gates(self):
        manifest = json.loads((ROOT / 'data/ecasa-pr7-recovery.json').read_text())
        for path in ['data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json', 'scripts/package-vercel.mjs']:
            expected = subprocess.check_output(['git', 'show', manifest['mainCommit'] + ':' + path], cwd=ROOT)
            self.assertEqual((ROOT / path).read_bytes(), expected)
        gates = json.loads((ROOT / 'vercel.json').read_text())['git']['deploymentEnabled']
        self.assertIs(gates['main'], False)
        self.assertIs(gates['codex/ecasa-recovery-20261020'], False)
