"""Composite the Blender shadow pass on #f4f0e7 and prepare the web editions.

Uses Pillow, NumPy and SciPy. FFmpeg with libx264 writes indexed H.264 clips.
"""

import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

parser = argparse.ArgumentParser()
parser.add_argument("--work", type=Path, default=Path("/tmp/mestier-trace"))
parser.add_argument("--view", choices=["sculpture", "sculpture-mobile", "stand", "pli", "wide", "tall"])
options = parser.parse_args()
work = options.work
assets = Path(__file__).resolve().parents[2] / "public/trace"
assets.mkdir(parents=True, exist_ok=True)
paper = np.array([244, 240, 231], dtype=np.float32)
shadow_ink = np.array([84, 68, 50], dtype=np.float32)


def composite(path, transparent=False):
    image = np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32)
    rgb = image[:, :, :3]
    coverage = image[:, :, 3] / 255
    # Cycles gives a black RGBA shadow catcher and straight colour on geometry.
    # Filtering them separately retains the extremely narrow sheet edge.
    object_pixel = rgb.max(axis=2) > 18
    shadow_zone = (~object_pixel).astype(np.float32)
    softness = max(2.2, image.shape[1] / 161)
    weights = gaussian_filter(shadow_zone, softness)
    shadow = gaussian_filter(coverage * shadow_zone, softness) / np.maximum(0.01, weights)
    # Remove the weak stochastic World occlusion on the distant floor.
    shadow = np.clip((shadow - 0.072) / 0.928, 0, 1) ** 1.13
    h, w = coverage.shape
    yy, xx = np.ogrid[:h, :w]
    # Leave the last edge of the photographic studio seamlessly in paper.
    px = np.minimum(xx, w - 1 - xx) / max(12, 0.12 * w)
    py = np.minimum(yy, h - 1 - yy) / max(12, 0.09 * h)
    fade = np.clip(np.minimum(px, py), 0, 1)
    fade = fade * fade * (3 - 2 * fade)
    shadow *= fade
    background = paper[None, None, :] + (shadow_ink - paper)[None, None, :] * shadow[:, :, None] * 0.68
    # A 3×3 range-aware pass removes sampling grain on broad lacquer without
    # softening its profile, specular breaks or the small letters on the kiosk.
    padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
    smooth = np.zeros_like(rgb)
    mass = np.zeros((h, w, 1), np.float32)
    for y in range(3):
        for x in range(3):
            neighbor = padded[y : y + h, x : x + w]
            dist = np.abs(neighbor - rgb).mean(axis=2)
            weight = (1 / (1 + (dist / 18) ** 3)) * (1.0 if x == 1 and y == 1 else 0.82)
            smooth += neighbor * weight[:, :, None]
            mass += weight[:, :, None]
    smooth /= mass
    alpha = np.where(object_pixel, coverage, 0)[:, :, None]
    if transparent:
        shaded = shadow[:, :, None] * 0.68
        matte = alpha + shaded * (1 - alpha)
        pigment = smooth * alpha + shadow_ink[None, None, :] * shaded * (1 - alpha)
        straight = pigment / np.maximum(matte, 0.00001)
        rgba = np.concatenate((straight, matte * 255), axis=2)
        return Image.fromarray(np.uint8(np.clip(rgba + 0.5, 0, 255)), "RGBA")
    output = smooth * alpha + background * (1 - alpha)
    return Image.fromarray(np.uint8(np.clip(output + 0.5, 0, 255)), "RGB")


def still(name):
    source = work / (name + ".png")
    if not source.is_file():
        raise FileNotFoundError(source)
    target = assets / (name + ".webp")
    pending = target.with_suffix(".pending")
    composite(source, transparent=name.startswith("sculpture")).save(
        pending, "WEBP", quality=90, method=6
    )
    pending.replace(target)


def movie(view):
    paths = sorted((work / view).glob("[0-9][0-9][0-9].png"))
    if [p.stem for p in paths] != [f"{frame:03d}" for frame in range(1, 61)]:
        raise ValueError(f"{view} requires the sequence 001–060")
    frame_dir = work / (view + "-print")
    frame_dir.mkdir(exist_ok=True)
    for path in paths:
        frame = frame_dir / path.name
        if not frame.exists() or frame.stat().st_mtime < path.stat().st_mtime:
            composite(path).save(frame, compress_level=2)
    target = assets / ("montage-mobile.mp4" if view == "tall" else "montage.mp4")
    temporary = frame_dir / "clip.mp4"
    # A closed short GOP permits precise seeking in either direction.
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-framerate",
            "24",
            "-i",
            str(frame_dir / "%03d.png"),
            "-vf",
            # Keep the neutral paper within one decoded RGB level of its CSS paint.
            "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,hqdn3d=3:3:1.2:1.2,"
            "lutyuv=y=val+1:u=val-1,setparams=range=tv:color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709",
            "-c:v",
            "libx264",
            "-threads",
            "3",
            "-pix_fmt",
            "yuv420p",
            "-g",
            "6",
            "-keyint_min",
            "6",
            "-sc_threshold",
            "0",
            "-bf",
            "0",
            "-preset",
            "medium",
            "-crf",
            "19",
            "-color_primaries",
            "bt709",
            "-colorspace",
            "bt709",
            "-color_trc",
            "iec61966-2-1",
            "-color_range",
            "tv",
            "-movflags",
            "+faststart",
            "-an",
            str(temporary),
        ],
        check=True,
    )
    pending = target.with_suffix(".pending")
    pending.write_bytes(temporary.read_bytes())
    pending.replace(target)


if __name__ == "__main__":
    for view in (
        [options.view]
        if options.view
        else ["sculpture", "sculpture-mobile", "stand", "pli", "wide", "tall"]
    ):
        if view in ("wide", "tall"):
            movie(view)
        else:
            still(view)
