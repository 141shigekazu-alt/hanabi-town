import * as T from './vendor/three.module.js';
export const simpleGpuKind=kind=>['kiku','core','double','triple','quad','penta'].includes(kind);
export function installSimpleGpu(f){
 const a=new Float32Array(f.n*f.trailCount*4),b=new Float32Array(f.n*f.trailCount*2);
 for(let i=0;i<f.n;i++)for(let j=0;j<f.trailCount;j++){
  const p=i*f.trailCount+j,d=f.directions[i],c=f.starColors[i];a.set([d.x,d.y,d.z,f.r*f.shells[i]],p*4);b.set([j,f.spec.ignition?.[f.starLayers[i]]??0],p*2);f.colors.set([c.r,c.g,c.b],p*3);
 }
 f.g.setAttribute('sgDirection',new T.BufferAttribute(a,4));f.g.setAttribute('sgTrail',new T.BufferAttribute(b,2));f.g.attributes.color.needsUpdate=true;
 const u={sgTime:{value:-1},sgCenter:{value:new T.Vector3(f.x,f.y,f.z)},sgTail:{value:f.spec.tail},sgCount:{value:f.trailCount},sgDrag:{value:f.size===20?.7:1.9},sgGravity:{value:f.spec.gravity},sgHead:{value:f.size>=3?1.25:1}};
 const before=f.m.onBeforeCompile,key=f.m.customProgramCacheKey();f.m.onBeforeCompile=function(s,r){before.call(this,s,r);Object.assign(s.uniforms,u);
 s.vertexShader=`attribute vec4 sgDirection;attribute vec2 sgTrail;uniform float sgTime;uniform vec3 sgCenter;uniform float sgTail;uniform float sgCount;uniform float sgDrag;uniform float sgGravity;uniform float sgHead;\n`+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <color_vertex>',`float sgJ=sgTrail.x;float sgLag=sgJ*sgTail;float sgAt=max(0.0,sgTime-sgLag);float sgTravel=sgDirection.w*(1.0-exp(-sgDrag*sgAt));vec3 sgPoint=sgCenter+sgDirection.xyz*sgTravel+vec3(0.0,.085*sgAt-sgGravity*sgAt*sgAt,0.0);sgPoint.y=max(.018,sgPoint.y);float sgLight=sgTime>=sgLag+sgTrail.y?pow(1.0-sgJ/sgCount,1.7)*(sgJ==0.0?2.0:.9):0.0;if(sgJ==0.0)sgLight*=sgHead;\n#include <color_vertex>\nvColor*=sgLight;`);
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed=sgPoint;');};f.m.customProgramCacheKey=()=>key+'|simple-gpu-v1';f.m.needsUpdate=true;f.gpuSimple=u;
}
export function updateSimpleGpu(f,t){
 f.gpuSimple.sgTime.value=t;let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;
 const expansion=1-Math.exp(-(f.size===20?.7:1.9)*t),rise=.085*t,drop=f.spec.gravity*t*t;
 for(let i=0;i<f.n;i++){
  if(t<(f.spec.ignition?.[f.starLayers[i]]??0))continue;
  const d=f.directions[i],travel=f.r*f.shells[i]*expansion,x=f.x+d.x*travel,y=Math.fround(Math.max(.018,f.y+d.y*travel+rise-drop)),z=f.z+d.z*travel,brightness=2*(f.size>=3?1.25:1);
  light+=brightness;lightX+=x*brightness;lightY+=y*brightness;lightZ+=z*brightness;lightR2+=(x*x+y*y+z*z)*brightness;
  if(f.layerLight){f.layerLight[f.starLayers[i]]+=brightness;lightShellR2+=f.shells[i]*f.shells[i]*brightness;}
 }
 const out=f.simpleLight??={};Object.assign(out,{light,lightX,lightY,lightZ,lightR2,lightShellR2});return out;
}
