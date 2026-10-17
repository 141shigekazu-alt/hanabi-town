import {requestedFinale} from './voice-finale.js';
import {automaticRepeatHeads} from './auto-repeat-heads.js?v=1.3.0';
import {SIZES,TYPES} from './fireworks.js?v=1.3.0';
import {createCometPattern} from './comets.js?v=1.3.0';
import {createStarBundlePattern} from './star-bundles.js?v=1.3.0';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),round=x=>+x.toFixed(4)||0;
// A slow song needs phrases with space and a stable colour, not a slowed volley.
// No song names, lyrics or authored timecodes enter this director.
export function createSlowMusicPlan(analysis,{title='好きな曲',style='auto',variation=0,voiceRequest=null,programmeStyle=null}={}, {shellTiming,planBudget}){
 if(!analysis.sections?.length||!analysis.beats?.length)throw Error('曲の区切りを見つけられませんでした。');
 const chorusOpeningDelay=1.0;
 const {duration}=analysis,upperLimit=14,earLimit=14,upperPointBudget=64000;
 const planSeed=(analysis.seed+Math.imul(variation,0x9e3779b9))>>>0;
 let seed=planSeed;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),signed=()=>random()*2-1;
 const pick=(a,i)=>a[((i%a.length)+a.length)%a.length];
 // Forced slow pacing can recover the musical half-time without relabelling the
 // model's BPM or changing any chorus boundary. Automatic pacing never halves it.
 const effectiveTempo=analysis.bpm>=115?analysis.bpm/2:analysis.bpm;
 const period=60/clamp(effectiveTempo,45,110);
 const shots=[],fans=[],sections=[],arrangements=[],chorusEntryCues=[],chorusFollowCues=[],repeatEntryCues=[],featureCues=[],slowScenes=[],groundOnlyWindows=[],groundReservations=[];
 const nearest=at=>{let best=at,d=.22;for(const b of analysis.beats){const v=Math.abs(b.time-at);if(v<d){best=b.time;d=v;}}return best;};
 function candidate(kind,size,anchor,group,x=0,palette='original',extra={}){
  const ear=kind==='ear',z=ear?-.68:size===3?.18:size>=10?-.16:.02;
  const heightJitter=signed()*(ear?.006:size===3?.048:size===5?.06:.07);
  const ignitionDelay=ear?.035+.015*random():.015+.095*random();
  const ascentOffset=ear?0:clamp(heightJitter*.85+signed()*.05,-.14,.14);
  const launchX=x+signed()*(ear?.01:.03),launchZ=z+signed()*(ear?.008:.028);
  const centerX=launchX+(ear?0:signed()*.075),centerZ=launchZ+(ear?0:signed()*.055);
  const at=anchor-shellTiming(kind,size).ascent-.06+signed()*(ear?.012:.025);
  return {at:round(at),opening:round(at+shellTiming(kind,size).ascent+ascentOffset+ignitionDelay),anchor:round(anchor),kind,size,group,position:{...extra,x:round(centerX),z:round(centerZ),launchX:round(launchX),launchZ:round(launchZ),palette,heightOffset:round((extra.heightOffset??(size===3?-.12:0))+heightJitter),ignitionDelay,ascentOffset}};
 }
 function commit(list){
  if(list.some(s=>s.at<.08||!Number.isFinite(s.at)||s.opening>duration+1))return false;
  const b=planBudget([...shots,...list]);if(b.peakUpper>upperLimit||b.peakEars>earLimit||b.peakPoints>upperPointBudget)return false;
  shots.push(...list);return true;
 }
 const row=(at,kind,size,count,palette,group,spacing=.5,extra={})=>Array.from({length:count},(_,i)=>candidate(kind,size,at,group,(i-(count-1)/2)*spacing,palette,extra));
 function ground(at,mode,styleName='gold',options={}){
  if(at<.1||at>duration+.5)return false;
  const small=mode.startsWith('small-'),rate=options.motionRate??.78;
  const pattern=small?createStarBundlePattern(mode,styleName,planSeed,options):createCometPattern(mode,styleName,planSeed);
  const cost=small?pattern.reduce((n,s)=>n+s.count*s.angles.length,0):pattern.length;
  const span=(Math.max(0,...pattern.map(s=>s.at))+(small?3.3:4.5))/Math.min(1,rate);
  const end=at+span,field=small?'small':'large',limit=small?1536:96;
  const events=[...groundReservations.filter(r=>r.field===field),{at,end,cost}].flatMap(r=>[{at:r.at,delta:r.cost},{at:r.end,delta:-r.cost}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
  let used=0;for(const e of events){used+=e.delta;if(used>limit)return false;}
  groundReservations.push({at,end,cost,field});fans.push({at:round(at),mode,style:styleName,options:{motionRate:rate,...options}});return true;
 }
 // Reserve the final tableau and chorus entries before placing individual flowers.
 const finalOpening=Math.max(7,Math.min(duration+.15,analysis.audibleEnd-1.2));
 const voiceFinale=requestedFinale(voiceRequest,{candidate,row,finalOpening,style:programmeStyle});
 const finaleChoice=voiceFinale?.kind??pick(['gold-afterglow','aqua-afterglow','ground-and-willow'],variation);
 const finalLabel=voiceFinale?.label??{'gold-afterglow':'金の尾を段階的に重ねて余韻へ','aqua-afterglow':'水色の大星と穂の余韻','ground-and-willow':'足元から柳の一輪へ'}[finaleChoice];
 let finale=voiceFinale?.shots;
 if(finaleChoice==='gold-afterglow')finale=[candidate('willow',3,finalOpening-4,'auto-finale',-.65),candidate('silver',5,finalOpening-2,'auto-finale',.65,'kamuro-gold'),candidate('silver',10,finalOpening,'auto-finale',0,'kamuro-gold',{wide:true})];
 if(finaleChoice==='aqua-afterglow')finale=[...row(finalOpening-3,'ear',2,5,'ear-aqua','auto-finale',.3),candidate('longstar',5,finalOpening-2,'auto-finale',-.55,'long-blue'),candidate('longstar',10,finalOpening,'auto-finale',.25,'long-blue')];
 if(finaleChoice==='ground-and-willow')finale=[candidate('kiku',3,finalOpening-4,'auto-finale',-.55),candidate('willow',10,finalOpening,'auto-finale',.15)];
 if(!commit(finale))commit([candidate('willow',5,finalOpening,'auto-finale')]);
 const finaleQuietStart=Math.max(0,Math.min(...shots.map(s=>s.at))-3),bodyEnd=Math.max(0,finaleQuietStart-1);
 if(!voiceFinale||voiceFinale.grand){ground(Math.max(.1,finaleQuietStart),pick(['small-stream-cross','small-hop-left','small-fan'],variation),finaleChoice==='aqua-afterglow'?'mountain-aqua':'mountain-gold',{interval:.3});
 ground(Math.max(.1,finalOpening-1.8),finaleChoice==='ground-and-willow'?'curtain':'small-up-tight',finaleChoice==='aqua-afterglow'?'mountain-aqua':'gold');}
 sections.push({at:finaleQuietStart,label:'締めへ間を置く'},{at:finalOpening,label:finalLabel});
 const quietChoruses=analysis.sections.filter((s,i)=>s.role==='chorus'&&(s.level<.3||s.level<.6&&(analysis.sections[i-1]?.level??0)-s.level>.25));
 const isQuiet=at=>quietChoruses.some(s=>at>=s.at-4&&at<s.end);
 const impacts=(analysis.chorus??[]).filter(c=>!quietChoruses.some(s=>Math.abs(s.at-c.at)<.02));
 for(let i=1;i<analysis.sections.length;i++){const s=analysis.sections[i],p=analysis.sections[i-1];if(s.role==='chorus'&&p.role==='chorus'&&s.level>.65&&s.level-p.level>.25)impacts.push({at:s.at,end:s.end});}
 impacts.sort((a,b)=>a.at-b.at);
 for(const [i,head] of automaticRepeatHeads(analysis).entries()){
  if(!isQuiet(head.at)&&!impacts.some(c=>Math.abs(c.at-head.at)<1.6))impacts.push({...head,repeat:true,repeatIndex:i+1});
 }
 for(const [i,detected] of impacts.entries()){
  // Keep the analysis boundary; move the whole entry gesture by one breath.
  const c={...detected,at:detected.at+chorusOpeningDelay};
  if(c.at<6||c.at>bodyEnd-3)continue;
  const motif=(i+planSeed)%3;
  const list=motif===0?[...row(c.at,'kiku',3,5,'aqua','auto-chorus-entry',.4),...row(c.at+.06,'longstar',5,2,'long-gold','auto-chorus-entry',1),candidate('double',10,c.at+.12,'auto-chorus-entry')]:motif===1?[...row(c.at,'core',5,3,'blue-gold','auto-chorus-entry',.65),candidate('triple',20,c.at+.08,'auto-chorus-entry')]:[...row(c.at,'longstar',5,2,'long-blue','auto-chorus-entry',1),candidate('double',10,c.at+.1,'auto-chorus-entry')];
  if(detected.repeat)for(const s of list)s.group='auto-chorus-repeat';
  if(!commit(list))continue;
  chorusEntryCues.push({at:c.at,detectedAt:detected.at,openingDelay:chorusOpeningDelay,end:c.end,...(detected.repeat?{repeat:true,repeatIndex:detected.repeatIndex}:{})});if(detected.repeat)repeatEntryCues.push(chorusEntryCues.at(-1));arrangements.push({at:c.at,kind:detected.repeat?'slow-chorus-repeat-entry':'slow-chorus-entry',motif});sections.push({at:Math.max(0,c.at-4),label:'静かにサビへ溜める'},{at:c.at,label:detected.repeat?'サビの繰り返し・空を重ねる':'サビ候補・空を重ねる'});
  ground(c.at-1.5,pick(['woven-cross','mountain-twins','grand-fan-cross'],i),'gold',{motionRate:.9});
  ground(c.at,pick(['small-fan','small-cross-tight','small-color-row'],i),'mountain-aqua',{motionRate:.9,interval:.2});
  const accepted=[];
  for(let j=0;j<3;j++){
   const anchor=chorusOpeningDelay+nearest(detected.at+.65+j*clamp(period*2,1.35,2));if(anchor>=Math.min(c.end,bodyEnd)||isQuiet(anchor))break;
   const kind=pick(['kiku','willow','silver'],j),palette=kind==='silver'?'kamuro-gold':'original';
   const shot=candidate(kind,3,anchor,detected.repeat?'auto-chorus-repeat-follow':'auto-chorus-follow',pick([-.72,.2,.72],j),palette,{starDensity:.5});
   if(commit([shot]))accepted.push(shot);
  }
  if(accepted.length)chorusFollowCues.push({at:c.at,firstOpening:accepted[0].opening,lastOpening:accepted.at(-1).opening,count:accepted.length,...(detected.repeat?{repeat:true,repeatIndex:detected.repeatIndex}:{})});
 }
 const protectedOpening=at=>isQuiet(at)||chorusEntryCues.some(c=>at>=(c.detectedAt??c.at)-4&&at<(c.detectedAt??c.at)+5);
 const labels={single:'一玉ずつ、間を味わう',gold:'金の菊・柳・かむろを味わう',aqua:'水色の菊と大星を味わう',ground:'足元の大トラ・小トラへ'};
 let phrase=0,calmPhrase=variation;
 for(const [i,s] of analysis.sections.entries()){
  const start=Math.max(3.5,s.at),end=Math.min(s.end,bodyEnd);if(end-start<2.5)continue;
  const low=s.level<.32||style==='quiet'||s.role==='intro'||s.role==='outro',previous=analysis.sections[i-1];
  const chorus=s.role==='chorus'&&!quietChoruses.includes(s),drop=previous&&(previous.role==='chorus'&&s.role!=='chorus'||previous.level-s.level>.25);
  const span=end-start,pieces=Math.max(1,Math.floor(span/clamp(period*24,17,24)));
  for(let n=0;n<pieces;n++){
   const a=start+span*n/pieces,b=start+span*(n+1)/pieces;
   let mode=chorus?'chorus':quietChoruses.includes(s)?'ground':s.role==='intro'?'single':s.role==='outro'?'aqua':drop?'gold':pick(['single','gold','aqua','ground'],calmPhrase++);
   if(drop&&n===0)calmPhrase=Math.floor(calmPhrase/4)*4+2;
   if(drop&&n>0)mode=pick(['aqua','ground','single'],n-1+variation);
   phrase++;
   const label=mode==='chorus'?'サビの大輪と小玉を緩やかに重ねる':labels[mode];
   const scene={start:round(a),end:round(b),mode,label,previewStart:Math.max(0,a-2)};
   slowScenes.push(scene);sections.push({at:round(a),label});arrangements.push({at:round(a),kind:'slow-'+mode,motif:phrase});
   if(mode==='ground'){
    // Leave room for the previous flower's tail before the ground takes over.
    const quietStart=a+Math.min(1.2,(b-a)*.12);groundOnlyWindows.push({start:quietStart,end:b});scene.previewStart=quietStart;
    for(let at=quietStart;at<b-1;at+=clamp(period*8,5.5,9)){
     const j=Math.floor((at-quietStart)/(period*8))+phrase;
     ground(nearest(at),pick(['small-hop-left','small-hop-right','small-stream-cross','small-up-tight'],j),j%2?'mountain-aqua':'mountain-gold',{interval:.3});
     if(at+2<b-1)ground(nearest(at+2),pick(['curtain','inward','sweep','fan'],j),j%2?'aqua':'gold');
    }
    continue;
   }
   const cadence=chorus?clamp(period*(style==='quiet'?4:2),1.4,2.8):clamp(period*(low?8:5),3.5,7.5);
   let j=0;for(let at=nearest(a+.7);at<b-.7;at=nearest(at+cadence),j++){
    if(protectedOpening(at))continue;
    if(!chorus&&shots.some(t=>t.group.startsWith('auto-slow-')&&t.group!=='auto-slow-chorus'&&Math.abs(t.anchor-at)<3.35))continue;
    const local=analysis.energy.filter(e=>Math.abs(e.time-at)<.6);if(local.length&&Math.max(...local.map(e=>e.rms))<analysis.peak*.0015)continue;
    const x=pick([-.64,.22,.64,-.2,0],j+phrase+variation);let kind='kiku',size=3,palette='aqua';
    if(mode==='gold'){kind=pick(['kiku','willow','silver'],j);palette=kind==='silver'?'kamuro-gold':'original';}
    if(mode==='aqua'&&j%3===2){kind='longstar';size=5;palette='long-blue';}
    if(mode==='single'){palette=j%2?'aqua':'original';}
    if(mode==='chorus'){
     if(j%4===0&&s.level>.55){kind=pick(['longstar','double','silver'],Math.floor(j/4)+phrase);size=kind==='double'?10:5;palette=kind==='longstar'?'long-blue':kind==='silver'?'kamuro-gold':'original';}
     else {kind=pick(['kiku','willow','silver'],j);palette=kind==='silver'?'kamuro-gold':kind==='kiku'&&j%2?'aqua':'original';}
    }
    // Individual calm flowers never spill far into the next quiet phrase.
    if(!chorus&&at+shellTiming(kind,size).life>b+3)continue;
    const shot=candidate(kind,size,at,'auto-slow-'+mode,x,palette);
    if(commit([shot])&&size>=10){featureCues.push({at:shot.anchor,kind,size});}
   }
   // A single restrained ground answer in a long calm phrase, more in a chorus.
   const interval=chorus?clamp(period*8,6,9):clamp(period*20,14,22);
   for(let at=a+2;at<b-2;at+=interval){if(!chorus&&b-a<10)break;
    ground(nearest(at),pick(['small-hop-center','small-stream-right','small-fan'],phrase),mode==='gold'?'mountain-gold':'mountain-aqua',{interval:.28});
    if(chorus&&at+2<b-1)ground(nearest(at+2),pick(['curtain','inward','fan'],phrase),'gold');
   }
  }
 }
 // Clear tails and launches out of ground-only windows. Reserved chorus/finale
 // flowers bound the usable window; ordinary neighbouring flowers yield to it.
 for(let i=groundOnlyWindows.length-1;i>=0;i--){
  const w=groundOnlyWindows[i];
  for(const s of shots.filter(s=>['auto-chorus-entry','auto-chorus-follow','auto-chorus-repeat','auto-chorus-repeat-follow','auto-finale'].includes(s.group))){
   const tail=s.opening+shellTiming(s.kind,s.size).life+.15;
   if(s.at<w.start&&tail>w.start)w.start=Math.min(w.end,tail);
   else if(s.at>=w.start&&s.at<w.end)w.end=s.at;
  }
  if(w.end-w.start<1){groundOnlyWindows.splice(i,1);continue;}
  for(let j=shots.length-1;j>=0;j--){const s=shots[j];if(s.kind!=='ear'&&s.at<w.end&&s.opening+shellTiming(s.kind,s.size).life+.15>w.start)shots.splice(j,1);}
 }
 shots.sort((a,b)=>a.at-b.at);shots.forEach((s,i)=>{s.reviewIndex=i;s.position.earSeed=(planSeed+i*313)>>>0;});fans.sort((a,b)=>a.at-b.at);sections.push({at:0,label:'一玉ずつ、静かな幕開け'});sections.sort((a,b)=>a.at-b.at);
 const showDuration=Math.max(duration+1,...shots.map(s=>s.opening+shellTiming(s.kind,s.size).life+2),...groundReservations.map(r=>r.end+1));
 return {title,revision:'1.3.0 · スロー曲の間とサビ',autoGenerated:true,duration,showDuration,tempoEstimate:analysis.bpm,effectiveTempo,chorusOpeningDelay,finalOpening,finale:{kind:finaleChoice,label:finalLabel},finalPreviewStart:Math.max(0,finaleQuietStart-3),middlePreviewStart:duration*.45,pyramidAt:duration*.5,upperLimit,earLimit,upperPointBudget,sections,shots,fans,beats:analysis.beats,energy:analysis.energy,groundOnlyWindows,arrangements,chorusEntryCues,chorusFollowCues,repeatEntryCues,featureCues,slowScenes,analysisSummary:{structureModel:analysis.structure?.model||null,chorusCount:analysis.chorus?.length||0,repeatEntryCount:repeatEntryCues.length,fastSmallShots:0,goldSmallShots:shots.filter(s=>s.size===3&&(['willow','silver'].includes(s.kind)||s.kind==='kiku'&&s.position.palette==='original')).length,beatConfidence:analysis.beatConfidence,sectionCount:analysis.sections.length,style,variation,audibleEnd:analysis.audibleEnd,shellKinds:[...new Set(shots.filter(s=>s.kind!=='ear').map(s=>s.kind))],groundModes:[...new Set(fans.map(f=>f.mode))]},budget:planBudget(shots),method:analysis.method+'; slow single flowers, stable gold/aqua phrases, ground-only passages, restrained chorus continuation and varied gentle finales; slow chorus entry gestures delayed 1.0 seconds without moving detected boundaries. No authored cues or song titles used in directing.'};
}
