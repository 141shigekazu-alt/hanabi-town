import * as T from './vendor/three.module.js';
// Colored reflection grows with the visible stars, not the initial break flash.
export function reflectionAppearance(radiusFraction){const x=Math.max(0,Math.min(1,(radiusFraction-.015)/.145));return x*x*(3-2*x);}
// Lightweight, view-dependent approximation of a luminous sphere reflected in rippling water.
// Not a second rendered camera: stays stereo-aware through cameraPosition in each eye pass.
export function reflectionMaterial(color,inner,layers=null){const material=new T.ShaderMaterial({
 transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
 uniforms:{uCenter:{value:new T.Vector3()},uRadius:{value:.3},uWaterY:{value:.005},uGain:{value:0},uTime:{value:0},uWorldScale:{value:1},uDetail:{value:1},uColor:{value:color.clone()},uInner:{value:inner.clone()}},
 vertexShader:`varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`precision highp float;
 varying vec3 vWorld; uniform float uDetail;
 uniform vec3 uCenter,uColor,uInner;
 uniform float uRadius,uWaterY,uGain,uTime; uniform float uWorldScale;
 void main(){
 vec3 wavePoint=vWorld/uWorldScale*uDetail;
 vec3 virtualCenter=uCenter;virtualCenter.y=2.0*uWaterY-uCenter.y;
 vec3 ray=normalize(vWorld-cameraPosition);
 // Small moving distortions break the circular image into ripples.
 float wave=sin(wavePoint.z*115.0+uTime*2.1+sin(wavePoint.x*35.0))*0.012;
 ray.x+=wave;ray.z+=sin(wavePoint.x*86.0-uTime*1.4)*0.005;ray=normalize(ray);
 vec3 delta=virtualCenter-cameraPosition;float along=dot(delta,ray);
 float distanceToCenter=length(delta-ray*along)/max(uRadius,0.001);
 float outer=exp(-pow((distanceToCenter-0.80)/0.16,2.0));
 float inner=exp(-pow((distanceToCenter-0.40)/0.14,2.0));
 float haze=exp(-distanceToCenter*distanceToCenter*1.1)*0.20;
 float ripple=pow(0.5+0.5*sin(wavePoint.z*155.0+uTime*2.4+sin(wavePoint.x*41.0)),5.0);
 float grain=0.6+0.4*sin(wavePoint.x*180.0+sin(wavePoint.z*69.0));
 float envelope=(1.0-smoothstep(0.6,1.8,distanceToCenter))*step(0.0,along);
 vec3 glow=(uColor*(outer+haze)+uInner*inner)*(0.18+0.82*ripple)*grain;
 // Elongated glow approximates rough water scattering beyond the sharp reflection.
 float mixToPlane=(cameraPosition.y-uWaterY)/max(cameraPosition.y-virtualCenter.y,0.001);
 vec2 reflectionPoint=mix(cameraPosition,virtualCenter,mixToPlane).xz;
 vec2 offset=vWorld.xz-reflectionPoint;
 float streak=exp(-pow(offset.x/(uRadius*0.48+0.05*uWorldScale),2.0)-pow(offset.y/(uRadius*1.8+0.2*uWorldScale),2.0));
 vec3 scatter=mix(uColor,uInner,0.25)*streak*(0.12+0.88*ripple)*grain*0.65;
 gl_FragColor=vec4((glow*envelope+scatter)*uGain,1.0);
 }`
});
 if(layers){
  material.uniforms.uLayerRadii={value:layers.radii.concat(Array(6-layers.radii.length).fill(0))};
  material.uniforms.uLayerGains={value:Array(6).fill(0)};
  material.uniforms.uLayerColors={value:layers.colors.concat(Array.from({length:6-layers.colors.length},()=>new T.Color(0)))};
  material.fragmentShader=material.fragmentShader.replace('uniform float uRadius,uWaterY,uGain,uTime; uniform float uWorldScale;','uniform float uRadius,uWaterY,uGain,uTime; uniform float uWorldScale; uniform float uLayerRadii[6],uLayerGains[6]; uniform vec3 uLayerColors[6];').replace('vec3 glow=(uColor*(outer+haze)+uInner*inner)*(0.18+0.82*ripple)*grain;',`vec3 layerGlow=vec3(0.0),litColor=vec3(0.0);float litWeight=0.0;
 for(int i=0;i<6;i++){float weight=uLayerGains[i];layerGlow+=uLayerColors[i]*weight*exp(-pow((distanceToCenter-uLayerRadii[i]*0.8)/0.038,2.0));litColor+=uLayerColors[i]*weight;litWeight+=weight;}
 litColor/=max(litWeight,0.001);vec3 glow=(layerGlow+litColor*haze)*(0.18+0.82*ripple)*grain;`).replace('mix(uColor,uInner,0.25)*streak','litColor*streak');
 }
 return material;
}
