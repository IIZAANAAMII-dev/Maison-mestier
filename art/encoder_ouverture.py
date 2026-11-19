"""Encode the local Blender print series as the introduction and its first still.

For a set of 32 odd-numbered frames rendered by ouverture.py with --stride 2:
python art/encoder_ouverture.py /tmp/empreinte public/film --oidn /path/to/oidnDenoise
Both masters are encoded by default. Use --edition portrait to encode only the mobile edition.
The production master uses Open Image Denoise 2.5.1 and FFmpeg 7.1.5. An
FFmpeg-only denoising pass is available when OIDN is omitted. Pillow and
NumPy are required. A temporary directory holds the working images.
"""

import argparse
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("destination", type=Path)
parser.add_argument("--oidn", type=Path)
parser.add_argument("--still-only", action="store_true")
parser.add_argument("--edition", choices=("both", "paysage", "portrait"), default="both")
parser.add_argument("--threads", type=int, default=2)
args = parser.parse_args()
FPS = 24
FRAME_COUNT = 64


def write_pfm(path, pixels):
    rows, columns, _ = pixels.shape
    with path.open("wb") as stream:
        stream.write(f"PF\n{columns} {rows}\n-1.0\n".encode("ascii"))
        stream.write(np.flipud(pixels).astype("<f4").tobytes())


def read_pfm(path):
    with path.open("rb") as stream:
        if stream.readline().strip() != b"PF":
            raise ValueError("Expected an RGB PFM")
        w, h = map(int, stream.readline().split())
        order = "<f4" if float(stream.readline()) < 0 else ">f4"
        return np.flipud(np.frombuffer(stream.read(), dtype=order).reshape(h, w, 3))


def cleaned(source, temporary):
    rgb = Image.open(source).convert("RGB")
    if args.oidn is None:
        return rgb
    raw = np.asarray(rgb).astype(np.float32) / 255
    write_pfm(temporary / "raw.pfm", raw)
    subprocess.run(
        [
            str(args.oidn),
            "--device",
            "cpu",
            "--ldr",
            str(temporary / "raw.pfm"),
            "--srgb",
            "--quality",
            "balanced",
            "--threads",
            str(args.threads),
            "--affinity",
            "0",
            "-o",
            str(temporary / "clean.pfm"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    # Keep a trace of the original grain without the isolated fireflies of a
    # low-sample glossy reflection. OIDN operates on gamma-encoded input here.
    clean = read_pfm(temporary / "clean.pfm")
    result = clean + 0.12 * np.clip(raw - clean, -0.13, 0.13)
    return Image.fromarray((np.clip(result, 0, 1) * 255 + 0.5).astype(np.uint8))


def portrait_frame(image):
    # On long phones the browser crops a second time to fill the screen. Keep
    # both initials inside that safe width and leave room below for the title.
    # The short edge extensions use the image’s real paper and soft background.
    width, height = image.size
    above = max(1, round(height * 14 / 576))
    below = max(1, round(height * 34 / 576))
    portrait_width = round((height + above + below) * 9 / 16)
    left = round(width * 0.486 - portrait_width / 2)
    cut = image.crop((left, 0, left + portrait_width, height))
    # Use only the paper at the lower edge. Farther into the last frame the
    # raised wax rim approaches this margin as the camera pulls above it.
    edge_depth = max(1, round(height * 8 / 576))
    lower_paper = cut.crop((0, height - edge_depth, portrait_width, height))
    lower_paper = lower_paper.transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize(
        (portrait_width, below), Image.Resampling.BICUBIC
    )
    upper = cut.crop((0, 0, portrait_width, above)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    portrait = Image.new("RGB", (portrait_width, height + above + below))
    portrait.paste(upper, (0, 0))
    portrait.paste(cut, (0, above))
    portrait.paste(lower_paper, (0, height + above))
    return portrait.resize((360, 640), Image.Resampling.LANCZOS)


def encode_series(directory, stem, stride, quality):
    filters = ["tpad=stop_mode=clone:stop_duration=0.18"]
    if stride > 1:
        filters.append("minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1")
    if args.oidn is None:
        filters.append("hqdn3d=2.4:1.6:2.8:2.1")
    filters.append("format=yuv420p")
    with tempfile.NamedTemporaryFile(
        prefix=".mestier-", suffix=".mp4", dir=args.destination, delete=False
    ) as container:
        delivery = Path(container.name)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-loglevel",
                "error",
                "-y",
                "-filter_threads",
                str(args.threads),
                "-framerate",
                str(FPS / stride),
                "-i",
                str(directory / "frame-%04d.png"),
                "-vf",
                ",".join(filters),
                "-frames:v",
                str(FRAME_COUNT),
                "-an",
                "-c:v",
                "libx264",
                "-threads",
                str(args.threads),
                "-preset",
                "slow",
                "-crf",
                str(quality),
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(delivery),
            ],
            check=True,
        )
        delivery.replace(args.destination / f"{stem}.mp4")
    finally:
        delivery.unlink(missing_ok=True)


sources = sorted(args.source.glob("[0-9][0-9][0-9][0-9].png"))
if not sources:
    raise SystemExit("No Blender frames found")
if not args.still_only:
    frame_numbers = [int(path.stem) for path in sources]
    if len(frame_numbers) < 2:
        raise SystemExit("At least two source frames are needed to encode the film")
    stride = frame_numbers[1] - frame_numbers[0]
    if frame_numbers != list(range(1, FRAME_COUNT + 1, stride)):
        raise SystemExit(
            "A source frame is missing. Render the entire 64-frame timeline before encoding"
        )
args.destination.mkdir(parents=True, exist_ok=True)

editions = ("paysage", "portrait") if args.edition == "both" else (args.edition,)
with tempfile.TemporaryDirectory(prefix="mestier-tirage-") as tempname:
    temporary = Path(tempname)
    for edition in editions:
        (temporary / edition).mkdir()
    for i, source in enumerate(sources):
        rgb = cleaned(source, temporary)
        for edition in editions:
            is_portrait = edition == "portrait"
            stem = "ouverture-mobile" if is_portrait else "ouverture"
            frame = portrait_frame(rgb) if is_portrait else rgb
            if i == 0:
                frame.save(args.destination / f"{stem}.webp", format="WEBP", quality=91, method=6)
            if not args.still_only:
                frame.save(temporary / edition / f"frame-{i:04d}.png", compress_level=1)
        if args.still_only:
            break
    if not args.still_only:
        if "paysage" in editions:
            encode_series(temporary / "paysage", "ouverture", stride, 16)
        if "portrait" in editions:
            encode_series(temporary / "portrait", "ouverture-mobile", stride, 22)
