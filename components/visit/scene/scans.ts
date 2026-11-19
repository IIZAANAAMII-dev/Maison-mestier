import * as THREE from "three";
import { path } from "../../../lib/maison";

type Surface = "travertine" | "paper" | "metal";
type Channels = { colour: THREE.Texture | null; normal: THREE.Texture | null; relief: THREE.Texture };
type ScanSources = { colour?: string; normal?: string; relief: string };
const sources: Record<Surface, ScanSources> = {
  travertine: { colour: "travertin-couleur", normal: "travertin-normale", relief: "travertin-relief" },
  paper: { relief: "papier-fibres" },
  metal: { normal: "metal-brosse-normale", relief: "metal-brosse-relief" },
};

function cutStone(mesh: THREE.Mesh, phase: number) {
  const { geometry } = mesh;
  const position=geometry.getAttribute("position"), normal=geometry.getAttribute("normal"), uv=geometry.getAttribute("uv");
  if (!uv || !normal) return;
  const cylindrical=geometry.type==="CylinderGeometry";
  const offsetX=.17+phase*.189, offsetY=.11+phase*.317;
  for(let i=0;i<uv.count;i++) {
    const x=position.getX(i), y=position.getY(i), z=position.getZ(i);
    let along: number, across: number;
    if(Math.abs(normal.getY(i))>.65) {
      // A slight diagonal across the bed exposes a different part of the same
      // 1.2 m quarry scan on each neighbouring cut.
      along=.61*x+.119*z;
      across=.59*z-.072*x+.022*Math.sin(.91*x);
    } else {
      const faceLength=cylindrical ? x+.32*z : Math.abs(normal.getZ(i))>.53 ? x : z;
      along=.62*faceLength;
      across=.74*y+.055*faceLength+.032*Math.sin(faceLength*1.04);
    }
    uv.setXY(i,along+offsetX,across+offsetY);
  }
  uv.needsUpdate=true;
}

function grainDirection(mesh: THREE.Mesh, surface: Surface) {
  const geometry=mesh.geometry, uv=geometry.getAttribute("uv");
  if(!uv) return;
  const ribbon=Boolean(geometry.morphAttributes.position?.length);
  let along=1, across=1;
  if(ribbon) {
    along=surface==="paper" ? 3.24 : 4.10;
    across=surface==="paper" ? 1.06 : 1.43;
  } else if(surface==="paper") {
    along=1.47;across=.92;
  }
  for(let i=0;i<uv.count;i++) {
    const u=uv.getX(i),v=uv.getY(i);
    uv.setXY(i,.17+u*along+.032*v,.23+v*across+.014*u);
  }
  uv.needsUpdate=true;
}

function setChannels(material: THREE.MeshStandardMaterial, surface: Surface, maps: Channels) {
  const existing=material.onBeforeCompile;
  const originalKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>originalKey+"-scan-"+surface;
  material.onBeforeCompile=(shader,renderer)=>{
    existing.call(material,shader,renderer);
    if(surface==="paper") {
      // The one RGB scan supplies reflectance, height and roughness. The paper
      // proof already on the page contributes the broader laid-paper ridges.
      shader.fragmentShader=shader.fragmentShader
        .replace("#include <map_fragment>",`
          vec3 fibreChannels=texture2D(map,vMapUv).rgb;
          float laidPaper=texture2D(bumpMap,vMapUv*vec2(.52,.69)+vec2(.18,.08)).r;
          // Laid and chain wires leave shallow perpendicular impressions. The
          // pixel footprint softens these fine lines as the camera moves away.
          float laidAt=vMapUv.x*22.+.10*sin(vMapUv.y*8.37)+.038*(fibreChannels.g-.5);
          float chainAt=vMapUv.y*5.26+.03*sin(vMapUv.x*2.4);
          float wire=1.-smoothstep(.035,.16+fwidth(laidAt)*.5,abs(fract(laidAt)-.5));
          float chain=1.-smoothstep(.012,.042+fwidth(chainAt)*.5,abs(fract(chainAt)-.5));
          float impression=(wire*.125+chain*.075)*(1.-smoothstep(.28,.62,fwidth(laidAt)));
          float pulp=.86+2.3*(fibreChannels.r-.90)+.22*(fibreChannels.g-.50)+.85*(laidPaper-.68)-impression;
          float paperHeight=fibreChannels.g+.67*(laidPaper-.68)-impression;
          diffuseColor.rgb*=clamp(pulp,.61,1.04);`)
        .replace("#include <roughnessmap_fragment>","float roughnessFactor=roughness*(.45+.48*fibreChannels.b);")
        .replace("#include <normal_fragment_maps>",`
          normal=perturbNormalArb(-vViewPosition,normal,bumpScale*vec2(dFdx(paperHeight),dFdy(paperHeight)),faceDirection);`);
    } else {
      const cavity=surface==="travertine" ? ".078" : ".018";
      const valley=surface==="travertine" ? ".976,.998" : ".16,.77";
      shader.fragmentShader=shader.fragmentShader.replace("#include <roughnessmap_fragment>",`
        vec2 microRelief=texture2D(roughnessMap,vRoughnessMapUv).rg;
        float roughnessFactor=roughness*microRelief.g;
        diffuseColor.rgb*=1.-${cavity}*(1.-smoothstep(${valley},microRelief.r));`);
      if(surface==="travertine")shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`
        #include <map_fragment>
        vec3 quarryMid=vec3(.74,.60,.41);
        vec3 vein=clamp(quarryMid+1.48*(sampledDiffuseColor.rgb-quarryMid),vec3(.10),vec3(1.));
        diffuseColor.rgb*=vein/max(sampledDiffuseColor.rgb,vec3(.01));`);
    }
  };
  if(surface==="paper") {
    material.map=maps.relief;
    material.roughnessMap=null;
    material.roughness=.98;
    material.bumpScale=1.05;
    material.color.set("#e5d7bb");
  } else {
    material.normalMap=maps.normal;
    material.bumpMap=null;
    material.roughnessMap=maps.relief;
    if(surface==="travertine") {
      material.map=maps.colour;
      material.roughness=1;
      material.normalScale.setScalar(.58);
      material.color.set(material.userData.cutTint || "#f1e8d7");
    } else {
      material.normalScale.setScalar(.34);
      material.roughness=material.userData.patinated ? .64 : .49;
    }
  }
  material.needsUpdate=true;
}

