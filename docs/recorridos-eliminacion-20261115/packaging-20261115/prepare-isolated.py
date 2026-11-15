"""Offline byte-preserving assembly only. No build, network, deployment or provider calls."""
import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PINS = {
    'candidate-manifest.json': 'ed39917d1639b797d2715fe585af89717637d324109db77eb4c603e75a1fcdaa',
    'production-manifest.json': '120fc0c35ae7e3391f5be5b4c22eeae2c3c864722d25dd91d811dda10e213760',
    'runtime-changes.json': '70f3d07fe0d9764b09e869cc67970bebbec5875ef749ab06517b540a95d490da',
}

def digest(data, kind='sha256'):
    return hashlib.new(kind, data).hexdigest()

def manifests():
    result = {}
    for name, expected in PINS.items():
        data = (HERE.parent / name).read_bytes()
        assert digest(data) == expected, f'Manifest changed: {name}'
        result[name] = json.loads(data)
    candidate = result['candidate-manifest.json']
    baseline = {r['file']: r for r in result['production-manifest.json']}
    changes = {r['file']: r for r in result['runtime-changes.json']}
    assert len(candidate) == len(baseline) == 1660
    assert len(changes) == 66
    assert len({r['file'] for r in candidate}) == 1660
    assert {r['file'] for r in candidate} == set(baseline)
    for row in candidate:
        old = baseline[row['file']]
        if row['file'] in changes:
            ch = changes[row['file']]
            assert (row['sha'], row['size']) == (ch['afterSha1'], ch['afterBytes'])
            assert (old['sha'], old['size']) == (ch['beforeSha1'], ch['beforeBytes'])
        else:
            assert row == old
    assert sum(r == baseline[r['file']] for r in candidate) == 1594
    return candidate

def relative(row):
    assert row['file'].startswith('release/')
    path = Path(row['file'][8:])
    assert not path.is_absolute() and '..' not in path.parts
    assert path.parts[0] in ('config.json', 'static', 'functions')
    return path

def check_bytes(data, row):
    assert len(data) == row['size'], f"Size mismatch: {row['file']}"
    assert digest(data, 'sha1') == row['sha'], f"Hash mismatch: {row['file']}"

def verify(output):
    candidate = manifests()
    expected = {relative(r).as_posix(): r for r in candidate}
    actual = set()
    for path in output.rglob('*'):
        assert not path.is_symlink(), f'Symlink: {path}'
        if path.is_file():
            actual.add(path.relative_to(output).as_posix())
    assert actual == set(expected), 'Missing or extra output files'
    records = []
    for name, row in sorted(expected.items()):
        data = (output / name).read_bytes()
        check_bytes(data, row)
        records.append({'path': name, 'size': len(data), 'sha1': row['sha'], 'sha256': digest(data)})
    config = json.loads((output / 'config.json').read_bytes())
    assert config['version'] == 3 and config['crons'] == []
    assert {'handle': 'filesystem'} in config['routes']
    bundles = []
    for path in sorted((output / 'functions').rglob('.vc-config.json')):
        cfg = json.loads(path.read_bytes())
        assert path.parent.name.endswith('.func')
        assert cfg['runtime'] == 'nodejs24.x' and cfg['launcherType'] == 'Nodejs'
        assert cfg.get('environment') == {}, 'Unexpected embedded environment'
        handler = (path.parent / cfg['handler']).resolve()
        assert handler.is_relative_to(path.parent.resolve()) and handler.is_file()
        endpoint = '/' + path.parent.relative_to(output / 'functions').as_posix()[:-5]
        assert not (output / 'static' / endpoint.lstrip('/')).exists()
        bundles.append({'endpoint': endpoint, 'handler': cfg['handler'], 'runtime': cfg['runtime'],
                        'files': sum(p.is_file() for p in path.parent.rglob('*'))})
    assert len(bundles) == 7 and sum(b['files'] for b in bundles) == 57
    assert not (output / 'static/functions').exists()
    canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in records).encode()
    return {'files': 1660, 'staticFiles': 1602, 'functionFiles': 57, 'configFiles': 1,
            'changedFromProduction': 66, 'preservedFromProduction': 1594,
            'outputInventorySha256': digest(canonical), 'functions': bundles, 'inventory': records,
            'deploymentCreated': False, 'remoteRegistrationVerified': False}

def prepare(work):
    # Fail closed; never delete/reuse an existing staging directory.
    assert not work.exists(), 'Destination must not exist'
    assert not work.resolve().is_relative_to(ROOT), 'Use an isolated directory outside the repository'
    candidate = manifests()
    sources = json.loads((HERE / 'source-map.json').read_text())
    assert len(sources) == 1660
    source_map = {r['file']: r['source'] for r in sources}
    assert set(source_map) == {r['file'] for r in candidate}
    # Verify every input before writing the first output.
    for row in candidate:
        path = ROOT / source_map[row['file']]
        assert path.resolve().is_relative_to(ROOT) and not path.is_symlink()
        check_bytes(path.read_bytes(), row)
    output = work / '.vercel/output'
    for row in candidate:
        data = (ROOT / source_map[row['file']]).read_bytes()
        check_bytes(data, row)
        target = output / relative(row)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    return verify(output)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('work', type=Path)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    report = verify(args.work / '.vercel/output') if args.verify_only else prepare(args.work)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'inventory'}, indent=2))
