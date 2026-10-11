// One break, grouped gold strands and a hollow, drooping late flower.
// Reference 61 stills: 0.333–0.500s break; faint target remains at 9.5s.
// Later flowers along the bottom are separate shots, excluded here.
export const SPARKLE_PROFILE=Object.freeze({life:4.0,life5:2.8,life20:4.6,trails:48,coreScale:.85});
export const sparkleLife=size=>size===5?SPARKLE_PROFILE.life5:size===20?SPARKLE_PROFILE.life20:SPARKLE_PROFILE.life;
export function sparkleCounts(size){const large=size===20?24:size===10?20:16;return {large,companions:large*4,core:size===20?340:size===10?260:180};}
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function sphere(count){return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*2.399963229728653,r=Math.sqrt(1-y*y);return [r*Math.cos(a),y,r*Math.sin(a)];});}
const normalize=v=>{const r=Math.hypot(...v);return v.map(x=>x/r);};
function smooth(a,b,t){const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);}
export function createSparkleStars(size,seed){
 const random=randomFrom(seed),counts=sparkleCounts(size),heads=[],companions=[],core=[];
 const turn=random()*Math.PI*2,tilt=(random()-.5)*.75;
 const rotate=([x,y,z])=>{const a=x*Math.cos(turn)-z*Math.sin(turn),b=x*Math.sin(turn)+z*Math.cos(turn);return [a,y*Math.cos(tilt)-b*Math.sin(tilt),y*Math.sin(tilt)+b*Math.cos(tilt)];};
 sphere(counts.large).forEach((v,ray)=>{
  const direction=rotate(v),speed=.94+random()*.13,phase=random()*Math.PI*2;
  heads.push({direction,speed,phase,ray,layer:0});
  // Five coloured parent stars share one launch direction, with a narrow fan.
  // All strands are parent stars, not colourless decorative satellites.
  const tangent=normalize(Math.abs(direction[1])<.9?[-direction[2],0,direction[0]]:[1,0,0]);
  const binormal=normalize([direction[1]*tangent[2]-direction[2]*tangent[1],direction[2]*tangent[0]-direction[0]*tangent[2],direction[0]*tangent[1]-direction[1]*tangent[0]]);
  const roll=random()*Math.PI*2,fan=tangent.map((d,i)=>d*Math.cos(roll)+binormal[i]*Math.sin(roll));
  const spacing=.020+random()*.007;
  for(const offset of [-2,-1,1,2]){
   const spread=offset*spacing;
   companions.push({direction:normalize(direction.map((d,i)=>d+spread*fan[i])),speed:speed*(.955+random()*.090),phase:phase+offset*.45,ray,layer:1});
  }
 });
 // Keep the previous fine-core random stream independent of the new bundles.
 const coreRandom=randomFrom(seed),previousBundles=size===20?40:size===10?32:24;
 for(let i=0;i<2+6*previousBundles;i++)coreRandom();
 sphere(counts.core).forEach((v,ray)=>core.push({direction:rotate(v),speed:ray%3===0?.78+coreRandom()*.12:.43+coreRandom()*.15,phase:coreRandom()*Math.PI*2,ray,layer:ray%3===0?3:2}));
 return [...heads,...companions,...core];
}
// 9.5 is an observed reference span, not a measured extinction time.
const REFERENCE_SPAN=9.5;
export function sparklePoint(star,radius,elapsed,trail,trails=SPARKLE_PROFILE.trails,life=SPARKLE_PROFILE.life){
 const age=Math.max(0,elapsed)*REFERENCE_SPAN/life,outer=star.layer<2,head=outer;
 radius*=outer?1:SPARKLE_PROFILE.coreScale;
 const history=Math.min(age,outer?2.75:1.05),lag=history*Math.pow(trail/(trails-1),outer?1+.10*Math.sin(star.phase):1),t=Math.max(0,age-lag);
 const travel=radius*star.speed*((1-Math.exp(-(outer?.64:.95)*t))+(outer?.018:.012)*t);
 const x=star.direction[0]*travel,y=star.direction[1]*travel+radius*.030*t-radius*(outer?.009:.005)*t*t,z=star.direction[2]*travel;
 const fade=1-smooth(outer?5.0:2.7,outer?REFERENCE_SPAN:5.0,age),lit=Math.min(1,age/.11),weight=Math.pow(1-trail/trails,1.05);
 // Leave readable continuous strands with unsynchronised points of stronger light.
 const pulse=Math.pow(Math.max(0,Math.sin(age*(10.7+star.speed*2)+star.phase-trail*.79)),6);
 const sparkle=.46+.54*pulse;
 const brightness=lit*fade*weight*(outer?(trail===0?1.25:.85*(.75+.25*pulse)):(trail===0?.88:.30)*(.55+.45*sparkle));
 const blue=head?(trail===0?1:Math.max(0,1-lag/.28)):0;
 return {x,y,z,brightness,blue};
}
