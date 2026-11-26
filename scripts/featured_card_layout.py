"""Owner-approved labels and shared rows for homepage featured cards only."""
import re
STYLE='''<style id="featured-card-alignment">
#portfolio .featured-cards-grid{grid-template-columns:minmax(0,1fr)}
#portfolio .featured-card{display:flex;flex-direction:column}
#portfolio .featured-card-content{display:grid;grid-template-rows:auto auto auto minmax(3.5rem,auto) minmax(9rem,auto) auto auto;flex:1}
#portfolio .featured-card-content>div.flex{min-width:0}
#portfolio .featured-card-content>div.flex>div{min-width:0}
#portfolio .featured-card-content>p.leading-relaxed{overflow-wrap:break-word}
#portfolio [class~="text-[10px]"]{font-size:.75rem;line-height:1.5}
#portfolio .featured-card-content>div.border-t .font-mono{font-size:1.125rem;line-height:1.4}
@media(min-width:700px){
  #portfolio .featured-cards-grid{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:0}
  #portfolio .featured-card{display:grid;grid-template-rows:subgrid;grid-row:span 8}
  #portfolio .featured-card-content{display:grid;grid-template-rows:subgrid;grid-row:span 7;row-gap:0}
}
@media(min-width:700px) and (max-width:1023px){
  #portfolio .featured-card:nth-child(n+3){margin-top:2rem}
}
@media(min-width:1024px){
  #portfolio .featured-cards-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
</style>'''
def apply_featured_layout(page):
    start=page.index('<!-- Property Card 1 -->');end=page.index('<div class="flex justify-center mt-16">',start)
    block=page[start:end]
    for old,new in [('Tipologías del proyecto','Tipologías'),('Útil aprox.','Superficie'),('Total según planos','Superficie'),('Precio de lista','Precio')]:
        block=block.replace('>'+old+'</span>','>'+new+'</span>')
    block=block.replace('class="group bg-surface-container-lowest','class="featured-card group bg-surface-container-lowest')
    block=block.replace('<div class="p-8">','<div class="featured-card-content p-8">')
    assert block.count('class="featured-card group ')==3
    assert block.count('class="featured-card-content p-8"')==3
    page=page[:start]+block+page[end:]
    old='<div class="grid grid-cols-1 md:grid-cols-3 gap-8">\n<!-- Property Card 1 -->'
    new='<div class="featured-cards-grid grid grid-cols-1 md:grid-cols-3 gap-8">\n<!-- Property Card 1 -->'
    page=page.replace(old,new)
    if re.search(r'<style id="featured-card-alignment">.*?</style>',page,flags=re.S):
        return re.sub(r'<style id="featured-card-alignment">.*?</style>',lambda _:STYLE,page,count=1,flags=re.S)
    return page.replace('</head>',STYLE+'\n</head>',1)
