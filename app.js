import {RiverNight,RooftopCranes} from './river-night.js?v=1.1.19';
import {sunflowerPoint,spiralPoint} from './sunflower-motion.js?v=1.1.19';
import {createCandyBigStars,candyBigStarPoint} from './candy-big-stars.js?v=1.1.19';
import {CANDY_PALETTES,candyColor} from './candy-colors.js?v=1.1.19';
import {CometField,COMET_STYLES,COMET_PATTERNS} from './comets.js?v=1.1.19';
import {MUSIC_SHOWS} from './music-shows.js?v=1.1.19';
import {MusicTransport} from './music-transport.js';
import {createProgram,programCue,PROGRAM_NAMES,randomStarmine,normalGroundCues,normalEarSequence} from './programs.js?v=1.1.19';
import * as T from './vendor/three.module.js';
import {isSenrin,EAR_PROFILE,createEarStars,earPoint,SIZES,TYPES,sphere,chapter,paletteOptions,shellPalette,createShellShapeSampler,deformShellVector,sampleIgnitionDelays,MAX_IGNITION_DELAY} from './fireworks.js?v=1.1.19';
import {reflectionMaterial,reflectionAppearance} from './water.js?v=1.1.19';
import {FireworkAudio} from './audio.js?v=1.1.19';
import {placementFromPose,XRMetrics} from './mr-test.js?v=1.1.19';
import {MRPanel,nextEnabledOption,stepRange} from './mr-panel.js?v=1.1.19';
import {MRDimming,clampBrightness} from './mr-dimming.js?v=1.1.19';
import {TowerLighting} from './tower-lighting.js?v=1.1.19';
import {BridgeView,BRIDGE_SCALE} from './bridge-view.js?v=1.1.19';
import {ShowInfoPanel} from './show-info.js?v=1.1.19';
import {WristMenu} from './wrist-menu.js?v=1.1.19';
import {XRControls} from './xr-controls.js?v=1.1.19';
import {TriggerEmbers,ManualLaunchBudget,manualPointCost} from './trigger-embers.js?v=1.1.19';
import {EntryTip} from './entry-tip.js?v=1.1.19';
const BUILD_VERSION='1.1.19';
let candyFreezeAt=null;
const SMALL_STYLE_LABELS={...Object.fromEntries(CANDY_PALETTES.map(p=>[p.id,p.label])),gold:'金の星・金の尾',silver:'白の星・銀の尾',red:'紅の星・金の尾',blue:'青の星・銀の尾',green:'緑の星・金の尾','gold-silver':'金の星・銀の尾','white-gold':'白の星・金の尾','red-silver':'紅の星・銀の尾','blue-gold':'青の星・金の尾','green-silver':'緑の星・銀の尾'};
// Separate from town/program/silver randomness, and never sampled during animation.
const sampleShellShape=createShellShapeSampler();
const panelPreview=new URLSearchParams(location.search).get('mrpanel')==='1';
const $=id=>document.getElementById(id), canvas=$('view');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
const scene=new T.Scene();scene.background=new T.Color(0x050a16);scene.fog=new T.FogExp2(0x050a16,.085);
const camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.03,40);camera.position.set(0,1.2,2.9);
const mrDimming=new MRDimming(scene);
const town=new T.Group();scene.add(town);const light=new T.AmbientLight(0x8da9d9,1.1);scene.add(light);const moon=new T.DirectionalLight(0x9ec4ff,1.3);moon.position.set(-2,5,3);scene.add(moon);
const bridgeView=new BridgeView(town,camera);
let dioramaSaved=null;
const showInfo=new ShowInfoPanel({scene,timer:$('infoTime'),names:$('infoNames'),overlay:$('showInfoPanel')});
let seed=141;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const box=new T.BoxGeometry(1,1,1), mats=[0x172431,0x24303d,0x1b2934,0x303540].map(c=>new T.MeshStandardMaterial({color:c,roughness:.9}));
function cube(x,y,z,w,h,d,mat){const m=new T.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);town.add(m);return m;}
const groundmat=new T.MeshStandardMaterial({color:0x10191f,roughness:.95});const ground=cube(0,-.025,0,3.2,.045,2.1,groundmat);
const groundBottomY=ground.position.y-ground.scale.y/2;
// Shared river coordinates keep banks, buildings, boats and reflections aligned.
function riverCenter(z){return .22*Math.sin(z*2.7+.35);}
function riverWidth(z){return .49+.075*Math.cos(z*2.5-.5);}
function riverSlope(z){return .594*Math.cos(z*2.7+.35);}
function riverRibbon(z0,z1,widthFactor=1,y=.003){
 const vertices=[],indices=[],segments=64;
 for(let i=0;i<=segments;i++){const z=z0+(z1-z0)*i/segments,c=riverCenter(z),w=riverWidth(z)*widthFactor/2;vertices.push(c-w,y,z,c+w,y,z);if(i<segments){let a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const river=new T.Mesh(riverRibbon(-1.04,1.04),new T.MeshStandardMaterial({color:0x123446,metalness:.45,roughness:.32,side:T.DoubleSide}));town.add(river);
for(const side of [-1,1]){
 const points=Array.from({length:65},(_,i)=>{const z=-1.04+i*2.08/64;return new T.Vector3(riverCenter(z)+side*(riverWidth(z)/2+.012),.009,z);});
 const bank=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,.011,4,false),new T.MeshStandardMaterial({color:0x45505a,roughness:.9}));town.add(bank);
}
const windows=[], windowRanges=[], lamps=[],rooftops=[],buildingRoofs=[];
// Additional facades have independent occupancy, without changing the town,
// front windows, boats or any fireworks which share the original random stream.
let windowSeed=0x141723;
function windowRand(){windowSeed=(windowSeed*1664525+1013904223)>>>0;return windowSeed/4294967296;}
for(let side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<5;col++){
 const firstWindow=windows.length/3;
 const z=-.86+row*.27+(rand()-.5)*.04,x=riverCenter(z)+side*(riverWidth(z)/2+.12+col*.205),w=.105+rand()*.055,d=.12+rand()*.06,h=.10+rand()*.31;
 cube(x,h/2,z,w,h,d,mats[Math.floor(rand()*mats.length)]);
 buildingRoofs.push({x,y:h,z,w,d,side,row,col});
 if(h>.32)rooftops.push({x,y:h,z,w,d});
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++)if(rand()>.38)windows.push(x+k*w*.25,level,z+d/2+.001);
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++){
  if(windowRand()>.38)windows.push(x+k*w*.25,level,z-d/2-.001);
  if(windowRand()>.38)windows.push(x-w/2-.001,level,z+k*d*.25);
  if(windowRand()>.38)windows.push(x+w/2+.001,level,z+k*d*.25);
 }
 windowRanges.push({first:firstWindow,last:windows.length/3});
}
function pointCloud(coords,color,size){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));const m=new T.PointsMaterial({color,size,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});bridgeView.point(m);const p=new T.Points(g,m);town.add(p);return p;}
const win=pointCloud(windows,0xffdba0,.008);
// Warm rooms lead the city; individual buildings and a few rooms differ.
// Colour and brightness use another stream, keeping occupancy and geometry fixed.
let windowLightSeed=0x141724;
function windowLightRand(){windowLightSeed=(windowLightSeed*1664525+1013904223)>>>0;return windowLightSeed/4294967296;}
const windowTints=[0xffdba0,0xffbd82,0xfff1da,0xc1daff].map(hex=>new T.Color(hex));
function chooseWindowTint(){const r=windowLightRand();return r<.55?0:r<.70?1:r<.90?2:3;}
const windowColors=new Float32Array(windows.length),windowTintCounts=[0,0,0,0];
for(const range of windowRanges){
 const baseTint=chooseWindowTint();range.tint=baseTint;
 for(let i=range.first;i<range.last;i++){
  const tint=windowLightRand()<.16?chooseWindowTint():baseTint,c=windowTints[tint],brightness=.82+windowLightRand()*.18;
  windowColors[i*3]=c.r*brightness;windowColors[i*3+1]=c.g*brightness;windowColors[i*3+2]=c.b*brightness;windowTintCounts[tint]++;
 }
}
win.geometry.setAttribute('color',new T.BufferAttribute(windowColors,3));win.material.color.setHex(0xffffff);win.material.vertexColors=true;
const roadmat=new T.MeshStandardMaterial({color:0x3c464c});
for(let z=-.98;z<1;z+=.055)for(let side of [-1,1])lamps.push(riverCenter(z)+side*(riverWidth(z)/2+.027),.018,z);
pointCloud(lamps,0xffe1a5,.009);
// Preserve old town random consumption without keeping the placeholder boats.
for(let i=0;i<9;i++){rand();rand();}
const riverNight=new RiverNight({town,riverGeometry:riverRibbon(-1.04,1.04,1,.005),riverCenter,riverSlope});
const tower=new T.Group();tower.position.set(1.1,0,-.7);town.add(tower);
// A tall, dotted lattice of violet and pearl lights, inspired by the supplied night photograph.
const towerMesh=new T.Mesh(new T.CylinderGeometry(.013,.065,1.18,12),new T.MeshStandardMaterial({color:0x141925,roughness:.9}));towerMesh.position.y=.59;tower.add(towerMesh);
for(const h of [.83,1.01]){const deck=new T.Mesh(new T.CylinderGeometry(h<.9?.075:.041,h<.9?.062:.032,.035,24),new T.MeshStandardMaterial({color:0x30303e,metalness:.4,roughness:.4}));deck.position.y=h;tower.add(deck);}
const spire=new T.Mesh(new T.CylinderGeometry(.003,.012,.31,8),mats[1]);spire.position.y=1.335;tower.add(spire);
const dots=[],dotColors=[];
function towerDot(x,y,z){dots.push(x,y,z);const purple=new T.Color(0xb677ff),white=new T.Color(0xdcecff);const blend=(Math.sin(y*10)+1)*.5;const col=white.lerp(purple,blend*.85);dotColors.push(col.r,col.g,col.b);}
// Counter-winding diagonals describe the structural mesh rather than a solid glowing tube.
for(let strand=0;strand<12;strand++)for(let j=0;j<90;j++){const y=.015+j*1.165/89,r=.067*(1-y/1.3)+.007;for(const sign of [-1,1]){const a=strand*Math.PI/6+sign*y*15;towerDot(Math.cos(a)*r,y,Math.sin(a)*r);}}
for(const h of [.83,1.01])for(let j=0;j<64;j++){const a=j*Math.PI*2/64,r=h<.9?.076:.043;towerDot(Math.cos(a)*r,h+.012,Math.sin(a)*r);}
for(let j=0;j<50;j++){const y=1.18+j*.31/49,r=.014*(1-j/60);for(let k=0;k<6;k++){const a=k*Math.PI/3;towerDot(Math.cos(a)*r,y,Math.sin(a)*r);}}
const beacon=new T.Mesh(new T.SphereGeometry(.008,8,6),new T.MeshBasicMaterial({color:0xecddff}));beacon.position.y=1.495;tower.add(beacon);
const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute(dots,3));tg.setAttribute('color',new T.Float32BufferAttribute(dotColors,3));
const towerLights=new T.Points(tg,new T.PointsMaterial({size:.007,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));tower.add(towerLights);
const towerLighting=new TowerLighting(dots,tg.attributes.color);
function setTowerColor(){towerLighting.setMode($('towerColor').value);}
$('towerColor').onchange=setTowerColor;

const palette=[0xffc878,0xff647d,0x9fd9ff,0xbba0ff,0x94edb1];

let running=false,previewing=false,previewPaused=false,time=0,nextLaunch=.8,cueIndex=0,burstQueue=[],burstSlots=new Set(),fireworks=[],audio=null,soundEngine=null,yaw=0,pitch=0,drag=null;
const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=32;const ctx=spriteCanvas.getContext('2d'),grad=ctx.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.2,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,32,32);const sprite=new T.CanvasTexture(spriteCanvas);
const triggerEmbers=new TriggerEmbers({scene,town,map:sprite}),manualBudget=new ManualLaunchBudget();
// Keep tiny miniature stars bright while giving their cores a clearer edge.
// Town warning lights and ground effects retain the original soft image.
const miniatureStarCanvas=document.createElement('canvas');miniatureStarCanvas.width=miniatureStarCanvas.height=32;
const miniatureStarContext=miniatureStarCanvas.getContext('2d'),miniatureStarGradient=miniatureStarContext.createRadialGradient(16,16,0,16,16,16);
for(const [radius,alpha] of [[0,1],[.32,1],[.48,.90],[.62,.20],[.80,.05],[1,0]])miniatureStarGradient.addColorStop(radius,`rgba(255,255,255,${alpha})`);
miniatureStarContext.fillStyle=miniatureStarGradient;miniatureStarContext.fillRect(0,0,32,32);
const miniatureStarSprite=new T.CanvasTexture(miniatureStarCanvas);
// The bridge retains its independently tuned life-size star core and halo.
const bridgeStarCanvas=document.createElement('canvas');bridgeStarCanvas.width=bridgeStarCanvas.height=32;
const bridgeStarContext=bridgeStarCanvas.getContext('2d'),bridgeStarGradient=bridgeStarContext.createRadialGradient(16,16,0,16,16,16);
for(const [radius,alpha] of [[0,1],[.22,1],[.27,.96],[.33,.20],[.50,.035],[.75,.006],[1,0]])bridgeStarGradient.addColorStop(radius,`rgba(255,255,255,${alpha})`);
bridgeStarContext.fillStyle=bridgeStarGradient;bridgeStarContext.fillRect(0,0,32,32);
const bridgeStarSprite=new T.CanvasTexture(bridgeStarCanvas),fireworkMaps={miniature:miniatureStarSprite,bridge:bridgeStarSprite};
// A few rooftop warning lights add a quiet rhythm even between shows.
const roofSites=[];
for(const roof of rooftops.toSorted((a,b)=>b.y-a.y)){
 if(roofSites.length>=8)break;
 if(roofSites.every(other=>Math.hypot(other.x-roof.x,other.z-roof.z)>.38))roofSites.push(roof);
}
// The front right bank, second building from the river, also carries warning lights.
const frontRightRoof=buildingRoofs.find(r=>r.side===1&&r.row===6&&r.col===1);
if(frontRightRoof&&!roofSites.some(r=>r.x===frontRightRoof.x&&r.z===frontRightRoof.z))roofSites.push(frontRightRoof);
const roofPositions=[],roofColors=[];
roofSites.forEach(roof=>{for(const sx of [-1,1])for(const sz of [-1,1]){const x=roof.x+sx*(roof.w/2-.008),z=roof.z+sz*(roof.d/2-.008);cube(x,roof.y+.006,z,.004,.012,.004,mats[0]);roofPositions.push(x,roof.y+.015,z);roofColors.push(1,.012,.003);}});
const roofGeometry=new T.BufferGeometry();roofGeometry.setAttribute('position',new T.Float32BufferAttribute(roofPositions,3));roofGeometry.setAttribute('color',new T.Float32BufferAttribute(roofColors,3));
const roofLights=new T.Points(roofGeometry,new T.PointsMaterial({size:.020,map:sprite,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));town.add(roofLights);
const rooftopCranes=new RooftopCranes({town,rooftops,riverCenter,pointMap:sprite});bridgeView.point(rooftopCranes.lights.material);
function updateRoofLights(seconds){
 const colors=roofGeometry.attributes.color;
 for(let i=0;i<roofSites.length;i++){
 const phase=(seconds/(3.6+(i%3)*.25)+i*.237)%1;
 const brightness=.045+2.2*Math.pow(Math.max(0,Math.sin(phase*Math.PI*2)),6);
 for(let corner=0;corner<4;corner++)colors.setXYZ(i*4+corner,brightness,brightness*.012,brightness*.003);
 }colors.needsUpdate=true;
}
let showPlan=null,showNumber=0;
let selectedMusic=MUSIC_SHOWS[0],MUSIC_PLAN=selectedMusic.plan;
let music=new MusicTransport(selectedMusic.src,{autoload:false});
$('musicTrack').replaceChildren(...MUSIC_SHOWS.map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.title;return option;}));$('musicTrack').value=selectedMusic.id;
function syncMusicScenes(){
 $('musicScene').replaceChildren(...MUSIC_PLAN.sections.filter(q=>q.at<MUSIC_PLAN.duration).map(q=>{const option=document.createElement('option');option.value=q.previewStart??Math.max(0,q.at-5);option.textContent=Math.floor(q.at/60)+':'+String(Math.floor(q.at%60)).padStart(2,'0')+' · '+q.label;return option;}));
}
syncMusicScenes();
let musicRequest=0,musicBusy=false,candyPeakAt=null,candyPeakLabel='キャンディー全開の瞬間です。';
let musicLog=[],musicLastUI=-1;

