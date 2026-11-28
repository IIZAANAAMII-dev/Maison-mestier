"""Render the printed research sheet and production schedule for the atelier pages.

From the repository root: blender -b -t 4 -P art/portique/carnets.py
The print uses the same two OFL typefaces as the website.
"""
import math
import tempfile
from pathlib import Path

import bpy
from fontTools.ttLib import TTFont
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "metiers"
PAPER, INK, RED, RULE = "#f4ebda", "#312520", "#882d29", "#b6a491"


def draw_sheet(slug, temporary):
    image = Image.new("RGB", (1200, 1540), PAPER)
    ink = ImageDraw.Draw(image)

    def font(name, size):
        dest = temporary / (name + ".ttf")
        if not dest.exists():
            face = TTFont(ROOT / "app/fonts/pavillon" / (name + ".woff2"))
            face.flavor = None
            face.save(dest)
        return ImageFont.truetype(str(dest), size)

    small = font("hanken-grotesk", 28)
    label = font("hanken-grotesk", 42)
    title = font("instrument-serif", 136)
    serif = font("instrument-serif-italic", 88)
    number = font("instrument-serif-italic", 60)
    ink.text((98, 90), "Maison Mestier", font=font("instrument-serif", 60), fill=INK)
    ink.text((1094, 114), "BUREAU DES ATELIERS", anchor="ra", font=small, fill=RED)
    ink.line((98, 192, 1100, 192), fill=RED, width=3)
    is_schedule = slug == "intendance"
    ink.text((92, 260), "Feuille de route" if is_schedule else "Être trouvé.", font=title, fill=INK)
    ink.text((98, 465), "Préparer l’ouverture" if is_schedule else "Carnet de recherche", font=serif, fill=RED)
    ink.text((100, 692), "PHASE" if is_schedule else "INTENTION", font=small, fill=RED)
    ink.text((726, 692), "POINT DE PASSAGE" if is_schedule else "SUPPORT", font=small, fill=RED)
    rows = (
        [("Préparation", "Brief et calendrier"), ("Production", "BAT et fournisseurs"),
         ("Sur place", "Accès et montage"), ("Après l’ouverture", "Suivi et bilan")]
        if is_schedule else
        [("Chercher un métier", "Page de service"), ("Trouver un lieu", "Recherche locale"),
         ("Comparer", "Étude de projet"), ("Prendre contact", "Demande de devis")]
    )
    for index, (left, right) in enumerate(rows):
        y = 761 + index * 122
        ink.line((98, y, 1100, y), fill=RULE, width=2)
        ink.text((100, y + 23), str(index + 1).zfill(2), font=number, fill=RED)
        ink.text((226, y + 31), left, font=label, fill=INK)
        ink.text((726, y + 44), right, font=small, fill=INK)
    ink.line((98, 1249, 1100, 1249), fill=RULE, width=2)
    ink.text((101, 1378), "INTENDANCE" if is_schedule else "VISIBILITÉ", font=small, fill=RED)
    ink.text((1096, 1378), "Document de travail", anchor="ra", font=small, fill=INK)
    target = temporary / (slug + ".png")
    image.save(target)
    return target


def material(name, color, roughness, grain=0, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if grain:
        grain_map = nodes.new("ShaderNodeTexNoise")
        grain_map.inputs["Scale"].default_value = 142
        grain_map.inputs["Detail"].default_value = 3
        relief = nodes.new("ShaderNodeBump")
        relief.inputs["Strength"].default_value = grain
        relief.inputs["Distance"].default_value = .031
        links.new(grain_map.outputs["Fac"], relief.inputs["Height"])
        links.new(relief.outputs["Normal"], shader.inputs["Normal"])
    return mat


def slab(name, dimensions, center, pigment, angle, bevel=.014):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = angle
    obj.data.materials.append(pigment)
    edge = obj.modifiers.new("Tranche", "BEVEL")
    edge.width = bevel
    edge.segments = 3
    obj.modifiers.new("Normals", "WEIGHTED_NORMAL")
    return obj


def point(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup(slug, temporary):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 22
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 4
    scene.world = bpy.data.worlds.new("Lumière ambiante")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.37, .28, .20, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .40
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"

    binding = material("Toile de reliure", (.13, .017, .015), .77, .42)
    stone = material("Pierre de l’atelier", (.34, .27, .21), .77, .35)
    paper_edge = material("Tranche ivoire", (.74, .64, .49), .83, .08)
    ribbon = material("Signet de coton", (.33, .035, .024), .76, .36)
    brass = material("Laiton brossé", (.49, .31, .139), .32, .15, .73)
    ground = binding if slug == "visibilite" else stone
    slab("Plan de travail", (26, 26, .22), (0, 0, -.21), ground, 0)
    # The binding and two offset leaves cast real contact shadows.
    angle = math.radians(-9 if slug == "visibilite" else 6)
    slab("Carton relié", (3.87, 4.95, .12), (.08, .06, -.015), binding, angle + .07, .04)
    slab("Feuillet de garde", (3.7, 4.78, .075), (-.05, .04, .083), paper_edge, angle - .04)
    slab("Signet", (.23, 1.5, .018), (.70, -2.11, .145), ribbon, angle - .15)
    slab("Papier", (3.64, 4.67, .047), (0, 0, .18), paper_edge, angle)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, .204))
    print_surface = bpy.context.object
    print_surface.scale = (3.64, 4.67, 1)
    print_surface.rotation_euler.z = angle
    transfer = material("Encre sur papier", (1, 1, 1), .87, .09)
    texture = transfer.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(draw_sheet(slug, temporary)))
    transfer.node_tree.links.new(texture.outputs["Color"], transfer.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
    print_surface.data.materials.append(transfer)

    # Small brass straightedge, beside the sheet. Ticks are physically engraved reliefs.
    ruler_angle = .18 if slug == "visibilite" else -.12
    ruler_x, ruler_y = 2.36, .06
    slab("Réglet", (.29, 3.53, .06), (ruler_x, ruler_y, -.067), brass, ruler_angle)
    for i in range(35):
        y = (i - 17) * .096
        width = .145 if i % 5 == 0 else .074
        x = -.14 + width / 2
        x0 = ruler_x + x * math.cos(ruler_angle) - y * math.sin(ruler_angle)
        y0 = ruler_y + x * math.sin(ruler_angle) + y * math.cos(ruler_angle)
        slab("Graduation", (width, .008, .003), (x0, y0, -.035), binding, ruler_angle, .001)

    for pos, power, size in [((-4, 1, 5), 620, 3.2), ((2, -3, 5), 210, 5)]:
        bpy.ops.object.light_add(type="AREA", location=pos)
        lum = bpy.context.object
        lum.data.energy, lum.data.shape, lum.data.size = power, "DISK", size
        point(lum, (0, 0, 0))
    bpy.ops.object.camera_add(location=(.58, -3.35, 7.1))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    point(camera, (.17, .13, 0))
    scene.camera = camera
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 89
    scene.render.resolution_percentage = 100
    for suffix, width, height, framing in [("", 1080, 920, 6.4), ("-mobile", 600, 710, 6)]:
        camera.data.ortho_scale = framing
        scene.render.resolution_x, scene.render.resolution_y = width, height
        scene.render.filepath = str(OUTPUT / (slug + suffix + ".webp"))
        bpy.ops.render.render(write_still=True)


with tempfile.TemporaryDirectory() as temp:
    for workshop in ("visibilite", "intendance"):
        setup(workshop, Path(temp))
