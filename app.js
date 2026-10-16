import {PANEL_BUILD_VERSION,panelThemeId,setPanelTheme,panelFontReady} from './panel-theme.js';
import {styleKind,stylePalette} from './programme-style.js';
import {isCreativeShell,CREATIVE_PROFILES,createCreativeStars,creativePoint,creativeTailColor,creativePointScale} from './creative-shells.js';
import {EAR_FIELD_LIMIT} from './ear-capacity.js';
import {earLandscape,seaSunsetPassage,paddySeasonPassage} from './ear-scenes.js';
import {replaceRetiredShell,replaceRetiredPlan} from './retired-shells.js';
import {variationRandom,flowerFlight,flowerMotion,isFlowerShell,deformFlowerVector} from './flower-variation.js';
import {flowerScene,FLOWER_PATTERNS,flowerUsesColor,radialFlowerStars,flowerCarpetPassage,flowerGardenPassage,flowerUsesSize,petalGeometry} from './flower-scenes.js';
import {PanelSurfaceTrial} from './panel-surface.js';
import {MRNameEditor} from './mr-name-editor.js';
import {FavoriteRepository,FavoriteFestival,captureProgramme} from './favorite-programmes.js';
import {mountFavorites} from './favorites-ui.js';
import {FavoritesPanel} from './favorites-panel.js';
import {ShowPreparation} from './show-preparation.js';
import {readLocalTrack,readTrackFeeling,saveTrackFeeling,listDeletedTracks} from './quest-local-library.js';
import {organizePanel} from './panel-layout.js';
organizePanel();
import {MUSIC_CATALOG,playableMusicChoices,setLocalMusicCatalog,musicTrackTitle,musicTrackIdentityTitle} from './music-catalog.js?v=1.2.83';
import {mountAutoMusic} from './auto-music-ui.js?v=1.2.83';
import {QuestDiagnostics} from './quest-diagnostics.js?v=1.2.83';
import {BetaReviewPanel,attachBetaPanelDrag} from './beta-review-panel.js?v=1.2.83';
import {toraSceneCues,toraSceneEnd,TORA_MOUNTAIN_COLORS} from './tora-scenes.js?v=1.2.83';
import {rainEarSequence} from './rain-ears.js?v=1.2.83';
import {SPARKLE_PROFILE,sparkleLife,createSparkleStars,sparklePoint,prepareSparklePoint} from './sparkling-stars.js?v=1.2.83';
import {LONG_STAR_PROFILE,longStarLife,createLongStars,longStarPoint,prepareLongStarPoint} from './long-stars.js?v=1.2.83';
import {viewBoatPose} from './boat-cruise.js?v=1.2.83';
import {RiverNight,RooftopCranes} from './river-night.js?v=1.2.83';
import {sunflowerPoint,goldPetalPoint,petalPoint} from './sunflower-motion.js?v=1.2.83';
import {createCandyBigStars,candyBigStarPoint} from './candy-big-stars.js?v=1.2.83';
import {CANDY_PALETTES,candyColor} from './candy-colors.js?v=1.2.83';
import {CometField,COMET_STYLES,COMET_PATTERNS} from './comets.js?v=1.2.83';
import {MUSIC_SHOWS} from './music-shows.js?v=1.2.83';
import {MusicTransport} from './music-transport.js';
import {createProgram,programCue,PROGRAM_NAMES,randomStarmine,normalGroundCues,normalEarSequence} from './programs.js?v=1.2.83';
import * as T from './vendor/three.module.js';
import {isSenrin,EAR_PROFILE,createEarStars,earPoint,SIZES,TYPES,sphere,chapter,paletteOptions,shellPalette,createShellShapeSampler,deformShellVector,sampleIgnitionDelays,MAX_IGNITION_DELAY} from './fireworks.js?v=1.2.83';
import {reflectionMaterial,reflectionAppearance} from './water.js?v=1.2.83';
import {FireworkAudio,CompletionChime} from './audio.js?v=1.2.83';
import {placementFromPose,XRMetrics} from './mr-test.js?v=1.2.83';
import {MRPanel,nextEnabledOption,stepRange} from './mr-panel.js?v=1.2.83';
import {MRDimming,clampBrightness} from './mr-dimming.js?v=1.2.83';
import {TowerLighting} from './tower-lighting.js?v=1.2.83';
import {BridgeView,BRIDGE_SCALE} from './bridge-view.js?v=1.2.83';
import {showInfoText,ShowInfoPanel} from './show-info.js?v=1.2.83';
import {WristMenu} from './wrist-menu.js?v=1.2.83';
import {XRControls} from './xr-controls.js?v=1.2.83';
import {TriggerEmbers,ManualLaunchBudget,manualPointCost} from './trigger-embers.js?v=1.2.83';
import {EntryTip} from './entry-tip.js?v=1.2.83';
const BUILD_VERSION=PANEL_BUILD_VERSION;
const questDiagnostics=new QuestDiagnostics({enabled:location.hostname==='localhost'&&new URLSearchParams(location.search).get('questLog')==='1'});
let candyFreezeAt=null;
const SMALL_STYLE_LABELS={...Object.fromEntries(TORA_MOUNTAIN_COLORS.map(c=>[c.id,c.label+'の星・'+(c.id==='mountain-gold'?'金':'銀')+'の尾'])),'tora-row-mix':'桃・水色・緑の列',...Object.fromEntries(CANDY_PALETTES.map(p=>[p.id,p.label])),gold:'金の星・金の尾',silver:'白の星・銀の尾',red:'紅の星・金の尾',blue:'青の星・銀の尾',green:'緑の星・金の尾','gold-silver':'金の星・銀の尾','white-gold':'白の星・金の尾','red-silver':'紅の星・銀の尾','blue-gold':'青の星・金の尾','green-silver':'緑の星・銀の尾'};
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
const betaReviewPanel=new BetaReviewPanel({scene,click:id=>$(id).click(),set:(value,commit)=>setPanelRange('betaMusicSeek',value,commit)});
const betaPanelDrag=attachBetaPanelDrag($('betaReviewBar'),$('betaReviewHandle'),()=>({width:innerWidth,height:innerHeight}));
addEventListener('resize',()=>betaPanelDrag.resize());
let seed=141;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const box=new T.BoxGeometry(1,1,1), mats=[0x172431,0x24303d,0x1b2934,0x303540].map(c=>new T.MeshStandardMaterial({color:c,roughness:.9}));
function cube(x,y,z,w,h,d,mat){const m=new T.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);town.add(m);return m;}
const groundmat=new T.MeshStandardMaterial({color:0x10191f,roughness:.95});const ground=cube(0,-.025,.16,3.2,.045,2.42,groundmat);
const groundBottomY=ground.position.y-ground.scale.y/2;
// Shared river coordinates keep banks, buildings, boats and reflections aligned.
function riverCenter(z){return .22*Math.sin(z*2.7+.35);}
function riverWidth(z){return .49+.075*Math.cos(z*2.5-.5);}
function riverSlope(z){return .594*Math.cos(z*2.7+.35);}
function riverRibbon(z0,z1,widthFactor=1,y=.003){
 const vertices=[],indices=[],segments=74;
 for(let i=0;i<=segments;i++){const z=z0+(z1-z0)*i/segments,c=riverCenter(z),w=riverWidth(z)*widthFactor/2;vertices.push(c-w,y,z,c+w,y,z);if(i<segments){let a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const river=new T.Mesh(riverRibbon(-1.04,1.36),new T.MeshStandardMaterial({color:0x123446,metalness:.45,roughness:.32,side:T.DoubleSide}));town.add(river);
for(const side of [-1,1]){
 const points=Array.from({length:75},(_,i)=>{const z=-1.04+i*2.4/74;return new T.Vector3(riverCenter(z)+side*(riverWidth(z)/2+.012),.009,z);});
 const bank=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),74,.011,4,false),new T.MeshStandardMaterial({color:0x45505a,roughness:.9}));town.add(bank);
}
const windowNormals=[], windows=[], windowRanges=[], lamps=[],rooftops=[],buildingRoofs=[],cityBuildingMeshes=[];
// Additional facades have independent occupancy, without changing the town,
// front windows, boats or any fireworks which share the original random stream.
function addWindow(x,y,z,nx,nz){windows.push(x,y,z);windowNormals.push(nx,0,nz);}
let windowSeed=0x141723;
function windowRand(){windowSeed=(windowSeed*1664525+1013904223)>>>0;return windowSeed/4294967296;}
for(let side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<5;col++){
 const firstWindow=windows.length/3;
 const z=-.86+row*.27+(rand()-.5)*.04,x=riverCenter(z)+side*(riverWidth(z)/2+.12+col*.205),w=.105+rand()*.055,d=.12+rand()*.06,h=.10+rand()*.31;
 const building=cube(x,h/2,z,w,h,d,mats[Math.floor(rand()*mats.length)]);building.name='city-building-'+side+'-'+row+'-'+col;cityBuildingMeshes.push(building);
 const roof={x,y:h,z,w,d,side,row,col};buildingRoofs.push(roof);
 if(h>.32)rooftops.push(roof);
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++)if(rand()>.38)addWindow(x+k*w*.25,level,z+d/2+.001,0,1);
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++){
  if(windowRand()>.38)addWindow(x+k*w*.25,level,z-d/2-.001,0,-1);
  if(windowRand()>.38)addWindow(x-w/2-.001,level,z+k*d*.25,-1,0);
  if(windowRand()>.38)addWindow(x+w/2+.001,level,z+k*d*.25,1,0);
 }
 windowRanges.push({first:firstWindow,last:windows.length/3});
}
// A low near-edge row continues both banks around the extended cruise turn.
// Its own stream preserves every existing building and firework random choice.
let nearRowSeed=0x141730;
function nearRowRand(){nearRowSeed=(nearRowSeed*1664525+1013904223)>>>0;return nearRowSeed/4294967296;}
for(const side of [-1,1])for(let col=0;col<5;col++){
 const firstWindow=windows.length/3,z=1.25+(nearRowRand()-.5)*.012;
 const x=riverCenter(z)+side*(riverWidth(z)/2+.14+col*.205),w=.105+nearRowRand()*.035,d=.085+nearRowRand()*.012,h=.12+nearRowRand()*.09;
 const building=cube(x,h/2,z,w,h,d,mats[Math.floor(nearRowRand()*mats.length)]);building.name='near-edge-building-'+side+'-'+col;cityBuildingMeshes.push(building);buildingRoofs.push({x,y:h,z,w,d,side,row:8,col});
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++){
  if(nearRowRand()>.38)addWindow(x+k*w*.25,level,z+d/2+.001,0,1);
  if(nearRowRand()>.38)addWindow(x+k*w*.25,level,z-d/2-.001,0,-1);
  if(nearRowRand()>.38)addWindow(x-w/2-.001,level,z+k*d*.25,-1,0);
  if(nearRowRand()>.38)addWindow(x+w/2+.001,level,z+k*d*.25,1,0);
 }
 windowRanges.push({first:firstWindow,last:windows.length/3});
}
// Fill the former broad foreground gap with a normal block row, using its own random stream.
let fillRowSeed=0x141738;
function fillRowRand(){fillRowSeed=(fillRowSeed*1664525+1013904223)>>>0;return fillRowSeed/4294967296;}
for(const side of [-1,1])for(let col=0;col<5;col++){
 const firstWindow=windows.length/3,z=1.015+(fillRowRand()-.5)*.012;
 const x=riverCenter(z)+side*(riverWidth(z)/2+.12+col*.205),w=.105+fillRowRand()*.045,d=.11+fillRowRand()*.025,h=.14+fillRowRand()*.12;
 const building=cube(x,h/2,z,w,h,d,mats[Math.floor(fillRowRand()*mats.length)]);building.name='gap-fill-building-'+side+'-'+col;cityBuildingMeshes.push(building);buildingRoofs.push({x,y:h,z,w,d,side,row:7,col});
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++){
  if(fillRowRand()>.38)addWindow(x+k*w*.25,level,z+d/2+.001,0,1);
  if(fillRowRand()>.38)addWindow(x+k*w*.25,level,z-d/2-.001,0,-1);
  if(fillRowRand()>.38)addWindow(x-w/2-.001,level,z+k*d*.25,-1,0);
  if(fillRowRand()>.38)addWindow(x+w/2+.001,level,z+k*d*.25,1,0);
 }
 windowRanges.push({first:firstWindow,last:windows.length/3});
}
function pointCloud(coords,color,size){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));const m=new T.PointsMaterial({color,size,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});bridgeView.point(m);const p=new T.Points(g,m);town.add(p);return p;}
const win=new T.InstancedMesh(new T.PlaneGeometry(.0042,.0042),new T.MeshBasicMaterial({color:0xffffff}),windows.length/3);win.name='facade-windows';town.add(win);
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
const windowPose=new T.Object3D(),windowColor=new T.Color();
for(let i=0;i<windows.length/3;i++){windowPose.position.fromArray(windows,i*3);windowPose.rotation.y=Math.atan2(windowNormals[i*3],windowNormals[i*3+2]);windowPose.updateMatrix();win.setMatrixAt(i,windowPose.matrix);win.setColorAt(i,windowColor.fromArray(windowColors,i*3));}win.instanceMatrix.needsUpdate=true;win.instanceColor.needsUpdate=true;
for(let z=-.98;z<1.32;z+=.055)for(let side of [-1,1])lamps.push(riverCenter(z)+side*(riverWidth(z)/2+.027),.018,z);
pointCloud(lamps,0xffe1a5,.009);
// Preserve old town random consumption without keeping the placeholder boats.
for(let i=0;i<9;i++){rand();rand();}
let boatSeconds=0,boatWaitingShown=null,boatStarted=false;const boatPose=viewBoatPose(0);
const riverNight=new RiverNight({town,riverGeometry:riverRibbon(-1.04,1.36,1,.005),riverCenter,riverSlope});
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
 if(roofSites.every(other=>Math.hypot((other.originalX??other.x)-(roof.originalX??roof.x),(other.originalZ??other.z)-(roof.originalZ??roof.z))>.38))roofSites.push(roof);
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
let showPlan=null,showNumber=0,showCompleted=false;
let generatedMusic=null;
let favoritesUI=null,favoritesPanel=null,mrNameEditor=null,favoriteRun=null,favoriteLoadRequest=0,favoriteHeartPlan=undefined,favoriteHeartSettings='';
const favoriteRepository=new FavoriteRepository();
let noMusicMode=true,libraryRestoring=true,directingBusy=false;
const showPreparation=new ShowPreparation();
let selectionProblem=null,selectionRequest=0,normalBuildNumber=0,normalPrepared=false;
let pendingAutomaticTrack=null;
let selectedMusic=MUSIC_SHOWS[0],MUSIC_PLAN=selectedMusic.plan;
let musicFxQuiet=false;
function resetMusicFxQuiet(){if(musicFxQuiet){soundEngine?.fxHeadroom?.gain?.setValueAtTime(.88,soundEngine.context.currentTime);musicFxQuiet=false;}}
function updateMusicFxQuiet(){const quiet=(MUSIC_PLAN.fxSilenceWindows??[]).some(w=>time>=w.start&&time<w.end);if(quiet!==musicFxQuiet){musicFxQuiet=quiet;soundEngine?.fxHeadroom?.gain?.setValueAtTime(quiet?0:.88,soundEngine.context.currentTime);}}
let music=new MusicTransport(selectedMusic.src,{autoload:false});
function syncMusicChoices(){
 const none=document.createElement('option');none.value='none';none.textContent='曲なしで上げる';
 $('musicTrack').replaceChildren(none,...playableMusicChoices(generatedMusic).map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.title+(item.id.startsWith('import:')?'（取り込み）':'');return option;}));
 $('musicTrack').value=pendingAutomaticTrack?.id??selectionProblem?.id??(noMusicMode?'none':selectedMusic.id);$('musicTrack').disabled=libraryRestoring||!!pendingAutomaticTrack;
}
function syncOriginalChoice(){
 const id=pendingAutomaticTrack?.id??selectionProblem?.id??selectedMusic.id,el=$('autoMusicFeeling');
 const exists=MUSIC_SHOWS.some(t=>t.id===id);let option=el.querySelector('option[value="original"]');
 if(exists&&!option){option=document.createElement('option');option.value='original';option.textContent='手作りの構成（オリジナル）';el.prepend(option);}
 if(!exists&&option)option.remove();
 if(!pendingAutomaticTrack&&!selectionProblem&&selectedMusic.original)el.value='original';
}
function currentShowSettings(){
 if(noMusicMode&&!pendingAutomaticTrack&&!selectionProblem){
  const program=$('program').selectedOptions[0].textContent.replace(/^プログラム[12] · /,'');
  return {title:'曲なしで上げる',setting:[program,$('mood').selectedOptions[0].textContent,$('ending').selectedOptions[0].textContent,showPlan?.programmeStyle?.description].filter(Boolean).join(' · ')};
 }
 if(favoriteRun)return {title:favoriteRun.name??'お気に入り大会',setting:favoriteRun.label+' · '+(MUSIC_PLAN.feelingLabel??'手作りの構成')};
 return {title:selectedMusic.title,setting:selectedMusic.original?'手作りの構成（オリジナル）':[MUSIC_PLAN.feelingLabel??musicFeelingLabel(),MUSIC_PLAN.programmeStyle?.description].filter(Boolean).join(' · ')};
}
function syncPreparationDisplay(){
 const view=showPreparation.view({running,paused:!!showPlan&&!running&&!normalPrepared&&!showCompleted});
 $('showReadiness').dataset.phase=view.phase;
 $('showReadinessHeading').textContent=analysisFeedback?.phase==='complete'&&view.phase==='ready'?'✓ 解析が完了しました':view.heading;$('showReadinessTitle').textContent=view.title;$('showReadinessSetting').textContent=view.setting;
}
function markShowReady(token){showPreparation.ready(currentShowSettings(),token);syncPreparationDisplay();void favoritesUI?.refreshHeart();}
function syncUnifiedControls(){
 const pending=directingBusy||musicBusy||!!pendingAutomaticTrack,none=noMusicMode&&!pendingAutomaticTrack&&!selectionProblem,original=!none&&!!selectedMusic.original&&!pendingAutomaticTrack&&!selectionProblem;
 syncOriginalChoice();
 $('musicFeelingControls').hidden=none;$('noMusicControls').hidden=!none;
 $('autoMusicEars').closest('label').hidden=original;$('autoMusicEarsHint').hidden=original;$('autoMusicEars').disabled=pending||libraryRestoring;
 $('showReanalysis').hidden=none;$('showAdvanced').hidden=none||original||!!selectedMusic.savedFavoriteId||!!selectionProblem;$('showMusicPlayback').hidden=none;
 for(const id of ['musicMixFireworks','musicMixDefault','musicMixMusic','musicVolume','musicVolumeValue']){const el=$(id);if(el)el.closest('label')?el.closest('label').hidden=none:el.hidden=none;}
 $('showRoom').disabled=libraryRestoring||pending||!!selectionProblem||$('mr').disabled;
 $('showWatch').disabled=libraryRestoring||pending||showPreparation.phase!=='ready'||!!selectionProblem||(!none&&!selectedMusic.plan);
 if(favoriteRun&&['gap','loading','switch'].includes(favoriteRun.phase))$('showWatch').disabled=true;
 $('showWatch').textContent=selectionProblem||showPreparation.phase==='error'?'準備できませんでした':libraryRestoring||pending||showPreparation.phase==='preparing'?'準備中…':running?'Ⅱ 一時停止':showPlan&&!normalPrepared&&!showCompleted?'▶ 鑑賞を再開':showCompleted?'▶ もう一度開演':'▶ 花火大会を開演';
 $('showRebuild').hidden=original;$('showRebuild').disabled=pending||!!selectionProblem||(!none&&!selectedMusic.autoGenerated);
 $('showRebuild').textContent=none?'打ち上げ玉の構成を変える':'打ち上げ玉の構成を変える';
 if(original){$('autoMusicFeelingHint').textContent='一緒に作った打ち上げの順序と時刻を、そのまま観られます。';$('autoMusicBuildNumber').textContent='手作りの構成 · オリジナル';}
 $('autoMusicProgress').hidden=!pending;
 $('musicTrack').disabled=libraryRestoring||pending;
 $('trackMenuToggle').disabled=libraryRestoring||pending||$('musicTrack').value==='none';$('trackRename').disabled=$('trackMenuToggle').disabled;$('trackDelete').disabled=$('trackMenuToggle').disabled;
 if($('trackMenuToggle').disabled){$('trackMenu').hidden=true;$('trackMenuToggle').setAttribute('aria-expanded','false');}
 $('autoMusicStatus').hidden=none&&!pending&&!analysisFeedback;
 $('showImport').querySelector('summary').textContent='＋ 曲を取り込む';
 document.getElementById('panel').dataset.musicless=String(none);
 if(directingBusy)$('autoMusicFeeling').disabled=true;
 syncPreparationDisplay();
 const heartPlan=none||libraryRestoring||pending||selectionProblem||showPreparation.phase!=='ready'?null:MUSIC_PLAN,heartSettings=selectedMusic.id+'|'+$('musicOffset').value+'|'+!!selectedMusic.original;
 if(favoritesUI&&(favoriteHeartPlan!==heartPlan||favoriteHeartSettings!==heartSettings)){favoriteHeartPlan=heartPlan;favoriteHeartSettings=heartSettings;void favoritesUI.refreshHeart();}
}

