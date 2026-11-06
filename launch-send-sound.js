// A brief nearby send cue; the real launch and break keep their existing audio.
export const LAUNCH_SEND_PROFILE=Object.freeze({duration:.15,peak:.012,airPeak:.0018,startHz:620,crestHz:1480,endHz:980});
const airBuffers=new WeakMap();
function airBuffer(context){if(airBuffers.has(context))return airBuffers.get(context);const b=context.createBuffer(1,Math.ceil(context.sampleRate*LAUNCH_SEND_PROFILE.duration),context.sampleRate),a=b.getChannelData(0);let seed=141;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/4294967296*2-1;}airBuffers.set(context,b);return b;}
export function playLaunchSend(context,destination,hand='right'){
 if(!context||context.state==='closed'||!destination)return false;
 const p=LAUNCH_SEND_PROFILE,t=context.currentTime,end=t+p.duration;
 const tone=context.createOscillator(),toneGain=context.createGain(),air=context.createBufferSource(),airGain=context.createGain(),filter=context.createBiquadFilter(),pan=context.createStereoPanner();
 pan.pan.value=hand==='left'?-.18:.18;pan.connect(destination);
 tone.type='triangle';tone.frequency.setValueAtTime(p.startHz,t);tone.frequency.exponentialRampToValueAtTime(p.crestHz,t+.048);tone.frequency.exponentialRampToValueAtTime(p.endHz,end);
 toneGain.gain.setValueAtTime(0,t);toneGain.gain.linearRampToValueAtTime(p.peak,t+.006);toneGain.gain.exponentialRampToValueAtTime(.00001,end-.005);toneGain.gain.linearRampToValueAtTime(0,end);
 filter.type='lowpass';filter.frequency.setValueAtTime(3200,t);filter.Q.value=.5;
 air.buffer=airBuffer(context);airGain.gain.setValueAtTime(0,t);airGain.gain.linearRampToValueAtTime(p.airPeak,t+.009);airGain.gain.exponentialRampToValueAtTime(.00001,t+.105);airGain.gain.linearRampToValueAtTime(0,end);
 tone.connect(toneGain).connect(filter).connect(pan);air.connect(airGain).connect(pan);
 let ended=0;const cleanup=()=>{if(++ended<2)return;for(const node of [tone,toneGain,air,airGain,filter,pan])node.disconnect();};tone.onended=air.onended=cleanup;
 tone.start(t);air.start(t);tone.stop(end);air.stop(end);return true;
}
