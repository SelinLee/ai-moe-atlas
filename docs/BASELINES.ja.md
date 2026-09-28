# 各 AI の標準表示用キャラクター

[中文](BASELINES.zh.md) · [English](BASELINES.en.md)

各 AI について、出典が明確で表示できる既存画像をまず一枚集めてから、素材を増やします。サイトの標準表示は公式・唯一・広く認定されたデザインという意味ではありません。

2026-09-29 時点：12 種の AI のうち、11 種は表示・ダウンロード可能、1 種（Copilot）は出典リンクのみです。リンクだけでは画像の収集完了に数えません。

| AI | 優先候補 | 残りの作業 |
| --- | --- | --- |
| DeepSeek | 収集済みクジラ娘メイド素材 | 利用可能。上善无形 → ZipZipPipe → Small-tailqwq のクレジットを保持 |
| GPT・Gemini・Claude・Kimi・Qwen | ZipZipPipe 本人の Pixiv 作品集 | 高解像度原画像5枚と作者の条件を収集済み |
| GLM・Grok・MiniMax | ZipZipPipe 本人の Pixiv 作品集 | 高解像度原画像3枚と作者の条件を収集済み |
| 豆包 | ZipZipPipe 本人の Pixiv 作品集 | 高解像度原画像を収集済み。OpenPet 候補は出典のみ |
| Meta Llama | ZipZipPipe 本人の Pixiv 作品集 | リャマ形象の高解像度原画像を収集済み |
| Copilot | yamamemo 候補 | 画像の利用条件。現在は出典のみ |

## 作品集のページ対応

「AI娘化」全 17 枚を照合し、うち 10 枚を収集しました：3 枚目 Claude、4 枚目 GPT、5 枚目 Gemini、6 枚目 Kimi、7 枚目 GLM、8 枚目 Grok、11 枚目 豆包（Seed）、13 枚目 Qwen、14 枚目 Llama、16 枚目 MiniMax。ほかに DeepSeek が 2 枚、索引外のキャラクターが 4 枚（Mistral・文心一言、RWKV のタグを持つ 1 枚など）ありますが、当サイトの索引に存在しない AI のため収集していません。

同定の根拠は、図中の標識（GLM の「Z」、Grok の X 字大斧、豆包の SEED、Llama のリャマ耳・尾と「∞」、MiniMax の巻き貝と MINIMAX 表記）、作者が「大AI和小AI们」の説明で示した 9 種の順序、知乎・百度貼吧の公開整理記事です。公開整理はページ番号の照合のみに用い、権利の根拠とはしません。

## ai_video の資料の再利用

`characters/assets/ai-models-v5/README.md`、`registry.json`、6 枚の設定参考画像の生成記録、GPT の参考画像と、`projects/tech_report_v2-2026-09-28/work/raw/ai-cast-references/` の対応するスクリーンショットを確認しました。

- 再利用した情報：6 種の AI の対応関係、確認できる外見、動画の出典、作者への手がかり。既存項目に追加し、重複登録はしていません。
- ローカル保存：照合用スクリーンショットと SHA-256。プレーヤー、字幕、コメントを含むため作者の個別原画像とは区別し、素材として公開していません。
- 原画像として収集しないもの：6 枚の `*-reference.png`。記録には image_gen で通常版と新しいミニ版を生成したと明記されています。比較すると衣装の細部・構図・ポーズが変化しており、単なる高解像度化や規格統一ではありません。

[各AI娘形象盘点](https://www.bilibili.com/video/BV14phK66Ejw/)の画像で GPT・Gemini・Claude・Kimi・Qwen を照合でき、ZipZipPipe が出典として記載されています。[蓝色大肥鱼是怎么来的？](https://www.bilibili.com/video/BV1Brtc63EyW/)は DeepSeek の由来調査の手がかりです。[让你别找千问外包，没让你找克劳德啊！](https://www.bilibili.com/video/BV12yeU6KEUt/)の保存テキストも ZipZipPipe に言及しています。これらは個々の作品の利用許可の代わりにはなりません。

## 収集の順序

1. 完了：GPT・Gemini・Claude・Kimi・Qwen・GLM・Grok・豆包・Llama・MiniMax の作者公開原画像を Pixiv から収集しました。
2. Copilot について、表示・再配布が許可された原画像を探します。現在は出典リンクのみです。
3. 未収集の Mistral・文心一言などは保留します。`entities.json` に存在しない AI であり、数を合わせるための索引拡張は行いません。
4. 既存デザイン、AI との対応、原出典、作品ごとの条件、原画像のハッシュ、3 言語の説明を確認してから、縦横比を保った規格統一画像と出典付き素材集を作成します。

候補：[baselines.json](../content/baselines.json)。照合記録：[ai-video-2026-09-28.json](../content/research/ai-video-2026-09-28.json)。同定の照合：[leads.json](../content/leads.json)。収集済みファイルから完了状態を判定し、リンクのみの項目を手動で完了扱いにはしません。

## 高解像度原画像を確認

[ZipZipPipe「AI娘化」](https://www.pixiv.net/artworks/148186519)：Claude は3枚目、GPT は4枚目、Gemini は5枚目、Kimi は6枚目、GLM は7枚目、Grok は8枚目、豆包 は11枚目、Qwen は13枚目、Llama は14枚目、MiniMax は16枚目。GLM と Kimi は 1152 × 2048、残りの8枚は 3072 × 5504。白背景の JPG 原本・バイト列・掲載番号・公開日・作者条件・SHA-256 を保存。作品情報では作者の AI 使用が明示され、当サイトによる描き直しはありません。

高解像度原画像が見つからない場合は、収集資料から固定描写を生成し、別途明記することがユーザーにより許可されています。今回は10枚とも原画像が見つかり、生成は不要でした。上記 ai_video の確認は原画像発見前の記録です。