syncMusicChoices();
function syncMusicScenes(){
 $('musicScene').replaceChildren(...MUSIC_PLAN.sections.filter(q=>q.at<MUSIC_PLAN.duration).map(q=>{const option=document.createElement('option');option.value=q.previewStart??Math.max(0,q.at-5);const fraction=Math.round((q.at-Math.floor(q.at))*100);option.textContent=Math.floor(q.at/60)+':'+String(Math.floor(q.at%60)).padStart(2,'0')+(fraction?'.'+String(fraction).padStart(2,'0').replace(/0$/,''):'')+' · '+q.label;return option;}));
}
syncMusicScenes();
let musicSequence=null;
const analysisChime=new CompletionChime();
let analysisFeedback=null,analysisReturnTimer=null;
let musicRequest=0,musicBusy=false,candyPeakAt=null,candyPeakLabel='キャンディー全開の瞬間です。';
let musicLog=[],musicLastUI=-1;
let betaRebuilding=false,betaDragging=false,betaResumeAfterDrag=false,betaTCEnabled=false;
function betaClock(seconds){const t=Math.max(0,Math.round(seconds*10));return Math.floor(t/600)+":"+String(Math.floor(t/10)%60).padStart(2,"0")+"."+t%10;}
function betaTimeLabel(value){return betaClock(Math.min(value,MUSIC_PLAN.duration))+' / '+betaClock(MUSIC_PLAN.duration)+(value>MUSIC_PLAN.duration?' · 余韻＋'+(value-MUSIC_PLAN.duration).toFixed(1)+'秒':'');}
function betaRandom(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function betaSeed(index){let seed=0x141718;for(const c of selectedMusic.id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;return(seed+Math.imul(index+1,2654435761))>>>0;}

function prepareProgram(){normalBuildNumber++;normalPrepared=true;$('showNotice').textContent=`✓ 構成${normalBuildNumber}を作成しました · ${PROGRAM_NAMES[$('program').value]}`;showCompleted=false;const seed=crypto.getRandomValues(new Uint32Array(1))[0];showPlan=createProgram($('program').value,seed);showPlan.wideFinale=(++showNumber%3===0);showPlan.special=[{kind:'triple',size:20},{kind:'quad',size:10},{kind:'penta',size:10}][(showNumber-1)%3];showPlan.earSeed=seed;const intro=normalEarSequence(seed,.8,3);burstQueue.push(...intro.shots);burstQueue.sort((a,b)=>a.at-b.at);nextLaunch=Math.max(nextLaunch,intro.finishAt);$('programInfo').textContent=showPlan.name;markShowReady(showPlan); }
function prepareMusicProgram(){
 showCompleted=false;
 showPlan={name:'音楽付き · '+selectedMusic.title,music:true};
 const shift=Number($('musicOffset').value)/1000;
 burstQueue=MUSIC_PLAN.shots.map((s,i)=>({...s,at:s.at+shift,opening:s.opening+shift,position:{...s.position,startAt:s.at+shift,reviewSeed:betaSeed(s.reviewIndex??i),longStarSeed:betaSeed(s.reviewIndex??i),sparkleSeed:betaSeed(s.reviewIndex??i)}}));
 fanQueue=MUSIC_PLAN.fans.map((f,i)=>({...f,at:f.at+shift,options:{...f.options,reviewSeed:betaSeed(i+10000)}}));
 musicLog=[];$('musicState').textContent=selectedMusic.title+' · '+MUSIC_PLAN.duration.toFixed(1)+'秒';
}
function cancelMusicRequest(){betaDragging=false;resetMusicFxQuiet();candyPeakAt=null;musicRequest++;musicBusy=false;syncShowButtons();}
function musicFeelingLabel(){const e=$('autoMusicFeeling');return e?.selectedOptions?.[0]?.textContent??'自動 · 曲に合わせる';}
function syncShowButtons(){
 syncBetaReview();
 for(const id of ['rainMusicPeak','rainMusicFirstPeak','rainMusicFinalSnapshot'])if($(id))$(id).hidden=selectedMusic.id!=='mou-ichido-dake';
 for(const id of ['candyPeak','candyQuiet','candySenrin'])if($(id))$(id).hidden=selectedMusic.id!=='pastel-parasite';
 $('play').textContent=showPlan?.music?'曲なしの大会へ':running?'ひと休み':showPlan?'大会を再開':'花火大会を観る';
 $('musicShow').disabled=musicBusy||!!pendingAutomaticTrack||!!selectionProblem;$('musicAll').disabled=musicBusy||!!pendingAutomaticTrack;
 $('musicShow').textContent=pendingAutomaticTrack?pendingAutomaticTrack.title+'の大会を準備中…':musicBusy?'曲を準備中…':showPlan?.music?(showCompleted?selectedMusic.title+'をもう一度':running?'音楽付き · ひと休み':'音楽付き · 再開'):selectedMusic.autoGenerated?`構成${selectedMusic.variation+1}を開演`:selectedMusic.original?'手作りの構成を開演':selectedMusic.title+'を観る';
 syncUnifiedControls();
}
async function beginMusicShow(){
 if(noMusicMode||selectionProblem||musicBusy||pendingAutomaticTrack)return;
 if(showPlan?.music&&!musicCanFinish()){toggle();return;}
 const request=++musicRequest;musicBusy=true;syncShowButtons();ensureAudio();
 $('musicState').textContent='曲を準備中…';
 try{await music.load();}catch(e){if(request!==musicRequest)return;musicBusy=false;music.ready=null;syncShowButtons();$('musicState').textContent='曲を読み込めませんでした。もう一度お試しください。';return;}
 if(request!==musicRequest)return;
 musicBusy=false;startLoadedMusicShow();
}
function clearMusicSequence({keepFavorite=false}={}){
 if(!keepFavorite)clearFavoriteFestival();musicSequence=null;$('musicSequenceState').textContent=MUSIC_SHOWS.map(item=>item.title).join(' → ')+'。余韻まで観て、次の曲へ。';
}
function selectMusic(chosen,transport=new MusicTransport(chosen.src,{autoload:false})){
 music.stop();const plan=replaceRetiredPlan(chosen.plan);selectedMusic=plan===chosen.plan?chosen:{...chosen,plan};MUSIC_PLAN=plan;music=transport;
 music.setVolume(Number($('musicVolume').value));music.clickEnabled=$('musicClick').checked;
 $('musicTrack').value=chosen.id;$('musicState').textContent=chosen.description;musicLastUI=-1;syncMusicScenes();
}
function startLoadedMusicShow(){
 if(analysisFeedback?.phase==='complete'){analysisFeedback=null;$('analysisFeedback').hidden=true;}
 music.stop();clearFireworks();clearFans();fanQueue=[];burstQueue=[];burstSlots.clear();previewing=false;previewPaused=false;time=0;cueIndex=0;musicLastUI=-1;
 prepareMusicProgram();ensureAudio();music.play(audio,0,soundEngine?.mixInput);running=true;
 if(favoriteRun){favoriteRun.armed=false;favoriteRun.phase='playing';favoriteRun.prefetch();favoritesUI?.setFestival('開演中 · '+favoriteRun.label);}
 $('status').textContent=selectedMusic.description;
 if(musicSequence)$('musicSequenceState').textContent='連続鑑賞 · '+(musicSequence.index+1)+' / '+musicSequence.tracks.length+'曲目 · '+selectedMusic.title;
 syncShowButtons();drawMusicTimeline();mrPanel.draw();
}
async function beginMusicSequence(){
 if(musicBusy||pendingAutomaticTrack)return;
 stopShow();ensureAudio();
 const request=++musicRequest;musicBusy=true;syncShowButtons();
 $('musicSequenceState').textContent='４曲を準備中…';
 // Prepare all tracks under the user's start action so each change is immediate.
 const tracks=MUSIC_SHOWS.map(item=>({item,transport:item.id===selectedMusic.id?music:new MusicTransport(item.src,{autoload:false})}));
 try{await Promise.all(tracks.map(({transport})=>transport.load()));}
 catch(e){if(request!==musicRequest)return;musicBusy=false;for(const {transport} of tracks)if(!transport.loaded)transport.ready=null;clearMusicSequence();syncShowButtons();$('musicSequenceState').textContent='曲を読み込めませんでした。「全てを続けて見る」でお試しください。';return;}
 if(request!==musicRequest)return;
 musicBusy=false;musicSequence={tracks,index:0};selectMusic(tracks[0].item,tracks[0].transport);startLoadedMusicShow();
}
function advanceMusicSequence(){
 if(!musicSequence||musicSequence.index+1>=musicSequence.tracks.length)return false;
 const next=musicSequence.tracks[++musicSequence.index];selectMusic(next.item,next.transport);startLoadedMusicShow();return true;
}
function beginNormalShow(){cancelAutomaticPreparation();stopShow();prepareProgram();running=true;ensureAudio();syncShowButtons();$('status').textContent='稲穂の横一列から、曲なしの花火大会を始めます。';}

function sound(explosion,x,z,size,when,y=SIZES[size]?.height??0,openingKey=null,variation=null,openingTail=null){if(groundStudySilent)return;const position=bridgeView.position(x,explosion?y:0,z);soundEngine?.play(explosion,x,z,size,$('audioMode').value,when,position,openingKey,variation,openingTail);}
function soundDelayFor(f){return bridgeView.active?bridgeView.delay(f.x,f.y,f.z,latestViewerTransform):({2:.18,3:.2,5:.5,10:1,20:1.5})[f.size]??0;}
function isWhistleShell(f){return [10,20].includes(f.size)&&['double','triple','quad','penta'].includes(f.kind);}
const WHISTLE_LAUNCH_DELAY=.5;
function whistlePositionFor(f){const rise=Math.min(1,WHISTLE_LAUNCH_DELAY/(f.ascent-(f.size===20?.6:.28)));return bridgeView.active?bridgeView.position(f.x,f.y*(1-(1-rise)**2),f.z):null;}
function tailCrackleDelayFor(f){return f.size===20?2:1.5;}
function cancelFutureSounds(){
 soundEngine?.cancelScheduled?.();for(const f of fireworks){const t=time-f.start-f.ascent;if(t<(f.soundDue??soundDelayFor(f)))f.soundPlayed=false;if(isSenrin(f.kind)&&t<(f.childSoundDue??f.clusterDelays[0]+soundDelayFor(f)))f.childSoundPlayed=false;}
 for(const f of fireworks)if(f.whistle&&time-f.start<(f.whistleEndDue??Infinity)){f.whistleResumeOffset=Math.max(f.whistleResumeOffset??0,f.whistleDue===undefined?0:time-f.start-f.whistleDue);f.whistlePlayed=false;}
 for(const event of cometTailSounds.values())if(time<event.due)event.played=false;
 for(const f of fireworks){const t=time-f.start-f.ascent;if(['silver','willow'].includes(f.kind)&&t<(f.afterSoundDue??soundDelayFor(f)+tailCrackleDelayFor(f)))f.afterSoundPlayed=false;}
}
let earSerial=0;
function launch(kind='core',size=5,position=null){
 ({kind,size,position}=replaceRetiredShell({kind,size,position}));
 if(isCreativeShell(kind)&&![5,10].includes(size))return false;
 if(kind==='candysenrin'&&size!==10)return false;
 if(kind==='candy'&&![3,5,10].includes(size))return false;
 if((kind==='candyburst'||kind==='longstar')&&size!==5&&size!==10)return false;
 if(kind==='sparklelarge'&&![5,10,20].includes(size))return false;
 if(kind==='ear'&&size!==2||size===2&&kind!=='ear')return false;
 const activeUpper=fireworks.filter(f=>f.kind!=='ear').length;
 if(kind==='ear'){if(fireworks.filter(f=>f.kind==='ear').length>=(position?.earField?EAR_FIELD_LIMIT:showPlan?.music&&selectedMusic.id==='mou-ichido-dake'?28:14))return false;}
 else if(!position?.manual&&(activeUpper>=(position?.flowerStudy?16:position?.flowerProgramme?14:showPlan?.music&&selectedMusic.autoGenerated?MUSIC_PLAN.upperLimit:showPlan?.music&&selectedMusic.id==='mou-ichido-dake'?MUSIC_PLAN.upperLimit:showPlan?.music&&selectedMusic.id==='pastel-parasite'?14:position?.wide||position?.musicNine?9:8)||(triggerEmbers.count&&activeUpper+triggerEmbers.count>=8)))return false;
 if(kind==='kiku'&&size!==3)return false;if(['petalflower','goldflower'].includes(kind)&&![3,5,10].includes(size))return false;
 if((kind==='quad'||kind==='penta')&&size!==10&&size!==20)return false;
 if(kind==='double'&&size!==10)return false;if(isSenrin(kind)&&size!==10&&size!==20)return false;if(kind==='triple'&&size!==20)return false;if(size===20&&kind!=='sparklelarge'&&kind!=='triple'&&!isSenrin(kind)&&kind!=='quad'&&kind!=='penta'&&!(kind==='silver'&&position?.wide))return false;
 const shellRandom=position?.reviewSeed===undefined?rand:betaRandom(position.reviewSeed);
 const flowerSeed=(isFlowerShell(kind)||isCreativeShell(kind))?(position?.reviewSeed??crypto.getRandomValues(new Uint32Array(1))[0]):null;
 // Explicitly planned flight values remain authoritative; manual flower shells use the same natural profile.
 const naturalFlight=(isFlowerShell(kind)||isCreativeShell(kind))?(position?.flowerFlight??flowerFlight(size,flowerSeed)):null;
 const unplannedFlight=naturalFlight&&position?.heightOffset===undefined;
 const flowerVariation=naturalFlight?flowerMotion(flowerSeed):null;
 let spec=TYPES[kind];const scale=SIZES[size];if(!spec||!scale)return false;
 if(kind==='longstar'||kind==='sparklelarge'){const life=kind==='sparklelarge'?sparkleLife(size):longStarLife(size);spec={...spec,life,fadeStart:life};}
 const z=position?.z??(shellRandom()*1.6-.85),x=position?.x??(riverCenter(z)+(shellRandom()>.5?1:-1)*(.12+shellRandom()*.7));
 const y=scale.height+(position?.heightOffset??naturalFlight?.heightOffset??0),r=scale.radius*(naturalFlight?.radiusScale??1)*((kind==='longstar'||kind==='sparklelarge')?1.30:kind==='candyburst'?1.22:1),trailCount=isCreativeShell(kind)?CREATIVE_PROFILES[kind].trails:kind==='sparklelarge'?SPARKLE_PROFILE.trails:kind==='longstar'?LONG_STAR_PROFILE.trails:kind==='candyburst'?24:kind==='ear'?EAR_PROFILE.trails:kind==='candy'?12:kind==='kiku'?16:isSenrin(kind)?4:(kind==='petalflower'||kind==='goldflower')?petalGeometry(size).trails:kind==='sunflower'?36:kind==='silver'?12:10,directions=[],shells=[],starColors=[],clusterCenters=[],clusterDelays=[],starLayers=[];
 const silverSeed=kind==='silver'?shellRandom()*1000:0;
 let flowerStars=null;
 const palette=shellPalette(kind,position?.palette),scheme=palette.colors.map(c=>new T.Color(c));
 const starDensity=size===3&&['kiku','silver','willow'].includes(kind)?Math.max(.5,Math.min(1,position?.starDensity??1)):1;
 for(let layer=0;layer<spec.radii.length;layer++){
 const count=Math.round(scale.stars*starDensity*(position?.wide?.72:1)*(spec.layerWeights?.[layer]??(layer===0?1:layer===1?.6:.35)));
 for(const xyz of sphere(count)){directions.push(new T.Vector3(...xyz));shells.push(spec.radii[layer]);starColors.push(scheme[layer]);starLayers.push(layer);}
 }
 if(kind==='silver'){
 // Sample once per shell; every frame and tail point keeps the same trajectory.
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(shellRandom()*Math.PI*2,shellRandom()*Math.PI*2,shellRandom()*Math.PI*2));
 // Consume the previous stretch draws so existing placement/timing randomness stays intact.
 shellRandom();shellRandom();shellRandom();
 for(const dir of directions)dir.applyQuaternion(rotation);
 }
 if(kind==='sunflower'||kind==='petalflower'||kind==='goldflower'){
 directions.length=0;shells.length=0;starColors.length=0;
 flowerStars=radialFlowerStars(kind,scheme.map(c=>c.getHex()),size,flowerSeed);
 for(const star of flowerStars){const dir=new T.Vector3(...star.direction);if(star.radius>.75)dir.normalize();directions.push(dir);shells.push(star.radius);starColors.push(new T.Color(star.color));}
 }
 if((kind==='sunflower'||kind==='petalflower'||kind==='goldflower')){
 // One uniform 3D orientation per shell, shared by all stars and their tails.
 // Keep orientation randomness separate from the existing town/silver stream.
 const random=naturalFlight?variationRandom(flowerSeed,0x401e57):position?.reviewSeed===undefined?Math.random:shellRandom;const u=random(),a=random()*Math.PI*2,b=random()*Math.PI*2;
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
 const longStars=kind==='longstar'?createLongStars(size,position?.longStarSeed??crypto.getRandomValues(new Uint32Array(1))[0]):null;
 if(longStars){directions.length=0;shells.length=0;starColors.length=0;starLayers.length=0;for(const star of longStars){directions.push(new T.Vector3(...star.direction));shells.push(star.speed);starLayers.push(star.layer);starColors.push(star.layer===0?scheme[0]:scheme[1]);}}
 const sparkleStars=kind==='sparklelarge'?createSparkleStars(size,position?.sparkleSeed??crypto.getRandomValues(new Uint32Array(1))[0]):null;
 if(sparkleStars){directions.length=0;shells.length=0;starColors.length=0;starLayers.length=0;for(const star of sparkleStars){directions.push(new T.Vector3(...star.direction));shells.push(star.speed);starLayers.push(star.layer);starColors.push(star.layer<2?scheme[0]:scheme[1]);}}
 const creativeCandy=kind==='drum'&&position?.palette==='drum-candy';
 const creativeStars=isCreativeShell(kind)?createCreativeStars(kind,size,flowerSeed,{pose:position?.creativePose??'natural'}):null;
 if(creativeStars){directions.length=0;shells.length=0;starColors.length=0;starLayers.length=0;for(const [i,star] of creativeStars.entries()){directions.push(new T.Vector3(...star.direction));shells.push(star.speed);starLayers.push(star.layer);starColors.push(creativeCandy?new T.Color(candyColor(i,flowerSeed,scheme.map(c=>c.getHex()))):star.group==='body'?new T.Color(creativeTailColor(kind,position?.palette)):scheme[star.head%scheme.length]);}}
 const earStars=kind==='ear'?createEarStars(position?.earSeed??((++earSerial*0x9e3779b9)>>>0)):null;
 const shape=isCreativeShell(kind)||kind==='ear'||kind==='candyburst'||kind==='longstar'||kind==='sparklelarge'?{level:0}:(naturalFlight?createShellShapeSampler(variationRandom(flowerSeed,0x391a61))(kind,size):position?.reviewSeed===undefined?sampleShellShape(kind,size):createShellShapeSampler(shellRandom)(kind,size));
 for(let i=0;i<directions.length;i++)(flowerStars?deformFlowerVector:deformShellVector)(directions[i],shape,isSenrin(kind)?.35:shells[i]<.75?.65:1);
 for(const center of clusterCenters)deformShellVector(center,shape);
 if(kind==='candy'){const seed=position?.candySeed??(0x141715+Math.floor(time*1000));for(let i=0;i<starColors.length;i++)starColors[i]=new T.Color(starLayers[i]===0?candyColor(i,seed,scheme.map(c=>c.getHex())):scheme.length===1?scheme[0].getHex():0xffeec7);}
 const n=directions.length,positions=new Float32Array(n*trailCount*3),colors=new Float32Array(n*trailCount*3);
 // These per-star values are constant for the entire shell. Keep double precision.
 const silverVariation=kind==='silver'?Float64Array.from({length:n},(_,i)=>shape.level===0?1:.96+.07*(shape.level===1?.28:1)*Math.sin((i+silverSeed)*2.37)):null;
 const silverLife=kind==='silver'?Float64Array.from({length:n},(_,i)=>5.3+.65*(.5+.5*Math.sin((i+silverSeed)*4.13))):null;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('color',new T.BufferAttribute(colors,3));
 const m=new T.PointsMaterial({size:isCreativeShell(kind)?.011:(kind==='longstar'||kind==='sparklelarge')?.010:kind==='ear'?.004:isSenrin(kind)?.012:kind==='willow'?.012:.015,map:sprite,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});bridgeView.point(m,fireworkMaps);const p=new T.Points(g,m);p.frustumCulled=false;town.add(p);
 if(creativeStars&&kind!=='planet'){
  const pointSizes=new Float32Array(n*trailCount);for(let i=0;i<n;i++)for(let j=0;j<trailCount;j++)pointSizes[i*trailCount+j]=creativePointScale(creativeStars[i],j);
  g.setAttribute('creativeSize',new T.BufferAttribute(pointSizes,1));
  m.onBeforeCompile=shader=>{shader.vertexShader='attribute float creativeSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * creativeSize;');};
  m.customProgramCacheKey=()=> 'creative-star-sizes-v1';
 }
 if(longStars){
  const pointSizes=new Float32Array(n*trailCount);for(let i=0;i<n;i++)for(let j=0;j<trailCount;j++)pointSizes[i*trailCount+j]=longStars[i].layer===0?(j===0?1.9:1.15):.82;
  g.setAttribute('longStarSize',new T.BufferAttribute(pointSizes,1));
  m.onBeforeCompile=shader=>{shader.vertexShader='attribute float longStarSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * longStarSize;');};
  m.customProgramCacheKey=()=> 'long-star-sizes-v1';
 }
 if(sparkleStars){const pointSizes=new Float32Array(n*trailCount);for(let i=0;i<n;i++)for(let j=0;j<trailCount;j++)pointSizes[i*trailCount+j]=sparkleStars[i].layer<2?(j===0?2.1:1.12):.72;g.setAttribute('sparkleSize',new T.BufferAttribute(pointSizes,1));m.onBeforeCompile=shader=>{shader.vertexShader='attribute float sparkleSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * sparkleSize;');};m.customProgramCacheKey=()=> 'sparkle-large-sizes-v1';}
 const color=scheme[0],refl=new T.Mesh(riverRibbon(-1.04,1.36,1,.006),reflectionMaterial(color,scheme[1]||color,spec.ignition?{radii:spec.radii,colors:scheme}:null));town.add(refl);
 const baseAscent=kind==='ear'?1.65:size===20?5.6:size===10?3.12:(1+size*.035)*1.2*(2.62/1.62);
 const ignitionDelay=position?.ignitionDelay??(unplannedFlight?naturalFlight.ignitionDelay:sampleIgnitionDelays(1)[0]),ascentOffset=Math.max(-.3,Math.min(.3,position?.ascentOffset??(unplannedFlight?naturalFlight.ascentOffset:0))),ascent=baseAscent+ascentOffset+ignitionDelay;
 // Let the preceding flower fade gently before a planned ground-only scene.
 if(((kind==='sunflower'||kind==='petalflower'||kind==='goldflower'))&&showPlan?.music&&!position?.manual&&!position?.flowerProgramme){
  const opening=(position?.startAt??time)+ascent;
  const nextQuiet=(MUSIC_PLAN.groundOnlyWindows??[]).find(w=>w.start>opening)?.start??Infinity;
  // Keep the existing show's shell budget when the next volley arrives.
  const nextVolley=MUSIC_PLAN.shots.find(s=>s.kind!=='ear'&&s.at>=opening+2.85)?.at??Infinity;
  const life=Math.min(spec.life,nextQuiet-opening-.05,nextVolley-opening-.05);
  if(life<spec.life)spec={...spec,life:Math.max(.5,life)};
 }
 const reflectionRadiusScale=isSenrin(kind)?1:Math.sqrt(shells.reduce((sum,v)=>sum+v*v,0)/n);
 const f={x,z,y,r,color,n,kind,size,spec,ascent,baseAscent,ignitionDelay,ascentOffset,launchX:position?.launchX??x,launchZ:position?.launchZ??z,trailCount,positions,colors,directions,shells,starColors,flowerVariation,flowerStars,clusterCenters,clusterDelays,starLayers,earStars,creativeStars,creativeColoredTail:creativeCandy,creativeTail:creativeStars?new T.Color(creativeTailColor(kind,position?.palette)):scheme[2],bigStars,longStars,sparkleStars,layerLight:spec.ignition?new Float64Array(spec.radii.length):null,silverSeed,silverVariation,silverLife,shape,g,m,p,refl,reflectionRadiusScale,reflectionCenter:new T.Vector3(x,y,z),reflectionRadius:0,start:position?.startAt??time,burst:false,openingTail:position?.openingTail??null,hideAscent:!!position?.hideAscent};if(((!f.hideAscent&&isWhistleShell(f))||position?.whistle===true)&&$('audioMode').value==='recorded'){f.whistle=soundEngine?.chooseWhistle?.(size);if(f.whistle){f.whistleDue=time-f.start+WHISTLE_LAUNCH_DELAY;f.whistleVisualAt=f.whistleDue;}}fireworks.push(f);if(!position?.silent&&!f.hideAscent)sound(false,f.launchX,f.launchZ,size);
 $('last').textContent=scale.label+' · '+spec.label+(palette.label?' · '+palette.label:'');
 if(showPlan?.music)musicLog.push({scheduled:position?.startAt,actual:time,opening:(position?.startAt??time)+ascent,kind,size,points:n*trailCount});
 return true;
}
function clearFireworks(){resetMusicFxQuiet();triggerEmbers.clear();soundEngine?.cancelScheduled?.();for(const f of fireworks){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();}fireworks=[];}
// Free expired launch slots and fire sounds before queued shots, without computing points.
function updateFireworkEvents(){const audioNow=soundEngine?.context?.currentTime;for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 if(t>=0&&!f.burst){f.burst=true;if(f.kind==='ear')bridgeView.point(f.m,null,EAR_PROFILE.pointSize);else if(f.kind==='candyburst')bridgeView.point(f.m,null,.020);}
 if(!groundStudySilent&&f.whistle&&age>=f.whistleVisualAt&&!f.whistlePlayed){
  f.whistleEndDue=f.whistleDue+f.whistle.duration;f.whistlePlayed=true;
  const offset=Math.max(0,f.whistleResumeOffset??0,age-f.whistleDue);if(offset<f.whistle.duration)soundEngine?.playWhistle?.(f.x,audioNow===undefined?undefined:audioNow+Math.max(0,f.whistleDue-age),whistlePositionFor(f),f.whistle,offset);
 }
 const soundDelay=soundDelayFor(f);
 if(t>=0&&!f.soundPlayed){f.soundPlayed=true;f.soundDue=soundDelay;f.soundMode=$('audioMode').value;if(f.soundMode==='recorded'){f.recordedOpeningKey??=soundEngine?.chooseOpening?.(f.size);f.openingVariation??=soundEngine?.chooseSoundVariation?.('opening',f.size);}sound(true,f.x,f.z,f.size,audioNow===undefined?undefined:audioNow+Math.max(0,soundDelay-t),f.y,f.recordedOpeningKey,f.openingVariation,f.openingTail);}
 if(isSenrin(f.kind)&&t>=f.clusterDelays[0]&&!f.childSoundPlayed){f.childSoundPlayed=true;f.childSoundDue=f.clusterDelays[0]+soundDelay;if(f.soundMode==='recorded')f.childVariation??=soundEngine?.chooseSoundVariation?.('senrin-children',f.size);(!groundStudySilent)&&soundEngine?.playSenrinChildren(f.x,audioNow===undefined?undefined:audioNow+Math.max(0,f.childSoundDue-t),bridgeView.active?bridgeView.position(f.x,f.y,f.z):null,f.soundMode??$('audioMode').value,f.size,f.childVariation);}
 const afterDelay=tailCrackleDelayFor(f);
 if(['silver','willow'].includes(f.kind)&&f.soundMode==='recorded'&&t>=afterDelay&&!f.afterSoundPlayed){f.afterSoundPlayed=true;f.afterSoundDue=soundDelay+afterDelay;f.afterVariation??=soundEngine?.chooseSoundVariation?.(f.kind+'-crackle',f.size);(!groundStudySilent)&&soundEngine?.playOpeningCrackle?.(f.x,audioNow===undefined?undefined:audioNow+Math.max(0,f.afterSoundDue-t),bridgeView.active?bridgeView.position(f.x,f.y,f.z):null,f.kind,f.size,f.afterVariation);}
 if(t>f.spec.life){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();fireworks.splice(k,1);continue;}
} }
function updateFireworks(){updateFireworkEvents();for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 const fadeStart=f.spec.fadeStart??f.spec.life*.5;
 const fade=isCreativeShell(f.kind)||f.kind==='sparklelarge'||f.kind==='longstar'||f.kind==='ear'||(f.kind==='sunflower'||f.kind==='petalflower'||f.kind==='goldflower')||t<0?1:Math.pow(Math.max(0,1-Math.max(0,t-fadeStart)/(f.spec.life-fadeStart)),1.4);
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
 f.pointSample??={};f.starFrame??={};
 for(let i=0;i<f.n;i++){
 const prepared=t<0?null:f.kind==='sparklelarge'?prepareSparklePoint(f.sparkleStars[i],f.r,t,f.trailCount,f.spec.life,f.starFrame):f.kind==='longstar'?prepareLongStarPoint(f.longStars[i],f.r,t,f.trailCount,f.spec.life,f.starFrame):null;
 for(let j=0;j<f.trailCount;j++){
 const index=(i*f.trailCount+j)*3;let x,y,z,brightness,longBlue=0,creativeMix=1;
 if(t<0){
 const trail=(i%24)*.003+j*.004,riseAge=f.kind==='silver'?Math.max(0,age-j*.03):age;
 const drift=Math.max(0,Math.min(1,riseAge/f.ascent));x=f.launchX+(f.x-f.launchX)*drift;y=Math.max(.02,f.y*(f.size<10?Math.pow(riseAge/f.ascent,.85):(1-Math.pow(1-Math.min(1,riseAge/(f.ascent-(f.size===20?.6:.28))),2)))-(f.kind==='silver'?0:trail));z=f.launchZ+(f.z-f.launchZ)*drift;
 brightness=f.hideAscent?0:f.kind==='ear'?(i===0&&j<5?.22*(1-j/5):0):i<24?(1-j/f.trailCount)*(f.kind==='silver'?2.2:1.4):0;
 }
 else if(f.creativeStars){const v=creativePoint(f.creativeStars[i],f.r,t,j,f.trailCount,f.pointSample);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;creativeMix=v.headMix;}
 else if(f.kind==='sparklelarge'){const v=sparklePoint(f.sparkleStars[i],f.r,t,j,f.trailCount,f.spec.life,f.pointSample,prepared);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;longBlue=v.blue;}
 else if(f.kind==='longstar'){
 const v=longStarPoint(f.longStars[i],f.r,t,j,f.trailCount,f.spec.life,f.pointSample,prepared);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;longBlue=v.blue;
 }
 else if(f.kind==='candyburst'){
 const v=candyBigStarPoint(f.bigStars[i],f.r,t,j,f.trailCount);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
 }
 else if(f.kind==='candy'){
 const k=j*4,c=f.candyTrailCache,dir=f.directions[i],travel=f.r*f.shells[i]*c[k];
 x=f.x+dir.x*travel;y=f.y+dir.y*travel+c[k+1]-c[k+2];z=f.z+dir.z*travel;
 brightness=c[k+3]*(f.starLayers[i]===0?(j===0?3.2:1.05):(j===0?1.2:.35));
 }
 else if((f.kind==='sunflower'||f.kind==='petalflower'||f.kind==='goldflower')){
 const point=f.kind==='goldflower'?goldPetalPoint:f.kind==='petalflower'?petalPoint:sunflowerPoint;
 const v=point(f.directions[i],f.r,f.shells[i],t,j,f.trailCount,f.spec.life,f.flowerStars?.[i]?.motion,f.flowerVariation);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
 if((f.kind==='petalflower'||f.kind==='goldflower')&&f.shells[i]<.75)brightness*=.28;
 }
 else if(f.kind==='ear'){
 const v=earPoint(f.earStars[i],f.r,t,j,f.pointSample);x=f.x+v.x;y=f.y+v.y;z=f.z+v.z;brightness=v.brightness;
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
 const lag=j*((f.kind==='sunflower'||f.kind==='petalflower'||f.kind==='goldflower')&&f.shells[i]<.75?.006:f.spec.tail),at=Math.max(0,t-lag),dir=f.directions[i],travel=f.r*f.shells[i]*(1-Math.exp(-(f.size===20?.7:1.9)*at));
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
 const col=f.starColors[i];if(f.creativeStars&&t>=0){const tail=f.creativeColoredTail?col:f.creativeTail;f.colors[index]=(tail.r+(col.r-tail.r)*creativeMix)*brightness;f.colors[index+1]=(tail.g+(col.g-tail.g)*creativeMix)*brightness;f.colors[index+2]=(tail.b+(col.b-tail.b)*creativeMix)*brightness;}else if((f.kind==='longstar'||f.kind==='sparklelarge')&&t>=0){const gold=f.starColors[f.n-1],blue=f.color;f.colors[index]=(gold.r+(blue.r-gold.r)*longBlue)*brightness;f.colors[index+1]=(gold.g+(blue.g-gold.g)*longBlue)*brightness;f.colors[index+2]=(gold.b+(blue.b-gold.b)*longBlue)*brightness;}else if(isSenrin(f.kind)&&t>=0&&t<.14){f.colors[index]=brightness;f.colors[index+1]=brightness*.84;f.colors[index+2]=brightness*.55;}else{f.colors[index]=col.r*brightness;f.colors[index+1]=col.g*brightness;f.colors[index+2]=col.b*brightness;}
 }
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
let flowerStudy=null;
let fanQueue=[],cometFinishAt=null,cometCompleted=false;
let groundStudySilent=false,toraSceneMode='mountain-twins',toraSceneLength=4.5,toraSceneSeed=0x141712;
const cometSoundSlots=new Map();
const cometTailSounds=new Map();
const comets=new CometField({town,bridge:bridgeView,map:sprite,headMaps:fireworkMaps,onLaunch:(s,now)=>{
 // One quiet launch voice per firing position and instant; no invented crackle.
 const key=s.group+':'+s.x.toFixed(2)+':'+Math.round(s.at/.06);
 if(groundStudySilent||cometSoundSlots.has(key)||!soundEngine||!audio)return;
 cometSoundSlots.set(key,now);
 const delay=bridgeView.active?bridgeView.delay(s.x,s.y,s.z,latestViewerTransform):.12;
 const position=bridgeView.active?bridgeView.position(s.x,s.y,s.z):null;
 soundEngine.playComet(s.x,audio.currentTime+Math.max(0,delay-(now-s.at)),position,$('audioMode').value,!!s.small);
 if($('audioMode').value==='recorded')cometTailSounds.set(key,{x:s.x,small:!!s.small,visualAt:s.at+.10,due:s.at+.10+delay,position,key:soundEngine.nextRecordedCrackle(),played:false,variation:soundEngine.chooseSoundVariation(s.small?'small-tail':'large-tail')});
}});
function clearFans(){flowerStudy=null;if($('toraSceneCard'))$('toraSceneCard').hidden=true;for(const e of cometTailSounds.values())if(e.played&&e.due>time)try{e.source?.stop();}catch{}cometTailSounds.clear();comets.clear();cometSoundSlots.clear();cometFinishAt=null;cometCompleted=false;}
function launchFans(mode='fan',startAt=time,style=mode==='cross'?'silver':'gold',options={}){
 return comets.launch(mode,style,startAt,options);
}
function updateFans(){
 while(fanQueue.length&&fanQueue[0].at<=time){const cue=fanQueue.shift();if(time-cue.at>.35)continue;launchFans(cue.mode,cue.at,cue.style,cue.options);}
 comets.update(time);
 for(const [key,e] of cometTailSounds){
  if(time>e.due+3.5){cometTailSounds.delete(key);continue;}
  if(!e.played&&time>=e.visualAt&&$('audioMode').value==='recorded'&&soundEngine&&audio){e.played=true;e.source=soundEngine.playRecordedCrackle(e.x,audio.currentTime+Math.max(0,e.due-time),e.position,e.small?'small-tail':'large-tail',e.key,e.variation);}
 }
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
 }else{
 if(showPlan?.programmeStyle)for(const [i,s] of burstQueue.entries()){s.kind=styleKind(showPlan.programmeStyle,s.size,Math.floor(time)*10+i)??s.kind;s.position.palette=stylePalette(showPlan.programmeStyle,s.kind,i);}
 nextLaunch=Math.max(time+19,...burstQueue.map(s=>s.at+(s.size===10?3.12:(1+s.size*.035)*1.2*(2.62/1.62))+TYPES[s.kind].life+1));
 }
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
 normalPrepared=false;clearMusicSequence();showCompleted=false;
 cancelMusicRequest();music.stop();
 running=false;previewing=false;showPlan=null;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();time=0;cueIndex=0;nextLaunch=.8;
 if(audio){audio.close();audio=null;soundEngine=null;}
 syncShowButtons();$('chapter').textContent='大会を終了';$('last').textContent='街の灯りだけを眺める';$('status').textContent='花火大会を止めました。次は最初から始まります。';drawMusicTimeline();
}
function resetAll(){
 cancelAutomaticPreparation();cancelPreparation();controls?.release();if(bridgeView.active)leaveBridge();if(dioramaSaved)toggleDiorama();stopShow();resetBoatCruise(false);restoreDefaultShells();if(showInfo.enabled)toggleShowInfo();const defaults={mood:'quiet',ending:'loop',volume:'1',scale:'1',distance:'2',height:'0',roomBrightness:'1',type:'core',size:'5',palette:'original',towerColor:'blue',audioMode:'recorded',program:'one',musicVolume:'0.35'};
 for(const [id,value] of Object.entries(defaults))$(id).value=value;music.setVolume(.35);syncMusicMix();syncFireworkVolume();
 try{localStorage.removeItem('hanabi-town-settings');}catch{}
 town.scale.setScalar(1);town.position.set(0,0,0);town.rotation.y=0;yaw=0;pitch=0;camera.position.set(0,1.2,2.9);setTowerColor();syncSize();syncPalette();applyRoomBrightness();
 if(renderer.xr.isPresenting)placeTown();
 $('chapter').textContent='幕開け · 0:00';$('last').textContent='次の一玉を待つ';$('status').textContent='設定と視点を初期状態に戻しました。';
}
function restart(){
 if(favoriteRun&&['gap','loading','switch'].includes(favoriteRun.phase))return;
 cancelAutomaticPreparation();const musical=!!showPlan?.music;cancelMusicRequest();music.stop();previewing=false;previewPaused=false;fanQueue=[];clearFans();clearFireworks();burstQueue=[];burstSlots.clear();time=0;nextLaunch=.8;cueIndex=0;$('last').textContent='次の一玉を待つ';
 if(musical){prepareMusicProgram();ensureAudio();music.play(audio,0,soundEngine?.mixInput);running=true;}else{showPlan=null;if(!running)toggle();else prepareProgram();}syncShowButtons();
}

function beginPreview(){
 if($('creativeCard'))$('creativeCard').hidden=true;
 cancelAutomaticPreparation(); if($('toraSceneCard'))$('toraSceneCard').hidden=true;
 clearMusicSequence();cancelMusicRequest();music.stop();
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
  time+=dt;advanceEmbers(dt);updateFireworkEvents();advanceStarmine();updateFans();updateFireworks();if(flowerStudy)$('flowerSeek').value=String(time);
  if(cometFinishAt!==null&&time>=cometFinishAt){previewing=false;previewPaused=false;cometCompleted=true;cometFinishAt=null;cancelFutureSounds();$('chapter').textContent=flowerStudy?'花の試し打ち · 終了':'トラ打ち · 終了';$('status').textContent=flowerStudy?'花と茎の余韻まで終了。同じ花や違う間隔を見比べられます。':'余韻まで終わりました。「このトラを観る」「次の打ち方を観る」で見比べられます。';}
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
 if(!burstQueue.length&&time>=nextLaunch&&time<285&&!awaitingSpecial&&!awaitingPattern&&!awaitingEar){const c=programCue(showPlan,time,cueIndex,$('mood').value==='lively');if(c&&(!isCreativeShell(c.kind)||fireworks.length===0)&&launch(c.kind,c.size,c.position)){cueIndex++;nextLaunch=time+c.interval+((1+c.size*.035)*1.2*(2.62/1.62)-(1+c.size*.035)*1.2);}}
 updateFireworks();
 const elapsed=Math.min(300,Math.floor(time));$('chapter').textContent=chapter(Math.min(time,299))+' · '+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
 if(time>=300){if($('ending').value==='loop'){clearFireworks();clearFans();fanQueue=[];burstQueue=[];burstSlots.clear();time=0;nextLaunch=2;cueIndex=0;prepareProgram();}else{showCompleted=true;running=false;$('play').textContent='花火大会を観る';$('status').textContent='大会が終わりました。街の灯りをお楽しみください。';}}
}
function updateReflections(){
 town.updateWorldMatrix(true,false);
 for(const f of fireworks){const u=f.refl.material.uniforms;u.uCenter.value.copy(f.reflectionCenter);town.localToWorld(u.uCenter.value);u.uRadius.value=f.reflectionRadius/.8*town.scale.x;u.uWaterY.value=town.position.y+.006*town.scale.y;u.uGain.value=f.reflectionGain||0;u.uTime.value=time;u.uDetail.value=bridgeView.mode==='boat'&&bridgeView.active?2.5:1;u.uWorldScale.value=bridgeView.active?BRIDGE_SCALE:1;if(f.layerLight){for(let i=0;i<f.spec.radii.length;i++)u.uLayerGains.value[i]=Math.min(1,f.layerLight[i]/(2*Math.round(SIZES[f.size].stars*f.spec.layerWeights[i])));}f.refl.visible=u.uGain.value>0;}
}
function placeTown(){if(renderer.xr.isPresenting&&!bridgeView.active)pendingPlace=true;}
function ensureAudio(){
 if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();soundEngine=new FireworkAudio(audio,Number($('volume').value));}
 soundEngine?.setSpatialMode?.(new URLSearchParams(location.search).get('spatial')==='full'?'full':renderer.xr.isPresenting||/OculusBrowser/.test(navigator.userAgent)?'adaptive':'full');
 audio.resume().catch(e=>{$('status').textContent='音声を開始できませんでした：'+e.message;});
}
function toggle(){
 if(favoriteRun&&['gap','loading','switch'].includes(favoriteRun.phase)){favoriteRun.gapPaused=!favoriteRun.gapPaused;favoritesUI?.setFestival(favoriteRun.gapPaused?'曲間で一時停止中':'次の曲を待っています');return;}
 showCompleted=false;
 if(showPlan?.music){
  if(!running){
   if(musicCanFinish()){clearFireworks();clearFans();time=0;prepareMusicProgram();}
   ensureAudio();music.play(audio,time,soundEngine?.mixInput);running=true;
  }else{time=music.pause();running=false;cancelFutureSounds();}
  syncShowButtons();$('status').textContent=running?'音楽と花火を鑑賞中です。':'音楽と花火を一時停止しました。';return;
 }
 cancelMusicRequest();
 if(previewing){previewing=false;time=0;cueIndex=0;nextLaunch=.8;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();}
 if(!running&&!showPlan)prepareProgram();normalPrepared=false;running=!running;
 syncShowButtons();$('status').textContent=running?(time<18.3?'稲穂の横一列から幕開け。金の尾の余韻をお楽しみください。':'オート大会を鑑賞中。操作せず、そのまま眺めてください。'):'夜の街で、ひと休み。';if(running)ensureAudio();else cancelFutureSounds();
}
$('play').disabled=false;$('play').textContent='花火大会を観る';
$('play').onclick=()=>{if(showPlan?.music)beginNormalShow();else if(time>=300)restart();else toggle();};
$('musicAll').onclick=beginMusicSequence;$('musicShow').onclick=beginMusicShow;$('musicStop').onclick=()=>{cancelAutomaticPreparation();stopShow();};$('musicRestart').onclick=()=>{if(showPlan?.music)restart();else beginMusicShow();};$('restart').onclick=restart;$('stop').onclick=stopShow;$('reset').onclick=resetAll;
$('musicFinale').onclick=()=>beginMusicExcerpt(MUSIC_PLAN.finalPreviewStart??MUSIC_PLAN.duration-12,'最後の大輪と、曲後の余韻を観ます。');
$('musicPyramid').onclick=()=>beginMusicExcerpt(musicMiddleStart(),'中盤から観ます。');
$('cometShow').onclick=()=>beginCometStudy();
$('cometNext').onclick=()=>{const options=[...$('cometPattern').options];const i=options.findIndex(o=>o.value===$('cometPattern').value);$('cometPattern').value=options[(i+1)%options.length].value;$('cometPattern').onchange();beginCometStudy();};
$('cometSequence').onclick=beginCometSequence;
$('cometPause').onclick=()=>{if(previewing)pauseShow();};
$('cometPattern').onchange=()=>{const small=$('cometPattern').value.startsWith('small-');$('cometSequence').textContent=small?($('cometPattern').value.endsWith('-tight')?'すぼめた子トラの演出 · 約26秒':'子トラの演出を観る · 約26秒'):(['sweep','sweep-reverse','sweep-cross','sweep-cross-high'].includes($('cometPattern').value)?'左右の掛け合いを観る · 約18秒':'大トラの演出を観る · 約34秒');$('cometDescription').textContent=COMET_PATTERNS.find(p=>p.id===$('cometPattern').value)?.description??'';for(const option of $('cometStyle').options){option.disabled=(!small&&!COMET_STYLES[option.value])||(option.value==='tora-row-mix'&&$('cometPattern').value!=='small-color-row');option.textContent=small?SMALL_STYLE_LABELS[option.value]:(COMET_STYLES[option.value]?.label??SMALL_STYLE_LABELS[option.value]);}if((!small&&!COMET_STYLES[$('cometStyle').value])||($('cometStyle').value==='tora-row-mix'&&$('cometPattern').value!=='small-color-row'))$('cometStyle').value='gold';mrPanel.draw();};

$('fans').onclick=()=>beginCometStudy();
$('big').onclick=()=>{beginPreview();launch('triple',20,{x:0,z:-.1});};
$('finale').onclick=()=>{beginPreview();startStarmine(true,false);};
$('wideFinale').onclick=()=>{beginPreview();startStarmine(true,true);$('status').textContent='特別な締め：5号5発 → 0.6秒後に尺玉3発 → 頂上の二尺玉1発。';};
$('starmine').onclick=()=>{beginPreview();if($('program').value==='random')startRandomStarmine(createProgram('random',crypto.getRandomValues(new Uint32Array(1))[0]));else startStarmine(false,false);};
$('sample').onclick=()=>{if($('rainEarCard'))$('rainEarCard').hidden=true;beginPreview();syncSize();const ok=launch($('type').value,Number($('size').value),{x:0,z:.05,palette:$('palette').value});$('status').textContent=ok?'選んだ一玉を打ち上げています。'+(['silver','willow'].includes($('type').value)?' 尾のバラバラ音は、開花音の'+(Number($('size').value)===20?'2':'1.5')+'秒後です。':''):'この組み合わせを上げられません。種類と号数を確認してください。';};$('status').textContent='川と橋のある街へ、ようこそ。';
$('program').onchange=()=>{$('status').textContent=showPlan?'次の大会から「'+PROGRAM_NAMES[$('program').value]+'」で始まります。「大会を最初から」で今すぐ切り替えられます。':'「'+PROGRAM_NAMES[$('program').value]+'」を選びました。';};
$('audioMode').onchange=()=>{$('status').textContent=({'recorded':'録音素材の花火音です。玉ごとに音が変わります。','realistic':'リアル寄せ合成の花火音です。','original':'従来の合成音です。'})[$('audioMode').value];};
function syncFireworkVolume(){
 const value=Number($('volume').value),text=Math.round(value*100)+'％';$('volumeValue').textContent=text;$('musicFireworkVolumeValue').textContent=text;$('musicFireworkVolume').value=String(value);
}
$('volume').oninput=()=>{soundEngine?.setVolume(Number($('volume').value));syncFireworkVolume();};
$('musicFireworkVolume').oninput=()=>{$('volume').value=$('musicFireworkVolume').value;$('volume').dispatchEvent(new Event('input'));};
$('musicFireworkVolume').onchange=()=>{$('volume').dispatchEvent(new Event('change'));};
 $('fiveSoundStudy').onclick=()=>{
  beginPreview();soundEngine?.resetOpeningCycle?.(5);
  burstQueue=Array.from({length:5},(_,i)=>({at:i*4.6,kind:'core',size:5,position:{x:0,z:.05,palette:'original',startAt:i*4.6}}));
  $('status').textContent='5号玉を5発。同じ位置で、開花音を聴き比べます。';
 };
$('allSoundStudy').onclick=()=>{
  const size=Number($('size').value),kind=$('type').value,count=({2:2,3:5,5:5,10:4,20:2})[size];
  beginPreview();soundEngine?.resetOpeningCycle?.(size);
  const gap=size>=10?8:4.6;
  burstQueue=Array.from({length:count},(_,i)=>({at:i*gap,kind,size,position:{x:0,z:.05,palette:$('palette').value,startAt:i*gap}}));
  $('status').textContent=SIZES[size].label+'を'+count+'発。同じ位置で、開花音をひと巡り聴き比べます。';
 };
$('senrinSoundStudy').onclick=()=>{
  beginPreview();const sizes=[10,20,10,20];
  burstQueue=sizes.map((size,i)=>({at:i*9,kind:'senrin',size,position:{x:0,z:.05,startAt:i*9}}));
  $('status').textContent='千輪の尺・二尺を交互に4発。二尺の小玉は低音と控えめな残響を加えています。';
 };
 $('tailSoundStudy').onclick=()=>{
  const kind=$('type').value==='willow'?'willow':'silver',size=Number($('size').value)===20&&kind==='silver'?20:10;
  beginPreview();burstQueue=Array.from({length:6},(_,i)=>({at:i*7,kind,size,position:{x:0,z:.05,wide:size===20,startAt:i*7}}));
  $('status').textContent='尾の音を6発で聴き比べます。バラバラの並び・高さ・音色を一発ずつ少し変えています。';
 };
$('whistleSoundStudy').onclick=()=>{
 beginPreview();const kind=['double','triple','quad','penta'].includes($('type').value)?$('type').value:'double';
 const size=kind==='triple'?20:kind==='double'?10:Number($('size').value)===20?20:10;
 burstQueue=Array.from({length:6},(_,i)=>({at:i*9,kind,size,position:{x:0,z:.05,startAt:i*9}}));
 $('status').textContent='特別な玉の笛を6発。録音6種類を重複せずに一巡し、音程・音量・入りも少しずつ変えます。';
};
function applyTownHeight(){if(!bridgeView.active&&renderer.xr.isPresenting)town.position.y=Number($('height').value)-groundBottomY*town.scale.y;}
function adjustTownDistance(){
 if(bridgeView.active||!renderer.xr.isPresenting||!latestViewerTransform)return;
 const p=latestViewerTransform.position,d=Number($('distance').value);
 town.position.x=p.x-Math.sin(town.rotation.y)*d;town.position.z=p.z-Math.cos(town.rotation.y)*d;
}
$('scale').oninput=()=>{if(bridgeView.active)return;town.scale.setScalar(Number($('scale').value));applyTownHeight();if(dioramaSaved){bridgeView.miniaturePointScale=town.scale.x;bridgeView.syncPoints();}};$('distance').oninput=adjustTownDistance;
function previewPointer(e,activate=false){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*2-1,y=1-(e.clientY-r.top)/r.height*2;if(mrPanel.childView)return mrPanel.previewPointer(x,y,camera,activate);return entryTip?.previewPointer(x,y,camera,activate)||favoritesPanel?.previewPointer(x,y,camera,activate)||mrPanel.previewPointer(x,y,camera,activate);}
canvas.onpointerdown=e=>{if(panelPreview){previewPointer(e,true);canvas.setPointerCapture(e.pointerId);return;}drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(panelPreview){previewPointer(e);return;}if(!drag)return;yaw+=(e.clientX-drag[0])*.003;pitch=bridgeView.active?Math.max(-1.48,Math.min(1.48,pitch-(e.clientY-drag[1])*.003)):Math.max(-.35,Math.min(.35,pitch+(e.clientY-drag[1])*.002));drag=[e.clientX,e.clientY];};canvas.onpointerup=()=>{drag=null;if(panelPreview){mrPanel.release();favoritesPanel?.release();}};canvas.onpointercancel=()=>{drag=null;if(panelPreview){mrPanel.release();favoritesPanel?.release();}};canvas.onwheel=e=>{if(panelPreview&&mrPanel.picker){mrPanel.scrollPicker(e.deltaY);return;}if(!renderer.xr.isPresenting&&!bridgeView.active)camera.position.z=Math.max(dioramaSaved?.4:1.6,Math.min(dioramaSaved?2:5,camera.position.z+e.deltaY*.002));};
const xrControllers=[];for(let i=0;i<2;i++){const c=renderer.xr.getController(i);scene.add(c);xrControllers.push(c);}
// Keep the next visit ready for viewing, without saving transient show state.
function allowedSize(kind,value){if(isCreativeShell(kind))return ['5','10'].includes(value);if(kind==='candysenrin')return value==='10';if(kind==='sparklelarge')return ['5','10','20'].includes(value);if(kind==='petalflower'||kind==='goldflower')return ['3','5','10'].includes(value);if(kind==='candyburst'||kind==='longstar')return value==='5'||value==='10';if(kind==='candy')return ['3','5','10'].includes(value);if(kind==='ear')return value==='2';if(value==='2')return false;return !(kind==='kiku'?value!=='3':kind==='triple'?value!=='20':['senrin','quad','penta'].includes(kind)?!['10','20'].includes(value):kind==='double'?value!=='10':value==='20');}
function syncSize(){const kind=$('type').value;for(const o of $('size').options)o.disabled=!allowedSize(kind,o.value);if(isCreativeShell(kind)&&!['5','10'].includes($('size').value))$('size').value='5';else if(kind==='ear')$('size').value='2';else if(kind==='kiku')$('size').value='3';else if(kind==='candysenrin')$('size').value='10';else if(kind==='candy'&&!['3','5','10'].includes($('size').value))$('size').value='3';else if(['petalflower','goldflower'].includes(kind)&&!['3','5','10'].includes($('size').value))$('size').value='3';else if((kind==='candyburst'||kind==='longstar')&&!['5','10'].includes($('size').value))$('size').value='5';else if(kind==='sparklelarge'){if(!['5','10','20'].includes($('size').value))$('size').value='5';}else if(kind==='triple')$('size').value='20';else if(kind==='double')$('size').value='10';else if(['senrin','quad','penta'].includes(kind)){if(!['10','20'].includes($('size').value))$('size').value='10';}else if(['2','20'].includes($('size').value))$('size').value='5';}
function syncPalette(){
 const kind=$('type').value,select=$('palette'),previous=select.value,options=paletteOptions(kind);
 select.replaceChildren(...(options.length?options:[{id:'original',label:'この花火の配色'}]).map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.label||'この花火の配色';return option;}));
 select.disabled=!options.length;select.value=options.some(p=>p.id===previous)?previous:'original';
}
$('type').addEventListener('change',()=>{syncSize();syncPalette();});
const settingsIds=['program','mood','ending','volume','scale','distance','height','roomBrightness','type','size','palette','towerColor','audioMode','musicVolume'];
try{const saved=JSON.parse(localStorage.getItem('hanabi-town-settings')||'{}');const shell=replaceRetiredShell({kind:saved.type,size:Number(saved.size),position:{palette:saved.palette}});if(shell.kind!==saved.type){saved.type=shell.kind;saved.palette=shell.position.palette;}if(!localStorage.getItem('hanabi-town-fx-default-60')){if(saved.volume===undefined||Number(saved.volume)===.3){saved.volume='0.6';localStorage.setItem('hanabi-town-settings',JSON.stringify(saved));}localStorage.setItem('hanabi-town-fx-default-60','1');}if(!localStorage.getItem('hanabi-town-fx-default-100')){if(saved.volume===undefined||Number(saved.volume)===.6){saved.volume='1';localStorage.setItem('hanabi-town-settings',JSON.stringify(saved));}localStorage.setItem('hanabi-town-fx-default-100','1');}if(!localStorage.getItem('hanabi-town-mix-default-35')){if(saved.musicVolume===undefined||Number(saved.musicVolume)===.65){saved.musicVolume='0.35';localStorage.setItem('hanabi-town-settings',JSON.stringify(saved));}localStorage.setItem('hanabi-town-mix-default-35','1');}for(const id of settingsIds){if(id==='palette')syncPalette();const el=$(id);if(saved[id]!==undefined){const old=el.value;el.value=saved[id];if(el.value==='')el.value=old;}}town.scale.setScalar(Number($('scale').value));}catch{}
setTowerColor();syncSize();syncPalette();syncFireworkVolume();$('programInfo').textContent=PROGRAM_NAMES[$('program').value];
for(const id of settingsIds)$(id).addEventListener('change',()=>{if(dioramaSaved)return;try{localStorage.setItem('hanabi-town-settings',JSON.stringify(Object.fromEntries(settingsIds.map(id=>[id,$(id).value]))));}catch{}});
let pendingDiorama=false,pendingPlace=false,mrStarting=false,mrSession=null,mrMetrics=null,mrMeta=null,lastMRReport=null,latestViewerTransform=null,pendingViewMode=null,pendingPanelOpen=false,pendingPanelPage=0,pendingBridge=false,vrSupported=false,pendingRenameReturn=null;
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
try{if(!localStorage.getItem('hanabi-town-recorded-default-1144')){$('audioMode').value='recorded';const saved=JSON.parse(localStorage.getItem('hanabi-town-settings')||'{}');saved.audioMode='recorded';localStorage.setItem('hanabi-town-settings',JSON.stringify(saved));localStorage.setItem('hanabi-town-recorded-default-1144','1');}}catch{$('audioMode').value='recorded';}
if(new URLSearchParams(location.search).get('audioTrial')==='1')$('audioMode').value='recorded';
function mrSettings(){return {scale:Number($('scale').value),distance:Number($('distance').value),height:Number($('height').value),roomBrightness:Number($('roomBrightness').value),audioMode:$('audioMode').value,volume:Number($('volume').value),program:$('program').value};}
function mrReport(){return mrMetrics?{...mrMeta,ended:!mrSession,environmentBlendMode:mrMeta.environmentBlendMode,settings:mrSettings(),cruise:{seconds:boatSeconds,started:boatStarted,pose:{...boatPose},rate:riverNight.cruiseRate,waiting:riverNight.cruiseWaiting,reservation:riverNight.turnReservation?{...riverNight.turnReservation}:null,trafficClocks:[...riverNight.trafficClocks],showRunning:running,showCompleted,previewing,previewPaused,documentHidden:document.hidden,xrVisibility:mrSession?.visibilityState??null},peakFireworkParticles:mrMetrics.peakParticles,peakDrawCalls:mrMetrics.peakCalls,samples:[...mrMetrics.samples]}:lastMRReport;}
$('mrExport').onclick=()=>{
 const report=mrReport();if(!report){$('mrInfo').textContent='MR実機の計測はまだありません。';return;}
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='hanabi-town-MR-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function readPanel(){
 const result={analysisFeedback:analysisFeedback?{...analysisFeedback}:null,flowerDescription:$('flowerDescription').textContent,trackUndo:!$('trackUndo').hidden,trackMenuOpen:!$('trackMenu').hidden,trackCanRename:!$('trackMenuToggle').disabled,entryTipEnabled:!entryTip.suppressed,favoriteSaved:!!favoritesUI?.state.saved,favoriteCanSave:!!favoritesUI?.state.canSave&&!favoritesUI?.state.busy,musicless:noMusicMode&&!pendingAutomaticTrack&&!selectionProblem,musicOriginal:!!selectedMusic.original&&!pendingAutomaticTrack&&!selectionProblem,selectionFailed:!!selectionProblem,showWatchLabel:$('showWatch').textContent,showWatchDisabled:$('showWatch').disabled,readiness:{phase:$('showReadiness').dataset.phase,heading:$('showReadinessHeading').textContent,title:$('showReadinessTitle').textContent,setting:$('showReadinessSetting').textContent},showNotice:!noMusicMode&&!selectedMusic.original&&!$('autoMusicRebuildFeedback').hidden?$('autoMusicRebuildComplete').textContent:$('showNotice').textContent,normalBuildNumber,betaMusicReview:true,betaTCEnabled,betaMusicClock:betaTimeLabel(betaDragging?Number($('betaMusicSeek').value):time),betaMusicCurrent:betaClock(Math.min(betaDragging?Number($('betaMusicSeek').value):time,MUSIC_PLAN.duration)),betaMusicDuration:betaClock(MUSIC_PLAN.duration),betaMusicSeek:{value:(betaDragging?Number($('betaMusicSeek').value):Math.min(time,MUSIC_PLAN.duration))/MUSIC_PLAN.duration},diorama:!!dioramaSaved,cometPaused:previewPaused,cometDescription:$('cometDescription').textContent,musicState:$('musicState').textContent,musicDescription:selectedMusic.description,playLabel:$('play').textContent,musicLabel:$('musicShow').textContent,musicBusy,musicSequence:!!musicSequence,musicFeeling:musicFeelingLabel(),musicAnalysisBusy:directingBusy||musicBusy||!!pendingAutomaticTrack,musicAutoGenerated:!!selectedMusic.autoGenerated&&!pendingAutomaticTrack,musicSequenceState:$('musicSequenceState').textContent,musicShow:!!showPlan?.music,awaitingShow:!running&&!previewing&&!showPlan,resumeShow:!!showPlan,preparing:preparation?{...preparation,summary:prepareSummary()}:null,prepareOptions:preparation?prepareOptions():[],running,loadedLeft:preparedShellName(loadedShells.left),loadedRight:preparedShellName(loadedShells.right),bridge:bridgeView.active,boat:bridgeView.active&&bridgeView.mode==='boat',boatWaiting:riverNight.cruiseWaiting,xrMode:mrMeta?.sessionMode,chapter:$('chapter').textContent,last:$('last').textContent,status:$('status').textContent,metric:$('mrInfo').textContent};
 for(const id of ['flowerPattern','flowerTiming','flowerSpacing','flowerColor','flowerSize','program','mood','ending','type','size','palette','audioMode','towerColor','cometPattern','cometStyle','musicTrack','autoMusicFeeling','autoMusicEars','helpTopic','setlistSelect','panelTheme']){
  const el=$(id);result[id]={value:el.value,selected:el.selectedOptions[0]?.textContent??'',disabled:el.disabled,options:[...el.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}))};
 }
 for(const id of ['scale','distance','height','volume','roomBrightness','musicVolume'])result[id]={value:Number($(id).value)};
 return result;
}
function choosePanel(id,value){const el=$(id);if(el.disabled||![...el.options].some(o=>o.value===value&&!o.disabled))return;el.value=value;el.dispatchEvent(new Event('change'));}
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
 if(id==='betaMusicSeek'){if(selectionProblem||pendingAutomaticTrack||musicBusy)return;const el=$(id);el.value=String(Math.max(0,Math.min(1,value))*MUSIC_PLAN.duration);el.dispatchEvent(new Event('input'));if(commit)el.dispatchEvent(new Event('change'));return;}
 if(bridgeView.active&&id==='roomBrightness')return;
 const el=$(id);el.value=String(clampBrightness(value));el.dispatchEvent(new Event('input'));
 if(commit)el.dispatchEvent(new Event('change'));
}
async function exitMRToPage(){
 if(panelPreview){mrPanel.end();mrNameEditor?.close();favoritesPanel?.end();return;}
 if(!mrSession)return;
 try{await mrSession.end();}catch(e){$('status').textContent='MRを終了できませんでした：'+e.message;}
}
const entryTip=new EntryTip(scene,{onPreferenceChanged:(hidden,saved)=>{
 $('entryTipEnabled').checked=!hidden;mrPanel.draw();
 if(!saved)$('status').textContent='操作案内の設定を保存できませんでした。';
}});
$('entryTipEnabled').checked=!entryTip.suppressed;
$('entryTipEnabled').onchange=()=>entryTip.setSuppressed(!$('entryTipEnabled').checked);
const mrPanel=new MRPanel({scene,read:readPanel,click:id=>$(id).click(),cycle:cyclePanel,choose:choosePanel,adjust:adjustPanel,place:placeTown,exit:exitMRToPage,set:setPanelRange,pageChanged:page=>setPanelTab(page),prepareChoose:choosePreparation,prepareTab,childChanged:open=>{if(open)wristMenu.close();else if(analysisFeedback)analysisFeedback.inChild=false;}});
$('helpTopic').addEventListener('change',()=>{mrPanel.helpScroll=0;mrPanel.draw();});
for(const c of xrControllers)mrPanel.attach(c);showInfo.entries=mrPanel.controllers;betaReviewPanel.entries=mrPanel.controllers;
favoritesPanel=new FavoritesPanel({scene,read:()=>({...favoritesUI?.state,rows:favoritesUI?.state.rows??[],busy:favoritesUI?.state.busy??true,rename:mrNameEditor?.state??null}),click:id=>$(id).click(),choose:(command,value)=>{if(command==='check')void favoritesUI.toggle(value);if(command==='load')void favoritesUI.load(value);if(command==='reorder')void favoritesUI.reorder(value.id,value.index);if(command==='delete')void favoritesUI.remove(value);if(command==='undo')void favoritesUI.undo();if(command==='rename')renameFavoriteFromMR(value);if(command==='setlistRename')renameFavoriteFromMR(value,'setlist');if(command==='setlistLoad')void favoritesUI.loadSetlist(value);if(command==='setlistDelete')void favoritesUI.removeSetlist(value);if(command==='setlistUndo')void favoritesUI.restoreSetlist();if(command==='renameFocus')mrNameEditor.focus();if(command==='renameSave')void mrNameEditor.save();if(command==='renameCancel')mrNameEditor.close();},set:()=>{}});favoritesPanel.controllers=mrPanel.controllers;
const wristMenu=new WristMenu({scene,entries:mrPanel.controllers,read:()=>bridgeView.active,readTC:()=>betaTCEnabled,readInfo:()=>showInfo.enabled,readDiorama:()=>!!dioramaSaved,readBoat:()=>bridgeView.mode==='boat',readCruiseStarted:()=>boatStarted,beforeOpen:()=>{if(mrPanel.childView)mrPanel.navigate(4);},choose:mode=>{if(mode==='tc-panel'){toggleBetaTC();return;}if(mode==='boat-start'){$('boatStart').click();return;}if(mode==='show-info'){toggleShowInfo();return;}if(mode==='bridge'||mode==='boat'){if(bridgeView.active&&bridgeView.mode===mode)return;$(mode).click();return;}if(bridgeView.active)leaveBridge();if(mode==='diorama'&&!dioramaSaved)toggleDiorama();else if(mode==='miniature'&&dioramaSaved)toggleDiorama();}});
$('panelTheme').value=panelThemeId();
function redrawPanelTheme(){controls.refreshPanelBars();mrPanel.draw();favoritesPanel.draw();wristMenu.draw();betaReviewPanel.drawReview();entryTip.draw();}
$('panelTheme').addEventListener('change',()=>{setPanelTheme($('panelTheme').value);redrawPanelTheme();});
panelFontReady.then(()=>redrawPanelTheme());
const panelSurfaceTrial=['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).get('panelPerf')==='1'?new PanelSurfaceTrial({
 onChange:()=>{mrPanel.draw();favoritesPanel.draw();wristMenu.draw();},
 onComplete:report=>{void fetch('/study/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({build:BUILD_VERSION,...report})}).catch(()=>{});}
}):null;
function toggleShowInfo(){toggleBetaTC();}
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
function loadShell(hand){loadedShells[hand]=chosenShell();$('loaded'+(hand==='left'?'Left':'Right')).textContent=preparedShellName(loadedShells[hand]);$('status').textContent=(hand==='left'?'左':'右')+'トリガーに '+shellName(loadedShells[hand])+' を仕込みました。';mrPanel.draw();}
let preparation=null;
const prepareFields=['kind','size','palette'];
const preparedKinds=['willow','silver','core','double','triple','quad','penta','senrin','candy','candyburst','candysenrin','longstar','sparklelarge','petalflower','goldflower'];
function prepareOptions(){
 const {draft,tab}=preparation;
 if(tab===0)return preparedKinds.map(value=>({value,label:TYPES[value].label.replace('（軽量テスト）',''),disabled:false}));
 if(tab===1)return ['10','20'].map(v=>({value:v,label:SIZES[v].label,disabled:!allowedSize(draft.kind,v)}));
 const colors=paletteOptions(draft.kind);return colors.length?colors.map(o=>({value:o.id,label:o.label||'この花火の配色',disabled:false})):[{value:'original',label:'この花火の配色',disabled:false}];
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
$('loadLeft').onclick=()=>loadShell('left');$('loadRight').onclick=()=>loadShell('right');
$('prepareConfirm').onclick=confirmPreparation;$('prepareCancel').onclick=cancelPreparation;
for(let i=0;i<3;i++){$('prepareTab'+i).onclick=()=>prepareTab(i);$('prepareTab'+i).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;prepareTab(next);$('prepareTab'+next).focus();};}
function firePrepared(hand,origin,direction){
 if(hand!=='left'&&hand!=='right')return;
 if(previewing&&previewPaused){$('status').textContent='試し打ちを一時停止中です。右Bで再開できます。';return;}
 // Loading a trigger does not replace a running festival with a trial.
 // Before a show, the loader can still be used to try the prepared shell.
 if(mrPanel.page===1&&!running&&!previewing&&(!showPlan||showCompleted))beginPreview();
 else if(!running&&!previewing){$('status').textContent='大会を開始・再開すると、仕込んだ一玉を追加できます。';return;}
 // A prepared hand always wins, including when the trial tab stays selected.
 ensureAudio();const shell=loadedShells[hand]??chosenShell();
 const points=fireworks.reduce((n,f)=>n+f.n*f.trailCount,0)+(comets.points??0)+triggerEmbers.pending.reduce((n,s)=>n+manualPointCost(s.shell.kind,s.shell.size,SIZES,TYPES),0)+manualPointCost(shell.kind,shell.size,SIZES,TYPES);
 const ok=manualBudget.accepts(points)&&triggerEmbers.send(hand,shell,origin,direction);
 $('status').textContent=ok?(hand==='left'?'左':'右')+'トリガーで '+shellName(shell)+' を街へ送りました。':'いまは描画の負荷が大きいため、追加の発射を待っています。少し間を置いてもう一度どうぞ。';
}
function pauseShow(){if(previewing){previewPaused=!previewPaused;if(previewPaused)cancelFutureSounds();else ensureAudio();$('status').textContent=previewPaused?'試し打ちを一時停止しました。右Bで再開できます。':'試し打ちを再開しました。';}else if(running||showPlan)toggle();}
function setPanelTab(page){
 if(page===0)page=4;mrPanel.picker=null;mrPanel.adjusting=false;mrPanel.studyMode=false;mrPanel.groundStudy=false;mrPanel.flowerStudy=false;
 preparation=null;$('preparePanel').hidden=true;mrPanel.page=page;
 for(let i=0;i<5;i++){$('browserPage'+i).hidden=i!==page;$('browserTab'+i).setAttribute('aria-selected',String(i===page));$('browserTab'+i).tabIndex=i===page?0:-1;}
 mrPanel.draw();
}
const PANEL_PAGES=[4,2,3];
for(const [index,i] of PANEL_PAGES.entries()){$('browserTab'+i).onclick=()=>setPanelTab(i);$('browserTab'+i).onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=PANEL_PAGES[e.key==='Home'?0:e.key==='End'?PANEL_PAGES.length-1:(index+(e.key==='ArrowRight'?1:PANEL_PAGES.length-1))%PANEL_PAGES.length];setPanelTab(next);$('browserTab'+next).focus();};}setPanelTab(0);
$('showTrialOpen').onclick=()=>setPanelTab(1);$('showTrialBack').onclick=()=>setPanelTab(4);$('showTC').onclick=()=>toggleBetaTC();

