import * as T from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { group, materials, scanMaterials } from "./atelier";
import { lensFilter, lighting, soundstage } from "./decor";
import { edition, invitation, printingPress, threshold } from "./imprimerie";
import { correspondence, pavilion, raster, theatre } from "./lieux";
import { continuousPaper, frame } from "./trajectoire";

export const stations=[0,-12.0,-27.9,-43.3,-58.6,-74.1] as const;

export function stage(renderer:T.WebGLRenderer,base:string,redraw:()=>void) {
  let live=true,materialState="base",lightState="base",textileState="base";
  const finishes:T.Texture[]=[];
  const scene=new T.Scene();
  scene.background=new T.Color("#172025");
  scene.fog=new T.FogExp2("#172025",.049);
  const camera=new T.PerspectiveCamera(42,1,.07,67);
  const palette=materials(), editionArt=edition();
  scene.environment=palette.environment;
  scene.environmentIntensity=.92;
  const surroundings=soundstage(scene,palette);
  const lights=lighting(scene);
  const sets=stations.map(z=>group(scene,0,0,z));
  const opening=threshold(scene,palette,editionArt);
  const hot=new T.Vector3();
  const card=invitation(sets[0],palette,editionArt);
  const press=printingPress(sets[1],palette,editionArt);
  pavilion(sets[2],palette,editionArt);
  const drapes=theatre(sets[3],palette);
  const pixels=raster(sets[4],palette);
  const letter=correspondence(sets[5],palette,editionArt);
  continuousPaper(scene,palette);lensFilter(scene);
  const modelNames=new Set<string>();
  const loader=new GLTFLoader();
  let unscan:(()=>void)|undefined;
  let loaded=false;
  function refine(){
    if(loaded||!live)return;
    loaded=true;
    unscan=scanMaterials(palette,complete=>{materialState=complete?"ready":"partial";redraw();},base);
    editionArt.load(base,redraw);
    const hdr=new HDRLoader().load(base+"/traversee/matieres/studio.hdr",texture=>{
      if(!live){texture.dispose();return;}
      texture.mapping=T.EquirectangularReflectionMapping;
      scene.environment=texture;
      // A real studio umbrella sits above the left shoulder of the camera.
      // Independent cut lights preserve the shadow edge on the stand and in the velvet.
      scene.environmentRotation.y=-.75;
      scene.environmentIntensity=.32;
      lightState="studio";redraw();
    },undefined,()=>{});
    finishes.push(hdr);
    let applied=0;
    for(const channel of ["normal","relief"] as const){
      const map=new T.TextureLoader().load(base+"/traversee/matieres/velours-"+channel+".webp",t=>{
        if(!live){t.dispose();return;}
        t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;
        if(channel==="normal"){
          palette.cloth.normalMap=t;palette.cloth.normalScale.set(.52,.52);
        }else{
          // WebGL's standard PBR shader samples perceptual roughness from G.
          palette.cloth.roughnessMap=t;
        }
        palette.cloth.needsUpdate=true;
        if(++applied===2)textileState="ready";
        redraw();
      },undefined,()=>{});
      finishes.push(map);
    }
    for(const [key,attach] of [["cachet",card.model],["presse",press.model]] as const){
      loader.load(base+"/traversee/modeles/"+key+".glb",gltf=>{
        if(!live){disposeMeshes(gltf.scene);return;}
        gltf.scene.traverse(o=>{
          if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}
        });
        attach(gltf.scene);
        modelNames.add(key);
        redraw();
      },undefined,()=>{});
    }
  }
  function paint(p:number,width:number,height:number,glintX:number,glintY:number){
    const point=frame(camera,p,width,height);
    const atSeal=1-T.MathUtils.smoothstep(p,.001,.013);
    lights.paint(point,glintX*atSeal,glintY*atSeal);
    opening.paint(p);card.paint(p);press.paint(p);drapes.paint(p);pixels.paint(p,height);letter(p);
    // Distant bays share the same corridor, but stations outside the lens need no draw or shadow pass.
    sets.forEach((set,i)=>{const depth=camera.position.z-stations[i];set.visible=depth>-5&&depth<31;});
    for(const bay of surroundings.bays){const depth=camera.position.z-bay.position.z;bay.visible=depth>-12&&depth<37;}
    surroundings.mount.visible=camera.position.z>-6;
    renderer.render(scene,camera);
    opening.crest.getWorldPosition(hot).project(camera);
    const surface=renderer.domElement;
    surface.dataset.sealX=((1+hot.x)/2).toFixed(4);surface.dataset.sealY=((1-hot.y)/2).toFixed(4);

  }
  return {paint,refine,state:()=>({materials:materialState,light:lightState,textile:textileState,models:["cachet","presse"].filter(n=>modelNames.has(n)).join(","),engraving:editionArt.engraved()?"ready":"base"}),
    dispose:()=>{
      live=false;unscan?.();finishes.forEach(t=>t.dispose());disposeMeshes(scene);scene.clear();opening.dispose();editionArt.dispose();drapes.dispose();pixels.dispose();surroundings.dispose();
      palette.environment.dispose();palette.shadow.map?.dispose();Object.values(palette).forEach(a=>{if(a instanceof T.Material)a.dispose();});
    }};
}

function disposeMeshes(object:T.Object3D){
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
  object.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){
    geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  }});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
