// A low aerial tuft. Stars keep their outward momentum and bend under gravity;
// cooling trail particles vanish from the root towards the drooping tips.
// The size is an artistic 2-go approximation, not a measurement of the source.
export const EAR_PROFILE={stars:28,trails:48,burn:5.6,life:6.75,pointSize:.013,lineWidth:1.3};
function stream(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
export function createEarStars(seed){
 const random=stream(seed),yaw=(random()-.5)*1.1,lean=(random()<.5?-1:1)*(.10+random()*.16),reach=.90+random()*.25;
 return Array.from({length:EAR_PROFILE.stars},(_,i)=>{
  const side=(i+.5)/EAR_PROFILE.stars*2-1;
  return {vx:lean+side*.19+(random()-.5)*.04,vy:reach*(1.08+random()*.17),yaw,depth:(random()-.5)*.07,glow:.85+random()*.25};
 });
}
// Sample each row once. Position variation is separate from the town/program RNG.
export function createEarRow(seed,count=7,spacing=.28){
 const random=stream((seed^0x51ea70b3)>>>0);
 return Array.from({length:count},(_,i)=>({x:(i-(count-1)/2)*spacing+(random()-.5)*.07,z:(random()-.5)*.05,heightOffset:(random()-.5)*.07,earSeed:(seed+i*313)>>>0}));
}
function trajectory(star,radius,t){
 const drag=.30,travel=-Math.expm1(-drag*t)/drag,settling=Math.max(0,t-2.8);
 // Keep the opening and horizontal momentum; deepen only the descending arc
 // after the rise. No inward return, and no translation of the root.
 return {side:radius*star.vx*.68*travel,y:radius*(star.vy*.70*travel-.2214285714*(t-travel)/drag-.045*settling*settling),velocity:radius*star.vx*.68*Math.exp(-drag*t),travel};
}
export function earPoint(star,radius,age,trail){
 const head=trail===0,birth=head?age:EAR_PROFILE.burn*(1-(trail-1)/(EAR_PROFILE.trails-2));
 const t=Math.min(age,birth),elapsed=Math.max(0,age-t),p=trajectory(star,radius,t);
 const outwardDrift=head?0:p.velocity*elapsed*.06*(birth/EAR_PROFILE.burn);
 const side=p.side+outwardDrift;
 const fall=head?0:radius*.025*elapsed*elapsed*(birth/EAR_PROFILE.burn);
 const fadeStart=.8+birth*.55,fadeEnd=2.2+(EAR_PROFILE.life-2.2)*Math.sqrt(birth/EAR_PROFILE.burn);
 const remaining=Math.max(0,Math.min(1,(fadeEnd-age)/(fadeEnd-fadeStart)));
 const fade=remaining*remaining*(3-2*remaining);
 const headRemaining=Math.max(0,Math.min(1,(6.45-age)/1.75));
 const brightness=age>=EAR_PROFILE.life?0:head?1.35*star.glow*headRemaining*headRemaining*(3-2*headRemaining):
  (age>=birth?.72*star.glow*(.45+.55*birth/EAR_PROFILE.burn)*fade:0);
 // Old sparks cool first. The birth-zero root stays at the original break
 // until it goes dark; later sparks retain their direction and gently fall.
 return {x:side*Math.cos(star.yaw),y:p.y-fall,z:side*Math.sin(star.yaw)+radius*star.depth*p.travel,brightness};
}

// Separate ignition stream: seven close reports, rather than one fused sound.
export function createEarTiming(seed,count=7){
 const random=stream((seed^0x6ea25d91)>>>0),order=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return order.map(slot=>({launchOffset:Math.max(0,slot*.032+(random()-.5)*.008),ignitionDelay:.012+random()*.024}));
}
