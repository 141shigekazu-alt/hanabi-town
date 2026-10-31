import {drawPanelSurface} from './panel-surface.js?v=1.3.15';
import {panelTheme,panelThemeId,panelFont,panelGradient} from './panel-theme.js?v=1.3.19';
import * as T from './vendor/three.module.js';
import {ShowInfoPanel} from './show-info.js?v=1.3.10';

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

const W=768,H=410,WIDTH=.42;
export class BetaReviewPanel extends ShowInfoPanel{
 constructor({scene,click,set=()=>{}}){
  super({scene,timer:{},names:{},overlay:{},entries:[]});this.click=click;this.set=set;
  this.surface.height=H;this.mesh.geometry.dispose();this.mesh.geometry=new T.PlaneGeometry(WIDTH,WIDTH*H/W);
  this.bar.position.y=-WIDTH*H/W/2-.018;this.grabTarget.position.copy(this.bar.position);
  this.controls=[];this.touches=new WeakMap();this.state=null;this.sliderDrag=null;this.sliderPlane=new T.Plane();this.sliderPoint=new T.Vector3();this.sliderValue=0;
 }
 end(){super.end();this.touches=new WeakMap();}
 release(controller=null){
  if(this.sliderDrag&&(!controller||this.sliderDrag.controller===controller)){
   const value=this.sliderValue;this.sliderDrag=null;
   if(this.state?.musicActive)this.set(value,true);
  }
  super.release(controller);
 }
 update(state,transform,xr=false,xrVisible=true){
  this.state=state;this.enabled=!!state.active;this.mesh.visible=this.enabled&&xr&&xrVisible&&!!transform;
  if(!state.musicActive)this.release();
  if(!this.enabled){this.release();this.anchored=false;return;}
  if(this.mesh.visible&&!this.anchored)this.anchor(transform);
  const key=[panelThemeId(),state.current,state.duration,state.title,state.tail,state.running,state.busy,state.musicActive,state.seek,state.names,state.canPrevious,state.canNext,state.canPlay].join('|');
  if(key!==this.key){this.key=key;this.drawReview();}
 }
 drawReview(){
  const c=this.ctx,s=this.state;if(!s)return;c.clearRect(0,0,W,H);
  drawPanelSurface(c,W,H,{radius:22});
  c.textAlign='left';c.textBaseline='middle';c.font=panelFont(56);c.fillStyle=panelTheme().accent;c.fillText(s.current,28,45);
  const next=28+c.measureText(s.current).width+15;c.font=panelFont(30);c.fillStyle=panelTheme().muted;if(s.duration)c.fillText('/ '+s.duration,next,48);
  // Keep the time and close button clear; long names use two quiet lines.
  if(s.musicActive&&s.title){
   const x=next+(s.duration?c.measureText('/ '+s.duration).width:0)+22,max=670-x;
   c.font=panelFont(28);c.fillStyle=panelTheme().text;
   let line='',rows=[];
   for(const char of s.title){if(c.measureText(line+char).width>max&&line){rows.push(line);line='';}line+=char;}if(line)rows.push(line);
   rows.slice(0,2).forEach((text,i)=>{if(i===1&&rows.length>2){while(text&&c.measureText(text+'…').width>max)text=Array.from(text).slice(0,-1).join('');text+='…';}c.fillText(text,x,rows.length>1?32+i*32:48);});
  }
  c.font=panelFont(23);c.fillStyle=panelTheme().accent;let line='',rows=[];
  for(const char of s.names??'次の一玉を待つ'){if(c.measureText(line+char).width>W-56&&line){rows.push(line);line='';}line+=char;}if(line)rows.push(line);
  rows.slice(0,2).forEach((text,i)=>{if(i===1&&rows.length>2)text=text.slice(0,-1)+'…';c.fillText(text,28,98+i*29);});
  this.controls=[];
  const button=(id,label,x,y,w,h,disabled)=>{const b={id,x,y,w,h,disabled};c.fillStyle=disabled?panelTheme().disabled:panelTheme().surface;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.textAlign='center';c.font=panelFont(28);c.fillStyle=disabled?panelTheme().disabledText:panelTheme().text;c.fillText(label,x+w/2,y+h/2);this.controls.push(b);};
  button('betaCloseTC','×',688,18,62,54,false);
  button('betaFloatBack10','10秒戻る',18,156,230,68,s.busy||!s.musicActive);
  button('betaFloatPause',s.running?'一時停止':'再生',269,156,230,68,s.busy||!s.canPlay);
  button('betaFloatForward10','10秒送る',520,156,230,68,s.busy||!s.musicActive);
  const disabled=s.busy||!s.musicActive,value=Math.max(0,Math.min(1,this.sliderDrag?this.sliderValue:s.seek??0)),trackX=46,trackW=676;
  c.fillStyle=disabled?panelTheme().disabled:panelTheme().track;c.beginPath();c.roundRect(trackX,264,trackW,12,6);c.fill();
  c.fillStyle=disabled?panelTheme().disabledText:panelGradient(c,trackX,264,trackW,0,panelTheme().highlight);c.beginPath();c.roundRect(trackX,264,Math.max(1,value*trackW),12,6);c.fill();
  c.fillStyle=disabled?panelTheme().disabledText:panelTheme().knob;c.beginPath();c.arc(trackX+value*trackW,270,17,0,Math.PI*2);c.fill();
  c.font=panelFont(22);c.textAlign='center';c.fillStyle=panelTheme().muted;c.fillText(s.tail||'曲の再生位置',W/2,307);
  this.controls.push({id:'betaMusicSeek',slider:true,disabled,x:18,y:240,w:W-36,h:55,trackX,trackW});
  button('betaPreviousTrack','前の曲',18,335,350,56,s.busy||!s.canPrevious);
  button('betaNextTrack','次の曲',400,335,350,56,s.busy||!s.canNext);
  this.texture.needsUpdate=true;
 }

