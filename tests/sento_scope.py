"""Sento projection for historical developer audits without changing their pins.

Use the shared publication validator before restoring the seven successor rows.
Calling Node also preserves JavaScript canonical-number hashing exactly. Real
Sento tests independently validate the current source and all 130 other fiches.
"""
import base64
import functools
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NODE = os.environ.get('SOLLAHMS_CI_NODE') or shutil.which('node') or '/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
SLUGS = {'angamos', 'curico-77', 'domeyko-2055', 'jofre-135', 'mirador-la-florida', 'plaza-las-condes', 'san-ignacio'}
BRIDGE = """
import { readFileSync } from 'node:fs';
import { restoreSentoRows, projectSentoFile } from './scripts/sento-publication.mjs';
const request = JSON.parse(readFileSync(0, 'utf8'));
if (request.kind === 'rows') {
  process.stdout.write(JSON.stringify(restoreSentoRows(request.rows, request.path)));
} else {
  process.stdout.write(projectSentoFile(request.path, Buffer.from(request.bytes, 'base64')).toString('base64'));
}
"""


def original_data(rows, path='data/proyectos.json'):
    output = subprocess.check_output([NODE, '--input-type=module', '-e', BRIDGE], cwd=ROOT,
        input=json.dumps({'kind': 'rows', 'path': path, 'rows': rows}, ensure_ascii=False).encode())
    restored = {row['slug']: row for row in json.loads(output)}
    # The JavaScript bridge validates seven exact successor hashes. Retain
    # Python's original number representation for every foreign row so a
    # dated Python canonical digest cannot change 2715.0 into 2715.
    originals = json.loads((ROOT / 'data/sento-baseline.json').read_text())['originalRows'][path]
    original_by_slug = {row['slug']: row for row in originals}
    assert all(restored[slug] == original_by_slug[slug] for slug in SLUGS)
    return [original_by_slug[row['slug']] if row['slug'] in SLUGS else row for row in rows]


@functools.lru_cache(maxsize=256)
def historical_file(path, data):
    if path not in {'data/proyectos.json', 'data/fichas-proyectos.json', 'data/registro-fichas.json',
                    'lib/project-context.mjs', 'vercel.json', 'scripts/package-vercel.mjs',
                    'scripts/norte-verde-publication.mjs'} and path.removesuffix('.html') not in SLUGS:
        return data
    output = subprocess.check_output([NODE, '--input-type=module', '-e', BRIDGE], cwd=ROOT,
        input=json.dumps({'kind': 'bytes', 'path': path, 'bytes': base64.b64encode(data).decode()}).encode())
    return base64.b64decode(output)


def original_html(text):
    matches = re.findall(r'/assets/(?:propiedades/sento/([a-z0-9-]+)/|brochures/sento/([a-z0-9-]+)\.pdf)', text)
    slugs = {left or right for left, right in matches if (left or right) in SLUGS}
    if len(slugs) == 1:
        # Never let an arbitrary page carrying a Sento resource bypass its
        # exact approved HTML hash before recovering the historical policy.
        historical_file(next(iter(slugs)) + '.html', text.encode())
        # Reconstruct the exact approved automatic/embed/map policy boundary
        # for the historical identity; never restart a later validation stage.
        from map_cleanup_scope import expected_cleanup_file
        return expected_cleanup_file(next(iter(slugs)) + '.html').decode()
    return text