const townGrabTarget=new T.Mesh(new T.BoxGeometry(3.2,.10,2.1),new T.MeshBasicMaterial({side:T.DoubleSide}));townGrabTarget.position.y=ground.position.y;townGrabTarget.visible=false;town.add(townGrabTarget);
const controls=new XRControls({entries:mrPanel.controllers,town,townTarget:townGrabTarget,groundBottomY,panels:[mrPanel,wristMenu,showInfo,betaReviewPanel,favoritesPanel,entryTip],sidebar:mrPanel,wrist:wristMenu,bridge:bridgeView,fire:firePrepared,pause:pauseShow,changed:commit=>{
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
 if(new URLSearchParams(location.search).get('entryTipPreview')==='1')entryTip.begin({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},performance.now());
 addEventListener('keydown',e=>{if(e.key.toLowerCase()==='x'){mrPanel.active=true;mrPanel.preview=true;if(mrPanel.visible)mrPanel.close();else mrPanel.openAt({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},{side:0,distance:1.45,drop:.3});}});
}
function syncViewControls(){
 $('bridge').textContent=bridgeView.active&&bridgeView.mode==='bridge'?'ミニチュアに戻る':'街に入る · 手前の橋';
 $('boat').textContent=bridgeView.active&&bridgeView.mode==='boat'?'屋形船を降りる':'屋形船から観る';$('boatStart').hidden=!boatStarted;
 $('viewHint').textContent=bridgeView.active?(bridgeView.mode==='boat'?'屋形船のデッキ：自分の足／左スティックで歩けます。MacはWASDで移動。':'橋の上：左スティックで約３m×1.5mの範囲を移動。サイドパネルを出したままでも歩けます。'):boatStarted?'降りた屋形船も航行を続けます。乗り直すと、その時の船へ戻れます。':'街を見下ろす／橋の上から見上げる／屋形船から眺める。同じ花火大会を楽しめます。';
 for(const id of ['scale','distance','height','roomBrightness','mrPreset','diorama'])$(id).disabled=bridgeView.active;
 document.body.classList.toggle('bridge-view',bridgeView.active);
}
function applyViewBackground(){
 const ar=mrSession?.environmentBlendMode==='alpha-blend',miniAR=ar&&!bridgeView.active;
 scene.background=miniAR?null:new T.Color(ar?0x000000:0x050a16);
 scene.fog=miniAR?null:new T.FogExp2(ar?0x000000:0x050a16,bridgeView.active?.085/BRIDGE_SCALE:.085);
 renderer.setClearColor(miniAR?0x000000:0x050a16,miniAR?0:1);applyRoomBrightness();
}
function enterBridge(transform=null,mode='bridge'){
 if(bridgeView.active&&bridgeView.mode===mode)return;entryTip.end();triggerEmbers.clear();controls.release();wristMenu.close();wristMenu.moved=false;cancelFutureSounds();if(!bridgeView.active)miniAngles={yaw,pitch};pendingPlace=false;
 if(mode==='boat')boatStarted=true;bridgeView.enter(transform,mode);yaw=0;pitch=mode==='boat'?.15:.95;applyViewBackground();syncViewControls();
 showInfo.reanchor();mrMeta?.viewChanges.push({showTime:time,mode});
 $('status').textContent=mode==='boat'?'屋形船の上のデッキです。街の手前から永代橋と清澄橋をくぐり、奥の橋の手前で折り返して戻ります。降りたあとも船は航行し、乗り直すとその時の位置へ戻れます。「出航位置に戻る」で最初から乗れます。一時停止中は船も停まります。':'橋の上：左スティックでゆっくり移動。サイドパネルを出したままでも歩けます。';
}
function leaveBridge(){
 if(!bridgeView.active)return;pendingViewMode=null;triggerEmbers.clear();controls.release();wristMenu.close();wristMenu.moved=false;cancelFutureSounds();bridgeView.leave();yaw=miniAngles?.yaw??0;pitch=miniAngles?.pitch??0;miniAngles=null;
 applyViewBackground();syncViewControls();showInfo.reanchor();mrMeta?.viewChanges.push({showTime:time,mode:'miniature'});
 $('status').textContent='街を見下ろす視点へ戻りました。花火大会は続いています。';
}
async function checkMR(){
 if(!isSecureContext){$('mr').textContent='MRにはHTTPSかQuestのlocalhostが必要';$('mrInfo').textContent='LANの通常HTTPではMRを開始できません。';return;}
 if(!navigator.xr){$('mr').textContent='MRで観る · Quest対応';$('mrInfo').textContent='WebXRがありません。Quest Browserで開いてください。';return;}
 try{const [ar,vr]=await Promise.all([navigator.xr.isSessionSupported('immersive-ar'),navigator.xr.isSessionSupported('immersive-vr')]);vrSupported=vr;$('mr').disabled=!ar;$('mr').textContent=ar?'MRで観る':'このブラウザはMR非対応';$('mrInfo').textContent=ar||vr?'QuestでMR・橋の上からの鑑賞を開始できます。':'このブラウザでは、画面上で橋の視点を試せます。';}catch(e){$('mr').textContent='MR対応を確認できませんでした';$('mrInfo').textContent=e.name+'：'+e.message;}
}
function showBrowserEntrance(){
 // MR tabs share the browser controls, but exiting must reveal the entry point.
 setPanelTab(4);$('panel').scrollTop=0;
}
function finishMR(){
 soundEngine?.setSpatialMode?.(/OculusBrowser/.test(navigator.userAgent)&&new URLSearchParams(location.search).get('spatial')!=='full'?'adaptive':'full');
 cancelMusicRequest();
 if(previewing&&!previewPaused){previewPaused=true;cancelFutureSounds();}
 entryTip.end();cancelPreparation();
 triggerEmbers.clear();manualBudget.reset();controls.end();cancelFutureSounds();if(bridgeView.active)leaveBridge();if(dioramaSaved)toggleDiorama();pendingDiorama=false;pendingPlace=false;pendingViewMode=null;pendingPanelOpen=false;pendingBridge=false;pendingRenameReturn=null;mrStarting=false;mrSession=null;latestViewerTransform=null;mrPanel.end();mrNameEditor?.close();favoritesPanel?.end();wristMenu.end();showInfo.end();betaReviewPanel.end();mrDimming.end();town.visible=true;
 if(running){if(showPlan?.music)time=music.pause();running=false;syncShowButtons();}
 $('status').textContent='鑑賞を終了して元のページへ戻りました。大会は一時停止しています。';
 applyViewBackground();town.scale.setScalar(Number($('scale').value));town.position.set(0,0,0);town.rotation.y=0;camera.position.copy(desktopCamera.position);camera.quaternion.copy(desktopCamera.quaternion);camera.fov=desktopCamera.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();previous=0;
 lastMRReport=mrReport();$('mr').disabled=false;$('mr').textContent='MRで観る';$('bridge').disabled=false;
 const rows=mrMetrics?.samples??[];$('mrInfo').textContent=rows.length?'鑑賞終了。'+rows.length+'区間を計測、花火の最大粒子数 '+mrMetrics.peakParticles.toLocaleString()+'点。計測結果を保存できます。':'鑑賞終了。計測できた区間はありません。';$('mrExport').disabled=!mrMetrics;
 showBrowserEntrance();
}
async function startXR(mode,bridge=false,panelPage=0,{renameReturn=null}={}){
 if(mrStarting||mrSession)return;mrStarting=true;$('mr').disabled=true;$('bridge').disabled=true;
 let session;
 try{
  ensureAudio();if(bridgeView.active)leaveBridge();if(dioramaSaved){toggleDiorama();pendingDiorama=true;}desktopCamera.position.copy(camera.position);desktopCamera.quaternion.copy(camera.quaternion);desktopCamera.fov=camera.fov;
  session=await navigator.xr.requestSession(mode,mrNameEditor.sessionOptions());
  session.addEventListener('end',finishMR,{once:true});
  session.addEventListener('visibilitychange',()=>{previous=0;mrMetrics?.breakWindow();if(session.visibilityState!=='visible'){pauseMusicForVisibility();triggerEmbers.clear();controls.release();controls.edges=new WeakMap();mrPanel.release();showInfo.release();betaReviewPanel.release();wristMenu.gesture.reset();}});
  await renderer.xr.setSession(session);soundEngine?.setSpatialMode?.(new URLSearchParams(location.search).get('spatial')==='full'?'full':'adaptive');mrSession=session;showInfo.reanchor();mrStarting=false;$('bridge').disabled=false;mrMetrics=new XRMetrics();
  mrMeta={build:BUILD_VERSION,sessionMode:mode,nameEditor:session.domOverlayState?.type??'browser-fallback',startedAt:new Date().toISOString(),environmentBlendMode:session.environmentBlendMode,userAgent:navigator.userAgent,measurement:'XR callback FPS and animation/UI update + render CPU time; not GPU/compositor FPS',initialSettings:mrSettings(),placements:[],viewChanges:[]};
  applyViewBackground();town.visible=false;pendingPlace=true;pendingBridge=bridge;pendingPanelOpen=true;pendingPanelPage=panelPage;pendingRenameReturn=renameReturn;previous=0;$('mrExport').disabled=false;
  // Enter the room with an unlit sky; only the explicit show button starts it.
  if(!bridge){const armed=favoriteRun?.armed?favoriteRun:null;if(armed)favoriteRun=null;stopShow();if(armed){favoriteRun=armed;favoritesUI?.setFestival('大会の準備完了 · '+armed.rows.length+'曲');}$('chapter').textContent='開演前 · 街を眺める';$('last').textContent='好きな位置に街を置いてください';$('status').textContent=panelPage===4?'曲はまだ始まりません。街を好きな位置へ置いてから、「'+$('musicShow').textContent+'」で開演してください。':'まずは街をじっくりどうぞ。台座へビームを合わせ、グリップで掴めます。サイドパネルの「花火大会を観る」で開演します。';}
 }catch(e){if(session)await session.end().catch(()=>{});if(pendingDiorama&&!dioramaSaved){pendingDiorama=false;toggleDiorama();}mrStarting=false;$('mr').disabled=false;$('bridge').disabled=false;$('status').textContent='鑑賞を開始できませんでした：'+e.name+'：'+e.message;}
}
$('mr').onclick=()=>startXR('immersive-ar');
$('bridge').onclick=()=>{
 if(mrStarting)return;
 if(bridgeView.active){if(bridgeView.mode==='bridge'){leaveBridge();return;}}
 if(mrSession){pendingViewMode='bridge';return;}
 if(vrSupported&&!panelPreview){startXR('immersive-vr',true);return;}
 // Desktop preview and browsers without immersive VR share the same bridge.
 ensureAudio();enterBridge();if(panelPreview)mrPanel.draw();
};
// Returning to departure resets only the cruise, preserving the current show.
function resetBoatCruise(start=true){
 boatSeconds=0;boatStarted=start;boatWaitingShown=null;
 riverNight.turnReservation=null;riverNight.turnEnvelope=null;riverNight.cruiseRate=1;riverNight.cruiseWaiting=false;
 bridgeView.boatWalk.set(0,0,0);viewBoatPose(0,boatPose);bridgeView.cruise(boatPose);riverNight.setViewingPose(boatPose);
 syncViewControls();
}
$('boatStart').onclick=()=>{
 if(mrStarting)return;
 resetBoatCruise();
 if(!bridgeView.active||bridgeView.mode!=='boat')$('boat').click();
 else{$('status').textContent='出航位置へ戻りました。永代橋を前に見ながら、もう一度出発します。';}
};
$('boat').onclick=()=>{if(mrStarting)return;if(bridgeView.active&&bridgeView.mode==='boat'){leaveBridge();return;}if(mrSession){pendingViewMode='boat';return;}if(vrSupported&&!panelPreview){startXR('immersive-vr','boat');return;}ensureAudio();enterBridge(null,'boat');};
syncViewControls();checkMR();if(new URLSearchParams(location.search).has('boatView'))$('boat').click();
const walkKeys=new Set();addEventListener('keydown',e=>{if(!/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName??''))walkKeys.add(e.code);});addEventListener('keyup',e=>walkKeys.delete(e.code));addEventListener('blur',()=>walkKeys.clear());
let previous=0;renderer.setAnimationLoop((stamp,frame)=>{
 const session=renderer.xr.getSession();const pose=frame?frame.getViewerPose(renderer.xr.getReferenceSpace()):null;
 const xrVisible=(!session||(session.visibilityState==='visible'&&pose!==null))&&!document.hidden;
 panelSurfaceTrial?.before(stamp,!!frame&&xrVisible&&!running&&!previewing&&mrPanel.visible);
 if(!xrVisible)pauseMusicForVisibility();
 if(pose)latestViewerTransform=pose.transform;
 if(pose&&pendingViewMode){const mode=pendingViewMode;pendingViewMode=null;enterBridge(pose.transform,mode);mrPanel.draw();}
 const dt=previous&&xrVisible?Math.min((stamp-previous)/1000,.05):0;previous=xrVisible?stamp:0;
 mrNameEditor?.sync();if(xrVisible)advanceFavoriteInterval(dt);
 if(pendingPlace&&pose){
  showInfo.reanchor();
  const placement=placementFromPose(pose.transform,Number($('distance').value),Number($('height').value),town.rotation.y,-groundBottomY*town.scale.y);
  town.position.set(placement.x,placement.y,placement.z);town.rotation.y=placement.yaw;town.visible=true;pendingPlace=false;
  mrMeta?.placements.push({showTime:time,...mrSettings(),eyeHeight:placement.eyeHeight});
  if(pendingDiorama){pendingDiorama=false;toggleDiorama();}if(pendingBridge){enterBridge(pose.transform,pendingBridge===true?'bridge':pendingBridge);pendingBridge=false;}
 }
 if(pendingPanelOpen&&pose){
  mrPanel.begin(pose.transform);setPanelTab(pendingPanelPage);controls.begin(pose.transform);
  const returning=pendingRenameReturn;pendingRenameReturn=null;
  if(returning){restoreRenamePanels(returning,pose.transform);entryTip.end();}
  else if(mrMeta?.sessionMode==='immersive-ar'&&!bridgeView.active)entryTip.begin(pose.transform,stamp);
  pendingPanelOpen=false;
 }
 // Once boarded, the boat keeps cruising through view changes. A user pause still holds it.
 const boatPaused=(previewing&&previewPaused)||!!showPlan&&!running&&!showCompleted;
 if(xrVisible)boatSeconds=riverNight.advanceCruise(boatSeconds,dt,boatStarted&&!boatPaused);
 viewBoatPose(boatSeconds,boatPose);bridgeView.cruise(boatPose);riverNight.setViewingPose(boatPose);
 if(bridgeView.active&&bridgeView.mode==='boat'){if(boatWaitingShown!==riverNight.cruiseWaiting){boatWaitingShown=riverNight.cruiseWaiting;$('viewHint').textContent=boatWaitingShown?'ほかの船が通るのを待っています。空いたら、ゆっくり進みます。':'永代橋と清澄橋をくぐる屋形船。デッキ内は自分の足／左スティックで移動。MacはWASD。';}}else boatWaitingShown=null;
 entryTip.update(stamp,(!!session||panelPreview&&new URLSearchParams(location.search).get('entryTipPreview')==='1')&&xrVisible&&!bridgeView.active);
 $('cometTime').textContent=previewing?'試し打ち '+time.toFixed(1)+'秒'+(previewPaused?' · 一時停止':''):cometCompleted?'試し打ちが終了しました':showPlan?.music?'曲つき演出':'開演前';
 $('cometPause').textContent=previewPaused?'試し打ちを再開':'試し打ちを一時停止';$('cometPause').disabled=!previewing;
 const updateStart=performance.now();
 manualBudget.observe(stamp,!!frame&&xrVisible&&(running||(previewing&&!previewPaused)));
 if((running||(previewing&&!previewPaused))&&xrVisible)advance(dt*(previewing&&$('creativeCard')&&!$('creativeCard').hidden?Number($('creativeSpeed').value):previewing&&$('toraSceneCard')&&!$('toraSceneCard').hidden?Number($('toraSceneSpeed').value):previewing&&$('rainEarCard')&&!$('rainEarCard').hidden?Number($('rainEarSpeed').value):$('longStarCard')&&!$('longStarCard').hidden?Number($('longStarSpeed').value):$('candyCard')?Number($('candySpeed').value):1));
 if(candyPeakAt!==null&&running&&time>=candyPeakAt){candyPeakAt=null;time=music.pause();running=false;cancelFutureSounds();syncShowButtons();$('status').textContent=candyPeakLabel+'「再開」で続きも観られます。';}
 if($('candyCard')&&candyFreezeAt!==null&&$('candyFreeze').checked&&time>=candyFreezeAt){previewPaused=true;candyFreezeAt=null;cancelFutureSounds();$('candyPause').textContent='再開';}
 if($('toraSceneCard')&&!$('toraSceneCard').hidden){$('toraSceneClock').textContent='打ち上げから '+(time/Number($('toraSceneSpeed').value||1)).toFixed(2)+'秒'+(previewPaused?' · 一時停止':'');if(previewing)$('toraSceneSeek').value=String(Math.min(toraSceneLength,time)/Number($('toraSceneSpeed').value||1));}
 if($('rainEarCard')&&!$('rainEarCard').hidden){const age=time-rainEarFirst;$('rainEarClock').textContent=!previewing?'穂の風景を選んで再生':age<0?'打ち上げ中':'最初の開花から '+Math.max(0,age).toFixed(2)+'秒'+(previewPaused?' · 一時停止':'');if(previewing&&age>=0)$('rainEarSeek').value=String(Math.min(rainEarLength,age));$('rainEarStage').hidden=!rainEarStages.length;if(rainEarStages.length){let stage=rainEarStages[0];for(const s of rainEarStages)if(s.opening<=time)stage=s;$('rainEarStage').textContent=(stage.wave+1)+' / '+rainEarStages.length+' · '+stage.label;}}
 if($('longStarCard')&&!$('longStarCard').hidden){const f=fireworks.find(f=>f.kind===($('longStarCard').dataset.kind||'longstar')),age=f?time-f.start-f.ascent:null;$('longStarClock').textContent=age===null?'次の一玉を待つ':age<0?'打ち上げ中':'開花から '+age.toFixed(2)+'秒'+(previewPaused?' · 一時停止':'');if(f&&age>=0&&!longStarScrubbing)$('longStarSeek').value=String(Math.min(f.spec.life,age));}
 if($('creativeCard')&&!$('creativeCard').hidden&&previewing){const f=fireworks.find(f=>isCreativeShell(f.kind));const age=f?time-f.start-f.ascent:null;$('creativeClock').textContent=age===null?'余韻が消えました':age<0?'打ち上げ中':'開花から '+age.toFixed(2)+'秒'+(previewPaused?' · 一時停止':'');if(age!==null&&age>=0)$('creativeSeek').value=String(age);}
 if($('candyCard'))$('candyClock').textContent='経過 '+time.toFixed(1)+'秒'+(previewPaused?' · 一時停止':'');
 if(!renderer.xr.isPresenting){const lookYaw=yaw-(bridgeView.active&&bridgeView.mode==='boat'?boatPose.angle:0);const target=bridgeView.active?new T.Vector3(Math.sin(lookYaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(lookYaw)*Math.cos(pitch)).add(camera.position):new T.Vector3(Math.sin(yaw)*(dioramaSaved?.25:1.2),(dioramaSaved?.88:new URLSearchParams(location.search).has('rainMusicTrial')?1.15:$('toraSceneCard')&&!$('toraSceneCard').hidden?.70:$('rainEarCard')&&!$('rainEarCard').hidden?((rainEarMode.endsWith('-field')||['sea-sunset-base','paddy-base'].includes(rainEarMode))?1.1:.70):(($('creativeCard')&&!$('creativeCard').hidden)||new URLSearchParams(location.search).has('largeStarTrial')||new URLSearchParams(location.search).has('sparkleTrial'))?1.04:.55)+pitch,0);camera.lookAt(target);}
 if(!session&&bridgeView.active)bridgeView.move((walkKeys.has('KeyD')?1:0)-(walkKeys.has('KeyA')?1:0),(walkKeys.has('KeyS')?1:0)-(walkKeys.has('KeyW')?1:0),dt);bridgeView.listener(audio,pose?.transform);
 if(xrVisible&&!running&&(!previewing||previewPaused))triggerEmbers.draw();if(xrVisible){towerLighting.update(dt);riverNight.reflections.material.uniforms.uDetail.value=bridgeView.active&&bridgeView.mode==='boat'?2.5:1;riverNight.update(stamp/1000);rooftopCranes.update(stamp/1000);}updateRoofLights(stamp/1000);updateReflections();if(frame&&xrVisible){favoritesPanel?.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform);mrPanel.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform);}else if(panelPreview){favoritesPanel?.update(stamp,null,null,null);mrPanel.update(stamp,null,null,null);}if(frame&&xrVisible)wristMenu.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform,{drawHands:bridgeView.active||mrMeta?.sessionMode==='immersive-vr',busy:controls.grabs.size>0||!!mrPanel.sliderDrag||!!betaReviewPanel.sliderDrag||!!mrPanel.childView});showInfo.update({time,running,previewing,fireworks},pose?.transform,!!session,xrVisible);betaReviewPanel.update({active:betaTCEnabled,names:betaTCEnabled?showInfoText({time,running,previewing,fireworks}).names:'',canPlay:!pendingAutomaticTrack&&!selectionProblem,canPrevious:!!favoriteRun&&favoriteRun.index>0,canNext:!!favoriteRun?.hasNext,musicActive:!!showPlan?.music,current:betaClock(showPlan?.music?(betaDragging?Number($('betaMusicSeek').value):Math.min(time,MUSIC_PLAN.duration)):time),seek:showPlan?.music?(betaDragging?Number($('betaMusicSeek').value):Math.min(time,MUSIC_PLAN.duration))/MUSIC_PLAN.duration:0,duration:showPlan?.music?betaClock(MUSIC_PLAN.duration):'',tail:showPlan?.music&&time>MUSIC_PLAN.duration?'余韻＋'+(time-MUSIC_PLAN.duration).toFixed(1)+'秒':'',running,busy:musicBusy},pose?.transform,!!session,xrVisible);if(xrVisible){betaReviewPanel.drag(stamp,frame,renderer.xr.getReferenceSpace());betaReviewPanel.touch(stamp,frame,renderer.xr.getReferenceSpace(),controls.grabs.size>0||!!mrPanel.sliderDrag);}else {betaReviewPanel.release();favoritesPanel?.release();}if(xrVisible)showInfo.drag(stamp,frame,renderer.xr.getReferenceSpace());else showInfo.release();if(frame)controls.update(dt,xrVisible?frame:null,renderer.xr.getReferenceSpace(),xrVisible?pose?.transform:null);const renderStart=performance.now();if(($('toraSceneCard')&&!$('toraSceneCard').hidden||$('rainEarCard')&&!$('rainEarCard').hidden||$('candyCard')||new URLSearchParams(location.search).has('rainMusicTrial')||new URLSearchParams(location.search).has('candyShow')||($('creativeCard')&&!$('creativeCard').hidden)||(new URLSearchParams(location.search).has('largeStarTrial')||new URLSearchParams(location.search).has('sparkleTrial')))&&!session){const width=Math.max(240,innerWidth-370);renderer.setViewport(0,0,width,innerHeight);camera.aspect=width/innerHeight;camera.updateProjectionMatrix();}renderer.render(scene,camera);
 panelSurfaceTrial?.after({updateMs:renderStart-updateStart,renderMs:performance.now()-renderStart,calls:renderer.info.render.calls});
 if(frame&&mrMetrics&&xrVisible){
  const row=mrMetrics.record(stamp,{particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0)+(comets.points??0),calls:renderer.info.render.calls,renderMs:performance.now()-renderStart,updateMs:renderStart-updateStart,showTime:time,frameRate:session.frameRate});
  if(row)$('mrInfo').textContent='MR計測：'+row.fps+'fps ／ p95 '+row.p95FrameMs+'ms ／ 花火 '+row.particles.toLocaleString()+'点';
 }else if(frame&&mrMetrics)mrMetrics.breakWindow();
 if(questDiagnostics.enabled)questDiagnostics.record(stamp,{showTime:Number(time.toFixed(3)),running,xr:!!session,view:bridgeView.active?bridgeView.mode:dioramaSaved?'diorama':'miniature',updateCpuMs:renderStart-updateStart,renderCpuMs:performance.now()-renderStart,particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),groundPoints:comets.points??0,audioState:audio?.state,spatial:soundEngine?.spatialStats,sidebarVisible:mrPanel.visible,sidebarReadable:mrPanel.isReadable(),tcEnabled:betaTCEnabled,tcVisible:betaReviewPanel.mesh.visible,tcMusicActive:betaReviewPanel.state?.musicActive});
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.__hanabi={get panelState(){return{page:mrPanel.page,adjusting:!!mrPanel.adjusting,modal:!!mrPanel.childView,parentVisible:!!mrPanel.parentSurface?.visible,scale:mrPanel.mesh.scale.toArray(),position:mrPanel.mesh.position.toArray(),parentPosition:mrPanel.parentSurface?.position.toArray(),controls:mrPanel.controls.map(({id,x,y,w,h})=>({id,x,y,w,h})),matrix:mrPanel.mesh.matrixWorld.toArray(),cameraMatrix:camera.matrixWorld.toArray(),cameraProjection:camera.projectionMatrix.toArray()};},beginFlowerStudy,get flowerStudy(){return flowerStudy;},get flowerGeometry(){return {shells:fireworks.map(f=>({kind:f.kind,size:f.size,life:f.spec.life,points:f.n*f.trailCount,x:f.x,y:f.y,z:f.z,r:f.r,ascent:f.ascent,ignitionDelay:f.ignitionDelay,ascentOffset:f.ascentOffset,shape:f.shape,flowerVariation:f.flowerVariation,flowerStars:f.flowerStars,creativeStars:f.creativeStars,directions:f.directions.map(d=>[d.x,d.y,d.z]),opening:f.start+f.ascent,colors:f.starColors.map(c=>c.getHex())})),large:comets.active.map(s=>({x:s.x,z:s.z,start:s.start,burn:s.burn,character:s.character,vx:s.vx,vy:s.vy,drag:s.drag,gravity:s.gravity,end:s.end})),small:comets.bundles.active.map(s=>({x:s.x,z:s.z,start:s.start,count:s.stars.length,character:s.character,end:s.end,stars:s.stars.map(st=>({x:st.x,y:st.y,vx:st.vx,vy:st.vy,vz:st.vz,drag:st.drag,gravity:st.gravity,at:st.at,life:st.life,stopAt:st.stopAt,summitTarget:st.summitTarget}))}))};},riverNight,towerLighting,get state(){return{running,previewing,time,active:fireworks.length,viewMode:bridgeView.active?bridgeView.mode:'miniature',buildings:town.children.length,xr:renderer.xr.isPresenting,queued:burstQueue.length,fans:comets.groups,groundPoints:comets.points??0,particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),shots:fireworks.map(f=>({kind:f.kind,size:f.size,layers:f.spec.radii.length,radius:f.r,ascent:f.ascent})),geometries:renderer.info.memory.geometries};},get mrReport(){return mrReport();},launch,advance,clearFireworks,restart};

