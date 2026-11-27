"""Editable letterpress die, built from Maison Mestier's original cubic SVG.

From the repository root, with Blender 4.3:
  blender -b -P art/empreinte/poincon.py -- --build
  blender -b -P art/empreinte/poincon.py -- --poster
  blender -b -P art/empreinte/poincon.py -- --film
  python art/empreinte/edition.py

Use --work to change the directory containing intermediate PNGs.
"""

import argparse
import math
import re
import sys
from pathlib import Path
from xml.etree import ElementTree

import bpy
from mathutils import Vector

p = argparse.ArgumentParser()
p.add_argument("--build", action="store_true")
p.add_argument("--poster", action="store_true")
p.add_argument("--film", action="store_true")
p.add_argument("--test", type=int)
p.add_argument("--size", type=int)
p.add_argument("--samples", type=int)
p.add_argument("--work", type=Path, default=Path("/tmp/mestier-poincon"))
args = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
folder = Path(__file__).resolve().parent
repo = folder.parents[1]
work = args.work.resolve()
work.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Empreinte · Maison Mestier"
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples or (64 if args.poster else 26)
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 5
scene.cycles.glossy_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.use_animated_seed = False
scene.cycles.sample_clamp_indirect = 4
scene.frame_start, scene.frame_end = 1, 40
scene.render.fps = 25
scene.render.film_transparent = True
scene.render.resolution_percentage = 100
scene.render.resolution_x = scene.render.resolution_y = args.size or (888 if args.poster else 672)
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.compression = 12
scene.render.use_persistent_data = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.08


