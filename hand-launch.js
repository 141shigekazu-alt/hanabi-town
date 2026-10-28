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

export class HandLaunch{
 constructor({scene,entries,fire,enabled,blocked}){
  Object.assign(this,{entries,fire,enabled,blocked});this.gesture=new HandLaunchGesture();this.closed=new WeakSet();this.lights=new Map();this.direction=new T.Vector3();this.origin=new T.Vector3();this.eye=new T.Vector3();
  const texture=glowTexture();
  for(const e of entries){const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,toneMapped:false}));sprite.scale.setScalar(.10);sprite.visible=false;sprite.renderOrder=995;scene.add(sprite);this.lights.set(e,sprite);e.controller.addEventListener('disconnected',()=>{sprite.visible=false;this.gesture.reset();this.closed=new WeakSet();});e.controller.addEventListener('connected',()=>{sprite.visible=false;this.gesture.reset();this.closed=new WeakSet();});}
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
   if(state.charge>0){this.eye.set(eye.x,eye.y,eye.z).sub(this.origin).normalize();sprite.position.copy(this.origin).addScaledVector(this.eye,.045);sprite.material.opacity=state.armed?.96:.22+state.charge*.50;sprite.visible=true;}
   if(state.fire)this.fire(s.handedness,this.origin.clone().addScaledVector(this.direction,.045),this.direction.clone());
  }
 }
}
