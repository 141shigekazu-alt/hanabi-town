import {synchronizedTigerShots} from './tiger-sync.js?v=1.3.26';
import {openingColourShots,layerColourShots,GRAND_STYLES} from './grand-tiger-cues.js?v=1.3.26';
import {compactFanShots} from './compact-fans.js?v=1.3.26';
import {omitUnlitFragments} from './unlit-points.js?v=1.3.13';
import {variationRandom,centeredVariation} from './flower-variation.js';
import {flowerGroundShots} from './flower-scenes.js';
import {TORA_SMALL_PATTERNS,createToraSmallPattern,TORA_MOUNTAIN_COLORS} from './tora-scenes.js?v=1.2.17';
import {candyColor} from './candy-colors.js?v=1.1.16';
import * as T from './vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAIL_POINTS=10,RETAINED_TAIL_POINTS=36;
export const starBundleTailSamples=shot=>shot.style==='flower-green'?TAIL_POINTS:RETAINED_TAIL_POINTS;
export const starBundlePointCost=shot=>shot.count*shot.angles.length*(starBundleTailSamples(shot)+2);
export const STAR_BUNDLE_TIME_SCALE=1.3;
function randomFrom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
export const STAR_BUNDLE_EXTRA_STYLES={
 'adopted-row-tips':{label:'桃・水色・緑の色星',head:0xff73c8,tail:0xffbd65,tipPalette:[0xff73c8,0x66ddff,0x32ff70]},
 ...GRAND_STYLES,
 'sync-bluegreen':{head:0x31baff,tail:0xffbd65,tipPalette:[0x31baff,0x93ff32]},
 'candy-tips':{label:'キャンディー色星・金の尾',head:0xff28cf,tail:0xffbd65,tipPalette:[0xff28cf,0x22cfff,0xffe629,0x68ff24,0xa33aff,0xff780f]},
 ...Object.fromEntries(TORA_MOUNTAIN_COLORS.map(c=>[c.id,{label:c.label+'の星・'+(c.id==='mountain-gold'?'金':'銀')+'の尾',head:c.head,tail:c.tail}])),
 'tora-row-mix':{label:'桃・水色・緑の列',head:0xff73c8,tail:0xdbeeff},
 'pink-silver':{label:'桃の星・銀の尾',head:0xff73c8,tail:0xdbeeff},
 'aqua-gold':{label:'水色の星・金の尾',head:0x66ddff,tail:0xffbd65},
 green:{label:'緑の星・金の尾',head:0x32ff70,tail:0xffbd65},
 'gold-silver':{label:'金の星・銀の尾',head:0xffcf77,tail:0xdbeeff},
 'white-gold':{label:'白の星・金の尾',head:0xf4fbff,tail:0xffbd65},
 'red-silver':{label:'紅の星・銀の尾',head:0xff263f,tail:0xdbeeff},
 'blue-gold':{label:'青の星・金の尾',head:0x397dff,tail:0xffbd65},
 'green-silver':{label:'緑の星・銀の尾',head:0x32ff70,tail:0xdbeeff}
};
export const STAR_BUNDLE_PATTERNS=[
 {id:'small-wide-fan-delayed',label:'子トラ · 時間差を広げた大扇',description:'離れた根元を160msずつ点火し、ゆったり扇を流します。'},
 {id:'small-wide-fan',label:'子トラ · 離れた根元の大扇',description:'横に離した11か所からすぼみ子トラを外へ傾け、大きな一つの扇を作ります。'},
 {id:'small-triple-fan',label:'子トラ · 根元を寄せた三つの扇',description:'各根元から11方向へ、三か所に扇を広げます。'},
 {id:'small-mountain-outward-green-tip',label:'子トラ · 中央から両裾・緑の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-aqua-tip',label:'子トラ · 中央から両裾・水色の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-pink-tip',label:'子トラ · 中央から両裾・桃の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-orange-tip',label:'子トラ · 中央から両裾・橙の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-purple-tip',label:'子トラ · 中央から両裾・紫の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-single-green-tip',label:'子トラ · 中央から両裾・緑の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-single-aqua-tip',label:'子トラ · 中央から両裾・水色の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-single-pink-tip',label:'子トラ · 中央から両裾・桃の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-single-orange-tip',label:'子トラ · 中央から両裾・橙の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-outward-single-purple-tip',label:'子トラ · 中央から両裾・紫の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-green-tip',label:'子トラ · 右から左・緑の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-aqua-tip',label:'子トラ · 右から左・水色の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-pink-tip',label:'子トラ · 右から左・桃の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-orange-tip',label:'子トラ · 右から左・橙の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-purple-tip',label:'子トラ · 右から左・紫の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-single-green-tip',label:'子トラ · 右から左・緑の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-single-aqua-tip',label:'子トラ · 右から左・水色の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-single-pink-tip',label:'子トラ · 右から左・桃の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-single-orange-tip',label:'子トラ · 右から左・橙の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-single-purple-tip',label:'子トラ · 右から左・紫の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-green-tip',label:'子トラ · 左から右・緑の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-aqua-tip',label:'子トラ · 左から右・水色の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-pink-tip',label:'子トラ · 左から右・桃の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-orange-tip',label:'子トラ · 左から右・橙の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-purple-tip',label:'子トラ · 左から右・紫の色星・三山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-single-green-tip',label:'子トラ · 左から右・緑の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-single-aqua-tip',label:'子トラ · 左から右・水色の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-single-pink-tip',label:'子トラ · 左から右・桃の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-single-orange-tip',label:'子トラ · 左から右・橙の色星・一山',description:'採用済みの山打ちに色星を添えます。'},
 {id:'small-mountain-sweep-reverse-single-purple-tip',label:'子トラ · 左から右・紫の色星・一山',description:'採用済みの山打ちに色星を添えます。'},

 {id:'small-mountain-sweep-reverse',label:'子トラ · 左から右へ三山・色星なし',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},
 {id:'small-mountain-sweep-reverse-color-tip',label:'子トラ · 左から右へ三山・青紫',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},
 {id:'small-mountain-sweep-reverse-red-tip',label:'子トラ · 左から右へ三山・赤',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},
 {id:'small-mountain-sweep-reverse-single',label:'子トラ · 左から右へ一山・色星なし',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},
 {id:'small-mountain-sweep-reverse-single-color-tip',label:'子トラ · 左から右へ一山・青紫',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},
 {id:'small-mountain-sweep-reverse-single-red-tip',label:'子トラ · 左から右へ一山・赤',description:'左裾から右裾へ点火し、三山も左・中央・右へ渡ります。'},

 {id:'small-mountain-simultaneous',label:'子トラ · 全同時点火三山・色星なし',description:'山を構成する全ての束を同時に点火します。'},
 {id:'small-mountain-simultaneous-color-tip',label:'子トラ · 全同時点火三山・青紫',description:'山を構成する全ての束を同時に点火します。'},
 {id:'small-mountain-simultaneous-red-tip',label:'子トラ · 全同時点火三山・赤',description:'山を構成する全ての束を同時に点火します。'},
 {id:'small-mountain-simultaneous-single',label:'子トラ · 全同時点火一山・色星なし',description:'山を構成する全ての束を同時に点火します。'},
 {id:'small-mountain-simultaneous-single-color-tip',label:'子トラ · 全同時点火一山・青紫',description:'山を構成する全ての束を同時に点火します。'},
 {id:'small-mountain-simultaneous-single-red-tip',label:'子トラ · 全同時点火一山・赤',description:'山を構成する全ての束を同時に点火します。'},

 {id:'small-mountain-outward',label:'子トラ · 中央から両裾へ三山・色星なし',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},
 {id:'small-mountain-outward-color-tip',label:'子トラ · 中央から両裾へ三山・青紫',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},
 {id:'small-mountain-outward-red-tip',label:'子トラ · 中央から両裾へ三山・赤',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},
 {id:'small-mountain-outward-single',label:'子トラ · 中央から両裾へ一山・色星なし',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},
 {id:'small-mountain-outward-single-color-tip',label:'子トラ · 中央から両裾へ一山・青紫',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},
 {id:'small-mountain-outward-single-red-tip',label:'子トラ · 中央から両裾へ一山・赤',description:'中央から左右一対ずつ外側へ点火して山を描きます。'},

 {id:'small-mountain-inward',label:'子トラ · 両裾から内へ三山・色星なし',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},
 {id:'small-mountain-inward-color-tip',label:'子トラ · 両裾から内へ三山・青紫',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},
 {id:'small-mountain-inward-red-tip',label:'子トラ · 両裾から内へ三山・赤',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},
 {id:'small-mountain-inward-single',label:'子トラ · 両裾から内へ一山・色星なし',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},
 {id:'small-mountain-inward-single-color-tip',label:'子トラ · 両裾から内へ一山・青紫',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},
 {id:'small-mountain-inward-single-red-tip',label:'子トラ · 両裾から内へ一山・赤',description:'左右一対ずつ同時に点火して山の中央へ進みます。'},

 {id:'small-mountain-sweep-color-tip',label:'子トラ · 青紫の色星つき三山',description:'裾の広い山の先端に採用済みサイズの色星を添えます。'},
 {id:'small-mountain-sweep-red-tip',label:'子トラ · 赤の色星つき三山',description:'裾の広い山の先端に採用済みサイズの色星を添えます。'},
 {id:'small-mountain-sweep-single-color-tip',label:'子トラ · 青紫の色星つき一山',description:'裾の広い山の先端に採用済みサイズの色星を添えます。'},
 {id:'small-mountain-sweep-single-red-tip',label:'子トラ · 赤の色星つき一山',description:'裾の広い山の先端に採用済みサイズの色星を添えます。'},

 {id:'small-mountain-sweep',label:'子トラ · 右から描く三山',description:'搾り子トラを右から左へ順送りし、三つの山を描きます。'},
 {id:'small-mountain-sweep-single',label:'子トラ · 右から描く一山',description:'11本の搾り子トラを右裾から左裾へ順に打ちます。'},

 {id:'small-up-compact',label:'子トラ · 少し収束した基本吹上',description:'基本の束の広がりを半分に絞ります。'},
 {id:'small-up-compact-color-tip',label:'子トラ · 少し収束した色星つき吹上',description:'収束した束の先端に、採用済みの大きさの色星を添えます。'},
 {id:'small-up-color-tip',label:'子トラ · 色星つき基本吹上',description:'基本の吹上の各先端に、少し大きい色星を添えます。'},
 ...TORA_SMALL_PATTERNS.filter(p=>!p.id.startsWith('small-mountain-')),
 {id:'small-hop-left',label:'子トラ · 左の小さな跳ね',description:'左の２か所を細い束で跳ねさせます。'},
 {id:'small-hop-right',label:'子トラ · 右の小さな跳ね',description:'右の２か所が左に応えます。'},
 {id:'small-hop-center',label:'子トラ · 中央の小さな跳ね',description:'中央に短いリズムを置きます。'},
 {id:'small-up-tight',label:'子トラ · すぼめた吹上',description:'小さな星を細い束のまま、５か所からまっすぐ吹き上げます。'},
 {id:'small-cross-tight',label:'子トラ · すぼめたクロス',description:'細くまとまった星の束が、左右から斜めに挙がって交差します。'},
 {id:'small-up',label:'子トラ · 星の束を吹き上げる',description:'小さな星が５か所からまとまって吹き上がり、広がりながら消えます。'},
 {id:'small-cross',label:'子トラ · 星の束をクロス',description:'左右から斜めに吹き上がる星の束が、空の下で交差します。'},
 {id:'small-fan',label:'子トラ · 星の束を扇に',description:'３か所から５方向へ。小さな星の束が扇になって広がります。'}
];
function rawStarBundlePattern(id,style='gold',seed=1,options={}){
 if(id==='small-sync-fan')return synchronizedTigerShots(seed,options).small;
 if(id==='small-grand-opening')return openingColourShots(seed);
 if(id==='small-grand-layers')return layerColourShots(seed);
 if(id==='small-wide-fan'||id==='small-wide-fan-delayed'||id==='small-triple-fan')return compactFanShots(id,style,seed,options);
 if(/^small-mountain-(?:sweep(?:-reverse)?|inward|outward|simultaneous)(?:-single)?(?:-(?:color|red|green|aqua|pink|orange|purple)-tip)?$/.test(id)){
  const random=randomFrom(seed),shots=[],centers=Array.isArray(options.centers)&&options.centers.length?options.centers.slice(0,3):id.includes('-single')?[0]:id.startsWith('small-mountain-sweep-reverse')?[-1.08,0,1.08]:[1.08,0,-1.08];
  for(const center of centers)for(let i=0;i<11;i++){
   const x=center+(id.startsWith('small-mountain-sweep-reverse')?i-5:5-i)*.104;
   shots.push({x,y:.035,z:-.68,angles:[0],count:32,height:.56,at:id.startsWith('small-mountain-simultaneous')?0:id.startsWith('small-mountain-outward')?Math.abs(5-i)*.11:id.startsWith('small-mountain-inward')?(5-Math.abs(5-i))*.11:shots.length*.055,style,seed:Math.floor(random()*0xffffffff),small:true,basicTiger:true,earlyBurn:true,coloredTip:id.endsWith('-tip')||!!options.coloredTip,tipColor:options.tipColor??({'color-tip':0x466bff,'red-tip':0xff263f,'green-tip':0x25ff52,'aqua-tip':0x27dbff,'pink-tip':0xff45ba,'orange-tip':0xff780f,'purple-tip':0xa54aff})[id.match(/(color|red|green|aqua|pink|orange|purple)-tip$/)?.[0]]??0x466bff,spreadScale:.50,mountainCenter:center});
  }
  return shots;
 }
 if(id==='small-flower-stem'||id==='small-flower-leaves')return flowerGroundShots(id,seed,options);
 if(TORA_SMALL_PATTERNS.some(p=>p.id===id))return createToraSmallPattern(id,style,seed,options);
 const compact=id==='small-up-compact'||id==='small-up-compact-color-tip';
 const coloredTip=id==='small-up-color-tip'||id==='small-up-compact-color-tip';if(compact||coloredTip)id='small-up';
 const shots=[],random=randomFrom(seed),tight=id.endsWith('-tight');
 if(tight)id=id.slice(0,-6);
 const add=(x,angles,count,height,at=0)=>shots.push({x,y:.035,z:-.68,angles,count,height,at,style,seed:Math.floor(random()*0xffffffff),small:true,...(id==='small-up'?{basicTiger:true,coloredTip,...(compact?{spreadScale:.50,earlyBurn:true}:{})}:{}),...(tight?{tight:true}: {})});
 if(id.startsWith('small-hop-')){
  const side=id.slice(10);
  for(const x of side==='left'?[-.72,-.38]:side==='right'?[.38,.72]:[-.17,.17]){
   add(x,[0],32,.43,0);
   Object.assign(shots[shots.length-1],{basicTiger:true,earlyBurn:true,spreadScale:.50,coloredTip:!['gold','silver'].includes(style)});
  }
 }
 if(id==='small-up')for(let i=0;i<5;i++)add((i-2)*.34,[0],48,.56,.015*i);
 if(id==='small-cross')for(const x of [-.64,-.22,.22,.64])add(x,[x<0?.68:-.68],44,.54);
 if(id==='small-fan')for(const x of [-.68,0,.68])add(x,[-.64,-.32,0,.32,.64],28,.49);
 return shots;
}
export function createStarBundlePattern(id,style='gold',seed=1,options={}){
 const legacyMountain=['small-mountain-bundles','small-mountain-triple','small-mountain-twins','small-mountain-upright'].includes(id);
 const shots=legacyMountain?rawStarBundlePattern('small-mountain-outward',style,seed,{...options,coloredTip:!['gold','silver'].includes(style),...(id==='small-mountain-triple'?{}:{centers:[-.68,.68]})}):rawStarBundlePattern(id,style,seed,options);
 if(id.startsWith('small-flower-'))return shots;
 return shots.map(shot=>{
  const normalized=shot.style.startsWith('candy-')?'candy-tips':shot.style;
  const base={...shot,style:normalized};
  if(shot.basicTiger){if(shot.tight){const {tight,...current}=base;return {...current,earlyBurn:true,spreadScale:.50};}return base;}
  // Retire the old forced summit and ultra-tight axes, including recipes
  // encountered through old saved programmes. Keep their musical triggers.
  const {bundlePeak,summit,tight,burnOnRise,adoptedLight,...current}=base;
  return {...current,basicTiger:true,earlyBurn:true,spreadScale:.50,coloredTip:!['gold','silver'].includes(normalized)};
 });
}
export function bundleStarPosition(star,t){
 if(star.stopAt!==undefined&&!star.burnOnRise)t=Math.min(t,star.stopAt);
 const q=(1-Math.exp(-star.drag*t))/star.drag;
 return {x:star.x+star.vx*q,y:star.y+star.vy*q-star.gravity*(t-q)/star.drag,z:star.z+star.vz*q};
}
// Ten short-lived embers, born at fixed irregular times. The source star
// trajectory, rise speed and lifetime remain the already-reviewed ones.
function smallTailProfile(span,random,count=TAIL_POINTS){
 return {phase:Float64Array.from({length:count},(_,i)=>(i+.08+random()*.84)/count*span),
  life:Float64Array.from({length:count},()=>span*(.94+random()*.06)),
  dx:Float64Array.from({length:count},()=>(random()-.5)*.003),
  dy:Float64Array.from({length:count},()=>(random()-.5)*.002),
  dz:Float64Array.from({length:count},()=>(random()-.5)*.003),
  weight:Float64Array.from({length:count},()=>.88+random()*.24),
  size:Float32Array.from({length:count},()=>.94+random()*.12),
  birthAt:new Float64Array(count).fill(NaN),birth:new Float64Array(count*3)};
}
// All small tiger strokes leave independently cooling embers.
// A denser, non-recycling pool avoids stretching ten dots into a dotted line.
function retainedTailProfile(star,random,shortSpan){
 const count=RETAINED_TAIL_POINTS,emissionEnd=star.stopAt??star.life;
 const p=smallTailProfile(emissionEnd,random,count);
 p.tangent=new Float32Array(count*3);p.retained=true;p.holdAt=p.phase.slice();p.fadeLife=new Float64Array(count);
 const afterglow=emissionEnd*.85+shortSpan*.35;
 for(let i=0;i<count;i++){
  // Like the large tiger: each ember cools from its own birth. Independent
  // lifetimes and end bounds avoid a common parent-time cutoff.
  const naturalLife=afterglow*(.75+random()*.50);
  const lastAt=star.life-.14+.22*(p.phase[i]/emissionEnd)+random()*.10;
  const life=Math.min(naturalLife,lastAt-p.phase[i]);
  p.life[i]=p.fadeLife[i]=life;
  if(star.basicTiger){
   // Even emission spacing and coherent cooling keep each stroke joined.
   p.phase[i]=(i+.5)/count*emissionEnd;
   p.life[i]=p.fadeLife[i]=Math.min(afterglow*.92,star.life+.10*p.phase[i]/emissionEnd-p.phase[i]);
   p.holdAt[i]=p.phase[i];
  }
 }
 p.until=Math.max(...p.phase.map((t,i)=>t+p.life[i]));return p;
}

