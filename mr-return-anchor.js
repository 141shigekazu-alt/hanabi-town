// A single temporary anchor carries the town across the browser keyboard.
// Its handle stays local and is deleted once placement is restored.
const KEY='hanabi-name-return-anchor';
export class MRReturnAnchor{
 constructor(){this.waiting=null;}
 async beginSession(session,keep=null){
  let old;try{old=sessionStorage.getItem(KEY);}catch{}
  if(old&&old!==keep)await this.discard(session,old);
 }
 capture(session,placement){
  if(typeof session.restorePersistentAnchor!=='function'||typeof globalThis.XRRigidTransform!=='function')return Promise.resolve(null);
  this.cancel();return new Promise(resolve=>{
   const task={session,placement,resolve,active:true};this.waiting=task;
   task.timer=setTimeout(()=>{if(this.waiting===task)this.waiting=null;task.active=false;resolve(null);},2500);
  });
 }
 frame(frame,space,session){
  const task=this.waiting;if(!task||task.session!==session||task.started)return;task.started=true;
  const done=handle=>{if(this.waiting===task)this.waiting=null;clearTimeout(task.timer);if(!task.active){if(handle)void this.discard(session,handle);return;}task.active=false;if(handle)try{sessionStorage.setItem(KEY,handle);}catch{}task.resolve(handle);};
  if(!frame?.createAnchor){done(null);return;}
  const p=task.placement.position,q=task.placement.quaternion;
  try{
   const transform=new XRRigidTransform({x:p[0],y:p[1],z:p[2]},{x:q[0],y:q[1],z:q[2],w:q[3]});
   Promise.resolve(frame.createAnchor(transform,space)).then(async anchor=>{
    let handle=null;try{handle=typeof anchor.requestPersistentHandle==='function'?await anchor.requestPersistentHandle():null;done(handle);}
    catch{done(null);}finally{if(!handle)try{anchor.delete?.();}catch{}}
   },()=>done(null));
  }catch{done(null);}
 }
 cancel(session=null){const task=this.waiting;if(task&&(!session||task.session===session)){clearTimeout(task.timer);this.waiting=null;task.active=false;task.resolve(null);}}
 async restore(session,handle){
  if(!handle||typeof session.restorePersistentAnchor!=='function')return null;
  let timer,expired=false;const actual=Promise.resolve().then(()=>session.restorePersistentAnchor(handle)).then(anchor=>{if(expired){try{anchor.delete?.();}catch{}return null;}return anchor;},()=>null);
  const timeout=new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve(null);},2000);});
  const anchor=await Promise.race([actual,timeout]);clearTimeout(timer);return anchor;
 }
 async discard(session,handle,anchor=null){
  try{anchor?.delete?.();}catch{}
  if(handle){try{await session?.deletePersistentAnchor?.(handle);}catch{}try{if(sessionStorage.getItem(KEY)===handle)sessionStorage.removeItem(KEY);}catch{}}
 }
}