function prepareProgram(){const seed=crypto.getRandomValues(new Uint32Array(1))[0];showPlan=createProgram($('program').value,seed);showPlan.wideFinale=(++showNumber%3===0);showPlan.special=[{kind:'triple',size:20},{kind:'quad',size:10},{kind:'penta',size:10}][(showNumber-1)%3];showPlan.earSeed=seed;const intro=normalEarSequence(seed,.8,3);burstQueue.push(...intro.shots);burstQueue.sort((a,b)=>a.at-b.at);nextLaunch=Math.max(nextLaunch,intro.finishAt);$('programInfo').textContent=showPlan.name; }
function prepareMusicProgram(){
 showPlan={name:'音楽付き · '+selectedMusic.title,music:true};
 const shift=Number($('musicOffset').value)/1000;
 burstQueue=MUSIC_PLAN.shots.map(s=>({...s,at:s.at+shift,opening:s.opening+shift,position:{...s.position,startAt:s.at+shift}}));
 fanQueue=MUSIC_PLAN.fans.map(f=>({...f,at:f.at+shift}));
 musicLog=[];$('musicState').textContent=selectedMusic.title+' · '+MUSIC_PLAN.duration.toFixed(1)+'秒';
}
function cancelMusicRequest(){candyPeakAt=null;musicRequest++;musicBusy=false;syncShowButtons();}
function syncShowButtons(){
 for(const id of ['candyPeak','candyQuiet','candySenrin'])if($(id))$(id).hidden=selectedMusic.id!=='pastel-parasite';
 $('play').textContent=showPlan?.music?'曲なしの大会へ':running?'ひと休み':showPlan?'大会を再開':'花火大会を観る';
 $('musicShow').disabled=musicBusy;
 $('musicShow').textContent=musicBusy?'曲を準備中…':showPlan?.music?(running?'音楽付き · ひと休み':'音楽付き · 再開'):selectedMusic.title+'を観る';
}
async function beginMusicShow(){
 if(musicBusy)return;
 if(showPlan?.music&&!musicCanFinish()){toggle();return;}
 const request=++musicRequest;musicBusy=true;syncShowButtons();ensureAudio();
 $('musicState').textContent='曲を準備中…';
 try{await music.load();}catch(e){if(request!==musicRequest)return;musicBusy=false;music.ready=null;syncShowButtons();$('musicState').textContent='曲を読み込めませんでした。もう一度お試しください。';return;}
 if(request!==musicRequest)return;
 musicBusy=false;music.stop();clearFireworks();clearFans();fanQueue=[];burstQueue=[];burstSlots.clear();previewing=false;previewPaused=false;time=0;cueIndex=0;prepareMusicProgram();ensureAudio();music.play(audio,0);running=true;
 $('musicState').textContent=selectedMusic.title+' · '+MUSIC_PLAN.duration.toFixed(1)+'秒';$('status').textContent=selectedMusic.description;syncShowButtons();mrPanel.draw();
}
function beginNormalShow(){stopShow();prepareProgram();running=true;ensureAudio();syncShowButtons();$('status').textContent='稲穂の横一列から、曲なしの花火大会を始めます。';}

