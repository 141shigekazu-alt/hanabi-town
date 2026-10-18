import {landscapeUpperDeck} from './landscape-upper.js?v=1.3.10';
import {variationRandom} from './flower-variation.js';
import {rainEarSequence} from './rain-ears.js';
import {EAR_PROFILE} from './golden-ears.js';
import {flowerGardenPassage} from './flower-scenes.js';
export const EAR_SCENES=Object.freeze([
 {id:'auto',label:'おまかせ · 穂を使う量にもメリハリ'},
 {id:'gold',label:'実り · 金の稲穂'},
 {id:'alternating',label:'雨 · 水色と青を交互に'},
 {id:'sunset',label:'夕焼 · 赤とオレンジを交互に'},
 {id:'sea-sunset',label:'海が夕日に染まる · 六つの波'},
 {id:'sea-sunset-long',label:'海から夕焼へ · 九波のベース'},
 {id:'paddy-season',label:'水田 · 朝日から真夏、実りへ'},
 {id:'red',label:'赤の穂'},
 {id:'orange',label:'オレンジの穂'},
 {id:'purple',label:'紫の穂'},
 {id:'green',label:'田園 · 緑の穂と上空の花'},
 {id:'aqua',label:'水色の穂'},
 {id:'blue',label:'青の穂'}
].map(Object.freeze));
export const earScene=id=>EAR_SCENES.find(s=>s.id===id)??EAR_SCENES[0];
export function earLandscape({mode='green',firstOpening=2,duration=16,flowers=true,seed=0x141766,waves:requestedWaves}={}){
 const shots=[],rows=requestedWaves??(duration>=16?3:1);
 for(let row=0;row<rows;row++){
  const start=firstOpening-1.65+row*4.6;
  for(let level=0;level<2;level++){
   const rowSeed=(seed+Math.imul(row,7919)+Math.imul(level,0x35a17))>>>0;
   const single=rainEarSequence(rowSeed,mode,start);
   for(const s of single.shots){
    // Independently sampled heights, lean and ignition; a shallow foreground
    // offset fills gaps while preserving the corresponding column's colour.
    s.position.x+=level*.07;
    s.position.z+=level*.13;
    s.position.heightOffset-=level*.18;
    s.position.earColumn=((s.position.earSeed-rowSeed)>>>0)/313;
    s.position.earField=true;s.position.earLevel=level;s.position.earWave=row;
    s.opening=s.at+1.65+s.position.ignitionDelay;s.anchor=s.opening;s.group='auto-ear-field';
    shots.push(s);
   }
  }
 }
 const lastOpening=Math.max(...shots.map(s=>s.opening));
 if(flowers){
  const garden=flowerGardenPassage({firstOpening:firstOpening+.5,duration:rows===3?15:10,seed:(seed^0x51eaf103)>>>0});
  for(const s of garden.upperShots)if(s.at>=firstOpening-1.65&&s.opening<=lastOpening+EAR_PROFILE.life-2.5)shots.push({...s,position:{...s.position,earField:true},group:'auto-ear-garden-upper'});
 }
 shots.sort((a,b)=>a.at-b.at);
 const end=Math.max(...shots.map(s=>s.opening+(s.kind==='ear'?EAR_PROFILE.life:s.kind==='sunflower'?4.3:2.4)+.25));
 return {shots,fans:[],firstOpening:Math.min(...shots.filter(s=>s.kind==='ear').map(s=>s.opening)),lastExtinction:end-.25,finishAt:end+.2,end,count:shots.filter(s=>s.kind==='ear').length,upperCount:shots.filter(s=>s.kind!=='ear').length,columns:11,levels:2,waves:rows,mode};
}

// Whole tufts retain their launch colour. Successive waves add more sunset
// columns; older blue tails fade on their own accepted trajectories.
export function seaSunsetPassage({firstOpening=2,seed=0x141768,long=false,flowers=false}={}){
 const scene=earLandscape({mode:'alternating',firstOpening,seed,flowers:false,waves:long?9:6});
 const random=variationRandom(seed,0x5ea51e7),shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const even=shuffle([0,2,4,6,8,10]),odd=shuffle([1,3,5,7,9]),order=[];
 for(let i=0;i<6;i++){order.push(even[i]);if(i<5)order.push(odd[i]);}
 const warmCounts=long?[0,0,0,3,6,9,11,11,11]:[0,0,3,7,11,11],labels=long?['青い海 · 一波目','青い海 · 二波目','青い海 · 三波目','夕色が少し混じる','夕色が広がる','夕色が深まる','赤とオレンジ · 一波目','赤とオレンジ · 二波目','赤とオレンジ · 三波目']:['青い海 · 一波目','青い海 · 二波目','夕色が少し混じる','夕色が広がる','赤とオレンジ · 一波目','赤とオレンジ · 二波目'];
 const stages=warmCounts.map((warmColumns,wave)=>{
  const columns=new Set(order.slice(0,warmColumns)),shots=scene.shots.filter(s=>s.position.earWave===wave);
  for(const s of shots){const column=s.position.earColumn;s.position.palette=columns.has(column)?(column%2?'ear-orange':'ear-red'):(column%2?'ear-blue':'ear-aqua');}
  return {wave,warmColumns,coolColumns:11-warmColumns,warmEars:warmColumns*2,label:labels[wave],start:Math.min(...shots.map(s=>s.at)),opening:Math.min(...shots.map(s=>s.opening)),lastOpening:Math.max(...shots.map(s=>s.opening))};
 });
 const result={...scene,mode:long?'sea-sunset-long':'sea-sunset',stages,warmOrder:order};
 if(flowers){const upper=seaSunsetUpperDeck(result,{seed});result.shots=[...result.shots,...upper].sort((a,b)=>a.at-b.at);result.upperCount=upper.length;}
 return result;
}

// The upper layer changes with each seed; colour is a broad direction.
export const seaSunsetUpperDeck=(scene,options)=>landscapeUpperDeck(scene,options);

export function paddySeasonPassage({firstOpening=2,seed=0x141770,flowers=false}={}){
 const scene=earLandscape({mode:'purple',firstOpening,seed,flowers:false,waves:8});
 const tones=['ear-purple','ear-purple','ear-green','ear-green','ear-green','original','original','original'];
 const stages=tones.map((palette,wave)=>{
  const phase=wave<2?'dawn':wave<5?'summer':'harvest',name=phase==='dawn'?'紫の穂 · 朝日':phase==='summer'?'緑の穂 · 真夏の水田':'金の穂 · 実った水田';
  const shots=scene.shots.filter(s=>s.position.earWave===wave);for(const s of shots)s.position.palette=palette;
  return {wave,phase,palette,label:name,start:Math.min(...shots.map(s=>s.at)),opening:Math.min(...shots.map(s=>s.opening)),lastOpening:Math.max(...shots.map(s=>s.opening))};
 });
 const result={...scene,mode:'paddy-season',theme:'paddy',stages};
 if(flowers){const upper=landscapeUpperDeck(result,{seed});result.shots=[...result.shots,...upper].sort((a,b)=>a.at-b.at);result.upperCount=upper.length;}
 return result;
}
