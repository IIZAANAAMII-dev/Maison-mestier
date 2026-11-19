"""Plan original « L’empreinte », 64 images à 24 i/s pour Maison Mestier.

Rendu de production sous Blender 4.3.2 avec NumPy, Pillow, fontTools et Brotli.
    blender -b -t 3 -P art/ouverture.py -- --output /tmp/empreinte --stride 2 --width 1024 --samples 8
Les images sont numérotées par image source. --frames 1,27,64 produit les poses
de contrôle. --stride 2 permet une sortie à 12 i/s pour une interpolation 24p.
Le seul dessin typographique est construit à partir du Bodoni Moda de la Maison.
"""

import argparse
from io import BytesIO
import math
from pathlib import Path
import random
import sys

import bpy
import numpy as np
from fontTools.ttLib import TTFont
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFilter, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--frames")
parser.add_argument("--stride", type=int, default=1)
parser.add_argument("--width", type=int, default=1152)
parser.add_argument("--samples", type=int, default=12)
opts = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
opts.output.mkdir(parents=True, exist_ok=True)
ROOT = Path(__file__).resolve().parents[1]
TAU = math.tau
rng = random.Random(743)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = opts.samples
scene.cycles.use_denoising = False
scene.cycles.use_preview_denoising = False
scene.cycles.max_bounces = 5
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 3
scene.cycles.transparent_max_bounces = 3
scene.cycles.sample_clamp_indirect = 4.5
scene.render.resolution_x = opts.width
scene.render.resolution_y = round(opts.width * 9 / 16)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.fps = 24
scene.frame_end = 64
scene.render.use_persistent_data = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.28
world = bpy.data.worlds.new("Atelier · lumière froide de la pièce")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.44, 0.48, 0.55, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.13


def linear(rgb):
    values = [int(rgb[n : n + 2], 16) / 255 for n in (0, 2, 4)]
    return tuple(v / 12.92 if v < 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values) + (1,)


