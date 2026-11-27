import * as T from "three";

type Pose = "plume" | "eventail" | "portique";

const layers = 43;
const along = 68;
const pi = Math.PI;
const section = [
  [-.5, -.68], [-.485, .14], [-.465, .78], [-.36, 1],
  [.36, .85], [.465, .6], [.495, .04], [.5, -.67], [.47, -.92], [-.46, -1], [-.5, -.68],
];
const shell = new T.Vector3();
const edge = new T.Vector3();
const work = new T.Vector3();
const side = new T.Vector3();
const tangent = new T.Vector3();
const normal = new T.Vector3();
const out = new T.Vector3();

// Each lamina follows a different section through the same bound object.
// Its gilded bevel has a physical width, so the highlights survive a change of scale.
function profile(pose: Pose, t: number, leaf: number, point: T.Vector3, across?: T.Vector3) {
  const f = leaf * 2 - 1;
  if (pose === "portique") {
    const spring = .235;
    let x: number, y: number, nx: number, ny: number;
    if (t < spring) {
      const rise = t / spring;
      x = -1.48; y = -1.62 + rise * 1.78; nx = -1; ny = 0;
    } else if (t > 1 - spring) {
      const fall = (t - (1 - spring)) / spring;
      x = 1.48; y = .16 - fall * 1.78; nx = 1; ny = 0;
    } else {
      const a = pi * (1 - (t - spring) / (1 - spring * 2));
      x = Math.cos(a) * 1.48; y = .16 + Math.sin(a) * 1.50;
      nx = Math.cos(a); ny = Math.sin(a);
    }
    const crown = (y + 1.62) / 3.28;
    const torsion = -.16 * f + .13 * crown;
    const depth = f * 1.14;
    point.set(x + .11 * f + Math.sin(torsion) * depth, y + .16 * f * crown,
      depth - .23 * Math.sin(t * pi) + .15 * x * crown);
    across?.set(nx * .37, ny * .37, .018 * Math.sin(t * 2 * pi));
    return;
  }

  const open = pose === "eventail" ? 1 : 0;
  const angle = (-.98 + (1.78 + .13 * open) * t) * pi;
  const sine = Math.sin(angle), cosine = Math.cos(angle);
  // The two ends of the crescent are cut to different lengths, like the head and tail of a feather.
  const breadth = .14 + .60 * Math.sin(pi * (.015 + t * .96)) ** .66 + .10 * (1-t);
  const radius = 1.30 + .17 * Math.cos(angle - .2) + .13 * f + open * .17;
  const x = radius * cosine + .15 * sine + .17 * f;
  const y = (radius * 1.11 + .06 * f) * sine + .45 * f;
  const yaw = f * (.87 + open * .30) + .12 + .22 * Math.sin(angle - .28);
  const z = f * (.87 + open * .24) + .31 * sine + .43 * Math.sin(angle * 1.28 + f * .65);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  point.set(x * c + z * s, y, z * c - x * s);
  if (across) {
    const ribbonTwist = -.14 + .55 * Math.sin(angle - .48) + .23 * f;
    const rx = cosine * Math.cos(ribbonTwist), ry = sine * Math.cos(ribbonTwist), rz = Math.sin(ribbonTwist);
    across.set((rx * c + rz * s) * breadth, ry * breadth, (rz * c - rx * s) * breadth);
  }
}

function geometry(pose: Pose, sharedIndex?: T.BufferAttribute) {
  const count = layers * (along + 1) * section.length;
  const positions = new Float32Array(count * 3);
  // The fan and the vault need only a new position/normal pair. Their index and
  // paper grain coordinates are identical to the first pose.
  const layout = sharedIndex ? null : {
    uv: new Float32Array(count * 2),
    details: new Float32Array(count * 3),
    faces: new Uint16Array(layers * along * (section.length-1) * 6),
  };
  let at=0, face=0;
  for (let i=0; i<layers; i++) {
    const leaf = i / (layers - 1);
    for (let k=0; k<=along; k++) {
      const t=k/along;
      profile(pose, t, leaf, shell, side);
      profile(pose, Math.max(0,t-.0008), leaf, edge);
      profile(pose, Math.min(1,t+.0008), leaf, work);
      tangent.subVectors(work,edge).normalize();
      normal.crossVectors(tangent,side).normalize();
      const gauge = pose === "portique" ? .017 : .012;
      for (let j=0;j<section.length;j++,at++) {
        const [v,h] = section[j];
        out.copy(shell).addScaledVector(side,v).addScaledVector(normal,h*gauge);
        out.toArray(positions,at*3);
        if (!layout) continue;
        layout.uv[at*2]=t*3.4; layout.uv[at*2+1]=v+.5;
        layout.details[at*3] = (j===0||j===1||j===6||j===7||j===10) ? 1 : 0;
        layout.details[at*3+1] = i===0 || i===layers-1 ? 1 : .55+.33*Math.abs(v*2)**.82;
        layout.details[at*3+2] = .5+.5*Math.sin(i*27.19);
        if (j+1<section.length && k<along) {
          const next = at+section.length;
          layout.faces[face++]=at; layout.faces[face++]=at+1; layout.faces[face++]=next;
          layout.faces[face++]=at+1; layout.faces[face++]=next+1; layout.faces[face++]=next;
        }
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute("position",new T.BufferAttribute(positions,3));
  if (layout) {
    g.setAttribute("uv",new T.BufferAttribute(layout.uv,2));
    g.setAttribute("finish",new T.BufferAttribute(layout.details,3));
    g.setIndex(new T.BufferAttribute(layout.faces,1));
  } else if (sharedIndex) {
    g.setIndex(sharedIndex);
  }
  g.computeVertexNormals();
  return g;
}

export function paperVolume() {
  const base=geometry("plume");
  const index=base.getIndex()!;
  const fan=geometry("eventail",index), arch=geometry("portique",index);
  base.morphAttributes.position=[fan.getAttribute("position"),arch.getAttribute("position")];
  base.morphAttributes.normal=[fan.getAttribute("normal"),arch.getAttribute("normal")];
  base.computeBoundingSphere();
  return base;
}
