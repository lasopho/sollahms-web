import json,hashlib
from pathlib import Path
from collections import Counter
from html.parser import HTMLParser
ROOT=Path('/private/tmp/sollahms-recorridos-production-verify/browser')
TARGET=json.loads((ROOT/'target.json').read_text())
RUN=ROOT/'runs'/TARGET['deployment']
SLUGS=['inn-puerto-chico','plaza-las-condes','bcome','nucleo-costanera','bordevivo','distrito-centro']
WIDTHS=[1440,768,390,320]
class Media(HTMLParser):
 def __init__(self):super().__init__();self.maps=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='iframe' and a.get('data-project-embed')=='map':self.maps+=1
expected_maps={}
for slug in SLUGS:
 p=Media();p.feed((Path('/private/tmp/sollahms-recorridos-20261115-local')/(slug+'.html')).read_text());expected_maps[slug]=p.maps
doc=json.loads((RUN/'responsive-qa.json').read_text());rows=doc['results'];counts=Counter((r['slug'],r['width']) for r in rows)
expected={(s,w) for s in SLUGS for w in WIDTHS}
issues=[];intentional=[]
for r in rows:
 reasons=[];known=set()
 for b in r.get('blockedRequests',[]):
  if b['origin']=='https://maps.googleapis.com' and b['path']=='/maps_api_js_slo/log':
   known.add(b['origin']+b['path']);intentional.append({'slug':r['slug'],'width':r['width'],**b})
  else:reasons.append({'check':'unexpected-blocked-method','detail':b})
 checks={
 'fiche-route':r.get('status')==200 and not r.get('fatalError'),
 'tour-removal':not r.get('tourText') and not r.get('tourElements'),
 'horizontal-overflow':r.get('overflow',0)<=1,
 'image-decoding':not r.get('brokenImages'),
 'page-js-exceptions':not r.get('errors'),
 'internal-resource-http':not r.get('failedResponses'),
 'network':not [f for f in r.get('failedRequests',[]) if f['url'] not in known],
 'navigation-targets':bool(r.get('navigationTargetsExist')),
 'commercial-fields':len(r.get('commercialFields',[]))==4 and all(f['exists'] and f['visible'] and f['enabled'] for f in r.get('commercialFields',[])),
 'empty-sections':not r.get('emptySections'),
 'gallery-paint':'galleryPaint' in r and not any(m['intersectsViewport'] and (m['hidden'] or m['effectiveOpacity']<0.1) for m in r.get('galleryPaint',[])),
 'map-count':len(r.get('mapEvidence',[]))==expected_maps[r['slug']],
 'map-render':all(m.get('ready') and not m.get('errorText') and m.get('mapWidgets') and (m.get('canvases') or m.get('decodedTiles')) for m in r.get('mapEvidence',[])),
 'layout-main-controls':not r.get('layout',{}).get('offscreenControlsOrHeadings'),
 'video-inventory':not r.get('videoEvidence')
 }
 for check,passed in checks.items():
  if not passed:reasons.append({'check':check,'fatal':r.get('fatalError')})
 if reasons:issues.append({'slug':r['slug'],'width':r['width'],'reasons':reasons})
cache=ROOT/'cache'/TARGET['deployment']/'native-cache';cache_bad=[];cache_count=0
for p in cache.glob('*.json'):
 m=json.loads(p.read_text());body=p.with_suffix('.body');cache_count+=1
 if m['deployment']!=TARGET['deployment'] or m.get('origin')!=TARGET['origin'] or not body.exists() or len(body.read_bytes())!=m['bytes'] or hashlib.sha256(body.read_bytes()).hexdigest()!=m['sha256']:cache_bad.append(p.name)
missing=sorted(expected-set(counts));duplicates=[{'slug':k[0],'width':k[1],'count':v} for k,v in counts.items() if v!=1]
summary={'deployment':TARGET['deployment'],'origin':TARGET['origin'],'target':'production','projectId':TARGET['projectId'],'readyMetadataValidated':TARGET['validatedMetadata']['state']=='READY','expectedCases':24,'actualCases':len(rows),'uniqueCases':len(counts),'byWidth':{str(w):sum(r['width']==w for r in rows) for w in WIDTHS},'missing':[{'slug':s,'width':w} for s,w in missing],'duplicates':duplicates,'issues':issues,'intentionalTelemetryBlocks':intentional,'cacheNamespace':str(cache),'cacheEntries':cache_count,'cacheInvalid':cache_bad,'previewResponsesReused':0,'commercialSubmissions':0,'sourceInventorySha256':TARGET['certifiedInventorySha256'],'passed':len(rows)==24 and doc['base']==TARGET['origin'] and doc.get('deployment')==TARGET['deployment'] and not(missing or duplicates or issues or cache_bad)}
(RUN/'smoke-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'deployment':summary['deployment'],'cases':len(rows),'byWidth':summary['byWidth'],'issues':len(issues),'intentionalTelemetry':len(intentional),'cacheEntries':cache_count,'cacheInvalid':cache_bad,'passed':summary['passed']},ensure_ascii=False))

