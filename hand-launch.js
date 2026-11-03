import * as T from './vendor/three.module.js';
import {HandLaunchGesture} from './hand-launch-gesture.js';
const fingers=['index','middle','ring','pinky'];
const jointNames=['wrist',...fingers.flatMap(f=>[`${f}-finger-phalanx-proximal`,`${f}-finger-tip`])];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function readLaunchHand(source,frame,referenceSpace){
 if(!source?.hand||!frame?.getJointPose)return null;
 const joints={};for(const name of jointNames){const space=source.hand.get(name),pose=space&&frame.getJointPose(space,referenceSpace),p=pose?.transform?.position;if(!p||![p.x,p.y,p.z].every(Number.isFinite))return null;joints[name]=p;}
 const wrist=joints.wrist;let curled=0,straight=0;
 for(const f of fingers){const base=joints[`${f}-finger-phalanx-proximal`],tip=joints[`${f}-finger-tip`],span=distance(base,wrist);if(span<.025||span>.16)return null;const ratio=distance(tip,wrist)/span;if(ratio<1.12)curled++;if(ratio>1.5)straight++;}
 const middle=joints['middle-finger-phalanx-proximal'];
 return {closed:curled===4,open:straight===4,palm:{x:(wrist.x+middle.x)*.5,y:(wrist.y+middle.y)*.5,z:(wrist.z+middle.z)*.5}};
}
// An open panel alone does not block aiming at empty sky.
export function handLaunchBlocked({preparing=false,grabs=0,panels=[],hit=null,ignore=false}={}){
 return preparing||grabs>0||panels.some(p=>p?.childView||p?.grab||p?.sliderDrag)||!!hit||ignore;
}
function glowTexture(){const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4,core=Math.max(0,Math.min(1,(.22-r)/.045));
 data[i]=255;data[i+1]=Math.round(194+44*core);data[i+2]=Math.round(70+106*core);
 data[i+3]=Math.round(255*Math.min(1,core+.65*Math.exp(-r*r*5))*Math.max(0,Math.min(1,(1-r)*3)));
 }const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;}

// A fixed pool for each hand. The palm anchor never shakes; only light does.
class HandChargeGlow extends T.Group{
 constructor(texture,phase){
  super();this.phase=phase;this.visible=false;
  const common={transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,toneMapped:false};
  this.core=new T.Sprite(new T.SpriteMaterial({...common,map:texture}));this.add(this.core);
  this.surfacePositions=new Float32Array(32*3);this.surfaceColors=new Float32Array(32*3);
  this.sparkPositions=new Float32Array(18*4*3);this.sparkColors=new Float32Array(18*4*3);
  const geometry=(positions,colors)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));return g;};
  this.surface=new T.Points(geometry(this.surfacePositions,this.surfaceColors),new T.PointsMaterial({...common,map:texture,size:.005,vertexColors:true}));
  this.sparks=new T.LineSegments(geometry(this.sparkPositions,this.sparkColors),new T.LineBasicMaterial({...common,vertexColors:true}));
  this.dynamicGeometries=[this.surface.geometry,this.sparks.geometry];
  this.add(this.surface,this.sparks);for(const object of this.children){object.frustumCulled=false;object.renderOrder=995;}
 }
 animate(stamp,charge,armed){
  const t=stamp*.001+this.phase,energy=armed?1:Math.max(0,Math.min(1,charge));
  // Restrained irregular pulses; never a full on/off flash or a growing charge.
  const pulse=.90+.055*Math.sin(t*19)+.045*Math.sin(t*31.7+.8);
  this.core.scale.setScalar(.10*(1+.035*Math.sin(t*23.1)));
  this.core.material.opacity=(armed?.96:.22+energy*.50)*pulse;
  const strength=(.16+.84*energy)*pulse;
  for(let i=0;i<32;i++){
   const y=1-2*(i+.5)/32,a=i*2.399963+t*(i%2?.95:-.75),r=(.017+.003*Math.sin(t*17+i*4.1)),h=Math.sqrt(1-y*y),k=i*3;
   this.surfacePositions[k]=Math.cos(a)*h*r;this.surfacePositions[k+1]=y*r;this.surfacePositions[k+2]=Math.sin(a)*h*r;
   const hot=strength*(.35+.65*Math.pow(.5+.5*Math.sin(t*(13+i%5)+i*8.7),3));
   this.surfaceColors[k]=hot*1.9;this.surfaceColors[k+1]=hot*1.1;this.surfaceColors[k+2]=hot*.36;
  }
  for(let i=0;i<18;i++){
   // Different lifetimes/phases prevent a ring of synchronized sparks.
   const age=(t*(3.3+(i%7)*.27)+i*.618034)%1,cycle=Math.floor(t*(3.3+(i%7)*.27)+i*.618034);
   const y=Math.sin(i*7.13+cycle*1.91)*.92,a=i*2.399963+cycle*2.71,h=Math.sqrt(1-y*y),dx=Math.cos(a)*h,dz=Math.sin(a)*h;
   const root=.014+age*.015,length=(.006+.010*energy)*Math.sin(Math.PI*age),bend=.003*Math.sin(t*49+i*3.7);
   for(let j=0;j<4;j++){
    const k=(i*4+j)*3,r=root+length*(j===0?0:j===3?1:.52),mid=j===1||j===2?bend:0;
    this.sparkPositions[k]=dx*r+Math.cos(a+1.57)*mid;this.sparkPositions[k+1]=y*r+mid*.45;this.sparkPositions[k+2]=dz*r+Math.sin(a+1.57)*mid;
    const hot=strength*Math.sin(Math.PI*age)*(j===3?.3:1.3);
    this.sparkColors[k]=hot*1.5;this.sparkColors[k+1]=hot*.85;this.sparkColors[k+2]=hot*.22;
   }
  }
  for(const geometry of this.dynamicGeometries){geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;}
 }
}

