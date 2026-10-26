"""Verify the visual release cannot change published content or business behavior."""
from pathlib import Path
import re, subprocess, json, sys
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
base='047c3f03b59b9421ad23f995d1986e683d89ce01'
public=Path(sys.argv[1]) if len(sys.argv)>1 else root
pages=list(public.glob('*.html'))
assert len(pages)==141,len(pages)
def content(html):
 soup=BeautifulSoup(html,'html.parser')
 # Approved header names also apply to contact/advisory; body/footer copy is unchanged.
 for a in soup.select('header a'):
  if a.get_text(strip=True)=='Servicios' and a.get('href')=='/#expertise':a.string='Expertise'
  if a.get_text(strip=True)=='Proyectos' and a.get('href')=='/proyectos.html':a.string='Asset Portafolio'
 for tag in soup.find_all('style'):tag.decompose()
 for tag in soup.select('link[rel=stylesheet]'):tag.decompose()
 return re.sub(r'>\s+<','><',str(soup)).strip()
for p in pages:
 before=subprocess.check_output(['git','show',base+':'+p.name],cwd=root,text=True)
 after=(root/p.name).read_text()
 assert content(before)==content(after),p.name+' non-style content changed'
 soup=BeautifulSoup(after,'html.parser')
 links=soup.select('link[rel=stylesheet]')
 assert links[-1]['href'].startswith('/assets/css/sollahms-theme.css'),p.name
 assert sum('sollahms-theme.css' in l['href'] for l in links)==1
 for link in links:
  url=link['href'].split('?')[0]
  if url.startswith('/'):assert (root/url.lstrip('/')).is_file(),url
 assert 'Abrir en Google Maps' not in after,p.name
css=(root/'assets/css/sollahms-theme.css').read_text()
def rgb(h):return [int(h[i:i+2],16)/255 for i in [1,3,5]]
def lum(h):return sum(v*c for v,c in zip([v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb(h)],[.2126,.7152,.0722]))
def contrast(a,b):
 a,b=sorted([lum(a),lum(b)]);return (b+.05)/(a+.05)
pairs=[('#003229','#ffffff',4.5),('#003229','#e9c176',4.5),('#4b6059','#f8f9ff',4.5),('#4b6059','#edf0ed',4.5),('#806228','#ffffff',4.5),('#994025','#fff6f1',4.5),('#81948b','#ffffff',3),('#ffffff','#145849',4.5)]
ratios=[]
for a,b,min_ratio in pairs:
 r=contrast(a,b);assert r>=min_ratio,(a,b,r);ratios.append([a,b,round(r,2)])
assert '@media (prefers-reduced-motion:reduce)' in css
assert 'animation:none!important;transition:none!important;scroll-behavior:auto!important' in css
config=json.loads((root/'vercel.json').read_text())
assert config['git']['deploymentEnabled']['main'] is False
assert config['git']['deploymentEnabled']['codex/visual-unification-20261025'] is False
print(json.dumps({'pages_content_identical':len(pages),'theme_links':len(pages),'contrast_pairs':ratios,'automatic_deployments':False},indent=2))
