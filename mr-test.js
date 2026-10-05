// Physical placement comes from the current XRFrame, before Three.js renders it.
export function placementFromPose(transform,distance,height,fallbackYaw=0,baseOffset=0){
 const m=transform.matrix,p=transform.position;
 let x=-m[8],z=-m[10],length=Math.hypot(x,z);
 if(length<.001){x=-Math.sin(fallbackYaw);z=-Math.cos(fallbackYaw);length=1;}
 x/=length;z/=length;
 return {x:p.x+x*distance,y:height+baseOffset,z:p.z+z*distance,yaw:Math.atan2(-x,-z),eyeHeight:p.y};
}

// Measures delivered XR callbacks, not GPU time or compositor/display FPS.
export class XRMetrics{
 constructor(){this.samples=[];this.previous=null;this.intervals=[];this.peakParticles=0;this.peakCalls=0;this.renderMs=0;this.peakWindowParticles=0;this.peakWindowCalls=0;}
 breakWindow(){this.previous=null;this.intervals=[];this.renderMs=0;this.peakWindowParticles=0;this.peakWindowCalls=0;}
 record(stamp,{particles,calls,renderMs,showTime,frameRate}){
  this.peakParticles=Math.max(this.peakParticles,particles);this.peakCalls=Math.max(this.peakCalls,calls);
  this.peakWindowParticles=Math.max(this.peakWindowParticles,particles);this.peakWindowCalls=Math.max(this.peakWindowCalls,calls);
  if(this.previous!==null){const gap=stamp-this.previous;if(gap>0){this.intervals.push(gap);this.renderMs+=renderMs;}}
  this.previous=stamp;
  const elapsed=this.intervals.reduce((n,v)=>n+v,0);
  if(elapsed<1000)return null;
  const sorted=[...this.intervals].sort((a,b)=>a-b),count=sorted.length;
  const row={showTime:Number(showTime.toFixed(2)),fps:Number((count*1000/elapsed).toFixed(1)),p95FrameMs:Number(sorted[Math.ceil(count*.95)-1].toFixed(2)),meanRenderCpuMs:Number((this.renderMs/count).toFixed(2)),particles:this.peakWindowParticles,drawCalls:this.peakWindowCalls,requestedFrameRate:frameRate??null};
  this.samples.push(row);if(this.samples.length>1800)this.samples.shift();
  this.intervals=[];this.renderMs=0;this.peakWindowParticles=0;this.peakWindowCalls=0;
  return row;
 }
}