// The first frame is entirely local geometry and the existing material proofs.
// The scans refine only a surface the current camera can actually reach.
export function materialScans(
  set:THREE.Group,gl:THREE.WebGLRenderer,onStone:(map:THREE.Texture)=>void,redraw:()=>void,
) {
  const meshes:Record<Surface,THREE.Mesh[]>={travertine:[],paper:[],metal:[]};
  const status: Record<Surface,"unseen"|"loading"|"ready"|"fallback">={travertine:"unseen",paper:"unseen",metal:"unseen"};
  const acquired=new Set<THREE.Texture>(), pending=new Map<HTMLImageElement,()=>void>();
  const anisotropy=Math.min(4,gl.capabilities.getMaxAnisotropy());
  let alive=true;
  set.traverse(object=>{
    const mesh=object as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;
    if(!mesh.isMesh || Array.isArray(mesh.material))return;
    const surface=mesh.material.userData.scan as Surface | undefined;
    if(surface && meshes[surface])meshes[surface].push(mesh);
  });
  function texture(name:string,srgb:boolean) {
    return new Promise<THREE.Texture|null>(resolve=>{
      const photo=new Image();
      photo.decoding="async";photo.fetchPriority="low";
      const finish=()=>{
        pending.delete(photo);photo.onload=photo.onerror=null;
      };
      pending.set(photo,()=>{finish();photo.removeAttribute("src");resolve(null);});
      photo.onerror=()=>{finish();resolve(null);};
      photo.onload=()=>{
        finish();
        if(!alive){resolve(null);return;}
        const map=new THREE.Texture(photo);
        map.colorSpace=srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        map.wrapS=map.wrapT=THREE.RepeatWrapping;
        map.anisotropy=anisotropy;map.needsUpdate=true;acquired.add(map);resolve(map);
      };
      photo.src=path("/matieres/"+name+".webp");
    });
  }
  async function load(surface:Surface) {
    if(status[surface]!=="unseen" || !meshes[surface].length)return;
    status[surface]="loading";
    const spec=sources[surface];
    const [colour,normal,relief]=await Promise.all([
      spec.colour ? texture(spec.colour,true) : null,
      spec.normal ? texture(spec.normal,false) : null,
      texture(spec.relief,false),
    ]);
    if(!alive)return;
    if(!relief || (spec.normal && !normal) || (spec.colour && !colour)){
      for(const map of [colour,normal,relief]) if(map){map.dispose();acquired.delete(map);}
      status[surface]="fallback";redraw();return;
    }
    const materials=new Set<THREE.MeshStandardMaterial>(),geometry=new Set<THREE.BufferGeometry>();
    for(const mesh of meshes[surface]) {
      materials.add(mesh.material as THREE.MeshStandardMaterial);
      if(geometry.has(mesh.geometry))continue;
      geometry.add(mesh.geometry);
      if(surface==="travertine")cutStone(mesh,geometry.size);
      else grainDirection(mesh,surface);
    }
    for(const material of materials)setChannels(material,surface,{colour,normal,relief});
    if(surface==="travertine" && colour)onStone(colour);
    status[surface]="ready";redraw();
  }
  return {
    see(p:number) {
      if(p<.93 && status.travertine==="unseen")void load("travertine");
      if(p<.976 && status.paper==="unseen")void load("paper");
      if(p<.976 && status.metal==="unseen")void load("metal");
    },
    describe:()=>Object.entries(status).filter(([,state])=>state==="ready").map(([name])=>name).join(" ") || "base",
    loading:()=>status.travertine==="loading" || status.paper==="loading" || status.metal==="loading",
    dispose(){
      alive=false;
      for(const cancel of pending.values())cancel();
      pending.clear();
      for(const map of acquired)map.dispose();
      acquired.clear();
    },
  };
}
