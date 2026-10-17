"""Cached test-only bridge before immutable historical P2 assertions.

Only explicitly scoped current files enter the strict JavaScript composition.
Already-projected historical inputs remain untouched for their original pins.
No validation exception is caught or converted to a successful projection.
"""
import base64
import functools
import json
import os
from pathlib import Path
import shutil
import subprocess
from p2_embed_scope import SCOPE

ROOT = Path(__file__).resolve().parents[1]
NODE = os.environ.get('SOLLAHMS_CI_NODE') or shutil.which('node')
MEDIA_SCOPE = json.loads((ROOT / 'tests/p2-media-scope.json').read_text())['files']
P2_PATHS = frozenset(SCOPE) | frozenset(MEDIA_SCOPE) | {
    'proyectos.html', 'assets/js/purchase-capacity.mjs', 'assets/js/purchase-capacity-ui.mjs',
    'privacidad.html', 'assets/css/project-detail.css', 'assets/css/project-embeds.css',
}
BRIDGE = """
import { readFileSync } from 'node:fs';
import { projectP2File } from './tests/p2-preservation.mjs';
import { projectP2MediaFile } from './tests/p2-media-scope.mjs';
const request = JSON.parse(readFileSync(0, 'utf8'));
const project = request.kind === 'media' ? projectP2MediaFile : projectP2File;
process.stdout.write(project(request.path, Buffer.from(request.bytes, 'base64')).toString('base64'));
"""


@functools.lru_cache(maxsize=512)
def restore_p2_file(path, data):
    if path not in P2_PATHS:
        return data
    output = subprocess.check_output([NODE, '--input-type=module', '-e', BRIDGE], cwd=ROOT,
        input=json.dumps({'path': path, 'bytes': base64.b64encode(data).decode()}).encode())
    return base64.b64decode(output)


@functools.lru_cache(maxsize=512)
def restore_p2_media_file(path, data):
    if path not in MEDIA_SCOPE:
        return data
    output = subprocess.check_output([NODE, '--input-type=module', '-e', BRIDGE], cwd=ROOT,
        input=json.dumps({'kind': 'media', 'path': path, 'bytes': base64.b64encode(data).decode()}).encode())
    return base64.b64decode(output)


@functools.lru_cache(maxsize=512)
def restore_current_p2_file(path, data):
    if path not in P2_PATHS:
        return data
    current_path = ROOT / path
    if current_path.is_file() and data == current_path.read_bytes():
        return restore_p2_file(path, data)
    return data
