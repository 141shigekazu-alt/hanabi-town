import {variationRandom,flowerFlight,flowerRayVariations,centeredVariation} from './flower-variation.js';
import {PETAL_MOTION_PROFILE} from './sunflower-motion.js';
import {creativePoints,CREATIVE_PROFILES,isCreativeShell} from './creative-shells.js';
// Keep the original shell shapes and green stems; combine them into flower beds.
export const FLOWER_COLORS=Object.freeze([
 {id:'flower-red',label:'紅',color:0xff393f,core:0xffdf9b},
 {id:'flower-yellow',label:'黄色',color:0xffd52e,core:0xff5d29},
 {id:'flower-pink',label:'桃',color:0xff73c8,core:0xffdf9b},
 {id:'flower-purple',label:'紫',color:0xb67bff,core:0xffdf9b},
 {id:'flower-blue',label:'青',color:0x548bff,core:0xffdf9b}
].map(Object.freeze));
export const PETAL_PROFILE=Object.freeze({coreRadius:.14,petalRadius:1.38});
export const PHOTO_FLOWER_PROFILE=Object.freeze({...PETAL_PROFILE,coreRadius:.30});
export const PETAL_GEOMETRIES=Object.freeze({3:Object.freeze({rays:24,strands:3,coreStars:36,trails:24}),5:Object.freeze({rays:32,strands:5,coreStars:72,trails:36})});
export const petalGeometry=size=>PETAL_GEOMETRIES[size===3?3:5];
export const FLOWER_PATTERNS=[
 {id:'dandelion-scatter',label:'タンポポ · 自然にばらけた五輪'},
 {id:'dandelion-row',label:'タンポポ · 揃えた五輪（比較）'},
 {id:'color-row',label:'５色の花 · 自然な五輪'},
 {id:'color-scatter',label:'５色の花 · 少しばらけた五輪'},
 {id:'flower-carpet',label:'５色の花 · 乱れ咲く絨毯'},
 {id:'sustain-10',label:'３号のいろんな花 · 10秒の絨毯'},
 {id:'sustain-15',label:'３号のいろんな花 · 15秒の絨毯'},
 {id:'garden-10',label:'花園 · 10秒の絨毯と上空の花'},
 {id:'garden-15',label:'花園 · 15秒の絨毯と上空の花'},
 {id:'sunflower-row',label:'ひまわり · 三輪'},
 {id:'petal-one',label:'小さな芯と長い花びら · 一輪'},
 {id:'petal-row',label:'小さな芯と長い花びら · 並べ打ち'},
 {id:'petal-carpet',label:'小さな芯と長い花びら · 絨毯'},
 {id:'photo-row',label:'金の花びら · 色芯と金・並べ打ち'},
 {id:'photo-one',label:'金の花びら · 色芯と金・一輪'},
 {id:'dandelion-one',label:'タンポポ · 一輪'},
 {id:'sunflower-one',label:'ひまわり · 一輪'}
];
export const FLOWER_TIMINGS=[{id:'together',label:'揃えて咲く'},{id:'ripple',label:'左から順に咲く'},{id:'stem-first',label:'茎を少し先に見せる'}];
export const FLOWER_SPACINGS=[{id:'close',label:'寄せる'},{id:'natural',label:'標準'},{id:'wide',label:'離す'}];
export const flowerUsesSize=pattern=>pattern.startsWith('petal-')||pattern.startsWith('photo-');
export function flowerUsesColor(pattern){return pattern.startsWith('garden-')||pattern.startsWith('sustain-')||pattern.startsWith('photo-')||pattern.startsWith('petal-')||pattern.startsWith('color-')||pattern==='flower-carpet';}
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
export function flowerScene(pattern='dandelion-scatter',{timing=pattern.startsWith('sunflower')?'stem-first':'together',spacing='close',color='five',size:requestedSize=5,seed=0x141756}={}){
 const sunflower=pattern.startsWith('sunflower'),petal=pattern.startsWith('petal'),photo=pattern.startsWith('photo'),carpet=pattern.endsWith('carpet'),scatter=pattern.endsWith('scatter'),one=pattern.endsWith('one');
 const sized=petal||photo,size=sized&&[3,5,10].includes(Number(requestedSize))?Number(requestedSize):sunflower?5:3;
 const low=size===3,freeShell=sized&&!low,tall=!low;
 const count=one?1:carpet?(sized?(low?15:size===10?4:6):15):sunflower?3:sized&&size===10?3:5,columns=carpet?(sized&&!low?(size===10?2:3):5):count;
 const gap=(low?.48:sized?.83*(size===10?1.3:1):.78)*({close:.82,natural:1,wide:1.2}[spacing]??.82);
 const ascent=size===10?3.12:(1+size*.035)*1.2*(2.62/1.62),shots=[],fans=[],flowers=[],random=rng(seed);
 for(let i=0;i<count;i++){
  const row=Math.floor(i/columns),col=i%columns,jitter=scatter||carpet||pattern==='color-row';
  const reviewSeed=(seed+Math.imul(i+1,7919))>>>0,flight=flowerFlight(size,reviewSeed,!freeShell);
  const x=flight.dx+(col-(columns-1)/2)*gap+(jitter?(random()-.5)*gap*.28:0),z=flight.dz-.72+(carpet?(row-(Math.ceil(count/columns)-1)/2)*.21:0)+(jitter?(random()-.5)*.06:0);
  const headY=flight.heightOffset+(low?.80:freeShell?(size===10?1.30:1.04):1.24)+(carpet?row*.045:0)+(jitter?(random()-.5)*.12:0);
  const anchor=3.2+(carpet?random()*2.0:jitter?random()*.34:0)+(timing==='ripple'?col*.42+row*.18:0),at=anchor-ascent,opening=anchor+flight.ascentOffset+flight.ignitionDelay;
  const selected=FLOWER_COLORS.find(c=>c.id===color),palette=flowerUsesColor(pattern)?(selected??FLOWER_COLORS[(carpet?col+row*2:i)%5]).id:'flower-yellow';
  const kind=photo?'goldflower':petal?'petalflower':sunflower?'sunflower':pattern==='flower-carpet'?['kiku','petalflower','kiku','goldflower','kiku'][i%5]:'kiku';
  const position={x,z,heightOffset:headY-(size===10?1.30:tall?1.04:.80),startAt:at,ignitionDelay:flight.ignitionDelay,ascentOffset:flight.ascentOffset,reviewSeed,flowerFlight:flight,flowerStudy:true,...(!sunflower?{palette}:{})};
  shots.push({at,opening,kind,size,position});
  const stemAt=opening-(tall?1.55:1.10)-(timing==='stem-first'?.25:0);
  if(!freeShell){fans.push({at:stemAt,mode:tall?'flower-stem-large':'small-flower-stem',style:'flower-green',options:{x,z,height:(tall?1.03:.53)+headY-(tall?1.24:.80),reviewSeed:(seed+i*3571)>>>0}});
   fans.push({at:opening-.55,mode:'small-flower-leaves',style:'flower-green',options:{x,z:z+.015,height:tall?.30:.21,reviewSeed:(seed+i*7919+1)>>>0}});}
  flowers.push({x,z,opening,headY,size,kind,stemAt:freeShell?null:stemAt,palette});
 }
 shots.sort((a,b)=>a.at-b.at);fans.sort((a,b)=>a.at-b.at);
 return {pattern,timing,spacing,color,size,freeShell,seed,count,flowers,shots,fans,end:Math.max(...shots.map(s=>s.opening+(['petalflower','goldflower'].includes(s.kind)?PETAL_MOTION_PROFILE.life:s.kind==='sunflower'?4.3:3.2)))+.5};
}
// Each ray keeps a shared character across its strands; all tails follow the same path.
export function radialFlowerStars(kind,colors,size=5,seed=0x141760){
 const petal=kind==='petalflower'||kind==='goldflower',profile=petal?petalGeometry(size):petalGeometry(5),stars=[],middle=(profile.strands-1)/2,random=variationRandom(seed,0x391a50);
 const rays=flowerRayVariations(seed,profile.rays);
 for(let ray=0;ray<profile.rays;ray++)for(let strand=0;strand<profile.strands;strand++){
  const v=rays[ray],angle=ray*Math.PI*2/profile.rays+v.angle+(strand-middle)*.004+centeredVariation(random)*.001;
  stars.push({direction:[Math.cos(angle),Math.sin(angle),v.depth+(strand-middle)*.006],radius:(petal?PETAL_PROFILE.petalRadius:1)*v.radius*(1+(strand-middle)*.003),color:colors[0],motion:{rate:v.rate,delay:v.delay,fade:Math.min(1,v.fade+centeredVariation(random)*.006)}});
 }
 for(let i=0;i<profile.coreStars;i++){const y=1-2*(i+.5)/profile.coreStars,a=i*2.399963229728653+(random()-.5)*.045,r=Math.sqrt(1-y*y);stars.push({direction:[r*Math.cos(a),y,r*Math.sin(a)],radius:(kind==='goldflower'?PHOTO_FLOWER_PROFILE.coreRadius:petal?PETAL_PROFILE.coreRadius:.51)*(.965+random()*.07),color:colors[1],motion:{rate:.97+random()*.06,delay:random()*.020,fade:.94+random()*.06}});}
 return stars;
}
export function flowerGroundShots(pattern,seed,options={}){
 const x=Number(options.x)||0,z=Number.isFinite(options.z)?options.z:-.72,height=Number(options.height)||(pattern==='flower-stem-large'?1.03:.53);
 if(pattern==='flower-stem-large')return [{x,y:.18,z,angle:0,height,at:0,style:'flower-green',seed,motion:{burn:2.55,drag:.16,gravity:.20,vx:0,afterglow:1.15,tailSamples:120,headGain:1.05}}];
 if(pattern==='small-flower-stem')return [{x,y:.18,z,angles:[0],count:36,height,at:0,style:'flower-green',seed,small:true,tight:true,spreadScale:.32,span:.40}];
 if(pattern==='small-flower-leaves')return [-1,1].map((sign,i)=>({x:x+sign*.025,y:.18,z,angles:[sign*.58],count:24,height,at:0,style:'flower-green',seed:(seed+i*1237)>>>0,small:true,tight:true,spreadScale:.35,span:.32}));
 return [];
}