function sound(explosion,x,z,size,when,y=SIZES[size]?.height??0){const position=bridgeView.position(x,explosion?y:0,z);soundEngine?.play(explosion,x,z,size,$('audioMode').value,when,...(position?[position]:[]));}
function soundDelayFor(f){return bridgeView.active?bridgeView.delay(f.x,f.y,f.z,latestViewerTransform):({2:.18,3:.2,5:.5,10:1,20:1.5})[f.size]??0;}
function cancelFutureSounds(){
 soundEngine?.cancelScheduled?.();for(const f of fireworks){const t=time-f.start-f.ascent;if(t<(f.soundDue??soundDelayFor(f)))f.soundPlayed=false;if(isSenrin(f.kind)&&t<(f.childSoundDue??f.clusterDelays[0]+soundDelayFor(f)))f.childSoundPlayed=false;}
}
let earSerial=0;
function launch(kind='core',size=5,position=null){
 if(kind==='candysenrin'&&size!==10)return false;
 if(kind==='candy'&&![3,5,10].includes(size))return false;
 if(kind==='candyburst'&&size!==5&&size!==10)return false;
 if(kind==='ear'&&size!==2||size===2&&kind!=='ear')return false;
 const activeUpper=fireworks.filter(f=>f.kind!=='ear').length;
 if(kind==='ear'){if(fireworks.filter(f=>f.kind==='ear').length>=14)return false;}
 else if(!position?.manual&&(activeUpper>=(showPlan?.music&&selectedMusic.id==='pastel-parasite'?14:position?.wide||position?.musicNine?9:8)||(triggerEmbers.count&&activeUpper+triggerEmbers.count>=8)))return false;
 if(kind==='kiku'&&size!==3)return false;
 if((kind==='quad'||kind==='penta')&&size!==10&&size!==20)return false;
 if(kind==='double'&&size!==10)return false;if(isSenrin(kind)&&size!==10&&size!==20)return false;if(kind==='triple'&&size!==20)return false;if(size===20&&kind!=='triple'&&!isSenrin(kind)&&kind!=='quad'&&kind!=='penta'&&!(kind==='silver'&&position?.wide))return false;
 let spec=TYPES[kind];const scale=SIZES[size];if(!spec||!scale)return false;
 const z=position?.z??(rand()*1.6-.85),x=position?.x??(riverCenter(z)+(rand()>.5?1:-1)*(.12+rand()*.7));
 const y=scale.height+(position?.heightOffset??0),r=scale.radius*(kind==='candyburst'?1.22:1),trailCount=kind==='candyburst'?24:kind==='ear'?EAR_PROFILE.trails:kind==='candy'?12:kind==='kiku'?16:isSenrin(kind)?4:kind==='sunflower'?36:kind==='silver'?12:10,directions=[],shells=[],starColors=[],clusterCenters=[],clusterDelays=[],starLayers=[];
 const silverSeed=kind==='silver'?rand()*1000:0;
 const palette=shellPalette(kind,position?.palette),scheme=palette.colors.map(c=>new T.Color(c));
 for(let layer=0;layer<spec.radii.length;layer++){
 const count=Math.round(scale.stars*(position?.wide?.72:1)*(spec.layerWeights?.[layer]??(layer===0?1:layer===1?.6:.35)));
 for(const xyz of sphere(count)){directions.push(new T.Vector3(...xyz));shells.push(spec.radii[layer]);starColors.push(scheme[layer]);starLayers.push(layer);}
 }
 if(kind==='silver'){
 // Sample once per shell; every frame and tail point keeps the same trajectory.
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(rand()*Math.PI*2,rand()*Math.PI*2,rand()*Math.PI*2));
 // Consume the previous stretch draws so existing placement/timing randomness stays intact.
 rand();rand();rand();
 for(const dir of directions)dir.applyQuaternion(rotation);
 }
 if(kind==='spiral'){
 for(let i=0;i<directions.length;i++){const center=i<Math.floor(directions.length*.24),count=center?Math.floor(directions.length*.24):directions.length-Math.floor(directions.length*.24),index=center?i:i-Math.floor(directions.length*.24);const angle=center?index/count*Math.PI*2:Math.floor(index/Math.ceil(count/18))*Math.PI*2/18+(index%Math.ceil(count/18)-Math.ceil(count/18)/2)*.009;directions[i].set(Math.cos(angle),Math.sin(angle),(i%5-2)*.025).normalize();shells[i]=center?.23*Math.sqrt((index+.5)/count):1;starColors[i]=new T.Color(center?0xff604b:0xffc34c);}
 }
 if(kind==='sunflower'){
 directions.length=0;shells.length=0;starColors.length=0;
 // A single ring of gold stars with dense tails, surrounding a small red core.
 for(let petal=0;petal<32;petal++)for(let strand=0;strand<5;strand++){
 const angle=petal*Math.PI*2/32+(strand-2)*.004;
 directions.push(new T.Vector3(Math.cos(angle),Math.sin(angle),(strand-2)*.006).normalize());
 shells.push(1+(strand-2)*.009);starColors.push(new T.Color(0xffbf55));
 }
 for(const xyz of sphere(72)){directions.push(new T.Vector3(...xyz));shells.push(.51);starColors.push(new T.Color(0xff3925));}
 }
 if(kind==='sunflower'||kind==='spiral'){
 // One uniform 3D orientation per shell, shared by all stars and their tails.
 // Keep orientation randomness separate from the existing town/silver stream.
 const u=Math.random(),a=Math.random()*Math.PI*2,b=Math.random()*Math.PI*2;
 const rotation=new T.Quaternion(Math.sqrt(1-u)*Math.sin(a),Math.sqrt(1-u)*Math.cos(a),Math.sqrt(u)*Math.sin(b),Math.sqrt(u)*Math.cos(b));
 for(const dir of directions)dir.applyQuaternion(rotation);
 }
 if(isSenrin(kind)){
 directions.length=0;shells.length=0;starColors.length=0;if(kind==='candysenrin')starLayers.length=0;
 const childStars=sphere(24);
 sphere(30).forEach((center,cluster)=>{
 const radius=.70+.12*Math.sin(cluster*2.7);
 clusterCenters.push(new T.Vector3(...center).multiplyScalar(r*radius));clusterDelays.push(1.74+(cluster%7)*.035);
 for(const dir of childStars){directions.push(new T.Vector3(...dir));shells.push(1);starColors.push(kind==='candysenrin'?new T.Color(candyColor(cluster,position?.candySeed??0x191119,scheme.map(c=>c.getHex()))):scheme[cluster%scheme.length]);if(kind==='candysenrin')starLayers.push(0);}
 });
 }
 const bigStars=kind==='candyburst'?createCandyBigStars(size,position?.candySeed??(0x141716+Math.floor(time*1000))):null;
 if(bigStars){directions.length=0;shells.length=0;starColors.length=0;starLayers.length=0;for(const star of bigStars){directions.push(new T.Vector3(...star.direction));shells.push(star.radius);starLayers.push(star.layer);starColors.push(star.layer===0?scheme[0]:new T.Color(0xffdfa0));}}
 const earStars=kind==='ear'?createEarStars(position?.earSeed??((++earSerial*0x9e3779b9)>>>0)):null;
 const shape=kind==='ear'||kind==='candyburst'?{level:0}:sampleShellShape(kind,size);
 for(let i=0;i<directions.length;i++)deformShellVector(directions[i],shape,isSenrin(kind)?.35:shells[i]<.75?.65:1);
 for(const center of clusterCenters)deformShellVector(center,shape);
 if(kind==='candy'){const seed=position?.candySeed??(0x141715+Math.floor(time*1000));for(let i=0;i<starColors.length;i++)starColors[i]=new T.Color(starLayers[i]===0?candyColor(i,seed,scheme.map(c=>c.getHex())):scheme.length===1?scheme[0].getHex():0xffeec7);}
 const n=directions.length,positions=new Float32Array(n*trailCount*3),colors=new Float32Array(n*trailCount*3);
 // These per-star values are constant for the entire shell. Keep double precision.
 const silverVariation=kind==='silver'?Float64Array.from({length:n},(_,i)=>shape.level===0?1:.96+.07*(shape.level===1?.28:1)*Math.sin((i+silverSeed)*2.37)):null;
 const silverLife=kind==='silver'?Float64Array.from({length:n},(_,i)=>5.3+.65*(.5+.5*Math.sin((i+silverSeed)*4.13))):null;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('color',new T.BufferAttribute(colors,3));
 const m=new T.PointsMaterial({size:kind==='ear'?.004:isSenrin(kind)?.012:kind==='willow'?.012:.015,map:sprite,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});bridgeView.point(m,fireworkMaps);const p=new T.Points(g,m);p.frustumCulled=false;town.add(p);
 const color=scheme[0],refl=new T.Mesh(riverRibbon(-1.04,1.04,1,.006),reflectionMaterial(color,scheme[1]||color,spec.ignition?{radii:spec.radii,colors:scheme}:null));town.add(refl);
 const baseAscent=kind==='ear'?1.65:size===20?5.6:size===10?3.12:(1+size*.035)*1.2*(2.62/1.62);
 const ignitionDelay=position?.ignitionDelay??sampleIgnitionDelays(1)[0],ascent=baseAscent+ignitionDelay;
 // Let the preceding flower fade gently before a planned ground-only scene.
 if((kind==='sunflower'||kind==='spiral')&&showPlan?.music&&!position?.manual){
  const opening=(position?.startAt??time)+ascent;
  const nextQuiet=(MUSIC_PLAN.groundOnlyWindows??[]).find(w=>w.start>opening)?.start??Infinity;
  // Keep the existing show's shell budget when the next volley arrives.
  const nextVolley=MUSIC_PLAN.shots.find(s=>s.kind!=='ear'&&s.at>=opening+(kind==='spiral'?4.1:2.85))?.at??Infinity;
  const life=Math.min(spec.life,nextQuiet-opening-.05,nextVolley-opening-.05);
  if(life<spec.life)spec={...spec,life:Math.max(.5,life)};
 }
 const reflectionRadiusScale=isSenrin(kind)?1:Math.sqrt(shells.reduce((sum,v)=>sum+v*v,0)/n);
 fireworks.push({x,z,y,r,color,n,kind,size,spec,ascent,baseAscent,ignitionDelay,trailCount,positions,colors,directions,shells,starColors,clusterCenters,clusterDelays,starLayers,earStars,bigStars,layerLight:spec.ignition?new Float64Array(spec.radii.length):null,silverSeed,silverVariation,silverLife,shape,g,m,p,refl,reflectionRadiusScale,reflectionCenter:new T.Vector3(x,y,z),reflectionRadius:0,start:position?.startAt??time,burst:false});sound(false,x,z,size);
 $('last').textContent=scale.label+' · '+spec.label+(palette.label?' · '+palette.label:'');
 if(showPlan?.music)musicLog.push({scheduled:position?.startAt,actual:time,opening:(position?.startAt??time)+ascent,kind,size,points:n*trailCount});
 return true;
}
function clearFireworks(){triggerEmbers.clear();soundEngine?.cancelScheduled?.();for(const f of fireworks){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();}fireworks=[];}
// Free expired launch slots and fire sounds before queued shots, without computing points.
function updateFireworkEvents(){const audioNow=soundEngine?.context?.currentTime;for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 if(t>=0&&!f.burst){f.burst=true;if(f.kind==='ear')bridgeView.point(f.m,null,EAR_PROFILE.pointSize);else if(f.kind==='candyburst')bridgeView.point(f.m,null,.020);}
 const soundDelay=soundDelayFor(f);
 if(t>=0&&!f.soundPlayed){f.soundPlayed=true;f.soundDue=soundDelay;sound(true,f.x,f.z,f.size,audioNow===undefined?undefined:audioNow+Math.max(0,soundDelay-t),f.y);}
 if(isSenrin(f.kind)&&t>=f.clusterDelays[0]&&!f.childSoundPlayed){f.childSoundPlayed=true;f.childSoundDue=f.clusterDelays[0]+soundDelay;soundEngine?.playSenrinChildren(f.x,audioNow===undefined?undefined:audioNow+Math.max(0,f.childSoundDue-t),...(bridgeView.active?[bridgeView.position(f.x,f.y,f.z)]:[]));}
 if(t>f.spec.life){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();fireworks.splice(k,1);continue;}
} }
function updateFireworks(){updateFireworkEvents();for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 const fadeStart=f.spec.fadeStart??f.spec.life*.5;
 const fade=f.kind==='ear'||f.kind==='sunflower'||f.kind==='spiral'||t<0?1:Math.pow(Math.max(0,1-Math.max(0,t-fadeStart)/(f.spec.life-fadeStart)),1.4);
 let light=0,lightX=0,lightY=0,lightZ=0,lightR2=0,lightShellR2=0;
 const willowHistory=f.kind==='willow'?Math.min(Math.max(0,t),(f.trailCount-1)*f.spec.tail):0;
 const willowTailGlow=f.kind==='willow'?Math.min(1,Math.max(0,t)/.12):0;
 f.layerLight?.fill(0);
 // A candy shell shares expansion and tail weights across its stars.
 // Keep the approved density and trajectory, calculating each trail time once.
 if(f.kind==='candy'&&t>=0){
  f.candyTrailCache??=new Float64Array(f.trailCount*4);
  for(let j=0;j<f.trailCount;j++){const lag=j*f.spec.tail,at=Math.max(0,t-lag),k=j*4;f.candyTrailCache[k]=1-Math.exp(-1.9*at);f.candyTrailCache[k+1]=.085*at;f.candyTrailCache[k+2]=f.spec.gravity*at*at;f.candyTrailCache[k+3]=(t>=lag?1:0)*Math.pow(1-j/f.trailCount,1.7);}
 }
 for(let i=0;i<f.n;i++)for(let j=0;j<f.trailCount;j++){
 const index=(i*f.trailCount+j)*3;let x,y,z,brightness;
 if(t<0){
 const trail=(i%24)*.003+j*.004,riseAge=f.kind==='silver'?Math.max(0,age-j*.03):age;
 x=f.x;y=Math.max(.02,f.y*(f.size<10?Math.pow(riseAge/f.ascent,.85):(1-Math.pow(1-Math.min(1,riseAge/(f.ascent-(f.size===20?.6:.28))),2)))-(f.kind==='silver'?0:trail));z=f.z;
 brightness=f.kind==='ear'?(i===0&&j<5?.22*(1-j/5):0):i<24?(1-j/f.trailCount)*(f.kind==='silver'?2.2:1.4):0;
 }
 else if(f.kind==='candyburst'){
 const v=candyBigStarPoint(f.bigStars[i],f.r,t,j,f.trailCount);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
 }
 else if(f.kind==='candy'){
 const k=j*4,c=f.candyTrailCache,dir=f.directions[i],travel=f.r*f.shells[i]*c[k];
 x=f.x+dir.x*travel;y=f.y+dir.y*travel+c[k+1]-c[k+2];z=f.z+dir.z*travel;
 brightness=c[k+3]*(f.starLayers[i]===0?(j===0?3.2:1.05):(j===0?1.2:.35));
 }
 else if(f.kind==='sunflower'||f.kind==='spiral'){
 const point=f.kind==='spiral'?spiralPoint:sunflowerPoint;
 const v=point(f.directions[i],f.r,f.shells[i],t,j,f.trailCount,f.spec.life);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
 }
 else if(f.kind==='ear'){
 const v=earPoint(f.earStars[i],f.r,t,j);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
 }
 else if(f.kind==='silver'){
 // The tail is a short history of the same star, never a fresh delayed shell.
 const history=Math.min(t,1.10),at=Math.max(0,t-history*j/(f.trailCount-1)),dir=f.directions[i];
 const travel=f.r*f.shells[i]*f.silverVariation[i]*(1-Math.exp(-.90*at));
 x=f.x+dir.x*travel;y=f.y+(dir.y*travel+.065*at-.035*at*at);z=f.z+dir.z*travel;
 const starLife=f.silverLife[i];
 const starFade=Math.max(0,Math.min(1,(starLife-t)/.65));
 brightness=2.2*Math.pow(1-j/f.trailCount,1.25)*starFade*(y>.04?1:0);
 if(t<.08){brightness*=1+1.6*(1-t/.08);}
 }
 else if(f.kind==='willow'){
 // One break: sample the same star's recent path as its long tail grows.
 const at=Math.max(0,t-willowHistory*j/(f.trailCount-1)),dir=f.directions[i],travel=f.r*f.shells[i]*(1-Math.exp(-(f.size===20?.7:1.9)*at));
 x=f.x+dir.x*travel;y=f.y+dir.y*travel+.085*at-f.spec.gravity*at*at;z=f.z+dir.z*travel;
 brightness=Math.pow(1-j/f.trailCount,1.7)*(j===0?2:.9*willowTailGlow);
 }
 else if(isSenrin(f.kind)){
 const cluster=Math.floor(i/24),center=f.clusterCenters[cluster],childAge=t-f.clusterDelays[cluster],lag=j*f.spec.tail,at=Math.max(0,childAge-lag),spread=(f.size===20?.118:.083)*(1-Math.exp(-(f.size===20?2.1:2.9)*at)),drift=1-Math.exp(-(f.size===20?1.8:2.4)*t),dir=f.directions[i];
 x=f.x+center.x*drift+dir.x*spread;
 y=f.y+center.y*drift+dir.y*spread-.017*t*t-.025*at*at;
 z=f.z+center.z*drift+dir.z*spread;
 const childFade=Math.pow(Math.max(0,1-Math.max(0,childAge-1.1)/1.7),1.3);
 brightness=childAge>=lag?(j===0?3.8:1.75)*(1-j/f.trailCount)*childFade:0;
 // Brief parent-shell flash, then unlit travelling sub-shells until their fuses finish.
 if(t<.14){const dir=f.directions[i],flashRadius=.012+.045*(t/.14);x=f.x+dir.x*flashRadius;y=f.y+dir.y*flashRadius;z=f.z+dir.z*flashRadius;brightness=i<72&&j===0?4.8*(1-t/.14):0;}
 }
 else{
 const lag=j*(f.kind==='sunflower'&&f.shells[i]<.75?.006:f.spec.tail),at=Math.max(0,t-lag),dir=f.directions[i],travel=f.r*f.shells[i]*(1-Math.exp(-(f.size===20?.7:1.9)*at));
 x=f.x+dir.x*travel;y=f.y+dir.y*travel+.085*at-f.spec.gravity*at*at;z=f.z+dir.z*travel;
 brightness=(t>=lag+(f.spec.ignition?.[f.starLayers[i]]??0)?1:0)*Math.pow(1-j/f.trailCount,1.7)*(f.kind==='candy'?(f.starLayers[i]===0?(j===0?3.2:1.05):(j===0?1.2:.35)):(j===0?2:.9));
 // Fade tails along with their heads so the whole break has a clean ending.
 }
 if(f.kind==='ear'&&y<=.025)brightness=0;
 f.positions[index]=x;f.positions[index+1]=f.kind==='ear'?y:Math.max(.018,y);f.positions[index+2]=z;
 // Head samples already computed above: no second particle pass or temporary vectors.
 if(t>=0&&(j===0||f.kind==='ear')&&brightness>0&&(!isSenrin(f.kind)||t>=f.clusterDelays[Math.floor(i/24)])){
  const py=f.positions[index+1];light+=brightness;lightX+=x*brightness;lightY+=py*brightness;lightZ+=z*brightness;lightR2+=(x*x+py*py+z*z)*brightness;
  if(f.layerLight){f.layerLight[f.starLayers[i]]+=brightness;lightShellR2+=f.shells[i]*f.shells[i]*brightness;}
 }
 const col=f.starColors[i];if(isSenrin(f.kind)&&t>=0&&t<.14){f.colors[index]=brightness;f.colors[index+1]=brightness*.84;f.colors[index+2]=brightness*.55;}else{f.colors[index]=col.r*brightness;f.colors[index+1]=col.g*brightness;f.colors[index+2]=col.b*brightness;}
 }
 f.g.attributes.position.needsUpdate=true;f.g.attributes.color.needsUpdate=true;f.m.opacity=fade;
 f.reflectionGain=0;f.reflectionRadius=0;
 if(light>0){
  const cx=lightX/light,cy=lightY/light,cz=lightZ/light;
  f.reflectionCenter.set(cx,cy,cz);
  f.reflectionRadius=Math.sqrt(Math.max(0,lightR2/light-cx*cx-cy*cy-cz*cz))/(f.layerLight?Math.sqrt(lightShellR2/light):f.reflectionRadiusScale);
  const headBrightness=f.kind==='silver'?2.2:isSenrin(f.kind)?3.8:2;
  f.reflectionGain=.9*fade*Math.min(1,light/(f.n*headBrightness*(f.kind==='ear'?f.trailCount*.30:1)))*reflectionAppearance(f.reflectionRadius/f.r);
 }
} }
let fanQueue=[],cometFinishAt=null,cometCompleted=false;
const cometSoundSlots=new Map();
const comets=new CometField({town,bridge:bridgeView,map:sprite,headMaps:fireworkMaps,onLaunch:(s,now)=>{
 // One quiet launch voice per firing position and instant; no invented crackle.
 const key=s.group+':'+s.x.toFixed(2)+':'+Math.round(s.at/.06);
 if(cometSoundSlots.has(key)||!soundEngine||!audio)return;
 cometSoundSlots.set(key,now);
 const delay=bridgeView.active?bridgeView.delay(s.x,s.y,s.z,latestViewerTransform):.12;
 const position=bridgeView.active?bridgeView.position(s.x,s.y,s.z):null;
 soundEngine.playComet(s.x,audio.currentTime+Math.max(0,delay-(now-s.at)),position);
}});
function clearFans(){comets.clear();cometSoundSlots.clear();cometFinishAt=null;cometCompleted=false;}
function launchFans(mode='fan',startAt=time,style=mode==='cross'?'silver':'gold'){
 return comets.launch(mode,style,startAt);
}
function updateFans(){
 while(fanQueue.length&&fanQueue[0].at<=time){const cue=fanQueue.shift();if(time-cue.at>.35)continue;launchFans(cue.mode,cue.at,cue.style);}
 comets.update(time);
 for(const [key,at] of cometSoundSlots)if(time-at>5)cometSoundSlots.delete(key);
}
function beginCometStudy(pattern=$('cometPattern').value,style=$('cometStyle').value){
 beginPreview();launchFans(pattern,0,style);queueCometCrown(pattern,0);
 cometFinishAt=pattern==='guide'?12:pattern.startsWith('small-')?3.5:6.5;
 const spec=COMET_PATTERNS.find(p=>p.id===pattern);
 $('chapter').textContent='トラ打ち · '+spec.label;$('last').textContent=pattern.startsWith('small-')?SMALL_STYLE_LABELS[style]:COMET_STYLES[style].label;
 $('status').textContent=spec.description+' 同じ打ち方は「このトラを観る」で繰り返せます。';
}
function queueCometCrown(pattern,at){
 if(pattern!=='guide')return;
 // The first foreground stars lead; the existing crown then climbs behind them.
 burstQueue.push({at:at+.72,kind:'core',size:10,position:{x:0,z:-.84,heightOffset:.16,ignitionDelay:.04,startAt:at+.72}});
 burstQueue.sort((a,b)=>a.at-b.at);
}
function beginCometSequence(){
 if(['sweep','sweep-reverse','sweep-cross','sweep-cross-high'].includes($('cometPattern').value)){beginDirectionalCometSequence();return;}
 if($('cometPattern').value.startsWith('small-')){beginSmallCometSequence();return;}
 beginPreview();
 const cues=[{at:0,mode:'single',style:'gold'},{at:4,mode:'row',style:'silver'},{at:8,mode:'fan',style:'gold'},{at:12,mode:'cross',style:'blue'},{at:16,mode:'sweep',style:'red'},{at:20,mode:'inward',style:'gold'},{at:24,mode:'guide',style:'gold'}];
 fanQueue.push(...cues);queueCometCrown('guide',24);
 cometFinishAt=34;
 $('chapter').textContent='トラ打ち · 小さな演出';$('last').textContent='一本 → 列 → 扇 → 交差 → 流し → 中央 → 尺玉';
 $('status').textContent='約34秒。星と尾を主役にして、最後は尺玉へ視線をつなぎます。';
}
function beginDirectionalCometSequence(){
 beginPreview();
 const modes=['sweep','sweep-reverse','sweep','sweep-reverse','sweep-cross','sweep-cross-high','small-cross-tight'];
 const times=[0,2.1,4.2,6.3,8.4,10.8,13.2];
 fanQueue.push(...modes.map((mode,i)=>({at:times[i],mode,style:i===6?'green':'gold'})));
 cometFinishAt=18;
 $('chapter').textContent='大トラ・子トラ · 左右の掛け合い';$('last').textContent='右 → 左 → 右 → 左 → クロス → 高いクロス → 子トラ';
 $('status').textContent='約18秒。右と左の尾、２回目は高いクロス、最後は緑の星と金の尾の子トラへ。';
}
function beginSmallCometSequence(){
 const tight=$('cometPattern').value.endsWith('-tight');
 beginPreview();
 const cues=[{at:0,mode:'small-up',style:'green'},{at:4,mode:'small-cross',style:'red'},{at:8,mode:'small-fan',style:'silver'},{at:12,mode:'small-up',style:'blue'},{at:16,mode:'small-fan',style:'gold'}];
 if(tight)for(const cue of cues)if(cue.mode!=='small-fan')cue.mode+='-tight';
 fanQueue.push(...cues);queueCometCrown('guide',16);cometFinishAt=26;
 $('chapter').textContent=tight?'子トラ · すぼめた束の小さな演出':'子トラ · 星の束の小さな演出';$('last').textContent='吹き上げ → クロス → 扇 → 青い星 → 尺玉';
 $('status').textContent='約26秒。小さな星の束を主役にして、最後は尺玉の土台になります。';
}
function startRandomStarmine(plan,index=0){
 const sequence=randomStarmine(plan,time,index,$('mood').value==='lively');
 burstQueue=sequence.shots;fanQueue.push(...sequence.fans);fanQueue.sort((a,b)=>a.at-b.at);nextLaunch=sequence.nextLaunch+MAX_IGNITION_DELAY;
 $('last').textContent=sequence.label;$('status').textContent='おまかせの連続打ち：'+sequence.label+'。小玉と大玉の高さ、色、間を組み合わせます。';
}
function startStarmine(finale=false,wide=showPlan?.wideFinale){
 if(!finale&&showPlan?.mode==='random'){startRandomStarmine(showPlan,showPlan.slots.filter(s=>s<time+.01).length-1);return;}
 burstQueue=[];
 // Sweep from left to right, answer from the opposite bank, then a golden closing pair.
 let pattern=[[-.8,-.45],[-.4,-.25],[0,-.05],[.4,.15],[.8,.35],[.4,-.25],[0,.1],[-.4,.35]];
 if(showPlan?.mode==='two'||(showPlan?.mode==='random'&&((showPlan.seed+Math.floor(time))%2)))pattern=pattern.toReversed();
 pattern.forEach(([x,z],i)=>burstQueue.push({at:time+i*.9,kind:i%3===1?'willow':'core',size:i<4?3:5,position:{x,z}}));
 burstQueue.push({at:time+9,kind:'willow',size:5,position:{x:-.5,z:0}},{at:time+9,kind:'willow',size:5,position:{x:.5,z:0}});
 if(finale){
 burstQueue=burstQueue.filter(s=>s.at<time+9);
 if(wide){
 // Schedule by opening time: five low shells, three upper shells, then the crown.
 const opening=time+16.12,smallAscent=(1+5*.035)*1.2*(2.62/1.62);
 for(const [i,x] of [-.88,-.44,0,.44,.88].entries())burstQueue.push({at:opening-smallAscent,kind:'silver',size:5,position:{x,z:.05,heightOffset:-.22,wide:true}});
 for(const [i,x] of [-.68,0,.68].entries())burstQueue.push({at:opening+.60-3.12,kind:'silver',size:10,position:{x,z:-.12,heightOffset:.18,wide:true}});
 burstQueue.push({at:opening+.95-5.6,kind:'silver',size:20,position:{x:.025,z:-.16,heightOffset:.30,wide:true}});
 }else{
 const closing=[{x:-1,delay:.12,height:-.035},{x:-.5,delay:.29,height:.045},{x:0,delay:0,height:.015},{x:.5,delay:.19,height:-.025},{x:1,delay:.36,height:.055}];
 for(const shot of closing)burstQueue.push({at:time+13+shot.delay,kind:'silver',size:10,position:{x:shot.x,z:-.15,heightOffset:shot.height}});
 }
 burstQueue.sort((a,b)=>a.at-b.at);nextLaunch=300;
 }else nextLaunch=time+19;
 const groundIndex=Math.max(0,(showPlan?.slots??[]).filter(at=>at<=time+.1).length-1);
 fanQueue.push(...normalGroundCues(showPlan?.mode??'one',showPlan?.seed??101,groundIndex,time,finale));fanQueue.sort((a,b)=>a.at-b.at);
 $('last').textContent='スターマイン · 連続打ち';
}
function advanceStarmine(){
 while(burstQueue.length&&burstQueue[0].at<=time){
  const shot=burstQueue[0];
  if(shot.position?.ignitionDelay===undefined){
   const group=burstQueue.filter(s=>Math.abs(s.at-shot.at)<1e-6),delays=sampleIgnitionDelays(group.length);
   group.forEach((s,i)=>s.position={...s.position,ignitionDelay:delays[i]});
  }
  if(!launch(shot.kind,shot.size,shot.position))break;burstQueue.shift();
 }
}
function stopShow(){
 cancelMusicRequest();music.stop();
 running=false;previewing=false;showPlan=null;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();time=0;cueIndex=0;nextLaunch=.8;
 if(audio){audio.close();audio=null;soundEngine=null;}
 syncShowButtons();$('chapter').textContent='大会を終了';$('last').textContent='街の灯りだけを眺める';$('status').textContent='花火大会を止めました。次は最初から始まります。';drawMusicTimeline();
}
function resetAll(){
 cancelPreparation();controls?.release();if(bridgeView.active)leaveBridge();if(dioramaSaved)toggleDiorama();stopShow();restoreDefaultShells();if(showInfo.enabled)toggleShowInfo();const defaults={mood:'quiet',ending:'loop',volume:'0.3',scale:'1',distance:'2',height:'0',roomBrightness:'1',type:'core',size:'5',palette:'original',towerColor:'blue',audioMode:'original',program:'one',musicVolume:'0.65'};
 for(const [id,value] of Object.entries(defaults))$(id).value=value;music.setVolume(.65);
 try{localStorage.removeItem('hanabi-town-settings');}catch{}
 town.scale.setScalar(1);town.position.set(0,0,0);town.rotation.y=0;yaw=0;pitch=0;camera.position.set(0,1.2,2.9);setTowerColor();syncSize();syncPalette();applyRoomBrightness();
 if(renderer.xr.isPresenting)placeTown();
 $('chapter').textContent='幕開け · 0:00';$('last').textContent='次の一玉を待つ';$('status').textContent='設定と視点を初期状態に戻しました。';
}
function restart(){
 const musical=!!showPlan?.music;cancelMusicRequest();music.stop();previewing=false;previewPaused=false;fanQueue=[];clearFans();clearFireworks();burstQueue=[];burstSlots.clear();time=0;nextLaunch=.8;cueIndex=0;$('last').textContent='次の一玉を待つ';
 if(musical){prepareMusicProgram();ensureAudio();music.play(audio,0);running=true;}else{showPlan=null;if(!running)toggle();else prepareProgram();}syncShowButtons();
}

