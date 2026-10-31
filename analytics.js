// Counts only. No cookies, visitor IDs, fingerprints, location or referrer data.
const ENDPOINT='https://hanabi-town-counts.141shigekazu.workers.dev/collect';
const KEY='hanabi-counts-opt-out-v1';
const production=location.origin==='https://141shigekazu-alt.github.io'&&location.pathname.startsWith('/hanabi-town/');
let disabled=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
try{disabled=disabled||localStorage.getItem(KEY)==='1'||localStorage.getItem('hanabi-analytics-consent-v1')==='denied';}catch{disabled=true;}
// Remove the previous GA cookies on this application's path, without loading GA.
try{for(const name of ['_ga','_ga_CCZWT6D5LF'])for(const domain of ['', '; Domain='+location.hostname])document.cookie=name+'=; Max-Age=0; Path=/hanabi-town/; SameSite=Lax'+domain;}catch{}
window['ga-disable-G-CCZWT6D5LF']=true;
function send(event){
 if(!production||disabled||navigator.onLine===false||!ENDPOINT.startsWith('https://'))return;
 // No credentials/referrer, no query parameters and no offline retry queue.
 try{void fetch(ENDPOINT,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'text/plain'},body:event,keepalive:true}).catch(()=>{});}catch{}
}
export function trackUsage(event){if(['mr_enter','vr_enter','show_start'].includes(event))send(event);}
function mount(){
 const box=document.createElement('section');box.id='usageDetails';box.hidden=true;box.setAttribute('aria-label','利用回数の集計について');
 box.innerHTML='<strong>利用回数の集計について</strong><p>花火街の改善のため、日付ごとのページ表示・MR入場・開演の回数を集計しています。Cookieや利用者IDは使わず、曲名・音源・音声入力は送りません。 <a href="privacy.html" target="_blank" rel="noopener">詳しく見る</a></p><p id="usageCountState"></p><button type="button" id="usageCountToggle"></button><button type="button" id="usageCountClose">閉じる</button>';
 const link=document.createElement('button');link.type='button';link.id='usageSettings';link.textContent='利用回数の集計について';link.onclick=()=>{box.hidden=!box.hidden;};document.body.append(box,link);
 const state=document.getElementById('usageCountState'),toggle=document.getElementById('usageCountToggle');
 function update(){state.textContent=disabled?'このブラウザからの集計は停止しています。':'このブラウザからは回数だけを集計しています。';toggle.textContent=disabled?'回数の集計を有効にする':'このブラウザからの集計を停止する';}
 toggle.onclick=()=>{
  if(disabled&&(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1')){state.textContent='ブラウザの追跡拒否設定が有効なため、集計を停止しています。';return;}
  disabled=!disabled;try{localStorage.setItem(KEY,disabled?'1':'0');if(!disabled&&localStorage.getItem('hanabi-analytics-consent-v1')==='denied')localStorage.removeItem('hanabi-analytics-consent-v1');}catch{disabled=true;}update();
 };
 document.getElementById('usageCountClose').onclick=()=>{box.hidden=true;};update();send('page_view');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
addEventListener('storage',event=>{if([KEY,'hanabi-analytics-consent-v1'].includes(event.key)){try{disabled=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||localStorage.getItem(KEY)==='1'||localStorage.getItem('hanabi-analytics-consent-v1')==='denied';}catch{disabled=true;}}});
