import {styleHash,styleKind,stylePalette} from './programme-style.js?v=1.3.10';
import {variationRandom} from './flower-variation.js';
// Sparse means individual flowers with breathing room, not long empty bars.
// Compose a timeline rather than deleting shots from an already sparse plan.
export function spacedVoiceShots(plan,request,{shellTiming}){
 const style=plan.programmeStyle,seed=style.seed,r=variationRandom(seed,0x591ace),signed=()=>r()*2-1;
 const period=60/Math.max(45,Math.min(180,plan.tempoEstimate??90)),step=Math.max(3.8,Math.min(5.0,Math.round(4.4/period)*period));
 const energy=plan.energy??[],peak=Math.max(0,...energy.map(e=>e.rms??0)),audible=energy.filter(e=>e.rms>peak*.0015);
 const first=audible[0]?.time??0,last=Math.min(plan.analysisSummary?.audibleEnd??plan.duration,plan.duration),originalEnd=plan.shots.filter(s=>s.kind!=='ear'&&/^auto-finale/.test(s.group??'')).sort((a,b)=>a.opening-b.opening);
 const finals=request.finale?originalEnd:originalEnd.filter((s,i)=>i===originalEnd.length-1||s.size>=5&&originalEnd.at(-1).opening-s.opening>=3);
 const end=Math.min(last-.4,(finals[0]?.opening??last)-3.6),shots=[];
 const nearest=at=>{let best=at,d=.22;for(const b of plan.beats??[]){const v=Math.abs(b.time-at);if(v<d){best=b.time;d=v;}}return best;};
 let at=Math.max(3.4,first+1.1);
 for(let index=0;at<end;index++){
  const opening=nearest(at);
  // Respect actual silence. A quiet but audible introduction still gets flowers.
  const around=energy.filter(e=>Math.abs(e.time-opening)<.7),silent=peak>0&&around.length&&around.every(e=>(e.rms??0)<=peak*.0015);
  if(!silent){
   const size=request.size==='small'?3:request.size==='medium'?5:request.size==='large'?(index%3?5:10):request.sizeAccent?(request.sizeAccent==='large'?5:3):index%5===3?10:5;
   let kind=styleKind(style,size,index)??(size===3?'kiku':'core');
   const timing=shellTiming(kind,size),ignitionDelay=.025+r()*.05,ascentOffset=signed()*.045,startAt=opening-timing.ascent-ignitionDelay-ascentOffset;
   const launchX=signed()*.66,launchZ=-.08+signed()*.06;
   if(startAt>=.08)shots.push({at:startAt,opening,anchor:opening,kind,size,group:'voice-spaced',position:{startAt,x:launchX+signed()*.045,z:launchZ+signed()*.035,launchX,launchZ,heightOffset:signed()*.035+(size===3?-.12:0),ignitionDelay,ascentOffset,palette:stylePalette(style,kind,index),reviewSeed:styleHash(seed,index+591)}});
  }
  at+=step+[.15,-.25,.3,-.1,0][index%5]+signed()*.07;
 }
 plan.voicePacing={version:2,bodyCount:shots.length,targetSeconds:step,label:'一輪ずつ、余韻を残して次の花へ'};
 return [...shots,...finals].sort((a,b)=>a.at-b.at);
}
