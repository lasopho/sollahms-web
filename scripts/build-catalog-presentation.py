#!/usr/bin/env python3
"""Build the accessible directory and reuse existing, reviewed cover variants.

No download, conversion, catalogue mutation or publication decision occurs here.
The León variants keep the same protected Preview scope as their source images.
"""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads((ROOT / path).read_text())


def checked_asset(asset, prefix):
    path = asset['localPath']
    assert path.startswith(prefix) and '..' not in path
    target = ROOT / path.lstrip('/')
    assert target.is_file() and not target.is_symlink(), path
    data = target.read_bytes()
    assert len(data) == asset['bytes'], path + ': bytes'
    assert hashlib.sha256(data).hexdigest() == asset['sha256'], path + ': SHA-256'
    assert all(isinstance(asset[k], int) and asset[k] > 0 for k in ['width', 'height'])
    with Image.open(target) as image:
        assert image.size == (asset['width'], asset['height']), path + ': dimensions'
    return {k: asset[k] for k in ['localPath', 'width', 'height']}


def fragments():
    projects = read_json('data/proyectos.json')
    assert len(projects) == 134 and len({p['slug'] for p in projects}) == 134
    condition_targets = {}
    for project in projects:
        assert project['detalleUrl'] == '/' + project['slug'] + '.html'
        page = (ROOT / project['detalleUrl'].lstrip('/')).read_text()
        if 'id="proyecto"' not in page:
            # Featured layouts keep the commercial note within the main
            # content, whereas detalle-adicional is only gallery/surfaces.
            assert 'id="contenido-principal"' in page and 'price-commercial-note' in page
            condition_targets[project['slug']] = '#contenido-principal'
        target = condition_targets.get(project['slug'], '#proyecto')
        assert 'id="' + target[1:] + '"' in page
    # Every packaging profile retains these identities/routes. The directory
    # deliberately contains no prices, source documents or media references.
    directory = '\n'.join('    <li><a href="' + html.escape(p['detalleUrl'], quote=True) + '">' + html.escape(p['nombre']) + '</a></li>' for p in projects)
    directory = '''<!--CATALOG_DIRECTORY_START-->
<details id="catalog-static-directory" class="catalog-directory">
<summary>Explorar el listado de fichas de proyectos</summary>
<p>Consulta la información y los pendientes en cada ficha. El listado no acredita disponibilidad ni condiciones comerciales vigentes.</p>
<ul>
''' + directory + '''
</ul>
</details>
<!--CATALOG_DIRECTORY_END-->'''
    manifest = read_json('data/brochures-leon.json')
    assert manifest['protectedPreviewOnly'] is True
    research = {r['slug']: r for r in read_json('data/fichas-proyectos.json')}
    covers = {}
    for row in manifest['projects']:
        project = next(p for p in projects if p['slug'] == row['slug'])
        asset = next(a for a in row['images'] if a['localPath'] == project['imagenPrincipal'])
        retained = next(a for a in research[row['slug']]['images'] if a['localPath'] == asset['localPath'])
        assert asset == retained, row['slug'] + ': research/manifest binding'
        assert asset.get('visuallyVerified') is True
        prefix = '/assets/propiedades/leon/' + row['slug'] + '/'
        original = checked_asset(asset, prefix)
        variants = [checked_asset(v, prefix) for v in asset.get('variants', [])]
        # Two retained manifests list their original once again as a variant.
        variants = [v for v in variants if v['localPath'] != original['localPath']]
        assert variants and all(v['width'] < original['width'] for v in variants)
        assert len({v['width'] for v in [*variants, original]}) == len(variants) + 1
        for item in [*variants, original]:
            assert item['localPath'] in (ROOT / project['detalleUrl'].lstrip('/')).read_text()
        covers[row['slug']] = {**original, 'sources': sorted([*variants, original], key=lambda a: a['width'])}
    assert len(covers) == 5
    image_map = '    // CATALOG_COVERS_START\n    const coverVariants = ' + json.dumps(covers, ensure_ascii=False, indent=4) + ';\n    // CATALOG_COVERS_END'
    target_map = '    // CATALOG_CONDITION_TARGETS_START\n    const conditionTargets = ' + json.dumps(condition_targets, ensure_ascii=False, indent=4) + ';\n    // CATALOG_CONDITION_TARGETS_END'
    return directory, image_map, target_map


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'proyectos.html'
    before = path.read_text()
    directory, image_map, target_map = fragments()
    after, count = re.subn(r'<!--CATALOG_DIRECTORY_START-->[\s\S]*?<!--CATALOG_DIRECTORY_END-->', lambda _: directory, before)
    assert count == 1
    after, count = re.subn(r'    // CATALOG_COVERS_START[\s\S]*?    // CATALOG_COVERS_END', lambda _: image_map, after)
    assert count == 1
    after, count = re.subn(r'    // CATALOG_CONDITION_TARGETS_START[\s\S]*?    // CATALOG_CONDITION_TARGETS_END', lambda _: target_map, after)
    assert count == 1
    if args.check:
        assert after == before, 'Catalogue presentation is out of date; run this script without --check'
    else:
        path.write_text(after)
    print(json.dumps({'projects': 134, 'responsiveCovers': 5, 'newAssets': 0, 'downloads': 0, 'check': args.check}))


if __name__ == '__main__':
    main()
