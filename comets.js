import * as T from './vendor/three.module.js';
import {StarBundleField,STAR_BUNDLE_PATTERNS,STAR_BUNDLE_EXTRA_STYLES,createStarBundlePattern} from './star-bundles.js?v=1.1.4';

// An independent stream: ground shots cannot change the shapes of upper shells.
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const COMET_STYLES={
 gold:{label:'金の太い尾',head:0xffefc2,tail:0xffbd65,burn:1.28,afterglow:1.65,spread:.045,lanes:3},
 silver:{label:'銀の細かい尾',head:0xf4fbff,tail:0xdbeeff,burn:1.08,afterglow:.78,spread:.030,lanes:2},
 red:{label:'紅の星・金の尾',head:0xff263f,tail:0xffb463,burn:1.16,afterglow:1.25,spread:.037,lanes:3},
 blue:{label:'青の星・銀の尾',head:0x397dff,tail:0xc3deff,burn:1.14,afterglow:.90,spread:.030,lanes:2}
};
export const SMALL_COMET_STYLES={...COMET_STYLES,...STAR_BUNDLE_EXTRA_STYLES};
export const COMET_PATTERNS=[
 {id:'single',label:'一本の星と尾',description:'先端が先に消え、金や銀の火の粉が残ります。'},
 {id:'row',label:'縦の一斉打ち',description:'９本の高さに微差をつけ、横幅で見せます。'},
 {id:'fan',label:'５か所の扇',description:'扇を繰り返し並べ、空の下に土台を作ります。'},
 {id:'cross',label:'交差するＶ字',description:'左右から内側へ伸びる尾を交差させます。'},
 {id:'sweep',label:'左から右へ流す',description:'0.13秒ずつずらした点火で、視線を横へ運びます。'},
 {id:'sweep-reverse',label:'右から左へ流す',description:'右端から点火し、左へ傾く尾で応えます。'},
 {id:'sweep-cross',label:'流す尾のクロス',description:'左右の傾いた尾が、５か所で交わります。'},
 {id:'sweep-cross-high',label:'流す尾の高いクロス',description:'同じ５か所のクロスを高く伸ばし、次の一手へ変化をつけます。'},
 {id:'inward',label:'両端から中央へ',description:'左右が呼び合って、中央に集まる打ち方です。'},
 {id:'curtain',label:'高さの違う二段打ち',description:'低い列から高い列へ。尾が重なって幕になります。'},
 {id:'guide',label:'トラから尺玉へ',description:'手前の星、奥を昇る尺玉、上空の開花へとつなぎます。'},
 ...STAR_BUNDLE_PATTERNS
];
const TYPES=new Set(COMET_PATTERNS.map(p=>p.id));
export function createCometPattern(id='fan',style='gold',seed=1){
 if(id.startsWith('small-'))return createStarBundlePattern(id,style,seed);
 if(!TYPES.has(id))id='fan';if(!COMET_STYLES[style])style='gold';
 const shots=[],random=randomFrom(seed),add=(x,angle,height,at=0,z=-.72)=>shots.push({x,y:.035,z,angle,height,at,style,seed:Math.floor(random()*0xffffffff)});
 if(id==='single')add(0,0,.72);
 if(id==='row')for(let i=0;i<9;i++)add((i-4)*.21,(i-4)*.035,.65+(i%2)*.045);
 if(id==='fan')for(let site=0;site<5;site++)for(let ray=0;ray<3;ray++)add((site-2)*.40,(ray-1)*.48,.57,.018*site);
 if(id==='cross')for(let site=0;site<4;site++)for(const sign of [-1,1])add((site-1.5)*.44,sign*.67,.68,.028*site);
 if(id==='sweep')for(let i=0;i<9;i++)add((i-4)*.21,.25,.64,i*.13);
 if(id==='sweep-reverse')for(let i=0;i<9;i++)add(-(i-4)*.21,-.25,.64,i*.13);
 if(id==='sweep-cross'||id==='sweep-cross-high')for(let site=0;site<5;site++)for(const sign of [-1,1])add((site-2)*.38+sign*.14,-sign*.48,id==='sweep-cross-high'?.87:.63,.025*site);
 if(id==='inward')for(let i=0;i<6;i++)for(const sign of [-1,1])add(sign*(.95-i*.17),-sign*.36,.60+i*.023,i*.16);
 if(id==='curtain')for(let i=0;i<9;i++){add((i-4)*.22,(i-4)*.09,.41,0,-.58);add((i-4)*.22,(i-4)*.045,.78,.43,-.76);}
 if(id==='guide'){
  for(let i=0;i<7;i++)add((i-3)*.24,(i-3)*.12,.57,Math.abs(i-3)*.075,-.55);
  for(const x of [-.65,.65])for(let ray=-1;ray<=1;ray++)add(x,ray*.30,.68,2.42,-.65);
 }
 return shots;
}

