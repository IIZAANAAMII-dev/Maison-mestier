"""A scale model in lacquered folded sheet. Run in Blender 4.3 or later.

From the repository root, render every view and combine the two native camera takes:

blender -b -P art/trace/trace.py -- --build --model
blender -b -P art/trace/trace.py -- --laboratory
blender -b -P art/trace/trace.py -- --still sculpture --width 1280 --height 1056 --samples 44
blender -b -P art/trace/trace.py -- --still sculpture-mobile --width 864 --height 1080 --samples 36
blender -b -P art/trace/trace.py -- --still stand --width 1250 --height 900 --samples 40
blender -b -P art/trace/trace.py -- --still pli --width 1050 --height 816 --samples 32
blender -b -P art/trace/trace.py -- --frames wide --width 864 --height 712 --samples 12
blender -b -P art/trace/trace.py -- --frames tall --width 576 --height 720 --samples 12
python art/trace/edition.py

Set --work on each command to choose a different render directory.
"""

import argparse
import math
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--build", action="store_true")
parser.add_argument("--model", action="store_true")
parser.add_argument("--laboratory", action="store_true", help="Render the web-inspection photographs")
parser.add_argument("--plate", choices=["ensemble", "accueil", "matieres"], help="Limit the laboratory render to one camera")
parser.add_argument("--still", choices=["sculpture", "sculpture-mobile", "stand", "pli"])
parser.add_argument("--frames", choices=["wide", "tall"])
parser.add_argument("--width", type=int, default=800)
parser.add_argument("--height", type=int, default=640)
parser.add_argument("--samples", type=int, default=16)
parser.add_argument("--first", type=int, default=1)
parser.add_argument("--last", type=int, default=60)
parser.add_argument("--work", type=Path, default=Path("/tmp/mestier-trace"))
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
work = args.work.resolve()
work.mkdir(parents=True, exist_ok=True)
folder = Path(__file__).resolve().parent
public = folder.parents[1] / "public/trace"
public.mkdir(parents=True, exist_ok=True)
pi = math.pi
v = Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Le Trait, maquette d’un espace de rencontre"
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.use_denoising = False
scene.cycles.samples = args.samples
scene.cycles.max_bounces = 5
scene.cycles.glossy_bounces = 2
scene.cycles.diffuse_bounces = 2
scene.cycles.transparent_max_bounces = 3
scene.cycles.sample_clamp_indirect = 3.5
scene.cycles.use_animated_seed = False
scene.render.film_transparent = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.24
scene.world = bpy.data.worlds.new("Lumière du papier")
scene.world.use_nodes = True
background = scene.world.node_tree.nodes.get("Background")
background.inputs["Color"].default_value = (0.78, 0.82, 0.86, 1)
background.inputs["Strength"].default_value = 0.12
scene.render.fps = 24
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.compression = 12
scene.render.resolution_percentage = 100
scene.render.resolution_x = args.width
scene.render.resolution_y = args.height
scene.frame_start, scene.frame_end = 1, 60
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.world = bpy.data.worlds.new("Toile de diffusion")
scene.world.use_nodes = True
world = scene.world.node_tree.nodes.get("Background")
world.inputs["Color"].default_value = (0.78, 0.82, 0.92, 1)
world.inputs["Strength"].default_value = 0.55


def linear(x):
    x = x / 255
    return x / 12.92 if x < 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def color(h):
    return tuple(linear(int(h[i : i + 2], 16)) for i in (0, 2, 4)) + (1,)


