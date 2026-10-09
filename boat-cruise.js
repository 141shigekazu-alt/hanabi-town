// A continuous route through the suspension bridge, turning before the outer bridges.
// No wrap teleport, bobbing, random drift or change to the fireworks clock.
const FRONT=.44,BACK=-.34,RADIUS=.11,TURN_SECONDS=120;
const TURN_SPEED=RADIUS*Math.PI/TURN_SECONDS,MAX_SPEED=.0045;
const LEG_SECONDS=2*(FRONT-BACK)/(MAX_SPEED+TURN_SPEED);
export const CRUISE_PERIOD=2*(LEG_SECONDS+TURN_SECONDS);
function leg(t){const u=t/LEG_SECONDS,d=MAX_SPEED-TURN_SPEED;return {distance:TURN_SPEED*t+d*(t/2-LEG_SECONDS*Math.sin(2*Math.PI*u)/(4*Math.PI)),speed:TURN_SPEED+d*Math.sin(Math.PI*u)**2};}
export function viewBoatPose(seconds,out={}){
 let t=((seconds%CRUISE_PERIOD)+CRUISE_PERIOD)%CRUISE_PERIOD,z,lane,dz,dx;
 if(t<LEG_SECONDS){const p=leg(t);z=FRONT-p.distance;lane=RADIUS;dz=-p.speed;dx=0;}
 else if((t-=LEG_SECONDS)<TURN_SECONDS){const a=t*Math.PI/TURN_SECONDS;z=BACK-RADIUS*Math.sin(a);lane=RADIUS*Math.cos(a);dz=-TURN_SPEED*Math.cos(a);dx=-TURN_SPEED*Math.sin(a);}
 else if((t-=TURN_SECONDS)<LEG_SECONDS){const p=leg(t);z=BACK+p.distance;lane=-RADIUS;dz=p.speed;dx=0;}
 else{t-=LEG_SECONDS;const a=t*Math.PI/TURN_SECONDS;z=FRONT+RADIUS*Math.sin(a);lane=-RADIUS*Math.cos(a);dz=TURN_SPEED*Math.cos(a);dx=TURN_SPEED*Math.sin(a);}
 const centre=.22*Math.sin(z*2.7+.35),slope=.594*Math.cos(z*2.7+.35);dx+=slope*dz;
 return Object.assign(out,{x:centre+lane,y:0,z,angle:Math.atan2(-dx,-dz),speed:Math.hypot(dx,dz)*100});
}