def surface(name, color, roughness, metal=0, coat=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = linear(color)
    mat.use_nodes = True
    shader = mat.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = linear(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Coat Weight"].default_value = coat
    shader.inputs["Coat Roughness"].default_value = 0.22
    return mat, shader


def noise(mat, scale, detail=2):
    n = mat.node_tree.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = 0.66
    return n


def noise_colors(mat, shader, scale, colors):
    n = noise(mat, scale, 3)
    ramp = mat.node_tree.nodes.new("ShaderNodeValToRGB")
    for element, (pos, color) in zip(ramp.color_ramp.elements, colors):
        element.position = pos
        element.color = linear(color)
    mat.node_tree.links.new(n.outputs["Fac"], ramp.inputs[0])
    mat.node_tree.links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    return n


def bump(mat, shader, socket, distance, strength, previous=None):
    n = mat.node_tree.nodes.new("ShaderNodeBump")
    n.inputs["Distance"].default_value = distance
    n.inputs["Strength"].default_value = strength
    mat.node_tree.links.new(socket, n.inputs["Height"])
    if previous:
        mat.node_tree.links.new(previous, n.inputs["Normal"])
    mat.node_tree.links.new(n.outputs["Normal"], shader.inputs["Normal"])
    return n.outputs["Normal"]


def geo(name, vertices, faces, mat, smooth=False):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat:
        mesh.materials.append(mat)
    if smooth:
        mesh.polygons.foreach_set("use_smooth", [True] * len(faces))
    return obj


def lathe(name, profile, mat, parent, segments=160):
    vertices = [
        (r * math.cos(i * TAU / segments), r * math.sin(i * TAU / segments), z)
        for r, z in profile
        for i in range(segments)
    ]
    faces = [
        (
            j * segments + i,
            j * segments + (i + 1) % segments,
            (j + 1) * segments + (i + 1) % segments,
            (j + 1) * segments + i,
        )
        for j in range(len(profile) - 1)
        for i in range(segments)
    ]
    obj = geo(name, vertices, faces, mat, True)
    obj.parent = parent
    return obj


def plane(name, size, z, mat):
    h = size / 2
    return geo(name, [(-h, -h, z), (h, -h, z), (h, h, z), (-h, h, z)], [(0, 1, 2, 3)], mat)


def target(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def softbox(name, where, focus, power, color, size, height=None):
    lamp = bpy.data.lights.new(name, "AREA")
    lamp.energy = power
    lamp.color = color
    lamp.shape = "RECTANGLE" if height else "DISK"
    lamp.size = size
    if height:
        lamp.size_y = height
    obj = bpy.data.objects.new(name, lamp)
    bpy.context.collection.objects.link(obj)
    obj.location = where
    target(obj, focus)
    return obj


def mask_of_monogram():
    fontfile = TTFont(str(ROOT / "app/fonts/bodoni-moda-italic.woff2"))
    fontfile.flavor = None
    buffer = BytesIO()
    fontfile.save(buffer)
    font = ImageFont.truetype(BytesIO(buffer.getvalue()), 416)
    glyph = Image.new("L", (1350, 650))
    pen = ImageDraw.Draw(glyph)
    pen.text((210, 2), "M", font=font, fill=255)
    pen.text((420, 2), "M", font=font, fill=255)
    letters = glyph.crop(glyph.getbbox())
    letters.thumbnail((660, 354), Image.Resampling.LANCZOS)
    full = Image.new("L", (1024, 1024))
    full.paste(letters, ((1024 - letters.width) // 2, (1024 - letters.height) // 2))
    return full.filter(ImageFilter.GaussianBlur(0.65))


imprint = mask_of_monogram()
mask = np.asarray(imprint).astype(float) / 255
mono_map = bpy.data.images.new("MM · dessin d’étude", width=1024, height=1024, alpha=True)
rgba = np.ones((1024, 1024, 4), dtype=np.float32)
rgba[:, :, :3] = np.flipud(mask)[:, :, None]
mono_map.pixels.foreach_set(rgba.reshape(-1))
mono_map.pack()

paper, paper_shader = surface("Vergé ivoire", "e4d8c0", 0.87)
cotton = noise_colors(paper, paper_shader, 92, [(0.18, "c9bba5"), (0.83, "f3e6d1")])
texcoord = paper.node_tree.nodes.new("ShaderNodeTexCoord")
laid = paper.node_tree.nodes.new("ShaderNodeTexWave")
laid.wave_type = "BANDS"
laid.bands_direction = "Y"
laid.inputs["Scale"].default_value = 53
laid.inputs["Distortion"].default_value = 1.2
laid.inputs["Detail Scale"].default_value = 0.5
paper.node_tree.links.new(texcoord.outputs["Object"], laid.inputs["Vector"])
laid_normal = bump(paper, paper_shader, laid.outputs["Fac"], 0.00095, 0.30)
fibers = noise(paper, 995, 1.6)
fiber_normal = bump(paper, paper_shader, fibers.outputs["Fac"], 0.004, 0.32, laid_normal)
# The material study is a small photograph. Removing its lighting gradient and
# reflecting its edges keeps the real fibres without projecting a grid onto the sheet.
source_paper = Image.open(ROOT / "public/images/pli-verge.webp").convert("L")
flat_paper = np.asarray(source_paper, dtype=np.float32) / 255
paper_light = np.asarray(source_paper.filter(ImageFilter.GaussianBlur(14)), dtype=np.float32) / 255
paper_grain = np.clip(0.68 + (flat_paper - paper_light) * 1.4, 0, 1)
paper_strip = np.concatenate([paper_grain, paper_grain[:, ::-1]], axis=1)
paper_tile = np.concatenate([paper_strip, paper_strip[::-1]], axis=0)
tile_height, tile_width = paper_tile.shape
paper_rgba = np.ones((tile_height, tile_width, 4), dtype=np.float32)
paper_rgba[:, :, :3] = paper_tile[:, :, None]
paper_image = bpy.data.images.new(
    "Vergé · étude de fibres", width=tile_width, height=tile_height, alpha=False
)
paper_image.colorspace_settings.name = "Non-Color"
paper_image.pixels.foreach_set(paper_rgba.ravel())
paper_image.pack()
paper_scan = paper.node_tree.nodes.new("ShaderNodeTexImage")
paper_scan.image = paper_image
scale_paper = paper.node_tree.nodes.new("ShaderNodeVectorMath")
scale_paper.operation = "MULTIPLY"
scale_paper.inputs[1].default_value = (0.345, 0.345, 1)
paper.node_tree.links.new(texcoord.outputs["Object"], scale_paper.inputs[0])
paper.node_tree.links.new(scale_paper.outputs[0], paper_scan.inputs["Vector"])
paper_tint = paper.node_tree.nodes.new("ShaderNodeMixRGB")
paper_tint.blend_type = "MULTIPLY"
paper_tint.inputs[0].default_value = 0.74
paper.node_tree.links.new(paper_shader.inputs["Base Color"].links[0].from_socket, paper_tint.inputs[1])
paper.node_tree.links.new(paper_scan.outputs["Color"], paper_tint.inputs[2])
paper.node_tree.links.new(paper_tint.outputs["Color"], paper_shader.inputs["Base Color"])
bump(paper, paper_shader, paper_scan.outputs["Color"], 0.019, 0.61, fiber_normal)
paper_shader.inputs["Sheen Weight"].default_value = 0.13

stone, stone_shader = surface("Table de pierre · ombre", "5e625d", 0.76)
stone_noise = noise_colors(stone, stone_shader, 17, [(0.14, "444741"), (0.87, "a99c85")])
bump(stone, stone_shader, noise(stone, 210, 3).outputs["Fac"], 0.016, 0.32)
plane("Plateau de l’atelier", 130, -0.185, stone)


# Deux feuilles de vergé à bords francs, l'une légèrement décalée sous la carte.
def card(name, w, h, z, xy, rotation):
    outline = []
    for a, b, n in [
        ((-w / 2, -h / 2), (w / 2, -h / 2), 80),
        ((w / 2, -h / 2), (w / 2, h / 2), 36),
        ((w / 2, h / 2), (-w / 2, h / 2), 80),
        ((-w / 2, h / 2), (-w / 2, -h / 2), 36),
    ]:
        for i in range(n):
            t = i / n
            outline.append(
                (
                    a[0] * (1 - t) + b[0] * t + rng.uniform(-0.014, 0.014),
                    a[1] * (1 - t) + b[1] * t + rng.uniform(-0.014, 0.014),
                )
            )
    verts = [(x, y, z - 0.045) for x, y in outline] + [(x, y, z) for x, y in outline]
    m = len(outline)
    faces = [tuple(reversed(range(m))), tuple(range(m, 2 * m))] + [
        (i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)
    ]
    p = geo(name, verts, faces, paper)
    p.location = (xy[0], xy[1], 0)
    p.rotation_euler.z = rotation
    return p


card("Papier sous la carte", 7.8, 4.4, -0.105, (-0.44, 0.2), 0.08)
card("Carton de correspondance", 7.15, 4.2, -0.016, (-0.1, 0.04), -0.165)

wax, wax_shader = surface("Cire rouge cachet", "762723", 0.36, 0.015, 0.13)
wax_field = noise_colors(wax, wax_shader, 3.6, [(0.15, "4b171b"), (0.81, "8f3028")])
wax_shader.inputs["Subsurface Weight"].default_value = 0.035
wax_shader.inputs["Subsurface Radius"].default_value = (0.18, 0.043, 0.022)
wax_shader.inputs["Subsurface Scale"].default_value = 0.12
wax_ridges = noise(wax, 96, 2.2)
bump(wax, wax_shader, wax_ridges.outputs["Fac"], 0.007, 0.13)
rough = wax.node_tree.nodes.new("ShaderNodeMapRange")
wax_shader.inputs["Specular IOR Level"].default_value = 0.31
rough.inputs["To Min"].default_value = 0.29
rough.inputs["To Max"].default_value = 0.41
wax.node_tree.links.new(wax_field.outputs["Fac"], rough.inputs[0])
wax.node_tree.links.new(rough.outputs["Result"], wax_shader.inputs["Roughness"])


# Pool and finished impression share the same polar topology. The displaced
# letterforms and the pushed-up rim are geometry and therefore cast shadows.
def wax_z(r, a, pressed, x, y):
    edge_noise = (
        0.035 * math.sin(5 * a + 1.2) + 0.021 * math.cos(8 * a) + 0.014 * math.sin(13 * a - 0.7)
    )
    lip = 0.132 * math.exp(-(((r - (0.858 + edge_noise * 0.74)) / 0.102) ** 2))
    shore = max(0.0, 1 - r**10) ** 0.42
    if pressed:
        px = int(np.clip((x / 2.16 + 0.5) * 1023, 0, 1023))
        py = int(np.clip((0.5 - y / 2.16) * 1023, 0, 1023))
        ring = 0.026 * math.exp(-(((math.hypot(x, y) - 0.767) / 0.022) ** 2))
        h = 0.123 + lip + ring + 0.035 * mask[py, px]
    else:
        h = 0.122 + 0.09 * (1 - r * r) + lip * 0.57 + 0.022 * math.sin(9 * r + 2 * a) * r
    flow = 0.0068 * math.sin(r * 110 + 3.5 * math.sin(a * 4) + 1.3 * math.sin(a * 12))
    edge = max(0.0, min(1.0, (r - 0.70) / 0.22))
    return -0.009 + (h + edge * flow) * shore


angular, radial = 264, 106
points = []
finished = []
for j in range(radial + 1):
    r = max(0.0001, j / radial)
    for i in range(angular):
        a = TAU * i / angular
        radius = r * (
            1.08
            + 0.052 * math.sin(3 * a)
            + 0.040 * math.sin(7 * a + 0.5)
            + 0.025 * math.cos(10 * a - 0.4)
            + 0.013 * math.sin(19 * a)
        )
        x = radius * math.cos(a)
        y = radius * math.sin(a) * 0.95
        points.append((x, y, wax_z(r, a, False, x, y)))
        finished.append((x, y, wax_z(r, a, True, x, y)))
faces = [
    (
        j * angular + i,
        (j + 1) * angular + i,
        (j + 1) * angular + (i + 1) % angular,
        j * angular + (i + 1) % angular,
    )
    for j in range(radial)
    for i in range(angular)
]
seal = geo("Cire du cachet", points, faces, wax, True)
seal.shape_key_add(name="Cire souple")
emboss = seal.shape_key_add(name="Empreinte et ménisque")
emboss.data.foreach_set("co", np.asarray(finished, dtype=np.float32).reshape(-1))
for f, v in [(1, 0), (16, 0), (28, 1), (64, 1)]:
    emboss.value = v
    emboss.keyframe_insert(data_path="value", frame=f)

for x, y, r in [(-1.10, 0.46, 0.065), (0.91, -0.60, 0.036)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=r, location=(x, y, 0.001))
    bead = bpy.context.object
    bead.name = "Perle de cire"
    bead.scale = (1.13, 0.87, 0.43)
    bead.data.materials.append(wax)
    for face in bead.data.polygons:
        face.use_smooth = True

brass, brass_shader = surface("Laiton tourné", "caa05d", 0.245, 0.92)
anisotropy = brass_shader.inputs.get("Anisotropic IOR Level") or brass_shader.inputs.get("Anisotropic")
if anisotropy:
    anisotropy.default_value = 0.44
machine = noise(brass, 352, 1.3)
bump(brass, brass_shader, machine.outputs["Fac"], 0.0012, 0.13)
warm, warm_shader = surface("Laiton en retrait", "876032", 0.34, 0.86)
handle, handle_shader = surface("Manche de poirier noirci", "231715", 0.26, 0.09, 0.32)
wood = noise_colors(handle, handle_shader, 22, [(0.12, "1b1512"), (0.86, "523024")])
woodmap = handle.node_tree.nodes.new("ShaderNodeVectorMath")
woodmap.operation = "MULTIPLY"
coords = handle.node_tree.nodes.new("ShaderNodeTexCoord")
woodmap.inputs[1].default_value = (2.2, 2.2, 0.12)
handle.node_tree.links.new(coords.outputs["Object"], woodmap.inputs[0])
handle.node_tree.links.new(woodmap.outputs[0], wood.inputs["Vector"])
bump(handle, handle_shader, wood.outputs["Fac"], 0.004, 0.11)

die = bpy.data.objects.new("Matrice en action", None)
bpy.context.collection.objects.link(die)
lathe(
    "Bague de matrice",
    [
        (0.005, 0.005),
        (0.744, 0.005),
        (0.783, 0.013),
        (0.804, 0.036),
        (0.810, 0.052),
        (0.812, 0.101),
        (0.803, 0.112),
        (0.799, 0.122),
        (0.810, 0.131),
        (0.811, 0.206),
        (0.802, 0.224),
        (0.763, 0.241),
        (0.632, 0.25),
        (0.582, 0.268),
        (0.525, 0.299),
        (0.484, 0.335),
        (0.445, 0.346),
        (0.421, 0.366),
        (0.42, 0.389),
        (0.381, 0.413),
        (0.005, 0.414),
    ],
    brass,
    die,
)
# A finely knurled collar catches short changes of highlight as the matrix
# turns. The diamonds are cut into the surface, not a striped texture.
knurl_vertices = []
for row in range(9):
    for i in range(512):
        a = TAU * i / 512
        h = row / 8
        diamonds = abs(math.cos(a * 64 + h * math.pi * 2) * math.cos(a * 64 - h * math.pi * 2))
        r = 0.807 + 0.008 * diamonds * math.sin(h * math.pi)
        knurl_vertices.append((r * math.cos(a), r * math.sin(a), 0.137 + 0.055 * h))
knurl_faces = [
    (r * 512 + i, r * 512 + (i + 1) % 512, (r + 1) * 512 + (i + 1) % 512, (r + 1) * 512 + i)
    for r in range(8)
    for i in range(512)
]
knurl = geo("Guillochage de la virole", knurl_vertices, knurl_faces, brass, True)
knurl.parent = die
lathe("Filet du col", [(0.415, 0.367), (0.432, 0.375), (0.431, 0.392), (0.406, 0.399)], warm, die)
lathe(
    "Manche façonné",
    [
        (0.346, 0.36),
        (0.364, 0.388),
        (0.333, 0.449),
        (0.284, 0.515),
        (0.223, 0.597),
        (0.200, 0.694),
        (0.208, 0.82),
        (0.249, 0.99),
        (0.304, 1.15),
        (0.38, 1.33),
        (0.424, 1.48),
        (0.425, 1.59),
        (0.401, 1.70),
        (0.345, 1.79),
        (0.265, 1.86),
        (0.145, 1.904),
        (0.003, 1.918),
    ],
    handle,
    die,
)
lathe(
    "Filet de finition",
    [(0.312, 0.485), (0.327, 0.489), (0.331, 0.503), (0.319, 0.513), (0.303, 0.515)],
    brass,
    die,
)

face_mat, face_shader = surface("Matrice · initiales gravées", "d0aa6b", 0.29, 0.96)
tex = face_mat.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = mono_map
engrave = bump(face_mat, face_shader, tex.outputs["Color"], 0.023, 0.92)
texture = face_mat.node_tree.nodes.new("ShaderNodeValToRGB")
texture.color_ramp.elements[0].color = linear("dab577")
texture.color_ramp.elements[1].color = linear("866132")
face_mat.node_tree.links.new(tex.outputs["Color"], texture.inputs[0])
face_mat.node_tree.links.new(texture.outputs[0], face_shader.inputs["Base Color"])
circle = [(0.76 * math.cos(TAU * i / 160), 0.76 * math.sin(TAU * i / 160), 0.001) for i in range(160)]
plate = geo(
    "Face gravée de la matrice",
    [(0, 0, 0.001)] + circle,
    [(0, 1 + (i + 1) % 160, 1 + i) for i in range(160)],
    face_mat,
)
plate.parent = die
uv = plate.data.uv_layers.new(name="Empreinte inversée")
for poly in plate.data.polygons:
    for li in poly.loop_indices:
        co = plate.data.vertices[plate.data.loops[li].vertex_index].co
        uv.data[li].uv = (0.5 - co.x / 2.16, 0.5 + co.y / 2.16)
for f, loc, rotation in [
    (1, (-0.09, 0.26, 0.99), (-0.16, 0.04, -0.11)),
    (11, (-0.05, 0.13, 0.65), (-0.12, 0.025, -0.06)),
    (26, (0, 0, 0.135), (0, 0, 0)),
    (32, (0, 0, 0.131), (0, 0, 0)),
    (39, (0.07, 0.08, 0.35), (-0.22, 0.05, -0.04)),
    (52, (0.38, 0.49, 1.15), (-0.82, 0.13, -0.20)),
    (64, (0.48, 0.67, 1.27), (-1.11, 0.16, -0.25)),
]:
    die.location = loc
    die.rotation_euler = rotation
    die.keyframe_insert(data_path="location", frame=f)
    die.keyframe_insert(data_path="rotation_euler", frame=f)

# A broad raking source through an oculus. The glazing bars are outside shot
# and interrupt the same light that reflects along the brass rim.
softbox("Lame du matin", (-4.8, -1.7, 4.5), (0, 0, 0), 685, (1, 0.85, 0.68), 1.2, 1.8)
softbox("Réflexion froide · fenêtre", (3.6, -1.85, 3.4), (0, 0, 0.25), 112, (0.80, 0.88, 1), 1.65, 4.40)
softbox("Filet de bord", (-1.1, 4.4, 2.95), (0, 0, 0.8), 188, (1, 0.87, 0.70), 3, 0.85)
softbox("Renvoi sur l’empreinte", (0, -3.6, 1.25), (0, 0, 0.2), 48, (1, 0.92, 0.84), 3.8, 1.7)

black, _ = surface("Châssis hors champ", "222421", 0.98)


# The opening casts an elliptical patch. Its structural members and the
# opening are only light shapers, exactly like flags on a photograph set.
def flag(name, vertices, faces):
    obj = geo(name, vertices, faces, black)
    obj.visible_camera = False
    obj.visible_glossy = False
    return obj


def aperture(x, y):
    ca, sa = math.cos(0.48), math.sin(0.48)
    return (-1.34 + x * ca - y * sa, -0.31 + x * sa + y * ca, 1.36)


n = 96
outer = [aperture(14 * math.cos(TAU * i / n), 14 * math.sin(TAU * i / n)) for i in range(n)]
inner = [aperture(3.45 * math.cos(TAU * i / n), 1.34 * math.sin(TAU * i / n)) for i in range(n)]
flag("Oculus · ouverture", outer + inner, [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)])
for x, width in [(-1.76, 0.16), (-1.13, 0.083), (1.54, 0.18), (2.38, 0.080)]:
    flag(
        "Oculus · traverse",
        [
            aperture(x - width / 2, -2),
            aperture(x + width / 2, -2),
            aperture(x + width / 2, 2),
            aperture(x - width / 2, 2),
        ],
        [(0, 1, 2, 3)],
    )

# A ribbon of brass foil describes a loose curve behind the correspondence.
foil_vertices = []
for i in range(122):
    u = i / 121
    x = -5.2 + 9.7 * u
    y = 2.18 + 0.9 * math.sin(u * TAU * 1.16 - 0.65)
    z = 0.055 + 0.33 * math.sin(u * TAU * 1.20 + 0.2) ** 2 + 0.45 * u * u
    roll = 0.62 + 1.03 * math.sin(TAU * u * 1.42)
    for side in (-1, 1):
        foil_vertices.append((x, y + side * 0.19 * math.cos(roll), z + side * 0.19 * math.sin(roll)))
geo(
    "Ruban de laiton en marge",
    foil_vertices,
    [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(121)],
    brass,
    True,
)

camera_data = bpy.data.cameras.new("Macro de correspondance")
camera = bpy.data.objects.new("Caméra · empreinte", camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
focus = bpy.data.objects.new("Mise au point", None)
bpy.context.collection.objects.link(focus)
camera_data.dof.use_dof = True
camera_data.dof.focus_object = focus
camera_data.dof.aperture_fstop = 0.95
camera_data.dof.aperture_blades = 8
camera_data.lens = 56
for frame, position, aim, focal in [
    (1, (2.36, -6.63, 3.65), (0, 0.08, 0.39), (0.02, -0.25, 0.52)),
    (29, (2.0, -6.22, 4.05), (0, 0.04, 0.34), (0, -0.32, 0.20)),
    (64, (0.97, -5.69, 5.19), (0.025, 0.12, 0.46), (0, 0, 0.125)),
]:
    camera.location = position
    target(camera, aim)
    focus.location = focal
    for prop in ("location", "rotation_euler"):
        camera.keyframe_insert(data_path=prop, frame=frame)
    focus.keyframe_insert(data_path="location", frame=frame)

frames = list(map(int, opts.frames.split(","))) if opts.frames else list(range(1, 65, opts.stride))
for frame in frames:
    scene.frame_set(frame)
    scene.render.filepath = str(opts.output / f"{frame:04d}.png")
    bpy.ops.render.render(write_still=True)
