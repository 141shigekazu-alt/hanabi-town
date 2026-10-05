import {createProgram,programCue,PROGRAM_NAMES,randomStarmine} from './programs.js?v=20261006-beta1-r2';
import * as T from './vendor/three.module.js';
import {SIZES,TYPES,sphere,chapter,paletteOptions,shellPalette} from './fireworks.js?v=20261006-beta1-r2';
import {reflectionMaterial} from './water.js?v=20261006-beta1-r2';
import {FireworkAudio} from './audio.js?v=20261006-beta1-r2';
import {placementFromPose,XRMetrics} from './mr-test.js?v=20261006-beta1-r2';
import {MRPanel,nextEnabledOption,stepRange} from './mr-panel.js?v=20261006-beta1-r2';
import {MRDimming,clampBrightness} from './mr-dimming.js?v=20261006-beta1-r2';
import {TowerLighting} from './tower-lighting.js?v=20261006-beta1-r2';
const panelPreview=new URLSearchParams(location.search).get('mrpanel')==='1';
const $=id=>document.getElementById(id), canvas=$('view');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
const scene=new T.Scene();scene.background=new T.Color(0x050a16);scene.fog=new T.FogExp2(0x050a16,.085);
const camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.03,40);camera.position.set(0,1.2,2.9);
const mrDimming=new MRDimming(scene);
const town=new T.Group();scene.add(town);const light=new T.AmbientLight(0x8da9d9,1.1);scene.add(light);const moon=new T.DirectionalLight(0x9ec4ff,1.3);moon.position.set(-2,5,3);scene.add(moon);
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
const windows=[], lamps=[],rooftops=[];
for(let side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<5;col++){
 const z=-.86+row*.27+(rand()-.5)*.04,x=riverCenter(z)+side*(riverWidth(z)/2+.12+col*.205),w=.105+rand()*.055,d=.12+rand()*.06,h=.10+rand()*.31;
 cube(x,h/2,z,w,h,d,mats[Math.floor(rand()*mats.length)]);
 if(h>.32)rooftops.push({x,y:h,z,w,d});
 for(let level=.045;level<h-.015;level+=.04)for(let k=-1;k<=1;k++)if(rand()>.38)windows.push(x+k*w*.25,level,z+d/2+.001);
}
function pointCloud(coords,color,size){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));const m=new T.PointsMaterial({color,size,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});const p=new T.Points(g,m);town.add(p);return p;}
const win=pointCloud(windows,0xffdba0,.008);
const roadmat=new T.MeshStandardMaterial({color:0x3c464c});
for(const z of [-.58,.05,.67]){
 const firstChild=town.children.length;
 cube(0,.09,z,.7,.025,.085,roadmat);
 for(const x of [-.23,.23])cube(x,.045,z,.018,.09,.06,mats[1]);
 const curve=new T.CatmullRomCurve3(Array.from({length:17},(_,i)=>new T.Vector3(-.34+i*.0425,.11+Math.sin(i/16*Math.PI)*.065,z-.035)));
 town.add(new T.Mesh(new T.TubeGeometry(curve,24,.003,4,false),new T.MeshBasicMaterial({color:0x7ea898})));
 const bridge=new T.Group();for(const child of town.children.slice(firstChild))bridge.add(child);bridge.position.set(riverCenter(z),0,z);bridge.rotation.y=Math.atan(riverSlope(z));town.add(bridge);
 for(const child of bridge.children)child.position.z-=z;
 for(let x=-.33;x<=.33;x+=.025){const p=new T.Vector3(x,.106,.038).applyAxisAngle(new T.Vector3(0,1,0),bridge.rotation.y).add(bridge.position);lamps.push(p.x,p.y,p.z);}
}
for(let z=-.98;z<1;z+=.055)for(let side of [-1,1])lamps.push(riverCenter(z)+side*(riverWidth(z)/2+.027),.018,z);
pointCloud(lamps,0xffe1a5,.009);
// Small boats and a landmark: shared geometry keeps the town inexpensive.
for(let i=0;i<9;i++){const z=rand()*1.8-.9,x=riverCenter(z)+(rand()-.5)*.28;cube(x,.015,z,.035,.025,.07,roadmat);cube(x,.033,z,.023,.015,.038,new T.MeshBasicMaterial({color:0xc8ae77}));}
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

