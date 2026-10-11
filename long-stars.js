// A single break: sparse coloured heads travel beyond a dense gold flower.
// Reference: Ishii's 46 frames, break ~0.45s, faint gold still visible at 7.45s.
// All variation is sampled at launch. Tails follow each star's own earlier path.
export const LONG_STAR_PROFILE=Object.freeze({life:4.0,life5:2.8,coreScale:.85,trails:40,headColor:0x46c9ff,goldColor:0xffca79});
export const LONG_STAR_PALETTES=Object.freeze([
 {id:'original',label:'水色 × 金のキラ',colors:[LONG_STAR_PROFILE.headColor,LONG_STAR_PROFILE.goldColor]},
 {id:'long-blue',label:'青 × 金のキラ',colors:[0x3978ff,LONG_STAR_PROFILE.goldColor]},
 {id:'long-pink',label:'ピンク × 金のキラ',colors:[0xff73c8,LONG_STAR_PROFILE.goldColor]},
 {id:'long-purple',label:'紫 × 金のキラ',colors:[0xb67bff,LONG_STAR_PROFILE.goldColor]},
 {id:'long-green',label:'緑 × 金のキラ',colors:[0x67f591,LONG_STAR_PROFILE.goldColor]},
 {id:'long-gold',label:'金の大星 × 金のキラ',colors:[LONG_STAR_PROFILE.goldColor,LONG_STAR_PROFILE.goldColor]},
 {id:'long-white',label:'白 × 金のキラ',colors:[0xf0f6ff,LONG_STAR_PROFILE.goldColor]}
].map(p=>Object.freeze({...p,colors:Object.freeze(p.colors)})));
export function longStarLife(size){return size===5?LONG_STAR_PROFILE.life5:LONG_STAR_PROFILE.life;}
export function longStarCounts(size){return {large:size===10?32:24,gold:size===10?300:204};}
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function sphere(count){return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*2.399963229728653,r=Math.sqrt(1-y*y);return [r*Math.cos(a),y,r*Math.sin(a)];});}
function smooth(a,b,t){const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);}
export function createLongStars(size,seed){
 const random=randomFrom(seed),counts=longStarCounts(size),stars=[];
 const turn=random()*Math.PI*2,tilt=(random()-.5)*.75;
 const rotate=([x,y,z])=>{const a=x*Math.cos(turn)-z*Math.sin(turn),b=x*Math.sin(turn)+z*Math.cos(turn);return [a,y*Math.cos(tilt)-b*Math.sin(tilt),y*Math.sin(tilt)+b*Math.cos(tilt)];};
 sphere(counts.large).forEach((v,ray)=>{
  const direction=rotate(v),speed=.95+random()*.12,phase=random()*Math.PI*2,headLife=2.95+random()*.70;
  stars.push({direction,speed,phase,headLife,layer:0,ray});
 });
 sphere(counts.gold).forEach((v,ray)=>{const fine=ray%3===0;stars.push({direction:rotate(v),speed:fine?.84+random()*.13:.46+random()*.14,phase:random()*Math.PI*2,headLife:0,layer:fine?2:1,ray});});
 return stars;
}
// Preserve the accepted flight paths and duration; coloured heads fade with gold.
const REFERENCE_LIFE=7.4;
export function prepareLongStarPoint(star,radius,elapsed,trails=LONG_STAR_PROFILE.trails,life=LONG_STAR_PROFILE.life,out={}){
 const age=elapsed*REFERENCE_LIFE/life,outer=star.layer===0,fine=star.layer===2;
 radius*=outer?1:LONG_STAR_PROFILE.coreScale;
 let profile=star.longTrailProfile;
 if(!profile||profile.trails!==trails){profile={trails,weight:Float64Array.from({length:trails},(_,j)=>Math.pow(1-j/trails,1.35))};star.longTrailProfile=profile;}
 Object.assign(out,{age,outer,fine,radius,history:Math.min(Math.max(0,age),outer?1.12:1.35),fade:1-smooth(outer?4.0:3.5,REFERENCE_LIFE,age),lit:Math.min(1,Math.max(0,age)/.085),wake:outer?1-smooth(star.headLife-.55,star.headLife,age):0,flicker:.38+.62*Math.pow(Math.max(0,Math.sin(age*(12.5+star.speed*3)+star.phase)),2),fineGlow:fine?.22+.52*smooth(1.3,3.5,age):1,profile});return out;
}
export function longStarPoint(star,radius,elapsed,trail,trails=LONG_STAR_PROFILE.trails,life=LONG_STAR_PROFILE.life,out={},prepared=null){
 const frame=prepared??prepareLongStarPoint(star,radius,elapsed,trails,life);
 const {age,outer,fine,history,fade,lit,wake,flicker,fineGlow,profile}=frame;radius=frame.radius;
 const lag=history*trail/(trails-1),t=Math.max(0,age-lag);
 const travel=radius*star.speed*((1-Math.exp(-(outer?.60:fine?.65:.93)*t))+(outer?.026:.020)*t);
 const drop=radius*(outer?.0035:.0025)*t*t;
 const x=star.direction[0]*travel,y=star.direction[1]*travel+radius*.024*t-drop,z=star.direction[2]*travel;
 const head=outer?fade:0,weight=profile.weight[trail];
 const blue=outer?(trail===0?1:Math.max(0,1-lag/.36)):0;
 const brightness=lit*weight*(outer?(trail===0?1.12*head:.58*fade*(.30+.70*wake)):(trail===0?.92:.42)*fade*fineGlow*(.64+.36*flicker));
 out.x=x;out.y=y;out.z=z;out.brightness=brightness;out.blue=blue;return out;
}
