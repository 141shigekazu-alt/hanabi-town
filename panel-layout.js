import {FLOWER_PATTERNS,FLOWER_TIMINGS,FLOWER_SPACINGS,FLOWER_COLORS} from './flower-scenes.js';
import {mountHelp} from './help-content.js';
// Keep one set of controls: the browser and MR panel share their values.
export function organizePanel(){
 const $=id=>document.getElementById(id),make=(tag,attrs={},text='')=>{const el=document.createElement(tag);Object.assign(el,attrs);el.textContent=text;return el;};
 const move=(parent,id)=>parent.append($(id));
 const field=(parent,id)=>parent.append($(id).closest('label'));
 const details=(parent,title,id)=>{const el=make('details',{id});el.append(make('summary',{},title));parent.append(el);return el;};
 const hearts=make('div',{className:'panel-heart-actions'});for(const [id,text] of [['favoriteToggle','♡'],['favoriteListOpen','♥ 一覧']])hearts.append(make('button',{id},text));$('panel').prepend(hearts);const saved=make('p',{id:'favoriteSaveStatus',role:'status'});$('panel').append(saved);
 const page=$('browserPage4'),old=make('div',{hidden:true});
 while(page.firstChild)old.append(page.firstChild);
 page.append(old);
 const card=make('div',{className:'show-card'});page.prepend(card);
 card.append(make('h2',{},'今日の花火大会'));
 const songRow=make('div',{className:'song-selector'});card.append(songRow);field(songRow,'musicTrack');
 const songActions=make('div',{className:'song-actions'});songRow.append(songActions);
 const songMenuToggle=make('button',{id:'trackMenuToggle'},'…');songMenuToggle.setAttribute('aria-label','曲の操作');songMenuToggle.setAttribute('aria-haspopup','menu');songMenuToggle.setAttribute('aria-expanded','false');songActions.append(songMenuToggle);
 const songMenu=make('div',{id:'trackMenu',hidden:true});songMenu.setAttribute('role','menu');songActions.append(songMenu);
 const rename=make('button',{id:'trackRename'},'曲名を変える');rename.setAttribute('role','menuitem');songMenu.append(rename);
 const remove=make('button',{id:'trackDelete'},'曲を削除する');remove.setAttribute('role','menuitem');songMenu.append(remove);card.append(make('button',{id:'trackUndo',hidden:true},'曲の削除を元に戻す'));

 card.append(make('button',{id:'showRoom',className:'show-launch'},'MRで観る'));
 $('showRoom').setAttribute('aria-describedby','showReadiness');
 const ready=make('section',{id:'showReadiness',className:'show-readiness',role:'status'});ready.setAttribute('aria-live','polite');ready.setAttribute('aria-atomic','true');
 for(const [tag,id] of [['strong','showReadinessHeading'],['span','showReadinessTitle'],['span','showReadinessSetting']])ready.append(make(tag,{id}));
 card.append(ready);
 const feelings=make('div',{id:'musicFeelingControls'});card.append(feelings);field(feelings,'autoMusicFeeling');$('autoMusicFeeling').closest('label').firstChild.textContent='曲調・構成を選ぶ';field(feelings,'autoMusicEars');move(feelings,'autoMusicEarsHint');move(feelings,'autoMusicFeelingHint');move(feelings,'autoMusicBuildNumber');
 const none=make('div',{id:'noMusicControls'});card.append(none);
 for(const id of ['program','mood','ending'])field(none,id);
 move(none,'programInfo');
 for(const [id,label] of [['showWatch','▶ 花火大会を開演'],['showRebuild','プログラムを組み直す']])card.append(make('button',{id},label));
 const row=make('div',{className:'show-button-row'});card.append(row);
 for(const [id,label] of [['showStop','止める'],['showRestart','最初から']])row.append(make('button',{id},label));
 move(card,'autoMusicCancel');move(card,'autoMusicProgress');move(card,'autoMusicStatus');move(card,'autoMusicRebuildFeedback');card.append(make('p',{id:'showNotice',role:'status',className:'show-notice'}));
 const playback=details(card,'再生位置・音量・部屋の明るさ','showPlayback');playback.open=true;
 const seek=make('div',{id:'showMusicPlayback'});playback.append(seek);
 seek.append($('betaPanelTime').closest('.beta-seek-panel'));
 const mix=$('musicVolume').closest('.music-mix');playback.append(mix);
 for(const el of mix.querySelectorAll('.mix-choices,.mix-hint,h3'))el.hidden=true;
 field(playback,'roomBrightness');
 const importPanel=details(card,'＋ 曲を取り込む','showImport');
 $('showRoom').after(importPanel);
 move(importPanel,'autoMusicDrop');
 const reanalysis=make('div',{id:'showReanalysis'});importPanel.append(reanalysis);move(reanalysis,'musicReanalyze');
 reanalysis.append(make('p',{},'保存した音源を、この端末でもう一度解析します。普段の組み直しには再解析は要りません。'));
 const advanced=details(card,'構成の詳細・調整','showAdvanced');
 move(advanced,'autoMusicRebuildFeedback');move(advanced,'autoMusicResult');move(advanced,'autoMusicAnalysisSource');field(advanced,'autoMusicPacing');
 move(advanced,'autoMusicExport');
 const scene=make('div',{id:'showSceneControls'});advanced.append(scene);field(scene,'musicScene');move(scene,'musicScenePlay');move(scene,'musicTimeline');move(scene,'musicTime');move(scene,'musicState');
 $('browserTab0').hidden=true;$('browserTab4').textContent='花火大会';
 const views=details($('browserPage2'),'眺め方を変える','showViews');
 for(const id of ['diorama','boat','boatStart','bridge','showInfo','viewHint'])move(views,id);
 const flower=make('section',{id:'flowerStudyCard',className:'show-card'});$('browserPage1').prepend(flower);
 flower.append(make('h2',{},'花を咲かせる · 演出試作'));
 for(const [id,label,choices] of [
 ['flowerPattern','花の並べ方',FLOWER_PATTERNS.map(p=>[p.id,p.label])],
 ['flowerTiming','咲く順序',FLOWER_TIMINGS.map(p=>[p.id,p.label])],
 ['flowerSpacing','花の間隔',FLOWER_SPACINGS.map(p=>[p.id,p.label])],
 ['flowerColor','花の色',[['five','５色を並べる'],...FLOWER_COLORS.map(p=>[p.id,p.label])]],
 ['flowerSize','玉の大きさ',[['3','３号玉'],['5','５号玉'],['10','尺玉']]]]){
 const field=make('label',{},label),select=make('select',{id});for(const [value,name] of choices)select.append(make('option',{value},name));if(id==='flowerSpacing')select.value='close';field.append(select);flower.append(field);
 }
 for(const [id,label] of [['flowerShow','この花を咲かせる'],['flowerPause','一時停止・再開']])flower.append(make('button',{id},label));
 const flowerSeekLabel=make('label',{},'時刻を動かして見比べる'),range=make('input',{id:'flowerSeek',type:'range',min:'0',max:'9',step:'.025',value:'0'});flowerSeekLabel.append(range);flower.append(flowerSeekLabel);flower.append(make('p',{id:'flowerDescription'},'ひまわりは緑の大トラ、タンポポは緑の子トラと黄色い３号。'));
 const trigger=document.querySelector('.trigger-loading');$('browserPage1').prepend(trigger);
 const slotNodes={};for(const hand of ['Left','Right']){slotNodes['load'+hand]=$('load'+hand);slotNodes['loaded'+hand]=$('loaded'+hand);}
 trigger.replaceChildren();const slots=make('div',{className:'load-slots'});trigger.append(slots);
 // Move the original button/label nodes from their detached parent.
 for(const hand of ['Left','Right']){const slot=make('div',{className:'load-slot'});slots.append(slot);slot.append(slotNodes['load'+hand]);const loaded=make('div',{className:'loaded-slot'});slot.append(loaded);loaded.append(slotNodes['loaded'+hand]);}
 $('sample').after(trigger);
 const testExtras=details($('browserPage1'),'演出素材の確認（試作用）','showTrialExtras');
 for(const id of ['starmine','whistleSoundStudy'])move(testExtras,id);
 const soundExtras=details($('browserPage2'),'音の比較（試作用）','showAudioExtras');field(soundExtras,'audioMode');
 const offline=document.querySelector('.offline-card');const save=details($('panel'),'オフライン保存','showOffline');save.append(offline);
 document.querySelector('.mr-entry').hidden=true;
 // Retained DOM nodes support older preview links, but no duplicate entry points.
 for(const id of ['autoMusicRoom','autoMusicWatch','autoMusicManual','autoMusicRebuild'])old.append($(id));
 $('autoMusicResult').append(make('p',{},'テンポと検出時刻は解析に任せ、曲の気持ちは選んだ曲調で演出します。'));
 mountHelp($('browserPage3'));
}
