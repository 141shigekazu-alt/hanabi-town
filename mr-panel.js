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
 constructor({scene,read,click,cycle,adjust,place,exit,set=()=>{},pageChanged=()=>{},prepareChoose=()=>{},prepareTab=()=>{}}){
  Object.assign(this,{scene,read,click,cycle,adjust,place,exit,set,pageChanged,prepareChoose,prepareTab});
  this.page=0;this.controls=[];this.controllers=[];this.edges=new WeakMap();this.hover='';this.lastDraw=0;this.active=false;
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=H;this.ctx=this.surface.getContext('2d');
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.68,.68*H/W),new T.MeshBasicMaterial({map:this.texture,transparent:true,depthTest:false,depthWrite:false,side:T.FrontSide}));
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
 get visible(){return this.mesh.visible;}
 attach(controller){
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]);
  const beam=new T.Line(geometry,new T.LineBasicMaterial({color:0xddc695,transparent:true,opacity:.75,depthTest:false,depthWrite:false}));beam.renderOrder=1001;beam.visible=false;controller.add(beam);
  const entry={controller,beam,source:null};this.controllers.push(entry);
  controller.addEventListener('connected',e=>{entry.source=e.data;});
  controller.addEventListener('disconnected',()=>{this.release(controller);if(entry.source)this.edges.delete(entry.source);entry.source=null;beam.visible=false;});
  controller.addEventListener('selectend',()=>this.release(controller));

 }
 openAt(transform,{side=.38,distance=1.05,drop=.08}={}){
  if(!transform)return;this.lastTransform=transform;
  const m=transform.matrix,p=transform.position;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);
  if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  this.mesh.position.set(p.x+x*distance-z*side,p.y-drop,p.z+z*distance+x*side);
  this.release();this.moved=false;this.yawOffset=0;this.mesh.lookAt(p.x,this.mesh.position.y,p.z);this.mesh.visible=true;this.mesh.updateMatrixWorld(true);this.hover='';this.draw();
 }
 begin(transform){this.active=true;this.preview=false;this.edges=new WeakMap();this.page=0;this.openAt(transform);}
 end(){this.active=false;this.close();this.edges=new WeakMap();}
 close(){this.release();this.mesh.visible=false;this.cursor.visible=false;this.hover='';for(const e of this.controllers)e.beam.visible=false;}
 toggle(){if(this.visible)this.close();else if(this.moved){this.mesh.visible=true;this.draw();}else this.openAt(this.lastTransform);}
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
  this.anchor.copy(this.grab.localAnchor).applyQuaternion(this.mesh.quaternion);
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
  this.set(c.id,Math.max(0,Math.min(1,(x-c.trackX)/c.trackW)));this.hover=c.id;this.draw();
 }
 release(controller){
  if(this.sliderDrag&&(!controller||this.sliderDrag.controller===controller)){
   const id=this.sliderDrag.control.id;this.sliderDrag=null;this.set(id,this.read()[id].value,true);this.hover='';
  }
  if(!this.grab||(controller&&this.grab.controller!==controller))return;this.grab=null;this.hover='';this.bar.material.color.setHex(0xf2f5f8);
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
  }
  this.cursor.visible=!!nearest;if(nearest)this.cursor.position.copy(nearest.point);
  const hover=this.controllerGrabbed?'grab':this.sliderDrag?this.sliderDrag.control.id:this.grab||nearest?.object===this.grabTarget?'grab':nearest?controlAtUV(this.controls,nearest.uv)?.id??'':'';
  this.bar.material.color.setHex(hover==='grab'?0xffdfa1:0xf2f5f8);
  if(hover!==this.hover||stamp-this.lastDraw>250){this.hover=hover;this.draw();this.lastDraw=stamp;}
 }
 previewPointer(x,y,camera,activate=false){
  if(!this.preview||!this.visible)return false;
  this.pointer.set(x,y);camera.updateMatrixWorld();this.mesh.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,camera);
  if(this.grab&&!activate){this.moveGrab(this.raycaster.ray);return true;}
  if(this.sliderDrag&&!activate){this.slideToRay(this.raycaster.ray);return true;}
  const hit=this.raycaster.intersectObjects([this.mesh,this.grabTarget],false)[0],control=hit?.object===this.mesh?controlAtUV(this.controls,hit.uv):null;
  const hover=hit?.object===this.grabTarget?'grab':control?.id??'';this.bar.material.color.setHex(hover==='grab'?0xffdfa1:0xf2f5f8);
  if(this.hover!==hover){this.hover=hover;this.draw();}
  if(activate){if(this.grab||this.sliderDrag)return true;if(hit?.object===this.grabTarget)this.beginGrab(hit);else if(control?.slider)this.beginSlider(control,null,this.raycaster.ray);else this.fire(control);}return true;
 }
 text(label,x,y,size=25,color='#dce7ef',maxWidth){
  const c=this.ctx;c.font=`${size}px system-ui,sans-serif`;c.fillStyle=color;c.textBaseline='middle';
  if(maxWidth){while(c.measureText(label).width>maxWidth&&size>17){size--;c.font=`${size}px system-ui,sans-serif`;}}
  c.fillText(label,x,y);
 }
 button(id,label,x,y,w,h,action,{selected=false,danger=false}={}){
  const c=this.ctx,hover=this.hover===id;c.fillStyle=hover?'#405265':selected?'#4d4634':danger?'#34242c':'#182b3b';
  c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.strokeStyle=hover?'#ffe1a6':selected?'#ddc695':'#31495b';c.lineWidth=hover?3:1;c.stroke();
  const oldAlign=c.textAlign;c.textAlign='center';this.text(label,x+w/2,y+h/2,25,danger?'#f5c6c0':'#e7eef3',w-22);c.textAlign=oldAlign;
  this.controls.push({id,x,y,w,h,action});
 }
 selector(id,label,y,state){
  this.text(label,32,y,23,'#aabecb');
  this.button(id+'-','‹',28,y+24,70,60,()=>this.cycle(id,-1));
  this.button(id,state.selected,110,y+24,580,60,()=>this.cycle(id,1));
  this.button(id+'+','›',702,y+24,70,60,()=>this.cycle(id,1));
 }
 range(id,label,y,state,unit=''){
  this.text(label,32,y,23,'#aabecb');
  this.button(id+'-','−',28,y+24,92,60,()=>this.adjust(id,-1));
  const value=id==='volume'?Math.round(state.value*100)+'%':state.value.toFixed(2)+unit;
  this.text(value,350,y+54,30,'#ffe0a3');
  this.button(id+'+','＋',680,y+24,92,60,()=>this.adjust(id,1));
 }
 slider(id,label,y,state){
  const c=this.ctx,value=Math.max(0,Math.min(1,state.value)),trackX=60,trackW=680;
  this.text(label,32,y,28,'#e0eaf0');this.text(Math.round(value*100)+'%',660,y,32,'#ffe0a3');
  c.fillStyle='#3b5264';c.beginPath();c.roundRect(trackX,y+54,trackW,12,6);c.fill();
  c.fillStyle='#ddc695';c.beginPath();c.roundRect(trackX,y+54,Math.max(1,value*trackW),12,6);c.fill();
  c.fillStyle=this.hover===id?'#fff0cf':'#e7d1a5';c.beginPath();c.arc(trackX+value*trackW,y+60,21,0,Math.PI*2);c.fill();
  this.controls.push({id,x:28,y:y+27,w:744,h:70,slider:true,trackX,trackW});
  this.text('暗い',32,y+115,23,'#aabecb');this.text('明るい',687,y+115,23,'#aabecb');
 }
 wrap(text,x,y,maxWidth,lines=3){
  const c=this.ctx;c.font='23px system-ui,sans-serif';let line='',row=0;
  for(const char of text){if(c.measureText(line+char).width>maxWidth){this.text(line,x,y+row*34,23,'#aebfc9');row++;line='';if(row>=lines)return;}line+=char;}
  if(line)this.text(line,x,y+row*34,23,'#aebfc9');
 }
 drawPreparation(s){
  const p=s.preparing,hand=p.hand==='left'?'左':'右',fields=['kind','size','palette'];
  this.text(hand+'トリガーに仕込む',32,258,34,'#ffe0a3');
  ['種類','大きさ','配色'].forEach((label,i)=>this.button('prepareTab'+i,label,28+i*254,304,236,54,()=>this.prepareTab(i),{selected:p.tab===i}));
  s.prepareOptions.forEach((o,i)=>{const x=28+(i%2)*384,y=390+Math.floor(i/2)*66;
   if(o.disabled){this.text(o.label+'（対象外）',x+20,y+27,23,'#657986');return;}
   this.button('prepareChoice'+i,o.label,x,y,360,54,()=>this.prepareChoose(o.value),{selected:String(p.draft[fields[p.tab]])===o.value});
  });
  this.text(s.preparing.summary,32,786,25,'#ffe0a3',736);
  this.text(s.loadedLeft?'左：'+s.loadedLeft:'',32,824,20,'#b8c9d4',736);this.text('右：'+s.loadedRight,32,854,20,'#b8c9d4',736);
  this.button('prepareConfirm','この玉を'+hand+'に仕込む',28,886,744,60,()=>this.click('prepareConfirm'));
  this.button('prepareCancel','戻る（変更しない）',28,958,744,48,()=>this.click('prepareCancel'));
 }
 draw(){
  const s=this.read(),c=this.ctx;this.controls=[];c.clearRect(0,0,W,H);c.fillStyle='#0d1722';c.fillRect(0,0,W,H);
  c.strokeStyle='#587084';c.lineWidth=3;c.strokeRect(1.5,1.5,W-3,H-3);
  this.text('花火街  ·  サイドパネル',32,44,34,'#f3dfb5');
  this.button('recenter','位置を戻す',608,24,164,46,()=>this.openAt(this.lastTransform));
  this.text('右A：サイドパネル · 左X：クルッとパネル',32,88,23,'#acbdc9');
  this.text(s.chapter,32,130,42,'#dde8ef',736);
  this.text(s.last,32,182,42,'#ffe0a3',736);
  c.save();c.translate(0,HEADER_GROWTH);
  c.fillStyle='#132536';c.beginPath();c.roundRect(20,152,760,76,14);c.fill();
  ['花火大会','試し打ち','街・音','使い方'].forEach((label,i)=>{this.button('page'+i,label,28+i*190,160,174,54,()=>{if(this.page!==i){this.page=i;this.pageChanged(i);}},{selected:this.page===i});if(this.page===i){c.fillStyle='#ffe0a3';c.fillRect(48+i*190,211,134,4);}});
  if(s.preparing){this.drawPreparation(s);}
  else if(this.page===0){
   this.button('play',s.running?'ひと休み':s.resumeShow?'大会を再開':'花火大会を観る',28,238,744,64,()=>this.click('play'),{selected:!s.running});
   if(s.awaitingShow){
    this.text('街の台座へビーム＋グリップで掴んで移動',32,335,24,'#c5d5df',736);
    this.text('掴んだままスティック：左右で回転・上下で大きさ',32,374,23,'#aebfce',736);
   }else{
   this.button('stop','大会を止める',28,318,360,60,()=>this.click('stop'));
   this.button('restart','大会を最初から',412,318,360,60,()=>this.click('restart'));}
   this.selector('program','大会プログラム',409,s.program);
   this.selector('mood','大会の雰囲気',525,s.mood);
   this.selector('ending','大会の終わり',641,s.ending);
   this.button('loadLeft','左トリガーに仕込む',28,770,360,48,()=>this.click('loadLeft'));this.button('loadRight','右トリガーに仕込む',412,770,360,48,()=>this.click('loadRight'));
   this.text('左：'+s.loadedLeft+' ／ 右：'+s.loadedRight,32,836,20,'#ffe0a3',736);
   this.button('reset','設定と視点を初期状態に戻す',28,860,744,42,()=>this.click('reset'));
  }else if(this.page===1){
   this.selector('type','花火の種類',247,s.type);
   this.selector('size','玉の大きさ',344,s.size);
   if(s.palette)this.selector('palette','配色：外星 × 芯星／菊の色',441,s.palette);
   this.button('sample','この一発を試す',28,539,444,64,()=>this.click('sample'));
   this.text('トリガーは仕込み玉',490,571,23,'#ffe0a3');
   this.button('loadLeft','左トリガーに仕込む',28,617,360,48,()=>this.click('loadLeft'));
   this.button('loadRight','右トリガーに仕込む',412,617,360,48,()=>this.click('loadRight'));
   this.text('左：'+s.loadedLeft,32,686,20,'#b8c9d4',736);this.text('右：'+s.loadedRight,32,716,20,'#b8c9d4',736);
   this.button('fans','足元の扇・クロス',28,755,360,48,()=>this.click('fans'));
   this.button('starmine',s.program.value==='random'?'おまかせの連続打ち':'スターマイン',412,755,360,48,()=>this.click('starmine'));
   this.button('big','二尺玉の三重芯',28,816,360,48,()=>this.click('big'));
   this.button('finale','銀かむろの締め',412,816,360,48,()=>this.click('finale'));
   this.button('wideFinale','空いっぱいのかむろを見る',28,877,744,48,()=>this.click('wideFinale'));
   this.text('空へ向けてトリガーで一発 · グリップで掴む',32,950,21,'#aebfc9');
  }else if(this.page===2){
   if(s.bridge){this.text('手前の橋に座って鑑賞中',32,280,34,'#ffe0a3');this.wrap('花火は頭上に、川面は眼下に。座ったまま、顔を向けて街を見回せます。',32,350,736,3);}else{
   this.range('scale','街の大きさ（倍率）',242,s.scale);
   this.range('distance','街までの距離',350,s.distance,' m');
   this.range('height','街の底面の高さ（床から）',458,s.height,' m');}
   this.range('volume','音量',566,s.volume);
   this.selector('audioMode','音の種類',674,s.audioMode);
   this.selector('towerColor','塔のライトアップ',785,s.towerColor);
   if(!s.bridge){this.button('place','街を今の前方へ',28,906,360,48,()=>this.place());
   this.button('mrPreset','小さな街を床に置く',412,906,360,48,()=>this.click('mrPreset'));}
  }else{
   this.text('街を眺めてから、開演。',32,255,30,'#ffe0a3');
   this.wrap('「花火大会を観る」で始まります。左X：クルッとパネル、右A：サイドパネル、右B：一時停止・再開。',32,313,736,3);
   this.text('街を掴む・動かす',32,438,28,'#ffe0a3');
   this.wrap('台座へビーム＋左右どちらかのグリップ。押したまま、左右・前後へ動かし、離して置きます。',32,485,736,2);
   this.wrap('掴んだままスティックを倒すと、左右で街を回し、上下で大きさを変えます。街の高さはそのまま。',32,570,736,2);
   this.text('パネルを動かす',32,658,28,'#ffe0a3');
   this.wrap('白い棒へビーム＋グリップで移動。掴んだままスティック左右で角度、上下で手前・奥を調整。',32,702,736,2);
   this.text('自分で一発、上げる',32,794,28,'#ffe0a3');
   this.wrap('左／右トリガーに玉を仕込み、街へ向けてトリガーで一発。火の点が飛び、着地点から上がります。パネルへ向けるとボタン選択です。',32,838,736,3);
  }

  if(this.page===0&&!s.preparing)this.text(s.metric,32,921,21,'#8caabb',736);
  if(!s.preparing&&s.bridge)this.wrap('橋の上では、部屋を隠して夜空を見渡せます。元の街へ戻るには下のボタンを押してください。',32,990,736,3);else if(!s.preparing)this.slider('roomBrightness','部屋の明るさ',980,s.roomBrightness??{value:1});
  this.button('bridge',s.bridge?'ミニチュアに戻る':'街に入る · 手前の橋',28,1116,744,44,()=>this.click('bridge'),{selected:s.bridge});
  this.button('close','パネルを閉じて鑑賞',28,1170,360,62,()=>this.close());
  this.button('exit','鑑賞を終了してページへ',412,1170,360,62,()=>this.exit(),{danger:true});
  this.text(this.controllerGrabbed?'移動中 · グリップを離すと、ここに置けます':'白い棒へビーム＋グリップ · スティックで角度と奥行き',32,1255,20,'#b8c9d4',736);
  c.restore();
  for(const control of this.controls)if(control.id!=='recenter')control.y+=HEADER_GROWTH;
  this.texture.needsUpdate=true;
 }
}
