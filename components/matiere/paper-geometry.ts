import * as THREE from "three";

/** Shared by the live renderer and the photographic fallback exporter. */
export function positionPaperSculpture(
  objects: { object: THREE.Group; sculpture: THREE.Group; leaves: THREE.Mesh[]; camera: THREE.PerspectiveCamera },
  score: { progress: number; width: number; height: number; time?: number; pointerX?: number; pointerY?: number },
) {
  const { object, sculpture, leaves, camera } = objects;
  const { progress, width, height, time = 0, pointerX = 0, pointerY = 0 } = score;
  const opening = THREE.MathUtils.smoothstep(progress, 0.02, 0.48);
  const collecting = THREE.MathUtils.smoothstep(progress, 0.66, 1);
  const spread = opening * (1 - collecting * 0.78);
  const mobile = width / height < 0.90;
  for (let index = 0; index < leaves.length; index++) {
    const n = index - 5, leaf = leaves[index];
    leaf.position.set(n * (0.11 + spread * 0.085), Math.abs(n) * 0.022, n * 0.045);
    leaf.rotation.set(n * 0.011 + spread * Math.sin(index * 0.42) * 0.05,
      n * (0.13 + spread * 0.11) - 0.40 + collecting * 0.28,
      -n * (0.062 + spread * 0.058));
    leaf.scale.setScalar(1 - Math.abs(n) * 0.034);
    if (leaf.morphTargetInfluences) leaf.morphTargetInfluences[0] = 0.20 + spread * 0.75;
  }
  sculpture.rotation.y = -0.13 + opening * 0.33 - collecting * 0.58 + pointerX * 0.07;
  sculpture.rotation.z = 0.02 + Math.sin(time * 0.38) * 0.006;
  object.scale.setScalar((mobile ? 0.93 : 1) * (1 - collecting * 0.10));
  object.position.x = mobile ? 0 : 0.50 + opening * 0.12;
  const aspect = width / height;
  const distance = mobile ? Math.max(12.5, 6.55 / aspect) : 12.4;
  camera.position.set(4.0 - opening * 1.45 + collecting * 0.80 + pointerX * 0.25,
    4.25 - opening * 0.28 + collecting * 0.30 - pointerY * 0.12,
    distance + opening * 0.70 + collecting * 0.75);
  camera.lookAt(mobile ? 0.25 + opening * 0.35 : -0.65 + opening * 1.15, mobile ? 2.55 : 2.30, 0.20);
  camera.updateMatrixWorld();
}

/** A sheet has two distinct faces, a real cut edge, and a smoothly changing curl. */
export function createPaperLeaf(index = 0, segments = 112, columns = 12) {
  const variation = index * 0.043;

  function shape(open: number) {
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    const groups: { start: number; count: number; materialIndex: number }[] = [];
    const center = new THREE.Vector3(), tangent = new THREE.Vector3();
    const lateral = new THREE.Vector3(), normal = new THREE.Vector3();
    const horizontal = new THREE.Vector3(1, 0, 0), point = new THREE.Vector3();
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.14, 2.05 + variation, -0.08),
      new THREE.Vector3(0.72 + open * 0.65, 6.00 - open * 0.45, -0.80 - open * 0.70),
      new THREE.Vector3(0.64 + open * 1.25, 4.15 - open * 0.72, 1.10 + open * 0.95),
    );
    const stride = columns + 1, surfaceSize = (segments + 1) * stride;

    for (const face of [1, -1]) {
      const offset = vertices.length / 3;
      for (let row = 0; row <= segments; row++) {
        const u = row / segments;
        curve.getPoint(u, center);
        curve.getTangent(u, tangent).normalize();
        // Project the transverse direction onto the normal plane. Its gradual
        // twist keeps the page a sheet, rather than an extruded round ribbon.
        lateral.copy(horizontal).addScaledVector(tangent, -horizontal.dot(tangent)).normalize();
        lateral.applyAxisAngle(tangent, -0.12 + u * (0.44 + open * 0.21));
        normal.crossVectors(lateral, tangent).normalize();
        const width = 1.12 + Math.sin(u * Math.PI) * 0.12;
        for (let column = 0; column <= columns; column++) {
          const v = column / columns - 0.5;
          const camber = (v * v - 0.10) * 0.18 * Math.sin(u * Math.PI);
          point.copy(center).addScaledVector(lateral, v * width)
            .addScaledVector(normal, camber + face * 0.006);
          vertices.push(point.x, point.y, point.z);
          uvs.push(column / columns, u * 3.6);
        }
      }
      const start = indices.length;
      for (let row = 0; row < segments; row++) for (let column = 0; column < columns; column++) {
        const a = offset + row * stride + column, b = a + stride;
        if (face > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
      groups.push({ start, count: indices.length - start, materialIndex: face > 0 ? 0 : 1 });
    }

    const edgeStart = indices.length;
    for (let row = 0; row < segments; row++) {
      const left = row * stride, right = left + columns;
      indices.push(left, left + stride, left + surfaceSize,
        left + stride, left + stride + surfaceSize, left + surfaceSize);
      indices.push(right, right + surfaceSize, right + stride,
        right + stride, right + surfaceSize, right + stride + surfaceSize);
    }
    for (let column = 0; column < columns; column++) {
      const end = segments * stride + column;
      indices.push(column, column + surfaceSize, column + 1,
        column + 1, column + surfaceSize, column + surfaceSize + 1);
      indices.push(end, end + 1, end + surfaceSize,
        end + 1, end + surfaceSize + 1, end + surfaceSize);
    }
    groups.push({ start: edgeStart, count: indices.length - edgeStart, materialIndex: 2 });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));
    geometry.computeBoundingSphere();
    return geometry;
  }

  const geometry = shape(0), expanded = shape(1);
  geometry.morphAttributes.position = [expanded.getAttribute("position").clone()];
  geometry.morphAttributes.normal = [expanded.getAttribute("normal").clone()];
  geometry.morphTargetsRelative = false;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  expanded.dispose();
  return geometry;
}

/** Seeded paper fibres: identical on every load, with no downloaded textures. */
export function createPaperGrain() {
  const size = 256, pixels = new Uint8Array(size * size * 4);
  let seed = 9181;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const random = (seed >>> 24) / 255;
    const fibres = Math.sin(y * 1.64 + Math.sin(x * 0.09) * 0.75);
    const grain = Math.round(153 + random * 72 + fibres * 8);
    const offset = (y * size + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = grain;
    pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(3, 6);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** Soft contact shadow complements the directional light without postprocessing. */
export function createContactShadow() {
  const size = 128, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = (x / (size - 1) - 0.5) * 2, py = (y / (size - 1) - 0.5) * 2;
    const radius = Math.sqrt(px * px + py * py);
    const alpha = Math.pow(Math.max(0, 1 - radius), 2.2) * 105;
    const offset = (y * size + x) * 4;
    pixels[offset] = 60; pixels[offset + 1] = 52; pixels[offset + 2] = 40;
    pixels[offset + 3] = alpha;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
