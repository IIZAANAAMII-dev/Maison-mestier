import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { image } from "../../../lib/maison";

export const clamp = THREE.MathUtils.clamp;
export const ease = (v: number, low: number, high: number) => THREE.MathUtils.smoothstep(v, low, high);

/** A repeatable material grain, shared by all instances in the chamber. */
function sample(kind: "stone" | "brass" | "wood" | "cloth" | "paper") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(384, 384);
  let seed = 2417;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const veined=kind==="wood" || kind==="stone";
  for (let y = 0; y < 384; y++) for (let x = 0; x < 384; x++) {
    const i = (y * 384 + x) * 4;
    const vein = veined ? Math.sin(x*.041 + .8*Math.sin(y*.032) + 1.3*Math.sin(x*.008+y*.013)) : 0;
    let value: number;
    if (kind === "brass") value = 215 + random()*15 + 8*Math.sin(y*1.91 + .2*Math.sin(x*.025));
    else if (kind === "wood") value = 172 + random()*12 + 22*vein + 9*Math.sin(x*.45 + 8*vein);
    else if (kind === "cloth") value = 206 + 11*Math.sin(x*1.6) + 14*Math.sin(y*1.34) + random()*15;
    else if (kind === "paper") value = 211 + 19*random() + 9*Math.sin(x*.027+y*.021)*Math.sin(y*.019+.65*Math.sin(x*.012)) - (y%7===0 ? 13:0);
    else value = 195 + 22*random() + 9*vein + 8*Math.cos(y*.034+2*Math.sin(x*.014)) - 11*Math.abs(Math.sin(y*.067 + 3*vein));
    pixels.data[i] = value;
    pixels.data[i+1] = value - (kind === "stone" ? 4:1);
    pixels.data[i+2] = value - (kind === "stone" ? 9:4);
    pixels.data[i+3] = 255;
  }
  ctx.putImageData(pixels,0,0);
  if (kind === "stone") {
    for (let i=0; i<1900; i++) {
      const r = .4 + Math.pow(random(),2)*2.3;
      ctx.fillStyle = "rgba(58,48,42," + (.08+random()*.22) + ")";
      ctx.beginPath(); ctx.ellipse(random()*384,random()*384,r,r*(.22+random()*.73),.25,0,Math.PI*2); ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "paper" ? 4 : 2,kind === "brass" ? 3 : 1.5);
  texture.anisotropy = 4;
  return texture;
}

