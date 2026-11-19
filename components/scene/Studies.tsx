import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Counter, useGrain } from "./Surfaces";

const lineCount = 48;
function makeLattice() {
  const surface = new THREE.PlaneGeometry(5.1, 2.8, lineCount, 28);
  surface.rotateX(-Math.PI / 2);
  const grid = new THREE.BufferGeometry();
  grid.setAttribute("position", surface.getAttribute("position"));
  const indices = [];
  for (let row=0; row<=28; row++) for (let col=0; col<=lineCount; col++) {
    const n = row * (lineCount+1) + col;
    if (col < lineCount) indices.push(n, n+1);
    if (row < 28) indices.push(n, n+lineCount+1);
  }
  grid.setIndex(indices);
  return { surface, grid };
}
export function Lattice({progress}: {progress: number}) {
  const shapes = useMemo(makeLattice, []);
  const grain = useGrain("papier");
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    const pos = shapes.surface.getAttribute("position") as THREE.BufferAttribute;
    for (let i=0; i<pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const radius = Math.hypot(x*.83,z);
      const impression = .30 * Math.exp(-Math.pow((radius-.79)/.14, 2));
      const wave = .68 + .55 * Math.sin(x*1.32 + z*1.6 + progress) * Math.cos(z*1.26);
      pos.setY(i, .12 + impression*(1-progress) + wave*progress);
    }
    pos.needsUpdate = true;
    shapes.surface.computeVertexNormals();
    shapes.surface.computeBoundingSphere();
    shapes.grid.computeBoundingSphere();
    invalidate();
  }, [progress, shapes, invalidate]);
  useEffect(() => () => { shapes.grid.dispose(); shapes.surface.dispose(); }, [shapes]);
  return <group>
    <mesh geometry={shapes.surface} castShadow={progress<.9} receiveShadow>
      <meshStandardMaterial color="#f8f3e2" map={grain} roughness={.84} transparent opacity={1-progress*.97} depthWrite={progress<.8} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={2} />
    </mesh>
    <lineSegments geometry={shapes.grid} position={[0,.007,0]}><lineBasicMaterial color="#444e60" transparent opacity={progress*.85} /></lineSegments>
    <points geometry={shapes.surface} position={[0,.018,0]}><pointsMaterial color="#802e28" size={1.65} transparent opacity={progress*.88} /></points>
  </group>;
}

function Curtain({ side, open }: { side: number; open: number }) {
  const cloth = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.98,2.6,64,8);
    const p=g.getAttribute("position");
    for (let i=0; i<p.count; i++) {
      const x=p.getX(i), y=p.getY(i);
      const crease = Math.sin(x*19 + .18*Math.sin(y*1.9)) * (1.28-y*.13);
      p.setZ(i, .106*crease + .018*Math.sin(x*39));
      p.setY(i,y + .025*(1.3-y)/2.6*Math.cos(x*19));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => cloth.dispose(),[cloth]);
  return <mesh geometry={cloth} position={[side*(.98+open*.70),1.38,1.03]} scale={[1-open*.64,1,1]} castShadow receiveShadow>
    <meshPhysicalMaterial color="#263d30" side={THREE.DoubleSide} roughness={.94} sheen={1} sheenRoughness={.75} sheenColor="#788574" />
  </mesh>;
}

function Arcade() {
  const grain = useGrain("papier");
  const arch = useMemo(() => {
    const panel = new THREE.Shape();
    panel.moveTo(-1.98,0); panel.lineTo(1.98,0); panel.lineTo(1.98,2.53);
    panel.lineTo(-1.98,2.53); panel.closePath();
    const niche = new THREE.Path();
    niche.moveTo(.37,.13); niche.lineTo(.37,1.28);
    niche.absarc(.84,1.28,.47,Math.PI,0,true);
    niche.lineTo(1.31,.13); niche.closePath(); panel.holes.push(niche);
    return new THREE.ExtrudeGeometry(panel,{depth:.07,bevelEnabled:true,bevelSegments:2,bevelThickness:.014,bevelSize:.015,curveSegments:24});
  }, []);
  useEffect(() => () => arch.dispose(), [arch]);
  return <group>
    <Block at={[0,1.40,-1.16]} size={[4.08,2.62,.085]} color="#614f38" />
    <mesh geometry={arch} position={[0,.12,-.97]} castShadow receiveShadow>
      <meshStandardMaterial color="#d0bb97" roughness={.89} />
    </mesh>
    <Block at={[.84,.78,-1.075]} size={[.14,1.04,.048]} color="#aa8c52" metal={.73} />
    <mesh position={[.84,1.40,-1.06]}><sphereGeometry args={[.14,30,20]} /><meshStandardMaterial color="#a0844f" roughness={.32} metalness={.8} /></mesh>
    <Block at={[-1.21,1.13,-.76]} size={[.8,1.97,.07]} color="#d7c6a6" grain={grain} rotation={[0,-.22,-.09]} />
  </group>;
}

export function Scenography({progress}: {progress: number}) {
  const open=THREE.MathUtils.smoothstep(progress,0,1);
  return <group>
    <Block size={[4.3,.11,2.9]} at={[0,.035,0]} color="#81765d" />
    <Block size={[4.35,.09,2.2]} at={[0,2.73,0]} color="#b38b51" metal={.82} />
    <Arcade />
    {[-2.02,2.02].map(x => <Block key={x} size={[.12,2.67,2.15]} at={[x,1.38,0]} color="#ada087" />)}
    <Counter scale={1.18} />
    <Curtain side={-1} open={open} /><Curtain side={1} open={open} />
    <pointLight position={[-.67,2.37,.38]} intensity={.6+open*6.7} color="#ffc68c" distance={6} decay={2} />
    <pointLight position={[.80,1.76,-.64]} intensity={.35+open*1.7} color="#ffd28c" distance={2.2} decay={2} />
    <mesh position={[-.68,2.64,.26]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.103,36]} /><meshBasicMaterial color="#fff0cc" /></mesh>
  </group>;
}
