"""Le Pavillon, an original Maison Mestier scenography. Blender 4.3+.

    blender -b -t 6 -P art/pavillon/pavillon.py -- --mode stills
    blender -b -t 6 -P art/pavillon/pavillon.py -- --mode film
    blender -b -t 6 -P art/pavillon/pavillon.py -- --mode film --portrait
    blender -b -P art/pavillon/pavillon.py -- --mode model

The editable file contains the four photographic cameras and an animated master.
Materials, weave, stitching and rigging are procedural and travel with the scene.
"""
from pathlib import Path
import argparse
import math
import sys
import tempfile
import subprocess

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--mode", choices=["preview", "scene", "stills", "film", "model", "encode"], default="stills")
parser.add_argument("--shot", choices=["salle", "salle-mobile", "interieur", "detail"])
parser.add_argument("--width", type=int)
parser.add_argument("--samples", type=int)
parser.add_argument("--portrait", action="store_true", help="Render or encode the native mobile travelling.")
parser.add_argument("--work-dir", type=Path)
parser.add_argument("--from-image", type=int, default=1, choices=range(1, 73), metavar="1–72",
                    help="Resume this film render at an existing work directory from the indicated image.")
parser.add_argument("--reuse-frames", action="store_true", help="Reuse complete frames of the same camera, size and scene in the chosen work directory.")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
art = Path(__file__).resolve().parent
assets = art.parent.parent / "public" / "pavillon"
work = args.work_dir or Path(tempfile.gettempdir()) / "mestier-pavillon-rendus"
work.mkdir(parents=True, exist_ok=True)
assets.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Maison Mestier · Le Pavillon"
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples or 70
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.cycles.transmission_bounces = 3
scene.cycles.sample_clamp_indirect = 3.0
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .045
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -.35
scene.world = bpy.data.worlds.new("Le ciel de la cour")
scene.world.use_nodes = True
world_shader = scene.world.node_tree.nodes.get("Background")
world_shader.inputs["Color"].default_value = (.68, .76, .95, 1)
world_shader.inputs["Strength"].default_value = .22
world_tree = scene.world.node_tree
world_nodes = world_tree.nodes
sky_coord = world_nodes.new("ShaderNodeTexCoord")
sky_height = world_nodes.new("ShaderNodeSeparateXYZ")
world_tree.links.new(sky_coord.outputs["Generated"], sky_height.inputs["Vector"])
sky_ramp = world_nodes.new("ShaderNodeValToRGB")
sky_ramp.color_ramp.elements[0].color = (1.7, 1.69, 1.61, 1)
sky_ramp.color_ramp.elements[1].position = .62
sky_ramp.color_ramp.elements[1].color = (.97, 1.2, 1.5, 1)
world_tree.links.new(sky_height.outputs["Z"], sky_ramp.inputs[0])
sky_visible = world_nodes.new("ShaderNodeBackground")
world_tree.links.new(sky_ramp.outputs[0], sky_visible.inputs[0])
sky_visible.inputs[1].default_value = 1.55
sky_mix = world_nodes.new("ShaderNodeMixShader")
world_tree.links.new(world_nodes.new("ShaderNodeLightPath").outputs["Is Camera Ray"], sky_mix.inputs[0])
world_tree.links.new(world_shader.outputs[0], sky_mix.inputs[1])
world_tree.links.new(sky_visible.outputs[0], sky_mix.inputs[2])
world_tree.links.new(sky_mix.outputs[0], world_nodes.get("World Output").inputs[0])
bpy.context.preferences.filepaths.save_version = 0

def collection(name):
    coll = bpy.data.collections.new(name)
    scene.collection.children.link(coll)
    return coll

room = collection("Architecture · pierre et encre")
metalwork = collection("Ossature · laiton patiné")
clothwork = collection("Textiles · lin et taffetas")
furniture = collection("Mobilier · pierre de Bourgogne")
lights = collection("Lumière · soleil rasant et réflecteurs")
cameras = collection("Photographie · appareils et mouvement")

def assign(ob, coll):
    for parent in list(ob.users_collection):
        parent.objects.unlink(ob)
    coll.objects.link(ob)
    return ob

