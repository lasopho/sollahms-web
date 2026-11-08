#!/usr/bin/env python3
"""Build only the certified frozen release locally. No deploy or provider calls.

Requires an exact, complete source export of the identified production release.
The original production builder is copied unchanged; this is only an orchestrator.
All runtime files and archives remain outside Git. Does not regenerate any page.
"""
import argparse
from datetime import datetime, timezone
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
    require(root.is_dir() and not root.is_symlink(), f'Regular runtime directory required: {root}')
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


def validate_work_inputs(work, expected):
    for label in ['baseline', 'candidate']:
        target = work / label
        hashes = dict(expected)
        if label == 'candidate':
            hashes.update({'static/' + name: pair[1] for name, pair in PAGES.items()})
        require(not (target / BUILDER).is_symlink() and sha(target / BUILDER) == BUILDER_SHA256,
                f'{label} production builder bytes differ')
        registry = target / 'orientation-output-hashes.json'
        require(not registry.is_symlink() and json.loads(registry.read_text()) == hashes,
                f'{label} input hash registry changed')
        require(inventory(target / 'release') == hashes, f'{label} production inputs changed')


def verify_outputs(work, expected):
    base = inventory(work / 'baseline/.vercel/output')
    candidate = inventory(work / 'candidate/.vercel/output')
    require(base.keys() == candidate.keys() == expected.keys(), 'Packaged path set changed')
    changed = sorted(p for p in base if base[p] != candidate[p])
    require(changed == sorted('static/' + p for p in PAGES), 'Packaged changes exceed the four approved HTML files')
    require(all(base[p] == expected[p] for p in base if p != 'config.json'), 'Builder changed original production runtime bytes')
    require(all(candidate['static/' + name] == pair[1] for name, pair in PAGES.items()), 'Approved copy lost during build')
    return base, candidate, changed


def archive_output(work, candidate):
    archive = work / 'sollahms-nine-copy.vercel-output.tar.gz'
    require(not archive.exists(), 'Artifact already exists; do not overwrite it')
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
    return archive


def validate_browser_qa(path, work, summary):
    require(path.is_file() and not path.is_symlink(), 'Browser QA results file is required')
    report = json.loads(path.read_text())
    require(isinstance(report, dict) and report.get('passed') is True, 'Browser QA has not passed')
    roots = {label: str(work / label / '.vercel/output/static') for label in ['baseline', 'candidate']}
    require(report.get('sourceMode') == 'packaged-static' and report.get('staticRoots') == roots,
            'Browser QA must use these exact packaged static roots')
    require(report.get('htmlSha256') == {
        label: {name: pair[index] for name, pair in PAGES.items()}
        for index, label in enumerate(['baseline', 'candidate'])}, 'Browser QA HTML hashes differ')
    isolation = report.get('isolation', {})
    require(isolation.get('localStaticOnly') is True and isolation.get('realSubmissions') is False,
            'Browser QA must isolate providers and real submissions')
    started = datetime.fromisoformat(report.get('startedAtUtc', ''))
    completed = datetime.fromisoformat(report.get('completedAtUtc', ''))
    built = datetime.fromisoformat(summary['build_completed_at_utc'])
    require(all(stamp.tzinfo is not None for stamp in [started, completed, built]) and built <= started <= completed,
            'Browser QA must finish after this build')
    checks = ['completed', 'passed', 'numbersIdentical', 'initialFormsControlsConsentContactIdentical',
              'exercisedFormsControlsConsentContactIdentical', 'noNewPageErrors', 'consoleErrorsIdentical',
              'remoteResourcesBlockedIdentically', 'noInitialHorizontalOverflow',
              'noExercisedHorizontalOverflow', 'emptyCommercialFormsInvalid']
    comparisons = report.get('comparisons', [])
    require(len(comparisons) == 8 and {(row.get('viewport'), row.get('page')) for row in comparisons}
            == {(viewport, name) for viewport in ['desktop', 'mobile'] for name in PAGES}
            and all(all(row.get(key) is True for key in checks) for row in comparisons),
            'Browser QA requires all eight complete, passing paired comparisons')
    cases = report.get('cases', [])
    viewports = [(1440, 1000), (390, 844)]
    require(len(cases) == 16 and all(row.get('completed') is True for row in cases)
            and {(row.get('page'), row.get('version'), row.get('viewport', {}).get('width'),
                  row.get('viewport', {}).get('height')) for row in cases}
            == {(name, label, width, height) for name in PAGES for label in roots for width, height in viewports},
            'Browser QA requires all sixteen packaged desktop/mobile cases')
    return {'results': str(path), 'sha256': sha(path), 'passed': True, 'completed_at_utc': report['completedAtUtc']}


def finalize(source, work, qa):
    expected = validate_source(source)
    validate_work_inputs(work, expected)
    base, candidate, changed = verify_outputs(work, expected)
    require(json.loads((work / 'package-inventory.json').read_text()) == {'baseline': base, 'candidate': candidate},
            'Packaged bytes changed since the paired build')
    summary = json.loads((work / 'summary.json').read_text())
    require(summary.get('status') == 'built_requires_browser_qa' and summary.get('production_deployment') == DEPLOYMENT,
            'Finalization requires an unarchived build-only result')
    for label in ['baseline', 'candidate']:
        log = json.loads((work / (label + '-build.json')).read_text())
        require(log == summary['builds'][label] and log.get('command') == ['node', BUILDER]
                and log.get('exit_code') == 0, f'{label} certified build did not pass')
    qa_result = validate_browser_qa(qa, work, summary)
    archive = archive_output(work, candidate)
    summary.update({'status': 'built_browser_qa_passed_requires_owner_authorization',
                    'artifact': str(archive), 'artifact_sha256': sha(archive), 'browser_qa': qa_result})
    (work / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, required=True)
    parser.add_argument('--work-dir', type=Path, required=True)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--build-only', action='store_true', help='Build and verify paired trees without creating an archive')
    mode.add_argument('--finalize-after-qa', type=Path, metavar='RESULTS_JSON', help='Verify existing paired build and packaged browser QA, then archive')
    args = parser.parse_args()
    source, work = args.source_root.resolve(), args.work_dir.resolve()
    require(not work.is_relative_to(REPO) and not work.is_relative_to(source), 'Keep runtime artifacts outside the repository and source export')
    if args.finalize_after_qa is not None:
        require(work.is_dir(), 'Finalization requires an existing build work directory')
        print(json.dumps(finalize(source, work, args.finalize_after_qa.resolve()), indent=2))
        return
    require(not work.exists(), 'Work directory must be new')
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
    validate_work_inputs(work, expected)
    base, candidate, changed = verify_outputs(work, expected)
    summary = {'status': 'built_requires_browser_qa' if args.build_only else 'built_requires_browser_qa_and_owner_authorization',
               'production_deployment': DEPLOYMENT, 'artifact': None, 'artifact_sha256': None,
               'build_completed_at_utc': datetime.now(timezone.utc).isoformat(),
               'files': len(candidate), 'changed': changed,
               'unchanged_functions': sum(p.startswith('functions/') for p in base), 'builder': BUILDER, 'builds': logs,
               'baseline_static': str(work / 'baseline/.vercel/output/static'), 'candidate_static': str(work / 'candidate/.vercel/output/static')}
    if not args.build_only:
        archive = archive_output(work, candidate)
        summary.update({'artifact': str(archive), 'artifact_sha256': sha(archive)})
    (work / 'package-inventory.json').write_text(json.dumps({'baseline': base, 'candidate': candidate}, indent=2) + '\n')
    (work / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        print(json.dumps({'status': 'blocked_no_artifact_ready', 'error': str(error)}, ensure_ascii=False))
        raise SystemExit(2)
