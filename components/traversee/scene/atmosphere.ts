import * as T from "three";
import { stations } from "./stations";

/** Direction of the light falling from the oculus, shared by the key light, the shafts and the dust. */
export const fall=new T.Vector3(5.4,-8.7,-5.7).normalize();

const noise=/* glsl */`
float hash3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){
  vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
// The oculus grating: bright blades separated by soft shadow, projected along the fall of the light.
float blades(vec3 p,vec3 fall){
  vec3 side=normalize(cross(fall,vec3(0.,0.,1.)));
  vec3 depth=normalize(cross(side,fall));
  float u=dot(p,side),w=dot(p,depth);
  float slit=smoothstep(.55,.95,.5+.5*cos(u*2.1+.6*sin(w*.18)));
  float pool=.35+.65*smoothstep(-.4,.9,sin(w*.45+u*.12));
  return slit*pool;
}`;

export function atmosphere(scene:T.Scene){
  const uniforms={time:{value:0},focus:{value:5},scale:{value:600},fall:{value:fall},glow:{value:1}};

  // ---- Shafts of light through the oculus -------------------------------------------------------
  const beamMat=new T.ShaderMaterial({
    uniforms:{time:uniforms.time,glow:uniforms.glow},
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    vertexShader:`varying vec3 world;varying vec3 view;varying vec2 beam;varying vec3 n;
      void main(){vec4 w=modelMatrix*vec4(position,1.);world=w.xyz;vec4 q=viewMatrix*w;view=q.xyz;beam=uv;
      n=normalize(mat3(viewMatrix)*mat3(modelMatrix)*normal);gl_Position=projectionMatrix*q;}`,
    fragmentShader:`uniform float time;uniform float glow;varying vec3 world;varying vec3 view;varying vec2 beam;varying vec3 n;
      ${noise}
      void main(){
        float facing=pow(abs(dot(normalize(n),normalize(-view))),1.6);
        float along=smoothstep(0.,.18,beam.y)*smoothstep(1.,.55,beam.y);
        vec3 drift=world*1.3+vec3(time*.05,-time*.11,time*.03);
        float density=.45+.75*noise3(drift)*noise3(drift*.37+3.1);
        float near=smoothstep(.6,2.6,-view.z);
        gl_FragColor=vec4(vec3(1.,.83,.6)*.055*glow*facing*along*density*near,1.);
      }`,
  });
  const beams=new T.Group();scene.add(beams);
  const up=new T.Vector3(0,1,0);
  let seed=91;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const z of stations){
    for(let i=0;i<4;i++){
      const radius=.32+random()*.42,length=11+random()*3;
      const geo=new T.CylinderGeometry(radius*.75,radius*1.25,length,24,1,true);
      const beam=new T.Mesh(geo,beamMat);
      const foot=new T.Vector3(-3.6+i*2.3+random()*.8,-1.55,z+1.8-random()*4.6);
      beam.position.copy(foot).addScaledVector(fall,-length/2);
      beam.quaternion.setFromUnitVectors(up,fall.clone().negate());
      beam.renderOrder=4;beam.frustumCulled=true;
      beams.add(beam);
    }
  }

  // ---- Dust: drifting motes that catch the blades of light and open into bokeh out of focus -----
  const count=1900;
  const position=new Float32Array(count*3),phase=new Float32Array(count);
  for(let i=0;i<count;i++){
    position[i*3]=(random()-.5)*9;
    position[i*3+1]=-1.4+random()*5.8;
    position[i*3+2]=8-random()*88;
    phase[i]=random();
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute("position",new T.BufferAttribute(position,3));
  geo.setAttribute("phase",new T.BufferAttribute(phase,1));
  const dustMat=new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`uniform float time;uniform float focus;uniform float scale;uniform vec3 fall;
      attribute float phase;varying float light;varying float spread;
      ${noise}
      void main(){
        vec3 p=position;
        float t=time*(.35+.4*phase);
        p+=vec3(sin(t*.31+phase*40.)*.45,sin(t*.23+phase*17.)*.32+.12*sin(t*.07),cos(t*.27+phase*23.)*.45);
        p+=(vec3(noise3(p*.4+t*.05),noise3(p*.4+7.+t*.05),noise3(p*.4+13.))-.5)*.6;
        vec4 view=viewMatrix*vec4(p,1.);
        float z=-view.z;
        float coc=abs(1./focus-1./max(z,.05))*1.6;
        float body=(.006+.01*fract(phase*7.13))*scale/max(z,.05);
        spread=clamp(coc*9.,0.,1.);
        gl_PointSize=clamp(body+coc*26.,1.,48.);
        light=(.035+1.7*blades(p,fall))*smoothstep(.25,1.2,z)*(1.-smoothstep(20.,32.,z));
        light*=1.2/(1.+coc*coc*28.);
        light*=.65+.35*sin(time*1.7+phase*60.);
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`varying float light;varying float spread;
      void main(){
        vec2 c=gl_PointCoord*2.-1.;float r=length(c);
        float disc=1.-smoothstep(mix(.25,.82,spread),1.,r);
        float rim=mix(0.,.5,spread)*smoothstep(.55,.92,r)*(1.-smoothstep(.92,1.,r));
        float a=(disc+rim)*light;
        if(a<.002)discard;
        gl_FragColor=vec4(vec3(1.,.86,.66)*a*.55,1.);
      }`,
  });
  const dust=new T.Points(geo,dustMat);dust.frustumCulled=false;dust.renderOrder=5;scene.add(dust);

  return {
    paint(camera:T.PerspectiveCamera,focus:number,time:number,height:number,pixelRatio:number){
      uniforms.time.value=time;uniforms.focus.value=focus;
      uniforms.scale.value=height*pixelRatio/(2*Math.tan(T.MathUtils.degToRad(camera.fov)/2));
      for(const beam of beams.children){const d=camera.position.z-beam.position.z;beam.visible=d>-6&&d<26;}
    },
    dispose(){beamMat.dispose();dustMat.dispose();geo.dispose();beams.children.forEach(b=>(b as T.Mesh).geometry.dispose());},
  };
}
