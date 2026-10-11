// Optional diagnostics for the USB-local test page. Nothing is sent from Pages.
export class QuestDiagnostics{
 constructor({enabled=false}={}){
  this.enabled=enabled;this.frames=[];this.longTasks=[];this.sentAt=0;this.busy=false;
  if(enabled&&typeof PerformanceObserver!=='undefined')try{
   this.observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())this.longTasks.push({at:Math.round(entry.startTime),ms:Number(entry.duration.toFixed(2))});if(this.longTasks.length>120)this.longTasks.splice(0,this.longTasks.length-120);});
   this.observer.observe({type:'longtask',buffered:false});
  }catch{}
 }
 record(stamp,state){
  if(!this.enabled)return;this.frames.push({stamp,...state});if(this.frames.length>240)this.frames.shift();
  if(stamp-this.sentAt<1000||this.busy)return;this.sentAt=stamp;
  const frames=this.frames.splice(0),gaps=frames.slice(1).map((f,i)=>f.stamp-frames[i].stamp).sort((a,b)=>a-b);
  const row={build:'1.2.28',at:new Date().toISOString(),...state,frames:frames.length,p95CallbackMs:gaps.length?Number(gaps[Math.ceil(gaps.length*.95)-1].toFixed(2)):null,meanUpdateCpuMs:frames.reduce((s,f)=>s+f.updateCpuMs,0)/frames.length,meanRenderCpuMs:frames.reduce((s,f)=>s+f.renderCpuMs,0)/frames.length,longTasks:this.longTasks.splice(0)};
  this.busy=true;fetch('/__quest_diagnostic__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)}).catch(()=>{}).finally(()=>{this.busy=false;});
 }
}
