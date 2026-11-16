import {pointerAim,alignPointerBeam} from './hand-pointer-aim.js';
import {t,localizeCanvas} from './i18n.js';
import {drawPanelSurface} from './panel-surface.js?v=1.3.37';
import {panelTheme,panelThemeId,panelFont,panelGradient} from './panel-theme.js?v=1.3.37';
import * as T from './vendor/three.module.js';

const W=1024,H=460,PREFERENCE='hanabi-town-entry-tip-hidden';
export function tipCheckboxAtUV(uv){const x=uv.x*W,y=(1-uv.y)*H;return x>=28&&x<=688&&y>=344&&y<=438;}
export function tipCloseAtUV(uv){const x=uv.x*W,y=(1-uv.y)*H;return x>=708&&x<=996&&y>=344&&y<=438;}
export function entryInputMode(sources,previous='hands'){const inputs=Array.from(sources??[]);return inputs.some(s=>s.hand)?'hands':inputs.some(s=>s.gamepad&&!s.hand)?'controllers':previous;}
export function shouldShowEntryTip(suppressed,returning=false){return !suppressed&&!returning;}

// One reusable canvas/plane. The checkbox uses the same ray selection route
// as the other MR panels; its preference is shared across app versions.
export class EntryTip{
 constructor(scene,{storage=globalThis.localStorage,onPreferenceChanged=()=>{}}={}){
  Object.assign(this,{storage,onPreferenceChanged});this.suppressed=false;this.preferenceError=false;this.inputMode='hands';
  try{this.suppressed=storage?.getItem(PREFERENCE)==='1';}catch{}
  this.surface=document.createElement('canvas');this.surface.width=W;this.surface.height=H;this.ctx=this.surface.getContext('2d');localizeCanvas(this.ctx,()=>this.draw());
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.66,.66*H/W),new T.MeshBasicMaterial({map:this.texture,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:T.FrontSide}));
  this.mesh.visible=false;this.mesh.renderOrder=950;scene.add(this.mesh);this.started=null;
  // XRControls expects a non-interactive secondary target for each panel.
  this.bar=new T.Object3D();this.raycaster=new T.Raycaster();this.origin=new T.Vector3();this.direction=new T.Vector3();this.pointer=new T.Vector2();this.draw();
 }
 setInputMode(mode){if(mode&&mode!==this.inputMode){this.inputMode=mode;this.draw();}}
 draw(){
  const c=this.ctx;drawPanelSurface(c,W,H,{radius:26});c.textBaseline='middle';
  const text=(label,y,size=31,color=panelTheme().text)=>{c.font=panelFont(size);c.fillStyle=color;c.fillText(label,42,y,940);};
  if(this.inputMode==='hands'){
   text('手だけで楽しむ花火街',52,34,panelTheme().accent);
   text('右の手のひらを上へ：コントロールパネル',112);
   text('左の手のひらを上へ：ビューパネル',168);
   text('ボタンを指して、親指と人差し指をつまむ',224);
   text('親指＋中指で街を掴む（人差し指は伸ばす）',286,27,panelTheme().muted);
  }else{
   text('まずは、街を好きな場所へ。',52,34,panelTheme().accent);
   text('台座へビーム＋グリップで、掴んで移動',112);
   text('掴んだまま、スティックを倒すと',168);
   text('左右：街を回す　／　上下：大きさを変える',224);
   text('右A：コントロールパネル · 左X：ビューパネル',286,27,panelTheme().muted);
  }
  c.fillStyle=panelTheme().surface;c.beginPath();c.roundRect(28,344,660,94,12);c.fill();
  c.lineWidth=3;c.strokeStyle='#ffdfa1';c.strokeRect(46,371,38,38);
  if(this.suppressed){c.strokeStyle='#a8f0c8';c.beginPath();c.moveTo(52,389);c.lineTo(62,399);c.lineTo(80,378);c.stroke();}
  c.font=panelFont(29);c.fillStyle=this.preferenceError?'#ffad9f':panelTheme().text;c.fillText(this.preferenceError?'設定を保存できませんでした':'次回から表示しない',108,391,556);
  c.fillStyle=panelTheme().selected;c.beginPath();c.roundRect(708,344,288,94,12);c.fill();c.textAlign='center';c.fillStyle=panelTheme().text;c.fillText('閉じる',852,391,256);c.textAlign='left';
  this.texture.needsUpdate=true;
 }

 setSuppressed(hidden){
  try{if(!this.storage)throw Error('storage unavailable');this.storage.setItem(PREFERENCE,hidden?'1':'0');this.suppressed=!!hidden;this.preferenceError=false;}
  catch{this.preferenceError=true;this.draw();this.onPreferenceChanged(this.suppressed,false);return false;}
  this.draw();this.onPreferenceChanged(this.suppressed,true);return true;
 }
 activateUV(uv){if(!this.mesh.visible)return false;if(tipCloseAtUV(uv)){this.end();return true;}if(!tipCheckboxAtUV(uv))return false;this.setSuppressed(!this.suppressed);return true;}
 select(controller){
  if(!this.mesh.visible)return false;controller.updateWorldMatrix(true,false);this.mesh.updateWorldMatrix(true,false);
  this.origin.setFromMatrixPosition(controller.matrixWorld);pointerAim(controller,this.direction);this.raycaster.set(this.origin,this.direction);
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
  if(age>=10){this.end();return;}
  this.mesh.material.opacity=.96*Math.max(0,Math.min(1,age/.45,(10-age)/1.0));this.mesh.visible=visible&&this.mesh.material.opacity>0;
 }
 end(){this.started=null;this.mesh.visible=false;this.mesh.material.opacity=0;}
}
