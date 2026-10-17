import {FLOWER_PATTERNS,FLOWER_TIMINGS,FLOWER_SPACINGS,FLOWER_COLORS} from './flower-scenes.js';
import {PANEL_THEMES} from './panel-theme.js';
import {mountHelp} from './help-content.js';
// Keep one set of controls: the browser and MR panel share their values.
export function organizePanel(){
 const $=id=>document.getElementById(id),make=(tag,attrs={},text='')=>{const el=document.createElement(tag);Object.assign(el,attrs);el.textContent=text;return el;};
 const move=(parent,id)=>parent.append($(id));
 const field=(parent,id)=>parent.append($(id).closest('label'));
 const details=(parent,title,id)=>{const el=make('details',{id});el.append(make('summary',{},title));parent.append(el);return el;};
 const hearts=make('div',{className:'panel-heart-actions'});for(const [id,text] of [['favoriteListOpen','一覧'],['favoriteToggle','♡']])hearts.append(make('button',{id},text));$('panel').prepend(hearts);const saved=make('p',{id:'favoriteSaveStatus',role:'status'});$('panel').append(saved);
 const page=$('browserPage4'),old=make('div',{hidden:true});
 while(page.firstChild)old.append(page.firstChild);
 page.append(old);
 const card=make('div',{className:'show-card'});page.prepend(card);
 card.append(make('h2',{},'今日の花火大会'));
 const setlistField=make('label',{},'このセットリストを観る'),setlistSelect=make('select',{id:'setlistSelect'});setlistSelect.append(make('option',{value:'',disabled:true},'保存したセットリストはありません'));setlistSelect.disabled=true;setlistField.append(setlistSelect);setlistField.id='setlistField';setlistField.hidden=true;card.append(setlistField);
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
 for(const [id,label] of [['showWatch','▶ 花火大会を開演'],['showRebuild','打ち上げ玉の構成を変える']])card.append(make('button',{id},label));
 const row=make('div',{className:'show-button-row'});card.append(row);
 for(const [id,label] of [['showStop','止める'],['showRestart','最初から']])row.append(make('button',{id},label));
 move(card,'autoMusicCancel');move(card,'autoMusicProgress');move(card,'autoMusicStatus');move(card,'autoMusicRebuildFeedback');card.append(make('p',{id:'showNotice',role:'status',className:'show-notice'}));
 const playback=details(card,'音量・部屋の明るさ','showPlayback');playback.open=true;
 const seek=make('div',{id:'showMusicPlayback'});playback.append(seek);
 seek.append($('betaPanelTime').closest('.beta-seek-panel'));
 for(const id of ['betaBack10','betaBack5','betaForward5'])$(id).hidden=true;
 for(const id of ['betaFloatBack5','betaFloatForward5'])$(id).hidden=true;
 const tcbar=$('betaReviewBar');const tcClose=make('button',{id:'betaCloseTC'},'×');tcClose.setAttribute('aria-label','TC・玉名パネルを閉じる');tcbar.append(tcClose);tcbar.prepend(make('p',{id:'betaShellNames',className:'beta-shell-names'}));
 const back5=$('betaFloatBack5'),forward5=$('betaFloatForward5');const tcbuttons=$('betaFloatPause').parentElement;tcbuttons.replaceChildren($('betaFloatBack10'),$('betaFloatPause'),make('button',{id:'betaFloatForward10'},'10秒送る'));
 const songs=make('div',{className:'beta-song-buttons'});songs.append(make('button',{id:'betaPreviousTrack'},'前の曲'),make('button',{id:'betaNextTrack'},'次の曲'));tcbar.append(songs);const tcseek=make('label',{},'曲の再生位置');tcseek.append($('betaMusicSeek'));tcbar.insertBefore(tcseek,songs);old.append($('betaPanelTime').closest('.beta-seek-panel'));
 // Detached compatibility nodes remain available to older callback wiring.
 old.append(back5,forward5);
 const mix=$('musicVolume').closest('.music-mix');playback.append(mix);
 for(const el of mix.querySelectorAll('.mix-choices,.mix-hint,h3'))el.hidden=true;
 field(playback,'roomBrightness');
 const importPanel=details(card,'＋ 曲を取り込む','showImport');
 $('showRoom').after(importPanel);
 move(importPanel,'autoMusicDrop');
 const feedback=make('section',{id:'analysisFeedback',className:'analysis-feedback',hidden:true});feedback.setAttribute('aria-live','polite');feedback.setAttribute('aria-atomic','true');
 feedback.append(make('strong',{id:'analysisHeading'},'曲を解析中…'));move(feedback,'autoMusicProgress');move(feedback,'autoMusicStatus');move(feedback,'autoMusicCancel');importPanel.append(feedback);
 $('showRebuild').after($('autoMusicRebuildFeedback'));
 const reanalysis=make('div',{id:'showReanalysis'});importPanel.append(reanalysis);move(reanalysis,'musicReanalyze');

 const advanced=details(card,'構成の詳細・調整','showAdvanced');
 move(advanced,'autoMusicResult');move(advanced,'autoMusicAnalysisSource');field(advanced,'autoMusicPacing');
 move(advanced,'autoMusicExport');
 const scene=make('div',{id:'showSceneControls'});advanced.append(scene);field(scene,'musicScene');move(scene,'musicScenePlay');move(scene,'musicTimeline');move(scene,'musicTime');move(scene,'musicState');
 $('browserTab0').hidden=true;$('browserTab1').hidden=true;$('browserTab4').textContent='花火大会';
 const voiceRow=make('div',{className:'voice-entry'}),voiceOpen=make('button',{id:'voiceOpen'},'🎤');voiceOpen.setAttribute('aria-label','声で花火をリクエスト');voiceRow.append(voiceOpen,make('small',{},'あなたのイメージをAIに話す'),make('span',{className:'voice-test-label'},'テスト版'));card.append(voiceRow);
 const voiceCard=make('section',{id:'voiceCard',className:'voice-card',hidden:true});voiceCard.append(make('button',{id:'voiceClose',className:'voice-close'},'×'),make('h2',{},'声で花火をリクエスト'),make('p',{className:'voice-examples'},'入力例： 「夜空をイメージした曲なので、金色系の花火をたくさん出して」「海をイメージしたプログラムにしたい」など。「ぽつりぽつり」「しっとり上げて」もどうぞ。'));
 voiceCard.append(make('p',{id:'voiceStatus',role:'status'}),make('small',{id:'voiceDetail',hidden:true}),make('progress',{id:'voiceProgress',max:1,value:0,hidden:true}),make('p',{id:'voiceTranscript'}),make('p',{id:'voiceSummary'}),make('button',{id:'voiceRecord'},'🎤 話す（20秒まで）'),make('button',{id:'voiceDiscard',hidden:true},'取り消す'),make('button',{id:'voiceCancel'},'閉じる'),make('small',{},'音声はこの端末で認識します。録音は認識後に破棄し、保存しません。初回のみ音声AIを自動で取得します。'));card.append(voiceCard);voiceCard.querySelector('.voice-examples').after($('voiceStatus'),$('voiceDetail'),$('voiceProgress'));voiceOpen.setAttribute('aria-describedby','voiceEntryHint');voiceRow.querySelector('small').id='voiceEntryHint';advanced.querySelector('summary').textContent='演出を調整する';advanced.querySelector('summary').after(feelings,none,reanalysis,$('showRebuild'),$('autoMusicRebuildFeedback'),voiceRow,voiceCard);
 const trial=make('button',{id:'showTrialOpen'},'トリガーに花火玉を仕込む');card.append(trial);
 $('browserPage1').prepend(make('h2',{className:'loadout-heading'},'トリガーに花火玉を仕込む'));$('browserPage1').prepend(make('button',{id:'showTrialBack'},'‹ 花火大会へ戻る'));const trialHome=make('section',{className:'loadout-home'});$('browserPage1').append(trialHome);
 $('showInfo').hidden=true;const tc=make('button',{id:'showTC'},'TC・玉名を表示');card.append(tc);
 const views=details($('browserPage2'),'眺め方を変える','showViews');
 for(const id of ['diorama','boat','boatStart','bridge','rooftop','showInfo','showTC','viewHint'])move(views,id);
 const roofSeats=make('div',{id:'rooftopSeats',className:'roof-seats',hidden:true});roofSeats.setAttribute('role','group');roofSeats.setAttribute('aria-label','屋上の席');
 roofSeats.append(make('button',{id:'roofNear'},'近い席（標準）'),make('button',{id:'roofPanorama'},'全景の席'));$('rooftop').after(roofSeats);
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
 const themeField=make('label',{},'パネルの配色'),themeSelect=make('select',{id:'panelTheme'});for(const option of PANEL_THEMES)themeSelect.append(make('option',{value:option.value},option.label));themeField.append(themeSelect);$('browserPage2').prepend(themeField);
 const soundExtras=details($('browserPage2'),'音の比較（試作用）','showAudioExtras');field(soundExtras,'audioMode');
 const offline=document.querySelector('.offline-card');const save=details($('panel'),'オフライン保存','showOffline');save.append(offline);
 document.querySelector('.mr-entry').hidden=true;
 // Retained DOM nodes support older preview links, but no duplicate entry points.
 for(const id of ['autoMusicRoom','autoMusicWatch','autoMusicManual','autoMusicRebuild'])old.append($(id));
 $('autoMusicResult').append(make('p',{},'テンポと検出時刻は解析に任せ、曲の気持ちは選んだ曲調で演出します。'));
 const loadPage=$('browserPage1');for(const id of ['type','size','palette'])field(trialHome,id);move(trialHome,'sample');trialHome.append(trigger);
 const loadBack=$('showTrialBack'),loadHeading=loadPage.querySelector('.loadout-heading');loadPage.prepend(loadBack,loadHeading,trialHome);
 const studies=details(loadPage,'花・トラなどの演出を試す','loadoutStudies');for(const node of [...loadPage.children])if(![loadBack,loadHeading,trialHome,studies].includes(node))studies.append(node);
 mountHelp($('browserPage3'));
}
