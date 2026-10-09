// Follow the river in normal-offset lanes; turn in world space without river shear.
// Ease heading rotation at both ends. The hull always faces its travel direction.
const RADIUS=.08,BACK=-.235,TURN_SECONDS=120,MAX_SPEED=.0054,STEPS=1024;
const centre=z=>.22*Math.sin(z*2.7+.35),slope=z=>.594*Math.cos(z*2.7+.35);
const curvature=z=>-1.6038*Math.sin(z*2.7+.35);
const ease=u=>u*u*(3-2*u);
const turns=new Float64Array((STEPS+1)*2);
for(let i=1;i<=STEPS;i++){
 const a=Math.PI*ease((i-1)/STEPS),b=Math.PI*ease(i/STEPS);
 turns[i*2]=turns[(i-1)*2]+(Math.sin(a)+Math.sin(b))/(2*STEPS);
 turns[i*2+1]=turns[(i-1)*2+1]+(Math.cos(a)+Math.cos(b))/(2*STEPS);
}
const TURN_DISTANCE=2*RADIUS/turns[STEPS*2],TURN_SPEED=TURN_DISTANCE/TURN_SECONDS;
let FRONT=1.15;
for(let i=0;i<12;i++)FRONT=1.15+RADIUS*slope(FRONT)/Math.hypot(1,slope(FRONT));
function lane(z,offset){
 const s=slope(z),n=Math.hypot(1,s),factor=1-offset*curvature(z)/n**3;
 return {x:centre(z)+offset/n,z:z-offset*s/n,dx:s*factor,dz:factor};
}
function makeLeg(from,to,offset){
 const points=new Float64Array(STEPS+1),lengths=new Float64Array(STEPS+1),step=(to-from)/STEPS;
 let previous=lane(from,offset),previousScale=Math.hypot(previous.dx,previous.dz);
 for(let i=0;i<=STEPS;i++){
  points[i]=from+step*i;
  if(i){const p=lane(points[i],offset),scale=Math.hypot(p.dx,p.dz);lengths[i]=lengths[i-1]+Math.abs(step)*(previousScale+scale)/2;previousScale=scale;}
 }
 const length=lengths[STEPS],duration=2*length/(MAX_SPEED+TURN_SPEED);
 return {from,to,offset,points,lengths,length,duration};
}
const outLeg=makeLeg(FRONT,BACK,RADIUS),returnLeg=makeLeg(BACK,FRONT,-RADIUS);
export const CRUISE_PERIOD=outLeg.duration+returnLeg.duration+2*TURN_SECONDS;
export const CRUISE_TURNS=Object.freeze([{name:'far',start:outLeg.duration,duration:TURN_SECONDS},{name:'near',start:outLeg.duration+TURN_SECONDS+returnLeg.duration,duration:TURN_SECONDS}]);
function leg(t,l){
 const u=t/l.duration,d=MAX_SPEED-TURN_SPEED;
 const distance=TURN_SPEED*t+d*(t/2-l.duration*Math.sin(2*Math.PI*u)/(4*Math.PI));
 const speed=TURN_SPEED+d*Math.sin(Math.PI*u)**2;
 let lo=0,hi=STEPS;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(l.lengths[mid]<distance)lo=mid;else hi=mid;}
 const span=l.lengths[hi]-l.lengths[lo],v=Math.max(0,Math.min(1,(distance-l.lengths[lo])/span));
 const z0=l.points[lo],z1=l.points[hi],a=lane(z0,l.offset),b=lane(z1,l.offset),sign=Math.sign(l.to-l.from);
 // Hermite inversion of arc length keeps speed continuous between lookup samples.
 const da=sign*span/Math.hypot(a.dx,a.dz),db=sign*span/Math.hypot(b.dx,b.dz);
 const z=(2*v**3-3*v*v+1)*z0+(v**3-2*v*v+v)*da+(-2*v**3+3*v*v)*z1+(v**3-v*v)*db;
 const p=lane(z,l.offset),scale=sign*speed/Math.hypot(p.dx,p.dz);
 return {x:p.x,z:p.z,dx:p.dx*scale,dz:p.dz*scale};
}
function integral(u,j){
 const f=Math.min(STEPS-1,Math.floor(u*STEPS)),v=u*STEPS-f,a=f/STEPS,b=(f+1)/STEPS;
 const fn=j===0?Math.sin:Math.cos,da=fn(Math.PI*ease(a))/STEPS,db=fn(Math.PI*ease(b))/STEPS;
 const va=turns[f*2+j],vb=turns[(f+1)*2+j];
 return (2*v**3-3*v*v+1)*va+(v**3-2*v*v+v)*da+(-2*v**3+3*v*v)*vb+(v**3-v*v)*db;
}
function turn(t,near){
 const u=t/TURN_SECONDS,z=near?FRONT:BACK,s=slope(z),n=Math.hypot(1,s),sign=near?1:-1;
 const side=sign*(-RADIUS+TURN_DISTANCE*integral(u,0)),along=sign*TURN_DISTANCE*integral(u,1),a=Math.PI*ease(u);
 const lateral=sign*TURN_SPEED*Math.sin(a),longitudinal=sign*TURN_SPEED*Math.cos(a);
 return {x:centre(z)+(side+along*s)/n,z:z+(-side*s+along)/n,dx:(lateral+longitudinal*s)/n,dz:(-lateral*s+longitudinal)/n};
}
export function viewBoatPose(seconds,out={}){
 let t=((seconds%CRUISE_PERIOD)+CRUISE_PERIOD)%CRUISE_PERIOD,p;
 if(t<outLeg.duration)p=leg(t,outLeg);
 else if((t-=outLeg.duration)<TURN_SECONDS)p=turn(t,false);
 else if((t-=TURN_SECONDS)<returnLeg.duration)p=leg(t,returnLeg);
 else p=turn(t-returnLeg.duration,true);
 return Object.assign(out,{x:p.x,y:0,z:p.z,angle:Math.atan2(-p.dx,-p.dz),speed:Math.hypot(p.dx,p.dz)*100});
}
export function cruiseTurnWindow(seconds){
 const cycle=Math.floor(seconds/CRUISE_PERIOD),t=seconds-cycle*CRUISE_PERIOD;
 for(const start of [-TURN_SECONDS,...CRUISE_TURNS.map(turn=>turn.start)]){
  if(t>=start-35&&t<start+TURN_SECONDS)return {key:cycle*CRUISE_PERIOD+start,until:cycle*CRUISE_PERIOD+start+TURN_SECONDS,duration:TURN_SECONDS,z:start===outLeg.duration?BACK:FRONT};
 }
 return null;
}
