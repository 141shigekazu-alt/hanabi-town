// One break with a sparse set of large travelling stars, not successive bursts.
// Every tail samples that same star's previous flight; randomness is fixed once.
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function sphere(count){return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*2.399963229728653,r=Math.sqrt(1-y*y);return [r*Math.cos(a),y,r*Math.sin(a)];});}
export function createCandyBigStars(size,seed){
 const random=randomFrom(seed),large=size===10?32:24,core=size===10?180:136,stars=[];
 const turn=random()*Math.PI*2,tilt=(random()-.5)*.45;
 const rotate=([x,y,z])=>{const a=x*Math.cos(turn)-z*Math.sin(turn),b=x*Math.sin(turn)+z*Math.cos(turn);return [a,y*Math.cos(tilt)-b*Math.sin(tilt),y*Math.sin(tilt)+b*Math.cos(tilt)];};
 sphere(large).forEach((v,i)=>{
  const direction=rotate(v),speed=.94+random()*.12,phase=random()*Math.PI*2;
  // Three neighbouring samples give each large head a solid, luminous width.
  for(let strand=-1;strand<=1;strand++)stars.push({direction:[direction[0]+strand*.008,direction[1],direction[2]-strand*.006],radius:speed,phase,layer:0,ray:i});
 });
 sphere(core).forEach(v=>stars.push({direction:rotate(v),radius:.10+random()*.19,phase:random()*Math.PI*2,layer:1,ray:-1}));
 return stars;
}
export function candyBigStarPoint(star,radius,age,trail,trails=24){
 const history=Math.min(Math.max(age,0),star.layer===0?.64:.27);
 const t=Math.max(0,age-history*trail/(trails-1));
 const travel=radius*star.radius*(1-Math.exp(-(star.layer===0?1.48:3.1)*t));
 const gravity=star.layer===0?.050:.026;
 const x=star.direction[0]*travel,y=star.direction[1]*travel+.045*t-gravity*t*t,z=star.direction[2]*travel;
 const alive=Math.max(0,Math.min(1,((star.layer===0?3.7:2.5)-age)/.9));
 const twinkle=star.layer===0?1:.55+.45*Math.pow(Math.max(0,Math.sin(age*18+star.phase)),3);
 const brightness=(trail===0?(star.layer===0?5.8:2.0):(star.layer===0?1.7:.32))*Math.pow(1-trail/trails,1.2)*alive*twinkle*Math.min(1,Math.max(0,age)/.07);
 return {x,y,z,brightness};
}
