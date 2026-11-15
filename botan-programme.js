// Display-time adaptation: never rewrite saved source programmes.
const adapted=new WeakMap();
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\s・･_\-ー]/g,'');
export function isParallelParasite(title){return ['パラレルパラサイト','parallelparasite'].includes(normalize(title));}
export function mixParallelBotan(plan,titles=[],trackId=null){
 if(!plan?.shots||!(trackId==='pastel-parasite'||titles.some(isParallelParasite))||plan.botanMix?.version===1)return plan;
 if(adapted.has(plan))return adapted.get(plan);
 const candidates=plan.shots.map((shot,index)=>({shot,index})).filter(({shot})=>['kiku','candy'].includes(shot.kind)).sort((a,b)=>(a.shot.opening??a.shot.at)-(b.shot.opening??b.shot.at)||a.index-b.index);
 const replace=new Set(candidates.filter((_,i)=>i%2===1).map(c=>c.index));
 let out={...plan,shots:plan.shots.map((shot,index)=>replace.has(index)?{...shot,kind:'botan'}:shot),botanMix:{version:1,sourceKiku:candidates.length,botan:replace.size}};
 if(plan.analysisSummary)out.analysisSummary={...plan.analysisSummary,shellKinds:[...new Set(out.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))]};
 out=addCandyCores(out);adapted.set(plan,out);return out;
}

export function candyCoreSpec(kind,spec,position){
 if(!position?.candyCore||!['botan','candy','kiku'].includes(kind))return spec;
 return {...spec,radii:[1,.44],layerWeights:[spec.layerWeights?.[0]??1,kind==='candy'?(spec.layerWeights?.[1]??.28):.38]};
}
export function addCandyCores(plan){
 if(plan.candyCores)return plan;
 const groups=new Map();for(const [index,s]of plan.shots.entries())if(['botan','candy','kiku'].includes(s.kind)&&[5,10].includes(s.size)){const key=s.kind+':'+s.size;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(index);}
 const entries=[...groups.values()],total=entries.reduce((n,g)=>n+g.length,0),quota=entries.map(g=>Math.floor(g.length/2));let remaining=Math.floor(total/2)-quota.reduce((a,b)=>a+b,0);
 for(const i of entries.map((g,i)=>i).sort((a,b)=>(entries[b].length%2)-(entries[a].length%2)||entries[b].length-entries[a].length)){if(remaining<=0)break;if(entries[i].length%2){quota[i]++;remaining--;}}
 const selected=new Set();entries.forEach((g,i)=>{for(let j=0;j<quota[i];j++)selected.add(g[Math.floor((j+.5)*g.length/quota[i])]);});let serial=0;
 const shots=plan.shots.map((s,i)=>{if(!selected.has(i))return s;const p=s.position?.palette??'',color=serial++%2===0?0xffcf70:/aqua|blue/.test(p)?0xff73c8:/pink|red|lemon/.test(p)?0x66ddff:0xffe629;return {...s,position:{...s.position,candyCore:true,coreColor:color}};});
 return {...plan,shots,candyCores:{total,selected:selected.size}};
}
