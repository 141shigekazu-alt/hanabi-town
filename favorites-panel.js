import {favoriteDisplay} from './favorite-programmes.js';
import {panelTheme,panelThemeId,panelFont,panelGradient} from './panel-theme.js?v=1.3.18';
import {drawPanelSurface} from './panel-surface.js?v=1.3.15';
import * as T from './vendor/three.module.js';
import {MRPanel} from './mr-panel.js?v=1.3.18';
const TOP=240,PITCH=132,ROWS=6,BOTTOM=TOP+ROWS*PITCH;
export function favoriteDropIndex(y,offset,count){return Math.max(0,Math.min(count-1,offset+Math.floor((y-TOP)/PITCH)));}
export function favoriteInsertionSlot(y,offset,count){return Math.max(offset,Math.min(count,offset+ROWS,offset+Math.floor((y-TOP+PITCH/2)/PITCH)));}
export function favoriteMoveTarget(slot,source,count){return Math.max(0,Math.min(count-1,slot>source?slot-1:slot));}
export class FavoritesPanel extends MRPanel{
 constructor(options){super(options);this.offset=0;this.setlistOffset=0;this.listMode='favorites';this.dragRow=null;this.listScroll=0;this.setlistScroll=0;this.editScroll=0;}
 contentScrollArea(){
  const state=this.read();if(this.menuId||state.rename||state.busy)return null;
  return {key:state.setlistEdit?'edit:'+state.setlistEdit.token:this.listMode,x:18,y:TOP,w:756,h:BOTTOM-TOP,scroll:delta=>this.scrollList(delta)};
 }
 beginSlider(control,controller,ray){
  if(control.favoriteScroll){this.sliderDrag={control,controller};this.slideToRay(ray);return;}
  if(!control.favoriteDrag)return super.beginSlider(control,controller,ray);
  this.sliderDrag={control,controller};this.dragRow={id:control.favoriteId,editing:!!control.setlistEntryDrag,source:control.index,slot:control.index,target:control.index};this.slideToRay(ray);
 }
 slideToRay(ray){
  if(!this.sliderDrag?.control.favoriteDrag&&!this.sliderDrag?.control.favoriteScroll)return super.slideToRay(ray);
  this.mesh.updateMatrixWorld(true);this.sliderPlane.setFromNormalAndCoplanarPoint(new T.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion),this.mesh.position);
  if(!ray.intersectPlane(this.sliderPlane,this.sliderPoint))return;
  this.mesh.worldToLocal(this.sliderPoint);const y=(.5-this.sliderPoint.y/(.68*1340/800))*1340;
  if(this.sliderDrag.control.favoriteScroll){const h=ROWS*PITCH;this.scrollTo((y-TOP)/h);return;}
  if(y<TOP+28)this.scrollList(-18);else if(y>BOTTOM-28)this.scrollList(18);
  const edit=this.read().setlistEdit,count=edit?edit.items.length:this.read().rows.length,scroll=edit?this.editScroll:this.listScroll,offset=Math.floor(scroll/PITCH);this.dragRow.slot=favoriteInsertionSlot(y+(scroll%PITCH),offset,count);this.dragRow.target=favoriteMoveTarget(this.dragRow.slot,this.dragRow.source,count);this.draw();
 }
 scrollList(delta){
  const edit=this.read().setlistEdit,sets=this.listMode==='setlists',key=edit?'editScroll':sets?'setlistScroll':'listScroll',rows=edit?edit.items:sets?this.read().setlists??[]:this.read().rows;
  this[key]=Math.max(0,Math.min(Math.max(0,rows.length*PITCH-ROWS*PITCH),this[key]+delta));this.draw();
 }
 scrollTo(fraction){const edit=this.read().setlistEdit,sets=this.listMode==='setlists',count=(edit?edit.items:sets?this.read().setlists??[]:this.read().rows).length,key=edit?'editScroll':sets?'setlistScroll':'listScroll';this[key]=Math.max(0,Math.min(1,fraction))*Math.max(0,(count-ROWS)*PITCH);this.draw();}
 scrollContent(axis,y,dt){
  if(this.menuId||this.read().rename||y<TOP||y>BOTTOM||Math.abs(axis)<=.18)return false;
  this.scrollList(Math.sign(axis)*(Math.abs(axis)-.18)/.82*650*dt);return true;
 }
 release(controller){
  if(this.sliderDrag?.control.favoriteScroll&&(!controller||this.sliderDrag.controller===controller)){this.sliderDrag=null;this.hover='';}
  if(this.sliderDrag?.control.favoriteDrag&&(!controller||this.sliderDrag.controller===controller)){
   const row=this.dragRow;this.sliderDrag=null;this.dragRow=null;if(row)this.choose(row.editing?'setlistEntryReorder':'reorder',{id:row.id,index:row.target});
  }
  super.release(controller);
 }
 titleLines(label,x,y,width,size=25,lines=2){
  const c=this.ctx;c.font=panelFont(size);const parts=[];let line='';
  for(const char of label){if(c.measureText(line+char).width>width){parts.push(line);line=char;}else line+=char;}if(line)parts.push(line);
  for(let i=0;i<Math.min(lines,parts.length);i++){let t=parts[i];if(i===lines-1&&parts.length>lines){while(c.measureText(t+'…').width>width)t=t.slice(0,-1);t+='…';}this.text(t,x,y+i*28,size,panelTheme().text);}
 }
 drawRename(edit){
  const c=this.ctx;c.fillStyle=panelTheme().overlay;c.beginPath();c.roundRect(12,200,776,1120,24);c.fill();this.controls=[];
  this.text('名前を変える',36,252,36,panelTheme().accent,724);this.text('今の名前',36,311,24,panelTheme().muted);this.wrap(edit.original,36,351,724,3);
  this.wrap('カーソル付きの入力欄をMR内に表示しています。キーボードを使い、そのまま編集できます。',36,536,724,6);
  this.button('renameFocus','入力欄へ',28,810,744,78,()=>this.choose('renameFocus'),{disabled:edit.busy});
  this.button('renameCancel','戻る（名前は変えない）',28,1030,744,64,()=>this.choose('renameCancel'),{disabled:edit.busy});
 }

 drawSetlistEditor(s){
  const edit=s.setlistEdit,c=this.ctx;if(this.editToken!==edit.token){this.editToken=edit.token;this.editScroll=0;this.menuId=null;}
  this.controls=[];drawPanelSurface(c,800,1340);
  this.text('セットリストを編集',32,47,36,panelTheme().text,650);
  this.text(edit.name,32,94,24,panelTheme().accent,736);
  this.button('setlistEditClose','×',696,18,76,60,()=>this.choose('setlistEditCancel'),{disabled:s.busy});
  this.text('お気に入り  ›  セットリスト',32,150,21,panelTheme().muted,736);
  const duration=edit.items.reduce((n,x)=>n+(x.entry.plan.showDuration??x.entry.plan.duration),0)+Math.max(0,edit.items.length-1)*3;
  this.text(edit.items.length+'曲 · 約'+Math.floor(duration/60)+'分'+Math.round(duration)%60+'秒',28,207,23,panelTheme().accent,350);
  if(edit.removed.length)this.button('setlistEditUndo','外した曲を戻す',420,184,352,44,()=>this.choose('setlistEditUndo'),{disabled:s.busy});
  this.editScroll=Math.max(0,Math.min(Math.max(0,(edit.items.length-ROWS)*PITCH),this.editScroll));const offset=Math.floor(this.editScroll/PITCH),remainder=this.editScroll%PITCH,listControls=this.controls.length;
  c.save();c.beginPath();c.rect(18,TOP-4,758,BOTTOM-TOP+4);c.clip();
  edit.items.slice(offset,offset+ROWS+(remainder>0?1:0)).forEach((item,i)=>{
   const index=offset+i,y=TOP+i*PITCH-remainder,row=item.entry;
   c.fillStyle=this.dragRow?.id===item.key?panelTheme().hover:panelTheme().surface;c.beginPath();c.roundRect(20,y-4,750,122,16);c.fill();c.strokeStyle=panelTheme().line;c.lineWidth=1;c.stroke();
   this.button('setlistEntryDrag:'+item.key,'⠿',28,y,58,100,()=>{},{disabled:s.busy});Object.assign(this.controls.at(-1),{slider:!s.busy,favoriteDrag:true,setlistEntryDrag:true,favoriteId:item.key,index});
   this.text(String(index+1).padStart(2,'0'),102,y+24,22,panelTheme().accent);
   this.titleLines(row.title,150,y+22,450,25,2);
   this.text(Math.floor(Math.round(row.plan.duration)/60)+':'+String(Math.round(row.plan.duration)%60).padStart(2,'0'),150,y+96,21,panelTheme().muted,430);
   this.button('setlistEntryRename:'+item.key,'曲名',622,y+4,142,48,()=>this.choose('setlistEntryRename',item.key),{disabled:s.busy});
   this.button('setlistEntryRemove:'+item.key,'外す',622,y+64,142,48,()=>this.choose('setlistEntryRemove',item.key),{disabled:s.busy||edit.items.length<=1,quiet:true});
  });
  if(this.dragRow?.editing){const slot=Math.max(offset,Math.min(offset+ROWS,this.dragRow.slot)),y=TOP+(slot-offset)*PITCH-remainder-8;c.fillStyle=panelTheme().accent;c.fillRect(20,y-3,750,6);c.beginPath();c.moveTo(20,y-11);c.lineTo(36,y);c.lineTo(20,y+11);c.closePath();c.fill();c.fillRect(492,y-19,278,31);this.text('ここに入れる',516,y-3,23,panelTheme().primaryInk,240);}
  c.restore();this.controls=this.controls.filter((a,i)=>{if(i<listControls)return true;const end=Math.min(BOTTOM,a.y+a.h);a.y=Math.max(TOP,a.y);a.h=Math.max(0,end-a.y);return a.h>0;});
  if(edit.items.length>ROWS){const h=ROWS*PITCH,thumb=Math.max(48,h*ROWS/edit.items.length),max=(edit.items.length-ROWS)*PITCH;c.fillStyle=panelTheme().track;c.fillRect(780,TOP,10,h);c.fillStyle=panelTheme().accent;c.fillRect(780,TOP+(h-thumb)*this.editScroll/max,10,thumb);this.controls.push({id:'favoriteScroll',x:774,y:TOP,w:24,h,slider:true,favoriteScroll:true});}
  this.wrap(edit.message||(edit.dirty?'変更はまだ保存されていません。':'⠿を掴んで並べ替え · つまんで上下・スティックでスクロール'),28,1070,744,2,28);
  this.button('setlistEditSave',s.busy?'保存しています…':'変更を保存',28,1132,744,62,()=>this.choose('setlistEditSave'),{primary:true,disabled:s.busy||!edit.dirty});
  this.button('setlistEditCancel',edit.dirty?'変更せず戻る':'セットリストへ戻る',28,1208,744,62,()=>this.choose('setlistEditCancel'),{disabled:s.busy});
 }

 draw(){
  const s=this.read(),c=this.ctx;this.syncChildView(!!s.setlistEdit,{offsetX:.13});if(s.setlistEdit){this.drawSetlistEditor(s);if(s.rename)this.drawRename(s.rename);this.texture.needsUpdate=true;return;}this.controls=[];drawPanelSurface(c,800,1340,{border:'#ddc69585'});
  this.text('お気に入り',32,47,41,panelTheme().text,600);this.text('好きな一曲を、自分の大会に。',32,91,21,panelTheme().muted);this.button('favoriteClose','×',696,18,76,60,()=>this.close());
  const selected=s.rows.filter(r=>r.checked),seconds=selected.reduce((n,r)=>n+r.plan.showDuration,0)+Math.max(0,selected.length-1)*3;
  const sets=this.listMode==='setlists',rows=sets?s.setlists??[]:s.rows,key=sets?'setlistOffset':'offset',scrollKey=sets?'setlistScroll':'listScroll';
  this.button('favoriteTab','♥の曲を選ぶ',28,124,360,54,()=>{this.listMode='favorites';this.menuId=null;},{selected:!sets});
  this.button('setlistTab','セットリスト',412,124,360,54,()=>{this.listMode='setlists';this.menuId=null;},{selected:sets});
  this.text(sets?rows.length+'件のセットリスト':`${selected.length}曲 · 約${Math.floor(seconds/60)}分${Math.round(seconds)%60}秒`,28,207,23,panelTheme().accent);
  this.wrap(s.message||(sets?'名前で曲目・編集 · ▶で開演':s.festival||'▶ 再生・Ⅱ 停止 / ☑ 選曲'),350,207,422,1);
  this[scrollKey]=Math.max(0,Math.min(Math.max(0,(rows.length-ROWS)*PITCH),this[scrollKey]));this[key]=Math.floor(this[scrollKey]/PITCH);const remainder=this[scrollKey]%PITCH;
  const listControls=this.controls.length;c.save();c.beginPath();c.rect(18,TOP-4,758,BOTTOM-TOP+4);c.clip();
  if(!rows.length)this.wrap(sets?'♥の曲を選んで並べ、「このセットリストを保存する」を押してください。':'気に入った構成で、サイドパネル右上の♡を押してください。音源と構成が丸ごと残ります。',32,340,736,4);
  rows.slice(this[key],this[key]+ROWS+(remainder>0?1:0)).forEach((row,i)=>{
   const index=this[key]+i,y=TOP+i*PITCH-remainder,active=!sets&&s.playback?.id===row.id,playing=active&&s.playback.running,paused=active&&s.playback.active&&!s.playback.completed&&!playing;
   c.fillStyle=this.dragRow?.id===row.id?panelTheme().hover:!sets&&row.checked?panelGradient(c,20,y,760,0,panelTheme().selectedCard):panelTheme().surface;c.beginPath();c.roundRect(20,y-4,760,122,16);c.fill();c.strokeStyle=!sets&&row.checked?panelTheme().selectedLine:panelTheme().line;if(playing||paused)c.strokeStyle=panelTheme().accent;c.lineWidth=playing||paused?3:1;c.stroke();
   if(sets){
    this.button('setlistEditOpen:'+row.id,'',28,y,586,100,()=>this.choose('setlistEdit',row.id),{disabled:s.busy,quiet:true});
    this.titleLines(row.name,44,y+22,550,27,2);
    this.text(row.entries.length+'曲 · 約'+Math.floor(row.duration/60)+'分'+Math.round(row.duration)%60+'秒',44,y+96,22,panelTheme().muted,550);
    this.button('setlistLoad:'+row.id,'▶',622,y,68,100,()=>this.choose('setlistLoad',row.id),{disabled:s.busy});
    this.button('setlistMenu:'+row.id,'…',704,y,64,100,()=>{this.menuId=row.id;},{disabled:s.busy,quiet:true});return;
   }
   this.button('drag:'+row.id,'⠿',28,y,58,100,()=>{}, {disabled:s.busy});const drag=this.controls.at(-1);Object.assign(drag,{slider:!s.busy,favoriteDrag:true,favoriteId:row.id,index});
   this.button('check:'+row.id,row.checked?'☑':'☐',98,y,64,100,()=>this.choose('check',row.id),{selected:row.checked,disabled:s.busy});
   this.button('play:'+row.id,playing?'Ⅱ':'▶',176,y,68,100,()=>this.choose('play',row.id),{disabled:s.busy,selected:playing});
   this.button('load:'+row.id,'',254,y,444,66,()=>this.choose('load',row.id),{disabled:s.busy,quiet:true});
   const label=favoriteDisplay(row);this.titleLines(label.title,262,y+19,428,25,2);
   this.text(`${playing?'再生中 · ':paused?'一時停止中 · ':active&&s.playback.completed?'再生終了 · ':''}${Math.floor(Math.round(row.plan.duration)/60)}:${String(Math.round(row.plan.duration)%60).padStart(2,'0')} · ${favoriteDisplay(row).detail}`,262,y+97,20,panelTheme().muted,432);
   this.button('menu:'+row.id,'…',704,y,64,100,()=>{this.menuId=row.id;},{disabled:s.busy,quiet:true});
  });
  if(this.dragRow){
   const slot=Math.max(this.offset,Math.min(this.offset+ROWS,this.dragRow.slot)),y=TOP+(slot-this.offset)*PITCH-remainder-8;
   c.fillStyle=panelTheme().accent;c.fillRect(20,y-3,760,6);c.beginPath();c.moveTo(20,y-11);c.lineTo(36,y);c.lineTo(20,y+11);c.closePath();c.fill();
   c.fillRect(492,y-19,278,31);this.text('ここに入れる',516,y-3,23,panelTheme().primaryInk,240);
  }
  c.restore();
  // Match hit rectangles to the clipped rows, including partially visible ends.
  this.controls=this.controls.filter((a,i)=>{if(i<listControls)return true;const end=Math.min(BOTTOM,a.y+a.h);a.y=Math.max(TOP,a.y);a.h=Math.max(0,end-a.y);return a.h>0;});
  if(rows.length>ROWS){
   const h=ROWS*PITCH,thumb=Math.max(48,h*ROWS/rows.length),max=(rows.length-ROWS)*PITCH;
   c.fillStyle=panelTheme().track;c.fillRect(780,TOP,10,h);c.fillStyle=panelTheme().accent;c.fillRect(780,TOP+(h-thumb)*this[scrollKey]/max,10,thumb);
   this.controls.push({id:'favoriteScroll',x:774,y:TOP,w:24,h,slider:true,favoriteScroll:true});
  }
  this.text('つまんで上下・スティックでスクロール',28,1090,23,panelTheme().muted);
  this.text(`${rows.length?this[key]+1:0}–${Math.min(this[key]+ROWS+(remainder>0?1:0),rows.length)} / ${rows.length}`,560,1090,23,panelTheme().muted);
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
    if(sets)this.button('setlistEdit','編集する',40,550,720,74,()=>{const id=this.menuId;this.menuId=null;this.draw();this.choose('setlistEdit',id);},{disabled:s.busy});
    this.button('delete','削除する',40,sets?662:590,720,74,()=>{const id=this.menuId;this.menuId=null;this.choose(sets?'setlistDelete':'delete',id);},{danger:true,disabled:s.busy});
    this.button('menuBack','戻る',40,sets?790:760,720,70,()=>{this.menuId=null;});
   }
  }
  this.texture.needsUpdate=true;
 }
}
