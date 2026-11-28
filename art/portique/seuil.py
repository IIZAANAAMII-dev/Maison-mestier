"""Render the entrance and its measured elevation from the same cameras.

blender -b -t 8 -P art/portique/seuil.py
Use SEUIL_DRAWINGS_ONLY=1 to regenerate both construction sheets without rendering.
"""

from math import cos, pi, sin
from os import getenv
from pathlib import Path
import subprocess
import tempfile
from xml.etree import ElementTree

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 5
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.world = bpy.data.worlds.new("Éclairage indirect de l’atelier")
scene.world.use_nodes = True
environment = scene.world.node_tree.nodes.get("Background")
environment.inputs["Color"].default_value = (.35, .24, .18, 1)
environment.inputs["Strength"].default_value = .15


def surface(name, pigment, roughness, grain=0, finish=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*pigment, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Coat Weight"].default_value = finish
    shader.inputs["Coat Roughness"].default_value = .31
    if grain:
        uv = nodes.new("ShaderNodeTexCoord")
        mottling = nodes.new("ShaderNodeTexNoise")
        mottling.inputs["Scale"].default_value = 6.7
        mottling.inputs["Detail"].default_value = 4
        flecks = nodes.new("ShaderNodeTexNoise")
        flecks.inputs["Scale"].default_value = 68
        flecks.inputs["Detail"].default_value = 2.8
        pigment_mix = nodes.new("ShaderNodeValToRGB")
        pigment_mix.color_ramp.elements[0].color = (*(c * .73 for c in pigment), 1)
        pigment_mix.color_ramp.elements[1].color = (*(c * 1.14 for c in pigment), 1)
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Distance"].default_value = .033
        bump.inputs["Strength"].default_value = grain
        links.new(uv.outputs["Object"], mottling.inputs["Vector"])
        links.new(uv.outputs["Object"], flecks.inputs["Vector"])
        links.new(mottling.outputs["Fac"], pigment_mix.inputs[0])
        links.new(pigment_mix.outputs["Color"], shader.inputs["Base Color"])
        links.new(flecks.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat


lime = surface("Calcaire veiné", (.47, .377, .296), .84, .27)
plaster = surface("Enduit chaud", (.46, .37, .307), .85, .23)
concrete = surface("Sol minéral", (.19, .149, .120), .67, .28)
lacquer = surface("Laque Maison Mestier", (.119, .014, .014), .29, .018, .38)
walnut = surface("Noyer ciré", (.097, .038, .016), .48, .095)
brass = surface("Laiton patiné", (.36, .187, .068), .3, .025)
brass.node_tree.nodes.get("Principled BSDF").inputs["Metallic"].default_value = .78
ink = surface("Encre rouge imprégnée", (.115, .024, .020), .89, .048)
paper = surface("Papier non couché", (.77, .687, .552), .86, .17)
dark = surface("Ombre terre de Sienne", (.073, .024, .017), .59, .12)
linen = surface("Rideau en lin", (.53, .402, .287), .91, .09)


def box(name, dimensions, center, material, bevel=.018):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    item = bpy.context.object
    item.name = name
    item.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    item.data.materials.append(material)
    edge = item.modifiers.new("Arête adoucie", "BEVEL")
    edge.width = bevel
    edge.segments = 4
    item.modifiers.new("Normales de surface", "WEIGHTED_NORMAL")
    return item


def arch(half, top, corner, depth):
    points = [(-half, depth, 0)]
    for sign in (-1, 1):
        angles = (pi - i * pi / 48 for i in range(25)) if sign == -1 else (pi / 2 - i * pi / 48 for i in range(25))
        points.extend((sign * (half - corner) + corner * cos(a), depth, top - corner + corner * sin(a)) for a in angles)
    points.append((half, depth, 0))
    return points


def portal(name, half, top, radius, thickness, start, depth, material):
    contours = [
        arch(half, top, radius, start),
        arch(half - thickness, top - thickness, radius - thickness, start),
        arch(half, top, radius, start + depth),
        arch(half - thickness, top - thickness, radius - thickness, start + depth),
    ]
    count = len(contours[0])
    faces = []
    for outer, inner in ((0, 1), (2, 0), (1, 3), (3, 2)):
        for index in range(count - 1):
            faces.append((outer * count + index, outer * count + index + 1, inner * count + index + 1, inner * count + index))
    faces.extend(((0, count, 3 * count, 2 * count), (count - 1, 3 * count - 1, 4 * count - 1, 2 * count - 1)))
    shape = bpy.data.meshes.new(name)
    shape.from_pydata([p for curve in contours for p in curve], [], faces)
    shape.update()
    item = bpy.data.objects.new(name, shape)
    scene.collection.objects.link(item)
    item.data.materials.append(material)
    bevel = item.modifiers.new("Arrondi de la laque", "BEVEL")
    bevel.segments = 4
    bevel.width = .043
    item.modifiers.new("Reflets continus", "WEIGHTED_NORMAL")
    return contours


def tube(name, points, radius, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 1
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinates in zip(spline.points, points):
        point.co = (*coordinates, 1)
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    curve.materials.append(material)
    return obj


def pleated_linen():
    # Each pleat hangs independently. Slightly irregular flute spacing breaks up
    # the long raking shadow in the backdrop.
    verts, faces = [], []
    count, levels = 320, 6
    for row in range(levels):
        z = .075 + row * .83
        for i in range(count):
            x = -4.45 + 8.9 * i / (count - 1)
            phase = x * 16.8 + .56 * sin(x * 1.65) + .095 * sin(z * .8 + x * 1.2)
            verts.append((x, 4.51 + .111 * sin(phase) + .026 * sin(2 * phase), z))
            if row and i:
                n = row * count + i
                faces.append((n - count - 1, n - count, n, n - 1))
    mesh = bpy.data.meshes.new("Lés de lin")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(linen)
    for f in mesh.polygons:
        f.use_smooth = True
    obj = bpy.data.objects.new("Rideau de fond plissé", mesh)
    scene.collection.objects.link(obj)


def rounded_outline(cx, cy, width, depth, radius, z):
    result = []
    for j, (dx, dy) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        for i in range(13):
            a = j * pi / 2 + i * pi / 24
            result.append((cx + dx * (width / 2 - radius) + radius * cos(a),
                           cy + dy * (depth / 2 - radius) + radius * sin(a), z))
    return result + [result[0]]


box("Dalle continue", (32, 32, .28), (0, 0, -.16), concrete)
box("Mur de fond", (20, .27, 6.5), (0, 5.23, 3.19), plaster)
box("Aile droite", (.32, 14, 6.4), (5, -.45, 3.17), lime)
box("Cloison en retour", (.22, 5.1, 4.3), (-3.6, 3.25, 2.11), plaster)
box("Plinthe du pavillon", (4.48, 5.35, .092), (0, 2.15, .015), dark)
box("Sol du pavillon", (4.54, 5.41, .058), (0, 2.15, .09), lime)
frame = portal("Portique laqué", 2.15, 3.38, .93, .45, .12, .65, lacquer)
portal("Feuillure intérieure", 1.715, 2.935, .5, .045, .81, .092, dark)
# A thin brass edge is let into the lacquer around its inner face.
pin = arch(1.73, 2.959, .51, .119)
tube("Filet de laiton", pin, .008, brass)

pleated_linen()
# The studio's actual pen-drawn mark is mounted on a sheet of uncoated
# stock, suspended on brass rods in front of the rear curtain.
banner_x, banner_y = .67, 3.64
box("Affiche suspendue", (1.34, .018, 1.72), (banner_x, banner_y, 1.93), paper, .006)
for height in (1.076, 2.793):
    tube("Lest en laiton", [(banner_x - .702, banner_y, height), (banner_x + .702, banner_y, height)], .018, brass)
for x in (banner_x - .52, banner_x + .52):
    tube("Suspente de l’affiche", [(x, banner_y, 2.805), (x, banner_y, 4.56)], .005, dark)

mark_file = Path(__file__).resolve().parents[2] / "public/charte/monogramme-cachet.svg"
before = set(scene.objects)
bpy.ops.import_curve.svg(filepath=str(mark_file))
mark = next(obj for obj in scene.objects if obj not in before and obj.type == 'CURVE')
mark.name = "Monogramme de la Maison imprimé sur l’affiche"
bpy.context.view_layer.update()
corners = [mark.matrix_world @ Vector(p) for p in mark.bound_box]
center = sum(corners, Vector((0, 0, 0))) / len(corners)
factor = .94 / mark.dimensions.x
mark.data.materials.clear()
mark.data.materials.append(ink)
mark.scale *= factor
mark.rotation_euler.x = pi / 2
mark.location = (banner_x - center.x * factor, banner_y - .014, 2.0 - center.y * factor)

lettering = bpy.data.curves.new("Petit corps de l’affiche", "FONT")
lettering.body = "MAISON MESTIER"
lettering.align_x = "CENTER"
lettering.space_character = 1.34
lettering.size = .071
lettering.materials.append(ink)
signature = bpy.data.objects.new(lettering.name, lettering)
scene.collection.objects.link(signature)
signature.location = (banner_x, banner_y - .016, 1.39)
signature.rotation_euler.x = pi / 2

# Sculpted counter with a slatted walnut apron and a limestone lip.
cx, cy = -.39, 1.91
box("Socle en retrait", (1.57, .50, .12), (cx, cy, .20), dark, .05)
box("Corps du comptoir", (1.75, .62, .76), (cx, cy, .61), walnut, .13)
for i in range(37):
    x = cx - .74 + i * .041
    tube("Canne de noyer", [(x, cy - .312, .285), (x, cy - .312, .929)], .009, walnut)
box("Plateau de calcaire", (1.84, .72, .084), (cx, cy, 1.021), lime, .036)
apron_rim = rounded_outline(cx, cy, 1.74, .614, .14, .955)
tube("Joint du plateau", apron_rim, .012, brass)
counter_plan = rounded_outline(cx, cy, 1.84, .72, .085, 1.06)
box("Livre de matières", (.53, .34, .047), (cx + .17, cy, 1.089), lacquer, .009)
box("Papier du livre", (.502, .325, .027), (cx + .17, cy, 1.099), paper, .005)
box("Couverture du carnet", (.527, .339, .006), (cx + .17, cy, 1.117), lacquer, .002)
box("Échantillon de matière", (.19, .16, .022), (cx - .31, cy + .035, 1.074), dark, .007)

opal = surface("Tube opalin", (.92, .78, .57), .25)
opal_shader = opal.node_tree.nodes.get("Principled BSDF")
opal_shader.inputs["Emission Color"].default_value = (1, .79, .59, 1)
opal_shader.inputs["Emission Strength"].default_value = 2.15
tube("Luminaire opalin", [(-1.17, 1.77, 2.46), (.35, 1.77, 2.46)], .033, opal)
for x in (-1.18, .36):
    tube("Embout patiné", [(x - .025, 1.77, 2.46), (x + .025, 1.77, 2.46)], .037, brass)
    tube("Suspente du luminaire", [(x, 1.77, 2.48), (x, 1.77, 4.56)], .0048, dark)

for i in range(-2, 5):
    y = i * 1.14 - .62
    tube("Joint du pavement", [(-5.6, y, -.015), (5.6, y, -.015)], .004, dark)


def wash(name, position, aim, energy, size, color):
    light = bpy.data.lights.new(name, "AREA")
    light.energy, light.size, light.color = energy, size, color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()


wash("Fenêtre latérale", (-4.9, -3.6, 5), (0, 1, 1.4), 820, 3.3, (1, .865, .74))
wash("Lumière derrière le seuil", (-1, 2.6, 4.18), (.12, 3.2, .65), 210, 1.8, (1, .78, .61))
wash("Remplissage froid", (4.45, -1.2, 4.9), (0, 1.6, 1.4), 230, 4, (.78, .86, 1))
daylight = bpy.data.lights.new("Soleil rasant", "SUN")
daylight.energy = 2.2
daylight.angle = .034
day = bpy.data.objects.new(daylight.name, daylight)
scene.collection.objects.link(day)
day.rotation_euler = Vector((.94, .53, -.70)).to_track_quat("-Z", "Y").to_euler()

camera = bpy.data.objects.new("Caméra du vestibule", bpy.data.cameras.new("Objectif du vestibule"))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.sensor_fit = "HORIZONTAL"

destination = Path(__file__).resolve().parents[2] / "public" / "seuil"
destination.mkdir(parents=True, exist_ok=True)


def project(camera, points, width, height):
    coordinates = [world_to_camera_view(scene, camera, Vector(point)) for point in points]
    return "M" + "L".join(f"{point.x * width:.1f},{(1 - point.y) * height:.1f}" for point in coordinates)


def render(suffix, width, height, location, aim, focal_length, work):
    camera.location = location
    camera.rotation_euler = (Vector(aim) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = focal_length
    scene.render.resolution_x, scene.render.resolution_y = width, height
    bpy.context.view_layer.update()
    result = work / f"seuil{suffix}.png"
    scene.render.filepath = str(result)
    if not getenv("SEUIL_DRAWINGS_ONLY"):
        bpy.ops.render.render(write_still=True)
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(result), "-filter_threads", "2",
            "-vf", "hqdn3d=3:3:5:5,vaguedenoiser=threshold=7:method=garrote:nsteps=3:type=bayes",
            "-c:v", "libwebp", "-quality", "85",
            str(destination / f"vue{suffix}.webp"),
        ], check=True)

    front, inner, rear, inside = [project(camera, points, width, height) for points in frame]

    def stroke(points):
        return project(camera, points, width, height)

    def ticked_dimension(start, stop, label, offset):
        def px(point):
            uv = world_to_camera_view(scene, camera, Vector(point))
            return Vector((uv.x * width, (1 - uv.y) * height))
        a, b = px(start), px(stop)
        normal = Vector((-(b-a).y, (b-a).x)).normalized() * offset
        c, d = a + normal, b + normal
        tick = Vector((4, -5))
        def line(p, q):
            return f'M{p.x:.1f},{p.y:.1f}L{q.x:.1f},{q.y:.1f}'
        marks = ''.join((line(a, c + normal * .13), line(b, d + normal * .13), line(c, d),
                         line(c - tick, c + tick), line(d - tick, d + tick)))
        mid = (c + d) * .5
        return (f'<path d="{marks}"/><text stroke="none" fill="#733e30" x="{mid.x:.1f}" y="{mid.y - 6:.1f}" '
                f'text-anchor="middle" font-family="monospace" font-size="15">{label}</text>')

    face = stroke(frame[0] + list(reversed(frame[1]))) + 'Z'
    side = stroke(frame[1] + list(reversed(frame[3]))) + 'Z'
    ground = stroke([(-2.27, -.555, .12), (2.27, -.555, .12), (2.27, 4.855, .12), (-2.27, 4.855, .12)])
    desk = stroke(counter_plan + counter_plan[:1])
    panel = stroke([(banner_x - .67, banner_y, 1.07), (banner_x + .67, banner_y, 1.07),
                    (banner_x + .67, banner_y, 2.79), (banner_x - .67, banner_y, 2.79)])
    veneer = rounded_outline(cx, cy, 1.75, .62, .13, .93)
    foot = [(x, y, .277) for x, y, z in veneer]
    apron = stroke(veneer[26:] + list(reversed(foot[26:]))) + 'Z'
    reeds = ''.join(stroke([(cx-.72+i*.09, cy-.31, .29), (cx-.72+i*.09, cy-.31, .90)]) for i in range(17))
    lamp = stroke([(-1.20, 1.77, 2.46), (.385, 1.77, 2.46)])
    lamp_wire = ''.join(stroke([(x, 1.77, 2.48), (x, 1.77, 3.3)]) for x in (-1.18,.36))

    # Project three corners of the actual printed mark onto the drawing.
    # The affine map differs from a full homography by less than a pen width
    # across this small, almost frontal piece of paper.
    svg_mark = ElementTree.parse(mark_file).getroot()
    mark_path = svg_mark.find('{http://www.w3.org/2000/svg}path').get('d')
    def screen(x, z):
        uv = world_to_camera_view(scene, camera, Vector((x, banner_y - .014, z)))
        return Vector((uv.x * width, (1 - uv.y) * height))
    top_left = screen(banner_x - .485, 2.37)
    dx = (screen(banner_x + .485, 2.37) - top_left) / 1938
    dy = (screen(banner_x - .485, 1.63) - top_left) / 1512
    origin = top_left - dx * 141 - dy * 69
    transform = ' '.join(f'{v:.5f}' for v in (dx.x, dx.y, dy.x, dy.y, origin.x, origin.y))
    connections = ''.join(stroke([front_point, back_point]) for front_point, back_point in
                          zip((frame[0][0], frame[0][-1], frame[0][25], frame[1][-1]),
                              (frame[2][0], frame[2][-1], frame[2][25], frame[3][-1])))
    dims = ticked_dimension((-2.15, .12, 0), (2.15, .12, 0), "4 300 mm", height * .064)
    # The width and height annotations do not compete on the narrow portrait sheet.
    if width > height:
        dims += ticked_dimension((-2.15, .12, .01), (-2.15, .12, 3.38), "3 380", -width * .085)
    plan = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
<defs><pattern id="h" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(32)"><path d="M0 0V7" stroke="#904d3e" stroke-opacity=".38" stroke-width=".8"/></pattern></defs>
<g fill="none" stroke="#945e4a" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
<path opacity=".56" d="{ground}Z"/>
<path d="{panel}Z" fill="#f0dfc4" stroke-opacity=".58"/>
<path d="{mark_path}" transform="matrix({transform})" stroke="none" fill="#976957" fill-opacity=".6"/>
<path d="{apron}" fill="#f0dfc4"/><path d="{reeds}" stroke-width=".7" opacity=".55"/>
<path d="{desk}Z" fill="#f0dfc4"/>
<path d="{face}" fill="#e9d3b7" stroke="none"/>
<path d="{side}" fill="url(#h)"/>
<path d="{lamp_wire}" stroke-width=".7" opacity=".55"/><path d="{lamp}" stroke-width="2.3" opacity=".65"/>
<path d="{front}" stroke="#602b25" stroke-width="2.6"/>
<path d="{inner}" stroke="#602b25" stroke-width="1.9"/>
<path d="{rear}{inside}" stroke-width="1.1" opacity=".7"/>
<path d="{connections}" opacity=".7"/>
<g stroke="#956959" stroke-width=".86">{dims}</g>
</g></svg>"""
    (destination / f"plan{suffix}.svg").write_text(plan)


with tempfile.TemporaryDirectory(prefix="mestier-seuil-") as temporary:
    work = Path(temporary)
    render("", 1280, 960, (-2.6, -7.1, 1.83), (.04, .70, 1.66), 41, work)
    render("-mobile", 720, 960, (-1.47, -7.55, 1.75), (0, .43, 1.64), 55, work)
