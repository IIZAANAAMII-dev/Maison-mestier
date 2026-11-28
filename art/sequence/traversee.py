"""Shoot a continuous approach to the actual monogram in the Maison vestibule.

blender -b -t 8 -P art/sequence/traversee.py -- --format paysage
blender -b -t 8 -P art/sequence/traversee.py -- --format portrait
Use --proof for small first, middle and final-frame proofs in the scratch directory.
Finishing uses ffmpeg and a system Python with NumPy, SciPy and Pillow.
"""

import argparse
from math import pi, sin
from pathlib import Path
import runpy
import subprocess
import sys
from tempfile import gettempdir

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("--format", choices=("portrait", "paysage"), required=True)
parser.add_argument("--proof", action="store_true")
parser.add_argument("--plates-only", action="store_true")
parser.add_argument("--guides-only", action="store_true")
parser.add_argument("--work", type=Path, default=Path(gettempdir()) / "maison-mestier-traversee")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
work = args.work / (("proof-" if args.proof else "") + args.format)
work.mkdir(parents=True, exist_ok=True)
out = root / "public/sequence"
out.mkdir(exist_ok=True)
suffix = "-mobile" if args.format == "portrait" else ""
width, height = (540, 720) if suffix else (1280, 800)
frames = 60

# The same joinery, paper, print and lights as the drawn vestibule.
studio = runpy.run_path(str(root / "art/portique/seuil.py"))
scene = studio["scene"]
camera = studio["camera"]
mark = studio["mark"]
scene.render.resolution_x, scene.render.resolution_y = width, height
scene.render.resolution_percentage = 40 if args.proof else 100
scene.render.image_settings.compression = 1
scene.render.use_persistent_data = True
scene.cycles.samples = 5 if args.proof else 8
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.sample_clamp_indirect = 2
scene.cycles.use_denoising = False
# The portrait sensor looks above the original studio flat. Continue its plaster
# cyclorama to keep the same lit wall behind the curtains in the taller frame.
studio["box"]("Enduit au-dessus du décor", (20, .27, 12), (0, 5.23, 12.437), studio["plaster"], .005)

start = Vector((-1.5, -7.5, 1.78) if suffix else (-2.55, -7.05, 1.76))
end = Vector((.67, 1.96, 1.94))
entry_aim = Vector((0, .58, 1.63))
exit_aim = Vector((.67, 3.64, 1.94))


def pose(t):
    # An off-axis approach makes the return of the portal visibly pass by.
    # The end of the travelling is square to the sheet. Its camera-space SVG
    # projection is therefore also an exact planar projection of the imprint.
    s = t * t * (3 - 2 * t)
    eye = start.lerp(end, s)
    eye.x += .61 * sin(pi * s)
    eye.z += .075 * sin(pi * s)
    aim = entry_aim.lerp(exit_aim, s)
    aim.z += .13 * sin(pi * s)
    # Let the long final strokes breathe inside both a 21:9 full-screen crop
    # and a tall phone crop. This correction starts after the entrance shot.
    clearance = min(1, max(0, (t - .43) / .57))
    clearance = clearance * clearance * (3 - 2 * clearance)
    eye.z += .055 * clearance
    aim.z += .055 * clearance
    camera.location = eye
    camera.rotation_euler = (aim-eye).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = (52 if suffix else 39) * (1-s) + (44 if suffix else 40) * s - (10 if suffix else 7) * clearance
    bpy.context.view_layer.update()


def point(world):
    uv = world_to_camera_view(scene, camera, Vector(world))
    return f"{uv.x * width:.2f},{(1 - uv.y) * height:.2f}"


def svg(name, chains, color, weights):
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="{color}" stroke-linejoin="round" stroke-linecap="round">'
    ]
    for d, weight in zip(chains, weights):
        lines.append(f'<path pathLength="1" stroke-width="{weight}" d="{d}"/>')
    lines.append("</svg>")
    (out / (name + suffix + ".svg")).write_text("\n".join(lines) + "\n")


def projections():
    pose(0)
    contours = ["M" + "L".join(point(p) for p in chain) for chain in studio["frame"][:2]]
    svg("trace", contours, "#fbecd6", (1.7, 1.05))
    pose(1)
    transformed = lambda p: point(mark.matrix_world @ p)
    chains = []
    for spline in mark.data.splines:
        points = list(spline.bezier_points)
        command = "M" + transformed(points[0].co)
        for a, b in zip(points, points[1:] + ([points[0]] if spline.use_cyclic_u else [])):
            command += "C" + " ".join(transformed(p) for p in (a.handle_right, b.handle_left, b.co))
        chains.append(command + ("Z" if spline.use_cyclic_u else ""))
    svg("signe", chains, "#793127", [1.4] * len(chains))


def grade(plates_only=False):
    command = ["python3", str(Path(__file__).with_name("edition.py")), "--format", args.format, "--work", str(work)]
    if plates_only:
        command.append("--plates-only")
    subprocess.run(command, check=True)


if args.guides_only:
    collect = runpy.run_path(str(Path(__file__).with_name("profondeur.py")))["collect_guides"]
    collect(scene, camera, pose, frames, width, height, work)
elif not args.proof:
    projections()
    # The optical axis and the film gate are identical for these higher resolution prints.
    # Fine samples hold up on Retina displays while the camera rests.
    rw, rh = (810, 1080) if suffix else (1440, 900)
    for n, name in ((0, "entree"), (59, "empreinte")):
        still = work / (name + "-retina.png")
        if not still.exists():
            pose(n/59)
            scene.render.resolution_x, scene.render.resolution_y = rw, rh
            scene.cycles.samples = 36
            scene.render.filepath = str(still)
            bpy.ops.render.render(write_still=True)
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.cycles.samples = 8
    if args.plates_only:
        grade(plates_only=True)


for n in (0, 30, frames-1) if args.proof else (() if args.plates_only or args.guides_only else range(frames)):
    image = work / f"frame-{n:03d}.png"
    if image.exists():
        continue
    pose(n/(frames - 1))
    scene.render.filepath = str(image)
    bpy.ops.render.render(write_still=True)

if not args.proof and not args.plates_only and not args.guides_only:
    if not (work/"optics.npz").exists():
        collect = runpy.run_path(str(Path(__file__).with_name("profondeur.py")))["collect_guides"]
        collect(scene, camera, pose, frames, width, height, work)
    grade()