function beginPreview(){
 cancelMusicRequest();music.stop();
 running=false;previewing=true;previewPaused=false;showPlan=null;time=0;cueIndex=0;nextLaunch=.8;
 clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();
 syncShowButtons();$('chapter').textContent='試し打ち';$('last').textContent='次の一玉を待つ';
 $('status').textContent='試し打ち中。選んだ花火だけを上げます。';ensureAudio();
}
function advanceEmbers(dt){
 triggerEmbers.update(dt,shot=>{const ok=launch(shot.shell.kind,shot.shell.size,{x:shot.target.x,z:shot.target.z,palette:shot.shell.palette,manual:true});$('status').textContent=ok?(shot.hand==='left'?'左':'右')+'から送った '+shellName(shot.shell)+' が打ち上がりました。':'いまは打ち上げが混み合っています。少し間を置いてもう一度どうぞ。';});
}
function advance(dt){
 if(!running&&!previewing)return;
 if(showPlan?.music){advanceMusic(dt);return;}
 if(previewing){
  time+=dt;advanceEmbers(dt);updateFireworkEvents();advanceStarmine();updateFans();updateFireworks();
  if(cometFinishAt!==null&&time>=cometFinishAt){previewing=false;previewPaused=false;cometCompleted=true;cometFinishAt=null;cancelFutureSounds();$('chapter').textContent='トラ打ち · 終了';$('status').textContent='余韻まで終わりました。「このトラを観る」「次の打ち方を観る」で見比べられます。';}
  return;
 }
 time=Math.min(300,time+dt);advanceEmbers(dt);
 for(const [index,at] of (showPlan?.senrinAt??[]).entries()){
 const key='senrin-'+index;
 if(time>=at&&!burstSlots.has(key)&&fireworks.length===0&&triggerEmbers.count===0&&burstQueue.length===0){
 burstSlots.add(key);clearFans();fanQueue=[];const size=index===0?10:20;launch('senrin',size,{x:index===0?-.35:.35,z:-.1});nextLaunch=time+(size===20?16:11);
 $('status').textContent='彩色千輪：暗い間のあと、30輪が咲きます。';break;
 }
 }

 if(time>=(showPlan?.bigAt??130)&&!burstSlots.has('big')&&fireworks.length===0&&triggerEmbers.count===0){burstSlots.add('big');clearFireworks();clearFans();burstQueue=[];fanQueue=[];const special=showPlan?.special??{kind:'triple',size:20};launch(special.kind,special.size,{x:0,z:-.1});nextLaunch=time+17;$('status').textContent='特別玉：'+SIZES[special.size].label+'・'+TYPES[special.kind].label+'。一玉の層をゆっくりお楽しみください。';}
 if(time>=145&&time<155&&!burstSlots.has('ear-middle')&&fireworks.length===0&&triggerEmbers.count===0&&burstQueue.length===0&&comets.points===0){
  const study=normalEarSequence((showPlan.earSeed^0x75eac013)>>>0,time,1);burstSlots.add('ear-middle');burstQueue.push(...study.shots);nextLaunch=Math.max(nextLaunch,study.finishAt);
  $('status').textContent='稲穂の横一列 · 金の尾の余韻を味わう';
 }
 for(const slot of (showPlan?.slots??[45,200,250,270]))if(time>=slot&&!burstSlots.has(slot)&&(showPlan?.mode!=='random'||(fireworks.length===0&&triggerEmbers.count===0&&burstQueue.length===0))){burstSlots.add(slot);startStarmine(slot===270);break;}
 updateFireworkEvents();advanceStarmine();updateFans();
 const awaitingSpecial=(time>=(showPlan.bigAt-10)&&!burstSlots.has('big'))||showPlan.senrinAt.some((at,index)=>time>=at-10&&!burstSlots.has('senrin-'+index));
 const awaitingEar=time>=140&&time<155&&!burstSlots.has('ear-middle');
 const awaitingPattern=showPlan.mode==='random'&&showPlan.slots.some(slot=>time>=slot-10&&!burstSlots.has(slot));
 if(!burstQueue.length&&time>=nextLaunch&&time<285&&!awaitingSpecial&&!awaitingPattern&&!awaitingEar){const c=programCue(showPlan,time,cueIndex,$('mood').value==='lively');if(c&&launch(c.kind,c.size,c.position)){cueIndex++;nextLaunch=time+c.interval+((1+c.size*.035)*1.2*(2.62/1.62)-(1+c.size*.035)*1.2);}}
 updateFireworks();
 const elapsed=Math.min(300,Math.floor(time));$('chapter').textContent=chapter(Math.min(time,299))+' · '+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
 if(time>=300){if($('ending').value==='loop'){clearFireworks();clearFans();fanQueue=[];burstQueue=[];burstSlots.clear();time=0;nextLaunch=2;cueIndex=0;prepareProgram();}else{running=false;$('play').textContent='花火大会を観る';$('status').textContent='大会が終わりました。街の灯りをお楽しみください。';}}
}
function updateReflections(){
 town.updateWorldMatrix(true,false);
 for(const f of fireworks){const u=f.refl.material.uniforms;u.uCenter.value.copy(f.reflectionCenter);town.localToWorld(u.uCenter.value);u.uRadius.value=f.reflectionRadius/.8*town.scale.x;u.uWaterY.value=town.position.y+.006*town.scale.y;u.uGain.value=f.reflectionGain||0;u.uTime.value=time;u.uWorldScale.value=bridgeView.active?BRIDGE_SCALE:1;if(f.layerLight){for(let i=0;i<f.spec.radii.length;i++)u.uLayerGains.value[i]=Math.min(1,f.layerLight[i]/(2*Math.round(SIZES[f.size].stars*f.spec.layerWeights[i])));}f.refl.visible=u.uGain.value>0;}
}
function placeTown(){if(renderer.xr.isPresenting&&!bridgeView.active)pendingPlace=true;}
function ensureAudio(){
 if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();soundEngine=new FireworkAudio(audio,Number($('volume').value));}
 audio.resume().catch(e=>{$('status').textContent='音声を開始できませんでした：'+e.message;});
}
function toggle(){
 if(showPlan?.music){
  if(!running){
   if(musicCanFinish()){clearFireworks();clearFans();time=0;prepareMusicProgram();}
   ensureAudio();music.play(audio,time);running=true;
  }else{time=music.pause();running=false;cancelFutureSounds();}
  syncShowButtons();$('status').textContent=running?'音楽と花火を鑑賞中です。':'音楽と花火を一時停止しました。';return;
 }
 cancelMusicRequest();
 if(previewing){previewing=false;time=0;cueIndex=0;nextLaunch=.8;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();}
 if(!running&&!showPlan)prepareProgram();running=!running;
 syncShowButtons();$('status').textContent=running?(time<18.3?'稲穂の横一列から幕開け。金の尾の余韻をお楽しみください。':'オート大会を鑑賞中。操作せず、そのまま眺めてください。'):'夜の街で、ひと休み。';if(running)ensureAudio();else cancelFutureSounds();
}
$('play').disabled=false;$('play').textContent='花火大会を観る';
$('play').onclick=()=>{if(showPlan?.music)beginNormalShow();else if(time>=300)restart();else toggle();};
$('musicShow').onclick=beginMusicShow;$('musicStop').onclick=stopShow;$('musicRestart').onclick=()=>{if(showPlan?.music)restart();else beginMusicShow();};$('restart').onclick=restart;$('stop').onclick=stopShow;$('reset').onclick=resetAll;
$('musicFinale').onclick=()=>beginMusicExcerpt(MUSIC_PLAN.finalPreviewStart??MUSIC_PLAN.duration-12,'最後の大輪と、曲後の余韻を観ます。');
$('musicPyramid').onclick=()=>beginMusicExcerpt(musicMiddleStart(),'中盤から観ます。');
$('cometShow').onclick=()=>beginCometStudy();
$('cometNext').onclick=()=>{const options=[...$('cometPattern').options];const i=options.findIndex(o=>o.value===$('cometPattern').value);$('cometPattern').value=options[(i+1)%options.length].value;$('cometPattern').onchange();beginCometStudy();};
$('cometSequence').onclick=beginCometSequence;
$('cometPause').onclick=()=>{if(previewing)pauseShow();};
$('cometPattern').onchange=()=>{const small=$('cometPattern').value.startsWith('small-');$('cometSequence').textContent=small?($('cometPattern').value.endsWith('-tight')?'すぼめた子トラの演出 · 約26秒':'子トラの演出を観る · 約26秒'):(['sweep','sweep-reverse','sweep-cross','sweep-cross-high'].includes($('cometPattern').value)?'左右の掛け合いを観る · 約18秒':'大トラの演出を観る · 約34秒');$('cometDescription').textContent=COMET_PATTERNS.find(p=>p.id===$('cometPattern').value)?.description??'';for(const option of $('cometStyle').options){option.disabled=!small&&!COMET_STYLES[option.value];option.textContent=small?SMALL_STYLE_LABELS[option.value]:(COMET_STYLES[option.value]?.label??SMALL_STYLE_LABELS[option.value]);}if(!small&&!COMET_STYLES[$('cometStyle').value])$('cometStyle').value='gold';mrPanel.draw();};

