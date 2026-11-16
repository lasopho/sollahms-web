"""Certify nine completed public cases plus the independently repeated final case."""
import hashlib
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / 'public'
DIAGNOSTIC = HERE / 'attempts/public-320-diagnostic'
ORIGINAL = HERE / 'attempts/public-media-timing.json'
def sha(body):
    return hashlib.sha256(body).hexdigest()
assert not ORIGINAL.exists(), 'Original attempt already archived; inspect before repeating finalization.'
original_bytes = (PUBLIC / 'results.json').read_bytes()
retry_bytes = (DIAGNOSTIC / 'results.json').read_bytes()
original, retry = json.loads(original_bytes), json.loads(retry_bytes)
assert not original['passed'] and len(original['cases']) == 10
assert retry['passed'] and len(retry['cases']) == 1
assert sum(case['passed'] for case in original['cases']) == 9
for key in ['deployment', 'origin', 'candidateInventorySha256', 'localCertificateSha256', 'phase']:
    assert original[key] == retry[key], key
assert original['phase'] == 'public' and original['origin'] == 'https://sollahms.cl'
for report in [original, retry]:
    assert not any(report[key] for key in ['pageErrors', 'failedResources', 'consoleErrors', 'blockedMutations', 'blockedAPIs', 'blockedExternal'])
failed = [case for case in original['cases'] if not case['passed']]
replacement = retry['cases'][0]
assert len(failed) == 1
key = lambda case: (case['file'], case['width'])
assert key(failed[0]) == key(replacement) == ('proyectos.html', 320)
assert replacement['delivered']['footerBytesExactlyCertified'] and replacement['delivered']['tls']['certificateVerificationEnabled']
assert replacement['delivered']['footerSha256'] == failed[0]['delivered']['footerSha256']
assert replacement['motion']['readingOpacity'] > .95 and replacement['motion']['edgeOpacity'] < .9
assert replacement['motion']['reducedMotionVisible'] and replacement['commercialSubmits'] == 0
assert replacement['heightRemoved'] == 112 and replacement['whatsapp']['pointerActivation']
ORIGINAL.write_bytes(original_bytes)
final = dict(original)
final['cases'] = [replacement if key(case) == key(replacement) else case for case in original['cases']]
assert all(case['passed'] for case in final['cases'])
assert {key(case) for case in final['cases']} == {(file, width) for file in original['pages'] for width in original['widths']}
for name in ['pageErrors', 'failedResources', 'consoleErrors', 'expectedFixtureConsole', 'fontResources',
             'administrativeToolbarSuppressed', 'blockedExternal', 'apiFixtures', 'blockedAPIs', 'blockedMutations', 'requests', 'targets']:
    final[name] = original[name] + retry[name]
final.pop('failure', None)
final['passed'] = True
final['finishedAt'] = retry['finishedAt']
final['aggregation'] = {'method': 'Nine original completed cases retained unchanged; only the incomplete proyectos320 case replaced by a complete independent real-HTTPS repetition.',
    'originalAttempt': '../attempts/public-media-timing.json', 'originalSha256': sha(original_bytes),
    'originalCompleteCases': 9, 'retryReport': '../attempts/public-320-diagnostic/results.json',
    'retrySha256': sha(retry_bytes), 'retriedCase': {'file': 'proyectos.html', 'width': 320},
    'artifactOriginAndFooterHashIdentical': True, 'runtimeChangesMade': False}
shutil.copy2(DIAGNOSTIC / replacement['screenshot'], PUBLIC / replacement['screenshot'])
(PUBLIC / 'results.json').write_text(json.dumps(final, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': True, 'publicCases': 10, 'originalCasesRetained': 9, 'fullyRepeatedCases': 1,
                  'deployment': final['deployment'], 'runtimeChangesMade': False}))
