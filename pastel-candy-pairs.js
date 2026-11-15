import {CANDY_PAIR_IDS} from './candy-big-stars.js?v=1.3.1';
import {planBudget} from './auto-music-plan.js';
const cache=new WeakMap();
export function mixPastelCandyPairs(plan,trackId){
 if(trackId!=='pastel-parasite'||!plan?.shots||plan.candyPairMix?.version===2)return plan;
 if(cache.has(plan))return cache.get(plan);
 const candidates=plan.shots.map((s,i)=>({s,i})).filter(({s})=>s.kind==='candyburst'&&s.group==='big-star-answer').sort((a,b)=>(a.s.opening??a.s.at)-(b.s.opening??b.s.at)||a.i-b.i);
 const groups=new Map();for(const item of candidates){const key=(item.s.opening??item.s.at).toFixed(2);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
 const selected=new Map(),cues=[];let groupIndex=0,pairedIndex=0;
 for(const group of groups.values()){
  if(groupIndex++%2!==0)continue;
  const palette=CANDY_PAIR_IDS[pairedIndex++%CANDY_PAIR_IDS.length];for(const {i}of group)selected.set(i,palette);
  cues.push({opening:group[0].s.opening,size:group[0].s.size,shells:group.length,palette});
 }
 const shots=plan.shots.map((s,i)=>selected.has(i)?{...s,position:{...s.position,palette:selected.get(i)}}:s);
 const out={...plan,shots,candyPairMix:{version:2,pairs:selected.size,originalBigStars:plan.shots.filter(s=>s.kind==='candyburst').length,symmetricGroups:true,cues},budget:planBudget(shots)};cache.set(plan,out);return out;
}