function smallTailSample(star,profile,span,age,index,out){
 const phase=profile.phase[index],cycle=profile.retained?0:Math.floor((Math.min(age,star.life)-phase)/span),at=phase+cycle*span,elapsed=age-at,life=profile.life[index];
 if(cycle<0||elapsed<0||elapsed>=life)return false;
 const k=index*3;
 if(profile.birthAt[index]!==at){const p=bundleStarPosition(star,at);profile.birth[k]=p.x;profile.birth[k+1]=p.y;profile.birth[k+2]=p.z;profile.birthAt[index]=at;
  const decay=Math.exp(-star.drag*Math.min(at,star.stopAt??at));
  profile.tangent[k]=star.vx*decay;
  profile.tangent[k+1]=star.vy*decay-star.gravity*(1-decay)/star.drag;
  profile.tangent[k+2]=star.vz*decay;}
 const warm=profile.retained?clamp((age-profile.holdAt[index])/profile.fadeLife[index],0,1):elapsed/life;
 out.x=profile.birth[k]+profile.dx[index]*warm;out.y=profile.birth[k+1]+profile.dy[index]*warm-.002*warm*warm;out.z=profile.birth[k+2]+profile.dz[index]*warm;
 const emitted=star.gain*clamp(at/.030,0,1)*Math.pow(clamp((star.life-at)/(star.fadeDuration??.42),0,1),1.25);
 // Retained embers cool continuously from birth; keep their width so the
 // rising strokes remain legible while older roots grow dimmer.
 const cooling=profile.retained?warm*warm:clamp((warm-.35)/.65,0,1),thinning=profile.retained?warm:clamp((warm-.65)/.35,0,1);
 out.light=emitted*Math.pow(1-cooling,profile.retained?1.6:1.25)*profile.weight[index]*1.05;
 out.size=profile.size[index]*1.35*(1-(star.basicTiger?.20:.53)*thinning*thinning);return true;
}

