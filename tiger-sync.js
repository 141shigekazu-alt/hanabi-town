// A shared cue clock keeps the upper rays and lower star fans synchronized.
export function synchronizedTigerShots(seed=417,options={}){
 let s=seed>>>0;const random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 const large=[],small=[],centers=options.single?[0]:[-1.25,0,1.25];
 for(const x of centers)for(let i=0;i<11;i++){
  const angle=(i-5)*.175,at=i*.065,shotSeed=Math.floor(random()*0xffffffff);
  large.push({x,y:.035,z:-.72,angle,height:1.08*Math.cos(angle),at,style:'gold',seed:shotSeed,motion:{burn:2.15,drag:.16,gravity:.14,afterglow:1.2,tailSamples:120,tailGain:2.0,headGain:1.3}});
  small.push({x,y:.035,z:-.68,angles:[angle],height:.43*Math.cos(angle),at,style:options.smallStyle??'sync-bluegreen',seed:shotSeed^0x51f301,small:true,basicTiger:true,earlyBurn:true,coloredTip:true,count:32,spreadScale:options.childCompact?.50:1});
 }
 return {large,small};
}
