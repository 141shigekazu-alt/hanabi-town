import * as T from './vendor/three.module.js';
import {ShowInfoPanel} from './show-info.js?v=1.1.0';

// Moving the review panel never changes the show, viewpoint or playback state.
export function attachBetaPanelDrag(panel,handle,viewport){
 let grab=null,moved=false;
 function place(left,top){
  const box=panel.getBoundingClientRect(),view=viewport();
  panel.style.left=Math.max(8,Math.min(left,Math.max(8,view.width-box.width-8)))+'px';
  panel.style.top=Math.max(8,Math.min(top,Math.max(8,view.height-box.height-8)))+'px';
  panel.style.bottom='auto';panel.style.transform='none';moved=true;
 }
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();
  const box=panel.getBoundingClientRect();grab={id:e.pointerId,x:e.clientX-box.left,y:e.clientY-box.top};
  handle.setPointerCapture(e.pointerId);handle.classList.add('is-grabbing');
 });
 handle.addEventListener('pointermove',e=>{
  if(grab?.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();place(e.clientX-grab.x,e.clientY-grab.y);
 });
 function release(e){if(grab?.id!==e.pointerId)return;grab=null;handle.classList.remove('is-grabbing');if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,release);
 handle.addEventListener('keydown',e=>{
  const step=e.shiftKey?40:10,move={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
  if(!move)return;e.preventDefault();e.stopPropagation();const box=panel.getBoundingClientRect();place(box.left+move[0],box.top+move[1]);
 });
 return {resize(){if(moved&&!panel.hidden){const box=panel.getBoundingClientRect();place(box.left,box.top);}},get dragging(){return !!grab;}};
}

const W=768,H=240,WIDTH=.42;
export class BetaReviewPanel extends ShowInfoPanel{
 constructor({scene,click}){
  super({scene,timer:{},names:{},overlay:{},entries:[]});this.click=click;
  this.surface.height=H;this.mesh.geometry.dispose();this.mesh.geometry=new T.PlaneGeometry(WIDTH,WIDTH*H/W);
  this.bar.position.y=-WIDTH*H/W/2-.018;this.grabTarget.position.copy(this.bar.position);
  this.controls=[];this.touches=new WeakMap();this.state=null;
 }
 end(){super.end();this.touches=new WeakMap();}
 update(state,transform,xr=false,xrVisible=true){
  this.enabled=!!state.active;this.mesh.visible=this.enabled&&xr&&xrVisible&&!!transform;
  if(!this.enabled){this.release();this.anchored=false;return;}
  if(this.mesh.visible&&!this.anchored)this.anchor(transform);
  const key=[state.current,state.duration,state.tail,state.running,state.busy].join('|');this.state=state;
  if(key!==this.key){this.key=key;this.drawReview();}
 }
 drawReview(){
  const c=this.ctx,s=this.state;if(!s)return;c.clearRect(0,0,W,H);
  c.fillStyle='rgba(12,27,42,.90)';c.beginPath();c.roundRect(2,2,W-4,H-4,22);c.fill();c.strokeStyle='rgba(220,201,155,.6)';c.lineWidth=2;c.stroke();
  c.textAlign='left';c.textBaseline='middle';c.font='bold 66px system-ui,sans-serif';c.fillStyle='#ffe7ad';c.fillText(s.current,28,62);
  const next=28+c.measureText(s.current).width+15;c.font='35px system-ui,sans-serif';c.fillStyle='#b8c8d7';c.fillText('/ '+s.duration,next,66);
  c.font='24px system-ui,sans-serif';c.fillStyle='#c3d2dc';c.fillText(s.tail||'曲の時刻',28,110);
  this.controls=[['betaFloatBack10','10秒戻る'],['betaFloatBack5','5秒戻る'],['betaFloatPause',s.running?'一時停止':'再開'],['betaFloatForward5','5秒進む']].map(([id,label],i)=>{
   const b={id,x:18+i*186,y:140,w:174,h:78};c.fillStyle=s.busy?'#16212b':'#21384b';c.beginPath();c.roundRect(b.x,b.y,b.w,b.h,10);c.fill();
   c.textAlign='center';c.font='29px system-ui,sans-serif';c.fillStyle=s.busy?'#788895':'#edf3f8';c.fillText(label,b.x+b.w/2,b.y+b.h/2);return b;
  });this.texture.needsUpdate=true;
 }
 controlAt(x,y){return this.controls.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);}
 select(controller){
  if(!this.mesh.visible)return false;controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);
  this.point.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.ray.set(this.point,this.direction);
  const hit=this.ray.intersectObject(this.mesh,false)[0];if(!hit)return false;
  const button=this.controlAt(hit.uv.x*W,(1-hit.uv.y)*H);if(button&&!this.state.busy&&!this.grab&&!this.controllerGrabbed)this.click(button.id);return true;
 }
 touch(stamp,frame,referenceSpace,busy=false){
  if(!this.mesh.visible||!frame||busy||this.grab||this.controllerGrabbed){this.touches=new WeakMap();return;}
  for(const entry of this.entries){
   const source=entry.source;if(source?.handedness!=='right')continue;let position;
   if(source.hand){const joint=source.hand.get('index-finger-tip');const pose=joint&&frame.getJointPose(joint,referenceSpace);if(pose)position=new T.Vector3(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);}
   else if(frame.getPose(source.targetRaySpace,referenceSpace)){entry.controller.updateWorldMatrix(true,false);position=entry.controller.localToWorld(new T.Vector3(0,0,-.045));}
   if(!position){this.touches.delete(source);continue;}this.mesh.updateMatrixWorld(true);const local=this.mesh.worldToLocal(position),button=Math.abs(local.z)<.018?this.controlAt((local.x/WIDTH+.5)*W,(.5-local.y/(WIDTH*H/W))*H):null;
   const before=this.touches.get(source);this.touches.set(source,{id:button?.id,stamp});
   if(button&&!this.state.busy&&(!before||before.id!==button.id||stamp-before.stamp>150))this.click(button.id);
  }
 }
}
