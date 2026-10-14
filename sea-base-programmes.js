import {landscapeDirection,landscapePalette} from './landscape-upper.js';
import {variationRandom} from './flower-variation.js';
import {seaSunsetPassage,paddySeasonPassage,earScene} from './ear-scenes.js';
import {EAR_FIELD_LIMIT,EAR_FIELD_POINT_LIMIT,earProgrammeBreach} from './ear-capacity.js';
import {groundReservation} from './flower-programmes.js';
const overlap=(a,b)=>a.start<b.end&&a.end>b.start,round=x=>+x.toFixed(4);
const priority=s=>s.group==='auto-finale'||s.group==='auto-feature'||/^auto-chorus-(?:entry|repeat|follow)/.test(s.group??'');
function islands(region,blocks){let windows=[region];for(const b of blocks){const next=[];for(const w of windows){if(!overlap(w,b)){next.push(w);continue;}if(b.start>w.start)next.push({...w,end:Math.min(w.end,b.start)});if(b.end<w.end)next.push({...w,start:Math.max(w.start,b.end)});}windows=next;}return windows;}
function groundBreach(shots,fans,helpers,seed,window){
 const events=[];for(const s of shots){const points=helpers.shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);events.push({at:s.at,points},{at:s.opening+helpers.shellTiming(s.kind,s.size).life+.1,points:-points});}
 for(const f of fans){const r=groundReservation(f,seed),points=r.cost*(r.small?11:362);events.push({at:r.start,points},{at:r.end,points:-points});}
 events.sort((a,b)=>a.at-b.at||a.points-b.points);let points=0;
 for(const e of events){points+=e.points;if(e.at>=window.start&&e.at<window.end&&points>EAR_FIELD_POINT_LIMIT)return{at:e.at,points};}return null;
}
function themedPalette(s,scene,seed,index){
 const random=variationRandom(seed,0x7a1e77e^Math.imul(index+1,7919));
 const p=landscapePalette(s.kind,landscapeDirection(scene,s.opening),random,{keepExisting:true});
 return p?{...s,position:{...s.position,palette:p}}:s;
}
// A bed can span sung sections and chorus entries. Keep the planned upper
// fireworks and important ground replies; remove ordinary filler only when
// the combined field would exceed its allocation, never an entry or feature.
export function addSeaBase(plan,analysis,options,helpers){
 const explicit=['sea-sunset-long','paddy-season'].includes(options.earScene);
 const mode=explicit?options.earScene:((analysis.seed>>>3)+(options.variation??0))%2?'paddy-season':'sea-sunset-long';
 const paddy=mode==='paddy-season';
 if(!explicit&&(plan.earIntensity!=='feature'||((analysis.seed>>>8)+(options.variation??0))%4!==0))return false;
 const seed=(analysis.seed+Math.imul(options.variation??0,0x9e3779b9))>>>0,span=s=>({start:s.at,end:s.opening+helpers.shellTiming(s.kind,s.size).life+.15});
 const limit=Math.min(analysis.audibleEnd??analysis.duration,plan.finalPreviewStart??analysis.duration)-.25;
 const blocks=[...(plan.groundOnlyWindows??[]),...(analysis.energy??[]).filter(e=>e.rms<(analysis.peak??0)*.0015).map(e=>({start:e.time,end:e.time+1}))];
 const windows=islands({start:.12,end:limit},blocks),starts=[];
 for(const section of analysis.sections??[]){if(['silence','outro'].includes(section.role))continue;for(const shift of [0,2.3,4.6,6.9])starts.push({at:Math.max(.12,section.at)+shift,role:section.role,rank:['verse','chorus','bridge'].includes(section.role)?0:['instrumental','inst','solo'].includes(section.role)?1:2});}
 starts.sort((a,b)=>a.rank-b.rank||a.at-b.at);
 const protectedAt=[...(plan.chorusEntryCues??[]),...(plan.repeatEntryCues??[]),...(plan.featureCues??[])].map(c=>c.at);
 const protectedFan=f=>protectedAt.some(at=>f.at>=at-3.1&&f.at<=at+3.5);
 for(const start of starts){
  const w=windows.find(w=>start.at>=w.start&&start.at+(paddy?41.8:46.4)<=w.end);if(!w)continue;
  const scene=(paddy?paddySeasonPassage:seaSunsetPassage)({firstOpening:start.at+1.73,seed:(seed^0x5ea109b9)>>>0,long:true});
  const window={start:scene.shots[0].at-.01,end:scene.end};if(window.end>w.end)continue;
  const midpoint=scene.firstOpening+(scene.end-scene.firstOpening)*.5;
  let recolored=0,removed=0;
  const kept=plan.shots.map((s,i)=>{if(s.kind!=='ear'&&!priority(s)&&s.opening>=(paddy?scene.firstOpening:midpoint)&&s.opening<scene.end){const next=themedPalette(s,scene,seed,i);if(next!==s)recolored++;return next;}return s;});
  let shots=[...kept,...scene.shots];
  const fans=plan.fans.filter(f=>protectedFan(f)||!overlap(window,groundReservation(f,seed)));
  // Capacity conflicts are resolved at the actual overlap time. Keep every
  // protected aerial/ground cue; a base yields entirely if those cannot fit.
  let failed=false;
  for(let attempt=0;attempt<=kept.length;attempt++){
   const breach=earProgrammeBreach(shots,helpers)??groundBreach(shots,fans,helpers,seed,window);if(!breach)break;
   const candidates=shots.filter(s=>s.kind!=='ear'&&!priority(s)&&s.group!=='auto-sea-base-upper'&&overlap(window,span(s))&&s.at<=breach.at&&span(s).end>breach.at).sort((a,b)=>helpers.shellPoints(b.kind,b.size,b.position?.wide,b.position?.starDensity??1)-helpers.shellPoints(a.kind,a.size,a.position?.wide,a.position?.starDensity??1));
   if(!candidates.length){failed=true;break;}const target=candidates[0];shots=shots.filter(s=>s!==target);removed++;
  }
  if(failed||earProgrammeBreach(shots,helpers)||groundBreach(shots,fans,helpers,seed,window))continue;
  const upper=shots.filter(s=>s.kind!=='ear'&&overlap(window,span(s)));if(!upper.length)continue;
  plan.shots=shots.sort((a,b)=>a.at-b.at);plan.shots.forEach((s,i)=>{s.reviewIndex??=100000+i;});plan.fans=fans;
  plan.earLimit=EAR_FIELD_LIMIT;plan.upperPointBudget=EAR_FIELD_POINT_LIMIT;plan.standardEarLimit=14;plan.standardPointBudget=64000;
  const roles=[...new Set((analysis.sections??[]).filter(s=>overlap(window,{start:s.at,end:s.end})).map(s=>s.role).filter(Boolean))];
  const cue={start:round(window.start),end:round(window.end),firstOpening:round(scene.firstOpening),duration:Math.round(scene.lastExtinction-scene.firstOpening),mode,kind:'aerial-base',bed:true,count:scene.count,upperCount:upper.length,columns:11,levels:2,waves:scene.waves,stages:scene.stages,roles,recolored,removedFiller:removed,label:earScene(mode).label+' · 上空の花火と約'+Math.round(scene.lastExtinction-scene.firstOpening)+'秒'};
  plan.earPassages.push(cue);plan.sections.push({at:cue.firstOpening,label:cue.label,previewStart:Math.max(0,cue.start-.2)});plan.arrangements.push({at:cue.firstOpening,kind:paddy?'paddy-base':'sea-sunset-base',duration:cue.duration,count:cue.count,upperCount:cue.upperCount});
  plan.sections.sort((a,b)=>a.at-b.at);plan.arrangements.sort((a,b)=>a.at-b.at);plan.budget=helpers.planBudget(plan.shots);plan.showDuration=Math.max(plan.showDuration,scene.end+.5);
  plan.method+='; thematic sea/paddy underlay across sung/instrumental sections, retaining chorus/finale/features and loosely guiding a seeded variety of ordinary upper colours.';
  return true;
 }
 return false;
}
