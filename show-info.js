import * as T from './vendor/three.module.js';
import {SIZES,TYPES} from './fireworks.js?v=beta.1.0.20';

// Announce shells as soon as they launch, through ascent and opening. No DOM
// label, new timer, random draw or extra particle traversal is needed.
export function showInfoText({time,running,previewing,fireworks}){
 const seconds=Math.max(0,Math.floor(time)),clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const phase=previewing?'試し打ち':running?'経過':time>=300?'大会終了':time>0?'ひと休み':'開始前';
 const groups=new Map();
 for(const f of fireworks){
  if(f.m.opacity<=.04)continue;
  const name=(SIZES[f.size]?.label??'')+' · '+(TYPES[f.kind]?.label??f.kind).replace('（軽量テスト）','');
  groups.set(name,(groups.get(name)??0)+1);
 }
 return {timer:phase+' '+clock,names:[...groups].map(([name,n])=>name+(n>1?' ×'+n:'')).join(' ／ ')||'次の一玉を待つ'};
}
const W=768,WIDTH=.36;
export class ShowInfoPanel{
 constructor({scene,timer,names,overlay,entries=[]}){
  Object.assign(this,{scene,timer,names,overlay,entries});this.enabled=false;this.anchored=false;this.key='';this.grab=null;this.pinch=new WeakMap();this.ray=new T.Raycaster();this.point=new T.Vector3();this.direction=new T.Vector3();
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=192;this.ctx=this.surface.getContext('2d');
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(WIDTH,WIDTH*192/W),new T.MeshBasicMaterial({map:this.texture,transparent:true,depthTest:false,depthWrite:false,side:T.FrontSide}));this.mesh.visible=false;this.mesh.renderOrder=1000;this.mesh.frustumCulled=false;scene.add(this.mesh);
  this.bar=new T.Mesh(new T.PlaneGeometry(.18,.012),new T.MeshBasicMaterial({color:0xd8edf7,transparent:true,opacity:.65,depthTest:false,depthWrite:false,side:T.DoubleSide}));this.bar.position.y=-WIDTH*192/W/2-.018;this.bar.renderOrder=1001;this.mesh.add(this.bar);
 }
 setEnabled(value){this.release();this.enabled=!!value;if(this.enabled)this.reanchor();else{this.mesh.visible=false;this.overlay.hidden=true;}}
 reanchor(){this.release();this.anchored=false;}
 end(){this.release();this.pinch=new WeakMap();this.mesh.visible=false;this.anchored=false;}
 anchor(transform){
  const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10],length=Math.hypot(x,z);if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  // Physical metres, independent of the miniature/bridge town scale. Fixed
  // in the scene so looking up does not drag an overlay across the fireworks.
  this.mesh.position.set(p.x+x*.58-z*.25,p.y-.25,p.z+z*.58+x*.25);this.mesh.lookAt(p.x,p.y,p.z);this.anchored=true;
 }
 release(controller=null){if(!controller||this.grab?.controller===controller){this.grab=null;this.bar.material.opacity=.65;}}
 barHit(controller){
  controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);this.point.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.ray.set(this.point,this.direction);
  return this.ray.intersectObject(this.bar,false)[0];
 }
 select(controller){
  if(!this.mesh.visible)return false;const hit=this.barHit(controller);if(!hit)return false;
  const source=this.entries.find(e=>e.controller===controller)?.source;if(source?.hand)return true;
  this.grab={controller,local:controller.worldToLocal(hit.point.clone()),offset:this.mesh.position.clone().sub(hit.point)};this.bar.material.opacity=1;return true;
 }
 drag(stamp,frame,referenceSpace){
  if(!this.mesh.visible||!frame){this.release();return;}
  if(this.grab?.controller){const e=this.entries.find(e=>e.controller===this.grab.controller);if(!e?.source||!frame.getPose(e.source.targetRaySpace,referenceSpace)){this.release();return;}this.mesh.position.copy(this.grab.controller.localToWorld(this.point.copy(this.grab.local))).add(this.grab.offset);}
  for(const e of this.entries){
   const source=e.source;if(source?.handedness!=='right'||!source.hand)continue;
   const tip=source.hand.get('index-finger-tip'),thumb=source.hand.get('thumb-tip'),indexPose=tip?frame.getJointPose(tip,referenceSpace):null,thumbPose=thumb?frame.getJointPose(thumb,referenceSpace):null;
   const previous=this.pinch.get(source);if(!indexPose||!thumbPose){this.pinch.delete(source);if(this.grab?.source===source)this.release();continue;}
   const p=indexPose.transform.position,q=thumbPose.transform.position,span=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z),ready=previous&&stamp-previous.stamp<=150&&previous.ready;
   this.pinch.set(source,{stamp,ready:span>.045||!!ready});this.point.set(p.x,p.y,p.z);
   if(this.grab?.source===source){if(!previous||stamp-previous.stamp>150||span>.045)this.release();else this.mesh.position.copy(this.point).add(this.grab.offset);continue;}
   if(this.grab||!ready||span>=.025)continue;
   this.mesh.updateMatrixWorld(true);const local=this.bar.worldToLocal(this.point.clone());
   if(Math.abs(local.x)<.105&&Math.abs(local.y)<.025&&Math.abs(local.z)<.035){this.grab={source,offset:this.mesh.position.clone().sub(this.point)};this.pinch.set(source,{stamp,ready:false});this.bar.material.opacity=1;}
  }
  if(this.grab?.source&&!this.entries.some(e=>e.source===this.grab.source))this.release();
  for(const e of this.entries){if(e.source?.hand||!e.beam)continue;const hit=e.source&&frame.getPose(e.source.targetRaySpace,referenceSpace)?this.barHit(e.controller):null;e.beam.visible=!!hit||this.grab?.controller===e.controller;if(hit)e.beam.scale.z=hit.distance;}
 }
 update(state,transform,xr=false,xrVisible=true){
  this.overlay.hidden=!this.enabled||xr;this.mesh.visible=this.enabled&&xr&&xrVisible&&!!transform;if(!this.enabled)return;
  if(this.mesh.visible&&!this.anchored)this.anchor(transform);
  const text=showInfoText(state),key=text.timer+'\n'+text.names;if(key===this.key)return;this.key=key;
  this.timer.textContent=text.timer;this.names.textContent=text.names;this.draw(text);
 }
 draw(text){
  const c=this.ctx;c.font='30px system-ui,sans-serif';const lines=[];let line='';
  for(const char of text.names){if(c.measureText(line+char).width>W-72&&line){lines.push(line);line='';}line+=char;}if(line)lines.push(line);
  const h=Math.max(192,104+lines.length*42);if(this.surface.height!==h){this.surface.height=h;this.mesh.geometry.dispose();this.mesh.geometry=new T.PlaneGeometry(WIDTH,WIDTH*h/W);this.bar.position.y=-WIDTH*h/W/2-.018;}
  c.clearRect(0,0,W,h);const glass=c.createLinearGradient(0,0,W,h);glass.addColorStop(0,'rgba(160,210,240,.17)');glass.addColorStop(1,'rgba(15,35,55,.23)');c.fillStyle=glass;c.beginPath();c.roundRect(2,2,W-4,h-4,22);c.fill();c.strokeStyle='rgba(215,238,250,.48)';c.lineWidth=2;c.stroke();
  c.textAlign='left';c.textBaseline='middle';c.shadowColor='rgba(0,0,0,.9)';c.shadowBlur=5;c.font='38px system-ui,sans-serif';c.fillStyle='#edf7ff';c.fillText(text.timer,34,48);c.font='30px system-ui,sans-serif';c.fillStyle='#ffe7b5';lines.forEach((line,i)=>c.fillText(line,34,105+i*42));c.shadowBlur=0;this.texture.needsUpdate=true;
 }
}
