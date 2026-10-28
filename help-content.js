// The approved six-topic guide is shared by browser and MR.
export const HELP_TOPICS=[
 {
  "id": "start",
  "title": "まず遊んでみる",
  "lead": "「MRで観る」で入室し、まずは街の位置を決めます。",
  "format": "paragraphs",
  "steps": [
   "コントローラーでは、街の台座へビームを向け、グリップで掴んで移動。掴んだままスティック左右で回転、上下で大きさを変えます。",
   "街の位置が決まったら、「花火大会を開演」で打ち上げが始まります。",
   "音楽付きの大会を楽しむときは、先に曲を選びます。"
  ]
 },
 {
  "id": "audio",
  "title": "自分の曲を使う",
  "lead": "曲の取り込みは、MRに入る前のブラウザ画面で行います。",
  "format": "paragraphs",
  "steps": [
   "「＋ 曲を取り込む」から音源を選び、解析後の「準備完了」を確認してください。",
   "使える曲は、Amazonやレコチョクなどで購入したMP3・M4A・WAVなど、12秒〜10分、160MBまでの音源です。",
   "Apple MusicやSpotifyなど、サブスクの「オフライン再生データ」は取り込めません。",
   "Sunoなどで作った自作の曲も使えます。自分の曲でご機嫌な大会を作ってください！",
   "パソコンに入っている音源は、先にUSBケーブルなどでQuestへコピーしてください。",
   "「曲調・構成」で雰囲気を選び、「プログラムを組み直す」で別の打ち上げを作れます。普段は再解析する必要はありません。"
  ]
 },
 {
  "id": "controls",
  "title": "コントローラーで遊ぶ",
  "lead": "",
  "format": "bullets",
  "steps": [
   "左X：眺め方のパネル／右A：サイドパネル／右B：一時停止・再開。",
   "パネルは白いバーをトリガーかグリップで掴んで移動。掴んだままスティック左右で角度、上下で遠さを調整します。",
   "長い文章や曲一覧へビームを向け、スティック上下でスクロール。",
   "橋・屋形船・屋上では、左スティックで移動、右スティック左右で向きを変えます。",
   "「トリガーに花火玉を仕込む」で左右の玉を用意しておくと、大会中、街へ向けてトリガーを押すたびに一発追加できます。"
  ]
 },
 {
  "id": "hands",
  "title": "手だけで遊ぶ",
  "lead": "コントローラーを置いても遊べます。",
  "format": "bullets",
  "steps": [
   "手のひらをクルッと上へ。左手で眺め方のパネル、右手でサイドパネルを出し入れできます。右手クルッは、見えない位置のサイドパネルも呼び戻せます。",
   "ビームをボタンへ向け、親指と人差し指をつまんで選択（クリック）。",
   "パネルは下の白いバーをつまんで動かします。",
   "長い文章や曲一覧は、つまんだまま上下へ動かしてスクロール。",
   "ハンドジェスチャーでも、トリガーに仕込んだ花火を打ち上げられます。「トリガーに花火玉を仕込む」で左右の玉を用意してください。大会中、目の前でグー。火の玉が灯ったら、パッと開く「肉球パッ」で花火が手から飛び出します！"
  ]
 },
 {
  "id": "favorite",
  "title": "お気に入りから、自分の大会へ",
  "lead": "今の大会が気に入ったら、右上の♡を押して保存。「一覧」から、同じ打ち上げを何度でも楽しめます。",
  "format": "paragraphs",
  "steps": [
   "お気に入りの一覧では、左端の「⠿」を掴んで並べ替えられます。大会に入れたい曲だけにチェックを付けてください。チェックした曲が、一覧の上から順に打ち上がります。",
   "「このセットリストを保存する」で、曲順ごと残せます。",
   "保存済みのお気に入りやセットリストは、曲を組み直しても変わりません。新しい打ち上げを残したいときは、あらためて♡で保存してください。"
  ]
 },
 {
  "id": "offline",
  "title": "保存・更新について",
  "lead": "「最新版に更新・保存」を押し、保存完了後に案内に従ってブラウザをリロードしてください。ページをブックマークしておくと、次から開きやすくなります。",
  "format": "paragraphs",
  "steps": [
   "オフライン保存ができれば、Wi-Fiなしでも遊べます。",
   "曲・お気に入りは、その端末のブラウザに保存されます。別の端末には自動で移りません。ブラウザのサイトデータを削除すると、保存した曲やお気に入りも消えます。"
  ]
 }
];
export const HELP_CONTENTS=HELP_TOPICS;
export function helpTopic(id){return HELP_TOPICS.find(t=>t.id===id)??HELP_TOPICS[0];}
// Pagination keeps every character available in MR without shrinking the text.
export function helpPages(topic,measure,maxWidth=724,maxRows=16){
 const paragraphs=[topic.lead,...topic.steps.map((s,i)=>topic.format==='paragraphs'?s:topic.format==='bullets'?'・ '+s:`${i+1}. ${s}`),topic.note];
 const rows=[];
 for(const paragraph of paragraphs){if(!paragraph)continue;let line='';for(const char of paragraph){if(line&&measure(line+char)>maxWidth){rows.push(line);line='';}line+=char;}if(line)rows.push(line);rows.push('');}
 if(rows.at(-1)==='')rows.pop();const pages=[];for(let i=0;i<rows.length;i+=maxRows)pages.push(rows.slice(i,i+maxRows));return pages;
}
export function mountHelp(root){
 const doc=root.ownerDocument,make=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
 const preference=root.querySelector('#entryTipEnabled').closest('label');
 // Keep the shared selection for MR; the visible navigation is a contents list.
 const select=make('select');select.id='helpTopic';select.hidden=true;select.style.display='none';
 for(const topic of [{id:'contents',title:'使い方の目次'},...HELP_CONTENTS]){const option=make('option',topic.title);option.value=topic.id;select.append(option);}
 const content=make('article');content.id='helpContent';content.setAttribute('aria-live','polite');
 const open=id=>{select.value=id;select.dispatchEvent(new Event('change'));};
 const render=()=>{
  if(select.value==='contents'){
   content.replaceChildren(make('h3','使い方の目次'),make('p','知りたい項目を選んでください。'));
   const nav=make('nav');nav.className='help-contents';nav.setAttribute('aria-label','使い方の目次');
   for(const [i,topic] of HELP_CONTENTS.entries()){const button=make('button',String(i+1).padStart(2,'0')+'　'+topic.title+'　›');button.type='button';button.onclick=()=>open(topic.id);nav.append(button);}content.append(nav);return;
  }
  const topic=helpTopic(select.value),back=make('button','← 使い方の目次へ');back.type='button';back.className='help-back';back.onclick=()=>open('contents');
  content.replaceChildren(back,make('h3',topic.title));if(topic.lead)content.append(make('p',topic.lead));
  if(topic.format==='paragraphs'){for(const step of topic.steps)content.append(make('p',step));}
  else{const list=make(topic.format==='bullets'?'ul':'ol');for(const step of topic.steps)list.append(make('li',step));content.append(list);}
  if(topic.note){const note=make('p',topic.note);note.className='help-note';content.append(note);}
  if(topic.links){const links=make('div');links.className='help-links';for(const [title,url] of topic.links){const a=make('a',title+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}content.append(links);}
 };
 select.addEventListener('change',render);root.replaceChildren(make('h2','花火街の使い方'),select,content,preference);render();
}
