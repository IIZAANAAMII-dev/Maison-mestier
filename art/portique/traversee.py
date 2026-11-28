"""Render the exhibition model from visitor height with Blender 4.3.

For each view, render and encode from the repository root:

    blender -b art/portique/portique.blend -t 8 --python-exit-code 1 -P art/portique/traversee.py -- --view wide
    blender -b art/portique/portique.blend -t 8 --python-exit-code 1 -P art/portique/traversee.py -- --view tall

Use --preview for a contact sheet's three poses, or --encode-only to reuse a complete render.
The final files are encoded with FFmpeg. The Blender source is left untouched.
"""

import argparse
import math
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector


REPOSITORY = Path(__file__).resolve().parents[2]
VIEWS = {"wide": (896, 704), "tall": (640, 800)}
FRAMES = 42
FPS = 24

parser = argparse.ArgumentParser()
parser.add_argument("--view", choices=VIEWS, default="wide")
parser.add_argument("--work", type=Path, default=Path("/tmp/maison-mestier-traversee"))
mode = parser.add_mutually_exclusive_group()
mode.add_argument("--preview", action="store_true")
mode.add_argument("--encode-only", action="store_true")
parser.add_argument("--samples", type=int, default=14)
parser.add_argument("--resolution-percent", type=int, default=73)
parser.add_argument("--crf", type=int, default=27)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])

scene = bpy.context.scene
scene.frame_set(72)
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.sample_clamp_indirect = 2
scene.render.use_persistent_data = True
scene.render.film_transparent = False
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 2
scene.render.resolution_x, scene.render.resolution_y = VIEWS[args.view]
scene.render.resolution_percentage = 43 if args.preview else args.resolution_percent
scene.view_settings.exposure = .02


def plaster(name, dark, light, grain):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = .84
    texture = nodes.new("ShaderNodeTexCoord")
    haze = nodes.new("ShaderNodeTexNoise")
    haze.inputs["Scale"].default_value = 3.8
    haze.inputs["Detail"].default_value = 2.1
    links.new(texture.outputs["Object"], haze.inputs["Vector"])
    scale = nodes.new("ShaderNodeValToRGB")
    scale.color_ramp.elements[0].position = .24
    scale.color_ramp.elements[0].color = (*dark, 1)
    scale.color_ramp.elements[1].position = .79
    scale.color_ramp.elements[1].color = (*light, 1)
    links.new(haze.outputs["Fac"], scale.inputs["Fac"])
    links.new(scale.outputs["Color"], shader.inputs["Base Color"])
    micro = nodes.new("ShaderNodeTexNoise")
    micro.inputs["Scale"].default_value = 88
    links.new(texture.outputs["Object"], micro.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = grain
    bump.inputs["Distance"].default_value = .013
    links.new(micro.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return material


def wall(name, size, center, material, bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    edge = obj.modifiers.new("Arête de pierre", "BEVEL")
    edge.width = bevel
    edge.segments = 2
    obj.modifiers.new("Normales du parement", "WEIGHTED_NORMAL")
    return obj


floor_surface = plaster("Pierre · circulation", (.40, .324, .245), (.50, .423, .337), .32)
clay = plaster("Enduit · galerie", (.56, .441, .333), (.69, .565, .444), .26)
stone = plaster("Calcaire · baies", (.65, .533, .417), (.73, .612, .489), .22)
floor = scene.objects["Cyclorama · capteur d’ombres"]
floor.is_shadow_catcher = False
floor.data.materials.clear()
floor.data.materials.append(floor_surface)

# The plinth keeps its existing outline. These distant walls establish a room
# behind the stand and leave the left side open to the atelier window.
wall("Fond de galerie", (24, .20, 10.4), (0, 4.65, 5.18), clay)
wall("Retour de galerie", (.24, 12.6, 10.4), (5.82, -.6, 5.18), clay)
wall("Plinthe du fond", (24, .065, .19), (0, 4.52, .095), stone)
for x in (-5.76, -3.55, 3.68, 5.65):
    wall("Pile de la galerie", (.27, .49, 10.39), (x, 4.40, 5.195), stone, .017)
for height in (2.73, 5.1):
    wall("Joint du parement", (23.8, .032, .028), (0, 4.535, height), stone, .004)

sculpture = scene.objects.get("Figurine en argile · échelle humaine")
if sculpture:
    # The empty exposure lets the viewer read the clearances and sight lines.
    sculpture.hide_render = True

daylight = scene.objects["Fenêtre diffuse à gauche"]
daylight.location = (-4.9, -3.55, 6.3)
daylight.rotation_euler = (Vector((-.6, .25, 1.3)) - daylight.location).to_track_quat("-Z", "Y").to_euler()
daylight.data.energy = 1450
daylight.data.color = (1, .91, .77)
daylight.data.size, daylight.data.size_y = 3.0, 5.4
scene.objects["Éclairage doux du vestibule"].data.energy = 275
rim = scene.objects["Long reflet au dos de la laque"]
rim.location = (1.20, 3.0, 4.7)
rim.rotation_euler = (Vector((0, 0, 2)) - rim.location).to_track_quat("-Z", "Y").to_euler()
rim.data.energy = 385
rim.data.color = (1, .83, .67)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .23

camera_data = bpy.data.cameras.new("Travelling · hauteur du regard")
camera_data.sensor_fit = "HORIZONTAL"
camera_data.clip_start = .055
camera = bpy.data.objects.new(camera_data.name, camera_data)
scene.collection.objects.link(camera)
scene.camera = camera


def aim_at(frame):
    weight = frame / (FRAMES - 1)
    travel = weight * weight * (3 - 2 * weight)
    if args.view == "wide":
        entry = Vector((2.33, -7.36, 1.89))
        focus = Vector((.15, .11, 1.59))
        lens_start, lens_end = 37, 22
    else:
        entry = Vector((1.18, -8.06, 1.90))
        focus = Vector((.09, .04, 1.60))
        lens_start, lens_end = 36, 20
    camera.location = entry.lerp(Vector((.34, -.31, 1.76)), travel)
    target = focus.lerp(Vector((.29, 1.45, 1.57)), travel)
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.lens = lens_start + (lens_end - lens_start) * travel


def ffmpeg(*arguments):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, arguments)], check=True)


