// Coefficients shared by all stars of this single-colour chrysanthemum.
// Preserve the original operation order, Float32 writes and reflected-light sums.
export function updateKikuShellPoints(f,t){
 const count=f.trailCount,c=f.kikuTrailCache??=new Float64Array(count*4);
 for(let j=0;j<count;j++){const lag=j*f.spec.tail,at=Math.max(0,t-lag),k=j*4;
  c[k]=1-Math.exp(-(f.size===20?.7:1.9)*at);c[k+1]=.085*at;c[k+2]=f.spec.gravity*at*at;
  c[k+3]=(t>=lag?1:0)*Math.pow(1-j/count,1.7)*(j===0?2:.9);
 }
 let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;
 const positions=f.positions,colors=f.colors;
 for(let i=0;i<f.n;i++){
  const dir=f.directions[i],col=f.starColors[i];
  for(let j=0;j<count;j++){
   const k=j*4,index=(i*count+j)*3,travel=f.r*f.shells[i]*c[k],x=f.x+dir.x*travel,y=f.y+dir.y*travel+c[k+1]-c[k+2],z=f.z+dir.z*travel;
   let brightness=c[k+3];if(j===0&&f.size>=3)brightness*=1.25;
   positions[index]=x;positions[index+1]=Math.max(.018,y);positions[index+2]=z;
   colors[index]=col.r*brightness;colors[index+1]=col.g*brightness;colors[index+2]=col.b*brightness;
   if(j===0&&brightness>0){const py=positions[index+1];light+=brightness;lightX+=x*brightness;lightY+=py*brightness;lightZ+=z*brightness;lightR2+=(x*x+py*py+z*z)*brightness;if(f.layerLight){f.layerLight[f.starLayers[i]]+=brightness;lightShellR2+=f.shells[i]*f.shells[i]*brightness;}}
  }
 }
 const result=f.kikuLight??={};Object.assign(result,{light,lightX,lightY,lightZ,lightR2,lightShellR2});return result;
}
