import * as T from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/**
 * The lens of the visit. The scene is exposed in linear HDR, then developed like a film print:
 * warm halation around brass and practicals, a shallow focus that follows the subject of each
 * station, a slight separation of colours at the edge of the glass, a living grain and fall-off.
 */
export type Lens = {
  /** Distance from the camera to the plane in focus, in metres. */
  focus:number;
  /** Seconds since the visit started, for grain and halation breathing. */
  time:number;
  /** Absolute travelling speed in progress per second. Opens the edges of the frame. */
  speed:number;
};

export type Quality = "high" | "medium" | "low";

const fragment = /* glsl */`
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 texel;
uniform float near;
uniform float far;
uniform float focus;
uniform float aperture;
uniform float maxBlur;
uniform float time;
uniform float aberration;
uniform float grainAmount;
uniform float vignette;
uniform sampler2D tStreak;
uniform float streak;
uniform float leak;
varying vec2 vUv;

float viewZ(float depth){
  return (near*far)/((far-near)*depth-far);
}
float circle(vec2 uv){
  float z=-viewZ(texture2D(tDepth,uv).x);
  float c=clamp(abs(1./focus-1./max(z,.01))*aperture,0.,1.)*maxBlur;
  // The foreground softens less than the background: a near sheet stays readable as paper.
  return z<focus?c*.45:c;
}
float hash(vec2 p){
  vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);
}
vec3 sampleLens(vec2 uv){
  #ifdef APERTURE
  float coc=circle(uv);
  vec3 sum=texture2D(tColor,uv).rgb;float total=1.;
  if(coc>.6){
    // Golden-angle disc. Samples sharper than the centre are held back so a sharp
    // subject does not bleed into the soft background behind it.
    float spin=hash(gl_FragCoord.xy+fract(time)*61.)*6.2831;
    for(int i=0;i<TAPS;i++){
      float r=sqrt((float(i)+.5)/float(TAPS));
      float a=float(i)*2.39996+spin;
      vec2 offset=vec2(cos(a),sin(a))*r*coc*texel;
      vec2 at=uv+offset;
      float other=circle(at);
      float w=smoothstep(r*coc-1.5,r*coc+.5,max(other,coc*.35));
      vec3 c=texture2D(tColor,at).rgb;
      // Highlights open into slightly heavier discs, like a real diaphragm.
      w*=1.+.6*smoothstep(1.2,4.,dot(c,vec3(.2126,.7152,.0722)));
      sum+=c*w;total+=w;
    }
  }
  return sum/total;
  #else
  return texture2D(tColor,uv).rgb;
  #endif
}

void main(){
  vec2 centred=vUv-.5;
  float edge=dot(centred,centred);
  vec2 shift=centred*edge*aberration;
  // Focus is gathered once. The separation of colours at the edge of the glass is laid
  // over it from three plain taps, which keeps the lens affordable on modest graphics.
  vec3 colour=sampleLens(vUv);
  vec3 plain=texture2D(tColor,vUv).rgb;
  colour.r+=texture2D(tColor,vUv+shift).r-plain.r;
  colour.b+=texture2D(tColor,vUv-shift).b-plain.b;
  colour=max(colour,vec3(0.));

  // Anamorphic streaks: the brightest points of brass and tungsten stretch across the frame.
  colour+=texture2D(tStreak,vUv).rgb*vec3(1.,.76,.5)*streak;
  // Travelling fast burns a warm leak into the edge of the film, as on a camera between takes.
  float burn=smoothstep(.62,1.18,vUv.x+.16*sin(vUv.y*3.1+time*.9)+.08*sin(vUv.y*7.3-time*1.3));
  colour+=vec3(1.,.5,.22)*burn*leak*.55;

  // Development: a gentle toe in the blacks keeps the night of the soundstage dense,
  // the shadows lean cool and the highlights warm, as on a tungsten-balanced stock.
  float luma=dot(colour,vec3(.2126,.7152,.0722));
  colour=mix(colour*vec3(.93,1.,1.06),colour*vec3(1.05,1.,.93),smoothstep(.05,.9,luma));

  gl_FragColor=vec4(colour,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>

  float fall=smoothstep(.95,.18,length(centred*vec2(1.12,1.)));
  gl_FragColor.rgb*=mix(1.-vignette,1.,fall);
  float g=hash(gl_FragCoord.xy*.73+floor(time*24.)*vec2(17.,29.))-.5;
  float midtones=1.-abs(dot(gl_FragColor.rgb,vec3(.333))-.45)*1.4;
  gl_FragColor.rgb+=g*grainAmount*(.45+.55*midtones);
  gl_FragColor.rgb=max(gl_FragColor.rgb,vec3(.006,.008,.01));
}`;

