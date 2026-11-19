"""Cachet de Maison Mestier. Depuis la racine, blender -b -P art/modeliser_cachet.py."""
from math import cos, hypot, sin, tau
from pathlib import Path
from tempfile import TemporaryDirectory
import sys

import bpy
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / "art"))
from quantifier_glb import compact_glb

OUT = ROOT / "public/traversee/modeles/cachet.glb"
OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, metal, roughness):
    out = bpy.data.materials.new(name)
    out.use_nodes = True
    def linear(v):
        return ((v / 255 + .055) / 1.055) ** 2.4 if v > 10 else v / 3294.6
    color = tuple(linear(v) for v in rgb) + (1,)
    out.diffuse_color = color
    pbr = out.node_tree.nodes.get("Principled BSDF")
    pbr.inputs["Base Color"].default_value = color
    pbr.inputs["Metallic"].default_value = metal
    pbr.inputs["Roughness"].default_value = roughness
    return out


brass = material("Matrice · laiton satiné", (185, 141, 76), .86, .32)
bright = material("Filets · laiton poli", (218, 178, 113), .9, .235)
dark = material("Taille-douce · patine", (93, 63, 37), .64, .42)
wood = material("Manche · noyer teinté et ciré", (85, 52, 35), .035, .37)
inlay = material("Manche · incrustation noire", (38, 27, 25), .21, .32)
wood_photo = bpy.data.images.load(str(ROOT / "art/textures/noyer-cachet.jpg"))
wood_photo.name = "Fil du noyer · Poly Haven"
wood_photo.colorspace_settings.name = "sRGB"
wood_photo.pack()
sample = wood.node_tree.nodes.new("ShaderNodeTexImage")
sample.name = "Placage de noyer · diffuse sRGB"
sample.image = wood_photo
sample.extension = 'REPEAT'
uv_map = wood.node_tree.nodes.new("ShaderNodeUVMap")
uv_map.uv_map = "Fil du noyer"
wood.node_tree.links.new(uv_map.outputs["UV"], sample.inputs["Vector"])
wood.node_tree.links.new(sample.outputs["Color"], wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"])


def turning(name, profile, mat, facets=80, grain=False):
    verts, faces = [], []
    for z, radius in profile:
        for i in range(facets):
            angle = tau * i / facets
            # Fine flutes in the pear are cut around the axis of the turned handle.
            relief = .0035 * (1 - cos(20 * angle)) / 2 if grain and .38 < z < .91 else 0
            r = max(0.00003, radius - relief)
            verts.append((r*cos(angle), r*sin(angle), z))
    for row in range(len(profile)-1):
        for i in range(facets):
            j=(i+1)%facets
            faces.append((row*facets+i, row*facets+j,(row+1)*facets+j,(row+1)*facets+i))
    faces.extend([tuple(reversed(range(facets))),tuple(range(len(verts)-facets,len(verts)))])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    if grain:
        # Follow the distance over the turned profile. Split the wrap on its rear
        # meridian, away from the front of the stamp in the opening shot.
        distances = [0.]
        for (za, ra), (zb, rb) in zip(profile, profile[1:]):
            distances.append(distances[-1] + hypot(zb - za, rb - ra))
        uv = mesh.uv_layers.new(name="Fil du noyer")
        for polygon in mesh.polygons[:-2]:
            row, i = divmod(polygon.index, facets)
            u0 = ((i - facets // 4) % facets) / facets
            u1 = u0 + 1 / facets
            v0, v1 = distances[row] / distances[-1], distances[row + 1] / distances[-1]
            for loop, value in zip(polygon.loop_indices, ((u0,v0),(u1,v0),(u1,v1),(u0,v1))):
                uv.data[loop].uv = value
        for cap in mesh.polygons[-2:]:
            for loop in cap.loop_indices:
                x,y,_ = mesh.vertices[mesh.loops[loop].vertex_index].co
                uv.data[loop].uv = (.5 + x * 1.9, .5 + y * 1.9)
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    for p in mesh.polygons[:-2]: p.use_smooth=True
    return obj


turning("Matrice biseautée",[(.008,.238),(.012,.255),(.02,.261),(.032,.261),(.036,.256),
    (.039,.253),(.044,.254),(.047,.26),(.057,.260),(.066,.255),(.073,.245),
    (.076,.234),(.083,.224),(.10,.207),(.113,.184),(.121,.163),(.126,.137),(.138,.131)],brass)
turning("Filet de frappe",[(.033,.256),(.035,.263),(.038,.263),(.040,.254)],bright)
turning("Pointe de la bague",[(.124,.127),(.130,.139),(.142,.139),(.147,.132),(.194,.121),
    (.209,.116),(.216,.119),(.222,.124),(.230,.124),(.236,.117),(.243,.107)],brass)
turning("Bague sertie",[(.193,.120),(.197,.122),(.201,.122),(.205,.117)],bright)
turning("Noyer tourné",[(.228,.103),(.238,.109),(.250,.121),(.257,.123),(.267,.122),(.28,.111),
    (.32,.099),(.36,.096),(.39,.102),(.43,.114),(.48,.131),(.54,.153),(.60,.173),(.66,.189),
    (.71,.198),(.76,.200),(.81,.193),(.85,.181),(.89,.163),(.93,.138),(.96,.110),(.98,.081),(.991,.049),(.997,.018)],wood,120,True)
turning("Filet de bois noir",[(.267,.122),(.27,.123),(.275,.120)],inlay)
turning("Clou de centrage",[(.984,.065),(.989,.066),(.995,.053),(.999,.028),(1,.001)],bright,48)
# Two fine circular registration marks cut into the striking face.
for radius in [.195,.223]:
    turning("Couronne de la matrice",[(.006,radius-.0028),(.002,radius-.0014),(.002,radius+.0014),(.007,radius+.0028)],dark)

with TemporaryDirectory() as tmp:
    f=TTFont(ROOT/"app/fonts/bodoni-moda-italic.woff2")
    f.flavor=None; name=Path(tmp)/"bodoni.ttf"; f.save(name)
    face=bpy.data.fonts.load(str(name))
    for letter, offset, height in [("M",-.047,.226),("M",.047,.226)]:
        curve=bpy.data.curves.new("Initiale de la matrice","FONT")
        curve.body=letter;curve.font=face;curve.size=height;curve.align_x="CENTER";curve.align_y="CENTER"
        curve.extrude=.0025;curve.bevel_depth=.0006;curve.bevel_resolution=1;curve.resolution_u=5
        obj=bpy.data.objects.new("Initiale frappante",curve);bpy.context.collection.objects.link(obj)
        obj.location=(offset,-.004,.005);obj.rotation_euler.x=3.14159265
        curve.materials.append(dark)
        bpy.context.view_layer.objects.active=obj;obj.select_set(True)
        bpy.ops.object.convert(target="MESH");obj.select_set(False)
# Coalesce rigid machining parts by finish to keep the number of draw calls small.
for mat in (brass,bright,dark,wood,inlay):
    parts=[obj for obj in bpy.context.scene.objects if obj.type=="MESH" and obj.data.materials[0]==mat]
    if len(parts)>1:
        bpy.ops.object.select_all(action="DESELECT")
        for item in parts:item.select_set(True)
        bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
bpy.ops.object.select_all(action="SELECT")
native = ROOT / "art/blender/cachet.blend"
native.parent.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(native), compress=True)
with TemporaryDirectory(dir=OUT.parent) as workspace:
    staged = Path(workspace) / OUT.name
    bpy.ops.export_scene.gltf(filepath=str(staged),export_format="GLB",use_selection=True,export_texcoords=True,
                              export_normals=True,export_tangents=False,export_yup=True,export_animations=False)
    compact_glb(staged)
    staged.replace(OUT)
print(OUT,OUT.stat().st_size)
