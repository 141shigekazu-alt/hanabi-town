import {panelBarColor} from './panel-theme.js?v=1.3.15';
import * as T from './vendor/three.module.js';

export function stickValue(value){return Math.abs(value??0)<.18?0:Math.sign(value)*(Math.abs(value)-.18)/.82;}

// One owner per object. Panel handles accept trigger or grip; town uses grip. Panels
// stay in physical metres; the town alone uses miniature coordinates.
export class XRControls{
 constructor({entries,town,townTarget,townTargets=[townTarget],groundBottomY,townScaleRange=()=>[.25,1.35],panels,sidebar,wrist,bridge,fire,pause,changed=()=>{}}){
  Object.assign(this,{entries,town,townTarget,townTargets,groundBottomY,townScaleRange,panels,sidebar,wrist,bridge,fire,pause,changed});
  this.diorama=false;this.active=false;this.viewer=null;this.edges=new WeakMap();this.tracked=new WeakSet();this.grabs=new Map();this.triggerDown=new Set();this.gripDown=new Set();this.ray=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.target=new T.Vector3();this.facing=new T.Object3D();this.rotation=new T.Quaternion();this.up=new T.Vector3(0,1,0);
  for(const e of entries){
   e.controller.addEventListener('selectstart',()=>this.select(e));
   e.controller.addEventListener('selectend',()=>{this.triggerDown.delete(e.controller);this.release(e.controller,'trigger');for(const panel of this.panels)panel.release?.(e.controller);});
   e.controller.addEventListener('squeezestart',()=>{if(this.active&&e.source&&!e.source.hand)this.gripDown.add(e.controller);this.squeeze(e);});
   e.controller.addEventListener('squeezeend',()=>{this.gripDown.delete(e.controller);this.release(e.controller,'grip');});
   e.controller.addEventListener('disconnected',()=>{this.release(e.controller);this.triggerDown.delete(e.controller);this.gripDown.delete(e.controller);this.edges=new WeakMap();});
  }
 }
 begin(viewer){this.end();this.active=true;this.viewer=viewer;}
 end(){this.release();this.active=false;this.viewer=null;this.edges=new WeakMap();this.tracked=new WeakSet();this.triggerDown.clear();this.gripDown.clear();for(const e of this.entries)e.beam.visible=false;}
 cast(controller){controller.updateWorldMatrix(true,false);this.origin.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.ray.set(this.origin,this.direction);}
 panelHit(controller){
  this.cast(controller);const candidates=[],modal=this.panels.find(p=>p.childView);
  for(const panel of this.panels){if(!panel.mesh.visible)continue;panel.mesh.updateWorldMatrix(true,true);for(const hit of this.ray.intersectObjects([panel.mesh,panel.grabTarget??panel.bar,...(panel.parentSurface?.visible?[panel.parentSurface]:[])],false))candidates.push({...hit,panel,blocked:hit.object===panel.parentSurface||!!modal&&panel!==modal});}
  return candidates.sort((a,b)=>(modal?Number(a.blocked)-Number(b.blocked):0)||a.distance-b.distance)[0]??null;
 }
 select(e){
  if(!this.active||!e.source||(!e.source.hand&&!this.tracked.has(e.source))||this.triggerDown.has(e.controller))return;
  this.triggerDown.add(e.controller);
  if(this.grabs.size||this.sidebar.sliderDrag||this.panels.some(p=>p.grab||p.sliderDrag))return;
  // A trigger shortly after a physical menu touch must not launch a shell.
  if(e.controller===this.wrist.ignoreController&&performance.now()<this.wrist.ignoreUntil)return;
  const hit=this.panelHit(e.controller);
  if(hit){if(hit.blocked)return;if(!e.source.hand&&hit.object===(hit.panel.grabTarget??hit.panel.bar))this.grabPanel(e,hit,'trigger');else if(hit.object===hit.panel.mesh&&hit.panel!==this.panels[2])hit.panel.select(e.controller);return;}
  if(e.source.hand)return;
  this.cast(e.controller);
  this.fire(e.source.handedness,this.origin.clone().addScaledVector(this.direction,.055),this.direction.clone());
 }
 grabPanel(e,hit,input){
  const panel=hit.panel;if(panel.grab||[...this.grabs.values()].some(g=>g.panel===panel))return;
  this.grabs.set(e.controller,{panel,input,distance:hit.distance,anchor:panel.mesh.worldToLocal(hit.point.clone())});panel.controllerGrabbed=true;panel.bar.material.color.setHex(panelBarColor(true));
 }
 refreshPanelBars(hits=null){
  hits??=this.entries.filter(e=>e.source&&this.tracked.has(e.source)).map(e=>this.panelHit(e.controller));
  for(const p of this.panels)if(p.bar?.material?.color)p.bar.material.color.setHex(panelBarColor(!!p.controllerGrabbed||hits.some(hit=>!hit?.blocked&&hit?.panel===p&&hit.object===(p.grabTarget??p.bar)))); 
 }
 townHit(controller){
  this.cast(controller);for(const object of this.townTargets)object.updateWorldMatrix(true,false);
  return this.ray.intersectObjects(this.townTargets,false)[0]??null;
 }
 squeeze(e){
  if(!this.active||!e.source||e.source.hand||!this.tracked.has(e.source)||this.grabs.has(e.controller)||this.panels.some(p=>p.sliderDrag))return;
  const hit=this.panelHit(e.controller);if(hit?.blocked)return;let panel=hit?.panel;
  if(hit&&hit.object===(panel.grabTarget??panel.bar)){
   this.grabPanel(e,hit,'grip');return;
  }
  if(hit||this.bridge.active||!this.town.visible||[...this.grabs.values()].some(g=>g.town))return;
  const townHit=this.townHit(e.controller);if(!townHit)return;
  const floor=this.town.position.y+this.groundBottomY*this.town.scale.y;
  this.grabs.set(e.controller,{town:true,input:'grip',distance:townHit.distance,lastPosition:e.controller.getWorldPosition(new T.Vector3()),floor});
 }
 release(controller=null,input=null){
  for(const [c,g] of this.grabs){if(controller&&c!==controller||input&&g.input!==input)continue;if(g.panel){g.panel.controllerGrabbed=false;g.panel.bar.material.color.setHex(panelBarColor(false));g.panel.moved=true;}this.grabs.delete(c);if(g.town)this.changed(true);}
 }
 update(dt,frame,referenceSpace,viewer){
  if(!this.active)return;if(!frame||!viewer){this.release();this.edges=new WeakMap();this.tracked=new WeakSet();this.gripDown.clear();for(const e of this.entries)e.beam.visible=false;return;}this.viewer=viewer;const hoverHits=[];
  for(const e of this.entries){
   const s=e.source;if(!s||s.hand)continue;
   const tracked=!!frame.getPose(s.targetRaySpace,referenceSpace),gp=s.gamepad;
   if(!tracked){this.tracked.delete(s);this.release(e.controller);this.triggerDown.delete(e.controller);this.gripDown.delete(e.controller);this.edges.delete(s);e.beam.visible=false;continue;}
   this.tracked.add(s);
   if(gp?.mapping==='xr-standard'){
    const now=[!!gp.buttons[4]?.pressed,!!gp.buttons[5]?.pressed],before=this.edges.get(s);this.edges.set(s,now);
    if(before){if(now[0]&&!before[0]){if(s.handedness==='left')this.wrist.toggle(viewer);else if(s.handedness==='right'){for(const [controller,grab] of this.grabs)if(grab.panel===this.sidebar)this.release(controller);this.sidebar.toggle();}}if(now[1]&&!before[1]&&s.handedness==='right')this.pause();}
   }
   const g=this.grabs.get(e.controller);
   if(!g&&gp?.mapping==='xr-standard'&&!this.grabs.size&&!this.sidebar.sliderDrag&&!this.sidebar.picker&&!this.panels.some(p=>p.scrollSources?.has(s))&&!this.panels.some(p=>p.grab||p.sliderDrag)){
    if(s.handedness==='left')this.bridge.move(stickValue(gp.axes[2]),stickValue(gp.axes[3]),dt,viewer);
    else if(s.handedness==='right')this.bridge.turn(stickValue(gp.axes[2]),dt,viewer);
   }
   if(g){
    const x=stickValue(gp?.axes[2]),y=stickValue(gp?.axes[3]);
    if(g.town){
     if(this.bridge.active||!this.town.visible){this.release(e.controller);continue;}
     e.controller.getWorldPosition(this.target);if(this.diorama)g.floor+=this.target.y-g.lastPosition.y;this.town.position.x+=this.target.x-g.lastPosition.x;this.town.position.z+=this.target.z-g.lastPosition.z;g.lastPosition.copy(this.target);
     this.town.rotation.y-=x*dt*1.2;this.town.scale.setScalar(T.MathUtils.clamp(this.town.scale.x*Math.exp(-y*dt*.8),this.diorama?.10:this.townScaleRange()[0],this.diorama?.30:this.townScaleRange()[1]));this.town.position.y=g.floor-this.groundBottomY*this.town.scale.y;this.changed(false);
    }else{
     const p=g.panel;if(!p.mesh.visible){this.release(e.controller);continue;}
     p.yawOffset=(p.yawOffset??0)-x*dt*1.2;g.distance=T.MathUtils.clamp(g.distance-y*dt*.65,.20,3);
     this.cast(e.controller);this.target.copy(this.ray.ray.direction).multiplyScalar(g.distance).add(this.ray.ray.origin);
     this.facing.position.copy(this.target);this.facing.lookAt(viewer.position.x,this.target.y,viewer.position.z);
     this.rotation.setFromAxisAngle(this.up,p.yawOffset);p.mesh.quaternion.copy(this.facing.quaternion).premultiply(this.rotation);
     p.mesh.position.copy(this.target).sub(g.anchor.clone().multiply(p.mesh.scale).applyQuaternion(p.mesh.quaternion));p.mesh.updateMatrixWorld(true);p.moved=true;
    }
   }
   const hit=this.panelHit(e.controller);hoverHits.push(hit);e.beam.visible=!!hit||this.grabs.has(e.controller)||this.gripDown.has(e.controller);e.beam.scale.z=hit?.distance??this.grabs.get(e.controller)?.distance??1.6;
  }
  this.refreshPanelBars(hoverHits);
 }
}
