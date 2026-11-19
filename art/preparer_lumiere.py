"""Réduire Studio Small 03 en radiance linéaire. Usage : blender -b -P art/preparer_lumiere.py -- chemin/vers/studio_small_03_1k.hdr"""
from pathlib import Path
import sys
import bpy
import numpy as np

source=Path(sys.argv[sys.argv.index("--")+1])
target=Path(__file__).resolve().parents[1]/"public/traversee/matieres/studio.hdr"
target.parent.mkdir(parents=True,exist_ok=True)
im=bpy.data.images.load(str(source))
w,h=im.size
linear=np.empty(w*h*4,dtype=np.float32)
im.pixels.foreach_get(linear)
rgba=linear.reshape(h,w,4)
height,width=256,512
assert w%width==0 and h%height==0
reduced=rgba.reshape(height,h//height,width,w//width,4).mean(axis=(1,3))
# Encode floating-point radiance directly. A display transform would compress the
# studio lamps and their specular reflections before the scene is lit.
rgb = np.maximum(reduced[::-1, :, :3],0)
largest = rgb.max(axis=2)
fraction, exponent = np.frexp(largest)
factor = np.divide(fraction*256,largest,out=np.zeros_like(largest),where=largest>1e-32)
rgbe = np.zeros((height,width,4),dtype=np.uint8)
rgbe[:,:,:3]=np.clip(rgb*factor[:,:,None],0,255).astype(np.uint8)
rgbe[:,:,3]=np.where(largest>1e-32,exponent+128,0).astype(np.uint8)

def packetize(channel):
    cursor=0
    while cursor<len(channel):
        end=cursor+1
        while end<len(channel) and end-cursor<127 and channel[end]==channel[cursor]: end+=1
        if end-cursor>=4:
            yield bytes((128+end-cursor,channel[cursor]))
            cursor=end
        else:
            end=cursor+1
            while end<len(channel) and end-cursor<128:
                if end+3<len(channel) and channel[end]==channel[end+1]==channel[end+2]==channel[end+3]: break
                end+=1
            yield bytes((end-cursor,))+bytes(channel[cursor:end])
            cursor=end

with target.open("wb") as file:
    file.write(f"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y {height} +X {width}\n".encode())
    for row in rgbe:
        file.write(bytes((2,2,width>>8,width&255)))
        for channel in row.T:
            file.writelines(packetize(channel))
print("Radiance RGBE",width,height,"pic linéaire",float(rgb.max()),"octets",target.stat().st_size)
