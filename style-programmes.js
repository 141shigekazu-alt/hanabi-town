import {drawProgrammeStyle,styleHash,styleKind,stylePalette,stylePosition,shellFamily} from './programme-style.js';
import {groundReservation} from './flower-programmes.js';
import {TYPES} from './fireworks.js?v=1.2.95';
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
 if(style.color==='gold'){
  shots=shots.map(s=>({...s,position:{...s.position,palette:'programme-gold'}}));
  plan.fans=plan.fans.map(f=>({...f,options:{...f.options,programmeGold:true}}));
 }
 const flowerCount=plan.flowerPassages?.length??0;
 const stagingLabel=flowerCount?'緑の茎と葉に花が咲く':style.staging==='garden'?'小玉から大輪へ':style.stagingLabel;
 const actualStyle={...style,flowerFocus:flowerCount>0,staging:!flowerCount&&style.staging==='garden'?'flow':style.staging,stagingLabel,flowerSceneCount:flowerCount,description:[style.label,style.colorLabel,stagingLabel].join(' · ')};
 plan.shots=shots;plan.programmeStyle=actualStyle;plan.creativeCues=creativeCues.sort((a,b)=>a.at-b.at);plan.landscapeCreativeCues=landscapeCues;plan.soloCues=soloCues;
 const counts={traditional:0,pop:0,modern:0};for(const s of shots.filter(s=>!styleProtected(s))){const f=shellFamily(s.kind);if(f)counts[f]++;}
 plan.styleSummary={changed,bodyCounts:counts,showcases:creativeCues.length};
 plan.analysisSummary.shellKinds=[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];
 plan.budget=planBudget(shots);plan.showDuration=Math.max(plan.showDuration,...shots.map(s=>span(s).end+1));
 plan.method+='; seeded family, colour direction and staging; isolated creative showcases with ground-inclusive capacity checks.';
 return plan;
}

export function naturalProgrammeOpening(plan,{shellTiming,shellPoints,planBudget}){
 const upper=plan.shots.filter(s=>s.kind!=='ear').sort((a,b)=>a.opening-b.opening);
 if(!upper.length)return plan;
 const groups=[];for(const s of upper)if(!groups.length||s.opening-groups.at(-1)>.65)groups.push(s.opening);
 const end=Math.max(Math.min(30,plan.duration*.18),upper[0].opening+12,(groups[2]??groups.at(-1))+.65);
 const firstGroupsEnd=(groups[2]??groups.at(-1))+.65;
 const ground=plan.fans.map(f=>{const g=groundReservation(f,plan.programmeStyle.seed);return {...g,points:g.cost*(g.small?11:362)};});
 function fits(candidate,kept){
  const start=candidate.at,end=candidate.opening+shellTiming(candidate.kind,candidate.size).life+.1,events=[];
  const add=(a,b,n,upper=0)=>{a=Math.max(a,start);b=Math.min(b,end);if(a<b)events.push({at:a,n,upper},{at:b,n:-n,upper:-upper});};
  for(const x of [...kept,candidate])add(x.at,x.opening+shellTiming(x.kind,x.size).life+.1,shellPoints(x.kind,x.size,x.position?.wide,x.position?.starDensity??1),x.kind==='ear'?0:1);
  for(const g of ground)add(g.start,g.end,g.points);
  events.sort((a,b)=>a.at-b.at||a.n-b.n);let n=0,upper=0;for(const e of events){n+=e.n;upper+=e.upper;if(n>64000||upper>14)return false;}return true;
 }
 let shots=[...plan.shots];
 for(const s of [...shots]){
  const creative=['butterfly','planet','drum'].includes(s.kind),ordinaryFirst=s.kind!=='ear'&&s.opening<firstGroupsEnd&&!/^auto-flower-/.test(s.group??'');
  if(s.opening>=end||!creative&&!ordinaryFirst)continue;
  if(!creative&&['kiku','core','double','triple','quad','penta','silver','willow'].includes(s.kind))continue;
  const kind=s.size===3?'kiku':s.size===20?'triple':'core';
  const palette=s.position?.palette==='programme-gold'?'programme-gold':s.size===3?'aqua':'blue-gold';
  const next={...s,kind,position:{...s.position,palette,...(s.kind==='candy'&&s.size===3?{starDensity:.65}:{}),butterflyFlock:undefined}},kept=shots.filter(x=>x!==s);
  // Traditional shells can burn longer than a butterfly. Check that added
  // tail before committing; a crowded optional early silhouette can yield.
  if(fits(next,kept))shots[shots.indexOf(s)]=next;else if(creative)shots=kept;
 }
 plan.shots=shots;
 const live=cue=>plan.shots.some(s=>s.kind===cue.kind&&Math.abs(s.opening-cue.at)<.15);
 plan.creativeCues=(plan.creativeCues??[]).filter(live);
 for(const cues of [plan.soloCues??[],plan.featureCues??[]])for(const c of cues){const s=plan.shots.find(s=>Math.abs((s.anchor??s.opening)-c.at)<.15);if(s){c.kind=s.kind;c.size=s.size;}}
 for(const c of plan.landscapeCreativeCues??[]){c.kinds=c.kinds.filter(k=>plan.shots.some(s=>s.kind===k.kind&&Math.abs(s.opening-k.opening)<.01));c.count=c.kinds.length;}
 plan.openingDirection={end,firstGroups:3,label:'菊や芯入りから始め、創造花火はその後に'};
 plan.analysisSummary.shellKinds=[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];plan.budget=planBudget(plan.shots);
 return plan;
}
