"""Project the authorized Norte Verde successor for historical developer audits.

The dedicated Norte Verde tests validate the real seventeen PDF fiches. This
adapter retains every other current row and verifies its independent baseline.
"""
import copy
import functools
import hashlib
import importlib.util
import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE_BYTES = (ROOT / 'data/norte-verde-baseline.json').read_bytes()
assert hashlib.sha256(BASELINE_BYTES).hexdigest() == '2874865cb1ba9f323c1ed669eb673548776877d34927e21fd83887beaea3ec23'
BASELINE = json.loads(BASELINE_BYTES)
SLUGS = {row['slug'] for row in BASELINE['projects']}


@functools.lru_cache(maxsize=None)
def baseline_bytes(path):
    return subprocess.check_output(['git', 'show', BASELINE['commit'] + ':' + path], cwd=ROOT)


def original_data(rows, path):
    if len(rows) != 134:
        return rows
    old_rows = BASELINE['projects'] if path == 'data/proyectos.json' else [row for row in json.loads(baseline_bytes(path)) if row['slug'] in SLUGS]
    others = {row['slug']: row for row in rows if row['slug'] not in SLUGS}
    assert len(others) == 117, path + ': other developer identities changed'
    expected = {row['slug']: row for row in json.loads(baseline_bytes(path)) if row['slug'] not in SLUGS}
    assert others == expected, path + ': all 117 other developer rows must stay exact'
    others.update({row['slug']: copy.deepcopy(row) for row in old_rows})
    return [others[slug] for slug in BASELINE['catalogueOrder']]


def original_context(data):
    text = data.decode()
    pattern = r'(export const projects = Object\.freeze\()([\s\S]*?)(\);)'
    match = re.search(pattern, text)
    if not match:
        return data
    contexts = json.loads(match[2])
    if len(contexts) != 134:
        return data
    previous_text = baseline_bytes('lib/project-context.mjs').decode()
    previous = json.loads(re.search(pattern, previous_text)[2])
    assert {slug: value for slug, value in contexts.items() if slug not in SLUGS} == {slug: value for slug, value in previous.items() if slug not in SLUGS}
    return (text[:match.start(2)] + json.dumps(previous, ensure_ascii=False, indent=2) + text[match.end(2):]).encode()


def original_html(text):
    match = re.search(r'/assets/brochures/norte-verde/([a-z0-9-]+)\.pdf', text)
    if match and match[1] in SLUGS:
        return baseline_bytes(match[1] + '.html').decode()
    return text


def historical_file(path, data):
    slug = path.removesuffix('.html')
    if path.endswith('.html') and slug in SLUGS:
        return baseline_bytes(path)
    if path == 'lib/project-context.mjs':
        return original_context(data)
    if path == 'scripts/package-vercel.mjs':
        assert hashlib.sha256(data).hexdigest() == '2725cc7297f3601d97a0bebd94c1ab2204ea1a4451428de9be3f45959ed43c97', 'Only the independently pinned Preview-only Norte Verde packager may extend the historical publication code'
        return baseline_bytes(path)
    if path == 'vercel.json':
        configuration = json.loads(data)
        gates = configuration.get('git', {}).get('deploymentEnabled', {})
        if 'codex/norte-verde-cartera-definitiva' in gates:
            assert gates['codex/norte-verde-cartera-definitiva'] is False
            expected = json.loads(baseline_bytes(path))
            expected['git']['deploymentEnabled']['codex/norte-verde-cartera-definitiva'] = False
            assert data == (json.dumps(expected, ensure_ascii=False, indent=2) + '\n').encode(), 'Only the exact Norte Verde manual Preview gate may extend the historical configuration'
            del gates['codex/norte-verde-cartera-definitiva']
            return (json.dumps(configuration, ensure_ascii=False, indent=2) + '\n').encode()
    return data


def read_historical_file(path):
    """Read retired NV fixtures without touching any other current page."""
    if path.endswith('.html') and path.removesuffix('.html') in SLUGS:
        return baseline_bytes(path)
    return (ROOT / path).read_bytes()


@functools.lru_cache(maxsize=1)
def historical_renderer():
    spec = importlib.util.spec_from_loader('norte_verde_historical_details', loader=None)
    module = importlib.util.module_from_spec(spec)
    module.__file__ = str(ROOT / 'scripts/build-project-details.py')
    exec(compile(baseline_bytes('scripts/build-project-details.py'), module.__file__, 'exec'), module.__dict__)
    return module


def render_historical_fiche(current_renderer, project, record, template):
    """Exercise the archived NV fixture and current renderer for all others."""
    renderer = historical_renderer() if project['slug'] in SLUGS else current_renderer
    return renderer.render(project, record, template)
