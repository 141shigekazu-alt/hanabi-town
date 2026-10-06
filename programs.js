import {EAR_PROFILE,createEarRow,createEarTiming} from './golden-ears.js?v=1.1.11';
import {cue as baseCue,chapter,CORE_PALETTES,KIKU_PALETTES} from './fireworks.js?v=1.1.11';
export const PROGRAM_NAMES={one:'プログラム1 · 一玉を味わう',two:'プログラム2 · 街の競演',random:'おまかせ'};
function randomStream(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function createProgram(mode='one',seed=1){
 if(!PROGRAM_NAMES[mode])mode='one';
 const random=randomStream(mode==='random'?seed:mode==='two'?202:101);
 const slots=mode==='two'?[35,75,185,225,250,270]:mode==='random'?[40+Math.floor(random()*12),185+Math.floor(random()*12),235+Math.floor(random()*6),270]:[45,200,250,270];
 const patternOrder=mode==='random'?Object.keys(RANDOM_PATTERNS):[];
 for(let i=patternOrder.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[patternOrder[i],patternOrder[j]]=[patternOrder[j],patternOrder[i]];}
 return {mode,seed:mode==='random'?seed:mode==='two'?202:101,name:PROGRAM_NAMES[mode],slots,bigAt:130,senrinAt:[105,165],patternOrder};
}
export function programCue(plan,time,index,lively=false){
 const c=baseCue(time,index,lively);if(!c)return null;
 const random=randomStream((plan.seed+Math.imul(index+1,2654435761))>>>0),part=chapter(time);
 if(plan.mode==='random'){
 const kinds=['core','double','willow','sunflower','spiral'];c.kind=kinds[Math.floor(random()*kinds.length)];
 c.size=part==='幕開け'?[3,3,5][Math.floor(random()*3)]:part==='一玉を味わう'?10:[3,5,5,10][Math.floor(random()*4)];
 if(c.kind==='double'&&c.size!==10)c.kind='core';
 c.interval*=.85+random()*.3;
 }else if(plan.mode==='two'){
 c.kind=['core','sunflower','willow','double','spiral','core'][index%6];
 if(c.kind==='double'&&c.size!==10)c.kind='core';
 if(part!=='一玉を味わう')c.interval*=.88;
 }
 const z=-.45+random()*.8;
 const x=plan.mode==='two'?(index%2===0?-.65:.65):-.8+random()*1.6;
 if(plan.mode==='random'&&c.size===3&&c.kind==='core')c.kind='kiku';
 const palettes=c.kind==='core'?CORE_PALETTES:c.kind==='kiku'?KIKU_PALETTES:null;
 const palette=palettes?.[(index+plan.seed)%palettes.length].id;
 return {...c,position:{x,z,...(palette?{palette}:{})}};
}

export const RANDOM_PATTERNS={sweep:'七色の流し打ち',mirror:'両岸の掛け合い',carpet:'菊の横一列と大玉',tiers:'上下二段の彩り',gold:'金の菊と柳'};
export function randomStarmine(plan,time,index=0,lively=false){
 const random=randomStream((plan.seed+Math.imul(index+1,2246822519))>>>0);
 const key=plan.patternOrder[index%plan.patternOrder.length]??'sweep';
 const themes=[{kiku:'blue',core:'gold-blue'},{kiku:'red',core:'white-red'},{kiku:'green',core:'purple-green'},{kiku:'pink',core:'blue-pink'}];
 const theme=themes[Math.floor(random()*themes.length)],shots=[],fans=[];
 const ascent=size=>size===10?3.12:(1+size*.035)*1.2*(2.62/1.62);
 const add=(offset,kind,size,x,heightOffset=0,palette=null,z=.08)=>shots.push({at:time+offset,kind,size,position:{x,z,heightOffset,...(palette?{palette}:{})}});
 const low=(offset,x,palette=theme.kiku)=>add(offset,'kiku',3,x,-.13,palette);
 if(key==='sweep'){
  const reverse=random()<.5?-1:1,spacing=lively?.55:.7;
  for(let i=0;i<7;i++)low(i*spacing,reverse*(-1.02+i*.34),KIKU_PALETTES[(i+index)%KIKU_PALETTES.length].id);
  for(const x of [-.48,.48])add(9,'core',5,x,.08,theme.core,-.2);
  fans.push({at:time,mode:'fan'});
 }else if(key==='mirror'){
  for(let i=0;i<3;i++){low(i*2,-.95+i*.15,theme.kiku);low(i*2+.6,.95-i*.15,theme.kiku);}
  for(const x of [-.52,.52])add(9,'core',5,x,.1,theme.core,-.18);
  fans.push({at:time+2,mode:'cross'});
 }else if(key==='carpet'){
  for(let i=0;i<7;i++)low(0,-1.02+i*.34);
  for(const x of [-.68,0,.68])add(6,'core',10,x,.12,theme.core,-.23);
  fans.push({at:time,mode:'fan'});
 }else if(key==='tiers'){
  // Queue by opening time, so different sizes make deliberate height layers.
  const opening=4;
  for(const x of [-1,-.5,0,.5,1])low(opening-ascent(3),x);
  for(const x of [-.62,0,.62])add(opening+.65-ascent(5),'core',5,x,.18,theme.core,-.23);
  fans.push({at:time+opening-1.1,mode:'cross'});
 }else{
  for(const x of [-1,-.5,0,.5,1])low(0,x,'original');
  for(const x of [-.48,.48])add(7,'willow',5,x,.14,null,-.18);
  fans.push({at:time,mode:'fan'});
 }
 fans.splice(0,fans.length,...normalGroundCues('random',plan.seed,index,time,false));
 shots.sort((a,b)=>a.at-b.at);
 const lastFade=Math.max(...shots.map(s=>s.at+ascent(s.size)+(s.kind==='willow'?5.5:s.kind==='kiku'?3.2:3.5)));
 return {key,label:RANDOM_PATTERNS[key],shots,fans,nextLaunch:lastFade+2.4};
}

export function normalGroundCues(mode,seed,index,start,finale=false){
 const sets=[
  [['small-up-tight','green'],['sweep','gold'],['small-cross-tight','red']],
  [['small-fan','blue-gold'],['fan','silver'],['small-up-tight','white-gold']],
  [['small-cross','green-silver'],['curtain','gold'],['small-up','red-silver']],
  [['small-up-tight','gold'],['inward','silver'],['small-fan','green-silver']]
 ];
 const pick=finale?3:mode==='random'?((seed>>>0)+index)%sets.length:(index+(mode==='two'?1:0))%sets.length;
 const cues=sets[pick].map(([pattern,style],i)=>({at:start+i*2.4,mode:pattern,style}));
 if(finale)cues.push({at:start+10.2,mode:'small-up-tight',style:'gold'});
 return cues;
}

// Quiet low aerial rows, with a separate seed for each volley and each show.
export function normalEarSequence(seed,start=.8,rounds=3){
 const offsets=[0,4.27,8.61],shots=[];
 for(let round=0;round<rounds;round++){
  const rowSeed=(seed+round*1777)>>>0,row=createEarRow(rowSeed),timing=createEarTiming(rowSeed),at=start+offsets[round];
  row.forEach((p,i)=>{const shotAt=at+timing[i].launchOffset;shots.push({at:shotAt,kind:'ear',size:2,position:{...p,z:-.7+p.z,ignitionDelay:timing[i].ignitionDelay,startAt:shotAt}});});
 }
 return {shots,finishAt:Math.max(...shots.map(s=>s.at+1.65+s.position.ignitionDelay))+EAR_PROFILE.life+.45};
}
