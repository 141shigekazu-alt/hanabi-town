// Music shares the effects' AudioContext. Its sample clock is the show's master clock.
export class MusicTransport {
 constructor(url,{autoload=true}={}){
  this.url=url;this.buffer=null;this.source=null;this.context=null;this.gain=null;this.offset=0;this.started=0;this.clockRunning=false;
  this.preRoll=0;this.volume=.35;this.clickEnabled=false;this.clicks=new Set();this.clickCursor=0;this.ready=null;
  if(autoload)this.load();
 }
 load(){
  if(!this.ready)this.ready=(async()=>{const r=await fetch(this.url);if(!r.ok)throw Error('WAV '+r.status);const bytes=await r.arrayBuffer();const decoder=new OfflineAudioContext(2,1,48000);this.buffer=await decoder.decodeAudioData(bytes);return this;})();
  return this.ready;
 }

 get loaded(){return !!this.buffer;}
 get currentTime(){return this.clockRunning?Math.max(this.offset,this.offset+this.context.currentTime-this.started):this.offset;}
 play(context,offset=0,destination=context.destination){
  if(!this.buffer)throw Error('音楽はまだ準備中です');this.pause();this.offset=Math.max(0,offset);
  this.context=context;this.destination=destination;this.clockRunning=true;
  // At 0:00 the short lead-in leaves enough time for the first ascent.
  this.started=context.currentTime+.08;this.clickCursor=0;
  if(this.offset<this.buffer.duration+this.preRoll){
   this.gain=context.createGain();this.gain.gain.value=this.volume;this.meter=context.createAnalyser();this.meter.fftSize=512;this.meterData=new Float32Array(512);this.gain.connect(this.meter).connect(destination);
   const source=context.createBufferSource();this.source=source;source.buffer=this.buffer;source.connect(this.gain);
   source.onended=()=>{source.disconnect();if(this.source===source)this.source=null;};source.start(this.started+Math.max(0,this.preRoll-this.offset),Math.max(0,this.offset-this.preRoll));
  }
 }
 cancelClicks(){for(const n of this.clicks){try{n.stop();}catch{}n.disconnect();}this.clicks.clear();}
 pause(){
  const at=this.currentTime;if(this.source){try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}
  this.gain?.disconnect();this.meter?.disconnect();this.meter=null;this.gain=null;this.cancelClicks();this.offset=at;this.clockRunning=false;return at;
 }
 stop(){this.pause();this.offset=0;this.clickCursor=0;}
 get signalRms(){if(!this.meter)return 0;this.meter.getFloatTimeDomainData(this.meterData);let sum=0;for(const v of this.meterData)sum+=v*v;return Math.sqrt(sum/this.meterData.length);}
 setVolume(value){this.volume=value;if(this.gain)this.gain.gain.setTargetAtTime(value,this.context.currentTime,.03);}
 updateClicks(beats){
  if(!this.source)return;const t=this.currentTime;
  while(this.clickCursor<beats.length&&beats[this.clickCursor].time<t-.03)this.clickCursor++;
  if(!this.clickEnabled){this.cancelClicks();return;}
  while(this.clickCursor<beats.length&&beats[this.clickCursor].time<=t+.12){
   const b=beats[this.clickCursor++],when=this.started+b.time-this.offset;if(when<this.context.currentTime)continue;
   const osc=this.context.createOscillator(),gain=this.context.createGain();osc.frequency.value=1200;gain.gain.setValueAtTime(.035,when);gain.gain.exponentialRampToValueAtTime(.0001,when+.025);
   osc.connect(gain).connect(this.destination??this.context.destination);osc.start(when);osc.stop(when+.03);this.clicks.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.clicks.delete(osc);};
  }
 }
}
