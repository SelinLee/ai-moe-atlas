# AI 萌え図鑑 · AI Moe Atlas

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

AI の擬人化キャラクターと作者を探し、作品ごとの利用条件を確認して素材をダウンロードできます。ブラウザ上でクレジット付きのアイコン、立ち絵、紹介カードも作れます。

[キャラクターと作者を探す](https://selinlee.github.io/ai-moe-atlas/ja/) · [素材パックを入手する](https://selinlee.github.io/ai-moe-atlas/ja/assets/) · [素材工房を開く](https://selinlee.github.io/ai-moe-atlas/ja/studio/)

<p>
  <a href="public/generated/rough-doodle-v1/openai/doodle-v1.png"><img src="public/generated/rough-doodle-v1/openai/preview.webp" width="96" alt="GPT"></a>
  <a href="public/generated/rough-doodle-v1/gemini/doodle-v1.png"><img src="public/generated/rough-doodle-v1/gemini/preview.webp" width="96" alt="Gemini"></a>
  <a href="public/generated/rough-doodle-v1/claude/doodle-v1.png"><img src="public/generated/rough-doodle-v1/claude/preview.webp" width="96" alt="Claude"></a>
</p>

上の3点は、ZipZipPipe による GPT・Gemini・Claude のキャラクターデザインをもとに AI で生成したイラストです。 [出典と利用条件](docs/DOODLE.ja.md)

## リソース一覧

| やりたいこと | リンク・使い方 |
| --- | --- |
| キャラクターや作者を探す | [キャラクター図鑑](https://selinlee.github.io/ai-moe-atlas/ja/)を AI 製品や画風で絞り込み、各項目から原作をたどれます。 |
| 素材を入手する | [素材ライブラリ](https://selinlee.github.io/ai-moe-atlas/ja/assets/)には原画像・加工記録・クレジットを含む ZIP が13組あります。利用前に[作品ごとの条件](RIGHTS.md)をご確認ください。 |
| アイコン・立ち絵・紹介カードを作る | [素材工房](https://selinlee.github.io/ai-moe-atlas/ja/studio/)で作品とレイアウトを選び、プレビューを確認してクレジット付きで書き出せます。自分の未公開作品はローカルで加工できます。[工房ガイド](docs/STUDIO.ja.md) |
| キャラクターの造形を調べる | [ちびキャラ三面図7点](https://selinlee.github.io/ai-moe-atlas/ja/chibi/)と[通常頭身・ちびキャラの設定資料6点](https://selinlee.github.io/ai-moe-atlas/ja/references/)を見比べられます。 |
| 同じ画風で描く | [落書き用プロンプト](docs/DOODLE.ja.md)に、コピー用テンプレートとキャラクターの特徴を記入する例があります。 |
| 出典を提供する | [既存の出典記録](content/sources/)を確認し、[投稿ガイド](docs/CONTRIBUTING.ja.md)に沿って原作のリンクや作者の声明をお寄せください。 |

## 収録の経緯と今後の調査項目

| 時期・状況 | 内容 |
| --- | --- |
| 2026-09-29 · 収録済み | AI 製品12種のうち11種で画像の閲覧・ダウンロードが可能に。Copilot は出典リンクのみ。[収録記録](docs/BASELINES.ja.md) |
| 2026-10 · 公開済み | 10月8日にキャラクター設定資料6点を収録。31日にちびキャラ三面図7点を公開しました。 |
| 2026-11-03 · 公開済み | キャラクターの落書き7点とプロンプトテンプレートを追加しました。 |
| 要調査 · Copilot | 作者公開の高解像度原画を探し、表示と再配布の条件を確認してから素材を収録します。[候補記録](docs/BASELINES.ja.md) |
| 要調査 · GLM の狐娘 | 動画 BV1iDeQ6fEFi から原案者をたどり、この姿の改変条件を確認します。[クレジット記録](docs/CHIBI.ja.md) |

## キャラクターギャラリー

<details>
<summary>キャラクターの落書き7点とプロンプト</summary>

2026年11月3日 · 既存の7キャラクターから生成した画風派生画像です。各画像は 1254 × 1254 の白背景・上半身。内蔵 image_gen を使い、現行ちびキャラ三面図の正面を形象の参照にしています。

<table>
  <tr>
    <td align="center" width="33%"><strong>GPT</strong><br><a href="public/generated/rough-doodle-v1/openai/doodle-v1.png"><img src="public/generated/rough-doodle-v1/openai/preview.webp" width="280" alt="GPT · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
    <td align="center" width="33%"><strong>Gemini</strong><br><a href="public/generated/rough-doodle-v1/gemini/doodle-v1.png"><img src="public/generated/rough-doodle-v1/gemini/preview.webp" width="280" alt="Gemini · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
    <td align="center" width="33%"><strong>Claude</strong><br><a href="public/generated/rough-doodle-v1/claude/doodle-v1.png"><img src="public/generated/rough-doodle-v1/claude/preview.webp" width="280" alt="Claude · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>DeepSeek</strong><br><a href="public/generated/rough-doodle-v1/deepseek/doodle-v1.png"><img src="public/generated/rough-doodle-v1/deepseek/preview.webp" width="280" alt="DeepSeek · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
    <td align="center" width="33%"><strong>Kimi</strong><br><a href="public/generated/rough-doodle-v1/kimi/doodle-v1.png"><img src="public/generated/rough-doodle-v1/kimi/preview.webp" width="280" alt="Kimi · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
    <td align="center" width="33%"><strong>Qwen 千問</strong><br><a href="public/generated/rough-doodle-v1/qwen/doodle-v1.png"><img src="public/generated/rough-doodle-v1/qwen/preview.webp" width="280" alt="Qwen 千問 · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>GLM</strong><br><a href="public/generated/rough-doodle-v1/glm/doodle-v1.png"><img src="public/generated/rough-doodle-v1/glm/preview.webp" width="280" alt="GLM · ラフな萌えキャラ落書き · プロンプトテンプレート"></a></td>
    <td align="center" colspan="2"><a href="docs/DOODLE.ja.md">コピー用テンプレート →</a></td>
  </tr>
</table>

既存のキャラクター資料に基づく画風派生画像です。管理者の依頼で GitHub に展示し、作品ごとの作者情報と利用条件を記録しています。

GPT・Gemini・Claude・Kimi・Qwen のコミュニティデザインは ZipZipPipe によります。DeepSeek の作者連鎖は上善无形 → ZipZipPipe。GLM の狐娘は動画 BV1iDeQ6fEFi に基づき、原デザインの作者は未確認です。

[コピー用テンプレート](docs/DOODLE.ja.md) · [ファイル、SHA-256、処理記録](public/generated/rough-doodle-v1/manifest.json)

</details>

<details>
<summary>ちびキャラ三面図7点</summary>

ai_video の7キャラクターを、正面・左側面・背面の三面図で紹介。Gemini・Kimi・Qwen は2026年10月29日更新の V2、それ以外は現行 V1 です。画像をクリックすると完全な PNG を表示します。

<table>
  <tr>
    <td align="center" width="50%"><strong>GPT · V1</strong><br><a href="public/generated/super-chibi-v1/openai/turnaround-v1.png"><img src="public/generated/super-chibi-v1/openai/preview.webp" width="480" alt="GPT · 三面図全体"></a></td>
    <td align="center" width="50%"><strong>Gemini · V2</strong><br><a href="public/generated/super-chibi-v1/gemini/turnaround-v2.png"><img src="public/generated/super-chibi-v1/gemini/preview.webp" width="480" alt="Gemini · 三面図全体"></a></td>
  </tr>
  <tr>
    <td align="center" width="50%"><strong>Claude · V1</strong><br><a href="public/generated/super-chibi-v1/claude/turnaround-v1.png"><img src="public/generated/super-chibi-v1/claude/preview.webp" width="480" alt="Claude · 三面図全体"></a></td>
    <td align="center" width="50%"><strong>DeepSeek · V1</strong><br><a href="public/generated/super-chibi-v1/deepseek/turnaround-v1.png"><img src="public/generated/super-chibi-v1/deepseek/preview.webp" width="480" alt="DeepSeek · 三面図全体"></a></td>
  </tr>
  <tr>
    <td align="center" width="50%"><strong>Kimi · V2</strong><br><a href="public/generated/super-chibi-v1/kimi/turnaround-v2.png"><img src="public/generated/super-chibi-v1/kimi/preview.webp" width="480" alt="Kimi · 三面図全体"></a></td>
    <td align="center" width="50%"><strong>Qwen 千問 · V2</strong><br><a href="public/generated/super-chibi-v1/qwen/turnaround-v2.png"><img src="public/generated/super-chibi-v1/qwen/preview.webp" width="480" alt="Qwen 千問 · 三面図全体"></a></td>
  </tr>
  <tr>
    <td align="center" width="50%"><strong>GLM · V1</strong><br><a href="public/generated/super-chibi-v1/glm/turnaround-v1.png"><img src="public/generated/super-chibi-v1/glm/preview.webp" width="480" alt="GLM · 三面図全体"></a></td>
    <td align="center"><a href="https://selinlee.github.io/ai-moe-atlas/ja/chibi/">三面図・出典・利用条件 →</a></td>
  </tr>
</table>

GPT・Gemini・Claude・Kimi・Qwen のコミュニティデザイン：ZipZipPipe。DeepSeek：上善无形 → ZipZipPipe。GLM の狐娘は動画 BV1iDeQ6fEFi に基づき、原デザインの作者は未確認です。

ai_video の生成派生三面図です。公式キャラクターや作者の原図ではありません。管理者の指定による展示で、上流の改変・再配布許可を新たに付与するものではなく、素材パックには含まれません。

[三面図・出典・利用条件](docs/CHIBI.ja.md) · [ファイルと処理記録](public/generated/super-chibi-v1/manifest.json)

</details>

<details>
<summary>以前の v5 形象資料 · 通常頭身とちびキャラ</summary>

ai_video の固定形象資料6枚。各画像に通常頭身とちびキャラを収録し、元の PNG・プロンプト・参照動画・作者情報・SHA-256 を保存しています。

| GPT | Gemini | Claude |
| --- | --- | --- |
| ![GPT](public/generated/ai-models-v5/openai-preview.webp) | ![Gemini](public/generated/ai-models-v5/gemini-preview.webp) | ![Claude](public/generated/ai-models-v5/claude-preview.webp) |
| DeepSeek | Kimi | Qwen |
| ![DeepSeek](public/generated/ai-models-v5/deepseek-preview.webp) | ![Kimi](public/generated/ai-models-v5/kimi-preview.webp) | ![Qwen 千問](public/generated/ai-models-v5/qwen-preview.webp) |

コミュニティのキャラクターデザイン：ZipZipPipe。DeepSeek 原作者：上善无形、二次デザイン：ZipZipPipe。生成ツール：内蔵 image_gen。

コミュニティのキャラクターを基にした生成派生資料で、公式キャラクター・作者の原図・細部の復元ではありません。管理者の指定によりホームに表示しますが、上流の改変・再配布許可を意味しません。保存済みの作者条件は引き続き適用されます。

[形象資料と出典](docs/REFERENCES.ja.md) · [ファイルと加工記録](public/generated/ai-models-v5/manifest.json)

</details>

<details>
<summary>15秒の操作デモ</summary>

![実際の絞り込み結果（出典索引のみ・第三者の作品画像なし）](public/demo/discovery-ja.png)

[15秒の操作デモ · MP4](public/demo/discovery-ja.mp4)

ローカル Chrome の実画面を各3秒ずつ表示する5ステップ：スタイルで絞る → 製品を選ぶ → 検索してリンクをコピー → 結果を開き直す → 項目を確認。出典リンクのみの項目を使用し、第三者の作品画像は含みません。書き出し全体のチュートリアルではありません。

</details>

## 利用条件と出典

上善无形の Bilibili 投稿、Small-tailqwq/dsh-deep-whale、[ZipZipPipe 本人の Pixiv 作品集](https://www.pixiv.net/artworks/148186519)から収集。従来の3組は **CC BY-NC-SA 4.0**。追加の GPT・Gemini・Claude・Kimi・Qwen・GLM・Grok・豆包・Llama・MiniMax の10組は作者の **クレジット必須・非商用** 条件に従い、DeepSeek の CC 許諾とは区別します。コードの MIT は第三者の画像には適用されません。

作者が公開した高解像度原図を優先します。入手できない場合、収集した参照画像を基に同一の姿を保つ派生画像を生成できますが、作者・出典・加工履歴を保持し、生成派生物として別途明記します。作者の原図や復元された細部とは表記しません。工房に生成処理は組み込んでいません。上流の許諾を拡大せず、無関係なキャラクターや設定の創作も認めません。

## 維持・更新

- [素材工房ガイド](docs/STUDIO.ja.md)
- [投稿ガイド](docs/CONTRIBUTING.ja.md)
- [収集マニュアル](docs/COLLECTION.ja.md)
- [素材の利用条件](RIGHTS.md)
- [出典記録](content/sources/)・[Bilibili 調査候補](content/leads.json)
- [プロジェクトの制約](AGENTS.md)

三言語の項目は `content/characters.json`、原図・根拠・加工結果は `public/collected/`、素材集は `public/packs/` に保存。原本は上書きせず、GitHub ファイルはコミットに固定し、派生ファイルから親原図の SHA-256 を参照します。

main への push で検証・テスト・ビルド・GitHub Pages 公開を実行。PR はビルドのみです。ローカルサーバー起動後、`npm run test:browser` で Chrome テストを実行できます。

## 起動

Node.js 22.12 以上（24 推奨）と npm が必要です。

```sh
npm ci
npm run dev
# http://localhost:4321/ai-moe-atlas/ja/
npm test
npm run build
```

## 収集・規格統一

```sh
npm run discover -- --platform bilibili --query '蓝色大肥鱼' --limit 20
npm run discover -- --platform github --query 'AI mascot' --limit 20
# content/sources/*.json の出典・美術利用条件を確認してから実行
npm run collect
npm run assets
npm run validate
```

Bilibili 検索はインストール済み Google Chrome の独立セッションを使用。確認画面が必要な場合は `--visible` を追加します。個人のブラウザプロファイルは使用しません。GitHub 検索にはログイン済みの `gh` が必要です。

**1024 px 版はリサイズ・補間の出力であり、細部を復元したものではありません。** 作者の高解像度原図を優先します。ニューラル超解像、生成型修復、自動背景除去は未実装。元の構図全体を保持します。

## 対応範囲

出典索引への掲載はダウンロード許可を意味しません。Bilibili の 9 種の AI 形象を索引化し、GPT・Gemini・Claude・Kimi・Qwen・GLM・Grok・豆包・Llama・MiniMax は作者の個別高解像度原画像を収集済みです。ペットアニメーション、動画のコマ抽出、自動切り抜き、AI 超解像は本版に含みません。数合わせのために形象を創作してはいけません。

[各 AI の画像収集と再利用の確認記録](docs/BASELINES.ja.md)
