import * as T from './vendor/three.module.js';
import {RisingStroke} from './rising-stroke.js?v=1.3.25';
import {StarBundleField} from './star-bundles.js?v=1.3.25';
import {mainCues,GRAND_STYLES} from './grand-tiger-cues.js?v=1.3.25';
export class GrandTigerScene{
 constructor(scene,map,bridge={point(){}},headMaps=null){
  this.strokes=mainCues().map(cue=>{const group=new T.Group();group.position.x=cue.x;scene.add(group);const field=new RisingStroke(group);field.params.vx=cue.vx;field.params.vy*=1+.016*Math.sin(cue.seed);return {cue,group,field};});
  this.colourGroup=new T.Group();this.layerGroup=new T.Group();scene.add(this.colourGroup,this.layerGroup);
  const options={bridge,map,headMaps,styles:GRAND_STYLES,capacity:1536};
  this.opening=new StarBundleField({...options,town:this.colourGroup});this.layers=new StarBundleField({...options,town:this.layerGroup});this.last=-1;this.reset();
 }
 reset(){this.opening.clear();this.layers.clear();this.opening.launch('small-grand-opening','gold',0,{reviewSeed:417});this.layers.launch('small-grand-layers','gold',0,{reviewSeed:417});this.last=-1;}
 draw(time,camera,{mode='full',centerOnly=false,tilt='photo',widthScale=1}={}){
  if(time<this.last)this.reset();
  for(let t=Math.max(0,this.last);t<time;t+=.03){this.opening.update(t);this.layers.update(t);}this.opening.update(time);this.layers.update(time);this.last=time;
  let litStrokes=0,vertices=0,lowest=Infinity;const bands=new Set();
  for(const {cue,group,field}of this.strokes){field.params.width=.008*Math.max(.5,Math.min(3,Number(widthScale)||1));field.params.vx=tilt==='photo'?cue.photoVx:0;group.visible=!centerOnly||cue.band===0;const localCamera={position:{x:camera.position.x-cue.x,y:camera.position.y,z:camera.position.z}};const stats=field.update(time-cue.at,localCamera);if(group.visible&&stats.vertices>0){litStrokes++;vertices+=stats.vertices;lowest=Math.min(lowest,stats.lowerY);bands.add(cue.band);}}
  this.colourGroup.visible=mode!=='strokes'&&!centerOnly;this.layerGroup.visible=mode==='full'&&!centerOnly;
  return {time,litStrokes,vertices,bands:[...bands],lowest:Number.isFinite(lowest)?lowest:null,openingPoints:this.colourGroup.visible?this.opening.points:0,layerPoints:this.layerGroup.visible?this.layers.points:0,dropped:this.opening.dropped+this.layers.dropped};
 }
}
