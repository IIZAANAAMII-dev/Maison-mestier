"""Print Cycles RGBA on exact interface paper, then encode frame-accurate web media.

Requires FFmpeg, Pillow, NumPy and SciPy.
"""

import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter


REPO = Path(__file__).resolve().parents[2]
PUBLIC = REPO / "public/portique"
PAPER = np.array([244, 240, 231], dtype=np.float32)
UMBRA = np.array([83, 65, 53], dtype=np.float32)
POSES = {"entree": 1, "pli": 36, "stand": 72}
FPS = 24
COUNT = 72


def composite(source):
    rgba = np.asarray(Image.open(source).convert("RGBA"), dtype=np.float32)
    rgb, coverage = rgba[..., :3], rgba[..., 3] / 255
    height, width = coverage.shape
    solid = rgb.max(axis=2) > 12
    blank = (~solid).astype(np.float32)
    blur = max(1.8, width / 235)
    sampled = gaussian_filter(blank, blur)
    density = gaussian_filter(blank * coverage, blur) / np.maximum(.015, sampled)
    density = np.clip((density - .076) / .924, 0, 1) ** 1.12

    # Let the studio paper join the browser’s paper exactly at all four edges.
    yy, xx = np.ogrid[:height, :width]
    horizontal = np.minimum(xx, width - 1 - xx) / max(12, .095 * width)
    vertical = np.minimum(yy, height - 1 - yy) / max(12, .095 * height)
    feather = np.clip(np.minimum(horizontal, vertical), 0, 1)
    density *= feather ** 2 * (3 - 2 * feather)
    ground = PAPER + (UMBRA - PAPER) * density[..., None] * .71

    # Denoise similarly coloured neighbours without washing out the inscription
    # or confusing pale solid objects and the shadow catcher.
    guide = median_filter(rgb, size=(3, 3, 1))
    extent = ((2, 2), (2, 2), (0, 0))
    padded = np.pad(rgb, extent, mode="edge")
    guide_padded = np.pad(guide, extent, mode="edge")
    opaque_padded = np.pad(solid, 2, mode="edge")
    sample = np.zeros_like(rgb)
    weight_sum = np.zeros((height, width, 1), dtype=np.float32)
    for y in range(5):
        for x in range(5):
            nearby = padded[y:y + height, x:x + width]
            neighbouring_guide = guide_padded[y:y + height, x:x + width]
            correct_domain = opaque_padded[y:y + height, x:x + width] == solid
            # The robust guide preserves the actual fine contours while the centre
            # keeps a little of the printed grain rather than an airbrushed surface.
            delta = np.abs(neighbouring_guide - guide).mean(axis=2)
            weight = 1 / (1 + .4 * ((x - 2) ** 2 + (y - 2) ** 2))
            blend = weight * correct_domain / (1 + (delta / 19) ** 3)
            sample += nearby * blend[..., None]
            weight_sum += blend[..., None]
    pixels = sample / weight_sum
    alpha = np.where(solid, coverage, 0)[..., None]
    return Image.fromarray(np.uint8(np.clip(pixels * alpha + ground * (1 - alpha) + .5, 0, 255)), "RGB")


def contact_sheet(work):
    # Contact sheet for reviewing the three actual edit points before rendering.
    columns = []
    for view in ("wide", "tall"):
        for index in POSES.values():
            path = work / view / f"{index:03d}.png"
            if not path.is_file():
                continue
            pic = composite(path)
            pic.thumbnail((460, 440), Image.Resampling.LANCZOS)
            columns.append((view, pic))
    if not columns:
        raise FileNotFoundError(work)
    rows = [(view, [image for name, image in columns if name == view]) for view in ("wide", "tall")]
    width = max(sum(pic.width for pic in pictures) for _, pictures in rows)
    height = sum(max((pic.height for pic in pictures), default=0) for _, pictures in rows)
    output = Image.new("RGB", (width, height), tuple(PAPER.astype(int)))
    y = 0
    for _, pictures in rows:
        x = (width - sum(pic.width for pic in pictures)) // 2
        for pic in pictures:
            output.paste(pic, (x, y))
            x += pic.width
        y += max((pic.height for pic in pictures), default=0)
    output.save(work / "planche.jpg", quality=94)


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, args)], check=True)


def save_still(image, name):
    PUBLIC.mkdir(parents=True, exist_ok=True)
    pending = PUBLIC / f"{name}.pending"
    image.save(pending, "WEBP", quality=91, method=6)
    pending.replace(PUBLIC / f"{name}.webp")


def preview_stills(work, view):
    suffix = "-mobile" if view == "tall" else ""
    for stem, frame in POSES.items():
        save_still(composite(work / view / f"{frame:03d}.png"), stem + suffix)


def movie(work, view, crf):
    frames = work / view
    printing = work / f"{view}-papier"
    printing.mkdir(exist_ok=True)
    for frame in range(1, COUNT + 1):
        path = frames / f"{frame:03d}.png"
        target = printing / path.name
        if not target.is_file() or target.stat().st_mtime < path.stat().st_mtime:
            composite(path).save(target, compress_level=1)
    name_suffix = "-mobile" if view == "tall" else ""
    film = printing / "montage.mp4"
    ffmpeg(
        "-framerate", FPS, "-i", printing / "%03d.png", "-vf",
        "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,"
        "hqdn3d=3:3:1.15:1.15,lutyuv=y=val+1:u=val-1,"
        "setparams=range=tv:color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709",
        "-c:v", "libx264", "-threads", 3, "-profile:v", "high", "-g", 6, "-keyint_min", 6,
        "-sc_threshold", 0, "-bf", 0, "-preset", "slow", "-crf", crf,
        "-color_primaries", "bt709", "-colorspace", "bt709", "-color_trc", "iec61966-2-1",
        "-color_range", "tv", "-movflags", "+faststart", "-an", film,
    )
    PUBLIC.mkdir(parents=True, exist_ok=True)
    pending = PUBLIC / f"montage{name_suffix}.pending"
    pending.write_bytes(film.read_bytes())
    pending.replace(PUBLIC / f"montage{name_suffix}.mp4")
    for stem, frame in POSES.items():
        print_path = printing / f"{stem}-still.png"
        ffmpeg("-i", film, "-vf", rf"select=eq(n\,{frame - 1})", "-frames:v", 1, print_path)
        image = Image.open(print_path).convert("RGB")
        # Video rounds the solid matte differently across platforms; the stills
        # hold the exact CSS paper colour at their outermost pixels.
        save_still(image, stem + name_suffix)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, default=Path("/tmp/maison-mestier-portique"))
    parser.add_argument("--view", choices=["wide", "tall"])
    parser.add_argument("--sheet", action="store_true")
    parser.add_argument("--preview-stills", action="store_true")
    parser.add_argument("--crf", default=23, type=int)
    args = parser.parse_args()
    if args.sheet:
        contact_sheet(args.work)
    else:
        for angle in (args.view,) if args.view else ("wide", "tall"):
            if args.preview_stills:
                preview_stills(args.work, angle)
            else:
                movie(args.work, angle, args.crf)
