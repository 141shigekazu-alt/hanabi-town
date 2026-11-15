const CANDY_DISSOLVE_TRIAL=true;
export const CANDY_PAIR_IDS=['candy-pair-aqua-lime','candy-pair-pink-aqua','candy-pair-purple-lemon'];
export const isCandyPairPalette=id=>CANDY_PAIR_IDS.includes(id);
export const CANDY_SINGLE_STAR=true;
export const CANDY_BIG_STAR_TRAILS=24;
export function candyBigStarPointCount(size,palette=null){return ((size===10?32:24)*(isCandyPairPalette(palette)?2:1)*3+(size===10?180:136))*CANDY_BIG_STAR_TRAILS;}
// One break with a sparse set of large travelling stars, not successive bursts.
// Every tail samples that same star's previous flight; randomness is fixed once.
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function sphere(count){return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*2.399963229728653,r=Math.sqrt(1-y*y);return [r*Math.cos(a),y,r*Math.sin(a)];});}
export function createCandyBigStars(size,seed,paired=false){
 const random=randomFrom(seed),large=size===10?32:24,core=size===10?180:136,stars=[];
 const turn=random()*Math.PI*2,tilt=(random()-.5)*.45;
 const rotate=([x,y,z])=>{const a=x*Math.cos(turn)-z*Math.sin(turn),b=x*Math.sin(turn)+z*Math.cos(turn);return [a,y*Math.cos(tilt)-b*Math.sin(tilt),y*Math.sin(tilt)+b*Math.cos(tilt)];};
 sphere(large).forEach((v,i)=>{
  const direction=rotate(v),speed=.94+random()*.12,phase=random()*Math.PI*2;
  // Three neighbouring samples give each large head a solid, luminous width.
  for(let pair=0;pair<(paired?2:1);pair++)for(let strand=-1;strand<=1;strand++){
   const offset=CANDY_SINGLE_STAR?0:strand,angle=paired?(pair===0?-.025:.025):0,c=Math.cos(angle),s=Math.sin(angle);
   stars.push({direction:[direction[0]*c-direction[2]*s+offset*.008,direction[1],direction[0]*s+direction[2]*c-offset*.006],radius:speed*(paired?(pair===0?.985:1.015):1),phase,layer:0,ray:i,...(paired?{pair}:{}),...(CANDY_SINGLE_STAR?{segment:strand+1}:{})});
  }
 });
 sphere(core).forEach(v=>stars.push({direction:rotate(v),radius:.10+random()*.19,phase:random()*Math.PI*2,layer:1,ray:-1}));
 return stars;
}
export const CANDY_ENDING_TRIAL=true;
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function candyBigStarPoint(star,radius,age,trail,trails=CANDY_BIG_STAR_TRAILS){
 if(CANDY_SINGLE_STAR&&star.layer===0){trail+=(star.segment??0)*trails;trails*=3;}
 const late=CANDY_ENDING_TRIAL&&star.layer===0?smooth((age-1.4)/1.7):0;
 const history=Math.min(Math.max(age,0),star.layer===0?.64*(1-late)+.22*late:.27);
 const t=Math.max(0,age-history*trail/(trails-1));
 const travel=radius*star.radius*(1-Math.exp(-(star.layer===0?1.48:3.1)*t));
 const gravity=star.layer===0?.050:.026;
 const x=star.direction[0]*travel,y=star.direction[1]*travel+.045*t-gravity*t*t,z=star.direction[2]*travel;
 const end=star.layer===0?3.7-.28*(.5+.5*Math.sin(star.phase))*late:2.5;
 const alive=Math.max(0,Math.min(1,(end-age)/.9));
 const twinkle=star.layer===0?1:.55+.45*Math.pow(Math.max(0,Math.sin(age*18+star.phase)),3);
 const sample=CANDY_SINGLE_STAR&&star.layer===0?trail*23/(trails-1):trail;
 const brightness=(trail===0?(star.layer===0?3.0:2.0):(star.layer===0?.95:.32))*Math.pow(CANDY_SINGLE_STAR&&star.layer===0?1-sample/24:1-trail/trails,1.2)*alive*twinkle*Math.min(1,Math.max(0,age)/.07);
 const q=trail/(trails-1),grain=.5+.5*Math.sin(sample*2.399963+star.phase*3.7);
 const cooling=late*q,size=trail===0?1-.25*late*smooth((age-2.5)/1.0):1-.62*cooling;
 const soften=trail===0?1:1-.55*cooling;
 const sparks=trail===0?1:1-late*smooth((q-.20)/.55)*(.72*(1-grain));
 const width=CANDY_SINGLE_STAR&&star.layer===0?(trail===0?Math.sqrt(3):Math.sqrt(3*23/(trails-1))):1;
 const density=CANDY_SINGLE_STAR&&star.layer===1&&trail>0?23/(trails-1):1;
 const loosen=CANDY_DISSOLVE_TRIAL&&star.layer===0&&trail>0?smooth((age-1.8)/1.3)*smooth((q-.12)/.75):0;
 const ember=smooth((grain-(.10+.60*loosen))/.22),breakup=1-loosen+loosen*ember;
 const drift=radius*.003*loosen;
 return {x:x+drift*Math.sin(star.phase+sample*1.7),y:y-radius*.008*loosen*q*q,z:z+drift*Math.cos(star.phase+sample*1.3),brightness:brightness*soften*sparks*density*breakup,size:size*width*(1-.35*loosen)};
}
