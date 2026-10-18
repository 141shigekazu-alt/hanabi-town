// Bounded diagnostic history on this device only. No audio, song names or network.
export const MR_RETURN_TRACE_KEY='hanabi-mr-return-trace-v1';
export class MRReturnTrace{
 constructor({build,storage,now=()=>performance.now(),date=()=>new Date().toISOString()}={}){
  Object.assign(this,{build,now,date});this.events=[];this.sessions=new WeakMap();this.nextSession=0;this.lastFrameAt=null;this.errorTimes=new Map();
  try{this.storage=storage??globalThis.localStorage;const saved=JSON.parse(this.storage?.getItem(MR_RETURN_TRACE_KEY)??'null');if(saved?.schema===1&&Array.isArray(saved.events))this.events=saved.events.slice(-95);}catch{}
  this.record('page-open');
 }
 sessionId(session){if(!session)return null;if(!this.sessions.has(session))this.sessions.set(session,++this.nextSession);const state=this.sessions.get(session);return typeof state==='object'?state.id:state;}
 record(event,data={}){
  try{
   const mono=this.now();
   if(event==='frame-error'||event==='unhandled-rejection'){
    const key=event+':'+String(data.message??'');const before=this.errorTimes.get(key);if(before!==undefined&&mono-before<1500)return;this.errorTimes.set(key,mono);
    if(this.errorTimes.size>16)this.errorTimes.delete(this.errorTimes.keys().next().value);
   }
   const row=JSON.parse(JSON.stringify({at:this.date(),mono:Math.round(mono),build:this.build,event,...data}));this.events.push(row);this.events=this.events.slice(-96);
   try{this.storage?.setItem(MR_RETURN_TRACE_KEY,JSON.stringify({schema:1,events:this.events}));}catch{}
  }catch{}
 }
 frame(session,pose){
  if(!session)return;this.lastFrameAt=this.now();let state=this.sessions.get(session);if(typeof state!=='object'){state={id:this.sessionId(session),frame:false,pose:false};this.sessions.set(session,state);}
  if(!state.frame){state.frame=true;this.record('first-xr-frame',{session:state.id,hasPose:!!pose});}
  if(pose&&!state.pose){state.pose=true;const p=pose.transform?.position,q=pose.transform?.orientation;this.record('first-viewer-pose',{session:state.id,viewer:p?{position:[p.x,p.y,p.z],orientation:q?[q.x,q.y,q.z,q.w]:null}:null});}
 }
 snapshot(){try{return JSON.parse(JSON.stringify({schema:1,build:this.build,events:this.events}));}catch{return {schema:1,build:this.build,events:[]};}}
}
