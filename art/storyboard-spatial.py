"""Draw the exact annotated storyboard as a repository-native SVG."""
from pathlib import Path
from html import escape
import math

ROOT = Path(__file__).resolve().parents[1]
W, H = 1440, 1940
parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">
<title id="title">Maison Mestier : cinq scènes, un parcours spatial</title>
<desc id="desc">Storyboard annoté du seuil, de la presse, du théâtre, de la constellation numérique et des huit ateliers. Chaque scène montre son état initial, le geste du visiteur et la transition vers la suivante.</desc>
<defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fffcf4"/><stop offset="1" stop-color="#c6b695"/></linearGradient><linearGradient id="gold" x2="1" y2=".4"><stop stop-color="#8a6338"/><stop offset=".5" stop-color="#d8be85"/><stop offset="1" stop-color="#9a733f"/></linearGradient><linearGradient id="red"><stop stop-color="#431c25"/><stop offset=".5" stop-color="#aa3b40"/><stop offset="1" stop-color="#521c28"/></linearGradient><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="#a24531" stroke-width="1.2"/></marker></defs>
<rect width="1440" height="1940" fill="#f2ede3"/>
<style>text{{fill:#292820;font-family:Arial,sans-serif}}.serif{{font-family:Georgia,serif}}.label{{font-size:11px;letter-spacing:1.7px}}.body{{font-size:15px}}.quiet{{fill:#766c5b}}.red{{fill:#9d302a}}.white{{fill:#f3e9d6}}.line{{stroke:#c7baa3;fill:none}}.route{{stroke:#a24531;fill:none;stroke-width:1.6;marker-end:url(#arrow)}}</style>
''']

def text(x, y, value, cls='', size=None):
    parts.append(f'<text x="{x}" y="{y}" class="{cls}"'+(f' font-size="{size}"' if size else '')+f'>{escape(value)}</text>')

def line(x1,y1,x2,y2,cls='line'):
    parts.append(f'<path d="M{x1} {y1}L{x2} {y2}" class="{cls}"/>')

def viewport(x,y,index,after=False):
    dark=index in (2,3)
    bg=('#261b20' if index==2 else '#151e2c') if dark else '#e9e0cf'
    parts.append(f'<g transform="translate({x} {y})"><rect width="330" height="190" rx="2" fill="{bg}"/>')
    parts.append('<path d="M15 164H315M23 28H307" stroke="'+('#e8ddc333' if dark else '#b7a98d66')+'"/>')
    parts.append('<ellipse cx="204" cy="155" rx="103" ry="17" fill="'+('#080a10' if dark else '#b8a685')+'" opacity=".3"/>')
    if index==0:
        parts.append('<ellipse cx="206" cy="148" rx="86" ry="23" fill="#c6b496"/><ellipse cx="206" cy="142" rx="86" ry="22" fill="url(#paper)"/>')
        for i in range(4):
            offset=i*14
            lift=(i*10 if after else 0)
            parts.append(f'<path d="M{143+offset} {137-lift}V{84-lift}C{143+offset} {31-lift},{215+offset} {31-lift},{215+offset} {84-lift}V{137-lift}" fill="none" stroke="url(#gold)" stroke-width="13"/>')
            parts.append(f'<path d="M{138+offset} {133-lift}V{80-lift}C{138+offset} {28-lift},{210+offset} {28-lift},{210+offset} {80-lift}V{133-lift}" fill="none" stroke="url(#paper)" stroke-width="11"/>')
        if after: parts.append('<path d="M265 121Q295 97 272 51" class="route"/>')
    elif index==1:
        parts.append('<path d="M129 148 267 148 284 130 146 130Z" fill="url(#gold)"/><rect x="145" y="62" width="12" height="76" fill="#2f342b"/><rect x="242" y="62" width="12" height="76" fill="#2f342b"/><rect x="138" y="58" width="123" height="13" rx="4" fill="#404132"/><rect x="195" y="34" width="9" height="72" fill="url(#gold)"/><circle cx="199" cy="36" r="20" fill="none" stroke="#4a4535" stroke-width="5"/>')
        py=114 if after else 93
        parts.append(f'<rect x="164" y="{py}" width="72" height="9" fill="url(#gold)"/><path d="M161 128 222 128 242 117 181 117Z" fill="#f6efdf"/>')
        if after:
            for i in range(3):
                parts.append(f'<g transform="translate({241+i*16} {100-i*21}) rotate({-20+i*18})"><rect width="33" height="44" fill="#f9f2e5" stroke="#b7a789"/><text x="8" y="28" fill="#9d302a" font-family="Georgia" font-size="20">M</text></g>')
    elif index==2:
        parts.append('<ellipse cx="206" cy="145" rx="88" ry="21" fill="#d2b78e"/><path d="M139 138V79a65 65 0 0 1 130 0v59" fill="none" stroke="url(#gold)" stroke-width="8"/><path d="M148 137V80a56 56 0 0 1 112 0v57" fill="none" stroke="#d2c3a5" stroke-width="3"/>')
        for side in range(2):
            for i in range(6):
                xx=133+i*11 if side==0 else 206+i*11
                if after: xx=(122+i*6 if side==0 else 261+i*6)
                parts.append(f'<path d="M{xx} 38Q{xx+5} 69 {xx} 95T{xx+7} 145L{xx+15} 143Q{xx+8} 106 {xx+14} 86T{xx+13} 38Z" fill="url(#red)"/>')
        if after: parts.append('<path d="M202 47 161 141 247 141Z" fill="#e8c18c" opacity=".1"/><text x="188" y="119" class="serif white" font-size="51">M</text>')
    elif index==3:
        for i in range(10):
            for j in range(7):
                if not after and not (i<2 or i>7 or abs(i-4.5)*.9+j*.4<3):continue
                xx=143+i*12
                yy=54+j*12
                if after:
                    xx+=math.sin(i*13+j*31)*39
                    yy+=math.cos(i*17+j*19)*25
                parts.append(f'<rect x="{xx:.1f}" y="{yy:.1f}" width="5" height="5" transform="rotate({i*9+j*7} {xx:.1f} {yy:.1f})" fill="'+('#dac394' if (i+j)%3 else '#d16c4d')+'"/>')
        parts.append('<ellipse cx="202" cy="105" rx="92" ry="43" transform="rotate(-25 202 105)" fill="none" stroke="#9c886e55"/><ellipse cx="202" cy="105" rx="81" ry="61" transform="rotate(35 202 105)" fill="none" stroke="#9c886e44"/>')
    else:
        parts.append('<ellipse cx="206" cy="113" rx="90" ry="39" fill="none" stroke="#af9566" stroke-dasharray="2 6"/>')
        for i in range(8):
            a=i*math.pi/4
            xx=195+77*math.cos(a)
            yy=83+33*math.sin(a)
            select=after and i==0
            parts.append(f'<g transform="translate({xx:.1f} {yy-(17 if select else 0):.1f})"><path d="M0 47V14a13 13 0 0 1 26 0v33" fill="none" stroke="'+('#9d302a' if select else '#c2ad86')+'" stroke-width="6"/><text x="8" y="32" class="serif" font-size="12">'+str(i+1)+'</text></g>')
        parts.append('<text x="193" y="117" class="serif red" font-size="33">M</text>')
    parts.append('<rect x="19" y="48" width="65" height="3" fill="'+('#d1c2a5' if dark else '#978363')+'"/><rect x="19" y="57" width="48" height="3" fill="'+('#d1c2a5' if dark else '#978363')+'"/>')
    text(19,88,['Le seuil.','L’empreinte.','L’entracte.','La traversée.','Huit ateliers.'][index],'serif white' if dark else 'serif',18)
    text(19,178,'DÉFILEMENT + UN GESTE','white' if dark else 'quiet',7)
    parts.append('</g>')

text(60,52,'MAISON MESTIER / STORYBOARD SPATIAL','label red')
text(60,123,'Une maison en cinq dimensions.','serif',54)
text(60,163,'Une visite continue. Cinq gestes. La caméra relie les univers au fil du défilement.','body quiet')
text(60,196,'Schéma d’intention — les dessins expliquent la composition et le mouvement, sans simuler une capture du site.','quiet',12)
line(60,222,1380,222)
text(107,252,'AVANT LE GESTE','label quiet')
text(488,252,'APRÈS LE GESTE','label quiet')
text(875,252,'CE QUE L’ON VIT','label quiet')

scenes=[
 ('Le seuil','Papier → architecture', ['La caméra découvre le volume en trois quarts.','Le clic déploie les plis et décale les arches.','La matière se choisit : papier, laiton, encre.'], 'La caméra avance vers l’atelier d’impression.'),
 ('L’empreinte','Le signe devient matière', ['La presse se met en mouvement au clic.','Une feuille marquée s’échappe du plateau.','Les pages prennent de la profondeur.'], 'Le travelling quitte la table et rejoint la scène.'),
 ('L’entracte','Le lieu devient événement', ['Le velours s’écarte, les plis restent en volume.','Le portique et la lumière se révèlent.','Le même bouton permet de refermer la scène.'], 'La lumière chaude laisse place à la nuit numérique.'),
 ('La traversée','Du papier aux particules', ['Les éléments composent une matière numérique.','Un clic disperse le nuage dans la profondeur.','Un second geste le rassemble.'], 'La caméra rejoint l’orbite des huit savoir-faire.'),
 ('La constellation','Huit ateliers, une maison', ['Chaque atelier possède une porte dans l’espace.','Le choix met son volume en évidence.','La fiche prolonge le parcours avec le contenu métier.'], 'La visite débouche sur la Maison, puis le contact.'),
]
for i,(title,subtitle,copy,transition) in enumerate(scenes):
    y=280+i*280
    text(60,y+29,f'{i+1:02}','serif red',29)
    text(108,y+27,title,'serif',29)
    text(400,y+25,subtitle,'quiet',13)
    viewport(108,y+48,i)
    viewport(488,y+48,i,True)
    line(447,y+145,477,y+145,'route')
    text(875,y+70,'AU CLIC / AU TOUCHER','label red')
    for j,phrase in enumerate(copy):text(875,y+102+j*27,phrase,'body')
    text(875,y+199,'PASSAGE SUIVANT','label quiet')
    words=transition.split()
    first=[]
    while words and len(' '.join(first+[words[0]]))<48:first.append(words.pop(0))
    text(875,y+224,' '.join(first),'body')
    if words:text(875,y+246,' '.join(words),'body')
    if i<4:
        line(74,y+48,74,y+259,'route')
        line(108,y+265,1380,y+265)

line(60,1717,1380,1717)
text(60,1763,'Une navigation qui reste libre.','serif',32)
for x,title,body in [(60,'ACCÈS DIRECT','Le menu rejoint chaque scène.'),(405,'GESTES LISIBLES','Une action principale par univers.'),(750,'MOUVEMENT CHOISI','Pause et mouvement réduit.'),(1095,'SUR PETIT ÉCRAN','Le décor se recadre en hauteur.')]:
    text(x,1807,title,'label red')
    text(x,1834,body,'quiet',13)
text(60,1894,'01  →  02  →  03  →  04  →  05','label')
text(938,1894,'PAPIER / LAITON / VELOURS / LUMIÈRE','label quiet')
parts.append('</svg>')
target=ROOT/'public/experience/parcours-3d.svg'
target.write_text('\n'.join(parts))
print(target)
