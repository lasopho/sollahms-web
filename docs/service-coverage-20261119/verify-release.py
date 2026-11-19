"""Read-only Vercel release verification; never deploy, promote or modify settings."""
from pathlib import Path, PurePosixPath
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import argparse,hashlib,json,subprocess

WORK=Path('/private/tmp/sollahms-cobertura-asesoria-20261119')
DOC=WORK/'docs/service-coverage-20261119'
PRIVATE=Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private')
CLI='/Users/luissandoval/.npm-global/bin/vercel'
PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH';TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN'
BASE='dpl_E4TaPn7ZkLDZ7u93FSMvd9oHsxAp'
SOURCE='db45afc2518b354bb14b108172d75d3aacb8d643'

def api(endpoint):
 p=subprocess.run([CLI,'api',endpoint,'--method','GET','--non-interactive'],cwd=WORK,capture_output=True,text=True)
 if p.returncode:raise RuntimeError('Read-only API failure: '+endpoint+'; exit='+str(p.returncode))
 return json.loads(p.stdout)
def now():return datetime.now(timezone.utc).astimezone(ZoneInfo('America/Santiago')).isoformat()
def save(name,value):(DOC/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def selected(d):
 return {k:d.get(k) for k in ['url','readyState','target','source','createdAt','ready','productionUrl','isRollbackCandidate','alias']}|{'id':d.get('id') or d.get('uid'),'meta':{k:v for k,v in d.get('meta',{}).items() if k in ['githubCommitSha','githubCommitRef','githubOrg','githubRepo']}}
def settings(p):
 return {k:p.get(k) for k in ['id','name','accountId','ssoProtection','autoAssignCustomDomains','autoExposeSystemEnvs','gitProviderOptions','buildCommand','outputDirectory','installCommand','rootDirectory','framework','nodeVersion']}|{'repository':{k:p.get('link',{}).get(k) for k in ['org','repo','productionBranch']}}
def alias(a):return {k:a.get(k) for k in ['alias','projectId','redirect','redirectStatusCode','updatedAt','createdAt']}|{'deploymentId':a.get('deploymentId') or a.get('deployment',{}).get('id')}
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['before','staged','after'],required=True);parser.add_argument('--deployment-id');parser.add_argument('--source-sha');args=parser.parse_args()
 endpoints={'project':'/v9/projects/'+PROJECT+'?teamId='+TEAM,'apex':'/v4/aliases/sollahms.cl?teamId='+TEAM,'www':'/v4/aliases/www.sollahms.cl?teamId='+TEAM}
 if args.deployment_id:
  endpoints['deployment']='/v13/deployments/'+args.deployment_id+'?teamId='+TEAM
 if args.phase=='staged':endpoints['tree']='/v6/deployments/'+args.deployment_id+'/files?teamId='+TEAM
 with ThreadPoolExecutor(max_workers=4) as pool:
  jobs={k:pool.submit(api,v) for k,v in endpoints.items()};data={k:f.result() for k,f in jobs.items()}
 aliases=[alias(data[k]) for k in ['apex','www']];current=aliases[0]['deploymentId'];proj=settings(data['project'])
 assert proj['id']==PROJECT and proj['accountId']==TEAM and proj['name']=='project-wrapp'
 assert proj['autoAssignCustomDomains'] is False and proj['ssoProtection']=={'deploymentType':'all_except_custom_domains'}
 assert proj['repository']=={'org':'lasopho','repo':'sollahms-web','productionBranch':'main'}
 assert aliases[1]['redirect']=='sollahms.cl' and aliases[1]['redirectStatusCode']==308
 env=sorted([{'name':e['key'],'targets':e.get('target'),'type':e.get('type')} for e in data['project'].get('env',[]) if isinstance(e,dict) and e.get('key')],key=lambda e:e['name'])
 report={'observedAt':now(),'timezone':'America/Santiago','phase':args.phase,'aliases':aliases,'projectSettings':proj,'environmentMetadata':env,'environmentValuesReadOrStored':False,'mutations':0}
 if args.phase=='before':
  assert current==BASE and all(a['deploymentId']==BASE for a in aliases)
  old=selected(api('/v13/deployments/'+BASE+'?teamId='+TEAM));assert old['readyState']=='READY' and old['target']=='production' and old['meta']['githubCommitSha']==SOURCE
  report['deployment']=old;report['passed']=True
 else:
  before=json.loads((DOC/'production-before.json').read_text());assert proj==before['projectSettings'];assert env==before['environmentMetadata']
  d=selected(data['deployment']);assert d['id']==args.deployment_id and d['readyState']=='READY' and d['target']=='production' and d['meta']['githubCommitSha']==args.source_sha
  report['deployment']=d;report['projectSettingsUnchanged']=True;report['environmentMetadataUnchanged']=True
  if args.phase=='staged':
   assert all(a['deploymentId']==BASE for a in aliases) and d['productionUrl'] is None
   raw=(PRIVATE/'candidate-inventory.json').read_bytes();manifest=json.loads(raw);expected={r['path']:r for r in manifest['inventory']};assert len(expected)==1728
   observed={};lambdas=[]
   def walk(nodes,prefix=''):
    assert isinstance(nodes,list)
    for n in nodes:
     name=n['name'];assert name and not name.startswith('/') and '..' not in PurePosixPath(name).parts
     path='/'.join(x for x in [prefix,name] if x)
     if n['type']=='directory':assert isinstance(n.get('children'),list);walk(n['children'],path)
     elif n['type']=='lambda' and path.startswith('out/'):lambdas.append(path)
     else:
      assert n['type']=='file' and path.startswith('src/.vercel/output/'),path
      path=path[len('src/.vercel/output/'):];assert path not in observed;observed[path]=n
   walk(data['tree']);assert set(observed)==set(expected)
   assert all(observed[p]['uid']==r['sha1'] for p,r in expected.items())
   assert all(not isinstance(observed[p].get('size'),int) or observed[p]['size']==r['bytes'] for p,r in expected.items())
   assert len(lambdas)==7 and len([p for p in expected if p.startswith('functions/')])==57
   report['fullInventory']={'expected':1728,'matched':1728,'functionFiles':57,'functionBundles':7,'candidateInventorySHA256':manifest['inventorySHA256'],'inventoryFileSHA256':hashlib.sha256(raw).hexdigest(),'missing':[],'extra':[],'differentUID':[],'configurationMatched':True}
   # Tree has public build-output paths/UID only; raw project/deployment metadata is never saved.
   save('staged-complete-file-tree.json',data['tree'])
   report['liveAliasesRemainOnBaseline']=True
  else:
   assert all(a['deploymentId']==args.deployment_id for a in aliases)
   report['t0AmericaSantiago']=datetime.fromtimestamp(aliases[0]['updatedAt']/1000,timezone.utc).astimezone(ZoneInfo('America/Santiago')).isoformat()
   report['t0UTC']=datetime.fromtimestamp(aliases[0]['updatedAt']/1000,timezone.utc).isoformat()
  report['passed']=True
 name={'before':'production-before.json','staged':'staged-verification.json','after':'production-after.json'}[args.phase];save(name,report)
 print(json.dumps({'phase':args.phase,'production':current,'candidate':args.deployment_id,'passed':True,'matched':report.get('fullInventory',{}).get('matched'),'environmentMetadataEntries':len(env),'t0':report.get('t0AmericaSantiago')}))
if __name__=='__main__':main()