// Analytic trajectories give identical tails at 30 / 72 / 120 Hz and after pause.
// Sparks keep their own birth position and fall; no clamping into a glowing floor.
export function cometPosition(shot,t){
 const d=shot.drag,q=(1-Math.exp(-d*t))/d;
 return {x:shot.x+shot.vx*q,y:shot.y+shot.vy*q-shot.gravity*(t-q)/d,z:shot.z+shot.vz*q};
}
export function makeComet(shot,start){
 const random=randomFrom(shot.seed),style=COMET_STYLES[shot.style]??COMET_STYLES.gold;
 const burn=style.burn*(.96+random()*.08),angle=shot.angle+(random()-.5)*.025,drag=.19+random()*.025,gravity=.48;
 // The star is still climbing as its fuel runs out.
 const q=(1-Math.exp(-drag*burn))/drag;
 const vy=(shot.height*(.975+random()*.05)+gravity*(burn-q)/drag)/q;
 const tail=Array.from({length:80*style.lanes},(_,i)=>({at:(Math.floor(i/style.lanes)+random()*.85)/80*burn,dx:(random()-.5)*style.spread,dy:(random()-.5)*.025,dz:(random()-.5)*style.spread,life:style.afterglow*(.65+random()*.5),glint:.80+random()*.35}));
 const comet={...shot,start,burn,drag,gravity,vy,vx:Math.tan(angle)*vy,vz:(random()-.5)*.02,tail,styleData:style,headColor:new T.Color(style.head),tailColor:new T.Color(style.tail),end:burn+Math.max(...tail.map(s=>s.life))};
 for(const s of tail){const birth=cometPosition(comet,s.at),remaining=Math.exp(-drag*s.at);s.x=birth.x;s.y=birth.y;s.z=birth.z;s.dx+=comet.vx*remaining*.04;s.dy+=vy*remaining*.025;s.dz+=comet.vz*.05;}
 return comet;
}