export class HandLaunch{
 constructor({scene,entries,fire,enabled,blocked}){
  Object.assign(this,{entries,fire,enabled,blocked});this.gesture=new HandLaunchGesture();this.closed=new WeakSet();this.lights=new Map();this.direction=new T.Vector3();this.origin=new T.Vector3();this.eye=new T.Vector3();
  const texture=glowTexture();
  for(const [index,e] of entries.entries()){const sprite=new HandChargeGlow(texture,index*2.73);scene.add(sprite);this.lights.set(e,sprite);e.controller.addEventListener('disconnected',()=>{sprite.visible=false;this.gesture.reset();this.closed=new WeakSet();});e.controller.addEventListener('connected',()=>{sprite.visible=false;this.gesture.reset();this.closed=new WeakSet();});}
 }
 suppressMenu(source,stamp){return this.closed.has(source)||this.gesture.suppress(source,stamp);}
 update(stamp,frame,referenceSpace,viewer){
  if(!frame||!viewer){this.gesture.reset();this.closed=new WeakSet();for(const sprite of this.lights.values())sprite.visible=false;return;}
  for(const e of this.entries){const sprite=this.lights.get(e),s=e.source;sprite.visible=false;if(!s?.hand)continue;
   const shape=readLaunchHand(s,frame,referenceSpace),pose=frame.getPose(s.targetRaySpace,referenceSpace);
   if(!shape||!pose){this.closed.delete(s);this.gesture.sample(s,stamp,{tracked:false});continue;}
   shape.closed?this.closed.add(s):this.closed.delete(s);
   e.controller.updateWorldMatrix(true,false);this.direction.set(0,0,-1).transformDirection(e.controller.matrixWorld);
   this.origin.set(shape.palm.x,shape.palm.y,shape.palm.z);
   const eye=viewer.position,reach=Math.hypot(shape.palm.x-eye.x,shape.palm.y-eye.y,shape.palm.z-eye.z);
   const sky=this.direction.y>.12&&shape.palm.y>eye.y-.45&&reach>.20&&reach<1.25;
   const eligible=sky&&this.enabled()&&!this.blocked(e);
   const state=this.gesture.sample(s,stamp,{...shape,eligible});
   if(state.charge>0){this.eye.set(eye.x,eye.y,eye.z).sub(this.origin).normalize();sprite.position.copy(this.origin).addScaledVector(this.eye,.045);sprite.animate(stamp,state.charge,state.armed);sprite.visible=true;}
   if(state.fire)this.fire(s.handedness,this.origin.clone().addScaledVector(this.direction,.045),this.direction.clone());
  }
 }
}
