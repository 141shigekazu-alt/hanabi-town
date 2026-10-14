// Read compatibility only. Old stored programmes remain untouched for older builds.
const RETIRED='spiral';
const COLORS=['flower-red','flower-yellow','flower-pink','flower-purple','flower-blue'];
export function flowerPalette(palette='original'){
 if(COLORS.includes(palette))return palette;
 return /blue|aqua|水色|青/.test(palette)?'flower-blue':/pink|桃/.test(palette)?'flower-pink':/purple|紫/.test(palette)?'flower-purple':/red|紅/.test(palette)?'flower-red':'flower-yellow';
}
export function replaceRetiredShell(shot){
 if(shot.kind!==RETIRED)return shot;
 const kind=shot.size>=10||shot.position?.x>0?'goldflower':'petalflower';
 return {...shot,kind,position:{...shot.position,palette:flowerPalette(shot.position?.palette)}};
}
const wording=value=>value.replaceAll('渦巻き','長い花びら').replaceAll(RETIRED,'long-petal');
export function replaceRetiredPlan(plan){
 if(!plan||!Array.isArray(plan.shots)||!plan.shots.some(s=>s.kind===RETIRED))return plan;
 const copy=structuredClone(plan);copy.shots=copy.shots.map(replaceRetiredShell);
 function labels(value){
  if(Array.isArray(value)){value.forEach(labels);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,item]of Object.entries(value))if(typeof item==='string'&&['label','group','kind','description','method'].includes(key))value[key]=wording(item);else if(item&&typeof item==='object')labels(item);
 }
 labels(copy);
 if(copy.analysisSummary?.shellKinds)copy.analysisSummary.shellKinds=[...new Set(copy.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];
 return copy;
}
