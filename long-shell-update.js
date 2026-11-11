import {prepareLongStarPoint} from './long-stars.js?v=1.3.1';
// Trail ages and exponential motion are shared by every star in each layer.
// Keep the original multiplication order and Float32 output writes.
export function updateLongShellPoints(f,t){
 const count=f.trailCount,cache=f.longMotionCache??=Array.from({length:3},()=>new Float64Array(count*5));
 const age=t*7.4/f.spec.life;
 for(let layer=0;layer<3;layer++){
  const outer=layer===0,fine=layer===2,history=Math.min(Math.max(0,age),outer?1.12:1.35),c=cache[layer];
  for(let j=0;j<count;j++){const lag=history*j/(count-1),at=Math.max(0,age-lag),k=j*5;c[k]=(1-Math.exp(-(outer?.60:fine?.65:.93)*at))+(outer?.026:.020)*at;c[k+1]=at;c[k+2]=at*at;c[k+3]=outer?(j===0?1:Math.max(0,1-lag/.36)):0;c[k+4]=lag;}
 }
 let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;const outFrame=f.longFrame??={},gold=f.starColors[f.n-1],blue=f.color;
 for(let i=0;i<f.n;i++){
  const star=f.longStars[i],v=prepareLongStarPoint(star,f.r,t,count,f.spec.life,outFrame),c=cache[star.layer];
  for(let j=0;j<count;j++){
   const k=j*5,index=(i*count+j)*3,at=c[k+1],travel=v.radius*star.speed*c[k],drop=v.radius*(v.outer?.0035:.0025)*at*at;
   const x=f.x+star.direction[0]*travel,y=f.y+(star.direction[1]*travel+v.radius*.024*at-drop),z=f.z+star.direction[2]*travel,mix=c[k+3];
   let b=v.lit*v.profile.weight[j]*(v.outer?(j===0?1.12*v.fade:.58*v.fade*(.30+.70*v.wake)):(j===0?.92:.42)*v.fade*v.fineGlow*(.64+.36*v.flicker));if(j===0&&f.size>=3)b*=1.25;
   f.positions[index]=x;f.positions[index+1]=Math.max(.018,y);f.positions[index+2]=z;
   f.colors[index]=(gold.r+(blue.r-gold.r)*mix)*b;f.colors[index+1]=(gold.g+(blue.g-gold.g)*mix)*b;f.colors[index+2]=(gold.b+(blue.b-gold.b)*mix)*b;
   if(j===0&&b>0){const py=f.positions[index+1];light+=b;lightX+=x*b;lightY+=py*b;lightZ+=z*b;lightR2+=(x*x+py*py+z*z)*b;if(f.layerLight){f.layerLight[f.starLayers[i]]+=b;lightShellR2+=f.shells[i]*f.shells[i]*b;}}
  }
 }
 const out=f.longLight??={};Object.assign(out,{light,lightX,lightY,lightZ,lightR2,lightShellR2});return out;
}
