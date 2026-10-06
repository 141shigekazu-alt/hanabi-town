import * as T from './vendor/three.module.js';

// A brief, fixed-in-the-room hint. It owns no input targets or timers and
// reuses one canvas, texture and plane across visits to the room.
export class EntryTip{
 constructor(scene){
  this.surface=document.createElement('canvas');this.surface.width=1024;this.surface.height=330;const c=this.surface.getContext('2d');
  c.fillStyle='#101f2ee8';c.beginPath();c.roundRect(2,2,1020,326,26);c.fill();c.strokeStyle='#e8c98788';c.lineWidth=3;c.stroke();
  c.textBaseline='middle';c.font='34px system-ui,sans-serif';c.fillStyle='#ffe0a3';c.fillText('まずは、街を好きな場所へ。',42,65);
  c.font='32px system-ui,sans-serif';c.fillStyle='#e8f1f7';c.fillText('台座へビーム＋グリップで、掴んで移動',42,132);
  c.fillText('掴んだまま、スティックを倒すと',42,192);
  c.fillStyle='#ffe0a3';c.fillText('左右：街を回す　／　上下：大きさを変える',42,256);
  this.texture=new T.CanvasTexture(this.surface);this.texture.colorSpace=T.SRGBColorSpace;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
  this.mesh=new T.Mesh(new T.PlaneGeometry(.66,.66*330/1024),new T.MeshBasicMaterial({map:this.texture,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:T.FrontSide}));
  this.mesh.visible=false;this.mesh.renderOrder=950;scene.add(this.mesh);this.started=null;
 }
 begin(transform,stamp){
  const p=transform.position,m=transform.matrix;let x=-m[8],z=-m[10];const length=Math.hypot(x,z);if(length<.001){x=0;z=-1;}else{x/=length;z/=length;}
  this.mesh.position.set(p.x+x*1.05+z*.40,p.y-.16,p.z+z*1.05-x*.40);this.mesh.lookAt(p.x,p.y,p.z);this.started=stamp;this.update(stamp);
 }
 update(stamp,visible=true){
  if(this.started===null)return;const age=(stamp-this.started)/1000;
  if(age>=15){this.end();return;}
  this.mesh.material.opacity=.96*Math.max(0,Math.min(1,age/.45,(15-age)/1.5));this.mesh.visible=visible&&this.mesh.material.opacity>0;
 }
 end(){this.started=null;this.mesh.visible=false;this.mesh.material.opacity=0;}
}
