import {earProgrammeFits} from './ear-capacity.js';
import {flowerGardenPassage} from './flower-scenes.js';
import {groundCapacity} from './music-feeling.js';
import {createCometPattern} from './comets.js';
import {createStarBundlePattern} from './star-bundles.js';
const round=x=>+x.toFixed(4),overlap=(a,b)=>a.start<b.end&&a.end>b.start;
export function groundReservation(f,seed){
 const small=f.mode.startsWith('small-'),rate=f.options?.motionRate??1;
 const shots=small?createStarBundlePattern(f.mode,f.style,seed,f.options):createCometPattern(f.mode,f.style,seed,f.options);
 const cost=small?shots.reduce((n,s)=>n+s.count*s.angles.length,0):shots.length;
 return{start:f.at,end:f.at+(Math.max(0,...shots.map(s=>s.at))+(small?3.3:4.5))/Math.min(1,rate),small,cost};
}
// Bounds for allocation, not screen brightness. Include every pending ground star.
export function flowerProgrammeBudget(shots,fans,{shellTiming,shellPoints},seed=1){
 const events=[];
 for(const s of shots){const points=shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);events.push({at:s.at,points},{at:s.opening+shellTiming(s.kind,s.size).life+.1,points:-points});}
 for(const f of fans){const r=groundReservation(f,seed),points=r.cost*(r.small?11:362);events.push({at:r.start,points},{at:r.end,points:-points});}
 events.sort((a,b)=>a.at-b.at||a.points-b.points);
 let used=0,peakPoints=0;for(const e of events){used+=e.points;peakPoints=Math.max(peakPoints,used);}return{peakPoints};
}
function islands(region,blocks){
 let windows=[region];
 for(const b of blocks){const next=[];for(const w of windows){if(!overlap(w,b)){next.push(w);continue;}if(b.start>w.start)next.push({...w,end:Math.min(w.end,b.start)});if(b.end<w.end)next.push({...w,start:Math.max(w.start,b.end)});}windows=next;}
 return windows;
}
// This is composition after analysis and feeling selection. Model labels are
// estimates; no song title, lyrics or authored timestamps enter the selection.
export function addFlowerPassages(plan,analysis,options,helpers){
 const {shellTiming,shellPoints,planBudget}=helpers;
 plan.flowerPassages=[];
 const feeling=plan.feeling??'auto';
 const lively=['bright','festival'].includes(feeling)||feeling==='auto'&&analysis.bpm>=108&&options.style!=='quiet';
 if(!lively||plan.directingProfile==='slow')return plan;
 const planSeed=(analysis.seed+Math.imul(options.variation??0,0x9e3779b9))>>>0;
 const protectedShot=s=>s.group==='auto-finale'||/^auto-chorus-(?:entry|repeat|follow)/.test(s.group??'');
 const protectedWindows=plan.shots.filter(s=>s.group==='auto-finale').map(s=>({start:s.at-.15,end:s.opening+shellTiming(s.kind,s.size).life+.25}));
 protectedWindows.push(...(analysis.energy??[]).filter(e=>e.rms<(analysis.peak??0)*.0015).map(e=>({start:e.time,end:e.time+1})));
 protectedWindows.push(...(plan.earPassages??[]).map(w=>({start:w.start,end:w.end})));
 protectedWindows.push(...(plan.groundOnlyWindows??[]).map(w=>({start:w.start,end:w.end})));
 const endLimit=Math.min(analysis.audibleEnd??analysis.duration,plan.finalPreviewStart??analysis.duration)-.2;
 const sections=analysis.sections??[],firstVerse=sections.find(s=>s.role==='verse');
 const regions=[];
 for(let i=0;i<sections.length;i++){
  const s=sections[i],next=sections[i+1];
  const kind=s.role==='intro'?'intro':s===firstVerse?'verse-start':['break','inst','instrumental','solo'].includes(s.role)?'interlude':!s.role&&i===0?'opening-estimate':null;
  if(!kind)continue;
  let end=s.end;
  if(kind==='intro'){let j=i;while(sections[j+1]?.role==='intro')end=sections[++j].end;if(sections[j+1]===firstVerse||s.at>30&&sections[j+1]?.role==='verse')end=sections[j+1].end;}
  const level=Number(s.level)||0;
  if(!['bright','festival'].includes(feeling)&&level<.25)continue;
  regions.push({start:Math.max(.1,s.at),end:Math.min(end,endLimit),kind});
 }
 const committedWindows=[];
 for(const region of regions){
  if(plan.flowerPassages.length>=3)break;
  const blocked=[...protectedWindows,...committedWindows.map(w=>({start:w.start-6,end:w.end+6}))];
  const candidates=islands(region,blocked).sort((a,b)=>a.start-b.start);
  for(const w of candidates){
   const ascent=shellTiming('kiku',3).ascent;
   let firstOpening=w.start+ascent+.12;
   const beat=analysis.beats.find(b=>b.time>=firstOpening&&b.time-firstOpening<.6);if(beat)firstOpening=beat.time;
   const available=w.end-firstOpening-3.2-.35;
   if(available<10)continue;
   const long=available>=15&&(region.kind==='interlude'||(options.variation??0)%2===0),duration=long?15:10;
   const variant=((analysis.seed>>>4)+Math.floor((options.variation??0)/3)+plan.flowerPassages.length)%3===0?'dandelion':'garden';
   const passage=flowerGardenPassage({firstOpening,duration,period:analysis.period,mixed:variant!=='dandelion',color:variant==='dandelion'?'flower-yellow':'five',creativeUpper:!!options.programmeStyle,seed:(planSeed^Math.imul(plan.flowerPassages.length+1,0x531a2f9d))>>>0});
   const window={start:passage.shots[0].at-.01,end:passage.end};
   if(blocked.some(b=>overlap(window,b)))continue;
   // Flower beds replace ordinary gestures in their own passage, including tails
   // entering it. Priority chorus/finale gestures were protected above.
   const keptShots=plan.shots.filter(s=>protectedShot(s)||!overlap(window,{start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.1}));
   const keptFans=plan.fans.filter(f=>!overlap(window,groundReservation(f,planSeed)));
   let passageShots=[...passage.shots],shots=[...keptShots,...passageShots];const fans=[...keptFans,...passage.fans];
   // Musical anchor shells keep their time and shape. Yield only optional upper
   // flowers when they need room above the complete lower carpet.
   const fieldFits=()=>flowerProgrammeBudget(shots.filter(s=>overlap(window,{start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.1})),fans.filter(f=>overlap(window,groundReservation(f,planSeed))),helpers,planSeed).peakPoints<=64000;
   while(!earProgrammeFits(shots,helpers)||!fieldFits()){const upper=passageShots.find(s=>s.group==='auto-flower-garden-upper');if(!upper)break;passageShots=passageShots.filter(s=>upper.position?.butterflyFlock?s.position?.butterflyFlock!==upper.position.butterflyFlock:s!==upper);shots=[...keptShots,...passageShots];}
   const b=planBudget(shots),g=groundCapacity(fans,planSeed);
   if(!earProgrammeFits(shots,helpers)||!fieldFits()||g.small>1536||g.large>96)continue;
   // New passage allocation must leave room for both aerial and ground fields.
   const own=flowerProgrammeBudget(passage.shots,passage.fans,helpers,planSeed);
   if(own.peakPoints>64000)continue;
   plan.shots=shots;plan.fans=fans;
   const cue={start:round(window.start),end:round(window.end),firstOpening:round(firstOpening),lastOpening:round(firstOpening+duration),duration,variant,count:passage.count,upperCount:passageShots.filter(s=>s.group==='auto-flower-garden-upper').length,totalCount:passageShots.length,kind:region.kind,label:(variant==='dandelion'?'タンポポの花畑':'５色の花の絨毯と上空の花園')+' · '+duration+'秒'};
   plan.flowerPassages.push(cue);committedWindows.push(window);
   const removedFeatures=plan.featureCues.filter(c=>!shots.some(s=>s.group==='auto-feature'&&s.kind===c.kind&&Math.abs((s.anchor??s.opening)-c.at)<.001));
   plan.sections=plan.sections.filter(c=>!removedFeatures.some(f=>Math.abs(c.at-Math.max(0,f.at-6))<.001));
   for(const key of ['sections','arrangements','featureCues'])plan[key]=plan[key].filter(c=>(c.at<window.start||c.at>=window.end)&&!removedFeatures.includes(c));
   plan.sections.push({at:cue.firstOpening,label:cue.label,previewStart:Math.max(0,cue.start-.2)});
   plan.arrangements.push({at:cue.firstOpening,kind:'flower-carpet',duration,count:cue.count,upperCount:cue.upperCount,sectionRole:region.kind});
   break;
  }
 }
 if(!plan.flowerPassages.length)return plan;
 plan.shots.sort((a,b)=>a.at-b.at);plan.shots.forEach((s,i)=>{s.reviewIndex=i;s.position.earSeed??=(planSeed+i*313)>>>0;});
 plan.fans.sort((a,b)=>a.at-b.at);plan.sections.sort((a,b)=>a.at-b.at);plan.arrangements.sort((a,b)=>a.at-b.at);
 plan.budget=planBudget(plan.shots);
 plan.showDuration=Math.max(plan.showDuration,...committedWindows.map(w=>w.end+.5));
 Object.assign(plan.analysisSummary,{fastSmallShots:plan.shots.filter(s=>['auto-fast-small','feeling-intro-festival','auto-flower-carpet'].includes(s.group)).length,goldSmallShots:plan.shots.filter(s=>s.size===3&&(['willow','silver'].includes(s.kind)||s.kind==='kiku'&&s.position.palette==='original')).length,flowerPassageCount:plan.flowerPassages.length,flowerPassageSeconds:plan.flowerPassages.reduce((n,w)=>n+w.duration,0),flowerShots:plan.shots.filter(s=>s.group==='auto-flower-carpet').length,upperFlowerShots:plan.shots.filter(s=>s.group==='auto-flower-garden-upper').length,shellKinds:[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))],groundModes:[...new Set(plan.fans.map(f=>f.mode))]});
 plan.method+='; continuous 10/15-second mixed three-go flower beds with independent upper sunflower/petal/gold five-go and shaku shells in estimated lively opening, first verse or instrumental passages; all flower/stem/leaf cues saved together, priority chorus/finale preserved.';
 return plan;
}
