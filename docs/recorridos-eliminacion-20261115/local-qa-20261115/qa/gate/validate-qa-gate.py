"""Release eligibility from completed QA evidence; never builds or deploys."""
import hashlib, json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = Path('/private/tmp')
RECOVERY = BASE / 'sollahms-recorridos-recovery'
QA = BASE / 'sollahms-recorridos-qa'
SUPP = BASE / 'sollahms-recorridos-supplement'
ACCESS = BASE / 'sollahms-recorridos-access'
DEPLOYMENT = 'dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi'
PIN = 'f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
checks, documents = [], []

def check(name, condition, detail=None):
    checks.append({'check':name, 'pass':bool(condition), 'detail':detail})

def read(path):
    raw = path.read_bytes()
    documents.append({'path':str(path),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    return json.loads(raw)

cert = read(RECOVERY/'verification-certified.json')
inventory = cert['inventory']
actual = []
for entry in inventory:
    path = RECOVERY/'output'/entry['path']
    if path.is_symlink() or not path.resolve().is_relative_to((RECOVERY/'output').resolve()):
        raise RuntimeError('Artifact path is not an isolated regular file')
    raw = path.read_bytes()
    actual.append({'path':entry['path'],'size':len(raw),'sha1':hashlib.sha1(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest()})
    if not all(entry[k]==actual[-1][k] for k in ['size','sha1','sha256']):
        check('artifact:'+entry['path'],False)
paths = {p.relative_to(RECOVERY/'output').as_posix() for p in (RECOVERY/'output').rglob('*') if p.is_file()}
canonical = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(actual,key=lambda r:r['path'])).encode()
artifact_hash = hashlib.sha256(canonical).hexdigest()
check('artifact_inventory', len(actual)==1660 and paths=={r['path'] for r in inventory} and artifact_hash==PIN)
function_rows = [r for r in actual if r['path'].startswith('functions/')]
check('seven_bundles_57_files',len(function_rows)==57 and len({'/'.join(r['path'].split('/')[:3]) for r in function_rows})==7)

projects = json.loads((RECOVERY/'output/static/data/proyectos.json').read_text())
slugs = {p['slug'] for p in projects}
expected = {(s,w) for s in slugs for w in [1440,768,390,320]}
check('source_projects',len(projects)==131 and len(slugs)==131)

core = read(QA/'full-524/responsive-qa.json')
acceptance = read(QA/'full-524/acceptance-summary.json')
rows = core['results']
check('core_524_unique',len(rows)==524 and {(r['slug'],r['width']) for r in rows}==expected)
check('core_acceptance',acceptance.get('releaseQaReady') is True and not acceptance.get('issues') and not acceptance.get('missing') and not acceptance.get('duplicates'))
check('core_read_only',core.get('readOnly') is True and acceptance.get('commercialSubmissions')==0)
check('core_basic_integrity',all(r.get('status')==200 and not r.get('errors') and not r.get('tourElements') and not r.get('tourText') and r.get('overflow',2)<=1 and not r.get('brokenImages') and not r.get('emptySections') and r.get('navigationTargetsExist') is True for r in rows))
check('commercial_fields_524',all(len(r.get('commercialFields',[]))==4 and all(f.get('exists') and f.get('enabled') and f.get('visible') for f in r['commercialFields']) for r in rows))
media_source = read(SUPP/'source-media-inventory.json')
expected_maps = {r['slug']:len(r['media']) for r in media_source['rows']}
check('map_count_476',sum(len(r.get('mapEvidence',[])) for r in rows)==476 and all(len(r.get('mapEvidence',[]))==expected_maps[r['slug']] for r in rows))
check('maps_rendered',all(m.get('ready') and not m.get('errorText') and m.get('mapWidgets',0)>0 and (m.get('canvases',0)>0 or m.get('decodedTiles',0)>0) and m.get('geometry',{}).get('width',0)>0 and m.get('geometry',{}).get('height',0)>0 for r in rows for m in r.get('mapEvidence',[])))
check('published_video_inventory',media_source.get('inspectedExactFiches')==131 and media_source.get('videoReferencesInPublishedFiches')==0 and media_source.get('videoMediaTagsInPublishedFiches')==0 and not media_source.get('runtimeDataVideoReferences'))

header = read(SUPP/'header-footer/header-footer-summary.json')
header_rows = read(SUPP/'header-footer/header-footer-results.json')
check('header_footer_524',header.get('complete') is True and header.get('completedPairs')==524 and header.get('passedPairs')==524 and not header.get('failures'))
check('header_footer_unique_pairs',len(header_rows['results'])==524 and {(r['slug'],r['width']) for r in header_rows['results']}==expected and all(all(v is True for v in r['checks'].values()) for r in header_rows['results']))
check('mobile_menu_18',header.get('mobileMenuTests')==18)
check('header_read_only',header.get('appFilesModified') is False and header.get('mailOrWhatsappActivations')==0 and header.get('formSubmissions')==0)

supplement = read(SUPP/'supplement-results.json')
supp_summary = read(SUPP/'supplement-summary.json')
supp_rows = supplement['rows']
check('supplement_131',len(supp_rows)==131 and {r['slug'] for r in supp_rows}==slugs and supplement.get('complete') is True and not supplement.get('failures'))
check('supplement_no_errors',all(r.get('status')==200 and not r.get('error') and not r.get('errors') and r.get('fieldsUntouched') is True and r.get('consoleCaptureComplete') is True for r in supp_rows))
check('supplement_forms_modes',all(len(r.get('forms',[]))==2 and all(f.get('active')=='true' and f.get('emptyFormRejected') and f.get('consentUnchecked') and all(v.get('exists') and v.get('required') and v.get('enabled') and v.get('visible') and v.get('empty') and v.get('labelled') for v in f.get('fields',[])) for f in r['forms']) for r in supp_rows))
check('supplement_navigation',all(len(r.get('navigation',[]))>=5 and all(n.get('hashMatches') and n.get('targetExists') and n.get('visibleAtDestination') for n in r['navigation']) for r in supp_rows))
check('supplement_read_only',supplement.get('readOnly') is True and supplement.get('submitEventsDispatched')==0)
check('supplement_summary',supp_summary.get('result')=='PASS' and supp_summary.get('complete') is True and supp_summary.get('completedFiches')==131 and supp_summary.get('consoleCompleteFiches')==131 and not supp_summary.get('failures') and supp_summary.get('reportSha256')==hashlib.sha256((SUPP/'supplement-results.json').read_bytes()).hexdigest())
check('plan_comparison_controls',supp_summary.get('planComparisonsOpenedWithTwoDecodedImages')==7 and supp_summary.get('singleSheetComparisonGuardPassed')==1)
check('console_and_commercial_integrity',all(supp_summary.get(k)==0 for k in ['applicationConsoleErrors','applicationConsoleWarnings','unclassifiedConsoleMessages','formSubmitEventsDispatched','commercialRequestsForwarded','unexpectedRequestsBlocked']) and supp_summary.get('fieldsRemainedEmptyAllFiches') is True and supp_summary.get('appFilesModified') is False)

warm = read(RECOVERY/'warm-http/warm-progress.json')
http = read(RECOVERY/'http-cache-after-warm.json')
check('http_resources_1485',warm.get('final') is True and warm.get('planned')==1485 and warm.get('completed')==1485 and warm.get('failed')==0 and warm.get('mutating_requests')==0)
check('http_matches_artifact',http.get('failed_comparisons')==0 and http.get('certified_output_inventory_sha256')==PIN and not http.get('in_flight_metadata'))
endpoints = read(ACCESS/'endpoints-results.json')
check('seven_functions_safe_methods',endpoints.get('all_pass') is True and endpoints.get('deployment')==DEPLOYMENT and len([r for r in endpoints['records'] if r['path'].startswith('/api/') and r['path']!='/api/contact.mjs'])==7 and endpoints.get('mutating_requests')==0)

failed = [c for c in checks if not c['pass']]
result = {'previewDeployment':DEPLOYMENT,'validatedAt':datetime.now(ZoneInfo('America/Santiago')).isoformat(),'artifactInventorySha256':artifact_hash,'artifactFiles':1660,'functionFiles':57,'functionBundles':7,'runtimeChanges':66,'runtimePreserved':1594,'eligibleForProductionPreparation':not failed,'failures':failed,'checks':checks,'evidenceFiles':documents,'runtimeModifiedByGate':False,'buildOrDeployExecuted':False,'notes':['Known fullscreen attribute parser warning is documented; optional telemetry/toolbar blocks are classified separately.','No published project video existed; internal research references were preserved.','Production creation and promotion still require target/coordination checks and a verified isolated Production deployment.']}
(ACCESS/'qa-gate.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['eligibleForProductionPreparation','artifactInventorySha256','artifactFiles','failures','validatedAt']},ensure_ascii=False))
raise SystemExit(0 if not failed else 1)
