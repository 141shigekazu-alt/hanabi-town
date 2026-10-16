// A canvas copy of input.value has no native caret. Use a real DOM input.
// Interactive XR DOM overlay is optional; the app handles unsupported devices
// with an explicit browser editor and a user-activated return to MR.
// https://immersive-web.github.io/dom-overlays/
export class MRNameEditor{
 constructor({document,onChange=()=>{},onSave}){
  Object.assign(this,{document,onChange,onSave});this.state=null;this.input=null;this.session=null;
  this.root=document.createElement('div');this.root.id='mrNameOverlay';
  this.root.addEventListener('beforexrselect',event=>{if(this.dialog?.contains(event.target))event.preventDefault();});
  document.body.append(this.root);this.endHandler=()=>this.close();
 }
 sessionOptions(){return {requiredFeatures:['local-floor'],optionalFeatures:['hand-tracking','dom-overlay','anchors'],domOverlay:{root:this.root}};}
 open(row,session=null,{returnToMR=null,kind='favorite'}={}){
  this.close();
  if(session&&!session.domOverlayState)return false;
  this.session=session;this.returnToMR=returnToMR;
  this.state={kind,id:row.id,original:row.name,draft:row.name,busy:false,saved:false,keyboardOpen:false,supported:true,nativeField:true,
   message:returnToMR?'このQuestのMR内では標準入力欄を表示できないため、ブラウザで編集しています。文字を指してカーソルを置けます。':'文字を指してカーソルを置くか、範囲を選んで編集してください。'};
  session?.addEventListener('end',this.endHandler,{once:true});this.mountField();this.onChange();this.focus();return true;
 }
 mountField(){
  const d=this.document,dialog=d.createElement('section');dialog.id='mrNameDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',this.state.kind==='track'?'曲名を変える':this.state.kind==='setlist'?'セットリストの名前を変える':'お気に入りの名前を変える');
  const heading=d.createElement('h2');heading.textContent=this.state.kind==='track'?'曲名を変える':'名前を変える';
  const label=d.createElement('label');label.textContent=this.state.kind==='track'?'曲の名前':'保存する名前';label.htmlFor='mrFavoriteNameInput';
  const input=d.createElement('input');input.type='text';input.id='mrFavoriteNameInput';input.maxLength=100;input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label',this.state.kind==='track'?'曲の新しい名前':this.state.kind==='setlist'?'セットリストの新しい名前':'お気に入りの新しい名前');
  input.value=this.state.draft;this.lastValue=input.value;this.input=input;
  input.oninput=()=>this.sync();input.onfocus=()=>{if(this.state){this.state.keyboardOpen=true;this.onChange();}};
  input.onblur=()=>{this.sync();if(this.state){this.state.keyboardOpen=false;this.onChange();}};
  const message=d.createElement('p');message.id='mrNameMessage';message.setAttribute('aria-live','polite');message.textContent=this.state.message;this.message=message;
  const actions=d.createElement('div');actions.className='mr-name-actions';
  const save=d.createElement('button');save.textContent='名前を保存';save.className='mr-name-save';save.onclick=()=>void this.save();this.saveButton=save;
  const cancel=d.createElement('button');cancel.textContent=this.returnToMR?'変更せずMRに戻る':'戻る（名前は変えない）';
  cancel.onclick=()=>{if(this.state?.busy)return;const back=this.returnToMR;this.close();back?.();};this.cancelButton=cancel;
  actions.append(save,cancel);dialog.append(heading,label,input,message,actions);this.root.append(dialog);this.dialog=dialog;
 }
 focus(){if(this.input&&!this.state?.busy&&!this.state?.saved){this.input.focus({preventScroll:true});this.input.setSelectionRange(this.input.value.length,this.input.value.length);}}
 notify(){if(this.message)this.message.textContent=this.state?.message??'';if(this.saveButton)this.saveButton.disabled=!!this.state?.busy;if(this.cancelButton)this.cancelButton.disabled=!!this.state?.busy;this.onChange();}
 sync(){if(this.state&&!this.state.saved&&this.input&&this.input.value!==this.lastValue){this.lastValue=this.input.value;this.state.draft=this.input.value.slice(0,100);this.onChange();}}
 async save(){
  this.sync();const edit=this.state;if(!edit||edit.busy||edit.saved)return false;
  const name=edit.draft.trim();if(!name){edit.message='名前を入力してください。';this.notify();return false;}
  edit.busy=true;this.notify();
  try{
   const ok=await this.onSave(edit.id,name);
   if(ok===false){if(this.state===edit){edit.busy=false;edit.message='名前を保存できませんでした。もう一度お試しください。';this.notify();}return false;}
   if(this.state===edit){
    if(this.returnToMR){edit.busy=false;edit.saved=true;edit.message='名前を保存しました。「MRに戻る」で鑑賞へ戻れます。';this.input.readOnly=true;this.input.blur();this.saveButton.hidden=true;this.cancelButton.textContent='MRに戻る';this.cancelButton.className='mr-name-save';this.notify();}
    else this.close();
   }
   return true;
  }catch(error){if(this.state===edit){edit.busy=false;edit.message='保存できませんでした：'+error.message;this.notify();}return false;}
 }
 close(){
  this.session?.removeEventListener('end',this.endHandler);this.session=null;this.state=null;this.returnToMR=null;
  if(this.input){this.input.oninput=null;this.input.onfocus=null;this.input.onblur=null;this.input=null;}
  this.dialog?.remove();this.dialog=null;this.message=null;this.saveButton=null;this.cancelButton=null;this.onChange();
 }
}
