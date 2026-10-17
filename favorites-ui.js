import {programmeKey,moveFavorite,favoriteDisplay} from './favorite-programmes.js';
const clock=seconds=>{const whole=Math.round(seconds);return `${Math.floor(whole/60)}:${String(whole%60).padStart(2,'0')}`;};
const make=(tag,attrs={},text='')=>{const el=document.createElement(tag);Object.assign(el,attrs);el.textContent=text;return el;};
export function mountFavorites({repository,capture,audio,onOpen,onLoad,onPrepare,onPlay=()=>{},playback=()=>({id:null,running:false,completed:false}),onRenameSetlist=()=>{},onRenameSetlistEntry=()=>{},onChange=()=>{},available=()=>true}){
 const heart=document.getElementById('favoriteToggle'),open=document.getElementById('favoriteListOpen');
 const window=make('section',{id:'favoritesWindow',hidden:true});window.setAttribute('role','dialog');window.setAttribute('aria-label','お気に入り・大会');document.body.append(window);
 const heading=make('div',{className:'favorites-heading'});const title=make('h2');title.append(make('span',{className:'favorite-heart-icon'},'♥'),document.createTextNode(' お気に入り・大会'));heading.append(title);const close=make('button',{},'×');close.setAttribute('aria-label','お気に入りを閉じる');close.onclick=()=>{if(state.setlistEdit)cancelSetlistEdit();else window.hidden=true;};heading.append(close);window.append(heading);
 const summary=make('p',{id:'favoriteSummary'}),notice=make('p',{id:'favoriteNotice',role:'status'}),list=make('ol',{id:'favoriteRows'}),prepare=make('button',{id:'favoritePrepare'},'選んだ順で大会を準備');const undo=make('button',{id:'favoriteUndo',hidden:true},'削除を元に戻す');undo.onclick=()=>void restore();
 const saveSet=make('button',{id:'setlistSave'},'このセットリストを保存する');saveSet.onclick=()=>void saveSetlist();
 const sets=make('section',{id:'savedSetlists'}),setRows=make('ol',{id:'setlistRows'}),setUndo=make('button',{id:'setlistUndo',hidden:true},'セットリストの削除を元に戻す');setUndo.onclick=()=>void restoreSetlist();sets.append(make('h3',{},'保存したセットリスト'),setRows,setUndo);
 const browse=make('div',{id:'favoriteBrowse'}),editor=make('section',{id:'setlistEditor',hidden:true});window.append(browse,editor);browse.append(summary,make('p',{className:'favorites-hint'},'▶でこの１曲を再生・Ⅱで一時停止。☑で大会に入れ、⠿で曲順を変えられます。'),list,notice,undo,saveSet,prepare,sets);
 const selector=document.getElementById('setlistSelect');
 const state={rows:[],setlists:[],activeSetlistId:'',setlistUndoId:null,setlistMenuId:null,ready:false,busy:false,key:null,saved:false,canSave:false,message:'',festival:'',menuId:null,editingId:null,undoId:null,setlistEdit:null};let generation=0,drag=null;
 function render(){
  state.playback=playback();state.available=available();
  heart.textContent=state.saved?'♥':'♡';heart.disabled=state.busy||!state.canSave;heart.setAttribute('aria-pressed',String(state.saved));heart.setAttribute('aria-label',state.saved?'この構成は保存済み・一覧を開く':'この構成をお気に入りに保存');
  const selected=state.rows.filter(r=>r.checked);summary.textContent=`${selected.length}曲 · 約${clock(selected.reduce((sum,r)=>sum+r.plan.showDuration,0)+Math.max(0,selected.length-1)*3)}　${state.festival}`;notice.textContent=state.message;
  undo.hidden=!state.undoId;undo.disabled=state.busy;
  prepare.disabled=state.busy||!selected.length||!available();prepare.textContent=state.busy?'準備しています…':'選んだ順で大会を準備';
  saveSet.disabled=state.busy||!selected.length||!available();
  if(selector){
   document.getElementById('setlistField').hidden=!state.setlists.length;
   selector.replaceChildren(make('option',{value:'',disabled:true},state.setlists.length?'保存した大会を選ぶ':'保存したセットリストはありません'),...state.setlists.map(s=>make('option',{value:s.id},s.name+' · '+s.entries.length+'曲')));
   selector.value=state.activeSetlistId;selector.disabled=state.busy||!state.setlists.length||!available();
  }
  setRows.replaceChildren();
  if(!state.setlists.length)setRows.append(make('li',{className:'favorite-empty'},'曲を選んで並べ、「このセットリストを保存する」を押してください。'));
  for(const row of state.setlists){
   const item=make('li',{className:'setlist-row'});item.dataset.id=row.id;
   const name=make('button',{className:'setlist-title',disabled:state.busy},row.name);name.setAttribute('aria-label',row.name+'の曲目を開く');name.onclick=()=>editSetlist(row.id);
   item.append(name,make('small',{},row.entries.length+'曲 · 約'+clock(row.duration)),make('p',{className:'setlist-song-order'},row.entries.map(r=>r.title).join(' → ')));
   const buttons=make('div',{className:'favorite-row-buttons'}),watch=make('button',{disabled:state.busy||!available()},'▶ このセットリストを観る'),menu=make('button',{disabled:state.busy},'…');
   watch.onclick=()=>void loadSetlist(row.id);menu.setAttribute('aria-label',row.name+'のメニュー');menu.onclick=()=>{state.setlistMenuId=state.setlistMenuId===row.id?null:row.id;render();};buttons.append(watch,menu);item.append(buttons);
   if(state.setlistMenuId===row.id){const actions=make('div',{className:'favorite-menu'});for(const [label,fn]of [['編集する',()=>editSetlist(row.id)],['名前を変える',()=>onRenameSetlist(row.id)],['削除する',()=>removeSetlist(row.id)]]){const b=make('button',{disabled:state.busy},label);b.onclick=()=>void fn();actions.append(b);}item.append(actions);}
   setRows.append(item);
  }
  setUndo.hidden=!state.setlistUndoId;setUndo.disabled=state.busy;
  list.replaceChildren();if(!state.rows.length)list.append(make('li',{className:'favorite-empty'},'気に入った構成で♡を押すと、ここに残ります。'));
  state.rows.forEach((row,index)=>{
   const li=make('li',{className:'favorite-row'});li.dataset.id=row.id;const active=state.playback.id===row.id,playing=active&&state.playback.running,paused=active&&state.playback.active&&!state.playback.completed&&!playing;li.classList.toggle('is-playing',playing);li.classList.toggle('is-paused',paused);
   const handle=make('button',{className:'favorite-grip',disabled:state.busy},'⠿');handle.setAttribute('aria-label',row.name+'をドラッグして並べ替え');
   handle.onpointerdown=event=>{if(state.busy)return;event.preventDefault();handle.setPointerCapture(event.pointerId);drag={id:row.id,index,pointer:event.pointerId};li.classList.add('is-dragging');};
   handle.onpointermove=event=>{if(!drag||drag.pointer!==event.pointerId)return;const rows=[...list.querySelectorAll('.favorite-row')];let slot=rows.findIndex(el=>event.clientY<el.getBoundingClientRect().top+el.getBoundingClientRect().height/2);if(slot<0)slot=rows.length;drag.target=slot>index?slot-1:slot;rows.forEach((el,i)=>{el.classList.toggle('insert-before',i===slot);el.classList.toggle('insert-after',slot===rows.length&&i===rows.length-1);});};
   handle.onpointerup=event=>{if(!drag)return;const move=drag;drag=null;handle.releasePointerCapture(event.pointerId);void reorder(move.id,move.target??move.index);};handle.onpointercancel=()=>{drag=null;render();};
   const check=make('input',{type:'checkbox',checked:row.checked,disabled:state.busy});check.setAttribute('aria-label',row.name+'を大会に入れる');check.onchange=()=>void toggle(row.id);
   const play=make('button',{className:'favorite-play',disabled:state.busy||!available()},playing?'Ⅱ':'▶');play.setAttribute('aria-label',row.name+(playing?'を一時停止':'を再生'));play.setAttribute('aria-pressed',String(playing));play.onclick=()=>void playRow(row.id);
   const body=make('div',{className:'favorite-row-body'}),title=make('div',{className:'favorite-name-line'});title.append(make('strong',{},favoriteDisplay(row).title));const menu=make('button',{disabled:state.busy},'…');menu.setAttribute('aria-label',row.name+'のメニュー');menu.onclick=()=>{state.menuId=state.menuId===row.id?null:row.id;render();};title.append(menu);body.append(title,make('small',{},`${playing?'再生中 · ':paused?'一時停止中 · ':active&&state.playback.completed?'再生終了 · ':''}${clock(row.plan.duration)} · ${favoriteDisplay(row).detail}`));
   if(state.menuId===row.id){const actions=make('div',{className:'favorite-menu'});for(const [text,fn] of [['名前を変える',()=>edit(row.id)],['削除する',()=>remove(row.id)]]){const button=make('button',{disabled:state.busy},text);button.onclick=()=>void fn();actions.append(button);}body.append(actions);}
   if(state.editingId===row.id){const name=make('input',{type:'text',value:row.name,disabled:state.busy,maxLength:100});name.setAttribute('aria-label',row.title+'の保存名');const commit=make('button',{disabled:state.busy},'名前を保存');commit.onclick=()=>void action(async()=>{await repository.rename(row.id,name.value);state.editingId=null;state.message='名前を変更しました。';});body.append(name,commit);}
   const buttons=make('div',{className:'favorite-row-buttons'});
   for(const [text,label,fn] of [['↑','上へ',()=>reorder(row.id,index-1)],['↓','下へ',()=>reorder(row.id,index+1)],['準備','この構成を準備',()=>load(row.id)]]){const b=make('button',{disabled:state.busy},text);b.setAttribute('aria-label',row.name+'を'+label);b.onclick=()=>void fn();buttons.append(b);}
   body.append(buttons);li.append(handle,check,play,body);list.append(li);
  });
  document.getElementById('favoriteSaveStatus').textContent=state.message;renderSetlistEditor();onChange(state);
 }
 function editOperations(edit){return edit.items.map(x=>({sourceIndex:x.sourceIndex,title:x.entry.title}));}
 function editSetlist(id){
  if(state.busy)return false;const set=state.setlists.find(x=>x.id===id);if(!set)return false;
  const items=structuredClone(set.entries).map((entry,sourceIndex)=>({key:crypto.randomUUID(),sourceIndex,entry}));
  state.setlistEdit={id,name:set.name,revision:set.entriesRevision??0,token:crypto.randomUUID(),items,removed:[],dirty:false,message:''};
  state.setlistEdit.baseline=JSON.stringify(editOperations(state.setlistEdit));state.setlistMenuId=null;render();return true;
 }
 function editChanged(){const edit=state.setlistEdit;edit.dirty=JSON.stringify(editOperations(edit))!==edit.baseline;edit.message='';render();}
 function moveSetlistEntry(key,index){
  const edit=state.setlistEdit;if(!edit||state.busy)return;
  const ids=moveFavorite(edit.items.map(x=>x.key),key,index),map=new Map(edit.items.map(x=>[x.key,x]));edit.items=ids.map(id=>map.get(id));editChanged();
 }
 function reorderSetlistEntry(key,direction){const edit=state.setlistEdit;if(!edit)return;const i=edit.items.findIndex(x=>x.key===key),j=i+direction;if(i>=0&&j>=0&&j<edit.items.length)moveSetlistEntry(key,j);}
 function removeSetlistEntry(key){
  const edit=state.setlistEdit;if(!edit||state.busy||edit.items.length<=1)return;const index=edit.items.findIndex(x=>x.key===key);if(index<0)return;
  edit.removed.push({item:edit.items.splice(index,1)[0],index});editChanged();
 }
 function restoreSetlistEntry(){const edit=state.setlistEdit;if(!edit||state.busy||!edit.removed.length)return;const last=edit.removed.pop();edit.items.splice(Math.min(last.index,edit.items.length),0,last.item);editChanged();}
 function renameSetlistEntry(key,name){
  const edit=state.setlistEdit,item=edit?.items.find(x=>x.key===key);if(!item||state.busy)return false;
  const title=String(name).trim();if(!title||title.length>100)throw Error('曲名は１〜100文字で入力してください。');
  item.entry={...item.entry,title,name:title};editChanged();return true;
 }
 function cancelSetlistEdit(){if(state.busy)return false;state.setlistEdit=null;render();return true;}
 async function saveSetlistEdit(){
  const edit=state.setlistEdit;if(!edit||state.busy||!edit.dirty)return false;
  const ok=await action(async()=>{const set=await repository.updateSetlist(edit.id,editOperations(edit),edit.revision);state.setlistEdit=null;state.message='セットリストを更新しました · '+set.name+(state.activeSetlistId===set.id?'。変更は次のセットリスト再生から反映されます。':'');});
  if(!ok&&state.setlistEdit===edit){edit.message=state.message;render();}return ok;
 }
 function renderSetlistEditor(){
  const edit=state.setlistEdit;browse.hidden=!!edit;editor.hidden=!edit;close.disabled=!!edit&&state.busy;close.setAttribute('aria-label',edit?'編集をやめてセットリストへ戻る':'お気に入りを閉じる');
  title.replaceChildren(make('span',{className:'favorite-heart-icon'},'♥'),document.createTextNode(edit?' セットリストを編集':' お気に入り・大会'));editor.replaceChildren();if(!edit)return;
  const duration=edit.items.reduce((n,x)=>n+(x.entry.plan.showDuration??x.entry.plan.duration),0)+Math.max(0,edit.items.length-1)*3;
  editor.append(make('h3',{},edit.name),make('p',{},edit.items.length+'曲 · 約'+clock(duration)),make('p',{className:'favorites-hint'},'⠿を掴んで曲順を入れ替え、曲名や曲数を調整できます。'));
  const entries=make('ol',{className:'setlist-edit-rows'});editor.append(entries);
  edit.items.forEach((item,index)=>{
   const row=make('li',{className:'setlist-edit-row'});row.dataset.key=item.key;
   const grip=make('button',{className:'favorite-grip',disabled:state.busy},'⠿');grip.setAttribute('aria-label',item.entry.title+'をドラッグして並べ替え');
   grip.onpointerdown=event=>{if(state.busy)return;event.preventDefault();grip.setPointerCapture(event.pointerId);drag={key:item.key,index,pointer:event.pointerId,editor:true};row.classList.add('is-dragging');};
   grip.onpointermove=event=>{if(!drag?.editor||drag.pointer!==event.pointerId)return;const bounds=window.getBoundingClientRect();if(event.clientY<bounds.top+70)window.scrollTop-=18;else if(event.clientY>bounds.bottom-70)window.scrollTop+=18;const rows=[...entries.children];let slot=rows.findIndex(el=>event.clientY<el.getBoundingClientRect().top+el.getBoundingClientRect().height/2);if(slot<0)slot=rows.length;drag.target=slot>index?slot-1:slot;rows.forEach((el,i)=>{el.classList.toggle('insert-before',i===slot);el.classList.toggle('insert-after',slot===rows.length&&i===rows.length-1);});};
   grip.onpointerup=event=>{if(!drag?.editor)return;const move=drag;drag=null;grip.releasePointerCapture(event.pointerId);moveSetlistEntry(move.key,move.target??move.index);};grip.onpointercancel=()=>{drag=null;render();};
   row.append(grip,make('span',{className:'setlist-edit-number'},String(index+1).padStart(2,'0')),make('strong',{},item.entry.title),make('small',{},clock(item.entry.plan.duration)));
   const actions=make('div',{className:'setlist-edit-actions'});
   for(const [label,accessible,fn,disabled]of [['↑','上へ',()=>reorderSetlistEntry(item.key,-1),index===0],['↓','下へ',()=>reorderSetlistEntry(item.key,1),index===edit.items.length-1],['曲名','曲名を変える',()=>onRenameSetlistEntry(item.key),false],['外す','セットリストから外す',()=>removeSetlistEntry(item.key),edit.items.length<=1]]){
    const b=make('button',{disabled:state.busy||disabled},label);b.setAttribute('aria-label',item.entry.title+(label==='曲名'?'の':'を')+accessible);b.onclick=()=>void fn();actions.append(b);
   }row.append(actions);entries.append(row);
  });
  const message=make('p',{role:'status',className:'setlist-edit-message'},edit.message||(edit.dirty?'変更はまだ保存されていません。':''));editor.append(message);
  if(edit.removed.length){const undo=make('button',{id:'setlistEditUndo',disabled:state.busy},'外した曲を戻す');undo.onclick=restoreSetlistEntry;editor.append(undo);}
  const save=make('button',{id:'setlistEditSave',disabled:state.busy||!edit.dirty},state.busy?'保存しています…':'変更を保存'),cancel=make('button',{id:'setlistEditCancel',disabled:state.busy},edit.dirty?'変更せず戻る':'セットリストへ戻る');save.onclick=()=>void saveSetlistEdit();cancel.onclick=cancelSetlistEdit;editor.append(save,cancel);
 }
 async function refreshHeart(){const token=++generation;try{const snapshot=capture();state.canSave=!!snapshot;const key=snapshot?await programmeKey(snapshot):null;if(token!==generation)return;state.key=key;state.saved=!!key&&state.rows.some(row=>row.key===key||row.playbackKey===key);}catch{if(token!==generation)return;state.canSave=false;state.saved=false;state.key=null;}render();}
 async function action(fn){if(state.busy)return false;state.message='';state.busy=true;render();try{await fn();[state.rows,state.setlists]=await Promise.all([repository.list(),repository.listSetlists()]);await refreshHeart();return true;}catch(error){state.message='完了できませんでした：'+error.message;return false;}finally{state.busy=false;render();}}
 async function save(){
  if(state.saved){onOpen();return;}
  if(state.busy||!state.canSave)return;
  // Capture synchronously, before any audio/IndexedDB work or a later reroll.
  const snapshot=capture();if(!snapshot)return;
  const ok=await action(async()=>{const item=await repository.save(snapshot,await audio(snapshot));state.message='♥ 保存しました · '+item.name;});if(ok)onOpen();
 }
 const persist=async rows=>repository.setView(rows.map(r=>r.id),rows.filter(r=>!r.checked).map(r=>r.id));
 async function toggle(id){await action(async()=>{const rows=state.rows.map(r=>r.id===id?{...r,checked:!r.checked}:r);await persist(rows);});}
 async function reorder(id,index){await action(async()=>{const ids=moveFavorite(state.rows.map(r=>r.id),id,index),map=new Map(state.rows.map(r=>[r.id,r]));await persist(ids.map(i=>map.get(i)));});}
 async function rename(id,name){return action(async()=>{await repository.rename(id,name);state.message='名前を変更しました。';});}
 async function remove(id){await action(async()=>{await repository.remove(id);state.undoId=id;state.menuId=null;state.editingId=null;state.message='一覧から削除しました。元に戻すことができます。';});}
 async function restore(){if(!state.undoId)return;await action(async()=>{await repository.restore(state.undoId);state.undoId=null;state.message='お気に入りを元に戻しました。';});}
 function edit(id){state.menuId=null;state.editingId=id;window.hidden=false;render();list.querySelector('.favorite-row-body>input')?.focus();}
 async function playRow(id){const row=state.rows.find(r=>r.id===id);if(!row)return;await action(async()=>{const result=await onPlay(row);if(result===false)throw Error('再生を中止しました。');state.message=(result==='paused'?'一時停止しました · ':'保存した構成を再生中 · ')+row.name;});}
 function syncPlayback(){const next=playback();if(JSON.stringify(next)!==JSON.stringify(state.playback)||state.available!==available()){
  if(/^(保存した構成を再生中|一時停止しました|再生が終わりました|再生を停止しました) · /.test(state.message)){const row=state.rows.find(r=>r.id===next.id);if(row)state.message=(next.completed?'再生が終わりました':!next.active?'再生を停止しました':next.running?'保存した構成を再生中':'一時停止しました')+' · '+row.name;}
  render();
 }}
 async function load(id){const row=state.rows.find(r=>r.id===id);if(!row)return;await action(async()=>{await onLoad(row);state.message='この構成を準備しました · '+row.name;});}
 async function prepareFestival(){const rows=state.rows.filter(r=>r.checked);if(!rows.length)return;await action(async()=>{await onPrepare(rows);state.message='選んだ順の大会を準備しました。';});}
 async function saveSetlist(){const rows=structuredClone(state.rows.filter(r=>r.checked));if(!rows.length)return;await action(async()=>{const set=await repository.saveSetlist(rows);state.message='セットリストを保存しました · '+set.name;});}
 async function loadSetlist(id){const set=state.setlists.find(s=>s.id===id);if(!set)return false;return action(async()=>{const ready=await onPrepare(structuredClone(set.entries),{id:set.id,name:set.name});if(ready===false)throw Error('準備を中止しました。');state.activeSetlistId=id;state.message='セットリストを準備しました · '+set.name;});}
 async function renameSetlist(id,name){return action(async()=>{await repository.renameSetlist(id,name);state.message='セットリストの名前を変更しました。';});}
 async function removeSetlist(id){return action(async()=>{await repository.removeSetlist(id);state.setlistUndoId=id;state.setlistMenuId=null;if(state.activeSetlistId===id)state.activeSetlistId='';state.message='セットリストを一覧から削除しました。元に戻せます。';});}
 async function restoreSetlist(){if(!state.setlistUndoId)return;return action(async()=>{await repository.restoreSetlist(state.setlistUndoId);state.setlistUndoId=null;state.message='セットリストを元に戻しました。';});}
 if(selector)selector.onchange=()=>{if(selector.value)void loadSetlist(selector.value);};
 heart.onclick=()=>void save();open.onclick=onOpen;prepare.onclick=()=>void prepareFestival();
 return {state,editSetlist,moveSetlistEntry,reorderSetlistEntry,removeSetlistEntry,restoreSetlistEntry,renameSetlistEntry,saveSetlistEdit,cancelSetlistEdit,refreshHeart,syncPlayback,play:playRow,save,toggle,reorder,load,prepareFestival,rename,remove,undo:restore,edit,saveSetlist,loadSetlist,renameSetlist,removeSetlist,restoreSetlist,show(){window.hidden=false;render();},close(){window.hidden=true;},setFestival(text){state.festival=text;render();},message(text){state.message=text;render();},async restore(){[state.rows,state.setlists]=await Promise.all([repository.list(),repository.listSetlists()]);state.ready=true;await refreshHeart();render();}};
}
