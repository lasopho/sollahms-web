#!/usr/bin/env python3
"""Prepare a complete, bounded measurement candidate from certified Production.

No legacy generators, deployment, provider calls or secret access. The pending
homepage appearance candidate is an explicit dependency, not an approved release.
"""
import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_DEPLOYMENT = 'dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH'
BASE_INVENTORY_SHA256 = 'c4b1a07527291aa020ebef549aa32f0bb2f2858f9f55312482584f333b14319b'
CORPORATE_PAGES = ['index.html', 'agenda-asesoria.html', 'contacto.html', 'privacidad.html',
                   'comparador-hipotecario.html', 'trabaja-con-nosotros.html',
                   'guia-hipotecaria.html', 'cuando-comprar-propiedad.html',
                   'centro-orientacion.html', 'entorno-desarrollo-urbano.html',
                   'inversion-inmobiliaria-empresas.html', 'beneficios-tributarios-inmobiliarios.html']
CONTROLLERS = ['advisory.mjs', 'collaboration.mjs', 'orientacion.mjs', 'hipotecario.mjs']
ADDED = {'static/assets/branding/favicon.png', 'static/assets/js/site-measurement.mjs',
         'static/assets/css/site-measurement.css', 'static/data/site-measurement.json'}
CHANGED = {'static/sitemap.xml'} | {'static/' + name for name in CORPORATE_PAGES} | {
    'static/assets/js/' + name for name in CONTROLLERS}


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def inventory(root):
    files = {}
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlink in runtime artifact')
        if path.is_file():
            data = path.read_bytes()
            files[path.relative_to(root).as_posix()] = {
                'bytes': len(data), 'sha1': hashlib.sha1(data).hexdigest(), 'sha256': sha256(data)}
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-output', type=Path, required=True)
    parser.add_argument('--baseline-inventory', type=Path, required=True)
    parser.add_argument('--output-directory', type=Path, required=True)
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    baseline, output = args.baseline_output.resolve(), args.output_directory.resolve()
    if output.exists() or output.is_relative_to(ROOT) or output.is_relative_to(baseline):
        raise ValueError('Use a new private output outside checkout and baseline')
    raw = args.baseline_inventory.read_bytes()
    if sha256(raw) != BASE_INVENTORY_SHA256:
        raise ValueError('Unrecognized production inventory')
    before = inventory(baseline)
    if before != json.loads(raw)['files']:
        raise ValueError('Production baseline differs from its certificate')
    config = json.loads((ROOT / 'data/site-measurement.json').read_text())
    target = output / '.vercel/output'
    shutil.copytree(baseline, target)
    for relative in CHANGED | ADDED:
        source = ROOT / relative.removeprefix('static/')
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    after = inventory(target)
    added, removed = after.keys() - before.keys(), before.keys() - after.keys()
    changed = {key for key in before.keys() & after.keys() if before[key] != after[key]}
    if added != ADDED or removed or changed != CHANGED:
        raise ValueError('Unexpected artifact delta: ' + str((added, removed, changed)))
    sitemap_before = (baseline / 'static/sitemap.xml').read_bytes()
    privacy_old = b'<url><loc>https://sollahms.cl/privacidad.html</loc><lastmod>2026-10-25</lastmod></url>'
    privacy_new = privacy_old.replace(b'2026-10-25', b'2026-11-19')
    if sitemap_before.count(privacy_old) != 1 or (target / 'static/sitemap.xml').read_bytes() != sitemap_before.replace(privacy_old, privacy_new, 1):
        raise ValueError('Sitemap must preserve all entries except the real privacy modification date')
    manifest_bytes = (json.dumps({'productionBaseDeployment': BASE_DEPLOYMENT, 'files': after},
                                 sort_keys=True, indent=2) + '\n').encode()
    manifest_path = output.parent / (output.name + '-inventory.json')
    if manifest_path.exists():
        raise ValueError('Private manifest destination already exists')
    manifest_path.write_bytes(manifest_bytes)
    receipt = {
        'observedAtUTC': datetime.now(timezone.utc).isoformat(),
        'timezone': 'America/Santiago', 'baseDeployment': BASE_DEPLOYMENT,
        'baseInventorySHA256': BASE_INVENTORY_SHA256,
        'candidateInventorySHA256': sha256(manifest_bytes),
        'baseFiles': len(before), 'candidateFiles': len(after),
        'changed': [{'path': key, 'before': before[key], 'after': after[key]} for key in sorted(changed)],
        'added': [{'path': key, 'after': after[key]} for key in sorted(added)],
        'removed': [], 'unchangedFiles': len(before) - len(changed),
        'allSevenFunctionsAndConfigByteIdentical': True,
        'catalogue152FichesDocumentaryCenterByteIdentical': True,
        'robotsCommercialDataAndIntegrationFilesByteIdentical': True,
        'sitemapOnlyPrivacyLastmodChangedAllURLsAndExcludedEntriesPreserved': True,
        'appearancePR38DependencyRequiresApproval': True,
        'measurementConfiguration': config,
        'productionDeploymentPerformed': False, 'realProviderCalls': 0,
        'realFormSubmissions': 0, 'indexingRequests': 0,
        'method': 'Pinned complete current Production output with explicit corporate HTML, controller and measurement asset allowlists.'}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: receipt[key] for key in ('baseFiles', 'candidateFiles', 'unchangedFiles')}))


if __name__ == '__main__':
    main()
