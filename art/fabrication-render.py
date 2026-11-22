"""CPU-render the very same meshes, UVs and camera matrices used in Three.js."""
import argparse
import json
import math
import pathlib
import shutil
import subprocess
import sys
import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--input", type=pathlib.Path, default=pathlib.Path("/tmp/maison-fabrication/scene.json"))
parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("/tmp/maison-fabrication/renders"))
parser.add_argument("--webp-output", type=pathlib.Path, required=True)
parser.add_argument("--frames", default="all")
parser.add_argument("--samples", type=int, default=32)
parser.add_argument("--scale", type=int, default=100)
parser.add_argument("--skip-existing", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
data = json.loads(args.input.read_text())
args.output.mkdir(parents=True, exist_ok=True)
(args.webp_output / "frames").mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .065
scene.cycles.adaptive_min_samples = 8
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.sample_clamp_indirect = 3
scene.render.resolution_x = data["width"]
scene.render.resolution_y = data["height"]
scene.render.resolution_percentage = args.scale
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = True
scene.render.use_persistent_data = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -.35
scene.render.threads_mode = "FIXED"
scene.render.threads = 8

C = Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
CI = C.inverted()
def matrix(flat): return Matrix([[flat[row + column * 4] for column in range(4)] for row in range(4)])
def point(coords): return (coords[0], -coords[2], coords[1])
def color(hexvalue):
    raw = hexvalue.lstrip("#")
    channels = [int(raw[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels) + (1,)

materials = []
emission = None
for source in data["materials"]:
    m = bpy.data.materials.new(source["name"])
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color(source["color"])
    bsdf.inputs["Roughness"].default_value = source["roughness"]
    bsdf.inputs["Metallic"].default_value = source["metalness"]
    if source["texture"]:
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(source["texture"])
        m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if source["emission"] != "000000":
        bsdf.inputs["Emission Color"].default_value = color(source["emission"])
        bsdf.inputs["Emission Strength"].default_value = source["emissionStrength"]
        emission = bsdf
    # A subtle printed stock grain is present even at grazing angles.
    if source["roughness"] > .6 and "Fond" not in source["name"]:
        noise = m.node_tree.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 195
        bump = m.node_tree.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = .08
        bump.inputs["Distance"].default_value = .008
        m.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        m.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    materials.append(m)

meshes = []
for index, source in enumerate(data["geometries"]):
    vertices = [point(source["positions"][i:i+3]) for i in range(0, len(source["positions"]), 3)]
    faces = [source["indices"][i:i+3] for i in range(0, len(source["indices"]), 3)]
    mesh = bpy.data.meshes.new(f"Three geometry {index}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    if source["uv"]:
        uv = mesh.uv_layers.new(name="Three UV")
        for loop in mesh.loops:
            vi = loop.vertex_index * 2
            uv.data[loop.index].uv = source["uv"][vi:vi+2]
    normals = [point(source["normals"][i:i+3]) for i in range(0, len(source["normals"]), 3)]
    mesh.normals_split_custom_set_from_vertices(normals)
    for polygon in mesh.polygons: polygon.use_smooth = True
    meshes.append(mesh)

objects = []
for source in data["objects"]:
    mesh = meshes[source["geometry"]]
    mesh.materials.clear()
    mesh.materials.append(materials[source["material"]])
    obj = bpy.data.objects.new(source["name"], mesh)
    bpy.context.collection.objects.link(obj)
    if source["name"] == "Sol continu": obj.is_shadow_catcher = True
    objects.append(obj)

world = bpy.data.worlds.new("Une lumière de studio")
scene.world = world
world.use_nodes = True
background = world.node_tree.nodes["Background"]
background.inputs[0].default_value = color("fff4dc")
background.inputs[1].default_value = .55
def aim(obj, target): obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
def area(name, location, target, power, width, height, pigment):
    source = bpy.data.lights.new(name, "AREA")
    source.energy = power; source.shape = "RECTANGLE"; source.size = width; source.size_y = height
    source.color = color(pigment)[:3]
    obj = bpy.data.objects.new(name, source); bpy.context.collection.objects.link(obj)
    obj.location = point(location); aim(obj, point(target)); return source
key = area("Lumière de fenêtre", (-4.5, 8, 6), (0, 1, 0), 1600, 5, 6, "fff6e6")
fill = area("Contrejour", (5, 5, -5), (0, 1.2, 0), 1250, 4, 5, "fff2d6")
front = area("Reflet frontal", (1, 4, 8), (0, 1, 0), 380, 6, 6, "ffffff")
lamps = []
for i, x in enumerate([-1.3, 1.3]):
    lamps.append(area(f"Soirée · lumière {i}", (x, 2.92, .6), (x, .3, -.3), 1, 1.4, .2, "ffb774" if i == 0 else "ff7546"))

camera_data = bpy.data.cameras.new("La caméra de la Maison")
camera = bpy.data.objects.new("La caméra de la Maison", camera_data)
bpy.context.collection.objects.link(camera); scene.camera = camera
camera_data.sensor_fit = "VERTICAL"; camera_data.sensor_height = 24
camera_data.lens = 24 / (2 * math.tan(math.radians(data["fov"]) / 2))
camera_data.clip_start = .05; camera_data.clip_end = 100
if args.frames == "all":
    priority = ["exploded", 0, 8, 16, 24, 32, 40, 48, "format-0", "format-1", "light"] + [f"exploded-{i}" for i in range(1, 8)]
    selected = sorted(data["frames"], key=lambda f: priority.index(f["frame"]) if f["frame"] in priority else 20 + f["frame"])
else:
    selected = [f for name in args.frames.split(",") for f in data["frames"] if str(f["frame"]) == name]
for frame in selected:
    number = frame["frame"]
    slug = f"frame-{number:03}" if isinstance(number, int) else f"variant-{number}"
    image_path = args.output / f"{slug}.png"
    destination = args.webp_output / "frames" / f"{slug}.webp"
    if args.skip_existing and destination.exists(): continue
    camera.matrix_world = C @ matrix(frame["camera"])
    for obj, pose in zip(objects, frame["objects"]): obj.matrix_world = C @ matrix(pose) @ CI
    n = frame["night"]
    background.inputs[1].default_value = .55 * (1 - n) + .05 * n
    key.energy = 1600 * (1 - n) + 60 * n
    fill.energy = 1250 * (1 - n) + 280 * n
    fill.color = color("fff2d6" if n < .4 else "ff6b3e")[:3]
    front.energy = 380 * (1 - n) + 45 * n
    if emission: emission.inputs["Emission Strength"].default_value = frame["emissive"]
    for light, strength in zip(lamps, frame["lamps"]): light.energy = strength * 8
    bpy.context.view_layer.update()
    scene.render.filepath = str(image_path)
    bpy.ops.render.render(write_still=True)
    pending = destination.with_name(destination.stem + ".pending.webp")
    filters = "[0:v]split=2[image][alpha];[alpha]alphaextract,nlmeans=s=10:p=5:r=11,gblur=sigma=0.35[a];[image]format=rgb24,nlmeans=s=5:p=5:r=11,hqdn3d=3:2:0:0[clean];[clean][a]alphamerge"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-threads", "1", "-filter_complex_threads", "1", "-y", "-i", str(image_path), "-filter_complex", filters, "-c:v", "libwebp", "-quality", "86", "-compression_level", "5", str(pending)], check=True)
    pending.replace(destination)
    if number == 0:
        shutil.copyfile(destination, args.webp_output / "poster.pending.webp")
        (args.webp_output / "poster.pending.webp").replace(args.webp_output / "poster.webp")
    print(f"FABRICATION_READY {number} {destination}", flush=True)
