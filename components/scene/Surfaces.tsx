import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { image } from "../../lib/maison";

export function useGrain(kind: "papier" | "pierre") {
  const invalidate = useThree(state => state.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const side = kind === "pierre" ? 512 : 256;
    canvas.width = canvas.height = side;
    const ctx = canvas.getContext("2d")!;
    const data = ctx.createImageData(side, side);
    let seed = 37;
    const random = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        const grain = (random() - 0.5) * (kind === "papier" ? 21 : 26);
        const stoneBed = y * .027 + 3.7 * Math.sin(x*.012 + Math.sin(y*.017)) + 1.15*Math.cos(x*.043);
        const line = kind === "papier"
          ? (y % 6 === 0 ? -13 : 1) + (x % 85 === 0 ? -7 : 0)
          : 8 * Math.cos(stoneBed) - 16*Math.pow(Math.max(0,Math.sin(stoneBed * 2.5)),4)
              + 6*Math.sin(x*.062+Math.sin(y*.07)) + 3*Math.sin((x+y)*.14);
        const shade = (kind === "papier" ? 238 : 225) + grain + line;
        const p = (y * side + x) * 4;
        data.data[p] = shade; data.data[p + 1] = shade - 3; data.data[p + 2] = shade - 8;
        data.data[p + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    if (kind === "pierre") {
      for (let i=0;i<1600;i++) {
        const x = random()*side, y = random()*side;
        const pit = .35 + Math.pow(random(),2)*2.5;
        ctx.fillStyle = "rgba(87,65,43," + (.09 + random()*.24) + ")";
        ctx.beginPath(); ctx.ellipse(x,y,pit,pit*(.25+random()*.4),random()*.6,0,Math.PI*2); ctx.fill();
      }
    }
    const result = new THREE.CanvasTexture(canvas);
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.repeat.set(kind === "pierre" ? 3 : 2.5, kind === "pierre" ? 1.8 : 1.6);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [kind]);
  useEffect(() => {
    if (kind !== "papier") return;
    const fiber = new Image();
    fiber.onload = () => {
      const c = texture.image.getContext("2d");
      if (!c) return;
      c.save();
      c.globalCompositeOperation = "soft-light";
      c.globalAlpha = .76;
      c.drawImage(fiber,0,0,texture.image.width,texture.image.height);
      c.restore();
      texture.needsUpdate = true;
      invalidate();
    };
    fiber.src = image("pli-verge");
    return () => { fiber.onload = null; };
  }, [kind, texture, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
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
    <meshStandardMaterial color={color} metalness={metal} roughness={metal ? .31 : .82} map={grain} />
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
