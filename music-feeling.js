import {createCometPattern} from './comets.js?v=1.3.13';
import {createStarBundlePattern} from './star-bundles.js?v=1.3.13';
export const MUSIC_FEELINGS=[
 {value:'auto',label:'自動 · 曲に合わせる',description:'解析したテンポと強弱から組みます。'},
 {value:'sentimental',label:'切ない・しっとり',description:'冒頭は一輪ずつ、余韻と空白から。サビでは広がります。'},
 {value:'grand',label:'壮大なバラード',description:'大輪をゆったり見せ、サビで空を大きく使います。'},
 {value:'bright',label:'明るく軽快',description:'小玉と足元が弾む、軽やかな掛け合い。'},
 {value:'festival',label:'アゲアゲ・お祭り',description:'入りから小玉と足元を重ね、サビで打ちまくります。'}
];
export const musicFeeling=value=>MUSIC_FEELINGS.find(f=>f.value===value)??MUSIC_FEELINGS[0];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),round=x=>+x.toFixed(4);
export function groundCapacity(fans,seed){
 const reservations=fans.map(f=>{const small=f.mode.startsWith('small-'),rate=f.options?.motionRate??1,pattern=small?createStarBundlePattern(f.mode,f.style,seed,f.options):createCometPattern(f.mode,f.style,seed),cost=small?pattern.reduce((n,s)=>n+s.count*s.angles.length,0):pattern.length,end=f.at+(Math.max(0,...pattern.map(s=>s.at))+(small?3.3:4.5))/Math.min(1,rate);return{at:f.at,end,cost,field:small?'small':'large'};});
 const peak=field=>{let n=0,max=0;const events=reservations.filter(r=>r.field===field).flatMap(r=>[{at:r.at,cost:r.cost},{at:r.end,cost:-r.cost}]).sort((a,b)=>a.at-b.at||a.cost-b.cost);for(const e of events){n+=e.cost;max=Math.max(n,max);}return max;};
 return{small:peak('small'),large:peak('large')};
}
// This is directing, after analysis. No source timing, BPM, or detector output is changed.
export function directMusicFeeling(plan,analysis,options,{shellTiming,planBudget}){
 const feeling=musicFeeling(options.feeling),variation=options.variation??0;
 plan.feeling=feeling.value;plan.feelingLabel=feeling.label;plan.feelingDescription=feeling.description;
 plan.analysisSummary.feeling=feeling.value;
 if(feeling.value==='auto')return plan;
 const firstChorus=analysis.chorus?.[0]?.at??analysis.duration*.45;
 const introEnd=analysis.sections.find(s=>s.role!=='intro'&&s.at>2)?.at??0;
 const period=analysis.period;
 const openingEnd=Math.max(0,Math.min(firstChorus-4,analysis.duration*.35,Math.max(24,introEnd+period*16)));
 plan.feelingOpeningEnd=round(openingEnd);
 if(openingEnd<7)return plan;
 plan.shots=plan.shots.filter(s=>s.at>=openingEnd);
 plan.fans=plan.fans.filter(f=>f.at>=openingEnd);
 for(const key of ['sections','arrangements','featureCues','chorusEntryCues','chorusFollowCues','repeatEntryCues'])plan[key]=plan[key].filter(c=>c.at>=openingEnd);
 if(plan.slowScenes)plan.slowScenes=plan.slowScenes.filter(s=>s.start>=openingEnd);
 plan.groundOnlyWindows=plan.groundOnlyWindows.filter(w=>w.end>openingEnd).map(w=>({...w,start:Math.max(w.start,openingEnd)}));
 const seed=(analysis.seed+Math.imul(variation,0x9e3779b9))>>>0;
 let noise=(seed^0x62d87103)>>>0;
 const random=()=>((noise=(Math.imul(noise,1664525)+1013904223)>>>0)/4294967296);
 const beat=at=>analysis.beats.reduce((best,b)=>Math.abs(b.time-at)<Math.abs(best.time-at)?b:best,analysis.beats[0]).time;
 function flower(kind,size,anchor,x,palette){
  const heightOffset=(size===3?-.12:0)+(random()-.5)*.08,ascentOffset=(random()-.5)*.08,ignitionDelay=.025+random()*.065;
  const at=anchor-shellTiming(kind,size).ascent-.045+(random()-.5)*.025,launchX=x+(random()-.5)*.035,launchZ=kind==='ear'?-.68:size===3?.18:0;
  return{at:round(at),opening:round(at+shellTiming(kind,size).ascent+ascentOffset+ignitionDelay),anchor:round(anchor),kind,size,group:'feeling-intro-'+feeling.value,position:{x:round(launchX+(random()-.5)*.08),z:launchZ,launchX:round(launchX),launchZ,palette,heightOffset:round(heightOffset),ascentOffset,ignitionDelay}};
 }
 function add(list){if(list.some(s=>s.at<.08||s.opening>=openingEnd-1))return false;const b=planBudget([...plan.shots,...list]);if(b.peakUpper>plan.upperLimit||b.peakEars>plan.earLimit||b.peakPoints>plan.upperPointBudget)return false;plan.shots.push(...list);return true;}
 function foot(at,mode,style,options={}){const f={at:round(at),mode,style,options:{motionRate:.9,...options}},capacity=groundCapacity([...plan.fans,f],seed);if(capacity.small<=1536&&capacity.large<=96)plan.fans.push(f);}
 const active=analysis.energy.find(e=>e.rms>analysis.peak*.015)?.time??0;
 const start=Math.max(4.5,active+3.5),lively=feeling.value==='festival',bright=feeling.value==='bright',grand=feeling.value==='grand';
 const cadence=lively?clamp(period*2,.7,1.8):bright?clamp(period*4,1.5,3.4):grand?clamp(period*16,6.5,9):clamp(period*16,6,8.5);
 let count=0;
 for(let at=start;at<openingEnd-2;at+=cadence){
  const anchor=beat(at),x=((count+variation)%3-1)*(grand?.6:lively?.65:.4);
  let flowers;
  if(lively){const accent=count%4===0;flowers=accent?[-.62,0,.62].map(x=>flower('kiku',3,anchor,x,['pink','aqua','purple'][(count+variation)%3])):count%2?[flower('candy',5,anchor,x,'candy-mix')]:[-.45,.45].map(x=>flower('kiku',3,anchor,x,'aqua'));}
  else if(bright)flowers=[flower(count%3?'kiku':'candy',count%3?3:5,anchor,x,count%3?'pink':'candy-aqua')];
  else if(grand)flowers=[flower(count%2?'double':'longstar',10,Math.max(5,anchor),x,count%2?'original':'long-gold')];
  else flowers=[flower(count%2?'willow':'longstar',count%2?3:5,anchor,x,count%2?'original':['long-blue','long-purple','long-gold'][(count+variation)%3])];
  add(flowers);count++;
 }
 if(lively||bright){for(let at=3.5;at<openingEnd-4;at+=lively?clamp(period*12,4.8,7):clamp(period*16,7,10))foot(at,lively?'small-color-row':'small-hop-center',lively?'tora-row-mix':'mountain-pink',{interval:.16});}
 else if(!grand&&openingEnd>15)add([- .3,0,.3].map(x=>flower('ear',2,beat(Math.min(openingEnd-4,12)),x,'ear-aqua')));
 plan.sections.unshift({at:0,label:feeling.label+' · '+(lively?'小玉と足元で華やかに幕開け':bright?'軽やかな小玉で幕開け':grand?'ゆったり大輪で幕開け':'一輪ずつ、余韻と空白から')},{at:round(openingEnd),label:'曲の節へ広がる'});
 plan.arrangements.unshift({at:0,kind:'feeling-opening-'+feeling.value});
 plan.shots.sort((a,b)=>a.at-b.at);plan.shots.forEach((s,i)=>{s.reviewIndex=i;s.position.earSeed=(seed+i*313)>>>0;});plan.fans.sort((a,b)=>a.at-b.at);plan.sections.sort((a,b)=>a.at-b.at);
 plan.budget=planBudget(plan.shots);
 plan.analysisSummary.fastSmallShots=plan.shots.filter(s=>s.group==='auto-fast-small'||s.group==='feeling-intro-festival').length;
 plan.analysisSummary.shellKinds=[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];plan.analysisSummary.groundModes=[...new Set(plan.fans.map(f=>f.mode))];
 plan.analysisSummary.repeatEntryCount=plan.repeatEntryCues.length;
 plan.method+='; user-selected feeling directs the opening without modifying the audio analysis.';
 return plan;
}
