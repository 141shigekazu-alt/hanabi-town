import {candyColor} from './candy-colors.js?v=1.1.11';
import * as T from './vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAIL_POINTS=10;
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
export const STAR_BUNDLE_EXTRA_STYLES={
 'pink-silver':{label:'桃の星・銀の尾',head:0xff73c8,tail:0xdbeeff},
 'aqua-gold':{label:'水色の星・金の尾',head:0x66ddff,tail:0xffbd65},
 green:{label:'緑の星・金の尾',head:0x32ff70,tail:0xffbd65},
 'gold-silver':{label:'金の星・銀の尾',head:0xffcf77,tail:0xdbeeff},
 'white-gold':{label:'白の星・金の尾',head:0xf4fbff,tail:0xffbd65},
 'red-silver':{label:'紅の星・銀の尾',head:0xff263f,tail:0xdbeeff},
 'blue-gold':{label:'青の星・金の尾',head:0x397dff,tail:0xffbd65},
 'green-silver':{label:'緑の星・銀の尾',head:0x32ff70,tail:0xdbeeff}
};
export const STAR_BUNDLE_PATTERNS=[
 {id:'small-hop-left',label:'子トラ · 左の小さな跳ね',description:'左の２か所を細い束で跳ねさせます。'},
 {id:'small-hop-right',label:'子トラ · 右の小さな跳ね',description:'右の２か所が左に応えます。'},
 {id:'small-hop-center',label:'子トラ · 中央の小さな跳ね',description:'中央に短いリズムを置きます。'},
 {id:'small-up-tight',label:'子トラ · すぼめた吹上',description:'小さな星を細い束のまま、５か所からまっすぐ吹き上げます。'},
 {id:'small-cross-tight',label:'子トラ · すぼめたクロス',description:'細くまとまった星の束が、左右から斜めに挙がって交差します。'},
 {id:'small-up',label:'子トラ · 星の束を吹き上げる',description:'小さな星が５か所からまとまって吹き上がり、広がりながら消えます。'},
 {id:'small-cross',label:'子トラ · 星の束をクロス',description:'左右から斜めに吹き上がる星の束が、空の下で交差します。'},
 {id:'small-fan',label:'子トラ · 星の束を扇に',description:'３か所から５方向へ。小さな星の束が扇になって広がります。'}
];
export function createStarBundlePattern(id,style='gold',seed=1){
 const shots=[],random=randomFrom(seed),tight=id.endsWith('-tight');
 if(tight)id=id.slice(0,-6);
 const add=(x,angles,count,height,at=0)=>shots.push({x,y:.035,z:-.68,angles,count,height,at,style,seed:Math.floor(random()*0xffffffff),small:true,...(tight?{tight:true}: {})});
 if(id.startsWith('small-hop-')){const side=id.slice(10);for(const x of side==='left'?[-.72,-.38]:side==='right'?[.38,.72]:[-.17,.17])add(x,[0],24,.43,0);for(const q of shots)q.tight=true;}
 if(id==='small-up')for(let i=0;i<5;i++)add((i-2)*.34,[0],48,.56,.015*i);
 if(id==='small-cross')for(const x of [-.64,-.22,.22,.64])add(x,[x<0?.68:-.68],44,.54);
 if(id==='small-fan')for(const x of [-.68,0,.68])add(x,[-.64,-.32,0,.32,.64],28,.49);
 return shots;
}
export function bundleStarPosition(star,t){
 const q=(1-Math.exp(-star.drag*t))/star.drag;
 return {x:star.x+star.vx*q,y:star.y+star.vy*q-star.gravity*(t-q)/star.drag,z:star.z+star.vz*q};
}
export function makeStarBundle(shot,start,style){
 const random=randomFrom(shot.seed),stars=[],span=.32;
 for(const angle of shot.angles)for(let i=0;i<Math.ceil(shot.count*(style.bundleCountScale??1));i++){
  const drag=.25+random()*.035,gravity=.90,peak=1.03+random()*.18;
  const height=shot.height*(shot.tight?(.83+random()*.11):(.64+random()*.42)),q=(1-Math.exp(-drag*peak))/drag;
  const vy=(height+gravity*(peak-q)/drag)/q,spread=(shot.tight?.045:.16)*Math.sqrt(random()),azimuth=random()*Math.PI*2;
  stars.push({x:shot.x+(random()-.5)*.010,y:shot.y,z:shot.z+(random()-.5)*.010,
   vx:vy*Math.tan(angle+Math.cos(azimuth)*spread+(style.colorSpread??0)*((i%5)-2)/2),vy,vz:vy*Math.sin(azimuth)*spread,
   drag,gravity,at:random()*.035,life:1.40+random()*.48,gain:.84+random()*.40});
 }
 if(style.headPalette)for(let i=0;i<stars.length;i++){const color=candyColor(i,shot.seed,style.headPalette);stars[i].headColor=new T.Color(color);stars[i].tailColor=new T.Color(color);}
 return {...shot,start,stars,span,colored:!!style.headPalette,headGain:style.headGain??1.65,tailGain:style.tailGain??.65,headColor:new T.Color(shot.style==='gold'?0xffcf77:style.head),tailColor:new T.Color(style.tail),end:Math.max(...stars.map(s=>s.at+s.life))+span};
}

