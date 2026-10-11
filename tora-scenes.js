// New foreground arrangements; accepted patterns use their original generators.
export const TORA_MOUNTAIN_COLORS=[{"id": "mountain-white", "label": "白", "head": 16055295, "tail": 14413567}, {"id": "mountain-aqua", "label": "水色", "head": 4639231, "tail": 14413567}, {"id": "mountain-blue", "label": "青", "head": 3766527, "tail": 14413567}, {"id": "mountain-pink", "label": "ピンク", "head": 16741320, "tail": 14413567}, {"id": "mountain-purple", "label": "紫", "head": 12089343, "tail": 14413567}, {"id": "mountain-green", "label": "緑", "head": 3342192, "tail": 14413567}, {"id": "mountain-gold", "label": "金", "head": 16764791, "tail": 16760165}];
export const TORA_LARGE_PATTERNS=[
 {id:'back-rise-twins',label:'二山の真後ろの大トラ吹上',description:'左右の山の真後ろから、金の大トラを同時にまっすぐ吹き上げます。'},
 {id:'back-rise-triple',label:'三山の真後ろの大トラ吹上',description:'左・中・右の山の真後ろから、大トラを同時にまっすぐ吹き上げます。'},
 {id:'mountain-twins',label:'二つの山から空へ',description:'左右の裾から山を立て、山頂で交差した尾が上へ広がります。'},
 {id:'woven-cross',label:'白銀の網を横一面に',description:'隣の発射位置から来る尾と交わり、低い空に細かな網を作ります。'},
 {id:'grand-fan-cross',label:'左右の大扇と中央クロス',description:'左右の広い扇に、中央の角度違いのクロスを重ねます。'}
];
export const TORA_SMALL_PATTERNS=[
 {id:'small-mountain-triple',label:'子トラ · すぼまった束の三山',description:'左・中・右に細い星の束を寄せ、少し重なる裾と自然な山頂の三山を作ります。'},
 {id:'small-mountain-upright',label:'子トラ · 高さ違いの細い二山',description:'細い縦の束を高さ違いで並べ、山の輪郭を作ります。'},
 {id:'small-mountain-bundles',label:'子トラ · すぼまった束の二山',description:'すぼまった星の束を頂上へ寄せ、束のまま消します。'},
 {id:'small-mountain-twins',label:'子トラ · 頂上を見せる二山',description:'細い束を山頂へ集め、そこから静かに消します。扇へは開きません。'},
 {id:'small-stream-right',label:'子トラ · 左から右へポンポン',description:'細い吹上を左から右へ、一定の間隔で打ちます。'},
 {id:'small-stream-left',label:'子トラ · 右から左へポンポン',description:'右から左へ、細い吹上で応えます。'},
 {id:'small-stream-cross',label:'子トラ · 両端から交差して外へ',description:'縦の吹上を左右同時に流し、発射位置が中央ですれ違って反対側へ進みます。'},
 {id:'small-color-row',label:'子トラ · 色の細い横一列',description:'９か所の細い束を、桃・水色・緑で横に並べます。'}
];
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
export function createToraLargePattern(id,style,seed){
 const shots=[],random=rng(seed),add=(x,angle,height,at=0,motion=null)=>shots.push({x,y:.22,z:-.72,angle,height,at,style,seed:Math.floor(random()*0xffffffff),...(motion?{motion}: {})});
 if(id==='back-rise-twins'||id==='back-rise-triple'){
  const centers=id==='back-rise-triple'?[-.68,0,.68]:[-.55,.55];
  for(const center of centers)for(const offset of [-.18,0,.18]){
   add(center+offset,0,1.02,0,{burn:1.85,drag:.16,gravity:.20,vx:0,afterglow:1.15,tailSamples:120,headGain:1.05});
   shots.at(-1).z=-.84;
  }
 }
 if(id==='mountain-twins')for(const center of [-.55,.55])for(let i=0;i<11;i++){
  const u=(i-5)/5,x=center+u*.40,drag=.14,gravity=.18,crossAt=.65+.48*Math.abs(u),q=(1-Math.exp(-drag*crossAt))/drag;
  const vx=(center-x)/q,vy=(.46+gravity*(crossAt-q)/drag)/q;
  add(x,Math.atan2(vx,vy),.8,Math.abs(u)*.016,{burn:2.30,drag,gravity,vx,vy,afterglow:1.15,tailSamples:120,headGain:1.05});
 }
 if(id==='woven-cross')for(let i=0;i<11;i++)for(const sign of [-1,1])add((i-5)*.17,sign*(i%2?.64:.48),i%2?.58:.46,Math.abs(i-5)*.006);
 if(id==='grand-fan-cross'){
  for(const center of [-.58,.58])for(let i=0;i<9;i++){const angle=(i-4)*.225;add(center,angle,.92*Math.cos(angle),Math.abs(i-4)*.008);}
  for(const angle of [.32,.52,.74])for(const sign of [-1,1])add(sign*.27,-sign*angle,.78*Math.cos(angle),.07);
 }
 return shots;
}
export function createToraSmallPattern(id,style,seed,options={}){
 const random=rng(seed),shots=[],interval=Math.max(.08,Math.min(.6,Number(options.interval)||.24)),rate=Math.max(.25,Math.min(2,Number(options.rate)||1));
 const add=(x,angle,at,height=.46,count=28,extra={})=>shots.push({x,y:.18,z:-.63,angles:[angle],count,height,at,style,seed:Math.floor(random()*0xffffffff),small:true,tight:true,spreadScale:.5,...extra});
 if(id==='small-mountain-bundles')for(const center of [-.55,.55])for(let i=0;i<11;i++){
  const u=(i-5)/5,peakX=center+(random()-.5)*.060,peakHeight=.50*(.94+random()*.14),peakAt=.74+.55*Math.abs(u)+(random()-.5)*.080;
  add(center+u*.37,0,0,.50,36,{y:.22,spreadScale:.12,bundlePeak:{x:peakX,height:peakHeight,at:peakAt},span:.40});
 }
 if(id==='small-mountain-triple')for(const center of [-.68,0,.68])for(let i=0;i<11;i++){
  const u=(i-5)/5,peakX=center+(random()-.5)*.060,peakHeight=.50*(.94+random()*.14),peakAt=.74+.55*Math.abs(u)+(random()-.5)*.080;
  add(center+u*.37,0,0,.50,36,{y:.22,spreadScale:.12,bundlePeak:{x:peakX,height:peakHeight,at:peakAt},span:.40});
 }
 if(id==='small-mountain-upright')for(const center of [-.55,.55])for(let i=0;i<11;i++){
  const u=(i-5)/5,height=.50-.34*Math.abs(u);
  add(center+u*.37,0,0,height,36,{y:.22,spreadScale:.12,bundlePeak:{height,at:1.02},span:.36});
 }
 if(id==='small-mountain-twins')for(const center of [-.55,.55])for(let i=0;i<11;i++){
  const u=(i-5)/5;add(center+u*.37,0,0,.50,20,{y:.22,summit:{x:center,height:.50,at:.74+.55*Math.abs(u)},span:.52});
 }
 if(id==='small-stream-right'||id==='small-stream-left')for(let i=0;i<9;i++)add((id==='small-stream-left'?-1:1)*(i-4)*.21,0,i*interval*rate);
 if(id==='small-stream-cross')for(let i=0;i<9;i++)for(const sign of [-1,1])add(-sign*(i-4)*.21,0,i*interval*rate,.46,28);
 if(id==='small-color-row'){
  const colors=['pink-silver','aqua-gold','green-silver'];
  // The already-reviewed row keeps its original geometry, cadence and spread.
  return Array.from({length:9},(_,i)=>({x:(i-4)*.21,y:.18,z:-.63,angles:[0],count:28,height:.42,at:i*.022,style:style==='tora-row-mix'?colors[i%3]:style,seed:Math.floor(random()*0xffffffff),small:true,tight:true}));
 }
 return shots;
}
export function toraSceneCues(mode='mountain-twins',options={}){
 if(mode==='mountain-chorus-twins'||mode==='mountain-chorus-triple'){
  const triple=mode==='mountain-chorus-triple';
  return [{at:0,mode:triple?'small-mountain-triple':'small-mountain-bundles',style:options.mountainStyle??'mountain-white',options},
   {at:0,mode:triple?'back-rise-triple':'back-rise-twins',style:'gold',options}];
 }
 if(mode==='stream-sequence'){
  const interval=Math.max(.08,Math.min(.6,Number(options.interval)||.24)),rate=Math.max(.25,Math.min(2,Number(options.rate)||1)),span=8.5*interval*rate;
  return ['small-stream-right','small-stream-left','small-stream-cross'].map((mode,i)=>({at:i*span,mode,style:'silver',options}));
 }
 if(mode==='sequence')return [{at:0,mode:'small-color-row',style:'tora-row-mix'},{at:3,mode:'woven-cross',style:'silver'},{at:7,mode:'mountain-twins',style:'silver'},{at:11.5,mode:'grand-fan-cross',style:'silver'},{at:12.1,mode:'small-color-row',style:'tora-row-mix'}];
 return [{at:0,mode,style:mode==='small-color-row'?'tora-row-mix':(mode==='small-mountain-bundles'||mode==='small-mountain-triple')?(options.mountainStyle??'mountain-white'):'silver',options}];
}
export function toraSceneEnd(mode,options={}){
 const cues=toraSceneCues(mode,options),rate=Number(options.rate)||1,interval=Number(options.interval)||.24;
 if(mode==='sequence')return 16;
 if(mode==='mountain-twins'||mode.startsWith('mountain-chorus-'))return 4.5;
 if(mode==='small-mountain-twins'||mode==='small-mountain-bundles'||mode==='small-mountain-triple'||mode==='small-mountain-upright')return 3;
 if(mode==='stream-sequence'||mode.startsWith('small-stream-'))return cues.at(-1).at+8*interval*rate+3.15;
 return 4;
}
