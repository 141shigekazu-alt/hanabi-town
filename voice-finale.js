import {stylePalette} from './programme-style.js';
// Reserve an explicit closing gesture before filling the body of the song.
// The caller uses the same commit/capacity checks as every existing finale.
export function requestedFinale(request,{candidate,row,finalOpening,style}){
 const f=request?.finale;if(!f)return null;
 const grand=f.energy==='grand'||!f.energy&&f.density==='dense',quiet=f.energy==='quiet'||!f.energy&&f.density==='sparse';
 if(!grand&&!quiet)return null;
 const tone=(kind,i)=>stylePalette({...style,...(f.color?{color:f.color}:{})},kind,i);
 const shots=grand?[
  ...row(finalOpening-4,'kiku',5,3,tone('kiku',0),'auto-finale',.65),
  ...row(finalOpening-2,'core',5,2,tone('core',1),'auto-finale',1.1),
  ...row(finalOpening,'silver',10,3,tone('silver',2),'auto-finale',.65,{wide:true})
 ]:[candidate('kiku',5,finalOpening-7,'auto-finale',-.45,tone('kiku',0)),candidate('willow',10,finalOpening,'auto-finale',.15,tone('willow',1))];
 return {kind:grand?'voice-crescendo':'voice-afterglow',label:grand?'声の希望 · 最後は三段に重ねて盛大に':'声の希望 · 最後は一輪ずつ静かな余韻へ',shots,grand};
}