$('build').textContent=BUILD_VERSION;
$('cometPattern').onchange();
$('programInfo').textContent=PROGRAM_NAMES[$('program').value];
function syncMusicMix(){
 const value=Number($('musicVolume').value);$('musicVolumeValue').textContent=Math.round(value*100)+'％';
 for(const [id,amount] of [['musicMixFireworks',.20],['musicMixDefault',.35],['musicMixMusic',.55]])$(id).setAttribute('aria-pressed',String(Math.abs(value-amount)<.001));
}
function setMusicMix(amount){
 $('musicVolume').value=String(amount);$('musicVolume').dispatchEvent(new Event('input'));$('musicVolume').dispatchEvent(new Event('change'));mrPanel.draw();
}
$('musicMixFireworks').onclick=()=>setMusicMix(.20);
$('musicMixDefault').onclick=()=>setMusicMix(.35);
$('musicMixMusic').onclick=()=>setMusicMix(.55);
$('musicVolume').oninput=()=>{music.setVolume(Number($('musicVolume').value));syncMusicMix();};
music.setVolume(Number($('musicVolume').value));syncMusicMix();
$('musicState').textContent=selectedMusic.description;
function showSelectionError(chosen){
 pendingAutomaticTrack=null;selectionProblem={id:chosen.id,title:chosen.title};musicBusy=false;
 $('showNotice').textContent=chosen.title+'を準備できませんでした：'+$('autoMusicStatus').textContent+' 別の曲を選ぶか、再解析を試してください。';
 showPreparation.fail($('autoMusicStatus').textContent);
 syncMusicChoices();syncShowButtons();mrPanel.draw();
}
async function chooseMusicTrack(id,feeling=null){
 if(autoMusicUI.busy||musicBusy)return;
 analysisFeedback=null;$('analysisFeedback').hidden=true;clearTimeout(analysisReturnTimer);analysisReturnTimer=null;
 const request=++selectionRequest;selectionProblem=null;
 if(id==='none'){
  autoMusicUI.cancel();pendingAutomaticTrack=null;stopShow();noMusicMode=true;$('showNotice').textContent='';
  localStorage.setItem('hanabi83-selected','none');prepareProgram();syncMusicChoices();syncShowButtons();mrPanel.draw();return;
 }
 const chosen=playableMusicChoices(generatedMusic).find(item=>item.id===id);if(!chosen)return;
 autoMusicUI.cancel();stopShow();pendingAutomaticTrack=chosen;$('showNotice').textContent=chosen.title+'を準備中…';showPreparation.begin({title:chosen.title,setting:'この曲の設定を確認しています'});syncMusicChoices();syncShowButtons();mrPanel.draw();
 try{
  if(feeling)await saveTrackFeeling(id,feeling);
  const original=MUSIC_SHOWS.some(t=>t.id===id),pref=await readTrackFeeling(id),mode=feeling??pref?.feeling??(original?'original':'auto');
  if(request!==selectionRequest||pendingAutomaticTrack?.id!==id)return;
  const result=mode==='original'&&original?await autoMusicUI.generateOriginalTrack(id):await autoMusicUI.generateTrack(id,mode);
  if(request!==selectionRequest||pendingAutomaticTrack?.id!==id)return;
  if(!result)showSelectionError(chosen);
 }catch(error){$('autoMusicStatus').textContent=error.message;showSelectionError(chosen);}
}
$('musicTrack').onchange=()=>{$('trackMenu').hidden=true;$('trackMenuToggle').setAttribute('aria-expanded','false');if(!libraryRestoring)return chooseMusicTrack($('musicTrack').value);};

