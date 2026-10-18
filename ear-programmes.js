import {addSeaBase} from './sea-base-programmes.js?v=1.3.10';
import {EAR_FIELD_LIMIT,EAR_FIELD_POINT_LIMIT,earProgrammeFits} from './ear-capacity.js';
import {earLandscape,earScene,seaSunsetPassage} from './ear-scenes.js?v=1.3.10';
import {flowerProgrammeBudget} from './flower-programmes.js';
const overlap=(a,b)=>a.start<b.end&&a.end>b.start,round=x=>+x.toFixed(4);
function islands(region,blocks){let windows=[region];for(const b of blocks){const next=[];for(const w of windows){if(!overlap(w,b)){next.push(w);continue;}if(b.start>w.start)next.push({...w,end:Math.min(w.end,b.start)});if(b.end<w.end)next.push({...w,start:Math.max(w.start,b.end)});}windows=next;}return windows;}
// Reserve real passages after feeling direction, before the flower-bed pass.
// Selection uses analysed sections and energy; never song names or authored cues.
export function addEarPassages(plan,analysis,options,helpers){
 const {shellTiming,planBudget}=helpers,choice=earScene(options.earScene).id;
 plan.earScene=choice;plan.earPassages=[];
 const seed=(analysis.seed+Math.imul(options.variation??0,0x9e3779b9))>>>0;
 const focus=options.programmeStyle?.landscape;
 const intensity=choice==='auto'?(focus==='none'||focus==='flowers'?'none':'feature'):'feature';
 plan.earIntensity=intensity;
 // Retain deliberate finale ears, but replace scattered filler rows with a
 // chosen landscape. Some arrangements have no ears before the finale.
 plan.shots=plan.shots.filter(s=>s.kind!=='ear'||s.group==='auto-finale');
 plan.arrangements=plan.arrangements.filter(a=>a.kind!=='ear-row');
 for(const a of plan.arrangements)if(a.kind==='quiet-chorus-ears-and-ground')a.kind='quiet-chorus-ground';
 if(['sea-sunset-long','paddy-season','auto'].includes(choice)){const base=addSeaBase(plan,analysis,options,helpers);if(base||choice!=='auto'){plan.budget=planBudget(plan.shots);Object.assign(plan.analysisSummary,{earPassageCount:plan.earPassages.length,earShots:plan.shots.filter(s=>s.kind==='ear').length,earModes:plan.earPassages.map(p=>p.mode)});return plan;}}
 const priority=s=>s.group==='auto-finale'||/^auto-chorus-(?:entry|repeat|follow)/.test(s.group??'');
 const span=s=>({start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.15});
 const blocks=plan.shots.filter(priority).map(s=>({start:s.at-.2,end:span(s).end+.2}));
 blocks.push(...(analysis.energy??[]).filter(e=>e.rms<(analysis.peak??0)*.0015).map(e=>({start:e.time,end:e.time+1})));

 const limit=Math.min(analysis.audibleEnd??analysis.duration,plan.finalPreviewStart??analysis.duration)-.25;
 const sections=analysis.sections??[],regions=[];
 for(let i=0;i<sections.length;i++){
  const s=sections[i];if(!['intro','break','inst','instrumental','solo'].includes(s.role)&&!(i===0&&!s.role))continue;
  let end=s.end,j=i;while(sections[j+1]?.role===s.role&&Math.abs(sections[j+1].at-end)<.5)end=sections[++j].end;
  regions.push({start:Math.max(.12,s.at),end:Math.min(end,limit),kind:s.role==='intro'&&!sections.slice(0,i).some(p=>['verse','chorus'].includes(p.role))||i===0?'intro':'interlude'});i=j;
 }
 const selected=[];
 for(const region of regions){
  if(intensity==='none'||plan.earPassages.length>=(intensity==='accent'?1:3))break;
  const lively=region.kind==='interlude'&&plan.directingProfile!=='slow';
  const baseMode=choice!=='auto'?choice:(lively?['purple','sunset','green','red','orange']:['gold','alternating','green','purple','sunset','red','orange'])[((analysis.seed>>>11)+(options.variation??0)+plan.earPassages.length)%(lively?5:7)];
  for(const w of islands(region,[...blocks,...selected.map(x=>({start:x.start-5,end:x.end+5}))])){
   const firstOpening=w.start+1.65+.08;
   const mode=choice==='auto'&&intensity==='feature'&&['intro','interlude'].includes(region.kind)&&w.end-firstOpening>=30.5&&((analysis.seed>>>5)+(options.variation??0))%3===0?'sea-sunset':baseMode,withFlowers=mode==='green';
   // Continue the same colour through the available phrase: one to six waves,
   // rather than stopping after a single volley while the intro carries on.
   const maxWaves=intensity==='accent'?1:Math.max(1,Math.min(6,1+Math.floor((w.end-firstOpening-7.4)/4.6)));
   const sceneOptions={mode,firstOpening,duration:maxWaves>=3?16:8,waves:maxWaves,flowers:withFlowers,seed:(seed^Math.imul(plan.earPassages.length+1,0x41ef603d))>>>0};
   let scene=mode==='sea-sunset'?seaSunsetPassage(sceneOptions):earLandscape(sceneOptions);
   if(mode!=='sea-sunset')for(let waves=maxWaves-1;scene.end>w.end&&waves>=1;waves--)scene=earLandscape({...sceneOptions,waves});
   const window={start:scene.shots[0].at-.01,end:scene.end};
   if(window.end>w.end||window.start<w.start||blocks.some(b=>overlap(window,b)))continue;
   const shots=[...plan.shots.filter(s=>priority(s)||!overlap(window,span(s))),...scene.shots];
   // A broad conservative bound includes delayed ground stars. Clear their
   // ordinary gestures so the ears have an unobstructed foreground.
   const fans=plan.fans.filter(f=>!overlap(window,{start:f.at,end:f.at+12/Math.min(1,f.options?.motionRate??1)}));
   const b=planBudget(shots),combined=flowerProgrammeBudget(shots,fans,helpers,seed);
   if(!earProgrammeFits(shots,helpers))continue;
   // The existing show may already exceed this conservative ground bound;
   // replacement may never raise its peak above the greater of that or the local field allowance.
   const before=flowerProgrammeBudget(plan.shots,plan.fans,helpers,seed);
   if(combined.peakPoints>Math.max(EAR_FIELD_POINT_LIMIT,before.peakPoints))continue;
   plan.groundOnlyWindows=(plan.groundOnlyWindows??[]).filter(w=>!overlap(window,w));
   plan.shots=shots;plan.fans=fans;plan.earLimit=EAR_FIELD_LIMIT;plan.upperPointBudget=EAR_FIELD_POINT_LIMIT;plan.standardEarLimit=14;plan.standardPointBudget=64000;
   if(plan.slowScenes)plan.slowScenes=plan.slowScenes.filter(s=>!overlap(window,s));
   const label=earScene(mode).label,seconds=Math.round(scene.lastExtinction-scene.firstOpening);
   const cue={...window,start:round(window.start),end:round(window.end),firstOpening:round(scene.firstOpening),duration:seconds,mode,kind:region.kind,count:scene.count,upperCount:scene.upperCount,columns:scene.columns,levels:scene.levels,waves:scene.waves,...(scene.stages?{stages:scene.stages}:{}),label:label+' · 11列×上下二段 · 約'+seconds+'秒'};
   plan.earPassages.push(cue);selected.push(window);
   const removedFeatures=plan.featureCues.filter(c=>!shots.some(s=>s.group==='auto-feature'&&s.kind===c.kind&&Math.abs((s.anchor??s.opening)-c.at)<.001));
   plan.sections=plan.sections.filter(c=>!removedFeatures.some(f=>Math.abs(c.at-Math.max(0,f.at-6))<.001));
   for(const key of ['sections','arrangements','featureCues'])plan[key]=plan[key].filter(c=>c.at<window.start||c.at>=window.end);
   plan.sections.push({at:cue.firstOpening,label:cue.label,previewStart:Math.max(0,cue.start-.2)});
   plan.arrangements.push({at:cue.firstOpening,kind:'ear-landscape',mode,count:cue.count,upperCount:cue.upperCount,sectionRole:region.kind});
   break;
  }
 }
 if(plan.earPassages.length){
  plan.shots.sort((a,b)=>a.at-b.at);plan.shots.forEach((s,i)=>{s.reviewIndex=i;});plan.sections.sort((a,b)=>a.at-b.at);plan.arrangements.sort((a,b)=>a.at-b.at);
  plan.showDuration=Math.max(plan.showDuration,...selected.map(w=>w.end+.5));
  plan.method+='; reserved coloured ear passages in estimated intros/interludes, with stemless upper flowers over green ears; chorus/finale cues preserved.';
 }
 plan.budget=planBudget(plan.shots);
 Object.assign(plan.analysisSummary,{earPassageCount:plan.earPassages.length,earShots:plan.shots.filter(s=>s.kind==='ear').length,earModes:plan.earPassages.map(p=>p.mode),shellKinds:[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))]});
 return plan;
}
