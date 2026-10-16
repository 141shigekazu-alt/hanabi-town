import {CANDY_PALETTES} from './candy-colors.js';
import {variationRandom} from './flower-variation.js';

// Artistic trajectories based on Ishii's three references. These are not
// diagrams: stars keep their initial velocity, drag, gravity and burn time.
export const CREATIVE_KINDS=['butterfly','planet','drum'];
export const isCreativeShell=kind=>CREATIVE_KINDS.includes(kind);
export const CREATIVE_PROFILES={
 butterfly:{label:'蝶',life:2.7,trails:64},
 planet:{label:'惑星',life:3.3,trails:48},
 drum:{label:'鼓',life:2.9,trails:96}
};
const PALETTES={
 butterfly:[{id:'original',label:'６色の先端 × 短い金の尾',colors:[0xff393f,0x548bff,0x67f591,0xff73c8,0xb67bff,0xffd52e],tailColor:0xffc16b},{id:'butterfly-pink',label:'桃・紫・水色の先端 × 短い銀の尾',colors:[0xff73c8,0xb67bff,0x66ddff],tailColor:0xe9ecff},{id:'butterfly-gold',label:'金・橙の先端 × 短い金の尾',colors:[0xffd48b,0xff8b32,0xffedc6],tailColor:0xffb84e}],
 planet:[{id:'original',label:'青紫の球 × 金の帯',colors:[0x929bff,0xffe0a2,0xffbb60]},{id:'planet-aqua',label:'水色の球 × 桃の帯',colors:[0x66ddff,0xfff1d0,0xff73c8]},{id:'planet-purple',label:'紫の球 × 銀の帯',colors:[0xb67bff,0xffd28b,0xf0f6ff]}],
 drum:[{id:'original',label:'白銀の扇 × 紅の先端',colors:[0xff453c,0xfff3e2,0xffe4bc]},{id:'drum-blue',label:'白銀の扇 × 青の先端',colors:[0x548bff,0xf0f6ff,0xd8e4ff]},{id:'drum-gold',label:'金の扇 × 桃の先端',colors:[0xff73c8,0xffe2a0,0xffbd60]},{id:'drum-candy',label:'全部キャンディー · ５色',colors:CANDY_PALETTES[0].colors,coloredTail:true}]
};
export const creativePalettes=kind=>PALETTES[kind]??[];
export const creativeTailColor=(kind,id='original')=>{if(id==='programme-gold')return 0xffc16b;const p=creativePalettes(kind).find(p=>p.id===id)??creativePalettes(kind)[0];return p?.tailColor??p?.colors[2];};
export const creativePointScale=(star,trail)=>star.group==='waist-ring'?(trail===0?2.85:1):star.group==='wing'?(trail===0?2.15:trail===1?1.35:.85):star.group==='fan'?(trail===0?2.65:trail===1?1.45:.80):1;
export function creativeCounts(kind,size){const large=size===10;return kind==='butterfly'?4*(large?24:size===3?12:18)*2+12:kind==='drum'?2*(large?34:24)+(large?20:16):kind==='planet'?(large?220:150)+(large?174:118)+(large?164:116):0;}
export const creativeSizes=kind=>kind==='butterfly'?[3,5,10]:[5,10];
export const creativePoints=(kind,size)=>creativeCounts(kind,size)*CREATIVE_PROFILES[kind].trails;
const unit=(x,y,z)=>{const n=Math.hypot(x,y,z);return[x/n,y/n,z/n];};
function rotate(v,roll,yaw,pitch){let[x,y,z]=v,c=Math.cos(roll),s=Math.sin(roll);[x,y]=[c*x-s*y,s*x+c*y];c=Math.cos(yaw);s=Math.sin(yaw);[x,z]=[c*x+s*z,-s*x+c*z];c=Math.cos(pitch);s=Math.sin(pitch);return[x,c*y-s*z,s*y+c*z];}

