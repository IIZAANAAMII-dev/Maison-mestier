"""Sample the static Blender scene for optical registration of successive exposures."""

from mathutils import Vector
from mathutils.bvhtree import BVHTree
import numpy as np


def collect_guides(scene, camera, pose, count, width, height, work):
    import bpy
    deps = bpy.context.evaluated_depsgraph_get()
    vertices, faces = [], []
    # Curves (including the ink and brass) are converted exactly like the final frame.
    for obj in scene.objects:
        if obj.hide_render or obj.type not in {"MESH", "CURVE", "FONT", "SURFACE"}:
            continue
        evaluated = obj.evaluated_get(deps)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            matrix = obj.matrix_world
            offset = len(vertices)
            vertices.extend(matrix @ v.co for v in mesh.vertices)
            faces.extend(tuple(offset+i for i in tri.vertices) for tri in mesh.loop_triangles)
        finally:
            evaluated.to_mesh_clear()
    geometry = BVHTree.FromPolygons(vertices, faces, all_triangles=True)
    depths, matrices, focals = [], [], []
    # Each 4-pixel block is enough to locate continuous surfaces. Reprojection rejects
    # samples crossing an occlusion; the original frame always contributes full weight.
    step = 4
    for idx in range(count):
        pose(idx/(count-1))
        matrix = camera.matrix_world
        eye = matrix.translation
        rotation = matrix.to_3x3().normalized()
        focal = camera.data.lens * width / camera.data.sensor_width
        xs = [(col + step/2 - width/2)/focal for col in range(0,width,step)]
        rows = []
        forward = rotation @ Vector((0,0,-1))
        for y in range(0,height,step):
            local_y = (height/2-y-step/2)/focal
            row = []
            for local_x in xs:
                direction = rotation @ Vector((local_x,local_y,-1))
                hit = geometry.ray_cast(eye,direction)[0]
                row.append((hit-eye).dot(forward) if hit is not None else 100.)
            rows.append(row)
        depths.append(np.asarray(rows,dtype=np.float16))
        matrices.append(np.asarray(matrix,dtype=np.float32))
        focals.append(focal)
    np.savez_compressed(work/"optics.npz", depth=depths, matrix=matrices, focal=focals)
