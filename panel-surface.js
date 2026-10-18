import {panelTheme,panelGradient} from './panel-theme.js?v=1.3.12';
// Shared canvas treatment: same quad, texture size and single-pass material.
// There is no scene copy, backdrop blur, render target or postprocess here.
let glass=true;
export function setPanelGlass(value){const changed=glass!==!!value;glass=!!value;return changed;}
export function panelGlassEnabled(){return glass;}
export function drawPanelSurface(c,w,h,{radius=34}={}){
 c.clearRect(0,0,w,h);const p=panelTheme();
 const colors=glass?p.panel:p.panel.map(color=>color.slice(0,7));
 c.fillStyle=panelGradient(c,0,0,w,h,colors);c.beginPath();c.roundRect(3,3,w-6,h-6,radius);c.fill();
 // Glow is painted into the existing texture; the MR quad stays single pass.
 c.save();c.strokeStyle=panelGradient(c,0,0,w,h,p.edge);c.lineWidth=1.5;c.shadowColor=p.edge[0];c.shadowBlur=5;c.stroke();c.restore();
}
const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length?sorted[Math.ceil(sorted.length*p)-1]:null;};
const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
// USB-local diagnostic only: four 12s blocks in ABBA order, discarding the
// first 2s of each. Pauses and missing poses do not count as rendering time.
export class PanelSurfaceTrial{
 constructor({onChange=()=>{},onComplete=()=>{}}={}){Object.assign(this,{onChange,onComplete});this.elapsed=0;this.previous=null;this.index=-1;this.complete=false;this.blocks=Array.from({length:4},(_,i)=>({glass:[false,true,true,false][i],samples:[]}));}
 before(stamp,eligible){
  if(this.complete)return;
  this.active=eligible;this.gap=null;
  if(!eligible){this.previous=null;if(setPanelGlass(true))this.onChange();return;}
  if(this.previous!==null){const gap=stamp-this.previous;if(gap>0){this.elapsed+=gap;this.gap=gap;}}
  this.previous=stamp;
  if(this.elapsed>=48000){this.finish();return;}
  const index=Math.floor(this.elapsed/12000);
  this.index=index;if(setPanelGlass(this.blocks[index].glass))this.onChange();
 }
 after({updateMs,renderMs,calls}){
  if(this.complete||!this.active||this.index<0||this.elapsed%12000<2000||this.gap===null)return;
  this.blocks[this.index].samples.push({gap:this.gap,updateMs,renderMs,calls});
 }
 finish(){
  this.complete=true;if(setPanelGlass(true))this.onChange();
  const summarize=samples=>({frames:samples.length,fps:1000/average(samples.map(s=>s.gap)),p95CallbackMs:percentile(samples.map(s=>s.gap),.95),meanUpdateCpuMs:average(samples.map(s=>s.updateMs)),meanRenderCpuMs:average(samples.map(s=>s.renderMs)),meanDrawCalls:average(samples.map(s=>s.calls))});
  const blocks=this.blocks.map(b=>({glass:b.glass,...summarize(b.samples)}));
  const solid=summarize(this.blocks.filter(b=>!b.glass).flatMap(b=>b.samples)),transparent=summarize(this.blocks.filter(b=>b.glass).flatMap(b=>b.samples));
  this.onComplete({type:'panel-surface-trial',order:'opaque / glass / glass / opaque',seconds:48,warmupPerBlockSeconds:2,valid:blocks.every(b=>b.frames>=60),measurement:'XR callback cadence and CPU update/render submission; not GPU/compositor time. Only eligible visible, idle frames with main panel open.',blocks,solid,glass:transparent,reviewNeeded:Number.isFinite(transparent.fps)&&solid.fps-transparent.fps>Math.max(2,solid.fps*.05)});
 }
}
