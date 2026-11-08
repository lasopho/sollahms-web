#!/usr/bin/env python3
"""Build only the certified frozen release locally. No deploy or provider calls.

Requires an exact, complete source export of the identified production release.
The original production builder is copied unchanged; this is only an orchestrator.
All runtime files and archives remain outside Git. Does not regenerate any page.
"""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile

REPO = Path(__file__).resolve().parents[1]
DEPLOYMENT = 'dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ'
REGISTRY_SHA256 = '9dd43786ed065db694712cdaed938362035aaef2c5a8f368d11a8c0b571a94a8'
BUILDER = 'prepare-orientation-production.mjs'
BUILDER_SHA256 = 'b8c4f84614ca6ed942973811ae2a6f264d13053929f7a49bd06bb7a4fbfcaff0'
PAGES = {
    'index.html': ('2347ce6574671d599505a9c63ef1263d0e464ca93596396138d79d4046829928', '5814adbcb6733a3ff705bff11804ca46757b74ed079ca67e294151887be49d7e'),
    'centro-orientacion.html': ('adf54bd3956beb68e0840b20c916384c1cc8a6af6be85c463b85905d05a5357c', '2a7eacf5f5e335e89910f0a461f8904befd87033d3a937260b782c97c6a7d6d4'),
    'guia-hipotecaria.html': ('651a25d181f3af8f582e7578f717006a28530825e7e0436003008aaedb1e8e6d', 'b86208c5b19380be10af60855efeb810625b867313d05514de8389584eaa9178'),
    'comparador-hipotecario.html': ('35b7d59be0f797db5d1816626cb8920b76ef4541c5134680c112eef788669ffc', '3b3635e7098cea83b84c486eb091b0c0116e33647412c852f40bd17e163e7b02'),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def inventory(root):
    files = {}
    for path in sorted(root.rglob('*')):
        require(not path.is_symlink(), f'Symlink forbidden: {path}')
        if path.is_file():
            files[path.relative_to(root).as_posix()] = sha(path)
        else:
            require(path.is_dir(), f'Unsupported file: {path}')
    return files


def validate_source(source):
    registry = source / 'orientation-output-hashes.json'
    require(registry.is_file() and not registry.is_symlink(), 'Exact production hash registry is required')
    require(sha(registry) == REGISTRY_SHA256, 'Registry is not the certified production version; rebase explicitly')
    require((source / BUILDER).is_file() and not (source / BUILDER).is_symlink(), 'Original production builder is required')
    require(sha(source / BUILDER) == BUILDER_SHA256, 'Production builder bytes differ')
    expected = json.loads(registry.read_text())
    require(len(expected) == 1648, 'Unexpected runtime file count')
    for name in expected:
        path = PurePosixPath(name)
        require(not path.is_absolute() and '..' not in path.parts, 'Unsafe runtime path')
        require(name == 'config.json' or path.parts[0] in {'static', 'functions'}, 'Unexpected runtime root')
        require(not any(p in {'docs', 'tests', '.git'} or p.endswith('.local') or p.startswith('.env') for p in path.parts), 'Private/internal path forbidden')
    actual = inventory(source / 'release')
    missing = sorted(set(expected) - set(actual))
    extra = sorted(set(actual) - set(expected))
    mismatch = sorted(p for p in set(actual) & set(expected) if actual[p] != expected[p])
    require(not (missing or extra or mismatch), json.dumps({'missing': missing, 'extra': extra, 'hash_mismatch': mismatch}))
    for name, (old, new) in PAGES.items():
        require(actual['static/' + name] == old, f'Production copy conflict: {name}')
        require(sha(REPO / name) == new, f'Approved nine-copy source changed: {name}; review conflict explicitly')
    return expected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, required=True)
    parser.add_argument('--work-dir', type=Path, required=True)
    args = parser.parse_args()
    source, work = args.source_root.resolve(), args.work_dir.resolve()
    require(not work.exists(), 'Work directory must be new')
    require(not work.is_relative_to(REPO) and not work.is_relative_to(source), 'Keep runtime artifacts outside the repository and source export')
    expected = validate_source(source)  # Fail before creating any output if incomplete.
    work.mkdir(parents=True)
    logs = {}
    # Builder SHA is pinned above and reviewed: only fs/path/crypto/assert.
    # No CLI deploy, installs, arbitrary package scripts, credentials or providers.
    for label in ['baseline', 'candidate']:
        target = work / label
        target.mkdir()
        shutil.copytree(source / 'release', target / 'release')
        shutil.copy2(source / BUILDER, target / BUILDER)
        hashes = dict(expected)
        if label == 'candidate':
            for name in PAGES:
                shutil.copy2(REPO / name, target / 'release/static' / name)
                hashes['static/' + name] = sha(target / 'release/static' / name)
        (target / 'orientation-output-hashes.json').write_text(json.dumps(hashes, separators=(',', ':')))
        result = subprocess.run(['node', BUILDER], cwd=target, env={'PATH': os.environ['PATH'], 'LANG': 'C.UTF-8'}, capture_output=True, text=True)
        logs[label] = {'command': ['node', BUILDER], 'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}
        (work / (label + '-build.json')).write_text(json.dumps(logs[label], indent=2) + '\n')
        require(result.returncode == 0, f'{label} build failed; no artifact is ready')
    base = inventory(work / 'baseline/.vercel/output')
    candidate = inventory(work / 'candidate/.vercel/output')
    require(base.keys() == candidate.keys() == expected.keys(), 'Packaged path set changed')
    changed = sorted(p for p in base if base[p] != candidate[p])
    require(changed == sorted('static/' + p for p in PAGES), 'Packaged changes exceed the four approved HTML files')
    require(all(base[p] == expected[p] for p in base if p != 'config.json'), 'Builder changed original production runtime bytes')
    require(all(candidate['static/' + name] == pair[1] for name, pair in PAGES.items()), 'Approved copy lost during build')
    archive = work / 'sollahms-nine-copy.vercel-output.tar.gz'
    with archive.open('wb') as raw, gzip.GzipFile(filename='', mode='wb', fileobj=raw, mtime=0) as compressed, tarfile.open(fileobj=compressed, mode='w') as tar:
        root = work / 'candidate/.vercel/output'
        for name in sorted(candidate):
            path = root / name
            info = tar.gettarinfo(str(path), '.vercel/output/' + name)
            info.uid = info.gid = info.mtime = 0
            info.uname = info.gname = ''
            with path.open('rb') as data:
                tar.addfile(info, data)
    with tarfile.open(archive) as tar:
        archived = {member.name.removeprefix('.vercel/output/'): hashlib.sha256(tar.extractfile(member).read()).hexdigest() for member in tar.getmembers() if member.isfile()}
    require(archived == candidate, 'Archived bytes differ from tested package')
    summary = {'status': 'built_requires_browser_qa_and_owner_authorization', 'production_deployment': DEPLOYMENT,
               'artifact': str(archive), 'artifact_sha256': sha(archive), 'files': len(candidate), 'changed': changed,
               'unchanged_functions': sum(p.startswith('functions/') for p in base), 'builder': BUILDER, 'builds': logs,
               'baseline_static': str(work / 'baseline/.vercel/output/static'), 'candidate_static': str(work / 'candidate/.vercel/output/static')}
    (work / 'package-inventory.json').write_text(json.dumps({'baseline': base, 'candidate': candidate}, indent=2) + '\n')
    (work / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        print(json.dumps({'status': 'blocked_no_artifact_ready', 'error': str(error)}, ensure_ascii=False))
        raise SystemExit(2)
