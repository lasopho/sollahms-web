#!/usr/bin/env python3
"""Prepare a two-file overlay on certified HWs bytes; never build or deploy.

The published source remains read-only. --refresh replaces only the stage
created by this helper after verifying its receipt and exact project binding.
"""
import argparse
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
WORK = ROOT / '.vercel/footer-sin-frase-20261116'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
SOURCE = Path('/private/tmp/sollahms-centro-audit-20261116/.vercel/centro-production-release-20261116/stage/.vercel/output')
BASELINE_MANIFEST = ROOT / 'docs/centro-auditoria-20261116/candidate-manifest.json'
BASELINE_PIN = 'ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
BASELINE_DEPLOYMENT = 'dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR'
BASELINE_COMMIT = '67a57b142dd2170c678e75c4c425aabd16579339'
PRODUCTION_SOURCE_COMMIT = '42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9'
BRANCH = 'codex/footer-sin-frase-20261116'
OVERLAYS = ('index.html', 'proyectos.html')
BLOCK = ('<div class="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-slate-200">\n'
         '<p class="text-[10px] text-slate-400 font-mono tracking-widest text-center">'
         'PRECISION • TRANSPARENCY • STRATEGY</p>\n</div>\n').encode()
LINK = {'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH',
        'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectName': 'project-wrapp'}
TEXT_EXTENSIONS = {'.html', '.js', '.mjs', '.cjs', '.css', '.py', '.json', '.md', '.txt', '.svg', '.yml', '.yaml', '.xml'}
PHRASE = re.compile(r'\bprecision[\W_]{0,120}transparency[\W_]{0,120}strategy\b', re.I)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def digest(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def record(path, body):
    return {'path': path, 'size': len(body), 'sha1': digest(body, 'sha1'), 'sha256': digest(body)}


def inventory(directory):
    rows = []
    for path in sorted(directory.rglob('*')):
        assert not path.is_symlink(), f'Symlink rejected: {path}'
        if path.is_file():
            rows.append(record(path.relative_to(directory).as_posix(), path.read_bytes()))
    return rows


def inventory_hash(rows):
    canonical = ''.join(f"{row['path']}\t{row['size']}\t{row['sha256']}\n"
                        for row in sorted(rows, key=lambda item: item['path']))
    return digest(canonical.encode())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def normalized(body):
    text = body.decode('utf-8')
    for _ in range(2):
        text = html.unescape(text)
    text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda match: chr(int(match[1], 16)), text)
    text = re.sub(r'\\x([0-9a-fA-F]{2})', lambda match: chr(int(match[1], 16)), text)
    text = re.sub(r'\\[nrt]', ' ', text)
    text = re.sub(r'<[!/a-zA-Z][^>]*>', ' ', text)
    return ''.join(char for char in unicodedata.normalize('NFKD', text)
                   if not unicodedata.combining(char))


def scan(paths, base):
    hits, count = [], 0
    for path in sorted(paths):
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            matches = list(PHRASE.finditer(normalized(path.read_bytes())))
        except UnicodeDecodeError:
            continue
        count += 1
        if matches:
            hits.append({'path': path.relative_to(base).as_posix(), 'occurrences': len(matches)})
    return {'scannedTextFiles': count, 'occurrences': sum(row['occurrences'] for row in hits), 'hits': hits}


def allowed_source_path(path):
    return path in {*OVERLAYS, 'vercel.json', 'NEXT-PROMPT.md'} or path.startswith('docs/footer-sin-frase-20261116/')


