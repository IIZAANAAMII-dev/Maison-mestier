import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { Seal } from "../scene/Seal";
import { path } from "../../lib/maison";
import { BrassFinish, PaperStock, usePaper } from "../scene/Surfaces";

const tau = Math.PI * 2;

function Fil({ points, rayon = .012, couleur = "#af8951", metal = .75 }: { points: THREE.Vector3[]; rayon?: number; couleur?: string; metal?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  return <mesh castShadow>
    <tubeGeometry args={[curve, Math.max(12, points.length * 2), rayon, 6, false]} />
    <meshStandardMaterial color={couleur} metalness={metal} roughness={metal ? .36 : .76} />
  </mesh>;
}

function nappe(u: number, v: number) {
  const x = (u - .5) * 3.65;
  return new THREE.Vector3(x, .26 + 1.25 * v + .62 * Math.sin(u * tau - .6) * (.45 + v * .55),
    (v - .5) * -1.88 + .64 * Math.sin(u * Math.PI - .2) + .16 * Math.sin(u * tau + v * 3));
}

function tissu(fn: (u: number, v: number) => THREE.Vector3, width: number, height: number) {
  const vertices: number[] = [], uv: number[] = [], triangles: number[] = [];
  for (let j = 0; j <= height; j++) {
    for (let i = 0; i <= width; i++) {
      const u = i / width, v = j / height;
      vertices.push(...fn(u, v).toArray());
      uv.push(u, v);
      if (!i || !j) continue;
      const a = j * (width + 1) + i;
      triangles.push(a - width - 2, a - width - 1, a, a - width - 2, a, a - 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

export function Trame() {
  const geometry = useMemo(() => tissu(nappe, 52, 26), []);
  const grid = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let col = 0; col <= 32; col++) {
      for (let row = 0; row < 16; row++) points.push(nappe(col / 32, row / 16), nappe(col / 32, (row + 1) / 16));
    }
    for (let row = 0; row <= 16; row++) {
      for (let col = 0; col < 64; col++) points.push(nappe(col / 64, row / 16), nappe((col + 1) / 64, row / 16));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  const rims = useMemo(() => [0, 1].map(v => Array.from({length: 48}, (_, i) => nappe(i / 47, v))), []);
  useEffect(() => () => { geometry.dispose(); grid.dispose(); }, [geometry, grid]);
  return <group rotation={[.08, -.14, -.04]}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#263e40" roughness={.52} metalness={.38} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1}/>
    </mesh>
    <lineSegments geometry={grid}><lineBasicMaterial color="#d7b778" /></lineSegments>
    {rims.map((points, i) => <Fil key={i} points={points} rayon={.017} />)}
  </group>;
}

const silhouette = new THREE.Shape();
silhouette.moveTo(0, 0);
silhouette.lineTo(.7, 0);
silhouette.lineTo(.7, 1.68);
silhouette.bezierCurveTo(.64, 1.93, .46, 2.17, .27, 2.22);
silhouette.bezierCurveTo(.1, 2.26, 0, 2.13, 0, 1.96);
silhouette.closePath();
const paraventEtui = { depth: .04, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, curveSegments: 18 };
const hinges = Array.from({length: 6}, (_, i) => {
  const angle = i % 2 ? -.56 : .62;
  return { x: (i - 3) * .58 + .1, z: i % 2 ? .03 : .44, angle };
});
const lamelles = ["#dcb99a", "#e9d5b8", "#758578", "#536a5d", "#c4af94", "#e0c9a8"];

export function Paravent() {
  const grain = usePaper(1, 2);
  return <group rotation={[0, -.1, 0]}>
    {hinges.map((leaf, i) => <group key={i} position={[leaf.x, .035, leaf.z]} rotation={[0, leaf.angle, 0]}>
      <mesh castShadow receiveShadow><extrudeGeometry args={[silhouette, paraventEtui]} /><PaperStock color={lamelles[i]} texture={grain} /></mesh>
      <mesh position={[0, .94, .028]}><cylinderGeometry args={[.018, .018, 1.85, 10]} /><BrassFinish color="#ab8752" /></mesh>
      {[.12, .24, .36, .48, .6].map(x => <mesh key={x} position={[x, .86, .055]}>
        <boxGeometry args={[.006, 1.59, .004]} /><meshStandardMaterial color={i === 2 || i === 3 ? "#a89c75" : "#aa9370"} roughness={.75} />
      </mesh>)}
    </group>)}
  </group>;
}

export function CachetMaison() {
  const drawing = useLoader(SVGLoader, path("/charte/monogramme-cachet.svg"));
  const engraved = useMemo(() => {
    const shapes = drawing.paths.flatMap(outline => outline.toShapes());
    const geometry = new THREE.ExtrudeGeometry(shapes, {depth:24,bevelEnabled:true,bevelSize:3,bevelThickness:3,bevelSegments:1,curveSegments:4});
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.01 / (bounds.max.x-bounds.min.x);
    geometry.translate(-center.x,-center.y,0);
    geometry.scale(scale,scale,scale);
    return geometry;
  }, [drawing]);
  useEffect(() => () => engraved.dispose(), [engraved]);
  return <group>
    <Seal progress={0}/>
    <mesh position={[0,.221,0]} rotation={[-Math.PI/2,0,0]} scale={[1,-1,1]} geometry={engraved} receiveShadow castShadow>
      <meshStandardMaterial color="#652019" roughness={.56} metalness={.015}/>
    </mesh>
  </group>;
}

export function Optique() {
  const yoke = useMemo(() => Array.from({length: 45}, (_, i) => {
    const a = Math.PI + Math.PI * i / 44;
    return new THREE.Vector3(1.26 * Math.cos(a), 1.61 + 1.17 * Math.sin(a), 0);
  }), []);
  return <group rotation={[0, -.37, -.015]}>
    <mesh position={[0,.095,0]} castShadow><cylinderGeometry args={[.78,.89,.17,68]} /><BrassFinish color="#a1845d" /></mesh>
    <mesh position={[0,.28,0]} castShadow><cylinderGeometry args={[.12,.23,.34,32]} /><meshStandardMaterial color="#29312c" roughness={.47} metalness={.46}/></mesh>
    <Fil points={yoke} rayon={.056} couleur="#766046" />
    <group position={[0,1.60,0]} rotation={[-.18,0,-.13]}>
      {[-.085, .085].map(z => <mesh key={z} position={[0,0,z]} castShadow><torusGeometry args={[1.09,.051,12,96]} /><BrassFinish color="#ab8752" /></mesh>)}
      <mesh rotation={[Math.PI / 2,0,0]} castShadow><cylinderGeometry args={[1.09,1.09,.13,96,1,true]} /><meshStandardMaterial color="#3b483f" roughness={.39} metalness={.56} side={THREE.DoubleSide}/></mesh>
      <mesh scale={[1.053,1.053,.122]}><sphereGeometry args={[1,64,32]} /><meshPhysicalMaterial color="#88998b" roughness={.2} metalness={.28} transparent opacity={.46} clearcoat={1} side={THREE.FrontSide} depthWrite={false}/></mesh>
      {[.25,.39,.52,.65,.77,.88,.98].map(r => <mesh key={r} position={[0,0,.12 * Math.sqrt(1-r*r)]}><torusGeometry args={[r,.0055,4,82]} /><meshStandardMaterial color="#c8ba88" metalness={.68} roughness={.22}/></mesh>)}
      {[-1.17,1.17].map(x => <mesh key={x} position={[x,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.083,.083,.21,18]} /><BrassFinish color="#ab8752" /></mesh>)}
    </group>
  </group>;
}

function cheminFilm(u: number, v: number) {
  const x = (u - .5) * 4.25, ridge = Math.sin(u * tau - 1.18);
  return new THREE.Vector3(x, 1.06 + .44 * ridge + (v - .5) * 1.14, .64 * Math.sin(tau * u + .25) + (v - .5) * (.24 + .22 * ridge));
}

export function Pellicule() {
  const map = useLoader(THREE.TextureLoader, path("/galerie-metiers/pellicule.webp"));
  map.colorSpace = THREE.SRGBColorSpace;
  const film = useMemo(() => tissu(cheminFilm, 88, 4), []);
  const rims = useMemo(() => [0, 1].map(v => Array.from({length: 48}, (_, i) => cheminFilm(i / 47, v))), []);
  useEffect(() => () => film.dispose(), [film]);
  return <group rotation={[0,-.11,-.12]}>
    <mesh geometry={film} castShadow><meshStandardMaterial map={map} roughness={.51} metalness={.075} side={THREE.DoubleSide}/></mesh>
    {rims.map((points, i) => <Fil key={i} points={points} rayon={.009} couleur="#957948"/>)}
  </group>;
}

class Lacet extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * tau;
    return target.set(.65*(Math.sin(a) + 2*Math.sin(2*a)), .52 - .37*Math.sin(3*a), .52 * (Math.cos(a) - 2*Math.cos(2*a)));
  }
}

export function Noeud() {
  const noeud = useMemo(() => new Lacet(), []);
  const galons = useMemo(() => {
    const n = 390, frames = noeud.computeFrenetFrames(n, true);
    return [0, Math.PI * 2 / 3, Math.PI * 4 / 3].map(phase => Array.from({length:n + 1}, (_, i) => {
      const t = i / n, a = t * tau * 37 + phase;
      return noeud.getPoint(t).addScaledVector(frames.normals[i], .058 * Math.cos(a)).addScaledVector(frames.binormals[i], .058 * Math.sin(a));
    }));
  }, [noeud]);
  return <group rotation={[.11,-.29,-.025]}>
    <mesh castShadow receiveShadow><tubeGeometry args={[noeud, 230, .079, 10, true]}/><meshStandardMaterial color="#873528" roughness={.7}/></mesh>
    {galons.map((points,i) => <Fil key={i} points={points} rayon={.067} couleur={["#a54532","#813329","#a65641"][i]} metal={0}/>)}
  </group>;
}
