// Two overlapping volleys of 11 columns x two heights. The wider allocation is
// local to these marked landscapes; ordinary aerial/ear scenes keep their caps.
export const EAR_FIELD_LIMIT=44,EAR_FIELD_POINT_LIMIT=96000;
export function earProgrammeBreach(shots,{shellTiming,shellPoints}){
 const events=[];
 for(const s of shots){
  const points=shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);
  const value={upper:s.kind==='ear'?0:1,ears:s.kind==='ear'?1:0,field:s.position?.earField?1:0,points};
  events.push({at:s.at,...value});events.push({at:s.opening+shellTiming(s.kind,s.size).life+.1,...Object.fromEntries(Object.entries(value).map(([k,v])=>[k,-v]))});
 }
 events.sort((a,b)=>a.at-b.at||a.points-b.points);
 let upper=0,ears=0,field=0,points=0;
 for(const e of events){upper+=e.upper;ears+=e.ears;field+=e.field;points+=e.points;if(upper>14||ears>(field?EAR_FIELD_LIMIT:14)||points>(field?EAR_FIELD_POINT_LIMIT:64000))return {at:e.at,upper,ears,points,field};}
 return null;
}

export const earProgrammeFits=(shots,helpers)=>!earProgrammeBreach(shots,helpers);
