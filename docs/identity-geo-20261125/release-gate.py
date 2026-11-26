"""Offline release/recovery guards. Simulations never call providers or sockets."""
import copy, json, socket
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import patch
DOC=Path(__file__).resolve().parent
BASE='dpl_9M5yUF3GzFK2aWy34Qn4en7y8tA7'
PRIVATE=Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-identity-geo-20261125')
def require(v,m):
    if not v:raise ValueError(m)
def validate(snapshot):
    require(snapshot['current']==BASE,'Concurrent publication')
    require(snapshot['target']=='production' and snapshot['prebuilt'],'Production prebuilt required')
    require(snapshot['candidate']==snapshot['validatedCandidate'],'Different ID')
    require(snapshot['inventory']==snapshot['validatedInventory'],'Inventory changed')
    require(snapshot['functionsPreserved'] and snapshot['configPreserved'],'Functions/config changed')
    require(snapshot['settingsPreserved'] and snapshot['environmentPreserved'],'Settings/environment changed')
    require(snapshot['owner'] and snapshot['rollbackEligible'],'Recovery not ready')
    require(snapshot['httpPassed'] and snapshot['contentPassed'] and snapshot['browserPassed'] and snapshot['reviewPassed'],'Verification incomplete')
    return snapshot['candidate']
def recover(state,expectedLive):
    require(state['current']==expectedLive,'Refuse recovery over a later publication')
    state['current']=BASE;state['files']=state['baselineFiles'];return state
def simulate():
    baseline=json.loads((PRIVATE/'baseline-manifest.json').read_text())
    candidate=json.loads((PRIVATE/'candidate-manifest.json').read_text())
    s={'current':BASE,'target':'production','prebuilt':True,'candidate':'simulated-validated-id','validatedCandidate':'simulated-validated-id','inventory':candidate['inventorySHA256'],'validatedInventory':candidate['inventorySHA256'],'functionsPreserved':True,'configPreserved':True,'settingsPreserved':True,'environmentPreserved':True,'owner':True,'rollbackEligible':True,'httpPassed':True,'contentPassed':True,'browserPassed':True,'reviewPassed':True}
    tests=[]
    with patch.object(socket,'socket',side_effect=RuntimeError('Network forbidden in release simulation')):
        state={'current':validate(s),'files':candidate['inventory'],'baselineFiles':baseline['inventory']}
        tests.append({'name':'Promote exact validated ID in memory','passed':state['current']==s['validatedCandidate']})
        state=recover(state,s['validatedCandidate'])
        tests.append({'name':'Restore complete9M inventory/config/functions in memory','passed':state['current']==BASE and state['files']==baseline['inventory']})
        for key,value in [('current','later-production'),('target','preview'),('prebuilt',False),('candidate','different-id'),('inventory','changed'),('functionsPreserved',False),('configPreserved',False),('settingsPreserved',False),('environmentPreserved',False),('rollbackEligible',False),('httpPassed',False)]:
            invalid=copy.deepcopy(s);invalid[key]=value
            try:validate(invalid)
            except ValueError:tests.append({'name':'Reject '+key,'passed':True})
            else:tests.append({'name':'Reject '+key,'passed':False})
        try:recover({'current':'later-production'},s['validatedCandidate'])
        except ValueError:tests.append({'name':'Refuse recovery over later publication','passed':True})
        else:tests.append({'name':'Refuse recovery over later publication','passed':False})
    report={'observedAtUTC':datetime.now(timezone.utc).isoformat(),'passed':all(x['passed'] for x in tests),'tests':tests,'networkRequests':0,'realPromotions':0,'realRollbacks':0,'realFormSubmissions':0,'limit':'Guard simulation, not an exercise of future control-plane recovery permission.'}
    (DOC/'release-simulation.json').write_text(json.dumps(report,indent=2)+'\n');require(report['passed'],'Simulation failure');return report
def gate():
    read=lambda f:json.loads((DOC/f).read_text())
    before=read('production-before.json');stage=read('staged-verification.json');http=read('staged-http.json');content=read('content-verification.json');qa=read('browser-qa.json');review=read('independent-review.json');recovery=read('recovery-readiness.json');simulation=read('release-simulation.json')
    require(simulation['passed'],'Simulation incomplete')
    age=(datetime.now(timezone.utc)-datetime.fromisoformat(stage['observedAtUTC'])).total_seconds();require(0<=age<180,'Fresh staged audit required')
    snapshot={'current':stage['aliasesAfter'][0]['deploymentId'],'target':stage['deployment']['target'],'prebuilt':stage['deployment']['prebuilt'],'candidate':stage['deployment']['id'],'validatedCandidate':http['deploymentId'],'inventory':stage['candidateInventorySHA256'],'validatedInventory':content['candidateInventorySHA256'],'functionsPreserved':stage['fullInventory']['functionFiles']==68 and stage['fullInventory']['functionBundles']==8,'configPreserved':stage['fullInventory']['configurationMatched'],'settingsPreserved':stage['projectSettingsUnchanged'],'environmentPreserved':stage['environmentMetadataMatchesFrozenExpectedState'],'owner':recovery['ownerRoleConfirmed'],'rollbackEligible':recovery['isRollbackCandidate'] is True,'httpPassed':http['passed'],'contentPassed':content['passed'],'browserPassed':qa['failedCases']==0 and qa['completedCases']==18,'reviewPassed':review['passed']}
    candidate=validate(snapshot)
    require(before['aliasesAfter']==stage['aliasesAfter'],'Baseline alias metadata changed')
    record={'validatedAtUTC':datetime.now(timezone.utc).isoformat(),'candidate':candidate,'inventorySHA256':stage['candidateInventorySHA256'],'baseline':BASE,'passed':True,'mutations':0}
    (DOC/'promotion-gate.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
if __name__=='__main__':
    import sys
    if '--simulate' in sys.argv:print(json.dumps({'simulationPassed':simulate()['passed']}))
    else:gate()
