import * as T from './vendor/three.module.js';

// Author geometry once, merging details by material instead of one draw per rail.
class Pieces{
 constructor(){this.positions=[];this.normals=[];this.colors=[];}
 add(geometry,color,position=new T.Vector3(),scale=new T.Vector3(1,1,1),quaternion=new T.Quaternion()){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  g.applyMatrix4(new T.Matrix4().compose(position,quaternion,scale));
  const p=g.attributes.position,n=g.attributes.normal,c=new T.Color(color);
  for(let i=0;i<p.count;i++){this.positions.push(p.getX(i),p.getY(i),p.getZ(i));this.normals.push(n.getX(i),n.getY(i),n.getZ(i));this.colors.push(c.r,c.g,c.b);}
  g.dispose();geometry.dispose();
 }
 box(x,y,z,w,h,d,color){this.add(new T.BoxGeometry(w,h,d),color,new T.Vector3(x,y,z));}
 beam(a,b,r,color){a=new T.Vector3(...a);b=new T.Vector3(...b);this.add(new T.CylinderGeometry(r,r,a.distanceTo(b),5),color,a.clone().add(b).multiplyScalar(.5),new T.Vector3(1,1,1),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize()));}
 curve(points,r,color){this.add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),48,r,5,false),color);}
 mesh(material){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.normals,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));return new T.Mesh(g,material);}
}
export const BRIDGE_DESIGNS=Object.freeze([{id:'three-arches',z:-.58},{id:'suspension',z:.05},{id:'blue-arch',z:.67}]);
function bridgeGeometry(id){
 const body=new Pieces(),lights=new Pieces(),deck=.1025,width=.7;
 body.box(0,.09,0,width,.025,.085,0x323d49);
 for(const z of [-.043,.043]){
  body.beam([-.35,.116,z],[.35,.116,z],.0014,0x7d939f);
  lights.beam([-.35,.109,z],[.35,.109,z],.00065,0xffd298);
  for(let x=-.34;x<=.34;x+=.025)body.beam([x,deck,z],[x,.116,z],.0006,0x688693);
 }
 if(id==='blue-arch'){
  for(const z of [-.041,.041]){
   const points=Array.from({length:33},(_,i)=>{const x=-.34+i*.68/32;return [x,.112+.155*Math.sin(i*Math.PI/32),z];});
   body.curve(points,.0055,0x0864b7);lights.curve(points.map(([x,y,z])=>[x,y+.005,z]),.0020,0x00cfff);
   for(let i=1;i<16;i++){const x=-.34+i*.68/16,top=.112+.155*Math.sin(i*Math.PI/16);body.beam([x,.111,z],[x,top,z],.0012,0xb5c7d2);lights.beam([x,.112,z],[x,top-.006,z],.00045,0xccecff);}
  }
  for(let i=2;i<15;i+=2){const x=-.34+i*.68/16,y=.112+.155*Math.sin(i*Math.PI/16);body.beam([x,y,-.041],[x,y,.041],.0018,0x125c9c);}
 }else if(id==='suspension'){
  for(const z of [-.044,.044]){
   for(const x of [-.23,.23]){body.box(x,.15,z,.012,.106,.012,0x366b98);lights.beam([x,.103,z],[x,.206,z],.00075,0x70a9d7);}
   const spans=[[-.35,-.23,.117,.206],[-.23,.23,.206,.206],[.23,.35,.206,.117]];
   for(const [left,right,yl,yr] of spans){
    const points=Array.from({length:25},(_,i)=>{const u=i/24;return [left+(right-left)*u,yl+(yr-yl)*u-(right-left>.3?.082:.013)*4*u*(1-u),z];});
    body.curve(points,.0016,0x689ec6);lights.curve(points,.00065,0x83b7df);
    for(let i=1;i<12;i++){const u=i/12,x=left+(right-left)*u,y=yl+(yr-yl)*u-(right-left>.3?.082:.013)*4*u*(1-u);body.beam([x,.111,z],[x,y,z],.00055,0x6996b5);}
   }
  }
  for(const x of [-.23,.23])body.beam([x,.192,-.044],[x,.192,.044],.002,0x4e85ad);
 }else{
  for(const z of [-.041,.041])for(let span=0;span<3;span++){
   const left=-.345+span*.23;
   const points=Array.from({length:25},(_,i)=>[left+i*.23/24,.112+.055*Math.sin(i*Math.PI/24),z]);
   body.curve(points,.003,0x8fbaaa);lights.curve(points.map(([x,y,z])=>[x,y+.002,z]),.0011,0xc5f4da);
   for(let i=1;i<8;i++){const x=left+i*.23/8,y=.112+.055*Math.sin(i*Math.PI/8);body.beam([x,.111,z],[x,y,z],.0008,0xadcfbe);lights.beam([x,.112,z],[x,y,z],.00045,0xc5f4da);}
  }
 }
 return {body,lights};
}
function boatGeometry(tint){
 const body=new Pieces(),lights=new Pieces();
 // A long, low hull with a raised pointed bow, cabin and continuous roof.
 const outline=new T.Shape();outline.moveTo(-.026,-.085);outline.lineTo(.026,-.085);outline.lineTo(.027,.062);outline.lineTo(0,.096);outline.lineTo(-.027,.062);outline.closePath();
 const hull=new T.ExtrudeGeometry(outline,{depth:.013,bevelEnabled:false});hull.rotateX(-Math.PI/2);hull.rotateY(Math.PI);body.add(hull,0xd4c59a,new T.Vector3(0,.006,0));
 body.box(0,.028,-.009,.041,.025,.126,0x634635);
 // A closed roof with a raised crown and visible eaves, rather than a dark flat deck.
 const roof=new T.Shape();roof.moveTo(-.028,.043);roof.lineTo(-.028,.049);roof.lineTo(-.012,.055);roof.lineTo(.012,.055);roof.lineTo(.028,.049);roof.lineTo(.028,.043);roof.closePath();
 body.add(new T.ExtrudeGeometry(roof,{depth:.144,bevelEnabled:false}),0x9a8064,new T.Vector3(0,0,-.081));
 for(const z of [-.081,.063]){
  lights.beam([-.028,.049,z],[-.012,.055,z],.0006,0xa98256);
  lights.beam([-.012,.055,z],[.012,.055,z],.0006,0xa98256);
  lights.beam([.012,.055,z],[.028,.049,z],.0006,0xa98256);
 }
 lights.box(0,.030,-.0725,.021,.012,.0008,0xffcd88);
 lights.box(0,.030,.0545,.021,.012,.0008,0xffcd88);
 for(const side of [-1,1]){
  for(let i=0;i<7;i++){
   const z=-.06+i*.017;
   lights.box(side*.0212,.029,z,.0007,.014,.012,0xffcd88);
   body.box(side*.0218,.029,z+.007,.001,.024,.002,0x362925);
   lights.add(new T.SphereGeometry(.0036,7,5),tint,new T.Vector3(side*.032,.041,z));
  }
  body.beam([side*.025,.021,-.078],[side*.025,.021,.065],.0007,0x584f44);
  lights.beam([side*.029,.050,-.079],[side*.029,.050,.061],.0006,0xa98256);
 }
 body.box(0,.052,-.077,.021,.014,.013,0xb6b4a3);
 return {body,lights};
}
export function boatPose(index,seconds,riverCenter,riverSlope){
 const direction=index%2===0?1:-1,period=155+index*23;
 const phase=((seconds/period+index*.249)%1+1)%1;
 const z=-1.18+2.36*(direction===1?phase:1-phase),lane=-direction*.085;
 const edge=Math.max(0,Math.min(1,(Math.abs(z)-.94)/.135)),opacity=1-edge*edge*(3-2*edge);
 return {x:riverCenter(z)+lane,z,y:Math.sin(seconds*.8+index*1.6)*.0006,angle:Math.atan(riverSlope(z))+ (direction===1?0:Math.PI),opacity,visible:opacity>0};
}
export class RiverNight{
 constructor({town,riverGeometry,riverCenter,riverSlope}){
  this.town=town;this.riverCenter=riverCenter;this.riverSlope=riverSlope;this.clock=0;
  this.root=new T.Group();this.root.name='river-night';town.add(this.root);
  this.bodyMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});
  this.lightMaterial=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  this.bridges=[];
  for(const design of BRIDGE_DESIGNS){const g=new T.Group();g.name=design.id;const parts=bridgeGeometry(design.id);g.add(parts.body.mesh(this.bodyMaterial),parts.lights.mesh(this.lightMaterial));g.position.set(riverCenter(design.z),0,design.z);g.rotation.y=Math.atan(riverSlope(design.z));this.root.add(g);this.bridges.push(g);}
  this.boats=[];this.boatColors=[0xffb044,0xffd98a,0xff599f,0xff8254];
  const template=boatGeometry(0xffffff),body=template.body.mesh(this.bodyMaterial),lit=template.lights.mesh(this.lightMaterial);
  for(let i=0;i<4;i++){const g=new T.Group();g.name='yakatabune-'+i;g.scale.setScalar(.8);const boatBody=this.bodyMaterial.clone();boatBody.transparent=true;boatBody.depthWrite=true;boatBody.emissive.setHex(0x45372a);boatBody.emissiveIntensity=.12;g.add(new T.Mesh(body.geometry,boatBody),new T.Mesh(lit.geometry,new T.MeshBasicMaterial({color:this.boatColors[i],vertexColors:true,toneMapped:false,transparent:true,depthWrite:false})));g.children[0].renderOrder=1;g.children[1].renderOrder=2;this.root.add(g);this.boats.push(g);}
  this.reflections=new T.Mesh(riverGeometry,new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uTime:{value:0},uWorldToTown:{value:new T.Matrix4()},uLights:{value:Array.from({length:7},()=>new T.Vector4())},uColors:{value:[0xc5f4da,0x70a9d7,0x00bfff,...this.boatColors].map(c=>new T.Color(c))}},vertexShader:'varying vec3 vLocal; void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`precision highp float;
   varying vec3 vLocal;uniform float uTime;uniform mat4 uWorldToTown;uniform vec4 uLights[7];uniform vec3 uColors[7];
   void main(){
    vec3 eye=(uWorldToTown*vec4(cameraPosition,1.0)).xyz;vec3 ray=normalize(vLocal-eye),glow=vec3(0.0);
    float ripple=pow(.5+.5*sin(vLocal.z*260.0+uTime*1.35+sin(vLocal.x*110.0-uTime*.65)*1.8),5.0);
    float grain=.58+.42*sin(vLocal.x*390.0+sin(vLocal.z*150.0));
    for(int i=0;i<7;i++){
     vec3 source=uLights[i].xyz;vec3 mirror=vec3(source.x,2.0*vLocal.y-source.y,source.z);
     float mixToPlane=(eye.y-vLocal.y)/max(eye.y-mirror.y,.0001);vec2 centre=mix(eye,mirror,mixToPlane).xz;
     vec2 delta=vLocal.xz-centre;float wave=.004*sin(vLocal.z*135.0+uTime*1.1);
     float width=i<3?.26:.024,lengthwise=i<3?.18:.12;
     float shape=exp(-pow((delta.x+wave)/width,2.0)-pow(delta.y/lengthwise,2.0));
     glow+=uColors[i]*shape*(.10+.90*ripple)*grain*uLights[i].w;
    }
    gl_FragColor=vec4(glow,1.0);
   }` }));this.reflections.name='city-water-light';this.root.add(this.reflections);this.update(0);
 }
 update(seconds){
  this.clock=seconds;
  for(let i=0;i<4;i++){const p=boatPose(i,seconds,this.riverCenter,this.riverSlope),g=this.boats[i];g.position.set(p.x,p.y,p.z);g.rotation.y=p.angle;g.visible=p.visible;for(const mesh of g.children)mesh.material.opacity=p.opacity;this.reflections.material.uniforms.uLights.value[i+3].set(p.x,.032,p.z,.36*p.opacity*.8);}
  for(let i=0;i<3;i++){const g=this.bridges[i];this.reflections.material.uniforms.uLights.value[i].set(g.position.x,.16,g.position.z,i===2?.65:i===0?.40:.28);}
  this.reflections.material.uniforms.uTime.value=seconds;
  this.town.updateWorldMatrix(true,false);this.reflections.material.uniforms.uWorldToTown.value.copy(this.town.matrixWorld).invert();
 }
}

// Three fixed rooftop cranes, built once and drawn as one frame plus one light cloud.
export class RooftopCranes{
 constructor({town,rooftops,riverCenter,pointMap}){
  this.root=new T.Group();this.root.name='rooftop-cranes';town.add(this.root);this.sites=[];
  const frame=new Pieces(),positions=[],colors=[];
  for(const [index,side] of [-1,-1,1].entries()){
   const target=[-.45,.82,.05][index];
   const roof=rooftops.filter(r=>(r.x-riverCenter(r.z))*side>0&&!this.sites.some(s=>s.roof===r)).toSorted((a,b)=>(Math.abs(a.z-target)+Math.abs(a.x-riverCenter(a.z))*.3)-(Math.abs(b.z-target)+Math.abs(b.x-riverCenter(b.z))*.3))[0];
   if(!roof)continue;
   const h=[.17,.135,.15][index],jib=[.19,.16,.175][index],back=.062,turn=[-.55,.65,-.9][index],c=new Pieces(),tint=0x887b60;
   for(const x of [-.012,.012])for(const z of [-.012,.012])c.beam([x,0,z],[x,h,z],.0014,tint);
   for(let level=0;level<5;level++){
    const y=level*h/5,next=(level+1)*h/5;
    for(const z of [-.012,.012]){c.beam([-.012,y,z],[.012,next,z],.0008,tint);c.beam([.012,y,z],[-.012,next,z],.0008,tint);}
    for(const x of [-.012,.012])c.beam([x,y,-.012],[x,next,.012],.0008,tint);
   }
   for(const z of [-.006,.006]){
    c.beam([-back,h,z],[jib,h,z],.0015,tint);c.beam([-back,h+.014,z],[jib,h+.014,z],.0010,tint);
    for(let x=-back;x<jib-.005;x+=.025)c.beam([x,h,z],[Math.min(jib,x+.025),h+.014,z],.00065,tint);
   }
   c.beam([0,h,0],[0,h+.047,0],.0016,tint);
   c.beam([0,h+.047,0],[jib,h+.014,0],.0006,0x88969a);c.beam([0,h+.047,0],[-back,h+.014,0],.0006,0x88969a);
   c.box(-back+.008,h-.005,0,.024,.019,.022,0x62676b);c.box(.010,h-.012,.017,.018,.020,.018,0x5f746f);
   c.beam([jib*.79,h,0],[jib*.79,h-.065,0],.0005,0x929b9d);c.beam([jib*.79,h-.065,0],[jib*.79-.005,h-.070,0],.001,0x7f8d90);
   const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn),base=new T.Vector3(roof.x,roof.y+.0036,roof.z);
   const local=c.mesh(new T.MeshStandardMaterial());frame.add(local.geometry,0xffffff,base,new T.Vector3(.6,.6,.6),rotation);local.material.dispose();
   // Keep each beam's muted construction colour after merging.
   const start=frame.colors.length-c.colors.length;for(let k=0;k<c.colors.length;k++)frame.colors[start+k]=c.colors[k];
   for(const p of [[0,h+.05,0],[jib,h+.018,0]]){const v=new T.Vector3(...p).multiplyScalar(.6).applyQuaternion(rotation).add(base);positions.push(v.x,v.y,v.z);colors.push(.4,.004,.001);}
   this.sites.push({roof,height:h*.6,angle:turn,scale:.6});
  }
  this.frame=frame.mesh(new T.MeshStandardMaterial({vertexColors:true,roughness:.82}));this.root.add(this.frame);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  this.lights=new T.Points(geometry,new T.PointsMaterial({size:.018,map:pointMap,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));this.root.add(this.lights);this.update(0);
 }
 update(seconds){const colors=this.lights.geometry.attributes.color;for(let i=0;i<colors.count;i++){const pulse=1.0+1.4*Math.pow(.5+.5*Math.sin(seconds*Math.PI*2/4.5+Math.floor(i/2)*1.4),4);colors.setXYZ(i,pulse,pulse*.012,pulse*.003);}colors.needsUpdate=true;}
}