export function makeStarBundle(shot,start,style){
 const random=randomFrom(shot.seed),stars=[],span=shot.span??.32,timeScale=shot.timeScale??STAR_BUNDLE_TIME_SCALE;
 const individual=variationRandom(shot.seed,0x70aa61),character={height:1+centeredVariation(individual)*.12,lean:centeredVariation(individual)*.036,drag:.92+individual()*.16,gravity:.94+individual()*.12,arrival:.97+individual()*.06};
 for(const angle of shot.angles)for(let i=0;i<Math.ceil(shot.count*(style.bundleCountScale??1));i++){
  const drag=(.25+random()*.035)*character.drag,gravity=.90*character.gravity,peak=(1.03+random()*.18)*character.arrival;
  const height=shot.height*character.height*(shot.tight?(.83+random()*.11):(.64+random()*.42)),q=(1-Math.exp(-drag*peak))/drag;
  const vy=(height+gravity*(peak-q)/drag)/q,spread=(shot.tight?.045:.16)*(shot.spreadScale??1)*Math.sqrt(random()),azimuth=random()*Math.PI*2;
  stars.push({x:shot.x+(random()-.5)*.010,y:shot.y,z:shot.z+(random()-.5)*.010,
   vx:vy*Math.tan(angle+character.lean+Math.cos(azimuth)*spread+(style.colorSpread??0)*((i%5)-2)/2),vy,vz:vy*Math.sin(azimuth)*spread,
   drag,gravity,at:random()*.035,life:1.40+random()*.48,gain:.84+random()*.40});
 }
 // Separate stars stay on the same narrow axis, with small differences along it.
 if(shot.bundlePeak)for(const star of stars){
  const end=shot.bundlePeak.at*character.arrival+(random()-.5)*.10;
  const extent=(.97+centeredVariation(random)*.085)*character.height;star.at=random()*.12;star.stopAt=end;
  star.summitTarget={x:shot.x+((shot.bundlePeak.x??shot.x)-shot.x)*extent+(random()-.5)*.004,y:shot.y+shot.bundlePeak.height*extent};
  star.life=end+.24;star.fadeDuration=.24;star.gain*=.72;
 }
 if(shot.summit)for(const star of stars){
  const end=shot.summit.at*character.arrival+(random()-.5)*.065,q=(1-Math.exp(-star.drag*end))/star.drag,targetX=shot.summit.x+character.lean*shot.summit.height+(random()-.5)*.018;
  star.vx=(targetX-star.x)/q;star.vy=(shot.summit.height+(random()-.5)*.008+star.gravity*(end-q)/star.drag)/q;star.vz=0;star.stopAt=end;star.summitTarget={x:targetX,y:star.y+shot.summit.height*character.height*(1+centeredVariation(random)*.04)};star.life=end+.18;star.fadeDuration=.18;star.gain*=.62;
 }
 for(const star of stars)if(star.summitTarget){
  // Cross the nominal ridge while the star is still rising. The short
  // overshoot stays luminous, then burns out before gravity turns it over.
  star.burnOnRise=true;
  star.stopAt*=.78;
  star.life=star.stopAt+.10;
  star.fadeDuration=.11;
  const end=star.stopAt,q=(1-Math.exp(-star.drag*end))/star.drag;
  // Hitting a height at T alone can put the ballistic apex before T.
  // Bound gravity so the star is still rising at its individual summit time.
  const height=star.summitTarget.y-star.y,decay=Math.exp(-star.drag*end);
  const apexGravity=height*star.drag*decay/(q-end*decay);
  star.gravity=Math.min(star.gravity,apexGravity*.24);
  star.vx=(star.summitTarget.x-star.x)/q;star.vy=(height+star.gravity*(end-q)/star.drag)/q;
 }
 // Basic upright tiger: finish near the actual ballistic apex, before a
 // luminous descending curtain develops. Preserve launch speed and spread.
 if(shot.basicTiger)for(const star of stars){
  const apex=Math.log1p(star.drag*star.vy/star.gravity)/star.drag;
  star.life=apex+.065;
  star.fadeDuration=Math.min(.40,apex*.55);
  if(shot.earlyBurn){
   // Raise the ballistic apex instead of slowing the clock. Keep the old
   // visible duration and terminal height, with upward speed at extinction.
   const end=star.life,q=(1-Math.exp(-star.drag*end))/star.drag;
   const height=star.vy*q-star.gravity*(end-q)/star.drag;
   // Keep launch velocity; solve drag so the old terminal height is exact.
   star.gravity*=.20;
   const atEnd=drag=>{const q=(1-Math.exp(-drag*end))/drag;return star.vy*q-star.gravity*(end-q)/drag;};
   let lo=star.drag,hi=star.drag*2;
   while(atEnd(hi)>height)hi*=2;
   for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(atEnd(mid)>height)lo=mid;else hi=mid;}
   star.drag=(lo+hi)/2;
  }
  star.basicTiger=true;
  if(shot.mountainCenter!==undefined){
   // Aim each rising stroke at the ridge at extinction, never at a turnover.
   const q=(1-Math.exp(-star.drag*star.life))/star.drag;
   star.vx+=(shot.mountainCenter-shot.x)/q;
  }
 }
 if(style.headPalette)for(let i=0;i<stars.length;i++){const color=candyColor(i,shot.seed,style.headPalette);stars[i].headColor=new T.Color(color);stars[i].tailColor=new T.Color(color);}
 if(shot.adoptedLight)for(const star of stars)star.basicTiger=true;
 const bundle={...shot,start,character,stars,span:shot.burnOnRise?span*.6:span,timeScale,colored:!!style.headPalette,headGain:style.headGain??1.65,tailGain:style.tailGain??.65,headColor:new T.Color(shot.style==='gold'?0xffcf77:style.head),tailColor:new T.Color(style.tail),end:(Math.max(...stars.map(s=>s.at+s.life))+(shot.burnOnRise?0:span))*timeScale};
 // A separate random stream must not change any head, summit or palette seed.
 if(shot.style!=='flower-green'){
  const emberRandom=variationRandom(shot.seed,0x51e6b3);bundle.tailSamples=starBundleTailSamples(shot);
  const retained=bundle.tailSamples===RETAINED_TAIL_POINTS;
  bundle.emberTails=stars.map(star=>retained?retainedTailProfile(star,emberRandom,bundle.span):smallTailProfile(bundle.span,emberRandom));
  if(retained)bundle.end=Math.max(bundle.end,...bundle.emberTails.map((p,i)=>(stars[i].at+p.until)*timeScale));
 }
 if(shot.coloredTip){bundle.headColor.setHex(shot.tipColor??(['gold','silver'].includes(shot.style)?0x466bff:style.head));for(const star of stars)star.headColor=bundle.headColor;}
 if(style.tipPalette){
  bundle.coloredTip=true;
  for(let i=0;i<stars.length;i++)stars[i].headColor=new T.Color(candyColor(i,shot.seed,style.tipPalette));
 }
 if(shot.programmeGold){bundle.headColor.setHex(0xffcf77);bundle.tailColor.setHex(0xffbc61);for(const star of stars){star.headColor?.setHex(0xffcf77);star.tailColor?.setHex(0xffbc61);}}return bundle;
}