$('fans').onclick=()=>beginCometStudy();
$('big').onclick=()=>{beginPreview();launch('triple',20,{x:0,z:-.1});};
$('finale').onclick=()=>{beginPreview();startStarmine(true,false);};
$('wideFinale').onclick=()=>{beginPreview();startStarmine(true,true);$('status').textContent='特別な締め：5号5発 → 0.6秒後に尺玉3発 → 頂上の二尺玉1発。';};
$('starmine').onclick=()=>{beginPreview();if($('program').value==='random')startRandomStarmine(createProgram('random',crypto.getRandomValues(new Uint32Array(1))[0]));else startStarmine(false,false);};
$('sample').onclick=()=>{beginPreview();syncSize();const ok=launch($('type').value,Number($('size').value),{x:0,z:.05,palette:$('palette').value});$('status').textContent=ok?'選んだ一玉を打ち上げています。':'この組み合わせを上げられません。種類と号数を確認してください。';};$('status').textContent='川と橋のある街へ、ようこそ。';
$('program').onchange=()=>{$('status').textContent=showPlan?'次の大会から「'+PROGRAM_NAMES[$('program').value]+'」で始まります。「大会を最初から」で今すぐ切り替えられます。':'「'+PROGRAM_NAMES[$('program').value]+'」を選びました。';};
$('audioMode').onchange=()=>{$('status').textContent=$('audioMode').value==='realistic'?'リアル寄せ合成の花火音です。':'現在の合成音です。';};
$('volume').oninput=()=>soundEngine?.setVolume(Number($('volume').value));
function applyTownHeight(){if(!bridgeView.active&&renderer.xr.isPresenting)town.position.y=Number($('height').value)-groundBottomY*town.scale.y;}
function adjustTownDistance(){
 if(bridgeView.active||!renderer.xr.isPresenting||!latestViewerTransform)return;
 const p=latestViewerTransform.position,d=Number($('distance').value);
 town.position.x=p.x-Math.sin(town.rotation.y)*d;town.position.z=p.z-Math.cos(town.rotation.y)*d;
}
$('scale').oninput=()=>{if(bridgeView.active)return;town.scale.setScalar(Number($('scale').value));applyTownHeight();if(dioramaSaved){bridgeView.miniaturePointScale=town.scale.x;bridgeView.syncPoints();}};$('distance').oninput=adjustTownDistance;
function previewPointer(e,activate=false){const r=canvas.getBoundingClientRect();return mrPanel.previewPointer((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2,camera,activate);}
canvas.onpointerdown=e=>{if(panelPreview){previewPointer(e,true);canvas.setPointerCapture(e.pointerId);return;}drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(panelPreview){previewPointer(e);return;}if(!drag)return;yaw+=(e.clientX-drag[0])*.003;pitch=bridgeView.active?Math.max(-1.48,Math.min(1.48,pitch-(e.clientY-drag[1])*.003)):Math.max(-.35,Math.min(.35,pitch+(e.clientY-drag[1])*.002));drag=[e.clientX,e.clientY];};canvas.onpointerup=()=>{drag=null;if(panelPreview)mrPanel.release();};canvas.onpointercancel=()=>{drag=null;if(panelPreview)mrPanel.release();};canvas.onwheel=e=>{if(!renderer.xr.isPresenting&&!bridgeView.active)camera.position.z=Math.max(dioramaSaved?.4:1.6,Math.min(dioramaSaved?2:5,camera.position.z+e.deltaY*.002));};
const xrControllers=[];for(let i=0;i<2;i++){const c=renderer.xr.getController(i);scene.add(c);xrControllers.push(c);}
// Keep the next visit ready for viewing, without saving transient show state.
function allowedSize(kind,value){if(kind==='candysenrin')return value==='10';if(kind==='candyburst')return value==='5'||value==='10';if(kind==='candy')return ['3','5','10'].includes(value);if(kind==='ear')return value==='2';if(value==='2')return false;return !(kind==='kiku'?value!=='3':kind==='triple'?value!=='20':['senrin','quad','penta'].includes(kind)?!['10','20'].includes(value):kind==='double'?value!=='10':value==='20');}
function syncSize(){const kind=$('type').value;for(const o of $('size').options)o.disabled=!allowedSize(kind,o.value);if(kind==='ear')$('size').value='2';else if(kind==='kiku')$('size').value='3';else if(kind==='candysenrin')$('size').value='10';else if(kind==='candy'&&!['3','5','10'].includes($('size').value))$('size').value='3';else if(kind==='candyburst'&&!['5','10'].includes($('size').value))$('size').value='5';else if(kind==='triple')$('size').value='20';else if(kind==='double')$('size').value='10';else if(['senrin','quad','penta'].includes(kind)){if(!['10','20'].includes($('size').value))$('size').value='10';}else if(['2','20'].includes($('size').value))$('size').value='5';}
function syncPalette(){
 const kind=$('type').value,select=$('palette'),previous=select.value,options=paletteOptions(kind);
 select.replaceChildren(...(options.length?options:[{id:'original',label:'この花火の配色'}]).map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.label;return option;}));
 select.disabled=!options.length;select.value=options.some(p=>p.id===previous)?previous:'original';
}
$('type').addEventListener('change',()=>{syncSize();syncPalette();});
const settingsIds=['program','mood','ending','volume','scale','distance','height','roomBrightness','type','size','palette','towerColor','audioMode','musicVolume'];
try{const saved=JSON.parse(localStorage.getItem('hanabi-town-settings')||'{}');for(const id of settingsIds){if(id==='palette')syncPalette();const el=$(id);if(saved[id]!==undefined){const old=el.value;el.value=saved[id];if(el.value==='')el.value=old;}}town.scale.setScalar(Number($('scale').value));}catch{}
setTowerColor();syncSize();syncPalette();$('programInfo').textContent=PROGRAM_NAMES[$('program').value];
for(const id of settingsIds)$(id).addEventListener('change',()=>{if(dioramaSaved)return;try{localStorage.setItem('hanabi-town-settings',JSON.stringify(Object.fromEntries(settingsIds.map(id=>[id,$(id).value]))));}catch{}});
let pendingDiorama=false,pendingPlace=false,mrStarting=false,mrSession=null,mrMetrics=null,mrMeta=null,lastMRReport=null,latestViewerTransform=null,pendingPanelOpen=false,pendingBridge=false,vrSupported=false;
let miniAngles=null;
const desktopCamera={position:new T.Vector3(),quaternion:new T.Quaternion(),fov:55};
$('height').oninput=applyTownHeight;
function applyRoomBrightness(){
 $('roomBrightnessValue').textContent=Math.round(Number($('roomBrightness').value)*100)+'％';
 mrDimming.set(bridgeView.active?0:$('roomBrightness').value,mrSession?.environmentBlendMode);
}
$('roomBrightness').oninput=applyRoomBrightness;applyRoomBrightness();
$('mrPreset').onclick=()=>{if(bridgeView.active)return;if(dioramaSaved)toggleDiorama();
 for(const [id,value] of Object.entries({scale:'0.35',distance:'1.8',height:'0'})){$(id).value=value;$(id).dispatchEvent(new Event('change'));}
 town.scale.setScalar(.35);applyTownHeight();adjustTownDistance();$('status').textContent='小さな街：幅1.12m・奥行き0.74m、前方1.8m、街の土台の底面を床に合わせます。';
};
function mrSettings(){return {scale:Number($('scale').value),distance:Number($('distance').value),height:Number($('height').value),roomBrightness:Number($('roomBrightness').value),audioMode:$('audioMode').value,volume:Number($('volume').value),program:$('program').value};}
function mrReport(){return mrMetrics?{...mrMeta,ended:!mrSession,environmentBlendMode:mrMeta.environmentBlendMode,settings:mrSettings(),peakFireworkParticles:mrMetrics.peakParticles,peakDrawCalls:mrMetrics.peakCalls,samples:[...mrMetrics.samples]}:lastMRReport;}
$('mrExport').onclick=()=>{
 const report=mrReport();if(!report){$('mrInfo').textContent='MR実機の計測はまだありません。';return;}
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='hanabi-town-MR-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function readPanel(){
 const result={diorama:!!dioramaSaved,cometPaused:previewPaused,cometDescription:$('cometDescription').textContent,musicState:$('musicState').textContent,musicDescription:selectedMusic.description,playLabel:$('play').textContent,musicLabel:$('musicShow').textContent,musicBusy,musicShow:!!showPlan?.music,awaitingShow:!running&&!previewing&&!showPlan,resumeShow:!!showPlan,preparing:preparation?{...preparation,summary:prepareSummary()}:null,prepareOptions:preparation?prepareOptions():[],running,loadedLeft:preparedShellName(loadedShells.left),loadedRight:preparedShellName(loadedShells.right),bridge:bridgeView.active,xrMode:mrMeta?.sessionMode,chapter:$('chapter').textContent,last:$('last').textContent,status:$('status').textContent,metric:$('mrInfo').textContent};
 for(const id of ['program','mood','ending','type','size','palette','audioMode','towerColor','cometPattern','cometStyle','musicTrack']){
  const el=$(id);result[id]={value:el.value,selected:el.selectedOptions[0]?.textContent??'',options:[...el.options].map(o=>({value:o.value,disabled:o.disabled}))};
 }
 for(const id of ['scale','distance','height','volume','roomBrightness','musicVolume'])result[id]={value:Number($(id).value)};
 return result;
}
function cyclePanel(id,direction){
 const el=$(id),value=nextEnabledOption([...el.options].map(o=>({value:o.value,disabled:o.disabled})),el.value,direction);
 if(value===el.value)return;el.value=value;el.dispatchEvent(new Event('change'));
}
function adjustPanel(id,direction){
 if(bridgeView.active&&['scale','distance','height'].includes(id))return;
 const el=$(id);el.value=String(stepRange(Number(el.value),direction,Number(el.min),Number(el.max),['volume','musicVolume'].includes(id)?.05:Number(el.step)));
 el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));
}
function setPanelRange(id,value,commit=false){
 if(bridgeView.active&&id==='roomBrightness')return;
 const el=$(id);el.value=String(clampBrightness(value));el.dispatchEvent(new Event('input'));
 if(commit)el.dispatchEvent(new Event('change'));
}
async function exitMRToPage(){
 if(panelPreview){mrPanel.end();return;}
 if(!mrSession)return;
 try{await mrSession.end();}catch(e){$('status').textContent='MRを終了できませんでした：'+e.message;}
}
const entryTip=new EntryTip(scene);
const mrPanel=new MRPanel({scene,read:readPanel,click:id=>$(id).click(),cycle:cyclePanel,adjust:adjustPanel,place:placeTown,exit:exitMRToPage,set:setPanelRange,pageChanged:page=>setPanelTab(page),prepareChoose:choosePreparation,prepareTab});
for(const c of xrControllers)mrPanel.attach(c);showInfo.entries=mrPanel.controllers;
const wristMenu=new WristMenu({scene,entries:mrPanel.controllers,read:()=>bridgeView.active,readInfo:()=>showInfo.enabled,readDiorama:()=>!!dioramaSaved,choose:mode=>{if(mode==='show-info'){toggleShowInfo();return;}if(mode==='bridge'){if(!bridgeView.active)$('bridge').click();return;}if(bridgeView.active)leaveBridge();if(mode==='diorama'&&!dioramaSaved)toggleDiorama();else if(mode==='miniature'&&dioramaSaved)toggleDiorama();}});
function toggleShowInfo(){showInfo.setEnabled(!showInfo.enabled);$('showInfo').textContent=showInfo.enabled?'時間と玉名を隠す':'時間と玉名を表示';wristMenu.draw();}
$('showInfo').onclick=toggleShowInfo;
// Each hand keeps a snapshot of the chosen shell; changing the picker later
// does not silently replace a prepared shell during the automatic show.
const DEFAULT_PREPARED_SHELLS={left:{kind:'triple',size:20,palette:'original'},right:{kind:'silver',size:10,palette:'original'}};
const loadedShells={left:null,right:null};
function restoreDefaultShells(){
 for(const hand of ['left','right']){loadedShells[hand]={...DEFAULT_PREPARED_SHELLS[hand]};$('loaded'+(hand==='left'?'Left':'Right')).textContent=preparedShellName(loadedShells[hand]);}
}
restoreDefaultShells();
function chosenShell(){syncSize();return {kind:$('type').value,size:Number($('size').value),palette:$('palette').value};}
function shellName(shell){return shell?SIZES[shell.size].label+' · '+TYPES[shell.kind].label.replace('（軽量テスト）',''):'選択中の一玉';}
function preparedShellName(shell){const label=shell&&paletteOptions(shell.kind).find(p=>p.id===shell.palette)?.label;return shellName(shell)+(label?' · '+label:'');}
function loadShell(hand){loadedShells[hand]=chosenShell();$('loaded'+(hand==='left'?'Left':'Right')).textContent=shellName(loadedShells[hand]);$('status').textContent=(hand==='left'?'左':'右')+'トリガーに '+shellName(loadedShells[hand])+' を仕込みました。';mrPanel.draw();}
let preparation=null;
const prepareFields=['kind','size','palette'];
const preparedKinds=['willow','silver','core','double','triple','quad','penta','senrin','candy','candyburst','candysenrin'];
function prepareOptions(){
 const {draft,tab}=preparation;
 if(tab===0)return preparedKinds.map(value=>({value,label:TYPES[value].label.replace('（軽量テスト）',''),disabled:false}));
 if(tab===1)return ['10','20'].map(v=>({value:v,label:SIZES[v].label,disabled:!allowedSize(draft.kind,v)}));
 const colors=paletteOptions(draft.kind);return colors.length?colors.map(o=>({value:o.id,label:o.label,disabled:false})):[{value:'original',label:'この花火の配色',disabled:false}];
}
function prepareSummary(){const d=preparation.draft,p=paletteOptions(d.kind).find(p=>p.id===d.palette);return shellName(d)+(p?' · '+p.label:'');}
function drawPreparation(){
 $('preparePanel').hidden=!preparation;
 for(let i=0;i<5;i++)$('browserPage'+i).hidden=!!preparation||i!==mrPanel.page;
 if(preparation){
  const hand=preparation.hand==='left'?'左':'右';$('prepareTitle').textContent=hand+'トリガーに仕込む';$('prepareConfirm').textContent='この玉を'+hand+'に仕込む';$('prepareSummary').textContent=prepareSummary();
  for(let i=0;i<3;i++){const el=$('prepareTab'+i);el.setAttribute('aria-selected',String(i===preparation.tab));el.tabIndex=i===preparation.tab?0:-1;}
  $('prepareChoices').setAttribute('aria-labelledby','prepareTab'+preparation.tab);
  $('prepareChoices').replaceChildren(...prepareOptions().map(o=>{const button=document.createElement('button');button.textContent=o.label;button.disabled=o.disabled;button.setAttribute('aria-pressed',String(String(preparation.draft[prepareFields[preparation.tab]])===o.value));button.onclick=()=>choosePreparation(o.value);return button;}));
 }
 mrPanel.draw();
}
function openPreparation(hand){
 const draft={...(loadedShells[hand]??chosenShell())};if(!preparedKinds.includes(draft.kind))draft.kind='core';if(!['10','20'].includes(String(draft.size))||!allowedSize(draft.kind,String(draft.size)))draft.size=Number(['10','20'].find(v=>allowedSize(draft.kind,v)));if(!paletteOptions(draft.kind).some(p=>p.id===draft.palette))draft.palette=paletteOptions(draft.kind)[0]?.id??'original';
 preparation={hand,tab:0,draft};drawPreparation();
}
function choosePreparation(value){
 if(!preparation||!prepareOptions().some(o=>o.value===value&&!o.disabled))return;
 const d=preparation.draft,field=prepareFields[preparation.tab];d[field]=field==='size'?Number(value):value;
 if(field==='kind'){if(!allowedSize(d.kind,String(d.size)))d.size=Number(['10','20'].find(v=>allowedSize(d.kind,v)));if(!paletteOptions(d.kind).some(p=>p.id===d.palette))d.palette=paletteOptions(d.kind)[0]?.id??'original';}
 drawPreparation();
}
function prepareTab(tab){if(preparation){preparation.tab=tab;drawPreparation();}}
function cancelPreparation(){preparation=null;drawPreparation();}
function confirmPreparation(){
 if(!preparation)return;const {hand,draft}=preparation;loadedShells[hand]={...draft};$('loaded'+(hand==='left'?'Left':'Right')).textContent=preparedShellName(draft);
 $('status').textContent=(hand==='left'?'左':'右')+'トリガーに '+prepareSummary()+' を仕込みました。';cancelPreparation();
}
$('loadLeft').onclick=()=>openPreparation('left');$('loadRight').onclick=()=>openPreparation('right');
$('prepareConfirm').onclick=confirmPreparation;$('prepareCancel').onclick=cancelPreparation;
for(let i=0;i<3;i++){$('prepareTab'+i).onclick=()=>prepareTab(i);$('prepareTab'+i).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;prepareTab(next);$('prepareTab'+next).focus();};}
function firePrepared(hand,origin,direction){
 if(hand!=='left'&&hand!=='right')return;
 if(previewing&&previewPaused){$('status').textContent='試し打ちを一時停止中です。右Bで再開できます。';return;}
 // Trial shots start a trial only when the user actually fires on that tab.
 // Show-tab shots append to the existing show, including its pending cues.
 if(mrPanel.page===1){if(!previewing)beginPreview();}
 else if(!running){$('status').textContent='大会を開始・再開すると、仕込んだ一玉を追加できます。';return;}
 // A prepared hand always wins, including when the trial tab stays selected.
 ensureAudio();const shell=loadedShells[hand]??chosenShell();
 const points=fireworks.reduce((n,f)=>n+f.n*f.trailCount,0)+(comets.points??0)+triggerEmbers.pending.reduce((n,s)=>n+manualPointCost(s.shell.kind,s.shell.size,SIZES,TYPES),0)+manualPointCost(shell.kind,shell.size,SIZES,TYPES);
 const ok=manualBudget.accepts(points)&&triggerEmbers.send(hand,shell,origin,direction);
 $('status').textContent=ok?(hand==='left'?'左':'右')+'トリガーで '+shellName(shell)+' を街へ送りました。':'いまは描画の負荷が大きいため、追加の発射を待っています。少し間を置いてもう一度どうぞ。';
}
function pauseShow(){if(previewing){previewPaused=!previewPaused;if(previewPaused)cancelFutureSounds();else ensureAudio();$('status').textContent=previewPaused?'試し打ちを一時停止しました。右Bで再開できます。':'試し打ちを再開しました。';}else if(running||showPlan)toggle();}
function setPanelTab(page){
 preparation=null;$('preparePanel').hidden=true;mrPanel.page=page;
 for(let i=0;i<5;i++){$('browserPage'+i).hidden=i!==page;$('browserTab'+i).setAttribute('aria-selected',String(i===page));$('browserTab'+i).tabIndex=i===page?0:-1;}
 mrPanel.draw();
}
const PANEL_PAGES=[0,4,1,2,3];
for(const [index,i] of PANEL_PAGES.entries()){$('browserTab'+i).onclick=()=>setPanelTab(i);$('browserTab'+i).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=PANEL_PAGES[e.key==='Home'?0:e.key==='End'?PANEL_PAGES.length-1:(index+(e.key==='ArrowRight'?1:PANEL_PAGES.length-1))%PANEL_PAGES.length];setPanelTab(next);$('browserTab'+next).focus();};}setPanelTab(0);

