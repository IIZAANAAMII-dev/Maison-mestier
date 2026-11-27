import * as T from "three";
import { finishMaterial } from "./sculpture-matiere";
import { engravedSeal, stageCurtains, writingPaper, type Palette } from "./sculpture-objets";
import { paperVolume } from "./sculpture-papier";

const limit=T.MathUtils.clamp;
const ease=(from:number,to:number,value:number)=>T.MathUtils.smootherstep(value,from,to);
const mix=T.MathUtils.lerp;

export type Sculpture = {
  setSize(width:number,height:number,dpr:number):void;
  setDrawing(amount:number):void;
  render(progress:number, turn:number, time:number):void;
  dispose():void;
};

/**
 * A single transparent viewport. Its owner supplies scroll, rotation and its clock,
 * so offscreen scenes, reduced motion and still renders need no animation loop.
 */
export function createSculpture(canvas:HTMLCanvasElement): Sculpture {
  const renderer=new T.WebGLRenderer({
    canvas,alpha:true,antialias:true,stencil:false,powerPreference:"low-power",
  });
  renderer.setClearColor(0x1c2333,0);
  renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(33,1,.2,65);
  const stage=new T.Group(); scene.add(stage);
  const drawing={value:0};
  const materials:Palette={
    paper:finishMaterial("papier",drawing), brass:finishMaterial("laiton",drawing),
    cloth:finishMaterial("tenture",drawing), wax:finishMaterial("cire",drawing),
    crease:finishMaterial("papier",drawing), signature:finishMaterial("laiton",drawing),
  };
  materials.crease.uniforms.stock.value.set("#777164");
  materials.signature.uniforms.stock.value.set("#B08D57");
  materials.signature.uniforms.metal.value=.60;
  materials.signature.uniforms.strike.value=1;

  const laminae=new T.Mesh(paperVolume(),materials.paper);
  laminae.frustumCulled=false;
  const seal=engravedSeal(materials);
  const curtains=stageCurtains(materials);
  const letter=writingPaper(materials);
  stage.add(laminae,seal,curtains.group,letter.group);
  const influences=laminae.morphTargetInfluences!;
  const eye=new T.Vector3(), target=new T.Vector3();

  let aspect=1, lastWidth=0, lastHeight=0, lastDpr=0, disposed=false;
  function setSize(width:number,height:number,dpr:number) {
    if (disposed || width<=0 || height<=0) return;
    const w=Math.round(width), h=Math.round(height);
    const ratio=limit(dpr || 1,.65,w<700?1.55:1.75);
    if(w===lastWidth&&h===lastHeight&&ratio===lastDpr) return;
    lastWidth=w; lastHeight=h; lastDpr=ratio; aspect=w/h;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w,h,false);
    camera.aspect=aspect;
    camera.updateProjectionMatrix();
  }

  function render(progress:number, turn:number, time:number) {
    if(disposed) return;
    const p=limit(progress,0,1), inspect=limit(turn,-1,1);
    const breath=Math.sin(time*.34);
    // An opening rotation leads the paper arch through the press. Its face becomes the seal.
    const open=ease(.015,.28,p), vault=ease(.27,.51,p);
    influences[0]=open*(1-vault); influences[1]=vault;
    const press=ease(.518,.650,p), clearPress=ease(.655,.762,p);
    const correspondence=ease(.805,.962,p);
    const spread=open*(1-ease(.32,.49,p));
    // The die is physically six units behind the vault. The lens passes its left jamb
    // before the die comes forward into the studio position used for reading the mark.
    const through=ease(.50,.600,p), returnToStudio=ease(.599,.65,p);
    const crossing=p>.50 && p<.65;
    const jamb=through*(1-returnToStudio);
    laminae.visible=p<.603;
    if(laminae.visible) {
      laminae.position.set(-.59+.56*open+.18*vault-.24*spread,.18-.24*open+.17*vault-.22*spread,0);
      laminae.scale.setScalar(.855+.015*open-.027*spread);
      laminae.rotation.set(-.17+.14*open+.12*vault-.10*through, -.42+.89*open-.95*vault+.53*through,
        -.34+.48*open-.15*vault+.025*through, "YXZ");
    }
    seal.visible=p>.5001 && clearPress<.999;
    if (seal.visible) {
      const reveal=ease(.5001,.542,p);
      seal.scale.setScalar((.001+reveal*(1-clearPress))*1.10);
      seal.position.set(.30*(1-returnToStudio)+.82*clearPress,.12+.86*clearPress,
        -6.05*(1-returnToStudio)-2.5*clearPress);
      seal.rotation.set(mix(-.16,.15,through)-.45*clearPress,mix(.88,-.48,through)+1.41*clearPress,
        -.14+.21*clearPress,"YXZ");
    }
    curtains.group.visible=p>.658 && correspondence<.999;
    if(curtains.group.visible) {
      const appear=ease(.658,.766,p);
      curtains.group.scale.setScalar(.001+appear*(1-correspondence));
      curtains.group.rotation.set(-.05+.11*correspondence,.73*(1-appear)-.17+.74*correspondence,
        -.10* (1-appear)+.035+.14*correspondence,"YXZ");
      curtains.group.position.set(-.24*(1-appear)-.85*correspondence, .07+.28*correspondence,-1.8*(1-appear)-2.6*correspondence);
      const part=ease(.718,.84,p);
      for(let i=0;i<curtains.wings.length;i++) {
        const sign=i===0?-1:1, wing=curtains.wings[i];
        wing.position.x=sign*(-.21+.23*part+.32*correspondence);
        wing.rotation.y=sign*(-.08+.09*part);
      }
    }
    letter.group.visible=p>.805;
    if(letter.group.visible) {
      const show=ease(.805,.968,p);
      letter.group.scale.setScalar(.001+show*1.08);
      letter.group.position.set(.30*(1-show),.05, -.18-1.6*(1-show));
      letter.group.rotation.set(-.36+.13*show, .81*(1-show)-.26, -.18+.055*show,"YXZ");
      letter.hinge.rotation.x=-1.75*(1-ease(.88,.986,p));
      letter.card.position.y=.46*(1-ease(.87,.97,p));
      const impression=ease(.943,.987,p);
      letter.waxSeal.visible=impression>.001;
      if(letter.waxSeal.visible) letter.waxSeal.scale.setScalar(impression);
    }

    const dolly=1-.075*open*(1-vault)-.035*press*(1-clearPress);
    const virtualHeight=Math.max(4.57,4.83/aspect);
    const distance=virtualHeight*.5/Math.tan(T.MathUtils.degToRad(camera.fov)*.5)*dolly*(1+.045*Math.abs(inspect));
    eye.set(.15*open-.22*vault+.08*clearPress, .11+.07*vault, distance);
    target.set(0,.03,0);
    if(crossing) {
      const rail=-(distance+1.75)*jamb;
      const arc=Math.sin(Math.PI*through)*(1-returnToStudio);
      eye.x-=.87*arc;
      eye.y-=.21*arc;
      eye.z+=rail;
      target.x-=.30*arc;
      target.y-=.05*arc;
      target.z+=rail;
    }
    camera.position.copy(eye);camera.lookAt(target);
    // Ease a manual rotation toward the opening only while the lens passes through it.
    const align=1-.88*ease(.517,.56,p)*(1-returnToStudio);
    stage.rotation.y=(inspect*.91+breath*.024)*align;
    stage.rotation.x=(.035*Math.sin(time*.29)+inspect*.055)*align;
    renderer.render(scene,camera);
  }

  function dispose() {
    if(disposed) return;
    disposed=true;
    const solids=new Set<T.BufferGeometry>(), finishes=new Set<T.Material>();
    scene.traverse((node)=>{
      if (!(node instanceof T.Mesh || node instanceof T.LineSegments)) return;
      solids.add(node.geometry);
      const bound=node.material;
      if(Array.isArray(bound))bound.forEach(item=>finishes.add(item));else finishes.add(bound);
    });
    solids.forEach(solid=>solid.dispose());
    finishes.forEach(finish=>finish.dispose());
    scene.clear();
    renderer.dispose();
  }
  return {setSize,setDrawing(amount){drawing.value=limit(amount,0,1);},render,dispose};
}
