# My花火街 1.2.76

[Quest・ブラウザで開く](https://141shigekazu-alt.github.io/hanabi-town/?build=1.2.76)

自分の曲から花火大会を作り、Questの部屋に小さな街を置いて鑑賞できます。曲の取り込み・解析と♥お気に入りの保存は、その端末のブラウザ内で行います。取り込んだ曲をサイトへアップロードする処理はありません。

「別の組み合わせで作り直す」で、伝統玉中心／ポップ・キャンディー中心／創造花火中心／いろんな玉の競演、色の方向、見せ方を変えます。蝶・惑星・鼓と、花畑・海・水田を組み合わせます。海に惑星、花畑に蝶という傾向はありますが、意外な組み合わせも現れます。♥保存した大会は、保存時の構成で再生できます。

既存の公開４曲を同梱。手元の曲は「曲を取り込む」から追加できます。アプリ内の「オフライン用に保存」で、街・花火・同梱４曲を保存してください。通信できる状態で保存完了を確認し、Wi-Fiを切って一度試してください。ブラウザのサイトデータを消すと、取り込み曲やお気に入りも消えるのでご注意ください。

Macで公開版の起動・構成・保存処理を確認しています。1.2.76のQuest実機確認はこれからです。

## 使用ライブラリとモデル

- Three.js: MIT。`vendor/LICENSE`を同梱。
- ONNX Runtime: MIT。`vendor/ort/LICENSE.txt`を同梱。
- LinkSeg Web: MIT。`vendor/linkseg/LICENSE.txt`を同梱。
- LinkSegモデル: CC-BY-4.0。M. Buisson, B. McFee, S. Essid, *Using Pairwise Link Prediction and Graph Attention Networks for Music Structure Analysis*, ISMIR 2024。出典と変換内容は`models/LinkSeg-model-card.md`に保存。
