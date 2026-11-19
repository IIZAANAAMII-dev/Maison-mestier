import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
export const smooth = T.MathUtils.smoothstep;
export const tau = Math.PI * 2;
export type Placement = [number, number, number];

export function group(parent: T.Object3D, x = 0, y = 0, z = 0) {
  const result = new T.Group();
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}

export function put(parent: T.Object3D, geo: T.BufferGeometry, mat: T.Material, x = 0, y = 0, z = 0) {
  const mesh = new T.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = !mat.transparent && !(mat instanceof T.MeshBasicMaterial);
  mesh.receiveShadow = mesh.castShadow;
  parent.add(mesh);
  return mesh;
}

export function box(parent: T.Object3D, mat: T.Material, size: Placement, at: Placement, bevel = 0) {
  const geo = bevel ? new RoundedBoxGeometry(...size, 2, Math.min(Math.min(...size) * .45, bevel)) : new T.BoxGeometry(...size);
  return put(parent, geo, mat, ...at);
}

export function disc(parent: T.Object3D, mat: T.Material, radius: number, depth: number, at: Placement, segments = 72) {
  const geo = new T.CylinderGeometry(radius, radius, depth, segments);
  geo.rotateX(Math.PI / 2);
  return put(parent, geo, mat, ...at);
}

export function ring(parent: T.Object3D, mat: T.Material, radius: number, wire: number, at: Placement) {
  return put(parent, new T.TorusGeometry(radius, wire, 6, 96), mat, ...at);
}

export function line(parent: T.Object3D, mat: T.Material, start: Placement, end: Placement, radius = .02, sides = 7) {
  const a = v(...start), b = v(...end), direction = b.clone().sub(a);
  const geo = new T.CylinderGeometry(radius, radius, direction.length(), sides);
  const mesh = put(parent, geo, mat);
  mesh.position.copy(a).lerp(b, .5);
  mesh.quaternion.setFromUnitVectors(v(0, 1, 0), direction.normalize());
  return mesh;
}

export function cord(parent: T.Object3D, mat: T.Material, points: Placement[], radius: number) {
  return put(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => v(...p))), points.length * 9, radius, 7, false), mat);
}

export function polygon(parent: T.Object3D, mat: T.Material, points: [number, number][], depth: number, z = 0, bevel = .02) {
  const outline = new T.Shape();
  outline.moveTo(...points[0]);
  points.slice(1).forEach(p => outline.lineTo(...p));
  outline.closePath();
  return put(parent, new T.ExtrudeGeometry(outline,{depth,bevelEnabled:bevel > 0,bevelSegments:2,bevelThickness:bevel,bevelSize:bevel,curveSegments:16}), mat, 0, 0, z);
}

/** Station fittings share a draw call per finish. Moving parts keep their local pivot. */
export function assemble(root: T.Group) {
  root.updateWorldMatrix(true, true);
  const invert = root.matrixWorld.clone().invert();
  const batches = new Map<T.Material, {geometries:T.BufferGeometry[]; cast:boolean; receive:boolean}>();
  const originals = new Set<T.BufferGeometry>();
  root.traverse(item => {
    if (!(item instanceof T.Mesh) || Array.isArray(item.material)) return;
    let geo = item.geometry.clone();
    if (geo.index) { const indexed = geo; geo = indexed.toNonIndexed(); indexed.dispose(); }
    for (const name of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(name)) geo.deleteAttribute(name);
    if (!geo.attributes.uv) geo.setAttribute("uv",new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2),2));
    geo.clearGroups();
    geo.applyMatrix4(new T.Matrix4().multiplyMatrices(invert,item.matrixWorld));
    const batch = batches.get(item.material) ?? {geometries:[],cast:item.castShadow,receive:item.receiveShadow};
    batch.geometries.push(geo);
    batches.set(item.material,batch);
    originals.add(item.geometry);
  });
  root.clear();
  for (const [mat, batch] of batches) {
    const merged = mergeGeometries(batch.geometries);
    if (merged) {
      const mesh = put(root,merged,mat);
      mesh.castShadow = batch.cast;
      mesh.receiveShadow = batch.receive;
    }
    batch.geometries.forEach(g => g.dispose());
  }
  originals.forEach(g => g.dispose());
}

