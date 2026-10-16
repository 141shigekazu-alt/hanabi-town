import {drawProgrammeStyle,styleHash,styleKind,stylePalette,stylePosition,shellFamily} from './programme-style.js';
import {groundReservation} from './flower-programmes.js';
import {TYPES} from './fireworks.js?v=1.2.82';
const overlap=(a,b)=>a.start<b.end&&b.start<a.end;
// Keep accepted landscape beds, chorus timing/replies and the final tableau.
// Entry/feature shells may change family without moving their musical anchors.
export const styleProtected=s=>s.kind==='ear'||/^(?:auto-finale|auto-feature|auto-chorus-(?:entry|repeat|follow)|auto-flower-|auto-style-landscape|ear-|sea-|paddy-)/.test(s.group??'')||!!s.position?.earField;
export function applyProgrammeStyle(plan,analysis,options,helpers){
 const style=options.programmeStyle??drawProgrammeStyle(analysis.seed,options.variation??0,{feeling:plan.feeling,bpm:analysis.bpm});
 const {shellTiming,shellPoints,planBudget}=helpers;
 const seed=(analysis.seed+Math.imul(options.variation??0,0x9e3779b9))>>>0;
 const span=s=>({start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.1});
 const pointCost=s=>shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);
 const ground=plan.fans.map(f=>{const r=groundReservation(f,seed);return {...r,points:r.cost*(r.small?11:362)};});
 let shots=plan.shots;
 // Check the changed interval including pending ground stars. Existing distant
 // allocations do not become a reason to reject an otherwise safe replacement.
 function fits(candidate,kept){
  const w=span(candidate),events=[],add=(start,end,v)=>{start=Math.max(start,w.start);end=Math.min(end,w.end);if(start>=end)return;events.push({at:start,v},{at:end,v:v.map(x=>-x)});};
  for(const s of [...kept,candidate]){const r=span(s);if(overlap(w,r))add(r.start,r.end,[s.kind==='ear'?0:1,s.kind==='ear'?1:0,s.position?.earField?1:0,pointCost(s)]);}
  for(const r of ground)if(overlap(w,r))add(r.start,r.end,[0,0,0,r.points]);
  events.sort((a,b)=>a.at-b.at||a.v[3]-b.v[3]);const n=[0,0,0,0];
  for(const e of events){e.v.forEach((v,i)=>n[i]+=v);if(n[0]>14||n[1]>(n[2]?44:14)||n[3]>(n[2]?96000:64000))return false;}return true;
 }
 const landscapeCues=[];
 // A landscape is allowed to keep playing beneath the new shapes. These are
 // replacements in its upper deck; every lower ear/flower stays in place.
 for(const passage of plan.earPassages??[]){
  if(!passage.bed||!['modern','mixed'].includes(style.family))continue;
  const deck=shots.filter(s=>s.kind!=='ear'&&!styleProtected(s)&&s.size>=5&&s.size<=10&&s.opening>=passage.start+2&&s.opening<passage.end-4);
  const paddy=passage.mode==='paddy-season',kinds=[];let count=0;
  for(const [i,s] of deck.entries()){
   if(i%3!==1)continue;
   const roll=styleHash(style.seed,Math.round(s.opening*10)),kind=roll%10<7?(paddy?'butterfly':'planet'):roll%10<9?(paddy?'planet':'butterfly'):'drum';
   const size=kind==='butterfly'&&(roll>>>7)%2===0?10:5;
   const at=s.at+shellTiming(s.kind,s.size).ascent-shellTiming(kind,size).ascent;
   const position={...s.position,startAt:at,heightOffset:(s.position.heightOffset??0)+(s.size===10?.26:0)-(size===10?.26:0),palette:kind==='planet'?['original','planet-aqua','planet-purple'][count%3]:kind==='drum'?'drum-candy':'original'};
   const c={...s,at,kind,size,group:'auto-style-landscape',position};let kept=shots.filter(x=>x!==s);
   if(at<passage.start)continue;
   if(kinds.some(x=>Math.abs(x.opening-c.opening)<7))continue;
   const removable=kept.filter(x=>!styleProtected(x)&&overlap(span(c),span(x))).sort((a,b)=>pointCost(b)-pointCost(a));
   // Keep the moving sea and protected musical replies. Thin only ordinary
   // filler when a larger silhouette needs a little allocation headroom.
   while(!fits(c,kept)&&removable.length){const remove=removable.shift();kept=kept.filter(x=>x!==remove);}
   if(!fits(c,kept))continue;
   shots=[...kept,c];kinds.push({kind,size,opening:c.opening});count++;
  }
  if(count)landscapeCues.push({start:passage.start,end:passage.end,kinds,count,label:paddy?'田園に舞う創造花火':'海に浮かぶ創造花火'});
 }
 const body=shots.filter(s=>(!styleProtected(s)||s.group==='auto-feature'||/^auto-chorus-(?:entry|repeat)$/.test(s.group??''))&&[3,5,10].includes(s.size));
 let changed=0;
 for(const [i,s] of body.entries()){
  const kept=shots.filter(x=>x!==s);let candidate;
  for(let attempt=0;attempt<5;attempt++){
   const kind=styleKind(style,s.size,i,attempt),position=styleProtected(s)?{...s.position}:stylePosition(style,s.position,i);
   position.palette=stylePalette(style,kind,i);candidate={...s,kind,position};
   if(fits(candidate,kept))break;candidate=null;
  }
  if(candidate){shots[shots.indexOf(s)]=candidate;changed++;}
 }
 for(const cue of plan.featureCues??[]){const s=shots.find(s=>s.group==='auto-feature'&&Math.abs((s.anchor??s.opening)-cue.at)<.01);if(s){cue.kind=s.kind;const section=plan.sections.find(x=>Math.abs(x.at-Math.max(0,cue.at-6))<.01&&x.label?.includes('の見せ場'));if(section)section.label=(s.size===10?'尺玉':'５号')+'・'+TYPES[s.kind].label+'の見せ場';}}
 const creativeCues=[];
 const blocked=[...(plan.groundOnlyWindows??[]).map(w=>({start:w.start,end:w.end})),...(plan.flowerPassages??[]),...(plan.earPassages??[])].map(w=>({start:w.start,end:w.end}));
 const candidates=shots.filter(s=>!styleProtected(s)&&s.size>=5&&s.size<=10&&s.opening>12&&s.opening<(plan.finalPreviewStart??plan.duration)-5);
 // Spread showcases across the song; each clear window is committed atomically.
 const target=style.family==='modern'?3:style.family==='mixed'?2:1;
 const order=[...candidates].sort((a,b)=>styleHash(style.seed,Math.round(a.opening*10))-styleHash(style.seed,Math.round(b.opening*10)));
 for(const s of order){
  if(creativeCues.length>=target)break;
  if(!shots.includes(s)||creativeCues.some(c=>Math.abs(c.at-s.opening)<18))continue;
  const kind=['butterfly','planet','drum'][(styleHash(style.seed)%3+creativeCues.length)%3],size=s.size;
  const position={...s.position,x:style.staging==='dialogue'?(creativeCues.length%2?-.4:.4):0,z:-.18,palette:stylePalette(style,kind,creativeCues.length)};
  if(Number.isFinite(position.launchX))position.launchX+=(position.x-(s.position.x??0));
  if(Number.isFinite(position.launchZ))position.launchZ+=(position.z-(s.position.z??0));
  const c={...s,kind,size,position,group:'auto-creative-showcase'};
  const w={start:c.at-.25,end:span(c).end+.45};
  if(blocked.some(b=>overlap(w,b)))continue;
  const touching=shots.filter(x=>overlap(w,span(x)));
  if(touching.some(styleProtected))continue;
  const kept=shots.filter(x=>!touching.includes(x));
  if(!fits(c,kept))continue;
  shots=[...kept,c];const cue={at:c.opening,start:c.at,end:span(c).end,kind,size,label:TYPES[kind].label};creativeCues.push(cue);
 }
 // Sparse one-shell passages are a staging option, never a condition on every
 // creative shell. Chorus pulses and landscape beds keep their continuation.
 const soloCues=[];
 if(style.staging==='solos')for(const s of [...shots]){
  if(soloCues.length>=4)break;
  if(styleProtected(s)||s.size<5||s.group==='auto-creative-showcase'||soloCues.some(c=>Math.abs(c.at-s.opening)<25))continue;
  const section=analysis.sections.find(x=>s.opening>=x.at&&s.opening<x.end);if(section?.role==='chorus')continue;
  const w={start:s.at-.2,end:span(s).end+.35};if(blocked.some(b=>overlap(w,b)))continue;
  const touching=shots.filter(x=>x!==s&&overlap(w,span(x)));if(touching.some(x=>styleProtected(x)||x.group==='auto-creative-showcase'))continue;
  shots=shots.filter(x=>!touching.includes(x));soloCues.push({at:s.opening,start:s.at,end:span(s).end,kind:s.kind});
 }
 shots.sort((a,b)=>a.at-b.at);
 plan.shots=shots;plan.programmeStyle=style;plan.creativeCues=creativeCues.sort((a,b)=>a.at-b.at);plan.landscapeCreativeCues=landscapeCues;plan.soloCues=soloCues;
 const counts={traditional:0,pop:0,modern:0};for(const s of shots.filter(s=>!styleProtected(s))){const f=shellFamily(s.kind);if(f)counts[f]++;}
 plan.styleSummary={changed,bodyCounts:counts,showcases:creativeCues.length};
 plan.analysisSummary.shellKinds=[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];
 plan.budget=planBudget(shots);plan.showDuration=Math.max(plan.showDuration,...shots.map(s=>span(s).end+1));
 plan.method+='; seeded family, colour direction and staging; isolated creative showcases with ground-inclusive capacity checks.';
 return plan;
}
