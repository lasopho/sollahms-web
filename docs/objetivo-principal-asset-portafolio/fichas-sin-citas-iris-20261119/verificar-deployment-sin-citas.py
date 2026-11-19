#!/usr/bin/env python3
"""Verify full captured official GETs only; no network, runtime, or mutation."""
from pathlib import Path
import argparse,datetime,hashlib,json,re

PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN'
MANIFEST_SHA256='cfe487b63024752090ceb80e16c2e26259a2913beeaa8249b9fa9a2ee313d14c'
INVENTORY_SHA256='c3ed5ef73ecc9cbad23732970b3e5bb54f8df1c92b6027fe3fac3848e7e2bd04'
def sha(body):return hashlib.sha256(body).hexdigest()
def meta(p):return {'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
def walk(nodes,prefix=''):
    assert isinstance(nodes,list),'Full official array required, not an MCP excerpt.'
    for node in nodes:
        name=node.get('name');assert isinstance(name,str) and name and not name.startswith('/') and '..' not in name.split('/')
        path='/'.join(x for x in [prefix,name] if x)
        yield path,node
        if node.get('type')=='directory':
            assert isinstance(node.get('children'),list),('Truncated directory',path)
            yield from walk(node['children'],path)
        else:assert not node.get('children')
def main():
    a=argparse.ArgumentParser(description=__doc__)
    for key in ['manifest','tree','metadata','receipt']:a.add_argument('--'+key,type=Path,required=True)
    a.add_argument('--deployment-id',required=True);a.add_argument('--source-sha',required=True);args=a.parse_args()
    assert re.fullmatch('dpl_[A-Za-z0-9]+',args.deployment_id) and re.fullmatch('[0-9a-f]{40}',args.source_sha)
    assert sha(args.manifest.read_bytes())==MANIFEST_SHA256
    manifest=json.loads(args.manifest.read_text());expected={r['path']:r for r in manifest['inventory']}
    assert len(expected)==1721
    rows=sorted(expected.values(),key=lambda r:r['path'])
    assert sha(''.join(r['path']+'\t'+str(r.get('size',r.get('bytes')))+'\t'+r['sha256']+'\n' for r in rows).encode())==INVENTORY_SHA256
    identity=json.loads(args.metadata.read_text())
    assert identity['id']==args.deployment_id and identity['projectId']==PROJECT and identity['teamId']==TEAM and identity['readyState']=='READY'
    assert identity['meta']['githubCommitSha']==args.source_sha
    assert identity['meta']['githubOrg']=='lasopho' and identity['meta']['githubRepo']=='sollahms-web'
    observed={};lambdas=[];outside=[];unknown=[];dirs=0
    for path,node in walk(json.loads(args.tree.read_text())):
        kind=node.get('type')
        if kind=='directory':dirs+=1;continue
        if kind=='lambda' and path.startswith('out/'):
            lambdas.append({'path':path,'uid':node.get('uid')});continue
        if kind!='file':unknown.append({'path':path,'type':kind});continue
        if not path.startswith('src/.vercel/output/'):outside.append(path);continue
        path=path[len('src/.vercel/output/'):];assert path not in observed;observed[path]=node
    missing=sorted(set(expected)-set(observed));extra=sorted(set(observed)-set(expected));changed=[];sizeCompared=0;sizeMismatch=[]
    for path in set(expected)&set(observed):
        if observed[path].get('uid')!=expected[path]['sha1']:changed.append(path)
        if isinstance(observed[path].get('size'),int):
            sizeCompared+=1
            if observed[path]['size']!=expected[path].get('size',expected[path].get('bytes')):sizeMismatch.append(path)
    routes=['out/api/'+x for x in ['advisory','booking-availability','booking-create','collaboration','contact','orientation-contact','uf']]
    assert sorted(x['path'] for x in lambdas)==routes
    assert not missing and not extra and not changed and not sizeMismatch and not outside and not unknown,{'missing':missing,'extra':extra,'changed':changed,'sizeMismatch':sizeMismatch,'outside':outside,'unknown':unknown}
    assert len(observed)==1721
    functions=[p for p in expected if p.startswith('functions/')];assert len(functions)==57 and 'config.json' in observed
    result={'schemaVersion':1,'kind':'VERIFICACION_INDEPENDIENTE_UIDS_DEPLOYMENT_SIN_CITAS_IRIS','verifiedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'verdict':'APROBADO','deploymentId':args.deployment_id,'sourceCommit':args.source_sha,'readyState':'READY','projectId':PROJECT,'teamId':TEAM,
      'manifest':meta(args.manifest),'candidateInventorySHA256':INVENTORY_SHA256,'fullOfficialFileTree':meta(args.tree),'selectedMetadata':meta(args.metadata),
      'expectedFiles':1721,'receivedFiles':1721,'matchingSHA1UIDs':1721,'missing':missing,'extra':extra,'changed':changed,'functionFilesMatched':57,'functionBundlesMatched':7,'configurationMatched':True,'lambdaRoutes':lambdas,'directoryNodesNotFiles':dirs,'lambdaNodesNotFiles':7,'remoteFileSizesComparedWherePresent':sizeCompared,'sizeMismatches':sizeMismatch,
      'method':'Official complete file tree UID raw SHA1 compared with pinned local candidate inventory; source metadata explicit. No body downloads or application/function execution.',
      'applicationTestsRun':0,'runtimeFunctionsCalled':0,'formsSubmitted':0,'deploymentMutations':0,'promotionOrAliasOrDomainMutations':0,'credentialsOrEnvironmentOrSSORead':False}
    args.receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'receipt':str(args.receipt),'sha256':sha(args.receipt.read_bytes()),'filesMatched':1721,'sourceCommit':args.source_sha}))
if __name__=='__main__':main()
