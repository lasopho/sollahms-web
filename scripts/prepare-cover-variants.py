#!/usr/bin/env python3
"""Prepare local catalogue-cover candidates outside Git worktrees; never publish.

Input is an explicitly reviewed shortlist, not a discovery rule or rights grant.
Pillow and libwebp versions must match the recipe. Originals remain untouched.
"""
import argparse
import hashlib
import io
import json
import re
import subprocess
from pathlib import Path, PurePosixPath

from PIL import Image, __version__ as PILLOW_VERSION, features


ASSET = re.compile(r'/assets/propiedades/(?:catalogo/[0-9a-f]{24}\.webp|'
                   r'distrito-centro/distrito-centro-hero\.webp|'
                   r'inn-puerto-chico-principal\.webp|suecia-principal\.webp)\Z')
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def git(root, *arguments):
    # Ambient Git overrides must not redirect worktree checks or tracked paths.
    import os
    environment = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    return subprocess.check_output(['git', '-C', str(root), *arguments],
                                   env=environment, stderr=subprocess.DEVNULL)


def no_symlinks(path):
    for part in [path, *path.parents]:
        require(not part.is_symlink(), 'Symbolic path component: ' + str(part))


def checked_output(root, output):
    require(output.is_absolute(), 'Output must be an explicit absolute path')
    require('..' not in output.parts, 'Output traversal is forbidden')
    no_symlinks(output)
    output = output.resolve()
    worktrees = [Path(line[9:]).resolve() for line in
                 git(root, 'worktree', 'list', '--porcelain').decode().splitlines()
                 if line.startswith('worktree ')]
    require(root in worktrees, 'Source root must be a registered Git worktree')
    for tree in worktrees:
        require(not output.is_relative_to(tree) and not tree.is_relative_to(output),
                'Output must be outside and disjoint from every registered worktree')
    # Also reject unrelated repositories/worktrees, not just this Git common dir.
    for part in [output, *output.parents]:
        if (part / '.git').exists():
            # Managed workspaces may contain empty, read-only .git sentinels.
            # A marker alone is not proof of a Git worktree; ask Git as well.
            try:
                git(part, 'rev-parse', '--show-toplevel')
            except subprocess.CalledProcessError:
                continue
            raise ValueError('Output is inside another Git worktree')
    require(not output.exists(), 'Output must be a new directory; overwriting is forbidden')
    return output


