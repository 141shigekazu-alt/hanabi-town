import * as T from './vendor/three.module.js';
// Bake surface markings and periodic cloud noise once. Both eyes sample the same sky.
function noise(x,y,period,seed){
 const hash=(i,j)=>{let k=Math.imul((i%period+period)%period+seed,374761393)^Math.imul(j+seed,668265263);k=Math.imul(k^(k>>>13),1274126177);return ((k^(k>>>16))>>>0)/4294967296;};
 const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v);
 return (hash(ix,iy)*(1-a)+hash(ix+1,iy)*a)*(1-b)+(hash(ix,iy+1)*(1-a)+hash(ix+1,iy+1)*a)*b;
}
function skyTexture(){
 const n=256,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=x/n,v=y/n,i=(y*n+x)*4;
  const layer=(a,b,seed)=>noise(u*a,v*b,a,seed);
  data[i]=255*(.55*layer(5,17,11)+.30*layer(13,34,7)+.15*layer(31,62,2));
  data[i+1]=255*(.6*layer(7,7,3)+.28*layer(17,17,23)+.12*layer(37,37,53));
  data[i+3]=255;
 }
 const texture=new T.DataTexture(data,n,n);texture.wrapS=T.RepeatWrapping;texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
export function createMoonSky(scene){
 const uniforms={atlas:{value:skyTexture()},clock:{value:0}};
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms,
 vertexShader:'varying vec2 coord;void main(){coord=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`varying vec2 coord;uniform sampler2D atlas;uniform float clock;
 void main(){
 vec2 p=(coord-.5)*vec2(4.,2.);float r=length(p),disc=1.-smoothstep(.205,.218,r);
 float grain=texture2D(atlas,p*1.9+.5).g;
 float relief=.78+.20*smoothstep(.28,.68,grain)-.13*clamp(r/.215,0.,1.);
 float halo=.105*exp(-7.*r);
 float drift=clock*.026;
 float wisps=texture2D(atlas,vec2(coord.x*.78-drift,.27+coord.y*.33)).r;
 float lane=exp(-pow((p.y-.025-.085*sin(coord.x*5.-drift*4.))/.26,2.));
 float cloud=smoothstep(.31,.62,wisps)*lane*(.55+.45*sin(coord.x*12.-drift*13.));
 float edge=(1.-smoothstep(.63,.99,abs(coord.x*2.-1.)))*(1.-smoothstep(.72,.99,abs(coord.y*2.-1.)));
 float moon=disc*.91*(1.-.77*cloud), mist=.34*cloud*edge;
 float a=moon+halo*(1.-disc)+mist*(1.-disc);if(a<.002)discard;
 vec3 c=(vec3(.96,.90,.76)*relief*moon+vec3(.71,.75,.84)*halo*(1.-disc)+vec3(.55,.62,.72)*mist*(1.-disc))/a;
 gl_FragColor=vec4(c,a);
 }`});
 const sky=new T.Mesh(new T.PlaneGeometry(130,65),mat);sky.name='moon-and-thin-cloud';sky.renderOrder=-100;sky.visible=false;scene.add(sky);
 const cloudMaterial=new T.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms,vertexShader:mat.vertexShader,
  fragmentShader:`varying vec2 coord;uniform sampler2D atlas;uniform float clock;
  void main(){
   float drift=clock*.014;
   float grain=texture2D(atlas,vec2(coord.x*.94-drift,.37+coord.y*.26)).r;
   float ridge=.48+.09*sin(coord.x*7.-drift);
   float band=1.-smoothstep(.02,.32,abs(coord.y-ridge));
   float ends=smoothstep(0.,.23,coord.x)*(1.-smoothstep(.70,1.,coord.x));
   float opacity=.34*band*ends*smoothstep(.32,.69,grain);
   if(opacity<.002)discard;
   gl_FragColor=vec4(.53,.60,.68,opacity);
  }`
 });
 const wisp=new T.Mesh(new T.PlaneGeometry(120,22),cloudMaterial);
 wisp.name='distant-cloud';wisp.renderOrder=-100;wisp.visible=false;scene.add(wisp);
 const cloudDirection=new T.Vector3(-.065,.32,-1).normalize();
 const eye=new T.Vector3(),direction=new T.Vector3(),localDirection=new T.Vector3(-.31,.48,-1).normalize();
 return (mode,town,camera,pose,stamp)=>{sky.visible=mode==='bridge'||mode==='boat'||mode==='rooftop';wisp.visible=sky.visible;if(!sky.visible)return;
 if(pose)eye.copy(pose.position);else camera.getWorldPosition(eye);
 direction.copy(localDirection).applyQuaternion(town.quaternion);sky.position.copy(eye).addScaledVector(direction,680);sky.lookAt(eye);direction.copy(cloudDirection).applyQuaternion(town.quaternion);wisp.position.copy(eye).addScaledVector(direction,680);wisp.lookAt(eye);uniforms.clock.value=stamp/1000;};
}
