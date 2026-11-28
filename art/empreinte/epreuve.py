"""Photograph the original die beside its blind embossing and draw the same view.

blender -b -t 6 -P art/empreinte/epreuve.py
For a quick proof, add -- --proof (outputs to /tmp).
"""
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
from mathutils.geometry import interpolate_bezier
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[2]
proof = "--proof" in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(root / "art/empreinte/poincon.blend"))
scene = bpy.context.scene
official = bpy.data.objects["M officiel · tracé original en relief"]
die = official.parent
die.animation_data_clear()
die.scale = (.42,) * 3
die.location = (1.29, 1.02, .25)
die.rotation_euler = (0, 0, math.radians(-14))
for obj in list(scene.objects):
    if obj.type == "LIGHT" or obj.name.startswith("Drapeau"):
        bpy.data.objects.remove(obj, do_unlink=True)

# Sample the actual cubic supplied to the die. The relief of the sheet is
# formed from this outline, so there is no second, independently drawn M.
points = official.data.splines[0].bezier_points
contour = []
for i, point in enumerate(points):
    following = points[(i + 1) % len(points)]
    curve = interpolate_bezier(point.co, point.handle_right, following.handle_left, following.co, 9)
    contour.extend([(v.x, v.y) for v in curve[:-1]])
actual_width = max(x for x, _ in contour) - min(x for x, _ in contour)
paper_mark = [(-.22 + x * 1.87 / actual_width, -.045 + y * 1.87 / actual_width) for x, y in contour]


