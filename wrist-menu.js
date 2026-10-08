import * as T from './vendor/three.module.js';

// A deliberate neutral -> palm-up motion; a held pose never repeats.
export class PalmUpGesture{
 constructor(){this.states=new WeakMap();}
 reset(){this.states=new WeakMap();}
 sample(source,stamp,normalY,raised){
  let s=this.states.get(source);if(!s){s={armed:false,neutral:null,up:null,last:stamp};this.states.set(source,s);}
  if(stamp-s.last>150){s.armed=false;s.neutral=null;s.up=null;}s.last=stamp;
  if(normalY===null){s.armed=false;s.neutral=null;s.up=null;return false;}
  if(normalY<.3){s.up=null;s.neutral??=stamp;if(stamp-s.neutral>=120)s.armed=true;return false;}
  s.neutral=null;
  if(normalY<.72||!raised){s.up=null;return false;}
  if(!s.armed)return false;s.up??=stamp;
  if(stamp-s.up<300)return false;s.armed=false;s.up=null;return true;
 }
}
// Crossing the front of a virtual surface acts as one click. Reaching back
// out by 4.5cm rearms it; tracking gaps and newly opened menus start disarmed.
export class FingerTouch{
 constructor(){this.states=new WeakMap();}
 reset(){this.states=new WeakMap();}
 sample(source,stamp,point){
  const prev=this.states.get(source);if(!point){this.states.delete(source);return null;}
  const s={point:point.clone(),stamp,armed:prev?.armed??false};this.states.set(source,s);
  if(!prev||stamp-prev.stamp>150||point.distanceTo(prev.point)>.18){s.armed=point.z>.045;return null;}
  if(point.z>.045)s.armed=true;
  if(!s.armed||point.z>.012||prev.point.z<=.012)return null;
  s.armed=false;const mix=(prev.point.z-.012)/(prev.point.z-point.z);return prev.point.clone().lerp(point,mix);
 }
}
const W=512,H=646;
const CHAINS=[['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],...['index','middle','ring','pinky'].map(f=>['wrist',`${f}-finger-metacarpal`,`${f}-finger-phalanx-proximal`,`${f}-finger-phalanx-intermediate`,`${f}-finger-phalanx-distal`,`${f}-finger-tip`])];
const LINKS=CHAINS.flatMap(chain=>chain.slice(1).map((name,i)=>[chain[i],name]));
export class WristMenu{
 constructor({scene,entries,read,choose,readInfo=()=>false,readDiorama=()=>false,readBoat=()=>false,beforeOpen=()=>{}}){
  Object.assign(this,{scene,entries,read,choose,readInfo,readDiorama,readBoat,beforeOpen});this.gesture=new PalmUpGesture();this.touch=new FingerTouch();this.touchPoint=new T.Vector3();this.controls=[];this.ray=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.handDisplays=[];this.hover='';this.ignoreController=null;this.ignoreUntil=0;
  for(const e of entries){e.touchTip=new T.Mesh(new T.SphereGeometry(.007,10,8),new T.MeshBasicMaterial({color:0xffdfa1,depthTest:false,depthWrite:false}));e.touchTip.position.z=-.05;e.touchTip.renderOrder=1006;e.touchTip.visible=false;e.controller.add(e.touchTip);}
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=H;this.ctx=this.surface.getContext('2d');
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.40,.40*H/W),new T.MeshBasicMaterial({map:this.texture,depthTest:false,depthWrite:false,side:T.FrontSide}));this.mesh.visible=false;this.mesh.renderOrder=1005;scene.add(this.mesh);
  this.bar=new T.Mesh(new T.PlaneGeometry(.20,.012),new T.MeshBasicMaterial({color:0xf2f5f8,depthTest:false,depthWrite:false,side:T.DoubleSide}));this.bar.position.y=-.40*H/W/2-.023;this.bar.renderOrder=1006;this.mesh.add(this.bar);
  this.grabTarget=new T.Mesh(new T.PlaneGeometry(.30,.055),new T.MeshBasicMaterial({side:T.DoubleSide}));this.grabTarget.position.copy(this.bar.position);this.grabTarget.visible=false;this.mesh.add(this.grabTarget);
  this.cursor=new T.Mesh(new T.SphereGeometry(.004,8,6),new T.MeshBasicMaterial({color:0xffdfa1,depthTest:false,depthWrite:false}));this.cursor.visible=false;this.cursor.renderOrder=1006;scene.add(this.cursor);
 }
 get visible(){return this.mesh.visible;}
 toggle(transform){this.gesture.reset();if(this.visible)this.close();else if(transform)this.open(transform);}
 attachHand(hand){
  const coords=new Float32Array(LINKS.length*6),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(coords,3));
  const lines=new T.LineSegments(g,new T.LineBasicMaterial({color:0xaac8d7,transparent:true,opacity:.8}));lines.frustumCulled=false;lines.visible=false;this.scene.add(lines);
  this.handDisplays.push({hand,coords,g,lines});
 }
 drawHands(show){for(const d of this.handDisplays){
  d.lines.visible=show&&d.hand.visible;if(!d.lines.visible)continue;let index=0;
  for(const [a,b] of LINKS){const p=d.hand.joints[a],q=d.hand.joints[b];if(!p?.visible||!q?.visible){d.lines.visible=false;break;}for(const joint of [p,q]){joint.getWorldPosition(this.origin);d.coords[index++]=this.origin.x;d.coords[index++]=this.origin.y;d.coords[index++]=this.origin.z;}}
  d.g.attributes.position.needsUpdate=true;
 }}
 open(transform){
  const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10],length=Math.hypot(x,z);if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  this.beforeOpen();if(!this.moved){this.mesh.position.set(p.x+x*.48+z*.23,p.y-.24,p.z+z*.48-x*.23);this.mesh.lookAt(p.x,p.y,p.z);this.yawOffset=0;}this.mesh.visible=true;this.mesh.updateMatrixWorld(true);this.touch.reset();this.hover='';this.draw();
 }
 close(){this.gesture.reset();this.mesh.visible=false;this.cursor.visible=false;for(const e of this.entries){e.beam.visible=false;e.touchTip.visible=false;}}
 end(){this.moved=false;this.close();this.gesture.reset();this.touch.reset();this.ignoreController=null;this.ignoreUntil=0;for(const d of this.handDisplays)d.lines.visible=false;}
 hit(controller){controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);this.origin.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.ray.set(this.origin,this.direction);return this.ray.intersectObject(this.mesh,false)[0]??null;}
 control(hit){if(!hit)return null;const x=hit.uv.x*W,y=(1-hit.uv.y)*H;return this.controls.find(c=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h);}
 select(controller,stamp=performance.now()){
  if(controller===this.ignoreController&&stamp<this.ignoreUntil)return true;
  if(!this.visible)return false;
  if(this.entries.find(e=>e.controller===controller)?.source?.hand)return true;
  const control=this.control(this.hit(controller));
  if(control){if(control.id!=='close')this.choose(control.id);this.close();}return true;
 }
 update(stamp,frame,referenceSpace,transform,{drawHands=false,busy=false}={}){
  this.drawHands(drawHands);if(!frame||!transform)return;
  if(busy)this.gesture.reset();
  for(const e of this.entries){
   const s=e.source;if(s?.handedness!=='left')continue;
   const joint=s.hand?.get('wrist'),pose=joint?frame.getJointPose(joint,referenceSpace):s.gripSpace?frame.getPose(s.gripSpace,referenceSpace):null;
   // W3C joint -Y points out of the palm. A left-hand grip's +X does so.
   const m=pose?.transform.matrix,p=pose?.transform.position,v=transform.position,normalY=m?(joint?-m[5]:m[1]):null;
   const raised=!!p&&p.y>v.y-.5&&p.y<v.y+.25&&Math.hypot(p.x-v.x,p.y-v.y,p.z-v.z)<.9;
   if(!busy&&!this.controllerGrabbed&&this.gesture.sample(s,stamp,normalY,raised))this.toggle(transform);
  }
  if(!this.visible||this.controllerGrabbed)return;
  let touching=null;this.mesh.updateMatrixWorld(true);
  for(const e of this.entries){
   const source=e.source;if(source?.handedness!=='right')continue;
   let local=null;
   if(source.hand){const joint=source.hand.get('index-finger-tip'),pose=joint?frame.getJointPose(joint,referenceSpace):null;if(pose){const p=pose.transform.position;local=this.mesh.worldToLocal(this.touchPoint.set(p.x,p.y,p.z));}}
   else if(source.gripSpace&&frame.getPose(source.targetRaySpace,referenceSpace)){e.touchTip.visible=true;e.touchTip.getWorldPosition(this.touchPoint);local=this.mesh.worldToLocal(this.touchPoint);}
   const crossed=this.touch.sample(source,stamp,local);
   const at=point=>this.controls.find(c=>{const x=(point.x/.4+.5)*W,y=(.5-point.y/this.mesh.geometry.parameters.height)*H;return x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h;});
   if(crossed){const c=at(crossed);if(c){this.ignoreController=e.controller;this.ignoreUntil=stamp+450;if(c.id!=='close')this.choose(c.id);this.close();return;}}
   if(local&&Math.abs(local.z)<.08){const c=at(local);if(c)touching={control:c,point:local.clone().setZ(.002)};}
  }
  let nearest=null;
  for(const e of this.entries){const s=e.source,pose=s&&frame.getPose(s.targetRaySpace,referenceSpace);e.beam.visible=!!pose;if(!pose)continue;const hit=this.hit(e.controller);e.beam.scale.z=hit?.distance??.9;if(hit&&(!nearest||hit.distance<nearest.distance))nearest=hit;}
  this.cursor.visible=!!touching||!!nearest;if(touching)this.cursor.position.copy(this.mesh.localToWorld(touching.point));else if(nearest)this.cursor.position.copy(nearest.point);
  const hover=touching?.control.id??this.control(nearest)?.id??'';if(hover!==this.hover){this.hover=hover;this.draw();}
 }
 draw(){
  const c=this.ctx,active=this.read();this.controls=[];c.fillStyle='#0d1722';c.fillRect(0,0,W,H);c.strokeStyle='#ddc695';c.lineWidth=3;c.strokeRect(1.5,1.5,W-3,H-3);
  c.textBaseline='middle';c.font='25px system-ui,sans-serif';c.fillStyle='#f2dfb5';c.fillText('クルッとパネル',24,38);
  const buttons=[{id:'close',label:'×',x:444,y:12,w:52,h:52},{id:'bridge',label:'橋の上から見上げる',x:20,y:85,w:472,h:88},{id:'boat',label:'屋形船から見上げる',x:20,y:193,w:472,h:88},{id:'diorama',label:'ジオラマサイズで観る',x:20,y:301,w:472,h:88},{id:'miniature',label:'通常サイズで街を眺める',x:20,y:409,w:472,h:88},{id:'show-info',label:this.readInfo()?'時間と玉名を隠す':'時間と玉名を表示',x:20,y:517,w:472,h:88}];
  for(const b of buttons){const selected=b.id==='show-info'?this.readInfo():b.id===(active?(this.readBoat()?'boat':'bridge'):this.readDiorama()?'diorama':'miniature');c.fillStyle=this.hover===b.id?'#405568':selected?'#554931':'#1a2e40';c.beginPath();c.roundRect(b.x,b.y,b.w,b.h,10);c.fill();c.textAlign='center';c.font='25px system-ui,sans-serif';c.fillStyle='#e8eef1';c.fillText((selected?'● ':'')+b.label,b.x+b.w/2,b.y+b.h/2);this.controls.push(b);}c.textAlign='left';
  c.font='17px system-ui,sans-serif';c.fillStyle='#a9c2cf';c.fillText('右の指 / コントローラー先端でタッチ',24,626);this.texture.needsUpdate=true;
 }
}
