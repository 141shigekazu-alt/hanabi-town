import {rareTigerFinaleProposal} from './rare-tiger-finales.js?v=1.3.27';
import {createCometPattern,makeComet,SMALL_COMET_STYLES} from './comets.js?v=1.3.27';
import {createStarBundlePattern,makeStarBundle,STAR_BUNDLE_TIME_SCALE} from './star-bundles.js?v=1.3.27';
const memo=new WeakMap(),CAPACITY={small:1536,large:96};
export const TIGER_PROGRAMME_REVISION='adopted-tigers06';
const isCandy=style=>String(style).startsWith('candy-');
function tipStyle(style){return isCandy(style)?'candy-tips':style==='tora-row-mix'?'adopted-row-tips':style;}
// Reserve the complete cue at its trigger time, including still-pending rays.
// Durations use the actual star/comet models, plus a small timing margin.
export function tigerReviewSeed(trackId,index){let seed=0x141718;for(const c of trackId)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;return(seed+Math.imul(index+10001,2654435761))>>>0;}
export function tigerReservations(cue,index=0,trackId=''){
 if(cue.mode==='grand-roof')return [];
 const options=cue.options??{},rate=Math.max(.25,Math.min(2,Number(options.motionRate)||1)),seed=tigerReviewSeed(trackId,index),out=[];
 const addSmall=(mode,style)=>{for(const s of createStarBundlePattern(mode,style,seed,options)){const data=SMALL_COMET_STYLES[s.style];if(!data)throw Error('Unknown tiger colour: '+s.style);const bundle=makeStarBundle({...s,timeScale:STAR_BUNDLE_TIME_SCALE/rate},0,data);out.push({field:'small',from:cue.at,to:cue.at+s.at+bundle.end+.18,cost:bundle.stars.length});}};
 if(cue.mode.startsWith('small-'))addSmall(cue.mode,cue.style);
 else{for(const s of createCometPattern(cue.mode,cue.style,seed,options)){const comet=makeComet(s,0);out.push({field:'large',from:cue.at,to:cue.at+s.at+comet.end/rate+.18,cost:1});}if(cue.mode==='sync-fan')addSmall('small-sync-fan',options.smallStyle??'sync-bluegreen');}
 return out;
}
export function tigerReservationPeaks(rows){
 const peaks={small:0,large:0};for(const field of ['small','large']){let used=0;const events=rows.filter(r=>r.field===field).flatMap(r=>[[r.from,r.cost],[r.to,-r.cost]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);for(const [,delta]of events){used+=delta;peaks[field]=Math.max(peaks[field],used);}}return peaks;
}
function fits(rows){const p=tigerReservationPeaks(rows);return p.small<=CAPACITY.small&&p.large<=CAPACITY.large;}
const legacyMountains=new Set(['small-mountain-bundles','small-mountain-triple','small-mountain-twins','small-mountain-upright']);
const eligible=new Set(['small-up-tight','small-cross-tight','small-cross','small-fan','small-color-row','fan','cross','sweep','sweep-reverse','sweep-cross','sweep-cross-high','inward','curtain','grand-fan-cross','woven-cross','mountain-twins']);
function featurePolicy(plan,trackId){
 const calm=trackId==='natsu-no-nagori'||trackId==='mou-ichido-dake'||/sentimental|grand|ballad|calm|quiet/.test(plan.feeling??'');
 if(trackId==='pastel-parasite')return {calm:false,max:3,gap:28,pool:['small-mountain-outward','small-wide-fan','small-mountain-sweep-reverse']};
 if(trackId==='natsu-no-nagori')return {calm:true,max:3,gap:32,pool:['small-wide-fan-delayed','small-mountain-outward','sync-fan']};
 if(trackId==='mou-ichido-dake')return {calm:true,max:2,gap:50,pool:['small-wide-fan-delayed','small-mountain-sweep']};
 return {calm,max:Math.min(3,Math.max(1,Math.floor(plan.duration/65))),gap:28,pool:calm?['small-wide-fan-delayed','small-mountain-outward']:['small-wide-fan','small-mountain-sweep-reverse','small-triple-fan']};
}
export function upgradeTigerProgramme(plan,{trackId=''}={}){
 if(!plan||plan.authoredTigerProgramme||!Array.isArray(plan.fans)||plan.tigerProgrammeRevision===TIGER_PROGRAMME_REVISION||String(plan.revision).includes('tigerprogramme'))return plan;
 if(memo.has(plan))return memo.get(plan);
 if(String(plan.tigerProgrammeRevision??'').startsWith('adopted-tigers')){
  const migrated={...plan,tigerProgrammeRevision:TIGER_PROGRAMME_REVISION,tigerProgrammeReview:{...plan.tigerProgrammeReview,legacyLight:'adopted-trajectory06'}};
  memo.set(plan,migrated);return migrated;
 }
 let mountain=0,removed=0;const changes=[];
 let fans=plan.fans.map(f=>({...f,options:{...f.options}}));
 // Roof tigers are authored, exceptional grand-finale cues. Never infer one
 // from available space or automatically insert it into pop/ballad tracks.
 fans=fans.map(f=>{if(!legacyMountains.has(f.mode))return f;const mode=['small-mountain-outward','small-mountain-sweep','small-mountain-sweep-reverse'][mountain++%3],style=tipStyle(f.style);return {...f,mode,style,options:{...f.options,coloredTip:true,tipColor:SMALL_COMET_STYLES[style]?.head,...(f.mode==='small-mountain-triple'?{}:{centers:[-.68,.68]})},tigerSourceMode:f.mode};});
 const rows=fans.map((f,i)=>tigerReservations(f,i,trackId));let order=0,last=-Infinity;
 const policy=featurePolicy(plan,trackId),maxFeatures=policy.max;
 for(let i=0;i<fans.length&&order<maxFeatures;i++){
  const cue=fans[i];if(!eligible.has(cue.mode)||cue.at-last<policy.gap||cue.at>(plan.duration??Infinity)-4||cue.tigerSourceMode)continue;
  const wanted=policy.pool[order%policy.pool.length],style=tipStyle(cue.style),calm=policy.calm;
  let mode=wanted==='small-wide-fan'&&calm?'small-wide-fan-delayed':wanted;
  const base={...cue,mode,style:mode==='sync-fan'?'gold':style,tigerSourceMode:cue.mode,options:{...cue.options,coloredTip:true,tipColor:SMALL_COMET_STYLES[style]?.head,...(mode==='sync-fan'?{smallStyle:style,single:calm}:{}),...(mode.includes('wide-fan')?{ignition:order%2?'left':'right'}:{})}};
  const candidates=[base];if(mode.startsWith('small-mountain-'))candidates.push({...base,options:{...base.options,centers:[-.68,.68]}},{...base,mode:mode+'-single'});
  if(mode==='sync-fan')candidates.push({...base,options:{...base.options,single:true}});
  for(const candidate of candidates){const next=tigerReservations(candidate,i,trackId),all=rows.flatMap((r,j)=>j===i?next:r);if(!fits(all))continue;fans[i]=candidate;rows[i]=next;changes.push({at:cue.at,mode:candidate.mode,from:cue.mode});last=cue.at;order++;break;}
 }
 let rareFinale=null;const proposal=rareTigerFinaleProposal({...plan,fans},trackId);
 if(proposal){const reservations=proposal.fans.map((f,i)=>tigerReservations(f,i,trackId));if(fits(reservations.flat())){fans=proposal.fans;rows.splice(0,rows.length,...reservations);rareFinale={kind:proposal.kind,seed:proposal.seed,drawModulus:proposal.drawModulus};changes.push(...proposal.added.map(f=>({at:f.at,mode:f.mode,rare:true})));}}
 const result={...plan,fans,...(rareFinale?{showDuration:proposal.showDuration,rareTigerFinale:rareFinale}:{}),...(plan.analysisSummary?{analysisSummary:{...plan.analysisSummary,groundModes:[...new Set(fans.map(f=>f.mode))]}}:{}),tigerProgrammeRevision:TIGER_PROGRAMME_REVISION,tigerProgrammeReview:{sourceFans:plan.fans.length,upgradedFans:fans.length,changes,removedRoofOverlapCues:removed,peaks:tigerReservationPeaks(rows.flat()),legacyLight:'adopted-trajectory06',roofPolicy:'authored-or-rare-eligible-grand-finales-only',featurePolicy:policy}};
 memo.set(plan,result);return result;
}
