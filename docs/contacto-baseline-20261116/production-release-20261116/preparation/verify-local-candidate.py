"""Verify existing Contacto candidate bytes only; never recover, copy, build or deploy."""
import hashlib,json,os,subprocess
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116')
OUTPUT=ROOT/'.vercel/contacto-baseline-20261116/preview/.vercel/output'
AREA=ROOT/'.vercel/contacto-production-release-20261116/preparation'
DOCS=ROOT/'docs/contacto-baseline-20261116/production-release-20261116/preparation'
MANIFEST=ROOT/'docs/contacto-baseline-20261116/candidate-manifest.json'
BASE_CERT=ROOT/'docs/recorridos-eliminacion-20261115/local-qa-20261115/production/verification/expected.json'
TOURS=ROOT/'docs/recorridos-eliminacion-20261115/runtime-changes.json'
PIN='de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
BASE_PIN='f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
CONTACTO_SHA='02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1'
os.umask(0o077)
AREA.mkdir(parents=True,exist_ok=True);DOCS.mkdir(parents=True,exist_ok=True)
def digest(b,kind='sha256'):return hashlib.new(kind,b).hexdigest()
def save(name,obj):
 text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
 for directory in [AREA,DOCS]:(directory/name).write_text(text)
def canonical(rows):return digest(''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in sorted(rows,key=lambda r:r['path'])).encode())
manifest=json.loads(MANIFEST.read_text());rows=manifest['inventory'];expected={r['path']:r for r in rows}
baseline=json.loads(BASE_CERT.read_text());old={r['path']:r for r in baseline['inventory']}
failures=[];checks=[];actual=[]
def check(name,ok,detail=None):
 checks.append({'check':name,'pass':bool(ok),'detail':detail})
 if not ok:failures.append({'check':name,'detail':detail})
check('manifest_1660_unique',len(rows)==len(expected)==1660)
check('candidate_manifest_canonical',canonical(rows)==manifest['outputInventorySha256']==PIN)
check('baseline_certificate_canonical',canonical(list(old.values()))==baseline['artifact_inventory_sha256']==BASE_PIN)
check('candidate_target_approved_contacto',manifest['sourceCommit']=='a1f2930475e23ebb87bac1f8443877b06883fe60' and manifest['approvedContactoCommit']=='967d556730e20ef86bae6ecee11ec6152434c8ae')
check('existing_output_present',OUTPUT.is_dir())
if OUTPUT.exists():
 for p in sorted(OUTPUT.rglob('*')):
  if p.is_symlink():check('output_contains_no_symlinks',False,p.relative_to(OUTPUT).as_posix());continue
  if not p.is_file():continue
  b=p.read_bytes();rel=p.relative_to(OUTPUT).as_posix();row={'path':rel,'size':len(b),'sha1':digest(b,'sha1'),'sha256':digest(b)};actual.append(row)
actual_by_path={r['path']:r for r in actual}
check('actual_file_count',len(actual)==1660,{'actual':len(actual),'expected':1660})
check('actual_paths_exact',set(actual_by_path)==set(expected),{'missing':sorted(set(expected)-set(actual_by_path)),'extra':sorted(set(actual_by_path)-set(expected))})
comparisons=[]
for path,want in sorted(expected.items()):
 got=actual_by_path.get(path);match=got==want;comparisons.append({'path':path,'pass':match,'actual':got,'expected':want if not match else None})
check('all_path_size_sha1_sha256_match',all(r['pass'] for r in comparisons))
actual_pin=canonical(actual);check('actual_canonical_inventory',actual_pin==PIN,actual_pin)
same=sum(actual_by_path.get(p)==old[p] for p in old);changes=[p for p in sorted(old) if actual_by_path.get(p)!=old[p]]
check('only_contacto_differs_from_by_uhr',same==1659 and changes==['static/contacto.html'],{'identical':same,'changed_paths':changes})
contacto=actual_by_path.get('static/contacto.html');check('contacto_exact_18655_bytes',bool(contacto and contacto['size']==18655 and contacto['sha256']==CONTACTO_SHA),contacto)
functions=[r for r in actual if r['path'].startswith('functions/')]
check('functions_57_identical_to_by_uhr',len(functions)==57 and all(r==old[r['path']] for r in functions),len(functions))
bundles=[]
for row in functions:
 if not row['path'].endswith('/.vc-config.json'):continue
 p=OUTPUT/row['path'];cfg=json.loads(p.read_text());handler=(p.parent/cfg['handler']).resolve();bundle_files=[r for r in functions if r['path'].startswith(p.parent.relative_to(OUTPUT).as_posix()+'/')]
 ok=cfg['runtime']=='nodejs24.x' and cfg.get('environment')=={} and handler.is_relative_to(p.parent.resolve()) and handler.is_file()
 bundles.append({'bundle':p.parent.relative_to(OUTPUT/'functions').as_posix(),'handler':cfg['handler'],'runtime':cfg['runtime'],'environment_empty':cfg.get('environment')=={},'file_count':len(bundle_files),'pass':ok})
