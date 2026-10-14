import * as T from './vendor/three.module.js';

const W=1024,H=420,PREFERENCE='hanabi-town-entry-tip-hidden';
export function tipCheckboxAtUV(uv){const x=uv.x*W,y=(1-uv.y)*H;return x>=28&&x<=996&&y>=312&&y<=406;}
export function shouldShowEntryTip(suppressed,returning=false){return !suppressed&&!returning;}

// One reusable canvas/plane. The checkbox uses the same ray selection route
// as the other MR panels; its preference is shared across app versions.
export class EntryTip{
 constructor(scene,{storage=globalThis.localStorage,onPreferenceChanged=()=>{}}={}){
  Object.assign(this,{storage,onPreferenceChanged});this.suppressed=false;this.preferenceError=false;
  try{this.suppressed=storage?.getItem(PREFERENCE)==='1';}catch{}
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=H;this.ctx=this.surface.getContext('2d');
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.66,.66*H/W),new T.MeshBasicMaterial({map:this.texture,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:T.FrontSide}));
  this.mesh.visible=false;this.mesh.renderOrder=950;scene.add(this.mesh);this.started=null;
  // XRControls expects a non-interactive secondary target for each panel.
  this.bar=new T.Object3D();this.raycaster=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.pointer=new T.Vector2();this.draw();
 }
 draw(){
  const c=this.ctx;c.clearRect(0,0,W,H);c.fillStyle='#101f2ee8';c.beginPath();c.roundRect(2,2,1020,H-4,26);c.fill();c.strokeStyle='#e8c98788';c.lineWidth=3;c.stroke();
  c.textBaseline='middle';c.font='34px system-ui,sans-serif';c.fillStyle='#ffe0a3';c.fillText('まずは、街を好きな場所へ。',42,65);
  c.font='32px system-ui,sans-serif';c.fillStyle='#e8f1f7';c.fillText('台座へビーム＋グリップで、掴んで移動',42,132);
  c.fillText('掴んだまま、スティックを倒すと',42,192);
  c.fillStyle='#ffe0a3';c.fillText('左右：街を回す　／　上下：大きさを変える',42,256);
  c.fillStyle='#1c3544';c.beginPath();c.roundRect(28,312,968,94,12);c.fill();
  c.lineWidth=3;c.strokeStyle='#ffdfa1';c.strokeRect(46,338,38,38);
  if(this.suppressed){c.strokeStyle='#a8f0c8';c.beginPath();c.moveTo(52,356);c.lineTo(62,366);c.lineTo(80,345);c.stroke();}
  c.fillStyle=this.preferenceError?'#ffad9f':'#e8f1f7';c.fillText(this.preferenceError?'設定を保存できませんでした':'次回から表示しない',108,357);
  this.texture.needsUpdate=true;
 }
 setSuppressed(hidden){
  try{if(!this.storage)throw Error('storage unavailable');this.storage.setItem(PREFERENCE,hidden?'1':'0');this.suppressed=!!hidden;this.preferenceError=false;}
  catch{this.preferenceError=true;this.draw();this.onPreferenceChanged(this.suppressed,false);return false;}
  this.draw();this.onPreferenceChanged(this.suppressed,true);return true;
 }
 activateUV(uv){if(!this.mesh.visible||!tipCheckboxAtUV(uv))return false;this.setSuppressed(!this.suppressed);return true;}
 select(controller){
  if(!this.mesh.visible)return false;controller.updateWorldMatrix(true,false);this.mesh.updateWorldMatrix(true,false);
  this.origin.setFromMatrixPosition(controller.matrixWorld);this.direction.set(0,0,-1).transformDirection(controller.matrixWorld);this.raycaster.set(this.origin,this.direction);
  const hit=this.raycaster.intersectObject(this.mesh,false)[0];return !!hit&&this.activateUV(hit.uv);
 }
 previewPointer(x,y,camera,activate=false){
  if(!this.mesh.visible)return false;this.mesh.updateWorldMatrix(true,false);this.pointer.set(x,y);this.raycaster.setFromCamera(this.pointer,camera);const hit=this.raycaster.intersectObject(this.mesh,false)[0];if(!hit)return false;if(activate)this.activateUV(hit.uv);return true;
 }
 begin(transform,stamp,{returning=false}={}){
  this.end();if(!shouldShowEntryTip(this.suppressed,returning))return false;
  const p=transform.position,m=transform.matrix;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  this.mesh.position.set(p.x+x*1.05+z*.40,p.y-.16,p.z+z*1.05-x*.40);this.mesh.lookAt(p.x,p.y,p.z);this.started=stamp;this.update(stamp);return true;
 }
 update(stamp,visible=true){
  if(this.started===null)return;const age=(stamp-this.started)/1000;
  if(age>=15){this.end();return;}
  this.mesh.material.opacity=.96*Math.max(0,Math.min(1,age/.45,(15-age)/1.5));this.mesh.visible=visible&&this.mesh.material.opacity>0;
 }
 end(){this.started=null;this.mesh.visible=false;this.mesh.material.opacity=0;}
}
