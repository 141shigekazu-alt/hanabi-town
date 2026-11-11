// Comet-style embers: fixed birth times, independent cooling and falling.
// 36 samples per star retain older embers without widening dots or adding draw calls.
import * as T from './vendor/three.module.js';
// Stretch the complete post-break animation, not the distance it travels.
export const NATURAL_TAIL_TIME_STRETCH=1.20;
export const NATURAL_TAIL_SAMPLES=36;
const EMBER_PERSISTENCE=1.50;
// Conservative end bound for composing a new show before per-star seeds exist.
export const naturalTailStretch=size=>size===10?1.32:NATURAL_TAIL_TIME_STRETCH;
export const naturalTailStretchFor=(size,position)=>Number.isFinite(position?.naturalTailTimeStretch)?Math.max(.5,Math.min(2.5,position.naturalTailTimeStretch)):naturalTailStretch(size);
export function naturalTailLifeBound(life,stretch=NATURAL_TAIL_TIME_STRETCH){
 const emberMax=1.08*1.40*EMBER_PERSISTENCE,remainingFactor=.95*EMBER_PERSISTENCE;
 const end=Math.max(life*.64,Math.min(life*.84,life-emberMax/remainingFactor));
 return Math.max(life,end+Math.min((life-end)*remainingFactor,emberMax))*stretch;
}
export const naturalTailAge=(elapsed,stretch=NATURAL_TAIL_TIME_STRETCH)=>elapsed<0?elapsed:elapsed/stretch;
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
function createBaseTails(n,count,life,random=Math.random){
 return Array.from({length:n},()=>{
  const end=life*(.64+random()*.20),period=.70+random()*.38;
  return {birthAt:new Float64Array(count).fill(NaN),birth:new Float64Array(count*6),end,period,glow:.80+random()*.40,
   phase:Float64Array.from({length:count},(_,j)=>j===0?0:(j-1+random()*.85)/(count-1)*period),
   emberLife:Float64Array.from({length:count},()=>Math.min((life-end)*(.65+random()*.30),period*(.80+random()*.60))),
   dx:Float64Array.from({length:count},()=> (random()-.5)*.010),
   dy:Float64Array.from({length:count},()=> (random()-.5)*.008),
   dz:Float64Array.from({length:count},()=> (random()-.5)*.010),
   weights:Float64Array.from({length:count},()=>.80+random()*.35),
   sizes:Float32Array.from({length:count},(_,j)=>j===0?1.05+random()*.20:.75+random()*.25)};
 });
}
// Preserve trial 0.5's parent-star seeds and appearance exactly. Extra pool
// slots use a separate stream, so they cannot change the following star/shell.
export function createNaturalTails(n,count,life,random=Math.random){
 const base=createBaseTails(n,24,life,random);
 return base.map(star=>{
  let seed=(Math.floor(star.end*1e8)^Math.floor(star.glow*1e9))>>>0;
  const r=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const period=star.period*EMBER_PERSISTENCE;
  const result={...star,period,birthAt:new Float64Array(count).fill(NaN),birth:new Float64Array(count*6),
   phase:Float64Array.from({length:count},(_,j)=>j===0?0:(j-1+r()*.85)/(count-1)*period),
   emberLife:Float64Array.from({length:count},(_,j)=>j===0?star.emberLife[0]:star.emberLife[1+(j-1)%23]*EMBER_PERSISTENCE),
   dx:Float64Array.from({length:count},(_,j)=>j===0?star.dx[0]:(r()-.5)*.010),
   dy:Float64Array.from({length:count},(_,j)=>j===0?star.dy[0]:(r()-.5)*.008),
   dz:Float64Array.from({length:count},(_,j)=>j===0?star.dz[0]:(r()-.5)*.010),
   weights:Float64Array.from({length:count},(_,j)=>j===0?star.weights[0]:.80+r()*.35),
   sizes:Float32Array.from({length:count},(_,j)=>j===0?star.sizes[0]:.75+r()*.25)};
  // Do not retire a shell while any earlier-born ember is still glowing.
  result.until=star.end;
  for(let j=1;j<count;j++){
   const lastBirth=result.phase[j]+Math.floor((star.end-result.phase[j])/period)*period;
   if(lastBirth>=0)result.until=Math.max(result.until,lastBirth+result.emberLife[j]);
  }
  return result;
 });
}
export const naturalTailLifetime=(stars,life)=>Math.max(life,...stars.map(s=>s.until));
export function prepareNaturalTail(star,t,out={}){
 out.burn=smooth(star.end*.22,star.end,t);out.t=t;out.emit=Math.min(t,star.end);out.head=1-smooth(star.end-.30,star.end,t);return out;
}
export function naturalTailSample(star,frame,j,out={}){
 if(j===0){out.at=frame.t;out.emberAge=0;out.warm=0;out.burn=frame.burn;out.brightness=2*star.glow*frame.head*(1-.35*frame.burn);return out;}
 const phase=star.phase[j],cycle=Math.floor((frame.emit-phase)/star.period);
 const at=phase+cycle*star.period,age=frame.t-at,life=star.emberLife[j];
 out.at=Math.max(0,at);out.emberAge=Math.max(0,age);out.warm=Math.min(1,Math.max(0,age/life));
 out.burn=smooth(star.end*.22,star.end,at);
 out.brightness=cycle<0||age<0||age>=life?0:Math.pow(1-out.warm,1.6)*star.weights[j]*star.glow*1.65*(1-.22*out.burn);
 return out;
}
// Burn-down is sampled at each ember birth, so existing long tails keep their own afterglow.
export function naturalTailSize(star,j,warm=0,burn=0){
 const consumed=Math.max(0,Math.min(1,burn));
 if(j===0)return star.sizes[0]*(1-.82*consumed);
 const cooled=Math.max(0,Math.min(1,warm));
 return star.sizes[j]*.8*(1-.60*cooled*cooled)*(1-.35*consumed);
}
export function attachNaturalTails(geometry,material,stars,count){
 const sizes=new Float32Array(stars.length*count);
 stars.forEach((s,i)=>{for(let j=0;j<count;j++)sizes[i*count+j]=s.sizes[j];});
 geometry.setAttribute('naturalSize',new T.BufferAttribute(sizes,1).setUsage(T.DynamicDrawUsage));
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float naturalSize;\n'+shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * naturalSize;');
 };
 material.customProgramCacheKey=()=> 'natural-tail-sizes-v2';

}

