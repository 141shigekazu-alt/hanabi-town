// Candidate colours are test choices, not a claim about the headset's appearance.
export const DIES_RED_OPTIONS=[
 {id:'reference',label:'現行の赤（比較基準）',head:0xff263f,headGain:1.65},
 {id:'a',label:'A 朱・青みを抑えた赤',head:0xd90006,headGain:1.50},
 {id:'b',label:'B 深紅',head:0xb00003,headGain:1.65},
 {id:'c',label:'C 暗紅',head:0x800002,headGain:2.10}
];
export const RED_BASES=['red','red-orange-tail','red-silver','flame-red','flame-red-silver'];
const styleKey=(id,base)=>id==='reference'?base:`dies-red-${id}-${base}`;
export function diesRedStyles(baseStyles){const out={};for(const c of DIES_RED_OPTIONS.filter(c=>c.id!=='reference'))for(const base of RED_BASES){const original=baseStyles[base];if(!original)continue;out[styleKey(c.id,base)]={...original,label:c.label+'・'+(base.includes('flame')?'紅の尾':base==='red-orange-tail'?'橙の尾':base.includes('silver')?'銀の尾':'金の尾'),head:c.head,headGain:c.headGain,...(base.startsWith('flame')?{tail:c.head}:{})};}return out;}
export function withDiesRed(plan,id='c'){
 const candidate=DIES_RED_OPTIONS.find(c=>c.id===id);if(!candidate)throw Error('Unknown red candidate');
 const fans=structuredClone(plan.fans);
 for(const f of fans){const match=/^dies-red-[abc]-(.*)$/.exec(f.style),base=match?.[1]??f.style;if(RED_BASES.includes(base))f.style=styleKey(id,base);
  for(const s of f.options?.naritaShots??[]){const m=/^dies-red-[abc]-(.*)$/.exec(s.style),b=m?.[1]??s.style;if(RED_BASES.includes(b))s.style=styleKey(id,b);if(s.diesOriginalRedTip||[0xff263f,0xff393f].includes(s.tipColor)){s.diesOriginalRedTip=true;s.tipColor=candidate.head;}}
  if(f.options&&(f.options.diesOriginalRedTip||[0xff263f,0xff393f].includes(f.options.tipColor))){f.options.diesOriginalRedTip=true;f.options.tipColor=candidate.head;}
 }
 return{...plan,fans,redReviewCandidate:id};
}
