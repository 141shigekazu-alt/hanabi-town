import {sortMusicChoices} from './music-catalog.js?v=1.3.4';
import {EAR_SCENES,earScene} from './ear-scenes.js?v=1.3.10';
import {MUSIC_FEELINGS,musicFeeling} from './music-feeling.js';
import {readLocalTrack,saveLocalTrack,listLocalTracks,migrateLatest41,migratePrevious42,readTrackFeeling,saveTrackFeeling,analyzeInBrowser,listTrackTitles,renameTrackTitle,listDeletedTracks,setTrackDeleted} from './quest-local-library.js';
import {applyMusicStructure} from './music-structure.js';
import {compareChorus,timeLabel} from './chorus-reference.js';
import {createAutoMusicPlan} from './auto-music-plan.js?v=1.3.10';
// Audio and per-song analyses stay in this browser; rebuilding reuses decoded audio.
export function mountAutoMusic({catalog,onReady,onOriginalReady=()=>{},onBegin,onManual,onPreview,onRoom,onState=()=>{},onCatalog=()=>{},onRebuilt=()=>{}}){
 const baseCatalog=catalog.map(t=>({...t}));
 const $=id=>document.getElementById(id),fileInput=$('autoMusicFile'),drop=$('autoMusicDrop');
 $('autoMusicEars').replaceChildren(...EAR_SCENES.map(f=>{const o=document.createElement('option');o.value=f.id;o.textContent=f.label;return o;}));
 $('autoMusicEars').value=earScene(localStorage.getItem('hanabi87-ear-scene')).id;
 $('autoMusicFeeling').replaceChildren(...MUSIC_FEELINGS.map(f=>{const o=document.createElement('option');o.value=f.value;o.textContent=f.label;return o;}));
 let generation=0,worker=null,abort=null,cancelAnalysis=null,retained=null,busy=false,roomOpening=false,variation=0,modelId=null,rebuildTimer=null,preferenceQueue=Promise.resolve(),operationTitle='',operation='',voiceRequest=null;
 function syncCatalog(){const selected=$('autoMusicSample').value;$('autoMusicSample').replaceChildren(...sortMusicChoices(catalog.filter(track=>!track.deleted)).map(track=>{const o=document.createElement('option');o.value=track.id;o.textContent=track.title;return o;}));if(catalog.some(t=>t.id===selected))$('autoMusicSample').value=selected;onCatalog(catalog);}
 syncCatalog();
 function controls(){for(const id of ['autoMusicGenerate','autoMusicReanalyze','autoMusicRebuild','autoMusicWatch','autoMusicExport','autoMusicRoom'])$(id).disabled=busy||roomOpening||(!['autoMusicGenerate','autoMusicReanalyze'].includes(id)&&!retained)||(id==='autoMusicRoom'&&(!onRoom||$('mr').disabled));$('autoMusicManual').disabled=busy||roomOpening||!retained?.manualId;$('autoMusicManual').hidden=!!retained&&!retained.manualId;$('autoMusicCancel').hidden=!busy;$('autoMusicSample').disabled=busy||roomOpening;$('autoMusicFeeling').disabled=busy||roomOpening;$('autoMusicEars').disabled=busy||roomOpening;fileInput.disabled=busy||roomOpening;drop.setAttribute('aria-busy',String(busy||roomOpening));}
 function resetRebuildFeedback(){
  clearTimeout(rebuildTimer);rebuildTimer=null;
  $('autoMusicRebuild').textContent='打ち上げ玉の構成を変える';$('autoMusicRebuild').classList.remove('is-complete');
  $('autoMusicRebuildFeedback').hidden=true;
 }
 function rebuildFeedback(previous,plan){
  const number=plan.analysisSummary.variation+1;
  $('autoMusicRebuildComplete').textContent=`✓ 構成${number}に変えました`;
  const ending=previous.finale.label===plan.finale.label?`締め：${plan.finale.label}`:`締めを「${previous.finale.label}」から「${plan.finale.label}」へ変更`;
  $('autoMusicRebuildDetails').textContent=[plan.programmeStyle?.description,ending].filter(Boolean).join(' · ');
  $('autoMusicRebuildFeedback').hidden=false;
  // Completion stays directly below the main rebuild action in browser and MR.
  $('autoMusicRebuild').textContent=`✓ 構成${number}を作成しました`;$('autoMusicRebuild').classList.add('is-complete');
  // The button returns to its normal action label; the adjacent confirmation stays.
  clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{
   $('autoMusicRebuild').textContent='打ち上げ玉の構成を変える';$('autoMusicRebuild').classList.remove('is-complete');rebuildTimer=null;
  },2400);
 }
 function status(text,value,error=false){$('autoMusicStatus').textContent=text;if(value!==undefined)$('autoMusicProgress').value=value;onState({busy,status:text,error,title:operationTitle,operation,progress:Number($('autoMusicProgress').value)});}
 function cancel(){if(modelId){fetch('/api/structure/cancel',{method:'POST',headers:{'X-Analysis-Id':modelId}}).catch(()=>{});modelId=null;}generation++;abort?.abort();abort=null;worker?.terminate();worker=null;cancelAnalysis?.(Error('解析を中止しました。'));cancelAnalysis=null;busy=false;controls();}
 function draw(plan){
  const canvas=$('autoMusicChart'),g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;g.clearRect(0,0,w,h);g.fillStyle='#101e31';g.fillRect(0,0,w,h);
  const max=Math.max(1e-6,...plan.energy.map(e=>e.rms));g.fillStyle='#497f9c';for(const e of plan.energy){const x=e.time/plan.duration*w,y=e.rms/max*(h-22);g.fillRect(x,h-16-y,Math.max(1,w/plan.energy.length),y);}
  for(const section of retained?.analysis.sections||[]){g.fillStyle=section.role==='chorus'?'#f5b54c55':section.role==='verse'?'#55bba733':'#7896b822';g.fillRect(section.at/plan.duration*w,0,(section.end-section.at)/plan.duration*w,h-16);}
  for(const section of plan.sections){g.fillStyle='#f6d29466';g.fillRect(section.at/plan.duration*w,0,1,h-16);}
  for(const cue of retained?.analysis.repeatAnalysis?.heads||[]){g.fillStyle='#fff4cb';g.fillRect(cue.at/plan.duration*w,0,2,h-16);}
  for(const shot of plan.shots){g.fillStyle=shot.kind==='ear'?'#6bd1ff':shot.size>=10?'#ffce7a':'#ef9dbc';g.fillRect(Math.min(w-2,shot.opening/plan.duration*w),h-12,2,shot.kind==='ear'?4:shot.size>=10?10:7);}
  for(const cue of plan.fans){g.fillStyle='#b4a1ff';g.fillRect(cue.at/plan.duration*w,h-3,3,3);}
 }
 function renderStructure(analysis,manualId){
  const panel=$('autoMusicStructure');panel.replaceChildren();
  if(!analysis.structure){panel.textContent='波形のみの構成。サビ判定は使っていません。';return;}
  const add=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;panel.append(e);return e;};
  add('h4','音源だけから推定したサビ');
  add('p',analysis.chorus.length?analysis.chorus.map(c=>timeLabel(c.at)+'〜'+timeLabel(c.end)).join(' ／ '):'このモデルはサビ区間を見つけませんでした。');
  add('p','曲構造は推定です。歌の節をAメロ・Bメロに分ける機能はまだありません。');
  const buttons=add('div','');buttons.className='auto-chorus-buttons';
  for(const [i,c] of analysis.chorus.entries()){const b=document.createElement('button');b.textContent=`候補${i+1} · ${timeLabel(c.at)}の前から観る`;b.onclick=()=>{if(!retained||busy||roomOpening)return;onReady(retained);onPreview(Math.max(0,c.at-7));};buttons.append(b);}
  add('h4','サビの中の繰り返しの頭候補');
  const repeats=analysis.repeatAnalysis;
  if(!repeats)add('p','この曲は繰り返しの追加解析がまだありません。音源を選び直すと解析できます。');
  else if(!repeats.heads.length)add('p','今回の方法では、十分に似た繰り返しの頭を見つけられませんでした。');
  else{
   add('p',repeats.heads.map(c=>timeLabel(c.at)).join(' ／ '));
   add('p','繰り返しの推定です。開花に使った頭は、構成欄で確認できます。');
   const repeatButtons=add('div','');repeatButtons.className='auto-chorus-buttons';
   for(const [i,c] of repeats.heads.entries()){
    const b=document.createElement('button');b.textContent=`繰り返し候補${i+1} · ${timeLabel(c.at)}の5秒前から観る`;
    b.onclick=()=>{if(!retained||busy||roomOpening)return;onReady(retained);onPreview(Math.max(0,c.at-5));};repeatButtons.append(b);
   }
  }
  const comparison=compareChorus(analysis,manualId);add('h4','手作り版・本人の時刻と比較');add('p',comparison.basis);
  if(comparison.scoredTargets)add('p',`記録済みのサビ開始${comparison.scoredTargets}か所中、±0.5秒：${comparison.withinHalfSecond}か所 ／ ±2秒：${comparison.withinTwoSeconds}か所。大サビの爆発は別の目標として比較。`);
  if(comparison.rows.length){const table=add('table',''),head=document.createElement('tr');for(const t of ['目標','記録','推定','ずれ']){const th=document.createElement('th');th.textContent=t;head.append(th);}table.append(head);
   for(const r of comparison.rows){const tr=document.createElement('tr');for(const t of [r.label,timeLabel(r.at),r.predicted===null?'検出なし':timeLabel(r.predicted),r.delta===null?'—':(r.delta>0?'+':'')+r.delta.toFixed(2)+'秒']){const td=document.createElement('td');td.textContent=t;tr.append(td);}table.append(tr);
    const b=document.createElement('button');b.textContent=`${r.label} · 記録の前から観る`;b.onclick=()=>{if(!retained||busy||roomOpening)return;onReady(retained);onPreview(Math.max(0,r.at-7));};panel.append(b);
   }
  }
  add('p','変化点・爆発は最も近い曲構造の境界、サビ開始はサビ区間の入りと比較。同じサビが続く中の区切りは新しいサビ開始に数えません。時刻は答え合わせ専用で、自動大会の生成には渡していません。');
 }
 function renderDirection(plan){
  $('autoMusicFeelingHint').textContent=plan.feelingDescription;
  const panel=$('autoMusicDirection');panel.replaceChildren();
  if(plan.programmeStyle){const styleInfo=document.createElement('p');styleInfo.textContent='今回の作風：'+plan.programmeStyle.description+'。「打ち上げ玉の構成を変える」で作風も替わります。';panel.append(styleInfo);}
  const feelingInfo=document.createElement('p');feelingInfo.textContent='曲調：'+plan.feelingLabel+'。'+plan.feelingDescription;panel.append(feelingInfo);
  const info=document.createElement('p');info.textContent=`${plan.directingProfile==='slow'?'ゆっくり・間を味わう。':'リズミカル。'}玉${plan.analysisSummary.shellKinds.length}種類・足元${plan.analysisSummary.groundModes.length}種類。金系３号${plan.analysisSummary.goldSmallShots}発。締め：${plan.finale.label}。`;panel.append(info);
  if(!plan.earPassages?.length){const ears=document.createElement('p');ears.textContent=plan.shots.some(s=>s.kind==='ear')?'穂はラストの余韻に絞った構成です。':'今回は穂を使わず、玉と足元で構成しています。';panel.append(ears);}
  if(plan.earPassages?.length){const ears=document.createElement('p');ears.textContent='穂の風景：'+plan.earPassages.map(c=>c.label).join(' ／ ');panel.append(ears);}
  if(plan.earPassages?.some(c=>c.bed)){const bed=document.createElement('p');bed.textContent='水田や海の景色を歌の区間にも敷き、上空の花火を重ねています。空は毎回違う並びで、色は場面の方向へゆるく寄せます。';panel.append(bed);}
  if(plan.landscapeCreativeCues?.length){const scene=document.createElement('p');scene.textContent=plan.landscapeCreativeCues.map(c=>c.label+'を重ねる（'+c.count+'発）').join(' ／ ');panel.append(scene);}
  if(plan.flowerPassages?.length){const flowers=document.createElement('p');flowers.textContent='いろんな３号の花に上空の５号・尺玉を重ねる '+plan.flowerPassages.map(c=>c.duration+'秒').join('／')+' の花畑を組み込みました。';panel.append(flowers);}
  if(plan.repeatEntryCues?.length){const repeatInfo=document.createElement('p');repeatInfo.textContent=`自動解析の繰り返しの頭${plan.repeatEntryCues.length}か所で、大輪と足元を重ね、その後に金の３号をつないでいます。`;panel.append(repeatInfo);}
  if(plan.chorusOpeningDelay){const timing=document.createElement('p');timing.textContent=`サビの判定時刻はそのまま。大輪と、それにつながる金の３号・足元の合図を${plan.chorusOpeningDelay.toFixed(1)}秒遅らせています。`;panel.append(timing);}
  const note=document.createElement('p');note.textContent='同時打ちも高さ・位置・開く時刻に微差をつけています。巻き戻しても同じ場面です。「打ち上げ玉の構成を変える」で配列とばらつきを替えられます。';panel.append(note);
  const buttons=document.createElement('div');buttons.className='auto-chorus-buttons';panel.append(buttons);
  const preview=(label,at)=>{const button=document.createElement('button');button.textContent=label;button.onclick=()=>{if(!retained||busy||roomOpening)return;onReady(retained);onPreview(Math.max(0,at));};buttons.append(button);};
  const small=plan.arrangements.find(a=>a.kind.startsWith('fast-phrase-')&&a.at>18)??plan.arrangements.find(a=>!a.kind.startsWith('ground-')&&a.at>18);
  if(small&&plan.directingProfile!=='slow')preview('小玉と足元の掛け合いを観る',small.at-4);
  for(const mode of ['single','gold','aqua','ground']){const scene=plan.slowScenes?.find(s=>s.mode===mode);if(scene)preview(scene.label+' · '+timeLabel(scene.start),scene.previewStart);}
  for(const c of plan.earPassages??[])preview(c.label+'を観る',c.start-.2);
  for(const c of plan.flowerPassages??[])preview('花の絨毯と上空の花園 · '+c.duration+'秒',c.start-.2);
  for(const [i,c] of plan.chorusFollowCues.entries())preview(`${c.repeat?'繰り返し'+c.repeatIndex:'サビ'+(i+1)} · ${plan.directingProfile==='slow'?'大輪から金の余韻へ':'ドーンから金の３号へ'}`,c.at-4);
  if(!plan.chorusFollowCues.length){const gold=plan.shots.find(s=>s.size===3&&s.anchor>10&&(['willow','silver'].includes(s.kind)||s.kind==='kiku'&&s.position.palette==='original'));if(gold)preview('金の３号を織り交ぜた場面',gold.anchor-4);}
  for(const c of plan.landscapeCreativeCues??[])preview(c.label+' · '+c.count+'発',c.start-.2);
  for(const c of plan.creativeCues??[])preview(c.label+' · '+timeLabel(c.at)+'の前から観る',c.start-.7);
  for(const [i,c] of plan.featureCues.slice(0,3).entries())preview(`大輪${i+1} · ${timeLabel(c.at)}の前から観る`,c.at-7);
  preview('ラスト · '+plan.finale.label,plan.finalPreviewStart);
 }
 function install(analysis,buffer,title,manualId=null,trackId=null){
  const plan=createAutoMusicPlan(analysis,{title,feeling:$('autoMusicFeeling').value,pacing:$('autoMusicPacing').value,earScene:$('autoMusicEars').value,variation,voiceRequest});
  retained={analysis,buffer,title,manualId,trackId,plan};if(trackId)localStorage.setItem('hanabi87-selected',trackId);onReady({plan,buffer,title,manualId,trackId});draw(plan);renderDirection(plan);renderStructure(analysis,manualId);controls();
  const upper=plan.shots.filter(s=>s.kind!=='ear').length,ears=plan.shots.length-upper,confidence=analysis.beatConfidence<.15?'拍の目安は弱め':analysis.beatConfidence<.4?'拍の目安は中程度':'拍の目安は比較的明瞭';
  status(`${title} · ${Math.floor(Math.round(plan.duration)/60)}:${String(Math.round(plan.duration)%60).padStart(2,'0')}／推定 ${analysis.bpm.toFixed(1)} BPM。大・小玉${upper}発、穂${ears}発、地上${plan.fans.length}場面。${analysis.structure?'曲構造AI・サビ候補'+analysis.chorus.length+'区間・繰り返しで開花'+(plan.repeatEntryCues?.length||0)+'か所':confidence}。${plan.directingProfile==='slow'?'組み方はゆっくり（歩幅の目安 '+plan.effectiveTempo.toFixed(1)+' BPM）。':'組み方はリズミカル。'}`,1);
  $('autoMusicAnalysisSource').textContent=analysis.structure?.model?.includes('LinkSeg')?'この端末で解析した結果':'Macで用意した解析結果';
  $('autoMusicResult').hidden=false;$('autoMusicResultTitle').textContent=title+' · 自動構成';
  $('autoMusicBuildNumber').textContent=`構成${plan.analysisSummary.variation+1}`;
  $('autoMusicWatch').textContent=`構成${plan.analysisSummary.variation+1}をこの画面で観る`;
  $('autoMusicRoom').textContent=`構成${plan.analysisSummary.variation+1}をMRで観る`;
 }
 async function generate(file=null,trackId=null,forceReanalysis=false,feelingOverride=null,voiceOverride=null){
  if(roomOpening)return;
  voiceRequest=voiceOverride;
  operation=file||forceReanalysis?'analysis':'prepare';operationTitle=file?file.name.replace(/\.[^.]+$/,''):catalog.find(t=>t.id===(trackId??$('autoMusicSample').value))?.title??'選んだ曲';
  cancel();resetRebuildFeedback();const token=generation,started=performance.now(),previousVariation=variation;busy=true;variation=0;abort=new AbortController();const localSignal=abort.signal;controls();onBegin();$('autoMusicResult').hidden=true;status(file||forceReanalysis?'解析中… 音源を読み込んでいます':'曲を読み込み中…',.02);
  try{
   let bytes,title,manualId=null,structure=null,sampleStructure=false,saved=null;const useStructure=forceReanalysis||$('autoMusicAnalysis').value==='structure';
   if(file){if(file.size>160*1024*1024)throw Error('160MB以下の音源を選んでください。');if(!/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name))throw Error('MP3・WAVなどの音声ファイルを選んでください。');bytes=await file.arrayBuffer();title=file.name.replace(/\.[^.]+$/,'');}
   else{const track=catalog.find(t=>t.id===(trackId??$('autoMusicSample').value));if(!track)throw Error('この曲は保存された曲一覧にありません。');trackId=track.id;saved=await readLocalTrack(trackId);if(saved?.bytes){bytes=saved.bytes;title=saved.title;}else{const response=await fetch(track.src,{signal:localSignal});if(!response.ok)throw Error('曲を読み込めませんでした。');bytes=await response.arrayBuffer();title=track.title;}manualId=track.authored===false?null:track.id;sampleStructure=true;}
   if(token!==generation)return;
   await preferenceQueue.catch(()=>{});if(trackId&&trackId!==retained?.trackId){const pref=await readTrackFeeling(trackId);$('autoMusicFeeling').value=musicFeeling(feelingOverride??pref?.feeling).value;}

   if(feelingOverride)$('autoMusicFeeling').value=musicFeeling(feelingOverride).value;
   if(token!==generation)return;status('曲の波形を準備中…',.05);
   const decoder=new OfflineAudioContext(1,1,22050);let buffer;try{buffer=await decoder.decodeAudioData(bytes.slice(0));}catch{throw Error('音源を開けませんでした。対応するMP3・WAVを選んでください。');}
   if(token!==generation)return;if(buffer.duration<12||buffer.duration>600)throw Error('この試作では12秒〜10分の曲を選んでください。');
   if(useStructure&&saved?.analysis&&!forceReanalysis){busy=false;install(saved.analysis,buffer,title,manualId,trackId);status(`${title} · この端末に保存した解析で構成${variation+1}を準備しました。再解析はしていません。`,1);return retained;}
   if(useStructure&&(forceReanalysis||file||!saved?.analysis)){
    operation='analysis';const result=await analyzeInBrowser(buffer,{signal:localSignal,onProgress:(phase,progress)=>{if(token===generation)status(phase,progress);}});
    if(token!==generation)return;
    createAutoMusicPlan(result.analysis,{title,feeling:$('autoMusicFeeling').value,pacing:$('autoMusicPacing').value,earScene:$('autoMusicEars').value,variation,voiceRequest});
    const elapsed=+((performance.now()-started)/1000).toFixed(3);
    const savedTrack=await saveLocalTrack({bytes,title,trackId,analysis:result.analysis,structure:result.structure,endToEndSeconds:elapsed,workerTotalSeconds:result.workerTotalSeconds,signal:localSignal});
    if(token!==generation)return;
    trackId=savedTrack.trackId;title=savedTrack.title;const existing=catalog.find(t=>t.id===trackId);if(existing){existing.local=true;existing.deleted=false;existing.title=title;existing.sourceTitle=savedTrack.sourceTitle;}else catalog.push({id:trackId,title,sourceTitle:savedTrack.sourceTitle,authored:false,local:true});syncCatalog();
    $('autoMusicSample').value=trackId;busy=false;install(result.analysis,buffer,title,manualId,trackId);
    $('autoMusicAnalysisSource').textContent=`この端末で解析 · ${elapsed.toFixed(2)}秒 · サビ${result.analysis.chorus.length}区間 · 保存済み`;
    status(`${title} · この端末での解析が完了（${elapsed.toFixed(2)}秒）。音源と解析を保存し、構成1を準備しました。`,1);return retained;
   }

   // Box-average resampling and mono mixing, bounded chunks keep the UI responsive.
   const rate=11025,length=Math.floor(buffer.duration*rate),mono=new Float32Array(length),channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),ratio=buffer.sampleRate/rate;
   for(let i=0;i<length;i++){
    const lo=Math.floor(i*ratio),hi=Math.min(buffer.length,Math.max(lo+1,Math.floor((i+1)*ratio)));let sum=0;for(let j=lo;j<hi;j++)for(const c of channels)sum+=c[j];mono[i]=sum/((hi-lo)*channels.length);
    if(i%131072===0){await new Promise(resolve=>setTimeout(resolve,0));if(token!==generation)return;}
   }
   operation='analysis';status('拍・強弱・音の変化を解析中…',.10);
   let analysis=await new Promise((resolve,reject)=>{
    cancelAnalysis=reject;
    const current=new Worker(new URL('./music-analysis-worker.js',import.meta.url),{type:'module'});worker=current;
    current.onmessage=({data})=>{if(token!==generation)return;if(data.progress!==undefined)status('拍・強弱・音の変化を解析中…',.10+data.progress*.80);if(data.error){current.terminate();worker=null;cancelAnalysis=null;reject(Error(data.error));}if(data.result){current.terminate();worker=null;cancelAnalysis=null;resolve(data.result);}};
    current.onerror=()=>{current.terminate();worker=null;cancelAnalysis=null;reject(Error('解析処理を開始できませんでした。ページを再読み込みしてください。'));};
    current.postMessage({samples:mono,sampleRate:rate},[mono.buffer]);
   });
   if(token!==generation)return;
   if(useStructure){
    if(!structure){
     status('このMacでサビ・歌の節・拍を解析中…（初回は数分かかることがあります）',.88);
     const count=Math.min(2,buffer.numberOfChannels),pcm=new Float32Array(buffer.length*count),input=Array.from({length:count},(_,i)=>buffer.getChannelData(i));
     for(let i=0;i<buffer.length;i++){for(let c=0;c<count;c++)pcm[i*count+c]=input[c][i];if(i%131072===0){await new Promise(r=>setTimeout(r,0));if(token!==generation)return;}}
     modelId=crypto.randomUUID();abort=new AbortController();let response;
     try{response=await fetch('/api/structure',{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/octet-stream','X-Sample-Rate':String(buffer.sampleRate),'X-Channels':String(count),'X-Analysis-Id':modelId},body:pcm.buffer});}catch(error){if(error.name==='AbortError')throw error;throw Error('このMacの曲構造解析サーバーに接続できません。波形のみを選ぶと従来の構成で試せます。');}
     if(token!==generation)return;try{structure=await response.json();}catch{throw Error('曲構造解析サーバーを起動してください。波形のみでも試せます。');}modelId=null;if(!response.ok||structure.error)throw Error(structure.error||'曲構造を解析できませんでした。');
    }
    analysis=applyMusicStructure(analysis,structure);
   }
   if(token!==generation)return;
   if(useStructure&&sampleStructure){
    const savedTrack=await saveLocalTrack({bytes,title,trackId,analysis,structure,endToEndSeconds:+((performance.now()-started)/1000).toFixed(3),signal:localSignal});
    if(token!==generation)return;
    trackId=savedTrack.trackId;const track=catalog.find(t=>t.id===trackId);if(track)track.local=true;syncCatalog();
   }
   status('花火大会を組み立て中…',.95);busy=false;install(analysis,buffer,title,manualId,trackId);return retained;
  }catch(error){if(token!==generation)return;variation=previousVariation;busy=false;controls();status(error.message||'曲を解析できませんでした。',0,true);if(retained){$('autoMusicResult').hidden=false;draw(retained.plan);}return null;}
 }
 async function generateOriginalTrack(id){
  operation='original';
  if(roomOpening)return null;
  operationTitle=catalog.find(t=>t.id===id)?.title??'選んだ曲';
  cancel();resetRebuildFeedback();const token=generation;busy=true;abort=new AbortController();const signal=abort.signal;controls();onBegin();status('手作りの構成と音源を準備中…',.02);
  try{
   await preferenceQueue.catch(()=>{});if(token!==generation)return null;
   const track=catalog.find(t=>t.id===id);if(!track)throw Error('曲が見つかりません。');
   const saved=await readLocalTrack(id);let bytes=saved?.bytes;
   if(!bytes){const response=await fetch(track.src,{signal});if(!response.ok)throw Error('音源を読み込めませんでした（'+response.status+'）。');bytes=await response.arrayBuffer();}
   if(token!==generation)return null;
   const decoder=new OfflineAudioContext(1,1,22050),buffer=await decoder.decodeAudioData(bytes.slice(0));
   if(token!==generation)return null;
   await saveTrackFeeling(id,'original');localStorage.setItem('hanabi87-selected',id);
   if(token!==generation)return null;busy=false;
   const result={trackId:id,title:track.title,buffer};onOriginalReady(result);controls();
   status(track.title+' · オリジナルプログラムを準備しました。',1);return result;
  }catch(error){if(token!==generation)return null;busy=false;controls();status(error.message||'手作りの構成を準備できませんでした。',0,true);return null;}
 }
 $('autoMusicReanalyze').onclick=()=>{if(!busy&&!roomOpening){$('autoMusicAnalysis').value='structure';return generate(null,null,true);}};
 $('autoMusicGenerate').onclick=()=>generate();fileInput.onchange=()=>{const file=fileInput.files[0];if(file)generate(file);fileInput.value='';};
 $('autoMusicCancel').onclick=()=>{cancel();status('解析を中止しました。別の曲を選べます。',0);if(retained){variation=retained.plan.analysisSummary.variation;$('autoMusicResult').hidden=false;}};
 $('autoMusicEars').onchange=()=>{
  if(!retained||busy||roomOpening)return;
  voiceRequest=null;resetRebuildFeedback();install(retained.analysis,retained.buffer,retained.title,retained.manualId,retained.trackId);
 };
 $('autoMusicPacing').onchange=()=>{if(retained&&!busy&&!roomOpening){voiceRequest=null;resetRebuildFeedback();install(retained.analysis,retained.buffer,retained.title,retained.manualId,retained.trackId);}};
 $('autoMusicFeeling').onchange=()=>{
  if(busy||roomOpening)return;
  voiceRequest=null;const chosen=$('autoMusicSample').value,feeling=$('autoMusicFeeling').value;
  preferenceQueue=preferenceQueue.catch(()=>{}).then(()=>saveTrackFeeling(chosen,feeling));
  preferenceQueue.catch(e=>status('曲調を保存できませんでした：'+e.message));
  $('autoMusicFeelingHint').textContent=musicFeeling(feeling).description;
  if(!retained||chosen!==retained.trackId){status('「'+musicFeeling(feeling).label+'」を選びました。「この曲の大会を準備する」で組みます。');return;}
  const started=performance.now(),before=retained;
  try{resetRebuildFeedback();install(before.analysis,before.buffer,before.title,before.manualId,before.trackId);const ms=+(performance.now()-started).toFixed(1);status(`${before.title} · 「${musicFeeling($('autoMusicFeeling').value).label}」で組み直しました（${ms}ms）。保存した解析を使っています。`,1);$('autoMusicFeelingHint').textContent=musicFeeling($('autoMusicFeeling').value).description;return true;}
  catch(error){retained=before;status('曲調で組み直せませんでした：'+error.message);return false;}
 };
 $('autoMusicRebuild').onclick=()=>{
  if(!retained||busy||roomOpening)return;
  const previous=retained,previousVariation=variation;
  try{variation++;install(previous.analysis,previous.buffer,previous.title,previous.manualId,previous.trackId);rebuildFeedback(previous.plan,retained.plan);onRebuilt(retained.plan);}
  catch(error){variation=previousVariation;retained=previous;resetRebuildFeedback();status('作り直せませんでした。'+(error.message||'もう一度お試しください。'));}
 };
 $('autoMusicRoom').onclick=async()=>{
  if(!retained||busy||roomOpening||!onRoom||$('mr').disabled)return;
  roomOpening=true;controls();$('autoMusicRoom').textContent='部屋に入っています…';
  try{await onRoom(retained);}finally{roomOpening=false;$('autoMusicRoom').textContent=`構成${retained.plan.analysisSummary.variation+1}をMRで観る`;controls();}
 };
 if(typeof MutationObserver!=='undefined')new MutationObserver(controls).observe($('mr'),{attributes:true,attributeFilter:['disabled']});
 $('autoMusicWatch').onclick=()=>{if(!retained||busy||roomOpening)return;onReady(retained);document.getElementById('musicShow').click();};
 $('autoMusicManual').onclick=()=>{if(retained?.manualId&&!busy&&!roomOpening)onManual(retained.manualId);};
 $('autoMusicExport').onclick=()=>{
  if(!retained)return;const blob=new Blob([JSON.stringify({build:'1.3.1',title:retained.title,analysis:retained.analysis,plan:retained.plan},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=retained.title.replace(/[\\/:*?"<>|]/g,'_')+'-自動大会.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 for(const event of ['dragenter','dragover'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.add('dragging');});
 drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');if(e.dataTransfer.files[0])generate(e.dataTransfer.files[0]);});
 const repeatClock=document.createElement('p');repeatClock.id='betaRepeatCue';repeatClock.className='auto-repeat-clock';
 document.getElementById('betaReviewBar').append(repeatClock);
 setInterval(()=>{
  const heads=retained?.analysis.repeatAnalysis?.heads||[];
  const at=Number(document.getElementById('betaMusicSeek').value);
  const current=heads.findIndex(c=>at>=c.at-.08&&at<c.at+1.5);
  const next=heads.findIndex(c=>c.at>at);
  const text=current>=0?`繰り返し候補${current+1} · ${timeLabel(heads[current].at)}`:next>=0?`次の繰り返し候補${next+1}まで ${(heads[next].at-at).toFixed(1)}秒`:'';
  if(repeatClock.textContent!==text)repeatClock.textContent=text;
 },100);
 controls();
 async function restoreLibrary(){
  await migratePrevious42();await migrateLatest41();
  const [names,trash,tracks]=await Promise.all([listTrackTitles(),listDeletedTracks(),listLocalTracks({includeDeleted:true})]);
  const deleted=new Set(trash.filter(t=>t.deletedAt).map(t=>t.trackId));catalog.splice(0,catalog.length,...baseCatalog.map(t=>({...t})));
  for(const t of tracks){const existing=catalog.find(c=>c.id===t.trackId);if(existing){existing.local=true;existing.title=t.title;existing.sourceTitle=t.sourceTitle;}else catalog.push({id:t.trackId,title:t.title,sourceTitle:t.sourceTitle,authored:false,local:true});}
  for(const named of names){const c=catalog.find(t=>t.id===named.trackId);if(c){c.title=named.title;c.sourceTitle=named.sourceTitle;}}
  for(const track of catalog)track.deleted=deleted.has(track.id);syncCatalog();return tracks.filter(t=>!t.deleted);
 }
 async function deleteTrack(id){if(busy||roomOpening)throw Error('曲の準備が終わってからお試しください。');const entry=catalog.find(t=>t.id===id);if(!entry)throw Error('曲が見つかりません。');await setTrackDeleted(id,true);entry.deleted=true;if(retained?.trackId===id)retained=null;syncCatalog();controls();return {...entry};}
 async function restoreTrack(id){await setTrackDeleted(id,false);await restoreLibrary();return catalog.find(t=>t.id===id);}

 async function renameTrack(id,title){
  if(busy||roomOpening)throw Error('曲の準備が終わってからお試しください。');
  const entry=catalog.find(t=>t.id===id);if(!entry)throw Error('この曲が曲一覧に見つかりません。');
  const named=await renameTrackTitle(id,title,entry.title);entry.title=named.title;entry.sourceTitle=named.sourceTitle;
  if(retained?.trackId===id){retained.title=named.title;operationTitle=named.title;$('autoMusicResultTitle').textContent=named.title+' · 自動構成';}
  syncCatalog();return named;
 }
 return {clearVoiceRequest(){voiceRequest=null;},restoreLibrary,renameTrack,deleteTrack,restoreTrack,generateOriginalTrack,reanalyzeTrack(id){$('autoMusicSample').value=id;$('autoMusicAnalysis').value='structure';return generate(null,id,true);},get result(){return retained;},applyVoiceRequest(request){if(!retained||busy||roomOpening)return null;const before=retained,oldVariation=variation,oldVoice=voiceRequest;try{variation++;voiceRequest=request;install(before.analysis,before.buffer,before.title,before.manualId,before.trackId);rebuildFeedback(before.plan,retained.plan);return retained;}catch(e){voiceRequest=oldVoice;variation=oldVariation;retained=before;throw e;}},get busy(){return busy;},cancel,generateTrack(id,feeling=null,request=null){$('autoMusicSample').value=id;return generate(null,id,false,feeling,request);},useSavedTrack(track,buffer,selectedVariation=0){cancel();variation=Math.max(0,Math.floor(Number(selectedVariation)||0));resetRebuildFeedback();install(track.analysis,buffer,track.title,null,null);}};
}
