import {EAR_PROFILE,createEarRow,createEarTiming} from './golden-ears.js?v=1.2.81';
// Colours follow spatial slots even though their ignition order is shuffled.
// Closer tufts form a curtain; each tuft keeps the accepted gold trajectory.
export function rainEarSequence(seed,mode='alternating',start=0){
 const row=createEarRow(seed,11,.17),timing=createEarTiming(seed,11);
 const shots=row.map((p,slot)=>{const at=start+timing[slot].launchOffset;return {at,kind:'ear',size:2,position:{...p,z:-.7+p.z,ignitionDelay:timing[slot].ignitionDelay,startAt:at,palette:mode==='gold'?'original':mode==='sunset'?(slot%2?'ear-orange':'ear-red'):['aqua','blue','red','orange','purple','green'].includes(mode)?'ear-'+mode:slot%2?'ear-blue':'ear-aqua'}};}).sort((a,b)=>a.at-b.at);
 const firstOpening=Math.min(...shots.map(s=>s.at+1.65+s.position.ignitionDelay)),lastExtinction=Math.max(...shots.map(s=>s.at+1.65+s.position.ignitionDelay+EAR_PROFILE.life));
 return {shots,firstOpening,lastExtinction,finishAt:lastExtinction+.45};
}
