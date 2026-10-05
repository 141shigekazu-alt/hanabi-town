import * as T from './vendor/three.module.js';

// Town units are authored for the miniature. XR cameras, controllers and UI
// always stay in physical metres; only the town is enlarged around the viewer.
export const BRIDGE_SCALE=100,SEATED_EYE_HEIGHT=1.2;
// Sit a little upstream of the deck centre, with the arch above the view.
const bridgeAngle=Math.atan(.594*Math.cos(.67*2.7+.35));
export const FRONT_BRIDGE=new T.Vector3(0,.1025,-.026).applyAxisAngle(new T.Vector3(0,1,0),bridgeAngle).add(new T.Vector3(.22*Math.sin(.67*2.7+.35),0,.67));
export class BridgeView{
 constructor(town,camera){this.town=town;this.camera=camera;this.active=false;this.saved=null;this.pointSizes=new WeakMap();this.eye=new T.Vector3();this.forward=new T.Vector3();this.up=new T.Vector3();}
 point(material){if(!this.pointSizes.has(material))this.pointSizes.set(material,material.size);material.size=this.pointSizes.get(material)*(this.active?BRIDGE_SCALE:1);}
 syncPoints(){this.town.traverse(o=>{if(o.isPoints)this.point(o.material);});}
 enter(transform=null){
  if(this.active)return;
  this.saved={position:this.town.position.clone(),quaternion:this.town.quaternion.clone(),scale:this.town.scale.clone(),cameraPosition:this.camera.position.clone(),cameraQuaternion:this.camera.quaternion.clone(),far:this.camera.far};
  this.active=true;this.town.scale.setScalar(BRIDGE_SCALE);
  if(transform){
   const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);
   if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
   this.town.rotation.set(0,Math.atan2(-x,-z),0);
   const seat=FRONT_BRIDGE.clone().multiplyScalar(BRIDGE_SCALE).applyQuaternion(this.town.quaternion);
   this.town.position.set(p.x-seat.x,p.y-SEATED_EYE_HEIGHT-seat.y,p.z-seat.z);
  }else{
   this.town.position.set(0,0,0);this.town.rotation.set(0,0,0);
   this.camera.position.copy(FRONT_BRIDGE).multiplyScalar(BRIDGE_SCALE);this.camera.position.y+=SEATED_EYE_HEIGHT;
  }
  this.town.visible=true;this.camera.far=1000;this.camera.updateProjectionMatrix();this.town.updateWorldMatrix(true,false);this.syncPoints();
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