def source_preservation():
    changed = [path.decode() for path in git('diff', '--name-only', '-z', BASELINE_COMMIT, '--').split(b'\0') if path]
    assert all(allowed_source_path(path) for path in changed), f'Out-of-scope tracked delta: {changed}'
    untracked = [path.decode() for path in git('ls-files', '--others', '--exclude-standard', '-z').split(b'\0') if path]
    assert all(allowed_source_path(path) for path in untracked), f'Out-of-scope untracked file: {untracked}'
    base_config = json.loads(git('show', BASELINE_COMMIT + ':vercel.json'))
    expected_config = json.loads(json.dumps(base_config))
    expected_config['git']['deploymentEnabled'][BRANCH] = False
    assert json.loads((ROOT / 'vercel.json').read_text()) == expected_config, 'Vercel source guard delta exceeded scope.'
    unchanged, modified, added = [], [], []
    baseline_paths = set()
    entries = git('ls-tree', '-rz', '--full-tree', BASELINE_COMMIT).split(b'\0')
    for entry in entries:
        if not entry:
            continue
        metadata, name = entry.split(b'\t', 1)
        mode, kind, blob = metadata.decode().split()
        path = name.decode()
        baseline_paths.add(path)
        assert kind == 'blob' and mode in {'100644', '100755'}, f'Unsupported tracked entry: {path}'
        file = ROOT / path
        assert file.is_file() and not file.is_symlink(), f'File missing or replaced with symlink: {path}'
        body = file.read_bytes()
        actual_blob = digest(b'blob ' + str(len(body)).encode() + b'\0' + body, 'sha1')
        if actual_blob == blob:
            unchanged.append({**record(path, body), 'gitBlobSha': blob, 'identical': True})
        else:
            assert allowed_source_path(path), f'Out-of-scope byte change: {path}'
            before = git('show', BASELINE_COMMIT + ':' + path)
            modified.append({'path': path, 'before': record(path, before), 'after': record(path, body)})
    current_tracked = {path.decode() for path in git('ls-files', '-z').split(b'\0') if path}
    added_paths = sorted(current_tracked - baseline_paths)
    assert all(allowed_source_path(path) for path in added_paths), f'Out-of-scope added tracked file: {added_paths}'
    self_reports = {(DOCS / name).relative_to(ROOT).as_posix()
                    for name in ['source-preservation.json', 'SHA256SUMS']}
    for path in added_paths:
        file = ROOT / path
        assert file.is_file() and not file.is_symlink(), f'Added file missing or symlink: {path}'
        if path in self_reports:
            # Exclude both mutually dependent manifests from this report.
            # SHA256SUMS covers this report after it is written.
            added.append({'path': path, 'before': None, 'after': None,
                          'hashExclusion': 'Self-referential report; hash separately after writing this certificate.'})
        else:
            added.append({'path': path, 'before': None, 'after': record(path, file.read_bytes())})
    assert {item['path'] for item in modified} == set(changed) & baseline_paths
    assert set(added_paths) == set(changed) - baseline_paths
    return {'createdAtUTC': datetime.now(timezone.utc).isoformat(), 'status': 'PASS',
            'baselineCommit': BASELINE_COMMIT, 'sourceHeadAtVerification': git('rev-parse', 'HEAD').decode().strip(),
            'allowedRuntimeSourceChanges': list(OVERLAYS), 'sourceGuardExact': True,
            'trackedChangedPaths': changed, 'untrackedDeliveryPathsAtVerification': untracked,
            'baselineTrackedFilesCompared': len(unchanged) + len(modified),
            'trackedFilesCompared': len(unchanged) + len(modified) + len(added), 'trackedFilesIdentical': len(unchanged),
            'trackedFilesModified': len(modified), 'trackedFilesAdded': len(added),
            'changes': modified, 'additions': added,
            'allOtherTrackedFilesByteIdentical': True, 'identicalFiles': unchanged,
            'scope': 'Git tracked source files compared with current working bytes; ignored stage is verified separately.'}