export function canvasTexture(width: number, height: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Le dessin des surfaces est indisponible.");
  draw(ctx);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function studioEnvironment() {
  // Finite softboxes and black flags produce long, broken reflections on curved brass.
  const w = 192, h = 96, data = new Uint16Array(w*h*4);
  const boxes = [
    {normal:v(-.62,.55,.56).normalize(), lateral:.45, vertical:.25, light:[6.8,4.5,2.6]},
    {normal:v(.8,.23,.5).normalize(), lateral:.11, vertical:.6, light:[2.6,3.3,4.5]},
    {normal:v(-.13,.94,-.35).normalize(), lateral:.65, vertical:.2, light:[4.7,4.4,3.6]},
    {normal:v(.4,.22,-.9).normalize(), lateral:.06, vertical:.35, light:[5.4,2.45,1.1]}
  ].map(b => ({...b, right:v(0,1,0).cross(b.normal).normalize(),up:new T.Vector3()}));
  boxes.forEach(b => b.up.copy(b.normal).cross(b.right).normalize());
  const N = new T.Vector3();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const phi=(x+.5)/w*tau-Math.PI, lat=(y+.5)/h*Math.PI-Math.PI/2;
    N.set(Math.cos(lat)*Math.cos(phi),Math.sin(lat),Math.cos(lat)*Math.sin(phi));
    const rgb = [.055,.066,.077].map(n=>n*(.8+Math.max(0,N.y)*.8));
    for (const b of boxes) {
      const front=N.dot(b.normal);
      if(front < .54) continue;
      const coverage=(1-smooth(Math.abs(N.dot(b.right))/front,b.lateral*.86,b.lateral*1.14))*
        (1-smooth(Math.abs(N.dot(b.up))/front,b.vertical*.84,b.vertical*1.16));
      for(let k=0;k<3;k++) rgb[k]+=coverage*b.light[k];
    }
    const i=(y*w+x)*4;
    for(let c=0;c<3;c++) data[i+c]=T.DataUtils.toHalfFloat(rgb[c]);
    data[i+3]=T.DataUtils.toHalfFloat(1);
  }
  const result=new T.DataTexture(data,w,h,T.RGBAFormat,T.HalfFloatType);
  result.mapping=T.EquirectangularReflectionMapping;
  result.needsUpdate=true;
  return result;
}

const standard=(color:string, roughness:number, metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const physical=(options:T.MeshPhysicalMaterialParameters)=>new T.MeshPhysicalMaterial(options);
export function materials() {
  // Laid paper has a soft velvet: its fibres catch a pale sheen at grazing angles.
  const paper=physical({color:"#ebe0ca",roughness:.78,sheen:.55,sheenColor:"#fff0d6",sheenRoughness:.42});
  const ivory=physical({color:"#efe5d1",roughness:.7,sheen:.45,sheenColor:"#fff3df",sheenRoughness:.5});
  // Brass is lacquered: a thin clear coat floats a second, sharper reflection above the brushed metal.
  const brass=physical({color:"#c99a55",roughness:.3,metalness:.86,clearcoat:.55,clearcoatRoughness:.12,envMapIntensity:1.35});
  const cut=physical({color:"#f1d39a",roughness:.17,metalness:.9,clearcoat:.4,clearcoatRoughness:.08,envMapIntensity:1.5});
  const copper=physical({color:"#a5502d",roughness:.3,metalness:.8,clearcoat:.35,clearcoatRoughness:.16,envMapIntensity:1.2});
  const darkMetal=standard("#33383a",.32,.74), iron=standard("#242e32",.53,.63), black=standard("#17232a",.57,.45);
  const stone=standard("#8c8580",.67,.12);
  const cloth=new T.MeshPhysicalMaterial({color:"#842c27",roughness:.86,metalness:.01,sheen:1,sheenColor:"#c0644a",sheenRoughness:.62});
  const velvet=physical({color:"#172c2f",roughness:.95,sheen:.9,sheenColor:"#3f6d6c",sheenRoughness:.55});
  // Sealing wax is glossy and slightly translucent: light enters the edges and returns red.
  const wax=new T.MeshPhysicalMaterial({color:"#8e2620",roughness:.3,metalness:.02,specularIntensity:.7,clearcoat:.65,clearcoatRoughness:.2});
  const waxHi=new T.MeshPhysicalMaterial({color:"#ab3e32",roughness:.27,metalness:.04,specularIntensity:.75,clearcoat:.55,clearcoatRoughness:.18});
  for(const seal of [wax,waxHi]){
    seal.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        float graze=1.-clamp(dot(normalize(normal),normalize(vViewPosition)),0.,1.);
        totalEmissiveRadiance+=vec3(.36,.045,.025)*pow(graze,2.6)*.4+vec3(.025,.003,.002);`);
    };
    seal.customProgramCacheKey=()=>"wax-translucence-v1";
  }
  const hole=standard("#0d1114",.61,.1), floor=standard("#252a2b",.42,.28);
  floor.envMapIntensity=1.3;
  const glass=new T.MeshStandardMaterial({color:"#80979d",metalness:.61,roughness:.19,transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide});
  const core=new T.MeshBasicMaterial({color:new T.Color(3.4,1.9,.85)});
  const pearl=new T.MeshBasicMaterial({color:new T.Color(3.0,2.65,2.1)});
  const dim=new T.MeshBasicMaterial({color:"#635444"});
  const shade=canvasTexture(80,80,c=>{
    const g=c.createRadialGradient(40,40,3,40,40,40);
    g.addColorStop(0,"rgba(0,0,0,.69)"); g.addColorStop(.4,"rgba(0,0,0,.44)");g.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=g;c.fillRect(0,0,80,80);
  });
  const shadow=new T.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false,opacity:.9});
  // Apertures above the soundstage cut oblique pools across paper, velvet and stone.
  for(const finish of [paper,ivory,stone,cloth,iron,black]){
    finish.onBeforeCompile=shader=>{
      shader.vertexShader="varying vec3 setPoint;\n"+shader.vertexShader.replace("#include <project_vertex>",
        "#include <project_vertex>\nsetPoint=(modelMatrix*vec4(transformed,1.)).xyz;");
      shader.fragmentShader="varying vec3 setPoint;\n"+shader.fragmentShader.replace("#include <aomap_fragment>",`#include <aomap_fragment>
        float bay=cos(setPoint.z*.47);
        float grating=.5+.5*cos(3.0*setPoint.x+.93*setPoint.y+.7*setPoint.z+.85*bay);
        float blade=smoothstep(.31,.79,grating);
        float lit=smoothstep(-.1,1.,sin(setPoint.x*.72+.73*setPoint.y+.43*setPoint.z));
        float edges=.56+.44*mix(.52+.48*blade,1.,lit);
        reflectedLight.directDiffuse*=edges;
        reflectedLight.indirectDiffuse*=.76+.24*lit;
        totalEmissiveRadiance+=vec3(.045,.023,.008)*blade*lit;
      `).replace("#include <opaque_fragment>",`
        float exhibit=1.-smoothstep(3.2,7.4,abs(setPoint.z+28.));
        float oc=cos(6.7*(setPoint.x*.70+setPoint.y*.81+setPoint.z*.38));
        float shutter=.47+.53*smoothstep(-.34,.50,oc);
        float axis=setPoint.x+.65*setPoint.y; float oval=exp(-.047*axis*axis)*exhibit;
        outgoingLight*=mix(vec3(1.),mix(vec3(.67,.71,.75),vec3(1.0,.97,.91),shutter)*shutter,oval*.85);
        #include <opaque_fragment>`);

    };
    finish.customProgramCacheKey=()=>"stage-gobo-v2";
  }
  const environment=studioEnvironment();
  return {paper,ivory,brass,cut,copper,darkMetal,iron,black,stone,cloth,velvet,wax,waxHi,hole,floor,glass,core,pearl,dim,shadow,environment};
}
export type Palette=ReturnType<typeof materials>;

