#!/usr/bin/env python3
"""Prepare the factual publication closure only after all public QA passes.

No network, Git mutation, push, build, deployment or promotion is implemented.
Input proofs and screenshots are verified before writing any closure document.
The root agent makes the final documentation checksums/commit afterwards.
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
OUTPUT = ROOT / '.vercel/footer-global-home-20261119/stage/.vercel/output'
BASE = 'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn'
BASE_HEAD = '9f43dc0a20dbd8711609ea4e5461eb0aaab8c142'
BASE_SOURCE = 'd7ad0795a561a9b69999b421fd9eef519adfee26'
BASE_PIN = 'f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e'
BRANCH = 'codex/footer-global-home-20261119'
WIDTHS = [1440, 1024, 768, 390, 320]
HOSTS = {'sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app',
         'project-wrapp-lsandoval2-8260s-projects.vercel.app'}
HOOKS = {'scripts/brand_identity.py', 'scripts/project_header_b.py',
         'scripts/build-mortgage-guide.py', 'scripts/build-purchase-stage-guide.py'}
EXTRA_SOURCE = HOOKS | {'assets/css/corporate-footer.css', 'templates/corporate-footer.html',
                        'scripts/corporate_footer.py', 'vercel.json'}
NEXT_TITLE = '# SOLLAHMS — pie corporativo global publicado y verificado'
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
    return load('docs/footer-global-home-20261119/' + relative)


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


def rows_and_pin(manifest, key='inventory'):
    rows = sorted(manifest[key], key=lambda row: row['path'])
    assert len({row['path'] for row in rows}) == len(rows)
    canonical = ''.join(f"{row['path']}\t{row.get('bytes', row.get('size'))}\t{row['sha256']}\n" for row in rows)
    return rows, digest(canonical.encode())


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
    assert all(row['footerStatic'] is True and row['reducedMotionVisible'] is True for row in proof['motion'])
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


def source_allowlist(manifest, source_commit, pr_head):
    html_paths = {path.removeprefix('static/') for path in manifest['htmlPaths']}
    assert len(html_paths) == 168
    allowed = html_paths | EXTRA_SOURCE
    changed = {path.decode() for path in git('diff', '--name-only', '-z', BASE_HEAD, '--').split(b'\0') if path}
    changed |= {path.decode() for path in git('ls-files', '--others', '--exclude-standard', '-z').split(b'\0') if path}
    out_of_scope = sorted(path for path in changed if path not in allowed and path != 'NEXT-PROMPT.md'
                          and not path.startswith('docs/footer-global-home-20261119/'))
    assert not out_of_scope, 'Out-of-scope checkout change: ' + ', '.join(out_of_scope)
    rows = []
    for path in sorted(allowed):
        location = ROOT / path
        assert location.is_file() and not location.is_symlink()
        before = git_file(BASE_HEAD, path, optional=True)
        after = location.read_bytes()
        assert before != after, 'Expected scoped source file has no delta: ' + path
        assert git_file(source_commit, path) == after, 'Runtime authoring source differs from deployed source commit: ' + path
        assert git_file(pr_head, path) == after, 'PR source differs from deployed runtime authoring source: ' + path
        rows.append({'path': path, 'before': None if before is None else {'bytes': len(before), 'sha256': digest(before)},
                     'after': {'bytes': len(after), 'sha256': digest(after)}})
    before_vercel = json.loads(git_file(BASE_HEAD, 'vercel.json'))
    after_vercel = json.loads((ROOT / 'vercel.json').read_text())
    assert after_vercel['git']['deploymentEnabled'][BRANCH] is False
    del after_vercel['git']['deploymentEnabled'][BRANCH]
    assert after_vercel == before_vercel, 'The deployment guard changed unrelated configuration'
    assert git('rev-list', '--merges', BASE_HEAD + '..HEAD').strip() == b'', 'Unexpected merge in this release branch'
    return {'passed': True, 'baselineHead': BASE_HEAD, 'deployedSourceCommit': source_commit,
            'sourceFiles': len(rows), 'htmlFiles': 168, 'authoringHooks': sorted(HOOKS),
            'newSourceFiles': ['assets/css/corporate-footer.css', 'templates/corporate-footer.html', 'scripts/corporate_footer.py'],
            'vercelGuardOnly': True, 'outOfScope': [], 'rows': rows}


def main():
    global WRITES_STARTED
    assert len(sys.argv) == 1, 'This fixed closure helper accepts no arguments'
    manifest = doc('candidate-manifest.json')
    receipt = doc('stage-receipt.json')
    preservation = doc('html-preservation.json')
    implementation = doc('implementation-proof.json')
    authorization = doc('release/authorization.json')
    created = doc('release/created.json')
    promotion = doc('release/promotion-confirmed.json')
    preflight = doc('release/verification/preflight-summary.json')
    isolated = doc('release/verification/isolated-summary.json')
    gate = doc('release/verification/gate-summary.json')
    post = doc('release/verification/postpromotion-summary.json')
    for proof in [preflight, isolated, gate, post]:
        proof_passed(proof)
        assert len(proof['checks']) >= 21 and all(check['passed'] is True for check in proof['checks'])
    rows, pin = rows_and_pin(manifest)
    before_rows, before_pin = rows_and_pin(manifest, 'baselineInventory')
    assert len(rows) == 1729 and len(before_rows) == 1728 and pin == manifest['inventorySHA256']
    assert before_pin == manifest['baselineInventorySHA256'] == BASE_PIN and manifest['baselineDeployment'] == BASE
    assert receipt['passed'] is True and receipt['inventorySHA256'] == pin
    assert manifest['files'] == receipt['files'] == 1729
    assert manifest['changedHtmlFiles'] == receipt['changedHtmlFiles'] == 168
    assert manifest['identicalFiles'] == receipt['identicalFiles'] == 1560
    assert manifest['projectFiches'] == receipt['projectFiches'] == 152
    assert manifest['functionFilesIdentical'] == receipt['functionFilesIdentical'] == 57
    assert len(manifest['functionBundles']) == 7
    assert receipt['buildersOrGeneralGeneratorsExecuted'] == 0 and receipt['sourceArtifactModified'] is False
    inventory, old_inventory = {r['path']: r for r in rows}, {r['path']: r for r in before_rows}
    assert set(inventory) - set(old_inventory) == {'static/assets/css/corporate-footer.css'} and not (set(old_inventory) - set(inventory))
    identical = [path for path in old_inventory if old_inventory[path] == inventory[path]]
    assert len(identical) == 1560 and all(not path.endswith('.html') for path in identical)
    observed_paths = set()
    for path in OUTPUT.rglob('*'):
        assert not path.is_symlink()
        if path.is_file():
            key = path.relative_to(OUTPUT).as_posix()
            body = path.read_bytes()
            observed_paths.add(key)
            assert key in inventory and len(body) == inventory[key]['bytes'] and digest(body) == inventory[key]['sha256']
    assert observed_paths == set(inventory)
    assert preservation['passed'] is True and preservation['outsideFooterByteIdentical'] is True
    assert preservation['onlyAdditionalHeadMarkup'] == '/assets/css/corporate-footer.css'
    assert len(preservation['pages']) == 168 and {r['path'] for r in preservation['pages']} == set(manifest['htmlPaths'])
    assert all(row['outsideFooterByteIdentical'] is True and row['footerSha256'] == manifest['footerTemplateSHA256'] for row in preservation['pages'])
    assert implementation['status'] == 'PASS' and implementation['htmlPagesChanged'] == 168
    assert implementation['projectFichesChangedOnlyInFooterAndStylesheetLink'] == 152
    assert implementation['sharedFooterIdenticalOnAllPages'] is True and implementation['singleFooterAndSingleStylesheetOnAllPages'] is True
    assert implementation['outsideFooterAndAddedCssLinkByteIdenticalOnAllPages'] is True
    assert implementation['generatorsExecuted'] == implementation['applicationBuilds'] == 0
    assert implementation['functionsOrDataOrOtherExistingAssetsModified'] is False
    assert authorization['explicitAuthorization'] is True and authorization['productionCreationAuthorized'] is True
    assert authorization['promotionAuthorized'] is True and authorization['publicQaAuthorized'] is True
    assert authorization['maximumNewProductionDeployments'] == 1 and authorization['mergeAuthorized'] is False
    deployment, source_commit = created['deploymentId'], created['sourceCommit']
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+', deployment) and deployment != BASE
    assert re.fullmatch(r'[0-9a-f]{40}', source_commit)
    assert created['prebuilt'] is True and created['skipDomain'] is True
    assert created['target'] == created['reportedTarget'] == 'production' and created['candidateInventorySHA256'] == pin
    assert promotion['passed'] is True and promotion['deploymentId'] == deployment and promotion['candidateInventorySHA256'] == pin
    assert promotion['sameVerifiedDeployment'] is True and promotion['rebuild'] is False
    for proof in [isolated, gate, post]:
        assert proof['candidateInventorySHA256'] == pin and proof['deployment']['id'] == deployment
        assert proof['deployment']['meta']['githubCommitSha'] == source_commit
    assert post['fullInventory']['matched'] == 1729 and post['fullInventory']['functionFiles'] == 57 and post['fullInventory']['functionBundles'] == 7
    assert {row['id'] for row in post['recentProduction']} == {deployment}
    aliases = post['aliases']
    assert {row['alias'] for row in aliases} == HOSTS and all(row['deploymentId'] == deployment for row in aliases)
    assert post['baseline']['id'] == BASE and post['baseline']['readyState'] == 'READY'
    assert len(post['baselineRollbackEligibility']) == 1 and post['baselineRollbackEligibility'][0]['isRollbackCandidate'] is True
    assert post['projectSettings'] == preflight['projectSettings'] and post['environmentMetadata'] == preflight['environmentMetadata']
    assert post['projectSettings']['live'] is False and post['projectSettings']['autoAssignCustomDomains'] is False
    assert post['projectSettings']['previewDeploymentsDisabled'] is True
    assert post['projectSettings']['ssoProtection']['deploymentType'] == 'all_except_custom_domains'
    browser, screenshot_manifest = {}, []
    for mode in ['local', 'isolated', 'public']:
        browser[mode], pictures = validate_browser(mode, deployment, pin, inventory)
        screenshot_manifest.extend(pictures)
    http = {mode: validate_http(mode, deployment, pin) for mode in ['isolated', 'public']}
    qa_last_input = max(stamp(browser['public']['finishedAtUtc']), stamp(http['public']['finishedAtUtc']))
    assert stamp(post['finishedAtUtc']) >= qa_last_input, 'Run the read-only --postpromotion check again after public QA completes'
    pr = validate_pr(source_commit)
    source_proof = source_allowlist(manifest, source_commit, pr['head']['sha'])
    policy = load('docs/seo-measurement/active-policy.json')
    assert policy['scope_id'] == 'corporate-education-v3' and policy['scope_version'] == 3
    assert policy['measurement_integration']['analyticsScopeURLs'] == 12
    assert (ROOT / 'docs/seo-measurement/active-policy.json').read_bytes() == git_file(BASE_HEAD, 'docs/seo-measurement/active-policy.json')
    for path in ['static/config.json', 'static/assets/css/site-measurement.css', 'static/assets/js/site-measurement.mjs',
                 'static/data/site-measurement.json', 'static/robots.txt', 'static/sitemap.xml']:
        if path == 'static/config.json':
            path = 'config.json'
        assert inventory[path] == old_inventory[path]
    closed = datetime.now(timezone.utc)
    apex = next(row for row in aliases if row['alias'] == 'sollahms.cl')
    assigned = datetime.fromtimestamp(apex['updatedAt'] / 1000, timezone.utc)
    assert assigned <= qa_last_input <= closed
    old_next = (ROOT / 'NEXT-PROMPT.md').read_bytes()
    archive = DOCS / 'history/NEXT-PROMPT-before-global-footer-20261119.md'
    baseline_next = git_file(BASE_HEAD, 'NEXT-PROMPT.md')
    if archive.exists():
        archived_next = archive.read_bytes()
        assert archived_next == baseline_next
        assert old_next == baseline_next or (old_next.decode().startswith(NEXT_TITLE) and deployment in old_next.decode())
    else:
        assert old_next == baseline_next, 'NEXT-PROMPT changed concurrently; preserve it before closing'
        archived_next = old_next
    EVIDENCE.append({'path': Path(__file__).resolve().relative_to(ROOT).as_posix(), 'bytes': Path(__file__).stat().st_size,
                     'sha256': digest(Path(__file__).read_bytes())})
    report = {'schemaVersion': 1, 'status': 'published_verified_qa_closed', 'passed': True,
              'deploymentId': deployment, 'sourceCommit': source_commit, 'branch': BRANCH,
              'baselineDeployment': BASE, 'baselineSourceCommit': BASE_SOURCE, 'baselineSourceHead': BASE_HEAD,
              'baselineInventorySHA256': BASE_PIN, 'candidateInventorySHA256': pin,
              'aliasAssignedAtUtc': assigned.isoformat(), 'aliasAssignedAtAmericaSantiago': chile(assigned),
              'qaClosedAtUtc': closed.isoformat(), 'qaClosedAtAmericaSantiago': chile(closed),
              'timeDistinction': 'Assignment time comes from the apex alias; closure time follows all passing public QA and the final connected native read.',
              'publicationMethod': 'One complete certified prebuilt Production with --skip-domain, then promotion of the same verified ID; no rebuild',
              'newProductionDeployments': 1, 'aliases': aliases, 'previousProductionRetainedForRollback': True,
              'runtime': {'files': 1729, 'htmlPagesChanged': 168, 'projectFiches': 152,
                          'projectContentOutsideFooterAndAddedCssLinkPreserved': True,
                          'wholeFicheBytesUnchanged': False, 'identicalExistingNonHtmlFiles': 1560,
                          'addedFiles': ['static/assets/css/corporate-footer.css'], 'functionBundles': 7,
                          'functionFilesByteIdentical': 57, 'dataAndExistingAssetsByteIdentical': True,
                          'configV3ByteIdentical': True, 'robotsAndSitemapByteIdentical': True,
                          'footerTemplateSHA256': manifest['footerTemplateSHA256'],
                          'buildersOrLegacyGeneratorsExecuted': 0, 'baselineArtifactModified': False},
              'responsiveAdjustment': implementation.get('necessaryPresentationAdjustment'),
              'qa': {'browser': browser, 'http': http, 'browserCasesTotal': 2520, 'verifiedScreenshots': len(screenshot_manifest),
                     'nativePostpromotionChecks': len(post['checks']), 'nativeRemoteFilesMatched': 1729,
                     'allFooterDestinationsValidated': 11, 'commercialSubmits': 0, 'messagesSent': 0,
                     'motionScope': 'Footer static and no ancestor fade: all 840 cases in each phase. Main-content motion/reduced motion: homepage sample at five widths only; other pages preserved by unchanged source bytes/scripts/CSS, not a new global motion test.',
                     'externalMapProvidersVerified': False, 'maps': 'Explicit nonnetworking iframe fixtures; original markup and source kept',
                     'uf': 'Explicit API HTTP503 fixtures; no real UF lookup or new value certified',
                     'consent': 'Twelve fresh reject-all cases in local and public QA; no optional SDK scripts/requests or POST. Protected-host QA has no canonical-origin consent activation.'},
              'preservation': {'SEO_SCOPE': 'corporate-education-v3 / 12 URLs unchanged', 'analyticsScopeURLs': 12,
                               'seoRegistryByteIdentical': True, 'GA4AndClarityConfigurationByteIdentical': True,
                               'consentImplementationByteIdentical': True, 'trainingPreferencesUnchanged': True,
                               'projectSettingsAndEnvironmentMetadataUnchanged': True},
              'searchAndBusinessEvidence': {'Google': 'No new crawling, indexing, ranking or result effect measured for this presentation change',
                                            'OpenAIChatGPTSearch': 'No AI query, mention, citation, link or recommendation measurement performed',
                                            'BingMicrosoftCopilot': 'No Bing or Copilot result effect measured',
                                            'commercialResultAttributed': False},
              'pullRequest': pr, 'merges': 0, 'gitMutationsByFinalizer': 0, 'networkCallsByFinalizer': 0,
              'sourceAllowlistManifest': 'source-preservation.json', 'evidenceManifest': 'closure-manifest.json',
              'historicalNextPrompt': {'path': archive.relative_to(ROOT).as_posix(), 'bytes': len(archived_next), 'sha256': digest(archived_next)},
              'observedLocalHeadAtClosure': git('rev-parse', 'HEAD').decode().strip(),
              'documentationCommitRule': 'A final documentation-only commit may follow the deployed source commit; it does not require another deployment',
              'rootFinalDocumentationTasks': ['Generate final SHA256SUMS after all documents are closed',
                                             'Commit and push documentation only; keep the PR Draft and do not merge']}
    body = render_report(report)
    following = render_following(report)
    next_prompt = render_next(report)
    closure_manifest = {'schemaVersion': 1, 'passed': True, 'deploymentId': deployment, 'sourceCommit': source_commit,
                        'candidateInventorySHA256': pin, 'runtimeChanges': manifest['changes'],
                        'runtimeIdenticalPaths': sorted(identical), 'sourceFiles': source_proof['rows'],
                        'inputEvidence': sorted(EVIDENCE, key=lambda row: row['path']),
                        'screenshots': sorted(screenshot_manifest, key=lambda row: row['path']),
                        'historicalNextPrompt': report['historicalNextPrompt'],
                        'generatedDocumentSHA256': {'INFORME-CIERRE.md': digest(body.encode()),
                                                   'SIGUIENTE-PROMPT.md': digest(following.encode()),
                                                   'NEXT-PROMPT.md': digest(next_prompt.encode())},
                        'checksumRule': 'Root generates final checksums after this JSON and all closure files are written; no self-referential hash or automatic Git mutation'}
    # All input assertions precede these writes. No network/Git mutation follows.
    WRITES_STARTED = True
    archive.parent.mkdir(parents=True, exist_ok=True)
    if not archive.exists():
        archive.write_bytes(archived_next)
    (RELEASE / 'source-preservation.json').write_text(json.dumps(source_proof, ensure_ascii=False, indent=2) + '\n')
    (RELEASE / 'closure-manifest.json').write_text(json.dumps(closure_manifest, ensure_ascii=False, indent=2) + '\n')
    (RELEASE / 'publication-closure.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    (DOCS / 'INFORME-CIERRE.md').write_text(body)
    (DOCS / 'SIGUIENTE-PROMPT.md').write_text(following)
    (ROOT / 'NEXT-PROMPT.md').write_text(next_prompt)
    print(json.dumps({'status': report['status'], 'deploymentId': deployment, 'artifactPin': pin,
                      'publicBrowserCasesPassed': 840, 'publicHtmlHTTPVerified': 168,
                      'screenshotsVerified': len(screenshot_manifest), 'sourceFiles': source_proof['sourceFiles'],
                      'aliasAssignedAtAmericaSantiago': chile(assigned), 'qaClosedAtAmericaSantiago': chile(closed),
                      'gitMutations': 0, 'networkCalls': 0}), flush=True)


def render_report(r):
    aliases = '\n'.join('- `' + row['alias'] + '` → `' + row['deploymentId'] + '`' +
                        ('; 308 hacia `sollahms.cl`.' if row['redirect'] else '.') for row in r['aliases'])
    phases = '\n'.join('| ' + mode + ' | 840/840 | 168 | 840 | ' + str(r['qa']['browser'][mode]['consentRejectCases']) + ' |'
                       for mode in ['local', 'isolated', 'public'])
    http = '\n'.join('- ' + mode + ': ' + str(r['qa']['http'][mode]['summary']['passedRequests']) +
                     ' GET aprobados; 168 HTML y 168 comparaciones exteriores al pie; 11 destinos/anclas.' for mode in ['isolated', 'public'])
    return f'''# SOLLAHMS — cierre del pie corporativo global publicado

Las 168 páginas públicas comparten el pie de la portada: contenido corporativo, logotipo, contacto, WhatsApp, navegación y enlaces legales. Se unificaron diez implementaciones anteriores. Las 152 fichas conservan su contenido fuera del pie y del enlace CSS añadido; sus archivos HTML completos cambiaron.

La asignación de dominios quedó registrada el **{r['aliasAssignedAtAmericaSantiago']}**, America/Santiago. El QA público y el cierre documental se completaron el **{r['qaClosedAtAmericaSantiago']}**. Son momentos distintos.

- Production definitivo: `{r['deploymentId']}`, READY/prebuilt.
- Source de implementación publicado: `{r['sourceCommit']}`; rama `{BRANCH}`.
- Base productiva preservada para rollback: `{BASE}`, source `{BASE_SOURCE}`; continuidad Git `{BASE_HEAD}`. La base se publicó el 19/11 a las 16:56:11.782, America/Santiago.
- Inventario: `{r['candidateInventorySHA256']}`; base `{BASE_PIN}`.
- [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) abierto en Draft, sin merge. Los commits posteriores de documentación no requieren otro deployment.

## Cambio y preservación

El artefacto contiene 1.729 archivos: 168 HTML modificados, una hoja `corporate-footer.css` nueva y 1.560 archivos existentes no HTML idénticos. Se conservan siete funciones/57 archivos, datos de los 152 proyectos, recursos previos, configuración v3, robots, sitemap, medición consentida y preferencias de entrenamiento. El manifiesto compara SHA1/SHA256, tamaños y todos los paths; la fuente publicada y el paquete productivo anterior quedan recuperables.

La comparación de los 168 documentos acredita igualdad de los bytes exteriores al pie, permitiendo únicamente el enlace a la nueva hoja CSS. No acredita igualdad de los HTML completos de las fichas. Se utiliza una plantilla compartida y un helper final; cuatro hooks de autoría impiden que una regeneración posterior restaure pies distintos. Se añade únicamente el guard de despliegue automático de esta rama. No se ejecutaron builds generales, generadores históricos ni reconstrucciones desde main.

Se mantiene la composición, la fuente local, la identidad y los once destinos del pie de Inicio. En anchos inferiores a 1.024 px se reservan 48 px adicionales de espacio inferior (80 px en total) para que el launcher de privacidad no cubra los enlaces; el ajuste se aplica a todas las páginas y no cambia el widget de consentimiento. El escritorio conserva 32 px. El resto de la geometría se contrasta con la referencia de Inicio y con el pie común.

## Validación

Anchos: 1440, 1024, 768, 390 y 320 px. Se verificaron componente único, textos, logotipo, fuentes, colores, alineación, enlaces, activación de WhatsApp sin navegación externa ni mensajes, ausencia de overflow del pie/contenedores vacíos e interacción con consentimiento. El pie estático y sin desvanecimiento ancestral se prueba en los 840 casos de cada fase. Motion/reduced motion del contenido principal se comprueba únicamente en una muestra de Inicio en los cinco anchos; para las demás páginas se acredita preservación por los bytes exteriores al pie y scripts/CSS intactos, sin afirmar una nueva prueba global de motion.

| Fase Chrome | Casos aprobados | Páginas | Capturas verificadas | Rechazar opcionales |
|---|---:|---:|---:|---:|
{phases}

Las tres matrices totalizan 2.520 casos y 2.520 capturas con SHA256. El hostname protegido no activa la lógica de consentimiento reservada al origen canónico. Local y público comprueban rechazo en las doce páginas incluidas, sin SDK opcionales ni POST.

{http}

La comprobación nativa final aprobó {r['qa']['nativePostpromotionChecks']} controles y los 1.729 archivos remotos; conserva cinco aliases, fechas de creación, redirects, SSO, flags de automatización y metadatos de variables. La autorización produjo exactamente un Production nuevo: se creó sin dominios, se verificó y se promovió el mismo ID, sin reconstruir.

Los iframes de mapas usan fixtures explícitas para la prueba de geometría; se conservaron markup y destinos originales, pero no se verificó el proveedor externo de mapas. Las API usan indisponibilidad 503 de prueba, incluida UF: no se realizaron lookups reales ni se certificó una nueva cifra UF. No hubo formularios, solicitudes comerciales, mensajes, correos, reservas o escrituras CRM. Los hallazgos preexistentes fuera del pie permanecen diferenciados en los resultados de navegador.

## Dominios y recuperación

{aliases}

SSO `all_except_custom_domains`, `live=false`, autoasignación false y previews automáticas deshabilitadas permanecen intactos. `{BASE}` conserva READY/Production y elegibilidad de rollback; no se ejecutó rollback. La configuración productiva v3, los ajustes del proyecto, los metadatos de variables y las siete funciones permanecen iguales; la fuente `vercel.json` incorpora solo el guard false de esta rama.

## Continuidad SEO/GEO y límites

El trabajo sigue el estudio del 25/29 de octubre y `STRATEGY-v3.md`: corrige identidad visible y vías de consulta inconsistentes. La política `corporate-education-v3` y sus doce URL, GA4/Clarity y su consentimiento se conservan. Catálogo/fichas reciben únicamente el cambio visual solicitado expresamente; siguen fuera de optimización SEO/GEO.

Para Google se comprueban HTML y enlaces, sin acreditar rastreo, indexación o posiciones. Para OpenAI/ChatGPT Search no se ejecutaron observaciones ni se acreditan menciones, citas o recomendaciones. Para Bing/Microsoft Copilot no se midió un efecto. Publicar este pie no demuestra mejoras de búsqueda ni resultados comerciales. Los registros SEO anteriores se conservan como antecedentes y no sustituyen el estado productivo documentado aquí.

## Evidencia y siguiente paso

`candidate-manifest.json`, `html-preservation.json`, `implementation-proof.json`, `release/source-preservation.json`, `release/closure-manifest.json`, los recibos de autorización/creación/promoción, las verificaciones nativas y las matrices HTTP/Chrome sustentan el cierre. El NEXT del 16/11 se conserva sin cambios en `history/NEXT-PROMPT-before-global-footer-20261119.md`; `NEXT-PROMPT.md` y `SIGUIENTE-PROMPT.md` describen el estado actual.

El helper no hace push, merge, build, deployment ni cambios Git. El agente raíz genera los checksums finales después de cerrar los documentos y registra el commit documental. Sin un encargo nuevo, no hay otra publicación pendiente.
'''


def render_next(r):
    return f'''{NEXT_TITLE}

El encargo de unificar el pie de todas las páginas está publicado y verificado. Asignación productiva: **{r['aliasAssignedAtAmericaSantiago']}**. Cierre del QA: **{r['qaClosedAtAmericaSantiago']}**, America/Santiago. No repetir publicación ni reconstrucción al retomar este chat.

- Production actual certificado: `{r['deploymentId']}`, READY/prebuilt; [sitio público](https://sollahms.cl/).
- Source de implementación: `{r['sourceCommit']}`; rama `{BRANCH}`; [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) abierto en Draft, sin merge.
- Pin de 1.729 archivos: `{r['candidateInventorySHA256']}`. Se verificaron 168 HTML y 152 fichas; contenido fuera del pie y del enlace CSS nuevo idéntico, 1.560 archivos existentes no HTML idénticos, siete funciones/57 archivos conservados.
- Tres matrices Chrome de 840 casos (1440/1024/768/390/320), dos pruebas HTTP de los 168 HTML y comprobación nativa de los 1.729 archivos, cinco aliases, SSO/configuración y un solo Production nuevo.
- El mismo ID aislado fue promovido sin rebuild. Rollback conservado: `{BASE}`. La base de este encargo fue GCS publicado el 19/11 a las 16:56:11.782 y su HEAD documental `{BASE_HEAD}`; no el deployment histórico del 16/11 ni main.

Leer `AGENTS.md`, [informe de cierre](docs/footer-global-home-20261119/INFORME-CIERRE.md), [cierre verificable](docs/footer-global-home-20261119/release/publication-closure.json), [manifiesto](docs/footer-global-home-20261119/release/closure-manifest.json) y [prompt completo](docs/footer-global-home-20261119/SIGUIENTE-PROMPT.md). El NEXT anterior está preservado exactamente en `docs/footer-global-home-20261119/history/NEXT-PROMPT-before-global-footer-20261119.md` como historia.

La plantilla `templates/corporate-footer.html`, `scripts/corporate_footer.py`, CSS aislado y cuatro hooks mantienen un único pie. Las 152 fichas no son byte-idénticas completas: se conservó lo exterior al pie y al enlace CSS añadido. En móvil/tablet hay 48 px adicionales de área inferior para evitar superposición del control de privacidad; consentimiento y scripts de medición permanecen iguales.

QA usó fixtures explícitas para mapas y respuestas API503/UF; no verificó el proveedor de mapas ni consultó UF real. Pie estático/sin desvanecimiento ancestral: 840 casos por fase; motion principal: muestra de Inicio en cinco anchos, preservación por hashes en las demás páginas. Se rechazaron opcionales en las doce páginas medidas sin SDK/POST; cero envíos comerciales. No se atribuyen posiciones, indexación, citas IA o resultados de negocio.

Para cualquier trabajo SEO/GEO o nueva publicación, partir de `docs/seo-measurement/STRATEGY-v3.md`, estudios del 25/29 de octubre y `active-policy.json`; mantener separado Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot. La política y sus doce URL siguen intactas. Este cambio de presentación tiene su registro actual aquí; los registros estratégicos previos son antecedentes.

Antes de actuar otra vez, reconsultar producción, cinco aliases, HEAD y PR remotos, conciliar cualquier avance posterior y preservar el artefacto completo. Los commits de cierre posteriores al source publicado son documentales y no requieren otro deployment. No reutilizar esta autorización para nuevas publicaciones o fusiones. Sin encargo nuevo, informar el cierre y mantener el sitio intacto.
'''


def render_following(r):
    return f'''# Prompt completo de continuidad — pie corporativo global

Trabaja en Sollahms conservando este estado certificado. El encargo «todas las páginas con el pie de la portada; avanzar autónomamente hasta publicar» terminó: Production `{r['deploymentId']}`, source `{r['sourceCommit']}`, rama `{BRANCH}`, pin `{r['candidateInventorySHA256']}`. Dominios asignados el {r['aliasAssignedAtAmericaSantiago']}; QA cerrado el {r['qaClosedAtAmericaSantiago']}, America/Santiago. [PR #{r['pullRequest']['number']}]({r['pullRequest']['url']}) sigue Draft, sin merge.

1. Leer `AGENTS.md`, `NEXT-PROMPT.md`, `docs/footer-global-home-20261119/INFORME-CIERRE.md`, `release/publication-closure.json`, `release/closure-manifest.json`, `candidate-manifest.json` y `release/source-preservation.json` de esta fase. El NEXT del 16/11 está archivado como historia; no representa producción actual.
2. Antes de cualquier acción, consultar Vercel para proyecto `project-wrapp` (`prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`), team `team_A9VNIW2f2K1IJpd2pGdvDmEN`, cinco aliases y estado real. Consultar HEAD remoto y PR activos. Preservar commits documentales posteriores y cambios nuevos. No reconstruir desde main ni desde el paquete del 16/11.
3. El artefacto certificado está en `.vercel/footer-global-home-20261119/stage/.vercel/output`: 1.729 archivos, 168 HTML con pie común, 152 fichas con contenido exterior al pie preservado, CSS nuevo y 1.560 archivos existentes no HTML idénticos. Mantener siete funciones y sus 57 archivos, datos, robots, sitemap, recursos, cobertura de 34 comunas en 10 regiones, consentimiento y medición. Si falta el paquete, recuperar autenticadamente los bytes del deployment vigente y contrastar el inventario completo.
4. Mantener `templates/corporate-footer.html`, `scripts/corporate_footer.py`, CSS aislado y cuatro hooks finales. No restaurar el eslogan retirado ni otras implementaciones. Los once destinos incluyen correo, WhatsApp, secciones, guías, contacto, colaboración y legales. Mantener el área inferior adicional de 48 px en anchos inferiores a 1024 px, que evita superposiciones del launcher; no cambiar el consentimiento para ajustar el pie.
5. QA certificado: tres matrices del pie de 840 casos y 840 capturas cada una, en 1440, 1024, 768, 390 y 320 px, y dos pruebas HTTP de 168 HTML. El pie estático y sin desvanecimiento ancestral se comprueba en los 840 casos de cada fase. El motion principal se comprueba solo en Inicio a cinco anchos y se preserva por hashes en las demás páginas. Los iframes de mapas y las respuestas API 503/UF fueron fixtures explícitas; no acreditan el proveedor externo o UF real. Se rechazaron opcionales en 12 páginas canónicas sin SDK ni POST. No hubo formularios, correos, reservas, leads o escrituras comerciales.
6. Para SEO/GEO o publicaciones, partir siempre de `docs/seo-measurement/STRATEGY-v3.md`, los estudios del 25 y 29 de octubre, `active-policy.json` y evidencia actual. Google, OpenAI / ChatGPT Search y Bing / Microsoft Copilot se evalúan por separado. Mantener las 12 URL y sus exclusiones; el pie visual de catálogo/fichas no es optimización SEO. Separar implementación, publicación, rastreo/indexación, búsquedas, citas IA y resultados comerciales. No inferir resultados de esta publicación.
7. Se creó un único Production prebuilt sin dominios y se promovió exactamente el mismo ID validado. La versión anterior `{BASE}` permanece disponible para rollback; no ejecutarlo sin motivo nuevo. SSO `all_except_custom_domains`, `live=false`, autoasignación false y previews automáticas deshabilitadas permanecen intactos. No cambiar secretos, integraciones, DNS o protecciones.
8. La autorización de esta intervención ya se ejecutó; no se extiende a nuevos cambios, despliegues o merges. Los commits finales de documentación no requieren un deployment nuevo. Con un nuevo encargo, usar checkout independiente desde el estado real conciliado y aplicar únicamente su alcance autorizado. Sin encargo nuevo, informar el cierre y conservar el sitio.
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