export function makePalette(redraw: () => void) {
  const stoneMap = sample("stone"), metalMap = sample("brass"), pulp = sample("paper");
  const wood = sample("wood"), cloth = sample("cloth");
  const asHeight=(map:THREE.Texture)=>{
    const height=map.clone();height.colorSpace=THREE.NoColorSpace;height.needsUpdate=true;return height;
  };
  const stoneHeight=asHeight(stoneMap),fibreHeight=asHeight(pulp),clothHeight=asHeight(cloth);
  metalMap.colorSpace=THREE.NoColorSpace;
  const fibre = new Image();
  fibre.onload = () => {
    const canvas = pulp.image as HTMLCanvasElement;
    const c = canvas.getContext("2d");
    if (c) {
      c.save(); c.globalCompositeOperation="multiply"; c.globalAlpha=.64;
      c.drawImage(fibre,0,0,canvas.width,canvas.height); c.restore();
      pulp.needsUpdate=fibreHeight.needsUpdate=true; redraw();
    }
  };
  fibre.src=image("pli-verge");
  const stone = new THREE.MeshStandardMaterial({color:"#ccbaa0",map:stoneMap,bumpMap:stoneHeight,bumpScale:.033,roughness:.84});
  stone.userData.scan="travertine";stone.userData.cutTint="#d5cbbd";
  const paleStone = stone.clone(); paleStone.color.set("#dfd1b9");paleStone.userData.cutTint="#f0eae1";
  const darkStone = stone.clone(); darkStone.color.set("#4a463b"); darkStone.roughness=.56;darkStone.userData.cutTint="#514d41";
  const paper = new THREE.MeshPhysicalMaterial({
    color:"#ecdec0", map:pulp, bumpMap:fibreHeight, bumpScale:.045, roughness:.86,
    sheen:.10, sheenRoughness:.76, sheenColor:new THREE.Color("#fff4d3"), shadowSide:THREE.DoubleSide,
  });
  paper.userData.scan="paper";
  const brass = new THREE.MeshPhysicalMaterial({color:"#af8144",metalness:.91,roughness:.34,roughnessMap:metalMap,
    clearcoat:.18, clearcoatRoughness:.30, anisotropy:.38});
  brass.userData.scan="metal";
  const antique = brass.clone(); antique.color.set("#8d673d"); antique.roughness=.36;antique.userData.patinated=true;
  const oak = new THREE.MeshPhysicalMaterial({color:"#422418",roughness:.35,map:wood,clearcoat:.24,clearcoatRoughness:.3});
  const waxRelief=new THREE.TextureLoader().load(image("cire-correspondance"),redraw);
  const wax = new THREE.MeshPhysicalMaterial({color:"#590f0b",roughness:.37,clearcoat:.31,clearcoatRoughness:.28,
    envMapIntensity:.38,bumpMap:waxRelief,bumpScale:.019});
  const linen = new THREE.MeshStandardMaterial({color:"#304038",map:cloth,bumpMap:clothHeight,bumpScale:.019,roughness:.93,side:THREE.DoubleSide});
  const occlusion=document.createElement("canvas");occlusion.width=occlusion.height=128;
  const ctx=occlusion.getContext("2d")!, grad=ctx.createRadialGradient(64,64,1,64,64,63);
  grad.addColorStop(0,"rgba(36,23,13,.88)");grad.addColorStop(.54,"rgba(36,23,13,.72)");grad.addColorStop(.81,"rgba(36,23,13,.3)");grad.addColorStop(1,"rgba(36,23,13,0)");
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const shade=new THREE.CanvasTexture(occlusion);shade.colorSpace=THREE.SRGBColorSpace;
  const contact=new THREE.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false});
  return {
    stone,paleStone,darkStone,paper,brass,antique,oak,wax,linen,contact,
    dispose() { fibre.onload=null; for (const t of [stoneMap,metalMap,pulp,wood,cloth,waxRelief,shade,stoneHeight,fibreHeight,clothHeight]) t.dispose(); },
  };
}
export type Palette = ReturnType<typeof makePalette>;
export function mesh<G extends THREE.BufferGeometry, M extends THREE.Material | THREE.Material[]>(
  geo:G, mat:M, parent:THREE.Object3D, x=0, y=0, z=0) {
  const value = new THREE.Mesh(geo,mat); value.position.set(x,y,z);
  value.castShadow=true; value.receiveShadow=true; parent.add(value); return value;
}
export function box(parent:THREE.Object3D,mat:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,r=.02) {
  return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2,h/2,d/2)), mat, parent,x,y,z);
}
export function cylinder(parent:THREE.Object3D,mat:THREE.Material,x:number,y:number,z:number,r1:number,r2:number,h:number,n=64) {
  return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat,parent,x,y,z);
}
export function ring(parent:THREE.Object3D,mat:THREE.Material,r:number,thickness:number,x:number,y:number,z:number) {
  const torus=mesh(new THREE.TorusGeometry(r,thickness,8,80),mat,parent,x,y,z);
  torus.rotation.x=-Math.PI/2; return torus;
}
export function contactShadow(parent:THREE.Object3D,material:THREE.Material,x:number,y:number,z:number,w:number,d:number) {
  const shade=mesh(new THREE.PlaneGeometry(w,d),material,parent,x,y,z);
  shade.rotation.x=-Math.PI/2;shade.castShadow=shade.receiveShadow=false;return shade;
}
export function oculusLight(material:THREE.MeshStandardMaterial){
  const strength={value:1};
  material.onBeforeCompile=shader=>{
    shader.uniforms.oculusStrength=strength;
    shader.vertexShader="varying vec3 oculusWorld;\n"+shader.vertexShader.replace("#include <project_vertex>",
      "#include <project_vertex>\n oculusWorld=(modelMatrix*vec4(transformed,1.)).xyz;");
    shader.fragmentShader="uniform float oculusStrength;varying vec3 oculusWorld;\n"+shader.fragmentShader.replace("#include <map_fragment>",
      `#include <map_fragment>
      vec3 ray=oculusWorld;
      float rib=1.-smoothstep(.021,.170,abs(fract(ray.x*.31+ray.y*.39+ray.z*.22+.09)-.5));
      float edge=1.-smoothstep(.012,.128,abs(fract(ray.z*.32-ray.x*.28+ray.y*.185+.23)-.5));
      diffuseColor.rgb*=1.-(rib*.22+edge*.083)*oculusStrength;`);
  };
  return strength;
}
export function environment(gl:THREE.WebGLRenderer) {
  const room = new RoomEnvironment();
  for (const [w,h,x,y,z,r] of [
    [4,13,-4.4,3,4.5,8], [.9,13,-2.2,3,4.4,.018], [.65,11,-1.5,3,4.2,6],
    [3,6.5,5.8,2,-3.2,4], [3.8,5,1.2,1,-5.4,.012],
  ]) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w,h),
      new THREE.MeshBasicMaterial({color:new THREE.Color(r,r*.88,r*.72),side:THREE.DoubleSide}));
    card.position.set(x,y,z); card.lookAt(0,1,0); room.add(card);
  }
  const pmrem=new THREE.PMREMGenerator(gl);
  const target=pmrem.fromScene(room,.04,.1,70,{size:128});
  room.dispose(); pmrem.dispose(); return target;
}