export function contact(parent: T.Object3D, m: Palette, at: Placement, width: number, depth: number) {
  const shadow=put(parent,new T.PlaneGeometry(width,depth),m.shadow,...at);
  shadow.rotation.x=-Math.PI/2;
  shadow.renderOrder=1;
}

/** All source scans are hosted alongside the site. A missing channel keeps its optical base finish. */
export function scanMaterials(m:Palette,ready:(complete:boolean)=>void,base:string) {
  let live=true,complete=true;
  const textures:T.Texture[]=[];
  const loader=new T.TextureLoader();
  function load(file:string, apply:(tex:T.Texture)=>void, color=false) {
    return new Promise<void>(resolve=>{
      const texture=loader.load(base+"/matieres/"+file+".webp",tex=>{
        if(live) {
          tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
          if(color)tex.colorSpace=T.SRGBColorSpace;
          apply(tex);
        }
        resolve();
      },undefined,()=>{complete=false;resolve();});
      textures.push(texture);
    });
  }
  void Promise.all([
    load("travertin-couleur",t=>{t.repeat.set(2,1);m.stone.map=t;},true),
    load("travertin-normale",t=>{
      t.repeat.set(2,1);m.stone.normalMap=t;m.stone.normalScale.set(.31,.31);
      const floorMap=t.clone();floorMap.repeat.set(12,34);textures.push(floorMap);m.floor.normalMap=floorMap;m.floor.normalScale.set(.11,.11);
    }),
    load("travertin-relief",t=>{m.stone.roughnessMap=t;}),
    load("metal-brosse-normale",t=>{t.repeat.set(2,1);[m.brass,m.copper,m.cut].forEach(b=>{b.normalMap=t;b.normalScale.set(.16,.16);});}),
    load("metal-brosse-relief",t=>{t.repeat.set(2,1);[m.brass,m.copper].forEach(b=>{b.roughnessMap=t;});}),
    load("papier-fibres",t=>{
      // The CC0 scan packs luminance, height and roughness in RGB respectively.
      // Three's bump sampler reads red. Extract its measured height once, outside the render loop.
      const image=t.image as HTMLImageElement;
      const el=document.createElement("canvas");el.width=image.width;el.height=image.height;
      const context=el.getContext("2d");
      if(context){
        context.drawImage(image,0,0);const px=context.getImageData(0,0,el.width,el.height);
        for(let i=0;i<px.data.length;i+=4){const h=px.data[i+1];px.data[i]=h;px.data[i+2]=h;}
        context.putImageData(px,0,0);
        const height=new T.CanvasTexture(el);height.wrapS=height.wrapT=T.RepeatWrapping;height.repeat.set(3,2);height.anisotropy=4;textures.push(height);
        m.paper.bumpMap=height;m.paper.bumpScale=.008;m.ivory.bumpMap=height;m.ivory.bumpScale=.006;
      }
    }),
  ]).then(()=>{if(live){Object.values(m).forEach(a=>{if(a instanceof T.Material)a.needsUpdate=true;});ready(complete);}});
  return ()=>{live=false;textures.forEach(t=>t.dispose());};
}
