import * as T from './vendor/three.module.js';

export const ROOFTOP_SEATS=Object.freeze({
 near:{label:'近い席',building:{side:-1,row:6,col:3},target:{x:.15,z:-.12},pitch:.28},
 panorama:{label:'全景の席',building:{side:-1,row:7,col:4},target:{x:-.1,z:-.95},pitch:.12}
});
const ROOFTOP_BUILDING=ROOFTOP_SEATS.panorama.building;

// Raise the leftmost building in the next foreground row, after all city randomness.
// Keep the existing footprint, lower windows and every other building unchanged.
export function prepareRooftopBuilding(roofs,meshes,addWindow,windowRanges,windowCount){
 const roof=roofs.find(r=>r.side===ROOFTOP_BUILDING.side&&r.row===ROOFTOP_BUILDING.row&&r.col===ROOFTOP_BUILDING.col);
 const building=meshes.find(m=>m.name==='gap-fill-building--1-4');
 if(!roof||!building)throw Error('手前の列の屋上席用ビルが見つかりません。');
 const previousHeight=roof.y;roof.y=.43;building.position.y=roof.y/2;building.scale.y=roof.y;
 let seed=0x141803;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const first=windowCount();
 for(let level=.045;level<roof.y-.015;level+=.04){
  if(level<previousHeight-.015)continue;
  for(let k=-1;k<=1;k++){
   if(random()>.38)addWindow(roof.x+k*roof.w*.25,level,roof.z+roof.d/2+.001,0,1);
   if(random()>.38)addWindow(roof.x+k*roof.w*.25,level,roof.z-roof.d/2-.001,0,-1);
   if(random()>.38)addWindow(roof.x-roof.w/2-.001,level,roof.z+k*roof.d*.25,-1,0);
   if(random()>.38)addWindow(roof.x+roof.w/2+.001,level,roof.z+k*roof.d*.25,1,0);
  }
 }
 windowRanges.push({first,last:windowCount()});return roof;
}