work = args.work / args.view / ("preview" if args.preview else "frames")
work.mkdir(parents=True, exist_ok=True)
if not args.encode_only:
    for index in (0, FRAMES // 2, FRAMES - 1) if args.preview else range(FRAMES):
        aim_at(index)
        scene.render.filepath = str(work / f"{index:03d}.png")
        bpy.ops.render.render(write_still=True)

if not args.preview:
    output = REPOSITORY / "public/portique"
    suffix = "-mobile" if args.view == "tall" else ""
    width, height = VIEWS[args.view]
    film = work / "traversee.mp4"
    ffmpeg(
        "-framerate", FPS, "-i", work / "%03d.png", "-vf",
        "hqdn3d=3.5:3:2.5:2,vaguedenoiser=threshold=15:method=garrote:nsteps=4:type=bayes,"
        f"scale={width}:{height}:flags=lanczos:out_color_matrix=bt709,format=yuv420p",
        "-c:v", "libx264", "-threads", 3, "-profile:v", "high", "-g", 6, "-keyint_min", 6,
        "-sc_threshold", 0, "-bf", 0, "-preset", "slow", "-crf", args.crf,
        "-color_primaries", "bt709", "-colorspace", "bt709", "-color_trc", "iec61966-2-1",
        "-color_range", "tv", "-movflags", "+faststart", "-an", film,
    )
    for name, index in (("approche", 0), ("passage", FRAMES - 1)):
        still = work / f"{name}.webp"
        ffmpeg("-i", film, "-vf", rf"select=eq(n\,{index})", "-frames:v", 1, "-c:v", "libwebp", "-quality", 90, still)
        (output / f"{name}{suffix}.webp").write_bytes(still.read_bytes())
    (output / f"traversee{suffix}.mp4").write_bytes(film.read_bytes())
