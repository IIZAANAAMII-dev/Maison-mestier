"""Combine neighboring exposures on the surfaces of the original Blender set.

The camera moves through a static scene. The camera matrices and scene depths
from traversee.py let us register each exposure to the current frame before
averaging its illumination samples, preserving both real texture and parallax.
"""

import argparse
from functools import lru_cache
import os
from pathlib import Path

os.environ["OPENBLAS_NUM_THREADS"] = "1"

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

parser = argparse.ArgumentParser()
parser.add_argument("work", type=Path)
parser.add_argument("--from-frame", default=0, type=int)
parser.add_argument("--through", default=59, type=int)
args = parser.parse_args()
work = args.work
output = work / "registered"
output.mkdir(exist_ok=True)
with np.load(work / "optics.npz") as data:
    depth = data["depth"].astype(np.float32)
    camera = data["matrix"]
    focal = data["focal"]

with Image.open(work / "frame-000.png") as first:
    width, height = first.size

last = len(depth) - 1
stride = 4
y, x = np.mgrid[:height, :width].astype(np.float32)


@lru_cache(maxsize=7)
def exposure(index):
    if index in (0, last):
        still = "entree-retina.png" if index == 0 else "empreinte-retina.png"
        with Image.open(work / still) as image:
            # An endpoint is a separately rendered, higher-sample exposure.
            return np.asarray(image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS))

    with Image.open(work / f"frame-{index:03d}.png") as image:
        return np.asarray(image.convert("RGB"))


for index in range(args.from_frame, args.through + 1):
    dest = output / f"frame-{index:03d}.png"
    if dest.exists():
        continue
    if index in (0, last):
        Image.fromarray(exposure(index)).save(dest, compress_level=1)
        continue

    z = np.repeat(np.repeat(depth[index], stride, axis=0), stride, axis=1)[:height, :width]
    camera_x = (x + .5 - width / 2) * z / focal[index]
    camera_y = (height / 2 - y - .5) * z / focal[index]
    local = np.stack((camera_x, camera_y, -z)).astype(np.float32).reshape(3, -1)
    world = camera[index, :3, :3] @ local + camera[index, :3, 3:4]
    total = exposure(index).astype(np.float32)
    total_weight = np.ones((height, width), np.float32)

    for neighbor in range(max(0, index - 2), min(last + 1, index + 3)):
        if neighbor == index:
            continue
        camera_position = camera[neighbor, :3, 3:4]
        at = camera[neighbor, :3, :3].T @ (world - camera_position)
        distance = -at[2].reshape(height, width)
        u = (at[0].reshape(height, width) * focal[neighbor] / distance + width / 2 - .5).astype(np.float32)
        v = (-at[1].reshape(height, width) * focal[neighbor] / distance + height / 2 - .5).astype(np.float32)

        visible = (u >= 0) & (u < width - 1) & (v >= 0) & (v < height - 1) & (distance > 0)
        col = np.clip((u / stride).astype(int), 0, depth.shape[2] - 1)
        row = np.clip((v / stride).astype(int), 0, depth.shape[1] - 1)
        depth_error = abs(depth[neighbor, row, col] - distance)
        # A neighboring surface that masks the point must not bleed across its edge.
        weight = visible * np.clip(1 - depth_error / (.025 + .022 * distance), 0, 1).astype(np.float32)
        weight *= .85 if abs(neighbor - index) == 1 else .62
        if neighbor in (0, last):
            weight *= 3

        sample = exposure(neighbor)
        coords = np.stack((v, u))
        for channel in range(3):
            aligned = map_coordinates(sample[:, :, channel], coords, order=1, mode="nearest", prefilter=False)
            total[:, :, channel] += aligned * weight
        total_weight += weight

    frame = (total / total_weight[:, :, None]).round().clip(0, 255).astype(np.uint8)
    Image.fromarray(frame).save(dest, compress_level=1)