export function optique(renderer:T.WebGLRenderer, quality:Quality) {
  const samples=quality==="high" ? 4 : 2;
  const depth=new T.DepthTexture(1,1);
  depth.type=T.UnsignedIntType;
  const exposure=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples,depthTexture:depth,colorSpace:T.LinearSRGBColorSpace});
  const bloom=new UnrealBloomPass(new T.Vector2(1,1),.5,.55,2.1);
  // The widest kernels carry red: the halation of a film emulsion around bright brass.
  const tints=[[1,.98,.95],[1,.92,.82],[1,.82,.66],[1,.66,.46],[.95,.45,.3]];
  bloom.bloomTintColors.forEach((c,i)=>c.set(...(tints[i] as [number,number,number])));
  const material=new T.ShaderMaterial({
    defines:quality==="high" ? {APERTURE:"",TAPS:"28"} : quality==="medium" ? {APERTURE:"",TAPS:"14"} : {},
    uniforms:{
      tColor:{value:exposure.texture},tDepth:{value:depth},texel:{value:new T.Vector2()},
      near:{value:.07},far:{value:67},focus:{value:5},aperture:{value:quality==="high"?.85:.6},maxBlur:{value:quality==="high"?9:6},
      time:{value:0},aberration:{value:.004},grainAmount:{value:.034},vignette:{value:.42},
    },
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader:fragment,
    depthTest:false,depthWrite:false,
  });
  const quad=new FullScreenQuad(material);
  // The streak is drawn small and wide: a bright-pass, then three horizontal smears of growing reach.
  const streaks=quality!=="low";
  const streakA=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,colorSpace:T.LinearSRGBColorSpace});
  const streakB=streakA.clone();
  const bright=new T.ShaderMaterial({
    uniforms:{tColor:{value:exposure.texture},texel:{value:new T.Vector2()},threshold:{value:2.4}},
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader:`uniform sampler2D tColor;uniform vec2 texel;uniform float threshold;varying vec2 vUv;
      void main(){
        vec3 c=texture2D(tColor,vUv+texel*vec2(-.5,-.5)).rgb+texture2D(tColor,vUv+texel*vec2(.5,-.5)).rgb
              +texture2D(tColor,vUv+texel*vec2(-.5,.5)).rgb+texture2D(tColor,vUv+texel*vec2(.5,.5)).rgb;
        c*=.25;float l=dot(c,vec3(.2126,.7152,.0722));
        gl_FragColor=vec4(c*smoothstep(threshold,threshold*2.2,l),1.);
      }`,depthTest:false,depthWrite:false});
  const smear=new T.ShaderMaterial({
    uniforms:{tInput:{value:null},texel:{value:new T.Vector2()},reach:{value:1}},
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader:`uniform sampler2D tInput;uniform vec2 texel;uniform float reach;varying vec2 vUv;
      void main(){
        vec3 sum=vec3(0.);float total=0.;
        for(int i=-6;i<=6;i++){float w=exp(-float(i*i)/18.);sum+=texture2D(tInput,vUv+vec2(float(i)*reach*texel.x,0.)).rgb*w;total+=w;}
        gl_FragColor=vec4(sum/total*1.12,1.);
      }`,depthTest:false,depthWrite:false});
  const pass=new FullScreenQuad(bright);
  material.uniforms.tStreak={value:streakA.texture};
  material.uniforms.streak={value:streaks?.32:0};
  material.uniforms.leak={value:0};
  let width=0,height=0;
  return {
    setSize(w:number,h:number){
      const ratio=renderer.getPixelRatio();
      const pw=Math.max(1,Math.round(w*ratio)),ph=Math.max(1,Math.round(h*ratio));
      if(pw===width&&ph===height)return;
      width=pw;height=ph;
      exposure.setSize(pw,ph);
      bloom.setSize(pw,ph);
      material.uniforms.texel.value.set(1/pw,1/ph);
      const sw=Math.max(1,Math.round(pw/4)),sh=Math.max(1,Math.round(ph/6));
      streakA.setSize(sw,sh);streakB.setSize(sw,sh);
      bright.uniforms.texel.value.set(1/pw,1/ph);
      smear.uniforms.texel.value.set(1/sw,1/sh);
    },
    render(scene:T.Scene,camera:T.PerspectiveCamera,lens:Lens){
      const u=material.uniforms;
      u.near.value=camera.near;u.far.value=camera.far;u.focus.value=Math.max(.4,lens.focus);
      u.time.value=lens.time;
      const rush=Math.min(1,lens.speed*3.2);
      u.aberration.value=.0035+.022*rush;
      bloom.strength=.48+.04*Math.sin(lens.time*.7)+.16*rush;
      renderer.setRenderTarget(exposure);
      renderer.clear();
      renderer.render(scene,camera);
      if(streaks){
        pass.material=bright;renderer.setRenderTarget(streakA);pass.render(renderer);
        pass.material=smear;
        let from=streakA,to=streakB;
        for(const reach of [1,3.2,9]){
          smear.uniforms.tInput.value=from.texture;smear.uniforms.reach.value=reach;
          renderer.setRenderTarget(to);pass.render(renderer);[from,to]=[to,from];
        }
        u.tStreak.value=from.texture;
      }
      u.leak.value=rush*rush;
      bloom.render(renderer,null as unknown as T.WebGLRenderTarget,exposure,0,false);
      renderer.setRenderTarget(null);
      quad.render(renderer);
    },
    dispose(){exposure.dispose();depth.dispose();bloom.dispose();material.dispose();quad.dispose();streakA.dispose();streakB.dispose();bright.dispose();smear.dispose();pass.dispose();},
  };
}