def material(name, color_a, color_b, grain, strength, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, attach = mat.node_tree.nodes, mat.node_tree.links.new
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = roughness
    coords = nodes.new("ShaderNodeTexCoord")
    variation = nodes.new("ShaderNodeTexNoise")
    variation.inputs["Scale"].default_value = grain
    variation.inputs["Detail"].default_value = 2.7
    attach(coords.outputs["Object"], variation.inputs["Vector"])
    ramp = nodes.new("ShaderNodeValToRGB")
    for element, color in zip(ramp.color_ramp.elements, (color_a, color_b)):
        element.color = (*color, 1)
    attach(variation.outputs["Fac"], ramp.inputs[0])
    attach(ramp.outputs["Color"], shader.inputs["Base Color"])
    fiber = nodes.new("ShaderNodeTexNoise")
    fiber.inputs["Scale"].default_value = grain * 5
    fiber.inputs["Detail"].default_value = 2.2
    attach(coords.outputs["Object"], fiber.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Distance"].default_value = .012
    bump.inputs["Strength"].default_value = strength
    attach(fiber.outputs["Fac"], bump.inputs["Height"])
    attach(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat


paper = material("Papier coton · fibres et foulage", (.56,.465,.35), (.94,.815,.65), 28, .34, .9)
wine = material("Papier de garde vermillon", (.14,.012,.007), (.245,.033,.018), 26, .3, .88)
stone = material("Table de relieur", (.15,.111,.085), (.26,.196,.152), 3.3, .33, .82)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,-.26))
table = bpy.context.object
table.dimensions = (35,35,.5)
table.data.materials.append(stone)
width, height = 4.35, 3.27


def edge_point(x, y):
    # Deckle follows the cut. It affects the physical edge, not just the color.
    x += (.005 * math.sin(y * 71 + .5) + .0032 * math.sin(y * 39.3) + .0024 * math.cos(y * 16.1)) * abs(2*x/width) ** 14
    y += (.0045 * math.sin(x * 77 - 1) + .003 * math.cos(x * 45.1) + .0027 * math.sin(x * 19.8)) * abs(2*y/height) ** 14
    return x,y


def sheet(name, pigment, origin, angle, embossed=False):
    nx, ny = (448, 336) if embossed else (80, 60)
    pixels = Image.new("L", (nx*4 + 1, ny*4 + 1), 0)
    if embossed:
        mapped = [((x/width+.5)*nx*4, (y/height+.5)*ny*4) for x,y in paper_mark]
        ImageDraw.Draw(pixels).polygon(mapped, fill=255)
        pixels = pixels.filter(ImageFilter.GaussianBlur(3.8))
    levels = np.asarray(pixels.resize((nx+1,ny+1), Image.Resampling.LANCZOS))/255
    verts = []
    for j in range(ny+1):
        for i in range(nx+1):
            x,y = edge_point(width*(i/nx-.5), height*(j/ny-.5))
            bow = .021*(i/nx)**6*(1-j/ny)**4 + .018*(1-i/nx)**6*(j/ny)**5
            verts.append((x,y,bow+float(levels[j,i])*.041))
    faces = [(j*(nx+1)+i, j*(nx+1)+i+1, (j+1)*(nx+1)+i+1, (j+1)*(nx+1)+i) for j in range(ny) for i in range(nx)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(obj)
    obj.location=origin
    obj.rotation_euler.z=math.radians(angle)
    mesh.materials.append(pigment)
    mesh.polygons.foreach_set("use_smooth", np.ones(len(mesh.polygons),dtype=bool))
    edges = obj.modifiers.new("Tranche du papier", "SOLIDIFY")
    edges.thickness = .014
    return obj


layers = [
    sheet("Papier de garde", wine, (-.80,-.30,.023), 15),
    sheet("Second tirage", paper, (-.70,-.31,.060), 5),
    sheet("Épreuve à sec · M officiel", paper, (-.69,-.27,.104), 9, True),
]
top = layers[-1]
camera = scene.camera
camera.data.animation_data_clear()
camera.data.ortho_scale = 5.8
camera.location=(.4,-4.4,7.65)
camera.rotation_euler=(Vector((.04,.05,.12))-camera.location).to_track_quat("-Z","Y").to_euler()
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(.72,.69,.65,1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.35


def light(name, origin, size, height, power, tint):
    data=bpy.data.lights.new(name,"AREA")
    data.shape="RECTANGLE"
    data.size,data.size_y,data.energy,data.color=size,height,power,tint
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=origin
    obj.rotation_euler=(Vector((0,.1,0))-obj.location).to_track_quat("-Z","Y").to_euler()


light("Fenêtre rasante",(-4.8,2.4,1.8),3.5,1.2,500,(1,.91,.78))
light("Carton de renvoi",(3.6,-.65,4.7),2.6,4.5,220,(.92,.95,1))
light("Reflet allongé",(.1,3.7,3.4),1.1,5,180,(1,.94,.85))
scene.render.film_transparent=False
scene.cycles.samples=10 if proof else 54
scene.cycles.use_denoising=False
scene.render.image_settings.file_format="WEBP"
scene.render.image_settings.color_mode="RGB"
scene.render.image_settings.quality=90
scene.render.resolution_x,scene.render.resolution_y=1200,900
scene.render.resolution_percentage=40 if proof else 100
scene.render.filepath=str(Path("/tmp/empreinte-proof.webp") if proof else root / "public/images/empreinte.webp")
scene.view_settings.exposure=0
bpy.context.view_layer.update()


def project(obj, xyz):
    pt = world_to_camera_view(scene, camera, obj.matrix_world @ Vector(xyz))
    return (pt.x, 1-pt.y)


for name,obj in [("emboss",top),("die",official)]:
    cx,cy=project(obj,(-.22,-.045,.03) if name=="emboss" else (0,0,.06))
    print("Study focus",name,round(cx*100),round(cy*100),flush=True)
bpy.ops.render.render(write_still=True)
if not proof:
    # Draft the same camera projection on rag paper. Each path comes from the
    # sheet, the original die mesh or its SVG contour.
    w,h=2200,1650
    plate=Image.new("RGB",(w,h),"#f1ebe0")
    pen=ImageDraw.Draw(plate)

    def polygon(obj, vertices, color, stroke, weight):
        polygon_points=[(x*w,y*h) for x,y in (project(obj,v) for v in vertices)]
        pen.polygon(polygon_points,fill=color)
        pen.line(polygon_points+[polygon_points[0]], fill=stroke,width=weight,joint="curve")

    for i,layer in enumerate(layers):
        corners=[(-width/2,-height/2,.01),(width/2,-height/2,.02),(width/2,height/2,.0),(-width/2,height/2,.01)]
        polygon(layer,corners,["#c9b2a4","#e2d9c8","#f9f3e7"][i],"#796a5a",3)
    polygon(top,[(x,y,.041) for x,y in paper_mark],"#ede2ce","#8a7b68",3)
    body=next(o for o in die.children if o.type=="MESH")
    n=len(body.data.polygons[0].vertices)
    for face_id,tint in [(0,"#b3a38d"),(-1,"#ece2ce")]:
        z=-.475 if face_id==0 else .159
        scale=.955 if face_id==0 else .984
        coords=[(body.data.vertices[j].co.x*scale/.944,body.data.vertices[j].co.y*scale/.944,z) for j in range(n)]
        polygon(body,coords,tint,"#78634d",4)
    polygon(official,[(x,y,.095) for x,y in contour],"#d6c4a7","#715b46",4)
    plate.resize((1100,825),Image.Resampling.LANCZOS).save(root / "public/images/releves/empreinte.webp",quality=90)