let running=false,previewing=false,time=0,nextLaunch=.8,cueIndex=0,burstQueue=[],burstSlots=new Set(),fireworks=[],audio=null,soundEngine=null,yaw=0,pitch=0,drag=null;
const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=32;const ctx=spriteCanvas.getContext('2d'),grad=ctx.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.2,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,32,32);const sprite=new T.CanvasTexture(spriteCanvas);
// A few rooftop warning lights add a quiet rhythm even between shows.
const roofSites=[];
for(const roof of rooftops.toSorted((a,b)=>b.y-a.y)){
 if(roofSites.length>=8)break;
 if(roofSites.every(other=>Math.hypot(other.x-roof.x,other.z-roof.z)>.38))roofSites.push(roof);
}
const roofPositions=[],roofColors=[];
roofSites.forEach(roof=>{for(const sx of [-1,1])for(const sz of [-1,1]){const x=roof.x+sx*(roof.w/2-.008),z=roof.z+sz*(roof.d/2-.008);cube(x,roof.y+.006,z,.004,.012,.004,mats[0]);roofPositions.push(x,roof.y+.015,z);roofColors.push(1,.012,.003);}});
const roofGeometry=new T.BufferGeometry();roofGeometry.setAttribute('position',new T.Float32BufferAttribute(roofPositions,3));roofGeometry.setAttribute('color',new T.Float32BufferAttribute(roofColors,3));
const roofLights=new T.Points(roofGeometry,new T.PointsMaterial({size:.020,map:sprite,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));town.add(roofLights);
function updateRoofLights(seconds){
 const colors=roofGeometry.attributes.color;
 for(let i=0;i<roofSites.length;i++){
 const phase=(seconds/(3.6+(i%3)*.25)+i*.237)%1;
 const brightness=.045+2.2*Math.pow(Math.max(0,Math.sin(phase*Math.PI*2)),6);
 for(let corner=0;corner<4;corner++)colors.setXYZ(i*4+corner,brightness,brightness*.012,brightness*.003);
 }colors.needsUpdate=true;
}
let showPlan=null,showNumber=0;
function prepareProgram(){const seed=crypto.getRandomValues(new Uint32Array(1))[0];showPlan=createProgram($('program').value,seed);showPlan.wideFinale=(++showNumber%3===0);$('programInfo').textContent=showPlan.name; }
function sound(explosion,x,z,size){soundEngine?.play(explosion,x,z,size,$('audioMode').value);}
function launch(kind='core',size=5,position=null){
 if(fireworks.length>=(position?.wide?9:8))return false;
 if(kind==='kiku'&&size!==3)return false;
 if(kind==='double'&&size!==10)return false;if(kind==='senrin'&&size!==10&&size!==20)return false;if(kind==='triple'&&size!==20)return false;if(size===20&&kind!=='triple'&&kind!=='senrin'&&!(kind==='silver'&&position?.wide))return false;
 const spec=TYPES[kind],scale=SIZES[size];if(!spec||!scale)return false;
 const z=position?.z??(rand()*1.6-.85),x=position?.x??(riverCenter(z)+(rand()>.5?1:-1)*(.12+rand()*.7));
 const y=scale.height+(position?.heightOffset??0),r=scale.radius,trailCount=kind==='kiku'?16:kind==='senrin'?4:kind==='sunflower'?36:kind==='silver'?12:10,directions=[],shells=[],starColors=[],clusterCenters=[],clusterDelays=[];
 const silverSeed=kind==='silver'?rand()*1000:0;
 const palette=shellPalette(kind,position?.palette),scheme=palette.colors.map(c=>new T.Color(c));
 for(let layer=0;layer<spec.radii.length;layer++){
 const count=Math.round(scale.stars*(position?.wide?.72:1)*(layer===0?1:layer===1?.6:.35));
 for(const xyz of sphere(count)){directions.push(new T.Vector3(...xyz));shells.push(spec.radii[layer]);starColors.push(scheme[layer]);}
 }
 if(kind==='silver'){
 // Sample once per shell; every frame and tail point keeps the same trajectory.
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(rand()*Math.PI*2,rand()*Math.PI*2,rand()*Math.PI*2));
 const stretch=new T.Vector3(.96+rand()*.08,.96+rand()*.08,.96+rand()*.08);
 for(const dir of directions)dir.applyQuaternion(rotation).multiply(stretch);
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
 if(kind==='senrin'){
 directions.length=0;shells.length=0;starColors.length=0;
 const childStars=sphere(24);
 sphere(30).forEach((center,cluster)=>{
 const radius=.70+.12*Math.sin(cluster*2.7);
 clusterCenters.push(new T.Vector3(...center).multiplyScalar(r*radius));clusterDelays.push(1.74+(cluster%7)*.035);
 for(const dir of childStars){directions.push(new T.Vector3(...dir));shells.push(1);starColors.push(scheme[cluster%scheme.length]);}
 });
 }
 const n=directions.length,positions=new Float32Array(n*trailCount*3),colors=new Float32Array(n*trailCount*3);
 // These per-star values are constant for the entire shell. Keep double precision.
 const silverVariation=kind==='silver'?Float64Array.from({length:n},(_,i)=>.96+.07*Math.sin((i+silverSeed)*2.37)):null;
 const silverLife=kind==='silver'?Float64Array.from({length:n},(_,i)=>5.3+.65*(.5+.5*Math.sin((i+silverSeed)*4.13))):null;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('color',new T.BufferAttribute(colors,3));
 const m=new T.PointsMaterial({size:kind==='senrin'?.012:kind==='willow'?.012:.015,map:sprite,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});const p=new T.Points(g,m);p.frustumCulled=false;town.add(p);
 const color=scheme[0],refl=new T.Mesh(riverRibbon(-1.04,1.04,1,.006),reflectionMaterial(color,scheme[1]||color));town.add(refl);
 const ascent=size===20?5.6:size===10?3.12:(1+size*.035)*1.2*(2.62/1.62);
 fireworks.push({x,z,y,r,color,n,kind,size,spec,ascent,trailCount,positions,colors,directions,shells,starColors,clusterCenters,clusterDelays,silverSeed,silverVariation,silverLife,g,m,p,refl,start:time,burst:false});sound(false,x,z,size);
 $('last').textContent=scale.label+' · '+spec.label+(palette.label?' · '+palette.label:'');
 return true;
}
function clearFireworks(){for(const f of fireworks){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();}fireworks=[];}
// Free expired launch slots and fire sounds before queued shots, without computing points.
function updateFireworkEvents(){for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 if(t>=0&&!f.burst)f.burst=true;
 const soundDelay=({3:.2,5:.5,10:1,20:1.5})[f.size]??0;
 if(t>=soundDelay&&!f.soundPlayed){f.soundPlayed=true;sound(true,f.x,f.z,f.size);}
 if(f.kind==='senrin'&&t>=f.clusterDelays[0]+soundDelay&&!f.childSoundPlayed){f.childSoundPlayed=true;soundEngine?.playSenrinChildren(f.x);}
 if(t>f.spec.life){town.remove(f.p,f.refl);f.g.dispose();f.m.dispose();f.refl.geometry.dispose();f.refl.material.dispose();fireworks.splice(k,1);continue;}
} }
function updateFireworks(){updateFireworkEvents();for(let k=fireworks.length-1;k>=0;k--){
 const f=fireworks[k],age=time-f.start,t=age-f.ascent;
 const fadeStart=f.spec.fadeStart??f.spec.life*.5;
 const fade=t<0?1:Math.pow(Math.max(0,1-Math.max(0,t-fadeStart)/(f.spec.life-fadeStart)),1.4);
 for(let i=0;i<f.n;i++)for(let j=0;j<f.trailCount;j++){
 const index=(i*f.trailCount+j)*3;let x,y,z,brightness;
 if(t<0){
 const trail=(i%24)*.003+j*.004,riseAge=f.kind==='silver'?Math.max(0,age-j*.03):age;
 x=f.x;y=Math.max(.02,f.y*(f.size<10?Math.pow(riseAge/f.ascent,.85):(1-Math.pow(1-Math.min(1,riseAge/(f.ascent-(f.size===20?.6:.28))),2)))-(f.kind==='silver'?0:trail));z=f.z;
 brightness=i<24?(1-j/f.trailCount)*(f.kind==='silver'?2.2:1.4):0;
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
 else if(f.kind==='senrin'){
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
 brightness=(t>=lag?1:0)*Math.pow(1-j/f.trailCount,1.7)*(j===0?2:.9);
 // Fade tails along with their heads so the whole break has a clean ending.
 }
 f.positions[index]=x;f.positions[index+1]=Math.max(.018,y);f.positions[index+2]=z;
 const col=f.starColors[i];if(f.kind==='senrin'&&t>=0&&t<.14){f.colors[index]=brightness;f.colors[index+1]=brightness*.84;f.colors[index+2]=brightness*.55;}else{f.colors[index]=col.r*brightness;f.colors[index+1]=col.g*brightness;f.colors[index+2]=col.b*brightness;}
 }
 f.g.attributes.position.needsUpdate=true;f.g.attributes.color.needsUpdate=true;f.m.opacity=fade;f.reflectionGain=t<0?0:fade*.9;
} }
let fanQueue=[],fans=[];
function clearFans(){for(const f of fans){town.remove(f.p);f.g.dispose();f.m.dispose();}fans=[];}
function launchFans(mode='fan'){
 soundEngine?.playCrackle(mode==='cross');
 const coords=new Float32Array(5*9*64*3),colors=new Float32Array(coords.length),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(coords,3));g.setAttribute('color',new T.BufferAttribute(colors,3));
 let ci=0;for(let site=0;site<5;site++)for(let ray=0;ray<9;ray++)for(let tail=0;tail<64;tail++){const palette=[0xff527d,0x7de9e3,0xffd38a,0xb8df91,0xff9261,0xd7b1ff];const c=new T.Color(tail<6?0xff6472:palette[(site+Math.floor(ray/2))%palette.length]);const gain=Math.pow(1-tail/64,.8);colors.set([c.r*gain,c.g*gain,c.b*gain],ci);ci+=3;}
 const m=new T.PointsMaterial({color:0xffffff,vertexColors:true,size:.012,map:sprite,transparent:true,depthWrite:false,blending:T.AdditiveBlending});const p=new T.Points(g,m);p.frustumCulled=false;town.add(p);fans.push({p,g,m,coords,mode,start:time});
}
function updateFans(){
 while(fanQueue.length&&fanQueue[0].at<=time){const cue=fanQueue.shift();launchFans(cue.mode);}
 for(let i=fans.length-1;i>=0;i--){const f=fans[i],age=time-f.start;if(age>3.8){town.remove(f.p);f.g.dispose();f.m.dispose();fans.splice(i,1);continue;}
 let index=0;for(let site=0;site<5;site++)for(let ray=0;ray<9;ray++)for(let tail=0;tail<64;tail++){
 const t=Math.max(0,age-tail*.025),cross=f.mode==='cross',angle=cross?(ray<4?-.82:.82)+(ray%4-1.5)*.035:(ray-4)*.15,v=cross?.84:.54;
 const x=-.8+site*.4+1.4*Math.sin(angle)*v*t,y=.05+1.4*(Math.cos(angle)*v*t-(cross?.45:.32)*t*t),z=-.35+site*.1;
 f.coords.set([x,Math.max(.018,y),z],index);index+=3;
 }f.g.attributes.position.needsUpdate=true;f.m.opacity=age<2.1?1:Math.max(0,1-(age-2.1)/1.7);
 }
}
function startRandomStarmine(plan,index=0){
 const sequence=randomStarmine(plan,time,index,$('mood').value==='lively');
 burstQueue=sequence.shots;fanQueue.push(...sequence.fans);fanQueue.sort((a,b)=>a.at-b.at);nextLaunch=sequence.nextLaunch;
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
 for(const [offset,mode] of [[0,'fan'],[2.4,'cross'],[4.8,'fan']])fanQueue.push({at:time+offset,mode});if(finale)fanQueue.push({at:time+14.5,mode:'cross'});
 $('last').textContent='スターマイン · 連続打ち';
}
function advanceStarmine(){
 while(burstQueue.length&&burstQueue[0].at<=time){const shot=burstQueue[0];if(!launch(shot.kind,shot.size,shot.position))break;burstQueue.shift();}
}
function stopShow(){
 running=false;previewing=false;showPlan=null;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();time=0;cueIndex=0;nextLaunch=.8;
 if(audio){audio.close();audio=null;soundEngine=null;}
 $('play').textContent='花火大会を始める';$('chapter').textContent='大会を終了';$('last').textContent='街の灯りだけを眺める';$('status').textContent='花火大会を止めました。次は最初から始まります。';
}
function resetAll(){
 stopShow();const defaults={mood:'quiet',ending:'loop',volume:'0.3',scale:'1',distance:'2',height:'0',roomBrightness:'1',type:'core',size:'5',palette:'original',towerColor:'blue',audioMode:'original',program:'one'};
 for(const [id,value] of Object.entries(defaults))$(id).value=value;
 try{localStorage.removeItem('hanabi-town-settings');}catch{}
 town.scale.setScalar(1);town.position.set(0,0,0);town.rotation.y=0;yaw=0;pitch=0;camera.position.set(0,1.2,2.9);setTowerColor();syncSize();syncPalette();applyRoomBrightness();
 if(renderer.xr.isPresenting)placeTown();
 $('chapter').textContent='幕開け · 0:00';$('last').textContent='次の一玉を待つ';$('status').textContent='設定と視点を初期状態に戻しました。';
}
function restart(){previewing=false;showPlan=null;fanQueue=[];clearFans();clearFireworks();burstQueue=[];burstSlots.clear();time=0;nextLaunch=.8;cueIndex=0;$('last').textContent='次の一玉を待つ';if(!running)toggle();else prepareProgram();}
function beginPreview(){
 running=false;previewing=true;showPlan=null;time=0;cueIndex=0;nextLaunch=.8;
 clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();
 $('play').textContent='花火大会を始める';$('chapter').textContent='試し打ち';$('last').textContent='次の一玉を待つ';
 $('status').textContent='試し打ち中。選んだ花火だけを上げます。';ensureAudio();
}
function advance(dt){
 if(previewing){
  time+=dt;updateFireworkEvents();advanceStarmine();updateFans();updateFireworks();return;
 }
 time=Math.min(300,time+dt);
 for(const [index,at] of (showPlan?.senrinAt??[]).entries()){
 const key='senrin-'+index;
 if(time>=at&&!burstSlots.has(key)&&fireworks.length===0&&burstQueue.length===0){
 burstSlots.add(key);clearFans();fanQueue=[];const size=index===0?10:20;launch('senrin',size,{x:index===0?-.35:.35,z:-.1});nextLaunch=time+(size===20?16:11);
 $('status').textContent='彩色千輪：暗い間のあと、30輪が咲きます。';break;
 }
 }

 if(time>=(showPlan?.bigAt??130)&&!burstSlots.has('big')&&fireworks.length===0){burstSlots.add('big');clearFireworks();clearFans();burstQueue=[];fanQueue=[];launch('triple',20,{x:0,z:-.1});nextLaunch=time+17;$('status').textContent='特別玉：二尺玉・三重芯。ゆっくり開く一発をお楽しみください。';}
 for(const slot of (showPlan?.slots??[45,200,250,270]))if(time>=slot&&!burstSlots.has(slot)&&(showPlan?.mode!=='random'||(fireworks.length===0&&burstQueue.length===0))){burstSlots.add(slot);startStarmine(slot===270);break;}
 updateFireworkEvents();advanceStarmine();updateFans();
 const awaitingSpecial=(time>=(showPlan.bigAt-10)&&!burstSlots.has('big'))||showPlan.senrinAt.some((at,index)=>time>=at-10&&!burstSlots.has('senrin-'+index));
 const awaitingPattern=showPlan.mode==='random'&&showPlan.slots.some(slot=>time>=slot-10&&!burstSlots.has(slot));
 if(!burstQueue.length&&time>=nextLaunch&&time<285&&!awaitingSpecial&&!awaitingPattern){const c=programCue(showPlan,time,cueIndex,$('mood').value==='lively');if(c&&launch(c.kind,c.size,c.position)){cueIndex++;nextLaunch=time+c.interval+((1+c.size*.035)*1.2*(2.62/1.62)-(1+c.size*.035)*1.2);}}
 updateFireworks();
 const elapsed=Math.min(300,Math.floor(time));$('chapter').textContent=chapter(Math.min(time,299))+' · '+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
 if(time>=300){if($('ending').value==='loop'){clearFireworks();clearFans();fanQueue=[];burstQueue=[];burstSlots.clear();time=0;nextLaunch=2;cueIndex=0;prepareProgram();}else{running=false;$('play').textContent='花火大会を始める';$('status').textContent='大会が終わりました。街の灯りをお楽しみください。';}}
}
function updateReflections(){
 town.updateWorldMatrix(true,false);
 for(const f of fireworks){const u=f.refl.material.uniforms;u.uCenter.value.set(f.x,f.y,f.z);town.localToWorld(u.uCenter.value);u.uRadius.value=f.r*town.scale.x;u.uWaterY.value=town.position.y+.006*town.scale.y;u.uGain.value=f.reflectionGain||0;u.uTime.value=time;}
}
function placeTown(){if(renderer.xr.isPresenting)pendingPlace=true;}
function ensureAudio(){
 if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();soundEngine=new FireworkAudio(audio,Number($('volume').value));}
 audio.resume().catch(e=>{$('status').textContent='音声を開始できませんでした：'+e.message;});
}
function toggle(){if(previewing){previewing=false;time=0;cueIndex=0;nextLaunch=.8;clearFireworks();clearFans();burstQueue=[];fanQueue=[];burstSlots.clear();}if(!running&&!showPlan)prepareProgram();running=!running;$('play').textContent=running?'ひと休み':'花火大会を始める';$('status').textContent=running?'オート大会を鑑賞中。操作せず、そのまま眺めてください。':'夜の街で、ひと休み。';if(running)ensureAudio();}
$('play').disabled=false;$('play').textContent='花火大会を始める';$('play').onclick=()=>{if(time>=300)restart();else toggle();};$('restart').onclick=restart;$('stop').onclick=stopShow;$('reset').onclick=resetAll;
let fanPreviewCross=false;$('fans').onclick=()=>{beginPreview();launchFans(fanPreviewCross?'fan':'cross');fanPreviewCross=!fanPreviewCross;};
$('big').onclick=()=>{beginPreview();launch('triple',20,{x:0,z:-.1});};
$('finale').onclick=()=>{beginPreview();startStarmine(true,false);};
$('wideFinale').onclick=()=>{beginPreview();startStarmine(true,true);$('status').textContent='特別な締め：5号5発 → 0.6秒後に尺玉3発 → 頂上の二尺玉1発。';};
$('starmine').onclick=()=>{beginPreview();if($('program').value==='random')startRandomStarmine(createProgram('random',crypto.getRandomValues(new Uint32Array(1))[0]));else startStarmine(false,false);};
$('sample').onclick=()=>{beginPreview();syncSize();const ok=launch($('type').value,Number($('size').value),{x:0,z:.05,palette:$('palette').value});$('status').textContent=ok?'選んだ一玉を打ち上げています。':'この組み合わせを上げられません。種類と号数を確認してください。';};$('status').textContent='川と橋のある街へ、ようこそ。';
$('program').onchange=()=>{$('status').textContent=showPlan?'次の大会から「'+PROGRAM_NAMES[$('program').value]+'」で始まります。「大会を最初から」で今すぐ切り替えられます。':'「'+PROGRAM_NAMES[$('program').value]+'」を選びました。';};
$('audioMode').onchange=async()=>{if($('audioMode').value==='reference'){try{if(soundEngine)await soundEngine.ready;$('status').textContent='録音参考版：開花音を録音の切り出しで比較。打ち上げ音は現在のままです。';}catch{$('audioMode').value='original';$('status').textContent='参考音を読み込めませんでした。現在の音へ戻しました。';}}else $('status').textContent=$('audioMode').value==='realistic'?'リアル寄せ合成：号数別の開花音と、短い破裂・噴出の打ち上げ音を比較できます。':'現在の合成音へ戻しました。';};
$('volume').oninput=()=>soundEngine?.setVolume(Number($('volume').value));
function applyTownHeight(){if(renderer.xr.isPresenting)town.position.y=Number($('height').value)-groundBottomY*town.scale.y;}
function adjustTownDistance(){
 if(!renderer.xr.isPresenting||!latestViewerTransform)return;
 const p=latestViewerTransform.position,d=Number($('distance').value);
 town.position.x=p.x-Math.sin(town.rotation.y)*d;town.position.z=p.z-Math.cos(town.rotation.y)*d;
}
$('scale').oninput=()=>{town.scale.setScalar(Number($('scale').value));applyTownHeight();};$('distance').oninput=adjustTownDistance;
function previewPointer(e,activate=false){const r=canvas.getBoundingClientRect();return mrPanel.previewPointer((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2,camera,activate);}
canvas.onpointerdown=e=>{if(panelPreview){previewPointer(e,true);canvas.setPointerCapture(e.pointerId);return;}drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(panelPreview){previewPointer(e);return;}if(!drag)return;yaw+=(e.clientX-drag[0])*.003;pitch=Math.max(-.35,Math.min(.35,pitch+(e.clientY-drag[1])*.002));drag=[e.clientX,e.clientY];};canvas.onpointerup=()=>{drag=null;if(panelPreview)mrPanel.release();};canvas.onpointercancel=()=>{drag=null;if(panelPreview)mrPanel.release();};canvas.onwheel=e=>{if(!renderer.xr.isPresenting)camera.position.z=Math.max(1.6,Math.min(5,camera.position.z+e.deltaY*.002));};
const xrControllers=[];for(let i=0;i<2;i++){const c=renderer.xr.getController(i);let handedness='';c.addEventListener('connected',e=>handedness=e.data.handedness);c.addEventListener('selectstart',()=>{if(!renderer.xr.isPresenting)return;if(mrPanel.select(c))return;if(handedness==='left')placeTown();else if(previewing)return;else if(time>=300)restart();else toggle();});scene.add(c);xrControllers.push(c);}
// Keep the next visit ready for viewing, without saving transient show state.
function syncSize(){const kind=$('type').value;for(const o of $('size').options)o.disabled=kind==='kiku'?o.value!=='3':kind==='triple'?o.value!=='20':kind==='senrin'?!['10','20'].includes(o.value):kind==='double'?o.value!=='10':o.value==='20';if(kind==='kiku')$('size').value='3';else if(kind==='triple')$('size').value='20';else if(kind==='double')$('size').value='10';else if(kind==='senrin'){if(!['10','20'].includes($('size').value))$('size').value='10';}else if($('size').value==='20')$('size').value='5';}
function syncPalette(){
 const kind=$('type').value,select=$('palette'),previous=select.value,options=paletteOptions(kind);
 select.replaceChildren(...(options.length?options:[{id:'original',label:'この花火の配色'}]).map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.label;return option;}));
 select.disabled=!options.length;select.value=options.some(p=>p.id===previous)?previous:'original';
}
$('type').addEventListener('change',()=>{syncSize();syncPalette();});
const settingsIds=['program','mood','ending','volume','scale','distance','height','roomBrightness','type','size','palette','towerColor','audioMode'];
try{const saved=JSON.parse(localStorage.getItem('hanabi-town-settings')||'{}');for(const id of settingsIds){if(id==='palette')syncPalette();const el=$(id);if(saved[id]!==undefined){const old=el.value;el.value=saved[id];if(el.value==='')el.value=old;}}town.scale.setScalar(Number($('scale').value));}catch{}
setTowerColor();syncSize();syncPalette();$('programInfo').textContent=PROGRAM_NAMES[$('program').value];
for(const id of settingsIds)$(id).addEventListener('change',()=>{try{localStorage.setItem('hanabi-town-settings',JSON.stringify(Object.fromEntries(settingsIds.map(id=>[id,$(id).value]))));}catch{}});
let pendingPlace=false,mrStarting=false,mrSession=null,mrMetrics=null,mrMeta=null,lastMRReport=null,latestViewerTransform=null,pendingPanelOpen=false;
const desktopCamera={position:new T.Vector3(),quaternion:new T.Quaternion(),fov:55};
$('height').oninput=applyTownHeight;
function applyRoomBrightness(){
 $('roomBrightnessValue').textContent=Math.round(Number($('roomBrightness').value)*100)+'％';
 mrDimming.set($('roomBrightness').value,mrSession?.environmentBlendMode);
}
$('roomBrightness').oninput=applyRoomBrightness;applyRoomBrightness();
$('mrPreset').onclick=()=>{
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
 const result={running,chapter:$('chapter').textContent,last:$('last').textContent,status:$('status').textContent,metric:$('mrInfo').textContent};
 for(const id of ['program','mood','ending','type','size','palette','audioMode','towerColor']){
  const el=$(id);result[id]={value:el.value,selected:el.selectedOptions[0]?.textContent??'',options:[...el.options].map(o=>({value:o.value,disabled:o.disabled}))};
 }
 for(const id of ['scale','distance','height','volume','roomBrightness'])result[id]={value:Number($(id).value)};
 return result;
}
function cyclePanel(id,direction){
 const el=$(id),value=nextEnabledOption([...el.options].map(o=>({value:o.value,disabled:o.disabled})),el.value,direction);
 if(value===el.value)return;el.value=value;el.dispatchEvent(new Event('change'));
}
function adjustPanel(id,direction){
 const el=$(id);el.value=String(stepRange(Number(el.value),direction,Number(el.min),Number(el.max),id==='volume'?.05:Number(el.step)));
 el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));
}
function setPanelRange(id,value,commit=false){
 const el=$(id);el.value=String(clampBrightness(value));el.dispatchEvent(new Event('input'));
 if(commit)el.dispatchEvent(new Event('change'));
}
async function exitMRToPage(){
 if(panelPreview){mrPanel.end();return;}
 if(!mrSession)return;
 try{await mrSession.end();}catch(e){$('status').textContent='MRを終了できませんでした：'+e.message;}
}
const mrPanel=new MRPanel({scene,read:readPanel,click:id=>$(id).click(),cycle:cyclePanel,adjust:adjustPanel,place:placeTown,exit:exitMRToPage,set:setPanelRange,pageChanged:page=>{if(page===1)beginPreview();}});
for(const c of xrControllers)mrPanel.attach(c);
if(panelPreview){
 const previewStyle=document.createElement('style');previewStyle.textContent='body.mr-panel-preview header,body.mr-panel-preview aside,body.mr-panel-preview footer{display:none}';document.head.append(previewStyle);document.body.classList.add('mr-panel-preview');
 camera.lookAt(0,.55,0);camera.updateMatrixWorld();
 mrPanel.active=true;mrPanel.preview=true;mrPanel.openAt({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},{side:0,distance:1.45,drop:.3});
 addEventListener('keydown',e=>{if(e.key.toLowerCase()==='x'){mrPanel.active=true;mrPanel.preview=true;if(mrPanel.visible)mrPanel.close();else mrPanel.openAt({position:camera.position.clone(),matrix:[...camera.matrixWorld.elements]},{side:0,distance:1.45,drop:.3});}});
}
async function checkMR(){
 if(!isSecureContext){$('mr').textContent='MRにはHTTPSかQuestのlocalhostが必要';$('mrInfo').textContent='LANの通常HTTPではMRを開始できません。';return;}
 if(!navigator.xr){$('mr').textContent='QuestでMRを体験';$('mrInfo').textContent='WebXRがありません。Quest Browserで開いてください。';return;}
 try{const ok=await navigator.xr.isSessionSupported('immersive-ar');$('mr').disabled=!ok;$('mr').textContent=ok?'自分の部屋で見る':'このブラウザはMR非対応';$('mrInfo').textContent=ok?'MR対応。実機の表示・音・性能は、開始して確認してください。':'このブラウザでのMR実機計測はありません。';}catch(e){$('mr').textContent='MR対応を確認できませんでした';$('mrInfo').textContent=e.name+'：'+e.message;}
}
function finishMR(){
 pendingPlace=false;pendingPanelOpen=false;mrStarting=false;mrSession=null;latestViewerTransform=null;mrPanel.end();mrDimming.end();town.visible=true;
 if(running){running=false;$('play').textContent='花火大会を始める';$('status').textContent='MRを終了して元のページへ戻りました。大会は一時停止しています。';}
 scene.background=new T.Color(0x050a16);scene.fog=new T.FogExp2(0x050a16,.085);renderer.setClearColor(0x050a16,1);
 town.position.set(0,0,0);town.rotation.y=0;camera.position.copy(desktopCamera.position);camera.quaternion.copy(desktopCamera.quaternion);camera.fov=desktopCamera.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();previous=0;
 lastMRReport=mrReport();$('mr').disabled=false;$('mr').textContent='自分の部屋で見る';
 const rows=mrMetrics?.samples??[];$('mrInfo').textContent=rows.length?'MR終了。'+rows.length+'区間を計測、花火の最大粒子数 '+mrMetrics.peakParticles.toLocaleString()+'点。計測結果を保存できます。':'MR終了。計測できた区間はありません。';$('mrExport').disabled=!mrMetrics;
}
$('mr').onclick=async()=>{
 if(mrStarting||mrSession)return;mrStarting=true;$('mr').disabled=true;
 let session;
 try{
 // Resume audio in the button gesture, before awaiting requestSession.
 ensureAudio();desktopCamera.position.copy(camera.position);desktopCamera.quaternion.copy(camera.quaternion);desktopCamera.fov=camera.fov;
 session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['local-floor']});
 session.addEventListener('end',finishMR,{once:true});
 session.addEventListener('visibilitychange',()=>{previous=0;mrMetrics?.breakWindow();if(session.visibilityState!=='visible')mrPanel.release();});
 await renderer.xr.setSession(session);mrSession=session;mrStarting=false;mrMetrics=new XRMetrics();
 mrMeta={build:'1.0.0-beta.3',startedAt:new Date().toISOString(),environmentBlendMode:session.environmentBlendMode,userAgent:navigator.userAgent,measurement:'XR callback FPS and animation/UI update + render CPU time; not GPU/compositor FPS',initialSettings:mrSettings(),placements:[]};
 scene.background=null;scene.fog=null;renderer.setClearColor(0x000000,0);town.visible=false;pendingPlace=true;pendingPanelOpen=true;previous=0;applyRoomBrightness();
 $('mrExport').disabled=false;
 if(!running&&!previewing){if(time>=300)restart();else toggle();}
 }catch(e){if(session)await session.end().catch(()=>{});mrStarting=false;$('mr').disabled=false;$('status').textContent='MRを開始できませんでした：'+e.name+'：'+e.message;}
};checkMR();
let previous=0;renderer.setAnimationLoop((stamp,frame)=>{
 const session=renderer.xr.getSession();const pose=frame?frame.getViewerPose(renderer.xr.getReferenceSpace()):null;
 const xrVisible=!session||(session.visibilityState==='visible'&&pose!==null);
 if(pose)latestViewerTransform=pose.transform;
 const dt=previous&&xrVisible?Math.min((stamp-previous)/1000,.05):0;previous=xrVisible?stamp:0;
 if(pendingPlace&&pose){
  const placement=placementFromPose(pose.transform,Number($('distance').value),Number($('height').value),town.rotation.y,-groundBottomY*town.scale.y);
  town.position.set(placement.x,placement.y,placement.z);town.rotation.y=placement.yaw;town.visible=true;pendingPlace=false;
  mrMeta?.placements.push({showTime:time,...mrSettings(),eyeHeight:placement.eyeHeight});
 }
 if(pendingPanelOpen&&pose){mrPanel.begin(pose.transform);pendingPanelOpen=false;}
 const updateStart=performance.now();
 if((running||previewing)&&xrVisible)advance(dt);
 if(!renderer.xr.isPresenting){const target=new T.Vector3(Math.sin(yaw)*1.2,.55+pitch,0);camera.lookAt(target);}
 if(xrVisible)towerLighting.update(dt);updateRoofLights(stamp/1000);updateReflections();if(frame&&xrVisible)mrPanel.update(stamp,frame,renderer.xr.getReferenceSpace(),pose?.transform);else if(panelPreview)mrPanel.update(stamp,null,null,null);const renderStart=performance.now();renderer.render(scene,camera);
 if(frame&&mrMetrics&&xrVisible){
  const row=mrMetrics.record(stamp,{particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),calls:renderer.info.render.calls,renderMs:performance.now()-renderStart,updateMs:renderStart-updateStart,showTime:time,frameRate:session.frameRate});
  if(row)$('mrInfo').textContent='MR計測：'+row.fps+'fps ／ p95 '+row.p95FrameMs+'ms ／ 花火 '+row.particles.toLocaleString()+'点';
 }else if(frame&&mrMetrics)mrMetrics.breakWindow();
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.__hanabi={get state(){return{running,previewing,time,active:fireworks.length,buildings:town.children.length,xr:renderer.xr.isPresenting,queued:burstQueue.length,fans:fans.length,particles:fireworks.reduce((n,f)=>n+f.n*f.trailCount,0),shots:fireworks.map(f=>({kind:f.kind,size:f.size,layers:f.spec.radii.length,radius:f.r,ascent:f.ascent})),geometries:renderer.info.memory.geometries};},get mrReport(){return mrReport();},launch,advance,clearFireworks,restart};

$('build').textContent='ベータ版1号・改良2 · 1.0.0-beta.3';
