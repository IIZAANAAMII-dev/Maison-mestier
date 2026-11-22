"""Photograph the live Three sculpture with a CPU renderer; never substitute a new object.

node --experimental-strip-types art/render-paper-export.mjs --out /tmp/mestier-paper.json
blender -b -t 6 -P art/render-paper-fallback.py -- --input /tmp/mestier-paper.json --output /tmp/mestier-paper-renders
"""
import argparse
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--input", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--frames", default="all")
parser.add_argument("--samples", type=int, default=64)
parser.add_argument("--scale", type=int, default=100)
parser.add_argument("--webp-output", type=Path)
parser.add_argument("--skip-existing", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
data = json.loads(args.input.read_text())
args.output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.adaptive_min_samples = 8
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 3
scene.cycles.sample_clamp_indirect = 4
scene.render.resolution_x = data["width"]
scene.render.resolution_y = data["height"]
scene.render.resolution_percentage = args.scale
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.use_persistent_data = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.15

# Three is Y-up; Blender is Z-up. Camera local axes agree between both renderers.
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
CI = C.inverted()
def matrix(flat): return Matrix([[flat[row + column * 4] for column in range(4)] for row in range(4)])
def point(coords): return (coords[0], -coords[2], coords[1])
def color(code):
    channels = [int(code[k:k + 2], 16) / 255 for k in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels) + (1,)

def material(name, pigment, roughness, metal=0, grain=0):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = color(pigment)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Coat Weight"].default_value = 0.10 if metal else 0.03
    if grain:
        noise = result.node_tree.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 190
        noise.inputs["Detail"].default_value = 2
        bump = result.node_tree.nodes.new("ShaderNodeBump")
        bump.inputs["Distance"].default_value = grain * 0.12
        bump.inputs["Strength"].default_value = 0.10
        result.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        result.node_tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return result

paper = material("Ivory paper · same live face", "f1eadb", 0.57, 0.02, 0.006)
brass = material("Brushed brass · reverse", "af8b4e", 0.26, 0.91, 0.002)
edge = material("Cut gold edge", "c4aa78", 0.32, 0.70)
stone = material("Fine limestone", "d6ccbb", 0.84, grain=0.016)
floor_mat = material("Warm studio ground", "e8e2d5", 0.95)
floor_mat.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.12
seam_mat = material("Plinth seam", "b9ae98", 0.78)

leaves = []
for index, source in enumerate(data["geometry"]):
    positions = [point(source["positions"][i:i + 3]) for i in range(0, len(source["positions"]), 3)]
    faces = [source["indices"][i:i + 3] for i in range(0, len(source["indices"]), 3)]
    geo = bpy.data.meshes.new(f"Actual Three leaf {index:02}")
    geo.from_pydata(positions, [], faces)
    geo.update()
    for mat in (paper, brass, edge): geo.materials.append(mat)
    for group in source["groups"]:
        for face in range(group["start"] // 3, (group["start"] + group["count"]) // 3):
            geo.polygons[face].material_index = group["materialIndex"]
    for polygon in geo.polygons: polygon.use_smooth = True
    obj = bpy.data.objects.new(f"Sculpture · sheet {index:02}", geo)
    bpy.context.collection.objects.link(obj)
    obj.shape_key_add(name="Rest")
    expanded = obj.shape_key_add(name="Deployed")
    expanded.data.foreach_set("co", [v for i in range(0, len(source["expanded"]), 3) for v in point(source["expanded"][i:i + 3])])
    leaves.append(obj)

root = bpy.data.objects.new("Animated plinth", None)
bpy.context.collection.objects.link(root)
def cylinder(name, radius, depth, z, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=112, radius=radius, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    obj.parent = root
    obj.scale = (1.13, 0.66, 1)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Stone edge", "BEVEL")
    bevel.width = 0.018; bevel.segments = 3
    for p in obj.data.polygons: p.use_smooth = len(p.vertices) == 4
    return obj

cylinder("Limestone plinth", 2.575, 0.18, 0.07, stone)
cylinder("Lower seam", 2.57, 0.015, -0.018, seam_mat)
ground_mesh = bpy.data.meshes.new("Studio ground")
ground_mesh.from_pydata([(-80, -80, -0.03), (80, -80, -0.03), (80, 6.5, -0.03), (-80, 6.5, -0.03)], [], [(0, 1, 2, 3)])
ground_mesh.update(); ground_mesh.materials.append(floor_mat)
ground = bpy.data.objects.new("Studio ground", ground_mesh)
bpy.context.collection.objects.link(ground)

# A curved studio sweep continues the ground into the background without a horizon.
profile = [(6.5, -0.03)]
for step in range(1, 49):
    angle = math.pi * 0.5 * step / 48
    profile.append((6.5 + 8 * math.sin(angle), 8 - 8 * math.cos(angle) - 0.03))
profile.append((14.5, 35))
vertices = [(x, y, z) for y, z in profile for x in (-80, 80)]
faces = [(step * 2, step * 2 + 1, step * 2 + 3, step * 2 + 2) for step in range(len(profile) - 1)]
cyc = bpy.data.meshes.new("Seamless cyclorama")
cyc.from_pydata(vertices, [], faces); cyc.update(); cyc.materials.append(floor_mat)
for poly in cyc.polygons: poly.use_smooth = True
cyclorama = bpy.data.objects.new("Seamless cyclorama", cyc)
bpy.context.collection.objects.link(cyclorama)

world = bpy.data.worlds.new("Studio bounce")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = color("fff8e9")
world.node_tree.nodes["Background"].inputs[1].default_value = 0.60

def aim(obj, target): obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
def area(name, location, target, power, width, height, pigment):
    source = bpy.data.lights.new(name, "AREA")
    source.energy = power; source.shape = "RECTANGLE"; source.size = width; source.size_y = height
    source.color = color(pigment)[:3]
    obj = bpy.data.objects.new(name, source)
    bpy.context.collection.objects.link(obj)
    obj.location = point(location); aim(obj, point(target))

area("Large cool softbox", (-4.5, 4.5, 6), (0, 2.5, 0), 1800, 7, 8, "ffffff")
area("Warm rim", (5, 5, -4), (0, 2.6, 0), 1500, 5, 6, "ffe5b5")
source = bpy.data.lights.new("Sun through studio", "SUN")
source.energy = 2.0; source.angle = math.radians(5)
source.color = color("fff5e2")[:3]
sun = bpy.data.objects.new("Sun through studio", source)
bpy.context.collection.objects.link(sun)
sun.location = point((-4.4, 8.5, 5.3)); aim(sun, point((0, 2.1, 0)))

camera_data = bpy.data.cameras.new("Shared Three camera")
camera = bpy.data.objects.new("Shared Three camera", camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
camera_data.sensor_fit = "VERTICAL"
camera_data.sensor_height = 24
camera_data.lens = 24 / (2 * math.tan(math.radians(data["fov"]) / 2))
camera_data.clip_start = 0.1; camera_data.clip_end = 90
ordered = data["frames"] if args.frames == "all" else [data["frames"][int(number)] for number in args.frames.split(",")]
if args.webp_output: (args.webp_output / "frames").mkdir(parents=True, exist_ok=True)
rendered_poses = {}
for frame in ordered:
    number = frame["frame"]
    image_path = args.output / f"frame-{number:03}.png"
    pose_key = json.dumps({key: frame[key] for key in ("camera", "object", "leaves")}, sort_keys=True)
    duplicate = rendered_poses.get(pose_key)
    if duplicate and duplicate != image_path:
        shutil.copyfile(duplicate, image_path)
    elif not (args.skip_existing and image_path.exists()):
        camera.matrix_world = C @ matrix(frame["camera"])
        root.matrix_world = C @ matrix(frame["object"]) @ CI
        for leaf, pose in zip(leaves, frame["leaves"]):
            leaf.matrix_world = C @ matrix(pose["matrix"]) @ CI
            leaf.data.shape_keys.key_blocks["Deployed"].value = pose["morph"]
        bpy.context.view_layer.update()
        scene.render.filepath = str(image_path)
        bpy.ops.render.render(write_still=True)
    rendered_poses[pose_key] = image_path
    print(f"MAISON_FRAME_READY {number} {image_path}", flush=True)
    if args.webp_output:
        destination = args.webp_output / "frames" / f"frame-{number:03}.webp"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-threads", "1", "-filter_threads", "1", "-y", "-i", str(image_path),
                        "-vf", "nlmeans=s=3:p=5:r=11,hqdn3d=3:2:0:0", "-c:v", "libwebp", "-quality", "85", str(destination)], check=True)
        if number == 0: shutil.copyfile(destination, args.webp_output / "poster.webp")
        print(f"MAISON_WEBP_READY {number} {destination}", flush=True)
