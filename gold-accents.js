import {styleHash} from './programme-style.js';
import {styleProtected} from './style-programmes.js';
import {groundReservation} from './flower-programmes.js';

const starKinds=['longstar','sparklelarge'];
const colors=['gold-accent-blue','gold-accent-purple','gold-accent-pink','gold-accent-aqua'];
// New recipes only. Saved full-gold recipes keep their original palettes.
export function addGoldAccents(plan,{shellTiming,shellPoints,planBudget}){
 if(plan.programmeStyle?.color!=='gold')return plan;
 const shots=[...plan.shots],upper=shots.filter(s=>s.kind!=='ear'&&!(plan.voiceRequest?.finale?.color&&plan.voiceRequest.finale.color!=='gold'&&/^auto-finale/.test(s.group??''))).sort((a,b)=>a.opening-b.opening);
 const seed=plan.programmeStyle.seed,share=plan.programmeStyle.goldColorShare??(styleHash(seed,90)%3===0?.65:.4),target=Math.round(upper.length*share);
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
  // Recolour the large outer bloom, not just its tips or tiny centre. A large
  // star with only a handful of coloured tips becomes a full coloured shell.
  const kind=starKinds.includes(s.kind)?s.size===20?'triple':'core':s.kind;
  const next={...s,kind,position:{...s.position,palette:colors[index%colors.length],programmeGoldAccent:true}};
  return fits(next,s)?next:null;
 }

 for(let i=0;i<target;i++){
  const center=(i+.5)*upper.length/target;
  const rank=s=>!styleProtected(s)?0:1;
  // Distribute coloured blooms across the whole sequence, with nearby fallbacks.
  const order=upper.map((s,j)=>({s,j})).filter(({s})=>!used.has(s)).sort((a,b)=>{
   const da=Math.floor(Math.abs(a.j-center)/5),db=Math.floor(Math.abs(b.j-center)/5);
   return da-db||rank(a.s)-rank(b.s)||Math.abs(a.j-center)-Math.abs(b.j-center)||styleHash(seed,a.j)-styleHash(seed,b.j);
  });
  for(const {s} of order){const next=candidate(s,i);if(!next)continue;shots[shots.indexOf(s)]=next;used.add(s);accents.push({at:s.opening,kind:next.kind,size:next.size,palette:next.position.palette});break;}
 }
 const colorLabel=share>.5?'金色に豊かな彩り・約６〜７割に色の花':'金色中心・約４割に色の花';
 plan.shots=shots;plan.goldAccents={version:2,target,requestedShare:share,mode:share>.5?'colorful':'gold-led',upperShells:upper.length,count:accents.length,share:upper.length?accents.length/upper.length:0,cues:accents.sort((a,b)=>a.at-b.at)};
 plan.programmeStyle={...plan.programmeStyle,colorLabel,description:[plan.programmeStyle.label,colorLabel,plan.programmeStyle.stagingLabel].join(' · ')};
 for(const cue of [...(plan.featureCues??[]),...(plan.soloCues??[])]){const s=shots.find(s=>Math.abs(s.opening-cue.at)<.01);if(s)cue.kind=s.kind;}
 plan.analysisSummary.shellKinds=[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];
 plan.budget=planBudget(shots);plan.showDuration=Math.max(plan.showDuration,...shots.map(s=>span(s).end+1));
 plan.method+='; gold-led upper shells with 40% or 65% visible coloured outer blooms; ground-inclusive capacity checked.';
 return plan;
}
