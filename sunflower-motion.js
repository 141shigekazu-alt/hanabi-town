// Keep the petals on their original radial paths; do not hide gravity with a cut.
export const SUNFLOWER_PROFILE=Object.freeze({life:4.3,fadeStart:1.65,tailHistory:1.1});
export const SPIRAL_PROFILE=Object.freeze({life:4.8,fadeStart:1.65,tailHistory:1.1});
export function sunflowerPoint(direction,radius,shell,age,trail,trailCount,life=SUNFLOWER_PROFILE.life){return radialPoint(direction,radius,shell,age,trail,trailCount,life,1.25);}
export function spiralPoint(direction,radius,shell,age,trail,trailCount,life=SPIRAL_PROFILE.life){return radialPoint(direction,radius,shell,age,trail,trailCount,life,1.9);}
function radialPoint(direction,radius,shell,age,trail,trailCount,life,expansionRate){
 const history=Math.min(Math.max(0,age),shell<.75?.20:SUNFLOWER_PROFILE.tailHistory);
 const at=Math.max(0,age-history*trail/Math.max(1,trailCount-1));
 const travel=radius*shell*(1-Math.exp(-expansionRate*at));
 const tail=Math.pow(1-trail/trailCount,1.5);
 const fadeStart=Math.min(SUNFLOWER_PROFILE.fadeStart,life*.45);
 const fadeAge=Math.max(0,age-fadeStart)/(life-fadeStart);
 const fade=Math.pow(Math.max(0,1-fadeAge),1.65);
 return {x:direction.x*travel,y:direction.y*travel,z:direction.z*travel,brightness:(trail===0?2:.9)*tail*fade};
}
