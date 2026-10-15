import {paletteOptions} from './fireworks.js?v=1.2.79';

export const SHOW_FAMILIES=['traditional','pop','modern','mixed'];
const labels={traditional:'伝統の玉を味わう',pop:'ポップに弾む',modern:'創造花火を楽しむ',mixed:'いろんな玉の競演'};
const colorLabels={multi:'彩り豊か',warm:'赤と夕焼け',cool:'青と紫',gold:'金色の夜空'};
const stagingLabels={flow:'小玉から大輪へ',dialogue:'左右の掛け合い',solos:'一玉を見せる',garden:'花を主役に'};
export function styleHash(seed,index=0){let x=(Number(seed)^Math.imul(index+1,0x9e3779b9))>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0;}
export function drawProgrammeStyle(seed,variation=0,{feeling='auto',bpm=120}={}){
 const family=SHOW_FAMILIES[(styleHash(seed)%4+variation)%4],r=styleHash(seed,variation+5);
 const colors=feeling==='sentimental'?['cool','cool','gold','multi']:feeling==='grand'?['gold','gold','warm','cool','multi']:feeling==='bright'?['multi','multi','warm','cool']:['multi','warm','cool','gold'];
 const color=colors[r%colors.length],landscape=['none','ears','flowers','sea','none','flowers','paddy','ears'][(styleHash(seed,41)%8+variation)%8],flowerFocus=landscape==='flowers';
 const staging=flowerFocus?'garden':(bpm<100?['solos','dialogue','flow']:['flow','dialogue','solos'])[(r>>>10)%3];
 return{version:2,landscape,seed:styleHash(seed,variation+17),family,color,staging,flowerFocus,label:labels[family],colorLabel:colorLabels[color],stagingLabel:stagingLabels[staging],description:[labels[family],colorLabels[color],stagingLabels[staging]].join(' · ')};
}
export function shellFamily(kind){return ['candy','candyburst','candysenrin'].includes(kind)?'pop':['longstar','sparklelarge','butterfly','planet','drum','sunflower','petalflower','goldflower'].includes(kind)?'modern':kind==='ear'?null:'traditional';}
function pool(family,size,flowers=false){
 if(family==='traditional')return size===3?['kiku','kiku','core']:size===5?['core','core','willow','silver']:size===10?['double','core','quad','penta','willow']:['triple'];
 if(family==='pop')return size===3?['candy']:size===5?['candy','candyburst']:size===10?['candy','candyburst','candysenrin']:['triple'];
 if(size===3)return ['petalflower','goldflower'];
 return flowers?['sunflower','petalflower','goldflower']:['longstar','sparklelarge','petalflower','goldflower','sunflower'];
}
export function styleKind(style,size,index,attempt=0){
 if(![3,5,10].includes(size))return null;
 const other=['traditional','pop','modern'];
 // Ten gestures: seven of the chosen family, then three accents. Mixed deals
 // the three families evenly rather than drawing them independently each time.
 const family=style.family==='mixed'?other[index%3]:index%10<7?style.family:other[(index+Math.floor(index/10))%3];
 const choices=style.color==='gold'&&family==='traditional'?(size===3?['kiku','willow','silver']:['willow','silver']):style.color==='gold'&&family==='modern'&&size>=5?['goldflower','longstar','sparklelarge']:pool(family,size,style.flowerFocus);return choices[(styleHash(style.seed,index)+attempt)%choices.length];
}
function paletteScore(p,color){
 const rgb=p.colors??[];if(!rgb.length)return 0;
 let score=0;
 for(const c of rgb){const r=(c>>>16)&255,g=(c>>>8)&255,b=c&255;
  score+=color==='warm'?(r-Math.max(g,b)*.75):color==='cool'?Math.max(g*.7,b)-r*.65:color==='gold'?r*.6+g*.4-b*1.2:0;
 }
 return score/rgb.length;
}
export function stylePalette(style,kind,index){
 const options=paletteOptions(kind);if(!options.length)return 'original';
 if(kind==='drum'&&(style.family==='pop'||style.color==='multi'))return 'drum-candy';
 const roll=styleHash(style.seed,index+811);
 if(style.color==='multi'||roll%10>=8)return options[roll%options.length].id;
 const ranked=options.map(p=>({p,score:paletteScore(p,style.color)})).sort((a,b)=>b.score-a.score);
 return ranked[0].p.id;
}
export function stylePosition(style,position,index){
 const p={...position};
 if(style.staging==='dialogue'){p.x=Math.max(-1.2,Math.min(1.2,(p.x??0)+(Math.floor(index/4)%2?-.25:.25)));if(Number.isFinite(p.launchX))p.launchX+=p.x-(position.x??0);}
 return p;
}
