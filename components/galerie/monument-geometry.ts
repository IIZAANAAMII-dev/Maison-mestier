import * as T from "three";

/** A continuous folded sheet, with a full twist and real gilded edges. */
export function foldedRibbon(segments = 192, columns = 24) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const p = new T.Vector3(), tangent = new T.Vector3(), radial = new T.Vector3();
  const width = new T.Vector3(), normal = new T.Vector3(), point = new T.Vector3();
  const centre = (t: number, out: T.Vector3) => out.set(
    1.58 * Math.sin(t) * (1 + .12 * Math.cos(t)),
    2.56 + 1.79 * Math.cos(t),
    .42 * Math.sin(2 * t) - .12 * Math.cos(t),
  );
  const up = new T.Vector3(0, 0, 1), a = new T.Vector3(), b = new T.Vector3();
  const addSurface = (side: number) => {
    const offset = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments * Math.PI * 2;
      centre(t, p); centre(t + .001, a); centre(t - .001, b);
      tangent.subVectors(a, b).normalize();
      radial.crossVectors(tangent, up).normalize();
      const twist = t + .30 * Math.sin(2 * t) - .48;
      width.copy(radial).multiplyScalar(Math.cos(twist)).addScaledVector(up, Math.sin(twist)).normalize();
      normal.crossVectors(tangent, width).normalize();
      const breadth = .88 + .24 * Math.sin(t - .3);
      for (let j = 0; j <= columns; j++) {
        const v = j / columns * 2 - 1;
        // The shallow transverse curl lets light graze the sheet instead of looking like plastic.
        point.copy(p).addScaledVector(width, v * breadth * .5)
          .addScaledVector(normal, .018 * side + .065 * v * v * Math.sin(t + .3));
        positions.push(point.x, point.y, point.z); uv.push(i / segments * 4, j / columns);
      }
    }
    const start = indices.length;
    for (let i = 0; i < segments; i++) for (let j = 0; j < columns; j++) {
      const x = offset + i * (columns + 1) + j, y = x + columns + 1;
      if (side > 0) indices.push(x, y, x + 1, y, y + 1, x + 1);
      else indices.push(x, x + 1, y, y, x + 1, y + 1);
    }
    return { start, count: indices.length - start };
  };
  const paper = addSurface(1), brass = addSurface(-1), edgeStart = indices.length;
  const surface = (segments + 1) * (columns + 1);
  for (let i = 0; i < segments; i++) for (const side of [0, columns]) {
    const a = i * (columns + 1) + side, b = a + columns + 1;
    indices.push(a, a + surface, b, b, a + surface, b + surface);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  geometry.addGroup(paper.start, paper.count, 0); geometry.addGroup(brass.start, brass.count, 1);
  geometry.addGroup(edgeStart, indices.length - edgeStart, 2);
  return geometry;
}

/** Procedural micro-grain: no external image or texture waterfall. */
export function materialGrain() {
  const size = 256, bytes = new Uint8Array(size * size * 4);
  let seed = 733;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const noise = (seed >>> 24) / 255;
    const fibre = Math.sin(y * 2.1 + Math.sin(x * .03) * 2) * 5;
    const value = Math.round(180 + noise * 42 + fibre);
    const i = (y * size + x) * 4;
    bytes[i] = bytes[i + 1] = bytes[i + 2] = value; bytes[i + 3] = 255;
  }
  const texture = new T.DataTexture(bytes, size, size, T.RGBAFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = T.LinearFilter; texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.repeat.set(7, 3); texture.needsUpdate = true;
  return texture;
}
