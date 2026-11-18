#!/usr/bin/env python3
"""Apply only certified public delta bodies after exact baseline recovery.

No application build, generator, source edit, fetch, Git write or deployment.
"""
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import subprocess
import datetime

ROOT=Path('/private/tmp/sollahms-pr36-public-package-20261118')
OUT=ROOT/'stage/.vercel/output'
REPO=Path('/private/tmp/sollahms-ampliacion-21-gpr-20261118')
A=Path('/private/tmp/sollahms-auditoria-leben-20261116/docs/objetivo-principal-asset-portafolio')
BASE_MANIFEST=A/'correccion-carga-mismo-origen-20261117/paquete/MANIFIESTO-CANDIDATO-MISMO-ORIGEN.json'
DELTA_MANIFEST=A/'ampliacion-iris-chile-20261118/candidato-21-gpr/qa/MANIFIESTO-59-ARCHIVOS.json'
HEAD='6cedd329879be1b716be9854d23e1b5538db2806'
MERGE='d3fb474f08b81a965d2e0eac927adf88671968c0'
TREE='f2d22640e0876d788789b27f99e3e27587384056'

def git(*args):return subprocess.check_output(['git',*args],cwd=REPO)
def sha(body):return hashlib.sha256(body).hexdigest()
def inventory():
    result=[]
    for p in sorted(OUT.rglob('*'),key=lambda item:item.relative_to(OUT).as_posix()):
        assert not p.is_symlink(),'Symlinks are not allowed in this frozen output.'
        if p.is_file():
            body=p.read_bytes();result.append({'path':p.relative_to(OUT).as_posix(),'size':len(body),'sha1':hashlib.sha1(body).hexdigest(),'sha256':sha(body)})
    return result
def inventory_pin(rows):return sha(''.join(x['path']+'\t'+str(x['size'])+'\t'+x['sha256']+'\n' for x in rows).encode())

base=json.loads(BASE_MANIFEST.read_text());delta=json.loads(DELTA_MANIFEST.read_text())
assert git('rev-parse',HEAD+'^{tree}').decode().strip()==TREE
assert git('rev-parse',MERGE+'^{tree}').decode().strip()==TREE
assert git('show','-s','--format=%P',MERGE).decode().split()==['875bd80ddb650b376cb3dd53af4ffae066fcd48f',HEAD]
before=inventory();before_by={x['path']:x for x in before};certified={x['path']:x for x in base['inventory']}
assert len(before)==1672 and before_by==certified,'Baseline must be fully recovered before overlay.'
assert inventory_pin(before)==base['candidate']['inventorySHA256']
assert not (ROOT/'OVERLAY-APLICADO.json').exists()
overlays=[];excluded=[];expected=dict(certified);prepared=[]
for record in delta['files']:
    path=record['path']
    if path.startswith(('scripts/','tests/')) or path=='vercel.json':excluded.append(path);continue
    target='static/'+path
    assert path.endswith('.html') or path.startswith(('assets/','data/'))
    assert not any(p=='..' or p.startswith('.env') for p in PurePosixPath(path).parts)
    body=git('show',HEAD+':'+path)
    assert len(body)==record['bytes'] and sha(body)==record['sha256']
    row={'path':target,'size':len(body),'sha1':hashlib.sha1(body).hexdigest(),'sha256':sha(body)}
    assert (target in certified)==(record['kind']=='modified')
    prepared.append((target,body))
    expected[target]=row;overlays.append({'sourceCommit':HEAD,'sourcePath':path,'outputPath':target,'kind':record['kind'],**row})
assert len(overlays)==54 and sum(x['kind']=='new' for x in overlays)==49 and len(excluded)==5
for target,body in prepared:
    dest=OUT/target;dest.parent.mkdir(parents=True,exist_ok=True)
    tmp=dest.with_name(dest.name+'.certified-overlay-tmp');tmp.write_bytes(body);os.replace(tmp,dest)
after=inventory();after_by={x['path']:x for x in after}
assert len(after)==1721 and after_by==expected
assert not {'static/data/euro-commercial.json','static/data/nollagam-commercial.json','static/data/fichas-proyectos.json'}&set(after_by)
changes={x['outputPath'] for x in overlays}
assert all(after_by[path]==row for path,row in certified.items() if path not in changes)
assert all(after_by[path]==row for path,row in certified.items() if path=='config.json' or path.startswith('functions/'))
for row in after:
    path=row['path']
    assert not path.startswith(('static/docs/','static/scripts/','static/tests/','static/.git/'))
    assert 'owner-input' not in path and 'RAW-' not in path
receipt={'schemaVersion':1,'kind':'REAL_OUTPUT_INVENTORY_AFTER_CERTIFIED_PUBLIC_DELTA_ONLY',
 'preparedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceMerge':MERGE,'sourceTree':TREE,'candidateSource':HEAD,
 'stage':str(OUT),'baselineFiles':1672,'baselineInventorySHA256':inventory_pin(before),
 'files':len(after),'staticFiles':sum(x['path'].startswith('static/') for x in after),'functionFiles':sum(x['path'].startswith('functions/') for x in after),
 'functionBundles':7,'configFiles':sum(x['path']=='config.json' for x in after),'bytes':sum(x['size'] for x in after),'inventorySHA256':inventory_pin(after),
 'newPublicFiles':49,'replacedPublicFiles':5,'overlays':overlays,'excludedSourceFiles':excluded,
 'baseOutsideApprovedOverlaysByteIdentical':True,'all57FunctionFilesAndConfigByteIdentical':True,
 'inventory':after,'packageBytesComplete':True,'resourceClosureVerified':False,'packageReadyForDeployment':False,
 'deploymentsOrPublication':False,'buildsOrApplicationGeneratorsOrTests':0,'credentialsOrEnvironmentValuesInspected':False}
dest=ROOT/'MANIFIESTO-PAQUETE-PUBLICO-21.json';dest.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
(ROOT/'OVERLAY-APLICADO.json').write_text(json.dumps({'sourceMerge':MERGE,'outputInventorySHA256':receipt['inventorySHA256'],'manifestSHA256':sha(dest.read_bytes()),'doNotRunBaselineMaterializerAgain':True},indent=2)+'\n')
print(json.dumps({k:receipt[k] for k in ['stage','files','staticFiles','functionFiles','configFiles','newPublicFiles','replacedPublicFiles','inventorySHA256','resourceClosureVerified','packageReadyForDeployment']},indent=2))
