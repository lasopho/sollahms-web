#!/usr/bin/env python3
"""Read captured official GET JSON only. No network, app, functions, or mutation."""
from pathlib import Path, PurePosixPath
import argparse, json, hashlib, datetime, re

EXPECTED_MANIFEST_SHA256='f0fa6e13c6d41f62325f0b7ab7487e5c6a7dbe445a0c3148e60cff2ac3862f5e'
EXPECTED_MERGE='d3fb474f08b81a965d2e0eac927adf88671968c0'
EXPECTED_PROJECT='prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
EXPECTED_TEAM='team_A9VNIW2f2K1IJpd2pGdvDmEN'

def sha(body):return hashlib.sha256(body).hexdigest()
def meta(path):return {'path':str(path),'bytes':path.stat().st_size,'sha256':sha(path.read_bytes())}
def flatten(nodes,prefix=''):
    assert isinstance(nodes,list), 'Tree must be the full official list, not an MCP excerpt.'
    for node in nodes:
        assert isinstance(node,dict) and isinstance(node.get('name'),str)
        name=node['name'];assert name and not name.startswith('/') and '..' not in PurePosixPath(name).parts
        path='/'.join(x for x in [prefix,name] if x)
        yield path,node
        if node.get('type')=='directory':
            assert isinstance(node.get('children'),list), ('Truncated directory',path)
            yield from flatten(node['children'],path)
        else:assert not node.get('children'), ('Unexpected children',path)

def main():
    a=argparse.ArgumentParser(description=__doc__)
    for k in ['tree','metadata','manifest','receipt']:a.add_argument('--'+k,type=Path,required=True)
    a.add_argument('--deployment-id',required=True);args=a.parse_args()
    assert re.fullmatch(r'dpl_[A-Za-z0-9]+',args.deployment_id)
    assert sha(args.manifest.read_bytes())==EXPECTED_MANIFEST_SHA256
    manifest=json.loads(args.manifest.read_text());expected={r['path']:r for r in manifest['inventory']}
    assert len(expected)==1721 and manifest['sourceMerge']==EXPECTED_MERGE
    metadata=json.loads(args.metadata.read_text())
    assert metadata['id']==args.deployment_id and metadata['projectId']==EXPECTED_PROJECT
    assert metadata['teamId']==EXPECTED_TEAM
    assert metadata['readyState']=='READY'
    assert metadata['sourceMergeSHA']==EXPECTED_MERGE, 'Explicit deployment source metadata missing or changed.'
    tree=json.loads(args.tree.read_text());observed={};lambdaRoutes=[];outside=[];unknown=[];directories=0
    root='src/.vercel/output/'
    for path,node in flatten(tree):
        kind=node.get('type')
        if kind=='directory':directories+=1;continue
        if kind=='lambda' and path.startswith('out/'):
            lambdaRoutes.append({'path':path,'uid':node.get('uid'),'type':kind});continue
        if kind!='file':unknown.append({'path':path,'type':kind});continue
        if not path.startswith(root):outside.append({'path':path,'type':kind});continue
        rel=path[len(root):]
        assert rel not in observed, ('Duplicate file',rel)
        observed[rel]=node
    missing=sorted(set(expected)-set(observed));extra=sorted(set(observed)-set(expected));mismatches=[];sizePresent=0;sizeMismatch=[]
    for rel in sorted(set(expected)&set(observed)):
        row,node=expected[rel],observed[rel]
        if node.get('uid')!=row['sha1']:mismatches.append({'path':rel,'expectedSHA1':row['sha1'],'receivedUID':node.get('uid')})
        if isinstance(node.get('size'),int):
            sizePresent+=1
            if node['size']!=row['size']:sizeMismatch.append({'path':rel,'expectedSize':row['size'],'receivedSize':node['size']})
    expectedRoutes=['out/api/'+x for x in ['advisory','booking-availability','booking-create','collaboration','contact','orientation-contact','uf']]
    assert sorted(x['path'] for x in lambdaRoutes)==expectedRoutes
    assert not missing and not extra and not mismatches and not sizeMismatch and not outside and not unknown, {'missing':missing,'extra':extra,'mismatches':mismatches,'sizeMismatch':sizeMismatch,'outside':outside,'unknown':unknown}
    assert len(observed)==1721
    functionPaths=[k for k in expected if k.startswith('functions/')]
    assert len(functionPaths)==57 and 'config.json' in observed
    receipt={'schemaVersion':1,'kind':'INDEPENDENT_OFFICIAL_GET_OUTPUT_FILETREE_COMPARISON','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'deploymentId':args.deployment_id,'readyState':'READY','projectId':EXPECTED_PROJECT,'teamId':EXPECTED_TEAM,'sourceMergeSHA':EXPECTED_MERGE,
      'manifest':meta(args.manifest),'manifestInventorySHA256':manifest['inventorySHA256'],'officialFullFileTree':meta(args.tree),'selectedDeploymentMetadata':meta(args.metadata),
      'expectedOutputFiles':1721,'receivedOutputFiles':len(observed),'matchingSHA1UIDs':len(observed),'missing':missing,'extra':extra,'mismatched':mismatches,
      'functionFilesMatched':57,'functionBundlesMatched':7,'configMatched':True,'lambdaRouteCount':len(lambdaRoutes),'lambdaRoutes':lambdaRoutes,
      'directoryNodeCountNotIncludedAsFiles':directories,'additionalOutputLambdaNodesNotIncludedAsFiles':len(lambdaRoutes),
      'remoteFilesWithExplicitSize':sizePresent,'remoteSizesComparedWherePresent':True,'sizeMismatches':sizeMismatch,
      'method':'Each full official API src/.vercel/output file UID must equal the frozen raw SHA1; SHA256 and sizes remain bound by the immutable local manifest and CLI dry certification. No source body download, app execution, runtime function invocation, or suite repetition.',
      'sourceBodyDownloads':0,'applicationTestsExecuted':0,'runtimeFunctionCalls':0,'deploymentMutation':False,'promotionOrDomainAssignment':False,'credentialsReadOrStoredByAgent':False,
      'status':'ALL_1721_OUTPUT_TARGETS_MATCH_READY_DEPLOYMENT_SOURCE_D3'}
    args.receipt.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'receipt':str(args.receipt),'sha256':sha(args.receipt.read_bytes()),'filesMatched':1721,'sourceMerge':EXPECTED_MERGE}))

if __name__=='__main__':main()
