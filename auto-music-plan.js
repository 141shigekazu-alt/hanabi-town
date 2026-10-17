import {limitProgrammeCapacity} from './programme-capacity.js';
import {requestedFinale} from './voice-finale.js';
import {voiceProgrammeStyle} from './voice-request.js';
import {addGoldAccents} from './gold-accents.js';
import {directVoicePlan} from './voice-director.js';
import {drawProgrammeStyle} from './programme-style.js';
import {naturalProgrammeOpening,applyProgrammeStyle} from './style-programmes.js';
import {isCreativeShell,creativePoints} from './creative-shells.js';
import {addEarPassages} from './ear-programmes.js';
import {flowerPalette} from './retired-shells.js';
import {petalGeometry} from './flower-scenes.js';
import {addFlowerPassages} from './flower-programmes.js';
import {directMusicFeeling,musicFeeling} from './music-feeling.js';
import {automaticRepeatHeads} from './auto-repeat-heads.js?v=1.2.95';
import {createSlowMusicPlan} from './auto-music-slow.js?v=1.2.95';
import {SIZES,TYPES,EAR_PROFILE} from './fireworks.js?v=1.2.95';
import {longStarCounts,longStarLife} from './long-stars.js?v=1.2.95';
import {sparkleCounts,sparkleLife} from './sparkling-stars.js?v=1.2.95';
import {createCometPattern} from './comets.js?v=1.2.95';
import {createStarBundlePattern} from './star-bundles.js?v=1.2.95';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=x=>+x.toFixed(4)||0;
export function shellTiming(kind,size){return {ascent:kind==='ear'?1.65:size===20?5.6:size===10?3.12:(1+size*.035)*1.2*(2.62/1.62),life:kind==='longstar'?longStarLife(size):kind==='sparklelarge'?sparkleLife(size):TYPES[kind].life};}
export function shellPoints(kind,size,wide=false,starDensity=1){
 if(isCreativeShell(kind))return creativePoints(kind,size);
 if(kind==='ear')return EAR_PROFILE.stars*EAR_PROFILE.trails;
 if(kind==='petalflower'||kind==='goldflower'){const p=petalGeometry(size);return(p.rays*p.strands+p.coreStars)*p.trails;}
 if(kind==='longstar'){const c=longStarCounts(size);return(c.large+c.gold)*40;}
 if(kind==='sparklelarge'){const c=sparkleCounts(size);return(c.large+c.companions+c.core)*48;}
 if(kind==='senrin'||kind==='candysenrin')return 30*24*4;
 const spec=TYPES[kind],stars=SIZES[size].stars*(size===3&&['kiku','silver','willow'].includes(kind)?clamp(starDensity,.5,1):1),number=spec.radii.reduce((sum,_,i)=>sum+Math.round(stars*(wide?.72:1)*(spec.layerWeights?.[i]??(i===0?1:i===1?.6:.35))),0);
 return number*(kind==='silver'?12:kind==='willow'?12:kind==='kiku'?16:kind==='sunflower'?36:kind==='candyburst'?24:kind==='candy'?12:10);
}
export function planBudget(shots){
 const events=shots.flatMap(s=>{const t=shellTiming(s.kind,s.size),points=shellPoints(s.kind,s.size,s.position?.wide,s.position?.starDensity??1);return[{at:s.at,upper:s.kind==='ear'?0:1,ears:s.kind==='ear'?1:0,points},{at:s.opening+t.life+.1,upper:s.kind==='ear'?0:-1,ears:s.kind==='ear'?-1:0,points:-points}];}).sort((a,b)=>a.at-b.at||a.upper-b.upper||a.ears-b.ears);
 let upper=0,ears=0,points=0,peakUpper=0,peakEars=0,peakPoints=0;for(const e of events){upper+=e.upper;ears+=e.ears;points+=e.points;peakUpper=Math.max(peakUpper,upper);peakEars=Math.max(peakEars,ears);peakPoints=Math.max(peakPoints,points);}
 return {peakUpper,peakEars,peakPoints};
}
function createRhythmicMusicPlan(analysis,{title='好きな曲',style='auto',variation=0,feeling='auto',voiceRequest=null,programmeStyle=null}={}){
 const duration=analysis.duration;if(!analysis.sections?.length||!analysis.beats?.length)throw Error('曲の区切りを見つけられませんでした。');
 const shots=[],fans=[],sections=[],groundOnlyWindows=[],arrangements=[],chorusEntryCues=[],chorusFollowCues=[],repeatEntryCues=[],featureCues=[],groundReservations=[];
 const upperLimit=14,earLimit=14,upperPointBudget=64000;
 const planSeed=(analysis.seed+Math.imul(variation,0x9e3779b9))>>>0;
 let seed=planSeed;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),signed=()=>random()*2-1;
 const tones=['blue-gold','gold-pink','pink-blue','purple-green','green-red','gold-blue'],longTones=['original','long-pink','long-purple','long-green','long-gold','long-blue'];
 const candyTones=['candy-pink-aqua','candy-lime-purple','candy-mix','candy-aqua','candy-pink'];
 const pick=(list,i)=>list[((i%list.length)+list.length)%list.length];
 const nearest=(at,tolerance=.22)=>{const b=analysis.beats.filter(b=>Math.abs(b.time-at)<=tolerance).sort((a,b)=>Math.abs(a.time-at)-Math.abs(b.time-at))[0];return b?.time??at;};
 // A volley shares its musical anchor, not its height, fuse or exact break time.
 // Sample only when constructing the plan; replay and seeking use these saved values.
 function candidate(kind,size,anchor,group,x=0,palette='original',extra={}){
  const ear=kind==='ear',baseZ=extra.z??(ear?-.68:size===3?.18:size>=10?-.16:.02);
  const heightJitter=signed()*(ear?.006:size===3?.048:size===5?.060:.070);
  const ignitionDelay=ear?.035+.015*random():.015+.095*random();
  const ascentOffset=ear?0:clamp(heightJitter*.85+signed()*.05,-.14,.14);
  const launchX=x+signed()*(ear?.010:.030),launchZ=baseZ+signed()*(ear?.008:.028);
  const centerX=launchX+(ear?0:signed()*.075),centerZ=launchZ+(ear?0:signed()*.055);
  const at=anchor-shellTiming(kind,size).ascent-.060+signed()*(ear?.012:.025);
  const opening=at+shellTiming(kind,size).ascent+ascentOffset+ignitionDelay;
  return {at:round(at),opening:round(opening),anchor:round(anchor),kind,size,group,position:{...extra,x:round(centerX),z:round(centerZ),launchX:round(launchX),launchZ:round(launchZ),palette,heightOffset:round((extra.heightOffset??(size===3?-.12:0))+heightJitter),ignitionDelay,ascentOffset}};
 }
 function commit(list){
  if(list.some(s=>s.at<.08||!Number.isFinite(s.at)||s.opening>duration+1))return false;
  const b=planBudget([...shots,...list]);if(b.peakUpper>upperLimit||b.peakEars>earLimit||b.peakPoints>upperPointBudget)return false;
  shots.push(...list);return true;
 }
 const row=(at,kind,size,count,palette,group,spacing=.38,extra={})=>Array.from({length:count},(_,i)=>candidate(kind,size,at,group,(i-(count-1)/2)*spacing,palette,extra));
 const goldSmall=(at,group,x,motif=0)=>candidate(pick(['kiku','willow','silver'],motif),3,at,group,x,motif%3===2?'kamuro-gold':'original');
 const ears=(at,tone='original',count=7)=>commit(row(at,'ear',2,count,tone,'auto-ear-row',.27,{heightOffset:0}));
 // Conservative per-field reservations include all pending shots. Large and small
 // ground effects have separate capacities (96 comets and 1536 bundle stars).
 function ground(at,mode,styleName='gold',options={}){
  if(at<.1||at>duration+.5)return false;
  const small=mode.startsWith('small-'),rate=options.motionRate??.85;
  const pattern=small?createStarBundlePattern(mode,styleName,planSeed,options):createCometPattern(mode,styleName,planSeed);
  const cost=small?pattern.reduce((n,s)=>n+s.count*s.angles.length,0):pattern.length;
  const span=(Math.max(0,...pattern.map(s=>s.at))+(small?3.3:4.5))/Math.min(1,rate);
  const end=at+span,field=small?'small':'large',limit=small?1536:96;
  const events=[...groundReservations.filter(r=>r.field===field),{at,end,cost}].flatMap(r=>[{at:r.at,delta:r.cost},{at:r.end,delta:-r.cost}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
  let used=0;for(const e of events){used+=e.delta;if(used>limit)return false;}
  groundReservations.push({at,end,cost,field});fans.push({at:round(at),mode,style:styleName,options:{motionRate:rate,...options}});return true;
 }
 const last=analysis.energy.filter(e=>e.time>=analysis.audibleEnd-7&&e.time<analysis.audibleEnd-1),lastLevel=last.reduce((s,e)=>s+e.level,0)/Math.max(1,last.length);
 const exuberant=feeling!=='sentimental'&&(style==='lively'||style==='auto'&&lastLevel>.55);
 const calmFinale=analysis.bpm>=115?(analysis.chorus?.length?'core-crescendo':'color-afterglow'):'silver-cascade';
 const automaticFinale=exuberant?pick(['silver-curtain','festival'],variation):pick([calmFinale,...['silver-cascade','color-afterglow','core-crescendo'].filter(k=>k!==calmFinale)],variation);
 const finalOpening=exuberant?Math.min(duration+.25,analysis.audibleEnd+.25):Math.max(7,analysis.audibleEnd-2.8);
 const voiceFinale=requestedFinale(voiceRequest,{candidate,row,finalOpening,style:programmeStyle}),finaleChoice=voiceFinale?.kind??automaticFinale;
 const finaleLabels={'silver-curtain':'銀かむろで空を覆う','festival':'小玉から多重芯と銀へ','core-crescendo':'八重芯から二尺の多重芯へ','color-afterglow':'色の大星と穂の余韻','silver-cascade':'銀かむろを段階的に重ねる'};
 let finale=voiceFinale?.shots??[];
 if(finaleChoice==='silver-curtain')finale=[...row(finalOpening-.25,'silver',5,7,'original','auto-finale',.32,{wide:true,heightOffset:-.16}),...row(finalOpening,'silver',10,3,'original','auto-finale',.65,{wide:true}),candidate('silver',20,finalOpening+.2,'auto-finale',0,'original',{wide:true})];
 if(finaleChoice==='festival')finale=[...row(finalOpening-3,'candy',5,3,'candy-mix','auto-finale',.65),...row(finalOpening-1.5,'longstar',5,2,'long-gold','auto-finale',1.1),candidate('quad',20,finalOpening,'auto-finale',0),...row(finalOpening+.2,'silver',10,3,'original','auto-finale',.65,{wide:true})];
 if(finaleChoice==='core-crescendo')finale=[...row(finalOpening-4,'longstar',5,2,'long-blue','auto-finale',1.05),...row(finalOpening-1.5,'double',10,2,'original','auto-finale',.92),candidate('triple',20,finalOpening-.5,'auto-finale',-.30),candidate('penta',20,finalOpening+.2,'auto-finale',.30)];
 if(finaleChoice==='color-afterglow')finale=[...row(finalOpening-3,'ear',2,7,'ear-aqua','auto-finale',.27),...row(finalOpening-2,'longstar',10,2,'long-purple','auto-finale',.98),candidate('sparklelarge',20,finalOpening,'auto-finale',0,'long-blue',{whistle:true})];
 if(finaleChoice==='silver-cascade')finale=[...row(finalOpening-2,'silver',5,5,'original','auto-finale',.40,{wide:true,heightOffset:-.16}),...row(finalOpening-.7,'silver',10,2,'original','auto-finale',1.0,{wide:true}),candidate('silver',20,finalOpening,'auto-finale',0,'original',{wide:true})];
 let finalLabel=voiceFinale?.label??finaleLabels[finaleChoice];
 if(!commit(finale)){commit([candidate('sparklelarge',20,finalOpening,'auto-finale',0,'long-blue')]);finalLabel='最後の一輪';}
 const finaleQuietStart=Math.max(0,Math.min(...shots.map(s=>s.at))-2),bodyEnd=Math.max(0,finaleQuietStart-1);
 sections.push({at:finaleQuietStart,label:'締めへ目線を集める'},{at:finalOpening,label:finalLabel});
 if(!voiceFinale||voiceFinale.grand){ground(Math.max(.1,finaleQuietStart),exuberant?'grand-fan-cross':'small-stream-cross',exuberant?'silver':'mountain-blue',{motionRate:.85,interval:.16});}
 ground(Math.max(.1,finalOpening-1),exuberant?'small-color-row':'curtain',exuberant?'tora-row-mix':'silver');
 const quietChoruses=feeling==='festival'?[]:analysis.sections.filter((s,i)=>s.role==='chorus'&&(s.level<.30||s.level<.60&&(analysis.sections[i-1]?.level??0)-s.level>.25));
 const isQuietOpening=at=>quietChoruses.some(s=>at>=s.at-7&&at<s.end-.01);
 const impacts=(analysis.chorus||[]).filter(c=>!quietChoruses.some(s=>Math.abs(s.at-c.at)<.02));
 for(let i=1;i<analysis.sections.length;i++){const s=analysis.sections[i],previous=analysis.sections[i-1];if(s.role==='chorus'&&previous.role==='chorus'&&s.level>.65&&s.level-previous.level>.25)impacts.push({at:s.at,end:s.end,insideChorus:true});}
 impacts.sort((a,b)=>a.at-b.at);
 for(const [i,chorus] of impacts.entries()){
  const at=chorus.at;if(at<4||at>bodyEnd-3)continue;
  const motif=(i+planSeed)%3,tone=pick(tones,i),longTone=pick(longTones,i);
  const list=motif===0?[...row(at,'kiku',3,5,'aqua','auto-chorus-entry',.40),...row(at+.06,'longstar',5,2,longTone,'auto-chorus-entry',1.0),candidate('double',10,at+.12,'auto-chorus-entry')]:motif===1?[...row(at,'candy',5,3,pick(candyTones,i),'auto-chorus-entry',.68),candidate('quad',10,at+.06,'auto-chorus-entry',0)]:[...row(at,'core',5,3,tone,'auto-chorus-entry',.65),candidate('triple',20,at+.08,'auto-chorus-entry',0)];
  if(commit(list)){chorusEntryCues.push({at,end:chorus.end});const groundModes=['woven-cross','grand-fan-cross','mountain-twins'];ground(Math.max(.1,at-1.6),pick(groundModes,i),'silver');ground(at,pick(['small-color-row','small-cross-tight','small-fan'],i),i%2?'mountain-pink':'tora-row-mix');arrangements.push({at,kind:'chorus-entry',motif});sections.push({at:Math.max(0,at-3),label:'サビ候補へ溜める'},{at,label:'サビ候補・一斉開花'});}
 }
 // Reserve detector-derived returns before the regular pulse fills their slots.
 // The original chorus entries keep their priority and seeded gestures.
 const entrySeed=seed;
 for(const [i,head] of automaticRepeatHeads(analysis).entries()){
  const at=head.at;
  if(at<4||at>bodyEnd-3||isQuietOpening(at)||chorusEntryCues.some(c=>Math.abs(c.at-at)<1.6))continue;
  seed=(planSeed^0x3c9e15a7^Math.imul(i+1,0x9e3779b9))>>>0;
  const motif=(planSeed+i+variation)%3,tone=pick(tones,i+variation),longTone=pick(longTones,i+variation);
  const group='auto-chorus-repeat';
  const list=motif===0?
   [...row(at,'double',10,2,'original',group,.90),...row(at+.07,'kiku',3,5,'aqua',group,.38)]:
   motif===1?
   [candidate('triple',20,at,group,0),...row(at+.07,'core',5,3,tone,group,.62)]:
   [...row(at,'longstar',5,2,longTone,group,1.0),candidate('quad',10,at+.04,group,0),...row(at+.08,'kiku',3,3,'pink',group,.52)];
  let chosen=list;
  if(!commit(chosen)){
   chosen=[candidate('quad',10,at,group,0),...row(at+.07,'kiku',3,3,'aqua',group,.55)];
   if(!commit(chosen)){chosen=[candidate('double',10,at,group,0)];if(!commit(chosen))continue;}
  }
  const cue={at,end:head.end,repeat:true,repeatIndex:i+1,detectedAt:head.at,openingDelay:0,
   firstOpening:Math.min(...chosen.map(s=>s.opening)),lastOpening:Math.max(...chosen.map(s=>s.opening)),shells:chosen.length};
  repeatEntryCues.push(cue);chorusEntryCues.push(cue);
  ground(Math.max(.1,at-1.4),pick(['woven-cross','grand-fan-cross','mountain-twins'],i),'silver',{motionRate:.95});
  ground(at,pick(['small-cross-tight','small-color-row','small-fan'],i),i%2?'mountain-pink':'tora-row-mix',{motionRate:.95,interval:.16});
  arrangements.push({at,kind:'chorus-repeat-entry',motif});
  sections.push({at:Math.max(0,at-3),label:'サビの繰り返しへ溜める'},{at,label:'サビの繰り返し・大輪と足元'});
 }
 seed=entrySeed;
 // Reserve a few substantial flowers before pulse fillers can occupy every slot.
 let lastFeature=-30,featureIndex=0;
 for(const section of analysis.sections){
  if(section.level<.52||section.end-section.at<8||section.role==='outro'||quietChoruses.includes(section))continue;
  const at=nearest(section.at+Math.min(9,(section.end-section.at)*.55));if(at<12||at>bodyEnd-7||at-lastFeature<23||isQuietOpening(at)||chorusEntryCues.some(c=>Math.abs(c.at-at)<7))continue;
  const kind=pick(['double','sparklelarge','quad','senrin','penta','triple'],featureIndex+planSeed%6),size=kind==='double'?10:20;
  if(commit([candidate(kind,size,at,'auto-feature',signed()*.25,kind==='sparklelarge'?pick(longTones,featureIndex):'original')])){featureCues.push({at,kind,size});lastFeature=at;featureIndex++;arrangements.push({at,kind:'feature-'+kind,motif:section.motif});sections.push({at:Math.max(0,at-6),label:SIZES[size].label+'・'+TYPES[kind].label+'の見せ場'});ground(Math.max(.1,at-2),'inward',featureIndex%2?'gold':'silver');}
 }
 // Fill only the former post-entry pause. The big entry, finale and ground cues
 // retain their reservations. Do not turn the quiet chorus into a running volley.
 const bodySeed=seed;
 for(const [i,c] of chorusEntryCues.entries()){
  const end=Math.min(c.at+3.4,c.end,bodyEnd),beats=analysis.beats.filter(b=>b.time>=c.at+.35&&b.time<end);
  const accepted=[];seed=(planSeed^0x47a3c59b^Math.imul(i+1,0x9e3779b9))>>>0;
  for(const [j,b] of beats.entries()){
   if(isQuietOpening(b.time))continue;
   const localEnergy=analysis.energy.filter(e=>Math.abs(e.time-b.time)<.5);if(localEnergy.length&&Math.max(...localEnergy.map(e=>e.rms))<analysis.peak*.0015)continue;
   const x=pick([-.78,-.24,.55,.12,-.55,.80,.35],j+(variation%2?3:0));
   //菊 keeps the pulse; willow/kamuro carry it underneath the large flower.
   let shot=goldSmall(b.time,c.repeat?'auto-chorus-repeat-follow':'auto-chorus-follow',x,j===1?1:j===3?2:0);shot.position.starDensity=.5;
   if(!commit([shot])){shot=goldSmall(b.time,c.repeat?'auto-chorus-repeat-follow':'auto-chorus-follow',x,0);shot.position.starDensity=.5;if(!commit([shot]))continue;}
   accepted.push(shot);
  }
  if(accepted.length){chorusFollowCues.push({at:c.at,firstOpening:accepted[0].opening,lastOpening:accepted.at(-1).opening,count:accepted.length,...(c.repeat?{repeat:true,repeatIndex:c.repeatIndex}:{})});arrangements.push({at:c.at,kind:'chorus-gold-follow',motif:i});sections.push({at:accepted[0].anchor,label:'大輪の下で金の３号が走る'});}
 }
 seed=bodySeed;
 const protectedOpening=at=>isQuietOpening(at)||chorusEntryCues.some(c=>at>=c.at-4&&at<c.at+3.4)||featureCues.some(c=>at>=c.at-3.5&&at<c.at+3.5);
 const initialOpening=nearest(Math.min(3.4,bodyEnd/2));if(initialOpening>2&&bodyEnd>4)ears(initialOpening);
 // Shuffled phrase decks prohibit the same arrangement in successive phrases.
 function deckPicker(count){let deck=[],last=-1;return()=>{if(!deck.length){deck=Array.from({length:count},(_,i)=>i);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}if(deck.at(-1)===last)[deck[0],deck[count-1]]=[deck[count-1],deck[0]];}return last=deck.pop();};}
 const nextFast=deckPicker(8),nextBody=deckPicker(10),nextGround=deckPicker(8);
 const groundPhrases=[['small-stream-right','sweep-reverse'],['small-hop-left','small-hop-right'],['small-color-row','cross'],['small-cross-tight','fan'],['small-stream-cross','woven-cross'],['small-fan','curtain'],['small-mountain-bundles','back-rise-twins'],['small-up-tight','inward']];
 for(const section of analysis.sections){
  const start=Math.max(section.at,section.index===0?9:4),end=Math.min(section.end,bodyEnd);if(end-start<2)continue;
  const tone=pick(tones,section.motif+variation),longTone=pick(longTones,section.motif+variation);
  const level=clamp(section.level+(style==='lively'?.18:style==='quiet'?-.42:0),0,1),low=level<.32,high=level>.65;
  const quietChorus=quietChoruses.includes(section),fast=(analysis.bpm>=115||['bright','festival'].includes(feeling))&&style!=='quiet'&&(!section.role||['verse','chorus'].includes(section.role));
  sections.push({at:section.at,label:quietChorus?'静かなサビ候補・足元と穂':fast?section.label+'・小玉と足元の掛け合い':low?'穂と色の余韻':high?'大輪と小玉が重なる一節':'左右に動く彩り',previewStart:Math.max(0,section.at-3)});
  // The ground line exists for every tempo; it never depends on the aerial branch.
  const groundInterval=quietChorus?6.5:low?12:high?7.2:9.5;
  for(let at=start+.3;at<end-1.5;at+=groundInterval){
   const motif=nextGround(),modes=groundPhrases[motif],smallStyle=pick(['mountain-aqua','mountain-pink','mountain-blue','mountain-green','tora-row-mix'],motif+section.index),options={motionRate:fast?.95:.8,interval:clamp(analysis.period*.4,.12,.24)};
   const first=ground(nearest(at),modes[0],smallStyle,options);
   // Quiet passages keep low accents; stronger passages answer with large tails.
   const secondMode=low||quietChorus?pick(['small-hop-center','small-hop-right','small-up-tight'],motif):modes[1];
   ground(nearest(at+(low||quietChorus?2.2:1.25)),secondMode,secondMode.startsWith('small-')?smallStyle:pick(['silver','blue','gold','aqua','pink'],motif),options);
   if(first)arrangements.push({at,kind:'ground-dialogue',motif});
  }
  if(quietChorus){groundOnlyWindows.push({start,end});for(let at=start+1;at<end-1;at+=5)ears(nearest(at));arrangements.push({at:start,kind:'quiet-chorus-ears-and-ground',motif:section.motif});continue;}
  if(fast){
   const pulseBeats=analysis.beats.filter(b=>b.time>=start+.25&&b.time<end-.4),stride=high?1:2;
   for(let phrase=0;phrase<pulseBeats.length;phrase+=8){
    const motif=nextFast(),color=pick(['aqua','pink','blue','purple','green','white'],section.index+motif),candyTone=pick(candyTones,section.index+motif);
    arrangements.push({at:pulseBeats[phrase].time,kind:'fast-phrase-'+motif,motif});
    for(let j=0;j<8&&phrase+j<pulseBeats.length;j+=stride){const at=pulseBeats[phrase+j].time;if(protectedOpening(at))continue;
     const localEnergy=analysis.energy.filter(e=>Math.abs(e.time-at)<1);if(localEnergy.length&&Math.max(...localEnergy.map(e=>e.rms))<analysis.peak*.0015)continue;
     const accent=j===0||j===4,x=motif%2?(3.5-j)*.23:(j-3.5)*.23;let list;
     if(motif===0)list=accent?row(at,'kiku',3,high?5:3,color,'auto-fast-small',.38):[candidate('core',5,at,'auto-fast-small',x,tone)];
     if(motif===1)list=accent?row(at,'candy',5,2,candyTone,'auto-fast-small',.9):[candidate('kiku',3,at,'auto-fast-small',x,color)];
     if(motif===2)list=accent?[candidate('sunflower',5,at,'auto-fast-small',j?-.52:.52)]:row(at,'kiku',3,2,color,'auto-fast-small',1.1);
     if(motif===3)list=accent?[candidate('longstar',5,at,'auto-fast-small',j?.55:-.55,longTone)]:[candidate('kiku',3,at,'auto-fast-small',x,color)];
     if(motif===4)list=accent?row(at,'core',5,2,tone,'auto-fast-small',1.0):[candidate('candy',3,at,'auto-fast-small',x,candyTone)];
     if(motif===5)list=accent?[candidate('petalflower',5,at,'auto-fast-small',j?.5:-.5,flowerPalette(tone))]:[candidate('kiku',3,at,'auto-fast-small',x,color)];
     if(motif===6)list=accent?[candidate('candyburst',5,at,'auto-fast-small',j?-.55:.55,pick(['candy-aqua','candy-pink','candy-purple'],section.index))]:[candidate('candy',3,at,'auto-fast-small',x,candyTone)];
     if(motif===7)list=accent?row(at,'kiku',3,3,color,'auto-fast-small',.58):[candidate('core',5,at,'auto-fast-small',x,tone)];
     // A few lingering gold tails weave through the coloured fast phrases.
     if(j===2||j===6)list=list.map(s=>{if(s.size!==3)return s;const gold=(section.index+motif+(j===6?1:0))%3;return {...s,kind:pick(['kiku','willow','silver'],gold),position:{...s.position,palette:gold===2?'kamuro-gold':'original'}};});
     if(!commit(list))commit([candidate('kiku',3,at,'auto-fast-small',x,j===2||j===6?'original':color)]);
    }
   }
   continue;
  }
  const interval=high?clamp(analysis.period*8,4.8,7.5):low?clamp(analysis.period*16,8.8,12):clamp(analysis.period*12,6.5,10);
  for(let at=nearest(start+1);at<end-.6;at=nearest(at+interval)){
   if(protectedOpening(at))continue;
   const localEnergy=analysis.energy.filter(e=>Math.abs(e.time-at)<1.5);if(localEnergy.length&&Math.max(...localEnergy.map(e=>e.rms))<analysis.peak*.0015)continue;
   const motif=nextBody();let list,name;
   if(low&&motif%3===0){if(ears(at,motif%2?'ear-aqua':'original'))arrangements.push({at,kind:'ear-row',motif});continue;}
   if(low){const kind=pick(['longstar','willow','sparklelarge'],motif);name='quiet-'+kind;list=[candidate(kind,kind==='willow'?10:5,at,'auto-single',signed()*.55,kind==='willow'?'original':longTone)];}
   else if(motif===0){name='pyramid';list=[...row(at,'kiku',3,5,'aqua','auto-pyramid',.43),...row(at+.15,'longstar',5,2,longTone,'auto-pyramid',1.0),candidate('core',10,at+.3,'auto-pyramid',0,tone,{heightOffset:.12})];}
   else if(motif===1){name='sparkling-pair';list=row(at,'sparklelarge',5,2,longTone,'auto-sparkle-pair',1.05);}
   else if(motif===2){name='low-sweep';list=Array.from({length:5},(_,i)=>i===1||i===3?goldSmall(at+i*analysis.period*.5,'auto-sweep',(i-2)*.43,section.index+i):candidate('kiku',3,at+i*analysis.period*.5,'auto-sweep',(i-2)*.43,pick(['blue','aqua','pink','purple','green'],i)));}
   else if(motif===3){name='sunflower-trio';list=row(at,'sunflower',5,3,'original','auto-sunflower-trio',.64);}
   else if(motif===4){name='long-petal-and-shell';list=[...row(at,'goldflower',5,2,flowerPalette(tone),'auto-long-petal-pair',.95),candidate('double',10,at+1.0,'auto-crown',0)];}
   else if(motif===5){name='large-and-low';list=[...row(at,'kiku',3,3,high?'pink':'blue','auto-low-and-high',.65),candidate('longstar',10,at+.2,'auto-low-and-high',0,longTone)];}
   else if(motif===6){name='candy-crossing';list=Array.from({length:4},(_,i)=>candidate('candy',5,at+i*analysis.period*.6,'auto-candy-cross',(i%2?1:-1)*(.72-i*.12),pick(candyTones,section.index)));}
   else if(motif===7){name='silver-pair';list=row(at,'silver',10,2,'original','auto-silver-pair',.98,{wide:true});}
   else if(motif===8){name='core-and-candy';list=[...row(at,'candyburst',5,2,'candy-aqua','auto-core-candy',1.0),candidate('quad',10,at+.3,'auto-core-candy')];}
   else{name='willow-and-stars';list=[candidate('willow',10,at,'auto-willow',-.45),candidate('sparklelarge',5,at+.7,'auto-willow',.55,longTone)];}
   if(!commit(list)){list=[candidate('core',5,at,'auto-single-fallback',signed()*.6,tone)];name='single-fallback';if(!commit(list))continue;}
   arrangements.push({at,kind:name,motif});
  }
 }
 shots.sort((a,b)=>a.at-b.at);shots.forEach((s,i)=>{s.reviewIndex=i;s.position.earSeed=(planSeed+i*313)>>>0;});fans.sort((a,b)=>a.at-b.at);if(!sections.some(s=>s.at===0))sections.push({at:0,label:'好きな曲の幕開け'});sections.sort((a,b)=>a.at-b.at);
 const showDuration=Math.max(duration+1,...shots.map(s=>s.opening+shellTiming(s.kind,s.size).life+2),...groundReservations.map(r=>r.end+1));
 return {title,revision:'1.2.95 · サビから金の三号へ',autoGenerated:true,duration,showDuration,tempoEstimate:analysis.bpm,finalOpening,finale:{kind:finaleChoice,label:finalLabel},finalPreviewStart:Math.max(0,finaleQuietStart-3),middlePreviewStart:duration*.45,pyramidAt:duration*.5,upperLimit,earLimit,upperPointBudget,sections,shots,fans,beats:analysis.beats,energy:analysis.energy,groundOnlyWindows,arrangements,chorusEntryCues,chorusFollowCues,repeatEntryCues,featureCues,analysisSummary:{structureModel:analysis.structure?.model||null,chorusCount:analysis.chorus?.length||0,repeatEntryCount:repeatEntryCues.length,fastSmallShots:shots.filter(s=>s.group==='auto-fast-small').length,goldSmallShots:shots.filter(s=>s.size===3&&(['willow','silver'].includes(s.kind)||s.kind==='kiku'&&s.position.palette==='original')).length,beatConfidence:analysis.beatConfidence,sectionCount:analysis.sections.length,style,variation,audibleEnd:analysis.audibleEnd,shellKinds:[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))],groundModes:[...new Set(fans.map(f=>f.mode))]},budget:planBudget(shots),method:analysis.method+'; seeded phrase decks, natural launch variation, independent ground dialogue, varied finales and gold small shells following chorus entries. No existing authored plan or song title used in directing.'};
}