$('musicScenePlay').onclick=()=>beginMusicExcerpt(Number($('musicScene').value),'選んだ場面の少し前から観ます。');
$('musicOffset').oninput=()=>{$('musicOffsetValue').textContent=$('musicOffset').value+' ms（次の開演から）';};
$('musicClick').onchange=()=>music.clickEnabled=$('musicClick').checked;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMusicForVisibility();});

async function beginMusicExcerpt(start,label){
 if(pendingAutomaticTrack)return; clearMusicSequence();if(musicBusy)cancelMusicRequest();
 if(!music.loaded){await beginMusicShow();if(!showPlan?.music)return;}
 cancelMusicRequest();music.stop();clearFireworks();clearFans();fanQueue=[];previewing=false;time=Math.max(0,start);prepareMusicProgram();
 burstQueue=burstQueue.filter(s=>s.at>=time-.02);fanQueue=fanQueue.filter(s=>s.at>=time-.02);ensureAudio();music.play(audio,time,soundEngine?.mixInput);running=true;syncShowButtons();$('status').textContent=label;
}


function syncBetaReview(){
 const active=!!showPlan?.music;
 $('betaReviewBar').hidden=!betaTCEnabled||!!renderer.xr.getSession();
 const value=betaDragging?Number($('betaMusicSeek').value):active?time:0;
 const current=betaClock(active?Math.min(value,MUSIC_PLAN.duration):time),total=active?' / '+betaClock(MUSIC_PLAN.duration):'',tail=value>MUSIC_PLAN.duration?'余韻＋'+(value-MUSIC_PLAN.duration).toFixed(1)+'秒':'';
 for(const [id,text] of [['betaCurrentTime',current],['betaPanelCurrent',current],['betaTotalTime',total],['betaPanelTotal',total],['betaTailTime',tail],['betaPanelTail',tail]])$(id).textContent=text;
 $('betaMusicSeek').max=String(MUSIC_PLAN.duration);if(!betaDragging)$('betaMusicSeek').value=String(Math.min(value,MUSIC_PLAN.duration));
 $('betaMusicSeek').setAttribute('aria-valuetext',betaClock(value));$('betaMusicSeek').disabled=musicBusy||!active;
 if(betaTCEnabled)$('betaShellNames').textContent=showInfoText({time,running,previewing,fireworks}).names;
 $('betaPreviousTrack').disabled=musicBusy||!favoriteRun||favoriteRun.index===0;$('betaNextTrack').disabled=musicBusy||!favoriteRun?.hasNext;
 for(const id of ['betaBack10','betaBack5','betaForward5','betaFloatBack10','betaFloatBack5','betaFloatForward5','betaFloatForward10'])$(id).disabled=musicBusy||!active;
 $('betaFloatPause').disabled=musicBusy||!!pendingAutomaticTrack||!!selectionProblem;
 $('betaFloatPause').textContent=running?'一時停止':showCompleted?'最初から再生':'再開';
}
async function seekBetaMusic(target,resume=running){
 if(favoriteRun&&['gap','loading','switch'].includes(favoriteRun.phase))return;
 if(selectionProblem||pendingAutomaticTrack||musicBusy)return; const value=Math.max(0,Math.min(MUSIC_PLAN.duration,Number(target)||0));
 betaDragging=false;const transport=music,request=++musicRequest;
 clearMusicSequence({keepFavorite:true});music.pause();running=false;cancelFutureSounds();musicBusy=true;syncShowButtons();
 try{await transport.load();}catch(e){if(request!==musicRequest)return;musicBusy=false;transport.ready=null;syncShowButtons();$('status').textContent='曲を読み込めませんでした。もう一度お試しください。';return;}
 if(request!==musicRequest||music!==transport)return;
 musicBusy=false;music.stop();clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();previewing=false;previewPaused=false;
 // Thirty seconds includes the longest existing ascent, flower and ground sequence.
 time=Math.max(0,value-30);prepareMusicProgram();burstQueue=burstQueue.filter(q=>q.at>=time-1e-8);fanQueue=fanQueue.filter(q=>q.at>=time-1e-8);music.offset=time;
 groundStudySilent=true;betaRebuilding=true;
 try{while(time<value-1e-8){music.offset=Math.min(value,time+.025);advanceMusic(.025);}time=value;music.offset=value;updateFireworks();}
 finally{groundStudySilent=false;betaRebuilding=false;}
 cancelFutureSounds();updateMusicFxQuiet();musicLastUI=-1;
 if(resume&&!document.hidden){ensureAudio();music.play(audio,value,soundEngine?.mixInput);running=true;}else running=false;
 syncShowButtons();drawMusicTimeline();mrPanel.draw();$('status').textContent=betaClock(value)+'へ移動しました。'+(running?'音楽と花火を再生中。':'この場面で一時停止。');
}
function betaPreviewSeek(){
 if(!betaDragging){betaDragging=true;betaResumeAfterDrag=running;if(showPlan?.music&&running){time=music.pause();running=false;cancelFutureSounds();}}
 syncBetaReview();
}
$('betaMusicSeek').oninput=betaPreviewSeek;
$('betaMusicSeek').onchange=()=>{const resume=betaDragging?betaResumeAfterDrag:running;return seekBetaMusic(Number($('betaMusicSeek').value),resume);};
$('betaMusicSeek').addEventListener('pointercancel',()=>{const resume=betaResumeAfterDrag;betaDragging=false;syncBetaReview();if(resume&&!document.hidden&&showPlan?.music&&!running)toggle();});
for(const [id,offset] of [['betaBack10',-10],['betaBack5',-5],['betaForward5',5],['betaFloatBack10',-10],['betaFloatBack5',-5],['betaFloatForward5',5],['betaFloatForward10',10]])$(id).onclick=()=>seekBetaMusic(Math.min(music.currentTime,MUSIC_PLAN.duration)+offset,running);
$('betaFloatPause').onclick=()=>{if(showCompleted||!showPlan)$('showWatch').click();else toggle();};
$('betaPreviousTrack').onclick=()=>jumpFavoriteTrack(-1);$('betaNextTrack').onclick=()=>jumpFavoriteTrack(1);
function toggleBetaTC(){betaTCEnabled=!betaTCEnabled;if(betaTCEnabled)betaReviewPanel.reanchor();else{betaReviewPanel.end();for(const [controller,grab] of controls.grabs)if(grab.panel===betaReviewPanel)controls.release(controller);}$('betaToggleTC').textContent=betaTCEnabled?'TC・玉名を隠す':'TC・玉名を表示';$('showTC').textContent=$('betaToggleTC').textContent;syncBetaReview();wristMenu.draw();mrPanel.draw();}
$('betaToggleTC').onclick=toggleBetaTC;$('betaCloseTC').onclick=()=>{if(betaTCEnabled)toggleBetaTC();};

