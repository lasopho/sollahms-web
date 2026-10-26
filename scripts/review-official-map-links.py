"""Inspect authored location links, never Google responses or camera centers."""
from pathlib import Path
import json, re, html, urllib.request, hashlib, concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'docs/catalog-address-pins-20261026'
pending={p['slug'] for p in json.loads((ROOT/'docs/catalog-map-brochures-20261026/pending-locations.json').read_text())}
research=json.loads((ROOT/'data/fichas-proyectos.json').read_text())
records=[]
def read(p):
    url=p.get('sourceUrl','')
    if not url or url.endswith('.pdf'): return None
    result={'slug':p['slug'],'source':url,'checkedOn':'2026-10-26'}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; SollahmsCatalogueReview/1.0; +https://sollahms.cl/contacto.html)'})
        with urllib.request.urlopen(req,timeout=20) as response: data=response.read()
        text=html.unescape(data.decode(errors='replace')); result['sha256']=hashlib.sha256(data).hexdigest()
        (DEST/(p['slug']+'-source.html')).write_text(text)
        result['links']=list(dict.fromkeys(re.findall(r'(?:src|href)=[\"\x27]([^\"\x27]*(?:maps|mapa|goo.gl)[^\"\x27]*)',text,re.I)))
        result['coordinateContexts']=[text[max(0,m.start()-120):m.end()+180] for m in re.finditer(r'-(?:[1234]\d|5[0-6])\.\d{4,}',text)][:30]
    except Exception as e:result['error']=str(e)
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for r in pool.map(read,[p for p in research if p['slug'] in pending]):
        if r:
            records.append(r)
            print(r['slug'],len(r.get('links',[])),len(r.get('coordinateContexts',[])),r.get('error',''),flush=True)
            (DEST/'official-location-links.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
