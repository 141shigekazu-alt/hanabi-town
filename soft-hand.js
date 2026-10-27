import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const names=['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip',...['index','middle','ring','pinky'].flatMap(f=>['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip'].map(n=>`${f}-finger-${n}`))];
// WebXR Input Profiles generic-hand (MIT), tracked like Three.js XRHandMeshModel.
// Models/loaders live locally, including offline; input handling is independent.
export class SoftHand{
 constructor(scene,hand){
  this.hand=hand;this.root=new T.Group();this.root.visible=false;scene.add(this.root);this.models=new Map();this.current=null;this.side=null;this.sequence=0;
  hand.addEventListener('connected',e=>{if(e.data?.hand)this.setHandedness(e.data.handedness);});
  hand.addEventListener('disconnected',()=>{this.root.visible=false;this.side=null;this.current=null;this.sequence++;});
 }
 async setHandedness(side){
  if(!['left','right'].includes(side))return;
  this.side=side;const sequence=++this.sequence;this.root.visible=false;
  try{
   if(!this.models.has(side))this.models.set(side,this.load(side));
   const model=await this.models.get(side);if(sequence!==this.sequence)return;
   for(const item of this.root.children)item.visible=false;
   this.current=model;model.object.visible=true;
  }catch(error){this.models.delete(side);if(sequence===this.sequence)this.current=null;console.warn('手のモデルを読み込めませんでした',error);}
 }
 async load(side){
  const gltf=await new GLTFLoader().loadAsync(new URL(`./models/hands/${side}.glb`,import.meta.url).href),object=gltf.scene.children[0],mesh=object.getObjectByProperty('type','SkinnedMesh');
  if(!mesh)throw Error('Hand mesh missing');
  const bones=names.map(name=>({name,bone:object.getObjectByName(name)}));if(bones.some(b=>!b.bone))throw Error('Hand joints missing');
  mesh.material=new T.MeshBasicMaterial({color:0x254657});mesh.frustumCulled=false;
  const rimMaterial=new T.MeshBasicMaterial({color:0x96cce0,side:T.BackSide,depthWrite:false});
  rimMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * 0.001;');};
  rimMaterial.customProgramCacheKey=()=> 'hand-rim-1mm';
  const rim=new T.SkinnedMesh(mesh.geometry,rimMaterial);rim.frustumCulled=false;rim.bind(mesh.skeleton,mesh.bindMatrix);rim.position.copy(mesh.position);rim.quaternion.copy(mesh.quaternion);rim.scale.copy(mesh.scale);mesh.parent.add(rim);
  object.visible=false;this.root.add(object);return {object,mesh,rim,bones};
 }
 update(show){
  const model=this.current;this.root.visible=!!show&&!!this.hand.visible&&!!model;if(!this.root.visible)return;
  for(const {name,bone} of model.bones){const joint=this.hand.joints[name];if(!joint?.visible){this.root.visible=false;return;}bone.position.copy(joint.position);bone.quaternion.copy(joint.quaternion);}
  model.object.updateMatrixWorld(true);
 }
}
