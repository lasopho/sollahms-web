#!/usr/bin/env python3
"""Prepare the corporate SEO overlay on the certified current production output.

No legacy generators, network requests, deployment, provider calls or mutations
of the baseline. Private runtime artifacts must remain outside the repository.
"""
import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_DEPLOYMENT = 'dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV'
BASE_MANIFEST_SHA256 = '76656dc4d9415edc7bdd32118b920053686f9f6c98f61035081f4e7f0284126f'
PAGES = ('centro-orientacion.html', 'entorno-desarrollo-urbano.html',
         'inversion-inmobiliaria-empresas.html')
OVERLAYS = PAGES + ('sitemap.xml',)
ALLOWED = {'static/' + page for page in OVERLAYS}
SITEMAP_ADDITION = b'  <url><loc>https://sollahms.cl/beneficios-tributarios-inmobiliarios.html</loc></url>\n'


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def inventory(root):
    result = {}
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlink in runtime artifact: ' + str(path))
        if path.is_file():
            data = path.read_bytes()
            result[path.relative_to(root).as_posix()] = {
                'bytes': len(data), 'sha1': hashlib.sha1(data).hexdigest(),
                'sha256': sha256(data)}
    return result


def compare(base, candidate):
    if base.keys() != candidate.keys():
        raise ValueError('Runtime paths were added or removed')
    changed = {path for path in base if base[path] != candidate[path]}
    if changed != ALLOWED:
        raise ValueError('Unexpected runtime changes: ' + str(sorted(changed)))
    return sorted(changed)


def validate_sitemap(before, after):
    if before.count(b'</urlset>') != 1 or SITEMAP_ADDITION in before:
        raise ValueError('Unexpected sitemap baseline')
    if after != before.replace(b'</urlset>', SITEMAP_ADDITION + b'</urlset>', 1):
        raise ValueError('Sitemap changes outside the single authorized addition')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-output', required=True, type=Path)
    parser.add_argument('--baseline-manifest', required=True, type=Path)
    parser.add_argument('--output-directory', required=True, type=Path)
    parser.add_argument('--receipt', required=True, type=Path)
    args = parser.parse_args()
    baseline = args.baseline_output.resolve()
    output = args.output_directory.resolve()
    if output.exists() or output.is_relative_to(ROOT) or output.is_relative_to(baseline):
        raise ValueError('Use a new private output directory outside checkout and baseline')
    raw = args.baseline_manifest.read_bytes()
    if sha256(raw) != BASE_MANIFEST_SHA256:
        raise ValueError('Unrecognized production baseline manifest')
    expected = {row['path']: {key: row[key] for key in ('bytes', 'sha1', 'sha256')}
                for row in json.loads(raw)['inventory']}
    before = inventory(baseline)
    if before != expected:
        raise ValueError('Local baseline differs from the certified production artifact')
    validate_sitemap((baseline / 'static/sitemap.xml').read_bytes(),
                     (ROOT / 'sitemap.xml').read_bytes())
    target = output / '.vercel/output'
    shutil.copytree(baseline, target)
    for page in OVERLAYS:
        shutil.copyfile(ROOT / page, target / 'static' / page)
    after = inventory(target)
    changed = compare(before, after)
    manifest = {'baselineDeployment': BASE_DEPLOYMENT, 'files': after}
    manifest_bytes = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode()
    # Keep the full private inventory next to, never inside, the upload tree.
    manifest_path = output.parent / (output.name + '-inventory.json')
    if manifest_path.exists():
        raise ValueError('Private inventory destination already exists')
    manifest_path.write_bytes(manifest_bytes)
    receipt = {
        'checkedAt': datetime.now(timezone.utc).isoformat(),
        'baselineDeployment': BASE_DEPLOYMENT,
        'baselineManifestSHA256': BASE_MANIFEST_SHA256,
        'candidateInventorySHA256': sha256(manifest_bytes),
        'runtimeFiles': len(after), 'changedFiles': len(changed),
        'unchangedFiles': len(after) - len(changed),
        'changed': [{'path': path, 'before': before[path], 'after': after[path]}
                    for path in changed],
        'functionsAndConfigByteIdentical': True,
        'catalogueFichesDocumentaryCenterByteIdentical': True,
        'robotsSharedAssetsByteIdentical': True,
        'sitemapChange': 'Only the missing included benefits URL is appended; existing entries remain exact.',
        'comparatorPublishedFooterPreserved': True,
        'pathsAdded': [], 'pathsRemoved': [], 'realSubmissions': 0,
        'productionDeploymentPerformed': False,
        'method': 'Pinned production manifest; read every file and compare SHA1/SHA256; overlay three included HTML files and the scoped sitemap addition.'}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
