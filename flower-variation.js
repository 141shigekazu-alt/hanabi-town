// Independent seeded streams: keep the same physical individuality when seeking.
export function variationRandom(seed,salt=0){
 let n=(seed^salt)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);n=(n^(n>>>16))>>>0;
 return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
}
export const isFlowerShell=kind=>['kiku','sunflower','petalflower','goldflower'].includes(kind);
export function flowerFlight(size,seed,stemmed=false){
 const random=variationRandom(seed,0x71f118),signed=()=>random()*2-1;
 const heightOffset=signed()*(size===3?.048:size===5?.060:.070);
 return {heightOffset,dx:signed()*(stemmed?.014:.055),dz:signed()*(stemmed?.010:.040),ignitionDelay:.01+random()*.09,ascentOffset:heightOffset*.85+signed()*.025,radiusScale:.96+random()*.08};
}
export function flowerMotion(seed){
 const random=variationRandom(seed,0x5a270d);
 return {rate:.96+random()*.08,fade:.90+random()*.10,windX:(random()-.5)*.008,windZ:(random()-.5)*.008};
}

// Several small deviations are more common than either extreme.
export const centeredVariation=random=>(random()+random()+random())/3-.5;
export function flowerRayVariations(seed,count){
 const random=variationRandom(seed,0x391a50),phase=Array.from({length:4},()=>random()*Math.PI*2);
 // Keep a few-ray relationship, but let each petal visibly differ again.
 const raw=Array.from({length:count},()=> (random()+random())/2-.5);
 const rough=raw.map((v,i)=>.16*raw[(i+count-1)%count]+.68*v+.16*raw[(i+1)%count]);
 return Array.from({length:count},(_,i)=>{
  const local=rough[i];
  const a=i*Math.PI*2/count,u=Math.sin(a+phase[0]),v=Math.sin(2*a+phase[1]),w=Math.sin(a+phase[2]);
  return {angle:.006*u+.003*v+.024*local+.004*centeredVariation(random),radius:1+.024*u+.014*v+.15*local,depth:.010*w+.016*local+.006*centeredVariation(random),rate:1+.014*u+.008*v+.045*local+.012*centeredVariation(random),delay:.020+.008*w+.018*local+.008*centeredVariation(random),fade:Math.min(1,.965+.018*Math.sin(a+phase[3])+.010*v+.055*centeredVariation(random))};
 });
}
// The original size-specific ellipsoid remains; its fine ripple becomes a
// broad, smooth lobe for the planar flower instead of separate star spikes.
export function deformFlowerVector(vector,shape,strength=1){
 if(shape.level===0)return vector;
 const {x,y,z}=vector,length=Math.hypot(x,y,z);if(!length)return vector;
 const a=shape.axis,b=shape.lobe,along=x*a.x+y*a.y+z*a.z,lobe=(x*b.x+y*b.y+z*b.z)/length;
 const axial=1+shape.ellipse*strength,cross=1/Math.sqrt(axial);
 const gain=1+strength*(shape.bulge*.55*lobe+shape.star*.20*Math.sin(shape.phase)*along/length);
 vector.x=(x*cross+a.x*along*(axial-cross))*gain;
 vector.y=(y*cross+a.y*along*(axial-cross))*gain;
 vector.z=(z*cross+a.z*along*(axial-cross))*gain;
 return vector;
}
