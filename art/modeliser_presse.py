"""Presse taille-douce de Maison Mestier. Construction intégrale dans Blender.

blender -b -P art/modeliser_presse.py
blender -b -P art/modeliser_presse.py -- --apercu /tmp/epreuve --blend /tmp/presse.blend
"""
import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from quantifier_glb import compact_glb

TAU = math.tau
RACINE = Path(__file__).resolve().parents[1]
ALONG_X = Vector((1, 0, 0))
ALONG_Z = Vector((0, 0, 1))
ALONG_Y = Vector((0, 1, 0))


def pigment(code):
    rgb = [int(code[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb) + (1,)


def material(name, color, metal, roughness, coat=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = pigment(color)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Coat Weight"].default_value = coat
    shader.inputs["Coat Roughness"].default_value = .24
    mat.diffuse_color = pigment(color)
    return mat


class Foundry:
    def __init__(self):
        self.parts = {}
        self.tools = []
        self.pivots = {"Bati": (0, 0, 0), "Volant": (.844, .015, .493)}
        self.group = "Bati"

    def finish(self, obj, mat):
        obj.data.materials.append(mat)
        self.parts.setdefault((self.group, mat), []).append(obj)
        return obj

    def mesh(self, name, coords, faces, mat, smooth=()):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(coords, [], faces)
        mesh.update()
        for index in smooth:
            mesh.polygons[index].use_smooth = True
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        return self.finish(obj, mat)

    def turned(self, name, center, axis, rings, mat, sides=32):
        """Profile of a machined part. Pairs are axial offset and radius."""
        pole = Vector(axis).normalized()
        radial = ALONG_Y if abs(pole.dot(ALONG_Y)) < .8 else ALONG_Z
        radial = (radial - pole * radial.dot(pole)).normalized()
        tangent = pole.cross(radial)
        center = Vector(center)
        vertices = []
        for z, radius in rings:
            for j in range(sides):
                a = TAU * j / sides
                vertices.append(center + pole * z + radius * (math.cos(a) * radial + math.sin(a) * tangent))
        faces = []
        for i in range(len(rings) - 1):
            for j in range(sides):
                a = i * sides + j
                b = i * sides + (j + 1) % sides
                faces.append((a, b, b + sides, a + sides))
        count = len(faces)
        if rings[0] != rings[-1]:
            faces.append(tuple(reversed(range(sides))))
            first = (len(rings) - 1) * sides
            faces.append(tuple(first + j for j in range(sides)))
        return self.mesh(name, vertices, faces, mat, range(count) if sides > 9 else ())

    def box(self, name, center, dims, bevel, mat):
        bpy.ops.mesh.primitive_cube_add(size=1, location=center)
        obj = bpy.context.object
        obj.name = name
        for v in obj.data.vertices:
            for a, d in enumerate(dims):
                v.co[a] *= d
        if bevel:
            mod = obj.modifiers.new('Congé de fonderie', 'BEVEL')
            mod.width = bevel
            mod.segments = 2
            mod.harden_normals = True
        return self.finish(obj, mat)

    def casting(self, side_x, mat):
        # A closed perimeter and an oppositely wound aperture form one casting.
        outline = [
            (-.473,.102),(-.466,.189),(-.313,.262),(-.266,.488),(-.256,.624),
            (-.331,.850),(-.314,1.045),(-.237,1.107),(-.155,1.122),(.204,1.121),
            (.272,1.098),(.313,1.042),(.316,.915),(.254,.740),(.227,.616),
            (.266,.415),(.324,.261),(.441,.183),(.454,.112),(.405,.090),(-.415,.089)
        ]
        aperture = [
            (-.243,.272),(-.163,.224),(.169,.224),(.227,.279),(.132,.432),
            (.111,.627),(.170,.745),(.178,.869),(.108,.915),(-.084,.900),
            (-.125,.837),(-.098,.666),(-.133,.470)
        ]
        cv = bpy.data.curves.new('Joue ajourée', 'CURVE')
        cv.dimensions = '2D'
        cv.fill_mode = 'BOTH'
        cv.resolution_u = 4
        cv.extrude = .038
        cv.bevel_depth = .009
        cv.bevel_resolution = 1
        for contour in (outline, aperture):
            path = cv.splines.new('BEZIER')
            path.bezier_points.add(len(contour) - 1)
            path.use_cyclic_u = True
            for p, (depth, height) in zip(path.bezier_points, contour):
                p.co = (depth, height, 0)
                p.handle_left_type = p.handle_right_type = 'AUTO'
        obj = bpy.data.objects.new('Joue de fonte à jour', cv)
        bpy.context.collection.objects.link(obj)
        obj.matrix_world = Matrix(((0,0,1,side_x),(1,0,0,0),(0,1,0,0),(0,0,0,1)))
        return self.finish(obj, mat)

    def pipe(self, name, pts, radius, mat, thickness=None):
        cv = bpy.data.curves.new(name, 'CURVE')
        cv.dimensions = '3D'
        cv.resolution_u = 5
        cv.bevel_resolution = 1
        cv.bevel_depth = radius
        cv.use_fill_caps = True
        s = cv.splines.new('BEZIER')
        s.bezier_points.add(len(pts) - 1)
        for i, (handle, p) in enumerate(zip(s.bezier_points, pts)):
            handle.co = p
            handle.handle_left_type = handle.handle_right_type = 'AUTO'
            if thickness:
                handle.radius = thickness[i]
        obj = bpy.data.objects.new(name, cv)
        bpy.context.collection.objects.link(obj)
        return self.finish(obj, mat)

    def engrave(self, plate, line, at, size):
        """Cut through the red enamel so the recessed brass substrate shows."""
        cv = bpy.data.curves.new('Poinçon du cartouche', 'FONT')
        cv.body = line
        cv.align_x = 'CENTER'
        cv.align_y = 'CENTER'
        cv.size = size
        cv.space_character = 1.32
        cv.resolution_u = 2
        cv.extrude = .013
        obj = bpy.data.objects.new('Matrice des lettres', cv)
        bpy.context.collection.objects.link(obj)
        obj.location = at
        obj.rotation_euler = (math.pi / 2, 0, 0)
        bpy.context.view_layer.update()
        deps=bpy.context.evaluated_depsgraph_get()
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
        cutter=bpy.data.objects.new('Lettres à fraiser',mesh)
        bpy.context.collection.objects.link(cutter)
        cutter.matrix_world=obj.matrix_world.copy()
        modifier=plate.modifiers.new('Gravure du nom', 'BOOLEAN')
        modifier.operation='DIFFERENCE'
        modifier.solver='EXACT'
        modifier.object=cutter
        self.tools.extend((obj,cutter))

    def assemble(self):
        baked = {}
        deps = bpy.context.evaluated_depsgraph_get()
        bpy.context.view_layer.update()
        for (name, mat), pieces in self.parts.items():
            vertices, faces, shading = [], [], []
            pivot = Vector(self.pivots[name])
            for obj in pieces:
                evaluated = obj.evaluated_get(deps)
                tmp = evaluated.to_mesh()
                if not tmp:
                    raise RuntimeError(obj.name)
                offset = len(vertices)
                vertices.extend(evaluated.matrix_world @ v.co - pivot for v in tmp.vertices)
                faces.extend(tuple(offset + j for j in poly.vertices) for poly in tmp.polygons)
                shading.extend(poly.use_smooth for poly in tmp.polygons)
                evaluated.to_mesh_clear()
            baked[(name, mat)] = vertices, faces, shading
        for pieces in self.parts.values():
            for obj in pieces:
                bpy.data.objects.remove(obj, do_unlink=True)
        for obj in self.tools:
            bpy.data.objects.remove(obj, do_unlink=True)
        made = []
        roots = {}
        for name, pivot in self.pivots.items():
            obj = bpy.data.objects.new(name, None)
            bpy.context.collection.objects.link(obj)
            obj.location = pivot
            roots[name] = obj
        for (name, mat), (vertices, faces, shading) in baked.items():
            mesh = bpy.data.meshes.new(name + ' - ' + mat.name)
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            for poly, smooth in zip(mesh.polygons, shading):
                poly.use_smooth = smooth
            obj = bpy.data.objects.new(mesh.name, mesh)
            bpy.context.collection.objects.link(obj)
            obj.parent = roots[name]
            mesh.materials.append(mat)
            made.append(obj)
        return roots, made

    def save_editable(self, target):
        """Keep the casting curves, turning profiles and Boolean engraving in the .blend."""
        scene = bpy.context.scene
        bpy.context.view_layer.update()
        deps = bpy.context.evaluated_depsgraph_get()
        lo, hi = [math.inf]*3, [-math.inf]*3
        for pieces in self.parts.values():
            for obj in pieces:
                evaluated = obj.evaluated_get(deps)
                mesh = evaluated.to_mesh()
                for vertex in mesh.vertices:
                    point = evaluated.matrix_world @ vertex.co
                    for i, value in enumerate(point):
                        lo[i] = min(lo[i], value)
                        hi[i] = max(hi[i], value)
                evaluated.to_mesh_clear()

        assembly = bpy.data.objects.new('Presse taille-douce · Maison Mestier', None)
        scene.collection.objects.link(assembly)
        groups = {}
        collections = {}
        for name in ('Bati', 'Volant', 'Outils de gravure'):
            collection = bpy.data.collections.new(name)
            scene.collection.children.link(collection)
            collections[name] = collection
            root = bpy.data.objects.new(name, None)
            collection.objects.link(root)
            root.parent = assembly
            root.empty_display_size = .1
            root.location = self.pivots.get(name, (0,0,0))
            groups[name] = root
        bpy.context.view_layer.update()

        def organize(obj, name):
            current = obj.matrix_world.copy()
            for collection in list(obj.users_collection):
                collection.objects.unlink(obj)
            collections[name].objects.link(obj)
            obj.parent = groups[name]
            obj.matrix_world = current

        for (name, _mat), pieces in self.parts.items():
            for obj in pieces:
                organize(obj, name)
        for obj in self.tools:
            organize(obj, 'Outils de gravure')
            obj.hide_render = True
            obj.hide_set(True)
        scale = [target_size/(hi[i]-lo[i]) for i,target_size in enumerate((2,1.18,1.30))]
        assembly.scale = scale
        assembly.location = (-(lo[0]+hi[0])*scale[0]/2,
                             -(lo[1]+hi[1])*scale[1]/2, -lo[2]*scale[2])
        scene.unit_settings.system = 'METRIC'
        bpy.ops.object.select_all(action='DESELECT')
        for screen in bpy.data.screens:
            for area in screen.areas:
                if area.type != 'VIEW_3D':
                    continue
                view = area.spaces.active
                view.region_3d.view_location = (0, 0, .62)
                view.region_3d.view_distance = 3.75
                view.region_3d.view_rotation = Vector((-3,4,-1.6)).to_track_quat('-Z','Y')
                view.shading.color_type = 'MATERIAL'
                view.overlay.show_floor = False
                view.overlay.show_extras = False
        target.parent.mkdir(parents=True, exist_ok=True)
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(target.resolve()), compress=True)


def model(editable=None):
    f = Foundry()
    enamel = material('Fonte émaillée, encre', '334246', .33, .31, .24)
    oxide = material('Fonderie mate', '1C2931', .43, .44)
    bronze = material('Bronze tourné', 'B08D57', .76, .30)
    steel = material('Acier poli', 'C0BFB6', .81, .25)
    ink = material('Encrage au carbone', '293235', .09, .46)
    red = material('Plaque en laque Cachet', '8E2A23', .21, .31, .26)
    oak = material('Poignée en noyer', '785038', .06, .33, .22)
    x_mid = -.075
    for x in (-.715, .565):
        for y in (-.367, .354):
            f.box('Semelle', (x,y,.028),(.265,.32,.054),.016,oxide)
            f.box('Embase fraisée', (x,y,.061),(.246,.30,.041),.015,enamel)
    f.box('Socle de fonte', (x_mid,0,.112), (1.71,.969,.096), .038,enamel)
    # Thin milled bead where the upper and lower halves of the foot meet.
    f.box('Filet de la semelle', (x_mid,0,.148), (1.668,.932,.015), .006,bronze)
    f.box('Plateau du bâti', (x_mid,0,.158), (1.652,.914,.026), .009,oxide)
    for x in (-.776,.628):
        f.casting(x,enamel)
        # Moulded rib follows the back curve of the load-bearing cheek.
        for side in (-1,1):
            xf=x+side*.046
            f.pipe('Nervure moulée',[(xf,.333,.207),(xf,.206,.369),(xf,.170,.575),
                   (xf,.204,.778),(xf,.252,.963),(xf,.213,1.050)],.013,enamel)
        f.box('Chapeau de palier', (x,.028,1.11),(.19,.49,.061),.022,oxide)
        # Lead screw on each bearing. Separate rings register as thread at a distance.
        f.turned('Palier fileté',(x,.024,1.106),ALONG_Z,[(0,.078),(.012,.091),(.039,.085),(.048,.062)],bronze,28)
        f.turned('Tige de réglage',(x,.024,1.145),ALONG_Z,[(0,.032),(.106,.032)],steel,24)
        for n in range(5):
            f.turned('Pas de réglage',(x,.024,1.154+n*.014),ALONG_Z,[(0,.031),(.004,.038),(.009,.032)],oxide,16)
        f.turned('Rosace de réglage',(x,.024,1.236),ALONG_Z,[(0,.045),(.023,.052),(.042,.035)],bronze,23)
        for angle in range(3):
            a=TAU*angle/3
            f.pipe('Rayon de rosace',[(x,.024,1.265),(x+.054*math.cos(a-.14),.024+.054*math.sin(a-.14),1.274),(x+.092*math.cos(a),.024+.092*math.sin(a),1.274)],.010,bronze)
        # A lathed open rim keeps all adjustment knobs perforated.
        f.turned('Molette ajourée',(x,.024,1.278),ALONG_Z,[
            (-.009,.092),(-.009,.103),(-.004,.108),(.005,.108),(.010,.103),(.010,.092),(.007,.087),(-.006,.087),(-.009,.092)
        ],bronze,30)
    # Two rails carry the feed table. The paper moves in the gap at Z ~ 0.65.
    for x in (-.655,.504):
        f.box('Longeron', (x,-.120,.515),(.118,.913,.077),.014,enamel)
        f.box('Glissière fraisée', (x,-.347,.582),(.046,.45,.031),.008,steel)
    f.box('Table d’amenage', (x_mid,-.181,.595),(1.22,.801,.051),.015,oxide)
    f.box('Chant avant du marbre', (x_mid,-.567,.592),(1.18,.027,.028),.005,steel)
    for x in (-.682,.531):
        f.turned('Molette de butée',(x,-.496,.610),ALONG_Z,[(0,.037),(.007,.043),(.022,.043),(.028,.034)],bronze,18)
    # Main rollers and necks. The cylinders stay continuous between the cheeks.
    for z,y,radius,body in [(.852,.015,.192,steel),(.495,.015,.147,oxide),(1.007,.236,.086,ink)]:
        c=(x_mid,y,z);width=.655
        f.turned('Cylindre de pression',c,ALONG_X,[
            (-width-.049,radius*.71),(-width-.03,radius*.91),(-width+.008,radius),
            (width-.008,radius),(width+.025,radius*.94),(width+.048,radius*.71)
        ],body,48)
        for s in (-1,1):
            f.turned('Frette', (x_mid+s*(width-.025),y,z),ALONG_X,[
                (-.008,radius*.999),(-.006,radius*1.009),(.006,radius*1.009),(.008,radius*.999)
            ],bronze if body==ink else oxide,40)
        f.turned('Arbre traversant',(x_mid,y,z),ALONG_X,[(-.806,radius*.37),(.795,radius*.37)],steel,28)
        for x,sign in ((-.829,-1),(.679,1)):
            for offset,rad,mat in [(0,radius*.76,oxide),(.022,radius*.64,bronze),(.04,radius*.42,steel)]:
                xc=x+sign*offset
                f.turned('Coussinet', (xc,y,z),ALONG_X,[(-.016,rad*.9),(-.011,rad),(.011,rad),(.016,rad*.94)],mat,26)
    # Stiff upper cross-tie carries the maker's plate toward the feed operator.
    f.box('Entretoise haute',(x_mid,.060,1.078),(1.52,.078,.124),.021,enamel)
    f.box('Dos de plaque', (x_mid,.012,1.082),(.545,.022,.101),.008,bronze)
    plate=f.box('Émail rouge du cartouche', (x_mid,-.0002,1.082),(.519,.009,.082),.005,red)
    f.engrave(plate, 'MESTIER', (x_mid,-.001,1.083),.061)
    for x in (x_mid-.248,x_mid+.248):
        f.turned('Rivet de cartouche',(x,-.01,1.08),ALONG_Y,[(-.004,.006),(-.002,.01),(.003,.01)],steel,12)
    for x,s in [(-.822,-1),(.675,1)]:
        for y,z in [(-.31,.19),(.31,.19),(-.224,1.031),(.168,1.040),(-.198,.734),(.188,.614)]:
            f.turned('Rondelle',(x,y,z),ALONG_X,[(-.010,.031),(.010,.031)],bronze,18)
            f.turned('Écrou',(x+s*.015,y,z),ALONG_X,[(-.010,.022),(-.006,.026),(.006,.026),(.010,.022)],steel,6)
    # Five swept spokes, bronze machining on both faces of the rim, one revolving crank.
    f.group='Volant'
    x,y,z=f.pivots['Volant']
    f.turned('Jante forgée',(x,y,z),ALONG_X,[
        (-.034,.365),(-.045,.381),(-.046,.403),(-.035,.422),(-.023,.428),
        (.024,.428),(.035,.423),(.046,.407),(.046,.384),(.035,.373),(.023,.366),(-.034,.365)
    ],bronze,52)
    for xoff in (-.032,.032):
        f.turned('Filet tourné',(x+xoff,y,z),ALONG_X,[(-.004,.422),(-.001,.427),(.002,.426),(.004,.422),(.004,.420),(-.004,.420),(-.004,.422)],steel,48)
    f.turned('Moyeu',(x,y,z),ALONG_X,[(-.163,.047),(-.144,.080),(-.060,.081),
             (-.037,.101),(.017,.110),(.055,.097),(.060,.067),(.067,.065)],bronze,34)
    f.turned('Boulon du volant',(x+.071,y,z),ALONG_X,[(-.015,.043),(-.009,.054),(.009,.054),(.014,.044)],steel,6)
    for i in range(5):
        a=TAU*i/5+.30
        pts=[(x+dx,y+r*math.cos(a+phase),z+r*math.sin(a+phase)) for r,phase,dx in [
            (.072,-.24,-.015),(.154,-.14,-.025),(.260,.033,-.022),(.324,.070,-.004),(.383,.035,.000)]]
        f.pipe('Rayon de volant courbe',pts,.031,bronze,[1.34,1.08,.71,.61,.83])
    a=-.82
    cy=y+.332*math.cos(a);cz=z+.332*math.sin(a)
    f.turned('Axe de manivelle',(x+.068,cy,cz),ALONG_X,[(-.07,.030),(-.052,.043),(.026,.041),(.038,.032),(.096,.024)],steel,23)
    f.turned('Poignée tournée',(x+.138,cy,cz),ALONG_X,[(-.066,.021),(-.061,.034),(-.05,.041),(-.035,.043),(-.011,.039),(.038,.029),(.052,.032),(.064,.034),(.070,.022)],oak,29)
    if editable:
        f.save_editable(editable)
        return None
    return f.assemble()


def fit_model(roots, meshes):
    bpy.context.view_layer.update()
    corners=[obj.matrix_world @ Vector(v) for obj in meshes for v in obj.bound_box]
    lo=Vector(tuple(min(p[i] for p in corners) for i in range(3)))
    hi=Vector(tuple(max(p[i] for p in corners) for i in range(3)))
    mid=(lo+hi)/2
    scale=Vector((2/(hi.x-lo.x),1.18/(hi.y-lo.y),1.30/(hi.z-lo.z)))
    # Bake scaling into geometry to leave the flywheel a true rotation pivot.
    for obj in meshes:
        for vert in obj.data.vertices:
            vert.co=Vector(tuple(vert.co[i]*scale[i] for i in range(3)))
    for obj in roots.values():
        obj.location=Vector(((obj.location.x-mid.x)*scale.x,(obj.location.y-mid.y)*scale.y,(obj.location.z-lo.z)*scale.z))
    bpy.context.view_layer.update()


def studio(folder):
    scene=bpy.context.scene
    folder.mkdir(parents=True,exist_ok=True)
    bpy.ops.mesh.primitive_plane_add(size=200)
    floor=bpy.context.object
    floor.location.z=-.005
    floor.data.materials.append(material('Papier de studio','A59B87',.02,.76))
    world=bpy.data.worlds.new('Atelier photographique')
    scene.world=world;world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.41,.43,.49,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.60
    def aim(obj,at):obj.rotation_euler=(Vector(at)-obj.location).to_track_quat('-Z','Y').to_euler()
    def area(name,pos,energy,color,size,shape='DISK'):
        light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape=shape;light.size=size;light.color=color
        obj=bpy.data.objects.new(name,light);scene.collection.objects.link(obj);obj.location=pos;aim(obj,(0,0,.60))
    area('Fenêtre douce',(-2.3,-3,4.4),610,(1.0,.86,.68),3.2)
    area('Réflecteur',(2.2,-1.0,2.8),330,(.71,.83,1.),2.5)
    area('Contre jour',(.6,2.5,3.),700,(1.,.8,.59),2.1)
    camera=bpy.data.cameras.new('Chambre');obj=bpy.data.objects.new('Chambre',camera);scene.collection.objects.link(obj);scene.camera=obj
    scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=False
    scene.render.resolution_x=580;scene.render.resolution_y=430;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=91
    for i,(eye,at,lens) in enumerate([((2.85,-3.7,2.25),(0,0,.60),65),((-2.5,-3.6,1.8),(-.05,0,.63),62),((2.1,-.80,.89),(.61,.01,.61),58)]):
        obj.location=eye;aim(obj,at);camera.lens=lens
        scene.render.filepath=str(folder/f'presse-{i}.jpg');bpy.ops.render.render(write_still=True)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--sortie',type=Path,default=RACINE/'public/traversee/modeles/presse.glb')
    p.add_argument('--apercu',type=Path);p.add_argument('--blend',type=Path)
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if args.blend:
        model(args.blend)
        bpy.ops.wm.read_factory_settings(use_empty=True)
    roots, meshes=model();fit_model(roots,meshes)
    args.sortie.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(args.sortie.resolve()),export_format='GLB',
                              export_yup=True,export_animations=False,export_tangents=False,export_texcoords=False,
                              export_extras=False,export_cameras=False,export_lights=False)
    compact_glb(args.sortie)
    if args.apercu:studio(args.apercu)


if __name__=='__main__':
    main()
