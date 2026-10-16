import {styleHash} from './programme-style.js';
import {styleProtected} from './style-programmes.js';
import {groundReservation} from './flower-programmes.js';

const starKinds=['longstar','sparklelarge'];
const starColors=['original','long-purple','long-pink'];
// New recipes only. Saved full-gold recipes keep their original palettes.
export function addGoldAccents(plan,{shellTiming,shellPoints,planBudget}){
 if(plan.programmeStyle?.color!=='gold')return plan;
 const shots=[...plan.shots],upper=shots.filter(s=>s.kind!=='ear'&&!(plan.voiceRequest?.finale?.color&&plan.voiceRequest.finale.color!=='gold'&&/^auto-finale/.test(s.group??''))).sort((a,b)=>a.opening-b.opening);
 const target=Math.round(upper.length*.2),seed=plan.programmeStyle.seed;
 const ground=plan.fans.map(f=>{const g=groundReservation(f,seed);return {...g,points:g.cost*(g.small?11:362)};});
 const span=s=>({start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.1});
 const cost=s=>shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);
 function fits(candidate,original){
  const w=span(candidate),events=[],add=(start,end,v)=>{start=Math.max(w.start,start);end=Math.min(w.end,end);if(start<end)events.push({at:start,v},{at:end,v:v.map(n=>-n)});};
  for(const s of [...shots.filter(s=>s!==original),candidate]){const r=span(s);add(r.start,r.end,[s.kind==='ear'?0:1,s.kind==='ear'?1:0,s.position?.earField?1:0,cost(s)]);}
  for(const g of ground)add(g.start,g.end,[0,0,0,g.points]);
  events.sort((a,b)=>a.at-b.at||a.v[3]-b.v[3]);const n=[0,0,0,0];
  for(const e of events){e.v.forEach((v,i)=>n[i]+=v);if(n[0]>14||n[1]>(n[2]?44:14)||n[3]>(n[2]?96000:64000))return false;}return true;
 }
 const used=new Set(),accents=[];
 function candidate(s,index){
  if(starKinds.includes(s.kind))return {...s,position:{...s.position,palette:starColors[index%3],programmeGoldAccent:true}};
  // Keep authored landscape/chorus/finale shapes. Ordinary upper shells can
  // become gold-tailed large stars without moving any opening or launch point.
  if(!styleProtected(s)&&![ 'butterfly','planet','drum'].includes(s.kind)&&[5,10].includes(s.size)){
   for(const kind of [starKinds[index%2],starKinds[(index+1)%2]]){
    const next={...s,kind,position:{...s.position,palette:starColors[index%3],programmeGoldAccent:true}};
    if(fits(next,s))return next;
   }
  }
  // Small coloured centres are a quiet fallback when a passage has no room
  // for a large star. Their gold petals / outer layer remain gold.
  const palette=s.kind==='goldflower'?['flower-blue','flower-purple','flower-pink'][index%3]:s.kind==='core'?['gold-blue','gold-pink'][index%2]:null;
  return palette?{...s,position:{...s.position,palette,programmeGoldAccent:true}}:null;
 }
 for(let i=0;i<target;i++){
  const center=(i+.5)*upper.length/target;
  const rank=s=>starKinds.includes(s.kind)?0:!styleProtected(s)&&[5,10].includes(s.size)?1:2;
  // One accent per fifth of the upper-shell sequence, with nearby fallbacks.
  const order=upper.map((s,j)=>({s,j})).filter(({s})=>!used.has(s)).sort((a,b)=>{
   const da=Math.floor(Math.abs(a.j-center)/5),db=Math.floor(Math.abs(b.j-center)/5);
   return da-db||rank(a.s)-rank(b.s)||Math.abs(a.j-center)-Math.abs(b.j-center)||styleHash(seed,a.j)-styleHash(seed,b.j);
  });
  for(const {s} of order){const next=candidate(s,i);if(!next)continue;shots[shots.indexOf(s)]=next;used.add(s);accents.push({at:s.opening,kind:next.kind,size:next.size,palette:next.position.palette});break;}
 }
 const colorLabel='金色中心・約２割に控えめな差し色';
 plan.shots=shots;plan.goldAccents={version:1,target,upperShells:upper.length,count:accents.length,share:upper.length?accents.length/upper.length:0,cues:accents.sort((a,b)=>a.at-b.at)};
 plan.programmeStyle={...plan.programmeStyle,colorLabel,description:[plan.programmeStyle.label,colorLabel,plan.programmeStyle.stagingLabel].join(' · ')};
 for(const cue of [...(plan.featureCues??[]),...(plan.soloCues??[])]){const s=shots.find(s=>Math.abs(s.opening-cue.at)<.01);if(s)cue.kind=s.kind;}
 plan.analysisSummary.shellKinds=[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];
 plan.budget=planBudget(shots);plan.showDuration=Math.max(plan.showDuration,...shots.map(s=>span(s).end+1));
 plan.method+='; gold-led upper shells with about one fifth subtle coloured large-star tips and centres; ground-inclusive capacity checked.';
 return plan;
}
