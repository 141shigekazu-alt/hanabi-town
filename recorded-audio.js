import {samples} from './firework-samples.js?v=1.1.48';

export const WHISTLE_VARIANTS=['Whistle_01','Whistle_02','Whistle_03','Whistle_04','Whistle_05','Whistle_06'];
export const OPENING_SAMPLES={3:'Shoot_A_01',5:'Shoot_A_03',10:'Shoot_A_10',20:'Shoot_B_05'};
export const OPENING_VARIANTS={3:["Shoot_A_01","Shoot_A_02","Shoot_A_04","Shoot_A_08","Shoot_A_09"],5:["Shoot_A_03","Shoot_A_05","Shoot_A_07","Shoot_B_01","Shoot_B_02"],10:["Shoot_A_10","Shoot_A_11","Shoot_B_03","Shoot_B_04"],20:["Shoot_B_05","Shoot_B_06"]};
export function recordedSamples(key){
 const sample=samples[key],bytes=Uint8Array.from(atob(sample.data),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer),data=new Float32Array(bytes.length/2);
 for(let i=0;i<data.length;i++)data[i]=view.getInt16(i*2,true)/32768;
 return {data,rate:sample.rate,onset:sample.onset};
}
export function lowpassSamples(data,hz,rate=48000){
 const out=new Float32Array(data.length),a=1-Math.exp(-2*Math.PI*hz/rate);let y=0;
 for(let i=0;i<data.length;i++){y+=a*(data[i]-y);out[i]=y;}return out;
}
// The exact short recording component of audition D, including its fade.
export function shortRecordedLaunch(key,fadeTail,size=3){
 const {data,rate,onset}=recordedSamples(key),start=Math.floor(onset*rate),five=size===5,duration=five?.70:.32,out=lowpassSamples(data.slice(start,start+Math.round(duration*rate)),1300,rate);let peak=0;
 for(let i=0;i<out.length;i++){
  const t=i/rate,attack=Math.min(1,i/(rate*.0015)),original=Math.fround(out[i]*(Math.exp(-t/.105)*attack));
  if(i<Math.round(.32*rate))peak=Math.max(peak,Math.abs(original));
  if(five){const u=Math.max(0,Math.min(1,(t-.12)/.12)),mix=u*u*(3-2*u),longer=Math.exp(-.12/.105-(t-.12)/.20);out[i]=out[i]*attack*(Math.exp(-t/.105)*(1-mix)+longer*mix);}else out[i]=original;
 }
 const gain=peak?.75/peak:0;for(let i=0;i<out.length;i++)out[i]*=gain;
 return fadeTail(out,rate,five?.18:.075);
}
// A launch uses only a short, filtered recording. No synthesized pressure layer.
export function recordedLaunchSamples(key,fadeTail,size=3){
 const rate=48000,data=shortRecordedLaunch(key,fadeTail,size);for(let i=0;i<data.length;i++)data[i]*=.22;
 return {data,rate};
}
// Lift the existing five-go decay gently; keep its attack, full length and phase.
// This adds no echoes, copied fragments or invented sound after the recording.
export function fiveGoOpeningDecay(data,rate,onset){
 const out=data.slice();
 for(let i=0;i<out.length;i++){const u=Math.max(0,Math.min(1,(i/rate-onset-.20)/.35));out[i]*=1+.45*u*u*(3-2*u);}
 return out;
}
// Legacy B space retained only as a very quiet feed for spark textures.
export function recordedReverbBuffer(context,fadeTail){
 const rate=context.sampleRate,n=Math.ceil(rate*4.8),buffer=context.createBuffer(2,n,rate),a=rate===48000?.065:1-Math.pow(1-.065,48000/rate);let seed=1411138;
 for(let c=0;c<2;c++){
  const d=buffer.getChannelData(c);let low=0;
  for(let i=0;i<n;i++){const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;low+=(seed/4294967296*2-1-low)*a;d[i]=t<.09?0:low*Math.exp(-(t-.09)/1.1)*Math.min(1,(t-.09)/.16);}
  fadeTail(d,rate,1.2);
 }
 let sum=0;for(let c=0;c<2;c++)for(const v of buffer.getChannelData(c))sum+=v*v;
 const scale=Math.sqrt(2/Math.max(sum,1e-12));for(let c=0;c<2;c++){const d=buffer.getChannelData(c);for(let i=0;i<n;i++)d[i]*=scale;}
 return buffer;
}

// Reorder short forward-playing parts within each phase of the crackle.
// Keep the opening, overall decay and duration; soften every new join.
export function variedCrackleBuffer(context,original,key,index,fadeTail){
 const rate=original.sampleRate,data=original.getChannelData(0).slice(),start=Math.round(rate*.05),grain=Math.round(rate*.14),count=key==='Crack_A_01'?12:8;
 let seed=(0x141142+index*7919+(key==='Crack_A_01'?101:303))>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const order=Array.from({length:count},(_,i)=>i);
 for(let group=0;group<count;group+=4){for(let j=Math.min(count-1,group+3);j>group;j--){const k=group+Math.floor(random()*(j-group+1));[order[j],order[k]]=[order[k],order[j]];}}
 const originalData=original.getChannelData(0),fade=Math.round(rate*.006);
 for(let block=0;block<count;block++)for(let i=0;i<grain;i++){
  const at=start+block*grain,from=start+order[block]*grain+i;
  const edge=Math.min(1,i/fade,(grain-1-i)/fade),gain=.5-.5*Math.cos(Math.PI*Math.max(0,edge));
  data[at+i]=originalData[from]*gain;
  // Blend into the untouched start and decay instead of cutting them to zero.
  if(block===0&&i<fade||block===count-1&&i>=grain-fade)data[at+i]+=originalData[at+i]*(1-gain);
 }
 fadeTail(data,rate,.3);const buffer=context.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);return buffer;
}

// Forward overlap-add stretches the noisy tail while keeping local pitch.
// Normalize the overlap weights so joins cannot add unexpected peaks.
export function stretchedCrackleBuffer(context,original,factor,fadeTail){
 const rate=original.sampleRate,raw=original.getChannelData(0),length=Math.round(raw.length*factor),data=new Float32Array(length),weights=new Float32Array(length);
 const grain=Math.round(rate*.09),hop=Math.round(rate*.06),edge=grain-hop;
 for(let at=-hop;at<length;at+=hop){
  const from=Math.round(at/factor);
  for(let i=0;i<grain;i++){
   const target=at+i,source=from+i;if(target<0||target>=length||source<0||source>=raw.length)continue;
   const ramp=Math.min(1,i/edge,(grain-1-i)/edge),w=.5-.5*Math.cos(Math.PI*Math.max(0,ramp));
   data[target]+=raw[source]*w;weights[target]+=w;
  }
 }
 for(let i=0;i<length;i++)if(weights[i]>1e-6)data[i]/=weights[i];
 // Preserve the original attack, blending into the stretched texture over 20ms.
 const head=Math.round(rate*.03),blend=Math.round(rate*.02);
 for(let i=0;i<head+blend;i++){const w=Math.max(0,Math.min(1,(i-head)/blend));data[i]=raw[i]*(1-w)+data[i]*w;}
 fadeTail(data,rate,.3*factor);const buffer=context.createBuffer(1,length,rate);buffer.copyToChannel(data,0);return buffer;
}
