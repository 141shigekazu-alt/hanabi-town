export const RECORDED_SEND_PROFILE=Object.freeze({gain:.012,pan:.18,files:['./manual-send-shot-1.wav','./manual-send-shot-2.wav']});
let buffers=null,loading=null,played=0,lastShot=null;
// Decode before any trigger gesture; OfflineAudioContext needs no audio unlock.
export function prepareRecordedSend(){
 if(buffers)return Promise.resolve(buffers);
 if(!loading)loading=(async()=>{const decoder=new OfflineAudioContext(2,1,48000);const bytes=await Promise.all(RECORDED_SEND_PROFILE.files.map(async path=>{const response=await fetch(new URL(path,import.meta.url));if(!response.ok)throw Error('Send sound '+response.status);return response.arrayBuffer();}));buffers=await Promise.all(bytes.map(b=>decoder.decodeAudioData(b)));return buffers;})();
 return loading;
}
export function recordedSendState(){return{ready:!!buffers,played,lastShot,nextShot:played%2+1,durations:buffers?.map(b=>b.duration)??[]};}
export function playRecordedSend(context,destination,hand='right'){
 if(!context||context.state==='closed'||!destination)return false;
 if(!buffers){prepareRecordedSend().catch(()=>{});return false;}
 const index=played%2,source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();source.buffer=buffers[index];gain.gain.value=RECORDED_SEND_PROFILE.gain;pan.pan.value=hand==='left'?-RECORDED_SEND_PROFILE.pan:RECORDED_SEND_PROFILE.pan;
 source.connect(gain).connect(pan).connect(destination);source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();};source.start();played++;lastShot=index+1;return true;
}
