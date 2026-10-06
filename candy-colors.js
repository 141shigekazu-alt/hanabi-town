// Saturated stars: colours and motion use independent deterministic streams.
export const CANDY_PALETTES=[
 {id:'candy-mix',label:'５色のキャンディー',colors:[0xff28cf,0x22cfff,0xa33aff,0x68ff24,0xffe629]},
 {id:'candy-pink-aqua',label:'ピンク × 水色 × 紫',colors:[0xff28cf,0x22cfff,0xa33aff]},
 {id:'candy-lime-purple',label:'ライム × 紫 × レモン',colors:[0x68ff24,0xa33aff,0xffe629]},
 {id:'candy-pink',label:'蛍光ピンク',colors:[0xff28cf]},
 {id:'candy-aqua',label:'鮮烈な水色',colors:[0x22cfff]},
 {id:'candy-purple',label:'紫',colors:[0xa33aff]},
 {id:'candy-lime',label:'ライム',colors:[0x68ff24]},
 {id:'candy-lemon',label:'レモン黄',colors:[0xffe629]}
];
export function candyColor(index,seed,colors){
 let hash=(seed>>>0)^0x85ebca6b;hash=Math.imul(hash^(hash>>>16),0x7feb352d)>>>0;
 const stride=colors.length===5||colors.length===3?2:1;
 return colors[(index*stride+hash%colors.length)%colors.length];
}
export const CANDY_COMET_STYLES=Object.fromEntries(CANDY_PALETTES.map(p=>[p.id,{label:p.label,head:p.colors[0],headPalette:p.colors,tail:p.colors[0],coloredTail:true,headGain:1.9,bundleCountScale:.42,colorSpread:.22,tailGain:.38,burn:1.04,afterglow:.88,spread:.020,lanes:2}]));
