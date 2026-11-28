"""Shoot the exhibition miniature as a three-shot film, always framed for the full set.

blender -b art/portique/portique.blend -t 4 -P art/portique/cahier.py -- --posters
blender -b art/portique/portique.blend -t 4 -P art/portique/cahier.py
"""

import argparse
import math
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector


parser = argparse.ArgumentParser()
parser.add_argument("--posters", action="store_true")
parser.add_argument("--encode-only", action="store_true")
parser.add_argument("--work", type=Path, default=Path("/tmp/mestier-film-maquette"))
parser.add_argument("--scale", type=int, default=100)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
args.work.mkdir(exist_ok=True, parents=True)
output = Path(__file__).resolve().parents[2] / "public/portique"

scene = bpy.context.scene
scene.frame_set(72)
scene.render.engine = "CYCLES"
scene.render.film_transparent = False
scene.cycles.samples = 24 if args.posters else 7
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.sample_clamp_indirect = 2
scene.render.use_persistent_data = True
scene.render.resolution_x, scene.render.resolution_y = (1260, 900) if args.posters else (784, 560)
scene.render.resolution_percentage = args.scale
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 1
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .19
scene.view_settings.exposure = -.22

def material(name, colour, roughness, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (*colour, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    return mat

def set_material(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def bar(name, at, size, mat, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.name, obj.dimensions = name, size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    edge = obj.modifiers.new("Arrondi de finition", "BEVEL")
    edge.width, edge.segments = bevel, 3
    obj.modifiers.new("Normales", "WEIGHTED_NORMAL")
    return obj

scene.objects["Figurine en argile · échelle humaine"].hide_render = True
floor = scene.objects["Cyclorama · capteur d’ombres"]
floor.is_shadow_catcher = False
set_material(floor, material("Fond de prise de vue · grenat", (.089, .020, .026), .63))
lacquer = bpy.data.materials["Rouge cachet · laque satinée"].node_tree.nodes["Principled BSDF"]
lacquer.inputs["Roughness"].default_value = .25
lacquer.inputs["Coat Weight"].default_value = .52
lacquer.inputs["Specular IOR Level"].default_value = .4
metal = material("Laiton satiné", (.46, .294, .147), .31, .76)
flute = material("Chêne · tête de tasseau", (.27, .157, .080), .49)
# Two rows of exhibition joinery stay aligned to the movable desk.
desk = scene.objects["Ensemble · le comptoir"]
for side in (-1, 1):
    for i in range(4):
        obj = bar("Tasseau de retour", (side * (.402 + i * .045), -.368 + i * .003, .676), (.019, .018, .731), flute, .005)
        obj.parent = desk
for side in (-1, 1):
    obj = bar("Joint fin du soubassement", (side * .39, -.367, .676), (.008, .014, .741), metal, .002)
    obj.parent = desk
wall = scene.objects["Ensemble · cloison pivotante"]
# Vertical fluting wraps the right-hand end of the curved back wall.
for i in range(16):
    t = .74 + i * .015
    u = 1 - t
    x = 3*u*u*t*1.04 + 3*u*t*t*1.92 + t**3*2.66
    y = 3*u*u*t*.12 + 3*u*t*t*.25 - t**3*.61
    h = 2.56 - .38*t**4 + .027*math.sin(math.pi*t) - .22
    obj = bar("Parement en tasseaux", (x-.025, y-.056, .204+h/2), (.022, .028, h), flute, .006)
    obj.parent = wall

def light(name, at, aim, energy, color, width, height):
    obj = scene.objects[name]
    obj.location = at
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()
    obj.data.energy, obj.data.color = energy, color
    obj.data.shape = "RECTANGLE"
    obj.data.size, obj.data.size_y = width, height

light("Fenêtre diffuse à gauche", (-4.5, -3.4, 6.2), (0, .4, 1.1), 1060, (1, .86, .71), 2.7, 4.2)
light("Éclairage doux du vestibule", (3.7, -4.2, 4.6), (0, 0, 1.4), 285, (.88, .93, 1), 4.2, 2.8)
light("Long reflet au dos de la laque", (-.8, 4.1, 5.5), (0, 0, 1), 1090, (1, .84, .68), 5.0, 1.55)
camera_data = bpy.data.cameras.new("Optique de l’atelier")
camera = bpy.data.objects.new(camera_data.name, camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.sensor_fit = "HORIZONTAL"

# Each movement is a short physical camera arc. Hard cuts join the three shots.
shots = [
    ((4.05,-10.2,5.0), (2.85,-9.8,4.65), (.03,0,1.35), (.05,.03,1.34), 47, 47),
    ((-.02,-3.82,1.94), (-.43,-3.38,1.86), (-.65,-.90,.75), (-.64,-.87,.84), 44, 44),
    ((2.50,-5.48,2.33), (1.46,-5.60,2.17), (.17,.46,1.89), (.23,.60,1.75), 29, 32),
]
length = 40

def pose(shot, t):
    start, end, target, final, lens0, lens1 = shots[shot]
    camera.location = Vector(start).lerp(Vector(end), t)
    look = Vector(target).lerp(Vector(final), t)
    camera.rotation_euler = (look - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.lens = lens0*(1-t) + lens1*t

def render(file):
    scene.render.filepath = str(file)
    bpy.ops.render.render(write_still=True)

def encode(*opts):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-threads", "2", *map(str, opts)], check=True)

if args.posters:
    for shot in range(3):
        pose(shot, .05)
        still = args.work / f"pose-{shot}.png"
        render(still)
        if shot == 0:
            encode("-i", still, "-vf", "hqdn3d=4:3:0:0,scale=1008:720:flags=lanczos",
                "-c:v", "libwebp", "-quality", 82, "-compression_level", 6, output / "maquette.webp")
else:
    for number in range(length * len(shots)):
        file = args.work / f"f{number:03d}.png"
        if file.exists():
            continue
        if args.encode_only:
            raise FileNotFoundError(file)
        pose(number // length, (number % length) / (length - 1))
        render(file)
    # Composite the open studio horizon in the visitor-height shot on the same
    # dark sweep as the first two images. The miniature is fully opaque.
    size = f"{scene.render.resolution_x * args.scale // 100}x{scene.render.resolution_y * args.scale // 100}"
    grade = (
        "[0:v]split[first][last];"
        "[first]trim=end_frame=80,setpts=PTS-STARTPTS,format=yuv444p[front];"
        "[last]trim=start_frame=80,setpts=PTS-STARTPTS,format=rgba,colorkey=0x67696d:.022:.026[cut];"
        f"color=c=0x211a1c:s={size}:r=20[back];"
        "[back][cut]overlay=shortest=1:format=yuv444,median=radius=1:planes=1,format=yuv444p[close];"
        "[front][close]concat=n=2:v=1:a=0,hqdn3d=7:5:6:4,"
        "vaguedenoiser=threshold=17:nsteps=4:method=garrote:type=bayes,"
        "scale=in_range=tv:out_range=tv:out_color_matrix=bt709,format=yuv420p[film]"
    )
    pending = output / "maquette.pending.mp4"
    encode("-framerate", 20, "-i", args.work / "f%03d.png", "-filter_complex_threads", 2,
        "-filter_complex", grade, "-map", "[film]", "-c:v", "libx264", "-threads", 2,
        "-crf", 26, "-preset", "slow", "-movflags", "+faststart", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-colorspace", "bt709", "-color_trc", "bt709",
        "-an", pending)
    pending.replace(output / "maquette.mp4")
