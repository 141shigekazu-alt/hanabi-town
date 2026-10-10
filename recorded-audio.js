import {samples} from './firework-samples.js?v=1.1.51';

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

// Choose irregular forward segments within each phase of the crackle.
// Overlap joins instead of periodically fading each block to silence.
export function variedCrackleBuffer(context,original,key,index,fadeTail){
 const rate=original.sampleRate,raw=original.getChannelData(0),data=raw.slice(),start=Math.round(rate*.05),end=Math.min(raw.length-Math.round(rate*.05),start+Math.round(rate*(key==='Crack_A_01'?1.68:1.12)));
 let seed=(0x141150+index*7919+(key==='Crack_A_01'?101:303))>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let cursor=start;
 while(cursor<end){
  const length=Math.min(end-cursor,Math.round(rate*(.095+random()*.115))),overlap=Math.min(length,Math.round(rate*(.014+random()*.010)));
  const phase=Math.floor((cursor-start)/(rate*.42)),lo=start+Math.round(phase*rate*.42),hi=Math.min(raw.length-length,lo+Math.round(rate*.42));
  const from=Math.max(0,Math.round(lo+random()*Math.max(0,hi-lo)));
  for(let i=0;i<length;i++){const at=cursor+i,w=i<overlap?.5-.5*Math.cos(Math.PI*i/overlap):1;data[at]=data[at]*(1-w)+raw[from+i]*w;}
  if(cursor+length>=end)break;cursor+=Math.max(1,length-overlap);
 }
 const edge=Math.round(rate*.024);for(let i=Math.max(start,end-edge);i<end;i++){const w=.5-.5*Math.cos(Math.PI*(i-(end-edge))/edge);data[i]=data[i]*(1-w)+raw[i]*w;}
 fadeTail(data,rate,.3);const buffer=context.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);return buffer;
}

// Forward overlap-add stretches the noisy tail while keeping local pitch.
// Normalize the overlap weights so joins cannot add unexpected peaks.
export function stretchedCrackleBuffer(context,original,factor,fadeTail,index=0){
 const rate=original.sampleRate,raw=original.getChannelData(0),length=Math.round(raw.length*factor),data=new Float32Array(length),weights=new Float32Array(length);
 const grain=Math.round(rate*.12),edge=Math.round(rate*.03);let seed=(1411150+index*7919)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let at=-Math.round(rate*.06);at<length;at+=Math.round(rate*(.044+random()*.034))){
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

// Short, broad outdoor coda. No fixed echo taps or resonant low-frequency room.
export function recordedLateReverbBuffer(context,fadeTail){
 const rate=context.sampleRate,n=Math.ceil(rate*1.25),buffer=context.createBuffer(2,n,rate);let seed=1411149,sum=0;
 const lo=1-Math.exp(-2*Math.PI*180/rate),hi=1-Math.exp(-2*Math.PI*2400/rate);
 for(let c=0;c<2;c++){const d=buffer.getChannelData(c);let bass=0,air=0;
  for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1;bass+=lo*(noise-bass);air+=hi*(noise-air);const t=i/rate;d[i]=t<.035?0:(air-bass)*Math.exp(-(t-.035)/.23)*Math.min(1,(t-.035)/.04);}
  fadeTail(d,rate,.30);for(const v of d)sum+=v*v;
 }
 const gain=Math.sqrt(2/Math.max(sum,1e-12));for(let c=0;c<2;c++){const d=buffer.getChannelData(c);for(let i=0;i<n;i++)d[i]*=gain;}
 return buffer;
}

// Uneven, one-pass outdoor reflections. No feedback loop or periodic echo taps.
// Each distant return is a short broad cluster, progressively quieter.
export function recordedOutdoorReflectionBuffer(context,fadeTail,small=false){
 const rate=context.sampleRate,n=Math.ceil(rate*(small?1.6:5.3)),buffer=context.createBuffer(2,n,rate);let seed=1411150;
 const centers=small?[.13,.29,.52,.84,1.18]:[.18,.33,.57,.91,1.36,1.92,2.62,3.24,3.94,4.81],weights=small?[1,.60,.34,.16,.07]:[1,.72,.48,.32,.21,.13,.075,.04,.028,.016];
 for(let channel=0;channel<2;channel++){
  seed=1411150;if(channel===1)for(let j=0;j<8;j++)for(let k=0;k<Math.round((.048+j*.011)*rate);k++)seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const d=buffer.getChannelData(channel);
  centers.forEach((center,j)=>{const start=Math.round((center+channel*(j%2?.017:-.009))*rate),length=Math.round((.048+j*.011)*rate),a=1-Math.exp(-2*Math.PI*(3500-j*230)/rate),lowA=1-Math.exp(-2*Math.PI*200/rate);let low=0,high=0;
   const cluster=new Float32Array(length);let energy=0;
   for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1;high+=a*(noise-high);low+=lowA*(noise-low);const envelope=Math.sin(Math.PI*i/(length-1))**2;cluster[i]=(high-low)*envelope;energy+=cluster[i]**2;}
   const gain=weights[j]/Math.sqrt(Math.max(energy,1e-12));for(let i=0;i<length;i++)d[start+i]+=cluster[i]*gain;
  });fadeTail(d,rate,.3);
 }
 return buffer;
}
