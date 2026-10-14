import {variationRandom,flowerFlight} from './flower-variation.js';
import {FLOWER_COLORS,petalGeometry} from './flower-scenes.js';
import {TYPES,SIZES,EAR_PROFILE,paletteOptions} from './fireworks.js';
import {longStarCounts,longStarLife} from './long-stars.js';
import {earProgrammeFits} from './ear-capacity.js';
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const PREFERRED={water:{flower:['flower-blue','flower-purple'],longstar:['original','long-blue','long-purple'],core:['blue-gold','purple-green']},sunset:{flower:['flower-red','flower-yellow','flower-pink'],longstar:['long-gold','long-pink','long-white'],core:['original','gold-pink','red-white']},dawn:{flower:['flower-purple','flower-pink','flower-yellow'],longstar:['long-purple','long-pink','long-gold'],core:['purple-green','gold-pink','original']},summer:{flower:FLOWER_COLORS.map(c=>c.id),longstar:['original','long-blue','long-green','long-pink','long-gold'],core:['blue-gold','pink-blue','green-red','gold-pink']},harvest:{flower:['flower-yellow','flower-red','flower-pink'],longstar:['long-gold','long-pink','long-white'],core:['gold-pink','original','red-white']}};
export function landscapeDirection(scene,time){
 if(scene.theme==='paddy'){let stage=scene.stages[0];for(const s of scene.stages)if(s.opening<=time)stage=s;return stage.phase;}
 return time>=scene.firstOpening+(scene.end-scene.firstOpening)*.5?'sunset':'water';
}
// Direction is a weighted preference. Every supported colour stays available.
// On an automatic upper programme, a quarter of ordinary shells keep their
// existing colours; chorus/finale/feature colours are protected by the caller.
export function landscapePalette(kind,direction,random,{keepExisting=false}={}){
 const options=paletteOptions(kind);if(!options.length)return null;
 const preferred=PREFERRED[direction]??PREFERRED.summer,guided=random()<.76;
 if(!guided&&keepExisting)return null;
 let ids=kind==='petalflower'||kind==='goldflower'?preferred.flower:kind==='longstar'||kind==='sparklelarge'?preferred.longstar:kind==='core'?preferred.core:kind==='kiku'?(direction==='water'?['blue','purple','aqua']:direction==='summer'?['red','blue','pink','purple','original']:['red','pink','original']):kind==='silver'?['kamuro-gold']:[];
 const narrowed=options.filter(p=>ids.includes(p.id));return pick(guided&&narrowed.length?narrowed:options,random).id;
}
const timing=(kind,size)=>({ascent:kind==='ear'?1.65:size===10?3.12:(1+size*.035)*1.2*(2.62/1.62),life:kind==='longstar'?longStarLife(size):TYPES[kind].life});
function points(kind,size){if(kind==='ear')return EAR_PROFILE.stars*EAR_PROFILE.trails;if(kind==='petalflower'||kind==='goldflower'){const p=petalGeometry(size);return(p.rays*p.strands+p.coreStars)*p.trails;}if(kind==='longstar'){const p=longStarCounts(size);return(p.large+p.gold)*40;}const spec=TYPES[kind],stars=SIZES[size].stars,n=spec.radii.reduce((sum,_,i)=>sum+Math.round(stars*(spec.layerWeights?.[i]??(i===0?1:i===1?.6:.35))),0);return n*(kind==='silver'||kind==='willow'?12:kind==='sunflower'?36:10);}
const weighted=(rows,r)=>{let n=r()*rows.reduce((n,x)=>n+x[1],0);for(const [kind,weight]of rows){n-=weight;if(n<0)return kind;}return rows.at(-1)[0];};
export function landscapeUpperDeck(scene,{seed=0x141770}={}){
 const random=variationRandom(seed,0x5ca1ab1e),shots=[];let previous=null;
 for(let i=0,offset=1.1+random()*.7;offset<scene.end-scene.firstOpening-2.5;i++,offset+=2.5+random()*1.5){
  const direction=landscapeDirection(scene,scene.firstOpening+offset),warm=['sunset','harvest'].includes(direction);
  const families=warm?[['sunflower',2],['goldflower',2],['petalflower',2],['silver',1.5],['willow',1.5],['longstar',1],['core',.7],['double',.5]]:[['petalflower',3],['longstar',2],['goldflower',1],['core',1],['double',.8],['silver',.5],['willow',.5],['sunflower',.5]];
  for(let attempt=0;attempt<6;attempt++){
   const family=weighted(families.filter(x=>x[0]!==previous),random),size=family==='sunflower'?5:family==='double'?10:random()<.42?10:5;
   const reviewSeed=(random()*4294967296)>>>0,flight=flowerFlight(size,reviewSeed),t=timing(family,size),anchor=scene.firstOpening+offset+attempt*.14,at=anchor-t.ascent,opening=anchor+flight.ascentOffset+flight.ignitionDelay;
   if(at<scene.shots[0].at||opening+t.life+.25>scene.end)continue;
   const palette=landscapePalette(family,direction,random)??'original',headY=(size===10?1.85:1.46)+flight.heightOffset+(random()-.5)*.06;
   const shot={at,opening,anchor:opening,kind:family,size,group:'auto-landscape-upper',position:{x:(random()-.5)*1.5+flight.dx,z:-.98+(random()-.5)*.12+flight.dz,heightOffset:headY-(size===10?1.3:1.04),startAt:at,ignitionDelay:flight.ignitionDelay,ascentOffset:flight.ascentOffset,reviewSeed,flowerFlight:flight,palette,flowerProgramme:true,earField:true,landscapeDirection:direction}};
   if(earProgrammeFits([...scene.shots,...shots,shot],{shellTiming:timing,shellPoints:points})){shots.push(shot);previous=family;break;}
  }
 }
 return shots.sort((a,b)=>a.at-b.at);
}