async function beginRainMusicSnapshot(target){if(selectedMusic.id==='mou-ichido-dake')await seekBetaMusic(target,false);}
$('rainMusicFirstPeak').onclick=()=>beginRainMusicSnapshot(57.9);
$('rainMusicPeak').onclick=()=>beginRainMusicSnapshot(196.25);
$('rainMusicFinalSnapshot').onclick=()=>beginRainMusicSnapshot(238);
function beginMusicFinale(){return beginMusicExcerpt(MUSIC_PLAN.finalPreviewStart??MUSIC_PLAN.duration-12,selectedMusic.id==='mou-ichido-dake'?'静かなピアノから、最後の水色二尺を一輪観ます。':'曲が収まる前の大輪と、花火の音だけの余韻を観ます。');}
function musicMiddleStart(){return MUSIC_PLAN.middlePreviewStart??MUSIC_PLAN.pyramidAt-5;}
function beginMusicPyramid(){return beginMusicExcerpt(musicMiddleStart(),'中盤から観ます。');}
function pauseMusicForVisibility(){
 if(musicBusy){clearMusicSequence();cancelMusicRequest();}
 if(previewing&&!previewPaused){previewPaused=true;cancelFutureSounds();triggerEmbers.clear();$('status').textContent='鑑賞を離れたので、試し打ちを一時停止しました。「試し打ちを再開」で戻れます。';}
 if(running&&showPlan?.music){time=music.pause();running=false;cancelFutureSounds();triggerEmbers.clear();syncShowButtons();$('status').textContent='鑑賞を離れたので、曲と花火を一時停止しました。';}
}
// A scheduled duration is a lower bound. User-launched shells may outlive the programme.
function musicCanFinish(){return time>=MUSIC_PLAN.showDuration&&!soundEngine?.openingCodaActive&&!fireworks.length&&!triggerEmbers.count&&!comets.groups&&!burstQueue.length&&!fanQueue.length;}
function advanceMusic(dt){
 time=music.currentTime;updateMusicFxQuiet();
 advanceEmbers(dt);updateFireworkEvents();
 while(burstQueue.length&&burstQueue[0].at<=time){
  const s=burstQueue.shift();
  // A lost render interval must not release a backlog of obsolete shells.
  if(time-s.at>.35){musicLog.push({skipped:true,scheduled:s.at,actual:time});continue;}
  if(!launch(s.kind,s.size,s.position))musicLog.push({skipped:true,capacity:true,scheduled:s.at,actual:time});
 }
 updateFans();if(!betaRebuilding)updateFireworks();music.updateClicks(MUSIC_PLAN.beats);
 if(Math.floor(time*8)!==musicLastUI){musicLastUI=Math.floor(time*8);drawMusicTimeline();}
 const section=MUSIC_PLAN.sections.filter(s=>s.at<=time).at(-1);
 $('chapter').textContent=(section?.label??selectedMusic.title)+' · '+Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');
 if(time>=MUSIC_PLAN.duration&&!musicCanFinish())$('status').textContent='曲が終わりました。残る光と花火の音の余韻をお楽しみください。';
 if(musicCanFinish()){
  music.pause();cancelFutureSounds();
  if(favoriteRun?.finishTail()){running=false;showCompleted=true;syncShowButtons();favoritesUI?.setFestival('余韻のあと · 次の曲まで３秒');return;}
  if(advanceMusicSequence())return;
  const favoriteCount=favoriteRun?.rows.length??0;if(favoriteRun){favoriteRun.phase='completed';favoritesUI?.setFestival('大会が終わりました · '+favoriteCount+'曲');}const allFinished=!!musicSequence;showCompleted=true;running=false;musicSequence=null;
  if(allFinished)$('musicSequenceState').textContent='４曲の連続鑑賞が終わりました。';
  drawMusicTimeline();syncShowButtons();mrPanel.draw();$('status').textContent=(favoriteCount?favoriteCount+'曲のお気に入り大会が終わりました。':allFinished?'４曲の花火大会が終わりました。':'花火の余韻とともに、大会が終わりました。')+(bridgeView.active&&bridgeView.mode==='boat'?'屋形船は周回を続けます。':'');
 }
}
function drawMusicTimeline(){
 const c=$('musicTimeline'),g=c.getContext('2d'),w=c.width,h=c.height;g.clearRect(0,0,w,h);
 g.fillStyle='#354c60';g.fillRect(0,0,w,h);g.fillStyle='#e8c987';g.fillRect(0,0,Math.min(1,time/MUSIC_PLAN.duration)*w,h);
 syncBetaReview();
 $('musicTime').textContent=time<=MUSIC_PLAN.duration?time.toFixed(1)+' / '+MUSIC_PLAN.duration.toFixed(1)+'秒':'曲終わり · 花火の余韻 '+(time-MUSIC_PLAN.duration).toFixed(1)+'秒';
}
drawMusicTimeline();

