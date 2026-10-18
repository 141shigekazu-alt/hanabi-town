import {parseVoiceRequest} from './voice-request.js?v=1.3.10';
// No recordings are written to IndexedDB, CacheStorage, localStorage or a server.
// A recording exists only until decoding; the transferred samples die with worker.
export function mountVoiceInput({onPause,onApply,onChange=()=>{},onCancel=()=>{},onDiscard=()=>{}}){
 const maxSeconds=20;
 const $=id=>document.getElementById(id);
 const state={open:false,phase:'idle',detail:'',status:'マイクを押して、イメージを話してください。',transcript:'',summary:'',progress:0,seconds:0,level:0,error:false,maxSeconds,draft:null};
 let generation=0,loadTimer=null,worker=null,stream=null,context=null,recorder=null,chunks=[],timer=null,ticker=null,analyser=null,peak=0,started=0,pendingLoad=null,returnTimer=null;
 const busy=()=>['loading','permission','starting','recording','recognizing','applying'].includes(state.phase);
 function render(){
  const preparing=['permission','loading','starting'].includes(state.phase);
  $('voiceCard').hidden=!state.open;$('voiceCard').querySelector('.voice-examples').hidden=!!state.transcript;$('voiceStatus').textContent=state.status;$('voiceStatus').dataset.error=String(state.error);$('voiceStatus').dataset.phase=state.phase;$('voiceOpen').setAttribute('aria-busy',String(preparing));$('voiceDetail').textContent=preparing?state.detail:'';$('voiceDetail').hidden=!preparing||!state.detail;
  $('voiceTranscript').textContent=state.transcript?`「${state.transcript}」`:'';$('voiceSummary').textContent=state.summary;
  $('voiceProgress').hidden=state.phase!=='recording';$('voiceProgress').value=state.progress;
  $('voiceRecord').textContent=state.phase==='recording'?'■ 停止':preparing?'準備中…':state.phase==='recognizing'?'声を読み取り中…':state.phase==='applying'?'構成へ反映中…':state.phase==='complete'?'🎤 もう一度話す':'🎤 話す（20秒まで）';$('voiceRecord').disabled=busy()&&state.phase!=='recording';
  $('voiceDiscard').hidden=!(state.draft||state.transcript||state.summary);$('voiceDiscard').disabled=busy();
  $('voiceCancel').textContent=busy()?'中止して戻る':'花火大会へ戻る';onChange({...state,busy:busy()});
 }
 function releaseMic(){clearTimeout(timer);timer=null;clearInterval(ticker);ticker=null;if(recorder)recorder.onstart=null;if(recorder?.state==='recording'){recorder.ondataavailable=null;recorder.onstop=null;recorder.stop();}recorder=null;for(const t of stream?.getTracks()??[])t.stop();stream=null;analyser=null;state.level=0;}
 function releaseWorker(){clearTimeout(loadTimer);loadTimer=null;worker?.terminate();worker=null;pendingLoad?.reject(Error('中止しました。'));pendingLoad=null;}
 function releaseContext(){const c=context;context=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});}
 function cleanup(){releaseMic();chunks=[];releaseContext();releaseWorker();}
 function cancel(close=true){const applying=state.phase==='applying';generation++;clearTimeout(returnTimer);returnTimer=null;cleanup();if(applying)onCancel();if(state.phase!=='complete'){state.phase=state.draft?'pending':'idle';state.status=state.draft?'✓ 希望はまだ未反映です。「このイメージで打ち上げる」で反映します。':'音声リクエストを中止しました。花火は停止したままです。';}state.error=false;if(close)state.open=false;render();}
 function fail(error,token){if(token!==generation)return;const applying=state.phase==='applying';generation++;cleanup();if(applying)onCancel();state.phase='error';state.error=true;state.status=error?.name==='NotAllowedError'?'マイクを許可してください。必要ならブラウザ画面で許可してから、MRでお試しください。':error?.name==='NotFoundError'?'マイクが見つかりません。':error?.message??'声を聞き取れませんでした。もう一度お試しください。';render();}
 function load(token){return new Promise((resolve,reject)=>{
  worker=new Worker(new URL('./voice-recognizer.js',import.meta.url),{type:'module'});pendingLoad={resolve,reject};const files=new Map();
  worker.onerror=e=>{const error=Error(e.message||'音声AIを準備できませんでした。通信と空き容量を確認してください。');if(pendingLoad){pendingLoad.reject(error);pendingLoad=null;}else fail(error,token);};
  worker.onmessage=async({data})=>{if(token!==generation)return;
   if(data.type==='progress'&&state.phase==='loading'){const p=data.progress;if(p.file&&p.total)files.set(p.file,{loaded:p.loaded??0,total:p.total});const values=[...files.values()],total=values.reduce((n,p)=>n+p.total,0),loaded=values.reduce((n,p)=>n+p.loaded,0);state.progress=total?loaded/total:0;state.detail='初回は音声AIを自動で保存します。'+(total?` ${Math.round(loaded/1048576)} / ${Math.round(total/1048576)} MB`:'');render();}
   if(data.type==='ready'){clearTimeout(loadTimer);loadTimer=null;pendingLoad?.resolve();pendingLoad=null;}
   if(data.type==='error'){const e=Error('音声を処理できませんでした。'+data.error);if(pendingLoad){pendingLoad.reject(e);pendingLoad=null;}else fail(e,token);}
   if(data.type==='result'&&state.phase==='recognizing'){
    // Terminate before returning to fireworks: GPU tensors and audio samples
    // must not outlive recognition. Only text and bounded wishes remain.
    releaseWorker();releaseContext();state.transcript=data.text;const request=parseVoiceRequest(data.text);state.summary=request.summary;
    if(!request.recognized){state.phase='idle';state.status='希望をもう一度、短く教えてください。';render();return;}
    state.draft=request;state.phase='pending';state.status='✓ 希望を受け取りました。「このイメージで打ち上げる」で反映します。';render();

   }
  };worker.postMessage({type:'load'});loadTimer=setTimeout(()=>fail(Error('音声AIの準備に時間がかかっています。通信を確認して、もう一度お試しください。'),token),180000);
 });}
 async function start(){
  if(busy())return;const token=++generation;clearTimeout(returnTimer);state.open=true;state.phase='permission';state.error=false;state.transcript='';state.summary='';state.draft=null;state.progress=0;state.seconds=0;state.detail='';state.status='マイクを準備中…お待ちください';render();
  try{
   onPause();if(!navigator.mediaDevices?.getUserMedia)throw Error('マイクにはHTTPSのブラウザ画面からアクセスしてください。');
   context=new AudioContext();void context.resume().catch(()=>{});
   const acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;
   state.phase='loading';state.detail='音声AIを起動しています。初回は自動でダウンロードします。';render();await load(token);if(token!==generation)return;
   analyser=context.createAnalyser();analyser.fftSize=512;context.createMediaStreamSource(stream).connect(analyser); // No connection to speakers.
   peak=0;chunks=[];const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});
   recorder.ondataavailable=e=>{if(token===generation&&e.data.size)chunks.push(e.data);};
   recorder.onerror=e=>fail(e.error||Error('録音できませんでした。'),token);
   recorder.onstop=async()=>{
    if(token!==generation)return;const blob=new Blob(chunks,{type:recorder.mimeType});chunks=[];recorder=null;releaseMic();
    try{
     if(!blob.size||peak<.002)throw Error('声が聞こえませんでした。マイクに向かって、もう一度どうぞ。');
     const decoded=await context.decodeAudioData(await blob.arrayBuffer());if(token!==generation)return;
     const resampler=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000),source=resampler.createBufferSource();source.buffer=decoded;source.connect(resampler.destination);source.start();const rendered=await resampler.startRendering();if(token!==generation)return;const samples=rendered.getChannelData(0).slice();releaseContext();
     state.phase='recognizing';state.status='声のイメージを読み取っています…';render();worker.postMessage({type:'transcribe',id:token,audio:samples},[samples.buffer]);
    }catch(e){fail(e,token);}
   };
   recorder.onstart=()=>{
    if(token!==generation)return;
    state.phase='recording';state.status='● 録音中です。お話しください';state.detail='';state.progress=0;state.seconds=0;started=performance.now();render();
    ticker=setInterval(tick,100);timer=setTimeout(stopRecording,maxSeconds*1000);
   };
   for(const track of stream.getTracks())track.onended=()=>{if(token===generation&&['starting','recording'].includes(state.phase))fail(Error('マイクが切断されました。もう一度お試しください。'),token);};
   state.phase='starting';state.detail='';render();recorder.start(250);

  }catch(e){fail(e,token);}
 }
 function tick(){if(state.phase!=='recording'||!analyser)return;const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);let value=0;for(const v of a)value=Math.max(value,Math.abs(v));peak=Math.max(peak,value);state.level=value;state.seconds=(performance.now()-started)/1000;state.progress=Math.min(1,state.seconds/maxSeconds);render();}
 function stopRecording(){if(recorder?.state==='recording'){clearTimeout(timer);clearInterval(ticker);state.phase='recognizing';state.status='声を処理しています…';render();recorder.stop();}}

 async function applyPending(){
  if(busy()||!state.draft)return false;
  const token=++generation,request=state.draft;state.phase='applying';state.status='希望を構成に反映しています…';render();
  try{const result=await onApply(request,()=>token===generation);if(token!==generation)return false;if(!result)throw Error('構成を準備できませんでした。曲の準備状態を確認して、もう一度どうぞ。');state.draft=null;state.phase='complete';state.status='✓ 希望を入れた構成を作りました。花火大会へ戻って開演できます。';render();return true;}
  catch(error){fail(error,token);return false;}
 }
 function resetDraft({keepOpen=false}={}){if(busy())cancel();state.open=keepOpen;state.draft=null;state.transcript='';state.summary='';state.phase='idle';state.status='マイクを押して、イメージを話してください。';render();}
 $('voiceOpen').onclick=()=>{if(busy())return;state.open=true;render();void start();};$('voiceRecord').onclick=()=>state.phase==='recording'?stopRecording():void start();$('voiceClose').onclick=()=>cancel();$('voiceCancel').onclick=()=>cancel();$('voiceDiscard').onclick=()=>{if(busy())return;resetDraft({keepOpen:true});onDiscard();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy())cancel();});window.addEventListener('pagehide',()=>cancel());
 async function applyRequest(request){
  if(busy())return false;clearTimeout(returnTimer);cleanup();onPause();state.open=false;state.transcript='';state.summary=request.summary;state.error=false;state.draft=request;return applyPending();
 }
 return{applyRequest,get state(){return {...state,busy:busy(),hasDraft:!!state.draft,microphoneActive:!!stream?.getAudioTracks().some(t=>t.readyState==='live'),workerActive:!!worker,bufferedChunks:chunks.length};},get busy(){return busy();},get open(){return state.open;},get hasDraft(){return !!state.draft;},start,cancel,tick,applyPending,resetDraft};
}