// Continuous, saved choreography: each flower owns its stem/leaf cues and seed.
// A full-sized 3-go chrysanthemum is retained for every bloom.
export function flowerCarpetPassage({firstOpening=3.2,duration=10,period=.5,spacing='close',color='five',seed=0x141758,mixed=true}={}){
 duration=duration>=15?15:10;
 const random=rng(seed),cadence=Math.max(.47,Math.min(.60,period*.9)),count=Math.floor(duration/cadence)+1;
 const gap=.48*({close:.82,natural:1,wide:1.2}[spacing]??.82),shots=[],fans=[],flowers=[];
 const ascent=(1+3*.035)*1.2*(2.62/1.62);
 for(let i=0;i<count;i++){
  const slot=(i*7)%15,col=slot%5,row=Math.floor(slot/5),reviewSeed=(seed+Math.imul(i+1,7919))>>>0,flight=flowerFlight(3,reviewSeed,true);
  const x=flight.dx+(col-2)*gap+(random()-.5)*gap*.24,z=flight.dz-.72+(row-1)*.20+(random()-.5)*.06;
  const headY=.80+flight.heightOffset+row*.035+(random()-.5)*.10;
  const anchor=firstOpening+i*duration/(count-1)+(i&&i<count-1?(random()-.5)*.05:0),at=anchor-ascent,opening=anchor+flight.ascentOffset+flight.ignitionDelay;
  const palette=(FLOWER_COLORS.find(c=>c.id===color)??FLOWER_COLORS[(i+Math.floor(i/5)*2)%5]).id;
  const position={x,z,heightOffset:headY-.80,startAt:at,ignitionDelay:flight.ignitionDelay,ascentOffset:flight.ascentOffset,reviewSeed,flowerFlight:flight,palette,flowerProgramme:true};
  const kind=mixed?['kiku','petalflower','kiku','goldflower','kiku'][i%5]:'kiku';
  shots.push({at,opening,anchor:opening,kind,size:3,group:'auto-flower-carpet',position});
  const stemAt=opening-1.1;
  fans.push({at:stemAt,mode:'small-flower-stem',style:'flower-green',options:{x,z,height:.53+headY-.80,reviewSeed,motionRate:1}},{at:opening-.55,mode:'small-flower-leaves',style:'flower-green',options:{x,z:z+.015,height:.21,reviewSeed:(reviewSeed+1)>>>0,motionRate:1}});
  flowers.push({x,z,headY,opening,stemAt,palette,size:3,kind});
 }
 fans.sort((a,b)=>a.at-b.at);
 return {pattern:duration===15?'sustain-15':'sustain-10',count,duration,firstOpening,lastOpening:firstOpening+duration,shots,fans,flowers,spacing,color,seed,end:firstOpening+duration+3.2+.35};
}

