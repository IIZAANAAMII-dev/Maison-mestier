import * as THREE from "three";
import { image } from "../../../lib/maison";
import { frameCamera, projectionOfPlate } from "./camera";
import { contactShadow, cylinder, ease, environment, makePalette, oculusLight, ring } from "./materials";
import { sculpture } from "./paper";
import { impression, reception } from "./sets";
import { materialScans } from "./scans";

function gallery(stoneMap:THREE.Texture,redraw:()=>void) {
  const night={value:0};
  const ink={value:0};
  const macro={value:0};
  const portrait={value:0};
  const loaded={value:0};
  const mineral={value:0}, limestone={value:stoneMap};
  const map=new THREE.TextureLoader().load(image("hero-depth-room"),()=>{
    loaded.value=1;redraw();
  },undefined,()=>{loaded.value=-1;redraw();});
  map.colorSpace=THREE.SRGBColorSpace;
  // Project the original room onto the walls, ceiling and floor, rather than
  // putting the photograph on the camera. The close subjects retain parallax.
  const mat=new THREE.ShaderMaterial({
    uniforms:{ photograph:{value:map}, limestone, mineral, lens:{value:projectionOfPlate()}, night, ink, macro, portrait, loaded },
    side:THREE.BackSide,depthWrite:true,toneMapped:false,
    vertexShader:`uniform mat4 lens;varying vec4 plate; varying vec3 room;
    void main(){vec4 w=modelMatrix*vec4(position,1.);room=w.xyz;plate=lens*w;
    gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform sampler2D photograph;uniform sampler2D limestone;uniform float mineral;uniform float night;uniform float ink;uniform float macro;uniform float portrait;uniform float loaded;
    varying vec4 plate; varying vec3 room;
    void main(){
      vec2 uv=plate.xy/max(.001,plate.w)*.5+.5;
      vec3 plateColor=texture2D(photograph,clamp(uv,.001,.999),macro*4.6+night*.7+ink*.65).rgb;
      float vertical=clamp((room.y+.4)/8.,0.,1.);
      // The original wide-angle plate has a finite field. Beyond its frustum the
      // photographer's floor continues as laid slabs, with the same window light.
      float planar=max(1.-smoothstep(.02,.19,room.y),smoothstep(7.83,7.98,room.y));
      vec2 surface=mix(vec2(room.x+room.z*.53,room.y),room.xz,planar);
      vec2 block=floor(surface*vec2(.231,.296)+vec2(.34,.15)+.5);
      vec2 cut=fract(vec2(dot(block,vec2(.643,.347)),dot(block,vec2(.239,.418))));
      vec2 quarryUv=mat2(.46,.08,-.065,.47)*surface+cut*.83;
      vec3 sampleStone=texture2D(limestone,mix(surface*vec2(.116,.21),quarryUv,mineral)).rgb;
      float grain=sampleStone.r;
      float large=.56+.44*sin(room.z*.44+.52*sin(room.x*.43));
      vec2 joint=abs(fract(surface*vec2(.231,.296)+vec2(.34, .15))-.5);
      float seam=1.-smoothstep(.0009,.006,min(joint.x,joint.y));
      vec2 sunray=vec2(room.x*.41+room.z*.18,room.z*.44-room.x*.23);
      vec2 rib=abs(fract(sunray+.13)-.5);
      float spill=(.25+.75*smoothstep(.044,.12,min(rib.x,rib.y)))*exp(-dot((room.xz-vec2(2.,1.))*vec2(.19,.13),(room.xz-vec2(2.,1.))*vec2(.19,.13)));
      vec3 floorTone=vec3(.215,.142,.087)*(.74+.48*grain+.10*large-.11*seam)+vec3(.23,.17,.11)*spill;
      floorTone*=mix(vec3(1.),clamp(sampleStone/vec3(.74,.60,.41),.68,1.23),mineral*.54);
      vec3 ceilingTone=vec3(.226,.137,.077)*(.74+.50*grain+.075*large);
      vec3 lime=mix(floorTone,ceilingTone,vertical);
      float inFrame=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
      float registration=smoothstep(-.014,.125+portrait*.059,inFrame)*smoothstep(.22,.82,plate.w);
      vec3 noon=mix(lime,plateColor,max(0.,loaded)*registration)*(1.-macro*.25);
      float luminance=dot(noon,vec3(.24,.64,.12));
      vec3 dusk=vec3(.011,.018,.014)+noon*vec3(.067,.060,.047)+vec3(.085,.047,.018)*smoothstep(.3,.92,luminance);
      vec3 late=mix(dusk,vec3(.0022,.004,.0048)+vec3(.007,.006,.004)*luminance,ink*.98);
      gl_FragColor=vec4(mix(noon,late,night),1.);
      #include <colorspace_fragment>
    }`,
  });
  const shell=new THREE.Mesh(new THREE.BoxGeometry(37,8.05,35),mat);
  shell.position.set(0,3.995,5.6);
  return {object:shell, map, loaded, setStone(scan:THREE.Texture){limestone.value=scan;mineral.value=1;},update(p:number,aspect:number) {
    night.value=ease(p,.394,.655);
    ink.value=ease(p,.715,.98);
    macro.value=ease(p,.12,.23)*(1-ease(p,.37,.51));
    portrait.value=1-ease(aspect,.66,1.28);
  }};
}

