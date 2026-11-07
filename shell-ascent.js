import * as T from './vendor/three.module.js';
import {ascentWobble,shellAscentSeed,wobbleParameters,sampleAscentWobble} from './ascent-wobble.js?v=1.3.26';
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export const ASCENT_PROFILE=Object.freeze({width:.0025,headSize:.012,tailLife:1.20,samples:480,wobble:.0025});
export function shellAscentProfile(size){
 return {...ASCENT_PROFILE,...(size===3?{width:.0040,headSize:.016,tailLife:.055,shortFireball:true}:size===5?{width:.0045,headSize:.018,tailLife:.08,shortFireball:true}:size===20?{width:ASCENT_PROFILE.width*1.6,headSize:ASCENT_PROFILE.headSize*1.2}:{} )};
}
// Keep the authored opening time. The light arrives and goes out earlier,
// leaving a short dark anticipation before the same scheduled break.
export function shellAscentTiming(shell){
 const anticipation=shell.size===20||(shell.size===10&&((shellAscentSeed(shell)>>>2)%4===0));
 const lead=anticipation?(shell.size===20?.78:.42):0,fadeDuration=anticipation?(shell.size===20?.18:.14):0;
 const riseDuration=Math.max(.2,shell.ascent-lead),extinguishAt=riseDuration+fadeDuration;
 return {anticipation,riseDuration,fadeDuration,extinguishAt:anticipation?extinguishAt:shell.ascent,darkGap:anticipation?shell.ascent-extinguishAt:0,openingAt:shell.ascent};
}
// Fixed birth positions form a ribbon; no duplicate shell-star points are used.
// The opening time and destination are still the actual shell's own values.
export function shellAscentPosition(shell,age){
 const timing=shell.ascentTiming??shellAscentTiming(shell),u=clamp(age/timing.riseDuration),lift=shell.size<10?Math.pow(u,.85):1-(1-u)*(1-u);
 const seed=shellAscentSeed(shell),at=Math.min(age,timing.riseDuration),factor=shell.size<10?.4:1;
 const wobble=(axis)=>shell.ascentWaves?sampleAscentWobble(at,timing.riseDuration,shell.ascentWaves[axis]):ascentWobble(at,timing.riseDuration,seed,axis);
 return {x:shell.launchX+(shell.x-shell.launchX)*u+wobble(0)*factor,y:.02+(shell.y-.02)*lift,z:shell.launchZ+(shell.z-shell.launchZ)*u+wobble(1)*factor};
}
export class ShellAscent{
 constructor(town,shell,bridge,map){
  Object.assign(this,{town,shell});this.profile=shellAscentProfile(shell.size);this.seed=shellAscentSeed(shell);this.timing=shellAscentTiming(shell);shell.ascentTiming=this.timing;shell.ascentWaves=[wobbleParameters(this.seed,0),wobbleParameters(this.seed,1)];this.cameraPosition=new T.Vector3();this.stats={vertices:0,headVisible:false};
  this.positions=new Float32Array(ASCENT_PROFILE.samples*6*3);this.colors=new Float32Array(this.positions.length);
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,3).setUsage(T.DynamicDrawUsage));this.geometry.setDrawRange(0,0);
  this.material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});this.mesh=new T.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;
  this.headGeometry=new T.BufferGeometry();this.headGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(3),3));
  this.headMaterial=new T.PointsMaterial({size:this.profile.headSize,color:0xffe5b0,map,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  // A compact bright core, with a faint halo, rather than a soft large bulb.
  this.headMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_particle_fragment>',`float radius=length(gl_PointCoord-vec2(.5))*2.0;
   diffuseColor.a*=min(1.0,1.0-smoothstep(.06,.35,radius)+.035*(1.0-smoothstep(.12,.9,radius)));`);};
  this.headMaterial.customProgramCacheKey=()=> 'shell-ascent-crisp-v1';bridge.point(this.headMaterial);
  this.head=new T.Points(this.headGeometry,this.headMaterial);this.head.frustumCulled=false;this.mesh.visible=this.head.visible=false;town.add(this.mesh,this.head);
 }
 sample(birth,age){
  const elapsed=age-birth;if(birth<0||birth>=this.timing.riseDuration||elapsed<0||elapsed>=this.profile.tailLife)return null;
  const p=shellAscentPosition(this.shell,birth),warm=elapsed/this.profile.tailLife;
  const flame=this.profile.shortFireball;
  const flicker=flame?(.90+.10*Math.sin(birth*87+this.seed*.00001)) : 1;
  return {...p,y:p.y-.012*elapsed*elapsed,light:(this.timing.anticipation?1-smooth((age-this.timing.riseDuration)/this.timing.fadeDuration):1)*smooth(birth/.055)*(flame?Math.pow(1-warm,1.1):1-smooth((warm-.42)/.58))*flicker,warm,birth};
 }
 update(age,camera){
  camera.getWorldPosition(this.cameraPosition);this.town.worldToLocal(this.cameraPosition);const eye=this.cameraPosition;
  const dt=this.timing.riseDuration/ASCENT_PROFILE.samples;let count=0;
  const first=Math.max(0,Math.floor((age-this.profile.tailLife)/dt));
  for(let i=first;i<ASCENT_PROFILE.samples;i++){
   const t0=i*dt,t1=Math.min((i+1)*dt,age,this.timing.riseDuration-1e-9);if(t1<=t0)break;
   const a=this.sample(t0,age),b=this.sample(t1,age);if(!a||!b||Math.max(a.light,b.light)<.001)continue;
   const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,mz=(a.z+b.z)/2;
   const ex=eye.x-mx,ey=eye.y-my,ez=eye.z-mz;let ax=dy*ez-dz*ey,ay=dz*ex-dx*ez,az=dx*ey-dy*ex;const length=Math.hypot(ax,ay,az)||1;
   const width=this.profile.width/2;ax=ax/length*width;ay=ay/length*width;az=az/length*width;
   for(const [p,sign] of [[a,1],[a,-1],[b,1],[b,1],[a,-1],[b,-1]]){const k=count++*3;
    // A warm ragged flame narrows backwards, rather than a uniform oval pill.
    const taper=this.profile.shortFireball?Math.pow(1-p.warm,.65)*(.90+.10*Math.sin(p.birth*61+this.seed*.00003)):1;
    this.positions[k]=p.x+sign*ax*taper;this.positions[k+1]=p.y+sign*ay*taper;this.positions[k+2]=p.z+sign*az*taper;this.colors[k]=p.light*.78;this.colors[k+1]=p.light*(.67-.25*p.warm);this.colors[k+2]=p.light*(.40-.29*p.warm);}
  }
  this.geometry.setDrawRange(0,count);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;this.mesh.visible=count>0;
  this.head.visible=age>=0&&age<(this.timing.anticipation?this.timing.extinguishAt:this.shell.ascent);if(this.head.visible){const p=shellAscentPosition(this.shell,age);this.headGeometry.attributes.position.array.set([p.x,p.y,p.z]);this.headGeometry.attributes.position.needsUpdate=true;this.headMaterial.opacity=smooth(age/.055)*(this.timing.anticipation?1-smooth((age-this.timing.riseDuration)/this.timing.fadeDuration):1);}
  return this.stats={vertices:count,headVisible:this.head.visible,tailLife:this.profile.tailLife,width:this.profile.width,timing:this.timing,phase:age<this.timing.riseDuration?'rise':age<this.timing.extinguishAt?'extinguish':age<this.shell.ascent?'anticipation':'break'};
 }
 dispose(){this.town.remove(this.mesh,this.head);this.geometry.dispose();this.material.dispose();this.headGeometry.dispose();this.headMaterial.dispose();}
}
