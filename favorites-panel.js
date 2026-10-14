import {drawPanelSurface} from './panel-surface.js';
import * as T from './vendor/three.module.js';
import {MRPanel} from './mr-panel.js';
const TOP=240,PITCH=132,ROWS=6;
export function favoriteDropIndex(y,offset,count){return Math.max(0,Math.min(count-1,offset+Math.floor((y-TOP)/PITCH)));}
export function favoriteInsertionSlot(y,offset,count){return Math.max(offset,Math.min(count,offset+ROWS,offset+Math.floor((y-TOP+PITCH/2)/PITCH)));}
export function favoriteMoveTarget(slot,source,count){return Math.max(0,Math.min(count-1,slot>source?slot-1:slot));}
export class FavoritesPanel extends MRPanel{
 constructor(options){super(options);this.offset=0;this.dragRow=null;}
 beginSlider(control,controller,ray){
  if(!control.favoriteDrag)return super.beginSlider(control,controller,ray);
  this.sliderDrag={control,controller};this.dragRow={id:control.favoriteId,source:control.index,slot:control.index,target:control.index};this.slideToRay(ray);
 }
 slideToRay(ray){
  if(!this.sliderDrag?.control.favoriteDrag)return super.slideToRay(ray);
  this.mesh.updateMatrixWorld(true);this.sliderPlane.setFromNormalAndCoplanarPoint(new T.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion),this.mesh.position);
  if(!ray.intersectPlane(this.sliderPlane,this.sliderPoint))return;
  this.mesh.worldToLocal(this.sliderPoint);const y=(.5-this.sliderPoint.y/(.68*1340/800))*1340;
  const count=this.read().rows.length;this.dragRow.slot=favoriteInsertionSlot(y,this.offset,count);this.dragRow.target=favoriteMoveTarget(this.dragRow.slot,this.dragRow.source,count);this.draw();
 }
 release(controller){
  if(this.sliderDrag?.control.favoriteDrag&&(!controller||this.sliderDrag.controller===controller)){
   const row=this.dragRow;this.sliderDrag=null;this.dragRow=null;if(row)this.choose('reorder',{id:row.id,index:row.target});
  }
  super.release(controller);
 }
 drawRename(edit){
  const c=this.ctx;c.fillStyle='#07101bf5';c.beginPath();c.roundRect(12,200,776,1120,24);c.fill();this.controls=[];
  this.text('名前を変える',36,252,36,'#ffe0a3',724);this.text('今の名前',36,311,24,'#b8c9d4');this.wrap(edit.original,36,351,724,3);
  this.wrap('カーソル付きの入力欄をMR内に表示しています。キーボードを使い、そのまま編集できます。',36,536,724,6);
  this.button('renameFocus','入力欄へ',28,810,744,78,()=>this.choose('renameFocus'),{disabled:edit.busy});
  this.button('renameCancel','戻る（名前は変えない）',28,1030,744,64,()=>this.choose('renameCancel'),{disabled:edit.busy});
 }

 draw(){
  const s=this.read(),c=this.ctx;this.controls=[];drawPanelSurface(c,800,1340,{border:'#ddc69585'});
  this.text('♥',28,49,38,'#ff587d');this.text('お気に入り・大会',78,49,38,'#f3dfb5',580);this.button('favoriteClose','閉じる',664,22,108,54,()=>this.close());
  const selected=s.rows.filter(r=>r.checked),seconds=selected.reduce((n,r)=>n+r.plan.showDuration,0)+Math.max(0,selected.length-1)*3;
  this.text(`${selected.length}曲 · 約${Math.floor(seconds/60)}分${Math.round(seconds)%60}秒`,28,112,28,'#a8f0c8');
  this.text(s.festival||'☑で選び、⠿をつまんで順番を変える',28,154,24,'#d5e3eb',744);this.wrap(s.message??'',28,192,744,1);
  this.offset=Math.max(0,Math.min(Math.max(0,s.rows.length-ROWS),this.offset));
  if(!s.rows.length)this.wrap('気に入った構成で、サイドパネル右上の♡を押してください。音源と構成が丸ごと残ります。',32,340,736,4);
  s.rows.slice(this.offset,this.offset+ROWS).forEach((row,i)=>{
   const index=this.offset+i,y=TOP+i*PITCH;
   c.fillStyle=this.dragRow?.id===row.id?'#293341':'#132536';c.beginPath();c.roundRect(20,y-4,760,122,16);c.fill();
   this.button('drag:'+row.id,'⠿',28,y,58,100,()=>{}, {disabled:s.busy});const drag=this.controls.at(-1);Object.assign(drag,{slider:!s.busy,favoriteDrag:true,favoriteId:row.id,index});
   this.button('check:'+row.id,row.checked?'☑':'☐',98,y,64,100,()=>this.choose('check',row.id),{selected:row.checked,disabled:s.busy});
   this.button('load:'+row.id,row.name,176,y,438,58,()=>this.choose('load',row.id),{disabled:s.busy});
   this.text(`${Math.floor(Math.round(row.plan.duration)/60)}:${String(Math.round(row.plan.duration)%60).padStart(2,'0')} · ${row.plan.feelingLabel??'オリジナル'}`,184,y+86,22,'#b8c9d4',420);
   this.button('menu:'+row.id,'…',628,y,140,100,()=>{this.menuId=row.id;},{disabled:s.busy});
  });
  if(this.dragRow){
   const slot=Math.max(this.offset,Math.min(this.offset+ROWS,this.dragRow.slot)),y=TOP+(slot-this.offset)*PITCH-8;
   c.fillStyle='#ff9f85';c.fillRect(20,y-3,760,6);c.beginPath();c.moveTo(20,y-11);c.lineTo(36,y);c.lineTo(20,y+11);c.closePath();c.fill();
   c.fillRect(492,y-19,278,31);this.text('ここに入れる',516,y-3,23,'#172230',240);
  }
  this.button('previous','前の一覧',28,1064,240,52,()=>{this.offset=Math.max(0,this.offset-ROWS);},{disabled:this.offset===0});
  this.text(`${s.rows.length?this.offset+1:0}–${Math.min(this.offset+ROWS,s.rows.length)} / ${s.rows.length}`,310,1090,25,'#b8c9d4');
  this.button('next','次の一覧',532,1064,240,52,()=>{this.offset=Math.min(Math.max(0,s.rows.length-ROWS),this.offset+ROWS);},{disabled:this.offset+ROWS>=s.rows.length});
  this.button('festival','この順番で大会を開演',28,1150,744,78,()=>this.click('favoritePrepare'),{primary:true,disabled:s.busy||!selected.length});
  if(s.undoId)this.button('undo','削除を元に戻す',28,1248,744,52,()=>this.choose('undo'),{disabled:s.busy});else this.text('各曲の余韻が終わってから３秒空けて次へ',32,1263,23,'#b8c9d4',736);
  if(s.rename){this.drawRename(s.rename);this.texture.needsUpdate=true;return;}
  if(this.menuId){
   const row=s.rows.find(r=>r.id===this.menuId);if(!row)this.menuId=null;else{
    c.fillStyle='#07101bf5';c.beginPath();c.roundRect(12,200,776,1120,24);c.fill();this.controls=[];this.text(row.name,40,302,32,'#ffe0a3',720);
    this.button('rename','名前を変える',40,390,720,84,()=>{const id=this.menuId;this.menuId=null;this.choose('rename',id);},{disabled:s.busy});
    this.text('文字の一部だけ選んで直せます',48,518,24,'#b8c9d4',700);
    this.button('delete','削除する',40,590,720,84,()=>{const id=this.menuId;this.menuId=null;this.choose('delete',id);},{danger:true,disabled:s.busy});
    this.button('menuBack','戻る',40,760,720,70,()=>{this.menuId=null;});
   }
  }
  this.texture.needsUpdate=true;
 }
}
