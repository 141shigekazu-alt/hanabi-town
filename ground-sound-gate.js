// Co-located, near-simultaneous ground reports share one audible report.
// Aerial shells bypass this gate; visual launches never pass through it.
export class GroundSoundGate{
 constructor(){this.slots=new Map();this.accepted=0;this.merged=0;}
 accept(shot){const key=(shot.small?'small':'large')+':'+Math.round(shot.x/.65)+':'+Math.round(shot.at/.10);if(this.slots.has(key)){this.merged++;return false;}this.slots.set(key,shot.at);this.accepted++;for(const [k,t]of this.slots)if(shot.at-t>2)this.slots.delete(k);return true;}
 clear(){this.slots.clear();this.accepted=0;this.merged=0;}
 get state(){return{accepted:this.accepted,merged:this.merged};}
}
export class AerialSoundGate{
 constructor(){this.slots=new Map();this.accepted=0;this.merged=0;}
 accept(role,x,size,at){
  if(size===20||size===2)return true;
  const key=role+':'+size+':'+Math.round(x/.8)+':'+Math.round(at/.12);
  if(this.slots.has(key)){this.merged++;return false;}
  this.slots.set(key,at);this.accepted++;for(const [k,t]of this.slots)if(at-t>3)this.slots.delete(k);return true;
 }
 clear(){this.slots.clear();this.accepted=0;this.merged=0;}
 get state(){return{accepted:this.accepted,merged:this.merged};}
}