function cancelAutomaticPreparation(){
 if(!pendingAutomaticTrack)return;selectionRequest++;
 autoMusicUI.cancel();pendingAutomaticTrack=null;$('musicTrack').value=selectedMusic.id;syncShowButtons();mrPanel.draw();
}
function installOriginalMusic({trackId,buffer}){
 const original=MUSIC_SHOWS.find(t=>t.id===trackId);if(!original)return;
 stopShow();pendingAutomaticTrack=null;selectionProblem=null;noMusicMode=false;
 const transport=new MusicTransport('',{autoload:false});transport.buffer=buffer;transport.ready=Promise.resolve(transport);
 selectMusic({...original,title:musicTrackTitle(trackId,original.title),original:true,autoGenerated:false},transport);$('autoMusicSample').value=trackId;
 syncMusicChoices();markShowReady(MUSIC_PLAN);syncShowButtons();$('showNotice').textContent=original.title+' · 手作りの構成を準備しました。';drawMusicTimeline();mrPanel.draw();
}
function installAutoMusic({plan,buffer,title,manualId,trackId=null}){
 stopShow();
 const transport=new MusicTransport('',{autoload:false});transport.buffer=buffer;transport.ready=Promise.resolve(transport);
 pendingAutomaticTrack=null;selectionProblem=null;noMusicMode=false;
 generatedMusic={id:trackId??'local-auto-music',title,variation:plan.analysisSummary.variation,description:'曲調：'+plan.feelingLabel+' · 推定 '+plan.tempoEstimate.toFixed(1)+' BPM。保存した解析から自動構成。',plan,src:'',autoGenerated:true,transport,manualId};
 syncMusicChoices();
 selectMusic(generatedMusic,transport);$('autoMusicFeeling').value=plan.feeling??'auto';$('autoMusicEars').value=plan.earScene??'auto';$('showNotice').textContent='';syncMusicChoices();markShowReady(plan);syncShowButtons();drawMusicTimeline();mrPanel.draw();
}
function updateAutomaticPreparation(state){
 // This local-only trial sends stage labels, never audio, to the USB test server.
 if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('analysisDebug')==='1'){
  const status=state.title?state.status.replace(state.title,'選んだ曲'):state.status;
  const key=JSON.stringify([state.busy,!!state.error,status]);
  if(updateAutomaticPreparation.lastReport!==key){updateAutomaticPreparation.lastReport=key;void fetch('/study/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'import-stage',build:'1.2.83',device:/OculusBrowser|Quest/.test(navigator.userAgent)?'quest':'browser',busy:state.busy,error:!!state.error,status,at:new Date().toISOString()})}).catch(()=>{});}
 }

 if(state.busy)showPreparation.begin({title:state.title||pendingAutomaticTrack?.title||selectedMusic.title,setting:state.status});
 else if(state.error)showPreparation.fail(state.status);
 if(state.operation==='analysis'){
  const started=state.busy&&!analysisFeedback?.busy;
  if(started){clearTimeout(analysisReturnTimer);analysisReturnTimer=null;analysisChime.unlock();}
  const justCompleted=analysisFeedback?.busy&&!state.busy&&!state.error&&state.progress===1;
  if(state.busy)analysisFeedback={inChild:started?mrPanel.active&&mrPanel.adjusting:!!analysisFeedback?.inChild,busy:true,phase:'busy',title:state.title,status:state.status,progress:state.progress};
  else if(analysisFeedback?.busy)analysisFeedback={inChild:!!analysisFeedback?.inChild,busy:false,phase:state.error?'error':state.progress===1?'complete':'cancelled',title:state.title,status:state.status,progress:state.progress};
  if(justCompleted)analysisChime.play();
  const feedback=$('analysisFeedback');feedback.hidden=!analysisFeedback;
  if(analysisFeedback){$('analysisHeading').textContent=analysisFeedback.phase==='busy'?'曲を解析中…':analysisFeedback.phase==='complete'?'✓ 解析が終わりました':analysisFeedback.phase==='error'?'解析できませんでした':'解析を中止しました';}
  if(analysisFeedback?.phase==='complete'&&analysisFeedback.inChild&&!analysisReturnTimer){analysisReturnTimer=setTimeout(()=>{analysisReturnTimer=null;if(analysisFeedback?.phase==='complete'&&analysisFeedback.inChild&&mrPanel.page===4&&mrPanel.adjusting){analysisFeedback.inChild=false;mrPanel.navigate(4);}},1800);}
  if(started){$('showImport').open=true;requestAnimationFrame(()=>feedback.scrollIntoView({block:'nearest'}));}
 }
 if(state.error)$('showNotice').textContent=state.status;
 musicBusy=state.busy;$('musicReanalyze').disabled=state.busy;$('musicTrack').disabled=state.busy;syncShowButtons();
 if(!pendingAutomaticTrack){if(state.busy||state.error)$('musicState').textContent=state.status;mrPanel.draw();return;}
 $('musicState').textContent=state.status;syncShowButtons();mrPanel.draw();

}
$('autoMusicFile').addEventListener('click',()=>analysisChime.unlock());
for(const id of ['showRebuild','autoMusicRebuild'])$(id).addEventListener('click',()=>analysisChime.unlock(),true);
const autoMusicUI=mountAutoMusic({catalog:MUSIC_CATALOG,onRebuilt:()=>analysisChime.play(),onCatalog:tracks=>{setLocalMusicCatalog(tracks);syncMusicChoices();},onReady:installAutoMusic,onOriginalReady:installOriginalMusic,onState:updateAutomaticPreparation,onRoom:async result=>{
 if(mrStarting||mrSession||$('mr').disabled)return;
 installAutoMusic(result);setPanelTab(4);await startXR('immersive-ar',false,4);
},onBegin:()=>stopShow(),onPreview:at=>seekBetaMusic(at,true),onManual:id=>{
 const chosen=MUSIC_SHOWS.find(item=>item.id===id);if(!chosen)return;stopShow();selectMusic(chosen);syncShowButtons();drawMusicTimeline();return beginMusicShow();
}});
const autoEarsChange=$('autoMusicEars').onchange;
$('autoMusicEars').onchange=async()=>{
 if(autoMusicUI.busy||musicBusy||directingBusy)return;
 localStorage.setItem('hanabi83-ear-scene',$('autoMusicEars').value);
 if(!selectedMusic.savedFavoriteId&&!selectedMusic.original&&autoMusicUI.result?.trackId===selectedMusic.id){autoEarsChange();mrPanel.draw();return;}
 if(!noMusicMode)await chooseMusicTrack(selectedMusic.id,MUSIC_PLAN.feeling??'auto');
};
const autoFeelingChange=$('autoMusicFeeling').onchange;
$('autoMusicFeeling').onchange=async()=>{
 if(autoMusicUI.busy||musicBusy||directingBusy)return;
 const id=selectionProblem?.id??selectedMusic.id,value=$('autoMusicFeeling').value;
 if(!selectedMusic.savedFavoriteId&&!selectedMusic.original&&!selectionProblem&&value!=='original'&&autoMusicUI.result?.trackId===id){
  const request=++selectionRequest;
  directingBusy=true;showPreparation.begin({title:selectedMusic.title,setting:musicFeelingLabel()});syncShowButtons();mrPanel.draw();
  // Paint the pending state before synchronous local directing, then commit.
  await new Promise(resolve=>setTimeout(resolve,35));
  try{if(request===selectionRequest&&autoFeelingChange()===false)showSelectionError({id,title:selectedMusic.title});}
  catch(error){$('autoMusicStatus').textContent=error.message;showSelectionError({id,title:selectedMusic.title});}
  finally{directingBusy=false;$('autoMusicFeeling').disabled=autoMusicUI.busy;syncShowButtons();mrPanel.draw();}
  return;
 }
 await chooseMusicTrack(id,value);
};

$('autoMusicCancel').addEventListener('click',()=>{selectionRequest++;pendingAutomaticTrack=null;selectionProblem=null;musicBusy=false;$('showNotice').textContent='準備を中止しました。';if(selectedMusic.autoGenerated)$('autoMusicFeeling').value=MUSIC_PLAN.feeling??'auto';showPreparation.restore();syncMusicChoices();syncShowButtons();mrPanel.draw();});
$('showWatch').onclick=async()=>{if(selectionProblem)return;if(showCompleted&&favoritesUI.state.activeSetlistId){if(await favoritesUI.loadSetlist(favoritesUI.state.activeSetlistId)&&!running)await beginMusicShow();return;}$(noMusicMode?'play':'musicShow').click();};
$('showStop').onclick=()=>{cancelAutomaticPreparation();stopShow();};
$('showRestart').onclick=async()=>{if(selectionProblem)return;if(favoritesUI.state.activeSetlistId){if(await favoritesUI.loadSetlist(favoritesUI.state.activeSetlistId)&&!running)await beginMusicShow();return;}$(noMusicMode?'restart':'musicRestart').click();};
$('showRebuild').onclick=async()=>{if(selectionProblem)return;analysisFeedback=null;$('analysisFeedback').hidden=true;clearTimeout(analysisReturnTimer);analysisReturnTimer=null;if(selectedMusic.savedFavoriteId&&!selectedMusic.original){await chooseMusicTrack(selectedMusic.id,MUSIC_PLAN.feeling??'auto');if(!selectionProblem)$('autoMusicRebuild').click();return;}if(noMusicMode){stopShow();prepareProgram();syncShowButtons();mrPanel.draw();analysisChime.play();}else if(!selectedMusic.original)$('autoMusicRebuild').click();};
$('showRoom').onclick=async()=>{if(selectionProblem)return;if(noMusicMode||selectedMusic.original||selectedMusic.savedFavoriteId){setPanelTab(4);await startXR('immersive-ar',false,4);}else $('autoMusicRoom').click();};
function captureCurrentFavorite(){
 if(noMusicMode||libraryRestoring||musicBusy||pendingAutomaticTrack||directingBusy||selectionProblem||showPreparation.phase!=='ready')return null;
 return captureProgramme({plan:MUSIC_PLAN,trackId:selectedMusic.id,title:selectedMusic.title,identityTitle:selectedMusic.favoriteIdentityTitle??musicTrackIdentityTitle(selectedMusic.id,selectedMusic.title),original:!!selectedMusic.original,offsetMs:$('musicOffset').value});
}
async function favoriteAudioBytes(snapshot){
 const saved=await readLocalTrack(snapshot.trackId);if(saved?.bytes)return saved.bytes;
 const cached=favoritesUI.state.rows.find(row=>row.trackId===snapshot.trackId);
 if(cached){const audio=await favoriteRepository.read('audio',cached.audioId);if(audio?.bytes)return audio.bytes;}
 const source=MUSIC_CATALOG.find(track=>track.id===snapshot.trackId)?.src;if(!source)throw Error('保存した音源が見つかりません。');
 const response=await fetch(source);if(!response.ok)throw Error('音源を取得できません。USB接続と配信を確認してください。');return response.arrayBuffer();
}
function clearFavoriteFestival(){
 if(favoritesUI){favoritesUI.state.activeSetlistId='';$('setlistSelect').value='';}
 favoriteLoadRequest++;if(favoriteRun){favoriteRun.cancel();favoriteRun=null;favoritesUI?.setFestival('');}
}
async function decodeFavorite(row){
 const asset=await favoriteRepository.read('audio',row.audioId);if(!asset?.bytes)throw Error(row.name+'の音源が見つかりません。');
 const decoder=new OfflineAudioContext(1,1,22050),buffer=await decoder.decodeAudioData(asset.bytes.slice(0));
 const transport=new MusicTransport('',{autoload:false});transport.buffer=buffer;transport.ready=Promise.resolve(transport);
 const plan=structuredClone(row.plan);
 return {row,transport,item:{id:row.trackId,title:musicTrackTitle(row.trackId,row.title),favoriteIdentityTitle:row.identityTitle??row.title,description:'♥ '+row.name,plan,src:'',original:row.original,autoGenerated:!row.original,variation:plan.analysisSummary?.variation??0,savedFavoriteId:row.id,transport}};
}
function installFavoriteLoaded(loaded){
 pendingAutomaticTrack=null;selectionProblem=null;noMusicMode=false;previewing=false;previewPaused=false;
 generatedMusic=loaded.item;selectMusic(loaded.item,loaded.transport);$('musicOffset').value=String(loaded.row.offsetMs);
 syncMusicChoices();syncOriginalChoice();$('autoMusicFeeling').value=loaded.row.original?'original':MUSIC_PLAN.feeling??'auto';$('autoMusicEars').value=MUSIC_PLAN.earScene??'auto';$('autoMusicFeelingHint').textContent=MUSIC_PLAN.feelingDescription??'保存した打ち上げの順序と時刻を、そのまま再現します。';
 markShowReady(MUSIC_PLAN);syncShowButtons();drawMusicTimeline();mrPanel.draw();
}
async function loadFavorite(row){
 if(libraryRestoring)throw Error('保存曲の確認が終わってからお試しください。');
 cancelAutomaticPreparation();stopShow();const request=++favoriteLoadRequest;musicBusy=true;showPreparation.begin({title:row.title,setting:'保存した構成を読み込んでいます'});syncShowButtons();
 try{const loaded=await decodeFavorite(row);if(request!==favoriteLoadRequest)return;musicBusy=false;installFavoriteLoaded(loaded);$('showNotice').textContent='♥ '+row.name+' · 保存した構成';favoritesUI.close();favoritesPanel.close();}
 catch(error){if(request===favoriteLoadRequest){showPreparation.fail(error.message);throw error;}}
 finally{if(request===favoriteLoadRequest){musicBusy=false;syncShowButtons();}}
}
async function prepareFavoriteFestival(rows,metadata={}){
 if(libraryRestoring)throw Error('保存曲の確認が終わってからお試しください。');
 cancelAutomaticPreparation();stopShow();ensureAudio();const request=++favoriteLoadRequest;
 const run=new FavoriteFestival(rows,decodeFavorite);run.name=metadata.name??'お気に入り大会';run.setlistId=metadata.id??null;favoriteRun=run;musicBusy=true;showPreparation.begin({title:run.name,setting:rows.length+'曲を準備しています'});syncShowButtons();
 try{
  const first=await run.prepare();if(request!==favoriteLoadRequest||favoriteRun!==run||!first)return false;
  musicBusy=false;installFavoriteLoaded(first);favoritesUI.setFestival(run.name+' · 準備完了 · '+rows.length+'曲');
  favoritesUI.close();favoritesPanel.close();
  if(mrSession||panelPreview)startLoadedMusicShow();else $('showNotice').textContent=run.name+' · '+rows.length+'曲を準備しました。「開演」または「MRで観る」へ。';
  return true;
 }catch(error){if(favoriteRun===run){run.cancel();favoriteRun=null;showPreparation.fail(error.message);throw error;}}
 finally{if(request===favoriteLoadRequest){musicBusy=false;syncShowButtons();}}
}
async function jumpFavoriteTrack(direction){
 const run=favoriteRun,index=(run?.index??0)+direction;if(!run||musicBusy||index<0||index>=run.rows.length)return;
 const request=++favoriteLoadRequest;cancelMusicRequest();music.pause();running=false;cancelFutureSounds();clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();showCompleted=false;run.phase='loading';run.gapPaused=false;run.nextLoaded=null;musicBusy=true;syncShowButtons();
 try{const next=await run.goTo(index);if(!next||favoriteRun!==run||request!==favoriteLoadRequest)return;musicBusy=false;installFavoriteLoaded(next);startLoadedMusicShow();}
 catch(error){if(favoriteRun===run){run.phase='failed';favoritesUI.message('曲を切り替えられませんでした：'+error.message);}}
 finally{if(request===favoriteLoadRequest){musicBusy=false;syncShowButtons();}}
}
function advanceFavoriteInterval(dt){
 const run=favoriteRun;if(!run||run.gapPaused)return;
 if(run.phase==='gap'){
  if(!run.tickGap(dt))return;run.phase='loading';favoritesUI.setFestival('次の曲を準備しています');
  const request=favoriteLoadRequest;run.advance().then(next=>{if(favoriteRun===run&&request===favoriteLoadRequest&&next){run.nextLoaded=next;run.phase='switch';}}).catch(error=>{if(favoriteRun===run&&request===favoriteLoadRequest){run.phase='failed';favoritesUI.message('次の曲を始められませんでした：'+error.message);favoritesUI.setFestival('大会を停止しました');}});return;
 }
 if(run.phase==='switch'){const next=run.nextLoaded;run.nextLoaded=null;installFavoriteLoaded(next);startLoadedMusicShow();}
}
// Save UI before session.end() closes both panels. Re-anchor positions against
// the returning viewer's position/yaw so a new XR reference origin is safe.
function captureRenamePanels(){
 const snapshot=panel=>({visible:panel.visible,page:panel.page,offset:panel.offset,listMode:panel.listMode,setlistOffset:panel.setlistOffset,moved:panel.moved,yawOffset:panel.yawOffset,position:panel.mesh.position.clone(),quaternion:panel.mesh.quaternion.clone()});
 const pose=latestViewerTransform??mrPanel.lastTransform;
 return {main:snapshot(mrPanel),favorites:snapshot(favoritesPanel),viewer:pose?{position:new T.Vector3(pose.position.x,pose.position.y,pose.position.z),yaw:Math.atan2(pose.matrix[8],pose.matrix[10])}:null};
}
function restoreRenamePanels(saved,pose){
 favoritesUI.close();favoritesPanel.active=true;favoritesPanel.preview=false;favoritesPanel.menuId=null;
 favoritesPanel.offset=saved.favorites.offset;favoritesPanel.listMode=saved.favorites.listMode??'favorites';favoritesPanel.setlistOffset=saved.favorites.setlistOffset??0;
 favoritesPanel.openAt(pose,{side:-.42,distance:1.05,drop:.08});
 const delta=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(pose.matrix[8],pose.matrix[10])-(saved.viewer?.yaw??0));
 for(const [panel,state] of [[mrPanel,saved.main],[favoritesPanel,saved.favorites]]){
  if(saved.viewer){panel.mesh.position.copy(state.position).sub(saved.viewer.position).applyQuaternion(delta).add(new T.Vector3(pose.position.x,pose.position.y,pose.position.z));panel.mesh.quaternion.copy(state.quaternion).premultiply(delta);panel.moved=state.moved;panel.yawOffset=state.yawOffset;panel.mesh.updateMatrixWorld(true);}
  panel.mesh.visible=state.visible;panel.lastTransform=pose;panel.draw();
 }
}
async function saveSetlistName(id,name){
 const ok=await favoritesUI.renameSetlist(id,name);
 if(ok&&favoritesUI.state.activeSetlistId===id){
  if(favoriteRun)favoriteRun.name=name.trim();
  if(showPreparation.current)showPreparation.current={...showPreparation.current,title:name.trim()};
  syncPreparationDisplay();mrPanel.draw();
 }
 return ok;
}
async function renameFavoriteFromMR(id,kind='favorite'){
 const row=(kind==='setlist'?favoritesUI.state.setlists:favoritesUI.state.rows).find(row=>row.id===id);if(!row)return;
 if(!mrSession||mrSession.domOverlayState){mrNameEditor.open(row,mrSession,{kind});return;}
 // System keyboard focus suspends XR input on this device. Keep partial text
 // editing native, rather than pretending the canvas has a working caret.
 const session=mrSession,mode=mrMeta?.sessionMode??'immersive-ar',returning=captureRenamePanels();
 try{
  await session.end();
  mrNameEditor.open(row,null,{kind,returnToMR:()=>{void startXR(mode,false,returning.main.page,{renameReturn:returning});}});
 }catch(error){favoritesUI.message('名前の編集を開けませんでした：'+error.message);}
}

let removedTrackUndo=null,trackEditBusy=false;
async function syncTrackUndo(){const deleted=(await listDeletedTracks()).filter(t=>t.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));removedTrackUndo=deleted[0]?.trackId??null;$('trackUndo').hidden=!removedTrackUndo;mrPanel.draw();}
async function removeSelectedTrack(){
 if(trackEditBusy||$('trackMenuToggle').disabled)return;
 const id=$('musicTrack').value;trackEditBusy=true;
 try{
  const track=await autoMusicUI.deleteTrack(id);removedTrackUndo=id;$('trackUndo').hidden=false;
  $('trackMenu').hidden=true;$('trackMenuToggle').setAttribute('aria-expanded','false');
  if(selectedMusic.id===id||selectionProblem?.id===id){await chooseMusicTrack('none');}if(generatedMusic?.id===id)generatedMusic=null;syncMusicChoices();
  $('showNotice').textContent='「'+track.title+'」を曲一覧から削除しました。元に戻せます。';syncShowButtons();mrPanel.draw();
 }catch(error){$('showNotice').textContent='削除できませんでした：'+error.message;}
 finally{trackEditBusy=false;}
}
async function restoreRemovedTrack(){
 if(trackEditBusy||!removedTrackUndo)return;trackEditBusy=true;
 try{const track=await autoMusicUI.restoreTrack(removedTrackUndo);await syncTrackUndo();$('showNotice').textContent='曲を元に戻しました · '+track.title;syncShowButtons();mrPanel.draw();}
 catch(error){$('showNotice').textContent='元に戻せませんでした：'+error.message;}
 finally{trackEditBusy=false;}
}
async function saveTrackName(id,name){
 const named=await autoMusicUI.renameTrack(id,name);
 if(selectedMusic.id===id){
  selectedMusic.title=named.title;
  if(generatedMusic?.id===id)generatedMusic.title=named.title;
  if(showPreparation.current)showPreparation.current={...showPreparation.current,title:named.title};
  if(showPreparation.pending)showPreparation.pending={...showPreparation.pending,title:named.title};
  $('musicState').textContent=named.title;$('showNotice').textContent='曲名を変更しました · '+named.title;
 }
 syncMusicChoices();syncShowButtons();mrPanel.draw();await favoritesUI.refreshHeart();return true;
}
async function renameSelectedTrack(){
 if(trackEditBusy||$('trackMenuToggle').disabled)return;
 const id=$('musicTrack').value,track=playableMusicChoices(generatedMusic).find(t=>t.id===id);if(!track)return;
 $('trackMenu').hidden=true;$('trackMenuToggle').setAttribute('aria-expanded','false');mrPanel.draw();
 const row={id,name:track.title};
 if(!mrSession||mrSession.domOverlayState){mrNameEditor.open(row,mrSession,{kind:'track'});return;}
 const session=mrSession,mode=mrMeta?.sessionMode??'immersive-ar',returning=captureRenamePanels();
 try{await session.end();mrNameEditor.open(row,null,{kind:'track',returnToMR:()=>{void startXR(mode,false,returning.main.page,{renameReturn:returning});}});}
 catch(error){$('showNotice').textContent='曲名の編集を開けませんでした：'+error.message;}
}

function openFavoriteList(){
 if(mrSession||panelPreview){favoritesUI.close();favoritesPanel.active=true;favoritesPanel.preview=panelPreview;const transform=latestViewerTransform??mrPanel.lastTransform;if(panelPreview&&!mrPanel.moved)mrPanel.openAt(transform,{side:.38,distance:1.45,drop:.3});favoritesPanel.openAt(transform,panelPreview?{side:-.38,distance:1.45,drop:.3}:{side:-.42,distance:1.05,drop:.08});}
 else favoritesUI.show();
}
favoritesUI=mountFavorites({repository:favoriteRepository,capture:captureCurrentFavorite,audio:favoriteAudioBytes,onOpen:openFavoriteList,onLoad:loadFavorite,onPrepare:prepareFavoriteFestival,onRenameSetlist:id=>renameFavoriteFromMR(id,'setlist'),available:()=>!libraryRestoring,onChange:()=>{mrPanel.draw();favoritesPanel?.draw();}});
mrNameEditor=new MRNameEditor({document,onChange:()=>favoritesPanel?.draw(),onSave:(id,name)=>mrNameEditor.state?.kind==='track'?saveTrackName(id,name):mrNameEditor.state?.kind==='setlist'?saveSetlistName(id,name):favoritesUI.rename(id,name)});
void favoritesUI.restore().catch(error=>favoritesUI.message('お気に入りを読み込めませんでした：'+error.message));
$('trackMenuToggle').onclick=()=>{if($('trackMenuToggle').disabled)return;$('trackMenu').hidden=!$('trackMenu').hidden;$('trackMenuToggle').setAttribute('aria-expanded',String(!$('trackMenu').hidden));mrPanel.draw();};
$('trackRename').onclick=()=>void renameSelectedTrack();
$('trackDelete').onclick=()=>void removeSelectedTrack();$('trackUndo').onclick=()=>void restoreRemovedTrack();
void syncTrackUndo().catch(error=>{$('showNotice').textContent='削除の取り消しを準備できませんでした：'+error.message;});
document.addEventListener('click',event=>{if(!mrSession&&!panelPreview&&!event.target.closest('.song-actions')){$('trackMenu').hidden=true;$('trackMenuToggle').setAttribute('aria-expanded','false');}});


new MutationObserver(syncUnifiedControls).observe($('mr'),{attributes:true,attributeFilter:['disabled']});
window.__autoMusicStudy={get result(){const r=autoMusicUI.result;return r?{title:r.title,analysis:r.analysis,plan:r.plan,decodedDuration:r.buffer.duration}:null;},get busy(){return autoMusicUI.busy;}};
setPanelTab(4);
$('musicReanalyze').onclick=async()=>{
 if(autoMusicUI.busy||musicBusy||pendingAutomaticTrack)return;
 showPreparation.begin({title:selectionProblem?.title??selectedMusic.title,setting:'この端末で解析しています'});
 const request=++selectionRequest,id=selectionProblem?.id??selectedMusic.id,title=selectionProblem?.title??selectedMusic.title;
 selectionProblem=null;pendingAutomaticTrack={id,title};syncShowButtons();mrPanel.draw();
 try{
  if(selectedMusic.original)await saveTrackFeeling(id,'auto');
  if(request!==selectionRequest)return;
  const result=await autoMusicUI.reanalyzeTrack(id);
  if(request!==selectionRequest)return;
  if(!result)showSelectionError({id,title});
 }catch(error){if(request===selectionRequest){$('autoMusicStatus').textContent=error.message;showSelectionError({id,title});}}
 finally{if(request===selectionRequest){pendingAutomaticTrack=null;musicBusy=false;syncShowButtons();mrPanel.draw();}}
};

for(const id of ['program','mood','ending']){
 const previous=$(id).onchange;
 $(id).onchange=event=>{previous?.(event);if(noMusicMode&&!pendingAutomaticTrack&&!selectionProblem&&!libraryRestoring){stopShow();prepareProgram();syncShowButtons();mrPanel.draw();}};
}
$('showNotice').textContent='保存した曲を確認中…';
(async()=>{try{
 const tracks=await autoMusicUI.restoreLibrary();
 const requested=localStorage.getItem('hanabi83-selected')??localStorage.getItem('hanabi82-selected')??localStorage.getItem('hanabi81-selected')??localStorage.getItem('hanabi80-selected')??localStorage.getItem('hanabi79-selected')??localStorage.getItem('hanabi78-selected')??localStorage.getItem('hanabi77-selected')??localStorage.getItem('hanabi76-selected')??localStorage.getItem('hanabi75-selected')??localStorage.getItem('hanabi74-selected')??localStorage.getItem('hanabi73-selected')??localStorage.getItem('hanabi72-selected')??localStorage.getItem('hanabi71-selected')??localStorage.getItem('hanabi70-selected')??localStorage.getItem('hanabi69-selected')??localStorage.getItem('hanabi68-selected')??localStorage.getItem('hanabi67-selected')??localStorage.getItem('hanabi66-selected')??localStorage.getItem('hanabi65-selected')??localStorage.getItem('hanabi64-selected')??localStorage.getItem('hanabi63-selected')??localStorage.getItem('hanabi62-selected')??localStorage.getItem('hanabi61-selected')??localStorage.getItem('hanabi60-selected')??localStorage.getItem('hanabi59-selected')??localStorage.getItem('hanabi58-selected')??localStorage.getItem('hanabi57-selected')??localStorage.getItem('hanabi56-selected')??localStorage.getItem('hanabi55-selected')??localStorage.getItem('hanabi54-selected')??localStorage.getItem('hanabi53-selected')??localStorage.getItem('hanabi52-selected')??localStorage.getItem('hanabi51-selected')??localStorage.getItem('hanabi50-selected')??localStorage.getItem('hanabi49-selected')??localStorage.getItem('hanabi48-selected')??localStorage.getItem('hanabi47-selected')??localStorage.getItem('hanabi46-selected')??localStorage.getItem('hanabi45-selected')??localStorage.getItem('hanabi44-selected')??localStorage.getItem('hanabi43-selected');
 const latest=tracks.find(t=>t.trackId===requested)??tracks.filter(t=>t.imported).sort((a,b)=>b.savedAt.localeCompare(a.savedAt))[0];
 const id=requested==='none'?'none':playableMusicChoices(generatedMusic).some(t=>t.id===requested)?requested:latest?.trackId;
 if(new URLSearchParams(location.search).has('rainEarTrial')){$('showNotice').textContent='';}
 else if(id)await chooseMusicTrack(id);else{prepareProgram();$('showNotice').textContent='';}syncMusicChoices();syncShowButtons();
 $('status').textContent='曲を選び、好きな位置に街を置いて開演してください。';
}catch(error){$('showNotice').textContent='保存曲を読み込めませんでした：'+error.message;showPreparation.fail(error.message);}finally{libraryRestoring=false;syncMusicChoices();syncShowButtons();mrPanel.draw();}})();

if(new URLSearchParams(location.search).has('autoMusicTrial')){setPanelTab(4);town.scale.setScalar(1);camera.position.set(0,1.45,3.5);camera.lookAt(0,1.15,0);scene.fog.density=.025;}

window.__musicStudy={get state(){return{time,transport:music.currentTime,running,pending:burstQueue.length,active:fireworks.length,points:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),sourceActive:!!music.source,contextState:audio?.state,spatial:soundEngine?.spatialStats,clicks:music.clicks.size,log:musicLog};},get plan(){return MUSIC_PLAN;}};

