#!/usr/bin/env python3
"""Create a deterministic PRIVATE source bundle for the protected web review.

No original PDF, contract, candidate, environment file or Git directory enters
the bundle. It includes the exact selected derivatives, so materialization is
not a build dependency. This command does not upload or deploy anything.
"""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MEDIA_FOLDERS = ('aj-urbana-preview', 'ingevec-preview')
MANIFESTS = ('brochures-aj-urbana.json', 'brochures-ingevec.json')
PUBLIC_EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.svg', '.webp',
                     '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.txt', '.xml'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def selected_source_files(root):
    catalogue = json.loads((root / 'data/proyectos.json').read_text())
    assert len(catalogue) == 148 and len({p['slug'] for p in catalogue}) == 148
    assert not {'los-alerces', 'valle-los-ingleses-iii'} & {p['slug'] for p in catalogue}
    media = {}
    for name in MANIFESTS:
        manifest = json.loads((root / 'data' / name).read_text())
        for record in manifest['projects']:
            for asset in [*record['images'], *(m['plan'] for m in record['models'])]:
                path = asset['localPath'].lstrip('/')
                assert path not in media
                media[path] = asset['sha256']
    assert len(media) == 140, 'The complete selected brochure batch is required'
    files = set(media)
    files.update(p.name for p in root.glob('*.html'))
    assert not {'los-alerces.html', 'valle-los-ingleses-iii.html'} & files
    files.update(('vercel.json', 'robots.txt', 'sitemap.xml', 'data/proyectos.json',
                  'data/hipotecario.json', *(f'data/{name}' for name in MANIFESTS),
                  'scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs'))
    for folder in ('api', 'lib'):
        files.update(str(p.relative_to(root)) for p in (root / folder).rglob('*')
                     if p.is_file() and p.suffix in {'.js', '.mjs'})
    for path in (root / 'assets').rglob('*'):
        relative = str(path.relative_to(root))
        if not path.is_file() or '/brochure-candidates/' in relative:
            continue
        if any(f'/propiedades/{folder}/' in relative for folder in MEDIA_FOLDERS):
            continue  # Only the exact manifest above can select these assets.
        if path.suffix.lower() in PUBLIC_EXTENSIONS:
            files.add(relative)
    for relative in sorted(files):
        path = root / relative
        assert path.is_file() and path.resolve() == path, f'Nonregular or symbolic source: {relative}'
        assert path.suffix.lower() in PUBLIC_EXTENSIONS
        assert '..' not in Path(relative).parts and not relative.startswith('.')
        if relative in media:
            assert sha(path.read_bytes()) == media[relative], f'Changed selected media: {relative}'
    return sorted(files)


def archive_bytes(root, files):
    output = io.BytesIO()
    with gzip.GzipFile(fileobj=output, mode='wb', filename='', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w', format=tarfile.USTAR_FORMAT) as archive:
            for name in files:
                data = (root / name).read_bytes()
                info = tarfile.TarInfo(name)
                info.size, info.mode, info.mtime = len(data), 0o644, 0
                info.uid = info.gid = 0
                info.uname = info.gname = ''
                archive.addfile(info, io.BytesIO(data))
    return output.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-directory', required=True, type=Path)
    parser.add_argument('--node', default=shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Node is required to verify the source package'
    destination = args.output_directory.expanduser().resolve()
    assert destination != ROOT and ROOT not in destination.parents, 'Bundle must remain outside public source'
    destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(destination, 0o700)
    files = selected_source_files(ROOT)
    inventory = [{'file': name, 'size': (ROOT / name).stat().st_size,
                  'sha256': sha((ROOT / name).read_bytes())} for name in files]
    with tempfile.TemporaryDirectory(prefix='sollahms-reproducible-review-') as temporary:
        stage = Path(temporary)
        for name in files:
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        env = dict(os.environ, VERCEL_ENV='preview',
                   VERCEL_GIT_COMMIT_REF='codex/integracion-financiera-sollahms')
        env.pop('SOLLAHMS_BROCHURE_PROFILE', None)
        subprocess.run([args.node, str(stage / 'scripts/package-vercel.mjs')],
                       cwd=stage, env=env, check=True, stdout=subprocess.PIPE)
        receipt = json.loads((stage / '.vercel/brochure-build-inventory.json').read_text())
        assert len(receipt['media']) == 140
        public_inventory = [{'file': str(p.relative_to(stage / 'dist')), 'sha256': sha(p.read_bytes())}
                            for p in sorted((stage / 'dist').rglob('*')) if p.is_file()]
        data = archive_bytes(stage, files)
    archive = destination / 'source.tgz'
    archive.write_bytes(data)
    chunks = []
    size = 2 * 1024 * 1024
    for index, start in enumerate(range(0, len(data), size), 1):
        fragment = data[start:start + size]
        target = destination / f'source.tgz.part{index}'
        target.write_bytes(fragment)
        chunks.append({'file': f'.vercel/source.tgz.part{index}', 'privatePath': str(target),
                       'sha': hashlib.sha1(fragment).hexdigest(), 'sha256': sha(fragment), 'size': len(fragment)})
    metadata = {'transport': 'native_source_archive', 'target': 'preview',
                'branch': 'codex/integracion-financiera-sollahms',
                'contractualCoverageVerified': receipt['contractualCoverageVerified'],
                'sourceFileCount': len(files), 'sourceBytes': sum(f['size'] for f in inventory),
                'archive': {'privatePath': str(archive), 'sha256': sha(data), 'size': len(data)},
                'chunks': chunks, 'files': inventory, 'publicOutput': public_inventory,
                'selectedBrochureMedia': receipt['media']}
    (destination / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    for path in destination.iterdir():
        if path.is_file():
            os.chmod(path, 0o600)
    print(json.dumps({'sourceFiles': len(files), 'selectedBrochureMedia': len(receipt['media']),
                      'archiveSha256': sha(data), 'archiveBytes': len(data),
                      'contractualCoverageVerified': receipt['contractualCoverageVerified'],
                      'uploaded': False}))


if __name__ == '__main__':
    main()
