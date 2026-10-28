import * as T from './vendor/three.module.js';
import {viewBoatPose} from './boat-cruise.js';
import {EITAI_ANGLE,BRIDGE_DECK} from './city-layout.js';

// Town units are authored for the miniature. XR cameras, controllers and UI
// always stay in physical metres; only the town is enlarged around the viewer.
export const BRIDGE_SCALE=100,SEATED_EYE_HEIGHT=1.2;
export const TURN_SPEED=Math.PI/4; // Full stick: 45 degrees per second.
export const ROOFTOP_POSTURE=Object.freeze({standLift:.5,sitRadius:.42,leaveRadius:.65,frequency:5});
// Move the seated viewpoint 2.125 metres left along the deck, midway between adjacent hangers.
const bridgeAngle=EITAI_ANGLE;
export const BRIDGE_ENTRY_LOCAL=new T.Vector3(-.02125,BRIDGE_DECK.height,-.026);
export const BRIDGE_WALK=Object.freeze({minX:((-BRIDGE_DECK.length/2-BRIDGE_ENTRY_LOCAL.x)*BRIDGE_SCALE+.5)*.75,maxX:((BRIDGE_DECK.length/2-BRIDGE_ENTRY_LOCAL.x)*BRIDGE_SCALE-.5)*.75,minZ:(-BRIDGE_DECK.width/2-BRIDGE_ENTRY_LOCAL.z)*BRIDGE_SCALE+.4,maxZ:(BRIDGE_DECK.width/2-BRIDGE_ENTRY_LOCAL.z)*BRIDGE_SCALE-.4});
export const FRONT_BRIDGE=BRIDGE_ENTRY_LOCAL.clone().applyAxisAngle(new T.Vector3(0,1,0),bridgeAngle).add(new T.Vector3(.22*Math.sin(.67*2.7+.35),0,.67));
const initialBoat=viewBoatPose(0);
export const BOAT_ORIGIN=new T.Vector3(initialBoat.x,0,initialBoat.z);
export const BOAT_EYE=BOAT_ORIGIN.clone().add(new T.Vector3(0,.062,-.054).applyAxisAngle(new T.Vector3(0,1,0),initialBoat.angle));
// Metres relative to the initial deck position. Keep stick movement inside the rails.
export const BOAT_WALK={minX:-1.8,maxX:1.8,minZ:-3.8,maxZ:9.3};
export class BridgeView{
 constructor(town,camera){this.town=town;this.camera=camera;this.active=false;this.miniaturePointScale=1;this.saved=null;this.pointSizes=new WeakMap();this.pointMaps=new WeakMap();this.eye=new T.Vector3();this.forward=new T.Vector3();this.up=new T.Vector3();this.boatPose=viewBoatPose(0);this.boatWalk=new T.Vector3();this.cruiseAnchor=new T.Vector3();this.cruiseSeat=new T.Vector3();this.cruiseUp=new T.Vector3(0,1,0);}
 setRooftop(view){this.rooftop=view;}
 origin(mode=this.mode){return mode==='boat'?this.boatSeat():mode==='rooftop'?this.rooftop.seat:FRONT_BRIDGE;}
 point(material,maps=null,baseSize=null){
  if(baseSize!==null)this.pointSizes.set(material,baseSize);
  if(!this.pointSizes.has(material))this.pointSizes.set(material,material.size);
  if(maps)this.pointMaps.set(material,maps);
  material.size=this.pointSizes.get(material)*(this.active?BRIDGE_SCALE:this.miniaturePointScale);
  const profile=this.pointMaps.get(material);if(profile)material.map=this.active?profile.bridge:profile.miniature;
 }
 syncPoints(){this.town.traverse(o=>{if(o.isPoints)this.point(o.material);});}
 enter(transform=null,mode='bridge',force=false){
  if(this.active&&this.mode===mode&&!force)return;
  if(!this.active)this.saved={xr:!!transform,position:this.town.position.clone(),quaternion:this.town.quaternion.clone(),scale:this.town.scale.clone(),cameraPosition:this.camera.position.clone(),cameraQuaternion:this.camera.quaternion.clone(),far:this.camera.far};
  this.rooftopPosture=mode==='rooftop'?{seated:true,lift:0,velocity:0}:null;
  this.mode=mode;this.walk=new T.Vector3();this.boatWalk.set(0,0,0);this.active=true;this.town.scale.setScalar(BRIDGE_SCALE);
  if(transform){
   const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);
   if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
   // local-floor already tracks the real floor. Bridge entry must not lift it
   // to a fixed seated eye height; keep the boat's adopted seated presentation.
   const eyeHeight=mode==='boat'?SEATED_EYE_HEIGHT:p.y;
   this.cruiseYaw=Math.atan2(-x,-z);this.town.rotation.set(0,this.cruiseYaw-(mode==='boat'?this.boatPose.angle:mode==='rooftop'?this.rooftop.angle:0),0);this.cruiseAnchor.set(p.x,p.y-eyeHeight,p.z);
   const seat=this.origin(mode).clone().multiplyScalar(BRIDGE_SCALE).applyQuaternion(this.town.quaternion);
   this.town.position.set(p.x-seat.x,p.y-eyeHeight-seat.y,p.z-seat.z);
  }else{
   this.town.position.set(0,0,0);this.town.rotation.set(0,0,0);
   this.camera.position.copy(this.origin(mode)).multiplyScalar(BRIDGE_SCALE);this.camera.position.y+=SEATED_EYE_HEIGHT;
  }
  this.town.visible=true;this.camera.far=1000;this.camera.updateProjectionMatrix();this.town.updateWorldMatrix(true,false);this.syncPoints();
 }
 boatSeat(){const p=this.boatPose;return this.cruiseSeat.set(this.boatWalk.x/BRIDGE_SCALE,.062,-.054+this.boatWalk.z/BRIDGE_SCALE).applyAxisAngle(this.cruiseUp,p.angle).add(this.eye.set(p.x,p.y,p.z));}
 cruise(pose){
  Object.assign(this.boatPose,pose);if(!this.active||this.mode!=='boat')return;
  const seat=this.boatSeat().multiplyScalar(BRIDGE_SCALE);
  if(this.saved.xr){this.town.rotation.set(0,this.cruiseYaw-pose.angle,0);seat.applyQuaternion(this.town.quaternion);this.town.position.copy(this.cruiseAnchor).sub(seat);}
  else{this.camera.position.copy(seat);this.camera.position.y+=SEATED_EYE_HEIGHT;}
  this.town.updateWorldMatrix(true,false);
 }
 move(x,y,dt,viewer=null){
  if(!this.active||(!x&&!y))return;
  const boat=this.mode==='boat',rooftop=this.mode==='rooftop',angle=boat?this.boatPose.angle:rooftop?this.rooftop.angle:bridgeAngle;
  const bounds=boat?BOAT_WALK:rooftop?this.rooftop.bounds:BRIDGE_WALK;
  const matrix=viewer?.matrix??this.camera.matrixWorld.elements;
  const forward=new T.Vector3(-matrix[8],0,-matrix[10]);if(forward.lengthSq()<.0001)return;forward.normalize();
  const right=new T.Vector3(-forward.z,0,forward.x),delta=right.multiplyScalar(x).addScaledVector(forward,-y);
  if(delta.length()>1)delta.normalize();delta.multiplyScalar(Math.min(dt,.05)*.65);
  const inverse=this.town.quaternion.clone().invert(),up=new T.Vector3(0,1,0);
  delta.applyQuaternion(inverse).applyAxisAngle(up,-angle);
  // Include physical head displacement in the candidate. Never reposition in response to head motion alone.
  const eye=viewer?.position??this.camera.position;
  const origin=boat?new T.Vector3(this.boatPose.x,this.boatPose.y,this.boatPose.z):this.origin();
  const relative=this.town.worldToLocal(new T.Vector3(eye.x,eye.y,eye.z)).sub(origin).multiplyScalar(BRIDGE_SCALE).applyAxisAngle(up,-angle);
  if(boat)relative.z+=5.4;
  const dx=T.MathUtils.clamp(relative.x+delta.x,bounds.minX,bounds.maxX)-relative.x;
  const dz=T.MathUtils.clamp(relative.z+delta.z,bounds.minZ,bounds.maxZ)-relative.z;
  // If physical movement has already left the area, only accept a step back toward it.
  const allowed=(v,d,lo,hi,requested)=>v<lo?(requested>0?Math.min(requested,hi-v):0):v>hi?(requested<0?Math.max(requested,lo-v):0):d;
  const localStep=new T.Vector3(allowed(relative.x,dx,bounds.minX,bounds.maxX,delta.x),0,allowed(relative.z,dz,bounds.minZ,bounds.maxZ,delta.z));
  // Keep the walking offset in the boat's frame, so sailing/turning cannot undo it.
  // The physical anchor is never recalculated from head movement.
  if(boat){this.boatWalk.add(localStep);this.cruise(this.boatPose);return;}
  const step=localStep.applyAxisAngle(up,angle).applyQuaternion(this.town.quaternion);
  if(viewer)this.town.position.sub(step);else this.camera.position.add(step);
  this.walk.add(step);this.town.updateWorldMatrix(true,false);
 }
 // Rotate the enlarged world around the current headset, not the original
 // seat. Keep the same local eye position, floor height and chair travel.
 turn(x,dt,viewer){
  if(!this.active||!this.saved?.xr||!viewer||!Number.isFinite(x)||!x||!(dt>0))return;
  const angle=T.MathUtils.clamp(x,-1,1)*TURN_SPEED*Math.min(dt,.05);
  const pivot=new T.Vector3(viewer.position.x,viewer.position.y,viewer.position.z);
  const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle);
  this.town.position.sub(pivot).applyQuaternion(rotation).add(pivot);
  this.town.quaternion.premultiply(rotation);
  this.walk.applyQuaternion(rotation);
  if(this.mode==='boat'){
   this.cruiseYaw+=angle;
   this.cruiseAnchor.sub(pivot).applyQuaternion(rotation).add(pivot);
  }
  this.town.updateWorldMatrix(true,false);
 }
 // Chair zones follow stick travel, so looking or leaning over the rail does
 // not make the viewer stand. Preserve the headset's natural tracking height.
 updateRooftopPosture(dt){
  if(!this.active||this.mode!=='rooftop'||!this.rooftopPosture||!(dt>0))return;
  const p=this.rooftopPosture,up=new T.Vector3(0,1,0);
  const local=this.walk.clone().applyQuaternion(this.town.quaternion.clone().invert()).applyAxisAngle(up,-this.rooftop.angle);
  const distance=Math.min(...this.rooftop.chairZones.map(c=>Math.hypot(local.x-c.x,local.z-c.z)));
  if(p.seated&&distance>ROOFTOP_POSTURE.leaveRadius)p.seated=false;
  else if(!p.seated&&distance<ROOFTOP_POSTURE.sitRadius)p.seated=true;
  // Exact critically damped spring: continuous position and velocity even if
  // the viewer changes direction halfway through sitting down or standing up.
  const target=p.seated?0:ROOFTOP_POSTURE.standLift,w=ROOFTOP_POSTURE.frequency;
  const step=Math.min(dt,.05),error=p.lift-target,decay=Math.exp(-w*step),term=(p.velocity+w*error)*step;
  const next=target+(error+term)*decay,delta=next-p.lift;
  p.velocity=(p.velocity-w*term)*decay;p.lift=next;
  if(this.saved.xr)this.town.position.y-=delta;else this.camera.position.y+=delta;
  this.town.updateWorldMatrix(true,false);
 }
 leave(){
  if(!this.active)return;const s=this.saved;this.active=false;this.rooftopPosture=null;
  this.town.position.copy(s.position);this.town.quaternion.copy(s.quaternion);this.town.scale.copy(s.scale);
  if(!s.xr){this.camera.position.copy(s.cameraPosition);this.camera.quaternion.copy(s.cameraQuaternion);}this.camera.far=s.far;this.camera.updateProjectionMatrix();this.syncPoints();this.saved=null;
 }
 position(x,y,z){if(!this.active)return null;return this.town.localToWorld(new T.Vector3(x,y,z));}
 delay(x,y,z,transform=null){const p=transform?.position??this.camera.position;return this.position(x,y,z).distanceTo(this.eye.set(p.x,p.y,p.z))/343;}
 listener(context,transform=null){
  if(!this.active||!context?.listener)return;
  if(transform){const m=transform.matrix,p=transform.position;this.eye.set(p.x,p.y,p.z);this.forward.set(-m[8],-m[9],-m[10]);this.up.set(m[4],m[5],m[6]);}
  else{this.eye.copy(this.camera.position);this.forward.set(0,0,-1).applyQuaternion(this.camera.quaternion);this.up.set(0,1,0).applyQuaternion(this.camera.quaternion);}
  const l=context.listener,t=context.currentTime;
  if(l.positionX){for(const [prefix,v] of [['position',this.eye],['forward',this.forward],['up',this.up]])for(const axis of ['X','Y','Z'])l[prefix+axis].setValueAtTime(v[axis.toLowerCase()],t);}
  else{l.setPosition(this.eye.x,this.eye.y,this.eye.z);l.setOrientation(this.forward.x,this.forward.y,this.forward.z,this.up.x,this.up.y,this.up.z);}
 }
}
