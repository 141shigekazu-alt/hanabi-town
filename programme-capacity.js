import {groundReservation} from './flower-programmes.js';
// Final allocation pass for newly composed shows. A complete flower bed and
// flock stay together; only optional aerial filler yields to reserved scenes.
export function limitProgrammeCapacity(plan,{shellTiming,shellPoints,planBudget}){
 let ground=plan.fans.map(f=>{const g=groundReservation(f,plan.programmeStyle.seed);return {...g,source:f,points:g.cost*(g.small?11:362)};});
 const cost=s=>shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1),end=s=>s.opening+shellTiming(s.kind,s.size).life+.1;
 let shots=[...plan.shots],removed=0,removedFans=0;
 function breach(){
  const events=[];for(const s of shots){const v=[s.kind==='ear'?0:1,s.kind==='ear'?1:0,s.position?.earField?1:0,cost(s)];events.push({at:s.at,v},{at:end(s),v:v.map(x=>-x)});}
  for(const g of ground)events.push({at:g.start,v:[0,0,0,g.points]},{at:g.end,v:[0,0,0,-g.points]});
  events.sort((a,b)=>a.at-b.at||a.v[3]-b.v[3]);const n=[0,0,0,0];for(const e of events){e.v.forEach((v,i)=>n[i]+=v);if(n[0]>14||n[1]>(n[2]?44:14)||n[3]>(n[2]?96000:64000))return e.at;}return null;
 }
 for(let tries=0;tries<plan.shots.length+plan.fans.length;tries++){
  const at=breach();if(at===null)break;
  const touching=shots.filter(s=>s.at<=at&&end(s)>at&&s.kind!=='ear');
  const priority=s=>/^auto-finale/.test(s.group??'')?5:/^auto-flower-carpet/.test(s.group??'')?4:/^auto-chorus-(entry|repeat)/.test(s.group??'')?3:s.position?.butterflyFlock?2:s.group==='auto-feature'?1:0;
  touching.sort((a,b)=>priority(a)-priority(b)||cost(b)-cost(a));const remove=touching[0];
  if(!remove||priority(remove)>=4){
   const g=ground.filter(g=>g.start<=at&&g.end>at&&!/^small-flower-/.test(g.source.mode)).sort((a,b)=>b.points-a.points)[0];
   if(!g)throw Error('見せ場の花火が重なりすぎるため、別の構成をお試しください。');
   ground=ground.filter(x=>x!==g);plan.fans=plan.fans.filter(f=>f!==g.source);removedFans++;continue;
  }

  const kept=shots.filter(s=>remove.position?.butterflyFlock?s.position?.butterflyFlock!==remove.position.butterflyFlock:s!==remove);removed+=shots.length-kept.length;shots=kept;
 }
 if(breach()!==null)throw Error('構成の同時表示数を調整できませんでした。');
 if(removed||removedFans){
  plan.shots=shots;plan.budget=planBudget(shots);plan.capacityAdjustment={shellsRemoved:removed,groundCuesRemoved:removedFans};
  const live=c=>shots.some(s=>Math.abs((s.anchor??s.opening)-c.at)<.16&&s.kind===c.kind);
  for(const key of ['creativeCues','soloCues','featureCues'])plan[key]=(plan[key]??[]).filter(live);
  for(const cue of plan.flowerPassages??[])cue.upperCount=shots.filter(s=>s.group==='auto-flower-garden-upper'&&s.opening>=cue.firstOpening&&s.opening<=cue.lastOpening+.2).length;
 }
 if(plan.voiceApplication){const body=plan.shots.filter(s=>s.kind!=='ear'&&!/^auto-finale/.test(s.group??'')&&!s.position?.earField&&!/^auto-flower-/.test(s.group??''));Object.assign(plan.voiceApplication,{bodyShells:body.length,bodySmall:body.filter(s=>s.size===3).length,bodyLarge:body.filter(s=>s.size>=5).length,finaleShells:plan.shots.filter(s=>s.kind!=='ear'&&/^auto-finale/.test(s.group??'')).length});}
 plan.analysisSummary.shellKinds=[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];plan.analysisSummary.groundModes=[...new Set(plan.fans.map(f=>f.mode))];
 return plan;
}