// Sharpen only child-tiger light. Flower stems/leaves retain the old sprite.
function childTigerLight(material,kind){
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.vertexShader='attribute float childTiger;\nvarying float vChildTiger;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvChildTiger = childTiger;');
  shader.fragmentShader='varying float vChildTiger;\n'+shader.fragmentShader;
  const hook='#include <map_particle_fragment>';
  if(!shader.fragmentShader.includes(hook))throw Error('Child tiger light hook missing');
  const chunk=T.ShaderChunk.map_particle_fragment;
  let light=chunk;
  if(kind==='tail'){
   shader.vertexShader='attribute vec3 emberVelocity;\nvarying vec2 strokeAxis;\nvarying float strokeAspect;\n'+shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
    vec3 velocity = mat3(modelViewMatrix) * emberVelocity;
    vec2 projected = velocity.xy - mvPosition.xy * velocity.z / min(-0.0001, mvPosition.z);
    float projectedLength = length(projected);
    strokeAxis = projectedLength > 0.00001 ? projected / projectedLength : vec2(0.0,1.0);
    float visibleMotion = clamp(projectedLength / max(length(velocity),0.00001),0.0,1.0);
    strokeAspect = 1.0 + (childTiger > 1.5 ? 10.0 : 2.3) * visibleMotion;
   `).replace('gl_PointSize = size * emberSize;', 'gl_PointSize = size * emberSize * mix(1.0, strokeAspect, min(childTiger,1.0));');
   shader.fragmentShader='varying vec2 strokeAxis;\nvarying float strokeAspect;\n'+shader.fragmentShader;
   light=chunk+`
    if(vChildTiger > 0.5){
     vec2 offset = vec2(gl_PointCoord.x-0.5,0.5-gl_PointCoord.y)*2.0;
     vec2 across = vec2(-strokeAxis.y,strokeAxis.x);
     float radius = length(vec2(dot(offset,strokeAxis), dot(offset,across)*strokeAspect*(1.55/0.72)));
     diffuseColor.a = opacity * 0.80 * (1.0-smoothstep(0.04,0.94,radius));
    }`;
   }else if(kind==='head')light=chunk+`
    if(vChildTiger > 0.5){
     float radius = length(gl_PointCoord-vec2(0.5))*2.0;
     float core = 1.0-smoothstep(0.07,0.32,radius);
     float halo = (1.0-smoothstep(0.12,0.88,radius))*0.045;
     diffuseColor.a = opacity * min(1.0,core+halo);
    }`;
  else light=chunk+'\ndiffuseColor.a *= mix( 1.0, 0.08, vChildTiger );';
  shader.fragmentShader=shader.fragmentShader.replace(hook,light);
 };
 material.customProgramCacheKey=()=>key+'|child-tiger-crisp-v4-'+kind;
}

export class StarBundleField{
 constructor({town,bridge,map,headMaps,styles,onLaunch=()=>{},capacity=1024,timeScale=STAR_BUNDLE_TIME_SCALE}){
  Object.assign(this,{town,bridge,styles,onLaunch,capacity,timeScale});this.tailSamples=RETAINED_TAIL_POINTS;this.active=[];this.pending=[];this.seed=0x141710;this.group=0;this.dropped=0;this.points=0;
  this.tipSizes=new Float32Array(capacity).fill(1);this.headFlags=new Float32Array(capacity);this.tailFlags=new Float32Array(capacity*RETAINED_TAIL_POINTS);
  this.headPositions=new Float32Array(capacity*3);this.headColors=new Float32Array(capacity*3);
  this.tailSizes=new Float32Array(capacity*RETAINED_TAIL_POINTS).fill(1);this.emberSample={};
  this.tailPositions=new Float32Array(capacity*RETAINED_TAIL_POINTS*3);this.tailColors=new Float32Array(capacity*RETAINED_TAIL_POINTS*3);
  const geometry=(positions,colors)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));g.setDrawRange(0,0);return g;};
  this.headGeometry=geometry(this.headPositions,this.headColors);this.tailGeometry=geometry(this.tailPositions,this.tailColors);
  this.headGeometry.setAttribute('tipSize',new T.BufferAttribute(this.tipSizes,1).setUsage(T.DynamicDrawUsage));
  this.headGeometry.setAttribute('childTiger',new T.BufferAttribute(this.headFlags,1).setUsage(T.DynamicDrawUsage));
  this.tailGeometry.setAttribute('childTiger',new T.BufferAttribute(this.tailFlags,1).setUsage(T.DynamicDrawUsage));
  this.tailVelocity=new Float32Array(capacity*RETAINED_TAIL_POINTS*3);
  this.tailGeometry.setAttribute('emberVelocity',new T.BufferAttribute(this.tailVelocity,3).setUsage(T.DynamicDrawUsage));
  this.tailGeometry.setAttribute('emberSize',new T.BufferAttribute(this.tailSizes,1).setUsage(T.DynamicDrawUsage));
  const material=(size,opacity=1)=>new T.PointsMaterial({color:0xffffff,size,opacity,vertexColors:true,map,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.headMaterial=material(.022);this.headMaterial.map=headMaps?.miniature??map;this.tailMaterial=material(.009);this.glowMaterial=material(.046,.10);
  this.tailMaterial.onBeforeCompile=shader=>{shader.vertexShader='attribute float emberSize;\n'+shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * emberSize;');};
  this.tailMaterial.customProgramCacheKey=()=> 'small-ember-sizes-v1';
  childTigerLight(this.tailMaterial,'tail');childTigerLight(this.glowMaterial,'glow');childTigerLight(this.headMaterial,'head');
  for(const material of [this.headMaterial,this.tailMaterial,this.glowMaterial])omitUnlitFragments(material);
  const previousHeadCompile=this.headMaterial.onBeforeCompile;this.headMaterial.onBeforeCompile=function(shader,renderer){previousHeadCompile.call(this,shader,renderer);shader.vertexShader='attribute float tipSize;\n'+shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * tipSize;');};
  this.headMaterial.customProgramCacheKey=()=> 'basic-colored-tip-crisp-v2';
  bridge.point(this.headMaterial,headMaps);bridge.point(this.tailMaterial);bridge.point(this.glowMaterial);
  this.heads=new T.Points(this.headGeometry,this.headMaterial);this.tails=new T.Points(this.tailGeometry,this.tailMaterial);this.glow=new T.Points(this.headGeometry,this.glowMaterial);
  for(const p of [this.tails,this.glow,this.heads]){p.frustumCulled=false;p.visible=false;town.add(p);}
 }
 launch(pattern,style,at,options={}){
  const shots=createStarBundlePattern(pattern,style,options.reviewSeed??(this.seed=(this.seed+0x9e3779b9)>>>0),options);
  if(!shots.length||!this.styles[style])return false;
  const total=s=>s.angles.length*s.count;
  const used=this.active.reduce((n,s)=>n+s.stars.length,0)+this.pending.reduce((n,s)=>n+total(s),0);
  if(used+shots.reduce((n,s)=>n+total(s),0)>this.capacity){this.dropped++;return false;}
  const group='small-'+(++this.group);
  for(const shot of shots)this.pending.push({...shot,at:at+shot.at,group,...(options.programmeGold?{programmeGold:true}:{}),timeScale:this.timeScale/Math.max(.25,Math.min(2,Number(options.motionRate)||1))});
  this.pending.sort((a,b)=>a.at-b.at);return true;
 }
 update(time){
  while(this.pending.length&&this.pending[0].at<=time){
   const shot=this.pending.shift();if(time-shot.at>.35)continue;
   this.active.push(makeStarBundle(shot,shot.at,this.styles[shot.style]));this.onLaunch(shot,time);
  }
  this.active=this.active.filter(s=>time-s.start<s.end);
  const desiredSize=.022;if(this.headSize!==desiredSize){this.headSize=desiredSize;this.bridge.point(this.headMaterial,null,desiredSize);}
  let heads=0,tails=0;
  for(const bundle of this.active)for(let starIndex=0;starIndex<bundle.stars.length;starIndex++){
   const star=bundle.stars[starIndex];
   const age=(time-bundle.start)/bundle.timeScale-star.at;if(age<0)continue;
   const gain=t=>star.gain*clamp(t/.030,0,1)*Math.pow(clamp((star.life-t)/(star.fadeDuration??.42),0,1),1.25);
   if(age<star.life){
    const p=bundleStarPosition(star,age),light=gain(age)*bundle.headGain*(bundle.style==='flower-green'?1:.72),headColor=star.headColor??bundle.headColor;
    if(p.y>.012){this.headPositions.set([p.x,p.y,p.z],heads*3);this.headColors.set([headColor.r*light,headColor.g*light,headColor.b*light],heads*3);this.tipSizes[heads]=bundle.coloredTip?2.90:1;this.headFlags[heads]=bundle.style==='flower-green'?0:1;heads++;}
   }
   if(bundle.emberTails){
    const profile=bundle.emberTails[starIndex],tailColor=star.tailColor??bundle.tailColor;
    for(let i=0;i<(bundle.tailSamples??TAIL_POINTS);i++){
     const p=this.emberSample;if(!smallTailSample(star,profile,bundle.span,age,i,p)||p.y<=.012)continue;
     // The rise-only mountain still extinguishes on its approved short cue.
     const burnFade=star.burnOnRise&&!profile.retained?clamp((star.life-age)/star.fadeDuration,0,1):1,light=p.light*bundle.tailGain*burnFade*(bundle.style==='flower-green'?1:.32);
     const k=tails*3;this.tailPositions[k]=p.x;this.tailPositions[k+1]=p.y;this.tailPositions[k+2]=p.z;
     this.tailColors[k]=tailColor.r*light;this.tailColors[k+1]=tailColor.g*light;this.tailColors[k+2]=tailColor.b*light;this.tailSizes[tails]=p.size;const v=i*3;this.tailVelocity[k]=profile.tangent[v];this.tailVelocity[k+1]=profile.tangent[v+1];this.tailVelocity[k+2]=profile.tangent[v+2];this.tailFlags[tails]=star.basicTiger?2:1;tails++;
    }
   }else{
   // Flower stems/leaves keep the existing short-history rendering.
   for(let i=1;i<=TAIL_POINTS;i++){
    const history=i*bundle.span/TAIL_POINTS,t=age-history;if(t<0||t>=star.life)continue;
    const p=bundleStarPosition(star,t);if(p.y<=.012)continue;
    const burnFade=star.burnOnRise?clamp((star.life-age)/star.fadeDuration,0,1):1;
    const light=gain(t)*bundle.tailGain*(1-i/(TAIL_POINTS+1))*burnFade,tailColor=star.tailColor??bundle.tailColor;
    this.tailPositions.set([p.x,p.y,p.z],tails*3);this.tailColors.set([tailColor.r*light,tailColor.g*light,tailColor.b*light],tails*3);this.tailSizes[tails]=1;this.tailFlags[tails]=0;tails++;
   }
  }
  }
  this.headGeometry.setDrawRange(0,heads);this.tailGeometry.setDrawRange(0,tails);
  // Upload only the populated prefix. Drawing and all particle values stay unchanged.
  for(const [geometry,count] of [[this.headGeometry,heads],[this.tailGeometry,tails]]){
   for(const attribute of Object.values(geometry.attributes)){
    attribute.clearUpdateRanges();
    if(count){attribute.addUpdateRange(0,count*attribute.itemSize);attribute.needsUpdate=true;}
   }
  }
  this.heads.visible=this.glow.visible=heads>0;this.tails.visible=tails>0;this.points=heads*2+tails;
 }
 clear(){this.active=[];this.pending=[];this.headGeometry.setDrawRange(0,0);this.tailGeometry.setDrawRange(0,0);this.heads.visible=this.glow.visible=this.tails.visible=false;this.points=0;}
 get groups(){return new Set([...this.active,...this.pending].map(s=>s.group)).size;}
 dispose(){this.clear();for(const p of [this.tails,this.glow,this.heads])this.town.remove(p);this.headGeometry.dispose();this.tailGeometry.dispose();this.headMaterial.dispose();this.tailMaterial.dispose();this.glowMaterial.dispose();}
}
