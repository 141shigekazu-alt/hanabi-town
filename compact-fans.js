// Two distinct root layouts, sharing the accepted rising-only compact tiger.
export function compactFanShots(id,style='gold',seed=417,options={}){
 let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296),shots=[];
 const add=(x,angle,i)=>{const at=id==='small-wide-fan-delayed'?(options.ignition==='left'?i*.16:(10-i)*.16):options.ignition==='left'?i*.065:options.ignition==='right'?(10-i)*.065:0;
  shots.push({x,y:.035,z:-.68,angles:[angle],count:32,height:.56*Math.cos(angle),at,style,seed:Math.floor(random()*0xffffffff),small:true,basicTiger:true,earlyBurn:true,spreadScale:.50,coloredTip:true,tipColor:options.tipColor??0x25ff52});};
 if(id==='small-wide-fan'||id==='small-wide-fan-delayed')for(let i=0;i<11;i++)add((i-5)*.32,(i-5)*.12,i);
 if(id==='small-triple-fan')for(const center of [-1.3,0,1.3])for(let i=0;i<11;i++)add(center,(i-5)*.18,i);
 return shots;
}