function air() {
  const alpha={value:.1};
  const shaft=new THREE.Mesh(new THREE.PlaneGeometry(11.2,7.8),new THREE.ShaderMaterial({
    uniforms:{ strength:alpha },transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 pt;void main(){pt=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 pt;uniform float strength;void main(){
      float s=pt.x-(.28+.36*pt.y);float beam=exp(-s*s*48.);
      float shaft=.62+.38*smoothstep(-.18,.32,cos(s*74.));
      float a=strength*beam*shaft*smoothstep(0.,.24,pt.y)*(.37+.63*pt.y);
      gl_FragColor=vec4(.98,.82,.54,a);
      #include <colorspace_fragment>
    }`,
  }));
  shaft.position.set(.6,3.75,-2.65);
  const points=[];let seed=953;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<76;i++) points.push(-2+random()*6.3,.3+random()*5.3,-4+random()*5.1);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
  const dustMat=new THREE.PointsMaterial({color:"#ffe6b4",size:.013,transparent:true,opacity:.38,depthWrite:false});
  const dust=new THREE.Points(geometry,dustMat);
  return {shaft,dust,update(p:number,breath:number){
    const out=ease(p,.34,.60);alpha.value=.042*(1-out);
    shaft.visible=out<.99;
    dustMat.opacity=.39*(1-out);
    dust.visible=out<.99;dust.position.y=.1*breath;
  }};
}

export function chamber(scene:THREE.Scene, gl:THREE.WebGLRenderer, redraw:()=>void) {
  const previousEnvironment=scene.environment;
  const env=environment(gl);scene.environment=env.texture;scene.environmentRotation.y=-.49;
  const P=makePalette(redraw), room=gallery(P.stone.map!,redraw);
  const ribbon=sculpture(P), letter=impression(P), stage=reception(P,redraw), atmosphere=air();
  const set=new THREE.Group();
  set.add(room.object,ribbon.object,letter.object,stage.object,stage.lamp,atmosphere.shaft,atmosphere.dust);
  scene.add(set);
  // The cast shadow sits on the photographic floor. A second, much smaller
  // contact shadow anchors the suspended point to the upper face of the plinth.
  const step=new THREE.Group();step.position.set(2.0,0,-.82);set.add(step);
  contactShadow(step,P.contact,.11,.009,.11,5.84,4.75);
  const sideStone=P.stone.clone();sideStone.color.set("#95806a");sideStone.roughness=.85;sideStone.userData.cutTint="#ab9d8a";
  const litStone=oculusLight(sideStone);
  const foot=cylinder(step,P.darkStone,0,.033,0,2.035,2.00,.066,96);foot.scale.z=.84;
  const base=cylinder(step,sideStone,0,.226,0,2.075,2.08,.364,96);base.scale.z=.84;
  const upper=cylinder(step,P.paleStone,0,.431,0,2.056,2.075,.048,96);upper.scale.z=.84;
  ring(step,P.antique,2.067,.009,0,.395,0).scale.y=.84;
  const softContact=P.contact.clone(),tipContact=P.contact.clone();
  contactShadow(step,softContact,-.20,.457,-.70,1.95,.88);
  contactShadow(step,tipContact,.29,.458,-.90,.87,.51);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(35,35),new THREE.ShadowMaterial({opacity:.36}));
  ground.rotation.x=-Math.PI/2;ground.position.y=.002;ground.receiveShadow=true;set.add(ground);
  const fill=new THREE.HemisphereLight("#fff6e4","#745d49",.77);set.add(fill);
  const sun=new THREE.DirectionalLight("#ffdea6",2.55);
  sun.position.set(-4.9,10.7,4.1);sun.target.position.set(1.45,.4,-1.2);
  sun.castShadow=true;const shadow=sun.shadow;
  shadow.autoUpdate=false;
  shadow.mapSize.set(1024,1024);shadow.camera.left=-7;shadow.camera.right=7;
  shadow.camera.top=8.1;shadow.camera.bottom=-6.4;shadow.camera.near=.2;shadow.camera.far=26;
  shadow.normalBias=.020;shadow.bias=-.00016;shadow.radius=2.0;
  set.add(sun,sun.target);
  const rim=new THREE.DirectionalLight("#fff1cf",.95);rim.position.set(5.3,4.8,-5.7);set.add(rim);
  const bounce=new THREE.PointLight("#d8ad75",3.2,14,2);bounce.position.set(.3,2.2,3.2);set.add(bounce);
  const scans=materialScans(set,gl,room.setStone,redraw);
  let destroyed=false,shadowProgress=-1,shadowBreath=-1;
  return {
    plateReady:()=>room.loaded.value===1,
    plateFailed:()=>room.loaded.value<0,
    seeMaterials:scans.see,
    materialState:scans.describe,
    materialsLoading:scans.loading,
    paint(camera:THREE.PerspectiveCamera,p:number,w:number,h:number,px:number,py:number,breath:number){
      if(destroyed)return;
      frameCamera(camera,p,w,h,px,py,breath);
      room.update(p,w/Math.max(h,1));ribbon.update(p,breath);letter.update(p);stage.update(p);atmosphere.update(p,breath);
      if(p!==shadowProgress || breath!==shadowBreath){
        shadow.needsUpdate=true;shadowProgress=p;shadowBreath=breath;
      }
      const night=ease(p,.43,.65),final=ease(p,.75,.97);
      litStone.value=1-night;
      const contactAtRest=1-ease(p,.095,.31);
      softContact.opacity=.10+.22*contactAtRest;tipContact.opacity=.12+.37*contactAtRest;
      scene.environmentIntensity=.60-night*.32-final*.10;
      fill.intensity=.51-night*.32;
      sun.intensity=2.10-night*1.35-final*.48;
      rim.intensity=.89+night*.08;
      bounce.intensity=1.95-night*1.35;
      step.visible=p<.523; step.scale.y=1-ease(p,.37,.53);
      gl.toneMappingExposure=1.02-night*.09;
    },
    dispose(){
      destroyed=true;scene.remove(set);scene.environment=previousEnvironment;
      const mats=new Set<THREE.Material>(), geos=new Set<THREE.BufferGeometry>();
      set.traverse(object=>{
        const drawable=object as THREE.Mesh;
        if(drawable.geometry)geos.add(drawable.geometry);
        if(drawable.material)for(const mat of Array.isArray(drawable.material) ? drawable.material:[drawable.material])mats.add(mat);
      });
      for(const mat of Object.values(P))if(mat instanceof THREE.Material)mats.add(mat);
      for(const g of geos)g.dispose();
      for(const m of mats)m.dispose();
      env.dispose();room.map.dispose();letter.ink.dispose();stage.dispose();ribbon.dispose();scans.dispose();sun.shadow.dispose();P.dispose();
    },
  };
}
