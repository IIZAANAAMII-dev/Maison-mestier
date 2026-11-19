import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Block, BrassFinish, usePaper } from "./Surfaces";

const handleProfile = [
  [.35,0], [.43,.07], [.43,.15], [.31,.23], [.21,.34], [.18,.48],
  [.22,.83], [.33,1.22], [.37,1.42], [.31,1.56], [.08,1.62], [0,1.62],
].map(([x,y]) => new THREE.Vector2(x,y));

function sealGeometry() {
  const radialProfile = [
    [.001,.104], [.62,.104], [.70,.101], [.72,.081], [.75,.082],
    [.78,.122], [.83,.127], [.90,.165], [.97,.162], [1.06,.087], [1.07,.035], [1.02,0], [.001,0],
  ];
  const vertices: number[] = [], indices: number[] = [];
  const segments = 128;
  radialProfile.forEach(([radius,height], ring) => {
    for (let i=0;i<=segments;i++) {
      const theta = i/segments * Math.PI*2;
      const edge = THREE.MathUtils.smoothstep(radius,.74,1.05);
      const ripple = Math.sin(5*theta+.3)*.054 + Math.sin(8*theta-1.1)*.026 + Math.cos(13*theta+.4)*.012;
      const r = radius + ripple*edge;
      const y = height + edge * (.014*Math.sin(7*theta+.45) + .01*Math.sin(12*theta));
      vertices.push(r*Math.cos(theta), y, r*Math.sin(theta));
      if (!ring || !i) continue;
      const a=ring*(segments+1)+i, b=a-segments-1;
      indices.push(a-1,b-1,b, a-1,b,a);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// A draft pair of engraved initials with tapered strokes and short serifs.
function initial() {
  const s=new THREE.Shape();
  s.moveTo(-.32,-.27);
  s.lineTo(-.19,.265); s.lineTo(-.23,.28); s.lineTo(-.23,.306);
  s.lineTo(-.09,.306); s.lineTo(.012,-.087); s.lineTo(.25,.306); s.lineTo(.335,.306);
  s.lineTo(.33,.28); s.lineTo(.295,.27); s.lineTo(.195,-.253);
  s.lineTo(.245,-.265); s.lineTo(.24,-.293); s.lineTo(.04,-.293);
  s.lineTo(.046,-.265); s.lineTo(.096,-.253); s.lineTo(.18,.158);
  s.lineTo(-.056,-.23); s.lineTo(-.091,-.23); s.lineTo(-.183,.15);
  s.lineTo(-.273,-.253); s.lineTo(-.21,-.265); s.lineTo(-.216,-.293);
  s.lineTo(-.382,-.293); s.lineTo(-.377,-.267); s.closePath();
  return s;
}
const glyph = initial();
const glyphOptions = { depth:.017, bevelEnabled:true, bevelSize:.004, bevelThickness:.005, bevelSegments:2, steps:1 };

export function Seal({ progress }: {progress: number}) {
  const paper = usePaper();
  const wax = useMemo(sealGeometry, []);
  useEffect(() => () => wax.dispose(), [wax]);
  const down = THREE.MathUtils.smoothstep(progress,.05,.54) - THREE.MathUtils.smoothstep(progress,.61,.99);
  const mark = THREE.MathUtils.smoothstep(progress,.49,.65);
  return <group>
    <Block at={[0,.047,0]} size={[4.6,.08,2.74]} color="#f8efe0" grain={paper} rotation={[0,-.10,0]} radius={.012} />
    <Block at={[.11,.099,.02]} size={[4.15,.025,2.45]} color="#fff7e6" grain={paper} rotation={[0,.045,0]} radius={.008} />
    <group position={[0,.115,0]} scale={[1 + .05*down,1 - .14*down,1 + .05*down]}>
      <mesh geometry={wax} castShadow receiveShadow>
        <meshPhysicalMaterial color="#751f19" metalness={.06} roughness={.42} clearcoat={.29} clearcoatRoughness={.46} />
      </mesh>
      <group position={[0,.101,0]} rotation={[-Math.PI/2,0,-.14]} scale={[1,1,mark]} visible={mark > 0}>
        {[-.22,.22].map(x => <mesh key={x} position={[x,0,0]} castShadow>
          <extrudeGeometry args={[glyph,glyphOptions]} /><meshStandardMaterial color="#68201b" roughness={.38} />
        </mesh>)}
      </group>
    </group>
    <group position={[.68*(1-down),.205+(1-down)*1.46,-.48*(1-down)]} rotation={[.10*(1-down),-.12,-.23*(1-down)]}>
      <mesh position={[0,.125,0]} castShadow><cylinderGeometry args={[.76,.785,.23,80]} /><BrassFinish color="#b09255" /></mesh>
      <mesh position={[0,.274,0]} castShadow><cylinderGeometry args={[.43,.70,.10,80]} /><BrassFinish color="#bd9c58" /></mesh>
      <mesh position={[0,.33,0]} castShadow><latheGeometry args={[handleProfile,64]} /><meshPhysicalMaterial color="#352820" metalness={.06} roughness={.32} clearcoat={.34} clearcoatRoughness={.35} /></mesh>
      <mesh position={[0,.61,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.254,.018,10,64]} /><meshStandardMaterial color="#b39a62" metalness={.92} roughness={.25} /></mesh>
    </group>
  </group>;
}
