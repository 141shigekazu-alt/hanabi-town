// A display revision is independent of the random arrangement/analysis seed.
// Only an installed programme can become ready; entering MR is not a rebuild.
export class ShowPreparation{
 constructor(){this.phase='preparing';this.revision=0;this.current=null;this.pending=null;this.token=null;this.error='';this.startedAt=performance.now();}
 begin(settings={title:'選んだ曲',setting:'設定を確認しています'}){if(this.phase!=='preparing')this.startedAt=performance.now();this.phase='preparing';this.pending={...settings};this.error='';}
 ready(settings,token){
  if(token!==this.token||JSON.stringify(settings)!==JSON.stringify(this.current))this.revision++;
  this.current={...settings};this.token=token;this.pending=null;this.error='';this.phase='ready';
 }
 fail(message){this.phase='error';this.error=message;}
 restore(){this.phase=this.current?'ready':'idle';this.pending=null;this.error='';}
 view({running=false,paused=false}={}){
  const item=this.phase==='preparing'||this.phase==='error'?this.pending??this.current:this.current;
  const elapsed=Math.max(0,Math.floor((performance.now()-this.startedAt)/1000));
  const stage=/仕込|花火の準備/.test(item?.setting??'')?'花火を仕込み中':/構成|設定/.test(item?.setting??'')?'構成を準備中':/解析/.test(item?.setting??'')?'曲を解析中':'曲を準備中';
  const heading=this.phase==='preparing'?(item?.heading??`${stage} · ${elapsed}秒経過`):this.phase==='error'?'準備できませんでした':this.phase==='idle'?'曲を選んでください':running?'開演中':paused?'一時停止中':`✓ この設定で準備完了 · 更新${this.revision}`;
  return {phase:this.phase,revision:this.revision,heading,title:item?.title??'選んだ曲',setting:this.phase==='error'?this.error:(item?.setting??'音源と構成を準備しています')+(this.phase==='preparing'&&Number.isFinite(item?.progress)?` · ${Math.round(Math.max(0,Math.min(1,item.progress))*100)}％`:'')};
 }
}
