import * as T from './vendor/three.module.js';

export function manualPointCost(kind,size,sizes,types){
 const spec=types[kind],scale=sizes[size];if(!spec||!scale)return Infinity;
 const stars=kind==='sunflower'?232:kind==='senrin'?720:spec.radii.reduce((sum,_,i)=>sum+Math.round(scale.stars*(spec.layerWeights?.[i]??(i===0?1:i===1?.6:.35))),0);
 return stars*(kind==='ear'?48:kind==='kiku'?16:kind==='senrin'?4:kind==='sunflower'?36:kind==='silver'?12:10);
}

// A generous allocation bound, plus measured delivered XR callbacks. Neither
// shrinks existing shells nor rejects a shot merely for dropping below 30fps.
export class ManualLaunchBudget{
 constructor(){this.maxPoints=180000;this.reset();}
 reset(){this.previous=null;this.elapsed=0;this.frames=0;this.blocked=false;this.fps=null;}
 observe(stamp,active){
  if(!active){this.previous=null;this.elapsed=0;this.frames=0;return;}
  if(this.previous!==null){const gap=stamp-this.previous;if(gap>0){this.elapsed+=gap;this.frames++;}}
  this.previous=stamp;
  if(this.elapsed>=1000){this.fps=this.frames*1000/this.elapsed;if(this.fps<12)this.blocked=true;else if(this.fps>=20)this.blocked=false;this.elapsed=0;this.frames=0;}
 }
 accepts(points){return !this.blocked&&Number.isFinite(points)&&points<=this.maxPoints;}
}

// Launch strips along the banks and behind the last row of buildings.
// Pick by aim, without consuming the town or fireworks random streams.
export function emberTarget(town,origin,direction){
 town.updateWorldMatrix(true,false);
 const start=town.worldToLocal(origin.clone());
 const forward=town.worldToLocal(origin.clone().add(direction)).sub(start).normalize();
 const candidates=[];
 for(let i=0;i<12;i++){
  const z=-.8+i*.12;if([-.58,.05,.67].some(bridge=>Math.abs(z-bridge)<.09))continue;
  const center=.22*Math.sin(z*2.7+.35),width=.49+.075*Math.cos(z*2.5-.5);
  for(const side of [-1,1])candidates.push(new T.Vector3(center+side*(width/2+.028),.02,z));
 }
 // The back strip permits a broad left-to-right row without putting a
 // landing point in a building or in the water.
 for(let x=-1.4;x<=1.401;x+=.20){const z=-1.01,center=.22*Math.sin(z*2.7+.35),width=.49+.075*Math.cos(z*2.5-.5);if(Math.abs(x-center)>width/2+.015)candidates.push(new T.Vector3(x,.02,z));}
 const buildings=town.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.scale.y>.07&&o.position.y>.04);
 const sites=candidates.filter(point=>!buildings.some(b=>Math.abs(point.x-b.position.x)<b.scale.x/2+.005&&Math.abs(point.z-b.position.z)<b.scale.z/2+.005));
 let groundAim=null;
 if(forward.y<-.06){const distance=(.02-start.y)/forward.y;if(distance>0)groundAim=start.clone().addScaledVector(forward,distance);}
 let best=sites[0],score=Infinity;
 for(const point of sites){
  const delta=point.clone().sub(start),distance=delta.length();
  const value=groundAim?point.distanceToSquared(groundAim):1-delta.normalize().dot(forward)+distance*.025;
  if(value<score){score=value;best=point;}
 }
 return {start,forward,target:best.clone()};
}

// One small, reusable point cloud; no per-frame geometry or textures.
// Local paths follow a moved town; world rendering keeps the glow legible
// both beside a miniature and from the bridge, without a 100x point size.
export class TriggerEmbers{
 constructor({scene,town,map}){
  this.town=town;this.pending=[];this.capacity=32;this.pointsPerShot=24;
  this.positions=new Float32Array(this.capacity*this.pointsPerShot*3);
  this.colors=new Float32Array(this.positions.length);
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,3));
  this.material=new T.PointsMaterial({size:6,sizeAttenuation:false,map,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.points=new T.Points(this.geometry,this.material);this.points.frustumCulled=false;this.points.visible=false;scene.add(this.points);
  this.local=new T.Vector3();this.world=new T.Vector3();
 }
 get count(){return this.pending.length;}
 send(hand,shell,origin,direction){
  if(this.count>=this.capacity||!origin?.isVector3||!direction?.isVector3||direction.lengthSq()<.001||![...origin.toArray(),...direction.toArray()].every(Number.isFinite))return false;
  const {start,forward,target}=emberTarget(this.town,origin,direction);
  const distance=start.distanceTo(target),p1=start.clone().addScaledVector(forward,Math.min(.42,distance*.32));
  const p2=target.clone().lerp(start,.18);p2.y+=Math.max(.12,Math.abs(start.y-target.y)*.20);
  this.pending.push({hand,shell:{...shell},target,curve:new T.CubicBezierCurve3(start,p1,p2,target),age:0,flight:this.town.scale.x>10?.70:.55,pause:.25});
  this.draw();return true;
 }
 update(dt,launch){
  for(const shot of [...this.pending]){
   shot.age+=Math.max(0,dt);
   if(shot.age+1e-9>=shot.flight+shot.pause){this.pending.splice(this.pending.indexOf(shot),1);launch(shot);}
  }
  this.draw();
 }
 draw(){
  this.points.visible=this.count>0;if(!this.count)return;
  this.town.updateWorldMatrix(true,false);let n=0;
  for(const shot of this.pending)for(let i=0;i<this.pointsPerShot;i++){
   let brightness;
   if(shot.age<shot.flight){
    const t=Math.max(0,(shot.age-i*.006)/shot.flight);shot.curve.getPoint(Math.min(1,t),this.local);
    brightness=i===0?1.6:Math.pow(1-i/this.pointsPerShot,2)*.45*(shot.age>=i*.006?1:0);
   }else{
    this.local.copy(shot.target);const fade=1-(shot.age-shot.flight)/shot.pause;
    if(i>0){const angle=i*Math.PI*2/(this.pointsPerShot-1),radius=.008+(1-fade)*.028;this.local.x+=Math.cos(angle)*radius;this.local.z+=Math.sin(angle)*radius;}
    brightness=Math.max(0,fade)*(i===0?1.8:.32);
   }
   this.world.copy(this.local).applyMatrix4(this.town.matrixWorld);
   this.positions[n]=this.world.x;this.colors[n++]=brightness;
   this.positions[n]=this.world.y;this.colors[n++]=brightness*.60;
   this.positions[n]=this.world.z;this.colors[n++]=brightness*.15;
  }
  this.geometry.setDrawRange(0,n/3);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;
 }
 clear(){this.pending.length=0;this.points.visible=false;this.geometry.setDrawRange(0,0);}
}
