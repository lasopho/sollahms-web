#!/usr/bin/env python3
"""Execute the explicitly classified Git-only checks; never deploy or fabricate a build."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time

EXTRA_TESTS = {
    'tests/booking-project-context.mjs', 'tests/form-regression.mjs',
    'tests/rut-contact.mjs', 'tests/integration-capacity-ui.mjs',
    'tests/integration-comparator.mjs', 'tests/integration-contact.mjs',
    'tests/git-checkout-controls.mjs',
}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--output', type=Path, default=Path(tempfile.gettempdir()) / 'sollahms-git-ci-results')
args = parser.parse_args()
ROOT = args.root.resolve()
OUT = args.output.resolve()
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'tests/git-ci-selection.json').read_text())
assert manifest['schemaVersion'] == 1
assert manifest['checkScope'] == 'git-checkout-regression-not-release-build'
full_files = [entry['file'] for entry in manifest['fullFiles']]
selected = manifest['selectedSuites']
classified = full_files + [entry['file'] for entry in selected]
assert len(classified) == len(set(classified)), 'Each file needs exactly one classification'
actual = {path.relative_to(ROOT).as_posix() for path in ROOT.glob('tests/*.test.mjs')} | EXTRA_TESTS
assert set(classified) == actual, 'New/missing test files require explicit classification'
release_cases = []
for suite in selected:
    source = (ROOT / suite['file']).read_text()
    declared = []
    for match in re.finditer(r'^test\(([\'\"])((?:\\.|(?!\1).)*?)\1', source, re.MULTILINE):
        assert '\\' not in match[2], 'Nonliteral test names require an explicit parser update'
        declared.append(match[2])
    assert len(declared) == len(re.findall(r'^test\(', source, re.MULTILINE)), 'Unclassified dynamic test declaration'
    allowed = suite['cases']
    release = [entry['name'] for entry in suite['releaseRequired']]
    assert len(set(allowed)) == len(allowed)
    assert len(set(release)) == len(release)
    assert not set(allowed) & set(release)
    assert set(declared) == set(allowed) | set(release), 'New/missing case needs a declared CI or release scope'
    assert len(declared) == len(allowed) + len(release), 'Duplicated declaration'
    release_cases.extend({'file': suite['file'], **entry} for entry in suite['releaseRequired'])
assert len(release_cases) == manifest['expectedReleaseOnlyCases'] == 24
# All historical byte-preservation guards use actual local Git objects.
assert subprocess.check_output(['git', 'rev-parse', '--is-shallow-repository'], cwd=ROOT, text=True).strip() == 'false', 'fetch-depth: 0 required'
for revision in ['e7afe04', '8cdb9bf2af607a4f0822e5ea2c3ec4ba3f4c76b1', 'b64911588e2fdf52f32d5f772b53735936fbd423', 'e903208160f62cc552e9efa4371a322ef75477b8', '045fe182ef5d2ad2206df303ba74330aa747050d']:
    subprocess.run(['git', 'cat-file', '-e', revision + '^{commit}'], cwd=ROOT, check=True)

node = os.environ.get('SOLLAHMS_CI_NODE', 'node')
commands = [('node-full-git-suites', [node, '--test', '--test-reporter=tap', *full_files])]
for suite in selected:
    pattern = '^(?:' + '|'.join(re.escape(name) for name in suite['cases']) + ')$'
    commands.append(('node-' + Path(suite['file']).stem, [node, '--test', '--test-reporter=tap', '--test-name-pattern', pattern, suite['file']]))
commands += [('python-synthetic-units', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-v']),
             ('mortgage-data-validation', [node, 'scripts/validate-mortgage-data.mjs'])]
env = {key: value for key, value in os.environ.items() if not key.startswith(('VERCEL_', 'BOOKING_', 'RESEND_', 'SMTP_')) and key != 'GITHUB_TOKEN'}
env['PYTHONDONTWRITEBYTECODE'] = '1'

def run(item):
    name, command = item
    start = time.monotonic()
    result = subprocess.run(command, cwd=ROOT, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=300)
    output = result.stdout
    (OUT / (name + '.log')).write_text(output)
    row = {'name': name, 'exitCode': result.returncode, 'seconds': round(time.monotonic()-start, 3)}
    if name.startswith('node-'):
        counts = {key: int(value) for key, value in re.findall(r'^# (tests|pass|fail|skipped|cancelled) (\d+)$', output, re.MULTILINE)}
        assert all(key in counts for key in ['tests', 'pass', 'fail', 'skipped', 'cancelled']), 'Missing Node test summary: ' + name
        row['tests'] = counts
    elif name == 'python-synthetic-units':
        count = re.search(r'^Ran (\d+) tests', output, re.MULTILINE)
        assert count, 'Missing Python summary'
        row['tests'] = int(count[1])
    print(json.dumps(row), flush=True)
    if result.returncode:
        print(output[-10000:], flush=True)
    return row

with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(run, commands))
node_results = [item for item in results if item['name'].startswith('node-')]
node_counts = {key: sum(item['tests'][key] for item in node_results) for key in ['tests','pass','fail','skipped','cancelled']}
assert node_counts['tests'] == manifest['expectedGitNodeTests'] == 292, 'Executed case count changed; classify the change explicitly'
assert node_counts['skipped'] == 0, 'Filtered release cases are not represented as successful or skipped test executions'
python_result = next(item for item in results if item['name'] == 'python-synthetic-units')
assert python_result['tests'] == manifest['expectedPythonFixtureTests'] == 103
passed = all(item['exitCode'] == 0 for item in results) and node_counts['pass'] == 292 and node_counts['fail'] == 0 and node_counts['cancelled'] == 0
report = {'checkScope': manifest['checkScope'], 'allPassed': passed,
          'node': node_counts, 'pythonFixtureTests': python_result['tests'],
          'releaseOnlyNotRun': release_cases, 'releaseOnlyNotRunCount': len(release_cases),
          'commands': results, 'productionBuildPerformed': False, 'deploymentsCreated': 0,
          'privateAssetsImported': False, 'externalProviderCalls': 'synthetic handlers/fixtures only'}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
summary = '\n'.join([
    '## Sollahms — Git checkout regression',
    f"Node: {node_counts['pass']}/{node_counts['tests']}; Python synthetic fixtures: {python_result['tests']}; mortgage validator: " + str(results[-1]['exitCode']==0),
    '136 projects / 15 Ecasa (22 commercial origins) / 16 Ingevec; manual main + integration deployment gates; catalogue/privacy/security guards and incomplete-build rejection are checked.',
    '24 named image/release cases require the private reproducible package and protected Preview. They were not run and are not marked passed.',
    'This job does not build a publishable site, import private derivatives, deploy, merge, or send forms.',
])+'\n'
print(summary)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as output: output.write(summary)
raise SystemExit(0 if passed else 1)
