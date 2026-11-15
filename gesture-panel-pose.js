// Horizontal hand aim, anchored at the current viewer; no town orientation.
export function gesturePanelPose(viewer,rayTransform,handedness=null){
 const vm=viewer.matrix,rm=rayTransform?.matrix;let x=rm?-rm[8]:0,z=rm?-rm[10]:0;
 if(Math.hypot(x,z)<.25){x=-vm[8];z=-vm[10];}
 let length=Math.hypot(x,z);if(length<.001){x=0;z=-1;length=1;}x/=length;z/=length;
 // Outward from each hand: right +15 degrees, left -15 degrees in view.
 const offset=(handedness==='right'?-1:handedness==='left'?1:0)*Math.PI/12,c=Math.cos(offset),sn=Math.sin(offset),oldX=x;
 x=c*x+sn*z;z=-sn*oldX+c*z;
 const p=viewer.position;
 return {position:{x:p.x,y:p.y,z:p.z},matrix:[-z,0,x,0,0,1,0,0,-x,0,-z,0,p.x,p.y,p.z,1]};
}
export function panelNearAim(position,transform){
 const p=transform.position,m=transform.matrix,x=position.x-p.x,z=position.z-p.z,n=Math.hypot(x,z);
 return n>.2&&n<1.8&&Math.abs(position.y-p.y)<.8&&(x*-m[8]+z*-m[10])/n>.94;
}
