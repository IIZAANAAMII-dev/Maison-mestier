"""Épreuve en deux encres pour le carton et le mur du stand. python art/graver_portique.py"""
from math import cos, pi, sin, sqrt
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
width,height=1800,1200
rng=np.random.default_rng(1911)
stock=np.empty((height,width,3),dtype=np.uint8)
noise=rng.normal(0,1.65,(height,width)) + rng.normal(0,.53,(height,1))
for i,base in enumerate((235,224,199)):
    stock[:,:,i]=np.clip(base+noise,0,255).astype("uint8")
sheet=Image.fromarray(stock)
d=ImageDraw.Draw(sheet)
ink=(43,50,53); cachet=(151,57,43); ochre=(172,133,80)
L,T,R,B=149,174,1651,975
pic=Image.new("RGB",(R-L,B-T),(230,216,184))
g=ImageDraw.Draw(pic)
w,h=pic.size
# The skyline is drawn from horizontal engraved strokes, interrupted by the sun.
sx,sy,r=920,225,126
for y in range(5,514,7):
    col=tuple(int(a+(b-a)*(y/514)) for a,b in zip((139,125,100),(208,188,151)))
    g.line((0,y,w,y),fill=col,width=2)
g.ellipse((sx-r-3,sy-r-3,sx+r+3,sy+r+3),fill=(235,218,179))
g.ellipse((sx-r,sy-r,sx+r,sy+r),fill=cachet)
for k in range(-116,117,6):
    dx=sqrt(r*r-k*k)
    g.line((sx-dx,sy+k,sx+dx,sy+k),fill=(202,117,82),width=1)
def coast(x,front):
    return (467 if front else 434)+ (29 if front else 47)*sin(x/167+.4) + 10*sin(x/69)+4*cos(x/27)
for front in (False,True):
    crest=[(x,coast(x,front)) for x in range(-4,w+5,3)]
    g.polygon(crest+[(w,h),(0,h)],fill=(149,143,119) if not front else (95,104,94))
    for j in range(0,120,6):
        offset=j if front else j*.63
        g.line([(x,y+offset+4*sin(x*.013+j*.04)) for x,y in crest], fill=(79,92,87) if front else (112,120,102),width=2)
horizon=546
g.rectangle((0,horizon,w,h),fill=(220,206,173))
for y in range(horizon,h+2,6):
    amplitude=1.3+8*((y-horizon)/(h-horizon))**1.6
    g.line([(x,y+amplitude*sin(x/48+y*.038)+.6*amplitude*cos(x/85-y*.07)) for x in range(0,w+5,4)],fill=(82,100,98),width=2)
# An impossible paper portico: successive intaglio arches share a vanishing point.
def arch(left,bottom,outer,inner,top,stem,fill):
    center=left+outer
    spring=top+outer
    shape=[(left,bottom),(left,spring)]
    for t in np.linspace(pi,0,128):
        shape.append((center+outer*cos(t),spring-outer*sin(t)))
    shape.extend([(center+outer,bottom),(center+inner,bottom),(center+inner,spring)])
    for t in np.linspace(0,pi,128):
        shape.append((center+inner*cos(t),spring-inner*sin(t)))
    shape.extend([(center-inner,bottom),(left,bottom)])
    g.polygon(shape,fill=fill)
    for i in range(4,outer-inner-2,6):
        radius=outer-i
        pts=[(center-radius,bottom),(center-radius,spring)]
        pts.extend((center+radius*cos(t),spring-radius*sin(t)) for t in np.linspace(pi,0,128))
        pts.append((center+radius,bottom))
        g.line(pts,fill=ink if stem else ochre,width=2)
arch(586,641,109,76,323,False,(220,195,145))
arch(430,693,163,102,194,True,(196,180,145))
arch(188,770,265,179,27,True,(232,212,168))
for x,y in [(200,778),(380,728),(1130,648),(1460,618)]:
    g.line((x,y,x+190,y-52), fill=(64,78,76),width=2)
sheet.paste(pic,(L,T))
d=ImageDraw.Draw(sheet)
d.rectangle((L-12,T-12,R+12,B+12),outline=ochre,width=2)
def font(name,size):return ImageFont.truetype(str(root/"app/fonts"/(name+".woff2")),size)
d.text((L,77),"Maison",font=font("bodoni-moda",49),fill=ink,anchor="lm")
d.text((L+164,77),"Mestier",font=font("bodoni-moda-italic",49),fill=ink,anchor="lm")
d.text((R,84),"ÉPREUVE D’ATELIER",font=font("ibm-plex-mono",24),fill=ink,anchor="rm")
d.text((L,1078),"Le portique.",font=font("bodoni-moda-italic",76),fill=ink,anchor="lm")
d.text((R,1086),"GRAVURE EN DEUX ENCRES",font=font("ibm-plex-mono",22),fill=ink,anchor="rm")
file=root/"public/traversee/estampe.webp";file.parent.mkdir(exist_ok=True,parents=True)
sheet.resize((1050,700),Image.Resampling.LANCZOS).save(file,quality=84,method=6)
print(file,file.stat().st_size)
