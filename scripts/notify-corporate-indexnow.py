#!/usr/bin/env python3
"""Notify changed corporate pages only; dry-run by default, no private account login."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit
from datetime import datetime,timezone
import argparse,hashlib,json,re
from seo_scope import load_scope,classify,canonical_candidate

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'data/indexnow-corporate.json'

def prepare(urls=None):
 config=json.loads(CONFIG.read_text())
 scope,scope_hash=load_scope(ROOT/config['scopeRegistry'])
 if config['host']!='sollahms.cl' or config['endpoint']!='https://api.indexnow.org/indexnow':
  raise ValueError('Unexpected host or notification endpoint')
 if config['scope']!=scope['scope_id'] or scope['scope_id']!='corporate-education-v3':
  raise ValueError('Unexpected corporate scope')
 selected=list(urls or config['defaultChangedURLs'])
 if not selected or len(selected)>len(scope['included_urls']) or len(selected)!=len(set(selected)):
  raise ValueError('Select a small distinct set of changed corporate URLs')
 for url in selected:
  if canonical_candidate(url)!=url or classify(url,scope)!='included':
   raise ValueError('Not a canonical included corporate URL: '+url)
  if url not in config['defaultChangedURLs']:
   raise ValueError('URL was not changed in this release: '+url)
 key_path=ROOT/config['keyFile']
 if key_path.parent!=ROOT or key_path.is_symlink() or config['keyLocation']!='https://sollahms.cl/'+key_path.name:
  raise ValueError('Unexpected public host-ownership proof location')
 key=key_path.read_text().strip()
 if not re.fullmatch(r'[A-Za-z0-9-]{8,128}',key):raise ValueError('Invalid host ownership proof')
 payload={'host':config['host'],'key':key,'keyLocation':config['keyLocation'],'urlList':selected}
 return config,payload,scope_hash

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--url',action='append');parser.add_argument('--send',action='store_true');parser.add_argument('--receipt',type=Path)
 args=parser.parse_args();config,payload,scope_hash=prepare(args.url)
 safe={'scope':config['scope'],'scopeSHA256':scope_hash,'host':config['host'],'endpoint':config['endpoint'],'urlList':payload['urlList'],'keyLocation':config['keyLocation'],'keySHA256':hashlib.sha256(payload['key'].encode()).hexdigest(),'privateBingAccountAccess':False,'visitorDataIncluded':False}
 if not args.send:
  print(json.dumps({'mode':'dry_run','networkRequests':0,**safe},ensure_ascii=False));return
 if args.receipt is None:parser.error('--send requires an explicit receipt path')
 args.receipt.parent.mkdir(parents=True,exist_ok=True)
 if args.receipt.exists():raise ValueError('An attempt is already recorded; inspect it before any deliberate retry')
 # Verify the public ownership proof and exact newly published HTML before notifying.
 with urlopen(Request(config['keyLocation'],headers={'User-Agent':'SollahmsIndexNowVerification/1.0'}),timeout=25) as response:
  proof=response.read().decode().strip()
  if response.status!=200 or response.geturl()!=config['keyLocation'] or proof!=payload['key']:
   raise ValueError('Public host-ownership proof did not match')
 for url in payload['urlList']:
  name='index.html' if urlsplit(url).path=='/' else urlsplit(url).path.lstrip('/')
  with urlopen(Request(url,headers={'User-Agent':'SollahmsIndexNowVerification/1.0'}),timeout=25) as response:
   public=response.read()
   if response.status!=200 or response.geturl()!=url or public!=(ROOT/name).read_bytes():
    raise ValueError('Public bytes differ from the published source: '+url)
 record={'startedAtUTC':datetime.now(timezone.utc).isoformat(),'status':'attempt_recorded','methods':['GET','POST'],'attempts':1,'notifiedURLs':len(payload['urlList']),**safe}
 with args.receipt.open('x') as handle:handle.write(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 body=json.dumps(payload).encode()
 try:
  with urlopen(Request(config['endpoint'],data=body,headers={'Content-Type':'application/json; charset=utf-8','User-Agent':'SollahmsCorporateIndexNow/1.0'},method='POST'),timeout=30) as response:
   result=response.read();code=response.status
 except HTTPError as error:result=error.read();code=error.code
 record.update(finishedAtUTC=datetime.now(timezone.utc).isoformat(),httpStatus=code,responseBytes=len(result),responseSHA256=hashlib.sha256(result).hexdigest(),status='received' if code==200 else 'received_key_validation_pending' if code==202 else 'not_accepted',indexationEstablished=False,GoogleSubmission=False,OpenAIAppearanceEstablished=False)
 args.receipt.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':record['status'],'httpStatus':code,'notifiedURLs':len(payload['urlList']),'indexationEstablished':False}))
 if code not in (200,202):raise SystemExit(1)

if __name__=='__main__':main()
