// End the extended decay smoothly, with zero slope at both ends of the fade.
export function fadeTail(data,rate,seconds){
 if(data.length<2){if(data.length)data[0]=0;return data;}
 const count=Math.min(data.length,Math.max(2,Math.round(rate*seconds))),start=data.length-count;
 for(let i=0;i<count;i++)data[start+i]*=.5*(1+Math.cos(Math.PI*i/(count-1)));
 if(data.length)data[data.length-1]=0;return data;
}
// Keep the existing early decay, then ease into a longer, matched late decay.
function lateDecay(t,tau,join,lateTau){
 const original=Math.exp(-t/tau);if(t<=join)return original;
 const u=Math.min(1,(t-join)/.5),mix=u*u*(3-2*u);
 return original*(1-mix)+Math.exp(-join/tau-(t-join)/lateTau)*mix;
}
// Original synthesized effects. Launch: broadband pressure and short gas rush. Break: deep pressure and roomy decay.
export function effectSamples(rate,explosion,size=5){
 const duration=explosion?2.2+(size===20?2.2:size>=10?1.8:1.2):.8,output=new Float32Array(Math.ceil(rate*duration));
 const sizeWeight=size===10?1:size===5?.85:.70;
 let seed=explosion?817:141,low=0,mid=0,bass=0;
 for(let i=0;i<output.length;i++){
 const t=i/rate;seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296*2-1;
 const cutoff=explosion?180:230;low+=(1-Math.exp(-2*Math.PI*cutoff/rate))*(noise-low);
 if(!explosion){
 // Avoid a pitched drum-like body: shape noise into pressure, crack and gas rush.
 mid+=(1-Math.exp(-2*Math.PI*2400/rate))*(noise-mid);
 bass+=(1-Math.exp(-2*Math.PI*95/rate))*(noise-bass);
 const pressure=low*1.6*Math.exp(-t/.095);
 const crack=(mid-low)*.48*Math.exp(-t/.027);
 const rush=(mid-bass)*.55*(1-Math.exp(-t*220))*Math.exp(-t/.12);
 const weight=bass*.8*Math.exp(-t/.16);
 output[i]=(pressure+crack+rush+weight)*(1-Math.exp(-t*1600))*sizeWeight;
 continue;
 }
 const attack=1-Math.exp(-t*700);
 const pitch=explosion?48:90;
 const phase=2*Math.PI*(pitch*t+(explosion?32:48)*.045*(1-Math.exp(-t/.045)));
 const body=Math.sin(phase)*Math.exp(-t/(explosion?.42:.16))*(explosion?.52:.38);
 const texture=low*Math.exp(-t/(explosion?.48:.20))*(explosion?1.5:1.3);
 const after=explosion?low*.26*lateDecay(t,.85,1.8,1.7)*(1-Math.exp(-t*25)):0;
 output[i]=(body+texture+after)*attack*sizeWeight;
 }
 return explosion?fadeTail(output,rate,1):output;
}
// Recording-inspired synthesis: no recorded sound or pitched oscillator in this profile.
export function realisticSamples(rate,explosion,size=5){
 const big=size>=10,weight=size===20?1:size===10?.95:size===5?.8:.68;
 const baseDuration=big?(size===20?4.8:4.1):1.7,extension=size===20?2.2:big?1.8:1.2;
 const duration=explosion?baseDuration+extension:.65,data=new Float32Array(Math.ceil(rate*duration));
 let seed=913+size*71+(explosion?47:0),bass=0,body=0,air=0;
 const bassHz=big?65:size===5?95:110,bodyHz=explosion?(big?230:480):220;
 const aBass=1-Math.exp(-2*Math.PI*bassHz/rate),aBody=1-Math.exp(-2*Math.PI*bodyHz/rate),aAir=1-Math.exp(-2*Math.PI*(explosion?3800:1000)/rate);
 for(let i=0;i<data.length;i++){
 const t=i/rate;seed=(seed*1664525+1013904223)>>>0;const n=seed/4294967296*2-1;
 bass+=aBass*(n-bass);body+=aBody*(n-body);air+=aAir*(n-air);
 if(explosion){
 const attack=1-Math.exp(-t*1100);
 const pressure=bass*(big?4.8:size===5?2.8:2.4)*Math.exp(-t/(big?.38:size===5?.19:.16));
 const breakNoise=(body-bass)*(big?1.45:1.65)*Math.exp(-t/(big?.15:.10));
 const edge=(air-body)*(big?.17:.30)*Math.exp(-t/.016);
 const rumble=bass*(big?2.4:.85)*(1-Math.exp(-t*28))*lateDecay(t,big?(size===20?1.65:1.32):.34,baseDuration-(big?.65:.35),big?(size===20?2.8:2.4):.85);
 data[i]=(pressure+breakNoise+edge+rumble)*attack;
 }else{
 const pressure=body*2.4*Math.exp(-t/.070);
 const snap=(air-body)*.05*Math.exp(-t/.009);
 const rush=(air-bass)*.35*(1-Math.exp(-t*140))*Math.exp(-t/.115);
 const low=bass*2*Math.exp(-t/.125);
 data[i]=(pressure+snap+rush+low)*(1-Math.exp(-t*1800));
 }
 }
 // Match peak headroom while retaining shell-size level differences.
 const peak=data.reduce((m,v)=>Math.max(m,Math.abs(v)),0),gain=peak?Math.min(1,.82/peak)*weight:0;
 for(let i=0;i<data.length;i++)data[i]*=gain;
 return explosion?fadeTail(data,rate,1):data;
}
export function crackleSamples(rate,cross=false){
 const data=new Float32Array(Math.ceil(rate*1.6));let seed=cross?2701:1709;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const count=cross?32:24;
 for(let k=0;k<count;k++){
 const start=Math.floor((.06+k/count*1.22+(random()-.5)*.025)*rate),duration=.009+random()*.017,amplitude=.22+random()*.30;let low=0,mid=0;
 for(let j=0;j<Math.ceil(duration*rate)&&start+j<data.length;j++){
 const t=j/rate,n=random()*2-1;
 low+=(1-Math.exp(-2*Math.PI*500/rate))*(n-low);mid+=(1-Math.exp(-2*Math.PI*3000/rate))*(n-mid);
 data[start+j]+=(mid-low)*amplitude*(1-Math.exp(-t*4000))*Math.exp(-t/(duration*.22));
 }
 }
 return data;
}
export function senrinChildSamples(rate){
 const data=new Float32Array(Math.ceil(rate*2.2));let seed=7319;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let child=0;child<30;child++){
 // Spread the small reports over a longer rolling sequence.
 const start=Math.floor((child/29*.55+random()*.045)*rate),weight=.55+random()*.45;let low=0,mid=0;
 for(let j=0;j<Math.ceil(rate*.48)&&start+j<data.length;j++){
 const t=j/rate,n=random()*2-1;
 low+=(1-Math.exp(-2*Math.PI*180/rate))*(n-low);mid+=(1-Math.exp(-2*Math.PI*1600/rate))*(n-mid);
 const pressure=low*1.7*Math.exp(-t/.120),pop=(mid-low)*.65*Math.exp(-t/.044);
 data[start+j]+=(pressure+pop)*(1-Math.exp(-t*1500))*weight;
 }
 }
 const peak=data.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
 if(peak)for(let i=0;i<data.length;i++)data[i]*=.65/peak;
 return data;
}
// Generate the same early reflections, with a longer decay for openings.
export function reverbBuffer(context,opening=false){
 const rate=context.sampleRate,oldLength=Math.ceil(rate*1.9),length=opening?Math.ceil(rate*3.4):oldLength;
 const buffer=context.createBuffer(2,length,rate);let seed=491;
 for(let channel=0;channel<2;channel++){
  const data=buffer.getChannelData(channel),old=new Float32Array(oldLength);let low=0;
  for(let i=0;i<oldLength;i++){
   seed=(seed*1664525+1013904223)>>>0;low+=(seed/4294967296*2-1-low)*.14;
   const t=i/rate;old[i]=t<.035?0:low*Math.exp(-t*3.2);
   data[i]=t<.035?0:low*(opening?lateDecay(t,1/3.2,.65,.8):Math.exp(-t*3.2));
  }
  const continuationSeed=seed;fadeTail(old,rate,.25);
  if(opening){
   let tailSeed=continuationSeed;
   for(let i=oldLength;i<length;i++){
    tailSeed=(tailSeed*1664525+1013904223)>>>0;low+=(tailSeed/4294967296*2-1-low)*.14;
    data[i]=low*lateDecay(i/rate,1/3.2,.65,.8);
   }
   fadeTail(data,rate,1);
  }else data.set(old);
 }
 return buffer;
}
export class FireworkAudio{
 constructor(context,volume){this.context=context;this.cache=new Map();this.reference=new Map();this.ready=Promise.all(['small','large'].map(async name=>{const response=await fetch(new URL(`reference-${name}.wav`,import.meta.url));if(!response.ok)throw new Error('参考音の読込に失敗');const buffer=await context.decodeAudioData(await response.arrayBuffer());for(let channel=0;channel<buffer.numberOfChannels;channel++)fadeTail(buffer.getChannelData(channel),buffer.sampleRate,.02);this.reference.set(name,buffer);}));this.ready.catch(()=>{});this.master=context.createGain();this.master.gain.value=volume;this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-9;this.limiter.knee.value=9;this.limiter.ratio.value=8;this.limiter.attack.value=.003;this.limiter.release.value=.2;this.master.connect(this.limiter).connect(context.destination);
 // Retain the short space for launch/foot effects. Openings have a longer tail.
 this.reverb=context.createConvolver();this.reverb.buffer=reverbBuffer(context);
 this.openingReverb=context.createConvolver();this.openingReverb.buffer=reverbBuffer(context,true);
 this.wet=context.createGain();this.wet.gain.value=.22;
 this.reverb.connect(this.wet).connect(this.master);
 // Native normalization depends on IR RMS. Compensate by the RMS ratio;
 // its calibration cancels on every browser, keeping early reflections equal.
 const rms=buffer=>{let sum=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const v of buffer.getChannelData(c))sum+=v*v;return Math.max(.000125,Math.sqrt(sum/(buffer.length*buffer.numberOfChannels)));};
 this.openingWet=context.createGain();this.openingWet.gain.value=.22*rms(this.openingReverb.buffer)/rms(this.reverb.buffer);
 this.openingReverb.connect(this.openingWet).connect(this.master);
 }
 playSenrinChildren(x=0){
 if(this.context.state!=='running')return;
 const key='senrin-children';
 if(!this.cache.has(key)){const data=senrinChildSamples(this.context.sampleRate),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource(),pan=this.context.createStereoPanner(),dry=this.context.createGain(),send=this.context.createGain();source.buffer=this.cache.get(key);pan.pan.value=Math.max(-.85,Math.min(.85,x/1.5));dry.gain.value=.50;send.gain.value=.18;
 source.connect(pan);pan.connect(dry).connect(this.master);pan.connect(send).connect(this.reverb);
 source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();send.disconnect();};source.start();
 }
 playCrackle(cross=false){
 if(this.context.state!=='running')return;
 const key=cross?'crackle-cross':'crackle-fan';
 if(!this.cache.has(key)){const data=crackleSamples(this.context.sampleRate,cross),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource(),dry=this.context.createGain(),send=this.context.createGain();source.buffer=this.cache.get(key);dry.gain.value=.16;send.gain.value=.06;
 source.connect(dry).connect(this.master);source.connect(send).connect(this.reverb);
 source.onended=()=>{source.disconnect();dry.disconnect();send.disconnect();};source.start();
 }
 setVolume(value){this.master.gain.setTargetAtTime(value,this.context.currentTime,.025);}
 play(explosion,x,z,size,mode='original'){if(this.context.state!=='running'&&!('startRendering' in this.context))return;const key=`${mode==='realistic'?'realistic':'original'}-${explosion}-${size}`;if(!this.cache.has(key)){const data=(mode==='realistic'?realisticSamples:effectSamples)(this.context.sampleRate,explosion,size),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource();const reference=mode==='reference'&&explosion?this.reference.get(size>=10?'large':'small'):null;source.buffer=reference||this.cache.get(key);if(reference)source.playbackRate.value=size===3?1.08:size===20?.88:1;const pan=this.context.createStereoPanner();pan.pan.value=Math.max(-.85,Math.min(.85,x/1.5));const dry=this.context.createGain();dry.gain.value=explosion?(mode==='realistic'&&size>=10?(size===20?1.4:1.15):.9):mode==='realistic'?.28:.8;source.connect(pan).connect(dry).connect(this.master);let launchSend=null;if(explosion){if(mode==='realistic'&&size>=10){launchSend=this.context.createGain();launchSend.gain.value=size===20?1.55:1.25;pan.connect(launchSend).connect(this.openingReverb);}else pan.connect(this.openingReverb);}else if(mode==='realistic'){launchSend=this.context.createGain();launchSend.gain.value=.20;pan.connect(launchSend).connect(this.reverb);}source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();launchSend?.disconnect();};source.start();
 }
}