const townGrabTarget=new T.Mesh(new T.BoxGeometry(3.2,.10,2.1),new T.MeshBasicMaterial({side:T.DoubleSide}));townGrabTarget.position.y=ground.position.y;townGrabTarget.visible=false;town.add(townGrabTarget);
const controls=new XRControls({entries:mrPanel.controllers,town,townTarget:townGrabTarget,groundBottomY,panels:[mrPanel,wristMenu,showInfo],sidebar:mrPanel,wrist:wristMenu,bridge:bridgeView,fire:firePrepared,pause:pauseShow,changed:commit=>{
 $('scale').value=String(town.scale.x);$('height').value=String(Math.max(0,town.position.y+groundBottomY*town.scale.y));
 if(latestViewerTransform){const p=latestViewerTransform.position;$('distance').value=String(Math.hypot(town.position.x-p.x,town.position.z-p.z));}
 if(dioramaSaved){bridgeView.miniaturePointScale=town.scale.x;bridgeView.syncPoints();}
 if(commit&&!dioramaSaved)for(const id of ['scale','height','distance'])$(id).dispatchEvent(new Event('change'));
}});

function toggleDiorama(){
 if(bridgeView.active)return;
 controls.release();
 if(dioramaSaved){
  const saved=dioramaSaved;dioramaSaved=null;controls.diorama=false;
  town.position.copy(saved.position);town.quaternion.copy(saved.quaternion);town.scale.copy(saved.scale);
  camera.position.copy(saved.camera);for(const [id,v] of Object.entries(saved.settings)){$(id).min=v.min;$(id).max=v.max;$(id).step=v.step;$(id).value=v.value;}
  bridgeView.miniaturePointScale=1;bridgeView.syncPoints();$('diorama').textContent='ジオラマサイズで観る';$('status').textContent='元の街の大きさと位置に戻りました。';
 }else{
  dioramaSaved={position:town.position.clone(),quaternion:town.quaternion.clone(),scale:town.scale.clone(),camera:camera.position.clone(),settings:Object.fromEntries(['scale','height','distance'].map(id=>{const e=$(id);return [id,{value:e.value,min:e.min,max:e.max,step:e.step}];}))};
  controls.diorama=true;$('scale').min='.10';$('scale').max='.30';$('scale').step='.01';$('scale').value='.18';$('height').max='1.5';$('height').value='.75';$('distance').value='.65';$('distance').min='.35';
  town.scale.setScalar(.18);
  if(latestViewerTransform){const p=latestViewerTransform.position,m=latestViewerTransform.matrix;let x=-m[8],z=-m[10],l=Math.hypot(x,z);if(l<.001){x=0;z=-1;l=1;}town.position.set(p.x+x/l*.65,.75-groundBottomY*.18,p.z+z/l*.65);}
  else{town.position.set(0,.75-groundBottomY*.18,0);camera.position.set(0,1.15,.95);}
  bridgeView.miniaturePointScale=.18;bridgeView.syncPoints();$('diorama').textContent='通常サイズに戻る';$('status').textContent='机の上の花火大会：幅約58cm・奥行き約38cm。グリップで掴んで上下にも動かせます。';
 }
 mrPanel.draw();wristMenu.draw();
}
$('diorama').onclick=toggleDiorama;

