// Town units keep their approved geometry; only whole-town placement changes.
export const PLACEMENT_LIMITS=Object.freeze({scale:{min:.1,max:200,step:.05,standard:1},distance:{min:.5,max:500,step:.1,standard:2},height:{min:-100,max:100,step:.05,standard:0}});
const ticks={scale:[.1,.2,.5,1,2,5,10,20,50,100,200],distance:[.5,1,2,5,10,20,50,100,200,500],height:[-100,-50,-20,-10,-5,-2,-1,0,1,2,5,10,20,50,100]};
export function placementStep(id,value,direction,large=false){
 const range=PLACEMENT_LIMITS[id];if(!range)return value;
 value=Number.isFinite(value)?value:range.standard;direction=Math.sign(direction);
 let next=value;
 if(large){const options=direction>0?ticks[id]:[...ticks[id]].reverse();next=options.find(x=>direction*(x-value)>1e-7)??(direction>0?range.max:range.min);}
 else{const n=Math.abs(value),step=id==='scale'?(n<2?.05:n<10?.1:n<50?.5:1):id==='distance'?(n<5?.1:n<20?.5:n<100?1:5):(n<2?.05:n<10?.1:n<50?.5:1);next=value+direction*step;}
 return Math.round(Math.max(range.min,Math.min(range.max,next))*1000)/1000;
}
export function placementFar(distance,scale,height){return Math.max(40,(Math.abs(distance)+Math.abs(height)+scale*12)*2);}
// Keep ordinary miniature stars unchanged; enlarged scenes need larger points too.
export function placementPointScale(scale,diorama=false){return diorama?scale:Math.max(1,scale);}
