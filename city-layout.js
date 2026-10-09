// Shared by the bridge, its viewing position and the avenue on both banks.
export const EITAI_ANGLE=-12*Math.PI/180,EITAI_Z=.67,AVENUE_WIDTH=.085,SIDEWALK_WIDTH=.012;
export const AVENUE_HALF=AVENUE_WIDTH/2+SIDEWALK_WIDTH;
export const eitaiCenterX=.22*Math.sin(EITAI_Z*2.7+.35);
export function avenueDistance(x,z){return (x-eitaiCenterX)*Math.sin(EITAI_ANGLE)+(z-EITAI_Z)*Math.cos(EITAI_ANGLE);}
export function arrangeCity(roofs,riverCenter,riverWidth){
 const result=roofs.map(r=>({...r,originalX:r.x,originalZ:r.z}));
 const xAt=(r,z)=>r.originalX+riverCenter(z)-riverCenter(r.originalZ)+r.side*(riverWidth(z)-riverWidth(r.originalZ))/2;
 const radius=r=>Math.abs(Math.sin(EITAI_ANGLE))*r.w/2+Math.cos(EITAI_ANGLE)*r.d/2;
 function edge(r,front){
  let z=r.originalZ;
  for(let i=0;i<12;i++)z=EITAI_Z+((front?1:-1)*(AVENUE_HALF+.025+radius(r))-(xAt(r,z)-eitaiCenterX)*Math.sin(EITAI_ANGLE))/Math.cos(EITAI_ANGLE);
  return z;
 }
 for(const side of [-1,1])for(let col=0;col<5;col++){
  const column=result.filter(r=>r.side===side&&r.col===col);
  const front=column.filter(r=>r.row===6||avenueDistance(r.originalX,r.originalZ)>=0).sort((a,b)=>a.row-b.row);
  const back=column.filter(r=>!front.includes(r)).sort((a,b)=>b.row-a.row);
  let previous=null;
  for(const r of front){r.z=Math.max(r.row===6?r.originalZ+.24:r.originalZ,edge(r,true),previous?previous.z+(previous.d+r.d)/2+.035:-Infinity);r.x=xAt(r,r.z);previous=r;}
  previous=null;
  for(const r of back){r.z=Math.min(r.originalZ,edge(r,false),previous?previous.z-(previous.d+r.d)/2-.035:Infinity);r.x=xAt(r,r.z);previous=r;}
 }
 return result;
}
