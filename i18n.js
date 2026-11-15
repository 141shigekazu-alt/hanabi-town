import {EN} from './locale-en.js';
import {AUDIT_EN} from './locale-audit-en.js';
Object.assign(EN,AUDIT_EN);
const UI_PREFIXES={"音声を開始できませんでした：": "Could not start audio: ", "MRを終了できませんでした：": "Could not exit MR: ", "鑑賞を開始できませんでした：": "Could not start viewing: ", "曲を切り替えられませんでした：": "Could not switch tracks: ", "次の曲を始められませんでした：": "Could not start the next track: ", "名前の編集を開けませんでした：": "Could not open name editing: ", "削除できませんでした：": "Could not delete: ", "元に戻せませんでした：": "Could not restore: ", "曲名の編集を開けませんでした：": "Could not open track renaming: ", "お気に入りを読み込めませんでした：": "Could not load favorites: ", "削除の取り消しを準備できませんでした：": "Could not prepare undo: ", "保存曲を読み込めませんでした：": "Could not load saved tracks: ", "保存できませんでした：": "Could not save: ", "完了できませんでした：": "Could not complete: ", "曲調を保存できませんでした：": "Could not save the mood: ", "曲調で組み直せませんでした：": "Could not rebuild for this mood: ", "音源を読み込めませんでした（": "Could not load audio ("};
const KEY='hanabi-town-language-v1';
let stored;try{stored=localStorage.getItem(KEY);}catch{}
const requested=new URLSearchParams(location.search).get('lang');
export let language=['ja','en'].includes(requested)?requested:['ja','en'].includes(stored)?stored:(navigator.language??'ja').toLowerCase().startsWith('ja')?'ja':'en';
const originals=new WeakMap(),attrs=new WeakMap(),listeners=new Set();
const missing=new Set();
const BUILT_INS=new Set(['none','hanabi-no-yoru','mou-ichido-dake','pastel-parasite','natsu-no-nagori','dies-ignis']);
export function t(value){
 const text=String(value??'');if(language!=='en')return text;
 if(EN[text])return EN[text];
 const trim=text.trim();if(EN[trim])return text.replace(trim,EN[trim]);
 if(trim&&trim!==text)return text.replace(trim,t(trim));
 // Known UI compositions only. Do not replace arbitrary words in user names.
 const decorated=text.match(/^([☑☐●✓\s\d０-９　›‹←→]+)(.+?)([\s›↗▾]+)?$/u);
 if(decorated&&EN[decorated[2]])return decorated[1]+EN[decorated[2]]+(decorated[3]??'');
 let m;
 if((m=text.match(/^(.+)の保存が完了しました。$/)))return `Version ${m[1]} has been saved.`;
 if((m=text.match(/^最新版を保存済み · (.+)。Wi-Fiなしでも開けます。$/)))return `Latest version saved · ${m[1]}. Available without Wi-Fi.`;
 if((m=text.match(/^新しい版 (.+)があります。保存済み：(.+)。上のボタンで更新できます。$/)))return `Version ${m[1]} is available. Saved: ${m[2]}. Use the button above to update.`;
 if((m=text.match(/^保存済み (.+)。通信できる時に最新版を確認・更新できます。$/)))return `Saved: ${m[1]}. Connect to the internet to check for updates.`;
 if((m=text.match(/^保存した版：(.+)。使用量：約(\d+)MB。保存した後は、外出前に通信なしでも開けるか確認してください。$/)))return `Saved version: ${m[1]}. About ${m[2]} MB. Before going out, check that it opens offline.`;
 if((m=text.match(/^保存中 (\d+)％ · (\d+)\/(\d+)ファイル$/)))return `Saving ${m[1]}% · ${m[2]}/${m[3]} Files`;
 if(text.startsWith('保存・更新できませんでした。'))return 'Could not save or update. '+t(text.slice('保存・更新できませんでした。'.length));

 if((m=text.match(/^Error: (.+)$/)))return 'Error: '+t(m[1]);
 if((m=text.match(/^試し打ち ([\d.]+)秒$/)))return `Test Launch · ${m[1]} sec`;
 if((m=text.match(/^余韻＋([\d.]+)秒$/)))return `Afterglow +${m[1]} sec`;
 if((m=text.match(/^(.+) · 一時停止$/)))return `${t(m[1])} · Paused`;
 if((m=text.match(/^(.+) · 準備完了 · (.+)$/)))return `${t(m[1])} · Ready · ${t(m[2])}`;
 if((m=text.match(/^(.+) · 推定 ([\d.]+) BPM。保存した解析から自動構成。$/)))return `${t(m[1])} · Estimated ${m[2]} BPM. Built from saved analysis.`;
 if((m=text.match(/^(.+) · オリジナルプログラムを準備しました。$/)))return `${t(m[1])} · Directed show ready.`;
 if((m=text.match(/^曲はまだ始まりません。街を好きな位置へ置いてから、「(.+)」で開演してください。$/)))return `The music has not started yet. Place the town, then press ${t(m[1])}.`;
 if((m=text.match(/^(.+?) ([\d.]+) ms（次の開演から）$/)))return `${t(m[1])} ${m[2]} ms (From the Next Show)`;
 if((m=text.match(/^MR計測：(.+)ms ／ 花火 (\d+)点$/)))return `MR Measurement: ${m[1]} ms / ${m[2]} Firework Points`;
 if((m=text.match(/^(\d+)区間を計測、花火の最大粒子数 (\d+)点。計測結果を保存できます。$/)))return `${m[1]} intervals measured; peak ${m[2]} firework points. You can save the measurements.`;
 if((m=text.match(/^次の大会から「(.+)」で始まります。「大会を最初から」で今すぐ切り替えられます。$/)))return `The next show starts with ${t(m[1])}. Use Restart Show to switch now.`;
 if((m=text.match(/^「(.+)」を選びました。$/)))return `Selected ${t(m[1])}.`;
 if((m=text.match(/^(.+)：左スティックで移動、右スティック左右で向きを変更。左Xで席を切り替えられます。$/)))return `${t(m[1])}: move with the left stick and turn with the right stick. Press left X to switch seats.`;
 if((m=text.match(/^(.+)です。左Xの屋上の一行で、近い席／全景の席を切り替えられます。$/)))return `${t(m[1])}. Use the rooftop row in the left X menu to switch between Near and Panorama seats.`;
 if((m=text.match(/^(.+)。大星は最後まで色を保ち、金のキラと一緒に消えます。$/)))return `${t(m[1])}. Large stars retain their color and fade with the gold glitter.`;
 if((m=text.match(/^(.+)。勢いよく伸び、上昇中に燃え尽きます。$/)))return `${t(m[1])}. Stars rise strongly and burn out during ascent.`;
 if((m=text.match(/^(.+)。開ききる頃から消える余韻を観ます。$/)))return `${t(m[1])}. Watch the afterglow fade after full bloom.`;
 if((m=text.match(/^(.+)。下の３号の絨毯と上空の５号・尺玉を観ます。$/)))return `${t(m[1])}. A carpet of Size 3 shells below Size 5 and 10 blooms.`;
 if((m=text.match(/^(.+)。花の下と緑の茎がつながる瞬間を見比べます。$/)))return `${t(m[1])}. Compare the moment when blooms meet their green stems.`;
 if((m=text.match(/^(.+)の試作。開花後のバーで途中の形も見比べられます。$/)))return `${t(m[1])} prototype. Use the After Bloom slider to compare intermediate shapes.`;

 if((m=text.match(/^(左|右)(手から |トリガーで )(.+) を街へ送りました。$/)))return `${m[1]==='左'?'Left':'Right'} ${m[2]==='手から '?'Hand':'Trigger'}: ${t(m[3])} Sent to the Town`;
 if((m=text.match(/^(左|右)から送った (.+) が打ち上がりました。$/)))return `${m[1]==='左'?'Left':'Right'}: ${t(m[2])} Launched`;

 if((m=text.match(/^(左|右)トリガーに (.+) を仕込みました。$/)))return `${m[1]==='左'?'Left':'Right'} Hand Loaded: ${t(m[2])}`;
 if((m=text.match(/^(.+)（対象外）$/)))return t(m[1])+' (Unavailable)';
 if((m=text.match(/^(左|右)：(.+)$/)))return `${m[1]==='左'?'Left':'Right'}: ${t(m[2])}`;

 if((m=text.match(/^構成(\d+)(をこの画面で観る|をMRで観る|を作成しました)?$/)))return `Arrangement ${m[1]}`+(m[2]==='をこの画面で観る'?' · Watch Here':m[2]==='をMRで観る'?' · Watch in MR':m[2]?' Created':'');
 if((m=text.match(/^✓ 構成(\d+)を作成しました$/)))return `✓ Arrangement ${m[1]} Created`;
 if((m=text.match(/^(.+)を観る$/)))return 'Watch '+t(m[1]);
 if((m=text.match(/^(.+)をもう一度$/)))return 'Repeat '+t(m[1]);
 if((m=text.match(/^(.+)の見せ場$/)))return t(m[1])+' Highlights';
 if((m=text.match(/^(.+)の前から観る$/)))return 'Watch from Before '+t(m[1]);
 if((m=text.match(/^(.+)を重ねる（(\d+)発）$/)))return `${t(m[1])} Overlay (${m[2]} shots)`;
 if((m=text.match(/^(?:打ち上げから |最初の開花から |開花から |経過 |余韻＋)([\d.]+)秒$/)))return `${m[1]} sec elapsed`;
 if((m=text.match(/^(.+?)を準備できませんでした：(.*)$/)))return `Could not prepare ${t(m[1])}: ${t(m[2])}`;
 if((m=text.match(/^「(.+)」を選びました。「この曲の大会を準備する」で組みます。$/)))return `Selected ${t(m[1])}. Use Prepare a Show for This Track to build it.`;
 if((m=text.match(/^今回の作風：(.+)。「打ち上げ玉の構成を変える」で作風も替わります。$/)))return `This style: ${t(m[1])}. Change Shell Arrangement also changes the style.`;
 if((m=text.match(/^曲調：(.+)。(.+)$/)))return `Mood: ${t(m[1])}. ${t(m[2])}`;
 if((m=text.match(/^曲調：(.+)$/)))return 'Mood: '+t(m[1]);
 if((m=text.match(/^穂の風景：(.+)$/)))return 'Rice Ear Landscapes: '+m[1].split(' ／ ').map(t).join(' / ');
 if((m=text.match(/^締め：(.+)$/)))return 'Finale: '+t(m[1]);
 if((m=text.match(/^締めを「(.+)」から「(.+)」へ変更$/)))return `Finale changed from ${t(m[1])} to ${t(m[2])}`;
 if((m=text.match(/^(ゆっくり・間を味わう。|リズミカル。)玉(\d+)種類・足元(\d+)種類。金系３号(\d+)発。締め：(.+)。$/)))return `${t(m[1])} ${m[2]} shell types; ${m[3]} ground effects; ${m[4]} gold Size 3 shots. Finale: ${t(m[5])}.`;
 if((m=text.match(/^自動解析の繰り返しの頭(\d+)か所で、大輪と足元を重ね、その後に金の３号をつないでいます。$/)))return `At ${m[1]} detected repeat starts, large blooms combine with ground effects, followed by gold Size 3 shells.`;
 if((m=text.match(/^サビの判定時刻はそのまま。大輪と、それにつながる金の３号・足元の合図を([\d.]+)秒遅らせています。$/)))return `Chorus estimates are unchanged. Large blooms and their linked gold Size 3 and ground cues are delayed by ${m[1]} sec.`;
 if((m=text.match(/^いろんな３号の花に上空の５号・尺玉を重ねる (.+) の花畑を組み込みました。$/)))return `Flower carpets (${m[1].replaceAll('秒',' sec')}) combine varied Size 3 flowers with Size 5 and 10 shells overhead.`;
 if((m=text.match(/^この端末で解析 · ([\d.]+)秒 · サビ(\d+)区間 · 保存済み$/)))return `Analyzed on This Device · ${m[1]} sec · ${m[2]} Chorus Sections · Saved`;
 if((m=text.match(/^(.+) · この端末に保存した解析で構成(\d+)を準備しました。再解析はしていません。$/)))return `${m[1]} · Arrangement ${m[2]} prepared using saved analysis. No reanalysis was needed.`;
 if((m=text.match(/^(.+) · この端末での解析が完了（([\d.]+)秒）。音源と解析を保存し、構成1を準備しました。$/)))return `${m[1]} · Analysis complete on this device (${m[2]} sec). Audio and analysis saved; Arrangement 1 is ready.`;
 if((m=text.match(/^(.+) · 「(.+)」で組み直しました（([\d.]+)ms）。保存した解析を使っています。$/)))return `${m[1]} · Rebuilt for ${t(m[2])} (${m[3]} ms), using saved analysis.`;

 if((m=text.match(/^(.*?)(\s*[▾↗›]+)$/u))&&m[1].trim())return t(m[1])+m[2];
 if((m=text.match(/^(\d+(?:\.\d+)? \/ \d+(?:\.\d+)?)秒$/)))return m[1]+' sec';
 if((m=text.match(/^(\d+)曲$/)))return m[1]+' tracks';
 if((m=text.match(/^約(\d+)分(\d+)秒$/)))return `About ${m[1]} min ${m[2]} sec`;
 if((m=text.match(/^約(\d+:\d+)$/)))return 'About '+m[1];
 if((m=text.match(/^約(\d+)秒$/)))return 'About '+m[1]+' sec';
 if((m=text.match(/^✓ 構成(\d+)に変えました$/)))return `✓ Switched to Arrangement ${m[1]}`;
 if((m=text.match(/^(.+)の穂$/))&&EN[m[1]])return t(m[1])+' Rice Ears';
 if((m=text.match(/^(.+)の星・(銀|金)の尾$/))&&EN[m[1]])return t(m[1])+' Stars & '+t(m[2])+' Tails';
 if(text==='キャンディー色星・金の尾')return 'Candy Stars & Gold Tails';
 if(text==='桃・水色・緑の列')return 'Rows of Pink, Aqua & Green';
 if(text.includes(' × '))return text.split(' × ').map(t).join(' × ');
 if(['赤・緑・金・青','紫・白','緑・白・桜色'].includes(text))return text.split('・').map(t).join(', ');

 if((m=text.match(/^(.+)の大会を準備中…$/)))return 'Preparing show: '+t(m[1])+'…';
 if((m=text.match(/^(.+)を準備中…$/)))return 'Preparing '+t(m[1])+'…';

 if((m=text.match(/^(\d+(?:\.\d+)?)秒経過$/)))return `${m[1]} sec elapsed`;
 if((m=text.match(/^(.+)を準備しました。$/)))return t(m[1])+' is ready.';
 if((m=text.match(/^(\d+(?:\.\d+)?)秒$/)))return m[1]+' sec';
 if((m=text.match(/^✓ この設定で準備完了 · 更新(\d+)$/)))return `✓ Ready to Start · Revision ${m[1]}`;
 if((m=text.match(/^ベータ版 (.+)$/)))return 'Beta '+m[1];
 if((m=text.match(/^仕込み中 · あと約(\d+)秒$/)))return `Preparing · About ${m[1]} sec left`;
 if((m=text.match(/^花火の仕込み (\d+)／(\d+)発 · (.+)$/)))return `Preparing shells ${m[1]} / ${m[2]} · ${t(m[3])}`;
 if((m=text.match(/^あと約(\d+)秒$/)))return `About ${m[1]} sec left`;
 if((m=text.match(/^(.+?) ／ 構成 (\d+)$/)))return `${t(m[1])} / Arrangement ${m[2]}`;
 if((m=text.match(/^屋上の花火席 · (.+)$/)))return 'Rooftop · '+t(m[1]);

 if((m=text.match(/^(\d+)件のセットリスト$/)))return `${m[1]} Setlists`;
 if((m=text.match(/^(.+)の曲目を開く$/)))return 'Open Tracks in '+m[1];
 if((m=text.match(/^(.+)のメニュー$/)))return 'Menu for '+m[1];
 if((m=text.match(/^(.+)をドラッグして並べ替え$/)))return 'Drag to Reorder '+m[1];
 if((m=text.match(/^(.+)を大会に入れる$/)))return 'Include '+m[1]+' in the Show';
 if((m=text.match(/^(.+)を一時停止$/)))return 'Pause '+m[1];
 if((m=text.match(/^(.+)を再生$/)))return 'Play '+m[1];
 if((m=text.match(/^(.+)の保存名$/)))return 'Saved Name for '+m[1];
 if((m=text.match(/^(.+)の音源が見つかりません。$/)))return 'Audio not found for '+m[1]+'.';
 if((m=text.match(/^(.+)へ移動しました。$/)))return 'Moved to '+t(m[1])+'.';
 if((m=text.match(/^「(.+)」を曲一覧から削除しました。元に戻せます。$/)))return m[1]+' was removed from the track list. You can undo this.';
 if((m=text.match(/^([^。]+)。変更は次のセットリスト再生から反映されます。$/)))return t(m[1])+'. Changes take effect the next time this setlist plays.';
 if(text==='曲')return 'Track';
 if(text.includes(' · '))return text.split(' · ').map(t).join(' · ');
 if(text.includes('  ›  '))return text.split('  ›  ').map(t).join('  ›  ');
 for(const [prefix,english] of Object.entries(UI_PREFIXES))if(text.startsWith(prefix)&&text.length>prefix.length)return english+t(text.slice(prefix.length));
 if(/[ぁ-んァ-ヶ一-龯]/u.test(text))missing.add(text);
 return text;
}
export function onLanguageChange(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export function setLanguage(next){
 if(!['ja','en'].includes(next))return;language=next;
 try{localStorage.setItem(KEY,next);}catch{}
 const url=new URL(location.href);url.searchParams.set('lang',next);history.replaceState(null,'',url);
 refresh(document.body);document.documentElement.lang=next;document.title=next==='en'?'Hanabi Town':'花火街';
 for(const fn of listeners)fn();
 document.dispatchEvent(new CustomEvent('hanabi-language-change',{detail:next}));
}
function protectedNode(node){
 const e=node.nodeType===1?node:node.parentElement;
 if(e?.closest('#showReadinessTitle,#betaTrackTitle')&&!BUILT_INS.has(document.getElementById('musicTrack')?.value))return true;
 if(e?.matches('#musicTrack option')&&!BUILT_INS.has(e.value))return true;
 if(!e||e.closest('script,style,input,textarea,[data-no-translate],#languageControls'))return true;
 // Track and setlist names are user data, never translated by the UI adapter.
 if(e.closest('#trackMenu input,.favorite-name,.setlist-name,#voiceTranscript'))return true;
 if(e.closest('#setlistSelect')&&e.value)return true;
 return false;
}
function translateText(node){
 if(protectedNode(node))return;
 const previous=originals.get(node),current=node.nodeValue;
 const source=previous&&current===previous.output?previous.source:current;
 const output=language==='en'&&node.parentElement?.id==='browserTab4'?'Show':t(source);originals.set(node,{source,output});if(current!==output)node.nodeValue=output;
}
function translateElement(e){
 if(protectedNode(e))return;
 for(const key of ['aria-label','title','placeholder']){
  if(!e.hasAttribute(key))continue;
  let state=attrs.get(e);if(!state){state={};attrs.set(e,state);}
  const previous=state[key],current=e.getAttribute(key),source=previous&&current===previous.output?previous.source:current;
  const output=t(source);state[key]={source,output};if(current!==output)e.setAttribute(key,output);
 }
}
function refresh(root){
 if(root.nodeType===3){translateText(root);return;}
 if(root.nodeType!==1)return;translateElement(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const n=walker.currentNode;if(n.nodeType===3)translateText(n);else translateElement(n);}
}
export function installLanguageUI(){
 const row=document.createElement('div');row.id='languageControls';row.dataset.noTranslate='';
 row.innerHTML='<span>Language / 言語</span><button type="button" data-lang="ja">日本語</button><button type="button" data-lang="en">English</button>';
 document.querySelector('header').prepend(row);
 for(const b of row.querySelectorAll('button'))b.onclick=()=>setLanguage(b.dataset.lang);
 const sync=()=>{for(const b of row.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.lang===language));};onLanguageChange(sync);
 const observer=new MutationObserver(records=>{
  for(const r of records){if(r.type==='characterData')translateText(r.target);else if(r.type==='attributes')translateElement(r.target);else for(const n of r.addedNodes)refresh(n);}
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
 setLanguage(language);sync();
 window.__hanabiLocale={get language(){return language;},setLanguage,t,get missing(){return [...missing];},refresh:()=>refresh(document.body)};
}
// Scoped to each UI canvas: no browser-wide prototype changes.
export function localizeCanvas(context,redraw){
 const fill=context.fillText.bind(context),measure=context.measureText.bind(context);
 context.fillText=(value,...args)=>fill(t(value),...args);
 context.measureText=value=>measure(t(value));
 onLanguageChange(()=>redraw?.());return context;
}
export function wrapText(value,measure,width){
 const text=t(value),tokens=language==='en'?text.match(/\S+\s*|\s+/g)??[]:Array.from(text),rows=[];let line='';
 for(const token of tokens){
  if(measure(line+token.trimEnd())<=width){line+=token;continue;}
  if(line.trim()){rows.push(line.trimEnd());line='';}
  if(measure(token.trim())<=width){line=token.trimStart();continue;}
  for(const char of token){if(line&&measure(line+char)>width){rows.push(line);line='';}line+=char;}
 }
 if(line.trim())rows.push(line.trimEnd());return rows;
}
