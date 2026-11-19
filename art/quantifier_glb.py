"""Quantification autonome des modèles Blender de Maison Mestier."""
import json
import struct


def compact_glb(path):
    """Store positions and normals in GPU-friendly formats while preserving object pivots."""
    glb = path.read_bytes()
    length = struct.unpack_from('<I', glb, 12)[0]
    scene = json.loads(glb[20:20 + length])
    original = memoryview(glb)[28 + length:]
    attributes = {}
    for mesh in scene['meshes']:
        for primitive in mesh['primitives']:
            for semantic in ('POSITION', 'NORMAL'):
                accessor = scene['accessors'][primitive['attributes'][semantic]]
                attributes[accessor['bufferView']] = (semantic, accessor)
    binary = bytearray()
    for index, view in enumerate(scene['bufferViews']):
        start = view.get('byteOffset', 0)
        block = original[start:start + view['byteLength']]
        while len(binary) % 4:
            binary.append(0)
        view['byteOffset'] = len(binary)
        if index in attributes:
            semantic, accessor = attributes[index]
            assert accessor['componentType'] == 5126 and accessor.get('byteOffset', 0) == 0
            assert view.get('byteStride', 12) == 12
            position = semantic == 'POSITION'
            # Positions use half-units, then each mesh child scales uniformly by two.
            factor = 32767 / 2 if position else 127
            limit = 32767 if position else 127
            row = struct.Struct('<hhhxx' if position else '<bbbx')
            for vertex in struct.iter_unpack('<fff', block):
                values = [round(value * factor) for value in vertex]
                if any(abs(value) > limit for value in values):
                    raise ValueError(f'{semantic} dépasse le domaine de quantification')
                binary.extend(row.pack(*values))
            accessor['componentType'] = 5122 if position else 5120
            accessor['normalized'] = True
            for bounds in ('min', 'max'):
                if bounds in accessor:
                    accessor[bounds] = [round(value * factor) for value in accessor[bounds]]
            view['byteStride'] = row.size
        else:
            binary.extend(block)
        view['byteLength'] = len(binary) - view['byteOffset']
    for node in scene['nodes']:
        if 'mesh' in node:
            assert 'matrix' not in node and 'scale' not in node
            node['scale'] = [2, 2, 2]
    for prop in ('extensionsUsed', 'extensionsRequired'):
        scene.setdefault(prop, []).append('KHR_mesh_quantization')
    scene['buffers'][0]['byteLength'] = len(binary)
    while len(binary) % 4:
        binary.append(0)
    meta = json.dumps(scene, ensure_ascii=False, separators=(',', ':')).encode()
    meta += b' ' * (-len(meta) % 4)
    chunk = struct.pack('<I4s', len(meta), b'JSON') + meta + struct.pack('<I4s', len(binary), b'BIN\0') + binary
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + len(chunk)) + chunk)