 controlAt(x,y){return this.controls.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);}
 slideLocal(local){
  const control=this.controls.find(c=>c.slider);if(!control)return;
  const x=(local.x/WIDTH+.5)*W,value=Math.max(0,Math.min(1,(x-control.trackX)/control.trackW));
  if(value===this.sliderValue)return;this.sliderValue=value;this.set(value,false);this.drawReview();
 }
 slideRay(){
  this.mesh.updateMatrixWorld(true);this.sliderPlane.setFromNormalAndCoplanarPoint(new T.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion),this.mesh.position);
  if(this.ray.ray.intersectPlane(this.sliderPlane,this.sliderPoint))this.slideLocal(this.mesh.worldToLocal(this.sliderPoint));
 }
 beginSlider(owner,local=null){
  this.sliderValue=-1;this.sliderDrag=owner;if(local)this.slideLocal(local);else this.slideRay();
 }
 controllerRay(controller){
  controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);
  this.point.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.ray.set(this.point,this.direction);
 }
 drag(stamp,frame,referenceSpace){
  if(this.sliderDrag?.controller){
   const entry=this.entries.find(e=>e.controller===this.sliderDrag.controller);
   if(!this.mesh.visible||!frame||!entry?.source||!frame.getPose(entry.source.targetRaySpace,referenceSpace)){this.release();return;}
   this.controllerRay(entry.controller);this.slideRay();return;
  }
  if(!this.sliderDrag)super.drag(stamp,frame,referenceSpace);
 }
 select(controller){
  if(!this.mesh.visible)return false;controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);
  if(this.sliderDrag)return true;this.controllerRay(controller);
  const hit=this.ray.intersectObject(this.mesh,false)[0];if(!hit)return false;
  const button=this.controlAt(hit.uv.x*W,(1-hit.uv.y)*H);if(button&&!button.disabled&&!this.grab&&!this.controllerGrabbed){if(button.slider)this.beginSlider({controller});else this.click(button.id);}return true;
 }
 touch(stamp,frame,referenceSpace,busy=false){
  if(!this.mesh.visible||!frame||busy||this.grab||this.controllerGrabbed){this.touches=new WeakMap();return;}
  for(const entry of this.entries){
   const source=entry.source;if(source?.handedness!=='right')continue;let position;
   if(source.hand){const joint=source.hand.get('index-finger-tip');const pose=joint&&frame.getJointPose(joint,referenceSpace);if(pose)position=new T.Vector3(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);}
   else if(frame.getPose(source.targetRaySpace,referenceSpace)){entry.controller.updateWorldMatrix(true,false);position=entry.controller.localToWorld(new T.Vector3(0,0,-.045));}
   if(!position){this.touches.delete(source);if(this.sliderDrag?.source===source)this.release();continue;}this.mesh.updateMatrixWorld(true);const local=this.mesh.worldToLocal(position);
   if(this.sliderDrag){if(this.sliderDrag.source===source){if(Math.abs(local.z)>.045)this.release();else this.slideLocal(local);}continue;}
   const button=Math.abs(local.z)<.018?this.controlAt((local.x/WIDTH+.5)*W,(.5-local.y/(WIDTH*H/W))*H):null;
   const before=this.touches.get(source);this.touches.set(source,{id:button?.id,stamp});
   if(button&&!button.disabled&&(!before||before.id!==button.id||stamp-before.stamp>150)){if(button.slider)this.beginSlider({source},local);else this.click(button.id);}
  }
  if(this.sliderDrag?.source&&!this.entries.some(e=>e.source===this.sliderDrag.source))this.release();
 }
}