def prepare(refresh=False):
    os.umask(0o077)
    assert ROOT.resolve() == Path('/private/tmp/sollahms-footer-review-20261116').resolve()
    assert git('branch', '--show-current').decode().strip() == BRANCH
    baseline_bytes = BASELINE_MANIFEST.read_bytes()
    baseline = json.loads(baseline_bytes)
    expected = sorted(baseline['inventory'], key=lambda row: row['path'])
    assert baseline['outputInventorySha256'] == BASELINE_PIN
    assert len(expected) == 1660 and inventory_hash(expected) == BASELINE_PIN
    before = inventory(SOURCE)
    assert before == expected and inventory_hash(before) == BASELINE_PIN, 'Published source differs from its certificate.'
    before_by_path = {row['path']: row for row in before}
    for name in OVERLAYS:
        original = (SOURCE / 'static' / name).read_bytes()
        assert original == git('show', BASELINE_COMMIT + ':' + name), f'Source baseline differs for {name}'
        assert original.count(BLOCK) == 1, f'Expected exactly one isolated slogan container: {name}'
        assert (ROOT / name).read_bytes() == original.replace(BLOCK, b'', 1), f'Change exceeds exact removal: {name}'
    preservation = source_preservation()
    receipt_path = WORK / 'stage-receipt.json'
    if STAGE.exists():
        assert refresh, 'Stage already exists; use --refresh for this helper-owned stage only.'
        assert receipt_path.is_file(), 'Refuse to replace a stage without its own receipt.'
        old_receipt = json.loads(receipt_path.read_text())
        assert old_receipt['baselineDeployment'] == BASELINE_DEPLOYMENT
        assert old_receipt['stageOutput'] == str(OUTPUT)
        assert json.loads((STAGE / '.vercel/project.json').read_text()) == LINK
        assert not STAGE.is_symlink()
        shutil.rmtree(STAGE)
    WORK.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SOURCE, OUTPUT, symlinks=False)
    save(STAGE / '.vercel/project.json', LINK)
    for name in OVERLAYS:
        shutil.copy2(ROOT / name, OUTPUT / 'static' / name)
    after = inventory(OUTPUT)
    after_by_path = {row['path']: row for row in after}
    assert set(before_by_path) == set(after_by_path), 'Added or deleted runtime files are forbidden.'
    changes = [{'path': row['path'], 'before': before_by_path[row['path']], 'after': row}
               for row in after if row != before_by_path[row['path']]]
    assert {row['path'] for row in changes} == {'static/' + name for name in OVERLAYS}
    identical = [row['path'] for row in after if row == before_by_path[row['path']]]
    assert len(identical) == 1658
    function_rows = [row for row in after if row['path'].startswith('functions/')]
    assert len(function_rows) == 57 and all(row == before_by_path[row['path']] for row in function_rows)
    functions = sorted(path.name for path in (OUTPUT / 'functions/api').iterdir() if path.is_dir())
    assert len(functions) == 7 and all(name.endswith('.func') for name in functions)
    assert after_by_path['config.json'] == before_by_path['config.json']
    assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    assert len(projects) == len({project['slug'] for project in projects}) == 131
    fiches = ['static/' + project['slug'] + '.html' for project in projects]
    assert all(path in identical for path in fiches)
    assert all(after_by_path[path] == before_by_path[path] for path in [
        'static/contacto.html', 'static/centro-orientacion.html', 'static/assets/css/orientacion.css',
        'static/assets/js/orientacion.mjs', 'static/assets/js/scroll-presence.js'])
    assert inventory(SOURCE) == before, 'Read-only published source changed during preparation.'
    active_before = scan([p for p in (SOURCE / 'static').rglob('*') if p.is_file()], SOURCE / 'static')
    active_after = scan([p for p in (OUTPUT / 'static').rglob('*') if p.is_file()], OUTPUT / 'static')
    assert active_before['hits'] == [{'path': 'index.html', 'occurrences': 1}, {'path': 'proyectos.html', 'occurrences': 1}]
    assert active_after['occurrences'] == 0
    tracked = [ROOT / path.decode() for path in git('ls-files', '-z').split(b'\0') if path]
    runtime_sources = scan([p for p in tracked if not p.relative_to(ROOT).parts[0] in {'docs', 'tests'}], ROOT)
    historical = scan([p for p in tracked if p.relative_to(ROOT).parts[0] == 'docs'
                       and not p.relative_to(ROOT).as_posix().startswith('docs/footer-sin-frase-20261116/')], ROOT)
    assert runtime_sources['occurrences'] == 0
    html_count = len(list((OUTPUT / 'static').rglob('*.html')))
    assert html_count == 147
    pin = inventory_hash(after)
    summary = {'preparedAtUTC': datetime.now(timezone.utc).isoformat(), 'passed': True,
               'baselineDeployment': BASELINE_DEPLOYMENT, 'productionSourceCommit': PRODUCTION_SOURCE_COMMIT,
               'baselineSourceHead': BASELINE_COMMIT, 'baselineInventorySha256': BASELINE_PIN,
               'baselineManifestSha256': digest(baseline_bytes), 'baselineOutput': str(SOURCE), 'stageOutput': str(OUTPUT),
               'candidateInventorySha256': pin, 'fileCount': len(after), 'changedFiles': 2, 'identicalFiles': 1658,
               'changes': changes, 'allowlist': ['static/' + name for name in OVERLAYS],
               'htmlPages': html_count, 'affectedPages': 2, 'occurrencesRemoved': 2, 'activeOccurrencesRemaining': 0,
               'functionFiles': 57, 'functionBundles': functions, 'projectFichesPreserved': 131,
               'contactoUnchanged': True, 'centroUnchanged': True, 'sharedMotionUnchanged': True,
               'configUnchanged': True, 'allOtherRuntimeFilesIdentical': True,
               'sourceProductionArtifactModified': False, 'projectBinding': LINK,
               'buildersOrGeneratorsExecuted': 0, 'networkCalls': 0, 'deploymentsCreatedOrPromoted': 0,
               'credentialsOrSettingsModified': False}
    save(receipt_path, summary)
    save(DOCS / 'stage-receipt.json', summary)
    save(DOCS / 'candidate-manifest.json', {
        'baselineDeployment': BASELINE_DEPLOYMENT, 'baselineInventorySha256': BASELINE_PIN,
        'outputInventorySha256': pin, 'files': 1660, 'changedFiles': 2, 'identicalFiles': 1658,
        'functionFiles': 57, 'functionBundles': 7, 'htmlPages': 147, 'changes': changes,
        'baselineInventory': before, 'inventory': after, 'identicalPaths': identical})
    preservation['stage'] = {key: summary[key] for key in [
        'fileCount', 'changedFiles', 'identicalFiles', 'functionFiles', 'functionBundles', 'projectFichesPreserved',
        'contactoUnchanged', 'centroUnchanged', 'sharedMotionUnchanged', 'configUnchanged', 'allOtherRuntimeFilesIdentical']}
    save(DOCS / 'source-preservation.json', preservation)
    save(DOCS / 'inventario.json', {
        'createdAtUTC': summary['preparedAtUTC'], 'status': 'PASS', 'baselineDeployment': BASELINE_DEPLOYMENT,
        'normalization': 'HTML entities decoded twice; escaped Unicode/hex and whitespace decoded; tags removed; NFKD accent normalization; case-insensitive bounded punctuation/whitespace separators.',
        'activeHtmlPages': 147, 'affectedPages': 2, 'occurrencesRemoved': 2,
        'baselinePublishedText': active_before, 'candidatePublishedText': active_after,
        'candidateRuntimeSources': runtime_sources, 'historicalReferencesPreserved': historical,
        'deliveryEvidenceExcluded': 'docs/footer-sin-frase-20261116 contains this task documentation, never a published source.',
        'appearances': [{'path': name, 'publishedPath': 'static/' + name, 'sourceType': 'independent inline HTML',
                         'sourceMatchesProductionBefore': True, 'sharedComponent': False, 'occurrencesBefore': 1,
                         'occurrencesAfter': 0, 'removedElement': 'entire three-line div; only slogan p plus exclusive margin/padding/top border',
                         'sourceBefore': before_by_path['static/' + name], 'sourceAfter': after_by_path['static/' + name]}
                        for name in OVERLAYS],
        'generatorFindings': [
            {'path': 'scripts/build-catalog-presentation.py', 'finding': 'Updates catalogue directory/filters and homepage featured cards in existing HTML; does not recreate either slogan container.'},
            {'path': 'scripts/build-mortgage-guide.py', 'finding': 'Uses Contacto footer, which contains no slogan.'},
            {'path': 'scripts/build-purchase-stage-guide.py', 'finding': 'Uses Contacto footer, which contains no slogan.'},
            {'path': 'scripts/brand_identity.py; scripts/guide_navigation.py; scripts/purchase_stage_links.py', 'finding': 'Modify existing logo/navigation regions; contain no equivalent phrase.'}],
        'projectFiches': {'count': 131, 'allPresent': True, 'allByteIdentical': True, 'affected': 0},
        'cssJsTemplatesContentSources': 'No equivalent phrase in runtime source text; no shared component edit is required.'})
    print(json.dumps({key: value for key, value in summary.items() if key not in {'changes'}}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Replace only this helper-owned, receipt-verified stage.')
    prepare(parser.parse_args().refresh)
