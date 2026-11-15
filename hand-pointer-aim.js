import * as T from './vendor/three.module.js';
export const HAND_POINTER_DOWN_DEGREES=5;
export function pointerAim(controller,out){
 out.set(0,0,-1).transformDirection(controller.matrixWorld);
 if(!controller.userData.hanabiHandAim)return out;
 const h=Math.hypot(out.x,out.z);if(h<.0001)return out;
 const angle=Math.max(-Math.PI*.49,Math.min(Math.PI*.49,Math.atan2(out.y,h)-HAND_POINTER_DOWN_DEGREES*Math.PI/180)),c=Math.cos(angle);
 return out.set(out.x/h*c,Math.sin(angle),out.z/h*c).normalize();
}
const direction=new T.Vector3(),rotation=new T.Quaternion(),forward=new T.Vector3(0,0,-1);
export function alignPointerBeam(controller,beam){
 if(!controller.userData.hanabiHandAim){beam.quaternion.identity();return;}
 pointerAim(controller,direction);controller.getWorldQuaternion(rotation).invert();direction.applyQuaternion(rotation);beam.quaternion.setFromUnitVectors(forward,direction);
}
