import * as T from './vendor/three.module.js';

export const TOWER_STYLES=['blue','purple','emerald','rainbow'];
function bands(y,colors,boundaries){
 const width=.035;
 for(let i=0;i<boundaries.length;i++){
  const edge=boundaries[i];
  if(y<edge-width)return new T.Color(colors[i]);
  if(y<edge+width){const t=(y-edge+width)/(2*width),blend=t*t*(3-2*t);return new T.Color(colors[i]).lerp(new T.Color(colors[i+1]),blend);}
 }
 return new T.Color(colors.at(-1));
}
export function towerPalette(dots,style){
 const result=new Float32Array(dots.length);
 for(let i=0;i<dots.length/3;i++){
  const y=dots[i*3+1];let color;
  if(style==='blue')color=y>.80&&y<1.16?new T.Color(0xffd691):new T.Color(0xe1edff).lerp(new T.Color(0x4097ff),Math.max(0,Math.sin(y*4))*.86);
  else if(style==='purple')color=new T.Color(0xdcecff).lerp(new T.Color(0xb677ff),(Math.sin(y*10)+1)*.425);
  else if(style==='emerald')color=bands(y,[0x55d886,0xe5edff,0xf294cf,0xe5edff,0xf294cf],[.42,.73,.85,1.18]);
  else color=bands(y,[0xf16b73,0x69dd93,0xffd58a,0x529eff,0xe5edff],[.34,.62,.87,1.18]);
  result.set([color.r,color.g,color.b],i*3);
 }
 return result;
}

export class TowerLighting{
 constructor(dots,attribute,random=Math.random){
  this.chaseTime=0;this.ringDots=[];for(let i=0;i<dots.length/3;i++){const y=dots[i*3+1];if(Math.abs(y-.842)<.001||Math.abs(y-1.022)<.001)this.ringDots.push({index:i,angle:Math.atan2(dots[i*3+2],dots[i*3])});}
  this.attribute=attribute;this.random=random;this.palettes=Object.fromEntries(TOWER_STYLES.map(style=>[style,towerPalette(dots,style)]));
  this.mode=null;this.current='blue';this.from='blue';this.elapsed=0;this.transition=false;this.queue=[];
 }
 shuffle(values){
  const bag=[...values];for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}return bag;
 }
 hold(){this.elapsed=0;this.transition=false;this.holdSeconds=24+this.random()*14;}
 apply(blend=1){
  const colors=this.attribute.array,a=this.palettes[this.from],b=this.palettes[this.current];
  for(let i=0;i<colors.length;i++)colors[i]=a[i]+(b[i]-a[i])*blend;
  this.attribute.needsUpdate=true;
 }
 setMode(mode){
  if(mode===this.mode)return;this.mode=mode;
  if(mode==='random'){
   this.from=this.current;this.apply();this.queue=this.shuffle(TOWER_STYLES.filter(style=>style!==this.current));this.hold();
  }else{
   this.current=TOWER_STYLES.includes(mode)?mode:'blue';this.from=this.current;this.transition=false;this.elapsed=0;this.apply();
  }
 }
 next(){
  if(!this.queue.length){this.queue=this.shuffle(TOWER_STYLES);if(this.queue[0]===this.current)[this.queue[0],this.queue[1]]=[this.queue[1],this.queue[0]];}
  return this.queue.shift();
 }
 update(seconds){
  if(seconds<=0)return;this.chaseTime+=seconds;
  if(this.mode==='random'){
  this.elapsed+=seconds;
  if(this.transition){
   const t=Math.min(1,this.elapsed/4);this.apply(t*t*(3-2*t));if(t===1)this.hold();
  }else if(this.elapsed>=this.holdSeconds){this.from=this.current;this.current=this.next();this.elapsed=0;this.transition=true;}
  }
  const blend=this.transition?Math.min(1,this.elapsed/4):1,smooth=blend*blend*(3-2*blend),a=this.palettes[this.from],b=this.palettes[this.current],colors=this.attribute.array;
  for(const dot of this.ringDots){const i=dot.index*3,phase=dot.angle-this.chaseTime*Math.PI*2/2.5;const wrap=Math.atan2(Math.sin(phase),Math.cos(phase)),beam=Math.exp(-Math.pow(wrap/.40,2));for(let k=0;k<3;k++)colors[i+k]=(a[i+k]+(b[i+k]-a[i+k])*smooth)*.40+beam*(k===0?.9:1.2);}
  this.attribute.needsUpdate=true;
 }
}
