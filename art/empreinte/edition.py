"""Develop the print die on its ink field. Requires Pillow, NumPy, SciPy and FFmpeg.

python art/empreinte/edition.py --poster
python art/empreinte/edition.py --film
"""

import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

INK = np.array([25, 25, 24], np.float32)
ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public/empreinte"


def composite(source, transparent=False):
    raw = np.asarray(Image.open(source).convert("RGBA"), np.float32)
    rgb = raw[:, :, :3]
    alpha = raw[:, :, 3:4] / 255
    h, w = alpha.shape[:2]
    # A range-limited spatial average retains the bevel and directional grind.
    padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
    smooth = np.zeros_like(rgb)
    weight_sum = np.zeros((h, w, 1), np.float32)
    for y in range(3):
        for x in range(3):
            other = padded[y : y + h, x : x + w]
            diff = np.abs(other - rgb).mean(axis=2)
            weight = (1 / (1 + (diff / 19) ** 3))[:, :, None]
            smooth += other * weight
            weight_sum += weight
    smooth /= weight_sum
    soft = gaussian_filter(alpha[:, :, 0], w * 0.019)
    offset_y, offset_x = round(h * 0.023), -round(w * 0.008)
    shadow = np.roll(soft, (offset_y, offset_x), axis=(0, 1))
    shadow[:offset_y, :] = 0
    shadow[:, offset_x:] = 0
    shadow = shadow[:, :, None] * 0.36
    opacity = alpha + shadow * (1 - alpha)
    # The transparent edition contains the real object and its contact shadow.
    if transparent:
        foreground = smooth * alpha / np.maximum(opacity, 0.00001)
        rgba = np.concatenate((foreground, opacity * 255), axis=2)
        return Image.fromarray(np.uint8(np.clip(rgba + 0.5, 0, 255)), "RGBA")
    opaque = smooth * alpha + INK[None, None, :] * (1 - opacity)
    return Image.fromarray(np.uint8(np.clip(opaque + 0.5, 0, 255)), "RGB")


def poster(work):
    filename = ASSETS / "poincon.webp"
    pending = filename.with_suffix(".pending")
    composite(work / "affiche.png", transparent=True).save(pending, "WEBP", quality=91, method=6)
    pending.replace(filename)


def movie(work):
    sources = sorted((work / "frames").glob("[0-9][0-9][0-9].png"))
    if [p.stem for p in sources] != [f"{i:03d}" for i in range(1, 41)]:
        raise ValueError("The native Blender take must contain frames 001 to 040.")
    frames = work / "edition"
    frames.mkdir(exist_ok=True)
    for source in sources:
        target = frames / source.name
        composite(source).save(target, compress_level=2)
    encoded = work / "poincon-export.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-framerate",
            "25",
            "-i",
            str(frames / "%03d.png"),
            "-vf",
            "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,"
            "hqdn3d=3.5:3:1.4:1.3,lutyuv=y=val+1:u=val+1,setparams=range=tv:color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709",
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-pix_fmt",
            "yuv420p",
            "-threads",
            "3",
            "-preset",
            "slow",
            "-crf",
            "24",
            "-g",
            "12",
            "-keyint_min",
            "12",
            "-sc_threshold",
            "0",
            "-bf",
            "2",
            "-color_range",
            "tv",
            "-colorspace",
            "bt709",
            "-color_primaries",
            "bt709",
            "-color_trc",
            "iec61966-2-1",
            "-movflags",
            "+faststart",
            "-an",
            str(encoded),
        ],
        check=True,
    )
    target = ASSETS / "poincon.mp4"
    pending = target.with_suffix(".pending")
    pending.write_bytes(encoded.read_bytes())
    pending.replace(target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, default=Path("/tmp/mestier-poincon"))
    parser.add_argument("--poster", action="store_true")
    parser.add_argument("--film", action="store_true")
    args = parser.parse_args()
    ASSETS.mkdir(parents=True, exist_ok=True)
    if args.poster or not args.film:
        poster(args.work)
    if args.film or not args.poster:
        movie(args.work)
