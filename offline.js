const VERSION='1.3.18';
const button=document.getElementById('offlineSave'),status=document.getElementById('offlineStatus'),progress=document.getElementById('offlineProgress'),reload=document.getElementById('offlineReload'),card=document.getElementById('appUpdate');
let registrationForOffline,busy=false,checkedOnline=false,setupPromise=null;
function request(type,onProgress=()=>{}){return new Promise((resolve,reject)=>{
 const active=registrationForOffline?.active;if(!active){reject(Error('保存機能を準備できませんでした。もう一度お試しください。'));return;}
 const channel=new MessageChannel();let timer;
 const finish=(fn,value)=>{clearTimeout(timer);channel.port1.close();fn(value);};
 const extend=()=>{clearTimeout(timer);timer=setTimeout(()=>finish(reject,Error('応答を確認できませんでした。通信を確認し、もう一度お試しください。')),120000);};
 channel.port1.onmessage=e=>{const m=e.data;if(m.type==='PROGRESS'){extend();onProgress(m);return;}m.error?finish(reject,Error(m.error)):finish(resolve,m);};extend();active.postMessage({type},[channel.port2]);
});}
function showState(s){
 const latest=s.latestVersion??VERSION,isLatest=s.latestSaved??s.version===latest,needsReload=s.complete&&isLatest&&s.version!==VERSION;
 button.disabled=false;button.hidden=needsReload;button.textContent='最新版に更新・保存';reload.hidden=!needsReload;
 if(needsReload){card.dataset.state='reload';status.textContent=`${s.version}の保存が完了しました。`;status.append(document.createElement('br'),'ブラウザをリロードしてください。');}
 else if(s.complete&&isLatest&&checkedOnline){card.dataset.state='ready';status.textContent=`最新版を保存済み · ${s.version}。Wi-Fiなしでも開けます。`;}
 else if(s.complete&&!isLatest&&checkedOnline){card.dataset.state='update-available';status.textContent=`新しい版 ${latest}があります。保存済み：${s.version}。上のボタンで更新できます。`;}
 else if(s.complete){card.dataset.state='offline';status.textContent=`保存済み ${s.version}。通信できる時に最新版を確認・更新できます。`;}
 else{card.dataset.state='empty';status.textContent='最新版と、Wi-Fiなしでも使える街・花火・標準４曲を保存します。';}
 const details=document.getElementById('offlineDetails');if(details)details.textContent=s.complete?`保存した版：${s.version}。使用量：約${Math.round(s.bytes/1024/1024)}MB。保存した後は、外出前に通信なしでも開けるか確認してください。`:'未保存です。通信できる場所でタイトル下のボタンを押してください。約175MBを保存します。';
}
async function refreshWorker(){
 if(!registrationForOffline)registrationForOffline=await navigator.serviceWorker.register(new URL('./offline-sw.js?v=1.3.11',import.meta.url),{scope:new URL('./',import.meta.url).pathname,updateViaCache:'none'});
 checkedOnline=false;try{await registrationForOffline.update();checkedOnline=navigator.onLine;}catch{}
 const candidate=registrationForOffline.installing??registrationForOffline.waiting;
 if(candidate&&!['activated','redundant'].includes(candidate.state))await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{candidate.removeEventListener('statechange',changed);reject(Error('更新の準備に時間がかかっています。少し待って、もう一度お試しください。'));},20000);
  function changed(){if(['activated','redundant'].includes(candidate.state)){clearTimeout(timer);candidate.removeEventListener('statechange',changed);if(candidate.state==='redundant')checkedOnline=false;resolve();}}candidate.addEventListener('statechange',changed);changed();
 });
 if(!registrationForOffline.active)throw Error('保存機能を準備できませんでした。ページを開き直してください。');
}
function showError(e){card.dataset.state='error';button.hidden=false;button.disabled=false;button.textContent='最新版に更新・保存';reload.hidden=true;status.textContent='保存・更新できませんでした。'+e.message;}
async function setup(){
 if(busy)return;
 if(!isSecureContext||!('serviceWorker' in navigator)){button.disabled=true;status.textContent='このブラウザでは保存できません。Quest BrowserでHTTPSの花火街を開いてください。';return;}
 if(setupPromise)return setupPromise;
 setupPromise=(async()=>{try{await refreshWorker();showState(await request('STATUS'));}catch(e){showError(e);}finally{setupPromise=null;}})();return setupPromise;
}
button.onclick=async()=>{
 if(busy)return;if(setupPromise)await setupPromise;
 busy=true;card.setAttribute('aria-busy','true');card.dataset.state='saving';button.disabled=true;button.textContent='最新版を確認中…';reload.hidden=true;status.textContent='通信を確認して、最新版を準備しています。';
 try{
  await refreshWorker();button.textContent='更新・保存中…';progress.hidden=false;progress.value=0;status.textContent='街・花火・標準４曲を保存します。このページを開いたままお待ちください。';
  const result=await request('SAVE',m=>{progress.value=m.percent;status.textContent=`保存中 ${m.percent}％ · ${m.done}/${m.total}ファイル`;});
  if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);showState(result);
 }catch(e){showError(e);}finally{busy=false;progress.hidden=true;card.setAttribute('aria-busy','false');}
};
reload.onclick=()=>location.reload();
window.addEventListener('online',()=>{void setup();});
setup();
