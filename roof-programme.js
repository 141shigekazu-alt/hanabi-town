import * as T from './vendor/three.module.js';
import {GrandTigerScene} from './grand-tiger-scene.js?v=1.3.26';
import {mainCues} from './grand-tiger-cues.js?v=1.3.26';
export class RoofProgramme {
 constructor(town,map,bridge,headMaps,onLaunch){
  Object.assign(this,{town,onLaunch});this.widthScale=1.5;
  this.pool=Array.from({length:2},()=>{const group=new T.Group();group.scale.setScalar(.5);group.position.z=-.68;town.add(group);const field=new GrandTigerScene(group,map,bridge,headMaps);group.visible=false;return{group,field,at:null,next:0};});
  this.cameraPosition=new T.Vector3();this.stats=[];
 }
 launch(at){const slot=this.pool.find(p=>p.at===null);if(!slot)return false;slot.at=at;slot.next=0;slot.field.reset();slot.group.visible=true;return true;}
 update(time,camera){this.stats=[];for(const p of this.pool){if(p.at===null)continue;const age=time-p.at;if(age<0||age>8.5){p.group.visible=false;p.at=null;continue;}
  p.group.updateWorldMatrix(true,false);camera.getWorldPosition(this.cameraPosition);p.group.worldToLocal(this.cameraPosition);
  this.stats.push(p.field.draw(age,{position:this.cameraPosition},{widthScale:this.widthScale,tilt:'photo',mode:'full'}));
  const cues=mainCues();while(p.next<cues.length&&cues[p.next].at<=age){const c=cues[p.next++];if(age-c.at<.35)this.onLaunch({x:c.x*.5,y:.035,z:-.68,at:p.at+c.at,group:'roof-'+p.at,small:false},time);}
 }}
 clear(){for(const p of this.pool){p.group.visible=false;p.at=null;p.field.reset();}this.stats=[];}
 get active(){return this.pool.some(p=>p.at!==null);}
}
