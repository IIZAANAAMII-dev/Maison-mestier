"""Render the entrance and its measured elevation from the same cameras.

blender -b -t 8 -P art/portique/seuil.py
"""

from math import cos, pi, sin
from pathlib import Path
import subprocess
import tempfile

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
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
environment.inputs["Strength"].default_value = .24


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
lacquer = surface("Laque Maison Mestier", (.145, .021, .019), .36, .026, .27)
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


box("Dalle continue", (32, 32, .28), (0, 0, -.16), concrete)
box("Mur de fond", (20, .27, 6.5), (0, 5.23, 3.19), plaster)
box("Aile droite", (.32, 14, 6.4), (5, -.45, 3.17), lime)
box("Cloison en retour", (.22, 5.1, 4.3), (-3.6, 3.25, 2.11), plaster)
box("Sol du pavillon", (4.35, 5.3, .095), (0, 2.16, -.015), lime)
frame = portal("Portique laqué", 2.15, 3.38, .93, .45, .12, .65, lacquer)
portal("Seconde peau du seuil", 1.72, 2.91, .67, .105, 1.16, .21, dark)
portal("Arc en pierre du fond", 1.52, 2.56, .48, .24, 3.44, .37, lime)
box("Comptoir en pierre", (1.52, .65, .92), (.43, 2.21, .515), lime, .105)
box("Chant laqué du comptoir", (1.55, .68, .064), (.43, 2.21, .996), lacquer, .032)
box("Revue posée sur le comptoir", (.42, .28, .025), (.31, 2.26, 1.04), linen, .007)
box("Banquette de l’atelier", (1.24, .48, .46), (-.64, 3.76, .267), dark, .07)

engraving = bpy.data.curves.new("Gravure sur le comptoir", "FONT")
engraving.body = "MAISON MESTIER"
engraving.align_x = "CENTER"
engraving.align_y = "CENTER"
engraving.space_character = 1.18
engraving.size = .092
engraving.extrude = .0008
engraving.materials.append(dark)
signature = bpy.data.objects.new(engraving.name, engraving)
scene.collection.objects.link(signature)
signature.location = (.43, 1.881, .63)
signature.rotation_euler.x = pi / 2

for row in range(7):
    box("Joint de pierre", (7.8, .014, .009), (.22, .04 + row * .77, .005), dark, .001)


def wash(name, position, aim, energy, size, color):
    light = bpy.data.lights.new(name, "AREA")
    light.energy, light.size, light.color = energy, size, color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()


wash("Fenêtre latérale", (-4.9, -3.6, 5), (0, 1, 1.4), 1300, 4, (1, .865, .72))
wash("Lumière derrière le seuil", (-1, 2.6, 4.18), (.12, 3.2, .65), 530, 1.8, (1, .76, .53))
wash("Remplissage froid", (4.45, -1.2, 4.9), (0, 1.6, 1.4), 340, 3, (.84, .88, 1))
daylight = bpy.data.lights.new("Soleil rasant", "SUN")
daylight.energy = 1.75
daylight.angle = .085
day = bpy.data.objects.new(daylight.name, daylight)
scene.collection.objects.link(day)
day.rotation_euler = Vector((.64, .60, -.78)).to_track_quat("-Z", "Y").to_euler()

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
    bpy.ops.render.render(write_still=True)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", str(result), "-filter_threads", "2",
        "-vf", "hqdn3d=3:3:5:5,vaguedenoiser=threshold=7:method=garrote:nsteps=3:type=bayes",
        "-c:v", "libwebp", "-quality", "85",
        str(destination / f"vue{suffix}.webp"),
    ], check=True)

    paths = [project(camera, points, width, height) for points in frame]
    front, aperture = paths[:2]
    lines = "\n".join(f'<path opacity="{opacity}" d="{path}"/>' for path, opacity in zip(paths, (1, .85, .61, .53)))
    start, end = frame[0][0], frame[0][-1]
    joints = [project(camera, [point, (point[0], point[1] + .65, point[2])], width, height) for point in (start, end)]
    plan = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
<path d="{front}{aperture}Z" fill="#a9392a" fill-opacity=".064" fill-rule="evenodd"/>
<g fill="none" stroke="#823627" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round">
{lines}
<path opacity=".4" d="{''.join(joints)}"/>
<path opacity=".37" stroke-dasharray="4 8" d="M{width * .08},{height * .79}H{width * .92} M{width * .5},{height * .13}V{height * .88}"/>
</g></svg>"""
    (destination / f"plan{suffix}.svg").write_text(plan)


with tempfile.TemporaryDirectory(prefix="mestier-seuil-") as temporary:
    work = Path(temporary)
    render("", 1280, 960, (-2.1, -7.0, 1.95), (.06, .46, 1.64), 38, work)
    render("-mobile", 720, 960, (-.85, -7.4, 1.88), (.04, .44, 1.73), 41, work)
