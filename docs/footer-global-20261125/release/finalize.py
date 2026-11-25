#!/usr/bin/env python3
"""Close the 25 November footer certification only after all public proofs pass.

No network, Git mutation, build, deploy or promotion is implemented. The footer
was already uniform: all 1,729 runtime files must remain byte-identical to ADQD.
The new published source commit identifies this certification/branch guard;
footer implementation provenance remains e866ce7 from 19 November.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

RELEASE = Path(__file__).resolve().parent
DOCS = RELEASE.parent
ROOT = DOCS.parents[1]
OUTPUT = ROOT / '.vercel/footer-global-20261125/stage/.vercel/output'
BASE = 'dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be'
BASE_HEAD = '349b955fcf6d887ac084ed7b673bc78d8a2b52b4'
BASE_SOURCE = 'e866ce7ac0d7b6df968ecd011fa78d6aec335828'
PIN = 'fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79'
BRANCH = 'codex/footer-global-20261125'
WIDTHS = [1440, 1280, 768, 390, 320]
HOSTS = {'sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app',
         'project-wrapp-lsandoval2-8260s-projects.vercel.app'}
NEXT_TITLE = '# SOLLAHMS — homologación global certificada y publicada el 25/11/2026'
EVIDENCE = []
WRITES_STARTED = False


def digest(body):
    return hashlib.sha256(body).hexdigest()


def stamp(value):
    assert isinstance(value, str) and value
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    assert result.tzinfo is not None
    return result.astimezone(timezone.utc)


def chile(value):
    return value.astimezone(ZoneInfo('America/Santiago')).isoformat()


def load(relative):
    path = ROOT / relative
    raw = path.read_bytes()
    EVIDENCE.append({'path': relative, 'bytes': len(raw), 'sha256': digest(raw)})
    return json.loads(raw)


def doc(relative):
    return load('docs/footer-global-20261125/' + relative)


def git(*arguments, optional=False):
    result = subprocess.run(['/usr/bin/git', *arguments], cwd=ROOT, capture_output=True, timeout=20,
                            env={**os.environ, 'GIT_OPTIONAL_LOCKS': '0'})
    if optional and result.returncode:
        return None
    assert result.returncode == 0, 'Read-only Git inspection failed; raw response omitted'
    return result.stdout


def git_file(commit, path, optional=False):
    assert re.fullmatch(r'[0-9a-f]{40}', commit) and '..' not in Path(path).parts
    return git('show', commit + ':' + path, optional=optional)


def proof_passed(proof):
    assert proof.get('passed') is True and proof.get('status', 'PASS') == 'PASS'


def proof_identity(proof, deployment, pin):
    actual = proof.get('deploymentId')
    if not actual:
        value = proof.get('deployment')
        actual = value.get('id') if isinstance(value, dict) else value
    assert actual == deployment
    values = [proof[key] for key in ['artifactPin', 'candidateInventorySHA256'] if key in proof]
    assert values and all(value == pin for value in values)


def validate_browser(mode, deployment, pin, inventory):
    proof = doc('qa/' + mode + '/results.json')
    proof_passed(proof)
    assert proof['mode'] == mode and proof['artifactPin'] == pin
    assert proof['widths'] == WIDTHS and len(proof['cases']) == 840
    if mode != 'local':
        assert proof['deployment'] == deployment
    if mode == 'public':
        assert proof['origin'] == 'https://sollahms.cl'
    for field in ['pageErrors', 'ownResourceFailures', 'unexpectedConsole', 'blockedMutations',
                  'unexpectedExternal', 'blockedMetrics']:
        assert proof[field] == [], 'Unexpected browser failure or attempted operation: ' + mode + '/' + field
    seen, screenshots = set(), []
    for case in proof['cases']:
        assert case['passed'] is True and case['width'] in WIDTHS
        pair = (case['file'], case['width'])
        assert pair not in seen
        seen.add(pair)
        assert case['sourceSHA256'] == inventory['static/' + case['file']]['sha256']
        assert case['outsideFooterByteIdentical'] is True and case['mainByteIdentical'] is True
        assert case['commercialSubmits'] == 0
        assert case['footer']['footerOverflow'] is False and case['footer']['emptyContainers'] == 0
        assert case['footer']['footerOpacity'] == '1'
        assert case['links']['anchorsAndDestinationsValidated'] == 11 and case['links']['whatsappPointerActivation'] is True
        assert case['links']['messagesSent'] == 0 and case['links']['externalWhatsappNavigation'] is False
        shot = Path(case['screenshot']['path']).resolve()
        assert shot.is_relative_to((DOCS / 'qa' / mode).resolve()) and shot.is_file()
        body = shot.read_bytes()
        assert digest(body) == case['screenshot']['sha256']
        screenshots.append({'path': shot.relative_to(ROOT).as_posix(), 'bytes': len(body), 'sha256': digest(body)})
    assert len({file for file, _width in seen}) == 168
    assert all({width for file, width in seen if file == page} == set(WIDTHS) for page, _width in seen)
    consent = proof['consent']
    assert len(consent) == (0 if mode == 'isolated' else 12)
    assert len({row['file'] for row in consent}) == len(consent)
    for row in consent:
        assert row['sdkScripts'] == []
        assert all(row['status'][field] is False for field in ['analyticsConsented', 'replayConsented', 'analyticsActive', 'replayStarted'])
        assert row['consent']['analytics'] is False and row['consent']['replay'] is False
    assert len(proof['motion']) == 5 and {row['width'] for row in proof['motion']} == set(WIDTHS)
    assert all(row['footerStatic'] is True and row['reducedMotionVisible'] is True for row in proof['motion'])
    assert len({row['path'] for row in screenshots}) == 840
    assert proof['referenceSHA256'] == digest((DOCS / 'qa/baseline-home.json').read_bytes())
    finished = stamp(proof['finishedAt'])
    return {'mode': mode, 'passed': True, 'cases': 840, 'pages': 168, 'widths': WIDTHS,
            'screenshots': 840, 'finishedAtUtc': finished.isoformat(),
            'consentRejectCases': len(consent), 'optionalSDKRequests': 0, 'commercialSubmits': 0,
            'mapIframeFixtures': len(proof['mapFixtures']),
            'api503Fixtures': len(proof['apiFixtures']),
            'uf503Fixtures': sum(row['path'].startswith('/api/uf') for row in proof['apiFixtures']),
            'motionCases': len(proof['motion']), 'preexistingOutsideFooterOverflow': proof['preexistingOutsideFooterOverflow'],
            'networkResources': len(proof['networkResources'])}, screenshots


def validate_http(mode, deployment, pin):
    proof = doc('qa/http-' + mode + '/results.json')
    proof_passed(proof)
    proof_identity(proof, deployment, pin)
    assert proof['mode'] == mode
    assert proof['results'] and all(row['passed'] is True for row in proof['results'])
    summary = proof['summary']
    assert summary['htmlPages'] == summary['htmlPagesVerified'] == summary['outsideFooterExact'] == summary['mainExact'] == 168
    assert summary['plannedRequests'] == summary['completedRequests'] == summary['passedRequests']
    assert summary['footerDestinations'] == 11
    assert all(proof[field] == 0 for field in ['applicationAPIRequests', 'providerRequests', 'formsSubmitted', 'networkWrites', 'mutations'])
    assert proof['credentialsOrRawHeadersRecorded'] is False and proof['tlsVerificationDisabled'] is False
    return {'mode': mode, 'passed': True, 'finishedAtUtc': stamp(proof['finishedAtUTC']).isoformat(),
            'summary': summary, 'methods': ['GET'], 'sourceComparison': 'Exact candidate bytes or only the verified deployment-specific administrative toolbar suffix'}


def validate_pr(source_commit):
    value = doc('release/pr.json')
    proof = value.get('pullRequest', value)
    url = proof.get('url') or proof.get('html_url')
    parsed = urlsplit(url or '')
    assert parsed.scheme == 'https' and parsed.netloc == 'github.com'
    match = re.fullmatch(r'/lasopho/sollahms-web/pull/(\d+)', parsed.path)
    assert match and int(match[1]) == int(proof['number'])
    assert proof.get('draft', proof.get('isDraft')) is True
    assert str(proof['state']).lower() == 'open' and proof['merged'] is False
    head = proof.get('head') or {}
    ref = head.get('ref') or proof.get('headRef') or proof.get('branch')
    head_sha = head.get('sha') or proof.get('sourceCommit')
    assert ref == BRANCH and re.fullmatch(r'[0-9a-f]{40}', head_sha or '')
    assert git('merge-base', '--is-ancestor', source_commit, head_sha) == b''
    return {'number': int(proof['number']), 'url': url, 'draft': True, 'state': 'open', 'merged': False,
            'head': {'ref': ref, 'sha': head_sha}}


def validate_reference():
    proof = doc('qa/baseline-home.json')
    assert proof['passed'] is True and proof['baselineDeployment'] == BASE
    assert proof['inventorySHA256'] == proof['baselineInventorySHA256'] == PIN
    assert [row['width'] for row in proof['widths']] == WIDTHS
    pictures = []
    for row in proof['widths']:
        path = Path(row['screenshot']).resolve()
        assert path.is_relative_to((DOCS / 'qa/baseline-home').resolve()) and path.is_file()
        body = path.read_bytes()
        assert digest(body) == row['screenshotSHA256']
        pictures.append({'path': path.relative_to(ROOT).as_posix(), 'bytes': len(body), 'sha256': digest(body)})
    assert len({row['path'] for row in pictures}) == 5
    return {'passed': True, 'baselineDeployment': BASE, 'inventorySHA256': PIN,
            'widths': WIDTHS, 'capturedAt': proof['capturedAt'], 'screenshots': 5,
            'method': proof['networkPolicy'], 'referenceSHA256': digest((DOCS / 'qa/baseline-home.json').read_bytes())}, pictures


def validate_visual(mode, deployment, project_files, nonproject_files):
    proof = doc('qa/visual-review-' + mode + '.json')
    proof_passed(proof)
    proof_identity(proof, deployment, PIN)
    assert proof['method'] == 'Actual view_image inspection' and proof.get('pending') == []
    reviews = proof['reviews']
    assert reviews and all(row['passed'] is True and row.get('observations') for row in reviews)
    pictures, widths = [], {}
    for row in reviews:
        file = row['file'].removeprefix('static/')
        assert row['width'] in WIDTHS and row.get('category')
        widths.setdefault(file, set()).add(row['width'])
        path = Path(row['screenshot']['path']).resolve()
        assert path.is_relative_to((DOCS / 'qa').resolve()) and path.is_file()
        body = path.read_bytes()
        assert digest(body) == row['screenshot']['sha256']
        pictures.append({'path': path.relative_to(ROOT).as_posix(), 'sha256': digest(body), 'bytes': len(body)})
    assert len(nonproject_files) == 16 and nonproject_files <= set(widths)
    paired = lambda file: 1440 in widths[file] and bool(widths[file] & {320, 390})
    assert all(paired(file) for file in nonproject_files)
    assert any(file in widths and paired(file) for file in project_files)
    assert len(reviews) >= 2 * (len(nonproject_files) + 1)
    return {'passed': True, 'mode': mode, 'method': proof['method'], 'reviewCount': len(reviews),
            'pages': len(widths), 'categories': sorted({row['category'] for row in reviews}),
            'widths': sorted({row['width'] for row in reviews}, reverse=True),
            'automatedCases': False, 'evidence': 'qa/visual-review-' + mode + '.json'}, pictures


def runtime_inventory(manifest):
    rows = sorted(manifest['inventory'], key=lambda row: row['path'])
    before = sorted(manifest['baselineInventory'], key=lambda row: row['path'])
    assert len(rows) == len(before) == 1729 and rows == before
    assert len({row['path'] for row in rows}) == 1729
    canonical = ''.join(f"{row['path']}\t{row['bytes']}\t{row['sha256']}\n" for row in rows)
    assert digest(canonical.encode()) == manifest['inventorySHA256'] == manifest['baselineInventorySHA256'] == PIN
    assert manifest['baselineDeployment'] == BASE and manifest['changedHtmlFiles'] == manifest['addedFiles'] == 0
    assert manifest['identicalFiles'] == 1729 and manifest['changes'] == []
    expected, observed = {row['path']: row for row in rows}, set()
    for path in OUTPUT.rglob('*'):
        assert not path.is_symlink()
        if path.is_file():
            key = path.relative_to(OUTPUT).as_posix()
            body = path.read_bytes()
            observed.add(key)
            assert key in expected and len(body) == expected[key]['bytes']
            assert digest(body) == expected[key]['sha256'] and hashlib.sha1(body).hexdigest() == expected[key]['sha1']
    assert observed == set(expected)
    assert sum(path.startswith('functions/') for path in expected) == 57
    assert len(manifest['functionBundles']) == 7
    return expected


def source_guard_proof(source_commit, pr_head, html_paths):
    tracked = {p.decode() for p in git('diff', '--name-only', '-z', BASE_HEAD, '--').split(b'\0') if p}
    untracked = {p.decode() for p in git('ls-files', '--others', '--exclude-standard', '-z').split(b'\0') if p}
    outside = [path for path in tracked | untracked if path != 'vercel.json' and path != 'NEXT-PROMPT.md'
               and not path.startswith('docs/footer-global-20261125/')]
    assert not outside, 'Out-of-scope checkout delta: ' + ', '.join(sorted(outside))
    before = git_file(BASE_HEAD, 'vercel.json')
    after = (ROOT / 'vercel.json').read_bytes()
    assert after == git_file(source_commit, 'vercel.json') == git_file(pr_head, 'vercel.json')
    old_config, new_config = json.loads(before), json.loads(after)
    assert new_config['git']['deploymentEnabled'][BRANCH] is False
    del new_config['git']['deploymentEnabled'][BRANCH]
    assert old_config == new_config, 'The branch guard changed unrelated configuration'
    for relative in html_paths:
        path = relative.removeprefix('static/')
        body = (ROOT / path).read_bytes()
        assert body == git_file(BASE_HEAD, path) == git_file(source_commit, path) == git_file(pr_head, path)
    assert git('rev-list', '--merges', BASE_HEAD + '..HEAD').strip() == b''
    return {'passed': True, 'baselineHead': BASE_HEAD, 'publishedSourceCommit': source_commit,
            'originalFooterImplementationCommit': BASE_SOURCE, 'runtimeSourceFilesChanged': 0,
            'wholeHtmlSourceFilesByteIdentical': 168, 'branchGuardOnly': True,
            'configurationSourceChange': {'path': 'vercel.json',
                   'before': {'bytes': len(before), 'sha256': digest(before)},
                   'after': {'bytes': len(after), 'sha256': digest(after)}},
            'allowedDocumentationPrefix': 'docs/footer-global-20261125/', 'outOfScope': [], 'merges': 0}


def main():
    global WRITES_STARTED
    assert len(sys.argv) == 1, 'This fixed closure helper accepts no arguments'
    manifest = doc('candidate-manifest.json')
    receipt = doc('stage-receipt.json')
    preservation = doc('html-preservation.json')
    audit = doc('audit-matrix.json')
    authorization = doc('release/authorization.json')
    created = doc('release/created.json')
    promotion = doc('release/promotion-confirmed.json')
    native = {phase: doc('release/verification/' + phase + '-summary.json')
              for phase in ['preflight', 'isolated', 'gate', 'postpromotion']}
    for proof in native.values():
        proof_passed(proof)
        assert len(proof['checks']) >= 21 and all(row['passed'] is True for row in proof['checks'])
    inventory = runtime_inventory(manifest)
    assert receipt['passed'] is True and receipt['inventorySHA256'] == PIN and receipt['files'] == 1729
    assert receipt['changedHtmlFiles'] == receipt['addedFiles'] == 0 and receipt['identicalFiles'] == 1729
    assert receipt['htmlPages'] == manifest['htmlPages'] == 168 and receipt['projectFiches'] == manifest['projectFiches'] == 152
    assert receipt['sourceArtifactModified'] is False and receipt['buildersOrGeneralGeneratorsExecuted'] == 0
    assert preservation['passed'] is True and preservation['fullHtmlByteIdentical'] is True
    assert preservation['outsideFooterByteIdentical'] is True and preservation['onlyAdditionalHeadMarkup'] is None
    assert len(preservation['pages']) == 168 and all(row['fullHtmlByteIdentical'] is True for row in preservation['pages'])
    proof_passed(audit)
    assert audit['baselineDeployment'] == BASE and audit['artifactPin'] == audit['inventorySHA256'] == PIN
    assert audit['pagesExpected'] == audit['pagesAudited'] == audit['pagesPassed'] == len(audit['rows']) == 168
    assert audit['projectFiches'] == 152 and audit['exceptionCount'] == 0 and audit['exceptions'] == []
    assert audit['requiredRuntimeCorrectionCount'] == audit['runtimeFilesChanged'] == audit['sloganOccurrences'] == 0
    assert audit['candidateAll1729FilesIdenticalToPublishedManifest'] is True
    html_paths = set(manifest['htmlPaths'])
    assert len(html_paths) == 168 and {row['path'] for row in audit['rows']} == html_paths
    project_files = set()
    for row in audit['rows']:
        assert row['passed'] is True and row['footerCount'] == 1 and row['footerMatchesApprovedTemplate'] is True
        assert row['footerLinkCount'] == 11 and row['footerDestinationsExact'] is True
        assert row['corporateFooterStylesheetCount'] == 1 and row['corporateFooterStylesheetLast'] is True
        assert row['fullHtmlByteIdenticalToApprovedPublishedHTML'] is True
        assert row['mainHeadMetadataAndFormsPreservedByFullHtmlIdentity'] is True
        assert row['fullHtmlSha256'] == inventory[row['path']]['sha256']
        assert row['forbiddenSloganOccurrences'] == 0 and row['exceptions'] == [] and row['requiredCorrections'] == []
        if row['category'] == 'project-fiche':
            project_files.add(row['path'].removeprefix('static/'))
    assert len(project_files) == 152
    nonproject_files = {path.removeprefix('static/') for path in html_paths} - project_files
    assert len(nonproject_files) == 16
    assert authorization['explicitAuthorization'] is True and authorization['productionCreationAuthorized'] is True
    assert authorization['promotionAuthorized'] is True and authorization['publicQaAuthorized'] is True
    assert authorization['maximumNewProductionDeployments'] == 1 and authorization['mergeAuthorized'] is False
    deployment, source_commit = created['deploymentId'], created['sourceCommit']
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+', deployment) and deployment != BASE
    assert re.fullmatch(r'[0-9a-f]{40}', source_commit)
    assert created['prebuilt'] is True and created['skipDomain'] is True
    assert created['target'] == created['reportedTarget'] == 'production' and created['candidateInventorySHA256'] == PIN
    assert promotion['passed'] is True and promotion['deploymentId'] == deployment and promotion['candidateInventorySHA256'] == PIN
    assert promotion['sameVerifiedDeployment'] is True and promotion['rebuild'] is False
    for phase in ['isolated', 'gate', 'postpromotion']:
        assert native[phase]['deployment']['id'] == deployment and native[phase]['candidateInventorySHA256'] == PIN
        assert native[phase]['deployment']['meta']['githubCommitSha'] == source_commit
        assert native[phase]['runtimeChangesFromPublishedBaseline'] == 0
    post, before = native['postpromotion'], native['preflight']
    assert post['fullInventory']['matched'] == 1729 and post['fullInventory']['functionFiles'] == 57
    assert post['fullInventory']['functionBundles'] == 7 and {row['id'] for row in post['recentProduction']} == {deployment}
    aliases = post['aliases']
    assert {row['alias'] for row in aliases} == HOSTS and all(row['deploymentId'] == deployment for row in aliases)
    assert post['baseline']['id'] == BASE and post['baseline']['readyState'] == 'READY'
    assert len(post['baselineRollbackEligibility']) == 1 and post['baselineRollbackEligibility'][0]['isRollbackCandidate'] is True
    assert post['projectSettings'] == before['projectSettings'] and post['environmentMetadata'] == before['environmentMetadata']
    assert post['projectSettings']['live'] is False and post['projectSettings']['autoAssignCustomDomains'] is False
    assert post['projectSettings']['previewDeploymentsDisabled'] is True
    assert post['projectSettings']['ssoProtection']['deploymentType'] == 'all_except_custom_domains'
    reference, reference_pictures = validate_reference()
    browser, matrix_pictures = {}, []
    for mode in ['isolated', 'public']:
        browser[mode], pictures = validate_browser(mode, deployment, PIN, inventory)
        matrix_pictures.extend(pictures)
    http = {mode: validate_http(mode, BASE if mode == 'baseline' else deployment, PIN)
            for mode in ['baseline', 'isolated', 'public']}
    manual, manual_pictures = {}, []
    for mode in ['isolated', 'public']:
        manual[mode], pictures = validate_visual(mode, deployment, project_files, nonproject_files)
        manual_pictures.extend(pictures)
    qa_last = max(stamp(browser['public']['finishedAtUtc']), stamp(http['public']['finishedAtUtc']))
    assert stamp(post['finishedAtUtc']) >= qa_last, 'Run the final read-only --postpromotion proof after public HTTP and Chrome finish'
    pr = validate_pr(source_commit)
    source_proof = source_guard_proof(source_commit, pr['head']['sha'], html_paths)
    policy = load('docs/seo-measurement/active-policy.json')
    assert policy['scope_id'] == 'corporate-education-v3' and policy['scope_version'] == 3
    assert policy['measurement_integration']['analyticsScopeURLs'] == 12
    assert (ROOT / 'docs/seo-measurement/active-policy.json').read_bytes() == git_file(BASE_HEAD, 'docs/seo-measurement/active-policy.json')
    closed = datetime.now(timezone.utc)
    apex = next(row for row in aliases if row['alias'] == 'sollahms.cl')
    assigned = datetime.fromtimestamp(apex['updatedAt'] / 1000, timezone.utc)
    assert assigned <= qa_last <= closed
    archive = DOCS / 'history/NEXT-PROMPT-before-20261125.md'
    original_next = git_file(BASE_HEAD, 'NEXT-PROMPT.md')
    current_next = (ROOT / 'NEXT-PROMPT.md').read_bytes()
    if archive.exists():
        assert archive.read_bytes() == original_next
        assert current_next == original_next or (current_next.decode().startswith(NEXT_TITLE) and deployment in current_next.decode())
    else:
        assert current_next == original_next, 'NEXT-PROMPT changed concurrently; preserve the newer text before closing'
    request_path = DOCS / 'REQUEST.md'
    EVIDENCE.append({'path': request_path.relative_to(ROOT).as_posix(), 'bytes': request_path.stat().st_size,
                     'sha256': digest(request_path.read_bytes())})
    self_path = Path(__file__).resolve()
    EVIDENCE.append({'path': self_path.relative_to(ROOT).as_posix(), 'bytes': self_path.stat().st_size,
                     'sha256': digest(self_path.read_bytes())})
    report = {'schemaVersion': 1, 'status': 'published_verified_qa_closed', 'passed': True,
              'deploymentId': deployment, 'sourceCommit': source_commit, 'branch': BRANCH,
              'originalFooterImplementationCommit': BASE_SOURCE, 'baselineDeployment': BASE,
              'baselineSourceHead': BASE_HEAD, 'candidateInventorySHA256': PIN,
              'aliasAssignedAtUtc': assigned.isoformat(), 'aliasAssignedAtAmericaSantiago': chile(assigned),
              'qaClosedAtUtc': closed.isoformat(), 'qaClosedAtAmericaSantiago': chile(closed),
              'publicationMethod': 'One complete Production prebuilt with --skip-domain; exact validated ID promoted without rebuild',
              'newProductionDeployments': 1, 'aliases': aliases, 'previousProductionRetainedForRollback': True,
              'reference': {'officialComponent': 'templates/corporate-footer.html', 'stylesheet': 'assets/css/corporate-footer.css',
                            'precedence': 'Explicit approved corporate component from PR40, identical to the actual homepage',
                            'sourceCommit': BASE_SOURCE, 'baselineDeployment': BASE,
                            'footerTemplateSHA256': audit['footerTemplateSha256'], 'cssSHA256': audit['corporateFooterCssSha256']},
              'audit': {'pagesInspected': 168, 'pagesConformingToOfficialReference': 168, 'newFooterCorrections': 0,
                        'projectFiches': 152, 'exceptionCount': 0, 'exceptions': [],
                        'categoryCounts': audit['categoryCounts'], 'matrix': '../audit-matrix.json'},
              'runtime': {'files': 1729, 'identicalFiles': 1729, 'changedFiles': 0, 'addedFiles': 0, 'removedFiles': 0,
                          'all168HtmlByteIdentical': True, 'all152WholeProjectFichesByteIdentical': True,
                          'functionBundles': 7, 'functionFilesByteIdentical': 57, 'configV3ByteIdentical': True,
                          'buildersOrLegacyGeneratorsExecuted': 0, 'baselineArtifactModified': False},
              'qa': {'officialHomeReference': reference, 'browser': browser, 'http': http, 'manualVisualReviews': manual,
                     'matrixCases': 1680, 'matrixScreenshotsVerified': len(matrix_pictures), 'baselineHomeScreenshots': 5,
                     'nativeFinalChecks': len(post['checks']), 'remoteFilesMatched': 1729,
                     'footerLinks': 11, 'commercialSubmits': 0, 'messagesSent': 0,
                     'motionScope': 'Footer and ancestor opacity in every case; homepage content-motion sample at five widths; other behavior preserved by unchanged bytes',
                     'mapProviderVerified': False, 'realUfLookup': False,
                     'fixtures': 'Explicit map iframe fixtures and API HTTP503/UF fixtures; no real provider test or new UF value',
                     'consent': 'Twelve canonical pages reject optional measurement without SDK/POST; protected-origin matrix has no canonical consent activation'},
              'preservation': {'allRuntimeBytesUnchanged': True, 'seoScope': 'corporate-education-v3 / 12 URLs unchanged',
                               'SEORegistryByteIdentical': True, 'GA4ClarityConsentByteIdentical': True,
                               'projectSettingsAndEnvironmentMetadataUnchanged': True, 'environmentValuesStored': False,
                               'trainingPreferencesUnchanged': True, 'formsAndComparatorsUnchanged': True},
              'searchAndBusinessEvidence': {'Google': 'No new crawl, indexation or position result measured',
                                            'OpenAIChatGPTSearch': 'No mention, link, citation or recommendation measurement performed',
                                            'BingMicrosoftCopilot': 'No Bing/Copilot result effect measured', 'commercialAttribution': False},
              'pullRequest': pr, 'sourceProof': 'source-preservation.json', 'closureManifest': 'closure-manifest.json',
              'pendingFooterIssues': [], 'merges': 0, 'networkCallsByFinalizer': 0, 'gitMutationsByFinalizer': 0,
              'historicalNextPrompt': {'path': archive.relative_to(ROOT).as_posix(), 'bytes': len(original_next), 'sha256': digest(original_next)},
              'observedLocalHeadAtClosure': git('rev-parse', 'HEAD').decode().strip(),
              'documentationRule': 'The published SHA identifies this certification/guard commit; e866ce7 identifies the unchanged footer implementation. Later closure-only commits need no redeploy.',
              'rootFinalDocumentationTasks': ['Update README to completed state', 'Generate final checksums after closing documentation',
                                             'Commit/push documentation only; keep the PR Draft without merging']}
    report['requestedReportItems'] = report_items(report)
    markdown, following, next_text = render_report(report), render_following(report), render_next(report)
    closure_manifest = {'schemaVersion': 1, 'passed': True, 'deploymentId': deployment, 'sourceCommit': source_commit,
                        'candidateInventorySHA256': PIN, 'runtimeChanges': [], 'runtimeIdenticalPaths': sorted(inventory),
                        'sourceGuardProof': source_proof, 'inputEvidence': sorted(EVIDENCE, key=lambda row: row['path']),
                        'matrixScreenshots': sorted(matrix_pictures, key=lambda row: row['path']),
                        'baselineReferenceScreenshots': reference_pictures, 'manualReviewScreenshotEvidence': manual_pictures,
                        'historicalNextPrompt': report['historicalNextPrompt'],
                        'generatedDocumentSHA256': {'INFORME-CIERRE.md': digest(markdown.encode()),
                                                   'SIGUIENTE-PROMPT.md': digest(following.encode()), 'NEXT-PROMPT.md': digest(next_text.encode())},
                        'checksumRule': 'Root writes final checksums after all closure documents; no self-referential checksum or automatic Git mutation'}
    WRITES_STARTED = True
    archive.parent.mkdir(parents=True, exist_ok=True)
    if not archive.exists():
        archive.write_bytes(original_next)
    for name, value in [('source-preservation.json', source_proof), ('closure-manifest.json', closure_manifest), ('publication-closure.json', report)]:
        (RELEASE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    (DOCS / 'INFORME-CIERRE.md').write_text(markdown)
    (DOCS / 'SIGUIENTE-PROMPT.md').write_text(following)
    (ROOT / 'NEXT-PROMPT.md').write_text(next_text)
    print(json.dumps({'status': report['status'], 'deploymentId': deployment, 'publishedSourceCommit': source_commit,
                      'originalFooterImplementationCommit': BASE_SOURCE, 'runtimeChangedFiles': 0,
                      'runtimeIdenticalFiles': 1729, 'conformingPages': 168, 'newFooterCorrections': 0,
                      'matrixCases': 1680, 'matrixScreenshotsVerified': len(matrix_pictures),
                      'reportItems': len(report['requestedReportItems']), 'aliasAssignedAtAmericaSantiago': chile(assigned),
                      'qaClosedAtAmericaSantiago': chile(closed), 'gitMutations': 0, 'networkCalls': 0}), flush=True)


def report_items(r):
    public_http = r['qa']['http']['public']['summary']
    native = r['qa']['nativeFinalChecks']
    return [
        {'number': 1, 'title': 'Referencia oficial y justificación', 'result': 'Componente explícito aprobado templates/corporate-footer.html y su CSS, publicado en PR40; coincide con Inicio actual. La referencia explícita y vigente tiene precedencia. Se capturó Inicio en cinco anchos y se contrastó el HTTP actual.'},
        {'number': 2, 'title': 'Total de páginas inspeccionadas', 'result': '168 HTML públicos auditados individualmente, incluidas 152 fichas; matriz completa audit-matrix.json, sin limitarse a una muestra.'},
        {'number': 3, 'title': 'Total de páginas homologadas', 'result': '168 páginas conformes con el footer oficial. Ya eran conformes al iniciar este encargo: cero nuevas correcciones. El total conforme se distingue de los archivos modificados.'},
        {'number': 4, 'title': 'Excepciones justificadas', 'result': 'Cero excepciones al pie corporativo en el inventario actual. Ningún contenido específico, legal o comercial fue eliminado; todos los HTML completos se conservaron.'},
        {'number': 5, 'title': 'Cambios realizados', 'result': 'Ningún cambio de runtime, HTML, CSS, contenidos o diseño. Se auditó y certificó nuevamente el componente existente, se añadió el guard false de esta rama en vercel.json y se generó documentación. Se publicó el paquete íntegro validado con los mismos bytes por autorización expresa.'},
        {'number': 6, 'title': 'Archivos modificados', 'result': 'Runtime: 0 modificados, 0 añadidos y 0 eliminados; 1.729 archivos idénticos a ADQD. Fuente: únicamente el guard de vercel.json, documentación de esta fase y NEXT-PROMPT. Inventarios completos y hashes en candidate-manifest.json, release/source-preservation.json y release/closure-manifest.json.'},
        {'number': 7, 'title': 'Pruebas responsive', 'result': '1440, 1280, 768, 390 y 320 px: 840 casos en el Production aislado y 840 en público, con 1.680 capturas verificadas. Hay cinco capturas de referencia de Inicio adicionales. Las revisiones visuales manuales por categoría están registradas por separado; no se confunden con los casos automatizados.'},
        {'number': 8, 'title': 'Pruebas funcionales', 'result': 'Once destinos/anclas, logo, correo, teléfono +56 9 4850 2440 y WhatsApp wa.me/56948502440 con consulta aprobada, sin enviar mensajes. Funciones: siete bundles/57 archivos íntegros y registrados. Formularios, comparadores y herramientas conservan todos sus bytes; no hubo envíos ni pruebas reales de proveedores. Motion del contenido principal se muestrea únicamente en Inicio a cinco anchos; pie estático y sin desvanecimiento ancestral en cada caso.'},
        {'number': 9, 'title': 'Preservación SEO/GEO', 'result': 'Todos los HTML completos, títulos, metadescripciones, canonical, datos estructurados, textos, enlaces, formularios, sitemap y robots son idénticos. Alcance corporativo v3 de doce URL, GA4/Clarity, consentimiento y preferencias de entrenamiento intactos. Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot se mantienen separados: no se acreditan nuevos resultados de búsqueda, IA o negocio.'},
        {'number': 10, 'title': 'SHA del commit publicado', 'result': f"{r['sourceCommit']} identifica la nueva certificación, documentación y guard. La implementación del footer procede de {BASE_SOURCE} y no se modificó. Los commits finales de cierre posteriores son documentales y no requieren otro deployment."},
        {'number': 11, 'title': 'Deployment anterior y nuevo', 'result': f"Anterior: {BASE}, conservado READY/Production y elegible para rollback. Nuevo: {r['deploymentId']}, READY/Production/prebuilt; se promovió el mismo ID comprobado sin reconstruir."},
        {'number': 12, 'title': 'Fecha y hora de publicación', 'result': f"Asignación del alias canónico: {r['aliasAssignedAtAmericaSantiago']}, America/Santiago. Cierre de QA: {r['qaClosedAtAmericaSantiago']}; no se confunden ambos momentos."},
        {'number': 13, 'title': 'Dominio en producción', 'result': f"Los cinco aliases, incluido sollahms.cl, apuntan a {r['deploymentId']}. www.sollahms.cl y sollhams.cl conservan 308 hacia sollahms.cl; dominios técnicos mantienen SSO. Fechas de creación, configuración y metadatos de variables preservados."},
        {'number': 14, 'title': 'Evidencias post-publicación', 'result': f"HTTP público: {public_http['passedRequests']}/{public_http['plannedRequests']} GET, 168 HTML y 168 comparaciones de contenido exterior/principal; TLS válido. Chrome público: 840/840 y capturas SHA256. Comprobación nativa final: {native} controles y 1.729 archivos remotos. Revisiones manuales, matrices, recibos y hashes enlazados en el manifiesto de cierre."},
        {'number': 15, 'title': 'Incidencias pendientes', 'result': 'Ninguna incidencia pendiente dentro del alcance del footer después de las pruebas. Los mapas externos se aislaron como fixtures y la API/UF como respuestas503: no se certificaron esos proveedores ni un valor UF. No se probaron entregas comerciales ni SDK opcionales; las doce páginas canónicas rechazaron opcionales sin SDK/POST. No se atribuyen efectos de búsqueda o negocio.'}
    ]


def render_report(r):
    items = '\n\n'.join('## ' + str(item['number']) + '. ' + item['title'] + '\n\n' + item['result'] for item in r['requestedReportItems'])
    aliases = '\n'.join('- `' + a['alias'] + '` → `' + a['deploymentId'] + '`' +
                        ('; 308 hacia `sollahms.cl`.' if a['redirect'] else '.') for a in r['aliases'])
    manual = '\n'.join('- ' + mode + ': ' + str(value['reviewCount']) + ' revisiones manuales sobre ' +
                       str(value['pages']) + ' páginas; anchos ' + ', '.join(map(str, value['widths'])) + ' px.'
                       for mode, value in r['qa']['manualVisualReviews'].items())
    return f'''# SOLLAHMS — homologación global certificada y publicada, 25/11/2026

Las **168 páginas públicas** comparten la referencia corporativa oficial. La auditoría actual comprobó que ya estaban conformes: **cero nuevas correcciones de footer y 1.729 archivos de runtime idénticos** a la producción que servía el dominio al comenzar. Las 152 fichas conservan íntegramente sus HTML, incluidos los propios footers; no se diseñó un componente nuevo.

La nueva publicación autorizada quedó asignada el **{r['aliasAssignedAtAmericaSantiago']}** y el QA se cerró el **{r['qaClosedAtAmericaSantiago']}**, America/Santiago. La nueva fuente publicada `{r['sourceCommit']}` identifica la certificación y el guard documental de esta rama. La implementación del footer sigue siendo `{BASE_SOURCE}`.

{items}

## Dominios, método y evidencia

{aliases}

El paquete completo conserva el pin `{PIN}`. Se creó un único Production prebuilt sin dominios y se promovió el mismo ID validado, sin rebuild. `live=false`, autoasignación false, previews automáticas deshabilitadas y SSO `all_except_custom_domains` siguen intactos. El deployment anterior ADQD queda disponible para recuperación; no se ejecutó rollback.

La matriz responsive usa **1440, 1280, 768, 390 y 320 px**. Se realizaron dos matrices completas de 840 casos; los archivos se compararon también por hashes completos. La referencia actual de Inicio tiene cinco capturas propias. El área inferior móvil aprobada ya existía y se conserva; no se añadió margen nuevo.

{manual}

Las revisiones manuales se basan en inspección real de imágenes por categorías y están separadas de los 1.680 casos automatizados. Los registros de errores esperados 404/410 y fixtures 503 permanecen diferenciados de errores inesperados. Ningún resultado READY por sí solo se utilizó como prueba de éxito.

`audit-matrix.json` registra cada página; `candidate-manifest.json` y `html-preservation.json` registran la identidad íntegra. Los recibos de autorización/creación/promoción, las verificaciones nativas, las tres pruebas HTTP y las dos matrices Chrome se identifican por hash en `release/closure-manifest.json`. `release/publication-closure.json` conserva este cierre estructurado y los quince puntos solicitados.

El estudio SEO/GEO del 25 y 29 de octubre, `STRATEGY-v3.md`, el registro de doce URL y sus exclusiones se preservan. Publicar nuevamente los mismos bytes no prueba rastreo, indexación, posiciones, citas IA ni resultados comerciales. La política estratégica anterior se conserva como antecedente; el estado productivo de esta intervención se documenta aquí.

El [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) sigue abierto en Draft, sin merge. El NEXT anterior se conserva byte por byte en `history/NEXT-PROMPT-before-20261125.md`; el NEXT actual y `SIGUIENTE-PROMPT.md` describen el estado nuevo. El agente raíz completa README/checksums y el commit documental final, sin otro deployment ni fusión.
'''


def render_next(r):
    return f'''{NEXT_TITLE}

Encargo completado: **168 páginas inspeccionadas y conformes; cero nuevas correcciones**. Se publicó el candidato íntegro autorizado con los mismos 1.729 archivos que la producción anterior, incluidos los HTML completos de las 152 fichas. No queda una publicación pendiente por este encargo.

- Production vigente certificado: `{r['deploymentId']}`, READY/prebuilt; [sitio público](https://sollahms.cl/).
- SHA publicado de esta fase: `{r['sourceCommit']}`; rama `{BRANCH}`; [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) abierto en Draft, sin merge.
- Implementación original del footer conservada: `{BASE_SOURCE}`. El nuevo SHA identifica la certificación, documentación y guard de rama; no un cambio de runtime.
- Pin íntegro de 1.729 archivos: `{PIN}`; 168 HTML, 152 fichas, siete funciones/57 archivos y configuración v3 idénticos a la base.
- Base actual utilizada y conservada para rollback: `{BASE}`; HEAD documental conciliado `{BASE_HEAD}`. No se usó main histórico ni se repuso el paquete GCS anterior.
- Asignación productiva: **{r['aliasAssignedAtAmericaSantiago']}**; cierre QA: **{r['qaClosedAtAmericaSantiago']}**, America/Santiago.
- Dos matrices Chrome de 840 casos/840 capturas en 1440/1280/768/390/320 px, referencia actual de Inicio a cinco anchos, HTTP de 168 HTML antes/aislado/después, revisión manual por categorías y control nativo final de los 1.729 archivos/cinco aliases.

Leer `AGENTS.md`, [informe con los quince puntos](docs/footer-global-20261125/INFORME-CIERRE.md), [cierre JSON](docs/footer-global-20261125/release/publication-closure.json), [manifiesto](docs/footer-global-20261125/release/closure-manifest.json), [matriz individual](docs/footer-global-20261125/audit-matrix.json) y [prompt completo](docs/footer-global-20261125/SIGUIENTE-PROMPT.md). El NEXT anterior queda en `docs/footer-global-20261125/history/NEXT-PROMPT-before-20261125.md` como historia, sin alterar sus bytes.

La referencia sigue siendo `templates/corporate-footer.html` y `assets/css/corporate-footer.css`, explícitamente aprobados y coincidentes con la portada actual. Teléfono visible +56 9 4850 2440 y WhatsApp `https://wa.me/56948502440` con consulta aprobada. No se recuperó el eslogan retirado ni se cambió diseño, contenido, formularios, cálculos, datos, funciones, sitemap, robots, consentimiento o configuración productiva.

Mapas y API/UF se aislaron mediante fixtures explícitas; no se acreditó el proveedor externo ni un nuevo valor UF. El motion principal se comprobó únicamente en Inicio a cinco anchos; pie estático y sin desvanecimiento ancestral en los 840 casos de cada fase. Las doce páginas canónicas rechazaron opcionales sin SDK/POST; no se enviaron formularios ni mensajes. No se atribuyen efectos de búsqueda, IA o negocio.

Para SEO/GEO o nuevas publicaciones, partir de `docs/seo-measurement/STRATEGY-v3.md`, estudios del 25 y 29 de octubre, `active-policy.json` y evidencia actual. Mantener separadas las pruebas de Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot, alcance corporativo v3 de doce URL y exclusiones.

Antes de cualquier acción futura, reconsultar producción, cinco aliases, HEAD y PR remotos y conciliar novedades. Los commits finales de cierre pueden ser posteriores al SHA publicado y no requieren otro deployment. Esta autorización ya se ejecutó y no se extiende a trabajos nuevos o merges. Sin un encargo nuevo, informar el cierre y conservar el sitio.
'''


def render_following(r):
    return f'''# Prompt completo de continuidad — footer certificado el 25/11/2026

El encargo de auditoría, homologación al 100 % y publicación autónoma está terminado. Las 168 páginas ya eran conformes y se acreditó nuevamente su estado sin cambiar runtime: 1.729 archivos idénticos, cero nuevas correcciones. Production `{r['deploymentId']}`, SHA publicado `{r['sourceCommit']}`, pin `{PIN}`; rama `{BRANCH}`, [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) abierto en Draft, sin merge. Asignación {r['aliasAssignedAtAmericaSantiago']}; cierre QA {r['qaClosedAtAmericaSantiago']}, America/Santiago.

1. Leer `AGENTS.md`, `NEXT-PROMPT.md`, `docs/footer-global-20261125/REQUEST.md`, `INFORME-CIERRE.md`, `audit-matrix.json`, `candidate-manifest.json` y los JSON de `release/publication-closure.json`, `release/closure-manifest.json` y `release/source-preservation.json` de esta fase. El NEXT anterior está archivado exactamente en `history/NEXT-PROMPT-before-20261125.md`.
2. Consultar producción real en proyecto `project-wrapp` (`prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`), team `team_A9VNIW2f2K1IJpd2pGdvDmEN`. Revisar los cinco aliases, source/HEAD remotos, PR activos y cambios concurrentes antes de actuar. Conservar commits documentales posteriores. No inferir producción desde main.
3. La base real recuperada fue `{BASE}`, source de footer `{BASE_SOURCE}`, HEAD documental `{BASE_HEAD}`. El candidato coincide con sus 1.729 archivos completos y se certificó contra la consulta remota actual. Una caché anterior se usó únicamente para recuperar bytes y se completó hasta coincidir con ADQD; no se publicó un paquete histórico incompleto.
4. Mantener la referencia explícita `templates/corporate-footer.html` y `assets/css/corporate-footer.css`, coincidentes con Inicio y con teléfono +56 9 4850 2440/WhatsApp `https://wa.me/56948502440`. Los 168 HTML y las 152 fichas completos son idénticos, incluidos pies, datos comerciales, metadatos y formularios. No hubo cambios de diseño ni nuevos márgenes. Preservar los once destinos, fuente, logo, motion y responsive.
5. Artefacto certificado en `.vercel/footer-global-20261125/stage/.vercel/output`. Mantener todos los recursos, siete funciones/57 archivos, configuración v3, sitemap, robots, preferencias de entrenamiento, consentimiento y medición. Si falta, recuperar autenticadamente los bytes del deployment real y comprobar el inventario completo; no reconstruir desde main ni desde una producción anterior.
6. QA nuevo: cinco referencias de Inicio y dos matrices completas de 840 casos/840 capturas cada una, en 1440/1280/768/390/320 px. HTTP baseline/isolated/public verifica 168 HTML; hay inspecciones manuales por categoría separadas de la matriz automática. Mapas y API 503/UF fueron fixtures explícitas: no acreditan proveedores o UF real. Motion del contenido principal se muestrea solo en Inicio; el resto se conserva por hashes. Se rechazaron opcionales en doce páginas sin SDK ni POST; cero mensajes o envíos comerciales.
7. Para SEO/GEO y publicaciones, partir siempre de `docs/seo-measurement/STRATEGY-v3.md`, estudios del 25 y 29 de octubre, `active-policy.json` y evidencia actual. Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot se evalúan por separado. Mantener doce URL corporativas y exclusiones; no convertir esta certificación visual en una mejora SEO acreditada. Separar implementación, publicación, rastreo/indexación, búsqueda, citas IA y resultados comerciales.
8. Se creó y promovió un solo Production prebuilt validado, sin reconstruir. El anterior `{BASE}` permanece disponible para rollback, sin ejecutarlo. Cinco aliases y redirects 308, SSO `all_except_custom_domains`, `live=false`, autoasignación false y previews automáticas deshabilitadas intactos. No cambiar secretos, integraciones, DNS o protecciones.
9. La autorización de este encargo ya fue ejecutada; no se extiende a nuevos cambios, publicaciones o fusiones. Los commits finales de cierre son documentales y no requieren volver a desplegar. Con un encargo nuevo, trabajar en checkout independiente desde el estado real conciliado. Sin encargo nuevo, informar el cierre y mantener el sitio intacto.
'''


if __name__ == '__main__':
    try:
        main()
    except (AssertionError, FileNotFoundError, KeyError, ValueError, subprocess.TimeoutExpired) as error:
        trace = error.__traceback__
        while trace and trace.tb_next:
            trace = trace.tb_next
        location = {'file': Path(trace.tb_frame.f_code.co_filename).name, 'line': trace.tb_lineno,
                    'function': trace.tb_frame.f_code.co_name} if trace else None
        print(json.dumps({'status': 'BLOCK', 'reason': str(error) or 'A closure prerequisite failed',
                          'failureLocation': location, 'closureWritePhaseStarted': WRITES_STARTED,
                          'networkCalls': 0, 'gitMutations': 0}), flush=True)
        raise SystemExit(1)
