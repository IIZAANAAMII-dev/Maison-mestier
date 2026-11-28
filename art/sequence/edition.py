"""Grade the finished Cycles frames without altering their camera framing."""

import argparse
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--format", choices=("portrait", "paysage"), required=True)
parser.add_argument("--work", required=True, type=Path)
parser.add_argument("--plates-only", action="store_true")
args = parser.parse_args()
dest = Path(__file__).resolve().parents[2] / "public/sequence"
suffix = "-mobile" if args.format == "portrait" else ""

def encode(*arguments):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-threads", "2", "-filter_threads", "3", *map(str, arguments)], check=True)

# The median rejects noisy indirect-light samples. The bilateral pass smooths
# within a pigment while preserving the brass rim and the thin strokes of the M.
still_grade = "format=yuv444p,median=radius=1:planes=7,bilateral=sigmaS=1.8:sigmaR=.07:planes=7,unsharp=5:5:.3"
for name in ("entree", "empreinte"):
    target = dest/(name + suffix + ".webp")
    pending = target.with_suffix(".pending.webp")
    encode("-i", args.work/(name + "-retina.png"), "-vf", still_grade, "-frames:v", 1,
           "-c:v", "libwebp", "-quality", 89, "-compression_level", 6, pending)
    pending.replace(target)

if not args.plates_only:
    subprocess.run([sys.executable, str(Path(__file__).with_name("degrain.py")), str(args.work)], check=True)
    grade = (
        "format=yuv444p,median=radius=1:planes=7,bilateral=sigmaS=3.4:sigmaR=.11:planes=7,"
        "hqdn3d=7:5:5:4,unsharp=5:5:.34,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
    )
    target = dest/("traversee" + suffix + ".mp4")
    pending = target.with_suffix(".pending.mp4")
    encode("-framerate", 20, "-i", args.work/"registered/frame-%03d.png", "-frames:v", 60,
           "-vf", grade, "-c:v", "libx264", "-preset", "slow", "-threads", 3, "-crf", 22,
           "-g", 4, "-keyint_min", 4, "-sc_threshold", 0, "-bf", 0, "-pix_fmt", "yuv420p",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-movflags", "+faststart", "-an", pending)
    pending.replace(target)