for(let i=0;i<2;i++){const hand=renderer.xr.getHand(i);scene.add(hand);wristMenu.attachHand(hand);}
if(panelPreview){
 const previewStyle=document.createElement('style');previewStyle.textContent='body.mr-panel-preview header,body.mr-panel-preview aside,body.mr-panel-preview footer{display:none}';document.head.append(previewStyle);document.body.classList.add('mr-panel-preview');
 camera.lookAt(0,.55,0);camera.updateMatrixWorld();
 mrPanel.active=true;mrPanel.preview=true;mrPanel.openAt({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},{side:0,distance:1.45,drop:.3});
 addEventListener('keydown',e=>{if(e.key.toLowerCase()==='x'){mrPanel.active=true;mrPanel.preview=true;if(mrPanel.visible)mrPanel.close();else mrPanel.openAt({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},{side:0,distance:1.45,drop:.3});}});
}
function syncViewControls(){
 $('bridge').textContent=bridgeView.active?'ミニチュアに戻る':'街に入る · 手前の橋';
 $('viewHint').textContent=bridgeView.active?'手前の橋に座っています。顔を上げて花火を、下を向いて川面を。':'街全体を眺める／橋の上から見上げる。どちらも同じ花火大会です。';
 for(const id of ['scale','distance','height','roomBrightness','mrPreset','diorama'])$(id).disabled=bridgeView.active;
 document.body.classList.toggle('bridge-view',bridgeView.active);
}
function applyViewBackground(){
 const ar=mrSession?.environmentBlendMode==='alpha-blend',miniAR=ar&&!bridgeView.active;
 scene.background=miniAR?null:new T.Color(ar?0x000000:0x050a16);
 scene.fog=miniAR?null:new T.FogExp2(ar?0x000000:0x050a16,bridgeView.active?.085/BRIDGE_SCALE:.085);
 renderer.setClearColor(miniAR?0x000000:0x050a16,miniAR?0:1);applyRoomBrightness();
}
function enterBridge(transform=null){
 if(bridgeView.active)return;entryTip.end();triggerEmbers.clear();controls.release();wristMenu.close();wristMenu.moved=false;cancelFutureSounds();miniAngles={yaw,pitch};pendingPlace=false;
 bridgeView.enter(transform);yaw=0;pitch=.95;applyViewBackground();syncViewControls();
 showInfo.reanchor();mrMeta?.viewChanges.push({showTime:time,mode:'bridge'});
 $('status').textContent='手前の橋に座りました。パネルを閉じて、花火を見上げてください。';
}
function leaveBridge(){
 if(!bridgeView.active)return;triggerEmbers.clear();controls.release();wristMenu.close();wristMenu.moved=false;cancelFutureSounds();bridgeView.leave();yaw=miniAngles?.yaw??0;pitch=miniAngles?.pitch??0;miniAngles=null;
 applyViewBackground();syncViewControls();showInfo.reanchor();mrMeta?.viewChanges.push({showTime:time,mode:'miniature'});
 $('status').textContent='ミニチュアの街へ戻りました。花火大会は続いています。';
}
async function checkMR(){
 if(!isSecureContext){$('mr').textContent='MRにはHTTPSかQuestのlocalhostが必要';$('mrInfo').textContent='LANの通常HTTPではMRを開始できません。';return;}
 if(!navigator.xr){$('mr').textContent='部屋で観る · Quest対応';$('mrInfo').textContent='WebXRがありません。Quest Browserで開いてください。';return;}
 try{const [ar,vr]=await Promise.all([navigator.xr.isSessionSupported('immersive-ar'),navigator.xr.isSessionSupported('immersive-vr')]);vrSupported=vr;$('mr').disabled=!ar;$('mr').textContent=ar?'部屋で観る':'このブラウザはMR非対応';$('mrInfo').textContent=ar||vr?'QuestでMR・橋の上からの鑑賞を開始できます。':'このブラウザでは、画面上で橋の視点を試せます。';}catch(e){$('mr').textContent='MR対応を確認できませんでした';$('mrInfo').textContent=e.name+'：'+e.message;}
}
function finishMR(){
 cancelMusicRequest();
 if(previewing&&!previewPaused){previewPaused=true;cancelFutureSounds();}
 entryTip.end();cancelPreparation();
 triggerEmbers.clear();manualBudget.reset();controls.end();cancelFutureSounds();if(bridgeView.active)leaveBridge();if(dioramaSaved)toggleDiorama();pendingDiorama=false;pendingPlace=false;pendingPanelOpen=false;pendingBridge=false;mrStarting=false;mrSession=null;latestViewerTransform=null;mrPanel.end();wristMenu.end();showInfo.end();mrDimming.end();town.visible=true;
 if(running){if(showPlan?.music)time=music.pause();running=false;syncShowButtons();}
 $('status').textContent='鑑賞を終了して元のページへ戻りました。大会は一時停止しています。';
 applyViewBackground();town.scale.setScalar(Number($('scale').value));town.position.set(0,0,0);town.rotation.y=0;camera.position.copy(desktopCamera.position);camera.quaternion.copy(desktopCamera.quaternion);camera.fov=desktopCamera.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();previous=0;
 lastMRReport=mrReport();$('mr').disabled=false;$('mr').textContent='部屋で観る';$('bridge').disabled=false;
 const rows=mrMetrics?.samples??[];$('mrInfo').textContent=rows.length?'鑑賞終了。'+rows.length+'区間を計測、花火の最大粒子数 '+mrMetrics.peakParticles.toLocaleString()+'点。計測結果を保存できます。':'鑑賞終了。計測できた区間はありません。';$('mrExport').disabled=!mrMetrics;
}
async function startXR(mode,bridge=false){
 if(mrStarting||mrSession)return;mrStarting=true;$('mr').disabled=true;$('bridge').disabled=true;
 let session;
 try{
  ensureAudio();if(bridgeView.active)leaveBridge();if(dioramaSaved){toggleDiorama();pendingDiorama=true;}desktopCamera.position.copy(camera.position);desktopCamera.quaternion.copy(camera.quaternion);desktopCamera.fov=camera.fov;
  session=await navigator.xr.requestSession(mode,{requiredFeatures:['local-floor'],optionalFeatures:['hand-tracking']});
  session.addEventListener('end',finishMR,{once:true});
  session.addEventListener('visibilitychange',()=>{previous=0;mrMetrics?.breakWindow();if(session.visibilityState!=='visible'){pauseMusicForVisibility();triggerEmbers.clear();controls.release();controls.edges=new WeakMap();mrPanel.release();showInfo.release();wristMenu.gesture.reset();}});
  await renderer.xr.setSession(session);mrSession=session;showInfo.reanchor();mrStarting=false;$('bridge').disabled=false;mrMetrics=new XRMetrics();
  mrMeta={build:BUILD_VERSION,sessionMode:mode,startedAt:new Date().toISOString(),environmentBlendMode:session.environmentBlendMode,userAgent:navigator.userAgent,measurement:'XR callback FPS and animation/UI update + render CPU time; not GPU/compositor FPS',initialSettings:mrSettings(),placements:[],viewChanges:[]};
  applyViewBackground();town.visible=false;pendingPlace=true;pendingBridge=bridge;pendingPanelOpen=true;previous=0;$('mrExport').disabled=false;
  // Enter the room with an unlit sky; only the explicit show button starts it.
  if(!bridge){stopShow();$('chapter').textContent='開演前 · 街を眺める';$('last').textContent='好きな位置に街を置いてください';$('status').textContent='まずは街をじっくりどうぞ。台座へビームを合わせ、グリップで掴めます。サイドパネルの「花火大会を観る」で開演します。';}
 }catch(e){if(session)await session.end().catch(()=>{});if(pendingDiorama&&!dioramaSaved){pendingDiorama=false;toggleDiorama();}mrStarting=false;$('mr').disabled=false;$('bridge').disabled=false;$('status').textContent='鑑賞を開始できませんでした：'+e.name+'：'+e.message;}
}
$('mr').onclick=()=>startXR('immersive-ar');
$('bridge').onclick=()=>{
 if(mrStarting)return;
 if(bridgeView.active){leaveBridge();return;}
 if(mrSession){if(latestViewerTransform){enterBridge(latestViewerTransform);mrPanel.draw();}return;}
 if(vrSupported&&!panelPreview){startXR('immersive-vr',true);return;}
 // Desktop preview and browsers without immersive VR share the same bridge.
 ensureAudio();enterBridge();if(panelPreview)mrPanel.draw();
};syncViewControls();checkMR();
let previous=0;renderer.setAnimationLoop((stamp,frame)=>{
 const session=renderer.xr.getSession();const pose=frame?frame.getViewerPose(renderer.xr.getReferenceSpace()):null;
 const xrVisible=(!session||(session.visibilityState==='visible'&&pose!==null))&&!document.hidden;
 if(!xrVisible)pauseMusicForVisibility();
 if(pose)latestViewerTransform=pose.transform;
 const dt=previous&&xrVisible?Math.min((stamp-previous)/1000,.05):0;previous=xrVisible?stamp:0;
 if(pendingPlace&&pose){
  showInfo.reanchor();
  const placement=placementFromPose(pose.transform,Number($('distance').value),Number($('height').value),town.rotation.y,-groundBottomY*town.scale.y);
  town.position.set(placement.x,placement.y,placement.z);town.rotation.y=placement.yaw;town.visible=true;pendingPlace=false;
  mrMeta?.placements.push({showTime:time,...mrSettings(),eyeHeight:placement.eyeHeight});
  if(pendingDiorama){pendingDiorama=false;toggleDiorama();}if(pendingBridge){enterBridge(pose.transform);pendingBridge=false;}
 }
 if(pendingPanelOpen&&pose){mrPanel.begin(pose.transform);setPanelTab(0);controls.begin(pose.transform);if(mrMeta?.sessionMode==='immersive-ar'&&!bridgeView.active)entryTip.begin(pose.transform,stamp);pendingPanelOpen=false;}
 entryTip.update(stamp,!!session&&xrVisible&&!bridgeView.active);
 $('cometTime').textContent=previewing?'試し打ち '+time.toFixed(1)+'秒'+(previewPaused?' · 一時停止':''):cometCompleted?'試し打ちが終了しました':showPlan?.music?'曲つき演出':'開演前';
 $('cometPause').textContent=previewPaused?'試し打ちを再開':'試し打ちを一時停止';$('cometPause').disabled=!previewing;
 const updateStart=performance.now();
 manualBudget.observe(stamp,!!frame&&xrVisible&&(running||(previewing&&!previewPaused)));
 if((running||(previewing&&!previewPaused))&&xrVisible)advance(dt*($('candyCard')?Number($('candySpeed').value):1));
 if(candyPeakAt!==null&&running&&time>=candyPeakAt){candyPeakAt=null;time=music.pause();running=false;cancelFutureSounds();syncShowButtons();$('status').textContent=candyPeakLabel+'「再開」で続きも観られます。';}
 if($('candyCard')&&candyFreezeAt!==null&&$('candyFreeze').checked&&time>=candyFreezeAt){previewPaused=true;candyFreezeAt=null;cancelFutureSounds();$('candyPause').textContent='再開';}
 if($('candyCard'))$('candyClock').textContent='経過 '+time.toFixed(1)+'秒'+(previewPaused?' · 一時停止':'');
 if(!renderer.xr.isPresenting){const target=bridgeView.active?new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).add(camera.position):new T.Vector3(Math.sin(yaw)*(dioramaSaved?.25:1.2),(dioramaSaved?.88:.55)+pitch,0);camera.lookAt(target);}
 bridgeView.listener(audio,pose?.transform);
 if(xrVisible&&!running&&(!previewing||previewPaused))triggerEmbers.draw();if(xrVisible){towerLighting.update(dt);riverNight.update(stamp/1000);rooftopCranes.update(stamp/1000);}updateRoofLights(stamp/1000);updateReflections();if(frame&&xrVisible)mrPanel.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform);else if(panelPreview)mrPanel.update(stamp,null,null,null);if(frame&&xrVisible)wristMenu.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform,{drawHands:bridgeView.active||mrMeta?.sessionMode==='immersive-vr',busy:controls.grabs.size>0});showInfo.update({time,running,previewing,fireworks},pose?.transform,!!session,xrVisible);if(xrVisible)showInfo.drag(stamp,frame,renderer.xr.getReferenceSpace());else showInfo.release();if(frame)controls.update(dt,xrVisible?frame:null,renderer.xr.getReferenceSpace(),xrVisible?pose?.transform:null);const renderStart=performance.now();if(($('candyCard')||new URLSearchParams(location.search).has('candyShow'))&&!session){const width=Math.max(240,innerWidth-370);renderer.setViewport(0,0,width,innerHeight);camera.aspect=width/innerHeight;camera.updateProjectionMatrix();}renderer.render(scene,camera);
 if(frame&&mrMetrics&&xrVisible){
  const row=mrMetrics.record(stamp,{particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0)+(comets.points??0),calls:renderer.info.render.calls,renderMs:performance.now()-renderStart,updateMs:renderStart-updateStart,showTime:time,frameRate:session.frameRate});
  if(row)$('mrInfo').textContent='MR計測：'+row.fps+'fps ／ p95 '+row.p95FrameMs+'ms ／ 花火 '+row.particles.toLocaleString()+'点';
 }else if(frame&&mrMetrics)mrMetrics.breakWindow();
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.__hanabi={riverNight,towerLighting,get state(){return{running,previewing,time,active:fireworks.length,viewMode:bridgeView.active?'bridge':'miniature',buildings:town.children.length,xr:renderer.xr.isPresenting,queued:burstQueue.length,fans:comets.groups,groundPoints:comets.points??0,particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),shots:fireworks.map(f=>({kind:f.kind,size:f.size,layers:f.spec.radii.length,radius:f.r,ascent:f.ascent})),geometries:renderer.info.memory.geometries};},get mrReport(){return mrReport();},launch,advance,clearFireworks,restart};

