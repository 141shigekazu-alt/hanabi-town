// Keep the petals on their original radial paths; do not hide gravity with a cut.
export const SUNFLOWER_PROFILE=Object.freeze({life:4.3,fadeStart:1.65,tailHistory:1.1});
export const PETAL_MOTION_PROFILE=Object.freeze({life:2.4,fadeStart:1.1,tailHistory:.65,expansionRate:1.8});
export function sunflowerPoint(direction,radius,shell,age,trail,trailCount,life=SUNFLOWER_PROFILE.life,star=null,variation=null){return radialPoint(direction,radius,shell,age,trail,trailCount,life,1.25,SUNFLOWER_PROFILE,star,variation);}
export function petalPoint(direction,radius,shell,age,trail,trailCount,life=PETAL_MOTION_PROFILE.life,star=null,variation=null){return radialPoint(direction,radius,shell,age,trail,trailCount,life,PETAL_MOTION_PROFILE.expansionRate,PETAL_MOTION_PROFILE,star,variation);}
function radialPoint(direction,radius,shell,age,trail,trailCount,life,expansionRate,profile=SUNFLOWER_PROFILE,star=null,variation=null){
 const elapsed=Math.max(0,age-(star?.delay??0));
 const history=Math.min(elapsed,shell<.75?.20:profile.tailHistory);
 const at=Math.max(0,elapsed-history*trail/Math.max(1,trailCount-1));
 const travel=radius*shell*(1-Math.exp(-expansionRate*(star?.rate??1)*(variation?.rate??1)*at));
 const tail=Math.pow(1-trail/trailCount,1.5);
 const fadeStart=Math.min(profile.fadeStart,life*(profile===SUNFLOWER_PROFILE?.45:.49));
 const starLife=life*(star?.fade??1)*(variation?.fade??1),fadeAt=Math.min(fadeStart,starLife*.65);
 const fadeAge=Math.max(0,age-fadeAt)/(starLife-fadeAt);
 const fade=Math.pow(Math.max(0,1-fadeAge),1.65);
 return {x:direction.x*travel+(variation?.windX??0)*at*at,y:direction.y*travel-(variation&&shell>.75?.004*at*at:0),z:direction.z*travel+(variation?.windZ??0)*at*at,brightness:(trail===0?2:.9)*tail*fade*(star?Math.min(1,elapsed/.025):1)};
}

// Reference-photo variant: a shared downward acceleration bends the long gold tails.
export function goldPetalPoint(direction,radius,shell,age,trail,trailCount,life=PETAL_MOTION_PROFILE.life,star=null,variation=null){
 const point=petalPoint(direction,radius,shell,age,trail,trailCount,life,star,variation);
 if(shell>.75){const elapsed=Math.max(0,age-(star?.delay??0)),history=Math.min(elapsed,PETAL_MOTION_PROFILE.tailHistory),at=Math.max(0,elapsed-history*trail/Math.max(1,trailCount-1));point.y+=.030*at-.025*at*at;}
 return point;
}
