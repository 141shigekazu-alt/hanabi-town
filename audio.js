import {WHISTLE_VARIANTS,OPENING_VARIANTS,recordedSamples,fiveGoOpeningDecay,recordedLaunchSamples,recordedReverbBuffer,recordedLateReverbBuffer,recordedOutdoorReflectionBuffer,variedCrackleBuffer,stretchedCrackleBuffer} from './recorded-audio.js?v=1.2.0';
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
 // The 2-go ear uses half the 3-go waveform, including the reverberation feed.
 if(size===2)return effectSamples(rate,explosion,3).map(v=>v*.5);
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
 // The 2-go ear uses half the 3-go waveform, including the reverberation feed.
 if(size===2)return realisticSamples(rate,explosion,3).map(v=>v*.5);
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
// Small, dry aerial report. A short broadband pop without a deep body or long coda.
export function earPopSamples(rate){
 const data=new Float32Array(Math.ceil(rate*.24));let seed=2707141,low=0,mid=0;
 const lowFilter=1-Math.exp(-2*Math.PI*180/rate),midFilter=1-Math.exp(-2*Math.PI*1800/rate);
 for(let i=0;i<data.length;i++){
  const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1;
  low+=lowFilter*(noise-low);mid+=midFilter*(noise-mid);
  data[i]=((mid-low)*.75*Math.exp(-t/.024)+(noise-mid)*.10*Math.exp(-t/.008)+low*.22*Math.exp(-t/.044))*(1-Math.exp(-t*2200));
 }
 return fadeTail(data,rate,.08);
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
 constructor(context,volume){this.context=context;this.pending=new Set();this.cache=new Map();this.reference=new Map();this.ready=Promise.resolve();this.master=context.createGain();this.master.gain.value=volume;this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-6;this.limiter.knee.value=6;this.limiter.ratio.value=12;this.limiter.attack.value=.001;this.limiter.release.value=.15;
 // A compressor can overshoot at a sharp report. Guard the final mix, including
 // music, with an identity curve below .94 and a smooth bounded shoulder above.
 this.mixInput=context.createGain();this.outputGuard=context.createWaveShaper();const curve=new Float32Array(65537);
 for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x),u=Math.min(1,Math.max(0,(a-.94)/.06));curve[i]=a<=.94?x:Math.sign(x)*(.94+.06*(u-u*u*u/3));}
 this.outputGuard.curve=curve;this.fxBoost=context.createGain();this.fxBoost.gain.value=7.2;this.master.connect(this.fxBoost).connect(this.limiter);this.fxHeadroom=context.createGain();this.fxHeadroom.gain.value=.88;this.limiter.connect(this.fxHeadroom).connect(this.mixInput);this.mixInput.connect(this.outputGuard).connect(context.destination);
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
 // Decode the selected recordings and prepare their short launch slices once.
 // Reuse one B convolver for every large opening; no per-shell convolution node.
 this.recordedReverb=context.createConvolver();this.recordedReverb.normalize=false;this.recordedReverb.buffer=recordedReverbBuffer(context,fadeTail);
 this.recordedWet=context.createGain();this.recordedWet.gain.value=.14;this.recordedReverb.connect(this.recordedWet).connect(this.master);
 this.lateReverb=context.createConvolver();this.lateReverb.normalize=false;this.lateReverb.buffer=recordedOutdoorReflectionBuffer(context,fadeTail,true);this.lateReverb.connect(this.master);
 this.outdoorReverb=context.createConvolver();this.outdoorReverb.normalize=false;this.outdoorReverb.buffer=recordedOutdoorReflectionBuffer(context,fadeTail);this.outdoorReverb.connect(this.master);
 this.recordedOnsets=new Map();const attackRms=new Map();
 for(const key of [...new Set(Object.values(OPENING_VARIANTS).flat()),'Crack_B_01','Crack_B_02','Crack_A_01','Crack_A_03']){
  const {data,rate,onset}=recordedSamples(key),buffer=context.createBuffer(1,data.length,rate);if(key.startsWith('Crack_'))fadeTail(data,rate,.15);buffer.copyToChannel(data,0);this.cache.set('recorded-opening-'+key,buffer);
  this.recordedOnsets.set(key,onset);const start=Math.floor(onset*rate),end=Math.min(data.length,start+Math.round(.5*rate));let sum=0;for(let i=start;i<end;i++)sum+=data[i]*data[i];attackRms.set(key,Math.sqrt(sum/Math.max(1,end-start)));
  if(OPENING_VARIANTS[5].includes(key))buffer.copyToChannel(fiveGoOpeningDecay(data,rate,onset),0);
 }
 this.openingLevels=new Map();
 for(const [size,keys] of Object.entries(OPENING_VARIANTS)){
  const reference=attackRms.get(keys[0]);for(const key of keys)this.openingLevels.set(key,Math.min(1.2,reference/Math.max(.0001,attackRms.get(key))));
 }
 this.openingBags=new Map();this.openingSeed=0x141740;
 this.crackleSerial=0;this.variationSeed=(Date.now()^0x141142)>>>0;this.textureBuffers=new Map();this.whistleBag=[];this.lastWhistle=null;this.whistles=new Map();this.whistleLevels=new Map();
 for(const key of WHISTLE_VARIANTS){const {data,rate}=recordedSamples(key),buffer=context.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);this.cache.set("recorded-whistle-"+key,buffer);let sum=0;for(const v of data)sum+=v*v;this.whistleLevels.set(key,Math.min(1.3,Math.max(.85,.048/Math.sqrt(sum/data.length))));}
 for(const key of Object.values(OPENING_VARIANTS).flat()){const {data,rate}=recordedLaunchSamples(key,fadeTail,OPENING_VARIANTS[5].includes(key)?5:3),buffer=context.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);this.cache.set('recorded-launch-'+key,buffer);}
 }
 startSource(source,when,offset=0){
 const at=Math.max(this.context.currentTime,when??this.context.currentTime),entry={source,at},onended=source.onended;
 source.onended=()=>{this.pending.delete(entry);onended?.();};
 if(at>this.context.currentTime)this.pending.add(entry);
 if(offset>0)source.start(at,offset);else source.start(at);
 }
 cancelScheduled(){
 for(const [source,{dry,at}] of this.whistles){const started=at<=this.context.currentTime;if(started)dry.gain.setTargetAtTime(0,this.context.currentTime,.004);source.stop(started?this.context.currentTime+.015:this.context.currentTime);}
 for(const entry of this.pending)if(this.whistles.has(entry.source)||entry.at>this.context.currentTime){if(!this.whistles.has(entry.source))entry.source.stop();this.pending.delete(entry);}
 this.whistles.clear();
 }
 spatialPan(x,position){
 if(!position){const p=this.context.createStereoPanner();p.pan.value=Math.max(-.85,Math.min(.85,x/1.5));return p;}
 const p=this.context.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.rolloffFactor=0;
 if(p.positionX){p.positionX.value=position.x;p.positionY.value=position.y;p.positionZ.value=position.z;}else p.setPosition(position.x,position.y,position.z);
 return p;
 }
 playSenrinChildren(x=0,when,position=null,mode='original',size=10,variation=null){
 if(mode==='recorded')return this.playRecordedCrackle(x,when,position,'senrin-children','Crack_A_01',variation,size);
 if(this.context.state!=='running')return;
 const key='senrin-children';
 if(!this.cache.has(key)){const data=senrinChildSamples(this.context.sampleRate),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain(),send=this.context.createGain();source.buffer=this.cache.get(key);dry.gain.value=.50;send.gain.value=.18;
 source.connect(pan);pan.connect(dry).connect(this.master);pan.connect(send).connect(this.reverb);
 source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();send.disconnect();};this.startSource(source,when);
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
 resetOpeningCycle(size){const state=this.openingBags.get(size);if(state)state.bag=[];}
 chooseOpening(size){
 if(size===2)return this.nextRecordedCrackle();
 return this.chooseVariant(size,OPENING_VARIANTS[size]);
 }
 chooseLaunch(size){const group=size===2?3:size;return this.chooseVariant('launch-'+group,OPENING_VARIANTS[group]);}
 chooseVariant(group,variants){
 if(!variants)return null;if(variants.length===1)return variants[0];
 let state=this.openingBags.get(group);if(!state){state={bag:[],last:null};this.openingBags.set(group,state);}
 if(!state.bag.length){
  state.bag=[...variants];
  for(let i=state.bag.length-1;i>0;i--){this.openingSeed=(Math.imul(this.openingSeed,1664525)+1013904223)>>>0;const j=Math.floor(this.openingSeed/4294967296*(i+1));[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}
  if(state.bag.at(-1)===state.last)[state.bag[0],state.bag[state.bag.length-1]]=[state.bag.at(-1),state.bag[0]];
 }
 return state.last=state.bag.pop();
 }
 nextSoundRandom(){this.variationSeed=(Math.imul(this.variationSeed,1664525)+1013904223)>>>0;return this.variationSeed/4294967296;}
 chooseWhistle(size=10){
 if(!this.whistleBag.length){
  this.whistleBag=[...WHISTLE_VARIANTS];
  for(let i=this.whistleBag.length-1;i>0;i--){const j=Math.floor(this.nextSoundRandom()*(i+1));[this.whistleBag[i],this.whistleBag[j]]=[this.whistleBag[j],this.whistleBag[i]];}
  if(this.whistleBag.at(-1)===this.lastWhistle)[this.whistleBag[0],this.whistleBag[this.whistleBag.length-1]]=[this.whistleBag.at(-1),this.whistleBag[0]];
 }
 const key=this.lastWhistle=this.whistleBag.pop(),variation=this.chooseSoundVariation('whistle',size);
 return Object.freeze({key,size,variation,duration:this.cache.get('recorded-whistle-'+key).duration/variation.rate});
 }
 playWhistle(x,when,position,choice,offset=0){
 if(this.context.state!=='running'&&!('startRendering' in this.context))return;
 if(offset>=choice.duration)return;
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain();source.buffer=this.cache.get('recorded-whistle-'+choice.key);
 dry.gain.value=.75*(6/this.fxBoost.gain.value)*(choice.size===20?.95:.80)*(this.whistleLevels.get(choice.key)??1)*choice.variation.gain;
 source.connect(pan);const color=this.varyVoice(source,pan,choice.variation);color.node.connect(dry).connect(this.master);const at=Math.max(this.context.currentTime,when??this.context.currentTime);if(offset>0){const level=dry.gain.value;dry.gain.setValueAtTime(0,at);dry.gain.linearRampToValueAtTime(level,at+.008);}this.whistles.set(source,{dry,at});
 source.onended=()=>{this.whistles.delete(source);source.disconnect();pan.disconnect();color.disconnect();dry.disconnect();};this.startSource(source,when,offset*choice.variation.rate);return source;
 }
 chooseSoundVariation(role,size=10){
 const random=()=>this.nextSoundRandom();
 const children=role==='senrin-children',tail=role.endsWith('-crackle'),opening=role==='opening',launch=role==='launch';
 const index=children||tail?this.chooseVariant('texture-'+(children?'children':'tail'),[0,1,2,3,4,5]):null;
 const cents=(children&&size===20?-240:tail&&size===20?-40:0)+(random()*2-1)*(opening?32:launch?50:children?55:tail?95:role==='whistle'?70:60);
 return Object.freeze({index,rate:Math.pow(2,cents/1200),gain:1+(random()*2-1)*(opening?.04:role==='whistle'?.08:.06),shade:(random()*2-1)*(opening?1:1.5),bass:children&&size===20?6:size===20&&opening?5:size===20&&launch?6:tail&&size===20?1.5:0,bassHz:size===20&&(opening||launch)?140:220,send:children?(size===20?.018:.025):tail?(size===20?.008:.004):0});
 }
 varyVoice(source,pan,variation){
 source.playbackRate.value=variation.rate;
 const filters=[],shade=this.context.createBiquadFilter();shade.type='highshelf';shade.frequency.value=2600;shade.gain.value=variation.shade;pan.connect(shade);filters.push(shade);let node=shade;
 if(variation.bass){const bass=this.context.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=variation.bassHz??220;bass.gain.value=variation.bass;node.connect(bass);node=bass;filters.push(bass);}
 return {node,disconnect(){for(const filter of filters)filter.disconnect();}};
 }
 textureBuffer(key,index,stretch=1){
 const id=key+'-'+index+'-'+stretch;if(!this.textureBuffers.has(id)){const varied=variedCrackleBuffer(this.context,this.cache.get('recorded-opening-'+key),key,index,fadeTail);this.textureBuffers.set(id,stretch===1?varied:stretchedCrackleBuffer(this.context,varied,stretch,fadeTail,index));}
 return this.textureBuffers.get(id);
 }
 nextRecordedCrackle(){return this.crackleSerial++%2?'Crack_B_02':'Crack_B_01';}
 playRecordedCrackle(x,when,position=null,role='large-tail',key=this.nextRecordedCrackle(),variation=null,size=10){
 if(this.context.state!=='running'&&!('startRendering' in this.context))return;
 variation??=this.chooseSoundVariation(role,size);
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain();
 const textured=role==='senrin-children'||role.endsWith('-crackle'),original=this.cache.get('recorded-opening-'+key),short=role==='small-tail';
 if(textured)source.buffer=this.textureBuffer(key,variation.index,role==='silver-crackle'?1.5:1);
 else{
  const cacheKey=key+'-'+role;
  if(!this.cache.has(cacheKey)){
   const rate=original.sampleRate,length=Math.min(original.length,Math.round(rate*(short?1.6:role==='large-tail'?2.4:original.duration))),data=original.getChannelData(0).slice(0,length);
   fadeTail(data,rate,short?.25:.3);const b=this.context.createBuffer(1,data.length,rate);b.copyToChannel(data,0);this.cache.set(cacheKey,b);
  }
  source.buffer=this.cache.get(cacheKey);
 }
 const level=role==='senrin-children'?(size===20?.36:.22):({'golden-ear':.06,'small-tail':.028,'large-tail':.055,'silver-crackle':.24,'willow-crackle':.22})[role];
 dry.gain.value=level*variation.gain;
 source.connect(pan);const color=this.varyVoice(source,pan,variation);color.node.connect(dry).connect(this.master);
 let send=null;if(variation.send){send=this.context.createGain();send.gain.value=variation.send*variation.gain;color.node.connect(send).connect(this.recordedReverb);}
 source.onended=()=>{source.disconnect();pan.disconnect();color.disconnect();dry.disconnect();send?.disconnect();};this.startSource(source,when);return source;
 }
 playSilverCrackle(x,when,position=null,size=10,variation=null){return this.playOpeningCrackle(x,when,position,'silver',size,variation);}
 playOpeningCrackle(x,when,position=null,kind='silver',size=10,variation=null){return this.playRecordedCrackle(x,when,position,kind+'-crackle','Crack_A_03',variation,size);}
 playRecorded(explosion,x,size,when,position=null,openingKey=null,variation=null){
 if(this.context.state!=='running'&&!('startRendering' in this.context))return;
 const key=explosion?(openingKey??this.chooseOpening(size)):this.chooseLaunch(size);if(!key)return;
 variation??=this.chooseSoundVariation(explosion?'opening':'launch',size);
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain();
 source.buffer=this.cache.get((explosion?'recorded-opening-':'recorded-launch-')+key);
 const level=explosion?({3:.40,5:.50,10:.65,20:.80})[size]*(this.openingLevels.get(key)??1):({2:.375,3:.75,5:1,10:1.15,20:1.65})[size];dry.gain.value=level*variation.gain;
 source.connect(pan);const color=this.varyVoice(source,pan,variation);let presence=null,node=color.node;if(size>=5){presence=this.context.createBiquadFilter();presence.type='highshelf';presence.frequency.value=1800;presence.gain.value=1.5;node.connect(presence);node=presence;}node.connect(dry).connect(this.master);
 // Feed only the quiet, later part of the recording into the short coda.
 let send=null;if(explosion&&size>=5){
  send=this.context.createGain();const at=Math.max(this.context.currentTime,when??this.context.currentTime),delay=(this.recordedOnsets.get(key)+({5:.55,10:.65,20:.75})[size])/variation.rate;
  send.gain.setValueAtTime(0,at);send.gain.setValueAtTime(0,at+delay);send.gain.linearRampToValueAtTime(level*(size>=10?.20:.10)*variation.gain,at+delay+.25/variation.rate);node.connect(send).connect(size>=10?this.outdoorReverb:this.lateReverb);
 }
 source.onended=()=>{source.disconnect();pan.disconnect();color.disconnect();dry.disconnect();presence?.disconnect();send?.disconnect();};this.startSource(source,when);return source;
 }
 playComet(x,when,position=null,mode='recorded',small=false){
 if(mode==='recorded'){
  if(this.context.state!=='running'&&!('startRendering' in this.context))return;
  const key=this.chooseLaunch(3),source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain();
  const variation=this.chooseSoundVariation('launch',small?2:3);source.buffer=this.cache.get('recorded-launch-'+key);dry.gain.value=(small?.22:.40)*variation.gain;
  source.connect(pan);const color=this.varyVoice(source,pan,variation);color.node.connect(dry).connect(this.master);
  source.onended=()=>{source.disconnect();pan.disconnect();color.disconnect();dry.disconnect();};this.startSource(source,when);return source;
 }
 if(this.context.state!=='running')return;
 const key='realistic-false-3';
 if(!this.cache.has(key)){const data=realisticSamples(this.context.sampleRate,false,3),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain(),send=this.context.createGain();
 source.buffer=this.cache.get(key);dry.gain.value=.095;send.gain.value=.025;
 source.connect(pan);pan.connect(dry).connect(this.master);pan.connect(send).connect(this.reverb);
 source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();send.disconnect();};this.startSource(source,when);
 }
 playEar(explosion,x,when,position=null){
 if(this.context.state!=='running'&&!('startRendering' in this.context))return;
 const key=explosion?'ear-pop':'realistic-false-3';
 if(!this.cache.has(key)){const data=explosion?earPopSamples(this.context.sampleRate):realisticSamples(this.context.sampleRate,false,3),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource(),pan=this.spatialPan(x,position),dry=this.context.createGain();source.buffer=this.cache.get(key);dry.gain.value=explosion?.18:.14;
 source.connect(pan);pan.connect(dry).connect(this.master);
 // Ear openings are dry. Launches retain only the small space used by the comets.
 let send=null;if(!explosion){send=this.context.createGain();send.gain.value=.025;pan.connect(send).connect(this.reverb);}
 source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();send?.disconnect();};this.startSource(source,when);
 }
 play(explosion,x,z,size,mode='original',when,position=null,openingKey=null,variation=null){if(size===2){if(mode==='recorded')return explosion?this.playRecordedCrackle(x,when,position,'golden-ear',openingKey??this.nextRecordedCrackle(),variation,size):this.playRecorded(false,x,size,when,position,null,variation);return this.playEar(explosion,x,when,position);}if(mode==='recorded')return this.playRecorded(explosion,x,size,when,position,openingKey,variation);if(this.context.state!=='running'&&!('startRendering' in this.context))return;const key=`${mode==='realistic'?'realistic':'original'}-${explosion}-${size}`;if(!this.cache.has(key)){const data=(mode==='realistic'?realisticSamples:effectSamples)(this.context.sampleRate,explosion,size),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer);}
 const source=this.context.createBufferSource();const reference=mode==='reference'&&explosion?this.reference.get(size>=10?'large':'small'):null;source.buffer=reference||this.cache.get(key);if(reference)source.playbackRate.value=size===3?1.08:size===20?.88:1;const pan=this.spatialPan(x,position);const dry=this.context.createGain();dry.gain.value=explosion?(mode==='realistic'&&size>=10?(size===20?1.4:1.15):.9):mode==='realistic'?.28:.8;source.connect(pan).connect(dry).connect(this.master);let launchSend=null;if(explosion){if(mode==='realistic'&&size>=10){launchSend=this.context.createGain();launchSend.gain.value=size===20?1.55:1.25;pan.connect(launchSend).connect(this.openingReverb);}else pan.connect(this.openingReverb);}else if(mode==='realistic'){launchSend=this.context.createGain();launchSend.gain.value=.20;pan.connect(launchSend).connect(this.reverb);}source.onended=()=>{source.disconnect();pan.disconnect();dry.disconnect();launchSend?.disconnect();};this.startSource(source,when);
 }
}
