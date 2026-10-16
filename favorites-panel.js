import {panelTheme,panelThemeId,panelFont,panelGradient} from './panel-theme.js';
import {drawPanelSurface} from './panel-surface.js';
import * as T from './vendor/three.module.js';
import {MRPanel} from './mr-panel.js';
const TOP=240,PITCH=132,ROWS=6;
export function favoriteDropIndex(y,offset,count){return Math.max(0,Math.min(count-1,offset+Math.floor((y-TOP)/PITCH)));}
export function favoriteInsertionSlot(y,offset,count){return Math.max(offset,Math.min(count,offset+ROWS,offset+Math.floor((y-TOP+PITCH/2)/PITCH)));}
export function favoriteMoveTarget(slot,source,count){return Math.max(0,Math.min(count-1,slot>source?slot-1:slot));}
export class FavoritesPanel extends MRPanel{
 constructor(options){super(options);this.offset=0;this.setlistOffset=0;this.listMode='favorites';this.dragRow=null;}
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
  const c=this.ctx;c.fillStyle=panelTheme().overlay;c.beginPath();c.roundRect(12,200,776,1120,24);c.fill();this.controls=[];
  this.text('名前を変える',36,252,36,panelTheme().accent,724);this.text('今の名前',36,311,24,panelTheme().muted);this.wrap(edit.original,36,351,724,3);
  this.wrap('カーソル付きの入力欄をMR内に表示しています。キーボードを使い、そのまま編集できます。',36,536,724,6);
  this.button('renameFocus','入力欄へ',28,810,744,78,()=>this.choose('renameFocus'),{disabled:edit.busy});
  this.button('renameCancel','戻る（名前は変えない）',28,1030,744,64,()=>this.choose('renameCancel'),{disabled:edit.busy});
 }

 draw(){
  const s=this.read(),c=this.ctx;this.controls=[];drawPanelSurface(c,800,1340,{border:'#ddc69585'});
  this.text('お気に入り',32,47,41,panelTheme().text,600);this.text('好きな一曲を、自分の大会に。',32,91,21,panelTheme().muted);this.button('favoriteClose','×',696,18,76,60,()=>this.close());
  const selected=s.rows.filter(r=>r.checked),seconds=selected.reduce((n,r)=>n+r.plan.showDuration,0)+Math.max(0,selected.length-1)*3;
  const sets=this.listMode==='setlists',rows=sets?s.setlists??[]:s.rows,key=sets?'setlistOffset':'offset';
  this.button('favoriteTab','♥の曲を選ぶ',28,124,360,54,()=>{this.listMode='favorites';this.menuId=null;},{selected:!sets});
  this.button('setlistTab','セットリスト',412,124,360,54,()=>{this.listMode='setlists';this.menuId=null;},{selected:sets});
  this.text(sets?rows.length+'件のセットリスト':`${selected.length}曲 · 約${Math.floor(seconds/60)}分${Math.round(seconds)%60}秒`,28,207,23,panelTheme().accent);
  this.wrap(s.message||(sets?'名前を押すと、その曲順・花火で大会を準備':s.festival||'▶で１曲再生・Ⅱで一時停止、☑で選ぶ'),350,207,422,1);
  this[key]=Math.max(0,Math.min(Math.max(0,rows.length-ROWS),this[key]));
  if(!rows.length)this.wrap(sets?'♥の曲を選んで並べ、「このセットリストを保存する」を押してください。':'気に入った構成で、サイドパネル右上の♡を押してください。音源と構成が丸ごと残ります。',32,340,736,4);
  rows.slice(this[key],this[key]+ROWS).forEach((row,i)=>{
   const index=this[key]+i,y=TOP+i*PITCH,active=!sets&&s.playback?.id===row.id,playing=active&&s.playback.running,paused=active&&s.playback.active&&!s.playback.completed&&!playing;
   c.fillStyle=this.dragRow?.id===row.id?panelTheme().hover:!sets&&row.checked?panelGradient(c,20,y,760,0,panelTheme().selectedCard):panelTheme().surface;c.beginPath();c.roundRect(20,y-4,760,122,16);c.fill();c.strokeStyle=!sets&&row.checked?panelTheme().selectedLine:panelTheme().line;if(playing||paused)c.strokeStyle=panelTheme().accent;c.lineWidth=playing||paused?3:1;c.stroke();
   if(sets){
    this.button('setlistLoad:'+row.id,row.name,28,y,586,58,()=>this.choose('setlistLoad',row.id),{disabled:s.busy});
    this.text(row.entries.length+'曲 · 約'+Math.floor(row.duration/60)+'分'+Math.round(row.duration)%60+'秒',40,y+86,22,panelTheme().muted,560);
    this.button('setlistMenu:'+row.id,'…',628,y,140,100,()=>{this.menuId=row.id;},{disabled:s.busy,quiet:true});return;
   }
   this.button('drag:'+row.id,'⠿',28,y,58,100,()=>{}, {disabled:s.busy});const drag=this.controls.at(-1);Object.assign(drag,{slider:!s.busy,favoriteDrag:true,favoriteId:row.id,index});
   this.button('check:'+row.id,row.checked?'☑':'☐',98,y,64,100,()=>this.choose('check',row.id),{selected:row.checked,disabled:s.busy});
   this.button('play:'+row.id,playing?'Ⅱ':'▶',176,y,68,100,()=>this.choose('play',row.id),{disabled:s.busy,selected:playing});
   this.button('load:'+row.id,row.name,254,y,360,58,()=>this.choose('load',row.id),{disabled:s.busy,quiet:true});
   this.text(`${playing?'再生中 · ':paused?'一時停止中 · ':active&&s.playback.completed?'再生終了 · ':''}${Math.floor(Math.round(row.plan.duration)/60)}:${String(Math.round(row.plan.duration)%60).padStart(2,'0')} · ${row.plan.feelingLabel??'オリジナル'}`,262,y+86,22,panelTheme().muted,352);
   this.button('menu:'+row.id,'…',628,y,140,100,()=>{this.menuId=row.id;},{disabled:s.busy,quiet:true});
  });
  if(this.dragRow){
   const slot=Math.max(this.offset,Math.min(this.offset+ROWS,this.dragRow.slot)),y=TOP+(slot-this.offset)*PITCH-8;
   c.fillStyle=panelTheme().accent;c.fillRect(20,y-3,760,6);c.beginPath();c.moveTo(20,y-11);c.lineTo(36,y);c.lineTo(20,y+11);c.closePath();c.fill();
   c.fillRect(492,y-19,278,31);this.text('ここに入れる',516,y-3,23,panelTheme().primaryInk,240);
  }
  this.button('previous','前の一覧',28,1064,240,52,()=>{this[key]=Math.max(0,this[key]-ROWS);},{disabled:this[key]===0});
  this.text(`${rows.length?this[key]+1:0}–${Math.min(this[key]+ROWS,rows.length)} / ${rows.length}`,310,1090,25,panelTheme().muted);
  this.button('next','次の一覧',532,1064,240,52,()=>{this[key]=Math.min(Math.max(0,rows.length-ROWS),this[key]+ROWS);},{disabled:this[key]+ROWS>=rows.length});
  if(sets)this.button('setlistCreate','♥の曲を選んで新しく作る',28,1132,744,62,()=>{this.listMode='favorites';});
  else{
   this.button('setlistSave','このセットリストを保存する',28,1132,744,62,()=>this.click('setlistSave'),{disabled:s.busy||!selected.length});
   this.button('festival','この順番で大会を開演',28,1208,744,62,()=>this.click('favoritePrepare'),{primary:true,disabled:s.busy||!selected.length});
  }
  if(sets?s.setlistUndoId:s.undoId)this.button('undo','削除を元に戻す',28,1284,744,42,()=>this.choose(sets?'setlistUndo':'undo'),{disabled:s.busy});else this.text('各曲の余韻が終わってから３秒空けて次へ',32,1310,23,panelTheme().muted,736);
  if(s.rename){this.drawRename(s.rename);this.texture.needsUpdate=true;return;}
  if(this.menuId){
   const row=rows.find(r=>r.id===this.menuId);if(!row)this.menuId=null;else{
    c.fillStyle=panelTheme().overlay;c.beginPath();c.roundRect(12,200,776,1120,24);c.fill();this.controls=[];this.text(row.name,40,302,32,panelTheme().accent,720);
    this.button('rename','名前を変える',40,390,720,84,()=>{const id=this.menuId;this.menuId=null;this.choose(sets?'setlistRename':'rename',id);},{disabled:s.busy});
    this.text('文字の一部だけ選んで直せます',48,518,24,panelTheme().muted,700);
    this.button('delete','削除する',40,590,720,84,()=>{const id=this.menuId;this.menuId=null;this.choose(sets?'setlistDelete':'delete',id);},{danger:true,disabled:s.busy});
    this.button('menuBack','戻る',40,760,720,70,()=>{this.menuId=null;});
   }
  }
  this.texture.needsUpdate=true;
 }
}