export function createCreativeStars(kind,size,seed,{pose='natural'}={}){
 if(!isCreativeShell(kind)||!creativeSizes(kind).includes(size))throw Error('この創造花火では選べない大きさです。');
 const r=variationRandom(seed,0xc4ea7171),stars=[],large=size===10;
 const signed=()=>r()*2-1;
 let roll=(kind==='planet'?-.55:kind==='butterfly'?-.10:0)+signed()*.07;
 let yaw=pose==='side'?.88:pose==='front'?0:signed()*.22,pitch=pose==='front'?0:signed()*.09;
 if((kind==='drum'||kind==='butterfly')&&pose==='natural'){const orientation=variationRandom(seed,kind==='butterfly'?0xb27790:0xd2a08601);roll=orientation()*Math.PI;yaw=(orientation()*2-1)*.65;pitch=(orientation()*2-1)*.38;}
 const sx=1+signed()*.025,sy=1+signed()*.025;
 const add=(vector,group,extra={})=>{
  const len=Math.hypot(...vector),direction=rotate(unit(...vector),roll,yaw,pitch);
  direction[0]*=sx;direction[1]*=sy;
  stars.push({direction,speed:len*(1+signed()*.035),group,layer:group==='outer'?0:group==='core'?1:2,
   drag:1.18+r()*.14,gravity:.030+r()*.009,delay:.008+r()*.045,
   life:(kind==='butterfly'?2.9:kind==='drum'?2.5:2.9)+signed()*.15,
   fade:kind==='drum'?1.15:1.45,history:.58+r()*.13,
   phase:r()*Math.PI*2,head:group==='wing'?(r()<.65?0:1):group==='fan'?(r()<.22?0:1):group==='outer'?0:group==='core'?1:2,...extra});
 };
 if(kind==='butterfly'){
  const rays=large?24:size===3?12:18;
  for(let side of [-1,1])for(let lobe of [-1,1])for(let k=0;k<rays;k++){
   const u=(k+.3+r()*.4)/rays,angle=((lobe===1?14+64*u:-65+53*u)+signed()*.65)*Math.PI/180;
   const speed=(lobe===1?1.28:1.05)*(.83+.17*Math.sin(Math.PI*u));
   for(let strand=0;strand<2;strand++)add([side*Math.cos(angle)*speed,Math.sin(angle)*speed,(strand?1:-1)*(.026+.035*Math.sin(Math.PI*u))+signed()*.018],'wing',{history:.84+r()*.08,life:2.35+signed()*.10,fade:1.05});
  }
  for(let k=0;k<12;k++)add([signed()*.045,(k/11-.5)*.29,signed()*.028],'body',{head:2,history:.13,life:1.8,fade:.70});
 }else if(kind==='drum'){
  const n=large?34:24;
  for(let side of [-1,1])for(let k=0;k<n;k++){
   const a=k*2.399963229728653,rad=k<n*.6?.88+r()*.12:Math.sqrt(r())*.85;
   add([side*(.88+.14*Math.sqrt(1-rad*rad)),Math.cos(a)*rad*.79,Math.sin(a)*rad*.38],'fan',{history:1.28+r()*.08,life:2.52+signed()*.12,fade:1.12});
  }
  // A full ring around the narrow waist, in the plane perpendicular to
  // the two fans' shared axis. Its front and rear stars have real depth.
  const count=large?20:16,phase=r()*Math.PI*2;
  for(let k=0;k<count;k++){
   const angle=phase+(k+.5+signed()*.045)/count*Math.PI*2,radius=(.235+signed()*.009)*1.5;
   add([signed()*.004,Math.cos(angle)*radius,Math.sin(angle)*radius],'waist-ring',{head:1,history:.085,life:2.45+signed()*.08,fade:1.1,waistAngle:angle,waistRadius:radius});
  }
 }else{
  const outer=large?220:150,core=large?174:118,ring=large?164:116;
  // Sparse blue globe, compact gold chrysanthemum, tilted elliptical orbit.
  for(let k=0;k<outer;k++){const y=1-2*(k+.5)/outer,a=k*2.399963229728653,z=Math.sqrt(1-y*y);add([z*Math.cos(a)*.91,y*.91,z*Math.sin(a)*.91],'outer',{history:.045,life:2.9+signed()*.16,fade:1.75});}
  for(let k=0;k<core;k++){const y=1-2*(k+.5)/core,a=k*2.399963229728653,z=Math.sqrt(1-y*y);add([z*Math.cos(a)*.50,y*.50,z*Math.sin(a)*.50],'core',{history:.34,life:2.38+signed()*.12,fade:1.10});}
  for(let k=0;k<ring;k++){const a=(k+r()*.25)/ring*Math.PI*2;add([Math.cos(a)*1.39,Math.sin(a)*.13,Math.sin(a)*.66],'ring',{history:.84+r()*.08,life:2.83+signed()*.15,fade:1.45});}
 }
 if(kind==='butterfly'){const offset=Math.floor(stars[0].phase*3);for(let i=0;i<stars.length;i++)if(stars[i].group==='wing'){stars[i].head=(Math.floor(i/2)+offset)%6;stars[i].gravity*=.55;}}
 return stars;
}

// The tail samples each star's recent path, rather than drawing a permanent
// line from the centre. Head and tail fade together before gravity ruins it.
export function creativePoint(star,radius,time,trail,trails,out={}){
 const age=time-star.delay,lag=star.history*trail/(trails-1),at=Math.max(0,age-lag),travel=radius*star.speed*(1-Math.exp(-star.drag*at));
 const d=star.direction;out.x=d[0]*travel;out.y=d[1]*travel+.042*at-star.gravity*at*at;out.z=d[2]*travel;
 const fade=age<0?0:Math.pow(Math.max(0,Math.min(1,(star.life-age)/(star.life-star.fade))),1.25);
 const tip=trail===0?(star.group==='outer'?2.2:3.0):star.group==='outer'?.48:star.group==='wing'?.90:1.45;
 const twinkle=star.group==='outer'?.82+.18*Math.sin(age*13+star.phase):1;
 out.brightness=age>=lag?tip*Math.pow(1-trail/trails,.85)*fade*twinkle:0;
 if(star.group==='waist-ring')out.brightness=age>=lag&&trail<3?(trail===0?2.65:.42/trail)*fade:0;
 out.headMix=star.group==='wing'?Math.exp(-trail/5):star.group==='fan'?Math.exp(-trail/2.1):1;
 return out;
}
