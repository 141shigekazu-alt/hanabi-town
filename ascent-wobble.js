const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function shellAscentSeed(shell){
 if(Number.isFinite(shell.ascentSeed))return shell.ascentSeed>>>0;
 let seed=2166136261;const key=[shell.size,shell.start??0,shell.x,shell.z,shell.launchX,shell.launchZ].map(n=>Number(n??0).toFixed(6)).join('|');
 for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),16777619);return seed>>>0;
}
export function wobbleParameters(seed,axis=0){
 let s=((seed>>>0)^Math.imul(axis+1,0x9e3779b9))>>>0;
 const random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 return {amplitude:.0025*(.85+random()*.30),phase1:random()*Math.PI*2,phase2:random()*Math.PI*2,frequency1:6.2+random()*2.2,frequency2:13+random()*4};
}
// Per-shell phases and frequencies are fixed at launch, never random each frame.
// Normalize the short early irregularity; end with the kept straight final rise.
export function ascentWobble(age,duration,seed=417,axis=0){return sampleAscentWobble(age,duration,wobbleParameters(seed,axis));}
export function sampleAscentWobble(age,duration,p){
 const u=clamp(age/duration),t=u*4,envelope=1-smooth((u-.35)/.30);
 return p.amplitude*envelope*.5*(.72*(Math.sin(t*p.frequency1+p.phase1)-Math.sin(p.phase1))+.28*(Math.sin(t*p.frequency2+p.phase2)-Math.sin(p.phase2)));
}
