#!/usr/bin/env python3
"""Copy only frozen certified output bytes from already-local immutable Git blobs.

Invoke with GIT_NO_LAZY_FETCH=1 GIT_OPTIONAL_LOCKS=0 GIT_TERMINAL_PROMPT=0.
This is not an application generator/build; it never executes public/server code.
"""
from pathlib import Path, PurePosixPath
from collections import defaultdict
import datetime
import hashlib
import json
import subprocess
import threading

ROOT=Path('/private/tmp/sollahms-fichas-iris-release-20261119')
REPO=Path('/Users/luissandoval/Documents/sollahms-web')
OUT=ROOT/'stage/.vercel/output'
MANIFEST=ROOT/'fuentes-certificadas/MANIFIESTO-PAQUETE-PUBLICO-21.json'
PLAN=ROOT/'PLAN-BASE-PUBLICA-D3.json'
FROZEN_SHA256='f0fa6e13c6d41f62325f0b7ab7487e5c6a7dbe445a0c3148e60cff2ac3862f5e'
EXPECTED_INVENTORY='d3d6692a7cf190d36d0cb173497c2b36775b7fa1a0f5c951c5a2a87c1b770558'

def sha(body):return hashlib.sha256(body).hexdigest()
def digests(body):return {'size':len(body),'sha1':hashlib.sha1(body).hexdigest(),'sha256':sha(body)}
def read_exact(stream,count):
    parts=[]
    while count:
        part=stream.read(count)
        if not part:raise RuntimeError('Truncated local Git blob stream')
        parts.append(part);count-=len(part)
    return b''.join(parts)
def main():
    assert sha(MANIFEST.read_bytes())==FROZEN_SHA256
    frozen=json.loads(MANIFEST.read_text());plan=json.loads(PLAN.read_text())
    expected={r['path']:r for r in frozen['inventory']}
    assert len(expected)==len(plan['targets'])==1721
    assert {r['path'] for r in plan['targets']}==set(expected)
    assert not plan['missingTargets']
    assert not OUT.exists() or not any(OUT.rglob('*')), 'Preserve any existing output; never overwrite an overlay.'
    OUT.mkdir(parents=True,exist_ok=True)
    available={line.split()[0] for line in subprocess.check_output(['git','-C',str(REPO),'cat-file','--batch-all-objects','--batch-check=%(objectname)'],text=True).splitlines()}
    groups=defaultdict(list)
    for row in plan['targets']:
        parts=PurePosixPath(row['path']).parts
        assert not row['path'].startswith('/') and '..' not in parts
        assert row['path']=='config.json' or row['path'].startswith(('static/','functions/'))
        assert not any(x=='.git' or x.startswith('.env') for x in parts)
        assert row['gitBlobOID'] in available
        groups[row['gitBlobOID']].append(row)
    proc=subprocess.Popen(['git','-C',str(REPO),'cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    ids=sorted(groups)
    def feed():
        try:proc.stdin.write(''.join(oid+'\n' for oid in ids).encode());proc.stdin.close()
        except BrokenPipeError:pass
    thread=threading.Thread(target=feed);thread.start();copied=0
    for oid in ids:
        header=proc.stdout.readline().decode().strip().split()
        assert len(header)==3 and header[0]==oid and header[1]=='blob',header
        body=read_exact(proc.stdout,int(header[2]));assert proc.stdout.read(1)==b'\n'
        assert hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()==oid
        actual=digests(body)
        for row in groups[oid]:
            assert all(actual[k]==expected[row['path']][k] for k in actual),('Certified byte mismatch',row['path'])
            target=OUT/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
            assert not target.exists()
            target.write_bytes(body);copied+=1
    thread.join();stderr=proc.stderr.read();assert proc.wait()==0,stderr.decode(errors='replace')
    assert copied==1721
    observed=[]
    for target in sorted(OUT.rglob('*'),key=lambda p:p.relative_to(OUT).as_posix()):
        assert not target.is_symlink()
        if target.is_file():observed.append({'path':target.relative_to(OUT).as_posix(),**digests(target.read_bytes())})
    assert {r['path']:r for r in observed}==expected
    pin=sha(''.join(r['path']+'\t'+str(r['size'])+'\t'+r['sha256']+'\n' for r in observed).encode())
    assert pin==EXPECTED_INVENTORY
    function_files=[r for r in observed if r['path'].startswith('functions/')]
    bundles=sorted({r['path'].split('.func/')[0]+'.func' for r in function_files})
    assert len(function_files)==57 and len(bundles)==7
    forbidden={'static/data/euro-commercial.json','static/data/nollagam-commercial.json','static/data/fichas-proyectos.json'}
    assert not forbidden&set(expected)
    assert all(not r['path'].startswith(('static/docs/','static/scripts/','static/tests/','static/.git/')) for r in observed)
    receipt={'schemaVersion':1,'kind':'RECUPERACION_LOCAL_BYTE_EXACTA_DE_BASE_PUBLICA_FKY_D3','recordedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'status':'BASE_PUBLICA_COMPLETA_EXACTA_LISTA_PARA_OVERLAY_AUTORIZADO','baselineCommit':'d3fb474f08b81a965d2e0eac927adf88671968c0','sourceDeployment':'dpl_FkyZZgpki5HSpKMRJQFgJE451d3G',
      'documentarySourceCommit':'eca89188ea3971a09e7acf178ea1303aa9637a5c','sourceManifestSHA256':FROZEN_SHA256,'planSHA256':sha(PLAN.read_bytes()),
      'stageRoot':str(ROOT/'stage'),'prebuiltOutputPath':str(OUT),'files':len(observed),'bytes':sum(r['size'] for r in observed),'inventorySHA256':pin,
      'staticFiles':sum(r['path'].startswith('static/') for r in observed),'functionFiles':57,'functionBundles':bundles,'configFiles':1,
      'allFilesSizeSHA1SHA256Matched':True,'allFunctionsAndConfigurationByteExact':True,'symlinks':0,'unexpectedPrivateStaticFiles':[],
      'localGitObjectsRead':len(groups),'networkCalls':0,'builds':0,'applicationGenerators':0,'applicationTests':0,'GitMutations':0,'credentialsOrEnvironmentValuesReadByAgent':False,
      'deploymentOrPromotionActions':0,'newCitationChangeApplied':False,'readyToPublishNewChange':False,
      'scope':'Frozen production base recovered only. The project-fiche citation overlay, its scoped validation and final release inventory remain for root. Metadata/receipts/source docs are outside output.'}
    p=ROOT/'BASE-PUBLICA-FKY-RECUPERADA.json';p.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'receipt':str(p),'sha256':sha(p.read_bytes()),'files':len(observed),'inventorySHA256':pin,'bytes':receipt['bytes']},ensure_ascii=False))

if __name__=='__main__':main()
