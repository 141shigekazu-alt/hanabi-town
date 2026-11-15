import * as T from './vendor/three.module.js';
export function lowerTownAim(direction,degrees=20){
 const h=Math.hypot(direction.x,direction.z);if(h<.0001)return direction;
 const elevation=Math.max(-Math.PI*.49,Math.min(Math.PI*.49,Math.atan2(direction.y,h)-degrees*Math.PI/180)),c=Math.cos(elevation);
 return direction.set(direction.x/h*c,Math.sin(elevation),direction.z/h*c).normalize();
}
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Middle pinch is distinct from index pinch and a closed fist. Distances scale
// with the tracked palm, with hysteresis and open-before-close arming.
export function readMiddlePinch(source,frame,space){
 if(!source?.hand)return null;
 const get=name=>{const joint=source.hand.get(name);return joint&&frame.getJointPose(joint,space)?.transform.position;};
 const thumb=get('thumb-tip'),middle=get('middle-finger-tip'),index=get('index-finger-tip'),wrist=get('wrist'),base=get('middle-finger-phalanx-proximal');
 if(!thumb||!middle||!index||!wrist||!base)return null;
 const values=[thumb,middle,index,wrist,base];if(values.some(v=>![v.x,v.y,v.z].every(Number.isFinite)))return null;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),span=distance(wrist,base);if(span<.035||span>.14)return null;
 const gap=distance(thumb,middle)/span,indexGap=distance(thumb,index)/span;
 return {closed:gap<.40&&indexGap>.40,open:gap>.65,indexOpen:indexGap>.34,point:new T.Vector3((thumb.x+middle.x)/2,(thumb.y+middle.y)/2,(thumb.z+middle.z)/2)};
}
export class MiddleTownGrip{
 constructor({controls,town,targets,groundBottomY,scaleRange=()=>[.25,1.35],allowed=()=>true}){
  Object.assign(this,{controls,town,targets,groundBottomY,scaleRange,allowed});this.states=new WeakMap();this.holders=new Map();this.baseline=null;this.rebasePending=false;this.ray=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.last=null;this.samples=0;
 }
 get active(){return this.holders.values().next().value??null;}
 feedback(source){const s=this.states.get(source);return s?.pointing?{active:this.holders.has(source),hit:s.hit,distance:s.hit?.distance??2,direction:s.direction}:null;}
 blocked(source,stamp=performance.now()){const s=this.states.get(source);return this.holders.has(source)||!!s&&(s.pointing||s.closing!==null||stamp<s.until);}
 releaseSource(source,stamp){
  const held=this.holders.get(source);if(!held)return;this.holders.delete(source);this.rebasePending=true;
  const state=this.states.get(source);if(state){state.armed=false;state.closing=null;state.until=stamp+400;}
  if(this.controls.grabs.get(held.entry.controller)?.handTown)this.controls.release(held.entry.controller,'middle');
 }
 end(stamp=performance.now()){for(const source of [...this.holders.keys()])this.releaseSource(source,stamp);this.baseline=null;}
 center(){const points=[...this.holders.values()].map(h=>h.point);return points.length===1?points[0].clone():points[0].clone().add(points[1]).multiplyScalar(.5);}
 pair(){
  const left=[...this.holders.values()].find(h=>h.source.handedness==='left'),right=[...this.holders.values()].find(h=>h.source.handedness==='right');if(!left||!right)return null;
  const vector=right.point.clone().sub(left.point);return{distance:vector.length(),horizontal:Math.hypot(vector.x,vector.z),angle:Math.atan2(vector.z,vector.x)};
 }
 rebase(){
  if(!this.holders.size){this.baseline=null;this.rebasePending=false;return;}
  this.baseline={center:this.center(),pair:this.pair(),position:this.town.position.clone(),yaw:this.town.rotation.y,scale:this.town.scale.x,floor:this.town.position.y+this.groundBottomY*this.town.scale.y};this.rebasePending=false;
 }
 update(stamp,frame,space,viewer){
  if(!frame||!viewer||!this.controls.active||!this.allowed()){this.end(stamp);this.states=new WeakMap();this.last=null;return;}
  if(this.last!==null&&stamp-this.last>150){this.end(stamp);this.states=new WeakMap();}this.last=stamp;
  const present=new Set(this.controls.entries.map(e=>e.source));for(const source of [...this.holders.keys()])if(!present.has(source))this.releaseSource(source,stamp);
  for(const entry of this.controls.entries){
   const source=entry.source;if(!source?.hand||!['left','right'].includes(source.handedness))continue;
   let state=this.states.get(source);if(!state){state={armed:false,closing:null,until:0};this.states.set(source,state);}
   const shape=readMiddlePinch(source,frame,space),pose=frame.getPose(source.targetRaySpace,space);
   if(!shape||!pose){this.releaseSource(source,stamp);state.armed=false;state.closing=null;state.pointing=false;state.hit=null;continue;}
   const m=pose.transform.matrix;state.pointing=shape.closed||this.holders.has(source);state.hit=null;
   if(state.pointing){
    const rp=pose.transform.position;this.origin.set(rp.x,rp.y,rp.z);this.direction.set(-m[8],-m[9],-m[10]).normalize();lowerTownAim(this.direction);(state.direction??=new T.Vector3()).copy(this.direction);this.ray.set(this.origin,this.direction);
    this.town.updateWorldMatrix(true,true);for(const target of this.targets)target.updateWorldMatrix(true,false);state.hit=this.ray.intersectObjects(this.targets,false)[0]??null;
   }
   const held=this.holders.get(source);
   if(held){
    if(!this.controls.grabs.get(entry.controller)?.handTown||shape.open||!shape.indexOpen||this.controls.bridge.active||!this.town.visible){this.releaseSource(source,stamp);if(shape.open)state.armed=true;continue;}
    const alpha=1-Math.exp(-Math.min(.05,Math.max(0,(stamp-held.last)/1000))*18);held.last=stamp;held.point.lerp(shape.point,alpha);continue;
   }
   if(shape.open){state.armed=true;state.closing=null;continue;}
   if(!shape.closed||!state.armed||stamp<state.until){state.closing=null;continue;}
   const foreignGrab=[...this.controls.grabs.values()].some(g=>!g.handTown);
   if(this.holders.size>=2||[...this.holders.values()].some(h=>h.source.handedness===source.handedness)||foreignGrab||this.controls.panels.some(p=>p.childView||p.grab||p.sliderDrag)||this.controls.bridge.active||!this.town.visible){state.closing=null;continue;}
   const uiHit=this.controls.panelHit(entry.controller);if(uiHit&&(!state.hit||uiHit.distance===undefined||uiHit.distance<state.hit.distance)){state.hit=null;state.closing=null;continue;}
   const hit=state.hit;if(!hit){state.closing=null;continue;}
   // Avoid an unstable scale denominator when the hands almost overlap.
   if(this.active&&this.active.point.distanceTo(shape.point)<.12){state.closing=null;continue;}
   state.closing??=stamp;if(stamp-state.closing<100)continue;state.closing=null;state.armed=false;
   this.holders.set(source,{entry,source,point:shape.point.clone(),last:stamp});this.rebasePending=true;
   this.controls.grabs.set(entry.controller,{town:true,handTown:true,input:'middle',distance:hit.distance});
  }
  if(this.rebasePending)this.rebase();if(!this.baseline||!this.holders.size)return;
  const base=this.baseline,center=this.center(),pair=this.pair();let scale=base.scale,yaw=base.yaw;
  if(pair&&base.pair){
   const range=this.controls.diorama?[.10,.30]:this.scaleRange();scale=T.MathUtils.clamp(base.scale*pair.distance/base.pair.distance,range[0],range[1]);
   if(pair.horizontal>.12&&base.pair.horizontal>.12)yaw=base.yaw-wrapAngle(pair.angle-base.pair.angle);
  }
  this.town.position.x=base.position.x+center.x-base.center.x;this.town.position.z=base.position.z+center.z-base.center.z;
  this.town.rotation.y=yaw;this.town.scale.setScalar(scale);this.town.position.y=base.floor-this.groundBottomY*scale;
  this.town.updateMatrixWorld(true);this.controls.changed(false);this.samples++;
 }
 get state(){return{active:!!this.active,hand:this.holders.size===2?'both':this.active?.source.handedness??null,count:this.holders.size,samples:this.samples,scale:this.town.scale.x};}
}
