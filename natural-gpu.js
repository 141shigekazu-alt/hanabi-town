import * as T from './vendor/three.module.js';
// Immutable per-ember parameters. The GPU evaluates the same paths and cooling
// at the current show time; the CPU retains exact head-only reflection sums.
export function buildNaturalGpuData(f){
 const count=f.trailCount,n=f.n*count,a=new Float32Array(n*4),b=new Float32Array(n*4),dir=new Float32Array(n*4),drift=new Float32Array(n*3),colors=new Float32Array(n*3);
 for(let i=0;i<f.n;i++)for(let j=0;j<count;j++){
  const at=i*count+j,k=at*4,q=at*3,s=f.naturalTails[i],d=f.directions[i],c=f.starColors[i];
  a.set([s.phase[j],s.period,s.end,s.emberLife[j]],k);b.set([s.weights[j],s.glow,s.sizes[j],j===0?1:0],k);
  dir.set([d.x,d.y,d.z,f.r*f.shells[i]*(f.kind==='silver'?f.silverVariation[i]:1)],k);drift.set([s.dx[j],s.dy[j],s.dz[j]],q);
  colors.set([c.r,c.g,c.b],q);
 }
 return{a,b,dir,drift,colors};
}
export function installNaturalGpu(f,prepared=null){
 const {a,b,dir,drift,colors}=prepared??buildNaturalGpuData(f);f.colors.set(colors);
 for(const [name,data,size]of [['ngA',a,4],['ngB',b,4],['ngDirection',dir,4],['ngDrift',drift,3]])f.g.setAttribute(name,new T.BufferAttribute(data,size));
 f.g.attributes.color.needsUpdate=true;
 const uniforms={ngTime:{value:-1},ngCenter:{value:new T.Vector3(f.x,f.y,f.z)},ngDrag:{value:f.kind==='silver'?.90:f.size===20?.7:1.9},ngGravity:{value:f.spec.gravity},ngEmberFall:{value:f.spec.naturalEmberFallScale??1},ngRise:{value:f.kind==='silver'?.065:.085},ngSilver:{value:f.kind==='silver'?1:0},ngHeadBoost:{value:f.size>=3?1.25:1}};
 const before=f.m.onBeforeCompile,key=f.m.customProgramCacheKey();
 f.m.onBeforeCompile=function(shader,renderer){
  before.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=`attribute vec4 ngA; attribute vec4 ngB; attribute vec4 ngDirection; attribute vec3 ngDrift;
uniform float ngTime; uniform vec3 ngCenter; uniform float ngDrag; uniform float ngGravity; uniform float ngEmberFall; uniform float ngRise; uniform float ngSilver; uniform float ngHeadBoost;
float ngSmooth(float a,float b,float t){float u=clamp((t-a)/(b-a),0.0,1.0);return u*u*(3.0-2.0*u);}
`+shader.vertexShader;
  const calc=`
float ngHead=ngB.w;float ngBirth=ngHead>0.5?ngTime:ngA.x+floor((min(ngTime,ngA.z)-ngA.x)/ngA.y)*ngA.y;
float ngAge=max(0.0,ngTime-ngBirth);float ngWarm=ngHead>0.5?0.0:clamp((ngTime-ngBirth)/ngA.w,0.0,1.0);
float ngBurn=ngSmooth(ngA.z*.22,ngA.z,ngBirth);
float ngLight;
if(ngHead>0.5){ngLight=2.0*ngB.y*(1.0-ngSmooth(ngA.z-.30,ngA.z,ngTime))*(1.0-.35*ngBurn);}
else{ngLight=(ngBirth<0.0||ngTime<ngBirth||ngTime-ngBirth>=ngA.w)?0.0:pow(1.0-ngWarm,1.6)*ngB.x*ngB.y*1.65*(1.0-.22*ngBurn);}
float ngAt=max(0.0,ngBirth),ngDecay=exp(-ngDrag*ngAt),ngTravel=ngDirection.w*(1.0-ngDecay),ngVelocity=ngDecay*ngDirection.w*ngDrag;
vec3 ngPoint=ngCenter+ngDirection.xyz*ngTravel+vec3(0.0,ngRise*ngAt-ngGravity*ngAt*ngAt,0.0);
ngPoint+=(ngDirection.xyz*ngVelocity*.04+ngDrift)*ngAge;ngPoint.y-=.025*ngEmberFall*ngAge*ngAge;
ngLight*=1.0-clamp((.045-ngPoint.y)/.027,0.0,1.0);
if(ngSilver>.5&&ngTime<.08)ngLight*=1.0+1.6*(1.0-ngTime/.08);
if(ngHead>.5)ngLight*=ngHeadBoost;
if(ngTime<0.0)ngLight=0.0;
ngPoint.y=max(.018,ngPoint.y);
float ngSize=ngHead>.5?ngB.z*(1.0-.82*ngBurn):ngB.z*.8*(1.0-.60*ngWarm*ngWarm)*(1.0-.35*ngBurn);
`;
  shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>',calc+'\n#include <color_vertex>\nvColor *= vec3(ngLight,ngLight*(1.0-.25*ngWarm),ngLight*(1.0-.38*ngWarm));');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed = ngPoint;').replace('size * naturalSize','size * ngSize');
 };
 f.m.customProgramCacheKey=()=>key+'|natural-gpu-v1';f.m.needsUpdate=true;f.gpuNatural=uniforms;
}
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function updateNaturalGpu(f,t){
 f.gpuNatural.ngTime.value=t;
 let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;
 const silver=f.kind==='silver',drag=silver?.90:f.size===20?.7:1.9,decay=Math.exp(-drag*t),gravity=f.spec.gravity,rise=silver?.065:.085;
 for(let i=0;i<f.n;i++){
  const s=f.naturalTails[i],burn=smooth(s.end*.22,s.end,t),head=1-smooth(s.end-.30,s.end,t);if(head===0)continue;
  const radius=f.r*f.shells[i]*(silver?f.silverVariation[i]:1),travel=radius*(1-decay),d=f.directions[i],x=f.x+d.x*travel,y=f.y+d.y*travel+rise*t-gravity*t*t,z=f.z+d.z*travel;
  let brightness=2*s.glow*head*(1-.35*burn)*(1-Math.max(0,Math.min(1,(.045-y)/.027)));
  if(silver&&t<.08)brightness*=1+1.6*(1-t/.08);if(f.size>=3)brightness*=1.25;
  if(brightness>0){const py=Math.fround(Math.max(.018,y));light+=brightness;lightX+=x*brightness;lightY+=py*brightness;lightZ+=z*brightness;lightR2+=(x*x+py*py+z*z)*brightness;if(f.layerLight){f.layerLight[f.starLayers[i]]+=brightness;lightShellR2+=f.shells[i]*f.shells[i]*brightness;}}
 }
 const out=f.naturalLight??={};Object.assign(out,{light,lightX,lightY,lightZ,lightR2,lightShellR2});return out;
}
