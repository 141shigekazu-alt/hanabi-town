import * as T from './vendor/three.module.js';
// A saved local-floor transform is the fallback. Never move the town just
// because the viewer turned their head while using the native name editor.
export function captureTownPlacement(object){return {position:object.position.toArray(),quaternion:object.quaternion.toArray(),scale:object.scale.toArray()};}
export function restoreTownPlacement(object,saved,anchorPose=null){
 object.position.fromArray(saved.position);object.quaternion.fromArray(saved.quaternion);object.scale.fromArray(saved.scale);
 if(anchorPose){const p=anchorPose.position,q=anchorPose.orientation;object.position.set(p.x,p.y,p.z);object.quaternion.set(q.x,q.y,q.z,q.w);}
 object.updateMatrixWorld(true);return object;
}
export function placementDelta(before,after){
 const turn=after.quaternion.clone().multiply(new T.Quaternion().fromArray(before.quaternion).invert());
 const shift=after.position.clone().sub(new T.Vector3().fromArray(before.position).applyQuaternion(turn));return {turn,shift};
}
export function restoreRelativePlacement(object,saved,delta){
 restoreTownPlacement(object,saved);object.position.applyQuaternion(delta.turn).add(delta.shift);object.quaternion.premultiply(delta.turn);object.updateMatrixWorld(true);return object;
}
