// Shared score extracted from the Quest-approved 0.5. Coordinates are review-space units.
export const NARITA_PARTS=[
 {id:'full',label:'３号から最後まで駆け抜ける',seconds:20.665},
 {id:'double-two-shaku',label:'上段に二尺２発を重ねる特別版',seconds:20.665,rare:true},
 {id:'roof',label:'屋根トラを重ねる特別版',seconds:20.665,rare:true},
 {id:'gold-only',label:'カムロから最後まで駆け抜ける',seconds:11.265},
 {id:'cool-rush',label:'紫・水色・青の３号連打',seconds:8.83}
];
export function naritaScore(variant='full'){
 if(!NARITA_PARTS.some(p=>p.id===variant))throw Error('Unknown Narita part: '+variant);
 const strokes=[],shells=[];
 const shot=(x,at,vx,vy,burn=1.45,white=false,small=false)=>strokes.push({x,at:10+at*.90,vx,vy,burn,white,small});
 // Running paired diagonals: leave space between the opening gestures.
 for(let k=0;k<5;k++)for(const sign of [-1,1]){shot(sign*(3.8-k*.68),k*.29,-sign*1.05,1.28,1.4,k%2===0);}
 // Repeat the crossing with a higher crest, centre travelling outwards.
 for(let k=0;k<5;k++)for(const sign of [-1,1])for(const d of [-1,1])shot(sign*k*.78,2.35+k*.16,d*.91,1.5,1.55,d>0);
 // Three distinct fans, their roots separated across the waterfront.
 for(const x of [-3,0,3])for(let j=-3;j<=3;j++)shot(x,4.9+Math.abs(x)*.08+Math.abs(j)*.035,j*.38,1.62-Math.abs(j)*.10,1.55,j%2===0);
 // A clean white/gold lattice after the fan has opened.
 for(let k=0;k<9;k++)for(const d of [-1,1])shot((k-4)*.92,7.45+Math.abs(k-4)*.055,d*.86,1.3,1.65,d>0);
 // The last low breath travels from the edges to the middle.
 for(let k=0;k<9;k++)for(const d of [-1,1])shot((k-4)*.94,10.0+(4-Math.abs(k-4))*.07,d*.48,1.02,1.05,d>0);
 const shell=(x,at,y,scale,palette='kamuro-gold')=>shells.push(({x,at:10+at*.90,y,z:-.45,scale,palette,seed:1247+shells.length*977}));
 for(let i=0;i<3;i++)shell((i-1)*2.9,1.65+Math.abs(i-1)*.10,3.75,1.8);
 for(let i=0;i<5;i++)shell((i-2)*1.8,6.65+Math.abs(i-2)*.09,3.85,1.8);
 for(let i=0;i<3;i++)shell((i-1)*3.0,11.85,4.1+(i===1?.25:0),2.8);
 // Five-inch lower row: the exact same burst time as the final three shaku.
 for(let i=0;i<7;i++)shells.push(({size:5,x:(i-3)*1.22,at:10+11.85*.90,y:2.28,z:-.28,scale:2.05,palette:'kamuro-gold',seed:27001+i*977}));
 // Keep fresh blooms arriving: carry the small-shell pressure through the gold section.
 const finalAt=10+11.85*.90;
 for(let row=0;row<12;row++)for(let i=0;i<7;i++){
 const at=9.4+row*.88+(row%2?6-i:i)*.045;
 shells.push(({kind:'kiku',size:5,x:(i-3)*1.2+(row%2?.12:-.12),at,y:2.65+.10*Math.sin(i+row),z:-.3,scale:2.1,palette:'kamuro-gold',seed:51001+row*977+i*139}));
 }
 for(const at of [14.5,17.3])for(let i=0;i<3;i++)shells.push(({x:(i-1)*2.9,at:at+Math.abs(i-1)*.06,y:3.9,z:-.45,scale:2.15,palette:'kamuro-gold',seed:62001+Math.round(at*100)+i*977}));
 // No lull under the upper blooms: changing diagonals and short upright accents.
 for(let wave=0;wave<8;wave++)for(let k=0;k<7;k++){
 const x=(k-3)*1.18,at=9.2+wave*1.35+k*.035;
 shot(x,0,wave%3===2?0:(wave%2?1:-1)*.78,wave%3===2?1.65:1.26,1.15,k%2===0,wave%3===2);
 strokes[strokes.length-1].at=at;
 }
 // First apparent climax: overlapping three-inch chrysanthemums in cool colours.
 const colours=['purple','aqua','blue'];
 for(let row=0;row<9;row++)for(let i=0;i<7;i++){
 const order=row%2===0?i:6-i;
 shells.push(({kind:'kiku',size:3,x:(i-3)*1.12+(row%2?.25:-.15),at:1.4+row*.88+order*.065,y:2.75+.12*Math.sin(i*1.7+row),z:-.3,scale:2.8,palette:colours[(row+Math.floor(i/3))%3],seed:7013+row*977+i*139}));
 }
 // Intermittent vertical kotora: short upright lifts amongst the lateral blooms.
 const before=strokes.length;
 for(const [at,xs] of [[.25,[-3.6,0,3.6]],[2.6,[-2.4,2.4]],[4.6,[-3.6,-1.2,1.2,3.6]],[6.7,[-2.4,0,2.4]],[8.7,[-3.6,-1.8,0,1.8,3.6]]])
 for(const x of xs){shot(x,0,0,1.48,.85,false,true);strokes[strokes.length-1].at=at;}
 // Keep the big tiger show going underneath; each wave changes direction.
 for(let wave=0;wave<3;wave++)for(let k=0;k<7;k++){
 const x=(k-3)*1.12;shot(x,0,(wave%2?1:-1)*(.55+.08*Math.abs(k-3)),1.12,1.45,k%2===0);
 strokes[strokes.length-1].at=1.0+wave*3.1+(wave%2?k:6-k)*.11;
 }

 let selectedShells=shells,selectedStrokes=strokes,offset=0;
 if(variant==='gold-only'){offset=9.4;selectedShells=shells.filter(s=>s.at>=9.4);selectedStrokes=strokes.filter(s=>s.at>=9.2);}
 if(variant==='cool-rush'){selectedShells=shells.filter(s=>s.size===3);selectedStrokes=strokes.filter(s=>s.at<9.2);}
 if(variant==='double-two-shaku')for(let i=0;i<2;i++)selectedShells.push({size:20,x:(i-.5)*3.8,at:finalAt,y:5.65,z:-.65,scale:3.2,palette:'kamuro-gold',seed:81001+i*977});
 const roof=variant==='roof'?[{at:11.0}]:[];
 return {id:variant,label:NARITA_PARTS.find(p=>p.id===variant).label,seconds:NARITA_PARTS.find(p=>p.id===variant).seconds,
 shells:selectedShells.map(s=>({...s,at:s.at-offset,kind:s.kind??'silver',size:s.size??10})).sort((a,b)=>a.at-b.at),
 strokes:selectedStrokes.map(s=>({...s,at:Math.max(0,s.at-offset)})).sort((a,b)=>a.at-b.at),roof};
}