$('build').textContent=BUILD_VERSION;
$('cometPattern').onchange();
$('programInfo').textContent=PROGRAM_NAMES[$('program').value];
$('musicVolume').oninput=()=>music.setVolume(Number($('musicVolume').value));
music.setVolume(Number($('musicVolume').value));
$('musicState').textContent=selectedMusic.description;
$('musicTrack').onchange=()=>{
 const chosen=MUSIC_SHOWS.find(item=>item.id===$('musicTrack').value);if(!chosen||chosen===selectedMusic)return;
 if(showPlan?.music)stopShow();else cancelMusicRequest();music.stop();selectedMusic=chosen;MUSIC_PLAN=chosen.plan;music=new MusicTransport(chosen.src,{autoload:false});music.setVolume(Number($('musicVolume').value));
 $('musicState').textContent=chosen.description;musicLastUI=-1;syncMusicScenes();syncShowButtons();drawMusicTimeline();mrPanel.draw();
};

$('musicScenePlay').onclick=()=>beginMusicExcerpt(Number($('musicScene').value),'選んだ場面の少し前から観ます。');
$('musicOffset').oninput=()=>{$('musicOffsetValue').textContent=$('musicOffset').value+' ms（次の開演から）';};
$('musicClick').onchange=()=>music.clickEnabled=$('musicClick').checked;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMusicForVisibility();});

async function beginMusicExcerpt(start,label){
 if(!music.loaded){await beginMusicShow();if(!showPlan?.music)return;}
 cancelMusicRequest();music.stop();clearFireworks();clearFans();fanQueue=[];previewing=false;time=Math.max(0,start);prepareMusicProgram();
 burstQueue=burstQueue.filter(s=>s.at>=time-.02);fanQueue=fanQueue.filter(s=>s.at>=time-.02);ensureAudio();music.play(audio,time);running=true;syncShowButtons();$('status').textContent=label;
}

function beginMusicFinale(){return beginMusicExcerpt(MUSIC_PLAN.finalPreviewStart??MUSIC_PLAN.duration-12,'曲が収まる前の大輪と、花火の音だけの余韻を観ます。');}
function musicMiddleStart(){return MUSIC_PLAN.middlePreviewStart??MUSIC_PLAN.pyramidAt-5;}
function beginMusicPyramid(){return beginMusicExcerpt(musicMiddleStart(),'中盤から観ます。');}
function pauseMusicForVisibility(){
 if(musicBusy)cancelMusicRequest();
 if(previewing&&!previewPaused){previewPaused=true;cancelFutureSounds();triggerEmbers.clear();$('status').textContent='鑑賞を離れたので、試し打ちを一時停止しました。「試し打ちを再開」で戻れます。';}
 if(running&&showPlan?.music){time=music.pause();running=false;cancelFutureSounds();triggerEmbers.clear();syncShowButtons();$('status').textContent='鑑賞を離れたので、曲と花火を一時停止しました。';}
}
// A scheduled duration is a lower bound. User-launched shells may outlive the programme.
function musicCanFinish(){return time>=MUSIC_PLAN.showDuration&&!fireworks.length&&!triggerEmbers.count&&!comets.groups&&!burstQueue.length&&!fanQueue.length;}
function advanceMusic(dt){
 time=music.currentTime;
 advanceEmbers(dt);updateFireworkEvents();
 while(burstQueue.length&&burstQueue[0].at<=time){
  const s=burstQueue.shift();
  // A lost render interval must not release a backlog of obsolete shells.
  if(time-s.at>.35){musicLog.push({skipped:true,scheduled:s.at,actual:time});continue;}
  if(!launch(s.kind,s.size,s.position))musicLog.push({skipped:true,capacity:true,scheduled:s.at,actual:time});
 }
 updateFans();updateFireworks();music.updateClicks(MUSIC_PLAN.beats);
 if(Math.floor(time*8)!==musicLastUI){musicLastUI=Math.floor(time*8);drawMusicTimeline();}
 const section=MUSIC_PLAN.sections.filter(s=>s.at<=time).at(-1);
 $('chapter').textContent=(section?.label??selectedMusic.title)+' · '+Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');
 if(time>=MUSIC_PLAN.duration&&!musicCanFinish())$('status').textContent='曲が終わりました。残る光と花火の音の余韻をお楽しみください。';
 if(musicCanFinish()){music.pause();running=false;cancelFutureSounds();drawMusicTimeline();syncShowButtons();$('musicShow').textContent=selectedMusic.title+'をもう一度';$('status').textContent='花火の余韻とともに、大会が終わりました。';}
}
function drawMusicTimeline(){
 const c=$('musicTimeline'),g=c.getContext('2d'),w=c.width,h=c.height;g.clearRect(0,0,w,h);
 g.fillStyle='#354c60';g.fillRect(0,0,w,h);g.fillStyle='#e8c987';g.fillRect(0,0,Math.min(1,time/MUSIC_PLAN.duration)*w,h);
 $('musicTime').textContent=time<=MUSIC_PLAN.duration?time.toFixed(1)+' / '+MUSIC_PLAN.duration.toFixed(1)+'秒':'曲終わり · 花火の余韻 '+(time-MUSIC_PLAN.duration).toFixed(1)+'秒';
}
drawMusicTimeline();
window.__musicStudy={get state(){return{time,transport:music.currentTime,running,pending:burstQueue.length,active:fireworks.length,points:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),sourceActive:!!music.source,contextState:audio?.state,clicks:music.clicks.size,log:musicLog};},get plan(){return MUSIC_PLAN;}};

if($('candyCard')){
 town.rotation.set(0,0,0);town.scale.setScalar(1);camera.position.set(0,1.15,3.0);camera.lookAt(0,.72,-.12);scene.fog.density=.025;
 $('candyVolume').oninput=()=>{$('volume').value=$('candyVolume').value;soundEngine?.setVolume(Number($('candyVolume').value));};
 const monoSelect=$('candyMono');monoSelect.replaceChildren(...CANDY_PALETTES.filter(p=>p.colors.length===1).map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.label;return o;}));
 const candySelect=$('candyPalette');candySelect.replaceChildren(...CANDY_PALETTES.map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.label;return o;}));
 function beginCandyComparison(id){
  beginPreview();const rise=id==='rise5',reference=id.startsWith('reference'),big=id.startsWith('big'),mono=id.startsWith('mono');candyFreezeAt=id==='all'?null:rise?.85:reference?(id==='reference3'?2.85:2.97):big?(id.includes('10')?3.95:3.10):id.includes('10')?3.78:id.includes('3')?2.85:id.includes('5')?2.97:.70;$('candyPause').textContent='一時停止';const palette=big||mono?monoSelect.value:candySelect.value;
  const add=(at,size,x=0,kind='candy')=>burstQueue.push({at,kind,size,position:{x,z:.08,palette:kind==='kiku'||kind==='core'?'original':kind==='candyburst'?monoSelect.value:palette,ignitionDelay:.02,startAt:at,candySeed:0x141715+size*71+Math.floor(at*100)}});
  if(reference){add(0,id==='reference3'?3:5,0,id==='reference3'?'kiku':'core');}
  else if(rise){add(0,5);}
  else if(big){const size=id.includes('10')?10:5;for(const [i,x] of (id.includes('pair')?[-.48,.48]:[0]).entries())add(i*.08,size,x,'candyburst');}
  else if(mono){for(let i=0;i<(id==='mono-row3'?5:1);i++)add(i*.035,3,id==='mono-row3'?(i-2)*.42:0);}
  else if(['shell3','shell5','shell10'].includes(id))add(0,Number(id.slice(5)));
  else if(['row3','row5','row10'].includes(id)){const size=Number(id.slice(3));for(let i=0;i<5;i++)add(i*.035,size,(i-2)*.42);}
  else if(id==='all'){
   fanQueue.push({at:0,mode:'row',style:palette},{at:4,mode:'small-up-tight',style:palette},{at:7,mode:'small-cross-tight',style:palette},{at:10,mode:'small-fan',style:palette});
   add(13,3,-.35);add(17.5,5,.35);add(23,10);add(31,5,-.40,'candyburst');add(36.5,10,.20,'candyburst');
  }else fanQueue.push({at:0,mode:id,style:palette});
  burstQueue.sort((a,b)=>a.at-b.at);fanQueue.sort((a,b)=>a.at-b.at);
  $('status').textContent='キャンディーの星と尾を見比べています。';$('chapter').textContent='キャンディー色の確認';
 }
 document.querySelectorAll('[data-candy]').forEach(button=>button.onclick=()=>beginCandyComparison(button.dataset.candy));
 $('candyPause').onclick=()=>{if(previewing){previewPaused=!previewPaused;if(previewPaused)cancelFutureSounds();$('candyPause').textContent=previewPaused?'再開':'一時停止';}};
 $('candyStop').onclick=()=>{stopShow();$('candyPause').textContent='一時停止';};
 $('candyReplay').onclick=()=>beginCandyComparison('all');
}

if(new URLSearchParams(location.search).has("candyShow")){town.rotation.set(0,0,0);town.scale.setScalar(1);camera.position.set(0,1.30,3.2);camera.lookAt(0,1.04,-.12);scene.fog.density=.025;setPanelTab(4);}

syncShowButtons();

if($("candyPeak"))$("candyPeak").onclick=async()=>{candyPeakLabel="銀かむろ５玉と大星３玉の全開です。";await beginMusicExcerpt(166.4,"キャンディー全開の瞬間へ進みます。");if(showPlan?.music&&selectedMusic.id==='pastel-parasite'&&running)candyPeakAt=173.55;};

if($("candySenrin"))$("candySenrin").onclick=async()=>{candyPeakLabel="左右のキャンディー千輪です。";await beginMusicExcerpt(160,"左右のキャンディー千輪を観ます。");if(showPlan?.music&&selectedMusic.id==='pastel-parasite'&&running)candyPeakAt=168.5;};
if($("candyQuiet"))$("candyQuiet").onclick=async()=>{candyPeakLabel="足元だけで溜める間奏です。";await beginMusicExcerpt(126.8,"間奏は足元だけで溜めます。");if(showPlan?.music&&selectedMusic.id==='pastel-parasite'&&running)candyPeakAt=132.7;};
