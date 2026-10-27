// Plan-time changes only: favourites retain their saved coordinates on replay.
// Preserve musical timing, payload, single shells, ground scenes and climaxes.
const round=x=>+x.toFixed(6);
function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;}
export function softenRepeatedRows(plan,{seed=0}={}){
 if(!Array.isArray(plan?.shots)||plan.layoutRevision)return plan;
 const shots=plan.shots.map(s=>({...s,position:{...s.position}}));
 const eligible=shots.filter(s=>[3,5,10].includes(s.size)&&Number.isFinite(s.position.x)&&Number.isFinite(s.opening)&&!s.position.flowerProgramme&&!s.position.flowerStudy&&!/final|drop|senrin|flower|pattern|ear|intro-sweets/.test(s.group??'')&&!['ear','sunflower','petalflower','goldflower'].includes(s.kind));
 const rows=[];
 for(const size of [3,5,10]){
  const list=eligible.filter(s=>s.size===size).sort((a,b)=>a.opening-b.opening);
  for(let i=0;i<list.length;){let j=i+1;while(j<list.length&&list[j].opening-list[i].opening<=.24)j++;
   const row=list.slice(i,j).sort((a,b)=>a.position.x-b.position.x);i=j;
   if(row.length<3)continue;
   const gaps=row.slice(1).map((s,k)=>s.position.x-row[k].position.x),heights=row.map(s=>s.position.heightOffset??0);
   if(Math.min(...gaps)<.16||Math.max(...heights)-Math.min(...heights)>.15)continue;
   rows.push(row);
  }
 }
 rows.sort((a,b)=>a[0].opening-b[0].opening);
 let changedRows=0;
 rows.forEach((row,index)=>{
  // Keep one row in four intact so alignment remains an intentional contrast.
  if(index%4===0)return;
  let state=hash(`${seed}:${row[0].opening.toFixed(3)}:${row[0].group}:${row[0].size}`);
  const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  const sign=random()<.5?-1:1;
  const minGap=Math.min(...row.slice(1).map((s,k)=>s.position.x-row[k].position.x));
  const width=Math.min(.08,minGap*.2),height=row[0].size===3?.065:row[0].size===5?.08:.09;
  row.forEach((s,k)=>{
   const p=s.position,u=k/(row.length-1)*2-1;
   // Alternate a gentle slope, uneven arc, and staggered heights between volleys.
   const shape=index%3===0?u:index%3===1?(1-2*u*u):((k%2?1:-1)*.65+u*.25);
   const dx=(random()*2-1)*width,dz=(random()*2-1)*.045;
   p.launchX=round((p.launchX??p.x)+dx);p.x=round(p.x+dx);
   p.launchZ=round((p.launchZ??p.z??0)+dz);p.z=round((p.z??0)+dz);
   p.heightOffset=round((p.heightOffset??0)+sign*height*(shape*.85+(random()*2-1)*.15));
  });
  changedRows++;
 });
 return {...plan,shots,layoutRevision:'layout01',layoutReview:{candidateRows:rows.length,changedRows}};
}
