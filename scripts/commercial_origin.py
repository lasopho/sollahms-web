"""Carry only a bounded public origin across educational commercial links."""
import html,re
from urllib.parse import urlsplit,parse_qsl,urlencode,urlunsplit

def apply_origin_links(page,origin):
 assert origin in {'guia-hipotecaria','guia-etapas'}
 def replace(match):
  u=urlsplit(html.unescape(match[1]));q=dict(parse_qsl(u.query));q['origen']=origin
  return 'href="'+html.escape(urlunsplit((u.scheme,u.netloc,u.path,urlencode(q),u.fragment)),quote=True)+'"'
 return re.sub(r'href="(/(?:proyectos|contacto|agenda-asesoria)\.html[^"]*)"',replace,page)