def finish(name, h, rough=0.41, metal=0, coat=0, grain=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color(h)
    mat.use_nodes = True
    nt = mat.node_tree
    bs = nt.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = color(h)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    bs.inputs["Coat Weight"].default_value = coat
    bs.inputs["Coat Roughness"].default_value = 0.23
    if grain:
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = 290
        tex.inputs["Detail"].default_value = 2
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = grain
        bump.inputs["Distance"].default_value = 0.009
        nt.links.new(tex.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bs.inputs["Normal"])
    return mat


lacquer = finish("Vermillon · laque satinée", "D93012", 0.26, 0.38, 0.32, 0.10)
reverse = finish("Ruban · émail abricot au revers", "E5A77F", 0.31, 0.27, 0.23, 0.08)
edge = finish("Bord franc · champagne satiné", "F0B88A", 0.23, 0.53)
porcelain = finish("Maquette · papier porcelaine", "EBE2CE", 0.53, 0.04, 0.07, 0.12)
chalk = finish("Mobilier · craie", "F3E9D5", 0.52, 0.03, 0.06)
claret = finish("Impression · lie de vin", "532523", 0.41, 0.11)
brass = finish("Laiton · brossé", "AE8156", 0.33, 0.72)
ink = finish("Maquette · graphite", "3C3C37", 0.46, 0.21)
soft = finish("Toile · lin", "C8B89A", 0.68, grain=0.22)


def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


ribbons = collection("01 · La trace qui devient lieu")
mockup = collection("02 · Palier et signalétique")
furniture = collection("03 · Accueil et mobilier")
people = collection("04 · Échelle humaine")
studio = collection("05 · Prise de vue")
camera_set = collection("06 · Les trois caméras")


def put(obj, coll):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    coll.objects.link(obj)
    return obj


def object_mesh(name, verts, faces, mats, coll, indices=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    for mat in mats:
        mesh.materials.append(mat)
    if indices:
        for polygon, idx in zip(mesh.polygons, indices):
            polygon.material_index = idx
    return obj


def bezier_value(controls, u):
    """Centripetal-like four-point Hermite through the art-directed anchors."""
    span = len(controls) - 1
    near = min(span - 1, max(0, int(u * span)))
    t = u * span - near
    p0 = controls[max(0, near - 1)]
    p1 = controls[near]
    p2 = controls[near + 1]
    p3 = controls[min(span, near + 2)]
    return (
        p1 * (2 * t**3 - 3 * t * t + 1)
        + (p2 - p0) * (0.5 * (t**3 - 2 * t * t + t))
        + p2 * (-2 * t**3 + 3 * t * t)
        + (p3 - p1) * (0.5 * (t**3 - t * t))
    )


# XYZ of centreline, full strip width and roll about its tangent. The first
# pose is one calligraphic stroke. The last gives the stand its two portals.
hero_anchors = [
    (-2.90, -0.15, 0.62, 0.43, -21),
    (-2.15, -0.74, 0.47, 0.81, -20),
    (-1.17, -1.03, 1.00, 1.03, -12),
    (-0.62, -0.52, 2.10, 1.00, 9),
    (-1.39, 0.02, 3.05, 0.90, 27),
    (-1.10, 0.51, 3.78, 0.94, 30),
    (0.01, 0.77, 3.92, 1.05, -12),
    (1.05, 0.51, 3.53, 1.08, -76),
    (1.68, 0.03, 2.38, 1.07, -106),
    (1.56, -0.56, 1.15, 0.99, -62),
    (0.86, -0.96, 0.54, 0.88, 9),
    (0.27, -1.01, 0.76, 0.77, 25),
    (0.50, -1.09, 1.67, 0.69, 2),
    (1.49, -1.18, 2.22, 0.64, -9),
    (2.37, -0.89, 2.53, 0.52, -37),
    (2.82, -0.39, 2.87, 0.34, -67),
]
stand_anchors = [
    (-2.62, -0.48, 0.25, 0.68, 85),
    (-2.70, -0.43, 1.09, 0.82, 75),
    (-2.67, -0.34, 2.31, 0.87, 68),
    (-2.42, -0.21, 2.91, 0.94, 64),
    (-1.64, -0.08, 3.14, 1.01, 70),
    (-0.44, 0.03, 3.13, 1.06, 75),
    (0.61, 0.12, 2.96, 1.10, 81),
    (1.28, 0.24, 2.52, 1.08, 85),
    (1.50, 0.48, 1.69, 1.00, 84),
    (1.46, 0.78, 0.88, 0.92, 77),
    (1.75, 1.12, 0.44, 0.90, 55),
    (2.34, 1.57, 0.48, 0.95, 27),
    (2.64, 1.91, 1.12, 1.01, 34),
    (2.48, 2.03, 2.05, 0.98, 48),
    (2.04, 1.94, 2.68, 0.86, 69),
    (1.54, 1.62, 2.90, 0.66, 79),
]


def geometry(data):
    controls = [v(row[:3]) for row in data]
    widths = [row[3] for row in data]
    rolls = [row[4] for row in data]
    vertices = []
    for i in range(217):
        u = i / 216
        centre = bezier_value(controls, u)
        tan = (
            bezier_value(controls, min(1, u + 0.0001)) - bezier_value(controls, max(0, u - 0.0001))
        ).normalized()
        forward = v((0, -1, 0))
        across = forward.cross(tan).normalized()
        depth = tan.cross(across).normalized()
        roll = math.radians(bezier_value(rolls, u))
        lateral = across * math.cos(roll) + depth * math.sin(roll)
        normal = tan.cross(lateral).normalized()
        width = bezier_value(widths, u)
        half = 0.020
        for side in (1, -1):
            for j in range(7):
                x = j / 3 - 1
                bow = 0.021 * (1 - x * x) * width + 0.007 * math.sin(u * pi * 2) * x * x
                vertices.append(centre + lateral * (width * 0.5 * x) + normal * (bow + side * half))
    return vertices


first_shape = geometry(hero_anchors)
last_shape = geometry(stand_anchors)
faces, indices = [], []
for i in range(216):
    a = i * 14
    for j in range(6):
        faces.extend(
            [(a + j, a + 14 + j, a + 15 + j, a + 1 + j), (a + 7 + j, a + 8 + j, a + 22 + j, a + 21 + j)]
        )
        indices.extend((0, 1))
    faces.extend([(a, a + 7, a + 21, a + 14), (a + 6, a + 20, a + 27, a + 13)])
    indices.extend((2, 2))
for end in (0, 216):
    a = end * 14
    for j in range(6):
        face = (a + j, a + j + 1, a + j + 8, a + j + 7)
        faces.append(tuple(reversed(face)) if end == 0 else face)
        indices.append(2)
ribbon = object_mesh(
    "Un seul ruban · de la signature à l’espace",
    first_shape,
    faces,
    [lacquer, reverse, edge],
    ribbons,
    indices,
)
for poly in ribbon.data.polygons:
    poly.use_smooth = poly.material_index != 2
basis = ribbon.shape_key_add(name="01 · Trait libre")
finished = ribbon.shape_key_add(name="02 · Scénographie montée")
for idx, target in enumerate(last_shape):
    finished.data[idx].co = target
for frame, val in [(1, 0), (10, 0), (28, 0.31), (44, 0.86), (55, 1), (60, 1)]:
    finished.value = val
    finished.keyframe_insert(data_path="value", frame=frame)


def soften(obj, amount, segments=3):
    bevel = obj.modifiers.new("Rayons usinés", "BEVEL")
    bevel.width = amount
    bevel.segments = segments
    angle = obj.modifiers.new("Normales de surface", "WEIGHTED_NORMAL")
    angle.keep_sharp = True


def box(name, location, dims, material, coll, radius=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = put(bpy.context.object, coll)
    obj.name = name
    for vert in obj.data.vertices:
        vert.co.x *= dims[0]
        vert.co.y *= dims[1]
        vert.co.z *= dims[2]
    obj.data.materials.append(material)
    if radius:
        soften(obj, radius)
    return obj


def rounded_stage(name, w, d, h, r, z, mat, coll):
    pts = []
    for xn, yn, start in [(1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)]:
        cx = xn * (w * 0.5 - r)
        cy = yn * (d * 0.5 - r)
        for n in range(15):
            a = math.radians(start + 90 * n / 14)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    count = len(pts)
    verts = [(x, y, z + h * k) for k in (0, 1) for x, y in pts]
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    obj = object_mesh(name, verts, faces, [mat], coll)
    soften(obj, min(h * 0.19, 0.032))
    return obj


def line(name, pts, width, mat, coll, smooth=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = width
    curve.bevel_resolution = 3
    if smooth:
        s = curve.splines.new("BEZIER")
        s.bezier_points.add(len(pts) - 1)
        for p, co in zip(s.bezier_points, pts):
            p.co = co
            p.handle_left_type = p.handle_right_type = "AUTO"
        curve.resolution_u = 12
    else:
        s = curve.splines.new("POLY")
        s.points.add(len(pts) - 1)
        for p, co in zip(s.points, pts):
            p.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    coll.objects.link(obj)
    curve.materials.append(mat)
    return obj


def orb(name, co, scale, mat, coll):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=co)
    obj = put(bpy.context.object, coll)
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    for f in obj.data.polygons:
        f.use_smooth = True
    return obj


def label(name, body, loc, size, mat, coll):
    txt = bpy.data.curves.new(name, "FONT")
    txt.body = body
    txt.align_x = "LEFT"
    txt.align_y = "CENTER"
    txt.size = size
    txt.space_character = 1.19
    txt.extrude = 0.0016
    txt.bevel_depth = 0.0005
    txt.bevel_resolution = 1
    obj = bpy.data.objects.new(name, txt)
    coll.objects.link(obj)
    obj.location = loc
    obj.rotation_euler.x = pi / 2
    txt.materials.append(mat)
    return obj


def animate_scale(obj, frames):
    authored = obj.scale.copy()
    for frame, scale in frames:
        obj.scale = tuple(x * s for x, s in zip(authored, scale))
        obj.keyframe_insert(data_path="scale", frame=frame)


def empty(name, coll):
    e = bpy.data.objects.new(name, None)
    coll.objects.link(e)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.28
    return e


plinth = empty("Le plancher se déroule", mockup)
p1 = rounded_stage(
    "Socle d’exposition · contreplaqué cintré", 6.7, 4.13, 0.15, 0.54, 0.03, porcelain, mockup
)
p2 = rounded_stage("Chant inférieur du socle", 6.57, 4.0, 0.035, 0.50, 0.008, claret, mockup)
for obj in (p1, p2):
    obj.parent = plinth
    obj.location.y = 0.48
animate_scale(
    plinth,
    [
        (1, (0.28, 0.26, 0.57)),
        (11, (0.28, 0.26, 0.57)),
        (26, (0.62, 0.50, 0.78)),
        (50, (1, 1, 1)),
        (60, (1, 1, 1)),
    ],
)
# A single collective origin keeps each architectural detail firmly on the floor.
fitout = empty("Le stand s’équipe", furniture)
for x in (-1.85, -0.95, -0.05, 0.85, 1.75):
    line("Joint de calepinage", [(x, -1.31, 0.184), (x, 2.28, 0.184)], 0.006, soft, furniture)
for x, y in [(-1.86, 1.90), (0.08, 1.90), (1.86, 1.90)]:
    box("Pied du signal", (x, y, 1.57), (0.045, 0.05, 2.76), brass, furniture, 0.012)
back = box("Mur sérigraphié", (-0.04, 1.95, 1.69), (3.83, 0.075, 2.36), chalk, furniture, 0.045)
line(
    "Encadrement du mur",
    [(-1.99, 1.89, 0.52), (-1.99, 1.89, 2.89), (1.94, 1.89, 2.89)],
    0.025,
    brass,
    furniture,
)
sign = label("Enseigne de la Maison", "MESTIER", (-1.62, 1.902, 2.02), 0.44, claret, furniture)
# Move the name clear of the bending front edge as the rear panel rises.
for frame, horizontal, elevation, size in (
    (1, -1.62, 2.02, 1),
    (23, -1.62, 2.02, 1),
    (39, -1.72, 1.78, 0.84),
    (60, -1.72, 1.78, 0.84),
):
    sign.location.x = horizontal
    sign.location.z = elevation
    sign.scale = (size,) * 3
    sign.keyframe_insert(data_path="location", frame=frame)
    sign.keyframe_insert(data_path="scale", frame=frame)
label("Accroche sur le stand", "M A I S O N", (-1.60, 1.902, 2.47), 0.115, claret, furniture)
box("Comptoir · fût", (-0.72, -0.24, 0.74), (1.64, 0.59, 1.11), porcelain, furniture, 0.12)
box("Comptoir · couronne", (-0.72, -0.24, 1.31), (1.72, 0.65, 0.09), lacquer, furniture, 0.04)
for k in range(22):
    x = -1.425 + k * 0.067
    line("Cannelure du comptoir", [(x, -0.531, 0.31), (x, -0.531, 1.17)], 0.014, chalk, furniture)
# Reproduce the Maison’s actual drawn mark as a thin brass inlay on the counter.
box("Cartouche de la Maison", (-0.72, -0.552, 0.84), (0.46, 0.025, 0.40), claret, furniture, 0.028)
existing_curves = set(bpy.data.objects)
bpy.ops.import_curve.svg(filepath=str(public.parent / "charte/monogramme-encre.svg"))
mark = next(ob for ob in set(bpy.data.objects) - existing_curves if ob.type == "CURVE")
mark.data.resolution_u = 4
bpy.context.view_layer.update()
mark_graph = bpy.context.evaluated_depsgraph_get()
mark_mesh = bpy.data.meshes.new_from_object(mark.evaluated_get(mark_graph), depsgraph=mark_graph)
mark_mesh.transform(mark.matrix_world)
xs, ys = ([vertex.co[axis] for vertex in mark_mesh.vertices] for axis in (0, 1))
factor = 0.31 / (max(xs) - min(xs))
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
for vertex in mark_mesh.vertices:
    x, y, _ = vertex.co
    vertex.co = ((x - cx) * factor - 0.72, -0.567, (y - cy) * factor + 0.84)
mark_mesh.materials.clear()
mark_mesh.materials.append(brass)
stamp = bpy.data.objects.new("Monogramme en marqueterie de laiton", mark_mesh)
furniture.objects.link(stamp)
bpy.data.objects.remove(mark, do_unlink=True)
box("Catalogue sur comptoir", (-0.76, -0.29, 1.39), (0.36, 0.23, 0.038), claret, furniture, 0.01)
box("Feuillets du catalogue", (-0.72, -0.21, 1.418), (0.30, 0.20, 0.012), porcelain, furniture, 0.005)
for x in (-1.83, -1.27):
    box("Piètement de banquette", (x, 1.14, 0.38), (0.06, 0.38, 0.39), brass, furniture, 0.018)
box("Assise rembourrée", (-1.55, 1.14, 0.61), (0.97, 0.49, 0.16), soft, furniture, 0.075)
backrest = box("Dossier en lin", (-1.55, 1.36, 0.83), (0.97, 0.10, 0.44), soft, furniture, 0.047)
backrest.rotation_euler.x = math.radians(-5)
for x in (-1.88, -1.22):
    box("Support du dossier", (x, 1.41, 0.71), (0.028, 0.034, 0.43), brass, furniture, 0.009)
for n in range(17):
    x = -1.94 + n * 0.048
    line("Couture sellier", [(x, 0.897, 0.613), (x + 0.024, 0.897, 0.613)], 0.0025, claret, furniture)
box("Lutrin · tige", (1.84, -0.47, 0.87), (0.035, 0.035, 1.32), brass, furniture, 0.008)
pod = box("Lutrin imprimé", (1.84, -0.47, 1.55), (0.54, 0.10, 0.39), claret, furniture, 0.035)
pod.rotation_euler.x = math.radians(-14)
box("Pied du lutrin", (1.84, -0.47, 0.20), (0.29, 0.25, 0.03), brass, furniture, 0.015)
# Small offset display tables reveal the depth of the stand.
for x, y, h in ((0.82, 1.05, 0.66), (1.10, 1.15, 0.84)):
    box("Tablette · colonne", (x, y, 0.18 + h * 0.5), (0.055, 0.055, h), brass, furniture, 0.01)
    box("Tablette · plateau", (x, y, 0.18 + h), (0.45, 0.33, 0.045), porcelain, furniture, 0.02)
# Three stepped lacquer samples sit on a removable brass rack, each at a different angle.
for idx, mat in enumerate((reverse, lacquer, claret)):
    x = 0.66 + idx * 0.34
    box("Rail en laiton", (x, 1.86, 1.40), (0.28, 0.10, 0.035), brass, furniture, 0.009)
    sample = box("Nuancier de laque", (x, 1.853, 1.64), (0.25, 0.036, 0.45), mat, furniture, 0.013)
    sample.rotation_euler.y = math.radians((idx - 1) * 7)
    line("Repère gravé", [(x - 0.06, 1.906, 1.30), (x + 0.06, 1.906, 1.30)], 0.006, brass, furniture)
for idx, mat in enumerate((soft, reverse, claret)):
    sheet = box("Feuillet de matière", (0.82, 1.05, 0.87 + idx * 0.026), (0.32, 0.23, 0.018), mat, furniture, 0.006)
    sheet.rotation_euler.z = math.radians((idx - 1) * 12)
for ob in list(furniture.objects):
    if ob != fitout:
        ob.parent = fitout
animate_scale(
    fitout,
    [
        (1, (0.001, 0.001, 0.001)),
        (18, (0.001, 0.001, 0.001)),
        (31, (0.66, 0.66, 0.30)),
        (48, (1, 1, 1)),
        (60, (1, 1, 1)),
    ],
)

visitors = empty("Échelle de la maquette", people)


# Artisan-style monochrome scale figures, each with its own gesture.
def figure(name, x, y, h, heading, gesture, coat):
    g = empty(name, people)
    g.parent = visitors
    g.location = (x, y, 0.185)
    g.rotation_euler.z = heading
    g.scale = (h / 1.70,) * 3

    def cap(s, co, scale):
        o = orb(name + " · " + s, co, scale, coat, people)
        o.parent = g
        return o

    def limb(s, pts, w):
        o = line(name + " · " + s, pts, w, coat, people, True)
        o.parent = g

    cap("tête", (0, 0, 1.52), (0.105, 0.104, 0.135))
    cap("épaules", (0, 0.006, 1.20), (0.188, 0.104, 0.234))
    cap("taille", (0, 0.018, 0.98), (0.138, 0.103, 0.16))
    limb("jambe en appui", [(-0.072, 0.005, 1.01), (-0.09, 0.026, 0.59), (-0.11, -0.03, 0.105)], 0.059)
    limb("jambe libre", [(0.077, 0.014, 1.01), (0.108, -0.027, 0.58), (0.138, 0.072, 0.105)], 0.056)
    cap("chaussure gauche", (-0.11, -0.076, 0.072), (0.065, 0.115, 0.044))
    cap("chaussure droite", (0.138, 0.033, 0.068), (0.067, 0.11, 0.042))
    limb("bras gauche", [(-0.139, 0, 1.30), (-0.211, -0.026, 1.12), (-0.176, -0.04, 0.95)], 0.042)
    limb(
        "bras droit",
        [
            (0.141, 0, 1.30),
            (0.218, -0.02, 1.12),
            (0.157, -0.178, 1.19) if gesture else (0.188, -0.045, 0.93),
        ],
        0.041,
    )


figure("Visiteuse", 0.58, -0.54, 1.53, -0.47, True, ink)
figure("Exposant", -0.46, 0.25, 1.58, 2.37, False, soft)
animate_scale(
    visitors,
    [
        (1, (0.001, 0.001, 0.001)),
        (29, (0.001, 0.001, 0.001)),
        (44, (0.63, 0.63, 0.63)),
        (56, (1, 1, 1)),
        (60, (1, 1, 1)),
    ],
)

floor = box("Cyclorama · capteur d’ombres", (0, 0, -0.035), (200, 200, 0.06), chalk, studio)
floor.is_shadow_catcher = True


def area(name, loc, target, power, tint, size, y):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = tint
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = y
    ob = bpy.data.objects.new(name, data)
    studio.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (v(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


area("Boîte à lumière principale", (-5, -4.8, 8.6), (0, 0, 1.9), 930, (1, 0.938, 0.861), 5, 5)
area("Long reflet dans la laque", (4, 0.7, 6.6), (0, 0, 1.8), 1020, (1, 0.93, 0.85), 2.4, 6)
area("Contre-jour du pli", (-2, 4.6, 5.6), (0, 0, 2.2), 760, (0.91, 0.94, 1), 4.7, 3.3)
area("Retour diffus", (4, -6.6, 2.2), (0, 0, 1.1), 250, (0.91, 0.945, 1), 4.5, 4.5)


def camera(name, keys):
    data = bpy.data.cameras.new(name)
    data.sensor_width = 36
    data.lens = 52
    ob = bpy.data.objects.new(name, data)
    camera_set.objects.link(ob)
    for frame, loc, look, lens in keys:
        ob.location = loc
        ob.rotation_euler = (v(look) - ob.location).to_track_quat("-Z", "Y").to_euler()
        data.lens = lens
        ob.keyframe_insert(data_path="location", frame=frame)
        ob.keyframe_insert(data_path="rotation_euler", frame=frame)
        data.keyframe_insert(data_path="lens", frame=frame)
    return ob


wide = camera(
    "01 · Caméra du trait",
    [
        (1, (5.2, -12.8, 6.05), (0.00, -0.04, 2.05), 68),
        (13, (4.5, -11.8, 5.60), (0.0, 0.00, 2.00), 65),
        (28, (1.45, -7.8, 3.7), (-0.04, -0.12, 2.00), 59),
        (41, (3.04, -9.9, 4.7), (0.00, 0.12, 1.70), 55),
        (60, (6.8, -12.2, 6.5), (0.00, 0.30, 1.52), 57),
    ],
)
tall = camera(
    "02 · Caméra du trait vertical",
    [
        (1, (4.0, -13.9, 6.50), (-0.02, -0.04, 1.99), 66),
        (13, (3.38, -12.6, 5.83), (0.00, 0.00, 2.04), 61),
        (28, (0.66, -8.15, 3.46), (0.08, -0.04, 2.12), 53),
        (41, (3.08, -10.5, 5.0), (0.00, 0.12, 1.75), 46),
        (60, (6.7, -14.5, 7.7), (-0.10, 0.26, 1.55), 48),
    ],
)
detail = camera("03 · Lumière de chant", [(1, (2.50, -4.80, 3.02), (0.96, -0.54, 2.10), 94)])
scene.camera = wide
scene.frame_set(1)
for frame, label_ in [
    (1, "Le trait"),
    (13, "L’approche"),
    (28, "Le passage"),
    (42, "Le montage"),
    (60, "Le lieu de rencontre"),
]:
    scene.timeline_markers.new(label_, frame=frame)


def render_png(path):
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


if args.build:
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 960
    scene.cycles.samples = 28
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.object.select_all(action="DESELECT")
    ribbon.select_set(True)
    bpy.context.view_layer.objects.active = ribbon
    for screen in bpy.data.screens:
        for space in [a.spaces.active for a in screen.areas if a.type == "VIEW_3D"]:
            space.region_3d.view_perspective = "CAMERA"
            space.shading.color_type = "MATERIAL"
            space.overlay.show_overlays = False
    bpy.ops.wm.save_as_mainfile(
        filepath=str(folder / "le-trait.blend"), compress=True, relative_remap=False
    )
if args.still:
    scene.frame_set(60 if args.still == "stand" else 1)
    scene.camera = {"sculpture": wide, "sculpture-mobile": tall, "stand": wide, "pli": detail}[args.still]
    render_png(work / (args.still + ".png"))
if args.laboratory:
    # Each photograph has a matching interactive pose (Blender XYZ → glTF XZ−Y).
    scene.frame_set(60)
    scene.render.film_transparent = False
    floor.is_shadow_catcher = False
    scene.cycles.samples = args.samples
    scene.render.resolution_x, scene.render.resolution_y = 1080, 800
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    views = [
        ("ensemble", (0, 0.36, 1.47), (5.1, -9.8, 4.9), 51),
        ("accueil", (-0.72, -0.23, 1.03), (-2.50, -4.35, 2.13), 73),
        ("matieres", (0.99, 1.85, 1.62), (0.62, 0.12, 1.57), 49),
    ]
    for name, target, position, lens in views:
        if args.plate and name != args.plate:
            continue
        camera_data = bpy.data.cameras.new(name)
        camera_data.lens = lens
        camera_obj = bpy.data.objects.new(name, camera_data)
        scene.collection.objects.link(camera_obj)
        camera_obj.location = position
        camera_obj.rotation_euler = (v(target) - v(position)).to_track_quat("-Z", "Y").to_euler()
        scene.camera = camera_obj
        plate = work / ("labo-" + name + ".png")
        scene.render.filepath = str(plate)
        bpy.ops.render.render(write_still=True)
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(plate),
            "-vf", "hqdn3d=4:3:0:0", "-c:v", "libwebp", "-quality", "83",
            "-compression_level", "6", "-frames:v", "1", str(public / ("labo-" + name + ".webp")),
        ], check=True)

if args.frames:
    frame_dir = work / args.frames
    frame_dir.mkdir(exist_ok=True)
    scene.camera = tall if args.frames == "tall" else wide
    scene.render.use_persistent_data = True
    for frame in range(args.first, args.last + 1):
        scene.frame_set(frame)
        render_png(frame_dir / ("%03d.png" % frame))


if args.model:
    # Bake the assembled pose to one object. Every drawable keeps its PBR
    # material; neither the studio world nor the source animation enters glTF.
    scene.frame_set(60)
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    converted = []
    originals = [
        ob
        for coll in (ribbons, mockup, furniture, people)
        for ob in coll.objects
        if ob.type in ("MESH", "FONT", "CURVE")
    ]
    for ob in originals:
        mesh = bpy.data.meshes.new_from_object(ob.evaluated_get(graph), depsgraph=graph)
        mesh.transform(ob.matrix_world)
        clone = bpy.data.objects.new(ob.name + " · prototype", mesh)
        scene.collection.objects.link(clone)
        converted.append(clone)
    bpy.ops.object.select_all(action="DESELECT")
    for clone in converted:
        clone.select_set(True)
    bpy.context.view_layer.objects.active = converted[0]
    bpy.ops.object.join()
    result = bpy.context.view_layer.objects.active
    result.name = "Le Trait · stand assemblé"
    material_cache = {}
    for slot in result.material_slots:
        authored = slot.material
        if authored not in material_cache:
            mat = bpy.data.materials.new(authored.name + " · web")
            mat.use_nodes = True
            source = authored.node_tree.nodes.get("Principled BSDF")
            target = mat.node_tree.nodes.get("Principled BSDF")
            for channel in ("Base Color", "Metallic", "Roughness", "Coat Weight", "Coat Roughness"):
                target.inputs[channel].default_value = source.inputs[channel].default_value
            material_cache[authored] = mat
        slot.material = material_cache[authored]
    bpy.ops.export_scene.gltf(
        filepath=str(public / "stand.glb"),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_texcoords=False,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )
