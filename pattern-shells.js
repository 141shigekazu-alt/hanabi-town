import {variationRandom} from './flower-variation.js';

// Visual trajectories only. Counts/timing come from Ishii's reference footage;
// this is not a model of pyrotechnic construction or explosive behaviour.
export const PATTERN_KINDS=['patternheart','patternpeace','patterndoubleheart'];
export const isPatternShell=kind=>PATTERN_KINDS.includes(kind);
// Provisional visual scale for 2-go, separate from size 2 used by the low ear effect.
export const PATTERN_SIZES={2:{label:'2号玉',radius:.16,height:.64},3:{label:'3号玉',radius:.23,height:.80},5:{label:'5号玉',radius:.35,height:1.04}};
export const patternSizes=kind=>kind==='patternpeace'?[2,3,5]:[2,3];
export const PATTERN_PROFILE={life:2.25,trails:8,tail:.009,pointSize:.0165};
export const patternStarCount=kind=>kind==='patternheart'?25:kind==='patternpeace'?33:kind==='patterndoubleheart'?47:0;
export const patternPalettes=[
 {id:'original',label:'紅',colors:[0xff393f,0xff73aa]},
 {id:'pattern-pink',label:'桃',colors:[0xff73aa,0xff393f]},
 {id:'pattern-blue',label:'青',colors:[0x548bff,0x66ddff]},
 {id:'pattern-green',label:'緑',colors:[0x67f591,0xffcf70]},
 {id:'pattern-gold',label:'金',colors:[0xffcf70,0xff793f]},
 {id:'pattern-white',label:'白',colors:[0xf0f6ff,0xff73aa]}
];
export function patternPaletteOptions(kind){if(kind==='patternpeace')return [{id:'original',label:'黄色の輪郭・緑の目・赤い口',colors:[0xffd52e,0x67f591,0xff393f]}];return kind==='patterndoubleheart'?[{id:'original',label:'外が桃・内が紅',colors:[0xff73aa,0xff393f]},{id:'double-red-pink',label:'外が紅・内が桃',colors:[0xff393f,0xff73aa]},...patternPalettes.slice(1)]:patternPalettes;}
export const PATTERN_SPECS={
 patternheart:{label:'型物 · ハート',radii:[1],colors:[0xff393f],...PATTERN_PROFILE},
 patternpeace:{label:'型物 · ニコちゃん',radii:[1],colors:[0xffd52e,0x67f591,0xff393f],...PATTERN_PROFILE},
 patterndoubleheart:{label:'型物 · 二重ハート',radii:[1,.65],colors:[0xff73aa,0xff393f],...PATTERN_PROFILE}
};
function heart(t){return [Math.pow(Math.sin(t),3),(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)+2)/16,0];}
function resampleHeart(count){
 const pts=Array.from({length:1025},(_,i)=>heart(i*Math.PI*2/1024)),length=[0];
 for(let i=1;i<pts.length;i++)length[i]=length[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
 return Array.from({length:count},(_,i)=>{const target=length.at(-1)*i/count;let k=1;while(length[k]<target)k++;const u=(target-length[k-1])/(length[k]-length[k-1]);return pts[k].map((n,j)=>pts[k-1][j]+(n-pts[k-1][j])*u);});
}
function peace(){
 const points=Array.from({length:24},(_,i)=>({p:[Math.sin(i*Math.PI*2/24),Math.cos(i*Math.PI*2/24),0],layer:0}));
 points.push({p:[-.34,.30,0],layer:1},{p:[.34,.30,0],layer:1});
 for(let i=1;i<=7;i++){const a=Math.PI*i/8;points.push({p:[-.56*Math.cos(a),-.12-.44*Math.sin(a),0],layer:2});}
 return points;
}
function rotate(v,roll,yaw,pitch){let[x,y,z]=v,c=Math.cos(roll),s=Math.sin(roll);[x,y]=[c*x-s*y,s*x+c*y];c=Math.cos(yaw);s=Math.sin(yaw);[x,z]=[c*x+s*z,-s*x+c*z];c=Math.cos(pitch);s=Math.sin(pitch);return[x,c*y-s*z,s*y+c*z];}
// A separate RNG stream changes the whole shell pose without changing the
// approved star deformation. Sample once at launch, never chase the viewer.
export function samplePatternPose(seed){
 const r=variationRandom(seed,0x504f5345),group=r(),sign=r()<.5?-1:1;
 const yawDegrees=group<.20?r()*20:group<.90?20+r()*45:65+r()*17;
 return {roll:(r()*2-1)*Math.PI,yaw:sign*yawDegrees*Math.PI/180,pitch:(r()*2-1)*28*Math.PI/180};
}
export function createPatternStars(kind,seed,{scatter=1}={}){
 if(!isPatternShell(kind))throw Error('未知の型物です。');
 const r=variationRandom(seed,0x53484150),signed=()=>r()*2-1;
 const deviationScale=kind==='patternpeace'?.36:kind==='patterndoubleheart'?.48:.54;
 const raw=kind==='patternpeace'?peace():resampleHeart(kind==='patterndoubleheart'?27:25).map(p=>({p,layer:0}));
 if(kind==='patterndoubleheart')raw.push(...resampleHeart(20).map(p=>({p:p.map(v=>v*.64),layer:1})));
 // Broad skew and independent launch errors are sampled once, never per frame.
 const severity=(.55+r()*.85)*scatter,sx=1+signed()*.12*severity,sy=1+signed()*.13*severity,shear=signed()*.13*severity;
 const roll=signed()*.26,yaw=signed()*.30,pitch=signed()*.14,phase=r()*Math.PI*2;
 return raw.map(({p,layer},i)=>{
  const jitter=.070*severity,local=[p[0]*sx+shear*p[1]+signed()*jitter,p[1]*sy+signed()*jitter,signed()*.040*severity];
  const lobe=1+Math.sin(Math.atan2(p[1],p[0])*3+phase)*.055*severity;
  const speed=1+signed()*.10*severity,previous=rotate(local.map(v=>v*lobe*speed),roll,yaw,pitch);
  // Compare the identical seed to 0.1: keep 36% of smile / 54% of single heart / 48% of double heart
  // displacement from the intended pattern, including whole-shell skew.
  const dir=p.map((v,j)=>v+(previous[j]-v)*deviationScale);
  return {direction:dir,layer,drag:3.775+((3.45+r()*.65)-3.775)*deviationScale,delay:.008+r()*.032,life:1.58+r()*.46,
   fadeStart:1.0+r()*.30,brightness:.78+r()*.45,gravity:.020+r()*.010,rise:.029+r()*.012,seedIndex:i};
 });
}
export function patternPoint(star,radius,t,j,trails=PATTERN_PROFILE.trails,out={}){
 const lag=j*PATTERN_PROFILE.tail,at=Math.max(0,t-lag),travel=radius*(1-Math.exp(-star.drag*at));
 out.x=star.direction[0]*travel;out.y=star.direction[1]*travel+star.rise*at-star.gravity*at*at;out.z=star.direction[2]*travel;
 const fade=Math.pow(Math.max(0,1-Math.max(0,t-star.fadeStart)/(star.life-star.fadeStart)),1.4);
 const light=t>=lag+star.delay&&t<star.life?fade:0;
 out.brightness=light*star.brightness*(j===0?2:.82*Math.pow(1-j/trails,2.0))+(j===0&&t>=0&&t<.065?3*Math.pow(1-t/.065,2):0);
 return out;
}
