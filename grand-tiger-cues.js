// Photo-derived first pass; exact shot counts and timing remain visual estimates.
export function mainCues(){
 const cues=[];for(let i=0;i<7;i++)cues.push({x:(i-3)*.20,at:0,band:0});
 for(let band=1;band<=3;band++)for(const sign of [-1,1])for(let i=0;i<5;i++)cues.push({x:sign*(.90+(band-1)*1.05+i*.20),at:[0,.85,1.75,2.65][band],band});
 return cues.map((cue,index)=>({...cue,seed:417+index*131,vx:0,photoVx:-Math.sign(cue.x)*(.012+.035*Math.abs(cue.x))}));
}
export const GRAND_STYLES={
 gold:{head:0xffcf77,tail:0xffbd65},
 'grand-red':{head:0xff3867,tail:0xffbd65},
 'grand-green':{head:0x70ff50,tail:0xffbd65},
 'grand-pink':{head:0xff6cda,tail:0xff81c7},
 'grand-aqua':{head:0x62dfff,tail:0xffbd65},
 'grand-yellow':{head:0xffde78,tail:0xffbd65}
};
export function openingColourShots(seed=417){
 const shots=[];
 for(const cue of mainCues())for(const [style,height,count,offset]of [['grand-red',.55,16,.025],['grand-green',.34,12,0],['grand-pink',.12,10,0]]){
  shots.push({x:cue.x,y:.035,z:-.03,angles:[0],height,count,at:cue.at+offset,style,seed:cue.seed+Math.round(height*1000)+(seed-417),small:true,basicTiger:true,earlyBurn:true,coloredTip:true,spreadScale:.80});
 }
 return shots;
}
export function layerColourShots(seed=417){
 const shots=[],rows=[['grand-yellow',.20],['grand-green',.34],['grand-aqua',.48],['grand-pink',.62]];
 for(let row=0;row<rows.length;row++)for(let i=0;i<19;i++){
  const [style,height]=rows[row],u=i-9;
  shots.push({x:u*.40,y:.035,z:-.03,angles:[0],height,count:12,at:3.35+Math.abs(u)*.075+row*.18,style,seed:seed+i*313+row*1171,small:true,basicTiger:true,earlyBurn:true,coloredTip:true,spreadScale:.80});
 }
 return shots;
}