check('seven_bundle_configurations',len(bundles)==7 and sum(r['file_count'] for r in bundles)==57 and all(r['pass'] for r in bundles))
cfg=json.loads((OUTPUT/'config.json').read_text()) if (OUTPUT/'config.json').is_file() else {}
check('effective_config_v3_unchanged',cfg.get('version')==3 and cfg.get('crons')==[] and actual_by_path.get('config.json')==old['config.json'],actual_by_path.get('config.json'))
projects=json.loads((OUTPUT/'static/data/proyectos.json').read_text()) if (OUTPUT/'static/data/proyectos.json').is_file() else []
slugs=[r['slug'] for r in projects];fiche_rows=[]
for slug in slugs:
 path='static/'+slug+'.html';fiche_rows.append({'slug':slug,'path':path,'pass':actual_by_path.get(path)==old.get(path) and path in actual_by_path,'sha256':actual_by_path.get(path,{}).get('sha256')})
check('131_fiches_unchanged',len(slugs)==len(set(slugs))==131 and all(r['pass'] for r in fiche_rows))
check('147_html_pages_preserved',sum(r['path'].startswith('static/') and r['path'].endswith('.html') for r in actual)==147)
tour_rows=[]
for row in json.loads(TOURS.read_text()):
 path=row['file'][len('release/'):];got=actual_by_path.get(path);ok=bool(got and got['size']==row['afterBytes'] and got['sha1']==row['afterSha1'] and got==old.get(path));tour_rows.append({'path':path,'pass':ok,'after_bytes':row['afterBytes'],'after_sha1':row['afterSha1'],'actual_sha256':got.get('sha256') if got else None})
check('66_tour_removal_changes_preserved',len(tour_rows)==66 and all(r['pass'] for r in tour_rows),{'html':sum(r['path'].endswith('.html') for r in tour_rows),'css':sum(r['path'].endswith('.css') for r in tour_rows)})
reconciled=[]
for path in ['static/assets/js/urban-works-model.mjs','static/comparador-hipotecario.html','static/data/urban-development.json']:
 reconciled.append({'path':path,'pass':actual_by_path.get(path)==old.get(path) and path in actual_by_path,'actual':actual_by_path.get(path)})
check('three_reconciled_productive_versions_preserved',all(r['pass'] for r in reconciled))
historical_production=json.loads((ROOT/'docs/recorridos-eliminacion-20261115/production-manifest.json').read_text());historical={r['file'][len('release/'):]:r for r in historical_production}
historical_same=sum(r['sha1']==historical[r['path']]['sha'] and r['size']==historical[r['path']]['size'] for r in old.values())
numeric={'recorridos_vs_historical_9zz':{'total':1660,'changed':66,'identical':historical_same,'reference_deployment':'dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN'},'contacto_vs_by_uhr':{'total':1660,'changed':len(changes),'identical':same,'reference_deployment':'dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5'},'interpretation':'1,594 identical belongs to Recorridos vs9zz. The Contacto candidate changes one file vsByUhr and must preserve1,659. These counts use different baselines; no bytes or authorization are changed to force the older number.'}
check('numeric_discrepancy_explained',historical_same==1594 and same==1659)
context_files=['AGENTS.md','NEXT-PROMPT.md','docs/contacto-baseline-20261116/INFORME-CIERRE.md','docs/contacto-baseline-20261116/CONCILIACION.md','docs/contacto-baseline-20261116/PRESERVACION.md','docs/contacto-baseline-20261116/SIGUIENTE-PROMPT-PUBLICACION.md','docs/contacto-baseline-20261116/qa/README.md','docs/contacto-baseline-20261116/verification/README.md','docs/contacto-baseline-20261116/preview-approval.json','docs/contacto-baseline-20261116/candidate-manifest.json']
context=[]
for rel in context_files:
 b=(ROOT/rel).read_bytes();context.append({'path':rel,'bytes':len(b),'sha256':digest(b)})
git_env=dict(os.environ,GIT_OPTIONAL_LOCKS='0');head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,env=git_env,text=True).strip()
summary={'verifiedAtUTC':datetime.now(timezone.utc).isoformat(),'phase':'Fresh local verification before Production staging','passed':not failures,'checks':checks,'failures':failures,'local_documentation_head':head,'output':str(OUTPUT),'candidate_inventory_sha256':actual_pin,'candidate_files':len(actual),'candidate_bytes':sum(r['size'] for r in actual),'contacto':contacto,'identical_to_by_uhr':same,'runtime_delta_vs_by_uhr':changes,'function_files':len(functions),'function_bundles':len(bundles),'fiche_count':len(slugs),'tour_changes_preserved':sum(r['pass'] for r in tour_rows),'historical_manifest_authorization_flags':{'targetAuthorized':manifest.get('targetAuthorized'),'productionAuthorized':manifest.get('productionAuthorized')},'effective_new_authorization_context':'Parent relayed a new express owner authorization for the complete Contacto release sequence; historical Preview flags are preserved as history. This subtask only verifies local bytes and does not exercise release authorization.','stage_copy_performed':False,'deployment_or_promotion_performed':False,'network_calls':0,'builders_or_generators_executed':0,'historical_suites_repeated':False,'source_or_application_modified':False,'parent_live_baseline_preflight_still_required':True}
save('local-artifact-verification.json',{'summary':summary,'file_comparisons':comparisons,'actual_inventory':actual,'function_bundles':bundles,'fiches':fiche_rows,'tour_preservation':tour_rows,'reconciled_versions':reconciled,'read_context_files':context})
save('local-artifact-summary.json',summary);save('numerical-context.json',numeric)
print(json.dumps(summary,ensure_ascii=False),flush=True)
if failures:raise SystemExit(1)