// Keep the proven rhythmic director and its random sequence intact.
export function createAutoMusicPlan(analysis,options={}){
 const pacing=options.voiceRequest?.density==='sparse'||['sentimental','grand'].includes(options.voiceRequest?.feeling)?'slow':options.pacing??'auto',feeling=musicFeeling(options.voiceRequest?.feeling??(options.voiceRequest?.density==='dense'?'festival':options.feeling)).value;
 const slow=pacing==='slow'||pacing==='auto'&&(feeling==='grand'||analysis.bpm<100&&!['bright','festival'].includes(feeling));
 const programmeStyle=voiceProgrammeStyle(drawProgrammeStyle(analysis.seed,options.variation??0,{feeling,bpm:analysis.bpm}),options.voiceRequest);
 const directedOptions={...options,earScene:options.voiceRequest?.landscape==='sea'&&options.voiceRequest?.density!=='sparse'?'sea-sunset-long':programmeStyle.color==='gold'?'gold':options.earScene,programmeStyle,feeling,style:feeling==='festival'?'lively':options.style??'auto'};
 const plan=slow?createSlowMusicPlan(analysis,directedOptions,{shellTiming,shellPoints,planBudget}):createRhythmicMusicPlan(analysis,directedOptions);
 plan.directingProfile=slow?'slow':'rhythmic';plan.analysisSummary.pacing=pacing;
 if(!slow)plan.effectiveTempo=analysis.bpm;
 const felt=directMusicFeeling(plan,analysis,directedOptions,{shellTiming,planBudget});
 let ears=addEarPassages(felt,analysis,directedOptions,{shellTiming,shellPoints,planBudget});
 if(options.voiceRequest?.landscape==='sea'&&options.voiceRequest?.density!=='sparse'&&!ears.earPassages.length)ears=addEarPassages(ears,analysis,{...directedOptions,earScene:'alternating'},{shellTiming,shellPoints,planBudget});
 const flowers=programmeStyle.flowerFocus?addFlowerPassages(ears,analysis,directedOptions,{shellTiming,shellPoints,planBudget}):Object.assign(ears,{flowerPassages:[]});
 const result=applyProgrammeStyle(flowers,analysis,directedOptions,{shellTiming,shellPoints,planBudget});
 if(programmeStyle.color==='gold')result.earScene=options.earScene??'auto';
 Object.assign(result.analysisSummary,{earShots:result.shots.filter(s=>s.kind==='ear').length,fastSmallShots:result.shots.filter(s=>['auto-fast-small','feeling-intro-festival','auto-flower-carpet'].includes(s.group)).length,goldSmallShots:result.shots.filter(s=>s.size===3&&(['willow','silver'].includes(s.kind)||s.kind==='kiku'&&s.position.palette==='original')).length,groundModes:[...new Set(result.fans.map(f=>f.mode))]});
 const helpers={shellTiming,shellPoints,planBudget};
 const voiced=directVoicePlan(result,options.voiceRequest,helpers);
 const opened=naturalProgrammeOpening(voiced,helpers);
 return addGoldAccents(limitProgrammeCapacity(opened,helpers),helpers);
}
