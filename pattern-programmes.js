import {variationRandom} from './flower-variation.js';
import {PATTERN_PROFILE,patternPalettes,patternPaletteOptions} from './pattern-shells.js?v=1.3.10';
import {groundReservation} from './flower-programmes.js?v=1.3.13';
export const PATTERN_MODES=[{id:'heart',label:'ハート10連発'},{id:'double',label:'二重ハート10連発'},{id:'hearts',label:'ハート２種を混ぜて10連発'},{id:'mixed',label:'ハートとニコちゃん10連発'},{id:'smile',label:'ニコちゃん10連発'}];
export function patternChoiceRequest(kind='mixed',amount='little'){
 const modes={heart:'ハート',double:'二重ハート',smile:'ニコちゃん',mixed:'ハートとニコちゃん'},amounts={little:'少し',more:'多めに',lots:'たくさん'};
 if(!modes[kind]||!amounts[amount])throw Error('型物の種類と量を選んでください。');
 return {version:2,source:'pattern-button',text:'',recognized:true,patterns:kind,patternAmount:amount,summary:modes[kind]+'を'+(kind==='mixed'?'まぜて':'')+amounts[amount]+'入れる'};
}
const round=v=>+v.toFixed(5),ascent=size=>(1+size*.035)*1.2*(2.62/1.62);
export function patternLaunchSites(seed){
 const r=variationRandom(seed,0x53495445);
 // Back rows include the established large/small tora locations; the remaining
 // sites span the middle and near streets. Shuffle to avoid a visible sweep.
 const sites=[[-1.15,-.72],[-.55,-.84],[.20,-.68],[1.15,-.72],[-1.08,-.28],[-.40,-.12],[.85,-.20],[-.92,.42],[.35,.48],[1.14,.32]].map(([x,z])=>({x:x+(r()-.5)*.09,z:z+(r()-.5)*.06}));
 for(let i=sites.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[sites[i],sites[j]]=[sites[j],sites[i]];}
 return sites;
}
export function patternPassage({start=0,seed=1,mode='mixed',accent=false,count=10,phraseBars=0,beatPeriod=.5,palette:requestedPalette=null}={}){
 if(![...PATTERN_MODES.map(m=>m.id),'pair'].includes(mode))throw Error('未知の型物のまとまりです。');
 const r=variationRandom(seed,0x5041434b),shots=[],firstOpening=start+ascent(3)+.18;
 const originalRhythm=count<10?'gentle':r()<.25?'together':'rapid',gap=count<10?.72:originalRhythm==='together'?.018:.11+r()*.04;
 const bars=[2,4].includes(phraseBars)?phraseBars:0,period=Number.isFinite(beatPeriod)&&beatPeriod>0?beatPeriod:.5,rhythm=bars?'phrase':originalRhythm;
 // Ten small shells span a musical phrase instead of all opening in a second.
 // Half-beat spacing keeps a relaxed, varied pulse without a rapid clump.
 const openingOffset=i=>bars?Math.round(i*(bars*4-.5)/Math.max(1,count-1)*2)/2*period:i*gap;
 const color=patternPalettes[Math.floor(r()*patternPalettes.length)].id,sites=patternLaunchSites(seed);
 const add=(kind,size,opening,x,z,palette,index)=>{
  const ignitionDelay=.018+r()*.045,ascentOffset=(r()-.5)*.06,at=opening-ascent(size)-ignitionDelay-ascentOffset;
  shots.push({at:round(at),opening:round(opening),anchor:round(opening),kind,size,group:'auto-pattern-'+mode,position:{x:round(x),z:round(z),launchX:round(x),launchZ:round(z),heightOffset:(r()-.5)*.05,palette,patternSeed:(seed^Math.imul(index+1,0x9e3779b9))>>>0,patternScatter:1.65,ignitionDelay,ascentOffset,startAt:round(at),patternGroup:true}});
 };
 for(let i=0;i<count;i++){
  const kind=mode==='heart'?'patternheart':mode==='double'?'patterndoubleheart':mode==='hearts'?(i%2?'patternheart':'patterndoubleheart'):mode==='smile'?'patternpeace':i%2?'patternpeace':'patternheart';
  const selectedPalette=requestedPalette&&patternPaletteOptions(kind).some(p=>p.id===requestedPalette)?requestedPalette:null;
  if(requestedPalette&&kind!=='patternpeace'&&!selectedPalette)throw Error('選んだ配色をこの型物に使えません。配色を選び直してください。');
  const palette=kind==='patternpeace'?'original':selectedPalette??(kind==='patterndoubleheart'?(i%3===0?'double-red-pink':'original'):color);
  const {x,z}=sites[i];
  add(kind,i%3===0?2:3,firstOpening+openingOffset(i)+(rhythm==='together'||bars?0:r()*.025),x,z,palette,i);
 }
 if(accent){const opening=firstOpening+openingOffset(count-1)+1.65;for(const [i,x] of [-.72,.72].entries())add('patternpeace',5,opening,x,-.18,'original',10+i);}
 shots.sort((a,b)=>a.at-b.at);const finishAt=Math.max(...shots.map(s=>s.opening+PATTERN_PROFILE.life))+.45;
 const name=PATTERN_MODES.find(m=>m.id===mode)?.label??'型物の連発';
 return {mode,label:bars?name.replace('10連発','')+' · '+bars+'小節の連打':name,shots,firstOpening,finishAt,rhythm,accent,bars,beatPeriod:bars?period:null,openingSpan:openingOffset(count-1)};
}
export function patternCycle(seed=1,start=0){
 const shots=[],passages=[];let next=start;
 for(const [index,mode] of PATTERN_MODES.entries()){
  const part=patternPassage({start:next,seed:(seed+Math.imul(index+1,0x531a2f9d))>>>0,mode:mode.id,accent:index===4});
  shots.push(...part.shots);passages.push(part);next=part.finishAt+1.1;
 }
 return {label:'型物の連発をひと巡り',shots,passages,finishAt:passages.at(-1).finishAt};
}
const overlaps=(a,b)=>a.start<b.end&&b.start<a.end;
// Newly composed music plans only. Keep authored/saved plans intact and protect
// silence, slow direction, finale, chorus gestures, flowers and ground passages.
export function addPatternPassages(plan,analysis,options,helpers){
 plan.patternPassages=[];
 const requested=options.voiceRequest?.patterns,amount=options.voiceRequest?.patternAmount,maxPassages=amount==='little'?1:amount==='lots'?6:3;
 if(!requested&&(plan.directingProfile==='slow'||options.voiceRequest?.size||options.voiceRequest?.sizeAccent||options.voiceRequest?.density==='sparse'||plan.programmeStyle?.color==='gold'||!(['bright','festival'].includes(plan.feeling)||(!plan.feeling||plan.feeling==='auto')&&analysis.bpm>=100)))return plan;
 const span=s=>({start:s.at,end:s.opening+helpers.shellTiming(s.kind,s.size).life+.15});
 const protectedShot=s=>s.kind==='ear'||s.position?.earField||/^auto-(?:finale|chorus)|^voice-/.test(s.group??'')||!requested&&/^auto-flower/.test(s.group??'');
 const blocked=[...(plan.groundOnlyWindows??[]),...(plan.earPassages??[]),...(!requested?(plan.flowerPassages??[]):[]),...plan.shots.filter(protectedShot).map(span),...(!requested?plan.fans.map(f=>groundReservation(f,analysis.seed)):[])];
 blocked.push(...(analysis.energy??[]).filter(e=>e.rms<(analysis.peak??0)*.0015).map(e=>({start:e.time,end:e.time+1})));
 const end=Math.min(analysis.audibleEnd??analysis.duration,plan.finalPreviewStart??analysis.duration)-1;
 const seed=(analysis.seed+Math.imul(options.variation??0,0x9e3779b9))>>>0;
 for(let at=18;at<end-7&&plan.patternPassages.length<maxPassages;at+=2){
  const index=plan.patternPassages.length,mode=requested&&requested!=='all'?requested:PATTERN_MODES[(seed+index)%PATTERN_MODES.length].id;
  const bars=(requested?index%2===0:(seed+index)%2===0)?(index%3===2?2:4):0;
  const period=Number.isFinite(analysis.period)&&analysis.period>0?analysis.period:60/(analysis.bpm||120);
  const earliest=at+ascent(3)+.18,beat=bars?(analysis.beats??[]).find(b=>b.time>=earliest&&b.time<earliest+period*1.5)?.time:null;
  const alignedStart=beat==null?at:beat-ascent(3)-.18;
  const part=patternPassage({start:alignedStart,seed:(seed^Math.imul(index+1,0x531a2f9d))>>>0,mode,phraseBars:bars,beatPeriod:period,accent:!['heart','double'].includes(requested)&&options.voiceRequest?.density!=='sparse'&&index===2&&(seed%2===0),count:options.voiceRequest?.density==='sparse'?4:10}),window={start:part.shots[0].at-.1,end:part.finishAt+.1};
  // An explicit request may replace a complete optional flower/ground scene,
  // never crop a flower bed or a reserved chorus/finale/silent passage.
  const replacedFlowers=requested?(plan.flowerPassages??[]).filter(w=>overlaps(window,w)):[];
  for(const w of replacedFlowers){window.start=Math.min(window.start,w.start);window.end=Math.max(window.end,w.end);}
  if(window.end>end||blocked.some(b=>overlaps(window,b)))continue;
  const kept=plan.shots.filter(s=>protectedShot(s)||!overlaps(window,span(s))),candidate=[...kept,...part.shots].sort((a,b)=>a.at-b.at),budget=helpers.planBudget(candidate);
  if(budget.peakUpper>14||budget.peakPoints>Math.max(64000,helpers.planBudget(plan.shots).peakPoints))continue;
  plan.shots=candidate;
  if(requested){
   plan.fans=plan.fans.filter(f=>!overlaps(window,groundReservation(f,analysis.seed)));plan.flowerPassages=(plan.flowerPassages??[]).filter(w=>!replacedFlowers.includes(w));
   for(const key of ['sections','arrangements','featureCues'])if(plan[key])plan[key]=plan[key].filter(c=>c.at<window.start||c.at>=window.end);
  }
  plan.patternPassages.push({start:window.start,end:window.end,mode,label:part.label,count:part.shots.length,accent:part.accent,bars:part.bars,openingSpan:part.openingSpan,firstOpening:part.firstOpening});blocked.push({start:window.start-(amount==='lots'?6:12),end:window.end+(amount==='lots'?6:12)});
  plan.sections.push({at:part.firstOpening,label:part.label,previewStart:Math.max(0,part.shots[0].at-.2)});
 }
 if(requested&&!plan.patternPassages.length)throw Error('型物を入れられる長さの場面がありません。曲の長さや他の希望を変えて、もう一度お試しください。');
 if(plan.patternPassages.length){plan.sections.sort((a,b)=>a.at-b.at);plan.budget=helpers.planBudget(plan.shots);plan.analysisSummary.shellKinds=[...new Set(plan.shots.filter(s=>s.kind!=='ear').map(s=>s.kind))];plan.analysisSummary.patternPassages=plan.patternPassages.length;Object.assign(plan.analysisSummary,{flowerPassageCount:(plan.flowerPassages??[]).length,flowerPassageSeconds:(plan.flowerPassages??[]).reduce((n,w)=>n+w.duration,0),flowerShots:plan.shots.filter(s=>s.group==='auto-flower-carpet').length,upperFlowerShots:plan.shots.filter(s=>s.group==='auto-flower-garden-upper').length,groundModes:[...new Set(plan.fans.map(f=>f.mode))]});plan.method+='; short pattern clusters and beat-aligned two/four-bar streams of small shells, with occasional paired five-go smiles.';}
 return plan;
}
