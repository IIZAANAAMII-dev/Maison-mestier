"""Construct the exhibition model and render both cameras with Blender 4.3.

blender -b -t 8 -P art/portique/portique.py -- --save
blender -b -t 5 -P art/portique/portique.py -- --view wide --render
blender -b -t 4 -P art/portique/portique.py -- --view tall --render
python art/portique/edition.py
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path
from xml.etree import ElementTree

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
MARK = REPO / "public/charte/monogramme-encre.svg"
parser = argparse.ArgumentParser()
parser.add_argument("--work", type=Path, default=Path("/tmp/maison-mestier-portique"))
parser.add_argument("--view", choices=["wide", "tall"], default="wide")
parser.add_argument("--render", action="store_true")
parser.add_argument("--frame", type=int, nargs="+")
parser.add_argument("--save", action="store_true")
parser.add_argument("--samples", type=int, default=9)
parser.add_argument("--dimensions", type=int, nargs=2)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])

FIRST, MIDDLE, LAST = 1, 36, 72
FPS = 24
SIZES = {"wide": (896, 704), "tall": (640, 800)}
OUT = args.work / args.view
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Maison Mestier · Un stand à hauteur de marque"
scene.render.engine = "CYCLES"
scene.render.resolution_x, scene.render.resolution_y = args.dimensions or SIZES[args.view]
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.frame_start, scene.frame_end = FIRST, LAST
scene.render.film_transparent = True
scene.render.use_persistent_data = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.compression = 9
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.13
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.cycles.use_animated_seed = False
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.sample_clamp_indirect = 2.5


def collection(name):
    result = bpy.data.collections.new(name)
    scene.collection.children.link(result)
    return result


base_set = collection("01 · Socle et sol calepiné")
shell_set = collection("02 · Le portique et ses assemblages")
fixture_set = collection("03 · Accueil et signalétique")
people_set = collection("04 · Échelle humaine")
studio_set = collection("05 · Atelier de lumière")
camera_set = collection("06 · Deux cadrages")


def rgba(value):
    def linear(byte):
        channel = byte / 255
        return channel / 12.92 if channel < 0.04045 else ((channel + .055) / 1.055) ** 2.4
    return tuple(linear(int(value[i:i + 2], 16)) for i in (0, 2, 4)) + (1,)


def material(name, color, roughness, metal=0, coat=0, texture=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba(color)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Coat Weight"].default_value = coat
    shader.inputs["Coat Roughness"].default_value = .22
    if texture:
        noise = mat.node_tree.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 165
        noise.inputs["Detail"].default_value = 2
        bump = mat.node_tree.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = texture
        bump.inputs["Distance"].default_value = .002
        mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        mat.node_tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat


red = material("Rouge cachet · laque satinée", "8E2A23", .43)
red.node_tree.nodes.get("Principled BSDF").inputs["Specular IOR Level"].default_value = .016
edge = material("Laque · reflets de chant", "A74D3B", .26, .19, .28)
seal = material("Oxyde sombre · empreinte", "592622", .45)
wall_red = material("Cloison · argile rouge", "8D392D", .42, .06, .10, .11)
ivory = material("Ivoire · linoléum", "E6D8BC", .48, texture=.16)
limestone = material("Pierre calcaire · adoucie", "EFDFCB", .53, texture=.19)
cream = material("Coton écru", "F3E7D0", .64, texture=.13)
groove = material("Joint gris chaud", "AA9178", .56)
brass = material("Métal champagne brossé", "AA8360", .33, .60, .04)
terracotta = material("Céramique mate · silhouette", "AD8E73", .55)
rug = material("Tapis · feutre taupe", "C7AE90", .69, texture=.27)
paper = material("Papier d’atelier", "FBEDD4", .61)
shadow = material("Sol · calcaire doux", "F4F0E7", .73)


def move_to(obj, group):
    for previous in list(obj.users_collection):
        previous.objects.unlink(obj)
    group.objects.link(obj)
    return obj


def mesh(name, vertices, faces, mats, group, tags=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    out = bpy.data.objects.new(name, data)
    group.objects.link(out)
    for mat in mats:
        data.materials.append(mat)
    if tags:
        for polygon, tag in zip(data.polygons, tags):
            polygon.material_index = tag
    return out


def soften(obj, width, segments=3):
    if not width:
        return
    bevel = obj.modifiers.new("Raccord adouci", "BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.angle_limit = math.radians(25)
    normals = obj.modifiers.new("Normales des faces", "WEIGHTED_NORMAL")
    normals.keep_sharp = True


def cuboid(name, form, at, mat, group, bevel=0, parent=None):
    x, y, z = (s / 2 for s in form)
    vertices = [(x * a, y * b, z * c) for c in (-1, 1) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7)] + [(i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4) for i in range(4)]
    out = mesh(name, vertices, faces, [mat], group)
    soften(out, bevel)
    out.parent, out.location = parent, at
    return out


def round_plate(name, form, radius, bottom, height, mat, group, at=(0, 0, 0), parent=None, taper=1):
    points = []
    for x, y, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        center_x = x * (form[0] / 2 - radius)
        center_y = y * (form[1] / 2 - radius)
        for n in range(12):
            angle = math.radians(start + n * 90 / 11)
            points.append((center_x + radius * math.cos(angle), center_y + radius * math.sin(angle)))
    count = len(points)
    vertices = [(x * s, y * s, bottom + level * height) for level, s in enumerate((1, taper)) for x, y in points]
    faces = [tuple(reversed(range(count))), tuple(range(count, 2 * count))]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    out = mesh(name, vertices, faces, [mat], group)
    for polygon in list(out.data.polygons)[2:]:
        polygon.use_smooth = True
    soften(out, min(.019, height / 3), 2)
    out.parent, out.location = parent, at
    return out


def empty(name, group):
    out = bpy.data.objects.new(name, None)
    group.objects.link(out)
    out.empty_display_size = .30
    return out


def spline(name, points, depth, mat, group, parent=None):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = depth
    data.bevel_resolution = 2
    strand = data.splines.new("POLY")
    strand.points.add(len(points) - 1)
    for point, value in zip(strand.points, points):
        point.co = (*value, 1)
    data.materials.append(mat)
    out = bpy.data.objects.new(name, data)
    group.objects.link(out)
    out.parent = parent
    return out


def stance(obj, locations):
    for frame, position, rotation in locations:
        obj.location, obj.rotation_euler = position, rotation
        obj.keyframe_insert(data_path="location", frame=frame)
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    for curve in obj.animation_data.action.fcurves:
        for key in curve.keyframe_points:
            key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"


def sampled_cubic(points, steps=24):
    a, b, c, d = map(Vector, points)
    for i in range(steps + 1):
        u = i / steps
        yield (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u ** 2 * c + u ** 3 * d


round_plate("Plateau · calcaire ivoire", (6.48, 4.16), .53, .083, .11, limestone, base_set)
round_plate("Trait de socle · joint d’ombre", (6.44, 4.12), .51, .056, .031, seal, base_set)
round_plate("Semelle · contreplaqué", (6.41, 4.07), .50, .007, .057, ivory, base_set)
for name, points, pigment, weight in (
    ("Seuil en laiton", [(-2.05, -1.71, .194), (2.52, -1.71, .194)], brass, .005),
    ("Joint du sol", [(2.43, -1.69, .194), (2.43, 1.56, .194)], groove, .004),
    ("Retour de seuil", [(-2.05, -1.71, .194), (-2.05, -1.25, .194)], brass, .005),
):
    spline(name, points, weight, pigment, base_set)


def portico():
    # These four cubic spans form a broad, thin architectural shell with
    # a continuously curved jamb and a long tapered eave.
    spans = [
        [(-2.47, .195), (-2.50, .82), (-2.55, 1.57), (-2.35, 2.18)],
        [(-2.35, 2.18), (-2.15, 2.80), (-1.85, 3.145), (-1.22, 3.16)],
        [(-1.22, 3.16), (.03, 3.19), (1.12, 3.35), (2.02, 3.145)],
        [(2.02, 3.145), (2.37, 3.065), (2.60, 2.91), (2.59, 2.745)],
    ]
    spine = []
    for n, span in enumerate(spans):
        spine.extend(list(sampled_cubic(span))[int(n > 0):])
    vertices = []
    for i, point in enumerate(spine):
        fraction = i / (len(spine) - 1)
        direction = (spine[min(i + 1, len(spine) - 1)] - spine[max(0, i - 1)]).normalized()
        normal = Vector((-direction.y, direction.x))
        width = 1.17 + .55 * math.sin(math.pi * fraction)**1.45 - .29 * fraction**5
        center_y = -.22 + .59 * fraction
        for sign, side in ((1, -1), (-1, -1), (-1, 1), (1, 1)):
            x, z = point + sign * .058 * normal
            z = max(.194, z)
            y = center_y + side * width / 2 + (side + 1) * .07 * math.sin(math.pi * fraction)
            vertices.append((x, y, z))
    faces, tags = [(3, 2, 1, 0)], [1]
    for row in range(len(spine) - 1):
        for i, finish in enumerate((2, 1, 2, 0)):
            j = (i + 1) % 4
            faces.append((4 * row + i, 4 * row + j, 4 * (row + 1) + j, 4 * (row + 1) + i))
            tags.append(finish)
    faces.append(tuple(range(len(vertices) - 4, len(vertices))))
    tags.append(2)
    canopy = mesh("Portique · peau pliée en laque rouge", vertices, faces, [red, ivory, edge], shell_set, tags)
    for face in canopy.data.polygons:
        face.use_smooth = face.material_index != 2
    soften(canopy, .019)
    # A concealed strip of ivory marks the underside detail along the folded edge.
    spline("Ruban lumineux · intérieur de l’auvent", [(x + .045, y + .082, z - .020) for x, y, z in vertices[1::4][30:-6]], .012, cream, shell_set, canopy)
    return canopy, Vector(vertices[3 + 4 * 43]), Vector(vertices[0 + 4 * 56])


canopy, upper_edge, front_edge = portico()
stance(canopy, [
    (1, (-.12, -.23, .223), (.013, -.083, -.056)),
    (9, (-.098, -.184, .182), (.009, -.064, -.044)),
    (36, (-.028, -.043, .062), (.003, -.021, -.014)),
    (61, (0, 0, 0), (0, 0, 0)),
    (72, (0, 0, 0), (0, 0, 0)),
])


def upright(name, xy, height):
    x, y = xy
    foot = round_plate(name + " · sabot", (.20, .19), .043, .194, .033, brass, shell_set)
    foot.location.x, foot.location.y = x, y
    post = cuboid(name, (.069, .062, height - .194), (x, y, (.194 + height) / 2), brass, shell_set, .016)
    return post


upright("Montant d’avant", (2.17, -.10), 2.97)
upright("Montant arrière", (2.23, .89), 2.96)


wall_group = empty("Ensemble · cloison pivotante", shell_set)


def screen_panel():
    points = list(sampled_cubic([(0, 0), (1.04, .12), (1.92, .25), (2.66, -.61)], 42))
    vertices = []
    for i, point in enumerate(points):
        amount = i / (len(points) - 1)
        direction = (points[min(i + 1, len(points) - 1)] - points[max(0, i - 1)]).normalized()
        normal = Vector((-direction.y, direction.x))
        top = 2.56 - .38 * amount**4 + .027 * math.sin(math.pi * amount)
        for side, height in ((-1, .194), (-1, top), (1, top), (1, .194)):
            x, y = point + side * normal * .046
            vertices.append((x, y, height))
    last = len(vertices)
    faces = [(3, 2, 1, 0)]
    tags = [2]
    for a in range(0, last - 4, 4):
        for i, tag in enumerate((0, 2, 1, 2)):
            j = (i + 1) % 4
            faces.append((a + i, a + j, a + 4 + j, a + 4 + i))
            tags.append(1 if tag == 0 and a / last >= .76 else tag)
    faces.append(tuple(range(last - 4, last)))
    tags.append(2)
    panel = mesh("Cloison courbe · recto ivoire, dos cachet", vertices, faces, [cream, wall_red, edge], shell_set, tags)
    panel.parent = wall_group
    for face in panel.data.polygons:
        face.use_smooth = face.material_index != 2
    soften(panel, .018)
    return panel


screen_panel()
stance(wall_group, [
    (1, (-.42, 1.11, .235), (0, -.028, .52)),
    (10, (-.42, 1.18, .206), (0, -.019, .40)),
    (36, (-.53, 1.29, .135), (0, -.015, -.16)),
    (48, (-.51, 1.18, .053), (0, -.005, -.08)),
    (67, (-.51, 1.06, 0), (0, 0, 0)),
    (72, (-.51, 1.06, 0), (0, 0, 0)),
])


def svg_cubics():
    root = ElementTree.parse(MARK).getroot()
    view = tuple(map(float, root.attrib["viewBox"].split()))
    contour = root.find("{http://www.w3.org/2000/svg}path").attrib["d"]
    tokens = re.findall(r"[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", contour)
    if tokens[0] != "M" or tokens[-1].lower() != "z":
        raise ValueError("Expected a single closed cubic contour for the Maison Mestier monogram")
    initial = Vector(tuple(map(float, tokens[1:3])))
    start = initial.copy()
    offset, segments = 3, []
    while offset < len(tokens) - 1:
        if tokens[offset] == "c":
            offset += 1
        values = [float(token) for token in tokens[offset:offset + 6]]
        first = start + Vector(values[:2])
        second = start + Vector(values[2:4])
        final = start + Vector(values[4:])
        segments.append((start, first, second, final))
        start = final
        offset += 6
    if (start - initial).length > .00001:
        segments.append((start, start.lerp(initial, 1 / 3), start.lerp(initial, 2 / 3), initial))
    return view, segments


logo_view, logo_segments = svg_cubics()


def monogram(name, at, width, mat, group, parent=None, yaw=0):
    left, top, drawing_width, drawing_height = logo_view

    def map_to_face(point):
        ratio = width / drawing_width
        return ((point.x - left - drawing_width / 2) * ratio, (top + drawing_height / 2 - point.y) * ratio, 0)

    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "2D"
    data.fill_mode = "BOTH"
    data.resolution_u = 5
    data.extrude = .0007
    strand = data.splines.new("BEZIER")
    strand.bezier_points.add(len(logo_segments) - 1)
    strand.use_cyclic_u = True
    for i, (control, first, _, _) in enumerate(logo_segments):
        point = strand.bezier_points[i]
        point.co = map_to_face(control)
        point.handle_left_type = point.handle_right_type = "FREE"
        point.handle_left = map_to_face(logo_segments[i - 1][2])
        point.handle_right = map_to_face(first)
    data.materials.append(mat)
    out = bpy.data.objects.new(name, data)
    group.objects.link(out)
    out.parent, out.location = parent, at
    out.rotation_euler = (math.pi / 2, 0, yaw)
    return out


def sign(body, at, size, pigment, group, parent=None):
    name = "Signalétique · " + body
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.space_character = 1.19
    curve.resolution_u = 5
    curve.materials.append(pigment)
    obj = bpy.data.objects.new(name, curve)
    group.objects.link(obj)
    obj.location, obj.parent = at, parent
    obj.rotation_euler.x = math.pi / 2
    return obj


cuboid("Plaque suspendue · panneau de marque", (1.34, .043, .78), (.64, -.083, 1.93), limestone, fixture_set, .036, wall_group)
monogram("M officiel · enseigne du stand", (.64, -.106, 2.01), .46, red, fixture_set, wall_group)
sign("MAISON MESTIER", (.64, -.108, 1.73), .108, seal, fixture_set, wall_group)


desk = empty("Ensemble · le comptoir", fixture_set)
round_plate("Comptoir · retrait dessous", (1.53, .66), .27, .194, .11, seal, fixture_set, parent=desk)
round_plate("Comptoir · face calcaire", (1.62, .74), .29, .261, .834, limestone, fixture_set, parent=desk, taper=.975)
round_plate("Comptoir · plateau rouge", (1.67, .783), .298, 1.095, .068, red, fixture_set, parent=desk)
monogram("M officiel · l’accueil", (0, -.373, .686), .305, red, fixture_set, desk)
for index in range(3):
    sample = cuboid("Échantillon sur le comptoir", (.243, .156, .012), (.33 + .025 * index, .026, 1.169 + .012 * index), (paper, ivory, cream)[index], fixture_set, .004, desk)
    sample.rotation_euler.z = .15 + .11 * index
stance(desk, [
    (1, (-1.55, -1.37, .033), (0, 0, -.34)),
    (8, (-1.48, -1.31, .033), (0, 0, -.292)),
    (36, (-1.06, -1.074, .011), (0, 0, -.123)),
    (57, (-.76, -.93, 0), (0, 0, .015)),
    (72, (-.76, -.93, 0), (0, 0, .015)),
])


round_plate("Tapis de conversation", (1.40, .91), .34, .194, .010, rug, fixture_set, at=(1.25, .57, 0))


def pole(name, a, b, radius, mat, group, parent=None, radius2=None):
    a, b = Vector(a), Vector(b)
    vector = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=14, radius1=radius, radius2=radius if radius2 is None else radius2, depth=vector.length)
    obj = move_to(bpy.context.object, group)
    obj.name, obj.parent = name, parent
    obj.location, obj.rotation_euler = (a + b) / 2, vector.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj


def stool(x, y):
    round_plate("Assise · lin", (.47, .45), .21, .646, .084, cream, fixture_set, at=(x, y, 0))
    for i in range(3):
        angle = i * math.tau / 3
        v = Vector((math.cos(angle), math.sin(angle), 0))
        a = Vector((x, y, .20)) + .176 * v
        b = Vector((x, y, .651)) + .121 * v
        pole("Pied de tabouret", a, b, .019, brass, fixture_set, radius2=.024)


stool(.83, .64)
stool(1.62, .39)


def ellipse(name, at, scale, mat, group, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10)
    obj = move_to(bpy.context.object, group)
    obj.name, obj.parent, obj.location, obj.scale = name, parent, at, scale
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def visitor():
    # A matte scale model, moulded in one piece like a studio maquette.
    pivot = empty("Figurine · personne à l’accueil", people_set)
    head = ellipse("Tête", (-.004, .018, 1.568), (.087, .103, .118), terracotta, people_set, pivot)
    parts = [
        head,
        ellipse("Épaules", (0, .011, 1.30), (.199, .097, .153), terracotta, people_set, pivot),
        ellipse("Buste", (.009, .022, 1.163), (.158, .092, .246), terracotta, people_set, pivot),
        ellipse("Bassin", (.012, .026, .936), (.145, .116, .126), terracotta, people_set, pivot),
        pole("Cou", (0, .015, 1.382), (-.004, .020, 1.50), .058, terracotta, people_set, pivot, .057),
        ellipse("Pied gauche", (-.118, -.062, .043), (.061, .117, .043), terracotta, people_set, pivot),
        ellipse("Pied droit", (.114, .11, .043), (.058, .111, .042), terracotta, people_set, pivot),
        ellipse("Main gauche", (-.195, -.034, .866), (.048, .073, .071), terracotta, people_set, pivot),
        ellipse("Main droite", (.124, -.153, 1.107), (.055, .073, .045), terracotta, people_set, pivot),
    ]
    leg_sets = [
        [(-.082, .02, .977), (-.103, -.024, .514), (-.120, -.019, .075)],
        [(.095, .034, .975), (.103, .068, .521), (.117, .147, .082)],
    ]
    arm_sets = [
        [(-.160, .010, 1.36), (-.198, .026, 1.149), (-.195, -.034, .885)],
        [(.166, .021, 1.333), (.212, .012, 1.095), (.125, -.146, 1.113)],
    ]
    for kind, assemblies in (("Jambe", leg_sets), ("Bras", arm_sets)):
        thick, joint, thin = (.082, .060, .043) if kind == "Jambe" else (.057, .041, .032)
        for a, b, c in assemblies:
            parts += [
                pole(kind, a, b, thick, terracotta, people_set, pivot, joint),
                pole(kind, b, c, joint, terracotta, people_set, pivot, thin),
                ellipse("Articulation", b, (joint, joint, joint), terracotta, people_set, pivot),
            ]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.join()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    head.name = "Figurine en argile · échelle humaine"
    head.data.remesh_voxel_size = .018
    bpy.ops.object.voxel_remesh()
    head.data.materials.clear()
    head.data.materials.append(terracotta)
    smooth = head.modifiers.new("Finition du moulage", "SMOOTH")
    smooth.factor, smooth.iterations = .85, 4
    for face in head.data.polygons:
        face.use_smooth = True
    stance(pivot, [
        (1, (1.32, -1.13, .194), (0, 0, -.51)),
        (23, (1.32, -1.13, .194), (0, 0, -.51)),
        (49, (1.32, -1.13, .194), (0, 0, -.43)),
        (72, (1.32, -1.13, .194), (0, 0, -.43)),
    ])
    return pivot


visitor()

floor = cuboid("Cyclorama · capteur d’ombres", (180, 180, .05), (0, 0, -.025), shadow, studio_set)
floor.is_shadow_catcher = True
scene.world = bpy.data.worlds.new("Réflexion · ciel de l’atelier")
scene.world.use_nodes = True
background = scene.world.node_tree.nodes.get("Background")
background.inputs["Color"].default_value = (.88, .90, .96, 1)
background.inputs["Strength"].default_value = .32


def area(name, at, aim, power, tint, dimensions):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.color = power, tint
    data.shape = "RECTANGLE"
    data.size, data.size_y = dimensions
    obj = bpy.data.objects.new(name, data)
    studio_set.objects.link(obj)
    obj.location = at
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()


area("Fenêtre diffuse à gauche", (-5, -5.9, 9), (0, 0, 1.6), 1070, (1, .96, .91), (4.2, 5.4))
area("Éclairage doux du vestibule", (5.6, -3.2, 6.3), (0, .3, 1.0), 646, (1, .91, .82), (5.3, 4.0))
area("Long reflet au dos de la laque", (-1.4, 5.8, 6.0), (0, 0, 2.3), 500, (.95, .97, 1), (5.5, 2.8))


def camera(name, poses):
    data = bpy.data.cameras.new(name)
    data.type = "ORTHO"
    obj = bpy.data.objects.new(name, data)
    camera_set.objects.link(obj)
    for frame, at, aim, scale in poses:
        obj.location = at
        obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()
        data.ortho_scale = scale
        obj.keyframe_insert(data_path="location", frame=frame)
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
        data.keyframe_insert(data_path="ortho_scale", frame=frame)
    return obj


cameras = {
    "wide": camera("Paysage · le stand dans la lumière", [
        (1, (5.8, -10.8, 6.65), (0, -.06, 1.49), 8.10),
        (8, (5.59, -10.8, 6.55), (0, -.04, 1.48), 8.03),
        (36, (3.87, -11.10, 6.26), (0, .01, 1.45), 7.88),
        (72, (6.37, -10.6, 6.60), (0, .03, 1.42), 8.10),
    ]),
    "tall": camera("Portrait · cadrage du stand et du passage", [
        (1, (4.95, -10.85, 6.45), (0, -.06, 1.40), 9.78),
        (8, (4.72, -10.85, 6.35), (0, -.05, 1.38), 9.65),
        (36, (2.70, -11.23, 5.98), (0, .02, 1.34), 9.40),
        (72, (5.65, -10.72, 6.41), (0, .05, 1.33), 9.79),
    ]),
}


def registration():
    def project(camera, point):
        screen = world_to_camera_view(scene, camera, point)
        return [round(screen.x, 5), round(1 - screen.y, 5)]
    output = {}
    for view, lens in cameras.items():
        scene.render.resolution_x, scene.render.resolution_y = SIZES[view]
        output[view] = {}
        for frame in (FIRST, MIDDLE, LAST):
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            output[view][frame] = {
                "canopy": project(lens, canopy.matrix_world @ upper_edge),
                "front": project(lens, canopy.matrix_world @ front_edge),
                "plinth": project(lens, Vector((1.76, -2.08, .145))),
            }
    print("REGISTRATION " + json.dumps(output))
    (args.work / "registration.json").write_text(json.dumps(output, indent=2), encoding="utf8")


if args.save:
    registration()
    scene.frame_set(FIRST)
    scene.camera = cameras["wide"]
    scene.render.resolution_x, scene.render.resolution_y = SIZES["wide"]
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "portique.blend"), compress=True)

scene.camera = cameras[args.view]
scene.render.resolution_x, scene.render.resolution_y = args.dimensions or SIZES[args.view]
frames = args.frame or (range(FIRST, LAST + 1) if args.render else [])
source_time = max(Path(__file__).stat().st_mtime, MARK.stat().st_mtime)
for frame in frames:
    output = OUT / f"{frame:03d}.png"
    if args.render and output.is_file() and output.stat().st_mtime >= source_time:
        continue
    scene.frame_set(frame)
    pending = output.with_name(f".{frame:03d}-pending.png")
    scene.render.filepath = str(pending)
    bpy.ops.render.render(write_still=True)
    pending.replace(output)
