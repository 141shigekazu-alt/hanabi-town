import * as T from './vendor/three.module.js';

// Town units are authored for the miniature. XR cameras, controllers and UI
// always stay in physical metres; only the town is enlarged around the viewer.
export const BRIDGE_SCALE=100,SEATED_EYE_HEIGHT=1.2;
// Move the seated viewpoint 2.125 metres left along the deck, midway between adjacent hangers.
const bridgeAngle=Math.atan(.594*Math.cos(.67*2.7+.35));
export const FRONT_BRIDGE=new T.Vector3(-.02125,.1025,-.026).applyAxisAngle(new T.Vector3(0,1,0),bridgeAngle).add(new T.Vector3(.22*Math.sin(.67*2.7+.35),0,.67));
export const BOAT_ORIGIN=new T.Vector3(.22*Math.sin(.55*2.7+.35),0,.55);
export const BOAT_EYE=BOAT_ORIGIN.clone().add(new T.Vector3(0,.062,-.054));
export class BridgeView{
 constructor(town,camera){this.town=town;this.camera=camera;this.active=false;this.miniaturePointScale=1;this.saved=null;this.pointSizes=new WeakMap();this.pointMaps=new WeakMap();this.eye=new T.Vector3();this.forward=new T.Vector3();this.up=new T.Vector3();}
 point(material,maps=null,baseSize=null){
  if(baseSize!==null)this.pointSizes.set(material,baseSize);
  if(!this.pointSizes.has(material))this.pointSizes.set(material,material.size);
  if(maps)this.pointMaps.set(material,maps);
  material.size=this.pointSizes.get(material)*(this.active?BRIDGE_SCALE:this.miniaturePointScale);
  const profile=this.pointMaps.get(material);if(profile)material.map=this.active?profile.bridge:profile.miniature;
 }
 syncPoints(){this.town.traverse(o=>{if(o.isPoints)this.point(o.material);});}
 enter(transform=null,mode='bridge'){
  if(this.active)return;
  this.saved={position:this.town.position.clone(),quaternion:this.town.quaternion.clone(),scale:this.town.scale.clone(),cameraPosition:this.camera.position.clone(),cameraQuaternion:this.camera.quaternion.clone(),far:this.camera.far};
  this.mode=mode;this.walk=new T.Vector3();this.active=true;this.town.scale.setScalar(BRIDGE_SCALE);
  if(transform){
   const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);
   if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
   this.town.rotation.set(0,Math.atan2(-x,-z),0);
   const seat=(mode==='boat'?BOAT_EYE:FRONT_BRIDGE).clone().multiplyScalar(BRIDGE_SCALE).applyQuaternion(this.town.quaternion);
   this.town.position.set(p.x-seat.x,p.y-SEATED_EYE_HEIGHT-seat.y,p.z-seat.z);
  }else{
   this.town.position.set(0,0,0);this.town.rotation.set(0,0,0);
   this.camera.position.copy(mode==='boat'?BOAT_EYE:FRONT_BRIDGE).multiplyScalar(BRIDGE_SCALE);this.camera.position.y+=SEATED_EYE_HEIGHT;
  }
  this.town.visible=true;this.camera.far=1000;this.camera.updateProjectionMatrix();this.town.updateWorldMatrix(true,false);this.syncPoints();
 }
 move(x,y,dt,viewer=null){
  if(!this.active||this.mode!=='bridge'||(!x&&!y))return;
  const matrix=viewer?.matrix??this.camera.matrixWorld.elements;
  const forward=new T.Vector3(-matrix[8],0,-matrix[10]);if(forward.lengthSq()<.0001)return;forward.normalize();
  const right=new T.Vector3(-forward.z,0,forward.x),delta=right.multiplyScalar(x).addScaledVector(forward,-y);
  if(delta.length()>1)delta.normalize();delta.multiplyScalar(Math.min(dt,.05)*.65);
  const inverse=this.town.quaternion.clone().invert(),up=new T.Vector3(0,1,0);
  delta.applyQuaternion(inverse).applyAxisAngle(up,-bridgeAngle);
  // Include physical head displacement in the candidate. Never reposition in response to head motion alone.
  const eye=viewer?.position??this.camera.position;
  const relative=this.town.worldToLocal(new T.Vector3(eye.x,eye.y,eye.z)).sub(FRONT_BRIDGE).multiplyScalar(BRIDGE_SCALE).applyAxisAngle(up,-bridgeAngle);
  const dx=T.MathUtils.clamp(relative.x+delta.x,-1.45,1.45)-relative.x;
  const dz=T.MathUtils.clamp(relative.z+delta.z,-.70,.80)-relative.z;
  // If physical movement has already left the area, only accept a step back toward it.
  const allowed=(v,d,lo,hi,requested)=>v<lo?(requested>0?Math.min(requested,hi-v):0):v>hi?(requested<0?Math.max(requested,lo-v):0):d;
  const step=new T.Vector3(allowed(relative.x,dx,-1.45,1.45,delta.x),0,allowed(relative.z,dz,-.70,.80,delta.z)).applyAxisAngle(up,bridgeAngle).applyQuaternion(this.town.quaternion);
  if(viewer)this.town.position.sub(step);else this.camera.position.add(step);
  this.walk.add(step);this.town.updateWorldMatrix(true,false);
 }
 leave(){
  if(!this.active)return;const s=this.saved;this.active=false;
  this.town.position.copy(s.position);this.town.quaternion.copy(s.quaternion);this.town.scale.copy(s.scale);
  this.camera.position.copy(s.cameraPosition);this.camera.quaternion.copy(s.cameraQuaternion);this.camera.far=s.far;this.camera.updateProjectionMatrix();this.syncPoints();this.saved=null;
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