def prepare(root, shortlist, output):
    root = Path(root)
    require(root.is_absolute() and '..' not in root.parts, 'Source root must be canonical and absolute')
    no_symlinks(root)
    root = root.resolve(strict=True)
    output = checked_output(root, Path(output))
    recipe_bytes = Path(shortlist).read_bytes()
    recipe = json.loads(recipe_bytes)
    require(recipe.get('schemaVersion') == 1, 'Unknown shortlist schema')
    expected_encoding = {'pillowVersion': PILLOW_VERSION,
                         'webpVersion': features.version('webp'),
                         'quality': 82, 'method': 6, 'widths': [480, 960]}
    require(recipe.get('encoding') == expected_encoding,
            'Encoding recipe/version mismatch; review and pin Pillow/libwebp explicitly')
    rows = recipe.get('sources')
    require(isinstance(rows, list) and rows and
            type(recipe.get('expectedCount')) is int and
            len(rows) == recipe['expectedCount'], 'Shortlist count mismatch')
    require(len({r['slug'] for r in rows}) == len(rows), 'Duplicate shortlist slug')
    require(len({r['source']['path'] for r in rows}) == len(rows), 'Duplicate source path')
    verified = []
    for row in rows:
        require(isinstance(row['slug'], str) and SLUG.fullmatch(row['slug']), 'Unsafe slug')
        source = row['source']
        name = source['path']
        require(isinstance(name, str) and ASSET.fullmatch(name) and
                str(PurePosixPath(name)) == name and '..' not in PurePosixPath(name).parts,
                'Unsafe or out-of-scope source path')
        target = root / name[1:]
        no_symlinks(target)
        require(target.is_file() and target.resolve(strict=True).is_relative_to(root),
                'Source must be a regular file inside the worktree')
        require(git(root, 'ls-files', '--error-unmatch', '--', name[1:]).strip() == name[1:].encode(),
                'Source must already be tracked')
        data = target.read_bytes()
        require(type(source['bytes']) is int and len(data) == source['bytes'] and
                digest(data) == source['sha256'], 'Source bytes/hash mismatch: ' + name)
        committed = git(root, 'show', 'HEAD:' + name[1:])
        require(data == committed, 'Source must match its committed HEAD bytes: ' + name)
        source_blob = git(root, 'rev-parse', 'HEAD:' + name[1:]).decode().strip()
        require(all(type(source[k]) is int and source[k] > 0 for k in ['width', 'height']),
                'Invalid source dimensions')
        require(isinstance(row.get('inheritedScope'), dict) and row['inheritedScope'] and
                isinstance(row.get('provenance'), dict) and row['provenance'],
                'Explicit inherited scope and provenance are required')
        with Image.open(io.BytesIO(data)) as image:
            require(image.format == 'WEBP' and image.size == (source['width'], source['height']),
                    'Source format/dimensions mismatch: ' + name)
            require(not getattr(image, 'is_animated', False) and image.mode in ['RGB', 'RGBA'],
                    'Only static RGB/RGBA covers are supported')
            require(image.getexif().get(274, 1) == 1 and not image.info.get('icc_profile'),
                    'Orientation/color metadata needs separate review')
            require(image.width >= max(expected_encoding['widths']), 'Upscaling is forbidden')
            image.load()
            verified.append((row, target, data, image.copy(), source_blob))
    # Validate the entire batch before encoding or creating any output.
    manifest_rows, files = [], []
    for row, target, original_bytes, image, source_blob in verified:
        variants = []
        for width in expected_encoding['widths']:
            height = max(1, round(image.height * width / image.width))
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            resized.save(buffer, 'WEBP', quality=82, method=6, lossless=False, exact=True)
            data = buffer.getvalue()
            relative = 'assets/' + row['slug'] + '-' + str(width) + '.webp'
            variants.append({'candidatePath': relative, 'width': width, 'height': height,
                             'bytes': len(data), 'sha256': digest(data),
                             'savedBytesVsOriginal': len(original_bytes) - len(data)})
            files.append((relative, data))
        manifest_rows.append({**row, 'sourceBlob': source_blob,
                              'sourceMatchesHead': True, 'variants': variants})
        require(target.read_bytes() == original_bytes, 'Source changed during preparation')
    total = sum(row['source']['bytes'] for row in manifest_rows)
    selected = {str(width): sum(next(a['bytes'] for a in row['variants'] if a['width'] == width)
                               for row in manifest_rows) for width in expected_encoding['widths']}
    manifest = {'schemaVersion': 1, 'shortlistSha256': digest(recipe_bytes),
                'sourceHead': git(root, 'rev-parse', 'HEAD').decode().strip(),
                'encoding': expected_encoding, 'sourceCount': len(rows),
                'publicationAuthorized': False, 'runtimeIntegrated': False,
                'visualAcceptance': 'pending', 'fieldPerformanceMeasured': False,
                'limitations': ['Local candidate files only; inherited scope is copied verbatim.',
                                'Encoder quality 82 is not a visual acceptance result.',
                                'Byte totals select one candidate per source at a fixed width; '
                                'they are not browser currentSrc, LCP, CDN or field results.'],
                'sources': manifest_rows, 'totals': {'originalBytes': total,
                'selectedCandidateBytesByWidth': selected,
                'savedBytesByWidth': {w: total - value for w, value in selected.items()},
                'savedPercentByWidth': {w: round(100 * (total - value) / total, 3)
                                       for w, value in selected.items()}}}
    output.mkdir(parents=True, exist_ok=False)
    (output / 'assets').mkdir()
    for relative, data in files:
        (output / relative).write_bytes(data)
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False,
                                                   sort_keys=True, indent=2) + '\n')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--shortlist', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    manifest = prepare(args.root, args.shortlist, args.output)
    print(json.dumps({'sources': manifest['sourceCount'], 'output': str(args.output),
                      'runtimeIntegrated': False, 'totals': manifest['totals']}))


if __name__ == '__main__':
    main()
