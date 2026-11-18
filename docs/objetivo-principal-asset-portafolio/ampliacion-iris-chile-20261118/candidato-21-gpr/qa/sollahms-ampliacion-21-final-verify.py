import json, hashlib, subprocess, os, re
from pathlib import Path
from datetime import datetime, timezone

T=Path('/private/tmp/sollahms-ampliacion-21-gpr-20261118')
A=Path('/private/tmp/sollahms-auditoria-leben-20261116')
Q=Path('/private/tmp/sollahms-ampliacion-21-qa'); Q.mkdir(exist_ok=True)
BASE='875bd80ddb650b376cb3dd53af4ffae066fcd48f'
ENV={**os.environ,'GIT_NO_LAZY_FETCH':'1'}
def git(*args): return subprocess.check_output(['git','-C',str(T),*args],env=ENV).decode()
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,x): (Q/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def tree(ref):
    out={}
    for row in git('ls-tree','-r',ref).splitlines():
        meta,path=row.split('\t',1); mode,typ,oid=meta.split(); out[path]=oid
    return out
base=tree(BASE)
index={}
for row in git('ls-files','-s').splitlines():
    meta,path=row.split('\t',1); mode,oid,stage=meta.split(); index[path]=oid
allowed={'assets/js/catalog.mjs','assets/js/catalog-model.mjs','assets/js/catalog-filter-engine.mjs','assets/js/catalog-filter-controls.mjs','proyectos.html','vercel.json'}
changed=set(git('diff','--name-only',BASE,'--').splitlines())
assert changed==allowed,changed
protected=json.loads((A/'docs/catalog-data-completeness-20261116/leben/fase10-filtros-20261117/ARCHIVOS-PROTEGIDOS.json').read_text())['files']
records=[]
for f in protected:
    p=f['path']; actual=sha(T/p) if (T/p).is_file() else None
    assert p not in changed and base[p]==index[p]
    if actual is not None: assert actual==f['sha256'],p
    records.append({'path':p,'certifiedSHA256':f['sha256'],'currentBodySHA256':actual,'gitBlob':base[p], 'gitIdentityUnchanged':True,'verification':'BODY_SHA256_AND_GIT' if actual else 'GIT_IDENTITY_WITH_HISTORICAL_SHA256_CERTIFICATE'})
projects=json.loads((T/'data/proyectos.json').read_text())
if isinstance(projects,dict): projects=projects['projects']
originalSlugs={p['slug'] for p in projects}
new=json.loads((T/'data/catalog-expansion-iris-20261118.json').read_text())['projects']
newSlugs={p['slug'] for p in new}
assert len(originalSlugs)==131 and len(newSlugs)==21 and not originalSlugs&newSlugs
assert all(f'{s}.html' in base and f'{s}.html' not in changed for s in originalSlugs)
prior=json.loads(subprocess.check_output(['git','-C',str(T),'show',BASE+':vercel.json'],env=ENV))
now=json.loads((T/'vercel.json').read_text()); branch='codex/ampliacion-21-proyectos-gpr-20261118'
assert now['git']['deploymentEnabled'].pop(branch) is False
assert now==prior
save('PRESERVACION-155-Y-131.json',{'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'baseSHA':BASE,'scope':'Candidate local worktree and Git index, before local commit; no network fetch','originalProjects':131,'originalProjectPagesUnchanged':131,'allTrackedOriginalFilesOutsideSixAllowedUnchanged':True,'protectedCount':len(records),'protectedBodiesRehashed':sum(x['currentBodySHA256'] is not None for x in records),'protectedMissingBodiesUsingGitIdentity':sum(x['currentBodySHA256'] is None for x in records),'protected':records,'publishedProjectDataSHA256':sha(T/'data/proyectos.json'),'publishedFacetDataSHA256':sha(T/'data/catalog-facets.json'),'newProjects':21,'gpr':sum(p['identity']['developer']=='GPR' for p in new),'combined':152,'duplicatesWithOriginals':[],'onlyExistingFilesChanged':sorted(changed),'vercelOnlyChange':{branch:False},'productionChanged':False,'deploymentCreated':False,'candidate24aTouched':False})
print(json.dumps({'protected':len(records),'bodies':sum(x['currentBodySHA256'] is not None for x in records),'gitOnly':sum(x['currentBodySHA256'] is None for x in records),'originalPages':131,'new':21,'combined':152,'oldChanged':sorted(changed)}))
