const panel=document.getElementById('panel');
const mobile=matchMedia('(max-width: 760px) and (pointer: coarse), (max-height: 500px) and (pointer: coarse)');
const landscape=matchMedia('(orientation: landscape)');
const toggle=document.createElement('button');
toggle.id='mobilePanelToggle';
toggle.type='button';
toggle.setAttribute('aria-controls','panel');
document.body.append(toggle);
let open=!(mobile.matches&&landscape.matches);
function render(){
 const active=!document.body.classList.contains('mr-panel-preview');
 document.body.classList.toggle('mobile-view',active&&mobile.matches);
 document.body.classList.toggle('browser-controls',active);
 document.body.classList.toggle('mobile-panel-closed',active&&!open);
 toggle.hidden=!active;
 toggle.textContent=open?'操作を閉じる':'操作';
 toggle.setAttribute('aria-expanded',String(open));
 panel.inert=active&&!open;
}
toggle.addEventListener('click',()=>{open=!open;render();if(open)panel.focus({preventScroll:true});});
panel.tabIndex=-1;
const watch=document.getElementById('showWatch');
let wasRunning=watch.textContent.includes('一時停止');
new MutationObserver(()=>{
 const running=watch.textContent.includes('一時停止');
 if(running&&!wasRunning&&open){open=false;render();toggle.focus({preventScroll:true});}
 wasRunning=running;
}).observe(watch,{childList:true,subtree:true,characterData:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=false;render();toggle.focus();}});
mobile.addEventListener('change',render);
landscape.addEventListener('change',()=>{if(mobile.matches&&landscape.matches)open=false;render();});
render();

const fullscreen=document.createElement('button');
fullscreen.id='mobileFullscreenToggle';
fullscreen.type='button';
document.body.append(fullscreen);
function renderFullscreen(){
 fullscreen.hidden=!document.fullscreenEnabled||document.body.classList.contains('mr-panel-preview');
 fullscreen.textContent=document.fullscreenElement?'全画面を戻す':'全画面';
 fullscreen.setAttribute('aria-pressed',String(!!document.fullscreenElement));
}
fullscreen.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch{
  fullscreen.textContent='全画面にできませんでした';
 }
});
document.addEventListener('fullscreenchange',renderFullscreen);
mobile.addEventListener('change',renderFullscreen);
renderFullscreen();

const viewToggle=document.createElement('button');viewToggle.id='browserViewToggle';viewToggle.type='button';viewToggle.textContent='視点';viewToggle.setAttribute('aria-expanded','false');viewToggle.setAttribute('aria-controls','browserViewMoves');
const moves=document.createElement('section');moves.id='browserViewMoves';moves.hidden=true;moves.setAttribute('aria-label','視点の位置を動かす');
const hint=document.createElement('p');hint.textContent='視点の位置を移動 · PCは矢印キーでも操作';moves.append(hint);
for(const [label,x,y,reset] of [['上へ',0,.12],['左へ',-.12,0],['元の位置',0,0,true],['右へ',.12,0],['下へ',0,-.12]]){
 const button=document.createElement('button');button.type='button';button.textContent=label;
 button.onclick=()=>window.dispatchEvent(new CustomEvent('hanabi-view-move',{detail:{x,y,reset}}));moves.append(button);
}
viewToggle.onclick=()=>{moves.hidden=!moves.hidden;viewToggle.setAttribute('aria-expanded',String(!moves.hidden));};
document.body.append(viewToggle,moves);
function renderView(){viewToggle.hidden=document.body.classList.contains('mr-panel-preview');if(viewToggle.hidden)moves.hidden=true;}
renderView();
