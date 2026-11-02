import {variationRandom} from './flower-variation.js';
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
// One restrained or imperfect butterfly per launch; never randomise each frame.
export function createButterflyVariation(seed){
 const r=variationRandom(seed,0xb277c3),choice=r(),level=choice<.30?0:choice<.75?1:2,amount=[0,.07,.17][level];
 const lobes={},keys=['-1:upper','-1:lower','1:upper','1:lower'],damaged=keys[Math.floor(r()*4)];
 for(const key of keys){const rough=level===2&&key===damaged;
  lobes[key]={scale:(1+(r()*2-1)*amount*.65)*(rough?.84:1),bend:(r()*2-1)*amount*.32,
   glow:rough?.70:1-amount*r()*.35,endOffset:rough?-.40:0,
   notch:rough?.25+r()*.50:0,width:rough?.16:0};
 }
 return {level,amount,lobes};
}
// Keep the four wing lobes readable. Tiny variations are sampled once,
// independently of the existing shell/orientation stream.
export function prepareButterflyTrail(star,seed,index,count,variation=createButterflyVariation(seed)){
 const r=variationRandom(seed,(0xb27780+index*7919)>>>0),wing=star.group==='wing';
 const profile={count,wing,antenna:star.group==='antenna',rayScale:wing?.975+r()*.05:1,
  fadeAt:1.10+r()*.20,end:3.10+r()*.14,glow:.88+r()*.24,
  birth:new Float64Array(count),gain:new Float32Array(count),
  dx:new Float32Array(count),dy:new Float32Array(count),dz:new Float32Array(count)};
 for(let j=0;j<count;j++){
  // Each slot is one retained ember, not a moving recent-history sample.
  profile.birth[j]=j===0?0:(count-1-j+r()*.55)/(count-1)*2.30;
  profile.gain[j]=.78+r()*.44;
  const spread=wing?.010:.004;
  profile.dx[j]=(r()-.5)*spread;profile.dy[j]=(r()-.5)*spread;profile.dz[j]=(r()-.5)*spread;
 }
 profile.variant=variation.level;profile.bend=0;profile.side=[0,0,0];
 if(wing){
  const lobe=variation.lobes[star.wingSide+':'+star.wingLobe];
  const ray=variationRandom(seed,(0x88271+star.wingRay*101+(star.wingSide+2)*7919+(star.wingLobe==='upper'?313:0))>>>0);
  const near=lobe.width?Math.max(0,1-Math.abs(star.wingU-lobe.notch)/lobe.width):0;
  profile.rayScale*=lobe.scale*(1-.24*near)*(1+variation.amount*(ray()-.5)*.28);
  profile.glow*=lobe.glow*(1-.18*near);profile.end+=lobe.endOffset;
  profile.bend=lobe.bend;
  const [x,y,z]=star.direction,[nx,ny,nz]=star.wingNormal;
  const cross=[ny*z-nz*y,nz*x-nx*z,nx*y-ny*x],length=Math.hypot(...cross)||1;
  profile.side=cross.map(v=>v/length);
 }
 star.butterflyTrail=profile;return star;
}
export function butterflyPoint(star,radius,time,trail,trails,out={}){
 const p=star.butterflyTrail,age=time-star.delay,head=trail===0;
 const born=head?Math.max(0,age):p.birth[trail];
 const travel=radius*star.speed*p.rayScale*(1-Math.exp(-star.drag*born)),d=star.direction;
 // The deposited trail stays in its wing plane. A small common sag and
 // sub-pixel ember offsets avoid a rigid diagram without free-falling the shape.
 const sagAge=Math.max(0,age),sag=.35*(.042*sagAge-star.gravity*sagAge*sagAge);
 out.x=d[0]*travel+(head?0:radius*p.dx[trail]);
 out.y=d[1]*travel+sag+(head?0:radius*p.dy[trail]);
 out.z=d[2]*travel+(head?0:radius*p.dz[trail]);
 const curve=radius*p.bend*Math.min(1,born/2.30)**2;
 out.x+=p.side[0]*curve;out.y+=p.side[1]*curve;out.z+=p.side[2]*curve;
 const fade=Math.pow(1-smooth(p.fadeAt,p.end,time),1.35),u=Math.max(0,Math.min(1,born/2.30));
 const strength=head?(p.antenna?3.2:p.wing?2.5:1.05):p.wing?1.05*(.65+.35*u)*p.gain[trail]:(p.antenna?.24:.13)*p.gain[trail];
 out.brightness=age>=0&&(head||age>=born)?strength*fade*p.glow:0;
 // Coloured tips retain a short colour transition; the remembered wings are gold/silver.
 const tipMix=Math.exp(-Math.max(0,age-born)*10);
 out.headMix=head?1:p.antenna?.45+.55*tipMix:tipMix;
 return out;
}
