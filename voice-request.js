// Speech is data: only these bounded directions can reach the director.
export function parseVoiceRequest(input){
 const text=String(input??'').normalize('NFKC').trim().slice(0,600);
 const result={version:1,text,color:null,feeling:null,density:null,size:null,family:null,landscape:null,summary:'',recognized:false};
 if(!text){result.summary='声を聞き取れませんでした。もう一度どうぞ。';return result;}
 // A local rule parser cannot safely interpret arbitrary negation or exclusions.
 if(/(?:じゃなく|ではなく|以外|しないで|上げない|出さない|避け|やめて|いらない|要らない)/.test(text)){result.summary='「金色で、ぽつりぽつり」のように、上げたい花火を教えてください。';return result;}
 if(/海|うみ|波|水辺/.test(text)){result.landscape='sea';result.color='cool';}
 if(/金色|金いろ|ゴールド|黄金|黄色|金の/.test(text))result.color='gold';
 else if(/カラフル|色とりどり|いろとりどり|色取り取り|七色|虹色|キャンディ|多色/.test(text))result.color='multi';
 else if(/紫|むらさき|パープル/.test(text))result.color='violet';
 else if(/青|水色|寒色|涼し|冷た/.test(text))result.color='cool';
 else if(/赤|オレンジ|夕焼|夕日|暖色/.test(text))result.color='warm';
 if(/しっとり|切な|せつな|バラード|静か|ゆったり|落ち着|穏やか/.test(text))result.feeling='sentimental';
 else if(/壮大|雄大|荘厳/.test(text))result.feeling='grand';
 else if(/軽快|元気|弾む|はずむ|ポップ/.test(text))result.feeling='bright';
 else if(/にぎやか|賑やか|派手|打ちまく|乱れ打|連発|速い|早い/.test(text))result.feeling='festival';
 if(/(?:ぽ|ぼ|ポ|ボ)[つツ][りリ]?[、,\s]*(?:ぽ|ぼ|ポ|ボ)[つツ]|ぽつん|まばら|疎ら|少なめ|控えめ|一玉ずつ|一発ずつ|間[をはに]*[空開あ]け|間隔[をは]*[空開あ]け|間隔を広|ゆっくり/.test(text))result.density='sparse';
 else if(/たくさん|沢山|いっぱい|一杯|多め|打ちまく|乱れ打|連発|次々/.test(text))result.density='dense';
 if(/三号|3号|小玉|小さな|小さい/.test(text))result.size='small';
 else if(/五号|5号/.test(text))result.size='medium';
 else if(/大玉|大き[なめい]|尺玉|大輪/.test(text))result.size='large';
 if(/昔ながら|伝統|八重|三重|菊を/.test(text))result.family='traditional';
 else if(/キャンディ|ポップ/.test(text))result.family='pop';
 else if(/創造|蝶|惑星|鼓/.test(text))result.family='modern';
 const labels={landscape:{sea:'海をイメージした穂の風景'},color:{gold:'金色を中心に',multi:'色とりどりに',violet:'紫とキャンディーの彩り',cool:'水色・青の寒色で',warm:'赤・オレンジの暖色で'},feeling:{sentimental:'しっとり',grand:'壮大に',bright:'軽快に',festival:'にぎやかに'},density:{sparse:'ぽつりぽつり、間を空けて',dense:'たくさん、次々と'},size:{small:'３号の小玉を中心に',medium:'５号を中心に',large:'５号・尺玉の大輪を中心に'},family:{traditional:'伝統の玉で',pop:'ポップな玉で',modern:'創造花火を交えて'}};
 result.recognized=['color','feeling','density','size','family','landscape'].some(k=>result[k]);
 result.summary=result.recognized?['landscape','color','feeling','size','density','family'].filter(k=>result[k]).map(k=>labels[k][result[k]]).join(' · '):'「金色で」「しっとり」「ぽつりぽつり」など、イメージを教えてください。';
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
