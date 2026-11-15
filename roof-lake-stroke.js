import {RisingStroke,positionAt,velocityAt} from './rising-stroke.js?v=1.3.32';
import * as T from './vendor/three.module.js';
const CORNERS=[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]];
const clamp=x=>Math.max(0,Math.min(1,x));
const hash=(index,seed)=>{let x=(index^seed)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;};
// Only the roof's long strokes use this variant. Fixed birth times and seeds
// retain identical sparks through pause, seek, and different frame rates.
export class RoofLakeStroke extends RisingStroke{
 constructor(scene,seed){
  super(scene);this.mode='lake';this.seed=seed;this.sparkMap=this.map;
  const uv=new Float32Array(this.capacity*2),corners=[0,0,1,0,0,1,0,1,1,0,1,1];
  for(let i=0;i<this.params.samples;i++)uv.set(corners,i*12);
  this.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  this.sparks=Array.from({length:this.params.samples},(_,i)=>({phase:hash(i,seed),side:hash(i,seed+13)*2-1,depth:hash(i,seed+29)*2-1,life:.65+hash(i,seed+47)*.50}));
 }
 setMode(mode){mode=mode==='original'?'original':mode==='long'?'long':'lake';if(this.appliedMode===mode)return;this.mode=mode;this.appliedMode=mode;this.material.map=mode==='original'?null:this.sparkMap;this.material.needsUpdate=true;}
 update(age,camera){
  this.setMode(this.mode);if(this.mode==='original')return super.update(age,camera);
  const p=this.params,eye=camera.position;let count=0,minY=Infinity,maxY=-Infinity;
  const dt=p.burn/p.samples;
  for(let i=0;i<p.samples;i++){
   const spark=this.sparks[i],birth=(i+spark.phase*.8)*dt,a=age-birth,life=p.tailLife*spark.life*(this.mode==='long'?1.5:1);
   if(birth>=p.burn||a<0||a>=life)continue;
   const warm=a/life,source=clamp(birth/.055)*(1-clamp((birth-(p.burn-.20))/.20));
   const glow=Math.pow(1-warm,this.mode==='long'?1:1.25),glint=.68+.24*Math.sin(spark.phase*81+a*9),light=source*glow*1.65*glint*(this.mode==='long'?1.2:1);
   if(light<.001)continue;
   const born=positionAt(birth,p),tangent=velocityAt(birth,p);
   // Lake comet model: independent birth, residual velocity, spread, fall and
   // cooling. Spread stays inside the original miniature stroke's width.
   const spread=p.width*(.10+.18*warm);
   const x=born.x+tangent.x*.035*a+spark.side*spread;
   const y=born.y+tangent.y*.035*a-.060*a*a;
   const z=spark.depth*spread;
   if(y<.012)continue;
   let ax=eye.z-z,az=-(eye.x-x),n=Math.hypot(ax,az)||1;ax/=n;az/=n;
   const half=p.width*.5*(.45+.55*glow),length=half*(1.2+.5*spark.phase);
   for(const [sx,sy]of CORNERS){const k=count*3;this.positions[k]=x+sx*half*ax;this.positions[k+1]=y+sy*length;this.positions[k+2]=z+sx*half*az;this.colors[k]=light;this.colors[k+1]=light*(.87-.52*warm);this.colors[k+2]=light*(.48-.43*warm);count++;}
   minY=Math.min(minY,y-length);maxY=Math.max(maxY,y+length);
  }
  this.geometry.setDrawRange(0,count);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;this.mesh.visible=count>0;
  this.head.visible=age>=0&&age<p.burn;
  if(this.head.visible){const point=positionAt(age,p);this.headGeometry.attributes.position.array.set([point.x,point.y,0]);this.headGeometry.attributes.position.needsUpdate=true;const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};this.headMaterial.opacity=smooth(age/.055)*(1-smooth((age-(p.burn-.20))/.20));}
  return {age,vertices:count,lowerY:Number.isFinite(minY)?minY:null,upperY:Number.isFinite(maxY)?maxY:null,headVisible:this.head.visible,tailMode:this.mode};
 }
}
