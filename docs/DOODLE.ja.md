# ラフな萌えキャラ落書き · プロンプトテンプレート

[中文](DOODLE.zh.md) · [English](DOODLE.en.md) · [日本語](DOODLE.ja.md)

2026年11月3日 · 既存の7キャラクターから生成した画風派生画像です。各画像は 1254 × 1254 の白背景・上半身。内蔵 image_gen を使い、現行ちびキャラ三面図の正面を形象の参照にしています。

## コピー用テンプレート

キャラクターの参考画像を添付し、以下の全文をコピーして末尾の {{プレースホルダー}} を具体的な特徴に置き換えてください。左右で異なる瞳、編み髪、帽子などは、画面の左・右を明記します。

```text
Use case: style-transfer.
入力画像はキャラクターの形象を確認する資料です。正面のキャラクター1人だけを上半身で描いてください。

参考画像のキャラクターを、非常に気軽でラフ、素朴で幼い日本の萌えアニメ風デジタル落書きに変換してください。一般的なペイントソフトの粗いクレヨンやマーカーブラシで素早く描いた質感にします。髪型、髪色、顔立ち、服装、アクセサリー、特徴的な表情を保ってください。

線画
- はっきりした粗い黒の筆致を使い、線幅を大きくばらつかせます。急に太くなる部分や途切れを含めます。
- 輪郭はゆるく、不正確で、少し傾いた形にします。手描きの粒子とこすれを残します。
- 線のずれ、重なり、描き残しを許容し、精密で滑らかなベクター線を避けます。

色
- 広い面を不透明な単純なベタ塗りで埋めます。
- 輪郭からのはみ出し、塗り残し、小さな白い隙間を残します。
- 影は少量の灰色か同系色の暗い粗い線だけにします。
- ハイライトは短く気軽な白い筆致にします。
- クレヨン、パステル、マーカーを混ぜた粗い質感を保ちます。複雑なグラデーション、精密な陰影、多層の色を避けます。

顔
- 元の瞳の色、目の形、特徴的な表情を保ちます。
- 目は太い黒線と単純な色面で簡略化します。
- 口は簡単に描き、鼻は省略可能です。
- 頬に少量のラフなピンクの線を加えても構いません。キャラクターの性格や雰囲気を保ちます。

髪と服
- 最も特徴的な髪型と髪色を保ちます。
- 髪は少数の大きな色面で構成し、細かな毛束を大量に描きません。
- 服装の元の色、シルエット、特徴的な装飾を保ちます。
- しわや装飾は大幅に簡略化し、参考画像の服とアクセサリーを使います。

構図
- 1対1の正方形キャンバスに、1人の上半身を中央配置します。頭は少し大きめにします。
- 自然な白い余白を残します。
- 背景は純白。文字、複雑な場面、装飾枠を追加しません。

仕上がりはラフで走り描きらしく、単純で素朴にしてください。低い完成度、太い黒い輪郭、大きなベタ塗り、気軽な白いハイライト、明確なクレヨン粒子を重視します。自動的な描き込み、精密な線、複雑な髪、繊細なグラデーション、3D効果、過剰な陰影、追加の衣装細部を避けます。

角、耳、帽子は画面内に収めます。筆数を減らし、髪は少数のかたまり、服の装飾は識別に必要な数筆にまとめます。2色の髪は別々のベタ塗り面で表現します。タイトル、署名、透かし、浮いた文字を追加しません。

参考画像に合わせて形象を固定
キャラクター {{キャラクター名}}
髪 {{髪型、髪色、色分け}}
瞳と表情 {{瞳の色、画面左右の対応、特徴的な表情}}
服装と装飾 {{元の配色、重要な装飾、画面左右の位置}}
必須の識別点 {{特徴を3～5項目}}
```

## 生成画像と実際のプロンプト

上記は再利用用テンプレートです。以下の TXT は、各キャラクターの識別情報を含む、今回実際に使った中国語プロンプトです。英語と日本語のテンプレートは対応する翻訳です。

| キャラクター | 完全な PNG | 実際のプロンプト | 入力資料 | 利用条件の記録 |
| --- | --- | --- | --- | --- |
| GPT | [画像を開く](../public/generated/rough-doodle-v1/openai/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/openai/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/openai/turnaround-v1.png) | 改変許可未確認 |
| Gemini | [画像を開く](../public/generated/rough-doodle-v1/gemini/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/gemini/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/gemini/turnaround-v2.png) | 改変許可未確認 |
| Claude | [画像を開く](../public/generated/rough-doodle-v1/claude/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/claude/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/claude/turnaround-v1.png) | 改変許可未確認 |
| DeepSeek | [画像を開く](../public/generated/rough-doodle-v1/deepseek/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/deepseek/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/deepseek/turnaround-v1.png) | CC-BY-NC-SA-4.0 |
| Kimi | [画像を開く](../public/generated/rough-doodle-v1/kimi/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/kimi/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/kimi/turnaround-v2.png) | 改変許可未確認 |
| Qwen 千問 | [画像を開く](../public/generated/rough-doodle-v1/qwen/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/qwen/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/qwen/turnaround-v2.png) | 改変許可未確認 |
| GLM | [画像を開く](../public/generated/rough-doodle-v1/glm/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/glm/prompt.txt) | [固定バージョン](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/glm/turnaround-v1.png) | 作者・許可未確認 |

## 作者、出典、利用条件

GPT・Gemini・Claude・Kimi・Qwen のコミュニティデザインは ZipZipPipe によります。DeepSeek の作者連鎖は上善无形 → ZipZipPipe。GLM の狐娘は動画 BV1iDeQ6fEFi に基づき、原デザインの作者は未確認です。

DeepSeek は CC BY-NC-SA 4.0 の表示、非商用、継承の条件を維持します。ZipZipPipe のほかの5キャラクターは改変許可が未確認で、GLM の作者と許可も確認待ちです。各作品の状態と証拠の場所は記録ファイルに保存しています。今回の7枚は管理者の依頼による展示です。展示依頼は上流の新たな権利を付与しません。素材パックには従来の作品ごとの用途確認を適用します。

精密な線や多層の陰影を、粗い黒線、大きな色面、クレヨンの粒子に変え、元の配色、表情、主な装飾を保っています。文字を加えない指定に合わせ、Kimi の本の K と GLM の髪飾りの Z は省略しています。プレビューは縦横比を維持した WebP 変換で、PNG は生成時のバイトを保存しています。

[作者の画像集](https://www.pixiv.net/artworks/148186519) · [DeepSeek 原キャラクターの出典](https://www.bilibili.com/opus/1231977657712771073)

[実際の共通画風プロンプト](../public/generated/rough-doodle-v1/style-prompt.txt) · [ファイル、SHA-256、処理記録](../public/generated/rough-doodle-v1/manifest.json)
