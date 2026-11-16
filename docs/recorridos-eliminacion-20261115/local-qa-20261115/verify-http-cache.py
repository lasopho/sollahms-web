"""Match new cached HTTP GET evidence to already recovered certified bytes. No network."""
import argparse,hashlib,json
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import unquote,urlsplit

BASE=Path('/private/tmp/sollahms-recorridos-recovery')
DEPLOYMENT='dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi'
PIN='f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
TOOLBAR_BYTES=163
TOOLBAR_SHA256='1ec749d6c1840dd80e5f178a7ebea403951fa9e3bb90e80a4b1be83b311e85cb'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cache',type=Path,default=Path('/private/tmp/sollahms-recorridos-qa/native-cache'))
parser.add_argument('--output',type=Path,default=BASE/'output')
parser.add_argument('--report',type=Path,default=BASE/'http-cache-progress.json')
parser.add_argument('--require-complete',action='store_true')
args=parser.parse_args()
cert=json.loads((BASE/'verification-certified.json').read_text())
assert cert['outputInventorySha256']==PIN
manifest={r['path']:r for r in cert['inventory']}
assert len(manifest)==1660
static=args.output/'static';records=[];failures=[];skipped=Counter();inflight=[];statuses=Counter()
metadata_files=sorted(args.cache.glob('*.json'))
for meta in metadata_files:
 try:
  before=meta.stat();raw=meta.read_bytes();record=json.loads(raw);after=meta.stat()
  if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):inflight.append(meta.name);continue
 except (FileNotFoundError,json.JSONDecodeError):inflight.append(meta.name);continue
 status=record.get('status');statuses[status]+=1
 rawpath=record.get('path','');parsed=urlsplit(rawpath);path=unquote(parsed.path)
 if parsed.scheme or parsed.netloc or not path.startswith('/') or '\\' in path or '\x00' in path or '..' in Path(path).parts:
  failures.append({'metadata_file':meta.name,'failure':'invalid_same_origin_path'});continue
 if record.get('deployment')!=DEPLOYMENT:
  failures.append({'path':path,'failure':'different_deployment'});continue
 if path=='/api' or path.startswith('/api/'):
  skipped['api']+=1;continue
 if status!=200:
  skipped['redirect_or_error_status']+=1;continue
 if record.get('method')!='GET':
  skipped['non_GET']+=1;continue
 rel=path.lstrip('/') or 'index.html';target=static/rel
 if path.endswith('/') and path!='/':target=static/rel/'index.html'
 if not target.is_file() and not Path(rel).suffix:target=static/(rel+'.html')
 if not target.resolve().is_relative_to(static.resolve()) or not target.is_file() or target.is_symlink():
  failures.append({'path':path,'failure':'status200_static_path_not_in_recovered_output'});continue
 relative=target.relative_to(args.output).as_posix();expected=manifest.get(relative)
 if expected is None:
  failures.append({'path':path,'failure':'static_file_not_in_certified_manifest'});continue
 body=meta.with_suffix('.body')
 if not body.is_file():
  inflight.append(meta.name);continue
 try:
  before=body.stat();data=body.read_bytes();after=body.stat()
  if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):inflight.append(meta.name);continue
 except FileNotFoundError:inflight.append(meta.name);continue
 sha=hashlib.sha256(data).hexdigest();source=target.read_bytes()
 exact=data==source
 # Vercel adds this observed, fixed Preview feedback script after the entire
 # certified HTML source. Permit only its exact 163-byte hash at EOF. This
 # classification never changes either cache evidence or recovered source.
 toolbar=(relative.endswith('.html') and len(data)==len(source)+TOOLBAR_BYTES and data[:len(source)]==source and hashlib.sha256(data[len(source):]).hexdigest()==TOOLBAR_SHA256)
 compared=data[:-TOOLBAR_BYTES] if toolbar else data
 checks={'metadata_size':len(data)==record.get('bytes'),'metadata_sha256':sha==record.get('sha256'),'certified_size_after_exact_toolbar_only':len(compared)==expected['size'],'certified_sha256_after_exact_toolbar_only':hashlib.sha256(compared).hexdigest()==expected['sha256'],'body_equals_recovered_source_after_exact_toolbar_only':compared==source,'recovered_source_hash':hashlib.sha256(source).hexdigest()==expected['sha256']}
 if not all(checks.values()):failures.append({'path':path,'static_file':relative,'failure':'http_body_or_metadata_differs','checks':checks});continue
 records.append({'path':path,'static_file':relative,'status':200,'served_bytes':len(data),'served_sha256':sha,'certified_source_bytes':expected['size'],'certified_source_sha256':expected['sha256'],'match':'byte_exact' if exact else 'byte_exact_source_plus_known_vercel_toolbar_suffix','matches_certified_source':True,'toolbar_suffix_bytes':TOOLBAR_BYTES if toolbar else 0})

report={'createdAt':datetime.now(timezone.utc).isoformat(),'deployment':DEPLOYMENT,'certified_output_inventory_sha256':PIN,'cache':str(args.cache),'output':str(args.output),'metadata_files_snapshot':len(metadata_files),'verified_static_200_GETs':len(records),'verified_unique_static_files':len({r['static_file'] for r in records}),'match_counts':dict(Counter(r['match'] for r in records)),'known_toolbar_suffix':{'bytes':TOOLBAR_BYTES,'sha256':TOOLBAR_SHA256,'script_host':'vercel.live','script_path':'/_next-live/feedback/feedback.js','position':'EOF, after entire certified HTML source','evidence_modified':False},'status_counts':dict(statuses),'skipped':dict(skipped),'in_flight_metadata':inflight,'failed_comparisons':len(failures),'failures':failures,'records':records,'network_requests':0,'certified_preparation_repeated':False,'scope':'New HTTP evidence matched to certified deployment bytes; not a substitute for visual, responsive, map or media QA.'}
args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['records','failures','in_flight_metadata']},ensure_ascii=False))
assert not failures,'Some cached HTTP responses differ from the recovered certified artifact; see report.'
assert not (args.require_complete and inflight),'HTTP cache still contains in-flight evidence; see report.'
