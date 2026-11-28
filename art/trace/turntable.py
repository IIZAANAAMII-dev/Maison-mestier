"""Three contact sheets preserve horizontal inspection when WebGL is unavailable.

blender -b art/trace/le-trait.blend -t 3 -P art/trace/turntable.py
"""

from math import cos, radians, sin
from pathlib import Path
import subprocess
import tempfile

import bpy
from mathutils import Vector

public = Path(__file__).resolve().parents[2] / "public/trace"
scene = bpy.context.scene
scene.frame_set(60)
scene.render.resolution_x, scene.render.resolution_y = 432, 320
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.use_persistent_data = True
scene.cycles.samples = 6
scene.cycles.max_bounces = 3
floor = next(obj for obj in scene.objects if obj.name.startswith("Cyclorama"))
floor.is_shadow_catcher = False
optics = bpy.data.cameras.new("Photographie de rotation")
camera = bpy.data.objects.new(optics.name, optics)
scene.collection.objects.link(camera)
scene.camera = camera
views = [
    ("ensemble", (0, 0.36, 1.47), (5.1, -9.8, 4.9), 51, list(range(0, 360, 15)), (6, 4)),
    ("accueil", (-0.72, -0.23, 1.03), (-2.5, -4.35, 2.13), 73, list(range(-30, 31, 10)), (4, 2)),
    ("matieres", (0.99, 1.85, 1.62), (0.62, 0.12, 1.57), 49, list(range(-30, 31, 10)), (4, 2)),
]
with tempfile.TemporaryDirectory() as directory:
    for name, target, eye, lens, angles, (cols, rows) in views:
        direction = Vector(eye) - Vector(target)
        optics.lens = lens
        for index, degrees in enumerate(angles):
            a = radians(degrees)
            offset = Vector((cos(a)*direction.x - sin(a)*direction.y, sin(a)*direction.x + cos(a)*direction.y, direction.z))
            camera.location = Vector(target) + offset
            camera.rotation_euler = (-offset).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = str(Path(directory) / f"{name}-{index:02}.png")
            bpy.ops.render.render(write_still=True)
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(Path(directory) / (name + "-%02d.png")),
            "-vf", f"hqdn3d=5:4:0.001:0.001,median=radius=1,bilateral=sigmaS=1.65:sigmaR=0.09,tile={cols}x{rows}", "-c:v", "libwebp",
            "-quality", "76", "-compression_level", "6", "-frames:v", "1",
            str(public / ("rotation-" + name + ".webp")),
        ], check=True)
