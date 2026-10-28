import {PANEL_BUILD_VERSION,panelTheme,panelThemeId,panelFont,panelGradient,panelPrimaryFill,panelBarColor} from './panel-theme.js?v=1.3.17';
import {helpTopic,helpPages} from './help-content.js?v=1.3.17';
import {drawPanelSurface} from './panel-surface.js?v=1.3.15';
import * as T from './vendor/three.module.js';

const W=800,H=1340,HEADER_GROWTH=60;
export function nextEnabledOption(options,current,direction=1){
 const enabled=options.filter(o=>!o.disabled);if(!enabled.length)return current;
 const index=enabled.findIndex(o=>o.value===current);
 return enabled[(Math.max(0,index)+direction+enabled.length)%enabled.length].value;
}
export function stepRange(value,direction,min,max,step){
 return Math.round(Math.max(min,Math.min(max,value+direction*step))*1000)/1000;
}
export function controlAtUV(controls,uv){
 const x=uv.x*W,y=(1-uv.y)*H;
 return controls.find(c=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h)??null;
}

// A single texture and plane keep the sidebar light enough for the headset.
// Actions use the same form controls and callbacks as the desktop sidebar.
export class MRPanel{
 constructor({scene,read,click,cycle,choose=()=>{},adjust,place,exit,set=()=>{},pageChanged=()=>{},prepareChoose=()=>{},prepareTab=()=>{},childChanged=()=>{}}){
  Object.assign(this,{scene,read,click,cycle,choose,adjust,place,exit,set,pageChanged,prepareChoose,prepareTab,childChanged});
  this.helpScroll=0;this.helpMaxScroll=0;this.scrollSources=new Set();this.helpScrollStamp=0;this.picker=null;this.pickerScrollAt=0;this.groundStudy=false;this.page=0;this.controls=[];this.controllers=[];this.edges=new WeakMap();this.hover='';this.lastDraw=0;this.active=false;
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=H;this.ctx=this.surface.getContext('2d');
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.68,.68*H/W),new T.MeshBasicMaterial({map:this.texture,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,forceSinglePass:true}));
  this.mesh.renderOrder=1000;this.mesh.visible=false;scene.add(this.mesh);
  // The visible white bar has a larger, invisible target for seated ray grabs.
  this.bar=new T.Mesh(new T.CapsuleGeometry(.007,.23,4,12),new T.MeshBasicMaterial({color:0xf2f5f8,depthTest:false,depthWrite:false}));
  this.bar.rotation.z=Math.PI/2;this.bar.position.set(0,-.68*H/W/2-.045,.002);this.bar.renderOrder=1001;this.mesh.add(this.bar);
  this.grabTarget=new T.Mesh(new T.PlaneGeometry(.4,.07),new T.MeshBasicMaterial({side:T.DoubleSide}));
  this.grabTarget.position.copy(this.bar.position);this.grabTarget.visible=false;this.mesh.add(this.grabTarget);
  this.grab=null;this.sliderDrag=null;this.sliderPlane=new T.Plane();this.sliderPoint=new T.Vector3();this.moved=false;this.anchor=new T.Vector3();this.target=new T.Vector3();this.facing=new T.Object3D();
  this.cursor=new T.Mesh(new T.SphereGeometry(.004,8,6),new T.MeshBasicMaterial({color:0xffdfa1,depthTest:false,depthWrite:false}));this.cursor.renderOrder=1002;this.cursor.visible=false;scene.add(this.cursor);
  this.raycaster=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.pointer=new T.Vector2();this.lastTransform=null;this.preview=false;
 }
 syncChildView(child,{offsetX=-.13}={}){
  if(!child){this.endChildView();return;}
  if(this.childView||!this.active||!this.visible)return;
  // Preserve the real parent's texture and pose; the child is a separate,
  // nearer plane using the same readable canvas resolution and controls.
  if(!this.parentSurface){
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;this.parentCanvas=canvas;
   this.parentTexture=new T.CanvasTexture(canvas);this.parentTexture.colorSpace=T.SRGBColorSpace;this.parentTexture.generateMipmaps=false;this.parentTexture.minFilter=T.LinearFilter;
   this.parentSurface=new T.Mesh(this.mesh.geometry,new T.MeshBasicMaterial({map:this.parentTexture,transparent:true,opacity:.42,depthTest:false,depthWrite:false,side:T.DoubleSide,forceSinglePass:true}));this.parentSurface.renderOrder=998;this.scene.add(this.parentSurface);
  }
  this.parentCanvas.getContext('2d').clearRect(0,0,W,H);this.parentCanvas.getContext('2d').drawImage(this.surface,0,0);this.parentTexture.needsUpdate=true;
  this.childView={position:this.mesh.position.clone(),quaternion:this.mesh.quaternion.clone(),scale:this.mesh.scale.clone(),moved:this.moved,yawOffset:this.yawOffset,renderOrder:this.mesh.renderOrder,barOrder:this.bar.renderOrder,cursorOrder:this.cursor.renderOrder,beamOrders:this.controllers.map(e=>e.beam.renderOrder)};
  this.parentSurface.position.copy(this.mesh.position);this.parentSurface.quaternion.copy(this.mesh.quaternion);this.parentSurface.scale.copy(this.mesh.scale);this.parentSurface.visible=true;this.parentSurface.updateMatrixWorld(true);
  this.mesh.position.add(new T.Vector3(offsetX,-.03,.14).applyQuaternion(this.mesh.quaternion));this.mesh.scale.multiplyScalar(.84);this.mesh.renderOrder=1008;this.bar.renderOrder=1009;this.cursor.renderOrder=1010;this.controllers.forEach(e=>e.beam.renderOrder=1011);this.mesh.updateMatrixWorld(true);this.childChanged(true);
 }
 endChildView(){
  const saved=this.childView;if(!saved)return;this.childView=null;this.parentSurface.visible=false;
  this.mesh.position.copy(saved.position);this.mesh.quaternion.copy(saved.quaternion);this.mesh.scale.copy(saved.scale);this.moved=saved.moved;this.yawOffset=saved.yawOffset;
  this.mesh.renderOrder=saved.renderOrder;this.bar.renderOrder=saved.barOrder;this.cursor.renderOrder=saved.cursorOrder;this.controllers.forEach((e,i)=>e.beam.renderOrder=saved.beamOrders[i]??1001);this.mesh.updateMatrixWorld(true);this.childChanged(false);
 }
 navigate(page){this.adjusting=false;this.studyMode=false;this.groundStudy=false;this.flowerStudy=false;this.picker=null;this.page=page;this.pageChanged(page);this.draw();}
 get visible(){return this.mesh.visible;}
 attach(controller){
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]);
  const beam=new T.Line(geometry,new T.LineBasicMaterial({color:0xddc695,transparent:true,opacity:.75,depthTest:false,depthWrite:false}));beam.renderOrder=1001;beam.visible=false;controller.add(beam);
  const entry={controller,beam,source:null};this.controllers.push(entry);
  controller.addEventListener('connected',e=>{entry.source=e.data;});
  controller.addEventListener('disconnected',()=>{this.release(controller);if(entry.source)this.edges.delete(entry.source);entry.source=null;beam.visible=false;});
  controller.addEventListener('selectend',()=>this.release(controller));

 }
 openAt(transform,{side=1.28,distance=1.2,drop=.12}={}){
  if(!transform)return;this.endChildView();this.lastTransform=transform;
  const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);
  if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  this.mesh.position.set(p.x+x*distance-z*side,p.y-drop,p.z+z*distance+x*side);
  this.release();this.moved=false;this.yawOffset=0;this.mesh.lookAt(p.x,this.mesh.position.y,p.z);this.mesh.visible=true;this.mesh.updateMatrixWorld(true);this.hover='';this.draw();
 }
 begin(transform){this.active=true;this.preview=false;this.edges=new WeakMap();this.page=0;this.openAt(transform);}
 end(){this.active=false;this.close();this.edges=new WeakMap();}
 close(){const child=!!this.childView;this.endChildView();if(child){this.adjusting=false;this.studyMode=false;this.groundStudy=false;this.flowerStudy=false;this.page=4;this.pageChanged(4);}this.picker=null;this.release();this.mesh.visible=false;this.cursor.visible=false;this.hover='';for(const e of this.controllers)e.beam.visible=false;}
 // A moved panel can end up behind the viewer or facing away. A returns it
 // to a readable position in those cases, instead of toggling an unseen plane.
 isReadable(transform=this.lastTransform){
  if(!transform)return true;const p=transform.position,m=transform.matrix;
  const toEye=new T.Vector3(p.x,p.y,p.z).sub(this.mesh.position),distance=toEye.length();
  if(!Number.isFinite(distance)||distance<.2||distance>3)return false;
  const normal=new T.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
  const forward=new T.Vector3(-m[8],-m[9],-m[10]);
  return normal.dot(toEye)/distance>.25&&forward.dot(toEye.negate())/distance>.25;
 }
 toggle(){
  if(!this.isReadable()){this.openAt(this.lastTransform);return;}
  if(this.visible)this.close();else if(this.moved){this.mesh.visible=true;this.draw();}else this.openAt(this.lastTransform);
 }
 pulse(source){const actuator=source?.gamepad?.hapticActuators?.[0];if(actuator)try{actuator.pulse(.22,20)?.catch(()=>{});}catch{}}
 fire(control,source){if(!control)return;this.pulse(source);control.action();this.hover='';if(this.visible)this.draw();}
 hitController(controller){
  controller.updateWorldMatrix(true,false);this.mesh.updateMatrixWorld(true);
  this.origin.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);
  this.raycaster.set(this.origin,this.direction);return this.raycaster.intersectObjects([this.mesh,this.grabTarget],false)[0]??null;
 }
 beginGrab(hit,controller=null){
  if(this.grab||!hit||hit.object!==this.grabTarget)return;
  this.grab={controller,distance:hit.distance,localAnchor:this.mesh.worldToLocal(hit.point.clone())};this.hover='grab';this.draw();
 }
 moveGrab(ray){
  if(!this.grab)return;
  this.target.copy(ray.direction).multiplyScalar(this.grab.distance).add(ray.origin);
  const p=this.lastTransform?.position;
  if(p&&Math.hypot(p.x-this.target.x,p.z-this.target.z)>.05){
   this.facing.position.copy(this.target);this.facing.lookAt(p.x,this.target.y,p.z);this.mesh.quaternion.copy(this.facing.quaternion);
  }
  this.anchor.copy(this.grab.localAnchor).multiply(this.mesh.scale).applyQuaternion(this.mesh.quaternion);
  this.mesh.position.copy(this.target).sub(this.anchor);this.mesh.updateMatrixWorld(true);this.moved=true;
 }
 beginSlider(control,controller,ray){this.sliderDrag={control,controller};this.slideToRay(ray);}
 slideToRay(ray){
  if(!this.sliderDrag)return;
  this.mesh.updateMatrixWorld(true);
  this.sliderPlane.setFromNormalAndCoplanarPoint(new T.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion),this.mesh.position);
  if(!ray.intersectPlane(this.sliderPlane,this.sliderPoint))return;
  this.mesh.worldToLocal(this.sliderPoint);
  const c=this.sliderDrag.control,x=(this.sliderPoint.x/.68+.5)*W;
  if(c.helpScroll){const y=(.5-this.sliderPoint.y/(.68*H/W))*H-HEADER_GROWTH;this.scrollHelpTo((y-c.trackY)/c.trackH);return;}
  if(c.pickerScroll){const y=(.5-this.sliderPoint.y/(.68*H/W))*H;this.scrollPickerTo((y-c.trackY)/c.trackH);return;}
  this.set(c.id,Math.max(0,Math.min(1,(x-c.trackX)/c.trackW)));this.hover=c.id;this.draw();
 }
 release(controller){
  if(this.sliderDrag&&(!controller||this.sliderDrag.controller===controller)){
   const control=this.sliderDrag.control,id=control.id;this.sliderDrag=null;if(!control.pickerScroll&&!control.helpScroll)this.set(id,this.read()[id].value,true);this.hover='';
  }
  if(!this.grab||(controller&&this.grab.controller!==controller))return;this.grab=null;this.hover='';this.bar.material.color.setHex(panelBarColor(false));
 }
 select(controller){
  // A panel hit or an ongoing drag consumes the trigger. A left-hand miss
  // permits town placement; right-hand misses still cannot pause the show.
  if(!this.active||!this.visible)return false;
  if(this.grab||this.sliderDrag)return true;
  const entry=this.controllers.find(e=>e.controller===controller),hit=this.hitController(controller);
  if(hit?.object===this.grabTarget)return true;
  else if(hit){const control=controlAtUV(this.controls,hit.uv);if(control?.slider){this.beginSlider(control,controller,this.raycaster.ray);this.pulse(entry?.source);}else this.fire(control,entry?.source);}
  return !!hit;
 }
 update(stamp,frame,referenceSpace,transform){
  this.scrollSources.clear();const scrollDt=Math.max(0,Math.min(.05,(stamp-this.helpScrollStamp)/1000));this.helpScrollStamp=stamp;
  if(!this.active)return;if(transform)this.lastTransform=transform;
  if(!this.visible)return;
  const held=this.grab??this.sliderDrag;
  if(held?.controller){
   const entry=this.controllers.find(e=>e.controller===held.controller),source=entry?.source;
   if(!source||!frame?.getPose(source.targetRaySpace,referenceSpace))this.release();
   else{this.hitController(entry.controller);if(this.grab)this.moveGrab(this.raycaster.ray);else this.slideToRay(this.raycaster.ray);}
  }
  let nearest=null;
  for(const entry of this.controllers){
   const source=entry.source,pose=source&&frame&&referenceSpace?frame.getPose(source.targetRaySpace,referenceSpace):null;
   entry.beam.visible=!!pose;if(!pose)continue;
   const hit=this.hitController(entry.controller);entry.beam.scale.z=hit?.distance??1.6;
   if(hit&&(!nearest||hit.distance<nearest.distance))nearest=hit;
   if(hit?.object===this.mesh&&!held&&!this.controllerGrabbed&&this.scrollContent?.(source.gamepad?.axes?.[3]??0,(1-hit.uv.y)*H,scrollDt))this.scrollSources.add(source);
   if(!this.picker&&this.page===3&&hit?.object===this.mesh&&!held&&!this.controllerGrabbed&&this.helpMaxScroll>0){const y=(1-hit.uv.y)*H-HEADER_GROWTH,axis=source.gamepad?.axes?.[3]??0;if(y>=390&&y<=980&&Math.abs(axis)>.18){this.scrollSources.add(source);this.scrollHelp(Math.sign(axis)*(Math.abs(axis)-.18)/.82*600*scrollDt);}}
   if(this.picker&&hit?.object===this.mesh&&!held&&Math.abs(source.gamepad?.axes?.[3]??0)>.45&&stamp-this.pickerScrollAt>160){this.scrollPicker(Math.sign(source.gamepad.axes[3])*92);this.pickerScrollAt=stamp;}
  }
  this.cursor.visible=!!nearest;if(nearest)this.cursor.position.copy(nearest.point);
  const hover=this.controllerGrabbed?'grab':this.sliderDrag?this.sliderDrag.control.id:this.grab||nearest?.object===this.grabTarget?'grab':nearest?controlAtUV(this.controls,nearest.uv)?.id??'':'';
  this.bar.material.color.setHex(panelBarColor(hover==='grab'));
  if(hover!==this.hover||stamp-this.lastDraw>250){this.hover=hover;this.draw();this.lastDraw=stamp;}
 }
 previewPointer(x,y,camera,activate=false){
  if(!this.preview||!this.visible)return false;
  this.pointer.set(x,y);camera.updateMatrixWorld();this.mesh.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,camera);
  if(this.grab&&!activate){this.moveGrab(this.raycaster.ray);return true;}
  if(this.sliderDrag&&!activate){this.slideToRay(this.raycaster.ray);return true;}
  const hit=this.raycaster.intersectObjects([this.mesh,this.grabTarget],false)[0],control=hit?.object===this.mesh?controlAtUV(this.controls,hit.uv):null;
  const hover=hit?.object===this.grabTarget?'grab':control?.id??'';this.bar.material.color.setHex(panelBarColor(hover==='grab'));
  if(this.hover!==hover){this.hover=hover;this.draw();}
  if(activate){if(this.grab||this.sliderDrag)return true;if(hit?.object===this.grabTarget)this.beginGrab(hit);else if(control?.slider)this.beginSlider(control,null,this.raycaster.ray);else this.fire(control);}return true;
 }
 text(label,x,y,size=25,color=panelTheme().text,maxWidth){
  const c=this.ctx;c.font=panelFont(size);c.fillStyle=color;c.textBaseline='middle';
  if(maxWidth){while(c.measureText(label).width>maxWidth&&size>17){size--;c.font=panelFont(size);}}
  c.fillText(label,x,y);
 }
 button(id,label,x,y,w,h,action,{selected=false,danger=false,primary=false,disabled=false,heart=false,quiet=false,nav=false}={}){
  const c=this.ctx,p=panelTheme(),hover=!disabled&&this.hover===id;
  c.save();c.fillStyle=disabled?p.disabled:primary?panelPrimaryFill(c,x,y,w,h):hover?p.hover:heart&&selected?'#492333':selected?p.selected:danger?p.dangerSurface:p.surface;
  c.beginPath();c.roundRect(x,y,w,h,primary?16:12);
  if(primary&&!disabled){c.shadowColor=p.primary[0]+'35';c.shadowBlur=10;}if(!quiet&&!nav)c.fill();c.shadowBlur=0;
  c.strokeStyle=disabled?p.line:heart&&selected?'#f681a1':primary?p.primaryEdge:hover?p.accent:selected?p.selectedLine:p.line;c.lineWidth=hover?2:1;if(!quiet&&!nav)c.stroke();
  if(nav&&selected){c.fillStyle=panelGradient(c,x,y,w,0,p.highlight);c.fillRect(x+8,y+h-4,w-16,3);}
  c.textAlign='center';this.text(label,x+w/2,y+h/2,primary?33:25,disabled?p.disabledText:heart?(selected?'#ff7194':'#efb6c1'):primary?p.primaryInk:danger?p.danger:p.text,w-22);c.restore();
  this.controls.push({id,x,y,w,h,primary,disabled,action:()=>{if(!disabled)action();}});
 }
 preparationBox(view={phase:'preparing',heading:'準備中…',title:'選んだ曲',setting:'設定を確認しています'}){
  const c=this.ctx,ready=view.phase==='ready',error=view.phase==='error';
  c.fillStyle=error?'#35252c':ready?'#16312e':'#28303b';c.beginPath();c.roundRect(28,451,744,104,12);c.fill();
  this.text(view.heading,44,473,28,error?'#ffbeb4':ready?'#a8f0c8':panelTheme().accent,712);
  this.text(view.title,44,505,26,panelTheme().text,712);
  this.text(view.setting,44,536,25,panelTheme().muted,712);
 }

 selector(id,label,y,state,{width=744,x=28}={}){
  this.text(label,x+4,y,23,panelTheme().muted);
  this.button(id,state.selected+'  ▾',x,y+24,width,60,()=>{if(!state.disabled){this.picker={id,offset:Math.max(0,(state.options.findIndex(o=>o.value===state.value))-3)};this.draw();}});
 }
 scrollPicker(delta){
  if(!this.picker)return false;
  const count=this.read()[this.picker.id].options.length;
  this.picker.offset=Math.max(0,Math.min(Math.max(0,count-8),this.picker.offset+Math.sign(delta)*Math.max(1,Math.round(Math.abs(delta)/92))));this.draw();return true;
 }
 scrollPickerTo(fraction){
  if(!this.picker)return;
  const count=this.read()[this.picker.id].options.length;
  this.picker.offset=Math.round(Math.max(0,Math.min(1,fraction))*Math.max(0,count-8));this.draw();
 }
 scrollHelp(delta){this.helpScroll=Math.max(0,Math.min(this.helpMaxScroll,this.helpScroll+delta));this.draw();}
 scrollHelpTo(fraction){this.helpScroll=Math.max(0,Math.min(1,fraction))*this.helpMaxScroll;this.draw();}
 drawHelp(s){
  this.selector('helpTopic','知りたいことを選ぶ',245,s.helpTopic);
  const topic=helpTopic(s.helpTopic.value),c=this.ctx;c.font=panelFont(25);
  const lines=helpPages(topic,t=>c.measureText(t).width,676).flat(),top=390,bottom=980;
  if(this.helpTopicId!==topic.id){this.helpTopicId=topic.id;this.helpScroll=0;}
  this.helpMaxScroll=Math.max(0,lines.length*32-(bottom-top));this.helpScroll=Math.max(0,Math.min(this.helpMaxScroll,this.helpScroll));
  this.text(topic.title,32,365,30,panelTheme().accent,724);
  c.save();c.beginPath();c.rect(28,top,700,bottom-top);c.clip();
  lines.forEach((line,i)=>this.text(line,38,top+18+i*32-this.helpScroll,25,panelTheme().text));c.restore();
  if(this.helpMaxScroll){
   const trackH=bottom-top,thumb=Math.max(48,trackH*trackH/(lines.length*32)),travel=trackH-thumb;
   c.fillStyle=panelTheme().track;c.fillRect(748,top,16,trackH);c.fillStyle=panelTheme().accent;c.fillRect(748,top+travel*this.helpScroll/this.helpMaxScroll,16,thumb);
   this.controls.push({id:'helpScroll',x:728,y:top,w:44,h:trackH,slider:true,helpScroll:true,trackY:top+thumb/2,trackH:travel});
   this.text('スクロール：スティック上下／右のつまみを掴んで移動',32,1005,22,panelTheme().muted,736);
  }
  this.button('entryTipEnabled',(s.entryTipEnabled?'☑':'☐')+' 入室時の操作案内を表示',28,1040,744,64,()=>this.click('entryTipEnabled'),{selected:s.entryTipEnabled});
 }

 drawPicker(s){
  const picker=this.picker,state=s[picker.id],c=this.ctx;if(!state||state.disabled){this.picker=null;return;}
  const rows=8,pitch=92,top=268,count=state.options.length,max=Math.max(0,count-rows);picker.offset=Math.max(0,Math.min(max,picker.offset));
  c.fillStyle=panelTheme().overlay;c.fillRect(8,208,784,1120);this.controls=this.controls.filter(control=>control.id==='detailClose');
  this.text(picker.id==='setlistSelect'?'このセットリストを観る':picker.id==='musicTrack'?'曲を選ぶ':picker.id==='autoMusicFeeling'?'曲調を選ぶ':picker.id==='autoMusicEars'?'穂の風景を選ぶ':picker.id==='helpTopic'?'使い方を選ぶ':'一覧から選ぶ',32,240,32,panelTheme().accent);
  const width=max?680:744;
  state.options.slice(picker.offset,picker.offset+rows).forEach((o,i)=>{
   this.button('choice:'+o.value,o.label,28,top+i*pitch,width,80,()=>{if(o.disabled)return;this.picker=null;this.choose(picker.id,o.value);},{selected:o.value===state.value,disabled:!!o.disabled});
  });
  if(max){
   c.fillStyle=panelTheme().track;c.fillRect(742,top,24,rows*pitch);c.fillStyle=panelTheme().accent;const thumb=rows*pitch*rows/count;c.fillRect(742,top+(rows*pitch-thumb)*picker.offset/max,24,thumb);
   this.controls.push({id:'pickerScroll',x:718,y:top,w:64,h:rows*pitch,slider:true,pickerScroll:true,trackY:top+thumb/2,trackH:rows*pitch-thumb});
   this.text('ビームを一覧へ向け、スティック上下でスクロール',32,1060,23,panelTheme().muted,736);
  }
  this.button('pickerCancel','戻る（変更しない）',28,1140,744,64,()=>{this.picker=null;});
 }

 range(id,label,y,state,unit=''){
  if(state.wide){
   this.text(label,32,y,23,panelTheme().muted);
   for(const [suffix,label,x,direction,large] of [['--','−−',28,-1,true],['-','−',122,-1,false],['+','＋',596,1,false],['++','＋＋',690,1,true]])this.button(id+suffix,label,x,y+24,82,48,()=>this.adjust(id,direction,large));
   this.text(state.value.toFixed(2)+unit,310,y+48,28,panelTheme().accent,270);return;
  }
  this.text(label,32,y,23,panelTheme().muted);
  this.button(id+'-','−',28,y+24,92,60,()=>this.adjust(id,-1));
  const value=['volume','musicVolume'].includes(id)?Math.round(state.value*100)+'%':state.value.toFixed(2)+unit;
  this.text(value,350,y+54,30,panelTheme().accent);
  this.button(id+'+','＋',680,y+24,92,60,()=>this.adjust(id,1));
 }
 slider(id,label,y,state,{compact=false}={}){
  const c=this.ctx,value=Math.max(0,Math.min(1,state.value)),trackX=60,trackW=680,seek=id==='betaMusicSeek',offset=compact?32:60;
  c.save();if(state.disabled)c.globalAlpha=.4;
  this.text(label,32,y,compact?24:28,seek?'#f8bea4':panelTheme().text,seek?736:580);
  if(!seek)this.text(Math.round(value*100)+'%',660,y,compact?25:32,panelTheme().accent);
  c.fillStyle=panelTheme().track;c.beginPath();c.roundRect(trackX,y+offset-6,trackW,12,6);c.fill();
  c.fillStyle=panelGradient(c,trackX,y,trackW,0,panelTheme().highlight);c.beginPath();c.roundRect(trackX,y+offset-6,Math.max(1,value*trackW),12,6);c.fill();
  c.fillStyle=panelTheme().knob;c.beginPath();c.arc(trackX+value*trackW,y+offset,compact?17:21,0,Math.PI*2);c.fill();
  if(!state.disabled)this.controls.push({id,x:28,y:y+offset-27,w:744,h:54,slider:true,trackX,trackW});
  if(!compact){this.text(seek?'はじめ':id==='roomBrightness'?'暗い':'小さい',32,y+115,23,panelTheme().muted);this.text(seek?'曲末':id==='roomBrightness'?'明るい':'大きい',660,y+115,23,panelTheme().muted);}
  c.restore();
 }

 wrap(text,x,y,maxWidth,lines=3,lineHeight=34,color=panelTheme().muted,size=23){
  const c=this.ctx;c.font=panelFont(size);let line='',row=0;
  for(const char of text){if(c.measureText(line+char).width>maxWidth){this.text(line,x,y+row*lineHeight,size,color);row++;line='';if(row>=lines)return;}line+=char;}
  if(line)this.text(line,x,y+row*lineHeight,size,color);
 }
 drawPreparation(s){
  const p=s.preparing,hand=p.hand==='left'?'左':'右',fields=['kind','size','palette'];
  this.text(hand+'トリガーに仕込む',32,258,34,panelTheme().accent);
  ['種類','大きさ','配色'].forEach((label,i)=>this.button('prepareTab'+i,label,28+i*254,304,236,54,()=>this.prepareTab(i),{selected:p.tab===i}));
  const compact=s.prepareOptions.length>12,rowPitch=compact?54:66,choiceHeight=compact?46:54;
  s.prepareOptions.forEach((o,i)=>{const x=28+(i%2)*384,y=390+Math.floor(i/2)*rowPitch;
   if(o.disabled){this.text(o.label+'（対象外）',x+20,y+27,23,panelTheme().disabledText);return;}
   this.button('prepareChoice'+i,o.label,x,y,360,choiceHeight,()=>this.prepareChoose(o.value),{selected:String(p.draft[fields[p.tab]])===o.value});
  });
  this.text(s.preparing.summary,32,786,25,panelTheme().accent,736);
  this.text(s.loadedLeft?'左：'+s.loadedLeft:'',32,824,20,panelTheme().muted,736);this.text('右：'+s.loadedRight,32,854,20,panelTheme().muted,736);
  this.button('prepareConfirm','この玉を'+hand+'に仕込む',28,886,744,60,()=>this.click('prepareConfirm'));
  this.button('prepareCancel','戻る（変更しない）',28,958,744,48,()=>this.click('prepareCancel'));
 }

 drawRebuildFeedback(s){
  const result=s.rebuildFeedback;if(!result)return;
  const c=this.ctx,p=panelTheme();c.fillStyle=p.successSurface;c.strokeStyle=p.successLine;c.lineWidth=1.5;
  c.beginPath();c.roundRect(28,686,744,78,12);c.fill();c.stroke();
  this.text(result.heading,44,714,26,p.success,712);
  this.text(result.details,44,746,20,p.muted,712);
 }
 drawVoiceControls(s){
  const v=s.voice??{},c=this.ctx,recording=v.phase==='recording',preparing=['permission','loading','starting'].includes(v.phase);
  this.button('voiceOpen',recording?'■ 停止':preparing?'◌':'🎤',28,784,88,62,()=>this.click(recording?'voiceRecord':'voiceOpen'),{primary:recording,disabled:!!v.busy&&!recording});
  this.text('あなたのイメージをAIに話す',132,806,23,panelTheme().text,490);this.text('テスト版',640,806,18,panelTheme().muted,112);
  this.text('20秒まで録音 · 話し終わったら「停止」',132,835,20,panelTheme().muted,620);
  if(v.busy){
   if(preparing){
    const angle=performance.now()/650;c.save();c.strokeStyle=panelTheme().accent;c.lineWidth=4;c.beginPath();c.arc(55,888,15,angle,angle+Math.PI*1.45);c.stroke();c.restore();
    this.wrap(v.status??'',90,880,674,2);this.wrap(v.detail??'',32,956,736,3,28);
   }else this.wrap(v.status??'',32,880,736,3);
   if(recording){this.text('● '+Math.min(20,v.seconds??0).toFixed(1)+' / 20秒',32,988,26,panelTheme().accent);c.fillStyle=panelTheme().track;c.fillRect(32,1027,736,10);c.fillStyle=panelTheme().accent;c.fillRect(32,1027,736*Math.min(1,v.progress??0),10);}
  }else if(v.hasDraft||v.transcript){
   this.wrap(v.hasDraft?'✓ 希望を受け取りました。上のボタンで反映できます。':v.status??'',32,876,736,2,28);
   this.wrap(v.transcript?'「'+v.transcript+'」':'',32,938,736,2,28,panelTheme().text);
   this.wrap(v.summary??'',32,1000,736,2,28);
   this.button('voiceDiscard','取り消す',492,1048,280,54,()=>this.click('voiceDiscard'));
  }else if(v.error){this.wrap(v.status??'',32,880,736,5,28);}
  else{
   this.text('入力例',32,875,18,panelTheme().example,736);
   this.wrap('「夜空をイメージした曲なので、金色系の花火をたくさん出して」',32,902,736,1,27,panelTheme().example,21);
   this.text('「海をイメージしたプログラムにしたい」など。',32,929,21,panelTheme().example,736);
   this.text('「ぽつりぽつり」「しっとり上げて」もどうぞ。',32,956,20,panelTheme().example,736);
   this.text('録音は認識後に破棄します。',32,1040,18,panelTheme().muted,736);
  }
 }

 draw(){
  const s=this.read(),c=this.ctx;const child=!!s.preparing||this.page===1||this.page===4&&(this.adjusting||s.patternChoiceOpen);this.syncChildView(child);this.controls=[];drawPanelSurface(c,W,H);
  this.text('花火街',36,49,43,panelTheme().text);this.text('ベータ版 '+PANEL_BUILD_VERSION,202,57,19,panelTheme().muted);
  this.text('A LITTLE CITY, A PRIVATE NIGHT',36,92,15,panelTheme().accent);
  if(child){this.button('detailClose','×',696,18,76,60,()=>{if(s.patternChoiceOpen)this.click('patternChoiceClose');if(s.voice?.open)this.click('voiceClose');this.navigate(4);});this.text('花火大会から開いている設定です',36,132,21,panelTheme().muted);}
  else{
  this.button('favoriteToggle',s.favoriteSaved?'♥':'♡',696,18,76,60,()=>this.click('favoriteToggle'),{selected:!!s.favoriteSaved,disabled:!s.favoriteCanSave,heart:true});
  this.button('favoriteListOpen','一覧',608,18,76,60,()=>this.click('favoriteListOpen'));
  this.text('右A：サイドパネル · 左X：クルッとパネル',36,132,21,panelTheme().muted);
  }
  c.save();c.translate(0,HEADER_GROWTH);
  if(child)this.button('showParent',this.page===1&&this.studyMode?'‹ 花火玉の仕込みへ戻る':'‹ 花火大会へ戻る',28,126,744,64,()=>{if(this.page===1&&this.studyMode){this.studyMode=false;this.groundStudy=false;this.flowerStudy=false;this.draw();}else{if(s.patternChoiceOpen)this.click('patternChoiceClose');if(s.voice?.open)this.click('voiceClose');this.navigate(4);}});
  else [[4,'花火大会'],[2,'街・音'],[3,'使い方']].forEach(([page,label],i)=>this.button('page'+page,label,28+i*254,126,236,68,()=>this.navigate(page),{selected:this.page===page,nav:true}));
  if(s.preparing){this.drawPreparation(s);}
  else if(this.page===0){
   this.button('play',s.playLabel??(s.running?'ひと休み':s.resumeShow?'大会を再開':'花火大会を観る'),28,238,744,64,()=>this.click('play'),{selected:!s.running});
   if(s.awaitingShow){
    this.text('街の台座へビーム＋グリップで掴んで移動',32,335,24,panelTheme().text,736);
    this.text('掴んだままスティック：左右で回転・上下で大きさ',32,374,23,panelTheme().muted,736);
   }else{
   this.button('stop','大会を止める',28,318,360,60,()=>this.click('stop'));
   this.button('restart','大会を最初から',412,318,360,60,()=>this.click('restart'));}
   this.selector('program','大会プログラム',409,s.program);
   this.selector('mood','大会の雰囲気',525,s.mood);
   this.selector('ending','大会の終わり',641,s.ending);
   this.button('loadLeft','左トリガーに仕込む',28,770,360,48,()=>this.click('loadLeft'));this.button('loadRight','右トリガーに仕込む',412,770,360,48,()=>this.click('loadRight'));
   this.text('左：'+s.loadedLeft+' ／ 右：'+s.loadedRight,32,836,20,panelTheme().accent,736);
   this.button('reset','設定と視点を初期状態に戻す',28,860,744,42,()=>this.click('reset'));
  }else if(this.page===4){
   this.selector('musicTrack','曲を選ぶ',221,s.musicTrack,{width:650});
   this.button('trackMenuToggle','…',694,245,78,60,()=>this.click('trackMenuToggle'),{disabled:!s.trackCanRename});
   const ready=s.readiness?.phase==='ready',err=s.readiness?.phase==='error';
   this.text(s.readiness?.heading??'準備中…',486,221,21,err?'#ffbeb4':ready?'#9ed5b9':panelTheme().accent,282);
   this.text(s.analysisFeedback?.phase==='complete'?'✓ 解析が完了しました':(s.musicless?'音楽なし':s.autoMusicFeeling.selected)+' ／ 構成 '+(s.normalBuildNumber??1),32,334,22,s.analysisFeedback?.phase==='complete'?panelTheme().accent:panelTheme().muted,736);
   this.button('showWatch',s.showWatchLabel??'▶ 花火大会を開演',28,365,744,88,()=>this.click('showWatch'),{primary:true,disabled:!!s.showWatchDisabled});
   if(s.setlistSelect?.options?.length>1)this.button('setlistSelect',s.setlistSelect.selected+'  ▾',28,475,744,60,()=>{this.picker={id:'setlistSelect',offset:0};});
   else this.text('気に入った大会は、右上の ♥ から保存できます',32,505,23,panelTheme().muted,736);
   this.button('showAdjust','演出を調整する  ›',28,563,744,60,()=>{this.adjusting=true;},{quiet:true});
   c.strokeStyle=panelTheme().line;c.beginPath();c.moveTo(28,559);c.lineTo(772,559);c.moveTo(28,631);c.lineTo(772,631);c.stroke();
   this.button('showTrialOpen','トリガーに花火玉を仕込む  ›',28,656,744,62,()=>this.navigate(1));
   this.button('patternChoiceOpen','型物を入れる  ›',28,732,744,56,()=>this.click('patternChoiceOpen'),{disabled:!!s.patternChoiceDisabled});
   if(s.selectionFailed||s.musicAnalysisBusy){
    this.wrap(s.showNotice??s.readiness?.setting??'',32,756,736,2);
    this.button('musicReanalyze',s.selectionFailed?'この曲の解析をやり直す':'準備を中止する',28,824,744,54,()=>this.click(s.selectionFailed?'musicReanalyze':'autoMusicCancel'));
   }else{
    if(!s.musicless)this.slider('musicVolume','音楽の音量',805,s.musicVolume,{compact:true});
   }
   this.slider('volume','花火の音量',901,s.volume,{compact:true});
   this.slider('roomBrightness','部屋の明るさ',1025,s.roomBrightness,{compact:true});
   if(this.adjusting){
    c.clearRect(12,202,776,922);c.fillStyle=panelTheme().overlay;c.fillRect(12,202,776,922);this.controls=this.controls.filter(control=>control.y<202);
    this.text('花火大会  ›  演出を調整する',32,218,22,panelTheme().muted,736);
    this.text('演出を調整する',32,272,34,panelTheme().text);
    if(s.analysisFeedback?.inChild){
     const a=s.analysisFeedback;
     this.text(a.busy?'曲を解析中…':a.phase==='complete'?'✓ 解析が終わりました':a.phase==='error'?'解析できませんでした':'解析を中止しました',32,340,32,panelTheme().accent,736);
     this.text(a.title??'',32,400,27,panelTheme().text,736);
     this.wrap(a.status??'',32,468,736,6);
     c.fillStyle=panelTheme().track;c.fillRect(32,704,736,8);c.fillStyle=panelTheme().accent;c.fillRect(32,704,736*Math.max(0,Math.min(1,a.progress??0)),8);
     if(a.busy)this.button('autoMusicCancel','解析を中止する',28,770,744,64,()=>this.click('autoMusicCancel'));
     else if(a.phase==='complete')this.text('まもなく花火大会へ戻ります',32,782,25,panelTheme().muted,736);
    }else if(s.selectionFailed||s.musicAnalysisBusy&&!s.voice?.busy){
     this.wrap(s.readiness?.setting??s.showNotice??'',32,390,736,5);
     this.button('musicReanalyze',s.selectionFailed?'この曲の解析をやり直す':'準備を中止する',28,650,744,64,()=>this.click(s.selectionFailed?'musicReanalyze':'autoMusicCancel'));
    }else{
     if(s.musicless){this.selector('program','大会プログラム',312,s.program);this.selector('mood','大会の雰囲気',410,s.mood);this.selector('ending','大会の終わり',508,s.ending);}
     else{
      this.selector('autoMusicFeeling','曲調・構成',342,s.autoMusicFeeling);
      if(!s.musicOriginal)this.selector('autoMusicEars','穂の風景',450,s.autoMusicEars);
      this.button('musicReanalyze','解析をやり直す',28,550,744,50,()=>this.click('musicReanalyze'),{disabled:!!s.voice?.busy});
     }
     if(!s.musicOriginal||s.voice?.hasDraft)this.button('showRebuild',s.voice?.hasDraft?'このイメージで打ち上げる':'打ち上げ玉の構成を変える',28,610,744,64,()=>this.click('showRebuild'),{primary:!!s.voice?.hasDraft,disabled:!!s.voice?.busy});
     this.drawRebuildFeedback(s);this.drawVoiceControls(s);
     if(!s.rebuildFeedback&&!s.voice?.transcript&&!s.voice?.busy)this.wrap((s.showNotice||'')+(s.voice?.open?'':' '+(s.readiness?.setting??'')),32,1090,736,1,28);
    }
    this.button('showStop','大会を止める',28,1118,360,50,()=>this.click('showStop'),{danger:true});
    this.button('showRestart','最初から観る',412,1118,360,50,()=>this.click('showRestart'));
    if(s.trackUndo)this.button('trackUndo','曲の削除を元に戻す',28,1100,744,58,()=>this.click('trackUndo'));
   }
  }else if(this.page===1){
   this.text(this.studyMode?'花火大会  ›  花火玉の仕込み  ›  演出の試し打ち':'花火大会  ›  トリガーに花火玉を仕込む',32,218,22,panelTheme().muted,736);
   this.text(this.studyMode?'演出の試し打ち':'トリガーに花火玉を仕込む',32,272,33,panelTheme().text,736);
   if(!this.studyMode){
    this.text('種類・大きさ・配色を選んで、左右へ仕込みます。',32,315,22,panelTheme().muted,736);
    this.selector('type','花火の種類',355,s.type);this.selector('size','玉の大きさ',466,s.size);
    if(s.palette)this.selector('palette','配色',577,s.palette);
    this.button('loadLeft','左トリガーに仕込む',28,714,360,66,()=>this.click('loadLeft'));
    this.button('loadRight','右トリガーに仕込む',412,714,360,66,()=>this.click('loadRight'));
    for(const [hand,x,label] of [['Left',28,'左トリガーに仕込み済み'],['Right',412,'右トリガーに仕込み済み']]){c.fillStyle=panelTheme().surface;c.beginPath();c.roundRect(x,803,360,114,12);c.fill();this.text(label,x+16,826,21,panelTheme().accent,328);this.wrap(s['loaded'+hand]??'',x+16,863,328,2);}
    this.button('sample','選んだ一発を試す',28,950,744,58,()=>this.click('sample'));
    const pattern=s.type?.value?.startsWith('pattern');
    if(pattern){
     this.button('patternSelectedBatch','選んだ型物を10秒続ける',28,1024,744,54,()=>this.click('patternSelectedBatch'));
     this.button('patternCycle','型物の連発をひと巡り',28,1094,360,54,()=>this.click('patternCycle'));
     this.button('patternPair','５号ニコちゃん左右２発',412,1094,360,54,()=>this.click('patternPair'));
    }
    this.button('studyMore','花・トラなどの演出を試す  ›',28,pattern?1170:1040,744,54,()=>{this.studyMode=true;this.groundStudy=false;this.flowerStudy=false;});
   }else{
   this.button('upperStudy','上空の花火',28,293,232,44,()=>{this.groundStudy=false;this.flowerStudy=false;},{selected:!this.groundStudy&&!this.flowerStudy});
   this.button('groundStudy','大トラ・子トラ',284,293,232,44,()=>{this.groundStudy=true;this.flowerStudy=false;},{selected:this.groundStudy&&!this.flowerStudy});
   this.button('flowerStudy','花を咲かせる',540,293,232,44,()=>{this.flowerStudy=true;this.groundStudy=false;},{selected:this.flowerStudy});
   if(this.flowerStudy){
    this.selector('flowerPattern','花の並べ方',347,s.flowerPattern);
    this.selector('flowerTiming','咲く順序',434,s.flowerTiming);
    this.selector('flowerSpacing','花の間隔',550,s.flowerSpacing);
    this.selector('flowerColor','花の色',666,s.flowerColor);
    this.selector('flowerSize','玉の大きさ',782,s.flowerSize);
    this.button('flowerShow','この花を咲かせる',28,914,744,60,()=>this.click('flowerShow'));
    this.button('flowerPause',s.cometPaused?'試し打ちを再開':'試し打ちを一時停止',28,991,744,54,()=>this.click('flowerPause'));
    this.wrap(s.flowerDescription??'',32,1094,736,2);
   }else if(this.groundStudy){
    this.selector('cometPattern','トラの打ち方',347,s.cometPattern);
    this.selector('cometStyle','星と尾の色',434,s.cometStyle);
    this.button('cometShow','このトラを観る',28,550,360,60,()=>this.click('cometShow'));
    this.button('cometNext','次の打ち方を観る',412,550,360,60,()=>this.click('cometNext'));
    this.button('cometSequence','短いトラの演出を観る',28,627,744,60,()=>this.click('cometSequence'));
    this.button('cometPause',s.cometPaused?'試し打ちを再開':'試し打ちを一時停止',28,704,744,54,()=>this.click('cometPause'));
    this.wrap(s.cometDescription??'',32,808,736,3);
   }else{
    this.selector('type','花火の種類',347,s.type);
    this.selector('size','玉の大きさ',451,s.size);
    if(s.palette)this.selector('palette','配色：外星 × 芯星／菊の色',555,s.palette);
    this.button('sample','この一発を試す',28,665,444,54,()=>this.click('sample'));
    this.text('選んだ玉を下の左右へ仕込めます',490,691,18,panelTheme().accent,280);
    this.button('loadLeft','左トリガーに仕込む',28,743,360,48,()=>this.click('loadLeft'));
    this.button('loadRight','右トリガーに仕込む',412,743,360,48,()=>this.click('loadRight'));
    for(const [hand,x] of [['Left',28],['Right',412]]){c.fillStyle=panelTheme().surface;c.beginPath();c.roundRect(x,805,360,86,10);c.fill();this.wrap(s['loaded'+hand]??'',x+16,826,328,2);}
    this.button('big','二尺玉の三重芯',28,918,360,48,()=>this.click('big'));
    this.button('finale','銀かむろの締め',412,918,360,48,()=>this.click('finale'));
    this.button('wideFinale','空いっぱいのかむろを見る',28,983,744,40,()=>this.click('wideFinale'));

   }
   }
  }else if(this.page===2){
   if(!s.sceneryVisible&&!s.bridge){
    this.text('花火だけの配置',32,230,30,panelTheme().accent,736);
    this.text('−／＋：微調整　 −−／＋＋：大きく調整',32,273,18,panelTheme().muted,736);
    this.range('scale','花火全体の大きさ（倍率）',316,s.scale);
    this.range('distance','中心までの距離',416,s.distance,' m');
    this.range('height','打ち上げ場所の高さ（床から）',516,s.height,' m');
    this.button('placementReset','配置を標準に戻す',28,612,744,48,()=>this.click('placementReset'));
    this.slider('roomBrightness','部屋の明るさ',712,s.roomBrightness,{compact:true});
    this.range('volume','花火の音量',816,s.volume);
    this.button('place','花火を今の前方へ',28,950,744,48,()=>this.place());
    this.button('townSceneryToggle','街を戻す',28,1104,744,48,()=>this.click('townSceneryToggle'),{quiet:true});
   }else{
   if(s.bridge){this.text(s.rooftop?'屋上の花火席 · '+(s.rooftopSeat==='panorama'?'全景の席':'近い席'):s.boat?(s.boatWaiting?'屋形船 · 他の船の通過待ち':'屋形船のデッキで鑑賞中'):'手前の橋で鑑賞中',32,280,34,panelTheme().accent);this.wrap(s.rooftop?'赤色灯の上に用意した、屋上の桟敷席。近い席は迫力、全景の席は花火の並びを楽しめます。':s.boat?'自分の足／左スティックでデッキ内を歩けます。パネル表示中も移動できます。清澄橋をくぐって往復、花火の一時停止中は停船。':'左スティックで少し歩けます。サイドパネルを出したままでも移動できます。',32,350,736,3);}else{
   this.range('scale','街の大きさ（倍率）',242,s.scale);
   this.range('distance','街までの距離',350,s.distance,' m');
   this.range('height','街の底面の高さ（床から）',458,s.height,' m');}
   if(s.rooftop){this.button('roofNear','近い席（標準）',28,450,360,64,()=>this.click('roofNear'),{selected:s.rooftopSeat==='near'});this.button('roofPanorama','全景の席',412,450,360,64,()=>this.click('roofPanorama'),{selected:s.rooftopSeat==='panorama'});}
   this.range('volume','花火の音量',566,s.volume);
   this.slider('roomBrightness','部屋の明るさ',674,s.roomBrightness,{compact:true});
   this.selector('towerColor','塔のライトアップ',785,s.towerColor);
   this.selector('panelTheme','パネルの配色',994,s.panelTheme);
   this.button('townSceneryToggle',s.sceneryVisible?'街を消す（花火だけ）':'街を戻す',28,1104,744,48,()=>this.click('townSceneryToggle'),{quiet:true,selected:!s.sceneryVisible});
   if(!s.bridge){this.button('place','街を今の前方へ',28,906,360,48,()=>this.place());
   this.button('mrPreset','小さな街を床に置く',412,906,360,48,()=>this.click('mrPreset'));}

   }
  }else{
   this.drawHelp(s);
  }

  if(this.page===4&&s.patternChoiceOpen){
   c.clearRect(12,202,776,978);c.fillStyle=panelTheme().overlay;c.fillRect(12,202,776,978);this.controls=this.controls.filter(control=>control.y<202);
   this.text('花火大会  ›  型物を入れる',32,218,22,panelTheme().muted,736);this.text('型物を入れる',32,284,34,panelTheme().text);
   this.selector('patternChoiceKind','どの型物にする？',370,s.patternChoiceKind);this.selector('patternChoiceAmount','どのくらい入れる？',500,s.patternChoiceAmount);
   this.wrap(s.patternChoiceSummary??'',32,638,736,2);
   this.button('patternChoiceApply',s.voice?.busy?'型物を入れています…':'この内容で入れる',28,738,744,72,()=>this.click('patternChoiceApply'),{primary:true,disabled:!!s.voice?.busy});
   this.wrap(s.patternChoiceStatus??'',32,864,736,5);
  }
  if(this.page===0&&!s.preparing)this.text(s.metric,32,921,21,panelTheme().muted,736);
  if(child)this.button('detailBack',this.adjusting?'大会に戻る':'花火大会に戻る',28,1188,744,48,()=>{if(s.patternChoiceOpen)this.click('patternChoiceClose');if(s.voice?.open)this.click('voiceClose');this.navigate(4);});
  else{this.button('close','パネルを閉じて鑑賞',28,1188,360,48,()=>this.close());this.button('exit','鑑賞を終了してページへ',412,1188,360,48,()=>this.exit(),{danger:true});}
  this.text(this.controllerGrabbed?'移動中 · 掴んだボタンを離すと、ここに置けます':'白い棒：トリガー／グリップで移動 · スティックで角度と奥行き',32,1255,20,panelTheme().muted,736);
  if(this.page===4&&!this.adjusting&&s.trackMenuOpen&&!this.picker){
   this.controls=[];c.fillStyle=panelTheme().overlay;c.beginPath();c.roundRect(400,337,384,238,14);c.fill();
   this.button('trackRename','曲名を変える',412,345,360,64,()=>this.click('trackRename'),{disabled:!s.trackCanRename});
   this.button('trackDelete','曲を削除する',412,421,360,64,()=>this.click('trackDelete'),{disabled:!s.trackCanRename,danger:true});
   this.button('trackMenuClose','×',412,497,360,64,()=>this.click('trackMenuToggle'));
  }
  c.restore();
  for(const control of this.controls)if(!['favoriteToggle','favoriteListOpen','detailClose'].includes(control.id))control.y+=HEADER_GROWTH;
  if(this.picker)this.drawPicker(s);
  this.texture.needsUpdate=true;
 }
}