// Coordinates use the same miniature units as the city; 0.01 becomes 1m in an entered view.
export function createRooftopDeck(town,roofs,id='near'){
 const config=ROOFTOP_SEATS[id];if(!config)throw Error('屋上席の指定が違います。');
 const building=config.building,target=config.target;
 // One row back from the previous Eitai roof, at the far left of the low foreground block.
 const roof=roofs.find(r=>r.side===building.side&&r.row===building.row&&r.col===building.col);
 if(!roof)throw Error('手前の列の屋上席のビルが見つかりません。');
 const floor=roof.y+.026,angle=Math.atan2(-(target.x-roof.x),-(target.z-roof.z));
 const group=new T.Group();group.name='rooftop-fireworks-terrace-'+id;group.position.set(roof.x,floor,roof.z);group.rotation.y=angle;town.add(group);
 const width=.076,depth=.076,parts=new Map(),pose=new T.Object3D(),chairs=[];
 const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12);
 const timber=new T.MeshStandardMaterial({color:0x4b3527,roughness:.9});
 const metal=new T.MeshStandardMaterial({color:0x253139,metalness:.35,roughness:.7});
 const top=new T.MeshStandardMaterial({color:0x85603c,roughness:.8});
 const tableTop=id==='near'?top:new T.MeshStandardMaterial({color:0x17191b,roughness:1,metalness:0});
 const seatMat=new T.MeshStandardMaterial({color:id==='near'?0x3d514c:0xa45d32,roughness:.95});
 const glow=new T.MeshBasicMaterial({color:0x9c7842});
 function part(geometry,material,x,y,z,sx,sy,sz,ry=0){
  let byMat=parts.get(geometry);if(!byMat)parts.set(geometry,byMat=new Map());
  let list=byMat.get(material);if(!list)byMat.set(material,list=[]);
  pose.position.set(x,y,z);pose.rotation.set(0,ry,0);pose.scale.set(sx,sy,sz);pose.updateMatrix();list.push(pose.matrix.clone());
 }
 // Raised platform, four supports, and steps on the rear edge keep the red beacons below the deck.
 part(box,timber,0,-.0015,0,width,.003,depth);
 for(const x of [-width/2+.006,width/2-.006])for(const z of [-depth/2+.006,depth/2-.006])part(box,metal,x,-.014,z,.002,.026,.002);
 for(let i=0;i<6;i++)part(box,timber,-.018,-.026+(i+1)*.004,depth/2+.009-i*.0027,.018,.004,.003);
 for(let i=0;i<12;i++)part(box,top,-width/2+(i+.5)*width/12,.0001,0,.00028,.00018,depth);
 // Open, low rails: a seated eye is above their 1m handrail. Leave a rear entrance by the steps.
 for(const x of [-width/2,width/2]){
  part(box,metal,x,.010,0,.0007,.0007,depth);
  part(box,metal,x,.0048,0,.00045,.00045,depth);
  for(let i=0;i<=6;i++)part(box,metal,x,.0049,-depth/2+i*depth/6,.00055,.0098,.00055);
 }
 for(const z of [-depth/2,depth/2]){
  if(z<0){part(box,metal,0,.010,z,width,.0007,.0007);part(box,metal,0,.0048,z,width,.00045,.00045);}
  else{part(box,metal,(width/2-.009)/2,.010,z,width/2+.009,.0007,.0007);part(box,metal,(-width/2-.027)/2,.010,z,width/2-.027,.0007,.0007);}
  for(let i=0;i<=6;i++){const x=-width/2+i*width/6;if(z>0&&x<-.009&&x>-.027)continue;part(box,metal,x,.0049,z,.00055,.0098,.00055);}
 }
 for(const x of [-width/2,width/2])part(box,glow,x,.0013,0,.00028,.0004,depth*.8);
 function chair(x,z,heading){
  chairs.push({x,z});
  const point=(dx,dz)=>[x+dx*Math.cos(heading)+dz*Math.sin(heading),z-dx*Math.sin(heading)+dz*Math.cos(heading)];
  part(box,seatMat,x,.0044,z,.0048,.0006,.0048,heading);
  const [bx,bz]=point(0,.0021);part(box,seatMat,bx,.0066,bz,.0048,.004,.00055,heading);
  for(const dx of [-.0018,.0018])for(const dz of [-.0018,.0018]){const [lx,lz]=point(dx,dz);part(box,metal,lx,.002,lz,.00045,.004,.00045);}
 }
 for(const [x,z,main] of [[0,-.028,true],[-.025,.020,false],[.025,.020,false]]){
  part(cylinder,tableTop,x,.0074,z,.0058,.00065,.0058);part(cylinder,metal,x,.0036,z,.00065,.0072,.00065);part(cylinder,metal,x,.00035,z,.0037,.0005,.0037);
  if(main){for(const a of [0,Math.PI/2,-Math.PI/2])chair(x+Math.sin(a)*.009,z+Math.cos(a)*.009,a*13/18);}
  else{for(const dx of [-.0045,.0045])chair(x+dx,z+.009,Math.sign(dx)*Math.PI/10);}
 }
 for(const [geometry,byMat] of parts)for(const [material,matrices] of byMat){
  const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
 }
 const seatOffset=new T.Vector3(0,0,-.019);
 const seat=seatOffset.clone().applyAxisAngle(new T.Vector3(0,1,0),angle).add(group.position);
 // Stick travel reaches 5cm inside each rail centreline. Bounds are relative to
 // the chair, not the platform centre; the rear rail is farther from the chair.
 // Real head motion stays independent, so leaning over never moves the town.
 const margin=.0005;
 const bounds={minX:(-width/2+margin-seatOffset.x)*100,maxX:(width/2-margin-seatOffset.x)*100,minZ:(-depth/2+margin-seatOffset.z)*100,maxZ:(depth/2-margin-seatOffset.z)*100};
 const chairZones=chairs.map(p=>({x:(p.x-seatOffset.x)*100,z:(p.z-seatOffset.z)*100}));
 return {chairZones,id,label:config.label,pitch:config.pitch,group,roof,seat,angle,target,bounds,floor,beaconHeight:roof.y+.015};
}
