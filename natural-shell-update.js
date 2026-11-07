const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
// The common natural shell path has no pattern/flower branches per ember.
// Keep every position, color, size and reflected-light sample unchanged.
export function updateNaturalShellPoints(f,t){
 const result=f.naturalLight??=( {} );
 let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;
 const count=f.trailCount,positions=f.positions,colors=f.colors,sizes=f.g.attributes.naturalSize.array;
 const silver=f.kind==='silver',drag=silver?.90:f.size===20?.7:1.9,gravity=f.spec.gravity,rise=silver?.065:.085;
 const flash=silver&&t<.08?1+1.6*(1-t/.08):1;

 const headDecay=Math.exp(-drag*t);
 for(let i=0;i<f.n;i++){
  const star=f.naturalTails[i],birth=star.birth,dir=f.directions[i],col=f.starColors[i];
  const radius=f.r*f.shells[i]*(silver?f.silverVariation[i]:1);
  const emit=Math.min(t,star.end),burnNow=smooth(star.end*.22,star.end,t),head=1-smooth(star.end-.30,star.end,t);
  const burnCache=star.burnCache??=new Float64Array(count),burnAt=star.burnCacheAt??=new Float64Array(count).fill(NaN);
  for(let j=0;j<count;j++){
   let at,emberAge,warm,burn,glow;
   if(j===0){at=t;emberAge=0;warm=0;burn=burnNow;glow=2*star.glow*head*(1-.35*burn);}
   else{
    const phase=star.phase[j],previous=burnAt[j];
    // Near a cycle boundary use the original calculation, including its rounding.
    const reuse=emit>previous+1e-10 && emit<previous+star.period-1e-10;
    const birthTime=reuse?previous:phase+Math.floor((emit-phase)/star.period)*star.period,age=t-birthTime,life=star.emberLife[j];
    at=Math.max(0,birthTime);emberAge=Math.max(0,age);warm=Math.min(1,Math.max(0,age/life));
    if(burnAt[j]!==birthTime){burnCache[j]=smooth(star.end*.22,star.end,birthTime);burnAt[j]=birthTime;}
    burn=burnCache[j];glow=birthTime<0||age<0||age>=life?0:Math.pow(1-warm,1.6)*star.weights[j]*star.glow*1.65*(1-.22*burn);
   }
   const k=j*6,index=(i*count+j)*3;
   if(glow===0){
    colors[index]=0;colors[index+1]=0;colors[index+2]=0;
    continue;
   }
   if(j===0||star.birthAt[j]!==at){
    const decay=j===0?headDecay:Math.exp(-drag*at),travel=radius*(1-decay),remaining=decay*radius*drag;
    birth[k]=f.x+dir.x*travel;birth[k+1]=f.y+dir.y*travel+rise*at-gravity*at*at;birth[k+2]=f.z+dir.z*travel;
    birth[k+3]=dir.x*remaining*.04+star.dx[j];birth[k+4]=dir.y*remaining*.04+star.dy[j];birth[k+5]=dir.z*remaining*.04+star.dz[j];star.birthAt[j]=at;
   }
   const x=birth[k]+birth[k+3]*emberAge,y=birth[k+1]+birth[k+4]*emberAge-.025*emberAge*emberAge,z=birth[k+2]+birth[k+5]*emberAge;
   let brightness=glow*(1-Math.max(0,Math.min(1,(.045-y)/.027)));
   if(silver&&t<.08)brightness*=flash;
   if(j===0&&f.size>=3)brightness*=1.25;
   const consumed=burn,cooled=warm;
   sizes[i*count+j]=j===0?star.sizes[0]*(1-.82*consumed):star.sizes[j]*.8*(1-.60*cooled*cooled)*(1-.35*consumed);
   positions[index]=x;positions[index+1]=Math.max(.018,y);positions[index+2]=z;
   if(j===0&&brightness>0){const py=positions[index+1];light+=brightness;lightX+=x*brightness;lightY+=py*brightness;lightZ+=z*brightness;lightR2+=(x*x+py*py+z*z)*brightness;if(f.layerLight){f.layerLight[f.starLayers[i]]+=brightness;lightShellR2+=f.shells[i]*f.shells[i]*brightness;}}
   colors[index]=col.r*brightness;colors[index+1]=col.g*brightness*(1-.25*warm);colors[index+2]=col.b*brightness*(1-.38*warm);
  }
 }
 Object.assign(result,{light,lightX,lightY,lightZ,lightR2,lightShellR2});return result;
}