function gardenAllocation(shots,fans){
 const events=[];
 for(const s of shots){
  const radial=s.kind==='petalflower'||s.kind==='goldflower',g=petalGeometry(s.size);
  const points=isCreativeShell(s.kind)?creativePoints(s.kind,s.size):radial?(g.rays*g.strands+g.coreStars)*g.trails:s.kind==='sunflower'?11736:2112;
  const life=isCreativeShell(s.kind)?CREATIVE_PROFILES[s.kind].life:radial?PETAL_MOTION_PROFILE.life:s.kind==='sunflower'?4.3:3.2;
  events.push({at:s.at,upper:1,points},{at:s.opening+life+.1,upper:-1,points:-points});
 }
 for(const f of fans){const stars=f.mode==='small-flower-leaves'?48:36;events.push({at:f.at,upper:0,points:stars*11},{at:f.at+3.3,upper:0,points:-stars*11});}
 events.sort((a,b)=>a.at-b.at||a.upper-b.upper||a.points-b.points);
 let upper=0,points=0,peakUpper=0,peakPoints=0;
 for(const e of events){upper+=e.upper;points+=e.points;peakUpper=Math.max(peakUpper,upper);peakPoints=Math.max(peakPoints,points);}
 return{peakUpper,peakPoints};
}
// A lower mixed carpet and independent, stemless 5-go/shaku flowers above it.
export function flowerGardenPassage(options={}){
 const bed=flowerCarpetPassage({...options,mixed:options.mixed??true}),upperShots=[];
 const {firstOpening,duration,seed,color}=bed,upperRandom=variationRandom(seed,0x76f10a);
 for(let index=0,offset=.9;offset<duration-.25;index++,offset+=2.7){
  const family=upperShots.length%3,last=duration-offset<3.6,roll=upperRandom(),kind=options.creativeUpper&&index%3===1?(roll<.7?'butterfly':roll<.9?'planet':'drum'):family===0&&!last?'sunflower':family===1?'petalflower':'goldflower';
  const size=!['sunflower','butterfly','planet','drum'].includes(kind)&&index%2===1?10:5,ascent=size===10?3.12:(1+size*.035)*1.2*(2.62/1.62);
  const reviewSeed=(seed+Math.imul(index+501,7919))>>>0,flight=flowerFlight(size,reviewSeed);
  const x=flight.dx+[-.62,.52,.04,-.36,.68,-.1][index%6],z=flight.dz-.94-(index%2)*.06;
  const headY=flight.heightOffset+(size===10?1.85:1.46)+(index%3-1)*.025;
  const palette=kind==='drum'?'drum-candy':kind==='sunflower'||isCreativeShell(kind)?'original':(FLOWER_COLORS.find(c=>c.id===color)??FLOWER_COLORS[(index+2)%5]).id;
  // The bed retains every small flower. Place upper shells only in available
  // slots; a small timing adjustment never weakens or deletes the lower carpet.
  for(const shift of [0,.25,.5,.75,1,1.25,1.5,-.25]){
   const anchor=firstOpening+offset+shift,at=anchor-ascent,opening=anchor+flight.ascentOffset+flight.ignitionDelay;
   if(at<bed.shots[0].at||opening>bed.lastOpening+.01)continue;
   const shot={at,opening,anchor:opening,kind,size,group:'auto-flower-garden-upper',position:{x,z,heightOffset:headY-(size===10?1.30:1.04),startAt:at,ignitionDelay:flight.ignitionDelay,ascentOffset:flight.ascentOffset,reviewSeed,flowerFlight:flight,palette,flowerProgramme:true}};
   const b=gardenAllocation([...bed.shots,...upperShots,shot],bed.fans);
   if(b.peakUpper<=14&&b.peakPoints<=64000){upperShots.push(shot);break;}
  }
 }
 const shots=[...bed.shots,...upperShots].sort((a,b)=>a.at-b.at);
 const end=Math.max(bed.end,...upperShots.map(s=>s.opening+(isCreativeShell(s.kind)?CREATIVE_PROFILES[s.kind].life:s.kind==='sunflower'?4.3:PETAL_MOTION_PROFILE.life)+.35));
 return {...bed,pattern:duration===15?'garden-15':'garden-10',shots,upperShots,upperCount:upperShots.length,floorCount:bed.count,totalCount:shots.length,end};
}
