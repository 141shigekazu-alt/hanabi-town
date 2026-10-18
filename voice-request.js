// Speech is data: only bounded directions can reach the director.
const SIZE=/三号|3号|小玉|小さな|小さい|五号|5号|大玉|大き(?:な|め|い)|尺玉|大輪/g;
const sizeOf=t=>/三号|3号|小玉|小さな|小さい/.test(t)?'small':/五号|5号/.test(t)?'medium':'large';
function sizes(text){
 const mentions=[...text.matchAll(SIZE)].map(m=>({size:sizeOf(m[0]),start:m.index,end:m.index+m[0].length,accent:false}));
 let densityText=text;
 for(const q of text.matchAll(/ところどころ|所々|ときどき|時々|たまに|時折|少し(?:だけ)?(?!ずつ)|少なめ|控えめ|混ぜ|織り交ぜ|添え|アクセント/g)){
  const at=q.index,end=at+q[0].length;
  const ranked=mentions.map(m=>({m,gap:at>=m.end?text.slice(m.end,at):end<=m.start?text.slice(end,m.start):''})).filter(x=>x.gap.length<=14&&!/[、,。.!?！？\n]/.test(x.gap)).sort((a,b)=>a.gap.length-b.gap.length);
  if(ranked.length){ranked[0].m.accent=true;densityText=densityText.slice(0,at)+' '.repeat(q[0].length)+densityText.slice(end);}
 }
 const main=mentions.filter(m=>!m.accent),accent=mentions.find(m=>m.accent);
 return {size:main.find(m=>m.size==='small')?.size??main.find(m=>m.size==='medium')?.size??main[0]?.size??null,sizeAccent:accent?.size??null,densityText};
}
function color(text){return /金色|金いろ|きんいろ|キンイロ|きいろ|キイロ|きにろ|キニロ|ゴールド|黄金|黄色|金の/.test(text)?'gold':/カラフル|色とりどり|いろとりどり|色取り取り|七色|虹色|キャンディ|多色/.test(text)?'multi':/紫|むらさき|パープル/.test(text)?'violet':/青|水色|寒色|涼し|冷た/.test(text)?'cool':/赤|オレンジ|夕焼|夕日|暖色/.test(text)?'warm':null;}
function feeling(text){return /しっとり|切な|せつな|バラード|静か|ゆったり|落ち着|穏やか/.test(text)?'sentimental':/壮大|雄大|荘厳/.test(text)?'grand':/軽快|元気|弾む|はずむ|ポップ/.test(text)?'bright':/にぎやか|賑やか|派手|打ちまく|乱れ打|連発|速い|早い/.test(text)?'festival':null;}
function density(text){return /(?:ぽ|ぼ|ポ|ボ)[つツ][りリ]?[、,\s]*(?:ぽ|ぼ|ポ|ボ)[つツ]|ぽつん|まばら|疎ら|少しだけ|少なめ|控えめ|一玉ずつ|一発ずつ|間[をはに]*[空開あ]け|間隔[をは]*[空開あ]け|間隔を広|ゆっくり/.test(text)?'sparse':/たくさん|沢山|いっぱい|一杯|多め|打ちまく|乱れ打|連発|次々/.test(text)?'dense':null;}
function scopes(text){
 // A closing instruction ends at a sentence boundary or an explicit return to
 // the whole/body. Unpunctuated speech works too; no transcript words are changed.
 const marker=/(?:最後|ラスト|終盤|フィナーレ|締め)(?:の方|のほう)?(?:だけ|は|を|に)?/g;
 const removed=[],endings=[];
 for(const m of text.matchAll(marker)){
  if(removed.some(([a,b])=>m.index>=a&&m.index<b))continue;
  const from=m.index+m[0].length,tail=text.slice(from),boundary=tail.search(/[。.!?！？\n]|全体|全編|基本|それまでは|途中|前半|中盤/),end=boundary<0?text.length:from+boundary;
  endings.push(text.slice(from,end));removed.push([m.index,end]);
 }
 let body=text;for(const [a,b] of removed.reverse())body=body.slice(0,a)+' '.repeat(b-a)+body.slice(b);
 return {body,ending:endings.join('、')};
}
export function parseVoiceRequest(input){
 const text=String(input??'').normalize('NFKC').trim().slice(0,600);
 const result={version:2,text,color:null,feeling:null,density:null,size:null,sizeAccent:null,finale:null,family:null,landscape:null,patterns:null,summary:'',recognized:false};
 if(!text){result.summary='声を聞き取れませんでした。もう一度どうぞ。';return result;}
 if(/(?:じゃなく|ではなく|以外|しないで|上げない|出さない|避け|やめて|いらない|要らない)/.test(text)){result.summary='「金色で、ぽつりぽつり」のように、上げたい花火を教えてください。';return result;}
 const {body,ending}=scopes(text),s=sizes(body);
 if(/型物|型もの|かたもの|ハート|にこちゃん|ニコちゃん|スマイル/.test(body)){
  const heart=/ハート/.test(body),smile=/にこちゃん|ニコちゃん|スマイル/.test(body);
  result.patterns=heart&&smile?'mixed':/二重.*ハート|ハート.*二重/.test(body)?'double':smile?'smile':heart?'heart':'all';
 }
 if(/海|うみ|波|水辺/.test(body)){result.landscape='sea';result.color='cool';}
 result.color=color(body)??result.color;result.feeling=feeling(body);result.density=density(s.densityText);result.size=s.size;result.sizeAccent=s.sizeAccent;
 if(/昔ながら|伝統|八重|三重|菊を/.test(body))result.family='traditional';
 else if(/キャンディ|ポップ/.test(body))result.family='pop';
 else if(/創造|蝶|惑星|鼓/.test(body))result.family='modern';
 if(ending){
  const e=sizes(ending),f={energy:/盛大|壮大|豪華|華や|派手|賑やか|にぎやか|盛り上|連発|ドカン|どかん/.test(ending)?'grand':/しっとり|静か|余韻|穏やか|控えめ|ぽつり|一輪|一玉/.test(ending)?'quiet':null,color:color(ending),size:e.size??e.sizeAccent,density:density(e.sizeAccent?ending:e.densityText)};
  if(Object.values(f).some(Boolean))result.finale=f;
 }
 const labels={landscape:{sea:'海をイメージした穂の風景'},color:{gold:'金色を中心に',multi:'色とりどりに',violet:'紫とキャンディーの彩り',cool:'水色・青の寒色で',warm:'赤・オレンジの暖色で'},feeling:{sentimental:'全体はしっとり',grand:'全体は壮大に',bright:'全体は軽快に',festival:'全体はにぎやかに'},density:{sparse:'ぽつりぽつり、間を空けて',dense:'たくさん、次々と'},size:{small:'３号の小玉を中心に',medium:'５号を中心に',large:'５号・尺玉の大輪を中心に'},family:{traditional:'伝統の玉で',pop:'ポップな玉で',modern:'創造花火を交えて'}};
 result.recognized=['color','feeling','density','size','sizeAccent','finale','family','landscape','patterns'].some(k=>result[k]);
 const parts=['landscape','color','feeling','size','density','family'].filter(k=>result[k]).map(k=>labels[k][result[k]]);
 if(result.patterns)parts.push({all:'型物のまとまりを入れる',heart:'ハートのまとまりを入れる',double:'二重ハートのまとまりを入れる',smile:'ニコちゃんのまとまりを入れる',mixed:'ハートとニコちゃんを交ぜる'}[result.patterns]);
 if(result.sizeAccent)parts.push({small:'小玉をときどき添える',medium:'５号をときどき添える',large:'大玉をところどころに'}[result.sizeAccent]);
 if(result.finale){const f=result.finale,endingParts=[f.energy==='grand'?'盛大に':f.energy==='quiet'?'静かな余韻に':null,f.color?labels.color[f.color]:null,f.size?labels.size[f.size]:null,f.density?labels.density[f.density]:null].filter(Boolean);parts.push('最後は'+endingParts.join('、'));}
 result.summary=result.recognized?parts.join(' · '):'「金色で」「しっとり」「ぽつりぽつり」など、イメージを教えてください。';
 return result;
}
export function voiceProgrammeStyle(style,request){
 if(!request?.recognized)return style;
 const s={...style};
 if(request.color){s.color=request.color;s.colorLabel={gold:'金色・黄色の花火で統一',cool:'水色・青・紫',warm:'赤と夕焼け',multi:'彩り豊か',violet:'紫とキャンディーの彩り'}[s.color];}
 if(request.landscape==='sea'){s.landscape='sea';s.flowerFocus=false;}
 if(request.family){s.family=request.family;s.label={traditional:'伝統の玉を味わう',pop:'ポップに弾む',modern:'創造花火を楽しむ'}[s.family];}
 if(request.density==='sparse'){s.staging='solos';s.stagingLabel='ぽつりぽつり、間を味わう';s.flowerFocus=false;s.landscape='none';}
 if(s.color==='gold'&&['flowers','sea','paddy'].includes(s.landscape)){s.landscape='ears';s.flowerFocus=false;}
 s.description=[s.label,s.colorLabel,s.stagingLabel].join(' · ');return s;
}
