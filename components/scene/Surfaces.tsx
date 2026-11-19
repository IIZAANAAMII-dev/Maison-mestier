import { useEffect, useMemo } from "react";
import { useLoader, useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { path } from "../../lib/maison";

const scans = {
  paper: ["papier-fibres"],
  stone: ["travertin-couleur", "travertin-normale", "travertin-relief"],
  brass: ["metal-brosse-normale", "metal-brosse-relief"],
};
type Surface = keyof typeof scans;

function useTiles(surface: Surface, u: number, v: number, offset = 0) {
  const names = scans[surface];
  const originals = useLoader(THREE.TextureLoader, names.map(name => path("/matieres/" + name + ".webp")));
  const maxAnisotropy = useThree(state => state.gl.capabilities.getMaxAnisotropy());
  const tiles = useMemo(() => originals.map((original, index) => {
    // A face and an edge may be different cuts of the same scan. Keep their transforms independent.
    const tile = original.clone();
    tile.colorSpace = names[index] === "travertin-couleur" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
    tile.repeat.set(u, v);
    tile.offset.set(.13, offset);
    tile.anisotropy = Math.min(4, maxAnisotropy);
    tile.needsUpdate = true;
    return tile;
  }), [originals, names, u, v, offset, maxAnisotropy]);
  useEffect(() => () => tiles.forEach(tile => tile.dispose()), [tiles]);
  return tiles;
}

export function usePaper(u = 2.1, v = 1.24) {
  return useTiles("paper", u, v)[0];
}

const paperChannels: THREE.MeshStandardMaterial["onBeforeCompile"] = shader => {
  // The photographed sample carries linear reflectance, height and roughness in that order.
  // Read once so the fibres, their raking shadow and their gloss stay registered.
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <map_fragment>", "vec3 pulp = texture2D(map, vMapUv).rgb; diffuseColor.rgb *= pulp.r;")
    .replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness * pulp.b;")
    .replace("#include <normal_fragment_maps>", "normal = perturbNormalArb(-vViewPosition, normal, bumpScale * vec2(dFdx(pulp.g), dFdy(pulp.g)), faceDirection);");
};

export function PaperStock({ texture, ...finish }: ThreeElements["meshStandardMaterial"] & {texture: THREE.Texture}) {
  return <meshStandardMaterial {...finish} map={texture} bumpMap={texture} bumpScale={.14}
    roughness={1} onBeforeCompile={paperChannels} />;
}

const stoneChannels: THREE.MeshStandardMaterial["onBeforeCompile"] = shader => {
  shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>",
    "vec2 stoneCut = texture2D(roughnessMap, vRoughnessMapUv).rg; float roughnessFactor = roughness * stoneCut.g; diffuseColor.rgb *= mix(.93, 1., smoothstep(.16, .80, stoneCut.r));");
};

export function StoneFinish({ edge = false, night }: {edge?: boolean; night: boolean}) {
  const [colour, normal, relief] = useTiles("stone", edge ? 4.15 : 1.42, edge ? .18 : 1.13, edge ? .37 : .15);
  return <meshStandardMaterial color={night ? "#a79a82" : "#ece3cc"} map={colour}
    normalMap={normal} normalScale={[.82,.82]} roughnessMap={relief} roughness={.95} onBeforeCompile={stoneChannels} />;
}

export function BrassFinish(finish: ThreeElements["meshPhysicalMaterial"]) {
  const [normal, relief] = useTiles("brass", 2.8, 1.17, .12);
  return <meshPhysicalMaterial {...finish} metalness={.89} normalMap={normal} normalScale={[.17,.17]}
    roughnessMap={relief} roughness={.82} />;
}

type BoxProps = {
  size: [number, number, number]; at: [number, number, number]; color: string;
  radius?: number; metal?: number; grain?: THREE.Texture; rotation?: [number, number, number];
};
export function Block({ size, at, color, radius = .035, metal = 0, grain, rotation }: BoxProps) {
  const [x, y, z] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(x, y, z, 2, radius), [x, y, z, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={at} rotation={rotation} castShadow receiveShadow>
    {grain ? <PaperStock texture={grain} color={color} /> : <meshStandardMaterial color={color} metalness={metal} roughness={metal ? .31 : .82} />}
  </mesh>;
}

export function Counter({ scale = 1 }: {scale?: number}) {
  return <group scale={scale} position={[.25, .02, -.18]}>
    <mesh castShadow receiveShadow position={[.16, .335, .03]}>
      <cylinderGeometry args={[.505,.52,.61,76]} /><meshStandardMaterial color="#a98854" metalness={.8} roughness={.38} />
    </mesh>
    <Flutes />
    <mesh position={[.16,.654,.03]} receiveShadow castShadow>
      <cylinderGeometry args={[.548,.548,.046,80]} /><meshStandardMaterial color="#d5c7ac" roughness={.64} />
    </mesh>
    <mesh position={[.16,.037,.03]}><cylinderGeometry args={[.50,.482,.065,70]} /><meshStandardMaterial color="#655239" roughness={.43} metalness={.75} /></mesh>
    <group position={[-.85,0,-.35]} rotation={[0,.18,0]}>
      <Block size={[.70,.14,.34]} at={[0,.335,0]} color="#bead92" radius={.055} />
      {[-.24,.24].map(x => <Block key={x} size={[.055,.28,.235]} at={[x,.17,0]} color="#88724e" metal={.81} radius={.01} />)}
    </group>
    <mesh position={[.11,.741,.06]} castShadow>
      <cylinderGeometry args={[.145,.165,.12,48]} /><meshStandardMaterial color="#9a8062" roughness={.76} />
    </mesh>
  </group>;
}

function Flutes() {
  const radii = useMemo(() => {
    const count = 240, h = .599;
    const g = new THREE.CylinderGeometry(.5,.513,h,count,1,true);
    const p = g.getAttribute("position");
    for (let i=0; i<p.count; i++) {
      const x=p.getX(i), z=p.getZ(i), radius=Math.hypot(x,z);
      const r = radius + .012 + .012*Math.cos(48*Math.atan2(x,z));
      p.setXYZ(i,x*r/radius,p.getY(i),z*r/radius);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => radii.dispose(), [radii]);
  return <mesh position={[.16,.331,.03]} geometry={radii} castShadow receiveShadow>
    <meshStandardMaterial color="#af905a" metalness={.82} roughness={.38} />
  </mesh>;
}