export class StarBundleField{
 constructor({town,bridge,map,headMaps,styles,onLaunch=()=>{},capacity=1024}){
  Object.assign(this,{town,bridge,styles,onLaunch,capacity});this.tailSamples=TAIL_POINTS;this.active=[];this.pending=[];this.seed=0x141710;this.group=0;this.dropped=0;this.points=0;
  this.headPositions=new Float32Array(capacity*3);this.headColors=new Float32Array(capacity*3);
  this.tailPositions=new Float32Array(capacity*TAIL_POINTS*3);this.tailColors=new Float32Array(capacity*TAIL_POINTS*3);
  const geometry=(positions,colors)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));g.setDrawRange(0,0);return g;};
  this.headGeometry=geometry(this.headPositions,this.headColors);this.tailGeometry=geometry(this.tailPositions,this.tailColors);
  const material=(size,opacity=1)=>new T.PointsMaterial({color:0xffffff,size,opacity,vertexColors:true,map,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.headMaterial=material(.022);this.headMaterial.map=headMaps?.miniature??map;this.tailMaterial=material(.009);this.glowMaterial=material(.046,.10);
  bridge.point(this.headMaterial,headMaps);bridge.point(this.tailMaterial);bridge.point(this.glowMaterial);
  this.heads=new T.Points(this.headGeometry,this.headMaterial);this.tails=new T.Points(this.tailGeometry,this.tailMaterial);this.glow=new T.Points(this.headGeometry,this.glowMaterial);
  for(const p of [this.tails,this.glow,this.heads]){p.frustumCulled=false;p.visible=false;town.add(p);}
 }
 launch(pattern,style,at){
  const shots=createStarBundlePattern(pattern,style,this.seed=(this.seed+0x9e3779b9)>>>0);
  if(!shots.length||!this.styles[style])return false;
  const total=s=>s.angles.length*s.count;
  const used=this.active.reduce((n,s)=>n+s.stars.length,0)+this.pending.reduce((n,s)=>n+total(s),0);
  if(used+shots.reduce((n,s)=>n+total(s),0)>this.capacity){this.dropped++;return false;}
  const group='small-'+(++this.group);
  for(const shot of shots)this.pending.push({...shot,at:at+shot.at,group});
  this.pending.sort((a,b)=>a.at-b.at);return true;
 }
 update(time){
  while(this.pending.length&&this.pending[0].at<=time){
   const shot=this.pending.shift();if(time-shot.at>.35)continue;
   this.active.push(makeStarBundle(shot,shot.at,this.styles[shot.style]));this.onLaunch(shot,time);
  }
  this.active=this.active.filter(s=>time-s.start<s.end);
  const desiredSize=.022;if(this.headSize!==desiredSize){this.headSize=desiredSize;this.bridge.point(this.headMaterial,null,desiredSize);}
  let heads=0,tails=0;
  for(const bundle of this.active)for(const star of bundle.stars){
   const age=time-bundle.start-star.at;if(age<0)continue;
   const gain=t=>star.gain*clamp(t/.030,0,1)*Math.pow(clamp((star.life-t)/.42,0,1),1.25);
   if(age<star.life){
    const p=bundleStarPosition(star,age),light=gain(age)*bundle.headGain,headColor=star.headColor??bundle.headColor;
    if(p.y>.012){this.headPositions.set([p.x,p.y,p.z],heads*3);this.headColors.set([headColor.r*light,headColor.g*light,headColor.b*light],heads*3);heads++;}
   }
   // A short history belongs to each little star, rather than another long comet.
   for(let i=1;i<=TAIL_POINTS;i++){
    const history=i*bundle.span/TAIL_POINTS,t=age-history;if(t<0||t>=star.life)continue;
    const p=bundleStarPosition(star,t);if(p.y<=.012)continue;
    const light=gain(t)*bundle.tailGain*(1-i/(TAIL_POINTS+1)),tailColor=star.tailColor??bundle.tailColor;
    this.tailPositions.set([p.x,p.y,p.z],tails*3);this.tailColors.set([tailColor.r*light,tailColor.g*light,tailColor.b*light],tails*3);tails++;
   }
  }
  this.headGeometry.setDrawRange(0,heads);this.tailGeometry.setDrawRange(0,tails);
  for(const g of [this.headGeometry,this.tailGeometry]){g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;}
  this.heads.visible=this.glow.visible=heads>0;this.tails.visible=tails>0;this.points=heads*2+tails;
 }
 clear(){this.active=[];this.pending=[];this.headGeometry.setDrawRange(0,0);this.tailGeometry.setDrawRange(0,0);this.heads.visible=this.glow.visible=this.tails.visible=false;this.points=0;}
 get groups(){return new Set([...this.active,...this.pending].map(s=>s.group)).size;}
 dispose(){this.clear();for(const p of [this.tails,this.glow,this.heads])this.town.remove(p);this.headGeometry.dispose();this.tailGeometry.dispose();this.headMaterial.dispose();this.tailMaterial.dispose();this.glowMaterial.dispose();}
}
