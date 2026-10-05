import * as T from './vendor/three.module.js';

export function clampBrightness(value){return Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):1));}

// Three r170 forces a transparent clear in alpha-blend XR. Draw a clip-space
// black background instead, before all town, fireworks and UI geometry.
export class MRDimming{
 constructor(scene){
  this.mesh=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({
   uniforms:{darkness:{value:0}},
   vertexShader:'void main(){gl_Position=vec4(position.xy,1.0,1.0);}',
   fragmentShader:'uniform float darkness; void main(){gl_FragColor=vec4(0.0,0.0,0.0,darkness);}',
   blending:T.NoBlending,depthTest:false,depthWrite:false,toneMapped:false
  }));
  this.mesh.renderOrder=-1000000;this.mesh.frustumCulled=false;this.mesh.visible=false;scene.add(this.mesh);
 }
 set(value,blendMode){
  const brightness=clampBrightness(value);this.mesh.material.uniforms.darkness.value=1-brightness;
  this.mesh.visible=blendMode==='alpha-blend'&&brightness<1;
 }
 end(){this.mesh.visible=false;}
}
