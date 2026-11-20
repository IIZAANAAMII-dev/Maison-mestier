import * as T from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { group, materials, scanMaterials } from "./atelier";
import { lighting, soundstage } from "./decor";
import { atmosphere } from "./atmosphere";
import { optique, type Quality } from "./optique";
import { edition, invitation, printingPress, threshold } from "./imprimerie";
import { correspondence, pavilion, raster, theatre } from "./lieux";
import { continuousPaper, frame } from "./trajectoire";
import { poincons, type Chasse } from "./poincons";

import { stations } from "./stations";
export { stations };

/** What the visitor brings to the frame: time, the speed of travel and the hand that holds the lamp. */
export type Presence={time:number;speed:number;handX:number;handY:number;hand:number;
  /** Where the visitor is actually pointing the lamp, in normalised screen coordinates, and whether they are. */
  pointX?:number;pointY?:number;pointing?:boolean};

export function stage(renderer:T.WebGLRenderer,base:string,redraw:()=>void,quality:Quality="high",found:Set<string>=new Set()) {
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
  continuousPaper(scene,palette);
  const air=atmosphere(scene);
  const hunt=poincons(scene,found);
  let chasse:Chasse={progres:null,trouve:null};
  let lens=optique(renderer,quality);
  // The visitor holds a small tungsten lamp. It follows the pointer a little in front of the subject,
  // so brass, wax and velvet answer the hand. On touch screens it wanders slowly around the subject.
  const lamp=new T.PointLight("#ffcf94",0,9,1.6);lamp.castShadow=false;scene.add(lamp);
  const lampAt=new T.Vector3(),aim=new T.Vector3(),toward=new T.Vector3();
  let lampPlaced=false;
  const practicals=[[palette.core,palette.core.color.clone()],[palette.pearl,palette.pearl.color.clone()]] as const;
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
  function paint(p:number,width:number,height:number,glintX:number,glintY:number,life:Presence={time:0,speed:0,handX:0,handY:0,hand:0}){
    const rush=Math.min(1,life.speed*3.2);
    const point=frame(camera,p,width,height,rush*4.5);
    const focus=camera.position.distanceTo(point);
    // A held camera: a slow breath, a slight weight, and a glance toward the hand.
    const t=life.time;
    camera.rotateY(-life.handX*.028+Math.sin(t*.37)*.0035);
    camera.rotateX(life.handY*.02+Math.sin(t*.53+1.3)*.0028);
    camera.rotateZ(Math.sin(t*.29+.4)*.0022);
    camera.updateMatrixWorld();
    aim.set(life.handX*.85,life.handY*.75,.5).unproject(camera).sub(camera.position).normalize();
    toward.copy(camera.position).addScaledVector(aim,focus*.62);
    if(!lampPlaced){lampAt.copy(toward);lampPlaced=true;}else lampAt.lerp(toward,.18);
    lamp.position.copy(lampAt);
    lamp.intensity=life.hand*(6+.6*Math.sin(t*2.3)+.3*Math.sin(t*7.1));
    for(const [finish,base] of practicals){
      const flicker=1+.035*Math.sin(t*3.1)+.02*Math.sin(t*11.7+1.)+.012*Math.sin(t*23.);
      finish.color.copy(base).multiplyScalar(flicker);
    }
    const atSeal=1-T.MathUtils.smoothstep(p,.001,.013);
    lights.paint(point,glintX*atSeal,glintY*atSeal);
    opening.paint(p);card.paint(p);press.paint(p);drapes.paint(p);pixels.paint(p,height);letter(p);
    // Distant bays share the same corridor, but stations outside the lens need no draw or shadow pass.
    sets.forEach((set,i)=>{const depth=camera.position.z-stations[i];set.visible=depth>-5&&depth<31;});
    for(const bay of surroundings.bays){const depth=camera.position.z-bay.position.z;bay.visible=depth>-12&&depth<37;}
    surroundings.mount.visible=camera.position.z>-6;
    air.paint(camera,focus,t,height,renderer.getPixelRatio());
    chasse=hunt.update(camera,width,height,t,!!life.pointing,life.pointX??0,life.pointY??0,renderer.getPixelRatio());
    lens.setSize(width,height);
    lens.render(scene,camera,{focus,time:t,speed:life.speed});
    opening.crest.getWorldPosition(hot).project(camera);
    const surface=renderer.domElement;
    surface.dataset.sealX=((1+hot.x)/2).toFixed(4);surface.dataset.sealY=((1-hot.y)/2).toFixed(4);

  }
  return {paint,refine,chasse:()=>chasse,recommencer:()=>hunt.reset(),retune:(next:Quality)=>{lens.dispose();lens=optique(renderer,next);},state:()=>({materials:materialState,light:lightState,textile:textileState,models:["cachet","presse"].filter(n=>modelNames.has(n)).join(","),engraving:editionArt.engraved()?"ready":"base"}),
    dispose:()=>{
      live=false;unscan?.();finishes.forEach(t=>t.dispose());disposeMeshes(scene);scene.clear();opening.dispose();editionArt.dispose();drapes.dispose();pixels.dispose();surroundings.dispose();air.dispose();hunt.dispose();lens.dispose();
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
