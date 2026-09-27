# 各 AI の標準表示用キャラクター

[中文](BASELINES.zh.md) · [English](BASELINES.en.md)

各 AI について、出典が明確で表示できる既存画像をまず一枚集めてから、素材を増やします。サイトの標準表示は公式・唯一・広く認定されたデザインという意味ではありません。

2026-09-28 時点：12 種の AI のうち、1 種は表示・ダウンロード可能、10 種は出典候補あり、1 種は候補なし。リンクだけでは画像の収集完了に数えません。

| AI | 優先候補 | 残りの作業 |
| --- | --- | --- |
| DeepSeek | 収集済みクジラ娘メイド素材 | 利用可能。上善无形 → ZipZipPipe → Small-tailqwq のクレジットを保持 |
| GPT・Gemini・Claude・Kimi・Qwen | ai_video のスクリーンショットで外見を照合した ZipZipPipe 系列 | 個別の原画像と利用条件 |
| Grok・GLM・MiniMax | ZipZipPipe の「大AI和小AI们」 | 個別の外見確認・原画像・利用条件 |
| 豆包 | OpenPet 候補 | 表示・改変・再配布可能な版を探す。現在は出典のみ |
| Copilot | yamamemo 候補 | 画像の利用条件。現在は出典のみ |
| Meta Llama | 候補なし | 別プロジェクトの llama.cpp マスコットと混同しない |

## ai_video の資料の再利用

`characters/assets/ai-models-v5/README.md`、`registry.json`、6 枚の設定参考画像の生成記録、GPT の参考画像と、`projects/tech_report_v2-2026-09-28/work/raw/ai-cast-references/` の対応するスクリーンショットを確認しました。

- 再利用した情報：6 種の AI の対応関係、確認できる外見、動画の出典、作者への手がかり。既存項目に追加し、重複登録はしていません。
- ローカル保存：照合用スクリーンショットと SHA-256。プレーヤー、字幕、コメントを含むため作者の個別原画像とは区別し、素材として公開していません。
- 原画像として収集しないもの：6 枚の `*-reference.png`。記録には image_gen で通常版と新しいミニ版を生成したと明記されています。比較すると衣装の細部・構図・ポーズが変化しており、単なる高解像度化や規格統一ではありません。

[各AI娘形象盘点](https://www.bilibili.com/video/BV14phK66Ejw/)の画像で GPT・Gemini・Claude・Kimi・Qwen を照合でき、ZipZipPipe が出典として記載されています。[蓝色大肥鱼是怎么来的？](https://www.bilibili.com/video/BV1Brtc63EyW/)は DeepSeek の由来調査の手がかりです。[让你别找千问外包，没让你找克劳德啊！](https://www.bilibili.com/video/BV12yeU6KEUt/)の保存テキストも ZipZipPipe に言及しています。これらは個々の作品の利用許可の代わりにはなりません。

## 収集の順序

1. 照合済みの GPT・Gemini・Claude・Kimi・Qwen から、作者が公開した個別原画像を探します。
2. Grok・GLM・MiniMax の外見を照合し、原画像と適用条件を確認します。
3. 豆包・Copilot の公開可能な版を探し、Meta Llama の形象も調査します。
4. 既存デザイン、AI との対応、原出典、作品ごとの条件、原画像のハッシュ、3 言語の説明を確認してから、縦横比を保った規格統一画像と出典付き素材集を作成します。

候補：[baselines.json](../content/baselines.json)。照合記録：[ai-video-2026-09-28.json](../content/research/ai-video-2026-09-28.json)。収集済みファイルから完了状態を判定し、リンクのみの項目を手動で完了扱いにはしません。
