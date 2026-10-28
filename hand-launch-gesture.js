// Timed state machine; losing tracking can never become an opening gesture.
export class HandLaunchGesture{
 constructor(){this.states=new WeakMap();}
 reset(source){if(source)this.states.delete(source);else this.states=new WeakMap();}
 sample(source,stamp,{closed=false,open=false,eligible=false,tracked=true}={}){
  let s=this.states.get(source);
  if(!s){s={phase:'idle',since:null,opening:null,openSince:null,last:stamp,needsOpen:false,until:0};this.states.set(source,s);}
  if(!tracked||stamp-s.last>150){s.phase='idle';s.since=s.opening=s.openSince=null;s.needsOpen=true;s.until=stamp+700;}
  s.last=stamp;
  const result=fire=>({fire,charge:s.phase==='charging'?Math.min(1,(stamp-s.since)/350):s.phase==='armed'?1:0,armed:s.phase==='armed',suppress:closed||s.phase==='charging'||s.phase==='armed'||stamp<s.until});
  if(!tracked)return result(false);
  if(open){s.openSince??=stamp;if(stamp-s.openSince>=120)s.needsOpen=false;}else s.openSince=null;
  if(!eligible){if(s.phase==='armed'||s.phase==='charging'){s.needsOpen=true;s.until=stamp+700;}s.phase='idle';s.since=s.opening=null;return result(false);}
  if(stamp<s.until||s.needsOpen)return result(false);
  if(closed){if(s.phase==='idle'){s.phase='charging';s.since=stamp;}if(s.phase==='charging'&&stamp-s.since>=350)s.phase='armed';s.opening=null;return result(false);}
  if(s.phase==='charging'){s.phase='idle';s.since=null;return result(false);}
  if(s.phase==='armed'){
   s.opening??=stamp;
   if(stamp-s.opening>700){s.phase='idle';s.needsOpen=true;s.until=stamp+700;return result(false);}
   if(open&&stamp-s.opening>=60){s.phase='idle';s.since=s.opening=null;s.needsOpen=true;s.openSince=null;s.until=stamp+900;return result(true);}
  }
  return result(false);
 }
 suppress(source,stamp){const s=this.states.get(source);return !!s&&(s.phase==='charging'||s.phase==='armed'||stamp<s.until);}
}
