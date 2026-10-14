// Directing consumes only the detector's output. No reference TC or song identity.
export function automaticRepeatHeads(analysis){
 const detection=analysis.repeatAnalysis;
 if(!detection||detection.manualTimingUsed!==false)return [];
 const candidates=[];
 for(const head of detection.heads||[]){
  if(!Number.isFinite(head.at)||!Number.isFinite(head.similarity))continue;
  const run=analysis.chorus?.find(c=>head.at>c.at&&head.at<c.end);
  if(!run||head.at-run.at<Math.max(4,(analysis.period||.5)*8))continue;
  candidates.push({...head,end:run.end});
 }
 candidates.sort((a,b)=>a.at-b.at);
 const accepted=[];
 for(const head of candidates){
  const last=accepted.at(-1);
  if(last&&head.at-last.at<Math.max(4,(analysis.period||.5)*8)){
   if(head.similarity>last.similarity)accepted[accepted.length-1]=head;
  }else accepted.push(head);
 }
 return accepted;
}
