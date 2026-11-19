"""Extrait de noyer pour le manche, à partir de la diffuse 2K de Poly Haven.

python art/preparer_bois_cachet.py /chemin/natural_walnut_veneer_diff_2k.jpg
La carte préparée est livrée avec les sources afin que Blender fonctionne hors ligne.
"""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

SOURCE_SHA = "4a1a84e9537b291ac0cce1e2b8908fb9b5d1057a246ee0b3c25345565ac9686d"
SORTIE = Path(__file__).resolve().parent / "textures/noyer-cachet.jpg"


def prepare(source):
    if sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise ValueError("La carte attendue est la diffuse JPEG 2K de Natural Walnut Veneer.")
    with Image.open(source) as scan:
        # The grain runs horizontally across a single leaf of veneer in this patch.
        zone = scan.crop((270, 590, 998, 1710)).transpose(Image.Transpose.ROTATE_90)
        grain = zone.convert("L").resize((562, 368), Image.Resampling.LANCZOS)
    low = grain.filter(ImageFilter.GaussianBlur(4))
    mean = ImageStat.Stat(grain).mean[0]
    # Stain the diffuse, retaining the scanned contrast of the annual rings and fine pores.
    tint = Image.new("RGB", grain.size)
    tint.putdata([
        tuple(round(min(255, max(0, base + delta * amount))) for base, amount in ((87, 1.17), (53, .84), (35, .57)))
        for sample, blurred in zip(grain.tobytes(), low.tobytes())
        for delta in [1.32 * (blurred - mean) + 2.2 * (sample - blurred)]
    ])
    width, height = 512, 368
    tile = tint.crop((0, 0, width, height))
    overlap = tint.width - width
    for x in range(overlap):
        weight = x / (overlap - 1)
        weight = weight * weight * (3 - 2 * weight)
        leading = tint.crop((x, 0, x + 1, height))
        trailing = tint.crop((width + x, 0, width + x + 1, height))
        tile.paste(Image.blend(trailing, leading, weight), (x, 0))
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    tile.save(SORTIE, format="JPEG", quality=87, subsampling=0, optimize=True)
    print(SORTIE.name, tile.size, SORTIE.stat().st_size)


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    prepare(parser.parse_args().source)