if($('candyCard')){
 town.rotation.set(0,0,0);town.scale.setScalar(1);camera.position.set(0,1.15,3.0);camera.lookAt(0,.72,-.12);scene.fog.density=.025;
 $('candyVolume').oninput=()=>{$('volume').value=$('candyVolume').value;$('volume').dispatchEvent(new Event('input'));};
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

// Local review controls use the same shell renderer as trial shots and XR.
let longStarScrubbing=false;
if((new URLSearchParams(location.search).has('largeStarTrial')||new URLSearchParams(location.search).has('sparkleTrial'))){
 const reviewKind=new URLSearchParams(location.search).has('sparkleTrial')?'sparklelarge':'longstar';
 $('longStarCard').dataset.kind=reviewKind;
 if(reviewKind==='sparklelarge'){$('longStarTitle').textContent='キラキラ大玉 · 水色と青';$('longStarDescription').textContent='５本の親星が１束で伸び、金の尾を引いて垂れながらキラキラ。５本とも先端は最後まで色を残します。５号2.8秒・尺玉4.0秒・二尺4.6秒。';}
 $('longStarCard').hidden=false;setPanelTab(1);town.rotation.set(0,0,0);town.scale.setScalar(1);town.position.set(0,0,0);yaw=0;pitch=0;
 camera.position.set(0,1.18,2.50);camera.lookAt(0,1.04,.05);scene.fog.density=.025;
 $('type').value=reviewKind;$('size').value='5';syncSize();syncPalette();
 $('longStarColor').replaceChildren(...paletteOptions(reviewKind).map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.label;return o;}));$('longStarColor').value=$('palette').value;
 const shoot=(size,seek=null)=>{
  beginPreview();$('type').value=reviewKind;$('size').value=String(size);syncSize();syncPalette();
  camera.position.set(0,size===20?1.75:1.18,size===20?3.6:2.50);pitch=size===20?.70:0;
  launch(reviewKind,size,{x:0,z:.05,ignitionDelay:.02,silent:seek!==null,palette:$('palette').value,longStarSeed:0x141711+size*71,sparkleSeed:0x141729+size*71});
  $('longStarColor').value=$('palette').value;$('longStarCard').dataset.size=String(size);$('longStarSeek').max=String(reviewKind==='sparklelarge'?sparkleLife(size):longStarLife(size));$('longStarSeek').value=String(seek??0);$('longStarPause').textContent='一時停止';
  if(seek!==null){const f=fireworks[0];time=f.ascent+seek;cancelFutureSounds();f.soundPlayed=true;updateFireworks();previewPaused=true;$('longStarPause').textContent='再開';}
  $('status').textContent=(size===5?'５号':size===20?'二尺玉':'尺玉')+(reviewKind==='sparklelarge'?'のキラキラ大玉 · ':'の大星 · ')+shellPalette(reviewKind,$('palette').value).label+'。大星は最後まで色を保ち、金のキラと一緒に消えます。';
 };
 const changeColor=()=>{const size=Number($('longStarCard').dataset.size||5),seek=previewing&&previewPaused?Number($('longStarSeek').value):null;$('palette').value=$('longStarColor').value;shoot(size,seek);};
 $('longStarColor').onchange=changeColor;
 $('longStarNext').onclick=()=>{const choices=paletteOptions(reviewKind),index=choices.findIndex(p=>p.id===$('longStarColor').value);$('longStarColor').value=choices[(index+1)%choices.length].id;changeColor();};
 $('palette').addEventListener('change',()=>{if($('type').value===reviewKind)$('longStarColor').value=$('palette').value;});
 if(reviewKind==='sparklelarge'){$('sparkle20').hidden=false;$('sparkle20').onclick=()=>shoot(20);}
 $('longStar5').onclick=()=>shoot(5);$('longStar10').onclick=()=>shoot(10);
 $('longStarPause').onclick=()=>{if(previewing){previewPaused=!previewPaused;if(previewPaused)cancelFutureSounds();$('longStarPause').textContent=previewPaused?'再開':'一時停止';}};
 $('longStarSeek').oninput=()=>{longStarScrubbing=true;shoot(Number($('longStarCard').dataset.size||5),Number($('longStarSeek').value));longStarScrubbing=false;};
}

// Colour variants share the accepted low tuft geometry and recorded sound.
let rainEarSeed=0x141740,rainEarMode='alternating',rainEarFirst=1.65,rainEarLength=7,rainEarStages=[];
function beginRainEarStudy(mode='alternating',seek=null,seed=null){
 if(seed!==null)rainEarSeed=seed>>>0;else if(!new URLSearchParams(location.search).has('rainEarTrial'))rainEarSeed=crypto.getRandomValues(new Uint32Array(1))[0];
 rainEarMode=mode;beginPreview();
 if($('longStarCard'))$('longStarCard').hidden=true;$('rainEarCard').hidden=false;
 $('type').value='ear';$('size').value='2';syncSize();syncPalette();$('palette').value=mode.startsWith('paddy')?'ear-purple':mode==='gold'?'original':mode==='sunset'?'ear-red':mode.endsWith('-field')?(mode==='gold-field'?'original':'ear-green'):['red','orange','purple','green','aqua','blue'].includes(mode)?'ear-'+mode:'ear-aqua';
 const field=mode.endsWith('-field'),tone=field?mode.slice(0,-6):mode;
 const plan=mode.startsWith('paddy')?paddySeasonPassage({seed:rainEarSeed,flowers:mode==='paddy-base'}):mode.startsWith('sea-sunset')?seaSunsetPassage({seed:rainEarSeed,long:mode!=='sea-sunset',flowers:mode==='sea-sunset-base'}):earLandscape({mode:tone,seed:rainEarSeed,duration:field?16:8,flowers:mode==='green-field'});rainEarFirst=plan.firstOpening;rainEarLength=plan.lastExtinction-plan.firstOpening;rainEarStages=plan.stages??[];
 burstQueue=plan.shots.map(s=>({...s,position:{...s.position,silent:seek!==null}}));
 if(!renderer.xr.isPresenting&&!bridgeView.active){town.rotation.set(0,0,0);town.scale.setScalar(1);town.position.set(0,0,0);yaw=0;pitch=0;camera.position.set(0,(mode.endsWith('-field')||['sea-sunset-base','paddy-base'].includes(mode))?1.28:.90,(mode.endsWith('-field')||['sea-sunset-base','paddy-base'].includes(mode))?3.6:2.7);camera.lookAt(0,(mode.endsWith('-field')||['sea-sunset-base','paddy-base'].includes(mode))?1.1:.70,-.7);scene.fog.density=.025;}
 $('rainEarSeek').max=String(rainEarLength);$('rainEarSeek').value=String(seek??0);$('rainEarPause').textContent='一時停止';
 if(seek!==null){const target=rainEarFirst+seek;groundStudySilent=true;try{while(time<target-1e-8)advance(Math.min(.025,target-time));}finally{groundStudySilent=false;}cancelFutureSounds();for(const f of fireworks)f.soundPlayed=true;updateFireworks();previewPaused=true;$('rainEarPause').textContent='再開';}
 $('status').textContent=({alternating:'水色と青が交互に並ぶ雨の幕。',aqua:'水色の穂を横一列に。',blue:'青の穂を横一列に。',gold:'元の金の穂と同じ並びで比較。',red:'赤の穂を横一列に。',orange:'オレンジの穂を横一列に。',purple:'紫の穂を横一列に。',green:'緑の穂を横一列に。',sunset:'赤とオレンジが交互に並ぶ夕焼。','green-field':'緑の穂の田園に、上空の花を重ねます。','gold-field':'実った金の稲穂を、上下二段で広げます。','paddy-season':'紫の穂２波→緑の穂３波→金の穂３波。朝日から真夏、実りへ移る水田です。','paddy-base':'水田の季節をベースに、朝・夏・実りの方向で選んだ花火を毎回違う並びで重ねます。','sea-sunset-long':'海色３波→夕色が広がる３波→夕焼色３波。約44秒の長い景色です。','sea-sunset-base':'海から夕焼へ移る９波をベースに、毎回違う空を、前半は海色寄り・後半は夕色寄りに重ねます。','sea-sunset':'海色２波→夕色が少し混じる→さらに広がる→夕焼色２波。約30秒で海が夕日に染まります。'})[mode]+' 11列×上下二段。低い穂を少し手前に重ね、細い尾まで色を保って消えます。';
}
$('rainEarShow').onclick=()=>beginRainEarStudy();
for(const [id,mode] of [['rainAlternating','alternating'],['rainAqua','aqua'],['rainBlue','blue'],['rainGold','gold'],['earRed','red'],['earOrange','orange'],['earSunset','sunset'],['earPurple','purple'],['earGreen','green'],['earGarden','green-field'],['earGoldField','gold-field'],['earSeaSunset','sea-sunset'],['earSeaLong','sea-sunset-long'],['earSeaBase','sea-sunset-base'],['earPaddy','paddy-season'],['earPaddyBase','paddy-base']])$(id).onclick=()=>beginRainEarStudy(mode,previewing&&previewPaused?Number($('rainEarSeek').value):null,rainEarSeed);
$('rainNew').onclick=()=>beginRainEarStudy(rainEarMode,null,crypto.getRandomValues(new Uint32Array(1))[0]);
$('rainEarPause').onclick=()=>{if(previewing){pauseShow();$('rainEarPause').textContent=previewPaused?'再開':'一時停止';}};
$('rainEarSeek').oninput=()=>beginRainEarStudy(rainEarMode,Number($('rainEarSeek').value),rainEarSeed);
if(new URLSearchParams(location.search).has('rainEarTrial')){$('rainEarCard').hidden=false;setPanelTab(1);town.rotation.set(0,0,0);town.scale.setScalar(1);town.position.set(0,0,0);yaw=0;pitch=0;camera.position.set(0,.90,2.7);camera.lookAt(0,.70,-.7);scene.fog.density=.025;$('type').value='ear';$('size').value='2';syncSize();syncPalette();const mode=new URLSearchParams(location.search).get('rainEarTrial');if(['red','orange','sunset','purple','green','green-field','gold-field','alternating','gold','aqua','blue','sea-sunset','sea-sunset-long','sea-sunset-base','paddy-season','paddy-base'].includes(mode))beginRainEarStudy(mode,null,rainEarSeed);}

const isToraMountainScene=mode=>['small-mountain-bundles','small-mountain-triple','mountain-chorus-twins','mountain-chorus-triple'].includes(mode);
const toraMountainFrontMode=mode=>mode==='mountain-chorus-triple'?'small-mountain-triple':mode==='mountain-chorus-twins'?'small-mountain-bundles':mode;
function beginToraScene(mode='mountain-twins',seek=null,seed=toraSceneSeed){
 toraSceneMode=mode;toraSceneSeed=seed>>>0;beginPreview();
 if($('rainEarCard'))$('rainEarCard').hidden=true;if($('longStarCard'))$('longStarCard').hidden=true;
 $('toraSceneCard').hidden=false;if(mode!=='sequence'&&mode!=='stream-sequence'){$('cometPattern').value=toraMountainFrontMode(mode);$('cometStyle').value=mode==='small-color-row'?'tora-row-mix':isToraMountainScene(mode)?($('toraMountainColor').value||'mountain-white'):'silver';$('cometPattern').dispatchEvent(new Event('change'));}comets.seed=toraSceneSeed;comets.bundles.seed=toraSceneSeed^0x9e3779b9;
 const options={interval:Number($('toraStreamInterval').value)||.24,rate:Number($('toraSceneSpeed').value)||.75,mountainStyle:$('toraMountainColor').value||'mountain-white'},cues=toraSceneCues(mode,options);fanQueue.push(...cues);toraSceneLength=toraSceneEnd(mode,options);
 cometFinishAt=toraSceneLength;$('toraSceneSeek').max=String(toraSceneLength/options.rate);$('toraSceneSeek').value=String(seek??0);$('toraScenePause').textContent='一時停止';
 if(!renderer.xr.isPresenting&&!bridgeView.active){town.rotation.set(0,0,0);town.scale.setScalar(1);town.position.set(0,0,0);yaw=0;pitch=0;camera.position.set(0,1.08,2.8);camera.lookAt(0,.70,0);scene.fog.density=.025;}
 if(seek!==null){groundStudySilent=true;try{updateFans();while(time<seek*options.rate-1e-8){time=Math.min(seek*options.rate,time+.025);updateFans();}}finally{groundStudySilent=false;}cancelFutureSounds();previewPaused=true;$('toraScenePause').textContent='再開';}
 const labels={'small-mountain-triple':'子トラ · 左・中・右の三山','mountain-chorus-twins':'子トラ二山 ＋ 真後ろの大トラ同時吹上','mountain-chorus-triple':'子トラ三山 ＋ 真後ろの大トラ同時吹上','small-mountain-upright':'子トラ · 高さ違いの細い二山','small-mountain-bundles':'子トラ · すぼまった束の二山','small-mountain-twins':'子トラの二山 · 頂上で消える','small-stream-right':'子トラ · 左から右へ','small-stream-left':'子トラ · 右から左へ','small-stream-cross':'子トラ · 両端から交差して外へ','stream-sequence':'左 → 右 → 両端クロス','mountain-twins':'二つの山から空へ','woven-cross':'白銀の網を横一面に','grand-fan-cross':'左右の大扇と中央クロス','small-color-row':'色の細い横一列',sequence:'子トラ → 網 → 二山 → 大扇と子トラ'};
 $('toraSceneCard').querySelector('p').textContent=['small-mountain-twins','small-mountain-bundles'].includes(mode)?labels[mode]+'。勢いよく伸び、上昇中に燃え尽きます。':'左・中・右の三山。その真後ろに大トラを重ねて、同時に吹き上げます。';
 $('chapter').textContent='トラの演出 · '+labels[mode];$('last').textContent=labels[mode];$('status').textContent='連続写真からの試作。伸びる途中の形と、尾の余韻を見比べられます。';
}
$('toraSceneShow').onclick=()=>beginToraScene('mountain-chorus-triple');
for(const [id,mode] of [['toraSmallTripleMountain','small-mountain-triple'],['toraChorusTwins','mountain-chorus-twins'],['toraChorusTriple','mountain-chorus-triple'],['toraUprightMountain','small-mountain-upright'],['toraSmallBundleMountain','small-mountain-bundles'],['toraSmallMountain','small-mountain-twins'],['toraStreamRight','small-stream-right'],['toraStreamLeft','small-stream-left'],['toraStreamCross','small-stream-cross'],['toraStreamSequence','stream-sequence'],['toraMountain','mountain-twins'],['toraWoven','woven-cross'],['toraGrandFan','grand-fan-cross'],['toraColorRow','small-color-row'],['toraSequence','sequence']])$(id).onclick=()=>beginToraScene(mode);
$('toraScenePause').onclick=()=>{if(previewing){pauseShow();$('toraScenePause').textContent=previewPaused?'再開':'一時停止';}};
$('toraSceneSeek').oninput=()=>beginToraScene(toraSceneMode,Number($('toraSceneSeek').value));
function changeToraMountainColor(){const mode=isToraMountainScene(toraSceneMode)?toraSceneMode:'small-mountain-bundles',seek=isToraMountainScene(toraSceneMode)&&previewPaused?time/Number($('toraSceneSpeed').value||.75):null;beginToraScene(mode,seek);}
$('toraMountainColor').onchange=changeToraMountainColor;
$('toraMountainNextColor').onclick=()=>{const colors=TORA_MOUNTAIN_COLORS,i=colors.findIndex(c=>c.id===$('toraMountainColor').value);$('toraMountainColor').value=colors[(i+1)%colors.length].id;changeToraMountainColor();};
$('toraMountainNew').onclick=()=>beginToraScene(isToraMountainScene(toraSceneMode)?toraSceneMode:'small-mountain-bundles',previewPaused?(isToraMountainScene(toraSceneMode)?time/Number($('toraSceneSpeed').value||.75):1.30):null,(toraSceneSeed+0x9e3779b9)>>>0);
$('toraStreamInterval').onchange=()=>beginToraScene(toraSceneMode);
$('toraSceneSpeed').onchange=()=>beginToraScene(toraSceneMode);
const toraTrialQuery=new URLSearchParams(location.search);
if(toraTrialQuery.has('toraSceneTrial')){const requested=toraTrialQuery.get('toraSceneTrial'),mode=['small-mountain-twins','small-mountain-bundles'].includes(requested)?requested:'mountain-chorus-triple';setPanelTab(1);beginToraScene(mode,mode==='mountain-chorus-triple'?1.30:0);}

if(new URLSearchParams(location.search).has("rainMusicTrial")){setPanelTab(4);selectMusic(MUSIC_SHOWS.find(item=>item.id==="mou-ichido-dake"));syncShowButtons();drawMusicTimeline();town.scale.setScalar(1);camera.position.set(0,1.45,3.5);camera.lookAt(0,1.15,0);scene.fog.density=.025;}

function beginFlowerStudy(seek=null){
 syncFlowerControls();beginPreview();
 const flowerOptions={timing:$('flowerTiming').value,spacing:$('flowerSpacing').value,color:$('flowerColor').value,size:Number($('flowerSize').value)};
 flowerStudy=$('flowerPattern').value.startsWith('garden-')?flowerGardenPassage({firstOpening:3.2,duration:$('flowerPattern').value==='garden-15'?15:10,...flowerOptions}):$('flowerPattern').value.startsWith('sustain-')?flowerCarpetPassage({firstOpening:3.2,duration:$('flowerPattern').value==='sustain-15'?15:10,...flowerOptions}):flowerScene($('flowerPattern').value,flowerOptions);
 burstQueue=structuredClone(flowerStudy.shots);fanQueue=structuredClone(flowerStudy.fans);cometFinishAt=flowerStudy.end;
 if($('flowerPattern').value.startsWith('garden-')&&!renderer.xr.isPresenting&&!bridgeView.active&&!panelPreview){camera.position.set(0,1.45,3.6);pitch=.35;}
 $('flowerSeek').max=String(flowerStudy.end);$('flowerSeek').value=String(seek??0);
 const label=FLOWER_PATTERNS.find(p=>p.id===flowerStudy.pattern)?.label??'５色の花の乱れ咲き';
 $('chapter').textContent=label;$('last').textContent='花と茎の重なりを観る';
 $('flowerDescription').textContent=label+(flowerUsesSize(flowerStudy.pattern)?'（'+$('flowerSize').selectedOptions[0].textContent+(flowerStudy.freeShell?'・玉だけ）':'・茎と葉）'):'')+(flowerUsesColor(flowerStudy.pattern)?'（'+$('flowerColor').selectedOptions[0].textContent+'）':'')+'。'+$('flowerTiming').selectedOptions[0].textContent+'・'+$('flowerSpacing').selectedOptions[0].textContent+(flowerUsesSize(flowerStudy.pattern)?'。開ききる頃から消える余韻を観ます。':flowerStudy.pattern.startsWith('garden-')?'。下の３号の絨毯と上空の５号・尺玉を観ます。':'。花の下と緑の茎がつながる瞬間を見比べます。');
 $('status').textContent=$('flowerDescription').textContent;
 if(seek!==null){groundStudySilent=true;try{while(time<Math.min(seek,flowerStudy.end)-1e-8)advance(Math.min(.025,seek-time));}finally{groundStudySilent=false;}cancelFutureSounds();previewPaused=true;}
 mrPanel.draw();
}
$('flowerShow').onclick=()=>beginFlowerStudy();
$('flowerPause').onclick=()=>{if(flowerStudy&&previewing)pauseShow();};
$('flowerSeek').oninput=()=>beginFlowerStudy(Number($('flowerSeek').value));
function syncFlowerControls(){
 const pattern=$('flowerPattern').value,free=flowerUsesSize(pattern),select=$('flowerSize');
 for(const option of select.options)option.disabled=free?false:option.value!==(pattern.startsWith('sunflower')?'5':'3');
 if(!free)select.value=pattern.startsWith('sunflower')?'5':'3';else if(!['3','5','10'].includes(select.value))select.value='3';
 select.disabled=!free;$('flowerColor').disabled=!flowerUsesColor(pattern);
}
for(const id of ['flowerPattern','flowerTiming','flowerSpacing','flowerColor','flowerSize'])$(id).onchange=()=>{if(id==='flowerPattern')$('flowerTiming').value=$('flowerPattern').value.startsWith('sunflower')?'stem-first':'together';syncFlowerControls();if(flowerStudy)beginFlowerStudy(previewPaused?Number($('flowerSeek').value):null);else mrPanel.draw();};
syncFlowerControls();
const flowerTrialQuery=new URLSearchParams(location.search);
if(flowerTrialQuery.has('flowerTrial')){setPanelTab(1);mrPanel.flowerStudy=true;mrPanel.groundStudy=false;if(FLOWER_PATTERNS.some(p=>p.id===flowerTrialQuery.get('flowerTrial')))$('flowerPattern').value=flowerTrialQuery.get('flowerTrial');if($('flowerPattern').value.startsWith('sunflower'))$('flowerTiming').value='stem-first';syncFlowerControls();mrPanel.draw();}

// Separate creative-shell bench. The approved automatic programmes remain the
// reference while these three new shells are reviewed individually.
let creativeKind='butterfly',creativeSeed=0x141771;
const creativeDescriptions={butterfly:'６色の大きな先端を、短い金の尾で見せる蝶。垂れる前から羽が消え始めます。',planet:'青紫の丸い星、中央の金の花、斜めに伸びる金の帯を重ねます。',drum:'少数の大星と細い尾の扇に、腰をぐるりと囲む大星の輪を重ねます。斜めからも見比べてください。'};
function creativeShoot(age=null){
 beginPreview();flowerStudy=null;cometFinishAt=null;cometCompleted=false;
 for(const id of ['rainEarCard','longStarCard','toraSceneCard'])if($(id))$(id).hidden=true;
 $('creativeCard').hidden=false;setPanelTab(1);town.rotation.set(0,0,0);town.scale.setScalar(1);town.position.set(0,0,0);yaw=0;pitch=0;camera.position.set(0,1.18,2.35);scene.fog.density=.025;
 const size=Number($('creativeSize').value),palette=$('creativeColor').value||'original',flight=flowerFlight(size,creativeSeed);
 $('type').value=creativeKind;$('size').value=String(size);syncSize();syncPalette();$('palette').value=palette;
 launch(creativeKind,size,{x:flight.dx,z:.05+flight.dz,palette,reviewSeed:creativeSeed,flowerFlight:flight,heightOffset:flight.heightOffset,ascentOffset:flight.ascentOffset,ignitionDelay:flight.ignitionDelay,creativePose:$('creativePose').value,silent:age!==null});
 $('creativeSeek').max=String(CREATIVE_PROFILES[creativeKind].life+.1);$('creativeSeek').value=String(age??0);$('creativePause').textContent='一時停止';
 $('creativeDescription').textContent=creativeDescriptions[creativeKind];
 if(age!==null){time=fireworks[0].ascent+age;cancelFutureSounds();fireworks[0].soundPlayed=true;updateFireworks();previewPaused=true;$('creativePause').textContent='再開';}
 $('status').textContent=CREATIVE_PROFILES[creativeKind].label+' · '+(size===10?'尺玉':'５号玉')+'の試作。開花後のバーで途中の形も見比べられます。';mrPanel.draw();
}
function selectCreative(kind,palette=null){creativeKind=kind;$('creativeColor').replaceChildren(...paletteOptions(kind).map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.label;return o;}));if(palette&&paletteOptions(kind).some(p=>p.id===palette))$('creativeColor').value=palette;creativeShoot();}
for(const kind of ['Butterfly','Planet','Drum'])$('creative'+kind).onclick=()=>selectCreative(kind.toLowerCase());
$('creativeReplay').onclick=()=>creativeShoot();$('creativeShow').onclick=()=>selectCreative(creativeKind);
$('creativeNew').onclick=()=>{creativeSeed=crypto.getRandomValues(new Uint32Array(1))[0];creativeShoot();};
$('creativePause').onclick=()=>{if(!previewing)return;previewPaused=!previewPaused;if(previewPaused)cancelFutureSounds();else ensureAudio();$('creativePause').textContent=previewPaused?'再開':'一時停止';};
$('creativeSeek').oninput=()=>creativeShoot(Number($('creativeSeek').value));
for(const id of ['creativeSize','creativeColor','creativePose'])$(id).onchange=()=>creativeShoot(previewPaused?Math.min(Number($('creativeSeek').value),CREATIVE_PROFILES[creativeKind].life):null);
window.__creativeStudy={shoot:creativeShoot,get kind(){return creativeKind;},get seed(){return creativeSeed;}};
const creativeQuery=new URLSearchParams(location.search).get('creativeTrial');
if(isCreativeShell(creativeQuery))selectCreative(creativeQuery,new URLSearchParams(location.search).get('creativeColor'));
