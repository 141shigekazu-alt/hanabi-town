import {EAR_PROFILE} from './golden-ears.js?v=1.1.4';
export {EAR_PROFILE,createEarStars,earPoint,createEarRow,createEarTiming} from './golden-ears.js?v=1.1.4';
// Artistic miniature sizes, not full-scale measurements of real fireworks.
export const SIZES={2:{label:'2号玉（目安）',radius:.14,height:.66,stars:28},20:{label:'二尺玉',radius:.74,height:1.55,stars:420},3:{label:'3号玉',radius:.23,height:.80,stars:132},5:{label:'5号玉',radius:.35,height:1.04,stars:204},10:{label:'尺玉',radius:.52,height:1.30,stars:300}};
export const TYPES={ear:{label:'金の穂',radii:[1],colors:[0xffcb7c],life:EAR_PROFILE.life,fadeStart:5.85,tail:.02,gravity:.004},senrin:{label:'彩色千輪（軽量テスト）',radii:[1],colors:[0xff419b,0xffd52e,0x42cfff,0x48f5a5,0xbb65ff],life:6.2,tail:.045,gravity:.022},triple:{label:'三重芯',radii:[1,.74,.48,.23],colors:[0xffd38c,0xff749d,0x9bd9ff,0xc8f5ab],life:8,tail:.08,gravity:.014},spiral:{label:'渦巻き',radii:[1],colors:[0xffc34c],life:4.1,tail:.11,gravity:.025},sunflower:{label:'ひまわり',radii:[1,.51],colors:[0xffbf55,0xff3925],life:2.85,fadeStart:2.65,tail:.035,gravity:.026},silver:{label:'銀かむろ',radii:[1,.55],colors:[0xffd18a,0xffd18a],life:6.2,fadeStart:4.6,tail:.06,gravity:.035},core:{label:'芯入り',radii:[1,.48],colors:[0xff718c,0xffe4a0],life:3.5,tail:.04,gravity:.045},double:{label:'八重芯',radii:[1,.66,.32],colors:[0x9ecfff,0xff788d,0xffe399],life:3.9,tail:.045,gravity:.035},willow:{label:'しだれ柳',radii:[1],colors:[0xffd08a],life:5.5,tail:.14,gravity:.065}};
// A single shell: all stars use one color and leave a longer chrysanthemum tail.
TYPES.kiku={label:'単色の菊',radii:[1],colors:[0xffd18a],life:3.2,tail:.055,gravity:.032};
// Parent stars are not counted as a core: four/five cores have five/six layers.
TYPES.quad={label:'四重芯',radii:[1,.76,.52,.31,.13],colors:[0x548bff,0xff393f,0x67f591,0xffcf70,0xb67bff],layerWeights:[1,.60,.47,.38,.30],ignition:[.110,.086,.062,.038,.014],life:6.2,fadeStart:3.8,tail:.028,gravity:.016};
TYPES.penta={label:'五重芯',radii:[1,.81,.635,.465,.295,.135],colors:[0x548bff,0xff393f,0x67f591,0xffcf70,0xb67bff,0x66ddff],layerWeights:[1,.60,.47,.38,.30,.22],ignition:[.135,.111,.087,.063,.039,.015],life:6.2,fadeStart:3.8,tail:.022,gravity:.016};
export const CORE_PALETTES=[
 {id:'original',label:'桃紅 × 淡金',colors:[0xff718c,0xffe4a0]},
 {id:'red-green',label:'紅 × 緑',colors:[0xff393f,0x67f591]},
 {id:'green-red',label:'緑 × 紅',colors:[0x67f591,0xff393f]},
 {id:'blue-gold',label:'青 × 金',colors:[0x548bff,0xffcf70]},
 {id:'gold-blue',label:'金 × 青',colors:[0xffcf70,0x548bff]},
 {id:'pink-blue',label:'桃 × 水色',colors:[0xff73c8,0x66ddff]},
 {id:'blue-pink',label:'水色 × 桃',colors:[0x66ddff,0xff73c8]},
 {id:'purple-green',label:'紫 × 緑',colors:[0xb67bff,0x67f591]},
 {id:'green-purple',label:'緑 × 紫',colors:[0x67f591,0xb67bff]},
 {id:'red-white',label:'紅 × 白',colors:[0xff393f,0xf0f6ff]},
 {id:'white-red',label:'白 × 紅',colors:[0xf0f6ff,0xff393f]},
 {id:'gold-pink',label:'金 × 桃',colors:[0xffcf70,0xff73c8]}
];
export const KIKU_PALETTES=[
 {id:'original',label:'金',colors:[0xffd18a]},
 {id:'red',label:'紅',colors:[0xff393f]},
 {id:'blue',label:'青',colors:[0x548bff]},
 {id:'green',label:'緑',colors:[0x67f591]},
 {id:'pink',label:'桃',colors:[0xff73c8]},
 {id:'purple',label:'紫',colors:[0xb67bff]},
 {id:'white',label:'白',colors:[0xf0f6ff]},
 {id:'aqua',label:'水色',colors:[0x66ddff]}
];
export function paletteOptions(kind){return kind==='core'?CORE_PALETTES:kind==='kiku'?KIKU_PALETTES:[];}
export function shellPalette(kind,id='original'){
 return paletteOptions(kind).find(p=>p.id===id)??{id:'original',label:'',colors:TYPES[kind]?.colors??[]};
}
export function sphere(count){return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,a=i*2.399963229728653,r=Math.sqrt(1-y*y);return [r*Math.cos(a),y,r*Math.sin(a)];});}
// Artistic tuning from the creator's observations, not physical shell measurements.
const SHAPE_PROFILES={3:{ellipse:.12,bulge:.025,star:.012},5:{ellipse:.045,bulge:.018,star:.008},10:{ellipse:.022,bulge:.009,star:.004},20:{ellipse:.060,bulge:.040,star:.014}};
function shapeAxis(random){const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);return {x:r*Math.cos(a),y,z:r*Math.sin(a)};}
export function createShellShapeSampler(random=Math.random){
 const decks=new Map();
 return (kind,size)=>{
  // Each kind/size gets one round, one subtle and one natural shell in shuffled order.
  const key=kind+':'+size;let deck=decks.get(key);
  if(!deck?.length){deck=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}decks.set(key,deck);}
  const level=deck.pop(),profile=SHAPE_PROFILES[size]??SHAPE_PROFILES[10];
  const restraint=kind==='sunflower'||kind==='spiral'?.55:kind==='willow'?.8:kind==='kiku'&&size===3?1.35:1;
  const amount=[0,.28,1][level]*restraint*(.85+random()*.30);
  return {level,ellipse:profile.ellipse*amount,bulge:profile.bulge*amount,star:profile.star*amount,axis:shapeAxis(random),lobe:shapeAxis(random),phase:random()*Math.PI*2};
 };
}
export function deformShellVector(vector,shape,strength=1){
 if(shape.level===0)return vector;
 const {x,y,z}=vector,length=Math.hypot(x,y,z);if(!length)return vector;
 const nx=x/length,ny=y/length,nz=z/length,a=shape.axis,b=shape.lobe;
 const along=x*a.x+y*a.y+z*a.z,lobe=nx*b.x+ny*b.y+nz*b.z;
 const axial=1+shape.ellipse*strength,cross=1/Math.sqrt(axial);
 // Broad smooth swelling preserves readable outlines; only a small star-scale ripple.
 const ripple=(Math.sin(nx*17+ny*23+nz*11+shape.phase)+.5*Math.sin(nx*31-ny*13+nz*19-shape.phase))/1.5;
 const gain=1+strength*(shape.bulge*lobe*lobe*lobe+shape.star*ripple);
 vector.x=(x*cross+a.x*along*(axial-cross))*gain;
 vector.y=(y*cross+a.y*along*(axial-cross))*gain;
 vector.z=(z*cross+a.z*along*(axial-cross))*gain;
 return vector;
}
// Electrical launch cues stay together; small artistic fuse differences move the breaks.
export const MAX_IGNITION_DELAY=.25;
export function sampleIgnitionDelays(count,random=Math.random){
 if(count<=0)return [];
 if(count===1)return [.01+random()*.09];
 const spread=.16+random()*.07,spacing=spread/(count-1);
 const delays=Array.from({length:count},(_,i)=>.01+i*spacing+(random()-.5)*Math.min(.012,spacing*.25));
 for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[delays[i],delays[j]]=[delays[j],delays[i]];}
 return delays;
}
export function chapter(t){if(t<35)return '幕開け';if(t<100)return '川沿いの彩り';if(t<170)return '一玉を味わう';if(t<235)return '街のにぎわい';if(t<285)return 'フィナーレ';return '余韻';}
export function cue(t,index,lively=false){const part=chapter(t);if(part==='余韻')return null;const types=['core','double','willow','sunflower'];let kind=types[index%types.length];const size=part==='幕開け'?3:part==='一玉を味わう'?10:part==='フィナーレ'?(index%3===0?10:5):[3,5,10,5][index%4];if(kind==='double'&&size!==10)kind='core';let interval=part==='一玉を味わう'?8.5:part==='フィナーレ'?1.45:part==='街のにぎわい'?2.8:4.8;if(lively&&part!=='一玉を味わう')interval*=.72;return{kind,size,interval,part};}

export function silverPath(age,radius,shell,dx,dy,dz,index){const travel=radius*shell*(.96+.07*Math.sin(index*2.37))*(1-Math.exp(-.90*age));return [dx*travel,dy*travel+.065*age-.035*age*age,dz*travel];}
