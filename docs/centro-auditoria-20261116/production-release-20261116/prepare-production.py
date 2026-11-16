"""Copy only the certified artifact; verify bytes before and after. No build/network."""
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS=Path(__file__).resolve().parent
ROOT=DOCS.parents[2]
SOURCE=ROOT/'.vercel/centro-auditoria-20261116/stage/.vercel/output'
STAGE=ROOT/'.vercel/centro-production-release-20261116/stage'
OUTPUT=STAGE/'.vercel/output'
PIN='ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05'
BASE_PIN='de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
OVERLAY={'static/centro-orientacion.html','static/assets/css/orientacion.css','static/assets/js/orientacion.mjs'}
def inventory(directory):
 rows=[]
 for p in sorted(directory.rglob('*')):
  assert not p.is_symlink(),p
  if p.is_file():
   body=p.read_bytes();rows.append({'path':p.relative_to(directory).as_posix(),'size':len(body),'sha1':hashlib.sha1(body).hexdigest(),'sha256':hashlib.sha256(body).hexdigest()})
 return rows
def pin(rows):return hashlib.sha256(''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n"for r in sorted(rows,key=lambda r:r['path'])).encode()).hexdigest()
def main():
 auth=json.loads((DOCS/'authorization.json').read_text());assert auth['explicitAuthorization'] and auth['productionCreationAuthorized'] and auth['candidateInventorySha256']==PIN
 candidate=json.loads((DOCS.parent/'candidate-manifest.json').read_text())['inventory']
 baseline=json.loads((ROOT/'docs/contacto-baseline-20261116/candidate-manifest.json').read_text())['inventory']
 assert pin(candidate)==PIN and pin(baseline)==BASE_PIN
 current=inventory(SOURCE);assert current==sorted(candidate,key=lambda r:r['path']) and pin(current)==PIN
 by={r['path']:r for r in candidate};before={r['path']:r for r in baseline}
 assert len(by)==len(before)==1660 and by.keys()==before.keys()
 delta={p for p in by if by[p]!=before[p]};assert delta==OVERLAY
 assert sum(by[p]==before[p] for p in by)==1657
 assert by['config.json']==before['config.json'] and json.loads((SOURCE/'config.json').read_text())['version']==3
 functions=[r for r in candidate if r['path'].startswith('functions/')];assert len(functions)==57 and all(r==before[r['path']]for r in functions)
 names=sorted(p.name for p in (SOURCE/'functions/api').iterdir() if p.is_dir());assert len(names)==7
 assert by['static/contacto.html']==before['static/contacto.html']
 assert not STAGE.exists(),'Refuse to replace an existing production stage.'
 shutil.copytree(SOURCE,OUTPUT)
 after=inventory(OUTPUT);assert after==current and pin(after)==PIN
 link={'projectId':'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','orgId':'team_A9VNIW2f2K1IJpd2pGdvDmEN','projectName':'project-wrapp'}
 (STAGE/'.vercel/project.json').write_text(json.dumps(link,indent=2)+'\n')
 result={'checkedAt':datetime.now(ZoneInfo('America/Santiago')).isoformat(),'passed':True,'source':str(SOURCE),'stage':str(STAGE),'output':str(OUTPUT),'candidateInventorySha256':PIN,'baselineInventorySha256':BASE_PIN,'files':1660,'runtimeChanged':3,'identicalToBaseline':1657,'changedPaths':sorted(delta),'functionFiles':57,'functionBundles':names,'configVersion':3,'configIdentical':True,'contactoIdentical':True,'allProjectFichesPreserved':True,'sourceAndCopyExactlyIdentical':True,'buildersOrGeneratorsExecuted':0,'networkCalls':0,'deploymentsCreated':0}
 (DOCS/'local-artifact-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':main()