export class CometField{
 constructor({town,bridge,map,headMaps,onLaunch=()=>{},capacity=96}){
  this.town=town;this.bridge=bridge;this.capacity=capacity;this.onLaunch=onLaunch;this.active=[];this.pending=[];this.seed=0x141706;this.group=0;this.dropped=0;
  this.headPositions=new Float32Array(capacity*3);this.headColors=new Float32Array(capacity*3);
  this.tailPositions=new Float32Array(capacity*240*3);this.tailColors=new Float32Array(capacity*240*3);
  this.headGeometry=this.geometry(this.headPositions,this.headColors);this.tailGeometry=this.geometry(this.tailPositions,this.tailColors);
  this.headMaterial=new T.PointsMaterial({color:0xffffff,size:.050,vertexColors:true,map:headMaps?.miniature??map,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.tailMaterial=new T.PointsMaterial({color:0xffffff,size:.014,vertexColors:true,map,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.glowMaterial=new T.PointsMaterial({color:0xffffff,size:.105,opacity:.20,vertexColors:true,map,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  bridge.point(this.headMaterial,headMaps);bridge.point(this.tailMaterial);bridge.point(this.glowMaterial);
  this.heads=new T.Points(this.headGeometry,this.headMaterial);this.tails=new T.Points(this.tailGeometry,this.tailMaterial);this.glow=new T.Points(this.headGeometry,this.glowMaterial);
  for(const p of [this.tails,this.glow,this.heads]){p.frustumCulled=false;p.visible=false;town.add(p);}
  this.bundles=new StarBundleField({town,bridge,map,headMaps,styles:SMALL_COMET_STYLES,onLaunch:(...args)=>this.onLaunch(...args)});
 }
 geometry(positions,colors){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));g.setDrawRange(0,0);return g;}
 launch(pattern,style,at){
  if(pattern.startsWith('small-'))return this.bundles.launch(pattern,style,at);
  const group=++this.group;this.seed=(this.seed+0x9e3779b9)>>>0;
  const shots=createCometPattern(pattern,style,this.seed);
  if(this.active.length+this.pending.length+shots.length>this.capacity){this.dropped++;return false;}
  for(const s of shots)this.pending.push({...s,at:at+s.at,group});
  this.pending.sort((a,b)=>a.at-b.at);return true;
 }
 update(time){
  while(this.pending.length&&this.pending[0].at<=time){const s=this.pending.shift();if(time-s.at>.35)continue;const comet=makeComet(s,s.at);this.active.push(comet);this.onLaunch(s,time);}
  this.active=this.active.filter(s=>time-s.start<s.end);
  let heads=0,tails=0;
  for(const s of this.active){
   const age=time-s.start;
   if(age<s.burn){const p=cometPosition(s,age),fade=clamp((s.burn-age)/.16,0,1),ignite=clamp(age/.035,0,1),gain=fade*ignite*1.65;
    if(p.y>.012){this.headPositions.set([p.x,p.y,p.z],heads*3);this.headColors.set([s.headColor.r*gain,s.headColor.g*gain,s.headColor.b*gain],heads*3);heads++;}
   }
   for(const particle of s.tail){
    const t=age-particle.at;if(t<0||t>=particle.life)continue;
    const x=particle.x+particle.dx*t,y=particle.y+particle.dy*t-.15*t*t,z=particle.z+particle.dz*t;
    if(y<=.012)continue;
    const warm=clamp(t/particle.life,0,1),gain=Math.pow(1-warm,1.6)*particle.glint*(s.style==='gold'?1.20:.94);
    this.tailPositions[tails*3]=x;this.tailPositions[tails*3+1]=y;this.tailPositions[tails*3+2]=z;
    // Golden sparks cool toward orange; silver keeps its cooler, shorter afterglow.
    this.tailColors[tails*3]=s.tailColor.r*gain;this.tailColors[tails*3+1]=s.tailColor.g*gain*(1-(s.style==='silver'||s.style==='blue'?0:.35)*warm);this.tailColors[tails*3+2]=s.tailColor.b*gain*(1-.42*warm);tails++;
   }
  }
  this.headGeometry.setDrawRange(0,heads);this.tailGeometry.setDrawRange(0,tails);
  for(const g of [this.headGeometry,this.tailGeometry]){g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;}
  this.heads.visible=this.glow.visible=heads>0;this.tails.visible=tails>0;
  this.bundles.update(time);this.points=heads*2+tails+this.bundles.points;
 }
 clear(){this.active=[];this.pending=[];this.headGeometry.setDrawRange(0,0);this.tailGeometry.setDrawRange(0,0);this.heads.visible=this.glow.visible=this.tails.visible=false;this.bundles.clear();this.points=0;}
 get groups(){return new Set([...this.active,...this.pending].map(s=>s.group)).size+this.bundles.groups;}
 dispose(){this.clear();this.bundles.dispose();for(const p of [this.tails,this.glow,this.heads])this.town.remove(p);this.headGeometry.dispose();this.tailGeometry.dispose();this.headMaterial.dispose();this.tailMaterial.dispose();this.glowMaterial.dispose();}
}
