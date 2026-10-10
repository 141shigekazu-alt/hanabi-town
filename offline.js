const VERSION='1.1.51';
const button=document.getElementById('offlineSave'),status=document.getElementById('offlineStatus'),progress=document.getElementById('offlineProgress');
let worker,busy=false;
function request(type,onProgress=()=>{}){return new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{const m=e.data;if(m.type==='PROGRESS'){onProgress(m);return;}channel.port1.close();m.error?reject(new Error(m.error)):resolve(m);};(navigator.serviceWorker.controller??worker).postMessage({type},[channel.port2]);});}
function showState(s){button.disabled=false;button.textContent=s.complete?'オフライン保存を確認・更新':'オフライン用に保存';status.textContent=s.complete?`保存済み ${s.version} · 街・花火・３曲をWi-Fiなしで開けます。ブラウザの保存データを消すと再保存が必要です。`:'家など通信できる場所で保存してください。街・花火・３曲、約96MBです。';}
async function setup(){
 if(!isSecureContext||!('serviceWorker' in navigator)){button.textContent='このブラウザでは保存できません';status.textContent='Quest BrowserでHTTPSの花火街を開いてください。';return;}
 try{const registration=await navigator.serviceWorker.register(new URL('./offline-sw.js',import.meta.url),{scope:new URL('./',import.meta.url).pathname,updateViaCache:'none'});await navigator.serviceWorker.ready;worker=registration.active;if(!worker)throw Error('保存機能を準備できませんでした。ページを開き直してください。');showState(await request('STATUS'));}
 catch(e){button.disabled=false;button.textContent='保存機能を再確認';status.textContent='保存機能の準備に失敗しました：'+e.message;}
}
button.onclick=async()=>{
 if(busy)return;if(!worker){await setup();return;}busy=true;button.disabled=true;progress.hidden=false;progress.value=0;status.textContent='街・花火・３曲を保存しています。このページを開いたままお待ちください。';
 try{const result=await request('SAVE',m=>{progress.value=m.percent;status.textContent=`保存中 ${m.percent}％ · ${m.done}/${m.total}ファイル`;});if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);showState(result);if(result.version!==VERSION)status.textContent+=' 新しい版の保存が済みました。ページを再読み込みしてください。';status.textContent+=` 使用量：約${Math.round(result.bytes/1024/1024)}MB。外出前にWi-Fiを切って一度試してください。`;}
 catch(e){button.disabled=false;button.textContent='オフライン保存をやり直す';status.textContent='保存を完了できませんでした。通信と空き容量を確認して、もう一度お試しください。 '+e.message;}
 finally{busy=false;progress.hidden=true;}
};
setup();
