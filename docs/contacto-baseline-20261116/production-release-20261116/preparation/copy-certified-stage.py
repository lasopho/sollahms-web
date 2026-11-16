"""Copy verified candidate bytes to isolated Production stage after root preflight. No deploy."""
import hashlib,json,os,shutil
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path('/private/tmp/sollahms-contacto-baseline-20261116')
RUNTIME=ROOT/'.vercel/contacto-production-release-20261116'
AREA=RUNTIME/'preparation';DOCS=ROOT/'docs/contacto-baseline-20261116/production-release-20261116/preparation'
SOURCE=ROOT/'.vercel/contacto-baseline-20261116/preview/.vercel/output'
STAGE=RUNTIME/'stage';OUTPUT=STAGE/'.vercel/output'
PIN='de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
BASELINE='dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5';PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH';TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN'
os.umask(0o077)
def sha(b,kind='sha256'):return hashlib.new(kind,b).hexdigest()
def save(name,j):
 text=json.dumps(j,ensure_ascii=False,indent=2)+'\n'
 for directory in [AREA,DOCS]:(directory/name).write_text(text)
check=json.loads((AREA/'local-artifact-summary.json').read_text());assert check['passed'] and not check['failures'] and check['candidate_inventory_sha256']==PIN
preflight_path=ROOT/'docs/contacto-baseline-20261116/production-release-20261116/preflight-native.json';preflight_bytes=preflight_path.read_bytes();preflight=json.loads(preflight_bytes)
assert preflight['passed'] is True and preflight['settingsModified'] is False and preflight['node']=='v24.22.3' and preflight['cli']=='65.16.0'
assert BASELINE in json.dumps(preflight['productionTarget']),'Live baseline changed; do not copy stage.'
assert not STAGE.exists(),'Do not overwrite an existing stage.'
manifest_path=ROOT/'docs/contacto-baseline-20261116/candidate-manifest.json';manifest_bytes=manifest_path.read_bytes();manifest=json.loads(manifest_bytes);expected={r['path']:r for r in manifest['inventory']}
assert manifest['outputInventorySha256']==PIN and len(expected)==1660
for rel,row in expected.items():
 p=SOURCE/rel;assert p.is_file() and not p.is_symlink();b=p.read_bytes();assert len(b)==row['size'] and sha(b,'sha1')==row['sha1'] and sha(b)==row['sha256']
STAGE.mkdir();(STAGE/'.vercel').mkdir()
shutil.copytree(SOURCE,OUTPUT,symlinks=False)
link={'projectId':PROJECT,'orgId':TEAM,'projectName':'project-wrapp'}
link_path=STAGE/'.vercel/project.json';link_path.write_text(json.dumps(link,indent=2)+'\n')
actual=[]
for p in sorted(OUTPUT.rglob('*')):
 assert not p.is_symlink()
 if p.is_file():
  b=p.read_bytes();row={'path':p.relative_to(OUTPUT).as_posix(),'size':len(b),'sha1':sha(b,'sha1'),'sha256':sha(b)};assert row==expected.get(row['path']);actual.append(row)
assert len(actual)==1660 and {r['path'] for r in actual}==set(expected)
canonical=''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in actual).encode();assert sha(canonical)==PIN
assert json.loads(link_path.read_text())==link
report={'preparedAtUTC':datetime.now(timezone.utc).isoformat(),'phase':'Identical local stage after explicit root go-ahead and live baseline preflight','passed':True,'source_output':str(SOURCE),'stage':str(STAGE),'stage_output':str(OUTPUT),'project_json':str(link_path),'project_binding':link,'project_json_sha256':sha(link_path.read_bytes()),'candidate_inventory_sha256':PIN,'candidate_manifest_file_sha256':sha(manifest_bytes),'copied_files':len(actual),'copied_bytes':sum(r['size'] for r in actual),'all_path_size_sha1_sha256_match':True,'runtime_delta_vs_by_uhr':['static/contacto.html'],'identical_to_by_uhr':1659,'contacto':expected['static/contacto.html'],'function_files':57,'function_bundles':7,'fiches':131,'tour_changes_preserved':66,'preflight_receipt':str(preflight_path.relative_to(ROOT)),'preflight_receipt_sha256':sha(preflight_bytes),'preflight_passed':True,'baseline_confirmed_by_root':BASELINE,'local_verification_receipt_sha256':sha((AREA/'local-artifact-summary.json').read_bytes()),'root_go_ahead_received_before_copy':True,'builds_or_generators_executed':0,'network_calls':0,'deployments_created_or_promoted':0,'project_settings_or_credentials_modified':False,'output_builds_json_added':False,'production_creation_owned_by_parent':True}
save('stage-receipt.json',report);save('stage-inventory.json',{'inventory_sha256':PIN,'files':actual});print(json.dumps(report,ensure_ascii=False),flush=True)