def coll(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


die = coll("01 · Cliché et hauteur de relief")
light_set = coll("02 · Réflecteurs du studio")
camera_set = coll("03 · Caméra et repères")
rig = bpy.data.objects.new("Prise en main · rotation du poinçon", None)
die.objects.link(rig)
rig.empty_display_type = "PLAIN_AXES"
rig.empty_display_size = 0.45


def linear(s):
    k = int(s, 16) / 255
    return k / 12.92 if k <= 0.04045 else ((k + 0.055) / 1.055) ** 2.4


def hue(h):
    return tuple(linear(h[k : k + 2]) for k in (0, 2, 4)) + (1,)


def metal(name, base, light, roughness, metallic=0.94, grain=0.08, flank=None):
    """Rolling grain and broad patina are defined in the space of the die."""
    m = bpy.data.materials.new(name)
    m.diffuse_color = hue(base)
    m.use_nodes = True
    tree = m.node_tree
    n = tree.nodes
    wire = tree.links.new
    bs = n.get("Principled BSDF")
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Anisotropic"].default_value = 0.47
    bs.inputs["Coat Weight"].default_value = 0.065
    bs.inputs["Coat Roughness"].default_value = 0.29
    tc = n.new("ShaderNodeTexCoord")
    tc.object = rig
    rotate = n.new("ShaderNodeVectorRotate")
    rotate.rotation_type = "Z_AXIS"
    rotate.inputs["Angle"].default_value = math.radians(13)
    wire(tc.outputs["Object"], rotate.inputs["Vector"])
    direction = n.new("ShaderNodeVectorMath")
    direction.operation = "MULTIPLY"
    direction.inputs[1].default_value = (2.1, 103, 27)
    wire(rotate.outputs["Vector"], direction.inputs[0])
    strokes = n.new("ShaderNodeTexNoise")
    strokes.inputs["Scale"].default_value = 1
    strokes.inputs["Detail"].default_value = 1.5
    strokes.inputs["Roughness"].default_value = 0.51
    wire(direction.outputs[0], strokes.inputs["Vector"])
    broad = n.new("ShaderNodeTexNoise")
    broad.inputs["Scale"].default_value = 2.4
    broad.inputs["Detail"].default_value = 2.8
    broad.inputs["Roughness"].default_value = 0.60
    wire(tc.outputs["Object"], broad.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.16
    ramp.color_ramp.elements[0].color = hue(base)
    ramp.color_ramp.elements[1].position = 0.89
    ramp.color_ramp.elements[1].color = hue(light)
    wire(broad.outputs["Fac"], ramp.inputs["Fac"])
    if flank:
        geom = n.new("ShaderNodeNewGeometry")
        local = n.new("ShaderNodeVectorTransform")
        local.vector_type = "NORMAL"
        local.convert_from = "WORLD"
        local.convert_to = "OBJECT"
        wire(geom.outputs["True Normal"], local.inputs["Vector"])
        normal_z = n.new("ShaderNodeSeparateXYZ")
        wire(local.outputs["Vector"], normal_z.inputs[0])
        face = n.new("ShaderNodeValToRGB")
        face.color_ramp.elements[0].position = 0.18
        face.color_ramp.elements[0].color = (0, 0, 0, 1)
        face.color_ramp.elements[1].position = 0.98
        face.color_ramp.elements[1].color = (1, 1, 1, 1)
        wire(normal_z.outputs["Z"], face.inputs["Fac"])
        mix = n.new("ShaderNodeMixRGB")
        mix.blend_type = "MIX"
        mix.inputs[1].default_value = hue(flank)
        wire(face.outputs["Color"], mix.inputs[0])
        wire(ramp.outputs["Color"], mix.inputs[2])
        wire(mix.outputs[0], bs.inputs["Base Color"])
    else:
        wire(ramp.outputs["Color"], bs.inputs["Base Color"])
    ref = n.new("ShaderNodeMapRange")
    ref.inputs["To Min"].default_value = roughness - 0.065
    ref.inputs["To Max"].default_value = roughness + 0.075
    wire(strokes.outputs["Fac"], ref.inputs["Value"])
    wire(ref.outputs[0], bs.inputs["Roughness"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = grain
    bump.inputs["Distance"].default_value = 0.0025
    wire(strokes.outputs["Fac"], bump.inputs["Height"])
    wire(bump.outputs["Normal"], bs.inputs["Normal"])
    return m


satin = metal("01 · Champ à la pierre fine", "443423", "645039", 0.46, 0.91, 0.19)
wall = metal("02 · Laiton patiné sur chant", "83623D", "B38856", 0.31, 0.94, 0.16)
edge = metal("03 · Arêtes champagne polies", "CDA875", "E6C69A", 0.22, 0.97, 0.07)
cut = metal("04 · Gorge brune", "503B2B", "71533B", 0.40, 0.88, 0.10)
face = metal("05 · Surface dressée du caractère", "E1BF8D", "F4D7AD", 0.235, 0.96, 0.075, "9A6E43")
shoulder = metal("06 · Dépouille du caractère", "826647", "AE855A", 0.34, 0.93, 0.10)


def smoothed_polygon(corners, radius):
    out = []
    for j, point in enumerate(corners):
        here = Vector(point)
        a = here + (Vector(corners[j - 1]) - here).normalized() * radius
        b = here + (Vector(corners[(j + 1) % len(corners)]) - here).normalized() * radius
        for i in range(8):
            t = i / 7
            co = a * (1 - t) ** 2 + here * (2 * t * (1 - t)) + b * t * t
            out.append((co.x, co.y))
    return out


def billet(name, contours, profiles, top, reverse):
    n = len(contours)
    verts = []
    faces = []
    indices = []
    for z, scale, _ in profiles:
        verts.extend([(x * scale, y * scale, z) for x, y in contours])
    faces.append(tuple(reversed(range(n))))
    indices.append(reverse)
    for level in range(len(profiles) - 1):
        for i in range(n):
            j = (i + 1) % n
            faces.append((level * n + i, level * n + j, (level + 1) * n + j, (level + 1) * n + i))
            indices.append(profiles[level][2])
    faces.append(tuple((len(profiles) - 1) * n + i for i in range(n)))
    indices.append(top)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for m in (satin, wall, edge, cut):
        mesh.materials.append(m)
    for f, idx in zip(mesh.polygons, indices):
        f.material_index = idx
    obj = bpy.data.objects.new(name, mesh)
    die.objects.link(obj)
    obj.parent = rig
    return obj


# A clipped shoulder is the orientation register, as on an engraved type block.
perimeter = smoothed_polygon(
    [
        (-2.35, -1.47),
        (-2.12, -1.73),
        (2.15, -1.73),
        (2.35, -1.54),
        (2.35, 1.50),
        (2.13, 1.73),
        (-1.86, 1.73),
        (-2.35, 1.25),
    ],
    0.112,
)
body = billet(
    "Bloc de laiton · pans d’orientation et gorges usinées",
    perimeter,
    [
        (-0.49, 0.944, 3),
        (-0.465, 0.963, 1),
        (-0.41, 0.983, 2),
        (-0.384, 0.989, 1),
        (-0.328, 0.989, 3),
        (-0.315, 0.980, 3),
        (-0.294, 0.980, 2),
        (-0.278, 0.993, 1),
        (-0.183, 0.993, 3),
        (-0.172, 0.986, 3),
        (-0.153, 0.986, 2),
        (-0.138, 1.0, 1),
        (0.103, 1, 2),
        (0.145, 0.990, 2),
        (0.159, 0.984, 0),
    ],
    0,
    3,
)

# The source uses an initial absolute M and chained relative Bézier cubics.
# Preserve every author-supplied control point, including the closing contour.
svg = ElementTree.parse(repo / "public/charte/monogramme-encre.svg").getroot()
vb = list(map(float, svg.attrib["viewBox"].split()))
path = svg.find("{http://www.w3.org/2000/svg}path").attrib["d"]
tokens = re.findall(r"[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", path)
assert tokens[0] == "M" and tokens[-1].lower() == "z"
start = Vector((float(tokens[1]), float(tokens[2])))
current = start.copy()
j = 3
segments = []
while j < len(tokens) - 1:
    if tokens[j] == "c":
        j += 1
    values = list(map(float, tokens[j : j + 6]))
    j += 6
    c1 = current + Vector(values[:2])
    c2 = current + Vector(values[2:4])
    end = current + Vector(values[4:])
    segments.append((current.copy(), c1, c2, end.copy()))
    current = end
if (current - start).length > 0.00001:
    segments.append(
        (current.copy(), current.lerp(start, 1 / 3), current.lerp(start, 2 / 3), start.copy())
    )
physical_width = 3.456


def map_svg(point):
    x = (point.x - vb[0] - vb[2] / 2) * physical_width / vb[2]
    y = (vb[1] + vb[3] / 2 - point.y) * physical_width / vb[2]
    return (x, y, 0)


def trace(name, mat, z, extrusion, bevel, offset=0):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "2D"
    data.fill_mode = "BOTH"
    data.resolution_u = 8
    data.render_resolution_u = 8
    data.resolution_v = 2
    data.extrude = extrusion
    data.bevel_depth = bevel
    data.bevel_resolution = 3
    data.offset = offset
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(segments) - 1)
    spline.use_cyclic_u = True
    for i, (p0, c1, c2, p3) in enumerate(segments):
        b = spline.bezier_points[i]
        b.co = map_svg(p0)
        b.handle_left_type = b.handle_right_type = "FREE"
        b.handle_left = map_svg(segments[i - 1][2])
        b.handle_right = map_svg(c1)
    data.materials.append(mat)
    obj = bpy.data.objects.new(name, data)
    die.objects.link(obj)
    obj.parent = rig
    obj.location.z = z
    return obj


trace("Épaulement du M · dégagement de gravure", shoulder, 0.177, 0.035, 0.018, 0.013)
# The rolled edge adds a little width in projection. Offset it inwards so
# the actual printing footprint registers to the source SVG in the last frame.
raised = trace("M officiel · tracé original en relief", face, 0.274, 0.094, 0.011, -0.0137)
raised["svg_source"] = "public/charte/monogramme-encre.svg"
raised["svg_viewbox"] = "141 69 1938 1512"
# Top-left origin; coordinates are fractions of the square photograph.
raised["registered_svg_xywh"] = (0.212, 0.27530650154798764, 0.576, 0.4493869969040247)

world = bpy.data.worlds.new("Tente de photographie · ambiance")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.80, 0.84, 0.91, 1)
bg.inputs["Strength"].default_value = 0.27


def light(name, loc, target, energy, tint, size, height):
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "RECTANGLE"
    d.size = size
    d.size_y = height
    d.energy = energy
    d.color = tint
    ob = bpy.data.objects.new(name, d)
    light_set.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()
    return ob


light("Grande fenêtre · reflet champagne", (-3.8, 3.5, 6.6), (0, 0, 0), 1020, (1, 0.96, 0.88), 4.8, 3.8)
light("Bande blanche verticale", (3.5, 0.9, 4.6), (0, 0, 0), 790, (0.95, 0.98, 1), 1.3, 6.0)
window = light(
    "Fente de la tente · bande de soie", (-1.9, 0.80, 5.8), (0, 0, 0), 410, (1, 0.99, 0.94), 1.9, 6.3
)
window.rotation_euler.rotate_axis("Z", math.radians(-26))
light("Soulignement du talon", (0, -5.4, 2.1), (0, 0, -0.16), 620, (1, 0.79, 0.55), 5.3, 1.25)
light("Lame froide arrière", (-3.7, 1.7, -1.45), (0, 0, -0.15), 540, (0.78, 0.86, 1), 2.0, 4.8)

# A narrow black flag is invisible to the camera but carves a soft diagonal
# into the burnished face, just as a strip of card would in a product studio.
flag_mat = bpy.data.materials.new("Drapeau noir du studio")
flag_mat.use_nodes = True
fb = flag_mat.node_tree.nodes.get("Principled BSDF")
fb.inputs["Base Color"].default_value = (0.009, 0.008, 0.007, 1)
fb.inputs["Roughness"].default_value = 0.96
flag_mesh = bpy.data.meshes.new("Carte de modelé")
flag_mesh.from_pydata(
    [(-0.58, -4.0, 0), (0.58, -4.0, 0), (0.58, 4.0, 0), (-0.58, 4.0, 0)], [], [(0, 1, 2, 3)]
)
flag_mesh.materials.append(flag_mat)
flag = bpy.data.objects.new("Drapeau de modelé · reflet seul", flag_mesh)
light_set.objects.link(flag)
flag.location = (1.18, -0.12, 2.15)
flag.rotation_euler.z = math.radians(-28)
flag.visible_camera = False
flag.visible_shadow = False
flag.visible_diffuse = False
flag.display_type = "WIRE"

camera_data = bpy.data.cameras.new("Carré frontal · 672")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 6.0
camera = bpy.data.objects.new("Caméra de raccord", camera_data)
camera_set.objects.link(camera)
camera.location = (0, 0, 9)
camera.rotation_euler = (0, 0, 0)
scene.camera = camera

# Orthographic framing leaves the last frame precisely registered to the SVG.
poses = [
    (1, (78, -12, -27), (-0.10, -0.10, 0), 6.54),
    (5, (75, -15, -24), (-0.09, -0.09, 0), 6.50),
    (12, (57, -17, -15), (-0.06, -0.065, 0.05), 6.42),
    (20, (32, -13, -8), (-0.035, -0.035, 0.09), 6.34),
    (27, (13, -6, -2.4), (-0.012, -0.010, 0.14), 6.19),
    (33, (-2.6, 1.0, 0.45), (0.006, 0.004, 0.22), 5.87),
    (37, (0, 0, 0), (0, 0, 0.19), 6.00),
    (40, (0, 0, 0), (0, 0, 0.19), 6.00),
]
for frame, rot, loc, scale in poses:
    rig.location = loc
    rig.rotation_euler = tuple(math.radians(a) for a in rot)
    rig.keyframe_insert(data_path="location", frame=frame)
    rig.keyframe_insert(data_path="rotation_euler", frame=frame)
    camera_data.ortho_scale = scale
    camera_data.keyframe_insert(data_path="ortho_scale", frame=frame)
for frame, name in [
    (1, "Le chant"),
    (12, "Rotation"),
    (23, "Le relief"),
    (33, "La frappe"),
    (37, "Le raccord"),
]:
    scene.timeline_markers.new(name, frame=frame)
scene.frame_set(1)


def render(frame, output):
    scene.frame_set(frame)
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


if args.build:
    scene.frame_set(20)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.context.view_layer.objects.active = raised
    raised.select_set(True)
    for screen in bpy.data.screens:
        for a in screen.areas:
            if a.type == "VIEW_3D":
                a.spaces.active.region_3d.view_perspective = "CAMERA"
                a.spaces.active.shading.color_type = "MATERIAL"
                a.spaces.active.overlay.show_overlays = False
    bpy.ops.wm.save_as_mainfile(
        filepath=str(folder / "poincon.blend"), compress=True, relative_remap=False
    )
if args.test:
    render(args.test, work / f"test-{args.test:02}.png")
if args.poster:
    render(40, work / "affiche.png")
if args.film:
    sequence = work / "frames"
    sequence.mkdir(exist_ok=True)
    for index in range(1, 41):
        render(index, sequence / f"{index:03}.png")
