import {groundReservation} from './flower-programmes.js';
// Keep musical opening times. Every resized shell is checked with ground stars.
export function directVoicePlan(plan,request,{shellTiming,shellPoints,planBudget}){
 if(!request?.recognized)return plan;
 let shots=plan.shots,fans=plan.fans;
 const sparse=request.density==='sparse';
 if(sparse){
  // Choose one flower of light per phrase, including the ending. Ground rows
  // and long beds would conceal the requested quiet gaps, so omit them here.
  const candidates=shots.filter(s=>s.kind!=='ear');
  const priority=s=>/^auto-finale/.test(s.group??'')?5:/auto-chorus-(entry|repeat)/.test(s.group??'')?4:s.size>=10?3:s.size>=5?2:1;
  const chosen=[];
  for(const s of [...candidates].sort((a,b)=>priority(b)-priority(a)||a.opening-b.opening))if(!chosen.some(k=>Math.abs(k.opening-s.opening)<7.2))chosen.push(s);
  shots=chosen.sort((a,b)=>a.at-b.at);fans=[];
  for(const key of ['earPassages','flowerPassages','landscapeCreativeCues','creativeCues','soloCues','chorusFollowCues','repeatEntryCues','featureCues','chorusEntryCues'])plan[key]=[];
  plan.sections=plan.sections.filter(s=>!/(花畑|絨毯|田園|水田|海に|穂の)/.test(s.label??''));
  plan.programmeStyle={...plan.programmeStyle,flowerFocus:false,flowerSceneCount:0,staging:'solos',stagingLabel:'ぽつりぽつり、間を味わう'};
  plan.programmeStyle.description=[plan.programmeStyle.label,plan.programmeStyle.colorLabel,plan.programmeStyle.stagingLabel].join(' · ');
 }
 const span=s=>({start:s.at,end:s.opening+shellTiming(s.kind,s.size).life+.1});
 const ground=fans.map(f=>{const r=groundReservation(f,plan.programmeStyle.seed);return {...r,points:r.cost*(r.small?11:362)};});
 function fits(c,kept){const w=span(c),events=[],add=(start,end,v)=>{start=Math.max(start,w.start);end=Math.min(end,w.end);if(start<end)events.push({at:start,v},{at:end,v:v.map(n=>-n)});};
  for(const s of [...kept,c]){const r=span(s);add(r.start,r.end,[s.kind==='ear'?0:1,s.kind==='ear'?1:0,s.position?.earField?1:0,shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1)]);}
  for(const g of ground)add(g.start,g.end,[0,0,0,g.points]);
  events.sort((a,b)=>a.at-b.at||a.v[3]-b.v[3]);const n=[0,0,0,0];for(const e of events){e.v.forEach((v,i)=>n[i]+=v);if(n[0]>14||n[1]>(n[2]?44:14)||n[3]>(n[2]?96000:64000))return false;}return true;
 }
 if(request.size){
  for(const [i,s] of [...shots].entries()){
   if(s.kind==='ear'||/^auto-flower-/.test(s.group??''))continue;
   let size=request.size==='large'?(s.size>=5?s.size:i%3===0?10:5):request.size==='medium'?5:3;
   if(size===s.size)continue;
   let kind=s.kind;
   if(size<10&&['double','triple','quad','penta','candysenrin','senrin'].includes(kind))kind='core';
   if(size===3&&['longstar','sparklelarge','butterfly','planet','drum','candyburst'].includes(kind))kind='petalflower';
   const at=s.at+shellTiming(s.kind,s.size).ascent-shellTiming(kind,size).ascent;
   const c={...s,at,kind,size,position:{...s.position,startAt:at}};
   if(at>=.08&&fits(c,shots.filter(x=>x!==s)))shots[shots.indexOf(s)]=c;
   else if(request.size==='large'&&s.size<5)shots=shots.filter(x=>x!==s);
  }
 }
 if(request.density==='dense'){
  for(const [i,s] of [...shots].entries()){
   if(i%3||s.kind==='ear'||s.position?.earField||/^auto-flower-|^auto-finale/.test(s.group??''))continue;
   const shift=1.15,c={...s,at:s.at+shift,opening:s.opening+shift,anchor:(s.anchor??s.opening)+shift,group:'voice-more',position:{...s.position,x:-(s.position.x??0),startAt:s.at+shift}};
   if(c.opening<plan.duration-4&&fits(c,shots))shots.push(c);
  }
 }
 // A voice override can select a different base director than the lottery.
 // Validate its whole timeline too, including existing ground reservations.
 for(let attempt=0;attempt<shots.length+fans.length+100;attempt++){
  const events=[];for(const shot of shots){const w=span(shot),cost=shellPoints(shot.kind,shot.size,shot.position?.wide,shot.position?.starDensity??1),v=[shot.kind==='ear'?0:1,shot.kind==='ear'?1:0,shot.position?.earField?1:0,cost];events.push({at:w.start,v},{at:w.end,v:v.map(x=>-x)});}
  for(const g of ground)events.push({at:g.start,v:[0,0,0,g.points]},{at:g.end,v:[0,0,0,-g.points]});
  events.sort((a,b)=>a.at-b.at||a.v[3]-b.v[3]);const n=[0,0,0,0];let breach=null;
  for(const e of events){e.v.forEach((v,i)=>n[i]+=v);if(n[0]>14||n[1]>(n[2]?44:14)||n[3]>(n[2]?96000:64000)){breach=e.at;break;}}
  if(breach===null)break;
  const touching=shots.filter(s=>s.kind!=='ear'&&s.at<=breach&&span(s).end>breach).sort((a,b)=>Number(b.group==='voice-more')-Number(a.group==='voice-more')||shellPoints(b.kind,b.size)-shellPoints(a.kind,a.size));
  if(touching.length){shots=shots.filter(s=>s!==touching[0]);continue;}
  // Ear-only base scenes have their own proven capacity. Do not damage their
  // lower rows; a malformed custom input is rejected instead of overbooking.
  throw Error('この希望では花火が重なりすぎるため、もう一度構成を作ってください。');
 }
 shots.sort((a,b)=>a.at-b.at);shots=shots.map((s,i)=>({...s,reviewIndex:i}));
 plan.shots=shots;plan.fans=fans;plan.voiceRequest={...request};
 const summary=plan.analysisSummary;
 summary.voice=request.summary;summary.shellKinds=[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];summary.groundModes=[...new Set(fans.map(f=>f.mode))];summary.earShots=shots.filter(s=>s.kind==='ear').length;
 summary.fastSmallShots=shots.filter(s=>s.size===3).length;summary.goldSmallShots=shots.filter(s=>s.size===3&&s.position?.palette==='programme-gold').length;
 plan.budget=planBudget(shots);plan.showDuration=Math.max(plan.duration+1,...shots.map(s=>span(s).end+1),...ground.map(g=>g.end+1));
 plan.method+='; local voice directions, quiet phrase spacing and ground-inclusive resizing checks.';
 return plan;
}
