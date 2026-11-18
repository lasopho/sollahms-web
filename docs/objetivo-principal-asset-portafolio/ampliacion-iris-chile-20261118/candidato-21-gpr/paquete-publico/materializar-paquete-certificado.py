#!/usr/bin/env python3
"""Copy already certified bytes only; no builds, application generators or fetches."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import threading

ROOT=Path('/private/tmp/sollahms-pr36-public-package-20261118')
REPO=Path('/private/tmp/sollahms-ampliacion-21-gpr-20261118')
OUTPUT=ROOT/'stage/.vercel/output'
PLAN=ROOT/'PLAN-RECUPERACION-BASE875.json'

def digests(body):return {'size':len(body),'sha1':hashlib.sha1(body).hexdigest(),'sha256':hashlib.sha256(body).hexdigest()}
def target_path(relative):
    p=PurePosixPath(relative)
    assert not p.is_absolute() and '..' not in p.parts
    assert relative=='config.json' or relative.startswith(('static/','functions/'))
    assert not any(x=='.git' or x.startswith('.env') for x in p.parts)
    return OUTPUT.joinpath(*p.parts)
def verify(body,expected):
    actual=digests(body)
    return all(actual[k]==expected[k] for k in ['size','sha1','sha256']),actual
def copy_body(body,entry):
    valid,actual=verify(body,entry)
    if not valid:return {'path':entry['path'],'expected':{k:entry[k] for k in ['size','sha1','sha256']},'actual':actual}
    out=target_path(entry['path']);out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists():
        assert out.is_file() and not out.is_symlink()
        if verify(out.read_bytes(),entry)[0]:return None
    temporary=out.with_name(out.name+'.certified-copy-tmp');temporary.write_bytes(body);os.replace(temporary,out)
    return None
def local_objects(wanted):
    result=subprocess.run(['git','cat-file','--batch-all-objects','--batch-check=%(objectname) %(objecttype) %(objectsize)'],cwd=REPO,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    return {row.split()[0] for row in result.stdout.splitlines() if row.split()[0] in wanted}
def read_exact(stream,count):
    chunks=[]
    while count:
        part=stream.read(count)
        if not part:raise RuntimeError('Truncated local Git object stream')
        chunks.append(part);count-=len(part)
    return b''.join(chunks)
def main():
    if (ROOT/'OVERLAY-APLICADO.json').exists():
        raise SystemExit('Overlay already applied: preserve final stage; do not restore baseline bodies over approved replacements.')
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--verified-source-map',type=Path,help='Optional mapping output path to an existing certified local body; never executable.')
    ap.add_argument('--overlay-plan',type=Path)
    args=ap.parse_args();plan=json.loads(PLAN.read_text());OUTPUT.mkdir(parents=True,exist_ok=True)
    groups={}
    for e in plan['files']:
        if e.get('gitBlobOID'):groups.setdefault(e['gitBlobOID'],[]).append(e)
    progress_path=ROOT/'RECIBO-PROGRESO-PAQUETE-21.json'
    prior=json.loads(progress_path.read_text()) if progress_path.exists() else {}
    rejected=prior.get('rejectedSourceCandidates',prior.get('mismatches',[]))
    rejected_paths={e['path'] for e in rejected if 'actual' in e and 'expected' in e}
    existing=set();errors=[]
    for e in plan['files']:
        p=target_path(e['path'])
        if p.is_file() and not p.is_symlink() and verify(p.read_bytes(),e)[0]:existing.add(e['path'])
    needed={oid for oid,entries in groups.items() if any(e['path'] not in existing and e['path'] not in rejected_paths for e in entries)}
    available=local_objects(needed);oids=sorted(available)
    if oids:
        proc=subprocess.Popen(['git','cat-file','--batch'],cwd=REPO,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        def feed():
            try:proc.stdin.write(''.join(oid+'\n' for oid in oids).encode());proc.stdin.close()
            except BrokenPipeError:pass
        thread=threading.Thread(target=feed);thread.start()
        for requested in oids:
            header=proc.stdout.readline().decode().strip().split()
            assert len(header)==3 and header[0]==requested and header[1]=='blob',header
            body=read_exact(proc.stdout,int(header[2]));assert proc.stdout.read(1)==b'\n'
            assert hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()==requested
            for entry in groups[requested]:
                if entry['path'] in rejected_paths:continue
                error=copy_body(body,entry)
                if error:errors.append(error)
        thread.join();stderr=proc.stderr.read();assert proc.wait()==0,stderr.decode(errors='replace')
    if args.verified_source_map:
        mapping=json.loads(args.verified_source_map.read_text())
        for entry in plan['files']:
            if entry['path'] not in mapping:continue
            source=Path(mapping[entry['path']]);assert source.is_file() and not source.is_symlink()
            error=copy_body(source.read_bytes(),entry)
            if error:errors.append(error)
    matched=[];missing=[];mismatched=[]
    for entry in plan['files']:
        path=target_path(entry['path'])
        if not path.is_file() or path.is_symlink():missing.append(entry);continue
        good,actual=verify(path.read_bytes(),entry)
        if good:matched.append(entry['path'])
        else:mismatched.append({'path':entry['path'],'actual':actual,'expected':{k:entry[k] for k in ['size','sha1','sha256']}})
    receipt={'kind':'REAL_PARTIAL_MATERIALIZATION_OF_CERTIFIED_BASE875','recordedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'sourceMerge':'d3fb474f08b81a965d2e0eac927adf88671968c0','baselineCommit':'875bd80ddb650b376cb3dd53af4ffae066fcd48f',
      'stage':str(OUTPUT),'expectedBaseFiles':1672,'matchedBaseFiles':len(matched),'missingBaseFiles':len(missing),
      'missingTargets':[{k:e[k] for k in ['path','size','sha1','sha256','sourcePath','gitBlobOID'] if k in e} for e in missing],
      'mismatches':mismatched,'rejectedSourceCandidates':rejected+errors,
      'baseComplete':len(matched)==1672 and not mismatched,
      'packageCertified':False,'overlayApplied':False,'buildsOrGeneratorsOrTests':0,'networkFetches':0,'deploymentOrPublication':False,
      'onlyCertifiedInventoryPathsCopied':True,'credentialsOrEnvironmentValuesInspected':False}
    progress_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:receipt[k] for k in ['stage','matchedBaseFiles','missingBaseFiles','baseComplete','packageCertified']},indent=2));print('CONTENT_MISMATCHES',len(mismatched)+len(errors))
    if mismatched:raise SystemExit(2)

if __name__=='__main__':main()
