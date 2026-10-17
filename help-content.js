// One guide for the browser and the canvas panel in MR.
export const HELP_TOPICS=[
 {id:'audio',title:'自分の曲・購入した曲を使う',lead:'自分のオリジナル曲で、花火大会を。曲を取り込んで解析し、曲調を選んで打ち上げを組み直せます。気に入った構成は♡で保存し、自分だけの大会に並べられます。',steps:[
 'QuestのブラウザでAmazonデジタルミュージック、またはレコチョクから曲を購入し、音源ファイルをダウンロードします。',
 'Sunoで作った自分のオリジナル曲も使えます。Questのブラウザで、曲の「…」→「Download」からMP3音源をダウンロードし、花火街へ取り込みます。',
 'パソコンにある曲は、先にUSBなどでQuestへコピーします。その後、花火街のファイル選択で、保存したフォルダから選びます。',
 'サブスクの「オフライン再生用ダウンロード」は取り込めません。MP3などの音源ファイルを用意してください。'
 ],note:'ダウンロードフォルダ以外からも選べます。パソコンの花火街に取り込んだ曲が、Questへ自動で移るわけではありません。',links:[['Amazonデジタルミュージック','https://www.amazon.co.jp/'],['レコチョク','https://recochoku.jp/'],['Suno公式・音源のダウンロード','https://help.suno.com/en/articles/13926081']]},
 {id:'import',title:'曲を取り込む・解析する',lead:'曲の取り込みはブラウザで行います。解析も、そのままQuestの中でできます。',steps:[
 '「花火大会」タブの大きな「MRで観る」のすぐ下にある「＋ 曲を取り込む」を開きます。',
 '「ダウンロードした曲を取り込む」を押し、音源を保存したフォルダからファイルを選びます。ブラウザでダウンロードした曲は、通常ダウンロードフォルダにあります。',
 '解析が終わり「音源と解析を保存し、構成1を準備しました」と出るまで待ちます。曲調を選び、「準備完了」の表示を確認します。',
 '「MRで観る」から入室し、街を好きな位置に置いて「花火大会を開演」を押します。'
 ],note:'MP3・M4A（AAC）・WAVなどの音源に対応。12秒〜10分、160MBまで。動画やサブスクの再生データは選べません。'},
 {id:'favorite',title:'お気に入りに残す',lead:'気に入った打ち上げは、構成を丸ごと残せます。あとで同じ打ち上げを観られます。',steps:[
  '各曲の▶で保存した１曲を再生。Ⅱで一時停止し、▶で続きから再開できます。一覧は開いたままです。',
 '構成ができたら、サイドパネル右上の♡を押します。赤い♥に変わると保存完了です。曲と打ち上げの順序・時刻が一緒に保存されます。',
 '「一覧」で別のお気に入りパネルを開きます。新しく組み直しても、保存した構成はそのまま残ります。',
 '曲名の右の「…」から「名前を変える」「削除する」を選べます。削除を間違えたら、直後の取り消しで戻せます。',
 'MRでの名前変更はいったんブラウザへ移ります。文字の直したい場所にカーソルを置いて編集・保存し、「MRに戻る」で一覧を開いた状態へ戻れます。'
 ],note:'お気に入りは、この端末のブラウザに保存されます。'},
 {id:'festival',title:'お気に入りで大会を作る',lead:'好きな曲と構成を並べて、自分だけの花火大会を作れます。',steps:[
 '「一覧」を開き、大会に入れる構成のチェックを付けます。',
 '行の左のつまみを掴んでドラッグします。曲と曲の間に出るバーが、離したときに入る場所です。',
 'チェックした行が、一覧の上から順に打ち上がります。MRでは「この順番で大会を開演」を押します。ブラウザでは「選んだ順で大会を準備」→「MRで観る」と進み、開演します。',
 '「このセットリストを保存する」で大会を残せます。「保存したセットリスト」から各大会の「…」→「名前を変える」で好きな名前を付けます。',
 '１曲の最後の花火と音の余韻が終わって約３秒後、次の曲へ自動で進みます。TCパネルの「前の曲」「次の曲」で曲を飛ばせます。'
 ],note:'チェックを付けた順ではなく、一覧に並べた順です。保存した大会は、保存時点の花火をそのまま再現します。新しい演出を入れるには曲を組み直して♥に保存し、新しいセットリストを作ります。'},
 {id:'program',title:'曲・雰囲気・組み直し',lead:'テンポは解析に任せて、曲の気持ちは自分で選べます。',steps:[
 '曲選択の横の「…」→「曲名を変える」で、数字のファイル名などを好きな曲名に直せます。再解析しても名前は残ります。MRではブラウザで編集し、「MRに戻る」で戻れます。',
 '同じ「…」の「曲を削除する」で曲一覧から外せます。直後の「曲の削除を元に戻す」で取り消せます。保存済みのお気に入り大会はそのまま観られます。',
 '「曲を選ぶ」で曲を選び、「曲調・構成」で雰囲気を選びます。「準備完了」の曲名・雰囲気・更新番号を確認して開演します。',
 '「プログラムを組み直す」で、同じ解析結果から別の打ち上げを作れます。普段は再解析し直す必要はありません。',
 '一緒に作った元のプログラムは「手作りの構成（オリジナル）」で観られます。「曲なしで上げる」なら音楽なしの大会です。',
 '再生位置・音楽音量・花火音量・部屋の明るさは、４本のスライダーで調整できます。'
 ],note:'解析からやり直したいときは、ブラウザの取り込み欄にある「この曲をQuestで再解析する」を使います。'},
 {id:'controls',title:'街とパネルの操作',lead:'街を置いてから、ゆっくり開演できます。',steps:[
 '街の台座へビームを合わせ、左右どちらかのグリップを押したまま動かし、離して置きます。ジオラマでは上下にも動かせます。',
 '台座を掴んだままスティックを倒すと、左右で回転、上下で街の大きさを変えられます。',
 '右Aでサイドパネル、左Xでクルッとパネルを出し入れします。右Bは花火の一時停止・再開です。',
 'パネルの白い棒は、トリガー／グリップのどちらでも掴んで移動できます。押したボタンを離すと、その場所に置けます。床に垂直のまま動かせます。掴んだままスティック左右で角度、上で奥へ、下で手前へ調整します。',
 '使い方の本文へビームを向け、スティック上下でスクロールできます。スクロール中は同じスティックで街を歩きません。',
 'TCパネルは左Xのクルッとパネルから開けます。右上の×で閉じられます。TCパネルには時刻と小さな玉名を表示します。10秒戻る／再生・一時停止／10秒送る、再生位置スライダーと、セットリストの前後の曲を使えます。'
 ],note:'手だけで操作するときは、右の人差し指でボタンに触れ、白い棒は親指と人差し指でつまんで動かします。'},
 {id:'views',title:'眺め方・自分で打ち上げる',lead:'左手のクルッとパネルから、橋・屋形船・屋上の花火席・ジオラマなどを選べます。',steps:[
 '左手のひらを上に返すか左Xでパネルを出し、眺め方を選びます。「TC・玉名」の表示もここで切り替えられます。',
 '屋上の花火席は、最初は迫力を楽しむ近い席です。屋上にいる時はクルッとパネルの屋上の一行が「近い席／全景の席」に変わり、花火を続けたまま移れます。どちらも赤色灯の上に用意した、柵付きの屋上の桟敷席です。スティックで椅子を離れると立った目線へ、椅子に戻ると座った目線へ、ゆっくり切り替わります。',
 '橋では左スティックで歩けます。屋形船は川をゆっくり往復し、花火を一時停止すると船も停まります。',
 '「花火大会」の下にある「トリガーに花火玉を仕込む」から種類・大きさ・配色を選び、「左／右トリガーに仕込む」を押します。ボタンの下に仕込んだ玉が表示されます。',
 '街へ向けてトリガーを押すと一発追加できます。火の点が飛び、着地点から上がります。パネルへ向けたトリガーはボタン選択になります。'
 ],note:'右コントローラーの先端でも、クルッとパネルへ直接タッチできます。'},
 {id:'offline',title:'保存とUSBなしでの鑑賞',lead:'取り込んだ曲・解析結果・お気に入りは、この端末のブラウザに保存されます。',steps:[
 'USBなしでページを開き直すには、通信できる間に「オフライン用に保存」を押し、「保存済み」と版番号が出るまで待ちます。',
 '今の版のページをブックマークします。ブックマークはページの住所、オフライン保存はアプリ本体と必要なデータの保存です。',
 '保存できたらUSBを抜き、タブを閉じ、ブックマークから開き直してMRで鑑賞できます。毎回の解析は要りません。',
 '入室時の案内は「次回から表示しない」で消せます。この使い方の「入室時の操作案内を表示」で再び有効にできます。'
 ],note:'別の端末へは自動同期されません。ブラウザのサイトデータを削除すると、取り込んだ曲やお気に入りも消えるのでご注意ください。'}
];
export function helpTopic(id){return HELP_TOPICS.find(t=>t.id===id)??HELP_TOPICS[0];}
// Pagination keeps every character available in MR without shrinking the text.
export function helpPages(topic,measure,maxWidth=724,maxRows=16){
 const paragraphs=[topic.lead,...topic.steps.map((s,i)=>`${i+1}. ${s}`),topic.note];
 const rows=[];
 for(const paragraph of paragraphs){if(!paragraph)continue;let line='';for(const char of paragraph){if(line&&measure(line+char)>maxWidth){rows.push(line);line='';}line+=char;}if(line)rows.push(line);rows.push('');}
 if(rows.at(-1)==='')rows.pop();const pages=[];for(let i=0;i<rows.length;i+=maxRows)pages.push(rows.slice(i,i+maxRows));return pages;
}
export function mountHelp(root){
 const doc=root.ownerDocument,make=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
 const preference=root.querySelector('#entryTipEnabled').closest('label');
 const label=make('label','知りたいことを選ぶ'),select=make('select');select.id='helpTopic';
 for(const topic of HELP_TOPICS){const option=make('option',topic.title);option.value=topic.id;select.append(option);}label.append(select);
 const content=make('article');content.id='helpContent';content.setAttribute('aria-live','polite');
 const render=()=>{const topic=helpTopic(select.value);content.replaceChildren(make('h3',topic.title),make('p',topic.lead));const list=make('ol');for(const step of topic.steps)list.append(make('li',step));content.append(list);if(topic.note){const note=make('p',topic.note);note.className='help-note';content.append(note);}if(topic.links){const links=make('div');links.className='help-links';for(const [title,url] of topic.links){const a=make('a',title+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}content.append(links);}};
 select.addEventListener('change',render);root.replaceChildren(make('h2','花火街の使い方'),label,content,preference);render();
}
