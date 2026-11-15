import {t,onLanguageChange} from './i18n.js';
export class MREntryFeedback{
 constructor(){this.active=false;this.phase='';this.timer=null;this.log=[];onLanguageChange(()=>{if(this.active)this.render();});}
 begin(phase='Questの入室を待っています…'){
  if(!this.active){this.active=true;this.started=performance.now();this.log=[];this.timer=setInterval(()=>this.render(),1000);}
  this.phase=phase;this.log.push({phase,elapsed:performance.now()-this.started});this.render();
 }
 render(){
  if(!this.active)return;const button=document.getElementById('showRoom');if(!button)return;
  button.disabled=true;button.setAttribute('aria-busy','true');button.classList.add('mr-entering');button.textContent=t('MRに入っています…');
  let status=document.getElementById('mrEntryStatus');if(!status){status=document.createElement('p');status.id='mrEntryStatus';status.setAttribute('role','status');status.dataset.noTranslate='';button.after(status);}
  status.hidden=false;status.textContent=t(this.phase)+' · '+Math.floor((performance.now()-this.started)/1000)+'s';
 }
 clear(){
  if(!this.active)return;this.log.push({phase:'finished',elapsed:performance.now()-this.started});this.active=false;clearInterval(this.timer);this.timer=null;
  const button=document.getElementById('showRoom');if(button){button.classList.remove('mr-entering');button.removeAttribute('aria-busy');button.textContent=t('MRで観る');}
  const status=document.getElementById('mrEntryStatus');if(status)status.hidden=true;
 }
}
export const mrEntryFeedback=new MREntryFeedback();
window.__mrEntryFeedback=mrEntryFeedback;
