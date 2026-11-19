import * as T from "three";
import { assemble, box, contact, group, line, put, tau, v, type Palette } from "./atelier";

export function soundstage(scene:T.Scene,m:Palette) {
  const ground=put(scene,new T.PlaneGeometry(42,126),m.floor,0,-1.585,-37);
  ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  // Light from the overhead rail pools beneath each physical workstation.
  const worldVarying="varying vec3 atelierPoint;\n";
  m.floor.onBeforeCompile=shader=>{
    shader.vertexShader=worldVarying+shader.vertexShader.replace("#include <project_vertex>",
      "#include <project_vertex>\natelierPoint=(modelMatrix*vec4(transformed,1.)).xyz;");
    shader.fragmentShader=worldVarying+shader.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
      vec2 q=atelierPoint.xz;float stripe=fract((q.y+4.)/16.5)-.5;
      float pool=exp(-q.x*q.x*.053-stripe*stripe*24.);
      float slats=.5+.5*cos(q.x*7.4+q.y*2.18);
      float thread=.35+.65*smoothstep(.34,.72,slats);
      float slitDistance=q.x-2.*sin(q.y*.21); float sweep=exp(-slitDistance*slitDistance*.10);
      totalEmissiveRadiance += vec3(.118,.067,.030)*pool*(.42+.58*thread)+vec3(.006,.012,.017)*sweep;
    `).replace("#include <opaque_fragment>",`
      float bars=.48+.52*smoothstep(-.27,.57,cos(6.4*(atelierPoint.x*.67+atelierPoint.z*.41)));
      float offset=(atelierPoint.x+1.1)/4.; float falloff=exp(-offset*offset);
      float joint=smoothstep(.0,.008,abs(fract(atelierPoint.z*.38+.5)-.5));
      outgoingLight*=mix(vec3(.28,.37,.43),vec3(.65,.59,.51),falloff)*mix(.58,1.,bars)*(.89+.11*joint);
      #include <opaque_fragment>`);

  };
  const bays:T.Group[]=[];
  for(let i=-1;i<8;i++){
    const bay=group(scene,0,0,-i*12.5);
    for(const side of [-1,1]){
      box(bay,m.black,[.35,9.6,12.48],[side*7.95,2.8,-2.0]);
      box(bay,m.iron,[.38,7.1,.46],[side*7.62,1.92,.83],.045);
      for(let j=0;j<7;j++)box(bay,m.darkMetal,[.08,6.1,.04],[side*7.72,1.78,2.4-j*1.73]);
      box(bay,m.darkMetal,[.25,.26,11.1],[side*7.55,-1.28,-1.45],.035);
      box(bay,m.dim,[.037,.017,6.1],[side*7.41,-1.115,-1.34]);
      line(bay,m.iron,[side*7.18,4.0,1.01],[side*5.48,5.72,1.01],.092);
      line(bay,m.darkMetal,[side*7.16,4.6,-5.25],[side*5.86,5.71,-5.25],.06);
      // Tall recesses, fluted timber and warm grazing lights sit behind the machinery.
      const alcove=group(bay,side*7.42,1.22,-2.82);
      alcove.rotation.y=-side*Math.PI/2;
      box(alcove,m.hole,[4.85,5.38,.19],[0,0,0],.06);
      for(let flute=0;flute<37;flute++) {
        const x=-2.26+flute*.126;
        const height=3.39+1.45*Math.sqrt(Math.max(0,1-(x/2.35)**2));
        box(alcove,flute%7===0?m.copper:m.iron,[.053,height,.09],[x,-2.51+height/2,.134],.016);
      }
      for(let rim=0;rim<2;rim++){
        const x=rim===0?-2.30:2.30;
        box(alcove,m.brass,[.05,4.0,.14],[x,-.41,.17],.015);
        box(alcove,m.core,[.009,2.80,.016],[x,-.79,.249]);
      }
      // Finite practical sources recur further downstage and reveal the depth of the cut.
      box(bay,m.black,[.48,.28,2.75],[side*5.78,5.42,-3.2],.036);
      box(bay,i%2===0?m.pearl:m.core,[.14,.026,2.36],[side*5.78,5.256,-3.2]);
      for(let j=0;j<3;j++)box(bay,m.darkMetal,[1.4,.023,.022],[side*4.62,-1.567,-3.8-j*.22]);
    }
    box(bay,m.iron,[15.3,.23,.31],[0,5.75,.85],.055);
    box(bay,m.darkMetal,[15.22,.075,.12],[0,5.34,.81],.023);
    for(let j=0;j<12;j++)
      line(bay,m.iron,[-7.18+j*1.21,5.37,.81],[-6.57+j*1.21,5.68,.81],.027,5);
    assemble(bay);bays.push(bay);
  }
  // A low, fluted counter gives the otherwise airborne first sheet a physical scale.
  const mount=group(scene,.3,-1.41,-.35);
  for(let i=0;i<3;i++){
    const h=i===2?.072:.10, r=2.25-i*.13;
    const stage=put(mount,new T.CylinderGeometry(r,r+.01,h,96),i===1?m.brass:m.iron,0,i*.081,0);
    stage.scale.z=.82;
  }
  assemble(mount);
  contact(scene,m,[.2,-1.582,-.35],7.2,5.8);
  return {bays,mount,dispose:()=>{}};
}

export function lighting(scene:T.Scene) {
  const ambience=new T.HemisphereLight("#d8e0e1","#282022",.79);scene.add(ambience);
  const key=new T.DirectionalLight("#ffe4bc",3.85),fill=new T.DirectionalLight("#9ab8cf",1.03),edge=new T.DirectionalLight("#ffc38a",2.95);
  scene.add(key,key.target,fill,fill.target,edge,edge.target);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{near:.2,far:31,left:-7,right:7,top:7,bottom:-7});
  key.shadow.normalBias=.014;key.shadow.bias=-.00042;key.shadow.radius=2;
  return {paint:(point:T.Vector3,glintX:number,glintY:number)=>{
    key.target.position.copy(point);key.position.copy(point).add(v(-5.4,8.7,5.7));
    fill.target.position.copy(point);fill.position.copy(point).add(v(5+.145*glintX,3.4+.09*glintY,3));
    fill.intensity=1.03*(1+.024*glintX);
    edge.target.position.copy(point);edge.position.copy(point).add(v(2.1,5,-7.2));
  }};
}

// A stationary fine grain and an optical fall-off are recorded directly in the same canvas as the model.
export function lensFilter(scene:T.Scene){
  const mat=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    vertexShader:"varying vec2 filmUv;void main(){filmUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader:`varying vec2 filmUv;void main(){
      vec2 c=(filmUv-.5)*vec2(1.05,.98);float soft=smoothstep(.29,.72,length(c));
      float grain=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
      gl_FragColor=vec4(mix(vec3(.025,.038,.047),vec3(.14,.12,.097),grain*.30),soft*.30+.015*grain);
    }`});
  const screen=put(scene,new T.PlaneGeometry(2,2),mat);screen.frustumCulled=false;screen.renderOrder=100;
}
