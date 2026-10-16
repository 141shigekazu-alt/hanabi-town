// Same origin as v41, but separate records: its latest saved song is untouched.
const DATABASE='hanabi-local-imports-study41',PREFIX='track86:';
async function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DATABASE,1);r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function read(id){const db=await open();try{return await new Promise((resolve,reject)=>{const r=db.transaction('tracks').objectStore('tracks').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
async function put(track,signal){const db=await open();try{await new Promise((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('解析を中止しました。','AbortError'));return;}const tx=db.transaction('tracks','readwrite'),abort=()=>tx.abort();signal?.addEventListener('abort',abort,{once:true});const finish=(fn,value)=>{signal?.removeEventListener('abort',abort);fn(value);};tx.objectStore('tracks').put(track);tx.oncomplete=()=>finish(resolve);tx.onerror=()=>finish(reject,tx.error);tx.onabort=()=>finish(reject,tx.error||Error('保存を中止しました。'));});}finally{db.close();}}
async function readPrefix(prefix){const db=await open();try{return await new Promise((resolve,reject)=>{const q=db.transaction('tracks').objectStore('tracks').getAll(IDBKeyRange.bound(prefix,prefix+'\uffff'));q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}finally{db.close();}}
export const listTrackTitles=()=>readPrefix('title86:');
export const listDeletedTracks=()=>readPrefix('trash86:');
export async function setTrackDeleted(trackId,deleted=true){if(!trackId||trackId==='none')throw Error('曲を選んでください。');await put({id:'trash86:'+trackId,trackId,deletedAt:deleted?new Date().toISOString():null});}

export async function renameTrackTitle(trackId,title,sourceTitle=title){
 const name=String(title).trim();if(!name)throw Error('曲名を入力してください。');if(name.length>100)throw Error('曲名は100文字以内にしてください。');
 if(!trackId||trackId==='none')throw Error('名前を変える曲を選んでください。');
 const previous=await read('title86:'+trackId);
 const record={id:'title86:'+trackId,trackId,title:name,sourceTitle:previous?.sourceTitle??sourceTitle,savedAt:new Date().toISOString()};await put(record);return record;
}
export async function listLocalTracks({includeDeleted=false}={}){const [names,trash,tracks]=await Promise.all([listTrackTitles(),listDeletedTracks(),readPrefix(PREFIX)]),titles=new Map(names.map(t=>[t.trackId,t])),deleted=new Set(trash.filter(t=>t.deletedAt).map(t=>t.trackId));return tracks.filter(t=>includeDeleted||!deleted.has(t.trackId)).map(t=>({...t,sourceTitle:titles.get(t.trackId)?.sourceTitle??t.sourceTitle??t.title,title:titles.get(t.trackId)?.title??t.title,deleted:deleted.has(t.trackId)}));}

export async function migrateLatest41(){const track=await read('latest');if(!track?.bytes||!track.analysis)return null;const trackId='import:'+track.sha256;const existing=await read(PREFIX+trackId);if(existing)return existing;const copy={...track,id:PREFIX+trackId,trackId,imported:true};await put(copy);return copy;}
export async function readLocalTrack(trackId){const [track,title]=await Promise.all([read(PREFIX+trackId),read('title86:'+trackId)]);return track?{...track,sourceTitle:title?.sourceTitle??track.sourceTitle??track.title,title:title?.title??track.title}:track;}
export async function saveLocalTrack({bytes,title,trackId,analysis,structure,endToEndSeconds,workerTotalSeconds,signal}){
 if(signal?.aborted)throw new DOMException('解析を中止しました。','AbortError');
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 trackId??='import:'+sha256;
 const named=await read('title86:'+trackId),sourceTitle=named?.sourceTitle??title;title=named?.title??title;
 const track={id:PREFIX+trackId,trackId,title,sourceTitle,sha256,bytes,analysis,structure,endToEndSeconds,workerTotalSeconds,imported:trackId.startsWith('import:'),savedAt:new Date().toISOString()};
 if(signal?.aborted)throw new DOMException('解析を中止しました。','AbortError');
 await put(track,signal);await setTrackDeleted(trackId,false);return track;
}
export async function analyzeInBrowser(buffer,{signal,onProgress=()=>{}}={}){
 const samples=new Float32Array(buffer.length);
 for(let c=0;c<buffer.numberOfChannels;c++){const channel=buffer.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=channel[i]/buffer.numberOfChannels;}
 if(signal?.aborted)throw new DOMException('解析を中止しました。','AbortError');
 const worker=new Worker(new URL('./quest-structure-worker.js',import.meta.url),{type:'module'});
 try{return await new Promise((resolve,reject)=>{
  const aborted=()=>reject(new DOMException('解析を中止しました。','AbortError'));
  const finish=(fn,value)=>{signal?.removeEventListener('abort',aborted);fn(value);};
  signal?.addEventListener('abort',aborted,{once:true});
  worker.onmessage=({data})=>{if(data.phase)onProgress(data.phase,data.progress);if(data.error)finish(reject,Error(data.error));if(data.result){if(!data.result.activationDiagnostics.finite)finish(reject,Error('解析結果が不正です。前の解析を保持します。'));else finish(resolve,data.result);}};
  worker.onerror=e=>finish(reject,Error(e.message||'解析を開始できませんでした。'));
  // No Mac analysis, song title, human TC, or network reporting enters inference.
  worker.postMessage({samples:samples.buffer,sampleRate:buffer.sampleRate,backend:'wasm'},[samples.buffer]);
 });}finally{worker.terminate();}
}

export async function migratePrevious42(){
 if(await read('migration86:85-84-83-82-81-80-79-78-77-76-75-74-73-72-71-70-69-68-67-66-65-64-63-62-61-60-59-58-57-56-55-54-53-52-51-50-49-48-47-46-45-44-43-42'))return;
 const db=await open();let previous;
 try{previous=await new Promise((resolve,reject)=>{const q=db.transaction('tracks').objectStore('tracks').getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}finally{db.close();}
 // Newest version wins; every write has a new key and leaves 42/43 intact.
 for(const prefix of ['track85:','track84:','track83:','track82:','track81:','track80:','track79:','track78:','track77:','track76:','track75:','track74:','track73:','track72:','track71:','track70:','track69:','track68:','track67:','track66:','track65:','track64:','track63:','track62:','track61:','track60:','track59:','track58:','track57:','track56:','track55:','track54:','track53:','track52:','track51:','track50:','track49:','track48:','track47:','track46:','track45:','track44:','track43:','track42:'])for(const t of previous.filter(t=>t.id.startsWith(prefix)))if(!await read(PREFIX+t.trackId))await put({...t,id:PREFIX+t.trackId});
 for(const prefix of ['feeling85:','feeling84:','feeling83:','feeling82:','feeling81:','feeling80:','feeling79:','feeling78:','feeling77:','feeling76:','feeling75:','feeling74:','feeling73:','feeling72:','feeling71:','feeling70:','feeling69:','feeling68:','feeling67:','feeling66:','feeling65:','feeling64:','feeling63:','feeling62:','feeling61:','feeling60:','feeling59:','feeling58:','feeling57:','feeling56:','feeling55:','feeling54:','feeling53:','feeling52:','feeling51:','feeling50:','feeling49:','feeling48:','feeling47:','feeling46:','feeling45:','feeling44:','feeling43:'])for(const t of previous.filter(t=>t.id.startsWith(prefix))){const id=t.id.replace(prefix,'feeling86:');if(!await read(id))await put({...t,id});}
 for(const prefix of ['title85:','trash85:','title84:','trash84:','title83:','trash83:','title82:','trash82:','title81:','trash81:','title80:','trash80:','title79:','trash79:','title78:','trash78:','title77:','trash77:','title76:','trash76:','title75:','trash75:','title74:','trash74:','title73:','trash73:','title72:','trash72:','title71:','trash71:','title70:','trash70:','title69:','trash69:','title68:','trash68:','title67:','trash67:','title66:','trash66:','title65:','trash65:','title64:','trash64:','title63:','trash63:','title62:','trash62:','title61:','trash61:','title60:','trash60:','title59:','trash59:','title58:','trash58:','title57:','trash57:','title56:','trash56:','title55:','trash55:'])for(const t of previous.filter(t=>t.id.startsWith(prefix))){const id=t.id.replace(prefix,prefix.replace(/\d+:$/,'86:'));if(!await read(id))await put({...t,id});}
 await put({id:'migration86:85-84-83-82-81-80-79-78-77-76-75-74-73-72-71-70-69-68-67-66-65-64-63-62-61-60-59-58-57-56-55-54-53-52-51-50-49-48-47-46-45-44-43-42',complete:true});
}

export const readTrackFeeling=trackId=>trackId?read('feeling86:'+trackId):Promise.resolve(null);
export async function saveTrackFeeling(trackId,feeling){if(trackId)await put({id:'feeling86:'+trackId,feeling,savedAt:new Date().toISOString()});}
