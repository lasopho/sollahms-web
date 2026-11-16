import json
from pathlib import Path
from collections import Counter
from html.parser import HTMLParser
ROOT=Path('/private/tmp/sollahms-recorridos-qa')
SOURCE=Path('/private/tmp/sollahms-recorridos-20261115-local')
WIDTHS=[1440,768,390,320]
SLUGS=[r['slug'] for r in json.loads((ROOT/'data/proyectos.json').read_text())]
class Media(HTMLParser):
 def __init__(self):super().__init__();self.maps=0;self.videos=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='iframe' and a.get('data-project-embed')=='map':self.maps+=1
  if tag=='video' or tag=='iframe' and (a.get('data-project-embed')=='video' or any(h in a.get('src','') for h in ['youtube','youtu.be','vimeo'])):self.videos+=1
expected_media={}
for slug in SLUGS:
 p=Media();p.feed((SOURCE/(slug+'.html')).read_text());expected_media[slug]={'maps':p.maps,'videos':p.videos}
rows=json.loads((ROOT/'full-524/responsive-qa.json').read_text())['results']
counts=Counter((r['slug'],r['width']) for r in rows)
expected={(slug,width) for slug in SLUGS for width in WIDTHS}
missing=sorted(expected-set(counts));duplicates=[{'slug':k[0],'width':k[1],'count':v} for k,v in counts.items() if v!=1]
issues=[];privacy=[];total_maps=0
for row in rows:
 key={'slug':row['slug'],'width':row['width']};reasons=[]
 if row.get('fatalError'):reasons.append({'check':'infrastructure-or-interaction-exception','detail':row['fatalError']})
 if row['status']!=200:reasons.append({'check':'fiche-http','status':row['status']})
 if row.get('tourElements') or row.get('tourText'):reasons.append({'check':'visible-tour-residual'})
 if row['overflow']>1:reasons.append({'check':'horizontal-overflow','pixels':row['overflow']})
 if row.get('emptySections'):reasons.append({'check':'empty-sections','ids':row['emptySections']})
 if row.get('brokenImages'):reasons.append({'check':'broken-images','paths':row['brokenImages']})
 if row.get('errors'):reasons.append({'check':'javascript-errors','messages':row['errors']})
 if not row.get('navigationTargetsExist'):reasons.append({'check':'navigation-targets'})
 if len(row.get('commercialFields',[]))!=4 or any(not f['exists'] or not f['enabled'] or not f['visible'] for f in row.get('commercialFields',[])):reasons.append({'check':'four-visible-commercial-fields'})
 intentional=set()
 for b in row.get('blockedRequests',[]):
  if b['origin']=='https://maps.googleapis.com' and b['path']=='/maps_api_js_slo/log':
   intentional.add(b['origin']+b['path']);privacy.append({**key,'origin':b['origin'],'path':b['path'],'method':b['method'],'classification':'intentional-telemetry-block'})
  else:reasons.append({'check':'unreviewed-blocked-request','request':b})
 real_requests=[r for r in row.get('failedRequests',[]) if r['url'] not in intentional]
 if real_requests:reasons.append({'check':'failed-request','requests':real_requests})
 if row.get('failedResponses'):reasons.append({'check':'http-resource-errors','responses':row['failedResponses']})
 if 'galleryPaint' not in row:reasons.append({'check':'gallery-paint-not-measured'})
 else:
  hidden=[m for m in row['galleryPaint'] if m['intersectsViewport'] and (m['hidden'] or m['effectiveOpacity']<0.1)]
  if hidden:reasons.append({'check':'visible-gallery-image-not-painted','images':hidden})
 maps=row.get('mapEvidence',[]);total_maps+=len(maps)
 if len(maps)!=expected_media[row['slug']]['maps']:reasons.append({'check':'map-count','expected':expected_media[row['slug']]['maps'],'actual':len(maps)})
 for m in maps:
  if not m.get('ready') or m.get('errorText') or not m.get('mapWidgets') or (not m.get('canvases') and not m.get('decodedTiles')):reasons.append({'check':'map-runtime-evidence','map':m})
 if row.get('videoEvidence') or expected_media[row['slug']]['videos']:reasons.append({'check':'video-playback-requires-supplement','videos':row.get('videoEvidence')})
 if row.get('layout',{}).get('offscreenControlsOrHeadings'):reasons.append({'check':'offscreen-main-heading-or-control','elements':row['layout']['offscreenControlsOrHeadings']})
 if reasons:issues.append({**key,'reasons':reasons})
summary={'deployment':'dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi','base':'https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app','readOnly':True,'expectedProjects':131,'expectedViewportChecks':524,'actualRows':len(rows),'uniqueRows':len(counts),'completedByWidth':{str(w):sum(r['width']==w for r in rows) for w in WIDTHS},'missing':[{'slug':s,'width':w} for s,w in missing],'duplicates':duplicates,'issues':issues,'intentionalTelemetryBlocks':privacy,'expectedMapsPerWidth':sum(m['maps'] for m in expected_media.values()),'mapInspections':total_maps,'publishedVideos':sum(m['videos'] for m in expected_media.values()),'commercialSubmissions':0,'releaseQaReady':len(rows)==524 and not(missing or duplicates or issues),'headerFooterProbeRequiredSeparately':True,'galleryPlanFormSupplementRequiredSeparately':True}
(ROOT/'full-524/acceptance-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:summary[k] for k in ['actualRows','uniqueRows','completedByWidth','expectedMapsPerWidth','mapInspections','publishedVideos','releaseQaReady']}|{'issues':len(issues),'intentionalTelemetryBlocks':len(privacy)},ensure_ascii=False))

