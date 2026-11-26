"""Create the authorized frozen Production artifact without assigning domains."""
import json,re,subprocess
from pathlib import Path
from datetime import datetime,timezone
from release_common import api,selected_alias,selected_deployment,validate_project,local_candidate,read,save,BASE,PROJECT,TEAM,BRANCH,PRIVATE,CLI,NODE,SCOPE,ENV,require

def main():
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument("--source-commit",required=True);source=parser.parse_args().source_commit
    require(bool(re.fullmatch(r"[0-9a-f]{40}",source)),"Full reviewed source SHA required")
    before=read(Path(__file__).parent/'production-before.json')
    current=selected_alias(api('/v4/aliases/sollahms.cl'))
    require(current==before['aliasesAfter'][0] and current['deploymentId']==BASE,'Production advanced; reconcile before creating candidate')
    settings,metadata=validate_project(api('/v9/projects/'+PROJECT))
    require(settings==before['projectSettings'] and metadata==before['environmentMetadata'],'Frozen project/environment changed')
    rows,pin=local_candidate()
    for name in ['content-verification.json','independent-review.json','visual-review.json','release-simulation.json']:
        require(read(Path(__file__).parent/name).get('passed') is True,'Validation missing: '+name)
    qa=read(Path(__file__).parent/'browser-qa.json');require(qa['failedCases']==0 and qa['completedCases']==18,'Browser QA failed')
    args=[NODE,CLI,'deploy','--prebuilt','--prod','--skip-domain','--yes','--scope',SCOPE]
    for k,v in {'githubCommitSha':source,'githubCommitRef':BRANCH,'githubOrg':'lasopho','githubRepo':'sollahms-web','candidateInventorySHA256':pin,'baselineDeployment':BASE}.items():args+=['--meta',k+'='+v]
    result=subprocess.run(args,cwd=PRIVATE/'candidate',env=ENV,capture_output=True,timeout=180)
    require(result.returncode==0,'Prebuilt deployment failed; raw CLI output withheld')
    urls=re.findall(r'https://[a-zA-Z0-9.-]+\.vercel\.app',result.stdout.decode())
    require(urls,'No explicit deployment URL returned')
    url=urls[-1]
    record={'createdAtUTC':datetime.now(timezone.utc).isoformat(),'url':url,'runtimeSourceCommit':source,'branch':BRANCH,'target':'production','skipDomain':True,'prebuilt':True,'baselineDeployment':BASE,'candidateInventorySHA256':pin,'files':len(rows),'CLI':'65.16.0','rawCLIOutputStored':False,'domainsAssignedByThisAction':False}
    save('created-production.json',record);print(json.dumps(record))
if __name__=='__main__':main()
