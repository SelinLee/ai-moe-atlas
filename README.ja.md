# AI 萌え図鑑 · AI Moe Atlas

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

ネット上に存在する AI マスコット、擬人化キャラクター、ミニキャラと素材を収集する図鑑です。原作者、元の公開ページ、加工履歴を保持します。

**収集・出典確認・高解像度原図の取得・規格統一・素材化のみを行います。本プロジェクトのために新しいキャラクター、設定、表情、ポーズは創作しません。**

[日本語の図鑑](https://selinlee.github.io/ai-moe-atlas/ja/) · [素材](https://selinlee.github.io/ai-moe-atlas/ja/assets/) · [素材工房](https://selinlee.github.io/ai-moe-atlas/ja/studio/) · [収集フロー](https://selinlee.github.io/ai-moe-atlas/ja/collection/)

## 初版

- 中国語・英語・日本語の UI と項目。出典付き 24 項目、AI 製品・シリーズ 12 種の索引。
- ダウンロード可能な 3 組、原本 9 枚、規格統一版 36 ファイル。その他は出典リンクのみ掲載。
- 原図、512 px PNG/WebP、256 px アイコン、1024 px 補間版、出典記録、利用条件を同梱。
- ブラウザ内で余白・寸法・背景・縦横比・形式を調整。画像・原図・出典記録を ZIP で保存。画像のアップロードは行いません。
- Bilibili と GitHub の検索結果は確認待ち一覧へ保存し、自動公開しません。

配布画像は上善无形の Bilibili 原投稿および Small-tailqwq/dsh-deep-whale の既存素材から収集。現在の 3 組は **CC BY-NC-SA 4.0、非営利利用のみ**です。コードの MIT ライセンスは第三者の画像には適用されません。

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

## 維持・更新

- [投稿ガイド](docs/CONTRIBUTING.ja.md)
- [収集マニュアル](docs/COLLECTION.ja.md)
- [素材の利用条件](RIGHTS.md)
- [出典記録](content/sources/)・[Bilibili 調査候補](content/leads.json)
- [プロジェクトの制約](AGENTS.md)

三言語の項目は `content/characters.json`、原図・根拠・加工結果は `public/collected/`、素材集は `public/packs/` に保存。原本は上書きせず、GitHub ファイルはコミットに固定し、派生ファイルから親原図の SHA-256 を参照します。

main への push で検証・テスト・ビルド・GitHub Pages 公開を実行。PR はビルドのみです。ローカルサーバー起動後、`npm run test:browser` で Chrome テストを実行できます。

## 対応範囲

出典索引への掲載はダウンロード許可を意味しません。Bilibili の 9 種の AI 形象は索引を作成済みですが、個別原画像と利用条件は確認待ちです。ペットアニメーション、動画のコマ抽出、自動切り抜き、AI 超解像は本版に含みません。数合わせのために形象を創作してはいけません。