def rgb(color):
    def linear(value):
        c = int(value, 16) / 255
        return c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4
    return [linear(color[i:i + 2]) for i in (0, 2, 4)] + [1]

def surface(name, color, roughness, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgb(color)
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgb(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    return mat, shader

def textured(name, colors, scale, grain, bump, roughness, metal=0, stretch=(1, 1, 1)):
    mat, shader = surface(name, colors[0], roughness, metal)
    tree = mat.node_tree
    nodes, link = tree.nodes, tree.links.new
    coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = stretch
    link(coord.outputs["Object"], mapping.inputs[0])
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 4
    noise.inputs["Roughness"].default_value = .64
    link(mapping.outputs["Vector"], noise.inputs["Vector"])
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .19
    ramp.color_ramp.elements[0].color = rgb(colors[0])
    ramp.color_ramp.elements[1].position = .82
    ramp.color_ramp.elements[1].color = rgb(colors[1])
    link(noise.outputs["Fac"], ramp.inputs[0])
    link(ramp.outputs[0], shader.inputs["Base Color"])
    granular = nodes.new("ShaderNodeTexNoise")
    granular.inputs["Scale"].default_value = grain
    granular.inputs["Detail"].default_value = 2
    link(mapping.outputs["Vector"], granular.inputs["Vector"])
    normal = nodes.new("ShaderNodeBump")
    normal.inputs["Strength"].default_value = .2
    normal.inputs["Distance"].default_value = bump
    link(granular.outputs["Fac"], normal.inputs["Height"])
    link(normal.outputs["Normal"], shader.inputs["Normal"])
    return mat

sand = textured("Calcaire blond · scié", ("a0927a", "d5c9ac"), 2, 115, .008, .71, stretch=(.55, 2.1, 3))
floor = textured("Dalles · poudre de pierre", ("8c8174", "a99d8b"), 3, 160, .012, .64)
joint = surface("Joints · poussière chaude", "696059", .85)[0]
plaster = textured("Enduit · chaux sable", ("a19283", "c1b4a2"), .9, 65, .022, .89)
ink = textured("Encre · aluminium satiné", ("202428", "31343a"), 1.1, 90, .006, .62, .12)
bronze = textured("Laiton · structure brossée", ("6d5234", "ba9463"), 2.7, 100, .003, .31, .71, (14, 14, 1))
thread = surface("Lin · lisière surpiquée", "a54727", .76)[0]
linen = textured("Papier d'abaca · ivoire ombré", ("b8a68c", "ebe0c0"), 1.8, 110, .01, .74, stretch=(3, 3, .9))
silk = textured("Taffetas de soie · rouge oxyde", ("9a321c", "c9542b"), 5, 230, .005, .48, stretch=(1.15, 1.15, .38))
silk_shader = silk.node_tree.nodes.get("Principled BSDF")
silk_shader.inputs["Sheen Weight"].default_value = .32
silk_shader.inputs["Sheen Roughness"].default_value = .5
silk_shader.inputs["Specular IOR Level"].default_value = .31
stone_dark = textured("Travertin · noyer", ("352a25", "655145"), 3.0, 90, .017, .53, stretch=(.7, 2.2, 4))

def box(name, pos, size, mat, coll=room, radius=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    ob = assign(bpy.context.object, coll)
    ob.name = name
    ob.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    if radius:
        bevel = ob.modifiers.new("Arêtes adoucies", "BEVEL")
        bevel.width = radius
        bevel.segments = 3
        ob.modifiers.new("Normales de surface", "WEIGHTED_NORMAL")
    return ob

def tube(name, coords, radius, mat, coll=metalwork, cyclic=False, detail=2):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 2
    data.bevel_depth = radius
    data.bevel_resolution = detail
    spline = data.splines.new("POLY")
    spline.points.add(len(coords) - 1)
    for p, xyz in zip(spline.points, coords):
        p.co = (*xyz, 1)
    spline.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(name, data)
    coll.objects.link(ob)
    data.materials.append(mat)
    return ob

def cylinder(name, pos, radius, depth, mat, coll=furniture, scale=(1, 1), bevel=.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=100, radius=radius, depth=depth, location=pos)
    ob = assign(bpy.context.object, coll)
    ob.name = name
    ob.scale.x, ob.scale.y = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    for polygon in ob.data.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    if bevel:
        mod = ob.modifiers.new("Chanfrein", "BEVEL")
        mod.width, mod.segments = bevel, 3
        ob.modifiers.new("Normales", "WEIGHTED_NORMAL")
    return ob

def mesh_object(name, verts, faces, mat, coll):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    coll.objects.link(obj)
    data.materials.append(mat)
    return obj

# A lowered gallery meets a skylit court. Regular joints give the installation scale.
box("Sous-sol · ombres des joints", (0, 0, -.17), (60, 44, .2), joint)
for j in range(10):
    for i in range(10):
        box("Pierre de sol", (-16 + i * 3.55 + (j % 2) * .95, -12 + j * 2.22, -.08),
            (3.546, 2.216, .15), floor)
box("Façade aveugle · fond de l'enfilade", (-7.35, 7.3, 4.72), (16.3, .5, 9.45), plaster)
box("Retour de cour", (11.2, 5.8, 4.7), (.55, 6.0, 9.4), plaster)
box("Mur bas sous le jour", (5.98, 7.3, .58), (10.4, .52, 1.16), sand)
box("Linteau de la claire-voie", (6, 7.32, 8.29), (10.6, .57, 2.3), plaster)
for x in [1.1, 3.3, 5.5, 7.7, 9.9]:
    box("Lame de la claire-voie", (x, 7.25, 4.18), (.19, .62, 6.1), sand, radius=.022)
box("Aile d'ombre · mur d'encre", (-8.8, -.35, 3.5), (.34, 14.5, 7), ink, radius=.025)
box("Plafond bas de la galerie", (-7.2, 1.65, 6.51), (4.15, 12.2, .35), ink, radius=.014)
for y in [-5, -3.6, -2.2, -.8, .6, 2, 3.4, 4.8, 6.2]:
    box("Raidisseur · galerie ouest", (-8.55, y, 3.18), (.14, .065, 6.35), ink)
# A deliberately broken joint in the plaster catches the oblique light.
for x in [-11.2, -8.9, -6.6, -4.3, -2, .3]:
    box("Joint creux · panneaux de chaux", (x, 7.039, 4.69), (.012, .008, 9.35), joint)
# An outer wall beyond the clerestory receives sunlight instead of exposing a flat world.
box("Deuxième enceinte · façade au soleil", (6.5, 14.2, 6.1), (28, .45, 12.2), plaster)
for x in (3.2, 5.0, 6.8, 8.6, 10.4):
    box("Brise-soleil · ombre oblique", (x, 6.1, 7.22), (.23, 3.5, .25), bronze, radius=.018)
for z in [1.95, 4.55, 7.16]:
    box("Joint horizontal · chaux", (-7.4, 7.038, z), (16.1, .008, .011), joint)

# Tiers on an elliptical base have narrow reveals, like an actual installation floor.
stage = (.45, .80)
for z, height, a, b in [(.087, .17, 5.25, 3.58), (.245, .15, 5.0, 3.33)]:
    cylinder("Degré elliptique · calcaire", (*stage, z), 1, height, sand, scale=(a, b), bevel=.026)
cylinder("Jonc de rive · laiton", (*stage, .183), 1, .025, bronze, scale=(5.02, 3.34), bevel=.008)

pi = math.pi
sin, cos = math.sin, math.cos
def rail_point(u):
    ang = math.radians(145 - 218 * u)
    return Vector((.6 + 4.33 * cos(ang), .8 + 2.82 * sin(ang), 0))
def normal(u):
    delta = rail_point(u + .0001) - rail_point(u - .0001)
    return Vector((-delta.y, delta.x, 0)).normalized()
def upper(u):
    return 5.28 + .96 * sin(1.76 * pi * (u - .12)) + .50 * sin(pi * u)
def lower(u):
    # The front opening lifts on one side and brings the eye to the bench inside.
    return .48 + 2.62 * math.exp(-((u - .67) / .19) ** 2) + .64 * sin(pi * u) ** 2 + .30 * u
def point(u, v):
    n = normal(u)
    theta = 2 * pi * (43 * u + .10 * sin(2 * pi * u) + .10 * sin(pi * v)
                       + .22 * (1 - v) * sin(2 * pi * u))
    folds = (.078 + .067 * (1 - v)) * (sin(theta) + .21 * sin(2 * theta + .32))
    billow = .57 * sin(pi * v) * (.45 + sin(2 * pi * (1.11 * u + .08 * v)))
    drift = (1 - v) ** 1.3 * (.32 * sin(3.5 * pi * u) + .1 * sin(7 * pi * u))
    pos = rail_point(u) + n * (folds + billow + drift)
    pos.z = lower(u) + (upper(u) - lower(u)) * v
    pos.z += (.037 * sin(theta + .71) + .052 * sin(5 * pi * u)) * (1 - v) ** 2
    return pos

nu, nv = 600, 27
vertices = [point(i / nu, j / nv) for j in range(nv + 1) for i in range(nu + 1)]
faces = [(j * (nu + 1) + i, j * (nu + 1) + i + 1,
          (j + 1) * (nu + 1) + i + 1, (j + 1) * (nu + 1) + i)
         for j in range(nv) for i in range(nu)]
silk_ob = mesh_object("Le voile · quarante-trois plis", vertices, faces, silk, clothwork)
for poly in silk_ob.data.polygons:
    poly.use_smooth = True
hem = silk_ob.modifiers.new("Épaisseur de taffetas", "SOLIDIFY")
hem.thickness = .009
# Double rolled hems and vertical seams remain physical in the macro photographs.
for v in [.006, .015, .989]:
    tube("Ourlet roulotté", [point(i / nu, v) for i in range(nu + 1)], .007, thread, clothwork)
for u in [0, .25, .5, .75, 1]:
    tube("Couture latérale", [point(u, j / 80) for j in range(81)], .009, thread, clothwork)
rail = []
for i in range(221):
    u = i / 220
    p = rail_point(u)
    rail.append((p.x, p.y, upper(u) + .118))
tube("Tringle cintrée · profil roulé", rail, .043, bronze)
for u in [.02, .2, .395, .56, .72, .92]:
    p = rail_point(u) - .19 * normal(u)
    foot = .32
    tube("Montant · âme en laiton", [(p.x, p.y, foot), (p.x, p.y, upper(u) + .105)], .033, bronze)
    cylinder("Platine usinée", (p.x, p.y, foot + .011), .126, .024, bronze, metalwork)
    rail_p = rail_point(u)
    tube("Console", [(p.x, p.y, upper(u) - .105), (rail_p.x, rail_p.y, upper(u) + .117)], .025, bronze)
for i in range(52):
    u = i / 51
    p, h = rail_point(u), point(u, 1)
    tube("Anneau de suspension", [(p.x, p.y, upper(u) + .12), (h.x, h.y, h.z)], .009, bronze)

# A second form in pale abaca opens the back of the installation.
nu2, nv2 = 260, 10
def inner_point(u, v):
    angle = math.radians(72 + 131 * u)
    radius = 2.53 + .042 * sin(2 * pi * 25 * u)
    z = .33 + v * (2.92 + .77 * sin(pi * u))
    return Vector((.45 + radius * cos(angle), .94 + 1.98 / 2.53 * radius * sin(angle), z))
inner = mesh_object("Écran intérieur · fibres d'abaca", [inner_point(i / nu2, j / nv2) for j in range(nv2 + 1) for i in range(nu2 + 1)], [(j * (nu2 + 1) + i, j * (nu2 + 1) + i + 1, (j + 1) * (nu2 + 1) + i + 1, (j + 1) * (nu2 + 1) + i) for j in range(nv2) for i in range(nu2)], linen, clothwork)
for f in inner.data.polygons:
    f.use_smooth = True
inner.modifiers.new("Revers de la fibre", "SOLIDIFY").thickness = .035
# A tall, slender table and a bench convey human scale even in the empty room.
cylinder("Socle de présentation · colonne", (-.34, -.05, .92), .245, 1.18, stone_dark)
cylinder("Guéridon · plateau", (-.34, -.05, 1.54), .67, .094, bronze, bevel=.026)
for x in [-1.95, -.68]:
    box("Assise · pied de pierre", (x, -1.22, .54), (.22, .64, .42), sand, furniture, .025)
box("Assise monolithe", (-1.32, -1.22, .77), (2.27, .82, .18), stone_dark, furniture, .07)
for i in range(3):
    sample = box("Épreuve de papier", (-.33 + .06 * i, -.08 + .01 * i, 1.598 + .008 * i), (.48, .34, .009), linen, furniture, .004)
    sample.rotation_euler.z = -.23 + i * .09
cylinder("Petite coupelle de laiton", (.01, -.14, 1.64), .102, .082, bronze, bevel=.02)

def area(name, pos, target, power, color, sizex, sizey):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = sizex
    data.size_y = sizey
    ob = bpy.data.objects.new(name, data)
    lights.objects.link(ob)
    ob.location = pos
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()

# Off-camera flags reproduce the big slanting shadow and the narrow patches of
# sunlight cast by the open roof. Their fill stays cool against the oxidised silk.
for x, y, width, depth in [(4.1, -10.0, 7.9, 8.8), (4.0, -3.2, .7, 13.5), (5.85, -3.2, .7, 13.5), (7.7, -3.2, .7, 13.5)]:
    flag = box("Claustra haute · ombre portée", (x, y, 8.8), (width, depth, .12), ink, lights)
    flag.rotation_euler.z = -.29
    flag.visible_camera = False
    flag.visible_glossy = False

sun_data = bpy.data.lights.new("Soleil · fin d'après-midi", "SUN")
sun_data.energy = 3.7
sun_data.angle = math.radians(1.65)
sun_data.color = (1, .83, .64)
sun = bpy.data.objects.new("Soleil · fin d'après-midi", sun_data)
lights.objects.link(sun)
sun.rotation_euler = Vector((-1.0, .76, -.84)).to_track_quat("-Z", "Y").to_euler()
area("Réflexion sur enduit", (-5.5, -2.3, 3.6), (-8.55, 4.2, 3.2), 420, (.87, .93, 1), 3, 5)
area("Jour du nord", (-1.8, -5, 7.7), (1, 1, 3.4), 900, (.85, .90, 1), 7.5, 8)
area("Réflexion de la cour", (6, 1.5, 6.5), (1, .1, 2), 620, (1, .86, .68), 4, 7)

def camera(name, loc, look, lens, focus, aperture):
    data = bpy.data.cameras.new(name)
    ob = bpy.data.objects.new(name, data)
    cameras.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(look) - ob.location).to_track_quat("-Z", "Y").to_euler()
    data.lens = lens
    data.dof.use_dof = True
    data.dof.focus_distance = focus
    data.dof.aperture_fstop = aperture
    return ob

# The moving camera ends within the cut in the curtain. Interpolation affects
# physical eye position and gaze independently, so edges exhibit actual parallax.
trajectory = [
    (1, (4.75, -14.35, 2.87), (-1.38, .75, 2.82), 38),
    (23, (3.93, -11.7, 3.08), (-.55, 1.0, 2.80), 37),
    (48, (1.75, -7.35, 2.65), (.05, 1.18, 2.75), 33),
    (72, (-.82, -1.60, 1.72), (2.0, 2.36, 3.36), 24),
]
hero = camera("01 · Entrée / travelling", trajectory[0][1], trajectory[0][2], 38, 13.9, 9)
portrait = camera("02 · Affiche verticale / travelling", (2.70, -15.1, 2.53), (.48, .95, 2.94), 40, 13.8, 8)
vertical_trajectory = [
    (1, (2.70, -15.1, 2.53), (.48, .95, 2.94), 40),
    (23, (2.05, -12.20, 2.60), (.42, .95, 2.80), 38),
    (48, (1.0, -7.25, 2.42), (.51, 1.05, 2.70), 34),
    (72, (-.82, -1.60, 1.72), (2.0, 2.36, 3.36), 24),
]
for cam, path_keys in [(hero, trajectory), (portrait, vertical_trajectory)]:
    for frame, loc, look, lens in path_keys:
        cam.location = loc
        cam.rotation_euler = (Vector(look) - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.data.lens = lens
        cam.data.dof.focus_distance = (13.8 if cam == portrait and frame == 1 else
                                       (Vector(look) - cam.location).length * .91)
        cam.keyframe_insert("location", frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
        cam.data.keyframe_insert("lens", frame=frame)
        cam.data.dof.keyframe_insert("focus_distance", frame=frame)
    for animation in (cam.animation_data, cam.data.animation_data):
        for fcurve in animation.action.fcurves:
            for key in fcurve.keyframe_points:
                key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"
interior = camera("03 · Sous le drapé", (-.82, -1.60, 1.72), (2.0, 2.36, 3.36), 24, 4.4, 6.7)
macro = camera("04 · Le taffetas", (3.92, -3.76, 2.9), tuple(point(.78, .11)), 65, 2.9, 8)
shots = {"salle": (hero, 1920, 1152), "salle-mobile": (portrait, 900, 1200),
         "interieur": (interior, 1400, 1060), "detail": (macro, 1400, 1060)}
scene.render.fps = 24
scene.frame_start, scene.frame_end = 1, 72
scene.frame_set(1)
scene.camera = hero
scene.render.resolution_x, scene.render.resolution_y = 1920, 1152
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.quality = 92
scene.render.image_settings.color_mode = "RGB"
if args.mode in ["scene", "stills"] and not args.shot:
    for frame, name in [(1, "Le seuil"), (23, "La courbe"), (48, "Franchir le voile"), (72, "À l'intérieur")]:
        scene.timeline_markers.new(name, frame=frame)
    bpy.ops.object.select_all(action="DESELECT")
    silk_ob.select_set(True)
    bpy.context.view_layer.objects.active = silk_ob
    for screen in bpy.data.screens:
        for editor in screen.areas:
            if editor.type == "VIEW_3D":
                space = editor.spaces.active
                space.region_3d.view_perspective = "CAMERA"
                space.region_3d.view_camera_zoom = 8
                space.shading.color_type = "MATERIAL"
                space.overlay.show_overlays = False
    bpy.ops.wm.save_as_mainfile(filepath=str(art / "le-pavillon.blend"), compress=True)

if args.mode in ["stills", "preview"]:
    for name, (cam, w, h) in shots.items():
        if args.shot and args.shot != name:
            continue
        scene.camera = cam
        width = args.width or (560 if args.mode == "preview" else w)
        scene.render.resolution_x, scene.render.resolution_y = width, round(h * width / w)
        scene.cycles.samples = args.samples or (6 if args.mode == "preview" else 70)
        if args.mode == "preview":
            scene.render.filepath = str(work / (name + ".webp"))
            bpy.ops.render.render(write_still=True)
        else:
            # This Blender build lacks OIDN. Denoise in luminance/chroma space
            # before the only lossy encode, keeping the fine edges of the pleats.
            raw = work / (name + "-master.png")
            scene.render.image_settings.file_format = "PNG"
            scene.render.image_settings.compression = 8
            scene.render.filepath = str(raw)
            bpy.ops.render.render(write_still=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-filter_threads", "4",
                            "-vf", "bm3d=sigma=7:block=8:bstep=3:group=8:range=7:mstep=3",
                            "-frames:v", "1", "-c:v", "libwebp", "-quality", "87", "-compression_level", "6",
                            str(assets / (name + ".webp"))], check=True)

if args.mode in ["film", "encode"]:
    import struct
    frames = work / ("natif-portrait" if args.portrait else "natif-paysage")
    frames.mkdir(exist_ok=True)
    scene.camera = portrait if args.portrait else hero
    w = args.width or (540 if args.portrait else 960)
    aspect = 4 / 3 if args.portrait else .6
    h = round(w * aspect / 2) * 2
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.cycles.samples = args.samples or 12
    scene.cycles.adaptive_threshold = .11
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.compression = 12
    scene.render.use_persistent_data = True

    def complete_frame(path):
        if not path.is_file() or path.stat().st_size < 32:
            return False
        with path.open("rb") as stream:
            header = stream.read(24)
            stream.seek(-12, 2)
            trailer = stream.read(12)
        return (header[:8] == bytes.fromhex("89504e470d0a1a0a") and
                struct.unpack(">II", header[16:24]) == (w, h) and trailer[4:8] == b"IEND")

    if args.mode == "film":
        for index in range(args.from_image, 73):
            frame_path = frames / f"{index:03}.png"
            if args.reuse_frames and complete_frame(frame_path):
                continue
            scene.frame_set(index)
            partial = frames / f"{index:03}.render.png"
            scene.render.filepath = str(partial)
            bpy.ops.render.render(write_still=True)
            partial.replace(frame_path)
    if not all(complete_frame(frames / f"{i:03}.png") for i in range(1, 73)):
        raise RuntimeError("The 72 native frames must be rendered before encoding")
    # Each frame comes directly from Blender. Short GOPs keep backwards seeking inexpensive.
    output = assets / ("traversee-mobile.mp4" if args.portrait else "traversee.mp4")
    encoded = frames / "livraison.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-start_number", "1",
                    "-i", str(frames / "%03d.png"), "-filter_threads", "4", "-vf",
                    "hqdn3d=7:7:2:2,nlmeans=s=7:p=5:r=11,format=yuv420p",
                    "-frames:v", "72", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-g", "8", "-bf", "0",
                    "-movflags", "+faststart", "-an", str(encoded)], check=True)
    # Work and source can live on separate filesystems. Keep the published name intact until ready.
    import shutil
    pending = output.with_suffix(".pending")
    shutil.copyfile(encoded, pending)
    pending.replace(output)


if args.mode == "model":
    # Collapse the rigging into material batches. Folds stay as geometry; the
    # web material uses a two-sided shell. Room lights and cameras stay in Blender.
    nu_web, nv_web = 355, 14
    web_verts = [point(i / nu_web, j / nv_web) for j in range(nv_web + 1) for i in range(nu_web + 1)]
    web_faces = [(j * (nu_web + 1) + i, j * (nu_web + 1) + i + 1,
                  (j + 1) * (nu_web + 1) + i + 1, (j + 1) * (nu_web + 1) + i)
                 for j in range(nv_web) for i in range(nu_web)]
    web_cloth = mesh_object("Voile suspendu", web_verts, web_faces, silk, clothwork)
    for polygon in web_cloth.data.polygons:
        polygon.use_smooth = True
    specs = {
        silk: ("Taffetas · oxyde", "bc502c", .56, .02),
        linen: ("Abaca · ivoire", "ded1b1", .78, 0),
        sand: ("Calcaire", "c7bba1", .71, 0),
        bronze: ("Laiton patiné", "a6824e", .32, .71),
        stone_dark: ("Travertin noyer", "514238", .57, 0),
    }
    depsgraph = bpy.context.evaluated_depsgraph_get()
    scene_objects = [*clothwork.objects, *metalwork.objects, *furniture.objects]
    batch = {}
    for ob in scene_objects:
        original = ob.data.materials[0]
        if ob == silk_ob or original not in specs:
            continue
        evaluated = ob.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
        mesh.transform(ob.matrix_world)
        mesh.materials.clear()
        clone = bpy.data.objects.new(ob.name + " · web", mesh)
        scene.collection.objects.link(clone)
        batch.setdefault(original, []).append(clone)
    exported = []
    for mat, pieces in batch.items():
        bpy.ops.object.select_all(action="DESELECT")
        for ob in pieces:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = pieces[0]
        if len(pieces) > 1:
            bpy.ops.object.join()
        combined = bpy.context.view_layer.objects.active
        name, color, rough, metallic = specs[mat]
        simple, bsdf = surface(name, color, rough, metallic)
        simple.use_backface_culling = False
        combined.data.materials.append(simple)
        combined.name = name
        exported.append(combined)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in exported:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(assets / "maquette.glb"), export_format="GLB",
                              use_selection=True, export_animations=False, export_cameras=False,
                              export_lights=False, export_texcoords=False, export_yup=True)
