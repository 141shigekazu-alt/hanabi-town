import * as T from './vendor/three.module.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const LONG_TIGER={burn:4.0,tailLife:1.20,vy:1.0,drag:.11,gravity:.09,width:.008,samples:480};
export function positionAt(t,p=LONG_TIGER){const q=-Math.expm1(-p.drag*t)/p.drag;return {x:(p.vx??0)*q,y:.035+p.vy*q-p.gravity*(t-q)/p.drag,z:0};}
export function velocityAt(t,p=LONG_TIGER){const e=Math.exp(-p.drag*t);return {x:(p.vx??0)*e,y:p.vy*e-p.gravity*(1-e)/p.drag,z:0};}
// Emission is tied to fixed birth times, not the number of rendered frames.
// A dead root never follows the head upwards or reappears after seeking.
export function segmentAt(birth,age,p=LONG_TIGER){
 const elapsed=age-birth;if(birth<0||birth>=p.burn||elapsed<0||elapsed>=p.tailLife)return null;
 const point=positionAt(birth,p),warm=elapsed/p.tailLife;
 const source=smooth(birth/.055)*(1-smooth((birth-(p.burn-.20))/.20));
 const cooling=(1-smooth((warm-.42)/.58));
 const light=source*cooling;
 return {x:point.x,y:point.y-.012*elapsed*elapsed,z:0,light,warm};
}
export class RisingStroke{
 constructor(scene){
  this.params={...LONG_TIGER};this.capacity=LONG_TIGER.samples*6;
  this.positions=new Float32Array(this.capacity*3);this.colors=new Float32Array(this.capacity*3);
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,3).setUsage(T.DynamicDrawUsage));
  this.geometry.setDrawRange(0,0);
  this.material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});this.mesh=new T.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;scene.add(this.mesh);
  this.headGeometry=new T.BufferGeometry();this.headGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(3),3));
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d'),g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'white');g.addColorStop(.22,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,32,32);this.map=new T.CanvasTexture(canvas);
  this.headMaterial=new T.PointsMaterial({size:.032,color:0xfff1cf,map:this.map,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});this.head=new T.Points(this.headGeometry,this.headMaterial);this.head.frustumCulled=false;scene.add(this.head);
 }
 update(age,camera){
  const p=this.params,dt=p.burn/p.samples;let count=0,minY=Infinity,maxY=-Infinity;
  const eye=camera.position;
  for(let i=0;i<p.samples;i++){
   const t0=i*dt,t1=Math.min((i+1)*dt,age,p.burn-1e-9);if(t1<=t0)continue;
   const a=segmentAt(t0,age,p),b=segmentAt(t1,age,p);if(!a||!b)continue;
   if(Math.max(a.light,b.light)<.001)continue;
   // Camera-facing thin ribbon: a continuous stroke instead of round dots.
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y;
   let ax=dy*(eye.z),ay=-dx*(eye.z),az=dx*(eye.y-my)-dy*(eye.x-mx);const len=Math.hypot(ax,ay,az)||1;ax=ax/len*p.width/2;ay=ay/len*p.width/2;az=az/len*p.width/2;
   const verts=[[a,1],[a,-1],[b,1],[b,1],[a,-1],[b,-1]];
   for(const [point,sign]of verts){const k=count*3;this.positions[k]=point.x+sign*ax;this.positions[k+1]=point.y+sign*ay;this.positions[k+2]=sign*az;
    this.colors[k]=point.light*1.1;this.colors[k+1]=point.light*(.93-.36*point.warm);this.colors[k+2]=point.light*(.66-.43*point.warm);count++;}
   minY=Math.min(minY,a.y,b.y);maxY=Math.max(maxY,a.y,b.y);
  }
  this.geometry.setDrawRange(0,count);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;this.mesh.visible=count>0;
  this.head.visible=age>=0&&age<p.burn;
  if(this.head.visible){const point=positionAt(age,p);this.headGeometry.attributes.position.array.set([point.x,point.y,0]);this.headGeometry.attributes.position.needsUpdate=true;this.headMaterial.opacity=smooth(age/.055)*(1-smooth((age-(p.burn-.20))/.20));}
  return {age,vertices:count,lowerY:Number.isFinite(minY)?minY:null,upperY:Number.isFinite(maxY)?maxY:null,headVisible:this.head.visible};
 }
}
